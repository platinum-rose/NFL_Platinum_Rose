# Week 6 Quantitative Synthesis — Proposed Analysis

Generated 2026-10-16T22:59:39.581Z. **Not an official card, pool entry, ticket, or execution instruction.**

## What this pass actually uses

- FTN rendered exports: 74 tables / 9,309 rows, captured through 2026-10-13T18:14:26.478Z.
- BKR market anchor: 2026-10-16T17:38:00.000Z (board filename time, PT, approximate); 13 games with lines.
- Current season SRS / net-point / Pythagorean power ensemble: 2026-10-13T06:07:42.390Z.
- Week 6 secondary-matchup evidence, capped to prevent manual injury notes from overwhelming the market.
- Current availability as a gate/context layer.

**Distribution:** exact calibrated pmf (no sampling; key-number aware; pushes tracked; ranking uses cover % excluding pushes). The model blends 60% market, 25% FTN team analytics, and 15% SRS margin; it is provisional and unbacktested, so probability is a comparison signal—not a claim of calibrated edge. Podcast, expert, splits, stale DVOA, and stale coaching inputs are retained as qualitative review context only.

## Game projections and simulation outputs

| Game | Mean score | BKR spread / total | Preferred side | Cover % | Preferred total | Total % |
|---|---:|---|---|---:|---|---:|
| SEA @ DEN | — | missing | — | — | — | — |
| HOU @ JAX | HOU 18.9–JAX 23.8 | JAX -2.5 / 42.5 | JAX | 56.2% | Over | 50.6% |
| CHI @ ATL | CHI 26.6–ATL 25.6 | ATL 1 / 51.5 | ATL | 50.2% | Over | 52.1% |
| BAL @ CLE | BAL 21.2–CLE 18.7 | CLE 3 / 40.5 | CLE | 51.5% | Under | 51.7% |
| TEN @ IND | TEN 18.5–IND 25.1 | IND -7 / 44 | TEN | 51.1% | Under | 51.0% |
| NYJ @ NE | NYJ 18.7–NE 24.4 | NE -7 / 43.5 | NYJ | 53.6% | Under | 51.3% |
| NO @ NYG | NO 23.6–NYG 22.8 | NYG 1 / 46 | NYG | 50.7% | Over | 51.3% |
| CAR @ PHI | CAR 21.4–PHI 18.1 | PHI 3.5 / 39 | PHI | 50.4% | Over | 51.6% |
| PIT @ TB | PIT 20.4–TB 18.6 | TB 2.5 / 39 | TB | 52.0% | Over | 50.1% |
| ARI @ LAR | ARI 20.3–LAR 31.7 | LAR -13.5 / 52 | ARI | 56.4% | Over | 50.0% |
| BUF @ LV | BUF 28.0–LV 25.4 | LV 4.5 / 53.5 | LV | 55.0% | Under | 50.3% |
| LAC @ KC | LAC 15.8–KC 25.4 | KC -8 / 41.5 | KC | 54.5% | Under | 50.8% |
| DAL @ GB | DAL 26.1–GB 27.7 | GB -1.5 / 53.5 | GB | 50.2% | Over | 50.8% |
| WAS @ SF | WAS 21.1–SF 30.2 | SF -7.5 / 51.5 | SF | 54.4% | Under | 50.6% |

## Ranked model menus (not recommendations)

### Sides

| Rank | Side | Game | Model cover % | Market home spread | Model home margin |
|---:|---|---|---:|---:|---:|
| 1 | ARI | ARI @ LAR | 56.4% | -13.5 | 11.3 |
| 2 | JAX | HOU @ JAX | 56.2% | -2.5 | 4.8 |
| 3 | LV | BUF @ LV | 55.0% | 4.5 | -2.6 |
| 4 | KC | LAC @ KC | 54.5% | -8 | 9.6 |
| 5 | SF | WAS @ SF | 54.4% | -7.5 | 9.1 |
| 6 | NYJ | NYJ @ NE | 53.6% | -7 | 5.8 |
| 7 | TB | PIT @ TB | 52.0% | 2.5 | -1.7 |
| 8 | CLE | BAL @ CLE | 51.5% | 3 | -2.5 |
| 9 | TEN | TEN @ IND | 51.1% | -7 | 6.6 |
| 10 | NYG | NO @ NYG | 50.7% | 1 | -0.7 |
| 11 | PHI | CAR @ PHI | 50.4% | 3.5 | -3.4 |
| 12 | GB | DAL @ GB | 50.2% | -1.5 | 1.6 |
| 13 | ATL | CHI @ ATL | 50.2% | 1 | -0.9 |

### Totals

| Rank | Total | Game | Model % | Market total | Model total |
|---:|---|---:|---:|---:|---:|
| 1 | Over | CHI @ ATL | 52.1% | 51.5 | 52.2 |
| 2 | Under | BAL @ CLE | 51.7% | 40.5 | 39.9 |
| 3 | Over | CAR @ PHI | 51.6% | 39 | 39.5 |
| 4 | Under | NYJ @ NE | 51.3% | 43.5 | 43.1 |
| 5 | Over | NO @ NYG | 51.3% | 46 | 46.4 |
| 6 | Under | TEN @ IND | 51.0% | 44 | 43.7 |
| 7 | Under | LAC @ KC | 50.8% | 41.5 | 41.2 |
| 8 | Over | DAL @ GB | 50.8% | 53.5 | 53.7 |
| 9 | Over | HOU @ JAX | 50.6% | 42.5 | 42.7 |
| 10 | Under | WAS @ SF | 50.6% | 51.5 | 51.3 |
| 11 | Under | BUF @ LV | 50.3% | 53.5 | 53.4 |
| 12 | Over | PIT @ TB | 50.1% | 39 | 39.0 |
| 13 | Over | ARI @ LAR | 50.0% | 52 | 52.0 |

## Warnings

- no SuperContest lines file for week 6: contest field is null

## Required human review

- Reprice every row at the intended book immediately before any separate proposal.
- Apply current inactive news; the availability file is a gate, not an automatic point-spread override.
- Review expert/podcast/split conflicts game by game; they were not converted into pseudo-probabilities.
- Do not use this game-level model to infer player-prop probabilities. Player projections require a separate player-volume model and line-specific calibration.
