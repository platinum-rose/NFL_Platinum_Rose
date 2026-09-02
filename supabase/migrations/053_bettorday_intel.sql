-- 053_bettorday_intel.sql
-- BettorDay intel pipeline (docs/specs/BETTORDAY_INTEL_PIPELINE_SPEC_2026-09-01.md,
-- audited/corrected in docs/specs/BETTORDAY_INTEL_PIPELINE_AUDIT_RESPONSE_2026-09-02.md
-- and commit e95137d). Run in: Supabase Dashboard -> SQL Editor -> New query
--
-- Creates the two tables agents/bettorday-newsletter-ingest.js writes to.
-- Neither exists in production yet -- the agent has only ever been run
-- --dry-run (local receipts only), confirmed by full-codebase grep finding
-- no other reader/writer of either table name anywhere in the repo.
--
-- nfl_trench_ratings' schema reflects the POST-AUDIT-FIX shape (commit
-- e95137d): the original spec's single flat table conflated two conceptually
-- different metrics scraped off the same page (raw team-quality composite
-- vs. schedule-adjusted difficulty) under one conflict key, which would have
-- silently overwritten one metric with the other on every sync. The fix
-- partitions them with a metric_type column, now part of the key.

create table if not exists public.intel_newsletters (
  id             text primary key,          -- 'bettorday_{slug}'
  source         text not null default 'bettorday',
  title          text,
  published_at   timestamptz,
  url            text,
  teams_mentioned text[] not null default '{}',
  summary        text,
  raw_content    text,
  captured_at    timestamptz not null default now()
);

comment on table public.intel_newsletters is
  'BettorDay ("32 in 32") daily newsletter editions, ingested by '
  'agents/bettorday-newsletter-ingest.js. Analytical/narrative source only -- '
  'not a betting-pick source, no execution-eligibility gating applies.';

create table if not exists public.nfl_trench_ratings (
  team            text not null,
  season          integer not null,
  week            integer not null,          -- 0 = preseason baseline, 1..18 = in-season
  metric_type     text not null,             -- 'team_composite' | 'schedule_sos'
  rank_overall    integer,
  score_overall   numeric(4,2),
  run_block_z     numeric(4,2),
  pass_block_z    numeric(4,2),
  run_defense_z   numeric(4,2),
  pass_rush_z     numeric(4,2),
  as_of_date      date not null,
  source          text not null default 'bettorday',
  primary key (team, season, week, metric_type, as_of_date)
);

comment on table public.nfl_trench_ratings is
  'BettorDay Trench Strength-of-Schedule report, partitioned by metric_type. '
  '''team_composite'' = each team''s own raw O-line/D-line quality z-scores '
  '(the "Landscape" table). ''schedule_sos'' = the strength of opposing line '
  'units that team''s own units will face this season (the "Schedule" table) '
  '-- run_block_z/pass_block_z/run_defense_z/pass_rush_z hold the "vs Run '
  'Blk"/"vs Pass Blk"/"vs Run Def"/"vs Pass Rush" columns for this row type, '
  'NOT the team''s own line grades. Do not average or compare rank_overall '
  'across metric_type values -- they are different scales measuring '
  'different things. See docs/specs/BETTORDAY_INTEL_PIPELINE_AUDIT_RESPONSE_2026-09-02.md '
  '§2 for the bug this partition fixes.';

alter table public.intel_newsletters enable row level security;
alter table public.nfl_trench_ratings enable row level security;

-- Public read, matching this repo's existing pattern for research/signal
-- tables (e.g. migration 049's intel_verification, migration 051's
-- feed_health). Writes stay service-role-only since the ingest agent
-- connects with the service-role key, which bypasses RLS.
create policy "intel_newsletters_public_read" on public.intel_newsletters
  for select using (true);

create policy "nfl_trench_ratings_public_read" on public.nfl_trench_ratings
  for select using (true);
