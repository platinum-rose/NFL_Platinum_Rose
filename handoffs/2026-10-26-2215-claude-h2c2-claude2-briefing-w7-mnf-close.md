# H2C2 cross-team briefing: Week 7 MNF close, tracker fixes, scraper cadence, Yahoo → Claude Team 2

H2C2 means "Handoff 2 Claude 2", Andy's name for a cross-team handoff.

- **Written:** Mon 2026-10-26, about 22:15 PT, by Claude Team 1 (session `013BavRR…`, the MNF island and evening session).
- **For:** Claude Team 2, who resume the NFL_Dashboard ("Platinum Rose") analyst and operator lane.
- **Window:** Mon 10/26 07:45 → 22:15 PT. That is 16 commits, `b98a243` → `0493dfd`, plus this handoff's own commit. It covers 5 Codex handoffs, the MNF build and placements, the 20:46 settle and the evening engineering.
- **Replaces** as the pick-up point:
  - `handoffs/2026-10-26-0745-claude-h2c2-codex-briefing-w7-mobile-tracker-hedge-watch.md`, the morning H2C2 to Codex. It is still the reference for Hedge Watch and mobile-tracker internals.
  - `handoffs/2026-10-26-codex-week7-football-stats.md`, which was the last `HANDOFF.md` pointer.
- **Git when written:** branch `claude/w5-prop-cards-2026-10-11`, HEAD `0493dfd`, pushed. `origin/main` = `61da10a`; main is not the working branch.

> Everything referenced is in the repo. Files a fresh clone would lack or have in a different version are copied to
> `reports/handoff-snapshots/2026-10-26-h2c2-w7-mnf-close-claude2/copies/`; see `file-manifest.md` there. The same folder
> has `handoff-chain-digest.md` (the full digest of the window, with a corrections header), `commits.md` and
> `week7-ticket-ledger.md`. That ledger is generated from the ledgers, not typed.

---

## 0. TL;DR: where things stand

1. **Week 7 is fully settled.** That's 39 real tickets: $387.51 cash risked, 2 won, 37 lost, net **−$234.99**.
   - MNF DAL @ PHI ended **DAL 38, PHI 21** (total 59).
   - Andy had 8 real MNF tickets: $63.39 risked, 1 win, net **−$1.39**. The win was DKP 46908050 ($9.99 → $62.00, +$52.01), which Andy confirmed as Paid at 21:40.
   - No real ticket is pending.
2. **Week 8 starts now.** TNF is CAR @ GB on Thu 10/29 (8:15 PM ET / 5:15 PM PT). The full slate is 14 games in `public/schedule.json`; SNF is PHI @ WAS and MNF is CHI @ SEA.
   - Week 8 runs on the normal cadence (§4.8).
   - **Before Thursday,** confirm the mobile tracker's `--week auto` resolves to 8. Codex could not check this (ESPN DNS failed in its shell).
3. **The Week 7 post-mortem is about 90% done** and belongs to Codex. It is waiting on DAL @ PHI (now final, with a box score on disk) and on the proposal-vs-results analysis. Claude's part is the recommendation-ledger entries for Week 7 (§6b).
4. **Paper (Platinum AI imaginary) Week 7:** 43 tickets. 41 are decided: 5 cashed, 36 burnt, **−$269.01** paper P&L. Two MNF stacks from §7l, S1 and S3, still need manual grading from the box score.
   - The paper JSON never stores results. The trackers grade paper live, so recording the results means the recommendation ledger (§6b).
5. **Prop scrapers now run on a weekly cadence,** registered live by Andy at about 20:15 (§4.6). There are 19 runs a week each: Bookmaker at the listed times, BetOnline 10 minutes later, DraftKings 20 minutes later.
6. **Yahoo Fantasy API is working.** Andy sent Codex a briefing (`docs/YAHOO_FANTASY_API_ACCESS_FOR_CODEX.md`). The client secret still needs rotating (needs Andy).
7. **Scheduled tasks are live** (§4.7): Hedge Watch runs for Thu/Sun/Mon, the Tue 8 AM team-profile refresh, and the Thu 8 AM SuperContest lines ingest. The Windows weekly archive runs **tonight at 23:30 PT**, and the Yahoo Survivor sync runs Tue 10:00.

## 0a. UPDATE Tue 2026-10-27 07:19 PT: the Tuesday cadence has run (Andy)

Andy ran `node scripts/toolbox.mjs --cadence tuesday` at about 07:18 PT. It took 32.6 s and every step succeeded. **Don't rerun it. The next cadence is `wednesday`.** Results:

1. **Schedule ingest** (`agents/schedule-ingest.js`, weeks 1–18): 272 rows, no duplicates. Cache: `public/schedule.json`.
   - Supabase `games` table upserted.
   - Live odds applied to 12 games; 153 rows fell back to ESPN odds, including Week 8 ARI@DAL and PHI@WAS.
2. **Player stats:** nflverse weekly (83,326 rows) and seasonal (9,658) refreshed in `data/vault-seed/nflverse/`. Supabase `player_stats` got 7,440 rows and `player_season_stats` got 1,690 (season 2026).
3. **Usage locks** from Week 7 usage: 14 lock candidates written to `data/projected-starters/2026/manual/week-usage-locks.json`.
   - 303 rows archived to `data/generated/player-usage-history/2026/week-07.json`.
   - Trends updated in `data/generated/player-usage-trends-2026.json`.
4. **Projected starters** rebuilt: 85 signals, 32 teams, 61 manual and 25 estimated rows. Snapshot `data/projected-starters/2026/latest.json`, markdown `docs/projected-starters/projected-starters-latest.md`.
   - **One team needs a manual depth chart: TB** ("estimated_from_local_starter_language"). TB hosts ATL Sun 1 PM ET.
5. **Week 8 opening game odds via TheOddsAPI** (`agents/game-odds-ingest.js`): 14 events, 126 rows written to Supabase `game_odds_snapshots`, 17 line movements, 1,008 rows older than 90 days pruned.
   - **Quota: 364 credits remaining** (floor 15). Andy ran this step himself as part of his cadence. **Agents still don't call TheOddsAPI on their own.**
6. **Roster audit** (`scripts/audit-all32-rosters.js`): 0 team-assignment conflicts.
   - Najee Harris, Russell Wilson and Justin Fields were "not found in active primary datasets".
   - Per Andy's preference, **web-search a missing player before using or flagging him.**
   - Confirmed placements: Rodgers PIT, Pickens DAL, Diggs WAS, Barkley PHI, Henry BAL, K. Allen IND, Cousins LV.

**Week 8 slate with Tuesday opening lines** (home spread, DraftKings unless marked ESPN; from `public/schedule.json`; times ET):

| Game | Time | Home spread | Total |
|---|---|---:|---:|
| CAR @ GB | Thu 8:15 PM | GB −3.5 | 47.5 |
| BAL @ BUF | Sun 1 PM | BUF −3.5 | 53.5 |
| TEN @ CIN | Sun 1 PM | CIN −10 | 46.5 |
| ARI @ DAL | Sun 1 PM | DAL −6 (ESPN) | 54.5 |
| MIN @ DET | Sun 1 PM | DET −3 | 46.5 |
| LV @ NYJ | Sun 1 PM | NYJ −1.5 | 45.5 |
| CLE @ PIT | Sun 1 PM | PIT −3.5 | 39.5 |
| ATL @ TB | Sun 1 PM | TB −2.5 | 46.5 |
| IND @ JAX | Sun 1 PM | JAX −7.5 | 46.5 |
| LAC @ LAR | Sun 4:05 PM | LAR −6.5 | 44.5 |
| KC @ DEN | Sun 4:25 PM | DEN +1.5 | 41.5 |
| NE @ MIA | Sun 4:25 PM | MIA +7.5 | 44.5 |
| PHI @ WAS | Sun 8:20 PM | WAS −4.5 (ESPN) | 40.5 |
| CHI @ SEA | Mon 8:15 PM | SEA −3 | 46.5 |

**These cadence outputs are uncommitted in the working tree.** Commit them **by name** with your first Week 8 commit, after a quick look:
- `public/schedule.json`
- `data/projected-starters/2026/latest.json`
- `data/projected-starters/2026/manual/week-usage-locks.json`
- `data/projected-starters/2026/projected-starters-2026-10-27.json` (new)
- `docs/projected-starters/projected-starters-latest.md`
- `docs/projected-starters/projected-starters-2026-10-27.md` (new)
- `data/generated/player-usage-trends-2026.json`
- `data/generated/player-usage-history/2026/week-07.json` (new)

The `.nfl/receipts/*` and `data/vault-seed/nflverse/*` files are gitignored or local; leave them.

The log Andy pasted also held three repeats of the **Monday cadence** settlement preview, generated 2026-10-26 07:33 PT, **before MNF**. It shows "31 tickets, DAL @ PHI pending". That is stale: MNF is settled (§3), so ignore it.

## 1. Read these first (in order)

| # | File | Why |
|---|---|---|
| 1 | this briefing | The current state of everything |
| 2 | `reports/handoff-snapshots/2026-10-26-h2c2-w7-mnf-close-claude2/week7-ticket-ledger.md` | Every Week 7 ticket, real and paper, with results (generated) |
| 3 | `HANDOFF.md` | Index; its PICK UP HERE points here |
| 4 | `CLAUDE.md`, `AGENTS.md` | Repo rules; the roster gate; the single source of truth for wagers |
| 5 | `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` §7.2 and §5 rules 1–7 | **The only betting rules.** Dirty in the shared checkout; read the working copy |
| 6 | `reports/bets/2026-w07-card.md` §7j, §7k, §7l | Island-ladder format and this week's MNF builds |
| 7 | `docs/MOBILE_LIVE_TRACKER.md` | Phone tracker plus the Hedge Watch runbook |
| 8 | `handoffs/2026-10-26-0745-claude-h2c2-codex-briefing-w7-mobile-tracker-hedge-watch.md` | Morning H2C2: tracker/Hedge Watch design, settlement procedure, rules list |
| 9 | `reports/handoff-snapshots/2026-10-26-h2c2-w7-mnf-close-claude2/handoff-chain-digest.md` | Full digest of the 5 Codex handoffs and the card, for depth |
| 10 | `reports/analysis/week7-postmortem/w07-postmortem-data-2026-10-26.md`, `w07-football-stats-2026-10-26.md` | Codex's Week 7 data pack (pre-MNF) |
| 11 | `docs/BETTING_LESSONS_LEARNED.md`, `docs/NFL_WEEKLY_CARD_PROCESS.md` | Before building any Week 8 card |
| 12 | claude.ai project doc `claude/recommendation-ledger-2026.md` | Canonical recommendation ledger. The repo mirror `docs/claude-project-dev/recommendation-ledger-2026.md` is older (10/21); see §8 |

## 2. Who did what, Mon 10/26

| Time PT | Who | What | Commit |
|---|---|---|---|
| 07:33–07:40 | Claude (`01Hie8K6…`) | Hedge Watch schedule runbook; morning H2C2 to Codex | `b98a243`, `11e7da2` |
| 08:10 | Codex | Hedge Watch calibrated and hardened: 7 unit tests, `--season` default, `--no-paper`, exits before writing on ESPN failure | `35525d4`, `1f8dd22` |
| 12:48 | Codex | Shared ESPN HTTP helper `scripts/lib/espn-http.mjs` | `1eb7ddb` |
| 12:54 | Codex | Week 7 post-mortem data pack: 13 finals, 31 tickets | `695e69c` |
| 13:26 | Codex | Week 7 team/player/scoring exports (`compile-game-data.mjs`) | `7e7fd4b` |
| 16:02–16:30 | Claude Team 1 (`013BavRR…`) | Built card §7k, the MNF fresh island ladder (BetOnline 3:32 PM prices, 3:45 PM inactives, roster gate PASS); paper-tracked it | `d8e26bf` |
| 16:19–16:27 | Claude Team 1, with Andy | Andy found two legs missing at BKR: Aubrey fantasy points, and the Dallas team-FG total. Claude offered substitutes (Dallas first FG; a two-sided shootout T3) | (chat) |
| 16:40 | Claude Team 1 | Logged 4 placed tickets: BKR 740869686, BKR 740869210, DKP 46920838, DKP 46908050. Answered Andy's TD-exposure question; proposed three DK stacks (kicking/DEF/under-used players) | `1d504d7` |
| 16:50 | Claude Team 1 | Proposed stacks S1–S3 in the +1500 to +2500 band | (chat) |
| 17:17–17:19 | Claude Team 1 | Logged BKR 740871157 (2-team) and DKP 47012140, 46998409, 46957964 | `8bc29a6` |
| 17:29 | Claude Team 1 | **Fix:** Rashan Gary's "0.5+ sacks" leg was logged with line 0, so 0 sacks graded HIT. Line set to 0.5 | `003e861` |
| 17:52 | Claude Team 1 | Card §7l: all other MNF recommendations, paper-tracked (T1 rebuild, T3 shootout, S1, S2, S3) | `5d0824d` |
| 18:50–20:16 | Claude Team 1 | Prop-scraper registration changed from a 3-hourly repeat to Andy's weekly cadence. Andy registered all three tasks; Claude verified them read-only | `08256bc` |
| 20:46 | Claude check-in (`01Hie8K6…`, scheduled) | Settled MNF from ESPN: 1 win, 7 losses; trackers regenerated | `7ab6fb0` |
| 21:40 | Claude Team 1 | Recorded Andy's DK "Paid $62.00" confirmation on 46908050 and the settled-position URL | `21864cf` |
| 21:44 | Claude Team 1 | Yahoo API access briefing for Codex, also in the claude.ai project | `0493dfd` |

Hedge Watch also ran at 16:25, 17:02 and 18:45 PT (all SUCCEEDED, according to the scheduled-task records). They republished the phone tracker.

## 3. Results and state of record

All numbers come from `data/official-picks/user-placed-wagers-2026.json`. The tables are in `week7-ticket-ledger.md`.

**Week 7 real (final):** 39 tickets, 2 won, 37 lost, 0 pending; $387.51 cash; **−$234.99**. Every ticket is `funding_type=cash` with `is_promo_credit=false`.
- Before MNF: 31 tickets, −$233.60. The only win was DKP 45488862 (+$72.06).
- MNF: 8 tickets, −$1.39.

**MNF tickets (DAL 38, PHI 21):**

| Ticket | Book | Legs | Risk | Result |
|---|---|---|---:|---|
| 740869686 | BKR SGP | Javonte ATD, Lamb 7+ rec, Lemon 4+ rec, Goedert ATD, Flournoy 3+ rec | $8.52 | Lost |
| 740869210 | BKR SGP | Javonte 1st TD, Lamb ATD, Barkley rush 44–63, Spann-Ford 2+ rec, Dak 2+ pass TD | $5.00 | Lost |
| 740871157 | BKR 2-team | Under 44.5 + DAL −2.5 | $15.00 | Lost (total 59) |
| 46920838 | DKP 8-pick | Gary 0.5+ sack, Pickens 50+, Lemon 30+, Cooper/Barkley/Lamb ATD, Barkley 2+ rec, Spann-Ford 2+ rec | $5.00 | Lost |
| **46908050** | DKP 6-pick | Javonte ATD, Dak 1+ pass TD, McKee 1+ INT, Goedert 4+ rec, Barkley 2+ rec, DAL −2.5 | $9.99 | **Won, Paid $62.00** |
| 47012140 | DKP 5-pick | McKee 1+ INT, Dak 2+ pass TD, Pierce 20+ rush, Goedert ATD, Lamb ATD | $5.00 | Lost |
| 46998409 | DKP 5-pick | Pickens 5+ rec, Lemon 3+ rec, Ferguson ATD, Flournoy 30+, Aubrey 2+ FG | $9.97 | Lost |
| 46957964 | DKP 6-pick | Aubrey 2+ FG, Elliott 1+ FG, Ferguson 3+ rec, Baun 7+ T+A, Lemon 4+ rec, Javonte 40+ rush | $4.91 | Lost |

All 43 MNF legs are graded: 32 WON, 11 LOST. Some of the 8 tickets borrowed legs from §7k (Javonte ATD, Lamb 7+ rec, Barkley U63.5) or ideas from S2/S3 (46998409, 46957964). None is a §7k or §7l ticket as written.

**Paper Week 7:** 43 tickets in `data/official-picks/paper-wagers-2026.json`, card sections §3, §4, §5, §7h, §7i, §7j, §7k, §7l and §7e. Tracker grades:
- 5 cashed, 36 burnt, −$269.01. That includes the Master RR, −$70: its last combo needed Under 44 and the total was 59.
- Open: §7l **S1 Kickers' Game** and **S3 Defense**. Their legs are all `manual` grading (kicker fantasy points, longest FG, total TDs, tackles+assists, total sacks).

**Season context.** The cumulative season figures are in the project's `claude/recommendation-ledger-2026.md`; it was last stated through Week 6 and has no Week 7 entries yet. This briefing doesn't restate them.

## 4. Workstreams: state, how to run them, what's open

### 4.1 MNF island ladder (card §7k / §7l), done

- **§7k** (`reports/bets/2026-w07-card.md`, "## 7k. MNF DAL@PHI fresh island ladder (Mon 4:20 PM PT …)") follows the 7j format.
  - Prices: the BetOnline capture `data/generated/props/betonline-live-2026-10-26-week7.pregate.raw.txt` (3:32 PM). It's the first `EVENT|` block, read directly because the parser takes JSON, not raw text.
  - Bookmaker had no fresh capture (the latest was the weekend file `bookmaker-live-2026-10-25-cowboys-at-eagles.json`), so every leg is marked "BKR reprice needed".
  - Tickets: T1 +704 ($10), T2 +2,203 ($5), T3 +8,065 ($5). These are independent-leg estimates.
- **§7l** is every later in-session recommendation: T1 BKR rebuild +772, T3 shootout +11,921, S1 +1,825, S2 +1,862, S3 unpriced. Stakes for S1–S3 are $5, the Tier-2 band.
- **What Andy learned at BKR on 10/26** (record these as facts about BKR, not new rules):
  - BKR has **no Aubrey/kicker fantasy-points prop**.
  - BKR has **no Dallas team-FG total**. Its FG tab offers "1st to make a FG" and "score a FG in 2Q".
  - BKR quoted the 4-leg TD moonshot at +10,087, then +9,352.
- **Paper tracking:** `python3 scripts/paper_from_card.py --week 7 --date 2026-10-25 --section-date 7k=2026-10-26 --section-date 7l=2026-10-26`.
  - The script **rewrites the whole Week 7 paper set** from the card on every run. Use `--section-date` so earlier sections keep `2026-10-25`.
  - Changes made today in `scripts/paper_from_card.py`:
    - added sections `7k` and `7l`
    - added the `--section-date SEC=DATE` option
    - game sacks (`Total sacks, both teams …`) and `fantasy points` legs are now parsed and graded `manual`
- **Lesson for Week 8 islands:** price from a **fresh BKR capture**. Andy's browser runs `scripts/props/launch-bkr-browser.ps1` / `cron-bkr-scrape.mjs`; never log in. It's now on the scheduled cadence (§4.6), so a same-day 4:00 PM BKR capture should exist on Mon/Thu/Sun.

### 4.2 Logging placed tickets (how it was done today)

- **Master ledger:** `data/official-picks/user-placed-wagers-2026.json`. It's the only place real tickets live (CLAUDE.md).
- **Schema to follow:** today's `bet_20261026_*` entries.
  - BKR SGP legs: `price: null`, `price_source: "BKR SGP slip (no per-leg price shown)"`, `sgp_pair`.
  - DKP: `"N-Pick Combo Contract (Event Trading)"`.
  - Every ticket gets `rosters_checked`.
  - **"X+" thresholds:** line = X − 0.5, direction over. The tracker grades an over as `actual >= line`. **"0.5+ sacks" therefore means line 0.5, never 0.** That was the Gary bug.
- **Odds:** compute from the slip, decimal = payout / risk. Example: 46908050 is $62.00 / $9.99 = 6.2062, so +521.
- **Stub tickets are appended textually**, inserted before the final `]` of the file. The checkout often holds a float-only diff (`-15.0` vs `-15`) from other writers. When that diff is present, commit **only your appended entries**: build `HEAD` + appends in a temp file, `git hash-object -w`, then `git update-index --cacheinfo`. That keeps the float churn unstaged. Right now the file is clean against HEAD.
- **After a ledger change:**
  ```
  node scripts/generate-live-tracker.mjs --week <N>
  node scripts/generate-live-tracker-mobile.mjs --week <N>
  ```
  Then republish the phone page (§4.3). `node scripts/sync-placed-wagers-to-bankroll.mjs` (Supabase) is **needs-Andy every time**.

### 4.3 Live trackers

- **Desktop/browser tracker:** `public/live-tracker-sunday.html` plus `docs/tracked-wagers/live-tracker-sunday.html`, built by `scripts/generate-live-tracker.mjs`. Andy uses this one at home; tonight he said he doesn't need the phone ("road") tracker.
  - The hosted page builds from **main**. Pushes to the working branch don't reach it, so Andy opens a local file.
- **Phone tracker:** `public/live-tracker-mobile.html`, built by `scripts/generate-live-tracker-mobile.mjs`.
  - Published to Andy's **existing** private artifact https://claude.ai/artifact/Q7NBq3G5MLgzVzraUPsuiy. **Read it first, then publish with `url` set. Never create a new artifact.**
  - The scheduled Hedge Watch tasks also publish it. You'll often get "a newer version is live": verify that yours is a superset (same generator, built later), then republish.
  - `device_commit_files` and the stage cache key on filename. Copy to a unique name (for example `.ltm-HHMM.html`) and check `md5sum` on both sides.
- **Paper grading is render-time only.** The tracker shows 5 cashed, 36 burnt, −$269.01; the paper JSON stays PENDING.
- **Engineering internals** (Hedge Watch grid, grader coverage, settler rules) are in the morning H2C2 §4 and the digest §2.1–2.5.

### 4.4 Week 7 post-mortem (Codex lane; Claude reads it and adds the recommendation ledger)

- **Data pack:** `reports/analysis/week7-postmortem/`.
  - `w07-postmortem-data-2026-10-26.md` and `official-ticket-summary-2026-10-26.csv` hold real tickets only, pre-MNF (31 tickets).
  - `w07-football-stats-2026-10-26.md` plus 4 ESPN CSVs cover 13 games.
- **To include MNF,** rerun: `node scripts/analysis/week7-postmortem/compile-game-data.mjs`. The box score `data/fantasy/boxscores/espn-401873009.json` now exists.
- **Known data gap:** 47 PENDING and 2 OPEN leg rows remain on **settled** Sunday tickets (settled at ticket level). The post-mortem flags this. Don't "fix" leg rows without a source; report them.
- **Cross-week tickets:** BKR flex SGP 740512242 ($15) and teaser 740506458 ($30). The teaser's SF −1 leg was Week 6 MNF. The pack's sensitivity view only excludes the flex.

### 4.5 Recommendation ledger (Claude lane, open)

- **Canonical:** the claude.ai project doc `claude/recommendation-ledger-2026.md`. Its Week 6 entries end at D37. The repo mirror `docs/claude-project-dev/recommendation-ledger-2026.md` dates from 10/21.
- **Andy's rule (2026-10-20):** recommendations never contaminate placed-bet records. When they're real responses to recommendation tasks, they're tracked in the recommendation ledger for accuracy.
- **Week 7 entries to add:** card §3–§5, §7h, §7i, §7j, §7k, §7l, §7e and the SuperContest AI five vs official. Use the tracker grades from `week7-ticket-ledger.md`, plus manual grades for S1/S3 from the DAL@PHI box score.
- Note where Andy's real MNF tickets used card legs: Javonte ATD hit; Lamb 7+ receptions and Barkley U63.5 are in the box score.

### 4.6 Prop-scraper cadence (done; live)

- **Schedule file:** `scripts/props/prop-scrape-schedule.ps1`, a time table in Pacific local time:

  | Day | Times |
  |---|---|
  | Mon | 10:00, 13:00, 16:00 |
  | Tue | 13:00 |
  | Wed | 10:00, 14:00, 20:00 |
  | Thu | 10:00, 13:00, 16:00 |
  | Fri | 13:00 |
  | Sat | 10:00, 14:00, 20:00 |
  | Sun | 08:00, 12:00, 15:00, 16:00, 21:00 |

- **Registration scripts:** `scripts/props/register-{bkr,bol,dkp}-cron.ps1` load that table and register one weekly trigger per time of day, with no repetition.
- **Stagger:** `-OffsetMinutes` defaults to Bookmaker 0, BetOnline 10, DraftKings 20.
- **Unchanged:** task names, node actions, the 20-minute limit, the DKP overwrite lock (`-Overwrite`/`-Force`, exit 2 if the task exists), and the manual runs (`npm run props:bkr:cron`/`bkrp`, `props:bol:cron`/`bolp`, `props:dkp:cron`/`dkp`).
- **Live state** (read-only check at 20:16): `NFL_Bookmaker_SGP_Sync`, `NFL_BetOnline_Prop_Sync` and `NFL_DraftKings_Prediction_Sync` are all Ready, with 9 triggers, 19 runs a week and no repeats.
  - **Bookmaker and DraftKings tasks are new as of tonight.** Before, only BetOnline was scheduled, every 3 hours.
  - Bookmaker needs Andy's browser session from `launch-bkr-browser.ps1`, so expect some failed runs when it isn't open.
- **To change it later:** edit the table, then rerun the three register scripts. DKP needs `-Overwrite`.
- The `Props Auto Grade` GitHub workflow (`.github/workflows/props-auto-grade.yml`) is grading only (Supabase). It launches no scraper and was left alone.

### 4.7 Scheduled tasks (Claude cloud and Windows)

**Claude cloud** (all auto-approve; they don't settle or commit, except the one-shot check-in):

| Task | When (PT) |
|---|---|
| Hedge Watch: Mon/Thu early check | Mon/Thu 16:25 |
| Hedge Watch: night-game late check | Sun/Mon/Thu 17:02 |
| Hedge Watch: island-game halftime | Sun/Mon/Thu 18:45 |
| Hedge Watch: Sunday early check | Sun 09:25, 12:25, 16:25 |
| Hedge Watch: Sunday late check | Sun 09:50, 12:50 |
| Weekly NFL team-profile snapshot refresh | Tue about 08:00. No Supabase seed, no commit |
| Weekly SuperContest lines ingest | Thu about 08:00 |

The MNF one-shot "Mobile tracker: MNF final grading" fired at 20:46 and is finished. **No settle check-in exists for TNF (Thu 10/29).** Schedule one if Andy wants it, or grade by hand.

**Windows:**
- `NFL_Dashboard_Weekly_Archive`: **tonight 23:30**. It runs `scripts/archive/weekly-archive.mjs` and includes the Yahoo archive.
- `NFL_Dashboard_Yahoo_Survivor_Sync`: next run Tue 10:00. Andy is out of both survivor pools; this is research only.
- The three prop scrapers (§4.6).

### 4.8 Week 8 cadence (team-can-do)

- **Commands:** `node scripts/toolbox.mjs --cadence <tuesday|wednesday|wednesday-pm|thursday|friday|saturday|sunday|monday|prediction-markets>`. Follow `docs/NFL_WEEKLY_CARD_PROCESS.md`.
- **Standing deliverables** (Andy, stated in earlier windows; see the project memory and handoffs):
  - The Master Intel report on Saturday night, in the locked format. **Andy plans a separate client edition starting Week 8.**
  - The SuperContest Intelligence report. It's spread sides only and its format is locked; Andy and Amanda pick the official five together.
  - Confidence/pick'em pool recommendations (BUK BUK is straight-up).
  - Island ladders for TNF, SNF and MNF in the locked template.
  - The one-leg-per-game BEO prop stacks (`agents/dev/PROP_STACK_AGENT.md`).
- **Roster gate before anything is presented:**
  ```
  python3 scripts/nfl-rosters/roster_vet.py --week 8 --date <capture-date> --fetch --strict --card <file>
  ```

### 4.9 Yahoo Fantasy API (done; briefing sent to Codex)

- **What it is:** a script integration, `agents/lib/yahoo.js`, using OAuth2 and HTTPS GET only, with the Fantasy Sports **Read** permission. It's not an MCP server.
- **Credentials:** `.env` names are `YAHOO_CLIENT_ID`, `YAHOO_CLIENT_SECRET` and `YAHOO_REDIRECT_URI`. Tokens are in `.nfl/yahoo/tokens.json` (gitignored). **Never print values; never set `YAHOO_SCOPE`.**
- **Status:** working, with 5 leagues plus Pick'em and Survival. Coverage is listed in `docs/YAHOO_FANTASY_API_ACCESS_FOR_CODEX.md` §4.
- **Gaps:** individual Pick'em picks return 400, and the free-agent filter is untested.
- **Open:** confirm the client secret has been rotated (AUDIT-CX-014).

## 5. Rules and decisions: confirmed vs proposals

**Confirmed by Andy** (sources in brackets):
1. **Betting rules** are only `WEEKLY_SYNTHESIS_SESSION_PROMPT.md` §7.2 plus §5 rules 1–7 [repo; restated in the morning H2C2 §5].
   - Leg barrier −350; flag more than two legs shorter than −200.
   - QB INT props need a stated matchup fit, and **BKR SGPs don't take INT legs**.
   - BKR props are same-game only; multi-game stacks go to BetOnline.
   - No −120 to −100 connectors (rule 1). Lean on tackles+assists and pass TDs; keep sacks and receiving yards minimal (rule 3).
   - Each starting QB is one shared risk (rule 4).
   - Receptions only for proven target share on the expected winner (rule 6).
2. **Island template** [Andy, locked 2026-09-15, project memory; restated on the card §7j/§7k]:
   - Tier 1: $10, +600 to +1000.
   - Tier 2: $5, +1800 to +3000.
   - Tier 3: $5, +6500 to +20000.
   - Leg count is whatever hits the band.
   - T1 and T2 use distinct legs and players; T3 may reuse (10/22).
   - Diversify prop types across rushing, receiving, QB, TD, kicking and IDP; Andy rejected all-receiving stacks twice (10/25).
   - **BKR blocks a QB's completions leg alongside his own receivers' receptions legs** (10/19).
3. **Units:** $10 for parlays and RRs, $20 for singles [10/24].
4. **Paper never contaminates placed records.** Recommendations go to the recommendation ledger for accuracy [10/20].
5. **Hedge alerts are a tracker banner only**, run before each window plus island halftime. Agents never place bets [10/25].
6. **The prop-scraper cadence in §4.6** is Andy's exact weekly schedule, with a 10-minute stagger [Andy, 10/26 19:59 and 20:03].
7. **Roster facts** come from `data/nfl-rosters/espn-full-rosters-latest.json` (refresh it when it's more than 24 hours old) plus live inactives searches. Never from memory [CLAUDE.md ROSTER GATE]. When a player is missing from the ESPN rosters, web-search him first [Andy preference].
8. **Every file must be viewable in-session; copy-paste text goes inline in a code block** [Andy preference]. That includes resume prompts. Print the resume prompt in the chat in the same reply as the handoff.

**Proposals, not adopted:**
- The S1–S3 $5 stakes and the T3 shootout are Claude's proposals. Andy built his own DK tickets instead (46998409 and 46957964 resemble S2/S3).
- Codex's canonical ledger number format awaits Andy, so don't reformat the ledger.
- The Yahoo stdio MCP wrapper (`scripts/mcp/yahoo-fantasy-mcp.mjs`) does not exist; it's only a design.
- The `HEDGE_DEFAULTS` thresholds are engineering defaults, not betting rules.

## 6. Open items

**6a. Time-sensitive**
1. **Before Thu 10/29 13:00 PT:** run `node scripts/generate-live-tracker-mobile.mjs` with no `--week` and confirm the log says Week 8. Hedge Watch fires at 16:25 Thursday.
2. **Tue to Thu:** the Week 8 cadence (§4.8). TNF CAR @ GB is the first island; build its ladder Thursday from a **same-day BKR capture** (scheduled at Thu 16:00).
3. **Tonight 23:30:** the Weekly Archive runs. If it fails, check `logs/weekly-archive.log` Tuesday.

**6b. Team can do**
1. Grade §7l S1 and S3 from `data/fantasy/boxscores/espn-401873009.json`. **Report only; don't write the paper JSON.**
2. Add Week 7 recommendation-ledger entries (D38 onward) to the project doc `claude/recommendation-ledger-2026.md`, and mirror them to `docs/claude-project-dev/recommendation-ledger-2026.md`.
3. Ask Codex, or run it yourself, to rerun `compile-game-data.mjs` so the post-mortem includes MNF.
4. Fix the stale card header and the §10 self-check in `reports/bets/2026-w07-card.md` ("Saturday review card", "no commit or push taken"), or leave them as history and note it.

**6c. Needs Andy**
1. **Bankroll sync** (Supabase) for the Week 7 settlements: `node scripts/sync-placed-wagers-to-bankroll.mjs`. Not run, not authorized.
2. **TNF settle check-in:** does he want a one-shot scheduled task like the MNF one?
3. **Yahoo client-secret rotation** (AUDIT-CX-014) before Codex uses Yahoo.
4. **Paper write-back** to `paper-wagers-2026.json` (results stored), or keep render-time grading plus the recommendation ledger only.
5. **Ledger number format** (Codex proposal, `reports/verification/2026-10-26-ledger-number-format-churn.md`).
6. Carried over: the Week 8 client edition of the Master report; the BEO prop parser gaps (only 3 games parsed, IDP/QB-pressure unpriced).

**6d. Backlog**
- Hedge-model recalibration on multi-season data.
- Weeks 5–7 grader parity, which stalled on ESPN DNS in Codex's shell.
- Hedge Watch coverage for 1:05/1:25 PM, Saturday and international windows.
- A desktop "hedge spot" badge.
- `scripts/props/betonline-live-parser.mjs` takes `--in <raw-board.json>`, not the raw `.txt` capture. A txt → board adapter would save the manual read.

## 7. Guardrails and git procedure (binding)

- **Never place bets or enter credentials.** Sportsbooks are read-only, and BetOnline is blocked in Chrome; use only Andy's capture files. No TheOddsAPI. No Supabase writes, including bankroll sync and `game_odds_snapshots`, without Andy's per-action OK.
- **Ledgers change only to record what Andy reports or what ESPN finals settle.** Paper never goes into the placed ledger.
- **Artifact:** read first, then publish to the same URL. Never create a new artifact.
- **Repo:** `E:\dev\projects\NFL_Dashboard`. In `device_bash` it's `$HOME/mnt/dev/projects/NFL_Dashboard`. Edit files in place there.
- **The checkout is shared and dirty (900+ entries).** Stage **named files only**.
  - Never `git add -A`, reset, clean, stash, or pull over local work.
  - Leave alone: other teams' dirty files (`agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`, `docs/ANTI_PATTERNS.md`, `scripts/props/bookmaker-sgp-dump-parse.mjs`, survivor/availability/shadow-harness data) and generated `public/live-tracker-sunday.html` / `docs/tracked-wagers/*` when you didn't regenerate them.
- **Commits go through Windows git** (Desktop Commander `start_process`, PowerShell), with a message file written from `device_bash`, because PowerShell eats `$`:
  ```
  cd E:\dev\projects\NFL_Dashboard; git -c core.fsmonitor=false add -- <named files>; git -c core.fsmonitor=false diff --cached --stat; git -c core.fsmonitor=false commit -F .git-msg-x.txt; git -c core.fsmonitor=false push origin claude/w5-prop-cards-2026-10-11; Remove-Item .git-msg-x.txt
  ```
  - Push to the **working branch**, not main.
  - Always use `git -c core.fsmonitor=false`. A full `git status` can take minutes, so scope it to paths.
  - Deleting is blocked in the device VM; Windows `Remove-Item` works.
- **Don't modify live Windows Scheduled Tasks.** Generate commands for Andy to run, then verify read-only. That's what Andy asked for tonight.

## 8. Corrections to older docs

1. **`HANDOFF.md` and every Codex doc say "DAL @ PHI pending".** Wrong now: the game finished 38–21, it's settled (`7ab6fb0`) and the box score is on disk.
2. **Morning H2C2 TL;DR "no real tickets ride on MNF" / "only the Master RR open".** True at 07:45. By 17:19 Andy had placed 8 MNF tickets, now settled, and paper grew to 43 tickets.
3. **Card preliminary Monday ladder.** Superseded by §7k, which is marked in the card. The prelim T2's Dak completions + DAL receptions combination is blocked at BKR.
4. **Card §7k T1 "Dallas team field goals Over 1.5".** BKR doesn't offer it. §7l T1 rebuild uses "Dallas first to make a FG" (−131, Saturday price).
5. **Card §7k T3 / §7l "Aubrey fantasy points".** Not offered at BKR (Andy, 16:19); DK lists FGs made.
6. **Yahoo "still blocked" (project memory note from 2026-09-03).** Stale; access works. Older notes count 4 fantasy leagues, but the API shows 5.
7. **Prop-scraper docs saying "every 3 hours".** Replaced by §4.6 (`docs/specs/BETONLINE_PROP_CAPTURE_AND_REFRESH_SPEC.md` is updated).
8. **The 8:45 PM check-in prompt asked to grade paper "in paper-wagers-2026.json".** It didn't write that file (the commit touched only the wagers ledger and the trackers). That's correct under the paper rule.
9. **Recommendation ledger:** the project doc is canonical, and the repo mirror (10/21) is older. Treat the morning H2C2's note about mirrors as still true.

## 9. Resume prompt for Claude Team 2

```
Resume Platinum Rose NFL (Andy's NFL_Dashboard) as Claude Team 2. Repo: E:\dev\projects\NFL_Dashboard on Andy's Windows PC
(device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Branch claude/w5-prop-cards-2026-10-11 (push here, not main).
HEAD at handoff: the H2C2 commits on top of 0493dfd (briefing updated Tue 07:19 PT with the Tuesday cadence, section 0a). Week 7 fully settled (39 real tickets, -$234.99). Week 8: the Tuesday cadence already ran Tue 10/27 07:18 PT (do NOT rerun);
next is `node scripts/toolbox.mjs --cadence wednesday`. TNF CAR @ GB Thu 10/29 (opened GB -3.5, 47.5).

Read, in order:
1. handoffs/2026-10-26-2215-claude-h2c2-claude2-briefing-w7-mnf-close.md  (this briefing; sections 0, 0a, 6, 7 first)
2. reports/handoff-snapshots/2026-10-26-h2c2-w7-mnf-close-claude2/week7-ticket-ledger.md
3. CLAUDE.md (roster gate, wager single source of truth) and agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md section 7.2 + section 5 rules 1-7 (the only betting rules)
4. docs/MOBILE_LIVE_TRACKER.md, then reports/bets/2026-w07-card.md sections 7j/7k/7l (island format)

Git: run `git -c core.fsmonitor=false log --oneline -5` and `git -c core.fsmonitor=false branch --show-current`; live git wins
over any doc. Stage named files only; commit via Windows git with a message file; never add -A/reset/clean/stash/pull.

Guardrails: never place bets, log in, or enter credentials; no TheOddsAPI; no Supabase (including bankroll sync) without Andy's
per-action OK; ledgers change only to record what Andy reports or ESPN finals settle; paper never enters the placed ledger;
phone tracker republishes only to https://claude.ai/artifact/Q7NBq3G5MLgzVzraUPsuiy (read first, never a new artifact);
don't modify live Windows Scheduled Tasks (give Andy the command, verify read-only). Never print Yahoo .env values or tokens.
Every file you make must be viewable in-session; put copy-paste text (prompts, messages) inline in a code block.

First actions:
0. Review and commit (named files only) the 8 uncommitted Tuesday-cadence outputs listed in briefing section 0a. TB needs a manual
   all-position depth chart (the only team flagged). Web-search any player the roster audit could not find before using him.
1. Grade card 7l S1 and S3 (paper, still open) from data/fantasy/boxscores/espn-401873009.json; report only.
2. Add Week 7 entries (D38+) to the claude.ai project doc claude/recommendation-ledger-2026.md; mirror to
   docs/claude-project-dev/recommendation-ledger-2026.md.
3. Before Thu 13:00 PT: run `node scripts/generate-live-tracker-mobile.mjs` (no --week) and confirm Week 8 is detected.
4. Ask Andy the needs-Andy list in briefing section 6c (bankroll sync, TNF settle check-in, Yahoo secret rotation, paper write-back).
5. Continue the Week 8 cadence from wednesday (node scripts/toolbox.mjs --cadence wednesday, then wednesday-pm, thursday, ...) per
   docs/NFL_WEEKLY_CARD_PROCESS.md. TheOddsAPI is called only by Andy's own cadence runs (364 credits left), never ad hoc; roster gate
   (python3 scripts/nfl-rosters/roster_vet.py --week 8 --date <capture-date> --fetch --strict --card <file>) before anything is presented.
When Andy places tickets, log them to data/official-picks/user-placed-wagers-2026.json per briefing section 4.2 ("X+" means line X-0.5),
regenerate both trackers, republish the phone page if he wants it, commit named files and push.
```
