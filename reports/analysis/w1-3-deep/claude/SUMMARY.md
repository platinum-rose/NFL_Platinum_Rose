# Weeks 1–3 deep analysis: Claude Team 2 summary (2026-09-28)

Report: `w1-3-basket-review.html` (claude.ai artifact "W1–3 Basket Review"). Scripts: `scripts/` (core, t2a–t2d, build_report). Baseline: Team 1 graded tables. Codex C1/C4 had not landed; re-run against `../codex/` when they do. Anything under ~2 SE is labelled **hypothesis**.

## Bottom line
- W1–3: $1,266 staked, $251 back, **−$1,015** (MNF excluded).
- Simulated per-week EV (40k weeks, same-game ρ = 0.15, market edges shrunk toward $0.95/leg):

| Basket | Stake/wk | EV observed | EV no edge | EV conservative | SD/wk |
|---|---|---|---|---|---|
| W1–3 actual mix | $413 | −$130 (−31%) | −$84 | −$166 | $393 |
| Team 1 playbook | $240 | −$39 | −$35 | −$63 | $163 |
| **Team 2 core** | **$165** | **+$8 (+5%)** | **−$18** | **−$25** | **$99** |
| Team 2 lean | $105 | +$3 | −$12 | −$17 | $76 |

- **Structure is robust.** Even if every edge is noise, the core basket loses about $66 a week less than the W1–3 mix. The positive EV depends on the QB, anytime-TD and dog-ML edges, each under 2 SE (hypothesis).

## T2-A Burn taxonomy (272 burnt of 516 unique positions, placed + AI-only)
- Season: side/total lost 82 · no volume 70 · TD went elsewhere 63 · defensive stat 21 · QB script 20 · volume there, production not 16. The rules reproduce Team 1's W3 labels on 85/85 matched legs.
- **Structural:**
  - Receiving props hit 25/32 when the team threw 35+ times, but 31/82 otherwise (57% break-even, 3.3 SE; the split is post-game, so the pre-game rule is a hypothesis).
  - Anytime TDs hit 54% when the team scored 3+ TDs and 26% otherwise. In 45 of 63 lost TD legs the team scored 2+ TDs.
  - Results cluster by game: χ² 63 on 47 df, permutation p = 0.02. The per-pair correlation is small (φ ≈ 0.04), so the cost is concentration (NYG@LAR 25 burns, LAR@DEN 21).
- **Variance:**
  - 18/82 side burns lost by 3 points or fewer.
  - 12/21 defensive burns missed by one.
  - Props on the losing team 70/157 (−1.0 SE, hypothesis).

## Markets (return per $1, priced unique positions)
- Positive (all hypotheses):
  - QB INT yes $1.41 (n=8)
  - pass-TD over $1.25 (n=20)
  - dog ML $1.19 (n=21)
  - anytime TD $1.12 (n=56)
  - tackles $1.12 (n=21)
- Negative:
  - **dog spread $0.67 (n=33, hit rate 2.1 SE below break-even)**
  - total under $0.71
  - fav spread $0.75
  - receptions $0.82
  - rush yds $0.82
  - rec yds $0.85
  - sacks $0.72

## T2-C Sources
- **AI side/total picks placed: 33/83 priced, −26% (2.7 SE, strong).** Andy's own sides were +9% (24/43).
- AI props: placed +8%, unplaced +22%. AI TD-scorer picks +48% and QB picks +30% (about 1.5 SE, hypothesis). Andy's own volume/yardage props were −19% (1.6 SE).
- Ledger D1–D11 at leg level: Claude right 4, Andy 1, neither 4, both 1, moot 1.
- Expert agreement on our placed props:
  - Keep-list expert: 22/34 priced, +25% (1.2 SE).
  - Fade-list only: 3/11, −49%.
  - No expert: −6%.
  - Use agreement as a tiebreaker only.

## T2-B Experts (601 collapsed props, 261 priced at the exact BetOnline rung; 5 first-TD calls split from ATD)
- **Follow:** none. No expert clears 2 SE on priced return.
- **Screen (idea source only):**
  - Joe Holka (receptions 11/16, ATD 8/14, priced +6%)
  - Sal Bets (positive every week; only Unders poster)
  - Cody Brown (rec yds 11/16)
  - Harry Lock (46–37, but nearly all alt lines; priced −8%)
- **Fade:**
  - Dan's AI (priced 22/55, −26%, 2.3 SE, strong)
  - SharpieMatters (12/44, −33%)
  - FirstTDBets (1/16)
- **Sides:** Twitter 46/93, podcasts 39/86, YouTube 10/24. None beats 52.4%.
- **Podcast props:** BettingPros 8/14 and Action Network 0/7 (W3 only, thin). Dossiers hold sentiment only and are not scored.
- As a group, expert props lost at board prices: ATD −14%, receptions −26%, and standard lines 46/101.

## Week 4
See `week4-build-checklist.md`.
