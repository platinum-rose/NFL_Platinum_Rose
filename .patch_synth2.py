import sys

PATH = sys.argv[1]
with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

def replace_once(src, old, new, label):
    n = src.count(old)
    if n != 1:
        raise SystemExit(f"FAIL [{label}]: expected 1 occurrence, found {n}")
    return src.replace(old, new, 1)

orig_len = len(src)

# F. ACTIVE_SYSTEM_PROMPT / ACTIVE_RISK_EDITOR_SYSTEM_PROMPT
old = '''  "portfolio_notes": "<=4 sentences on overall construction, correlation clusters, and coverage gaps"
}`;

async function loadLedger() {'''
new = '''  "portfolio_notes": "<=4 sentences on overall construction, correlation clusters, and coverage gaps"
}`;

// Positive-template selection (rev 8-19 design review): under
// --suppress-scenario-structures, Stage 1 and the Risk/Editor both use
// completely separate, independently-written scoped prompt variants (see
// agents/lib/scoped-prompts.js) instead of the full prompts above with a
// deletion list patched over them. The Skeptic prompt needs no scoped
// variant -- it only attacks structured JSON already quarantined by then.
const ACTIVE_SYSTEM_PROMPT = buildActiveSystemPrompt({ suppressed: SUPPRESS_SCENARIO_STRUCTURES, maxPlays: MAX_PLAYS, fullSystemPrompt: SYSTEM_PROMPT });
const ACTIVE_RISK_EDITOR_SYSTEM_PROMPT = buildActiveRiskEditorPrompt({ suppressed: SUPPRESS_SCENARIO_STRUCTURES, fullRiskEditorSystemPrompt: FULL_RISK_EDITOR_SYSTEM_PROMPT });

async function loadLedger() {'''
src = replace_once(src, old, new, "F-active-prompts")

# H+I. Stage-1 loop: runIdentity, quarantine, raw-merge fix, failure artifact
old = '''  const byModel = {}; const raw = {};
  // Tier-3 fix: a per-model Stage-1 failure used to only print to the
  // console — the run continued single-model with `committee_ran` still
  // true and no trace of the failure in the report itself (the actual
  // 2026-09-02 incident: claude-fable-5 died mid-JSON, run silently
  // continued single-model, report rendered clean and exited 0). Collected
  // here so the report can carry a hard banner and the process can signal
  // non-zero on exit even though the run still completes.
  const stage1Errors = [];
  for (const model of models) {
    try {
      const { text, usage } = await callModel(model, SYSTEM_PROMPT, userContent);
      raw[model] = { text, usage };
      byModel[model] = parseJSON(text);
      console.log(`   ${model}: ${(byModel[model].recommendations || []).length} plays, ${(byModel[model].watch || []).length} watch`);
    } catch (e) {
      console.error(`   ✖ ${model}: ${e.message}`);
      raw[model] = { error: e.message };
      stage1Errors.push({ model, error: e.message });
    }
  }
  const ok = Object.keys(byModel);
  if (!ok.length) { console.error('✖ no model returned a valid portfolio'); process.exitCode = 1; return; }
  if (stage1Errors.length) console.error(`   ⚠ ${stage1Errors.length}/${models.length} Stage-1 model(s) failed — continuing with ${ok.length} model(s), but this run and its report are DEGRADED.`);'''
new = '''  // Built once, immediately before the Stage-1 loop begins, so a
  // failure-only artifact and any normal artifact from this same run share
  // the identical run_id (rev 18 fix: avoids a meta-construction ordering
  // bug -- `meta` itself isn't built until well after the all-Stage-1-failed
  // early return below could fire).
  const runIdentity = buildRunIdentity({
    date: new Date().toISOString().slice(0, 10),
    season: dossier.meta.season,
    watchlistPath: watchlist?.items?.length ? WATCHLIST_PATH : null,
    watchlistCount: watchlist?.items?.length || 0,
    promotionsPath: promotions?.promotions?.length ? PROMOTIONS_PATH : null,
    promotionsCount: promotions?.promotions?.length || 0,
    suppressed: SUPPRESS_SCENARIO_STRUCTURES,
    noPersistEnforcedBySuppression: SUPPRESS_SCENARIO_STRUCTURES && NO_PERSIST,
  });

  const byModel = {}; const raw = {};
  // Tier-3 fix: a per-model Stage-1 failure used to only print to the
  // console — the run continued single-model with `committee_ran` still
  // true and no trace of the failure in the report itself (the actual
  // 2026-09-02 incident: claude-fable-5 died mid-JSON, run silently
  // continued single-model, report rendered clean and exited 0). Collected
  // here so the report can carry a hard banner and the process can signal
  // non-zero on exit even though the run still completes.
  const stage1Errors = [];
  for (const model of models) {
    try {
      const { text, usage } = await callModel(model, ACTIVE_SYSTEM_PROMPT, userContent);
      raw[model] = { text, usage };
      const parsed = parseJSON(text);
      // Layer 1 scope enforcement (rev 8-19): quarantine immediately after
      // parse, BEFORE assignment into byModel -- see
      // agents/lib/scope-enforcement.js for the four operations this runs.
      byModel[model] = SUPPRESS_SCENARIO_STRUCTURES ? quarantineStage1(parsed) : parsed;
      console.log(`   ${model}: ${(byModel[model].recommendations || []).length} plays, ${(byModel[model].watch || []).length} watch`);
    } catch (e) {
      console.error(`   ✖ ${model}: ${e.message}`);
      // rev 15/16 fix: MERGE onto any already-captured { text, usage }
      // rather than overwriting it -- a parse/quarantine failure AFTER a
      // successful call used to silently discard the model's raw text/usage.
      raw[model] = { ...raw[model], error: e.message };
      stage1Errors.push({ model, error: e.message });
    }
  }
  const ok = Object.keys(byModel);
  if (!ok.length) {
    console.error('✖ no model returned a valid portfolio');
    // rev 15/19 fix: previously nothing was ever written to disk on this
    // path -- the early return happens well before the normal .raw.json
    // write. Writes a run-ID-qualified failure-only artifact under
    // <OUT_DIR>/failed/ so this failure leaves a durable audit trail.
    const failureArtifact = buildFailureAuditArtifact(runIdentity, raw);
    const failurePath = await writeAuditArtifact(OUT_DIR, failureArtifact);
    console.error(`   wrote failure audit artifact: ${failurePath}`);
    process.exitCode = 1;
    return;
  }
  if (stage1Errors.length) console.error(`   ⚠ ${stage1Errors.length}/${models.length} Stage-1 model(s) failed — continuing with ${ok.length} model(s), but this run and its report are DEGRADED.`);'''
src = replace_once(src, old, new, "H+I-stage1-loop")

# J+K. meta construction + committee call sites
old = '''  const meta = { date: new Date().toISOString().slice(0, 10), season: dossier.meta.season, committee_ran: !SKIP_COMMITTEE, run_id: randomUUID(), watchlist_path: watchlist?.items?.length ? WATCHLIST_PATH : null, watchlist_count: watchlist?.items?.length || 0, promotions_path: promotions?.promotions?.length ? PROMOTIONS_PATH : null, promotions_count: promotions?.promotions?.length || 0, stage1_errors: stage1Errors.length ? stage1Errors : null };
  let final = candidates, passed = [], killed = [];
  const raw2 = {};
  let scenarioReview = null;

  if (SKIP_COMMITTEE) {
    console.log('   (committee skipped: --skip-committee — stage 1 candidates used as-is)');
  } else {
    console.log(`🕵 Stage 2 (Skeptic) with: ${SKEPTIC_MODEL}`);
    try {
      const { text, usage } = await callModel(SKEPTIC_MODEL, SKEPTIC_SYSTEM_PROMPT, buildSkepticUserPrompt(candidates));
      raw2.skeptic = { text, usage };
      const { verdicts } = parseJSON(text);
      const applied = applySkepticVerdicts(candidates, verdicts);
      console.log(`   skeptic: ${applied.survivors.length} survive, ${applied.killed.length} killed`);
      killed = applied.killed;
      // Tier-3 fix: narrow `final` to the skeptic-filtered survivors NOW, so
      // that if the Stage-3 call below throws, the catch block's fallback is
      // "final stays what the Skeptic already approved" rather than "final
      // reverts to the untouched, pre-Skeptic candidate list" — which would
      // silently resurrect every candidate `killed` above just listed as
      // rejected.
      final = applied.survivors;

      console.log(`⚖ Stage 3 (Risk/Portfolio + Editor) with: ${RISK_MODEL}`);
      const { text: riskText, usage: riskUsage } = await callModel(RISK_MODEL, RISK_EDITOR_SYSTEM_PROMPT, buildRiskEditorUserPrompt(applied.survivors, {
        primary: PRIMARY,
        ledger,
        hedge_baskets: rawHedgeBaskets,
        parlay_ladders: rawParlayLadders,
        portfolio_strategy: rawPortfolioStrategies,
      }));
      raw2.risk_editor = { text: riskText, usage: riskUsage };
      const riskOutput = parseJSON(riskText);
      const applied2 = applyRiskEditor(applied.survivors, riskOutput);
      final = applied2.final; passed = applied2.passed;
      scenarioReview = riskOutput.scenario_review || null;
      console.log(`   risk/editor: ${final.length} final, ${passed.length} passed`);
      byModel.__committee_notes = riskOutput.portfolio_notes || null;
    } catch (e) {
      console.error(`   ✖ committee pass failed, falling back to stage-1 candidates as-is: ${e.message}`);
      meta.committee_ran = false;
      meta.committee_error = e.message;
    }
  }'''
new = '''  const meta = { ...runIdentity, stage1_errors: stage1Errors.length ? stage1Errors : null };
  let final = candidates, passed = [], killed = [];
  const raw2 = {};
  let scenarioReview = null;
  // Four-state stage-status model (rev 15/17/19): 'disabled_by_flag' (a
  // deliberate --skip-committee run), 'not_reached_due_to_upstream_failure',
  // 'attempt_failed' + failure_phase ('call'/'parse'/'apply'), or explicit
  // 'success' -- never inferred from raw-output presence.
  meta.skeptic_status = { status: 'disabled_by_flag' };
  meta.risk_editor_status = { status: 'disabled_by_flag' };

  if (SKIP_COMMITTEE) {
    console.log('   (committee skipped: --skip-committee — stage 1 candidates used as-is)');
  } else {
    console.log(`🕵 Stage 2 (Skeptic) with: ${SKEPTIC_MODEL}`);
    const skepticResult = await runSkepticStage(candidates, { systemPrompt: SKEPTIC_SYSTEM_PROMPT, model: SKEPTIC_MODEL, callModel });
    if (skepticResult.status !== 'success') {
      meta.skeptic_status = { status: 'attempt_failed', failure_phase: skepticResult.failure_phase, error: skepticResult.error };
      meta.risk_editor_status = { status: 'not_reached_due_to_upstream_failure' };
      console.error(`   ✖ skeptic stage failed (${skepticResult.failure_phase}): ${skepticResult.error} — falling back to stage-1 candidates as-is`);
    } else {
      meta.skeptic_status = { status: 'success' };
      raw2.skeptic = skepticResult.raw;
      console.log(`   skeptic: ${skepticResult.survivors.length} survive, ${skepticResult.killed.length} killed`);
      killed = skepticResult.killed;
      // Tier-3 fix (preserved): narrow `final` to the skeptic-filtered
      // survivors NOW, so that if the Risk/Editor stage below fails, the
      // fallback is "final stays what the Skeptic already approved" rather
      // than silently resurrecting every candidate just listed as killed.
      final = skepticResult.survivors;

      console.log(`⚖ Stage 3 (Risk/Portfolio + Editor) with: ${RISK_MODEL}`);
      const riskResult = await runRiskEditorStage(skepticResult.survivors, {
        primary: PRIMARY,
        ledger,
        hedge_baskets: SUPPRESS_SCENARIO_STRUCTURES ? [] : rawHedgeBaskets,
        parlay_ladders: SUPPRESS_SCENARIO_STRUCTURES ? [] : rawParlayLadders,
        portfolio_strategy: SUPPRESS_SCENARIO_STRUCTURES ? [] : rawPortfolioStrategies,
      }, { systemPrompt: ACTIVE_RISK_EDITOR_SYSTEM_PROMPT, model: RISK_MODEL, callModel });
      if (riskResult.status !== 'success') {
        meta.risk_editor_status = { status: 'attempt_failed', failure_phase: riskResult.failure_phase, error: riskResult.error };
        console.error(`   ✖ risk/editor stage failed (${riskResult.failure_phase}): ${riskResult.error} — falling back to skeptic survivors as-is`);
      } else {
        meta.risk_editor_status = { status: 'success' };
        raw2.risk_editor = riskResult.raw;
        final = riskResult.final; passed = riskResult.passed;
        scenarioReview = riskResult.scenarioReview;
        console.log(`   risk/editor: ${final.length} final, ${passed.length} passed`);
        byModel.__committee_notes = riskResult.portfolioNotes;
      }
    }
  }'''
src = replace_once(src, old, new, "J+K-meta-and-committee")

# L. final assertion wiring
old = '''  const watchlistReview = buildWatchlistReview(dossier, watchlist);

  const ranked = rankByAxis(final);'''
new = '''  const watchlistReview = buildWatchlistReview(dossier, watchlist);
  // Layer 2 scope enforcement (rev 8-19): throws if anything out-of-scope
  // survived quarantine/committee/validation. See
  // agents/lib/scope-enforcement.js for what this checks and why it takes
  // only `final`, never a recursive scan of the whole run state.
  if (SUPPRESS_SCENARIO_STRUCTURES) assertScopeClean(final);

  const ranked = rankByAxis(final);'''
src = replace_once(src, old, new, "L-final-assertion")

# M. persistence call site
old = '''  await persistRecommendations(final, meta);
  await persistRecommendationRuns(meta, { stage1: candidates, killed, passed, final });'''
new = '''  await persistPortfolioRun(final, meta, { stage1: candidates, killed, passed, final }, buildPersistenceOptions({
    suppressed: SUPPRESS_SCENARIO_STRUCTURES,
    noPersist: NO_PERSIST,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }));'''
src = replace_once(src, old, new, "M-persistence-call-site")

# N1. portfolioStrategy call site
old = '''  const portfolioStrategy = buildPortfolioStrategy({
    primary: PRIMARY,
    baskets: validBaskets,
    ladders: validLadders,
    rawStrategies: rawPortfolioStrategies,
    scenarioReview,
    invalidStacks,
  });'''
new = '''  const portfolioStrategy = SUPPRESS_SCENARIO_STRUCTURES ? null : buildPortfolioStrategy({
    primary: PRIMARY,
    baskets: validBaskets,
    ladders: validLadders,
    rawStrategies: rawPortfolioStrategies,
    scenarioReview,
    invalidStacks,
  });'''
src = replace_once(src, old, new, "N1-portfolioStrategy")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)

print(f"stage2 OK, {orig_len} -> {len(src)} chars")
