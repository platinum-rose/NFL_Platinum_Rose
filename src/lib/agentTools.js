// src/lib/agentTools.js
// ═══════════════════════════════════════════════════════════════════════════════
// BETTING + FUTURES Agent — Tool Definitions + Executor
// Implements tools defined in agents/manifests/betting.manifest.json
// and agents/manifests/futures.manifest.json.
//
// BETTING tools: log_pick · get_odds · get_line_movement · analyze_matchup ·
//   get_injury_report · calculate_hedge · calculate_teaser ·
//   get_performance_stats · search_intel · search_sharp_tweets ·
//   read_vault_note · write_vault_note · get_betting_splits
//
// FUTURES tools (FUT-TOOLS): analyze_futures_hedge · project_division_paths ·
//   track_award_race
// ═══════════════════════════════════════════════════════════════════════════════

import {
  getLatestOddsSnapshot,
  getLineMovementsDB,
  searchResearchIntel,
  searchSharpTweets,
  getGameSplitsForWeek,
  searchPodcastPicks,
  getExpertHistory,
  getTeamPodcastIntel,
  getWeeklyConsensus,
  getFuturesMovement,
  getPlayerPropContext,
  getLatestFuturesOdds,
  getFuturesOddsHistory,
  PLACEABLE_BOOKS,
  getTeamSeasonStats,
  getTeamRoster,
  getNormalizedSignals,
  getPodcastHostSummaries,
  getStrengthOfSchedule,
  getGameContext,
  getRefereeTendencies,
  getRosterHistory,
  getGameOddsForWeek,
  getGameSplitsHistory,
} from './supabase.js';
import { readVaultNote, writeVaultNote, listVaultNotes, todaySessionPath } from './vaultClient.js';
import {
  addPick,
  addParlay,
  addRoundRobin,
  calculateStandings,
  statsByConfidence,
  statsByEdge,
  statsByPickType,
  loadPicks,
} from './picksDatabase.js';
import { PR_STORAGE_KEYS } from './storage.js';
import { LOCAL_DATA, ESPN_API } from './apiConfig.js';
import { normalizeTeam, getTeamAbbreviation, getTeam } from './teams.js';

// ─── ESPN Team ID Mapping ─────────────────────────────────────────────────────
// Used by get_injury_report tool
const ESPN_TEAM_IDS = {
  ARI: 22, ATL: 1,  BAL: 33, BUF: 2,  CAR: 29, CHI: 3,  CIN: 4,  CLE: 5,
  DAL: 6,  DEN: 7,  DET: 8,  GB: 9,   HOU: 34, IND: 11, JAX: 30, KC: 12,
  LV: 13,  LAC: 24, LAR: 14, MIA: 15, MIN: 16, NE: 17,  NO: 18,  NYG: 19,
  NYJ: 20, PHI: 21, PIT: 23, SF: 25,  SEA: 26, TB: 27,  TEN: 28, WAS: 35,
};

// ─── Anthropic Tool Definitions ──────────────────────────────────────────────
// Format: { name, description, input_schema: { type, properties, required } }

// Tools shared between BETTING and FUTURES agents. Defined first so BETTING_TOOLS
// can splat them in and the FUTURES manifest can subset them by name without
// re-declaring schemas.
export const PODCAST_INTEL_TOOLS = [
  {
    name: 'search_podcast_picks',
    description: 'Search recent picks made by experts on tracked podcasts (e.g. Sharp Football Analysis, BettingPros, VSiN). Use when the Creator asks what an expert said about a team, what experts are taking on a given week, or who is on a specific pick. Excludes picks flagged needs_review.',
    input_schema: {
      type: 'object',
      properties: {
        team: { type: 'string', description: 'Team abbreviation (KC, BUF, ...) to filter by.' },
        expert: { type: 'string', description: 'Expert name (partial OK; e.g. "Warren" matches "Warren Sharp").' },
        category: { type: 'string', enum: ['spread', 'total', 'moneyline', 'future', 'prop'], description: 'Pick category to filter by.' },
        week: { type: 'number', description: 'NFL week (1-22).' },
        season: { type: 'number', description: 'NFL season year. Default: current.' },
        limit: { type: 'number', description: 'Max picks to return. Default: 25.' },
      },
      required: [],
    },
  },
  {
    name: 'get_expert_history',
    description: 'Returns the recent pick log for one expert with category breakdown (spread/total/moneyline/future/prop counts). Use to size up an expert\'s recent volume and where they tend to take action. W/L/units grading lives in get_performance_stats; this is the raw pick history from podcasts.',
    input_schema: {
      type: 'object',
      properties: {
        expert: { type: 'string', description: 'Expert name (partial match).' },
        weeks_back: { type: 'number', description: 'Look-back window in weeks. Default: 8.' },
        limit: { type: 'number', description: 'Max picks to return. Default: 100.' },
      },
      required: ['expert'],
    },
  },
  {
    name: 'get_team_podcast_intel',
    description: 'Returns picks for and against a team across recent podcast episodes, grouped by expert. Use when the Creator wants the podcast-side perspective on a specific team\'s upcoming game or season arc.',
    input_schema: {
      type: 'object',
      properties: {
        team: { type: 'string', description: 'Team abbreviation (KC, BUF, ...).' },
        weeks_back: { type: 'number', description: 'Look-back window in weeks. Default: 4.' },
        limit: { type: 'number', description: 'Max picks per side (for/against). Default: 50.' },
      },
      required: ['team'],
    },
  },
  {
    name: 'get_weekly_consensus',
    description: 'Cross-expert consensus board for a given week: groups sides/totals/moneyline picks by matchup and counts who is taking which side. Surfaces sharp/contrarian alignment from podcast experts.',
    input_schema: {
      type: 'object',
      properties: {
        week: { type: 'number', description: 'NFL week (1-22).' },
        season: { type: 'number', description: 'NFL season year. Default: current.' },
      },
      required: ['week'],
    },
  },
  {
    name: 'get_futures_movement',
    description: 'Timeline of expert picks for a single futures market (e.g. AFC_North, MVP, NFC_East), ordered oldest-first. Use to see how expert sentiment has shifted on a future across the season.',
    input_schema: {
      type: 'object',
      properties: {
        market: { type: 'string', description: 'Futures market identifier (e.g. "AFC_North", "MVP", "NFC_East_winner").' },
        weeks_back: { type: 'number', description: 'Look-back window in weeks. Default: 12.' },
        limit: { type: 'number', description: 'Max picks to return. Default: 100.' },
      },
      required: ['market'],
    },
  },
  {
    name: 'get_player_prop_context',
    description: 'Recent expert prop picks for a single player + prop type, with OVER/UNDER trend counts. Use when Creator asks whether anyone has touted a player prop or what the podcast take is.',
    input_schema: {
      type: 'object',
      properties: {
        player: { type: 'string', description: 'Player full name (partial OK; case-insensitive).' },
        prop_type: { type: 'string', description: 'Prop market identifier (e.g. "pass_yds", "rush_yds", "receptions").' },
        weeks_back: { type: 'number', description: 'Look-back window in weeks. Default: 6.' },
        limit: { type: 'number', description: 'Max picks to return. Default: 30.' },
      },
      required: ['player', 'prop_type'],
    },
  },
  {
    name: 'search_episode_vault_notes',
    description: 'List podcast episode vault note paths under NFL/Podcasts/. Use to find the exact vault path for an episode — e.g. "NFL/Podcasts/Sharp Football Analysis/2026-06-15-E1011.md" — before calling read_vault_note to load picks, intel bullets, and the transcript index. Also use to enumerate all available episodes for a show. Returns paths + parsed metadata (show, pub_date, episode number).',
    input_schema: {
      type: 'object',
      properties: {
        show: { type: 'string', description: 'Show name or partial match (e.g. "Sharp Football" matches "Sharp Football Analysis"). Omit to list all shows.' },
        episode: { type: 'string', description: 'Episode number or pub_date substring to filter by (e.g. "1011" or "2026-06"). Optional.' },
        limit: { type: 'number', description: 'Max paths to return. Default: 20.' },
      },
      required: [],
    },
  },
  {
    name: 'get_youtube_futures_intel',
    description: 'Local-only, human-reviewed YouTube/Gemini podcast intel research context (S300/S301 pipeline). Distinct from search_podcast_picks: this reads a local JSON file (data/shadow-harness/review/youtube-futures-agent-intel-summary.json, synced to public/), not Supabase, and covers 11 futures-eligible YouTube episodes with 39 human-promoted items. Every item carries source episode/timestamp, supporting_quote, and review_flags (e.g. "price_not_in_quote") — always surface review_flags when citing an item, and never present this as an official pick, production recommendation, or Supabase-backed source. Use for team/market/lane-filtered research context alongside podcast/Supabase tools, not in place of them.',
    input_schema: {
      type: 'object',
      properties: {
        team: { type: 'string', description: 'Team abbreviation (KC, BUF, ATL, ...) to filter by.' },
        market: { type: 'string', description: 'Market identifier to filter by (e.g. "division_winner", "make_playoffs", "mvp", "win_total").' },
        lane: { type: 'string', enum: ['futures_pick', 'injury_intel', 'non_futures_betting'], description: 'Item lane to filter by.' },
        limit: { type: 'number', description: 'Max items to return. Default: 25.' },
      },
      required: [],
    },
  },
];

export const BETTING_TOOLS = [
  {
    name: 'get_odds',
    description: 'Retrieve current odds from all sportsbooks. Use before any spread/total recommendation. Returns spreads, totals, and moneylines from Supabase (cached from TheOddsAPI). Prefer this over live API calls to preserve the 500 req/month quota.',
    input_schema: {
      type: 'object',
      properties: {
        teams: {
          type: 'string',
          description: 'Optional team name(s) to filter by (home or away). Leave empty for all games.',
        },
        market: {
          type: 'string',
          enum: ['spreads', 'totals', 'h2h', 'all'],
          description: 'Market type to retrieve. Default: all',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_line_movement',
    description: 'Returns opening line vs. current line plus directional movement. Use when the Creator asks about line moves, sharp money, steam moves, or reverse line movement.',
    input_schema: {
      type: 'object',
      properties: {
        game: {
          type: 'string',
          description: 'Partial team name or game description (e.g. "Chiefs" or "KC vs DEN")',
        },
        hours: {
          type: 'number',
          description: 'Look-back window in hours. Default: 24',
        },
      },
      required: [],
    },
  },
  {
    name: 'analyze_matchup',
    description: 'Returns model projections and key intel for an NFL game. Always call this before making a spread or total recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        home_team: {
          type: 'string',
          description: 'Home team abbreviation or full name (e.g. "KC" or "Kansas City Chiefs")',
        },
        away_team: {
          type: 'string',
          description: 'Away team abbreviation or full name (e.g. "BUF" or "Buffalo Bills")',
        },
      },
      required: ['home_team', 'away_team'],
    },
  },
  {
    name: 'get_injury_report',
    description: 'Returns current injury designations for a team from ESPN. Use when injury intel is needed before a recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team abbreviation (e.g. "KC", "BUF", "PHI")',
        },
      },
      required: ['team'],
    },
  },
  {
    name: 'calculate_hedge',
    description: 'Calculates hedge bet amounts for profit locking or loss minimization on an active position.',
    input_schema: {
      type: 'object',
      properties: {
        original_bet_amount: {
          type: 'number',
          description: 'Original wager amount in dollars',
        },
        original_odds: {
          type: 'number',
          description: 'American odds on original bet (e.g. +150, -110)',
        },
        hedge_odds: {
          type: 'number',
          description: 'American odds available on the opposite side for hedging',
        },
        target_profit: {
          type: 'number',
          description: 'Optional guaranteed profit target (dollars). If omitted, calculates break-even hedge.',
        },
      },
      required: ['original_bet_amount', 'original_odds', 'hedge_odds'],
    },
  },
  {
    name: 'calculate_teaser',
    description: 'Evaluates teaser bet value. Checks key number crossings (3, 7) and Wong teaser qualification. Returns EV estimate and recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        legs: {
          type: 'array',
          description: 'Array of teaser legs. Each leg: { team, spread, teaser_points }',
          items: {
            type: 'object',
            properties: {
              team:          { type: 'string' },
              spread:        { type: 'number', description: 'Current spread (e.g. -7.5, +2.5)' },
              teaser_points: { type: 'number', description: 'Teaser points to add (default 6)' },
            },
            required: ['team', 'spread'],
          },
        },
        teaser_odds: {
          type: 'number',
          description: 'Teaser payout odds in American format (e.g. -120 for standard 2-team 6pt)',
        },
      },
      required: ['legs'],
    },
  },
  {
    name: 'log_pick',
    description: 'Records a pick or bet to the Creator\'s Picks Tracker. CRITICAL: The system prompt instructs you to ALWAYS ask for explicit user confirmation before calling this tool. Never auto-log without a clear "log it", "record that", or "add the bet" instruction from the Creator. Supports straight bets (spread/total/moneyline), parlays, and round-robins.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team abbreviation or "OVER"/"UNDER" for totals. Omit for parlays and round-robins (use legs instead).',
        },
        pick_type: {
          type: 'string',
          enum: ['spread', 'total', 'moneyline', 'parlay', 'round_robin'],
          description: 'Type of bet. Use parlay for multi-game tickets (2-teamers, 3-teamers, Super Contest cards). Use round_robin for RR tickets.',
        },
        line: {
          type: 'number',
          description: 'Spread or total line (e.g. -3.5, 47.5). Omit for parlays and round-robins.',
        },
        odds: {
          type: 'number',
          description: 'American odds (e.g. -110, +130). For parlays, this is the combined parlay odds (e.g. +600).',
        },
        amount_units: {
          type: 'number',
          description: 'Wager size in units. For round-robins, this is the stake PER sub-parlay (e.g. 0.5u per combo).',
        },
        game_context: {
          type: 'string',
          description: 'Game description for straight bets (e.g. "KC @ BUF"). Omit for parlays/RRs (use legs instead).',
        },
        notes: {
          type: 'string',
          description: 'Rationale or context for the pick.',
        },
        book: {
          type: 'string',
          description: 'Sportsbook name (e.g. "DraftKings", "FanDuel").',
        },
        // Parlay / Round-robin fields
        legs: {
          type: 'array',
          description: 'Required for parlays and round-robins. Each leg: { team, game, line }. e.g. [{ "team": "KC", "game": "KC @ BUF", "line": -3.5 }]',
          items: {
            type: 'object',
            properties: {
              team: { type: 'string', description: 'Team abbreviation or OVER/UNDER' },
              game: { type: 'string', description: 'Matchup description (e.g. "KC @ BUF")' },
              line: { type: 'number', description: 'Spread or total line for this leg' },
            },
            required: ['team', 'game'],
          },
        },
        parlay_size: {
          type: 'number',
          description: 'Round-robins only: number of legs per sub-parlay (e.g. 4 for a "4-team RR").',
        },
        contest_name: {
          type: 'string',
          description: 'Optional: contest name for parlays (e.g. "Super Contest").',
        },
        contest_week: {
          type: 'number',
          description: 'Optional: NFL week number for contest parlays.',
        },
        game_date: {
          type: 'string',
          description: 'Optional for parlays/RRs: date of last leg in YYYY-MM-DD format. Defaults to today.',
        },
      },
      required: ['pick_type'],
    },
  },
  {
    name: 'get_performance_stats',
    description: 'Returns the Creator\'s historical pick performance — overall record, units, ROI, breakdown by confidence tier, edge size, team, and pick type (spread/total/moneyline/parlay/round_robin). Parlay breakdown includes by_team_count (e.g. 3-teamers vs 5-teamers); RR breakdown includes by_config. Use to calibrate sizing and answer questions like "how have I done on totals?", "what\'s my 3-teamer record?", "how did my RRs do?". No inputs required.',
    input_schema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['AI_LAB', 'EXPERT'],
          description: 'Filter to a specific pick source (optional). Omit for all picks.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_intel',
    description: 'Search recent research articles and pick signals by keyword, team, or source. Use when the Creator asks what a specific outlet said about a team or market (e.g. "what did Action Network say about the Chiefs?", "any VSiN angles on the Bills spread?"). Searches titles and summaries from the last 7 days by default.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword, team name, or topic to search for (e.g. "Chiefs", "AFC West", "over")',
        },
        source: {
          type: 'string',
          enum: ['Action Network', 'BettingPros', 'ESPN NFL', 'VSiN'],
          description: 'Optional — filter results to a single source',
        },
        hours: {
          type: 'number',
          description: 'Lookback window in hours (default: 168 = 7 days)',
        },
        limit: {
          type: 'number',
          description: 'Max articles to return (default: 5, max: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_vault_note',
    description: 'Read a note from the NFL betting vault. Use at session start to load reference data: coach tendencies (NFL/Reference/CoachTendencies.md), DVOA analytics (NFL/Reference/DVOA.md), ATS trends (NFL/Reference/ATS_Trends.md), key numbers (NFL/Reference/KeyNumbers.md), or team-specific notes (NFL/Teams/<ABBR>.md). Also use when the Creator asks about notes or angles from a previous session (NFL/Sessions/YYYY-MM-DD.md).',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Vault-relative path to the note (e.g. "NFL/Reference/CoachTendencies.md", "NFL/Sessions/2026-09-07.md", "NFL/Teams/KC.md")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_vault_note',
    description: 'Write or update a note in the NFL betting vault. Use post-session to save angles, picks, and rationale to NFL/Sessions/YYYY-MM-DD.md. Also use to update team notes (NFL/Teams/<ABBR>.md) or add a new trend to NFL/Reference/ATS_Trends.md. Always confirm with the Creator before writing.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Vault-relative path for the note (e.g. "NFL/Sessions/2026-09-07.md")',
        },
        content: {
          type: 'string',
          description: 'Full markdown content to write. For session notes, use the standard format: # Session YYYY-MM-DD\n\n## Angles\n...\n\n## Picks\n...\n\n## Outcome Notes\n...',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags for this note (e.g. ["session", "week-1", "KC"])',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'get_betting_splits',
    description: 'Retrieve current betting splits (public bettor% and public money%) for this week\'s NFL games from Action Network. Use to identify sharp vs. public divergence: when money% differs significantly from ticket%, sharp money is on the minority side. Call this before any pick that hinges on contrarian or sharp-money angles.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Optional: filter to a specific team (e.g. "KC", "BUF"). Omit to return all games.',
        },
        week: {
          type: 'number',
          description: 'NFL week number. Omit to use the current week.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_sharp_tweets',
    description: 'Search recent tweets from tracked sharp NFL accounts (Warren Sharp, VSiN, Action Network, PFF, BettingPros, and others). Use when looking for sharp-money signals, line-move intel, injury reactions, or quick angles that may not yet appear in full articles.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms (team names, player names, bet type, concept). E.g. "Chiefs spread", "Mahomes injury", "steam move".',
        },
        handle: {
          type: 'string',
          description: 'Optional: filter to a specific account handle (e.g. "SharpFootball", "VSiN"). Omit for all accounts.',
        },
        hours: {
          type: 'number',
          description: 'Look-back window in hours. Default: 168 (7 days).',
        },
        limit: {
          type: 'number',
          description: 'Max tweets to return. Default: 8.',
        },
      },
      required: ['query'],
    },
  },  // ─── Phase 6 podcast intel tools (shared with FUTURES agent) ───────────────
  ...PODCAST_INTEL_TOOLS,
];


// ─── FUTURES-Specific Tool Definitions ───────────────────────────────────────
// Used by FuturesAgentChat. Consumed as [...BETTING_TOOLS, ...FUTURES_TOOLS].

export const FUTURES_TOOLS = [
  {
    name: 'analyze_futures_hedge',
    description: 'Advanced futures hedge analyzer. Goes beyond calculate_hedge by modeling three explicit scenarios (hold / partial hedge / full lock) and showing the line-appreciation gain since entry. Use when the Creator has an open futures position and wants to evaluate whether to hedge, how much, and what profit they can lock. Always show all three scenarios so the Creator can choose.',
    input_schema: {
      type: 'object',
      properties: {
        stake: {
          type: 'number',
          description: 'Original wager in dollars (e.g. 50 for a $50 bet).',
        },
        entry_odds: {
          type: 'number',
          description: 'American odds at the time of the original bet (e.g. +500).',
        },
        current_odds: {
          type: 'number',
          description: 'Current American odds on the SAME position today (e.g. +200). Used to calculate line appreciation and current implied value.',
        },
        hedge_odds: {
          type: 'number',
          description: 'American odds available on the opposing/hedge side right now (e.g. -180 on the other team to win the division).',
        },
        hedge_description: {
          type: 'string',
          description: 'Short label for the hedge bet (e.g. "BUF to win AFC East", "field to win SB"). Displayed in the output for clarity.',
        },
        target_locked_profit: {
          type: 'number',
          description: 'Optional: desired guaranteed profit in dollars. If provided, calculates the partial hedge stake needed. If omitted, only break-even and full scenarios are shown.',
        },
      },
      required: ['stake', 'entry_odds', 'current_odds', 'hedge_odds'],
    },
  },
  {
    name: 'project_division_paths',
    description: 'Returns a division outlook: current futures odds per team, implied win probabilities, cross-market context (conference/SB odds), Strength of Schedule rank, and season analytics (record, EPA rank, ATS) where that data is seeded. Use when the Creator asks "who wins the NFC West?" or "give me the AFC North breakdown". Does NOT include injuries — call get_injury_report separately for that. Requires a valid division name.',
    input_schema: {
      type: 'object',
      properties: {
        division: {
          type: 'string',
          description: 'NFL division name. Accepted formats: "AFC West", "NFC North", "afc east", "nfc_south", etc. Case-insensitive.',
        },
      },
      required: ['division'],
    },
  },
  {
    name: 'track_award_race',
    description: 'Returns the current award race leaderboard: top candidates ranked by implied probability from sportsbook odds, with expert podcast mention counts. Use for MVP, OPOY, DPOY, OROY, DROY, CPOY, or COY award discussions. Returns up to 10 candidates with odds, implied probability, and expert sentiment.',
    input_schema: {
      type: 'object',
      properties: {
        award: {
          type: 'string',
          enum: ['MVP', 'OPOY', 'DPOY', 'OROY', 'DROY', 'CPOY', 'COY'],
          description: 'Award abbreviation. MVP = Most Valuable Player, OPOY = Offensive Player of Year, DPOY = Defensive Player of Year, OROY = Offensive Rookie of Year, DROY = Defensive Rookie of Year, CPOY = Comeback Player of Year, COY = Coach of Year.',
        },
        limit: {
          type: 'number',
          description: 'Max candidates to return (default: 10).',
        },
      },
      required: ['award'],
    },
  },
  // ── S296: data-wiring pass — tools onto tables that already existed but weren't
  // reachable by the live agent. See docs/FUTURES_AGENT_DATA_INVENTORY_2026-07-21.md.
  {
    name: 'get_team_analytics',
    description: 'Returns season-level team analytics: record, ATS record, O/U record, offensive/defensive EPA-per-play, formation tendencies (shotgun/no-huddle/pass rate), and league ranks (1=best, 32=worst). Use for "how good is this team really" questions beyond just their futures odds — this is the structured version of what CoachTendencies.md has as prose.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team name or abbreviation (e.g. "Chiefs", "KC", "Kansas City Chiefs"). Omit to get all 32 teams.',
        },
        season: {
          type: 'number',
          description: 'Season year. Omit to get each team\'s most recent season on file.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_team_roster',
    description: 'Returns the current/latest known roster for a team — players, position, depth chart slot, status, jersey number. Use this before relying on any personnel-specific claim (a QB, a coach\'s system built around a specific player, etc.) since the hand-curated team notes can go stale after trades (e.g. the 2026 Kyler Murray trade was caught this way). Source: weekly nflverse roster snapshots.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          required: true,
          description: 'Team name or abbreviation (e.g. "Cardinals", "ARI").',
        },
        position: {
          type: 'string',
          description: 'Optional: filter to one position group (e.g. "QB", "WR").',
        },
      },
      required: ['team'],
    },
  },
  {
    name: 'get_strength_of_schedule',
    description: 'Returns each team\'s Strength of Schedule rank (1 = hardest slate) computed from the sum of their 2026 opponents\' consensus win-total lines — the same method used in the rendered Futures Intel Report, but queryable directly instead of only inside that report. Use for win-total over/under value calls and division-outlook context.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Optional: team name or abbreviation to return just one team\'s SoS. Omit for the full 32-team ranking.',
        },
        season: {
          type: 'number',
          description: 'Season year. Defaults to the current year.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_futures_odds_movement',
    description: 'Returns the actual sportsbook odds movement over time for one team+market (best PLACEABLE price at open vs. current, per-book movement, and a consensus/median movement figure) — NOT expert pick sentiment (use get_futures_movement for that). Use when the Creator asks "how have this team\'s Super Bowl odds moved" or wants to spot line value that\'s decaying or appreciating.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          required: true,
          description: 'Full team name as tracked in odds data (e.g. "Kansas City Chiefs"). Use get_team_analytics or the division tools first if unsure of the exact form.',
        },
        market_type: {
          type: 'string',
          enum: ['superbowl', 'conference_afc', 'conference_nfc',
            'division_afc_east', 'division_afc_north', 'division_afc_south', 'division_afc_west',
            'division_nfc_east', 'division_nfc_north', 'division_nfc_south', 'division_nfc_west',
            'wins', 'playoffs'],
          required: true,
          description: 'Futures market to track movement for.',
        },
        days: {
          type: 'number',
          description: 'Look-back window in days. Default: 30.',
        },
        season: {
          type: 'number',
          description: 'Defaults to the current year. Set explicitly if asking about a past season\'s futures.',
        },
      },
      required: ['team', 'market_type'],
    },
  },
  {
    name: 'get_normalized_signals',
    description: 'Returns cleaned, directional betting signals (team/market/direction/strength/rationale) normalized by an LLM pass across articles, podcast intel, and expert picks — richer and more structured than raw podcast search. Public-read policy added migration 041 (2026-07-22); a no_data result means no signals matched the filters, not an access issue.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Optional: canonical team nickname (e.g. "Ravens") to filter by.',
        },
        market: {
          type: 'string',
          description: 'Optional: market category (superbowl|conference|division|wins|playoffs|game|award|prop|other).',
        },
        direction: {
          type: 'string',
          enum: ['back', 'fade', 'over', 'under', 'na'],
          description: 'Optional: filter to one directional lean.',
        },
        limit: {
          type: 'number',
          description: 'Max signals to return. Default: 30.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_podcast_host_summaries',
    description: 'Returns per-host structured future summaries: prediction, lean, confidence, cited stats, and supporting quote for each future a host discussed. Richer than search_podcast_picks (which only has the flat pick shape) — use when the Creator wants to know WHY an expert holds a position, not just what it is.',
    input_schema: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          description: 'Optional: host name or partial match (e.g. "Warren Sharp").',
        },
        team: {
          type: 'string',
          description: 'Optional: filter results to futures mentioning this team/subject (matched client-side against each future\'s subject).',
        },
        limit: {
          type: 'number',
          description: 'Max episode/host rows to scan. Default: 40.',
        },
      },
      required: [],
    },
  },
  // ── S296 track 2: rest/travel, CLV, referee tendencies, roster churn ──────
  {
    name: 'get_game_context',
    description: 'Returns rest days for each side, division-game flag, venue (roof/surface), assigned referee, and nflverse\'s consensus closing lines for a game. Use for short-week/rest-differential angles and as the "true" closing number when discussing CLV.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team name or abbreviation. Returns that team\'s upcoming/recent games.',
        },
        week: {
          type: 'number',
          description: 'NFL week (1-22). Omit for all weeks in range.',
        },
        season: {
          type: 'number',
          description: 'Season year. Omit for current.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_referee_tendencies',
    description: 'Returns historical tendencies for an NFL referee: games officiated, average combined score ("total-friendliness"), average penalties/penalty yards per game, and home-team win rate. Small samples (~17 games/season/ref) — always weigh games_officiated before treating an average as meaningful. Use after get_game_context surfaces the assigned referee for an upcoming game.',
    input_schema: {
      type: 'object',
      properties: {
        referee: {
          type: 'string',
          description: 'Referee name or partial match (e.g. "Cheffers"). Omit to list all refs with data, sorted by games officiated.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_roster_churn',
    description: 'Diffs a team\'s roster between its two most recent weekly snapshots and returns adds/drops/status changes. Use as a leading indicator of instability (trades, injury-driven moves, practice-squad churn) beyond what a single-point-in-time roster or the injury report shows.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          required: true,
          description: 'Team name or abbreviation.',
        },
        weeks_back: {
          type: 'number',
          description: 'How many distinct weekly snapshots to compare (default 2 — i.e. most recent vs. prior).',
        },
      },
      required: ['team'],
    },
  },
  {
    name: 'get_clv_analysis',
    description: 'Closing Line Value check for one game: compares this app\'s earliest-tracked odds (proxy "opening") against nflverse\'s true consensus closing line, plus betting-splits divergence (ticket% vs money%) over the week if available. Use when the Creator asks whether a line move was sharp, or wants a post-mortem on how a game\'s number actually closed relative to when they bet it.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          required: true,
          description: 'Team name or abbreviation — either side of the game works.',
        },
        week: {
          type: 'number',
          required: true,
          description: 'NFL week (1-22).',
        },
        season: {
          type: 'number',
          description: 'Season year. Defaults to current.',
        },
      },
      required: ['team', 'week'],
    },
  },
];

// ─── Tool Executor ───────────────────────────────────────────────────────────

/**
 * Execute a tool by name with the given input.
 * Returns a serializable result object or string.
 *
 * @param {string} name   - Tool name
 * @param {object} input  - Tool input (per input_schema)
 * @returns {Promise<object|string>}
 */
export async function executeTool(name, input) {
  switch (name) {
    case 'get_odds':        return toolGetOdds(input);
    case 'get_line_movement': return toolGetLineMovement(input);
    case 'analyze_matchup': return toolAnalyzeMatchup(input);
    case 'get_injury_report': return toolGetInjuryReport(input);
    case 'calculate_hedge': return toolCalculateHedge(input);
    case 'calculate_teaser': return toolCalculateTeaser(input);
    case 'log_pick':        return toolLogPick(input);
    case 'get_performance_stats': return toolGetPerformanceStats(input);
    case 'search_intel':        return toolSearchIntel(input);
    case 'search_sharp_tweets': return toolSearchSharpTweets(input);
    case 'read_vault_note':     return toolReadVaultNote(input);
    case 'write_vault_note':    return toolWriteVaultNote(input);
    case 'get_betting_splits': return toolGetBettingSplits(input);
    case 'search_podcast_picks':    return toolSearchPodcastPicks(input);
    case 'get_expert_history':      return toolGetExpertHistory(input);
    case 'get_team_podcast_intel':  return toolGetTeamPodcastIntel(input);
    case 'get_weekly_consensus':    return toolGetWeeklyConsensus(input);
    case 'get_futures_movement':    return toolGetFuturesMovement(input);
    case 'get_player_prop_context': return toolGetPlayerPropContext(input);
    case 'search_episode_vault_notes': return toolSearchEpisodeVaultNotes(input);
    case 'get_youtube_futures_intel': return toolGetYoutubeFuturesIntel(input);
    // FUT-TOOLS
    case 'analyze_futures_hedge':   return toolAnalyzeFuturesHedge(input);
    case 'project_division_paths':  return toolProjectDivisionPaths(input);
    case 'track_award_race':        return toolTrackAwardRace(input);
    // S296 data-wiring pass
    case 'get_team_analytics':        return toolGetTeamAnalytics(input);
    case 'get_team_roster':           return toolGetTeamRoster(input);
    case 'get_strength_of_schedule':  return toolGetStrengthOfSchedule(input);
    case 'get_futures_odds_movement': return toolGetFuturesOddsMovement(input);
    case 'get_normalized_signals':    return toolGetNormalizedSignals(input);
    case 'get_podcast_host_summaries': return toolGetPodcastHostSummaries(input);
    case 'get_game_context':          return toolGetGameContext(input);
    case 'get_referee_tendencies':    return toolGetRefereeTendencies(input);
    case 'get_roster_churn':          return toolGetRosterChurn(input);
    case 'get_clv_analysis':          return toolGetClvAnalysis(input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── OpenAI Function-Call Format ──────────────────────────────────────────────
// OpenAI requires { type: 'function', function: { name, description, parameters } }
// instead of Anthropic's { name, description, input_schema }.

export const OPENAI_BETTING_TOOLS = BETTING_TOOLS.map(t => ({
  type: 'function',
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  },
}));

// ─── Individual Tool Implementations ─────────────────────────────────────────

async function toolGetOdds({ teams } = {}) {
  const snapshot = await getLatestOddsSnapshot();
  if (!snapshot) {
    return {
      status: 'unavailable',
      reason: 'No odds snapshot found — OddsIngestAgent has not run recently or it is the NFL offseason.',
      guidance: 'Do not fabricate lines or spreads. State clearly that live odds are not loaded and advise the user to check back during the regular season.',
    };
  }

  let games = snapshot.games || [];

  // Filter by team name if provided
  if (teams && teams.trim()) {
    const q = teams.toLowerCase();
    games = games.filter(g =>
      g.home?.toLowerCase().includes(q) ||
      g.away?.toLowerCase().includes(q) ||
      g.home_team?.toLowerCase().includes(q) ||
      g.away_team?.toLowerCase().includes(q)
    );
  }

  return {
    fetched_at: snapshot.fetchedAt,
    game_count: games.length,
    games: games.slice(0, 20), // cap to avoid context overflow
  };
}

async function toolGetLineMovement({ game, hours = 24 } = {}) {
  const movements = await getLineMovementsDB(hours);
  if (!movements || movements.length === 0) {
    return {
      status: 'unavailable',
      reason: 'No line movements found — no sharp activity in the window or it is the NFL offseason.',
      guidance: 'Do not fabricate movement data. Acknowledge that no line movement is available and do not speculate about steam or reverse-line action.',
    };
  }

  let filtered = movements;
  if (game && game.trim()) {
    const q = game.toLowerCase();
    filtered = movements.filter(m =>
      m.game?.toLowerCase().includes(q) ||
      m.home_team?.toLowerCase().includes(q) ||
      m.away_team?.toLowerCase().includes(q)
    );
  }

  return {
    window_hours: hours,
    movement_count: filtered.length,
    movements: filtered.slice(0, 30),
  };
}

async function toolAnalyzeMatchup({ home_team, away_team }) {
  if (!home_team || !away_team) {
    return { error: 'Both home_team and away_team are required.' };
  }

  // Load schedule from public/
  let schedule = [];
  try {
    const resp = await fetch(LOCAL_DATA.SCHEDULE);
    if (resp.ok) schedule = await resp.json();
  } catch { /* non-fatal */ }

  // Load weekly stats
  let stats = {};
  try {
    const resp = await fetch(LOCAL_DATA.WEEKLY_STATS);
    if (resp.ok) stats = await resp.json();
  } catch { /* non-fatal */ }

  const homeLower = home_team.toLowerCase();
  const awayLower = away_team.toLowerCase();

  // Normalize inputs to canonical abbreviations for reliable schedule lookup
  const homeCanon = normalizeTeam(home_team);
  const awayCanon = normalizeTeam(away_team);
  const homeAbbr = homeCanon ? getTeamAbbreviation(homeCanon) : null;
  const awayAbbr = awayCanon ? getTeamAbbreviation(awayCanon) : null;

  // Find matching game in schedule — prefer exact abbreviation match, fall
  // back to fuzzy string match so the tool still works with partial inputs.
  const game = schedule.find(g => {
    const h = g.home || g.home_abbrev || '';
    const v = g.visitor || g.away_abbrev || '';
    if (homeAbbr && awayAbbr) {
      return h === homeAbbr && v === awayAbbr;
    }
    // Fuzzy fallback when normalization fails (unknown/misspelled team names)
    const hLower = h.toLowerCase();
    const vLower = v.toLowerCase();
    return (hLower.includes(homeLower) || homeLower.includes(hLower)) &&
           (vLower.includes(awayLower) || awayLower.includes(vLower));
  });

  // Find stats entries
  const statsArr = Array.isArray(stats) ? stats : Object.values(stats).flat();
  const homeStats = statsArr.find(t => (t.team || '').toLowerCase().includes(homeLower));
  const awayStats  = statsArr.find(t => (t.team || '').toLowerCase().includes(awayLower));

  // Basic projection: points scored avg vs allowed avg
  const homeOffense  = parseFloat(homeStats?.pts_for_avg  || homeStats?.points_for  || 24);
  const homeDefense  = parseFloat(homeStats?.pts_allowed_avg || homeStats?.points_against || 24);
  const awayOffense  = parseFloat(awayStats?.pts_for_avg  || awayStats?.points_for  || 24);
  const awayDefense  = parseFloat(awayStats?.pts_allowed_avg || awayStats?.points_against || 24);

  const homeProj  = (homeOffense + (28 - awayDefense)) / 2;
  const awayProj  = (awayOffense + (28 - homeDefense)) / 2;
  const predictedMargin = homeProj - awayProj;
  const predictedTotal  = homeProj + awayProj;

  const intelBullets = [];
  if (game?.spread) intelBullets.push(`Market spread: ${home_team} ${game.spread}`);
  if (game?.total)  intelBullets.push(`Market total: ${game.total}`);
  if (homeStats?.record) intelBullets.push(`${home_team} record: ${homeStats.record}`);
  if (awayStats?.record)  intelBullets.push(`${away_team} record: ${awayStats.record}`);
  intelBullets.push(`Model home projection: ${homeProj.toFixed(1)} pts`);
  intelBullets.push(`Model away projection: ${awayProj.toFixed(1)} pts`);

  return {
    home_team,
    away_team,
    home_proj: parseFloat(homeProj.toFixed(1)),
    away_proj:  parseFloat(awayProj.toFixed(1)),
    predicted_margin: parseFloat(predictedMargin.toFixed(1)),
    predicted_total:  parseFloat(predictedTotal.toFixed(1)),
    market_spread: game?.spread ?? 'N/A',
    market_total:  game?.total  ?? 'N/A',
    game_date: game?.date ?? 'N/A',
    key_intel_bullets: intelBullets,
    model_confidence: 'low (offseason — limited stats)',
    data_sources: {
      schedule_found: !!game,
      home_stats_found: !!homeStats,
      away_stats_found: !!awayStats,
    },
  };
}

async function toolGetInjuryReport({ team }) {
  if (!team) return { error: 'team is required' };

  const abbr = team.toUpperCase().replace(/^(the )/i, '').trim().split(' ').pop();
  const teamId = ESPN_TEAM_IDS[abbr];

  if (!teamId) {
    return {
      status: 'unknown_team',
      message: `No ESPN team ID for "${team}". Known abbreviations: ${Object.keys(ESPN_TEAM_IDS).join(', ')}`,
    };
  }

  const urls = [
    `${ESPN_API.INJURIES_URL}/${teamId}/injuries`,
    `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/types/2/teams/${teamId}/injuries`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) continue;
      const data = await resp.json();

      const items = data?.items || [];
      const injuries = items.slice(0, 15).map(item => ({
        player:   item?.athlete?.displayName ?? item?.displayName ?? 'Unknown',
        position: item?.athlete?.position?.abbreviation ?? 'N/A',
        status:   item?.status?.type?.description ?? item?.type?.description ?? 'Unknown',
        injury:   item?.injuries?.[0]?.type?.description ?? 'Unknown',
      }));

      return { team: abbr, team_id: teamId, injury_count: injuries.length, injuries };
    } catch { /* try next */ }
  }

  return {
    status: 'unavailable',
    message: 'ESPN injury API returned no data. This is common in the offseason.',
    team: abbr,
  };
}

function toolCalculateHedge({ original_bet_amount, original_odds, hedge_odds, target_profit }) {
  // Convert American odds to decimal
  const toDecimal = (american) => {
    if (american > 0) return (american / 100) + 1;
    return (100 / Math.abs(american)) + 1;
  };

  const origDecimal  = toDecimal(original_odds);
  const hedgeDecimal = toDecimal(hedge_odds);

  const originalPayout   = original_bet_amount * origDecimal;
  const originalProfit   = originalPayout - original_bet_amount;

  // Break-even hedge: guarantee $0 net regardless of outcome
  // If original wins: originalProfit - hedgeStake
  // If hedge wins: (hedgeStake * (hedgeDecimal - 1)) - original_bet_amount
  // Set them equal to find break-even hedge_stake
  const breakEvenHedge = originalPayout / hedgeDecimal;
  const breakEvenProfit = originalProfit - breakEvenHedge;

  // Target hedge (if specified)
  let targetHedge = null;
  let targetGuarantee = null;
  if (target_profit !== undefined && target_profit !== null) {
    // Win original + hedge loses: originalProfit - targetHedge = target_profit
    // → targetHedge = originalProfit - target_profit
    targetHedge = originalProfit - target_profit;
    targetGuarantee = target_profit;
    if (targetHedge < 0) {
      targetHedge = null; // can't lock in more profit than original payout allows
    }
  }

  return {
    original: {
      stake: original_bet_amount,
      odds: original_odds,
      potential_profit: parseFloat(originalProfit.toFixed(2)),
      potential_payout: parseFloat(originalPayout.toFixed(2)),
    },
    break_even_hedge: {
      hedge_stake: parseFloat(breakEvenHedge.toFixed(2)),
      hedge_odds,
      guaranteed_profit: parseFloat(breakEvenProfit.toFixed(2)),
      recommendation: breakEvenProfit >= 0
        ? `Bet $${breakEvenHedge.toFixed(2)} on the opposite side to guarantee $${breakEvenProfit.toFixed(2)}`
        : 'Break-even hedge not achievable at these odds — you would lock in a loss.',
    },
    target_hedge: targetHedge !== null ? {
      hedge_stake: parseFloat(targetHedge.toFixed(2)),
      guaranteed_profit: parseFloat(targetGuarantee.toFixed(2)),
    } : null,
  };
}

function toolCalculateTeaser({ legs, teaser_odds = -120 }) {
  if (!Array.isArray(legs) || legs.length < 2) {
    return { error: 'Teasers require at least 2 legs.' };
  }

  // Key numbers in NFL: 3 and 7 (most common final margins)
  const KEY_NUMBERS = [3, 7];

  const crossesKeyNumber = (spread, teaserPts) => {
    const newSpread = spread + teaserPts;
    return KEY_NUMBERS.some(k => {
      const min = Math.min(spread, newSpread);
      const max = Math.max(spread, newSpread);
      return k > min && k <= max;
    });
  };

  const legsAnalysis = legs.map(leg => {
    const points = leg.teaser_points || 6;
    const newSpread = leg.spread + points;
    const crossesKey = crossesKeyNumber(leg.spread, points);
    return {
      team:        leg.team,
      original_spread: leg.spread,
      teaser_points:   points,
      new_spread:      newSpread,
      crosses_key_number: crossesKey,
    };
  });

  // Wong teaser: at least 2 legs each crossing a key number (typically from -8.5 to -2.5 range)
  const wongQualifyingLegs = legsAnalysis.filter(l => l.crosses_key_number);
  const wongQualified = wongQualifyingLegs.length >= 2;

  // Quick EV estimate (rough):
  // Standard 6pt underdog: ~73% win rate per leg (with key number boost)
  // Without key number: ~68% per leg
  const perLegWinProb = legsAnalysis.map(l => l.crosses_key_number ? 0.73 : 0.68);
  const combinedWinProb = perLegWinProb.reduce((acc, p) => acc * p, 1);

  const toDecimal = (american) => american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
  const payoutDecimal = toDecimal(teaser_odds);
  const ev = (combinedWinProb * (payoutDecimal - 1)) - (1 - combinedWinProb);

  return {
    legs: legsAnalysis,
    teaser_odds,
    crosses_key_numbers: wongQualifyingLegs.map(l => l.team),
    wong_qualified: wongQualified,
    estimated_win_probability: parseFloat((combinedWinProb * 100).toFixed(1)) + '%',
    ev_estimate: parseFloat(ev.toFixed(3)),
    recommendation: wongQualified
      ? `✅ WONG-QUALIFIED: ${wongQualifyingLegs.map(l => l.team).join(' + ')} both cross key numbers. EV: ${ev.toFixed(3)} (above 0 = +EV).`
      : `⚠️ NOT WONG: Only ${wongQualifyingLegs.length} of ${legs.length} legs cross key numbers. EV: ${ev.toFixed(3)}. Teasers without key number crossings are typically -EV.`,
  };
}

async function toolLogPick({ team, pick_type, line, odds, amount_units, game_context, notes, book, legs, parlay_size, contest_name, contest_week, game_date }) {
  const today = new Date().toISOString().split('T')[0];
  const rationale = notes || `Logged by BETTING agent${book ? ` · Book: ${book}` : ''}`;

  // ── Parlay ──────────────────────────────────────────────────────────────────
  if (pick_type === 'parlay') {
    if (!legs?.length) {
      return { status: 'error', message: 'Parlay requires legs array: [{ team, game, line }]' };
    }
    const result = addParlay({
      legs,
      combinedOdds: typeof odds === 'number' ? odds : parseFloat(odds) || 600,
      stake: amount_units || 1,
      gameDate: game_date || today,
      contestName: contest_name || null,
      contestWeek: contest_week || null,
      rationale,
    });
    if (!result.success) {
      return { status: 'error', message: 'Parlay validation failed', validation_errors: result.errors };
    }
    const t = result.pick.teamCount;
    return {
      status: 'logged',
      pick_id: result.pick.id,
      summary: `✅ Logged: ${t}-team parlay @ ${odds > 0 ? '+' : ''}${odds} · ${amount_units || 1}u${contest_name ? ` · ${contest_name}` : ''}`,
      combination_count: null,
      total_stake: amount_units || 1,
    };
  }

  // ── Round Robin ─────────────────────────────────────────────────────────────
  if (pick_type === 'round_robin') {
    if (!legs?.length) {
      return { status: 'error', message: 'Round-robin requires legs array: [{ team, game, line }]' };
    }
    if (!parlay_size) {
      return { status: 'error', message: 'Round-robin requires parlay_size (e.g. 4 for a 4-team RR)' };
    }
    const result = addRoundRobin({
      legs,
      totalLegs: legs.length,
      parlaySize: parlay_size,
      stakePer: amount_units || 0.5,
      gameDate: game_date || today,
      rationale,
    });
    if (!result.success) {
      return { status: 'error', message: 'Round-robin validation failed', validation_errors: result.errors };
    }
    const { totalCombinations, totalStake } = result.pick;
    return {
      status: 'logged',
      pick_id: result.pick.id,
      summary: `✅ Logged: ${legs.length}-pick/${parlay_size}-team RR · ${totalCombinations} combos · ${totalStake}u total (${amount_units || 0.5}u/ea)`,
      combination_count: totalCombinations,
      total_stake: totalStake,
    };
  }

  // ── Straight bet (spread / total / moneyline) ────────────────────────────────
  const gameId = `agent-${game_context?.replace(/\s+/g, '-').toLowerCase() || team}-${Date.now()}`;
  const result = addPick({
    gameId,
    source: 'AI_LAB',
    pickType: pick_type,
    selection: team,
    line: parseFloat(line),
    confidence: 60,
    edge: 0,
    rationale,
    expert: 'BETTING Agent',
    units: amount_units || 1,
    gameDate: game_date || today,
    gameTime: '00:00',
    commenceTimeISO: null,
    odds: odds || -110,
  });

  if (!result.success) {
    return { status: 'error', message: result.error || 'Failed to log pick', validation_errors: result.errors };
  }

  return {
    status: 'logged',
    pick_id: result.pick?.id,
    summary: `✅ Logged: ${team} ${pick_type} ${line} (${odds > 0 ? '+' : ''}${odds}) · ${amount_units}u · ${game_context || ''}`,
  };
}

function toolGetPerformanceStats({ source } = {}) {
  const filterSource = source || null;
  const standings = calculateStandings(filterSource);
  const confBreakdown = statsByConfidence();
  const edgeBreakdown = statsByEdge(filterSource);

  const allPicks = loadPicks(filterSource ? { source: filterSource } : {});
  const graded = allPicks.filter(p => p.result !== 'PENDING');
  const pending = allPicks.filter(p => p.result === 'PENDING').length;

  // Team breakdown — group by selection
  const byTeamMap = {};
  graded.forEach(p => {
    const team = p.selection || 'unknown';
    if (!byTeamMap[team]) {
      byTeamMap[team] = { wins: 0, losses: 0, pushes: 0 };
    }
    if (p.result === 'WIN') byTeamMap[team].wins++;
    else if (p.result === 'LOSS') byTeamMap[team].losses++;
    else if (p.result === 'PUSH') byTeamMap[team].pushes++;
  });
  const byTeam = Object.entries(byTeamMap)
    .map(([team, s]) => {
      const total = s.wins + s.losses;
      return {
        team,
        wins: s.wins,
        losses: s.losses,
        pushes: s.pushes,
        winRate: total > 0 ? +(s.wins / total * 100).toFixed(1) : 0,
      };
    })
    .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
    .slice(0, 15);

  // Rolling last-10 graded
  const last10 = graded.slice(-10);
  const JUICE = 1.1;
  const last10Units = last10.reduce((acc, p) => {
    if (p.result === 'WIN') return acc + 1;
    if (p.result === 'LOSS') return acc - JUICE;
    return acc;
  }, 0);

  const pickTypeBreakdown = statsByPickType();

  return {
    total_graded: graded.length,
    total_pending: pending,
    standings,
    last_10: {
      wins: last10.filter(p => p.result === 'WIN').length,
      losses: last10.filter(p => p.result === 'LOSS').length,
      units: +last10Units.toFixed(2),
    },
    by_confidence: confBreakdown,
    by_edge: edgeBreakdown,
    by_team: byTeam,
    by_pick_type: pickTypeBreakdown,
  };
}

async function toolSearchIntel({ query, source, hours = 168, limit = 5 } = {}) {
  if (!query?.trim()) {
    return { error: 'query is required.' };
  }

  const { notes, signals } = await searchResearchIntel(query.trim(), {
    source,
    hours,
    limit,
  });

  if (notes.length === 0) {
    return {
      status: 'no_results',
      query,
      source: source || 'all sources',
      window_hours: hours,
      message: `No articles found matching "${query}" in the last ${hours}h. The intel agent may not have captured content on this topic yet.`,
    };
  }

  // Group signals by note id for easy attachment
  const signalsByNoteId = {};
  signals.forEach(s => {
    if (!signalsByNoteId[s.note_id]) signalsByNoteId[s.note_id] = [];
    signalsByNoteId[s.note_id].push(s);
  });

  return {
    query,
    source: source || 'all sources',
    window_hours: hours,
    result_count: notes.length,
    articles: notes.map(n => ({
      source: n.source,
      title: n.title,
      summary: n.summary,
      url: n.url,
      published_at: n.published_at,
      confidence: n.confidence,
      pick_signals: (signalsByNoteId[n.id] || []).map(s => ({
        lean: s.lean,
        bet_type: s.bet_type,
        confidence: s.confidence,
      })),
    })),
  };
}

async function toolSearchSharpTweets({ query, handle, hours = 168, limit = 8 } = {}) {
  if (!query?.trim()) {
    return { error: 'query is required.' };
  }

  const tweets = await searchSharpTweets(query.trim(), {
    handle,
    hours,
    limit,
  });

  if (tweets.length === 0) {
    return {
      status: 'no_results',
      query,
      handle: handle || 'all accounts',
      window_hours: hours,
      message: `No sharp tweets found matching "${query}" in the last ${hours}h. The ingest agent may not have captured recent content, or try a broader query.`,
    };
  }

  return {
    query,
    handle: handle || 'all accounts',
    window_hours: hours,
    result_count: tweets.length,
    tweets: tweets.map(t => ({
      account:      `@${t.author_handle}`,
      tier:         t.author_tier,
      text:         t.text,
      url:          t.tweet_url,
      published_at: t.published_at,
    })),
  };
}

async function toolReadVaultNote({ path } = {}) {
  if (!path?.trim()) {
    return { error: 'path is required.' };
  }

  const content = await readVaultNote(path.trim());
  if (content === null) {
    return {
      status: 'not_found',
      path,
      message: `Note not found at "${path}". Common reference paths: NFL/Reference/CoachTendencies.md, NFL/Reference/DVOA.md, NFL/Reference/ATS_Trends.md, NFL/Reference/KeyNumbers.md. Session paths: NFL/Sessions/YYYY-MM-DD.md.`,
    };
  }

  return {
    status: 'ok',
    path,
    char_count: content.length,
    content,
  };
}

async function toolWriteVaultNote({ path, content, tags = [] } = {}) {
  if (!path?.trim()) return { error: 'path is required.' };
  if (!content?.trim()) return { error: 'content is required.' };

  // Safety: scope writes to NFL/ prefix only
  const safePath = path.trim();
  if (!safePath.startsWith('NFL/')) {
    return {
      error: 'Vault writes are scoped to the NFL/ prefix. Use paths like "NFL/Sessions/YYYY-MM-DD.md" or "NFL/Teams/KC.md".',
    };
  }

  const ok = await writeVaultNote(safePath, content.trim(), tags || []);
  if (!ok) {
    return {
      status: 'error',
      path: safePath,
      message: 'Write failed. Check that VITE_OBSIDIAN_API_KEY is set and Obsidian is running (local dev), or that vault_notes table is accessible (production).',
    };
  }

  return {
    status: 'written',
    path: safePath,
    char_count: content.trim().length,
    tags: tags || [],
    message: `\u2705 Note saved to ${safePath}`,
  };
}

async function toolGetBettingSplits({ team, week } = {}) {
  const { getNFLWeekInfo } = await import('./constants.js');
  const currentWeek = week || getNFLWeekInfo().week;

  if (!currentWeek) {
    return {
      status: 'offseason',
      message: 'No active NFL games — splits are only available during the regular and postseason.',
      splits: [],
    };
  }

  const rows = await getGameSplitsForWeek(currentWeek);

  if (!rows || rows.length === 0) {
    return {
      status: 'unavailable',
      week: currentWeek,
      message: 'No splits data in database. The betting-splits-ingest agent may not have run yet for this week, or lines have not been posted.',
      splits: [],
    };
  }

  // Optionally filter by team
  let filtered = rows;
  if (team && team.trim()) {
    const q = team.trim().toUpperCase();
    filtered = rows.filter(r =>
      r.home_team?.toUpperCase().includes(q) ||
      r.away_team?.toUpperCase().includes(q),
    );
    if (filtered.length === 0) {
      return {
        status: 'not_found',
        week: currentWeek,
        message: `No game found for team "${team}" in week ${currentWeek}.`,
        splits: [],
      };
    }
  }

  const formatted = filtered.map(r => ({
    matchup:       `${r.away_team} @ ${r.home_team}`,
    game_id:       r.game_id,
    spread: {
      home_bettors: r.spread_home_bettors,
      home_money:   r.spread_home_money,
      away_bettors: r.spread_home_bettors != null ? 100 - r.spread_home_bettors : null,
      away_money:   r.spread_home_money   != null ? 100 - r.spread_home_money   : null,
    },
    total: {
      over_bettors:  r.total_over_bettors,
      over_money:    r.total_over_money,
      under_bettors: r.total_over_bettors != null ? 100 - r.total_over_bettors : null,
      under_money:   r.total_over_money   != null ? 100 - r.total_over_money   : null,
    },
    moneyline: {
      home_bettors: r.ml_home_bettors,
      home_money:   r.ml_home_money,
      away_bettors: r.ml_home_bettors != null ? 100 - r.ml_home_bettors : null,
      away_money:   r.ml_home_money   != null ? 100 - r.ml_home_money   : null,
    },
    captured_at: r.captured_at,
  }));

  return {
    status:  'ok',
    week:    currentWeek,
    source:  'actionnetwork',
    count:   formatted.length,
    splits:  formatted,
    note: 'Sharp money divergence signal: when ticket% and money% differ significantly (>15%), the money side represents larger-bet (sharper) action.',
  };
}

// ─── Phase 6 — Podcast intel tool implementations ────────────────────────────
// Thin wrappers around src/lib/supabase.js queries. Shape outputs for the LLM:
// keep payloads compact and label the source ("podcast" / per-pick episode +
// expert) so the agent can produce the citation form required by spec §A8.

function _formatPodcastPick(row) {
  const p = row.pick || {};
  return {
    episode_id: row.episode_id,
    episode_title: row.episode_title,
    pub_date: row.pub_date,
    expert: row.expert,
    feed: row.feed_name,
    category: p.category,
    subject: p.subject,
    subject_market: p.subject_market || null,
    selection: p.selection,
    line: p.line ?? null,
    odds_american: p.odds_american ?? null,
    units: p.units ?? null,
    confidence: p.confidence ?? null,
    season: p.season ?? null,
    week: p.week ?? null,
    summary: p.summary || '',
  };
}

async function toolSearchPodcastPicks({ team, expert, category, week, season, limit } = {}) {
  const rows = await searchPodcastPicks({ team, expert, category, week, season, limit });
  if (!rows || rows.length === 0) {
    return {
      status: 'no_data',
      message: 'No podcast picks matched. Off-season or pipeline has not run for the requested filters.',
      picks: [],
    };
  }
  return {
    status: 'ok',
    count: rows.length,
    picks: rows.map(_formatPodcastPick),
  };
}

async function toolGetExpertHistory({ expert, weeks_back, limit } = {}) {
  if (!expert) return { status: 'invalid', message: 'expert is required.' };
  const out = await getExpertHistory({ expert, weeksBack: weeks_back, limit });
  return {
    status: out.total > 0 ? 'ok' : 'no_data',
    expert: out.expert,
    total_picks: out.total,
    by_category: out.by_category,
    picks: (out.picks || []).map(_formatPodcastPick),
  };
}

async function toolGetTeamPodcastIntel({ team, weeks_back, limit } = {}) {
  if (!team) return { status: 'invalid', message: 'team is required.' };
  const out = await getTeamPodcastIntel({ team, weeksBack: weeks_back, limit });
  const total = (out.for?.length || 0) + (out.against?.length || 0);
  return {
    status: total > 0 ? 'ok' : 'no_data',
    team: out.team,
    for_count: out.for?.length || 0,
    against_count: out.against?.length || 0,
    by_expert: out.by_expert,
    for: (out.for || []).map(_formatPodcastPick),
    against: (out.against || []).map(_formatPodcastPick),
  };
}

async function toolGetWeeklyConsensus({ week, season } = {}) {
  if (week == null) return { status: 'invalid', message: 'week is required.' };
  const out = await getWeeklyConsensus({ week, season });
  return {
    status: out.games.length > 0 ? 'ok' : 'no_data',
    week: out.week,
    season: out.season,
    game_count: out.games.length,
    games: out.games.map(g => ({
      matchup: g.matchup,
      team1: g.team1,
      team2: g.team2,
      pick_count: g.picks.length,
      by_selection: g.by_selection,
      picks: g.picks.map(_formatPodcastPick),
    })),
  };
}

async function toolGetFuturesMovement({ market, weeks_back, limit } = {}) {
  if (!market) return { status: 'invalid', message: 'market is required.' };
  const out = await getFuturesMovement({ market, weeksBack: weeks_back, limit });
  return {
    status: out.picks.length > 0 ? 'ok' : 'no_data',
    market: out.market,
    pick_count: out.picks.length,
    by_expert: out.by_expert,
    picks: out.picks.map(_formatPodcastPick),
  };
}

async function toolGetPlayerPropContext({ player, prop_type, weeks_back, limit } = {}) {
  if (!player || !prop_type) {
    return { status: 'invalid', message: 'player and prop_type are required.' };
  }
  const out = await getPlayerPropContext({ player, propType: prop_type, weeksBack: weeks_back, limit });
  return {
    status: out.picks.length > 0 ? 'ok' : 'no_data',
    player: out.player,
    prop_type: out.prop_type,
    pick_count: out.picks.length,
    trend: out.trend,
    picks: out.picks.map(_formatPodcastPick),
  };
}


// ─── B4: Episode vault note lookup ────────────────────────────────────────────

/**
 * search_episode_vault_notes
 * Lists podcast episode vault note paths under NFL/Podcasts/.
 * Returns parsed metadata so the agent can cite episode paths and then
 * call read_vault_note to load picks, intel, and transcript index.
 */
async function toolSearchEpisodeVaultNotes({ show, episode, limit = 20 } = {}) {
  const PODCAST_PREFIX = 'NFL/Podcasts/';
  const allPaths = await listVaultNotes(PODCAST_PREFIX);

  if (!allPaths || allPaths.length === 0) {
    return {
      status: 'no_data',
      message: 'No podcast vault notes found under NFL/Podcasts/. The backfill script may not have run yet.',
      notes: [],
    };
  }

  // Filter by show name (partial, case-insensitive)
  let filtered = allPaths;
  if (show && show.trim()) {
    const q = show.trim().toLowerCase();
    filtered = filtered.filter(p => p.toLowerCase().includes(q));
  }

  // Filter by episode number or pub_date substring
  if (episode != null && String(episode).trim()) {
    const q = String(episode).trim();
    filtered = filtered.filter(p => p.includes(q));
  }

  // Parse path into structured metadata
  // Path format: NFL/Podcasts/{show}/{pub_date}-E{episode}.md
  const notes = filtered.slice(0, limit).map(p => {
    const parts = p.split('/');
    const showName = parts[2] ?? null;
    const filename = parts[3] ?? '';
    const m = filename.match(/^(\d{4}-\d{2}-\d{2})-E(\w+)\.md$/);
    return {
      path: p,
      show: showName,
      pub_date: m ? m[1] : null,
      episode: m ? m[2] : null,
    };
  });

  // Surface unique show names when no show filter was applied
  const availableShows = show
    ? undefined
    : [...new Set(allPaths.map(p => p.split('/')[2]).filter(Boolean))].sort();

  return {
    status: 'ok',
    total_matched: filtered.length,
    returned: notes.length,
    ...(availableShows ? { available_shows: availableShows } : {}),
    notes,
    usage_hint: 'Call read_vault_note with a path from this list to load the full episode note (picks table, intel bullets, transcript index).',
  };
}

// ─── S301: Local YouTube/Gemini agent intel summary ──────────────────────────

/**
 * get_youtube_futures_intel
 * Reads the local, human-reviewed YouTube/Gemini podcast intel summary
 * (data/shadow-harness/review/youtube-futures-agent-intel-summary.json,
 * synced to public/ by scripts/build-youtube-futures-agent-intel-summary.js)
 * and returns team/market/lane-filtered items.
 *
 * This is local-only research context: no Supabase, no live API call, no
 * production recommendation. review_flags (e.g. "price_not_in_quote") must
 * be preserved and surfaced by the caller — never silently dropped.
 */
async function toolGetYoutubeFuturesIntel({ team, market, lane, limit = 25 } = {}) {
  let summary = null;
  try {
    const resp = await fetch(LOCAL_DATA.YOUTUBE_FUTURES_INTEL);
    if (resp.ok) summary = await resp.json();
  } catch { /* non-fatal — fall through to no_data below */ }

  if (!summary || !Array.isArray(summary.items) || summary.items.length === 0) {
    return {
      status: 'no_data',
      message: 'No local YouTube futures intel summary found. Run npm.cmd run youtube:agent-intel-summary to (re)generate it.',
      items: [],
    };
  }

  let items = summary.items;
  if (team && team.trim()) {
    const q = team.trim().toUpperCase();
    items = items.filter(i => (i.team || '').toUpperCase() === q);
  }
  if (market && market.trim()) {
    const q = market.trim().toLowerCase();
    items = items.filter(i => (i.market || '').toLowerCase() === q);
  }
  if (lane && lane.trim()) {
    const q = lane.trim().toLowerCase();
    items = items.filter(i => (i.lane || '').toLowerCase() === q);
  }

  const capped = items.slice(0, limit);

  return {
    status: capped.length > 0 ? 'ok' : 'no_data',
    guardrail: summary.guardrail || 'Reviewed local podcast intel for agent context only. This is not an official pick ledger, production recommendation, Supabase write, or parlay mutation.',
    generated_at: summary.generated_at,
    total_matched: items.length,
    returned: capped.length,
    items: capped,
  };
}

// ─── FUT-TOOLS Implementations ────────────────────────────────────────────────

/**
 * analyze_futures_hedge
 * Models three hedge scenarios for an open futures position:
 *   1. Hold (no hedge) — full upside, line appreciation context
 *   2. Full lock — guaranteed profit regardless of outcome
 *   3. Partial lock — custom target_locked_profit if supplied
 */
function toolAnalyzeFuturesHedge({
  stake,
  entry_odds,
  current_odds,
  hedge_odds,
  hedge_description = 'opposing side',
  target_locked_profit,
} = {}) {
  if (!stake || entry_odds == null || current_odds == null || hedge_odds == null) {
    return { status: 'invalid', message: 'stake, entry_odds, current_odds, and hedge_odds are all required.' };
  }

  const toDecimal = (american) =>
    american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
  const toImpliedProb = (american) => {
    if (american > 0) return 100 / (american + 100);
    return Math.abs(american) / (Math.abs(american) + 100);
  };
  const fmt = (n) => parseFloat(n.toFixed(2));
  const pct = (n) => parseFloat((n * 100).toFixed(1));

  const entryDecimal   = toDecimal(entry_odds);
  const hedgeDecimal   = toDecimal(hedge_odds);

  const originalPayout = stake * entryDecimal;
  const originalProfit = originalPayout - stake;

  const currentImpliedProb = toImpliedProb(current_odds);
  const entryImpliedProb   = toImpliedProb(entry_odds);
  const impliedValueNow    = stake / currentImpliedProb;
  const lineAppreciation   = fmt(impliedValueNow - stake);

  // ── Scenario 1: Hold ──
  const holdScenario = {
    label: 'Hold — no hedge',
    action: 'Do nothing. Let the position ride.',
    if_wins: { profit: fmt(originalProfit), payout: fmt(originalPayout) },
    if_loses: { profit: fmt(-stake) },
    current_implied_prob: `${pct(currentImpliedProb)}%`,
    entry_implied_prob:   `${pct(entryImpliedProb)}%`,
    line_appreciation: lineAppreciation > 0
      ? `+$${lineAppreciation} (position gained value since entry)`
      : `$${lineAppreciation} (position lost value since entry)`,
  };

  // ── Scenario 2: Full lock ──
  // Derive: win=originalProfit-H, lose=H*(hedgeDecimal-1)-stake → set equal
  // H = originalPayout / hedgeDecimal
  const fullHedgeStake   = originalPayout / hedgeDecimal;
  const fullLockedProfit = originalProfit - fullHedgeStake;
  const fullLockScenario = {
    label: 'Full lock — guaranteed profit',
    action: `Bet $${fmt(fullHedgeStake)} on ${hedge_description} at ${hedge_odds > 0 ? '+' : ''}${hedge_odds}.`,
    hedge_stake: fmt(fullHedgeStake),
    hedge_odds,
    guaranteed_profit: fmt(fullLockedProfit),
    roi_on_original_stake: `${pct(fullLockedProfit / stake)}%`,
    if_original_wins:  { profit: fmt(originalProfit - fullHedgeStake), note: 'original wins, hedge loses' },
    if_original_loses: { profit: fmt(fullHedgeStake * (hedgeDecimal - 1) - stake), note: 'original loses, hedge wins' },
    note: fullLockedProfit >= 0
      ? `Locks $${fmt(fullLockedProfit)} profit regardless of outcome.`
      : `Warning: full lock results in guaranteed loss of $${fmt(Math.abs(fullLockedProfit))} — hedge odds too short.`,
  };

  // ── Scenario 3: Partial lock ──
  let partialScenario = null;
  if (target_locked_profit != null) {
    const partialH = originalProfit - target_locked_profit;
    if (partialH <= 0) {
      partialScenario = {
        label: 'Partial hedge',
        note: `Cannot lock $${target_locked_profit} — exceeds original win profit of $${fmt(originalProfit)}.`,
      };
    } else {
      // partialH > 0: always valid. When hedge odds are short, partialH can
      // exceed fullHedgeStake — the lose-case floor will still be positive.
      const loseOutcome = partialH * (hedgeDecimal - 1) - stake;
      partialScenario = {
        label: `Partial hedge — lock $${fmt(target_locked_profit)} profit`,
        action: `Bet $${fmt(partialH)} on ${hedge_description} at ${hedge_odds > 0 ? '+' : ''}${hedge_odds}.`,
        hedge_stake: fmt(partialH),
        if_original_wins:  { profit: fmt(target_locked_profit) },
        if_original_loses: { profit: fmt(loseOutcome) },
        note: loseOutcome >= 0
          ? `Wins: $${fmt(target_locked_profit)}. Loses: $${fmt(loseOutcome)} (still profitable).`
          : `Wins: $${fmt(target_locked_profit)}. Loses: -$${fmt(Math.abs(loseOutcome))} (partial protection only).`,
      };
    }
  }

  return {
    status: 'ok',
    summary: {
      original_stake: stake,
      entry_odds,
      current_odds,
      potential_profit_if_wins: fmt(originalProfit),
      potential_payout_if_wins: fmt(originalPayout),
    },
    scenarios: {
      hold: holdScenario,
      full_lock: fullLockScenario,
      ...(partialScenario ? { partial_lock: partialScenario } : {}),
    },
  };
}

// ── Division → teams mapping ──────────────────────────────────────────────────
const DIVISION_TEAMS = {
  'afc east':  ['Buffalo Bills',     'Miami Dolphins',       'New England Patriots', 'New York Jets'],
  'afc north': ['Baltimore Ravens',  'Cincinnati Bengals',   'Cleveland Browns',     'Pittsburgh Steelers'],
  'afc south': ['Houston Texans',    'Indianapolis Colts',   'Jacksonville Jaguars', 'Tennessee Titans'],
  'afc west':  ['Denver Broncos',    'Kansas City Chiefs',   'Los Angeles Chargers', 'Las Vegas Raiders'],
  'nfc east':  ['Dallas Cowboys',    'New York Giants',      'Philadelphia Eagles',  'Washington Commanders'],
  'nfc north': ['Chicago Bears',     'Detroit Lions',        'Green Bay Packers',    'Minnesota Vikings'],
  'nfc south': ['Atlanta Falcons',   'Carolina Panthers',    'New Orleans Saints',   'Tampa Bay Buccaneers'],
  'nfc west':  ['Arizona Cardinals', 'Los Angeles Rams',     'San Francisco 49ers',  'Seattle Seahawks'],
};

const DIVISION_MARKET_TYPES = {
  'afc east': 'division_afc_east', 'afc north': 'division_afc_north',
  'afc south': 'division_afc_south', 'afc west': 'division_afc_west',
  'nfc east': 'division_nfc_east', 'nfc north': 'division_nfc_north',
  'nfc south': 'division_nfc_south', 'nfc west': 'division_nfc_west',
};

const CONF_MARKET = { afc: 'conference_afc', nfc: 'conference_nfc' };

/**
 * project_division_paths
 * Fetches current division/conference/SB odds from Supabase and returns
 * a structured per-team outlook with implied probabilities.
 */
async function toolProjectDivisionPaths({ division } = {}) {
  if (!division) return { status: 'invalid', message: 'division is required.' };

  const divKey = division.toLowerCase().replace(/_/g, ' ').trim();
  const teams  = DIVISION_TEAMS[divKey];
  if (!teams) {
    return {
      status: 'invalid',
      message: `Unknown division "${division}". Valid: ${Object.keys(DIVISION_TEAMS).map(d => d.toUpperCase()).join(', ')}.`,
    };
  }

  const conf       = divKey.startsWith('afc') ? 'afc' : 'nfc';
  const divMarket  = DIVISION_MARKET_TYPES[divKey];
  const confMarket = CONF_MARKET[conf];

  let allOdds = [];
  try { allOdds = await getLatestFuturesOdds(); } catch (_) { allOdds = []; }

  // S296: enrich with real schedule-strength + EPA/ATS context (previously this
  // tool's description promised this but the implementation never fetched it).
  // Best-effort — failures here must not take down the odds response.
  let statsByAbbr = {};
  let sosByAbbr = {};
  try {
    const [statsRows, sosRows] = await Promise.all([
      getTeamSeasonStats({}),
      getStrengthOfSchedule({}),
    ]);
    for (const r of (statsRows || [])) statsByAbbr[r.team] = r;
    for (const r of (sosRows || [])) sosByAbbr[r.team_abbr] = r;
  } catch (_) { statsByAbbr = {}; sosByAbbr = {}; }

  const toImpliedProb = (american) => {
    if (american == null) return null;
    return american > 0 ? 100 / (american + 100) : Math.abs(american) / (Math.abs(american) + 100);
  };
  const fmt = (n) => parseFloat(n.toFixed(1));

  const bestOdds = (fullName, marketType) => {
    const last = fullName.split(' ').pop().toLowerCase();
    const rows = allOdds.filter(r =>
      r.market_type === marketType &&
      r.team && r.team.toLowerCase().includes(last)
    );
    if (!rows.length) return null;
    return rows.reduce((best, r) => (r.odds > (best?.odds ?? -Infinity) ? r : best), null);
  };

  const fmtOdds = (o) => o == null ? 'n/a' : (o > 0 ? `+${o}` : String(o));

  const teamRows = teams.map(fullName => {
    const divRow  = bestOdds(fullName, divMarket);
    const confRow = bestOdds(fullName, confMarket);
    const sbRow   = bestOdds(fullName, 'superbowl');
    const divProb = divRow ? toImpliedProb(divRow.odds) : null;
    const abbr    = getTeamAbbreviation(fullName);
    const stats   = abbr ? statsByAbbr[abbr] : null;
    const sos     = abbr ? sosByAbbr[abbr] : null;
    return {
      team: fullName,
      division_winner: {
        odds: fmtOdds(divRow?.odds),
        implied_prob: divProb ? `${fmt(divProb * 100)}%` : 'n/a',
        book: divRow?.book ?? null,
      },
      conference_winner: {
        odds: fmtOdds(confRow?.odds),
        implied_prob: confRow ? `${fmt(toImpliedProb(confRow.odds) * 100)}%` : 'n/a',
      },
      super_bowl: {
        odds: fmtOdds(sbRow?.odds),
        implied_prob: sbRow ? `${fmt(toImpliedProb(sbRow.odds) * 100)}%` : 'n/a',
      },
      schedule_strength: sos ? {
        sos_rank: sos.sos_rank,
        sos_pool_size: sos.sos_pool_size,
        opponent_win_total_sum: sos.opponent_win_total_sum,
      } : null,
      analytics: stats ? {
        season: stats.season,
        record: `${stats.wins ?? '?'}-${stats.losses ?? '?'}${stats.ties ? `-${stats.ties}` : ''}`,
        off_epa_rank: stats.off_epa_rank,
        def_epa_rank: stats.def_epa_rank,
        ats_home: stats.home_ats_record,
        ats_away: stats.away_ats_record,
      } : null,
      _sortKey: divProb ?? -1,
    };
  });

  teamRows.sort((a, b) => b._sortKey - a._sortKey);
  teamRows.forEach(r => delete r._sortKey);

  const hasData = teamRows.some(r => r.division_winner.odds !== 'n/a');
  const hasEnrichment = teamRows.some(r => r.analytics || r.schedule_strength);

  return {
    status: hasData ? 'ok' : 'no_data',
    division: divKey.toUpperCase(),
    conference: conf.toUpperCase(),
    note: hasData
      ? `Division winner odds from latest Supabase snapshot.${hasEnrichment ? ' schedule_strength/analytics are populated where nfl_team_season_stats + SoS data is available.' : ' schedule_strength/analytics unavailable — call get_team_analytics/get_strength_of_schedule directly, or the underlying tables may not be seeded yet.'} Call get_injury_report separately for injuries — not duplicated here.`
      : 'No division odds in Supabase yet — market typically opens July-August. Use vault reference data for qualitative analysis.',
    teams: teamRows,
  };
}

// ── Award → market_type mapping ───────────────────────────────────────────────
const AWARD_MARKET_MAP = {
  MVP:  { marketType: 'award_mvp',                     label: 'Most Valuable Player' },
  OPOY: { marketType: 'award_offensive_player_of_year', label: 'Offensive Player of the Year' },
  DPOY: { marketType: 'award_defensive_player_of_year', label: 'Defensive Player of the Year' },
  OROY: { marketType: 'award_offensive_rookie_of_year', label: 'Offensive Rookie of the Year' },
  DROY: { marketType: 'award_defensive_rookie_of_year', label: 'Defensive Rookie of the Year' },
  CPOY: { marketType: 'award_comeback_player_of_year',  label: 'Comeback Player of the Year' },
  COY:  { marketType: 'award_coach_of_year',            label: 'Coach of the Year' },
};

/**
 * track_award_race
 * Ranked award leaderboard from sportsbook odds + podcast expert mentions.
 */
async function toolTrackAwardRace({ award, limit = 10 } = {}) {
  const key = String(award || '').toUpperCase();
  const mapping = AWARD_MARKET_MAP[key];
  if (!mapping) {
    return {
      status: 'invalid',
      message: `Unknown award "${award}". Valid: ${Object.keys(AWARD_MARKET_MAP).join(', ')}.`,
    };
  }

  const { marketType, label } = mapping;

  let allOdds = [];
  let podcastData = { picks: [], by_expert: {} };
  try {
    [allOdds, podcastData] = await Promise.all([
      getLatestFuturesOdds(),
      getFuturesMovement({ market: label, weeksBack: 16, limit: 200 }),
    ]);
  } catch (_) { allOdds = []; }

  const toImpliedProb = (american) =>
    american > 0 ? 100 / (american + 100) : Math.abs(american) / (Math.abs(american) + 100);
  const fmt = (n) => parseFloat(n.toFixed(1));

  const rows = allOdds.filter(r => r.market_type === marketType);
  if (!rows.length) {
    return {
      status: 'no_data',
      award: key,
      label,
      message: 'No odds data for this award yet — markets typically open July-August.',
      podcast_mentions: podcastData.picks.length,
    };
  }

  // Best odds per candidate (highest payout = most positive American odds)
  const byCandidate = new Map();
  for (const row of rows) {
    if (!byCandidate.has(row.team) || row.odds > byCandidate.get(row.team).odds) {
      byCandidate.set(row.team, row);
    }
  }

  // Count podcast mentions per candidate by last name match
  const mentionCounts = new Map();
  for (const pick of (podcastData.picks || [])) {
    const subject = String(pick.pick?.subject || pick.subject || '').toLowerCase();
    if (!subject) continue;
    for (const [name] of byCandidate) {
      const last = name.split(' ').pop().toLowerCase();
      if (subject.includes(last) || subject.includes(name.toLowerCase())) {
        mentionCounts.set(name, (mentionCounts.get(name) || 0) + 1);
      }
    }
  }

  const leaderboard = [...byCandidate.values()]
    .map(row => ({
      candidate: row.team,
      best_odds: row.odds > 0 ? `+${row.odds}` : String(row.odds),
      implied_prob: `${fmt(toImpliedProb(row.odds) * 100)}%`,
      best_book: row.book,
      expert_mentions: mentionCounts.get(row.team) || 0,
    }))
    .sort((a, b) => parseFloat(b.implied_prob) - parseFloat(a.implied_prob))
    .slice(0, limit)
    .map((c, i) => ({ rank: i + 1, ...c }));

  return {
    status: 'ok',
    award: key,
    label,
    candidate_count: byCandidate.size,
    leaderboard,
    podcast_context: {
      total_expert_mentions: podcastData.picks.length,
      experts_covering: Object.keys(podcastData.by_expert || {}),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// S296 — data-wiring pass. Tools onto nfl_team_season_stats / nfl_rosters /
// normalized_signals / podcast_host_summaries / real futures-odds movement /
// Strength of Schedule — all previously in the data layer but unreachable by
// the live agent. See docs/FUTURES_AGENT_DATA_INVENTORY_2026-07-21.md.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * get_team_analytics
 * Season-level team analytics: record, ATS, O/U, EPA/play, formation tendencies, ranks.
 */
async function toolGetTeamAnalytics({ team, season } = {}) {
  const abbr = team ? getTeamAbbreviation(team) : null;
  if (team && !abbr) {
    return { status: 'invalid', message: `Unrecognized team "${team}".` };
  }

  let rows = [];
  try { rows = await getTeamSeasonStats({ team: abbr, season }); } catch (_) { rows = []; }

  if (!rows.length) {
    return {
      status: 'no_data',
      team: abbr ?? null,
      message: 'No season stats on file for this team/season yet.',
    };
  }

  const shape = (r) => ({
    team: r.team,
    season: r.season,
    record: `${r.wins ?? '?'}-${r.losses ?? '?'}${r.ties ? `-${r.ties}` : ''}`,
    ats: (r.home_ats_record || r.away_ats_record)
      ? { home: r.home_ats_record, away: r.away_ats_record }
      : (r.ats_wins != null ? { overall: `${r.ats_wins}-${r.ats_losses}-${r.ats_pushes ?? 0}` } : null),
    over_under: (r.over_count != null) ? `${r.over_count}O-${r.under_count}U-${r.push_count ?? 0}P` : null,
    offense: {
      points_per_game: r.points_for_pg,
      yards_per_game: r.yards_pg,
      epa_per_play: r.off_epa_per_play,
      epa_rank: r.off_epa_rank,
      third_down_pct: r.third_down_pct,
      red_zone_pct: r.red_zone_pct,
    },
    defense: {
      points_allowed_per_game: r.points_against_pg,
      yards_allowed_per_game: r.yards_allowed_pg,
      epa_per_play: r.def_epa_per_play,
      epa_rank: r.def_epa_rank,
    },
    tendencies: {
      shotgun_rate: r.shotgun_rate,
      no_huddle_rate: r.no_huddle_rate,
      pass_rate: r.pass_rate,
    },
    source: r.source,
    updated_at: r.updated_at,
  });

  return { status: 'ok', count: rows.length, teams: rows.map(shape) };
}

/**
 * get_team_roster
 * Current/latest known roster for a team, from weekly nflverse snapshots.
 */
async function toolGetTeamRoster({ team, position } = {}) {
  if (!team) return { status: 'invalid', message: 'team is required.' };
  const abbr = getTeamAbbreviation(team);
  if (!abbr) return { status: 'invalid', message: `Unrecognized team "${team}".` };

  let players = [];
  try { players = await getTeamRoster({ team: abbr, position }); } catch (_) { players = []; }

  if (!players.length) {
    return { status: 'no_data', team: abbr, message: 'No roster snapshot on file for this team yet.' };
  }

  return {
    status: 'ok',
    team: abbr,
    as_of: { season: players[0].season, week: players[0].week },
    player_count: players.length,
    players: players.map(p => ({
      name: p.full_name,
      position: p.position,
      depth_chart_position: p.depth_chart_position,
      jersey_number: p.jersey_number,
      status: p.status,
      years_exp: p.years_exp,
    })),
  };
}

/**
 * get_strength_of_schedule
 * SoS rank (1 = hardest) from sum of opponents' consensus win-total lines.
 */
async function toolGetStrengthOfSchedule({ team, season } = {}) {
  const abbr = team ? getTeamAbbreviation(team) : null;
  if (team && !abbr) return { status: 'invalid', message: `Unrecognized team "${team}".` };

  let rows = [];
  try { rows = await getStrengthOfSchedule({ season: season || new Date().getFullYear() }); } catch (_) { rows = []; }

  if (!rows.length) {
    return {
      status: 'no_data',
      message: 'SoS requires both the season schedule (games table) and win-total lines (futures_odds_snapshots) to be seeded — one or both are missing for this season.',
    };
  }

  if (abbr) {
    const row = rows.find(r => r.team_abbr === abbr);
    if (!row) {
      return { status: 'no_data', team: abbr, message: 'No SoS data for this team (opponent win-total lines may be incomplete).' };
    }
    return { status: 'ok', team: abbr, ...row };
  }

  return {
    status: 'ok',
    pool_size: rows.length,
    hardest: rows[0],
    easiest: rows[rows.length - 1],
    teams: rows,
  };
}

/**
 * get_futures_odds_movement
 * Real sportsbook odds movement over time (distinct from get_futures_movement,
 * which tracks expert PICK sentiment, not odds).
 *
 * 2026-07-22 fix (Codex review): this previously took history[0]/history[-1] —
 * whichever row happened to be chronologically first/last across ALL books
 * mixed together, which could compare two different books' quotes as if they
 * were one continuous line and could include non-placeable books (FanDuel/
 * DraftKings) the Creator can't actually bet at. Now computes: best PLACEABLE
 * price at the earliest and latest snapshot times, a same-book movement list
 * per book, and a consensus (median-across-books) movement figure — plus the
 * old single best-vs-best comparison, kept as the headline read.
 */
async function toolGetFuturesOddsMovement({ team, market_type, days = 30, season } = {}) {
  if (!team || !market_type) {
    return { status: 'invalid', message: 'team and market_type are required.' };
  }

  const teamData = getTeam(team);
  const fullName = teamData?.fullName || team;
  const yr = season || new Date().getFullYear();

  let history = [];
  try { history = await getFuturesOddsHistory(fullName, market_type, days, yr); } catch (_) { history = []; }

  if (!history.length) {
    return {
      status: 'no_data',
      team: fullName,
      market_type,
      message: 'No odds snapshots on file for this team/market in the look-back window.',
    };
  }

  const toImpliedProb = (american) => american == null ? null
    : (american > 0 ? 100 / (american + 100) : Math.abs(american) / (Math.abs(american) + 100));
  const fmtOdds = (o) => o == null ? 'n/a' : (o > 0 ? `+${o}` : String(o));
  const median = (xs) => { const s = [...xs].sort((a, b) => a - b); if (!s.length) return null; const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

  const placeableRows = history.filter(h => PLACEABLE_BOOKS.has((h.book || '').toLowerCase()));
  const pool = placeableRows.length ? placeableRows : history; // fall back to all books rather than returning nothing if none happen to be tagged placeable
  const usedFallback = !placeableRows.length;

  const times = [...new Set(pool.map(h => h.snapshot_time))].sort();
  const earliestTime = times[0], latestTime = times[times.length - 1];
  const bestAt = (time) => pool.filter(h => h.snapshot_time === time)
    .reduce((best, h) => (best == null || h.odds > best.odds ? h : best), null); // higher american odds = better payout for the bettor
  const opening = bestAt(earliestTime);
  const current = bestAt(latestTime);
  const openProb = toImpliedProb(opening?.odds);
  const curProb = toImpliedProb(current?.odds);

  // per-book movement: each book's own first vs. last snapshot in the window
  const byBook = {};
  for (const h of pool) (byBook[h.book] ??= []).push(h);
  const perBookMovement = Object.entries(byBook).map(([book, rows]) => {
    const sorted = [...rows].sort((a, b) => new Date(a.snapshot_time) - new Date(b.snapshot_time));
    const first = sorted[0], last = sorted[sorted.length - 1];
    return { book, opening_odds: fmtOdds(first.odds), current_odds: fmtOdds(last.odds), snapshots: sorted.length };
  });

  // consensus movement: median implied prob across all books at the earliest vs. latest snapshot round
  const consensusOpenProb = median(pool.filter(h => h.snapshot_time === earliestTime).map(h => toImpliedProb(h.odds)).filter(p => p != null));
  const consensusCurProb = median(pool.filter(h => h.snapshot_time === latestTime).map(h => toImpliedProb(h.odds)).filter(p => p != null));

  return {
    status: 'ok',
    team: fullName,
    market_type,
    days,
    season: yr,
    snapshot_count: history.length,
    placeable_books_only: !usedFallback,
    opening: { date: opening?.snapshot_time, odds: fmtOdds(opening?.odds), book: opening?.book },
    current: { date: current?.snapshot_time, odds: fmtOdds(current?.odds), book: current?.book },
    direction: (opening?.odds === current?.odds) ? 'flat'
      : (curProb > openProb ? 'shortening (more likely)' : 'lengthening (less likely)'),
    best_price_movement_pts: (openProb != null && curProb != null) ? +((curProb - openProb) * 100).toFixed(1) : null,
    consensus_movement_pts: (consensusOpenProb != null && consensusCurProb != null) ? +((consensusCurProb - consensusOpenProb) * 100).toFixed(1) : null,
    per_book_movement: perBookMovement,
    timeline: history.map(h => ({ date: h.snapshot_time, odds: fmtOdds(h.odds), book: h.book })),
  };
}

/**
 * get_normalized_signals
 * Cleaned, directional cross-source signals (public-read policy added
 * migration 041 — RLS is no longer the reason this could come back empty).
 */
async function toolGetNormalizedSignals({ team, market, direction, limit = 30 } = {}) {
  let rows = [];
  try { rows = await getNormalizedSignals({ team, market, direction, limit }); } catch (_) { rows = []; }

  if (!rows.length) {
    return {
      status: 'no_data',
      message: 'No normalized signals matched this query. This table is publicly readable (migration 041) — an empty result here means no signals exist for the given filters, not an access issue.',
    };
  }

  return {
    status: 'ok',
    count: rows.length,
    signals: rows.map(r => ({
      team: r.team,
      market: r.market,
      direction: r.direction,
      strength: r.strength,
      rationale: r.rationale,
      source: r.source_type,
      author: r.author,
      model: r.model,
      as_of: r.created_at,
    })),
  };
}

/**
 * get_podcast_host_summaries
 * Per-host structured future extraction (prediction/lean/confidence/stats_cited/quote).
 * Filters client-side against the futures jsonb array since Supabase-js can't
 * filter jsonb array elements natively.
 */
async function toolGetPodcastHostSummaries({ host, team, limit = 40 } = {}) {
  let rows = [];
  try { rows = await getPodcastHostSummaries({ host, limit }); } catch (_) { rows = []; }

  if (!rows.length) {
    return { status: 'no_data', message: 'No host summaries on file yet.' };
  }

  const teamQuery = team ? String(team).toLowerCase() : null;
  const results = [];
  for (const row of rows) {
    const futures = Array.isArray(row.futures) ? row.futures : [];
    for (const f of futures) {
      if (teamQuery) {
        const subj = String(f.subject || '').toLowerCase();
        const subjMarket = String(f.subject_market || '').toLowerCase();
        if (!subj.includes(teamQuery) && !subjMarket.includes(teamQuery)) continue;
      }
      results.push({
        host: row.host,
        episode_id: row.episode_id,
        subject_market: f.subject_market,
        subject: f.subject,
        prediction: f.prediction,
        lean: f.lean,
        confidence: f.confidence,
        stats_cited: f.stats_cited,
        quote: f.quote,
      });
    }
  }

  if (!results.length) {
    return {
      status: 'no_data',
      message: team ? `No futures mentioning "${team}" in the scanned window.` : 'No futures found in the scanned window.',
    };
  }

  return { status: 'ok', count: results.length, futures: results.slice(0, 50) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// S296 track 2 — rest/travel, referee tendencies, roster churn, CLV.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * get_game_context
 * Rest days, division-game flag, venue, referee, closing lines for a team's games.
 */
async function toolGetGameContext({ team, week, season } = {}) {
  const abbr = team ? getTeamAbbreviation(team) : null;
  if (team && !abbr) return { status: 'invalid', message: `Unrecognized team "${team}".` };

  let rows = [];
  try { rows = await getGameContext({ season, week, team: abbr, limit: 10 }); } catch (_) { rows = []; }

  if (!rows.length) {
    return {
      status: 'no_data',
      message: 'No game context on file. Columns exist (migration 039) but scripts/seed-game-context.py may not have been run for this season/week yet.',
    };
  }

  const shape = (r) => ({
    game_id: r.game_id,
    matchup: `${r.away_abbrev} @ ${r.home_abbrev}`,
    week: r.week,
    kickoff: r.kickoff_utc,
    rest: {
      away_days: r.away_rest,
      home_days: r.home_rest,
      rest_edge_days: (r.home_rest != null && r.away_rest != null) ? r.home_rest - r.away_rest : null,
    },
    div_game: r.div_game,
    venue: { roof: r.roof, surface: r.surface },
    referee: r.referee,
    closing_lines: {
      spread: r.closing_spread_line,
      total: r.closing_total_line,
      home_moneyline: r.closing_home_moneyline,
      away_moneyline: r.closing_away_moneyline,
    },
  });

  return { status: 'ok', count: rows.length, games: rows.map(shape) };
}

/**
 * get_referee_tendencies
 * Historical total-friendliness / penalty rate for a referee.
 */
async function toolGetRefereeTendencies({ referee } = {}) {
  let rows = [];
  try { rows = await getRefereeTendencies({ referee }); } catch (_) { rows = []; }

  if (!rows.length) {
    return {
      status: 'no_data',
      message: referee
        ? `No tendency data for a referee matching "${referee}".`
        : 'No referee tendency data on file yet — run scripts/derive_referee_tendencies.py.',
    };
  }

  return {
    status: 'ok',
    count: rows.length,
    referees: rows.map(r => ({
      referee: r.referee,
      games_officiated: r.games_officiated,
      seasons: r.seasons,
      avg_total_points: r.avg_total_points,
      avg_total_penalties: r.avg_total_penalties,
      avg_penalty_yards: r.avg_penalty_yards,
      home_win_pct: r.home_win_pct,
      sample_confidence: r.games_officiated >= 30 ? 'moderate' : 'low — small sample, weigh accordingly',
    })),
  };
}

/**
 * get_roster_churn
 * Week-over-week roster diff (adds/drops/status changes) for a team.
 */
async function toolGetRosterChurn({ team, weeks_back = 2 } = {}) {
  if (!team) return { status: 'invalid', message: 'team is required.' };
  const abbr = getTeamAbbreviation(team);
  if (!abbr) return { status: 'invalid', message: `Unrecognized team "${team}".` };

  let rows = [];
  try { rows = await getRosterHistory({ team: abbr, weeksBack: weeks_back }); } catch (_) { rows = []; }

  if (!rows.length) {
    return { status: 'no_data', team: abbr, message: 'No roster history on file for this team yet.' };
  }

  const snapshots = new Map();
  for (const r of rows) {
    const key = `${r.season}-${r.week}`;
    if (!snapshots.has(key)) snapshots.set(key, { season: r.season, week: r.week, players: new Map() });
    snapshots.get(key).players.set(r.gsis_id || r.full_name, r);
  }
  const ordered = [...snapshots.values()].sort((a, b) => (b.season - a.season) || (b.week - a.week));

  if (ordered.length < 2) {
    return {
      status: 'no_data',
      team: abbr,
      message: `Only one roster snapshot on file (season ${ordered[0]?.season} week ${ordered[0]?.week}) — churn needs at least two.`,
    };
  }

  const [current, prior] = ordered;
  const adds = [];
  const drops = [];
  const statusChanges = [];

  for (const [key, player] of current.players) {
    if (!prior.players.has(key)) {
      adds.push({ name: player.full_name, position: player.position, status: player.status });
    } else {
      const priorPlayer = prior.players.get(key);
      if (priorPlayer.status !== player.status) {
        statusChanges.push({ name: player.full_name, position: player.position, from: priorPlayer.status, to: player.status });
      }
    }
  }
  for (const [key, player] of prior.players) {
    if (!current.players.has(key)) {
      drops.push({ name: player.full_name, position: player.position, last_status: player.status });
    }
  }

  return {
    status: 'ok',
    team: abbr,
    compared: {
      current: { season: current.season, week: current.week },
      prior: { season: prior.season, week: prior.week },
    },
    adds_count: adds.length,
    drops_count: drops.length,
    status_change_count: statusChanges.length,
    adds,
    drops,
    status_changes: statusChanges,
  };
}

/**
 * get_clv_analysis
 * Compares this app's earliest-tracked odds against nflverse's true closing
 * line, plus betting-splits divergence over the week if available.
 */
async function toolGetClvAnalysis({ team, week, season } = {}) {
  if (!team || !week) return { status: 'invalid', message: 'team and week are required.' };
  const abbr = getTeamAbbreviation(team);
  if (!abbr) return { status: 'invalid', message: `Unrecognized team "${team}".` };
  const yr = season || new Date().getFullYear();

  let contextRows = [];
  try { contextRows = await getGameContext({ season: yr, week, team: abbr, limit: 5 }); } catch (_) { contextRows = []; }
  const context = contextRows[0];

  if (!context || context.closing_spread_line == null) {
    return {
      status: 'no_data',
      team: abbr,
      week,
      message: 'No closing-line context on file for this game yet (needs scripts/seed-game-context.py to have run for this week).',
    };
  }

  let oddsRows = [];
  try { oddsRows = await getGameOddsForWeek(week, yr); } catch (_) { oddsRows = []; }
  const gameOdds = oddsRows.filter(r => {
    const h = getTeamAbbreviation(r.home_team);
    const a = getTeamAbbreviation(r.away_team);
    return h === context.home_abbrev && a === context.away_abbrev;
  });

  let splitsRows = [];
  try { splitsRows = await getGameSplitsHistory({ season: yr, week }); } catch (_) { splitsRows = []; }
  const gameSplits = splitsRows.filter(r => {
    const h = getTeamAbbreviation(r.home_team);
    const a = getTeamAbbreviation(r.away_team);
    return h === context.home_abbrev && a === context.away_abbrev;
  });

  const spreadRows = gameOdds
    .filter(r => r.market === 'spread' && r.spread != null)
    .sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at));
  const totalRows = gameOdds
    .filter(r => r.market === 'total' && r.total != null)
    .sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at));

  const trackedOpenSpread = spreadRows[0]?.spread ?? null;
  const trackedOpenTotal = totalRows[0]?.total ?? null;

  const result = {
    status: 'ok',
    team: abbr,
    matchup: `${context.away_abbrev} @ ${context.home_abbrev}`,
    week,
    season: yr,
    spread: {
      tracked_open: trackedOpenSpread,
      closing: context.closing_spread_line,
      movement: (trackedOpenSpread != null) ? +(context.closing_spread_line - trackedOpenSpread).toFixed(1) : null,
    },
    total: {
      tracked_open: trackedOpenTotal,
      closing: context.closing_total_line,
      movement: (trackedOpenTotal != null) ? +(context.closing_total_line - trackedOpenTotal).toFixed(1) : null,
    },
    note: spreadRows.length
      ? 'tracked_open is this app\'s earliest tracked snapshot for this game, not necessarily the true market open.'
      : 'No tracked odds snapshots on file for this game — only the true closing line is available.',
  };

  if (gameSplits.length) {
    const latest = gameSplits[gameSplits.length - 1];
    result.betting_splits = {
      as_of: latest.captured_at,
      spread_home_bettors_pct: latest.spread_home_bettors,
      spread_home_money_pct: latest.spread_home_money,
      sharp_divergence: (latest.spread_home_money != null && latest.spread_home_bettors != null)
        ? latest.spread_home_money - latest.spread_home_bettors
        : null,
    };
  }

  return result;
}
