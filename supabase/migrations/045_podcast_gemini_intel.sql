-- ═══════════════════════════════════════════════════════════════════════════════
-- 045_podcast_gemini_intel.sql
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Phase 5 of docs/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md — production wiring
-- for the Gemini --live-youtube extraction pipeline (Phases 1-4, S302-S304).
-- Gemini becomes a real Supabase- and vault-writing extractor via a NEW sibling
-- agent (agents/podcast-gemini-intel.js), alongside agents/podcast-ingest.js
-- (untouched, still the GPT-4o/AssemblyAI production path). Same non-destructive
-- (episode_id, model) pattern as podcast_reextractions (030) / podcast_host_summaries
-- (035) — existing production data is untouched either way.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── podcast_episodes: YouTube URL backfill ──────────────────────────────────
-- Populated by scripts/resolve-youtube-episode-urls.js, which fuzzy-matches
-- each RSS-ingested episode against its show's YouTube channel upload list.
-- Gemini --live-youtube cannot run without a real video URL — episodes with no
-- resolved match simply keep going through the existing GPT-4o/AssemblyAI path.

alter table public.podcast_episodes
  add column if not exists youtube_url text default null;

create index if not exists podcast_episodes_youtube_url_idx
  on public.podcast_episodes (youtube_url)
  where youtube_url is not null;

comment on column public.podcast_episodes.youtube_url is
  'Resolved YouTube watch URL for this episode (set by scripts/resolve-youtube-episode-urls.js). NULL = no confident match found yet; episode stays on the GPT-4o/AssemblyAI pipeline only.';

-- ─── podcast_gemini_intel ─────────────────────────────────────────────────────
-- One row per (episode, model). Picks + analysis_notes use the Gemini schema
-- from Phase 1 (team/market/side/line/price/week/speaker/source_timestamp for
-- picks; note_type/teams/players/topic/summary/speaker/source_timestamp/quote/
-- confidence for notes) — NOT podcast_transcripts' narrower
-- selection/team1/team2/type shape, since Gemini is the extractor here.
--
-- Review gate is a REAL gate, not bookkeeping: rows land with
-- promoted_at = null. A separate promotion step (agents/podcast-gemini-intel.js
-- --promote, human-reviewed) sets promoted_at and writes one Obsidian vault
-- note PER HOST (picks/notes grouped by each item's own "speaker" field,
-- resolved to a canonical host name via src/lib/experts.js::findExpert() —
-- Gemini already names the speaker per item, unlike the AssemblyAI pipeline's
-- anonymous diarization labels, so no audio-based speaker-mapping is needed
-- here) — same picks_promoted_at convention as migration 005's
-- podcast_transcripts.picks_promoted_at. Only promoted_at IS NOT NULL rows are
-- vault-written or agent-tool-visible (src/lib/agentTools.js
-- get_youtube_futures_intel queries this table filtered accordingly).

create table if not exists public.podcast_gemini_intel (
  id                uuid        primary key default gen_random_uuid(),
  episode_id        uuid        not null references public.podcast_episodes(id) on delete cascade,
  model             text        not null default 'gemini-3.5-flash',
  youtube_url       text,                                    -- URL actually sent to Gemini for this run
  picks             jsonb       not null default '[]'::jsonb, -- Phase 1 extracted_picks shape (incl. survivor_pick/pickem_pick, week)
  analysis_notes    jsonb       not null default '[]'::jsonb, -- Phase 1 analysis_notes shape
  quote_timestamps  jsonb       not null default '[]'::jsonb,
  cost_usd          numeric,
  latency_ms        int,
  input_tokens      int,
  output_tokens     int,
  vault_paths       jsonb       not null default '[]'::jsonb, -- one path PER HOST (see agents/podcast-gemini-intel.js); [] until promoted
  promoted_at       timestamptz default null,                 -- NULL = not yet promoted; review gate
  created_at        timestamptz not null default now(),
  unique (episode_id, model)
);

create index if not exists podcast_gemini_intel_episode_idx
  on public.podcast_gemini_intel (episode_id);

create index if not exists podcast_gemini_intel_model_idx
  on public.podcast_gemini_intel (model, created_at desc);

create index if not exists podcast_gemini_intel_unpromoted_idx
  on public.podcast_gemini_intel (promoted_at)
  where promoted_at is null;

-- GIN indexes so downstream queries (get_youtube_futures_intel, future
-- survivor/pick'em Phase 6 tracker) can filter into the jsonb arrays directly,
-- same approach as podcast_host_summaries_futures_gin_idx (035).
create index if not exists podcast_gemini_intel_picks_gin_idx
  on public.podcast_gemini_intel using gin (picks);

create index if not exists podcast_gemini_intel_notes_gin_idx
  on public.podcast_gemini_intel using gin (analysis_notes);

comment on column public.podcast_gemini_intel.promoted_at is
  'Set by agents/podcast-gemini-intel.js --promote after human review. NULL = not yet promoted; not vault-written, not agent-tool-visible.';

-- RLS: mirror podcast_reextractions/podcast_host_summaries (public read via anon key, service_role writes)
alter table public.podcast_gemini_intel enable row level security;

create policy "public_read_podcast_gemini_intel"
  on public.podcast_gemini_intel for select
  using (true);
