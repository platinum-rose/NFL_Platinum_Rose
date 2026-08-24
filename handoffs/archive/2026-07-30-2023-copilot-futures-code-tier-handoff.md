# Copilot Handoff — Futures Data-Package `code`-Tier Sprint

- **Platform:** VS Code Copilot (Claude)
- **Date:** 2026-07-30 20:23 local / 2026-07-31T03:23:42Z
- **Branch:** `main`
- **Pushed HEAD:** `a5eb4a7` (pushed `40aa6b1..a5eb4a7`, origin/main up to date)
- **Spec doc:** `docs/FUTURES_DATA_PACKAGE_DEPTH_EXPANSION_2026-07-30.md`

## Pick Up Here

Continued the futures data-package depth-expansion sprint, shipping the remaining
high-leverage `code`-tier items. Five commits landed and are pushed:

| Commit | Item | Deliverable |
| --- | --- | --- |
| `b65e640` | P0 | Series-targeted Kalshi + Polymarket tag/public-search fetch fix — `build-prediction-markets.js` (1993 contracts, 745 mapped) |
| `a963cb8` | Expansion A | `build-regression-signals.js` — Pythagorean (exp 2.37) + one-score record, 32 teams |
| `afad9c9` | Expansion C | `fetch_nflverse_data.py` now pulls `snap_counts` + `depth_charts` (53k / 591k rows) |
| `c489998` | Expansion F | `build-cross-market-coherence.js` — devig + ladder-monotonicity + SB≤Conf≤Playoffs nesting; 32 teams, `edge_type: math` |
| `a5eb4a7` | Expansion B | `build-power-ratings.js` — fills dead `power_rating.model_rank` via SRS + net-PPG + Pythagorean z-ensemble; market-vs-model `delta` for coherent-market teams |

All builders: ESLint clean, smoke-run validated, doc status rows annotated.
Generated outputs (`data/generated/team-profiles/*`, `data/prediction-markets/*`)
are gitignored by repo convention — only scripts + doc are tracked.

## Remaining `code`-Tier Backlog (priority order)

1. **A · pbp luck half** — turnover margin / RZ-TD% / 3rd-down-over-expected are still
   `null` in `build-regression-signals.js`. Needs a local seed run of
   `scripts/seed-historical-stats.py` WITHOUT `--no-pbp` (CI skips pbp). Once the
   play-by-play layer lands in `data/vault-seed/nflverse/`, wire the fields in
   `toSnapshot()`.
2. **C · derivation builder** — returning-production % (snaps/rec-yds/carries returning)
   plus `roster.qb_depth` mapping. Now unblocked: `snap_counts.csv` (has `offense_pct`/
   `defense_pct`/`st_pct`) + `depth_charts.csv` (has `pos_rank`) are fetched.
3. **B · forward projections** — scrape/ingest FPI / nfelo / DVOA-proj + a full
   win-totals feed (`agents/win-totals-ingest.js` → `data/win-totals/<season>.json`,
   currently template-only) to replace the prior-season SRS proxy in `model_rank` and
   widen `delta` beyond the 17 coherent-market teams.
4. Migration-044 pbp column population; Backlog #2 / #5 / #8 (`docs/NFL_AUDIT_BACKLOG.md`).

## Guardrails Observed

- No `git add -A` — all commits used explicit pathspec (shared index w/ parallel
  Codex/Gemini agents). New files `git add -- <path>` first.
- No Supabase writes, no paid/frontier model calls, no pick persistence.
- `HANDOFF.md` + `HANDOFF_PROMPT.md` left untouched (Codex-owned this sprint) — this
  handoff is a new timestamped file per repo convention.
- Uncommitted tree is dirty by parallel-agent activity + my gitignored generated data;
  staged narrowly.

## Resume Command

```text
Resume Platinum Rose NFL. HEAD = a5eb4a7 (main), pushed. Futures data-package code-tier
sprint: P0 + Expansions A/C/F/B shipped. Next code-tier: A pbp luck half (non-`--no-pbp`
seed), then C derivation (snap_counts/depth_charts now fetched), then B forward
projections. Read docs/FUTURES_DATA_PACKAGE_DEPTH_EXPANSION_2026-07-30.md + latest
handoffs/ file before touching any file.
```
