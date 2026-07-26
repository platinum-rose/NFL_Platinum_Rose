// src/lib/apiConfig.js
// ═══════════════════════════════════════════════════════════════════════════════
// CENTRALIZED API CONFIGURATION — Single source of truth for all endpoints/keys
// ═══════════════════════════════════════════════════════════════════════════════

// --- Supabase (safe to bundle — public anon key) ---
export const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// --- Server-side proxy endpoints (paid keys stored as Supabase secrets) ---
// VITE_OPENAI_API_KEY, VITE_ANTHROPIC_API_KEY, VITE_ODDS_API_KEY are
// intentionally NOT read here — they must never appear in the browser bundle.
export const AI_PROXY_URL   = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/ai-proxy`
  : '';
export const ODDS_PROXY_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/odds-proxy`
  : '';

// Kept for backwards-compat imports in AgentChat / PropsAgentChat.
// Both components now use the proxy so these are always empty at runtime.
/** @deprecated Use AI_PROXY_URL — keys are server-side only. */
export const OPENAI_API_KEY    = '';
/** @deprecated Use AI_PROXY_URL — keys are server-side only. */
export const ANTHROPIC_API_KEY = '';
/** @deprecated Use ODDS_PROXY_URL — key is server-side only. */
export const ODDS_API_KEY      = '';

// --- TheOddsAPI ---
export const ODDS_API = {
  BASE_URL: 'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds',
  REGION: 'us',
  MARKETS: 'h2h,spreads,totals',
  BOOKMAKERS: 'draftkings,betonline,bookmaker,fanduel,mgm',
  CACHE_TTL_MS: 10 * 60 * 1000, // 10 minutes
};

// --- OpenAI ---
export const OPENAI_API = {
  BASE_URL: 'https://api.openai.com/v1/chat/completions',
  MODEL: 'gpt-4o',
};

// --- ESPN ---
export const ESPN_API = {
  INJURIES_URL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
};

// --- GitHub Raw (splits sync) ---
export const GITHUB_RAW = {
  SPLITS_URL: 'https://raw.githubusercontent.com/andrewlrose/NFL_Platinum_Rose/main/betting_splits.json',
};

// --- Local Data (public/ files — ALWAYS use relative paths, never hardcoded /) ---
export const LOCAL_DATA = {
  SCHEDULE: './schedule.json',
  WEEKLY_STATS: './weekly_stats.json',
  // S300/S301: local-only, human-reviewed YouTube/Gemini podcast intel summary.
  // Synced to public/ by scripts/build-youtube-futures-agent-intel-summary.js.
  // Read-only research context — never a production pick source.
  YOUTUBE_FUTURES_INTEL: './youtube-futures-agent-intel-summary.json',
};
// --- Supabase ---
export const SUPABASE = {
  URL: import.meta.env.VITE_SUPABASE_URL || '',
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  TABLES: {
    ODDS_SNAPSHOTS: 'odds_snapshots',
    LINE_MOVEMENTS:  'line_movements',
    GAME_RESULTS:    'game_results',
  },
};

// --- Anthropic ---
export const ANTHROPIC_API = {
  BASE_URL: 'https://api.anthropic.com/v1/messages',
  VERSION: '2023-06-01',
  // Model IDs per agents/manifests/betting.manifest.json
  MODEL_DEFAULT: 'claude-sonnet-4-5',
  MODEL_UPGRADE: 'claude-opus-4',
};
// --- M6 (podcast digest service on Tailscale) ---
// VITE_M6_BASE: tailnet host for private /digest/* pages (operator).
// VITE_M6_FUNNEL_BASE: public Funnel host for /share/* links (Phase 8).
//   Often the same value as BASE; kept as a separate key because their
//   reachability and trust differ.
export const M6 = {
  BASE: (import.meta.env.VITE_M6_BASE || '').replace(/\/$/, ''),
  FUNNEL_BASE: (
    import.meta.env.VITE_M6_FUNNEL_BASE ||
    import.meta.env.VITE_M6_BASE ||
    ''
  ).replace(/\/$/, ''),
};

// --- Official Picks local inbox/ledger server (F-29) ---
// Local-only Node server (scripts/official-pick-inbox-server.js), loopback
// bound, launched via `npm run official:picks:serve` or
// `Launch Platinum Rose Inbox.cmd`. Never assume it's running -- the tab
// must probe it and show an offline state if the fetch fails.
export const OFFICIAL_PICKS = {
  BASE: (import.meta.env.VITE_OFFICIAL_PICKS_BASE || 'http://127.0.0.1:8787').replace(/\/$/, ''),
};
