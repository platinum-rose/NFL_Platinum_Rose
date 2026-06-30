-- ═══════════════════════════════════════════════════════════════════════════════
-- 029_podcast_feeds_update.sql
-- Add The Favorites (relaunched with new hosts) to podcast_feeds.
-- Update Sharp or Square name to reflect new network (iHeartPodcasts / The Volume).
--
-- Verified feed URLs via iTunes Search API 2026-06-29:
--   Sharp or Square   → same Omny URL, now on iHeartPodcasts/The Volume
--   Even Money        → same Megaphone URL ✓
--   The Favorites     → new Omny URL (Playmaker/iHeartPodcasts); new hosts:
--                       Kendra Middleton, Brandon Kravitz, Stuckey
--   Sunday Sixpack    → discontinued as standalone; content absorbed into
--                       Action Network Sports Betting Podcast (already in table)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add The Favorites (new hosts, new feed URL)
insert into public.podcast_feeds (name, expert, rss_url)
values (
  'The Favorites',
  'The Favorites',
  'https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/f806745c-9af9-4941-bf75-ae3300346a6c/012b8953-dca4-461c-becc-ae3300346a7a/podcast.rss'
)
on conflict (rss_url) do nothing;

-- Add BettingPros Podcast (main weekly show)
-- Hosts: Matt Perrault, Joe Pisapia, Terrell Furman Jr., Pat Fitzmaurice,
--        Andrew Erickson, Chris Welsh, Scott Bogman, Seth Woolcock + guests
-- Feed verified via iTunes Search API 2026-06-29
insert into public.podcast_feeds (name, expert, rss_url)
values (
  'BettingPros Podcast',
  'BettingPros',
  'https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/80c4e557-2a08-4bc7-92ea-b2d70144b89e/76a7de50-facb-42a2-b042-b2d70144b8af/podcast.rss'
)
on conflict (rss_url) do nothing;

-- Update Sharp or Square display name to note network move
-- (RSS URL unchanged — feed migrated from VSiN to iHeartPodcasts/The Volume)
update public.podcast_feeds
set name = 'Sharp or Square'
where rss_url = 'https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/291fe8ed-f80d-4107-9ee1-b34c015266d0/51f38aeb-0341-43f7-a21b-b34c01526b07/podcast.rss';
