# Week 4 evidence refresh: inactives, weather, price re-check, roster gate (read-only)

**Date:** Sat 2026-10-03, 10:50–11:00 PT · **Agent:** Claude (Cowork) · **Branch:** `main`, HEAD `4970ebd`, 0/0.
**Scope:** read-only. No card, narrative, recommendation, ledger, portfolio, official-pick, odds-cache or Supabase change. No sportsbook action, no paid model, no stage/commit/push.
**Andy decision (10:47 PT):** the BKR props re-capture is skipped; it isn't needed for the Sunday synthesis.
**Previous lanes:**
- `handoffs/2026-10-03-0905-claude-week4-evidence-readiness.md`
- `handoffs/2026-10-03-1030-claude-week4-bkr-rendered-capture-normalization.md`

## New artifacts (all untracked, in `reports/analysis/week4-intel/`)

| File | Basis |
|---|---|
| `week4-injury-status-espn-2026-10-03T1751Z.json` | ESPN league injury feed, feed timestamp 17:51:04 UTC. Supersedes the 15:59Z snapshot. |
| `week4-weather-venue-2026-10-03T1751Z.json` | Open-Meteo hourly + NWS `forecastHourly` (NWS grids generated 17:30 UTC) + ESPN/AccuWeather, for all 15 venues. |
| `week4-source-price-reconciliation-2026-10-03-board1046.json` | The 241 promoted podcast and expert-feed rows, re-priced against `data/odds/BKR_current_lines_1003_1046`. Each row carries a `current_price_status`. Prop availability comes from the 09:29–09:59 PT rendered pages. |

## 1. Official inactives: NOT AVAILABLE YET (structural)

Inactive lists are published about 90 minutes before each kickoff, so none exist on Saturday:

| Sunday 10/04 window (PT) | Inactives expected |
|---|---|
| 06:30 kickoff (IND@WAS, London) | ~05:00 |
| 10:00 window | ~08:30 |
| 13:05 / 13:25 window | ~11:35 / ~11:55 |
| 17:20 kickoff (DET@CAR) | ~15:50 |
| Monday 10/05, 17:15 kickoff (ATL@NO) | ~15:45 |

The latest **game designations** were refreshed instead (ESPN feed 17:51 UTC).

Changes since 15:59 UTC:
- ATL linebacker Kendal Daniels: designation cleared.
- New Questionable: TEN guard Garrett Dellinger; BAL wide receiver Chris Moore (re-listed).
- WAS elevated running back Craig Reynolds from the practice squad.

The QB situation is unchanged:
- WAS: Jayden Daniels Out; Marcus Mariota expected to start.
- CHI: Caleb Williams Out; Tyson Bagent expected to start.
- TB: Baker Mayfield Out; Jalon Daniels starts.
- NYG: Jaxson Dart on IR; Jameis Winston starts.

Doubtful: Terry McLaurin (WAS) and T.J. Sanders (BUF).

**Stop condition:** a final card must re-check each game's 90-minute inactive list before it is placed.

## 2. Weather re-check (rain-flagged games)

| Game (kickoff PT) | NWS hourly, kickoff window (gen 17:30Z) | Open-Meteo max precip prob / total | ESPN | Wind | Read |
|---|---|---|---|---|---|
| LAR@PHI (10:00) | 39% → 45% → **77%** → 57% → 43%, "Rain Showers" | 30% (was 22%) / 0.00 in | Cloudy 64° | ≤ 8 mph | Showers likely mid-game. The models disagree on rain probability but agree on almost no accumulation and light wind. |
| TEN@BAL (10:00) | **62% → 75% → 72%** → 32% → 19% | 10% (was 17%) / 0.00 in | Cloudy 63° | ≤ 8 mph | NWS has showers in the first half; Open-Meteo has almost none. Unresolved; re-check Sunday morning. |
| ARI@NYG (10:00) | 13% → 13% → **53% → 53% → 53%** | 31% (was 23%) / 0.02 in | Cloudy 62° | ≤ 9 mph | Chance of showers in the second half; light. |
| DET@CAR (17:20) | **55–60%** all game, "Rain Showers Likely" | 27% (was 44%) / 0.00 in | Rain 67° | calm | The most consistent rain signal across sources. Wind is calm. |

- The NWS hourly percentages did not change between the 15:00 and 17:30 UTC generations.
- No game shows wind of 15 mph or more.
- Only DAL@HOU otherwise crosses 30% precipitation (17–34%), and that game has a retractable roof.
- **Stop condition:** re-pull within about 3 hours of kickoff.

## 3. Expert/podcast price check against the 10:46 PT BKR board

Rows flagged in the earlier passes stay held and are not re-scored. These are PIT@CLE, college, Week 5, period-market, contest, teaser/parlay/lean, sign-mismatch, large-gap and ambiguous-identity rows, plus props for players listed Out or Doubtful.

Of the remaining spread/total rows with a stated number:
- **43** are at the same number on the board.
- **14** are at a better number for the side the source took.
- **40** are at a worse number for that side.

Movement that matters for the Saturday review:
- **Key number 3:**
  - DEN@SF: all four expert feeds took DEN +3; the board has DEN +2.5 (-104).
  - DAL@HOU: HOU -2.5 sources (Action Network, Sharp or Square, Stuckey, Kendra Middleton) now face -3. The Even Money DAL +3.5 row now faces +3.
  - LAR@PHI: PHI +3 sources (Chad Millman, Steve Fezik, Even Money) now get +3.5. The LAR -2.5/-3 sources face -3.5.
  - GB@TB: Chad Millman's TB +3.5 now faces +3.
  - ATL@NO: Sharp or Square's ATL +3 now faces +2.5.
- **Key number 7:**
  - NE@BUF: the BUF -6.5 rows (Action Network, Sharp or Square) now face -7. Andrew Erickson's NE +7.5 faces +7.
  - LAC@SEA: the SEA -6.5 rows (BettingPros, Sharp or Square) face -7. The LAC +7.5 rows (Brandon Anderson, Even Money) face +7.
- **IND@WAS:** WAS +3.5 rows (Action Network, BettingPros, Doug Kezirian, Ross Tucker) now get +4.5. The IND -3.5 rows face -4.5. Every one of these positions predates the WAS QB designation, so treat them as stale on direction, not only on price.
- **MIA@MIN:** the MIA +11 rows (Action Network, Sharp or Square) and Stuckey's +10.5 face +10.
- **TEN@BAL:** the board moved to 11.5 / total 43, which now matches every +11.5/-11.5 source exactly.
- **Totals:** the BettingPros "over" rows are mostly 1–1.5 points below the current totals (NE@BUF, JAX@CIN, KC@LV, DET@CAR, ATL@NO).

44 podcast rows give no price and still can't be priced. Player props were not re-priced, because the props re-capture was skipped. Prop availability uses the 10/03 rendered pages, and ATL@NO has none.

## 4. Roster gate

`npm run roster:vet -- --week 4 --date 2026-10-02 --fetch --strict` at 17:52 UTC → **PASS, 0 blocking.**

**No narrative, card or digest exists yet:**
- no `reports/intel/master-intel-narratives-2026-w04.md`
- no `reports/bets/2026-w04-card.md`
- no `scratch/w04-synthesis-digest*.md`

The PASS therefore covers the seeds and book menus only. ESPN rosters are 22.9 h old (2026-10-02 18:56 UTC). The next `--fetch` run after the 24 h mark will refresh them.

**Stop condition:** run the gate again after the narrative is written, and stop on BLOCK.

## Readiness

The evidence is ready for the Saturday narrative/card **review**:
- current BKR main lines for all 15 games;
- 10/03 props menus for 14 games;
- refreshed designations;
- refreshed weather;
- re-priced source positions.

Still open, all structural or deferred:
- 90-minute inactives on game day;
- the game-day weather re-pull;
- the ATL@NO props menu (skipped by Andy);
- Andy's explicit authorization before any narratives file or card is written.

## Update 11:30 PT: Action Network opening lines wired into build.py (Andy-approved, persistent for the season)

**New script:** `scripts/master-intel/actionnetwork_openers.py --week <N>` (runbook step 8a).
- It reads Action Network's public JSON. The opener is the first line the AN "Open" book recorded after the previous Sunday at 5 PM PT. That gives the Week 4 opening lines.
- It writes `data/odds/actionnetwork-openers-2026-w04.json` (16 games, including PIT@CLE, which the report ignores) and the raw line histories in `data/generated/odds/actionnetwork-history-2026-w04/`.
- An earlier exploratory copy also exists, `data/generated/odds/actionnetwork-history-2026-10-03-week4/`. It is redundant, untracked, and can be deleted.

**`scripts/master-intel/build.py` (+27/-7):**
- `opening_lines()` prefers the AN opener file and falls back per game to the earliest `BKR_current_lines_*` paste.
- Each entry carries a `label`. The line-movement box now reads "opening line: Action Network open, Sun 9/27 5:00 PM PT → Bookmaker now, <date>", and the Data inputs table gains an "Opening lines" row.

**Docs:**
- Runbook: step 8a, plus §8 baseline and fallback notes.
- Format doc: change-log row dated 2026-10-03.
- `.agents/skills/master-intel-report/SKILL.md`: step 2b.

**Verification:**
- `py_compile` OK.
- `opening_lines(sched, 2026, 4)` returns 16 AN-labelled entries. Old-style calls and a missing-file week fall back to the BKR paste ("Bookmaker paste 1001_1242").
- No full report build was run. That would update the persisted big-money-flags state and dist outputs.

Nothing has been committed.
