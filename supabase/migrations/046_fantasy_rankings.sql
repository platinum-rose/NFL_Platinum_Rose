-- ═══════════════════════════════════════════════════════════════════════════════
-- 046_fantasy_rankings.sql — FantasyPros Expert Consensus Rankings (weekly + draft)
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- F-26c part 2. Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §2
-- Source: GET /nfl/{season}/consensus-rankings — this is ECR (expert opinion), a
-- distinct signal from fantasy_adp (034) which is real market ADP. Don't join these
-- two tables together as if they measure the same thing.
--
-- `week` uses 0 to mean "season-long/draft ECR", NOT NULL — Postgres treats NULL as
-- distinct-from-itself in a unique constraint (each NULL row would never collide),
-- which would let re-running the season-long ingest silently accumulate duplicate
-- rows instead of upserting cleanly. 0 also matches the FantasyPros API's own
-- convention (its `week` response field is literally "0" for draft/season-long).
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.fantasy_rankings (
  id            bigserial   primary key,
  player_id     text,                      -- nflverse gsis id when resolvable (else name-join), same convention as fantasy_adp
  player        text        not null,
  position      text        not null,
  team          text,
  season        int         not null,
  week          int         not null default 0,  -- 0 = season-long/draft ECR; else the NFL week number
  scoring       text        default 'ppr',        -- std | ppr | half
  rank_ecr      int         not null,             -- expert consensus rank, overall within the requested position
  pos_rank      text,                             -- e.g. "RB1" as returned by the API
  rank_min      int,
  rank_max      int,
  rank_std      numeric,                          -- spread-of-opinion std dev — low std = experts agree, high = disputed
  tier          int,
  total_experts int,                              -- how many experts contributed (reliability context, e.g. 5 vs 90)
  opponent      text,                             -- weekly only; null for season-long rows
  owned_avg     numeric,                          -- rostership % (context, not core to the rank)
  source        text        not null default 'fantasypros',
  as_of_date    date        not null default current_date,
  created_at    timestamptz not null default now(),

  unique (player, position, season, week, scoring, source, as_of_date)
);
create index if not exists fantasy_rankings_latest_idx
  on public.fantasy_rankings (season, week desc, position, as_of_date desc);

alter table public.fantasy_rankings enable row level security;
create policy "public_read_fantasy_rankings" on public.fantasy_rankings for select using (true);
