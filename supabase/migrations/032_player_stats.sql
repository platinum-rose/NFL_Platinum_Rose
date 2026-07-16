-- ═══════════════════════════════════════════════════════════════════════════════
-- 032_player_stats.sql — Player actuals for props auto-grading (+ fantasy feature)
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- Delivers three things props auto-grading needs to go live:
--   1. player_stats         — WEEKLY actuals, columns named to the PROP market keys
--                             so agents/props-auto-grade.js `select(bet.stat_column)`
--                             works with ZERO translation. Seeded by
--                             agents/player-stats-ingest.js from the nflverse CSVs.
--   2. player_season_stats  — SEASONAL rollup (fantasy value-vs-ADP feature; see
--                             docs/FANTASY_VALUE_VS_ADP_SPEC.md).
--   3. grading columns on user_bankroll_bets — the grader filters bet_type='prop'
--                             and reads stat_column/player_id/direction/line/season,
--                             none of which existed on the table (mig 004). Added
--                             here (nullable, non-breaking) so grading can run.
--
-- IMPORTANT: do NOT rename the player_stats stat columns — they are the contract
-- with props-auto-grade.js (the market key IS the column name).
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Weekly player actuals (the grader's table) ────────────────────────────
create table if not exists public.player_stats (
  id            bigserial   primary key,
  player_id     text        not null,          -- nflverse gsis id
  player_name   text,
  position      text,
  team          text,
  opponent      text,
  season        int         not null,
  week          int         not null,
  season_type   text        not null default 'REG',  -- REG | POST | PRE

  -- Stat columns named to PROP market keys (props-auto-grade selects by these) --
  player_pass_yds           numeric,
  player_pass_tds           numeric,
  player_pass_attempts      numeric,
  player_pass_completions   numeric,
  player_pass_interceptions numeric,
  player_rush_yds           numeric,
  player_rush_attempts      numeric,
  player_rush_tds           numeric,
  player_reception_yds      numeric,
  player_receptions         numeric,
  player_anytime_td         numeric,           -- rush_tds + rec_tds + special_teams_tds

  -- Context / fantasy support --
  targets        numeric,
  target_share   numeric,
  fantasy_points     numeric,
  fantasy_points_ppr numeric,

  source        text        not null default 'nflverse',
  updated_at    timestamptz not null default now(),

  unique (player_id, season, week, season_type)
);
create index if not exists player_stats_lookup_idx
  on public.player_stats (player_id, season, week);
create index if not exists player_stats_season_week_idx
  on public.player_stats (season, week);

comment on table public.player_stats is
  'Weekly player actuals. Stat columns are named to PROP market keys so props-auto-grade.js grades with no translation. Seeded from nflverse via agents/player-stats-ingest.js.';

alter table public.player_stats enable row level security;
create policy "public_read_player_stats" on public.player_stats for select using (true);

-- ─── 2. Seasonal rollup (fantasy value-vs-ADP feature) ────────────────────────
create table if not exists public.player_season_stats (
  id            bigserial   primary key,
  player_id     text        not null,
  player_name   text,
  position      text,
  team          text,
  season        int         not null,
  season_type   text        not null default 'REG',
  games         int,

  passing_yards      numeric,
  passing_tds        numeric,
  rushing_yards      numeric,
  rushing_tds        numeric,
  carries            numeric,
  receptions         numeric,
  receiving_yards    numeric,
  receiving_tds      numeric,
  targets            numeric,
  target_share       numeric,
  fantasy_points     numeric,
  fantasy_points_ppr numeric,

  source        text        not null default 'nflverse',
  updated_at    timestamptz not null default now(),

  unique (player_id, season, season_type)
);
create index if not exists player_season_stats_idx
  on public.player_season_stats (season desc, position);

alter table public.player_season_stats enable row level security;
create policy "public_read_player_season_stats" on public.player_season_stats for select using (true);

-- ─── 3. Grading-enablement columns on user_bankroll_bets ──────────────────────
-- props-auto-grade.js requires these; mig 004 never created them. All nullable /
-- defaulted so existing rows and the bankroll sync are unaffected.
alter table public.user_bankroll_bets
  add column if not exists bet_type    text,          -- 'prop' rows are graded by props-auto-grade
  add column if not exists graded      boolean default false,
  add column if not exists result      text,          -- 'win' | 'loss' | 'push'
  add column if not exists graded_at   timestamptz,
  add column if not exists stat_column text,          -- e.g. 'player_rush_yds' (the market key)
  add column if not exists player_id   text,          -- nflverse gsis id, joins to player_stats
  add column if not exists player      text,
  add column if not exists season      int,
  add column if not exists line        numeric,
  add column if not exists direction   text;          -- 'over' | 'under'

create index if not exists user_bankroll_bets_grade_idx
  on public.user_bankroll_bets (bet_type, graded);
