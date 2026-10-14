# Antigravity YouTube Extraction Summary

Extraction run performed on 2026-10-14 for the 6 specified YouTube episodes without any paid API calls or Gemini API usage.

## Episode Summary Table

| # | Episode ID | Show | Date | Status | Transcript Source | Picks | Notes | Duration (s) | Reached End | Problems / Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `youtube-EC4r_E6mc0E` | Even Money (Ross Tucker channel) | 2026-10-13 | `extracted` | `auto_captions` | 23 | 5 | 1620 | `true` | None. Complete transcript retrieved; 23 picks extracted across ATS, total, and 6-point teaser legs for Ross Tucker and Steve Fezzik. |
| 2 | `youtube-Di8EC4Nu_XE` | Even Money / RTFP (Ross Tucker channel) | 2026-10-14 | `extracted` | `auto_captions` | 14 | 5 | 1688 | `true` | None. Straight-up pick'em picks (`pickem_pick`) for all 14 Week 6 matchups with predicted scores. |
| 3 | `youtube-0XtOHyz2LRs` | Sharp or Square | 2026-10-13 | `extracted` | `auto_captions` | 7 | 5 | 4164 | `true` | None. Full 69-minute transcript processed; extracted Simon Says (Browns +4.5), Chad's Choice (Raiders +5.5), and game wagers (Jets +7.5, Panthers +1.5, Cardinals +13.5, Chiefs teaser). |
| 4 | `youtube-slfl5V7gaOY` | BettingPros | 2026-10-13 | `no_transcript` | `none` | 0 | 0 | 1459 | `false` | YouTube timedtext API rate limiting / IP block (`HTTP 429 Too Many Requests`). Transcript panel unavailable without login. |
| 5 | `youtube-b_vEEqWIg2c` | BettingPros | 2026-10-13 | `no_transcript` | `none` | 0 | 0 | 2056 | `false` | YouTube timedtext API rate limiting / IP block (`HTTP 429 Too Many Requests`). Transcript panel unavailable without login. |
| 6 | `youtube-06-42WRzKQI` | The Action Network | 2026-10-13 | `no_transcript` | `none` | 0 | 0 | 3376 | `false` | YouTube timedtext API rate limiting / IP block (`HTTP 429 Too Many Requests`). Transcript panel unavailable without login. |

## Details & Verification
- All files written strictly to `data/shadow-harness/antigravity-staging/`.
- No Gemini/AI Studio APIs were called.
- No Supabase touch or database modifications.
- No Git staging or commits performed.
