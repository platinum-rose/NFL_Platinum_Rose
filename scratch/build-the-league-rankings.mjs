import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DOCS = path.join(ROOT, 'docs', 'fantasy');
const OUT_PUBLIC = path.join(ROOT, 'public');

const LEAGUE = {
  id: 31798,
  name: '2025 - The League',
  season: 2026,
  teams: 12,
  roster: 'QB, WR, WR, RB, RB, TE, W/R, K, D, D, D, BN, BN, BN, BN, BN, BN',
};

const SOURCE_NOTE = 'Based on the 2026 Honey Badgers build inputs; rescored for The League settings.';

function readPlayers(rel) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  return Array.isArray(raw.players) ? raw.players : [];
}

function n(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function round(value, digits = 1) {
  return Number(value.toFixed(digits));
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const players = new Map();

for (const pos of ['QB', 'RB', 'WR', 'TE']) {
  for (const p of readPlayers(`scratch/fp-live/proj-${pos}.json`)) {
    const s = p.stats ?? {};
    const points =
      n(s.pass_yds) / 25 +
      n(s.pass_tds) * 6 +
      n(s.pass_ints) * -2 +
      n(s.rush_yds) / 10 +
      n(s.rush_tds) * 6 +
      n(s.rec_rec) * 0.5 +
      n(s.rec_yds) / 10 +
      n(s.rec_tds) * 6 +
      n(s.ret_tds) * 6 +
      n(s['2pt_tds']) * 2 +
      n(s.fumbles) * -2;

    players.set(`${p.name}|${p.position_id}`, {
      name: p.name,
      pos: p.position_id,
      displayPos: p.position_id,
      team: p.team_id ?? '',
      points: round(points),
      genericHalf: round(n(s.points_half)),
    });
  }
}

const idpPositions = new Set(['LB', 'DB', 'DL', 'CB', 'S', 'DE', 'DT', 'EDGE']);
for (const p of readPlayers('scratch/fp-live/proj-IDP.json')) {
  const pos = p.position_id;
  if (!idpPositions.has(pos)) continue;
  const s = p.stats ?? {};
  const points =
    n(s.def_tackle) * 1 +
    n(s.def_assist) * 0.5 +
    n(s.def_sack) * 3 +
    n(s.def_int) * 3 +
    n(s.def_ff) * 2 +
    n(s.def_fr) * 2 +
    n(s.def_td) * 6 +
    n(s.def_safety) * 2 +
    n(s.def_pd) * 1 +
    n(s.def_tlost) * 0.5;

  const key = `${p.name}|${pos}`;
  if (!players.has(key)) {
    players.set(key, {
      name: p.name,
      pos,
      displayPos: 'IDP',
      team: p.team_id ?? '',
      points: round(points),
      genericHalf: round(n(s.points_half)),
    });
  }
}

const allPlayers = [...players.values()];

function replacementPoints(posList, rank) {
  const posSet = new Set(posList);
  const pool = allPlayers
    .filter((p) => posSet.has(p.pos))
    .sort((a, b) => b.points - a.points);
  if (!pool.length) return 0;
  return pool[Math.min(rank - 1, pool.length - 1)].points;
}

const replacement = {
  QB: replacementPoints(['QB'], 13),
  RB: replacementPoints(['RB'], 30),
  WR: replacementPoints(['WR'], 32),
  TE: replacementPoints(['TE'], 14),
};
const idpReplacement = replacementPoints([...idpPositions], 38);
for (const pos of idpPositions) replacement[pos] = idpReplacement;

for (const p of allPlayers) {
  p.vorp = round(p.points - (replacement[p.pos] ?? 0));
}

const keepers = new Map();
try {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'fantasy', 'the_league_declared_keepers_2026.json'), 'utf8'));
  for (const [team, info] of Object.entries(registry.teams ?? {})) {
    for (const keeper of info.keepers ?? []) {
      keepers.set(String(keeper.player).toLowerCase(), {
        fantasyTeam: team,
        costRound: keeper.cost_round,
        status: keeper.status ?? 'LOCKED',
      });
    }
  }
} catch {
  // Keepers are helpful annotations, not required for the rankings math.
}

allPlayers.sort((a, b) => {
  if (b.vorp !== a.vorp) return b.vorp - a.vorp;
  if (b.points !== a.points) return b.points - a.points;
  return a.name.localeCompare(b.name);
});

function tag(rank, player) {
  const keeper = keepers.get(player.name.toLowerCase());
  if (keeper) return `Locked Keeper - ${keeper.fantasyTeam} Rd ${keeper.costRound}`;
  if (rank <= 204) return `Round ${Math.ceil(rank / 12)}`;
  return 'Deep Stash';
}

const ranked = allPlayers.slice(0, 260);
const customRows = [['Rank', 'Player', 'Position', 'Team', 'Tag']];
const detailRows = [[
  'OverallRank',
  'Round',
  'Player',
  'Position',
  'Team',
  'TheLeagueProjPoints',
  'VORP',
  'GenericHalfPPRPoints',
  'KeeperStatus',
]];
const yahooRows = [];
const plainRows = [];

ranked.forEach((p, idx) => {
  const rank = idx + 1;
  const keeper = keepers.get(p.name.toLowerCase());
  customRows.push([rank, p.name, p.displayPos, p.team, tag(rank, p)]);
  detailRows.push([
    rank,
    Math.ceil(rank / 12),
    p.name,
    p.pos,
    p.team,
    p.points,
    p.vorp,
    p.genericHalf,
    keeper ? `${keeper.status} ${keeper.fantasyTeam} Rd ${keeper.costRound}` : '',
  ]);
  yahooRows.push([rank, p.name]);
  plainRows.push(p.name);
});

const meta = [
  '# The League 2026 Custom Rankings',
  '',
  `Generated: ${new Date().toISOString()}`,
  `League ID: ${LEAGUE.id}`,
  `League Name From Settings: ${LEAGUE.name}`,
  `Season Modeled: ${LEAGUE.season}`,
  `Roster: ${LEAGUE.roster}`,
  '',
  SOURCE_NOTE,
  '',
  'Scoring adjustments from Honey Badgers source:',
  '- Passing TD: 6',
  '- Interception: -2',
  '- Receptions: 0.5',
  '- IDP: solo tackle 1, assist 0.5, sack 3, INT 3, forced/recovered fumble 2, TD 6, safety 2, pass defended 1, TFL 0.5',
  '',
  'Kickers are not ranked because the source Honey Badgers projection set does not include kicker projections.',
  '',
  `Replacement levels: QB ${replacement.QB}, RB ${replacement.RB}, WR ${replacement.WR}, TE ${replacement.TE}, IDP ${idpReplacement}`,
  `Keeper annotations loaded: ${keepers.size}`,
  '',
];

function writeCsv(file, rows) {
  fs.writeFileSync(file, rows.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n', 'utf8');
}

fs.mkdirSync(OUT_DOCS, { recursive: true });
fs.mkdirSync(OUT_PUBLIC, { recursive: true });

writeCsv(path.join(OUT_DOCS, '2026_The_League_Custom_Rankings.csv'), customRows);
writeCsv(path.join(OUT_DOCS, '2026_The_League_Overall_Board_Detail.csv'), detailRows);
writeCsv(path.join(OUT_DOCS, '2026_The_League_Yahoo_Import_Format.csv'), yahooRows);
fs.writeFileSync(path.join(OUT_DOCS, '2026_The_League_Plain_Names.txt'), plainRows.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(OUT_DOCS, '2026_The_League_Rankings_Readme.md'), meta.join('\n'), 'utf8');

writeCsv(path.join(OUT_PUBLIC, '2026_The_League_Custom_Rankings.csv'), customRows);
writeCsv(path.join(OUT_PUBLIC, '2026_The_League_Yahoo_Import_Format.csv'), yahooRows);
fs.writeFileSync(path.join(OUT_PUBLIC, '2026_The_League_Plain_Names.txt'), plainRows.join('\n') + '\n', 'utf8');

console.log(`Generated ${ranked.length} ranked players for The League.`);
console.log(`Loaded ${keepers.size} keeper annotations.`);
console.log('Top 20:');
for (const [idx, p] of ranked.slice(0, 20).entries()) {
  console.log(`${String(idx + 1).padStart(2, ' ')}. ${p.name} (${p.displayPos}, ${p.team}) points=${p.points} vorp=${p.vorp} ${tag(idx + 1, p)}`);
}
