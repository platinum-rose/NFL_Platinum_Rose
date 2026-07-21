-- ═══════════════════════════════════════════════════════════════════════════════
-- NFL Platinum Rose — Podcast Diarization Fix (missed shows)
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Correction to 036_podcast_diarization.sql: that migration only flagged 3 shows
-- for diarization (Sharp or Square, Even Money, The Favorites), based on an
-- incomplete first pass that called BettingPros Podcast and Action Network
-- Sports Betting Podcast "single-voice." src/lib/experts.js — the app's own
-- roster, already in the repo — says otherwise:
--   BettingPros Podcast: "Rotating roster: Perrault, Pisapia, Furman,
--     Fitzmaurice, Erickson, Welsh, Bogman, Woolcock + guests"
--   Action Network Sports Betting: "Koerner, Raybon, Brandon Anderson,
--     Collin Wilson + rotating guests"
-- packages/m6-podcast-service/python/nfl_podcast/show_hosts.json (the Python
-- diarization scaffold) already had this right — it has tuning config for 5
-- shows, not 3. Only Warren Sharp (Sharp Football Analysis) is genuinely a
-- single dominant voice for podcast-episode purposes and stays undiarized.
-- ═══════════════════════════════════════════════════════════════════════════════

update public.podcast_feeds
set needs_diarization = true
where name in ('BettingPros Podcast', 'Action Network Sports Betting');
