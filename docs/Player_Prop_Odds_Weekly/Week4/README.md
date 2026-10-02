# Week 4 prop captures (hand-pasted by Andy, 2026-10-01)

Captured read-only from Andy's logged-in books. Not executable prices after kickoff. PIT@CLE kickoff 2026-10-02 00:15Z (5:15pm PT).

| File | What it is |
|---|---|
| `BKR_Week4_PIT_CLE_2026-10-01.raw.txt` | Verbatim Bookmaker page text for PIT@CLE (all markets). |
| `BKR_Week4_PIT_CLE_2026-10-01.sgp-dump.txt` | Same game converted to the `EVENT|T|I` dump format (SGP-badged sections only, 479 rows). Parse with `node scripts/props/bookmaker-sgp-dump-parse.mjs --in <file> --date 2026-10-01 --week 4` (result: unparsed=0 unknown=0). |
| `BEO_Week4_PIT_CLE_2026-10-01.compact.txt` | BetOnline PIT@CLE hand-transcribed into one line per market (NOT the raw page text, so `scripts/props/beo.py` will not read it). Format documented in its header. |

Caveats: BEO game lines on that board are headed "Parlays only" and equal the 9/28 opening snapshot (PIT -2.5, 38.5), so do not treat them as current; BKR main lines are PIT -3 / 38 (`data/odds/BKR_current_lines_1001_1242`). Tylan Wallace (CLE) was ruled out but is still priced at both books. BEO First Touchdown Scorer and the passing/rushing Bands/Exact tabs had no rows in the paste. Roster gate: all 29 (BKR) and 44 (BEO) names resolve to PIT/CLE on the 2026-10-01 ESPN rosters.
