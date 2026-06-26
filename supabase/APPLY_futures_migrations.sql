-- ═══════════════════════════════════════════════════════════════════════════════
-- ONE-PASTE FUTURES REPORT MIGRATIONS  (026 + 027)
-- Run once in: Supabase Dashboard → SQL Editor → New query → paste all → Run.
-- Fully idempotent (IF NOT EXISTS everywhere) — safe to re-run.
--
--   026  futures_reports        — stores the rendered Futures Intel Report (html/md/model)
--   027  win-total line columns — line / over_price / under_price on futures_odds_snapshots
-- ═══════════════════════════════════════════════════════════════════════════════


-- ───────────────────────────── 026_futures_reports ─────────────────────────────
create table if not exists public.futures_reports (
  id            bigint generated always as identity primary key,
  season        int         not null,
  report_date   date        not null default (now() at time zone 'utc')::date,
  generated_at  timestamptz not null default now(),
  -- 'scheduled' | 'on_demand_ui' | 'skill' | 'manual'
  trigger       text        not null default 'scheduled',
  markdown      text        not null default '',
  html          text        not null default '',
  model         jsonb       not null default '{}'::jsonb,   -- structured category + audit data
  coverage      jsonb       not null default '{}'::jsonb,   -- source coverage-audit summary
  meta          jsonb       not null default '{}'::jsonb,   -- counts, windows, engine flags
  created_at    timestamptz not null default now()
);

create index if not exists futures_reports_season_generated_idx
  on public.futures_reports (season, generated_at desc);

create index if not exists futures_reports_generated_idx
  on public.futures_reports (generated_at desc);

create or replace view public.v_futures_report_latest as
select distinct on (season)
  id, season, report_date, generated_at, trigger, markdown, html, model, coverage, meta
from public.futures_reports
order by season, generated_at desc;

alter table public.futures_reports enable row level security;

drop policy if exists "public_read_futures_reports" on public.futures_reports;
create policy "public_read_futures_reports"
  on public.futures_reports for select
  using (true);

drop policy if exists "service_write_futures_reports" on public.futures_reports;
create policy "service_write_futures_reports"
  on public.futures_reports for all
  to service_role
  using (true)
  with check (true);


-- ──────────────────────────── 027_win_totals_line ─────────────────────────────
-- Win totals are a TOTALS market (a number + over/under). One row per (team, book)
-- carries the line + both prices, fitting the existing
-- uq_futures_odds_snapshot (market_type, team, book, snapshot_time) constraint.
alter table if exists public.futures_odds_snapshots
  add column if not exists line        numeric(5,2),  -- win-total number, e.g. 11.5
  add column if not exists over_price  int,           -- American odds for the Over
  add column if not exists under_price int;           -- American odds for the Under

create index if not exists futures_snapshots_wins_idx
  on public.futures_odds_snapshots (market_type, captured_at desc)
  where line is not null;
