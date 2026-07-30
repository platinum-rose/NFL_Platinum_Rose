---
name: nfl-pipeline-ops
description: Operational reference for GitHub Actions, npm scripts, and agent pipelines.
---

# NFL Pipeline Operations

**When to Activate:** Read this skill when working with CI/CD pipelines, automated data ingestion, GitHub Actions, or when troubleshooting data freshness issues.

## GitHub Actions Workflows
Located in `.github/workflows/`, these run on automated schedules or triggers:
- **`odds-ingest.yml`**: Polls TheOddsAPI, writes odds snapshots to Supabase.
- **`game-odds-ingest.yml`**: Game-specific odds ingestion.
- **`nfl-auto-grade.yml`**: Polls ESPN scoreboard, grades pending user picks.
- **`futures-odds-ingest.yml`**: Daily futures odds refresh.
- **`podcast-ingest.yml`**: Weekly podcast transcription + pick extraction.
- **`pick-extraction.yml`**: Promotes podcast picks to `user_picks` table.
- **`nfl-roster-refresh.yml` / `injury-ingest.yml`**: Maintains team and player status.
- **`nflverse-data-refresh.yml`**: Refreshes core statistics.
- **`smoke-test.yml`**: Runs basic pipeline validation.

## Key NPM Scripts
The `package.json` contains numerous pipeline scripts:
- **Ingestion**: 
  - `npm run ingest-schedule:full`
  - `npm run ingest-futures`
  - `npm run ingest-win-totals`
  - `npm run fetch:nflverse` (Python script runner)
- **Reporting & Intel**:
  - `npm run futures-report`
  - `npm run daily-brief`
  - `npm run training-camp:report`
- **Testing & Validation**:
  - `npm run test:smoke` (Playwright E2E)
  - `npm run smoke:season` (Season readiness check)
  - `npm run test:coverage` (Vitest coverage)
- **Podcasts & YouTube**:
  - `npm run youtube:sweep`
  - `npm run podcast:gemini-intel`
- **Official Picks Management**:
  - `npm run official:picks:validate`
  - `npm run official:picks:approve`

## Tier 1 Product Agents (Manifests)
Located in `agents/manifests/`, these JSON files define tools and instructions for in-app agents:
- `betting.manifest.json`: Tools for `get_odds`, `get_line_movement`, `analyze_matchup`, `log_pick`, etc.
- `props.manifest.json`: Tools for `get_player_props`, `build_sgp`, `log_prop`, etc.
- `futures.manifest.json`: Manifest for the futures agent capabilities.

Always verify script functionality locally (e.g., using `:dry` variants like `ingest-futures:dry`) before committing changes to pipeline operations.
