-- ═══════════════════════════════════════════════════════════════════════════════
-- F-21: Futures Intel Report v2 — rendered report store
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- Stores the on-demand Futures Intel Report in three representations:
--   • markdown  — portable / diffable source
--   • html      — pre-rendered, reader-friendly (Futures tab reads this directly)
--   • model     — structured JSON (categories, coverage audit, expert groups)
--
-- Written by agents/futures-intel-report-v2.js (and the nfl-futures-report skill).
-- Read by the Futures-tab "Intel Report" panel via vaultClient/supabase.
-- ═══════════════════════════════════════════════════════════════════════════════

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

-- Primary access pattern: latest report for a season
create index if not exists futures_reports_season_generated_idx
  on public.futures_reports (season, generated_at desc);

create index if not exists futures_reports_generated_idx
  on public.futures_reports (generated_at desc);

-- Convenience view: most-recent report per season
create or replace view public.v_futures_report_latest as
select distinct on (season)
  id, season, report_date, generated_at, trigger, markdown, html, model, coverage, meta
from public.futures_reports
order by season, generated_at desc;

-- RLS: anyone can read, service_role writes (mirrors futures_odds_snapshots)
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
