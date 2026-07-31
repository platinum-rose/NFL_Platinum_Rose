# YouTube Data API OAuth Setup

## Cost

The YouTube Data API is free for this local discovery workflow. It uses a daily quota, not per-call billing. Google's current default quota is 10,000 units per day, and the calls used here are low-cost read calls.

Expected local usage:

| Call | Purpose | Quota Cost |
|---|---|---:|
| `subscriptions.list` | Read your subscribed channels | 1 unit per page |
| `playlists.list` | Read playlists owned by your account | 1 unit per page |
| `playlistItems.list` | Read videos in selected playlists | 1 unit per page |

Avoid `search.list` as the primary sweep mechanism; it is much more quota-expensive and less deterministic than polling selected channels/playlists.

## Google Cloud Setup

1. Create or select a Google Cloud project.
2. Enable **YouTube Data API v3**.
3. Configure the OAuth consent screen for personal/internal use.
4. Create an OAuth Client ID:
   - Application type: **Desktop app** is preferred.
   - If using a Web app client, add this authorized redirect URI:
     `http://127.0.0.1:53682/oauth2callback`
5. Download the client JSON.
6. Save it locally as:
   `config/youtube-oauth-client.json`

That file is ignored by git.

## Local OAuth Handshake

Run:

```powershell
npm.cmd run youtube:oauth
```

The script prints a Google authorization URL. Open it, approve read-only YouTube access, and the local callback stores the token at:

`data/secrets/youtube-oauth-token.json`

That token file is also ignored by git.

## Discover Account Sources

After OAuth succeeds, run:

```powershell
npm.cmd run youtube:discover-account
```

This writes:

- `data/podcasts/youtube-account-discovery.json`
- `config/youtube-podcast-sources.local.json`

The local source config starts with all subscriptions/playlists as candidates. Move only relevant channel IDs or playlist IDs into the include lists before wiring scheduled Gemini ingestion.

## Sweep For New Podcast Candidates

Discovery-only sweep across explicitly included channels:

```powershell
npm.cmd run youtube:sweep
```

Capped discovery-only sweep for routine local checks:

```powershell
npm.cmd run youtube:sweep:capped
```

Temporary sweep across all candidate subscribed channels:

```powershell
npm.cmd run youtube:sweep:all -- --lookback-days 30 --max-per-run 10
```

Queue one or more known YouTube videos directly without scanning channels or running Gemini:

```powershell
npm.cmd run youtube:queue-url -- --url qoCm4G2Jmng --url OAxHvrVUPpw
```

The direct URL path accepts bare video IDs, `youtu.be` links, `/watch?v=...` links, Shorts links, and embed links. Use `--playlist-id` or `--playlist-url` when you intentionally want playlist discovery; watch URLs with a `list=` parameter only queue the watched video.

The sweep filters for NFL-relevant titles and requires videos to be at least 10 minutes by default, which avoids most YouTube Shorts and small clips. Useful options:

- `--min-duration-minutes 20`
- `--rescan`
- `--include-shorts`
- `--no-channel-sweep`
- `--max-per-channel 2`
- `--score-only`
- `--run-gemini`
- `--skip-existing`
- `--only-id youtube-qoCm4G2Jmng`
- `--gemini-scope futures`
- `--gemini-scope all`

Only use `--run-gemini` when you explicitly want live Gemini extraction calls. By default, Gemini only runs on candidates with `content_lane: "futures_intel"` and `gemini_futures_eligible: true`.

For YouTube video extraction, known candidate runtimes are passed into Gemini. If the model only covers the intro or otherwise stops well before the known duration, the observation is saved with `reprocess_required: true`, the batch report includes a `reprocess_queue`, and the command exits with a warning status. Re-run that episode without `--skip-existing` so the incomplete observation is replaced.

If repeated full-video retries still fail coverage, use segmented fallback mode. This makes multiple Gemini calls across fixed time windows, then merges the structured output:

```powershell
npm.cmd run youtube:run-futures-candidates -- --only-id youtube-OAxHvrVUPpw --max-per-run 1 --run-gemini --segment-seconds 420
```

For transient Gemini `503 UNAVAILABLE` responses, add bounded retries:

```powershell
npm.cmd run youtube:run-futures-candidates -- --only-id youtube-OAxHvrVUPpw --max-per-run 1 --run-gemini --segment-seconds 420 --max-retries 2 --retry-delay-seconds 30
```

To re-score the saved candidate queue locally without touching YouTube or Gemini:

```powershell
npm.cmd run youtube:score-candidates
```

To preview the saved futures/intel queue in Gemini run order:

```powershell
npm.cmd run youtube:run-futures-candidates -- --max-per-run 5
```

To preview exact queued videos before approving transcription:

```powershell
npm.cmd run youtube:run-futures-candidates -- --only-id youtube-qoCm4G2Jmng --only-id youtube-OAxHvrVUPpw --max-per-run 2 --skip-existing
```

To preview the next capped saved-candidate batch while skipping completed observations:

```powershell
npm.cmd run youtube:run-futures-candidates:capped
```

To actually run Gemini on those saved futures/intel candidates:

```powershell
npm.cmd run youtube:run-futures-candidates -- --max-per-run 5 --run-gemini
```

To continue a batch without re-running videos that already have saved observations:

```powershell
npm.cmd run youtube:run-futures-candidates -- --max-per-run 11 --skip-existing --run-gemini
```

After Gemini has produced observations, build the local review report:

```powershell
npm.cmd run youtube:review-futures
```

The report generator writes:

- `data/shadow-harness/reports/youtube-futures-intel-review-latest.json`
- `docs/antigravity/youtube-futures-intel-review-latest.md`
- `data/shadow-harness/review/youtube-futures-intel-review-status.json`

Each extracted item is assigned an `item_lane` such as `futures_pick`, `injury_intel`, `training_camp_intel`, `market_context`, or `non_futures_betting`. The status file is human-editable and supports `pending_review`, `needs_review`, `context_only`, `promote_to_local_intel`, and `reject`. It is a local review ledger only; it does not promote official picks.

To verify the current 11-episode pilot fixture:

```powershell
npm.cmd run test:youtube-futures-review
```

## Promote Reviewed Local Intel

To review and change statuses in a local browser UI:

```powershell
npm.cmd run youtube:review-ui
```

Then open:

`http://127.0.0.1:3876/`

The page lets you filter by lane, status, flag, team, and text search. Status and reviewer-note changes save to `data/shadow-harness/review/youtube-futures-intel-review-status.json`. The **Export Promoted** button runs the same local export gate as `npm.cmd run youtube:export-local-intel`.

If editing the JSON ledger directly, change only the items you want available to downstream local agents to:

```json
"status": "promote_to_local_intel"
```

Then export the reviewed local queue:

```powershell
npm.cmd run youtube:export-local-intel
```

This writes:

- `data/shadow-harness/review/youtube-futures-local-intel-queue.json`
- `docs/antigravity/youtube-futures-local-intel-queue.md`

Only `promote_to_local_intel` items are exported. `pending_review`, `needs_review`, `context_only`, and `reject` items are skipped. The export is still local intel only; it is not an official pick ledger, production recommendation, Supabase write, or parlay change.

To verify the export gate:

```powershell
npm.cmd run test:youtube-local-intel-export
```

## Build Agent Summary

After exporting reviewed local intel, build the read-only agent-facing summary:

```powershell
npm.cmd run youtube:agent-intel-summary
```

This writes:

- `data/shadow-harness/review/youtube-futures-agent-intel-summary.json`
- `docs/antigravity/youtube-futures-agent-intel-summary.md`

The agent summary groups reviewed intel by team and market, preserves source timestamp links, includes supporting quotes and review flags, and checks that the rejected `DET division_winner +1500` extraction does not leak through.

To verify the agent summary gate:

```powershell
npm.cmd run test:youtube-agent-intel-summary
```

Each saved candidate gets:

- `content_lane`: `futures_intel`, `fantasy`, or `general_nfl`
- `futures_score`
- `futures_score_reasons`
- `gemini_futures_eligible`

This keeps the broad Platinum Rose subscription set usable for future fantasy-football workflows while letting the current futures workflow stay selective.

## Guardrails

- Read-only YouTube OAuth only.
- Local candidate discovery first.
- Do not write to Supabase from this flow.
- Do not treat discovered videos as official betting intel until promoted by a separate reviewed step.
- Run Gemini ingestion only with an explicit live flag.
- Keep routine sweeps capped and review generated observations before any local intel promotion.
