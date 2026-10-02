# Week 4 Bookmaker SGP live capture — 2026-10-02 13:20 PT

Scope: read-only rendered-page capture on `be.bookmaker.eu`; no selections, bet-slip actions, account changes, API calls, ledger writes, or promotion.

## Capture

- Captured all 15 open Week 4 games. PIT @ CLE was intentionally excluded because it is final.
- Downloaded raw capture: `data/generated/props/bookmaker-live-2026-10-02-week4.raw.txt` (192,695 bytes).
- Parsed generated props are intentionally uncommitted/ignored. Fresh main-line snapshot: `data/odds/BKR_current_lines_1002_1320`.
- Browser context `sessionStorage` was verified usable through the Bookmaker full-CDP page context. The local extraction routine read only rendered page content.

## Parser summary

| Game | Rows | Unavailable | Unparsed | Unknown | 1+ TD |
| --- | ---: | ---: | ---: | ---: | ---: |
| IND @ WAS | 366 | 65 | 0 | 0 | 0 |
| NE @ BUF | 546 | 8 | 0 | 0 | 27 |
| NYJ @ CHI | 468 | 432 | 0 | 0 | 26 |
| ARI @ NYG | 458 | 0 | 0 | 0 | 27 |
| DAL @ HOU | 569 | 0 | 0 | 0 | 28 |
| JAX @ CIN | 490 | 0 | 0 | 0 | 26 |
| GB @ TB | 489 | 0 | 0 | 0 | 25 |
| LAR @ PHI | 314 | 0 | 0 | 0 | 26 |
| TEN @ BAL | 485 | 0 | 0 | 0 | 29 |
| MIA @ MIN | 214 | 29 | 24 | 0 | 0 |
| DEN @ SF | 506 | 0 | 0 | 0 | 26 |
| KC @ LV | 460 | 0 | 0 | 0 | 27 |
| LAC @ SEA | 476 | 76 | 0 | 0 | 25 |
| DET @ CAR | 427 | 391 | 0 | 0 | 28 |
| ATL @ NO | 36 | 0 | 0 | 0 | 0 |

## Missing / gotchas

- Parser result is **not** the requested clean target: 15 games and `unknown=0`, but MIA @ MIN has `unparsed=24`. Its first- and second-quarter rows rendered without lines/odds even after a direct re-load and 12-second wait; those source rows remain in the raw download and were not reconstructed.
- Listed player sections without displayed odds: IND @ WAS — Antonio Williams, Terry McLaurin, Stefon Diggs, Chigoziem Okonkwo; NE @ BUF — Drake Maye, Josh Allen; NYJ @ CHI — Geno Smith, Tyson Bagent, Garrett Wilson, Isaiah Williams, Braelon Allen, Isaiah Davis, Kenyon Sadiq, Kalif Raymond, Colston Loveland, Luther Burden, D'Andre Swift, Cole Kmet, Rome Odunze, Kyle Monangai, Andrew Beck, Jelani Woods, Jeremy Ruckert, Roschon Johnson, Adonai Mitchell, Malik McClain, Kene Nwangwu, Zavion Thomas, Sam Roush, Mason Taylor, Jamaal Pritchett, Jahdae Walker; MIA @ MIN — Ryan Miller; LAC @ SEA — Quentin Johnston, Tre Harris, Ladd McConkey, Oronde Gadsden II; DET @ CAR — Jared Goff, Bryce Young, Amon-Ra St. Brown, Jahmyr Gibbs, Sam LaPorta, Jameson Williams, Isaac TeSlaa, Tetairoa McMillan, Chuba Hubbard, Darren Waller, Tommy Tremble, Jalen Coker, Sione Vaki, A.J. Dillon, Tyler Conklin, Tom Kennedy, Tay Martin, Jacob Saylors, Brycen Tremayne, John Metchie III, Xavier Legette, Jackson Meeks, Mitchell Evans, Feleipe Franks, Brock Wright, David Moore, Anthony Tyus, Ja'Tavion Sanders.
- Roster validation passed with **0 BLOCK**. It reported 13 non-blocking Bookmaker name mismatches; no names were corrected from memory.
