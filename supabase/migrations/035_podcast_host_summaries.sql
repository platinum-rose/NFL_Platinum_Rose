-- ═══════════════════════════════════════════════════════════════════════════════
-- NFL Platinum Rose — Podcast Per-Host Summary Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Purpose: replaces the deferred, never-implemented "Fable re-eval" (--model
-- fable-5) branch of podcast-reextract.js. For each episode, produces a detailed
-- per-HOST summary of every Future discussed — prediction/lean, confidence, any
-- stats or historical data cited, and a supporting quote/paraphrase. This is a
-- different shape than podcast_reextractions.intel (a flat list of analytical
-- strings with no speaker or per-future structure) so it gets its own table
-- rather than overloading that one.
--
-- One row per (episode, host, model): multi-host shows (Sharp or Square, Even
-- Money, The Favorites) get a row per co-host per episode; single-host shows
-- (Warren Sharp, Action Network) get one row using feed.expert as the host.
--
-- subject_market/subject intentionally match the taxonomy already used by
-- podcast picks (see getFuturesMovement/getExpertHistory in src/lib/supabase.js)
-- so the nfl-futures-watchlist-2026-07 task can query both tables consistently.
--
-- Non-destructive / A/B-ready like podcast_reextractions: keyed by
-- (episode_id, host, model), so a later Fable-5 comparison pass (Phase 4 of
-- docs/PODCAST_HOST_SUMMARY_PIPELINE_PLAN.md) writes its own rows alongside the
-- GPT-4o rows without touching them.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.podcast_host_summaries (
  id                  uuid        primary key default gen_random_uuid(),
  episode_id          uuid        not null references public.podcast_episodes(id) on delete cascade,
  host                text        not null,          -- attributed host name (feed.expert for single-host shows)
  model               text        not null default 'gpt-4o',  -- 'gpt-4o' | 'fable-5' | ...
  attribution_method  text        not null default 'single_host',
    -- 'single_host' (no attribution needed, whole transcript = one host)
    -- 'host_map'    (multi-host show, speaker matched via show_hosts.json)
    -- 'unknown'     (multi-host show, speaker could not be confidently matched)
  futures             jsonb       not null default '[]'::jsonb,
    -- array of {
    --   subject_market: string,   -- e.g. 'AFC_North', 'MVP', 'Super_Bowl' (matches picks taxonomy)
    --   subject: string,          -- e.g. 'Ravens', 'Josh Allen'
    --   prediction: string,       -- host's stated pick/lean in their own words
    --   lean: string,             -- 'favor' | 'against' | 'over' | 'under' | 'neutral'
    --   confidence: number,       -- 50-95, same convention as podcast_transcripts.picks
    --   stats_cited: [string],    -- any stats/historical data the host referenced
    --   quote: string             -- direct quote or close paraphrase, max ~300 chars
    -- }
  chunk_count         int,                            -- transcript chunks analyzed
  transcript_chars    int,                            -- length of the source transcript
  vault_path          text,                           -- Obsidian note path written, if any
  created_at          timestamptz not null default now(),
  unique (episode_id, host, model)                     -- one row per host per model per episode; re-runs upsert
);

create index if not exists podcast_host_summaries_episode_idx
  on public.podcast_host_summaries (episode_id);

create index if not exists podcast_host_summaries_host_idx
  on public.podcast_host_summaries (host, created_at desc);

create index if not exists podcast_host_summaries_model_idx
  on public.podcast_host_summaries (model, created_at desc);

-- GIN index for querying into the futures jsonb array (e.g. "find every host
-- summary mentioning subject_market = 'AFC_North'") — same approach the
-- futures-watchlist task will need.
create index if not exists podcast_host_summaries_futures_gin_idx
  on public.podcast_host_summaries using gin (futures);

-- RLS: mirror podcast_reextractions (public read via anon key, service_role writes)
alter table public.podcast_host_summaries enable row level security;

create policy "public_read_podcast_host_summaries"
  on public.podcast_host_summaries for select
  using (true);
