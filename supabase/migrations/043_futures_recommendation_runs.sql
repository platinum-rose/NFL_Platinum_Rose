-- ═══════════════════════════════════════════════════════════════════════════════
-- 043_futures_recommendation_runs.sql — Backtesting log completeness
-- (agents/portfolio-synthesize.js), per Codex's second review of the Analyst
-- Committee build (docs/FUTURES_ANALYST_CODEX_REVIEW_2026-07-22.md).
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- Two gaps in migration 042's futures_recommendations, both fixed here:
--
-- 1. unique(run_date, key) meant a SECOND run on the same date silently
--    overwrote the first (upsert onConflict 'run_date,key'). Adds run_id (one
--    per portfolio-synthesize.js invocation) and repoints uniqueness to
--    (run_id, key), so re-runs on the same date no longer clobber each other.
--
-- 2. futures_recommendations only ever held the FINAL (post-committee,
--    post-validator) book. Everything the Skeptic killed, the Risk/Editor
--    passed on, or the code-owned validator invalidated disappeared once that
--    run's local .raw.json aged out of attention — there was no durable,
--    queryable record of WHY a candidate didn't make the cut. This migration
--    adds futures_recommendation_runs: one row per candidate per stage
--    (stage1_candidate | skeptic_killed | risk_passed | validator_invalidated
--    | final), each carrying its reason (where applicable) and a full JSON
--    payload of the candidate at that stage, so the whole reasoning trail is
--    queryable later — not just what survived.
--
-- Populated by: agents/portfolio-synthesize.js's persistRecommendations()
-- (final book, into futures_recommendations) and the new
-- persistRecommendationRuns() (full trail, into futures_recommendation_runs).
-- ═══════════════════════════════════════════════════════════════════════════════

-- pgcrypto provides gen_random_uuid(); Supabase projects normally already have
-- it enabled, this is just belt-and-suspenders.
create extension if not exists pgcrypto;

-- ── Fix #1: run_id on futures_recommendations ──────────────────────────────────
alter table public.futures_recommendations
  add column if not exists run_id uuid not null default gen_random_uuid();

alter table public.futures_recommendations
  drop constraint if exists futures_recommendations_run_date_key_key;

alter table public.futures_recommendations
  add constraint futures_recommendations_run_id_key_key unique (run_id, key);

create index if not exists futures_recommendations_run_id_idx on public.futures_recommendations (run_id);

comment on column public.futures_recommendations.run_id is
  'One UUID per portfolio-synthesize.js invocation (meta.run_id) — lets multiple same-day runs coexist instead of overwriting each other.';

-- ── Fix #2: full candidate-trail audit log ─────────────────────────────────────
create table if not exists public.futures_recommendation_runs (
  id                    bigserial   primary key,

  run_id                uuid        not null,
  run_date              date        not null,
  season                int,
  stage                 text        not null
                          check (stage in ('stage1_candidate', 'skeptic_killed', 'risk_passed', 'validator_invalidated', 'final')),

  key                   text        not null,   -- normalized market|selection key (see norm() in portfolio-synthesize.js)
  market                text,
  selection             text,
  edge_type             text,
  price                 int,
  book                  text,
  model_fair_prob       numeric,
  edge_pct              numeric,
  confidence            int,

  reason                text,                    -- why this candidate was killed/passed/invalidated (null for stage1_candidate/final)
  models                jsonb,                    -- stage-1 agreement: { count, of, models: [...] }
  payload               jsonb,                    -- full candidate object at this stage, for audit

  created_at            timestamptz not null default now()
);

create index if not exists futures_recommendation_runs_run_id_idx  on public.futures_recommendation_runs (run_id);
create index if not exists futures_recommendation_runs_run_date_idx on public.futures_recommendation_runs (run_date desc);
create index if not exists futures_recommendation_runs_stage_idx   on public.futures_recommendation_runs (stage);
create index if not exists futures_recommendation_runs_key_idx     on public.futures_recommendation_runs (key);

comment on table public.futures_recommendation_runs is
  'Full candidate audit trail for every portfolio-synthesize.js run — one row per candidate per stage (stage1_candidate/skeptic_killed/risk_passed/validator_invalidated/final), including why it was killed/passed/invalidated where applicable. Complements futures_recommendations, which only holds the final book.';

alter table public.futures_recommendation_runs enable row level security;

create policy "public_read_futures_recommendation_runs"
  on public.futures_recommendation_runs for select
  using (true);

-- Writes come from agents/portfolio-synthesize.js's persistRecommendationRuns(),
-- which uses the service-role key and bypasses RLS — no anon write policy needed.
