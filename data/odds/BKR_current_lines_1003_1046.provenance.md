# Provenance: `data/odds/BKR_current_lines_1003_1046`

- **Source:** Andy-supplied rendered BKR board (Bookmaker.eu NFL game-lines page text, pasted into chat). Saved verbatim by Claude (Cowork) at 10:46 PT on Sat 2026-10-03; the paste begins at line 1 of the file.
- **Capture time:** not shown in the paste; the board page has no clock line. The upper bound is the save time (10:46 PT). It differs from the per-game page captures (09:29–09:59 PT) for DAL@HOU, GB@TB and TEN@BAL, so it was not taken at the same moment as those pages.
- **What this is:** a current reference snapshot. It is not proof of an executable price after capture.
- **Scope:** 15 games (14 on Sun 10/04, ATL@NO on Mon 10/05). PIT@CLE is final and absent.
- **Format note:** the headers are Markdown links (`[GAME LINES - OCT 04](…)`), not the plain `GAME LINES - OCT 04` header used by earlier `BKR_current_lines_*` files. `scripts/master-intel/build.py` (line ~199, `re.match(r'GAME LINES - …')`) will therefore not recognise this file as a line-movement baseline. The file was kept verbatim on purpose; it was not reformatted.

## Build-format copy (added 11:0x PT 10/03)

- **Copy:** `data/odds/BKR_current_lines_1003_1046_buildfmt` holds the same 15 games and values, re-laid out as the one-line-per-game format that `build.py` reads (plain `GAME LINES - OCT 04` / `OCT 05` headers; team abbreviations `WAS`, `LV`, `LAR`, `NO`).
- **The verbatim file is untouched.**
- **Parse check:** I ran `build.py`'s own `opening_lines` regex against both files. The build-format copy parses 15 of 15 games; the verbatim file and this provenance file parse 0, which is harmless.
- **How `build.py` uses it:** `opening_lines()` keeps the **earliest** file by mtime for each game as the line-movement baseline. That stays `BKR_current_lines_1001_1242` for all 15 games. This copy is therefore readable, but it does not change the opening line or the movement shown.
- **Where the build's current lines come from:** `data/generated/props/bookmaker-live-<date>-week4.json`, selected by `--date`.
