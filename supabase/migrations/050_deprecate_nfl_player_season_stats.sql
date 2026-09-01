-- 050_deprecate_nfl_player_season_stats.sql
-- DATA-LAYER-LOCKDOWN item (4), part 2/2: player-season-stats divergence.
-- Run in: Supabase Dashboard -> SQL Editor -> New query
--
-- Live-verified 2026-09-01 (Claude/Cowork, read-only queries against
-- production): public.nfl_player_season_stats (migration 014, 2020-2024,
-- source='nfl-data-py', 3016 rows, last written 2026-06-26) and
-- public.player_season_stats (migration 032, 2022-2025, source='nflverse',
-- 7963 rows, last written 2026-07-16) are two independently-built
-- season-level player stat tables that were flagged in the 2026-07-21 audit
-- as "worth confirming they're not diverging sources of truth" and never
-- actually checked until now.
--
-- They diverge for real: of 1,773 (player_id, season) pairs present in
-- BOTH tables (seasons 2022-2024 overlap), 946 (53%) have mismatched stat
-- values -- not rounding noise. Example: nfl_player_season_stats has Tom
-- Brady's 2022 season at games=18 (impossible -- an NFL regular season is
-- 17 games) and pass_yards=5045; player_season_stats has games=17,
-- pass_yards=4694 (matches Brady's real 2022 total). The nfl-data-py
-- pipeline behind nfl_player_season_stats has at least one real
-- data-quality bug; it was never debugged because nothing reads that
-- table's output.
--
-- Confirmed by full-codebase grep (agents/, scripts/, src/): ZERO live
-- readers of nfl_player_season_stats anywhere -- only its own writer,
-- scripts/seed-historical-stats.py (an annual, mostly-manual backfill; see
-- .github/workflows/nflverse-data-refresh.yml). player_season_stats is the
-- one actually consumed live, by agents/fantasy-value-report.js (the
-- Fantasy Value vs ADP feature). So there is no live "which one wins"
-- conflict today -- but the dead table's bad numbers are a real trap for
-- any future session or agent that queries "player season stats" without
-- already knowing which of the two is current.
--
-- This migration is documentation-only, matching the low-risk precedent
-- Andy already chose for the sibling GAMEID-FORMAT latent risk (option b:
-- a shared helper / clear signage, not a live-table rewrite -- see
-- src/lib/gameId.js and docs/NFL_AUDIT_BACKLOG.md's GAMEID-FORMAT entry).
-- It does not drop, rename, or touch a single row. Retiring the table
-- outright (option c-equivalent: drop nfl_player_season_stats, or migrate
-- scripts/seed-historical-stats.py to write player_season_stats instead)
-- is a real, irreversible-if-dropped decision left open for Andy -- see
-- docs/NFL_AUDIT_BACKLOG.md's PLAYERSTATS-DUP entry.

comment on table public.nfl_player_season_stats is
  'DEPRECATED / UNUSED as of 2026-09-01 -- do not read this table for current player-season stats. '
  'Superseded by public.player_season_stats (migration 032), the table agents/fantasy-value-report.js '
  'actually reads. Confirmed diverging: 53% of overlapping (player_id, season) rows have mismatched '
  'values, and this table has at least one known data-quality bug (e.g. a Tom Brady 2022 row with '
  'games=18, which is not possible). Only writer is scripts/seed-historical-stats.py (annual backfill). '
  'See docs/NFL_AUDIT_BACKLOG.md PLAYERSTATS-DUP and supabase/migrations/050_deprecate_nfl_player_season_stats.sql '
  'for the full investigation. Kept live (not dropped) pending Andy''s explicit decision on full retirement.';
