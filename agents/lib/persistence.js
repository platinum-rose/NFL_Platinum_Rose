// agents/lib/persistence.js
//
// Supabase persistence, moved out of agents/portfolio-synthesize.js (rev
// 16-19 design review, Codex-approved) so the suppression/no-persist/
// missing-credentials gating can be tested directly instead of only via the
// CLI's unguarded top-level IIFE.
//
// Checked in EXACT order, for both tables: (1) suppressed -> skip;
// (2) noPersist -> skip, preserving the existing "(persistence skipped:
// --no-persist)" message; (3) missing/empty credentials -> skip with the
// existing message; (4) ONLY THEN lazy client construction — already lazy in
// production (`await import('@supabase/supabase-js')` inside each function),
// preserved here rather than newly introduced.
//
// buildPersistenceOptions() is a small pure function assembling the options
// shape from CLI-parsed flags/env — added because the CLI is an unguarded
// top-level IIFE with no seam to spy on "the parsed value reached both
// persistence calls."
//
// persistPortfolioRun() is the single production orchestration function
// (Codex rev 18->19 fix): buildPersistenceOptions() alone proved the right
// SHAPE but nothing proved the CLI's two independent persistence calls both
// actually received the SAME constructed object. This wrapper collapses the
// CLI's two calls into one — persistRecommendations() and
// persistRecommendationRuns() are invoked from inside it with the IDENTICAL
// options reference, so a test against persistPortfolioRun() alone proves
// both bridges obey the same suppression/no-persist state.

// options: { suppressed, noPersist, supabaseUrl, supabaseKey, createClient? }
// createClient is optional — production omits it (real lazy import below);
// tests inject a fake to observe calls without a real Supabase client.
export function buildPersistenceOptions({ suppressed, noPersist, supabaseUrl, supabaseKey, createClient } = {}) {
  return {
    suppressed: !!suppressed,
    noPersist: !!noPersist,
    supabaseUrl: supabaseUrl || null,
    supabaseKey: supabaseKey || null,
    createClient: createClient || null,
  };
}

async function resolveClient(options) {
  if (options.createClient) return options.createClient(options.supabaseUrl, options.supabaseKey, { auth: { persistSession: false } });
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(options.supabaseUrl, options.supabaseKey, { auth: { persistSession: false } });
}

// Logs the final book to Supabase (migration 042, extended by 043 with
// run_id) so results can eventually be graded. Non-fatal: local
// .html/.md/.raw.json always get written regardless of whether this
// succeeds, so a missing/blocked Supabase connection never loses the run's
// output.
export async function persistRecommendations(final, meta, options) {
  if (options.suppressed) { console.log('   (persistence skipped: suppressed run)'); return; }
  if (options.noPersist) { console.log('   (persistence skipped: --no-persist)'); return; }
  if (!options.supabaseUrl || !options.supabaseKey) { console.log('   (persistence skipped: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set)'); return; }
  try {
    const sb = await resolveClient(options);
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

// futures_recommendation_runs (migration 043) persists EVERY candidate at
// EVERY stage — stage1 proposal, skeptic kill, risk/editor pass, validator
// invalidation, and final survivor — one row each, tagged by stage, so the
// full reasoning trail is queryable later. Non-fatal, same pattern as above.
export async function persistRecommendationRuns(meta, trail, options) {
  if (options.suppressed) return;
  if (options.noPersist) return;
  if (!options.supabaseUrl || !options.supabaseKey) return;
  try {
    const sb = await resolveClient(options);
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
}

// Single production seam: the CLI makes exactly ONE call to this wrapper
// instead of two independent calls to the functions above, so the identical
// `options` reference reaches both Supabase tables — the wiring proof a pure
// buildPersistenceOptions() test alone could not provide (Codex rev 18/19).
export async function persistPortfolioRun(final, meta, trail, options) {
  await persistRecommendations(final, meta, options);
  await persistRecommendationRuns(meta, trail, options);
}
