-- 051_feed_health.sql
-- Feed-outage alerting for agents/research-intel-ingest.js.
-- Run in: Supabase Dashboard -> SQL Editor -> New query
--
-- Why this exists: Action Network's RSS feed silently 403'd for 6+ days
-- (2026-08-25 through 2026-08-31) before anyone noticed -- the ingest agent
-- treats a dead feed as a soft per-feed `status: 'unavailable'` rather than
-- throwing, so the GitHub Actions workflow reported green on every run the
-- entire time, and nothing else was watching. See TASK_BOARD.md's
-- B-actionnetwork-feed-403 entry for the fix to that specific feed; this
-- table + the alerting logic added alongside it in research-intel-ingest.js
-- is the general fix -- so the NEXT feed that goes dark (any of them, not
-- just Action Network) gets caught within about a day instead of a week.
--
-- One row per feed source, upserted every ingest run (twice daily).
-- consecutive_failures resets to 0 on any successful fetch. alert_sent_at is
-- set the run an outage first crosses the alert threshold, and cleared again
-- on recovery -- so each distinct outage triggers exactly one "down" email
-- and, once it recovers, exactly one "recovered" email, not a repeat every run.

create table if not exists public.feed_health (
  source                text primary key,
  last_status           text not null,               -- 'available' | 'unavailable' | 'error'
  last_reason           text,
  consecutive_failures  integer not null default 0,
  last_success_at       timestamptz,
  last_checked_at       timestamptz not null default now(),
  alert_sent_at         timestamptz,                  -- set while an outage's "down" alert has fired and not yet recovered
  updated_at            timestamptz not null default now()
);

comment on table public.feed_health is
  'Per-source health tracking for research-intel-ingest.js''s RSS/feed fetches. '
  'Written every ingest run (research-intel-ingest.yml, twice daily). Drives the '
  'consecutive-failure email alert in the same script -- see checkFeedHealthAndAlert() '
  'and TASK_BOARD.md''s B-actionnetwork-feed-403 entry.';

alter table public.feed_health enable row level security;

-- Public read, matching this repo's existing pattern for research/signal
-- tables (e.g. migration 049's intel_verification policy). Writes stay
-- service-role-only since research-intel-ingest.js connects with the
-- service-role key, which bypasses RLS.
create policy "feed_health_public_read" on public.feed_health
  for select using (true);
