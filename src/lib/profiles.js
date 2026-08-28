// src/lib/profiles.js
// ═══════════════════════════════════════════════════════════════════════════════
// Shared preset-profile definitions + storage key + usage priorities.
//
// Source of truth for:
//   1. Owner/Admin profiles (master, amanda, andy)
//   2. Alpha tester profiles (curated tester personas + league presets)
//   3. Fantasy roster & league bindings
//   4. Usage priority configurations (dashboard focus & priority widgets)
//   5. Navigation hub gating & feature flag permission enforcement
// ═══════════════════════════════════════════════════════════════════════════════

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
  // ─── Persona 1: Brian (Waiver & Injury Specialist) ──────────────────────────
  {
    id: 'alpha_brian',
    name: 'Brian (Dolphin Boobiez)',
    displayLabel: 'Brian (Waiver & Injuries)',
    realName: 'Brian',
    nickname: 'Dolphin Boobiez',
    email: 'brian@example.test',
    description: 'High-stakes waiver grinder focused on real-time injury recovery, SIC scores, and depth chart trends.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'waiver_and_injuries',
    defaultHub: 'injuries',
    fantasyLeagues: ['honey_badgers'],
    fantasyTeamBindings: [
      { leagueId: 'honey_badgers', teamId: '3', teamName: 'Dolphin Boobiez' },
    ],
    favoriteTeams: ['MIA', 'BUF'],
    draftSlots: { honey_badgers: 3 },
    keeperLocks: { honey_badgers: ['CeeDee Lamb', 'Kyren Williams'] },
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

  // ─── Persona 2: Dave (Dynasty & Draft Architect) ────────────────────────────
  {
    id: 'alpha_dave',
    name: 'Dave (Olivators)',
    displayLabel: 'Dave (Dynasty & Draft)',
    realName: 'Dave',
    nickname: 'Olivators',
    email: 'dave@example.test',
    description: 'Dynasty architect focused on rookie draft boards, ADP surplus value, and multi-year keeper planning.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'dynasty_and_draft',
    defaultHub: 'fantasy',
    fantasyLeagues: ['honey_badgers', 'rfi_invitational'],
    fantasyTeamBindings: [
      { leagueId: 'honey_badgers', teamId: '1', teamName: 'Olivators' },
      { leagueId: 'rfi_invitational', teamId: '1', teamName: 'Tremendous Slouch' },
    ],
    favoriteTeams: ['DET', 'GB'],
    draftSlots: { honey_badgers: 1, rfi_invitational: 4 },
    keeperLocks: {
      honey_badgers: ['Bijan Robinson', 'Amon-Ra St. Brown'],
      rfi_invitational: ['Justin Jefferson'],
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

  // ─── Persona 3: Marcus (Props & Matchup Bettor) ─────────────────────────────
  {
    id: 'alpha_marcus',
    name: 'Marcus (Sir Nix A Lot)',
    displayLabel: 'Marcus (Props & Odds)',
    realName: 'Marcus',
    nickname: 'Sir Nix A Lot',
    email: 'marcus@example.test',
    description: 'Weekly props and sides bettor analyzing closing line value (CLV), matchup odds, and passing props.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'props_and_odds',
    defaultHub: 'odds',
    fantasyLeagues: ['rose_bowl', 'rfi_invitational'],
    fantasyTeamBindings: [
      { leagueId: 'rose_bowl', teamId: '6', teamName: 'Sir Nix A Lot' },
      { leagueId: 'rfi_invitational', teamId: '4', teamName: 'Doug Exeter' },
    ],
    favoriteTeams: ['DEN', 'KC'],
    draftSlots: { rose_bowl: 6, rfi_invitational: 9 },
    keeperLocks: { rfi_invitational: ['Breece Hall'] },
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

  // ─── Persona 4: Sarah (Start/Sit & Lineup Optimizer) ────────────────────────
  {
    id: 'alpha_sarah',
    name: 'Sarah (Any Given Sun God)',
    displayLabel: 'Sarah (Start/Sit)',
    realName: 'Sarah',
    nickname: 'Any Given Sun God',
    email: 'sarah@example.test',
    description: 'Sunday morning manager prioritizing red-zone touch projections, weather warnings, and start/sit tiers.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'start_sit_optimizer',
    defaultHub: 'dashboard',
    fantasyLeagues: ['rose_bowl', 'honey_badgers'],
    fantasyTeamBindings: [
      { leagueId: 'rose_bowl', teamId: '2', teamName: 'Any Given Sun God' },
      { leagueId: 'honey_badgers', teamId: '11', teamName: 'The Trophy Wives' },
    ],
    favoriteTeams: ['DET', 'LAR'],
    draftSlots: { rose_bowl: 2, honey_badgers: 11 },
    keeperLocks: {
      honey_badgers: ['Amon-Ra St. Brown', 'Jahmyr Gibbs'],
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

  // ─── Persona 5: Alex (Multi-League Power Contender) ─────────────────────────
  {
    id: 'alpha_alex',
    name: 'Alex (Fat Lazy Americans)',
    displayLabel: 'Alex (Multi-League Power)',
    realName: 'Alex',
    nickname: 'Fat Lazy Americans',
    email: 'alex@example.test',
    description: 'Cross-league power manager tracking shared player exposure and competing across all 4 dashboard leagues.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'multi_league_matrix',
    defaultHub: 'fantasy',
    fantasyLeagues: ['the_league', 'honey_badgers', 'rfi_invitational', 'rose_bowl'],
    fantasyTeamBindings: [
      { leagueId: 'the_league', teamId: 'fla', teamName: 'Fat Lazy Americans' },
      { leagueId: 'honey_badgers', teamId: '4', teamName: 'Fat Lazy Americans' },
      { leagueId: 'rfi_invitational', teamId: '5', teamName: 'Fat Lazy Americans' },
      { leagueId: 'rose_bowl', teamId: '1', teamName: 'Fat Lazy Americans' },
    ],
    favoriteTeams: ['CIN', 'CHI'],
    draftSlots: { the_league: 12, honey_badgers: 4, rfi_invitational: 5, rose_bowl: 1 },
    keeperLocks: {
      the_league: ['Joe Burrow', 'Jaxon Smith-Njigba'],
      honey_badgers: ['Brock Bowers', 'Caleb Williams'],
      rfi_invitational: ['Joe Burrow'],
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

  // ─── Canonical League Preset Fallbacks ──────────────────────────────────────
  {
    id: 'alpha_the_league',
    name: 'The League Alpha Tester',
    displayLabel: 'The League',
    realName: 'The League tester',
    nickname: 'The League',
    email: '',
    description: 'Alpha tester profile for The League fantasy packet and NFL dashboard review.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'dynasty_and_draft',
    defaultHub: 'fantasy',
    fantasyLeagues: ['the_league'],
    fantasyTeamBindings: [{ leagueId: 'the_league', teamId: 'fla', teamName: 'Fat Lazy Americans' }],
    favoriteTeams: [],
    draftSlots: { the_league: 12 },
    keeperLocks: { the_league: ['Joe Burrow', 'Jaxon Smith-Njigba'] },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: ['dashboard', 'official-picks', 'intel-hub', 'futures-report', 'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking'],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },
  {
    id: 'alpha_honey_badgers',
    name: 'Honey Badgers Alpha Tester',
    displayLabel: 'Honey Badgers',
    realName: 'Honey Badgers tester',
    nickname: 'Honey Badgers',
    email: '',
    description: 'Alpha tester profile for Honey Badgers fantasy packet and NFL dashboard review.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'waiver_and_injuries',
    defaultHub: 'injuries',
    fantasyLeagues: ['honey_badgers'],
    fantasyTeamBindings: [{ leagueId: 'honey_badgers', teamId: 'fla', teamName: 'Fat Lazy Americans' }],
    favoriteTeams: [],
    draftSlots: { honey_badgers: 5 },
    keeperLocks: { honey_badgers: ['Brock Bowers', 'Caleb Williams'] },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: ['dashboard', 'official-picks', 'intel-hub', 'futures-report', 'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking'],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },
  {
    id: 'alpha_rfi_invitational',
    name: 'RFI Invitational Alpha Tester',
    displayLabel: 'RFI Invitational',
    realName: 'RFI Invitational tester',
    nickname: 'RFI',
    email: '',
    description: 'Alpha tester profile for RFI Invitational fantasy packet and NFL dashboard review.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'start_sit_optimizer',
    defaultHub: 'dashboard',
    fantasyLeagues: ['rfi_invitational'],
    fantasyTeamBindings: [{ leagueId: 'rfi_invitational', teamId: 'fla', teamName: 'Fat Lazy Americans' }],
    favoriteTeams: [],
    draftSlots: { rfi_invitational: null },
    keeperLocks: { rfi_invitational: ['Joe Burrow'] },
    hubs: ALPHA_VISIBLE_HUBS,
    agents: [],
    allowedFeatures: ['dashboard', 'official-picks', 'intel-hub', 'futures-report', 'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking'],
    blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
    canUseAI: false,
    canStoreApiKeys: false,
    ownerPortfolioAccess: false,
  },
  {
    id: 'alpha_rose_bowl',
    name: 'Rose Bowl Alpha Tester',
    displayLabel: 'Rose Bowl',
    realName: 'Rose Bowl tester',
    nickname: 'Rose Bowl',
    email: '',
    description: 'Alpha tester profile for Rose Bowl fantasy packet and NFL dashboard review.',
    role: 'tester',
    alphaRole: 'tester',
    profileMode: PROFILE_MODES.ALPHA,
    usagePriority: 'props_and_odds',
    defaultHub: 'odds',
    fantasyLeagues: ['rose_bowl'],
    fantasyTeamBindings: [{ leagueId: 'rose_bowl', teamId: 'fla', teamName: 'Fat Lazy Americans' }],
    favoriteTeams: [],
    draftSlots: { rose_bowl: null },
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
