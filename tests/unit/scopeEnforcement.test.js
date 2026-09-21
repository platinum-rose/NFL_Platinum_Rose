// tests/unit/scopeEnforcement.test.js
// rev-22-review finding #6: direct automated coverage for
// agents/lib/scope-enforcement.js (see scopedDossier.test.js header note).
import { describe, expect, it } from 'vitest';
import { quarantineStage1, assertScopeClean, checkStartupInvariant } from '../../agents/lib/scope-enforcement.js';

function fullRow(overrides = {}) {
  return {
    market: 'wins', selection: 'x', type: 'value', edge_type: 'thesis', book: 'draftkings',
    price: -110, model_fair_prob: 0.55, edge_pct: 5, confidence: 60, stake_tier: 'standard',
    knowledge_based: false, market_view: 'mv', football_view: 'fv', thesis: 't',
    disconfirming_factor: 'd', bet_threshold: '-120', needs_human_review: false,
    evidence_ids: ['a'], sources: ['s'],
    timing: { action: 'bet_now', trigger: 'tr', expected_move: 'em', rationale: 'r' },
    ...overrides,
  };
}
function fullWatchRow(overrides = {}) {
  return { market: 'wins', selection: 'x', why: 'y', ...overrides };
}
// rev-23-followup4 fix (Codex finding #1): quarantineStage1() now requires
// "recommendations"/"watch"/"portfolio_notes" unconditionally -- every test
// below that isn't specifically EXERCISING that new requirement needs a
// valid portfolio_notes (and, unless overridden, empty recommendations/
// watch arrays) to reach the schema/content-scope behavior it's actually
// testing. This mirrors fullRow()/fullWatchRow() above: a shared "this is
// what a genuinely complete request looks like" fixture.
function basePayload(overrides = {}) {
  return { recommendations: [], watch: [], portfolio_notes: 'notes', ...overrides };
}

describe('quarantineStage1 — schema rejection (layer 1, op 0)', () => {
  it('rejects the whole response on a null recommendation row', () => {
    expect(() => quarantineStage1(basePayload({ recommendations: [null] }))).toThrow(/is not a plain object/);
  });

  it('rejects a market-only recommendation (missing the rest of the required contract)', () => {
    expect(() => quarantineStage1(basePayload({ recommendations: [{ market: 'wins' }] }))).toThrow(/selection is missing or not a non-empty string/);
  });

  it('rejects an object-valued type field', () => {
    expect(() => quarantineStage1(basePayload({ recommendations: [fullRow({ type: { weird: true } })] }))).toThrow(/\.type is missing or not a non-empty string/);
  });

  it('rejects a string-valued confidence field', () => {
    expect(() => quarantineStage1(basePayload({ recommendations: [fullRow({ confidence: 'high' })] }))).toThrow(/\.confidence is missing or not a finite number/);
  });

  it('rejects a non-string-array evidence_ids field', () => {
    expect(() => quarantineStage1(basePayload({ recommendations: [fullRow({ evidence_ids: [1, 2] })] }))).toThrow(/\.evidence_ids is missing or not an array of strings/);
  });

  it('rejects a missing timing object', () => {
    const row = fullRow();
    delete row.timing;
    expect(() => quarantineStage1(basePayload({ recommendations: [row] }))).toThrow(/\.timing is missing or not an object/);
  });

  it('rejects a watch row missing why', () => {
    expect(() => quarantineStage1(basePayload({ watch: [{ market: 'wins', selection: 'x' }] }))).toThrow(/\.why is missing or not a non-empty string/);
  });

  it('accepts a fully-valid recommendation and watch row', () => {
    const out = quarantineStage1(basePayload({ recommendations: [fullRow()], watch: [fullWatchRow()] }));
    expect(out.recommendations).toHaveLength(1);
    expect(out.watch).toHaveLength(1);
  });
});

// rev-23-followup4 (Codex finding #1): "{}" (or any response missing
// recommendations/watch/portfolio_notes) must fail as a Stage-1 attempt,
// not silently become an empty successful model result.
describe('quarantineStage1 — required top-level contract (rev-23-followup4, Codex finding #1)', () => {
  it('rejects a literal {} response', () => {
    expect(() => quarantineStage1({})).toThrow(/"recommendations" is missing or not an array/);
  });

  it('rejects a response missing "recommendations" even when watch/portfolio_notes are present', () => {
    expect(() => quarantineStage1({ watch: [], portfolio_notes: 'notes' })).toThrow(/"recommendations" is missing or not an array/);
  });

  it('rejects a response where "recommendations" is present but not an array', () => {
    expect(() => quarantineStage1({ recommendations: 'nope', watch: [], portfolio_notes: 'notes' })).toThrow(/"recommendations" is missing or not an array/);
  });

  it('rejects a response missing "watch" even when recommendations/portfolio_notes are present', () => {
    expect(() => quarantineStage1({ recommendations: [], portfolio_notes: 'notes' })).toThrow(/"watch" is missing or not an array/);
  });

  it('rejects a response where "watch" is present but not an array', () => {
    expect(() => quarantineStage1({ recommendations: [], watch: {}, portfolio_notes: 'notes' })).toThrow(/"watch" is missing or not an array/);
  });

  it('rejects a response missing "portfolio_notes" even when recommendations/watch are present', () => {
    expect(() => quarantineStage1({ recommendations: [], watch: [] })).toThrow(/"portfolio_notes" is missing or not a non-empty string/);
  });

  it('rejects a response where "portfolio_notes" is present but not a string', () => {
    expect(() => quarantineStage1({ recommendations: [], watch: [], portfolio_notes: 42 })).toThrow(/"portfolio_notes" is missing or not a non-empty string/);
  });

  it('rejects a response where "portfolio_notes" is an empty string', () => {
    expect(() => quarantineStage1({ recommendations: [], watch: [], portfolio_notes: '' })).toThrow(/"portfolio_notes" is missing or not a non-empty string/);
  });

  it('accepts a minimal-but-complete response: empty recommendations/watch and a non-empty portfolio_notes', () => {
    const out = quarantineStage1({ recommendations: [], watch: [], portfolio_notes: 'Nothing in scope this run.' });
    expect(out.recommendations).toEqual([]);
    expect(out.watch).toEqual([]);
    expect(out.portfolio_notes).toBe('Nothing in scope this run.');
  });
});

describe('quarantineStage1 — content-scope filtering (layer 1, ops 1-3)', () => {
  it('drops edge_type: "hedge" even when type is clean', () => {
    const out = quarantineStage1(basePayload({ recommendations: [fullRow({ edge_type: 'hedge' })] }));
    expect(out.recommendations).toHaveLength(0);
  });

  it('drops a watch row with timing.action "pair" and strips correlated_week1', () => {
    const out = quarantineStage1(basePayload({ watch: [{ ...fullWatchRow(), timing: { action: 'pair' }, correlated_week1: ['z'] }] }));
    expect(out.watch).toHaveLength(0);
  });

  it('keeps an in-scope watch row but strips its prohibited keys', () => {
    const out = quarantineStage1(basePayload({ watch: [{ ...fullWatchRow({ market: 'playoffs' }), correlated_week1: ['z'] }] }));
    expect(out.watch).toHaveLength(1);
    expect('correlated_week1' in out.watch[0]).toBe(false);
  });

  it('strips top-level scenario_review and correlated_week1', () => {
    const out = quarantineStage1(basePayload({ scenario_review: { note: 'x' }, correlated_week1: ['a'] }));
    expect('scenario_review' in out).toBe(false);
    expect('correlated_week1' in out).toBe(false);
  });

  it('drops an out-of-scope market row and keeps the in-scope one', () => {
    const out = quarantineStage1(basePayload({
      recommendations: [fullRow({ market: 'superbowl', selection: 'a' }), fullRow({ market: 'wins', selection: 'b' })],
    }));
    expect(out.recommendations).toHaveLength(1);
    expect(out.recommendations[0].selection).toBe('b');
  });

  it('records accurate per-row __quarantine detail, not just counts', () => {
    const out = quarantineStage1(basePayload({
      recommendations: [fullRow({ market: 'superbowl', selection: 'a' }), fullRow({ market: 'wins', selection: 'b' })],
      hedge_baskets: [{}], parlay_ladders: [], portfolio_strategy: null,
    }));
    expect(out.__quarantine.recommendations_seen).toBe(2);
    expect(out.__quarantine.recommendations_removed).toBe(1);
    expect(out.__quarantine.recommendations_removed_detail).toEqual([
      { index: 0, market: 'superbowl', selection: 'a', reason: 'out-of-scope market "superbowl"' },
    ]);
    expect(out.__quarantine.removed_top_level_keys.sort()).toEqual(['hedge_baskets', 'parlay_ladders', 'portfolio_strategy'].sort());
  });
});

describe('quarantineStage1 — watch-row optional-field schema completeness (rev-23-followup3, Codex finding #3)', () => {
  it('rejects the whole response when a watch row has an object-valued type', () => {
    expect(() => quarantineStage1(basePayload({
      watch: [fullWatchRow({ type: { nested: true } })],
    }))).toThrow(/watch\[0\]\.type is missing or not a non-empty string/);
  });

  it('rejects the whole response when a watch row has a numeric edge_type', () => {
    expect(() => quarantineStage1(basePayload({
      watch: [fullWatchRow({ edge_type: 5 })],
    }))).toThrow(/watch\[0\]\.edge_type is missing or not a non-empty string/);
  });

  it('rejects the whole response when a watch row has an object-valued timing.action', () => {
    expect(() => quarantineStage1(basePayload({
      watch: [fullWatchRow({ timing: { action: { nested: true } } })],
    }))).toThrow(/watch\[0\]\.timing\.action is missing or not a non-empty string/);
  });

  it('rejects the whole response when a watch row\'s timing field is present but not an object', () => {
    expect(() => quarantineStage1(basePayload({
      watch: [fullWatchRow({ timing: 'soon' })],
    }))).toThrow(/watch\[0\]\.timing is present but not an object/);
  });

  it('still allows a watch row with none of the optional fields present (the documented market/selection/why-only contract)', () => {
    const out = quarantineStage1(basePayload({ watch: [fullWatchRow()] }));
    expect(out.watch).toHaveLength(1);
  });

  it('allows a watch row with well-typed optional fields, and still applies content-scope filtering to them (a watch row with a forbidden type is dropped, not fatal)', () => {
    const out = quarantineStage1(basePayload({
      watch: [fullWatchRow({ type: 'value', edge_type: 'thesis', timing: { action: 'bet_now' } })],
    }));
    expect(out.watch).toHaveLength(1);
    expect(out.watch[0].type).toBe('value');
  });
});

describe('quarantineStage1 — cleaned rows do not share mutable references with the parsed input (rev-23-followup3, Codex finding #3)', () => {
  it('a cleaned recommendation\'s timing object is a distinct instance from the input row\'s timing object', () => {
    const input = fullRow();
    const out = quarantineStage1(basePayload({ recommendations: [input] }));
    expect(out.recommendations[0].timing).not.toBe(input.timing);
    expect(out.recommendations[0].timing).toEqual(input.timing);
    out.recommendations[0].timing.action = 'MUTATED';
    expect(input.timing.action).toBe('bet_now');
  });

  it('a cleaned recommendation\'s evidence_ids/sources arrays are distinct instances from the input row\'s arrays', () => {
    const input = fullRow();
    const out = quarantineStage1(basePayload({ recommendations: [input] }));
    expect(out.recommendations[0].evidence_ids).not.toBe(input.evidence_ids);
    out.recommendations[0].evidence_ids.push('MUTATED');
    expect(input.evidence_ids).toEqual(['a']);
  });

  it('a cleaned watch row\'s timing object is a distinct instance from the input row\'s timing object', () => {
    const input = fullWatchRow({ timing: { action: 'bet_now' } });
    const out = quarantineStage1(basePayload({ watch: [input] }));
    expect(out.watch[0].timing).not.toBe(input.timing);
    out.watch[0].timing.action = 'MUTATED';
    expect(input.timing.action).toBe('bet_now');
  });
});

// rev-23-followup4 fix (Codex finding #7): quarantineStage1()'s TOP-LEVEL
// output must be fully independent of the parsed input, including a
// top-level nested value this module doesn't even recognize -- not just
// the recommendation/watch rows the previous round already deep-cloned.
describe('quarantineStage1 — top-level output independence, including unrecognized fields (rev-23-followup4, Codex finding #7)', () => {
  it('an unrecognized top-level nested object/array is not shared by reference with the input', () => {
    const input = basePayload({
      recommendations: [fullRow()],
      some_unrecognized_field: { nested: { deep: [1, 2, 3] } },
    });
    const out = quarantineStage1(input);
    expect(out.some_unrecognized_field).toEqual(input.some_unrecognized_field);
    expect(out.some_unrecognized_field).not.toBe(input.some_unrecognized_field);
    expect(out.some_unrecognized_field.nested).not.toBe(input.some_unrecognized_field.nested);
    expect(out.some_unrecognized_field.nested.deep).not.toBe(input.some_unrecognized_field.nested.deep);
    out.some_unrecognized_field.nested.deep.push(4);
    expect(input.some_unrecognized_field.nested.deep).toEqual([1, 2, 3]);
  });
});

describe('assertScopeClean — layer 2 final assertion', () => {
  it('throws on a present-but-null forbidden key (presence, not value, is the violation)', () => {
    expect(() => assertScopeClean({ final: [{ key: 'k1', market: 'wins', correlated_week1: null }] })).toThrow(/forbidden key "correlated_week1"/);
  });

  it('throws on forbidden edge_type even when type is clean', () => {
    expect(() => assertScopeClean({ final: [{ key: 'k1', market: 'wins', type: 'value', edge_type: 'hedge' }] })).toThrow(/forbidden edge_type/);
  });

  it('throws on forbidden timing.action', () => {
    expect(() => assertScopeClean({ final: [{ key: 'k1', market: 'playoffs', timing: { action: 'pair' } }] })).toThrow(/forbidden timing\.action/);
  });

  it('catches a nested out-of-scope market inside stage1_versions, not just the top-level final list', () => {
    expect(() => assertScopeClean({
      candidates: [{ key: 'k1', market: 'wins', stage1_versions: { modelA: { market: 'superbowl', selection: 'x' } } }],
    })).toThrow(/out-of-scope market "superbowl"/);
  });

  it('catches an out-of-scope promotion market_type', () => {
    expect(() => assertScopeClean({
      sportsbook_promotions: { promotions: [{ promotion: { eligible_market: { market_type: 'superbowl' } } }] },
    })).toThrow(/out-of-scope market_type "superbowl"/);
  });

  it('allows an in-scope promotion market_type', () => {
    expect(() => assertScopeClean({
      sportsbook_promotions: { promotions: [{ promotion: { eligible_market: { market_type: 'wins' } } }] },
    })).not.toThrow();
  });

  it('catches a forbidden key nested inside an official_proposal_drafts_full array (rev-23-followup: the proposal-export leak)', () => {
    // agents/portfolio-synthesize.js's exportOfficialProposalDrafts()
    // previously wrote candidate.correlated_week1 to every proposal draft
    // file (renamed correlated_positions) before any scope assertion ran.
    // The fix is structural omission at the source; this locks in that
    // assertScopeClean() itself still catches the literal forbidden key if
    // it ever reappears under its real name in this payload shape.
    expect(() => assertScopeClean({
      final: [{ key: 'k1', market: 'wins' }],
      official_proposal_drafts_full: [{ pick_id: 'p1', market: 'wins', correlated_week1: ['a'] }],
    })).toThrow(/forbidden key "correlated_week1"/);
  });

  it('flags a known renamed alias like correlated_positions (rev-23-followup3)', () => {
    expect(() => assertScopeClean({
      final: [{ key: 'k1', market: 'wins' }],
      official_proposal_drafts_full: [{ pick_id: 'p1', market: 'wins', correlated_positions: ['a'] }],
    })).toThrow(/forbidden key "correlated_positions" is present.*known renamed alias/);
  });

  it('rev-23-followup3 fix (Codex finding #2): rejects an evidence_ids reference into the excluded prediction_markets evidence root', () => {
    expect(() => assertScopeClean({
      final: [{ key: 'k1', market: 'wins', evidence_ids: ['prediction_markets.playoff_prob'] }],
    })).toThrow(/excluded evidence root "prediction_markets"/);
  });

  it.each(['vault_analytical_reads', 'master_reports', 'training_camp_intel', 'adjacent_signals'])(
    'rev-23-followup4 fix (Codex finding #4): rejects an evidence_ids reference into the excluded "%s" evidence root',
    (rootName) => {
      expect(() => assertScopeClean({
        final: [{ key: 'k1', market: 'wins', evidence_ids: [`${rootName}.some_field`] }],
      })).toThrow(new RegExp(`excluded evidence root "${rootName}"`));
    },
  );

  it('rev-23-followup3 fix (Codex finding #2): allows an in-scope evidence_ids reference', () => {
    expect(() => assertScopeClean({
      final: [{ key: 'k1', market: 'wins', evidence_ids: ['analytics.off_epa_rank', 'sos.market_rank'] }],
    })).not.toThrow();
  });

  it('rev-23-followup3 fix (Codex finding #2): the audit_raw_unsanitized exemption still holds -- it is enforced by the caller never including that subtree in root, not by a special-case here', () => {
    expect(() => assertScopeClean({
      final: [{ key: 'k1', market: 'wins' }],
      // audit_raw_unsanitized deliberately omitted, matching the real CLI call site.
    })).not.toThrow();
  });

  it('passes a fully clean tree with no throw', () => {
    expect(() => assertScopeClean({
      byModel: { modelA: { recommendations: [{ market: 'wins', type: 'value', edge_type: 'thesis', timing: { action: 'bet_now' } }], watch: [] } },
      final: [{ key: 'k1', market: 'playoffs', type: 'favorite' }],
      passed: [], killed: [], watchlistReview: [], portfolioStrategy: null, scenarioReview: null,
    })).not.toThrow();
  });
});

// rev-23-followup4 fix (Codex finding #2): __quarantine is AUDIT METADATA
// documenting content that quarantineStage1() already removed for being
// out of scope -- it must never itself trip the same final assertion that
// polices real, still-live report/proposal candidates, but a genuine
// out-of-scope leak sitting OUTSIDE __quarantine must still be caught.
describe('assertScopeClean — __quarantine audit metadata is exempt from the recursive scan, without weakening real candidate checking (rev-23-followup4, Codex finding #2)', () => {
  it('does not throw on a real quarantineStage1() output whose __quarantine documents an out-of-scope market', () => {
    const cleaned = quarantineStage1(basePayload({
      recommendations: [fullRow({ market: 'superbowl', selection: 'a' }), fullRow({ market: 'wins', selection: 'b' })],
    }));
    // Confirm the fixture actually exercises the concern: __quarantine really
    // does carry the out-of-scope market string this assertion must ignore.
    expect(cleaned.__quarantine.recommendations_removed_detail[0].market).toBe('superbowl');
    expect(() => assertScopeClean({ byModel: { modelA: cleaned } })).not.toThrow();
  });

  it('does not throw on a hand-built __quarantine subtree carrying a forbidden key/alias/evidence-root, even though the same shape outside __quarantine would throw', () => {
    expect(() => assertScopeClean({
      byModel: {
        modelA: {
          recommendations: [{ market: 'wins' }],
          watch: [],
          __quarantine: {
            recommendations_removed_detail: [
              { index: 0, market: 'superbowl', selection: 'a', reason: 'out-of-scope market "superbowl"', correlated_positions: ['x'], evidence_ids: ['prediction_markets.playoff_prob'] },
            ],
          },
        },
      },
    })).not.toThrow();
  });

  it('a genuine out-of-scope market OUTSIDE __quarantine (a sibling of it) still throws', () => {
    expect(() => assertScopeClean({
      byModel: {
        modelA: {
          recommendations: [{ market: 'superbowl' }],
          watch: [],
          __quarantine: { recommendations_removed_detail: [] },
        },
      },
    })).toThrow(/out-of-scope market "superbowl"/);
  });

  it('a genuine forbidden-key leak OUTSIDE __quarantine still throws even when __quarantine is also present on the same node', () => {
    expect(() => assertScopeClean({
      byModel: {
        modelA: {
          recommendations: [{ market: 'wins', correlated_positions: ['leak'] }],
          watch: [],
          __quarantine: { recommendations_removed_detail: [] },
        },
      },
    })).toThrow(/forbidden key "correlated_positions"/);
  });
});

describe('checkStartupInvariant', () => {
  it('fails closed without --disable-live-context-bridges', () => {
    const r = checkStartupInvariant({ suppressed: true, noPersist: true, proposalOutDir: null, watchlist: { items: [] }, disableLiveContextBridges: false });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.includes('--disable-live-context-bridges'))).toBe(true);
  });

  it('fails closed on an out-of-scope promotion', () => {
    const r = checkStartupInvariant({
      suppressed: true, noPersist: true, proposalOutDir: null, watchlist: { items: [] }, disableLiveContextBridges: true,
      promotions: { promotions: [{ promotion: { eligible_market: { market_type: 'superbowl' } } }] },
    });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.includes('market_type'))).toBe(true);
  });

  it('passes with all requirements met and no promotions loaded', () => {
    const r = checkStartupInvariant({ suppressed: true, noPersist: true, proposalOutDir: null, watchlist: { items: [] }, disableLiveContextBridges: true, promotions: null });
    expect(r.ok).toBe(true);
  });

  it('passes with an in-scope promotion loaded', () => {
    const r = checkStartupInvariant({
      suppressed: true, noPersist: true, proposalOutDir: null, watchlist: { items: [] }, disableLiveContextBridges: true,
      promotions: { promotions: [{ promotion: { eligible_market: { market_type: 'wins' } } }] },
    });
    expect(r.ok).toBe(true);
  });
});
