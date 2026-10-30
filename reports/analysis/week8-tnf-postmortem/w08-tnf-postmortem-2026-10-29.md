# Week 8 TNF post-mortem — CAR @ GB (GB 27–19), October 29, 2026

Sources:
- Leg results: `data/official-picks/user-placed-wagers-2026.json`, graded from ESPN 401873023.
- Leg sources: `reports/bets/2026-w08-tnf-island-ladder-2026-10-29.md`, `2026-w08-tnf-sgp-proposals-2026-10-29.md`, `reports/engineering/week8-pools-tnf-2026-10-29/x-bookmarks-pass-2026-10-29.md`.
- Source history: every verified expert pick from Weeks 4–7 (`data/generated/master-intel/wNN-expert-verified.json`), graded against the saved ESPN box scores by `grade_expert_history.py`. 795 picks graded, 49.4% overall. Players missing from the box score are excluded, as books void them. Outputs: `expert-history-graded-w04-w07.json` and `tnf-source-history.json`.

## 1. The legs were fine; the ticket structure was not

- **All placed TNF legs: 25 won, 14 lost, 1 push (64%).** Several losers appear on two tickets.
- Every prop ticket carried 4–8 legs. At a 64% leg rate, a 4-leg ticket cashes about 17% of the time, a 6-leg about 7%, and an 8-leg about 3%. Several tickets died on one or two legs:
  - DKP 6-pick 5/6 (McKinney)
  - BEO 4-leg 3/4 (Waller)
  - D52 paper 6/8
  - BEO 8-leg 6/8
  - DKP 7-pick 5/7
- **Takeaway:** the core ticket should be 3–4 legs. Keep 6–8-leg tickets as small-stake lottos only.

## 2. Leg-by-leg source attribution

Source record = graded Weeks 4–7 picks in the local expert history (overall, then in this market). "None" means no local history.

| Leg | Result | Source(s) | Source W4–7 record |
|---|---|---|---|
| Hubbard ATD | WON (1 rush TD) | PFF (−110); Joe Holka | PFF 4-4 (ATD 3-3); Holka 5-1 (ATD 5-1) |
| Coker ATD | WON | Joe Holka | Holka 5-1 |
| Jacobs ATD | WON (2 TD) | Harry Lock (POTD), Adam Kaufman, Sam Farley | Lock 8-4; Kaufman and Farley none |
| Jacobs 15+ carries | WON (21) | Sharp Football SGP o14.5; Claude swap | Sharp 10-2 |
| Watson 5+ rec | WON (8) | Sharp SGP; PFF volume; Hribar | Sharp 10-2; Hribar none |
| Kraft 4+ rec | WON (6) | DanGambleAI (pick of the day) | 8-10 (receptions 1-0) |
| Young 1+ INT | WON | No expert pick; matchup case (Moody: GB 9 INTs; Hribar: 46.9% pressure) | ESPN group 5-8 (INT 2-0) |
| Love 1+ INT | WON | Cody Brown | 9-16 |
| Van Ness sack | WON | Claude matchup replacement for team sacks | n/a |
| Hubbard 10+ rec yds | WON (38) | Eric Moody o16.5 | ESPN group 5-8 |
| Metchie 2+ rec | WON (3) | xEP projection; Linemate popularity | xEP 8-8 (rec yds 0-3) |
| McMillan 6+ rec | WON (6) | Claude S3b | n/a |
| Golden ATD | WON | Andy | n/a |
| Love 2+ pass TD | WON (3) | Price-driven | n/a |
| Under 48.5 | WON (46) | Moody (preferred play), xEP (B+), Sharp SGP, Billy Ward | Sharp 10-2; xEP 8-8; Ward none |
| **McKinney 4+ T+A** (×2) | LOST (3) | Andy's own; no expert | n/a |
| **Waller 22+ / 15+ rec yds** (×2) | LOST (11) | Cody Brown o21.5 | 9-16 (rec yds 1-1) |
| **Watson ATD** (×2) | LOST (8-113, no TD) | Kyle Murray (Action, 1u); PFF/Hribar volume; "if Golden sits" pitch | Murray none |
| **McMillan 66+ rec yds** | LOST (58 on 11 targets) | Andy; xEP matchup 81/100; Cody Brown 60+ in an SGP | xEP rec yds 0-3; Cody Brown 9-16 |
| **Jacobs 70+ rush + rec** | LOST (52) | PFF 70+; Moody/Bowen 83+; Farley 77.5 | PFF 4-4; ESPN 5-8 (rush + rec 0-1) |
| **Metchie 15+ rec yds** | LOST (14) | xEP projection of 26 | xEP rec yds 0-3 |
| **Smack 1+ FG** | LOST (0 attempts) | Andy | n/a |
| **Young 2+ pass TD** | LOST (1) | Price-driven, no source | n/a |
| **CAR +4.5 / +4 / ML** | LOST (by 8) | Millman, Cohen (VSiN), Kargel, Ward; sharp money at Caesars on +4/+4.5 | Millman 3-6 (sides); Cohen 11-8 (sides 9-8) |
| Over 46 | PUSH | Andy's Oct 27 SGP | n/a |

**Tonight by source:**
- Joe Holka 2-0
- Sharp Football 2-0
- Harry Lock 1-0
- DanGambleAI 1-0
- PFF 2-1
- Moody 2-1: Under and Hubbard receiving won; Jacobs yardage lost.
- Cody Brown 1-1 on placed legs; his Jacobs o80.5 also lost.
- Kyle Murray 0-3: Watson ATD, Hubbard rush under (81 yds) and Coker 5.5+ rec (2).
- The CAR +3.5 group 0-1. John Lanfranca (GB −3.5) was right.

## 3. What went wrong

**A. Right read, missed by a hair (variance, not process):**
- Metchie 14 yards vs 15 (3 catches).
- McMillan 58 yards on 11 targets vs 66.
- Watson 8-113 with no TD.

These three were correctly read for volume. Watson's target thesis was right; the TD went to Kraft, Golden and Jacobs (twice).

**B. Process errors to fix:**
1. **A conditional thesis was not re-checked at inactives.** The Watson ATD pitch was "if Golden sits, Watson's share goes up." Golden was active and drew 13 targets and a TD. When a pitch's condition fails at inactives, the leg should be re-scored.
2. **Yardage legs behind a broken offensive line.** GB played without C Rhyan and G Glover, on a third-string center. We used that for Love INT (won) but not for Jacobs' yardage. Jacobs got the volume (21 carries, 2 TD) at 1.9 yards per carry: the carries leg won and both yardage legs lost. **Rule:** when a team's offensive line is compromised, prefer volume and TD legs (attempts, receptions, ATD) over yardage.
3. **Low-target tight-end yardage in a committee.** Waller drew 2 targets; CAR spread its TE looks across Waller, Evans and Tremble. The only source was Cody Brown (36% over Weeks 4–7). Avoid TE yardage overs when the TE has no stable target share.
4. **Anti-correlated legs inside one ticket:**
   - Smack 1+ FG beside GB ATD legs. GB scored four TDs and no FGs.
   - Young 2+ pass TD beside Young INT and the pressure script.
   - The Oct 27 CAR +4 / Over 46 SGP ran against tonight's GB-control / Under positions.
   - A per-ticket correlation check would have flagged all three.
5. **The defensive leg had no basis.** McKinney's raw 4+ rate was 57% (about 48% calibrated). With GB's linebackers out, the Weeks 1–7 backtest says the vacated tackles go to the other linebackers (+2.2), not the safeties (+0.4). McDuffie (10) and Hopper (8) were the right legs (`docs/defensive-props/defensive-intel-findings-2026-w07.md`).
6. **Price-driven, unsourced legs.** Young 2+ pass TD was a tier-4 price leg with no supporting source. It lost, and it fought the INT thesis.

**C. Source weighting.** Placed legs from sources with good Weeks 4–7 records mostly won: Holka, Sharp, Harry Lock and PFF went 7-1 tonight. The losers came from sources with poor or no history (Cody Brown, Kyle Murray, xEP yardage) or from no source at all (McKinney, Smack, Young 2+ TD).

## 4. Rules for Sunday

1. Core prop tickets: 3–4 legs. Anything longer is a lotto at no more than half the core stake.
2. Every leg needs a named source with a positive Weeks 4–7 record in that market, or an explicit matchup case. Price-only legs are lotto-only.
3. Source tiers, Weeks 4–7 (small samples; revisit weekly):

| Tier | Sources |
|---|---|
| Lean on | Holka ATD (5-1); thepropdealer ATD (10-3); Sharp Football (10-2); Harry Lock props (8-4); Zachary Cohen sides (9-8); Steve Fezzik (18-11); Dave Tuley (13-6); Mike Florio (10-5) |
| Fade or ignore | Gilles Gallant ATD (2-17); Sean Koerner ATD (3-13); Cody Brown props (9-16); Action Network feed (33-55); Chad Millman sides (3-6) |
| No history yet (track before trusting) | Kyle Murray, Sam Farley, Adam Kaufman, Eric Moody, Rich Hribar, Linemate, MySpariEdge, Billy Ward, Kyle Kargel |

4. At inactives, re-score every leg whose pitch depends on someone else's status.
5. Offensive-line rule: no yardage overs for a team missing two or more interior linemen; use attempts, receptions or ATD instead.
6. Correlation check per ticket: no leg that needs the opposite game script from another leg on the same ticket.
7. Defensive legs: follow the Weeks 1–7 findings (linebackers, vacated tackles, opponent play volume; no safety or corner T+A without a specific reason).

## Caveats

- The local expert history covers Weeks 4–7 only, and many sources have under 20 graded picks, so their records are noisy.
- Sources whose picks came only through X images or video may be under-captured. Supabase `research_intel_notes` may hold more history; reading it needs a separate OK.
- Prices exist for only 157 of 795 graded picks, so most records are hit rates, not ROI.
