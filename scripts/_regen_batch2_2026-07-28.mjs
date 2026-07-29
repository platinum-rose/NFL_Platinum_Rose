#!/usr/bin/env node
// One-off regen (2026-07-28, batch 2): re-derive extracted_picks/analysis_notes
// for the 3 episodes reprocessed today (full-duration-coverage fix) using the
// NOW-FIXED normalizeSide in scripts/gemini-podcast-shadow-harness.js (a
// second, distinct bug found in that copy: `if (!raw) return 'UNKNOWN';` was
// short-circuiting before the yesNoMarket UNKNOWN->YES resolution could run).
// No API calls -- re-parses the already-stored raw_model_response.

import fs from 'node:fs';
import path from 'node:path';

const OBS_DIR = path.join(process.cwd(), 'data', 'shadow-harness', 'observations');
const TARGETS = ['youtube-4OxpAX6UJlM', 'youtube-b9NL40Zogkw', 'youtube-zNZzcHDqhg4'];

// --- copied verbatim from the current (fixed) scripts/gemini-podcast-shadow-harness.js ---
const TEAM_MAP = {
  'arizona': 'ARI', 'cardinals': 'ARI', 'ari': 'ARI',
  'atlanta': 'ATL', 'falcons': 'ATL', 'atl': 'ATL',
  'baltimore': 'BAL', 'ravens': 'BAL', 'bal': 'BAL',
  'buffalo': 'BUF', 'bills': 'BUF', 'buf': 'BUF',
  'carolina': 'CAR', 'panthers': 'CAR', 'car': 'CAR',
  'chicago': 'CHI', 'bears': 'CHI', 'chi': 'CHI',
  'cincinnati': 'CIN', 'bengals': 'CIN', 'cin': 'CIN',
  'cleveland': 'CLE', 'browns': 'CLE', 'cle': 'CLE',
  'dallas': 'DAL', 'cowboys': 'DAL', 'dal': 'DAL',
  'denver': 'DEN', 'broncos': 'DEN', 'den': 'DEN',
  'detroit': 'DET', 'lions': 'DET', 'det': 'DET',
  'green bay': 'GB', 'packers': 'GB', 'gb': 'GB',
  'houston': 'HOU', 'texans': 'HOU', 'hou': 'HOU',
  'indianapolis': 'IND', 'colts': 'IND', 'ind': 'IND',
  'jacksonville': 'JAX', 'jags': 'JAX', 'jaguars': 'JAX', 'jax': 'JAX',
  'kansas city': 'KC', 'chiefs': 'KC', 'kc': 'KC',
  'las vegas': 'LV', 'raiders': 'LV', 'lv': 'LV',
  'la chargers': 'LAC', 'chargers': 'LAC', 'lac': 'LAC',
  'la rams': 'LAR', 'rams': 'LAR', 'lar': 'LAR',
  'miami': 'MIA', 'dolphins': 'MIA', 'mia': 'MIA',
  'minnesota': 'MIN', 'vikings': 'MIN', 'min': 'MIN',
  'new england': 'NE', 'patriots': 'NE', 'pats': 'NE', 'ne': 'NE',
  'new orleans': 'NO', 'saints': 'NO', 'no': 'NO',
  'ny giants': 'NYG', 'giants': 'NYG', 'nyg': 'NYG',
  'ny jets': 'NYJ', 'jets': 'NYJ', 'nyj': 'NYJ',
  'philadelphia': 'PHI', 'eagles': 'PHI', 'phi': 'PHI',
  'pittsburgh': 'PIT', 'steelers': 'PIT', 'pit': 'PIT',
  'san francisco': 'SF', '49ers': 'SF', 'niners': 'SF', 'sf': 'SF',
  'seattle': 'SEA', 'seahawks': 'SEA', 'sea': 'SEA',
  'tampa bay': 'TB', 'buccaneers': 'TB', 'bucs': 'TB', 'tb': 'TB',
  'tennessee': 'TEN', 'titans': 'TEN', 'ten': 'TEN',
  'washington': 'WAS', 'commanders': 'WAS', 'was': 'WAS'
};

function normalizeTeam(raw) {
  if (!raw) return 'UNK';
  const clean = String(raw).trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
  if (clean === 'los') return 'LAC';
  return TEAM_MAP[clean] || String(raw).toUpperCase().slice(0, 3);
}

function normalizeSide(raw, market = 'general', team = null) {
  const clean = String(raw || 'UNKNOWN').trim().toUpperCase();
  const yesNoMarket = [
    'division_winner', 'conference_winner', 'conference_no_1_seed', 'super_bowl_winner',
    'mvp', 'opoy', 'dpoy', 'oroy', 'droy', 'coach_of_the_year', 'no_1_overall_pick'
  ].includes(market);
  if (yesNoMarket && team && clean === String(team).toUpperCase()) return 'YES';
  if (yesNoMarket && (clean === 'UNKNOWN' || clean.includes('OVER') || clean.includes('WIN') || clean.includes('YES') || clean.includes('TO WIN'))) return 'YES';
  if (yesNoMarket && (clean.includes('NO') || clean.includes('UNDER') || clean.includes('FADE'))) return 'NO';
  if (clean.includes('OVER')) return 'OVER';
  if (clean.includes('UNDER')) return 'UNDER';
  if (['YES', 'WIN', 'WINNER', 'TO WIN'].some(v => clean === v || clean.includes(v))) return 'YES';
  if (['NO', 'FADE'].some(v => clean === v || clean.includes(v))) return 'NO';
  return clean;
}

function normalizeMarket(raw) {
  if (!raw) return 'general';
  const clean = String(raw).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (clean.includes('win_total') || clean === 'wins' || clean.includes('season_win')) return 'win_total';
  if (clean.includes('make_playoff') || clean === 'playoffs') return 'make_playoffs';
  if (clean.includes('division_winner') || clean.includes('division_champion') || clean.includes('division_champ') || clean.includes('afc_south_champ') || clean.includes('afc_north_champ') || clean.includes('afc_east_champ') || clean.includes('afc_west_champ') || clean.includes('nfc_south_champ') || clean.includes('nfc_north_champ') || clean.includes('nfc_east_champ') || clean.includes('nfc_west_champ')) return 'division_winner';
  if (clean.includes('conference_no_1_seed') || clean.includes('no_1_seed') || clean.includes('number_1_seed') || clean.includes('number_one_seed')) return 'conference_no_1_seed';
  if (clean.includes('super_bowl')) return 'super_bowl_winner';
  if (clean.includes('conference_champion') || clean.includes('conference_winner') || clean.includes('nfc_conference') || clean.includes('afc_conference') || clean.includes('nfc_champion') || clean.includes('afc_champion')) return 'conference_winner';
  if (clean.includes('overall_pick') || clean.includes('no_1_overall') || clean.includes('number_1_overall')) return 'no_1_overall_pick';
  if (clean.includes('mvp') || clean.includes('most_valuable_player')) return 'mvp';
  if (clean === 'opoy' || clean.includes('offensive_player_of_the_year')) return 'opoy';
  if (clean === 'dpoy' || clean.includes('defensive_player_of_the_year')) return 'dpoy';
  if (clean === 'oroy' || clean.includes('offensive_rookie_of_the_year')) return 'oroy';
  if (clean === 'droy' || clean.includes('defensive_rookie_of_the_year')) return 'droy';
  if (clean.includes('coach_of_the_year')) return 'coach_of_the_year';
  if (clean.includes('comeback_player')) return 'comeback_player_of_the_year';
  if (clean.includes('fewest_win')) return 'fewest_wins';
  if (clean.includes('receiving_yard')) return 'season_receiving_yards';
  if (clean.includes('passing_yard')) return 'season_passing_yards';
  if (clean.includes('passing_touchdown') || clean.includes('passing_td')) return 'season_passing_tds';
  if (clean.includes('interception')) return 'interceptions_leader';
  if (clean.includes('rushing_touchdown') && clean.includes('leader')) return 'rushing_tds_leader';
  if (clean.includes('rushing_touchdown') || clean.includes('rushing_td')) return 'season_rushing_tds';
  if (clean.includes('spread')) return 'spread';
  if (clean.includes('future')) return 'futures';
  if (clean.includes('prop')) return 'player_prop';
  return clean;
}

function normalizePick(p) {
  const market = normalizeMarket(p.market);
  const team = normalizeTeam(p.team);
  return {
    team,
    market,
    side: normalizeSide(p.side || p.selection, market, team),
    line: p.line != null && p.line !== '' ? Number(p.line) : null,
    price: p.price != null && p.price !== '' ? Number(p.price) : null,
    week: p.week != null && p.week !== '' ? Number(p.week) : null,
    speaker: p.speaker || 'Host',
    source_timestamp: Number(p.source_timestamp || p.timestamp || 0),
    rationale: p.rationale || ''
  };
}

function normalizeNote(n) {
  const teams = Array.isArray(n.teams)
    ? n.teams.map((t) => normalizeTeam(t)).filter((t) => t && t !== 'UNK')
    : [];
  const players = Array.isArray(n.players) ? n.players.filter(Boolean).map(String) : [];
  return {
    note_type: String(n.note_type || 'other').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    teams,
    players,
    topic: n.topic || '',
    summary: n.summary || '',
    speaker: n.speaker || '',
    source_timestamp: Number(n.source_timestamp || n.timestamp || 0),
    quote: n.quote || '',
    confidence: n.confidence || 'stated'
  };
}
// --- end copied section ---

function parseModelJson(text) {
  let t = String(text || '').trim();
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  try { return JSON.parse(t); } catch { /* fall through */ }
  const repaired = t.replace(/(:\s*)\+(\d+(?:\.\d+)?)/g, '$1$2');
  try { return JSON.parse(repaired); } catch { return null; }
}

for (const slug of TARGETS) {
  const file = path.join(OBS_DIR, `${slug}-shadow-youtube.json`);
  if (!fs.existsSync(file)) { console.log(`skip ${slug}: file not found`); continue; }
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const run = doc.run;
  const raw = parseModelJson(run.raw_model_response);
  if (!raw) { console.log(`⚠️  skip ${slug}: could not parse raw_model_response`); continue; }

  const newPicks = (raw.extracted_picks || []).map(normalizePick);
  const newNotes = (raw.analysis_notes || []).map(normalizeNote);
  const oldPicks = run.extracted_picks || [];

  let changed = 0;
  for (let i = 0; i < newPicks.length; i++) {
    if (oldPicks[i]?.side !== newPicks[i].side) {
      changed++;
      console.log(`  ${slug}: team=${newPicks[i].team} market=${newPicks[i].market} side "${oldPicks[i]?.side}" -> "${newPicks[i].side}"`);
    }
  }

  run.extracted_picks = newPicks;
  run.analysis_notes = newNotes;
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  console.log(`${slug}: picks_changed=${changed}/${newPicks.length}, notes=${newNotes.length}`);
}
