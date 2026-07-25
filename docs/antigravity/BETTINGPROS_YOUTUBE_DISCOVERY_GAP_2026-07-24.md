# BettingPros YouTube Discovery Gap - 2026-07-24

## New YouTube Discoveries

| ID | YouTube Title | URL | Current Mapping |
|---|---|---|---|
| Y1 | 14 LONGSHOT NFL Futures To Make Now \| SLEEPERS, Player Props Picks & Predictions | https://www.youtube.com/watch?v=qGJ2f1fEXHc | New YouTube discovery; not yet mapped to a processed RSS/audio episode. |
| Y2 | Top 12 NFL Best Bets & Playoff Predictions \| Division Winners, No. 1 Seeds & Futures Picks (2026) | https://www.youtube.com/watch?v=aOUy4-ZRzbE | New YouTube discovery; likely title mismatch versus the RSS/audio catalog. |
| Y3 | Top 10 NFL Futures Bets to Make Now \| MVP, Rookie of the Year & More! | https://www.youtube.com/watch?v=veVjJ_EUYdk | New YouTube discovery; awards futures focus. |
| Y4 | 9 Early NFL Week 1 Best Bets To Make NOW \| ATS, Totals & Moneyline Picks & Predictions (2026) | https://www.youtube.com/watch?v=uirj8AVs8so | Likely maps to the processed BettingPros Week 1 episode, but the YouTube title differs from the RSS title. |
| Y5 | Drafting the ULTIMATE 2026 NFL Futures Card \| Win Totals, Division Winners & Award Sleepers | https://www.youtube.com/watch?v=4OxpAX6UJlM | New YouTube discovery; very high futures relevance. |

## Why These Did Not Surface Cleanly

The current automated podcast ingest path is RSS/audio-first. `agents/podcast-ingest.js` fetches configured RSS feeds, parses recent `<item>` entries, requires an RSS enclosure audio URL, and processes only the latest pending backlog up to `MAX_PER_RUN` per run. It does not subscribe to YouTube channel or playlist feeds.

There are four concrete miss modes:

1. YouTube-only coverage gap: playlist/channel uploads are invisible unless the same item also appears in a configured podcast RSS feed.
2. Title mismatch: BettingPros YouTube titles are SEO-style video titles, while processed local RSS titles often include episode numbers and different phrasing.
3. Recency window: the RSS parser only returns items published within the last 7 days, so older relevant videos need an explicit backfill path.
4. Run cap: the default `MAX_PER_RUN=3` can leave relevant items queued when several shows publish close together.

## Recommended Local Fix

Keep the RSS/audio pipeline as-is, but add a separate local YouTube discovery lane:

1. Track manually found YouTube URLs in `docs/antigravity/youtube-url-backfill-tracker.xlsx`.
2. Run Gemini YouTube extraction in discovery-only mode when there is no processed baseline yet.
3. If a video matches a processed RSS/audio episode, backfill `data/podcasts/episode-metadata-overrides.json` with the direct YouTube URL.
4. For genuinely new futures episodes, add them to a local candidate queue first, then decide separately whether to ingest/transcribe them as first-class podcast intel.

