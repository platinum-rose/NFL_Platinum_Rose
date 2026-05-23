-- ═══════════════════════════════════════════════════════════════════════════════
-- NFL Platinum Rose — Stable Pick IDs (Migration 021)
--
-- Problem: pick IDs embedded Date.now() → same logical pick logged twice
--          generated two rows with different IDs → P&L double-counted.
-- Fix:     Add UNIQUE constraint on (source, game_id, pick_type, line).
--          Dedup existing rows first (keep earliest created_at per key).
--
-- Apply via: Supabase Dashboard → SQL Editor → New query (run as superuser)
-- ═══════════════════════════════════════════════════════════════════════════════

begin;

-- Step 1: Dedup existing rows.
-- For each (source, game_id, pick_type, line) group, keep the row with the
-- earliest created_at and delete the rest.
delete from public.user_picks
where id not in (
    select distinct on (source, game_id, pick_type, line) id
    from public.user_picks
    order by source, game_id, pick_type, line, created_at asc nulls last
);

-- Step 2: Add UNIQUE constraint to enforce the natural key going forward.
alter table public.user_picks
    add constraint user_picks_natural_key_unique
    unique (source, game_id, pick_type, line);

-- Step 3: Update the id column comment to reflect the new format.
comment on column public.user_picks.id is
    'client-generated stable key: "{source}-{gameId}-{pickType}-{line}" — no timestamp';

commit;
