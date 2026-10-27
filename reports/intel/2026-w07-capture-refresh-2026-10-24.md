# Week 7 saved market capture refresh

Scope: regenerate reports from the supplied evening captures. No new synthesis run or official-pick change.

| Book | Capture UTC | Rows | Games | Unparsed | Unknown | SHA-256 |
|---|---|---:|---:|---:|---:|---|
| BKR | 2026-10-25T01:46:39.962Z | 6381 | 13 | 0 | 0 | b36798fe8340c52942e012d73187b88275d624c50a93c84ae775f1ff279ba945 |

Source: `data/generated/props/bookmaker-live-2026-10-25-week7.json`

| BEO | 2026-10-25T01:50:01.356Z | 994 | 13 | 0 | 0 | d5083db402f7755e2a195085e0d422bb1cc658d8b4d045eb92f45a2227bbcdb8 |

Source: `data/generated/props/betonline-live-2026-10-25-week7.json`

| DKP | 2026-10-25T01:50:41.012Z | 955 | 13 | 0 | 0 | 0ecacfcce6baa62a35a205bf11f66c988d55689bbd33990e735e33ceada57b2f |

Source: `data/generated/props/draftkings-predictions-live-2026-10-24-week7.json`

## Interpretation

- BKR team totals now retain team and period; blank second-half offers remain unavailable. Raw capture is unchanged.
- BEO contains broad player yardage/passing menus for PIT@NO, GB@DET and KC@SEA; a 13-game capture does not mean every prop family was available for every game.
- DKP contracts retain the captured percentages and before-fee meaning; their gross American equivalents are not sportsbook best prices.
- BEO current rows retain Over/Under and actual line values; older ladder prices are not mixed into the latest menu.
- BKR now has 541 priced CIN@BAL player rows. LAR@LV and DAL@PHI have no BKR anytime-touchdown rows in this capture.
- Pitch/Pushback uses the saved Friday analyses with Saturday updates. Historical simulations were not rerun.

## Build and content inspection

- Windows Python 3.14 build completed with roster gate PASS, 0 blocking issues.
- nfl_week7_supercontest_intelligence_summary.html: 8 Pitch / 8 Pushback sections; 0 unresolved local source links; 2 standings tables.
  Excluded market words: 0.
- site/sc.html: 8 Pitch / 8 Pushback sections; 0 unresolved local source links; 2 standings tables.
  Excluded market words: 0.
- Platinum_Rose_NFL_Week7_Intel.html: 8 Pitch / 8 Pushback sections; 0 unresolved citation routes (47 page/anchor routes checked); 2 standings tables.
  Captured menu rows rendered: 8330.
- Browser automation was blocked from the file:// URL; live UI interaction was not verified. No tests or new synthesis run.

## Delivery

Local HTML, Markdown, DOCX and JSON rebuilt. Andy explicitly approved replacement of the existing Week 07 Master Intel and SuperContest files in the Platinum Rose Drive folder. All nine existing report files were replaced on 2026-10-25 after that approval; Drive metadata lists sizes matching the local builds. PDF remains the older export. Changes in this local audit note remain uncommitted.
