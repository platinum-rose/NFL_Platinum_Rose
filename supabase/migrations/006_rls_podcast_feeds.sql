-- ─── Fix: enable RLS on podcast_feeds ─────────────────────────────────────
-- podcast_feeds was created in 003_podcast.sql without RLS enabled.
-- Supabase flagged this as rls_disabled_in_public (2026-04-22).
--
-- podcast_feeds contains only RSS feed configuration (no PII, no user data),
-- so a public-read / service-role-write policy is appropriate — matching the
-- pattern used by podcast_episodes and podcast_transcripts.

alter table public.podcast_feeds enable row level security;

create policy "public_read_podcast_feeds"
  on public.podcast_feeds for select
  using (true);

-- Writes (INSERT/UPDATE/DELETE) are blocked for the anon key by default once
-- RLS is enabled; the service_role key bypasses RLS and can still write.
