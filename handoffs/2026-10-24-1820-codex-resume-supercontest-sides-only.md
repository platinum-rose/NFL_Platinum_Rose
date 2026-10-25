# Resume handoff: Week 7 SuperContest Intel, spread sides only

## Resume objective

Continue resolving Andy's report issue in a fresh Codex session. Andy says the SuperContest Intel report still is not working, even after the latest rebuild. Do not assume the issue is fixed merely because the output audit passed. Inspect the exact local HTML the user has open, determine what is failing in the rendered report, and finish the correction before declaring success.

## Repository and Git checkpoint

- Repository: `E:\dev\projects\NFL_Dashboard`
- Branch: `claude/w5-prop-cards-2026-10-11`
- Previously pushed base: `ca1b7f4975afb47275d5b6600819bac122d20dd0`
- Scoped report commit: `0284a88bf7addbd79601f8891ffa0f821cbe2258` (`fix: make Week 7 SuperContest report spread-only`), pushed and confirmed by `git ls-remote`. The earlier `7cc4744` hash was superseded before push.
- Upstream: `origin/claude/w5-prop-cards-2026-10-11`
- The checkout contains many unrelated dirty files. Do not clean, reset, stash, revert, stage broadly, or commit unrelated data. Do not use `git add -A`.
- Sandboxed Git network requests can fail with `getaddrinfo() thread failed to start`; the approved network retry succeeded. Remote branch was independently confirmed at `0284a88bf7addbd79601f8891ffa0f821cbe2258` during closeout. A subsequent documentation-only commit corrects this handoff and the root routing index; inspect live HEAD for that commit.
- Test suite: not run in this closeout (0 tests run). Prior build/text-audit results below are historical, not a fresh UI verification.

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
- The report checkpoint is pushed. The user requested stopping report work for a fresh session; this closeout changes handoff documents only.
- If you make another edit, rebuild and re-audit the rendered HTML text, and inspect the UI/content Andy says is failing. Do not add unrelated tests.

## Fully detailed resume prompt

Resume Platinum Rose Week 7 SuperContest report work in `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`. Saved report checkpoint is `0284a88bf7addbd79601f8891ffa0f821cbe2258`, verified pushed; live HEAD may include the documentation-only closeout after it. Suite: not run (0 tests in closeout). Read root `HANDOFF.md`, reconcile live Git, then read this dated handoff. Follow the detailed pickup checklist below. The report issue remains unresolved; do not infer success from a build or keyword scan. Preserve the dirty shared checkout and distinguish saved report proposals from official picks.

## CRITICAL: Fresh-session pickup checklist

1. Read `AGENTS.md`, `CLAUDE.md`, report format/runbook, and applicable report skill before implementation. Reconcile live branch, HEAD, upstream and scoped differences; do not reset, clean, stash, broad-stage, or amend the pushed checkpoint.
2. Open the exact local SuperContest HTML above. Inspect Main, proposal cards, all expandable pitch sections, Experts, Ranked & Market, standings, weekly reviews and game post-mortems. Reproduce the user's failure before diagnosing it. The previous closeout did not establish rendered behavior.
3. Compare the current report to the earlier layout and source history. Candidate references include `scratch/w06-supercontest-1017-2030.html`, `scratch/w06-supercontest-1017-2100.html`, and pre-checkpoint Git versions. They are references for layout, not current Week 7 evidence.
4. Investigate whether the last sides-only edit weakened the analysis: `build.py`'s SC `_card` uses `SCNOTE` plus generic projection/cover-risk fallbacks; `sc_review.py` replaced rich narrative fields with score/margin summaries. This is a suspected regression, not a confirmed root cause. Restore substantive spread-specific pitches and post-mortems from saved evidence without reintroducing other markets or inventing analysis.
5. AI proposal must contain five spread picks and three alternates. Keep the current proposal listed above separate from the unconfirmed official Andy/Amanda five. Explain each pick, matchup case, counterargument and key risk. Preserve current BKR spread versus fixed contest spread. Legacy `BKR_current_lines` data is opening-line evidence only; verify current capture provenance rather than mislabeling it live.
6. Experts must show actual spread side, source and current BKR spread, with a top summary of most-supported sides. Exclude other markets from expert counts, rows, detail panels and archived reviews. Check stale `data-mi` links/popup targets after removal of shared Master Intel detail content.
7. Preserve separate collapsible Overall and Quarterly standings, highlight Amanda Rose, compact GB and fifth-place payout gap, and put Dashboard AI total immediately below Amanda scores. Keep the source/caveat/payout text in a bottom footnote. Overall payouts: $3,500/$1,800/$1,000/$400/$200; quarterly $200; current quarter ends Week 8.
8. Keep the Platinum Rose card record collapsible. For both Amanda and Dashboard AI, weekly pick details should explain the pre-kickoff spread case, actual game outcome, near-miss versus clearly wrong read, and experts for/against. Historical AI total is 14/30 and Amanda official standings total 12.5 through Week 6. Week 1 evidence includes `dist/locked-card-week-1.json`; never silently exclude it. Verify grades from saved records if changing scoring.
9. Rebuild using Windows Python 3.14 and the command above; the required roster gate must pass. Inspect actual rendered content and interactions after the rebuild. A zero-match scan for ML/moneyline/Over/Under alone is insufficient. Do not label stale PDF current. Update the same Drive file IDs if delivering revised Drive copies.
10. Stop for Andy/Amanda before official-pick promotion or placing anything. No wagers, ledger/account changes, Supabase writes, paid synthesis or unrelated cleanup. Report exactly what failed, what changed, what was verified, and what remains unresolved.

## IMPORTANT: Source map and portability

- Report generation: `scripts/master-intel/build.py`, `convert_summary.py`, `site_extras.py`, `sc_review.py`.
- Week 7 narrative inputs: `reports/intel/master-intel-narratives-2026-w07.md`, `reports/intel/expert-narratives-2026-w07.md`; per-game evidence under `reports/intel/games/2026-w07-game-*-sides.*` and corresponding structured research inputs.
- Standings/review: `data/supercontest/standings-week-07-2026-10-24.md`, `data/supercontest/dashboard-ai-review-2026.json`; historical evidence under `reports/bets/season-recap/` and `reports/bets/week3-recap/`.
- General betting proposal: `reports/bets/2026-w07-card.md`; this has broader markets and must not be copied wholesale into the SuperContest report.
- Generated `dist` files, scratch reference reports, uncommitted research inputs and other dirty files remain on this Windows checkout; a fresh clone alone may not reproduce this exact local build. Continue on this checkout and inventory dependencies before any cross-machine move.
- Scope saved in report checkpoint: the four generator files above, the two narrative inputs, the card, two standings/review inputs, report format/runbook and this dated handoff (12 paths). Other modified/untracked files were intentionally left outside this checkpoint.

## Blockers and open decisions

- User-visible report failure remains unresolved; layout/content/interaction inspection is the next task.
- Andy/Amanda's official Week 7 five remain pending; do not ask the four earlier decisions again because Andy already answered them above.
- No new synthesis is authorized merely to repair presentation. If evidence requires a fresh synthesis, explain the specific gap and verify data before requesting that run.
