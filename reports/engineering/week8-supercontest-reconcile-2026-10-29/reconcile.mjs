import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { normTeam, TEAM_NAMES } from '../../../scripts/lib/pickem.mjs';
import { writeFileAtomic } from '../../../scripts/lib/atomic-file-write.js';

const root = process.cwd();
const out = path.join(root, 'reports/engineering/week8-supercontest-reconcile-2026-10-29');
const sheetPath = path.join(root, 'data/supercontest/week-08-lines.json');
const latestPath = path.join(root, 'data/supercontest/latest.json');
const oddsPath = path.join(root, 'data/generated/props/betonline-live-2026-10-29-week8.json');
const hash = value => createHash('sha256').update(value).digest('hex');
const [sheetBytes, oldLatest, oddsBytes] = await Promise.all([fs.readFile(sheetPath), fs.readFile(latestPath), fs.readFile(oddsPath)]);
const sheet = JSON.parse(sheetBytes), old = JSON.parse(oldLatest), odds = JSON.parse(oddsBytes);
const nicknameToAbbr = Object.fromEntries(Object.entries(TEAM_NAMES).map(([abbr,name]) => [name.split(' ').at(-1).toUpperCase(),abbr]));
const team = value => nicknameToAbbr[String(value).toUpperCase()] || normTeam(value);
// Transcribed from Westgate's public 2026 Week 8 selection sheet. Home team follows @.
const official = [
  ['CAR','GB','GB',-3.5], ['MIN','DET','DET',-3.5], ['LV','NYJ','NYJ',-1.5],
  ['ARI','DAL','DAL',-6.5], ['ATL','TB','TB',-2.5], ['BAL','BUF','BUF',-3.5],
  ['IND','JAX','JAX',-9.5], ['TEN','CIN','CIN',-10.5], ['CLE','PIT','PIT',-3.5],
  ['LAC','LAR','LAR',-6.5], ['KC','DEN','KC',-1], ['NE','MIA','NE',-7],
  ['PHI','WSH','WSH',-5.5], ['CHI','SEA','SEA',-3],
];
if (sheet.week !== 8 || sheet.season !== 2026 || sheet.games.length !== 14 || sheet.game_count !== 14) throw Error('Invalid local sheet identity or count');
const rows = [];
for (const [away, home, favorite, line] of official) {
  const matches = sheet.games.filter(g => normTeam(g.favorite_abbr) === favorite && normTeam(g.underdog_abbr) === (favorite === home ? away : home));
  if (matches.length !== 1 || team(matches[0].home_team) !== home || team(matches[0].away_team) !== away || matches[0].contest_line !== line) throw Error(`Official sheet mismatch: ${away}@${home}`);
  const prices = odds.rows.filter(r => r.market === 'game_lines' && r.bet === 'spread' && r.marketTitle === 'Game Spread' && r.available !== false && (r.event || '').split(' @ ').map(normTeam).join('@') === `${away}@${home}`);
  const fav = prices.filter(r => normTeam(r.side || r.team) === favorite);
  if (prices.length !== 2 || fav.length !== 1 || !Number.isFinite(fav[0].line)) throw Error(`Missing/ambiguous BEO spread: ${away}@${home}`);
  rows.push({away,home,favorite,contest_line:line,beo_favorite_line:fav[0].line,beo_favorite_odds:fav[0].odds,contest_minus_beo_favorite_line:Number((line-fav[0].line).toFixed(1)),source_url:fav[0].eventUrl});
}
if (new Set(rows.map(x => x.away+'@'+x.home)).size !== 14) throw Error('Duplicate matchup');
if (old.season !== 2026 || old.week !== 7) throw Error('Latest pointer changed; stop rather than overwrite');
await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out, 'latest-before.json'), oldLatest, {flag:'wx'});
for (const [file, expected] of [[sheetPath,sheetBytes],[latestPath,oldLatest],[oddsPath,oddsBytes]]) {
  if (hash(await fs.readFile(file)) !== hash(expected)) throw Error(`Input changed during reconciliation: ${file}`);
}
await writeFileAtomic(latestPath, sheetBytes.toString('utf8'));
if (hash(await fs.readFile(latestPath)) !== hash(sheetBytes)) throw Error('Latest pointer verification failed');
const receipt={verified_at:new Date().toISOString(),official_url:'https://www.westgateresorts.com/supercontest/download/2026%20SUPERCONTEST%20GAME%20SHEET%20WEEK%208.pdf?contest=/2026/SuperContest/Card',official_validation:'14 matchups, favorite, spread and home/away agree',sheet_captured_at:sheet.captured_at,sheet_sha256:hash(sheetBytes),latest_before_sha256:hash(oldLatest),latest_after_sha256:hash(sheetBytes),beo_captured_at:odds.capturedAt,beo_sha256:hash(oddsBytes),rows,live_market_claim:false,closing_line_claim:false,supabase_actions:0,paid_calls:0,account_actions:0};
await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
const lines=['# Week 8 SuperContest source reconciliation','','The saved Week 8 sheet matches all 14 matchups, favorites, home teams and spreads on [Westgate’s official Week 8 sheet]('+receipt.official_url+'). The local `latest.json` pointer was updated from Week 7 to the existing Week 8 file; the prior pointer is backed up here.','','The market values below are the **saved BetOnline capture from 10:10 AM Pacific on October 29**. They are historical observations, not current executable offers or closing lines. A positive difference favors the contest favorite; a negative difference favors the contest underdog. Prices can move.','','| Matchup | Contest favorite line | Saved BEO favorite line | Difference (contest minus BEO) |','|---|---:|---:|---:|'];
for(const x of rows) lines.push(`| ${x.away} @ ${x.home} | ${x.favorite} ${x.contest_line} | ${x.favorite} ${x.beo_favorite_line} (${x.beo_favorite_odds > 0 ? '+' : ''}${x.beo_favorite_odds}) | ${x.contest_minus_beo_favorite_line > 0 ? '+' : ''}${x.contest_minus_beo_favorite_line} |`);
lines.push('','The separately saved DraftKings/FanDuel comparison is labeled Week 8 but its underlying snapshot was captured **October 28 at 2:00 PM Pacific**, before the manual Week 8 sheet capture. Its `synced_at` timestamp on October 29 does not make the underlying odds fresh; its `clv` fields are differences against that historical snapshot, not verified closing-line value.','', 'The full live Thursday cadence has not been rerun or certified. There were no Supabase, account, wager, ledger or paid operations in this reconciliation.');
await fs.writeFile(path.join(out,'README.md'),lines.join('\n')+'\n',{flag:'wx'});
console.log(JSON.stringify({verified:rows.length,latest_from:old.week,latest_to:sheet.week,beo_captured_at:odds.capturedAt,rows:rows.map(x=>({game:x.away+'@'+x.home,difference:x.contest_minus_beo_favorite_line}))},null,2));
