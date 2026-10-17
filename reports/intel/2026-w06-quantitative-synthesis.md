# Week 6 Quantitative Synthesis — Proposed Analysis

Generated 2026-10-17T02:36:52.349Z. **Not an official card, pool entry, ticket, or execution instruction.**

## What this pass actually uses

- FTN rendered exports: 74 tables / 9,309 rows, captured through 2026-10-13T18:14:26.478Z.
- BKR market anchor: 2026-10-17T02:33:00.000Z (board filename time, PT, approximate); 13 games with lines.
- Current season SRS / net-point / Pythagorean power ensemble: 2026-10-13T06:07:42.390Z.
- Week 6 secondary-matchup evidence, capped to prevent manual injury notes from overwhelming the market.
- Current availability as a gate/context layer.

**Distribution:** exact calibrated pmf (no sampling; key-number aware; pushes tracked; ranking uses cover % excluding pushes). The model blends 60% market, 25% FTN team analytics, and 15% SRS margin; it is provisional and unbacktested, so probability is a comparison signal—not a claim of calibrated edge. Podcast, expert, splits, stale DVOA, and stale coaching inputs are retained as qualitative review context only.

## Game projections and simulation outputs

| Game | Mean score | BKR spread / total | Preferred side | Cover % | Preferred total | Total % |
|---|---:|---|---|---:|---|---:|
| SEA @ DEN | — | missing | — | — | — | — |
| HOU @ JAX | HOU 18.7–JAX 23.5 | JAX -2.5 / 42 | JAX | 56.2% | Over | 50.7% |
| CHI @ ATL | CHI 26.6–ATL 25.4 | ATL 1 / 51.5 | CHI | 50.3% | Over | 51.5% |
| BAL @ CLE | BAL 21.2–CLE 18.7 | CLE 3 / 40.5 | CLE | 51.5% | Under | 51.7% |
| TEN @ IND | TEN 18.5–IND 25.1 | IND -7 / 44 | TEN | 51.1% | Under | 51.0% |
| NYJ @ NE | NYJ 18.7–NE 24.4 | NE -7 / 43.5 | NYJ | 53.6% | Under | 51.3% |
| NO @ NYG | NO 23.0–NYG 23.4 | NYG -1 / 46 | NO | 51.4% | Over | 51.3% |
| CAR @ PHI | CAR 21.3–PHI 18.2 | PHI 3 / 39 | CAR | 50.2% | Over | 51.7% |
| PIT @ TB | PIT 20.4–TB 18.9 | TB 2.5 / 39 | TB | 52.8% | Over | 51.0% |
| ARI @ LAR | ARI 20.3–LAR 31.7 | LAR -13.5 / 52 | ARI | 56.2% | Under | 50.2% |
| BUF @ LV | BUF 28.0–LV 25.4 | LV 4.5 / 53.5 | LV | 55.0% | Under | 50.3% |
| LAC @ KC | LAC 16.0–KC 25.3 | KC -7.5 / 41.5 | KC | 54.9% | Under | 50.7% |
| DAL @ GB | DAL 25.8–GB 27.4 | GB -1.5 / 53 | GB | 50.2% | Over | 50.8% |
| WAS @ SF | WAS 21.1–SF 30.1 | SF -7.5 / 51.5 | SF | 54.0% | Under | 50.9% |

## Ranked model menus (not recommendations)

### Sides

| Rank | Side | Game | Model cover % | Market home spread | Model home margin |
|---:|---|---|---:|---:|---:|
| 1 | ARI | ARI @ LAR | 56.2% | -13.5 | 11.4 |
| 2 | JAX | HOU @ JAX | 56.2% | -2.5 | 4.8 |
| 3 | LV | BUF @ LV | 55.0% | 4.5 | -2.6 |
| 4 | KC | LAC @ KC | 54.9% | -7.5 | 9.3 |
| 5 | SF | WAS @ SF | 54.0% | -7.5 | 8.9 |
| 6 | NYJ | NYJ @ NE | 53.6% | -7 | 5.8 |
| 7 | TB | PIT @ TB | 52.8% | 2.5 | -1.4 |
| 8 | CLE | BAL @ CLE | 51.5% | 3 | -2.5 |
| 9 | NO | NO @ NYG | 51.4% | -1 | 0.5 |
| 10 | TEN | TEN @ IND | 51.1% | -7 | 6.6 |
| 11 | CHI | CHI @ ATL | 50.3% | 1 | -1.1 |
| 12 | GB | DAL @ GB | 50.2% | -1.5 | 1.6 |
| 13 | CAR | CAR @ PHI | 50.2% | 3 | -3.1 |

### Totals

| Rank | Total | Game | Model % | Market total | Model total |
|---:|---|---:|---:|---:|---:|
| 1 | Over | CAR @ PHI | 51.7% | 39 | 39.5 |
| 2 | Under | BAL @ CLE | 51.7% | 40.5 | 40.0 |
| 3 | Over | CHI @ ATL | 51.5% | 51.5 | 52.0 |
| 4 | Under | NYJ @ NE | 51.3% | 43.5 | 43.1 |
| 5 | Over | NO @ NYG | 51.3% | 46 | 46.4 |
| 6 | Under | TEN @ IND | 51.0% | 44 | 43.7 |
| 7 | Over | PIT @ TB | 51.0% | 39 | 39.3 |
| 8 | Under | WAS @ SF | 50.9% | 51.5 | 51.2 |
| 9 | Over | DAL @ GB | 50.8% | 53 | 53.3 |
| 10 | Under | LAC @ KC | 50.7% | 41.5 | 41.3 |
| 11 | Over | HOU @ JAX | 50.7% | 42 | 42.2 |
| 12 | Under | BUF @ LV | 50.3% | 53.5 | 53.4 |
| 13 | Under | ARI @ LAR | 50.2% | 52 | 51.9 |

## Warnings

- no SuperContest lines file for week 6: contest field is null

## Required human review

- Reprice every row at the intended book immediately before any separate proposal.
- Apply current inactive news; the availability file is a gate, not an automatic point-spread override.
- Review expert/podcast/split conflicts game by game; they were not converted into pseudo-probabilities.
- Do not use this game-level model to infer player-prop probabilities. Player projections require a separate player-volume model and line-specific calibration.
