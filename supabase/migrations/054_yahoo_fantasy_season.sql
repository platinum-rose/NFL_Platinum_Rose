-- ═══════════════════════════════════════════════════════════════════════════════
-- 054_yahoo_fantasy_season.sql — Yahoo Fantasy in-season data: rosters, matchups,
-- standings, across all 5 of the account's NFL leagues.
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- Fed by agents/yahoo-season-ingest.js (agents/lib/yahoo.js OAuth client).
-- Draft-time Yahoo data (fantasy_adp source='yahoo', 034) is separate and now
-- stale post-draft; these three tables cover the regular season instead.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.yahoo_rosters (
  id              bigserial   primary key,
  league_key      text        not null,
  league_name     text,
  team_key        text        not null,
  team_name       text,
  player_key      text        not null,
  player          text        not null,
  position        text,                      -- primary_position, e.g. RB/WR/QB
  editorial_team  text,                       -- real NFL team abbr, e.g. "Bal"
  bye_week        int,
  week             int         not null,       -- fantasy week this roster snapshot reflects
  season          int         not null,
  is_my_team      boolean     not null default true,  -- only my own team's rosters are ingested (see agent)
  source          text        not null default 'yahoo',
  pulled_at       timestamptz not null default now(),

  unique (team_key, player_key, week)
);
create index if not exists yahoo_rosters_latest_idx
  on public.yahoo_rosters (league_key, week desc);

create table if not exists public.yahoo_matchups (
  id                  bigserial   primary key,
  league_key          text        not null,
  league_name         text,
  season              int         not null,
  week                int         not null,
  team_key            text        not null,
  team_name           text,
  opponent_team_key   text,
  opponent_name       text,
  points              numeric,               -- null/0 pre-kickoff; live during 'midevent'; final at 'postevent'
  opponent_points     numeric,
  win_probability     numeric,               -- Yahoo's live in-game win probability for team_key, 0-1
  status              text,                  -- preevent | midevent | postevent
  is_playoffs         boolean     not null default false,
  is_consolation      boolean     not null default false,
  is_my_team          boolean     not null default false,
  source              text        not null default 'yahoo',
  pulled_at           timestamptz not null default now(),

  unique (league_key, week, team_key)
);
create index if not exists yahoo_matchups_latest_idx
  on public.yahoo_matchups (league_key, week desc);

create table if not exists public.yahoo_standings (
  id              bigserial   primary key,
  league_key      text        not null,
  league_name     text,
  season          int         not null,
  team_key        text        not null,
  team_name       text,
  wins            int,
  losses          int,
  ties            int,
  points_for      numeric,
  points_against  numeric,
  rank            int,
  is_my_team      boolean     not null default false,
  as_of_date      date        not null default current_date,
  source          text        not null default 'yahoo',
  pulled_at       timestamptz not null default now(),

  unique (league_key, team_key, as_of_date)
);
create index if not exists yahoo_standings_latest_idx
  on public.yahoo_standings (league_key, as_of_date desc, rank);

alter table public.yahoo_rosters enable row level security;
alter table public.yahoo_matchups enable row level security;
alter table public.yahoo_standings enable row level security;
create policy "public_read_yahoo_rosters" on public.yahoo_rosters for select using (true);
create policy "public_read_yahoo_matchups" on public.yahoo_matchups for select using (true);
create policy "public_read_yahoo_standings" on public.yahoo_standings for select using (true);
