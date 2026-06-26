-- ═══════════════════════════════════════════════════════════════════════════════
-- F-21 / Phase 1.5: Win-total line capture
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- Win totals are a TOTALS market (a number + over/under prices), unlike the
-- outright futures already captured. We store one row per (team, book) carrying
-- the line plus both prices, so it fits the existing
-- uq_futures_odds_snapshot (market_type, team, book, snapshot_time) constraint.
--
-- Populated by:
--   • agents/win-totals-ingest.js   (manual paste from BetOnline / Bookmaker, etc.)
--   • agents/futures-odds-ingest.js (automated, once TheOddsAPI season_wins opens —
--                                    totals parser is the Phase 1.5b follow-up)
-- Consumed by futures-intel-report-v2.js for Total Wins / Most Wins / Least Wins.
-- ═══════════════════════════════════════════════════════════════════════════════

alter table if exists public.futures_odds_snapshots
  add column if not exists line        numeric(5,2),  -- win-total number, e.g. 11.5
  add column if not exists over_price  int,           -- American odds for the Over
  add column if not exists under_price int;           -- American odds for the Under

-- Helps the report quickly pull the latest win-total lines.
create index if not exists futures_snapshots_wins_idx
  on public.futures_odds_snapshots (market_type, captured_at desc)
  where line is not null;
