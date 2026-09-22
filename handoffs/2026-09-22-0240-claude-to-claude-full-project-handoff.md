# Full Project Handoff — NFL_Dashboard ("Platinum Rose")
> Written 2026-09-22 by the outgoing Claude (Cowork) session, for a fresh Claude team with zero prior context on this repo. Read this top to bottom before touching anything. It orients you; it does not replace `HANDOFF.md` (the rolling session-to-session log — read that too, especially its top "Current Pick Up Here" block).

---

## 1. What this project is

**Platinum Rose** is Andy's (the user's) personal NFL betting/fantasy/analytics operation. It is a real-money system: Andy places real wagers at real sportsbooks (BetOnline, Bookmaker.eu, and others) and this repo tracks, analyzes, and helps him make those decisions. Treat all financial data as real, not a demo.

It's a full-stack repo with two very different halves:
- **A React web app** (`src/`) — "NFL Platinum Rose" — a dashboard for schedule/odds/splits/picks/futures/bankroll tracking, deployed as a static site (Vite, GitHub Pages-style `/platinum-rose-app/` base path).
- **A huge Node.js data/agent pipeline** (`agents/`, `scripts/` — 242 scripts) — ingestion agents (odds, injuries, fantasy, futures, podcasts, Twitter, YouTube, nflverse stats, expert picks, SuperContest lines, etc.), report builders, a "live tracker" HTML generator for real-time bet tracking during games, and an official-pick ledger system.

GitHub remote: `platinum-rose/NFL_Platinum_Rose`. Local path: **`E:\dev\projects\NFL_Dashboard`** on Andy's Windows machine (device name `laptop-1p2j0006`), reached from a Cowork session via the `mcp__remote-devices__device_bash` bridge (a Linux VM with the repo mounted at `$HOME/mnt/dev/projects/NFL_Dashboard`). There is no cloud-container copy of this repo — always work through the device bridge, never assume the code is available in the cloud sandbox's own filesystem.

---

## 2. Standing constraints — read before doing ANYTHING

These override any generic instinct to "ask before every write." They are the accumulated, Andy-confirmed rules of engagement:

- **Git commit/push guardrail is REPEALED (as of 2026-09-15).** You may commit and push using normal judgment and the conventions in `RULES.md`/`CLAUDE.md` (conventional-ish messages, `git push --force-with-lease` never `--force`, check `AGENT_LOCK.json` before force-pushing). No per-commit sign-off needed. **However:** the working tree is deliberately large and dirty (hundreds of modified/untracked files spanning real feature work, generated data, and throwaway scratch/probe scripts) — do NOT `git add -A` and commit it all at once. Stage and commit in small, reviewed, logically-scoped batches.
- **Supabase writes need per-change authorization from Andy.** Read-only Supabase access is fine and normal (see `src/lib/supabase.js`).
- **Paid synthesis/APIs need per-change authorization** (anything that costs real money per call beyond routine, already-budgeted API usage).
- **Never run `npx eslint` / `npm run lint` / `npm run test` / `npx vitest` directly from a Cowork/device-bridge session — they hang.** Use `node node_modules/eslint/bin/eslint.js <path>` and `node node_modules/vitest/dist/cli.js run <file>` directly instead. Cold-cache timeouts on the first invocation of a session are common and usually succeed on retry — but be aware eslint has been observed to time out repeatedly (4 times in a row, up to the device-bridge's 180s cap) even on retry late in a long session; this is an open, unresolved reliability gap. `node --check` is the reliable fallback gate.
- **Critical verification lesson for `scripts/generate-live-tracker.mjs`:** `node --check` on that file only validates the *generator's* own template-literal syntax, NOT the JS string it emits into the output HTML's inline `<script>` block. A template-literal escaping bug can pass `node --check` on the generator and still ship broken JS to the browser. Always extract the embedded script from a freshly generated output file (`re.findall(r'<script>(.*?)</script>', html, re.S)`, take the largest match) and run `node --check` on THAT separately before trusting an edit to this file.
- **Never invoke, dry-run included, anything touching VegasInsider** (standing restriction, source unclear/unconfirmed from an earlier session — treat as a hard no until Andy says otherwise).
- **Claude's own browser tools (built-in Browser pane, and likely Claude in Chrome too) categorically refuse betonline.ag and bookmaker.eu** ("not allowed due to safety restrictions"). Never assume a future session can browse those sites directly — live prop-line capture from those books is human/agent-assisted (Andy or Codex reading the real logged-in session), by deliberate design (bot-detection/account-restriction risk on real-money accounts ruled out a headless Playwright scraper).
- **Roster verification is a standing rule** (Andy corrected this twice): before calling a player "wrong team" / "data contamination" from stale training knowledge, cross-check `data/nfl-rosters/roster-map-latest.json` and verify with live search if still surprising. That map only covers ~815 players (~25/team) and is weak on defensive backs — an absence from it is not proof a player isn't on that roster.
- **The prop projection model in `scratch/prop-screen-*.py` FAILED backtest validation** (Brier 0.2583 vs. 0.2500 base rate — actively worse than guessing, with near-inverted calibration). Do not use its edge/probability numbers. Full writeup: `docs/BETTING_LESSONS_LEARNED.md`.
- **`data/official-picks/user-placed-wagers-2026.json` is ground truth for Andy's real preferences and real action** — not the spec docs under `agents/product/` (some of those are unsourced drafts that don't match his actual behavior; e.g. a "prefer 2-leg SGP" line in `PROPS.md` is simply wrong — he prefers 4–8 leg prop stacks for bigger odds).

---

## 3. Architecture cheat sheet

Full detail lives in `docs/ARCHITECTURE.md` (load it before editing anything under `src/`) — this is the condensed version.

### React app (`src/`)
- `App.jsx` — thin wiring layer (~110 lines): imports hooks, renders JSX, 16 lazy-mounted modals.
- Custom hooks (`src/hooks/`) own all state and business logic: `useModals`, `useSchedule` (boot sequence, schedule/stats/splits/injuries), `useExperts` (expert consensus + AI transcript extraction), `useBettingCard` (personal card).
- `src/lib/storage.js` — **the only sanctioned way to touch localStorage.** `PR_STORAGE_KEYS` catalogs every key with a `permanence` tier (`critical` keys like `pr_picks_v1`, `nfl_bankroll_data_v1`, `nfl_futures_portfolio_v1`, `nfl_expert_consensus`, `nfl_props_picks_v1` are blocked from `removeFromStorage()`; only explicit user action via `StorageBackupModal` can clear them). Never call `localStorage.getItem/setItem` directly anywhere in `src/`. Never rename or add a key without updating `PR_STORAGE_KEYS` and writing a migration helper.
- `src/lib/picksDatabase.js`, `bankroll.js`, `futures.js`, `hedgeCalculator.js` — the picks/bankroll/futures/hedge subsystems, each with its own storage key and CRUD API. Futures has a full 5-phase feature set (CRUD, hedging, odds monitor, parlay tracker, playoff bracket) — see `ARCHITECTURE.md` for the sub-tab breakdown.
- `src/lib/teams.js` — canonical team database/aliases/logos; **always** run cross-source team-name comparisons through `normalizeTeam()`, except for OVER/UNDER selections where team normalization must be skipped entirely (see `RULES.md`).
- `src/lib/supabase.js` — read-only browser Supabase client with graceful fallback if unconfigured.
- Full MUST-ALWAYS / MUST-NEVER list (dates, timezones, storage keys, React patterns, dependency additions, etc.): `RULES.md`. Read it before any `src/` change — it's short and each rule exists because it was violated once.

### Node pipeline (`agents/`, `scripts/`)
This is the much bigger and more actively-worked half right now. Rough map:
- **Odds/schedule ingestion**: `agents/schedule-ingest.js`, `agents/futures-odds-ingest.js`, `agents/win-totals-ingest.js`, `scripts/sync-live-market-lines.mjs`, `scripts/update-schedule.js`.
- **Live in-game prop capture & tracking** (this session's main focus — see §4 below): `scripts/props/betonline-live-parser.mjs`, `scripts/props/bookmaker-live-normalize.mjs`, `scripts/generate-live-tracker.mjs`.
- **Official pick ledger**: `scripts/official-pick-ledger.js` (+ `official:picks:*` npm scripts) and the ground-truth data file `data/official-picks/user-placed-wagers-2026.json`.
- **Team/analytics profile builders**: `scripts/build-team-analytics-snapshots.js`, `build-coaching-tendency-snapshots.js`, `build-dvoa-snapshots.js`, plus `agents/vault-seed.js` / `scripts/fetch_nflverse_data.py` feeding raw nflverse data into all of them. There's a weekly Tuesday-8am-PT scheduled task that refreshes these automatically each week during the season.
- **Intel pipelines**: podcast transcription/diarization/narrative-building (`scripts/build-podcast-narratives.js`, `youtube-podcast-sweep.js`, etc.), Twitter bookmarks (`agents/twitter-bookmarks-agent.js`), article intel review, expert pick registry, training-camp intel, prediction-market coherence, secondary-matchup vulnerability, player availability.
- **Fantasy**: Yahoo fantasy sync (`scripts/sync-yahoo-fantasy.mjs`), fantasy value reports, ADP ingestion, waiver-wire tooling — see `data/fantasy/{league}_final_rosters_2026.csv` for the ground truth on who owns whom across all 12 teams in each league (Honey Badgers / Rose Bowl / The League), not just Andy's own roster.
- **SuperContest**: `agents/supercontest-lines-ingest.js` + `agents/supercontest-clv.js`, weekly Thursday-8am-PT auto-ingest.
- **Safety tooling**: `agents/portfolio-preflight.js` — an AST-based (via `acorn`) static scanner that audits every Supabase read call site in the agents for unbounded/truncating queries. This went through ~10 rounds of adversarial Codex review (finding real bugs each round: foreignTable-scoped `.limit()`, decoy-vs-returned-chain confusion, regex-vs-AST discovery gaps, etc.) and is now mature and stable — 25 real Supabase read sites tracked, `tests/unit/portfolioPreflightScanner.test.js` has 30 tests. Full history in `nfl_dashboard_project.md`'s older entries and the many `handoffs/2026-09-09-*` files if you ever need the blow-by-blow.
- **Toolbox**: `scripts/toolbox.mjs` / `scripts/toolbox-app-server.mjs` (`npm run toolbox` / `npm run app`) — a local control-panel UI with launcher buttons for various agent actions, including two live-capture launchers ("Open BetOnline NFL Props" / "Open Bookmaker.eu NFL Lines") under its **Diagnostics tab** (easy to miss — the top nav shows one category at a time).

### Sandbox test/lint workaround
See project memory `nfl_dashboard_sandbox_lint_test_workaround.md` for the full detail, condensed in §2 above. Also covers a `.git/index.lock` / `.git/refs/*.lock` stale-lock workaround for commit/push if you hit one.

---

## 4. Live prop capture & live tracker — deep dive (most active subsystem right now)

This is what the last several sessions (including tonight's) have been heavily focused on, so it gets its own section.

### The two sportsbooks
- **BetOnline (BEO)**: has a real, committed, tested parser — `scripts/props/betonline-live-parser.mjs`. CLI (`--in`/`--out`), exported `parseBetOnlineEventText()` / `parseBetOnlineBoardPayload()` (the latter supports a multi-game `{events:[...]}` payload — capturing every matchup on the site in one pass is architecturally supported already, just not yet wired to an actual multi-page capture flow). `DEFAULT_STOP_LABELS` is a set of known non-prop section titles used to know when to stop scanning a section.
- **Bookmaker.eu (BKR)**: **no committed parser exists.** Its live captures (schema `bookmaker_live_markets_v1`, source `bookmaker_live_dom`) are produced by an agent (Claude or Codex) reading the rendered DOM directly and hand-writing structured JSON. This is a known gap — **a formal request for a real, committed, tested `bookmaker-live-parser.mjs` (mirroring BetOnline's shape) was sent to Codex on 2026-09-22**, written to `handoffs/2026-09-21-1810-claude-codex-request-bookmaker-live-parser-cli.md`. **Check whether Codex has responded to this before doing more ad hoc BKR capture work** — if a real parser now exists, use it instead of hand-reading the DOM or patching captures after the fact.
- Both books require a real logged-in browser session on Andy's real-money accounts — this is deliberate (bot-detection risk), don't try to automate around it.

### Bugs fixed 2026-09-22 (this session)
1. **BEO stop-label bug (CRITICAL, now fixed)**: the parser used to `break` out of its main loop entirely the moment it hit a stop-label section title, silently dropping every real prop market that happened to appear further down the page after that title. Fixed to skip-and-continue instead. Recovered 42 previously-dropped rows on a real capture (all Terrance Ferguson and Tyler Higbee props included). Regression test added in `tests/unit/betonlineLiveParser.test.js`.
2. **BKR TD-scorer player-field corruption (now fixed via a stopgap)**: `first_td`/`atd_1_plus`/`td_2_plus`/`td_3_plus` rows had `player` wrongly set to the section title instead of the real name (which survived uncorrupted in `selection`). Fixed via a new post-processing module, `scripts/props/bookmaker-live-normalize.mjs` (since there's no parser to patch directly) — 103/103 affected rows corrected on a real capture, 0 false positives.
3. **BKR carries misclassification (now fixed via the same normalizer)**: a new `"<Away> vs <Home>: "` game-prefix on section titles broke the `<Player> Carries` classifier match, dumping all 44 carries rows into `unknown`. Fixed by stripping the prefix before matching. Both fixes have their own regression tests in `tests/unit/bookmakerLiveNormalize.test.js`.

### The live tracker (`scripts/generate-live-tracker.mjs`)
A ~9,600-line generator script that produces a single giant self-contained HTML file (both `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html` — always regenerate and ship BOTH, they should stay byte-identical) with an inline `<script>` implementing the whole live UI: ticket cards, per-leg progress bars driven by real ESPN live box-score data (`athleteLiveStatsMap`), a Player Cheat Sheet tab, filters, and manual override controls.

Key state model (all localStorage-persisted, keyed by week): `checkedState` (hit), `burntLegsState` (burnt/dead), `pushedLegsState` (push), `outLegsState` (🚑 injured/out — as of 2026-09-22, **purely informational, does NOT imply Burnt** — see below), `cardMinLegsState`, `splitState`, `manualCashed`, `manualBurns`, `collapsedState`.

**Important 2026-09-22 change — 🚑 Out fully decoupled from 🔥 Burnt.** This used to be one combined concept (flagging a leg Out also marked it Burnt, which for a standard parlay/SGP would auto-bust the WHOLE ticket into the "🔥 BURNT / ELIMINATED SLIPS" section). Andy explicitly asked for this to change, twice, in increasingly precise terms — first "don't bust the whole ticket," then "don't even freeze the leg, I want to watch it track real progress until the game actually ends." The end state now: `toggleLegOut()` touches ONLY `outLegsState`, never `burntLegsState`; a ticket only busts on a genuinely-burnt (non-injury) leg (`nonInjuryBurntLegsInTicket`); and there are **three independent rendering code paths** that all had to be taught about the new decoupled state, since they each previously assumed Out implied Burnt:
1. The periodic live-stat-refresh poller (~line 7069) — syncs the `leg-out` CSS class unconditionally every tick.
2. The Player Cheat Sheet's `sub-gauge-item` renderer (~line 6107) — `sg-out` toggle and `pstatEl` branch logic.
3. The main `render()` function's per-leg loop (~line 8958) — needed a brand-new `else if (isLegOut)` branch between the existing `isLegHit` and default-reset branches.
**If you ever touch Out/Burnt logic in this file again, check all three of these locations — they do not share code and can silently drift out of sync with each other.** Full before/after code and the exact rationale is in `HANDOFF.md`'s 2026-09-22 dated entries (search for "fully decoupled").

**Regeneration workflow** (follow this every time, it has burned sessions before):
1. `node --check scripts/generate-live-tracker.mjs` first.
2. Back up both current production files to `scratch/` before overwriting (repo convention — files already there generally cannot be deleted from a device-bridge session, no delete permission, so just use a fresh unique suffix rather than fighting a stale one).
3. Generate to a throwaway test path first (`node scripts/generate-live-tracker.mjs --out scratch/<test>.html`), not directly over production.
4. Verify the test output: correct file size, proper closing `</body></html>`, then extract the embedded `<script>` and `node --check` THAT (see §2's critical lesson).
5. Only once verified, copy the test file over both `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html`, and confirm the two are byte-identical (`md5sum`).
6. A `device_bash` regeneration call can legitimately take 120–180+ seconds (it fetches live game data) — right at or over the tool's timeout caps. One call this session hit the 180s cap mid-write and left `docs/tracked-wagers/live-tracker-sunday.html` truncated/corrupted for a while (caught by comparing file sizes between the two copies) — always sanity-check both output files' sizes and tails after any regeneration, don't assume success just because the command returned.

---

## 5. Betting strategy knowledge — what's been learned

- `docs/BETTING_LESSONS_LEARNED.md` is the running knowledge base — roster-verification rule, the prop-model validation failure writeup, and the empirical (not model-based) findings that DID survive backtesting: yardage props are bimodal (winners clear big, losers miss by a lot), receptions props are tight (±1-3), and the −120..−100 odds band is specifically where Andy's historical props have been losing money (45.9% hit rate, below breakeven) while ≤−200 favorites have hit well (12/15).
- `docs/NFL_WEEKLY_CARD_PROCESS.md` — the standing weekly Sunday 9-slot card template (Master RR, Underdog RR, Morning/Afternoon/Hybrid parlays, SuperContest 5-teamer, Player Prop Parlays, First-TD/2+TD stacks, Island Game Props).
- The "Island Game" prop-parlay template (Thu/Sun/Mon standalone-slate games) — three tiers by size/odds, legs must be diversified/non-overlapping across tiers (Andy dislikes a shared anchor leg busting every tier simultaneously). Full detail in project memory `nfl_dashboard_island_game_parlay_template` (read via the memory tools, not a repo file).
- `agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md` — a manual, `docsOnly: true` copy-paste activation prompt (no code changes needed to use it) kept in sync with the real RR formats and real intel-source file list. Note: `agents/product/tier1/BETTING.md` and the Futures/Agent chat components are **not actually wired into the running app** — only `PropsAgentChat.jsx` is — so several "agent" recommendations in this pipeline are actually built by a human/Claude session directly, not by in-app automation. Don't assume a spec doc under `agents/product/` describes live behavior without checking `src/App.jsx`'s actual wiring.

---

## 6. Current state as of this handoff (2026-09-22, ~2:40am, mid-MNF)

Full blow-by-blow is in `HANDOFF.md`'s top "Current Pick Up Here: 2026-09-21/22 (MNF) — S245" block plus its several dated 2026-09-22 sub-entries below it — that is the authoritative, detailed log. Summary:

**Done and verified this session:**
- BEO stop-label bug fixed (§4).
- Both BKR extraction regressions fixed via the new normalizer (§4).
- 🚑 Out / 🔥 Burnt fully decoupled at both ticket and leg level in the live tracker, across all three independent rendering paths (§4). Both production tracker files regenerated and confirmed byte-identical.
- A new "Hide Injured Legs" filter added to the live tracker, and the 🚑 button gated off team-side/total/moneyline legs (where "player left the game" is meaningless).
- Codex follow-up sent requesting a real committed BKR parser (§4).
- **9 stuck-PENDING player-prop legs from the WAS @ DAL game (2026-09-20, final DAL 37–20) graded** with real final box-score stats, at Andy's request after he noticed them stuck un-settled on the Player Cheat Sheet: Antonio Williams (26+ rec yds → LOST @ 24; 2+ rec → WON @ 3), CeeDee Lamb (1+ TD → WON @ 2), Dak Prescott (2+ pass TD → WON @ 4), Stefon Diggs (5+ rec → WON @ 5 — **note: Diggs is on Washington now, not his old team**), George Pickens (5+ rec → WON @ 6), Javonte Williams (3+ rec → WON @ 3), Jacory Croskey-Merritt (52+ rush yds → LOST @ 43; 1+ TD → LOST @ 0). Each leg's `status` and `actual_stat` fields were updated directly in `data/official-picks/user-placed-wagers-2026.json`.

**Found but NOT yet actioned — flag this to Andy, it's bigger than what he asked for:** while grading the WAS players, a scan turned up **172 total PENDING legs across the whole wagers file**, of which **131 are from Sunday 2026-09-20 games that are almost certainly all final by now** (IND@KC 30 legs, MIA@SF 17, PHI@TEN 10, LV@LAC 10, GB@NYJ 9, SEA@ARI 9, JAX@DEN 9, WAS@DAL 8 remaining team-line legs, MIN@CHI 7, CLE@TB 5, CIN@HOU 5, CAR@ATL 4, PIT@NE 4, NO@BAL 3). The remaining 41 PENDING legs are NYG@LAR (tonight's MNF, still legitimately in progress). **This looks like the entire Week 2 Sunday slate never got graded, not just "a couple of WAS players"** — Andy's own words were about a couple of players on the Cheat Sheet specifically, but the underlying data problem is much larger. **This needs Andy's explicit go-ahead before a full pass** — grading ~130 legs across 13 games touches real ticket-level payout/settlement math (parlay legs spanning multiple games, not just single-leg bets) and deserves a deliberate, careful pass (and probably its own dedicated session), not something to rush through silently. Recommend: ask Andy directly whether he wants a full Week 2 Sunday grading pass, and if so, whether ticket-level settlement (win/loss/payout on multi-leg parlays) should be computed too or just each leg's individual status.

**Not started (from Andy's most recent message, still queued):**
- **"Graveyard" list of proposed-but-unused prop legs** — Andy wants to review this at tomorrow's Week 2 post-mortem. A repo search for "graveyard" was in progress when this handoff was requested and had not yet returned a result (the search itself timed out once on a broad `grep -ril` — retry narrower, e.g. scoped to `docs/`, `scratch/`, and `data/` directories rather than the whole repo, which has huge `node_modules`/`.git` trees to walk past). If no such file/mechanism actually exists, say so plainly to Andy rather than assuming it must be somewhere.
- Grading the 6-ticket MNF slate itself ($50 at risk) — game was LAR 14-0, ~5:27 left in the 2nd quarter as of the last check. Jaxson Dart exited Q1 with a knee injury (confirmed not returning, Jameis Winston in at QB) and Andy has already flagged Dart's legs 🚑 Out himself in his live browser session. A `send_later` reminder is scheduled to fire at **2026-09-22T03:24:00Z** (trigger `trig_01U22thTSJzT6TCaJbyvrKUs`) to prompt grading once the game is final.

---

## 7. Recommended order of operations for the next session

1. Read `HANDOFF.md`'s top block in full (it has far more granular detail than this document on tonight's specific code changes).
2. Check whether Codex has responded to the BKR-parser request (`handoffs/2026-09-21-1810-claude-codex-request-bookmaker-live-parser-cli.md`).
3. If the MNF game (NYG @ LAR) has gone final, grade the 6-ticket slate — pay special attention to Dart's legs given his Q1 injury exit.
4. Surface the 131-leg Week 2 Sunday grading backlog to Andy explicitly and get his direction before doing a bulk pass.
5. Find (or confirm the absence of) the Graveyard list of unused proposed prop legs ahead of the Week 2 post-mortem.
6. Retry a clean eslint pass on `scripts/generate-live-tracker.mjs` when the environment isn't under load — it's been unreliable late in long sessions.
7. Nothing from tonight's session has been committed to git. Given the guardrail repeal, use normal judgment about when to commit — but batch logically, don't `git add -A` the whole dirty tree.

---

## 8. Where to find more

- `HANDOFF.md` — the primary rolling session log (150KB+, most recent entries at top). Read the top block fully; older entries below are condensed pointers to `handoffs/*.md` files for full blow-by-blow if you ever need it.
- `handoffs/*.md` — dated, one-off deep-dive documents (Claude-to-Codex review requests, Claude-to-Claude technical handoffs like this one, etc.). Flat directory, no index — filenames are self-describing (`YYYY-MM-DD-HHMM-<description>.md`).
- `docs/` — large knowledge base: architecture, betting lessons, weekly process docs, audit reports, futures/BEO/BKR manual review logs, DASHBOARD_MATCHUP_CARD_LEGEND.md, and more. Skim `ls docs/` when you need something specific — it's not indexed either.
- `RULES.md` / `CLAUDE.md` / `AGENTS.md` — governance and conventions.
- Project memory (via the `mcp__memory__*` tools, scoped to this claude.ai Project): `nfl_dashboard_project.md` (rolling project log, similar spirit to HANDOFF.md but written from Cowork-session perspective) and `nfl_dashboard_live_prop_capture_status.md` (focused status doc for the live-capture subsystem specifically). Both were kept up to date throughout this session and are a faster way to get oriented than reading all of HANDOFF.md if you have memory-tool access.
- `data/official-picks/user-placed-wagers-2026.json` — ground truth for every real wager Andy has placed, 62 tickets as of this handoff.

---

*Written by Claude (Cowork) at the end of a long 2026-09-21/22 session, at Andy's explicit request for a full handoff to a fresh Claude team. If anything above turns out to be stale or wrong, correct it in place and note the correction — that's the standing norm in this repo (see HANDOFF.md's own "stale note" corrections for precedent).*
