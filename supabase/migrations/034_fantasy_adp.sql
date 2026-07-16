-- ═══════════════════════════════════════════════════════════════════════════════
-- 034_fantasy_adp.sql — Average Draft Position (ADP) for the fantasy value board
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- Feeds docs/FANTASY_VALUE_VS_ADP_SPEC.md. One row per (player, source, as_of_date).
-- Seed from a manual CSV (scripts/parse-adp.js → this table) or a future scrape.
-- The value report joins this to player_season_stats to compute value-vs-ADP.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.fantasy_adp (
  id          bigserial   primary key,
  player_id   text,                      -- nflverse gsis id when resolvable (else name-join)
  player      text        not null,
  position    text,
  team        text,
  adp         numeric     not null,      -- overall average draft position
  adp_round   int,                       -- optional; derived if absent (ceil(adp/12))
  adp_pos_rank int,                      -- optional; positional ADP rank (e.g. WR20)
  scoring     text        default 'ppr', -- ppr | half | standard (ADP varies by format)
  source      text        not null default 'manual',
  as_of_date  date        not null default current_date,
  created_at  timestamptz not null default now(),

  unique (player, source, scoring, as_of_date)
);
create index if not exists fantasy_adp_latest_idx
  on public.fantasy_adp (as_of_date desc, position);

alter table public.fantasy_adp enable row level security;
create policy "public_read_fantasy_adp" on public.fantasy_adp for select using (true);
