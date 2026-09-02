-- ═══════════════════════════════════════════════════════════════════════════════
-- Fix: nfl_rosters_latest picked a stale row on ties
--
-- Bug found 2026-09-02 auditing the Rose Bowl fantasy board (Trey Benson
-- IR-stash investigation). nfl_rosters upserts on
-- (season, week, game_type, team, full_name, gsis_id) — when a player's
-- TEAM changes mid-week (trade, waiver, release) without season/week
-- advancing, that's a new unique key, so the old team row is never
-- overwritten; both rows persist side by side. The original view's
-- `order by season desc, week desc` has no way to break that tie, so
-- `distinct on (coalesce(gsis_id, full_name))` kept whichever row postgres
-- happened to scan first — for Trey Benson that returned a 2026-07-21
-- "ARI / RES" row over a newer 2026-08-08 "AZ / ACT" row, i.e. exactly
-- backwards.
--
-- Fix: break the tie with ingested_at desc, so "latest known team" means
-- the most recently ingested row, not an arbitrary one.
-- ═══════════════════════════════════════════════════════════════════════════════

create or replace view public.nfl_rosters_latest as
select distinct on (coalesce(gsis_id, full_name))
  *
from public.nfl_rosters
order by coalesce(gsis_id, full_name), season desc, week desc, ingested_at desc;
