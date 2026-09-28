# Weeks 1–3 deep analysis — shared findings (append-only)

Brief: `handoffs/2026-09-28-1300-claude-team2-pivot-weekend-briefing-deep-analysis-handoff.md`.
Folders: `claude/` (Claude Team 2 only) · `codex/` (Codex only). Tag every entry `[claude]` or `[codex]`, with a date and the evidence path. Mark any result under ~2 SE as a **hypothesis**.

## Baseline (Team 1, 2026-09-28, MNF excluded — to be verified by Codex C1/C3)
- [team1] Net −$1,015.10 on $1,266.11 staked; legs 48.7% vs 53.4% break-even.
- [team1] 5+ leg parlays 0/58; 4-team master RR 0/3; 2-team RR 3/4 (+14%).
- [team1] Leaks: dog spreads 13/35, receptions 20/46. Good: pass-TD overs 15/21, QB INT-yes 8/12, dog ML +19%, +150-or-longer +27%.
- [team1] Twitter props: follow Sal Bets / Joe Holka / Harry Lock (standard) / Cody Brown; fade SharpieMatters, FirstTDBets.

## Entries

- [claude] 2026-09-28 T2-A burn taxonomy (evidence: `claude/t2a_summary.json`, `claude/t2a_burn.json`): 272 of 516 unique W1–3 positions burnt: side/total 82, no volume 70, TD elsewhere 63, defensive stat 21, QB script 20, production 16. Rule-based causes reproduce Team 1's W3 hand labels 85/85.
- [claude] 2026-09-28 Structural: receiving props hit 25/32 when the team threw 35+ times vs 31/82 otherwise (57% BE, 3.3 SE, post-game split, so the pre-game "projected 35+" rule is a **hypothesis**). ATD hit 54% when the team scored 3+ TDs vs 26% otherwise (**hypothesis**). Results cluster by game-week (χ² 63/47 df, permutation p = 0.02) but pairwise φ ≈ 0.04: the cost is concentration of legs on one read.
- [claude] 2026-09-28 Markets (return per $1, priced unique positions): dog spread $0.67 (n=33; hit rate 2.1 SE below BE, strong-ish). Positive but **hypotheses**: QB INT yes $1.41 (n=8), pass-TD over $1.25 (n=20), dog ML $1.19 (n=21), ATD $1.12 (n=56).
- [claude] 2026-09-28 T2-C: AI side/total picks placed 33/83 priced, −26% flat return (2.7 SE, **strong**); Andy's own sides +9%. AI TD-scorer +48% / QB +30% (~1.5 SE, **hypothesis**); Andy volume/yardage props −19% (1.6 SE, **hypothesis**). Placed props agreeing with a keep-list expert +25% (1.2 SE, **hypothesis**); fade-list only −49%. Evidence: `claude/t2c_sources.json`.
- [claude] 2026-09-28 T2-B: at BetOnline board prices no Twitter expert clears 2 SE; Dan's AI −26% on 55 priced (2.3 SE) → fade; SharpieMatters −33% on 44 (1.7 SE, **hypothesis**); Holka/Sal/Cody/Lock = screen only. Expert sides (Twitter 46/93, podcast 39/86, YouTube 10/24) show no edge. Evidence: `claude/t2b_experts.json`.
- [claude] 2026-09-28 T2-D (own Monte Carlo; swap in Codex C4 when it lands): W1–3 mix EV −$130/wk on $413 (−$84 with no edge); Team 2 core $165/wk EV +$8 observed / −$18 no edge / −$25 conservative. The ~$66/wk saving under no-edge is robust; the positive EV is a **hypothesis**. Evidence: `claude/t2d_basket.json`, `claude/week4-build-checklist.md`.
- [claude] 2026-09-28 Data fix: 14 wagers-file legs (W1 DK NE@SEA, W2 MNF Likely/Newsome/Fields, W3 McBride/Bryant 28+/Bonitto/Harvey) regraded against ESPN box scores in the local wagers file with Andy's OK; no ticket result or payout changed. Pat Bryant 3+ rec (#1000184658) was correctly LOST (2 rec). 9 other LOST legs carry `actual_stat: 0` while the box score shows a smaller nonzero value (results still correct; 5 more are DNPs): see `claude/scripts/zero_sweep.py`, for Codex C1.
