# Resume handoff: Week 7 SuperContest Intel, spread sides only

## Resume objective

Continue resolving Andy's report issue in a fresh Codex session. Andy says the SuperContest Intel report still is not working, even after the latest rebuild. Do not assume the issue is fixed merely because the output audit passed. Inspect the exact local HTML the user has open, determine what is failing in the rendered report, and finish the correction before declaring success.

## Repository and Git checkpoint

- Repository: `E:\dev\projects\NFL_Dashboard`
- Branch: `claude/w5-prop-cards-2026-10-11`
- Previously pushed base: `ca1b7f4975afb47275d5b6600819bac122d20dd0`
- Scoped report commit: `7cc4744` (`fix: make Week 7 SuperContest report spread-only`); verify the full hash and upstream status at resume.
- Upstream: `origin/claude/w5-prop-cards-2026-10-11`
- The checkout contains many unrelated dirty files. Do not clean, reset, stash, revert, stage broadly, or commit unrelated data. Do not use `git add -A`.
- Latest remote fetch attempt failed with `getaddrinfo() thread failed to start`. The cached local upstream still equals the previous base commit. Push was explicitly requested by Andy; retry after the scoped commit. If it fails, preserve the commit and report the exact reason.

## User's report requirement

This is the **NFL Week 7 SuperContest Intelligence Report**, and it is **spread sides only**. Remove all market references and selections for moneylines and game Over/Unders from the report, including expert picks, expandable game details, proposal cards, archived weekly post-mortems, and any text pulled from general Master Intel narratives. Spread evidence may include contest line, current BKR spread, line value, projection, experts who took a spread side, and spread outcome.

Andy also asked for the SuperContest report to retain pitch summaries, explain why each selected spread was picked, show expert agreement by team/side with the current BKR spread, and provide spread-only post-mortems in the season review.

## Current build and audit state

- Builder: `scripts/master-intel/build.py`
- Review renderer: `scripts/master-intel/sc_review.py`
- Build command (Windows Python 3.14):
  ```powershell
  $env:PYTHONIOENCODING='utf-8'
  & 'C:\Users\andre\AppData\Local\Python\pythoncore-3.14-64\python.exe' scripts/master-intel/build.py --week 7 --date 2026-10-24
  ```
- Last build completed; mandatory roster gate passed (0 blocking issues). It regenerated the Week 7 Master Intel and SuperContest MD/HTML/DOCX/JSON outputs. PDF was not regenerated and remains dated 2026-10-23.
- Last visible-text audit on `dist/nfl_week7_master_packet/nfl_week7_supercontest_intelligence_summary.html` found zero matches for `ML`/`moneyline` and zero matches for `Over`/`Under`. The only remaining word `total` referred to contest score totals, not a betting market.
- The HTML contained 8 “Spread case and risk” panels (five proposal picks plus three alternates), and the expert summary showed current BKR spread references.
- Despite those checks, Andy says “This is not working.” Begin the new session by loading the exact HTML below and checking the actual behavior/content. Do not treat the text scan as proof that the report works for Andy.
- User's current browser tab points to `file:///E:/dev/projects/NFL_Dashboard/dist/nfl_week7_master_packet/nfl_week7_supercontest_intelligence_summary.html`.

## Week 7 choices and open state

Andy's answers to the handoff's earlier decisions:

1. Remove CLE from the SuperContest. CLE ML might still be considered in other parlays, but no ML discussion belongs in this SuperContest report.
2. Replace PHI with ATL in the SuperContest and dog round robin. Put KC +3 as a single.
3. Andy and Amanda will confirm the official SuperContest five later tonight. Do not label the Dashboard AI proposal as official.
4. CHI confidence-pool slot: 5 in Kenny's pool and 7 in Duma's pool.

Current Dashboard AI proposal recorded in the Week 7 narrative: CIN +2.5, GB +3.5, ATL +3.5, LV +4, ARI +4.5. Alternates: NO +3.5, NYG +9.5, KC +2.5. These are proposal sides; official five remains unconfirmed.

## Drive copies

The following Week 07 Drive files were replaced in-place after the last build. Preserve their IDs when updating:

- HTML: `1zS8FI1eFdHabzDHPF9H9b8YHdxRWGsCh`
- DOCX: `1aFw0l66vEHEvDKceE3CGXD92z5pC6K0P`
- Markdown: `1l3-itOic8PoPRei9R7xsB_J3xqUNr7C6`
- JSON: `1s6istCiewgqkIVHcbszp4fiiauAKhLv_`
- Folder: `1zj8ibctIp8QcyxCVH2I3aNUvskXmR7Fe`

If the report changes again, rebuild first and then update these same files. Do not represent the stale PDF as current.

## Safety and scope

- Andy requested a scoped commit and push. Only stage the enumerated SuperContest report source/code/input files and this handoff; check the staged list before committing.
- Do not stage or commit unrelated wagers, official-pick ledgers, bankroll, futures, Alpha, survivor, player availability, scratch files, backups, or other week research.
- Do not place bets, click sportsbook controls, mutate official picks, or write to Supabase.
- No push was completed as of writing this handoff; finish or report the exact network/auth failure.
- If you make another edit, rebuild and re-audit the rendered HTML text, and inspect the UI/content Andy says is failing. Do not add unrelated tests.

## Fully detailed resume prompt

You are continuing the Week 7 SuperContest report fix in `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`. Read this handoff first, then reconcile live Git status and inspect the pushed commit plus the exact current HTML at `dist/nfl_week7_master_packet/nfl_week7_supercontest_intelligence_summary.html`. The last known build passed the roster gate and a visible-text audit found no ML/moneyline or Over/Under terms, but Andy says the report still is not working; independently inspect the current HTML content and behavior to identify the actual failure. The report must show spread picks only: no moneyline or game-total selections or references anywhere, including expert rows and expandable post-mortems. Preserve the pitch summary for each Dashboard AI proposal side, the expert pick summary with current BKR spreads, game-by-game spread context, standings, and spread-only weekly review. Keep the Dashboard AI five as a proposal, not the official Andy/Amanda card. Current proposal: CIN +2.5, GB +3.5, ATL +3.5, LV +4, ARI +4.5; alternates NO +3.5, NYG +9.5, KC +2.5. Andy's prior choices: CLE removed from SC; ATL replaces PHI in SC and dog RR; KC +3 as a single; official five will be confirmed later; CHI slots are 5 Kenny and 7 Duma. A scoped commit/push was explicitly requested. Before commit, verify only the intended paths are staged. Many unrelated files are dirty or untracked; leave them untouched. Retry push (fetch failed with `getaddrinfo() thread failed to start` and cached upstream equals base `ca1b7f4`); preserve the commit and report if network remains blocked. No wagers, official-pick edits, ledger changes, Supabase writes, or broad Git cleanup. Rebuild with Windows Python 3.14 and the command documented above; roster gate must pass. Update the existing Week 07 Drive files in-place by ID if the report is changed again. PDF is stale from 2026-10-23. Finish by stating exactly what failed, what changed, build/audit results, commit/push status, and any remaining blocker.
