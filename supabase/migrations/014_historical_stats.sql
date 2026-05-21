-- F-15: Historical NFL Stats Tables
-- Migration: 014_historical_stats.sql
--
-- Two tables:
--   nfl_team_season_stats   — season-level team record + ATS + O/D rankings
--   nfl_player_season_stats — season-level per-player skill stats
--
-- Both upsert on (season, team) and (season, player_id, team) respectively.
-- ATS fields are optional — populated when odds snapshots are available.
-- Source column tracks which pipeline wrote the row ('nfl-data-py', 'manual', etc.)

-- ─── Team season stats ────────────────────────────────────────────────────────

create table if not exists public.nfl_team_season_stats (
  id                     bigserial primary key,
  season                 smallint  not null,             -- 4-digit year, e.g. 2024
  team                   text      not null,             -- nflfastR abbreviation, e.g. 'KC'

  -- Record
  games                  smallint  not null default 17,
  wins                   smallint,
  losses                 smallint,
  ties                   smallint  not null default 0,

  -- Offense (per-game averages)
  points_for_pg          numeric(5,2),
  yards_pg               numeric(6,2),
  pass_yards_pg          numeric(6,2),
  rush_yards_pg          numeric(6,2),
  third_down_pct         numeric(5,3),
  red_zone_pct           numeric(5,3),

  -- Defense (per-game averages allowed)
  points_against_pg      numeric(5,2),
  yards_allowed_pg       numeric(6,2),
  pass_yards_allowed_pg  numeric(6,2),
  rush_yards_allowed_pg  numeric(6,2),
  opp_third_down_pct     numeric(5,3),
  opp_red_zone_pct       numeric(5,3),

  -- EPA (expected points added per play — from nflfastR PBP)
  off_epa_per_play       numeric(7,4),
  def_epa_per_play       numeric(7,4),

  -- ATS (populated from odds_snapshots join; null until seeded)
  ats_wins               smallint,
  ats_losses             smallint,
  ats_pushes             smallint,
  home_ats_record        text,            -- e.g. '6-3-0'
  away_ats_record        text,

  -- O/U (over/under record)
  over_count             smallint,
  under_count            smallint,
  push_count             smallint,

  -- League rankings (1 = best, 32 = worst) — populated post-aggregation
  off_rank               smallint,
  def_rank               smallint,
  points_for_rank        smallint,
  points_against_rank    smallint,
  off_epa_rank           smallint,
  def_epa_rank           smallint,

  -- Metadata
  source                 text      not null default 'nfl-data-py',
  updated_at             timestamptz not null default now(),

  unique (season, team)
);

-- Efficient look-ups by season, by team across seasons
create index if not exists nfl_team_season_stats_season_idx
  on public.nfl_team_season_stats (season desc, off_epa_rank);

create index if not exists nfl_team_season_stats_team_idx
  on public.nfl_team_season_stats (team, season desc);

comment on table public.nfl_team_season_stats is
  'Season-level aggregated team stats. ATS fields require odds snapshot join.';

-- ─── Player season stats ──────────────────────────────────────────────────────

create table if not exists public.nfl_player_season_stats (
  id                bigserial primary key,
  season            smallint  not null,
  player_id         text      not null,   -- nflfastR gsis_id (canonical)
  player_name       text      not null,
  position          text      not null,   -- QB, RB, WR, TE
  team              text      not null,

  games             smallint,
  snap_pct          numeric(5,3),         -- 0.0–1.0

  -- Passing (QBs)
  completions       smallint,
  attempts          smallint,
  pass_yards        int,
  pass_tds          smallint,
  interceptions     smallint,
  sacks             smallint,
  comp_pct          numeric(5,3),
  passer_rating     numeric(6,2),
  epa_per_dropback  numeric(7,4),
  cpoe              numeric(6,3),         -- completion % over expected

  -- Rushing
  carries           smallint,
  rush_yards        int,
  rush_tds          smallint,
  ypc               numeric(5,2),         -- yards per carry
  rush_epa          numeric(7,4),

  -- Receiving
  targets           smallint,
  receptions        smallint,
  rec_yards         int,
  rec_tds           smallint,
  ypr               numeric(5,2),         -- yards per reception
  air_yards         int,                  -- total air yards on targets
  yac               int,                  -- yards after catch
  rec_epa           numeric(7,4),
  adot              numeric(5,2),         -- avg depth of target

  -- Metadata
  source            text       not null default 'nfl-data-py',
  updated_at        timestamptz not null default now(),

  unique (season, player_id, team)
);

create index if not exists nfl_player_season_stats_season_pos_idx
  on public.nfl_player_season_stats (season desc, position, rec_yards desc);

create index if not exists nfl_player_season_stats_player_idx
  on public.nfl_player_season_stats (player_id, season desc);

create index if not exists nfl_player_season_stats_team_idx
  on public.nfl_player_season_stats (team, season desc);

comment on table public.nfl_player_season_stats is
  'Season-level skill position stats from nfl-data-py / nflfastR. Covers 2020+.';

-- ─── Convenience view: team ATS summary ───────────────────────────────────────

create or replace view public.v_team_ats_summary as
select
  team,
  season,
  wins,
  losses,
  ats_wins,
  ats_losses,
  ats_pushes,
  home_ats_record,
  away_ats_record,
  case
    when (ats_wins + ats_losses) > 0
    then round(ats_wins::numeric / (ats_wins + ats_losses) * 100, 1)
  end as ats_win_pct,
  off_epa_rank,
  def_epa_rank,
  off_rank,
  def_rank
from public.nfl_team_season_stats
where ats_wins is not null
order by season desc, ats_wins desc;

comment on view public.v_team_ats_summary is
  'Quick ATS reference per team per season for the BETTING agent.';

-- ─── Row Level Security ────────────────────────────────────────────────────────
-- Data is public NFL stats (no PII).  Enable RLS with a blanket read-only
-- policy so anon/authenticated keys can query freely.  Write access is
-- service_role only (the seed script), which bypasses RLS entirely.

alter table public.nfl_team_season_stats enable row level security;
alter table public.nfl_player_season_stats enable row level security;

create policy "Public read-only"
  on public.nfl_team_season_stats for select using (true);

create policy "Public read-only"
  on public.nfl_player_season_stats for select using (true);
