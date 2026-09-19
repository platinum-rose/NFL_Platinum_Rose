-- NFL Platinum Rose — Migration 055
-- Problem: user_picks_natural_key_unique (source, game_id, pick_type, line) from 021 was built
--          for the personal pick tracker. For source='EXPERT' it rejects legitimate rows: two
--          podcasts taking CHI -4.5, or two player props in one game at 4.5. One collision fails
--          the whole per-episode upsert in agents/pick-extraction.js (2026-09-19 re-extract:
--          7 of 16 pick-bearing episodes dropped).
-- Fix:     keep the guard for every non-EXPERT source; EXPERT rows dedupe on their
--          deterministic id (EXPERT-{game}-{type}-ep{episode8}-{index}).
begin;
alter table public.user_picks drop constraint if exists user_picks_natural_key_unique;
create unique index if not exists user_picks_natural_key_unique
  on public.user_picks (source, game_id, pick_type, line)
  where source <> 'EXPERT';
commit;
