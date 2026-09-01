// agents/fantasy-rose-bowl-build.js
// Rose Bowl (redraft, no keepers, Full PPR, real LB/IDP slots) custom draft board.
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
//       -> DO-NOT-DRAFT scrub. Excludes injury_status IN ('Injured Reserve','PUP',
//          'Suspension') using each player's MOST RECENT report (captured_at desc).
//          'Out'/'Questionable'/'Doubtful' are NOT auto-excluded (week-to-week status
//          isn't a season-ending signal) but are tagged in the output for visibility.
//
// Every run refreshes itself against whatever is latest in the DB as of run time —
// no hardcoded player lists, no static local CSV snapshots. Re-run the 3 ingest
// agents first (fantasypros-rankings-ingest.js --scoring ppr, fantasypros-adp-ingest.js,
// draftsharks-idp-ingest.js, injury-ingest.js) to refresh before drafting.
//
// Usage:
//   node agents/fantasy-rose-bowl-build.js [--lbs 40] [--total 280] [--dry-run]
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
  adpRows.sort((a, b) => a.adp - b.adp);
  console.log(`Offense ADP (overall, cross-position): ${adpRows.length} rows as_of ${adpAsOf}`);

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

  // 3. Injuries — latest report per player, DO-NOT-DRAFT set from structured status.
  const injuryRows = await fetchAll('player_injuries', 'player_name,team_abbr,injury_status,injury_type,captured_at,short_comment');
  const latestByPlayer = new Map();
  injuryRows.forEach((r) => {
    const k = nameKey(r.player_name);
    const prev = latestByPlayer.get(k);
    if (!prev || new Date(r.captured_at) > new Date(prev.captured_at)) latestByPlayer.set(k, r);
  });
  const SEASON_ENDING_STATUSES = new Set(['injured reserve', 'pup', 'suspension']);
  const doNotDraft = new Map(); // nameKey -> reason
  const watchTags = new Map(); // nameKey -> tag (Out/Questionable/Doubtful, informational only)
  latestByPlayer.forEach((r, k) => {
    const status = (r.injury_status || '').toLowerCase();
    if (SEASON_ENDING_STATUSES.has(status)) {
      doNotDraft.set(k, `${r.injury_status}${r.injury_type ? ` (${r.injury_type})` : ''}`);
    } else if (status === 'out' || status === 'doubtful') {
      watchTags.set(k, r.injury_status);
    }
  });
  console.log(`Injuries: ${injuryRows.length} reports -> ${doNotDraft.size} DO-NOT-DRAFT (live IR/PUP/Suspension), ${watchTags.size} watch-tagged (Out/Doubtful)`);

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
    const k = `${nameKey(name)}|${pos}`;
    const bareK = nameKey(name);
    if (doNotDraft.has(bareK)) return; // live injury scrub
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

  // 5. Build LB pool the same way, capped at LB_COUNT, injury-scrubbed.
  const lbSeen = new Set();
  const lbList = [];
  lbRows.forEach((row) => {
    if (lbList.length >= LB_COUNT) return;
    const name = (row.player || '').trim();
    if (!name) return;
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
  while (finalList.length < 84 && offIdx < offenseList.length) finalList.push(offenseList[offIdx++]);

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
  while (finalList.length < TOTAL && (offIdx < offenseList.length || lbIdx < lbList.length)) {
    if (lbTargetRanks.has(rank) && lbIdx < lbList.length) {
      finalList.push(lbList[lbIdx++]);
    } else if (offIdx < offenseList.length) {
      finalList.push(offenseList[offIdx++]);
    } else if (lbIdx < lbList.length) {
      finalList.push(lbList[lbIdx++]);
    }
    rank++;
  }

  // 7. Output.
  const csvRows = ['Rank,Player,Position,Team,Tag'];
  const plainRows = [];
  finalList.forEach((p, idx) => {
    csvRows.push(`${idx + 1},"${p.player}",${p.position},"${p.team}","${p.tag}"`);
    plainRows.push(p.player);
  });
  const csvOut = csvRows.join('\n') + '\n';
  const plainOut = plainRows.join('\n') + '\n';

  console.log(`\nBoard: ${finalList.length} players (${finalList.filter((p) => p.position === 'LB').length} LB, ${finalList.length - finalList.filter((p) => p.position === 'LB').length} offense)`);
  console.log(`Data sources: offense ADP as_of ${adpAsOf} | offense ECR (tier tag) as_of ${offAsOf} | LB ECR as_of ${idpAsOf} | injuries as_of ${new Date().toISOString().slice(0, 10)}`);

  console.log('\nTop 20:');
  finalList.slice(0, 20).forEach((p, i) => console.log(`  ${String(i + 1).padStart(3, ' ')}. ${p.player.padEnd(25, ' ')} ${p.position.padEnd(4, ' ')} ${p.team.padEnd(4, ' ')} ${p.tag}`));

  if (doNotDraft.size) {
    console.log('\nDO-NOT-DRAFT (live IR/PUP/Suspension, excluded from board):');
    [...doNotDraft.entries()].forEach(([k, reason]) => console.log(`  - ${k}: ${reason}`));
  }

  if (DRY) {
    console.log('\n[dry-run] not writing output files');
    return;
  }

  const outputs = [
    ['docs/fantasy/2026_Rose_Bowl_Custom_Rankings.csv', csvOut],
    ['docs/fantasy/2026_Rose_Bowl_Plain_Names.txt', plainOut],
    ['public/2026_Rose_Bowl_Custom_Rankings.csv', csvOut],
    ['public/2026_Rose_Bowl_Plain_Names.txt', plainOut],
  ];
  outputs.forEach(([rel, content]) => {
    fs.writeFileSync(path.join(ROOT, rel), content, 'utf8');
    console.log(`Wrote ${rel}`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
