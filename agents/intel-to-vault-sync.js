// agents/intel-to-vault-sync.js
// ═══════════════════════════════════════════════════════════════════════════════
// F-15: Intel-to-Vault Sync Agent
//
// Closes the loop between automated ingest tables and the vault notes the
// BETTING agent reads via read_vault_note.
//
// Flow:
//   1. Read last LOOKBACK_DAYS of research_intel_notes + x_sharp_tweets
//   2. Match items to teams via keyword/nickname mapping
//   3. For each team with new items, update the "## Recent Intel" section in
//      vault_notes at NFL/Teams/<ABBR>.md (preserves the static stub above it)
//   4. Also synthesize cross-team signals into NFL/Reference/WeeklySignals.md
//
// Usage:
//   node agents/intel-to-vault-sync.js [--dry-run] [--week <N>] [--team <ABBR>]
//
// Schedule:  Sundays 10:00 UTC + Wednesdays 10:00 UTC (see intel-to-vault-sync.yml)
//
// Env vars:
//   SUPABASE_URL              (required)
//   SUPABASE_SERVICE_ROLE_KEY (required)
//   INTEL_LOOKBACK_DAYS       default: 7
//   INTEL_MAX_ITEMS_PER_TEAM  default: 10  (top-N most recent per team)
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN      = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const DAYS         = Number(process.env.INTEL_LOOKBACK_DAYS || 7);
const MAX_ITEMS    = Number(process.env.INTEL_MAX_ITEMS_PER_TEAM || 10);

const weekArg  = process.argv.indexOf('--week');
const WEEK     = weekArg !== -1 ? Number(process.argv[weekArg + 1]) : null;
const teamArg  = process.argv.indexOf('--team');
const ONLY_TEAM = teamArg !== -1 ? process.argv[teamArg + 1].toUpperCase() : null;

// ─── Team mention map ─────────────────────────────────────────────────────────
// Maps any recognizable form (city, nickname, abbreviation, common aliases)
// to the canonical 2-3 letter abbreviation used in vault paths.

const TEAM_ALIASES = {
  // AFC East
  BUF: ['buffalo', 'bills', 'buf', 'bufbills'],
  MIA: ['miami', 'dolphins', 'mia', 'phins'],
  NE:  ['new england', 'patriots', 'pats', 'ne ', 'new england patriots'],
  NYJ: ['new york jets', 'jets', 'nyj', 'gang green'],
  // AFC North
  BAL: ['baltimore', 'ravens', 'bal', 'lamar'],
  CLE: ['cleveland', 'browns', 'cle'],
  CIN: ['cincinnati', 'bengals', 'cin', 'who dey'],
  PIT: ['pittsburgh', 'steelers', 'pit ', 'stillers'],
  // AFC South
  HOU: ['houston', 'texans', 'hou'],
  TEN: ['tennessee', 'titans', 'ten'],
  IND: ['indianapolis', 'colts', 'ind'],
  JAX: ['jacksonville', 'jaguars', 'jax', 'jags'],
  // AFC West
  KC:  ['kansas city', 'chiefs', 'kc ', 'kc chiefs', 'mahomes'],
  LV:  ['las vegas', 'raiders', 'lv ', 'silver and black', 'las vegas raiders'],
  DEN: ['denver', 'broncos', 'den'],
  LAC: ['los angeles chargers', 'chargers', 'lac', 'la chargers'],
  // NFC East
  DAL: ['dallas', 'cowboys', 'dal', 'america\'s team'],
  NYG: ['new york giants', 'giants', 'nyg', 'big blue'],
  PHI: ['philadelphia', 'eagles', 'phi', 'philly'],
  WAS: ['washington', 'commanders', 'was ', 'washington commanders'],
  // NFC North
  CHI: ['chicago', 'bears', 'chi ', 'monsters of the midway'],
  DET: ['detroit', 'lions', 'det'],
  GB:  ['green bay', 'packers', 'gb ', 'cheeseheads', 'green bay packers'],
  MIN: ['minnesota', 'vikings', 'min'],
  // NFC South
  ATL: ['atlanta', 'falcons', 'atl'],
  CAR: ['carolina', 'panthers', 'car '],
  NO:  ['new orleans', 'saints', 'no ', 'nola'],
  TB:  ['tampa bay', 'buccaneers', 'tb ', 'bucs'],
  // NFC West
  ARI: ['arizona', 'cardinals', 'ari'],
  LAR: ['los angeles rams', 'rams', 'lar', 'la rams'],
  SF:  ['san francisco', '49ers', 'sf ', 'niners', 'forty-niners'],
  SEA: ['seattle', 'seahawks', 'sea', 'hawks'],
};

// Pre-build a flat lookup: alias (lowercase) → ABBR
const ALIAS_LOOKUP = new Map();
for (const [abbr, aliases] of Object.entries(TEAM_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_LOOKUP.set(alias.toLowerCase(), abbr);
  }
}

/** Return all team abbreviations mentioned in a block of text. */
function extractTeams(text) {
  if (!text) return new Set();
  const lower = ` ${text.toLowerCase()} `;
  const found = new Set();
  for (const [alias, abbr] of ALIAS_LOOKUP.entries()) {
    // Wrap multi-word aliases in word-boundary-ish check
    if (lower.includes(alias)) {
      found.add(abbr);
    }
  }
  return found;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

function nowIso() {
  return new Date().toISOString().slice(0, 10);
}

function cutoffIso() {
  const d = new Date();
  d.setDate(d.getDate() - DAYS);
  return d.toISOString();
}

function sha256(v) {
  return createHash('sha256').update(String(v)).digest('hex').slice(0, 8);
}

/** Truncate text to n chars, appending ellipsis if needed. */
function trunc(text, n = 220) {
  if (!text) return '';
  return text.length <= n ? text : text.slice(0, n - 1) + '…';
}

// ─── Vault note update logic ──────────────────────────────────────────────────

const INTEL_SECTION_HEADER = '## Recent Intel';
const INTEL_SECTION_FENCE  = '<!-- intel-auto-end -->';

/**
 * Splice the auto-generated "## Recent Intel" section into an existing note.
 * Content above INTEL_SECTION_HEADER is preserved verbatim.
 * If the header doesn't exist yet, the section is appended.
 */
function spliceIntelSection(existingContent, newSection) {
  const headerIdx = existingContent.indexOf(`\n${INTEL_SECTION_HEADER}`);
  if (headerIdx === -1) {
    // Not present — append
    return existingContent.trimEnd() + '\n\n' + newSection + '\n';
  }
  // Replace everything from the header line to end
  return existingContent.slice(0, headerIdx) + '\n' + newSection + '\n';
}

/** Build the markdown for the intel section for one team. */
function buildIntelSection(abbr, articles, tweets, weekLabel) {
  const lines = [`${INTEL_SECTION_HEADER}`, ``, `_Auto-updated: ${nowIso()}${weekLabel ? ` (${weekLabel})` : ''}_`, ``];

  if (articles.length > 0) {
    lines.push('### Articles & Analysis');
    for (const a of articles) {
      const date = a.published_at ? a.published_at.slice(0, 10) : nowIso();
      const src  = a.source || 'Unknown';
      const title = a.title ? trunc(a.title, 120) : '(no title)';
      const summary = a.summary ? trunc(a.summary, 200) : '';
      lines.push(`- **[${title}](${a.url})** — ${src} (${date})`);
      if (summary) lines.push(`  - ${summary}`);
    }
    lines.push('');
  }

  if (tweets.length > 0) {
    lines.push('### Sharp Twitter');
    for (const t of tweets) {
      const date   = t.published_at ? t.published_at.slice(0, 10) : nowIso();
      const handle = t.author_handle || 'unknown';
      lines.push(`- **[@${handle}](${t.tweet_url})** (${date}): ${trunc(t.text, 200)}`);
    }
    lines.push('');
  }

  if (articles.length === 0 && tweets.length === 0) {
    lines.push(`_No new intel in the past ${DAYS} days._`);
    lines.push('');
  }

  lines.push(INTEL_SECTION_FENCE);
  return lines.join('\n');
}

// ─── Cross-team weekly signals ────────────────────────────────────────────────

/** Build NFL/Reference/WeeklySignals.md from the top signals across all teams. */
function buildWeeklySignals(teamMap, weekLabel) {
  const allArticles = [];
  const allTweets   = [];
  for (const [abbr, { articles, tweets }] of Object.entries(teamMap)) {
    allArticles.push(...articles.map(a => ({ ...a, _abbr: abbr })));
    allTweets.push(...tweets.map(t => ({ ...t, _abbr: abbr })));
  }

  // Sort by published_at desc, take top 25 of each
  const sortByDate = (a, b) => (b.published_at || '').localeCompare(a.published_at || '');
  const topArticles = allArticles.sort(sortByDate).slice(0, 25);
  const topTweets   = allTweets.sort(sortByDate).slice(0, 25);

  const lines = [
    '# NFL Weekly Signals',
    '',
    `_Auto-generated: ${nowIso()}${weekLabel ? ` — ${weekLabel}` : ''}_`,
    `_Source window: last ${DAYS} days_`,
    '',
    '## Top Articles & Analysis',
    '',
  ];
  for (const a of topArticles) {
    const date  = a.published_at ? a.published_at.slice(0, 10) : '';
    const teams = a._abbr ? `[${a._abbr}] ` : '';
    lines.push(`- ${teams}**[${trunc(a.title || '(no title)', 100)}](${a.url})** — ${a.source || ''} (${date})`);
    if (a.summary) lines.push(`  - ${trunc(a.summary, 180)}`);
  }
  lines.push('');
  lines.push('## Sharp Twitter');
  lines.push('');
  for (const t of topTweets) {
    const date   = t.published_at ? t.published_at.slice(0, 10) : '';
    const teams  = t._abbr ? `[${t._abbr}] ` : '';
    lines.push(`- ${teams}**[@${t.author_handle}](${t.tweet_url})** (${date}): ${trunc(t.text, 200)}`);
  }
  lines.push('');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase  = getSupabase();
  const cutoff    = cutoffIso();
  const weekLabel = WEEK ? `Week ${WEEK}` : null;

  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}intel-to-vault-sync — window: last ${DAYS} days (since ${cutoff.slice(0, 10)})`);
  if (weekLabel) console.log(`  Week: ${WEEK}`);
  if (ONLY_TEAM)  console.log(`  Team filter: ${ONLY_TEAM}`);
  console.log('');

  // ── Fetch intel ─────────────────────────────────────────────────────────────

  const [articlesRes, tweetsRes] = await Promise.all([
    supabase
      .from('research_intel_notes')
      .select('id, source, url, title, summary, published_at')
      .gte('captured_at', cutoff)
      .order('published_at', { ascending: false })
      .limit(500),
    supabase
      .from('x_sharp_tweets')
      .select('id, author_handle, author_tier, text, tweet_url, published_at')
      .gte('captured_at', cutoff)
      .order('published_at', { ascending: false })
      .limit(500),
  ]);

  if (articlesRes.error) throw new Error(`Articles fetch: ${articlesRes.error.message}`);
  if (tweetsRes.error)   throw new Error(`Tweets fetch: ${tweetsRes.error.message}`);

  const articles = articlesRes.data || [];
  const tweets   = tweetsRes.data   || [];
  console.log(`  Fetched ${articles.length} articles, ${tweets.length} tweets`);

  // ── Map to teams ────────────────────────────────────────────────────────────

  /** teamMap: abbr → { articles: [], tweets: [] } */
  const teamMap = {};

  function addToTeam(abbr, type, item) {
    if (!teamMap[abbr]) teamMap[abbr] = { articles: [], tweets: [] };
    teamMap[abbr][type].push(item);
  }

  for (const a of articles) {
    const combined = `${a.title || ''} ${a.summary || ''}`;
    for (const abbr of extractTeams(combined)) {
      addToTeam(abbr, 'articles', a);
    }
  }
  for (const t of tweets) {
    for (const abbr of extractTeams(t.text)) {
      addToTeam(abbr, 'tweets', t);
    }
  }

  const teamsWithIntel = Object.keys(teamMap)
    .filter(abbr => ONLY_TEAM ? abbr === ONLY_TEAM : true)
    .sort();

  console.log(`  Teams with intel: ${teamsWithIntel.join(', ') || '(none)'}\n`);

  // Trim to MAX_ITEMS per team
  for (const abbr of teamsWithIntel) {
    teamMap[abbr].articles = teamMap[abbr].articles.slice(0, MAX_ITEMS);
    teamMap[abbr].tweets   = teamMap[abbr].tweets.slice(0, MAX_ITEMS);
  }

  // ── Update team vault notes ──────────────────────────────────────────────────

  let updated = 0;
  let failed  = 0;

  for (const abbr of teamsWithIntel) {
    const vaultPath = `NFL/Teams/${abbr}.md`;
    const { articles: teamArticles, tweets: teamTweets } = teamMap[abbr];

    // Fetch existing note
    let existing = '';
    const { data: noteRow, error: noteErr } = await supabase
      .from('vault_notes')
      .select('content')
      .eq('path', vaultPath)
      .maybeSingle();

    if (noteErr) {
      console.error(`  [FAIL] ${abbr}: fetch error — ${noteErr.message}`);
      failed++;
      continue;
    }
    if (noteRow) existing = noteRow.content || '';

    const intelSection = buildIntelSection(abbr, teamArticles, teamTweets, weekLabel);
    const rawContent   = spliceIntelSection(existing, intelSection);
    // Strip control chars and surrogate pairs (emoji) that PostgREST rejects
    // as invalid JSON. Surrogate pairs (e.g. 🏀 = \uD83C\uDFC0) trigger PGRST102.
    const newContent   = rawContent
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')       // control chars
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');            // surrogate pairs

    if (DRY_RUN) {
      console.log(`  [DRY RUN] ${vaultPath} — ${teamArticles.length} articles, ${teamTweets.length} tweets`);
      updated++;
      continue;
    }

    const { error: upsertErr } = await supabase
      .from('vault_notes')
      .upsert(
        { path: vaultPath, content: newContent, tags: ['team', abbr.toLowerCase(), 'auto-intel'], source: 'agent' },
        { onConflict: 'path' },
      );

    if (upsertErr) {
      console.error(`  [FAIL] ${vaultPath}: ${upsertErr.message} | code: ${upsertErr.code} | details: ${upsertErr.details}`);
      failed++;
    } else {
      console.log(`  [OK] ${vaultPath} (+${teamArticles.length}a +${teamTweets.length}t)`);
      updated++;
    }
  }

  // ── Write weekly signals reference note ─────────────────────────────────────

  if (!ONLY_TEAM) {
    const signalsPath    = 'NFL/Reference/WeeklySignals.md';
    const signalsContent = buildWeeklySignals(teamMap, weekLabel);

    if (DRY_RUN) {
      console.log(`\n  [DRY RUN] ${signalsPath} — cross-team summary`);
    } else {
      const { error } = await supabase
        .from('vault_notes')
        .upsert(
          { path: signalsPath, content: signalsContent, tags: ['reference', 'signals', 'auto-intel'], source: 'agent' },
          { onConflict: 'path' },
        );
      if (error) {
        console.error(`  [FAIL] ${signalsPath}: ${error.message}`);
        failed++;
      } else {
        console.log(`\n  [OK] ${signalsPath}`);
      }
    }
  }

  // ── Write receipt ─────────────────────────────────────────────────────────

  const receipt = {
    run_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    lookback_days: DAYS,
    week: WEEK,
    only_team: ONLY_TEAM,
    articles_scanned: articles.length,
    tweets_scanned: tweets.length,
    teams_with_intel: teamsWithIntel.length,
    vault_notes_updated: updated,
    failures: failed,
  };

  await mkdir(RECEIPTS_DIR, { recursive: true });
  const rcptFile = path.join(RECEIPTS_DIR, `intel-vault-${nowIso()}-${sha256(nowIso())}.json`);
  await writeFile(rcptFile, JSON.stringify(receipt, null, 2), 'utf8');

  console.log(`\nDone. ${updated} updated, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('[intel-to-vault-sync] Fatal:', err.message);
  process.exit(1);
});
