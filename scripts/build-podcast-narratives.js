#!/usr/bin/env node
// Build offline, episode-level NFL podcast narrative summaries from local
// podcast-host-summary vault notes. No database, model, or API calls.

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSpeakerMap, applySpeakerMap, AD_SPEAKER_LABEL } from '../agents/lib/speaker-attribution.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_VAULT = 'E:\\data\\Obsidian\\NFL\\Podcasts';
const VAULT_ROOT = argValue('--vault', process.env.PODCAST_VAULT_ROOT || DEFAULT_VAULT);
const OUT_DIR = path.resolve(ROOT, argValue('--out', 'docs/podcast-narratives'));
const METADATA_PATH = path.resolve(ROOT, argValue('--metadata', 'data/podcasts/episode-metadata-overrides.json'));
const SOURCE_DIR = path.resolve(ROOT, argValue('--source', 'data/podcasts/m6-diarized'));

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
    if (row.Type && !row.extraction_type) row.extraction_type = row.Type;
    if (row.Trigger && !row.trigger_condition) row.trigger_condition = row.Trigger;
    if (row['Betting implication'] && !row.betting_implication) row.betting_implication = row['Betting implication'];
    if (row['Action timing'] && !row.action_timing) row.action_timing = row['Action timing'];
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

function normalizeHostName(show, host, title = '', episodeMetadata = null) {
  const showName = cleanText(show).toLowerCase();
  const hostName = cleanText(host);
  const titleName = cleanText(title).toLowerCase();
  if (hostName.toLowerCase() !== 'guest') return hostName || 'Unknown';

  // Safe offline corrections for legacy host-summary notes that used "Guest"
  // before diarized host extraction was consistently available.
  const participants = (episodeMetadata?.expected_participants ?? []).map(cleanText).filter(Boolean);
  const nonDefaultSharpGuests = participants.filter((name) => !['Chad Millman', 'Simon Hunter'].includes(name));
  if (showName === 'sharp or square' && nonDefaultSharpGuests.length === 1) return nonDefaultSharpGuests[0];
  if (showName === 'sharp or square' && titleName.includes('ben solak')) return 'Ben Solak';
  if (showName === 'sharp or square') return 'Simon Hunter';
  if (showName === 'even money' && titleName.includes('warren sharp')) return 'Warren Sharp';
  if (showName === 'even money') return 'Ross Tucker';
  if (showName === 'the favorites' && titleName.includes('sean koerner')) return 'Sean Koerner';
  if (showName === 'the favorites' && titleName.includes('david bockino')) return 'David Bockino';
  if (showName === 'the favorites' && titleName.includes('david chao')) return 'David Chao';
  if (showName === 'bettingpros podcast' && titleName.includes('ep. 1013')) return 'Andrew Erickson';
  if (showName === 'bettingpros podcast' && titleName.includes('ep. 1016')) return 'Andrew Erickson';
  if (showName === 'bettingpros podcast' && titleName.includes('ep. 1018')) return 'Andrew Erickson';

  return hostName || 'Unknown';
}

async function loadMetadataOverrides(filePath) {
  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    return Array.isArray(parsed.episodes) ? parsed.episodes : [];
  } catch {
    return [];
  }
}

function datesMatch(a, b) {
  return String(a ?? '').slice(0, 10) === String(b ?? '').slice(0, 10);
}

function findMetadataOverride(overrides, ep) {
  const title = cleanText(ep.title).toLowerCase();
  const show = cleanText(ep.show).toLowerCase();
  return overrides.find((entry) => entry.episode_id && ep.episode_id === entry.episode_id)
    ?? overrides.find((entry) =>
      entry.title
      && title === cleanText(entry.title).toLowerCase()
      && (!entry.show || show === cleanText(entry.show).toLowerCase())
      && (!entry.pub_date || datesMatch(entry.pub_date, ep.pub_date))
    )
    ?? null;
}

function expectedParticipants(ep) {
  const fromMetadata = ep.episodeMetadata?.expected_participants ?? [];
  if (fromMetadata.length) return fromMetadata.map(cleanText).filter(Boolean);

  const showName = cleanText(ep.show).toLowerCase();
  if (showName === 'sharp or square') return ['Chad Millman', 'Simon Hunter'];
  return [];
}

function futureFromJson(future) {
  return {
    Market: cleanText(future.subject_market).replace(/_/g, ' '),
    Subject: cleanText(future.subject),
    Lean: cleanText(future.lean),
    Prediction: cleanText(future.prediction),
    Type: cleanText(future.extraction_type || 'bet'),
    Conf: cleanText(future.confidence),
    Time: cleanText(future.source_timestamp),
    'Stats cited': Array.isArray(future.stats_cited) ? future.stats_cited.join('; ') : cleanText(future.stats_cited),
    Trigger: cleanText(future.trigger_condition),
    'Betting implication': cleanText(future.betting_implication),
    'Action timing': cleanText(future.action_timing),
  };
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}` : `${m}:${String(rem).padStart(2, '0')}`;
}

function normalizeForAttribution(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTimestampSeconds(value) {
  const parts = cleanText(value).split(':').map(Number);
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  if (parts.length === 2) return (parts[0] * 60) + parts[1];
  return null;
}

function attributionTextScore(turn, needles) {
  const haystack = normalizeForAttribution(turn.text);
  let best = 0;
  for (const needle of needles) {
    if (!needle) continue;
    if (haystack.includes(needle) || needle.includes(haystack)) best = Math.max(best, 100);
    const tokens = [...new Set(needle.split(' ').filter((token) => token.length > 2))];
    if (tokens.length) {
      const hits = tokens.filter((token) => haystack.includes(token)).length;
      best = Math.max(best, (hits / tokens.length) * 80);
    }
  }
  return best;
}

function turnForTimestamp(turns, timestamp, needles = []) {
  const seconds = parseTimestampSeconds(timestamp);
  if (!Number.isFinite(seconds)) return null;
  const candidates = (turns ?? [])
    .filter((turn) =>
      turn.speaker
      && turn.speaker !== AD_SPEAKER_LABEL
      && seconds >= (Number(turn.start) - 90)
      && seconds <= (Number(turn.end) + 90)
    )
    .map((turn) => {
      const start = Number(turn.start) || 0;
      const end = Number(turn.end) || start;
      const midpoint = start + ((end - start) / 2);
      const textScore = attributionTextScore(turn, needles);
      const boundaryBonus = seconds >= start && seconds <= end ? 8 : 0;
      return {
        turn,
        score: textScore + boundaryBonus - (Math.abs(midpoint - seconds) / 20),
        textScore,
      };
    })
    .sort((a, b) => b.score - a.score);
  if (needles.length) return candidates.find((candidate) => candidate.textScore >= 35)?.turn ?? null;
  return candidates[0]?.turn ?? null;
}

function resolveFutureHostFromTranscript({ future, fallbackHost, turns }) {
  return resolveFutureAttributionFromTranscript({ future, fallbackHost, turns }).host;
}

function resolveFutureAttributionFromTranscript({ future, fallbackHost, turns }) {
  const quote = normalizeForAttribution(future.quote);
  const prediction = normalizeForAttribution(future.prediction);
  const needles = [quote, prediction].filter((value) => value.length >= 24);
  const timed = turnForTimestamp(turns, future.source_timestamp, needles);
  if (timed?.speaker && timed.speaker !== 'Guest' && timed.speaker !== 'Unknown') {
    return { host: timed.speaker, timestamp: cleanText(future.source_timestamp) || formatTime(timed.start) };
  }
  if (!needles.length) return { host: fallbackHost, timestamp: cleanText(future.source_timestamp) };

  const match = turns.find((turn) => {
    if (!turn.speaker || turn.speaker === AD_SPEAKER_LABEL) return false;
    const haystack = normalizeForAttribution(turn.text);
    return needles.some((needle) => haystack.includes(needle) || needle.includes(haystack));
  });

  if (match?.speaker && match.speaker !== 'Guest' && match.speaker !== 'Unknown') {
    return { host: match.speaker, timestamp: cleanText(future.source_timestamp) || formatTime(match.start) };
  }
  return { host: fallbackHost, timestamp: cleanText(future.source_timestamp) };
}

function quotesFromJson(futures) {
  return (futures ?? [])
    .filter((future) => cleanText(future.quote))
    .map((future) => ({
      subject: cleanText(future.subject),
      timestamp: cleanText(future.source_timestamp) || null,
      quote: cleanText(future.quote),
    }));
}

async function loadJsonFallbackEpisodes(overrides) {
  try {
    const manifest = JSON.parse(await readFile(path.join(SOURCE_DIR, 'manifest.json'), 'utf8'));
    const out = [];
    for (const entry of manifest) {
      const jsonPath = path.resolve(ROOT, entry.json);
      const payload = JSON.parse(await readFile(jsonPath, 'utf8'));
      const hostSummaries = payload.host_summaries ?? [];
      if (!hostSummaries.some((summary) => (summary.futures ?? []).length)) continue;
      const ep = {
        episode_id: payload.episode?.id,
        show: payload.feed?.name || 'Unknown Show',
        title: payload.episode?.title || entry.title || path.basename(jsonPath, '.json'),
        pub_date: String(payload.episode?.pub_date || entry.pub_date || 'undated').slice(0, 10),
      };
      const episodeMetadata = payload.episode_metadata ?? findMetadataOverride(overrides, ep);
      const speakerMap = buildSpeakerMap(payload.transcript?.speaker_segments ?? [], payload.feed?.name, undefined, {
        expectedParticipants: episodeMetadata?.expected_participants ?? [],
      });
      const turns = applySpeakerMap(
        (payload.transcript?.speaker_segments ?? []).map((turn) => ({ ...turn, raw_speaker: turn.speaker })),
        speakerMap
      );
      const futuresByHost = new Map();
      const quotesByHost = new Map();
      for (const summary of hostSummaries.filter((row) => (row.futures ?? []).length)) {
        const summaryHost = normalizeHostName(ep.show, summary.host || 'Unknown', ep.title, episodeMetadata);
        for (const future of summary.futures ?? []) {
          const resolved = resolveFutureAttributionFromTranscript({ future, fallbackHost: summaryHost, turns });
          const resolvedHost = resolved.host;
          if (!futuresByHost.has(resolvedHost)) futuresByHost.set(resolvedHost, []);
          if (!quotesByHost.has(resolvedHost)) quotesByHost.set(resolvedHost, []);
          const resolvedFuture = {
            ...future,
            host: resolvedHost,
            source_timestamp: cleanText(future.source_timestamp) || resolved.timestamp,
          };
          futuresByHost.get(resolvedHost).push(futureFromJson(resolvedFuture));
          if (cleanText(future.quote)) {
            quotesByHost.get(resolvedHost).push({
              subject: cleanText(future.subject),
              timestamp: cleanText(resolvedFuture.source_timestamp) || null,
              quote: cleanText(future.quote),
            });
          }
        }
      }
      out.push({
        ...ep,
        episodeMetadata,
        hosts: [...futuresByHost.entries()].map(([host, futures]) => ({
          file: jsonPath,
          show: ep.show,
          host,
          title: ep.title,
          pub_date: ep.pub_date,
          attribution_method: 'json_export_transcript_reconciled',
          futures,
          quotes: quotesByHost.get(host) ?? [],
        })),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function episodeExtractionScore(ep) {
  let score = 0;
  for (const host of ep.hosts ?? []) {
    const hostName = cleanText(host.host).toLowerCase();
    if (hostName === 'guest' || hostName === 'unknown') score -= 20;
    if (String(host.attribution_method || '').includes('transcript_reconciled')) score += 12;
    if (String(host.attribution_method || '').includes('unknown')) score -= 8;
    for (const future of host.futures ?? []) {
      const time = cleanText(future.Time || future.source_timestamp);
      if (time && time !== '-') score += 2;
      else score -= 1;
      if (cleanText(future.Type || future.extraction_type)) score += 1;
    }
  }
  return score;
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
  const participants = expectedParticipants(ep);
  const futures = ep.hosts.flatMap((h) => h.futures.map((f) => ({ ...f, host: h.host })));
  const markets = [...new Set(futures.map((f) => displayMarket(f.Market)).filter(Boolean))];
  const subjects = [...new Set(futures.map((f) => cleanText(f.Subject)).filter(Boolean))];
  const overs = futures.filter((f) => ['over', 'favor'].includes(cleanText(f.Lean).toLowerCase())).length;
  const unders = futures.filter((f) => ['under', 'against'].includes(cleanText(f.Lean).toLowerCase())).length;
  const strongest = [...futures].sort((a, b) => pickStrength(b) - pickStrength(a)).slice(0, 10);
  const timing = futures.filter((f) => cleanText(f.Type || f.extraction_type).toLowerCase() === 'timing_conjecture');

  const focus = markets.length
    ? `The NFL discussion centered on ${markets.slice(0, 6).join(', ')}${markets.length > 6 ? ', and related futures markets' : ''}.`
    : 'The local note did not extract any NFL futures markets.';
  const tilt = futures.length
    ? `Across ${futures.length} extracted NFL futures, the lean mix was ${overs} back/over, ${unders} fade/under, and ${Math.max(0, futures.length - overs - unders)} neutral or unclear.`
    : 'No NFL futures were extracted from this episode-level aggregation.';
  const timingLine = timing.length
    ? `It also surfaced ${timing.length} timing/watchlist conjecture${timing.length === 1 ? '' : 's'} where entry price or sequencing mattered.`
    : '';
  const subjectLine = subjects.length
    ? `Teams/players discussed included ${subjects.slice(0, 14).join(', ')}${subjects.length > 14 ? ', and others' : ''}.`
    : '';

  const participantLine = participants.length
    ? `Episode participants: ${participants.join(', ')}.`
    : '';

  return {
    overview: [participantLine, focus, tilt, timingLine, subjectLine].filter(Boolean).join(' '),
    bestBets: strongest,
    timing,
    hosts,
    participants,
  };
}

function sourceLink(file) {
  return pathToFileURL(file).href;
}

function renderMarkdown(ep) {
  const n = narrativeForEpisode(ep);
  const participants = n.participants.map((name) => `- ${name}`).join('\n');
  const sourceRows = ep.hosts.map((h) => `- ${h.host}: ${h.futures.length} extracted NFL futures, attribution ${h.attribution_method || 'unknown'} ([source note](${sourceLink(h.file)}))`);
  const bestRows = n.bestBets.map((p) => {
    const stats = cleanText(p['Stats cited']);
    const time = cleanText(p.Time) ? ` (${cleanText(p.Time)})` : '';
    const extra = stats ? ` Reason/data cited: ${stats}.` : '';
    return `- **${p.host}**${time}: ${directionLabel(p.Lean)} ${mdCell(p.Subject)} in ${mdCell(displayMarket(p.Market))} - ${mdCell(p.Prediction)}.${extra}`;
  });
  const timingRows = n.timing.map((p) =>
    `- **${p.host}**${cleanText(p.Time) ? ` (${cleanText(p.Time)})` : ''}: ${mdCell(p.Subject)} / ${mdCell(displayMarket(p.Market))} - trigger: ${mdCell(p.Trigger || p.trigger_condition)}; implication: ${mdCell(p['Betting implication'] || p.betting_implication || p.Prediction)}; action: ${mdCell(p['Action timing'] || p.action_timing || 'monitor')}.`
  );
  const tableRows = ep.hosts.flatMap((h) => h.futures.map((f) =>
    `| ${mdCell(h.host)} | ${mdCell(displayMarket(f.Market))} | ${mdCell(f.Subject)} | ${mdCell(directionLabel(f.Lean))} | ${mdCell(f.Type || f.extraction_type || 'bet')} | ${mdCell(f.Prediction)} | ${mdCell(f.Conf)} | ${mdCell(f.Time)} | ${mdCell(f['Stats cited'])} |`
  ));
  const quotes = ep.hosts.flatMap((h) => h.quotes.slice(0, 12).map((q) => `- **${h.host} on ${q.subject}${q.timestamp ? ` (${q.timestamp})` : ''}:** "${mdCell(q.quote)}"`));

  return `# ${ep.show} - ${ep.title}

*Published: ${ep.pub_date} - Generated from offline podcast host-summary vault notes.*

## Narrative Summary

${n.overview}

## Episode Participants

${participants || '- No participant metadata loaded.'}

## Extracted Pick Attribution

${sourceRows.join('\n') || '- None found.'}

## Best Bets / Clear Leans

${bestRows.join('\n') || '- None extracted.'}

## Timing / Watchlist Conjectures

${timingRows.join('\n') || '- None extracted.'}

## NFL Futures Discussed

| Expert | Market | Subject | Lean | Type | Prediction | Conf | Time | Data Cited |
|---|---|---|---|---|---|---:|---|---|
${tableRows.join('\n') || '| - | - | - | - | - | - | - | - | - |'}

## Representative Quotes

${quotes.join('\n') || '- None extracted.'}
`;
}

function renderHtmlPage(ep, mdFileName) {
  const n = narrativeForEpisode(ep);
  const participants = n.participants.map((name) => `<li>${htmlEsc(name)}</li>`).join('');
  const best = n.bestBets.map((p) => `<li><b>${htmlEsc(p.host)}</b>${p.Time ? ` <span class="muted">(${htmlEsc(p.Time)})</span>` : ''}: ${htmlEsc(directionLabel(p.Lean))} ${htmlEsc(p.Subject)} in ${htmlEsc(displayMarket(p.Market))} - ${htmlEsc(p.Prediction)}${p['Stats cited'] ? `<span class="muted"> Reason/data cited: ${htmlEsc(p['Stats cited'])}.</span>` : ''}</li>`).join('');
  const timing = n.timing.map((p) => `<li><b>${htmlEsc(p.host)}</b>${p.Time ? ` <span class="muted">(${htmlEsc(p.Time)})</span>` : ''}: ${htmlEsc(p.Subject)} / ${htmlEsc(displayMarket(p.Market))} - <b>trigger:</b> ${htmlEsc(p.Trigger || p.trigger_condition || '-')} <b>implication:</b> ${htmlEsc(p['Betting implication'] || p.betting_implication || p.Prediction)} <b>action:</b> ${htmlEsc(p['Action timing'] || p.action_timing || 'monitor')}</li>`).join('');
  const experts = ep.hosts.map((h) => `<li><b>${htmlEsc(h.host)}</b>: ${h.futures.length} extracted NFL futures, attribution ${htmlEsc(h.attribution_method || 'unknown')} <a href="${htmlEsc(sourceLink(h.file))}">source note</a></li>`).join('');
  const rows = ep.hosts.flatMap((h) => h.futures.map((f) => `<tr><td>${htmlEsc(h.host)}</td><td>${htmlEsc(displayMarket(f.Market))}</td><td>${htmlEsc(f.Subject)}</td><td>${htmlEsc(directionLabel(f.Lean))}</td><td>${htmlEsc(f.Type || f.extraction_type || 'bet')}</td><td>${htmlEsc(f.Prediction)}</td><td>${htmlEsc(f.Conf)}</td><td>${htmlEsc(f.Time)}</td><td>${htmlEsc(f['Stats cited'])}</td></tr>`)).join('');
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
<section><h2>Episode Participants</h2><ul>${participants || '<li>No participant metadata loaded.</li>'}</ul></section>
<section><h2>Extracted Pick Attribution</h2><ul>${experts || '<li>None found.</li>'}</ul></section>
<section><h2>Best Bets / Clear Leans</h2><ul>${best || '<li>None extracted.</li>'}</ul></section>
<section><h2>Timing / Watchlist Conjectures</h2><ul>${timing || '<li>None extracted.</li>'}</ul></section>
<section><h2>NFL Futures Discussed</h2><table><thead><tr><th>Expert</th><th>Market</th><th>Subject</th><th>Lean</th><th>Type</th><th>Prediction</th><th>Conf</th><th>Time</th><th>Data Cited</th></tr></thead><tbody>${rows || '<tr><td colspan="9">None extracted.</td></tr>'}</tbody></table></section>
<section><h2>Representative Quotes</h2><ul>${quotes || '<li>None extracted.</li>'}</ul></section>`;
}

function renderIndex(episodes) {
  const rows = episodes.map((ep) => {
    const html = `${ep.slug}.html`;
    const futures = ep.hosts.reduce((sum, h) => sum + h.futures.length, 0);
    const hosts = ep.hosts.map((h) => h.host).join(', ');
    const participants = expectedParticipants(ep).join(', ');
    return `<tr><td>${htmlEsc(ep.pub_date)}</td><td><a href="${htmlEsc(html)}">${htmlEsc(ep.show)} - ${htmlEsc(ep.title)}</a></td><td>${htmlEsc(participants || '-')}</td><td>${htmlEsc(hosts)}</td><td>${futures}</td></tr>`;
  }).join('');
  return `<!doctype html><meta charset="utf-8"><title>NFL Podcast Narrative Summaries</title>
<style>body{font-family:Inter,Segoe UI,Arial,sans-serif;max-width:1100px;margin:28px auto;padding:0 18px;color:#172033}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8dee8;padding:7px 9px;text-align:left;vertical-align:top}th{background:#f3f6fb}.muted{color:#667085}</style>
<h1>NFL Podcast Narrative Summaries</h1>
<p class="muted">Generated offline from local podcast host-summary vault notes. No live API calls.</p>
<table><thead><tr><th>Date</th><th>Episode</th><th>Participants</th><th>Pick attribution</th><th>NFL futures</th></tr></thead><tbody>${rows}</tbody></table>`;
}

async function main() {
  const files = await listMarkdownFiles(VAULT_ROOT);
  const metadataOverrides = await loadMetadataOverrides(METADATA_PATH);
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
      host: normalizeHostName(fm.show || 'Unknown Show', fm.host || 'Unknown', fm.title || '', findMetadataOverride(metadataOverrides, {
        show: fm.show || 'Unknown Show',
        title: fm.title || path.basename(file, '.md'),
        pub_date: fm.pub_date || 'undated',
      })),
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

  for (const ep of await loadJsonFallbackEpisodes(metadataOverrides)) {
    const key = episodeKey(ep);
    const existing = grouped.get(key);
    if (!existing || episodeExtractionScore(ep) > episodeExtractionScore(existing)) {
      grouped.set(key, ep);
    }
  }

  const episodes = [...grouped.values()]
    .map((ep) => ({
      ...ep,
      hosts: ep.hosts.sort((a, b) => a.host.localeCompare(b.host)),
      episodeMetadata: ep.episodeMetadata ?? findMetadataOverride(metadataOverrides, ep),
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
      participants: expectedParticipants(ep),
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
