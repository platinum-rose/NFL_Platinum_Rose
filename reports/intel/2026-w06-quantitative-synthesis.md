# Week 6 Quantitative Synthesis — Proposed Analysis

Generated 2026-10-14T07:39:00.102Z. **Not an official card, pool entry, ticket, or execution instruction.**

## What this pass actually uses

- FTN rendered exports: 36 tables / 4,634 rows, captured through 2026-10-13T18:14:42.627Z.
- BKR market anchor: 2026-10-14T07:20:00.000Z (board filename time, PT, approximate); 14 games with lines.
- Current season SRS / net-point / Pythagorean power ensemble: 2026-10-13T06:07:42.390Z.
- Week 6 secondary-matchup evidence, capped to prevent manual injury notes from overwhelming the market.
- Current availability as a gate/context layer.

**Distribution:** exact calibrated pmf (no sampling; key-number aware; pushes tracked; ranking uses cover % excluding pushes). The model blends 60% market, 25% FTN team analytics, and 15% SRS margin; it is provisional and unbacktested, so probability is a comparison signal—not a claim of calibrated edge. Podcast, expert, splits, stale DVOA, and stale coaching inputs are retained as qualitative review context only.

## Game projections and simulation outputs

| Game | Mean score | BKR spread / total | Preferred side | Cover % | Preferred total | Total % |
|---|---:|---|---|---:|---|---:|
| SEA @ DEN | SEA 21.3–DEN 19.3 | DEN 2.5 / 41 | DEN | 51.2% | Under | 51.4% |
| HOU @ JAX | HOU 19.2–JAX 23.6 | JAX -2.5 / 42.5 | JAX | 55.1% | Over | 50.8% |
| CHI @ ATL | CHI 26.0–ATL 24.1 | ATL 3 / 49.5 | ATL | 53.3% | Over | 51.8% |
| BAL @ CLE | BAL 22.6–CLE 18.8 | CLE 5 / 41.5 | CLE | 53.4% | Under | 50.5% |
| TEN @ IND | TEN 18.6–IND 25.2 | IND -7 / 44 | TEN | 50.9% | Under | 50.6% |
| NYJ @ NE | NYJ 18.4–NE 24.9 | NE -7.5 / 43.5 | NYJ | 52.7% | Under | 50.7% |
| NO @ NYG | NO 23.0–NYG 22.7 | NYG 1 / 45.5 | NYG | 51.8% | Over | 50.6% |
| CAR @ PHI | CAR 21.4–PHI 19.7 | PHI 1 / 40.5 | CAR | 51.9% | Over | 51.6% |
| PIT @ TB | PIT 20.6–TB 19.0 | TB 2.5 / 39.5 | TB | 52.3% | Over | 50.1% |
| ARI @ LAR | ARI 20.3–LAR 31.5 | LAR -13.5 / 52 | ARI | 56.8% | Under | 50.4% |
| BUF @ LV | BUF 28.2–LV 25.4 | LV 4 / 53.5 | LV | 53.2% | Over | 50.2% |
| LAC @ KC | LAC 16.6–KC 25.7 | KC -8 / 43 | KC | 53.0% | Under | 52.2% |
| DAL @ GB | DAL 25.8–GB 27.8 | GB -1.5 / 53.5 | GB | 51.4% | Over | 50.4% |
| WAS @ SF | WAS 20.9–SF 30.0 | SF -7.5 / 51 | SF | 54.4% | Under | 50.2% |

## Ranked model menus (not recommendations)

### Sides

| Rank | Side | Game | Model cover % | Market home spread | Model home margin |
|---:|---|---|---:|---:|---:|
| 1 | ARI | ARI @ LAR | 56.8% | -13.5 | 11.2 |
| 2 | JAX | HOU @ JAX | 55.1% | -2.5 | 4.5 |
| 3 | SF | WAS @ SF | 54.4% | -7.5 | 9.1 |
| 4 | CLE | BAL @ CLE | 53.4% | 5 | -3.8 |
| 5 | ATL | CHI @ ATL | 53.3% | 3 | -1.8 |
| 6 | LV | BUF @ LV | 53.2% | 4 | -2.8 |
| 7 | KC | LAC @ KC | 53.0% | -8 | 9.0 |
| 8 | NYJ | NYJ @ NE | 52.7% | -7.5 | 6.5 |
| 9 | TB | PIT @ TB | 52.3% | 2.5 | -1.6 |
| 10 | CAR | CAR @ PHI | 51.9% | 1 | -1.7 |
| 11 | NYG | NO @ NYG | 51.8% | 1 | -0.3 |
| 12 | GB | DAL @ GB | 51.4% | -1.5 | 2.0 |
| 13 | DEN | SEA @ DEN | 51.2% | 2.5 | -2.0 |
| 14 | TEN | TEN @ IND | 50.9% | -7 | 6.7 |

### Totals

| Rank | Total | Game | Model % | Market total | Model total |
|---:|---|---:|---:|---:|---:|
| 1 | Under | LAC @ KC | 52.2% | 43 | 42.3 |
| 2 | Over | CHI @ ATL | 51.8% | 49.5 | 50.1 |
| 3 | Over | CAR @ PHI | 51.6% | 40.5 | 41.0 |
| 4 | Under | SEA @ DEN | 51.4% | 41 | 40.5 |
| 5 | Over | HOU @ JAX | 50.8% | 42.5 | 42.8 |
| 6 | Under | NYJ @ NE | 50.7% | 43.5 | 43.3 |
| 7 | Under | TEN @ IND | 50.6% | 44 | 43.8 |
| 8 | Over | NO @ NYG | 50.6% | 45.5 | 45.7 |
| 9 | Under | BAL @ CLE | 50.5% | 41.5 | 41.3 |
| 10 | Under | ARI @ LAR | 50.4% | 52 | 51.9 |
| 11 | Over | DAL @ GB | 50.4% | 53.5 | 53.6 |
| 12 | Over | BUF @ LV | 50.2% | 53.5 | 53.6 |
| 13 | Under | WAS @ SF | 50.2% | 51 | 50.9 |
| 14 | Over | PIT @ TB | 50.1% | 39.5 | 39.5 |

## Warnings

- no SuperContest lines file for week 6: contest field is null
- no master-intel pull for week 6: podcast accounting omitted

## Required human review

- Reprice every row at the intended book immediately before any separate proposal.
- Apply current inactive news; the availability file is a gate, not an automatic point-spread override.
- Review expert/podcast/split conflicts game by game; they were not converted into pseudo-probabilities.
- Do not use this game-level model to infer player-prop probabilities. Player projections require a separate player-volume model and line-specific calibration.
