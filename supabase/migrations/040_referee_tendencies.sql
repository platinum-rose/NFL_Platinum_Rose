-- ═══════════════════════════════════════════════════════════════════════════════
-- 040_referee_tendencies.sql — Per-referee historical tendencies
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- S296 (Futures/Betting agent data-wiring, track 2). Computed entirely from
-- data already downloaded by fetch_nflverse_data.py — no new external source:
--   - referee name per game:      data/vault-seed/nflverse/schedules.csv
--   - penalties/penalty_yards:    data/vault-seed/nflverse/team_stats.csv
--     (nflverse's own game_id is consistent between these two specific files,
--     since both come from the same nflverse release family — unlike this
--     repo's own games/game_odds_snapshots tables, which use two more,
--     mutually different, game_id formats; see seed-game-context.py header.)
--
-- One row per referee: sample size + season-scoring/penalty averages across
-- every game on file for them. Aggregation, not a time series — re-derived
-- and upserted wholesale each time scripts/derive_referee_tendencies.py runs.
--
-- Populated by: scripts/derive_referee_tendencies.py
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.referee_tendencies (
  id                    bigserial   primary key,
  referee               text        not null unique,
  games_officiated      int         not null,
  seasons               int[]       not null default '{}',   -- distinct seasons observed
  avg_total_points      numeric(6,2),                          -- mean combined score across their games ("total-friendliness")
  avg_total_penalties   numeric(6,2),                          -- mean combined penalty count (both teams) across their games
  avg_penalty_yards     numeric(6,2),                          -- mean combined penalty yardage
  home_win_pct          numeric(5,4),                          -- fraction of their games the home team won (sanity/curiosity stat)
  updated_at            timestamptz not null default now()
);

create index if not exists referee_tendencies_referee_idx
  on public.referee_tendencies (referee);

comment on table public.referee_tendencies is
  'Per-referee historical tendencies (total-friendliness, penalty rate) derived from nflverse schedules.csv + team_stats.csv. Small samples (a ref works ~15-17 games/season) — always surface games_officiated alongside any average so the agent/Creator can judge confidence.';

alter table public.referee_tendencies enable row level security;

create policy "public_read_referee_tendencies"
  on public.referee_tendencies for select
  using (true);
