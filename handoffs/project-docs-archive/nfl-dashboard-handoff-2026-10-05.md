# Week 4 close-out, GB future, Week 5 lines and MNF prop planner — handoff 2026-10-05

Claude (Cowork) session handoff. Andy is starting a fresh session from here. Guardrails are unchanged: read-only on sportsbooks, no bet placement, no Supabase writes. Commit by explicit path only. Use the temp `GIT_INDEX_FILE` → `write-tree` → `commit-tree` method. Never stage `scripts/master-intel/build_site.py`.

## State at handoff

- **Week 4 is fully settled** except the GB Super Bowl future.
  - Real tickets: 24 settled, $353.51 cash risk, net **−$208.42**.
  - All three BKR round robins now carry Andy's actual BKR figures:
    - 8x4 #739714646: $84.47 returned (−$20.53).
    - 5x2 #739713279: $29.64 returned (+$14.64).
    - 6x2 #739713560: $12.28 returned (−$17.72).
  - SuperContest went 4–1; ARI −1.5 was the miss.
- **`scripts/reconcile-settlement.mjs` fixed** (a096758):
  - No longer re-grades `SETTLED` tickets.
  - Computes round-robin payouts from leg prices.
  - Strips Sr/Jr/II suffixes when matching names.
  - Grades `pass_interceptions`.
  - Regression tests pass (10/10).
- **GB Super Bowl future** BetOnline #1002306799 ($20 at +6600):
  - Moved from `user-placed-wagers-2026.json` into `data/futures-imports/andy-portfolio-ledger-2026.json` → `packers_sb`.
  - Stake $60, blended +3867, $140 of the $200 cap left.
  - The Live Tracker shows it through the futures path.
- **BKR board** saved as `data/odds/BKR_current_lines_1005_1205`. The folder also holds a `_buildfmt` copy and a `.provenance.md`. The board has:
  - The Week 5 openers (12 games).
  - The current MNF ATL @ NO line: NO −1, total 48.5. On 10/03 it was NO −2.5 with a total of 48.
- **Phone tracker artifact** (private claude.ai page "Platinum Rose Live Tracker"): republished with the final Week 4 results. The builder is `scripts/build-phone-tracker.mjs`.
- **MNF prop planner for Alejandro:**
  - `reports/analysis/prop-planner/player-prop-parlay-planner-2026-w04-atl-no.html`.
  - Built by the new `scripts/props/build-prop-planner.py` from `BEO_Week4_ATL_NOS_v3` (619 selections) and `BKR_Week4_ATL_NOS` (690 selections).
  - Each book appears as its own entry in the Game filter.
  - The page warns when one stack mixes books, and when SGP repricing applies.
  - BKR selections without an SGP badge are tagged "(no SGP)".
  - Template: Codex's PIT@CLE planner. Rerun the script with new board files for any later game.

## Andy's items for the next session

1. **The three missing Week 5 games:** MIN @ NO, BAL @ ATL (SNF) and BUF @ LAR (MNF).
   - BKR has not posted them yet, probably because of uncertain injury news.
   - Capture them when Andy pastes the board, then append them as a new `BKR_current_lines_*` snapshot.
2. **CHI @ GB start time:** the game has moved to **10:00 AM PT**, from the late slot. The 1005_1205 board showed 13:25; ESPN already had 10:00 PT.
   - Correct the note in `BKR_current_lines_1005_1205.provenance.md`.
   - Check whether the `_buildfmt` time matters to `build.py`. The time is not used in the parse, but the label is wrong.
   - Use 10:00 PT in all Week 5 card work.
3. **BUF Super Bowl free-bet promo** (`data/sportsbooks/promotions-2026.json` → `beo-sb-futures-special-bills`):
   - The free wager on **JAX +7 won**. Its $8.70 win takes **$8.70 of liability** off the BUF Super Bowl futures position.
   - This is the pattern already in use: a $9.09 cash bet (BUF SB boost #996987591) gets paid back by free-wager winnings.
   - Log the JAX +7 credit as `received_used` with the win, and record the liability reduction against `bills_sb`.
   - **Next week:** Andy will play the next Bills-win free wager on the **BUF @ LAR** (MNF Week 5) matchup, the same way.
4. **BetOnline reloads:** three cash reloads of **$1.61 each** came in, $4.83 in total.
   - Log them in `beo-reloads.balance_log`.
   - **This week**, the full $4.83 goes on the **BUF Super Bowl** market at whichever book has the best price. Shop BetOnline vs. the other books from the latest `data/futures-imports/*` captures. A fresh capture is needed first.
   - Then add the ticket to `bills_sb` in the portfolio ledger.
5. **Optional:** Andy can still send the BetOnline ticket numbers for the Week 4 prop parlays that are logged under placeholder IDs (`afternoon_*`, `snf_*`).

## Git notes

- Pushed this session: a096758, 189f8f7, 70e0def and the handoff commit that adds this file.
- **The real `.git/index` is stale.** It shows phantom staged deletions, such as `D data/official-picks/user-placed-wagers-2026.json`. Do not run plain `git add` or `git commit`. Build commits from a temp index (`git read-tree HEAD`, add explicit paths, `write-tree`, `commit-tree`, `update-ref`).
- **Stale lock files** that could not be deleted (rm is blocked on the mount) were renamed: `.git/HEAD.lock.stale-20261005`, `.git/HEAD.lock.stale-20261005b`, `.git/main.lock.stale-20261004`. `.git/index.lock` is from 10/03. `.git/index.tmpcopy` is empty. Andy can delete all of these from Windows.
- **Left uncommitted on purpose** (not from this session):
  - `data/supercontest/live-market-comparison.json` (modified 12:04 PT today by some other process).
  - `data/odds/actionnetwork-openers-2026-w04.json`.
  - `data/official-picks/platinum-rose-ai-2026.json`.
  - Line-ending churn in many `data/podcasts`, `data/expert-dossiers` and `handoffs` files.
  - Untracked Codex/agent scripts and tests (`scripts/props/run-prop-*-agent.mjs`, `build-ai-matchup-packets.mjs` and others).
  - `scripts/master-intel/build_site.py` (Andy's uncommitted work).
