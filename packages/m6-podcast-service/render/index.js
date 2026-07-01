/**
 * Phase 7a — Static Digest Renderer
 *
 * buildRenderer({ supabase, cfg }) → { renderAll, renderForEpisode,
 *   renderEpisode, renderExpert, renderExpertWeek, renderWeekly }
 *
 * Only episodes with status='done' are rendered.
 * is_partial episodes render with a banner — they are not skipped.
 * All writes are atomic (writeFile.js → *.tmp → rename).
 * XSS: every dynamic value is passed through esc() in templates.js.
 */

import path from 'node:path';
import { config as defaultConfig } from '../src/config.js';
import { atomicWrite } from './writeFile.js';
import { esc, layout, pickCard, intelList } from './templates.js';
import {
  slugify,
  weekTagFor,
  groupByExpert,
  weeklyConsensus,
  normalizeTranscript,
  detectSlugCollisions,
} from './aggregate.js';

// ── Supabase SELECT columns ────────────────────────────────────────────────
// NOTE: extraction_model / extraction_quality_score live on podcast_transcripts
// (migration 023_podcast_pipeline_v2.sql), NOT on podcast_episodes — they were
// previously (incorrectly) requested here as top-level episode columns, which
// fails against the real schema with "column podcast_episodes.extraction_model
// does not exist" (caught 2026-07-01 running the Phase 7a CLI against the live
// DB for the first time; the unit-test fake Supabase client's select() is a
// no-op passthrough, so it never caught the mismatch). Read them off the
// normalized transcript object (see normalizeTranscript()), not the episode.
const EPISODE_SELECT = [
  'id',
  'title',
  'pub_date',
  'status',
  'is_partial',
  'duration_secs',
  'podcast_feeds(expert, name)',
  'podcast_transcripts(picks, intel, extraction_model, extraction_quality_score)',
].join(', ');

// ── Internal DB helpers ────────────────────────────────────────────────────

/**
 * Fetch all done episodes (with joined feed + transcript data).
 *
 * @param {object} supabase  service-role client
 * @returns {Promise<object[]>}
 */
async function fetchAllEpisodes(supabase) {
  const { data, error } = await supabase
    .from('podcast_episodes')
    .select(EPISODE_SELECT)
    .eq('status', 'done');
  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch a single done episode by id, or null if not found / not done.
 *
 * @param {object} supabase
 * @param {string} episodeId
 * @returns {Promise<object|null>}
 */
async function fetchEpisode(supabase, episodeId) {
  const { data, error } = await supabase
    .from('podcast_episodes')
    .select(EPISODE_SELECT)
    .eq('status', 'done')
    .eq('id', episodeId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// ── Rendering helpers ──────────────────────────────────────────────────────

function formatDuration(secs) {
  if (secs == null) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function renderEpisodeBody(episode) {
  const feed = episode.podcast_feeds ?? {};
  const transcript = normalizeTranscript(episode);
  const picks = transcript.picks ?? [];
  const intel = transcript.intel ?? [];

  let body = '';

  if (episode.is_partial) {
    body += `<div class="partial-banner">⚠️ Partial episode — transcript may be incomplete.</div>\n`;
  }

  // Metadata strip
  const metaParts = [];
  if (feed.name || feed.expert) {
    metaParts.push(`<span><strong>Expert:</strong> ${esc(feed.name || feed.expert)}</span>`);
  }
  if (episode.pub_date) {
    metaParts.push(`<span><strong>Published:</strong> ${esc(episode.pub_date)}</span>`);
  }
  const dur = formatDuration(episode.duration_secs);
  if (dur) metaParts.push(`<span><strong>Duration:</strong> ${esc(dur)}</span>`);
  if (transcript.extraction_model) {
    metaParts.push(`<span><strong>Model:</strong> ${esc(transcript.extraction_model)}</span>`);
  }
  if (transcript.extraction_quality_score != null) {
    const pct = Math.round(transcript.extraction_quality_score * 100);
    metaParts.push(`<span><strong>Quality:</strong> ${esc(String(pct))}%</span>`);
  }
  if (metaParts.length) {
    body += `<div class="meta-strip">${metaParts.join('')}</div>\n`;
  }

  // Picks
  if (picks.length) {
    body += `<h2>Picks (${esc(String(picks.length))})</h2>\n`;
    for (const pick of picks) {
      body += pickCard(pick) + '\n';
    }
  }

  // Intel
  if (intel.length) {
    body += `<h2>Intel</h2>\n`;
    body += intelList(intel) + '\n';
  }

  return body;
}

function renderExpertBody(expertData, allEpisodes) {
  const { expert, name, episodes: expertEps } = expertData;

  // Group episodes by week tag (using pick week/season if available, else pub_date).
  // For the expert page we group all episodes chronologically.
  /** @type {Map<string, object[]>} */
  const byWeek = new Map();
  for (const ep of expertEps) {
    const transcript = normalizeTranscript(ep);
    const picks = transcript.picks ?? [];
    // Derive the week tag from the first pick, or fall back to pub_date.
    const firstPick = picks.find((p) => p.season != null && p.week != null);
    const weekTag = firstPick ? weekTagFor(firstPick, ep) : weekTagFor({}, ep);
    if (!byWeek.has(weekTag)) byWeek.set(weekTag, []);
    byWeek.get(weekTag).push(ep);
  }

  // Sort week tags descending.
  const sortedWeeks = [...byWeek.keys()].sort().reverse();

  let body = `<div class="meta-strip"><span><strong>Expert:</strong> ${esc(name || expert)}</span>`;
  body += `<span><strong>Episodes:</strong> ${esc(String(expertEps.length))}</span></div>\n`;

  const slug = slugify(expert);

  for (const weekTag of sortedWeeks) {
    const weekEps = byWeek.get(weekTag);
    const weekPageHref = `${esc(weekTag)}.html`;
    body += `<div class="week-group">\n`;
    body += `<h3><a href="${weekPageHref}">${esc(weekTag)}</a></h3>\n`;
    for (const ep of weekEps) {
      const epHref = `../../episodes/${esc(ep.id)}.html`;
      const transcript = normalizeTranscript(ep);
      const picks = transcript.picks ?? [];
      const pickCount = picks.length;
      body += `<a class="episode-link" href="${epHref}">${esc(ep.title || ep.id)} — ${esc(String(pickCount))} pick${pickCount !== 1 ? 's' : ''}</a>\n`;
    }
    body += `</div>\n`;
  }

  return body;
}

function renderExpertWeekBody(expertData, weekTag, episodes) {
  const { expert, name } = expertData;
  let body = `<div class="meta-strip">`;
  body += `<span><strong>Expert:</strong> ${esc(name || expert)}</span>`;
  body += `<span><strong>Week:</strong> ${esc(weekTag)}</span>`;
  body += `</div>\n`;

  for (const ep of episodes) {
    const transcript = normalizeTranscript(ep);
    const picks = transcript.picks ?? [];
    const intel = transcript.intel ?? [];
    const epHref = `../../episodes/${esc(ep.id)}.html`;

    body += `<h3><a href="${epHref}">${esc(ep.title || ep.id)}</a></h3>\n`;
    if (picks.length) {
      for (const pick of picks) {
        body += pickCard(pick) + '\n';
      }
    }
    if (intel.length) {
      body += intelList(intel) + '\n';
    }
  }

  return body;
}

function renderWeeklyBody(weekTag, weekMap) {
  let body = `<div class="meta-strip"><span><strong>Week:</strong> ${esc(weekTag)}</span></div>\n`;

  if (weekMap.size === 0) {
    body += `<p>No picks this week.</p>\n`;
    return body;
  }

  body += `<table class="consensus-table">\n`;
  body += `<thead><tr>`;
  body += `<th>Matchup</th><th>Category</th><th>Experts</th><th>Sides</th>`;
  body += `</tr></thead>\n<tbody>\n`;

  for (const { team1, team2, picks } of weekMap.values()) {
    // Group picks by category.
    /** @type {Map<string, object[]>} */
    const byCat = new Map();
    for (const pick of picks) {
      const cat = pick.category ?? 'spread';
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(pick);
    }

    for (const [cat, catPicks] of byCat) {
      // Count sides.
      /** @type {Map<string, number>} */
      const sideCounts = new Map();
      for (const pick of catPicks) {
        const side = pick.selection ?? pick.team1 ?? '?';
        sideCounts.set(side, (sideCounts.get(side) ?? 0) + 1);
      }
      const sidesText = [...sideCounts.entries()]
        .map(([side, n]) => `${esc(side)}: ${esc(String(n))}`)
        .join(', ');
      const expertSlugs = [...new Set(catPicks.map((p) => p._expertSlug ?? ''))].filter(Boolean);
      const expertsText = expertSlugs.map(esc).join(', ');

      body += `<tr>`;
      body += `<td>${esc(team1)} vs ${esc(team2)}</td>`;
      body += `<td><span class="badge ${esc(cat)}">${esc(cat)}</span></td>`;
      body += `<td>${expertsText || '—'}</td>`;
      body += `<td>${sidesText}</td>`;
      body += `</tr>\n`;
    }
  }

  body += `</tbody>\n</table>\n`;
  return body;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Build and return a renderer bound to the given Supabase client + config.
 *
 * @param {object} [opts]
 * @param {object} [opts.supabase]  service-role Supabase client (or fake for tests)
 * @param {object} [opts.cfg]       config override (e.g. { digestDir: tmpdir })
 * @returns {{
 *   renderAll(): Promise<{episodes:number, experts:number, weeks:number, written:number, ms:number}>,
 *   renderForEpisode(episodeId: string): Promise<{written: string[]}>,
 *   renderEpisode(episodeId: string): Promise<string|null>,
 *   renderExpert(slug: string): Promise<string|null>,
 *   renderExpertWeek(slug: string, weekTag: string): Promise<string|null>,
 *   renderWeekly(weekTag: string): Promise<string|null>,
 * }}
 */
export function buildRenderer({ supabase, cfg = defaultConfig } = {}) {
  if (!supabase) throw new Error('buildRenderer: supabase client is required');

  // ── renderEpisode ────────────────────────────────────────────────────────

  async function renderEpisode(episodeId) {
    const episode = await fetchEpisode(supabase, episodeId);
    if (!episode) return null;

    const title = episode.title || `Episode ${episodeId}`;
    const html = layout(title, renderEpisodeBody(episode));
    const outPath = path.join(cfg.digestDir, 'episodes', `${episodeId}.html`);
    await atomicWrite(outPath, html);
    return outPath;
  }

  // ── renderExpert ─────────────────────────────────────────────────────────

  async function renderExpert(slug) {
    const allEpisodes = await fetchAllEpisodes(supabase);
    const expertGroups = groupByExpert(allEpisodes);
    const expertData = expertGroups.get(slug);
    if (!expertData) return null;

    const title = `${expertData.name || expertData.expert} — All Picks`;
    const html = layout(title, renderExpertBody(expertData, allEpisodes));
    const outPath = path.join(cfg.digestDir, 'experts', `${slug}.html`);
    await atomicWrite(outPath, html);
    return outPath;
  }

  // ── renderExpertWeek ─────────────────────────────────────────────────────

  async function renderExpertWeek(slug, weekTag) {
    const allEpisodes = await fetchAllEpisodes(supabase);
    const expertGroups = groupByExpert(allEpisodes);
    const expertData = expertGroups.get(slug);
    if (!expertData) return null;

    // Filter to episodes whose week tag matches.
    const weekEps = expertData.episodes.filter((ep) => {
      const transcript = normalizeTranscript(ep);
      const picks = transcript.picks ?? [];
      const firstPick = picks.find((p) => p.season != null && p.week != null);
      return weekTagFor(firstPick ?? {}, ep) === weekTag;
    });

    if (weekEps.length === 0) return null;

    const title = `${expertData.name || expertData.expert} — ${weekTag}`;
    const html = layout(title, renderExpertWeekBody(expertData, weekTag, weekEps));
    const outPath = path.join(cfg.digestDir, 'experts', slug, `${weekTag}.html`);
    await atomicWrite(outPath, html);
    return outPath;
  }

  // ── renderWeekly ─────────────────────────────────────────────────────────

  async function renderWeekly(weekTag) {
    const allEpisodes = await fetchAllEpisodes(supabase);
    const weeks = weeklyConsensus(allEpisodes);
    const weekMap = weeks.get(weekTag);
    if (!weekMap) return null;

    const title = `Weekly Consensus — ${weekTag}`;
    const html = layout(title, renderWeeklyBody(weekTag, weekMap));
    const outPath = path.join(cfg.digestDir, 'weekly', `${weekTag}.html`);
    await atomicWrite(outPath, html);
    return outPath;
  }

  // ── renderAll ────────────────────────────────────────────────────────────

  async function renderAll() {
    const start = Date.now();
    const allEpisodes = await fetchAllEpisodes(supabase);

    if (allEpisodes.length === 0) {
      return { episodes: 0, experts: 0, weeks: 0, written: 0, ms: Date.now() - start };
    }

    // Warn about slug collisions — don't throw.
    const collisions = detectSlugCollisions(allEpisodes);
    if (collisions.length) {
      for (const c of collisions) {
        console.warn(`[7a] Slug collision: "${c.slug}" → [${c.experts.join(', ')}]`);
      }
    }

    let written = 0;

    // 1. Episode pages.
    for (const ep of allEpisodes) {
      const p = await renderEpisodeInner(ep);
      if (p) written++;
    }

    // 2. Expert pages + expert-week pages.
    const expertGroups = groupByExpert(allEpisodes);
    const expertSlugs = [...expertGroups.keys()];
    for (const slug of expertSlugs) {
      const expertData = expertGroups.get(slug);
      const title = `${expertData.name || expertData.expert} — All Picks`;
      const html = layout(title, renderExpertBody(expertData, allEpisodes));
      const outPath = path.join(cfg.digestDir, 'experts', `${slug}.html`);
      await atomicWrite(outPath, html);
      written++;

      // Expert-week pages.
      const weekTags = getExpertWeekTags(expertData.episodes);
      for (const weekTag of weekTags) {
        const weekEps = expertData.episodes.filter((ep) => {
          const transcript = normalizeTranscript(ep);
          const picks = transcript.picks ?? [];
          const firstPick = picks.find((p) => p.season != null && p.week != null);
          return weekTagFor(firstPick ?? {}, ep) === weekTag;
        });
        if (weekEps.length === 0) continue;
        const wTitle = `${expertData.name || expertData.expert} — ${weekTag}`;
        const wHtml = layout(wTitle, renderExpertWeekBody(expertData, weekTag, weekEps));
        const wPath = path.join(cfg.digestDir, 'experts', slug, `${weekTag}.html`);
        await atomicWrite(wPath, wHtml);
        written++;
      }
    }

    // 3. Weekly pages.
    const weeks = weeklyConsensus(allEpisodes);
    for (const [weekTag, weekMap] of weeks) {
      const title = `Weekly Consensus — ${weekTag}`;
      const html = layout(title, renderWeeklyBody(weekTag, weekMap));
      const outPath = path.join(cfg.digestDir, 'weekly', `${weekTag}.html`);
      await atomicWrite(outPath, html);
      written++;
    }

    return {
      episodes: allEpisodes.length,
      experts: expertSlugs.length,
      weeks: weeks.size,
      written,
      ms: Date.now() - start,
    };
  }

  // ── renderForEpisode ─────────────────────────────────────────────────────

  async function renderForEpisode(episodeId) {
    const episode = await fetchEpisode(supabase, episodeId);
    if (!episode) return { written: [] };

    const written = [];

    // Episode page.
    const epPath = await renderEpisodeInner(episode);
    if (epPath) written.push(epPath);

    // Determine which expert + week pages this episode touches.
    const slug = episode.podcast_feeds?.expert ? slugify(episode.podcast_feeds.expert) : null;
    if (slug) {
      const allEpisodes = await fetchAllEpisodes(supabase);
      const expertGroups = groupByExpert(allEpisodes);
      const expertData = expertGroups.get(slug);

      if (expertData) {
        // Expert summary page.
        const expTitle = `${expertData.name || expertData.expert} — All Picks`;
        const expHtml = layout(expTitle, renderExpertBody(expertData, allEpisodes));
        const expPath = path.join(cfg.digestDir, 'experts', `${slug}.html`);
        await atomicWrite(expPath, expHtml);
        written.push(expPath);

        // Expert-week page for this episode's week.
        const transcript = normalizeTranscript(episode);
        const picks = transcript.picks ?? [];
        const firstPick = picks.find((p) => p.season != null && p.week != null);
        const weekTag = weekTagFor(firstPick ?? {}, episode);

        const weekEps = expertData.episodes.filter((ep) => {
          const t = normalizeTranscript(ep);
          const ps = t.picks ?? [];
          const fp = ps.find((p) => p.season != null && p.week != null);
          return weekTagFor(fp ?? {}, ep) === weekTag;
        });

        if (weekEps.length > 0) {
          const ewTitle = `${expertData.name || expertData.expert} — ${weekTag}`;
          const ewHtml = layout(ewTitle, renderExpertWeekBody(expertData, weekTag, weekEps));
          const ewPath = path.join(cfg.digestDir, 'experts', slug, `${weekTag}.html`);
          await atomicWrite(ewPath, ewHtml);
          written.push(ewPath);
        }

        // Weekly consensus page for this week.
        const weeks = weeklyConsensus(allEpisodes);
        const weekMap = weeks.get(weekTag);
        if (weekMap) {
          const wTitle = `Weekly Consensus — ${weekTag}`;
          const wHtml = layout(wTitle, renderWeeklyBody(weekTag, weekMap));
          const wPath = path.join(cfg.digestDir, 'weekly', `${weekTag}.html`);
          await atomicWrite(wPath, wHtml);
          written.push(wPath);
        }
      }
    }

    return { written };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /** Render an already-fetched episode object (avoids a second DB round-trip). */
  async function renderEpisodeInner(episode) {
    const title = episode.title || `Episode ${episode.id}`;
    const html = layout(title, renderEpisodeBody(episode));
    const outPath = path.join(cfg.digestDir, 'episodes', `${episode.id}.html`);
    await atomicWrite(outPath, html);
    return outPath;
  }

  /** Collect distinct week tags that appear in a set of episodes. */
  function getExpertWeekTags(episodes) {
    const tags = new Set();
    for (const ep of episodes) {
      const transcript = normalizeTranscript(ep);
      const picks = transcript.picks ?? [];
      const firstPick = picks.find((p) => p.season != null && p.week != null);
      tags.add(weekTagFor(firstPick ?? {}, ep));
    }
    return [...tags];
  }

  return {
    renderAll,
    renderForEpisode,
    renderEpisode,
    renderExpert,
    renderExpertWeek,
    renderWeekly,
  };
}
