-- DS-3: futures breadth dimensions (backward-compatible)
-- Adds explicit fields used by expanded futures ingest while preserving
-- existing columns consumed by current UI and monitors.

alter table if exists public.futures_odds_snapshots
  add column if not exists selection text,
  add column if not exists price int,
  add column if not exists captured_at timestamptz,
  add column if not exists season int;

-- Backfill from legacy fields so old rows remain queryable in new shape.
update public.futures_odds_snapshots
set
  selection = coalesce(selection, team),
  price = coalesce(price, odds),
  captured_at = coalesce(captured_at, snapshot_time),
  season = coalesce(
    season,
    extract(year from coalesce(snapshot_time, now()) at time zone 'utc')::int
  )
where
  selection is null
  or price is null
  or captured_at is null
  or season is null;

create index if not exists futures_snapshots_season_market_idx
  on public.futures_odds_snapshots (season, market_type);

create index if not exists futures_snapshots_captured_at_idx
  on public.futures_odds_snapshots (captured_at desc);
