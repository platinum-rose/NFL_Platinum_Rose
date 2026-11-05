# JAX @ BAL, Week 9 TNF prep packet (2026)

Thu 11/05, 5:15 PM PST. Read-only research context, not picks. Built 11/03 from local data (sources at the bottom).

## Market (DraftKings)

- 11/02 7 PM PT snapshot (`public/schedule.json`): BAL +8.5, total 42.5.
- 11/03 10 AM PT (Tuesday cadence/odds ingest): **JAX -9.5, total 41.5**. That's 1 point toward JAX and 1 point down on the total.
- 11/03 1 PM PT snapshot (`game_odds_snapshots` @21:00Z, now in `public/schedule.json` after a cache-only refresh): **BAL +10, total 40.5**. That's 1.5 points toward JAX and 2 points down on the total since Monday night.
- Cause of the stale cache: the Tuesday cadence wrote the cache (step 1) before ingesting odds (step 6). Fixed with a new step 6b (cache-only refresh) in `scripts/toolbox.mjs`.

## Team form, Weeks 1-8

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | 3rd% | RZ TD% | TO margin | pts/drive | Last 3 (opp, score, ATS) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| JAX | 5-2 | 4-3-0 | 3-4-0 | 28.0 | 15.9 | 5.93 | 5.54 | 49% | 68% | +7 | 2.76 | W5 vPHI 19-17 L; W6 vHOU 31-34 L; W8 vIND 42-7 W |
| BAL | 4-4 | 2-5-1 | 5-3-0 | 22.4 | 25.4 | 5.54 | 5.33 | 38% | 56% | +0 | 1.98 | W6 @CLE 10-13 L; W7 vCIN 13-35 L; W8 @BUF 10-36 L |

BAL QB starts by week (10+ attempts): Lamar Jackson: W1,2,3,4; Tyler Huntley: W5,6,7; Joe Fagnano: W8
BAL in Fagnano games (1): W8 vs BUF 10-36 (2.9 ypp, 0.77 pts/drive)

### JAX skill players (per game, Weeks 1-8; last 3 games at right)

| Player | G | Pass yds | Pass TD | Car | Rush yds | Tgt | Rec | Rec yds | Total TD | Last 3 | Last wk |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| Trevor Lawrence | 7 | 241 | 2.4 | 2.9 | 11 | 0.0 | 0.0 | 0 | 0 | 331py / 306py / 210py | 8 |
| Bhayshul Tuten | 7 | 0 | 0.0 | 15.7 | 70 | 2.3 | 2.1 | 26 | 6 | 72ru 2-24 / 39ru 4-48 / 104ru 2-55 | 8 |
| Parker Washington | 7 | 0 | 0.0 | 0.3 | 2 | 6.9 | 3.9 | 62 | 4 | 0ru 6-124 / 0ru 4-64 / 10ru 1-16 | 8 |
| Chris Rodriguez Jr. | 7 | 0 | 0.0 | 6.4 | 30 | 0.4 | 0.3 | 3 | 3 | 5ru 1-6 / 55ru 0-0 / 41ru 1-17 | 8 |
| Brenton Strange | 7 | 0 | 0.0 | 0.0 | 0 | 5.0 | 4.0 | 48 | 1 | 0ru 7-68 / 0ru 5-44 / 0ru 2-55 | 8 |
| Jakobi Meyers | 7 | 0 | 0.0 | 0.1 | 0 | 4.4 | 3.1 | 44 | 2 | 0ru 2-37 / 0ru 5-83 / 0ru 2-24 | 8 |
| Brian Thomas Jr. | 7 | 0 | 0.0 | 0.0 | 0 | 3.1 | 1.4 | 17 | 2 | 0ru 0-0 / 0ru 0-0 / 0ru 1-12 | 8 |
| Ameer Abdullah | 7 | 0 | 0.0 | 2.3 | 8 | 0.4 | 0.3 | 0 | 0 | 0ru 0-0 / 0ru 0-0 / 13ru 0-0 | 8 |
| Josh Cameron | 7 | 0 | 0.0 | 0.0 | 0 | 1.9 | 1.1 | 17 | 2 | 0ru 3-43 / 0ru 0-0 / 0ru 0-0 | 8 |

### BAL skill players (per game, Weeks 1-8; last 3 games at right)

| Player | G | Pass yds | Pass TD | Car | Rush yds | Tgt | Rec | Rec yds | Total TD | Last 3 | Last wk |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| Derrick Henry | 8 | 0 | 0.0 | 19.8 | 79 | 1.8 | 1.5 | 9 | 9 | 58ru 1-2 / 45ru 1-4 / 53ru 2-7 | 8 |
| Tyler Huntley | 5 | 145 | 0.8 | 3.6 | 15 | 0.0 | 0.0 | 0 | 1 | 165py / 298py / 0ru 0-0 | 8 |
| Lamar Jackson | 5 | 193 | 1.2 | 3.8 | 29 | 0.0 | 0.0 | 0 | 1 | 186py / 222py / 0ru 0-0 | 8 |
| Zay Flowers | 7 | 0 | 0.0 | 0.4 | 5 | 8.3 | 5.7 | 87 | 3 | 1ru 6-66 / 0ru 8-137 / 0ru 0-0 | 8 |
| Justice Hill | 8 | 0 | 0.0 | 3.0 | 19 | 3.1 | 2.1 | 13 | 0 | 0ru 3-9 / 7ru 3-26 / 15ru 4-20 | 8 |
| Mark Andrews | 8 | 0 | 0.0 | 0.0 | 0 | 5.1 | 3.6 | 27 | 1 | 0ru 1-4 / 0ru 3-23 / 0ru 3-14 | 8 |
| Rashod Bateman | 8 | 0 | 0.0 | 0.0 | 0 | 3.6 | 2.4 | 36 | 1 | 0ru 0-0 / 0ru 2-33 / 0ru 1-22 | 8 |
| Joe Fagnano | 1 | 91 | 0.0 | 3.0 | 3 | 0.0 | 0.0 | 0 | 0 | 91py | 8 |
| Ja'Kobi Lane | 4 | 0 | 0.0 | 0.0 | 0 | 3.5 | 2.2 | 22 | 0 | 0ru 4-40 / 0ru 3-25 / 0ru 1-13 | 8 |
| Josh Cuevas | 6 | 0 | 0.0 | 0.0 | 0 | 2.2 | 1.7 | 22 | 1 | 0ru 4-44 / 0ru 2-35 / 0ru 1-15 | 8 |

## Injury / availability (latest snapshot)

Snapshot generated 2026-11-02T23:30:01.947Z. Listed: IR / Out / Doubtful / Questionable / PUP rows only. The Week 9 practice reports start Tuesday, so recheck Wednesday.

- **JAX** (5): Caleb Ransaw (CB) IR; B.J. Green II (DE) IR; Jared Bartlett (LB) IR; Parker Hughes (LB) IR; DaVon Hamilton (DT) OUT
- **BAL** (5): Lamar Jackson (QB) IR - ankle; Durham Smythe (TE) IR; Skylar Thompson (QB) IR; Tavius Robinson (DE) IR - chest; Jahquez Robinson (S) IR

## Projected starters / usage locks

- **JAX** known: Bhayshul Tuten RB
- **BAL** known: Joe Fagnano QB, Lamar Jackson QB
- **Roster-gate flag:** `projected-starters/latest.json` still lists **Lamar Jackson** as a known BAL starter, from a Week 1 usage lock, next to Fagnano. Lamar is on IR. Drop the stale lock, or make sure the gate takes the newest lock.

## Still needed before TNF proposals (Wed afternoon)

- **Podcast picks:** Antigravity digest. Episodes found so far with a JAX@BAL segment: Sharp or Square `WbYwN5iWNGY` @0:06:00 and Ross Tucker/Fezzik `kq21OfxY1Mk` @14:09 (see `reports/intel/w09-episode-discovery-2026-11-03.md`).
- **FTN Stats IQ for Week 9:** the newest local file is Week 8 (`data/research-intel/review/ftn-stats-iq-week08-*.json`). Pull the JAX/BAL Week 9 view.
- **Wednesday injury report:** first practice report. Then the roster gate on every named player.
- **Prop boards:** BKR/BEO/DK/FDP once posted (no Week 9 TNF boards captured yet).
- **Any pick whose rationale assumes Lamar plays is stale:** BAL is +9.5 because of Fagnano.

Sources: `data/archive/2026/season/team-weeks.csv`, `player-games.csv` (rebuilt 11/03 after the box-score repair), `data/player-availability/latest.json`, `data/projected-starters/2026/latest.json`, `data/projected-starters/2026/manual/week-usage-locks.json`, `public/schedule.json`, `logs/cadence-reports/2026-w09-tuesday.md`.
