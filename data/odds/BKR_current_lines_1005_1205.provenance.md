# Provenance: `data/odds/BKR_current_lines_1005_1205`

- **Source:** Andy-supplied rendered BKR board (Bookmaker.eu NFL game-lines page text, pasted into chat). Saved verbatim by Claude (Cowork) at 12:05 PT on Mon 2026-10-05. Andy described it as the Week 5 opening lines plus the current line for tonight's Week 4 MNF game.
- **Capture time:** not shown in the paste; the upper bound is the save time (12:05 PT).
- **What this is:** a reference snapshot, not proof of an executable price after capture.
- **Scope:** 13 games.
  - Week 4 MNF ATL @ NO (Mon 10/05): current line, not an opener. BKR moved from NO -2.5 / 48 (10/03 10:46 paste) to NO -1 / 48.5.
  - Week 5: 12 games — TB @ DAL (Thu 10/08) and 11 Sunday 10/11 games.
- **Missing from the paste (ESPN Week 5 schedule has 15 games):** MIN @ NO (Sun 10:00), BAL @ ATL (SNF) and BUF @ LAR (MNF 10/12).
- **NYG @ WAS:** the board showed spread and total only, with no moneyline, so `build.py` will not parse that row (its pattern requires moneylines).
- **Kickoff discrepancy:** BKR lists CHI @ GB at 13:25 PT; ESPN lists it at 10:00 PT (17:00Z). Values copied unchanged.
- **Build-format copy:** `BKR_current_lines_1005_1205_buildfmt` holds the same values in the one-line-per-game format `scripts/master-intel/build.py` reads (away @ home confirmed against ESPN's Week 5 scoreboard). 12 of 13 rows parse; NYG @ WAS does not (no moneyline).
- **How `build.py` uses it:** Action Network openers come first; a BKR file is the per-game fallback, and the earliest matching BKR file is kept. No `actionnetwork-openers-2026-w05.json` exists yet, so this file is currently the Week 5 opener baseline for the 12 parsed games. For ATL @ NO, the Week 4 Action Network opener remains the baseline.
