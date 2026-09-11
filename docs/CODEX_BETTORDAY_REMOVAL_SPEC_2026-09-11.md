# Spec: Retire BettorDay entirely (dead synthesis function + daily ingest workflow + writer)

**Date:** 2026-09-11 (revised same day, twice, after Codex's second and third reviews)
**Status:** Change already made in the working tree, NOT staged, NOT committed. Requesting review before staging/committing.
**Revision note:** this file previously described a narrower, one-file change and was reviewed as such (changes requested). It has been overwritten in place with the corrected, complete version below rather than kept as a separate "v2"/"v3" file, so every link to this path (from `HANDOFF_PROMPT.md` and `HANDOFF.md`) resolves to current content once this file is tracked and committed alongside the code changes it documents. Two rounds of findings, verified independently and confirmed real, are folded in below: the first review's three findings, and the second review's file-count error plus the local-vs-operational distinction (its own dedicated section, added below Part 1).

- **P1 (ingestion still active) — confirmed and now fixed.** You were right: `.github/workflows/bettorday-intel-ingest.yml` was committed, undisabled, and ran daily (`0 13 * * *`) invoking `agents/bettorday-newsletter-ingest.js`, which was still committed at HEAD — the writer's deletion existed only in Andy's local uncommitted tree, invisible to CI. "Gone for good" was false for ingestion at the time I wrote it. Andy has now explicitly authorized retiring the workflow and the writer together in this same pass. IMPORTANT DISTINCTION (per Codex's third review): that retirement is prepared and committed-pending locally only — it has NOT been pushed, and origin/main (last known `103d3ef`) still contains both files, so the daily GitHub Actions job is still operationally live right now. See "Local vs. operational retirement" below Part 1.
- **P2 (stale handoff docs) — confirmed and narrowly patched, not broadly rewritten.** See Part 2.
- **P2 (false test-coverage claim) — confirmed as my error, corrected.** `tests/unit/evidenceTierGate.test.js` imports `agents/lib/board-validate.js`, not `agents/portfolio-synthesize.js`. My earlier claim came from a bare substring grep for "portfolio-synthesize" that matched a comment string (line 612: "moved from portfolio-synthesize.js and hardened", describing an unrelated function that moved *out of* that file in a past round) — not an import. Confirmed by reading the actual `import` lines directly. This spec no longer claims that test exercises the deletion. Honest statement of coverage: no test in the repo imports or directly exercises `agents/portfolio-synthesize.js`. The only checks performed are `node --check` (syntax) and the project's full Vitest suite (which you separately ran: 104 files, 1,515/1,515, exit 0) — the full suite passing is expected regardless of this deletion's correctness, since nothing in it imports the changed file.

This revision also fixes two things your second review caught (see below): a leftover comment elsewhere in the codebase that still recommended reactivating BettorDay, and this file's own dangling-link problem.

## Part 1: what changed (five files, all clean/isolated)

**1a. `agents/portfolio-synthesize.js`** — unchanged from the first pass: `_loadBettorDayTrenchEvidence()` deleted in full (was lines 1647-1733: header comment + both Supabase/local-file branches + reducer + byTeam assembly), zero call sites confirmed before deletion, stale caller-side comment replaced. `node --check` passes. Diff: 2 hunks, +6/-92.

**1b. `.github/workflows/bettorday-intel-ingest.yml` — deleted in full.** This is the daily cron (`0 13 * * *`) that invoked the writer with live `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` secrets. Deleting the file (not just disabling the schedule trigger) matches how the writer itself is being retired — full removal, no dormant remnant. This deletion is local/committed-pending only; the job keeps running on GitHub Actions off `origin/main` until this is pushed (see below).

**1c. `agents/bettorday-newsletter-ingest.js` — deletion carried forward.** This file already showed as deleted (`D`) in Andy's local working tree before this session touched anything — pre-existing, not something I did. What I did: confirmed it's genuinely orphaned now that both its caller (1a) and its scheduler (1b) are gone, and verified no other file in `agents/`, `tests/`, or `scripts/` references either the writer's filename or the local JSON file it wrote (`data/intel/bettorday_trench_ratings_2026.json`) — both grepped clean.

**1d. `scripts/lib/dossier-freshness-gate.js` — one comment-only fix, no behavior change.** This freshness-tracking lane was already removed here back on 2026-09-09 (a prior Codex finding), so there was never any live code to change. But the explanatory comment's closing line — "If Andy resumes the BettorDay subscription and re-wires the loader, re-add this lane... at that point, not before" — assumed BettorDay might be paused and later resumed. That directly contradicted today's retire-for-good decision. Replaced with a note dated 2026-09-11 stating the retirement is not expected to be reactivated, and that any future trench/line-quality evidence lane would be a fresh addition against a new source (a new freshness-gate lane), not a restoration of this one. Nothing outside the comment block changed; `node --check` still passes.

**1e. `docs/CODEX_BETTORDAY_REMOVAL_SPEC_2026-09-11.md` (this file) — proposed as the fifth whole Part-1 file (seventh overall, counting the two handoff files staged by hunk in Part 2).** Your review correctly caught that the two handoff docs (Part 2 below) link to this exact path, but the path was never tracked by git and its prior content was the stale one-file version — committing the five files above without this one would leave two dangling/misleading links in a clean checkout. Fix: this file is overwritten in place with the corrected content (this revision), and is proposed to be staged and committed alongside the other changes it documents, rather than left as untracked scratch. (Unlike the earlier v1-v4 Site 5 migration proposal docs, which were genuinely superseded drafts of an abandoned plan and don't need to be tracked, this document is the permanent record of a completed, executed change — closer in kind to a commit message than to an iteration draft.)

**Verification for Part 1:**
- `grep -rln "bettorday-intel-ingest"` across `.github`, `agents`, `scripts`, `tests`, `README.md` — no matches (workflow name is not referenced elsewhere, e.g. no badge, no dependent workflow).
- `grep -n "bettorday" package.json` and `grep -rl "bettorday" .github/workflows` — both empty (no npm script, no other workflow references it).
- `grep -rln "bettorday-newsletter-ingest"` across `agents`, `tests`, `scripts` — only the now-deleted workflow file matched (confirmed before deleting it).
- `grep -rln "bettorday_trench_ratings_2026"` (the local JSON output path) across `agents`, `tests`, `scripts` — no matches.
- `grep -rln "_loadBettorDayTrenchEvidence"` across `agents`, `tests`, `scripts`, `.github` — two matches, both historical comments only (no live call): `agents/portfolio-synthesize.js` (my own replacement comment, expected) and `scripts/lib/dossier-freshness-gate.js` (now corrected per 1d above).
- `node --check` passes on both `agents/portfolio-synthesize.js` and `scripts/lib/dossier-freshness-gate.js`.

**Not deleted, deliberately:** `supabase/migrations/053_bettorday_intel.sql` (historical schema — a past migration is not something you unwind by deleting the file) and `nfl_trench_ratings` itself (a table left in place with no writer and no reader is inert, not a liability — dropping it is a separate database decision Andy hasn't been asked about and this spec does not request). The two public fantasy HTML artifacts you flagged that embed BettorDay data (confirmed not reaching Futures synthesis) are also untouched — full source retention/privacy retirement is explicitly out of scope here, same as your first review noted.

## Local vs. operational retirement — not yet effective on GitHub Actions

Per Codex's third review: everything in Part 1 is a **local, committed-pending** change. It is not yet pushed. Confirmed directly:

```
$ git rev-parse HEAD
5ab2d9b561bd13587f009601cab20574b835c715
$ git rev-parse origin/main
103d3efee1f5b19326a20c6ce04ef3f498704dce
$ git rev-list --left-right --count HEAD...origin/main
2	0
$ git cat-file -e origin/main:.github/workflows/bettorday-intel-ingest.yml && echo present
present
```

`origin/main` (last known ref) still contains the daily workflow file untouched. Because GitHub Actions schedules run off the default branch on the remote, not off anyone's local working tree or local commits, **the daily 13:00 UTC ingest job is still live right now** and will keep running until this closeout is pushed. Note also that this session could not do a live `git fetch` (credentials unavailable here), so `103d3ef` is the last known state, not a guaranteed current one — another reason this must be verified fresh at push time, not assumed from local refs.

So there are two distinct milestones, not one:
1. **Locally prepared/committed retirement** (this spec, once staged and committed) — the intended end state exists in git history on this machine.
2. **Operationally effective retirement** — only true after (a) this is pushed to `origin/main`, and (b) someone confirms on GitHub's Actions tab that the workflow is actually gone / no longer listed as scheduled (a push removes the file from the branch GitHub reads, but the safest confirmation is looking at the Actions UI directly, not inferring it from the git history alone).

This spec requests authorization for milestone 1 (staging/commit) only. Push, and the remote verification step in (b), are separate, later authorizations — not requested here.

## Part 2: stale handoff docs — narrow patch, not a rewrite

Per your instruction not to broadly overwrite the dirty handoffs:

**`HANDOFF_PROMPT.md`** — two surgical edits, both wrapped in strikethrough + a dated superseding note rather than deleted outright, so the original claim stays visible as corrected history:
- Item 6 of "First Reads" (previously asserted `_loadBettorDayTrenchEvidence()` as a genuinely-unmigrated site "entangled with the still-unauthorized `nfl_trench_ratings` surrogate-key schema migration") — struck through, replaced with a note that the site no longer exists and pointing to this spec (path unchanged, content now correct per 1e above).
- Item 2 of "What's Next" (previously asserted "Site 5... remains out of scope — still needs its own surrogate-key schema migration proposal") — struck through, replaced with a note that Site 5 is abandoned, not deferred.

Both edits are pure text replacement of the exact stale sentences — nothing else in the file touched.

**`HANDOFF.md`** — this file is 1,258 lines, auto-generated per session, and already carried substantial pre-existing uncommitted changes unrelated to this work before I touched it (it was already `M` in the dirty tree at session start; your own diff-stat confirms this: `+997/-3` relative to HEAD, far more than the one banner I added). A full `git diff` on it mixes my edit with that unrelated pre-existing content, which is explicitly out of scope. So: one addition only, inserted immediately after the "Current Pick Up Here" header, not touching any of the dozen-plus historical `nfl_trench_ratings`/Site-5 references scattered through the rest of the file:

```
> **SUPERSEDING NOTE (2026-09-11, scoped closeout, not a rewrite of history below):**
> every reference in this file to an `nfl_trench_ratings` surrogate-key migration, a
> `_loadBettorDayTrenchEvidence()` Site 5 carve-out, or BettorDay-lane authorization being
> pending is now stale. Andy's explicit call: BettorDay is retired for good, not deferred.
> The dead function was deleted (not migrated), and the daily ingest workflow
> (`.github/workflows/bettorday-intel-ingest.yml`) plus its writer
> (`agents/bettorday-newsletter-ingest.js`) were retired in the same pass, LOCALLY — prepared
> and committed-pending on this machine, not yet pushed. The daily GitHub Actions job remains
> operationally live on `origin/main` until this is pushed and remote-verified; treat it as
> still running until then. No surrogate-key migration will run; the historical entries below
> are left as-is (not broadly rewritten) — read them as superseded record, not as open next
> steps. Full detail: `docs/CODEX_BETTORDAY_REMOVAL_SPEC_2026-09-11.md`.
```

This is deliberately a banner, not a hunt-and-fix of every historical line — matching your instruction.

**Staging instruction for both files (per your P2 finding):** when staging is authorized, `HANDOFF_PROMPT.md` and `HANDOFF.md` must be staged by exact hunk — `git add -p` (or an applied patch limited to these insertions) — never a whole-file `git add`. Both files carry substantial pre-existing unrelated uncommitted content that is explicitly out of scope for this closeout commit; only the two marked replacements in `HANDOFF_PROMPT.md` and the one banner in `HANDOFF.md` belong in it.

## What I have not done

- Not staged, not committed, not pushed. Six files now touched in total: `agents/portfolio-synthesize.js` (modified), `.github/workflows/bettorday-intel-ingest.yml` (deleted), `agents/bettorday-newsletter-ingest.js` (deleted, pre-existing), `scripts/lib/dossier-freshness-gate.js` (one comment fix), `HANDOFF_PROMPT.md` (two surgical edits, to be staged by hunk), `HANDOFF.md` (one banner insertion, to be staged by hunk) — plus this document itself, proposed as a seventh, `docs/CODEX_BETTORDAY_REMOVAL_SPEC_2026-09-11.md`.
- Not run the full Vitest suite myself in this session (exceeds this environment's per-command time budget) — relying on your independently-run 1,515/1,515 for the baseline, plus my own `node --check` on both files with executable changes.
- Not touched `supabase/migrations/053_bettorday_intel.sql`, the `nfl_trench_ratings` table itself, or the two public fantasy HTML artifacts — all explicitly out of scope per the discussion above.
- Not touched any other line in `HANDOFF.md` beyond the one banner, or anything in `HANDOFF_PROMPT.md` beyond the two marked replacements.

## What I need from you

1. Is this closeout now complete — file-count corrected, local-vs-operational distinction adequately drawn, no remaining dangling link, no remaining reactivation-implying comment, no remaining live caller/scheduler in the working tree?
2. Is treating this spec file as a tracked, committed closeout record (rather than deleting it or stripping the links) the right call, or would you rather the two handoff links be removed instead and this file stay untracked?
3. Anything else before this goes back to Andy for staging/commit authorization?
