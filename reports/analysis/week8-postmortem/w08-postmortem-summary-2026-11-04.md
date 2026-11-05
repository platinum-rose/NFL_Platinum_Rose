# Week 8 post-mortem summary (2026)

One-page index of the Week 8 close-out. Each section links to its detail file in `reports/analysis/week8-postmortem/` unless noted.

## The week in one paragraph
Favorites went 9-5 ATS against the closing line, and totals split 7-7. The two blowouts that shaped our week were BUF 36-10 over BAL
(Lamar left on the first series) and JAX 42-7 over IND. As tagged, cash was **+$267.83**, but one DraftKings Predictions six-pick
(the A-A-A split, $14.98 → $609) carried all of it. Without it the week was -$326.17. Under Andy's 10/27 DK-as-promo rule, cash was
**-$221.40** plus the DK account change (pending Andy's DK balance). The AI paper card had its worst leg rate of the season
(38.8%). The SuperContest five went 2-3; the AI's five went 1-4.

## Game results vs the closing line (ESPN/DK near-close)
| Game | Final | Close | ATS | Total | Final total |
|---|---|---|---|---|---|
| CAR @ GB | 19-27 | GB -3.5 | GB | 47.5 | 46 U |
| ARI @ DAL | 33-30 OT | DAL -7 | **ARI** | 54.5 | 63 O |
| ATL @ TB | 0-16 | TB -2.5 | TB | 43.5 | 16 U |
| BAL @ BUF | 10-36 | BUF -3 | BUF | 54.5 | 46 U |
| CLE @ PIT | 6-27 | PIT -3.5 | PIT | 38.5 | 33 U |
| IND @ JAX | 7-42 | JAX -10.5 | JAX | 45.5 | 49 O |
| LV @ NYJ | 38-33 | NYJ -1.5 | **LV** | 46.5 | 71 O |
| MIN @ DET | 15-19 | DET -3.5 | DET | 45.5 | 34 U |
| TEN @ CIN | 36-43 | CIN -13.5 | **TEN** | 45.5 | 79 O |
| LAC @ LAR | 9-24 | LAR -6.5 | LAR | 45.5 | 33 U |
| KC @ DEN | 24-28 | DEN -1.5 | DEN | 41.5 | 52 O |
| NE @ MIA | 24-19 | NE -7 | **MIA** | 41.5 | 43 O |
| PHI @ WSH | 10-27 | WSH -5.5 | WSH | 40.5 | 37 U |
| CHI @ SEA | 34-17 | SEA -3 | **CHI** | 46.5 | 51 O |

## Full page
The consolidated HTML post-mortem (Week 4 format: money by ticket family, season table W1-W8, fair line vs final, leg categories,
AI vs Andy, closest tickets, 14 game recaps) is `reports/bets/season-recap/week8-post-mortem.html`.
Built by `reports/bets/season-recap/scripts/{build.py,paper_w8.py,gen_week.py,page_week.py}` with `cfg_w8.py`, `ai_recs_w8.py`, `recaps_w8.py`.
Re-grade: placed legs 154/252 (61%); AI-backed props 22/38, Andy-only props 70/105, unplaced AI props 10/29.
Grader fix 11/04: city-name sides ("Chicago ML", "Kansas City ML") now map to teams (`grade.py` CITY map); five paper legs were mis-graded before.
Paper-ledger legs: **38-60** (reconciled 11/04 evening). The earlier season-recap 40-58 was a grade.py bug: Pick 6 "More/Less" wording was read as overs
(Nix Less 1.5 pass TD x2 and Goff Less 0.5 INT graded W, Elliott Less 7.5 kicking pts graded L). Fixed; `grade.py`, `lib.py` and the stored statuses now agree
(`reports/bets/season-recap/work/w8/crosscheck_w8.md`). The page was rebuilt: placed legs and AI-vs-Andy numbers unchanged; four paper legs corrected; fixed scorecard added.

## Scorecards
| Area | Week 8 | Detail |
|---|---|---|
| Cash (as tagged) | 32 tickets, 2 won, +$267.83 on $348.27 | `w08-closeout-2026-11-04.md` |
| Cash (10/27 DK rule) | 20 tickets, -$221.40 on $228.50, plus the DK account change | same |
| Promo/free | 18 tickets, $169.42 credit → $75.88 (FDP MNF bonuses hit) | same |
| Splits | Alejandro +$133.06; Amanda +$198.00 (+$193.06 if her solo DK ticket was fronted) | same |
| AI paper card | 4 of 24 cashed; legs 38-60 (38.8%; Week 7 53.4%) | `platinum-rose-w8-paper-accuracy-2026-11-04.md` |
| SuperContest | Official 2-3 (Andy right: JAX/MIN swaps +1.0); AI five 1-4 | ledger D55 |
| Podcast experts | 67-96 on 167 positions, -26.5u; best Erickson +5.6u, worst B. Anderson -11.9u; ATD market 8-35 | `reports/intel/w08-podcast-pick-grades.md` |
| Recommendation ledger | Week 8 closed (D48-D56) | DEV `claude/recommendation-ledger-2026.md` |

## What Week 8 taught (carry into Week 9)
1. **Rushing lane > receiving lane.** Paper legs by unique proposition: rushing yards 6-1, receptions 0-4, receiving yards 0-2.
   The only cash winner was also a rushing/QB short combo (Tuten, Irving, Allen, Rodgers).
2. **Stop reusing one read across 4-5 templates** (Okonkwo receptions x5, Warren receiving x4). Cap it at 2-3.
3. **The anytime-TD market is the bleed** for both us and the experts: experts went 8-35 on ATD/first-TD picks; our ATD legs were 5-5 on paper but carried the long-shot tickets that all died.
4. **Line buys didn't save any total** (D50/D51): all four bought totals missed by more than the buy.
5. **Season-level red flags** (from `weekly_review.py` season to date, as tagged):
   - Island SGP ladders (TNF/SNF/MNF): **0 for 61, -$395.21**.
   - BetOnline: **0 for 107 cash tickets, -$662.18** (mostly prop stacks).
   - 4-team master RRs: **0 for 5, -$440.53**. The card has said "cap or skip" since Week 4.
   - Game-line parlays: **+$509.46** (72 tickets, 5 won); the only family that's up.
   -> Consider shrinking island ladders to one ticket per game and leaning on game-line parlays and short rushing/defensive combos.
6. **Podcast intel needs verification before use.** Week 9 Pass 1 was about 80% accurate, with one reversed side
   (`reports/intel/w09-podcast-veracity-2026-11-04.md`). Pass 2 prompt: `agents/dev/ANTIGRAVITY_W09_PASS2_PODCAST_SWEEP.md`.

## Open items (Andy)
- DK booking basis for Week 8 (and the DK balance/summary if the 10/27 rule applies).
- OK to update 5 PENDING legs in settled tickets (3 official, 2 paper; no result changes).
- Re-run `node scripts/archive/weekly-archive.mjs --week 8 --refresh` on Windows.
- ~~Log N1 and Q5 in the wagers ledger~~ Done 11/04 4:05 PM PT, with N2a/N2b (local file only; not Supabase).
