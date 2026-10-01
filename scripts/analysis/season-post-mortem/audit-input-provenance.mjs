import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeName, normalizeTeam } from './grade.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const WEEKS = new Set([1, 2, 3]);
const outDir = path.join(ROOT, 'reports/analysis/w1-3-deep/codex');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') { value += char; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === ',') { row.push(value); value = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else value += char;
  }
  if (row.length || value) { row.push(value); rows.push(row); }
  const [headers, ...body] = rows;
  return body.map((fields) => Object.fromEntries(headers.map((header, index) => [header, fields[index] ?? ''])));
}

export function canonicalGameKey(value = '') {
  const teams = String(value).match(/\b(?:ARI|ATL|BAL|BUF|CAR|CHI|CIN|CLE|DAL|DEN|DET|GB|HOU|IND|JAC|JAX|KC|LV|LVR|LAC|LAR|MIA|MIN|NE|NO|NYG|NYJ|PHI|PIT|SF|SEA|TB|TEN|WAS|WSH)\b/g) || [];
  if (teams.length !== 2) return null;
  return [...teams.map(normalizeTeam)].sort().join(':');
}

export function validMarket({ spread, total }) {
  return Number.isFinite(Number(spread)) && Number.isFinite(Number(total))
    && Number(total) > 0;
}

function byWeek(rows, weekOf) {
  return Object.fromEntries([...WEEKS].map((week) => [week, rows.filter((row) => Number(weekOf(row)) === week).length]));
}

function readBoxes() {
  const directory = path.join(ROOT, 'data/fantasy/boxscores');
  return fs.readdirSync(directory).filter((file) => file.endsWith('.json')).map((file) => {
    const data = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
    const competition = data.header?.competitions?.[0];
    const teams = competition?.competitors?.map((entry) => normalizeTeam(entry.team?.abbreviation)).filter(Boolean) || [];
    const players = new Set((data.boxscore?.players || []).flatMap((team) => (team.statistics || [])
      .flatMap((stat) => (stat.athletes || []).map((athlete) => normalizeName(athlete.athlete?.displayName)))));
    const pickcenter = data.pickcenter?.[0] || {};
    return {
      file,
      id: String(data.header?.id || file.replace(/^espn-|\.json$/g, '')),
      week: Number(data.header?.week),
      game_key: teams.length === 2 ? [...teams].sort().join(':') : null,
      players,
      has_pickcenter_market: validMarket({ spread: pickcenter.spread, total: pickcenter.overUnder }),
    };
  }).filter((box) => WEEKS.has(box.week));
}

function supportFor(row, boxes) {
  const gameKey = canonicalGameKey(row.game);
  const weekly = boxes.filter((box) => box.week === Number(row.week));
  if (gameKey) return weekly.some((box) => box.game_key === gameKey) ? 'exact_game_box' : 'missing_game_box';
  if (!row.player) return 'no_game_or_player';
  const matches = weekly.filter((box) => box.players.has(normalizeName(row.player)));
  return matches.length === 1 ? 'unique_player_box' : matches.length === 0 ? 'missing_player_box' : 'ambiguous_player_box';
}

function markdown(audit) {
  const table = (title, values) => [
    `### ${title}`,
    '',
    '| Week | 1 | 2 | 3 | Total |',
    '| --- | ---: | ---: | ---: | ---: |',
    `| Rows | ${values[1]} | ${values[2]} | ${values[3]} | ${values.total} |`,
    '',
  ].join('\n');
  return `# C1 input-provenance audit\n\n`
    + `Generated from the committed local files by \`node scripts/analysis/season-post-mortem/audit-input-provenance.mjs\`. This audit is read-only: it does not alter the wagers ledger, C1 results, prices, or any account state.\n\n`
    + `## Decision\n\n`
    + `\`legs_all.csv\` remains the declared canonical **leg catalog**, but the current checkout cannot reproduce its ${audit.c1.local_espn_claims} local-ESPN terminal grades or support a valid W1–3 pre-game proxy test. No forward-useable rule is promoted. Any partial result would be a **hypothesis** (and below the required 2 SE threshold).\n\n`
    + `The live checkout has ${audit.schedule.games.total} scheduled W1–3 games but ${audit.schedule.usable_market.total} usable saved spread/total rows. It has ${audit.boxes.count.total} saved box captures: ${audit.boxes.count[1]} in W1, ${audit.boxes.count[2]} in W2, and ${audit.boxes.count[3]} in W3. The C1 artifact, by contrast, claims ${audit.c1.local_espn_claims} local-ESPN terminal grades.\n\n`
    + `## Coverage\n\n`
    + table('Scheduled games', audit.schedule.games)
    + table('Schedule rows with usable saved market fields', audit.schedule.usable_market)
    + table('Saved ESPN box captures', audit.boxes.count)
    + table('C1 rows reproducibly supported by current week-matched boxes', audit.c1.supported)
    + table('C1 terminal rows lacking current week-matched support', audit.c1.unsupported)
    + `## Why pre-game H1/H2/H6 cannot be tested now\n\n`
    + `- H1 needs pre-kickoff spread/total plus a same-week team box score to test whether a proxy predicts 35+ pass attempts. The schedule contains zero usable saved markets, and W2 has no box capture.\n`
    + `- H2 needs the same pre-game implied team total for the ATD split. No W1–3 schedule row supplies it.\n`
    + `- H6 needs the saved favourite/dog designation for each player-prop team. A pickcenter market exists only for the ${audit.boxes.pickcenter_markets} retained box files, not the full W1–3 population.\n\n`
    + `## Required recovery inputs\n\n`
    + `1. Restore the 30 missing Week 2–3 ESPN box-score captures (or a committed equivalent with game id, final, passing attempts, and player stats).\n`
    + `2. Restore a timestamped W1–3 ESPN spread/total capture for all 48 schedule games; do not substitute a fresh line for historical analysis.\n`
    + `3. Preserve a game identifier for C1 player rows that currently omit \`game\`, so the outcome and its pre-game market can be joined without name-only inference.\n\n`
    + `## Audit details\n\n`
    + `- C1 rows: ${audit.c1.rows}; terminal results: ${audit.c1.terminal_rows}; rows labelled \`local_espn_boxscore\`: ${audit.c1.local_espn_claims}.\n`
    + `- The C1 result counts are 256 WON + 291 LOST + 1 PUSH = 548 terminal rows; earlier 547-count prose is an arithmetic typo, not an additional unresolved leg.\n`
    + `- Supported rows use an exact same-week game match, or a player who occurs in exactly one retained same-week box. Unsupported rows are not regraded; they are merely reported.\n`
    + `- The test intentionally rejects a zero total as a market value; a pickcenter line with total 0/spread 0 is not a saved pre-game price.\n`;
}

export function auditInputs({ schedule, boxes, legs }) {
  const games = schedule.filter((game) => WEEKS.has(Number(game.week)));
  const marketRows = games.filter((game) => validMarket(game));
  const terminal = legs.filter((row) => ['WON', 'LOST', 'PUSH'].includes(row.result));
  const supportedRows = legs.filter((row) => ['exact_game_box', 'unique_player_box'].includes(supportFor(row, boxes)));
  const unsupportedTerminal = terminal.filter((row) => !['exact_game_box', 'unique_player_box'].includes(supportFor(row, boxes)));
  const withTotal = (values) => ({ ...values, total: Object.values(values).reduce((sum, value) => sum + value, 0) });
  return {
    schedule: { games: withTotal(byWeek(games, (game) => game.week)), usable_market: withTotal(byWeek(marketRows, (game) => game.week)) },
    boxes: { count: withTotal(byWeek(boxes, (box) => box.week)), pickcenter_markets: boxes.filter((box) => box.has_pickcenter_market).length },
    c1: {
      rows: legs.length,
      terminal_rows: terminal.length,
      local_espn_claims: legs.filter((row) => row.evidence === 'local_espn_boxscore' && ['WON', 'LOST', 'PUSH'].includes(row.result)).length,
      supported: withTotal(byWeek(supportedRows, (row) => row.week)),
      unsupported: withTotal(byWeek(unsupportedTerminal, (row) => row.week)),
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const schedule = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/schedule.json'), 'utf8'));
  const boxes = readBoxes();
  const legs = parseCsv(fs.readFileSync(path.join(outDir, 'legs_all.csv'), 'utf8'));
  const audit = auditInputs({ schedule, boxes, legs });
  fs.writeFileSync(path.join(outDir, 'input_provenance_audit.json'), JSON.stringify(audit, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'input_provenance_audit.md'), markdown(audit));
  console.log(JSON.stringify(audit, null, 2));
}
