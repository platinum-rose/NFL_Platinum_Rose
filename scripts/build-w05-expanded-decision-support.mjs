import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const write = (relative, body) => {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body);
  return target;
};
const bkr = read('data/generated/props/bookmaker-live-2026-10-10-week5.json');
const beo = read('data/generated/props/betonline-live-2026-10-10-week5.json');
const contest = read('data/supercontest/week-05-2026-verified-lines.json');

const games = [
  ['Philadelphia Eagles @ Jacksonville Jaguars', 'PHI', 20, 'JAX', 24, 'PHI', 'Over', 'projection favors the dog number; earlier named-source support was JAX only at a materially lower spread'],
  ['Indianapolis Colts @ Pittsburgh Steelers', 'IND', 20, 'PIT', 23, 'IND', 'Under', 'projection makes the spread a near-push; keep as a low-conviction menu item only'],
  ['Minnesota Vikings @ New Orleans Saints', 'MIN', 21, 'NO', 20, 'NO', 'Under', 'projection and multi-source Saints support point toward the dog, subject to final availability'],
  ['Cleveland Browns @ New York Jets', 'CLE', 19, 'NYJ', 20, 'CLE', 'Under', 'projection supports the dog and the low-total thesis; not a straight-ticket instruction'],
  ['Cincinnati Bengals @ Miami Dolphins', 'CIN', 27, 'MIA', 17, 'CIN', 'Over', 'projection supports Cincinnati and the Over, but the side is price-sensitive at seven'],
  ['Las Vegas Raiders @ New England Patriots', 'LV', 23, 'NE', 24, 'LV', 'Over', 'two named source endorsements retain the +3.5 hook; projection is one-point game'],
  ['New York Giants @ Washington Commanders', 'NYG', 17, 'WAS', 24, 'WAS', 'Under', 'projection likes Washington; prior Giants source case was explicitly QB-status conditional'],
  ['Houston Texans @ Tennessee Titans', 'HOU', 21, 'TEN', 17, 'TEN', 'Under', 'projection favors the dog at seven while cited Texans support required under seven'],
  ['Denver Broncos @ Los Angeles Chargers', 'DEN', 23, 'LAC', 20, 'LAC', 'Over', 'projection is Broncos by three; source sides conflict, so this is price/menu context only'],
  ['San Francisco 49ers @ Seattle Seahawks', 'SF', 21, 'SEA', 24, 'SF', 'Under', 'projection lands exactly SEA -3; under is the cleaner of the source-backed angles'],
  ['Detroit Lions @ Arizona Cardinals', 'DET', 31, 'ARI', 24, 'DET', 'Over', 'projection favors Detroit and a high score, but source side evidence is split'],
  ['Chicago Bears @ Green Bay Packers', 'CHI', 24, 'GB', 21, 'CHI', 'Under', 'projection has Chicago by three; display -1.5 versus contest -3 is a material context difference'],
  ['Baltimore Ravens @ Atlanta Falcons', 'BAL', 20, 'ATL', 24, 'ATL', 'Push', 'projection favors Atlanta, while the contest asks for the worse -3.5 and totals evidence conflicts'],
  ['Buffalo Bills @ Los Angeles Rams', 'BUF', 27, 'LAR', 28, 'BUF', 'Over', 'multiple source types support the short dog; projection is a one-point Rams win']
].map(([event, away, awayPts, home, homePts, side, total, note]) => ({ event, away, awayPts, home, homePts, side, total, note }));

// These are decision-support menus, not a recommendation model. Each requested market is
// resolved against the current captured row, then omitted (rather than guessed) if unavailable.
const propMenus = {
  'Philadelphia Eagles @ Jacksonville Jaguars': [['Jalen Hurts', 'rush_yds', 'Over'], ['Trevor Lawrence', 'pass_yds', 'Over'], ['Brian Thomas', 'rec_yds', 'Over']],
  'Indianapolis Colts @ Pittsburgh Steelers': [['Aaron Rodgers', 'pass_yds', 'Over'], ['Keenan Allen', 'rec_yds', 'Over'], ['Josh Downs', 'rec_yds', 'Over']],
  'Minnesota Vikings @ New Orleans Saints': [['Tyler Shough', 'pass_yds', 'Over'], ['Justin Jefferson', 'rec_yds', 'Over'], ['T.J. Hockenson', 'rec_yds', 'Over']],
  'Cleveland Browns @ New York Jets': [['Quinshon Judkins', 'rush_yds', 'Under'], ['Deshaun Watson', 'pass_yds', 'Over'], ['Garrett Wilson', 'rec_yds', 'Over']],
  'Cincinnati Bengals @ Miami Dolphins': [['Jaylen Wright', 'rush_yds', 'Over'], ['Greg Dulcich', 'rec_yds', 'Over'], ['Chase Brown', 'rush_yds', 'Over']],
  'Las Vegas Raiders @ New England Patriots': [['Kirk Cousins', 'pass_yds', 'Over'], ['Brock Bowers', 'rec_yds', 'Over'], ['Drake Maye', 'pass_yds', 'Over']],
  'New York Giants @ Washington Commanders': [['Malik Nabers', 'rec_yds', 'Over'], ['Jacory Croskey-Merritt', 'rush_yds', 'Over'], ['Jameis Winston', 'pass_yds', 'Over']],
  'Houston Texans @ Tennessee Titans': [['C.J. Stroud', 'pass_yds', 'Over'], ['Nico Collins', 'rec_yds', 'Over'], ['Tony Pollard', 'rush_yds', 'Over']],
  'Denver Broncos @ Los Angeles Chargers': [['Justin Herbert', 'pass_yds', 'Over'], ['J.K. Dobbins', 'rush_yds', 'Over'], ['Courtland Sutton', 'rec_yds', 'Over']],
  'San Francisco 49ers @ Seattle Seahawks': [['Brock Purdy', 'pass_yds', 'Over'], ['George Kittle', 'rec_yds', 'Over'], ['Sam Darnold', 'pass_yds', 'Over']],
  'Detroit Lions @ Arizona Cardinals': [['Jared Goff', 'pass_yds', 'Over'], ['Jahmyr Gibbs', 'rush_yds', 'Over'], ['Amon-Ra St. Brown', 'rec_yds', 'Over']],
  'Chicago Bears @ Green Bay Packers': [['Tyson Bagent', 'pass_yds', 'Over'], ["D'Andre Swift", 'rush_yds', 'Over'], ['Tucker Kraft', 'rec_yds', 'Over']],
  'Baltimore Ravens @ Atlanta Falcons': [['Tyler Huntley', 'rush_yds', 'Over'], ['Michael Penix', 'pass_yds', 'Over'], ['Bijan Robinson', 'rec_yds', 'Over']],
  'Buffalo Bills @ Los Angeles Rams': [['Josh Allen', 'pass_yds', 'Over'], ['Puka Nacua', 'rec_yds', 'Over'], ['Davante Adams', 'rec_yds', 'Over']]
};

const normalize = (v = '') => v.toLowerCase().replace(/[^a-z]/g, '');
const findBase = (rows, event, player, market, side) => rows.find((r) =>
  r.event === event && r.available !== false && r.player && normalize(r.player) === normalize(player) &&
  r.market === market && r.side === side &&
  // BKR alternates omit this base-market separator; BEO only emits main markets.
  (r.book === 'BEO' || market === 'atd_1_plus' || / - (Over|Under) /.test(r.selection || ''))
);
const offer = (event, player, market, side) => {
  const row = findBase(bkr.rows, event, player, market, side) || findBase(beo.rows, event, player, market, side);
  if (!row) return { player, market, side, status: 'unavailable_on_captured_boards' };
  const evidence = player === 'Greg Dulcich' || player === 'Quinshon Judkins'
    ? 'source_supported_market_matched'
    : 'parlay_menu_only';
  return { player: row.player, market: row.market, side: row.side, line: row.line, odds: row.odds, book: row.book, capturedAt: row.capturedAt, selection: row.selection, evidence };
};
const gameLine = (event, bet, side) => bkr.rows.find((r) => r.event === event && r.sectionTitle === 'Game' && r.bet === bet && r.side === side && r.available !== false);
const moneyline = (event) => bkr.rows.filter((r) => r.event === event && r.sectionTitle === 'Game' && r.bet === 'moneyline' && r.available !== false);
const probability = (odds) => odds < 0 ? -odds / (-odds + 100) : 100 / (odds + 100);
const contestLine = (team) => contest.lines.find((x) => x.favorite === team || x.underdog === team);

const sideRank = ['LV', 'BUF', 'ATL', 'NO', 'CLE', 'CIN', 'PHI', 'TEN', 'DET', 'WAS'];
const totalRank = [
  ['Philadelphia Eagles @ Jacksonville Jaguars', 'Over'], ['Las Vegas Raiders @ New England Patriots', 'Over'],
  ['San Francisco 49ers @ Seattle Seahawks', 'Under'], ['Denver Broncos @ Los Angeles Chargers', 'Over'],
  ['Cleveland Browns @ New York Jets', 'Under'], ['Cincinnati Bengals @ Miami Dolphins', 'Over'],
  ['Detroit Lions @ Arizona Cardinals', 'Over'], ['Buffalo Bills @ Los Angeles Rams', 'Over']
];
const contestRank = ['LV', 'BUF', 'ATL', 'NO', 'CLE', 'CIN', 'PHI', 'TEN', 'DET', 'WAS'];
const lineLeg = (event, bet, side) => {
  const row = gameLine(event, bet, side);
  return row ? { type: bet, event, selection: row.selection, line: row.line, odds: row.odds, book: row.book, capturedAt: row.capturedAt } : { type: bet, event, status: 'unavailable_on_captured_board' };
};
const templateMenus = [
  {
    name: 'Chalk / volume cross-game menu',
    construction: 'Three unrelated volume markets; deliberately avoids same-game correlation and TD variance.',
    legs: [
      offer('Cleveland Browns @ New York Jets', 'Quinshon Judkins', 'rush_yds', 'Under'),
      offer('Cincinnati Bengals @ Miami Dolphins', 'Greg Dulcich', 'rec_yds', 'Over'),
      offer('Buffalo Bills @ Los Angeles Rams', 'Josh Allen', 'pass_yds', 'Over')
    ]
  },
  {
    name: 'LV dog-plus-over correlation test',
    construction: 'Competitive LV game script: dog cover, game Over, Raiders pass volume. Confirm builder acceptance and repricing.',
    legs: [
      lineLeg('Las Vegas Raiders @ New England Patriots', 'spread', 'Las Vegas Raiders'),
      lineLeg('Las Vegas Raiders @ New England Patriots', 'total', 'Over'),
      offer('Las Vegas Raiders @ New England Patriots', 'Kirk Cousins', 'pass_yds', 'Over'),
      offer('Las Vegas Raiders @ New England Patriots', 'Brock Bowers', 'rec_yds', 'Over')
    ]
  },
  {
    name: 'PHI@JAX Island over-anchor test',
    construction: 'Over anchor plus one passer, one rushing/receiver volume leg; do not add multiple TD anchors.',
    legs: [
      lineLeg('Philadelphia Eagles @ Jacksonville Jaguars', 'total', 'Over'),
      offer('Philadelphia Eagles @ Jacksonville Jaguars', 'Trevor Lawrence', 'pass_yds', 'Over'),
      offer('Philadelphia Eagles @ Jacksonville Jaguars', 'Jalen Hurts', 'rush_yds', 'Over'),
      offer('Philadelphia Eagles @ Jacksonville Jaguars', 'Brian Thomas', 'rec_yds', 'Over')
    ]
  },
  {
    name: 'TD watchlist, isolated from volume stacks',
    construction: 'Two scoring-role anchors only. Treat as a separate high-variance watchlist, never as proof of the volume thesis.',
    legs: [
      offer('Baltimore Ravens @ Atlanta Falcons', 'Bijan Robinson', 'atd_1_plus', 'Yes'),
      offer('Buffalo Bills @ Los Angeles Rams', 'Davante Adams', 'atd_1_plus', 'Yes')
    ]
  }
];

const payload = {
  schema_version: 'week5_expanded_decision_support_v1',
  generated_at: new Date().toISOString(),
  status: 'proposed_analysis_only',
  boundary: 'No official selections, tickets, account actions, ledger writes, or sportsbook execution are created by this artifact.',
  sources: {
    bookmaker: { capturedAt: bkr.capturedAt, rows: bkr.rows.length },
    betonline: { capturedAt: beo.capturedAt, rows: beo.rows.length },
    contest: { recordedOn: contest.recorded_on, status: contest.verification.status }
  },
  games: games.map((g) => ({ ...g, sideOffer: gameLine(g.event, 'spread', g.side === g.away ? g.away === 'PHI' ? 'Philadelphia Eagles' : undefined : undefined) })),
  side_candidates: sideRank.map((team, index) => {
    const g = games.find((x) => x.side === team);
    const label = g.side === g.away ? g.event.split(' @ ')[0] : g.event.split(' @ ')[1];
    const row = gameLine(g.event, 'spread', label);
    return { rank: index + 1, event: g.event, team, projection: `${g.away} ${g.awayPts}–${g.home} ${g.homePts}`, line: row?.line ?? null, odds: row?.odds ?? null, book: row?.book ?? 'unavailable', rationale: g.note };
  }),
  total_candidates: totalRank.map(([event, side], index) => {
    const g = games.find((x) => x.event === event); const row = gameLine(event, 'total', side);
    return { rank: index + 1, event, side, projection: `${g.awayPts + g.homePts}`, line: row?.line ?? null, odds: row?.odds ?? null, book: row?.book ?? 'unavailable', rationale: g.note };
  }),
  supercontest: contestRank.map((team, index) => {
    const g = games.find((x) => x.side === team); const c = contestLine(team);
    return { rank: index + 1, bucket: index < 5 ? 'best_five_proposed' : 'alternate_five_proposed', team, event: g.event, contest_line: c ? (c.favorite === team ? c.favorite_spread : -c.favorite_spread) : null, projection: `${g.away} ${g.awayPts}–${g.home} ${g.homePts}`, rationale: g.note };
  }),
  props: Object.fromEntries(games.map((g) => [g.event, (propMenus[g.event] || []).map(([player, market, side]) => offer(g.event, player, market, side))])),
  parlay_template_menus: templateMenus,
  confidence_pool: games.map((g) => {
    const rows = moneyline(g.event); const favorite = rows.sort((a, b) => probability(b.odds) - probability(a.odds))[0];
    return { event: g.event, pick: favorite?.side ?? 'unavailable', odds: favorite?.odds ?? null, implied_probability_raw: favorite ? Number(probability(favorite.odds).toFixed(3)) : null };
  }).sort((a, b) => (b.implied_probability_raw ?? 0) - (a.implied_probability_raw ?? 0)).map((x, i, arr) => ({ confidence: arr.length - i, ...x }))
};

const teamName = { PHI: 'Philadelphia Eagles', JAX: 'Jacksonville Jaguars', IND: 'Indianapolis Colts', PIT: 'Pittsburgh Steelers', MIN: 'Minnesota Vikings', NO: 'New Orleans Saints', CLE: 'Cleveland Browns', NYJ: 'New York Jets', CIN: 'Cincinnati Bengals', MIA: 'Miami Dolphins', LV: 'Las Vegas Raiders', NE: 'New England Patriots', NYG: 'New York Giants', WAS: 'Washington Commanders', HOU: 'Houston Texans', TEN: 'Tennessee Titans', DEN: 'Denver Broncos', LAC: 'Los Angeles Chargers', SF: 'San Francisco 49ers', SEA: 'Seattle Seahawks', DET: 'Detroit Lions', ARI: 'Arizona Cardinals', CHI: 'Chicago Bears', GB: 'Green Bay Packers', BAL: 'Baltimore Ravens', ATL: 'Atlanta Falcons', BUF: 'Buffalo Bills', LAR: 'Los Angeles Rams' };
const fmt = (x) => x == null ? '—' : x > 0 ? `+${x}` : String(x);
const propText = (x) => x.status ? `${x.player}: unavailable on captured boards` : `${x.player} ${x.side} ${x.line ?? 'ATD'} (${fmt(x.odds)}, ${x.book}; ${x.evidence})`;
const legText = (x) => x.status ? `${x.type || x.player}: unavailable on captured board` : x.type ? `${x.selection} (${fmt(x.odds)}, ${x.book})` : propText(x);
let md = `# Week 5 Expanded Decision-Support Board\n\nGenerated ${payload.generated_at}. **Status: proposed analysis only.** This intentionally expands beyond the guardrail-cleared shortlist. It does not create official AI picks, a submitted pool entry, a card, a ticket, or a sportsbook action. Every row remains a hypothesis or menu option until separately reviewed at the live price.\n\n## Freshness and scope\n\n- BKR: ${bkr.rows.length.toLocaleString()} rows, captured ${bkr.capturedAt}.\n- BEO: ${beo.rows.length.toLocaleString()} rows, captured ${beo.capturedAt}.\n- Availability/starter reconciliation was refreshed today; no player marked out or questionable is deliberately used in the prop menus below. Late inactive news still supersedes this file.\n- TB @ DAL is final and excluded.\n\n## Projection map — every remaining game\n\n| Game | Projection | Side menu | Total menu | Why it is in the menu |\n|---|---:|---|---|---|\n`;
for (const g of games) { const side = gameLine(g.event, 'spread', teamName[g.side]); const total = gameLine(g.event, 'total', g.total); md += `| ${g.event} | ${g.away} ${g.awayPts}–${g.home} ${g.homePts} | ${g.side} ${side ? `${fmt(side.line)} (${fmt(side.odds)})` : 'unavailable'} | ${g.total} ${total ? `${total.line} (${fmt(total.odds)})` : 'unavailable'} | ${g.note} |\n`; }
md += `\n## SuperContest — five proposed choices and five alternates\n\nThese use the user-verified contest board, not the sportsbook board. They are ranking support only; no entry is selected or submitted.\n\n| Rank | Bucket | Pick | Contest line | Projection | Reason |\n|---:|---|---|---:|---|---|\n`;
for (const x of payload.supercontest) md += `| ${x.rank} | ${x.bucket === 'best_five_proposed' ? 'Best five' : 'Alternate'} | ${x.team} | ${fmt(x.contest_line)} | ${x.projection} | ${x.rationale} |\n`;
md += `\n## Sportsbook-side menu — top 10\n\nNot a list of verified edges. Ranking combines the existing source digest, projection cushion, contest/display-price context, and availability, while retaining conflicts in the rationale.\n\n| Rank | Side | BKR line | Projection | Context |\n|---:|---|---:|---|---|\n`;
for (const x of payload.side_candidates) md += `| ${x.rank} | ${x.team} | ${fmt(x.line)} (${fmt(x.odds)}) | ${x.projection} | ${x.rationale} |\n`;
md += `\n## Totals menu — top 8\n\n| Rank | Total | BKR line | Projection total | Context |\n|---:|---|---:|---:|---|\n`;
for (const x of payload.total_candidates) md += `| ${x.rank} | ${x.event}: ${x.side} | ${x.line} (${fmt(x.odds)}) | ${x.projection} | ${x.rationale} |\n`;
md += `\n## Confidence and pick'em pool support\n\n**Confidence pool baseline:** this is a raw BKR-moneyline ordering for the market strategy, not a de-vigged probability model and not an entered card. Assign descending confidence only after removing any game your pool has already locked.\n\n| Confidence | Market winner | Game | BKR ML | Raw implied win % |\n|---:|---|---|---:|---:|\n`;
for (const x of payload.confidence_pool) md += `| ${x.confidence} | ${x.pick} | ${x.event} | ${fmt(x.odds)} | ${x.implied_probability_raw == null ? '—' : `${(x.implied_probability_raw * 100).toFixed(1)}%`} |\n`;
md += `\n**Pick'em baseline:** use the same favorite column for a market-only card. Evidence-aware upset considerations are **LV over NE** and **BUF over LAR**; they are not substitutes for the market baseline unless the pool's scoring/ownership rules reward contrarian outcomes.\n\n## Player-prop basket — three current menu options in every game\n\nA menu row means the named market is published in a current captured BKR/BEO row. It is **not** a claim of edge, expected value, or same-game-builder acceptance. \`source_supported_market_matched\` is limited to Dulcich and Judkins; all other rows are \`parlay_menu_only\` and require independent pricing/availability review.\n\n`;
for (const g of games) { md += `### ${g.event}\n\n`; for (const p of payload.props[g.event]) md += `- ${propText(p)}\n`; md += '\n'; }
md += `## Curated template menus — no tickets\n\nThese are construction candidates, not tickets. No combined price, payout, stake, or book acceptance is assumed.\n\n`;
for (const t of templateMenus) { md += `### ${t.name}\n\n${t.construction}\n\n`; for (const leg of t.legs) md += `- ${legText(leg)}\n`; md += '\n'; }
md += `**Anti-correlation check:** reject any template that asks for an offensive passing under while requiring multiple receivers from that same offense to clear volume thresholds, unless the book's reprice explicitly compensates for that narrow outcome.\n\n## Review gates before anything becomes an official recommendation\n\n1. Verify the exact line and price in the intended book immediately before review.\n2. Recheck inactive/status news, especially any quarterback or skill player whose role changed after the 09:45 PT availability refresh.\n3. Keep the official recommendation ledger and any actual ticket separate from this menu.\n4. Log a no-bet outcome for menu rows not selected so later review can measure selection bias.\n`;

write('data/research-intel/proposed/2026-w05-expanded-decision-support.json', JSON.stringify(payload, null, 2) + '\n');
write('reports/bets/2026-w05-expanded-decision-support.md', md);
console.log('wrote proposed decision-support JSON and Markdown');
