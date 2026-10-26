#!/usr/bin/env node
/** Build report-only Week 7 game/team/player exports from saved ESPN boxscores. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const WEEK = 7;
const SEASON = 2026;
const schedulePath = path.join(ROOT, 'public/schedule.json');
const boxDir = path.join(ROOT, 'data/fantasy/boxscores');
const outDir = path.join(ROOT, 'reports/analysis/week7-postmortem');
const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'))
  .filter((game) => Number(game.season) === SEASON && Number(game.week) === WEEK);
if (schedule.length !== 14) throw new Error(`Expected 14 scheduled games for 2026 W${WEEK}; found ${schedule.length}`);

const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csv = (rows, fields) => [fields.join(','), ...rows.map((row) => fields.map((field) => quote(row[field])).join(','))].join('\n') + '\n';
const number = (value) => {
  const n = Number(String(value ?? '').replaceAll(',', '').trim());
  return Number.isFinite(n) ? n : null;
};
const compStat = (stats, name) => stats.find((item) => item.name === name)?.displayValue ?? '';
const report = (lines) => `${lines.join('\n').trimEnd()}\n`;

const games = [];
const teamRows = [];
const playerRows = [];
const scoringRows = [];
for (const listed of schedule) {
  const file = path.join(boxDir, `espn-${listed.id}.json`);
  const base = { season: SEASON, week: WEEK, event_id: listed.id, away: listed.visitor, home: listed.home, kickoff_utc: listed.kickoff_utc };
  if (!fs.existsSync(file)) {
    games.push({ ...base, status: 'PENDING_BOX_SCORE', away_score: '', home_score: '', total_points: '', margin: '', boxscore_file: '' });
    continue;
  }
  const box = JSON.parse(fs.readFileSync(file, 'utf8'));
  const header = box.header || {};
  const comp = header.competitions?.[0];
  if (Number(header.season?.year) !== SEASON || Number(header.week?.number ?? header.week) !== WEEK || String(comp?.id) !== String(listed.id)) {
    throw new Error(`Snapshot identity mismatch for event ${listed.id}: ${file}`);
  }
  const isFinal = comp.status?.type?.completed === true || comp.status?.type?.name === 'STATUS_FINAL';
  if (!isFinal) {
    games.push({ ...base, status: 'PENDING', away_score: '', home_score: '', total_points: '', margin: '', boxscore_file: path.relative(ROOT, file) });
    continue;
  }
  const awayComp = comp.competitors.find((team) => team.homeAway === 'away');
  const homeComp = comp.competitors.find((team) => team.homeAway === 'home');
  if (!awayComp || !homeComp) throw new Error(`Missing competitors in event ${listed.id}`);
  const awayScore = number(awayComp.score);
  const homeScore = number(homeComp.score);
  const game = `${listed.visitor}@${listed.home}`;
  const snapshotUpdatedAt = box.meta?.lastUpdatedAt || '';
  const totalPoints = awayScore + homeScore;
  const margin = Math.abs(awayScore - homeScore);
  games.push({ ...base, game, status: 'FINAL', away_score: awayScore, home_score: homeScore, total_points: totalPoints, margin, snapshot_updated_at: snapshotUpdatedAt, boxscore_file: path.relative(ROOT, file) });

  const statByTeam = new Map((box.boxscore?.teams || []).map((team) => [team.team?.abbreviation, team.statistics || []]));
  for (const teamComp of [awayComp, homeComp]) {
    const team = teamComp.team?.abbreviation;
    const opponent = team === listed.visitor ? listed.home : listed.visitor;
    const stats = statByTeam.get(team) || [];
    const record = {
      season: SEASON, week: WEEK, event_id: listed.id, game, snapshot_updated_at: snapshotUpdatedAt, team, opponent,
      home_away: teamComp.homeAway, score: number(teamComp.score),
    };
    for (const key of ['firstDowns', 'thirdDownEff', 'fourthDownEff', 'totalOffensivePlays', 'totalYards', 'yardsPerPlay', 'netPassingYards', 'completionAttempts', 'yardsPerPass', 'interceptions', 'sacksYardsLost', 'rushingYards', 'rushingAttempts', 'yardsPerRushAttempt', 'redZoneAttempts', 'totalPenaltiesYards', 'turnovers', 'fumblesLost', 'possessionTime']) {
      record[key] = compStat(stats, key);
    }
    teamRows.push(record);
  }

  for (const unit of box.boxscore?.players || []) {
    const playerTeam = unit.team?.abbreviation || '';
    for (const group of unit.statistics || []) {
      for (const athlete of group.athletes || []) {
        const who = athlete.athlete;
        if (!who?.displayName) continue;
        for (let i = 0; i < (group.keys || []).length; i += 1) {
          playerRows.push({
            season: SEASON, week: WEEK, event_id: listed.id, game, snapshot_updated_at: snapshotUpdatedAt, team: playerTeam,
            player: who.displayName, position: who.position?.abbreviation || '',
            stat_group: group.name || '', stat_name: group.keys[i], stat_value: athlete.stats?.[i] ?? '',
          });
        }
      }
    }
  }
  for (const play of box.scoringPlays || []) {
    const scoringTeam = play.team?.abbreviation || play.scoringTeam?.abbreviation || '';
    scoringRows.push({
      season: SEASON, week: WEEK, event_id: listed.id, game, snapshot_updated_at: snapshotUpdatedAt,
      period: play.period?.number ?? '', clock: play.clock?.displayValue ?? play.clock ?? '',
      team: scoringTeam, type: play.scoringType?.name || '',
      score: play.awayScore != null && play.homeScore != null ? `${play.awayScore}-${play.homeScore}` : '',
      description: play.text || '',
    });
  }
}

const finalGames = games.filter((game) => game.status === 'FINAL');
const pendingGames = games.filter((game) => game.status !== 'FINAL');
if (finalGames.length + pendingGames.length !== 14) throw new Error('Week 7 event coverage is incomplete');
const teamMetric = (team, key) => number(team[key]);
const sortedTeams = (key, limit = 5, low = false) => {
  const ordered = [...teamRows].sort((a, b) => (low ? teamMetric(a, key) - teamMetric(b, key) : teamMetric(b, key) - teamMetric(a, key)));
  return ordered.slice(0, limit);
};
const playerTotals = new Map();
for (const row of playerRows) {
  const key = `${row.event_id}|${row.team}|${row.player}`;
  if (!playerTotals.has(key)) playerTotals.set(key, { game: row.game, event_id: row.event_id, team: row.team, player: row.player, position: row.position, stats: {} });
  const player = playerTotals.get(key);
  const value = number(row.stat_value);
  if (value != null) player.stats[row.stat_name] = value;
}
const playerLeaders = (stat, limit = 5) => [...playerTotals.values()]
  .filter((player) => Number(player.stats[stat]) > 0)
  .sort((a, b) => b.stats[stat] - a.stats[stat])
  .slice(0, limit);
const topRows = (rows, key) => rows.map((row) => `| ${row.team} | ${row.opponent} | ${row[key]} |`).join('\n');
const topPlayers = (stat) => playerLeaders(stat).map((player) => `| ${player.player} (${player.team}) | ${player.game} | ${player.stats[stat]} |`).join('\n');

const sum = (key) => teamRows.reduce((total, team) => total + (teamMetric(team, key) ?? 0), 0);
const totalPoints = finalGames.reduce((total, game) => total + Number(game.total_points), 0);
const totalYards = sum('totalYards');
const passYards = sum('netPassingYards');
const rushYards = sum('rushingYards');
const turnovers = sum('turnovers');
const homeWins = finalGames.filter((game) => game.home_score > game.away_score).length;
const awayWins = finalGames.filter((game) => game.away_score > game.home_score).length;
const ties = finalGames.length - homeWins - awayWins;
const thirdDown = teamRows.map((team) => String(team.thirdDownEff).match(/^(\d+)-(\d+)$/)).filter(Boolean)
  .reduce((total, match) => ({ made: total.made + Number(match[1]), att: total.att + Number(match[2]) }), { made: 0, att: 0 });
const sortedGames = [...finalGames].sort((a, b) => b.total_points - a.total_points);
const closeGames = finalGames.filter((game) => game.margin <= 8).length;
const blowouts = finalGames.filter((game) => game.margin >= 20).length;
const gameLines = games.map((game) => `| ${game.game || `${game.away}@${game.home}`} | ${game.status === 'FINAL' ? `${game.away_score}–${game.home_score}` : 'Pending'} | ${game.status === 'FINAL' ? game.total_points : '—'} | ${game.status === 'FINAL' ? game.margin : '—'} |`).join('\n');

fs.mkdirSync(outDir, { recursive: true });
const gameFields = ['season','week','event_id','game','status','kickoff_utc','away','home','away_score','home_score','total_points','margin','snapshot_updated_at','boxscore_file'];
const teamFields = ['season','week','event_id','game','snapshot_updated_at','team','opponent','home_away','score','firstDowns','thirdDownEff','fourthDownEff','totalOffensivePlays','totalYards','yardsPerPlay','netPassingYards','completionAttempts','yardsPerPass','interceptions','sacksYardsLost','rushingYards','rushingAttempts','yardsPerRushAttempt','redZoneAttempts','totalPenaltiesYards','turnovers','fumblesLost','possessionTime'];
const playerFields = ['season','week','event_id','game','snapshot_updated_at','team','player','position','stat_group','stat_name','stat_value'];
const scoringFields = ['season','week','event_id','game','snapshot_updated_at','period','clock','team','type','score','description'];
fs.writeFileSync(path.join(outDir, 'espn-game-results-2026-10-26.csv'), csv(games, gameFields));
fs.writeFileSync(path.join(outDir, 'espn-team-stats-2026-10-26.csv'), csv(teamRows, teamFields));
fs.writeFileSync(path.join(outDir, 'espn-player-stats-long-2026-10-26.csv'), csv(playerRows, playerFields));
fs.writeFileSync(path.join(outDir, 'espn-scoring-plays-2026-10-26.csv'), csv(scoringRows, scoringFields));

const reportLines = [
  '# Week 7 football results and statistics — provisional, 2026-10-26',
  '',
  `**Coverage:** ${finalGames.length}/14 games final; ${pendingGames.map((game) => `${game.away}@${game.home}`).join(', ') || 'none'} pending. Data is from saved ESPN boxscore snapshots and is not a betting-ledger re-grade.`,
  '',
  '## Scoreboard and game shape',
  '',
  '| Game | Final | Points | Margin |',
  '|---|---:|---:|---:|',
  gameLines,
  '',
  `Across ${finalGames.length} completed games: **${totalPoints} points** (${(totalPoints / finalGames.length).toFixed(1)} per game), **${closeGames} one-score finishes** (margin ≤ 8), and **${blowouts} games decided by 20+**. The highest total was ${sortedGames[0]?.game} (${sortedGames[0]?.total_points}); the lowest was ${sortedGames.at(-1)?.game} (${sortedGames.at(-1)?.total_points}).`,
  '',
  `Home teams went ${homeWins}–${awayWins}${ties ? `–${ties}` : ''} against visitors.`,
  '',
  '## Team production',
  '',
  `The 26 teams combined for **${totalYards.toLocaleString('en-US')} yards** (${(totalYards / 26).toFixed(1)} per team), including ${passYards.toLocaleString('en-US')} net passing yards and ${rushYards.toLocaleString('en-US')} rushing yards. They recorded ${turnovers} turnovers. Third downs: ${thirdDown.made}/${thirdDown.att} (${(100 * thirdDown.made / thirdDown.att).toFixed(1)}%).`,
  '',
  '### Highest team totals',
  '',
  '| Team | Opponent | Points |',
  '|---|---|---:|',
  topRows(sortedTeams('score'), 'score'),
  '',
  '| Team | Opponent | Total yards |',
  '|---|---|---:|',
  topRows(sortedTeams('totalYards'), 'totalYards'),
  '',
  '| Team | Opponent | Net passing yards |',
  '|---|---|---:|',
  topRows(sortedTeams('netPassingYards'), 'netPassingYards'),
  '',
  '| Team | Opponent | Rushing yards |',
  '|---|---|---:|',
  topRows(sortedTeams('rushingYards'), 'rushingYards'),
  '',
  '| Team | Opponent | Turnovers |',
  '|---|---|---:|',
  topRows(sortedTeams('turnovers'), 'turnovers'),
  '',
  '| Team | Opponent | Fewest points |',
  '|---|---|---:|',
  topRows(sortedTeams('score', 5, true), 'score'),
  '',
  '## Individual leaders',
  '',
  '| Player | Game | Passing yards |',
  '|---|---|---:|',
  topPlayers('passingYards'),
  '',
  '| Player | Game | Rushing yards |',
  '|---|---|---:|',
  topPlayers('rushingYards'),
  '',
  '| Player | Game | Receiving yards |',
  '|---|---|---:|',
  topPlayers('receivingYards'),
  '',
  '| Player | Game | Receptions |',
  '|---|---|---:|',
  topPlayers('receptions'),
  '',
  '| Player | Game | Passing TDs |',
  '|---|---|---:|',
  topPlayers('passingTouchdowns'),
  '',
  '| Player | Game | Receiving TDs |',
  '|---|---|---:|',
  topPlayers('receivingTouchdowns'),
  '',
  '| Player | Game | Sacks |',
  '|---|---|---:|',
  topPlayers('sacks'),
  '',
  '| Player | Game | Interceptions |',
  '|---|---|---:|',
  topPlayers('interceptions'),
  '',
  '| Player | Game | Total tackles |',
  '|---|---|---:|',
  topPlayers('totalTackles'),
  '',
  '## Data files and interpretation',
  '',
  '- `espn-game-results-2026-10-26.csv`: 14 scheduled games, with DAL–PHI marked pending because no final boxscore snapshot exists yet; includes each saved ESPN snapshot update time.',
  '- `espn-team-stats-2026-10-26.csv`: one row per team in each completed game, with raw ESPN display values for team stats.',
  '- `espn-player-stats-long-2026-10-26.csv`: all player statistics in long form, retaining ESPN stat-group and stat-key names.',
  '- `espn-scoring-plays-2026-10-26.csv`: ESPN scoring-play entries from the saved snapshots.',
  '- Final scores were also cross-checked against the [official NFL Week 7 schedule](https://www.nfl.com/schedules/2026/by-week/week-7).',
  '- Percentages and averages above are derived from the 13 completed games only. The Monday game can change every Week 7 aggregate.',
  '',
];
fs.writeFileSync(path.join(outDir, 'w07-football-stats-2026-10-26.md'), report(reportLines));
console.log(JSON.stringify({scheduled: games.length, final: finalGames.length, pending: pendingGames.map((game) => `${game.away}@${game.home}`), teamRows: teamRows.length, playerStatRows: playerRows.length, scoringPlays: scoringRows.length, totalPoints, totalYards, turnovers, homeWins, awayWins, ties, thirdDown}, null, 2));
