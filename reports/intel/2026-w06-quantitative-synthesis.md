# Week 6 Quantitative Synthesis — Proposed Analysis

Generated 2026-10-13T21:42:30.300Z. **Not an official card, pool entry, ticket, or execution instruction.**

## What this pass actually uses

- FTN rendered exports: 36 tables / 4,634 rows, captured through 2026-10-13T18:14:42.627Z.
- BKR market anchor: 2026-10-13T14:00:00.000Z (board filename time, PT, approximate); 14 games with lines.
- Current season SRS / net-point / Pythagorean power ensemble: 2026-10-13T06:07:42.390Z.
- No Week 6 secondary-matchup file: secondary term is zero.
- Current availability as a gate/context layer.

**Distribution:** exact calibrated pmf (no sampling; key-number aware; pushes tracked; ranking uses cover % excluding pushes). The model blends 60% market, 25% FTN team analytics, and 15% SRS margin; it is provisional and unbacktested, so probability is a comparison signal—not a claim of calibrated edge. Podcast, expert, splits, stale DVOA, and stale coaching inputs are retained as qualitative review context only.

## Game projections and simulation outputs

| Game | Mean score | BKR spread / total | Preferred side | Cover % | Preferred total | Total % |
|---|---:|---|---|---:|---|---:|
| SEA @ DEN | SEA 21.6–DEN 19.2 | DEN 3 / 41 | DEN | 51.5% | Under | 50.7% |
| HOU @ JAX | HOU 19.1–JAX 23.5 | JAX -2.5 / 42.5 | JAX | 55.0% | Over | 50.2% |
| CHI @ ATL | CHI 25.9–ATL 23.7 | ATL 3 / 49.5 | ATL | 52.4% | Over | 50.3% |
| BAL @ CLE | BAL 23.0–CLE 18.9 | CLE 5 / 42 | CLE | 52.6% | Under | 50.3% |
| TEN @ IND | TEN 18.7–IND 25.0 | IND -7 / 44 | TEN | 52.1% | Under | 50.7% |
| NYJ @ NE | NYJ 18.6–NE 25.2 | NE -7.5 / 44 | NYJ | 52.7% | Under | 50.6% |
| NO @ NYG | NO 22.9–NYG 22.6 | NYG 1 / 45.5 | NYG | 52.0% | Over | 50.2% |
| CAR @ PHI | CAR 21.7–PHI 20.8 | PHI -1 / 42.5 | CAR | 55.2% | Over | 50.0% |
| PIT @ TB | PIT 21.0–TB 19.4 | TB 2.5 / 40.5 | TB | 52.4% | Under | 50.4% |
| ARI @ LAR | ARI 21.2–LAR 31.4 | LAR -12.5 / 52.5 | ARI | 56.8% | Over | 50.3% |
| BUF @ LV | BUF 29.0–LV 24.8 | LV 6 / 53.5 | LV | 55.1% | Over | 50.9% |
| LAC @ KC | LAC 16.7–KC 25.7 | KC -8 / 42.5 | KC | 53.0% | Under | 50.2% |
| DAL @ GB | DAL 26.0–GB 27.5 | GB -1 / 53.5 | GB | 51.3% | Over | 50.2% |
| WAS @ SF | WAS 20.8–SF 30.2 | SF -7.5 / 51 | SF | 55.2% | Over | 50.1% |

## Ranked model menus (not recommendations)

### Sides

| Rank | Side | Game | Model cover % | Market home spread | Model home margin |
|---:|---|---|---:|---:|---:|
| 1 | ARI | ARI @ LAR | 56.8% | -12.5 | 10.2 |
| 2 | CAR | CAR @ PHI | 55.2% | -1 | -1.0 |
| 3 | SF | WAS @ SF | 55.2% | -7.5 | 9.3 |
| 4 | LV | BUF @ LV | 55.1% | 6 | -4.2 |
| 5 | JAX | HOU @ JAX | 55.0% | -2.5 | 4.4 |
| 6 | KC | LAC @ KC | 53.0% | -8 | 9.0 |
| 7 | NYJ | NYJ @ NE | 52.7% | -7.5 | 6.5 |
| 8 | CLE | BAL @ CLE | 52.6% | 5 | -4.1 |
| 9 | TB | PIT @ TB | 52.4% | 2.5 | -1.6 |
| 10 | ATL | CHI @ ATL | 52.4% | 3 | -2.2 |
| 11 | TEN | TEN @ IND | 52.1% | -7 | 6.3 |
| 12 | NYG | NO @ NYG | 52.0% | 1 | -0.3 |
| 13 | DEN | SEA @ DEN | 51.5% | 3 | -2.5 |
| 14 | GB | DAL @ GB | 51.3% | -1 | 1.5 |

### Totals

| Rank | Total | Game | Model % | Market total | Model total |
|---:|---|---:|---:|---:|---:|
| 1 | Over | BUF @ LV | 50.9% | 53.5 | 53.8 |
| 2 | Under | TEN @ IND | 50.7% | 44 | 43.8 |
| 3 | Under | SEA @ DEN | 50.7% | 41 | 40.8 |
| 4 | Under | NYJ @ NE | 50.6% | 44 | 43.8 |
| 5 | Under | PIT @ TB | 50.4% | 40.5 | 40.4 |
| 6 | Over | ARI @ LAR | 50.3% | 52.5 | 52.6 |
| 7 | Over | CHI @ ATL | 50.3% | 49.5 | 49.6 |
| 8 | Under | BAL @ CLE | 50.3% | 42 | 41.9 |
| 9 | Under | LAC @ KC | 50.2% | 42.5 | 42.4 |
| 10 | Over | HOU @ JAX | 50.2% | 42.5 | 42.6 |
| 11 | Over | DAL @ GB | 50.2% | 53.5 | 53.6 |
| 12 | Over | NO @ NYG | 50.2% | 45.5 | 45.6 |
| 13 | Over | WAS @ SF | 50.1% | 51 | 51.0 |
| 14 | Over | CAR @ PHI | 50.0% | 42.5 | 42.5 |

## Warnings

- no secondary-matchup file for week 6: secondary term is zero (no fallback to an older week)
- no SuperContest lines file for week 6: contest field is null
- no master-intel pull for week 6: podcast accounting omitted

## Required human review

- Reprice every row at the intended book immediately before any separate proposal.
- Apply current inactive news; the availability file is a gate, not an automatic point-spread override.
- Review expert/podcast/split conflicts game by game; they were not converted into pseudo-probabilities.
- Do not use this game-level model to infer player-prop probabilities. Player projections require a separate player-volume model and line-specific calibration.
