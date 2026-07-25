-- 044_platinum_rose_ai_official_picks_and_team_profiles.sql
-- Local schema proposal for Platinum Rose AI paper tracking and structured
-- team-profile fields used by the futures/weekly analyst dossiers.
--
-- This migration is intentionally schema-only. It does not place bets, persist
-- production recommendations, or modify existing open parlay/futures positions.

create extension if not exists pgcrypto;

-- Expert registry ------------------------------------------------------------

create table if not exists public.official_pick_experts (
  expert_key            text primary key,
  display_name          text not null,
  expert_type           text not null
                          check (expert_type in ('ai', 'human', 'media', 'other')),
  sport                 text not null default 'NFL',
  season                int,
  mode                  text not null default 'paper_tracked',
  config                jsonb not null default '{}'::jsonb,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

insert into public.official_pick_experts (
  expert_key, display_name, expert_type, sport, season, mode, config
) values (
  'platinum_rose_ai',
  'Platinum Rose AI',
  'ai',
  'NFL',
  2026,
  'paper_tracked_human_verified',
  '{
    "futures": { "bankroll_usd": 500, "unit_usd": 20, "allowed_unit_sizes": [0.25, 0.5, 1, 2] },
    "in_season": { "bankroll_usd": 1000, "unit_usd": 10, "allowed_unit_sizes": [0.25, 0.5, 1, 2] },
    "futures_cutoff_local": "2026-09-09T12:00:00-07:00",
    "futures_cutoff_utc": "2026-09-09T19:00:00Z",
    "requires_human_verification": true,
    "autonomous_betting_allowed": false
  }'::jsonb
) on conflict (expert_key) do update set
  display_name = excluded.display_name,
  expert_type = excluded.expert_type,
  sport = excluded.sport,
  season = excluded.season,
  mode = excluded.mode,
  config = excluded.config,
  updated_at = now();

-- Official pick ledger -------------------------------------------------------

create table if not exists public.official_picks (
  id                    bigserial primary key,
  pick_id               uuid not null default gen_random_uuid(),

  expert_key            text not null references public.official_pick_experts(expert_key),
  sport                 text not null default 'NFL',
  season                int not null,
  pick_scope            text not null check (pick_scope in ('futures', 'weekly')),
  lifecycle             text not null default 'proposal'
                          check (lifecycle in ('proposal', 'human_verified', 'official_paper', 'graded', 'void', 'superseded')),
  approval_state        text not null default 'proposed'
                          check (approval_state in ('proposed', 'human_verified', 'official_paper', 'rejected', 'void')),

  portfolio_name        text,
  bankroll_usd          numeric,
  unit_size_usd         numeric,
  stake_units           numeric not null check (stake_units in (0.25, 0.5, 1, 2)),
  stake_usd             numeric generated always as (stake_units * unit_size_usd) stored,
  stake_tier            text check (stake_tier in ('speculative', 'small', 'standard', 'core')),
  confidence            int check (confidence between 0 and 100),
  confidence_tier       text,

  -- Market identity. Futures can leave event_id/week null; weekly picks should
  -- fill them when a game/prop maps cleanly to the schedule spine.
  market_type           text not null,
  market                text,
  selection             text not null,
  bet_type              text,
  side                  text,
  team                  text,
  opponent              text,
  event_id              text,
  week                  int,
  starts_at             timestamptz,

  -- Price/source lock.
  book                  text not null,
  price                 int,
  line                  numeric,
  observed_at           timestamptz not null,
  source_url            text,
  source_ref            text,
  bet_threshold         text,
  minimum_edge_pct      numeric,
  model_fair_prob       numeric,
  edge_pct              numeric,

  -- CLV/grading.
  closing_price         int,
  closing_line          numeric,
  closing_observed_at   timestamptz,
  clv_pct               numeric,
  result_status         text not null default 'pending'
                          check (result_status in ('pending', 'won', 'lost', 'push', 'void', 'half_won', 'half_lost', 'superseded')),
  payout_units          numeric,
  net_units             numeric,
  resolved_at           timestamptz,
  result_note           text,

  -- Reasoning and audit.
  source_model          text,
  source_run_id         uuid,
  market_view           text,
  football_view         text,
  thesis                text,
  disconfirming_factor  text,
  timing                jsonb,
  correlated_positions  jsonb,
  evidence_ids          text[] not null default '{}',
  sources               text[] not null default '{}',
  data_snapshot         jsonb not null default '{}'::jsonb,
  human_verification_required boolean not null default true,
  human_verified_at     timestamptz,
  official_at           timestamptz,
  locked_at             timestamptz,
  audit_note            text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (pick_id)
);

create index if not exists official_picks_expert_season_idx on public.official_picks (expert_key, season, pick_scope);
create index if not exists official_picks_lifecycle_idx on public.official_picks (lifecycle);
create index if not exists official_picks_result_idx on public.official_picks (result_status);
create index if not exists official_picks_event_idx on public.official_picks (event_id);
create index if not exists official_picks_market_idx on public.official_picks (market_type, team);

comment on table public.official_picks is
  'Human-verified paper pick ledger for Platinum Rose AI and other experts. Tracks futures and weekly picks with units, odds, rationale, CLV, and grading.';

-- Full status/change audit for pick edits and grading.
create table if not exists public.official_pick_events (
  id                    bigserial primary key,
  pick_id               uuid not null references public.official_picks(pick_id),
  event_type            text not null,
  from_state            text,
  to_state              text,
  note                  text,
  payload               jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists official_pick_events_pick_idx on public.official_pick_events (pick_id, created_at desc);

-- Structured analytic snapshots --------------------------------------------

create table if not exists public.team_analytic_snapshots (
  id                    bigserial primary key,
  season                int not null,
  week                  int,
  team                  text not null,
  source_key            text not null, -- e.g. nflverse, rbsdm_manual_check, nfelo_manual_check
  source_name           text,
  source_url            text,
  snapshot_at           timestamptz not null,
  games_played          int,

  off_epa_per_play      numeric,
  def_epa_per_play      numeric,
  off_epa_rank          int,
  def_epa_rank          int,
  epa_per_dropback      numeric,
  qb_epa_per_dropback   numeric,
  dropback_success_rate numeric,
  success_rate          numeric,
  cpoe                  numeric,
  explosive_play_rate   numeric,
  explosive_pass_rate   numeric,
  explosive_run_rate    numeric,
  pressure_rate_allowed numeric,
  pressure_rate_generated numeric,
  sack_rate_allowed     numeric,
  sack_rate_generated   numeric,
  neutral_pass_rate     numeric,
  early_down_pass_rate  numeric,
  shotgun_rate          numeric,
  no_huddle_rate        numeric,
  play_action_rate      numeric,
  motion_rate           numeric,

  attribution_note      text,
  raw                   jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists team_analytic_snapshots_lookup_idx
  on public.team_analytic_snapshots (season, team, snapshot_at desc);
create index if not exists team_analytic_snapshots_source_idx
  on public.team_analytic_snapshots (source_key, snapshot_at desc);
alter table public.team_analytic_snapshots
  add constraint team_analytic_snapshots_unique_snapshot
  unique (season, week, team, source_key, snapshot_at);

create table if not exists public.team_dvoa_snapshots (
  id                    bigserial primary key,
  season                int not null,
  week                  int,
  team                  text not null,
  source_key            text not null default 'imported_dvoa',
  source_name           text not null,
  source_url            text,
  snapshot_at           timestamptz not null,
  games_played          int,

  overall_dvoa          numeric,
  overall_dvoa_rank     int,
  offensive_dvoa        numeric,
  offensive_dvoa_rank   int,
  defensive_dvoa        numeric,
  defensive_dvoa_rank   int,
  special_teams_dvoa    numeric,
  special_teams_dvoa_rank int,
  weighted_dvoa         numeric,
  weighted_dvoa_rank    int,

  attribution_note      text not null,
  raw                   jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists team_dvoa_snapshots_lookup_idx
  on public.team_dvoa_snapshots (season, team, snapshot_at desc);
alter table public.team_dvoa_snapshots
  add constraint team_dvoa_snapshots_unique_snapshot
  unique (season, week, team, source_key, snapshot_at);

-- Structured coaching library. Refresh weekly/in-season; never treat stale
-- preseason priors as current strategy without checking sample dates.
create table if not exists public.team_coaching_tendency_snapshots (
  id                    bigserial primary key,
  season                int not null,
  week                  int,
  team                  text not null,
  head_coach            text,
  offensive_coordinator text,
  defensive_coordinator text,
  source_key            text not null,
  source_name           text,
  source_url            text,
  snapshot_at           timestamptz not null,
  sample_start          date,
  sample_end            date,
  games_sample          int,

  coordinator_continuity text,
  fourth_down_aggression_rate numeric,
  fourth_down_aggression_tier text,
  neutral_pass_rate     numeric,
  early_down_pass_rate  numeric,
  shotgun_rate          numeric,
  no_huddle_rate        numeric,
  play_action_rate      numeric,
  motion_rate           numeric,
  rpo_rate              numeric,
  pace_seconds_per_play numeric,
  red_zone_pass_rate    numeric,
  two_minute_aggression_tier text,
  ats_by_role           jsonb,
  trend_notes           text,
  stale_after           timestamptz,

  raw                   jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists team_coaching_tendency_lookup_idx
  on public.team_coaching_tendency_snapshots (season, team, snapshot_at desc);
alter table public.team_coaching_tendency_snapshots
  add constraint team_coaching_tendency_snapshots_unique_snapshot
  unique (season, week, team, source_key, snapshot_at);

alter table public.official_pick_experts enable row level security;
alter table public.official_picks enable row level security;
alter table public.official_pick_events enable row level security;
alter table public.team_analytic_snapshots enable row level security;
alter table public.team_dvoa_snapshots enable row level security;
alter table public.team_coaching_tendency_snapshots enable row level security;

create policy "public_read_official_pick_experts"
  on public.official_pick_experts for select using (true);
create policy "public_read_official_picks"
  on public.official_picks for select using (true);
create policy "public_read_official_pick_events"
  on public.official_pick_events for select using (true);
create policy "public_read_team_analytic_snapshots"
  on public.team_analytic_snapshots for select using (true);
create policy "public_read_team_dvoa_snapshots"
  on public.team_dvoa_snapshots for select using (true);
create policy "public_read_team_coaching_tendency_snapshots"
  on public.team_coaching_tendency_snapshots for select using (true);

-- No anon write policies. Writes should come from service-role ingest/tracking
-- scripts after explicit user approval.
