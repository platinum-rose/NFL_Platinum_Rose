# W10 kicking / FG check (Claude, 2026-11-15 ~7:30 AM PT)

Ad hoc team-FG model (no repo model existed): team FGM rate (offense) x opponent FGM-allowed rate / league avg,
shrunk toward league (k=6 games), scaled by sqrt(team implied total / 22.5), Poisson P(>=2). PBP through W9.

**Backtest (weeks 4-9, walk-forward, 176 team-games): no signal.** Log loss 0.695 vs 0.691 for a constant base rate;
calibration flat (~0.55 hit in every predicted-probability bin). Team FG history does not predict next-week FG counts.

Season base rates (W1-9): team 2+ FGM 54% (272 team-games); game 4+ FGM 48% (136 games).
BEO (8:20 PM Sat) prices team O1.5 at plus money (devig 43-47%) for ARI +120, TEN +120, LV +115, MIA +105, NYJ +100:
below the 54% base rate, but the market is pricing team totals, which this check could not test. Treat as lean only.
