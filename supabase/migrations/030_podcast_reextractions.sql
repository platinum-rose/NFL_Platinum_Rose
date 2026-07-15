-- ═══════════════════════════════════════════════════════════════════════════════
-- NFL Platinum Rose — Podcast Re-Extraction Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Purpose: store improved picks + intel re-extracted from the ALREADY-STORED raw
-- transcripts in podcast_transcripts.transcript_text — using full-transcript
-- chunking (the original ingest only fed the first ~12k chars to GPT-4o).
--
-- Non-destructive by design: the baseline extraction stays untouched in
-- podcast_transcripts.picks / .intel. Results here are keyed by (episode_id, model)
-- so a future Fable pass writes its own rows alongside the GPT-4o rows for A/B.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.podcast_reextractions (
  id                uuid        primary key default gen_random_uuid(),
  episode_id        uuid        not null references public.podcast_episodes(id) on delete cascade,
  model             text        not null,          -- 'gpt-4o' | 'fable-5' | ...
  picks             jsonb       not null default '[]'::jsonb,
  intel             jsonb       not null default '[]'::jsonb,
  chunk_count       int,                            -- how many transcript chunks were analyzed
  transcript_chars  int,                            -- length of the source transcript
  baseline_picks    int,                            -- podcast_transcripts.picks count at re-extract time (A/B)
  baseline_intel    int,                            -- podcast_transcripts.intel count at re-extract time (A/B)
  vault_path        text,                           -- Obsidian note path written, if any
  created_at        timestamptz not null default now(),
  unique (episode_id, model)                        -- one row per model per episode; re-runs upsert
);

create index if not exists podcast_reextractions_episode_idx
  on public.podcast_reextractions (episode_id);

create index if not exists podcast_reextractions_model_idx
  on public.podcast_reextractions (model, created_at desc);

-- RLS: mirror podcast_transcripts (public read via anon key, service_role writes)
alter table public.podcast_reextractions enable row level security;

create policy "public_read_podcast_reextractions"
  on public.podcast_reextractions for select
  using (true);
