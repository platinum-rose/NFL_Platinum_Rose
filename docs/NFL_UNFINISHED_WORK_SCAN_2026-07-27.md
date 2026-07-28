# NFL Dashboard — Unfinished Work Scan

_2026-07-27, S302 (ATLAS). HEAD `21caa1d`. Cross-checked TASK_BOARD.md / WORKING-CONTEXT.md against live `git status`, an independent TODO/FIXME/stub code sweep, `docs/NFL_AUDIT_BACKLOG.md`, and the test suite for skip markers._

**Bottom line:** this project already tracks its own open work unusually well — `TASK_BOARD.md` is current as of today (S317) and its "Next Immediate Action" section is essentially this same list. The independent code sweep below turned up nothing not already on the board. The main gap isn't missing tracking, it's a pile of uncommitted work sitting on disk and a few Andy-blocked decisions.

---

## 1. Uncommitted work on disk (do this first)

`git status` confirms TASK_BOARD's own note — HEAD `21caa1d` has real, tested, finished work sitting uncommitted:

- Modified: `TASK_BOARD.md`, `WORKING-CONTEXT.md`, `docs/NFL_AUDIT_BACKLOG.md`, `packages/m6-podcast-service/src/config.js`, `packages/m6-podcast-service/src/server.js` (OPS-2)
- New: `src/lib/gameId.js`, `tests/unit/gameId.test.js` (GAMEID-FORMAT option b)
- Stray untracked file: `packages/m6-podcast-service/src/server_orig_test.js` — a scratch file from S317's investigation that the sandbox couldn't delete (`Operation not permitted`, same class of issue as a stale `.git/index.lock`). Contents were neutralized to a no-op, but it needs a manual `git rm` or Explorer delete on your end — it shouldn't get committed as-is.

Nothing here is unfinished *work* — it's finished, tested (825/825, `npm run build` green) and just needs a native commit+push.

## 2. In Progress

**NFL-ATLAS-3 — Podcast host-summary pipeline.** Substantial real build (AssemblyAI diarization, per-host futures extraction, migrations 035-037 live, 75-episode backfill done, 40/40 Obsidian notes written). Two genuinely open items: (1) whether/how to wire it into the weekly ingest cron — your call, not yet made; (2) a deferred Fable-5 comparison pass — explicitly non-blocking.

## 3. Open Backlog — Features

| ID | What's open | Blocker |
|----|----|----|
| F-29b | Approve/Reject buttons on the Official Picks tab have never been exercised against a real draft | Needs a candidate draft to exist first (inbox is currently empty) |
| F-26 | Fantasy: roster/waiver intel + weekly-projections spec, Phase B (props-derived projections) | Phase B blocked on the same real-prop-odds source as PROPS-1 |
| F-26b | IDP / team-DEF configurable scoring | Blocked on Yahoo Fantasy API approval (submitted 2026-07-26, 1-2 week SLA — still pending) |
| F-14 | Vault pre-load — PFF/ATS/splits reference data | Waiting on you to drop source files into `data/vault-seed/{pff,ats,splits}/` |
| NFL-ATLAS-1 | Futures watchlist with expert agree/disagree citations | Not started — likely joinable against existing signal data, just needs building |
| NFL-ATLAS-2 | Daily digest redesign (readability/actionability) | Blocked on you — needs scoping answers (what's hard to read/act on, any example format you like) before it can start |
| GAMEID-FORMAT (c) | Full standardize + backfill of the 3 incompatible `game_id` formats across live tables/crons | Deliberately deferred — real risk to production ingest, needs dedicated native-testing time. Option (b), the low-risk canonical-key helper, is done. |

## 4. Open Backlog — Bugs

| ID | What's open | Notes |
|----|----|----|
| BET-1 | DraftKings/FanDuel bet-slip parsers are TODO stubs | `src/lib/betImport.js:317,326` — only manual bet entry works today |
| PROPS-1 | Player-props tab has no live data source | `src/lib/propsTools.js` — generates deterministic stub lines since F-8; needs a paid TheOddsAPI tier or a dedicated prop aggregator |
| F-27a | Podcasts tab "black-on-black" CSS report | Investigated live (S314) — no repro across every rendering branch + a full contrast scan. Likely environment-specific (dark-mode extension, OS high-contrast). Blocked on you for a screenshot next time it happens. |
| NFL-BACKLOG | `npm run dev` returned 503 then went fully unreachable mid-session (2026-07-27) | Not caused by any file edit that session. Needs you to check that terminal for a crash/OOM, or just restart it |

## 5. Schema-only / not yet applied

- **Migration 044** (`platinum_rose_ai_official_picks_and_team_profiles.sql`) — written, not applied to the live database. Feeds F-29.

## 6. Andy-blocked, no code work pending

- **Yahoo Fantasy API approval** — submitted 2026-07-26, still pending. Blocks F-26 (remainder) and F-26b entirely.
- **Anthropic API credit** — account ran out mid-F-31; OpenAI/gpt-4o worked as a fallback. Your call whether to top up.
- **NFL-ATLAS-2 scoping** — needs your answers before it can start (see above).
- **NFL-ATLAS-3 cron decision** — needs your call on weekly-ingest wiring.

## 7. Independent verification (nothing new found)

- **TODO/FIXME/stub sweep** across `src/`, `agents/`, `scripts/`: the only real markers are `betImport.js:317,326` (BET-1) and `propsTools.js`'s stub-prop generator (PROPS-1) — both already tracked. Everything else that matched was JSX `placeholder=` attribute noise, not unfinished-work markers.
- **`docs/NFL_AUDIT_BACKLOG.md`**: original 32/32 Meridian+CODEX+Fable audit items closed; both later follow-ups (FABLE-01, FABLE-03) closed; the one 2026-07-21 follow-up (GAMEID-FORMAT) resolved 2026-07-27. 0 open.
- **Test suite**: no `.skip()`, `it.todo()`, `describe.skip()`, or `xfail` markers found anywhere in `tests/`. Full suite is 825/825 passing as of the last native run (S316).

---

_Everything above is already mirrored in `TASK_BOARD.md`'s BACKLOG section and `WORKING-CONTEXT.md`'s "Next Immediate Action" — this document exists as a cross-checked, independently-verified snapshot, not a new tracking system. Keep `TASK_BOARD.md` as the source of truth going forward._
