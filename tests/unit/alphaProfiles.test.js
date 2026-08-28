import { describe, expect, it } from 'vitest';

import {
  ALPHA_FANTASY_LEAGUE_IDS,
  ALPHA_PROFILE_IDS,
  OWNER_PROFILE_IDS,
  PRESET_PROFILES,
  PROFILE_KEY,
  PROFILE_MODES,
  canProfileAccessOwnerPortfolio,
  canProfileStoreApiKeys,
  canProfileUseAI,
  coerceProfileForMode,
  getDefaultProfileForMode,
  getPresetProfilesForMode,
  isAlphaTesterProfile,
} from '../../src/lib/profiles.js';

describe('Alpha profile catalog', () => {
  it('preserves the owner browser profile storage key', () => {
    expect(PROFILE_KEY).toBe('nfl_user_profile_v1');
  });

  it('keeps owner/admin profiles in the shared PRESET_PROFILES catalog', () => {
    const ids = PRESET_PROFILES.map((profile) => profile.id);

    expect(ids).toEqual(expect.arrayContaining(OWNER_PROFILE_IDS));
    expect(ids).toEqual(expect.arrayContaining(['master', 'andy']));
  });

  it('adds Alpha tester profiles without replacing owner/admin profiles', () => {
    const ids = PRESET_PROFILES.map((profile) => profile.id);

    expect(ALPHA_PROFILE_IDS.length).toBeGreaterThanOrEqual(4);
    expect(ids).toEqual(expect.arrayContaining(ALPHA_PROFILE_IDS));
    expect(new Set(ids).size).toBe(ids.length);
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

  it('binds Alpha testers only to supported fantasy league ids', () => {
    const alphaProfiles = getPresetProfilesForMode(PROFILE_MODES.ALPHA);

    for (const profile of alphaProfiles) {
      expect(profile.fantasyLeagues.length).toBeGreaterThan(0);
      for (const leagueId of profile.fantasyLeagues) {
        expect(ALPHA_FANTASY_LEAGUE_IDS).toContain(leagueId);
      }
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
    }
  });
});
