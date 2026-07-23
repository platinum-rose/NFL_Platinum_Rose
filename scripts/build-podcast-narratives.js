#!/usr/bin/env node
// Build offline, episode-level NFL podcast narrative summaries from local
// podcast-host-summary vault notes. No database, model, or API calls.

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_VAULT = 'E:\\data\\Obsidian\\NFL\\Podcasts';
const VAULT_ROOT = argValue('--vault', process.env.PODCAST_VAULT_ROOT || DEFAULT_VAULT);
const OUT_DIR = path.resolve(ROOT, argValue('--out', 'docs/podcast-narratives'));

function argValue(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/â€”/g, '-')
    .replace(/Â·/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'episode';
}

function htmlEsc(value) {
  return String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function mdCell(value) {
  return cleanText(value).replace(/\|/g, '\\|') || '-';
}

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return {};
  const end = text.indexOf('\n---', 3);
  if (end < 0) return {};
  const fm = {};
  for (const line of text.slice(3, end).split('\n')) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) fm[m[1].trim()] = cleanText(m[2]).replace(/^"|"$/g, '');
  }
  return fm;
}

function sectionText(text, heading) {
  const re = new RegExp(`^## ${heading}\\s*$`, 'mi');
  const m = re.exec(text);
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(/^##\s+/m);
  return next >= 0 ? rest.slice(0, next).trim() : rest.trim();
}

function splitMarkdownRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cleanText);
}

function parseFutures(text) {
  const sec = sectionText(text, 'Futures discussed');
  const rows = [];
  let headers = null;
  for (const line of sec.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = splitMarkdownRow(line);
    if (cells.every((c) => /^-+$/.test(c))) continue;
    if (cells.includes('Market') && cells.includes('Subject')) {
      headers = cells;
      continue;
    }
    if (!headers || cells.length < headers.length) continue;
    const row = Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']));
    if (row.Market && row.Subject) rows.push(row);
  }
  return rows;
}

function parseQuotes(text) {
  const sec = sectionText(text, 'Quotes');
  const out = [];
  for (const line of sec.split('\n')) {
    const m = line.match(/^-\s+\*\*(.+?)\*\*:\s+"?(.+?)"?\s*$/);
    if (m) {
      const subject = cleanText(m[1]);
      const time = subject.match(/\((\d{1,2}:\d{2}(?::\d{2})?)\)$/);
      out.push({
        subject: time ? cleanText(subject.replace(/\s*\([^)]*\)$/, '')) : subject,
        timestamp: time ? time[1] : null,
        quote: cleanText(m[2]).replace(/^"|"$/g, ''),
      });
    }
  }
  return out;
}

async function listMarkdownFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listMarkdownFiles(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

function episodeKey(note) {
  return [note.show, note.pub_date, note.title].map((v) => cleanText(v).toLowerCase()).join('|');
}

function displayMarket(market) {
  return cleanText(market).replace(/_/g, ' ');
}

function directionLabel(lean) {
  const l = cleanText(lean).toLowerCase();
  if (l === 'over') return 'Over';
  if (l === 'under') return 'Under';
  if (l === 'favor') return 'Back';
  if (l === 'against') return 'Fade';
  if (l === 'neutral') return 'Neutral';
  return lean || 'Lean';
}

function normalizeHostName(show, host, title = '') {
  const showName = cleanText(show).toLowerCase();
  const hostName = cleanText(host);
  const titleName = cleanText(title).toLowerCase();
  if (hostName.toLowerCase() !== 'guest') return hostName || 'Unknown';

  // Safe offline corrections for legacy host-summary notes that used "Guest"
  // before diarized host extraction was consistently available.
  if (showName === 'sharp or square') return 'Simon Hunter';
  if (showName === 'even money' && titleName.includes('warren sharp')) return 'Warren Sharp';
  if (showName === 'even money') return 'Ross Tucker';
  if (showName === 'the favorites' && titleName.includes('sean koerner')) return 'Sean Koerner';
  if (showName === 'the favorites' && titleName.includes('david bockino')) return 'David Bockino';
  if (showName === 'the favorites' && titleName.includes('david chao')) return 'David Chao';

  return hostName || 'Unknown';
}

function pickStrength(row) {
  const text = `${row.Prediction || ''} ${row['Stats cited'] || ''}`.toLowerCase();
  let score = Number(row.Conf || 0);
  if (/\bbest\b|\bfavorite\b|\blove\b|\bhammer|\brecommend|\bwager|\balready hit|\bfor sure|\bput aside/.test(text)) score += 20;
  if (/\bplus\b|\b\d+\s*to\s*1\b|\+\d+/.test(text)) score += 4;
  return score;
}

function narrativeForEpisode(ep) {
  const hosts = ep.hosts.map((h) => h.host);
  const futures = ep.hosts.flatMap((h) => h.futures.map((f) => ({ ...f, host: h.host })));
  const markets = [...new Set(futures.map((f) => displayMarket(f.Market)).filter(Boolean))];
  const subjects = [...new Set(futures.map((f) => cleanText(f.Subject)).filter(Boolean))];
  const overs = futures.filter((f) => ['over', 'favor'].includes(cleanText(f.Lean).toLowerCase())).length;
  const unders = futures.filter((f) => ['under', 'against'].includes(cleanText(f.Lean).toLowerCase())).length;
  const strongest = [...futures].sort((a, b) => pickStrength(b) - pickStrength(a)).slice(0, 10);

  const focus = markets.length
    ? `The NFL discussion centered on ${markets.slice(0, 6).join(', ')}${markets.length > 6 ? ', and related futures markets' : ''}.`
    : 'The local note did not extract any NFL futures markets.';
  const tilt = futures.length
    ? `Across ${futures.length} extracted NFL futures, the lean mix was ${overs} back/over, ${unders} fade/under, and ${Math.max(0, futures.length - overs - unders)} neutral or unclear.`
    : 'No NFL futures were extracted from this episode-level aggregation.';
  const subjectLine = subjects.length
    ? `Teams/players discussed included ${subjects.slice(0, 14).join(', ')}${subjects.length > 14 ? ', and others' : ''}.`
    : '';

  return {
    overview: [focus, tilt, subjectLine].filter(Boolean).join(' '),
    bestBets: strongest,
    hosts,
  };
}

function sourceLink(file) {
  return pathToFileURL(file).href;
}

function renderMarkdown(ep) {
  const n = narrativeForEpisode(ep);
  const sourceRows = ep.hosts.map((h) => `- ${h.host}: ${h.futures.length} extracted NFL futures, attribution ${h.attribution_method || 'unknown'} ([source note](${sourceLink(h.file)}))`);
  const bestRows = n.bestBets.map((p) => {
    const stats = cleanText(p['Stats cited']);
    const time = cleanText(p.Time) ? ` (${cleanText(p.Time)})` : '';
    const extra = stats ? ` Reason/data cited: ${stats}.` : '';
    return `- **${p.host}**${time}: ${directionLabel(p.Lean)} ${mdCell(p.Subject)} in ${mdCell(displayMarket(p.Market))} - ${mdCell(p.Prediction)}.${extra}`;
  });
  const tableRows = ep.hosts.flatMap((h) => h.futures.map((f) =>
    `| ${mdCell(h.host)} | ${mdCell(displayMarket(f.Market))} | ${mdCell(f.Subject)} | ${mdCell(directionLabel(f.Lean))} | ${mdCell(f.Prediction)} | ${mdCell(f.Conf)} | ${mdCell(f.Time)} | ${mdCell(f['Stats cited'])} |`
  ));
  const quotes = ep.hosts.flatMap((h) => h.quotes.slice(0, 12).map((q) => `- **${h.host} on ${q.subject}${q.timestamp ? ` (${q.timestamp})` : ''}:** "${mdCell(q.quote)}"`));

  return `# ${ep.show} - ${ep.title}

*Published: ${ep.pub_date} - Generated from offline podcast host-summary vault notes.*

## Narrative Summary

${n.overview}

## Diarized Experts

${sourceRows.join('\n') || '- None found.'}

## Best Bets / Clear Leans

${bestRows.join('\n') || '- None extracted.'}

## NFL Futures Discussed

| Expert | Market | Subject | Lean | Prediction | Conf | Time | Data Cited |
|---|---|---|---|---|---:|---|---|
${tableRows.join('\n') || '| - | - | - | - | - | - | - | - |'}

## Representative Quotes

${quotes.join('\n') || '- None extracted.'}
`;
}

function renderHtmlPage(ep, mdFileName) {
  const n = narrativeForEpisode(ep);
  const best = n.bestBets.map((p) => `<li><b>${htmlEsc(p.host)}</b>${p.Time ? ` <span class="muted">(${htmlEsc(p.Time)})</span>` : ''}: ${htmlEsc(directionLabel(p.Lean))} ${htmlEsc(p.Subject)} in ${htmlEsc(displayMarket(p.Market))} - ${htmlEsc(p.Prediction)}${p['Stats cited'] ? `<span class="muted"> Reason/data cited: ${htmlEsc(p['Stats cited'])}.</span>` : ''}</li>`).join('');
  const experts = ep.hosts.map((h) => `<li><b>${htmlEsc(h.host)}</b>: ${h.futures.length} extracted NFL futures, attribution ${htmlEsc(h.attribution_method || 'unknown')} <a href="${htmlEsc(sourceLink(h.file))}">source note</a></li>`).join('');
  const rows = ep.hosts.flatMap((h) => h.futures.map((f) => `<tr><td>${htmlEsc(h.host)}</td><td>${htmlEsc(displayMarket(f.Market))}</td><td>${htmlEsc(f.Subject)}</td><td>${htmlEsc(directionLabel(f.Lean))}</td><td>${htmlEsc(f.Prediction)}</td><td>${htmlEsc(f.Conf)}</td><td>${htmlEsc(f.Time)}</td><td>${htmlEsc(f['Stats cited'])}</td></tr>`)).join('');
  const quotes = ep.hosts.flatMap((h) => h.quotes.slice(0, 12).map((q) => `<li><b>${htmlEsc(h.host)} on ${htmlEsc(q.subject)}${q.timestamp ? ` <span class="muted">(${htmlEsc(q.timestamp)})</span>` : ''}:</b> "${htmlEsc(q.quote)}"</li>`)).join('');
  return `<!doctype html><meta charset="utf-8"><title>${htmlEsc(ep.show)} - ${htmlEsc(ep.title)}</title>
<style>
body{font-family:Inter,Segoe UI,Arial,sans-serif;max-width:1100px;margin:28px auto;padding:0 18px;color:#172033;line-height:1.45}
a{color:#2457c5}h1{margin-bottom:4px}.sub,.muted{color:#667085}section{margin:24px 0}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #d8dee8;padding:6px 8px;vertical-align:top}th{background:#f3f6fb;text-align:left}
li{margin:6px 0}.pill{display:inline-block;background:#eef2ff;color:#3730a3;border-radius:999px;padding:2px 8px;font-size:12px;margin-right:5px}
</style>
<h1>${htmlEsc(ep.show)} - ${htmlEsc(ep.title)}</h1>
<div class="sub">Published ${htmlEsc(ep.pub_date)} - offline host-summary narrative - <a href="${htmlEsc(mdFileName)}">markdown</a> - <a href="index.html">index</a></div>
<section><h2>Narrative Summary</h2><p>${htmlEsc(n.overview)}</p></section>
<section><h2>Diarized Experts</h2><ul>${experts || '<li>None found.</li>'}</ul></section>
<section><h2>Best Bets / Clear Leans</h2><ul>${best || '<li>None extracted.</li>'}</ul></section>
<section><h2>NFL Futures Discussed</h2><table><thead><tr><th>Expert</th><th>Market</th><th>Subject</th><th>Lean</th><th>Prediction</th><th>Conf</th><th>Time</th><th>Data Cited</th></tr></thead><tbody>${rows || '<tr><td colspan="8">None extracted.</td></tr>'}</tbody></table></section>
<section><h2>Representative Quotes</h2><ul>${quotes || '<li>None extracted.</li>'}</ul></section>`;
}

function renderIndex(episodes) {
  const rows = episodes.map((ep) => {
    const html = `${ep.slug}.html`;
    const futures = ep.hosts.reduce((sum, h) => sum + h.futures.length, 0);
    const hosts = ep.hosts.map((h) => h.host).join(', ');
    return `<tr><td>${htmlEsc(ep.pub_date)}</td><td><a href="${htmlEsc(html)}">${htmlEsc(ep.show)} - ${htmlEsc(ep.title)}</a></td><td>${htmlEsc(hosts)}</td><td>${futures}</td></tr>`;
  }).join('');
  return `<!doctype html><meta charset="utf-8"><title>NFL Podcast Narrative Summaries</title>
<style>body{font-family:Inter,Segoe UI,Arial,sans-serif;max-width:1100px;margin:28px auto;padding:0 18px;color:#172033}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8dee8;padding:7px 9px;text-align:left;vertical-align:top}th{background:#f3f6fb}.muted{color:#667085}</style>
<h1>NFL Podcast Narrative Summaries</h1>
<p class="muted">Generated offline from local podcast host-summary vault notes. No live API calls.</p>
<table><thead><tr><th>Date</th><th>Episode</th><th>Diarized experts</th><th>NFL futures</th></tr></thead><tbody>${rows}</tbody></table>`;
}

async function main() {
  const files = await listMarkdownFiles(VAULT_ROOT);
  const notes = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const fm = parseFrontmatter(text);
    if (fm.source_system !== 'podcast-host-summary') continue;
    const futures = parseFutures(text);
    if (!futures.length) continue;
    notes.push({
      file,
      show: fm.show || 'Unknown Show',
      host: normalizeHostName(fm.show || 'Unknown Show', fm.host || 'Unknown', fm.title || ''),
      title: fm.title || path.basename(file, '.md'),
      pub_date: fm.pub_date || 'undated',
      attribution_method: fm.attribution_method || 'unknown',
      futures,
      quotes: parseQuotes(text),
    });
  }

  const grouped = new Map();
  for (const note of notes) {
    const key = episodeKey(note);
    if (!grouped.has(key)) {
      grouped.set(key, { show: note.show, title: note.title, pub_date: note.pub_date, hosts: [] });
    }
    grouped.get(key).hosts.push(note);
  }

  const episodes = [...grouped.values()]
    .map((ep) => ({
      ...ep,
      hosts: ep.hosts.sort((a, b) => a.host.localeCompare(b.host)),
      slug: `${ep.pub_date}-${slugify(ep.show)}-${slugify(ep.title)}`,
    }))
    .sort((a, b) => a.pub_date.localeCompare(b.pub_date) || a.show.localeCompare(b.show) || a.title.localeCompare(b.title));

  await mkdir(OUT_DIR, { recursive: true });
  for (const ep of episodes) {
    const mdName = `${ep.slug}.md`;
    const htmlName = `${ep.slug}.html`;
    await writeFile(path.join(OUT_DIR, mdName), renderMarkdown(ep), 'utf8');
    await writeFile(path.join(OUT_DIR, htmlName), renderHtmlPage(ep, mdName), 'utf8');
  }
  await writeFile(path.join(OUT_DIR, 'index.html'), renderIndex(episodes), 'utf8');
  await writeFile(path.join(OUT_DIR, 'index.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    source_root: VAULT_ROOT,
    count: episodes.length,
    episodes: episodes.map((ep) => ({
      show: ep.show,
      title: ep.title,
      pub_date: ep.pub_date,
      slug: ep.slug,
      hosts: ep.hosts.map((h) => h.host),
      futures_count: ep.hosts.reduce((sum, h) => sum + h.futures.length, 0),
      html: pathToFileURL(path.join(OUT_DIR, `${ep.slug}.html`)).href,
      markdown: pathToFileURL(path.join(OUT_DIR, `${ep.slug}.md`)).href,
    })),
  }, null, 2), 'utf8');

  console.log(`wrote ${episodes.length} episode narrative summaries to ${OUT_DIR}`);
  console.log(`index: ${pathToFileURL(path.join(OUT_DIR, 'index.html')).href}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
