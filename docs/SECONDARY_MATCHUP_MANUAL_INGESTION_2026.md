# Secondary Matchup Manual Ingestion - 2026

Purpose: prove the defensive-secondary matchup workflow before buying charting data.

This is manual/free context only. It is not a betting recommendation source by itself and does not authorize props, parlays, official picks, Supabase writes, or model calls.

## Input Files

Update these files before running the builder:

- `data/secondary-matchups/manual/coverage-schemes-2026.json`
- `data/secondary-matchups/manual/secondary-roles-2026.json`
- `data/secondary-matchups/manual/receiver-roles-2026.json`

## Coverage Scheme Rows

Use one row per team/week/source view.

Required fields:
- `team`: team abbreviation or name.
- `season`
- `week`
- `primary_coverage_family`: short label such as `man_match`, `zone_match`, `quarters`, `single_high`, `two_high`, or `match_zone`.
- `scheme_tags`: array using tags such as `man_heavy`, `zone_heavy`, `single_high`, `two_high`, `quarters`, `match_zone`, `blitz_heavy`.
- `confidence`: 0 to 1.
- `source`, `source_url`, `notes`
- `updated_at`
- `stale_after`

## Secondary Role Rows

Use one row per relevant defensive back.

Required fields:
- `team`
- `player_name`
- `position`: `CB`, `S`, or `DB`.
- `role`: `outside_cb1`, `outside_cb2`, `slot_cb`, `nickel_cb`, `deep_safety`, `free_safety`, `strong_safety`, `box_safety`, `hybrid_safety`, or `dime_db`.
- `impact_tier`: `elite`, `plus`, `starter`, `rotational`, or `depth`.
- `receiver_archetypes_impacted`: examples `alpha_x`, `z_receiver`, `slot`, `field_stretcher`, `te_middle`.
- `weakness_tags`: examples `outside_wr_boost`, `alpha_wr_boost`, `slot_wr_boost`, `deep_pass_boost`, `te_middle_boost`.
- `source_url`, `notes`

## Receiver Role Rows

Use one row per prop-relevant receiver or tight end.

Required fields:
- `team`
- `player_name`
- `position`
- `roles`: examples `alpha_x`, `z_receiver`, `slot`, `field_stretcher`, `possession`, `red_zone`, `te_middle`.
- `target_share_tier`: `alpha`, `high`, `medium`, `low`, or `unknown`.
- `route_area_tags`: examples `boundary`, `slot`, `deep`, `intermediate`, `red_zone`.
- `source_url`, `notes`

## Build Command

```powershell
npm.cmd run secondary-matchups
```

Optional:

```powershell
npm.cmd run secondary-matchups -- --week 1 --season 2026 --dry-run
```

## Output Files

- `data/secondary-matchups/latest.json`
- `data/secondary-matchups/secondary-matchup-vulnerability-2026-w01.json`
- `docs/secondary-matchups/secondary-matchup-vulnerability-latest.md`
- `docs/secondary-matchups/secondary-matchup-vulnerability-latest.html`

## How To Use

Treat the output as a shortlist for human review:

- Secondary injury to an elite outside CB can flag `outside_wr_boost`, `alpha_wr_boost`, and `boundary_wr_boost`.
- Slot/nickel CB injuries can flag `slot_wr_boost` and inside-route boosts.
- Deep-safety injuries can flag `deep_pass_boost` and post/crossing-route boosts.
- Box/hybrid safety injuries can flag `te_middle_boost` and middle-field vulnerability.

Before any bet or parlay use, verify:

- the injured defender is actually expected to miss or be limited for the target game;
- the manual role tag is current;
- the opponent receiver role is current;
- the book price is placeable and still available;
- the output is reviewed as context, not automatic authority.
