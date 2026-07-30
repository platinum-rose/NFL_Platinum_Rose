// agents/vault-seed.js
// ═══════════════════════════════════════════════════════════════════════════════
// Vault Seed Agent — Reference Data Ingestion
//
// Reads source files from data/vault-seed/{pff,ats,splits,dvoa,nflverse,manual}/
// and upserts structured Markdown notes into the vault_notes Supabase table.
//
// Supported formats:
//   CSV  — auto-detected schema (PFF grades, ATS records, splits, DVOA, nflverse)
//   JSON — array of objects with the same schemas as CSV
//   MD   — pass-through to NFL/Reference/<filename>
//
// Usage:
//   node agents/vault-seed.js [--dry-run] [--dir <subdir>] [--file <path>] [--team <ABBR>]
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync }      from 'node:fs';
import path                from 'node:path';
import { createHash }      from 'node:crypto';
import { fileURLToPath }   from 'node:url';

import { createClient }    from '@supabase/supabase-js';
import { ensureVaultFrontmatter } from './lib/vaultFrontmatter.js';
import 'dotenv/config';

const __filename   = fileURLToPath(import.meta.url);
const __dirname    = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const SEED_DIR     = path.join(ROOT, 'data', 'vault-seed');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DRY_RUN   = process.argv.includes('--dry-run');
const _dirIdx   = process.argv.indexOf('--dir');
const _fileIdx  = process.argv.indexOf('--file');
const _teamIdx  = process.argv.indexOf('--team');
const ONLY_DIR  = _dirIdx  !== -1 ? process.argv[_dirIdx  + 1] || null : null;
const ONLY_FILE = _fileIdx !== -1 ? process.argv[_fileIdx + 1] || null : null;
const ONLY_TEAM = _teamIdx !== -1 ? process.argv[_teamIdx + 1]?.toUpperCase() || null : null;

// ─── Team normalization (inline — avoids ESM/browser import complexity) ───────

const TEAM_ABBR_MAP = {
  'arizona cardinals': 'ARI', 'atlanta falcons': 'ATL', 'baltimore ravens': 'BAL',
  'buffalo bills': 'BUF', 'carolina panthers': 'CAR', 'chicago bears': 'CHI',
  'cincinnati bengals': 'CIN', 'cleveland browns': 'CLE', 'dallas cowboys': 'DAL',
  'denver broncos': 'DEN', 'detroit lions': 'DET', 'green bay packers': 'GB',
  'houston texans': 'HOU', 'indianapolis colts': 'IND', 'jacksonville jaguars': 'JAX',
  'kansas city chiefs': 'KC', 'las vegas raiders': 'LV', 'los angeles chargers': 'LAC',
  'los angeles rams': 'LAR', 'miami dolphins': 'MIA', 'minnesota vikings': 'MIN',
  'new england patriots': 'NE', 'new orleans saints': 'NO', 'new york giants': 'NYG',
  'new york jets': 'NYJ', 'philadelphia eagles': 'PHI', 'pittsburgh steelers': 'PIT',
  'san francisco 49ers': 'SF', 'seattle seahawks': 'SEA', 'tampa bay buccaneers': 'TB',
  'tennessee titans': 'TEN', 'washington commanders': 'WAS',
  // common short names
  'cardinals':'ARI','falcons':'ATL','ravens':'BAL','bills':'BUF','panthers':'CAR',
  'bears':'CHI','bengals':'CIN','browns':'CLE','cowboys':'DAL','broncos':'DEN',
  'lions':'DET','packers':'GB','texans':'HOU','colts':'IND','jaguars':'JAX',
  'chiefs':'KC','raiders':'LV','chargers':'LAC','rams':'LAR','dolphins':'MIA',
  'vikings':'MIN','patriots':'NE','saints':'NO','giants':'NYG','jets':'NYJ',
  'eagles':'PHI','steelers':'PIT','49ers':'SF','niners':'SF','seahawks':'SEA',
  'buccaneers':'TB','bucs':'TB','titans':'TEN','commanders':'WAS',
  // abbreviations
  'ari':'ARI','atl':'ATL','bal':'BAL','buf':'BUF','car':'CAR','chi':'CHI',
  'cin':'CIN','cle':'CLE','dal':'DAL','den':'DEN','det':'DET','gb':'GB',
  'hou':'HOU','ind':'IND','jax':'JAX','kc':'KC','lv':'LV','lac':'LAC',
  'lar':'LAR','la':'LAR','mia':'MIA','min':'MIN','ne':'NE','no':'NO',
  'nyg':'NYG','nyj':'NYJ','phi':'PHI','pit':'PIT','sf':'SF','sea':'SEA',
  'tb':'TB','ten':'TEN','was':'WAS',
};

const ALL_ABBRS = [...new Set(Object.values(TEAM_ABBR_MAP))];

function toAbbr(input) {
  if (!input) return null;
  const clean = String(input).toLowerCase().trim();
  return TEAM_ABBR_MAP[clean] || null;
}

// ─── CSV Parser (no external dep) ─────────────────────────────────────────────

function splitCSVLine(line) {
  const vals = [];
  let i = 0;
  while (i < line.length || vals.length === 0) {
    if (i >= line.length) { vals.push(''); break; }
    if (line[i] === '"') {
      let val = '';
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') { val += '"'; i += 2; }
          else { i++; break; }
        } else {
          val += line[i++];
        }
      }
      vals.push(val.trim());
      if (line[i] === ',') i++;
    } else {
      const end = line.indexOf(',', i);
      if (end === -1) { vals.push(line.slice(i).trim()); break; }
      vals.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  return vals;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const vals = splitCSVLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    });
  return { headers, rows };
}

// ─── Schema Detection ─────────────────────────────────────────────────────────

const SCHEMAS = {
  pff: {
    detect: (headers) => headers.some(h => h.includes('grade')) && headers.some(h => h.includes('team')),
    teamCol: (headers) => headers.find(h => h === 'team_name' || h === 'team' || h === 'franchise'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year'),
    label: 'PFF Grades',
    vaultPrefix: 'NFL/Reference/PFF',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'PFF',
    tags: ['pff', 'grades', 'reference'],
  },
  ats: {
    detect: (headers) => headers.some(h => h.includes('ats_wins') || h.includes('ats_pct') || (h.includes('ats') && h.includes('win'))),
    teamCol: (headers) => headers.find(h => h === 'team' || h === 'team_name'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year'),
    label: 'ATS Records',
    vaultPrefix: 'NFL/Reference/ATS',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'ATS',
    tags: ['ats', 'betting', 'reference'],
  },
  splits: {
    detect: (headers) => headers.some(h => h.includes('ticket_pct') || h.includes('money_pct') || h.includes('spread_pct')),
    teamCol: (headers) => headers.find(h => h === 'home_team' || h === 'team'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year' || h === 'game_date'),
    label: 'Betting Splits',
    vaultPrefix: 'NFL/Reference/Splits',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'Splits',
    tags: ['splits', 'betting', 'reference'],
  },
  dvoa: {
    detect: (headers) => headers.some(h => h === 'total_dvoa' || h === 'off_dvoa' || h.includes('dvoa')),
    teamCol: (headers) => headers.find(h => h === 'team' || h === 'team_name'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year'),
    label: 'DVOA',
    vaultPrefix: 'NFL/Reference/DVOA',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'DVOA',
    tags: ['dvoa', 'analytics', 'reference'],
  },
  nflverse: {
    // Matches PBP-style data (posteam/defteam/epa) and nfl_data_py player/team stats
    // (passing_epa, rushing_epa, recent_team + position).
    detect: (headers) =>
      headers.some(h => h === 'posteam' || h === 'defteam' || h === 'epa' || h.includes('epa_per')) ||
      headers.some(h => h === 'passing_epa' || h === 'rushing_epa' || h === 'receiving_epa') ||
      (headers.includes('recent_team') && headers.includes('position')),
    teamCol: (headers) => headers.find(h => h === 'posteam' || h === 'defteam' || h === 'recent_team' || h === 'team'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year'),
    label: 'nflverse',
    vaultPrefix: 'NFL/Reference/nflverse',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'EPA',
    tags: ['epa', 'nflverse', 'analytics', 'reference'],
  },
  // ── Schedules / game results (nfl_data_py import_schedules / import_games) ──
  // games.csv (completed only) and schedules.csv both match; dir-name hint
  // routes games.csv → 'games' and schedules.csv → 'schedules' schema.
  games: {
    detect: (headers) =>
      headers.includes('home_team') && headers.includes('away_team') && headers.includes('spread_line'),
    teamCol: (headers) => headers.find(h => h === 'home_team'),
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'Game Results',
    vaultPrefix: 'NFL/Reference/GameResults',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'Schedule',
    tags: ['schedule', 'games', 'nflverse', 'reference'],
  },
  schedules: {
    detect: (headers) =>
      headers.includes('home_team') && headers.includes('away_team') && headers.includes('spread_line'),
    teamCol: (headers) => headers.find(h => h === 'home_team'),
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'Schedule',
    vaultPrefix: 'NFL/Reference/Schedules',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'Schedule',
    tags: ['schedule', 'games', 'nflverse', 'reference'],
  },
  // ── FTN charting (nfl_data_py import_ftn_data) — play-level, no team col ──
  // 185K+ rows — writes a metadata summary note instead of a full table dump
  ftn: {
    detect: (headers) => headers.some(h => h === 'ftn_game_id' || h === 'n_pass_rushers' || h === 'n_blitzers'),
    teamCol: (_headers) => null,   // play-level data — no team column; league-wide note only
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'FTN Charting',
    vaultPrefix: 'NFL/Reference/FTN',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'FTN',
    tags: ['ftn', 'charting', 'analytics', 'nflverse', 'reference'],
    buildLeagueNote(rows, year, headers) {
      const seasons = [...new Set(rows.map(r => r.season).filter(Boolean))].sort();
      const weeks   = [...new Set(rows.map(r => r.week).filter(Boolean))].sort((a,b)=>+a-+b);
      const metrics = headers.filter(h => !['ftn_game_id','nflverse_game_id','season','week',
        'ftn_play_id','nflverse_play_id','date_pulled'].includes(h));
      const _passPlays  = rows.filter(r => r.is_screen_pass === '0' || r.n_pass_rushers).length;
      const blitzPlays = rows.filter(r => +r.n_blitzers > 0).length;
      const motionPlays = rows.filter(r => r.is_motion === '1' || r.is_motion === 'True').length;
      return `# FTN Charting — ${seasons[0]}–${seasons[seasons.length-1]}

_Source: nfl_data_py import_ftn_data | Updated: ${now()}_

## Coverage
- **Seasons:** ${seasons.join(', ')}
- **Weeks:** ${weeks[0]}–${weeks[weeks.length-1]}
- **Total plays charted:** ${rows.length.toLocaleString()}
- **Blitz plays:** ${blitzPlays.toLocaleString()} (${(blitzPlays/rows.length*100).toFixed(1)}%)
- **Motion plays:** ${motionPlays.toLocaleString()} (${(motionPlays/rows.length*100).toFixed(1)}%)

## Columns (${headers.length} total)
${metrics.map(h => `- \`${h}\``).join('\n')}

## Usage
Join on \`nflverse_game_id\` + \`nflverse_play_id\` with PBP data for team/player context.
Raw CSV at \`data/vault-seed/nflverse/ftn_charting.csv\`.

_Auto-generated from vault-seed ingestion. Play-level data — no per-team notes written._
`;
    },
  },

  // -- Player Stats Weekly (nflverse stats_player release)
  player_stats_weekly: {
    detect: (headers) =>
      headers.some(h => h === 'passing_epa' || h === 'rushing_epa') &&
      headers.includes('week') && headers.includes('position') &&
      !headers.includes('recent_team'),
    teamCol: (headers) => headers.find(h => h === 'team' || h === 'recent_team'),
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'Player Stats Weekly',
    vaultPrefix: 'NFL/Reference/PlayerStatsWeekly',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'PlayerStats',
    tags: ['player-stats', 'weekly', 'nflverse', 'epa', 'reference'],
    buildLeagueNote(rows, _year, _headers) {
      const seasons = [...new Set(rows.map(r => r.season).filter(Boolean))].sort();
      const latest  = seasons[seasons.length - 1];
      const reg     = rows.filter(r => String(r.season) === String(latest) && r.season_type === 'REG');
      function agg(subset, valKey) {
        const map = {};
        for (const r of subset) {
          const k = r.player_display_name || r.player_name;
          if (!map[k]) map[k] = { name: k, team: r.team || r.recent_team, val: 0 };
          map[k].val += +r[valKey] || 0;
        }
        return Object.values(map).sort((a, b) => b.val - a.val);
      }
      const fmtRow = ({ name, team, val }) => `| ${name} | ${team} | ${Math.round(val)} |`;
      const hdr    = '| Player | Team | Yds |\n|---|---|---|';
      return [
        `# Player Stats Weekly -- ${seasons[0]}-${latest}`,
        `\n_Source: nflverse stats_player release | Updated: ${now()}_`,
        `\n## Coverage`,
        `- **Seasons:** ${seasons.join(', ')}`,
        `- **Total rows:** ${rows.length.toLocaleString()}`,
        `\n## ${latest} Leaders (REG)`,
        `\n### Passing Yards`, hdr,
        ...agg(reg.filter(r => r.position === 'QB'), 'passing_yards').slice(0, 10).map(fmtRow),
        `\n### Rushing Yards`, hdr,
        ...agg(reg.filter(r => r.position === 'RB'), 'rushing_yards').slice(0, 10).map(fmtRow),
        `\n### Receiving Yards -- WR`, hdr,
        ...agg(reg.filter(r => r.position === 'WR'), 'receiving_yards').slice(0, 10).map(fmtRow),
        `\n### Receiving Yards -- TE`, hdr,
        ...agg(reg.filter(r => r.position === 'TE'), 'receiving_yards').slice(0, 8).map(fmtRow),
        `\n_Raw CSV: data/vault-seed/nflverse/player_stats_weekly.csv | Auto-generated._`,
      ].join('\n');
    },
    buildTeamNote(teamRows, _abbr, _year, _headers) {
      const seasons = [...new Set(teamRows.map(r => r.season).filter(Boolean))].sort();
      const sections = seasons.map(szn => {
        const reg = teamRows.filter(r => String(r.season) === String(szn) && r.season_type === 'REG');
        if (!reg.length) return null;
        function topPlayer(pos, key) {
          const map = {};
          for (const r of reg.filter(r => r.position === pos)) {
            const k = r.player_display_name || r.player_name;
            if (!map[k]) map[k] = { name: k, val: 0 };
            map[k].val += +r[key] || 0;
          }
          const top = Object.values(map).sort((a, b) => b.val - a.val)[0];
          return top ? `${top.name} (${Math.round(top.val)})` : '--';
        }
        return [`### ${szn}`, `- **QB:** ${topPlayer('QB', 'passing_yards')}`,
          `- **RB:** ${topPlayer('RB', 'rushing_yards')}`,
          `- **WR:** ${topPlayer('WR', 'receiving_yards')}`,
          `- **TE:** ${topPlayer('TE', 'receiving_yards')}`].join('\n');
      }).filter(Boolean);
      return `## Player Stats Weekly\n\n_Updated: ${now()}_\n\n${sections.join('\n\n')}\n`;
    },
  },
  // -- Player Stats Seasonal (nflverse stats_player release)
  player_stats_seasonal: {
    detect: (headers) =>
      headers.includes('recent_team') && headers.includes('games') &&
      headers.some(h => h === 'passing_epa' || h === 'rushing_epa'),
    teamCol: (headers) => headers.find(h => h === 'recent_team' || h === 'team'),
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'Player Stats Seasonal',
    vaultPrefix: 'NFL/Reference/PlayerStatsSeasonal',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'PlayerStatsSeason',
    tags: ['player-stats', 'seasonal', 'nflverse', 'epa', 'reference'],
    buildLeagueNote(rows, _year, _headers) {
      const seasons = [...new Set(rows.map(r => r.season).filter(Boolean))].sort();
      const latest  = seasons[seasons.length - 1];
      const reg     = rows.filter(r => String(r.season) === String(latest) && r.season_type === 'REG');
      function topN(pos, key, n) {
        return reg.filter(r => r.position === pos)
          .sort((a, b) => (+b[key] || 0) - (+a[key] || 0)).slice(0, n)
          .map(r => `| ${r.player_display_name || r.player_name} | ${r.recent_team || r.team} | ${Math.round(+r[key] || 0)} |`);
      }
      const hdr = '| Player | Team | Yds |\n|---|---|---|';
      return [
        `# Player Stats Seasonal -- ${seasons[0]}-${latest}`,
        `\n_Source: nflverse stats_player release | Updated: ${now()}_`,
        `\n## Coverage`, `- **Seasons:** ${seasons.join(', ')}`,
        `- **Player-seasons:** ${rows.length.toLocaleString()}`,
        `\n## ${latest} Leaders (REG)`,
        `\n### Passing Yards`, hdr, ...topN('QB', 'passing_yards', 10),
        `\n### Rushing Yards`, hdr, ...topN('RB', 'rushing_yards', 10),
        `\n### Receiving Yards -- WR`, hdr, ...topN('WR', 'receiving_yards', 10),
        `\n### Receiving Yards -- TE`, hdr, ...topN('TE', 'receiving_yards', 8),
        `\n_Raw CSV: data/vault-seed/nflverse/player_stats_seasonal.csv | Auto-generated._`,
      ].join('\n');
    },
    buildTeamNote(teamRows, _abbr, _year, _headers) {
      const seasons = [...new Set(teamRows.map(r => r.season).filter(Boolean))].sort();
      const sections = seasons.map(szn => {
        const reg = teamRows.filter(r => String(r.season) === String(szn) && r.season_type === 'REG');
        if (!reg.length) return null;
        function top(pos, key) {
          const p = reg.filter(r => r.position === pos).sort((a, b) => (+b[key] || 0) - (+a[key] || 0))[0];
          return p ? `${p.player_display_name || p.player_name} (${Math.round(+p[key] || 0)})` : '--';
        }
        return [`### ${szn}`, `- **QB:** ${top('QB', 'passing_yards')}`,
          `- **RB:** ${top('RB', 'rushing_yards')}`, `- **WR:** ${top('WR', 'receiving_yards')}`,
          `- **TE:** ${top('TE', 'receiving_yards')}`].join('\n');
      }).filter(Boolean);
      return `## Player Stats Seasonal\n\n_Updated: ${now()}_\n\n${sections.join('\n\n')}\n`;
    },
  },
  // -- Team Stats Weekly (nflverse stats_team release)
  team_stats: {
    detect: (headers) =>
      headers.includes('team') && headers.includes('week') &&
      headers.some(h => h === 'passing_epa') && !headers.includes('player_id'),
    teamCol: (headers) => headers.find(h => h === 'team'),
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'Team Stats',
    vaultPrefix: 'NFL/Reference/TeamStats',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'TeamStats',
    tags: ['team-stats', 'weekly', 'nflverse', 'epa', 'reference'],
    buildLeagueNote(rows, _year, _headers) {
      const seasons = [...new Set(rows.map(r => r.season).filter(Boolean))].sort();
      const latest  = seasons[seasons.length - 1];
      const reg     = rows.filter(r => String(r.season) === String(latest) && r.season_type === 'REG');
      const byTeam  = {};
      for (const r of reg) {
        if (!byTeam[r.team]) byTeam[r.team] = { team: r.team, pepa: 0, repa: 0, pyds: 0, ryds: 0 };
        byTeam[r.team].pepa += +r.passing_epa   || 0;
        byTeam[r.team].repa += +r.rushing_epa   || 0;
        byTeam[r.team].pyds += +r.passing_yards || 0;
        byTeam[r.team].ryds += +r.rushing_yards || 0;
      }
      const tbl = ['| Team | Pass EPA | Rush EPA | Pass Yds | Rush Yds |', '|---|---|---|---|---|',
        ...Object.values(byTeam).sort((a, b) => b.pepa - a.pepa)
          .map(t => `| ${t.team} | ${t.pepa.toFixed(1)} | ${t.repa.toFixed(1)} | ${Math.round(t.pyds)} | ${Math.round(t.ryds)} |`)
      ].join('\n');
      return [`# Team Stats -- ${seasons[0]}-${latest}`,
        `\n_Source: nflverse stats_team release | Updated: ${now()}_`,
        `\n## Coverage`, `- **Seasons:** ${seasons.join(', ')}`,
        `- **Total rows:** ${rows.length.toLocaleString()} team-weeks`,
        `\n## ${latest} Season Totals (REG, by passing EPA)`, tbl,
        `\n_Raw CSV: data/vault-seed/nflverse/team_stats.csv | Auto-generated._`].join('\n');
    },
    buildTeamNote(teamRows, _abbr, _year, _headers) {
      const seasons = [...new Set(teamRows.map(r => r.season).filter(Boolean))].sort();
      const lines = seasons.map(szn => {
        const reg = teamRows.filter(r => String(r.season) === String(szn) && r.season_type === 'REG');
        if (!reg.length) return null;
        const sum = key => reg.reduce((s, r) => s + (+r[key] || 0), 0);
        return [`### ${szn} (${reg.length} weeks)`,
          `- **Passing EPA:** ${sum('passing_epa').toFixed(1)}`,
          `- **Rushing EPA:** ${sum('rushing_epa').toFixed(1)}`,
          `- **Passing Yds:** ${Math.round(sum('passing_yards'))}`,
          `- **Rushing Yds:** ${Math.round(sum('rushing_yards'))}`,
          `- **Pass TDs:** ${Math.round(sum('passing_tds'))}`,
          `- **Rush TDs:** ${Math.round(sum('rushing_tds'))}`].join('\n');
      }).filter(Boolean);
      return `## Team Stats\n\n_Updated: ${now()}_\n\n${lines.join('\n\n')}\n`;
    },
  },
  // ── ESPN QBR / team efficiency (nfl_data_py import_espn_data) ────────────
  espn: {
    detect: (headers) => headers.some(h => h === 'qbr_total' || h === 'qb_team' || h === 'qbr_raw'),
    teamCol: (headers) => headers.find(h => h === 'qb_team' || h === 'team'),
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'ESPN QBR',
    vaultPrefix: 'NFL/Reference/ESPN',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'QBR',
    tags: ['espn', 'qbr', 'analytics', 'nflverse', 'reference'],
  },

  // ── Spreadspoke — game-level historical scores + spreads (1966–present) ──
  // spreadspoke.com / Kaggle: tobycrabtree/nfl-scores-and-betting-data
  // Drop spreadspoke_scores.csv (or nfl_2025.csv free sample) into data/vault-seed/ats/
  //
  // Key columns: schedule_season, schedule_week, team_home, team_away, score_home,
  //   score_away, team_favorite_id, spread_favorite (home-team perspective: negative=home favored),
  //   over_under_line, weather_temperature, weather_wind_mph, weather_detail
  //
  // spread_favorite convention: signed from the HOME team's perspective.
  //   -7.0 = home lays 7 (home favored)   +3.5 = away lays 3.5 (away favored)
  // Home covers if: (score_home - score_away) > spread_favorite
  spreadspoke: {
    detect: (headers) =>
      headers.includes('schedule_season') &&
      headers.includes('team_home') &&
      headers.includes('team_away') &&
      (headers.includes('spread_favorite') || headers.includes('score_home')),
    // After aggregateToTeamRows(), each row has 'team' and 'season'
    teamCol: () => 'team',
    yearCol: () => 'season',
    label: 'ATS Records (Spreadspoke)',
    vaultPrefix: 'NFL/Reference/ATS',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'ATS',
    tags: ['ats', 'betting', 'spreadspoke', 'historical', 'reference'],

    // ── Game-level → per-team per-season aggregation ──────────────────────
    aggregateToTeamRows(rows) {
      const map = new Map();

      function init(season, team) {
        const key = `${season}|${team}`;
        if (!map.has(key)) {
          map.set(key, {
            team, season: +season, games: 0,
            ats_w: 0, ats_l: 0, ats_p: 0,
            home_ats_w: 0, home_ats_l: 0, home_ats_p: 0,
            away_ats_w: 0, away_ats_l: 0, away_ats_p: 0,
            fav_w: 0, fav_l: 0, dog_w: 0, dog_l: 0,
            over: 0, under: 0, ou_push: 0,
            margin_sum: 0, total_sum: 0,
            cold_games: 0, cold_under: 0,
            wind_games: 0, wind_under: 0,
          });
        }
        return map.get(key);
      }

      for (const row of rows) {
        const season  = row.schedule_season;
        const homeAbbr = toAbbr(row.team_home);
        const awayAbbr = toAbbr(row.team_away);
        if (!season || !homeAbbr || !awayAbbr) continue;

        const sH = parseFloat(row.score_home);
        const sA = parseFloat(row.score_away);
        if (isNaN(sH) || isNaN(sA)) continue; // game not yet played

        const margin   = sH - sA;
        const total    = sH + sA;
        const spread   = parseFloat(row.spread_favorite);   // home-team perspective
        const ou       = parseFloat(row.over_under_line);
        const temp     = parseFloat(row.weather_temperature);
        const wind     = parseFloat(row.weather_wind_mph);
        const wx       = (row.weather_detail || '').toLowerCase();
        const isDome   = wx.includes('dome') || wx.includes('indoor');
        const isCold   = !isDome && !isNaN(temp) && temp < 40;
        const isWindy  = !isDome && !isNaN(wind) && wind > 20;
        const favAbbr  = toAbbr(row.team_favorite_id);

        // O/U result
        const ouResult = (!isNaN(ou) && ou > 0)
          ? (total > ou ? 'over' : total < ou ? 'under' : 'push')
          : null;

        // ATS result — home-team perspective
        // spread_favorite is the HOME team's spread (negative = home favored)
        // Home covers if margin > spread_favorite
        const homeAts = !isNaN(spread)
          ? (margin > spread ? 'W' : margin < spread ? 'L' : 'P')
          : null;
        const awayAts = homeAts === 'W' ? 'L' : homeAts === 'L' ? 'W' : homeAts;

        const homeIsFav = favAbbr === homeAbbr;
        const awayIsFav = favAbbr === awayAbbr;

        // ── Home team stats ──
        const h = init(season, homeAbbr);
        h.games++;
        h.margin_sum += margin;
        h.total_sum  += total;
        if (homeAts === 'W') { h.ats_w++; h.home_ats_w++; }
        else if (homeAts === 'L') { h.ats_l++; h.home_ats_l++; }
        else if (homeAts === 'P') { h.ats_p++; h.home_ats_p++; }
        if (homeIsFav) { if (homeAts === 'W') h.fav_w++; else if (homeAts === 'L') h.fav_l++; }
        else if (awayIsFav) { if (homeAts === 'W') h.dog_w++; else if (homeAts === 'L') h.dog_l++; }
        if (ouResult === 'over') h.over++;
        else if (ouResult === 'under') h.under++;
        else if (ouResult === 'push') h.ou_push++;
        if (isCold) { h.cold_games++; if (ouResult === 'under') h.cold_under++; }
        if (isWindy) { h.wind_games++; if (ouResult === 'under') h.wind_under++; }

        // ── Away team stats ──
        const a = init(season, awayAbbr);
        a.games++;
        a.margin_sum += -margin; // from away team's perspective
        a.total_sum  += total;
        if (awayAts === 'W') { a.ats_w++; a.away_ats_w++; }
        else if (awayAts === 'L') { a.ats_l++; a.away_ats_l++; }
        else if (awayAts === 'P') { a.ats_p++; a.away_ats_p++; }
        if (awayIsFav) { if (awayAts === 'W') a.fav_w++; else if (awayAts === 'L') a.fav_l++; }
        else if (homeIsFav) { if (awayAts === 'W') a.dog_w++; else if (awayAts === 'L') a.dog_l++; }
        if (ouResult === 'over') a.over++;
        else if (ouResult === 'under') a.under++;
        else if (ouResult === 'push') a.ou_push++;
        if (isCold) { a.cold_games++; if (ouResult === 'under') a.cold_under++; }
        if (isWindy) { a.wind_games++; if (ouResult === 'under') a.wind_under++; }
      }

      const pct = (w, l) => (w + l > 0 ? ((w / (w + l)) * 100).toFixed(1) : '—');
      const rec = (w, l, p) => `${w}-${l}-${p}`;

      return [...map.values()].map(s => ({
        team:            s.team,
        season:          s.season,
        games:           s.games,
        ats_wins:        s.ats_w,
        ats_losses:      s.ats_l,
        ats_pushes:      s.ats_p,
        ats_pct:         pct(s.ats_w, s.ats_l),
        home_ats_record: rec(s.home_ats_w, s.home_ats_l, s.home_ats_p),
        away_ats_record: rec(s.away_ats_w, s.away_ats_l, s.away_ats_p),
        fav_ats_record:  s.fav_w + s.fav_l > 0 ? `${s.fav_w}-${s.fav_l}` : '—',
        dog_ats_record:  s.dog_w + s.dog_l > 0 ? `${s.dog_w}-${s.dog_l}` : '—',
        over_count:      s.over,
        under_count:     s.under,
        avg_margin:      s.games > 0 ? (s.margin_sum / s.games).toFixed(1) : '—',
        avg_total:       s.games > 0 ? (s.total_sum  / s.games).toFixed(1) : '—',
        cold_under_pct:  s.cold_games > 0 ? ((s.cold_under / s.cold_games) * 100).toFixed(0) + '%' : '—',
        wind_under_pct:  s.wind_games > 0 ? ((s.wind_under / s.wind_games) * 100).toFixed(0) + '%' : '—',
      }));
    },

    buildLeagueNote(rows, _year, _headers) {
      const byYear = new Map();
      for (const r of rows) {
        if (!byYear.has(r.season)) byYear.set(r.season, []);
        byYear.get(r.season).push(r);
      }
      const seasons = [...byYear.keys()].sort((a, b) => b - a);
      const latestYear = seasons[0];
      const latest = [...(byYear.get(latestYear) || [])].sort((a, b) => +b.ats_wins - +a.ats_wins);

      const tbl = [
        '| Team | ATS | ATS% | Home ATS | Away ATS | O | U | Avg Margin | Avg Total |',
        '|---|---|---|---|---|---|---|---|---|',
        ...latest.map(r =>
          `| ${r.team} | ${r.ats_wins}-${r.ats_losses}-${r.ats_pushes} | ${r.ats_pct}% | ${r.home_ats_record} | ${r.away_ats_record} | ${r.over_count} | ${r.under_count} | ${r.avg_margin} | ${r.avg_total} |`
        ),
      ].join('\n');

      const seasonRange = seasons.length > 1
        ? `${seasons[seasons.length - 1]}–${latestYear}`
        : String(latestYear);

      return `# ATS Records (Spreadspoke) — ${latestYear} Season

_Source: spreadspoke.com | Seasons in file: ${seasonRange} | Updated: ${now()}_

> **Spread convention:** \`spread_favorite\` is signed from the home team's perspective.
> ATS% excludes pushes. Cold weather = outdoor games below 40°F. Wind = >20 mph outdoor.

${tbl}

_${latest.length} teams. Auto-generated from vault-seed Spreadspoke CSV._
`;
    },

    buildTeamNote(teamRows, _abbr, _year, _headers) {
      const seasons = [...teamRows].sort((a, b) => +b.season - +a.season);
      const sections = seasons.map(r => [
        `### ${r.season} (${r.games} games)`,
        `- **ATS:** ${r.ats_wins}-${r.ats_losses}-${r.ats_pushes} (${r.ats_pct}%)`,
        `- **Home / Away ATS:** ${r.home_ats_record} / ${r.away_ats_record}`,
        `- **As Favorite:** ${r.fav_ats_record} | **As Underdog:** ${r.dog_ats_record}`,
        `- **O/U:** ${r.over_count} Over / ${r.under_count} Under`,
        `- **Avg Margin:** ${r.avg_margin} pts | **Avg Total:** ${r.avg_total} pts`,
        r.cold_under_pct !== '—' ? `- **Cold Weather Under%:** ${r.cold_under_pct}` : null,
        r.wind_under_pct !== '—' ? `- **Wind Game Under%:** ${r.wind_under_pct}` : null,
      ].filter(Boolean).join('\n'));
      return `## ATS Records (Spreadspoke)\n\n_Updated: ${now()}_\n\n${sections.join('\n\n')}\n`;
    },
  },
};

function detectSchema(headers, dirName, fileName = null) {
  // Filename hint takes highest priority (disambiguates files with identical headers)
  if (fileName && SCHEMAS[fileName]) {
    const s = SCHEMAS[fileName];
    if (s.detect(headers)) return { name: fileName, ...s };
  }
  // Dir-name hint
  if (dirName && SCHEMAS[dirName]) {
    const s = SCHEMAS[dirName];
    if (s.detect(headers)) return { name: dirName, ...s };
  }
  // Auto-detect
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    if (schema.detect(headers)) return { name, ...schema };
  }
  return null;
}

// ─── Note Formatters ──────────────────────────────────────────────────────────

function now() { return new Date().toISOString().slice(0, 10); }
function _sha8(v) { return createHash('sha256').update(String(v)).digest('hex').slice(0, 8); }
function fmtNum(v) { return (v == null || v === '') ? '—' : (isNaN(+v) ? v : (+v).toFixed(2)); }

/** Build a Markdown table from an array of objects */
function mdTable(rows, cols) {
  if (!rows.length) return '_No data_';
  const header = `| ${cols.join(' | ')} |`;
  const sep    = `| ${cols.map(() => '---').join(' | ')} |`;
  const body   = rows.map(r => `| ${cols.map(c => r[c] ?? '—').join(' | ')} |`).join('\n');
  return `${header}\n${sep}\n${body}`;
}

/** Format a generic CSV schema into a league-wide reference note */
function buildLeagueNote(schema, rows, year, headers) {
  // If schema provides a custom note builder, use it (e.g. play-level data too large for table)
  if (typeof schema.buildLeagueNote === 'function') {
    return schema.buildLeagueNote(rows, year, headers);
  }

  const teamCol = schema.teamCol(headers);
  const metricCols = headers.filter(h => h !== teamCol && h !== schema.yearCol(headers));
  const displayCols = [teamCol, ...metricCols].slice(0, 10); // cap columns

  // Respect maxRows to prevent oversized tsvector content
  const displayRows = schema.maxRows ? rows.slice(0, schema.maxRows) : rows;
  const tableRows = displayRows.map(r => {
    const abbr = toAbbr(r[teamCol]) || r[teamCol];
    return { ...r, [teamCol]: abbr };
  });

  return `# ${schema.label} — ${year} Season

_Source: vault-seed ingestion | Updated: ${now()}_

${mdTable(tableRows, displayCols)}

_${rows.length} teams. Auto-generated from vault-seed CSV._
`;
}

/** Format per-team section for a given team's rows */
function buildTeamNote(schema, teamRows, abbr, year, headers) {
  const teamCol  = schema.teamCol(headers);
  const yearCol  = schema.yearCol(headers);
  const metricCols = headers.filter(h => h !== teamCol && h !== yearCol);

  const metrics = metricCols.map(col => {
    const val = teamRows[0]?.[col] ?? '—';
    return `- **${col.replace(/_/g, ' ')}:** ${fmtNum(val)}`;
  }).join('\n');

  return `## ${schema.label} — ${year}

_Updated: ${now()}_

${metrics}
`;
}

/** Build or extend a per-team vault note with a new section */
function mergeTeamSection(existingContent, newSection, sectionHeader) {
  if (!existingContent) return `# Team Reference Note\n\n${newSection}`;
  // Replace existing section if present
  const re = new RegExp(`## ${sectionHeader}[\\s\\S]*?(?=\\n## |$)`, '');
  if (re.test(existingContent)) {
    return existingContent.replace(re, newSection);
  }
  return existingContent.trim() + '\n\n' + newSection;
}

// ─── Supabase Upsert ──────────────────────────────────────────────────────────

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

async function upsertNote(supabase, { path: vaultPath, content, tags, source = 'agent' }, results) {
  const entry = { path: vaultPath, status: null };
  const noteContent = ensureVaultFrontmatter(content, {
    title: vaultPath.replace(/^NFL\//, '').replace(/\.md$/i, '').replace(/\//g, ' - '),
    sourceSystem: 'vault-seed',
    sourceType: 'reference-seed',
    tags,
  });
  if (DRY_RUN) {
    entry.status = 'dry-run';
    console.log(`  [DRY-RUN] ${vaultPath} (${noteContent.length} chars)`);
    results.push(entry);
    return;
  }
  const { error } = await supabase.from('vault_notes')
    .upsert({ path: vaultPath, content: noteContent, tags, source }, { onConflict: 'path' });
  if (error) {
    entry.status = 'error';
    entry.error  = error.message;
    console.error(`  [FAIL] ${vaultPath}: ${error.message}`);
  } else {
    entry.status = 'ok';
    console.log(`  [OK]   ${vaultPath}`);
  }
  results.push(entry);
}

// ─── File Processors ──────────────────────────────────────────────────────────

async function processCSV(supabase, filePath, dirName, results) {
  const text = await readFile(filePath, 'utf-8');
  const { headers, rows } = parseCSV(text);
  if (!headers.length || !rows.length) {
    console.warn(`  [SKIP] ${filePath}: empty or unparseable`);
    return;
  }

  const schema = detectSchema(headers, dirName, path.basename(filePath, path.extname(filePath)));
  if (!schema) {
    console.warn(`  [SKIP] ${filePath}: unknown schema (headers: ${headers.slice(0,6).join(', ')})`);
    return;
  }

  // ── Game-level aggregation hook (e.g., Spreadspoke) ──────────────────────
  // If the schema provides aggregateToTeamRows(), transform raw game rows into
  // per-team per-season summary rows before all further processing.
  let finalRows    = rows;
  let finalHeaders = headers;
  if (typeof schema.aggregateToTeamRows === 'function') {
    finalRows = schema.aggregateToTeamRows(rows);
    finalHeaders = finalRows.length ? Object.keys(finalRows[0]) : headers;
    console.log(`  Aggregated ${rows.length} game rows → ${finalRows.length} team-season rows`);
    if (!finalRows.length) { console.warn(`  [SKIP] aggregation produced no rows`); return; }
  }

  const teamCol = schema.teamCol(finalHeaders);
  const yearCol = schema.yearCol(finalHeaders);

  // Determine year: from data or filename
  const yearFromData = finalRows[0]?.[yearCol];
  const yearFromFile = filePath.match(/20(\d{2})/)?.[0];
  const year = yearFromData || yearFromFile || new Date().getFullYear() - 1;

  console.log(`  Schema: ${schema.label} | year: ${year} | rows: ${finalRows.length}`);

  // ── League-wide reference note ──
  const leaguePath = `${schema.vaultPrefix}-${year}.md`;
  if (!ONLY_TEAM) {
    const leagueContent = buildLeagueNote(schema, finalRows, year, finalHeaders);
    await upsertNote(supabase, {
      path: leaguePath,
      content: leagueContent,
      tags: [...schema.tags, `season-${year}`],
    }, results);
  }

  // ── Per-team notes ──
  if (!teamCol) return;

  // Group rows by team
  const byTeam = new Map();
  for (const row of finalRows) {
    const abbr = toAbbr(row[teamCol]);
    if (!abbr) continue;
    if (ONLY_TEAM && abbr !== ONLY_TEAM) continue;
    if (!byTeam.has(abbr)) byTeam.set(abbr, []);
    byTeam.get(abbr).push(row);
  }

  for (const [abbr, teamRows] of byTeam) {
    const teamPath      = `${schema.teamVaultPrefix}/${abbr}-${schema.teamSuffix}.md`;
    const sectionHeader = `${schema.label} — ${year}`;
    const newSection    = typeof schema.buildTeamNote === 'function'
      ? schema.buildTeamNote(teamRows, abbr, year, finalHeaders)
      : buildTeamNote(schema, teamRows, abbr, year, finalHeaders);

    // Read existing note and merge
    let existingContent = null;
    if (!DRY_RUN) {
      const { data } = await supabase.from('vault_notes').select('content').eq('path', teamPath).maybeSingle();
      existingContent = data?.content ?? null;
    }
    const merged = mergeTeamSection(existingContent, newSection, sectionHeader);
    await upsertNote(supabase, {
      path: teamPath,
      content: merged,
      tags: [...schema.tags, `team-${abbr.toLowerCase()}`, `season-${year}`],
    }, results);
  }
}

async function processJSON(supabase, filePath, dirName, results) {
  const text = await readFile(filePath, 'utf-8');
  let data;
  try { data = JSON.parse(text); } catch {
    console.warn(`  [SKIP] ${filePath}: invalid JSON`);
    return;
  }
  const rows = Array.isArray(data)
    ? data
    : data.data ?? data.rows ?? data.teams ?? data.players ?? data.games ?? [];
  if (!rows.length) { console.warn(`  [SKIP] ${filePath}: no rows`); return; }

  // Convert to CSV-like and reuse CSV processor
  const headers = Object.keys(rows[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const normalised = rows.map(r => Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '_'), v])
  ));

  const schema = detectSchema(headers, dirName);
  if (!schema) {
    console.warn(`  [SKIP] ${filePath}: unknown schema`);
    return;
  }

  // Minimal: write a league-wide note
  const yearCol = schema.yearCol(headers);
  const year = normalised[0]?.[yearCol] || filePath.match(/20(\d{2})/)?.[0] || new Date().getFullYear() - 1;
  const leaguePath = `${schema.vaultPrefix}-${year}.md`;
  const leagueContent = buildLeagueNote(schema, normalised, year, headers);
  if (!ONLY_TEAM) {
    await upsertNote(supabase, {
      path: leaguePath,
      content: leagueContent,
      tags: [...schema.tags, `season-${year}`],
    }, results);
  }
}

async function processMarkdown(supabase, filePath, results) {
  const content  = await readFile(filePath, 'utf-8');
  const basename = path.basename(filePath, '.md');
  const vaultPath = `NFL/Reference/${basename}.md`;
  await upsertNote(supabase, {
    path: vaultPath,
    content,
    tags: ['manual', 'reference'],
    source: 'manual',
  }, results);
}

// ─── Directory Walker ─────────────────────────────────────────────────────────

async function processDir(supabase, dirPath, dirName, results) {
  if (!existsSync(dirPath)) return;
  const entries = await readdir(dirPath);
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'README.md') continue;
    const full = path.join(dirPath, entry);
    const ext  = path.extname(entry).toLowerCase();
    console.log(`\nProcessing: ${entry}`);
    if (ext === '.csv')        await processCSV(supabase, full, dirName, results);
    else if (ext === '.json')  await processJSON(supabase, full, dirName, results);
    else if (ext === '.md')    await processMarkdown(supabase, full, results);
    else console.warn(`  [SKIP] unsupported file type: ${ext}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏈 vault-seed.js | dry-run=${DRY_RUN} | dir=${ONLY_DIR || 'all'} | team=${ONLY_TEAM || 'all'}\n`);

  const supabase = DRY_RUN ? null : getSupabase();
  const results  = [];
  const started  = Date.now();

  if (ONLY_FILE) {
    // Single-file mode
    const dirName = path.basename(path.dirname(ONLY_FILE));
    const ext = path.extname(ONLY_FILE).toLowerCase();
    console.log(`\nProcessing: ${ONLY_FILE}`);
    if (ext === '.csv')       await processCSV(supabase, ONLY_FILE, dirName, results);
    else if (ext === '.json') await processJSON(supabase, ONLY_FILE, dirName, results);
    else if (ext === '.md')   await processMarkdown(supabase, ONLY_FILE, results);
    else console.warn(`Unsupported file type: ${ext}`);
  } else {
    const subDirs = ONLY_DIR ? [ONLY_DIR] : Object.keys(SCHEMAS).concat(['manual']);
    for (const dir of subDirs) {
      const dirPath = path.join(SEED_DIR, dir);
      console.log(`\n── ${dir}/ ─────────────────────`);
      await processDir(supabase, dirPath, dir, results);
    }
  }

  // ── Receipt ──
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const receipt = {
    run_at:   new Date().toISOString(),
    dry_run:  DRY_RUN,
    duration_ms: Date.now() - started,
    total:    results.length,
    ok:       results.filter(r => r.status === 'ok').length,
    skipped:  results.filter(r => r.status === 'dry-run').length,
    errors:   results.filter(r => r.status === 'error').length,
    notes:    results,
  };

  const receiptPath = path.join(RECEIPTS_DIR, `vault-seed-${Date.now()}.json`);
  if (!DRY_RUN) {
    await writeFile(receiptPath, JSON.stringify(receipt, null, 2));
    console.log(`\nReceipt: ${receiptPath}`);
  }

  console.log(`\n✅ Done — ${receipt.ok} written | ${receipt.errors} errors | ${receipt.skipped} dry-run | ${receipt.duration_ms}ms`);
  if (receipt.errors > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
