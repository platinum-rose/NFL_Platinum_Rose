// rev-23-followup3 (Codex finding #1): "Test the fully assembled system
// prompt, not merely the source template." A unit test on
// placeableSportsbookOnlyPromptSentence() alone (see executionVenues.test.js)
// proves the sentence itself is clean, but does not prove nothing else in
// buildScopedSystemPrompt() -- or a stale import still wired to the old
// placeableVenuesPromptSentence() -- reintroduces prediction-market
// language into the actual string sent to the model. This file calls the
// real, exported buildScopedSystemPrompt() (and, for completeness, the
// Risk/Editor scoped prompts) and scans the ASSEMBLED output.
import { describe, expect, it } from 'vitest';
import {
  SCOPED_RISK_EDITOR_SYSTEM_PROMPT,
  buildScopedRiskEditorUserPrompt,
  buildScopedSystemPrompt,
  buildScopedUserPrompt,
} from '../../agents/lib/scoped-prompts.js';

const FORBIDDEN_SUBSTRINGS = [
  'kalshi',
  'polymarket',
  'prediction market',
  'prediction-market',
  'execution-eligible',
  'execution eligible',
  // rev-23-followup4 fix (Codex finding #4): the complete forbidden-concept
  // list for this scoped run, not only prediction-market terms -- removed
  // Tier 3/4 evidence lanes, the unsupplied official-tracking-contract
  // instruction, division-based language, and every scenario-book/
  // structural container name (defense in depth alongside
  // suppressedRunIntegration.test.js's own scan of these same builders).
  'vault_analytical_reads',
  'master_reports',
  'training_camp_intel',
  'tier 3',
  'tier 4',
  'official tracking',
  'official paper tracking',
  'division',
  'hedge_basket',
  'parlay_ladder',
  'portfolio_strategy',
  'scenario_review',
  'correlated_week1',
  'correlated_positions',
];

function assertNoForbiddenLanguage(text, label) {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_SUBSTRINGS) {
    expect(lower, `${label} must not contain "${term}"`).not.toContain(term);
  }
}

describe('assembled scoped Stage-1 system prompt (rev-23-followup3, Codex finding #1)', () => {
  it('buildScopedSystemPrompt(maxPlays) output contains no prediction-market language at any maxPlays value', () => {
    for (const maxPlays of [1, 12, 20]) {
      const prompt = buildScopedSystemPrompt(maxPlays);
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      assertNoForbiddenLanguage(prompt, `buildScopedSystemPrompt(${maxPlays})`);
    }
  });

  it('buildScopedSystemPrompt(maxPlays) still carries the sportsbook-only DISCIPLINE sentence verbatim', () => {
    const prompt = buildScopedSystemPrompt(12);
    expect(prompt).toContain('PLACEABLE BOOKS ONLY:');
    // Every real sportsbook name must still be present -- this is a
    // sportsbook-only rewrite, not a deletion of the venue-discipline
    // instruction entirely.
    expect(prompt).toContain('BetMGM');
    expect(prompt).toContain('Caesars');
    expect(prompt).toContain('Circa');
    expect(prompt).toContain('DraftKings');
    expect(prompt).toContain('FanDuel');
  });

  it('SCOPED_RISK_EDITOR_SYSTEM_PROMPT contains no prediction-market language', () => {
    assertNoForbiddenLanguage(SCOPED_RISK_EDITOR_SYSTEM_PROMPT, 'SCOPED_RISK_EDITOR_SYSTEM_PROMPT');
  });

  it('buildScopedUserPrompt(dossier) output contains no prediction-market language', () => {
    const dossier = {
      synthesis_input: {
        wins: [{ team_nick: 'DAL', fair_prob: 0.5 }],
        playoffs: [{ team_nick: 'DAL', fair_prob: 0.5 }],
      },
    };
    const prompt = buildScopedUserPrompt(dossier);
    expect(typeof prompt).toBe('string');
    assertNoForbiddenLanguage(prompt, 'buildScopedUserPrompt(dossier)');
  });

  it('buildScopedRiskEditorUserPrompt(candidates) output contains no prediction-market language', () => {
    const candidates = [{ key: 'k1', market: 'wins', selection: 'DAL over 9.5' }];
    const prompt = buildScopedRiskEditorUserPrompt(candidates);
    expect(typeof prompt).toBe('string');
    assertNoForbiddenLanguage(prompt, 'buildScopedRiskEditorUserPrompt(candidates)');
  });
});
