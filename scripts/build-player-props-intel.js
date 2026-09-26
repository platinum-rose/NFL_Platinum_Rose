#!/usr/bin/env node

/**
 * build-player-props-intel.js
 *
 * Dedicated extraction and synthesis pipeline for NFL Player Props and Same Game Parlays (SGPs).
 * Reads research intel articles across VSiN, BettingPros, Sharp Football, Walter Football,
 * Action Network, and bookmarks, extracts structured player prop intelligence, computes
 * parlay correlation synergies, and generates interactive HTML and Markdown parlay tools.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadArticles } from './build-article-intel-review.js';
import { getNFLWeekInfo, getSeasonStartDate } from '../src/lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const OUT_DIR_DOCS = path.join(ROOT, 'docs', 'player-props-intel');
const OUT_DIR_DATA = path.join(ROOT, 'data', 'research-intel', 'review');

const LATEST_JSON = path.join(OUT_DIR_DATA, 'player-props-intel-latest.json');
const LATEST_MD = path.join(OUT_DIR_DOCS, 'player-props-intel-latest.md');
const LATEST_HTML = path.join(OUT_DIR_DOCS, 'player-props-intel-latest.html');

function clean(str = '') {
  return String(str || '')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function esc(str = '') {
  return clean(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseAmericanOdds(oddsStr) {
  if (!oddsStr) return null;
  const match = String(oddsStr).match(/([+-]\d{3,5})/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function americanToDecimal(american) {
  if (!american || Number.isNaN(american)) return 1.91;
  if (american > 0) return 1 + american / 100;
  return 1 + 100 / Math.abs(american);
}

function decimalToAmerican(decimal) {
  if (!decimal || decimal <= 1) return '+100';
  if (decimal >= 2.0) {
    const val = Math.round((decimal - 1) * 100);
    return `+${val}`;
  }
  const val = Math.round(100 / (decimal - 1));
  return `-${val}`;
}

export function calculateParlayOdds(oddsArray) {
  if (!oddsArray || oddsArray.length === 0) return { decimal: 1.0, american: '+100' };
  let totalDecimal = 1.0;
  for (const o of oddsArray) {
    const num = typeof o === 'number' ? o : parseAmericanOdds(o);
    totalDecimal *= americanToDecimal(num);
  }
  return {
    decimal: Number(totalDecimal.toFixed(3)),
    american: decimalToAmerican(totalDecimal),
  };
}

// ---------------------------------------------------------------------------
// Dynamic player roster + weekly schedule mapping.
//
// This used to be a hand-typed PLAYER_TEAM_MAP keyed to whichever games were
// on the Week 1 slate -- it silently kept mapping every player to a Week 1
// game forever, since nothing regenerated it. Replaced with two real data
// sources so the map is always correct for the week the pipeline actually
// runs against:
//   1. ESPN's public team-roster API (all 32 teams, offense group) for
//      player -> {team, position}, cached to disk for ROSTER_CACHE_MAX_AGE_MS
//      so we are not re-fetching 32 endpoints on every run.
//   2. public/schedule.json (the repo's own canonical schedule, already used
//      by generate-live-tracker.mjs) for team -> this week's game + slate.
// ---------------------------------------------------------------------------

const ROSTER_CACHE_DIR = path.join(ROOT, 'data', 'nfl-rosters');
const ROSTER_CACHE_PATH = path.join(ROSTER_CACHE_DIR, 'roster-map-latest.json');
const ROSTER_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12h

const ESPN_TEAM_SLUGS = {
  ARI: 'ari', ATL: 'atl', BAL: 'bal', BUF: 'buf', CAR: 'car', CHI: 'chi',
  CIN: 'cin', CLE: 'cle', DAL: 'dal', DEN: 'den', DET: 'det', GB: 'gb',
  HOU: 'hou', IND: 'ind', JAX: 'jax', KC: 'kc', LV: 'lv', LAC: 'lac',
  LAR: 'lar', MIA: 'mia', MIN: 'min', NE: 'ne', NO: 'no', NYG: 'nyg',
  NYJ: 'nyj', PHI: 'phi', PIT: 'pit', SF: 'sf', SEA: 'sea', TB: 'tb',
  TEN: 'ten', WSH: 'wsh', WAS: 'wsh',
};

async function fetchTeamRoster(teamAbbr, slug) {
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${slug}/roster`);
  if (!res.ok) throw new Error(`ESPN roster fetch failed for ${teamAbbr}: ${res.status}`);
  const data = await res.json();
  const out = [];
  for (const group of data.athletes || []) {
    // Offense group covers the skill positions + QB/OL that player props are written about.
    if (group.position !== 'offense') continue;
    for (const p of group.items || []) {
      if (!p.fullName) continue;
      out.push({ name: p.fullName, team: teamAbbr, position: p.position?.abbreviation || '' });
    }
  }
  return out;
}

/**
 * Load a player-name -> {team, position} map covering all 32 teams' offensive
 * players, from a fresh ESPN fetch or a same-day disk cache.
 */
async function loadPlayerRosterMap() {
  try {
    const stat = fs.statSync(ROSTER_CACHE_PATH);
    if (Date.now() - stat.mtimeMs < ROSTER_CACHE_MAX_AGE_MS) {
      const cached = JSON.parse(fs.readFileSync(ROSTER_CACHE_PATH, 'utf8'));
      if (cached && cached.players && Object.keys(cached.players).length > 0) {
        return new Map(Object.entries(cached.players));
      }
    }
  } catch {
    // no cache yet, fall through to a live fetch
  }

  const entries = Object.entries(ESPN_TEAM_SLUGS).filter(([abbr]) => abbr !== 'WAS'); // WAS/WSH alias, fetch once
  const results = await Promise.all(entries.map(([abbr, slug]) => fetchTeamRoster(abbr, slug).catch((err) => {
    console.warn(`⚠️ Warning: roster fetch failed for ${abbr}: ${err.message}`);
    return [];
  })));

  const map = new Map();
  for (const teamPlayers of results) {
    for (const p of teamPlayers) {
      map.set(p.name, { team: p.team, position: p.position });
    }
  }

  try {
    fs.mkdirSync(ROSTER_CACHE_DIR, { recursive: true });
    fs.writeFileSync(ROSTER_CACHE_PATH, JSON.stringify({
      generated_at: new Date().toISOString(),
      player_count: map.size,
      players: Object.fromEntries(map),
    }, null, 2), 'utf8');
  } catch (err) {
    console.warn(`⚠️ Warning: could not write roster cache: ${err.message}`);
  }

  return map;
}

function slateLabelFor(kickoffUtc) {
  const d = new Date(kickoffUtc);
  // Shift to approximate US Eastern time before reading the day-of-week -- a Thursday
  // 8:15pm ET kickoff is already past midnight UTC (Friday), so reading getUTCDay()
  // directly mislabels every prime-time night game as the following calendar day.
  const etDate = new Date(d.getTime() - 4 * 60 * 60 * 1000); // approx ET (ignores DST edge cases)
  const day = etDate.getUTCDay();
  const etHour = etDate.getUTCHours();
  if (day === 1) return 'Monday Night Football';
  if (day === 4) return 'Thursday Night Football';
  if (day === 3) return 'Wednesday Night Football';
  if (day === 5) return 'Friday Night Football';
  if (day === 6) return 'Saturday Football';
  // Sunday: split early/late/night window by ET hour.
  if (etHour >= 20) return 'Sunday Night Football';
  if (etHour >= 16) return 'Sunday Late Window';
  return 'Sunday Early Window';
}

/**
 * Build team-abbreviation -> {game, game_slate} for one week from the repo's
 * own public/schedule.json (the same file generate-live-tracker.mjs reads),
 * so player props always resolve to the game that's actually being played.
 */
function loadWeekGameMap(week, season) {
  const schedulePath = path.join(ROOT, 'public', 'schedule.json');
  let schedule = [];
  try {
    schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
  } catch (err) {
    console.warn(`⚠️ Warning: could not read public/schedule.json: ${err.message}`);
    return { teamGameMap: new Map(), games: [] };
  }

  // 2026-09-26: drop games that have already been played. public/schedule.json's
  // status/score are not reliably updated (ATL@GB still read status "pre", 0-0,
  // the Saturday after TNF), so gate on kickoff time too: anything that kicked
  // off more than 4h ago is over. Without this the Week 3 dossier recommended
  // a TNF ATL/GB SGP on Saturday for a game that was already final.
  const nowMs = Date.now();
  const isFinished = (g) => /final|post/i.test(String(g.status || ''))
    || (g.kickoff_utc && new Date(g.kickoff_utc).getTime() + 4 * 3600e3 < nowMs);
  const weekGames = schedule.filter((g) => g.week === week && g.season === season && g.season_type === 2 && !isFinished(g));
  const teamGameMap = new Map();
  const games = [];
  for (const g of weekGames) {
    const label = `${g.visitor} @ ${g.home}`;
    const slate = slateLabelFor(g.kickoff_utc);
    teamGameMap.set(g.visitor, { game: label, game_slate: slate, home: g.home, visitor: g.visitor });
    teamGameMap.set(g.home, { game: label, game_slate: slate, home: g.home, visitor: g.visitor });
    games.push({ game: label, game_slate: slate, home: g.home, visitor: g.visitor, kickoff_utc: g.kickoff_utc });
  }
  return { teamGameMap, games };
}

/**
 * Extract real player-prop recommendations directly out of article bodies.
 *
 * Replaces the old hand-transcribed per-article blocks (which only "worked"
 * because each one hardcoded article.id === <Week 1 article id>, so the
 * pipeline was really just replaying a fixed Week 1 script forever). This
 * scans actual article text for the "<Player Name> <prop description> ( <odds> )"
 * pattern that BettingPros / VSiN / Action Network / Walter Football / Sharp
 * Football consistently use for single-prop callouts, validates the captured
 * name against a real current player roster, and resolves team/game/slate
 * from the real weekly schedule.
 *
 * @param {Array} articles - rows from loadArticles() (id, source, title, author, body, url, published_at)
 * @param {Object} ctx
 * @param {Map} ctx.rosterMap - player name -> {team, position}, from loadPlayerRosterMap()
 * @param {Map} ctx.teamGameMap - team abbr -> {game, game_slate}, from loadWeekGameMap()
 * @param {number} ctx.week - current NFL week, used only for labeling/fallbacks
 */
export function extractCuratedPlayerProps(articles = [], ctx = {}) {
  const rosterMap = ctx.rosterMap || new Map();
  const teamGameMap = ctx.teamGameMap || new Map();
  const week = ctx.week || null;

  // "<Name> <description...> ( <american odds> )" -- the format BettingPros/VSiN/
  // Action Network/Walter Football/Sharp Football all use for single-prop callouts,
  // e.g. "Jameson Williams 60+ Yards ( -112 )" or "DJ Moore First Touchdown Scorer ( +1000 )".
  // Player name: 1-4 Title-Case words (allows initials like "A.J.", apostrophes, hyphens).
  const PROP_LINE_RE = /([A-Z][a-zA-Z.'-]*(?:\s+[A-Z][a-zA-Z.'-]*){0,3})\s+((?:Over|Under|\d+\+|First Touchdown Scorer|Anytime Touchdown Scorer|Last Touchdown Scorer|To Score \d)[^(]{0,90}?)\(\s*([+-]\d{3,5})\s*\)/g;

  const CATEGORY_RULES = [
    { re: /first touchdown/i, category: 'first_td', label: 'First Touchdown Scorer', statType: 'touchdown' },
    { re: /anytime touchdown/i, category: 'anytime_td', label: 'Anytime Touchdown Scorer', statType: 'touchdown' },
    { re: /last touchdown/i, category: 'last_td', label: 'Last Touchdown Scorer', statType: 'touchdown' },
    { re: /to score \d/i, category: 'anytime_td', label: 'Anytime Touchdown Scorer', statType: 'touchdown' },
    { re: /passing\s*(td|touchdown)/i, category: 'passing_tds', label: 'Passing TDs', statType: 'passing' },
    { re: /pass(ing)?\s*yard/i, category: 'passing_yards', label: 'Passing Yards', statType: 'passing' },
    { re: /interception/i, category: 'interceptions', label: 'Interceptions', statType: 'passing' },
    { re: /completion/i, category: 'completions', label: 'Completions', statType: 'passing' },
    { re: /rush(ing)?\s*(td|touchdown)/i, category: 'rushing_tds', label: 'Rushing TDs', statType: 'rushing' },
    { re: /rush(ing)?\s*yard/i, category: 'rushing_yards', label: 'Rushing Yards', statType: 'rushing' },
    { re: /rush(ing)?\s*attempt/i, category: 'rush_attempts', label: 'Rush Attempts', statType: 'rushing' },
    { re: /pass(ing)?\s*attempt/i, category: 'pass_attempts', label: 'Pass Attempts', statType: 'passing' },
    { re: /rece(iving|ption)\s*(td|touchdown)/i, category: 'receiving_tds', label: 'Receiving TDs', statType: 'receiving' },
    { re: /rece?iving\s*yard/i, category: 'receiving_yards', label: 'Receiving Yards', statType: 'receiving' },
    { re: /reception/i, category: 'receptions', label: 'Receptions', statType: 'receiving' },
    { re: /longest\s*(reception|rush|completion)/i, category: 'longest_play', label: 'Longest Play', statType: 'other' },
    { re: /(sack|tackle|interception thrown)/i, category: 'defense', label: 'Defensive Prop', statType: 'defense' },
  ];

  function classify(descriptionRaw) {
    const description = descriptionRaw.trim();
    for (const rule of CATEGORY_RULES) {
      if (rule.re.test(description)) {
        return { category: rule.category, category_label: rule.label, stat_type: rule.statType };
      }
    }
    // Bare "60+ Yards" callouts with no stat keyword are almost always receiving yards
    // (the most commonly shorthanded prop type in these articles).
    if (/^\d+\+\s*Yards?$/i.test(description)) {
      return { category: 'receiving_yards', category_label: 'Receiving/Rushing Yards', stat_type: 'other' };
    }
    return { category: 'other', category_label: description.replace(/\s+/g, ' ').trim() || 'Prop', stat_type: 'other' };
  }

  function parseLineAndSide(descriptionRaw) {
    const description = descriptionRaw.trim();
    let m = description.match(/^Over\s*([\d.]+)/i);
    if (m) return { line: m[1], side: 'over' };
    m = description.match(/^Under\s*([\d.]+)/i);
    if (m) return { line: m[1], side: 'under' };
    m = description.match(/^(\d+)\+/);
    if (m) return { line: `${m[1]}+`, side: 'over' };
    if (/touchdown scorer/i.test(description)) return { line: 'Yes', side: 'anytime' };
    return { line: description, side: 'n/a' };
  }

  const rawMatches = [];
  const seenIds = new Set();

  for (const article of articles) {
    const author = clean(article.author || 'Analyst Staff');
    const source = clean(article.source || 'Intel Report');
    const body = clean(article.body || '');
    if (!body) continue;

    let match;
    PROP_LINE_RE.lastIndex = 0;
    while ((match = PROP_LINE_RE.exec(body)) !== null) {
      const rawName = match[1].trim();
      const descriptionRaw = match[2];
      const priceStr = match[3];

      const player = rosterMap.get(rawName);
      if (!player) continue; // skip anything that isn't a real, currently-rostered offensive player

      const { team } = player;
      const gameInfo = teamGameMap.get(team);
      if (!gameInfo) continue; // team isn't playing this week (bye, or stale roster data) -- skip rather than mislabel

      const { category, category_label, stat_type } = classify(descriptionRaw);
      const { line, side } = parseLineAndSide(descriptionRaw);

      const contextStart = Math.max(0, match.index - 40);
      const contextEnd = Math.min(body.length, match.index + match[0].length + 500);
      const rationale = clean(body.slice(match.index + match[0].length, contextEnd)).split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');

      const id = `prop__${(article.id ?? 'x')}__${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}__${category}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      rawMatches.push({
        id,
        player: rawName,
        team,
        game: gameInfo.game,
        game_slate: gameInfo.game_slate,
        category,
        category_label,
        stat_type,
        line,
        side,
        price: priceStr,
        book: 'DraftKings/FanDuel (per source article)',
        analyst: `${author} (${source})`,
        source_article_id: article.id ?? null,
        source_url: article.url || null,
        rationale: rationale || `${rawName} prop flagged by ${author} (${source}).`,
        week,
      });
    }
  }

  // Rank within each article-ish grouping (source+author) so the first props an
  // analyst calls out (their "best bets", listed first in these articles) land
  // in Tier 1 and the rest land in Tier 2 -- a reasonable, non-fabricated proxy
  // for "featured" vs "secondary" since we aren't hand-labeling confidence.
  const byAnalyst = new Map();
  for (const p of rawMatches) {
    if (!byAnalyst.has(p.analyst)) byAnalyst.set(p.analyst, []);
    byAnalyst.get(p.analyst).push(p);
  }
  const props = [];
  for (const [, list] of byAnalyst) {
    list.forEach((p, idx) => {
      p.tier = idx < 2 ? 1 : idx < 5 ? 2 : 3;
      p.tier_label = p.tier === 1 ? 'Tier 1: Featured Pick' : p.tier === 2 ? 'Tier 2: Secondary Pick' : 'Tier 3: Depth Pick';
      p.weight = p.tier === 1 ? 1.0 : p.tier === 2 ? 0.7 : 0.4;
      props.push(p);
    });
  }

  // Attach a lightweight, generic parlay_utility (role from stat type, synergy
  // tags from category, and positive correlations limited to other real props
  // extracted in the same game -- no invented player names or made-up numbers).
  const byGame = new Map();
  for (const p of props) {
    if (!byGame.has(p.game)) byGame.set(p.game, []);
    byGame.get(p.game).push(p);
  }
  const ROLE_BY_STAT_TYPE = {
    passing: 'Passing Volume Anchor',
    rushing: 'Ground Game Piece',
    receiving: 'Pass-Catching Piece',
    touchdown: 'End-Zone Target',
    defense: 'Defensive/Situational Piece',
    other: 'Complementary Piece',
  };
  for (const p of props) {
    const gamePeers = (byGame.get(p.game) || []).filter((peer) => peer.id !== p.id);
    p.parlay_utility = {
      role: ROLE_BY_STAT_TYPE[p.stat_type] || 'Complementary Piece',
      synergy_tags: [p.category, `${p.team}_offense`],
      positive_correlations: gamePeers
        .filter((peer) => peer.team === p.team && (peer.side === p.side || peer.side === 'anytime' || p.side === 'anytime'))
        .slice(0, 3)
        .map((peer) => `${peer.player} ${peer.category_label}`),
    };
  }

  return props;
}

/**
 * Pre-engineered curated Parlay Cards built from positive correlation synergy
 */
export function buildCuratedParlayCards(props = []) {
  // Build same-game parlay cards dynamically from whatever real props were
  // extracted this week, instead of hand-authoring fixed legs against Week 1
  // matchups. For each game with enough extracted props, take the top-weighted
  // legs (favoring different stat types so legs aren't redundant), compute the
  // combined odds with the same math the old hardcoded cards used, and label
  // everything from the real team names -- no invented synergy numbers.
  const byGame = new Map();
  for (const p of props) {
    if (!byGame.has(p.game)) byGame.set(p.game, []);
    byGame.get(p.game).push(p);
  }

  const cards = [];
  for (const [game, gameProps] of byGame) {
    if (gameProps.length < 2) continue; // not enough real signal to stack a parlay

    const sorted = [...gameProps].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    const legs = [];
    const usedStatTypes = new Set();
    for (const p of sorted) {
      if (legs.length >= 3) break;
      if (usedStatTypes.has(p.stat_type) && legs.length > 0) continue; // prefer variety across legs
      legs.push(p);
      usedStatTypes.add(p.stat_type);
    }
    // If variety filtering left us with fewer than 2 legs, just take the top 2-3 by weight.
    if (legs.length < 2) {
      legs.length = 0;
      for (const p of sorted.slice(0, 3)) legs.push(p);
    }
    if (legs.length < 2) continue;

    const odds = calculateParlayOdds(legs.map((l) => l.price));
    const [awayAbbr, homeAbbr] = game.split(' @ ');
    const teams = [...new Set(legs.map((l) => l.team))];
    const teamLabel = teams.length === 1 ? teams[0] : `${awayAbbr}/${homeAbbr}`;

    cards.push({
      id: `parlay__${game.replace(/\s+/g, '_').replace(/@/g, 'at')}__${teamLabel.toLowerCase()}_stack`,
      title: `${teamLabel} Prop Stack SGP (${game})`,
      game,
      game_slate: legs[0]?.game_slate || 'This Week',
      type: 'same_game_parlay',
      book: 'DraftKings / FanDuel',
      leg_count: legs.length,
      legs: legs.map((l) => ({
        ...l,
        selection: l.side === 'anytime' ? l.category_label : `${l.side === 'over' ? 'Over' : l.side === 'under' ? 'Under' : ''} ${l.line} ${l.category_label}`.trim(),
      })),
      estimated_odds: odds.american,
      payout_multiplier: `${odds.decimal.toFixed(2)}x`,
      payout_on_10: `$${(odds.decimal * 10).toFixed(2)}`,
      payout_on_25: `$${(odds.decimal * 25).toFixed(2)}`,
      correlation_rating: teams.length === 1 ? 'Same-Team Stack' : 'Cross-Team Game Stack',
      synergy_rationale: `Combines ${legs.length} real props extracted this week from ${[...new Set(legs.map((l) => l.analyst))].join(', ')} for ${game}.`,
    });
  }

  return cards.sort((a, b) => b.leg_count - a.leg_count);
}

/**
 * Render comprehensive Markdown report for Player Props & Parlays
 */
export function renderMarkdown(data) {
  const { summary, props, parlayCards, week } = data;
  const weekLabel = week ? `Week ${week}` : 'Current Week';
  const lines = [
    `# NFL ${weekLabel} Player Prop & Parlay Intelligence Dossier`,
    '',
    `> **Generated**: ${data.generated_at}  `,
    `> **Scope**: Dedicated player prop extraction pass from recent intelligence articles (${summary.articles_scanned} articles scanned).  `,
    `> **Actionable Props Extracted**: **${summary.total_props} player props** across **${summary.games_covered} games**.  `,
    `> **Curated Pre-Built Parlay Stacks**: **${summary.curated_parlays} correlated parlay cards** ready for execution.`,
    '',
    '---',
    '',
    '## 1. Executive Summary & Slate Overview',
    '',
    'This dossier isolates pure player prop intelligence to build high-ROI Same Game Parlays (SGPs) and cross-game correlated cards. It combines explicit expert best bets (BettingPros, VSiN, Sharp Football, Walter Football) with mathematical projection edges (OptaAI) and situational usage intel.',
    '',
    '| Metric | Value | Meaning |',
    '| :--- | :--- | :--- |',
    `| **Total Player Props** | **${summary.total_props}** | Verified player prop recommendations with lines and odds |`,
    `| **Tier 1 Best Bet Props** | **${summary.tier_1_props}** | Official analyst recommended best bets (Weight: 1.00) |`,
    `| **Anytime / First TD Scorers** | **${summary.touchdown_props}** | High-leverage end-zone targets for multiplier legs |`,
    `| **Curated Parlay Cards** | **${summary.curated_parlays}** | Positively correlated SGP & cross-game cards (+645 to +810) |`,
    `| **Games With Extracted Props** | **${summary.games_covered}** | ${[...new Set(props.map((p) => p.game))].slice(0, 6).join(', ') || 'None yet this week'} |`,
    '',
    '---',
    '',
    '## 2. Curated Pre-Built Parlay Cards (Positive Correlation Synergy)',
    '',
  ];

  for (const card of parlayCards) {
    lines.push(`### 🎯 ${card.title}`);
    lines.push(`- **Game / Slate**: \`${card.game}\` (${card.game_slate})`);
    lines.push(`- **Estimated Parlay Odds**: **\`${card.estimated_odds}\`** (Payout: **${card.payout_multiplier}** | \$10 pays ${card.payout_on_10}, \$25 pays ${card.payout_on_25})`);
    lines.push(`- **Correlation Rating**: **${card.correlation_rating}**`);
    lines.push(`- **Recommended Sportsbook**: ${card.book}`);
    lines.push(`- **Synergy Rationale**: *${card.synergy_rationale}*`);
    lines.push('');
    lines.push('| Leg # | Player | Team | Category | Selection | Stated Odds | Source Analyst |');
    lines.push('| :---: | :--- | :---: | :--- | :--- | :---: | :--- |');
    card.legs.forEach((leg, idx) => {
      lines.push(`| **#${idx + 1}** | **${leg.player}** | ${leg.team || '-'} | ${leg.category_label || leg.category || '-'} | \`${leg.selection}\` | **${leg.price}** | ${leg.analyst || '-'} |`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 3. Master Player Prop Board (Grouped by Game & Category)');
  lines.push('');

  // Group props by game
  const games = [...new Set(props.map((p) => p.game))].sort();

  for (const game of games) {
    const gameProps = props.filter((p) => p.game === game);
    lines.push(`### 🏈 Matchup: ${game} (${gameProps[0]?.game_slate || weekLabel})`);
    lines.push('');
    lines.push('| Player | Pos/Team | Prop Category | Line & Side | Odds | Sportsbook | Tier | Analyst / Source | Parlay Synergy / Role | Rationale Snippet |');
    lines.push('| :--- | :---: | :--- | :---: | :---: | :--- | :---: | :--- | :--- | :--- |');

    for (const p of gameProps) {
      lines.push(`| **${p.player}** | ${p.team} | ${p.category_label} | \`${p.line} ${p.side.toUpperCase()}\` | **${p.price}** | ${p.book} | ${p.tier === 1 ? '🟢 Tier 1' : p.tier === 2 ? '🔵 Tier 2' : '🟡 Tier 3'} | ${p.analyst} | *${p.parlay_utility?.role || '-'}* | ${p.rationale} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 4. Correlation & Stacking Rules for Building Custom SGPs');
  lines.push('');
  lines.push('When combining these props into custom same-game or multi-game tickets, adhere to the following quantitative correlation principles:');
  lines.push('');
  lines.push('1. **The Trailing Passing Funnel**: Pairing an underdog team\'s QB Over Passing Yards with their WR1 Over Receptions tends to hit together, since both need the same negative game script to clear.');
  lines.push('2. **The Red-Zone Dominance Anchor**: In high-total games, pair a team\'s primary pass catcher with their Anytime TD prop rather than stacking two competing skill players for the same touches.');
  lines.push('3. **The Ground Workhorse Lock**: A team\'s clear lead rushing back\'s Rushing Yards Over pairs well with that same back\'s Anytime TD -- both benefit from the same positive game script and touch share.');
  lines.push('4. **Avoid Conflicting Scripts**: Do not pair opposing teams\' First TD Scorer props on the same slip, and avoid pairing a team\'s Under Passing Yards with their own primary receiver\'s Over Receiving Yards.');
  lines.push('');
  lines.push('_These are general stacking heuristics, not statistically-fit correlation coefficients -- treat them as a starting framework, not a guarantee._');

  return lines.join('\n');
}

/**
 * Render Interactive Generative HTML Dashboard with live interactive client-side Parlay Slip Builder
 */
export function renderHtml(data) {
  const { summary, props, parlayCards, week } = data;
  const weekLabel = week ? `Week ${week}` : 'Current Week';
  const gamesCovered = [...new Set(props.map((p) => p.game))];

  const propsJson = JSON.stringify(props).replace(/</g, '\\u003c');
  const parlayCardsJson = JSON.stringify(parlayCards).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NFL ${weekLabel} Player Prop & Parlay Intelligence</title>
<style>
  :root {
    --bg: #0f172a;
    --card-bg: #1e293b;
    --card-border: #334155;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --accent: #3b82f6;
    --accent-hover: #2563eb;
    --green: #10b981;
    --amber: #f59e0b;
    --purple: #8b5cf6;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #090d16;
    color: #e2e8f0;
    margin: 0;
    padding: 0 0 100px 0;
    line-height: 1.5;
  }
  a { color: #60a5fa; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .container { max-width: 1380px; margin: 0 auto; padding: 24px 20px; }

  /* Header */
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    border-bottom: 1px solid #334155;
    padding: 32px 0 24px;
    margin-bottom: 24px;
  }
  .header h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 12px; }
  .header p { margin: 0; color: #94a3b8; font-size: 14px; }
  .badge-tag { background: #2563eb; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Stat Grid */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 14px 16px; }
  .stat-val { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px; }
  .stat-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Navigation Toolbar */
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid #334155;
    padding: 12px 0;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .filter-group { display: flex; gap: 8px; flex-wrap: wrap; }
  .btn-filter {
    background: #1e293b;
    border: 1px solid #334155;
    color: #cbd5e1;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .btn-filter:hover, .btn-filter.active { background: #3b82f6; border-color: #60a5fa; color: #fff; }

  /* Section Title */
  h2 { font-size: 20px; font-weight: 700; color: #f1f5f9; margin: 32px 0 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #1e293b; padding-bottom: 8px; }

  /* Parlay Cards Grid */
  .parlay-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; margin-bottom: 32px; }
  .parlay-card {
    background: #111827;
    border: 1px solid #1f2937;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    position: relative;
    overflow: hidden;
  }
  .parlay-card::before { content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #3b82f6; }
  .parlay-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .parlay-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  .parlay-meta { font-size: 12px; color: #94a3b8; }
  .parlay-odds-badge { background: #065f46; color: #34d399; font-size: 18px; font-weight: 800; padding: 4px 12px; border-radius: 8px; border: 1px solid #059669; }
  .parlay-legs { list-style: none; padding: 0; margin: 12px 0; display: flex; flex-direction: column; gap: 8px; }
  .parlay-leg { background: #1e293b; padding: 8px 12px; border-radius: 6px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
  .parlay-leg-name { font-weight: 600; color: #f8fafc; }
  .parlay-leg-odds { color: #60a5fa; font-weight: 700; font-family: monospace; }
  .parlay-rationale { font-size: 12px; color: #94a3b8; font-style: italic; margin-top: 8px; line-height: 1.4; }
  .btn-load-parlay {
    background: #2563eb;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.15s;
  }
  .btn-load-parlay:hover { background: #1d4ed8; }

  /* Master Props Table */
  .table-wrapper { overflow-x: auto; background: #111827; border: 1px solid #1f2937; border-radius: 10px; margin-bottom: 40px; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
  th { background: #1f2937; color: #cbd5e1; padding: 12px 14px; font-weight: 600; border-bottom: 2px solid #374151; }
  td { padding: 12px 14px; border-bottom: 1px solid #1f2937; vertical-align: top; color: #e2e8f0; }
  tr:hover { background: #1e293b; }
  .cell-player { font-weight: 700; color: #fff; font-size: 14px; }
  .cell-line { font-family: monospace; font-weight: 700; color: #38bdf8; background: #0c4a6e; padding: 2px 6px; border-radius: 4px; display: inline-block; }
  .cell-odds { font-family: monospace; font-weight: 800; font-size: 14px; color: #10b981; }
  .badge-tier1 { background: #065f46; color: #6ee7b7; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .badge-tier2 { background: #1e3a8a; color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .badge-tier3 { background: #78350f; color: #fcd34d; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .checkbox-cell { text-align: center; width: 44px; }
  .prop-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #2563eb; }

  /* Floating Parlay Slip Drawer */
  .parlay-slip-drawer {
    position: fixed;
    bottom: 0;
    right: 24px;
    width: 380px;
    max-height: 540px;
    background: #0f172a;
    border: 2px solid #3b82f6;
    border-bottom: none;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -4px 30px rgba(0,0,0,0.6);
    z-index: 999;
    display: flex;
    flex-direction: column;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .slip-header {
    background: #1e293b;
    padding: 12px 16px;
    border-bottom: 1px solid #334155;
    border-radius: 10px 10px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
  .slip-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
  .slip-count-badge { background: #2563eb; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 700; }
  .slip-content { padding: 14px; overflow-y: auto; flex: 1; max-height: 340px; }
  .slip-empty { text-align: center; color: #64748b; font-size: 13px; padding: 20px 0; }
  .slip-item { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
  .slip-item-name { font-weight: 600; color: #fff; }
  .slip-item-remove { color: #ef4444; background: none; border: none; font-size: 16px; cursor: pointer; padding: 0 4px; }
  .slip-footer {
    background: #111827;
    border-top: 1px solid #334155;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .slip-summary-row { display: flex; justify-content: space-between; align-items: baseline; }
  .slip-odds-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
  .slip-odds-val { font-size: 22px; font-weight: 800; color: #34d399; font-family: monospace; }
  .slip-payout-text { font-size: 12px; color: #cbd5e1; text-align: right; }
  .slip-actions { display: flex; gap: 8px; margin-top: 4px; }
  .btn-slip-action { flex: 1; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; text-align: center; }
  .btn-copy { background: #10b981; color: #fff; }
  .btn-copy:hover { background: #059669; }
  .btn-clear { background: #374151; color: #cbd5e1; }
  .btn-clear:hover { background: #4b5563; }
</style>
</head>
<body>

<div class="header">
  <div class="container">
    <h1>🏈 NFL ${weekLabel} Player Prop &amp; Parlay Intelligence <span class="badge-tag">Interactive Builder</span></h1>
    <p>Extracted from verified research articles across VSiN, BettingPros, Sharp Football, and Walter Football. Features high-value player props, positive correlation stacks, and an interactive real-time parlay slip.</p>
  </div>
</div>

<div class="container">
  <!-- Metrics Header -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-val">${summary.total_props}</div>
      <div class="stat-label">Total Player Props</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #34d399;">${summary.tier_1_props}</div>
      <div class="stat-label">Tier 1 Recommended Bets</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #60a5fa;">${summary.touchdown_props}</div>
      <div class="stat-label">Touchdown Scorers</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #f59e0b;">${summary.curated_parlays}</div>
      <div class="stat-label">Curated Parlay Cards</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${summary.games_covered}</div>
      <div class="stat-label">Matchups Covered</div>
    </div>
  </div>

  <!-- Filter Toolbar -->
  <div class="toolbar">
    <div class="filter-group">
      <button class="btn-filter active" onclick="filterGame('all', this)">All Games</button>
      ${gamesCovered.map((g) => `<button class="btn-filter" onclick="filterGame('${esc(g)}', this)">${esc(g)}</button>`).join('\n      ')}
    </div>
    <div class="filter-group">
      <button class="btn-filter active" onclick="filterCategory('all', this)">All Categories</button>
      <button class="btn-filter" onclick="filterCategory('touchdown', this)">Touchdowns</button>
      <button class="btn-filter" onclick="filterCategory('receiving', this)">Receiving</button>
      <button class="btn-filter" onclick="filterCategory('rushing', this)">Rushing</button>
      <button class="btn-filter" onclick="filterCategory('passing', this)">Passing</button>
    </div>
  </div>

  <!-- Curated Parlay Stacks -->
  <h2>🎯 Pre-Engineered Same Game Parlay (SGP) Cards</h2>
  <div class="parlay-grid">
    ${parlayCards.map((card) => `
      <div class="parlay-card" data-game="${esc(card.game)}">
        <div>
          <div class="parlay-header">
            <div>
              <div class="parlay-title">${esc(card.title)}</div>
              <div class="parlay-meta">${esc(card.game)} &bull; ${esc(card.book)}</div>
            </div>
            <div class="parlay-odds-badge">${esc(card.estimated_odds)}</div>
          </div>
          <ul class="parlay-legs">
            ${card.legs.map((leg) => `
              <li class="parlay-leg">
                <span class="parlay-leg-name">${esc(leg.player)}: ${esc(leg.selection)}</span>
                <span class="parlay-leg-odds">${esc(leg.price)}</span>
              </li>
            `).join('')}
          </ul>
          <div class="parlay-rationale">${esc(card.synergy_rationale)}</div>
        </div>
        <button class="btn-load-parlay" onclick="loadPrebuiltParlay('${card.id}')">
          ⚡ Load Legs into Parlay Slip (${card.estimated_odds})
        </button>
      </div>
    `).join('')}
  </div>

  <!-- Master Props Table -->
  <h2>📋 Master Player Prop Intelligence Board</h2>
  <p style="color: #94a3b8; font-size: 13px; margin-top: -8px; margin-bottom: 16px;">
    Check the box on any prop to build a custom parlay slip with automated combined payout math.
  </p>

  <div class="table-wrapper">
    <table id="props-table">
      <thead>
        <tr>
          <th class="checkbox-cell">Slip</th>
          <th>Player</th>
          <th>Team / Game</th>
          <th>Category</th>
          <th>Line &amp; Side</th>
          <th>Odds</th>
          <th>Sportsbook</th>
          <th>Tier</th>
          <th>Analyst / Model</th>
          <th>Parlay Synergy &amp; Rationale</th>
        </tr>
      </thead>
      <tbody>
        ${props.map((p) => `
          <tr class="prop-row" data-game="${esc(p.game)}" data-cat="${esc(p.stat_type)}" id="row-${esc(p.id)}">
            <td class="checkbox-cell">
              <input type="checkbox" class="prop-checkbox" id="chk-${esc(p.id)}" onchange="toggleProp('${esc(p.id)}')">
            </td>
            <td>
              <div class="cell-player">${esc(p.player)}</div>
            </td>
            <td>
              <span style="font-weight: 600;">${esc(p.team)}</span>
              <div style="font-size: 11px; color: #94a3b8;">${esc(p.game)}</div>
            </td>
            <td>${esc(p.category_label)}</td>
            <td><span class="cell-line">${esc(p.line)} ${esc(p.side.toUpperCase())}</span></td>
            <td><span class="cell-odds">${esc(p.price)}</span></td>
            <td>${esc(p.book)}</td>
            <td><span class="badge-${p.tier === 1 ? 'tier1' : p.tier === 2 ? 'tier2' : 'tier3'}">${esc(p.tier_label.split(':')[0])}</span></td>
            <td>
              <div style="font-weight: 600;">${esc(p.analyst)}</div>
            </td>
            <td style="max-width: 320px;">
              <div style="color: #60a5fa; font-weight: 600; font-size: 12px; margin-bottom: 2px;">
                ${esc(p.parlay_utility?.role || '')}
              </div>
              <div style="font-size: 12px; color: #cbd5e1; line-height: 1.35;">
                ${esc(p.rationale)}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</div>

<!-- Floating Parlay Slip Drawer -->
<div class="parlay-slip-drawer" id="parlay-slip">
  <div class="slip-header" onclick="toggleSlipDrawer()">
    <h3>🎯 Active Parlay Slip <span class="slip-count-badge" id="slip-count">0</span></h3>
    <span id="drawer-toggle-icon" style="color: #94a3b8; font-size: 14px;">&minus;</span>
  </div>
  <div class="slip-content" id="slip-items">
    <div class="slip-empty">No props selected yet.<br>Click checkboxes in the table above to add legs!</div>
  </div>
  <div class="slip-footer">
    <div class="slip-summary-row">
      <span class="slip-odds-label">Total Parlay Odds:</span>
      <span class="slip-odds-val" id="slip-total-odds">+0</span>
    </div>
    <div class="slip-payout-text" id="slip-payout-math">$10 bet pays $0.00 | $25 pays $0.00</div>
    <div class="slip-actions">
      <button class="btn-slip-action btn-copy" onclick="copyParlaySlip()">📋 Copy Ticket</button>
      <button class="btn-slip-action btn-clear" onclick="clearParlaySlip()">Clear All</button>
    </div>
  </div>
</div>

<script>
  const ALL_PROPS = ${propsJson};
  const PREBUILT_CARDS = ${parlayCardsJson};
  const PROPS_BY_ID = new Map(ALL_PROPS.map(p => [p.id, p]));

  let selectedPropIds = new Set();
  let currentGameFilter = 'all';
  let currentCatFilter = 'all';
  let isDrawerCollapsed = false;

  function filterGame(game, btn) {
    currentGameFilter = game;
    document.querySelectorAll('.filter-group:first-child .btn-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  }

  function filterCategory(cat, btn) {
    currentCatFilter = cat;
    document.querySelectorAll('.filter-group:last-child .btn-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  }

  function applyFilters() {
    const rows = document.querySelectorAll('.prop-row');
    rows.forEach(row => {
      const rowGame = row.getAttribute('data-game');
      const rowCat = row.getAttribute('data-cat');
      let showGame = true;
      if (currentGameFilter !== 'all') {
        showGame = rowGame === currentGameFilter;
      }
      let showCat = true;
      if (currentCatFilter !== 'all') {
        showCat = rowCat === currentCatFilter;
      }
      row.style.display = (showGame && showCat) ? '' : 'none';
    });
  }

  function toggleProp(propId) {
    if (selectedPropIds.has(propId)) {
      selectedPropIds.delete(propId);
    } else {
      selectedPropIds.add(propId);
    }
    syncCheckboxes();
    renderSlip();
  }

  function syncCheckboxes() {
    document.querySelectorAll('.prop-checkbox').forEach(chk => {
      const id = chk.id.replace('chk-', '');
      chk.checked = selectedPropIds.has(id);
    });
  }

  function loadPrebuiltParlay(cardId) {
    const card = PREBUILT_CARDS.find(c => c.id === cardId);
    if (!card) return;
    selectedPropIds.clear();
    for (const leg of card.legs) {
      if (leg.id) selectedPropIds.add(leg.id);
      else {
        // match by player and game
        const match = ALL_PROPS.find(p => p.player === leg.player && p.game === card.game);
        if (match) selectedPropIds.add(match.id);
      }
    }
    syncCheckboxes();
    renderSlip();
  }

  function parseAmerican(str) {
    const m = String(str).match(/([+-]\\d+)/);
    return m ? parseInt(m[1], 10) : 100;
  }

  function americanToDec(am) {
    if (am > 0) return 1 + (am / 100);
    return 1 + (100 / Math.abs(am));
  }

  function decToAmerican(dec) {
    if (dec >= 2.0) return '+' + Math.round((dec - 1) * 100);
    return '-' + Math.round(100 / (dec - 1));
  }

  function renderSlip() {
    const countBadge = document.getElementById('slip-count');
    const itemsContainer = document.getElementById('slip-items');
    const oddsVal = document.getElementById('slip-total-odds');
    const payoutMath = document.getElementById('slip-payout-math');

    countBadge.textContent = selectedPropIds.size;

    if (selectedPropIds.size === 0) {
      itemsContainer.innerHTML = '<div class="slip-empty">No props selected yet.<br>Click checkboxes in the table above to add legs!</div>';
      oddsVal.textContent = '+0';
      payoutMath.textContent = '$10 bet pays $0.00 | $25 pays $0.00';
      return;
    }

    let html = '';
    let totalDecimal = 1.0;
    const selectedProps = [];

    for (const id of selectedPropIds) {
      const prop = PROPS_BY_ID.get(id);
      if (!prop) continue;
      selectedProps.push(prop);
      const dec = americanToDec(parseAmerican(prop.price));
      totalDecimal *= dec;

      html += '<div class="slip-item">' +
        '<div>' +
          '<div class="slip-item-name">' + prop.player + ' &bull; ' + prop.line + ' ' + prop.side.toUpperCase() + '</div>' +
          '<div style="font-size: 11px; color: #94a3b8;">' + prop.game + ' &bull; ' + prop.category_label + '</div>' +
        '</div>' +
        '<div style="display: flex; align-items: center; gap: 8px;">' +
          '<span style="font-family: monospace; font-weight: 700; color: #60a5fa;">' + prop.price + '</span>' +
          '<button class="slip-item-remove" onclick="toggleProp(\\'' + prop.id + '\\')">&times;</button>' +
        '</div>' +
      '</div>';
    }

    itemsContainer.innerHTML = html;
    const americanOdds = decToAmerican(totalDecimal);
    oddsVal.textContent = americanOdds;

    const payout10 = (10 * totalDecimal).toFixed(2);
    const payout25 = (25 * totalDecimal).toFixed(2);
    payoutMath.textContent = '$10 bet pays $' + payout10 + ' | $25 pays $' + payout25;
  }

  function clearParlaySlip() {
    selectedPropIds.clear();
    syncCheckboxes();
    renderSlip();
  }

  function copyParlaySlip() {
    if (selectedPropIds.size === 0) {
      alert('Add props to the slip first!');
      return;
    }
    const lines = ['NFL ${weekLabel} Parlay Card:'];
    let totalDecimal = 1.0;
    for (const id of selectedPropIds) {
      const p = PROPS_BY_ID.get(id);
      if (p) {
        lines.push('- ' + p.player + ' (' + p.team + '): ' + p.line + ' ' + p.side.toUpperCase() + ' (' + p.price + ') [' + p.category_label + ']');
        totalDecimal *= americanToDec(parseAmerican(p.price));
      }
    }
    lines.push('Total Combined Odds: ' + decToAmerican(totalDecimal));
    lines.push('Estimated Payout ($25 bet): $' + (25 * totalDecimal).toFixed(2));

    navigator.clipboard.writeText(lines.join('\\n')).then(() => {
      alert('Parlay card copied to clipboard!');
    }).catch(() => {
      prompt('Copy parlay slip:', lines.join('\\n'));
    });
  }

  function toggleSlipDrawer() {
    const slip = document.getElementById('parlay-slip');
    const content = document.getElementById('slip-items');
    const footer = document.querySelector('.slip-footer');
    const icon = document.getElementById('drawer-toggle-icon');
    isDrawerCollapsed = !isDrawerCollapsed;
    if (isDrawerCollapsed) {
      content.style.display = 'none';
      footer.style.display = 'none';
      icon.innerHTML = '&#43;';
    } else {
      content.style.display = '';
      footer.style.display = '';
      icon.innerHTML = '&minus;';
    }
  }
</script>
</body>
</html>
`;
}

async function main() {
  // Roll the article lookback window forward with the current NFL week instead of a fixed
  // date -- the old hardcoded '2026-09-05' cutoff never advanced, so every run kept pulling
  // in heavily-covered Week 1 articles that outranked thinner current-week coverage, and this
  // dossier kept re-serving Week 1 games as if they were upcoming.
  const { week: currentWeek, season: currentSeason } = getNFLWeekInfo();
  const weekStartDate = new Date(getSeasonStartDate(currentSeason).getTime() + (currentWeek - 1) * 7 * 86400000);
  const since = weekStartDate.toISOString();
  console.log(`📅 Player props intel window: Week ${currentWeek} (articles since ${since})`);
  const loaded = await loadArticles(since, 0, { localOnly: false });

  const [rosterMap, weekGames] = await Promise.all([
    loadPlayerRosterMap(),
    Promise.resolve(loadWeekGameMap(currentWeek, currentSeason)),
  ]);
  console.log(`🏈 Roster map: ${rosterMap.size} players | Week ${currentWeek} schedule: ${weekGames.games.length} games`);

  const props = extractCuratedPlayerProps(loaded.rows, {
    rosterMap,
    teamGameMap: weekGames.teamGameMap,
    week: currentWeek,
  });
  const parlayCards = buildCuratedParlayCards(props);

  const summary = {
    articles_scanned: loaded.rows.length,
    total_props: props.length,
    tier_1_props: props.filter((p) => p.tier === 1).length,
    touchdown_props: props.filter((p) => p.category.includes('td')).length,
    curated_parlays: parlayCards.length,
    games_covered: new Set(props.map((p) => p.game)).size,
  };

  const payload = {
    schema: 'player_props_intel_v1',
    generated_at: new Date().toISOString(),
    week: currentWeek,
    season: currentSeason,
    summary,
    parlayCards,
    props,
  };

  fs.mkdirSync(OUT_DIR_DATA, { recursive: true });
  fs.mkdirSync(OUT_DIR_DOCS, { recursive: true });

  fs.writeFileSync(LATEST_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(LATEST_MD, renderMarkdown(payload), 'utf8');
  fs.writeFileSync(LATEST_HTML, renderHtml(payload), 'utf8');

  console.log(`Wrote player props JSON: ${path.relative(ROOT, LATEST_JSON)}`);
  console.log(`Wrote player props Markdown: ${path.relative(ROOT, LATEST_MD)}`);
  console.log(`Wrote player props HTML: ${path.relative(ROOT, LATEST_HTML)}`);
  console.log(`Player props summary: total_props=${summary.total_props} tier_1=${summary.tier_1_props} parlays=${summary.curated_parlays} games=${summary.games_covered}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  main().catch((err) => {
    console.error(`Player props build failed: ${err.message}`);
    process.exit(1);
  });
}
