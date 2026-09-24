// tests/unit/suppressedRunIntegration.test.js
//
// rev-23-followup3 fix (Codex finding #5): "Add permanent offline
// integration coverage for the assembled suppressed contract: actual
// scoped prompt strings, final raw payload, HTML/Markdown omission,
// proposal payload assertion, known alias/evidence-root rejection, and
// frozen dossier provenance. No paid/model calls, prompt-only mode,
// Supabase access, or production artifact writes."
//
// This file ties together the REAL exported building blocks of a
// suppressed (--suppress-scenario-structures, frozen pre-kickoff) run in
// the same order agents/portfolio-synthesize.js actually calls them, so a
// regression in how the pieces fit TOGETHER is caught even though each
// piece already has its own focused unit tests elsewhere
// (scopedPrompts.test.js, scopeEnforcement.test.js, committeeStages.test.js,
// dossierProvenance.test.js). Nothing here makes a network call, calls a
// model, touches Supabase, or writes into a production output directory --
// every write goes to a fresh os.tmpdir() directory removed after the test.
//
// DISCLOSED LIMITATION (unchanged from every prior review round):
// agents/portfolio-synthesize.js is one top-level IIFE with no exports at
// all, and its top-level module body has real side effects on import
// (argv-driven `process.exit(1)` when --dossier is missing, and the async
// IIFE itself, which would attempt real model calls). It genuinely cannot
// be imported as a module in a test. That means renderHTML()/renderMD() --
// the two functions that actually perform "HTML/Markdown omission" -- are
// not callable here. The "HTML/Markdown omission" requirement below is
// therefore covered by a STRUCTURAL source check (the suppressed-mode
// scenario-book/hedge/ladder sections are still gated behind `suppressed
// ? '' : ...` / `if (!suppressed) { ... }` in the actual shipped source),
// not a live execution test. Closing this gap for real would mean
// extracting renderHTML/renderMD (and the ~50 shared label/format helpers
// they call) into their own importable module -- a real refactor, not a
// focused fix, and is flagged as an unresolved concern in this round's
// review packet for Codex to weigh in on.
//
// rev-23-followup4 (Codex finding #9): this limitation is UNCHANGED by this
// round's fixes -- no extraction/refactor of renderHTML()/renderMD() (or
// the CLI's other unexported helpers) was performed, and none of the tests
// below claim otherwise. Every test in this file that names a "real",
// "actual", or "end to end" code path below means it literally imports and
// calls that real exported function (buildScopedSystemPrompt,
// quarantineStage1, assertScopeClean, applySkepticVerdicts, applyRiskEditor,
// runRiskEditorStage, computeDossierProvenance,
// assertDossierProvenancePinned, assertDossierProvenanceApproved,
// buildRunIdentity, buildFailureAuditArtifact) -- the ONE exception,
// labeled explicitly as such at its own test below, is the HTML/Markdown
// omission check, which is a source-regex structural check, not a call
// into renderHTML()/renderMD() themselves, and is never described as
// "end-to-end execution" anywhere in this file.

import { readFile as readFileAsync, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  buildScopedSystemPrompt,
  buildScopedUserPrompt,
  buildScopedRiskEditorUserPrompt,
  SCOPED_RISK_EDITOR_SYSTEM_PROMPT,
} from '../../agents/lib/scoped-prompts.js';
import { quarantineStage1, assertScopeClean } from '../../agents/lib/scope-enforcement.js';
import { applySkepticVerdicts, applyRiskEditor, runRiskEditorStage } from '../../agents/lib/committee.js';
import { computeDossierProvenance, assertDossierProvenancePinned, assertDossierProvenanceApproved } from '../../agents/lib/dossier-provenance.js';
import { buildRunIdentity, buildFailureAuditArtifact } from '../../agents/lib/audit-artifact.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYNTH_SOURCE = await readFileAsync(path.join(__dirname, '../../agents/portfolio-synthesize.js'), 'utf8');

function fakeStage1ModelText(overrides = {}) {
  const body = {
    recommendations: [{
      market: 'wins', selection: 'DAL over 9.5', type: 'value', edge_type: 'thesis', book: 'draftkings',
      price: -110, model_fair_prob: 0.58, edge_pct: 6.1, confidence: 62, stake_tier: 'standard',
      knowledge_based: false, market_view: 'mv', football_view: 'fv', thesis: 't', disconfirming_factor: 'd',
      bet_threshold: '-120', needs_human_review: false, evidence_ids: ['analytics.off_epa_rank'], sources: ['analyst-x'],
      timing: { action: 'bet_now', trigger: 'tr', expected_move: 'em', rationale: 'r' },
    }],
    watch: [{ market: 'playoffs', selection: 'SEA', why: 'on the radar' }],
    portfolio_notes: 'notes',
    ...overrides,
  };
  return JSON.stringify(body);
}

describe('assembled suppressed-run contract — integration (rev-23-followup3, Codex finding #5)', () => {
  it('actual scoped prompt strings: buildScopedSystemPrompt/buildScopedUserPrompt/buildScopedRiskEditorUserPrompt/SCOPED_RISK_EDITOR_SYSTEM_PROMPT contain no prediction-market or scenario-structure language', () => {
    const dossier = { synthesis_input: { wins: [{ team_nick: 'DAL' }], playoffs: [{ team_nick: 'DAL' }] } };
    const strings = [
      buildScopedSystemPrompt(12),
      buildScopedUserPrompt(dossier),
      SCOPED_RISK_EDITOR_SYSTEM_PROMPT,
      buildScopedRiskEditorUserPrompt([{ key: 'k1', market: 'wins', selection: 'DAL over 9.5' }]),
    ];
    for (const s of strings) {
      const lower = s.toLowerCase();
      // rev-23-followup4 fix (Codex finding #4): the complete forbidden-
      // concept list, not only prediction-market/scenario-structure terms --
      // see tests/unit/scopedPrompts.test.js for the same expanded list
      // applied to each builder individually; this is the SAME check
      // against the assembled strings used TOGETHER, in CLI call order.
      for (const term of [
        'kalshi', 'polymarket', 'prediction market', 'prediction-market',
        'hedge_basket', 'parlay_ladder', 'correlated_week1', 'correlated_positions',
        'vault_analytical_reads', 'master_reports', 'training_camp_intel',
        'tier 3', 'tier 4', 'official tracking', 'official paper tracking', 'division',
      ]) {
        expect(lower, `assembled prompt string must not contain "${term}"`).not.toContain(term);
      }
    }
  });

  it('final raw payload: a simulated Stage-1 model response flows through quarantineStage1 -> assertScopeClean cleanly when in-scope, and the SAME shape rejects a leaked known alias', () => {
    const parsed = JSON.parse(fakeStage1ModelText());
    const cleaned = quarantineStage1(parsed);
    const byModel = { modelA: cleaned };
    const final = cleaned.recommendations.map((r) => ({ key: 'modelA:0', ...r }));
    const watchlistReview = [];
    const reportFacing = { byModel, candidates: final, final, passed: [], killed: [], watchlistReview, portfolioStrategy: null, scenarioReview: null };
    expect(() => assertScopeClean(reportFacing)).not.toThrow();

    // Same payload shape, but with a leaked known alias inside a proposal
    // draft -- exactly the shape the real CLI's second assertScopeClean()
    // call checks (official_proposal_drafts_full), and exactly the leak
    // rev-23-followup3 finding #2 closed.
    const leaked = {
      ...reportFacing,
      official_proposal_drafts_full: [{ pick_id: 'p1', market: 'wins', correlated_positions: ['x'] }],
    };
    expect(() => assertScopeClean(leaked)).toThrow(/forbidden key "correlated_positions"/);
  });

  it('rev-23-followup4 fix (Codex finding #2): a real quarantineStage1() output\'s __quarantine audit trail (documenting an actually-removed out-of-scope row) does not itself trip the CLI\'s first assertScopeClean() call', () => {
    // This is the exact reachable production shape: byModel[model] IS
    // quarantineStage1()'s return value, which always carries __quarantine
    // -- including recommendations_removed_detail entries that record the
    // ORIGINAL out-of-scope market string of whatever got filtered out.
    const parsed = JSON.parse(fakeStage1ModelText({
      recommendations: [
        JSON.parse(fakeStage1ModelText()).recommendations[0],
        { ...JSON.parse(fakeStage1ModelText()).recommendations[0], market: 'superbowl', selection: 'DAL to win it all' },
      ],
    }));
    const cleaned = quarantineStage1(parsed);
    expect(cleaned.__quarantine.recommendations_removed).toBe(1);
    expect(cleaned.__quarantine.recommendations_removed_detail[0].market).toBe('superbowl');
    const byModel = { modelA: cleaned };
    expect(() => assertScopeClean({ byModel, candidates: [], final: [], passed: [], killed: [], watchlistReview: [], portfolioStrategy: null, scenarioReview: null })).not.toThrow();

    // A genuine leak SIBLING to __quarantine (not inside it) on the same
    // byModel entry must still be caught -- the exemption is scoped to the
    // __quarantine key only.
    const leaked = { modelA: { ...cleaned, correlated_positions: ['x'] } };
    expect(() => assertScopeClean({ byModel: leaked })).toThrow(/forbidden key "correlated_positions"/);
  });

  it('proposal payload assertion: an evidence_ids reference into the excluded prediction_markets root inside a proposal draft is rejected', () => {
    const reportFacing = { final: [{ key: 'k1', market: 'wins' }] };
    const proposalDraftsFull = [{ pick_id: 'p1', market: 'wins', evidence_ids: ['prediction_markets.playoff_prob'] }];
    expect(() => assertScopeClean({ ...reportFacing, official_proposal_drafts_full: proposalDraftsFull }))
      .toThrow(/excluded evidence root "prediction_markets"/);
  });

  it('known alias/evidence-root rejection survives being nested inside the committee stages too (Skeptic/Risk output flowing into the same final assertion)', () => {
    const candidates = [{ key: 'k1', market: 'wins', selection: 'DAL over 9.5' }];
    const verdicts = [{ key: 'k1', verdict: 'hold', skeptic_note: 'ok', confidence_delta: 0 }];
    const { survivors } = applySkepticVerdicts(candidates, verdicts);
    expect(survivors).toHaveLength(1);
    const riskOutput = {
      finalized: [{ key: 'k1', bet_threshold: '-120', needs_human_review: false, stake_tier: 'standard', risk_note: 'ok' }],
      passes: [],
      portfolio_notes: 'notes',
    };
    const { final } = applyRiskEditor(survivors, riskOutput);
    expect(final).toHaveLength(1);
    // A leak reaching this far (attached directly onto a finalized candidate)
    // must still be caught by the final assertion.
    const leaked = { ...final[0], correlated_positions: ['x'] };
    expect(() => assertScopeClean({ final: [leaked] })).toThrow(/forbidden key "correlated_positions"/);
  });

  it('frozen dossier provenance: a real temp dossier file is hashed, resolved, and pinned end to end', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'nfl-dossier-provenance-'));
    try {
      const dossierPath = path.join(tmpDir, 'dossier-2026-09-12.json');
      const dossierObj = { meta: { season: 2026, generated_at: '2026-09-12T08:00:00Z' }, synthesis_input: { wins: [], playoffs: [] } };
      const rawText = JSON.stringify(dossierObj);
      await (await import('node:fs/promises')).writeFile(dossierPath, rawText);

      const rawTextReadBack = await readFileAsync(dossierPath, 'utf8');
      const provenance = computeDossierProvenance(dossierPath, rawTextReadBack, JSON.parse(rawTextReadBack));
      expect(provenance.resolved_path).toBe(path.resolve(dossierPath));
      expect(provenance.sha256).toBe(createHash('sha256').update(rawTextReadBack, 'utf8').digest('hex'));
      expect(provenance.generated_at).toBe('2026-09-12T08:00:00Z');
      expect(() => assertDossierProvenancePinned(provenance)).not.toThrow();

      // Threaded into runIdentity, and from there into BOTH a normal run's
      // meta and an all-Stage-1-failed audit artifact (see
      // dossierProvenance.test.js for the direct buildRunIdentity coverage;
      // this asserts it survives being built from a REAL file on disk).
      const runIdentity = buildRunIdentity({
        date: '2026-09-12', season: 2026, watchlistPath: null, watchlistCount: 0,
        promotionsPath: null, promotionsCount: 0, suppressed: true, noPersistEnforcedBySuppression: true,
        dossierProvenance: provenance,
      });
      expect(runIdentity.dossier_provenance.sha256).toBe(provenance.sha256);
      const failureArtifact = buildFailureAuditArtifact(runIdentity, { modelA: { error: 'boom' } });
      expect(failureArtifact.dossier_provenance.resolved_path).toBe(path.resolve(dossierPath));

      // An unpinned dossier (missing meta.generated_at) fails closed.
      const unpinnedRaw = JSON.stringify({ meta: { season: 2026 }, synthesis_input: {} });
      const unpinnedProvenance = computeDossierProvenance(dossierPath, unpinnedRaw, JSON.parse(unpinnedRaw));
      expect(() => assertDossierProvenancePinned(unpinnedProvenance)).toThrow(/meta\.generated_at is missing or not a string/);

      // rev-23-followup4 fix (Codex finding #3): being pinned is still not
      // being THE approved identity -- a matching, explicit approved
      // contract (built from this SAME real file's own computed provenance)
      // passes; any single mismatched field fails closed, end to end
      // against a real file on disk, not just the unit-level fixtures in
      // dossierProvenance.test.js.
      const approvedContract = {
        resolved_path: provenance.resolved_path,
        sha256: provenance.sha256,
        generated_at: provenance.generated_at,
        kickoff_at: '2026-09-12T09:00:00Z',
      };
      expect(() => assertDossierProvenanceApproved(provenance, approvedContract)).not.toThrow();
      expect(() => assertDossierProvenanceApproved(provenance, { ...approvedContract, sha256: 'f'.repeat(64) })).toThrow(/sha256 mismatch/);
      expect(() => assertDossierProvenanceApproved(provenance, undefined)).toThrow(/no approved-dossier contract was supplied/);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('rev-23-followup4 fix (Codex finding #6): a suppressed run\'s Risk/Editor stage (the exact options shape the CLI now builds -- suppressed: true, the scoped user-prompt builder) succeeds WITHOUT scenario_review, using the real runRiskEditorStage/committee code path end to end', async () => {
    const survivors = [{ key: 'k1', market: 'wins', selection: 'DAL over 9.5', confidence: 60, needs_human_review: false }];
    const modelResponse = { finalized: [{ key: 'k1', bet_threshold: '-120', needs_human_review: false, stake_tier: 'standard', risk_note: 'ok' }], passes: [], portfolio_notes: 'One core position.' };
    const r = await runRiskEditorStage(survivors, {}, {
      systemPrompt: SCOPED_RISK_EDITOR_SYSTEM_PROMPT,
      model: 'm',
      callModel: async () => ({ text: JSON.stringify(modelResponse), usage: {} }),
      buildUserPrompt: buildScopedRiskEditorUserPrompt,
      suppressed: true,
    });
    expect(r.status).toBe('success');
    expect(r.scenarioReview).toBeNull();
    expect(r.final.map((f) => f.key)).toEqual(['k1']);
  });

  it('HTML/Markdown omission (structural check — see file header for why this cannot be a live execution test): the suppressed branch still gates scenario-book/ladder/basket sections out of both renderers', () => {
    const htmlFnMatch = SYNTH_SOURCE.match(/function renderHTML\([^)]*\)\s*\{[\s\S]*?\n\}\n/);
    const mdFnMatch = SYNTH_SOURCE.match(/function renderMD\([^)]*\)\s*\{[\s\S]*?\n\}\n/);
    expect(htmlFnMatch, 'renderHTML() must still exist with this signature').not.toBeNull();
    expect(mdFnMatch, 'renderMD() must still exist with this signature').not.toBeNull();
    const htmlFn = htmlFnMatch[0];
    const mdFn = mdFnMatch[0];

    // renderHTML: the scenario-book/ladder/basket block must remain behind
    // a `suppressed ? '' : ...` ternary, not an unconditional template.
    expect(htmlFn).toMatch(/\$\{suppressed \? '' : `<h2 id="scenario-book">Scenario Book/);

    // renderMD: the same sections must remain behind an `if (!suppressed)`
    // guard before any scenario-book/ladder/basket content is pushed.
    expect(mdFn).toMatch(/if \(!suppressed\) \{\s*\n\s*L\.push\('## Scenario Book \/ Playoff Hedge Map'\);/);

    // Both renderers must still accept a `suppressed` parameter at all --
    // if a future refactor drops the parameter, the two checks above would
    // simply stop matching anything meaningful, so pin the signature too.
    expect(htmlFn).toMatch(/function renderHTML\([^)]*suppressed = false\)/);
    expect(mdFn).toMatch(/function renderMD\([^)]*suppressed = false\)/);
  });
});
