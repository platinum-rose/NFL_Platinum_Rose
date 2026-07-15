-- ═══════════════════════════════════════════════════════════════════════════════
-- NFL Platinum Rose — Normalized Signals (S274, intel-extraction build #1)
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- Purpose: turn raw, unstructured intel (RSS article title+summary, the free-text
-- podcast intel STRINGS that portfolio-dossier currently drops, and podcast/expert
-- picks) into clean, team-canonical, DIRECTIONAL betting signals an inference model
-- can actually reason over. Produced by an LLM pass (agents/signal-normalize.js).
--
-- Keyed by (model, source_type, source_ref, team, market) so a future Fable pass
-- writes its own rows alongside the GPT-4o rows for A/B, and re-runs upsert cleanly.
-- Non-destructive: raw sources (research_intel_notes, podcast_transcripts) untouched.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.normalized_signals (
  id            uuid        primary key default gen_random_uuid(),
  model         text        not null,                 -- 'gpt-4o' | 'fable-5' | ...
  source_type   text        not null,                 -- article | podcast_intel | podcast_pick | expert_pick
  source_ref    text        not null,                 -- stable ref: note id / transcript id + index / pick id
  raw_text      text,                                 -- original snippet, for audit
  team          text,                                 -- canonical NFL nickname (e.g. 'Rams'); null if not team-specific
  market        text,                                 -- superbowl|conference|division|wins|playoffs|game|award|prop|other
  direction     text,                                 -- back|fade|over|under|na
  strength      real,                                 -- 0..1 model-estimated conviction of the signal
  is_nfl        boolean     not null default true,    -- false rows are kept for audit but ignored by consumers
  rationale     text,                                 -- one-line why, from the model
  created_at    timestamptz not null default now(),
  unique (model, source_type, source_ref, team, market)
);

create index if not exists normalized_signals_team_idx  on public.normalized_signals (team, market) where is_nfl;
create index if not exists normalized_signals_model_idx on public.normalized_signals (model);
