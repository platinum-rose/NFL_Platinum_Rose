# Week 4 Saturday evidence readiness (read-only)

**Date:** Sat 2026-10-03, 08:54–09:10 PT (15:54–16:10 UTC) · **Agent:** Claude (Cowork) · **Branch:** `main`, HEAD `4970ebd`, 0 ahead / 0 behind `origin/main` after `git fetch`
**Scope:** read-only evidence refresh only. Nothing was built, promoted, locked, published, placed or executed. No ledger, portfolio, official-pick, odds-cache, availability-snapshot or Supabase write. No paid model call. No commit/push/stage.
**PIT@CLE is final and excluded everywhere below.**

## Verdict: NOT evidence-ready for the final narrative/card review

| # | Missing artifact | Source | Stop condition |
|---|---|---|---|
| 1 | `data/generated/props/bookmaker-live-2026-10-03-week4.raw.txt` + parsed `.json` (current BKR board + prop availability) | Bookmaker.eu rendered pages, Andy's logged-in Chrome (`scripts/props/bookmaker-sgp-extract.browser.js`, then `bookmaker-sgp-dump-parse.mjs`) | **Blocked: Chrome session is logged out** (`be.bookmaker.eu/.../game-lines/` redirects to the home page and shows the sign-in form; checked 15:58, 16:00 and 16:02 UTC). Agents must not sign in. Andy logs in, then an agent captures. The `bkrDownload()` file save needs Andy's OK. |
| 2 | Current-price comparison and current-price expert reconciliation | Depends on #1 | Blocked on #1. Everything below is priced against the **Oct 2 20:16 UTC (13:16 PT) capture, which is stale and not executable**. No line movement is claimed. |
| 3 | Official 90-minute inactive lists | NFL/team inactive reports (Sun 10/04 for 14 games; Mon 10/05 for ATL@NO) | Not published yet. This is structural: the Saturday review can go ahead on Friday game designations, but a final card must re-check inactives before kickoff. |
| 4 | Roster-gate pass on the eventual narratives/card | `npm run roster:vet -- --week 4 --date <capture-date> --fetch --strict` | Re-run after #1 (the `--date` should become the new capture date) and after any narrative is written. |

## New evidence artifacts (dated, source-qualified; all untracked)

- `reports/analysis/week4-intel/week4-injury-status-espn-2026-10-03T1559Z.json`: ESPN league injury feed, captured 15:59:48 UTC. Holds the Out/Doubtful/Questionable/IR designations plus every QB row for the 30 remaining-slate teams. These are game designations from the team reports, not inactive lists.
- `reports/analysis/week4-intel/week4-weather-venue-2026-10-03T1559Z.json`: venue/roof plus the kickoff-window forecast from Open-Meteo hourly, NWS `forecastHourly` (US venues) and ESPN/AccuWeather, generated 15:59:16 UTC.
- `reports/analysis/week4-intel/week4-source-price-reconciliation-2026-10-03.json`: all 155 promoted Gemini picks and 86 expert-feed rows, each tagged with game, Oct-2 baseline comparison and exclusion flags. The rows keep speaker, episode, timestamp and quote.

## Slate-wide findings

**Corrections to `WEEK4_PRELIMINARY_RESEARCH_SYNTHESIS.md` (do not carry its framing forward):**
- **IND@WAS is in London** (Tottenham Hotspur Stadium, neutral site, 13:30 UTC / 06:30 PT), not in Washington.
- **ATL@NO (Superdome) and DAL@HOU (NRG, retractable roof) are not outdoor weather games.** The synthesis asked for outdoor weather checks on both. For HOU, the roof setting is the only open item.
- **QB changes the synthesis does not mention:** Washington's Jayden Daniels is **Out** (Marcus Mariota to start, per the ESPN-feed reporter note). Chicago's Caleb Williams is **Out** (Tyson Bagent expected to start). Tampa Bay's Baker Mayfield is **Out**, with Jalon Daniels named starter. The Giants' Jaxson Dart is on **IR**, with Jameis Winston named starter. The Oct 2 lines may not fully reflect the WAS and CHI news (Daniels ruled out 14:09 UTC, Williams 17:00 UTC; the BKR capture was 20:16 UTC).

**Baseline (Oct 2) prop-menu gaps, still unverified against a current board:**
- **NYJ@CHI:** whole player-prop menu listed without odds (432/468 rows unavailable, 26 players).
- **DET@CAR:** whole menu listed without odds (391/427 rows, 28 players).
- **ATL@NO:** no player-prop menu at all (36 rows, game and period lines only; normal for a Monday game early).
- **MIA@MIN:** thin menu (214 rows).
- **LAR@PHI:** reduced menu (314 rows).
- **Partial pulls:** IND@WAS (65 rows, 4 receivers), LAC@SEA (76 rows, 4 receivers), NE@BUF (both QBs' passing yards and completions).

A player listed without odds is a status question, not an injury fact.

**Source-reconciliation exclusions (241 rows):**
- 9 rows from the already-played PIT@CLE game.
- 4 rows on college games.
- 1 row on Week 5.
- 3 rows with period-market language.
- 15 contest or pick'em rows; 20 teaser/parlay/lean/futures rows.
- 25 props mislabelled as `season_*` yards but carrying single-game lines (verify before use).
- 6 rows with an unmapped team field (one names a player string that does not resolve, so identity is unresolved and was not repaired).
- 7 rows whose number contradicts the baseline by sign or by 3+ points. These are alt-line, period or mislabelled-team rows; do not use them.
- 1 player tagged to two different games (ambiguous identity; the roster gate decides).

44 podcast rows state no price, so they can't be price-checked until the current board exists.

**Weather (open-air venues):** wind ≤ 13.4 mph sustained everywhere (Open-Meteo max, NE@BUF). There is a material rain disagreement between models:
- **LAR@PHI:** NWS 39–77% showers; Open-Meteo ≤ 22%.
- **TEN@BAL:** NWS 62–75%; Open-Meteo ≤ 17%.
- **DET@CAR:** NWS ~60% for the night game; Open-Meteo ≤ 44%; ESPN "Rain".
- **ARI@NYG:** NWS 13–53%; Open-Meteo ≤ 23%.

Heat: GB@TB 87–88°F; DEN@SF 79–88°F. Re-check within ~3 h of kickoff.

## Per game

Each block covers market availability (Oct 2 baseline; a current board is **MISSING** for all 15), official status (ESPN feed 10/03 15:59 UTC), weather, material disagreement and gaps.

## IND@WAS
- **Market:** IND -3.5 / 47.5 on Oct 2. Two Washington receivers listed without odds, including Terry McLaurin. The Oct 2 board predates the QB designation. Kickoff is 06:30 PT, so a current capture must happen tonight.
- **Status:** Washington's Jayden Daniels Out (Marcus Mariota to start, reporter note). Terry McLaurin **Doubtful** (14:42 UTC). Rachaad White Out. Indianapolis's Keenan Allen downgraded to **Out** (14:37 UTC). The podcast McLaurin "stay away" remark is consistent with this but is not the status source.
- **Weather:** London, open-air, 70–72°F, 0% precipitation, wind ≤ 7 mph (Open-Meteo; no NWS coverage).
- **Disagreement:** two podcast rows on IND -3.5, four on WAS +3.5 (two Action Network/BettingPros feed rows included). All were taken before the QB news, so treat them as stale for direction.
- **Gaps:** current board; one IND receiver prop at a mislabelled "season" market is moot (player Out).

## NE@BUF
- **Market:** NE +7 / 50; both QBs' passing-yards and completions listed without odds on Oct 2.
- **Status:** Drake Maye full practice Friday, no designation. Josh Allen shows no designation in the feed (the podcast "non-structural knee" remark is consistent with this but is not the status source). NE: Christian Gonzalez and Christian Barmore Out. BUF: T.J. Sanders Doubtful.
- **Weather:** Orchard Park, 65–68°F, precipitation ≤ 7%, wind 6–13 mph, gusts to 21.
- **Disagreement:** -6.5 rows (Action Network, BettingPros, Sharp or Square) against +7 rows (Even Money, two podcast hosts). Many expert rows sit at -6.5, half a point off the baseline.
- **Gaps:** current board; QB passing-prop availability.

## NYJ@CHI
- **Market:** CHI -3.5 / 43; **whole prop menu unpriced on Oct 2.**
- **Status:** Chicago's Caleb Williams **Out**; Tyson Bagent expected to start (reporter note). NYJ: Breece Hall Out (confirms the podcast claim), Adonai Mitchell Out, Mason Taylor Out. CHI: Kyler Gordon and Braxton Jones Out.
- **Weather:** Soldier Field, 65–67°F, 0% precipitation, wind ≤ 10 mph.
- **Disagreement:** NYJ +3.5 (Action Network, Even Money, Kendra Middleton) against CHI -3.5 (BettingPros). All predate the Williams designation.
- **Gaps:** current board and prop menu (the strongest candidate for a whole-menu gap).

## JAX@CIN
- **Market:** CIN -2.5 / 52; full menu on Oct 2.
- **Status:** CIN: Kyle Dugger Out, Bryan Cook Questionable. JAX: two cornerbacks Questionable (designations from mid-week; verify against the final report).
- **Weather:** Paycor, 72–76°F, 0% precipitation, calm.
- **Disagreement:** JAX +2.5 (Action Network, The Favorites, Doug Kezirian) against CIN -2.5 (Sharp or Square). Over 50.5–51 sources sit 1–1.5 points below the baseline 52.
- **Gaps:** current board.

## ARI@NYG
- **Market:** ARI -2.5 / 44.5; full menu on Oct 2.
- **Status:** NYG: Jaxson Dart on IR; Jameis Winston named starter. ARI: Dadrion Taylor-Demerson Out.
- **Weather:** MetLife, 58–62°F. NWS rain showers up to 53% late against Open-Meteo ≤ 23%. Flagged.
- **Disagreement:** heaviest cleanup game, with 11 of 19 rows held. Two rows contradict the baseline by sign or by 9 points (an alt line at +285, and an "ARI +1.5" row whose own text says "prior to line flip"). One player prop is tagged to this game and to DET@CAR. Clean rows: ARI -2.5 (Chad Millman) against NYG +2.5 (Brandon Anderson).
- **Gaps:** current board.

## LAR@PHI
- **Market:** LAR -3.5 / 42.5; reduced menu (314 rows).
- **Status:** PHI: DeVonta Smith, Hollywood Brown, Dallas Goedert, Zack Baun, Marcus Epps and Fred Johnson all **Out**. LAR: Jaylen Watson Out; Aaron Donald listed Out.
- **Weather:** Philadelphia, about 60°F. **NWS rain showers 39–77% against Open-Meteo ≤ 22%.** Material, flagged.
- **Disagreement:** PHI +3 / +3.5 (Even Money, Sharp or Square, Chad Millman, Steve Fezik) against LAR -2.5 / -3 (BettingPros, Joe Gibbs). One row tagged "LAR +2.5" contradicts the baseline and is held.
- **Gaps:** current board; the weather model split.

## GB@TB
- **Market:** GB -3.5 / 39; full menu on Oct 2.
- **Status:** TB: Baker Mayfield Out (confirms the podcast claim), Jalon Daniels named starter. GB: Micah Parsons Out, Jacob Monk Out, Aaron Banks Out.
- **Weather:** Tampa, 87–88°F, precipitation ≤ 15%, wind ≤ 8 mph.
- **Disagreement:** TB +3.5 (Chad Millman; Action Network ML) against the Under 39.5 rows (Even Money, Steve Fezik), which sit half a point above the baseline 39.
- **Gaps:** current board; one podcast touchdown prop names a player not on the Oct 2 menu (unverified).

## TEN@BAL
- **Market:** BAL -11 / 42.5; full menu on Oct 2.
- **Status:** BAL: Ethan Pocic (C) Out, which supports the podcast center concern. Lamar Jackson shows no designation. Trey Hendrickson Out. Zay Flowers and Ronnie Stanley Questionable (Friday). TEN: Tyjae Spears Questionable.
- **Weather:** Baltimore, about 63°F. **NWS rain 62–75% against Open-Meteo ≤ 17%.** Flagged.
- **Disagreement:** TEN +11.5 (four podcast hosts, Even Money) against BAL -11.5 (BettingPros, Brandon Anderson). All sources are at 11.5; the baseline is 11.
- **Gaps:** current board; Flowers' status.

## DAL@HOU
- **Market:** HOU -3 / 48.5; full menu on Oct 2.
- **Status:** HOU: Azeez Al-Shaair Out, Jadeveon Clowney Questionable. DAL: Cobie Durant and DeMarvion Overshown Out.
- **Weather:** NRG, retractable roof (the team sets it); about 80°F outside, 17% storm chance.
- **Disagreement:** HOU -2.5 (Action Network, Sharp or Square, Stuckey, Kendra Middleton) against DAL +3.5 (Even Money). BettingPros holds both HOU -1.5 and DAL +1.5. The key number 3 sits between the source numbers and the baseline.
- **Gaps:** current board; roof setting.

## MIA@MIN
- **Market:** MIN -10.5 / 38.5; thin menu on Oct 2 (period lines partly unavailable).
- **Status:** MIN: Justin Jefferson **Out** and Josh Oliver on IR (confirm the podcast claims). MIA: Caleb Douglas Out; De'Von Achane on IR.
- **Weather:** U.S. Bank Stadium, fixed roof.
- **Disagreement:** Under 38.5 (Action Network, Doug Kezirian) and MIA +10.5 / +11 (Stuckey, Action Network, Sharp or Square) against MIN -10.5 (Derrik Klassen). Two BettingPros rows (MIN -5.5, Under 41.5) are first-half or stale and held. One row is a Week 5 reference and is excluded.
- **Gaps:** current board and prop menu depth.

## KC@LV
- **Market:** KC -4.5 / 48; full menu on Oct 2.
- **Status:** KC: Josh Simmons Out. LV: Jackson Powers-Johnson Out; backup QB Aidan O'Connell Questionable.
- **Weather:** Allegiant, fixed roof.
- **Disagreement:** a clean two-way split. KC -4.5 (BettingPros, Derek Brown) against LV +4.5 (Sharp or Square, Even Money, Pat Fitzmaurice). Totals are split too: Over 46.5–47.5 (Even Money, BettingPros) against Under 47.5 (two podcast hosts).
- **Gaps:** current board.

## DEN@SF
- **Market:** SF -2.5 / 48; full menu on Oct 2.
- **Status:** SF: Nick Bosa Out (confirms the podcast claim), Mykel Williams Out, Mike Evans Questionable. DEN: Dondrea Tillman Out.
- **Weather:** Levi's, open-air, 79–88°F, wind ≤ 12 mph.
- **Disagreement:** none on direction; all four expert feeds and three podcast hosts are on DEN. Price matters: the expert feeds are at **+3**, the baseline is **+2.5**, and the podcast rows are at +2.5.
- **Gaps:** current board; Evans' final status.

## LAC@SEA
- **Market:** SEA -7 / 42.5; four LAC receivers listed without odds on Oct 2.
- **Status:** LAC: Ladd McConkey, Derwin James Jr. and backup QB Trey Lance Questionable; Brenen Thompson and Charlie Kolar Out. SEA: Zach Charbonnet and Jadarian Price both **Out** (RB depth).
- **Weather:** Lumen Field, 69–71°F, 0% precipitation, calm.
- **Disagreement:** SEA -6.5 / -7 (Action Network, BettingPros, Sharp or Square) against LAC +7.5 (Even Money, Brandon Anderson). This is around the key number 7.
- **Gaps:** current board; McConkey's status.

## DET@CAR (Sunday night)
- **Market:** DET -3.5 / 51; **whole prop menu unpriced on Oct 2.**
- **Status:** CAR: Xavier Legette Out, Damien Lewis Out, Jalen Coker Questionable; Mike Jackson and Jaycee Horn on IR (confirms the podcast "two corners on IR" claim). DET: Brian Branch Out, D.J. Reed Questionable.
- **Weather:** Charlotte, about 67°F. **Rain likely (NWS ~60%, ESPN "Rain")**; calm.
- **Disagreement:** CAR +3 / +3.5 (Sharp or Square, Even Money) against DET -3 (BettingPros). Over 49.5–51 rows (Action Network, BettingPros) run against the rain forecast.
- **Gaps:** current board and props; the rain update near kickoff.

## ATL@NO (Monday night)
- **Market:** NO -2.5 / 48; **no player-prop menu on Oct 2.**
- **Status:** the designations are mid-week practice entries. The Monday-game final report and the Monday inactives are still to come. NO: Noah Fant, Kaden Elliss and Pete Werner Questionable.
- **Weather:** Superdome, fixed roof.
- **Disagreement:** NO -2.5 (BettingPros) against ATL +3 (Sharp or Square; above the baseline +2.5). An Even Money "NO +220" row is a "team to score last" market, not a moneyline. Excluded.
- **Gaps:** current board and props (likely to post later); final status.

## Verification and git

- `git status` before and after this session: same 235 modified files. New untracked files are only the four artifacts named above (three evidence JSONs plus this handoff). No `git add`, commit, stash, reset or push.
- Roster gate: see the closeout for the result of `npm run roster:vet -- --week 4 --date 2026-10-02 --fetch --strict` run after this handoff was written.

## Resume prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard on main. Read handoffs/2026-10-03-0905-claude-week4-evidence-readiness.md.
Andy has logged in to be.bookmaker.eu in Chrome. Capture the current Week 4 board read-only per docs/MASTER_INTEL_REPORT_RUNBOOK.md §2 (no odds clicks, no bet slip; ask Andy before bkrDownload()), parse with bookmaker-sgp-dump-parse.mjs, re-run the Oct-2-vs-current comparison and the source-price reconciliation (~/w4/recon.py logic, price basis = new capture), re-pull the ESPN injury feed, re-run the strict roster gate with --date set to the new capture date, then report evidence-readiness. Do not write narratives or cards without Andy's explicit authorization.
```

## Roster-gate result (16:03–16:04 UTC)

- **Canonical gate:** `npm run roster:vet -- --week 4 --date 2026-10-02 --fetch --strict` → **PASS, 0 blocking.** ESPN rosters were generated 2026-10-02 18:56 UTC (21.1 h old, under the 24 h refresh threshold, so no refetch).
- **Extra check on this handoff:** the same gate, run with `--narratives <this file>` as an override, returned **BLOCK, 52 UNKNOWN_NAME.** A script check of all 52 against `espn-full-rosters-latest.json` found:
  - 35 player names that match their claimed team on the live roster, but the name regex had captured the trailing capitalized status word ("… Out" / "… Questionable");
  - 17 non-player strings: venues, podcast hosts, and "Two Washington".
  - **No player-team mismatch.** Per the stop rule, no names were changed. The narratives-format gate cannot vet this handoff cleanly, so treat that as a format limitation, not a roster error. The canonical run above was executed last, so `data/generated/master-intel/w04-roster-vet.json` reflects the PASS.
