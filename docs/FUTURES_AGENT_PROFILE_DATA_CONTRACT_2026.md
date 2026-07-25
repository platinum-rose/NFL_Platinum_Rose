# Futures Agent Profile Data Contract - 2026

This contract defines the structured team-profile fields that flow into `agents/portfolio-dossier.js` and then to the Futures Agent / Platinum Rose AI analyst committee.

## Dossier Shape

Each team profile can expose:

```json
{
  "team_profiles": {
    "Buffalo Bills": {
      "prior": [],
      "sos": {},
      "analytics": {},
      "dvoa": {},
      "coaching_profile": {},
      "schedule_context": {},
      "officiating_context": {},
      "clv_signal": {},
      "injuries": {}
    }
  }
}
```

Absent fields mean unavailable data, not a negative signal.

## Analytics

Source table: `team_analytic_snapshots`

Primary source strategy:

- nflverse/nflfastR play-by-play for team EPA, success rate, dropback EPA, explosive rates, and formation tendencies
- public/manual check snapshots such as rbsdm or nfelo for verification when useful
- source-stamped rows for every import

Key fields:

- `off_epa_per_play`, `def_epa_per_play`
- `off_epa_rank`, `def_epa_rank`
- `epa_per_dropback`
- `qb_epa_per_dropback`
- `dropback_success_rate`
- `success_rate`
- `cpoe`
- `explosive_play_rate`
- `pressure_rate_allowed`, `pressure_rate_generated`
- `sack_rate_allowed`, `sack_rate_generated`
- `neutral_pass_rate`, `early_down_pass_rate`
- `shotgun_rate`, `no_huddle_rate`, `play_action_rate`, `motion_rate`

Agent use:

- confirm or challenge win-loss record
- separate QB/offense signal from team-level result noise
- identify regression candidates
- support or reject win-total, playoff, division, conference, Super Bowl, side, total, and prop theses

## DVOA

Source table: `team_dvoa_snapshots`

DVOA is imported as a source-stamped snapshot. The dashboard should not pretend to compute proprietary DVOA locally.

Key fields:

- `overall_dvoa`, `overall_dvoa_rank`
- `offensive_dvoa`, `offensive_dvoa_rank`
- `defensive_dvoa`, `defensive_dvoa_rank`
- `special_teams_dvoa`, `special_teams_dvoa_rank`
- `weighted_dvoa`, `weighted_dvoa_rank`
- `source_name`, `source_url`, `snapshot_at`, `attribution_note`

Agent use:

- compare DVOA against EPA, market price, and public perception
- cite exact rank/value when making a thesis
- flag stale snapshots if newer performance contradicts them

## Coaching Profile

Source table: `team_coaching_tendency_snapshots`

The coaching library should evolve during the season. A preseason profile is a prior; a current-season profile needs sample dates and games.

Core fields:

- `head_coach`
- `offensive_coordinator`, `defensive_coordinator`
- `coordinator_continuity`
- `fourth_down_aggression_rate`, `fourth_down_aggression_tier`
- `neutral_pass_rate`, `early_down_pass_rate`
- `shotgun_rate`, `no_huddle_rate`
- `play_action_rate`, `motion_rate`, `rpo_rate`
- `pace_seconds_per_play`
- `red_zone_pass_rate`
- `two_minute_aggression_tier`
- `ats_by_role`
- `trend_notes`
- `sample_start`, `sample_end`, `games_sample`, `stale_after`

Agent use:

- identify style shifts from preseason expectations
- spot teams changing pace/pass rate/play-action/motion identity
- catch coaches reverting to old habits under injury, pressure, or weather
- support totals, props, and in-season futures timing

## Refresh Cadence

Suggested cadence:

- preseason: initial historical baseline and coordinator continuity import
- weeks 1-4: weekly refresh, but tag samples as low confidence
- weeks 5-18: weekly refresh with trend deltas versus preseason baseline
- playoffs: refresh after every round for matchup-specific pace, aggression, and injury-adjusted style

## Local Build And Seed Workflow

Local builders write review artifacts only:

```powershell
npm.cmd run profile:analytics
npm.cmd run profile:coaching
npm.cmd run profile:dvoa
```

Generated files land in `data/generated/team-profiles/`.

Dry-run the seed plan:

```powershell
npm.cmd run profile:seed:dry
```

The dry-run prints matched files, row counts, target tables, seasons, teams, and sample keys. It performs no database writes.

Live seed path, only after migration `044_platinum_rose_ai_official_picks_and_team_profiles.sql` has been applied and the user explicitly approves a Supabase write:

```powershell
node scripts/seed-team-profile-snapshots.js --season 2025 --apply
```

Do not run `--apply` as part of offline QA or report generation.

## Agent Questions

For each candidate, the agent should ask:

- Is the price placeable and timestamped?
- Is the edge supported by code-owned math, analytics, coaching, source intel, or portfolio hedge value?
- Do DVOA and EPA agree, or is the disagreement itself the thesis?
- Has the coaching profile changed materially from preseason priors?
- Is this a current play, a wait, a pair, a hedge, or a pass?
- What single fact would make this recommendation wrong?
- Does the suggested stake fit the official paper bankroll and unit rules?
