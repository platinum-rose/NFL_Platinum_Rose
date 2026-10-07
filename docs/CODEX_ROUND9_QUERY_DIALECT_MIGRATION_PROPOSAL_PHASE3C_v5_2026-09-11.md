# Query Dialect Migration — Phase 3c Proposal v5 (Response to Codex's Fifth Review)

**Date:** 2026-09-11
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v4_2026-09-11.md` (v4), which Codex reviewed and returned **changes requested** (1 P1). Still a proposal only — no Phase 3c code has been written.

## Verdict on the review

Correct, and it catches a second wrong claim of mine in as many rounds — this time not a design error but a factual one about what the codebase already does.

v4's "side note" said this same `process.exit(1)`-on-blank-env gap exists in `portfolio-dossier.js` too, but "nothing currently imports it in CI, so the gap has never actually surfaced there." **That was wrong.** Re-checked properly this time — my earlier grep (`grep -rl "from '../../agents/portfolio-dossier.js'" tests/`) only matched *static* `import` statements and missed **dynamic** `import()` calls. `tests/unit/pickSignalFloor.test.js` — Phase 3b's own, already-approved wiring test — dynamically imports `agents/portfolio-dossier.js` three times (lines 59, 72, 89), to get the real `fetchPickSignals`/`fetchUserPicks` functions it wiring-tests. Reproduced directly, not assumed:

```
SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= OPENAI_API_KEY= ANTHROPIC_API_KEY= npx vitest run tests/unit/pickSignalFloor.test.js
```

fails exactly 3 of 9 tests, each with `Error: process.exit unexpectedly called with "1"` at `agents/portfolio-dossier.js:57` — the same `if (!SB_URL || !SB_KEY) { ...; process.exit(1); }` line flagged before. Confirmed separately that `.github/workflows/ci.yml`'s "Unit tests (Vitest)" step runs `npm test` with no `env:` block at all — no `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` passed in — so a real clean checkout in that job hits exactly this condition. This is a genuine, already-existing gap in Phase 3b's approved code (still uncommitted in this checkout, per the standing no-commit-without-approval rule -- "approved" is not "merged"), not a hypothetical or something Phase 3c introduces. It went unnoticed at Phase 3b approval time because Codex's own verification of that phase ran "from an environment with live Supabase access" (per the 2026-09-11 approval note), which had real credentials and never exercised this path.

## Resolution — Phase 3b addendum (not new Phase 3c scope, but gating it per Codex)

Apply the identical lazy-initialization pattern already designed for `signal-normalize.js` in v4, to `portfolio-dossier.js`. This file is simpler — it only needs `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (no model/LLM key branching), so the patch is smaller:

```js
// was, at module scope (agents/portfolio-dossier.js:55-58):
// const SB_URL = process.env.SUPABASE_URL;
// const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// if (!SB_URL || !SB_KEY) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
// const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

let sb = null;
function ensureEnv() {
  if (sb) return sb;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_URL || !SB_KEY) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
  return sb;
}
```

and `main()` (line 1993) gets one new first line: `async function main() { ensureEnv(); ... }`. Every other function that references `sb` (`fetchPickSignals`, `fetchUserPicks`, `fetchTeamStats`, `fetchSchedule`, `fetchRefereeTendencies`, etc.) is unaffected in shape — for a real script run, `main()` calls `ensureEnv()` before anything downstream needs a live client; for `pickSignalFloor.test.js`'s existing wiring tests, which import `fetchPickSignals`/`fetchUserPicks` directly and mock `fetchAllRows()`, `ensureEnv()` never runs and `sb` stays `null` — harmless, since the mocked primitive never dereferences it for a real query.

**Verified directly, not assumed:** patched a scratch copy of `portfolio-dossier.js` with exactly this change, pointed a scratch copy of `pickSignalFloor.test.js` at it, and re-ran the same blank-env command above — **9/9 passing**, all three previously-failing tests included. Both scratch files were removed from the tracked tree immediately after (moved to `_to_delete/`, since this device-bridge shell can't delete files outright — flagging that folder for Andy to empty; it already held a few other stale scratch artifacts from earlier sessions, unrelated to this check). No change was made to the real, tracked `agents/portfolio-dossier.js` — this is a proposal only, same as everything else in this document; the patch above is what would be applied, pending Codex/Andy sign-off, since this technically reopens an already-approved Phase 3b file rather than a new Phase 3c site.

This is the same class of fix already designed and accepted (implicitly, since no new finding was raised against it) for `signal-normalize.js` in v4 — applying it to `portfolio-dossier.js` is mechanical, not a new design decision.

## Still open — not a technical finding, a product sign-off

Unchanged: `created_at` DESC (then `id` DESC, string tiebreak) for the expert-pick lane remains a Codex-endorsed recommendation, not an Andy-authorized product decision. Still flagged as pending, not resolved. Both this and the addendum above are the two items Codex named as blocking Phase 3c's implementation approval.

## Unchanged from v4

Everything in `signal-normalize.js`'s plan — `ensureEnv()` lazy init, the named `main()` + `import.meta.url` guard, `buildExpertPicksRequest()`/`gatherExpertPicks()`/`gatherExpertPicksSafe()`, the restored `[expert] ` prefix, the string-tiebreak sort comparator — stands as written in v4, unaffected by this round's finding. Sites 1-3's shape assignments and schema analysis, the `TABLE_UNIQUE_KEYS` analysis, the `nfl_trench_ratings` (site 5) carve-out, the rowcap-scanner false-positive notes, the team-stats all-candidates-fail warning, and the `game_id`-already-selected correction are all unaffected and stand as written.

## Revised test plan summary (all four sites, plus the addendum)

1. **Site 1** (`fetchTeamStats`): unchanged from v2-v4.
2. **Site 2** (`fetchSchedule`): unchanged from v2-v4.
3. **Site 3** (`fetchRefereeTendencies`): unchanged from v1-v4.
4. **Site 4** (expert picks): unchanged from v4 — `ensureEnv()` lazy init, named `main()`, `gatherExpertPicks()`/`gatherExpertPicksSafe()` split, `[expert] ` prefix restored, new `tests/unit/gatherExpertPicks.test.js`.
5. **Phase 3b addendum** (not a new site, a fix to already-approved code): apply the same `ensureEnv()` lazy-init pattern to `portfolio-dossier.js` so `pickSignalFloor.test.js`'s existing dynamic imports of it no longer crash under blank Supabase credentials. No new test file needed — the existing 9 tests in `pickSignalFloor.test.js` are the verification, and they now pass with those credentials blank (verified above on a scratch copy; re-verify on the real file once this addendum is applied for real).

`created_at`-descending remains flagged for explicit Andy sign-off, not presented as resolved.
