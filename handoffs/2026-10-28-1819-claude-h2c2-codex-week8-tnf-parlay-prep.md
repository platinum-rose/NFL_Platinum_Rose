# H2C2 briefing: Week 8 TNF parlay + lottery prep. Wed 10/28 6:19 PM PT, Claude Team 2 → Codex

Andy is handing this lane to **Codex** to use Codex tokens heavily. Pick up cold from this file. Live Git and live files win over anything here.

- **Repo / branch:** `E:\dev\projects\NFL_Dashboard`, `claude/w5-prop-cards-2026-10-11`, HEAD `71c6b4f` at writing. Claude made **no commits** this session. The files listed in §5 are uncommitted, new and local.
- **Prior briefings:** `handoffs/2026-10-27-1735-claude-h2c2-codex-week8-wednesday.md` and `handoffs/2026-10-28-0022-codex-tracker-engineering.md`. Their open engineering items still stand: the secret-scan hook, the Live Tracker O/U settlement, and the schedule-ingest test.
- **TNF:** CAR @ GB, **Thu 10/29 5:15 PM PT**.

---

## 0. TL;DR: what Andy wants next

1. **TNF parlays (CAR @ GB)** built from the three-book prop comparison (§3) and the intel (§4).
2. A **pre-weekend lottery ticket parlay** (long-odds, mostly TD scorers and alternate lines) for Sunday/Monday.
3. Before either: finish the intel gaps in §2.

## 1. Data state (as of 6:19 PM PT Wed)

| Input | State | Notes |
|---|---|---|
| Wednesday cadence (podcast sweep, articles, Twitter) | ✅ 9:00 AM PT, exit 0 | |
| Wednesday PM cadence | ⚠️ 3:00 PM PT, exit 1 | Only the alpha packet failed: Friday inputs are week 7. Expected. Report: `logs/cadence-reports/2026-w08-wednesday-pm.md` |
| Player availability | ✅ latest 10/28 23:28Z | Hourly job. Wed practice reports in; Thu reports not yet |
| Projected starters | ✅ 10/28 22:00Z | No role flips vs Tue. BAL, PHI and NYG each list two QBs as "starter" (data issue) |
| Roster gate | ✅ PASS 10/28 23:23Z | `data/generated/master-intel/w08-roster-vet.json`. Card file `reports/bets/2026-w08-card.md` does not exist yet |
| Prediction markets + coherence | ✅ 10/28 22:00Z | One flag: MIA division 5% > playoff 2% |
| BKR game lines | ✅ Andy paste ~4:38 PM | `data/odds/BKR_game_lines_1028_1638.md` (with BOL comparison) |
| BKR SGP / props | ✅ 10/29 00:26Z | `data/generated/props/bookmaker-live-2026-10-29-week8.json`. TNF 562 rows. Sunday games: game, quarter and team lines only |
| BOL props | ✅ 10/29 00:09Z | `betonline-live-2026-10-29-week8.json`. TNF player props only (13 players) |
| DK Predictions | ✅ 10/29 00:12Z | `draftkings-predictions-live-2026-10-28-week8.json`. 285 players, ATD / first TD / 2+ TD for all 14 games. **Overwrote** the 21:20Z capture (same filename), so no diff is possible |
| Player props intel / SGP cards | ❌ 10/24 (week 7) | Rebuilt by the **Thursday** cadence |
| Secondary matchups | ❌ week 7 | Friday cadence |
| Alpha data packet | ❌ 10/24 (week 7) | Friday cadence |
| Starter impact digest | ❌ 10/22 | `scripts/build-availability-impact-digest.js`; no cadence runs it |
| FTN Stats IQ | ✅ promoted 10/28 8:13 AM PT | 36 tables / 4,674 rows through W7 incl. MNF. **No analysis has consumed it yet** |
| Team profiles | ✅ 10/28 23:29Z through W7 | Built from ESPN/nflverse team stats, not FTN |

## 2. To do, in order

1. **Thursday cadence** (Andy runs it, or Codex with Andy's OK): `node scripts/toolbox.mjs --cadence thursday` runs three steps:
   - availability (Thu practice reports, final TNF designations; **watch Golden**);
   - `sync-live-market-lines.mjs` (default mode reads Supabase `game_odds_snapshots`, 0 TheOddsAPI credits; **never pass `--live`** without OK);
   - `build-player-props-intel.js` (TNF props intel / SGP cards).
2. **TNF FTN matchup read** (free, local). From `data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json`, pull CAR vs GB:
   - team offense and defense;
   - pass rush vs pass protection, coverage, rush defense;
   - receiving tables for McMillan, Coker, Waller, Golden, Watson, Kraft, Jacobs and Hubbard usage.

   Cross it against §3.
3. **TNF podcasts.** Transcribe and extract picks from **Ross Tucker "2026 NFL Week 8 PICKS!"** and **Sharp or Square "Week 8 Betting Spotlight: CAR-GB, MIN-DET"** (in `data/podcasts/youtube-discovery-candidates-2026.json`, `mapping_status: unmapped`). BettingPros "Early Best Bets & Survivor" is optional. This is the Gemini path, so it is **paid: needs Andy's OK.** No Week 8 extracted-picks file exists yet (last: `youtube-extracted-picks-2026-w07.json`).
4. **Draft the TNF parlay card.** Every player named must pass the roster gate, and the card goes in `reports/bets/2026-w08-card.md` so the vet checks it. Keep it a proposal; Andy places bets.
5. **Lottery parlay (Fri/Sat).** Run the Friday cadence (secondary matchups, props intel, FTN context, prediction markets, alpha packet), then fresh BKR, BOL and DKP captures once Sunday player props post. DKP ATD/2+ TD already covers all 14 games (thin: LV@NYJ 15 TD rows, PHI@WAS 36). Leave Ronnie Rivers out (listed out/IR/doubtful but priced). Hold Kenny Gainwell (Wed DNP).
6. **Small engineering:**
   - DKP pipeline overwrites same-day captures; add a time to the filename.
   - BKR posts two prices per main line (likely straight vs SGP grid); confirm which is which in the parser.

## 3. TNF three-book prop comparison

Full table: `data/odds/TNF_w08_prop_shop_1028_1730.md`. Headlines:

- **Line gaps:**
  - Kraft rec yds: Over 42.5 at BOL (-130), Under 46.5 at BKR (-101).
  - Bryce Young pass yds: Over 250.5 at BOL, Under 256.5 at BKR.
  - Golden rec yds: Over 59.5 at BKR, Under 62.5 at BOL.
  - Watson rec yds: Over 68.5 at BOL, Under 71.5 at BKR.
  - Coker, Waller and Jacobs rec yds: 2-yd gaps (BOL lower).
- **BKR price edges:**
  - Young o1.5 pass TD +103.
  - Love u21.5 completions +109.
  - Jacobs u2.5 rec +100.
  - Waller o2.5 rec +126; Hubbard o2.5 rec +116.
- **ATD, best sportsbook:**
  - Jacobs -145 (BOL), Hubbard -115 (BKR).
  - Kraft +170, McMillan +180, Coker +190 (all BKR).
  - Watson +125 and Golden +160 (both BOL).
  - DKP (pre-fee) is longer on depth names: Jonnu Smith +809 vs BKR +545.
- **Game lines:**
  - BKR and BOL: GB -3.5, total 47, GB ML -194/-205 (moved toward GB at BOL).
  - DKP: total 48.5 (Under -122).
- **BOL moves 21:10Z → 00:09Z:** Hubbard rush 69.5 → 67.5 (Under juiced), Jacobs ATD -160 → -145, Kraft ATD +160 new.

## 4. Intel already in hand (Week 8)

- **Articles** (`docs/article-intel-review/article-intel-review-latest.md`, 143 records, 11 usable picks, 0 Tier 1):
  - Zachary Cohen: CAR +4 (1.5u; market now +3.5), CAR ML +170 (0.5u), Hubbard ATD lean -120.
  - Steve Krebs parlay legs: CAR-GB o39.5, LAR ML, NE ML, DET TT u31, TEN-CIN u47.
  - Jason Radowitz: DET -3, LAR -6.5.
- **Twitter:** 30 bookmarks ingested 10/28, **0 concrete picks**.
- **Expert dossiers / picks registry:** still week 7 (10/22–23).
- **Injuries that touch TNF:**
  - Golden (GB WR): questionable; DNP / DNP / limited.
  - Coker (CAR WR): limited / full / full.
  - CAR out: Jaelan Phillips, Akayleb Evans, G Damien Lewis, G Torricelli Simpkins.
  - GB out: Zaire Franklin, Sean Rhyan (high ankle), OT Travis Glover.

## 5. Uncommitted files from this session (all local)

- `logs/cadence-reports/2026-w08-wednesday-pm.md` (logs/ is gitignored)
- `data/odds/BKR_game_lines_1028_1638.md`
- `data/odds/TNF_w08_prop_shop_1028_1730.md`
- this handoff

Andy's own captures (BOL, DKP, BKR props) were written by his pipelines. Commit them in scoped batches if they belong in Git; check `.gitignore` and earlier weeks' practice first.

## 6. Andy's fantasy lineup flags (sent in the Wed PM report)

- RFI: starting DEF is **Texans (bye)**.
- The League: **no kicker** (Szmyt is available).
- Golden starts in Honey Badgers and Rose Bowl; Chase (DNP Wed) in Honey Badgers and Rose Bowl.

Re-check after Thursday's practice report.

## 7. Guardrails (unchanged)

- No wagers or sportsbook/pool actions.
- No Supabase writes (a live `schedule-ingest.js` counts).
- No TheOddsAPI calls beyond the cadence defaults (no `--live`).
- No paid model calls (incl. Gemini podcast transcription).
- No ledger or Futures Portfolio edits.
- All of the above need Andy's explicit per-action OK.
- Keep real, paper, proposal and futures records separate.
- Commit in scoped batches, never `git add -A`; always `git -c core.fsmonitor=false`; no reset, clean or stash.
- Roster gate must pass before any player-named output.

## 8. Resume prompt

> Resume NFL_Dashboard (`E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`). Read `handoffs/2026-10-28-1819-claude-h2c2-codex-week8-tnf-parlay-prep.md`, then `AGENTS.md` and `CLAUDE.md`. Reconcile live Git. Week 8 TNF is CAR @ GB Thu 5:15 PM PT. Do §2 in order:
> 1. Confirm whether Andy has run the Thursday cadence; if not, ask him.
> 2. Do the free FTN CAR/GB matchup read.
> 3. Ask Andy before any paid podcast transcription.
> 4. Draft the TNF parlay proposals in `reports/bets/2026-w08-card.md` and run `npm run roster:vet -- --week 8 --date <date> --fetch --strict`.
>
> No wagers, Supabase writes, `--live` odds calls, paid model calls or ledger edits without Andy's per-action OK.

---

## 9. Addendum, 7:40 PM PT: Circa conference futures (after the handoff above)

- **New data:** `data/futures-imports/circa-2026-10-28.json`, 32 rows of NFC + AFC conference-winner prices. Manual transcription of Circa app screenshots taken 7:18–7:20 PM PT; same schema as `circa-2026-10-16.json`.
- **Comparison:** `data/odds/circa_conference_futures_1028_1918.md` sets Circa 10/28 against Circa 10/16 and BOL 10/27, with the better price per team.
- **Screenshots:** moved to `docs/Futures_Odds/_processed/Circa_2026-10-28/`. The older `docs/Screenshots/*` files were moved to `docs/Screenshots/_archive/` (nothing deleted). The Oct 16 Circa screenshots are still loose in `docs/Futures_Odds/`.
- **Key moves since Circa 10/16:**
  - GB +3000 → +1900; BUF +360 → +300; PHI +3500 → +12500; SF +310 → +255.
  - LAR +370 → +650; DET +1100 → +800; BAL +450 → +700.
  - IND +5000 → +14000; LAC +12000 → +25000; CLE +12000 → +6000.
- **Circa beats BOL on:** ATL +3500, CAR +3500, HOU +2300, PIT +3500, IND +14000.
- **Portfolio:** GB and BUF shortening helps Andy's GB-vs-AFC and NFC-vs-BUF Super Bowl matchup tickets. PHI's collapse hurts PHI–BUF.
- **Codex asks:**
  1. Spot-check the JSON against the screenshots (the 1000006649 and 6653 shots are low-res).
  2. Add an import-manifest entry if that's the convention.
  3. Add Circa to the futures comparison against BOL and Kalshi/Polymarket.
  4. Make one scoped commit.

## 10. Save status

Nothing from this session is committed. Uncommitted local files:
- the cadence report (gitignored `logs/`);
- the two TNF odds files in `data/odds/`;
- the Circa JSON and comparison;
- this handoff.

The same handoff is mirrored in the DEV project (`claude/handoff-2026-10-28-h2c2-codex-START-HERE-week8-tnf-parlay-prep.md`).
