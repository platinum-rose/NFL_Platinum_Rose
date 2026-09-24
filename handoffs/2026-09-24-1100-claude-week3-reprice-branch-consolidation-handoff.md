# Handoff: Week 3 PM re-price + BRANCH-CONSOLIDATE-MAIN (main is now the only branch)

**Session:** Wed 2026-09-23 15:27 → Thu 2026-09-24 11:00 PT · **Author:** Claude · **Branch:** `main` @ `3b3dc2b` (pushed)
**Session commits:** `085d147` (inventory, on old wip) · merge `e8d1279` + `5a0e211` (Codex) · `2975153` carry-over · `5a49c4e` HANDOFF/TASK_BOARD · `3b3dc2b` BKR lines + card. Archive tag `archive/wip-yahoo-sync-2026-09-23` = `085d147`.

## 0. FIRST THING — check the scheduled tasks
The 12 NFL scheduled tasks were disabled during the checkout switch (Wed ~20:45) and **appear still disabled** (player availability last refreshed Wed 18:37, live tracker Wed 19:13). Andy, in PowerShell:
```
'NFL Fantasy Waiver Sync','NFL_Dashboard_Daily_Intelligence_Brief','NFL_Dashboard_Grok_Thread_Scanner','NFL_Dashboard_Live_Odds_Sync','NFL_Dashboard_Live_Tracker_Builder','NFL_Dashboard_Player_Availability_Sync','NFL_Dashboard_Podcast_Ingestion_Sync','NFL_Dashboard_Research_Intel_Sync','NFL_Dashboard_Screenshot_Watcher','NFL_Dashboard_Settlement_Reconciliation','NFL_Dashboard_Twitter_Bookmarks_Sync','NFL_Dashboard_Yahoo_Survivor_Sync' | ForEach-Object { Enable-ScheduledTask -TaskName $_ | Out-Null }
Get-ScheduledTask | Where-Object TaskName -like 'NFL*' | Format-Table TaskName, State
```
All should be Ready (Twitter_Harvester = Running; it can't be disabled/enabled without elevation and was never paused).

## 1. Week 3 card (TUE-WED → THU mode)
- PM Refresh ran Wed 18:37 (availability, starters, PM chain 4,639 contracts, Alpha packet). BKR board pasted 18:39 → `data/odds/BKR_current_lines_0923_1839`.
- Card re-priced: `reports/bets/2026-w03-card.md` ("PRELIMINARY v2"; v1 in `scratch/w03-card-prelim-0922prices.md`; script `scratch/w03-reprice-0923.py`). Self-check clean except flagged BUF ML −332 on the slot-5 alt.
- **QB resolution** (ESPN injury news in the availability build): NYG Dart OUT (season) → Winston · CHI Williams Doubtful (hamstring, DNP), Bagent DNP (concussion), Keenum first-team → Keenum likely MNF · WAS Daniels OUT → Mariota · MIN Murray cleared → starts · **SEA Darnold (glute) limited Wed** (Lock started Wk2) · CLE Watson · **LAR Nacua DNP Wed (groin)**.
- **STOP B summary sent; Andy has NOT given the go on tickets.** Key prices (BKR 9/23 18:39):
  - Dog ML RR $20: TEN +119, CLE +129, IND +125, TB +103, ATL +227, NYJ +250 (break-even 3/6).
  - Slot 5 Hybrid +917: CIN −3.5 · JAX −3 · BAL −3 · PHI ML −228 (Keenum strengthens PHI).
  - Slot 3 Morning +578 (JAX/CIN/NO/LAR ML) · Slot 4 Afternoon +861 (BAL ML/CAR-CLE U42.5/SEA-WAS U40.5/LAR ML) — **hold both for Nacua's Fri status** (LAR ML is tier-4).
  - Master RR: skip or $70 low end.
  - TNF ATL@GB (tonight 5:15 PT): lean ATL ML +227 + Under 43 −112; GB −5 (was −7). Slot 9 island ladder = THU-mode task; Cohen's Pitts o35.5 rec yds is the candidate.
  - Bills $10 credit: options LAC +7 −102 (Andy default) / JAX −3 −103 (best −110; concentration with slots 1/5) / CAR-CLE U42.5 −111. **Unknown whether placed** — ask.
- Not done: SuperContest 5 (Week 3 lines not posted — `data/supercontest/week-03-lines.json` missing), futures review §8, Circa re-price + cheat-sheet update (no photos received), recommendation-ledger update (no tickets logged yet).

## 2. BRANCH-CONSOLIDATE-MAIN — steps 1–5 done
- Inventory: `handoffs/2026-09-23-1630-claude-branch-consolidation-inventory.md`. Codex merge report: `handoffs/2026-09-23-1831-codex-consolidation-merge-report.md`.
- Merge verified file-by-file (53 main-only, 139 wip-only, 31 both-sides; nothing lost). Pushed `2412d13..5a0e211` (fast-forward), then `5a0e211..3b3dc2b`.
- Local checkout switched to `main` by `E:\dev\projects\switch-to-main.ps1` (no reset/clean/stash; 4 blockers backed up + restored; 36 identical untracked files verified). Held copies: `E:\dev\projects\_switch_hold` (safe to delete).
- Carry-over committed (`2975153`): toolbox sportsbook launch tasks + dashboard section (main's Fantasy Tools kept), WEEKLY_BETTING_ANALYST_PROMPT, .atlas lessons + memory bridge.
- Build passes in the worktree. **Vitest: 8 failed / 1832 passed — all pre-existing** (tests + inputs byte-identical to old main). **CI has failed on every main push since ≥9/20, so deploy.yml has skipped every run: GitHub Pages hasn't deployed since before 9/20.** → TASK_BOARD `CI-GREEN` (P1).
- **Remaining:** governance pass (CLAUDE.md, AGENTS.md, HANDOFF_PROMPT, WORKING-CONTEXT, synthesis prompt → "commit to main"); delete `origin/wip/yahoo-sync` after a clean automation week; remove worktree `E:\dev\projects\NFL_Dashboard-consolidate` (`git worktree remove`) and local branches `wip/yahoo-sync`, `main-merge-picks`, `feat/prop-availability-tooling`, `consolidate/main-2026-09`; delete `_switch_hold` and the scratch txt/tsv/log files in `E:\dev\projects`.
- Side issue (not NFL): a `git restore --staged --patch -- config/projects.json` has hung since Wed 15:55 (PIDs 20100/22388); `ElmoreCreek` and `PA_TEMPLATE` have `index.lock` files.

## 3. Uncommitted, needs Andy's call
- **`scripts/build-player-props-intel.js` WIP rewrite** (+384/−1473) — fails 4/5 `playerPropsIntel` tests (0 props from mock articles) and runs live from the checkout: props-intel output shrank ~2,150 lines, Alpha packet shows 0 props. Finish it, or `git restore` it (after saving a copy). TASK_BOARD `B-props-intel-rewrite-wip`.
- `data/official-picks/platinum-rose-ai-2026.json` (+754) — official-picks lane, not committed.
- ~200 regenerable data files remain dirty (normal).

## 4. Carry-forward (unchanged)
Supabase sync of 19 Week 2 ticket numbers (pending OK) · PFF podcast feed URL fix · toolbox dry-run steps · $6.81 free money unassigned (don't lock to BUF without asking) · team power ratings not evidence · no bets/account actions · any Supabase write needs per-change OK · stage narrowly, never reset/clean/stash · this environment can't push.

## 5. Resume prompt (fresh session)
```
Resume NFL_Dashboard ("Platinum Rose") — Week 3 THU mode. Repo: E:\dev\projects\NFL_Dashboard
(device_bash: $HOME/mnt/dev/projects/NFL_Dashboard), branch main (the ONLY working branch now; wip/yahoo-sync retired),
HEAD 3b3dc2b (verify vs origin/main). Supabase: aambmuzfcojxqvbzhngp.

Read, in order:
1. HANDOFF.md (root index)
2. handoffs/2026-09-24-1100-claude-week3-reprice-branch-consolidation-handoff.md (last session — start at §0)
3. reports/bets/2026-w03-card.md (preliminary v2, BKR 9/23 18:39) and scratch/w03-synthesis-digest.md
4. agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md (governs the session; THU mode)
5. The claude.ai doc "Circa Run Cheat Sheet — Wed 9/23" (https://claude.ai/code/artifact/f0663899-2a00-4bdc-a1d2-f6b1cd6a8e10) if Circa photos have arrived.

Today:
- §0 first: confirm the 12 NFL scheduled tasks are re-enabled (they were paused during the branch switch).
- Ask whether the Bills $10 credit and any Week 3 tickets were placed; log placed vs proposed in the DEV project doc claude/recommendation-ledger-2026.md.
- THU mode: TNF ATL@GB (5:15 PT) — slot 9 island ladder (current read ATL ML +227 + Under 43; Pitts o35.5 rec yds candidate). I'll paste fresh BKR/BEO TNF lines and props.
- Then: Nacua/Darnold Friday status for slots 3/4, SuperContest 5 when Week 3 lines post, futures review §8, Circa re-price if photos arrive.
- Separately when I say so: CI-GREEN, props-intel WIP decision, governance "commit to main" pass, worktree/branch cleanup.

Standing constraints: no git add -A (stage narrowly, check mtimes); never reset/clean/stash the dirty checkout; any Supabase write needs my per-change OK;
no bet placement or account actions; I push (give me the command); docs/Futures_Odds/ stays untracked; don't use team power ratings as evidence;
$6.81 free money unassigned — ask before locking it; local scheduled tasks run from this checkout, so uncommitted script edits go live;
stale .git/index.lock → confirm no git process, request delete permission on E:\dev, rm, retry. Commit attribution per the session's system reminder.
```
