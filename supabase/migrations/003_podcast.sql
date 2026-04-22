-- ═══════════════════════════════════════════════════════════════════════════════
-- NFL Platinum Rose — Podcast Ingest Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── podcast_feeds ────────────────────────────────────────────────────────────
-- Configured RSS sources. Seeded below with the 4 known feeds.

create table if not exists public.podcast_feeds (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,           -- display name: 'Sharp or Square'
  expert      text        not null,           -- maps to expert name in app
  rss_url     text        not null unique,
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- Seed the 4 configured feeds
insert into public.podcast_feeds (name, expert, rss_url) values
  (
    'Sharp or Square',
    'Sharp or Square',
    'https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/291fe8ed-f80d-4107-9ee1-b34c015266d0/51f38aeb-0341-43f7-a21b-b34c01526b07/podcast.rss'
  ),
  (
    'Even Money',
    'Even Money',
    'https://feeds.megaphone.fm/DFT4986441816'
  ),
  (
    'Action Network Sports Betting',
    'Action Network',
    'https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/390f52fb-437c-4290-bdaa-b3ec011d3fc8/2d9ae039-d4b2-4a37-8a77-b3ec011d3fce/podcast.rss'
  ),
  (
    'Sharp Football Analysis',
    'Warren Sharp',
    'https://feeds.simplecast.com/UiNmc8XS'
  )
on conflict (rss_url) do nothing;

-- RLS: anyone can read, service_role writes
alter table public.podcast_feeds enable row level security;

create policy "public_read_podcast_feeds"
  on public.podcast_feeds for select
  using (true);


-- ─── podcast_episodes ─────────────────────────────────────────────────────────
-- One row per RSS <item>. The agent inserts on discovery; status tracks progress.

create table if not exists public.podcast_episodes (
  id              uuid        primary key default gen_random_uuid(),
  feed_id         uuid        not null references public.podcast_feeds(id) on delete cascade,
  guid            text        not null unique,   -- RSS <guid> — dedup key
  title           text,
  pub_date        timestamptz,
  audio_url       text,
  duration_secs   int,
  file_size_bytes bigint,                        -- from Content-Length or null
  status          text        not null default 'pending',
    -- 'pending' | 'transcribing' | 'extracting' | 'done' | 'error' | 'skipped'
  error_msg       text,
  is_partial      boolean     not null default false,  -- true if audio was truncated
  discovered_at   timestamptz not null default now()
);

create index if not exists podcast_episodes_feed_status_idx
  on public.podcast_episodes (feed_id, status);

create index if not exists podcast_episodes_pub_date_idx
  on public.podcast_episodes (pub_date desc);

-- RLS: anyone can read (anon key), service_role writes
alter table public.podcast_episodes enable row level security;

create policy "public_read_podcast_episodes"
  on public.podcast_episodes for select
  using (true);


-- ─── podcast_transcripts ──────────────────────────────────────────────────────
-- One row per processed episode. Stores full transcript text + extracted picks + intel.

create table if not exists public.podcast_transcripts (
  id               uuid        primary key default gen_random_uuid(),
  episode_id       uuid        not null unique references public.podcast_episodes(id) on delete cascade,
  transcript_text  text        not null,
  picks            jsonb       not null default '[]'::jsonb,
    -- array of { selection, team1, team2, type, line, summary, units, game_date, confidence }
  intel            jsonb       not null default '[]'::jsonb,
    -- array of strings: non-pick analysis, injury notes, weather, etc.
  whisper_minutes  numeric(8,2),   -- audio duration billed (cost tracking)
  model_used       text,            -- 'whisper-1', 'gpt-4o', etc.
  processed_at     timestamptz not null default now()
);

create index if not exists podcast_transcripts_processed_idx
  on public.podcast_transcripts (processed_at desc);

-- RLS: anyone can read
alter table public.podcast_transcripts enable row level security;

create policy "public_read_podcast_transcripts"
  on public.podcast_transcripts for select
  using (true);
