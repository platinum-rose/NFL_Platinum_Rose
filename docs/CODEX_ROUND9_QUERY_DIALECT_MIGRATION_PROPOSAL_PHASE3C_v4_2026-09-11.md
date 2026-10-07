# Query Dialect Migration — Phase 3c Proposal v4 (Response to Codex's Fourth Review)

**Date:** 2026-09-11
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v3_2026-09-11.md` (v3), which Codex reviewed and returned **changes requested** (2 P1, 1 P2). Still a proposal only — no Phase 3c code has been written.

## Verdict on the review

All three findings are correct; none contested, and one of them corrects an outright factual error in v3's own reasoning.

- **P1 (clean CI import failure):** confirmed by direct testing, not assumption. v3 claimed the module-scope env-check/`createClient()` pattern in `signal-normalize.js` "is not something this proposal needs to change" because `portfolio-dossier.js` runs the identical pattern and "is already imported today by five existing test files... against the project's real `.env`." **That claim was wrong** — checked again just now: none of the five test files named (`boardValidate.test.js`, `evidenceTierGate.test.js`, `namedStatusReviewSizingGates.test.js`, `pickSignalFloor.test.js`, `rowReduction.test.js`) actually import `portfolio-dossier.js`; `portfolio-dossier` only appears in their comments/test descriptions, confirmed with `grep -rl "from '.*portfolio-dossier.js'" tests/` returning nothing. Reproduced Codex's finding directly: importing `agents/portfolio-dossier.js` with `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` blank kills the process immediately (`✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env`, exit code 1) — and confirmed CI (`.github/workflows/ci.yml`, `npm test`) runs with no such secrets set, and `.env` is gitignored/untracked while `.env.test` carries no Supabase credentials. So this is a real, live gap, not a hypothetical: any test that imports `signal-normalize.js` as v3 left it would crash the whole CI test run, not just fail its own assertions.
- **P1 (query failure now aborts every lane):** confirmed. `fetchAllRows()` throws on error by design (that's the whole point of the primitive — unlike the raw `sb.from()` calls the article and podcast lanes still use, which silently degrade to `data === undefined` on error). v3's `gatherExpertPicks()` call inside `gatherItems()` had no try/catch around it, so a query failure in the expert lane — migrated onto a throwing primitive — would now propagate out of `gatherItems()` entirely, aborting the whole run and losing the article/podcast lanes' already-gathered items too. Before this migration, an expert-lane failure just silently produced zero expert items (nothing checked the raw call's `error`); after it, the same failure would tank everything. That's an unintended escalation this proposal introduced without noticing.
- **P2 (expert label dropped from `raw_text`):** confirmed directly against the current live code. The current `gatherItems()` expert-lane block builds `raw_text: \`[${p.expert || 'expert'}] ${text}\`` — the `[expert-name]` prefix is part of the string the LLM classifier sees. v3's `gatherExpertPicks()` sample dropped that prefix (`raw_text: text`), carried over by habit from the article lane's plain-text style rather than preserved from the actual expert-lane code being migrated.

## Finding responses

### P1 — Clean CI still cannot import the module (v3:15-37)

**Resolution:** defer the env validation and `createClient()` call out of module scope entirely, into a lazy `ensureEnv()` that only runs when something actually needs a live client — i.e., inside `main()`, not at import time. `sb`, `OPENAI_KEY`, `ANTHROPIC_KEY` become `let` bindings initialized to `null`/unset instead of `const`s computed unconditionally at load:

```js
const isOpenAI = (m) => /^(gpt|o[13])/i.test(m);

let sb = null;
let OPENAI_KEY = null;
let ANTHROPIC_KEY = null;

function ensureEnv() {
  if (sb) return sb;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  OPENAI_KEY = process.env.OPENAI_API_KEY;
  ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!SB_URL || !SB_KEY) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
  if (isOpenAI(MODEL) && !OPENAI_KEY) { console.error('✖ OPENAI_API_KEY not set'); process.exit(1); }
  if (!isOpenAI(MODEL) && !ANTHROPIC_KEY) { console.error('✖ ANTHROPIC_API_KEY not set'); process.exit(1); }
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
  return sb;
}

async function main() {
  ensureEnv();
  console.log(`🧭 signal-normalize — model ${MODEL}${DRY ? ' (DRY RUN)' : ''}${ONLY_SOURCE ? ` source=${ONLY_SOURCE}` : ''}`);
  const items = await gatherItems();
  // ...unchanged script body...
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
}
```

`callLLM()` (which references `OPENAI_KEY`/`ANTHROPIC_KEY` in its request headers) is unaffected in shape — those are still module-scope bindings, just populated lazily by `ensureEnv()` instead of eagerly at load. Every other function that touches `sb` (`gatherItems()`'s article/podcast lanes, `gatherHostSummaryRows()`, `gatherPickSignalRows()`, `gatherExpertPicks()`) is unaffected too: for a real script run, `main()` calls `ensureEnv()` first, so `sb` is populated before anything downstream needs it; for a wiring test that imports `gatherExpertPicks`/`buildExpertPicksRequest` directly and mocks `fetchAllRows()`, `ensureEnv()` never runs, `sb` stays `null`, and nothing dereferences it for real — the mocked primitive just records the call arguments, `sb` included, whatever its value.

This closes the gap Codex found by direct testing: importing `signal-normalize.js` in a clean environment (no `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/model keys set) now does nothing but define functions — no `process.exit(1)`, no `createClient()` call, no crash.

*Side note, not a fix requested here:* this same latent gap exists in `portfolio-dossier.js` today (confirmed by the same test: importing it with blank env vars kills the process the same way) — but since v3's factual claim that it's "already exercised by 5 tests" was wrong, nothing currently imports it in CI, so the gap has never actually surfaced there. Flagging this for awareness, not proposing to fix `portfolio-dossier.js` in this change — that file's Phase 3b work is already closed out and reopening it is outside this phase's scope unless Codex/Andy want it addressed separately.

### P1 — Query failure now aborts every lane (v3:54-68)

**Resolution:** wrap `gatherExpertPicks()`'s call site in its own degrade boundary, mirroring the article lane's per-page `try/catch` and the `fetchTeamStats()` all-candidates-fail warning already established in this proposal — so a query failure here behaves the same as it did before migration (zero expert items, run continues), but now with an explicit warning where before there was silent swallowing:

```js
export async function gatherExpertPicksSafe() {
  try {
    return await gatherExpertPicks();
  } catch (e) {
    console.warn(`   ⚠ gatherExpertPicks: ${e.message} — expert-pick lane skipped`);
    return [];
  }
}
```

`gatherItems()`'s expert-lane block calls the safe wrapper, not the throwing function directly:

```js
if (want('expert')) { items.push(...(await gatherExpertPicksSafe())); }
```

`gatherExpertPicks()` itself keeps throwing on failure — that's still correct and desirable for the wiring test, which needs to observe the real error surface `fetchAllRows()` produces. The degrade behavior lives one layer up, in `gatherExpertPicksSafe()`, which is exported and independently testable without touching `gatherItems()`, the article lane, or the podcast lane at all.

### P2 — Expert label was dropped from `raw_text` (v3:63-67)

**Resolution:** restore the `[${expert}] ` prefix in `gatherExpertPicks()`'s `raw_text`, matching the current live code exactly:

```js
export async function gatherExpertPicks() {
  const data = await fetchAllRows('gatherExpertPicks', buildExpertPicksRequest());
  const sorted = [...data].sort((a, b) => {
    const at = Date.parse(a.created_at); const bt = Date.parse(b.created_at);
    const av = Number.isFinite(at) ? at : -Infinity;
    const bv = Number.isFinite(bt) ? bt : -Infinity;
    if (av !== bv) return bv - av;
    return (b.id ?? '').localeCompare?.(a.id ?? '') ?? 0;   // user_picks.id is text, not numeric
  });
  const items = [];
  for (const p of sorted) {
    const text = [p.pick_type, p.selection, p.home && `${p.visitor} @ ${p.home}`, p.rationale].filter(Boolean).join(' | ');
    if (text.trim()) items.push({ source_type: 'expert_pick', source_ref: `pick:${p.id}`, raw_text: `[${p.expert || 'expert'}] ${text}`, author: p.expert || 'expert' });
  }
  return items;
}

export async function gatherExpertPicksSafe() {
  try { return await gatherExpertPicks(); }
  catch (e) { console.warn(`   ⚠ gatherExpertPicks: ${e.message} — expert-pick lane skipped`); return []; }
}
```

## Still open — not a technical finding, a product sign-off

Unchanged from v2/v3: `created_at` DESC (then `id` DESC as a string tiebreak) remains a recommendation Codex endorses on the mechanics but has not been authorized by Andy as the product's chosen order. This proposal continues to flag it as pending, not resolved.

## Unchanged from v1/v2/v3

Sites 1-3's shape assignments and schema analysis, the `TABLE_UNIQUE_KEYS` analysis, the `nfl_trench_ratings` (site 5) carve-out, the rowcap-scanner false-positive notes, the team-stats all-candidates-fail warning, the `game_id`-already-selected correction, the named-`main()` extraction and its `import.meta.url` guard (unaffected by this round — the guard itself was never in question, only what runs before it), and the overall single-batch sequencing recommendation are all unaffected by this round's findings and stand as written.

## Revised test plan summary (all four sites)

1. **Site 1** (`fetchTeamStats`): unchanged from v2/v3.
2. **Site 2** (`fetchSchedule`): unchanged from v2/v3.
3. **Site 3** (`fetchRefereeTendencies`): unchanged from v1/v2/v3.
4. **Site 4** (expert picks): `signal-normalize.js` gets (a) `ensureEnv()` lazy-initialization so importing the module does nothing but define functions in a clean environment — no live-credential requirement to import it; (b) the named `main()` + `import.meta.url` guard from v3, now calling `ensureEnv()` first; (c) the expert lane split into `buildExpertPicksRequest()` / `gatherExpertPicks()` (throwing, migrated onto `fetchAllRows()`) / `gatherExpertPicksSafe()` (catches and degrades, called by `gatherItems()`). New file `tests/unit/gatherExpertPicks.test.js` covers: the request shape and sort order via `gatherExpertPicks()` with `fetchAllRows` mocked to resolve; the `[expert] ` prefix and full `raw_text` shape on a sample row; and `gatherExpertPicksSafe()` returning `[]` and warning when `fetchAllRows` is mocked to reject — all three importable and runnable with zero Supabase credentials present, and zero live network calls. The `created_at`-descending sort order remains flagged for explicit Andy sign-off, not presented as resolved.
