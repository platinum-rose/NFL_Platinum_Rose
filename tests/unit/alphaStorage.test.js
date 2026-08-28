import { beforeEach, describe, expect, it, vi } from 'vitest';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: () => store,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

import {
  ALPHA_STATE_DOMAINS,
  getAlphaStorageKey,
  loadAlphaState,
  saveAlphaState,
} from '../../src/lib/storage.js';

describe('Alpha profile-scoped storage', () => {
  it('derives static Alpha keys using the approved pattern', () => {
    expect(
      getAlphaStorageKey({
        profileId: 'alpha_honey_badgers',
        stateDomain: ALPHA_STATE_DOMAINS.ALPHA_SETTINGS,
      })
    ).toBe('nfl_alpha:alpha_honey_badgers:alpha_settings:v1');
  });

  it('derives weekly Alpha keys using the approved season/week pattern', () => {
    expect(
      getAlphaStorageKey({
        profileId: 'alpha_honey_badgers',
        stateDomain: ALPHA_STATE_DOMAINS.SUPERCONTEST,
        season: 2026,
        week: 'preseason_week_3',
      })
    ).toBe('nfl_alpha:alpha_honey_badgers:supercontest:2026:preseason_week_3:v1');
  });

  it('supports all required Alpha state domains', () => {
    expect(Object.values(ALPHA_STATE_DOMAINS)).toEqual(
      expect.arrayContaining([
        'supercontest',
        'survivor',
        'sandbox_portfolio',
        'feedback_drafts',
        'alpha_settings',
        'evidence_session_metadata',
      ])
    );
  });

  it('does not collide between tester profiles', () => {
    const scope = { season: 2026, week: 'preseason_week_3' };

    saveAlphaState('alpha_honey_badgers', ALPHA_STATE_DOMAINS.SUPERCONTEST, { picks: ['SEA'] }, scope);
    saveAlphaState('alpha_the_league', ALPHA_STATE_DOMAINS.SUPERCONTEST, { picks: ['LAR'] }, scope);

    expect(loadAlphaState('alpha_honey_badgers', ALPHA_STATE_DOMAINS.SUPERCONTEST, null, scope)).toEqual({ picks: ['SEA'] });
    expect(loadAlphaState('alpha_the_league', ALPHA_STATE_DOMAINS.SUPERCONTEST, null, scope)).toEqual({ picks: ['LAR'] });
  });

  it('falls back gracefully when Alpha state is missing', () => {
    expect(
      loadAlphaState('alpha_rose_bowl', ALPHA_STATE_DOMAINS.FEEDBACK_DRAFTS, { notes: '' })
    ).toEqual({ notes: '' });
  });

  it('falls back gracefully when Alpha state JSON is corrupted', () => {
    const key = getAlphaStorageKey({
      profileId: 'alpha_rfi_invitational',
      stateDomain: ALPHA_STATE_DOMAINS.SANDBOX_PORTFOLIO,
    });
    localStorage.setItem(key, 'not-json{{{');

    expect(
      loadAlphaState('alpha_rfi_invitational', ALPHA_STATE_DOMAINS.SANDBOX_PORTFOLIO, [])
    ).toEqual([]);
  });

  it('rejects unknown Alpha state domains', () => {
    expect(() => getAlphaStorageKey({ profileId: 'alpha_honey_badgers', stateDomain: 'owner_portfolio' }))
      .toThrow('Unknown Alpha storage state domain');
  });
});
