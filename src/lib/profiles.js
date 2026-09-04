// src/lib/profiles.js
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Shared preset-profile definitions + storage key + usage priorities.
//
// Source of truth for:
//   1. Owner/Admin profiles (master, amanda, andy)
//   2. Real Alpha tester team profiles:
//      - amanda_rose (Olivators, Wailin Raylans, Jukin Junies)
//      - patrick_fagan (LV Rosekillers)
//      - matt_post (Postino'\''s Banditos, Concussion Protocol)
//      - matt_policare (JRZ, Rafi Bomb Returns!)
//      - alejandro (Jesus Take the Wheel, Panda XL)
//      - tyler_bradford (no fantasy league affiliation, full-spectrum bettor)
//      + Fallback league presets (the_league, honey_badgers, rfi_invitational, rose_bowl)
//   3. Fantasy roster & league bindings
//   4. Usage priority configurations (dashboard focus & priority widgets)
//   5. Navigation hub gating & feature flag permission enforcement
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const PROFILE_KEY = 'nfl_user_profile_v1';

export const PROFILE_MODES = {
  OWNER: 'owner',
  ALPHA: 'alpha',
};

export const ALPHA_FANTASY_LEAGUE_IDS = [
  'the_league',
  'honey_badgers',
  'rfi_invitational',
  'rose_bowl',
];

export const OWNER_PROFILE_IDS = ['master', 'amanda', 'andy'];

export const USAGE_PRIORITIES = {
  WAIVER_AND_INJURIES: {
    id: 'waiver_and_injuries',
    label: 'Waiver & Injury Specialist',
    description: 'Prioritizes live practice reports, SIC score deltas, inactive alerts, and waiver target efficiency.',
    defaultHub: 'injuries',
    priorityWidgets: ['injury-wire', 'sic-score-trends', 'waiver-targets', 'target-share-deltas'],
    recommendedAlerts: ['injury_status_change', 'practice_participation', 'late_game_inactives'],
  },
  DYNASTY_AND_DRAFT: {
    id: 'dynasty_and_draft',
    label: 'Dynasty & Draft Architect',
    description: 'Prioritizes draft board kits, rookie athletic profiles, ADP value trajectories, and long-term depth charts.',
    defaultHub: 'fantasy',
    priorityWidgets: ['draft-cheat-sheet', 'adp-trend-tracker', 'rookie-tiers', 'keeper-value-matrix'],
    recommendedAlerts: ['adp_surge_drop', 'roster_cutdown_move', 'depth_chart_climb'],
  },
  PROPS_AND_ODDS: {
    id: 'props_and_odds',
    label: 'Props & Matchup Bettor',
    description: 'Prioritizes player prop value lines, odds shopping, closing line value (CLV), and game script totals.',
    defaultHub: 'odds',
    priorityWidgets: ['prop-edge-finder', 'market-odds-board', 'official-picks-card', 'clv-tracker'],
    recommendedAlerts: ['prop_line_movement', 'steam_move_alert', 'key_number_cross'],
  },
  START_SIT_OPTIMIZER: {
    id: 'start_sit_optimizer',
    label: 'Start/Sit & Lineup Optimizer',
    description: 'Prioritizes head-to-head matchup difficulty, red-zone touch share, game script projections, and weather impacts.',
    defaultHub: 'dashboard',
    priorityWidgets: ['start-sit-comparator', 'red-zone-shares', 'matchup-grade-matrix', 'weather-wind-alerts'],
    recommendedAlerts: ['redzone_role_change', 'weather_wind_warning', 'projected_shootout'],
  },
  MULTI_LEAGUE_MATRIX: {
    id: 'multi_league_matrix',
    label: 'Multi-League Power Contender',
    description: 'Prioritizes cross-league portfolio exposure, conflicting player starts, and consolidated league standings.',
    defaultHub: 'fantasy',
    priorityWidgets: ['cross-league-roster-grid', 'player-exposure-portfolio', 'multi-league-matchup-tracker'],
    recommendedAlerts: ['cross_league_injury', 'shared_player_boom', 'waiver_priority_clash'],
  },
  GENERAL_SCOUTING: {
    id: 'general_scouting',
    label: 'General NFL & Fantasy Scouting',
    description: 'Balanced overview covering team command centers, weekly schedules, injury reports, and expert intel.',
    defaultHub: 'dashboard',
    priorityWidgets: ['command-center-summary', 'weekly-schedule-board', 'expert-intel-feed'],
    recommendedAlerts: ['breaking_news_roundup', 'weekly_best_bets'],
  },
};

const ALPHA_VISIBLE_HUBS = [
  'dashboard',
  'official-picks',
  'intel',
  'futures',
  'fantasy',
  'injuries',
  'odds',
  'analytics',
  'bankroll',
  'mycard',
  'picks',
  'survivor',
  'supercontest',
];

const OWNER_PRESET_PROFILES = [
  {
    id: 'master',
    name: 'Master View (Full Dashboard)',
    description: 'All 6 Command Hubs and all 7 specialized AI Agents active.',
    role: 'owner',
    profileMode: PROFILE_MODES.OWNER,
    hubs: ['dashboard', 'official-picks', 'intel', 'fantasy', 'injuries', 'futures'],
    agents: ['general', 'futures', 'props', 'fantasy', 'survivor', 'supercontest', 'confidence'],
    canUseAI: true,
    canStoreApiKeys: true,
    ownerPortfolioAccess: true,
  },
  {
    id: 'amanda',
    name: 'Amanda\'s Focus Profile',
    description: 'Simplified view focused on SuperContest, Survivor Pool, and Fantasy Rosters.',
    role: 'owner',
    profileMode: PROFILE_MODES.OWNER,
    hubs: ['official-picks', 'fantasy', 'injuries'],
    agents: ['supercontest', 'survivor', 'fantasy'],
    canUseAI: true,
    canStoreApiKeys: true,
    ownerPortfolioAccess: true,
  },
  {
    id: 'andy',
    name: 'Andy\'s Analytics Profile',
    description: 'Focused on Futures Portfolio, Matchup Odds, Sides & Totals, and Player Props.',
    role: 'owner',
    profileMode: PROFILE_MODES.OWNER,
    hubs: ['dashboard', 'official-picks', 'intel', 'futures'],
    agents: ['general', 'futures', 'props'],
    canUseAI: true,
    canStoreApiKeys: true,
    ownerPortfolioAccess: true,
  },
];

const ALPHA_PRESET_PROFILES = [
  // â”€â”€â”€ Alpha Tester 1: Amanda Rose â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Teams: Olivators (Honey Badgers), Wailin Raylans (The League), Jukin Junies (Rose Bowl)
  // Workflow: Sunday morning lineup setting, waiver wire hunting, injury monitoring
  // Favorite Team: Buffalo Bills (BUF)
  // Betting: SuperContest, occasional player props
  {
    id: 'amanda_rose',
    name: 'Amanda Rose',
    displayLabel: 'Amanda Rose (Olivators / Wailin Raylans)',
    realName: 'Amanda Rose',
    nickname: 'Olivators',
    email: 'amanda@example.test',
    description: 'Sunday morning lineup setter and waiver wire specialist monitoring injury recovery and competing in SuperContest.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'start_sit_optimizer',
    defaultHub: 'dashboard',
    priorityWidgets: ['start-sit-comparator', 'injury-wire', 'waiver-targets', 'supercontest-card'],
    bettingInterests: ['supercontest', 'player_props'],
    fantasyLeagues: ['honey_badgers', 'the_league', 'rose_bowl'],
    fantasyTeamBindings: [
      { leagueId: 'honey_badgers', teamId: '1', teamName: 'Olivators' },
      { leagueId: 'the_league', teamId: 'wailin_raylans', teamName: 'Wailin Raylans' },
      { leagueId: 'rose_bowl', teamId: '7', teamName: 'Jukin Junies' },
    ],
    favoriteTeams: ['BUF'],
    draftSlots: { the_league: 6, honey_badgers: 7, rose_bowl: 8 },
    keeperIntentions: 'undeclared',
    keeperLocks: {
      honey_badgers: [],
      the_league: [],
      rose_bowl: [],
    },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: [
      'dashboard', 'official-picks', 'intel-hub', 'futures-report',
      'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking',
    ],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },

  // â”€â”€â”€ Alpha Tester 2: Patrick Fagan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Teams: LV Rosekillers (Rose Bowl)
  // Workflow: Weekly matchup scouting, player props, spreads/totals, occasional futures
  // Favorite Team: Undetermined
  // Betting: Game spreads/totals, player props, Survivor / SuperContest pools
  {
    id: 'patrick_fagan',
    name: 'Patrick Fagan',
    displayLabel: 'Patrick Fagan (LV Rosekillers)',
    realName: 'Patrick Fagan',
    nickname: 'LV Rosekillers',
    email: 'patrick@example.test',
    description: 'Weekly matchup scout and props/sides bettor tracking closing lines, Survivor pools, SuperContest, and season futures.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'props_and_odds',
    defaultHub: 'odds',
    priorityWidgets: ['market-odds-board', 'prop-edge-finder', 'supercontest-card', 'survivor-matrix', 'futures-board'],
    bettingInterests: ['game_spreads', 'game_totals', 'player_props', 'survivor', 'supercontest', 'futures'],
    fantasyLeagues: ['rose_bowl'],
    fantasyTeamBindings: [
      { leagueId: 'rose_bowl', teamId: '8', teamName: 'L.V. Rosekillers' },
    ],
    favoriteTeams: [],
    draftSlots: { rose_bowl: 7 },
    keeperIntentions: 'undeclared',
    keeperLocks: { rose_bowl: [] },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: [
      'dashboard', 'official-picks', 'intel-hub', 'futures-report',
      'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking',
    ],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },

  // â”€â”€â”€ Alpha Tester 3: Matt Post â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Teams: Postino's Banditos (The League), Concussion Protocol (Rose Bowl)
  // Workflow: Dynasty draft strategist (deep scouting, rookie ADP, contract value), weekly matchup grinder, pick'em / Survivor
  // Favorite Team: Las Vegas Raiders (LV)
  // Keeper: Undeclared
  {
    id: 'matt_post',
    name: 'Matt Post',
    displayLabel: 'Matt Post (Postino\'s Banditos)',
    realName: 'Matt Post',
    nickname: 'Postino\'s Banditos',
    email: 'post@example.test',
    description: 'Dynasty draft architect analyzing rookie athletic tiers, contract cliffs, ADP surplus, weekly matchup grinding, and Survivor.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'dynasty_and_draft',
    defaultHub: 'fantasy',
    priorityWidgets: ['draft-cheat-sheet', 'rookie-tiers', 'adp-trend-tracker', 'matchup-grade-matrix', 'survivor-matrix'],
    bettingInterests: ['pickem', 'survivor'],
    fantasyLeagues: ['the_league', 'rose_bowl'],
    fantasyTeamBindings: [
      { leagueId: 'the_league', teamId: 'postinos_banditos', teamName: 'Postino\'s Banditos' },
      { leagueId: 'rose_bowl', teamId: '5', teamName: 'Concussion Protocol' },
    ],
    favoriteTeams: ['LV'],
    draftSlots: { the_league: 11, rose_bowl: 2 },
    keeperIntentions: 'undeclared',
    keeperLocks: {
      the_league: [],
      rose_bowl: [],
    },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: [
      'dashboard', 'official-picks', 'intel-hub', 'futures-report',
      'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking',
    ],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },

  // â”€â”€â”€ Alpha Tester 4: Matt Policare â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Teams: JRZ (Honey Badgers), Rafi Bomb Returns! (The League)
  // Workflow: Active waiver wire / injury tracker, draft value hunter, weekly sides/totals bettor, pickem / Survivor / SuperContest
  // Favorite Team: Undetermined
  // Keeper: Undeclared
  {
    id: 'matt_policare',
    name: 'Matt Policare',
    displayLabel: 'Matt Policare (JRZ / Rafi Bomb)',
    realName: 'Matt Policare',
    nickname: 'JRZ',
    email: 'policare@example.test',
    description: 'Active waiver wire and injury recovery tracker, draft value hunter, sides/totals bettor, and Survivor/SuperContest player.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'waiver_and_injuries',
    defaultHub: 'injuries',
    priorityWidgets: ['injury-wire', 'sic-score-trends', 'waiver-targets', 'market-odds-board', 'supercontest-card', 'survivor-matrix'],
    bettingInterests: ['game_spreads', 'game_totals', 'pickem', 'survivor', 'supercontest'],
    fantasyLeagues: ['the_league', 'honey_badgers'],
    fantasyTeamBindings: [
      { leagueId: 'honey_badgers', teamId: '6', teamName: 'JRZ' },
      { leagueId: 'the_league', teamId: 'rafi_bomb_returns', teamName: 'Rafi Bomb Returns!' },
    ],
    favoriteTeams: [],
    draftSlots: { the_league: 2, honey_badgers: 8 },
    keeperIntentions: 'undeclared',
    keeperLocks: {
      the_league: [],
      honey_badgers: [],
    },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: [
      'dashboard', 'official-picks', 'intel-hub', 'futures-report',
      'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking',
    ],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },

  // â”€â”€â”€ Alpha Tester 5: Alejandro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Teams: Jesus Take the Wheel (Honey Badgers), Panda XL (Rose Bowl)
  // Workflow: Props specialist (passing yards, rushing/receiving overs, anytime TDs, parlay prop stacks) & fantasy
  // Favorite Teams: Tampa Bay Buccaneers (TB), Los Angeles Rams (LAR)
  // Keeper: Undeclared
  {
    id: 'alejandro',
    name: 'Alejandro',
    displayLabel: 'Alejandro (Jesus Take the Wheel / Panda XL)',
    realName: 'Alejandro',
    nickname: 'Jesus Take the Wheel',
    email: 'alejandro@example.test',
    description: 'Player props and same-game parlay specialist focusing on passing yards, rushing/receiving overs, anytime TDs, and fantasy matchups.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'props_and_odds',
    defaultHub: 'odds',
    priorityWidgets: ['prop-edge-finder', 'anytime-td-matrix', 'same-game-parlay-builder', 'target-share-deltas'],
    bettingInterests: ['passing_props', 'rushing_overs', 'receiving_overs', 'anytime_td', 'parlay_stacks'],
    fantasyLeagues: ['honey_badgers', 'rose_bowl'],
    fantasyTeamBindings: [
      { leagueId: 'honey_badgers', teamId: '5', teamName: 'Jesus Take the Wheel' },
      { leagueId: 'rose_bowl', teamId: '10', teamName: 'Panda XL' },
    ],
    favoriteTeams: ['TB', 'LAR'],
    draftSlots: { honey_badgers: 4, rose_bowl: 11 },
    keeperIntentions: 'undeclared',
    keeperLocks: {
      honey_badgers: [],
      rose_bowl: [],
    },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: [
      'dashboard', 'official-picks', 'intel-hub', 'futures-report',
      'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking',
    ],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },

  // --- Alpha Tester 6: Tyler Bradford -------------------------------------
  // No fantasy league affiliation. Full-spectrum bettor across every contest/bet type.
  // Workflow: broad -- start/sit, waiver, injury tracking, dynasty scouting, props, spreads/totals
  //   all selected on intake despite no active fantasy roster; assigned the props/odds archetype
  //   (closest real-world fit, same shape as patrick_fagan) since every workflow area he flagged
  //   that ISN'T fantasy-dependent is betting/market-focused.
  // Favorite Team: undeclared
  {
    id: 'tyler_bradford',
    name: 'Tyler Bradford',
    displayLabel: 'Tyler Bradford',
    realName: 'Tyler Bradford',
    nickname: 'Tyler Bradford',
    email: 'Tyler@convoy-cap.com',
    description: "Full-spectrum sports bettor with no fantasy league affiliation -- tracks game spreads/totals, player props, SuperContest, Survivor, Pick'em, and season futures across the board.",
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'props_and_odds',
    defaultHub: 'odds',
    priorityWidgets: ['market-odds-board', 'prop-edge-finder', 'supercontest-card', 'survivor-matrix', 'futures-board'],
    bettingInterests: ['game_spreads', 'game_totals', 'player_props', 'survivor', 'supercontest', 'pickem', 'futures'],
    fantasyLeagues: [],
    fantasyTeamBindings: [],
    favoriteTeams: [],
    draftSlots: {},
    keeperIntentions: 'undeclared',
    keeperLocks: {},
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: [
      'dashboard', 'official-picks', 'intel-hub', 'futures-report',
      'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking',
    ],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },

  // â”€â”€â”€ Canonical League Preset Fallbacks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'the_league',
    name: 'The League Alpha Tester',
    displayLabel: 'The League Preset',
    realName: 'The League tester',
    nickname: 'The League',
    email: '',
    description: 'Alpha tester fallback profile for The League fantasy packet and NFL dashboard review.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'dynasty_and_draft',
    defaultHub: 'fantasy',
    priorityWidgets: ['draft-cheat-sheet', 'adp-trend-tracker', 'rookie-tiers'],
    bettingInterests: [],
    fantasyLeagues: ['the_league'],
    fantasyTeamBindings: [{ leagueId: 'the_league', teamId: 'fla', teamName: 'Fat Lazy Americans' }],
    favoriteTeams: [],
    draftSlots: { the_league: 12 },
    keeperIntentions: 'undeclared',
    keeperLocks: { the_league: [] },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: ['dashboard', 'official-picks', 'intel-hub', 'futures-report', 'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking'],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },
  {
    id: 'honey_badgers',
    name: 'Honey Badgers Alpha Tester',
    displayLabel: 'Honey Badgers Preset',
    realName: 'Honey Badgers tester',
    nickname: 'Honey Badgers',
    email: '',
    description: 'Alpha tester fallback profile for Honey Badgers fantasy packet and NFL dashboard review.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'waiver_and_injuries',
    defaultHub: 'injuries',
    priorityWidgets: ['injury-wire', 'sic-score-trends', 'waiver-targets'],
    bettingInterests: [],
    fantasyLeagues: ['honey_badgers'],
    fantasyTeamBindings: [{ leagueId: 'honey_badgers', teamId: 'fla', teamName: 'Fat Lazy Americans' }],
    favoriteTeams: [],
    draftSlots: { honey_badgers: 5 },
    keeperIntentions: 'undeclared',
    keeperLocks: { honey_badgers: [] },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: ['dashboard', 'official-picks', 'intel-hub', 'futures-report', 'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking'],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },
  {
    id: 'rfi_invitational',
    name: 'RFI Invitational Alpha Tester',
    displayLabel: 'RFI Invitational Preset',
    realName: 'RFI Invitational tester',
    nickname: 'RFI',
    email: '',
    description: 'Alpha tester fallback profile for RFI Invitational fantasy packet and NFL dashboard review.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'start_sit_optimizer',
    defaultHub: 'dashboard',
    priorityWidgets: ['start-sit-comparator', 'red-zone-shares', 'matchup-grade-matrix'],
    bettingInterests: [],
    fantasyLeagues: ['rfi_invitational'],
    fantasyTeamBindings: [{ leagueId: 'rfi_invitational', teamId: 'fla', teamName: 'Fat Lazy Americans' }],
    favoriteTeams: [],
    draftSlots: { rfi_invitational: null },
    keeperIntentions: 'undeclared',
    keeperLocks: { rfi_invitational: [] },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: ['dashboard', 'official-picks', 'intel-hub', 'futures-report', 'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking'],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },
  {
    id: 'rose_bowl',
    name: 'Rose Bowl Alpha Tester',
    displayLabel: 'Rose Bowl Preset',
    realName: 'Rose Bowl tester',
    nickname: 'Rose Bowl',
    email: '',
    description: 'Alpha tester fallback profile for Rose Bowl fantasy packet and NFL dashboard review.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'props_and_odds',
    defaultHub: 'odds',
    priorityWidgets: ['prop-edge-finder', 'market-odds-board', 'official-picks-card'],
    bettingInterests: [],
    fantasyLeagues: ['rose_bowl'],
    fantasyTeamBindings: [{ leagueId: 'rose_bowl', teamId: 'fla', teamName: 'Fat Lazy Americans' }],
    favoriteTeams: [],
    draftSlots: { rose_bowl: null },
    keeperIntentions: 'undeclared',
    keeperLocks: { rose_bowl: [] },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: ['dashboard', 'official-picks', 'intel-hub', 'futures-report', 'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking'],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },
];

export const ALPHA_PROFILE_IDS = ALPHA_PRESET_PROFILES.map((profile) => profile.id);

export const PRESET_PROFILES = [
  ...OWNER_PRESET_PROFILES,
  ...ALPHA_PRESET_PROFILES,
];

export const getPresetProfilesForMode = (mode = PROFILE_MODES.OWNER) => {
  if (mode === PROFILE_MODES.ALPHA) {
    return PRESET_PROFILES.filter((profile) => profile.profileMode === PROFILE_MODES.ALPHA);
  }
  return PRESET_PROFILES.filter((profile) => profile.profileMode !== PROFILE_MODES.ALPHA);
};

export const isAlphaTesterProfile = (profileOrId) => {
  const id = typeof profileOrId === 'string' ? profileOrId : profileOrId?.id;
  const profile = PRESET_PROFILES.find((entry) => entry.id === id);
  return profile?.profileMode === PROFILE_MODES.ALPHA && profile?.alphaRole === 'tester';
};

export const isOwnerProfile = (profileOrId) => {
  const id = typeof profileOrId === 'string' ? profileOrId : profileOrId?.id;
  return OWNER_PROFILE_IDS.includes(id);
};

export const getDefaultProfileForMode = (mode = PROFILE_MODES.OWNER) => {
  return getPresetProfilesForMode(mode)[0] || PRESET_PROFILES[0];
};

export const coerceProfileForMode = (profile, mode = PROFILE_MODES.OWNER) => {
  const catalog = getPresetProfilesForMode(mode);
  const match = catalog.find((entry) => entry.id === profile?.id);
  return match || catalog[0] || PRESET_PROFILES[0];
};

export const canProfileUseAI = (profile) => Boolean(profile?.canUseAI) && !isAlphaTesterProfile(profile);

export const canProfileStoreApiKeys = (profile) => {
  return Boolean(profile?.canStoreApiKeys) && !isAlphaTesterProfile(profile);
};

export const canProfileAccessOwnerPortfolio = (profile) => {
  return Boolean(profile?.ownerPortfolioAccess) && !isAlphaTesterProfile(profile);
};

export const getUsagePriorityConfig = (priorityId) => {
  return USAGE_PRIORITIES[priorityId?.toUpperCase()] || Object.values(USAGE_PRIORITIES).find((p) => p.id === priorityId) || USAGE_PRIORITIES.GENERAL_SCOUTING;
};
