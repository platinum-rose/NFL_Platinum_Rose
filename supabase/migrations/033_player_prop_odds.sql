-- ═══════════════════════════════════════════════════════════════════════════════
-- 033_player_prop_odds.sql — Landing table for real player-prop odds
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- THIS IS THE INTEGRATION SEAM. When a real prop-odds source is found (paid
-- TheOddsAPI tier, or a dedicated prop aggregator), it writes rows here — one per
-- (game, player, market, book, snapshot). Nothing else in the props stack needs a
-- new table. Shape mirrors the proven futures_odds_snapshots pattern.
--
-- Downstream (propsTools.js) rewires two functions to read this (both stub today):
--   • get_player_props   → latest line per (player, market) for a team
--   • get_prop_line_shop → all books for a (player, market) → best number per side
-- The `market` value MUST be a PROP_MARKETS key (e.g. 'player_rush_yds') so it lines
-- up with the tool catalog and with player_stats grading columns.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.player_prop_odds (
  id            uuid        primary key default gen_random_uuid(),
  season        int         not null,
  week          int,
  game_id       text,                              -- joins public.games when available
  player        text        not null,
  player_id     text,                              -- nflverse gsis id when resolvable
  team          text,
  opponent      text,
  market        text        not null,              -- PROP_MARKETS key, e.g. 'player_reception_yds'
  book          text        not null,              -- sportsbook key, e.g. 'draftkings'
  line          numeric,
  over_odds     int,                               -- american
  under_odds    int,                               -- american (null for yes/no markets like anytime_td)
  snapshot_time timestamptz not null default now(),
  source        text        not null default 'manual',
  created_at    timestamptz not null default now(),

  -- idempotent per book per snapshot (mirrors uq_futures_odds_snapshot)
  unique (game_id, player, market, book, snapshot_time)
);

create index if not exists player_prop_odds_lookup_idx
  on public.player_prop_odds (season, team, market);
create index if not exists player_prop_odds_player_idx
  on public.player_prop_odds (player, market, snapshot_time desc);

comment on table public.player_prop_odds is
  'Landing table for real player-prop odds (one row per game/player/market/book/snapshot). Integration seam for a future paid props source; read by get_player_props + get_prop_line_shop. market = PROP_MARKETS key.';

alter table public.player_prop_odds enable row level security;
create policy "public_read_player_prop_odds" on public.player_prop_odds for select using (true);
