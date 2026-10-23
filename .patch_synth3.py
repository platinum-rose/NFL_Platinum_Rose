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

# N2. remove local persistRecommendations/persistRecommendationRuns
old = '''// ── persistence (backtesting foundation) ───────────────────────────────────────
// Logs the final book to Supabase (migration 042, extended by 043 with run_id)
// so results can eventually be graded — see docs/FUTURES_AGENT_DATA_INVENTORY
// doc for what's built vs. deferred. Non-fatal: local .html/.md/.raw.json
// always get written regardless of whether this succeeds, so a missing/blocked
// Supabase connection never loses the run's output.
//
// 2026-07-22 follow-up (Codex review — backtesting log completeness): the
// original unique(run_date, key) constraint meant a second same-day run
// silently overwrote the first. Migration 043 adds run_id (one per invocation,
// meta.run_id below) and repoints the uniqueness to (run_id, key), so re-runs
// on the same date no longer clobber each other.
async function persistRecommendations(final, meta) {
  if (NO_PERSIST) { console.log('   (persistence skipped: --no-persist)'); return; }
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_URL || !SB_KEY) { console.log('   (persistence skipped: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set)'); return; }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
    const rows = final.map((r) => ({
      run_id: meta.run_id, run_date: meta.date, season: meta.season, key: r.key, market: r.market, selection: r.selection,
      edge_type: r.edge_type || null, type: r.type || null, book: r.book || null, price: r.price ?? null,
      model_fair_prob: r.model_fair_prob ?? null, edge_pct: r.edge_pct ?? null, confidence: r.confidence ?? null,
      stake_tier: r.stake_tier || null, knowledge_based: !!r.knowledge_based,
      thesis: r.thesis || null, disconfirming_factor: r.disconfirming_factor || null,
      market_view: r.market_view || null, football_view: r.football_view || null,
      skeptic_note: r.skeptic_note || null, skeptic_verdict: r.skeptic_verdict || null,
      bet_threshold: r.bet_threshold || null, needs_human_review: !!r.needs_human_review,
      sources: r.sources || [], evidence_ids: r.evidence_ids || [],
      timing: r.timing || null, correlated_week1: r.correlated_week1 || null,
      models: r.agreement || null, status: 'pending',
    }));
    const { error } = await sb.from('futures_recommendations').upsert(rows, { onConflict: 'run_id,key' });
    if (error) throw new Error(error.message);
    console.log(`   ✅ persisted ${rows.length} recommendations to futures_recommendations (run_id=${meta.run_id})`);
  } catch (e) {
    console.warn(`   ⚠ persistence failed (local files still written): ${e.message}`);
  }
}

// 2026-07-22 follow-up (Codex review — backtesting log completeness, item #3):
// futures_recommendations only ever held the FINAL book — everything the
// committee/validator rejected disappeared once the run's .raw.json aged out of
// attention. futures_recommendation_runs (migration 043) persists EVERY
// candidate at EVERY stage — stage1 proposal, skeptic kill, risk/editor pass,
// validator invalidation, and final survivor — one row each, tagged by stage,
// so the full reasoning trail (including what got killed and why) is queryable
// later, not just what made the final cut. Non-fatal, same pattern as above.
async function persistRecommendationRuns(meta, trail) {
  if (NO_PERSIST) return;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_URL || !SB_KEY) return;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
    const rowFor = (c, stage, reason) => ({
      run_id: meta.run_id, run_date: meta.date, season: meta.season, stage, key: c.key,
      market: c.market || null, selection: c.selection || null, edge_type: c.edge_type || null,
      price: c.price ?? null, book: c.book || null, model_fair_prob: c.model_fair_prob ?? null,
      edge_pct: c.edge_pct ?? null, confidence: c.confidence ?? null,
      reason: reason || null, models: c.agreement || null, payload: c,
    });
    const rows = [
      ...(trail.stage1 || []).map((c) => rowFor(c, 'stage1_candidate', null)),
      ...(trail.killed || []).map((c) => rowFor(c, 'skeptic_killed', c.reason)),
      ...(trail.passed || []).map((c) => rowFor(c, c.stage === 'validator' ? 'validator_invalidated' : 'risk_passed', c.reason)),
      ...(trail.final || []).map((c) => rowFor(c, 'final', null)),
    ];
    if (!rows.length) return;
    const { error } = await sb.from('futures_recommendation_runs').insert(rows);
    if (error) throw new Error(error.message);
    console.log(`   ✅ persisted ${rows.length} candidate-trail rows to futures_recommendation_runs (run_id=${meta.run_id})`);
  } catch (e) {
    console.warn(`   ⚠ candidate-trail persistence failed (local files still written): ${e.message}`);
  }
}'''
new = '''// persistRecommendations()/persistRecommendationRuns()/persistPortfolioRun()
// all moved to agents/lib/persistence.js (rev 16-19 design review) --
// imported above. The CLI's two former independent calls collapse into one
// call to persistPortfolioRun() at the bottom of this file.'''
src = replace_once(src, old, new, "N2-remove-persistence-fns")

# N3a. startup invariant, moved to the top of the IIFE
old = '''(async () => {
  const dossier = JSON.parse(await readFile(DOSSIER, 'utf8'));

  // 2026-09-03 intel-source-integrity preflight (Andy, trust audit) — runs'''
new = '''(async () => {
  // Startup invariant (rev 15-19 design review): checked before the dossier
  // read, before any model call, before any write. loadWatchlist() moves
  // here (was much further down) because the invariant needs its RESULT --
  // an exactly-empty items array, when suppressed -- before anything else
  // in the run happens; it is not re-loaded at its old call site below.
  const watchlist = await loadWatchlist();
  const startupCheck = checkStartupInvariant({
    suppressed: SUPPRESS_SCENARIO_STRUCTURES,
    noPersist: NO_PERSIST,
    proposalOutDir: PROPOSAL_OUT_DIR,
    watchlist,
  });
  if (!startupCheck.ok) {
    console.error('✖ suppressed-run startup invariant FAILED:');
    for (const problem of startupCheck.problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const dossier = JSON.parse(await readFile(DOSSIER, 'utf8'));

  // 2026-09-03 intel-source-integrity preflight (Andy, trust audit) — runs'''
src = replace_once(src, old, new, "N3a-startup-invariant")

# N3b. remove the old, now-duplicate loadWatchlist() call site
old = '''  const ledger = await loadLedger();
  const watchlist = await loadWatchlist();
  const officialConfig = await loadOfficialConfig();'''
new = '''  const ledger = await loadLedger();
  const officialConfig = await loadOfficialConfig();'''
src = replace_once(src, old, new, "N3b-remove-dup-watchlist-load")

# N4. badgeKeyHTML — Market example + Stake Tier text, suppression-aware
old = '''  const items = [
    ['Market', 'What bet market this card is about, such as Make the Playoffs, Win Total, or Super Bowl Matchup.'],
    ['Pick Type', 'The shape of the bet: favorite price, value bet, longshot, or hedge.'],
    ['Edge Type', 'Why it is here: math edge is code-supported price value; thesis-driven means football/portfolio logic carries the case.'],
    ['Needs Review', 'The report is asking for human judgment before action, usually because the price is expensive, evidence conflicts, or portfolio correlation matters.'],
    ['Board Validator Flag', 'A mechanical, code-owned check failed (bettable book, thin-market n_books>=3 kill switch, sim-price-only market policy, or a dossier-edge cross-check) — kept visible per annotate-and-keep policy, not auto-dropped. Treat as a hard stop-and-review, not a stylistic warning.'],
    ['Stake Tier', 'Suggested sizing bucket only. Speculative means small/coverage exposure, not a core position.'],
    ['Fair / Edge', 'Fair is the model probability. Edge is expected value at the shown quote using that fair probability.'],
    ['Simulation', 'Offline code forecast used as validation: probability, uncertainty range, and lower-bound edge when available.'],
    ['Threshold', 'The worst price the report would normally accept. If the current quote is worse than the threshold, it is usually a pass or wait.'],
    ['Source Quality', 'How traceable the supporting source trail is: named expert plus timestamp is strongest; no source trail is weakest.'],
  ];'''
new = '''  const items = [
    ['Market', SUPPRESS_SCENARIO_STRUCTURES ? 'What bet market this card is about: Make the Playoffs or Win Total.' : 'What bet market this card is about, such as Make the Playoffs, Win Total, or Super Bowl Matchup.'],
    ['Pick Type', SUPPRESS_SCENARIO_STRUCTURES ? 'The shape of the bet: favorite price, value bet, or longshot.' : 'The shape of the bet: favorite price, value bet, longshot, or hedge.'],
    ['Edge Type', 'Why it is here: math edge is code-supported price value; thesis-driven means football/portfolio logic carries the case.'],
    ['Needs Review', 'The report is asking for human judgment before action, usually because the price is expensive, evidence conflicts, or portfolio correlation matters.'],
    ['Board Validator Flag', 'A mechanical, code-owned check failed (bettable book, thin-market n_books>=3 kill switch, sim-price-only market policy, or a dossier-edge cross-check) — kept visible per annotate-and-keep policy, not auto-dropped. Treat as a hard stop-and-review, not a stylistic warning.'],
    ['Stake Tier', SUPPRESS_SCENARIO_STRUCTURES ? 'Suggested sizing bucket only. Speculative means a small position, not a core one.' : 'Suggested sizing bucket only. Speculative means small/coverage exposure, not a core position.'],
    ['Fair / Edge', 'Fair is the model probability. Edge is expected value at the shown quote using that fair probability.'],
    ['Simulation', 'Offline code forecast used as validation: probability, uncertainty range, and lower-bound edge when available.'],
    ['Threshold', 'The worst price the report would normally accept. If the current quote is worse than the threshold, it is usually a pass or wait.'],
    ['Source Quality', 'How traceable the supporting source trail is: named expert plus timestamp is strongest; no source trail is weakest.'],
  ];'''
src = replace_once(src, old, new, "N4-badgeKeyHTML")

# N5. humanizeMarketRefs — gate the out-of-scope-market replacements
old = '''function humanizeMarketRefs(text) {
  return String(text || '')
    .replace(/\\(superbowl_matchup\\)/g, '(Super Bowl Matchup)')
    .replace(/\\(conference_afc\\)/g, '(Win AFC)')
    .replace(/\\(conference_nfc\\)/g, '(Win NFC)')
    .replace(/\\(superbowl\\)/g, '(Win Super Bowl)')
    .replace(/\\(playoffs\\)/g, '(Make the Playoffs)')
    .replace(/\\(wins\\)/g, '(Win Total)')
    .replace(/\\bsuperbowl_matchup\\b/g, 'Super Bowl Matchup')
    .replace(/\\bconference_afc\\b/g, 'Win AFC')
    .replace(/\\bconference_nfc\\b/g, 'Win NFC');
}'''
new = '''function humanizeMarketRefs(text) {
  let result = String(text || '')
    .replace(/\\(playoffs\\)/g, '(Make the Playoffs)')
    .replace(/\\(wins\\)/g, '(Win Total)');
  // Suppressed runs never carry these markets (quarantined at Layer 1) --
  // gated so the renderer doesn't teach the reader about a market/badge
  // that has no place in a wins/playoffs-only report, even in a stray
  // free-text string (e.g. a validator reason) that happens to mention one.
  if (!SUPPRESS_SCENARIO_STRUCTURES) {
    result = result
      .replace(/\\(superbowl_matchup\\)/g, '(Super Bowl Matchup)')
      .replace(/\\(conference_afc\\)/g, '(Win AFC)')
      .replace(/\\(conference_nfc\\)/g, '(Win NFC)')
      .replace(/\\(superbowl\\)/g, '(Win Super Bowl)')
      .replace(/\\bsuperbowl_matchup\\b/g, 'Super Bowl Matchup')
      .replace(/\\bconference_afc\\b/g, 'Win AFC')
      .replace(/\\bconference_nfc\\b/g, 'Win NFC');
  }
  return result;
}'''
src = replace_once(src, old, new, "N5-humanizeMarketRefs")

# N6. recommendationBlurb — skip the scenario-suggestive regex under suppression
old = '''function recommendationBlurb(rec) {
  const tags = reportTags(rec).join(' and ');
  const action = rec.timing?.action === 'pass' ? 'is currently a pass/wait' : rec.timing?.action === 'bet_now' ? 'is marked as playable now if the price holds' : 'is mainly a watch/wait candidate';
  const coverage = /coverage|exacta|hedge/i.test(`${rec.thesis || ''} ${rec.market_view || ''} ${rec.football_view || ''} ${rec.risk_note || ''}`)
    ? ' but appears most useful as portfolio or exacta coverage rather than a clean standalone bet'
    : '';
  return `${rec.selection} matches ${tags}; it ${action}${coverage}.`;
}'''
new = '''function recommendationBlurb(rec) {
  const tags = reportTags(rec).join(' and ');
  const action = rec.timing?.action === 'pass' ? 'is currently a pass/wait' : rec.timing?.action === 'bet_now' ? 'is marked as playable now if the price holds' : 'is mainly a watch/wait candidate';
  const coverage = (!SUPPRESS_SCENARIO_STRUCTURES && /coverage|exacta|hedge/i.test(`${rec.thesis || ''} ${rec.market_view || ''} ${rec.football_view || ''} ${rec.risk_note || ''}`))
    ? ' but appears most useful as portfolio or exacta coverage rather than a clean standalone bet'
    : '';
  return `${rec.selection} matches ${tags}; it ${action}${coverage}.`;
}'''
src = replace_once(src, old, new, "N6-recommendationBlurb")

# N7. degradationProblems + degradedReasons: key off skeptic_status/risk_editor_status
old = '''function degradationProblems(meta) {
  const problems = [];
  if (meta.stage1_errors?.length) {
    problems.push(`${meta.stage1_errors.length} Stage-1 model call(s) failed and were excluded from this run: ${meta.stage1_errors.map((e) => `${e.model} (${e.error})`).join('; ')}. This report used fewer analysts than configured.`);
  }
  if (meta.committee_ran === false) {
    problems.push(`The Skeptic/Risk committee crashed${meta.committee_error ? ` (${meta.committee_error})` : ''} — this report falls back to unreviewed Stage-1 candidates. No Skeptic verdict, no Risk/Editor pass, no scenario review.`);
  }
  if (meta.final_empty) {
    problems.push('The final book is EMPTY — zero recommendations survived to this report. Treat this run as failed, not as "the model looked and found nothing."');
  }
  return problems;
}'''
new = '''function degradationProblems(meta) {
  const problems = [];
  if (meta.stage1_errors?.length) {
    problems.push(`${meta.stage1_errors.length} Stage-1 model call(s) failed and were excluded from this run: ${meta.stage1_errors.map((e) => `${e.model} (${e.error})`).join('; ')}. This report used fewer analysts than configured.`);
  }
  // rev 17/18/19 fix: keyed off explicit skeptic_status/risk_editor_status
  // now, never the old single committee_ran boolean -- that conflated a
  // deliberate --skip-committee run (disabled_by_flag, which must render
  // ONLY as the neutral "(stage 1 only)" sub-header text below, never here)
  // with an actual crash (attempt_failed).
  if (meta.skeptic_status?.status === 'attempt_failed') {
    problems.push(`The Skeptic stage failed during ${meta.skeptic_status.failure_phase} (${meta.skeptic_status.error}) — this report falls back to unreviewed Stage-1 candidates. No Skeptic verdict, no Risk/Editor pass${SUPPRESS_SCENARIO_STRUCTURES ? '' : ', no scenario review'}.`);
  } else if (meta.risk_editor_status?.status === 'attempt_failed') {
    problems.push(`The Risk/Editor stage failed during ${meta.risk_editor_status.failure_phase} (${meta.risk_editor_status.error}) — this report falls back to Skeptic-reviewed survivors without portfolio-level finalization${SUPPRESS_SCENARIO_STRUCTURES ? '' : ' or scenario review'}.`);
  }
  if (meta.final_empty) {
    problems.push('The final book is EMPTY — zero recommendations survived to this report. Treat this run as failed, not as "the model looked and found nothing."');
  }
  return problems;
}'''
src = replace_once(src, old, new, "N7a-degradationProblems")

old = '''<div class="sub">${meta.date} · models: ${esc(names.join(' + '))} · season ${esc(meta.season)}${meta.committee_ran === false ? ' · <b>committee skipped (stage 1 only)</b>' : ''}</div>'''
new = '''<div class="sub">${meta.date} · models: ${esc(names.join(' + '))} · season ${esc(meta.season)}${meta.skeptic_status?.status === 'disabled_by_flag' ? ' · <b>committee skipped (stage 1 only)</b>' : ''}</div>'''
src = replace_once(src, old, new, "N7b-renderHTML-subheader")

old = '''  const degradedReasons = [
    meta.stage1_errors ? `${meta.stage1_errors.length} Stage-1 model error(s)` : null,
    meta.committee_ran === false ? `committee crashed (${meta.committee_error || 'no error message captured'})` : null,
    meta.final_empty ? 'final book is empty' : null,
  ].filter(Boolean);'''
new = '''  const degradedReasons = [
    meta.stage1_errors ? `${meta.stage1_errors.length} Stage-1 model error(s)` : null,
    meta.skeptic_status?.status === 'attempt_failed' ? `skeptic stage failed (${meta.skeptic_status.error || 'no error message captured'})` : null,
    meta.risk_editor_status?.status === 'attempt_failed' ? `risk/editor stage failed (${meta.risk_editor_status.error || 'no error message captured'})` : null,
    meta.final_empty ? 'final book is empty' : null,
  ].filter(Boolean);'''
src = replace_once(src, old, new, "N7c-degradedReasons")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)

print(f"stage3 OK, {orig_len} -> {len(src)} chars")
