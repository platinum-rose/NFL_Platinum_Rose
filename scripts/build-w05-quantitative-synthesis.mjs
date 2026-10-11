#!/usr/bin/env node
/**
 * Week 5 quantitative, read-only synthesis.
 *
 * This is deliberately a transparent forecast adapter, not a betting or ticket
 * generator. It uses current BKR game lines as an anchor; season-to-date FTN
 * team metrics and market-independent SRS power ratings are partial adjustments;
 * secondary availability is capped context. Expert/podcast material stays
 * qualitative evidence, because it is not calibrated to a probability scale.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const write = (file, value) => {
  const target = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
};
const n = (value) => {
  const parsed = Number(String(value ?? '').replace(/[$,%]/g, '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const stdev = (xs) => {
  const m = mean(xs); return m == null ? null : Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) || 1;
};
const zscores = (map) => {
  const values = Object.values(map).filter(Number.isFinite); const m = mean(values); const sd = stdev(values);
  return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, Number.isFinite(value) ? (value - m) / sd : null]));
};
const rng = (() => { let seed = 20261010; return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
const normal = () => { const u = Math.max(rng(), 1e-12); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); };

const ftn = read('data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json');
const power = read('data/generated/team-profiles/team-power-ratings-2026.json');
const secondary = read('data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json');
const latestBkr = (() => { const dir = 'data/generated/props'; let best = null; for (const n of fs.readdirSync(dir)) { if (!/^bookmaker-live-2026-10-\d\d-week5\.json$/.test(n)) continue; const c = JSON.parse(fs.readFileSync(`${dir}/${n}`, 'utf8')).capturedAt || ''; if (!best || c > best.c) best = { c, p: `${dir}/${n}` }; } return best.p; })();
const bkr = read(latestBkr);
const availability = read('data/player-availability/impact-digest-latest.json');
const podcast = read('data/generated/master-intel/w05-pull.json');
const contest = read('data/supercontest/week-05-2026-verified-lines.json');

const games = [
  ['Philadelphia Eagles @ Jacksonville Jaguars', 'PHI', 'JAX'], ['Indianapolis Colts @ Pittsburgh Steelers', 'IND', 'PIT'],
  ['Minnesota Vikings @ New Orleans Saints', 'MIN', 'NO'], ['Cleveland Browns @ New York Jets', 'CLE', 'NYJ'],
  ['Cincinnati Bengals @ Miami Dolphins', 'CIN', 'MIA'], ['Las Vegas Raiders @ New England Patriots', 'LV', 'NE'],
  ['New York Giants @ Washington Commanders', 'NYG', 'WAS'], ['Houston Texans @ Tennessee Titans', 'HOU', 'TEN'],
  ['Denver Broncos @ Los Angeles Chargers', 'DEN', 'LAC'], ['San Francisco 49ers @ Seattle Seahawks', 'SF', 'SEA'],
  ['Detroit Lions @ Arizona Cardinals', 'DET', 'ARI'], ['Chicago Bears @ Green Bay Packers', 'CHI', 'GB'],
  ['Baltimore Ravens @ Atlanta Falcons', 'BAL', 'ATL'], ['Buffalo Bills @ Los Angeles Rams', 'BUF', 'LAR']
].map(([event, away, home]) => ({ event, away, home }));

const metric = (team, category, subpage, field) => n(ftn.team_context[team]?.records.find((r) => r.category === category && r.subpage === subpage)?.metrics?.[field]);
const teams = Object.keys(ftn.team_context);
const buildFeature = (specs) => {
  const aggregate = {};
  for (const team of teams) aggregate[team] = mean(specs.map(([category, subpage, field]) => metric(team, category, subpage, field)).filter(Number.isFinite));
  return zscores(aggregate);
};
// Higher is better for attack; higher is worse for defense. All figures are
// season-to-date FTN values, standardized within this captured 32-team cohort.
const offense = buildFeature([
  ['team-offense', 'efficiency', 'EPA/PLY'], ['team-offense', 'efficiency', 'SUCC%'],
  ['team-offense', 'overview', 'PT/GM'], ['team-offense', 'passing-analytics', 'EPA/DB'],
  ['team-offense', 'rushing-analytics', 'EPA/ATT']
]);
const defenseWeakness = buildFeature([
  ['team-defense', 'efficiency', 'EPA/PLY'], ['team-defense', 'efficiency', 'SUCC%'],
  ['team-defense', 'overview', 'PT/GM'], ['team-defense', 'passing-analytics', 'EPA/DB'],
  ['team-defense', 'rush-analytics', 'EPA/ATT']
]);
const tempo = buildFeature([['team-offense', 'tempo', 'PLY/GM'], ['team-offense', 'tempo', 'SCD%']]);
const powers = Object.fromEntries(power.rows.map((row) => [row.team_abbr, row.power_rating]));
const sec = new Map(secondary.matchups.map((row) => [`${row.offense_team}:${row.defense_team}`, row]));
const line = (event, bet, side) => bkr.rows.find((row) => row.event === event && row.sectionTitle === 'Game' && row.bet === bet && row.side === side && row.available !== false);

function simulate({ homeMean, awayMean, homeLine, total, iterations = 100000 }) {
  let homeWin = 0; let homeCover = 0; let over = 0; let homeSum = 0; let awaySum = 0;
  // Shared noise is intentionally modest: possessions/game environment moves both
  // scores, while independent noise drives the margin. This is a simple normal-score
  // model, not a possession simulation or a calibrated closing-line model.
  for (let i = 0; i < iterations; i += 1) {
    const shared = normal() * 3.0; const home = Math.max(0, homeMean + shared + normal() * 11.8); const away = Math.max(0, awayMean + shared + normal() * 11.8);
    homeSum += home; awaySum += away;
    if (home > away) homeWin += 1;
    if ((home - away) > -homeLine) homeCover += 1;
    if ((home + away) > total) over += 1;
  }
  return { iterations, mean_home: homeSum / iterations, mean_away: awaySum / iterations, home_win_pct: homeWin / iterations, home_cover_pct: homeCover / iterations, away_cover_pct: 1 - (homeCover / iterations), over_pct: over / iterations, under_pct: 1 - (over / iterations) };
}

const projections = games.map((game) => {
  // Home/away come from the event string ("Away @ Home", the schedule's VISITOR @ HOME order), never from the sign of a
  // line: the favorite is often the visitor, and inferring "home = the team with the negative line" flips the market sign.
  const [awayName, homeName] = game.event.split(' @ ');
  if (!awayName || !homeName) throw new Error(`event is not "Away @ Home": ${game.event}`);
  const homeSpread = line(game.event, 'spread', homeName)?.line;
  const total = line(game.event, 'total', 'Over')?.line;
  if (!Number.isFinite(homeSpread) || !Number.isFinite(total)) return { ...game, status: 'missing_current_bkr_game_line' };
  const marketHome = total / 2 - homeSpread / 2; const marketAway = total - marketHome;
  const analyticHomeRaw = 22 + 1.55 * ((offense[game.home] || 0) + (defenseWeakness[game.away] || 0));
  const analyticAwayRaw = 22 + 1.55 * ((offense[game.away] || 0) + (defenseWeakness[game.home] || 0));
  const analyticCenter = (analyticHomeRaw + analyticAwayRaw) / 2;
  // Center analytic score to the market total; the model only lets analytics alter
  // the expected margin and uses a small pace adjustment for total drift.
  const paceAdjustment = Math.max(-1.25, Math.min(1.25, 0.7 * ((tempo[game.home] || 0) + (tempo[game.away] || 0))));
  const analyticHome = analyticHomeRaw - analyticCenter + total / 2 + paceAdjustment / 2;
  const analyticAway = analyticAwayRaw - analyticCenter + total / 2 + paceAdjustment / 2;
  const srsHome = powers[game.home]?.srs ?? 0; const srsAway = powers[game.away]?.srs ?? 0;
  const powerMargin = srsHome - srsAway + 1.5;
  const powerHome = total / 2 + powerMargin / 2; const powerAway = total / 2 - powerMargin / 2;
  const secHome = Math.min(0.9, Math.max(0, (sec.get(`${game.home}:${game.away}`)?.severity_score || 0) * 0.10));
  const secAway = Math.min(0.9, Math.max(0, (sec.get(`${game.away}:${game.home}`)?.severity_score || 0) * 0.10));
  const homeMean = 0.60 * marketHome + 0.25 * analyticHome + 0.15 * powerHome + secHome;
  const awayMean = 0.60 * marketAway + 0.25 * analyticAway + 0.15 * powerAway + secAway;
  const sim = simulate({ homeMean, awayMean, homeLine: homeSpread, total });
  const favorite = homeSpread < 0 ? homeName : awayName;
  const preferredSide = sim.home_cover_pct >= sim.away_cover_pct ? homeName : awayName;
  const preferredTotal = sim.over_pct >= sim.under_pct ? 'Over' : 'Under';
  // The SuperContest file lists 6 Week 5 matchups with away/home reversed relative to the schedule, so match on the unordered pair.
  const contestSame = contest.lines.find((row) => row.away_team === game.away && row.home_team === game.home);
  const contestRow = contestSame || contest.lines.find((row) => row.away_team === game.home && row.home_team === game.away);
  return {
    ...game, away_name: awayName, home_name: homeName, market: { home_spread: homeSpread, total, captured_at: bkr.capturedAt },
    features: { offense_z: { [game.home]: offense[game.home], [game.away]: offense[game.away] }, defense_weakness_z: { [game.home]: defenseWeakness[game.home], [game.away]: defenseWeakness[game.away] }, tempo_z: { [game.home]: tempo[game.home], [game.away]: tempo[game.away] }, srs: { [game.home]: srsHome, [game.away]: srsAway }, secondary_adjustment_points: { [game.home]: secHome, [game.away]: secAway } },
    means: { home: homeMean, away: awayMean, total: homeMean + awayMean, home_margin: homeMean - awayMean },
    simulation: sim,
    model_menu: { side: preferredSide, side_cover_pct: Math.max(sim.home_cover_pct, sim.away_cover_pct), total: preferredTotal, total_pct: Math.max(sim.over_pct, sim.under_pct) },
    contest: contestRow ? { team: contestRow.favorite, favorite_spread: contestRow.favorite_spread, market_favorite: favorite, file_orientation_reversed: !contestSame } : null
  };
});

const availabilityGates = availability.top_events.filter((event) => ['out', 'ir', 'doubtful', 'questionable'].includes(event.event_type)).map((event) => ({ team: event.team, player: event.player_name, event_type: event.event_type, published_at: event.published_at, summary: event.summary }));
const output = {
  schema: 'week5_quantitative_synthesis_v1', generated_at: new Date().toISOString(), status: 'proposed_analysis_only',
  boundary: 'Not a card, official recommendation, contest entry, ticket, or sportsbook execution record.',
  numeric_model: {
    method: '100,000-trial seeded normal-score Monte Carlo per game',
    blend: '60% current BKR market-implied score; 25% FTN standardized season-to-date team attack/defense/pacing context; 15% nflverse SRS margin; capped secondary-absence context.',
    calibration_status: 'provisional: no historical Week 5 backtest or closing-line calibration is claimed.',
    excluded_from_numeric_weight: ['expert/podcast selections', 'betting splits', 'retired DVOA snapshot lane', 'stale coaching-source inputs', 'player-prop prices']
  },
  source_accounting: {
    ftn: { tables: ftn.table_count, records: ftn.record_count, captured: ftn.source_capture_completed_at, role: 'numeric team analytics' },
    power: { generated: power.meta.generated_at, components: power.meta.ensemble_components, role: 'numeric season-to-date SRS component' },
    bookmaker: { captured: bkr.capturedAt, rows: bkr.rows.length, role: 'market anchor' },
    secondary: { generated: secondary.meta.generated_at, role: 'capped matchup context' },
    availability: { generated: availability.meta?.generated_at || null, role: 'gate/context; not blanket point adjustments' },
    podcast: { episodes: podcast.podcast_gemini_summary?.promoted_episodes, picks: podcast.podcast_gemini_summary?.picks, notes: podcast.podcast_gemini_summary?.analysis_notes, role: 'qualitative corroboration only' },
    explicit_staleness: ['DVOA snapshot lane retired 2026-10-10; FTN is the current-season efficiency source', 'coaching tendency source files predate current Week 5 and are context-only']
  },
  availability_gates: availabilityGates, games: projections
};

const pct = (value) => `${(value * 100).toFixed(1)}%`;
const rankedSides = projections.filter((g) => g.simulation).map((g) => ({ game: g.event, side: g.model_menu.side, pct: g.model_menu.side_cover_pct, market: g.market.home_spread, projected_margin: g.means.home_margin })).sort((a, b) => b.pct - a.pct);
const rankedTotals = projections.filter((g) => g.simulation).map((g) => ({ game: g.event, total: g.model_menu.total, pct: g.model_menu.total_pct, market: g.market.total, projected_total: g.means.total })).sort((a, b) => b.pct - a.pct);
let md = `# Week 5 Quantitative Synthesis — Proposed Analysis\n\nGenerated ${output.generated_at}. **Not an official card, pool entry, ticket, or execution instruction.**\n\n## What this pass actually uses\n\n- FTN Week 5 rendered exports: ${ftn.table_count} tables / ${ftn.record_count.toLocaleString()} rows, captured through ${ftn.source_capture_completed_at}.\n- Current BKR market anchor: ${bkr.capturedAt}.\n- Current season SRS / net-point / Pythagorean power ensemble: ${power.meta.generated_at}.\n- Week 5 secondary-matchup evidence, capped to prevent manual injury notes from overwhelming the market.\n- Current availability as a gate/context layer.\n\n**Monte Carlo:** 100,000 deterministic trials per game. The model blends 60% market, 25% FTN team analytics, and 15% SRS margin; it is provisional and unbacktested, so probability is a comparison signal—not a claim of calibrated edge. Podcast, expert, splits, stale DVOA, and stale coaching inputs are retained as qualitative review context only.\n\n## Game projections and simulation outputs\n\n| Game | Mean score | BKR spread / total | Preferred side | Cover % | Preferred total | Total % |\n|---|---:|---|---|---:|---|---:|\n`;
for (const g of projections) {
  if (!g.simulation) { md += `| ${g.event} | — | missing | — | — | — | — |\n`; continue; }
  md += `| ${g.event} | ${g.away} ${g.means.away.toFixed(1)}–${g.home} ${g.means.home.toFixed(1)} | ${g.home_name} ${g.market.home_spread} / ${g.market.total} | ${g.model_menu.side} | ${pct(g.model_menu.side_cover_pct)} | ${g.model_menu.total} | ${pct(g.model_menu.total_pct)} |\n`;
}
md += `\n## Ranked model menus (not recommendations)\n\n### Sides\n\n| Rank | Side | Game | Model cover % | Market home spread | Model home margin |\n|---:|---|---|---:|---:|---:|\n`;
rankedSides.forEach((x, i) => { md += `| ${i + 1} | ${x.side} | ${x.game} | ${pct(x.pct)} | ${x.market} | ${x.projected_margin.toFixed(1)} |\n`; });
md += `\n### Totals\n\n| Rank | Total | Game | Model % | Market total | Model total |\n|---:|---|---:|---:|---:|---:|\n`;
rankedTotals.forEach((x, i) => { md += `| ${i + 1} | ${x.total} | ${x.game} | ${pct(x.pct)} | ${x.market} | ${x.projected_total.toFixed(1)} |\n`; });
md += `\n## Required human review\n\n- Reprice every row at the intended book immediately before any separate proposal.\n- Apply current inactive news; the availability file is a gate, not an automatic point-spread override.\n- Review expert/podcast/split conflicts game by game; they were not converted into pseudo-probabilities.\n- Do not use this game-level model to infer player-prop probabilities. Player projections require a separate player-volume model and line-specific calibration.\n`;
write('data/research-intel/proposed/2026-w05-quantitative-synthesis.json', output);
write('reports/intel/2026-w05-quantitative-synthesis.md', md);
console.log(`wrote ${projections.length} game quantitative synthesis with ${rankedSides.length} side and ${rankedTotals.length} total rows`);
