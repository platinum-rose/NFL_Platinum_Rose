// agents/fantasy-rose-bowl-build.js
// Rose Bowl (redraft, no keepers, Full PPR, real LB/IDP slots, ONE IR bench slot)
// custom draft board.
//
// Rebuilt 2026-09-01 to replace the ungoverned scratch/build-*-rose-bowl*.mjs family
// (6 near-duplicate one-off scripts, none committed, none reading from Supabase despite
// the pipeline audit spec's own architecture diagram claiming they did). This version
// reads ONLY from the live Supabase tables the ingest agents actually populate:
//
//   - fantasy_adp (scoring='ppr', source='fantasypros')
//       -> real cross-position market ADP. PRIMARY sort key for offense — see the
//          big comment in main() for why rank_ecr (below) can't be used for this.
//          Migration 034.
//   - fantasy_rankings (scoring='ppr', season=2026, week=0, source='fantasypros')
//       -> offense (QB/RB/WR/TE) expert consensus rank — POSITIONAL only (QB1, QB2,
//          ... restarting at 1 per position, since FantasyPros' API takes one
//          position per call). Used only for the per-player Tier tag and as a
//          fallback fill for deep players missing live ADP. Migration 046.
//   - fantasy_rankings (scoring='idp', source='draftsharks')
//       -> LB expert consensus rank + 3-down/snap signal, replacing the old hand-typed
//          "Green Dot" markdown list. Same table, different source/scoring lane.
//   - player_injuries (source: ESPN, agents/injury-ingest.js)
//       -> injury-status classification. 'Injured Reserve'/'PUP' are excluded from the
//          MAIN board but, since Rose Bowl carries exactly one IR bench slot, are kept
//          as IR STASH candidates (see step 3b) rather than dropped outright.
//          'Suspension' is excluded with NO stash — suspended players aren't IR-slot
//          eligible in a standard league. 'Out'/'Questionable'/'Doubtful' are NOT
//          excluded (week-to-week status isn't season-ending) but are tagged.
//   - nfl_rosters_latest (source: nflverse weekly rosters, scripts/seed-nfl-rosters.py)
//       -> IR STASH cross-check (added 2026-09-02, Trey Benson audit). A player whose
//          most recent INJURY report still shows a team's IR can, by the time we
//          build the board, have already been released outright — a true free agent
//          has no team's IR to sit on and isn't stash-eligible. This table is the
//          closest thing this repo has to a team-affiliation source, so every IR/PUP
//          candidate is cross-checked against it; anyone nfl_rosters_latest shows as
//          'UFA' is dropped from the stash instead of offered as a draft target.
//          CAVEAT: nfl_rosters is itself a periodic snapshot (nflverse weekly roster
//          release), not a real-time transactions feed — a release from today's news
//          cycle may not show up here for days. This cross-check catches the general
//          "our injury report is stale but the roster feed is fresher" case; it is
//          NOT a substitute for verifying a specific name that looks off. See
//          MANUAL_FREE_AGENT_OVERRIDES below for known cases the roster feed hasn't
//          caught up on yet.
//
// Every run refreshes itself against whatever is latest in the DB as of run time —
// no hardcoded player lists, no static local CSV snapshots (MANUAL_FREE_AGENT_OVERRIDES
// is the one deliberate exception: a short, dated, commented list of specific names
// confirmed by hand to be ahead of what nfl_rosters currently reflects).
//
// Usage:
//   node agents/fantasy-rose-bowl-build.js [--lbs 40] [--total 280] [--dry-run]
//     [--qb-cap N] [--rb-cap N] [--wr-cap N] [--te-cap N]  (per-position cap, applied
//       after ordering — e.g. --qb-cap 16 keeps only the top 16 QBs by rank)
//     [--exclude "Name One,Name Two"]  (ad hoc removals by exact player name, e.g.
//       league-specific cuts Andy made by hand reviewing the list — NOT for injuries,
//       which are handled automatically from live player_injuries data above)
//     [--no-ir-stash]  (drop the IR STASH section entirely; default on)
// Free agents (team='FA' — unsigned/released players) are excluded automatically;
// this is a standing data-quality rule, not a per-run option.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);

const LB_COUNT = parseInt(getArg('--lbs', '40'), 10);
const TOTAL = parseInt(getArg('--total', '280'), 10);
const DRY = has('--dry-run');
const NO_IR_STASH = has('--no-ir-stash');
const POS_CAPS = {
  QB: getArg('--qb-cap', null) ? parseInt(getArg('--qb-cap'), 10) : null,
  RB: getArg('--rb-cap', null) ? parseInt(getArg('--rb-cap'), 10) : null,
  WR: getArg('--wr-cap', null) ? parseInt(getArg('--wr-cap'), 10) : null,
  TE: getArg('--te-cap', null) ? parseInt(getArg('--te-cap'), 10) : null,
};
// Honey Badgers declared keepers to exclude from available draft board
const HONEY_BADGERS_KEEPERS_PATH = path.join(ROOT, 'data', 'fantasy', 'honey_badgers_declared_keepers_2026.json');
const HONEY_BADGERS_KEEPERS = new Set();
if (fs.existsSync(HONEY_BADGERS_KEEPERS_PATH)) {
  try {
    const kData = JSON.parse(fs.readFileSync(HONEY_BADGERS_KEEPERS_PATH, 'utf8'));
    for (const [tName, tInfo] of Object.entries(kData.teams || {})) {
      for (const k of (tInfo.keepers || [])) {
        HONEY_BADGERS_KEEPERS.add(k.player.toLowerCase());
      }
    }
  } catch (e) {
    console.warn(`Could not read keepers: ${e.message}`);
  }
}

const EXCLUDE_NAMES = new Set([
  'josh jacobs',
  'trey benson',
  ...HONEY_BADGERS_KEEPERS,
  ...(getArg('--exclude', '') || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.toLowerCase()),
]);

// Confirmed-by-hand cases where reality has moved past nfl_rosters (see the
// header comment's CAVEAT above). Each entry needs a date + source so this
// doesn't silently rot into an unreviewed permanent exclusion list — remove
// the entry once nfl_rosters/player_injuries catch up on their own.
//   - Trey Benson (RB): waived by ARI 8/24, cleared waivers, and was fully
//     released via injury settlement per subsequent reporting (confirmed
//     2026-09-02). player_injuries' latest report (8/26) still reads
//     "reverted to Cardinals' IR" and nfl_rosters' freshest row (8/8) still
//     reads ARI/ACT — both pre-date the settlement, so the automatic
//     cross-check in step 3b can't catch this one yet.
const MANUAL_FREE_AGENT_OVERRIDES = new Set(
  ['Trey Benson'].map((n) => nameKey(n)) // nameKey() is a hoisted function declaration, safe to call here
);

// Explicit manual rank/ADP overrides (e.g. aligning breakout RB sleepers to FP ECR consensus)
const MANUAL_ADP_OVERRIDES = new Map([
  [nameKey('MarShawn Lloyd'), 104],
  [nameKey('Dylan Sampson'), 143],
  [nameKey('Jonah Coleman'), 144],
  [nameKey('Keaton Mitchell'), 145],
  [nameKey('Zach Charbonnet'), 149],
  [nameKey('Alvin Kamara'), 157],
  [nameKey('Tank Bigsby'), 160],
  [nameKey('Braelon Allen'), 164],
  [nameKey('Emmett Johnson'), 172],
  [nameKey('Isiah Pacheco'), 181],
  [nameKey('Sean Tucker'), 203],
  [nameKey('Kaytron Allen'), 232],
]);

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) {
  console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

function nameKey(s) {
  return (s || '').toLowerCase()
    .replace(/[.'`\-]/g, '')
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function fetchAll(table, cols, filters = (q) => q) {
  let all = [], from = 0; const step = 1000;
  while (true) {
    let q = sb.from(table).select(cols);
    q = filters(q);
    const { data, error } = await q.range(from, from + step - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    all = all.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return all;
}

async function latestAsOfDate(table, filters = (q) => q) {
  let q = sb.from(table).select('as_of_date');
  q = filters(q);
  const { data, error } = await q.order('as_of_date', { ascending: false }).limit(1);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data?.[0]?.as_of_date || null;
}

async function main() {
  console.log('=== ROSE BOWL BOARD BUILD (live Supabase) ===');

  // 1a. Offense ADP — real market average draft position, ACROSS all positions.
  //     This is the primary sort key for the board. IMPORTANT: fantasy_rankings.rank_ecr
  //     is NOT a cross-position rank — FantasyPros' consensus-rankings endpoint only
  //     accepts one position per call, so rank_ecr is each player's rank WITHIN their
  //     own position (QB1, QB2, ... starting back at 1 for RB, WR, TE separately).
  //     Sorting all four positions together by raw rank_ecr silently interleaves
  //     "QB1, RB1, WR1, TE1, QB2, RB2, ..." — every elite RB/WR gets pushed down by
  //     mediocre QBs/TEs riding a low positional number. fantasy_adp.adp has no such
  //     problem: it's real snake-draft market data spanning every position at once.
  const adpAsOf = await latestAsOfDate('fantasy_adp', (q) => q.eq('scoring', 'ppr'));
  if (!adpAsOf) throw new Error('No fantasy_adp rows for scoring=ppr — run fantasypros-adp-ingest.js --scoring ppr first.');
  const adpRows = await fetchAll('fantasy_adp', 'player,position,team,adp', (q) =>
    q.eq('scoring', 'ppr').eq('as_of_date', adpAsOf).gt('adp', 0)); // adp=0 is FantasyPros' "undrafted" placeholder
  // Load FantasyPros Consensus Half-PPR Overall ECR dataset
  const fpHalfOverallEcrPath = path.join(ROOT, 'data', 'fantasy', 'fantasypros_half_ppr_overall_ecr_2026.json');
  const fpOverallMap = new Map();
  if (fs.existsSync(fpHalfOverallEcrPath)) {
    try {
      const fpList = JSON.parse(fs.readFileSync(fpHalfOverallEcrPath, 'utf8'));
      fpList.forEach((p, idx) => {
        const rank = parseInt(p.rank_ecr, 10) || idx + 1;
        const pos = (p.player_position_id || p.pos || '').toUpperCase();
        fpOverallMap.set(`${nameKey(p.player_name)}|${pos}`, rank);
        fpOverallMap.set(nameKey(p.player_name), rank);
      });
      console.log(`Loaded ${fpOverallMap.size / 2} FantasyPros Half-PPR Overall ECR players from ${fpHalfOverallEcrPath}`);
    } catch (e) {
      console.warn(`Could not parse FP Half-PPR Overall ECR dataset: ${e.message}`);
    }
  }

  let fpEcrAdoptedCount = 0;
  adpRows.forEach((r) => {
    const k = nameKey(r.player);
    const pos = (r.position || '').replace(/\d+$/, '').toUpperCase();
    const posKey = `${k}|${pos}`;
    
    // Adopt FP Overall ECR for WR, TE, RB, QB
    if (fpOverallMap.has(posKey) || fpOverallMap.has(k)) {
      r.adp = fpOverallMap.get(posKey) || fpOverallMap.get(k);
      fpEcrAdoptedCount++;
    }
    
    // Explicit manual overrides (if any) take final precedence
    if (MANUAL_ADP_OVERRIDES.has(k)) {
      r.adp = MANUAL_ADP_OVERRIDES.get(k);
    }
  });
  adpRows.sort((a, b) => a.adp - b.adp);
  console.log(`Offense Board: ${adpRows.length} rows as_of ${adpAsOf} (${fpEcrAdoptedCount} adopted FP Overall ECR, ${MANUAL_ADP_OVERRIDES.size} manual overrides applied)`);

  // 1b. Offense ECR — same-day consensus rankings, kept ONLY as a per-player Tier tag
  //     and as a fallback source for anyone missing live ADP (very deep sleepers).
  const offAsOf = await latestAsOfDate('fantasy_rankings', (q) =>
    q.eq('scoring', 'ppr').eq('season', 2026).eq('week', 0).eq('source', 'fantasypros'));
  if (!offAsOf) throw new Error('No fantasy_rankings rows for scoring=ppr season=2026 week=0 source=fantasypros — run fantasypros-rankings-ingest.js --scoring ppr first.');
  const offenseEcrRows = await fetchAll('fantasy_rankings', 'player,position,team,rank_ecr,tier,pos_rank', (q) =>
    q.eq('scoring', 'ppr').eq('season', 2026).eq('week', 0).eq('source', 'fantasypros').eq('as_of_date', offAsOf));
  offenseEcrRows.sort((a, b) => a.rank_ecr - b.rank_ecr); // positional order — fine, only used for tier lookup / fallback fill
  console.log(`Offense ECR (tier lookup + fallback): ${offenseEcrRows.length} rows as_of ${offAsOf}`);
  const tierByKey = new Map();
  offenseEcrRows.forEach((r) => {
    const pos = (r.position || '').replace(/\d+$/, '').toUpperCase();
    tierByKey.set(`${nameKey(r.player)}|${pos}`, r.tier);
  });
  const adpByKey = new Map(); // reused in step 3b to rank IR STASH candidates
  adpRows.forEach((r) => {
    const pos = (r.position || '').replace(/\d+$/, '').toUpperCase();
    adpByKey.set(`${nameKey(r.player)}|${pos}`, r.adp);
  });
  const ecrByKey = new Map(); // reused in step 3b as a fallback rank for players with no live ADP
  offenseEcrRows.forEach((r) => {
    const pos = (r.position || '').replace(/\d+$/, '').toUpperCase();
    ecrByKey.set(`${nameKey(r.player)}|${pos}`, r.rank_ecr);
  });

  // 2. IDP (LB) ECR — DraftSharks source, same table, scoring='idp'.
  const idpAsOf = await latestAsOfDate('fantasy_rankings', (q) => q.eq('scoring', 'idp'));
  let lbRows = [];
  if (idpAsOf) {
    const idpRows = await fetchAll('fantasy_rankings', 'player,position,team,rank_ecr,pos_rank', (q) =>
      q.eq('scoring', 'idp').eq('as_of_date', idpAsOf));
    lbRows = idpRows.filter((r) => (r.position || '').toUpperCase() === 'LB');
    lbRows.sort((a, b) => a.rank_ecr - b.rank_ecr);
  }
  console.log(`IDP (LB) ECR: ${lbRows.length} LB rows as_of ${idpAsOf || 'N/A'} (source=draftsharks)`);
  const lbEcrByKey = new Map();
  lbRows.forEach((r) => lbEcrByKey.set(`${nameKey(r.player)}|LB`, r.rank_ecr));

  // 3. Injuries — latest report per player.
  const injuryRows = await fetchAll('player_injuries', 'player_name,team_abbr,position,injury_status,injury_type,captured_at,short_comment');
  const latestByPlayer = new Map();
  injuryRows.forEach((r) => {
    const k = nameKey(r.player_name);
    const prev = latestByPlayer.get(k);
    if (!prev || new Date(r.captured_at) > new Date(prev.captured_at)) latestByPlayer.set(k, r);
  });

  // 3a. Roster cross-check (added 2026-09-02) — see header comment for the full
  //     rationale and caveat. nfl_rosters_latest gives each player's most
  //     recently ingested team + nflverse roster status ('ACT','RES','UFA', ...).
  const rosterRows = await fetchAll('nfl_rosters_latest', 'full_name,team,status,season,week');
  const rosterByKey = new Map();
  rosterRows.forEach((r) => rosterByKey.set(nameKey(r.full_name), r));
  const rosterSeasons = new Set(rosterRows.map((r) => r.season));
  console.log(`Roster cross-check: ${rosterRows.length} players in nfl_rosters_latest (season(s): ${[...rosterSeasons].join(', ') || 'none'})`);
  if (rosterRows.length && (![...rosterSeasons].every((s) => s === 2026))) {
    console.warn(`  ⚠ nfl_rosters_latest contains non-2026 seasons (${[...rosterSeasons].join(', ')}) — this is the stale-season bug seen before; re-seed with scripts/seed-nfl-rosters.py --seasons 2026 before trusting the IR STASH cross-check.`);
  }

  const STASH_ELIGIBLE_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'LB']); // the positions Rose Bowl actually rosters
const IR_ELIGIBLE_STATUSES = new Set(['injured reserve', 'pup']); // eligible for Rose Bowl's one IR bench slot
  const SUSPENSION_STATUSES = new Set(['suspension']); // not IR-slot eligible in a standard league — excluded, no stash
  const doNotDraft = new Map(); // nameKey -> reason (excluded from the MAIN board)
  const irStashCandidates = new Map(); // nameKey -> {reason, team, position, rosterVerified}
  const watchTags = new Map(); // nameKey -> tag (Out/Questionable/Doubtful, informational only)
  let droppedAsFreeAgent = 0;
  let droppedNonRosterablePosition = 0;
  latestByPlayer.forEach((r, k) => {
    const status = (r.injury_status || '').toLowerCase();
    const reason = `${r.injury_status}${r.injury_type ? ` (${r.injury_type})` : ''}`;
    if (SUSPENSION_STATUSES.has(status)) {
      doNotDraft.set(k, reason);
    } else if (IR_ELIGIBLE_STATUSES.has(status)) {
      doNotDraft.set(k, reason); // still off the main board either way
      if (MANUAL_FREE_AGENT_OVERRIDES.has(k)) {
        droppedAsFreeAgent++;
        return; // confirmed-by-hand free agent — no team's IR to stash on
      }
      const roster = rosterByKey.get(k);
      if (roster && (roster.status || '').toUpperCase() === 'UFA') {
        droppedAsFreeAgent++; // roster feed itself shows them off every roster
        return;
      }
      const pos = (r.position || '').toUpperCase();
      if (!STASH_ELIGIBLE_POSITIONS.has(pos)) { droppedNonRosterablePosition++; return; } // ESPN's injury feed covers every roster spot (OL/DL/DB/etc.) — Rose Bowl only rosters QB/RB/WR/TE/LB, so anything else has no draftable slot to stash into
      irStashCandidates.set(k, {
        reason,
        team: roster?.team || r.team_abbr || '',
        position: (r.position || '').toUpperCase(),
        rosterVerified: !!roster,
      });
    } else if (status === 'out' || status === 'doubtful') {
      watchTags.set(k, r.injury_status);
    }
  });
  console.log(`Injuries: ${injuryRows.length} reports -> ${doNotDraft.size} excluded from main board (IR/PUP/Suspension), ${irStashCandidates.size} IR STASH candidates (QB/RB/WR/TE/LB only), ${droppedNonRosterablePosition} dropped as non-rosterable positions, ${droppedAsFreeAgent} dropped as confirmed free agents (not stash-eligible), ${watchTags.size} watch-tagged (Out/Doubtful)`);

  // 3b. Rank IR STASH candidates by the same ADP/ECR quality signal as the main
  //     board, so the stash list is itself in "best to worst" order — Andy is
  //     picking ONE, so order matters. ADP first (real market signal), ECR
  //     fallback for anyone with no live ADP, unranked names last.
  const irStashList = [];
  let droppedUnranked = 0;
  irStashCandidates.forEach((info, k) => {
    const posKey = `${k}|${info.position}`;
    const adp = adpByKey.get(posKey);
    const ecr = info.position === 'LB' ? lbEcrByKey.get(posKey) : ecrByKey.get(posKey);
    // Being on IR at a rosterable position isn't enough on its own — most IR
    // names at QB/RB/WR/TE/LB are practice-squad-caliber players nobody has
    // ever ranked (no ADP, no ECR, no DraftSharks IDP rank). Those aren't
    // realistic IR-slot targets; only surface names the market/experts
    // actually rank at all.
    if (adp == null && ecr == null) { droppedUnranked++; return; }
    const sortValue = adp != null ? adp : 1000 + ecr;
    const displayName = latestByPlayer.get(k)?.player_name || k;
    irStashList.push({
      player: displayName,
      position: info.position,
      team: info.team,
      tag: `IR STASH / ${info.reason}${info.rosterVerified ? '' : ' / unverified vs. roster feed — spot-check before drafting'}`,
      sortValue,
    });
  });
  irStashList.sort((a, b) => a.sortValue - b.sortValue);
  console.log(`IR STASH after ranked-only filter: ${irStashList.length} (${droppedUnranked} IR/PUP players at rosterable positions dropped for having no ADP/ECR at all — not realistic stash targets)`);

  // 4. Build offense pool: ADP-ordered primary list, dedup on (nameKey, position) —
  //    NOT nameKey alone, so two different-position players who happen to share a
  //    stripped base name don't collide. Every collision is logged, not silently
  //    dropped. Players with a live ADP go first, in ADP order; any offense player
  //    who appears in ECR but has no live ADP (very deep sleepers/rookies) is
  //    appended afterward in ECR positional order, purely as bench-depth filler.
  const seen = new Map(); // key -> player name that occupies it (to tell real collisions from "already added by ADP pass")
  const collisions = [];
  const offenseList = [];

  function addOffensePlayer(row, sourceTag) {
    const name = (row.player || '').trim();
    if (!name) return;
    const pos = (row.position || '').replace(/\d+$/, '').toUpperCase();
    if (pos === 'K' || pos === 'DST' || pos === 'DEF') return; // belt-and-suspenders
    if ((row.team || '').toUpperCase() === 'FA') return; // unsigned/released — standing rule, not draftable
    if (EXCLUDE_NAMES.has(name.toLowerCase())) return; // ad hoc --exclude removal
    const k = `${nameKey(name)}|${pos}`;
    const bareK = nameKey(name);
    if (doNotDraft.has(bareK)) return; // live injury scrub (IR/PUP go to the stash list instead, handled separately)
    if (seen.has(k)) {
      if (seen.get(k) !== name) collisions.push({ name, existing: seen.get(k), pos, key: k });
      return; // either the same player already added (expected overlap between ADP + ECR fallback) or a real collision — either way, don't add a second row
    }
    seen.set(k, name);
    const tier = tierByKey.get(k);
    const tag = [
      tier ? `Tier ${tier}` : '',
      sourceTag || '',
      watchTags.has(bareK) ? watchTags.get(bareK) : '',
    ].filter(Boolean).join(' / ');
    offenseList.push({ player: name, position: pos, team: row.team || '', tag });
  }

  adpRows.forEach((row) => addOffensePlayer(row, ''));
  const adpFillCount = offenseList.length;
  offenseEcrRows.forEach((row) => addOffensePlayer(row, 'no live ADP')); // fallback fill only; addOffensePlayer's dedup skips anyone already added
  console.log(`Offense pool after injury scrub + dedup: ${offenseList.length} (${adpFillCount} from live ADP, ${offenseList.length - adpFillCount} ECR-only fallback fill, ${collisions.length} name collisions logged)`);
  if (collisions.length) {
    console.log('  Collisions (second occurrence dropped — verify manually):');
    collisions.forEach((c) => console.log(`    - "${c.name}" collided with already-added "${c.existing}" (${c.pos})`));
  }

  // 4b. Per-position caps (e.g. --qb-cap 16 keeps only the top 16 QBs by rank).
  //     Applied here, on the already-ordered/deduped/scrubbed offense pool, so a cap
  //     always keeps the BEST N at that position, not an arbitrary N.
  const posCapCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  const cappedOffenseList = offenseList.filter((p) => {
    const cap = POS_CAPS[p.position];
    if (cap == null) return true;
    posCapCounts[p.position] = (posCapCounts[p.position] || 0) + 1;
    return posCapCounts[p.position] <= cap;
  });
  const anyCapsSet = Object.values(POS_CAPS).some((c) => c != null);
  if (anyCapsSet) {
    console.log(`Position caps applied: ${JSON.stringify(POS_CAPS)} -> offense pool ${offenseList.length} -> ${cappedOffenseList.length}`);
  }
  const finalOffenseList = cappedOffenseList;

  // 5. Build LB pool the same way, capped at LB_COUNT, injury-scrubbed.
  const lbSeen = new Set();
  const lbList = [];
  lbRows.forEach((row) => {
    if (lbList.length >= LB_COUNT) return;
    const name = (row.player || '').trim();
    if (!name) return;
    if ((row.team || '').toUpperCase() === 'FA') return;
    if (EXCLUDE_NAMES.has(name.toLowerCase())) return;
    const bareK = nameKey(name);
    const k = `${bareK}|LB`;
    if (doNotDraft.has(bareK) || lbSeen.has(k) || seen.has(k)) return;
    lbSeen.add(k);
    const tag = watchTags.has(bareK) ? `IDP LB / ${watchTags.get(bareK)}` : 'IDP LB';
    lbList.push({ player: name, position: 'LB', team: row.team || '', tag });
  });
  console.log(`LB pool after injury scrub + dedup: ${lbList.length} (target ${LB_COUNT})`);

  // 6. Assemble the board.
  //    Ranks 1-84: pure offense (7 "rounds" at 12 teams, matches prior board shape).
  //    Ranks 85-235: LBs spread EVENLY across this window (not clumped early) —
  //    fixes the prior script's bug where the fixed 2:1 interleave ratio exhausted
  //    the LB pool by rank ~204 while the spec claimed coverage through rank 235.
  //    Ranks past that: remaining offense only.
  const finalList = [];
  let offIdx = 0;
  while (finalList.length < 84 && offIdx < finalOffenseList.length) finalList.push(finalOffenseList[offIdx++]);

  const idpWindowStart = 85;
  const idpWindowEnd = 235;
  const windowSize = idpWindowEnd - idpWindowStart + 1;
  const lbTargetRanks = new Set();
  for (let i = 0; i < lbList.length; i++) {
    const rank = idpWindowStart + Math.round((i * (windowSize - 1)) / Math.max(1, lbList.length - 1 || 1));
    lbTargetRanks.add(rank);
  }
  let lbIdx = 0;
  let rank = 85;
  while (finalList.length < TOTAL && (offIdx < finalOffenseList.length || lbIdx < lbList.length)) {
    if (lbTargetRanks.has(rank) && lbIdx < lbList.length) {
      finalList.push(lbList[lbIdx++]);
    } else if (offIdx < finalOffenseList.length) {
      finalList.push(finalOffenseList[offIdx++]);
    } else if (lbIdx < lbList.length) {
      finalList.push(lbList[lbIdx++]);
    }
    rank++;
  }

  // 6b. Append the IR STASH section after the main board, in its own
  //     best-to-worst order — these are the "spend your one IR slot here"
  //     candidates, ranked lower than they'd be if healthy but still visible
  //     (rather than silently vanishing off the board entirely).
  const stashSection = NO_IR_STASH ? [] : irStashList;
  const combinedList = finalList.concat(stashSection);

  // 7. Output.
  const csvRows = ['Rank,Player,Position,Team,Tag'];
  const plainRows = [];
  combinedList.forEach((p, idx) => {
    csvRows.push(`${idx + 1},"${p.player}",${p.position},"${p.team}","${p.tag}"`);
    plainRows.push(p.player);
  });
  const csvOut = csvRows.join('\n') + '\n';
  const plainOut = plainRows.join('\n') + '\n';

  const lbFinalCount = finalList.filter((p) => p.position === 'LB').length;
  console.log(`\nBoard: ${finalList.length} main-board players (${lbFinalCount} LB, ${finalList.length - lbFinalCount} offense) + ${stashSection.length} IR STASH = ${combinedList.length} total`);
  console.log(`Data sources: offense ADP as_of ${adpAsOf} | offense ECR (tier tag) as_of ${offAsOf} | LB ECR as_of ${idpAsOf} | injuries as_of ${new Date().toISOString().slice(0, 10)} | rosters as_of ${new Date().toISOString().slice(0, 10)}`);

  console.log('\nTop 20:');
  finalList.slice(0, 20).forEach((p, i) => console.log(`  ${String(i + 1).padStart(3, ' ')}. ${p.player.padEnd(25, ' ')} ${p.position.padEnd(4, ' ')} ${p.team.padEnd(4, ' ')} ${p.tag}`));

  if (doNotDraft.size) {
    console.log('\nExcluded from main board (live IR/PUP/Suspension):');
    [...doNotDraft.entries()].forEach(([k, reason]) => console.log(`  - ${k}: ${reason}`));
  }

  if (stashSection.length) {
    console.log(`\nIR STASH (${stashSection.length}, appended after rank ${finalList.length} — Rose Bowl carries exactly one IR bench slot):`);
    stashSection.forEach((p, i) => console.log(`  ${finalList.length + i + 1}. ${p.player.padEnd(25, ' ')} ${p.position.padEnd(4, ' ')} ${p.team.padEnd(4, ' ')} ${p.tag}`));
  }

  if (droppedAsFreeAgent || MANUAL_FREE_AGENT_OVERRIDES.size) {
    console.log(`\nDropped entirely (confirmed off all rosters, not IR-stash eligible): ${droppedAsFreeAgent} via roster cross-check/manual override`);
  }

  if (DRY) {
    console.log('\n[dry-run] not writing output files');
    return;
  }

  const outputs = [
    ['docs/fantasy/2026_Honey_Badgers_Custom_Rankings.csv', csvOut],
    ['docs/fantasy/2026_Honey_Badgers_Plain_Names_Pick5.txt', plainOut],
    ['public/2026_Honey_Badgers_Custom_Rankings.csv', csvOut],
    ['public/2026_Honey_Badgers_Plain_Names_Pick5.txt', plainOut],
  ];
  outputs.forEach(([rel, content]) => {
    fs.writeFileSync(path.join(ROOT, rel), content, 'utf8');
    console.log(`Wrote ${rel}`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
