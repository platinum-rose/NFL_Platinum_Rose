# Handoff — 2026-09-19 — Friday Pipeline Fixes, Alpha Packet Gate, Podcast Pipeline Overhaul

**Session type:** Claude (Cowork) via `mcp__remote-devices__device_bash` bridge (E:\dev mounted at `$HOME/mnt/dev`; repo `projects/NFL_Dashboard`). Note: that shell has NO outbound network except GitHub — live-data scripts must be run by Andy locally or via GitHub Actions. Supabase reachable via the Supabase MCP (project `aambmuzfcojxqvbzhngp`).

## IN FLIGHT when this session ended
Andy triggered **Podcast Ingest Agent** (GitHub Actions) in re-extract mode: `reextract_since=2026-09-14`, `max_per_run=40`, `max_runtime_minutes=65`. On success it auto-triggers **Pick Extraction Agent** (workflow_run), which re-promotes picks into `user_picks`.
**First thing next session:** verify both runs (see "Verify" below), then build the Sunday/Monday Week 2 card.

## Shipped this session (all committed AND pushed; main == origin/main at 70c898b)
| Commit | What |
|---|---|
| d121611 | Availability: ESPN "Active" recap rows no longer inflate `major_count` (`isMajorAvailabilityEvent`), `parseInjuryType` skips stat parentheticals ("two solo"). Week 2: major 1063 -> 728. |
| ca80a43 | Secondary matrix: `dedupeSecondaryEvents` (ESPN+FantasyPros same player counted once); builder defaults to current NFL week (was hardcoded Week 1). |
| 63362e5 | **Alpha packet permanently wired to Friday intel** — `agents/lib/alpha-weekly-intel.js`; build reads availability/starters/secondary/props, exits 1 if any input missing/>36h/wrong week (`--allow-stale` override stamped in packet); `weekly_intel` section, live `injuries`, static list kept only as `preseason_expert_injuries`; tests guard wiring. Fixed stale `alphaDataPacket.test.js` (hardcoded 209 recs). |
| cccf184 | Toolbox dashboard: Human Review queue/badge refresh when a task completes (unrelated "Fantasy Tools" hunk in that file deliberately left uncommitted). |
| bb1972d | Podcast: committed the never-shipped 09-14 extraction fallback + Tue-Fri schedule. |
| b87ba33 | Podcast: Gemini-first extraction chain (`agents/lib/extraction-providers.js`); billing/auth errors kill a provider for the run; run stops (episode left pending) when no extractor usable; failures count toward MAX_PER_RUN. `GEMINI_API_KEY` GitHub secret added by Andy. |
| 40eb721 | Podcast: newest-first across ALL feeds (`agents/lib/episode-queue.js`), `MAX_EPISODE_AGE_DAYS` (default 10), configurable `MAX_RUNTIME_MINUTES`. |
| c845caf | Podcast workflow timeout 95 min so runtime up to 65 is safe. |
| 70c898b | **Podcast extraction now reads the FULL transcript** (was `slice(0,12000)` ≈ first 10-15 min — root cause of thin picks since July). Chunked (30k/1.5k overlap) + merge (`agents/lib/extraction-merge.js`); prompt adds `player_prop`/`futures`, `player`, `market`; `REEXTRACT_SINCE` mode re-extracts stored transcripts with no transcription cost. |

## Supabase writes this session (each Andy-authorized)
- 2026-09-19: 44 PENDING EXPERT `user_picks` promoted from Sep 14+ transcripts backed up to `public.user_picks_backup_20260919_reextract`, then deleted; `podcast_transcripts.picks_promoted_at` reset to null for all 35 Sep 14+ transcripts. (Drop the backup table once the re-promoted picks look right.)
- Podcast ingest runs (GitHub) wrote new transcripts: all Week 2 episodes since 9/14 are transcribed (only 2 Week 1 recaps still pending).

## Verify (next session, first)
1. Supabase: for episodes `pub_date >= 2026-09-14`, `podcast_transcripts.model_used` should end in `gemini-3.6-flash` and pick counts should jump (e.g. BettingPros "10 Best Bets" was 2 picks; Sharp Football Week 2 Best Bets was 0).
2. `user_picks` source='EXPERT' rows re-created for those episodes (ids `EXPERT-...-ep<8>-<i>`), no duplicates, `picks_promoted_at` set.
3. If Pick Extraction didn't auto-run, trigger it manually (Actions -> Pick Extraction Agent).

## Still open
- **Build the Sunday/Monday Week 2 card** — read `docs/BETTING_LESSONS_LEARNED.md` first (fire highest-margin reads as standalone/2-leg tickets, not only inside big parlays). Trust: game-status injury rows, QB starter calls, deduped secondary tiers, new podcast picks. Player-props intel (article extractor) is still TNF-only — strict regex + title-only research notes.
- FantasyPros timestamps are UTC not ET (182 rows up to 6.9h in the future) — one-line fix in `agents/lib/fantasypros-injuries.js` (parse naive string as UTC).
- Projected starters false positives: TB Jalon Daniels / DEN Stidham from "will be the backup"; TB has no Mayfield row; ARI has no signals.
- Secondary matrix still includes already-played TNF game and counts season-long IR/PUP depth players.
- Several scripts reference shut-down `gemini-2.0-flash`.
- Gemini audio pipeline (`docs/antigravity/GEMINI_AUDIO_MIGRATION_SPEC.md`) never built — would remove AssemblyAI cost.
- Pre-existing test failures (not from this session): `survivorAlpha.test.js` detectTrapPicks; `toolboxAppServer.test.js` expects "Live Multi-Game Sunday Trackers". These likely fail CI and block the CI-gated deploy workflow.
- Odds Terminal (oddsterminal.org) evaluated and REJECTED (OpticOdds reseller, SMS login, Cloudflare, 429s) — do not revisit.
- Git triage of the remaining large dirty working tree still overdue. Cowork git gotcha: device_bash can leave a stale empty `.git/index.lock` — check after git commands.

## Standing constraints (unchanged)
Git guardrail repealed (normal judgment). Supabase writes need Andy's per-change authorization. No paid synthesis (`agents/portfolio-synthesize.js`) without explicit per-run authorization. Repo access only via device_bash.
