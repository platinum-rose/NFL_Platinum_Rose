# Week 4 Bookmaker SGP capture — 2026-10-01 22:15 PT

## Scope and result

- Read-only capture from the authenticated `be.bookmaker.eu` rendered page. No odds/expander/bet-slip/account control was clicked. PIT@CLE was intentionally skipped (final/already captured).
- Real-page `sessionStorage` was available. The exact `scripts/props/bookmaker-sgp-extract.browser.js` ran on all 15 remaining Week 4 game URLs; no games are missing.
- Downloaded artifact moved to ignored `data/generated/props/bookmaker-live-2026-10-01-week4.raw.txt` (164,782 bytes); parsed combined output is ignored at `data/generated/props/bookmaker-live-2026-10-01-week4.json`.
- Visible main lines saved in tracked `data/odds/BKR_current_lines_1001_2215`.

## Parser result — repaired against the saved raw capture

The parser was corrected locally after the initial capture to recognize Second Half sections, unpriced TD-scorer listings, and `Player - Over/Under` layout. Rerunning against the unchanged raw file meets the requested structural target: **15 games, `unparsed=0`, `unknown=0`**. Listings that had no displayed price remain `available: false`; no odds were inferred.

| Game | rows | unavail | unparsed | unknown | TD |
|---|---:|---:|---:|---:|---:|
| IND @ WAS | 416 | 380 | 0 | 0 | 28 |
| NE @ BUF | 529 | 14 | 0 | 0 | 27 |
| NYJ @ CHI | 474 | 438 | 0 | 0 | 26 |
| ARI @ NYG | 442 | 6 | 0 | 0 | 27 |
| DAL @ HOU | 42 | 6 | 0 | 0 | 0 |
| JAX @ CIN | 484 | 6 | 0 | 0 | 26 |
| GB @ TB | 469 | 6 | 0 | 0 | 25 |
| LAR @ PHI | 493 | 33 | 0 | 0 | 21 |
| TEN @ BAL | 438 | 402 | 0 | 0 | 29 |
| MIA @ MIN | 433 | 55 | 0 | 0 | 26 |
| DEN @ SF | 431 | 395 | 0 | 0 | 27 |
| KC @ LV | 466 | 430 | 0 | 0 | 27 |
| LAC @ SEA | 442 | 406 | 0 | 0 | 25 |
| DET @ CAR | 433 | 397 | 0 | 0 | 28 |
| ATL @ NO | 42 | 6 | 0 | 0 | 0 |

## Visible player thresholds without displayed odds

These are status observations only, not injury assertions. Grouped from raw selections ending in `+` with no price:

- IND@WAS: Daniel Jones, Marcus Mariota, Tyler Warren, Josh Downs, Keenan Allen, Jonathan Taylor, Laquon Treadwell, Terry McLaurin, Stefon Diggs, Antonio Williams, Seth McGowan, Jacory Croskey-Merritt.
- NYJ@CHI: Geno Smith, Tyson Bagent, Garrett Wilson, Isaiah Williams, Braelon Allen, Isaiah Davis, Kenyon Sadiq, Kalif Raymond, Colston Loveland, Luther Burden, D'Andre Swift, Cole Kmet, Rome Odunze, Kyle Monangai.
- LAR@PHI: Devonta Smith.
- TEN@BAL: Cameron Ward, Lamar Jackson, Elic Ayomanor, Gunnar Helm, Carnell Tate, Wan'dale Robinson, Calvin Ridley, Mark Andrews, Zay Flowers, Rashod Bateman, Tony Pollard, Derrick Henry, Tyjae Spears.
- MIA@MIN: Aaron Jones, Jaylen Wright, Malik Willis.
- DEN@SF: Bo Nix, Brock Purdy, Patrick Bryant, Evan Engram, RJ Harvey, Courtland Sutton, Jaylen Waddle, George Kittle, Christian McCaffrey, Kyle Juszczyk, J.K. Dobbins, Kaelon Black.
- KC@LV: Patrick Mahomes, Kirk Cousins, Travis Kelce, Tyquan Thornton, Xavier Worthy, Rashee Rice, Noah Gray, Kenneth Walker III, Emmett Johnson, Jalen Nailor, Michael Mayer, Tre Tucker, Brock Bowers, Ashton Jeanty, Mike Washington Jr.
- LAC@SEA: Justin Herbert, Sam Darnold, Quentin Johnston, Ladd McConkey, Tre Harris, Oronde Gadsden II, Jaxon Smith-Njigba, AJ Barner, Cooper Kupp, Rashid Shaheed, Jadarian Price, George Holani, Tory Horton, Omarion Hampton, Keaton Mitchell, Emanuel Wilson.
- DET@CAR: Jared Goff, Bryce Young, Amon-Ra St. Brown, Jahmyr Gibbs, Sam LaPorta, Jameson Williams, Isaac TeSlaa, Tetairoa McMillan, Chuba Hubbard, Darren Waller, Tommy Tremble, Jalen Coker, Sione Vaki, A.J. Dillon.

## Gotchas / verification

- DAL@HOU and ATL@NO exposed only 7 SGP grids / 57 source lines each, versus roughly 40–60 grids for most other games. That is a page-visible availability limitation.
- `python3 scripts/nfl-rosters/roster_vet.py --week 4 --date 2026-10-01 --fetch --strict` completed `PASS - 0 blocking issue(s)`; it printed 6 informational secondary-matchup notices, 26 informational Bookmaker-prop notices, and one informational roster-map mismatch. No name was corrected from memory.
- `git fetch` could not reach GitHub; local tracking comparison was `0 0`. The worktree was already heavily dirty and was left intact. Only this handoff and the fresh tracked lines paste are intended for commit.
