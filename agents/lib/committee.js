// agents/lib/committee.js
//
// Stage 2 (Skeptic) and Stage 3 (Risk/Portfolio + Editor) — pure functions
// moved out of agents/portfolio-synthesize.js (rev 17-19 design review,
// Codex-approved) so the committee logic is directly unit-testable without
// running the CLI's unguarded top-level IIFE.
//
// Dependency contract (Codex rev 17/18): this module owns the PURE functions
// only — no side effects, no process.argv/env reads. The CLI keeps ownership
// of system prompts, model selection, and the actual callModel()
// implementation, and injects those as explicit options into
// runSkepticStage()/runRiskEditorStage() below (rev-20-review Low fix:
// parseJSON() is NOT injected — it's imported directly from
// ./parse-json.js immediately below, same as every other caller of that
// shared helper; this comment previously claimed otherwise). Neither
// exported stage function reads process.argv, API keys, or env vars on
// import. runRiskEditorStage() additionally accepts an optional
// buildUserPrompt override (default: this module's own
// buildRiskEditorUserPrompt) so the CLI can inject a scope-restricted user-
// prompt builder for a suppressed run without this module needing to know
// anything about suppression itself.
//
// Each stage runner tracks a local `phase` variable ('call'/'parse'/'apply')
// set immediately before the corresponding operation, inside ONE try/catch —
// on failure it returns a structured { status: 'attempt_failed', failure_phase,
// error } result instead of throwing past the caller, so the CLI can
// distinguish a call failure from a parse failure from an apply failure
// without re-deriving it from a bare error message. On success it returns an
// EXPLICIT { status: 'success', ... } — success is never inferred from the
// mere presence of raw output (Codex's final-rev requirement).

import { parseJSON } from './parse-json.js';

const SKEPTIC_SYSTEM_PROMPT = `You are the SKEPTIC on a betting-analyst committee. You did NOT generate these recommendations — a different analysis pass did. Your only job is to attack each one independently and report whether it survives.

For each candidate you receive (market, selection, price, book, model_fair_prob, edge_pct, confidence, thesis, disconfirming_factor, market_view, football_view, sources, knowledge_based, evidence_ids):
- Actively look for reasons the thesis is WRONG, not reasons to agree. Consider: is the "edge" just juice or a book pricing error rather than a real mispricing? Is the football_view thesis actually supported by the cited evidence_ids, or is it a plausible-sounding story with thin backing? Is the existing disconfirming_factor actually the strongest one, or is there a bigger risk the analyst missed? If knowledge_based is true, is the cited knowledge plausibly stale (analyst training may predate this season's actual events)?
- Do NOT rewrite the thesis or invent a new pick — you are auditing, not re-analyzing.
- Assign a confidence_delta: a negative number (typically -5 to -40) if you found a real weakness, 0 if the thesis holds up under attack, and (rarely, max +5) if the existing disconfirming_factor is actually weaker than stated and the case is more solid than the original confidence suggests.
- verdict: "hold" (thesis survives, keep as-is aside from the delta), "downgrade" (real weakness found but still worth including), or "kill" (the case doesn't hold up at all — should not appear in the final portfolio).
- If you found a stronger or more precise disconfirming factor than the one given, provide it in stronger_disconfirming_factor; otherwise omit that field.

Return STRICT JSON only: { "verdicts": [ { "key": "<the candidate's key, copied exactly>", "skeptic_note": "<=2 sentences on what you found>", "confidence_delta": <number>, "verdict": "hold|downgrade|kill", "stronger_disconfirming_factor": "<optional>" } ] }`;

function buildSkepticUserPrompt(candidates) {
  const compact = candidates.map((c) => ({
    key: c.key, market: c.market, selection: c.selection, price: c.price, book: c.book,
    model_fair_prob: c.model_fair_prob, edge_pct: c.edge_pct, confidence: c.confidence,
    edge_type: c.edge_type, knowledge_based: c.knowledge_based,
    market_view: c.market_view, football_view: c.football_view, thesis: c.thesis,
    disconfirming_factor: c.disconfirming_factor, sources: c.sources, evidence_ids: c.evidence_ids,
  }));
  return `CANDIDATES (${compact.length}) — attack each one independently:\n${JSON.stringify(compact)}\n\nReturn one verdict per candidate, matched by "key".`;
}

const RISK_EDITOR_SYSTEM_PROMPT = `You are the RISK/PORTFOLIO ANALYST and final EDITOR on a betting-analyst committee. You receive the candidates that survived an independent Skeptic pass (already attacked once — do not re-litigate the thesis itself). Your job is purely PORTFOLIO-LEVEL:

- Look across ALL surviving candidates together (not one at a time) for correlation: multiple plays that would all win/lose together (same team, same division, same underlying driver) inflate real risk beyond what each play's own confidence suggests — note this in portfolio_notes and consider trimming or downgrading stake_tier on the redundant ones.
- Set bet_threshold per candidate: the worst price still worth taking given its edge — below that price, the edge is gone. Be a real number/line, not vague.
- Set needs_human_review: true for anything resting on thin data, real disagreement between market_view and football_view, a "downgrade" verdict from the Skeptic, or correlation with 2+ other candidates. Each candidate you receive already carries an incoming needs_human_review value from the earlier stages — you may only ADD true, never clear an incoming true back to false (this is enforced mechanically after you respond regardless of what you set, so treat it as a floor, not a suggestion).
- Set (or revise) stake_tier: core|standard|small|speculative — favorites/value can be core|standard; longshots and anything correlated with a bigger position should be small|speculative. GUARDED POLICY (per SYSTEM_PROMPT's SOURCE HIERARCHY, tightened 2026-09-09): a candidate whose evidence_ids resolve to no Tier 1 structured signal — even if it has real Tier 2 (named/dated lean) and/or Tier 3 (vault_analytical_reads/master_reports) support — must stay needs_human_review:true and stake_tier small|speculative; do not upgrade it to core/standard even if its thesis reads well. A candidate whose evidence_ids resolve to ONLY Tier 4 (training_camp_intel) must not be proposed at all — Tier 4 can only support a thesis already grounded in Tier 1/2/3, never originate one. Both are enforced mechanically after you respond.
- You MAY pass on a candidate for portfolio reasons even if the Skeptic held it — e.g. too correlated with a bigger, better-supported play, or the book/portfolio is already overexposed to that team/division. Put these in "passes" with a reason distinct from the Skeptic's own reasoning.
- If scenario structures are supplied (hedge baskets, parlay ladders, or portfolio_strategy), evaluate them as a scenario book: maximum dead cost if legs fail, effective cost basis if early ladder legs win, whether matchup/exacta coverage spans enough plausible playoff paths, conference/division/QB-driver concentration, and whether each longshot creates real later hedge optionality rather than just another standalone lottery ticket.
- For a surviving anchor_bet-role candidate whose thesis the Skeptic did NOT downgrade, but whose current price makes a full-size entry marginal or slightly negative-edge: instead of passing on it outright, you may recommend a SCALED ENTRY -- a smaller stake_tier now plus an explicit price/condition at which the position would be sized up later. This is not adding a new pick; it is a sizing/timing decision on a candidate you already have. Only use this when the underlying edge case (injury return, roster/coaching change, schedule) is still intact and it is specifically the price that is currently unfavorable -- not when the thesis itself is broken (that is still a pass). When you use this pattern, include an entry_plan on that candidate: { "pattern": "scale_in", "add_trigger": "<price/line/condition that would justify adding to the position>", "note": "<=1 sentence on why partial entry beats an outright pass>" }. Omit entry_plan entirely for a normal full-size entry.
- Do not add new picks. Only finalize sizing/thresholds or pass on what you were given.

Return STRICT JSON only: { "finalized": [ { "key": "<copied exactly>", "bet_threshold": "<...>", "needs_human_review": <bool>, "stake_tier": "core|standard|small|speculative", "risk_note": "<=1 sentence", "entry_plan": { "pattern": "scale_in", "add_trigger": "<...>", "note": "<=1 sentence" } } (entry_plan optional, scale_in pattern only) ], "passes": [ { "key": "<copied exactly>", "reason": "<why this doesn't make the final book>" } ], "scenario_review": { "max_exposure_note": "<=1 sentence>", "funded_liability_note": "<=1 sentence>", "coverage_note": "<=1 sentence>", "concentration_note": "<=1 sentence>", "hedge_optionality_note": "<=1 sentence>", "needs_human_review": <bool> }, "portfolio_notes": "<=4 sentences on correlation clusters, overall exposure, coverage gaps>" }`;

function buildRiskEditorUserPrompt(candidates, scenarioInput = {}) {
  const compact = candidates.map((c) => ({
    key: c.key, market: c.market, selection: c.selection, type: c.type, edge_type: c.edge_type,
    price: c.price, book: c.book, edge_pct: c.edge_pct, confidence: c.confidence, stake_tier: c.stake_tier,
    thesis: c.thesis, disconfirming_factor: c.disconfirming_factor, skeptic_note: c.skeptic_note,
    skeptic_verdict: c.skeptic_verdict, correlated_week1: c.correlated_week1,
    needs_human_review: !!c.needs_human_review, evidence_ids: c.evidence_ids || [],
  }));
  const scenarios = {
    primary_positions: scenarioInput.primary || [],
    user_portfolio_ledger: scenarioInput.ledger || null,
    hedge_baskets: scenarioInput.hedge_baskets || [],
    parlay_ladders: scenarioInput.parlay_ladders || [],
    portfolio_strategy: scenarioInput.portfolio_strategy || [],
  };
  return `SURVIVING CANDIDATES (${compact.length}, post-Skeptic) — judge the PORTFOLIO as a whole:\n${JSON.stringify(compact)}\n\nSCENARIO STRUCTURES (stage-1 proposals, not yet code-math-validated here — evaluate their portfolio logic, not their arithmetic):\n${JSON.stringify(scenarios)}\n\nReturn one finalized entry per surviving candidate you keep, plus any you pass on, matched by "key", and include scenario_review for the scenario structures.`;
}

// Private — not exported. Codex rev 18 finding: applySkepticVerdicts() has an
// unstated dependency on this; it moves WITH applySkepticVerdicts(), not
// separately.
function clampConfidence(n) { return Math.max(0, Math.min(100, Math.round(n))); }

// ── Stage 2 (Skeptic) merge ────────────────────────────────────────────────────
// Applies each verdict onto its candidate by key; kills go to a separate list
// (with the reason) instead of silently disappearing.
export function applySkepticVerdicts(candidates, verdicts) {
  const vByKey = new Map((verdicts || []).map((v) => [v.key, v]));
  const survivors = [], killed = [];
  for (const c of candidates) {
    const v = vByKey.get(c.key);
    if (!v) { survivors.push({ ...c, skeptic_note: null, skeptic_verdict: 'unreviewed' }); continue; }
    // Self-found NaN-propagation bug (rev 17 test-writing): `(v.confidence_delta
    // || 0)` only guards a FALSY delta — a malformed-but-truthy value (e.g. a
    // non-numeric string) was not replaced by 0, and `c.confidence +
    // v.confidence_delta` did JS string concatenation, so Math.round() and
    // clampConfidence() both silently produced NaN. Number.isFinite() closes
    // this: any non-finite delta (string, NaN, undefined, Infinity) becomes 0.
    const delta = Number.isFinite(v.confidence_delta) ? v.confidence_delta : 0;
    const next = {
      ...c,
      confidence: clampConfidence((c.confidence || 0) + delta),
      skeptic_note: v.skeptic_note || null,
      skeptic_verdict: v.verdict || 'hold',
      disconfirming_factor: v.stronger_disconfirming_factor || c.disconfirming_factor,
    };
    if (v.verdict === 'kill') killed.push({ ...c, reason: v.skeptic_note || 'Skeptic pass killed this candidate.', stage: 'skeptic' });
    else survivors.push(next);
  }
  return { survivors, killed };
}

// ── Stage 3 (Risk/Editor) merge ────────────────────────────────────────────────
export function applyRiskEditor(candidates, riskOutput) {
  const finalizedByKey = new Map((riskOutput.finalized || []).map((f) => [f.key, f]));
  const passKeys = new Set((riskOutput.passes || []).map((p) => p.key));
  const final = [], passed = [];
  for (const c of candidates) {
    if (passKeys.has(c.key)) {
      const p = (riskOutput.passes || []).find((x) => x.key === c.key);
      passed.push({ ...c, reason: p?.reason || 'Risk/Editor pass excluded this from the final book.', stage: 'risk_editor' });
      continue;
    }
    const f = finalizedByKey.get(c.key);
    final.push(f ? {
      ...c,
      bet_threshold: f.bet_threshold ?? c.bet_threshold ?? null,
      // Monotonic OR, not `??`: a review flag, once raised by any stage, must
      // never be un-raised by a later one (Codex 2026-09-08 fix, preserved).
      needs_human_review: !!(c.needs_human_review || f.needs_human_review),
      stake_tier: f.stake_tier || c.stake_tier,
      risk_note: f.risk_note || null,
      entry_plan: f.entry_plan || null,
    } : { ...c, risk_note: null });
  }
  return { final, passed };
}

// rev-22-review P1 fix: applySkepticVerdicts()/applyRiskEditor() themselves
// stay permissive pure-merge functions (an "unreviewed" survivor / a
// null-risk_note candidate are legitimate outputs when the CALLER already
// validated completeness) -- but a MODEL response that only partially
// covers what it was sent, or invents/duplicates keys, or returns an
// invalid verdict value, must fail the stage attempt rather than quietly
// merge as if nothing were missing. These run at the 'parse' phase in the
// stage runners below, before applySkepticVerdicts()/applyRiskEditor() are
// ever called.
const VALID_SKEPTIC_VERDICTS = new Set(['hold', 'downgrade', 'kill']);
const VALID_STAKE_TIERS = new Set(['core', 'standard', 'small', 'speculative']);
const SCENARIO_REVIEW_STRING_FIELDS = ['max_exposure_note', 'funded_liability_note', 'coverage_note', 'concentration_note', 'hedge_optionality_note'];

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
function assertNonEmptyString(obj, field, where) {
  if (typeof obj[field] !== 'string' || !obj[field]) {
    throw new Error(`${where}.${field} is missing or not a non-empty string (got ${JSON.stringify(obj[field])})`);
  }
}
function assertFiniteNumber(obj, field, where) {
  if (typeof obj[field] !== 'number' || !Number.isFinite(obj[field])) {
    throw new Error(`${where}.${field} is missing or not a finite number (got ${JSON.stringify(obj[field])})`);
  }
}
function assertBoolean(obj, field, where) {
  if (typeof obj[field] !== 'boolean') {
    throw new Error(`${where}.${field} is missing or not a boolean (got ${typeof obj[field]})`);
  }
}

// rev-23-followup2 fix (Codex finding): a duplicate key inside the
// candidates/survivors array THIS MODULE was given (not the model's
// response) would silently collapse via `new Set(candidates.map(c =>
// c.key))`, shrinking candidateKeys/survivorKeys below the array's real
// length -- a model response covering only the deduplicated key count
// could then pass the "every candidate accounted for" check while a real,
// distinct duplicated candidate was never actually verdicted/finalized.
// This asserts the input itself has no duplicate keys before any Set-based
// cardinality check runs. (Upstream, Stage-1 candidate keys are assigned
// per unique market+selection pairing and killed/split-cased explicitly,
// so a duplicate should never reach here in practice -- but that invariant
// lives in portfolio-synthesize.js, several call frames away, and is not
// something this pure module can rely on without checking.)
function assertUniqueInputKeys(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.key)) {
      throw new Error(`${label} received a duplicate key "${item.key}" among its own input candidates/survivors -- Set-based cardinality checks would silently collapse this without this guard`);
    }
    seen.add(item.key);
  }
}

// rev-23-followup2 fix (Codex finding): the rev-23 version of this function
// only checked KEY coverage (every candidate has exactly one verdict,
// verdicts don't collide) -- a verdict entry missing skeptic_note/
// confidence_delta, or omitting verdict entirely, still passed, and
// applySkepticVerdicts() silently defaulted the missing verdict to 'hold'.
// This now validates the full per-entry contract documented in
// SKEPTIC_SYSTEM_PROMPT's "Return STRICT JSON only" spec above.
function assertCompleteSkepticVerdicts(candidates, verdicts) {
  assertUniqueInputKeys(candidates, 'Skeptic stage');
  const candidateKeys = new Set(candidates.map((c) => c.key));
  const seen = new Set();
  for (const v of verdicts) {
    if (!isPlainObject(v)) {
      throw new Error(`Skeptic response has a verdict entry that is not a plain object (got ${JSON.stringify(v)})`);
    }
    assertNonEmptyString(v, 'key', 'Skeptic verdict entry');
    if (!candidateKeys.has(v.key)) {
      throw new Error(`Skeptic response verdict references unknown key "${v.key}" (not one of the candidates sent)`);
    }
    if (seen.has(v.key)) {
      throw new Error(`Skeptic response has a duplicate verdict for key "${v.key}"`);
    }
    seen.add(v.key);
    assertNonEmptyString(v, 'skeptic_note', `Skeptic verdict "${v.key}"`);
    assertFiniteNumber(v, 'confidence_delta', `Skeptic verdict "${v.key}"`);
    if (!VALID_SKEPTIC_VERDICTS.has(v.verdict)) {
      throw new Error(`Skeptic verdict "${v.key}" is missing "verdict" or it is invalid (got ${JSON.stringify(v.verdict)}, required exactly one of ${[...VALID_SKEPTIC_VERDICTS].join('/')})`);
    }
    if (v.stronger_disconfirming_factor !== undefined) {
      assertNonEmptyString(v, 'stronger_disconfirming_factor', `Skeptic verdict "${v.key}"`);
    }
  }
  if (seen.size !== candidateKeys.size) {
    const missing = [...candidateKeys].filter((k) => !seen.has(k));
    throw new Error(`Skeptic response accounted for ${seen.size} of ${candidateKeys.size} candidate(s) -- missing verdict(s) for: ${missing.join(', ')}`);
  }
}

// rev-23-followup2 fix (Codex finding): a "finalized" entry with only a
// key -- e.g. { "key": "a" } -- previously passed key-coverage checks and
// applyRiskEditor() silently defaulted every other field to null/incoming.
// This now validates the full per-entry contract documented in
// RISK_EDITOR_SYSTEM_PROMPT's "Return STRICT JSON only" spec above.
function assertFinalizedEntry(f, where) {
  if (!isPlainObject(f)) {
    throw new Error(`${where} is not a plain object (got ${JSON.stringify(f)})`);
  }
  assertNonEmptyString(f, 'key', where);
  const withKey = `${where} (key "${f.key}")`;
  assertNonEmptyString(f, 'bet_threshold', withKey);
  assertBoolean(f, 'needs_human_review', withKey);
  if (!VALID_STAKE_TIERS.has(f.stake_tier)) {
    throw new Error(`${withKey} is missing "stake_tier" or it is invalid (got ${JSON.stringify(f.stake_tier)}, required exactly one of ${[...VALID_STAKE_TIERS].join('/')})`);
  }
  assertNonEmptyString(f, 'risk_note', withKey);
  if (f.entry_plan !== undefined) {
    if (!isPlainObject(f.entry_plan)) {
      throw new Error(`${withKey}.entry_plan is present but not a plain object (got ${JSON.stringify(f.entry_plan)})`);
    }
    if (f.entry_plan.pattern !== 'scale_in') {
      throw new Error(`${withKey}.entry_plan.pattern must be "scale_in" (got ${JSON.stringify(f.entry_plan.pattern)})`);
    }
    assertNonEmptyString(f.entry_plan, 'add_trigger', `${withKey}.entry_plan`);
    assertNonEmptyString(f.entry_plan, 'note', `${withKey}.entry_plan`);
  }
}

// rev-23-followup4 fix (Codex finding #6): scenario_review is part of the
// Risk/Editor contract ONLY for a normal (non-suppressed, full-scenario)
// run -- the unscoped RISK_EDITOR_SYSTEM_PROMPT's "Return STRICT JSON
// only" spec asks for it, but every scoped/suppressed Risk/Editor system
// prompt (agents/lib/scoped-prompts.js's SCOPED_RISK_EDITOR_SYSTEM_PROMPT)
// never asks for it at all. Previously this function had no visibility
// into which mode was active and simply never required scenario_review
// for anyone -- correct for a suppressed run, silently wrong for a normal
// one (a model could omit the whole scenario_review block on a real,
// unscoped run and this validator would never catch it). `suppressed` is
// now an explicit parameter threaded in from the CLI via
// runRiskEditorStage() below, rather than inferred or left unchecked --
// the shared validator itself is not weakened for either mode.
function assertCompleteScenarioReview(scenarioReview, where) {
  if (!isPlainObject(scenarioReview)) {
    throw new Error(`${where} is missing "scenario_review" or it is not a plain object (got ${JSON.stringify(scenarioReview)}) -- required in normal (non-suppressed) mode`);
  }
  for (const field of SCENARIO_REVIEW_STRING_FIELDS) {
    assertNonEmptyString(scenarioReview, field, `${where}.scenario_review`);
  }
  assertBoolean(scenarioReview, 'needs_human_review', `${where}.scenario_review`);
}

function assertCompleteRiskEditor(survivors, riskOutput, suppressed) {
  assertUniqueInputKeys(survivors, 'Risk/Editor stage');
  const survivorKeys = new Set(survivors.map((c) => c.key));
  const finalizedKeys = new Set();
  for (const f of riskOutput.finalized) {
    assertFinalizedEntry(f, 'Risk/Editor response "finalized" entry');
    if (!survivorKeys.has(f.key)) {
      throw new Error(`Risk/Editor response "finalized" references unknown key "${f.key}" (not one of the surviving candidates sent)`);
    }
    if (finalizedKeys.has(f.key)) {
      throw new Error(`Risk/Editor response has a duplicate "finalized" entry for key "${f.key}"`);
    }
    finalizedKeys.add(f.key);
  }
  const passKeys = new Set();
  for (const p of riskOutput.passes) {
    if (!isPlainObject(p)) {
      throw new Error(`Risk/Editor response has a "passes" entry that is not a plain object (got ${JSON.stringify(p)})`);
    }
    assertNonEmptyString(p, 'key', 'Risk/Editor response "passes" entry');
    assertNonEmptyString(p, 'reason', `Risk/Editor response "passes" entry (key "${p.key}")`);
    if (!survivorKeys.has(p.key)) {
      throw new Error(`Risk/Editor response "passes" references unknown key "${p.key}" (not one of the surviving candidates sent)`);
    }
    if (passKeys.has(p.key)) {
      throw new Error(`Risk/Editor response has a duplicate "passes" entry for key "${p.key}"`);
    }
    if (finalizedKeys.has(p.key)) {
      throw new Error(`Risk/Editor response lists key "${p.key}" in BOTH "finalized" and "passes"`);
    }
    passKeys.add(p.key);
  }
  const accounted = finalizedKeys.size + passKeys.size;
  if (accounted !== survivorKeys.size) {
    const missing = [...survivorKeys].filter((k) => !finalizedKeys.has(k) && !passKeys.has(k));
    throw new Error(`Risk/Editor response accounted for ${accounted} of ${survivorKeys.size} surviving candidate(s) -- missing "finalized"/"passes" entry for: ${missing.join(', ')}`);
  }
  // rev-23-followup2 fix (Codex finding #4): portfolio_notes is part of the
  // Risk/Editor contract in BOTH the unscoped RISK_EDITOR_SYSTEM_PROMPT and
  // every scoped Risk/Editor system prompt used for this feature -- always
  // required, regardless of mode.
  if (typeof riskOutput.portfolio_notes !== 'string') {
    throw new Error(`Risk/Editor response is missing "portfolio_notes" or it is not a string (got ${typeof riskOutput.portfolio_notes})`);
  }
  // rev-23-followup4 fix (Codex finding #6): scenario_review IS required,
  // but only in normal (non-suppressed) mode -- see
  // assertCompleteScenarioReview() above for why. Suppressed mode continues
  // to omit/not-require it.
  if (!suppressed) {
    assertCompleteScenarioReview(riskOutput.scenario_review, 'Risk/Editor response');
  }
}
// ── Orchestration (Codex rev 16/17: structured stage-status object, not a
// thrown error the CLI has to re-catch) ────────────────────────────────────
// options: { systemPrompt, model, callModel } — all CLI-owned, injected.
// Returns EITHER { status: 'success', survivors, killed, raw } OR
// { status: 'attempt_failed', failure_phase: 'call'|'parse'|'apply', error }.
// Success is always explicit — never inferred from raw output presence.
export async function runSkepticStage(candidates, { systemPrompt, model, callModel }) {
  let phase = 'call';
  // Declared outside the try so a parse/apply-phase failure can still
  // report whatever the model actually returned (rev-20-review P1 fix:
  // previously these were try-block-scoped consts, so a catch after a
  // successful call discarded the received text/usage entirely — the
  // failure result carried only the error message, with no way to inspect
  // what the model said).
  let text, usage;
  try {
    ({ text, usage } = await callModel(model, systemPrompt, buildSkepticUserPrompt(candidates)));
    phase = 'parse';
    const parsed = parseJSON(text);
    // rev-21-review P1 fix (finding #5): a syntactically-valid but
    // degenerate response (e.g. literal "{}") used to silently report
    // status: 'success' -- applySkepticVerdicts() treats a missing/empty
    // verdicts array as "every candidate unreviewed, all survive", which is
    // indistinguishable from a genuine (if unlikely) unanimous-hold verdict
    // set. A response that doesn't even carry a verdicts array, or carries
    // an empty one while candidates were actually sent, never fulfilled the
    // Skeptic contract and must fail this attempt instead.
    if (!Array.isArray(parsed.verdicts)) {
      throw new Error(`Skeptic response missing a "verdicts" array (got ${typeof parsed.verdicts})`);
    }
    const { verdicts } = parsed;
    // rev-22-review P1 fix: supersedes the rev-21 empty-array-only check --
    // this now requires EXACTLY one valid verdict per candidate sent, not
    // merely a non-empty array (a response covering only 1 of 2 candidates
    // used to report status: 'success' with the second silently marked
    // "unreviewed").
    assertCompleteSkepticVerdicts(candidates, verdicts);
    phase = 'apply';
    const { survivors, killed } = applySkepticVerdicts(candidates, verdicts);
    return { status: 'success', survivors, killed, raw: { text, usage } };
  } catch (e) {
    return { status: 'attempt_failed', failure_phase: phase, error: e.message, raw: { text, usage } };
  }
}

// options: { systemPrompt, model, callModel } — all CLI-owned, injected.
// scenarioInput is the SOLE owner of all scenario fields (primary/ledger/
// hedge_baskets/parlay_ladders/portfolio_strategy) — options carries ONLY
// systemPrompt/model/callModel (Codex rev 18/19 single-source-of-truth fix;
// an earlier draft duplicated primary/ledger into options too).
// Returns EITHER { status: 'success', final, passed, scenarioReview,
// portfolioNotes, raw } OR { status: 'attempt_failed', failure_phase, error }.
export async function runRiskEditorStage(survivors, scenarioInput, { systemPrompt, model, callModel, buildUserPrompt = buildRiskEditorUserPrompt, suppressed = false }) {
  let phase = 'call';
  // See runSkepticStage() above for the same discard-on-failure fix.
  let text, usage;
  try {
    ({ text, usage } = await callModel(model, systemPrompt, buildUserPrompt(survivors, scenarioInput)));
    phase = 'parse';
    const riskOutput = parseJSON(text);
    // rev-21-review P1 fix (finding #5): same degenerate-response gap as
    // runSkepticStage() above -- a response missing "finalized"/"passes"
    // entirely, or carrying both as empty while survivors were actually
    // sent, never fulfilled the Risk/Editor contract.
    if (!Array.isArray(riskOutput.finalized) || !Array.isArray(riskOutput.passes)) {
      throw new Error(`Risk/Editor response missing "finalized"/"passes" arrays (got finalized=${typeof riskOutput.finalized}, passes=${typeof riskOutput.passes})`);
    }
    // rev-22-review P1 fix: supersedes the rev-21 both-empty-only check --
    // this now requires every surviving candidate to appear in EXACTLY one
    // of "finalized"/"passes", with no duplicate or unknown keys (a
    // response covering only 1 of 2 survivors used to report status:
    // 'success' with the second silently finalized unchanged).
    assertCompleteRiskEditor(survivors, riskOutput, suppressed);
    phase = 'apply';
    const { final, passed } = applyRiskEditor(survivors, riskOutput);
    return {
      status: 'success', final, passed,
      scenarioReview: riskOutput.scenario_review || null,
      portfolioNotes: riskOutput.portfolio_notes || null,
      raw: { text, usage },
    };
  } catch (e) {
    return { status: 'attempt_failed', failure_phase: phase, error: e.message, raw: { text, usage } };
  }
}

// Exported so the CLI keeps using the identical prompt text and builders — no
// duplicate copy of these templates lives in the CLI anymore.
export { SKEPTIC_SYSTEM_PROMPT, RISK_EDITOR_SYSTEM_PROMPT, buildSkepticUserPrompt, buildRiskEditorUserPrompt };
