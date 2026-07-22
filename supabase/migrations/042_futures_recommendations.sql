-- ═══════════════════════════════════════════════════════════════════════════════
-- 042_futures_recommendations.sql — Backtesting foundation for the Analyst
-- Committee portfolio pipeline (agents/portfolio-dossier.js + portfolio-synthesize.js)
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- 2026-07-22 follow-up (Codex second-opinion review): the biggest real gap in
-- the whole Futures/Betting reasoning stack was that NOTHING got saved anywhere
-- gradable. portfolio-synthesize.js wrote reviewable .html/.md files per run but
-- never persisted a recommendation with enough structure to later ask "was this
-- right?" — futures positions Andy actually takes only ever lived in localStorage
-- (nfl_futures_portfolio_v1), with no durable Supabase history once closed (see
-- docs/FUTURES_AGENT_DATA_INVENTORY_2026-07-21.md §8). This table is that missing
-- durable log: one row per final recommendation per run.
--
-- This is the LOGGING half of backtesting, not the GRADING half. Grading needs
-- an end-of-season/market-resolution data source (who actually won each
-- division/conference/award/win-total) that doesn't exist as a queryable table
-- anywhere in this repo yet — building a real automated grader is future work.
-- For now, `status` starts 'pending' and can be updated by hand (see
-- scripts/grade-futures-recommendation.js) as markets actually resolve.
--
-- Populated by: agents/portfolio-synthesize.js's persistRecommendations()
-- (stage-3 final book only — passed/killed candidates are NOT written here,
-- they're visible in the run's .raw.json for audit but aren't "recommendations").
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.futures_recommendations (
  id                    bigserial   primary key,

  -- Run identity
  run_date              date        not null,   -- the portfolio-synthesize.js run's date (meta.date)
  season                int,
  key                   text        not null,    -- normalized market|selection key (see norm() in portfolio-synthesize.js)

  -- What was recommended
  market                text        not null,
  selection             text        not null,
  edge_type             text,                    -- math | thesis | stale_price | hedge | longshot
  type                  text,                    -- favorite | value | longshot | hedge
  book                  text,
  price                 int,
  model_fair_prob        numeric,
  edge_pct              numeric,
  confidence            int,                     -- 0-100, post-Skeptic-adjustment if the committee ran
  stake_tier            text,                    -- core | standard | small | speculative
  knowledge_based       boolean     default false,

  -- Reasoning trail (the whole point — lets a human or a later script trace
  -- WHY this was recommended, not just what was recommended)
  thesis                text,
  disconfirming_factor  text,
  market_view           text,
  football_view         text,
  skeptic_note          text,
  skeptic_verdict       text,                    -- hold | downgrade | kill | unreviewed
  bet_threshold         text,
  needs_human_review    boolean     default false,
  sources               text[]      default '{}',
  evidence_ids          text[]      default '{}',
  timing                jsonb,
  correlated_week1      jsonb,
  models                jsonb,                   -- stage-1 agreement: { count, of, models: [...] }

  -- Grading (manual for now — see scripts/grade-futures-recommendation.js)
  status                text        not null default 'pending',  -- pending | won | lost | push | void | superseded
  resolved_at           timestamptz,
  result_note           text,

  created_at            timestamptz not null default now(),

  unique (run_date, key)
);

create index if not exists futures_recommendations_run_date_idx on public.futures_recommendations (run_date desc);
create index if not exists futures_recommendations_status_idx   on public.futures_recommendations (status);
create index if not exists futures_recommendations_market_idx   on public.futures_recommendations (market);

comment on table public.futures_recommendations is
  'Durable log of every final (post-committee) portfolio recommendation, one row per run per market/selection. Logging half of backtesting; grading is manual today (scripts/grade-futures-recommendation.js) pending a real end-of-season resolution data source.';

alter table public.futures_recommendations enable row level security;

create policy "public_read_futures_recommendations"
  on public.futures_recommendations for select
  using (true);

-- Writes come from agents/portfolio-synthesize.js's persistRecommendations(),
-- which uses the service-role key and bypasses RLS — no anon write policy needed.
