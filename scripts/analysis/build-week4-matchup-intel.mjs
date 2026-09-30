import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BOX_DIR = path.join(ROOT, 'data/fantasy/boxscores');
const SCHEDULE = path.join(ROOT, 'public/schedule.json');
const MARKET_BASELINE = path.join(ROOT, 'reports/bets/week4-beo-opening-market-baseline-2026-09-28.md');
const OUT_DIR = path.join(ROOT, 'reports/analysis/week4-intel');
const OUT_MD = path.join(OUT_DIR, 'WEEK4_MATCHUP_INTEL.md');
const OUT_JSON = path.join(OUT_DIR, 'week4-team-baselines.json');
const TEAM_ALIASES = { WSH: 'WAS', JAC: 'JAX', LVR: 'LV' };

const number = (value) => Number(String(value ?? '0').match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0);
const teamCode = (value) => TEAM_ALIASES[value] ?? value;
const rate = (value) => {
  const [made, attempts] = String(value ?? '0-0').split('-').map(number);
  return { made, attempts };
};
const mean = (value, games) => (value / games).toFixed(1);
const pct = ({ made, attempts }) => attempts ? `${((made / attempts) * 100).toFixed(1)}% (${made}/${attempts})` : 'n/a';

function teamStats(team) {
  const values = Object.fromEntries((team.statistics || []).map((stat) => [stat.name, stat.displayValue]));
  return {
    yards: number(values.totalYards), plays: number(values.totalOffensivePlays), passYards: number(values.netPassingYards),
    rushYards: number(values.rushingYards), turnovers: number(values.turnovers), third: rate(values.thirdDownEff),
  };
}

function loadWeeksOneToThree() {
  const games = [];
  for (const filename of fs.readdirSync(BOX_DIR).filter((file) => file.endsWith('.json'))) {
    const raw = JSON.parse(fs.readFileSync(path.join(BOX_DIR, filename)));
    if (raw.header?.season?.year !== 2026 || ![1, 2, 3].includes(raw.header?.week) || !raw.header?.competitions?.[0]?.status?.type?.completed) continue;
    const competitors = raw.header.competitions[0].competitors || [];
    const stats = Object.fromEntries((raw.boxscore?.teams || []).map((team) => [teamCode(team.team?.abbreviation), teamStats(team)]));
    if (competitors.length !== 2 || Object.keys(stats).length !== 2) continue;
    games.push({
      id: raw.header.id, week: raw.header.week,
      teams: competitors.map((team) => ({ code: teamCode(team.team.abbreviation), score: number(team.score), winner: Boolean(team.winner), stats: stats[teamCode(team.team.abbreviation)] })),
    });
  }
  return games;
}

function summarizeTeam(code, games) {
  const appearances = games.filter((game) => game.teams.some((team) => team.code === code)).sort((a, b) => a.week - b.week);
  const totals = { pointsFor: 0, pointsAgainst: 0, yards: 0, yardsAllowed: 0, plays: 0, playsAllowed: 0, passYards: 0, passYardsAllowed: 0, rushYards: 0, rushYardsAllowed: 0, turnovers: 0, takeaways: 0, third: { made: 0, attempts: 0 }, thirdAllowed: { made: 0, attempts: 0 } };
  const results = appearances.map((game) => {
    const team = game.teams.find((entry) => entry.code === code);
    const opponent = game.teams.find((entry) => entry.code !== code);
    totals.pointsFor += team.score; totals.pointsAgainst += opponent.score;
    totals.yards += team.stats.yards; totals.yardsAllowed += opponent.stats.yards;
    totals.plays += team.stats.plays; totals.playsAllowed += opponent.stats.plays;
    totals.passYards += team.stats.passYards; totals.passYardsAllowed += opponent.stats.passYards;
    totals.rushYards += team.stats.rushYards; totals.rushYardsAllowed += opponent.stats.rushYards;
    totals.turnovers += team.stats.turnovers; totals.takeaways += opponent.stats.turnovers;
    totals.third.made += team.stats.third.made; totals.third.attempts += team.stats.third.attempts;
    totals.thirdAllowed.made += opponent.stats.third.made; totals.thirdAllowed.attempts += opponent.stats.third.attempts;
    return `W${game.week} ${team.winner ? 'W' : 'L'} ${team.score}-${opponent.score} ${opponent.code}`;
  });
  const gamesPlayed = appearances.length;
  return {
    code, games: gamesPlayed, record: `${results.filter((value) => value.includes(' W ')).length}-${results.filter((value) => value.includes(' L ')).length}`,
    results, points_for_pg: Number(mean(totals.pointsFor, gamesPlayed)), points_against_pg: Number(mean(totals.pointsAgainst, gamesPlayed)),
    yards_pg: Number(mean(totals.yards, gamesPlayed)), yards_allowed_pg: Number(mean(totals.yardsAllowed, gamesPlayed)),
    yards_per_play: (totals.yards / totals.plays).toFixed(1), yards_per_play_allowed: (totals.yardsAllowed / totals.playsAllowed).toFixed(1),
    pass_yards_pg: Number(mean(totals.passYards, gamesPlayed)), pass_yards_allowed_pg: Number(mean(totals.passYardsAllowed, gamesPlayed)),
    rush_yards_pg: Number(mean(totals.rushYards, gamesPlayed)), rush_yards_allowed_pg: Number(mean(totals.rushYardsAllowed, gamesPlayed)),
    turnover_margin: totals.takeaways - totals.turnovers, third_down: pct(totals.third), third_down_allowed: pct(totals.thirdAllowed),
  };
}

function marketRows() {
  const rows = new Map();
  for (const line of fs.readFileSync(MARKET_BASELINE, 'utf8').split(/\r?\n/)) {
    const cells = line.split('|').map((cell) => cell.trim());
    if (cells.length < 5 || !cells[1].includes('@') || cells[1] === 'Matchup') continue;
    rows.set(cells[1].replace(/ \((?:Thu|Mon)\)$/, ''), { spread: cells[2], total: cells[3], moneyline: cells[4] });
  }
  return rows;
}

function comparison(away, home) {
  const defense = away.points_against_pg === home.points_against_pg ? 'Both defenses have allowed the same points per game.'
    : `${away.points_against_pg < home.points_against_pg ? away.code : home.code} has the lower points-allowed baseline (${Math.min(away.points_against_pg, home.points_against_pg)} per game).`;
  const offense = away.yards_pg === home.yards_pg ? 'The teams have matched in raw offensive yardage.'
    : `${away.yards_pg > home.yards_pg ? away.code : home.code} has generated more yardage per game (${Math.max(away.yards_pg, home.yards_pg)}).`;
  const turnover = away.turnover_margin === home.turnover_margin ? 'Their turnover margins are level.'
    : `${away.turnover_margin > home.turnover_margin ? away.code : home.code} owns the better turnover margin (${Math.max(away.turnover_margin, home.turnover_margin) >= 0 ? '+' : ''}${Math.max(away.turnover_margin, home.turnover_margin)}).`;
  return `${defense} ${offense} ${turnover} This is a three-game descriptive baseline, not a forecast.`;
}

function fullBreakdown(away, home) {
  const scoring = away.points_for_pg > home.points_for_pg ? away : home;
  const defense = away.points_against_pg < home.points_against_pg ? away : home;
  const passing = away.pass_yards_pg - home.pass_yards_allowed_pg;
  const homePassing = home.pass_yards_pg - away.pass_yards_allowed_pg;
  const rushing = away.rush_yards_pg - home.rush_yards_allowed_pg;
  const homeRushing = home.rush_yards_pg - away.rush_yards_allowed_pg;
  const passingRead = Math.abs(passing - homePassing) < 15 ? 'The passing-yards baselines are broadly balanced.'
    : `${passing > homePassing ? away.code : home.code} has the more favorable early passing-production comparison (${Math.max(passing, homePassing).toFixed(1)} yards versus the opponent's average allowed).`;
  const rushingRead = Math.abs(rushing - homeRushing) < 15 ? 'The rushing-yards baselines are broadly balanced.'
    : `${rushing > homeRushing ? away.code : home.code} has the more favorable early rushing-production comparison (${Math.max(rushing, homeRushing).toFixed(1)} yards versus the opponent's average allowed).`;
  const turnoverRead = away.turnover_margin === home.turnover_margin ? 'Turnover margin does not separate the teams yet.'
    : `${away.turnover_margin > home.turnover_margin ? away.code : home.code} has the early turnover-margin edge.`;
  return {
    form: `${scoring.code} has scored more per game (${scoring.points_for_pg}), while ${defense.code} has allowed fewer (${defense.points_against_pg}).`,
    passing: passingRead,
    rushing: rushingRead,
    possession: `${turnoverRead} Third-down offense: ${away.code} ${away.third_down}; ${home.code} ${home.third_down}.`,
    awayPath: `${away.code}'s favorable path is to exceed its ${away.yards_pg}-yard offensive baseline while keeping ${home.code} below its ${home.points_for_pg}-point scoring baseline.`,
    homePath: `${home.code}'s favorable path is to exceed its ${home.yards_pg}-yard offensive baseline while keeping ${away.code} below its ${away.points_for_pg}-point scoring baseline.`,
  };
}

const games = loadWeeksOneToThree();
const schedules = JSON.parse(fs.readFileSync(SCHEDULE)).filter((game) => game.week === 4 && game.season === 2026);
const markets = marketRows();
const teams = Object.fromEntries([...new Set(schedules.flatMap((game) => [game.visitor, game.home]))].map((code) => [code, summarizeTeam(code, games)]));
const output = {
  generated_at: new Date().toISOString(), source_window: '2026 regular season Weeks 1-3',
  evidence: { boxscores: 'data/fantasy/boxscores/espn-*.json', schedule: 'public/schedule.json', opening_market_snapshot: path.relative(ROOT, MARKET_BASELINE).replaceAll('\\', '/') },
  matchups: schedules.map((game) => {
    const away = teams[game.visitor]; const home = teams[game.home];
    return { game_id: game.game_id, kickoff_utc: game.kickoff_utc, away, home, opening_market: markets.get(`${game.visitor} @ ${game.home}`) ?? null, breakdown: fullBreakdown(away, home) };
  }),
};

const teamRow = (team) => `| ${team.code} (${team.record}) | ${team.points_for_pg} / ${team.points_against_pg} | ${team.yards_pg} / ${team.yards_allowed_pg} | ${team.yards_per_play} / ${team.yards_per_play_allowed} | ${team.pass_yards_pg} / ${team.rush_yards_pg} | ${team.turnover_margin >= 0 ? '+' : ''}${team.turnover_margin} | ${team.third_down} / ${team.third_down_allowed} |`;
const sections = output.matchups.map((matchup) => {
  const title = `${matchup.away.code} @ ${matchup.home.code}`;
  const market = matchup.opening_market ? `- Opening snapshot, captured 2026-09-28 (not current/executable): ${matchup.opening_market.spread}; total ${matchup.opening_market.total}; ML ${matchup.opening_market.moneyline}.` : '- Opening snapshot: not captured.';
  return `## ${title}\n\nKickoff: ${matchup.kickoff_utc}\n\n### First-three-games profile\n\n| Team (W1-W3) | PF / PA per game | Yards / allowed | Yards per play / allowed | Pass / rush yards | Turnover margin | Third down / allowed |\n|---|---:|---:|---:|---:|---:|---:|\n${teamRow(matchup.away)}\n${teamRow(matchup.home)}\n\n- ${matchup.away.code} results: ${matchup.away.results.join('; ')}.\n- ${matchup.home.code} results: ${matchup.home.results.join('; ')}.\n\n### What the baseline says\n\n- **Form:** ${matchup.breakdown.form}\n- **Passing lens:** ${matchup.breakdown.passing}\n- **Rushing lens:** ${matchup.breakdown.rushing}\n- **Possession and mistakes:** ${matchup.breakdown.possession}\n- **Away-team path:** ${matchup.breakdown.awayPath}\n- **Home-team path:** ${matchup.breakdown.homePath}\n- **Limit:** ${comparison(matchup.away, matchup.home)}\n\n### Market reference\n\n${market}\n\n### Intel needed before the Saturday Master Intel build\n\n- Dated injury report and final inactive status.\n- Strict-roster-validated player availability before a player is named.\n- A current, row-verified market capture; do not use the opening observation as a current price.\n- Weather and venue conditions, if relevant.\n- Ingested expert, podcast, article, splits, and matchup-source evidence; retain counterarguments.\n`;
}).join('\n');

const markdown = `# Week 4 matchup intel staging report\n\nGenerated ${output.generated_at}. This is a read-only first-three-games scouting baseline for all 16 Week 4 matchups. It contains no recommendation, wager, account, ledger, database, or odds refresh action.\n\n## Master Intel handoff\n\nThis report is a source input for the Saturday Master Intel narrative build. It intentionally does **not** contain projections, card leans, or player-specific claims. After scheduled intel ingestion and the Week 4 roster gate, use each matchup's facts and its completed evidence queue to write the canonical \`reports/intel/master-intel-narratives-2026-w04.md\` blocks required by \`scripts/master-intel/build.py\`.\n\n## Evidence and update rules\n\n- Team results and metrics are calculated from settled local ESPN box-score captures for Weeks 1–3.\n- Opening lines are historical observations from \`${output.evidence.opening_market_snapshot}\`; they are not live, verified, or executable.\n- Retain this baseline. Add dated, source-qualified updates in the canonical Saturday narratives rather than replacing its early-season facts.\n- Player-specific additions require the Week 4 strict roster gate before a player is named.\n\n${sections}`;
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2) + '\n');
fs.writeFileSync(OUT_MD, markdown);
console.log(`Wrote ${path.relative(ROOT, OUT_MD)} and ${path.relative(ROOT, OUT_JSON)} for ${output.matchups.length} matchups.`);
