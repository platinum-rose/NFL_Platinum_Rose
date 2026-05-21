-- F-21: Game-level betting splits from Action Network
-- Captures public-bettor % and public-money % per game per market.
-- Upserted on game_id — always represents the most recent snapshot.
-- Source: Action Network public API (api.actionnetwork.com/web/v1/games?league=nfl)

create table if not exists public.game_splits (
  id               bigserial    primary key,

  -- Game identity (matches games.game_id when season table is live)
  game_id          text         not null unique,
  season           int          not null,
  week             int          not null,
  home_team        text         not null,
  away_team        text         not null,

  -- Spread splits — % backing the HOME team's side
  spread_home_bettors  smallint,   -- 0–100
  spread_home_money    smallint,   -- 0–100

  -- Total splits — % backing the OVER
  total_over_bettors   smallint,
  total_over_money     smallint,

  -- Moneyline splits — % backing the HOME team
  ml_home_bettors      smallint,
  ml_home_money        smallint,

  -- Source and freshness
  source           text         not null default 'actionnetwork',
  captured_at      timestamptz  not null default now(),
  updated_at       timestamptz  not null default now()
);

-- Partial index for efficient current-week queries
create index if not exists game_splits_season_week_idx
  on public.game_splits (season, week);

-- Auto-update updated_at on upsert
create or replace function public.set_game_splits_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists game_splits_set_updated_at on public.game_splits;
create trigger game_splits_set_updated_at
  before update on public.game_splits
  for each row execute function public.set_game_splits_updated_at();

comment on table public.game_splits is
  'Current-week betting splits (public ticket% and money%) per game. '
  'Upserted on game_id — one row per game, always the freshest snapshot. '
  'Populated by agents/betting-splits-ingest.js on a GHA schedule.';

-- RLS: service role (ingest agent) writes; anon can read
alter table public.game_splits enable row level security;

create policy "public_read_game_splits"
  on public.game_splits for select
  using (true);
