/**
 * generate-live-tracker.mjs
 *
 * Multi-Game Sunday Live Tracker Generator.
 *
 * Compiles a standalone, high-performance live tracking dashboard (HTML + CSS + vanilla JS)
 * from user-placed-wagers-2026.json and public/schedule.json.
 *
 * Incorporates all proven v4 features:
 *  - 3-wide responsive desktop card grid with drag-and-drop reordering.
 *  - Standalone DraftKings predictions contracts with $0 cash risk promo badging.
 *  - Real-time Alejandro Castro 50/50 Split Ledger & history settlement drawer.
 *  - Player Cheat Sheet with stat progress bars, auto-collapse, and "Hide Fulfilled" filter.
 *  - Dual-endpoint ESPN streaming feed (scoreboard & boxscore) with cdn fallback.
 *
 * Usage:
 *  node scripts/generate-live-tracker.mjs [--week <num>] [--out <path>]
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getNFLWeekInfo } from '../src/lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const WAGERS_PATH = path.join(ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json');
// Paper (imaginary-money) tickets, e.g. the Platinum Rose AI benchmark card. Shown on the board
// for comparison only: excluded from every cash/payout total and never synced to the bankroll.
const PAPER_WAGERS_PATH = path.join(ROOT, 'data', 'official-picks', 'paper-wagers-2026.json');
const FUTURES_LEDGER_PATH = path.join(ROOT, 'data', 'futures-imports', 'andy-portfolio-ledger-2026.json');
const FUTURES_IMPORTS_DIR = path.join(ROOT, 'data', 'futures-imports');
const PRICE_WATCH_LIST_PATH = path.join(FUTURES_IMPORTS_DIR, 'price-watch-list-2026.json');
const SCHEDULE_PATH = path.join(ROOT, 'public', 'schedule.json');
const DEFAULT_OUT_PUBLIC = path.join(ROOT, 'public', 'live-tracker-sunday.html');
const DEFAULT_OUT_DOCS = path.join(ROOT, 'docs', 'tracked-wagers', 'live-tracker-sunday.html');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatPlayerStatString(stats, pos, isConcluded) {
  const p = String(pos || '').toUpperCase();
  if (!stats) {
    return isConcluded ? 'Final • 0 touches recorded' : 'Pre-game • 0 touches';
  }
  const fpts = stats.fantasyPoints != null ? stats.fantasyPoints : (stats.fantasyPts != null ? stats.fantasyPts : null);
  const fptsSuffix = fpts != null ? ` • ⚡ ${Number(fpts).toFixed(2)} Fantasy Pts` : '';

  if (p === 'QB') {
    const compAtt = stats.passCompAtt && stats.passCompAtt !== '0/0' ? stats.passCompAtt : (stats.passAtt ? `0/${stats.passAtt}` : '0/0');
    let str = `${compAtt} Att • ${stats.passYds || 0} Yds • ${stats.passTd || 0} TD`;
    if (stats.rushYds > 0) str += ` • ${stats.rushYds} Rush Yds`;
    return str + fptsSuffix;
  }
  if (['K'].includes(p)) {
    return `${stats.fg || '0/0'} FG • ${stats.xp || '0/0'} XP • ${stats.pts || 0} Pts${fptsSuffix}`;
  }
  if (['LB', 'DB', 'DL', 'DE', 'DT', 'CB', 'S', 'DEF', 'D'].includes(p)) {
    return `${stats.tkl || 0} TKL • ${stats.sck || 0} SCK • ${stats.int || 0} INT${fptsSuffix}`;
  }
  // Skill positions (RB / WR / TE / FLEX): Carries, Rush Yds, Rec / Tgt, Rec Yds, Total Yds, and TDs
  const totalYds = (stats.rushYds || 0) + (stats.recYds || 0);
  const totalTd = (stats.rushTd || 0) + (stats.recTd || 0);
  const touches = (stats.car || 0) + (stats.rec || 0);
  if (touches === 0 && (stats.tgt || 0) === 0 && totalYds === 0 && totalTd === 0) {
    return isConcluded ? `Final • 0 touches recorded${fptsSuffix}` : 'Pre-game • 0 touches';
  }

  const parts = [];
  if (stats.car > 0 || stats.rushYds > 0 || p === 'RB') {
    parts.push(`${stats.car || 0} Car`);
    parts.push(`${stats.rushYds || 0} Rush Yds`);
  }
  if (stats.tgt > 0 || stats.rec > 0 || stats.recYds > 0 || p === 'WR' || p === 'TE') {
    parts.push(`${stats.rec || 0} Rec / ${stats.tgt || 0} Tgt`);
    parts.push(`${stats.recYds || 0} Rec Yds`);
  }
  if ((stats.car > 0 || stats.rushYds > 0) && (stats.rec > 0 || stats.recYds > 0)) {
    parts.push(`${totalYds} Tot Yds`);
  }
  parts.push(`${totalTd} TD`);
  if (fpts != null) {
    parts.push(`⚡ ${Number(fpts).toFixed(2)} Fantasy Pts`);
  }
  return parts.join(' • ');
}


// ---------------------------------------------------------------------------
// First-TD scorer grading (2026-09-24). A `first_touchdown` leg used to fall into
// the generic "touchdown/td" branch (rushTd + recTd >= 1), so ANY TD by the player
// showed as a hit -- Bijan's TNF rush TD (2nd TD of the game) graded HIT on the
// 1st-TD SGP even though Watson scored first. These helpers read the actual first
// TD scorer from ESPN summary.scoringPlays (chronological). They are serialized
// into the client page via Function#toString so the build-time snapshot and the
// live browser poll share one implementation (and no template-literal escaping).
// They must stay self-contained (no references to outer variables).
// ---------------------------------------------------------------------------
function ftdNormName(s) {
  return String(s || '').toLowerCase()
    .replace(/\b(sr|jr|iii|ii|iv)\b\.?/g, '')
    .replace(/['.\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isFirstTdMarket(market) {
  const m = String(market || '').toLowerCase();
  if (!(m.includes('td') || m.includes('touchdown'))) return false;
  return /first|1st/.test(m);
}

function extractFirstTdFromSummary(data) {
  const plays = (data && data.scoringPlays) || [];
  const comp = data && data.header && data.header.competitions && data.header.competitions[0];
  const teams = ((comp && comp.competitors) || []).map(c => c && c.team && c.team.abbreviation).filter(Boolean);
  if (!teams.length) return null;
  const out = { teams, game: null, byTeam: {} };
  for (const p of plays) {
    const isTd = (p && p.scoringType && String(p.scoringType.name || '').toLowerCase() === 'touchdown') ||
      /touchdown/i.test((p && p.type && p.type.text) || '');
    if (!isTd) continue;
    const text = String(p.text || '');
    const m = text.match(/^(.+?)\s+\d+\s+(?:yd|yard)/i);
    const scorerRaw = (m ? m[1] : text.split(/\s+(?:pass|run|rush|fumble|interception|punt|kickoff|kick|blocked)\b/i)[0]).trim();
    const team = String((p.team && (p.team.abbreviation || p.team)) || '').toUpperCase();
    const rec = {
      scorer: ftdNormName(scorerRaw),
      scorerDisplay: scorerRaw,
      text,
      team,
      period: p.period && p.period.number,
      clock: p.clock && p.clock.displayValue
    };
    if (!out.game) out.game = rec;
    if (team && !out.byTeam[team]) out.byTeam[team] = rec;
  }
  return out;
}

function registerFirstTd(map, ftd) {
  if (!map || !ftd) return;
  const alias = { WSH: 'WAS', WAS: 'WSH', JAC: 'JAX', JAX: 'JAC', LA: 'LAR', LAR: 'LA' };
  for (const t of ftd.teams || []) {
    const T = String(t).toUpperCase();
    map[T] = ftd;
    if (alias[T]) map[alias[T]] = ftd;
  }
}

// Returns { resolved, hit, label }. resolved=false until a TD has been scored in the
// game (or by the player's team, for a team-scoped first-TD market).
function firstTdLegState(player, team, market, map) {
  const T = String(team || '').toUpperCase();
  const info = map && map[T];
  if (!info) return { resolved: false, hit: false, label: '' };
  const alias = { WSH: 'WAS', WAS: 'WSH', JAC: 'JAX', JAX: 'JAC', LA: 'LAR', LAR: 'LA' };
  const teamScoped = String(market || '').toLowerCase().includes('team');
  const rec = teamScoped ? (info.byTeam[T] || info.byTeam[alias[T]]) : info.game;
  if (!rec) return { resolved: false, hit: false, label: '' };
  const p = ftdNormName(player);
  const pp = p.split(' ');
  const sp = rec.scorer.split(' ');
  const hit = !!p && (rec.scorer === p ||
    (pp.length > 1 && sp.length > 1 && pp[pp.length - 1] === sp[sp.length - 1] && pp[0][0] === sp[0][0]));
  return { resolved: true, hit, label: rec.scorerDisplay + (rec.period ? ' Q' + rec.period + (rec.clock ? ' ' + rec.clock : '') : '') };
}

async function loadConcludedGameStats(schedule = [], week = 1) {
  const boxscoresDir = path.join(ROOT, 'data', 'fantasy', 'boxscores');
  await mkdir(boxscoresDir, { recursive: true });

  const athleteStatsMap = {};
  const athleteInjuriesMap = {};
  const teamStatusMap = {};
  const teamScoreMap = {};
  const firstTdByTeam = {};
  const NORM_ABBR = { WSH: 'WAS', JAC: 'JAX' };
  const normAbbr = (a) => NORM_ABBR[a] || a;
  const weekGames = schedule.filter(g => g.week === week);

  const concludedGames = weekGames.filter(g => g.status === 'post' || g.status === 'final');

  const eventIds = new Set(concludedGames.map(g => g.id || g.game_id).filter(Boolean));
  // REMOVED 2026-09-21: these were two hardcoded WEEK 1 event ids
  //   401872656 = SEA 13 @ NE 10  (wk1)
  //   401872657 = LAR  7 @ SF 27  (wk1)
  // Because the stat merge below OVERWRITES rather than accumulates, and a live
  // game's boxscore only contains athletes who have already recorded a stat, any
  // player without a touch yet tonight kept his WEEK 1 line in athleteStatsMap.
  // Live effect: Kyren Williams showed 11 car / 41 rush yds and Stafford showed
  // 15/25 for 155 while the real game was 0-0. Never seed the map with event ids
  // from a different week than the one being rendered.

  try {
    const sbRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    if (sbRes.ok) {
      const sbData = await sbRes.json();
      (sbData.events || []).forEach(ev => {
        const isLive = ev.status?.type?.state === 'in';
        const isPost = ev.status?.type?.completed || ev.status?.type?.name === 'STATUS_FINAL';
        if ((isLive || isPost) && ev.id) {
          eventIds.add(String(ev.id));
        }
        // Build a team-status snapshot at build time so the page loads already knowing
        // which teams' games are final/live, instead of only learning that from a
        // client-side poll that may not have run yet (this was the root cause of the
        // Player Cheat Sheet not "clearing out" finished-game props on load).
        try {
          const comp = ev?.competitions?.[0];
          const competitors = Array.isArray(comp?.competitors) ? comp.competitors : [];
          const home = competitors.find(c => c && c.homeAway === 'home');
          const away = competitors.find(c => c && c.homeAway === 'away');
          if (home && away) {
            const homeAbbr = normAbbr((home.team?.abbreviation || '').toUpperCase());
            const awayAbbr = normAbbr((away.team?.abbreviation || '').toUpperCase());
            const homeScore = parseInt(home.score ?? '-1', 10);
            const awayScore = parseInt(away.score ?? '-1', 10);
            const statusName = ev.status?.type?.name || '';
            const isCompleted = ev.status?.type?.completed === true || statusName === 'STATUS_FINAL';
            const isCanceled = statusName === 'STATUS_CANCELED' || statusName === 'STATUS_POSTPONED' || statusName === 'STATUS_SUSPENDED';
            const clock = ev.status?.displayClock || '';
            const period = ev.status?.period || 0;
            const isHalfOrLater = period >= 3 || ev.status?.type?.description === 'Halftime' || isCompleted;
            const scoreSummary = awayAbbr + ' ' + (awayScore >= 0 ? awayScore : 0) + ' - ' + homeAbbr + ' ' + (homeScore >= 0 ? homeScore : 0);
            let statusDesc = isCompleted ? 'Final: ' + scoreSummary : (isLive ? (clock + ' Q' + period + ' • ' + scoreSummary) : (ev.status?.type?.shortDetail || 'Upcoming'));
            if (isCanceled) statusDesc = ev.status?.type?.shortDetail || 'Postponed';
            const info = { isCompleted, isLive, isCanceled, isHalfOrLater, period, clock, statusDesc, scoreSummary };
            if (homeAbbr) teamStatusMap[homeAbbr] = info;
            if (awayAbbr) teamStatusMap[awayAbbr] = info;
            if (homeScore >= 0 && awayScore >= 0) {
              if (homeAbbr) teamScoreMap[homeAbbr] = { teamScore: homeScore, oppAbbr: awayAbbr, oppScore: awayScore, isCompleted };
              if (awayAbbr) teamScoreMap[awayAbbr] = { teamScore: awayScore, oppAbbr: homeAbbr, oppScore: homeScore, isCompleted };
            }
          }

        } catch (teamErr) {
          void teamErr;
        }
      });
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch live ESPN scoreboard during build:', err.message);
  }


  for (const eventId of eventIds) {
    const cachePath = path.join(boxscoresDir, `espn-${eventId}.json`);
    let data = null;
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`);
      if (res.ok) {
        data = await res.json();
        await writeFile(cachePath, JSON.stringify(data, null, 2), 'utf8');
      }
    } catch {
      try {
        const raw = await readFile(cachePath, 'utf8');
        data = JSON.parse(raw);
      } catch {
        console.warn(`⚠️ Could not load summary for event ${eventId}`);
      }
    }

    // First-TD scorer for this event (grades first_touchdown legs; see helpers above).
    try { registerFirstTd(firstTdByTeam, extractFirstTdFromSummary(data)); } catch { /* non-fatal */ }

    if (data?.injuries) {
      for (const t of data.injuries) {
        for (const inj of t.injuries || []) {
          const ath = inj.athlete;
          if (!ath) continue;
          const dName = (ath.displayName || '').toLowerCase().trim();
          const fName = (ath.fullName || '').toLowerCase().trim();
          const sName = (ath.shortName || '').toLowerCase().trim();
          const noSuffix = dName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
          const cleanD = dName.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();
          const cleanNoSuff = noSuffix.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();
          const names = [dName, fName, sName, noSuffix, cleanD, cleanNoSuff].filter(Boolean);
          const status = inj.status || 'Injured';
          const detail = inj.details?.type || inj.details?.detail || '';
          const badgeStr = `🏥 ${status}${detail ? ' (' + detail + ')' : ''}`;
          names.forEach(n => {
            athleteInjuriesMap[n] = badgeStr;
          });
        }
      }
    }

    if (data?.boxscore?.players) {
      for (const t of data.boxscore.players) {
        for (const statGroup of t.statistics || []) {
          const groupName = statGroup.name;
          for (const a of statGroup.athletes || []) {
            const ath = a.athlete;
            if (!ath) continue;
            const dName = (ath.displayName || '').toLowerCase().trim();
            const fName = (ath.fullName || '').toLowerCase().trim();
            const sName = (ath.shortName || '').toLowerCase().trim();
            const noSuffix = dName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
            const cleanD = dName.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();
            const cleanNoSuff = noSuffix.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();

            const names = [dName, fName, sName, noSuffix, cleanD, cleanNoSuff].filter(Boolean);

            const s = a.stats || [];
            names.forEach(n => {
              if (!athleteStatsMap[n]) {
                athleteStatsMap[n] = {
                  passCompAtt: '0/0', passYds: 0, passTd: 0,
                  car: 0, rushYds: 0, rushTd: 0,
                  tgt: 0, rec: 0, recYds: 0, recTd: 0,
                  tkl: 0, sck: 0, int: 0,
                  fg: '0/0', xp: '0/0', pts: 0
                };
              }
              const rec = athleteStatsMap[n];
              if (groupName === 'passing') {
                rec.passCompAtt = s[0] || '0/0';
                rec.passAtt = parseInt((s[0] || '0/0').split('/')[1] || 0, 10);
                rec.passComp = parseInt((s[0] || '0/0').split('/')[0] || 0, 10);
                rec.passYds = parseInt(s[1] || 0, 10);
                rec.passTd = parseInt(s[3] || 0, 10);
                rec.passInt = parseInt(s[4] || 0, 10);
              } else if (groupName === 'rushing') {
                rec.car = parseInt(s[0] || 0, 10);
                rec.rushYds = parseInt(s[1] || 0, 10);
                rec.rushTd = parseInt(s[3] || 0, 10);
              } else if (groupName === 'receiving') {
                rec.rec = parseInt(s[0] || 0, 10);
                rec.recYds = parseInt(s[1] || 0, 10);
                rec.recTd = parseInt(s[3] || 0, 10);
                rec.tgt = parseInt(s[5] || 0, 10);
              } else if (groupName === 'defensive') {
                rec.tkl = parseInt(s[0] || 0, 10);
                rec.sck = parseFloat(s[2] || 0);
                rec.int = parseInt(s[6] || 0, 10);
              } else if (groupName === 'kicking') {
                rec.fg = s[0] || '0/0';
                rec.xp = s[3] || '0/0';
                rec.pts = parseInt(s[4] || 0, 10);
              }

              // Compute Half-PPR fantasy points
              const fpts = (
                (rec.passYds * 0.04) +
                (rec.passTd * 4) +
                (rec.rushYds * 0.1) +
                (rec.rushTd * 6) +
                (rec.rec * 0.5) +
                (rec.recYds * 0.1) +
                (rec.recTd * 6) +
                (rec.tkl * 1.0) +
                (rec.sck * 2.0) +
                (rec.int * 2.0) +
                (rec.pts || 0)
              );
              rec.fantasyPts = Number(fpts.toFixed(2));
            });
          }
        }
      }
    }
  }

  return { athleteStatsMap, athleteInjuriesMap, teamStatusMap, teamScoreMap, firstTdByTeam };


}

// Resolve the current NFL week when no --week flag is passed (same pattern as
// build-secondary-matchup-vulnerability.js) instead of silently defaulting to Week 1.
const DEFAULT_WEEK = getNFLWeekInfo().week || 1;

export async function generateLiveTracker({ week = DEFAULT_WEEK, outPaths = [DEFAULT_OUT_PUBLIC, DEFAULT_OUT_DOCS] } = {}) {
  console.log(`\n🏈 Generating Sunday Multi-Game Live Tracker for Week ${week}...`);

  const rawWagers = await readFile(WAGERS_PATH, 'utf8');
  const allWagers = JSON.parse(rawWagers);
  const wagers = allWagers.filter(w => (w.week === week || !w.week) && w.game !== 'NFL Futures');
  try {
    const paper = JSON.parse(await readFile(PAPER_WAGERS_PATH, 'utf8'));
    for (const w of paper) if (w.week === week) wagers.push({ ...w, is_paper: true });
  } catch { /* no paper tickets */ }
  // Season-long futures (Super Bowl winner, MVP, division, etc.) don't belong on a single
  // game-day board -- they're tracked in their own Futures Portfolio tab below, independent
  // of which week's tracker is being generated, and are pulled from the full wager list
  // (not the week-filtered one) since they span the whole season.
  const futuresWagers = allWagers.filter(w => w.game === 'NFL Futures');

  let schedule = [];
  try {
    const rawSched = await readFile(SCHEDULE_PATH, 'utf8');
    schedule = JSON.parse(rawSched);
  } catch {
    console.warn(`⚠️ Warning: schedule.json not found, using wager games.`);
  }
  const weekSchedule = schedule.filter(g => (g.week === week || g.week === Number(week)));
  if (weekSchedule.length === 0 && schedule.length > 0) {
    weekSchedule.push(...schedule.slice(0, 16));
  }

  // Team mapping and leg schedule matching helpers
  const TEAM_MAP = {
    'ARIZONA': 'ARI', 'CARDINALS': 'ARI', 'ARI': 'ARI',
    'ATLANTA': 'ATL', 'FALCONS': 'ATL', 'ATL': 'ATL',
    'BALTIMORE': 'BAL', 'RAVENS': 'BAL', 'BAL': 'BAL',
    'BUFFALO': 'BUF', 'BILLS': 'BUF', 'BUF': 'BUF',
    'CAROLINA': 'CAR', 'PANTHERS': 'CAR', 'CAR': 'CAR',
    'CHICAGO': 'CHI', 'BEARS': 'CHI', 'CHI': 'CHI',
    'CINCINNATI': 'CIN', 'BENGALS': 'CIN', 'CIN': 'CIN',
    'CLEVELAND': 'CLE', 'BROWNS': 'CLE', 'CLE': 'CLE',
    'DALLAS': 'DAL', 'COWBOYS': 'DAL', 'DAL': 'DAL',
    'DENVER': 'DEN', 'BRONCOS': 'DEN', 'DEN': 'DEN',
    'DETROIT': 'DET', 'LIONS': 'DET', 'DET': 'DET',
    'GREEN BAY': 'GB', 'PACKERS': 'GB', 'GB': 'GB',
    'HOUSTON': 'HOU', 'TEXANS': 'HOU', 'HOU': 'HOU',
    'INDIANAPOLIS': 'IND', 'COLTS': 'IND', 'IND': 'IND',
    'JACKSONVILLE': 'JAX', 'JAGUARS': 'JAX', 'JAX': 'JAX', 'JAC': 'JAX',
    'KANSAS CITY': 'KC', 'CHIEFS': 'KC', 'KC': 'KC',
    'LAS VEGAS': 'LV', 'RAIDERS': 'LV', 'LV': 'LV',
    'LOS ANGELES CHARGERS': 'LAC', 'CHARGERS': 'LAC', 'LAC': 'LAC',
    'LOS ANGELES RAMS': 'LAR', 'RAMS': 'LAR', 'LAR': 'LAR', 'LA': 'LAR',
    'MIAMI': 'MIA', 'DOLPHINS': 'MIA', 'MIA': 'MIA',
    'MINNESOTA': 'MIN', 'VIKINGS': 'MIN', 'MIN': 'MIN',
    'NEW ENGLAND': 'NE', 'PATRIOTS': 'NE', 'NE': 'NE',
    'NEW ORLEANS': 'NO', 'SAINTS': 'NO', 'NO': 'NO',
    'NEW YORK GIANTS': 'NYG', 'GIANTS': 'NYG', 'NYG': 'NYG',
    'NEW YORK JETS': 'NYJ', 'JETS': 'NYJ', 'NYJ': 'NYJ',
    'PHILADELPHIA': 'PHI', 'EAGLES': 'PHI', 'PHI': 'PHI',
    'PITTSBURGH': 'PIT', 'STEELERS': 'PIT', 'PIT': 'PIT',
    'SAN FRANCISCO': 'SF', '49ERS': 'SF', 'SF': 'SF',
    'SEATTLE': 'SEA', 'SEAHAWKS': 'SEA', 'SEA': 'SEA',
    'TAMPA BAY': 'TB', 'BUCCANEERS': 'TB', 'BUCS': 'TB', 'TB': 'TB',
    'TENNESSEE': 'TEN', 'TITANS': 'TEN', 'TEN': 'TEN',
    'WASHINGTON': 'WAS', 'COMMANDERS': 'WAS', 'WAS': 'WAS', 'WSH': 'WAS'
  };

  function normalizeTeam(t) {
    if (!t) return '';
    const clean = String(t).toUpperCase().trim();
    return TEAM_MAP[clean] || clean;
  }

  function extractTeamFromLeg(leg) {
    if (leg.team) return normalizeTeam(leg.team);
    if (leg.selection) {
      for (const [key, abbr] of Object.entries(TEAM_MAP)) {
        if (key.length >= 3 && new RegExp('\\b' + key + '\\b', 'i').test(leg.selection)) {
          return abbr;
        }
      }
    }
    if (leg.game) {
      const parts = leg.game.split(/\s*[@vV][sS]?\.?\s*/);
      if (parts.length === 2) {
        return normalizeTeam(parts[0]);
      }
    }
    return '';
  }

  function findScheduleGameForLeg(leg, schedList) {
    if (leg.game) {
      const parts = leg.game.split(/\s*[@vV][sS]?\.?\s*/);
      if (parts.length === 2) {
        const t1 = normalizeTeam(parts[0]);
        const t2 = normalizeTeam(parts[1]);
        const match = schedList.find(g => 
          (normalizeTeam(g.visitor) === t1 && normalizeTeam(g.home) === t2) ||
          (normalizeTeam(g.visitor) === t2 && normalizeTeam(g.home) === t1)
        );
        if (match) return match;
      }
    }
    if (leg.team && leg.opponent) {
      const t1 = normalizeTeam(leg.team);
      const t2 = normalizeTeam(leg.opponent);
      const match = schedList.find(g => 
        (normalizeTeam(g.visitor) === t1 && normalizeTeam(g.home) === t2) ||
        (normalizeTeam(g.visitor) === t2 && normalizeTeam(g.home) === t1)
      );
      if (match) return match;
    }
    if (leg.team) {
      const t = normalizeTeam(leg.team);
      const match = schedList.find(g => normalizeTeam(g.visitor) === t || normalizeTeam(g.home) === t);
      if (match) return match;
    }
    if (leg.selection) {
      for (const [key, abbr] of Object.entries(TEAM_MAP)) {
        if (key.length >= 3 && new RegExp('\\b' + key + '\\b', 'i').test(leg.selection)) {
          const match = schedList.find(g => normalizeTeam(g.visitor) === abbr || normalizeTeam(g.home) === abbr);
          if (match) return match;
        }
      }
    }
    return null;
  }

  function getLegKickoffTime(leg, schedList) {
    const g = findScheduleGameForLeg(leg, schedList);
    if (!g) {
      return { timestamp: 9999999999999, shortText: 'TBD', game: null };
    }
    const ts = g.kickoff_utc ? new Date(g.kickoff_utc).getTime() : 9999999999999;
    let shortText = g.time || '';
    if (g.kickoff_utc) {
      const d = new Date(g.kickoff_utc);
      if (!isNaN(d.getTime())) {
        shortText = d.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' }) + ' PT';
      }
    }
    return { timestamp: ts, shortText, game: g };
  }

  // SuperContest Data Ingestion (Week 1 / Current Week)
  let scLines = [];
  try {
    const scPath = path.join(ROOT, 'data', 'supercontest', `week-${String(week).padStart(2, '0')}-lines.json`);
    const scLatest = path.join(ROOT, 'data', 'supercontest', 'latest.json');
    const raw = await readFile(scPath, 'utf8').catch(() => readFile(scLatest, 'utf8'));
    scLines = JSON.parse(raw).games || [];
  } catch (err) {
    console.warn('⚠️ SuperContest lines not loaded:', err.message);
  }

  let scMarketMap = {};
  try {
    const scMktPath = path.join(ROOT, 'data', 'supercontest', 'live-market-comparison.json');
    const rawMkt = await readFile(scMktPath, 'utf8');
    const mktGames = JSON.parse(rawMkt).games || [];
    mktGames.forEach(g => {
      const fav = g.fav_abbr || g.favorite;
      const dog = g.dog_abbr || g.underdog;
      if (fav && dog) {
        scMarketMap[`${fav}_${dog}`] = g;
        scMarketMap[`${dog}_${fav}`] = g;
      }
    });
  } catch (err) {
    console.warn('⚠️ SuperContest market data not loaded:', err.message);
  }

  // Fantasy Football Ingestion (Yahoo Live Rosters & Bench Drop Matrix)
  let fantasyData = { leagues: [], unifiedBench: [], targetKickers: [], leaguesNeedingKicker: 0, uniqueBenchPlayers: 0 };
  try {
    const fantasyPath = path.join(ROOT, 'data', 'fantasy', 'yahoo-live-rosters.json');
    const rawFantasy = await readFile(fantasyPath, 'utf8');
    fantasyData = JSON.parse(rawFantasy);
  } catch (err) {
    console.warn('⚠️ Yahoo live fantasy rosters not loaded:', err.message);
  }

  // All-positions Available Players Radar (offense, DEF, IDP -- kickers stay
  // in fantasyData.targetKickers above, which already has its own section).
  let radarData = { leagues: [], generatedAt: null };
  try {
    const radarPath = path.join(ROOT, 'data', 'fantasy', 'available-players-radar.json');
    const rawRadar = await readFile(radarPath, 'utf8');
    radarData = JSON.parse(rawRadar);
  } catch (err) {
    console.warn('⚠️ Available players radar not loaded:', err.message);
  }

  const DEF_POSITIONS = new Set(['DEF', 'D', 'LB', 'DB', 'DL', 'DE', 'DT', 'CB', 'S']);
  if (fantasyData && Array.isArray(fantasyData.leagues)) {
    // Exclude any DEF / defensive players from the Evaluating bench pool
    fantasyData.leagues.forEach(l => {
      if (Array.isArray(l.bench)) {
        l.bench = l.bench.filter(p => !DEF_POSITIONS.has(String(p.displayPosition || p.selectedPosition || '').toUpperCase()));
      }
    });

    // Default order: Prioritize competitive leagues; place Central Coast / CC Bowl at the bottom
    fantasyData.leagues.sort((a, b) => {
      const isA_CC = (a.leagueName || '').toLowerCase().includes('cc bowl') || (a.leagueName || '').toLowerCase().includes('champions league');
      const isB_CC = (b.leagueName || '').toLowerCase().includes('cc bowl') || (b.leagueName || '').toLowerCase().includes('champions league');
      if (isA_CC && !isB_CC) return 1;
      if (!isA_CC && isB_CC) return -1;
      return 0;
    });
  }

  // Pre-load ESPN summary boxscores for concluded games (e.g. SF @ LAR Melbourne, NE @ SEA)
  const { athleteStatsMap: boxscoreAthleteStats, athleteInjuriesMap: boxscoreAthleteInjuries, teamStatusMap: initialTeamStatusMap, teamScoreMap: initialTeamScoreMap, firstTdByTeam: initialFirstTdByTeam } = await loadConcludedGameStats(schedule, week);



  // Official Ranked Recommendations: Top 5 Card & Alternates (#6–#10)
  const SC_RANKINGS = {
    'CAR': {
      rank: 1, grade: 'A+', isTop5: true, pickTeam: 'CAR', pickLabel: 'Carolina Panthers +3.0',
      opponent: 'CHI', isHome: true, lockedSpread: '+3.0',
      dkSpread: 'CHI -3.0 / CAR +3.0', modelEdge: '+0.6 pts (TSI +2.5)', clvText: 'Push protection on flat 3',
      consensus: '5-Show Consensus • Stuckey #2 • Simon Says Pick',
      reason: 'Evero disguise defense collapses young QB processing; Canales sprint-out scheme; 66% Week 1 Divisional Dog system; 14-6 ATS home dog.'
    },
    'IND': {
      rank: 2, grade: 'A+', isTop5: true, pickTeam: 'IND', pickLabel: 'Indianapolis Colts +3.5',
      opponent: 'BAL', isHome: true, lockedSpread: '+3.5',
      dkSpread: 'BAL -3.5 / IND +3.5', modelEdge: '+5.4 pts (Model favors IND!)', clvText: 'Crosses Key Number 3',
      consensus: '4 Units Even Money • Tucker & Fezzik Consensus',
      reason: 'Colts favored in 10,000 sims; Ravens start backup Center in loud dome; Madubuike out; Steichen put up 38 pts on Minter defense.'
    },
    'TB': {
      rank: 3, grade: 'A+', isTop5: true, pickTeam: 'TB', pickLabel: 'Tampa Bay Buccaneers +3.5',
      opponent: 'CIN', isHome: false, lockedSpread: '+3.5',
      dkSpread: 'CIN -3.5 / TB +3.5', modelEdge: '+2.2 pts (Model: CIN -1.3)', clvText: 'Crosses Key Number 3',
      consensus: '5-Show Consensus • Chad Choice • Tucker 2U',
      reason: 'Top-5 PFF offensive line vs gutted Bengals front; Baker Mayfield undefeated in Cincinnati; Joe Burrow slow Sept starter (3-9 SU).'
    },
    'ARI': {
      rank: 4, grade: 'A+', isTop5: true, pickTeam: 'ARI', pickLabel: 'Arizona Cardinals +9.5',
      opponent: 'LAC', isHome: false, lockedSpread: '+9.5',
      dkSpread: 'LAC -9.5 / ARI +9.5', modelEdge: '+7.4 pts (Model: LAC -2.1)', clvText: 'Near double-digit key #',
      consensus: '4 Units Even Money • Simon Hunter Best Bet',
      reason: 'Double-digit Week 1 dogs (+9.5+) are 14-7 ATS (66.7%) since 2003; Chargers breaking in 2 new coordinators; Harbaugh run pace limits possessions.'
    },
    'HOU': {
      rank: 5, grade: 'A+', isTop5: true, pickTeam: 'HOU', pickLabel: 'Houston Texans +1.5',
      opponent: 'BUF', isHome: true, lockedSpread: '+1.5',
      dkSpread: 'BUF -1.5 / HOU +1.5', modelEdge: '+0.9 pts (Model: Pick)', clvText: 'Short home dog value',
      consensus: 'Stuckey Contest #3 • The Hammer Consensus',
      reason: 'DeMeco Ryans returns 11 starters; Cover 1 spy held Buffalo to 5% success rate; C.J. Stroud 69.2% ATS in 1H; Josh Allen 0-4 SU in Houston.'
    },
    'PHI': {
      rank: 6, grade: 'A', isAlt: true, pickTeam: 'PHI', pickLabel: 'Philadelphia Eagles -4.5',
      opponent: 'WAS', isHome: true, lockedSpread: '-4.5',
      dkSpread: 'PHI -5.5 (Steamed 1.0 pt!)', modelEdge: '+1.2 pts', clvText: '+1.0 pt Free CLV! (Steamed to -5.5)',
      consensus: 'Sharp Steam Target',
      reason: 'Locked contest line gives Eagles -4.5 when live DraftKings price is -5.5. Washington OL in shambles after losing LT Tunsil.'
    },
    'MIA': {
      rank: 7, grade: 'A', isAlt: true, pickTeam: 'MIA', pickLabel: 'Miami Dolphins +3.5',
      opponent: 'LV', isHome: false, lockedSpread: '+3.5',
      dkSpread: 'LV -3.0 / MIA +3.0', modelEdge: '+5.1 pts (MIA -1.6)', clvText: '+0.5 pt Free Hook! (Captures 3.5 vs 3.0)',
      consensus: 'Key Hook Protection',
      reason: 'Live DraftKings tightened to LV -3.0, but SuperContest locked at +3.5! Getting Miami at +3.5 gives hook equity and push protection.'
    },
    'SF': {
      rank: 8, grade: 'A', isAlt: true, pickTeam: 'SF', pickLabel: 'San Francisco 49ers +3.5',
      opponent: 'LAR', isHome: false, lockedSpread: '+3.5',
      dkSpread: 'LAR -3.5 / SF +3.5 (Concluded)', modelEdge: '+2.2 pts', clvText: 'Crosses Key Number 3',
      consensus: 'Melbourne Showcase (Won 27-7)',
      reason: 'Already won 27-7 SU/ATS! Circadian early arrival in Australia; Kyle Shanahan 9-3 ATS as dog vs McVay.'
    },
    'KC': {
      rank: 9, grade: 'A', isAlt: true, pickTeam: 'KC', pickLabel: 'Kansas City Chiefs -2.5',
      opponent: 'DEN', isHome: true, lockedSpread: '-2.5',
      dkSpread: 'KC -3.0 (Steamed to 3)', modelEdge: '-0.1 pts', clvText: '+0.5 pt Free CLV! (Laying under Key 3)',
      consensus: 'Key 3 Stale Line Play',
      reason: 'DraftKings moved to Chiefs -3.0. Locked contest line lets you lay Chiefs -2.5 under the field goal, avoiding a push on 3.'
    },
    'DAL': {
      rank: 10, grade: 'A', isAlt: true, pickTeam: 'DAL', pickLabel: 'Dallas Cowboys -3.0',
      opponent: 'NYG', isHome: false, lockedSpread: '-3.0',
      dkSpread: 'DAL -3.0 / NYG +3.0', modelEdge: '+0.5 pts', clvText: 'Push protection on 3',
      consensus: 'Doug Kazarian Contest Pick',
      reason: 'Dak Prescott is 14-3 SU vs NY Giants and 32-15 ATS in NFC East; Christian Parker Fangio defense; Giants pass protection concerns.'
    },
    'PIT': {
      rank: 3, grade: 'A+', isTop5: true, pickTeam: 'PIT', pickLabel: 'Pittsburgh Steelers -3.5',
      opponent: 'ATL', isHome: true, lockedSpread: '-3.5',
      dkSpread: 'PIT -5.5 (Steamed 2.0 pts!)', modelEdge: '+2.5 pts', clvText: '+2.0 pts Free CLV! (Steamed to -5.5)',
      consensus: 'Sharp Steam Target • Key 3+ Move',
      reason: 'Locked contest line gives Steelers -3.5 when live DraftKings price steamed out to -5.5, capturing massive closing line value.'
    }
  };

  let scTop5List = [
    SC_RANKINGS['CAR'],
    SC_RANKINGS['IND'],
    SC_RANKINGS['TB'],
    SC_RANKINGS['ARI'],
    SC_RANKINGS['HOU'],
  ];
  let hasLockedCardFile = false;
  const lockedCardPath = path.resolve(ROOT, `data/supercontest/locked-card-week-${week}.json`);
  const pubLockedCardPath = path.resolve(ROOT, `public/locked-card-week-${week}.json`);
  try {
    let raw = '';
    try { raw = await readFile(lockedCardPath, 'utf8'); } catch {
      raw = await readFile(pubLockedCardPath, 'utf8');
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      scTop5List = parsed.map((item, idx) => {
        const team = item.team || item.pickTeam;
        const rankInfo = SC_RANKINGS[team] || {};
        return {
          rank: idx + 1,
          grade: rankInfo.grade || 'A',
          isTop5: true,
          pickTeam: team,
          pickLabel: item.spreadLabel || item.pickLabel || `${team} ${item.spread || ''}`,
          opponent: item.opponent || rankInfo.opponent || 'OPP',
          isHome: item.isHome ?? rankInfo.isHome ?? false,
          lockedSpread: item.spreadLabel || item.lockedSpread || `${item.spread || ''}`,
          dkSpread: rankInfo.dkSpread || '-',
          modelEdge: rankInfo.modelEdge || '+0.0 pts',
          clvText: item.clvText || rankInfo.clvText || '0.0 CLV',
          consensus: rankInfo.consensus || 'Official Locked Pick',
          reason: item.reason || rankInfo.reason || `Official Contest Pick on ${team}.`
        };
      });
      hasLockedCardFile = true;
    }
  } catch {}

  const scAlternatesList = [
    SC_RANKINGS['PHI'],
    SC_RANKINGS['MIA'],
    SC_RANKINGS['SF'],
    SC_RANKINGS['KC'],
    SC_RANKINGS['DAL'],
  ];

  const scMatrixList = scLines.map(g => {
    const fav = g.favorite_abbr;
    const dog = g.underdog_abbr;
    const line = g.contest_line;
    const mkt = scMarketMap[`${fav}_${dog}`] || {};
    const rankInfo = SC_RANKINGS[fav] || SC_RANKINGS[dog] || null;

    // Real conclusion/cover state from the build-time ESPN scoreboard snapshot
    // (initialTeamScoreMap), instead of a hardcoded 2-team Thursday allowlist that
    // never accounted for Sunday's (or tonight's) actual results.
    const favScoreInfo = initialTeamScoreMap[fav];
    const dogScoreInfo = initialTeamScoreMap[dog];
    const scoreInfo = (favScoreInfo && favScoreInfo.oppAbbr === dog) ? favScoreInfo
      : (dogScoreInfo && dogScoreInfo.oppAbbr === fav) ? dogScoreInfo : null;
    const isConcluded = !!(scoreInfo && scoreInfo.isCompleted);

    let finalScore = null;
    let finalResult = null;
    let finalResultClass = 'sc-cover-upcoming';
    let finalCoverTeam = null;
    if (isConcluded) {
      const favScore = favScoreInfo ? favScoreInfo.teamScore : (scoreInfo === dogScoreInfo ? scoreInfo.oppScore : null);
      const dogScore = dogScoreInfo ? dogScoreInfo.teamScore : (scoreInfo === favScoreInfo ? scoreInfo.oppScore : null);
      if (favScore != null && dogScore != null) {
        const favMargin = (favScore + line) - dogScore;
        finalScore = `${dog} ${dogScore}, ${fav} ${favScore} (Final)`;
        if (favMargin > 0) {
          finalResult = `${fav} (${line > 0 ? '+' + line : line}) Covered`;
          finalResultClass = 'sc-cover-covering';
          finalCoverTeam = fav;
        } else if (favMargin < 0) {
          finalResult = `${dog} (${-line > 0 ? '+' + (-line) : -line}) Covered`;
          finalResultClass = 'sc-cover-covering';
          finalCoverTeam = dog;
        } else {
          finalResult = 'PUSH';
          finalResultClass = 'sc-cover-push';
        }
      }
    }

    const defaultPick = rankInfo ? rankInfo.pickTeam : fav;
    const defaultPickLabel = rankInfo ? rankInfo.pickLabel : `${fav} ${line > 0 ? '+' + line : line}`;

    return {
      fav,
      dog,
      line,
      homeTeam: g.home_team,
      awayTeam: g.away_team,
      favTeam: g.favorite_team,
      dogTeam: g.underdog_team,
      kickoffDay: g.kickoff_day,
      kickoffTime: g.kickoff_time_et,
      dkSpread: mkt.live_dk_spread || `${fav} ${line > 0 ? '+' + line : line}`,
      fdSpread: mkt.live_fd_spread || `${fav} ${line > 0 ? '+' + line : line}`,
      dkTotal: mkt.live_dk_total || '-',
      clvSummary: mkt.clv_summary || (rankInfo?.clvText || 'Exact match (0.0 movement)'),
      isTop5: !!rankInfo?.isTop5,
      isAlt: !!rankInfo?.isAlt,
      rank: rankInfo?.rank || 99,
      grade: rankInfo?.grade || 'B',
      pickTeam: defaultPick,
      pickLabel: defaultPickLabel,
      reason: rankInfo?.reason || `${fav} is favored by ${Math.abs(line)} points in the locked SuperContest line.`,
      consensus: rankInfo?.consensus || 'Market Consensus',
      isConcluded,
      finalScore,
      finalResult,
      finalResultClass,
      finalCoverTeam
    };
  });

  // Per-team win/loss/push lookup (derived from the matrix above) so any card
  // referencing a team by abbreviation (Top 5 card, Alternates) reflects the same
  // graded outcome as the matrix, instead of re-deriving or hardcoding it separately.
  const scResultByTeam = {};
  scMatrixList.forEach(g => {
    if (!g.isConcluded || !g.finalCoverTeam && g.finalResultClass !== 'sc-cover-push') return;
    const favResult = g.finalResultClass === 'sc-cover-push' ? 'push' : (g.finalCoverTeam === g.fav ? 'win' : 'loss');
    const dogResult = g.finalResultClass === 'sc-cover-push' ? 'push' : (g.finalCoverTeam === g.dog ? 'win' : 'loss');
    scResultByTeam[g.fav] = { result: favResult, scoreText: g.finalScore, badgeClass: favResult === 'win' ? 'sc-cover-covering' : (favResult === 'loss' ? 'sc-cover-atrisk' : 'sc-cover-push'), badgeText: favResult === 'win' ? `✅ Covered (${g.finalResult})` : (favResult === 'loss' ? `❌ Missed (${g.finalResult})` : '🟡 PUSH') };
    scResultByTeam[g.dog] = { result: dogResult, scoreText: g.finalScore, badgeClass: dogResult === 'win' ? 'sc-cover-covering' : (dogResult === 'loss' ? 'sc-cover-atrisk' : 'sc-cover-push'), badgeText: dogResult === 'win' ? `✅ Covered (${g.finalResult})` : (dogResult === 'loss' ? `❌ Missed (${g.finalResult})` : '🟡 PUSH') };
  });


  // Calculate totals
  let totalCashRisk = 0;
  let totalPromoRisk = 0;
  let totalPotentialPayout = 0;

  for (const bet of wagers) {
    if (bet.is_paper) continue; // imaginary money: never counted
    const isPromo = bet.is_promo_credit || bet.funding_type === 'promo_credit';
    if (isPromo) {
      totalPromoRisk += (bet.promo_credit_stake_usd ?? bet.stake_usd ?? 0);
    } else {
      totalCashRisk += (bet.cash_risk_usd ?? bet.stake_usd ?? 0);
    }
    totalPotentialPayout += (bet.potential_payout_usd ?? 0);
  }

  // Sort legs within every ticket chronologically by kickoff time (Morning -> Afternoon -> Night -> TBD)
  for (const bet of wagers) {
    if (Array.isArray(bet.legs)) {
      bet.legs.forEach((l, idx) => {
        if (!l.key) l.key = `leg_${bet.id}_${idx + 1}`;
      });
      bet.legs.sort((a, b) => {
        const tA = getLegKickoffTime(a, weekSchedule).timestamp;
        const tB = getLegKickoffTime(b, weekSchedule).timestamp;
        if (tA !== tB) return tA - tB;
        return (a.leg_num || 0) - (b.leg_num || 0);
      });
    }
  }

  function parseAmericanToDecimal(price) {
    if (price == null) return 1.9091; // default -110
    const clean = String(price).trim();
    const n = parseFloat(clean.replace('+', ''));
    if (isNaN(n) || n === 0) return 1.9091;
    if (n > 0) return 1 + (n / 100);
    return 1 + (100 / Math.abs(n));
  }

  // Build TICKET_CONFIG object for JS runtime
  const ticketConfigJs = {};
  for (const bet of wagers) {
    const isPromo = bet.is_promo_credit || bet.funding_type === 'promo_credit';
    const cashStake = isPromo ? 0 : (bet.cash_risk_usd ?? bet.stake_usd ?? 0);
    const promoStake = isPromo ? (bet.promo_credit_stake_usd ?? bet.stake_usd ?? 0) : 0;
    const payout = bet.potential_payout_usd ?? 0;
    const legs = (bet.legs || []).map((l, idx) => l.key || `leg_${bet.id}_${idx + 1}`);
    const openSlotLegs = (bet.legs || [])
      .map((l, idx) => ({ l, key: l.key || `leg_${bet.id}_${idx + 1}` }))
      .filter(({ l }) => l.market === 'open_slot' || l.status === 'OPEN')
      .map(({ key }) => key);

    const isRR = Boolean(
      (bet.ticket_type && bet.ticket_type.toLowerCase().includes('round robin')) ||
      (bet.wager_type && bet.wager_type.toLowerCase().includes('round robin'))
    );
    const rrMatch = (bet.ticket_type || '').match(/(\d+)-Team Combinations,\s*(\d+)\s*Parlays/i);
    const rrComboSize = rrMatch ? parseInt(rrMatch[1], 10) : (bet.id?.includes('compact') ? 2 : (isRR ? 4 : 1));
    const rrComboCount = rrMatch ? parseInt(rrMatch[2], 10) : (rrComboSize === 2 ? 28 : (isRR ? 70 : 1));
    const totalStake = bet.stake_usd || (cashStake + promoStake);
    const rrStakePerCombo = rrComboCount > 0 ? (totalStake / rrComboCount) : 1;

    const legDetails = (bet.legs || []).map((l, idx) => {
      const key = l.key || `leg_${bet.id}_${idx + 1}`;
      const price = l.price || l.odds_american || '-110';
      const decimalOdds = parseAmericanToDecimal(price);
      return { key, price, decimalOdds };
    });

    ticketConfigJs[bet.id] = {
      name: bet.game_title || bet.game,
      book: bet.book,
      ticketNumber: bet.ticket_number || null,
      isPromo,
      isPaper: !!bet.is_paper,
      cashStake,
      promoStake,
      payout,
      initialPayout: payout,
      type: bet.category?.includes('Prop') ? 'prop' : 'game',
      status: bet.status,
      result: bet.result,
      isSettled: bet.status === 'SETTLED',
      isLoss: bet.status === 'SETTLED' && (bet.result === 'loss' || bet.result === 'LOST'),
      isWin: bet.status === 'SETTLED' && (bet.result === 'win' || bet.result === 'WON'),
      isRoundRobin: isRR,
      rrComboSize,
      rrComboCount,
      rrStakePerCombo,
      legDetails,
      legsWon: (bet.legs || []).filter(l => l.status === 'WON').map((l, idx) => l.key || `leg_${bet.id}_${idx + 1}`),
      legsPushed: (bet.legs || []).filter(l => l.status === 'PUSH').map((l, idx) => l.key || `leg_${bet.id}_${idx + 1}`),
      openSlotLegs,
      legs
    };
  }

  function extractPlayerFromSelection(sel) {
    if (!sel || typeof sel !== 'string') return null;
    const clean = sel.trim();
    const m = clean.match(/^([A-Za-z'.\-]+(?:\s+[A-Za-z'.\-]+)+?)(?:\s+(?:Over|Under|\d+\+|To\s+Score|Anytime))/i);
    return m ? m[1].trim() : null;
  }

  // Any ticket that is already fully graded (SETTLED) has nothing left to track live --
  // its players/props are excluded from the Player Cheat Sheet entirely so settled legs
  // (e.g. a player whose game already ended) don't linger as "zombie" cards on the board.
  // This generalizes what used to be a one-off hardcoded exclusion list for Thursday
  // night's fulfilled players (Kyren Williams, Mike Evans, Quentin Lake, Deommodore
  // Lenoir, Fred Warner) -- any newly-settled ticket now auto-clears the same way.

  // Extract unique players and their props
  const playerPropsMap = new Map();
  for (const bet of wagers) {
    if (bet.status === 'SETTLED') continue;
    for (const leg of bet.legs || []) {
      const pName = leg.player || extractPlayerFromSelection(leg.selection);
      if (pName) {
        if (!playerPropsMap.has(pName)) {
          playerPropsMap.set(pName, {
            id: pName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: pName,
            team: leg.team || '',
            props: []
          });
        }
        const entry = playerPropsMap.get(pName);
        const propKey = leg.key || `stat_${entry.id}_${leg.market}`;
        if (!entry.props.some(p => p.key === propKey)) {
          entry.props.push({
            key: propKey,
            legKey: leg.key || propKey,
            market: leg.market,
            line: leg.line ?? 0,
            selection: leg.selection,
            status: leg.status || null,
            actualStat: (leg.actual_stat ?? null),
            ticketId: bet.id,
            ticketLabel: bet.game_title || bet.game || bet.id,
            target: leg.line ?? (leg.selection?.match(/(\d+(\.\d+)?)/)?.[1] ? parseFloat(leg.selection.match(/(\d+(\.\d+)?)/)[1]) : 1)
          });
        }
      }
    }
  }

  // Map players to tickets they belong to and their fellow teammates
  const playerTicketMap = {};
  for (const bet of wagers) {
    const legs = bet.legs || [];
    const playerLegs = legs.filter(l => l.player || extractPlayerFromSelection(l.selection));
    const playerNamesOnTicket = Array.from(new Set(playerLegs.map(l => l.player || extractPlayerFromSelection(l.selection)).filter(Boolean)));

    for (const pName of playerNamesOnTicket) {
      if (!playerTicketMap[pName]) {
        playerTicketMap[pName] = [];
      }
      const teammates = playerNamesOnTicket.filter(n => n !== pName);
      playerTicketMap[pName].push({
        ticketId: bet.id,
        ticketName: bet.game_title || bet.game,
        book: bet.book,
        payout: bet.potential_payout_usd || 0,
        isSettledLoss: bet.status === 'SETTLED' && bet.result === 'loss',
        teammates,
        legs: legs.map(l => ({
          key: l.key,
          player: l.player || extractPlayerFromSelection(l.selection),
          selection: l.selection,
          status: l.status
        }))
      });
    }
  }

  const playersList = Array.from(playerPropsMap.values());
  for (const p of playersList) {
    let bestKickoff = 9999999999999;
    let bestKickoffShort = 'TBD';
    for (const bet of wagers) {
      for (const leg of bet.legs || []) {
        const lpName = leg.player || extractPlayerFromSelection(leg.selection);
        if (lpName === p.name) {
          const kInfo = getLegKickoffTime(leg, weekSchedule);
          if (kInfo.timestamp < bestKickoff) {
            bestKickoff = kInfo.timestamp;
            bestKickoffShort = kInfo.shortText;
          }
        }
      }
    }
    p.kickoffTimestamp = bestKickoff;
    p.kickoffShort = bestKickoffShort;
    p.ticketInfo = playerTicketMap[p.name] || [];
  }
  playersList.sort((a, b) => {
    const kickA = a.kickoffTimestamp || 9999999999999;
    const kickB = b.kickoffTimestamp || 9999999999999;
    if (kickA !== kickB) return kickA - kickB;
    return (a.name || '').localeCompare(b.name || '');
  });

  // A ticket counts as a prop parlay when it has multiple legs and at least one
  // is a player prop. Legs on sides/totals tickets carry no `player`, so the
  // named-player test separates them cleanly; the market fallback mirrors the
  // isPropLeg check in renderCard(). The multi-leg guard keeps straight futures
  // (e.g. a single-leg Super Bowl ticket, also categorised "Future/Prop") out.
  const NON_PROP_MARKETS = ['spread', 'moneyline', 'total', 'team_total', 'open_slot'];
  function isPropParlay(bet) {
    const legs = Array.isArray(bet.legs) ? bet.legs : [];
    if (legs.length < 2) return false;
    return legs.some(l => l && (l.player || (l.market && !NON_PROP_MARKETS.includes(String(l.market).toLowerCase()))));
  }
  // Prop legs settle in-game, so Andy watches them live: float those tickets to
  // the top of each grid. Partitioning (rather than sorting) keeps the existing
  // relative order inside both groups.
  function propParlaysFirst(list) {
    return [...list.filter(isPropParlay), ...list.filter(b => !isPropParlay(b))];
  }

  const burntWagers = propParlaysFirst(wagers.filter(w => w.status === 'SETTLED' && (w.result === 'loss' || w.result === 'LOST')));
  const cashedWagers = propParlaysFirst(wagers.filter(w => w.status === 'SETTLED' && (w.result === 'win' || w.result === 'WON')));
  const liveWagers = propParlaysFirst(wagers.filter(w => w.status !== 'SETTLED'));
  const settledWagers = burntWagers;

  const FUTURES_MARKET_LABELS = {
    superbowl: 'Super Bowl Winner',
    superbowl_matchup: 'Super Bowl Exact Matchup',
    wins: 'Season Win Total',
    playoffs: 'Make Playoffs',
    division: 'Division Winner',
    conference: 'Conference Winner',
    mvp: 'MVP',
    other: 'Futures',
  };

  function normalizeFuturesTicketStatus(raw) {
    const s = String(raw || '').toLowerCase();
    if (s === 'won' || s === 'win') return 'won';
    if (s === 'lost' || s === 'loss') return 'lost';
    if (s === 'void' || s === 'voided' || s === 'push') return 'void';
    return 'pending';
  }

  // Normalize a data/official-picks/user-placed-wagers-2026.json entry (game === 'NFL Futures')
  // into the same shape as a ledger position ticket, so both sources can be grouped together.
  function parseFuturesWagerToTicket(w) {
    const ticketType = (w.ticket_type || '').toLowerCase();
    let market = 'other';
    if (ticketType.includes('matchup')) market = 'superbowl_matchup';
    else if (ticketType.includes('super bowl')) market = 'superbowl';
    else if (ticketType.includes('playoff')) market = 'playoffs';
    else if (ticketType.includes('win total') || ticketType.includes('wins')) market = 'wins';
    else if (ticketType.includes('division')) market = 'division';
    else if (ticketType.includes('conference')) market = 'conference';
    else if (ticketType.includes('mvp')) market = 'mvp';

    let selection = w.game_title || w.game || 'Unknown';
    const dashIdx = selection.lastIndexOf(' - ');
    if (dashIdx !== -1) selection = selection.slice(dashIdx + 3).trim();

    return {
      market,
      selection,
      ticket: {
        source: 'wagers_json',
        ticket_number: w.book_ticket_number || w.ticket_number || w.id,
        accepted_date: w.date || (w.placed_at ? String(w.placed_at).slice(0, 10) : null),
        stake_usd: w.is_promo_credit ? (w.promo_credit_stake_usd ?? 0) : (w.cash_risk_usd ?? w.stake_usd ?? 0),
        price: w.odds_american,
        to_win_usd: w.potential_profit_usd ?? 0,
        book: w.book,
        status: w.status === 'SETTLED'
          ? normalizeFuturesTicketStatus(w.result)
          : 'pending',
      },
    };
  }

  // Normalize an andy-portfolio-ledger-2026.json position into one or more tickets
  // (a position may already list several individual tickets under `tickets[]`, or be a
  // single flattened ticket at the top level).
  function parseFuturesLedgerPosition(p) {
    const rawTickets = Array.isArray(p.tickets) && p.tickets.length > 0
      ? p.tickets
      : [{
          ticket_number: p.ticket_number,
          accepted_date: p.accepted_date,
          stake_usd: p.stake_usd ?? p.current_stake_usd,
          price: p.price ?? p.blended_price,
          to_win_usd: p.to_win_usd,
          result_status: p.result_status,
        }];
    return rawTickets.map(t => ({
      market: p.market || 'other',
      selection: p.selection || p.id || 'Unknown',
      ticket: {
        source: 'ledger',
        ticket_number: t.ticket_number,
        accepted_date: t.accepted_date,
        stake_usd: t.stake_usd ?? 0,
        price: t.price,
        to_win_usd: t.to_win_usd ?? 0,
        book: p.book,
        status: normalizeFuturesTicketStatus(t.result_status),
      },
    }));
  }

  let futuresLedgerPositions = [];
  try {
    const rawLedger = await readFile(FUTURES_LEDGER_PATH, 'utf8');
    const ledger = JSON.parse(rawLedger);
    futuresLedgerPositions = Array.isArray(ledger.positions) ? ledger.positions : [];
  } catch {
    console.warn(`⚠️ Warning: futures ledger not found at ${FUTURES_LEDGER_PATH}, showing wagers-file futures only.`);
  }

  const rawFuturesItems = [
    ...futuresWagers.map(parseFuturesWagerToTicket),
    ...futuresLedgerPositions.flatMap(parseFuturesLedgerPosition),
  ];

  const futuresGroupMap = new Map();
  for (const item of rawFuturesItems) {
    const groupKey = `${item.market}::${String(item.selection).toLowerCase().trim()}`;
    if (!futuresGroupMap.has(groupKey)) {
      futuresGroupMap.set(groupKey, { market: item.market, selection: item.selection, tickets: [] });
    }
    futuresGroupMap.get(groupKey).tickets.push(item.ticket);
  }

  const futuresGroups = Array.from(futuresGroupMap.values()).map(group => {
    const activeTickets = group.tickets.filter(t => t.status === 'pending');
    const wonTickets = group.tickets.filter(t => t.status === 'won');
    const lostTickets = group.tickets.filter(t => t.status === 'lost');
    const activeStake = activeTickets.reduce((sum, t) => sum + (t.stake_usd || 0), 0);
    const activeToWin = activeTickets.reduce((sum, t) => sum + (t.to_win_usd || 0), 0);
    let groupStatus = 'pending';
    if (wonTickets.length > 0) groupStatus = 'won';
    else if (activeTickets.length === 0 && lostTickets.length === group.tickets.length) groupStatus = 'lost';
    return {
      ...group,
      marketLabel: FUTURES_MARKET_LABELS[group.market] || FUTURES_MARKET_LABELS.other,
      tickets: group.tickets.sort((a, b) => String(a.accepted_date || '').localeCompare(String(b.accepted_date || ''))),
      ticketCount: group.tickets.length,
      activeStake,
      activeToWin,
      status: groupStatus,
    };
  }).sort((a, b) => b.activeToWin - a.activeToWin);

  const futuresLive = futuresGroups.filter(g => g.status === 'pending' || (g.status === 'won' && g.activeStake > 0));
  const futuresResolved = futuresGroups.filter(g => g.status !== 'pending');
  const futuresStakedTotal = futuresGroups.reduce((sum, g) => sum + g.activeStake, 0);
  const futuresPotentialTotal = futuresGroups.reduce((sum, g) => sum + g.activeToWin, 0);

  let futuresPriceWatchList = [];
  try {
    futuresPriceWatchList = await buildFuturesPriceWatch();
  } catch (err) {
    console.warn(`\u26a0\ufe0f Warning: could not build futures price watch: ${err.message}`);
  }

  // Full team names for the Futures Portfolio "group by team" collapsible sections.
  // Keyed by the same abbreviations TEAM_MAP already normalizes to.
  const ABBR_TO_TEAM_NAME = {
    ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills',
    CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns',
    DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers',
    HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs',
    LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins',
    MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants',
    NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers',
    SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders',
  };
  const FUTURES_TEAM_MATCH_KEYS = Object.keys(TEAM_MAP).sort((a, b) => b.length - a.length);

  // Scans a futures group's free-text selection (and market label) for any NFL team names
  // it mentions, so the Futures Portfolio can group cards by team. A Super Bowl matchup
  // future (e.g. "Green Bay Packers vs Buffalo Bills") mentions two teams and is filed
  // under both -- that position is genuinely exposure to both sides. A future with no
  // team mentioned (e.g. an MVP future naming only a player) falls back to "Other".
  function detectFuturesTeams(text) {
    const upper = String(text || '').toUpperCase();
    const found = [];
    for (const key of FUTURES_TEAM_MATCH_KEYS) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('\\b' + escaped + '\\b');
      if (re.test(upper)) {
        const abbr = TEAM_MAP[key];
        if (!found.includes(abbr)) found.push(abbr);
      }
    }
    return found;
  }

  // Buckets an array of futures group cards (already deduped by market+selection) into
  // per-team collapsible sections, sorted by combined active to-win. Any group that
  // mentions no recognizable team lands in a trailing "Other / Multi-Team" bucket.
  function groupFuturesByTeam(groups) {
    const buckets = new Map();
    const otherBucket = { teamAbbr: null, teamName: 'Other / Multi-Team', groups: [], activeStake: 0, activeToWin: 0, ticketCount: 0 };
    for (const g of groups) {
      const teams = detectFuturesTeams(`${g.selection} ${g.marketLabel}`);
      if (teams.length === 0) {
        otherBucket.groups.push(g);
        otherBucket.activeStake += g.activeStake;
        otherBucket.activeToWin += g.activeToWin;
        otherBucket.ticketCount += g.ticketCount;
        continue;
      }
      for (const abbr of teams) {
        if (!buckets.has(abbr)) {
          buckets.set(abbr, { teamAbbr: abbr, teamName: ABBR_TO_TEAM_NAME[abbr] || abbr, groups: [], activeStake: 0, activeToWin: 0, ticketCount: 0 });
        }
        const b = buckets.get(abbr);
        b.groups.push(g);
        b.activeStake += g.activeStake;
        b.activeToWin += g.activeToWin;
        b.ticketCount += g.ticketCount;
      }
    }
    const result = Array.from(buckets.values()).sort((a, b) => (b.activeToWin - a.activeToWin) || (b.activeStake - a.activeStake));
    if (otherBucket.groups.length > 0) result.push(otherBucket);
    return result;
  }

  // ── FUTURES PRICE WATCH (monitor-only -- teams Andy is NOT buying yet, watched for a
  // price dip before entering) ───────────────────────────────────────────────────────────
  // Reads data/futures-imports/price-watch-list-2026.json for which teams/markets to
  // watch, then reconstructs a price history for each from every dated per-book snapshot
  // file already sitting in data/futures-imports/ (bookmaker-YYYY-MM-DD.json,
  // betonline-YYYY-MM-DD.json, betus-YYYY-MM-DD.json -- the same files the rest of the
  // futures pipeline already produces). No new data source or credentials needed: this is
  // pure re-derivation from history that's already being captured. It refreshes every time
  // the tracker is regenerated, the same way the rest of the board does.
  async function buildFuturesPriceWatch() {
    let watchConfig;
    try {
      const raw = await readFile(PRICE_WATCH_LIST_PATH, 'utf8');
      watchConfig = JSON.parse(raw);
    } catch {
      return [];
    }
    const items = Array.isArray(watchConfig.items) ? watchConfig.items : [];
    if (items.length === 0) return [];

    const bookPolicy = watchConfig.book_policy || {};

    let dirEntries = [];
    try {
      dirEntries = await readdir(FUTURES_IMPORTS_DIR);
    } catch {
      return [];
    }
    const SNAPSHOT_FILE_RE = /^(bookmaker|betonline|betus)-(\d{4}-\d{2}-\d{2})\.json$/;
    const snapshotFiles = dirEntries
      .map(name => {
        const m = name.match(SNAPSHOT_FILE_RE);
        return m ? { name, book: m[1], date: m[2] } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));

    // rowsByBookMarket[book][market_type] = [{ date, team, odds, impliedProb }, ...]
    const rowsByBookMarket = {};
    for (const sf of snapshotFiles) {
      let parsed;
      try {
        parsed = JSON.parse(await readFile(path.join(FUTURES_IMPORTS_DIR, sf.name), 'utf8'));
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;
      for (const row of parsed) {
        if (!row || !row.market_type || !row.team) continue;
        const bookKey = row.book || sf.book;
        if (!rowsByBookMarket[bookKey]) rowsByBookMarket[bookKey] = {};
        if (!rowsByBookMarket[bookKey][row.market_type]) rowsByBookMarket[bookKey][row.market_type] = [];
        const oddsNum = typeof row.odds === 'number' ? row.odds : parseFloat(row.odds);
        const probNum = typeof row.implied_prob === 'number' ? row.implied_prob : parseFloat(row.implied_prob);
        if (isNaN(oddsNum) || isNaN(probNum)) continue;
        rowsByBookMarket[bookKey][row.market_type].push({ date: sf.date, team: row.team, odds: oddsNum, impliedProb: probNum });
      }
    }

    // One team-in-a-market's history within a single book: first tracked vs. most recent,
    // and the relative drop in implied probability between them -- the actual "price dip"
    // (a falling implied probability means the payout for the same $1 has gotten bigger,
    // i.e. the price has gotten cheaper to buy into). Returns null if that book has no
    // snapshots at all for this team/market.
    function buildTrend(book, marketType, teamMatch) {
      const rows = (rowsByBookMarket[book]?.[marketType] || [])
        .filter(r => teamMatch(r.team))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (rows.length === 0) return null;
      const first = rows[0];
      const last = rows[rows.length - 1];
      const dipPct = first.impliedProb > 0 ? ((first.impliedProb - last.impliedProb) / first.impliedProb) * 100 : 0;
      return {
        book,
        snapshotCount: rows.length,
        firstDate: first.date,
        firstOdds: first.odds,
        firstProb: first.impliedProb,
        lastDate: last.date,
        lastOdds: last.odds,
        lastProb: last.impliedProb,
        dipPct,
      };
    }

    const teamNameLc = (name) => String(name || '').toLowerCase();

    return items.map(item => {
      const teamLc = teamNameLc(item.team);
      const threshold = item.dipThresholdPct || 25;
      const markets = Array.isArray(item.markets) ? item.markets : [];

      const sbWinBooks = bookPolicy.superbowl || ['bookmaker', 'betonline'];
      const exactaBooks = bookPolicy.superbowl_matchup || ['betus', 'bookmaker'];

      let sbWinTrends = [];
      if (markets.includes('superbowl')) {
        sbWinTrends = sbWinBooks
          .map(book => buildTrend(book, 'superbowl', t => teamNameLc(t) === teamLc))
          .filter(Boolean);
      }

      let exactaRows = [];
      if (markets.includes('superbowl_matchup')) {
        const pairingSet = new Set();
        for (const book of exactaBooks) {
          for (const r of (rowsByBookMarket[book]?.superbowl_matchup || [])) {
            if (teamNameLc(r.team).includes(teamLc)) pairingSet.add(r.team);
          }
        }
        exactaRows = Array.from(pairingSet).map(matchupTeam => {
          const opponent = matchupTeam.replace(item.team, '').replace(/\bvs\b/i, '').trim();
          // Prefer whichever allowed book has the longer/older history for this specific
          // pairing (an earlier first-tracked date gives a more meaningful baseline).
          const trendsByBook = exactaBooks
            .map(book => buildTrend(book, 'superbowl_matchup', t => t === matchupTeam))
            .filter(Boolean)
            .sort((a, b) => a.firstDate.localeCompare(b.firstDate));
          const primary = trendsByBook[0] || null;
          return { matchup: matchupTeam, opponent, primary, allBooks: trendsByBook };
        }).filter(row => row.primary)
          .sort((a, b) => (b.primary.dipPct ?? -Infinity) - (a.primary.dipPct ?? -Infinity));
      }

      return {
        id: item.id,
        team: item.team,
        teamAbbr: item.teamAbbr,
        note: item.note || '',
        dipThresholdPct: threshold,
        sbWinTrends,
        exactaRows,
      };
    });
  }

  function formatAmericanOdds(n) {
    if (n === null || n === undefined || isNaN(n)) return '\u2014';
    return n > 0 ? `+${Math.round(n)}` : `${Math.round(n)}`;
  }

  const BOOK_DISPLAY_NAME = { bookmaker: 'Bookmaker.eu', betonline: 'BetOnline', betus: 'BetUS' };

  function renderPriceWatchTrendRow(trend, label) {
    if (!trend) {
      return `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:#64748B; padding:4px 0;"><span>${label}</span><span>No history yet</span></div>`;
    }
    const isDip = trend.dipPct >= 0;
    const color = trend.dipPct >= 20 ? '#10B981' : (isDip ? '#6EE7B7' : '#F87171');
    const arrow = isDip ? '\u25BC' : '\u25B2';
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:0.72rem; color:#CBD5E1; padding:4px 0; border-bottom:1px solid rgba(148,163,184,0.08); flex-wrap:wrap;">
        <span style="color:#94A3B8;">${label}</span>
        <span style="white-space:nowrap;">
          ${formatAmericanOdds(trend.firstOdds)} <span style="color:#64748B;">(${trend.firstDate})</span>
          &rarr; ${formatAmericanOdds(trend.lastOdds)} <span style="color:#64748B;">(${trend.lastDate})</span>
          <strong style="color:${color}; margin-left:6px;">${arrow} ${Math.abs(trend.dipPct).toFixed(1)}%</strong>
        </span>
      </div>
    `;
  }

  function renderFuturesPriceWatchTeam(watch) {
    const threshold = watch.dipThresholdPct;
    const biggestDip = Math.max(
      0,
      ...watch.sbWinTrends.map(t => t.dipPct),
      ...watch.exactaRows.map(r => r.primary?.dipPct ?? -Infinity)
    );
    const hasDipAlert = biggestDip >= threshold;
    const dipBadge = hasDipAlert
      ? `<span style="background:rgba(16,185,129,0.2); color:#10B981; border:1px solid rgba(16,185,129,0.4); font-weight:800; font-size:0.65rem; padding:3px 8px; border-radius:4px; text-transform:uppercase;">\ud83d\udce9 Dip Alert &ge; ${threshold}%</span>`
      : `<span style="background:rgba(148,163,184,0.12); color:#94A3B8; border:1px solid rgba(148,163,184,0.25); font-weight:700; font-size:0.65rem; padding:3px 8px; border-radius:4px; text-transform:uppercase;">Watching</span>`;

    const exactaRowsHtml = watch.exactaRows.map(row => {
      const p = row.primary;
      const bookLabel = `${row.opponent} \u2022 ${BOOK_DISPLAY_NAME[p.book] || p.book}`;
      return renderPriceWatchTrendRow(p, bookLabel);
    }).join('\n');

    return `
      <details class="ff-starters-details futures-price-watch-details" style="margin-bottom:12px; background:rgba(15,23,42,0.4); border:1px solid #1E293B; border-radius:8px; padding:10px 12px;" open>
        <summary style="font-size:0.8rem; color:#60A5FA; cursor:pointer; font-weight:800; user-select:none; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <span style="display:flex; align-items:center; gap:6px;">
            <span class="ff-details-arrow" style="font-size:0.75rem; color:#60A5FA; display:inline-block; transition:transform 0.15s ease;">\u25B6</span>
            \ud83d\udcc9 ${watch.team} \u2014 Price Watch (Not Bought Yet)
          </span>
          ${dipBadge}
        </summary>
        ${watch.note ? `<div style="font-size:0.7rem; color:#64748B; margin-top:6px; margin-bottom:8px;">${escapeHtml(watch.note)}</div>` : ''}
        ${watch.sbWinTrends.length > 0 ? `
          <div style="margin-top:6px;">
            <div style="font-size:0.68rem; font-weight:800; color:#94A3B8; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:2px;">SB Win</div>
            ${watch.sbWinTrends.map(t => renderPriceWatchTrendRow(t, BOOK_DISPLAY_NAME[t.book] || t.book)).join('\n')}
          </div>
        ` : ''}
        ${watch.exactaRows.length > 0 ? `
          <div style="margin-top:10px;">
            <div style="font-size:0.68rem; font-weight:800; color:#94A3B8; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:2px;">Exacta Matchup (${watch.exactaRows.length} pairings, biggest movers first)</div>
            <div style="max-height:260px; overflow-y:auto; padding-right:4px;">
              ${exactaRowsHtml}
            </div>
          </div>
        ` : ''}
      </details>
    `;
  }

  function renderFuturesPriceWatchSection(watchList) {
    if (!watchList || watchList.length === 0) return '';
    return `
      <div class="tickets-section-header" style="margin-bottom:6px;">
        <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
          <span style="font-size:0.82rem; font-weight:800; letter-spacing:0.5px; color:#F8FAFC; text-transform:uppercase;">
            \ud83d\udcc9 Price Watch
          </span>
          <span style="font-size:0.75rem; color:#94A3B8;">Monitor-only -- not positions. Tracks SB Win &amp; Exacta Matchup price history and flags a team once its price has dipped past its alert threshold.</span>
        </div>
      </div>
      ${watchList.map(watch => renderFuturesPriceWatchTeam(watch)).join('\n')}
    `;
  }

  function renderFuturesGroupCard(group) {
    const statusBadge = group.status === 'won'
      ? '<span style="background:rgba(16,185,129,0.2); color:#10B981; border:1px solid rgba(16,185,129,0.4); font-weight:800; font-size:0.65rem; padding:3px 8px; border-radius:4px; text-transform:uppercase;">WON</span>'
      : group.status === 'lost'
        ? '<span style="background:rgba(248,113,113,0.15); color:#F87171; border:1px solid rgba(248,113,113,0.4); font-weight:800; font-size:0.65rem; padding:3px 8px; border-radius:4px; text-transform:uppercase;">LOST</span>'
        : '<span style="background:rgba(16,185,129,0.2); color:#10B981; border:1px solid rgba(16,185,129,0.4); font-weight:800; font-size:0.65rem; padding:3px 8px; border-radius:4px; text-transform:uppercase;">ACTIVE</span>';

    const ticketRows = group.tickets.map(t => {
      const priceNum = typeof t.price === 'string' ? parseInt(t.price.replace(/^\+/, ''), 10) : t.price;
      const priceStr = (priceNum === null || priceNum === undefined || Number.isNaN(priceNum)) ? '—' : (priceNum > 0 ? `+${priceNum}` : `${priceNum}`);
      const rowColor = t.status === 'won' ? 'var(--accent-green)' : t.status === 'lost' ? '#F87171' : '#F8FAFC';
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid rgba(148,163,184,0.12); font-size:0.76rem; flex-wrap:wrap;">
          <div style="color:#CBD5E1;">
            <strong style="color:#F8FAFC;">#${t.ticket_number || '—'}</strong>${t.book ? ` • ${t.book}` : ''}${t.accepted_date ? ` • ${t.accepted_date}` : ''}
          </div>
          <div style="text-align:right; color:#94A3B8; white-space:nowrap;">
            $${(t.stake_usd || 0).toFixed(2)} @ ${priceStr} → <strong style="color:${rowColor};">$${(t.to_win_usd || 0).toFixed(2)}</strong>
            <span style="margin-left:6px; text-transform:uppercase; font-size:0.62rem; letter-spacing:0.4px; color:${rowColor};">${t.status}</span>
          </div>
        </div>
      `;
    }).join('\n');

    return `
      <div class="card" style="background:#0F172A; border:1px solid #1E293B; border-radius:10px; padding:14px; display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <div>
            <div style="font-weight:800; font-size:0.92rem; color:#F8FAFC;">${group.selection}</div>
            <div style="font-size:0.72rem; color:#94A3B8; margin-top:2px;">${group.marketLabel} • ${group.ticketCount} ticket${group.ticketCount === 1 ? '' : 's'}</div>
          </div>
          ${statusBadge}
        </div>
        <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.78rem;">
          <span style="color:#94A3B8;">Combined Active Stake: <strong style="color:#F8FAFC;">$${group.activeStake.toFixed(2)}</strong></span>
          <span style="color:#94A3B8;">Combined Active To-Win: <strong style="color:var(--accent-green);">$${group.activeToWin.toFixed(2)}</strong></span>
        </div>
        <div>
          ${ticketRows}
        </div>
      </div>
    `;
  }

  // Renders a set of team buckets (from groupFuturesByTeam) as collapsible <details>
  // sections, one per team, each containing that team's futures cards in a normal grid.
  // Reuses the fantasy-lineup collapsible styling/classes (ff-starters-details /
  // ff-details-arrow) so no new CSS is needed.
  function renderFuturesTeamSections(teamBuckets, idPrefix) {
    if (teamBuckets.length === 0) return '';
    return teamBuckets.map((b, idx) => {
      const teamLabel = b.teamAbbr ? `${b.teamName} (${b.teamAbbr})` : b.teamName;
      return `
        <details class="ff-starters-details futures-team-details" id="futures-team-${idPrefix}-${b.teamAbbr || 'other'}" style="margin-bottom:14px; background:rgba(15,23,42,0.4); border:1px solid #1E293B; border-radius:8px; padding:10px 12px;" ${idx === 0 ? 'open' : ''}>
          <summary style="font-size:0.8rem; color:#60A5FA; cursor:pointer; font-weight:800; user-select:none; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <span style="display:flex; align-items:center; gap:6px;">
              <span class="ff-details-arrow" style="font-size:0.75rem; color:#60A5FA; display:inline-block; transition:transform 0.15s ease;">▶</span>
              🏈 ${teamLabel} • ${b.ticketCount} ticket${b.ticketCount === 1 ? '' : 's'}
            </span>
            <span style="font-size:0.7rem; color:#94A3B8; font-weight:600;">
              Stake: <strong style="color:#F8FAFC;">$${b.activeStake.toFixed(2)}</strong> &nbsp;&bull;&nbsp;
              To-Win: <strong style="color:var(--accent-green);">$${b.activeToWin.toFixed(2)}</strong>
            </span>
          </summary>
          <div class="cards-grid" style="margin-top:10px;">
            ${b.groups.map(group => renderFuturesGroupCard(group)).join('\n')}
          </div>
        </details>
      `;
    }).join('\n');
  }

  function renderCard(bet, initialStatus = 'live') {
    const isPromo = bet.is_promo_credit || bet.funding_type === 'promo_credit';
    const stake = isPromo ? (bet.promo_credit_stake_usd ?? bet.stake_usd ?? 0) : (bet.cash_risk_usd ?? bet.stake_usd ?? 0);
    const isBurntInitial = initialStatus === 'burnt' || (bet.status === 'SETTLED' && (bet.result === 'loss' || bet.result === 'LOST'));
    const isCashedInitial = initialStatus === 'cashed' || (bet.status === 'SETTLED' && (bet.result === 'win' || bet.result === 'WON'));

    let cardClass = 'bet-card';
    let progClass = 'progress-fill';
    let progStyle = '';
    if (isBurntInitial) {
      cardClass += ' burnt settled-loss';
      progClass += ' burnt';
    } else if (isCashedInitial) {
      cardClass += ' cashed settled-win';
      progClass += ' cashed';
      progStyle = 'width:100%;';
    }
    const burnBannerStyle = isBurntInitial ? 'display:flex;' : 'display:none;';
    const burntBadgeStyle = isBurntInitial ? 'display:inline-block;' : '';
    const cashedBadgeStyle = isCashedInitial ? 'display:inline-block;' : '';

    return `
          <div class="${cardClass}" id="card-${bet.id}" draggable="true" data-id="${bet.id}" data-is-promo="${isPromo}" data-is-split="${bet.is_split || false}">
            <div class="card-header">
              <div class="card-title-wrap">
                <div class="card-title">${bet.game_title || bet.game}</div>
                <div class="card-subtitle">${bet.book || 'Sportsbook'} • ${bet.ticket_type}</div>
                <div class="badges-row">
                  ${bet.is_paper
                    ? `<span class="badge badge-promo" title="Not placed. Imaginary money, excluded from all totals." style="background:rgba(168,85,247,0.18);color:#D8B4FE;border-color:rgba(168,85,247,0.5);">📝 PAPER · IMAGINARY $${(bet.stake_usd ?? 0).toFixed(0)} · NOT PLACED</span>`
                    : `<span class="badge ${isPromo ? 'badge-promo' : 'badge-cash'}">${isPromo ? '$0 CASH (PROMO)' : 'CASH'}</span>`}
                  ${bet.ticket_type?.includes('Open') ? '<span class="badge badge-open">OPEN PARLAY</span>' : ''}
                  <span class="badge badge-cash" id="badge-split-${bet.id}" style="display:none;">🤝 50/50 SPLIT</span>
                  <span class="cashed-badge"${cashedBadgeStyle ? ` style="${cashedBadgeStyle}"` : ''}>CASHED</span>
                  <span class="burnt-badge"${burntBadgeStyle ? ` style="${burntBadgeStyle}"` : ''}>BURNT</span>
                </div>
                <div class="card-bullet-summary" id="bullet-summary-${bet.id}">
                  <span class="badge ${isPromo ? 'badge-promo' : 'badge-cash'}" style="font-size:0.6rem; padding:1px 4px;">${isPromo ? '$0' : '$' + stake.toFixed(0)}</span>
                  <span id="bullet-payout-${bet.id}" style="color:var(--accent-green); font-size:0.72rem; font-weight:800;">$${(bet.potential_profit_usd ?? ((bet.potential_payout_usd || 0) - stake)).toFixed(2)}</span>
                  <span id="bullet-hits-${bet.id}" style="color:#94A3B8; font-size:0.65rem;">${(() => { const realLegs = (bet.legs || []).filter(l => l.market !== 'open_slot' && l.status !== 'OPEN'); const hits = isCashedInitial ? realLegs.length : realLegs.filter(l => l.status === 'WON').length; return hits + '/' + realLegs.length; })()} Hits</span>
                  ${isCashedInitial ? `<span class="bullet-temp-badge bullet-temp-green" id="bullet-temp-${bet.id}">🟢 Won</span>` : `<span class="bullet-temp-badge bullet-temp-pre" id="bullet-temp-${bet.id}">⚪ Upcoming</span>`}
                </div>
              </div>
              <div class="card-controls">
                <button class="btn-alejandro-toggle" id="btn-split-${bet.id}" onclick="toggleAlejandroSplit('${bet.id}')" title="Toggle 50/50 Split">🤝 Split</button>
                <button class="btn-cash-toggle${isCashedInitial ? ' active' : ''}" id="btn-cash-${bet.id}" onclick="toggleManualCash('${bet.id}')" title="Mark Won / Cashed" style="background:${isCashedInitial ? '#059669' : '#064E3B'}; border:1px solid #10B981; color:#A7F3D0; border-radius:4px; padding:2px 6px; font-size:0.68rem; font-weight:700; cursor:pointer;">🏆</button>
                <button class="btn-burn-toggle${isBurntInitial ? ' active' : ''}" id="btn-burn-${bet.id}" onclick="toggleManualBurn('${bet.id}')" title="Mark Burnt / Alive" style="background:#1E293B; border:1px solid #334155; color:#EF4444; border-radius:4px; padding:2px 6px; font-size:0.68rem; font-weight:700; cursor:pointer;">🔥</button>
                <span class="drag-handle" title="Drag to reorder">⠿</span>
                <button class="btn-card-toggle" onclick="toggleCardCollapse('${bet.id}')">⯆</button>
              </div>
            </div>

            <div class="card-body">
              <div class="burn-reason-banner" id="burn-banner-${bet.id}" style="${burnBannerStyle}">
                ${isBurntInitial ? '<span>🔥</span><strong>Concluded / Settled Loss:</strong> Ticket settled as loss.' : ''}
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:2px;">
                <span>Stake: <strong>$${stake.toFixed(2)}</strong></span>
                <span>Odds: <strong style="color:var(--accent-cyan);">${bet.odds_american || bet.price || '-'}</strong></span>
                <span>To Win: <strong class="payout-val" id="card-payout-${bet.id}" style="color:var(--accent-green);">$${(bet.potential_profit_usd ?? ((bet.potential_payout_usd || 0) - stake)).toFixed(2)}</strong></span>
              </div>
              <div class="progress-bar-wrap">
                <div class="${progClass}" id="prog-${bet.id}" style="${progStyle}"></div>
              </div>
            </div>

            ${(() => {
              const realLegsForCount = (bet.legs || []).filter(l => l.market !== 'open_slot' && l.status !== 'OPEN');
              const initialWon = realLegsForCount.filter(l => l.status === 'WON').length;
              const initialLost = realLegsForCount.filter(l => l.status === 'LOST').length;
              const initialFulfilled = initialWon + initialLost;
              const initialTotal = realLegsForCount.length;
              const initialActive = Math.max(0, initialTotal - initialFulfilled);
              let initialStripLabel = `✅ ${initialWon} Hit`;
              if (initialLost > 0) initialStripLabel += ` • 🔥 ${initialLost} Burnt`;
              initialStripLabel += ` • ${initialActive} Active • Click to toggle`;
              const stripVisible = (initialFulfilled > 0 && initialFulfilled < initialTotal);
              return `
            <div class="card-legs" id="legs-wrap-${bet.id}">
              <div class="fulfilled-legs-strip" id="minstrip-${bet.id}" onclick="toggleCardFulfilledLegs('${bet.id}')" style="display:${stripVisible ? 'flex' : 'none'};">
                <span>${initialStripLabel}</span>
                <span id="hit-arrow-${bet.id}">⯆ (Visible)</span>
              </div>`;
            })()}
              ${(bet.legs || []).map((leg, lIdx) => {
                const legKey = leg.key || `leg_${bet.id}_${lIdx + 1}`;
                const isOpenSlot = leg.market === 'open_slot' || leg.status === 'OPEN';
                const isWon = leg.status === 'WON';
                const isLost = leg.status === 'LOST';
                const isPush = leg.status === 'PUSH';
                const icon = isOpenSlot ? '⬜' : (isWon ? '✅' : (isLost ? '❌' : (isPush ? '⚖️' : '⚪')));
                const legClass = isOpenSlot ? 'leg-item leg-open-slot' : (isWon ? 'leg-item checked' : (isLost ? 'leg-item leg-missed' : (isPush ? 'leg-item leg-pushed' : 'leg-item')));

                const kInfo = getLegKickoffTime(leg, weekSchedule);
                const kickoffShort = kInfo.shortText || 'TBD';
                const kickoffTimestamp = kInfo.timestamp;
                const legTeam = leg.team || extractTeamFromLeg(leg);

                let initialPacingClass = 'pace-pre';
                let initialBadgeClass = 'badge-pacing-pre';
                let initialBadgeText = kickoffShort;

                if (isOpenSlot) {
                  initialPacingClass = 'pace-open-slot';
                  initialBadgeClass = 'badge-pacing-open-slot';
                  initialBadgeText = '⬜ Open Slot';
                } else if (isWon) {
                  initialPacingClass = 'pace-green pace-hit';
                  initialBadgeClass = 'badge-pacing-won';
                  initialBadgeText = '✅ HIT';
                } else if (isLost) {
                  initialPacingClass = 'pace-red';
                  initialBadgeClass = 'badge-pacing-lost';
                  initialBadgeText = '🔥 BURNT';
                } else if (isPush) {
                  initialPacingClass = 'pace-push';
                  initialBadgeClass = 'badge-pacing-push';
                  initialBadgeText = '⚖️ PUSH';
                } else if (kInfo.game && (kInfo.game.status === 'in' || kInfo.game.status === 'live')) {
                  initialPacingClass = 'pace-yellow';
                  initialBadgeClass = 'badge-pacing-yellow';
                  initialBadgeText = '🟡 Live';
                }

                // Filter out sportsbook names from source badges (e.g. Bovada, Bookmaker)
                const sportsbooks = new Set(['bovada', 'bookmaker', 'bookmaker.eu', 'betonline', 'draftkings', 'fanduel', 'caesars', 'betmgm', 'sportsbook']);
                const rawSource = (leg.source || leg.expert || '').trim();
                const isBook = !rawSource || sportsbooks.has(rawSource.toLowerCase()) || rawSource.toLowerCase() === (bet.book || '').toLowerCase();
                const sourceTag = !isBook ? `<span class="source-tag" title="Source: ${rawSource}">🎙️ ${rawSource}</span>` : '';

                // Player prop progress gauge
                const isPropLeg = !!(leg.player || (leg.market && !['spread', 'moneyline', 'total', 'team_total', 'open_slot'].includes(String(leg.market).toLowerCase())));
                const target = leg.line ?? (leg.selection?.match(/(\d+(\.\d+)?)/)?.[1] ? parseFloat(leg.selection.match(/(\d+(\.\d+)?)/)[1]) : 1);
                const statText = isWon ? (leg.actual_stat ? `${leg.actual_stat} / ${target} ✅` : `${target} / ${target} ✅`) : `0 / ${target}`;
                const barWidth = isWon ? '100%' : '0%';
                const barClass = isWon ? 'progress-fill cashed' : 'progress-fill';

                // Strip redundant player name from selection text if already displayed in leg.player
                let cleanSelection = leg.selection || leg.market || '';
                if (leg.player) {
                  const pLower = leg.player.toLowerCase().trim();
                  if (cleanSelection.toLowerCase().startsWith(pLower)) {
                    cleanSelection = cleanSelection.slice(leg.player.length).replace(/^[\s\-–—:•]+/, '').trim();
                  }
                }

                // Resolve game matchup label for totals & game legs
                let gameLabel = leg.game || '';
                if (!gameLabel) {
                  const schedG = findScheduleGameForLeg(leg, weekSchedule);
                  if (schedG) {
                    gameLabel = `${normalizeTeam(schedG.visitor)} @ ${normalizeTeam(schedG.home)}`;
                  }
                }
                const isTotalLeg = leg.market === 'total' || leg.market === 'team_total' || (!leg.player && /^(over|under)\b/i.test(cleanSelection));

                return `
                <div class="${legClass} ${initialPacingClass}" id="leg-${legKey}" data-key="${legKey}" data-open-slot="${isOpenSlot ? '1' : '0'}" data-player="${leg.player || ''}" data-market="${leg.market || ''}" data-target="${target}" data-team="${legTeam}" data-opp="${leg.opponent || ''}" data-line="${leg.line ?? ''}" data-selection="${escapeHtml(leg.selection || '')}" data-game="${escapeHtml(gameLabel)}" data-kickoff="${kickoffTimestamp}" data-kickoff-text="${kickoffShort}" onclick="${isOpenSlot ? '' : `toggleLeg('${legKey}', '${bet.id}')`}">
                  <div class="leg-row">
                    <div class="leg-left">
                      <span class="leg-icon">${icon}</span>
                      ${leg.player ? `
                        <span class="leg-main-label"><strong>${escapeHtml(leg.player)} • </strong>${escapeHtml(cleanSelection)}</span>
                      ` : (isTotalLeg && gameLabel ? `
                        <span class="leg-game-pill" style="background:rgba(59,130,246,0.18); color:#93C5FD; border:1px solid rgba(59,130,246,0.4); border-radius:4px; padding:1px 6px; font-size:0.63rem; font-weight:800; margin-right:5px; letter-spacing:0.5px;" title="Game Matchup">${escapeHtml(gameLabel)}</span><span class="leg-main-label"><strong>${escapeHtml(cleanSelection)}</strong></span>
                      ` : `
                        <span class="leg-main-label"><strong>${escapeHtml(cleanSelection)}</strong></span>
                      `)}
                      ${sourceTag}
                    </div>
                    <div class="leg-right" style="display:flex; align-items:center; gap:6px;">
                      <span class="leg-pace-badge ${initialBadgeClass}" id="pace-badge-${legKey}">${initialBadgeText}</span>
                      <span style="font-size:0.68rem; color:var(--text-muted);">${leg.price || ''}</span>
                      ${isOpenSlot ? '' : `<button class="btn-leg-burn" id="btn-burn-leg-${legKey}" onclick="toggleLegBurn('${legKey}', '${bet.id}', event)" title="Mark Leg Burnt / Missed">🔥</button>`}
                      ${isOpenSlot ? '' : `<button class="btn-leg-push" id="btn-push-leg-${legKey}" onclick="toggleLegPush('${legKey}', '${bet.id}', event)" title="Mark Leg Push (won't count toward the parlay)">⚖️</button>`}
                      ${(isOpenSlot || !isPropLeg) ? '' : `<button class="btn-leg-out" id="btn-out-leg-${legKey}" onclick="toggleLegOut('${legKey}', '${bet.id}', event)" title="Mark Player Out / Inactive (left the game)">🚑</button>`}
                    </div>
                  </div>
                  ${isPropLeg ? `
                  <div class="leg-prop-gauge-wrap" style="margin-top:4px; padding-left:22px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.67rem;">
                      <span style="color:var(--text-muted); font-size:0.64rem;">Stat Progress</span>
                      <span id="card-stat-${legKey}" style="font-weight:700; color:${isWon ? '#10B981' : '#CBD5E1'};">${statText}</span>
                    </div>
                    <div class="progress-bar-wrap" style="height:4px; margin-top:2px; background:#1E293B; border-radius:999px; overflow:hidden;">
                      <div class="${barClass}" id="card-bar-${legKey}" style="width:${barWidth};"></div>
                    </div>
                  </div>
                  ` : ''}
                </div>
                `;
              }).join('\n')}
            </div>
          </div>
    `;
  }

  function renderLeftSidebarGameCard(g) {
    const isPost = g.status === 'post' || g.status === 'final';
    const isLive = g.status === 'in' || g.status === 'live';
    const cardClass = 'game-mini-card' + (isLive ? ' is-live' : (isPost ? ' is-final' : ''));
    const statusBadge = isLive 
      ? `<span class="game-mini-status badge-live" id="sb-status-${g.id}">🟢 ${g.clock || 'LIVE'}</span>`
      : (isPost 
          ? `<span class="game-mini-status badge-final" id="sb-status-${g.id}">FINAL</span>`
          : `<span class="game-mini-status badge-pre" id="sb-status-${g.id}">${g.time || 'Sun'}</span>`);
    
    const awayAbbr = (g.visitor || '').toUpperCase();
    const homeAbbr = (g.home || '').toUpperCase();
    const awayScore = g.visitorScore != null ? g.visitorScore : (isPost ? 0 : '-');
    const homeScore = g.homeScore != null ? g.homeScore : (isPost ? 0 : '-');
    const awayLead = (typeof awayScore === 'number' && typeof homeScore === 'number' && awayScore > homeScore) ? ' leader' : '';
    const homeLead = (typeof awayScore === 'number' && typeof homeScore === 'number' && homeScore > awayScore) ? ' leader' : '';

    const spreadNum = typeof g.spread === 'number' ? g.spread : parseFloat(g.spread);
    let lineStr = 'Even';
    if (!isNaN(spreadNum) && spreadNum !== 0) {
      lineStr = `${homeAbbr} ${spreadNum > 0 ? '+' + spreadNum : spreadNum}`;
    }
    const totalNum = typeof g.total === 'number' ? g.total : parseFloat(g.total);
    const totalStr = (!isNaN(totalNum) && totalNum > 0) ? `O/U ${totalNum}` : '';
    const footerLine = [lineStr, totalStr].filter(Boolean).join(' • ');

    const kickoffTs = g.kickoff_utc ? new Date(g.kickoff_utc).getTime() : 9999999999999;
    return `
      <div class="${cardClass}" id="game-card-${g.id}" data-game-id="${g.id}" data-status="${isLive ? 'live' : (isPost ? 'final' : 'upcoming')}" data-kickoff="${kickoffTs}" data-away="${awayAbbr}" data-home="${homeAbbr}">
        <div class="game-mini-header">
          ${statusBadge}
          <span style="color:var(--text-muted); font-size:0.62rem;" id="sb-detail-${g.id}">${g.time ? g.time : ''}</span>
        </div>
        <div class="game-mini-teams">
          <div class="game-mini-team-row" id="sb-away-row-${g.id}">
            <div class="game-mini-team-left">
              <span class="badge-team team-${awayAbbr}">${awayAbbr}</span>
              <span style="font-weight:600; color:#E2E8F0; font-size:0.71rem;">${g.visitorName || awayAbbr}</span>
              <span class="ball-icon" id="sb-away-ball-${g.id}" style="display:none; font-size:0.65rem;">🏈</span>
            </div>
            <span class="game-mini-team-score${awayLead}" id="sb-away-score-${g.id}">${awayScore}</span>
          </div>
          <div class="game-mini-team-row" id="sb-home-row-${g.id}">
            <div class="game-mini-team-left">
              <span class="badge-team team-${homeAbbr}">${homeAbbr}</span>
              <span style="font-weight:600; color:#E2E8F0; font-size:0.71rem;">${g.homeName || homeAbbr}</span>
              <span class="ball-icon" id="sb-home-ball-${g.id}" style="display:none; font-size:0.65rem;">🏈</span>
            </div>
            <span class="game-mini-team-score${homeLead}" id="sb-home-score-${g.id}">${homeScore}</span>
          </div>
        </div>
        <div class="game-mini-situation" id="sb-situation-${g.id}" style="display:${isLive ? 'block' : 'none'}; margin-top:5px;">
          <div class="sb-situation-box" id="sb-sit-box-${g.id}">
            <div class="sb-sit-header" style="display:flex; justify-content:space-between; align-items:center; font-size:0.65rem; font-weight:700; margin-bottom:3px;">
              <span id="sb-sit-down-${g.id}" style="color:#F8FAFC;"></span>
              <span id="sb-sit-posstext-${g.id}" style="color:#38BDF8; display:flex; align-items:center; gap:3px;">
                <span id="sb-sit-arrow-${g.id}"></span> <span id="sb-sit-yard-${g.id}"></span>
              </span>
            </div>
            <div class="sb-field-bar-wrap" style="position:relative; height:13px; background:#064E3B; border-radius:3px; border:1px solid rgba(16,185,129,0.3); overflow:hidden; display:flex; align-items:center;">
              <div style="width:11%; height:100%; background:rgba(30,58,138,0.7); border-right:1px solid rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:0.52rem; font-weight:900; color:#93C5FD;" title="${awayAbbr} Endzone">
                ${awayAbbr}
              </div>
              <div style="flex:1; height:100%; position:relative; background:repeating-linear-gradient(90deg, transparent, transparent 19%, rgba(255,255,255,0.12) 20%);">
                <div style="position:absolute; left:50%; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.4);"></div>
                <div style="position:absolute; left:0; top:0; bottom:0; width:20%; background:rgba(239,68,68,0.14);"></div>
                <div style="position:absolute; right:0; top:0; bottom:0; width:20%; background:rgba(239,68,68,0.14);"></div>
                <div id="sb-ball-marker-${g.id}" style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); display:flex; align-items:center; gap:1px; z-index:2; transition:left 0.4s ease;">
                  <span id="sb-ball-arrow-left-${g.id}" style="font-size:0.52rem; color:#FACC15; display:none; line-height:1;">◀</span>
                  <span style="font-size:0.65rem; line-height:1; filter:drop-shadow(0 0 2px rgba(0,0,0,0.9));">🏈</span>
                  <span id="sb-ball-arrow-right-${g.id}" style="font-size:0.52rem; color:#FACC15; display:inline; line-height:1;">▶</span>
                </div>
              </div>
              <div style="width:11%; height:100%; background:rgba(180,83,9,0.6); border-left:1px solid rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:0.52rem; font-weight:900; color:#FDE68A;" title="${homeAbbr} Endzone">
                ${homeAbbr}
              </div>
            </div>
          </div>
        </div>
        <div class="game-mini-footer">
          <span id="sb-line-${g.id}">${footerLine}</span>
          <span id="sb-cover-${g.id}" style="color:var(--text-muted);">${(isLive || isPost) ? 'Cover: -' : ''}</span>
        </div>
      </div>
    `;
  }

  // Generate HTML Template
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏈 NFL Sunday Live Tracker • Multi-Game Board, Promo Credits & Alejandro Castro Split Ledger</title>
  <style>
    :root {
      --bg-main: #0B1120;
      --bg-card: #151F32;
      --bg-card-hover: #1C2A44;
      --border-color: #273752;
      --accent-blue: #3B82F6;
      --accent-green: #10B981;
      --accent-gold: #F59E0B;
      --accent-cyan: #38BDF8;
      --accent-purple: #818CF8;
      --accent-indigo: #4F46E5;
      --accent-red: #EF4444;
      --text-main: #F8FAFC;
      --text-muted: #94A3B8;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-main);
      color: var(--text-main);
      font-family: var(--font-family);
      line-height: 1.5;
      padding: 12px;
      max-width: 1780px;
      margin: 0 auto;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: rgba(11, 17, 32, 0.5); }
    ::-webkit-scrollbar-thumb { background: #273752; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #3B82F6; }

    /* 3-Column Master Layout */
    .app-layout {
      display: grid;
      grid-template-columns: 290px minmax(0, 1fr) 300px;
      gap: 14px;
      align-items: start;
    }

    /* Sidebars */
    .sidebar-left, .sidebar-right {
      position: sticky;
      top: 12px;
      max-height: calc(100vh - 24px);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
    }

    /* Controls Bar & Tabs */
    .controls-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .tabs-nav {
      display: flex;
      gap: 8px;
    }
    .tab-btn {
      background: #151F32;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 0.88rem;
      font-weight: 700;
      padding: 7px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tab-btn:hover {
      color: #FFFFFF;
      background: #1C2A44;
    }
    .tab-btn.active {
      color: #FFFFFF;
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    /* SuperContest Tab Styles */
    .sc-header-banner {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      border: 1px solid #334155;
      border-left: 5px solid #F59E0B;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    .sc-top5-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .sc-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
      transition: all 0.2s ease;
    }
    .sc-card:hover {
      border-color: #F59E0B;
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
    }
    .sc-card.selected-pick {
      border-color: #3B82F6;
      background: rgba(30, 58, 138, 0.25);
    }
    .sc-rank-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(245, 158, 11, 0.2);
      color: #FCD34D;
      border: 1px solid rgba(245, 158, 11, 0.4);
      text-transform: uppercase;
    }
    .sc-alternates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .sc-alt-card {
      background: #0F172A;
      border: 1px solid #1E293B;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.75rem;
      transition: all 0.15s ease;
    }
    .sc-alt-card:hover {
      border-color: #38BDF8;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
    }
    .sc-table-wrap {
      background: #0F172A;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow-x: auto;
      margin-top: 12px;
    }
    .sc-matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }
    .sc-matrix-table th {
      background: #1E293B;
      color: #94A3B8;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #334155;
    }
    .sc-matrix-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #1E293B;
      vertical-align: middle;
    }
    .sc-matrix-table tr:hover {
      background: rgba(30, 41, 59, 0.5);
    }
    .sc-cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .sc-cover-covering {
      background: rgba(16, 185, 129, 0.2);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .sc-cover-atrisk {
      background: rgba(239, 68, 68, 0.2);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .sc-cover-push {
      background: rgba(245, 158, 11, 0.2);
      color: #FCD34D;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .sc-cover-upcoming {
      background: rgba(71, 85, 105, 0.3);
      color: #CBD5E1;
      border: 1px solid rgba(71, 85, 105, 0.5);
    }
    /* Settled SuperContest pick cards (Task 2: collapsible Red/Green, matching the
       Tickets-tab cashed/burnt pattern and the Player Cheat Sheet's collapsed cards) */
    .sc-card.sc-settled-win, .sc-alt-card.sc-settled-win {
      border-color: #10B981 !important;
      background: rgba(6, 78, 59, 0.15);
    }
    .sc-card.sc-settled-loss, .sc-alt-card.sc-settled-loss {
      border-color: #EF4444 !important;
      background: linear-gradient(135deg, rgba(127, 29, 29, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%);
    }
    .sc-card.sc-settled-push, .sc-alt-card.sc-settled-push {
      border-color: #F59E0B !important;
      background: rgba(120, 53, 15, 0.12);
    }
    .sc-card.collapsed, .sc-alt-card.collapsed {
      padding: 8px 12px;
      opacity: 0.85;
      gap: 6px;
    }
    .sc-card.collapsed:hover, .sc-alt-card.collapsed:hover { opacity: 1; }
    .sc-card.collapsed > div:nth-child(2), .sc-card.collapsed > div:nth-child(3),
    .sc-alt-card.collapsed > div:nth-child(2), .sc-alt-card.collapsed > div:nth-child(3) {
      display: none !important;
    }
    .sc-team-logo {

      width: 24px;
      height: 24px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    }
    .sc-team-logo-lg {
      width: 38px;
      height: 38px;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
    }

    /* Fantasy Football Tab Styles */
    .ff-header-banner {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      border: 1px solid #334155;
      border-left: 5px solid #10B981;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    .ff-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-top: 12px;
    }
    .ff-metric-card {
      background: #0F172A;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ff-metric-label {
      font-size: 0.65rem;
      color: #94A3B8;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .ff-metric-val {
      font-size: 1.15rem;
      font-weight: 900;
      color: #F8FAFC;
    }
    .ff-league-group {
      background: #0B132B;
      border: 1px solid #1E293B;
      border-radius: 10px;
      margin-bottom: 16px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .ff-league-header {
      background: #0F172A;
      border-bottom: 1px solid #1E293B;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s ease;
    }
    .ff-league-header:hover {
      background: #1E293B;
    }
    .ff-league-body {
      padding: 12px;
    }
    .ff-league-body.collapsed {
      display: none;
    }
    .btn-league-collapse, .btn-card-toggle {
      background: transparent;
      border: 1px solid #334155;
      color: #94A3B8;
      border-radius: 4px;
      font-size: 0.72rem;
      padding: 2px 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      line-height: 1;
    }
    .btn-league-collapse:hover, .btn-card-toggle:hover {
      color: #F8FAFC;
      border-color: #64748B;
    }
    .btn-keep-toggle {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34D399;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .btn-keep-toggle:hover {
      background: rgba(16, 185, 129, 0.25);
      border-color: #10B981;
    }
    .btn-keep-toggle.is-kept {
      background: #10B981;
      color: #0F172A;
      border-color: #10B981;
    }
    .ff-bench-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 10px;
    }
    .ff-player-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      transition: all 0.2s ease;
    }
    .ff-player-card:hover {
      border-color: #38BDF8;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    }
    .ff-player-card.prime-drop {
      border-left: 4px solid #EF4444 !important;
    }
    .ff-player-card.hold-drop {
      border-left: 4px solid #F59E0B !important;
    }
    .ff-player-card.keep-drop {
      border-left: 4px solid #10B981 !important;
    }
    .ff-player-card.is-kept {
      border-left: 4px solid #10B981 !important;
      opacity: 0.88;
    }
    .ff-player-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .ff-card-body {
      transition: all 0.2s ease;
    }
    .ff-card-body.collapsed {
      display: none;
    }
    .ff-drop-badge {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .ff-drop-prime {
      background: rgba(239, 68, 68, 0.2);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .ff-drop-hold {
      background: rgba(245, 158, 11, 0.2);
      color: #FCD34D;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .ff-drop-keep {
      background: rgba(16, 185, 129, 0.2);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .ff-chip {
      font-size: 0.68rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      background: #0F172A;
      border: 1px solid #334155;
      color: #CBD5E1;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .ff-chip.needs-kicker {
      border-color: #F59E0B;
      color: #FCD34D;
      background: rgba(245, 158, 11, 0.1);
    }
    details.ff-starters-details summary::-webkit-details-marker { display: none; }
    details.ff-starters-details summary { list-style: none; }
    details.ff-starters-details[open] .ff-details-arrow {
      transform: rotate(90deg);
    }
    .ff-starters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }
    .ff-starter-card {
      background: #0B132B;
      border: 1px solid #1E293B;
      border-left: 3px solid #3B82F6;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      transition: all 0.2s ease;
    }
    .ff-starter-card:hover {
      border-color: #38BDF8;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .ff-starter-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ff-kicker-radar-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .ff-kicker-card {
      background: #0F172A;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .btn-order-arrow {
      background: #1E293B;
      border: 1px solid #334155;
      color: #94A3B8;
      border-radius: 3px;
      padding: 0 4px;
      font-size: 0.55rem;
      line-height: 1.1;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-order-arrow:hover {
      color: #38BDF8;
      border-color: #38BDF8;
      background: #0F172A;
    }
    .ff-league-group.dragging {
      opacity: 0.5;
      border: 2px dashed #38BDF8 !important;
    }
    .ff-league-group.drag-over {
      border-top: 3px solid #38BDF8 !important;
    }

    /* Player Cheat Sheet Grid & Modular Cards */
    .players-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 10px;
      align-items: start;
    }
    .player-card-block {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s ease;
      height: fit-content;
      align-self: start;
    }
    .player-card-block.fulfilled {
      border-color: #059669;
      background: rgba(6, 78, 59, 0.15);
    }
    .player-card-block.collapsed {
      padding: 8px 12px;
      background: #111827;
      opacity: 0.85;
      gap: 0;
      height: fit-content;
    }
    .player-card-block.collapsed:hover { opacity: 1; }
    .player-card-block.collapsed .player-props-detail { display: none !important; }
    .player-main-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .player-name-row {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .player-name {
      font-weight: 800;
      font-size: 0.92rem;
      color: #F8FAFC;
    }

    /* Fulfilled / Hit Legs Minimization */
    .fulfilled-legs-strip {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      padding: 4px 8px;
      margin-bottom: 6px;
      font-size: 0.68rem;
      color: #A7F3D0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .fulfilled-legs-strip:hover {
      background: rgba(16, 185, 129, 0.22);
      border-color: rgba(16, 185, 129, 0.5);
    }
    .card-legs.hide-fulfilled-legs .leg-item.checked,
    .card-legs.hide-fulfilled-legs .leg-item.leg-burnt,
    .card-legs.hide-fulfilled-legs .leg-item.leg-missed {
      display: none !important;
    }

    /* Top Ticker Header */
    .top-ticker-header {
      background: linear-gradient(135deg, #131E33 0%, #1A2845 100%);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    }
    .ticker-title-group { display: flex; align-items: center; gap: 10px; }
    .ticker-title { font-size: 1.1rem; font-weight: 800; color: #F8FAFC; letter-spacing: 0.5px; }
    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--accent-green);
      display: inline-block; animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .ticker-stats-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .ticker-box { text-align: right; }
    .ticker-label { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); }
    .ticker-val { font-size: 1.1rem; font-weight: 800; color: var(--accent-green); font-variant-numeric: tabular-nums; }
    .ticker-val.cash-risk { color: #CBD5E1; }
    .ticker-val.promo-credit { color: #A855F7; }
    .ticker-val.potential { color: var(--accent-cyan); }

    .btn-action {
      background: #1E293B; color: #E2E8F0; border: 1px solid #334155;
      padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;
    }
    .btn-action:hover { background: #334155; color: #FFFFFF; }

    /* 3-Cards-Wide Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    @media (max-width: 1400px) { .cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 900px) { .app-layout { grid-template-columns: 1fr; } .cards-grid { grid-template-columns: 1fr; } }

    /* Card Styling */
    .bet-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      transition: transform 0.15s, border-color 0.15s;
    }
    .bet-card:hover { border-color: #3B82F6; }
    .bet-card.cashed { border-color: var(--accent-green); background: #0E2A20; }
    .bet-card.burnt {
      border-color: #EF4444 !important;
      background: linear-gradient(135deg, rgba(127, 29, 29, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%) !important;
    }
    .burnt-badge {
      display: none;
      font-size: 0.62rem;
      background: #B91C1C;
      color: #FEE2E2;
      border: 1px solid #EF4444;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .bet-card.burnt .burnt-badge { display: inline-flex !important; }
    .bet-card.burnt .payout-val { text-decoration: line-through; color: #EF4444 !important; opacity: 0.7; }
    .cashed-badge {
      display: none;
      font-size: 0.62rem;
      background: #065F46;
      color: #A7F3D0;
      border: 1px solid #10B981;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .bet-card.cashed .cashed-badge { display: inline-flex !important; }
    .btn-cash-toggle.active {
      background: #059669 !important;
      border-color: #10B981 !important;
      color: #FFFFFF !important;
    }
    .cashed-divider-line {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 22px 0 12px 0;
    }
    .cashed-divider-line .divider-stripe {
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 0.05));
      border-radius: 2px;
    }
    .cashed-divider-line .divider-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.74rem;
      font-weight: 800;
      color: #A7F3D0;
      background: rgba(6, 78, 59, 0.45);
      border: 1px solid rgba(16, 185, 129, 0.7);
      padding: 4px 14px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 0 14px rgba(16, 185, 129, 0.25);
    }
    .burn-reason-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #EF4444;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.68rem;
      color: #FCA5A5;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      line-height: 1.35;
    }
    .burnt-divider-line {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 22px 0 12px 0;
    }
    .burnt-divider-line .divider-stripe {
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 0.05));
      border-radius: 2px;
    }
    .burnt-divider-line .divider-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.74rem;
      font-weight: 800;
      color: #FCA5A5;
      background: rgba(127, 29, 29, 0.45);
      border: 1px solid rgba(239, 68, 68, 0.7);
      padding: 4px 14px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.25);
    }
    .tickets-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .live-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
      animation: livePulse 2s infinite;
      display: inline-block;
    }
    @keyframes livePulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.6; }
    }
    .filter-toggle-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
      font-size: 0.75rem;
      font-weight: 700;
      color: #FCA5A5;
      cursor: pointer;
      user-select: none;
      padding: 4px 8px;
      border-radius: 6px;
      background: rgba(127, 29, 29, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      transition: all 0.15s ease;
    }
    .filter-toggle-label:hover {
      background: rgba(127, 29, 29, 0.35);
      border-color: rgba(239, 68, 68, 0.7);
    }
    .filter-toggle-label input[type="checkbox"] {
      accent-color: #EF4444;
      cursor: pointer;
    }
    .empty-slips-msg {
      padding: 24px;
      text-align: center;
      background: #0F172A;
      border: 1px dashed #334155;
      border-radius: 8px;
      color: #94A3B8;
      font-size: 0.8rem;
      margin-bottom: 14px;
    }

    /* Concluded & Fulfilled Players Divider */
    .concluded-divider-line {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 16px 0 10px 0;
    }
    .concluded-divider-line .divider-stripe {
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 0.05));
      border-radius: 2px;
    }
    .concluded-divider-line .divider-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      color: #A7F3D0;
      background: rgba(6, 78, 59, 0.5);
      border: 1px solid rgba(16, 185, 129, 0.7);
      padding: 3px 12px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 0 14px rgba(16, 185, 129, 0.25);
    }

    /* Missed Props divider (settled/final but did not hit) — visually distinct red variant */
    .missed-divider-stripe {
      background: linear-gradient(90deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 0.05)) !important;
    }
    .missed-divider-label {
      color: #FCA5A5 !important;
      background: rgba(69, 10, 10, 0.5) !important;
      border: 1px solid rgba(239, 68, 68, 0.7) !important;
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.25) !important;
    }

    /* Action Buttons (Global Refresh & Archive) */
    .btn-global-refresh {
      background: rgba(8, 145, 178, 0.2);
      border-color: rgba(6, 182, 212, 0.6);
      color: #A5F3FC;
    }
    .btn-global-refresh:hover {
      background: rgba(8, 145, 178, 0.4);
      border-color: #22D3EE;
      color: #ECFEFF;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.35);
    }
    .btn-global-refresh.spinning .spin-icon {
      display: inline-block;
      animation: spinRefresh 0.75s linear infinite;
    }
    @keyframes spinRefresh {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .btn-settle-action {
      background: rgba(16, 185, 129, 0.2);
      border-color: rgba(5, 150, 105, 0.6);
      color: #A7F3D0;
      font-weight: 700;
    }
    .btn-settle-action:hover {
      background: rgba(16, 185, 129, 0.4);
      border-color: #34D399;
      color: #ECFDF5;
      box-shadow: 0 0 10px rgba(52, 211, 153, 0.4);
    }

    .btn-archive-action {
      background: rgba(124, 58, 237, 0.2);
      border-color: rgba(167, 139, 250, 0.6);
      color: #DDD6FE;
    }
    .btn-archive-action:hover {
      background: rgba(124, 58, 237, 0.4);
      border-color: #C4B5FD;
      color: #FFFFFF;
      box-shadow: 0 0 10px rgba(167, 139, 250, 0.35);
    }

    /* Source Attribution Tags */
    .source-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.62rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: #93C5FD;
      cursor: help;
      transition: all 0.15s ease;
      white-space: nowrap;
      margin-left: 6px;
      flex-shrink: 0;
    }
    .source-tag:hover {
      background: #1E293B;
      border-color: #60A5FA;
      color: #BFDBFE;
      box-shadow: 0 0 8px rgba(96, 165, 250, 0.3);
    }

    /* Performance & Archive Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .modal-card {
      background: #0B132B;
      border: 1px solid #334155;
      border-radius: 12px;
      width: 100%;
      max-width: 840px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);
    }
    .modal-header {
      padding: 14px 18px;
      border-bottom: 1px solid #1E293B;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      color: #94A3B8;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .modal-close-btn:hover { color: #FFF; background: #1E293B; }
    .modal-body { padding: 18px; overflow-y: auto; }
    .archive-metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    @media (max-width: 600px) {
      .archive-metrics-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .archive-metric-card {
      background: #0F172A;
      border: 1px solid #1E293B;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .archive-metric-card .metric-label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
    .archive-metric-card .metric-val { font-size: 1.05rem; font-weight: 800; color: #F8FAFC; margin-top: 3px; }

    /* Toast notification */
    .toast-notification {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1E293B;
      border: 1px solid #38BDF8;
      color: #F8FAFC;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      z-index: 2000;
      animation: toastFade 3s forwards;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    @keyframes toastFade {
      0% { opacity: 0; transform: translateY(12px); }
      10% { opacity: 1; transform: translateY(0); }
      85% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-8px); }
    }
    /* Collapsed Bullet Card Styling */
    .bet-card.collapsed {
      min-height: 0;
      padding: 6px 12px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    }
    .bet-card.collapsed .card-body,
    .bet-card.collapsed .card-legs,
    .bet-card.collapsed .card-subtitle,
    .bet-card.collapsed .badges-row,
    .bet-card.collapsed .btn-alejandro-toggle,
    .bet-card.collapsed .btn-burn-toggle,
    .bet-card.collapsed .drag-handle {
      display: none !important;
    }
    .bet-card.collapsed .card-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 0;
      margin: 0;
    }
    .bet-card.collapsed .card-title-wrap {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }
    .bet-card.collapsed .card-title {
      font-size: 0.8rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 220px;
    }
    .card-bullet-summary {
      display: none;
      align-items: center;
      gap: 6px;
      font-size: 0.68rem;
      font-weight: 700;
    }
    .bet-card.collapsed .card-bullet-summary {
      display: flex;
    }
    .bullet-temp-badge {
      font-size: 0.62rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .bullet-temp-green {
      background: rgba(16, 185, 129, 0.2);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.5);
    }
    .bullet-temp-red {
      background: rgba(239, 68, 68, 0.2);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.5);
      animation: pulseRisk 2s infinite;
    }
    .bullet-temp-yellow {
      background: rgba(245, 158, 11, 0.2);
      color: #FBBF24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .bullet-temp-pre {
      background: #1E293B;
      color: #94A3B8;
      border: 1px solid #334155;
    }
    .bet-card.collapsed.temp-green {
      border-left: 5px solid #10B981 !important;
      border-color: rgba(16, 185, 129, 0.45);
      background: rgba(16, 185, 129, 0.05);
    }
    .bet-card.collapsed.temp-red {
      border-left: 5px solid #EF4444 !important;
      border-color: rgba(239, 68, 68, 0.45);
      background: rgba(239, 68, 68, 0.06);
    }
    .bet-card.collapsed.temp-yellow {
      border-left: 5px solid #F59E0B !important;
      border-color: rgba(245, 158, 11, 0.4);
      background: rgba(245, 158, 11, 0.05);
    }
    .bet-card.collapsed.temp-pre {
      border-left: 5px solid #475569 !important;
      border-color: #1E293B;
    }
    .bet-card.dragging, .player-box-card.dragging { opacity: 0.45; border: 2px dashed var(--accent-blue) !important; }
    .bet-card.drag-over, .player-box-card.drag-over { border-top: 3px solid var(--accent-blue) !important; }
    .player-box-card.collapsed .player-props-detail { display: none; }
    .btn-player-toggle { background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; padding: 0 4px; }
    .btn-player-toggle:hover { color: #FFF; }
    .alejandro-chip { background: #1E1B4B; border: 1px solid #4338CA; border-radius: 6px; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 0.7rem; }
    .settle-table { width: 100%; border-collapse: collapse; font-size: 0.68rem; margin-top: 6px; }
    .settle-table th, .settle-table td { padding: 4px 6px; border-bottom: 1px solid #1E293B; text-align: left; }
    .settle-table th { color: var(--text-muted); font-size: 0.62rem; text-transform: uppercase; }

    .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
    .card-title-wrap { display: flex; flex-direction: column; gap: 2px; }
    .card-title { font-size: 0.88rem; font-weight: 700; color: #F8FAFC; }
    .card-subtitle { font-size: 0.7rem; color: var(--text-muted); }

    .badges-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
    .badge { font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .badge-cash { background: #1E293B; color: #E2E8F0; }
    .badge-promo { background: #581C87; color: #E9D5FF; border: 1px solid #9333EA; }
    .badge-alejandro { background: #4338CA; color: #E0E7FF; }
    .badge-open { background: #065F46; color: #A7F3D0; }

    .card-controls { display: flex; align-items: center; gap: 4px; }
    .drag-handle { cursor: grab; color: var(--text-muted); padding: 2px 4px; font-size: 0.8rem; }
    .btn-card-toggle { background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.8rem; padding: 2px; }
    .btn-card-toggle:hover { color: #FFF; }

    .btn-alejandro-toggle {
      background: #1E1B4B; color: #C7D2FE; border: 1px solid #4338CA;
      font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; cursor: pointer;
    }
    .btn-alejandro-toggle.active { background: #4F46E5; color: #FFFFFF; }

    /* Legs List */
    .card-legs { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
    .leg-item {
      background: #0F172A; border: 1px solid #1E293B; border-radius: 6px; padding: 6px 8px;
      display: flex; flex-direction: column; align-items: stretch; font-size: 0.75rem;
      cursor: pointer; user-select: none; gap: 2px;
    }
    .leg-item:hover { background: #1E293B; }
    .leg-item.checked { border-color: var(--accent-green); background: rgba(16, 185, 129, 0.1); }
    .leg-item.checked .leg-icon { color: var(--accent-green); }
    .leg-item.leg-missed { border-color: #EF4444; background: rgba(239, 68, 68, 0.1); }
    .leg-item.leg-missed .leg-icon { color: #EF4444; }
    .leg-item.leg-burnt {
      border-color: #EF4444 !important;
      border-left: 4px solid #EF4444 !important;
      background: rgba(239, 68, 68, 0.12) !important;
    }
    .leg-item.leg-burnt .leg-icon { color: #EF4444 !important; }
    .leg-item.leg-out {
      border-color: #8B5CF6 !important;
      border-left: 4px solid #8B5CF6 !important;
      background: rgba(139, 92, 246, 0.12) !important;
    }
    .leg-item.leg-out .leg-icon { color: #8B5CF6 !important; }
    .leg-item.leg-open-slot {
      border-color: #334155 !important;
      background: rgba(100, 116, 139, 0.06) !important;
      opacity: 0.65;
      cursor: default;
    }
    .leg-item.leg-open-slot:hover { background: rgba(100, 116, 139, 0.06) !important; }
    .leg-item.leg-open-slot .leg-icon { color: #64748B !important; }

    .btn-leg-burn {
      background: #1E293B;
      border: 1px solid #334155;
      color: #94A3B8;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 0.65rem;
      line-height: 1.2;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn-leg-burn:hover {
      background: #334155;
      color: #EF4444;
      border-color: #EF4444;
    }
    .btn-leg-burn.active, .leg-item.leg-burnt .btn-leg-burn {
      background: rgba(239, 68, 68, 0.25);
      color: #EF4444;
      border-color: #EF4444;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
    }
    .btn-leg-push {
      background: #1E293B;
      border: 1px solid #334155;
      color: #94A3B8;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 0.65rem;
      line-height: 1.2;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn-leg-push:hover {
      background: #334155;
      color: #D97706;
      border-color: #92400E;
    }
    .btn-leg-push.active, .leg-item.pace-push .btn-leg-push, .leg-item.leg-pushed .btn-leg-push {
      background: rgba(146, 64, 14, 0.3);
      color: #D97706;
      border-color: #92400E;
      box-shadow: 0 0 6px rgba(146, 64, 14, 0.4);
    }
    .btn-leg-out {
      background: #1E293B;
      border: 1px solid #334155;
      color: #94A3B8;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 0.65rem;
      line-height: 1.2;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn-leg-out:hover {
      background: #334155;
      color: #8B5CF6;
      border-color: #8B5CF6;
    }
    .btn-leg-out.active, .leg-item.leg-out .btn-leg-out {
      background: rgba(139, 92, 246, 0.25);
      color: #8B5CF6;
      border-color: #8B5CF6;
      box-shadow: 0 0 6px rgba(139, 92, 246, 0.4);
    }

    /* Player Cheat Sheet — per-leg Hit/Burn toggle rows */
    .sub-gauge-item {
      padding: 3px 4px;
      border-radius: 4px;
      border: 1px solid transparent;
      transition: all 0.15s;
    }
    .sub-gauge-item:hover { background: rgba(148, 163, 184, 0.08); }
    .sub-gauge-item.sg-hit {
      border-color: rgba(16, 185, 129, 0.5);
      background: rgba(16, 185, 129, 0.08);
    }
    .sub-gauge-item.sg-burnt {
      border-color: rgba(239, 68, 68, 0.5);
      background: rgba(239, 68, 68, 0.08);
    }
    .sub-gauge-item.sg-burnt .btn-leg-burn, .sub-gauge-item .btn-leg-burn.active {
      background: rgba(239, 68, 68, 0.25);
      color: #EF4444;
      border-color: #EF4444;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
    }
    .sub-gauge-item.sg-out {
      border-color: rgba(139, 92, 246, 0.5);
      background: rgba(139, 92, 246, 0.08);
    }
    .sub-gauge-item.sg-out .btn-leg-out, .sub-gauge-item .btn-leg-out.active {
      background: rgba(139, 92, 246, 0.25);
      color: #8B5CF6;
      border-color: #8B5CF6;
      box-shadow: 0 0 6px rgba(139, 92, 246, 0.4);
    }

    /* Live Pacing & Risk Grades */
    .leg-item.pace-green {
      border-color: rgba(16, 185, 129, 0.45);
      border-left: 4px solid #10B981;
      background: rgba(16, 185, 129, 0.07);
    }
    .leg-item.pace-red {
      border-color: rgba(239, 68, 68, 0.5);
      border-left: 4px solid #EF4444;
      background: rgba(239, 68, 68, 0.09);
    }
    .leg-item.pace-yellow {
      border-color: rgba(245, 158, 11, 0.4);
      border-left: 4px solid #F59E0B;
      background: rgba(245, 158, 11, 0.06);
    }
    .leg-item.pace-pre {
      border-left: 4px solid #475569;
    }
    .leg-item.pace-hit, .leg-item.checked {
      border-color: var(--accent-green);
      border-left: 4px solid #10B981;
      background: rgba(16, 185, 129, 0.12);
    }
    .leg-item.pace-push, .leg-item.leg-pushed {
      border-color: rgba(146, 64, 14, 0.55) !important;
      border-left: 4px solid #92400E !important;
      background: rgba(146, 64, 14, 0.14) !important;
    }
    .leg-item.pace-push .leg-icon, .leg-item.leg-pushed .leg-icon { color: #D97706 !important; }

    .leg-time-pill {
      font-size: 0.62rem;
      font-weight: 700;
      color: #94A3B8;
      background: #0B1120;
      border: 1px solid #334155;
      padding: 1px 5px;
      border-radius: 4px;
      white-space: nowrap;
      display: inline-block;
    }

    .leg-pace-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.64rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .badge-pacing-green {
      background: rgba(16, 185, 129, 0.18);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .badge-pacing-red {
      background: rgba(239, 68, 68, 0.2);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.45);
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.2);
      animation: pulseRisk 2.2s infinite ease-in-out;
    }
    .badge-pacing-yellow {
      background: rgba(245, 158, 11, 0.18);
      color: #FBBF24;
      border: 1px solid rgba(245, 158, 11, 0.35);
    }
    .badge-pacing-pre {
      background: #1E293B;
      color: #94A3B8;
      border: 1px solid #334155;
    }
    .badge-pacing-won {
      background: rgba(16, 185, 129, 0.25);
      color: #10B981;
      border: 1px solid #10B981;
      font-weight: 800;
    }
    .badge-pacing-lost {
      background: rgba(239, 68, 68, 0.25);
      color: #EF4444;
      border: 1px solid #EF4444;
      font-weight: 800;
    }
    .badge-pacing-out {
      background: rgba(139, 92, 246, 0.18);
      color: #C4B5FD;
      border: 1px solid rgba(139, 92, 246, 0.5);
    }
    .badge-pacing-push {
      background: rgba(146, 64, 14, 0.28);
      color: #D97706;
      border: 1px solid #92400E;
      font-weight: 800;
    }
    .badge-pacing-open-slot {
      background: rgba(100, 116, 139, 0.15);
      color: #94A3B8;
      border: 1px solid #475569;
      font-style: italic;
    }

    @keyframes pulseRisk {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.82; transform: scale(0.98); }
    }

    .leg-row { display: flex; flex-wrap: wrap; row-gap: 4px; justify-content: space-between; align-items: center; width: 100%; min-width: 0; }
    .leg-left { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; min-width: 0; flex: 1 1 200px; overflow: visible; }
    .leg-left > span { min-width: 0; }
    .leg-left > span.leg-main-label { flex: 1 1 140px; overflow: visible; white-space: normal; word-break: break-word; line-height: 1.35; }
    .leg-right { flex-shrink: 0; margin-left: auto; }
    .leg-icon { font-size: 0.85rem; color: var(--text-muted); flex-shrink: 0; }

    /* Progress bar */
    .progress-bar-wrap { background: #1E293B; border-radius: 999px; height: 6px; overflow: hidden; margin-top: 4px; }
    .progress-fill { background: var(--accent-blue); height: 100%; width: 0%; transition: width 0.3s; }
    .progress-fill.cashed { background: var(--accent-green); }

    /* Filter Bar */
    .filter-bar {
      display: flex; gap: 6px; align-items: center; flex-wrap: wrap; background: #131E33;
      padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.72rem;
    }
    .filter-btn {
      background: #1E293B; color: #CBD5E1; border: 1px solid #334155; padding: 3px 8px;
      border-radius: 4px; cursor: pointer; font-size: 0.72rem;
    }
    .filter-btn.active { background: var(--accent-blue); color: #FFF; border-color: var(--accent-blue); }

    /* Left Sidebar: Sunday Multi-Game Board & Live Trackers */
    .scoreboard-filter-bar {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
      background: #0B1120;
      padding: 4px;
      border-radius: 6px;
      border: 1px solid #1E293B;
    }
    .sb-filter-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.65rem;
      font-weight: 700;
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .sb-filter-btn:hover {
      background: #1E293B;
      color: #F8FAFC;
    }
    .sb-filter-btn.active {
      background: var(--accent-blue);
      color: #FFFFFF;
    }
    .game-mini-card {
      background: #0F172A;
      border: 1px solid #1E293B;
      border-radius: 8px;
      padding: 8px;
      font-size: 0.72rem;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color 0.2s, background 0.2s;
      position: relative;
    }
    .game-mini-card:hover {
      background: #151F32;
      border-color: #334155;
    }
    .game-mini-card.is-live {
      border-color: rgba(16, 185, 129, 0.6);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.15);
    }
    .game-mini-card.is-final {
      opacity: 0.85;
      border-color: #1E293B;
    }
    .game-mini-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.66rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 4px;
    }
    .game-mini-status {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 700;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 0.62rem;
    }
    .badge-live {
      background: rgba(16, 185, 129, 0.2);
      color: #10B981;
      border: 1px solid rgba(16, 185, 129, 0.4);
      animation: pulse-live 2s infinite ease-in-out;
    }
    @keyframes pulse-live {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.65; }
    }
    .badge-final {
      background: #1E293B;
      color: var(--text-muted);
      border: 1px solid #334155;
    }
    .badge-pre {
      background: #1E293B;
      color: var(--accent-cyan);
      border: 1px solid #334155;
    }
    .game-mini-teams {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .game-mini-team-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .game-mini-team-row.has-ball {
      background: rgba(59, 130, 246, 0.12);
    }
    .game-mini-team-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .game-mini-team-score {
      font-size: 0.85rem;
      font-weight: 800;
      color: #F8FAFC;
    }
    .game-mini-team-score.leader {
      color: #10B981;
    }
    .game-mini-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.64rem;
      color: var(--text-muted);
      background: rgba(0, 0, 0, 0.25);
      padding: 3px 6px;
      border-radius: 4px;
      margin-top: 2px;
    }
    .game-mini-situation {
      font-size: 0.63rem;
      color: var(--accent-cyan);
      font-weight: 600;
    }

    /* NFL Team Badges (32 Teams) */
    .badge-team {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .team-ARI { background: #97233F; color: #fff; }
    .team-ATL { background: #A71930; color: #fff; }
    .team-BAL { background: #241773; color: #fff; }
    .team-BUF { background: #00338D; color: #fff; }
    .team-CAR { background: #0085CA; color: #fff; }
    .team-CHI { background: #0B162A; color: #C83803; border: 1px solid #C83803; }
    .team-CIN { background: #FB4F14; color: #000; font-weight: 900; }
    .team-CLE { background: #311D00; color: #FF3C00; }
    .team-DAL { background: #003594; color: #fff; }
    .team-DEN { background: #FB4F14; color: #002244; }
    .team-DET { background: #0076B6; color: #B0B7BC; }
    .team-GB  { background: #203731; color: #FFB612; }
    .team-HOU { background: #03202F; color: #A71930; }
    .team-IND { background: #002C5F; color: #fff; }
    .team-JAX { background: #006778; color: #D7A22A; }
    .team-KC  { background: #E31837; color: #FFB81C; }
    .team-LV  { background: #000000; color: #A5ACAF; border: 1px solid #A5ACAF; }
    .team-LAC { background: #0080C6; color: #FFC20E; }
    .team-LAR { background: #003594; color: #FFA300; }
    .team-MIA { background: #008E97; color: #FC4C02; }
    .team-MIN { background: #4F2683; color: #FFC62F; }
    .team-NE  { background: #002244; color: #C60C30; }
    .team-NO  { background: #D3BC8D; color: #101820; font-weight: 900; }
    .team-NYG { background: #0B2265; color: #fff; }
    .team-NYJ { background: #125740; color: #fff; }
    .team-PHI { background: #004C54; color: #A5ACAF; }
    .team-PIT { background: #101820; color: #FFB612; }
    .team-SF  { background: #AA0000; color: #B3995D; }
    .team-SEA { background: #002244; color: #69BE28; }
    .team-TB  { background: #D50A0A; color: #0A0A08; }
    .team-TEN { background: #0C2340; color: #4B92DB; }
    .team-WAS { background: #5A1414; color: #FFB612; }

    /* Sidebar Boxes */
    .sidebar-box {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px;
      padding: 10px; display: flex; flex-direction: column; gap: 8px; font-size: 0.75rem;
    }
    .sidebar-box-title { font-size: 0.82rem; font-weight: 800; color: #E2E8F0; display: flex; justify-content: space-between; align-items: center; }

    /* Alejandro Ledger Sidebar */
    .alejandro-bill-badge {
      background: linear-gradient(135deg, #312E81 0%, #1E1B4B 100%);
      border: 1px solid #4F46E5; border-radius: 8px; padding: 8px 10px; text-align: center;
      display: flex; flex-direction: column; gap: 2px;
    }
    .alejandro-bill-badge strong { font-size: 1.05rem; color: #FCD34D; }

    .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 2px 0; border-bottom: 1px solid #1E293B; }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { color: var(--text-muted); }
    .stat-val { font-weight: 700; color: #F8FAFC; }

    /* History Drawer */
    .history-drawer { display: none; background: #0F172A; border: 1px solid #334155; border-radius: 6px; padding: 6px; margin-top: 6px; }
    .history-drawer.open { display: flex; flex-direction: column; gap: 6px; }
  </style>
</head>
<body>

  <!-- TOP SUMMARY TICKER -->
  <header class="top-ticker-header">
    <div class="ticker-title-group">
      <span class="pulse-dot"></span>
      <span class="ticker-title">🏈 NFL Sunday Live Tracker • Week ${week}</span>
      <span style="font-size:0.75rem; color:var(--text-muted);">| Dual ESPN Live Polling (15s)</span>
    </div>

    <div class="ticker-stats-row">
      <div class="ticker-box">
        <div class="ticker-label">Cash Risk</div>
        <div class="ticker-val cash-risk" id="total-cash-risk">$${totalCashRisk.toFixed(2)}</div>
      </div>
      <div class="ticker-box">
        <div class="ticker-label">Promo Credit</div>
        <div class="ticker-val promo-credit" id="total-promo-risk">$${totalPromoRisk.toFixed(2)}</div>
      </div>
      <div class="ticker-box">
        <div class="ticker-label">Potential Win</div>
        <div class="ticker-val potential" id="total-potential-payout">$${totalPotentialPayout.toFixed(2)}</div>
      </div>
      <div class="ticker-box">
        <div class="ticker-label">Total Cashed</div>
        <div class="ticker-val" id="total-cashed-val" style="color:var(--accent-green);">$0.00</div>
      </div>
      <button class="btn-action" onclick="fetchLiveScoreboard()">
        ⏱️ (<span id="refresh-countdown">15</span>s)
      </button>
      <button class="btn-action btn-global-refresh" id="btn-global-refresh" onclick="triggerGlobalRefresh()" title="Global Refresh: Re-fetch ESPN scores &amp; sync board">
        <span class="spin-icon">🔄</span> Global Refresh
      </button>
      <button class="btn-action" onclick="resetAll()">Reset</button>
      <button class="btn-action" onclick="saveCustomLayoutManually()" title="Save custom Ticketboard card arrangement so it persists across refreshes">
        💾 Save Layout
      </button>
      <button class="btn-action btn-settle-action" id="btn-grade-settle" onclick="gradeAndSettleSlate()" title="Grade all completed player props &amp; game wagers, lock in official P&amp;L and settle Alejandro balance">
        🏁 Grade &amp; Settle Slate
      </button>
      <button class="btn-action" id="btn-perf-drawer" onclick="toggleArchiveDrawer()" title="View Performance History">
        📈 History (<span id="archive-count-badge">0</span>)
      </button>
    </div>
  </header>

  <div class="app-layout" style="margin-top: 12px;">

    <!-- LEFT SIDEBAR: Sunday Multi-Game Slate Board -->
    <aside class="sidebar-left">
      <div class="sidebar-box">
        <div class="sidebar-box-title">
          <span>📅 Sunday Game Board</span>
          <span style="font-size:0.65rem; color:var(--text-muted);" id="sb-header-count">${weekSchedule.length} Games</span>
        </div>
        <div class="scoreboard-filter-bar">
          <button class="sb-filter-btn active" id="sb-filter-all" onclick="filterLeftSidebarGames('all')">All (<span id="sb-count-all">${weekSchedule.length}</span>)</button>
          <button class="sb-filter-btn" id="sb-filter-live" onclick="filterLeftSidebarGames('live')">🟢 Live (<span id="sb-count-live">${weekSchedule.filter(g => g.status === 'in' || g.status === 'live').length}</span>)</button>
          <button class="sb-filter-btn" id="sb-filter-upcoming" onclick="filterLeftSidebarGames('upcoming')">Upcoming (<span id="sb-count-upcoming">${weekSchedule.filter(g => g.status !== 'post' && g.status !== 'final' && g.status !== 'in' && g.status !== 'live').length}</span>)</button>
          <button class="sb-filter-btn" id="sb-filter-final" onclick="filterLeftSidebarGames('final')">Final (<span id="sb-count-final">${weekSchedule.filter(g => g.status === 'post' || g.status === 'final').length}</span>)</button>
        </div>
        <div id="scoreboard-container" style="display:flex; flex-direction:column; gap:8px;">
          ${[...weekSchedule].sort((a, b) => {
            const isLiveA = (a.status === 'in' || a.status === 'live') ? 0 : ((a.status === 'post' || a.status === 'final') ? 2 : 1);
            const isLiveB = (b.status === 'in' || b.status === 'live') ? 0 : ((b.status === 'post' || b.status === 'final') ? 2 : 1);
            if (isLiveA !== isLiveB) return isLiveA - isLiveB;
            const tA = a.kickoff_utc ? new Date(a.kickoff_utc).getTime() : 9999999999999;
            const tB = b.kickoff_utc ? new Date(b.kickoff_utc).getTime() : 9999999999999;
            return tA - tB;
          }).map(renderLeftSidebarGameCard).join('\n')}
        </div>
      </div>
    </aside>

    <!-- CENTER CONTENT: Tabs Bar & Tab Views -->
    <main class="main-content">
      <!-- Navigation Tabs (Ticketboard & Player Cheat Sheet) -->
      <div class="controls-bar">
        <div class="tabs-nav">
          <button class="tab-btn active" id="tab-btn-tickets" onclick="showTab('tickets')">
            🎫 Live Ticketboard (<span id="tab-live-count">${liveWagers.length}</span> Active)
          </button>
          <button class="tab-btn" id="tab-btn-players" onclick="showTab('players')">
            ⚡ Player Cheat Sheet &amp; Gauges (<span id="tab-player-count">${playersList.length}</span> Players)
          </button>
          <button class="tab-btn" id="tab-btn-supercontest" onclick="showTab('supercontest')">
            🏆 SuperContest (Top 5 &amp; 16-Game Matrix)
          </button>
          <button class="tab-btn" id="tab-btn-fantasy" onclick="showTab('fantasy')">
            🏈 Fantasy Football (<span id="tab-fantasy-kicker-alert" style="color:#F59E0B; font-weight:800;">${fantasyData.leaguesNeedingKicker || 0} Drop Alerts</span>)
          </button>
          <button class="tab-btn" id="tab-btn-futures" onclick="showTab('futures')">
            📈 Futures Portfolio (<span id="tab-futures-count">${futuresLive.length}</span> Active)
          </button>
        </div>
      </div>

      <!-- TAB 1: TICKETS VIEW (3 CARDS WIDE) -->
      <div id="tab-tickets-wrap">
        <div class="filter-bar">
          <span>Filter Wagers:</span>
          <button class="filter-btn active" onclick="setFilter('all')">All (${wagers.length})</button>
          <button class="filter-btn" onclick="setFilter('cash')">Cash</button>
          <button class="filter-btn" onclick="setFilter('promo')">Promo Credits</button>
          <button class="filter-btn" onclick="setFilter('alejandro')">🤝 Alejandro Castro Split</button>
          <button class="filter-btn" onclick="setFilter('pending')">Pending</button>
          <button class="filter-btn" id="tfilter-cashed" onclick="setFilter('cashed')">🏆 Cashed (<span id="tfilter-cashed-count">${cashedWagers.length}</span>)</button>
          <button class="filter-btn" id="tfilter-burnt" onclick="setFilter('burnt')">🔥 Burnt (<span id="tfilter-burnt-count">${burntWagers.length}</span>)</button>
          <button class="filter-btn" onclick="toggleAllTickets(false)">Collapse All</button>
          <button class="filter-btn" onclick="toggleAllTickets(true)">Expand All</button>
          <label class="filter-toggle-label" style="color:#A7F3D0; border-color:rgba(16,185,129,0.4);">
            <input type="checkbox" id="chk-hide-cashed" onchange="toggleHideCashed(this.checked)">
            <span>🏆 Hide Cashed (<span id="chk-cashed-count">${cashedWagers.length}</span>)</span>
          </label>
          <label class="filter-toggle-label">
            <input type="checkbox" id="chk-hide-burnt" onchange="toggleHideBurnt(this.checked)">
            <span>🔥 Hide Burnt (<span id="chk-burnt-count">${burntWagers.length}</span>)</span>
          </label>
          <label class="filter-toggle-label" style="color:#93C5FD; border-color:rgba(59,130,246,0.4);">
            <input type="checkbox" id="chk-hide-fulfilled-legs" onchange="toggleHideFulfilledLegs(this.checked)">
            <span>⚡ Minimize Hit &amp; Burnt Legs</span>
          </label>
          <label class="filter-toggle-label" style="color:#C4B5FD; border-color:rgba(139,92,246,0.4);">
            <input type="checkbox" id="chk-hide-injured-legs" onchange="toggleHideInjuredLegs(this.checked)">
            <span>🚑 Hide Injured Legs</span>
          </label>
          <button class="filter-btn" id="btn-clear-settled" onclick="toggleClearSettled()" style="color:#FCA5A5; border-color:rgba(239,68,68,0.4);" title="Clear settled / concluded slips from the active board (preserved in History)">
            🧹 Clear Settled
          </button>
          <button class="filter-btn" id="btn-add-slip" onclick="openAddSlipModal()" style="color:#A7F3D0; border-color:rgba(16,185,129,0.4); font-weight:700;" title="Add new wagers built for Sunday and beyond">
            ➕ Add Sunday Slip
          </button>
        </div>

        <!-- LIVE ACTIVE SECTION HEADER -->
        <div class="tickets-section-header" id="live-section-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="live-indicator-dot"></span>
            <span style="font-size:0.82rem; font-weight:800; letter-spacing:0.5px; color:#F8FAFC; text-transform:uppercase;">
              ⚡ Live Active Slips (<span id="live-slips-count">${liveWagers.length}</span> Live)
            </span>
          </div>
        </div>

        <div class="cards-grid" id="cards-grid">
          ${liveWagers.map(bet => renderCard(bet, 'live')).join('\n')}
        </div>

        <div id="live-tickets-empty" class="empty-slips-msg" style="display:${liveWagers.length === 0 ? 'block' : 'none'};">
          All active wagers have completed or burned. Check below the divider for dropped slips.
        </div>

        <!-- CASHED / SETTLED WINNERS SECTION -->
        <div id="cashed-section-wrap" style="display:${cashedWagers.length > 0 ? 'block' : 'none'};">
          <div class="cashed-divider-line" id="cashed-divider-line">
            <div class="divider-stripe"></div>
            <div class="divider-label">
              <span>🏆</span>
              <strong>CASHED / SETTLED WINNERS (<span id="cashed-section-count">${cashedWagers.length}</span>)</strong>
              <span style="font-size:0.65rem; opacity:0.85; margin-left:4px;">• WON / ARCHIVED</span>
            </div>
            <div class="divider-stripe"></div>
          </div>
          <div class="cards-grid" id="cashed-cards-grid">
            ${cashedWagers.map(bet => renderCard(bet, 'cashed')).join('\n')}
          </div>
        </div>

        <!-- BURNT / DROPPED TICKETS SECTION -->
        <div id="burnt-section-wrap" style="display:${burntWagers.length > 0 ? 'block' : 'none'};">
          <div class="burnt-divider-line" id="burnt-divider-line">
            <div class="divider-stripe"></div>
            <div class="divider-label">
              <span>🔥</span>
              <strong>BURNT / ELIMINATED SLIPS (<span id="burnt-section-count">${burntWagers.length}</span>)</strong>
              <span style="font-size:0.65rem; opacity:0.85; margin-left:4px;">• DROPPED BELOW LINE</span>
            </div>
            <div class="divider-stripe"></div>
          </div>
          <div class="cards-grid" id="burnt-cards-grid">
            ${burntWagers.map(bet => renderCard(bet, 'burnt')).join('\n')}
          </div>
        </div>
      </div>

      <!-- TAB 2: PLAYER CHEAT SHEET (MODULAR, COMPACT WHEN COLLAPSED, HIDE FULFILLED) -->
      <div id="tab-players-wrap" style="display:none;">
        <div class="filter-bar" id="players-filter-bar">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span>Filter Players:</span>
            <button class="filter-btn active" id="pfilter-all" onclick="setPlayerFilter('all')">All (<span id="count-all-players">${playersList.length}</span>)</button>
            <button class="filter-btn" id="pfilter-needs_stats" onclick="setPlayerFilter('needs_stats')">🎯 Needs Stats (<span id="count-needs-stats">${playersList.length}</span>)</button>
            <button class="filter-btn" id="pfilter-fulfilled" onclick="setPlayerFilter('fulfilled')">✅ Fulfilled (<span id="count-fulfilled">0</span>)</button>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:0.75rem; color:var(--text-muted);">Sort:</span>
            <select id="player-sort-select" onchange="setPlayerSort(this.value)" style="background:#1E293B; color:#E2E8F0; border:1px solid #334155; border-radius:6px; font-size:0.75rem; padding:4px 8px;">
              <option value="gametime" selected>🕒 Game Time (Live &amp; Early First, Final at Bottom)</option>
              <option value="needs_first">Needs Stats First (Incomplete on Top)</option>
              <option value="pct_desc">Progress % (High to Low)</option>
              <option value="name">Player Name (A-Z)</option>
              <option value="team">Team (A-Z)</option>
              <option value="custom">Custom (Drag &amp; Drop)</option>
            </select>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <button class="filter-btn" onclick="collapseFulfilledPlayers()" title="Collapse all players with 100% completed props" style="color:#A7F3D0; border-color:rgba(16,185,129,0.4);">⚡ Collapse Fulfilled</button>
            <button class="filter-btn" onclick="toggleAllPlayers(false)">Collapse All</button>
            <button class="filter-btn" onclick="toggleAllPlayers(true)">Expand All</button>
            <label class="filter-toggle-label">
              <input type="checkbox" id="chk-auto-collapse" onchange="toggleAutoCollapse(this.checked)" checked style="accent-color:#10B981;">
              <span>Auto-Collapse</span>
            </label>
            <label class="filter-toggle-label" style="color:#A7F3D0; border-color:rgba(16,185,129,0.4);">
              <input type="checkbox" id="chk-hide-fulfilled" onchange="toggleHideFulfilled(this.checked)" style="accent-color:#10B981;">
              <span>Hide Fulfilled (<span id="chk-fulfilled-count">0</span>)</span>
            </label>
          </div>
        </div>

        <div id="player-sheet-container" class="players-grid" style="margin-top:10px;">
          ${playersList.map(p => `
            <div draggable="true" 
                 class="player-box-card player-card-block" 
                 id="player-box-${p.id}" 
                 data-player-id="${p.id}"
                 data-player-name="${p.name}"
                 data-team="${p.team}"
                 data-kickoff="${p.kickoffTimestamp || 9999999999999}"
                 data-kickoff-text="${p.kickoffShort || 'TBD'}"
                 data-fulfilled="false"
                 data-progress-pct="0">
              <div class="player-main-line">
                <div class="player-name-row" style="flex-wrap:wrap;">
                  <span class="drag-handle" title="Drag to reorder player card" style="cursor:grab; font-size:0.75rem; color:var(--text-muted);">⠿</span>
                  <button class="btn-player-toggle btn-player-collapse" onclick="togglePlayerCollapse('${p.id}')">⯆</button>
                  <span class="player-name">${p.name}</span>
                  <span class="badge badge-cash">(${p.team})</span>
                  <span class="leg-time-pill" style="font-size:0.62rem;" title="Kickoff">${p.kickoffShort || 'TBD'}</span>
                  <span id="player-parlay-badge-${p.id}"></span>
                </div>
                <div style="display:flex; align-items:center; gap:4px;">
                  <span id="player-status-${p.id}" class="badge badge-cash" style="font-size:0.65rem; padding:2px 6px;">0/${p.props.length}</span>
                </div>
              </div>
              <div class="player-props-detail player-sub-gauges" style="margin-top:6px; display:flex; flex-direction:column; gap:6px;">
                ${p.props.map(pr => {
                  const prLegKey = pr.legKey || pr.key;
                  const prTicketId = pr.ticketId || '';
                  const prIsOpenSlot = pr.market === 'open_slot' || pr.status === 'OPEN';
                  const prRowClick = prIsOpenSlot ? '' : `toggleLeg('${prLegKey}', '${prTicketId}'); try { renderPlayerCheatSheetStats(latestTeamStatusMap); } catch (e) {}`;
                  const prBurnClick = prIsOpenSlot ? '' : `toggleLegBurn('${prLegKey}', '${prTicketId}', event); try { renderPlayerCheatSheetStats(latestTeamStatusMap); } catch (e) {}`;
                  return `
                  <div class="sub-gauge-item" id="subgauge-${pr.key}" data-prop-key="${pr.key}" data-leg-key="${prLegKey}" data-ticket-id="${prTicketId}" data-market="${pr.market}" data-target="${pr.target}" data-open-slot="${prIsOpenSlot ? '1' : '0'}" ${prIsOpenSlot ? '' : `onclick="${prRowClick}"`} style="cursor:${prIsOpenSlot ? 'default' : 'pointer'};">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; gap:6px;">
                      <span style="color:var(--text-muted); overflow:hidden; text-overflow:ellipsis;">${pr.selection || pr.market}${pr.ticketLabel ? ` <span style="opacity:0.55; font-size:0.62rem;">(${escapeHtml(String(pr.ticketLabel))})</span>` : ''}</span>
                      <span style="display:flex; align-items:center; gap:5px; flex-shrink:0;">
                        <span id="pstat-${pr.key}" style="font-weight:700;">0 / ${pr.target}</span>
                        ${prIsOpenSlot ? '' : `<button class="btn-leg-burn" id="pbtn-burn-leg-${pr.key}" onclick="${prBurnClick}" title="Mark Leg Burnt / Missed">🔥</button>`}
                        ${prIsOpenSlot ? '' : `<button class="btn-leg-push" id="pbtn-push-leg-${pr.key}" onclick="toggleLegPush('${pr.key}', '${prTicketId}', event)" title="Mark Leg Push">⚖️</button>`}
                        ${prIsOpenSlot ? '' : `<button class="btn-leg-out" id="pbtn-out-leg-${pr.key}" onclick="toggleLegOut('${pr.key}', '${prTicketId}', event); try { renderPlayerCheatSheetStats(latestTeamStatusMap); } catch (e) {}" title="Mark Player Out / Inactive">🚑</button>`}
                      </span>
                    </div>
                    <div class="progress-bar-wrap" style="height:5px; margin-top:2px;">
                      <div class="progress-fill" id="pbar-${pr.key}" style="width:0%;"></div>
                    </div>
                  </div>
                  `;
                }).join('\n')}
                <div class="player-parlays-wrap" id="player-parlays-${p.id}" style="margin-top:6px; border-top:1px solid #1E293B; padding-top:6px; display:flex; flex-direction:column; gap:4px;">
                  ${(p.ticketInfo || []).map(t => {
                    const teammateText = t.teammates && t.teammates.length > 0 ? 'with <strong>' + escapeHtml(t.teammates.join(', ')) + '</strong>' : 'Solo Prop';
                    return `<div style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.35); border-radius:4px; padding:3px 6px; font-size:0.65rem; color:#93C5FD; display:flex; justify-content:space-between; align-items:center;">
                      <span>🎟️ <strong>Active Parlay:</strong> ${escapeHtml(t.ticketName)} • ${teammateText}</span>
                      <span style="font-size:0.62rem; color:#34D399; font-weight:800;">$${(t.payout || 0).toFixed(0)} Pot</span>
                    </div>`;
                  }).join('\n')}
                </div>
              </div>
            </div>
          `).join('\n')}
        </div>

        <div id="live-players-empty" class="empty-slips-msg" style="display:none; font-size:0.8rem; padding:16px; margin:8px 0;">
          All player props have fulfilled or concluded.
        </div>

        <!-- Fulfilled Players (all props hit) Dropped Below Line -->
        <div id="concluded-players-section-wrap" style="display:none; margin-top:14px;">
          <div class="concluded-divider-line" id="concluded-players-divider">
            <div class="divider-stripe"></div>
            <div class="divider-label" style="font-size:0.7rem; padding:3px 10px;">
              <span>✅</span>
              <strong>FULFILLED PLAYERS (<span id="concluded-players-section-count">0</span>)</strong>
              <span style="font-size:0.65rem; opacity:0.85; margin-left:4px;">• HIT 100% OF PROPS</span>
            </div>
            <div class="divider-stripe"></div>
          </div>
          <div id="concluded-players-container" class="players-grid" style="margin-top:10px;"></div>
        </div>

        <!-- Missed / Settled-but-not-hit Players -->
        <div id="missed-players-section-wrap" style="display:none; margin-top:14px;">
          <div class="concluded-divider-line missed-divider-line" id="missed-players-divider">
            <div class="divider-stripe missed-divider-stripe"></div>
            <div class="divider-label missed-divider-label" style="font-size:0.7rem; padding:3px 10px;">
              <span>❌</span>
              <strong>MISSED PROPS — GAME FINAL (<span id="missed-players-section-count">0</span>)</strong>
              <span style="font-size:0.65rem; opacity:0.85; margin-left:4px;">• DID NOT HIT</span>
            </div>
            <div class="divider-stripe missed-divider-stripe"></div>
          </div>
          <div id="missed-players-container" class="players-grid" style="margin-top:10px;"></div>
        </div>
      </div>

      <!-- Tab 3: SuperContest Tab View -->
      <div id="tab-supercontest-wrap" style="display:none;">
        
        <!-- Header Banner & Pick Counter -->
        <div class="sc-header-banner">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.35rem;">🏆</span>
                <div>
                  <h2 style="font-size:1.1rem; font-weight:900; color:#F8FAFC; margin:0; letter-spacing:0.3px;">
                    Westgate SuperContest • Week ${week} Portfolio &amp; 16-Game Matrix
                  </h2>
                  <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">
                    Official Locked Spreads • Live DraftKings Line Movement • Free CLV Stale Line Edge • Real-Time Cover Grading
                  </div>
                </div>
              </div>
            </div>

            <!-- 5-Pick Contest Card Tracker -->
            <div style="display:flex; align-items:center; gap:12px; background:#0F172A; border:1px solid #334155; border-radius:8px; padding:8px 14px;">
              <div>
                <div style="font-size:0.65rem; color:#94A3B8; text-transform:uppercase; font-weight:700;">My Official 5-Pick Card</div>
                <div style="font-size:1.05rem; font-weight:900; color:#F59E0B;">
                  <span id="sc-card-selected-count">0</span> / 5 Picks
                </div>
              </div>
              <button class="btn-action" onclick="clearSuperContestPicks()" title="Clear Selected SuperContest Card" style="font-size:0.68rem; padding:4px 8px;">
                🧹 Clear Card
              </button>
            </div>
          </div>

          <!-- Filter Toolbar -->
          <div class="filter-bar" id="sc-filter-bar" style="margin-top:14px; margin-bottom:0; display:flex; gap:6px; flex-wrap:wrap;">
            <button class="filter-btn active" id="sc-filter-all" onclick="setSuperContestFilter('all')">
              All 16 Games (${scLines.length})
            </button>
            <button class="filter-btn" id="sc-filter-top5" onclick="setSuperContestFilter('top5')">
              ⭐ Official Top 5 Card
            </button>
            <button class="filter-btn" id="sc-filter-alts" onclick="setSuperContestFilter('alts')">
              🔄 Alternates (#6–#10)
            </button>
            <button class="filter-btn" id="sc-filter-clv" onclick="setSuperContestFilter('clv')">
              ⚡ Free CLV / Stale Lines
            </button>
            <button class="filter-btn" id="sc-filter-sunday" onclick="setSuperContestFilter('sunday')">
              🏈 Sunday Live Slate (${scMatrixList.filter(g => !g.isConcluded).length})
            </button>
            <button class="filter-btn" id="sc-filter-concluded" onclick="setSuperContestFilter('concluded')">
              ✅ Concluded (${scMatrixList.filter(g => g.isConcluded).length})
            </button>
          </div>
        </div>

        <!-- Section 1: Executive Top 5 SuperContest Card -->
        <div id="sc-top5-section-wrap" style="margin-top:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.1rem;" id="sc-top5-header-icon">${hasLockedCardFile ? '🎯' : '⭐'}</span>
              <div>
                <strong style="font-size:0.88rem; color:#F8FAFC; text-transform:uppercase; letter-spacing:0.5px;" id="sc-top5-header-title">
                  ${hasLockedCardFile ? `MY OFFICIAL LOCKED SUPERCONTEST CARD (${scTop5List.length}/5 PICKS)` : 'Official SuperContest Top 5 Portfolio (Executive Consensus Card)'}
                </strong>
                <div style="font-size:0.68rem; color:var(--text-muted);" id="sc-top5-header-sub">
                  ${hasLockedCardFile ? 'Synchronized from SuperContest Portfolio • Official Locked Lines & Real-Time ATS Cover Status' : 'Ranked by multi-show consensus weight, offensive/defensive line trench advantages, and key-number value'}
                </div>
              </div>
            </div>
            <span class="badge ${hasLockedCardFile ? 'badge-cash' : 'badge-open'}" style="font-size:0.65rem;" id="sc-top5-header-badge">${hasLockedCardFile ? `${scTop5List.length} of 5 Locked` : 'Max 5 Card Entries'}</span>
          </div>

          <div class="sc-top5-grid" id="sc-top5-container">
            ${scTop5List.map((item) => `
              <div class="sc-card${hasLockedCardFile ? ' selected-pick' : ''}" id="sc-card-${item.pickTeam}" data-team="${item.pickTeam}" data-sc-settled="${scResultByTeam[item.pickTeam] ? 'true' : 'false'}" data-sc-result="${scResultByTeam[item.pickTeam] ? scResultByTeam[item.pickTeam].result : ''}">

                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${item.pickTeam.toLowerCase()}.png" class="sc-team-logo-lg" alt="${item.pickTeam}" onerror="this.style.display='none'">
                    <div>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span class="sc-rank-badge"${hasLockedCardFile ? ' style="background:#059669; color:#ECFDF5; border:1px solid #10B981;"' : ''}>${hasLockedCardFile ? `PICK #${item.rank} LOCKED` : `#${item.rank} BEST BET`}</span>
                        <span style="font-size:0.65rem; background:#1E293B; color:#94A3B8; padding:1px 6px; border-radius:4px; font-weight:700;">${hasLockedCardFile ? 'Official Card' : `Grade: ${item.grade}`}</span>
                      </div>
                      <div style="font-size:0.95rem; font-weight:900; color:#F8FAFC; margin-top:3px;">
                        ${item.pickLabel}
                      </div>
                      <div style="font-size:0.7rem; color:var(--accent-cyan);">
                        ${item.pickTeam} ${item.isHome ? 'vs' : '@'} ${item.opponent} • Sunday Kickoff
                      </div>
                    </div>
                  </div>
                  <label style="cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px; font-size:0.65rem; color:#94A3B8; user-select:none;">
                    <input type="checkbox" class="sc-pick-checkbox" data-team="${item.pickTeam}" ${hasLockedCardFile ? 'checked ' : ''}onchange="toggleSuperContestPick('${item.pickTeam}')" style="width:18px; height:18px; cursor:pointer; accent-color:#3B82F6;">
                    <span>My Card</span>
                  </label>
                </div>

                <!-- Market & CLV Intelligence Strip -->
                <div style="background:#0F172A; border:1px solid #1E293B; border-radius:6px; padding:8px 10px; font-size:0.72rem; display:flex; flex-direction:column; gap:4px;">
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Contest Locked Line:</span>
                    <strong style="color:#FCD34D;">${item.lockedSpread}</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Live DraftKings Spread:</span>
                    <span style="color:#CBD5E1; font-weight:600;">${item.dkSpread}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">CLV &amp; Line Value:</span>
                    <span style="color:#34D399; font-weight:700;">${item.clvText}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Model Edge:</span>
                    <span style="color:var(--accent-cyan); font-weight:700;">${item.modelEdge}</span>
                  </div>
                </div>

                <!-- Rationale & Consensus Summary -->
                <div style="font-size:0.72rem; color:#CBD5E1; line-height:1.35; background:rgba(15,23,42,0.6); border-radius:6px; padding:8px;">
                  <div style="font-weight:700; color:#A5B4FC; margin-bottom:3px; font-size:0.68rem;">
                    🎯 ${item.consensus}
                  </div>
                  ${item.reason}
                </div>

                <!-- Live Game Status & ATS Margin -->
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #1E293B; padding-top:8px; margin-top:auto; cursor:pointer;" onclick="toggleScCardCollapse('${item.pickTeam}')" title="Click to collapse/expand once settled">
                  <div style="font-size:0.7rem; color:var(--text-muted);">
                    Live Score: <strong style="color:#F8FAFC;" id="sc-score-${item.pickTeam}">${scResultByTeam[item.pickTeam] ? scResultByTeam[item.pickTeam].scoreText : '-'}</strong>
                  </div>

                  <span class="sc-cover-badge ${scResultByTeam[item.pickTeam] ? scResultByTeam[item.pickTeam].badgeClass : 'sc-cover-upcoming'}" id="sc-cover-${item.pickTeam}">
                    ${scResultByTeam[item.pickTeam] ? scResultByTeam[item.pickTeam].badgeText : '🕒 Upcoming'}
                  </span>
                </div>
              </div>
            `).join('\n')}
          </div>
        </div>

        <!-- Section 2: Alternates Quick Strip (#6–#10) -->

        <div id="sc-alternates-section-wrap" style="margin-top:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.1rem;">🔄</span>
              <div>
                <strong style="font-size:0.85rem; color:#F8FAFC; text-transform:uppercase; letter-spacing:0.5px;">
                  Official Alternates (#6–#10) &amp; Stale Line Arbitrage
                </strong>
                <div style="font-size:0.68rem; color:var(--text-muted);">
                  Key-number hook protection (+3.5) &amp; steam value (-4.5 vs -5.5) for contingency swaps
                </div>
              </div>
            </div>
            <span style="font-size:0.68rem; color:var(--text-muted);">5 Alternates Available</span>
          </div>

          <div class="sc-alternates-grid" id="sc-alternates-container">
            ${scAlternatesList.map((item) => `
              <div class="sc-alt-card" id="sc-alt-${item.pickTeam}" data-team="${item.pickTeam}" data-sc-settled="${scResultByTeam[item.pickTeam] ? 'true' : 'false'}" data-sc-result="${scResultByTeam[item.pickTeam] ? scResultByTeam[item.pickTeam].result : ''}">

                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${item.pickTeam.toLowerCase()}.png" class="sc-team-logo" alt="${item.pickTeam}" onerror="this.style.display='none'">
                    <div>
                      <div style="display:flex; align-items:center; gap:4px;">
                        <span style="font-size:0.62rem; font-weight:800; background:#334155; color:#E2E8F0; padding:1px 5px; border-radius:3px;">#${item.rank}</span>
                        <strong style="font-size:0.82rem; color:#F8FAFC;">${item.pickLabel}</strong>
                      </div>
                      <div style="font-size:0.65rem; color:var(--accent-cyan);">${item.pickTeam} ${item.isHome ? 'vs' : '@'} ${item.opponent}</div>
                    </div>
                  </div>
                  <label style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:0.62rem; color:#94A3B8;">
                    <input type="checkbox" class="sc-pick-checkbox" data-team="${item.pickTeam}" onchange="toggleSuperContestPick('${item.pickTeam}')" style="accent-color:#3B82F6;">
                    <span>Pick</span>
                  </label>
                </div>

                <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:#CBD5E1; margin-top:2px;">
                  <span>Contest: <strong style="color:#FCD34D;">${item.lockedSpread}</strong></span>
                  <span style="color:#34D399; font-weight:700;">${item.clvText}</span>
                </div>

                <div style="font-size:0.68rem; color:var(--text-muted); line-height:1.2; margin-top:2px;">
                  ${item.reason}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #1E293B; padding-top:6px; margin-top:4px; cursor:pointer;" onclick="toggleScCardCollapse('${item.pickTeam}')" title="Click to collapse/expand once settled">
                  <span style="font-size:0.65rem; color:var(--text-muted);" id="sc-score-${item.pickTeam}">

                    ${scResultByTeam[item.pickTeam] ? scResultByTeam[item.pickTeam].scoreText : 'Score: -'}
                  </span>
                  <span class="sc-cover-badge ${scResultByTeam[item.pickTeam] ? scResultByTeam[item.pickTeam].badgeClass : 'sc-cover-upcoming'}" id="sc-cover-${item.pickTeam}">
                    ${scResultByTeam[item.pickTeam] ? scResultByTeam[item.pickTeam].badgeText : '🕒 Upcoming'}
                  </span>
                </div>

              </div>
            `).join('\n')}
          </div>
        </div>

        <!-- Section 3: Complete 16-Game SuperContest ATS Matrix Table -->
        <div id="sc-matrix-section-wrap" style="margin-top:22px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.1rem;">📋</span>
              <div>
                <strong style="font-size:0.88rem; color:#F8FAFC; text-transform:uppercase; letter-spacing:0.5px;">
                  Complete 16-Game SuperContest ATS Matrix (Week ${week})
                </strong>
                <div style="font-size:0.68rem; color:var(--text-muted);">
                  Locked contest lines vs Live DraftKings spreads &amp; totals with real-time Sunday grading
                </div>
              </div>
            </div>
            <span style="font-size:0.68rem; color:var(--text-muted);" id="sc-matrix-showing-count">Showing 16 Games</span>
          </div>

          <div class="sc-table-wrap">
            <table class="sc-matrix-table" id="sc-matrix-table">
              <thead>
                <tr>
                  <th style="width:40px; text-align:center;">#</th>
                  <th>Matchup &amp; Kickoff</th>
                  <th>Official Contest Spread</th>
                  <th>Live Market (DraftKings)</th>
                  <th>CLV / Stale Line Edge</th>
                  <th>Consensus &amp; Rationale</th>
                  <th style="width:90px; text-align:center;">My Card</th>
                  <th style="width:130px; text-align:center;">Live ATS Status</th>
                </tr>
              </thead>
              <tbody id="sc-matrix-tbody">
                ${scMatrixList.map((g, idx) => `
                  <tr class="sc-matrix-row" id="sc-row-${g.fav}_${g.dog}" data-fav="${g.fav}" data-dog="${g.dog}" data-is-top5="${g.isTop5}" data-is-alt="${g.isAlt}" data-has-clv="${g.clvSummary.includes('Free') || g.clvSummary.includes('Hook') || g.clvSummary.includes('pt') || g.clvSummary.includes('Steamed')}" data-is-concluded="${g.isConcluded}">
                    <td style="text-align:center; color:var(--text-muted); font-size:0.7rem; font-weight:700;">
                      ${idx + 1}
                    </td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px;">
                        <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${g.dog.toLowerCase()}.png" class="sc-team-logo" alt="${g.dog}" onerror="this.style.display='none'">
                        <span style="font-weight:700; color:#F8FAFC;">${g.awayTeam}</span>
                        <span style="color:var(--text-muted); font-size:0.7rem;">@</span>
                        <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${g.fav.toLowerCase()}.png" class="sc-team-logo" alt="${g.fav}" onerror="this.style.display='none'">
                        <span style="font-weight:700; color:#F8FAFC;">${g.homeTeam}</span>
                      </div>
                      <div style="font-size:0.65rem; color:var(--accent-cyan); margin-top:2px;">
                        ${g.kickoffDay} ${g.kickoffTime} ET ${g.isConcluded ? '• <strong style="color:#34D399;">FINAL</strong>' : ''}
                      </div>
                    </td>
                    <td>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <strong style="color:#FCD34D; font-size:0.82rem;">${g.fav} ${g.line > 0 ? '+' + g.line : g.line}</strong>
                        <span style="color:var(--text-muted); font-size:0.7rem;">vs ${g.dog} ${-g.line > 0 ? '+' + (-g.line) : -g.line}</span>
                      </div>
                      <div style="font-size:0.62rem; color:var(--text-muted);">Fixed Contest Line</div>
                    </td>
                    <td>
                      <div style="font-weight:600; color:#CBD5E1;">${g.dkSpread}</div>
                      <div style="font-size:0.65rem; color:var(--text-muted);">O/U: ${g.dkTotal}</div>
                    </td>
                    <td>
                      <span style="font-weight:700; font-size:0.72rem; ${g.clvSummary.includes('Free') || g.clvSummary.includes('Hook') || g.clvSummary.includes('Steamed') ? 'color:#34D399;' : 'color:#94A3B8;'}">
                        ${g.clvSummary}
                      </span>
                    </td>
                    <td style="max-width:240px; font-size:0.7rem; color:#CBD5E1; line-height:1.25;">
                      <div style="font-weight:700; color:#A5B4FC; font-size:0.65rem;">${g.consensus}</div>
                      ${g.reason}
                    </td>
                    <td style="text-align:center;">
                      <div style="display:flex; justify-content:center; gap:6px;">
                        <button class="btn-action sc-matrix-pick-btn" id="sc-btn-pick-${g.dog}" onclick="toggleSuperContestPick('${g.dog}')" title="Select ${g.dog} on Contest Card" style="font-size:0.62rem; padding:2px 6px;">
                          ${g.dog}
                        </button>
                        <button class="btn-action sc-matrix-pick-btn" id="sc-btn-pick-${g.fav}" onclick="toggleSuperContestPick('${g.fav}')" title="Select ${g.fav} on Contest Card" style="font-size:0.62rem; padding:2px 6px;">
                          ${g.fav}
                        </button>
                      </div>
                    </td>
                    <td style="text-align:center;">
                      ${g.isConcluded ? `
                        <div style="font-size:0.68rem; color:#F8FAFC; font-weight:700;">${g.finalScore}</div>
                        <span class="sc-cover-badge ${g.finalResultClass}" style="margin-top:2px;">
                          ${g.finalResultClass === 'sc-cover-push' ? '🟡 ' : (g.finalResultClass === 'sc-cover-covering' ? '✅ ' : '❌ ')}${g.finalResult}
                        </span>
                      ` : `

                        <div style="font-size:0.68rem; color:var(--text-muted);" id="sc-matrix-score-${g.fav}_${g.dog}">Score: -</div>
                        <span class="sc-cover-badge sc-cover-upcoming" id="sc-matrix-cover-${g.fav}_${g.dog}" style="margin-top:2px;">
                          🕒 Upcoming
                        </span>
                      `}
                    </td>
                  </tr>
                `).join('\n')}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- TAB 4: FANTASY FOOTBALL BENCH DROP & KICKER RADAR -->
      <div id="tab-fantasy-wrap" style="display:none;">
        <!-- Header Banner -->
        <div class="ff-header-banner" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.35rem;">🏈</span>
            <h2 style="font-size:1.1rem; font-weight:900; color:#F8FAFC; margin:0; letter-spacing:0.3px;">
              Fantasy Football • League Rosters &amp; Bench Drop Decisions
            </h2>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="ff-sync-timestamp" style="font-size:0.68rem; color:#94A3B8;">${fantasyData.syncedAt ? 'Synced: ' + new Date(fantasyData.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            <button class="filter-btn" id="btn-refresh-yahoo-fantasy" onclick="refreshYahooFantasyRosters()" style="background:#4338CA; border:1px solid #6366F1; color:#FFFFFF; font-weight:800; display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:0.75rem; transition:all 0.2s;" title="Sync live Yahoo rosters, starters &amp; bench drops from Yahoo Fantasy API">
              <span id="ff-refresh-icon">🔄</span> Refresh Yahoo Rosters
            </button>
          </div>
        </div>

        <!-- Filter Toolbars & Quick Actions -->
        <div style="background:#0F172A; border:1px solid #334155; border-radius:10px; padding:12px; margin-bottom:14px; display:flex; flex-direction:column; gap:10px;">
          <!-- Window Filter Row -->
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="font-size:0.75rem; font-weight:700; color:#94A3B8; min-width:80px;">Window:</span>
            <div class="filter-bar" id="ff-window-filter-bar" style="margin:0; padding:0; background:transparent; border:none; display:flex; gap:6px; flex-wrap:wrap;">
              <button class="filter-btn active" onclick="setFantasyWindowFilter('all', this)">
                All Windows
              </button>
              <button class="filter-btn" onclick="setFantasyWindowFilter('early', this)" style="color:#38BDF8;">
                1:00 PM Early (Primary Drops)
              </button>
              <button class="filter-btn" onclick="setFantasyWindowFilter('afternoon', this)" style="color:#A78BFA;">
                4:25 PM Afternoon
              </button>
              <button class="filter-btn" onclick="setFantasyWindowFilter('snf', this)" style="color:#F59E0B;">
                SNF (DAL @ NYG)
              </button>
              <button class="filter-btn" onclick="setFantasyWindowFilter('mnf', this)" style="color:#FCD34D;">
                MNF (DEN @ KC)
              </button>
              <button class="filter-btn" onclick="setFantasyWindowFilter('concluded', this)" style="color:#94A3B8;">
                Concluded (Thu)
              </button>
            </div>
          </div>

          <!-- Priority, Keep Toggle & Global Controls Row -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span style="font-size:0.75rem; font-weight:700; color:#94A3B8;">Priority:</span>
              <div class="filter-bar" id="ff-priority-filter-bar" style="margin:0; padding:0; background:transparent; border:none; display:flex; gap:6px; flex-wrap:wrap;">
                <button class="filter-btn active" onclick="setFantasyPriorityFilter('all', this)">All</button>
                <button class="filter-btn" onclick="setFantasyPriorityFilter('prime', this)" style="color:#F87171;">🔴 Prime Drops</button>
                <button class="filter-btn" onclick="setFantasyPriorityFilter('hold', this)" style="color:#FCD34D;">🟡 Evaluating</button>
                <button class="filter-btn" onclick="setFantasyPriorityFilter('keep', this)" style="color:#34D399;">🟢 Keepers</button>
              </div>

              <!-- Hide Kept Players Checkbox -->
              <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.72rem; color:#34D399; font-weight:700; cursor:pointer; background:#1E293B; padding:4px 10px; border-radius:6px; border:1px solid #334155; user-select:none;">
                <input type="checkbox" id="ff-chk-hide-kept" onchange="toggleHideKept(this.checked)" checked style="cursor:pointer;">
                <span>🔒 Hide Kept (<span id="ff-hidden-kept-badge">0</span>)</span>
              </label>
            </div>

            <!-- Global Collapse & Search -->
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <div style="display:flex; gap:4px;">
                <button class="btn-action" style="font-size:0.65rem; padding:3px 7px;" onclick="expandAllLeagues(true)">▾ Expand All</button>
                <button class="btn-action" style="font-size:0.65rem; padding:3px 7px;" onclick="expandAllLeagues(false)">▸ Collapse All</button>
                <button class="btn-action" style="font-size:0.65rem; padding:3px 7px; background:#312E81; color:#C7D2FE; border:1px solid #4338CA; font-weight:700;" onclick="refreshYahooFantasyRosters()" title="Pull live Yahoo add/drops">🔄 Sync Rosters</button>
              </div>
              <input type="text" id="ff-search-input" oninput="filterAndRenderFantasy()" placeholder="Search player, team..." style="background:#1E293B; border:1px solid #334155; border-radius:6px; color:#F8FAFC; padding:4px 8px; font-size:0.72rem; width:150px;">
            </div>
          </div>
        </div>

        <!-- Section 1: Collapsible Fantasy Leagues & Bench Cards -->
        <div id="ff-leagues-container">
          ${fantasyData.leagues.map(l => {
            const leagueId = l.leagueKey.split('.l.')[1];
            const cleanLeagueKey = l.leagueKey.replace(/[^a-zA-Z0-9]/g, '_');
            const needsDrop = l.needsKickerDrop;
            const windowLabels = {
              'early': 'Sun 1:00 PM',
              'afternoon': 'Sun 4:25 PM',
              'snf': 'Sun 8:20 PM',
              'mnf': 'Mon 8:15 PM',
              'concluded': 'Concluded'
            };

            return `
              <div class="ff-league-group" id="ff-league-group-${cleanLeagueKey}" draggable="true" data-league-key="${cleanLeagueKey}">
                <div class="ff-league-header" onclick="toggleLeagueCollapse('${cleanLeagueKey}')">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span class="drag-handle" title="Drag to reorder league group" style="cursor:grab; font-size:0.85rem; color:var(--text-muted); padding:2px 4px; user-select:none;">⠿</span>
                    <div style="display:flex; flex-direction:column; gap:2px;" onclick="event.stopPropagation()">
                      <button class="btn-order-arrow" onclick="moveLeagueOrder('${cleanLeagueKey}', -1, event)" title="Move League Up">▲</button>
                      <button class="btn-order-arrow" onclick="moveLeagueOrder('${cleanLeagueKey}', 1, event)" title="Move League Down">▼</button>
                    </div>
                    <button class="btn-league-collapse" id="btn-collapse-${cleanLeagueKey}">⯆</button>
                    <div>
                      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span style="font-weight:900; font-size:0.92rem; color:#F8FAFC;">${l.leagueName}</span>
                        <span style="font-size:0.72rem; color:var(--text-muted);">(${l.teamName})</span>
                        ${needsDrop ? `
                          <span class="badge badge-burnt" style="font-size:0.65rem; color:#F87171; font-weight:800;">
                            ⚠️ 1 DROP NEEDED (No Kicker)
                          </span>
                        ` : `
                          <span style="font-size:0.68rem; color:#64748B; font-weight:600;">(Kicker: ${l.startingKickerName})</span>
                        `}
                      </div>
                    </div>
                  </div>

                  <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:0.72rem; color:#94A3B8;">
                      vs ${l.matchup?.opponentName || 'Opponent'} (${l.matchup?.myScore || 0} - ${l.matchup?.opponentScore || 0})
                    </span>
                    <span class="badge badge-cash" style="font-size:0.65rem;">${l.bench.length} Bench Stashes</span>
                    <a href="https://football.fantasysports.yahoo.com/f1/${leagueId}/addplayer" 
                       target="_blank" 
                       onclick="event.stopPropagation()"
                       class="btn-action" 
                       style="font-size:0.68rem; padding:3px 8px; color:#FCD34D; border-color:rgba(245,158,11,0.4); text-decoration:none;">
                      Yahoo Add/Drop ↗
                    </a>
                  </div>
                </div>

                <div class="ff-league-body" id="ff-league-body-${cleanLeagueKey}">
                  <!-- Bench Player Cards Grid -->
                  <div class="ff-bench-grid">
                    ${l.bench.map(p => {
                      const cleanPlayerId = p.playerId || p.playerKey.replace(/[^a-zA-Z0-9]/g, '');
                      const cardKey = `${cleanLeagueKey}_${cleanPlayerId}`;
                      const headshot = p.headshotUrl || 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_w.png';
                      const winLabel = windowLabels[p.game?.window] || p.game?.time || 'Upcoming';

                      const pos = p.displayPosition || 'FLEX';
                      const normPName = (p.name || '').toLowerCase().trim();
                      const normBaseName = normPName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
                      const playerBoxStats = boxscoreAthleteStats[normPName] || boxscoreAthleteStats[normBaseName] || null;
                      const fantasyPts = p.fantasyPoints != null ? p.fantasyPoints : (playerBoxStats?.fantasyPts != null ? playerBoxStats.fantasyPts : null);
                      const isConcludedGame = p.game?.window === 'concluded';
                      const initialInjury = boxscoreAthleteInjuries[normPName] || boxscoreAthleteInjuries[normBaseName] || (p.injuryStatus ? '🏥 ' + p.injuryStatus : '');
                      const initialStatStr = formatPlayerStatString(playerBoxStats ? { ...playerBoxStats, fantasyPoints: fantasyPts } : (fantasyPts != null ? { fantasyPoints: fantasyPts } : null), pos, isConcludedGame);

                      return `
                        <div class="ff-player-card hold-drop" 
                             id="ff-card-${cardKey}"
                             data-card-key="${cardKey}"
                             data-player-id="${p.playerId}"
                             data-player-name="${p.name.toLowerCase()}"
                             data-pos="${p.displayPosition}"
                             data-window="${p.game?.window || 'early'}"
                             data-team="${p.nflTeam}"
                             data-league-key="${l.leagueKey}"
                             data-drop-priority="hold">
                          
                          <!-- Card Header (Always visible, toggle collapse) -->
                          <div class="ff-player-card-header">
                            <div style="display:flex; align-items:center; gap:8px; flex:1; cursor:pointer;" onclick="togglePlayerCardCollapse('${cardKey}')">
                              <button class="btn-card-toggle" id="btn-card-toggle-${cardKey}">⯆</button>
                              <img src="${headshot}" alt="${p.name}" style="width:32px; height:32px; border-radius:50%; background:#1E293B; object-fit:cover; border:1px solid #334155;">
                              <div>
                                <div style="font-weight:800; font-size:0.85rem; color:#F8FAFC; line-height:1.2; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                                  <span>${p.name}</span>
                                  <span class="ff-injury-badge" id="ff-injury-${cardKey}" style="${initialInjury ? '' : 'display:none;'}">${initialInjury || ''}</span>
                                </div>
                                <div style="font-size:0.68rem; color:var(--text-muted); display:flex; align-items:center; gap:4px; margin-top:2px;">
                                  <span class="badge badge-cash" style="font-size:0.62rem; padding:1px 4px;">${p.displayPosition}</span>
                                  <span>•</span>
                                  <span style="font-weight:700; color:#CBD5E1;">${p.nflTeam}</span>
                                </div>
                              </div>
                            </div>

                            <div style="display:flex; align-items:center; gap:6px;">
                              <span class="badge ff-fpts-badge" id="ff-fpts-badge-${cardKey}" style="background:linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color:#FFF; font-weight:800; font-size:0.68rem; padding:2px 7px; border-radius:6px; border:1px solid rgba(56,189,248,0.4); letter-spacing:0.3px; ${fantasyPts != null ? '' : 'display:none;'}">
                                ⚡ ${fantasyPts != null ? Number(fantasyPts).toFixed(2) : '0.00'} PTS
                              </span>
                              <span class="ff-drop-badge ff-drop-hold" id="ff-badge-${cardKey}">
                                🟡 Evaluating
                              </span>
                              <button class="btn-keep-toggle" 
                                      id="btn-keep-${cardKey}" 
                                      onclick="toggleKeepPlayer('${cardKey}', event)"
                                      title="Decided NOT to drop this player — lock in and hide from drop candidates">
                                🔒 Keep
                              </button>
                            </div>
                          </div>

                          <!-- Collapsible Card Body -->
                          <div class="ff-card-body" id="ff-card-body-${cardKey}">
                            <!-- Single Clean Matchup Line -->
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:#94A3B8; background:rgba(15,23,42,0.6); padding:5px 8px; border-radius:6px; margin-top:6px;">
                              <span><strong>${p.game?.matchup || p.nflTeam}</strong> • ${winLabel}</span>
                              <span id="ff-clock-${cardKey}" style="font-weight:700; color:#38BDF8;">(${p.game?.time || 'Pre'})</span>
                            </div>

                            <!-- Opportunity & Production Stat Strip (No Artificial Cap) -->
                            <div class="ff-stat-box" style="margin-top:6px; background:rgba(15,23,42,0.6); border:1px solid #1E293B; border-radius:6px; padding:6px 10px;">
                              <div style="font-size:0.65rem; color:var(--text-muted); font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; display:flex; justify-content:space-between; align-items:center;">
                                <span>${pos === 'QB' ? 'Pass Opportunity & Production' : (['LB', 'DB', 'DL', 'DE', 'DT', 'CB', 'S', 'DEF', 'D'].includes(pos) ? 'Defensive Stats' : (pos === 'K' ? 'Kicking Stats' : 'Touches & Production'))}</span>
                                <span id="ff-fpts-text-${cardKey}" style="font-weight:900; font-size:0.72rem; color:#38BDF8; ${fantasyPts != null ? '' : 'display:none;'}">⚡ ${fantasyPts != null ? Number(fantasyPts).toFixed(2) : '0.00'} Fantasy Pts</span>
                              </div>
                              <div id="ff-pstat-${cardKey}" style="font-size:0.75rem; font-weight:800; color:#F8FAFC;">
                                ${initialStatStr}
                              </div>
                              <div class="ff-stat-progress-wrap" id="ff-prog-wrap-${cardKey}" style="margin-top:6px;"></div>
                            </div>
                          </div>

                        </div>
                      `;
                    }).join('\n')}
                  </div>

                  <!-- Collapsible Starting Lineup View (Collapsed by Default) -->
                  <details class="ff-starters-details" style="margin-top:12px; background:rgba(15,23,42,0.4); border:1px solid #1E293B; border-radius:8px; padding:10px 12px;">
                    <summary style="font-size:0.75rem; color:#60A5FA; cursor:pointer; font-weight:800; user-select:none; display:flex; align-items:center; justify-content:space-between;">
                      <span style="display:flex; align-items:center; gap:6px;">
                        <span class="ff-details-arrow" style="font-size:0.75rem; color:#60A5FA; display:inline-block; transition:transform 0.15s ease;">▶</span>
                        ⭐ Starting Lineup (${(l.starters || []).length} Starters) • Real-Time Stat Gauges
                      </span>
                      <span style="font-size:0.65rem; color:var(--text-muted); font-weight:600;">Active Lineup</span>
                    </summary>
                    <div class="ff-starters-grid">
                      ${(l.starters || []).map((s, sIdx) => {
                        const cleanPlayerId = s.playerId || (s.playerKey ? s.playerKey.replace(/[^a-zA-Z0-9]/g, '') : (s.name ? s.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : `starter_${sIdx}`));
                        const starterCardKey = `starter_${cleanLeagueKey}_${cleanPlayerId}`;
                        const headshot = s.headshotUrl || 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_w.png';
                        
                        const winLabel = windowLabels[s.game?.window] || s.game?.time || 'Upcoming';
                        const pos = s.selectedPosition || s.displayPosition || 'FLEX';
                        
                        let posColor = '#3B82F6';
                        if (pos === 'QB') posColor = '#EC4899';
                        else if (pos === 'RB') posColor = '#10B981';
                        else if (pos === 'WR') posColor = '#38BDF8';
                        else if (pos === 'TE') posColor = '#A855F7';
                        else if (pos === 'K') posColor = '#F59E0B';
                        else if (pos === 'DEF') posColor = '#64748B';
                        else if (['D', 'LB', 'DB', 'DL', 'DE', 'DT', 'CB', 'S'].includes(pos)) posColor = '#EAB308';
                        else if (pos.includes('W') || pos.includes('R') || pos.includes('T')) posColor = '#06B6D4';

                        const normSName = (s.name || '').toLowerCase().trim();
                        const normBaseName = normSName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
                        const starterBoxStats = boxscoreAthleteStats[normSName] || boxscoreAthleteStats[normBaseName] || null;
                        const starterFantasyPts = s.fantasyPoints != null ? s.fantasyPoints : (starterBoxStats?.fantasyPts != null ? starterBoxStats.fantasyPts : null);
                        const isConcludedGame = s.game?.window === 'concluded';
                        const starterStatStr = formatPlayerStatString(starterBoxStats ? { ...starterBoxStats, fantasyPoints: starterFantasyPts } : (starterFantasyPts != null ? { fantasyPoints: starterFantasyPts } : null), pos, isConcludedGame);

                        return `
                          <div class="ff-starter-card" 
                               id="ff-card-${starterCardKey}"
                               data-card-key="${starterCardKey}"
                               data-player-name="${s.name.toLowerCase()}"
                               data-pos="${pos}"
                               data-team="${s.nflTeam}">
                            <div class="ff-starter-card-header">
                              <img src="${headshot}" 
                                   alt="${s.name}" 
                                   style="width:30px; height:30px; border-radius:50%; background:#1E293B; object-fit:cover; border:1px solid #334155; flex-shrink:0;">
                              <div style="flex:1; min-width:0;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                  <div style="font-weight:800; font-size:0.8rem; color:#F8FAFC; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${s.name}">
                                    ${s.name}
                                  </div>
                                  <div style="display:flex; align-items:center; gap:4px;">
                                    ${starterFantasyPts != null ? `
                                      <span class="badge" style="background:#0284C7; color:#FFF; font-size:0.6rem; padding:1px 5px; font-weight:800; flex-shrink:0;">
                                        ⚡ ${Number(starterFantasyPts).toFixed(2)} PTS
                                      </span>
                                    ` : ''}
                                    <span class="badge" style="background:${posColor}; color:#FFF; font-size:0.6rem; padding:1px 5px; font-weight:800; flex-shrink:0;">
                                      ${s.selectedPosition}
                                    </span>
                                  </div>
                                </div>
                                <div style="font-size:0.66rem; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                                  <span><strong style="color:#CBD5E1;">${s.nflTeam}</strong> • ${s.game?.matchup || s.nflTeam}</span>
                                  <span id="ff-starter-clock-${starterCardKey}" style="color:#38BDF8; font-weight:700;">(${s.game?.time || 'Pre'})</span>
                                </div>
                              </div>
                            </div>
                            <div class="ff-stat-box" style="margin-top:4px; background:rgba(15,23,42,0.6); border:1px solid #1E293B; border-radius:6px; padding:4px 8px;">
                              <div style="font-size:0.62rem; color:var(--text-muted); font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; display:flex; justify-content:space-between; align-items:center;">
                                <span>${pos === 'QB' ? 'Passing' : (['LB','DB','DL','DE','DT','CB','S','DEF','D'].includes(pos) ? 'Defense' : (pos === 'K' ? 'Kicking' : 'Touches & Yds'))}</span>
                                <span id="ff-starter-fpts-${starterCardKey}" style="font-size:0.68rem; font-weight:800; color:#38BDF8; ${starterFantasyPts != null ? '' : 'display:none;'}">⚡ ${starterFantasyPts != null ? Number(starterFantasyPts).toFixed(2) : '0.00'} Fantasy Pts</span>
                              </div>
                              <div id="ff-starter-pstat-${starterCardKey}" style="font-weight:800; font-size:0.75rem; color:#F8FAFC;">
                                ${starterStatStr}
                              </div>
                            </div>
                          </div>
                        `;
                      }).join('\n')}
                    </div>
                  </details>
                </div>
              </div>
            `;
          }).join('\n')}
        </div>

        <!-- Section 2: Target Kickers Radar (SNF & MNF Options) -->
        <div id="ff-kicker-radar" class="sc-header-banner" style="border-left-color:#3B82F6; margin-top:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:1.2rem;">🎯</span>
                <h3 style="font-size:0.95rem; font-weight:800; color:#F8FAFC; margin:0;">
                  Target Kickers Radar • Sunday Night &amp; Monday Night Pickup Targets
                </h3>
              </div>
              <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
                When dropping morning/afternoon bench stashes, add one of these starting kickers before kickoff:
              </div>
            </div>
          </div>

          <div class="ff-kicker-radar-grid">
            ${fantasyData.targetKickers.map(k => `
              <div class="ff-kicker-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div>
                    <strong style="font-size:0.88rem; color:#F8FAFC;">${k.name}</strong>
                    <div style="font-size:0.7rem; color:#CBD5E1;">${k.nflTeam} • ${k.game} (${k.venue})</div>
                  </div>
                  <span class="badge badge-warning" style="font-size:0.62rem;">${k.time}</span>
                </div>
                <div style="font-size:0.68rem; color:var(--text-muted);">${k.status}</div>
                <div style="font-size:0.65rem; font-weight:800; text-transform:uppercase; color:#94A3B8; margin-top:8px;">League Availability:</div>
                <div style="display:flex; gap:6px; margin-top:4px; flex-wrap:wrap;">
                  ${(k.leagues && k.leagues.length > 0 ? k.leagues : [
                    { leagueName: 'The League', leagueId: '117200', status: 'available' },
                    { leagueName: 'Honey Badgers', leagueId: '351555', status: 'available' },
                    { leagueName: 'Rose Bowl', leagueId: '735815', status: 'available' },
                    { leagueName: 'RFI XIX', leagueId: '772245', status: 'available' }
                  ]).map(l => {
                    const isAvail = l.status === 'available';
                    if (isAvail) {
                      return `<a href="https://football.fantasysports.yahoo.com/f1/${l.leagueId}/addplayer" 
                                 target="_blank" 
                                 class="btn-action" 
                                 style="background:rgba(6,78,59,0.7); border-color:#059669; color:#A7F3D0; font-size:0.65rem; padding:3px 8px; text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-weight:700;">
                                <span>✅ ${l.leagueName}</span>
                                <span style="color:#34D399; font-weight:800;">+ Add ↗</span>
                              </a>`;
                    } else {
                      return `<span style="background:rgba(15,23,42,0.8); border:1px solid #334155; color:#64748B; font-size:0.65rem; padding:3px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:4px;">
                                <span>🔒 ${l.leagueName}</span>
                                <span style="color:#475569;">(${l.owner || 'Taken'})</span>
                              </span>`;
                    }
                  }).join('\n')}
                </div>
              </div>
            `).join('\n')}
          </div>
        </div>

        <!-- Section 3: Available Players Radar (All Positions -- Offense, DEF, IDP) -->
        <div id="ff-available-radar" class="sc-header-banner" style="border-left-color:#8B5CF6; margin-top:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:1.2rem;">📡</span>
                <h3 style="font-size:0.95rem; font-weight:800; color:#F8FAFC; margin:0;">
                  Available Players Radar • All Positions
                </h3>
              </div>
              <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
                Top available free agents/waivers by league and position, with this week's schedule context.
                ${radarData.generatedAt ? `Updated ${new Date(radarData.generatedAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' })} ET.` : ''}
              </div>
            </div>
          </div>

          ${(radarData.leagues || []).length === 0 ? `
            <div style="font-size:0.75rem; color:var(--text-muted); padding:12px 0;">No available-players data yet -- run the nightly sync to populate this.</div>
          ` : (radarData.leagues || []).map(lg => `
            <details class="ff-starters-details" style="margin-top:12px; background:rgba(15,23,42,0.4); border:1px solid #1E293B; border-radius:8px; padding:10px 12px;">
              <summary style="font-size:0.8rem; color:#A78BFA; cursor:pointer; font-weight:800; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
                <span>${lg.leagueName}</span>
                <span style="font-size:0.62rem; color:#64748B; font-weight:600;">${(lg.positionsDetected || []).join(' · ')}</span>
              </summary>
              <div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
                ${Object.entries(lg.players || {}).filter(([, list]) => Array.isArray(list) && list.length > 0).map(([pos, list]) => `
                  <div>
                    <div style="font-size:0.65rem; font-weight:800; text-transform:uppercase; color:#94A3B8; margin-bottom:4px;">${pos} (${list.length} available)</div>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                      ${list.slice(0, 8).map(p => `
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; background:rgba(30,41,59,0.5); border-radius:5px; padding:4px 8px; gap:8px;">
                          <div>
                            <strong style="color:#E2E8F0;">${p.name}</strong>
                            <span style="color:#64748B;"> · ${p.nflTeam || '--'}</span>
                            ${p.injuryStatus ? `<span style="color:#F59E0B; font-weight:700;"> (${p.injuryStatus})</span>` : ''}
                          </div>
                          <div style="color:#94A3B8; font-size:0.68rem; text-align:right; white-space:nowrap;">${p.scheduleNote || ''}</div>
                        </div>
                      `).join('\n')}
                    </div>
                  </div>
                `).join('\n')}
              </div>
            </details>
          `).join('\n')}
        </div>

      </div>

      <!-- TAB 5: FUTURES PORTFOLIO (season-long bets -- Super Bowl, MVP, division, etc.) -->
      <div id="tab-futures-wrap" style="display:none;">
        <div class="filter-bar">
          <span>Season-Long Futures Portfolio:</span>
          <span style="font-size:0.75rem; color:#94A3B8;">Not tied to any single game day -- these ride the whole season. Multiple tickets on the same future are grouped into one card.</span>
        </div>

        ${renderFuturesPriceWatchSection(futuresPriceWatchList)}

        <div class="tickets-section-header" id="futures-summary-header">
          <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
            <span style="font-size:0.82rem; font-weight:800; letter-spacing:0.5px; color:#F8FAFC; text-transform:uppercase;">
              📈 Futures Summary
            </span>
            <span style="font-size:0.78rem; color:#94A3B8;">Active Cash Risked: <strong style="color:#F8FAFC;">$${futuresStakedTotal.toFixed(2)}</strong></span>
            <span style="font-size:0.78rem; color:#94A3B8;">Active Potential Payout: <strong style="color:var(--accent-green);">$${futuresPotentialTotal.toFixed(2)}</strong></span>
            <span style="font-size:0.78rem; color:#94A3B8;">Positions: <strong style="color:#F8FAFC;">${futuresGroups.length}</strong></span>
          </div>
        </div>

        <div id="futures-cards-grid">
          ${renderFuturesTeamSections(groupFuturesByTeam(futuresLive), 'live')}
        </div>

        <div id="futures-empty" class="empty-slips-msg" style="display:${futuresLive.length === 0 ? 'block' : 'none'};">
          No active season-long futures on the board right now.
        </div>

        <div id="futures-resolved-section-wrap" style="display:${futuresResolved.length > 0 ? 'block' : 'none'};">
          <div class="cashed-divider-line">
            <div class="divider-stripe"></div>
            <div class="divider-label">
              <span>🏁</span>
              <strong>RESOLVED FUTURES (${futuresResolved.length})</strong>
            </div>
            <div class="divider-stripe"></div>
          </div>
          <div id="futures-resolved-cards-grid">
            ${renderFuturesTeamSections(groupFuturesByTeam(futuresResolved), 'resolved')}
          </div>
        </div>
      </div>
    </main>

    <!-- RIGHT SIDEBAR: Alejandro Ledger & Split History -->
    <aside class="sidebar-right">
      <div class="sidebar-box" id="alejandro-ledger-box">
        <div class="sidebar-box-title">
          <span>🤝 Alejandro Castro Split Ledger</span>
          <span style="font-size:0.68rem; color:var(--accent-purple);" id="sidebar-split-count">0 Tickets</span>
        </div>

        <div class="alejandro-bill-badge">
          <span style="font-size:0.68rem; color:#A5B4FC; text-transform:uppercase; font-weight:700;">Weekly Bill Balance</span>
          <strong id="sidebar-bill-val">$0.00</strong>
        </div>

        <div class="stat-row">
          <span class="stat-label">Split Stakes (50%)</span>
          <span class="stat-val" id="sidebar-stat-owed">$0.00</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Cashed Share (50%)</span>
          <span class="stat-val" style="color:var(--accent-green);" id="sidebar-stat-cashed">$0.00</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Potential Win Share</span>
          <span class="stat-val" style="color:var(--accent-cyan);" id="sidebar-stat-potential">$0.00</span>
        </div>

        <button class="btn-action" style="justify-content:center; margin-top:4px;" onclick="toggleHistoryDrawer()">
          📜 View Split Ledger History
        </button>

        <div id="sidebar-chips-container" style="margin-top:6px; display:flex; flex-direction:column; gap:4px;"></div>

        <div class="history-drawer" id="history-drawer">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong>Settled Split Log (<span id="history-total-count">0</span>)</strong>
            <button class="btn-action" style="padding:1px 4px; font-size:0.65rem;" onclick="markAllSettled()">Mark Settled</button>
          </div>
          <div style="max-height:180px; overflow-y:auto;">
            <table class="settle-table">
              <thead>
                <tr><th>Ticket</th><th>Stake</th><th>Status</th><th>Balance</th></tr>
              </thead>
              <tbody id="history-tbody">
                <tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:6px;">No recorded split history yet.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </aside>

  </div>

  <script>
    const TICKET_CONFIG = ${JSON.stringify(ticketConfigJs, null, 2).replace(/<\/script/gi, '<\\/script')};
    const OPEN_SLOT_LEG_KEYS = new Set();
    Object.values(TICKET_CONFIG).forEach(c => (c.openSlotLegs || []).forEach(k => OPEN_SLOT_LEG_KEYS.add(k)));
    const INITIAL_SCHEDULE = ${JSON.stringify(weekSchedule).replace(/<\/script/gi, '<\\/script')};
    const STORAGE_KEY = 'sunday_tracker_state_week_${week}';
    const SPLITS_KEY = 'sunday_splits_week_${week}';
    const BURNS_KEY = 'sunday_burns_week_${week}';
    const BURNT_LEGS_KEY = 'sunday_burnt_legs_week_${week}';
    const PUSHED_LEGS_KEY = 'sunday_pushed_legs_week_${week}';
    const OUT_LEGS_KEY = 'sunday_out_legs_week_${week}';
    const HIDE_BURNT_KEY = 'sunday_hide_burnt_week_${week}';
    const CASHED_KEY = 'sunday_cashed_state_week_${week}';
    const HIDE_CASHED_KEY = 'sunday_hide_cashed_week_${week}';
    const HIDE_FULFILLED_KEY = 'sunday_hide_fulfilled_week_${week}';
    const ARCHIVE_KEY = 'sunday_settled_archive_week_${week}';
    const ORDER_KEY = 'sunday_card_order_week_${week}';
    // Bump when the generator's default card order changes, so a previously
    // saved drag-order does not silently re-apply the old layout on load.
    const ORDER_LAYOUT_KEY = 'sunday_card_order_layout_week_${week}';
    const ORDER_LAYOUT_VERSION = 'props-first-v1';
    const COLLAPSED_KEY = 'sunday_card_collapsed_week_${week}';
    const PLAYER_ORDER_KEY = 'sunday_player_order_week_${week}';
    const PLAYER_COLLAPSED_KEY = 'sunday_player_collapsed_week_${week}';
    const PLAYER_SORT_KEY = 'sunday_player_sort_week_${week}';
    const AUTO_COLLAPSE_KEY = 'sunday_auto_collapse_week_${week}';
    const SPLIT_HISTORY_KEY = 'sunday_split_history_week_${week}';
    const BOARD_CLEARED_KEY = 'sunday_board_cleared_week_${week}';
    const CUSTOM_SLIPS_KEY = 'sunday_custom_slips_week_${week}';
    const ACTIVE_TAB_KEY = 'sunday_active_tab_week_${week}';
    const HIDE_FULFILLED_LEGS_KEY = 'sunday_hide_fulfilled_legs_week_${week}';
    const HIDE_INJURED_LEGS_KEY = 'sunday_hide_injured_legs_week_${week}';
    const CARD_MIN_LEGS_KEY = 'sunday_card_min_legs_week_${week}';
    const SC_PICKS_KEY = 'sunday_supercontest_picks_week_${week}';
    const SC_LOCKED_CARD_KEY = 'sunday_supercontest_locked_card_week_${week}';
    const SC_CARD_COLLAPSE_KEY = 'sunday_sc_card_collapse_week_${week}';

    const SC_MATRIX = ${JSON.stringify(scMatrixList).replace(/<\/script/gi, '<\\/script')};
    const SC_RESULT_BY_TEAM = ${JSON.stringify(scResultByTeam).replace(/<\/script/gi, '<\\/script')};

    const SC_TOP5_INITIAL = ${JSON.stringify(scTop5List).replace(/<\/script/gi, '<\\/script')};
    const HAS_LOCKED_CARD = ${hasLockedCardFile};
    const SC_LOCKED_CARD_INITIAL = ${JSON.stringify(hasLockedCardFile ? scTop5List : []).replace(/<\/script/gi, '<\\/script')};
    const SC_RANKINGS_MAP = ${JSON.stringify(SC_RANKINGS).replace(/<\/script/gi, '<\\/script')};
    const PLAYER_TICKET_MAP = ${JSON.stringify(playerTicketMap).replace(/<\/script/gi, '<\\/script')};
    const INITIAL_INJURIES = ${JSON.stringify(boxscoreAthleteInjuries).replace(/<\/script/gi, '<\\/script')};

    let athleteInjuryMap = { ...(INITIAL_INJURIES || {}) };
    let archivedGames = [];
    let customSlips = [];
    let hideFulfilled = false;
    let isBoardCleared = false;
    let activeTab = 'tickets';
    let hideFulfilledLegs = false;
    let hideInjuredLegs = false;
    let cardMinLegsState = {};
    let scPicks = {};
    let scCardCollapsedState = {};

    let scActiveFilter = 'all';

    let checkedState = {};
    let splitState = {};
    let manualBurns = {};
    let manualCashed = {};
    let burntLegsState = {};
    let pushedLegsState = {};
    let outLegsState = {};
    let collapsedState = {};
    let playerCollapsedState = {};
    let hideBurnt = false;
    let hideCashed = false;
    let activeFilter = 'all';
    let activePlayerFilter = 'all';
    let activePlayerSort = 'gametime';
    let autoCollapseFulfilled = true;
    let splitHistory = [];
    let refreshCountdown = 15;

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function readJsonKey(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null || raw === undefined) return fallback;
        const parsed = JSON.parse(raw);
        return parsed !== null && parsed !== undefined ? parsed : fallback;
      } catch (err) {
        console.warn('LocalStorage read error for "' + key + '":', err);
        return fallback;
      }
    }

    function loadState() {
      checkedState = readJsonKey(STORAGE_KEY, {});
      splitState = readJsonKey(SPLITS_KEY, {});
      manualBurns = readJsonKey(BURNS_KEY, {});
      manualCashed = readJsonKey(CASHED_KEY, {});
      burntLegsState = readJsonKey(BURNT_LEGS_KEY, {});
      pushedLegsState = readJsonKey(PUSHED_LEGS_KEY, {});
      outLegsState = readJsonKey(OUT_LEGS_KEY, {});
      hideBurnt = readJsonKey(HIDE_BURNT_KEY, false);
      const chkBurnt = document.getElementById('chk-hide-burnt');
      if (chkBurnt) chkBurnt.checked = !!hideBurnt;

      hideCashed = readJsonKey(HIDE_CASHED_KEY, false);
      const chkCashed = document.getElementById('chk-hide-cashed');
      if (chkCashed) chkCashed.checked = !!hideCashed;

      hideFulfilled = readJsonKey(HIDE_FULFILLED_KEY, false);
      const chkFulfilled = document.getElementById('chk-hide-fulfilled');
      if (chkFulfilled) chkFulfilled.checked = !!hideFulfilled;

      isBoardCleared = readJsonKey(BOARD_CLEARED_KEY, false);
      collapsedState = readJsonKey(COLLAPSED_KEY, {});
      playerCollapsedState = readJsonKey(PLAYER_COLLAPSED_KEY, {});
      activePlayerSort = readJsonKey(PLAYER_SORT_KEY, 'gametime');
      autoCollapseFulfilled = readJsonKey(AUTO_COLLAPSE_KEY, true);
      activeTab = readJsonKey(ACTIVE_TAB_KEY, 'tickets');

      hideFulfilledLegs = readJsonKey(HIDE_FULFILLED_LEGS_KEY, false);
      const chkFulfilledLegs = document.getElementById('chk-hide-fulfilled-legs');
      if (chkFulfilledLegs) chkFulfilledLegs.checked = !!hideFulfilledLegs;

      hideInjuredLegs = readJsonKey(HIDE_INJURED_LEGS_KEY, false);
      const chkInjuredLegs = document.getElementById('chk-hide-injured-legs');
      if (chkInjuredLegs) chkInjuredLegs.checked = !!hideInjuredLegs;

      cardMinLegsState = readJsonKey(CARD_MIN_LEGS_KEY, {});
      scPicks = readJsonKey(SC_PICKS_KEY, {});
      scCardCollapsedState = readJsonKey(SC_CARD_COLLAPSE_KEY, {});


      try { loadArchiveState(); } catch (e) { console.warn('Archive load failed:', e); }
      try { loadCustomSlips(); } catch (e) { console.warn('Custom slips load failed:', e); }
      try { loadSplitHistory(); } catch (e) { console.warn('Split history load failed:', e); }
      try { loadFantasyState(); } catch (e) { console.warn('Fantasy state load failed:', e); }

      for (const [tId, cfg] of Object.entries(TICKET_CONFIG)) {
        if (cfg && cfg.legsWon) {
          cfg.legsWon.forEach(lKey => {
            if (checkedState[lKey] === undefined) {
              checkedState[lKey] = true;
            }
          });
        }
      }

      try { applyBoardClearState(); } catch (e) { console.warn(e); }
      try { applyCollapsedState(); } catch (e) { console.warn(e); }
      try { applyPlayerCollapsedState(); } catch (e) { console.warn(e); }

      const sortSel = document.getElementById('player-sort-select');
      if (sortSel) sortSel.value = activePlayerSort;
      const chkAuto = document.getElementById('chk-auto-collapse');
      if (chkAuto) chkAuto.checked = !!autoCollapseFulfilled;

      try { setupDragAndDrop(); } catch (e) { console.warn(e); }
      try { setupPlayerDragAndDrop(); } catch (e) { console.warn(e); }
      try { setupLeagueDragAndDrop(); } catch (e) { console.warn(e); }
      try { restoreCardOrder(); } catch (e) { console.warn(e); }
      try { sortTicketLegsByStatus(); } catch (e) { console.warn(e); }
      try { restorePlayerCardOrder(); } catch (e) { console.warn(e); }
      try { restoreLeagueOrder(); } catch (e) { console.warn(e); }

      try { showTab(activeTab); } catch (e) { console.warn(e); }
      try { applyHideFulfilledLegs(); } catch (e) { console.warn(e); }
      try { applySuperContestPicks(); } catch (e) { console.warn(e); }
      try { applySuperContestSettledCards(); } catch (e) { console.warn(e); }
      try { filterAndRenderFantasy(); } catch (e) { console.warn(e); }


      try { render(); } catch (e) { console.warn(e); }
      try { renderPlayerCheatSheetStats(latestTeamStatusMap); } catch (e) { console.warn(e); }
      try { updatePlayerParlayLinks(); } catch (e) { console.warn(e); }
      try { updateAlejandroLedger(); } catch (e) { console.warn(e); }
      try { filterCards(); } catch (e) { console.warn(e); }
      try { filterAndSortPlayers(); } catch (e) { console.warn(e); }
      try { partitionPlayers(); } catch (e) { console.warn(e); }

      try { updateLeftSidebarFromSchedule(INITIAL_SCHEDULE); } catch (e) { console.warn(e); }
      try { sortLeftSidebarGameCards(); } catch (e) { console.warn(e); }
      try { sortAllLeagueEvalPlayers(); } catch (e) { console.warn(e); }
      try { fetchLiveScoreboard(); } catch (e) { console.warn(e); }
      setInterval(tickCountdown, 1000);
    }

    function saveCustomLayoutManually() {
      saveCardOrder();
      saveCollapsed();
      showToast('💾 Custom Ticketboard Layout Saved!');
    }
    window.saveCustomLayoutManually = saveCustomLayoutManually;

    function saveState() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedState)); } catch (e) {}
    }
    function saveSplits() {
      try { localStorage.setItem(SPLITS_KEY, JSON.stringify(splitState)); } catch (e) {}
    }
    function saveBurns() {
      try { localStorage.setItem(BURNS_KEY, JSON.stringify(manualBurns)); } catch (e) {}
    }
    function saveCashed() {
      try { localStorage.setItem(CASHED_KEY, JSON.stringify(manualCashed)); } catch (e) {}
    }
    function saveLegBurns() {
      try { localStorage.setItem(BURNT_LEGS_KEY, JSON.stringify(burntLegsState)); } catch (e) {}
    }
    function savePushedLegs() {
      try { localStorage.setItem(PUSHED_LEGS_KEY, JSON.stringify(pushedLegsState)); } catch (e) {}
    }
    function saveLegOut() {
      try { localStorage.setItem(OUT_LEGS_KEY, JSON.stringify(outLegsState)); } catch (e) {}
    }

    function getCombinations(arr, k) {
      if (k === 0) return [[]];
      if (!arr || arr.length === 0) return [];
      const head = arr[0];
      const tail = arr.slice(1);
      const withHead = getCombinations(tail, k - 1).map(c => [head, ...c]);
      const withoutHead = getCombinations(tail, k);
      return [...withHead, ...withoutHead];
    }
    window.getCombinations = getCombinations;

    function toggleLeg(legKey, ticketId) {
      if (OPEN_SLOT_LEG_KEYS.has(legKey)) return; // open slots are placeholders, not real picks
      // Guard added 2026-09-21: toggleLeg used to just flip the box with zero
      // awareness of the auto-computed live/final pace badge, so a click on a
      // leg that already graded FAILED or PUSH after the game ended would
      // silently mark it HIT (or vice versa) and corrupt the tracked record.
      // Confirm before allowing a manual override that contradicts the
      // auto-computed result; manual override is still allowed for real
      // stat-tracking desyncs, it just can't happen silently anymore.
      const el = document.getElementById('leg-' + legKey);
      const nextChecked = !checkedState[legKey];
      if (el && nextChecked) {
        if (el.classList.contains('pace-red')) {
          if (!confirm('This leg\\'s live/final stats show it FAILED. Mark it as HIT anyway?')) return;
        } else if (el.classList.contains('pace-push')) {
          if (!confirm('This leg is graded as a PUSH. Mark it as HIT anyway? (This clears its Push status.)')) return;
        }
      } else if (el && !nextChecked && el.classList.contains('pace-green')) {
        if (!confirm('This leg\\'s live/final stats show it HIT. Remove the HIT mark anyway?')) return;
      }
      checkedState[legKey] = nextChecked;
      if (checkedState[legKey]) {
        if (burntLegsState[legKey]) {
          delete burntLegsState[legKey];
          saveLegBurns();
        }
        if (pushedLegsState[legKey]) {
          delete pushedLegsState[legKey];
          savePushedLegs();
        }
        if (outLegsState[legKey]) {
          delete outLegsState[legKey];
          saveLegOut();
        }
      }
      saveState();
      render();
      updateAlejandroLedger();
      filterCards();
      applyHideFulfilledLegs();
    }

    function toggleLegBurn(legKey, ticketId, event) {
      if (event && event.stopPropagation) event.stopPropagation();
      if (OPEN_SLOT_LEG_KEYS.has(legKey)) return; // open slots are placeholders, not real picks
      const el = document.getElementById('leg-' + legKey);
      const isCurrentlyBurnt = !!burntLegsState[legKey];
      if (!isCurrentlyBurnt && el) {
        if (el.classList.contains('pace-green')) {
          if (!confirm('This leg\\'s live/final stats show it HIT. Mark it Burnt/Missed anyway?')) return;
        } else if (el.classList.contains('pace-push')) {
          if (!confirm('This leg is graded as a PUSH. Mark it Burnt/Missed anyway? (This clears its Push status.)')) return;
        }
      }
      if (isCurrentlyBurnt) {
        delete burntLegsState[legKey];
        if (outLegsState[legKey]) {
          delete outLegsState[legKey];
          saveLegOut();
        }
      } else {
        burntLegsState[legKey] = true;
        if (outLegsState[legKey]) {
          delete outLegsState[legKey];
          saveLegOut();
        }
        if (checkedState[legKey]) {
          delete checkedState[legKey];
          saveState();
        }
        if (pushedLegsState[legKey]) {
          delete pushedLegsState[legKey];
          savePushedLegs();
        }
        if (ticketId && cardMinLegsState[ticketId] === undefined) {
          cardMinLegsState[ticketId] = true;
          try { localStorage.setItem(CARD_MIN_LEGS_KEY, JSON.stringify(cardMinLegsState)); } catch (e) {}
        }
      }
      saveLegBurns();
      render();
      updateAlejandroLedger();
      filterCards();
      applyHideFulfilledLegs();
    }
    window.toggleLegBurn = toggleLegBurn;

    // Added 2026-09-21 (Andy request): a third manual leg state for Pushes --
    // e.g. Jets +3 landing on exactly 3. A push doesn't hit or fail; it should
    // drop out of the parlay's hit/miss count entirely rather than being forced
    // into one bucket or the other. Mutually exclusive with checked/burnt.
    function toggleLegPush(legKey, ticketId, event) {
      if (event && event.stopPropagation) event.stopPropagation();
      if (OPEN_SLOT_LEG_KEYS.has(legKey)) return; // open slots are placeholders, not real picks
      const isCurrentlyPushed = !!pushedLegsState[legKey];
      if (isCurrentlyPushed) {
        delete pushedLegsState[legKey];
      } else {
        pushedLegsState[legKey] = true;
        if (checkedState[legKey]) {
          delete checkedState[legKey];
          saveState();
        }
        if (burntLegsState[legKey]) {
          delete burntLegsState[legKey];
          saveLegBurns();
        }
        if (outLegsState[legKey]) {
          delete outLegsState[legKey];
          saveLegOut();
        }
      }
      savePushedLegs();
      render();
      updateAlejandroLedger();
      filterCards();
      applyHideFulfilledLegs();
    }
    window.toggleLegPush = toggleLegPush;

    // Added 2026-09-21 (Andy request, S244 item 5): a fourth manual leg state for a
    // player who leaves the game injured/inactive (e.g. Alec Pierce) -- the leg is
    // effectively dead for grading purposes exactly like Burnt (it busts the ticket /
    // counts as lost in every downstream calc, since it sets burntLegsState too), but
    // is labeled and styled distinctly ("OUT" not "BURNT") so Andy can tell at a glance
    // *why* a leg died -- a missed prediction vs. a player who left hurt. Mutually
    // exclusive with checked/burnt/pushed.
    function toggleLegOut(legKey, ticketId, event) {
      if (event && event.stopPropagation) event.stopPropagation();
      if (OPEN_SLOT_LEG_KEYS.has(legKey)) return; // open slots are placeholders, not real picks
      const el = document.getElementById('leg-' + legKey);
      const isCurrentlyOut = !!outLegsState[legKey];
      if (!isCurrentlyOut && el) {
        if (el.classList.contains('pace-green')) {
          if (!confirm('This leg\\'s live/final stats show it HIT. Mark it Out/Inactive anyway?')) return;
        } else if (el.classList.contains('pace-push')) {
          if (!confirm('This leg is graded as a PUSH. Mark it Out/Inactive anyway? (This clears its Push status.)')) return;
        }
      }
      // (Andy, 2026-09-22) 🚑 Out is now purely informational -- it no longer also
      // marks the leg Burnt. The leg keeps tracking its real live stat progress (so you
      // can still watch how close the parlay gets) right up until the game actually ends;
      // mark it 🔥 Burnt yourself once it's officially failed, or let the normal
      // final-stat grading call it. Un-toggling Out here does NOT touch burntLegsState --
      // if the leg was separately marked Burnt (e.g. via 🔥), that status is untouched.
      if (isCurrentlyOut) {
        delete outLegsState[legKey];
      } else {
        outLegsState[legKey] = true;
      }
      saveLegOut();
      render();
      updateAlejandroLedger();
      filterCards();
      applyHideFulfilledLegs();
    }
    window.toggleLegOut = toggleLegOut;

    function toggleAlejandroSplit(ticketId) {
      splitState[ticketId] = !splitState[ticketId];
      saveSplits();
      render();
      updateAlejandroLedger();
      filterCards();
    }

    function toggleManualBurn(ticketId) {
      const config = TICKET_CONFIG[ticketId] || {};
      const currentBurnt = (manualBurns[ticketId] !== undefined) 
        ? (manualBurns[ticketId] === true) 
        : (config.isSettled && config.isLoss);
      manualBurns[ticketId] = !currentBurnt;
      if (manualBurns[ticketId]) {
        manualCashed[ticketId] = false;
        saveCashed();
      }
      saveBurns();
      render();
      updateAlejandroLedger();
      filterCards();
      applyHideFulfilledLegs();
    }
    window.toggleManualBurn = toggleManualBurn;

    function toggleManualCash(ticketId) {
      const config = TICKET_CONFIG[ticketId] || {};
      const currentCashed = (manualCashed[ticketId] !== undefined) 
        ? (manualCashed[ticketId] === true) 
        : (config.isSettled && config.isWin);
      const willBeCashed = !currentCashed;
      manualCashed[ticketId] = willBeCashed;
      if (willBeCashed) {
        manualBurns[ticketId] = false;
        saveBurns();
        (config.legs || []).forEach(lKey => {
          checkedState[lKey] = true;
          delete burntLegsState[lKey];
        });
        saveLegBurns();
        saveState();
      } else {
        (config.legs || []).forEach(lKey => {
          delete checkedState[lKey];
        });
        saveState();
      }
      saveCashed();
      render();
      updateAlejandroLedger();
      filterCards();
      applyHideFulfilledLegs();
    }
    window.toggleManualCash = toggleManualCash;

    function toggleHideBurnt(checked) {
      hideBurnt = checked;
      try { localStorage.setItem(HIDE_BURNT_KEY, JSON.stringify(hideBurnt)); } catch (e) {}
      filterCards();
    }
    window.toggleHideBurnt = toggleHideBurnt;

    function toggleHideCashed(checked) {
      hideCashed = checked;
      try { localStorage.setItem(HIDE_CASHED_KEY, JSON.stringify(hideCashed)); } catch (e) {}
      filterCards();
    }
    window.toggleHideCashed = toggleHideCashed;

    function showTab(tabName) {
      activeTab = tabName;
      try {
        localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
      } catch (e) {}

      const ticketsWrap = document.getElementById('tab-tickets-wrap');
      const playersWrap = document.getElementById('tab-players-wrap');
      const scWrap = document.getElementById('tab-supercontest-wrap');
      const fantasyWrap = document.getElementById('tab-fantasy-wrap');
      const futuresWrap = document.getElementById('tab-futures-wrap');
      const btnTickets = document.getElementById('tab-btn-tickets');
      const btnPlayers = document.getElementById('tab-btn-players');
      const btnSc = document.getElementById('tab-btn-supercontest');
      const btnFantasy = document.getElementById('tab-btn-fantasy');
      const btnFutures = document.getElementById('tab-btn-futures');

      if (ticketsWrap) ticketsWrap.style.display = tabName === 'tickets' ? 'block' : 'none';
      if (playersWrap) playersWrap.style.display = tabName === 'players' ? 'block' : 'none';
      if (scWrap) scWrap.style.display = tabName === 'supercontest' ? 'block' : 'none';
      if (fantasyWrap) fantasyWrap.style.display = tabName === 'fantasy' ? 'block' : 'none';
      if (futuresWrap) futuresWrap.style.display = tabName === 'futures' ? 'block' : 'none';

      if (btnTickets) {
        if (tabName === 'tickets') {
          btnTickets.classList.add('active');
        } else {
          btnTickets.classList.remove('active');
        }
      }
      if (btnPlayers) {
        if (tabName === 'players') {
          btnPlayers.classList.add('active');
        } else {
          btnPlayers.classList.remove('active');
        }
      }
      if (btnSc) {
        if (tabName === 'supercontest') {
          btnSc.classList.add('active');
        } else {
          btnSc.classList.remove('active');
        }
      }
      if (btnFantasy) {
        if (tabName === 'fantasy') {
          btnFantasy.classList.add('active');
        } else {
          btnFantasy.classList.remove('active');
        }
      }
      if (btnFutures) {
        if (tabName === 'futures') {
          btnFutures.classList.add('active');
        } else {
          btnFutures.classList.remove('active');
        }
      }

      if (tabName === 'players') {
        filterAndSortPlayers();
        partitionPlayers();
      }
      if (tabName === 'supercontest') {
        applySuperContestPicks();
      }
      if (tabName === 'fantasy') {
        filterAndRenderFantasy();
      }
    }
    window.showTab = showTab;

    // ── SUPERCONTEST INTERACTIVITY & CARD TRACKING ──
    function toggleSuperContestPick(teamAbbr) {
      if (!teamAbbr) return;
      const isSelected = !!scPicks[teamAbbr];
      if (!isSelected) {
        const count = Object.keys(scPicks).length;
        if (count >= 5) {
          showToast('⚠️ SuperContest Card Limit: Max 5 picks allowed on your card! Uncheck an existing pick first.');
          document.querySelectorAll('.sc-pick-checkbox[data-team="' + teamAbbr + '"]').forEach(cb => cb.checked = false);
          return;
        }
        scPicks[teamAbbr] = true;
      } else {
        delete scPicks[teamAbbr];
      }
      try {
        localStorage.setItem(SC_PICKS_KEY, JSON.stringify(scPicks));
        localStorage.setItem('sc_custom_user_override_week_${week}', '1');
      } catch (e) {}
      applySuperContestPicks();
      const newCount = Object.keys(scPicks).length;
      if (scPicks[teamAbbr]) {
        showToast('🎯 Added <strong>' + teamAbbr + '</strong> to SuperContest Card (' + newCount + '/5)');
      } else {
        showToast('Removed <strong>' + teamAbbr + '</strong> from SuperContest Card (' + newCount + '/5)');
      }
    }
    window.toggleSuperContestPick = toggleSuperContestPick;

    function applySuperContestPicks() {
      let lockedCardData = readJsonKey(SC_LOCKED_CARD_KEY, null);

      if (HAS_LOCKED_CARD && Array.isArray(SC_LOCKED_CARD_INITIAL) && SC_LOCKED_CARD_INITIAL.length > 0) {
        const officialTeams = SC_LOCKED_CARD_INITIAL.map(c => c && (c.team || c.pickTeam)).filter(Boolean);
        const currentTeams = (lockedCardData || []).map(c => c && (c.team || c.pickTeam)).filter(Boolean);
        const matchesOfficial = officialTeams.length === currentTeams.length && officialTeams.every(t => currentTeams.includes(t));
        if (!matchesOfficial && !localStorage.getItem('sc_custom_user_override_week_${week}')) {
          lockedCardData = SC_LOCKED_CARD_INITIAL;
          try {
            localStorage.setItem(SC_LOCKED_CARD_KEY, JSON.stringify(lockedCardData));
            const freshPicks = {};
            officialTeams.forEach(t => { freshPicks[t] = true; });
            localStorage.setItem(SC_PICKS_KEY, JSON.stringify(freshPicks));
            scPicks = freshPicks;
          } catch (e) {}
        }
      }

      let selectedTeams = [];

      if (Array.isArray(lockedCardData) && lockedCardData.length > 0) {
        selectedTeams = lockedCardData.map(c => c && (c.team || c.pickTeam)).filter(Boolean);
        scPicks = {};
        selectedTeams.forEach(t => { scPicks[t] = true; });
        try { localStorage.setItem(SC_PICKS_KEY, JSON.stringify(scPicks)); } catch (e) {}
      } else if (HAS_LOCKED_CARD && Array.isArray(SC_LOCKED_CARD_INITIAL) && SC_LOCKED_CARD_INITIAL.length > 0) {
        selectedTeams = SC_LOCKED_CARD_INITIAL.map(c => c && (c.team || c.pickTeam)).filter(Boolean);
        scPicks = {};
        selectedTeams.forEach(t => { scPicks[t] = true; });
      } else {
        selectedTeams = Object.keys(scPicks);
      }

      // If no picks in localStorage yet, fetch the locked card JSON from public/locked-card-week-${week}.json
      if (selectedTeams.length === 0 && !window._scLockedCardFetched) {
        window._scLockedCardFetched = true;
        fetch('locked-card-week-${week}.json')
          .then(r => r.ok ? r.json() : null)
          .then(diskData => {
            if (diskData && Array.isArray(diskData) && diskData.length > 0) {
              try { localStorage.setItem(SC_LOCKED_CARD_KEY, JSON.stringify(diskData)); } catch (e) {}
              applySuperContestPicks();
            }
          })
          .catch(() => {});
      }

      const count = selectedTeams.length;
      const countEl = document.getElementById('sc-card-selected-count');
      if (countEl) countEl.textContent = count;

      // Update checkboxes in Top 5 & Alternates & Matrix
      document.querySelectorAll('.sc-pick-checkbox').forEach(cb => {
        const team = cb.getAttribute('data-team');
        cb.checked = !!scPicks[team];
      });

      // Update Section 1 container based on locked picks
      const top5Container = document.getElementById('sc-top5-container');
      const headerTitle = document.getElementById('sc-top5-header-title');
      const headerSub = document.getElementById('sc-top5-header-sub');
      const headerBadge = document.getElementById('sc-top5-header-badge');
      const headerIcon = document.getElementById('sc-top5-header-icon');

      if (top5Container) {
        if (count > 0) {
          if (headerTitle) headerTitle.textContent = 'MY OFFICIAL LOCKED SUPERCONTEST CARD (' + count + '/5 PICKS)';
          if (headerSub) headerSub.textContent = 'Synchronized from SuperContest Portfolio • Official Locked Lines & Real-Time ATS Cover Status';
          if (headerBadge) {
            headerBadge.textContent = count + ' of 5 Locked';
            headerBadge.className = 'badge badge-cash';
          }
          if (headerIcon) headerIcon.textContent = '🎯';

          top5Container.innerHTML = selectedTeams.slice(0, 5).map((team, idx) => {
            const lockedItem = Array.isArray(lockedCardData) ? lockedCardData.find(c => c && c.team === team) : null;
            const matrixItem = SC_MATRIX.find(m => m.fav === team || m.dog === team);
            const rankItem = SC_RANKINGS_MAP[team] || null;

            const isFav = matrixItem ? matrixItem.fav === team : false;
            const rawOpponent = lockedItem?.opponent || (matrixItem ? (isFav ? matrixItem.dog : matrixItem.fav) : (rankItem?.opponent || 'OPP'));
            const isHome = lockedItem ? lockedItem.isHome : (matrixItem ? (team === matrixItem.fav ? matrixItem.favTeam === matrixItem.homeTeam : matrixItem.dogTeam === matrixItem.homeTeam) : (rankItem?.isHome ?? false));
            const rawSpreadLabel = lockedItem?.spreadLabel || (matrixItem ? (isFav ? (team + ' ' + (matrixItem.line > 0 ? '+' : '') + matrixItem.line) : (team + ' ' + (-matrixItem.line > 0 ? '+' : '') + (-matrixItem.line))) : (rankItem?.lockedSpread ? (team + ' ' + rankItem.lockedSpread) : team));
            const rawDkSpread = matrixItem?.dkSpread || rankItem?.dkSpread || '-';
            const rawClvText = matrixItem?.clvSummary || rankItem?.clvText || (lockedItem?.movementPoints ? ((lockedItem.movementPoints > 0 ? '+' : '') + lockedItem.movementPoints + ' pts CLV') : '0.0 CLV');
            const rawConsensus = rankItem?.consensus || 'Official Locked Pick';
            const rawReason = rankItem?.reason || ('Locked official contest pick on ' + team + ' (' + rawSpreadLabel + ') vs ' + rawOpponent + '.');

            const sTeam = escapeHtml(team);
            const sOpponent = escapeHtml(rawOpponent);
            const sSpreadLabel = escapeHtml(rawSpreadLabel);
            const sDkSpread = escapeHtml(rawDkSpread);
            const sClvText = escapeHtml(rawClvText);
            const sConsensus = escapeHtml(rawConsensus);
            const sReason = escapeHtml(rawReason);

            const sResult = SC_RESULT_BY_TEAM[team] || null;
            return '<div class="sc-card selected-pick" id="sc-card-' + sTeam + '" data-team="' + sTeam + '" data-sc-settled="' + (sResult ? 'true' : 'false') + '" data-sc-result="' + (sResult ? sResult.result : '') + '">' +

              '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                '<div style="display:flex; align-items:center; gap:10px;">' +
                  '<img src="https://a.espncdn.com/i/teamlogos/nfl/500/' + sTeam.toLowerCase() + '.png" class="sc-team-logo-lg" alt="' + sTeam + '" onerror="this.style.display=\\'none\\'">' +
                  '<div>' +
                    '<div style="display:flex; align-items:center; gap:6px;">' +
                      '<span class="sc-rank-badge" style="background:#059669; color:#ECFDF5; border:1px solid #10B981;">PICK #' + (idx + 1) + ' LOCKED</span>' +
                      '<span style="font-size:0.65rem; background:#1E293B; color:#94A3B8; padding:1px 6px; border-radius:4px; font-weight:700;">Official Card</span>' +
                    '</div>' +
                    '<div style="font-size:0.95rem; font-weight:900; color:#F8FAFC; margin-top:3px;">' +
                      sSpreadLabel +
                    '</div>' +
                    '<div style="font-size:0.7rem; color:var(--accent-cyan);">' +
                      sTeam + ' ' + (isHome ? 'vs' : '@') + ' ' + sOpponent + ' • Sunday Kickoff' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<label style="cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px; font-size:0.65rem; color:#94A3B8; user-select:none;">' +
                  '<input type="checkbox" class="sc-pick-checkbox" data-team="' + sTeam + '" checked onchange="toggleSuperContestPick(\\'' + sTeam + '\\')" style="width:18px; height:18px; cursor:pointer; accent-color:#3B82F6;">' +
                  '<span>My Card</span>' +
                '</label>' +
              '</div>' +
              '<div style="background:#0F172A; border:1px solid #1E293B; border-radius:6px; padding:8px 10px; font-size:0.72rem; display:flex; flex-direction:column; gap:4px; margin-top:10px;">' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:var(--text-muted);">Contest Locked Line:</span>' +
                  '<strong style="color:#FCD34D;">' + sSpreadLabel + '</strong>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:var(--text-muted);">Live DraftKings Spread:</span>' +
                  '<span style="color:#CBD5E1; font-weight:600;">' + sDkSpread + '</span>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:var(--text-muted);">CLV &amp; Line Value:</span>' +
                  '<span style="color:#34D399; font-weight:700;">' + sClvText + '</span>' +
                '</div>' +
              '</div>' +
              '<div style="font-size:0.72rem; color:#CBD5E1; line-height:1.35; background:rgba(15,23,42,0.6); border-radius:6px; padding:8px; margin-top:8px;">' +
                '<div style="font-weight:700; color:#A5B4FC; margin-bottom:3px; font-size:0.68rem;">' +
                  '🎯 ' + sConsensus +
                '</div>' +
                sReason +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #1E293B; padding-top:8px; margin-top:auto; cursor:pointer;" onclick="toggleScCardCollapse(\\'' + sTeam + '\\')" title="Click to collapse/expand once settled">' +
                '<div style="font-size:0.7rem; color:var(--text-muted);">' +
                  'Live Score: <strong style="color:#F8FAFC;" id="sc-score-' + sTeam + '">' + (sResult ? sResult.scoreText : '-') + '</strong>' +


                '</div>' +
                '<span class="sc-cover-badge ' + (sResult ? sResult.badgeClass : 'sc-cover-upcoming') + '" id="sc-cover-' + sTeam + '">' +
                  (sResult ? sResult.badgeText : '🕒 Upcoming') +
                '</span>' +
              '</div>' +
            '</div>';
          }).join('');
        } else {

          if (headerTitle) headerTitle.textContent = 'Official SuperContest Top 5 Portfolio (Executive Consensus Card)';
          if (headerSub) headerSub.textContent = 'Ranked by multi-show consensus weight, offensive/defensive line trench advantages, and key-number value';
          if (headerBadge) {
            headerBadge.textContent = 'Max 5 Card Entries';
            headerBadge.className = 'badge badge-open';
          }
          if (headerIcon) headerIcon.textContent = '⭐';

          top5Container.innerHTML = SC_TOP5_INITIAL.map(item => {
            const iResult = SC_RESULT_BY_TEAM[item.pickTeam] || null;
            return '<div class="sc-card" id="sc-card-' + item.pickTeam + '" data-team="' + item.pickTeam + '" data-sc-settled="' + (iResult ? 'true' : 'false') + '" data-sc-result="' + (iResult ? iResult.result : '') + '">' +

              '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                '<div style="display:flex; align-items:center; gap:10px;">' +
                  '<img src="https://a.espncdn.com/i/teamlogos/nfl/500/' + item.pickTeam.toLowerCase() + '.png" class="sc-team-logo-lg" alt="' + item.pickTeam + '" onerror="this.style.display=\\'none\\'">' +
                  '<div>' +
                    '<div style="display:flex; align-items:center; gap:6px;">' +
                      '<span class="sc-rank-badge">#' + item.rank + ' BEST BET</span>' +
                      '<span style="font-size:0.65rem; background:#1E293B; color:#94A3B8; padding:1px 6px; border-radius:4px; font-weight:700;">Grade: ' + item.grade + '</span>' +
                    '</div>' +
                    '<div style="font-size:0.95rem; font-weight:900; color:#F8FAFC; margin-top:3px;">' +
                      item.pickLabel +
                    '</div>' +
                    '<div style="font-size:0.7rem; color:var(--accent-cyan);">' +
                      item.pickTeam + ' ' + (item.isHome ? 'vs' : '@') + ' ' + item.opponent + ' • Sunday Kickoff' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<label style="cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px; font-size:0.65rem; color:#94A3B8; user-select:none;">' +
                  '<input type="checkbox" class="sc-pick-checkbox" data-team="' + item.pickTeam + '" onchange="toggleSuperContestPick(\\'' + item.pickTeam + '\\')" style="width:18px; height:18px; cursor:pointer; accent-color:#3B82F6;">' +
                  '<span>My Card</span>' +
                '</label>' +
              '</div>' +
              '<div style="background:#0F172A; border:1px solid #1E293B; border-radius:6px; padding:8px 10px; font-size:0.72rem; display:flex; flex-direction:column; gap:4px; margin-top:10px;">' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:var(--text-muted);">Contest Locked Line:</span>' +
                  '<strong style="color:#FCD34D;">' + item.lockedSpread + '</strong>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:var(--text-muted);">Live DraftKings Spread:</span>' +
                  '<span style="color:#CBD5E1; font-weight:600;">' + item.dkSpread + '</span>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:var(--text-muted);">CLV &amp; Line Value:</span>' +
                  '<span style="color:#34D399; font-weight:700;">' + item.clvText + '</span>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:var(--text-muted);">Model Edge:</span>' +
                  '<span style="color:var(--accent-cyan); font-weight:700;">' + item.modelEdge + '</span>' +
                '</div>' +
              '</div>' +
              '<div style="font-size:0.72rem; color:#CBD5E1; line-height:1.35; background:rgba(15,23,42,0.6); border-radius:6px; padding:8px; margin-top:8px;">' +
                '<div style="font-weight:700; color:#A5B4FC; margin-bottom:3px; font-size:0.68rem;">' +
                  '🎯 ' + item.consensus +
                '</div>' +
                item.reason +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #1E293B; padding-top:8px; margin-top:auto; cursor:pointer;" onclick="toggleScCardCollapse(\\'' + item.pickTeam + '\\')" title="Click to collapse/expand once settled">' +
                '<div style="font-size:0.7rem; color:var(--text-muted);">' +
                  'Live Score: <strong style="color:#F8FAFC;" id="sc-score-' + item.pickTeam + '">' + (iResult ? iResult.scoreText : '-') + '</strong>' +

                '</div>' +
                '<span class="sc-cover-badge ' + (iResult ? iResult.badgeClass : 'sc-cover-upcoming') + '" id="sc-cover-' + item.pickTeam + '">' +
                  (iResult ? iResult.badgeText : '🕒 Upcoming') +
                '</span>' +
              '</div>' +
            '</div>';
          }).join('');
        }
      }


      if (window._lastScoreboardEvents) {
        try { updateSuperContestLiveScores(window._lastScoreboardEvents); } catch (e) {}
      }

      // Update Top 5 cards highlight
      document.querySelectorAll('.sc-card').forEach(card => {
        const team = card.getAttribute('data-team');
        if (scPicks[team]) {
          card.classList.add('selected-pick');
        } else {
          card.classList.remove('selected-pick');
        }
      });

      // Update matrix table pick buttons
      document.querySelectorAll('.sc-matrix-pick-btn').forEach(btn => {
        const id = btn.id || '';
        const team = id.replace('sc-btn-pick-', '');
        if (scPicks[team]) {
          btn.classList.add('active');
          btn.style.borderColor = '#3B82F6';
          btn.style.background = 'rgba(59, 130, 246, 0.3)';
          btn.style.color = '#93C5FD';
        } else {
          btn.classList.remove('active');
          btn.style.borderColor = '';
          btn.style.background = '';
          btn.style.color = '';
        }
      });
    }
    window.applySuperContestPicks = applySuperContestPicks;

    function clearSuperContestPicks() {
      if (confirm("Clear your selected 5-pick SuperContest card?")) {
        scPicks = {};
        try { localStorage.removeItem(SC_PICKS_KEY); } catch (e) {}
        try { localStorage.removeItem(SC_LOCKED_CARD_KEY); } catch (e) {}
        applySuperContestPicks();
        showToast('🧹 SuperContest 5-pick card reset.');
      }
    }
    window.clearSuperContestPicks = clearSuperContestPicks;

    function setSuperContestFilter(filter) {
      scActiveFilter = filter;
      document.querySelectorAll('#sc-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('sc-filter-' + filter);
      if (activeBtn) activeBtn.classList.add('active');

      const top5Wrap = document.getElementById('sc-top5-section-wrap');
      const altsWrap = document.getElementById('sc-alternates-section-wrap');
      const matrixWrap = document.getElementById('sc-matrix-section-wrap');
      const rows = document.querySelectorAll('.sc-matrix-row');

      if (filter === 'all') {
        if (top5Wrap) top5Wrap.style.display = 'block';
        if (altsWrap) altsWrap.style.display = 'block';
        if (matrixWrap) matrixWrap.style.display = 'block';
        rows.forEach(r => r.style.display = '');
      } else if (filter === 'top5') {
        if (top5Wrap) top5Wrap.style.display = 'block';
        if (altsWrap) altsWrap.style.display = 'none';
        if (matrixWrap) matrixWrap.style.display = 'block';
        rows.forEach(r => {
          r.style.display = r.getAttribute('data-is-top5') === 'true' ? '' : 'none';
        });
      } else if (filter === 'alts') {
        if (top5Wrap) top5Wrap.style.display = 'none';
        if (altsWrap) altsWrap.style.display = 'block';
        if (matrixWrap) matrixWrap.style.display = 'block';
        rows.forEach(r => {
          r.style.display = r.getAttribute('data-is-alt') === 'true' ? '' : 'none';
        });
      } else if (filter === 'clv') {
        if (top5Wrap) top5Wrap.style.display = 'block';
        if (altsWrap) altsWrap.style.display = 'block';
        if (matrixWrap) matrixWrap.style.display = 'block';
        rows.forEach(r => {
          r.style.display = r.getAttribute('data-has-clv') === 'true' ? '' : 'none';
        });
      } else if (filter === 'sunday') {
        if (top5Wrap) top5Wrap.style.display = 'block';
        if (altsWrap) altsWrap.style.display = 'block';
        if (matrixWrap) matrixWrap.style.display = 'block';
        rows.forEach(r => {
          r.style.display = r.getAttribute('data-is-concluded') !== 'true' ? '' : 'none';
        });
      } else if (filter === 'concluded') {
        if (top5Wrap) top5Wrap.style.display = 'none';
        if (altsWrap) altsWrap.style.display = 'none';
        if (matrixWrap) matrixWrap.style.display = 'block';
        rows.forEach(r => {
          r.style.display = r.getAttribute('data-is-concluded') === 'true' ? '' : 'none';
        });
      }

      let visibleRowCount = 0;
      rows.forEach(r => { if (r.style.display !== 'none') visibleRowCount++; });
      const countEl = document.getElementById('sc-matrix-showing-count');
      if (countEl) countEl.textContent = 'Showing ' + visibleRowCount + ' of 16 Games';
    }
    let currentSbFilter = 'all';

    function filterLeftSidebarGames(filter) {
      currentSbFilter = filter;
      document.querySelectorAll('.sb-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === 'sb-filter-' + filter);
      });
      const cards = document.querySelectorAll('.game-mini-card');
      cards.forEach(card => {
        const st = card.getAttribute('data-status');
        if (filter === 'all') {
          card.style.display = '';
        } else if (filter === 'live') {
          card.style.display = (st === 'live') ? '' : 'none';
        } else if (filter === 'upcoming') {
          card.style.display = (st === 'upcoming') ? '' : 'none';
        } else if (filter === 'final') {
          card.style.display = (st === 'final') ? '' : 'none';
        }
      });
    }
    window.filterLeftSidebarGames = filterLeftSidebarGames;

    function updateLeftSidebarScoreboard(events) {
      if (!events || !Array.isArray(events)) return;
      let liveCount = 0;
      let upcomingCount = 0;
      let finalCount = 0;

      events.forEach(ev => {
        const comp = ev.competitions?.[0];
        if (!comp) return;
        const competitors = comp.competitors || [];
        const home = competitors.find(c => c.homeAway === 'home');
        const away = competitors.find(c => c.homeAway === 'away');
        if (!home || !away) return;

        const homeAbbr = (home.team?.abbreviation || '').toUpperCase();
        const awayAbbr = (away.team?.abbreviation || '').toUpperCase();
        const homeScore = parseInt(home.score ?? '-1', 10);
        const awayScore = parseInt(away.score ?? '-1', 10);

        const isCompleted = ev.status?.type?.completed === true || ev.status?.type?.name === 'STATUS_FINAL';
        const isLive = ev.status?.type?.state === 'in';
        const isPre = !isCompleted && !isLive;
        const clock = ev.status?.displayClock || '';
        const period = ev.status?.period || '';
        const shortDetail = ev.status?.type?.shortDetail || (isCompleted ? 'Final' : (isLive ? (clock + ' Q' + period) : ''));

        // Match card by id or by team abbreviations
        let card = document.getElementById('game-card-' + ev.id);
        if (!card) {
          card = document.querySelector('.game-mini-card[data-away="' + awayAbbr + '"][data-home="' + homeAbbr + '"]');
        }
        if (!card) return;

        const gameId = card.getAttribute('data-game-id');
        const statusType = isLive ? 'live' : (isCompleted ? 'final' : 'upcoming');
        card.setAttribute('data-status', statusType);

        if (isLive) {
          card.classList.add('is-live');
          card.classList.remove('is-final');
          liveCount++;
        } else if (isCompleted) {
          card.classList.remove('is-live');
          card.classList.add('is-final');
          finalCount++;
        } else {
          card.classList.remove('is-live');
          card.classList.remove('is-final');
          upcomingCount++;
        }

        // Status badge
        const statusEl = document.getElementById('sb-status-' + gameId);
        if (statusEl) {
          if (isLive) {
            statusEl.className = 'game-mini-status badge-live';
            statusEl.innerHTML = '🟢 ' + (shortDetail || (clock + ' Q' + period));
          } else if (isCompleted) {
            statusEl.className = 'game-mini-status badge-final';
            statusEl.textContent = 'FINAL';
          } else {
            statusEl.className = 'game-mini-status badge-pre';
            statusEl.textContent = shortDetail || 'Upcoming';
          }
        }

        // Scores
        const awayScoreEl = document.getElementById('sb-away-score-' + gameId);
        const homeScoreEl = document.getElementById('sb-home-score-' + gameId);
        if (awayScoreEl && awayScore >= 0) {
          awayScoreEl.textContent = awayScore;
          awayScoreEl.classList.toggle('leader', awayScore > homeScore);
        }
        if (homeScoreEl && homeScore >= 0) {
          homeScoreEl.textContent = homeScore;
          homeScoreEl.classList.toggle('leader', homeScore > awayScore);
        }

        // Possession & Situation (Field Position Bar & Direction)
        const sit = comp.situation;
        const awayBall = document.getElementById('sb-away-ball-' + gameId);
        const homeBall = document.getElementById('sb-home-ball-' + gameId);
        const sitEl = document.getElementById('sb-situation-' + gameId);
        const sitDownEl = document.getElementById('sb-sit-down-' + gameId);
        const sitYardEl = document.getElementById('sb-sit-yard-' + gameId);
        const sitArrowEl = document.getElementById('sb-sit-arrow-' + gameId);
        const ballMarkerEl = document.getElementById('sb-ball-marker-' + gameId);
        const arrowLeftEl = document.getElementById('sb-ball-arrow-left-' + gameId);
        const arrowRightEl = document.getElementById('sb-ball-arrow-right-' + gameId);

        if (sit && isLive) {
          const poss = String(sit.possession || '');
          const isHomeBall = poss === String(home.id) || poss.toUpperCase() === homeAbbr;
          const isAwayBall = poss === String(away.id) || poss.toUpperCase() === awayAbbr;
          if (homeBall) homeBall.style.display = isHomeBall ? 'inline' : 'none';
          if (awayBall) awayBall.style.display = isAwayBall ? 'inline' : 'none';

          if (sitEl) {
            sitEl.style.display = 'block';
            let sitDown = sit.shortDownDistanceText || sit.downDistanceText || '';
            if (sit.isRedZone) sitDown = '🚨 ' + sitDown;
            if (sitDownEl) sitDownEl.textContent = sitDown;

            // Field position: 0% is Away endzone, 100% is Home endzone
            let pct = 50;
            const pText = sit.possessionText || '';
            if (pText) {
              const m = pText.match(/([A-Z]{2,3})\s*(\d+)/i);
              if (m) {
                const pTeam = m[1].toUpperCase();
                const yard = parseInt(m[2], 10);
                if (pTeam === homeAbbr || pTeam === normalizeClientTeam(homeAbbr)) {
                  pct = 100 - yard;
                } else {
                  pct = yard;
                }
              } else if (pText.includes('50')) {
                pct = 50;
              }
            } else if (sit.yardLine != null) {
              const y = parseInt(sit.yardLine, 10);
              if (y >= 0 && y <= 100) {
                pct = isAwayBall ? (100 - y) : y;
              }
            }
            pct = Math.max(3, Math.min(97, pct));

            if (sitYardEl) sitYardEl.textContent = pText || (pct + ' yd line');

            // Direction: Away team drives to right (▶ toward Home), Home team drives to left (◀ toward Away)
            const drivingRight = isAwayBall;
            const drivingLeft = isHomeBall;

            if (sitArrowEl) sitArrowEl.textContent = drivingRight ? '▶' : (drivingLeft ? '◀' : '•');
            if (ballMarkerEl) ballMarkerEl.style.left = pct + '%';
            if (arrowLeftEl) arrowLeftEl.style.display = drivingLeft ? 'inline' : 'none';
            if (arrowRightEl) arrowRightEl.style.display = drivingRight ? 'inline' : 'none';
          }
        } else {
          if (homeBall) homeBall.style.display = 'none';
          if (awayBall) awayBall.style.display = 'none';
          if (sitEl) sitEl.style.display = 'none';
        }

        // Live cover status
        const coverEl = document.getElementById('sb-cover-' + gameId);
        if (coverEl && (isLive || isCompleted) && homeScore >= 0 && awayScore >= 0) {
          const lineText = document.getElementById('sb-line-' + gameId)?.textContent || '';
          const spreadMatch = lineText.match(/([A-Z]{2,3})\s+([+-]?\d+(\.\d+)?)/);
          if (spreadMatch) {
            const favTeam = spreadMatch[1];
            const spreadVal = parseFloat(spreadMatch[2]);
            const favScore = (favTeam === homeAbbr) ? homeScore : awayScore;
            const dogScore = (favTeam === homeAbbr) ? awayScore : homeScore;
            const margin = (favScore + spreadVal) - dogScore;
            if (margin > 0) {
              coverEl.innerHTML = '<span style="color:#10B981;">Cover: ' + favTeam + ' (+' + margin.toFixed(1) + ')</span>';
            } else if (margin < 0) {
              const dogTeam = (favTeam === homeAbbr) ? awayAbbr : homeAbbr;
              coverEl.innerHTML = '<span style="color:#10B981;">Cover: ' + dogTeam + ' (+' + (-margin).toFixed(1) + ')</span>';
            } else {
              coverEl.innerHTML = '<span style="color:#F59E0B;">Push</span>';
            }
          }
        }
      });

      // Update counters
      const liveBadge = document.getElementById('sb-count-live');
      if (liveBadge) liveBadge.textContent = liveCount;
      const upBadge = document.getElementById('sb-count-upcoming');
      if (upBadge) upBadge.textContent = upcomingCount;
      const finBadge = document.getElementById('sb-count-final');
      if (finBadge) finBadge.textContent = finalCount;

      // Sort sidebar cards so active/live are at top, upcoming in middle, final at bottom
      sortLeftSidebarGameCards();

      // Re-apply current active filter
      if (currentSbFilter !== 'all') {
        filterLeftSidebarGames(currentSbFilter);
      }
    }

    function updateLeftSidebarFromSchedule(schedList) {
      if (!schedList || !Array.isArray(schedList)) return;
      let liveCount = 0;
      let upcomingCount = 0;
      let finalCount = 0;

      schedList.forEach(g => {
        const isPost = g.status === 'post' || g.status === 'final';
        const isLive = g.status === 'in' || g.status === 'live';
        if (isLive) liveCount++;
        else if (isPost) finalCount++;
        else upcomingCount++;
      });

      const liveBadge = document.getElementById('sb-count-live');
      if (liveBadge) liveBadge.textContent = liveCount;
      const upBadge = document.getElementById('sb-count-upcoming');
      if (upBadge) upBadge.textContent = upcomingCount;
      const finBadge = document.getElementById('sb-count-final');
      if (finBadge) finBadge.textContent = finalCount;
      const allBadge = document.getElementById('sb-count-all');
      if (allBadge) allBadge.textContent = schedList.length;

      sortLeftSidebarGameCards();
    }

    function sortLeftSidebarGameCards() {
      const container = document.getElementById('scoreboard-container');
      if (!container) return;
      const cards = Array.from(container.querySelectorAll('.game-mini-card'));
      cards.sort((a, b) => {
        const stA = a.getAttribute('data-status');
        const stB = b.getAttribute('data-status');
        const rankA = (stA === 'live') ? 0 : ((stA === 'final') ? 2 : 1);
        const rankB = (stB === 'live') ? 0 : ((stB === 'final') ? 2 : 1);
        if (rankA !== rankB) return rankA - rankB;
        const tA = parseFloat(a.getAttribute('data-kickoff') || 9999999999999);
        const tB = parseFloat(b.getAttribute('data-kickoff') || 9999999999999);
        return tA - tB;
      });
      cards.forEach(c => container.appendChild(c));
    }
    window.sortLeftSidebarGameCards = sortLeftSidebarGameCards;

    // ── TICKET LEG ORDERING ──────────────────────────────────────────────
    // Legs render chronologically from the generator. At runtime we re-rank
    // them the same way the left game sidebar ranks its cards: whatever is in
    // progress floats to the top, not-yet-kicked legs sit in the middle, and
    // finished legs sink to the bottom. Chronological within each band.
    function legStatusRank(legEl) {
      const kickoff = parseFloat(legEl.getAttribute('data-kickoff') || '9999999999999');
      const abbrs = [];
      const gameLabel = legEl.getAttribute('data-game') || '';
      gameLabel.split(/\s*(?:@|vs\.?)\s*/i).forEach(part => {
        const a = (part || '').trim().toUpperCase();
        if (a && a.length <= 4) abbrs.push(a);
      });
      const teamAttr = (legEl.getAttribute('data-team') || '').trim().toUpperCase();
      if (teamAttr && teamAttr !== 'TOTAL') abbrs.push(teamAttr);

      const statusMap = window.latestTeamStatusMap || latestTeamStatusMap || {};
      for (const abbr of abbrs) {
        const info = statusMap[abbr];
        if (!info) continue;
        if (info.isLive) return 0;
        if (info.isCompleted || (info.statusDesc && info.statusDesc.toLowerCase().includes('final'))) return 2;
        return 1;
      }
      // No scoreboard entry yet (first paint, or a leg we could not map to a
      // game): fall back to the clock rather than stranding it at the top.
      if (!isFinite(kickoff) || kickoff >= 9999999999999) return 1;
      return Date.now() >= kickoff ? 0 : 1;
    }

    function sortTicketLegsByStatus() {
      document.querySelectorAll('.card-legs').forEach(container => {
        const legs = Array.from(container.querySelectorAll(':scope > .leg-item'));
        if (legs.length < 2) return;
        legs.sort((a, b) => {
          const rankA = legStatusRank(a);
          const rankB = legStatusRank(b);
          if (rankA !== rankB) return rankA - rankB;
          const kA = parseFloat(a.getAttribute('data-kickoff') || '9999999999999');
          const kB = parseFloat(b.getAttribute('data-kickoff') || '9999999999999');
          if (kA !== kB) return kA - kB;
          return 0;
        });
        // The fulfilled-legs strip is never in this list, so it keeps its spot
        // at the top of the container while the legs re-append beneath it.
        legs.forEach(l => container.appendChild(l));
      });
    }
    window.sortTicketLegsByStatus = sortTicketLegsByStatus;

    function updateSuperContestLiveScores(events) {
      if (!events || !Array.isArray(events)) return;
      window._lastScoreboardEvents = events;

      events.forEach(ev => {
        const comp = ev.competitions?.[0];
        if (!comp) return;
        const competitors = comp.competitors || [];
        const home = competitors.find(c => c.homeAway === 'home');
        const away = competitors.find(c => c.homeAway === 'away');
        if (!home || !away) return;

        const homeAbbr = (home.team?.abbreviation || '').toUpperCase();
        const awayAbbr = (away.team?.abbreviation || '').toUpperCase();
        const homeScore = parseInt(home.score ?? '-1', 10);
        const awayScore = parseInt(away.score ?? '-1', 10);
        const hasScores = homeScore >= 0 && awayScore >= 0;

        const isCompleted = ev.status?.type?.completed === true || ev.status?.type?.name === 'STATUS_FINAL';
        const isLive = ev.status?.type?.state === 'in';
        const clock = ev.status?.displayClock || '';
        const period = ev.status?.period || '';
        const shortDetail = ev.status?.type?.shortDetail || (isCompleted ? 'Final' : (isLive ? (clock + ' Q' + period) : ''));

        SC_MATRIX.forEach(g => {
          const isGame = (g.fav === homeAbbr && g.dog === awayAbbr) ||
                         (g.fav === awayAbbr && g.dog === homeAbbr);
          if (!isGame) return;

          const favScore = g.fav === homeAbbr ? homeScore : awayScore;
          const dogScore = g.dog === homeAbbr ? homeScore : awayScore;
          const favTeam = g.fav;
          const dogTeam = g.dog;
          const line = g.line;

          if (!hasScores) return;

          const favMargin = (favScore + line) - dogScore;
          const dogMargin = -favMargin;
          const scoreText = awayAbbr + ' ' + awayScore + ', ' + homeAbbr + ' ' + homeScore;

          const scoreEl = document.getElementById('sc-matrix-score-' + g.fav + '_' + g.dog);
          if (scoreEl) {
            scoreEl.textContent = isCompleted ? ('Final: ' + scoreText) : (shortDetail + ': ' + scoreText);
            scoreEl.style.color = '#F8FAFC';
          }

          const badgeEl = document.getElementById('sc-matrix-cover-' + g.fav + '_' + g.dog);
          if (badgeEl) {
            if (isCompleted) {
              if (favMargin > 0) {
                badgeEl.className = 'sc-cover-badge sc-cover-covering';
                badgeEl.innerHTML = '✅ ' + favTeam + ' (' + (line > 0 ? '+' + line : line) + ') Covered';
              } else if (favMargin < 0) {
                badgeEl.className = 'sc-cover-badge sc-cover-covering';
                badgeEl.innerHTML = '✅ ' + dogTeam + ' (' + (-line > 0 ? '+' + (-line) : -line) + ') Covered';
              } else {
                badgeEl.className = 'sc-cover-badge sc-cover-push';
                badgeEl.innerHTML = '🟡 PUSH (' + scoreText + ')';
              }
            } else if (isLive) {
              if (favMargin > 0) {
                badgeEl.className = 'sc-cover-badge sc-cover-covering';
                badgeEl.innerHTML = '🟢 ' + favTeam + ' +' + favMargin.toFixed(1) + ' (' + shortDetail + ')';
              } else if (favMargin < 0) {
                badgeEl.className = 'sc-cover-badge sc-cover-atrisk';
                badgeEl.innerHTML = '🔴 ' + dogTeam + ' +' + dogMargin.toFixed(1) + ' (' + shortDetail + ')';
              } else {
                badgeEl.className = 'sc-cover-badge sc-cover-push';
                badgeEl.innerHTML = '🟡 PUSH (' + shortDetail + ')';
              }
            }
          }

          [favTeam, dogTeam].forEach(team => {
            const cardScoreEl = document.getElementById('sc-score-' + team);
            const cardCoverEl = document.getElementById('sc-cover-' + team);
            if (!cardCoverEl) return;

            const myMargin = team === favTeam ? favMargin : dogMargin;

            if (cardScoreEl) {
              cardScoreEl.textContent = isCompleted ? ('Final: ' + scoreText) : (shortDetail + ': ' + scoreText);
            }

            const teamCardEl = document.getElementById('sc-card-' + team) || document.getElementById('sc-alt-' + team);
            if (isCompleted) {
              if (myMargin > 0) {
                cardCoverEl.className = 'sc-cover-badge sc-cover-covering';
                cardCoverEl.innerHTML = '✅ WON (+' + myMargin.toFixed(1) + ')';
                if (teamCardEl) { teamCardEl.setAttribute('data-sc-settled', 'true'); teamCardEl.setAttribute('data-sc-result', 'win'); }
              } else if (myMargin < 0) {
                cardCoverEl.className = 'sc-cover-badge sc-cover-atrisk';
                cardCoverEl.innerHTML = '❌ LOST (' + myMargin.toFixed(1) + ')';
                if (teamCardEl) { teamCardEl.setAttribute('data-sc-settled', 'true'); teamCardEl.setAttribute('data-sc-result', 'loss'); }
              } else {
                cardCoverEl.className = 'sc-cover-badge sc-cover-push';
                cardCoverEl.innerHTML = '🟡 PUSH';
                if (teamCardEl) { teamCardEl.setAttribute('data-sc-settled', 'true'); teamCardEl.setAttribute('data-sc-result', 'push'); }
              }
            } else if (isLive) {

              if (myMargin > 0) {
                cardCoverEl.className = 'sc-cover-badge sc-cover-covering';
                cardCoverEl.innerHTML = '🟢 COVERING (+' + myMargin.toFixed(1) + ') • ' + shortDetail;
              } else if (myMargin < 0) {
                cardCoverEl.className = 'sc-cover-badge sc-cover-atrisk';
                cardCoverEl.innerHTML = '🔴 FAILING (' + myMargin.toFixed(1) + ') • ' + shortDetail;
              } else {
                cardCoverEl.className = 'sc-cover-badge sc-cover-push';
                cardCoverEl.innerHTML = '🟡 PUSH • ' + shortDetail;
              }
            }
          });
        });
      });
      try { applySuperContestSettledCards(); } catch (e) { console.warn(e); }
    }
    window.updateSuperContestLiveScores = updateSuperContestLiveScores;

    // ── SUPERCONTEST SETTLED-CARD COLLAPSE (Task 2: Red/Green collapsible cards,
    //    mirroring the Tickets-tab cashed/burnt pattern and the Player Cheat
    //    Sheet's collapsed cards, applied to My Card / Alternates picks) ──
    function saveScCardCollapsed() {
      try { localStorage.setItem(SC_CARD_COLLAPSE_KEY, JSON.stringify(scCardCollapsedState)); } catch (e) {}
    }

    function applySuperContestSettledCards() {
      document.querySelectorAll('.sc-card, .sc-alt-card').forEach(card => {
        const team = card.getAttribute('data-team');
        const settled = card.getAttribute('data-sc-settled') === 'true';
        const result = card.getAttribute('data-sc-result');

        card.classList.remove('sc-settled-win', 'sc-settled-loss', 'sc-settled-push');
        if (settled) {
          if (result === 'win') card.classList.add('sc-settled-win');
          else if (result === 'loss') card.classList.add('sc-settled-loss');
          else if (result === 'push') card.classList.add('sc-settled-push');
        }

        // Default-collapse once settled, same rule shape as applyHideFulfilledLegs():
        // respect an explicit user override if one exists, otherwise auto-collapse
        // settled picks and leave still-live/upcoming picks expanded.
        const explicit = scCardCollapsedState[team];
        const shouldCollapse = explicit !== undefined ? explicit : settled;
        card.classList.toggle('collapsed', !!shouldCollapse);
      });
    }
    window.applySuperContestSettledCards = applySuperContestSettledCards;

    function toggleScCardCollapse(team) {
      const card = document.getElementById('sc-card-' + team) || document.getElementById('sc-alt-' + team);
      const isCurrentlyCollapsed = card ? card.classList.contains('collapsed') : !!scCardCollapsedState[team];
      scCardCollapsedState[team] = !isCurrentlyCollapsed;
      saveScCardCollapsed();
      applySuperContestSettledCards();
    }
    window.toggleScCardCollapse = toggleScCardCollapse;


    // ── FANTASY FOOTBALL BENCH MONITOR & KICKER RADAR ──
    const FF_KEPT_KEY = 'nfl_live_tracker_ff_kept_v2';
    const FF_HIDE_KEPT_KEY = 'nfl_live_tracker_ff_hide_kept_v2';
    const FF_LEAGUE_COLLAPSE_KEY = 'nfl_live_tracker_ff_league_collapse_v2';
    const FF_CARD_COLLAPSE_KEY = 'nfl_live_tracker_ff_card_collapse_v2';
    const FF_LEAGUE_ORDER_KEY = 'nfl_live_tracker_ff_league_order_v1';

    let ffKeptState = {};
    let ffHideKept = true;
    let ffLeagueCollapseState = {};
    let ffCardCollapseState = {};
    let fantasyWindowFilter = 'all';
    let fantasyPriorityFilter = 'all';

    let athleteLiveStatsMap = ${JSON.stringify(boxscoreAthleteStats)};
    const lastBoxscoreFetchTime = {};
    // Seed with the build-time snapshot (see loadConcludedGameStats) so cards for
    // already-finished games render as final immediately on load, not only after a
    // live poll succeeds in the browser.
    let latestTeamStatusMap = ${JSON.stringify(initialTeamStatusMap)};
    // First-TD scorer per team abbr (build snapshot, refreshed by fetchSummaryForEvent).
    let firstTdByTeam = ${JSON.stringify(initialFirstTdByTeam || {})};
    ${ftdNormName.toString()}
    ${isFirstTdMarket.toString()}
    ${extractFirstTdFromSummary.toString()}
    ${registerFirstTd.toString()}
    ${firstTdLegState.toString()}


    function formatPlayerStatString(stats, pos, isConcluded) {
      const p = String(pos || '').toUpperCase();
      if (!stats) {
        return isConcluded ? 'Final • 0 touches recorded' : 'Pre-game • 0 touches';
      }
      const fpts = stats.fantasyPoints != null ? stats.fantasyPoints : (stats.fantasyPts != null ? stats.fantasyPts : null);
      const fptsSuffix = fpts != null ? (' • ⚡ ' + Number(fpts).toFixed(2) + ' Fantasy Pts') : '';

      if (p === 'QB') {
        const compAtt = stats.passCompAtt && stats.passCompAtt !== '0/0' ? stats.passCompAtt : (stats.passAtt ? ('0/' + stats.passAtt) : '0/0');
        let str = compAtt + ' Att • ' + (stats.passYds || 0) + ' Yds • ' + (stats.passTd || 0) + ' TD';
        if (stats.rushYds > 0) str += ' • ' + stats.rushYds + ' Rush Yds';
        return str + fptsSuffix;
      }
      if (['K'].includes(p)) {
        return (stats.fg || '0/0') + ' FG • ' + (stats.xp || '0/0') + ' XP • ' + (stats.pts || 0) + ' Pts' + fptsSuffix;
      }
      if (['LB', 'DB', 'DL', 'DE', 'DT', 'CB', 'S', 'DEF', 'D'].includes(p)) {
        return (stats.tkl || 0) + ' TKL • ' + (stats.sck || 0) + ' SCK • ' + (stats.int || 0) + ' INT' + fptsSuffix;
      }
      // Skill positions (RB / WR / TE / FLEX): Carries, Rush Yds, Rec / Tgt, Rec Yds, Total Yds, and TDs
      const totalYds = (stats.rushYds || 0) + (stats.recYds || 0);
      const totalTd = (stats.rushTd || 0) + (stats.recTd || 0);
      const touches = (stats.car || 0) + (stats.rec || 0);
      if (touches === 0 && (stats.tgt || 0) === 0 && totalYds === 0 && totalTd === 0) {
        return isConcluded ? ('Final • 0 touches recorded' + fptsSuffix) : 'Pre-game • 0 touches';
      }

      const parts = [];
      if (stats.car > 0 || stats.rushYds > 0 || p === 'RB') {
        parts.push((stats.car || 0) + ' Car');
        parts.push((stats.rushYds || 0) + ' Rush Yds');
      }
      if (stats.tgt > 0 || stats.rec > 0 || stats.recYds > 0 || p === 'WR' || p === 'TE') {
        parts.push((stats.rec || 0) + ' Rec / ' + (stats.tgt || 0) + ' Tgt');
        parts.push((stats.recYds || 0) + ' Rec Yds');
      }
      if ((stats.car > 0 || stats.rushYds > 0) && (stats.rec > 0 || stats.recYds > 0)) {
        parts.push(totalYds + ' Tot Yds');
      }
      parts.push(totalTd + ' TD');
      if (fpts != null) {
        parts.push('⚡ ' + Number(fpts).toFixed(2) + ' Fantasy Pts');
      }
      return parts.join(' • ');
    }

    async function fetchSummaryForEvent(eventId, isLive = false, isCompleted = false) {
      if (!eventId) return;
      const now = Date.now();
      const lastFetch = lastBoxscoreFetchTime[String(eventId)] || 0;
      if (isCompleted && lastFetch > 0) return;
      if (isLive && (now - lastFetch < 25000)) return;
      lastBoxscoreFetchTime[String(eventId)] = now;

      try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=' + eventId);
        if (!res.ok) return;
        const data = await res.json();
        try { registerFirstTd(firstTdByTeam, extractFirstTdFromSummary(data)); } catch (e) { /* non-fatal */ }
        if (data?.injuries) {
          data.injuries.forEach(t => {
            (t.injuries || []).forEach(inj => {
              const ath = inj.athlete;
              if (!ath) return;
              const dName = (ath.displayName || '').toLowerCase().trim();
              const fName = (ath.fullName || '').toLowerCase().trim();
              const sName = (ath.shortName || '').toLowerCase().trim();
              const noSuffix = dName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
              const cleanD = dName.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();
              const cleanNoSuff = noSuffix.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();
              const names = [dName, fName, sName, noSuffix, cleanD, cleanNoSuff].filter(Boolean);
              const status = inj.status || 'Injured';
              const detail = inj.details?.type || inj.details?.detail || '';
              const badgeStr = '🏥 ' + status + (detail ? ' (' + detail + ')' : '');
              names.forEach(n => {
                athleteInjuryMap[n] = badgeStr;
              });
            });
          });
        }
        if (!data?.boxscore?.players) return;
        for (const t of data.boxscore.players) {
          for (const statGroup of t.statistics || []) {
            const groupName = statGroup.name;
            for (const a of statGroup.athletes || []) {
              const ath = a.athlete;
              if (!ath) continue;
              const dName = (ath.displayName || '').toLowerCase().trim();
              const fName = (ath.fullName || '').toLowerCase().trim();
              const sName = (ath.shortName || '').toLowerCase().trim();
              const noSuffix = dName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
              const cleanD = dName.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();
              const cleanNoSuff = noSuffix.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();

              const names = [dName, fName, sName, noSuffix, cleanD, cleanNoSuff].filter(Boolean);
              const s = a.stats || [];
              names.forEach(n => {
                if (!athleteLiveStatsMap[n]) {
                  athleteLiveStatsMap[n] = {
                    passCompAtt: '0/0', passYds: 0, passTd: 0,
                    car: 0, rushYds: 0, rushTd: 0,
                    tgt: 0, rec: 0, recYds: 0, recTd: 0,
                    tkl: 0, sck: 0, int: 0,
                    fg: '0/0', xp: '0/0', pts: 0
                  };
                }
                const rec = athleteLiveStatsMap[n];
                if (groupName === 'passing') {
                  rec.passCompAtt = s[0] || '0/0';
                  rec.passAtt = parseInt((s[0] || '0/0').split('/')[1] || 0, 10);
                  rec.passComp = parseInt((s[0] || '0/0').split('/')[0] || 0, 10);
                  rec.passYds = parseInt(s[1] || 0, 10);
                  rec.passTd = parseInt(s[3] || 0, 10);
                  rec.passInt = parseInt(s[4] || 0, 10);
                } else if (groupName === 'rushing') {
                  rec.car = parseInt(s[0] || 0, 10);
                  rec.rushYds = parseInt(s[1] || 0, 10);
                  rec.rushTd = parseInt(s[3] || 0, 10);
                } else if (groupName === 'receiving') {
                  rec.rec = parseInt(s[0] || 0, 10);
                  rec.recYds = parseInt(s[1] || 0, 10);
                  rec.recTd = parseInt(s[3] || 0, 10);
                  rec.tgt = parseInt(s[5] || 0, 10);
                } else if (groupName === 'defensive') {
                  rec.tkl = parseInt(s[0] || 0, 10);
                  rec.sck = parseFloat(s[2] || 0);
                  rec.int = parseInt(s[6] || 0, 10);
                } else if (groupName === 'kicking') {
                  rec.fg = s[0] || '0/0';
                  rec.xp = s[3] || '0/0';
                  rec.pts = parseInt(s[4] || 0, 10);
                }

                // Compute Half-PPR fantasy points
                const fpts = (
                  (rec.passYds * 0.04) +
                  (rec.passTd * 4) +
                  (rec.rushYds * 0.1) +
                  (rec.rushTd * 6) +
                  (rec.rec * 0.5) +
                  (rec.recYds * 0.1) +
                  (rec.recTd * 6) +
                  (rec.tkl * 1.0) +
                  (rec.sck * 2.0) +
                  (rec.int * 2.0) +
                  (rec.pts || 0)
                );
                rec.fantasyPts = Number(fpts.toFixed(2));
              });
            }
          }
        }
        renderFantasyPlayerStats(latestTeamStatusMap);
        renderPlayerCheatSheetStats(latestTeamStatusMap);
        render();
      } catch (err) {
        console.warn('Could not fetch ESPN summary for event', eventId, err);
      }
    }

    function renderPlayerCheatSheetStats(teamStatusMap = {}) {
      const playerCards = document.querySelectorAll('.player-box-card');

      playerCards.forEach(card => {
        const pId = card.getAttribute('data-player-id');
        const pName = (card.getAttribute('data-player-name') || '').toLowerCase().trim();
        const baseName = pName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
        const cleanP = pName.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();
        const team = (card.getAttribute('data-team') || '').toUpperCase();
        const stats = athleteLiveStatsMap[pName] || athleteLiveStatsMap[baseName] || athleteLiveStatsMap[cleanP] || null;

        const info = teamStatusMap[team];
        const isFinal = info ? (info.isCompleted || (info.statusDesc && info.statusDesc.toLowerCase().includes('final'))) : false;
        const isLive = info ? (info.isLive || (info.statusDesc && !isFinal && !info.statusDesc.toLowerCase().includes('pm') && !info.statusDesc.toLowerCase().includes('am') && !info.statusDesc.toLowerCase().includes('pre'))) : false;

        card.setAttribute('data-is-final', isFinal ? 'true' : 'false');
        card.setAttribute('data-is-live', isLive ? 'true' : 'false');

        const allGaugeItems = card.querySelectorAll('.sub-gauge-item');
        const gaugeItems = Array.from(allGaugeItems).filter(item => item.getAttribute('data-open-slot') !== '1');
        let propsHit = 0;
        let totalPct = 0;

        gaugeItems.forEach(item => {
          const pKey = item.getAttribute('data-prop-key');
          const legKey = item.getAttribute('data-leg-key') || pKey;
          const market = (item.getAttribute('data-market') || '').toLowerCase();
          const target = parseFloat(item.getAttribute('data-target') || 1);

          // First-TD legs grade on the game's actual first TD scorer, not "any TD".
          const ftdState = isFirstTdMarket(market) ? firstTdLegState(pName, team, market, firstTdByTeam) : null;
          let currentVal = 0;
          if (ftdState) {
            currentVal = ftdState.hit ? 1 : 0;
          } else if (stats) {
            // NOTE: the generic touchdown/td check below is gated with !market.includes('pass')
            // so it doesn't shadow the more specific "pass ... td" (passing TDs) branch further
            // down -- a bare .includes('td') matches the substring inside "Pass TDs" too, so
            // without the exclusion a QB's Passing TDs prop always fell through to
            // rushTd+recTd (almost always 0 for a passer) and could never show a real value.
            if ((market.includes('touchdown') || market.includes('td')) && !market.includes('pass')) {
              currentVal = (stats.rushTd || 0) + (stats.recTd || 0);
            } else if (market.includes('rush') && market.includes('yard')) {
              currentVal = stats.rushYds || 0;
            } else if (market.includes('rec') && market.includes('yard')) {
              currentVal = stats.recYds || 0;
            } else if (market.includes('reception')) {
              currentVal = stats.rec || 0;
            } else if (market.includes('carr') || market.includes('rush_att')) {
              currentVal = stats.car || 0;
            } else if (market.includes('pass') && (market.includes('att') || market.includes('attempt'))) {
              currentVal = stats.passAtt || 0;
            } else if (market.includes('pass') && market.includes('yard')) {
              currentVal = stats.passYds || 0;
            } else if (market.includes('pass') && (market.includes('td') || market.includes('touchdown'))) {
              currentVal = stats.passTd || 0;
            } else if (market.includes('interception') && (market.includes('thrown') || market.includes('pass'))) {
              currentVal = stats.passInt || 0;
            } else if (market.includes('interception')) {
              // Bare "interceptions" market (e.g. BEO "Penix 1+ Pass Interceptions" stored as
              // market=interceptions): a player with pass attempts is graded on INTs THROWN;
              // only non-passers fall back to defensive INTs. Before this, QB INT legs read
              // stats.int (defensive) and never moved off 0.
              currentVal = ((stats.passAtt || 0) > 0 || (stats.passInt || 0) > 0) ? (stats.passInt || 0) : (stats.int || 0);
            } else if (market.includes('tackle')) {
              currentVal = stats.tkl || 0;
            } else if (market.includes('sack')) {
              currentVal = stats.sck || 0;
            }
          }

          const isLegBurnt = !!burntLegsState[legKey] || !!burntLegsState[pKey] || !!(ftdState && ftdState.resolved && !ftdState.hit);
          const isLegOut = !!outLegsState[legKey] || !!outLegsState[pKey];
          const isLegChecked = !isLegBurnt && (!!checkedState[legKey] || !!checkedState[pKey]);
          const isHit = !isLegBurnt && (isLegChecked || (currentVal >= target));
          if (isHit) propsHit++;

          item.classList.toggle('sg-hit', isHit);
          item.classList.toggle('sg-burnt', isLegBurnt);
          item.classList.toggle('sg-out', isLegOut && !isLegBurnt);

          const pct = Math.min(100, Math.max(0, isLegBurnt ? 0 : (isLegChecked ? 100 : (target > 0 ? (currentVal / target) * 100 : 0))));
          totalPct += pct;

          const pstatEl = document.getElementById('pstat-' + pKey);
          const pbarEl = document.getElementById('pbar-' + pKey);

          if (pstatEl) {
            if (isLegBurnt) {
              pstatEl.innerHTML = currentVal + ' / ' + target + ' <span style="color:#EF4444;">🔥 Burnt</span>';
            } else if (isHit) {
              pstatEl.innerHTML = currentVal + ' / ' + target + ' <span style="color:#10B981;">✅</span>';
            } else if (isLegOut) {
              pstatEl.innerHTML = currentVal + ' / ' + target + ' <span style="color:#8B5CF6;">🚑 Out</span>';
            } else if (isFinal) {
              pstatEl.innerHTML = currentVal + ' / ' + target + ' <span style="color:#EF4444;">❌ Final</span>';
            } else {
              pstatEl.textContent = currentVal + ' / ' + target;
            }
          }
          if (pbarEl) {
            pbarEl.style.width = pct + '%';
            if (isLegBurnt) {
              pbarEl.className = 'progress-fill burnt';
            } else if (isHit) {
              pbarEl.className = 'progress-fill cashed';
            } else if (isFinal) {
              pbarEl.className = 'progress-fill burnt';
            } else {
              pbarEl.className = 'progress-fill';
            }
          }

          // Sync progress gauge to Main Tickerboard Card for this leg
          const cardStat = document.getElementById('card-stat-' + legKey) || document.getElementById('card-stat-' + pKey);
          const cardBar = document.getElementById('card-bar-' + legKey) || document.getElementById('card-bar-' + pKey);
          if (cardStat) {
            if (isHit) {
              cardStat.innerHTML = currentVal + ' / ' + target + ' <span style="color:#10B981;">✅</span>';
            } else if (isFinal) {
              cardStat.innerHTML = currentVal + ' / ' + target + ' <span style="color:#EF4444;">❌</span>';
            } else {
              cardStat.textContent = currentVal + ' / ' + target;
            }
          }
          if (cardBar) {
            cardBar.style.width = pct + '%';
            if (isHit) {
              cardBar.className = 'progress-fill cashed';
            } else if (isFinal) {
              cardBar.className = 'progress-fill burnt';
            } else {
              cardBar.className = 'progress-fill';
            }
          }
        });

        const totalProps = gaugeItems.length || 1;
        const avgPct = totalPct / totalProps;
        const isAllFulfilled = (propsHit === totalProps);

        card.setAttribute('data-fulfilled', isAllFulfilled ? 'true' : 'false');
        card.setAttribute('data-progress-pct', avgPct.toFixed(1));

        const statusEl = document.getElementById('player-status-' + pId);
        if (statusEl) {
          statusEl.textContent = propsHit + '/' + totalProps;
          if (isAllFulfilled) {
            statusEl.className = 'badge badge-open';
            statusEl.style.background = '#065F46';
            statusEl.style.color = '#A7F3D0';
          } else if (isFinal) {
            statusEl.className = 'badge badge-cash';
            statusEl.style.background = '#450A0A';
            statusEl.style.color = '#FCA5A5';
            statusEl.textContent = propsHit + '/' + totalProps + ' (Final)';
          } else {
            statusEl.className = 'badge badge-cash';
            statusEl.style.background = '';
            statusEl.style.color = '';
          }
        }

        if (isAllFulfilled) {
          card.classList.add('fulfilled');
        } else {
          card.classList.remove('fulfilled');
        }
      });

      // Direct update for all leg items on the main ticker cards
      document.querySelectorAll('.leg-item[data-player]').forEach(el => {
        const rawP = el.getAttribute('data-player');
        if (!rawP) return;
        const pName = rawP.toLowerCase().trim();
        const baseName = pName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
        const cleanP = pName.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();
        const stats = athleteLiveStatsMap[pName] || athleteLiveStatsMap[baseName] || athleteLiveStatsMap[cleanP] || null;

        const legKey = el.getAttribute('data-key');
        const market = (el.getAttribute('data-market') || '').toLowerCase();
        const target = parseFloat(el.getAttribute('data-target') || 1);

        const ftdState2 = isFirstTdMarket(market) ? firstTdLegState(pName, el.getAttribute('data-team'), market, firstTdByTeam) : null;
        const ftdLost2 = !!(ftdState2 && ftdState2.resolved && !ftdState2.hit);
        let currentVal = 0;
        if (ftdState2) {
          currentVal = ftdState2.hit ? 1 : 0;
        } else if (stats) {
          // See note above: exclude pass markets from the generic touchdown/td catch-all so
          // "Pass TDs" (which contains the substring "td") reaches the passTd branch below
          // instead of always resolving to rushTd+recTd (0 for a passer).
          if ((market.includes('touchdown') || market.includes('td')) && !market.includes('pass')) {
            currentVal = (stats.rushTd || 0) + (stats.recTd || 0);
          } else if (market.includes('rush') && market.includes('yard')) {
            currentVal = stats.rushYds || 0;
          } else if (market.includes('rec') && market.includes('yard')) {
            currentVal = stats.recYds || 0;
          } else if (market.includes('reception')) {
            currentVal = stats.rec || 0;
          } else if (market.includes('carr') || market.includes('rush_att')) {
            currentVal = stats.car || 0;
          } else if (market.includes('pass') && (market.includes('att') || market.includes('attempt'))) {
            currentVal = stats.passAtt || 0;
          } else if (market.includes('pass') && market.includes('yard')) {
            currentVal = stats.passYds || 0;
          } else if (market.includes('pass') && (market.includes('td') || market.includes('touchdown'))) {
            currentVal = stats.passTd || 0;
          } else if (market.includes('interception') && (market.includes('thrown') || market.includes('pass'))) {
            currentVal = stats.passInt || 0;
          } else if (market.includes('interception')) {
            // Bare "interceptions" market (e.g. BEO "Penix 1+ Pass Interceptions" stored as
            // market=interceptions): a player with pass attempts is graded on INTs THROWN;
            // only non-passers fall back to defensive INTs. Before this, QB INT legs read
            // stats.int (defensive) and never moved off 0.
            currentVal = ((stats.passAtt || 0) > 0 || (stats.passInt || 0) > 0) ? (stats.passInt || 0) : (stats.int || 0);
          } else if (market.includes('tackle')) {
            currentVal = stats.tkl || 0;
          } else if (market.includes('sack')) {
            currentVal = stats.sck || 0;
          }
        }

        const isLegChecked = !!checkedState[legKey];
        const isHit = !ftdLost2 && (isLegChecked || (currentVal >= target));
        const pct = Math.min(100, Math.max(0, isLegChecked ? 100 : (target > 0 ? (currentVal / target) * 100 : 0)));

        const cardStat = document.getElementById('card-stat-' + legKey);
        const cardBar = document.getElementById('card-bar-' + legKey);
        if (cardStat) {
          if (ftdLost2) {
            cardStat.innerHTML = '1st TD: ' + escapeHtml(ftdState2.label) + ' <span style="color:#EF4444;">🔥 Burnt</span>';
          } else if (isHit) {
            cardStat.innerHTML = currentVal + ' / ' + target + ' <span style="color:#10B981;">✅</span>';
          } else {
            cardStat.textContent = currentVal + ' / ' + target;
          }
        }
        if (cardBar) {
          cardBar.style.width = pct + '%';
          cardBar.className = isHit ? 'progress-fill cashed' : 'progress-fill';
        }
      });

      if (activePlayerSort === 'gametime') {
        filterAndSortPlayers();
      } else {
        partitionPlayers();
      }
      try {
        updateAllLegPacingGrades(window._lastScoreboardEvents);
      } catch (e) {}
    }

    function renderFantasyStatProgressBars(stats, pos) {
      const p = String(pos || '').toUpperCase();
      if (!stats) stats = {};
      const bars = [];
      if (p === 'QB') {
        const passYds = stats.passYds || 0;
        const passTd = stats.passTd || 0;
        const rushYds = stats.rushYds || 0;
        bars.push({ label: 'Pass Yds', val: passYds, target: 250, unit: 'yds' });
        bars.push({ label: 'Pass TD', val: passTd, target: 2, unit: 'TD' });
        if (rushYds > 0) bars.push({ label: 'Rush Yds', val: rushYds, target: 25, unit: 'yds' });
      } else if (p === 'RB') {
        const car = stats.car || 0;
        const rushYds = stats.rushYds || 0;
        const rec = stats.rec || 0;
        const td = (stats.rushTd || 0) + (stats.recTd || 0);
        bars.push({ label: 'Carries', val: car, target: 15, unit: 'car' });
        bars.push({ label: 'Rush Yds', val: rushYds, target: 60, unit: 'yds' });
        bars.push({ label: 'Rec', val: rec, target: 3, unit: 'rec' });
        bars.push({ label: 'TD', val: td, target: 1, unit: 'TD' });
      } else if (p === 'WR' || p === 'TE') {
        const tgt = stats.tgt || 0;
        const rec = stats.rec || 0;
        const recYds = stats.recYds || 0;
        const td = (stats.rushTd || 0) + (stats.recTd || 0);
        bars.push({ label: 'Targets', val: tgt, target: 6, unit: 'tgt' });
        bars.push({ label: 'Catches', val: rec, target: 4, unit: 'rec' });
        bars.push({ label: 'Rec Yds', val: recYds, target: 50, unit: 'yds' });
        bars.push({ label: 'TD', val: td, target: 1, unit: 'TD' });
      } else if (p === 'K') {
        bars.push({ label: 'Points', val: stats.pts || 0, target: 8, unit: 'pts' });
      } else {
        bars.push({ label: 'Tackles', val: stats.tkl || 0, target: 6, unit: 'tkl' });
      }
      return bars.map(b => {
        const pct = Math.min(100, Math.max(0, b.target > 0 ? (b.val / b.target) * 100 : 0));
        const isHit = b.val >= b.target;
        return '<div style="margin-bottom:4px;">' +
          '<div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#94A3B8;">' +
            '<span>' + b.label + '</span>' +
            '<strong style="color:' + (isHit ? '#10B981' : '#F8FAFC') + ';">' + b.val + ' / ' + b.target + ' ' + b.unit + (isHit ? ' ✅' : '') + '</strong>' +
          '</div>' +
          '<div class="progress-bar-wrap" style="height:4px; margin-top:2px; background:#1E293B; border-radius:999px; overflow:hidden;">' +
            '<div class="progress-fill ' + (isHit ? 'cashed' : '') + '" style="width:' + pct + '%;"></div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    window.renderFantasyStatProgressBars = renderFantasyStatProgressBars;

    function sortAllLeagueEvalPlayers() {
      document.querySelectorAll('.ff-league-group').forEach(group => {
        const benchGrid = group.querySelector('.ff-bench-grid');
        if (!benchGrid) return;
        const cards = Array.from(benchGrid.querySelectorAll('.ff-player-card'));
        cards.sort((a, b) => {
          const winA = a.getAttribute('data-window') || '';
          const winB = b.getAttribute('data-window') || '';
          const teamA = (a.getAttribute('data-team') || '').toUpperCase();
          const teamB = (b.getAttribute('data-team') || '').toUpperCase();
          const infoA = latestTeamStatusMap[teamA];
          const infoB = latestTeamStatusMap[teamB];
          const isDoneA = (winA === 'concluded') || (infoA && (infoA.isCompleted || (infoA.statusDesc && infoA.statusDesc.toLowerCase().includes('final'))));
          const isDoneB = (winB === 'concluded') || (infoB && (infoB.isCompleted || (infoB.statusDesc && infoB.statusDesc.toLowerCase().includes('final'))));
          const isLiveA = infoA && infoA.isLive;
          const isLiveB = infoB && infoB.isLive;

          const rankA = isLiveA ? 0 : (isDoneA ? 2 : 1);
          const rankB = isLiveB ? 0 : (isDoneB ? 2 : 1);
          if (rankA !== rankB) return rankA - rankB;

          const winOrder = { 'early': 1, 'afternoon': 2, 'snf': 3, 'mnf': 4, 'concluded': 5 };
          return (winOrder[winA] || 9) - (winOrder[winB] || 9);
        });
        cards.forEach(c => benchGrid.appendChild(c));
      });
    }
    window.sortAllLeagueEvalPlayers = sortAllLeagueEvalPlayers;

    function renderFantasyPlayerStats(teamStatusMap = {}) {
      const cards = document.querySelectorAll('.ff-player-card');
      cards.forEach(card => {
        const cardKey = card.getAttribute('data-card-key');
        const team = (card.getAttribute('data-team') || '').toUpperCase();
        const pName = (card.getAttribute('data-player-name') || '').toLowerCase().trim();
        const baseName = pName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
        const stats = athleteLiveStatsMap[pName] || athleteLiveStatsMap[baseName] || null;
        const info = teamStatusMap[team];
        const isDone = info ? (info.isCompleted || (info.statusDesc && info.statusDesc.startsWith('Final'))) : false;

        const pstat = document.getElementById('ff-pstat-' + cardKey);
        if (pstat) {
          pstat.textContent = formatPlayerStatString(stats, card.getAttribute('data-pos'), isDone);
        }

        // Live Fantasy Points Blue Badge & Header
        const liveFpts = stats ? (stats.fantasyPts != null ? stats.fantasyPts : (stats.fantasyPoints != null ? stats.fantasyPoints : null)) : null;
        const fptsBadge = document.getElementById('ff-fpts-badge-' + cardKey);
        if (fptsBadge && liveFpts != null) {
          fptsBadge.textContent = '⚡ ' + Number(liveFpts).toFixed(2) + ' PTS';
          fptsBadge.style.display = 'inline-block';
        }
        const fptsText = document.getElementById('ff-fpts-text-' + cardKey);
        if (fptsText && liveFpts != null) {
          fptsText.textContent = '⚡ ' + Number(liveFpts).toFixed(2) + ' Fantasy Pts';
          fptsText.style.display = 'inline-block';
        }

        const progWrap = document.getElementById('ff-prog-wrap-' + cardKey);
        if (progWrap) {
          progWrap.innerHTML = renderFantasyStatProgressBars(stats, card.getAttribute('data-pos'));
        }

        const injuryEl = document.getElementById('ff-injury-' + cardKey);
        const injText = athleteInjuryMap[pName] || athleteInjuryMap[baseName] || '';
        if (injuryEl) {
          if (injText) {
            injuryEl.textContent = injText;
            injuryEl.style.display = 'inline-flex';
          } else {
            injuryEl.style.display = 'none';
          }
        }
      });

      const starterCards = document.querySelectorAll('.ff-starter-card');
      starterCards.forEach(card => {
        const cardKey = card.getAttribute('data-card-key');
        const team = (card.getAttribute('data-team') || '').toUpperCase();
        const pName = (card.getAttribute('data-player-name') || '').toLowerCase().trim();
        const baseName = pName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
        const pstat = document.getElementById('ff-starter-pstat-' + cardKey);
        const stats = athleteLiveStatsMap[pName] || athleteLiveStatsMap[baseName] || null;
        const info = teamStatusMap[team];
        const isDone = info ? (info.isCompleted || (info.statusDesc && info.statusDesc.startsWith('Final'))) : false;
        if (pstat) {
          pstat.textContent = formatPlayerStatString(stats, card.getAttribute('data-pos'), isDone);
        }
        const starterFptsEl = document.getElementById('ff-starter-fpts-' + cardKey);
        if (starterFptsEl) {
          const liveFpts = stats ? (stats.fantasyPts != null ? stats.fantasyPts : (stats.fantasyPoints != null ? stats.fantasyPoints : null)) : null;
          if (liveFpts != null) {
            starterFptsEl.textContent = '⚡ ' + Number(liveFpts).toFixed(2) + ' Fantasy Pts';
            starterFptsEl.style.display = 'inline-block';
          }
        }
      });

      sortAllLeagueEvalPlayers();
    }

    function loadFantasyState() {
      ffKeptState = readJsonKey(FF_KEPT_KEY, {});
      ffHideKept = readJsonKey(FF_HIDE_KEPT_KEY, true);
      ffLeagueCollapseState = readJsonKey(FF_LEAGUE_COLLAPSE_KEY, {});
      ffCardCollapseState = readJsonKey(FF_CARD_COLLAPSE_KEY, {});

      const chkHide = document.getElementById('ff-chk-hide-kept');
      if (chkHide) chkHide.checked = !!ffHideKept;

      try { applyLeagueCollapseState(); } catch (e) { console.warn(e); }
      try { applyCardCollapseState(); } catch (e) { console.warn(e); }
      try { applyKeptState(); } catch (e) { console.warn(e); }
    }

    function applyLeagueCollapseState() {
      Object.entries(ffLeagueCollapseState).forEach(([cleanKey, isCollapsed]) => {
        const bodyEl = document.getElementById('ff-league-body-' + cleanKey);
        const btnEl = document.getElementById('btn-collapse-' + cleanKey);
        if (bodyEl) {
          if (isCollapsed) bodyEl.classList.add('collapsed');
          else bodyEl.classList.remove('collapsed');
        }
        if (btnEl) btnEl.textContent = isCollapsed ? '⯈' : '⯆';
      });
    }

    function applyCardCollapseState() {
      Object.entries(ffCardCollapseState).forEach(([cardKey, isCollapsed]) => {
        const bodyEl = document.getElementById('ff-card-body-' + cardKey);
        const btnEl = document.getElementById('btn-card-toggle-' + cardKey);
        if (bodyEl) {
          if (isCollapsed) bodyEl.classList.add('collapsed');
          else bodyEl.classList.remove('collapsed');
        }
        if (btnEl) btnEl.textContent = isCollapsed ? '⯈' : '⯆';
      });
    }

    function saveLeagueOrder() {
      const container = document.getElementById('ff-leagues-container');
      if (!container) return;
      const groups = Array.from(container.querySelectorAll('.ff-league-group')).map(g => g.id);
      try {
        localStorage.setItem(FF_LEAGUE_ORDER_KEY, JSON.stringify(groups));
      } catch (e) {}
    }

    function restoreLeagueOrder() {
      try {
        const order = readJsonKey(FF_LEAGUE_ORDER_KEY, null);
        const container = document.getElementById('ff-leagues-container');
        if (!container || !Array.isArray(order)) return;
        order.forEach(id => {
          const group = document.getElementById(id);
          if (group && group.parentElement === container) {
            container.appendChild(group);
          }
        });
      } catch (e) {}
    }
    window.restoreLeagueOrder = restoreLeagueOrder;

    function moveLeagueOrder(cleanLeagueKey, direction, event) {
      if (event) event.stopPropagation();
      const group = document.getElementById('ff-league-group-' + cleanLeagueKey);
      if (!group) return;
      const container = group.parentElement;
      if (!container) return;

      const children = Array.from(container.querySelectorAll('.ff-league-group'));
      const idx = children.indexOf(group);
      if (idx === -1) return;

      if (direction < 0 && idx > 0) {
        container.insertBefore(group, children[idx - 1]);
        saveLeagueOrder();
        showToast('Moved league up');
      } else if (direction > 0 && idx < children.length - 1) {
        container.insertBefore(group, children[idx + 1].nextSibling);
        saveLeagueOrder();
        showToast('Moved league down');
      }
    }
    window.moveLeagueOrder = moveLeagueOrder;

    function setupLeagueDragAndDrop() {
      const container = document.getElementById('ff-leagues-container');
      if (!container) return;
      const groups = container.querySelectorAll('.ff-league-group');

      groups.forEach(group => {
        if (group.dataset.dndBound) return;
        group.dataset.dndBound = 'true';
        group.setAttribute('draggable', 'true');

        group.addEventListener('dragstart', (e) => {
          if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('.ff-player-card') || e.target.closest('.ff-starter-card') || e.target.closest('details')) {
            e.preventDefault();
            return;
          }
          group.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', group.id);
        });

        group.addEventListener('dragend', () => {
          group.classList.remove('dragging');
          container.querySelectorAll('.ff-league-group').forEach(g => g.classList.remove('drag-over'));
          saveLeagueOrder();
        });

        group.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          group.classList.add('drag-over');
        });

        group.addEventListener('dragleave', () => {
          group.classList.remove('drag-over');
        });

        group.addEventListener('drop', (e) => {
          e.preventDefault();
          group.classList.remove('drag-over');
          const draggedId = e.dataTransfer.getData('text/plain');
          const draggedGroup = document.getElementById(draggedId);
          if (draggedGroup && draggedGroup !== group && draggedGroup.parentElement === container) {
            const children = Array.from(container.children);
            const draggedIdx = children.indexOf(draggedGroup);
            const targetIdx = children.indexOf(group);
            if (draggedIdx !== -1 && targetIdx !== -1) {
              if (draggedIdx < targetIdx) {
                container.insertBefore(draggedGroup, group.nextSibling);
              } else {
                container.insertBefore(draggedGroup, group);
              }
              saveLeagueOrder();
              showToast('Reordered league groupings');
            }
          }
        });
      });
    }
    window.setupLeagueDragAndDrop = setupLeagueDragAndDrop;

    function toggleLeagueCollapse(cleanKey) {
      const bodyEl = document.getElementById('ff-league-body-' + cleanKey);
      const btnEl = document.getElementById('btn-collapse-' + cleanKey);
      const isCurrentlyCollapsed = bodyEl ? bodyEl.classList.contains('collapsed') : false;
      const nextState = !isCurrentlyCollapsed;

      ffLeagueCollapseState[cleanKey] = nextState;
      try { localStorage.setItem(FF_LEAGUE_COLLAPSE_KEY, JSON.stringify(ffLeagueCollapseState)); } catch(e) {}

      if (bodyEl) {
        if (nextState) bodyEl.classList.add('collapsed');
        else bodyEl.classList.remove('collapsed');
      }
      if (btnEl) btnEl.textContent = nextState ? '⯈' : '⯆';
    }
    window.toggleLeagueCollapse = toggleLeagueCollapse;

    function expandAllLeagues(expand) {
      const bodies = document.querySelectorAll('.ff-league-body');
      bodies.forEach(body => {
        const cleanKey = body.id.replace('ff-league-body-', '');
        ffLeagueCollapseState[cleanKey] = !expand;
        if (expand) body.classList.remove('collapsed');
        else body.classList.add('collapsed');
        const btn = document.getElementById('btn-collapse-' + cleanKey);
        if (btn) btn.textContent = expand ? '⯆' : '⯈';
      });
      try { localStorage.setItem(FF_LEAGUE_COLLAPSE_KEY, JSON.stringify(ffLeagueCollapseState)); } catch(e) {}
    }
    window.expandAllLeagues = expandAllLeagues;

    function togglePlayerCardCollapse(cardKey) {
      const bodyEl = document.getElementById('ff-card-body-' + cardKey);
      const btnEl = document.getElementById('btn-card-toggle-' + cardKey);
      const isCurrentlyCollapsed = bodyEl ? bodyEl.classList.contains('collapsed') : false;
      const nextState = !isCurrentlyCollapsed;

      ffCardCollapseState[cardKey] = nextState;
      try { localStorage.setItem(FF_CARD_COLLAPSE_KEY, JSON.stringify(ffCardCollapseState)); } catch(e) {}

      if (bodyEl) {
        if (nextState) bodyEl.classList.add('collapsed');
        else bodyEl.classList.remove('collapsed');
      }
      if (btnEl) btnEl.textContent = nextState ? '⯈' : '⯆';
    }
    window.togglePlayerCardCollapse = togglePlayerCardCollapse;

    function expandAllCards(expand) {
      const bodies = document.querySelectorAll('.ff-card-body');
      bodies.forEach(body => {
        const cardKey = body.id.replace('ff-card-body-', '');
        ffCardCollapseState[cardKey] = !expand;
        if (expand) body.classList.remove('collapsed');
        else body.classList.add('collapsed');
        const btn = document.getElementById('btn-card-toggle-' + cardKey);
        if (btn) btn.textContent = expand ? '⯆' : '⯈';
      });
      try { localStorage.setItem(FF_CARD_COLLAPSE_KEY, JSON.stringify(ffCardCollapseState)); } catch(e) {}
    }
    window.expandAllCards = expandAllCards;

    function toggleKeepPlayer(cardKey, event) {
      if (event) event.stopPropagation();
      const current = !!ffKeptState[cardKey];
      ffKeptState[cardKey] = !current;
      try { localStorage.setItem(FF_KEPT_KEY, JSON.stringify(ffKeptState)); } catch(e) {}
      applyKeptState();
      filterAndRenderFantasy();
      showToast(ffKeptState[cardKey] ? '🔒 Player Locked In (Decided NOT to drop)' : '🔓 Player Unlocked (Back to drop evaluation)');
    }
    window.toggleKeepPlayer = toggleKeepPlayer;

    function toggleHideKept(checked) {
      ffHideKept = checked;
      try { localStorage.setItem(FF_HIDE_KEPT_KEY, JSON.stringify(ffHideKept)); } catch(e) {}
      filterAndRenderFantasy();
    }
    window.toggleHideKept = toggleHideKept;

    function applyKeptState() {
      let keptCount = 0;
      const cards = document.querySelectorAll('.ff-player-card');

      cards.forEach(card => {
        const cardKey = card.getAttribute('data-card-key');
        if (!cardKey) return;
        const isKept = !!ffKeptState[cardKey];
        const btn = document.getElementById('btn-keep-' + cardKey);
        const badge = document.getElementById('ff-badge-' + cardKey);

        if (isKept) {
          keptCount++;
          card.classList.add('is-kept');
          card.setAttribute('data-drop-priority', 'keep');
          if (btn) {
            btn.classList.add('is-kept');
            btn.innerHTML = '🔓 Kept';
            btn.title = 'Click to unlock / re-evaluate drop status';
          }
          if (badge) {
            badge.className = 'ff-drop-badge ff-drop-keep';
            badge.innerHTML = '🟢 Kept (Locked)';
          }
        } else {
          card.classList.remove('is-kept');
          if (card.getAttribute('data-drop-priority') === 'keep') {
            card.setAttribute('data-drop-priority', 'hold');
          }
          if (btn) {
            btn.classList.remove('is-kept');
            btn.innerHTML = '🔒 Keep';
            btn.title = 'Decided NOT to drop this player — lock in';
          }
          if (badge && badge.innerHTML.includes('Kept')) {
            badge.className = 'ff-drop-badge ff-drop-hold';
            badge.innerHTML = '🟡 Evaluating';
          }
        }
      });

      const keptCountEl = document.getElementById('ff-kept-count');
      const hiddenKeptBadge = document.getElementById('ff-hidden-kept-badge');
      if (keptCountEl) keptCountEl.textContent = keptCount;
      if (hiddenKeptBadge) hiddenKeptBadge.textContent = keptCount;
    }

    function setFantasyWindowFilter(win, btn) {
      fantasyWindowFilter = win;
      const bar = document.getElementById('ff-window-filter-bar');
      if (bar) bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      filterAndRenderFantasy();
    }
    window.setFantasyWindowFilter = setFantasyWindowFilter;

    function setFantasyPriorityFilter(pri, btn) {
      fantasyPriorityFilter = pri;
      const bar = document.getElementById('ff-priority-filter-bar');
      if (bar) bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      filterAndRenderFantasy();
    }
    window.setFantasyPriorityFilter = setFantasyPriorityFilter;

    function filterAndRenderFantasy() {
      const searchInput = document.getElementById('ff-search-input');
      const query = (searchInput?.value || '').trim().toLowerCase();
      const cards = document.querySelectorAll('.ff-player-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const cardKey = card.getAttribute('data-card-key');
        const isKept = !!ffKeptState[cardKey];
        const name = card.getAttribute('data-player-name') || '';
        const team = (card.getAttribute('data-team') || '').toLowerCase();
        const pos = (card.getAttribute('data-pos') || '').toLowerCase();
        const win = card.getAttribute('data-window') || '';
        const priority = card.getAttribute('data-drop-priority') || 'hold';

        if (isKept && ffHideKept) {
          card.style.display = 'none';
          return;
        }

        const matchesWindow = fantasyWindowFilter === 'all' || win === fantasyWindowFilter;
        const matchesPriority = fantasyPriorityFilter === 'all' || priority === fantasyPriorityFilter;
        const matchesSearch = !query || name.includes(query) || team.includes(query) || pos.includes(query);

        if (matchesWindow && matchesPriority && matchesSearch) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      const starterCards = document.querySelectorAll('.ff-starter-card');
      starterCards.forEach(card => {
        const name = card.getAttribute('data-player-name') || '';
        const team = (card.getAttribute('data-team') || '').toLowerCase();
        const pos = (card.getAttribute('data-pos') || '').toLowerCase();
        const matchesSearch = !query || name.includes(query) || team.includes(query) || pos.includes(query);
        card.style.display = matchesSearch ? '' : 'none';
      });

      const countEl = document.getElementById('ff-visible-bench-count');
      if (countEl) countEl.textContent = visibleCount;
    }
    window.filterAndRenderFantasy = filterAndRenderFantasy;

    async function refreshYahooFantasyRosters() {
      const btn = document.getElementById('btn-refresh-yahoo-fantasy');
      const origHtml = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.8';
        btn.innerHTML = '<span style="display:inline-block; animation:spinRefresh 0.75s linear infinite;">🔄</span> Syncing Yahoo Rosters...';
      }
      showToast('🏈 Connecting to Yahoo Fantasy API & pulling live rosters...');

      const serverBase = (window.location.protocol.startsWith('http') && (window.location.port === '4567' || window.location.port === '5180'))
        ? ''
        : 'http://127.0.0.1:4567';

      let syncSuccess = false;
      let errorMsg = '';

      try {
        const res = await fetch(serverBase + '/api/sync-yahoo-fantasy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) syncSuccess = true;
        }
      } catch (err) {
        errorMsg = err.message;
      }

      if (!syncSuccess) {
        try {
          const res2 = await fetch(serverBase + '/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: 'sync-fantasy' })
          });
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.ok) {
              showToast('⏳ Syncing 5 leagues in background... Preparing reload.');
              await new Promise(r => setTimeout(r, 9000));
              syncSuccess = true;
            }
          }
        } catch (err2) {
          errorMsg = err2.message;
        }
      }

      if (syncSuccess) {
        showToast('✅ Yahoo Fantasy Rosters updated! Reloading tracker...');
        try { localStorage.setItem(ACTIVE_TAB_KEY, 'fantasy'); } catch (e) {}
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.innerHTML = origHtml || '🔄 Refresh Yahoo Rosters';
        }
        showToast('⚠️ Could not connect to Toolbox server at 127.0.0.1:4567. Run: node scripts/sync-yahoo-fantasy.mjs in terminal.');
        console.warn('Sync fantasy error:', errorMsg);
      }
    }
    window.refreshYahooFantasyRosters = refreshYahooFantasyRosters;

    function updateFantasyLiveScores(events) {
      if (!events || !Array.isArray(events)) return;

      const teamStatusMap = {};
      let primeDropCount = 0;
      let priorityChanged = false;

      // Extract individual athlete leaders by category
      const athleteStatMap = {};

      events.forEach(ev => {
        try {
          const comp = ev?.competitions?.[0];
          if (!comp) return;

          const leadersList = Array.isArray(comp.leaders) ? comp.leaders : [];
          leadersList.forEach(ldr => {
            const cat = String(ldr?.name || '').toLowerCase();
            const innerLeaders = Array.isArray(ldr?.leaders) ? ldr.leaders : [];
            innerLeaders.forEach(leadItem => {
              const ath = leadItem?.athlete;
              if (!ath) return;
              const val = Number(leadItem.value) || 0;
              const disp = leadItem.displayValue || '';
              const rec = { val, disp, cat };

              const reg = (name) => {
                if (!name) return;
                const k = name.trim().toLowerCase();
                if (!athleteStatMap[k]) athleteStatMap[k] = {};
                athleteStatMap[k][cat] = rec;
              };

              reg(ath.displayName);
              reg(ath.fullName);
              reg(ath.shortName);
            });
          });

          const competitors = Array.isArray(comp.competitors) ? comp.competitors : [];
          const home = competitors.find(c => c && c.homeAway === 'home');
          const away = competitors.find(c => c && c.homeAway === 'away');
          if (!home || !away) return;

        const homeAbbr = (home.team?.abbreviation || '').toUpperCase();
        const awayAbbr = (away.team?.abbreviation || '').toUpperCase();
        const homeScore = parseInt(home.score ?? '-1', 10);
        const awayScore = parseInt(away.score ?? '-1', 10);

        const statusName = ev.status?.type?.name || '';
        const isCompleted = ev.status?.type?.completed === true || statusName === 'STATUS_FINAL';
        const isLive = ev.status?.type?.state === 'in';
        const isCanceled = statusName === 'STATUS_CANCELED' || statusName === 'STATUS_POSTPONED' || statusName === 'STATUS_SUSPENDED';
        const clock = ev.status?.displayClock || '';
        const period = ev.status?.period || 0;
        const isHalfOrLater = period >= 3 || ev.status?.type?.description === 'Halftime' || isCompleted;

        const scoreSummary = awayAbbr + ' ' + (awayScore >= 0 ? awayScore : 0) + ' - ' + homeAbbr + ' ' + (homeScore >= 0 ? homeScore : 0);
        let statusDesc = isCompleted ? 'Final: ' + scoreSummary : (isLive ? (clock + ' Q' + period + ' • ' + scoreSummary) : (ev.status?.type?.shortDetail || 'Upcoming'));
        if (isCanceled) statusDesc = ev.status?.type?.shortDetail || 'Postponed';

        const info = {
          isCompleted,
          isLive,
          isCanceled,
          isHalfOrLater,
          period,
          clock,
          statusDesc,
          scoreSummary
        };

        teamStatusMap[homeAbbr] = info;
        teamStatusMap[awayAbbr] = info;

        if (ev?.id && (isLive || isCompleted) && !fetchedBoxscores.has(String(ev.id))) {
          fetchSummaryForEvent(String(ev.id));
        }
      } catch (evErr) {
        void evErr;
      }
      });

      latestTeamStatusMap = teamStatusMap;
      window.latestTeamStatusMap = teamStatusMap;
      try { sortTicketLegsByStatus(); } catch (e) { console.warn('leg sort:', e); }

      // Update bench cards based on team game state
      const cards = document.querySelectorAll('.ff-player-card');
      cards.forEach(card => {
        const cardKey = card.getAttribute('data-card-key');
        const team = (card.getAttribute('data-team') || '').toUpperCase();
        const win = card.getAttribute('data-window') || '';
        const isKept = !!ffKeptState[cardKey];
        const clockEl = document.getElementById('ff-clock-' + cardKey);
        const badgeEl = document.getElementById('ff-badge-' + cardKey);
        const info = teamStatusMap[team];

        if (info && clockEl) {
          clockEl.textContent = info.statusDesc;
          if (info.isLive) clockEl.style.color = '#38BDF8';
          else if (info.isCompleted) clockEl.style.color = '#94A3B8';
        }

        if (isKept) return; // Kept players remain protected

        if (info && !info.isCanceled && (win === 'early' || win === 'afternoon') && (info.isCompleted || info.isHalfOrLater)) {
          if (card.getAttribute('data-drop-priority') !== 'prime') {
            card.setAttribute('data-drop-priority', 'prime');
            priorityChanged = true;
          }
          card.classList.remove('hold-drop');
          card.classList.add('prime-drop');
          primeDropCount++;

          if (badgeEl) {
            badgeEl.className = 'ff-drop-badge ff-drop-prime';
            badgeEl.innerHTML = '🔴 Prime Drop';
          }
        } else if (info && info.isLive) {
          if (badgeEl && !card.classList.contains('prime-drop')) {
            badgeEl.className = 'ff-drop-badge ff-drop-hold';
            badgeEl.innerHTML = '🟡 In Game (' + info.clock + ' Q' + info.period + ')';
          }
        }
      });

      // Update starter cards based on team game state
      const starterCards = document.querySelectorAll('.ff-starter-card');
      starterCards.forEach(card => {
        const cardKey = card.getAttribute('data-card-key');
        const team = (card.getAttribute('data-team') || '').toUpperCase();
        const clockEl = document.getElementById('ff-starter-clock-' + cardKey);
        const info = teamStatusMap[team];

        if (info && clockEl) {
          clockEl.textContent = info.statusDesc;
          if (info.isLive) clockEl.style.color = '#38BDF8';
          else if (info.isCompleted) clockEl.style.color = '#94A3B8';
        }
      });

      // Update all fantasy player volume & production stat strips
      renderFantasyPlayerStats(teamStatusMap);

      const primeCountEl = document.getElementById('ff-metric-prime-count');
      if (primeCountEl) primeCountEl.textContent = primeDropCount;

      if (priorityChanged) {
        filterAndRenderFantasy();
      }
    }
    window.updateFantasyLiveScores = updateFantasyLiveScores;

    const CLIENT_TEAM_MAP = {
      'ARIZONA': 'ARI', 'CARDINALS': 'ARI', 'ARI': 'ARI',
      'ATLANTA': 'ATL', 'FALCONS': 'ATL', 'ATL': 'ATL',
      'BALTIMORE': 'BAL', 'RAVENS': 'BAL', 'BAL': 'BAL',
      'BUFFALO': 'BUF', 'BILLS': 'BUF', 'BUF': 'BUF',
      'CAROLINA': 'CAR', 'PANTHERS': 'CAR', 'CAR': 'CAR',
      'CHICAGO': 'CHI', 'BEARS': 'CHI', 'CHI': 'CHI',
      'CINCINNATI': 'CIN', 'BENGALS': 'CIN', 'CIN': 'CIN',
      'CLEVELAND': 'CLE', 'BROWNS': 'CLE', 'CLE': 'CLE',
      'DALLAS': 'DAL', 'COWBOYS': 'DAL', 'DAL': 'DAL',
      'DENVER': 'DEN', 'BRONCOS': 'DEN', 'DEN': 'DEN',
      'DETROIT': 'DET', 'LIONS': 'DET', 'DET': 'DET',
      'GREEN BAY': 'GB', 'PACKERS': 'GB', 'GB': 'GB',
      'HOUSTON': 'HOU', 'TEXANS': 'HOU', 'HOU': 'HOU',
      'INDIANAPOLIS': 'IND', 'COLTS': 'IND', 'IND': 'IND',
      'JACKSONVILLE': 'JAX', 'JAGUARS': 'JAX', 'JAX': 'JAX', 'JAC': 'JAX',
      'KANSAS CITY': 'KC', 'CHIEFS': 'KC', 'KC': 'KC',
      'LAS VEGAS': 'LV', 'RAIDERS': 'LV', 'LV': 'LV',
      'LOS ANGELES CHARGERS': 'LAC', 'CHARGERS': 'LAC', 'LAC': 'LAC',
      'LOS ANGELES RAMS': 'LAR', 'RAMS': 'LAR', 'LAR': 'LAR', 'LA': 'LAR',
      'MIAMI': 'MIA', 'DOLPHINS': 'MIA', 'MIA': 'MIA',
      'MINNESOTA': 'MIN', 'VIKINGS': 'MIN', 'MIN': 'MIN',
      'NEW ENGLAND': 'NE', 'PATRIOTS': 'NE', 'NE': 'NE',
      'NEW ORLEANS': 'NO', 'SAINTS': 'NO', 'NO': 'NO',
      'NEW YORK GIANTS': 'NYG', 'GIANTS': 'NYG', 'NYG': 'NYG',
      'NEW YORK JETS': 'NYJ', 'JETS': 'NYJ', 'NYJ': 'NYJ',
      'PHILADELPHIA': 'PHI', 'EAGLES': 'PHI', 'PHI': 'PHI',
      'PITTSBURGH': 'PIT', 'STEELERS': 'PIT', 'PIT': 'PIT',
      'SAN FRANCISCO': 'SF', '49ERS': 'SF', 'SF': 'SF',
      'SEATTLE': 'SEA', 'SEAHAWKS': 'SEA', 'SEA': 'SEA',
      'TAMPA BAY': 'TB', 'BUCCANEERS': 'TB', 'BUCS': 'TB', 'TB': 'TB',
      'TENNESSEE': 'TEN', 'TITANS': 'TEN', 'TEN': 'TEN',
      'WASHINGTON': 'WAS', 'COMMANDERS': 'WAS', 'WAS': 'WAS', 'WSH': 'WAS'
    };
    function normalizeClientTeam(t) {
      if (!t) return '';
      const c = String(t).toUpperCase().trim();
      return CLIENT_TEAM_MAP[c] || c;
    }

    function updateAllLegPacingGrades(events) {
      if (!events || !Array.isArray(events)) {
        events = window._lastScoreboardEvents || [];
      }
      if (!events || !events.length) return;

      const eventMap = {};
      events.forEach(ev => {
        const comp = ev.competitions?.[0];
        if (!comp) return;
        const home = comp.competitors?.find(c => c.homeAway === 'home');
        const away = comp.competitors?.find(c => c.homeAway === 'away');
        if (!home || !away) return;
        const homeAbbr = normalizeClientTeam(home.team?.abbreviation);
        const awayAbbr = normalizeClientTeam(away.team?.abbreviation);
        const homeScore = parseInt(home.score ?? '-1', 10);
        const awayScore = parseInt(away.score ?? '-1', 10);
        const isCompleted = ev.status?.type?.completed === true || ev.status?.type?.name === 'STATUS_FINAL';
        const isLive = ev.status?.type?.state === 'in';
        const clock = ev.status?.displayClock || '';
        const period = ev.status?.period || 1;
        const shortDetail = ev.status?.type?.shortDetail || (isCompleted ? 'Final' : (isLive ? (clock + ' Q' + period) : ''));

        const evObj = {
          id: ev.id,
          homeAbbr,
          awayAbbr,
          homeScore,
          awayScore,
          isCompleted,
          isLive,
          clock,
          period,
          shortDetail
        };
        eventMap[homeAbbr] = evObj;
        eventMap[awayAbbr] = evObj;
        eventMap[awayAbbr + '_' + homeAbbr] = evObj;
        eventMap[homeAbbr + '_' + awayAbbr] = evObj;
      });

      document.querySelectorAll('.leg-item').forEach(el => {
        const legKey = el.getAttribute('data-key');
        const badge = document.getElementById('pace-badge-' + legKey);
        const isBurnt = !!burntLegsState[legKey] || el.classList.contains('leg-burnt');
        const isOut = !!outLegsState[legKey] || el.classList.contains('leg-out');
        const isChecked = !!checkedState[legKey] || el.classList.contains('checked');
        const isMissed = el.classList.contains('leg-missed');
        const isPushed = !!pushedLegsState[legKey] || el.classList.contains('leg-pushed');

        // 🚑 Out is independent of Burnt now (Andy, 2026-09-22) -- keep the purple
        // "out" tint synced regardless of which pace branch below ends up firing, so an
        // injured-but-not-yet-burnt leg still tracks its real live pace/progress.
        el.classList.toggle('leg-out', isOut);

        if (isPushed) {
          el.classList.remove('pace-green', 'pace-red', 'pace-yellow', 'pace-pre');
          el.classList.add('pace-push');
          if (badge) {
            badge.className = 'leg-pace-badge badge-pacing-push';
            badge.innerHTML = '⚖️ PUSH';
          }
          return;
        }
        if (isBurnt) {
          el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
          el.classList.add('pace-red', 'leg-burnt');
          if (isOut) el.classList.add('leg-out'); else el.classList.remove('leg-out');
          if (badge) {
            if (isOut) {
              badge.className = 'leg-pace-badge badge-pacing-out';
              badge.innerHTML = '🚑 OUT';
            } else {
              badge.className = 'leg-pace-badge badge-pacing-lost';
              badge.innerHTML = '❌ BURNT';
            }
          }
          return;
        }
        if (isChecked) {
          el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
          el.classList.add('pace-green', 'pace-hit');
          if (badge) {
            badge.className = 'leg-pace-badge badge-pacing-won';
            badge.innerHTML = '✅ HIT';
          }
          return;
        }
        if (isMissed) {
          el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
          el.classList.add('pace-red');
          if (badge) {
            badge.className = 'leg-pace-badge badge-pacing-lost';
            badge.innerHTML = '🔥 BURNT';
          }
          return;
        }

        const rawPlayer = el.getAttribute('data-player');
        const rawMarket = (el.getAttribute('data-market') || '').toLowerCase();
        const rawTeam = normalizeClientTeam(el.getAttribute('data-team'));
        const rawOpp = normalizeClientTeam(el.getAttribute('data-opp'));
        const rawGame = el.getAttribute('data-game') || '';
        const lineVal = parseFloat(el.getAttribute('data-line'));
        const targetVal = parseFloat(el.getAttribute('data-target') || '1');
        const kickoffText = el.getAttribute('data-kickoff-text') || 'Pre-game';

        // Find relevant event
        let ev = null;
        if (rawTeam && eventMap[rawTeam]) ev = eventMap[rawTeam];
        else if (rawOpp && eventMap[rawOpp]) ev = eventMap[rawOpp];
        else if (rawGame) {
          const parts = rawGame.split(/\s*[@vV][sS]?\.?\s*/);
          if (parts.length === 2) {
            const t1 = normalizeClientTeam(parts[0]);
            const t2 = normalizeClientTeam(parts[1]);
            ev = eventMap[t1 + '_' + t2] || eventMap[t1] || eventMap[t2];
          }
        }

        // Pre-game or missing event
        if (!ev || (!ev.isLive && !ev.isCompleted)) {
          el.classList.remove('pace-green', 'pace-red', 'pace-yellow');
          el.classList.add('pace-pre');
          if (badge) {
            badge.className = 'leg-pace-badge badge-pacing-pre';
            badge.textContent = kickoffText || 'Upcoming';
          }
          return;
        }

        const isHome = (ev.homeAbbr === rawTeam);
        const myScore = isHome ? ev.homeScore : ev.awayScore;
        const oppScore = isHome ? ev.awayScore : ev.homeScore;

        let minsElapsed = (ev.period - 1) * 15;
        if (ev.clock) {
          const cParts = ev.clock.split(':');
          if (cParts.length === 2) {
            const rem = parseInt(cParts[0], 10) + (parseInt(cParts[1], 10) / 60);
            minsElapsed += Math.max(0, 15 - rem);
          }
        }
        if (ev.isCompleted) minsElapsed = 60;
        minsElapsed = Math.max(1, Math.min(60, minsElapsed));

        // 1. PLAYER PROPS
        if (rawPlayer) {
          const pName = rawPlayer.toLowerCase().trim();
          const baseName = pName.replace(/\b(sr\.?|jr\.?|iii|ii|iv)\b/gi, '').trim();
          const cleanP = pName.replace(/['.\-]/g, '').replace(/\s+/g, ' ').trim();
          const stats = athleteLiveStatsMap[pName] || athleteLiveStatsMap[baseName] || athleteLiveStatsMap[cleanP] || null;

          // First-TD legs: decided the moment anyone scores the game's first TD.
          if (isFirstTdMarket(rawMarket)) {
            const fs3 = firstTdLegState(rawPlayer, rawTeam, rawMarket, firstTdByTeam);
            if (fs3.resolved) {
              el.classList.remove('pace-green', 'pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add(fs3.hit ? 'pace-green' : 'pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge ' + (fs3.hit ? 'badge-pacing-green' : 'badge-pacing-lost');
                badge.innerHTML = (fs3.hit ? '🟢 HIT' : '🔥 BURNT') + ' (1st TD: ' + escapeHtml(fs3.label) + ')';
              }
              return;
            }
            if (ev.isCompleted) {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-lost';
                badge.innerHTML = '🔥 BURNT (no TD scored)';
              }
              return;
            }
            el.classList.remove('pace-green', 'pace-red', 'pace-pre');
            el.classList.add('pace-yellow');
            if (badge) {
              badge.className = 'leg-pace-badge badge-pacing-yellow';
              badge.innerHTML = '🟡 In Play (no TD yet • Q' + ev.period + ')';
            }
            return;
          }

          let currentVal = 0;
          if (stats) {
            // Exclude pass markets from the generic touchdown/td catch-all -- "Pass TDs"
            // contains the substring "td" too, so without this exclusion a QB's Passing TDs
            // leg always fell through to rushTd+recTd (0 for almost every passer) and the
            // real passTd branch a few lines down was dead code for that market.
            if ((rawMarket.includes('touchdown') || rawMarket.includes('td')) && !rawMarket.includes('pass')) {
              currentVal = (stats.rushTd || 0) + (stats.recTd || 0);
            } else if (rawMarket.includes('rush') && rawMarket.includes('yard')) {
              currentVal = stats.rushYds || 0;
            } else if (rawMarket.includes('rec') && rawMarket.includes('yard')) {
              currentVal = stats.recYds || 0;
            } else if (rawMarket.includes('reception')) {
              currentVal = stats.rec || 0;
            } else if (rawMarket.includes('carr') || rawMarket.includes('rush_att')) {
              currentVal = stats.car || 0;
            } else if (rawMarket.includes('pass') && (rawMarket.includes('att') || rawMarket.includes('attempt'))) {
              currentVal = stats.passAtt || 0;
            } else if (rawMarket.includes('pass') && rawMarket.includes('yard')) {
              currentVal = stats.passYds || 0;
            } else if (rawMarket.includes('pass') && (rawMarket.includes('td') || rawMarket.includes('touchdown'))) {
              currentVal = stats.passTd || 0;
            } else if (rawMarket.includes('interception') && (rawMarket.includes('thrown') || rawMarket.includes('pass'))) {
              currentVal = stats.passInt || 0;
            } else if (rawMarket.includes('interception')) {
              // Bare "interceptions" market (e.g. BEO "Penix 1+ Pass Interceptions" stored as
              // market=interceptions): a player with pass attempts is graded on INTs THROWN;
              // only non-passers fall back to defensive INTs. Before this, QB INT legs read
              // stats.int (defensive) and never moved off 0.
              currentVal = ((stats.passAtt || 0) > 0 || (stats.passInt || 0) > 0) ? (stats.passInt || 0) : (stats.int || 0);
            } else if (rawMarket.includes('tackle')) {
              currentVal = stats.tkl || 0;
            } else if (rawMarket.includes('sack')) {
              currentVal = stats.sck || 0;
            }
          }

          if (currentVal >= targetVal) {
            el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
            el.classList.add('pace-green');
            if (badge) {
              badge.className = 'leg-pace-badge badge-pacing-green';
              badge.innerHTML = '🟢 HIT (' + currentVal + '/' + targetVal + ')';
            }
            return;
          }

          if (ev.isCompleted) {
            el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
            el.classList.add('pace-red');
            if (badge) {
              badge.className = 'leg-pace-badge badge-pacing-lost';
              badge.innerHTML = '🔥 BURNT (' + currentVal + '/' + targetVal + ')';
            }
            return;
          }

          const isTD = rawMarket.includes('touchdown') || rawMarket.includes('td');
          if (isTD) {
            if (minsElapsed >= 40) {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-red';
                badge.innerHTML = '⚠️ Bust Risk (' + currentVal + ' TD • Q' + ev.period + ')';
              }
            } else {
              el.classList.remove('pace-green', 'pace-red', 'pace-pre');
              el.classList.add('pace-yellow');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-yellow';
                badge.innerHTML = '🟡 In Play (' + currentVal + ' TD • Q' + ev.period + ')';
              }
            }
          } else {
            const paceProjection = (currentVal / minsElapsed) * 60;
            if (paceProjection >= targetVal * 1.05) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-green';
                badge.innerHTML = '🟢 On Pace (' + currentVal + '/' + targetVal + ' • Proj ' + Math.round(paceProjection) + ')';
              }
            } else if (minsElapsed >= 22 && paceProjection < targetVal * 0.65) {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-red';
                badge.innerHTML = '⚠️ Bust Risk (' + currentVal + '/' + targetVal + ' • Proj ' + Math.round(paceProjection) + ')';
              }
            } else {
              el.classList.remove('pace-green', 'pace-red', 'pace-pre');
              el.classList.add('pace-yellow');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-yellow';
                badge.innerHTML = '🟡 In Play (' + currentVal + '/' + targetVal + ' • Q' + ev.period + ')';
              }
            }
          }
          return;
        }

        // 2. GAME LINES: SPREAD, MONEYLINE, TOTAL
        const isSpread = rawMarket === 'spread' || (!isNaN(lineVal) && (rawMarket === '' || rawMarket === 'game'));
        const isML = rawMarket === 'moneyline' || rawMarket.includes('ml');
        // Team total (e.g. "BUF total points Over 30.5") is its own market -- it must be
        // checked before/separately from the game-total check below, which never matched it
        // (rawMarket is literally "team_total", which contains neither "total" alone nor
        // "over"/"under"), so team total legs always fell through with no live update at all
        // and stayed frozen at whatever their pre-game/0 default was.
        const isTeamTotal = rawMarket === 'team_total' || (rawMarket.includes('team') && rawMarket.includes('total'));
        const isTotal = !isTeamTotal && (rawMarket === 'total' || rawMarket.includes('under') || rawMarket.includes('over'));

        if (isSpread && !isNaN(lineVal)) {
          const cushion = (myScore + lineVal) - oppScore;
          const deficit = oppScore - myScore;

          if (ev.isCompleted) {
            if (cushion > 0) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-won';
                badge.innerHTML = '✅ Covered (+' + cushion.toFixed(1) + ')';
              }
            } else if (cushion < 0) {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-lost';
                badge.innerHTML = '❌ Failed (' + cushion.toFixed(1) + ')';
              }
            } else {
              el.classList.remove('pace-green', 'pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-push');
              pushedLegsState[legKey] = true;
              savePushedLegs();
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-push';
                badge.innerHTML = '⚖️ PUSH (0.0)';
              }
            }
            return;
          }

          // Live Spread: e.g. CLE +10 down 24-0 to JAX -> cushion is -14 -> BUST RISK
          if (cushion <= -7 || (deficit >= 14 && cushion < 0)) {
            el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
            el.classList.add('pace-red');
            if (badge) {
              badge.className = 'leg-pace-badge badge-pacing-red';
              badge.innerHTML = '⚠️ Down ' + deficit + ' (Bust Risk)';
            }
          } else if (cushion >= 3.5) {
            el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
            el.classList.add('pace-green');
            if (badge) {
              badge.className = 'leg-pace-badge badge-pacing-green';
              badge.innerHTML = '🟢 Covering (+' + cushion.toFixed(1) + ')';
            }
          } else {
            el.classList.remove('pace-green', 'pace-red', 'pace-pre');
            el.classList.add('pace-yellow');
            if (badge) {
              badge.className = 'leg-pace-badge badge-pacing-yellow';
              badge.innerHTML = '🟡 Live (' + ev.awayAbbr + ' ' + ev.awayScore + '-' + ev.homeScore + ' ' + ev.homeAbbr + ')';
            }
          }
          return;
        }

        if (isML) {
          const diff = myScore - oppScore;
          if (ev.isCompleted) {
            if (diff > 0) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-won';
                badge.innerHTML = '✅ Won (' + myScore + '-' + oppScore + ')';
              }
            } else {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-lost';
                badge.innerHTML = '❌ Lost (' + myScore + '-' + oppScore + ')';
              }
            }
            return;
          }

          // Live Moneyline
          if (diff > 0) {
            el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
            el.classList.add('pace-green');
            if (badge) {
              badge.className = 'leg-pace-badge badge-pacing-green';
              badge.innerHTML = '🟢 Leading (' + myScore + '-' + oppScore + ')';
            }
          } else if (diff <= -10) {
            el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
            el.classList.add('pace-red');
            if (badge) {
              badge.className = 'leg-pace-badge badge-pacing-red';
              badge.innerHTML = '⚠️ Down ' + Math.abs(diff) + ' (Bust Risk)';
            }
          } else {
            el.classList.remove('pace-green', 'pace-red', 'pace-pre');
            el.classList.add('pace-yellow');
            if (badge) {
              badge.className = 'leg-pace-badge badge-pacing-yellow';
              badge.innerHTML = '🟡 Trailing (' + myScore + '-' + oppScore + ')';
            }
          }
          return;
        }

        if (isTeamTotal && !isNaN(lineVal)) {
          const curTot = myScore;
          const isOver = rawMarket.includes('over') || (el.getAttribute('data-selection') || '').toLowerCase().includes('over');
          if (ev.isCompleted) {
            const hit = isOver ? (curTot > lineVal) : (curTot < lineVal);
            if (hit) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-won';
                badge.innerHTML = '✅ Hit (' + rawTeam + ' ' + curTot + ')';
              }
            } else if (curTot === lineVal) {
              el.classList.remove('pace-green', 'pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-push');
              pushedLegsState[legKey] = true;
              savePushedLegs();
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-push';
                badge.innerHTML = '⚖️ PUSH (' + rawTeam + ' ' + curTot + ')';
              }
            } else {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-lost';
                badge.innerHTML = '🔥 Burnt (' + rawTeam + ' ' + curTot + ')';
              }
            }
            return;
          }

          // Live Team Total: pace this team's score alone (not the combined game total)
          const projTeamTot = (curTot / minsElapsed) * 60;
          if (isOver) {
            if (projTeamTot >= lineVal + 4) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-green';
                badge.innerHTML = '🟢 On Pace Over (' + rawTeam + ' ' + curTot + ' • Proj ' + Math.round(projTeamTot) + ')';
              }
            } else if (minsElapsed >= 25 && projTeamTot <= lineVal - 7) {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-red';
                badge.innerHTML = '⚠️ Under Pace (Bust Risk)';
              }
            } else {
              el.classList.remove('pace-green', 'pace-red', 'pace-pre');
              el.classList.add('pace-yellow');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-yellow';
                badge.innerHTML = '🟡 Live ' + rawTeam + ' ' + curTot + ' (Proj ' + Math.round(projTeamTot) + ')';
              }
            }
          } else {
            // Under
            if (projTeamTot <= lineVal - 4) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-green';
                badge.innerHTML = '🟢 On Pace Under (' + rawTeam + ' ' + curTot + ' • Proj ' + Math.round(projTeamTot) + ')';
              }
            } else if (minsElapsed >= 25 && projTeamTot >= lineVal + 7) {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-red';
                badge.innerHTML = '⚠️ Over Pace (Bust Risk)';
              }
            } else {
              el.classList.remove('pace-green', 'pace-red', 'pace-pre');
              el.classList.add('pace-yellow');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-yellow';
                badge.innerHTML = '🟡 Live ' + rawTeam + ' ' + curTot + ' (Proj ' + Math.round(projTeamTot) + ')';
              }
            }
          }
          return;
        }

        if (isTotal && !isNaN(lineVal)) {
          const curTot = ev.homeScore + ev.awayScore;
          const isOver = rawMarket.includes('over') || (el.getAttribute('data-selection') || '').toLowerCase().includes('over');

          // Once the current combined score has already crossed the line, the outcome is
          // mathematically locked in -- NFL scores never decrease within a game, so an Over
          // leg that has already cleared the number is a guaranteed Hit right now (no need to
          // wait for final / a pace projection), and an Under leg that has already been
          // crossed is already Busted, win or lose on the rest of the game.
          if (!ev.isCompleted && curTot > lineVal) {
            if (isOver) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-won';
                badge.innerHTML = '✅ Hit (' + curTot + ')';
              }
            } else {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-lost';
                badge.innerHTML = '🔥 Burnt (' + curTot + ')';
              }
            }
            return;
          }

          if (ev.isCompleted) {
            const hit = isOver ? (curTot > lineVal) : (curTot < lineVal);
            if (hit) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-won';
                badge.innerHTML = '✅ Hit (' + curTot + ')';
              }
            } else if (curTot === lineVal) {
              el.classList.remove('pace-green', 'pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-push');
              pushedLegsState[legKey] = true;
              savePushedLegs();
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-push';
                badge.innerHTML = '⚖️ PUSH (' + curTot + ')';
              }
            } else {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-lost';
                badge.innerHTML = '🔥 Burnt (' + curTot + ')';
              }
            }
            return;
          }

          // Live Total
          const projTot = (curTot / minsElapsed) * 60;
          if (isOver) {
            if (projTot >= lineVal + 4) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-green';
                badge.innerHTML = '🟢 On Pace Over (' + curTot + ' • Proj ' + Math.round(projTot) + ')';
              }
            } else if (minsElapsed >= 25 && projTot <= lineVal - 7) {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-red';
                badge.innerHTML = '⚠️ Under Pace (Bust Risk)';
              }
            } else {
              el.classList.remove('pace-green', 'pace-red', 'pace-pre');
              el.classList.add('pace-yellow');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-yellow';
                badge.innerHTML = '🟡 Live Tot ' + curTot + ' (Proj ' + Math.round(projTot) + ')';
              }
            }
          } else {
            // Under
            if (projTot <= lineVal - 4) {
              el.classList.remove('pace-red', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-green');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-green';
                badge.innerHTML = '🟢 On Pace Under (' + curTot + ' • Proj ' + Math.round(projTot) + ')';
              }
            } else if (minsElapsed >= 25 && projTot >= lineVal + 7) {
              el.classList.remove('pace-green', 'pace-yellow', 'pace-pre');
              el.classList.add('pace-red');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-red';
                badge.innerHTML = '⚠️ Over Pace (Bust Risk)';
              }
            } else {
              el.classList.remove('pace-green', 'pace-red', 'pace-pre');
              el.classList.add('pace-yellow');
              if (badge) {
                badge.className = 'leg-pace-badge badge-pacing-yellow';
                badge.innerHTML = '🟡 Live Tot ' + curTot + ' (Proj ' + Math.round(projTot) + ')';
              }
            }
          }
          return;
        }
      });

      // Update bullet summary and color temperature for each ticket card
      for (const [tId, cfg] of Object.entries(TICKET_CONFIG)) {
        const card = document.getElementById('card-' + tId);
        if (!card) continue;
        const legEls = Array.from(card.querySelectorAll('.leg-item')).filter(el => el.getAttribute('data-open-slot') !== '1' && !el.classList.contains('leg-open-slot'));
        const totalLegs = legEls.length;
        let wonCount = 0;
        let lostCount = 0;
        let pacingGreenCount = 0;
        let pacingRedCount = 0;
        let pacingYellowCount = 0;
        let pacingPreCount = 0;

        legEls.forEach(el => {
          const legKey = el.getAttribute('data-key');
          const isWon = !!checkedState[legKey] || el.classList.contains('checked') || el.classList.contains('pace-hit');
          const isBurnt = !!burntLegsState[legKey] || el.classList.contains('leg-burnt');
          const isMissed = el.classList.contains('leg-missed');
          const isPaceRed = el.classList.contains('pace-red');
          const isPaceGreen = el.classList.contains('pace-green');
          const isPaceYellow = el.classList.contains('pace-yellow');

          if (isWon) wonCount++;
          else if (isBurnt || isMissed || isPaceRed) {
            lostCount++;
            pacingRedCount++;
          } else if (isPaceGreen) pacingGreenCount++;
          else if (isPaceYellow) pacingYellowCount++;
          else pacingPreCount++;
        });

        const hitBadge = document.getElementById('bullet-hits-' + tId);
        if (hitBadge) hitBadge.textContent = wonCount + '/' + totalLegs + ' Hits';

        const tempBadge = document.getElementById('bullet-temp-' + tId);
        card.classList.remove('temp-green', 'temp-red', 'temp-yellow', 'temp-pre');

        if (wonCount === totalLegs && totalLegs > 0) {
          card.classList.add('temp-green');
          if (tempBadge) {
            tempBadge.className = 'bullet-temp-badge bullet-temp-green';
            tempBadge.innerHTML = '✅ Cashed';
          }
        } else if (lostCount > 0 || card.classList.contains('burnt')) {
          card.classList.add('temp-red');
          if (tempBadge) {
            tempBadge.className = 'bullet-temp-badge bullet-temp-red';
            tempBadge.innerHTML = '⚠️ Risk / Burnt';
          }
        } else if (pacingGreenCount > 0 && pacingRedCount === 0) {
          card.classList.add('temp-green');
          if (tempBadge) {
            tempBadge.className = 'bullet-temp-badge bullet-temp-green';
            tempBadge.innerHTML = '🟢 On Pace';
          }
        } else if (pacingYellowCount > 0 && pacingRedCount === 0) {
          card.classList.add('temp-yellow');
          if (tempBadge) {
            tempBadge.className = 'bullet-temp-badge bullet-temp-yellow';
            tempBadge.innerHTML = '🟡 In Play';
          }
        } else {
          card.classList.add('temp-pre');
          if (tempBadge) {
            tempBadge.className = 'bullet-temp-badge bullet-temp-pre';
            tempBadge.innerHTML = '⚪ Upcoming';
          }
        }
      }

      try {
        updatePlayerParlayLinks();
      } catch (e) {}
      try {
        applyHideFulfilledLegs();
      } catch (e) {}
    }
    window.updateAllLegPacingGrades = updateAllLegPacingGrades;

    function updatePlayerParlayLinks() {
      if (!window.PLAYER_TICKET_MAP) return;

      for (const [pName, ticketList] of Object.entries(PLAYER_TICKET_MAP)) {
        const pId = pName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const parlaysWrap = document.getElementById('player-parlays-' + pId);
        const parlayStatusBadge = document.getElementById('player-parlay-badge-' + pId);
        if (!parlaysWrap) continue;

        let allParlaysDead = true;
        let anyParlaysActive = false;

        const pillsHtml = ticketList.map(t => {
          const cfg = TICKET_CONFIG[t.ticketId];
          const card = document.getElementById('card-' + t.ticketId);
          const isBurnt = card ? (card.classList.contains('burnt') || manualBurns[t.ticketId] === true) : (cfg && cfg.isLoss);

          let hasLostLeg = isBurnt;
          let bustedBy = '';
          if (!hasLostLeg && card) {
            const missedLeg = card.querySelector('.leg-item.leg-missed, .leg-item.pace-red');
            if (missedLeg) {
              hasLostLeg = true;
              const legText = missedLeg.querySelector('span strong')?.textContent || missedLeg.getAttribute('data-selection') || 'Leg Failed';
              bustedBy = legText.replace('•', '').trim();
            }
          }

          if (!hasLostLeg) {
            allParlaysDead = false;
            anyParlaysActive = true;
          }

          const teammateText = t.teammates && t.teammates.length > 0 
            ? 'with <strong>' + escapeHtml(t.teammates.join(', ')) + '</strong>' 
            : 'Solo Prop';

          if (hasLostLeg) {
            return '<div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.35); border-radius:4px; padding:3px 6px; font-size:0.65rem; color:#FCA5A5; display:flex; justify-content:space-between; align-items:center;">' +
              '<span>💀 <strong>DEAD PARLAY:</strong> ' + escapeHtml(t.ticketName) + ' (' + (bustedBy ? 'Burnt by ' + escapeHtml(bustedBy) : 'Burnt') + ')</span>' +
              '<span style="font-size:0.6rem; color:#EF4444; font-weight:800;">🔥 BURNT</span>' +
            '</div>';
          } else {
            return '<div style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.35); border-radius:4px; padding:3px 6px; font-size:0.65rem; color:#93C5FD; display:flex; justify-content:space-between; align-items:center;">' +
              '<span>🎟️ <strong>Active Parlay:</strong> ' + escapeHtml(t.ticketName) + ' • ' + teammateText + '</span>' +
              '<span style="font-size:0.62rem; color:#34D399; font-weight:800;">$' + Number(t.payout || 0).toFixed(0) + ' Pot</span>' +
            '</div>';
          }
        }).join('');

        parlaysWrap.innerHTML = pillsHtml;

        if (parlayStatusBadge) {
          if (allParlaysDead && ticketList.length > 0) {
            parlayStatusBadge.innerHTML = '<span class="badge" style="background:#450A0A; color:#F87171; border:1px solid #EF4444; font-size:0.6rem;" title="All parlays containing this player have busted">💀 ALL PARLAYS DEAD</span>';
          } else if (anyParlaysActive) {
            parlayStatusBadge.innerHTML = '<span class="badge" style="background:rgba(16,185,129,0.2); color:#34D399; border:1px solid rgba(16,185,129,0.4); font-size:0.6rem;">🟢 ACTIVE PARLAY</span>';
          } else {
            parlayStatusBadge.innerHTML = '';
          }
        }
      }
    }
    window.updatePlayerParlayLinks = updatePlayerParlayLinks;

    function toggleHideFulfilledLegs(checked) {
      hideFulfilledLegs = checked;
      try {
        localStorage.setItem(HIDE_FULFILLED_LEGS_KEY, JSON.stringify(hideFulfilledLegs));
      } catch (e) {}
      cardMinLegsState = {};
      try {
        localStorage.removeItem(CARD_MIN_LEGS_KEY);
      } catch (e) {}
      applyHideFulfilledLegs();
    }
    window.toggleHideFulfilledLegs = toggleHideFulfilledLegs;

    function toggleHideInjuredLegs(checked) {
      hideInjuredLegs = checked;
      try {
        localStorage.setItem(HIDE_INJURED_LEGS_KEY, JSON.stringify(hideInjuredLegs));
      } catch (e) {}
      applyHideFulfilledLegs();
    }
    window.toggleHideInjuredLegs = toggleHideInjuredLegs;

    function toggleCardFulfilledLegs(ticketId) {
      const currentlyMin = cardMinLegsState[ticketId] !== undefined ? cardMinLegsState[ticketId] : hideFulfilledLegs;
      cardMinLegsState[ticketId] = !currentlyMin;
      try {
        localStorage.setItem(CARD_MIN_LEGS_KEY, JSON.stringify(cardMinLegsState));
      } catch (e) {}
      applyHideFulfilledLegs();
    }
    window.toggleCardFulfilledLegs = toggleCardFulfilledLegs;

    function applyHideFulfilledLegs() {
      for (const [tId, config] of Object.entries(TICKET_CONFIG)) {
        const legsWrap = document.getElementById('legs-wrap-' + tId);
        const strip = document.getElementById('minstrip-' + tId);
        const arrow = document.getElementById('hit-arrow-' + tId);

        if (!legsWrap) continue;

        const openSlotSet = new Set(config.openSlotLegs || []);
        const realLegKeys = (config.legs || []).filter(lKey => !openSlotSet.has(lKey));
        const totalLegs = realLegKeys.length;
        let wonCount = 0;
        let burntCount = 0;
        realLegKeys.forEach(lKey => {
          const el = document.getElementById('leg-' + lKey);
          const isWon = checkedState[lKey] || (config.legsWon && config.legsWon.includes(lKey));
          const isBurnt = !!burntLegsState[lKey];
          if (isWon) wonCount++;
          else if (isBurnt) burntCount++;
        });

        const fulfilledCount = wonCount + burntCount;
        const activeCount = Math.max(0, totalLegs - fulfilledCount);

        if (strip) {
          if (fulfilledCount > 0) {
            strip.style.display = 'flex';
            let label = '';
            if (wonCount > 0) label += '✅ ' + wonCount + ' Hit';
            if (burntCount > 0) label += (label ? ' • ' : '') + '🔥 ' + burntCount + ' Burnt';
            if (activeCount > 0) {
              label += ' • ' + activeCount + ' Active • Click to toggle';
            } else {
              label += ' • All Settled • Click to toggle';
            }
            const firstSpan = strip.querySelector('span:first-child');
            if (firstSpan) firstSpan.innerHTML = label;
          } else {
            strip.style.display = 'none';
          }
        }

        const defaultMin = (burntCount > 0 && cardMinLegsState[tId] === undefined) ? true : hideFulfilledLegs;
        const isMin = cardMinLegsState[tId] !== undefined ? cardMinLegsState[tId] : defaultMin;
        if (isMin) {
          legsWrap.classList.add('hide-fulfilled-legs');
          if (arrow) arrow.textContent = '⯈ (Hidden)';
        } else {
          legsWrap.classList.remove('hide-fulfilled-legs');
          if (arrow) arrow.textContent = '⯆ (Visible)';
        }

        if (config.legs) {
          realLegKeys.forEach(lKey => {
            const el = document.getElementById('leg-' + lKey);
            if (!el) return;
            const isWon = checkedState[lKey] || (config.legsWon && config.legsWon.includes(lKey));
            const isBurnt = !!burntLegsState[lKey];
            // Injured/Out is its own independent filter (chk-hide-injured-legs) --
            // deliberately OR'd in alongside the Hit/Burnt minimize toggle so either
            // one can hide an out leg regardless of the other's state (an out leg is
            // always also burnt, so leaving this out of the OR would make the two
            // toggles impossible to disentangle).
            const isOut = !!outLegsState[lKey];
            if ((isMin && (isWon || isBurnt)) || (hideInjuredLegs && isOut)) {
              el.style.setProperty('display', 'none', 'important');
            } else {
              el.style.removeProperty('display');
            }
          });
        }
      }
    }
    window.applyHideFulfilledLegs = applyHideFulfilledLegs;

    // ── DRAG AND DROP (TICKETS) ──
    function setupDragAndDrop() {
      const cards = document.querySelectorAll('.bet-card');
      cards.forEach(card => {
        if (card.dataset.dndBound) return;
        card.dataset.dndBound = 'true';
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', (e) => {
          if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.leg-item')) {
            e.preventDefault();
            return;
          }
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', card.id);
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          document.querySelectorAll('.bet-card').forEach(c => c.classList.remove('drag-over'));
          saveCardOrder();
        });

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
          card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over');
          const draggedId = e.dataTransfer.getData('text/plain');
          const draggedCard = document.getElementById(draggedId);
          if (draggedCard && draggedCard !== card) {
            const parentGrid = card.parentElement;
            if (draggedCard.parentElement === parentGrid) {
              const children = Array.from(parentGrid.children);
              const draggedIdx = children.indexOf(draggedCard);
              const targetIdx = children.indexOf(card);
              if (draggedIdx !== -1 && targetIdx !== -1) {
                if (draggedIdx < targetIdx) {
                  parentGrid.insertBefore(draggedCard, card.nextSibling);
                } else {
                  parentGrid.insertBefore(draggedCard, card);
                }
                saveCardOrder();
              }
            }
          }
        });
      });
    }

    function saveCardOrder() {
      const liveCards = Array.from(document.querySelectorAll('#cards-grid .bet-card')).map(c => c.id);
      const cashedCards = Array.from(document.querySelectorAll('#cashed-cards-grid .bet-card')).map(c => c.id);
      const burntCards = Array.from(document.querySelectorAll('#burnt-cards-grid .bet-card')).map(c => c.id);
      try {
        localStorage.setItem(ORDER_KEY, JSON.stringify([...liveCards, ...cashedCards, ...burntCards]));
        localStorage.setItem(ORDER_LAYOUT_KEY, ORDER_LAYOUT_VERSION);
      } catch (e) {}
    }

    function restoreCardOrder() {
      try {
        // Discard an order saved under an older layout once, so a new default
        // ordering actually reaches the board. Drags made after that persist.
        if (localStorage.getItem(ORDER_LAYOUT_KEY) !== ORDER_LAYOUT_VERSION) {
          localStorage.removeItem(ORDER_KEY);
          localStorage.setItem(ORDER_LAYOUT_KEY, ORDER_LAYOUT_VERSION);
          return;
        }
        const savedOrder = localStorage.getItem(ORDER_KEY);
        if (!savedOrder) return;
        const order = JSON.parse(savedOrder);
        const liveGrid = document.getElementById('cards-grid');
        const cashedGrid = document.getElementById('cashed-cards-grid');
        const burntGrid = document.getElementById('burnt-cards-grid');
        order.forEach(id => {
          const card = document.getElementById(id);
          if (card) {
            if (card.classList.contains('burnt') && burntGrid) {
              burntGrid.appendChild(card);
            } else if (card.classList.contains('cashed') && cashedGrid) {
              cashedGrid.appendChild(card);
            } else if (liveGrid) {
              liveGrid.appendChild(card);
            }
          }
        });
      } catch (e) {
        console.warn("Could not restore card order:", e);
      }
    }

    // ── CARD COLLAPSE ──
    function toggleCardCollapse(cardId) {
      collapsedState[cardId] = !collapsedState[cardId];
      saveCollapsed();
      applyCollapsedState();
    }

    function saveCollapsed() {
      try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsedState)); } catch (e) {}
    }

    function applyCollapsedState() {
      for (const [cardId, isCollapsed] of Object.entries(collapsedState)) {
        const cardEl = document.getElementById('card-' + cardId);
        if (!cardEl) continue;
        const btn = cardEl.querySelector('.btn-card-toggle');
        if (isCollapsed) {
          cardEl.classList.add('collapsed');
          if (btn) btn.textContent = '⯈';
        } else {
          cardEl.classList.remove('collapsed');
          if (btn) btn.textContent = '⯆';
        }
      }
    }

    function toggleAllTickets(expand) {
      document.querySelectorAll('.bet-card').forEach(card => {
        const id = card.getAttribute('data-id');
        if (id) collapsedState[id] = !expand;
      });
      saveCollapsed();
      applyCollapsedState();
    }

    // ── BOARD CLEARING & SUNDAY TICKET BUILDER ──
    function toggleClearSettled() {
      isBoardCleared = !isBoardCleared;
      try {
        localStorage.setItem(BOARD_CLEARED_KEY, JSON.stringify(isBoardCleared));
      } catch (e) {}
      applyBoardClearState();
      partitionTickets();
      showToast(isBoardCleared 
        ? '🧹 Board Cleared: Concluded / Settled slips hidden from view. Live slips remain active!'
        : '📋 Full Board Restored: Showing all active and settled slips.'
      );
    }

    function applyBoardClearState() {
      const btn = document.getElementById('btn-clear-settled');
      const burntWrap = document.getElementById('burnt-section-wrap');
      if (btn) {
        if (isBoardCleared) {
          btn.classList.add('active');
          btn.innerHTML = '📋 Restore Settled';
          btn.style.color = '#A7F3D0';
          btn.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        } else {
          btn.classList.remove('active');
          btn.innerHTML = '🧹 Clear Settled';
          btn.style.color = '#FCA5A5';
          btn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        }
      }
      if (burntWrap && isBoardCleared) {
        burntWrap.style.display = 'none';
      }
      const cashedWrap = document.getElementById('cashed-section-wrap');
      if (cashedWrap && isBoardCleared) {
        cashedWrap.style.display = 'none';
      }
    }

    function openAddSlipModal() {
      const modal = document.getElementById('add-slip-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeAddSlipModal() {
      const modal = document.getElementById('add-slip-modal');
      if (modal) modal.style.display = 'none';
    }

    function renderCustomCard(tId, cfg, legLines) {
      const grid = document.getElementById('cards-grid');
      if (!grid) return null;
      if (document.getElementById('card-' + tId)) return document.getElementById('card-' + tId);

      const isPromo = !!cfg.isPromo;
      const stake = parseFloat(isPromo ? cfg.promoStake : cfg.cashStake) || 10;
      const payout = parseFloat(cfg.payout) || 20;
      const safeName = escapeHtml(cfg.name || 'Custom Slip');
      const safeBook = escapeHtml(cfg.book || 'Custom');

      const cardHtml = document.createElement('div');
      cardHtml.className = 'bet-card' + (isPromo ? ' is-promo' : '');
      cardHtml.id = 'card-' + tId;
      cardHtml.setAttribute('draggable', 'true');
      cardHtml.setAttribute('data-id', tId);
      cardHtml.setAttribute('data-is-promo', isPromo ? 'true' : 'false');
      cardHtml.setAttribute('data-is-split', 'false');

      const odds = payout > stake ? '+' + Math.round(((payout - stake) / stake) * 100) : '-110';
      const stakeBadge = isPromo ? '<span class="badge badge-promo">🎁 PROMO CREDIT</span>' : '<span class="badge badge-cash">CASH</span>';
      const legKeys = cfg.legs || (legLines || []).map((_, i) => 'leg_' + tId + '_' + (i + 1));

      const legRowsHtml = (legLines || []).map(function(leg, i) {
        const lKey = legKeys[i] || ('leg_' + tId + '_' + (i + 1));
        const parts = String(leg).split('•');
        const title = escapeHtml(parts[0] ? parts[0].trim() : leg);
        const source = escapeHtml(parts[1] ? parts[1].trim() : 'Model Edge');
        return '<div class="leg-item" id="leg-' + lKey + '" data-key="' + lKey + '" onclick="toggleLeg(&apos;' + lKey + '&apos;, &apos;' + tId + '&apos;)">' +
          '<div class="leg-left"><span class="leg-icon">⚪</span><span>' + title + '</span>' +
          '<span class="source-tag" title="Source: ' + source + '">🎙️ ' + source + '</span></div>' +
          '<div class="leg-right" style="display:flex; align-items:center; gap:6px;">' +
          '<span style="font-size:0.68rem; color:var(--text-muted);">-110</span>' +
          '<button class="btn-leg-burn" id="btn-burn-leg-' + lKey + '" onclick="toggleLegBurn(&apos;' + lKey + '&apos;, &apos;' + tId + '&apos;, event)" title="Mark Leg Burnt / Missed">🔥</button>' +
          '<button class="btn-leg-push" id="btn-push-leg-' + lKey + '" onclick="toggleLegPush(&apos;' + lKey + '&apos;, &apos;' + tId + '&apos;, event)" title="Mark Leg Push">⚖️</button>' +
          '<button class="btn-leg-out" id="btn-out-leg-' + lKey + '" onclick="toggleLegOut(&apos;' + lKey + '&apos;, &apos;' + tId + '&apos;, event)" title="Mark Player Out / Inactive">🚑</button>' +
          '</div></div>';
      }).join('');

      cardHtml.innerHTML = '<div class="card-header">' +
        '<div class="card-title-wrap"><div class="card-title">' + safeName + '</div>' +
        '<div class="card-subtitle">' + safeBook + ' • Sunday Wager</div>' +
        '<div class="badges-row">' + stakeBadge +
        '<span class="badge badge-cash" id="badge-split-' + tId + '" style="display:none;">🤝 50/50 SPLIT</span>' +
        '<span class="burnt-badge">BURNT</span></div></div>' +
        '<div class="card-controls">' +
        '<button class="btn-alejandro-toggle" id="btn-split-' + tId + '" onclick="toggleAlejandroSplit(&apos;' + tId + '&apos;)" title="Toggle 50/50 Split">🤝 Split</button>' +
        '<button class="btn-burn-toggle" id="btn-burn-' + tId + '" onclick="toggleManualBurn(&apos;' + tId + '&apos;)" title="Mark Burnt / Alive" style="background:#1E293B; border:1px solid #334155; color:#EF4444; border-radius:4px; padding:2px 6px; font-size:0.68rem; font-weight:700; cursor:pointer;">🔥</button>' +
        '<span class="drag-handle" title="Drag to reorder">⠿</span>' +
        '<button class="btn-card-toggle" onclick="toggleCardCollapse(&apos;' + tId + '&apos;)">⯆</button></div></div>' +
        '<div class="card-body"><div class="burn-reason-banner" id="burn-banner-' + tId + '" style="display:none;"></div>' +
        '<div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:2px;">' +
        '<span>Stake: <strong>$' + stake.toFixed(2) + '</strong></span>' +
        '<span>Odds: <strong style="color:var(--accent-cyan);">' + odds + '</strong></span>' +
        '<span>To Win: <strong class="payout-val" id="card-payout-' + tId + '" style="color:var(--accent-green);">$' + Math.max(0, payout - stake).toFixed(2) + '</strong></span></div>' +
        '<div class="progress-bar-wrap"><div class="progress-fill" id="prog-' + tId + '"></div></div></div>' +
        '<div class="card-legs">' + legRowsHtml + '</div>';

      grid.prepend(cardHtml);
      return cardHtml;
    }

    function submitNewSlip() {
      const name = document.getElementById('add-slip-name')?.value?.trim();
      const book = document.getElementById('add-slip-book')?.value?.trim() || 'Custom';
      const stake = parseFloat(document.getElementById('add-slip-stake')?.value) || 10;
      const payout = parseFloat(document.getElementById('add-slip-payout')?.value) || 20;
      const isPromo = document.getElementById('add-slip-type')?.value === 'promo';
      const rawLegs = document.getElementById('add-slip-legs')?.value?.trim() || '';

      if (!name) {
        alert('Please enter a ticket title.');
        return;
      }

      const legLines = rawLegs.split(String.fromCharCode(10)).map(l => l.trim()).filter(Boolean);
      if (legLines.length === 0) {
        legLines.push(name + ' • Sunday Intel');
      }

      const tId = 'custom_' + Date.now();
      const legKeys = legLines.map((_, i) => 'leg_' + tId + '_' + (i + 1));

      TICKET_CONFIG[tId] = {
        name: name,
        book: book,
        isPromo: isPromo,
        cashStake: isPromo ? 0 : stake,
        promoStake: isPromo ? stake : 0,
        payout: payout,
        type: 'game',
        legs: legKeys
      };

      renderCustomCard(tId, TICKET_CONFIG[tId], legLines);
      setupDragAndDrop();

      customSlips.push({
        id: tId,
        config: TICKET_CONFIG[tId],
        lines: legLines
      });
      try {
        localStorage.setItem(CUSTOM_SLIPS_KEY, JSON.stringify(customSlips));
      } catch (e) {}

      render();
      closeAddSlipModal();
      showToast('➕ New Sunday Wager Added to Live Board: <strong>' + escapeHtml(name) + '</strong>');
    }

    function loadCustomSlips() {
      try {
        customSlips = readJsonKey(CUSTOM_SLIPS_KEY, []);
        if (Array.isArray(customSlips)) {
          customSlips.forEach(item => {
            if (item && item.id && item.config) {
              if (!TICKET_CONFIG[item.id]) {
                TICKET_CONFIG[item.id] = item.config;
              }
              renderCustomCard(item.id, item.config, item.lines || []);
            }
          });
        }
      } catch (e) {
        console.warn('Could not load custom slips:', e);
      }
    }

    // ── PLAYER CHEAT SHEET (DRAG, SORT, FILTER & COLLAPSE) ──
    function setupPlayerDragAndDrop() {
      const grid = document.getElementById('player-sheet-container');
      if (!grid) return;
      const cards = grid.querySelectorAll('.player-box-card');

      cards.forEach(card => {
        if (card.dataset.dndBound) return;
        card.dataset.dndBound = 'true';
        card.setAttribute('draggable', 'true');

        card.addEventListener('dragstart', (e) => {
          if (e.target.closest('button') || e.target.closest('input')) {
            e.preventDefault();
            return;
          }
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', card.id);
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          cards.forEach(c => c.classList.remove('drag-over'));
          savePlayerCardOrder();
        });

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
          card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over');
          const draggedId = e.dataTransfer.getData('text/plain');
          const draggedCard = document.getElementById(draggedId);
          if (draggedCard && draggedCard !== card && draggedCard.classList.contains('player-box-card')) {
            const children = Array.from(grid.children);
            const draggedIdx = children.indexOf(draggedCard);
            const targetIdx = children.indexOf(card);
            if (draggedIdx < targetIdx) {
              grid.insertBefore(draggedCard, card.nextSibling);
            } else {
              grid.insertBefore(draggedCard, card);
            }
            activePlayerSort = 'custom';
            const sortSelect = document.getElementById('player-sort-select');
            if (sortSelect) sortSelect.value = 'custom';
            try { localStorage.setItem(PLAYER_SORT_KEY, 'custom'); } catch (e) {}
            savePlayerCardOrder();
          }
        });
      });
    }

    function savePlayerCardOrder() {
      const grid = document.getElementById('player-sheet-container');
      if (!grid) return;
      const order = Array.from(grid.querySelectorAll('.player-box-card')).map(c => c.id);
      try { localStorage.setItem(PLAYER_ORDER_KEY, JSON.stringify(order)); } catch (e) {}
    }

    function restorePlayerCardOrder() {
      try {
        const savedOrder = localStorage.getItem(PLAYER_ORDER_KEY);
        if (!savedOrder) return;
        const order = JSON.parse(savedOrder);
        const grid = document.getElementById('player-sheet-container');
        if (!grid) return;
        order.forEach(id => {
          const card = document.getElementById(id);
          if (card && card.parentElement === grid) {
            grid.appendChild(card);
          }
        });
      } catch (e) {
        console.warn("Could not restore player card order:", e);
      }
    }

    function togglePlayerCollapse(playerId) {
      playerCollapsedState[playerId] = !playerCollapsedState[playerId];
      savePlayerCollapsed();
      applyPlayerCollapsedState();
    }

    function savePlayerCollapsed() {
      try { localStorage.setItem(PLAYER_COLLAPSED_KEY, JSON.stringify(playerCollapsedState)); } catch (e) {}
    }

    function applyPlayerCollapsedState() {
      for (const [pId, isCollapsed] of Object.entries(playerCollapsedState)) {
        const pcard = document.getElementById('player-box-' + pId);
        if (!pcard) continue;
        const btn = pcard.querySelector('.btn-player-toggle');
        if (isCollapsed) {
          pcard.classList.add('collapsed');
          if (btn) btn.textContent = '⯈';
        } else {
          pcard.classList.remove('collapsed');
          if (btn) btn.textContent = '⯆';
        }
      }
    }

    function collapseFulfilledPlayers() {
      document.querySelectorAll('.player-box-card').forEach(card => {
        const pId = card.getAttribute('data-player-id');
        const isFulfilled = card.getAttribute('data-fulfilled') === 'true';
        if (isFulfilled) {
          playerCollapsedState[pId] = true;
        }
      });
      savePlayerCollapsed();
      applyPlayerCollapsedState();
    }

    function toggleAllPlayers(expand) {
      document.querySelectorAll('.player-box-card').forEach(card => {
        const pId = card.getAttribute('data-player-id');
        playerCollapsedState[pId] = !expand;
      });
      savePlayerCollapsed();
      applyPlayerCollapsedState();
    }

    function toggleAutoCollapse(checked) {
      autoCollapseFulfilled = checked;
      try { localStorage.setItem(AUTO_COLLAPSE_KEY, JSON.stringify(checked)); } catch (e) {}
      if (checked) collapseFulfilledPlayers();
    }

    function toggleHideFulfilled(checked) {
      hideFulfilled = checked;
      try { localStorage.setItem(HIDE_FULFILLED_KEY, JSON.stringify(hideFulfilled)); } catch (e) {}
      filterAndSortPlayers();
    }

    function setPlayerFilter(filter) {
      activePlayerFilter = filter;
      document.querySelectorAll('#pfilter-all, #pfilter-needs_stats, #pfilter-fulfilled').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById('pfilter-' + filter);
      if (btn) btn.classList.add('active');
      filterAndSortPlayers();
    }

    function setPlayerSort(sort) {
      activePlayerSort = sort;
      try { localStorage.setItem(PLAYER_SORT_KEY, sort); } catch (e) {}
      if (sort === 'custom') {
        restorePlayerCardOrder();
      }
      filterAndSortPlayers();
    }

    function filterAndSortPlayers() {
      const container = document.getElementById('player-sheet-container');
      if (!container) return;
      const cards = Array.from(document.querySelectorAll('.player-box-card'));

      cards.forEach(card => {
        const isFulfilled = card.getAttribute('data-fulfilled') === 'true';
        const isFinal = card.getAttribute('data-is-final') === 'true';
        const isConcludedOrHit = isFulfilled || isFinal;
        let show = true;
        if (hideFulfilled && isConcludedOrHit) show = false;
        if (activePlayerFilter === 'needs_stats' && isConcludedOrHit) show = false;
        if (activePlayerFilter === 'fulfilled' && !isConcludedOrHit) show = false;
        card.style.display = show ? '' : 'none';
      });

      if (activePlayerSort !== 'custom') {
        cards.sort((a, b) => {
          if (activePlayerSort === 'gametime') {
            const getRank = (el) => {
              if (el.getAttribute('data-is-final') === 'true') return 2;
              if (el.getAttribute('data-is-live') === 'true') return 0;
              const team = (el.getAttribute('data-team') || '').toUpperCase();
              if (window.latestTeamStatusMap && window.latestTeamStatusMap[team]) {
                const info = window.latestTeamStatusMap[team];
                if (info.isCompleted || (info.statusDesc && info.statusDesc.toLowerCase().includes('final'))) return 2;
                if (info.isLive) return 0;
              }
              return 1;
            };
            const rankA = getRank(a);
            const rankB = getRank(b);
            if (rankA !== rankB) return rankA - rankB;

            const kickA = parseFloat(a.getAttribute('data-kickoff') || '9999999999999');
            const kickB = parseFloat(b.getAttribute('data-kickoff') || '9999999999999');
            if (kickA !== kickB) return kickA - kickB;

            return (a.getAttribute('data-player-name') || '').localeCompare(b.getAttribute('data-player-name') || '');
          }
          if (activePlayerSort === 'team') {
            const teamA = a.getAttribute('data-team') || '';
            const teamB = b.getAttribute('data-team') || '';
            if (teamA !== teamB) return teamA.localeCompare(teamB);
            return (a.getAttribute('data-player-name') || '').localeCompare(b.getAttribute('data-player-name') || '');
          }
          if (activePlayerSort === 'needs_first') {
            const fulA = a.getAttribute('data-fulfilled') === 'true' ? 1 : 0;
            const fulB = b.getAttribute('data-fulfilled') === 'true' ? 1 : 0;
            if (fulA !== fulB) return fulA - fulB;
            const pctA = parseFloat(a.getAttribute('data-progress-pct') || 0);
            const pctB = parseFloat(b.getAttribute('data-progress-pct') || 0);
            return pctA - pctB;
          }
          if (activePlayerSort === 'pct_desc') {
            const pctA = parseFloat(a.getAttribute('data-progress-pct') || 0);
            const pctB = parseFloat(b.getAttribute('data-progress-pct') || 0);
            return pctB - pctA;
          }
          if (activePlayerSort === 'name') {
            return (a.getAttribute('data-player-name') || '').localeCompare(b.getAttribute('data-player-name') || '');
          }
          return 0;
        });

        const liveCont = document.getElementById('player-sheet-container');
        const concludedCont = document.getElementById('concluded-players-container');
        const missedCont = document.getElementById('missed-players-container');
        cards.forEach(c => {
          if (c.parentElement === liveCont) {
            liveCont.appendChild(c);
          } else if (c.parentElement === concludedCont) {
            concludedCont.appendChild(c);
          } else if (missedCont && c.parentElement === missedCont) {
            missedCont.appendChild(c);
          }
        });
      }

      partitionPlayers();
    }

    // ── PLAYER PARTITIONING (LIVE vs CONCLUDED) ──
    function partitionPlayers() {
      // Root-cause fix (2026-09-14): this used to bucket any card whose game was
      // Final into the "FULFILLED PLAYERS" section regardless of whether the props
      // actually hit (isHit || isFinal). That meant every player whose game ended
      // with a missed prop still landed in a section literally labeled
      // "HIT 100% OF PROPS". Now: HIT -> Fulfilled section, FINAL-BUT-NOT-HIT ->
      // separate red "Missed Props" section, otherwise -> still-live section.
      const liveCont = document.getElementById('player-sheet-container');
      const concludedCont = document.getElementById('concluded-players-container');
      const concludedWrap = document.getElementById('concluded-players-section-wrap');
      const missedCont = document.getElementById('missed-players-container');
      const missedWrap = document.getElementById('missed-players-section-wrap');
      const liveEmptyMsg = document.getElementById('live-players-empty');
      const concludedCountEl = document.getElementById('concluded-players-section-count');
      const missedCountEl = document.getElementById('missed-players-section-count');
      const chkFulfilledCount = document.getElementById('chk-fulfilled-count');
      const countFulfilled = document.getElementById('count-fulfilled');
      const countNeedsStats = document.getElementById('count-needs-stats');
      if (!liveCont || !concludedCont) return;

      let fulfilledCount = 0;
      let missedCount = 0;
      let liveCount = 0;

      const cards = Array.from(document.querySelectorAll('.player-box-card'));
      cards.forEach(card => {
        const isHit = card.getAttribute('data-fulfilled') === 'true' || card.classList.contains('fulfilled');
        const isFinal = card.getAttribute('data-is-final') === 'true';
        if (isHit) {
          fulfilledCount++;
          if (card.parentElement !== concludedCont) {
            concludedCont.appendChild(card);
          }
        } else if (isFinal) {
          missedCount++;
          if (missedCont && card.parentElement !== missedCont) {
            missedCont.appendChild(card);
          }
        } else {
          liveCount++;
          if (card.parentElement !== liveCont) {
            liveCont.appendChild(card);
          }
        }
      });

      if (concludedCountEl) concludedCountEl.textContent = fulfilledCount;
      if (missedCountEl) missedCountEl.textContent = missedCount;
      if (chkFulfilledCount) chkFulfilledCount.textContent = fulfilledCount;
      if (countFulfilled) countFulfilled.textContent = fulfilledCount;
      if (countNeedsStats) countNeedsStats.textContent = liveCount;
      const tabPlayerCount = document.getElementById('tab-player-count');
      if (tabPlayerCount) tabPlayerCount.textContent = liveCount + fulfilledCount + missedCount;

      if (liveEmptyMsg) {
        liveEmptyMsg.style.display = (liveCount === 0 && activePlayerFilter !== 'fulfilled') ? 'block' : 'none';
      }

      if (concludedWrap) {
        if (activePlayerFilter === 'fulfilled') {
          concludedWrap.style.display = 'block';
        } else if (fulfilledCount > 0 && !hideFulfilled && activePlayerFilter !== 'needs_stats') {
          concludedWrap.style.display = 'block';
        } else {
          concludedWrap.style.display = 'none';
        }
      }

      if (missedWrap) {
        if (activePlayerFilter === 'fulfilled') {
          missedWrap.style.display = 'none';
        } else if (missedCount > 0 && activePlayerFilter !== 'needs_stats') {
          missedWrap.style.display = 'block';
        } else {
          missedWrap.style.display = 'none';
        }
      }
    }

    // ── ALEJANDRO CASTRO SPLIT LEDGER & SETTLEMENT LOG ──
    function loadSplitHistory() {
      try {
        const s = localStorage.getItem(SPLIT_HISTORY_KEY);
        if (s) splitHistory = JSON.parse(s);
      } catch (e) {}
    }

    function saveSplitHistory() {
      try { localStorage.setItem(SPLIT_HISTORY_KEY, JSON.stringify(splitHistory)); } catch (e) {}
    }

    function renderHistoryTable() {
      const tbody = document.getElementById('history-tbody');
      const countEl = document.getElementById('history-total-count');
      if (countEl) countEl.textContent = splitHistory.length;
      if (!tbody) return;

      if (splitHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:6px;">No recorded split history yet.</td></tr>';
        return;
      }

      tbody.innerHTML = splitHistory.map(function(h) {
        const badgeCls = h.status === 'WON' ? 'badge-open' : (h.status === 'BURNT' ? 'burnt-badge' : 'badge-cash');
        const balColor = h.settled ? '#34D399' : '#FCD34D';
        const balText = h.settled ? 'Settled' : '+$' + Number(h.alejandroCashStake || 0).toFixed(2);
        return '<tr>' +
          '<td><strong>' + h.name + '</strong><br><span style="color:#94A3B8; font-size:0.6rem;">' + h.date + '</span></td>' +
          '<td>$' + Number(h.alejandroCashStake || 0).toFixed(2) + '</td>' +
          '<td><span class="badge ' + badgeCls + '" style="font-size:0.58rem;">' + h.status + '</span></td>' +
          '<td style="color:' + balColor + ';">' + balText + '</td>' +
        '</tr>';
      }).join('');
    }

    function markAllSettled() {
      if (confirm("Mark all active split wagers as settled with Alejandro?")) {
        splitHistory.forEach(h => h.settled = true);
        saveSplitHistory();
        renderHistoryTable();
        showToast("🤝 All split wagers marked settled with Alejandro!");
      }
    }

    function toggleHistoryDrawer() {
      const drawer = document.getElementById('history-drawer');
      if (drawer) drawer.classList.toggle('open');
    }

    function updateAlejandroLedger() {
      let splitCount = 0;
      let totalCostShare = 0;
      let totalCashedShare = 0;
      let totalPotentialShare = 0;
      const chips = [];

      for (const [tId, config] of Object.entries(TICKET_CONFIG)) {
        if (splitState[tId] && !config.isPaper) {
          splitCount++;
          const card = document.getElementById('card-' + tId);
          const isCashed = card && card.classList.contains('cashed');
          const isBurnt = card && card.classList.contains('burnt');

          const cost = config.isPromo ? 0 : config.cashStake * 0.5;
          totalCostShare += cost;
          if (!isBurnt) {
            totalPotentialShare += (config.payout * 0.5);
          }

          if (isCashed) {
            totalCashedShare += (config.payout * 0.5);
          }

          chips.push(
            '<div class="alejandro-chip">' +
              '<div>' +
                '<strong>' + config.name + '</strong>' +
                '<div style="font-size:0.62rem; color:#C7D2FE;">Stake: $' + cost.toFixed(2) + ' • Win: $' + (config.payout * 0.5).toFixed(2) + '</div>' +
              '</div>' +
              '<button class="btn-action" style="font-size:0.65rem; padding:1px 4px;" onclick="toggleAlejandroSplit(&apos;' + tId + '&apos;)">✕</button>' +
            '</div>'
          );
        }
      }

      const netBalance = totalCashedShare - totalCostShare;
      document.getElementById('sidebar-split-count').textContent = splitCount + ' Tickets';
      document.getElementById('sidebar-stat-owed').textContent = '$' + totalCostShare.toFixed(2);
      document.getElementById('sidebar-stat-cashed').textContent = '$' + totalCashedShare.toFixed(2);
      document.getElementById('sidebar-stat-potential').textContent = '$' + totalPotentialShare.toFixed(2);

      const billEl = document.getElementById('sidebar-bill-val');
      if (netBalance < 0) {
        billEl.textContent = 'Alejandro Castro Owes: $' + Math.abs(netBalance).toFixed(2);
        billEl.style.color = '#FCD34D';
      } else if (netBalance > 0) {
        billEl.textContent = 'Andy Owes: $' + netBalance.toFixed(2);
        billEl.style.color = '#34D399';
      } else {
        billEl.textContent = '$0.00';
        billEl.style.color = '#CBD5E1';
      }

      const chipsCont = document.getElementById('sidebar-chips-container');
      if (chipsCont) {
        chipsCont.innerHTML = chips.length > 0 
          ? chips.join('') 
          : '<div style="font-size:0.65rem; color:var(--text-muted); font-style:italic; padding:2px 0;">No active splits. Click [🤝 Split] on cards.</div>';
      }

      renderHistoryTable();
    }

    // ── TICKETS FILTERING & PARTITIONING ──
    function setFilter(filter) {
      activeFilter = filter;
      document.querySelectorAll('.filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector('.filter-bar .filter-btn[onclick*="' + filter + '"]') || (window.event && window.event.target);
      if (btn) btn.classList.add('active');
      filterCards();
    }

    function filterCards() {
      document.querySelectorAll('.bet-card').forEach(card => {
        const isPromo = card.getAttribute('data-is-promo') === 'true';
        const isCashed = card.classList.contains('cashed');
        const isBurnt = card.classList.contains('burnt');
        const id = card.getAttribute('data-id');
        const isSplit = splitState[id] === true;

        let show = true;
        if (activeFilter === 'all') show = true;
        else if (activeFilter === 'cash') show = !isPromo;
        else if (activeFilter === 'promo') show = isPromo;
        else if (activeFilter === 'alejandro') show = isSplit;
        else if (activeFilter === 'cashed') show = isCashed;
        else if (activeFilter === 'pending') show = !isCashed && !isBurnt;
        else if (activeFilter === 'burnt') show = isBurnt;

        if (hideBurnt && isBurnt && activeFilter !== 'burnt') {
          show = false;
        }
        if (hideCashed && isCashed && activeFilter !== 'cashed') {
          show = false;
        }

        card.style.display = show ? '' : 'none';
      });

      partitionTickets();
    }

    function partitionTickets() {
      const liveGrid = document.getElementById('cards-grid');
      const burntGrid = document.getElementById('burnt-cards-grid');
      const cashedGrid = document.getElementById('cashed-cards-grid');
      const burntSection = document.getElementById('burnt-section-wrap');
      const cashedSection = document.getElementById('cashed-section-wrap');
      const liveEmptyMsg = document.getElementById('live-tickets-empty');
      const liveCountEl = document.getElementById('live-slips-count');
      const burntSectionCount = document.getElementById('burnt-section-count');
      const chkBurntCount = document.getElementById('chk-burnt-count');
      const filterBurntCount = document.getElementById('tfilter-burnt-count');
      const cashedSectionCount = document.getElementById('cashed-section-count');
      const chkCashedCount = document.getElementById('chk-cashed-count');
      const filterCashedCount = document.getElementById('tfilter-cashed-count');
      if (!liveGrid || !burntGrid || !cashedGrid) return;

      let burntCount = 0;
      let cashedCount = 0;
      let liveCount = 0;
      let visibleLiveCards = 0;

      const allCards = document.querySelectorAll('.bet-card');
      allCards.forEach(card => {
        const isBurnt = card.classList.contains('burnt');
        const isCashed = card.classList.contains('cashed');

        if (isBurnt) {
          burntCount++;
          if (card.parentElement !== burntGrid) {
            burntGrid.appendChild(card);
          }
        } else if (isCashed) {
          cashedCount++;
          if (card.parentElement !== cashedGrid) {
            cashedGrid.appendChild(card);
          }
        } else {
          liveCount++;
          if (card.parentElement !== liveGrid) {
            liveGrid.appendChild(card);
          }
          if (card.style.display !== 'none') {
            visibleLiveCards++;
          }
        }
      });

      if (liveCountEl) liveCountEl.textContent = liveCount;
      if (burntSectionCount) burntSectionCount.textContent = burntCount;
      if (chkBurntCount) chkBurntCount.textContent = burntCount;
      if (filterBurntCount) filterBurntCount.textContent = burntCount;

      if (cashedSectionCount) cashedSectionCount.textContent = cashedCount;
      if (chkCashedCount) chkCashedCount.textContent = cashedCount;
      if (filterCashedCount) filterCashedCount.textContent = cashedCount;

      if (liveEmptyMsg) {
        liveEmptyMsg.style.display = (visibleLiveCards === 0 && activeFilter !== 'burnt' && activeFilter !== 'cashed') ? 'block' : 'none';
      }

      if (cashedSection) {
        if (isBoardCleared) {
          cashedSection.style.display = 'none';
        } else if (activeFilter === 'cashed') {
          cashedSection.style.display = 'block';
        } else if (cashedCount > 0 && !hideCashed) {
          cashedSection.style.display = 'block';
        } else {
          cashedSection.style.display = 'none';
        }
      }

      if (burntSection) {
        if (isBoardCleared) {
          burntSection.style.display = 'none';
        } else if (activeFilter === 'burnt') {
          burntSection.style.display = 'block';
        } else if (burntCount > 0 && !hideBurnt) {
          burntSection.style.display = 'block';
        } else {
          burntSection.style.display = 'none';
        }
      }
    }

    function render() {
      let totalWon = 0;
      let totalAlivePotential = 0;
      let burntCount = 0;

      for (const [tId, config] of Object.entries(TICKET_CONFIG)) {
        const card = document.getElementById('card-' + tId);
        const prog = document.getElementById('prog-' + tId);
        const btnSplit = document.getElementById('btn-split-' + tId);
        const badgeSplit = document.getElementById('badge-split-' + tId);
        const burnBanner = document.getElementById('burn-banner-' + tId);
        const cardPayoutEl = document.getElementById('card-payout-' + tId) || card?.querySelector('.payout-val');
        const bulletPayoutEl = document.getElementById('bullet-payout-' + tId);
        const bulletHitsEl = document.getElementById('bullet-hits-' + tId);

        const isSettledLoss = (config.isSettled && config.isLoss);
        const isManuallyBurnt = manualBurns[tId] === true;

        const ticketLegs = config.legs || [];
        const burntLegsInTicket = ticketLegs.filter(lKey => !!burntLegsState[lKey]);
        // Legs burnt specifically because they're flagged 🚑 Out (injured/inactive) are
        // guaranteed-dead for that leg's own math, but (Andy, 2026-09-22) an injury alone
        // should NOT auto-eliminate the whole ticket to the Burnt/Eliminated section the way
        // a manually-burnt or genuinely-missed leg does -- only count non-injury burnt legs
        // toward busting the entire standard parlay/SGP ticket below.
        const nonInjuryBurntLegsInTicket = burntLegsInTicket.filter(lKey => !outLegsState[lKey]);
        const hitLegsInTicket = ticketLegs.filter(lKey => !!checkedState[lKey] || (config.legsWon && config.legsWon.includes(lKey)));
        const pushedLegsInTicket = ticketLegs.filter(lKey => !!pushedLegsState[lKey] || (config.legsPushed && config.legsPushed.includes(lKey)));
        // A pushed leg is removed from the parlay entirely (neither a hit nor a bust
        // requirement) -- exclude it from the "X / Y Hits" denominator so a ticket with
        // a push doesn't show a permanently-short hit count.
        const gradableLegsCount = ticketLegs.length - pushedLegsInTicket.length;

        let isBurnt = false;
        let cardPotential = config.payout || 0;
        let cardWonPayout = 0;
        let rrAliveCombosCount = 0;
        let rrTotalCombosCount = 0;

        if (isSettledLoss || isManuallyBurnt) {
          isBurnt = true;
          cardPotential = 0;
        } else if (config.isRoundRobin) {
          const k = config.rrComboSize || 2;
          const allCombos = getCombinations(ticketLegs, k);
          rrTotalCombosCount = allCombos.length;
          let rrLivePotential = 0;

          const oddsMap = {};
          if (config.legDetails) {
            config.legDetails.forEach(ld => { oddsMap[ld.key] = ld.decimalOdds; });
          }

          allCombos.forEach(combo => {
            const hasBurnt = combo.some(lKey => !!burntLegsState[lKey]);
            if (hasBurnt) return;

            rrAliveCombosCount++;
            let comboMult = 1;
            let allLegsWon = true;
            combo.forEach(lKey => {
              // A pushed leg is removed from this combo's math entirely -- it neither
              // multiplies the payout nor needs to hit for the remaining legs to cash.
              // Added 2026-09-21 (Andy: ungraded pushes, e.g. Jets +3, need real handling).
              if (pushedLegsState[lKey] || (config.legsPushed && config.legsPushed.includes(lKey))) return;
              comboMult *= (oddsMap[lKey] || 1.9091);
              if (!checkedState[lKey] && !(config.legsWon && config.legsWon.includes(lKey))) {
                allLegsWon = false;
              }
            });

            const comboPayout = config.rrStakePerCombo * comboMult;
            rrLivePotential += comboPayout;
            if (allLegsWon) {
              cardWonPayout += comboPayout;
            }
          });

          if (rrAliveCombosCount === 0 && rrTotalCombosCount > 0) {
            isBurnt = true;
            cardPotential = 0;
          } else {
            isBurnt = false;
            cardPotential = rrLivePotential;
          }
        } else {
          // Standard single or parlay wager: a non-injury burnt leg busts the ticket.
          // An Out-only leg (🚑) stays dead on its own but no longer forces the whole
          // ticket into the Burnt/Eliminated section -- see nonInjuryBurntLegsInTicket above.
          if (nonInjuryBurntLegsInTicket.length > 0) {
            isBurnt = true;
            cardPotential = 0;
          }
        }

        if (isBurnt) {
          if (!config.isPaper) burntCount++;
          if (card) card.classList.add('burnt');
          if (prog) prog.classList.add('burnt');
          if (burnBanner) {
            burnBanner.style.display = 'flex';
            if (isSettledLoss) {
              burnBanner.innerHTML = '<span>🔥</span><strong>Concluded / Settled Loss:</strong> Melbourne Season Opener (Final).';
            } else if (config.isRoundRobin && rrAliveCombosCount === 0 && rrTotalCombosCount > 0) {
              burnBanner.innerHTML = '<span>🔥</span><strong>Burnt / Eliminated:</strong> All Round Robin combinations busted (' + burntLegsInTicket.length + ' burnt legs).';
            } else if (burntLegsInTicket.length > 0) {
              burnBanner.innerHTML = '<span>🔥</span><strong>Burnt / Eliminated:</strong> Leg marked burnt eliminated this parlay.';
            } else {
              burnBanner.innerHTML = '<span>🔥</span><strong>Burnt / Eliminated:</strong> Ticket marked burnt.';
            }
          }
          if (cardPayoutEl) cardPayoutEl.textContent = '$0.00';
          if (bulletPayoutEl) bulletPayoutEl.textContent = '$0.00';
        } else {
          if (card) card.classList.remove('burnt');
          if (prog) prog.classList.remove('burnt');
          if (burnBanner) burnBanner.style.display = 'none';

          if (!config.isPaper) {
            totalAlivePotential += cardPotential;
            totalWon += cardWonPayout;
          }

          // Display "To Win" (profit only), matching how the sportsbooks themselves label
          // tickets (Risk / Win) -- cardPotential itself stays a TOTAL RETURN (stake+profit)
          // because the round-robin combo math above genuinely needs that (a combo's payout
          // is stake*decimalOdds, which is stake-inclusive by definition); we only subtract
          // the stake actually still at risk at the point we render it to the user.
          const stakeAtRisk = config.isRoundRobin
            ? (config.rrStakePerCombo || 0) * rrAliveCombosCount
            : ((config.cashStake || 0) + (config.promoStake || 0));
          const displayToWin = Math.max(0, cardPotential - stakeAtRisk);

          if (cardPayoutEl) {
            if (config.isRoundRobin && rrTotalCombosCount > 0) {
              const comboNote = (rrAliveCombosCount < rrTotalCombosCount) 
                ? ' <span style="font-size:0.68rem; color:#F59E0B; font-weight:700;">(' + rrAliveCombosCount + '/' + rrTotalCombosCount + ' Combos)</span>' 
                : '';
              cardPayoutEl.innerHTML = '$' + displayToWin.toFixed(2) + comboNote;
            } else {
              cardPayoutEl.textContent = '$' + displayToWin.toFixed(2);
            }
          }
          if (bulletPayoutEl) {
            bulletPayoutEl.textContent = '$' + displayToWin.toFixed(2);
          }
        }

        if (bulletHitsEl) {
          bulletHitsEl.textContent = hitLegsInTicket.length + '/' + gradableLegsCount + ' Hits' + (burntLegsInTicket.length > 0 ? ' (' + burntLegsInTicket.length + '🔥)' : '') + (pushedLegsInTicket.length > 0 ? ' (' + pushedLegsInTicket.length + '⚖️)' : '');
        }

        if (btnSplit) {
          if (splitState[tId]) {
            btnSplit.classList.add('active');
            if (badgeSplit) badgeSplit.style.display = '';
          } else {
            btnSplit.classList.remove('active');
            if (badgeSplit) badgeSplit.style.display = 'none';
          }
        }

        let completedLegs = 0;
        config.legs.forEach(lKey => {
          const el = document.getElementById('leg-' + lKey);
          const cardBar = document.getElementById('card-bar-' + lKey);
          const cardStat = document.getElementById('card-stat-' + lKey);
          const paceBadge = document.getElementById('pace-badge-' + lKey);
          const btnBurnLeg = document.getElementById('btn-burn-leg-' + lKey);

          const isLegBurnt = !!burntLegsState[lKey];
          const isLegOut = !!outLegsState[lKey];
          const isLegHit = !!checkedState[lKey] || (config.legsWon && config.legsWon.includes(lKey));
          const isLegPushed = !!pushedLegsState[lKey] || (config.legsPushed && config.legsPushed.includes(lKey));

          if (isLegPushed) {
            // A push satisfies the leg's requirement (removed from the parlay, not a loss) --
            // count it toward completedLegs so it doesn't block the ticket from cashing when
            // every other leg has genuinely hit. Added 2026-09-21 per Andy's report of
            // ungraded pushes (e.g. Jets +3) leaving tickets stuck as neither hit nor failed.
            completedLegs++;
            if (el) {
              el.classList.add('leg-pushed');
              el.classList.remove('checked', 'leg-burnt');
              const icon = el.querySelector('.leg-icon');
              if (icon) icon.textContent = '⚖️';
            }
            if (btnBurnLeg) {
              btnBurnLeg.classList.remove('active');
            }
            if (paceBadge) {
              paceBadge.className = 'leg-pace-badge badge-pacing-push';
              paceBadge.innerHTML = '⚖️ PUSH';
            }
            // Fix 2026-09-21: cardStat (the "X / Y" line on the ticket card) previously
            // only ever got refreshed in the isLegHit branch below -- burnt and pushed
            // legs left it frozen on its generation-time placeholder (e.g. a stale
            // "0 / 46.5" on a game-total leg forever, even once the badge correctly
            // flipped to Busted). Game-line legs (spread/total) have no per-leg
            // currentVal tracked at this scope, so we show a plain status instead of a
            // fabricated number.
            if (cardStat) {
              cardStat.innerHTML = '<span style="color:#D97706;">⚖️ Push</span>';
            }
            if (cardBar) {
              cardBar.style.width = '100%';
              cardBar.className = 'progress-fill';
            }
          } else if (isLegBurnt) {
            if (el) {
              el.classList.add('leg-burnt');
              el.classList.remove('checked');
              if (isLegOut) el.classList.add('leg-out'); else el.classList.remove('leg-out');
              const icon = el.querySelector('.leg-icon');
              if (icon) icon.textContent = isLegOut ? '🚑' : '🔥';
            }
            if (btnBurnLeg) {
              btnBurnLeg.classList.toggle('active', !isLegOut);
            }
            const btnOutLeg = document.getElementById('btn-out-leg-' + lKey) || document.getElementById('pbtn-out-leg-' + lKey);
            if (btnOutLeg) {
              btnOutLeg.classList.toggle('active', isLegOut);
            }
            if (paceBadge) {
              if (isLegOut) {
                paceBadge.className = 'leg-pace-badge badge-pacing-out';
                paceBadge.innerHTML = '🚑 OUT';
              } else {
                paceBadge.className = 'leg-pace-badge badge-pacing-lost';
                paceBadge.innerHTML = '❌ BURNT';
              }
            }
            if (cardStat) {
              cardStat.innerHTML = isLegOut
                ? '<span style="color:#8B5CF6;">🚑 Out/Inactive</span>'
                : '<span style="color:#EF4444;">🔥 Burnt</span>';
            }
            if (cardBar) {
              cardBar.style.width = '100%';
              cardBar.className = 'progress-fill burnt';
            }
          } else if (isLegHit) {
            completedLegs++;
            if (el) {
              el.classList.add('checked');
              el.classList.remove('leg-burnt', 'leg-out');
              const icon = el.querySelector('.leg-icon');
              if (icon) icon.textContent = '✅';
            }
            if (btnBurnLeg) {
              btnBurnLeg.classList.remove('active');
            }
            const btnOutLegHit = document.getElementById('btn-out-leg-' + lKey) || document.getElementById('pbtn-out-leg-' + lKey);
            if (btnOutLegHit) {
              btnOutLegHit.classList.remove('active');
            }
            if (cardBar) {
              cardBar.style.width = '100%';
              cardBar.className = 'progress-fill cashed';
            }
            if (cardStat && !cardStat.textContent.includes('✅')) {
              const target = el?.getAttribute('data-target') || '1';
              cardStat.innerHTML = target + ' / ' + target + ' <span style="color:#10B981;">✅</span>';
            }
          } else if (isLegOut) {
            // 🚑 Out is purely informational now (Andy, 2026-09-22): it no longer implies
            // Burnt, so this branch fires for a leg that's flagged Out but hasn't hit or
            // been manually burnt yet. Leave cardStat/cardBar/paceBadge alone here -- the
            // periodic live-stat refresh and the Player Cheat Sheet renderer populate those
            // from real athleteLiveStatsMap data independently of this render() pass, so the
            // leg keeps tracking its real live pace/progress right up until it's actually
            // marked Burnt or the game ends.
            if (el) {
              el.classList.remove('checked', 'leg-burnt');
              el.classList.add('leg-out');
              const icon = el.querySelector('.leg-icon');
              if (icon) icon.textContent = '🚑';
            }
            if (btnBurnLeg) {
              btnBurnLeg.classList.remove('active');
            }
            const btnOutLegOnly = document.getElementById('btn-out-leg-' + lKey) || document.getElementById('pbtn-out-leg-' + lKey);
            if (btnOutLegOnly) {
              btnOutLegOnly.classList.add('active');
            }
          } else {
            if (el) {
              el.classList.remove('checked');
              el.classList.remove('leg-burnt', 'leg-out');
              const icon = el.querySelector('.leg-icon');
              if (icon) icon.textContent = '⚪';
            }
            if (btnBurnLeg) {
              btnBurnLeg.classList.remove('active');
            }
            const btnOutLegReset = document.getElementById('btn-out-leg-' + lKey) || document.getElementById('pbtn-out-leg-' + lKey);
            if (btnOutLegReset) {
              btnOutLegReset.classList.remove('active');
            }
          }
        });

        const pct = config.legs.length ? (completedLegs / config.legs.length) * 100 : 0;
        if (prog) prog.style.width = pct + '%';

        const btnCash = document.getElementById('btn-cash-' + tId);
        const isManuallyCashed = manualCashed[tId] === true;
        const isSettledWin = (config.isSettled && config.isWin);

        if (!config.isRoundRobin) {
          const isCashed = !isBurnt && (isManuallyCashed || isSettledWin || (completedLegs === config.legs.length && config.legs.length > 0));

          if (isCashed) {
            if (card) card.classList.add('cashed');
            if (prog) {
              prog.classList.add('cashed');
              prog.style.width = '100%';
            }
            if (btnCash) btnCash.classList.add('active');
            if (!config.isPaper) totalWon += config.payout;
          } else {
            if (card) card.classList.remove('cashed');
            if (prog && !isBurnt) prog.classList.remove('cashed');
            if (btnCash) btnCash.classList.remove('active');
          }
        } else {
          if (btnCash) {
            if (isManuallyCashed || isSettledWin) {
              btnCash.classList.add('active');
            } else {
              btnCash.classList.remove('active');
            }
          }
        }
      }

      try {
        applyHideFulfilledLegs();
      } catch (e) {}

      const totalWonEl = document.getElementById('total-cashed-val');
      if (totalWonEl) totalWonEl.textContent = '$' + totalWon.toFixed(2);

      const potEl = document.getElementById('total-potential-payout');
      if (potEl) potEl.textContent = '$' + totalAlivePotential.toFixed(2);

      const filterBurntCount = document.getElementById('tfilter-burnt-count');
      if (filterBurntCount) filterBurntCount.textContent = burntCount;
      const chkBurntCount = document.getElementById('chk-burnt-count');
      if (chkBurntCount) chkBurntCount.textContent = burntCount;

      const tabLiveCount = document.getElementById('tab-live-count');
      if (tabLiveCount) {
        const liveCount = Math.max(0, Object.values(TICKET_CONFIG).filter(c => !c.isPaper).length - burntCount);
        tabLiveCount.textContent = liveCount;
      }

      applyHideFulfilledLegs();
      partitionTickets();
      try { renderPlayerCheatSheetStats(latestTeamStatusMap); } catch (e) {}
      try { updateAllLegPacingGrades(window._lastScoreboardEvents); } catch (e) {}
    }

    // ── GLOBAL REFRESH & RESET ──
    async function triggerGlobalRefresh() {
      const btn = document.getElementById('btn-global-refresh');
      if (btn) btn.classList.add('spinning');
      try {
        await fetchLiveScoreboard();
        showToast('🔄 Global Refresh Complete: Live Sunday scores &amp; board synchronized.');
      } catch (err) {
        console.error('Global refresh error:', err);
        showToast('⚠️ Refresh error: ' + err.message);
      } finally {
        setTimeout(() => {
          if (btn) btn.classList.remove('spinning');
        }, 600);
      }
    }

    function resetAll() {
      if (confirm("Reset all checked legs, collapsed states, and splits for Week ${week}?")) {
        checkedState = {};
        splitState = {};
        manualBurns = {};
        burntLegsState = {};
        pushedLegsState = {};
        outLegsState = {};
        collapsedState = {};
        playerCollapsedState = {};
        cardMinLegsState = {};
        hideFulfilledLegs = false;
        scPicks = {};
        try {
          localStorage.removeItem(CARD_MIN_LEGS_KEY);
          localStorage.removeItem(HIDE_FULFILLED_LEGS_KEY);
          localStorage.removeItem(SC_PICKS_KEY);
          localStorage.removeItem(BURNT_LEGS_KEY);
          localStorage.removeItem(PUSHED_LEGS_KEY);
          localStorage.removeItem(OUT_LEGS_KEY);
        } catch (e) {}
        const chkMin = document.getElementById('chk-hide-fulfilled-legs');
        if (chkMin) chkMin.checked = false;
        saveState();
        saveSplits();
        saveBurns();
        saveLegBurns();
        savePushedLegs();
        saveLegOut();
        saveCollapsed();
        savePlayerCollapsed();
        applyCollapsedState();
        applyPlayerCollapsedState();
        applySuperContestPicks();
        render();
        updateAlejandroLedger();
        filterCards();
        partitionPlayers();
        showToast('🔄 All live tracking states reset to slate defaults.');
      }
    }

    // ── SETTLED GAMES ARCHIVAL & PERFORMANCE ENGINE ──
    function loadArchiveState() {
      try {
        const saved = localStorage.getItem(ARCHIVE_KEY);
        if (saved) archivedGames = JSON.parse(saved);
        updateArchiveBadges();
      } catch (e) {
        console.warn('Could not load archive state:', e);
      }
    }

    function updateArchiveBadges() {
      const b1 = document.getElementById('archive-count-badge');
      const b2 = document.getElementById('arch-games-count');
      if (b1) b1.textContent = archivedGames.length;
      if (b2) b2.textContent = archivedGames.length;
    }

    function gradeAndSettleSlate() {
      archiveSettledGames(false);
      showToast('🏁 Sunday Slate Graded &amp; Settled! Results locked into Performance History.');
      toggleArchiveDrawer();
    }

    function archiveSettledGames(promptConfirm = true) {
      if (promptConfirm && !confirm("Archive current settled wagers and player props into performance tracking history?")) return;

      // Only tickets that are actually fully graded belong in a settlement snapshot --
      // a ticket still in progress (game live, not yet SETTLED in the underlying ledger)
      // has neither 'cashed' nor 'burnt' on its card, and used to silently fall through
      // to 'LOST' here, wrongly counting a live ticket as a loss if the slate was graded
      // before every game concluded. Skip anything not yet settled instead.
      const snapshot = {
        id: 'sunday_week_${week}_' + Date.now(),
        gameTitle: 'Sunday Multi-Game Slate (Week ${week})',
        archivedAt: new Date().toISOString(),
        wagers: Object.entries(TICKET_CONFIG)
          .filter(([tId, cfg]) => cfg.isSettled && !cfg.isPaper)
          .map(([tId, cfg]) => {
            const cardEl = document.getElementById('card-' + tId);
            const isCashed = cardEl?.classList.contains('cashed');
            const isBurnt = cardEl?.classList.contains('burnt');
            const legsTotal = (cfg.legs || []).length;
            const legsWon = (cfg.legsWon || []).length;
            return {
              id: tId,
              name: cfg.name,
              type: cfg.type,
              cashStake: cfg.cashStake,
              promoStake: cfg.promoStake,
              payout: cfg.payout,
              isPromo: cfg.isPromo,
              status: isCashed ? 'WON' : (isBurnt ? 'BURNT' : 'LOST'),
              netProfit: isCashed ? (cfg.payout - cfg.cashStake) : -cfg.cashStake,
              isSplit: splitState[tId] === true,
              legsTotal,
              legsWon
            };
          })
      };

      let totalCash = 0;
      let totalPromo = 0;
      let totalReturned = 0;
      let ticketsWon = 0;
      let ticketsTotal = snapshot.wagers.length;
      let totalLegsWon = 0;
      let totalLegsTotal = 0;
      let alejandroNet = 0;

      snapshot.wagers.forEach(w => {
        totalCash += w.cashStake;
        totalPromo += w.promoStake;
        totalLegsWon += w.legsWon;
        totalLegsTotal += w.legsTotal;
        if (w.status === 'WON') {
          totalReturned += w.payout;
          ticketsWon++;
        }
        if (w.isSplit) {
          const cost = w.isPromo ? 0 : w.cashStake * 0.5;
          const cashedShare = (w.status === 'WON') ? (w.payout * 0.5) : 0;
          alejandroNet += (cashedShare - cost);
        }
      });

      const netPnl = totalReturned - totalCash;
      const roi = totalCash > 0 ? (netPnl / totalCash) * 100 : 0;

      snapshot.metrics = {
        totalCash,
        totalPromo,
        totalReturned,
        netPnl,
        roi,
        ticketsWon,
        ticketsTotal,
        totalLegsWon,
        totalLegsTotal,
        alejandroNet
      };

      archivedGames.unshift(snapshot);
      try {
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedGames));
      } catch (e) {}

      updateArchiveBadges();
      renderArchiveDrawer();
    }

    function toggleArchiveDrawer() {
      const modal = document.getElementById('archive-modal');
      if (!modal) return;
      if (modal.style.display === 'flex') {
        modal.style.display = 'none';
      } else {
        modal.style.display = 'flex';
        renderArchiveDrawer();
      }
    }

    function renderArchiveDrawer() {
      const container = document.getElementById('archive-log-container');
      if (!container) return;

      let cumCash = 0;
      let cumPromo = 0;
      let cumReturned = 0;
      let cumWon = 0;
      let cumTotal = 0;
      let cumLegsWon = 0;
      let cumLegsTotal = 0;
      let cumAlejandro = 0;

      archivedGames.forEach(g => {
        const m = g.metrics || {};
        cumCash += (m.totalCash || 0);
        cumPromo += (m.totalPromo || 0);
        cumReturned += (m.totalReturned || 0);
        cumWon += (m.ticketsWon || 0);
        cumTotal += (m.ticketsTotal || 0);
        cumLegsWon += (m.totalLegsWon || 0);
        cumLegsTotal += (m.totalLegsTotal || 0);
        cumAlejandro += (m.alejandroNet || 0);
      });

      const cumPnl = cumReturned - cumCash;
      const cumRoi = cumCash > 0 ? (cumPnl / cumCash) * 100 : 0;
      const winRate = cumTotal > 0 ? ((cumWon / cumTotal) * 100).toFixed(1) : 0;
      const propsRate = cumLegsTotal > 0 ? ((cumLegsWon / cumLegsTotal) * 100).toFixed(1) : 0;

      const pnlEl = document.getElementById('arch-net-pnl');
      if (pnlEl) {
        pnlEl.textContent = (cumPnl >= 0 ? '+$' : '-$') + Math.abs(cumPnl).toFixed(2);
        pnlEl.style.color = cumPnl >= 0 ? '#10B981' : '#EF4444';
      }
      const roiEl = document.getElementById('arch-roi');
      if (roiEl) {
        roiEl.textContent = (cumRoi >= 0 ? '+' : '') + cumRoi.toFixed(1) + '%';
        roiEl.style.color = cumRoi >= 0 ? '#10B981' : '#EF4444';
      }
      const recEl = document.getElementById('arch-ticket-record');
      if (recEl) {
        recEl.textContent = cumWon + ' - ' + (cumTotal - cumWon) + ' (' + winRate + '%)';
      }
      const propsEl = document.getElementById('arch-props-record');
      if (propsEl) {
        propsEl.textContent = cumLegsWon + ' / ' + cumLegsTotal + ' (' + propsRate + '%)';
      }
      const alejEl = document.getElementById('arch-alejandro-balance');
      if (alejEl) {
        alejEl.textContent = (cumAlejandro >= 0 ? '+$' : '-$') + Math.abs(cumAlejandro).toFixed(2);
        alejEl.style.color = cumAlejandro >= 0 ? '#10B981' : '#EF4444';
      }

      if (archivedGames.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">No archived slates yet. Click [Grade &amp; Settle Slate] to record current session results.</div>';
        return;
      }

      container.innerHTML = archivedGames.map(function(g) {
        const m = g.metrics || {};
        const isPos = (m.netPnl || 0) >= 0;
        const pnlColor = isPos ? '#10B981' : '#EF4444';
        const pnlText = (isPos ? '+$' : '-$') + Math.abs(m.netPnl || 0).toFixed(2);
        return '<div style="background:#0F172A; border:1px solid #1E293B; border-radius:8px; padding:12px; margin-bottom:10px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
            '<div>' +
              '<strong>' + g.gameTitle + '</strong>' +
              '<div style="font-size:0.68rem; color:var(--text-muted);">' + new Date(g.archivedAt).toLocaleString() + '</div>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<div style="font-size:0.95rem; font-weight:800; color:' + pnlColor + ';">' + pnlText + '</div>' +
              '<div style="font-size:0.68rem; color:var(--text-muted);">ROI: ' + (m.roi || 0).toFixed(1) + '%</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; gap:12px; font-size:0.72rem; color:#CBD5E1; border-top:1px solid #1E293B; padding-top:6px;">' +
            '<span>Staked: $' + Number(m.totalCash || 0).toFixed(2) + '</span>' +
            '<span>Returned: $' + Number(m.totalReturned || 0).toFixed(2) + '</span>' +
            '<span>Slips Won: ' + (m.ticketsWon || 0) + ' / ' + (m.ticketsTotal || 0) + '</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function exportArchiveJson() {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(archivedGames, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', 'nfl_sunday_performance_week_' + ${week} + '.json');
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    function clearArchiveHistory() {
      if (confirm('Clear all archived performance history for this week?')) {
        archivedGames = [];
        try { localStorage.removeItem(ARCHIVE_KEY); } catch (e) {}
        updateArchiveBadges();
        renderArchiveDrawer();
        showToast('🗑️ Performance archive history cleared.');
      }
    }

    function showToast(msg) {
      const existing = document.querySelector('.toast-notification');
      if (existing) existing.remove();
      const t = document.createElement('div');
      t.className = 'toast-notification';
      t.innerHTML = msg;
      document.body.appendChild(t);
      setTimeout(() => { if (t.parentElement) t.remove(); }, 3200);
    }

    function tickCountdown() {
      refreshCountdown--;
      const el = document.getElementById('refresh-countdown');
      if (el) el.textContent = refreshCountdown;
      if (refreshCountdown <= 0) {
        refreshCountdown = 15;
        fetchLiveScoreboard();
      }
    }

    let isPolling = false;
    let pollSeq = 0;

    async function fetchLiveScoreboard() {
      if (isPolling) return;
      isPolling = true;
      const currentSeq = ++pollSeq;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          console.warn('Scoreboard HTTP error:', res.status);
          return;
        }
        const data = await res.json();
        if (currentSeq !== pollSeq) return; // Stale response guard
        if (data && Array.isArray(data.events)) {
          // Trigger summary fetch for all live or completed games
          data.events.forEach(ev => {
            const isCompleted = ev.status?.type?.completed === true || ev.status?.type?.name === 'STATUS_FINAL';
            const isLive = ev.status?.type?.state === 'in';
            if (ev.id && (isLive || isCompleted)) {
              fetchSummaryForEvent(String(ev.id), isLive, isCompleted);
            }
          });

          try {
            updateLeftSidebarScoreboard(data.events);
          } catch (sbErr) {
            console.error('Left sidebar scoreboard live update failed:', sbErr);
          }
          try {
            updateSuperContestLiveScores(data.events);
          } catch (scErr) {
            console.error('SuperContest live update failed:', scErr);
          }
          try {
            updateFantasyLiveScores(data.events);
          } catch (ffErr) {
            console.error('Fantasy live update failed:', ffErr);
          }
          try {
            updateAllLegPacingGrades(data.events);
          } catch (paceErr) {
            console.error('Leg pacing live update failed:', paceErr);
          }
        }
      } catch (err) {
        console.warn('Live score poll failed:', err.message || err);
        try {
          const schedRes = await fetch('schedule.json');
          if (schedRes.ok) {
            const schedData = await schedRes.json();
            const wSched = schedData.filter(g => g.week === 1 || g.week === ${week});
            updateLeftSidebarFromSchedule(wSched);
          }
        } catch {}
      } finally {
        isPolling = false;
      }
    }

    document.addEventListener('DOMContentLoaded', loadState);
  </script>
  <!-- ADD NEW SLIP MODAL (SUNDAY & BEYOND) -->
  <div id="add-slip-modal" class="modal-overlay" style="display:none;" onclick="if(event.target===this) closeAddSlipModal()">
    <div class="modal-card" style="max-width: 620px;">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.2rem;">➕</span>
          <div>
            <div style="font-size:0.95rem; font-weight:800; color:#F8FAFC;">Add New Wager / Sunday Slip</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">Dynamically add custom parlays, props, or Sunday plays to the live board</div>
          </div>
        </div>
        <button class="modal-close-btn" onclick="closeAddSlipModal()">✕</button>
      </div>
      <div class="modal-body add-slip-modal" style="padding:18px;">
        <div style="display:flex; gap:10px; margin-bottom:10px;">
          <div style="flex:2;">
            <label style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; margin-bottom:3px;">Ticket Title</label>
            <input type="text" id="add-slip-name" placeholder="e.g. Sunday Core SGP (Lions / Texans)" style="width:100%; background:#0F172A; border:1px solid #334155; border-radius:6px; color:#F8FAFC; padding:6px 10px; font-size:0.75rem;">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; margin-bottom:3px;">Sportsbook</label>
            <input type="text" id="add-slip-book" placeholder="e.g. BetOnline / DraftKings" style="width:100%; background:#0F172A; border:1px solid #334155; border-radius:6px; color:#F8FAFC; padding:6px 10px; font-size:0.75rem;">
          </div>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:10px;">
          <div style="flex:1;">
            <label style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; margin-bottom:3px;">Stake ($)</label>
            <input type="number" id="add-slip-stake" step="0.5" placeholder="10.00" style="width:100%; background:#0F172A; border:1px solid #334155; border-radius:6px; color:#F8FAFC; padding:6px 10px; font-size:0.75rem;">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; margin-bottom:3px;">Potential Payout ($)</label>
            <input type="number" id="add-slip-payout" step="0.5" placeholder="85.00" style="width:100%; background:#0F172A; border:1px solid #334155; border-radius:6px; color:#F8FAFC; padding:6px 10px; font-size:0.75rem;">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; margin-bottom:3px;">Funding Type</label>
            <select id="add-slip-type" style="width:100%; background:#0F172A; border:1px solid #334155; border-radius:6px; color:#F8FAFC; padding:6px 10px; font-size:0.75rem;">
              <option value="cash">Cash Wager</option>
              <option value="promo">Promo Credit ($0 Cash Risk)</option>
            </select>
          </div>
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; margin-bottom:3px;">Legs (One per line: Selection • Source/Expert)</label>
          <textarea id="add-slip-legs" rows="3" placeholder="Amon-Ra St. Brown 70+ Rec Yds • Steve Fezzik&#10;Jahmyr Gibbs 1+ TD • Mike Spector&#10;Detroit Lions ML -317 • StatTree Model" style="width:100%; background:#0F172A; border:1px solid #334155; border-radius:6px; color:#F8FAFC; padding:6px 10px; font-size:0.75rem; font-family:inherit;"></textarea>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
          <span style="font-size:0.7rem; color:var(--text-muted);">Ticket persists in local storage &amp; links with Alejandro split</span>
          <div style="display:flex; gap:8px;">
            <button class="btn-action" onclick="closeAddSlipModal()">Cancel</button>
            <button class="btn-action btn-settle-action" onclick="submitNewSlip()">➕ Add to Live Board</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PERFORMANCE & ARCHIVED GAMES MODAL -->
  <div id="archive-modal" class="modal-overlay" style="display:none;" onclick="if(event.target===this) toggleArchiveDrawer()">
    <div class="modal-card">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.2rem;">📈</span>
          <div>
            <div style="font-size:0.95rem; font-weight:800; color:#F8FAFC;">Sunday Multi-Game Performance Archive • Week ${week}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">Historical performance records across all archived games</div>
          </div>
        </div>
        <button class="modal-close-btn" onclick="toggleArchiveDrawer()">✕</button>
      </div>

      <div class="modal-body">
        <div class="archive-metrics-grid">
          <div class="archive-metric-card">
            <div class="metric-label">Settled Slips</div>
            <div class="metric-val" id="arch-games-count">0</div>
          </div>
          <div class="archive-metric-card">
            <div class="metric-label">Net Profit / Loss</div>
            <div class="metric-val" id="arch-net-pnl">$0.00</div>
          </div>
          <div class="archive-metric-card">
            <div class="metric-label">Cash Risk ROI</div>
            <div class="metric-val" id="arch-roi">0.0%</div>
          </div>
          <div class="archive-metric-card">
            <div class="metric-label">Tickets Win Rate</div>
            <div class="metric-val" id="arch-ticket-record">0 - 0 (0%)</div>
          </div>
          <div class="archive-metric-card">
            <div class="metric-label">Player Props Hit Rate</div>
            <div class="metric-val" id="arch-props-record">0 / 0 (0%)</div>
          </div>
          <div class="archive-metric-card">
            <div class="metric-label">Alejandro Net Balance</div>
            <div class="metric-val" id="arch-alejandro-balance">$0.00</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin:16px 0 8px 0;">
          <strong style="font-size:0.8rem; color:#E2E8F0;">Archived Sunday Wagers Log</strong>
          <div style="display:flex; gap:6px;">
            <button class="btn-action" style="font-size:0.68rem;" onclick="exportArchiveJson()">📥 Export JSON</button>
            <button class="btn-action" style="font-size:0.68rem; color:#FCA5A5; border-color:#7F1D1D;" onclick="clearArchiveHistory()">🗑️ Clear Archive</button>
          </div>
        </div>

        <div id="archive-log-container" style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </div>
  </div>

</body>
</html>
`;

  for (const outPath of outPaths) {
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, html, 'utf8');
    console.log(`   ✅ Wrote Live Tracker HTML: ${path.relative(ROOT, outPath)}`);
  }

  return { html, wagersCount: wagers.length };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const args = process.argv.slice(2);
  const weekIdx = args.indexOf('--week');
  const week = weekIdx >= 0 ? parseInt(args[weekIdx + 1], 10) : DEFAULT_WEEK;
  const outIdx = args.indexOf('--out');
  const customOut = outIdx >= 0 ? [path.resolve(ROOT, args[outIdx + 1])] : [DEFAULT_OUT_PUBLIC, DEFAULT_OUT_DOCS];

  generateLiveTracker({ week, outPaths: customOut }).catch(err => {
    console.error(`❌ Live Tracker generation failed:`, err);
    process.exit(1);
  });
}