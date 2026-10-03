# Week 4 Bookmaker rendered-capture index (2026-10-03)

**Source:** Andy-supplied Bookmaker.eu rendered page text, one file per game, saved under `docs/Player_Prop_Odds_Weekly/Week4/` between 09:29 and 09:59 PT on Sat 2026-10-03 (per each page's own clock line). These are rendered-text captures, **not** the `EVENT|T|I` SGP-dump format. `scripts/props/bookmaker-sgp-dump-parse.mjs` was **not** run on them and validated nothing. They were parsed by a new read-only rendered-text parser, `scripts/props/bookmaker-rendered-text-parse.py`.
**Normalized output (local, gitignored):** `data/generated/props/bookmaker-rendered-2026-10-03-week4.json` (every displayed selection: section title, SGP flag, section kind, displayed selection, line/odds when shown, `priced`/`available` false when no price was displayed). Also `…week4.summary.json` and `…week4.name-resolution.json`.
**Caveats:** an SGP badge means Bookmaker displayed the section as SGP-eligible at capture time. It does not guarantee that any given combination will be accepted or keep its price. Prices are a reference snapshot, not proof of executable price after capture. Alt-line expanders (`+ 8 Spread`/`Total`) were not expanded. A player shown without a price is a status question, not an injury fact. **PIT@CLE is final and excluded.**

## Coverage

| Game | Source file | Page clock (PT) | Kickoff (PT) | Sections | SGP sections | SGP priced | SGP no price | Selections priced / shown | Source status |
|---|---|---|---|---:|---:|---:|---:|---|---|
| IND@WAS | `BKR_Week4_IND_WAS` | 09:29:55 | 10/04 06:30 | 157 | 41 | 23 | 18 | 377 / 553 | PARTIAL: 18 SGP player/2H sections no price; no TD-scorer menu rendered; 15 non-SGP ladders no price |
| NE@BUF | `BKR_Week4_NE_BUF` | 09:38:43 | 10/04 10:00 | 155 | 71 | 71 | 0 | 729 / 733 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| NYJ@CHI | `BKR_Week4_NYJ_CHI` | 09:44:04 | 10/04 10:00 | 172 | 88 | 88 | 0 | 747 / 751 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| JAX@CIN | `BKR_Week4_JAX_CIN` | 09:49:58 | 10/04 10:00 | 134 | 50 | 50 | 0 | 653 / 657 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| ARI@NYG | `BKR_Week4_ARI_NYG.txt` | 09:44:45 | 10/04 10:00 | 133 | 49 | 49 | 0 | 628 / 632 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| LAR@PHI | `BKR_Week4_LAR_PHI` | 09:56:01 | 10/04 10:00 | 114 | 29 | 29 | 0 | 493 / 497 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| GB@TB | `BKR_Week4_GB_TB` | 09:54:24 | 10/04 10:00 | 135 | 51 | 51 | 0 | 653 / 657 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| TEN@BAL | `BKR_Week4_TEN_BAL` | 09:56:30 | 10/04 10:00 | 166 | 82 | 82 | 0 | 710 / 714 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| DAL@HOU | `BKR_Week4_DAL_HOU.txt` | 09:48:43 | 10/04 10:00 | 174 | 90 | 90 | 0 | 730 / 734 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| MIA@MIN | `BKR_Week4_MIA_MIN` | 09:57:03 | 10/04 13:05 | 113 | 29 | 27 | 2 | 403 / 423 | PARTIAL: no TD-scorer menu and no player Over/Under totals rendered; 2 SGP ladders no price |
| KC@LV | `BKR_Week4_KC_LVR` | 09:58:05 | 10/04 13:25 | 170 | 49 | 49 | 0 | 710 / 714 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| DEN@SF | `BKR_Week4_DEN_SF` | 09:57:28 | 10/04 13:25 | 166 | 80 | 80 | 0 | 682 / 686 | COMPLETE as rendered (only the two 2H Team Total + OT sections unpriced, same on every page) |
| LAC@SEA | `BKR_Week4_LAC_SEA` | 09:58:32 | 10/04 13:25 | 139 | 55 | 52 | 3 | 658 / 686 | PARTIAL (minor): 3 SGP ladders for one player no price |
| DET@CAR | `BKR_Week4_DET_CAR` | 09:58:59 | 10/04 17:20 | 128 | 44 | 6 | 38 | 200 / 601 | PARTIAL: entire player-prop menu (incl. TD scorer) no price; only game/period lines priced |
| ATL@NO | — (no current props-page capture supplied) | — | Mon 10/05 17:15 | — | — | — | — | — | **MISSING**: do not infer player props from the main-board row |
| **Total (14)** | | | | 2056 | 808 | 747 | 61 | 8373 / 9038 | |

**Validation:**
- IND@WAS independently reproduces the supplied observation: 41 SGP sections, 23 priced, 18 unpriced.
- In every file, the parser found the body start (first `SGP` badge) and the `Bet Slip` terminator, with 0 orphan price lines, 0 partially priced sections, and 0 player-type rows missing a player.
- Source sha256 hashes were identical before and after the run (recorded in the summary JSON).
- This parser has no `unparsed`/`unknown` concept, so no such counts are claimed. Section kinds are heuristic, from title text. Sections that don't match a known pattern fall into `game_prop` (70 per game: scoring-sequence, odd/even and timing props). They are retained verbatim, not classified further.

## Main game lines on the captured pages vs the Oct 2 capture (both BKR rendered, main lines only)

| Game | Spread 10/03 | Spread 10/02 | Total 10/03 | Total 10/02 | Home ML 10/03 | Home ML 10/02 |
|---|---|---|---|---|---|---|
| IND@WAS | WAS +4.5 (-109) | WAS +3.5 (+101) | 47 (o-103) | 47.5 | WAS +174 | WAS +187 |
| NE@BUF | BUF -7 (-103) | BUF -7 (-103) | 50 (o-108) | 50 | BUF -329 | BUF -329 |
| NYJ@CHI | CHI -3.5 (-113) | CHI -3.5 (-112) | 43 (o-110) | 43 | CHI -191 | CHI -195 |
| JAX@CIN | CIN -2.5 (-117) | CIN -2.5 (-117) | 52 (o-107) | 52 | CIN -148 | CIN -148 |
| ARI@NYG | NYG +2.5 (-106) | NYG +2.5 (-106) | 44.5 (o-105) | 44.5 | NYG +125 | NYG +125 |
| LAR@PHI | PHI +3.5 (-108) | PHI +3.5 (-108) | 42.5 (o-108) | 42.5 | PHI +172 | PHI +172 |
| GB@TB | TB +3 (+102) | TB +3.5 (-108) | 39.5 (o-106) | 39 | TB +150 | TB +154 |
| TEN@BAL | BAL -11 (-107) | BAL -11 (-107) | 42.5 (o-104) | 42.5 | BAL -587 | BAL -609 |
| DAL@HOU | HOU -3 (-109) | HOU -3 (-109) | 48.5 (o-108) | 48.5 | HOU -154 | HOU -155 |
| MIA@MIN | MIN -10 (-107) | MIN -10.5 (-108) | 38.5 (o-107) | 38.5 | MIN -538 | MIN -624 |
| KC@LV | LV +4.5 (-108) | LV +4.5 (-111) | 48 (o-103) | 48 | LV +184 | LV +178 |
| DEN@SF | SF -2.5 (-112) | SF -2.5 (-118) | 48 (o-111) | 48 | SF -144 | SF -152 |
| LAC@SEA | SEA -7 (-111) | SEA -7 (-111) | 42.5 (o-115) | 42.5 | SEA -319 | SEA -319 |
| DET@CAR | CAR +3.5 (-104) | CAR +3.5 (-103) | 51 (o-105) | 51 | CAR +167 | CAR +168 |
| ATL@NO | not captured | — | — | — | — | — |

The 10/02 column is the 2026-10-02 20:16 UTC capture (`bookmaker-live-2026-10-02-week4.json`). Changes are point-to-point between two snapshots, not a movement history. No 10/03 standalone BKR board file was saved (see the handoff).

## SGP sections displayed with no price

**IND@WAS** (18):
- Indianapolis Colts vs Washington Commanders Second Half
- Colts vs Commanders: Marcus Mariota Total Pass Completions
- Colts vs Commanders: Keenan Allen Total Receptions
- Colts vs Commanders: Tyler Warren Total Receptions
- Colts vs Commanders: Antonio Williams Total Receptions
- Colts vs Commanders: Terry McLaurin Total Receptions
- Colts vs Commanders: Stefon Diggs Total Receptions
- Colts vs Commanders: Chigoziem Okonkwo Total Receptions *(BKR display name not resolved on ESPN 2026 roster; not repaired)*
- Colts vs Commanders: Keenan Allen Total Receiving Yards
- Colts vs Commanders: Tyler Warren Total Receiving Yards
- Colts vs Commanders: Antonio Williams Total Receiving Yards
- Colts vs Commanders: Chigoziem Okonkwo Total Receiving Yards *(BKR display name not resolved on ESPN 2026 roster; not repaired)*
- Colts vs Commanders: Stefon Diggs Total Receiving Yards
- Colts vs Commanders: Terry McLaurin Total Receiving Yards
- Colts vs Commanders: Jacory Croskey-Merritt Total Rushing Yards
- Colts vs Commanders: Marcus Mariota Total Rushing Yards
- Colts vs Commanders: Jacory Croskey-Merritt Total Carries
- Colts vs Commanders: Marcus Mariota Total Carries

**MIA@MIN** (2):
- Dolphins vs Vikings: Ryan Miller Receptions
- Dolphins vs Vikings: Jaylen Wright Carries

**LAC@SEA** (3):
- Chargers vs Seahawks: Jadarian Price Receptions
- Chargers vs Seahawks: Jadarian Price Receiving Yards
- Chargers vs Seahawks: Jadarian Price Rushing Yards

**DET@CAR** (38):
- Detroit Lions vs Carolina Panthers Second Half
- Lions vs Panthers: Jared Goff Passing Yards
- Lions vs Panthers: Bryce Young Passing Yards
- Lions vs Panthers: Jared Goff Pass Completions
- Lions vs Panthers: Bryce Young Pass Completions
- Lions vs Panthers: Jared Goff Passing Touchdowns
- Lions vs Panthers: Bryce Young Passing Touchdowns
- Lions vs Panthers: Amon-Ra St. Brown Receptions
- Lions vs Panthers: Jahmyr Gibbs Receptions
- Lions vs Panthers: Sam LaPorta Receptions
- Lions vs Panthers: Jameson Williams Receptions
- Lions vs Panthers: Isaac TeSlaa Receptions
- Lions vs Panthers: Tetairoa McMillan Receptions
- Lions vs Panthers: Chuba Hubbard Receptions
- Lions vs Panthers: Darren Waller Receptions
- Lions vs Panthers: Tommy Tremble Receptions
- Lions vs Panthers: Jalen Coker Receptions
- Lions vs Panthers: Amon-Ra St. Brown Receiving Yards
- Lions vs Panthers: Jameson Williams Receiving Yards
- Lions vs Panthers: Jahmyr Gibbs Receiving Yards
- Lions vs Panthers: Sam LaPorta Receiving Yards
- Lions vs Panthers: Isaac TeSlaa Receiving Yards
- Lions vs Panthers: Chuba Hubbard Receiving Yards
- Lions vs Panthers: Tetairoa McMillan Receiving Yards
- Lions vs Panthers: Darren Waller Receiving Yards
- Lions vs Panthers: Tommy Tremble Receiving Yards
- Lions vs Panthers: Jalen Coker Receiving Yards
- Lions vs Panthers: Jahmyr Gibbs Rushing Yards
- Lions vs Panthers: Sione Vaki Rushing Yards
- Lions vs Panthers: Bryce Young Rushing Yards
- Lions vs Panthers: Chuba Hubbard Rushing Yards
- Lions vs Panthers: A.J. Dillon Rushing Yards *(BKR display name not resolved on ESPN 2026 roster; not repaired)*
- Lions vs Panthers: Jahmyr Gibbs Carries
- Lions vs Panthers: Chuba Hubbard Carries
- Lions vs Panthers: Player To Score 1st Touchdown
- Lions vs Panthers: Player To Score 1+ Touchdown
- Lions vs Panthers: Player To Score 2+ Touchdown
- Lions vs Panthers: Player To Score 3+ Touchdown

## Player-market availability notes

- **Touchdown-scorer menus** (1st TD / 1+ / 2+ / 3+) rendered for 12 of 14 games. None on the IND@WAS or MIA@MIN pages. DET@CAR rendered them, but every selection was unpriced.
- **Player Over/Under "Total" sections** are absent from the JAX@CIN, GB@TB, MIA@MIN and DET@CAR pages, which show threshold ladders only. Ladders are present on all 14 pages.
- **SGP badge placement differs between pages.** On IND@WAS, the period lines and player Over/Under totals carry the badge but the threshold ladders do not. On the other pages, the ladders and TD-scorer sections carry it. Team totals and game props carry no badge on any page.
- **Name resolution against `data/nfl-rosters/espn-full-rosters-latest.json`** (2026-10-02 18:56 UTC): 311 of 346 distinct per-game BKR player labels resolve exactly to a player on one of the two teams. 35 do not (suffix/spelling variants or unlisted players; the list is in the name-resolution JSON). No name was repaired, and none of the 35 may be used in a narrative or card until the roster gate resolves it.

## Not covered

- **ATL@NO (Monday):** no current props-page capture. The Oct 2 capture had game and period lines only.
- **PIT@CLE:** final, excluded.

## Addendum (10:46 PT): standalone BKR board saved

`data/odds/BKR_current_lines_1003_1046`: an Andy-supplied rendered BKR board, saved verbatim. Provenance is in `…1003_1046.provenance.md`. The paste shows no capture time; the upper bound is the 10:46 PT save. This is a reference snapshot, not an executable price.

**Board vs the per-game page captures, main lines:**

| Game | Result |
|---|---|
| 11 games | Identical |
| DAL@HOU | Moneyline differs: board DAL +144 / HOU -160; page (09:48) +135 / -154 |
| GB@TB | Total juice differs: board o39.5 +102 / u -119; page -106 / -110. Moneyline -174 / +151 vs -173 / +150 |
| TEN@BAL | Board TEN +11.5 (-108) / BAL -11.5 (-108), total 43, moneyline +492 / -629; page (09:56) +11 (-109), 42.5, +464 / -587 |
| ATL@NO | Board only: ATL +2.5 (-114) / NO -2.5 (-103), total 48 (o-105 / u-111), moneyline +112 / -128. The board shows "+59 Props" for this game, but no ATL@NO props page was captured, so nothing is inferred about its player props |
