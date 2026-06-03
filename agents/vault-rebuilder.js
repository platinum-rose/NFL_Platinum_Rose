// agents/vault-rebuilder.js
// ═══════════════════════════════════════════════════════════════════════════════
// Phase 5: vault-rebuilder.js
// Spec: /memories/repo/nfl-podcast-pipeline-spec.md §3 Phase 5
//
// Pulls graded + recent podcast picks (and supporting tables) from Supabase and
// rebuilds the auto-managed sections of the Obsidian vault:
//
//   NFL/Reference/ExpertLeaderboard.md   (auto body)
//   NFL/Teams/<ABBR>.md                  (## Podcast Intel + ## Season Trend)
//   NFL/Experts/<slug>.md                (auto body)
//   NFL/Weekly/<season>-W<n>.md          (auto body)
//   NFL/Futures/<Market>.md              (auto body)
//   NFL/Props/<Player>-<Prop>.md         (auto body)
//
// Auto-section fence pattern (uniform across every page):
//
//   ## <Section>
//   <!-- auto-start:vault-rebuilder/v1 -->
//   ... regenerated content ...
//   <!-- auto-end -->
//
// Manual edits OUTSIDE fences are preserved verbatim. Mismatched fences in an
// existing note abort the write for that file with a clear error (corruption
// guard, see lib/fenceGuard.js).
//
// Triggers:
//   - After each successful M6 podcast run (Phase 9 cron)
//   - After nfl-auto-grade.js finishes (so ledgers refresh)
//   - Manual: node agents/vault-rebuilder.js --week N --dry-run
//
// CLI flags:
//   --dry-run            print intended writes; do not call Supabase upsert
//   --week <N>           limit Weekly/ rebuild to a specific week
//   --season <YYYY>      override season filter (default: current)
//   --team <ABBR>        only rebuild that team's note
//   --expert <slug>      only rebuild that expert's note
//   --lookback <days>    cap how far back picks/intel are pulled (default 60)
//
// Env vars:
//   SUPABASE_URL                (required)
//   SUPABASE_SERVICE_ROLE_KEY   (required)
//   VAULT_REBUILDER_LOOKBACK    default: 60 days
// ═══════════════════════════════════════════════════════════════════════════════

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

import 'dotenv/config';

import {
  replaceManySections,
  replaceSection,
  validateFences,
  FenceCorruptionError,
} from './lib/fenceGuard.js';
import {
  renderTeamPodcastIntel,
  renderTeamSeasonTrend,
  renderExpertLedger,
  renderExpertLeaderboard,
  renderWeeklyConsensus,
  renderFuturesMarket,
  renderPlayerProp,
  SECTION_VERSION,
} from './lib/vaultRebuilderRenderers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const DRY_RUN  = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const argFlag = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : null;
};
const ONLY_WEEK    = argFlag('week') ? Number(argFlag('week')) : null;
const ONLY_SEASON  = argFlag('season') ? Number(argFlag('season')) : null;
const ONLY_TEAM    = argFlag('team')   ? argFlag('team').toUpperCase() : null;
const ONLY_EXPERT  = argFlag('expert') ? argFlag('expert') : null;
const LOOKBACK     = Number(
  argFlag('lookback') || process.env.VAULT_REBUILDER_LOOKBACK || 60,
);

// ─── Vault path helpers ─────────────────────────────────────────────────────

export const PATHS = {
  expertLeaderboard: () => 'NFL/Reference/ExpertLeaderboard.md',
  team: (abbr)            => `NFL/Teams/${abbr}.md`,
  expert: (slug)          => `NFL/Experts/${slug}.md`,
  weekly: (season, week)  => `NFL/Weekly/${season}-W${week}.md`,
  futures: (market)       => `NFL/Futures/${market}.md`,
  prop: (player, prop)    => `NFL/Props/${slugify(player)}-${slugify(prop)}.md`,
};

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Section composers (orchestrator-level) ─────────────────────────────────

/**
 * Build the multi-section update for a Teams/<ABBR>.md note. Returns an
 * array suitable for replaceManySections().
 */
export function composeTeamSections({ abbr, picks, trend, now }) {
  return [
    {
      header: '## Podcast Intel',
      body: renderTeamPodcastIntel({ abbr, picks, now }),
    },
    {
      header: '## Season Trend',
      body: renderTeamSeasonTrend({ abbr, trend, now }),
    },
  ];
}

// ─── Vault note IO via Supabase vault_notes table ───────────────────────────

async function readVaultNote(supabase, vaultPath) {
  const { data, error } = await supabase
    .from('vault_notes')
    .select('content')
    .eq('path', vaultPath)
    .maybeSingle();
  if (error) throw new Error(`vault_notes read ${vaultPath}: ${error.message}`);
  return data?.content ?? '';
}

async function writeVaultNote(supabase, vaultPath, content) {
  const sanitized = content
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '');
  const { error } = await supabase
    .from('vault_notes')
    .upsert({ path: vaultPath, content: sanitized }, { onConflict: 'path' });
  if (error) throw new Error(`vault_notes upsert ${vaultPath}: ${error.message}`);
}

// ─── Page-level rebuild helpers (pure-ish: take note text, return note text) ─

export function rebuildTeamNote({ existing, abbr, picks, trend, now }) {
  validateFences(existing); // throws on corruption — caller skips this file
  const sections = composeTeamSections({ abbr, picks, trend, now });
  return replaceManySections({ content: existing, sections, version: SECTION_VERSION });
}

export function rebuildExpertNote({ existing, expert, ledger, picks, now }) {
  validateFences(existing);
  return replaceSection({
    content: existing,
    header: '## Season Ledger',
    body: renderExpertLedger({ expert, ledger, picks, now }),
    version: SECTION_VERSION,
  });
}

export function rebuildExpertLeaderboardNote({ existing, experts, now }) {
  validateFences(existing);
  return replaceSection({
    content: existing,
    header: '## Standings',
    body: renderExpertLeaderboard({ experts, now }),
    version: SECTION_VERSION,
  });
}

export function rebuildWeeklyNote({ existing, week, games, now }) {
  validateFences(existing);
  return replaceSection({
    content: existing,
    header: '## Cross-Expert Consensus',
    body: renderWeeklyConsensus({ week, games, now }),
    version: SECTION_VERSION,
  });
}

export function rebuildFuturesNote({ existing, market, picks, lineHistory, now }) {
  validateFences(existing);
  return replaceSection({
    content: existing,
    header: '## Running Tally',
    body: renderFuturesMarket({ market, picks, lineHistory, now }),
    version: SECTION_VERSION,
  });
}

export function rebuildPropNote({ existing, player, prop, picks, now }) {
  validateFences(existing);
  return replaceSection({
    content: existing,
    header: '## Picks Timeline',
    body: renderPlayerProp({ player, prop, picks, now }),
    version: SECTION_VERSION,
  });
}

// ─── CLI entrypoint (only runs when invoked directly) ──────────────────────

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const now = new Date().toISOString().slice(0, 10);
  const cutoff = (() => {
    const d = new Date();
    d.setDate(d.getDate() - LOOKBACK);
    return d.toISOString();
  })();

  console.log(
    `\n${DRY_RUN ? '[DRY RUN] ' : ''}vault-rebuilder — lookback ${LOOKBACK}d (since ${cutoff.slice(0, 10)})`,
  );
  if (ONLY_TEAM)   console.log(`  team filter: ${ONLY_TEAM}`);
  if (ONLY_EXPERT) console.log(`  expert filter: ${ONLY_EXPERT}`);
  if (ONLY_WEEK)   console.log(`  week filter: ${ONLY_WEEK}`);
  if (ONLY_SEASON) console.log(`  season filter: ${ONLY_SEASON}`);
  console.log('');

  const summary = {
    started_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    written: [],
    skipped_corrupt: [],
    errors: [],
  };

  // Pull recent picks once. Each picks row is the fully-shaped object from
  // podcast_transcripts.picks[] joined with episode metadata. Phase 5 reads
  // from a service-role view (or assembles client-side); we accept either.
  const { data: pickRows, error: pickErr } = await supabase
    .from('podcast_transcripts')
    .select('id, episode_id, picks, podcast_episodes(title, published_at, expert_name, expert_slug, podcast_name)')
    .gte('updated_at', cutoff)
    .limit(2000);
  if (pickErr) throw new Error(`fetch podcast_transcripts: ${pickErr.message}`);

  // Flatten into per-pick rows enriched with episode meta.
  /** @type {Array<object>} */
  const allPicks = [];
  for (const tr of pickRows || []) {
    const ep = tr.podcast_episodes || {};
    for (const p of tr.picks || []) {
      allPicks.push({
        ...p,
        episode_id: tr.episode_id,
        episode_title: ep.title,
        episode_published_at: ep.published_at,
        expert_name: ep.expert_name,
        expert_slug: ep.expert_slug,
        podcast_name: ep.podcast_name,
      });
    }
  }
  console.log(`  Loaded ${allPicks.length} picks from ${pickRows?.length ?? 0} transcripts`);

  // ── Rebuild team notes ────────────────────────────────────────────────
  const teamPicks = groupByTeam(allPicks);
  const teamAbbrs = Object.keys(teamPicks)
    .filter((a) => (ONLY_TEAM ? a === ONLY_TEAM : true))
    .sort();

  for (const abbr of teamAbbrs) {
    const vaultPath = PATHS.team(abbr);
    try {
      const existing = await readVaultNote(supabase, vaultPath);
      const updated = rebuildTeamNote({
        existing,
        abbr,
        picks: teamPicks[abbr],
        trend: null, // Season-trend aggregates wired in a follow-up.
        now,
      });
      if (updated !== existing) {
        if (!DRY_RUN) await writeVaultNote(supabase, vaultPath, updated);
        summary.written.push(vaultPath);
        console.log(`  ${DRY_RUN ? '[DRY] ' : ''}wrote ${vaultPath}`);
      }
    } catch (e) {
      if (e instanceof FenceCorruptionError) {
        summary.skipped_corrupt.push({ path: vaultPath, reason: e.reason });
        console.warn(`  [SKIP corrupt fences] ${vaultPath} — ${e.message}`);
      } else {
        summary.errors.push({ path: vaultPath, message: e.message });
        console.error(`  [FAIL] ${vaultPath} — ${e.message}`);
      }
    }
  }

  // ── Rebuild expert notes ──────────────────────────────────────────────
  const expertPicks = groupByExpert(allPicks);
  const expertSlugs = Object.keys(expertPicks)
    .filter((s) => (ONLY_EXPERT ? s === ONLY_EXPERT : true))
    .sort();

  const leaderboardRows = [];
  for (const slug of expertSlugs) {
    const picks = expertPicks[slug];
    const expert = {
      slug,
      name: picks[0]?.expert_name || slug,
      podcast: picks[0]?.podcast_name,
    };
    const ledger = aggregateExpertLedger(picks);
    leaderboardRows.push({ ...ledger, slug, name: expert.name });

    const vaultPath = PATHS.expert(slug);
    try {
      const existing = await readVaultNote(supabase, vaultPath);
      const updated = rebuildExpertNote({ existing, expert, ledger, picks, now });
      if (updated !== existing) {
        if (!DRY_RUN) await writeVaultNote(supabase, vaultPath, updated);
        summary.written.push(vaultPath);
        console.log(`  ${DRY_RUN ? '[DRY] ' : ''}wrote ${vaultPath}`);
      }
    } catch (e) {
      if (e instanceof FenceCorruptionError) {
        summary.skipped_corrupt.push({ path: vaultPath, reason: e.reason });
        console.warn(`  [SKIP corrupt fences] ${vaultPath} — ${e.message}`);
      } else {
        summary.errors.push({ path: vaultPath, message: e.message });
        console.error(`  [FAIL] ${vaultPath} — ${e.message}`);
      }
    }
  }

  // ── Expert leaderboard ────────────────────────────────────────────────
  leaderboardRows.sort((a, b) => (Number(b.units || 0) - Number(a.units || 0)));
  const lbPath = PATHS.expertLeaderboard();
  try {
    const existing = await readVaultNote(supabase, lbPath);
    const updated = rebuildExpertLeaderboardNote({
      existing,
      experts: leaderboardRows,
      now,
    });
    if (updated !== existing) {
      if (!DRY_RUN) await writeVaultNote(supabase, lbPath, updated);
      summary.written.push(lbPath);
      console.log(`  ${DRY_RUN ? '[DRY] ' : ''}wrote ${lbPath}`);
    }
  } catch (e) {
    if (e instanceof FenceCorruptionError) {
      summary.skipped_corrupt.push({ path: lbPath, reason: e.reason });
      console.warn(`  [SKIP corrupt fences] ${lbPath} — ${e.message}`);
    } else {
      summary.errors.push({ path: lbPath, message: e.message });
    }
  }

  // ── Receipt ───────────────────────────────────────────────────────────
  summary.finished_at = new Date().toISOString();
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const receiptPath = path.join(
    RECEIPTS_DIR,
    `vault-rebuilder-${now}-${Date.now()}.json`,
  );
  await writeFile(receiptPath, JSON.stringify(summary, null, 2));
  console.log(`\n  Receipt: ${receiptPath}`);
  console.log(
    `  Wrote ${summary.written.length} · skipped ${summary.skipped_corrupt.length} corrupt · errors ${summary.errors.length}`,
  );
}

// ─── Aggregations (exported for tests) ──────────────────────────────────────

export function groupByTeam(picks) {
  const map = {};
  for (const p of picks) {
    const teams = new Set();
    if (p.team1) teams.add(String(p.team1).toUpperCase());
    if (p.team2) teams.add(String(p.team2).toUpperCase());
    if (p.category === 'spread' || p.category === 'moneyline') {
      if (p.selection) teams.add(String(p.selection).toUpperCase());
    }
    for (const abbr of teams) {
      if (!map[abbr]) map[abbr] = [];
      map[abbr].push(p);
    }
  }
  for (const abbr of Object.keys(map)) {
    map[abbr].sort(byEpisodeDateDesc);
  }
  return map;
}

export function groupByExpert(picks) {
  const map = {};
  for (const p of picks) {
    const slug = p.expert_slug;
    if (!slug) continue;
    if (!map[slug]) map[slug] = [];
    map[slug].push(p);
  }
  for (const slug of Object.keys(map)) {
    map[slug].sort(byEpisodeDateDesc);
  }
  return map;
}

export function aggregateExpertLedger(picks) {
  const graded = picks.filter((p) => p.result);
  const wins   = graded.filter((p) => p.result === 'win').length;
  const losses = graded.filter((p) => p.result === 'loss').length;
  const pushes = graded.filter((p) => p.result === 'push').length;
  let units = 0;
  let clvSum = 0;
  let clvCount = 0;
  for (const p of graded) {
    if (typeof p.units_pl === 'number') units += p.units_pl;
    if (typeof p.clv === 'number') {
      clvSum += p.clv;
      clvCount += 1;
    }
  }
  const denom = wins + losses;
  const winRate = denom > 0 ? wins / denom : null;
  const avgUnitsRisked = picks.reduce((s, p) => s + (p.units || 1), 0) / Math.max(picks.length, 1);
  const roi = denom > 0 && avgUnitsRisked > 0 ? units / (denom * avgUnitsRisked) : null;
  return {
    graded: graded.length,
    wins,
    losses,
    pushes,
    units,
    roi,
    win_rate: winRate,
    clv_avg: clvCount > 0 ? clvSum / clvCount : null,
    hot_categories: pickHotCategories(graded),
  };
}

function pickHotCategories(graded) {
  const buckets = {};
  for (const p of graded) {
    const k = p.category || 'other';
    if (!buckets[k]) buckets[k] = { w: 0, total: 0 };
    if (p.result === 'win') buckets[k].w += 1;
    if (p.result === 'win' || p.result === 'loss') buckets[k].total += 1;
  }
  const out = [];
  for (const [k, v] of Object.entries(buckets)) {
    if (v.total >= 5 && v.w / v.total >= 0.6) out.push(k);
  }
  return out;
}

function byEpisodeDateDesc(a, b) {
  return (b.episode_published_at || '').localeCompare(a.episode_published_at || '');
}

// Allow this module to be imported by tests without auto-executing main().
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
