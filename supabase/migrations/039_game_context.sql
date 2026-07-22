-- ═══════════════════════════════════════════════════════════════════════════════
-- 039_game_context.sql — Rest/travel, division-game flag, venue, referee, and
-- closing-line columns on the existing `games` table.
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- S296 (Futures/Betting agent data-wiring, track 2): all of this data was
-- already downloaded into data/vault-seed/nflverse/schedules.csv by
-- scripts/fetch_nflverse_data.py's "schedules" dataset (nflverse's own
-- import_schedules()) — it just was never persisted past one ATS calc in
-- scripts/seed-historical-stats.py, which only reads spread_line/scores from
-- that same file. No new external data source; this is a plumbing migration.
--
-- Populated by: scripts/seed-game-context.py (reads the local CSV, resolves
-- each row to an existing `games.game_id` by (season, week, home_abbrev,
-- away_abbrev) — NOT by game_id string match, since games/game_odds_snapshots/
-- nflverse schedules.csv all use three different game_id formats; see that
-- script's header comment).
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.games
  add column if not exists away_rest              smallint,   -- days of rest for the away team entering this game
  add column if not exists home_rest               smallint,   -- days of rest for the home team entering this game
  add column if not exists div_game                boolean,    -- true if both teams share a division
  add column if not exists roof                    text,       -- 'outdoors' | 'dome' | 'closed' | 'open'
  add column if not exists surface                 text,       -- 'grass' | 'fieldturf' | 'matrixturf' | ...
  add column if not exists referee                 text,       -- head referee assigned to the game
  add column if not exists temp                     numeric(5,1), -- game-time temperature (F); null for domes/future games
  add column if not exists wind                     numeric(5,1), -- game-time wind speed (mph); null for domes/future games
  -- Closing lines, from nflverse's own consensus close (distinct from this
  -- app's own tracked game_odds_snapshots time series, which is opening-ish
  -- at best since tracking only started when this app began polling).
  add column if not exists closing_spread_line      numeric(5,1),
  add column if not exists closing_total_line       numeric(5,1),
  add column if not exists closing_home_moneyline   int,
  add column if not exists closing_away_moneyline   int,
  add column if not exists context_updated_at       timestamptz;

comment on column public.games.away_rest is
  'Days of rest for the away team before this game (nflverse schedules). Short week / bye-week context for the FUTURES/BETTING agent.';
comment on column public.games.home_rest is
  'Days of rest for the home team before this game (nflverse schedules).';
comment on column public.games.div_game is
  'True if home and away teams are in the same division (nflverse schedules).';
comment on column public.games.referee is
  'Head referee assigned (nflverse schedules). Joins to referee_tendencies.referee (migration 040) for historical tendencies.';
comment on column public.games.closing_spread_line is
  'Consensus closing spread line from nflverse (positive = home favored), NOT this app''s own tracked snapshot history. Use for CLV comparison against game_odds_snapshots.';

create index if not exists games_referee_idx on public.games (referee) where referee is not null;
