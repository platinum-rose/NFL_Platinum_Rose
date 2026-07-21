-- ═══════════════════════════════════════════════════════════════════════════════
-- NFL Platinum Rose — Current/Weekly Roster Table
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Purpose: nfl-roster-refresh-audit-2026-07. No player→current-team source
-- existed anywhere in this repo (confirmed by search) — the annual
-- nflverse-data-refresh.yml job seeds season-level STATS tables
-- (nfl_team_season_stats/nfl_player_season_stats), not roster/trade state.
-- Andy caught two real 2026 trades (Kyler Murray, Fernando Mendoza) being
-- misjudged during a review because nothing in the repo tracked current
-- roster assignments. This table is the fix: one row per (season, week,
-- game_type, player) sourced from nflverse-data's `weekly_rosters` GitHub
-- release (roster_weekly_<year>.parquet/csv — same repo
-- scripts/fetch_nflverse_data.py already pulls stats from, zero new
-- dependency), refreshed weekly via a new GH Actions workflow
-- (.github/workflows/nfl-roster-refresh.yml).
--
-- Populated by:
--   scripts/fetch_nflverse_data.py --datasets rosters_weekly  (download)
--   scripts/seed-nfl-rosters.py                                (Supabase upsert)
--
-- Grain matches the source exactly (one row per player per season/week/
-- game_type snapshot) rather than collapsing to "current only" — callers
-- that want the latest known team for a player should query
-- ORDER BY season DESC, week DESC LIMIT 1 per gsis_id (see
-- nfl_rosters_latest view below), so the full history stays queryable for
-- anything that needs "who was on this team in week 6" later.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.nfl_rosters (
  id                        uuid        primary key default gen_random_uuid(),
  season                    int         not null,
  week                      int         not null,
  game_type                 text,                       -- REG | POST | ... (nflverse game_type)
  team                      text        not null,        -- current nflverse team abbreviation
  gsis_id                   text,                        -- stable nflverse player id (nullable — not all rows have one, e.g. some UFAs)
  full_name                 text        not null,
  first_name                text,
  last_name                 text,
  position                  text,
  depth_chart_position      text,
  jersey_number             int,
  status                    text,                        -- ACT | INA | RES | UFA | ...
  status_description_abbr  text,
  years_exp                 int,
  espn_id                   text,                        -- cross-reference ids, useful for joining against other sources later
  yahoo_id                  text,                         -- (Yahoo Fantasy integration already exists in this repo)
  sleeper_id                text,
  source_updated_at         timestamptz,                  -- nflverse release's own timestamp.json value, when available
  ingested_at                timestamptz not null default now(),

  -- Natural grain of the source data. gsis_id can be null (rare), so this
  -- constraint intentionally includes full_name+team as a fallback
  -- disambiguator rather than excluding those rows from upsert safety.
  unique (season, week, game_type, team, full_name, gsis_id)
);

create index if not exists nfl_rosters_gsis_idx
  on public.nfl_rosters (gsis_id, season desc, week desc);

create index if not exists nfl_rosters_team_idx
  on public.nfl_rosters (team, season desc, week desc);

create index if not exists nfl_rosters_name_idx
  on public.nfl_rosters (full_name);

-- Convenience view: latest known row per player (by gsis_id where present),
-- i.e. "what team is this person on right now" — the actual question that
-- triggered this task. Falls back to full_name for the rare rows with no
-- gsis_id.
create or replace view public.nfl_rosters_latest as
select distinct on (coalesce(gsis_id, full_name))
  *
from public.nfl_rosters
order by coalesce(gsis_id, full_name), season desc, week desc;

-- RLS: mirror the rest of this repo's public-read tables
alter table public.nfl_rosters enable row level security;

create policy "public_read_nfl_rosters"
  on public.nfl_rosters for select
  using (true);
