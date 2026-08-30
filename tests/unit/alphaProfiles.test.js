import { describe, expect, it } from 'vitest';

import {
  ALPHA_FANTASY_LEAGUE_IDS,
  ALPHA_PROFILE_IDS,
  OWNER_PROFILE_IDS,
  PRESET_PROFILES,
  PROFILE_KEY,
  PROFILE_MODES,
  USAGE_PRIORITIES,
  canProfileAccessOwnerPortfolio,
  canProfileStoreApiKeys,
  canProfileUseAI,
  coerceProfileForMode,
  getDefaultProfileForMode,
  getPresetProfilesForMode,
  getUsagePriorityConfig,
  isAlphaTesterProfile,
} from '../../src/lib/profiles.js';

describe('Alpha profile catalog', () => {
  it('preserves the owner browser profile storage key', () => {
    expect(PROFILE_KEY).toBe('nfl_user_profile_v1');
  });

  it('keeps owner/admin profiles in the shared PRESET_PROFILES catalog', () => {
    const ids = PRESET_PROFILES.map((profile) => profile.id);

    expect(ids).toEqual(expect.arrayContaining(OWNER_PROFILE_IDS));
    expect(ids).toEqual(expect.arrayContaining(['master', 'amanda', 'andy']));
  });

  it('adds Alpha tester profiles without replacing owner/admin profiles', () => {
    const ids = PRESET_PROFILES.map((profile) => profile.id);

    expect(ALPHA_PROFILE_IDS.length).toBeGreaterThanOrEqual(9);
    expect(ids).toEqual(expect.arrayContaining(ALPHA_PROFILE_IDS));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes all official Alpha testers (amanda_rose, patrick_fagan, matt_post, matt_policare, alejandro, tyler_bradford)', () => {
    const officialTesterIds = [
      'amanda_rose',
      'patrick_fagan',
      'matt_post',
      'matt_policare',
      'alejandro',
      'tyler_bradford',
    ];

    for (const id of officialTesterIds) {
      expect(ALPHA_PROFILE_IDS).toContain(id);
    }
  });

  it('binds Amanda Rose to Olivators, Wailin Raylans, Jukin Junies, and Buffalo Bills', () => {
    const profile = PRESET_PROFILES.find((p) => p.id === 'amanda_rose');
    expect(profile).toBeDefined();
    expect(profile.realName).toBe('Amanda Rose');
    expect(profile.favoriteTeams).toContain('BUF');
    expect(profile.bettingInterests).toEqual(expect.arrayContaining(['supercontest', 'player_props']));
    expect(profile.fantasyLeagues).toEqual(
      expect.arrayContaining(['honey_badgers', 'the_league', 'rose_bowl'])
    );
    const teamNames = profile.fantasyTeamBindings.map((b) => b.teamName);
    expect(teamNames).toEqual(
      expect.arrayContaining(['Olivators', 'Wailin Raylans', 'Jukin Junies'])
    );
  });

  it('binds Patrick Fagan to LV Rosekillers and props/sides betting focus', () => {
    const profile = PRESET_PROFILES.find((p) => p.id === 'patrick_fagan');
    expect(profile).toBeDefined();
    expect(profile.realName).toBe('Patrick Fagan');
    expect(profile.usagePriority).toBe('props_and_odds');
    expect(profile.fantasyLeagues).toContain('rose_bowl');
    expect(profile.bettingInterests).toEqual(
      expect.arrayContaining(['game_spreads', 'game_totals', 'player_props', 'survivor', 'supercontest'])
    );
    const teamNames = profile.fantasyTeamBindings.map((b) => b.teamName);
    expect(teamNames).toContain('L.V. Rosekillers');
  });

  it('binds Matt Post to Postino\'s Banditos, Concussion Protocol, and LV Raiders', () => {
    const profile = PRESET_PROFILES.find((p) => p.id === 'matt_post');
    expect(profile).toBeDefined();
    expect(profile.realName).toBe('Matt Post');
    expect(profile.favoriteTeams).toContain('LV');
    expect(profile.usagePriority).toBe('dynasty_and_draft');
    expect(profile.fantasyLeagues).toEqual(
      expect.arrayContaining(['the_league', 'rose_bowl'])
    );
    const teamNames = profile.fantasyTeamBindings.map((b) => b.teamName);
    expect(teamNames).toEqual(
      expect.arrayContaining(['Postino\'s Banditos', 'Concussion Protocol'])
    );
  });

  it('binds Matt Policare to JRZ, Rafi Bomb Returns!, and waiver/injury focus', () => {
    const profile = PRESET_PROFILES.find((p) => p.id === 'matt_policare');
    expect(profile).toBeDefined();
    expect(profile.realName).toBe('Matt Policare');
    expect(profile.usagePriority).toBe('waiver_and_injuries');
    expect(profile.bettingInterests).toEqual(
      expect.arrayContaining(['game_spreads', 'game_totals', 'pickem', 'survivor', 'supercontest'])
    );
    expect(profile.fantasyLeagues).toEqual(
      expect.arrayContaining(['honey_badgers', 'the_league'])
    );
    const teamNames = profile.fantasyTeamBindings.map((b) => b.teamName);
    expect(teamNames).toEqual(
      expect.arrayContaining(['JRZ', 'Rafi Bomb Returns!'])
    );
  });

  it('binds Alejandro to Jesus Take the Wheel, Panda XL, TB Bucs, and LA Rams', () => {
    const profile = PRESET_PROFILES.find((p) => p.id === 'alejandro');
    expect(profile).toBeDefined();
    expect(profile.realName).toBe('Alejandro');
    expect(profile.usagePriority).toBe('props_and_odds');
    expect(profile.favoriteTeams).toEqual(expect.arrayContaining(['TB', 'LAR']));
    expect(profile.bettingInterests).toEqual(
      expect.arrayContaining(['passing_props', 'rushing_overs', 'receiving_overs', 'anytime_td', 'parlay_stacks'])
    );
    expect(profile.fantasyLeagues).toEqual(
      expect.arrayContaining(['honey_badgers', 'rose_bowl'])
    );
    const teamNames = profile.fantasyTeamBindings.map((b) => b.teamName);
    expect(teamNames).toEqual(
      expect.arrayContaining(['Jesus Take the Wheel', 'Panda XL'])
    );
  });

  it('binds Tyler Bradford as a full-spectrum bettor with no fantasy league affiliation', () => {
    const profile = PRESET_PROFILES.find((p) => p.id === 'tyler_bradford');
    expect(profile).toBeDefined();
    expect(profile.realName).toBe('Tyler Bradford');
    expect(profile.email).toBe('Tyler@convoy-cap.com');
    expect(profile.usagePriority).toBe('props_and_odds');
    expect(profile.defaultHub).toBe('odds');
    expect(profile.fantasyLeagues).toEqual([]);
    expect(profile.fantasyTeamBindings).toEqual([]);
    expect(profile.favoriteTeams).toEqual([]);
    expect(profile.bettingInterests).toEqual(
      expect.arrayContaining(['game_spreads', 'game_totals', 'player_props', 'survivor', 'supercontest', 'pickem', 'futures'])
    );
    expect(isAlphaTesterProfile(profile)).toBe(true);
  });

  it('filters Alpha tester mode to tester profiles only', () => {
    const alphaProfiles = getPresetProfilesForMode(PROFILE_MODES.ALPHA);
    const alphaIds = alphaProfiles.map((profile) => profile.id);

    expect(alphaIds).toEqual(ALPHA_PROFILE_IDS);
    expect(alphaIds).not.toContain('master');
    expect(alphaIds).not.toContain('andy');
    expect(alphaProfiles.every((profile) => isAlphaTesterProfile(profile))).toBe(true);
  });

  it('filters owner mode away from Alpha tester identities', () => {
    const ownerIds = getPresetProfilesForMode(PROFILE_MODES.OWNER).map((profile) => profile.id);

    expect(ownerIds).toEqual(expect.arrayContaining(OWNER_PROFILE_IDS));
    for (const alphaId of ALPHA_PROFILE_IDS) {
      expect(ownerIds).not.toContain(alphaId);
    }
  });

  it('coerces stale owner profiles to an Alpha default in Alpha tester mode', () => {
    const coerced = coerceProfileForMode({ id: 'master' }, PROFILE_MODES.ALPHA);

    expect(isAlphaTesterProfile(coerced)).toBe(true);
    expect(coerced.id).toBe(getDefaultProfileForMode(PROFILE_MODES.ALPHA).id);
  });

  it('coerces stale Alpha profiles back to an owner default in owner mode', () => {
    const coerced = coerceProfileForMode({ id: ALPHA_PROFILE_IDS[0] }, PROFILE_MODES.OWNER);

    expect(OWNER_PROFILE_IDS).toContain(coerced.id);
    expect(isAlphaTesterProfile(coerced)).toBe(false);
  });

  it('binds Alpha testers only to supported fantasy league ids and valid teams', () => {
    const alphaProfiles = getPresetProfilesForMode(PROFILE_MODES.ALPHA);
    // Most testers are bound to at least one real fantasy league, but that is not a hard
    // requirement of being an Alpha tester (tyler_bradford has no fantasy affiliation at all,
    // by design -- a pure sports bettor). Assert league-id/team-shape validity when leagues
    // exist, and assert the no-leagues case stays internally consistent (no orphaned bindings).
    for (const profile of alphaProfiles) {
      expect(Array.isArray(profile.fantasyLeagues)).toBe(true);
      expect(Array.isArray(profile.fantasyTeamBindings)).toBe(true);

      for (const leagueId of profile.fantasyLeagues) {
        expect(ALPHA_FANTASY_LEAGUE_IDS).toContain(leagueId);
      }
      for (const binding of profile.fantasyTeamBindings) {
        expect(ALPHA_FANTASY_LEAGUE_IDS).toContain(binding.leagueId);
        expect(typeof binding.teamId).toBe('string');
        expect(typeof binding.teamName).toBe('string');
      }

      if (profile.fantasyLeagues.length === 0) {
        expect(profile.fantasyTeamBindings.length).toBe(0);
      }
    }
  });

  it('has at least one fantasy-league-bound tester among the official Alpha cohort', () => {
    // Guards against the exception above swallowing the original intent: at least the
    // existing fantasy-league testers must still carry real league bindings.
    const alphaProfiles = getPresetProfilesForMode(PROFILE_MODES.ALPHA);
    const leagueBoundCount = alphaProfiles.filter((p) => p.fantasyLeagues.length > 0).length;
    expect(leagueBoundCount).toBeGreaterThan(0);
  });

  it('assigns valid usage priorities and default hubs to all Alpha testers', () => {
    const alphaProfiles = getPresetProfilesForMode(PROFILE_MODES.ALPHA);
    const validPriorityIds = Object.values(USAGE_PRIORITIES).map((p) => p.id);

    for (const profile of alphaProfiles) {
      expect(validPriorityIds).toContain(profile.usagePriority);
      expect(profile.defaultHub).toBeDefined();
      expect(typeof profile.defaultHub).toBe('string');

      const config = getUsagePriorityConfig(profile.usagePriority);
      expect(config).toBeDefined();
      expect(Array.isArray(config.priorityWidgets)).toBe(true);
      expect(config.priorityWidgets.length).toBeGreaterThan(0);
    }
  });

  it('keeps the primary dashboard hubs visible for Alpha testers', () => {
    for (const profile of getPresetProfilesForMode(PROFILE_MODES.ALPHA)) {
      expect(profile.hubs).toEqual(
        expect.arrayContaining(['dashboard', 'official-picks', 'intel', 'futures', 'fantasy', 'injuries', 'odds', 'analytics'])
      );
      expect(profile.hubs).not.toContain('alpha-packet');
      expect(profile.hubs).not.toContain('alpha-sandbox');
    }
  });

  it('blocks AI, API-key storage, and owner portfolio access for Alpha testers', () => {
    for (const profile of getPresetProfilesForMode(PROFILE_MODES.ALPHA)) {
      expect(canProfileUseAI(profile)).toBe(false);
      expect(canProfileStoreApiKeys(profile)).toBe(false);
      expect(canProfileAccessOwnerPortfolio(profile)).toBe(false);
      expect(profile.blockedFeatures).toEqual(
        expect.arrayContaining(['owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'])
      );
      expect(profile.agents).toEqual([]);
    }
  });
});
