// src/lib/profiles.js
// ═══════════════════════════════════════════════════════════════════════════════
// Shared preset-profile definitions + storage key.
//
// Pulled out of ProfileSettingsModal.jsx (Phase 0, 2026-08-24) so App.jsx can
// read the active profile's `hubs` list without eagerly importing the modal
// itself (ProfileSettingsModal is lazy-loaded on first open). Keeping one
// source of truth here means the editor UI and the actual nav-filtering
// logic can never drift out of sync on preset ids/hub lists.
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
    fantasyLeagues: ['the_league'],
    fantasyTeamBindings: [{ leagueId: 'the_league', teamId: 'fla' }],
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
    fantasyLeagues: ['honey_badgers'],
    fantasyTeamBindings: [{ leagueId: 'honey_badgers', teamId: 'fla' }],
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
    fantasyLeagues: ['rfi_invitational'],
    fantasyTeamBindings: [{ leagueId: 'rfi_invitational', teamId: 'fla' }],
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
    fantasyLeagues: ['rose_bowl'],
    fantasyTeamBindings: [{ leagueId: 'rose_bowl', teamId: 'fla' }],
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

// Alpha Phase 1 catalog shape:
// - PRESET_PROFILES exports all owner/admin + Alpha identities.
// - getPresetProfilesForMode(PROFILE_MODES.ALPHA) is the UI filter for tester mode.
// - Existing owner profile persistence stays at PROFILE_KEY and is coerced by mode
//   at read time instead of being destructively migrated.
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
