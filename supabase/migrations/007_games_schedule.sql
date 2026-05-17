-- ─── games ─────────────────────────────────────────────────────────────────
-- Canonical NFL schedule spine used for joins across odds, picks, and intel.

create table if not exists public.games (
  game_id        text        primary key,
  espn_event_id  text        unique,
  season         int         not null,
  season_type    int         not null default 2,
  week           int         not null,
  kickoff_utc    timestamptz not null,
  home_team      text        not null,
  away_team      text        not null,
  home_abbrev    text,
  away_abbrev    text,
  status         text,
  updated_at     timestamptz not null default now()
);

create index if not exists games_season_week_idx
  on public.games (season, week);

create index if not exists games_kickoff_idx
  on public.games (kickoff_utc);

alter table public.games enable row level security;

create policy "public_read_games"
  on public.games for select
  using (true);
