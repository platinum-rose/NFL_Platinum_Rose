-- ═══════════════════════════════════════════════════════════════════════════════
-- 047_fantasy_projections.sql — FantasyPros consensus season/weekly projections
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- F-26c §3. Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §3
-- Source: GET /nfl/{season}/projections — a different, independent path to the
-- same "value board" output the Phase A history regression produces
-- (agents/fantasy-value-report.js), NOT a replacement for it by default. The
-- API pre-computes points/points_ppr/points_half per player, so no scoring
-- formula needs to be implemented on our side for this source.
--
-- `week` follows the same convention as fantasy_rankings (046): 0 = season-long
-- preseason projection, else the NFL week number. `ros` (rest-of-season) is a
-- separate boolean, not folded into week, since the API exposes it as its own
-- query param (?ros=true|false) independent of week.
--
-- Field names on this endpoint differ from consensus-rankings (`fpid`/`name`
-- here vs `player_id`/`player_name` there) — this table's `fpid` column keeps
-- the raw FantasyPros id as-received rather than trying to force it into the
-- `player_id` convention fantasy_adp/fantasy_rankings use for a resolved
-- nflverse gsis id (join-key resolution happens the same way those tables do,
-- by name, via agents/fantasypros-projections-ingest.js's resolveIds()).
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.fantasy_projections (
  id            bigserial   primary key,
  player_id     text,                      -- nflverse gsis id when resolvable (else name-join), same convention as fantasy_adp/fantasy_rankings
  fpid          text,                      -- FantasyPros' own player id (raw, from the API) — distinct join key, see header
  player        text        not null,
  position      text        not null,
  team          text,
  season        int         not null,
  week          int         not null default 0,  -- 0 = preseason/season-long; else the NFL week number
  ros           boolean     not null default false,
  rec           numeric, rec_yds numeric, rec_td numeric,
  rush_att      numeric, rush_yds numeric, rush_td numeric,
  pass_att      numeric, pass_cmp numeric, pass_yds numeric, pass_td numeric, interceptions numeric,
  fumbles_lost  numeric,
  proj_std      numeric,                   -- API's own `points` (standard scoring)
  proj_ppr      numeric,                   -- API's own `points_ppr`
  proj_half     numeric,                   -- API's own `points_half`
  source        text        not null default 'fantasypros',
  as_of_date    date        not null default current_date,
  created_at    timestamptz not null default now(),

  unique (player, position, season, week, ros, source, as_of_date)
);
create index if not exists fantasy_projections_latest_idx
  on public.fantasy_projections (season, week desc, position, as_of_date desc);

alter table public.fantasy_projections enable row level security;
create policy "public_read_fantasy_projections" on public.fantasy_projections for select using (true);
