# HANDOFF_PROMPT.md - NFL Platinum Rose

> Rolling session handoff. Read this first in a fresh session, then read `WORKING-CONTEXT.md` and `TASK_BOARD.md`.

## Persistent Backlogs

> Read the source file and mark items there, not in this handoff.

| Backlog | File | Open Items | Last Touched |
|---|---|---:|---|
| NFL Dashboard Audit Findings | `docs/NFL_AUDIT_BACKLOG.md` | 1 (`GAMEID-FORMAT`, unrelated/non-blocking) | 2026-07-21 |

## Last Session Summary

- Date: 2026-07-27 (sessions S309-S313)
- Branch: `main`
- Working tree: clean, HEAD `c687af4`, pushed and confirmed (`5b98df4..c687af4`)
- Latest timestamped handoff: `handoffs/2026-07-27-0224.md`
- Verification: F-30b's RSS scout unit-tested (15/15, mocked) then live-verified natively (S313: 5/6 feeds healthy). F-33's board validator unit-tested (25/25) plus regression-checked against `winDist.test.js`/`portfolioSimulate.test.js`. Full `npm test` suite not run end-to-end this session (sandbox ~45s command timeout) — tracked as F-32.
- Live API calls: none from the sandbox. Andy ran one live RSS fetch natively (S313, read-only feed check, `--dry-run` so nothing persisted).
- Supabase writes: none.
- Open parlay changes: none.

## Current Objective

Working through `TASK_BOARD.md`'s backlog item by item, verifying each against actual code before trusting the board's description (it has been stale more than once this cycle — F-33 and OPS-1 both needed board corrections). This session closed out the remaining F-27 UI QC findings, shipped training-camp RSS scout Phase 2 plus its first live-network verification, added the win-dist/coherence-sim spec's missing mechanical board validator, and gave `stats-to-vault-sync.js` a recurring cron trigger it never had.

## Sandbox Network Constraint (read before choosing next task)

This Cowork sandbox's outbound proxy can reach `api.anthropic.com` and `github.com` but blocks espn.com, pff.com, rotowire.com, sharpfootballanalysis.com, footballoutsiders.com, profootballtalk.nbcsports.com, `api.openai.com`, and `*.supabase.co`. Confirmed repeatedly (F-30c, OPS-1's Supabase check). Any task needing live RSS/API/Supabase access must be run natively by Andy (Windows PowerShell, `E:\dev\projects\NFL_Dashboard`) — the sandbox can prep the command and interpret pasted output, but cannot execute it directly. The sandbox bash tool also has a hard ~45s timeout, which blocks full `vite build` / full 38-file `npm test` runs — those need a native run too (F-32).

## Andy's Known Personalization

- Futures unit: `$20`
- In-season unit: `$10`
- Bills vs Packers exacta: `$100` at `+6500`
- Bills Super Bowl target cap: about `$200`
- Packers Super Bowl target cap: about `$200`
- Primary planned exposure cap: about `$500`
- Bills and Packers are anchors; their exacta is a cross-anchor amplifier, not a hedge
- Six open parlays exist with 11 open slots and `$162.50` sunk stake, but all are beyond 90 days and their availability is unresolved
- Kickers are explicitly out of scope for fantasy scoring (not meaningfully drafted with strategy)

Do not fill, close, modify, or rely on an open parlay unless Andy explicitly directs it after resolving the house rule.

## Safe Commands

```powershell
npm.cmd run test:portfolio-corpus
npm.cmd run training-camp:scout:live -- --dry-run
node --check agents\portfolio-synthesize.js
node --check agents\lib\board-validate.js
node --check scripts\training-camp-rss-scout.js
```

Do not run a live paid LLM analyst command, write to Supabase, overwrite canonical reports, or modify open parlay records without explicit approval.

## Modified And Added Files (S309-S313)

- `src/lib/injuries.js`, `src/lib/storage.js` - injury live/mock-fallback source tracking (F-27c)
- `src/components/injuries/InjuryCenter.jsx`, `src/components/modals/InjuryReportModal.jsx`, `src/components/dashboard/MatchupCard.jsx` - mock-data warning surfacing (F-27c)
- `src/components/modals/PulseModal.jsx` - real Critical Injuries data instead of placeholder (F-27d)
- `src/components/modals/ContestLinesModal.jsx` - removed dead "Fetch Official Lines" button (F-27e)
- `scripts/training-camp-intel.js` - refactored to export reusable pieces (F-30b)
- `scripts/training-camp-rss-scout.js` - new RSS/Atom scout, 6 feeds, `--live` gated (F-30b)
- `config/training-camp-sources.json`, `package.json` - scout wiring (F-30b)
- `tests/unit/trainingCampRssScout.test.js` - 15 new tests (F-30b)
- `agents/lib/board-validate.js` - new mechanical board validator (F-33)
- `agents/portfolio-synthesize.js` - wired validator in, additive/annotate-and-keep (F-33)
- `tests/unit/boardValidate.test.js` - 25 new tests (F-33)
- `.github/workflows/stats-to-vault-sync.yml` - new recurring cron (OPS-1)
- `TASK_BOARD.md`, `WORKING-CONTEXT.md`, `HANDOFF.md`, `HANDOFF_PROMPT.md` - refreshed session state
- `handoffs/2026-07-27-0224.md` - this session's full timestamped handoff

## Immediate Next Steps

Pick one:

1. **F-32** - full `npm test`/`vite build` re-run, needs a native run (sandbox timeout). Also live-smoke-test `get_youtube_futures_intel` from the FUTURES/BETTING chat UI.
2. **F-29b** - Official Picks live approve/reject smoke test. Needs a real draft in `data/official-picks/proposals/active/` first (currently empty).
3. **F-31** - live futures watchlist re-run (`--no-persist --out-suffix watchlist-v2`). Real paid Anthropic/OpenAI model call — needs Andy's explicit per-run cost go-ahead, not yet given.
4. **F-33b** - `tests/unit/portfolioSimulate.test.js` only has 1 test; the spec's B.6 acceptance criteria (conservation, mean-within-tolerance, known-case fixture, calibration honesty, determinism) aren't fully covered.
5. **F-27a** - Podcasts tab black-on-black CSS. Needs visual/browser debugging tools this sandbox doesn't have.

Also still pending: Yahoo Fantasy API access (application submitted 2026-07-26, awaiting review, 1-2 week SLA) — blocks the rest of F-26 and all of F-26b.

## Resume Command

```text
Resume Platinum Rose NFL. HEAD = c687af4 (main). Suite: not re-run this session (F-32). S309-S313 shipped: F-27c/d/e (injury mock indicator, PulseModal critical injuries, ContestLinesModal dead button), F-30b (training camp RSS scout Phase 2), F-33 (mechanical board validator), OPS-1 (stats-to-vault-sync cron), F-30c (live feed-health check, ran natively, 5/6 healthy). Next: F-32, F-29b, F-31 (needs cost approval), F-33b, or F-27a. Read HANDOFF_PROMPT.md for full context before touching any file.
```
