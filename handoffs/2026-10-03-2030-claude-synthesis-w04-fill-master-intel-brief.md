# Task brief for WEEKLY_SYNTHESIS_SESSION: fill the Week 4 Master Intel report with picks

**From:** Claude (Cowork, UX_EXPERT session), Sat 2026-10-03 ~8:30 PM PT · **Requested by:** Andy
**Andy's words:** "The multi-layout is approved, but there is no actual data here. Should we send this to another agent to fill out the intel for this layout?" → yes.
**Agent:** #16 WEEKLY_SYNTHESIS_SESSION (`agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`). It's phase-gated: stop at each checkpoint for Andy.
**Deadline:** the first kickoff is **Sun 10/04 at 6:30 AM PT** (IND@WAS). The rest of the 10:00 AM PT window follows. Get the card in front of Andy tonight.

## Why the report is empty
The layout (F-mi-dark, commit `8949848`) is approved and finished. The build on 10/03 ran clean (roster vet PASS) but printed these gaps:

| Gap | What it empties in the report | Fix (runbook step) |
|---|---|---|
| No synthesis digest `scratch/w04-synthesis-digest-sat.md` | Every Bet, Ranked (0 rows), the Underdog ticket, and part of Experts | **Step 7: this task** |
| No card `reports/bets/2026-w04-card.md` | Dashboard "Our Picks" (0 picks / 0 tickets), Parlays & round robins, Prop stacks, Teasers | **Step 7: this task** |
| No `## TICKETS` / `## SUPERCONTEST` blocks in `reports/intel/master-intel-narratives-2026-w04.md` | Ticket one-liners and SuperContest reasons | **Step 8b: this task** (after the card exists) |
| No `data/survivor/pick-intel-2026-w04.json` | Survivor shows win chance only | **Step 8b: this task.** Schema: format doc §3; model it on `pick-intel-2026-w03.json` |
| No cleaned YouTube pick digest | Thinner expert consensus | Step 5, optional. `data/podcasts/youtube-manual-urls-2026-w04.json` exists, so run it only if time allows |
| DK Predictions saves: 0 of 15 games | No prediction-market prices | Step 4, optional, and it needs Andy to save the pages. Ask him; don't block on it |

## What already exists (use it, don't redo it)
- **Bookmaker capture for 10/03:** `data/generated/props/bookmaker-live-2026-10-03-week4.json`, plus the rendered and name-resolution files.
- **Narratives for all 15 remaining games:** `reports/intel/master-intel-narratives-2026-w04.md`, last committed as `421db5a`.
  - PIT@CLE has already been played (CLE 27–24).
  - Andy was asking for these.
- **Intel inputs:**
  - `reports/intel/expert-verification-2026-w04.md`: 371 verified picks.
  - `reports/intel/article-archive-2026-w04.md`
  - `reports/intel/signal-reextract-2026-w04.md`
  - the alpha packet and expert dossiers, which are refreshed but uncommitted in the working tree
- **Slate status from the build:**
  - QBs out: WAS Jayden Daniels, CHI Caleb Williams, TB Baker Mayfield.
  - Sharp signals: JAX ML, ARI ML, TEN ML, DAL ML, MIA +10 / ML, LAC ML, ATL ML.
  - DET@CAR has no player props priced.

## Steps
1. **Session start:**
   - Read `CLAUDE.md`, then `HANDOFF.md`, then `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`, then `docs/NFL_WEEKLY_CARD_PROCESS.md`, then this brief.
   - Reconcile live Git. HEAD should be `b56fa7d` or later, on main.
   - Run `node scripts/weekly-synthesis-preflight.mjs` and fix any STALE rows first. Injuries matter most.
2. **Synthesis digest + card (step 7)**, per the session prompt's phases and checkpoints. The card must keep the **Morning / Afternoon Parlay templates capped by the Sunday-night favorite ML** (runbook §4). The report's `night_cap()` explainer depends on them.
3. **Roster gate (7b):** `npm run roster:vet -- --week 4 --date 2026-10-03 --fetch --strict`. A BLOCK means stop and fix. Never state a player's team from memory.
4. **Narratives (8b):**
   - Add a `## TICKETS` block (`- <card ticket name>: <plain one-liner>`) and a `## SUPERCONTEST` block (`- <TEAM>: <plain reason>`).
   - Update each game's "Why the card leans this way" so it names the card tickets that touch the game, or why the card passes.
   - Follow the format doc §3 rules: name experts on each side, no boilerplate, roster-clean.
   - Write `data/survivor/pick-intel-2026-w04.json` with cited sources.
5. **Rebuild:** `python3 scripts/master-intel/build.py --week 4 --date 2026-10-03` (about 30 s; it runs the roster gate itself). The GAP lines for the digest, card and survivor should be gone.
6. **QA (runbook §6):**
   - `index.html` shows picks and tickets.
   - `ranked.html` has rows.
   - The filters (All / Side / Total / Prop) and the sorts work.
   - 0 broken links across `site/*.html`.
   - Run a PDF export once. Python Playwright isn't on the Windows bridge, so run `export_pdf.py` in the Cowork cloud container.
7. **Republish the review artifact** to the same URL: https://claude.ai/artifact/Ba1F5icQmPZf96U3N4Bxth
   - Read it first, or list its files.
   - Publish `site/_artifact_index.html` with every other `site/*.html` and `site/assets/*` in `files`.
   - `index.html` can't be a published path.
8. **Commit by explicit path only.** Never use `git add -A`.
   - `.git/HEAD.lock` and `.git/index.lock` are stale on this machine. Use a temp `GIT_INDEX_FILE`, then `git write-tree`, then `git commit-tree`, then write `.git/refs/heads/main` directly.
   - Don't stage `scripts/master-intel/build_site.py`. Its remaining diff is Andy's uncommitted nav and dashboard work.

## Out of scope
- **Don't change the look.** That means no edits to `convert_summary.py`, the CSS or style in `build_site.py`, or the inline styles in `build.py`. See `docs/MASTER_INTEL_REPORT_FORMAT.md` §1a.
- **No bet placement, no bet-slip clicks, no Supabase writes.** If Andy places tickets, they go only into `data/official-picks/user-placed-wagers-2026.json`, then the sync and tracker scripts run (CLAUDE.md "Placed Wagers Ledger").

## Activation prompt (paste into a new session)
```
You are the WEEKLY_SYNTHESIS_SESSION agent for "Platinum Rose". Workspace: E:\dev\projects\NFL_Dashboard (branch main).
Read in order: CLAUDE.md -> HANDOFF.md -> agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md -> docs/NFL_WEEKLY_CARD_PROCESS.md ->
handoffs/2026-10-03-2030-claude-synthesis-w04-fill-master-intel-brief.md.
Task: build the Week 4 synthesis digest + card, add the TICKETS / SUPERCONTEST blocks and survivor pick intel, then rebuild
the Master Intel report (build.py --week 4 --date 2026-10-03) so the approved dark layout fills with picks. Stop at each
phase checkpoint for Andy. Roster gate must PASS. First kickoff is Sun 6:30 AM PT. Don't change the report's look.
```
