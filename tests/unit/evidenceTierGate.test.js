import { describe, expect, it } from 'vitest';
import {
  classifyEvidenceTier,
  effectiveEvidenceTier,
  enforceEvidenceTierGate,
  evidenceTierViolations,
  hasQualifyingGrounding,
  isCurrentSeasonForEvidence,
  isSimPriceOnlyCandidate,
  isTier4OnlyCandidate,
  partitionSimPriceOnly,
  partitionTier4Only,
  resolvePath,
} from '../../agents/lib/board-validate.js';

function resolved(id) {
  return { id, resolved: true };
}

function unresolved(id) {
  return { id, resolved: false };
}

describe('classifyEvidenceTier', () => {
  it('classifies Tier 1 structured/computed dossier fields', () => {
    expect(classifyEvidenceTier('analytics.off_epa_rank')).toBe(1);
    expect(classifyEvidenceTier('fair_prob')).toBe(1);
    expect(classifyEvidenceTier('value_gap')).toBe(1);
    expect(classifyEvidenceTier('dvoa.off_rank')).toBe(1);
    expect(classifyEvidenceTier('coaching_profile.hc_tenure')).toBe(1);
    expect(classifyEvidenceTier('officiating_context.crew')).toBe(1);
    expect(classifyEvidenceTier('prediction_markets.implied_prob')).toBe(1);
    expect(classifyEvidenceTier('injuries.questionable')).toBe(1);
    expect(classifyEvidenceTier('player_availability.status')).toBe(1);
    expect(classifyEvidenceTier('roster_churn.qb')).toBe(1);
    expect(classifyEvidenceTier('sos.rank')).toBe(1);
    expect(classifyEvidenceTier('prior.wins')).toBe(1);
  });

  it('classifies Tier 2 named/timestamped leans', () => {
    expect(classifyEvidenceTier('lean.samples[0].who')).toBe(2);
    expect(classifyEvidenceTier('experts.someone')).toBe(2);
  });

  it('round-5 fix (Codex final review P1): bare lean aggregate/count fields do NOT classify as Tier 2 -- a tally is not a named, dated call', () => {
    expect(classifyEvidenceTier('lean.n')).toBeNull();
    expect(classifyEvidenceTier('lean.avg_strength')).toBeNull();
    expect(classifyEvidenceTier('lean.back')).toBeNull();
    expect(classifyEvidenceTier('lean.fade')).toBeNull();
    expect(classifyEvidenceTier('lean.over')).toBeNull();
    expect(classifyEvidenceTier('lean.under')).toBeNull();
  });

  it('round-5 fix: any actual sample citation under lean.samples still classifies as Tier 2', () => {
    expect(classifyEvidenceTier('lean.samples[0].who')).toBe(2);
    expect(classifyEvidenceTier('lean.samples[2].strength')).toBe(2);
    expect(classifyEvidenceTier('lean.samples[0].captured_at')).toBe(2);
  });

  it('round-5 fix (Codex final review P1): metadata-only descendants of Tier-1 roots do not qualify as Tier 1 -- provenance/freshness, not evidence', () => {
    expect(classifyEvidenceTier('analytics.season')).toBeNull();
    expect(classifyEvidenceTier('analytics.staleness_note')).toBeNull();
    expect(classifyEvidenceTier('dvoa.source_name')).toBeNull();
    expect(classifyEvidenceTier('dvoa.snapshot_at')).toBeNull();
    expect(classifyEvidenceTier('injuries.freshness')).toBeNull();
    expect(classifyEvidenceTier('player_availability.snapshot_at')).toBeNull();
    expect(classifyEvidenceTier('prediction_markets.snapshot_at')).toBeNull();
    expect(classifyEvidenceTier('prior.season')).toBeNull();
  });

  it('round-5 fix: real substantive descendants of the same Tier-1 roots remain Tier 1', () => {
    expect(classifyEvidenceTier('analytics.off_epa_rank')).toBe(1);
    expect(classifyEvidenceTier('dvoa.off_rank')).toBe(1);
    expect(classifyEvidenceTier('injuries.qb_status')).toBe(1);
    expect(classifyEvidenceTier('player_availability.key_absences')).toBe(1);
    expect(classifyEvidenceTier('prediction_markets.playoff_prob')).toBe(1);
    expect(classifyEvidenceTier('prior.wins')).toBe(1);
  });

  it('round-6 fix (Codex round-5 review P1): metadata leaks Codex found beyond round 5\'s hardcoded root.child list -- deeper nesting, dynamic middle keys, and new leaf names -- are now denied by LEAF NAME, not full path', () => {
    expect(classifyEvidenceTier('analytics.is_current_season')).toBeNull();
    expect(classifyEvidenceTier('analytics.seasons_behind')).toBeNull();
    expect(classifyEvidenceTier('dvoa.season')).toBeNull();
    expect(classifyEvidenceTier('dvoa.source_key')).toBeNull();
    expect(classifyEvidenceTier('dvoa.attribution_note')).toBeNull();
    expect(classifyEvidenceTier('sim.source')).toBeNull();
    expect(classifyEvidenceTier('sim_win_total.source')).toBeNull();
    // 3+ segments deep -- round 5's root.child (2-segment) shape could never catch these
    expect(classifyEvidenceTier('player_availability.key_returns[0].source')).toBeNull();
    expect(classifyEvidenceTier('player_availability.key_returns[0].published_at')).toBeNull();
    // dynamic middle key (a specific sportsbook name) -- no static full-path enumeration could ever cover this
    expect(classifyEvidenceTier('books.betmgm.source_row_id')).toBeNull();
    expect(classifyEvidenceTier('books.betmgm.observed_at')).toBeNull();
    expect(classifyEvidenceTier('books.betmgm.availability_status')).toBeNull();
  });

  it('round-6 fix: the original round-5 metadata denylist entries still deny correctly under the new leaf-name scheme', () => {
    expect(classifyEvidenceTier('analytics.season')).toBeNull();
    expect(classifyEvidenceTier('analytics.staleness_note')).toBeNull();
    expect(classifyEvidenceTier('dvoa.source_name')).toBeNull();
    expect(classifyEvidenceTier('dvoa.snapshot_at')).toBeNull();
    expect(classifyEvidenceTier('injuries.freshness')).toBeNull();
    expect(classifyEvidenceTier('player_availability.snapshot_at')).toBeNull();
    expect(classifyEvidenceTier('prediction_markets.snapshot_at')).toBeNull();
    expect(classifyEvidenceTier('prior.season')).toBeNull();
  });

  it('round-6 fix: nested substantive fields under the same roots (different leaf name) remain Tier 1 -- the leaf-name denylist does not overreach into real evidence', () => {
    expect(classifyEvidenceTier('player_availability.key_returns[0].status')).toBe(1);
    expect(classifyEvidenceTier('player_availability.key_returns[0].player_name')).toBeNull(); // round 7: player_name is identity metadata, not evidence -- same principle as `team`
    expect(classifyEvidenceTier('books.betmgm.price')).toBe(1);
    expect(classifyEvidenceTier('books.betmgm.line')).toBe(1);
    expect(classifyEvidenceTier('sim.win_prob')).toBe(1);
  });

  it('round-7 fix (Codex round-6 review P1): metadata leaks from a full reviewed inventory of agents/portfolio-dossier.js output -- quoteMeta(), fetchPlayerAvailabilityContext(), fetchDvoaSnapshots(), fetchCoachingProfiles(), the injuries builder -- are now denied', () => {
    // Codex's six named examples, with live-value repro context
    expect(classifyEvidenceTier('books.betmgm.quote_age_hours')).toBeNull();
    expect(classifyEvidenceTier('player_availability.key_returns[0].needs_human_review')).toBeNull();
    expect(classifyEvidenceTier('player_availability.MIA.needs_human_review')).toBeNull();
    expect(classifyEvidenceTier('player_availability.key_returns[0].player_name')).toBeNull();
    expect(classifyEvidenceTier('injuries.players[0].name')).toBeNull();
    expect(classifyEvidenceTier('dvoa.source_url')).toBeNull();
    expect(classifyEvidenceTier('dvoa.week')).toBeNull();
    // same inventory sweep, coaching_profile roots not previously covered
    expect(classifyEvidenceTier('coaching_profile.source_url')).toBeNull();
    expect(classifyEvidenceTier('coaching_profile.week')).toBeNull();
    expect(classifyEvidenceTier('coaching_profile.sample_start')).toBeNull();
    expect(classifyEvidenceTier('coaching_profile.sample_end')).toBeNull();
    expect(classifyEvidenceTier('coaching_profile.stale_after')).toBeNull();
    expect(classifyEvidenceTier('coaching_profile.head_coach')).toBeNull();
    expect(classifyEvidenceTier('coaching_profile.offensive_coordinator')).toBeNull();
    expect(classifyEvidenceTier('coaching_profile.defensive_coordinator')).toBeNull();
    // roster_churn current/prior season+week stamps -- same leaf names, different nesting shape
    expect(classifyEvidenceTier('roster_churn.current.season')).toBeNull();
    expect(classifyEvidenceTier('roster_churn.prior.week')).toBeNull();
  });

  it('round-7 fix: substantive coaching_profile fields sharing a root with the newly denied identity/window fields remain Tier 1 -- the expanded denylist does not overreach', () => {
    expect(classifyEvidenceTier('coaching_profile.fourth_down_aggression_rate')).toBe(1);
    expect(classifyEvidenceTier('coaching_profile.neutral_pass_rate')).toBe(1);
    expect(classifyEvidenceTier('coaching_profile.games_sample')).toBe(1); // sample size is a substantive confidence qualifier, not identity/freshness metadata
    expect(classifyEvidenceTier('coaching_profile.coordinator_continuity')).toBe(1);
  });

  it('round-7 regression: Tier 4 combined with each newly rejected metadata field still classifies as Tier-4-only (the metadata field contributes no qualifying support)', () => {
    const camp = resolved('training_camp_intel.buzz');
    expect(isTier4OnlyCandidate({ evidence_resolved: [camp, resolved('books.betmgm.quote_age_hours')] })).toBe(true);
    expect(isTier4OnlyCandidate({ evidence_resolved: [camp, resolved('player_availability.key_returns[0].needs_human_review')] })).toBe(true);
    expect(isTier4OnlyCandidate({ evidence_resolved: [camp, resolved('player_availability.key_returns[0].player_name')] })).toBe(true);
    expect(isTier4OnlyCandidate({ evidence_resolved: [camp, resolved('injuries.players[0].name')] })).toBe(true);
    expect(isTier4OnlyCandidate({ evidence_resolved: [camp, resolved('dvoa.source_url')] })).toBe(true);
    expect(isTier4OnlyCandidate({ evidence_resolved: [camp, resolved('dvoa.week')] })).toBe(true);
    expect(isTier4OnlyCandidate({ evidence_resolved: [camp, resolved('coaching_profile.sample_start')] })).toBe(true);
    expect(isTier4OnlyCandidate({ evidence_resolved: [camp, resolved('coaching_profile.head_coach')] })).toBe(true);
    // sanity check: a real substantive field from the same root DOES supply qualifying support and flips the result
    expect(isTier4OnlyCandidate({ evidence_resolved: [camp, resolved('coaching_profile.fourth_down_aggression_rate')] })).toBe(false);
  });

  it('round-8 fix (Codex round-7 review P1): a denied metadata leaf cannot be laundered back to Tier 1 by appending another property -- classification now checks EVERY path segment, not only the final one', () => {
    expect(classifyEvidenceTier('analytics.staleness_note.length')).toBeNull();
    expect(classifyEvidenceTier('dvoa.source_name.length')).toBeNull();
    expect(classifyEvidenceTier('injuries.freshness.length')).toBeNull();
    expect(classifyEvidenceTier('books.betmgm.source_row_id.length')).toBeNull();
    expect(classifyEvidenceTier('analytics.staleness_note.0')).toBeNull();
    // sanity: a real substantive field several segments deep, with no denied
    // segment anywhere on its path, still classifies Tier 1
    expect(classifyEvidenceTier('player_availability.key_returns[0].status')).toBe(1);
  });

  it('classifies Tier 3 supplementary narrative', () => {
    expect(classifyEvidenceTier('vault_analytical_reads.some_key')).toBe(3);
    expect(classifyEvidenceTier('master_reports.some_key')).toBe(3);
  });

  it('classifies Tier 4 color', () => {
    expect(classifyEvidenceTier('training_camp_intel.buzz')).toBe(4);
  });

  it('round-3 fix: an unrecognized field root classifies as null, NOT Tier 1 (fail-closed)', () => {
    // These are real shapes Codex's second review found in historical raw.json
    // outputs that the round-2 classifier silently treated as Tier 1.
    expect(classifyEvidenceTier('wins.some_field')).toBeNull();
    expect(classifyEvidenceTier('division_afc_east.field')).toBeNull();
    expect(classifyEvidenceTier('conference_afc.field')).toBeNull();
    expect(classifyEvidenceTier('dossier.team_profiles.Bills.analytics')).toBeNull();
    expect(classifyEvidenceTier('team_profiles.Bills.analytics')).toBeNull();
    expect(classifyEvidenceTier('bettorday_trench')).toBeNull();
    expect(classifyEvidenceTier('')).toBeNull();
    expect(classifyEvidenceTier(undefined)).toBeNull();
  });
});

describe('round-4 fix: identity/locator-only fields do not qualify as Tier 1 (Codex final round-3 review)', () => {
  it('classifyEvidenceTier("team") is no longer Tier 1 -- identity metadata, not evidence', () => {
    expect(classifyEvidenceTier('team')).toBeNull();
  });

  it('classifyEvidenceTier for book-name locator fields is no longer Tier 1', () => {
    expect(classifyEvidenceTier('best_book')).toBeNull();
    expect(classifyEvidenceTier('best_over_book')).toBeNull();
    expect(classifyEvidenceTier('best_under_book')).toBeNull();
  });

  it('the paired numeric/price fields that actually carry signal remain Tier 1', () => {
    expect(classifyEvidenceTier('best_price')).toBe(1);
    expect(classifyEvidenceTier('best_prob')).toBe(1);
    expect(classifyEvidenceTier('best_over')).toBe(1);
    expect(classifyEvidenceTier('best_under')).toBe(1);
  });

  it('Codex\'s exact repro: a candidate whose ONLY resolved evidence is "team" is NOT qualifying grounding', () => {
    const c = { evidence_resolved: [resolved('team')] };
    expect(hasQualifyingGrounding(c)).toBe(false);
  });

  it('enforceEvidenceTierGate forces needs_human_review/small on a "team"-only-grounded core candidate (the reported bypass)', () => {
    const c = {
      stake_tier: 'core',
      needs_human_review: false,
      evidence_resolved: [resolved('team')],
    };
    const out = enforceEvidenceTierGate(c);
    expect(out).not.toBe(c);
    expect(out.needs_human_review).toBe(true);
    expect(out.stake_tier).toBe('small');
    expect(out.evidence_tier_enforced).toBe(true);
    // original untouched
    expect(c.needs_human_review).toBe(false);
    expect(c.stake_tier).toBe('core');
  });

  it('a candidate grounded by "team" plus a book-name locator ONLY is still forced to guarded (no real Tier 1/2 support)', () => {
    const c = {
      stake_tier: 'standard',
      needs_human_review: false,
      evidence_resolved: [resolved('team'), resolved('best_over_book')],
    };
    expect(hasQualifyingGrounding(c)).toBe(false);
    const out = enforceEvidenceTierGate(c);
    expect(out.needs_human_review).toBe(true);
    expect(out.stake_tier).toBe('small');
  });

  it('a candidate grounded by "team" alongside a REAL Tier 1 price field is correctly treated as grounded', () => {
    const c = {
      stake_tier: 'core',
      needs_human_review: false,
      evidence_resolved: [resolved('team'), resolved('best_price')],
    };
    expect(hasQualifyingGrounding(c)).toBe(true);
    const out = enforceEvidenceTierGate(c);
    expect(out).toBe(c); // no-op -- genuinely grounded
  });
});

describe('hasQualifyingGrounding', () => {
  it('is true when a resolved evidence_id classifies as Tier 1', () => {
    const c = { evidence_resolved: [resolved('analytics.off_epa_rank')] };
    expect(hasQualifyingGrounding(c)).toBe(true);
  });

  it('round-5 policy change (Andy, 2026-09-09): a resolved Tier 2 citation ALONE is no longer qualifying grounding -- Tier 1 is now mandatory for core/standard', () => {
    const c = { evidence_resolved: [resolved('lean.samples[0].who')] };
    expect(hasQualifyingGrounding(c)).toBe(false);
  });

  it('round-5: a genuinely dated, named Tier 2 citation still does not unlock core/standard without Tier 1 alongside it', () => {
    const c = { evidence_resolved: [resolved('lean.samples[0].who'), resolved('experts.some_analyst')] };
    expect(hasQualifyingGrounding(c)).toBe(false);
  });

  it('round-5: Tier 1 + Tier 2 together is qualifying (Tier 1 is what qualifies; Tier 2 corroborates)', () => {
    const c = { evidence_resolved: [resolved('lean.samples[0].who'), resolved('analytics.off_epa_rank')] };
    expect(hasQualifyingGrounding(c)).toBe(true);
  });

  it('round-5: the original lean.n bypass Codex reproduced is closed by BOTH fixes independently -- lean.n no longer classifies as Tier 2 at all, and even a real Tier 2 no longer qualifies alone', () => {
    const c = { evidence_resolved: [resolved('lean.n')] };
    expect(hasQualifyingGrounding(c)).toBe(false);
  });

  it('round-5: a metadata-only Tier-1-root descendant does not qualify (dvoa.snapshot_at bypass, closed)', () => {
    const c = { evidence_resolved: [resolved('dvoa.snapshot_at')] };
    expect(hasQualifyingGrounding(c)).toBe(false);
  });

  it('is false when resolved evidence is Tier 3/4 narrative only', () => {
    const c = {
      evidence_resolved: [resolved('vault_analytical_reads.some_key'), resolved('training_camp_intel.buzz')],
    };
    expect(hasQualifyingGrounding(c)).toBe(false);
  });

  it('is false when there is no resolved evidence at all (empty evidence_ids)', () => {
    expect(hasQualifyingGrounding({ evidence_resolved: [] })).toBe(false);
    expect(hasQualifyingGrounding({})).toBe(false);
  });

  it('is false when evidence is present but unresolved', () => {
    const c = { evidence_resolved: [unresolved('analytics.off_epa_rank')] };
    expect(hasQualifyingGrounding(c)).toBe(false);
  });

  it('round-3 fix: is false when all resolved evidence_ids are unrecognized shapes', () => {
    const c = {
      evidence_resolved: [resolved('wins.some_field'), resolved('dossier.team_profiles.Bills.analytics')],
    };
    expect(hasQualifyingGrounding(c)).toBe(false);
  });

  it('is true when at least one resolved id is Tier 1/2 even alongside narrative/unrecognized ids', () => {
    const c = {
      evidence_resolved: [
        resolved('vault_analytical_reads.some_key'),
        resolved('wins.some_field'),
        resolved('analytics.off_epa_rank'),
      ],
    };
    expect(hasQualifyingGrounding(c)).toBe(true);
  });
});

describe('evidenceTierViolations (annotate-and-keep)', () => {
  it('returns no violations for a properly grounded core/standard candidate', () => {
    const c = {
      stake_tier: 'core',
      needs_human_review: false,
      evidence_resolved: [resolved('analytics.off_epa_rank')],
    };
    expect(evidenceTierViolations(c)).toEqual([]);
  });

  it('flags a narrative-only candidate sized core with two violations (tier cap + review flag)', () => {
    const c = {
      stake_tier: 'core',
      needs_human_review: false,
      evidence_resolved: [resolved('vault_analytical_reads.some_key')],
    };
    const violations = evidenceTierViolations(c);
    expect(violations.length).toBe(2);
    expect(violations.some((v) => v.includes('evidence_tier_gate'))).toBe(true);
    expect(violations.some((v) => v.includes('needs_human_review'))).toBe(true);
  });

  it('flags an unrecognized-evidence-only candidate the same as narrative-only (fail-closed)', () => {
    const c = {
      stake_tier: 'standard',
      needs_human_review: false,
      evidence_resolved: [resolved('wins.some_field')],
    };
    expect(evidenceTierViolations(c).length).toBe(2);
  });

  it('flags a zero-evidence candidate sized core/unflagged', () => {
    const c = { stake_tier: 'core', needs_human_review: false, evidence_resolved: [] };
    expect(evidenceTierViolations(c).length).toBe(2);
  });

  it('does not double-flag a narrative-only candidate already small + needs_human_review', () => {
    const c = {
      stake_tier: 'small',
      needs_human_review: true,
      evidence_resolved: [resolved('training_camp_intel.buzz')],
    };
    expect(evidenceTierViolations(c)).toEqual([]);
  });

  it('does not mutate the input candidate', () => {
    const c = { stake_tier: 'core', needs_human_review: false, evidence_resolved: [resolved('wins.x')] };
    const snapshot = JSON.stringify(c);
    evidenceTierViolations(c);
    expect(JSON.stringify(c)).toBe(snapshot);
  });
});

describe('enforceEvidenceTierGate (round-3 real normalization, not just annotation)', () => {
  it('leaves a properly grounded candidate completely unchanged', () => {
    const c = {
      stake_tier: 'core',
      needs_human_review: false,
      evidence_resolved: [resolved('analytics.off_epa_rank')],
    };
    const out = enforceEvidenceTierGate(c);
    expect(out).toBe(c); // same reference — no-op path
    expect(out.evidence_tier_enforced).toBeUndefined();
  });

  it('forces needs_human_review=true and downgrades stake_tier to small for a core, narrative-only candidate', () => {
    const c = {
      stake_tier: 'core',
      needs_human_review: false,
      evidence_resolved: [resolved('vault_analytical_reads.some_key')],
    };
    const out = enforceEvidenceTierGate(c);
    expect(out).not.toBe(c); // new object, not mutated in place
    expect(out.needs_human_review).toBe(true);
    expect(out.stake_tier).toBe('small');
    expect(out.evidence_tier_enforced).toBe(true);
    // original candidate object must be untouched (round-2's bug class)
    expect(c.needs_human_review).toBe(false);
    expect(c.stake_tier).toBe('core');
  });

  it('forces the same normalization for an unrecognized-evidence-only candidate', () => {
    const c = {
      stake_tier: 'standard',
      needs_human_review: false,
      evidence_resolved: [resolved('dossier.team_profiles.Bills.analytics')],
    };
    const out = enforceEvidenceTierGate(c);
    expect(out.needs_human_review).toBe(true);
    expect(out.stake_tier).toBe('small');
    expect(out.evidence_tier_enforced).toBe(true);
  });

  it('forces normalization for a zero-evidence candidate (empty evidence_ids bypass, closed)', () => {
    const c = { stake_tier: 'core', needs_human_review: false, evidence_resolved: [] };
    const out = enforceEvidenceTierGate(c);
    expect(out.needs_human_review).toBe(true);
    expect(out.stake_tier).toBe('small');
  });

  it('keeps an already-speculative stake_tier as-is (does not force it up to small)', () => {
    const c = {
      stake_tier: 'speculative',
      needs_human_review: false,
      evidence_resolved: [resolved('training_camp_intel.buzz')],
    };
    const out = enforceEvidenceTierGate(c);
    expect(out.stake_tier).toBe('speculative');
    expect(out.needs_human_review).toBe(true);
  });

  it('is a true no-op (same reference) when already needs_human_review=true and capped', () => {
    const c = {
      stake_tier: 'small',
      needs_human_review: true,
      evidence_resolved: [resolved('vault_analytical_reads.x')],
    };
    const out = enforceEvidenceTierGate(c);
    expect(out).toBe(c);
  });
});

describe('sim-price-only exclusion (round-3, Codex P2 exacta fix)', () => {
  it('isSimPriceOnlyCandidate is true only for superbowl_matchup', () => {
    expect(isSimPriceOnlyCandidate({ market: 'superbowl_matchup' })).toBe(true);
    expect(isSimPriceOnlyCandidate({ market: 'wins' })).toBe(false);
    expect(isSimPriceOnlyCandidate({ market: 'most_wins' })).toBe(false);
  });

  it('partitionSimPriceOnly separates superbowl_matchup candidates into excluded, tagged with a reason', () => {
    const candidates = [
      { market: 'wins', selection: 'Bills Over' },
      { market: 'superbowl_matchup', selection: 'Chiefs/49ers exacta' },
      { market: 'most_wins', selection: 'Chiefs' },
    ];
    const { kept, excluded } = partitionSimPriceOnly(candidates);
    expect(kept.length).toBe(2);
    expect(kept.map((c) => c.market)).toEqual(['wins', 'most_wins']);
    expect(excluded.length).toBe(1);
    expect(excluded[0].market).toBe('superbowl_matchup');
    expect(excluded[0].excluded_reason).toMatch(/sim_price_only_market/);
    expect(excluded[0].excluded_reason).toMatch(/locked decision #4/);
    expect(excluded[0].stage).toBe('board_validator');
  });

  it('does not mutate the input array or its candidates', () => {
    const original = { market: 'superbowl_matchup', selection: 'Chiefs/49ers exacta' };
    const candidates = [original];
    const { excluded } = partitionSimPriceOnly(candidates);
    expect(excluded[0]).not.toBe(original);
    expect(original.excluded_reason).toBeUndefined();
  });

  it('handles an empty list', () => {
    const { kept, excluded } = partitionSimPriceOnly([]);
    expect(kept).toEqual([]);
    expect(excluded).toEqual([]);
  });

  it('exacta case: a superbowl_matchup candidate whose only resolved evidence collides via team_a-only merge is excluded from final regardless of its evidence tier classification', () => {
    // Real bug shape: teamProfileForRow() only merges team_a's profile for
    // superbowl_matchup rows, so team_b's evidence is unrepresented and can
    // collide with team_a's same-named fields. Rather than trust tier
    // classification for this market, it must never reach `final` at all.
    const candidate = {
      market: 'superbowl_matchup',
      selection: 'Chiefs/49ers exacta',
      stake_tier: 'core',
      needs_human_review: false,
      evidence_resolved: [resolved('analytics.off_epa_rank')], // looks Tier 1, but only reflects team_a
    };
    const { kept, excluded } = partitionSimPriceOnly([candidate]);
    expect(kept).toEqual([]);
    expect(excluded.length).toBe(1);
  });
});

describe('Tier-4-only exclusion (round 5, Andy\'s 2026-09-09 clarification: Tier 4 never originates a play)', () => {
  it('isTier4OnlyCandidate is true when all resolved evidence is Tier 4 (a simple, non-adversarial case -- see the round-6 describe block below for the corrected bypass-resistant predicate)', () => {
    expect(isTier4OnlyCandidate({ evidence_resolved: [resolved('training_camp_intel.buzz')] })).toBe(true);
    expect(isTier4OnlyCandidate({
      evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('training_camp_intel.snap_counts')],
    })).toBe(true);
  });

  it('isTier4OnlyCandidate is false when any Tier 1/2/3 evidence is present alongside Tier 4', () => {
    expect(isTier4OnlyCandidate({
      evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('analytics.off_epa_rank')],
    })).toBe(false);
    expect(isTier4OnlyCandidate({
      evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('vault_analytical_reads.some_key')],
    })).toBe(false);
  });

  it('isTier4OnlyCandidate is false for zero resolved evidence (that is the ordinary evidence_tier_gate path, not this one)', () => {
    expect(isTier4OnlyCandidate({ evidence_resolved: [] })).toBe(false);
    expect(isTier4OnlyCandidate({})).toBe(false);
  });

  it('isTier4OnlyCandidate is false when resolved evidence is Tier 3 (Tier 3 can still originate a small/speculative play alone -- unchanged)', () => {
    expect(isTier4OnlyCandidate({ evidence_resolved: [resolved('vault_analytical_reads.some_key')] })).toBe(false);
  });

  it('partitionTier4Only excludes a Tier-4-only candidate from `final`, tagged with a reason, mirroring partitionSimPriceOnly', () => {
    const candidates = [
      { market: 'wins', selection: 'Bills Over', evidence_resolved: [resolved('analytics.off_epa_rank')] },
      { market: 'playoffs', selection: 'Chargers', evidence_resolved: [resolved('training_camp_intel.buzz')] },
    ];
    const { kept, excluded } = partitionTier4Only(candidates);
    expect(kept.length).toBe(1);
    expect(kept[0].selection).toBe('Bills Over');
    expect(excluded.length).toBe(1);
    expect(excluded[0].selection).toBe('Chargers');
    expect(excluded[0].excluded_reason).toMatch(/tier4_only_evidence/);
    expect(excluded[0].stage).toBe('board_validator');
  });

  it('partitionTier4Only does not mutate the input candidates', () => {
    const original = { market: 'playoffs', selection: 'Chargers', evidence_resolved: [resolved('training_camp_intel.buzz')] };
    const { excluded } = partitionTier4Only([original]);
    expect(excluded[0]).not.toBe(original);
    expect(original.excluded_reason).toBeUndefined();
  });

  it('partitionTier4Only keeps a Tier-3-only candidate (still allowed to originate small/speculative -- only Tier 4 alone is excluded)', () => {
    const candidates = [
      { market: 'playoffs', selection: 'Chargers narrative-only', evidence_resolved: [resolved('vault_analytical_reads.some_key')] },
    ];
    const { kept, excluded } = partitionTier4Only(candidates);
    expect(kept.length).toBe(1);
    expect(excluded.length).toBe(0);
  });

  it('handles an empty list', () => {
    const { kept, excluded } = partitionTier4Only([]);
    expect(kept).toEqual([]);
    expect(excluded).toEqual([]);
  });

  describe('round-6 fix (Codex round-5 review P1): "isTier4OnlyCandidate is bypassable with non-evidence"', () => {
    it("Codex's exact repro 1: Tier 4 + a resolved non-qualifying field (team) is still excluded, not kept", () => {
      const c = { evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('team')] };
      expect(isTier4OnlyCandidate(c)).toBe(true);
    });

    it("Codex's exact repro 2: Tier 4 + a resolved unrecognized field is still excluded, not kept", () => {
      const c = { evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('wins.some_field')] };
      expect(isTier4OnlyCandidate(c)).toBe(true);
    });

    it("Codex's exact repro 3: an UNRESOLVED Tier-4 citation alone (no resolved evidence at all) is still excluded, not kept", () => {
      const c = { evidence_resolved: [unresolved('training_camp_intel.buzz')] };
      expect(isTier4OnlyCandidate(c)).toBe(true);
    });

    it('confirms the case Codex verified was already correct: Tier 4 + a resolved Tier 3 citation is correctly KEPT (real corroboration alongside color)', () => {
      const c = { evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('vault_analytical_reads.some_key')] };
      expect(isTier4OnlyCandidate(c)).toBe(false);
    });

    it('Tier 4 + a resolved Tier 1 citation is correctly kept (real grounding alongside color)', () => {
      const c = { evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('analytics.off_epa_rank')] };
      expect(isTier4OnlyCandidate(c)).toBe(false);
    });

    it('Tier 4 + a resolved Tier 2 citation is correctly kept', () => {
      const c = { evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('lean.samples[0].who')] };
      expect(isTier4OnlyCandidate(c)).toBe(false);
    });

    it('no Tier 4 citation at all (even with only unrecognized/non-qualifying evidence) is NOT this case -- that is the ordinary evidence_tier_gate path', () => {
      expect(isTier4OnlyCandidate({ evidence_resolved: [resolved('team')] })).toBe(false);
      expect(isTier4OnlyCandidate({ evidence_resolved: [] })).toBe(false);
    });

    it('partitionTier4Only excludes the corrected bypass cases end to end', () => {
      const candidates = [
        { market: 'playoffs', selection: 'A', evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('team')] },
        { market: 'playoffs', selection: 'B', evidence_resolved: [unresolved('training_camp_intel.buzz')] },
        { market: 'playoffs', selection: 'C', evidence_resolved: [resolved('training_camp_intel.buzz'), resolved('vault_analytical_reads.x')] },
      ];
      const { kept, excluded } = partitionTier4Only(candidates);
      expect(kept.map((c) => c.selection)).toEqual(['C']);
      expect(excluded.map((c) => c.selection).sort()).toEqual(['A', 'B']);
    });
  });
});

describe('resolvePath() (round 8, Codex round-7 review P1: moved from portfolio-synthesize.js and hardened)', () => {
  it('resolves ordinary nested paths and array indices, unaffected by the hardening', () => {
    const obj = { analytics: { off_epa_rank: 4 }, lean: { samples: [{ who: 'Analyst A', dir: 'over' }] } };
    expect(resolvePath(obj, 'analytics.off_epa_rank')).toBe(4);
    expect(resolvePath(obj, 'lean.samples[0].who')).toBe('Analyst A');
  });

  it('does not resolve past a primitive leaf -- a further segment on an already-terminal string/number fails, closing the .length / numeric-string-index bypass', () => {
    const obj = { analytics: { staleness_note: 'a fairly long provenance note here' } };
    expect(resolvePath(obj, 'analytics.staleness_note')).toBe(obj.analytics.staleness_note);
    expect(resolvePath(obj, 'analytics.staleness_note.length')).toBeUndefined();
    expect(resolvePath(obj, 'analytics.staleness_note.0')).toBeUndefined();
    const withNumber = { dvoa: { overall_dvoa: 12.5 } };
    expect(resolvePath(withNumber, 'dvoa.overall_dvoa.toFixed')).toBeUndefined();
  });

  it('does not resolve inherited/prototype-chain properties -- closes the constructor/toString/__proto__ bypass', () => {
    const obj = { analytics: { off_epa_rank: 4 } };
    expect(resolvePath(obj, 'analytics.constructor')).toBeUndefined();
    expect(resolvePath(obj, 'analytics.toString')).toBeUndefined();
    expect(resolvePath(obj, 'analytics.__proto__')).toBeUndefined();
    expect(resolvePath(obj, 'analytics.hasOwnProperty')).toBeUndefined();
    expect(resolvePath(obj, 'analytics.prototype')).toBeUndefined();
  });

  it('rejects out-of-range and non-array numeric indexing', () => {
    const obj = { lean: { samples: [{ who: 'A' }] } };
    expect(resolvePath(obj, 'lean.samples[5].who')).toBeUndefined();
    expect(resolvePath(obj, 'lean.samples[-1].who')).toBeUndefined();
  });

  it('still returns undefined for a missing own property (not every access should be treated as an attack)', () => {
    const obj = { analytics: { off_epa_rank: 4 } };
    expect(resolvePath(obj, 'analytics.nonexistent_field')).toBeUndefined();
  });

  it('round-9 fix (Codex round-8 review, concrete P1): array `length` is an own but NON-enumerable property -- hasOwnProperty() alone let it through; propertyIsEnumerable() now correctly rejects it, closing the exact `lean.samples.length` bare-count bypass Codex found', () => {
    const obj = { lean: { samples: [{ who: 'A', dir: 'over' }, { who: 'B', dir: 'under' }] } };
    expect(resolvePath(obj, 'lean.samples.length')).toBeUndefined();
    // sanity: ordinary own+enumerable array-element access is unaffected
    expect(resolvePath(obj, 'lean.samples[0].who')).toBe('A');
    expect(resolvePath(obj, 'lean.samples[1].dir')).toBe('under');
  });

  it('round-10 fix (Codex round-9 review P2 hardening): a numeric array index now also requires an own, enumerable element -- a sparse-array slot backed only by a polluted Array.prototype no longer resolves', () => {
    const samples = new Array(1); // hole at index 0 -- in-bounds, but no own element
    // per Codex's round-10 review: preserve/restore any pre-existing descriptor at
    // this index rather than a blind delete, for cleaner test isolation (no real
    // environment should have one, but this doesn't assume that).
    const priorDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, 0);
    Array.prototype[0] = { who: 'prototype-injected' };
    try {
      expect(resolvePath({ lean: { samples } }, 'lean.samples[0].who')).toBeUndefined();
    } finally {
      if (priorDescriptor) Object.defineProperty(Array.prototype, 0, priorDescriptor);
      else delete Array.prototype[0];
    }
    // sanity: ordinary in-bounds numeric indexing into a real (non-sparse) array is unaffected
    const ok = { lean: { samples: [{ who: 'A' }, { who: 'B' }] } };
    expect(resolvePath(ok, 'lean.samples[0].who')).toBe('A');
    expect(resolvePath(ok, 'lean.samples[1].who')).toBe('B');
  });
});

describe('effectiveEvidenceTier() -- prior-season Tier 1 cap (Andy\'s "cap it lower" policy decision, 2026-09-09)', () => {
  it('a Tier 1 citation with no is_current_season info on the entry classifies normally', () => {
    expect(effectiveEvidenceTier({ id: 'analytics.off_epa_rank', resolved: true })).toBe(1);
  });

  it('a Tier 1 citation explicitly stamped is_current_season: true classifies normally', () => {
    expect(effectiveEvidenceTier({ id: 'analytics.off_epa_rank', resolved: true, is_current_season: true })).toBe(1);
  });

  it('a Tier 1 citation stamped is_current_season: false is capped to Tier 2 -- real data, honestly labeled, but can no longer originate a pick alone', () => {
    expect(effectiveEvidenceTier({ id: 'analytics.off_epa_rank', resolved: true, is_current_season: false })).toBe(2);
    expect(effectiveEvidenceTier({ id: 'dvoa.off_rank', resolved: true, is_current_season: false })).toBe(2);
    expect(effectiveEvidenceTier({ id: 'coaching_profile.hc_tenure', resolved: true, is_current_season: false })).toBe(2);
  });

  it('the cap only applies to a real Tier 1 classification -- Tier 2/3/4 and null-tier citations are unaffected by is_current_season', () => {
    expect(effectiveEvidenceTier({ id: 'lean.samples[0].who', resolved: true, is_current_season: false })).toBe(2);
    expect(effectiveEvidenceTier({ id: 'vault_analytical_reads.some_key', resolved: true, is_current_season: false })).toBe(3);
    expect(effectiveEvidenceTier({ id: 'training_camp_intel.buzz', resolved: true, is_current_season: false })).toBe(4);
    expect(effectiveEvidenceTier({ id: 'analytics.staleness_note', resolved: true, is_current_season: false })).toBeNull();
  });

  it('hasQualifyingGrounding: a candidate whose only resolved citation is prior-season Tier 1 data no longer qualifies on its own', () => {
    const staleOnly = { evidence_resolved: [{ id: 'analytics.off_epa_rank', resolved: true, is_current_season: false }] };
    expect(hasQualifyingGrounding(staleOnly)).toBe(false);

    const mixed = { evidence_resolved: [
      { id: 'analytics.off_epa_rank', resolved: true, is_current_season: false },
      { id: 'injuries.qb_status', resolved: true, is_current_season: true },
    ] };
    expect(hasQualifyingGrounding(mixed)).toBe(true);
  });

  it('evidenceTierViolations/enforceEvidenceTierGate: a core-tier candidate grounded ONLY in stale prior-season data is forced to small/speculative + needs_human_review, same as any other non-qualifying candidate', () => {
    const candidate = {
      stake_tier: 'core',
      needs_human_review: false,
      evidence_resolved: [{ id: 'analytics.off_epa_rank', resolved: true, is_current_season: false }],
    };
    const violations = evidenceTierViolations(candidate);
    expect(violations.length).toBeGreaterThan(0);
    const enforced = enforceEvidenceTierGate(candidate);
    expect(enforced.needs_human_review).toBe(true);
    expect(['small', 'speculative']).toContain(enforced.stake_tier);
  });

  it('isTier4OnlyCandidate: prior-season Tier 1 data, capped to Tier 2, still counts as genuine Tier 2 corroboration -- it is real evidence, just not enough to ORIGINATE a pick alone, so it correctly still prevents the Tier4-only exclusion (same as an ordinary dated analyst quote would)', () => {
    const staleCorroboration = { evidence_resolved: [
      { id: 'training_camp_intel.buzz', resolved: true },
      { id: 'analytics.off_epa_rank', resolved: true, is_current_season: false },
    ] };
    expect(isTier4OnlyCandidate(staleCorroboration)).toBe(false);

    const noCorroborationAtAll = { evidence_resolved: [
      { id: 'training_camp_intel.buzz', resolved: true },
    ] };
    expect(isTier4OnlyCandidate(noCorroborationAtAll)).toBe(true);
  });
});

describe('isCurrentSeasonForEvidence() (round 9, Codex round-8 review P1: nested-path/bare-root bypass + mixed-source field provenance)', () => {
  it('resolves a citation nested several levels under a Tier-1 root that only stamps the flag at the root -- closes the nested-path bypass', () => {
    const dossierRow = {
      analytics: {
        is_current_season: false,
        raw: { ftn_charting: { blitz_rate_faced: 0.31 } },
      },
      coaching_profile: {
        is_current_season: false,
        ats_by_role: { overall: { wins: 9 } },
      },
    };
    expect(isCurrentSeasonForEvidence('analytics.raw.ftn_charting.blitz_rate_faced', dossierRow)).toBe(false);
    expect(isCurrentSeasonForEvidence('coaching_profile.ats_by_role.overall.wins', dossierRow)).toBe(false);
  });

  it('resolves a bare-root citation (no dotted parent at all) against the root object itself -- closes the bare-root bypass', () => {
    const dossierRow = { analytics: { is_current_season: false, off_epa_rank: 4 } };
    expect(isCurrentSeasonForEvidence('analytics', dossierRow)).toBe(false);

    const freshRoot = { dvoa: { is_current_season: true, off_rank: 2 } };
    expect(isCurrentSeasonForEvidence('dvoa', freshRoot)).toBe(true);
  });

  it('returns null (not falsely current) for a bare top-level id with no season flag anywhere -- e.g. fair_prob, a Tier-1 field with no dotted parent and no season metadata', () => {
    const dossierRow = { fair_prob: 0.55 };
    expect(isCurrentSeasonForEvidence('fair_prob', dossierRow)).toBeNull();
  });

  it('resolves a mixed-source analytics field against ITS OWN source season, not the merged root flag -- a base-only field must not inherit advanced\'s freshness (or vice versa)', () => {
    // Mirrors mergeAnalytics()'s real output shape: base (current_season stats,
    // stale) merged with advanced (team_analytic_snapshots, fresh) under one
    // root is_current_season -- here the LATER spread (advanced) left the
    // root flag true, even though pass_rate is a base-only field that is
    // actually stale.
    const dossierRow = {
      analytics: {
        is_current_season: true, // advanced's flag won the flat spread
        seasons_behind: 0,
        pass_rate: 0.58, // base-only field
        cpoe: 1.2, // advanced-only field
        field_provenance: {
          base_season: { is_current_season: false, seasons_behind: 1 },
          base_only_fields: ['season', 'pass_rate'],
        },
      },
    };
    // base-only field resolves against base's own (stale) season stamp.
    expect(isCurrentSeasonForEvidence('analytics.pass_rate', dossierRow)).toBe(false);
    // advanced-owned field resolves against the merged root's (fresh) flag,
    // since field_provenance only lists base-only fields.
    expect(isCurrentSeasonForEvidence('analytics.cpoe', dossierRow)).toBe(true);
  });

  it('treats a bare-root citation of a mixed-source object as stale if EITHER source is stale', () => {
    const bothFresh = {
      analytics: {
        is_current_season: true,
        field_provenance: { base_season: { is_current_season: true }, base_only_fields: ['pass_rate'] },
      },
    };
    expect(isCurrentSeasonForEvidence('analytics', bothFresh)).toBe(true);

    const baseStale = {
      analytics: {
        is_current_season: true,
        field_provenance: { base_season: { is_current_season: false }, base_only_fields: ['pass_rate'] },
      },
    };
    expect(isCurrentSeasonForEvidence('analytics', baseStale)).toBe(false);
  });

  it('returns null for an unresolvable id or missing dossier row, without throwing', () => {
    expect(isCurrentSeasonForEvidence('', {})).toBeNull();
    expect(isCurrentSeasonForEvidence('nonexistent.path', {})).toBeNull();
    expect(isCurrentSeasonForEvidence('analytics.off_epa_rank', null)).toBeNull();
  });
});
