---
name: nfl-futures-report
description: Generate or regenerate the NFL Futures Intel Report on demand throughout the season. Load when the user asks to "regenerate the futures report", "rebuild futures", "refresh futures intel", "run the futures report", or wants an updated futures analysis across Super Bowl / conference / division / win totals / playoffs / matchup / most & least wins. Covers running the ingest + report pipeline and triggering it via GitHub Actions.
compatibility: Platinum Rose NFL Dashboard (agents/futures-intel-report-v2.js)
metadata:
  author: andrewlrose
  version: "1.0"
  season: "2026"
---

# NFL Futures Intel Report — On-Demand Regeneration

> **Load this skill when:** Andy asks to (re)generate, rebuild, or refresh the NFL Futures
> Intel Report, or wants an updated futures analysis. This runs the v2 report pipeline and
> writes the result to Supabase so the dashboard **Futures Report** tab updates automatically.

## What the report contains
All 8 tracked categories — Super Bowl winner, conference winners, division winners, total team
wins, to make the playoffs, Super Bowl exact matchup, most wins, least wins — plus a **coverage
audit** (which intel sources produced data), **line movement**, **sharp/public value spots**,
**recommendations grouped by expert/source**, and a per-category **verdict** (Claude narrative
when `ANTHROPIC_API_KEY` is set, deterministic otherwise).

## Two ways to regenerate

### A. Cloud (preferred — no local env needed)
Trigger the GitHub Actions workflow; it runs the agent and writes to Supabase.

```bash
# Requires a GitHub token with Actions:write on platinum-rose/NFL_Platinum_Rose
gh workflow run futures-intel-report.yml \
  -f trigger=skill -f season=2026 -f dry_run=false
```

The dashboard's **Futures Report** tab "Regenerate" button does the same thing via the
`dispatch-futures-report` Supabase edge function.

### B. Local (from the repo, M6 or workstation)
Run from the `NFL_Dashboard` repo root. Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
in `.env` (and optionally `ANTHROPIC_API_KEY` for the narrative layer).

```bash
# Full report → writes Supabase futures_reports + vault_notes + local .nfl/reports/*.html
node agents/futures-intel-report-v2.js --season 2026 --trigger skill

# Preview without writing to Supabase
node agents/futures-intel-report-v2.js --season 2026 --dry-run

# Offline format/layout check with synthetic data (no DB, no network)
node agents/futures-intel-report-v2.js --sample
```

### Fresh intel first (optional, when you want the very latest before reporting)
```bash
node agents/futures-odds-ingest.js --season 2026   # sportsbook futures lines
node agents/research-intel-ingest.js               # articles / RSS
node agents/tweet-ingest.js                        # if new tweets were pasted
# then run the report (A or B above)
```

## Options / env
| Flag / env | Meaning | Default |
|---|---|---|
| `--season <yr>` | NFL season | current year |
| `--trigger <s>` | origin tag stored on the report (`scheduled`/`on_demand_ui`/`skill`/`manual`) | `scheduled` |
| `--dry-run` | build but skip Supabase writes | off |
| `--sample` | synthetic data, no DB/network (layout review) | off |
| `INTEL_LOOKBACK_DAYS` | article window | 30 |
| `REPORT_LOOKBACK_DAYS` | tweets + line-movement window | 7 |
| `ANTHROPIC_API_KEY` | enables Claude narrative verdicts | — |
| `FUTURES_NARRATIVE_MODEL` | narrative model | claude-sonnet-4-6 |

## Outputs
- **Supabase** `futures_reports` (html + markdown + structured model) — read by the dashboard tab.
- **Supabase** `vault_notes` → `NFL/Futures/FuturesIntel-Latest.md` (+ dated).
- **Local** `.nfl/reports/FuturesIntel-<date>.html` (review artifact) + `.nfl/receipts/`.

## Notes & current limits
- **Most/Least/Total wins** use a labelled **proxy** ranking from the Super Bowl market until the
  win-total *line* is captured (Phase 1.5 — `totals`-market parsing). The report flags this.
- **Email newsletters** and **automated sharp-tweet** ingestion are **deferred** — the coverage
  audit shows them as such every run so nothing is silently missing.
- Win/playoffs/matchup markets open on TheOddsAPI ~Jul–Aug; before then those tables read "no
  data in window," which is expected in the offseason.
- Pipeline plan & the Phase 4 deep-analysis spec: `docs/FUTURES_REPORT_PLAN.md`.
