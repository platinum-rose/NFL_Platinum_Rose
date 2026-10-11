# Week 5 per-game synthesis — results and review notes (2026-10-10 night)

Written by Claude Team 1, Sat 2026-10-10 ~23:05 PT, for Claude Team 2 (Sunday cards). Outputs live next to this file (`reports/intel/games/2026-w05-<model>-<GK>.md`) and in `data/research-intel/proposed/games/2026-w05-<model>-<GK>.json`.

**Status of every number below: research/proposed only.** All outputs were written against Saturday-night captures: BKR 2026-10-11T01:15:40Z (recommendation window ended 00:15 PT Sun) and BEO 03:15:09Z (window ended 02:15 PT; PHI@JAX 00:30 PT). **None is a live price.** Nothing here is a ticket, recommendation-ledger entry or authorization to wager.

## 1. Results table (18 outputs; validator 0 fail / 0 warn on all — see `reports/handoff-snapshots/2026-10-10-h2c2-week5-sunday/validation-summary.txt`)

Edge numbers are each model's *hypothesis* (default 0.0); simulator probabilities in the JSONs are conditional on that hypothesis, not calibrated edges. Astra MIN@NO (4a42100) and BAL@ATL (d36f3f7) were run on older packets — their opponent-record text is stale (see §3).

| Model | Game | Kickoff | Disposition | Tier | Side | Total lean | Edge (home margin / total, pts) | BKR home line / total | HEAD |
|---|---|---|---|---|---|---|---|---|---|
| opus | PHI@JAX | Sun 06:30 PT | pass | skip | — | — | 0.5 / -0.5 | -7.5 / 42 | 7ebef66 |
| opus | CHI@GB | Sun 10:00 PT | pass | skip | — | — | -0.5 / -0.5 | 1.5 / 46 | 7ebef66 |
| opus | HOU@TEN | Sun 10:00 PT | price moved | skip | — | — | 0.0 / 0.0 | 7 / 37.5 | 7ebef66 |
| opus | CIN@MIA | Sun 10:00 PT | pass | research_only | — | — | 0.5 / 0.0 | 7 / 43.5 | 7ebef66 |
| opus | LV@NE | Sun 10:00 PT | conflicted | skip | — | Over | -0.5 / 0.5 | -3.5 / 45 | 7ebef66 |
| opus | MIN@NO | Sun 10:00 PT | conflicted | research_only | — | — | 0.0 / 0.0 | 2.5 / 41.5 | 7ebef66 |
| opus | CLE@NYJ | Sun 10:00 PT | conflicted | research_only | — | Under | 0.0 / -0.5 | -2.5 / 39.5 | 7ebef66 |
| opus | IND@PIT | Sun 10:00 PT | price moved | 2- | — | Under | 0.0 / -1.0 | -3 / 43.5 | 7ebef66 |
| opus | NYG@WAS | Sun 10:00 PT | pass | skip | — | — | -1.0 / 0.0 | -3.5 / 41.5 | 7ebef66 |
| opus | DEN@LAC | Sun 13:05 PT | pass | research_only | — | — | 0.0 / 0.0 | 3.5 / 42 | 7ebef66 |
| opus | DET@ARI | Sun 13:25 PT | pass | research_only | — | — | 0.0 / 0.0 | 5.5 / 54.5 | 7ebef66 |
| opus | SF@SEA | Sun 13:25 PT | pass | skip | — | — | 0.0 / 0.0 | -3 / 46.5 | 7ebef66 |
| opus | BAL@ATL | Sun 17:20 PT | price moved | research_only | — | — | 0.0 / 0.0 | -3 / 44 | 7ebef66 |
| opus | BUF@LAR | Mon 17:15 PT | pass | skip | — | — | 0.0 / 0.0 | -3.5 / 54.5 | 7ebef66 |
| astra | CHI@GB | Sun 10:00 PT | pass | research_only | — | Under | 0.0 / -1.0 | 1.5 / 46 | 7ebef66 |
| astra | MIN@NO | Sun 10:00 PT | conflicted | research_only | — | — | 0.0 / 0.0 | 2.5 / 41.5 | 4a42100 |
| astra | CLE@NYJ | Sun 10:00 PT | conflicted | research_only | — | Under | 0.0 / -1.0 | -2.5 / 39.5 | 7ebef66 |
| astra | BAL@ATL | Sun 17:20 PT | pass | research_only | — | — | 0 / 0 | -3 / 44 | d36f3f7 |

**Only output above research_only/skip:** Opus IND@PIT, `price moved / 2-`, Under 43.5, weather-only (forecast gusts 58 km/h). Its single tier-eligible total source (ESPN, rows[390]) took Under **44.5**, a point higher than the current 43.5. Both Astra runs with the same weather-only −1 Under (CLE@NYJ, CHI@GB) chose research_only. **Recommendation: treat IND@PIT as research_only until Sunday's fresh forecast and lines** (Andy's decision).

## 2. Number review against the packets — corrections

Method: every number in each report/JSON checked against its game packet, the weather file, nflverse weekly stats, source rows (`data/generated/master-intel/w05-expert-verified.json`) and reruns of `scripts/intel/margin-simulator.mjs`. Only real errors listed; **none changes a disposition.**

**Clean:** Astra CLE@NYJ, Astra CHI@GB, Opus NYG@WAS, Opus MIN@NO.

| Output | Report says | Source says |
|---|---|---|
| Opus IND@PIT | "simulator puts an exact 3-point margin at 15.6%" (value of the half point) | That is the two-sided `exact_margin_pct.m3`. PIT winning by exactly 3 (push on −3) = `side_push` **8.27%** |
| Opus IND@PIT | Alec Pierce "in ESPN's IR/Out roster group" listed with the ESPN injury report | Not on the ESPN injury report; he is in the ESPN roster `injuredReserveOrOut` group (status day-to-day) and the older availability digest |
| Opus DEN@LAC | exact 3 = 15.1% → +3.5 vs +3 | Two-sided m3; DEN by exactly 3 = `side_push` **8.27%** at home line 3 |
| Opus DEN@LAC | Nix "explosive rate 6.9%" (passing) | 6.9% is team-offense **efficiency** EXP% (all plays); passing-analytics EXP% = **12.3%** |
| Opus BUF@LAR | exact 3 = 15.1% | Two-sided m3; LAR by exactly 3 = `side_push` **8.27%** |
| Opus BAL@ATL | exact 3-point ATL win 15.6% | Two-sided m3; ATL by exactly 3 = **8.27%** |
| Opus BAL@ATL | "Both books sit on 3" | BEO is ATL −3.5 +100 / BAL +3.5 −120 |
| Opus BAL@ATL | "the line moved after Jackson was ruled out" | No pre-news line in the packet; only post-news snapshot is Action Network −3.5 (Fri 19:41Z) and BKR is now −3 (movement toward BAL). Unsupported. |
| Opus BAL@ATL | "Cooper Rush and Jack Strand started weeks 1–2" | nflverse: Rush passed in both weeks (22 att wk1, 17 wk2); Strand only wk2 (15 att) |
| Opus CHI@GB | "a Chicago win keeps the Bears second in the NFC order" | Packet NFC order: SF, MIN, **CHI 3rd** (2nd only in NFC North) |
| Opus CHI@GB | Love "30–53 attempts per game" | nflverse 42/29/53/30 → 29–53 |
| Opus CHI@GB | GB "passes on 68.9% of dropbacks" | FTN tendencies DPBK% 68.9% = share of plays that are dropbacks |
| Opus CHI@GB, Opus MIN@NO | prop `captured_at` = 01:15:40.538Z | That is the BKR file-level time; prop rows are 01:17:42.866Z (CHI@GB) / 01:15:59.856Z (MIN@NO). Lines/prices correct. |
| Opus CLE@NYJ | Jets "+0.137 EPA per dropback" when clean | 0.137 is overall passing-analytics EPA/DB; clean-pocket = pass-protection EPA/DB__2 **+0.356** |
| Opus PHI@JAX | "BKR prop capture 2026-10-10T22:25Z is >6 h old, so no props" | Run read the superseded 10-10 file; `data/generated/props/bookmaker-live-2026-10-11-week5.json` has **449** PHI@JAX prop rows at 01:15:40Z (inside the window) |
| Opus CIN@MIA | "BKR has no Burrow, Chase or Higgins props" | BKR has `first_td` rows for all three (no yardage/receptions/ATD) |
| Opus HOU@TEN | loser "three games behind Jacksonville" | JAX is 3-1 → an 0-5 team is 3.5 back |
| Opus LV@NE | quant +0.85 vs market −3.5 = "4.3 points toward LV" | Sign error: NE by 0.85 vs NE by 3.5 = **2.65** toward LV |
| Opus DET@ARI | ARI +4.5 rows downgraded "a full point off" incl. rows[337] (Wormeli) | rows[337] line field 4.5 contradicts its quote "Cardinals plus the five and a half" (current number) — source-row extraction error |
| Opus SF@SEA | ESPN Under 49 (rows[393]) "2.5 points off" | rows[393] line 49.0 contradicts its selection "UNDER 45.5 (-105)" (1 pt off) — extraction error |
| Opus SF@SEA | Jadarian Price IR, tagged to the ESPN injury report | Not on the ESPN list (SEA IR: Neal, Charles); from the availability digest only |
| Astra MIN@NO (4a42100) | MIN opponents 5-11; BEO ML −140/+120, BEO expiry 00:19:56 PT; omits NO Outs | Current packet: 6-11; BEO −135/+115 (03:15Z capture), expiry 02:15 PT; NO Out: Elliss, Jennings, Wright |
| Astra BAL@ATL (d36f3f7) | BAL opponents 5-11 | Current packet 5-12 (TB@DAL final added) |

**Recurring patterns to fix in `prompts/2026-w05-game-synthesis.md` before Sunday reruns:**
1. Key-number value = `side_push` at the key line, never the two-sided `exact_margin_pct.m3`.
2. Name the FTN table *and* metric; `EPA/DB__2` / `SUCC%__2` in pass-protection are the clean-pocket splits; tendencies `DPBK%` is share of plays.
3. Attribute availability to its actual source (ESPN injury report vs ESPN roster group vs availability digest).
4. Props: use the newest `data/generated/props/{bookmaker,betonline}-live-2026-10-*-week5.json` and the row-level timestamp.

## 3. Packet / pipeline gaps (not model errors)

- **ESPN availability incomplete** — 221 players in ESPN's roster `injuredReserveOrOut` group are missing from every packet's AVAILABILITY (full list: `reports/intel/games/2026-w05-espn-roster-ir-out-gap.md`; e.g. Achane MIA, Conner ARI, Etienne NO, Kerby Joseph DET, Jayden Reed GB, Landry NE, Brian Burns NYG, Dickerson PHI, A.J. Terrell ATL, Njoku LAC, Christian Kirk SF). Fix `scripts/intel/fetch-espn-status.py` + builder to add a labelled "ESPN roster IR/Out group (unconfirmed)" category; do not mark them Out.
- **Self-contradicting source rows:** DET@ARI rows[337], SF@SEA rows[393]; CLE@NYJ rows[160] is a season-long ATS projection tagged as a Week 5 CLE spread pick.
- NYG@WAS Action Network opener field malformed; DET@ARI FTN ARI PT/GM 20.3 vs packet PPG 21.8 (FTN likely a different game count); BKR LV@NE anytime-TD board still lists Reggie Gilliam (IR).
- No Action Network opener for any game → no line-movement claims possible.
- Venue table is static (PHI@JAX London only visible in source quotes).
- Validator checks BKR expiry only (and only for tier 2/2−), not BEO; word count is whole-file only; it does not verify narrative numbers (that is what §2 did by hand).

## 4. Versus Codex's review-only shortlist (`handoffs/2026-10-10-codex-week5-card-prep-and-prop-capture-handoff.md`)

Codex shortlist: LV +3.5, CHI −1.5, BUF +3 (`review` / `unpriced_thesis`); prop priorities Dulcich o25.5 rec yds, Judkins u59.5 rush yds.
- **LV +3.5:** Opus LV@NE = conflicted / skip. All three tier-eligible rows are one outlet (VSiN) and contradict each other on the side; Opus leans LV by only 0.5.
- **CHI −1.5:** Opus pass / skip (−0.5 toward CHI), Astra research_only. CHI QB is ambiguous (ESPN: Caleb Williams Questionable; operator-confirmed Bagent); GB's Micah Parsons is Out. The only tier-eligible side source (VSiN Packers ML +120) is on GB.
- **BUF +3:** BKR now LAR −3.5 (BUF +3.5). Opus pass / skip; Makinen BUF +3 is a near-miss row; VSiN's Rams −3 is now across the key number.
- **Dulcich o25.5:** in Opus CIN@MIA as usage context (BKR 25.5 −112). **Judkins u59.5:** digest row, corroboration-only (ESPN/Sharp Football at −114/−112, not BKR prices).
None of the per-game runs supports a shortlist side at tier 2 on Saturday-night prices.
