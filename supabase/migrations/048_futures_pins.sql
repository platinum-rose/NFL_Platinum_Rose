-- ═══════════════════════════════════════════════════════════════════════════════
-- 048_futures_pins.sql — NFL-ATLAS-1: pinned futures for the Watchlist tab
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- Design doc: docs/NFL_ATLAS_1_FUTURES_WATCHLIST_DESIGN.md
--
-- src/components/futures/FuturesWatchList.jsx already pins whole TEAMS to a
-- localStorage-only blob (nfl_futures_watchlist_v1) across 5 fixed market
-- slots (superbowl/conference/division/wins/playoffs), with price history from
-- futures_odds_snapshots and a podcast-sentiment citation drawer. Andy's
-- 2026-07-20 ask was broader: pin ANY specific future (including player-level
-- awards like MVP, which have no odds source anywhere in this repo — see the
-- design doc's Open Item 3), with links to expert signals, AND an Obsidian
-- note per pin. Both the browser panel and a Node vault-sync agent
-- (agents/futures-pin-vault-sync.js, not yet built) need to read the same pin
-- list, which localStorage can't provide — hence this table.
--
-- This does not replace nfl_futures_watchlist_v1's team-pin behavior; existing
-- team pins keep working unchanged. A team pin can optionally be mirrored here
-- too (team set, market one of the 5 existing slots) so it shows up in the new
-- Expert Signals panel and gets an Obsidian note, but the localStorage blob
-- stays the source of truth for the existing price-chart UI regardless.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.futures_pins (
  id           bigserial   primary key,

  market       text        not null,   -- 'superbowl' | 'conference' | 'division' | 'wins' | 'playoffs' | 'mvp' | 'opoy' | 'dpoy' | 'oroy' | 'droy' | 'coach_of_year' | ...
  selection    text        not null,   -- the specific pick, e.g. 'Buffalo Bills' or 'Josh Allen'
  team         text,                   -- set for team-scoped pins (full name, matches NFL_TEAMS.fullName); null for player/award pins with no single team
  label        text,                   -- optional freeform display label override, e.g. 'Bills to win it all'

  pinned_at    timestamptz not null default now(),
  active       boolean     not null default true,   -- unpin = set false, don't delete (keeps vault note history coherent)

  created_at   timestamptz not null default now()
);

create index if not exists futures_pins_active_idx on public.futures_pins (active) where active;
create index if not exists futures_pins_market_idx  on public.futures_pins (market);

comment on table public.futures_pins is
  'Andy-curated list of specific futures to watch (NFL-ATLAS-1) — read by both the FuturesWatchList browser UI and agents/futures-pin-vault-sync.js so they share one source of truth. Distinct from nfl_futures_watchlist_v1 (localStorage), which remains the source of truth for the existing team price-chart panel.';

alter table public.futures_pins enable row level security;

create policy "public_read_futures_pins"
  on public.futures_pins for select
  using (true);

-- Pins are created directly from the browser by Andy (not by a service-role
-- agent script — futures-pin-vault-sync.js only reads this table, it never
-- writes to it), so writes need a real policy rather than relying on
-- service-role bypass. Scoped to `authenticated` rather than the fully-open
-- `anon ... using (true)` pattern this repo used to use — see
-- 025_user_picks_rls.sql, which replaced exactly that permissive pattern on
-- user_picks/user_bankroll_bets because it let anyone with the public anon
-- key write rows. No per-row user_id ownership check (unlike 025) since this
-- is a single-owner (Andy-only) app with no other users signing in; the
-- `authenticated` restriction alone is enough to keep the anon key read-only.
create policy "authenticated_write_futures_pins"
  on public.futures_pins for insert
  to authenticated
  with check (true);

create policy "authenticated_update_futures_pins"
  on public.futures_pins for update
  to authenticated
  using (true)
  with check (true);
