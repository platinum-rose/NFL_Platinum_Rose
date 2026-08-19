# Quant Risk Sizing Playbook

Source reference: X article by Orion / `0xOrionVega`, posted 2026-08-15, on expectancy, volatility, ruin risk, Kelly sizing, and geometric growth.

This note is a reference doctrine for BETTING and FUTURES agents. It is not a pick recommendation, not a bankroll authorization, and not permission to log or place a bet.

## Core Doctrine

Positive expected value is only the entrance ticket. A weekly pick or futures ticket still needs variance-aware sizing before it becomes a stake proposal.

Use this sequence:

1. Edge: is the model probability above the market breakeven probability?
2. Volatility: how loud is the return swing around that edge?
3. Survival: can the stake size survive normal losing runs?
4. Kelly: what fraction maximizes long-run log growth under the probability estimate?
5. Geometric growth: does the actual one-path bankroll growth stay positive after variance?

## Formula Set

Let:

- `p` = model probability of winning
- `q = 1 - p`
- `b` = net odds, where `+250` means `b = 2.5` and `-150` means `b = 100 / 150`
- `f` = fraction of bankroll staked

Expected value per dollar risked:

```text
EV = p*b - q
```

Market implied probability:

```text
implied = 1 / (b + 1)
```

Kelly fraction:

```text
f* = (b*p - q) / b
```

Geometric log growth:

```text
g(f) = p*ln(1 + f*b) + q*ln(1 - f)
```

Even-money ruin proxy from the article:

```text
R = (q / p)^N
```

where `N` is bankroll measured in one-bet units. This proxy is exact for the article's even-money setup and directional for general pick sizing.

## Article Sanity Check

Article example:

- Win probability: 55%
- Odds: even money
- EV: `+0.10` per dollar risked
- Return volatility: about `0.995`
- Signal-to-noise: about `0.10`
- Kelly fraction: 10%

Log-growth examples:

| Stake fraction | Log growth per bet |
|---:|---:|
| 5% | about +0.375% |
| 10% | about +0.501% |
| 20% | about 0% |
| 35% | about -2.88% |
| 50% | about -8.89% |

The lesson: a bet can be positive EV and still compound badly if stake size is too large.

## Weekly Picks Usage

When a weekly side, total, moneyline, or prop has a model probability and market odds, run the code-owned `calculate_risk_sizing` tool before recommending units.

Default weekly assumptions:

- Fractional Kelly: `0.25`
- Single-pick cap: `5%` of bankroll or the configured max single-bet cap, whichever is lower
- Apply an uncertainty haircut when the probability is subjective, stale, or thinly supported
- Apply a correlation haircut when the pick overlaps other card exposure, same team, same QB, same weather thesis, same injury thesis, or a parlay leg

Recommended output:

```text
Risk lens:
- Market breakeven:
- Model probability:
- Edge:
- EV per $1:
- Full Kelly:
- Fractional/capped stake:
- Recommended units:
- Geometric growth:
- Flags:
```

## Futures Usage

Futures need stricter haircuts than weekly picks because they are correlated, illiquid, and tie up capital.

Default futures assumptions:

- Start at quarter Kelly or smaller
- Haircut for price staleness, data uncertainty, market liquidity, settlement/friction, and time-to-resolution
- Cluster exposure before sizing: team, division, conference, quarterback, injury thesis, award candidate, and sportsbook/prediction-market equivalence
- Size the cluster, not each ticket independently

Do not add individual Kelly outputs across correlated futures.

## Guardrails

- If EV is non-positive, default to pass/watch.
- If Kelly is negative or zero, do not recommend a stake.
- If geometric growth is non-positive at the proposed stake, reduce size or pass.
- Treat high full-Kelly output as a warning, not permission.
- Code owns the math; the agent owns the football reasoning and caveats.
- Human approval remains required before logging, paper-tracking, placing, or persisting any pick.
