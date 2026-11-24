# W12 Wed GB@LAR — matchup deep-dive (runbook §3a evidence file)

Built: Mon 2026-11-23 ~7:30 PM PT (Claude). Kickoff Wed 11/25 5:15 PM PT, SoFi. Proposals only — nothing placed or logged. No stacks yet (island 3-tier template comes after all five game files).

**Update 11/24:** §3a #2 now sourced from FTN coverage tables (see check 2); all-games splits in `reports/bets/2026-w12-matchup-splits.md`.

**Data window.** Repo nflverse PBP weeks 1–10 (both teams had a W11 bye, so this is each team's full season: 10 games). Splits computed from `data/nflverse/2026/play_by_play_2026.csv.gz` + `snap_counts_2026.csv` (positions). nflverse has no alignment (slot/outside), coverage-shell or blitz data → those rows are **matchup data: manual** with the cited source/date.

**Line (conflicting, capture before use).** SI/DraftKings LAR -3, 44.5 (ML LAR -150 / GB +127); Dimers LAR -5.5, 48.5; StatSniper/DK LAR -4.5, 48.5. Spread and total disagree by 2.5–4 pts across sources — take the live Bookmaker/BetOnline number before building anything. Both 6-4.

## Roster gate (strict) — PASS
`npm run roster:vet -- --week 12 --date 2026-11-23 --fetch --strict` → PASS, ESPN rosters refreshed 2026-11-24T03:01Z (2,569 players). Overrides applied: `nacua-out-for-season-2026-11-23`. Every player below re-vetted against this file (see bottom).

Status inputs (web, 11/22–11/23): **Josh Jacobs** (finger surgery 11/13) — LaFleur: unlikely to play (NBC/Demovsky 11/23); limited Monday. **Davante Adams** — IR (hamstring), practice window not opened, likely mid-December. **Puka Nacua** — out for season. **Kyren Williams** — questionable (toe), limited. **Jayden Reed** — ESPN out bucket. **Terrance Ferguson** — shut down for season (ankle surgery). GB limited Monday: Bo Melton (thigh), Skyy Moore (ankle). Micah Parsons PUP/questionable (defense; not used in any leg).

## Season splits (PBP wk 1–10)

| Metric | GB | LAR | League |
|---|---|---|---|
| Off. designed-run YPC | **3.17** (211 att) | 4.81 (272) | 4.08 |
| Def. designed-run YPC allowed | 4.06 | **3.48** | 4.08 |
| Def. rush yds allowed / g | 111.7 | 96.8 | — |
| Off. EPA / dropback | 0.127 | 0.097 | — |
| Def. EPA / dropback allowed | -0.031 | **-0.087** | — |
| Def. WR rec yds allowed / g (rank, 1 = most) | 155.8 (10th) | **108.1 (31st)** | 144.0 |
| Def. TE rec yds allowed / g (rank) | 41.2 (30th) | 41.9 (28th) | 53.4 |
| Def. TE TDs allowed (rank) | 3 (18th) | 1 (28th) | 4.3 |
| Def. RB rec yds allowed / g | 28.9 | **39.2** | 29.1 |
| Off. QB scramble rate (dropbacks) | 0.5% (Love 2) | 1.5% (Stafford 5) | 4.9% |
| Def. scramble rate allowed | 4.9% | 5.6% (178 yds) | 4.9% |
| Def. EPA allowed by pass location L / M / R | 0.11 / 0.10 / **-0.03** | -0.09 / 0.03 / -0.09 | 0.10 / 0.24 / 0.10 |

Usage (PBP): GB targets — Golden 102 (aDOT 13.6, 17 RZ tgts), Watson 79 (14.1, 916 yds, 7 TD), Kraft 56 (6.2, 10 RZ). Last 3: Golden 32, Watson 23, Kraft 13, Savion Williams 8. GB carries since wk 9 (Jacobs out after wk 9 injury): Kaleb Johnson 14/10, Lloyd 0/4, Strong 8/0 (Strong now practice squad). GB inside-5 carries: Lloyd 3, Johnson 3, Jacobs 3, Love 2.
LAR targets wk 10 (no Nacua/Adams): Kyren Williams 5, Mumpfield 4, Corum 4, Higbee 4, Atwell 2, Parkinson 2 (X. Smith scored a 22-yd TD wk 10, first game back). LAR carries wk 7–10: Corum 17/11/11/17, Williams 16/16/15/12. Inside-5: Williams 8, Corum 5. Corum: 17-100-1 wk 10; SI says he has scored in six straight.

## §3a checks

**1. Alignment vs defense split (WR/TE) — matchup data: manual.**
- GB WRs vs LAR: LAR is the 2nd-stingiest defense vs WRs (108.1/g). Golden's slot rate ~41% / wide ~57% is a **2025** figure (DraftSharks, Jun 2026); no 2026 slot/outside split or LAR slot-vs-outside allowed found. → Golden and Watson yardage overs are **flagged "against alignment" (defense-wide WR suppression)**; need FTN slot/outside allowed to clear. Target location proxy: Golden 39 L / 19 M / 43 R; LAR allows -0.09 EPA both sidelines, 0.03 middle — middle is LAR's soft spot but still far below league 0.24.
- LAR WRs vs GB: GB allows 155.8 WR yds/g (10th most) and is weakest to the offense's **left** (0.11 EPA, 6.9 ypa) vs right (-0.03). Which LAR WR aligns left is unknown (manual). With Nacua/Adams out the room is Atwell (aDOT 15.4), Mumpfield (13.5), X. Smith, CJ Daniels — thin, so the volume is shared; lean the role, not the name, until wk-10 route data is in.
- TEs: both defenses suppress TEs (30th / 28th in TE yds allowed) → no TE yardage leads either side.

**2. Coverage-shell match — FTN Stats IQ capture 2026-11-24 (through W11 Sunday): team-defense/coverage + receiving/coverage-types.** Shell-fit YPRR = the receiver's YPRR in each shell weighted by the opponent's mix (man/zone and 1-high/2-high), compared with his season YPRR.
- LAR D: man 39.8% (9th most) / zone 59.4%; single-high 49.0% / two-high 45.9%. EPA/db allowed: man -0.120, zone -0.121, 1-high -0.049, 2-high -0.180. Elite in both families; softest when single-high.
- GB D: man 24.4% (27th) / zone 73.4%; single-high 39.5% (fewest in NFL) / two-high 54.6%. EPA/db: man -0.045, zone -0.048, 1-high +0.022, 2-high -0.072.
- GB receivers vs LAR: Golden 2.65 man / 2.49 zone / 2.92 1-high / 2.15 2-high → fit 2.55 vs season 2.34 (+9%, neutral). **Watson 1.39 vs man / 3.94 vs zone** → fit 3.00 (+9%, neutral), but LAR's 9th-highest man rate hits his weak spot: flag Watson yardage on man-heavy downs. Kraft 1.05 man / 1.58 zone → fit 1.39 (+11%, FAVOURED, small base).
- LAR receivers vs GB: Higbee 0.97 man / 1.49 zone / 1.86 2-high → fit 1.42 (+10%, FAVOURED). Kyren Williams (receiving) 1.93 vs two-high → fit 1.39 (+16%, FAVOURED). Parkinson fit 1.15 (+8%, neutral). Atwell, Mumpfield, X. Smith: below FTN route minimum → shell n/a. (Nacua/Adams favoured/neutral but OUT.)
- Coverage-quality table captured too (target outcomes by separation); not used in the fit yet.

**3. Low-blitz defense + scrambling QB → QB rush overs — FAIL both sides (no look).** Love scrambles on 0.5% of dropbacks, Stafford 1.5% (league 4.9%), and neither defense is low-blitz (FTN BLZ% thru wk 10: GB 34.6%, LAR 28.0%). No QB rush-yards or longest-rush legs.

**4. TE-leak defenses → TE TDs — FAIL both sides.** GB allowed 3 TE TDs, LAR 1; both bottom-3 in TE yards. Kraft (10 RZ targets) and Higbee/Parkinson/Davis Allen ATDs priced below WR/RB alternatives → not proposed unless plus-money and recorded as a price-only play.

**5. Run-defense split.**
- **GB run game: both point against** (GB 3.17 YPC, league-worst run EPA per SI; LAR allows 3.48). Plus Jacobs likely out. → **Fade GB RB rush yards** (Kaleb Johnson unders), **lean GB passing**, and correlate QB yards with the matched-up receiver. But LAR also suppresses WRs (check 1), so the passing lean routes to **GB RB receiving**: LAR allows 39.2 RB rec yds/g (league 29.1).
- **LAR run game: both point for** (4.81 YPC vs GB allowing 4.06 ≈ league). Kyren Q (toe) → Corum volume and goal-line share rise.

**6. RB1 / goal-line ATD coverage list (hard gate before a card locks).**
| Team | Lead back | Goal-line back | ATD leg on any W12 real/paper ticket? |
|---|---|---|---|
| GB | Kaleb Johnson (if Jacobs out) | split: Johnson / MarShawn Lloyd (3 inside-5 each) | None yet — card not built |
| LAR | Kyren Williams (Q, toe) / Blake Corum co-lead | Williams (8 inside-5), Corum (5) | None yet; DKP 10-pick cross-week W12 legs to be checked when the card is built |
Pre-card note: if the card carries any Corum or Kyren yardage leg, it needs the matching ATD leg or a stated reason. GB backs: ATD is a price question (worst run game, split goal line) — expect "Not covered: RB ATD (GB) — split role + LAR 3.48 YPC allowed" unless the price is long.

## Prop leads (for the island stacks; Andy places, nothing logged)
| Game | Leg | §3a basis | Flags |
|---|---|---|---|
| GB@LAR | Blake Corum anytime TD | #5 LAR run split favourable; #6 goal-line share, Kyren Q | streak is tiebreaker only |
| GB@LAR | Blake Corum over rush yds (if Kyren limited/out) | #5 both splits for LAR run | status-dependent; check line vs 17-carry role |
| GB@LAR | Kyren Williams anytime TD (only if active, no snap cap) | #6 inside-5 leader (8) | QUESTIONABLE toe |
| GB@LAR | Kaleb Johnson under rush yds | #5 both splits against GB run | Jacobs status; fade flips if Jacobs plays |
| GB@LAR | Kaleb Johnson over receptions / rec yds | #5 pass lean + LAR allows 39.2 RB rec yds/g | role share with Lloyd; shell n/a |
| GB@LAR | Tyler Higbee over rec yds | #2 FAVOURED (fit +10%, 1.86 YPRR vs two-high; GB plays two-high 54.6%) + thin LAR WR room | #4 TE leak fails (GB allows little to TEs): yardage only, no TE TD |
| GB@LAR | Kyren Williams over receptions (if active) | #2 FAVOURED (fit +16%, 1.93 vs two-high) | QUESTIONABLE toe |
| GB@LAR | Tutu Atwell over rec yds (or Konata Mumpfield) | #1 GB allows 155.8 WR yds/g, left-side weakness | alignment: manual; thin role post-Nacua/Adams |
| GB@LAR | Matthew Golden over receptions (not yards) | volume 32 tgts last 3; #2 neutral (+9%) | **against alignment** (LAR 31st WR yds allowed) — tiebreaker-level only |

Not proposed: QB rush overs (check 3 fail), TE TDs (check 4 fail), Watson yards (against alignment, plus 1.39 YPRR vs man into LAR's 9th-highest man rate), Jordan Love passing-yd overs (LAR -0.087 EPA/db; only as a correlated piece if the game-script lean is GB trailing).

Open data to close before stacks: live line/total and prop prices; slot/outside alignment (no source); Kyren and Jacobs final status (Wed inactives ~3:45 PM PT).

## Roster-gate rows (every player named above)
| Game | Player |
|---|---|
| GB@LAR | Jordan Love |
| GB@LAR | Josh Jacobs |
| GB@LAR | Kaleb Johnson |
| GB@LAR | MarShawn Lloyd |
| GB@LAR | Matthew Golden |
| GB@LAR | Christian Watson |
| GB@LAR | Tucker Kraft |
| GB@LAR | Savion Williams |
| GB@LAR | Bo Melton |
| GB@LAR | Skyy Moore |
| GB@LAR | Matthew Stafford |
| GB@LAR | Kyren Williams |
| GB@LAR | Blake Corum |
| GB@LAR | Tutu Atwell |
| GB@LAR | Konata Mumpfield |
| GB@LAR | Xavier Smith |
| GB@LAR | CJ Daniels |
| GB@LAR | Tyler Higbee |
| GB@LAR | Colby Parkinson |
| GB@LAR | Davis Allen |

Sources: repo nflverse PBP/snap counts (wk 1–10); NBC Sports/Rotoworld 11/23 (Jacobs); Yahoo/SB Nation 11/22 (Adams IR); SI Betting W12 preview 11/23 (injuries, DK line, Corum streak, GB run EPA); Dimers W12 (line); SI Rams On SI ~10/6 (LAR blitz/man/zone); DraftSharks Jun 2026 (Golden 2025 slot rate); atozsports / ZoneCoverage 2026 offseason (Gannon scheme); therams.com 11/15 recap (wk 10 vs ARI).
