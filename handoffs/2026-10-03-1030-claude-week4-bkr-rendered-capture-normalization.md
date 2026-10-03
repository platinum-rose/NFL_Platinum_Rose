# Week 4 BKR rendered-capture normalization (read-only)

**Date:** Sat 2026-10-03, 10:16–10:35 PT · **Agent:** Claude (Cowork) · **Branch:** `main`, HEAD `4970ebd`, 0/0 vs `origin/main` after `git fetch`.
**Scope:** read-only market-evidence work only.
- No card, narrative, recommendation, ledger, portfolio, official-pick, odds-cache or Supabase change.
- No sportsbook sign-in, click or bet slip. No paid model call.
- No stage, commit or push.
- PIT@CLE is excluded.
**Previous lane:** `handoffs/2026-10-03-0905-claude-week4-evidence-readiness.md`.

## Artifacts

| File | Tracked? | What |
|---|---|---|
| `reports/analysis/week4-intel/WEEK4_BKR_RENDERED_CAPTURE_INDEX_2026-10-03.md` | new, untracked, intended to be tracked | Per-game capture index: file, page clock, kickoff, section/SGP counts, priced/unpriced, complete/partial, main lines 10/03 vs 10/02, unpriced SGP section list |
| `scripts/props/bookmaker-rendered-text-parse.py` | new, untracked | Read-only parser for rendered page text (it is not the `EVENT|T|I` dump parser) |
| `data/generated/props/bookmaker-rendered-2026-10-03-week4.json` | gitignored, local | 9,038 normalized selections; each keeps section title, SGP flag, kind, displayed selection, line/odds, priced flag |
| `data/generated/props/bookmaker-rendered-2026-10-03-week4.summary.json` | gitignored, local | Per-game counts + source sha256 |
| `data/generated/props/bookmaker-rendered-2026-10-03-week4.name-resolution.json` | gitignored, local | BKR player labels vs ESPN roster (no repairs) |

The 14 source files in `docs/Player_Prop_Odds_Weekly/Week4/BKR_Week4_*` were not changed. Their sha256 hashes match before and after.

## Validation counts

- **14 game pages captured,** 09:29–09:59 PT by each page's clock line. The date comes from the file mtime (2026-10-03), because the page shows only the time.
- **Totals across the 14 pages:**
  - 2,056 sections, of which 808 are SGP-badged: 747 with prices and 61 with none.
  - 8,373 of 9,038 displayed selections carry a price.
- **IND@WAS reproduces the supplied observation:** 41 SGP sections, 23 priced, 18 unpriced.
- **Parser integrity:** in every file it found the body start and the `Bet Slip` terminator, with 0 orphan price lines and 0 partially priced sections.
- **What these counts don't mean:** `bookmaker-sgp-dump-parse.mjs` did not run on these files, and no `unparsed=0`/`unknown=0` claim is made. Section kinds are heuristic.

## Player-market availability gaps (as rendered at capture)

- **DET@CAR:** the whole player-prop menu, TD-scorer menus included, was displayed with no prices. 38 SGP sections had no price; only game and period lines were priced.
- **IND@WAS:** 18 SGP sections had no price: the second-half lines plus player Over/Unders for one QB, one RB and seven pass-catchers (several of them listed Out/Doubtful in the ESPN feed). Neither TD-scorer menu rendered.
- **MIA@MIN:** neither the TD-scorer menu nor the player Over/Under totals rendered. 2 ladders had no price.
- **LAC@SEA:** the 3 ladders for one running back had no price. ESPN listed that player Out at 10/03 15:59 UTC.
- **Present on all other pages:** every page shows the two "2H Team Total + OT" sections unpriced, which is structural.
- **BKR labels that don't match the roster:** 35 of 346 per-game BKR player labels do not resolve exactly on the 2026-10-02 ESPN roster. The list is in the name-resolution JSON. None was repaired, and none may be used until the roster gate resolves it.

## Main-line changes vs the Oct 2 capture (point-to-point, not a history)

- IND@WAS: WAS +3.5 → +4.5, total 47.5 → 47.
- GB@TB: TB +3.5 → +3 (+102), total 39 → 39.5.
- MIA@MIN: MIA +10.5 → +10.
- DEN@SF: SF -2.5 (-118 → -112).
- Small moneyline shifts on NYJ@CHI, TEN@BAL and DET@CAR.
- The other games are unchanged.

## Roster gate

`npm run roster:vet -- --week 4 --date 2026-10-02 --fetch --strict` → **PASS, 0 blocking.** It was run at 17:19 UTC, before any player name was written, and re-run after writing at 17:21 UTC (PASS, 0 blocking). The ESPN rosters date from 2026-10-02 18:56 UTC, ~22 h old, so `--fetch` did not refresh them.

## Still missing for the Saturday narrative/card phase

1. **Standalone BKR board `data/odds/BKR_current_lines_1003_<HHMM>`: NOT SAVED.** The request said to save "the following BKR board" verbatim, but no board text came with it, and no new board file exists in `data/odds/` or `Week4/`. Nothing was reconstructed. Andy needs to paste the board; it then gets saved verbatim with provenance "Andy-supplied rendered BKR board."
2. **ATL@NO props-page capture (Monday):** none supplied. Player props must not be inferred from the main board.
3. **DET@CAR and IND@WAS player props:** re-capture closer to kickoff if those props are needed. IND@WAS kicks off at 06:30 PT Sunday.
4. **Official 90-minute inactives** (Sunday; Monday for ATL@NO), plus a weather re-check for the flagged rain games (PHI, BAL, CAR, NYG). See the 0905 handoff.
5. **Re-run the source-price reconciliation against this capture.** The 0905 reconciliation is priced against the Oct 2 capture.
6. **Roster gate on any future narrative/card.** Use `--date` = the capture date the build uses.
7. **Andy's explicit authorization** before any narrative file (`reports/intel/master-intel-narratives-2026-w04.md`) or card is written.

## Update 10:46 PT: board saved

- **Item 1 above is resolved.** The board is saved verbatim as `data/odds/BKR_current_lines_1003_1046`, with sidecar `data/odds/BKR_current_lines_1003_1046.provenance.md` ("Andy-supplied rendered BKR board"; no capture time in the paste; upper bound 10:46 PT).
- **Board vs per-game pages:** 11 games identical. They differ on DAL@HOU (moneyline), GB@TB (total juice and moneyline) and TEN@BAL (now TEN +11.5, total 43). Details are in the index addendum.
- **ATL@NO main line:** +2.5 (-114) / -2.5 (-103), 48, moneyline +112 / -128. Its props page is still uncaptured.
- **Format caveat:** the Markdown-link headers mean `build.py`'s line-movement baseline regex won't pick up this file. It was not reformatted.
