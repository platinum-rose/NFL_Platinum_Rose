-- ═══════════════════════════════════════════════════════════════════════════════
-- NFL Platinum Rose — Podcast Diarization Support
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Purpose: real per-host attribution for the 3 multi-host shows (Sharp or Square,
-- Even Money, The Favorites) requires actual speaker-turn boundaries, which the
-- existing transcript pipeline never captured — podcast_transcripts.transcript_text
-- is a single flat prose string (see 003_podcast.sql), no speaker/turn structure
-- at all. Decision (2026-07-20, see docs/PODCAST_HOST_SUMMARY_PIPELINE_PLAN.md
-- Phase 2 attribution note): turn on AssemblyAI's built-in speaker_labels for
-- shows that need it, rather than the heavier GPU-bound M6 WhisperX/pyannote
-- pipeline (packages/m6-podcast-service) or unreliable LLM-guessed attribution
-- from unstructured text.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Which feeds need diarized (AssemblyAI speaker_labels) transcription. Default
-- false — single-host shows (Warren Sharp, Action Network) don't need this;
-- Groq's free tier remains the default transcription path for them.
alter table public.podcast_feeds
  add column if not exists needs_diarization boolean not null default false;

update public.podcast_feeds
set needs_diarization = true
where name in ('Sharp or Square', 'Even Money', 'The Favorites');

-- Raw diarized utterances from AssemblyAI (when needs_diarization = true for the
-- episode's feed): array of { speaker, text, start, end } — speaker is an
-- anonymous AssemblyAI label ('A', 'B', ...), resolved to a real host name by
-- agents/lib/speaker-attribution.js at extraction time, not stored here.
-- Null/empty for episodes transcribed via Groq/plain-Whisper (no diarization).
alter table public.podcast_transcripts
  add column if not exists speaker_segments jsonb not null default '[]'::jsonb;
