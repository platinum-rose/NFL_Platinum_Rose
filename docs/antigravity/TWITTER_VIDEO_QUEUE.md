# Twitter/X Bookmark Video Queue — Antigravity brief

**Queue:** `data/research-intel/twitter-video-queue.json` (written by `agents/twitter-bookmarks-agent.js`
since 2026-09-19). Nothing processes it automatically — an Antigravity session has to be started by Andy.

Each entry: `status` (`pending` → `done` / `skipped`), `author`, `tweet_url`, `bookmark_url`,
`tweet_created_at`, `context` (the post text, ≤280 chars), `type` (`video` | `animated_gif`),
`url` (highest-bitrate mp4), `poster`, `duration_ms`.

## What to do per `pending` entry
1. Skip `animated_gif` and anything under ~15s with no speech → set `status: "skipped"` + `note`.
2. Watch/transcribe the mp4 (`url`). Use `context` to know what the video is about.
3. Extract only bets the author makes (not public-money stats), in this shape:
   `{ bet_type, team_or_market, market, selection, line, odds, rationale }`
   (same fields as `TWEET_PICK_PROMPT` in `agents/lib/tweet-pick-signals.js`).
4. Write one note per video to `data/vault-seed/manual/twitter-video-<tweet_id>.md`: author, tweet_url,
   date, a short summary, and a table of the picks.
5. Set the entry to `status: "done"`, add `processed_at`, `picks_count`, and `note_path`.

## Priority
Current NFL week only; sides/totals/props for games not yet played first. Past-week videos
(e.g. Week 1 MNF, TNF after kickoff) can be marked `skipped` with note `game played`.

## Not wired yet
Video picks land in the vault notes only. Loading them into `research_pick_signals` needs a small
loader (not built) — flag it to Claude if these picks should feed the betting card/committee.
