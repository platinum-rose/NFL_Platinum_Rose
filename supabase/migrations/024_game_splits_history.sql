-- 024_game_splits_history.sql
-- Append-only time-series of betting splits snapshots per game.
--
-- game_splits (existing) — upsert on game_id, always the freshest row.
-- game_splits_history (new) — pure INSERT, one row per ingest run per game.
--
-- This enables:
--   - Tracking how public money% and ticket% move throughout the week
--   - Backtesting edges: "did sharp divergence (ticket% ≠ money%) predict covers?"
--   - Identifying steam moves: sudden single-snapshot shift in money%
--
-- Query patterns:
--   Time series for one game:
--     SELECT * FROM game_splits_history WHERE game_id = '2026_01_KC_BAL'
--     ORDER BY captured_at;
--
--   Divergence snapshot at kickoff (latest per game):
--     SELECT DISTINCT ON (game_id) * FROM game_splits_history
--     ORDER BY game_id, captured_at DESC;
--
--   Week-level splits movement:
--     SELECT game_id, captured_at, spread_home_money - spread_home_bettors AS sharp_delta
--     FROM game_splits_history
--     WHERE season = 2026 AND week = 8
--     ORDER BY game_id, captured_at;

create table if not exists public.game_splits_history (
  id               bigserial    primary key,

  -- Game identity — same keys as game_splits
  game_id          text         not null,
  season           int          not null,
  week             int          not null,
  home_team        text         not null,
  away_team        text         not null,

  -- Spread splits — % backing the HOME team's side
  spread_home_bettors  smallint,   -- 0–100 ticket %
  spread_home_money    smallint,   -- 0–100 money %

  -- Total splits — % backing the OVER
  total_over_bettors   smallint,
  total_over_money     smallint,

  -- Moneyline splits — % backing the HOME team
  ml_home_bettors      smallint,
  ml_home_money        smallint,

  -- Source and snapshot timestamp
  source           text         not null default 'actionnetwork',
  captured_at      timestamptz  not null default now()

  -- No updated_at — rows are immutable once inserted
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

-- Primary query: time series for a single game
create index if not exists game_splits_history_game_time_idx
  on public.game_splits_history (game_id, captured_at desc);

-- Weekly aggregation queries
create index if not exists game_splits_history_season_week_idx
  on public.game_splits_history (season, week);

-- Recency / latest-snapshot queries
create index if not exists game_splits_history_captured_idx
  on public.game_splits_history (captured_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table public.game_splits_history enable row level security;

-- Anon + authenticated can read; service_role (ingest agent) bypasses RLS to write
create policy "public_read_game_splits_history"
  on public.game_splits_history for select
  using (true);

comment on table public.game_splits_history is
  'Append-only time-series of betting splits snapshots. '
  'One row per game per ingest run — never updated or deleted. '
  'Populated by agents/betting-splits-ingest.js alongside game_splits upsert. '
  'Use game_splits for the current snapshot; use this table for movement analysis.';
