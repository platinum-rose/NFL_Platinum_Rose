# NFL_Dashboard — Session Handoff
> Auto-generated at session end. Read this to resume.

**Date:** 2026-09-18T01:10:00-07:00
**Branch:** main

## Standing Constraint Update — 2026-09-15
**The "no commit/push without Andy's explicit approval" guardrail is REPEALED as of 2026-09-15.** It originated as a scoped constraint for the Codex-independent 5-checkpoint repair audit (`docs/audits/2026-08-21-codex-independent/UNIFIED_REPAIR_PLAN_FOR_CLAUDE.md`) and had been carried forward by habit in every session's handoff notes since, well past that audit's relevance. Andy confirmed the full repeal directly. Going forward, commit and push using normal judgment and the existing `RULES.md`/`CLAUDE.md` git conventions (conventional commit messages, `--force-with-lease` never `--force`, check `AGENT_LOCK.json` before force-pushing) — no separate per-commit sign-off is required. The Supabase-writes-need-per-change-authorization and no-paid-synthesis-without-authorization constraints mentioned in older entries below are UNCHANGED and still in effect; only the git commit/push guardrail is lifted.

Note: as of this update the working tree is very large and dirty (hundreds of modified/untracked files spanning real feature work, generated data, and throwaway scratch/probe scripts) — do not blanket `git add -A` and commit it all in one shot. Stage and commit in reviewed, logically-scoped batches.

---

## Current Pick Up Here: 2026-09-21 — The League Week 2 Private Recap Voice/HTML (DONE)

1. **Private fantasy recap package created for `2026 - The League` Week 2:** this was entertainment-only for the league managers, not public fantasy advice, betting content, or official reporting. Yahoo matchup status was still `midevent` while drafting, so future continuation should verify final scores before treating the recap as final.
2. **New artifacts:**
   - `docs/fantasy/the-league-week-2-recap-2026.html` — standalone one-column HTML recap with the comedy-club layout direction.
   - `docs/fantasy/THE_LEAGUE_MANAGER_PROFILES.md` — manager/team context and roast levels for future recaps.
   - `docs/fantasy/THE_LEAGUE_RECAP_VOICE_GUIDE.md` — durable voice, joke, formatting, and Week 3 resume guidance.
3. **Voice lessons captured:** fuller comic sentences landed better than ultra-short fragments; manager profiles should inform jokes quietly, not appear as an intro roll call; starter points, bench points, and pending players must stay clearly separated; do not roast a zero when the player has not played yet.
4. **Confirmed joke/formatting preferences:** Amanda liked the Mahomes/ketchup/law joke; Andy favorites included "two people standing very far apart professionally," "regret to have a scoring format," "two-point staring contest," "the branding department is undefeated," and fantasy football using "normally" only when someone needs to be hurt. Keep punchline emphasis subtle and uniform so it feels like one speaker, not a second narrator.
5. **Avoid next time:** opaque surreal tags that do not connect to football logic ("waiting for Monday in a suit," "knows where the scissors are," "wrong adults"), reversed fantasy logic (players touch the ball to gain points, not lose them), overdesigned cards/callouts, jarring bold colors, and overusing "those points did not count" unless repetition is the joke.
6. **Week 3 resume path:** start with `docs/fantasy/THE_LEAGUE_RECAP_VOICE_GUIDE.md` and `docs/fantasy/THE_LEAGUE_MANAGER_PROFILES.md`, pull live Yahoo Week 3 data, verify `final` vs `midevent`, then write a private manager-only recap in the same original deadpan fantasy-football monologue style.

---

## Current Pick Up Here: 2026-09-20/21 (SNF) — IND@KC Tickets Placed & Live Tracker Grading Overhaul (DONE)

1. **4 SNF tickets built and placed, all logged to `data/official-picks/user-placed-wagers-2026.json` + synced to Bankroll/Supabase + baked into `public/live-tracker-sunday.html`:** BKR 6-leg SGP ($10 @ +3600: Taylor ATD/Pierce/Worthy/Walker/Bolton/Rice), BEO 8-leg SGP ($5.95 @ +15700), BEO moonshot 6-leg ($5 @ +9500, deliberately fresh names -- Allen/Gray/Johnson/Jones/Thornton/Walker ATD), BKR correlated side+total ($29.83 @ ~+253: IND+6 / Under 46.5, ticket #739074857).
2. **Week 2 Sun/Mon postmortem started, not finished:** standalone/ticket record 3-9 (+1 correct pass), SuperContest 3-2, underdog ML round robin mostly dead (12/15 combos) as of Sunday night. Scheduled task `trig_01F8qCezGevyizk1DMpVW7q1` (fires ~2026-09-22T04:30Z) will finish grading MNF + the round robin and append the full postmortem to `docs/BETTING_LESSONS_LEARNED.md`. Tuesday 9am ET calendar event created for Andy to review it live.
3. **`scripts/generate-live-tracker.mjs` -- real bugs found and fixed mid-game on Andy's own repeated pushback** (full technical writeup in `.atlas/lessons-learned.md` S244):
   - Manual leg toggle (`toggleLeg`/`toggleLegBurn`) had zero awareness of the auto-computed live/final grade -- a stray click after a game ended could silently overwrite a correctly-graded Failed leg to Hit. Added confirm-before-override guards both directions.
   - Added a real third leg state, **Push** (`pushedLegsState`, `toggleLegPush`, brown `pace-push` styling) -- an exact-number push (e.g. Jets +3) previously showed a transient badge that reset on refresh, permanently blocked its ticket from ever cashing, and inflated round-robin combo math by still multiplying its odds in. All fixed.
   - **Broke the entire tracker for ~20 minutes mid-game:** a confirm-dialog string used single-escaped `\'` inside the generator's own outer template literal, un-escaping one level early and producing a bare `'` in the output that broke the whole inline `<script>` parse (symptom looked like "every leg reset to 0" -- it wasn't; localStorage was untouched, nothing loaded because nothing parsed). **Root lesson: `node --check` on the generator only validates its own syntax, not the HTML/JS string it emits -- must extract and `node --check` the actual `<script>` content from the generated output to catch this class of bug.** Doing that on every change from here on.
   - Found and fixed my own data-entry bug: logged the side+total ticket's Under leg `market` as `"total_points"` instead of this codebase's actual convention, `"total"` -- silently made that one leg invisible to all auto-grading despite looking normal in the UI.
   - Consolidated "Burnt" (manual) vs "Busted" (auto-detected) into one term, 🔥 **BURNT**, everywhere -- Andy correctly flagged these as the same concept with two competing labels.
   - **Still open, not fixed:** `--week` arg defaults to `1` (line ~9182) when omitted, silently building the wrong week's tracker with no error. Worked around tonight via explicit `--week 2`; real fix (resolve current week dynamically, same pattern as the 2026-09-18 `secondary-matchup-vulnerability.js` fix) not yet applied. Flag before anyone runs the script bare.
4. **Nothing committed** -- tonight's changes to `scripts/generate-live-tracker.mjs` and `data/official-picks/user-placed-wagers-2026.json` are live in the worktree, uncommitted, per the existing preserve-dirty-worktree norm.
5. **New open feature gap, found live (not fixed this session):** the tracker has no concept of a player leaving the game injured/inactive. Alec Pierce exited mid-game and never returned; two of Andy's tickets needing his remaining receptions kept showing a neutral/on-pace-ish read with zero warning they were effectively dead, and Andy only found out independently. Needs at minimum a manual "Out/Inactive" leg flag (same family as tonight's Burnt/Push buttons) -- check first whether `fetchLiveScoreboard()`'s existing ESPN feed already carries player-status data before building a manual-only version. Full writeup: `.atlas/lessons-learned.md` S244 item 5; tracked in `.atlas-bridge/memory.json` open_tasks as `live_tracker_player_out_flag`.

Standing constraints unchanged (git guardrail repealed; Supabase writes need per-change authorization; no paid synthesis without authorization).

---

## Current Pick Up Here: 2026-09-19 (midday) — Re-extract Verified, Pick Promotion Blocked by Natural Key, Week 2 Card Drafted

1. **Re-extract DONE:** Podcast Ingest (re-extract, run 35458679153) succeeded — all 35 Sep 14+ transcripts now `+gemini-3.6-flash`, 255 picks (was ~44 promoted). E.g. BettingPros "10 Best Bets" 2 -> 16, Action Network Playground 37.
2. **Pick Extraction FAILED (run 35459409555):** 96 EXPERT rows upserted, but 7 pick-bearing episodes (Action Playground, SoS x3, BettingPros Early, Favorites, Even Money Props, Action Preview/Futures) failed whole-batch on `user_picks_natural_key_unique (source, game_id, pick_type, line)` — two shows on the same side/line, or two props at the same line in one game, collide. Also: prop rows were written as bare "OVER 20.5" (player + market dropped).
   - Fixed + pushed (9ccc3dd): `agents/lib/expert-pick-selection.js` (tested) — selection now "Bijan Robinson OVER rushing and receiving yards".
   - Written, **NOT applied**: `supabase/migrations/055_user_picks_natural_key_excludes_expert.sql` (partial unique index `where source <> 'EXPERT'`; EXPERT dedupes on deterministic id). Needs Andy's authorization.
   - After 055: reset `picks_promoted_at` to null on the Sep 14+ transcripts (Andy-authorized write) and re-run Pick Extraction manually — ids are deterministic, so the 96 existing rows get overwritten with the player-named selections, no duplicates.
   - `user_picks_backup_20260919_reextract` (44 rows) still in place — drop only after the re-promotion checks out.
3. **Week 2 Sun/Mon card first pass:** `docs/cards/2026-W02-sun-mon-card-draft.md` (9-slot template + lessons-learned standalones). Missing inputs: Week 2 Sun/Mon prop board (Player_Prop_Odds_Weekly/Week2 is TNF only), Kalshi feed (09-13), SuperContest picks.
5. **Later same session:** migration 055 APPLIED (Andy-authorized). Still pending: reset `picks_promoted_at` on Sep 14+ transcripts + manual Pick Extraction run.
   Intel fixes (0970276): bookmarks now expand author threads (TweetDetail) + long-form note_tweet text, OCR up to 6 images; `--refresh-ids=` re-processes specific tweets. Article sweep: local cron now fetches bodies and backfills up to 20 body-less notes/run (root cause: local sweep inserted teaser-only rows first, GitHub body-fetch runs then skipped them). TweetDetail query id is unverified live — if the log shows `[thread] TweetDetail HTTP 4xx`, set TWITTER_TWEETDETAIL_QID.
6. **Evening:** picks_promoted_at reset (12 transcripts, Andy-authorized) -> Andy to run Pick Extraction. Kalshi refreshed by Andy (5304 contracts) and now part of Friday cadence (a00af18, before Alpha packet). Twitter: all 85 Sep 12-19 notes had 0 signals -> text pick extraction + Vision game_picks + outbound links (0c2e52f); Vision model fix, video queue (`data/research-intel/twitter-video-queue.json`), gate second tier (3e0daf4). Backfill = Andy runs `node agents/twitter-bookmarks-agent.js --force` once. Coherence "incoherent" teams (CLE SB 50% etc.) are illiquid-contract artifacts, not signal.
7. **Late evening:** External intel loader (21c66cf): `scripts/load-external-intel-picks.mjs` + reusable Grok prompt `docs/intel/GROK_THREAD_CAPTURE_PROMPT.md`; loaded 77 signals (66 Grok CSV, 11 Antigravity video notes; Andy-authorized). Antigravity processed all 24 queued videos (4 with picks). Week 2 report DRAFTS: `scratch/nfl_week2_master_betting_intelligence_summary.md` and `scratch/nfl_week2_supercontest_intelligence_summary.md` (copies in dist/nfl_week2_master_packet/). SC Top 5 draft: MIN +5.5, LAR -7, DEN -2.5, HOU -2.5 (Burrow-conditional), MIA +13.5. Week 1 SC card finished 1-4. Not yet rendered to HTML/PDF/DOCX like Week 1.
4. New data defects: secondary `target_receivers` use stale rosters; secondary dedupe misses "T.J. Tampa" vs "T.J. Tampa Jr."; CI + Smoke failing on main (pre-existing suites).

---

## Current Pick Up Here: 2026-09-19 — Podcast Re-Extract In Flight; Friday Pipeline + Alpha Gate + Podcast Overhaul Shipped

Full detail: [`handoffs/2026-09-19-1040-claude-friday-pipeline-podcast-overhaul-handoff.md`](file:///e:/dev/projects/NFL_Dashboard/handoffs/2026-09-19-1040-claude-friday-pipeline-podcast-overhaul-handoff.md)

**Next session should start by:** verifying the GitHub re-extract run (Podcast Ingest Agent, `reextract_since=2026-09-14`) and the auto-triggered Pick Extraction Agent — Sep 14+ transcripts should show `+gemini-3.6-flash` with much higher pick counts and re-promoted, non-duplicated EXPERT `user_picks`. Then build the Sunday/Monday Week 2 card (read `docs/BETTING_LESSONS_LEARNED.md` first). All code is committed and pushed (main == origin/main, 70c898b). The detailed session log is the 2026-09-18 (evening) entry below.

---

## Current Pick Up Here: 2026-09-18 (evening) — Friday Cadence Run, Human Review + Week-Default Fixes, Odds Terminal Evaluated & Rejected (DONE)

### Status: Friday cadence run by Andy locally (live data OK); fixes below COMMITTED and PUSHED to origin/main (dee1125..bb1972d): d121611 availability, ca80a43 secondary, 63362e5 alpha gate, cccf184 toolbox Human Review. Local main is ahead of origin by 6 (4 of these + 2 earlier local commits, incl. 5a7e8fc fpi). The unrelated "Fantasy Tools" hunk in scripts/toolbox-dashboard.html was deliberately left unstaged. Generated data files were not committed.
Note for Cowork sessions: git run through device_bash can leave a stale empty .git/index.lock (the shell can't delete files without Andy granting delete permission) — check for it after any git command.
1. **Friday cadence ran successfully from Andy's own terminal** (1124 availability events / 32 teams, 76 projected-starter signals, 22 players flagged for Human Review). Note: the Cowork `device_bash` shell has NO outbound network, so live-data scripts must be run by Andy locally — a Claude-side run silently degrades to stale inputs.
2. **Fix — Human Review looked empty after cadence runs:** `scripts/toolbox-dashboard.html` only fetched the queue on page load/filter click. Now refreshes the badge (and the queue if the section is visible) whenever a task completes via SSE. Needs a browser refresh only, no server restart.
3. **Fix — secondary matchup matrix always built Week 1:** `scripts/build-secondary-matchup-vulnerability.js` had `DEFAULT_WEEK = 1` and the cadence passes no `--week`. Now defaults to `getNFLWeekInfo().week` (same resolver as player-props intel). Re-ran → `secondary-matchup-vulnerability-2026-w02.json`; Alpha packet rebuilt on top. The stale `...-w01.json` from today's runs can be ignored.
4. **Open — player-props intel is thin (12 props, TNF only):** `extractCuratedPlayerProps()` only matches the strict `Player Over X.5 ... (-110)` format, and many prop articles in `research_intel_notes` are title-only (no body). Candidate fix: add player props to `sync-live-market-lines.mjs` via The Odds API event-odds endpoint (quota cost per game x market — test on one game first).
5. **DECIDED — Odds Terminal (oddsterminal.org) is NOT a data source for this project.** Evaluated in-browser with Andy logged in: strong coverage (56 books incl. exchanges/prediction markets/DFS pick'em, opening lines, public/money %, props, EV), but it resells OpticOdds data (`cdn.opticodds.com`), has no terms/API, sits behind SMS login + Cloudflare bot checks, rate-limits (429s), and ~half its feeds failed within minutes. Not robust or free enough — do not revisit. At most a manual line-shopping screen.

6. **Verified Andy's 2026-09-19 06:14Z Friday run — all 5 outputs fresh, but found these defects (none fixed yet):**
   - **Alpha packet ignores the Friday intel entirely.** `build-alpha-data-packet.js` reads none of steps 1-4 (no player-availability, projected-starters, secondary-matchups or player-props files in `source_provenance`); injuries come from static `src/lib/expertInjuries.js`, sportsbook context from 08-22, recs from 09-13. Explains the constant "394 recommendations".
   - **Availability "major" count inflated:** 397 of 1123 events are ESPN `Active` game-recap blurbs (e.g. Bradley Chubb 1.5 sacks) classed `active_news` and ~368 of them bucketed as *_major; `injury_type` mis-parsed (e.g. "two solo"). Real game-status rows (Out/Doubtful/Questionable) = 249 across all 32 teams — those look right.
   - **FantasyPros timestamps:** 182 rows have `published_at` up to 6.9h in the future — evidence the naive `injury_update_date` is UTC (not ET); fix = parse as UTC in `agents/lib/fantasypros-injuries.js` (see TIMEZONE CAVEAT there).
   - **Secondary matrix double-counts absences** listed by both ESPN and FantasyPros (Porter Jr., Adebo, Garrett Williams, Rakestraw, Abney appear twice), inflating severity; top-ranked matchup is the already-played DET@BUF TNF game; season-long IR/PUP depth players drive much of the score.
   - **Projected starters:** QB backups correctly promoted (MIN Wentz/Murray out, ATL Rush/Penix out, SEA Lock/Darnold out); false positives TB Jalon Daniels + DEN Stidham from "will be the backup" language, and TB has no Mayfield row. ARI has zero signals (needs manual depth chart).
   - Player props unchanged: 12 TNF-only props (see item 4).

7. **FIXED 2026-09-19 (tests added, 27/27 passing in the two suites):**
   - Secondary double-counting: new `dedupeSecondaryEvents()` in `agents/lib/secondary-matchup-vulnerability.js` (one absence per team|player, most severe event wins, `corroborating_sources` recorded). Rebuilt matrix: duplicates 0; high tier 7 -> 6 (NE vs PIT 10.50 -> 6.45, SEA vs ARI 8.20 -> 5.05, ARI vs SEA drops to medium).
   - Active-recap inflation: `parseInjuryType()` now skips stat/roster parentheticals ("two solo", "on five targets", "coach's decision"); new `isMajorAvailabilityEvent()` excludes `active_news` rows with no injury named from `major_count` (team + meta). Estimated on today's data: major 1063 -> ~728. `data/player-availability/latest.json` will only reflect this after Andy's next local cadence/availability run (needs network).
   - Andy's local re-run confirmed both: Major 728 (was 1063), secondary 17 medium/high (was 21).
8. **FIXED 2026-09-19 — Alpha packet permanently wired to the Friday intel (happened Week 1 AND Week 2):**
   - New `agents/lib/alpha-weekly-intel.js` (pure, tested): `WEEKLY_INTEL_INPUTS` (the 4 Friday outputs), `evaluateWeeklyIntelFreshness()` (each input must exist, be <=36h old, and — for secondary + props — match the current NFL week), `buildWeeklyIntelSection()`, `weeklyIntelForTeam()`.
   - `scripts/build-alpha-data-packet.js` now reads all 4 inputs (in `source_provenance`), **refuses to build and exits 1** with a per-file reason if any is missing/stale/wrong-week (so the toolbox cadence shows a failure instead of "success"), and `--allow-stale` is the only override (stamped as `weekly_intel.freshness.allow_stale_override`).
   - Packet changes: new top-level `weekly_intel` (availability game-status rows by team, projected starters, secondary matchups, props, freshness report); `injuries` is now `weekly_game_status_availability_v1` from live availability; the static `EXPERT_INJURIES` list survives only as labeled `preseason_expert_injuries`. Each `nfl_team_dashboards[]` entry gets `weekly_intel` + live `injuries`. No UI consumer read the old injuries shape (only `FuturesIntelReport` uses the packet, for team rows/generated_at).
   - Tests: new `tests/unit/alphaWeeklyIntel.test.js` (gate pass/missing/stale/wrong-week, recap-row exclusion, per-team slicing, script-wiring guards so it can't regress); `alphaDataPacket.test.js` fixed (was hardcoded to 209 recs, already failing at 394) + new "built from this week's Friday intel" assertion. 54/54 across the 6 touched suites.
   - Pre-existing failures NOT caused by this work (seen in wider run): `survivorAlpha.test.js` detectTrapPicks, `toolboxAppServer.test.js` expects "Live Multi-Game Sunday Trackers" text that isn't in HEAD's dashboard HTML either.
   - Verified live: current packet built from fresh Week 2 inputs (606 game-status rows, 76 starters, 32 matchups, 12 props); simulated Week 3 / 5-days-stale builds are refused naming each stale file.

9. **Podcast ingest was running with no extraction fallback (FIXED + pushed, bb1972d):** the GPT-4o -> Claude -> Gemini fallback in `agents/podcast-ingest.js` and the Tue-Fri schedule in `.github/workflows/podcast-ingest.yml` were written 2026-09-14 but never committed, so GitHub Actions kept running GPT-4o-only, Fridays, 3/run. OpenAI is out of credits -> every episode since ~Sep 8 errored; Week 2: 2 of 24 episodes transcribed (since Sep 1: 16 done / 30 pending / 18 error). Errored episodes are retried first and eat the per-run slots, starving BettingPros / Move the Sticks / Sharp Football (0 done this season).
   - Andy TODO: confirm `ANTHROPIC_API_KEY` + `GEMINI_API_KEY` GitHub Actions secrets exist; trigger Podcast Ingest Agent manually (max_per_run >= 6) and check the log for "via claude-sonnet-4-5"/"via gemini" — the fallback has never run in prod and model ids (`claude-sonnet-4-5-20250929`, `gemini-3.6-flash`) are unverified.
   - Open: ~24 episodes/week vs 3-6 per run means the backlog keeps growing — needs a higher default cap or extra runs (paid; Andy's call). Topping up OpenAI credits also unsticks it.

10. **Podcast extraction made Gemini-first + fail-fast (b87ba33, PUSHED; GEMINI_API_KEY secret added by Andy 2026-09-19):** Andy's manual Actions run (2026-09-19) proved no Claude/Gemini key reaches the job (chain listed only gpt-4o) and each failed episode had already paid AssemblyAI, with failures not counting toward MAX_PER_RUN. New `agents/lib/extraction-providers.js` + tests (`tests/unit/extractionProviders.test.js`, 8/8): order gemini -> claude -> gpt-4o, billing/auth errors kill a provider for the run, run stops (episode left pending) when no extractor is usable. Needs: push + `GEMINI_API_KEY` GitHub secret (Andy's local .env has one). "Antigravity pipeline" clarified: manual agent sessions that read exported transcripts — not an automated/transcription fallback; the free Gemini-audio build (`docs/antigravity/GEMINI_AUDIO_MIGRATION_SPEC.md`) was never implemented (option B, still open). Note: several scripts still reference `gemini-2.0-flash`, which Google has shut down.

11. **Podcast ingest ordering fixed (pushed):** Gemini extraction verified live (6 episodes, model_used `assemblyai-diarized+gemini-3.6-flash`). Run now discovers all feeds, then processes newest-first across feeds (`agents/lib/episode-queue.js`, tests), skips episodes older than `MAX_EPISODE_AGE_DAYS` (default 10, left queued), and `MAX_RUNTIME_MINUTES` (default 10, up to 65; workflow timeout 95) replaces the hardcoded 10-min ceiling that capped runs at ~8 episodes. As of 2026-09-19 ~43 episodes within 10 days were still pending (29 since 9/14), incl. BettingPros/Action Network/Sharp Football Week 2 best-bets shows.

12. **Week 2 podcast backlog ingested (2026-09-19):** Andy's manual run (max_per_run 30, age 5d, runtime 65) processed everything since 9/14 via Gemini; only 2 Week 1 recaps left pending. BUT pick counts exposed that extraction only ever saw `transcript.slice(0,12000)` (~first 10-15 min). Fixed + pushed: full-transcript chunked extraction (`agents/lib/extraction-merge.js`, tests), player_prop/futures types, and `REEXTRACT_SINCE` mode (workflow input `reextract_since`) that re-extracts stored transcripts with no transcription cost. 35 transcripts since 9/14 (1.86M chars); 13 already promoted to signals -> skipped by default (pick-extraction ids picks by index, re-promoting would duplicate). Andy approved overwrite + full re-run (2026-09-19). Cleanup DONE (Andy-authorized Supabase write): 44 PENDING EXPERT `user_picks` promoted from Sep 14+ transcripts backed up to `public.user_picks_backup_20260919_reextract` then deleted; `picks_promoted_at` reset to null on all 35 transcripts (normalized_signals had none for them). Next: Andy triggers re-extract (reextract_since=2026-09-14, max_per_run 40, runtime 65), then pick-extraction re-promotes.

Standing constraints unchanged (git guardrail repealed; Supabase writes need per-change auth; no paid synthesis without auth). Git triage backlog still open.

---

## Current Pick Up Here: 2026-09-18 — Betting Lessons Learned Captured; Handing Off for Token Refresh (DONE)

Full detail: [`handoffs/2026-09-18-0110-claude-lessons-learned-token-handoff.md`](file:///e:/dev/projects/NFL_Dashboard/handoffs/2026-09-18-0110-claude-lessons-learned-token-handoff.md)

### Status: Short continuation session — captured a reusable betting lesson from the TNF card, then handed off to a fresh Claude session to conserve tokens. No pipeline work run.
1. Wrote `docs/BETTING_LESSONS_LEARNED.md` (new file) — durable, growing log of reusable card-construction lessons, separate from the engineering-only `.atlas/lessons-learned.md`. First entry: TNF DET@BUF — 14 of 18 unique player-prop legs hit clean, but 5 of 6 tickets still lost net because they were multi-leg parlays where one weak leg (Goff 0-INT, or either of Shakir's two near-misses) busts the whole ticket; several high-margin reads (Cook rushing +54.5 over the line, Kincaid receiving +40.5, Gibbs receiving +29.5) never got a standalone payout because they were buried in those same parlays. **Actionable for future cards: fire the highest-margin reads as smaller standalone/2-leg tickets alongside the larger parlays, not only inside them.**
2. Condensed version of the same lesson appended to project memory (`areas/nfl-dashboard.md`) so it surfaces cross-session even without reading the repo file.
3. Everything open from the 2026-09-17 session is unchanged and carried forward as-is (see below) — this session did not touch the pipeline, the toolbox server restart, or the git triage backlog.

**Next session should start by**: reading `docs/BETTING_LESSONS_LEARNED.md` before building the Sunday/Monday Week 2 card, then running `node scripts/toolbox.mjs --cadence friday` to process Sunday/Monday intel (injuries → projected starters → secondary matchup matrix → SGP models → Alpha Data Packet) — still intentionally not run across 2 sessions now. Also still open: Andy needs to restart the toolbox server (double-tab fix + 09-15 Human Review fix both need it), and the ~1017-file dirty working tree needs the deliberate git triage pass called out in the 09-15 entry — now overdue across 3 sessions.

Standing constraints unchanged: git guardrail repealed; Supabase writes still need per-change authorization (not a standing green light even though granted twice now); no paid synthesis runs without authorization.

---

## Current Pick Up Here: 2026-09-17 — TNF Bug Fixes, Futures Team Grouping + Price Watch, TNF Tickets Closed & Synced to Bankroll (DONE)

Full detail: [`handoffs/2026-09-17-2130-claude-tnf-close-price-watch-handoff.md`](file:///e:/dev/projects/NFL_Dashboard/handoffs/2026-09-17-2130-claude-tnf-close-price-watch-handoff.md)

### Status: Bug fixes + new Futures features verified against real live ESPN data; all 6 resolvable TNF tickets graded, settled, and synced to Bankroll/Supabase; nothing committed
1. Fixed the Game Day Tracker double-tab launch bug, the Goff pass-TD/Bills-team-total-reading-0 bug (2-layer root cause across 3 duplicated stat matchers), the "Over 54" showing "On Pace" instead of "Hit" once already mathematically clinched, the Bookmaker.eu SGP payout mislabel ($70.02 total-return shown as "Payout" instead of the $49.90 profit-only "To Win" Andy's books use), and a Player Cheat Sheet fulfillment-logic drift (missing `pass_attempts`/`interceptions_thrown` branches + open-slot legs blocking "Collapse Fulfilled").
2. Futures Portfolio tab now groups cards by team (collapsible), and ships a new monitor-only "Price Watch" section tracking Bills/Bears SB Win + Exacta Matchup price history for a dip before Andy buys in — config-driven via new `data/futures-imports/price-watch-list-2026.json`.
3. TNF (DET @ BUF, final BUF 41–31) tickets graded and closed: 5 parlays lost (narrow misses), the Bookmaker.eu SGP won both legs, the DET freebet lost, the 11-team parlay's BUF leg graded WON with the ticket itself left PENDING (10 more legs Sun/Mon). **Net +$17.98 on tonight's settled tickets.**
4. Synced all 35 wagers to Bankroll (`node scripts/sync-placed-wagers-to-bankroll.mjs`, real run) — Supabase `user_bankroll_bets` updated, `public/user-placed-wagers-2026.json` refreshed. Regenerated both Live Tracker output files.

**Next session should start by**: running `node scripts/toolbox.mjs --cadence friday` to begin processing intel for the Sunday/Monday Week 2 slate (injuries → projected starters → secondary matchup matrix → SGP models → Alpha Data Packet) — intentionally not run this session. Also: Andy still needs to restart the toolbox server (double-tab fix + the pending 09-15 Human Review fix both need it), and the working tree still needs the git triage pass called out in the 09-15 entry below before any broad commit.

**Betting lessons from tonight's TNF card are now captured in [`docs/BETTING_LESSONS_LEARNED.md`](file:///e:/dev/projects/NFL_Dashboard/docs/BETTING_LESSONS_LEARNED.md)** — read it before building the Sunday/Monday cards. Headline: 14 of 18 unique player-prop legs hit clean, but 5 of 6 tickets still lost because they were multi-leg parlays and only needed one weak leg (Goff 0 INT, Shakir's two near-misses) to bust the whole ticket. Several high-margin reads (Cook rushing +54.5, Kincaid receiving +40.5, Gibbs receiving +29.5) never got a standalone payout because they were buried in those same parlays. Consider firing top-margin reads as smaller standalone/2-leg tickets alongside the bigger parlays going into this weekend's card.

Standing constraints unchanged: git guardrail repealed; Supabase writes still need per-change authorization (tonight's Bankroll sync was explicitly authorized by Andy, not a standing green light); no paid synthesis runs without authorization.

---

## Current Pick Up Here: 2026-09-15 — Toolbox Mission Control UX Overhaul, Human Review Workflow, Diagnostics Expansion, Git Guardrail Repealed (DONE — pending Andy's server restart + git triage)

Full detail: [`handoffs/2026-09-15-2229-claude-toolbox-ux-overhaul-diagnostics-handoff.md`](file:///e:/dev/projects/NFL_Dashboard/handoffs/2026-09-15-2229-claude-toolbox-ux-overhaul-diagnostics-handoff.md)

### Status: All changes uncommitted working-tree edits; verified in sandbox, not yet confirmed on Andy's live desktop process
1. Schedule/odds pipeline now overlays live Supabase odds onto ESPN schedule feed (root-cause fix, not a patch).
2. Full 2026 player-stats refresh run; 4 roster conflicts fixed in `receiver-roles-2026.json`; hardcoded score bug fixed in `reconcile-settlement.mjs`.
3. New `scripts/build-week-usage-locks.js` closes the "obvious lock starter" gap (e.g. Saquon Barkley) using real usage stats, wired into Tuesday cadence, now with cross-week trend archiving.
4. Mission Control dashboard rebuilt: 3-tab nav (Weekly Cadence / Diagnostics / Human Review), Melbourne tracker + redundant Sunday-trackers section removed, Human Review tab with persistent approve/reject/approve-all, Diagnostics expanded to 15 grouped plain-English sources.
5. Git guardrail ("no commit/push without explicit approval") REPEALED per Andy — see Standing Constraint Update note above. Nothing committed yet; working tree is large and needs deliberate triage first.

**Next session should start by**: (a) confirming with Andy whether restarting his local toolbox server fixed the Human Review "Not Found" error, (b) triaging the working tree before any commits (see detail handoff for what's real work vs. scratch), (c) checking the possibly-dead `x-sharp-ingest.yml` GitHub Action (last real data June 2).

Standing constraints: git guardrail repealed (see top of file); Supabase writes still need per-change authorization; no paid synthesis runs without authorization.

---

## Current Pick Up Here: 2026-09-13 — Ticketboard Specification & Leg Minimization Delivery for Claude/Codex Team (DONE)

Full detail: [`handoffs/2026-09-13-1650-antigravity-ticketboard-spec-and-burn-minimization-handoff.md`](file:///e:/dev/projects/NFL_Dashboard/handoffs/2026-09-13-1650-antigravity-ticketboard-spec-and-burn-minimization-handoff.md)  
Specification: [`docs/specs/TICKETBOARD_PARLAY_CARD_AND_LEG_MINIMIZATION_SPEC_2026.md`](file:///e:/dev/projects/NFL_Dashboard/docs/specs/TICKETBOARD_PARLAY_CARD_AND_LEG_MINIMIZATION_SPEC_2026.md)

### Status: Authoritative Spec Delivered & Working Tree Green
1. **Turnkey Specification Delivered**: Authored exhaustive engineering specification (`docs/specs/TICKETBOARD_PARLAY_CARD_AND_LEG_MINIMIZATION_SPEC_2026.md`, 31.5 KB) covering Ticketboard DOM structure, 7 LocalStorage stores, Round Robin $k$-combination combinatorics and dynamic payout recalculations, fire button (`[🔥]`) minimization contract, scoreboard polling isolation boundaries, line-by-line root cause diagnosis, and 4-step implementation guide.
2. **Tracker Implementation Verified**: Burnt leg minimization and Round Robin combination survival logic verified in `scripts/generate-live-tracker.mjs`. Live scoreboard polling and live score badges (`❌ Lost (10-34)`, `🟡 Trailing (16-17)`) preserved with zero DOM class pollution or mutual recursion.
3. **Verification**: 100% passing Vitest suite (`tests/unit/generateLiveTracker.test.js`). Generated outputs synchronized (`public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html`).
4. **Toolbox Server**: Running in background serving `http://localhost:5180/live-tracker-sunday.html`.
5. **Next Step**: Awaiting instructions / review from the Claude or Codex engineering team.

Standing constraints unchanged: no commits/push without Andy's explicit approval, no Supabase writes without per-change authorization.

---

## Previous Session: 2026-09-13 — Frontier-Synthesis Rev-23-Followup4 Closed, Retroactive Portfolio Run Live, Week 1 Intel Inventory Built (IN PROGRESS)

Full detail: [`handoffs/2026-09-13-0625-claude-frontier-synthesis-week1-intel-handoff.md`](file:///e:/dev/projects/NFL_Dashboard/handoffs/2026-09-13-0625-claude-frontier-synthesis-week1-intel-handoff.md)

### Status: Three threads in flight, nothing committed/pushed this session
1. **Frontier-synthesis rev-23-followup4**: all 9 Codex findings fixed/verified (170/170 focused tests green). Finding #3's approved-dossier-contract supplied by Andy for `dossier-2026-09-09.json`. Status update sent to Codex declaring `READY_FOR_CODEX_REVIEW`. **Next session: check for Codex's response.**
2. **Retroactive `agents/portfolio-synthesize.js` run**: Andy ran a real, live, paid synthesis against the 09-09 dossier as a retroactive Week 1 baseline, working through 5 preflight gates with explicit per-gate overrides, culminating in his own explicit authorization of `--allow-unsafe-preflight`. Stage 1 (claude-opus-5 + claude-fable-5-1) was confirmed executing. **Next session: check whether it finished and read the output report.** `--no-persist` was used — no Supabase write has occurred.
3. **Week 1 betting card + intel inventory**: 13-game Sunday slate (NE@SEA and SF@LAR already final, DEN@KC excluded), $10 unit size confirmed. Cross-referenced 6 podcast shows (Action Network, BettingPros, Even Money, Sharp or Square, VSiN T-Shoe Index model, The Favorites — 2 of these had no live-slate coverage) plus a player-props dossier (only 6 of 13 games covered), Twitter (personal account verified genuinely active; Platinum Rose account not yet built), and articles (stale, unvetted per the file's own status flag). Real model-vs-consensus conflicts found on NYJ@TEN, NO@DET, WAS@PHI total, MIA@LV total, and ARI@LAC (value evaporated at current line). **Andy explicitly asked for a Week 1 intel refresh pass next session** (BettingPros ingestion freshness, Twitter bookmark recency, article ingestion freshness) before betting-card synthesis resumes.
4. **Twitter dual-identity extension** (personal + Platinum Rose accounts): identified as buildable (extend `agents/twitter-bookmarks-agent.js` to loop two cookie pairs instead of one env-fallback), Andy chose this approach, but it's deferred/not started.

Standing constraints unchanged: no commits/push without Andy's explicit approval, no Supabase writes without per-change authorization, no paid synthesis runs without authorization (Thread 2 already has it), `--allow-unsafe-preflight`-class overrides require Andy's own explicit call every time.

---

## Previous Session: 2026-09-11 — Gameday Tracker Tabs, Fulfilled Leg Minimization & Toolbox Friday Cadence Alignment (DONE)

> **SUPERSEDING NOTE (2026-09-11, scoped closeout, not a rewrite of history below):** every reference in this file to an `nfl_trench_ratings` surrogate-key migration, a `_loadBettorDayTrenchEvidence()` Site 5 carve-out, or BettorDay-lane authorization being pending is now stale. Andy's explicit call: BettorDay is retired for good, not deferred. The dead function was deleted (not migrated), and the daily ingest workflow (`.github/workflows/bettorday-intel-ingest.yml`) plus its writer (`agents/bettorday-newsletter-ingest.js`) were retired in the same pass, LOCALLY — prepared and committed-pending on this machine, not yet pushed. The daily GitHub Actions job remains operationally live on `origin/main` until this is pushed and remote-verified; treat it as still running until then. No surrogate-key migration will run; the historical entries below are left as-is (not broadly rewritten) — read them as superseded record, not as open next steps. Full detail: `docs/CODEX_BETTORDAY_REMOVAL_SPEC_2026-09-11.md`.

> **SELENE ODDS INGESTION REVIEW NOTE (2026-09-11, Codex Review Verdict: REJECT PENDING AUTHORIZATION & REDESIGN):**
> An under-the-hood Selene Odds live market ingestion proposal was evaluated and rejected by Codex. Key blocker: Selene's published Terms of Service explicitly prohibit automated/robotic access, treating feeds as confidential service data; written permission or a licensed data agreement is required prior to any automated ingestion or scheduling. Technical findings (P1/P2) identified hardcoded week labeling across future October games, game ID format mismatch with `buildGameId()`, missing quote freshness timestamps, and lack of atomic writes. Rollback status: All prototype code (`agents/selene-odds-ingest.js`, tests, and quarantined `scratch/` scripts) has been permanently deleted from the workspace to ensure zero executable code contacting the endpoint remains. Active pipelines and `data/supercontest/live-market-comparison.json` remain on official authorized sources (`scripts/sync-live-market-lines.mjs`). Note: This rejection record, rollback, and spec are currently recorded in the uncommitted working tree (awaiting Andy's review on whether to commit or discard). Full detail: `docs/CODEX_SELENE_ODDS_LIVE_MARKET_INGESTION_SPEC_2026-09-11.md`.

**Session updated 2026-09-11 01:45 PDT (~08:45 UTC).**  
Full detail docs:
- **Session Handoff:** [`handoffs/2026-09-11-0145-antigravity-toolbox-cadence-and-tracker-tab-enhancements-handoff.md`](file:///e:/dev/projects/NFL_Dashboard/handoffs/2026-09-11-0145-antigravity-toolbox-cadence-and-tracker-tab-enhancements-handoff.md)
- **Walkthrough Document:** [`walkthrough.md`](file:///C:/Users/andre/.gemini/antigravity/brain/8c2bb097-21ac-4c79-b816-96e50f254985/walkthrough.md)
- **Live Gameday Tracker:** [`public/live-tracker-sunday.html`](file:///e:/dev/projects/NFL_Dashboard/public/live-tracker-sunday.html)
- **Toolbox Dashboard:** [`scripts/toolbox-dashboard.html`](file:///e:/dev/projects/NFL_Dashboard/scripts/toolbox-dashboard.html) (Active on `http://127.0.0.1:4567/`)

### Status: Tracker Tabs, Leg Minimization & Toolbox Cadence Fixed & Verified (100% Green)
1. **Gameday Tracker Tab Navigation Restored**:
   - Tab 1: `🎫 Live Ticketboard (1 Active)`: 3-wide parlay slips grid, active/burnt partitioning, ticket filters, `[🧹 Clear Settled]`, and `[➕ Add Sunday Slip]`.
   - Tab 2: `⚡ Player Cheat Sheet & Gauges (13 Players)`: Dedicated multi-column responsive grid (`.players-grid`) of modular player prop cards, `🎯 Needs Stats` / `✅ Fulfilled` filters, sort options, and concluded players section.
   - Right sidebar dedicated strictly to `#alejandro-ledger-box` (Alejandro Castro Split Ledger).
   - Saved to `localStorage` (`sunday_active_tab_week_1`).
2. **Fulfilled Parlay Leg Minimization System**:
   - Global filter toolbar toggle: `[⚡ Minimize Hit Legs]` (`#chk-hide-fulfilled-legs`).
   - Per-card accordion summary strip: `[✅ X of Y Legs Hit • Click to toggle ⯆/⯈]` (`#minstrip-${bet.id}`).
   - Won legs (`.leg-item.checked`) are cleanly collapsed/hidden via CSS, leaving only live pending legs.
   - Ticket #6 (Bookmaker 7-Team Open Parlay) has Leg 1 (SF +4) pre-checked and minimized, displaying only the 6 pending Sunday legs.
3. **Toolbox Dashboard Friday Alignment & Movability Removal**:
   - On load, Toolbox automatically focuses on **Today's Pipeline** (`activeCadenceDayFilter = 'today'`).
   - Top active tab: `[⚡ Today's Focus (Friday)]` (`#tab-day-today`).
   - Front and center card is **Friday • Starters, Secondary & Alpha Packet** with action button **`[▶ Run Full Friday Pipeline]`**.
   - In "All 7 Days" view, cards are ordered with Today's pipeline pinned at the top, followed by Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday.
   - Removed all drag handles (`⠿`), `draggable="true"`, drag event handlers, and `localStorage` order caching.
4. **Full Test Suite Status**:
   - All 104/104 test files passed, 1,515/1,515 tests passed (100% green).

---

## Previous Session: 2026-09-10 Kickoff — Melbourne Player Props & SGPs Synthesized (LAR vs SF) (DONE)

**Session updated 2026-09-10 ~2100 UTC.**
Full detail docs:
- **Walkthrough Document:** [`walkthrough.md`](file:///C:/Users/andre/.gemini/antigravity/brain/ac5e572a-af6b-48c2-8d3d-f27d8dcb75b9/walkthrough.md)
- **Props Review Center (JSON):** [`data/research-intel/review/player-props-intel-latest.json`](file:///e:/dev/projects/NFL_Dashboard/data/research-intel/review/player-props-intel-latest.json)
- **Props Review Center (MD):** [`docs/player-props-intel/player-props-intel-latest.md`](file:///e:/dev/projects/NFL_Dashboard/docs/player-props-intel/player-props-intel-latest.md)
- **Props Review Center (HTML):** [`docs/player-props-intel/player-props-intel-latest.html`](file:///e:/dev/projects/NFL_Dashboard/docs/player-props-intel/player-props-intel-latest.html)

### Status: Melbourne Props & SGPs Fully Synthesized & Tested (100% Green)
1. **Intelligence Ingested & Cross-Referenced**:
   - BettingPros Ep. 1054 (Scott Bogman & Tara Roberts): Blake Corum Over 44.5 Rush, Kyren Williams Over 56.5 Rush, Deshaun Stribling Over 35.5 Rec, Deebo Samuel Over 29.5 Rec.
   - Even Money (Steve Fezzik): 2nd Half Over 23.5 Points (-110).
   - StatTree Models: Puka Nacua Over 7.5 Rec (+116, 30% target share, 10.8 yds/tgt vs zone), Davante Adams ATD (+140, #1 board score), George Kittle Over 3.5 Rec (-110, 90.9% hit rate), CMC Over 4.5 Rec (+104).
   - Retained Vetted Props: Kyle Juszczyk Over 4.5 Rec (-120), Mike Evans ATD (+175), CMC 61+ Rush (-115), Terrance Ferguson ATD (+400), Puka Nacua First TD (+800).
2. **Curated Same Game Parlays (SGPs) Ready for Execution**:
   - `parlay__sf_lar__rams_ground_control` (+580): Corum Over 44.5 Rush + Kyren Over 56.5 Rush + 2nd Half Over 23.5.
   - `parlay__sf_lar__melbourne_target_funnel` (+655): Nacua Over 7.5 Rec + Kittle Over 3.5 Rec + Juszczyk Over 4.5 Rec.
   - `parlay__sf_lar__melbourne_primetime_shootout` (+645): Evans ATD + CMC 61+ Rush + Juszczyk Over 4.5 Rec.
3. **Test Suite Status**: 96/96 test files passing, 1,469 unit tests green. Ready for kickoff execution review with Andy.

---

## Secondary Thread: Codex Round 9 v8 Implementation (Phases 1-3b approved, 2026-09-11)

**Session updated 2026-09-10 ~2130 UTC.**
Full detail docs:
- **Phase 1 handoff (approved by Codex):** [`handoffs/2026-09-10-1930-claude-dialect-phase1-primitives-handoff.md`](file:///E:/dev/projects/NFL_Dashboard/handoffs/2026-09-10-1930-claude-dialect-phase1-primitives-handoff.md)
- **Phase 2 handoff + re-review addendum (approved by Codex):** [`handoffs/2026-09-10-2030-claude-dialect-phase2-reducer-preconditions-handoff.md`](file:///E:/dev/projects/NFL_Dashboard/handoffs/2026-09-10-2030-claude-dialect-phase2-reducer-preconditions-handoff.md)
- **Phase 3a handoff (this round, awaiting Codex review):** [`handoffs/2026-09-10-2130-claude-dialect-phase3a-callsite-migration-handoff.md`](file:///E:/dev/projects/NFL_Dashboard/handoffs/2026-09-10-2130-claude-dialect-phase3a-callsite-migration-handoff.md)
- **Resume/review prompt:** [`HANDOFF_PROMPT.md`](file:///E:/dev/projects/NFL_Dashboard/HANDOFF_PROMPT.md)

### Status: Phases 1-3b approved. Phase 3b (pick signals / user picks + season-floor accessor) went through one review round (Changes requested, 2 P1 + 1 P2), all fixed, and was approved on re-review with one non-blocking P3 cleanup nit (also fixed).

Per Andy's "incrementally, Codex-reviewed per phase" instruction, v8's
9-step implementation plan is being built and reviewed one phase at a
time -- nothing proceeds to the next phase until Codex signs off on the
current one.

**Phase 1 (generic dialect primitives): Codex-approved.**
**Phase 2 (reducer preconditions): Codex-approved on re-review**, after
fixing 2 P1 + 2 P2 findings (article-lane sort was actually missing, an
expert-lane "fix" didn't fix anything and was reverted, the tie-fallback
silently reintroduced first-seen behavior, roster-week pagination had a
silent cap). Verdict verbatim: *"No blocking findings. All four prior
issues are resolved. ... Phase 2 approved. The next separately reviewed
phase may begin within the v8 sequence. This does not authorize the
`nfl_trench_ratings` migration, paid synthesis, commits, pushes, or
unrelated cleanup."*

**Before starting v8 step 5 (migrating the ~24+7 read call sites), Andy
was asked how to scope it** -- a repo scan showed `sb.from()` sites well
beyond the betting pipeline, reaching into fantasy/Yahoo ingest scripts
(off-limits per the standing "no Yahoo Fantasy work" rule). **Andy chose
betting-pipeline-only scope**: `portfolio-dossier.js`,
`portfolio-preflight.js`, `signal-normalize.js`,
`portfolio-synthesize.js`. Every fantasy/Yahoo file stays untouched.

**Phase 3a migrates the first four call sites** within that scope --
`fetchAdvancedAnalytics()`, `fetchDvoaSnapshots()`,
`fetchCoachingProfiles()`, `fetchGameSplitsLatest()` (all in
`portfolio-dossier.js`) -- from unpaginated/uncapped queries to
`fetchAllRows()` (Phase 1's approved primitive), now safe because
Phase 2 made their reduction explicit-comparison-based rather than
delivery-order-dependent. Verified via `node --check`, `eslint`, scoped
`git diff --check`, the full Phase 1/2 test suite (135/135, unchanged),
a live preflight run (unchanged baseline `{block:6, warn:6, error:0,
pass:22}`), and a full live end-to-end run of `node
agents/portfolio-dossier.js` itself confirming 32/32 team coverage and
exercising both the Supabase-success and local-fallback code paths.

One data-quality finding surfaced during verification (not a Phase 3
bug, flagged for visibility): `game_splits_history`'s 48 season-2026
rows don't match the real 2026 schedule (looks like placeholder/seed
data predating the finalized schedule) -- the join logic is unchanged
from before this migration.

**Phase 3a approved** (verdict verbatim: *"Phase 3a approved. The next
separately scoped call-site migration sub-phase may proceed. This does
not authorize the nfl_trench_ratings migration, paid synthesis, commits,
pushes, or fantasy/Yahoo work."*).

**Phase 3b migrates `fetchPickSignals()` and `fetchUserPicks()`**
(`agents/portfolio-dossier.js`) and lands the long-flagged
`TRAINING_CAMP_START_BY_SEASON`/`signalFloorForSeason()` accessor (v7/v8
Finding 3, the RULES.md date-threshold exception) in a new
`agents/lib/pick-signal-floor.js`. **First review round: Changes
requested** (2 P1 + 1 P2, all independently verified genuine against the
v8 proposal doc before fixing): (1) both functions had used
`fetchTopRows()` (bounded top-N) where the proposal doc specifies
exhaustive `fetchAllRows()` for these tables -- migrated to
`fetchAllRows()`; (2) the try/catch around each fetch also wrapped the
call that resolves the season floor, so a missing/misconfigured season
would be swallowed as a soft degrade instead of failing the build loud --
fixed by extracting `buildPickSignalRequest()`/`buildUserPicksRequest()`
and calling them outside the try block; (3) the original wiring test
only unit-tested the extracted filter-building helper, not the real call
site -- fixed by adding an `import.meta.url` main() guard to
`portfolio-dossier.js` (so it's safely importable), exporting
`fetchPickSignals()`/`fetchUserPicks()`, and adding `vi.mock()`-based
tests in `pickSignalFloor.test.js` that assert on the real functions'
actual calls into the (mocked) primitive, including one proving a
missing season config throws before the primitive is ever called.
Verified via `node --check`, `eslint`, scoped `git diff --check`, and
144/144 passing across the five directly related suites (9 in
`pickSignalFloor.test.js` alone, up from 6). **Live Supabase / live
dossier-build re-verification is still outstanding** -- blocked this
round by the device-bridge shell's own egress proxy returning `403
blocked-by-allowlist` for all outbound hosts (confirmed via direct curl
to unrelated hosts too, so not Supabase- or code-specific); the
pre-fix version of this migration *did* get a full live confirmation
earlier the same day (800 pick signals, 38 user picks, matching
end-to-end dossier summary), so this is a new environment restriction,
not a sign the fetch logic itself is broken. Needs to be rerun once
network access is available -- see the Phase 3b handoff addendum for the
exact expected values.

**Not yet migrated within the approved scope** (deliberately deferred):
`fetchInjuryContext()`/`fetchGameOddsOpen()` (already on the
recognized-safe `fetchAllPaged()` pattern), preflight single-row/
count-only sites (likely already-safe shapes), `gatherPickSignalRows()`/
`gatherHostSummaryRows()` in `signal-normalize.js` (already fully
paginated), and bounded-write sites. The `nfl_trench_ratings`
surrogate-key migration and the real ESLint rule remain separately
gated, unauthorized.

**Next (superseded by the 2026-09-11 approval above):** Phase 3b is
approved and closed out. Continue the betting-pipeline call-site
migration in further sub-phases per v8's remaining sequencing (see
`HANDOFF_PROMPT.md`'s "What's Next" for the current candidate list),
Codex-reviewed one phase at a time as always.

**2026-09-11 candidate confirmation (before scoping Phase 3c):** read
every site the Phase 3b handoff had only guessed about, plus the live
`node agents/portfolio-preflight.js --json` rowcap/call-site scan
output, to establish ground truth rather than assume. Results:

Already safe, no change needed (confirmed by reading the code, not
assumed): `fetchInjuryContext()`/`fetchGameOddsOpen()` in
`portfolio-dossier.js` are on the pre-existing `fetchAllPaged()`
exhaustive paginator with a real secondary-key tiebreaker and explicit
`isBetterRow()` reduction -- functionally equivalent to `fetchAllRows()`
though implemented before Phase 1's primitives existed. `rowCount()`/
`newestTs()` in `portfolio-preflight.js` are the approved count-only/
single-row shapes. The `nfl_rosters` week-discovery diagnostic was
already fixed in Phase 2 (2026-09-04). Three of the eight sites the
rowcap scanner flags as BLOCK are false positives from the scanner
itself: `normalized_signals` (`signal-normalize.js:472`),
`futures_recommendations` (`portfolio-synthesize.js:3406`), and
`futures_recommendation_runs` (`portfolio-synthesize.js:3444`) are all
bounded `.upsert()`/`.insert()` WRITES of the current run's own rows
(chunked at 500 for the first), not unbounded reads -- the scanner's
static pattern match doesn't distinguish a write chain from a read
chain on the same table name.

Genuinely unmigrated, real truncation-risk READ sites (confirmed by
reading each, not by the scanner alone):
1. `fetchTeamStats()` (`nfl_team_season_stats`, `portfolio-dossier.js:438`)
   -- unpaginated multi-season (2023-`SEASON`), all-32-teams read, no
   `.limit()`/cap-drift protection at all.
2. `fetchSchedule()` (`games`, `portfolio-dossier.js` ~1137) --
   unpaginated season-filtered schedule read, no `.limit()`.
3. `fetchRefereeTendencies()` (`referee_tendencies`,
   `portfolio-dossier.js:1200`) -- unpaginated table-wide read, no
   `.limit()` (currently a small table, but unbounded on the code path).
4. `gatherItems()`'s `expert` lane (`user_picks`, `signal-normalize.js:367`)
   -- `.limit(1000)` with no `.order()`, explicitly left as a known,
   flagged, NOT-yet-fixed gap by the Phase 2 review (its own comment
   says so).
5. `_loadBettorDayTrenchEvidence()` (`nfl_trench_ratings`,
   `portfolio-synthesize.js:1675`) -- unpaginated read, `.order()` but
   no `.limit()`/pagination. Entangled with the still-unauthorized
   `nfl_trench_ratings` surrogate-key schema migration: this table may
   not yet have a stable unique key for `fetchAllRows()`'s keyset
   cursor until that migration lands, so this site's fix may need to
   wait on (or be scoped separately from) that authorization.

This corrects the Phase 3b handoff's own optimistic guess ("likely
already-safe, need confirmation not code change") -- five real sites
remain, not zero. Ready to draft a Phase 3c proposal for Codex covering
sites 1-4 (site 5 pending the schema-migration question) once Andy
confirms scope.

**2026-09-11 Phase 3c proposal drafted:**
[`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_2026-09-11.md`](file:///E:/dev/projects/NFL_Dashboard/docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_2026-09-11.md)
covers sites 1-4 (`fetchTeamStats()`/`nfl_team_season_stats`,
`fetchSchedule()`/`games`, `fetchRefereeTendencies()`/`referee_tendencies`,
`gatherItems()`'s `user_picks` expert lane) with a per-site current-shape/
consumption-analysis/target-shape/test-plan writeup, all migrating to the
already-approved `fetchAllRows()` primitive. No new `TABLE_UNIQUE_KEYS`
entries needed (all four tables were already declared in Phase 1). Site
5 (`nfl_trench_ratings`) stays out of scope pending the schema-migration
question. Proposal only -- no code written yet; awaiting Codex review
before any implementation, per the standing "incrementally,
Codex-reviewed per phase" instruction.

**2026-09-11 Codex review of Phase 3c v1: changes requested** (2 P1, 1
P2, 1 P3). All four confirmed correct, none contested:
1. **P1** -- Site 4's wiring test as proposed would import
   `signal-normalize.js`, which has no exports and no
   `import.meta.url` guard on its top-level IIFE -- importing it for a
   test would trigger the live script (LLM calls, file writes, a real
   Supabase upsert), the same class of bug Phase 3b's guard fixed in
   `portfolio-dossier.js`. v1 also falsely claimed this would "mirror"
   existing test coverage that doesn't exist (no `signal-normalize.js`
   test file exists at all).
2. **P1** -- v1 claimed the expert-lane's new `created_at`-descending
   sort was "the same product behavior as before," but the current code
   has no `.order()` at all -- there was no defined "before" to
   preserve. This is a new product choice, not a preserved one, and
   needed explicit sign-off rather than being folded silently into the
   shape migration.
3. **P2** -- v1 left `fetchTeamStats()`'s all-three-candidates-fail
   behavior as an open question rather than resolving it.
4. **P3** -- v1's prose said `fetchSchedule()`'s current `.select()`
   doesn't already include `game_id`; it does (confirmed directly
   against the live code) -- a factual error in the write-up only, not
   in the target-shape code sample.

**Response drafted:**
[`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v2_2026-09-11.md`](file:///E:/dev/projects/NFL_Dashboard/docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v2_2026-09-11.md)
-- adds the `import.meta.url` guard + exports to `signal-normalize.js`'s
plan, explicitly flags `created_at`-descending as a product decision
awaiting sign-off (mechanics approved regardless of which order is
chosen), resolves the all-candidates-fail path by adding a
`console.warn` (matching every sibling fetch function) while keeping
the non-throwing degrade, and corrects the `game_id` prose. Sites 1-3's
shape assignments, the `TABLE_UNIQUE_KEYS` analysis, the
`referee_tendencies` DB-uniqueness argument, the site-5 carve-out, and
the rowcap-scanner false-positive notes are all unchanged from v1.
Still proposal only -- no Phase 3c code written; ready for re-review.

**2026-09-11 Codex review of Phase 3c v2: changes requested** (2 P1).
Both confirmed correct, none contested:
1. **P1** -- "Main guard does not make the module import-safe." v2's
   fix wrapped the existing anonymous top-level IIFE inside an
   `import.meta.url` guard, rather than extracting a **named** `main()`
   function the way `portfolio-dossier.js`'s actual (Codex-approved)
   pattern does (`async function main() {...}` at line 1993, guard at
   line 2107 doing nothing but `main().catch(...)`). Confirmed directly
   against both files: v2's guard was structurally different from the
   precedent it claimed to follow, not just cosmetically similar to it.
2. **P1** -- "gatherItems test still reaches unrelated live lanes."
   `gatherItems()` handles all three lanes (article/podcast/expert) in
   one function gated by a `want(sourceType)` closure that defaults to
   "all lanes on" whenever `--source`/`ONLY_SOURCE` is unset -- so a
   wiring test targeting only the expert lane, even with
   `fetchAllRows()` mocked, would still run the article lane's live
   hand-rolled `research_intel_notes` pagination and the podcast lane's
   live `podcast_transcripts` read for real, since neither of those two
   lanes goes through `fetchAllRows()` at all.
Codex also reconfirmed the `created_at`-descending sort is technically
sound ("the appropriate policy") but reiterated it is still only a
recommendation -- Andy's explicit product sign-off is still required
before implementation, separate from Codex's mechanical approval. The
three other v1 findings (team-stat all-candidates-fail warning,
`game_id` prose correction, sites 1-3's shapes/schema analysis, the
`nfl_trench_ratings` carve-out) were all confirmed resolved.

**Response drafted:**
[`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v3_2026-09-11.md`](file:///E:/dev/projects/NFL_Dashboard/docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v3_2026-09-11.md)
-- (1) extracts a named `main()` from `signal-normalize.js`'s current
top-level IIFE, called from a guard matching `portfolio-dossier.js`'s
exact structure line-for-line; (2) splits the expert lane out of
`gatherItems()` into its own exported `gatherExpertPicks()`/
`buildExpertPicksRequest()`, migrated onto `fetchAllRows()`, so a wiring
test (`tests/unit/gatherExpertPicks.test.js`) can mock `fetchAllRows()`
and call exactly that one function with zero exposure to the
article/podcast lanes -- `gatherItems()` itself no longer needs to be
exported at all. Also corrected an issue found while drafting this fix:
v2's proposed tiebreak comparator ((b.id ?? 0) - (a.id ?? 0)) assumed a
numeric `id`, but `user_picks.id` is a client-generated `text` primary
key per `supabase/migrations/004_user_data.sql` -- v3 uses
`localeCompare` instead. The `created_at`-descending sort-order choice
remains flagged as awaiting Andy's explicit sign-off, not marked
resolved. Sites 1-3's shapes, the `TABLE_UNIQUE_KEYS` analysis, the
site-5 carve-out, the team-stats warning, and the `game_id` correction
are all unchanged from v2. Still proposal only -- no Phase 3c code
written; ready for re-review.

**2026-09-11 Codex review of Phase 3c v3: changes requested** (2 P1, 1
P2). All three confirmed correct, and confirming one of them exposed a
factual error in v3's own reasoning:
1. **P1** -- "Clean CI still cannot import the module." v3 justified
   leaving `signal-normalize.js`'s module-scope env-check/
   `createClient()` pattern unchanged by claiming `portfolio-dossier.js`
   runs the same pattern and "is already imported today by five
   existing test files... against the project's real `.env`." **That
   claim was wrong** -- re-checked directly: none of those five test
   files actually import `portfolio-dossier.js` (`portfolio-dossier`
   only appears in their comments/descriptions; `grep -rl "from
   '.*portfolio-dossier.js'" tests/` returns nothing). Reproduced the
   real failure directly: importing `portfolio-dossier.js` with
   `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` blank kills the process
   immediately via `process.exit(1)`, and confirmed CI (`npm test` in
   `.github/workflows/ci.yml`) runs with no such secrets set, `.env` is
   gitignored, and `.env.test` carries none either -- so this is a live
   gap, not hypothetical.
2. **P1** -- "Query failure now aborts every lane." `fetchAllRows()`
   throws on error by design; v3's `gatherExpertPicks()` call inside
   `gatherItems()` had no try/catch, so migrating the expert lane onto
   a throwing primitive meant a query failure there would now abort the
   entire multi-lane gather (losing the article/podcast lanes' results
   too), where before it silently produced zero expert items without
   affecting anything else.
3. **P2** -- "Expert label was dropped from `raw_text`." Confirmed
   directly: the current live code prefixes `raw_text` with
   `[${expert}] `; v3's sample dropped that prefix, carried over by
   habit from the article lane's plain-text style.

**Response drafted:**
[`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v4_2026-09-11.md`](file:///E:/dev/projects/NFL_Dashboard/docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v4_2026-09-11.md)
-- (1) makes env validation + `createClient()` lazy via a new
`ensureEnv()`, called only from `main()`, so importing
`signal-normalize.js` in a clean environment with zero credentials now
does nothing but define functions (verified directly: no
`process.exit`, no crash); (2) splits the expert lane's throwing
`gatherExpertPicks()` from a new `gatherExpertPicksSafe()` wrapper that
catches, warns, and degrades to `[]` -- `gatherItems()` calls the safe
wrapper, so a query failure no longer aborts the article/podcast
lanes; (3) restores the `[expert] ` prefix in `raw_text`. New test file
`tests/unit/gatherExpertPicks.test.js` covers all three: request shape
+ sort order, the `[expert] ` prefix, and the safe-wrapper's
catch-and-degrade path -- all with zero Supabase credentials and zero
live network calls. `created_at`-descending remains flagged as awaiting
Andy's sign-off, not resolved. Sites 1-3, the site-5 carve-out, the
team-stats warning, the `game_id` correction, and the named-`main()`
extraction/guard are all unchanged from v3. Still proposal only -- no
Phase 3c code written; ready for re-review.

**2026-09-11 Codex review of Phase 3c v4: changes requested** (1 P1).
Confirmed correct, and it caught a second wrong claim of mine: v4's
side note said the same `process.exit(1)`-on-blank-env gap exists in
`portfolio-dossier.js` too but "nothing currently imports it in CI, so
the gap has never actually surfaced there." **Wrong** -- the earlier
grep only matched static `import` statements and missed dynamic
`import()` calls; `tests/unit/pickSignalFloor.test.js` (Phase 3b's own,
already-approved wiring test) dynamically imports
`agents/portfolio-dossier.js` three times to reach the real
`fetchPickSignals`/`fetchUserPicks` functions it tests. Reproduced
directly: `SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= OPENAI_API_KEY=
ANTHROPIC_API_KEY= npx vitest run tests/unit/pickSignalFloor.test.js`
fails exactly 3 of 9 tests with `process.exit unexpectedly called with
"1"` at `agents/portfolio-dossier.js:57`; confirmed
`.github/workflows/ci.yml`'s "Unit tests (Vitest)" step runs `npm test`
with no `env:` block at all. This is a real, already-existing gap in
Phase 3b's approved code (still uncommitted in this checkout, per the standing no-commit-without-approval rule -- not "merged") -- it went unnoticed at approval time
because Codex's own Phase 3b verification ran "from an environment
with live Supabase access."

**Response drafted:**
[`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v5_2026-09-11.md`](file:///E:/dev/projects/NFL_Dashboard/docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v5_2026-09-11.md)
-- proposes the same `ensureEnv()` lazy-init pattern already designed
for `signal-normalize.js` in v4, applied to `portfolio-dossier.js`
(simpler there -- only `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, no
model-key branching). **Verified directly, not assumed:** patched a
scratch copy of `portfolio-dossier.js` with exactly this change,
pointed a scratch copy of `pickSignalFloor.test.js` at it, re-ran the
same blank-env command -- **9/9 passing**, all three previously-failing
tests included. Scratch files removed from the tracked tree afterward
(moved to `_to_delete/`, since this shell can't delete outright --
flagging that folder for Andy to empty; it already held a few
unrelated stale artifacts from earlier sessions). No change made to
the real, tracked `portfolio-dossier.js` -- this is a proposal only.
`created_at`-descending remains flagged for Andy's sign-off, the other
of the two items Codex named as blocking Phase 3c's implementation
approval. Everything else (signal-normalize.js's v4 design, sites 1-3,
the site-5 carve-out) is unchanged from v4. Still proposal only -- no
Phase 3c code written; ready for re-review.

**2026-09-11 Phase 3c v5 APPROVED FOR IMPLEMENTATION.** Codex's
independent review through v5: technical design approved; Andy
explicitly authorized the remaining product decision (expert-pick lane
ordered by `created_at` descending, then text `id` descending as a
deterministic tiebreak -- controls which items survive `--limit`, does
not make picks official or authorize betting activity). Implemented
exactly the approved scope, nothing more:

1. **Phase 3b addendum** -- `agents/portfolio-dossier.js`'s env
   validation + Supabase client creation made lazy (`ensureEnv()`,
   called only from `main()`). Verified: importing the module with
   `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` blank no longer calls
   `process.exit()`; the existing 9 `pickSignalFloor.test.js` tests
   pass with those credentials blank.
2. **`fetchTeamStats()`** -- migrated to `fetchAllRows()`; the
   three-column-list fallback, first-success-stops behavior, all-fail
   `{}` + warning, and season-desc JS grouping are all preserved
   exactly. New `buildTeamStatsRequest(cols)` exported for wiring
   tests.
3. **`fetchSchedule()`** -- migrated to `fetchAllRows()`; season filter
   and error-to-`[]` degrade preserved. `game_id` was already the
   first selected column -- confirmed no cursor injection/stripping
   occurs (verified via the wiring test's request-shape assertion).
4. **`fetchRefereeTendencies()`** -- migrated to `fetchAllRows()`;
   error-to-`{}` degrade and per-referee grouping preserved (DB
   uniqueness on `referee` already guarantees one row per key).
5. **`signal-normalize.js` expert-pick lane** -- env validation +
   model-key loading + client creation made lazy (same `ensureEnv()`
   pattern); the top-level script body extracted into a named
   `main()`, invoked only behind the `import.meta.url` guard (matching
   `portfolio-dossier.js`'s structure exactly, not an anonymous
   function inside the guard); `buildExpertPicksRequest()` /
   `gatherExpertPicks()` (throws) / `gatherExpertPicksSafe()` (catches,
   warns, returns `[]`) extracted and exported; `gatherItems()` now
   calls the safe wrapper, so an expert-lane query failure no longer
   aborts the article/podcast lanes; sort is `created_at` descending
   (invalid/missing dates sort last, both against each other and
   against valid dates) then text `id` descending via
   `localeCompare()`; the `"[expert name] "` `raw_text` prefix is
   preserved exactly.

**Tests:** two new files --
`tests/unit/portfolioDossierPhase3c.test.js` (9 tests: sites 1-3
request wiring, team-stats fallback/all-fail-warning, schedule
error-degrade, referee grouping) and
`tests/unit/gatherExpertPicks.test.js` (9 tests: request wiring, date
ordering, text-id tiebreak, invalid/missing-date handling, item shape,
expert-name prefix + fallback label, and `gatherExpertPicksSafe()`'s
catch-and-degrade behavior) -- both files' 18 tests plus the existing
9 in `pickSignalFloor.test.js` (27 total) verified passing with
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`OPENAI_API_KEY`/
`ANTHROPIC_API_KEY` all blank and zero live network calls.

**Verification:** `node --check` clean on all four touched/new files;
scoped ESLint (`agents/portfolio-dossier.js agents/signal-normalize.js`
plus both new test files) zero errors/warnings; `git diff --check`
clean on the two touched agent files; full Vitest suite run in 6 shards
(this device shell's per-call time budget doesn't fit the whole 1,478-
test suite in one run) -- 1,504/1,505 passed, the lone failure
(`tests/unit/generateLiveTracker.test.js`) is unrelated to this work:
it fails only because this sandboxed shell can't delete its own
test-output cleanup file (`EPERM: operation not permitted, unlink`),
the same delete restriction noted earlier this session, not a code
regression -- confirmed by reading the test, which imports
`scripts/generate-live-tracker.mjs` and has no relationship to
`portfolio-dossier.js`/`signal-normalize.js`. Read-only
`portfolio-preflight.js --json`: `safe_to_run_paid_synthesis: false`
(paid synthesis correctly stays blocked); disposition
`{ERROR:10, WARN:6, BLOCK:7, PASS:15}` -- every ERROR is
`TypeError: fetch failed` (this shell's known network-egress
restriction, affecting every table check uniformly, not specific to
the migrated sites) and every BLOCK is a pre-existing staleness/
rowcap-verification gap already documented earlier this session; none
newly introduced by this change.

Non-blocking doc correction applied per Codex's note: "approved,
merged" -> "approved code (still uncommitted in this checkout)"
wherever it appeared in this file and in v5's own proposal doc.

**HEAD unchanged at `103d3ef`; nothing staged** (`git diff --cached`
empty). Touched: `agents/portfolio-dossier.js` (modified, +326/-95 per
`git diff --stat`), `agents/signal-normalize.js` (modified,
+127/-... per `git diff --stat`), `tests/unit/portfolioDossierPhase3c.test.js`
(new), `tests/unit/gatherExpertPicks.test.js` (new). Full diff exported
to `_to_delete/phase3c_implementation.diff` for delivery to Codex (not
a real deletion candidate -- reused that folder name only because it
already existed as this session's scratch-file convention; Andy can
move/rename it). Unrelated dirty work (workflow YAML edits, RULES.md,
various data/docs files, the deleted bettorday-newsletter-ingest.js,
etc.) left completely untouched, per instruction. Awaiting Codex's
review of the diff before any further step.

**2026-09-11 Codex review of the Phase 3c implementation: APPROVED.**
Codex independently reviewed the live working tree directly (not just
the saved patch/handoff) and confirmed: `portfolio-dossier.js` now
initializes Supabase lazily (blank-credential imports no longer start
the pipeline); `fetchTeamStats()`/`fetchSchedule()`/
`fetchRefereeTendencies()` use `fetchAllRows()` with the intended
filters and all existing fallback behavior preserved;
`signal-normalize.js` has lazy init and an import-safe named entry
point; the expert-pick lane exhaustively fetches all matching
`user_picks` rows before sorting by the authorized policy
(`created_at` DESC, text `id` DESC tiebreak); transformation,
attribution, warning, and graceful-fallback behavior all intact; no
`nfl_trench_ratings` migration was introduced. Codex's own independent
verification: scoped syntax/ESLint/diff checks clean; blank-credential
regression suites 27/27; full suite **1,509/1,509 across 103 files**
in Codex's environment (the one failure this session reported,
`generateLiveTracker.test.js`'s delete-permission quirk specific to
this device-bridge shell, did not reproduce there); preflight
`{block:6, warn:6, error:0, pass:22}`; rowcap scan 15 sites, 0
truncating, 0 unresolved; `safe_to_run_paid_synthesis` still `false`.
HEAD unchanged, nothing staged. Codex explicitly scoped this approval
to Phase 3c only -- any further migration phase needs its own proposal
and review. **Next: Andy's separate, explicit authorization is needed
before staging or committing anything** -- Codex's approval is a
technical sign-off, not commit authorization, per this project's
standing rule.

**2026-09-11 Phase 3c COMMITTED.** Andy gave explicit, separate
authorization to stage and commit (distinct from Codex's technical
approval above, per standing rule). Staged exactly the four approved
files via scoped `git add` (`agents/portfolio-dossier.js`,
`agents/signal-normalize.js`, `tests/unit/portfolioDossierPhase3c.test.js`,
`tests/unit/gatherExpertPicks.test.js` -- confirmed via `git diff
--cached --stat` before committing: 4 files changed, 688 insertions(+),
95 deletions(-), matching the approved diff exactly). Never used `git
add -A`/`.`. Committed as `2e47611` on top of `103d3ef`. Verified
post-commit: `git status --short` no longer lists any of the four
files as pending, and the remaining ~709 lines of unrelated dirty work
(workflow YAML edits, RULES.md, scratch/data/docs files, etc.) are
untouched. **Phase 3c is now fully implemented, Codex-approved, and
committed.** Next: report the commit hash to Codex for its final
sanity check / formal close-out of the phase.

**2026-09-11 Phase 3c FORMALLY CLOSED.** Codex independently
re-verified the committed HEAD itself (not just the pre-commit patch):
confirmed HEAD is exactly `2e47611` with parent `103d3ef`; the commit
contains exactly the four approved files (`agents/portfolio-dossier.js`,
`agents/signal-normalize.js`, `tests/unit/portfolioDossierPhase3c.test.js`,
`tests/unit/gatherExpertPicks.test.js`), 688 insertions(+)/95
deletions(-); none of the four has a subsequent uncommitted
modification; nothing staged; all unrelated dirty working-tree files
remain outside the commit. Fresh independent verification: syntax/
scoped-ESLint/commit-diff checks clean; blank-credential regression
27/27; full suite **1,513/1,513 across 104 test files** (up from
1,509/103 at the pre-commit review -- expected drift from ordinary
suite growth elsewhere in the tree, not a regression or anything
investigated further); preflight `{block:6, warn:6, error:0, pass:22}`;
rowcap scan 15 sites/0 truncating/0 unresolved; `safe_to_run_paid_synthesis`
still `false`. No paid synthesis, DB writes, dossier generation,
betting/portfolio mutations, Yahoo work, staging, commit, push, or
cleanup performed during this review. Codex accepted commit `2e47611`
as the final Phase 3c checkpoint and reconfirmed `nfl_trench_ratings`
(site 5) remains out of scope/unauthorized, and that the ESLint
enforcement rule is a separate future phase needing its own scoped
proposal/review. **Phase 3c is fully implemented, Codex-approved,
committed, and closed. Nothing further to do on this phase.**

**2026-09-11 independent re-check (separate session):** re-verified the
Phase 3b fix round from scratch against live code -- `fetchPickSignals()`/
`fetchUserPicks()` confirmed on `fetchAllRows()`, request-building
confirmed outside the try/catch, wiring tests confirmed present and
passing (9/9 on `pickSignalFloor.test.js`, 48/48 combined with
`supabasePagination.test.js`). Re-attempted the live network check:
still blocked -- `curl` to any host returns `403 blocked-by-allowlist`,
and `node agents/portfolio-preflight.js --json` now shows
`{block:11, warn:6, error:10, pass:15}` with every `A:database`/
`A:rowcap` lane failing on `TypeError: fetch failed` (a network-caused
shape, not a regression -- consistent with the environment-level outage
already documented above, not a new issue). `HANDOFF_PROMPT.md` updated
to match. **Phase 3b fix round is ready to send to Codex for
re-review; the live check remains the only outstanding item, blocked by
this environment's egress restriction.**

**2026-09-11 Phase 3b re-review verdict: APPROVED.** Codex verbatim:
*"Approved for Phase 3b. No blocking findings remain."* All three prior
findings confirmed correctly resolved (exhaustive `fetchAllRows()` at
both call sites, missing season config escapes before the recoverable
query boundary, tests exercise the real exported call sites and capture
the actual pagination arguments). Codex's own independent verification
(from an environment with live Supabase access, unlike this device-
bridge shell): focused suites 144/144, full suite 1,478/1,478 across 97
files, live preflight recovered to `{block:6, warn:6, error:0, pass:22}`,
866 pick signals / 38 user picks returned with the earliest signal dated
August 11 (confirming the season-floor path live), HEAD still `103d3ef`,
nothing staged. One non-blocking **P3**: stale comment in
`agents/lib/pick-signal-floor.js:10-15` still referenced `fetchTopRows()`
and the old (non-exported, non-wiring-tested) call shape from before the
fix round. **Fixed** (comment now correctly says `fetchAllRows()` and
names the real exported call sites); re-verified `node --check`/`eslint`
clean and 48/48 passing across `pickSignalFloor.test.js` +
`supabasePagination.test.js` after the comment fix. **Phase 3b is fully
closed out** -- the only item any prior note flagged as outstanding (a
live Supabase check) has now been done, by Codex, with results matching
expectations. Live network access from this device-bridge shell remains
blocked, unchanged from before; that no longer blocks anything, since
Codex's own environment supplied the live confirmation.

## Historical: Codex Round 9 -- Query Dialect Migration Proposal APPROVED at v8, superseded above (2026-09-10)

**Session updated 2026-09-10 ~1700 UTC.**
Full detail docs:
- **Proposal (approved, authoritative):** [`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v8_2026-09-10.md`](file:///E:/dev/projects/NFL_Dashboard/docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v8_2026-09-10.md) (v1-v7 in the same directory, superseded, kept for review trail)
- **Resume/review prompt:** [`HANDOFF_PROMPT.md`](file:///E:/dev/projects/NFL_Dashboard/HANDOFF_PROMPT.md)

### Milestone: Codex approved v8 "for implementation"

After 8 rounds of proposal revision across a full session (each round
responding to a full Codex review, every finding verified directly
against the real schema/code before being accepted), Codex returned:
**"Approved for implementation."** No blocking findings against v8 --
the amended `RULES.md:84` date-threshold exception matches the
authorization and rationale, and the wiring test for
`signalFloorForSeason()` is sufficient for the proposal stage.

**Codex was explicit about what this approval does NOT cover** (verbatim
from the review): *"This approves the v8 proposal and resolves the
date-threshold finding; it does not approve an implementation that has
not yet landed, authorize the separate database migration, or authorize
paid synthesis. The eventual implementation still needs evidence for the
six explicit-`id` projections, null/tie ordering, season-accessor
behavior, call-site filter wiring, and dialect-level `gte` translation."**

In plain terms: the *design* is approved. The actual code -- the
pagination helpers, the six reducer-site rewrites, the `nfl_trench_ratings`
surrogate-key migration, the ESLint rule -- still has to be written,
tested, and independently re-verified once it exists. Design approval is
necessary but not sufficient to start writing pipeline code under this
team's standing protocol; per the standing constraints below, Andy's
separate go-ahead is needed before implementation work begins, and the
`nfl_trench_ratings` schema migration needs its own separate authorization
regardless of this approval.

### What the approved v8 design actually is (summary of 8 rounds)

Six query shapes replace ad-hoc Supabase reads: single-row lookup,
count-only, `fetchByUniqueValues()` (fixed small sets only, e.g.
`vault_notes`), `fetchAllRows()` (exhaustive keyset pagination, empty-page
terminated, `TABLE_UNIQUE_KEYS`-driven cursor column, `notLike`-capable
declarative filters), `fetchTopRows()` (bounded top-N with deterministic
secondary sort + cap-drift detection), and bounded writes
(`upsert`/`insert`). A parallel, equally important thread emerged over the
rounds: several existing reducers (`latestByTeam()` and others) depend on
row *delivery order*, which `fetchAllRows()`'s PK-ascending pagination
does not preserve -- so every affected site needs an explicit
comparison-based reduction (keep the row with the better timestamp, not
first/last-seen) with a correctly-specified tie/null rule, plus its own
table's unique key explicitly added to its `select()` (not left to
`fetchAllRows()`'s cursor injection/stripping, which is invisible by
design and will strip an unrequested column). A hardcoded production date
threshold (`research_pick_signals`'s Aug 10 cutoff) is now a named,
season-keyed, fail-loud accessor, closing a real house-rule gap along the
way -- and along with it, `RULES.md` itself now correctly distinguishes
wall-clock expiry logic from static per-season configuration for future
cases like this one.

The gate-report bug (`safe_to_run_paid_synthesis` ignoring thrown-check
`ERROR` status) was found as a side effect of this work, independently
authorized, and fixed in two rounds -- now a single `buildDisposition()`
function driving the JSON field, the human CLI report, and the exit code
identically. Shipped and verified; unaffected by the design-approval
milestone above.

**Nothing committed/staged/pushed this session.** The gate fix + tests are
the only actual code changes; everything else this round was proposal
documents (`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_*.md`,
v1-v8) and the `RULES.md` amendment.

**Next session:** implementation of the approved v8 design has NOT
started. Before it does: confirm with Andy how he wants the implementation
phased (all at once vs. incrementally per v8's 9-step sequencing), get
separate authorization for the `nfl_trench_ratings` surrogate-key
migration, then build per v8's plan -- pagination helpers first, then the
reducer-site conversions (hard preconditions per v8/v7), then the actual
call-site migrations, then the ESLint rule with full `RuleTester`
coverage, enabling it only once the preconditions are merged and verified
live.

## Historical: Codex Round 9 -- Query Dialect Migration Proposal v7, superseded above (2026-09-10)

**Session updated 2026-09-10 ~1500 UTC.**
Full detail docs:
- **Proposal (authoritative):** [`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v7_2026-09-10.md`](file:///E:/dev/projects/NFL_Dashboard/docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v7_2026-09-10.md) (v1-v6 in the same directory, superseded, kept for review trail)
- **Resume/review prompt:** [`HANDOFF_PROMPT.md`](file:///E:/dev/projects/NFL_Dashboard/HANDOFF_PROMPT.md)

### Claude Summary (Query Dialect Migration Proposal, Round 9 -> v7)

Codex reviewed v6 and returned: changes requested, 2 P1, 1 P2. Both P1s
were self-contradictions inside v6's own text, not new discoveries.

- **P1 -- the `id` secondary-key rule v6 specified is unimplementable as
  written.** v6's Finding 2 said six reducers (`latestByTeam()`'s three
  callers, `fetchInjuryContext()`, `fetchGameOddsOpen()`,
  `fetchGameSplitsLatest()`) should use `id` as a tiebreaker, but verified
  live against `agents/portfolio-dossier.js`: none of those six
  `.select()` strings actually request `id` (lines 312, 862, 928, 969,
  1073, 1091). Worse, `fetchAllRows()`'s own contract (established back in
  v3) is to inject a table's unique-key column into the request only if
  the caller didn't ask for it, and strip that column back out of the
  rows it returns in exactly that case -- so even after migration, relying
  on the helper's internal handling would silently strip `id` right back
  out. Fixed by explicitly adding `id` to all six `.select()` strings
  (which makes `fetchAllRows()`'s own injection/strip logic a no-op, since
  the column is now caller-requested) and adding a standing rule to the
  migration checklist: any site whose reducer needs the table's unique key
  in its output must request that column explicitly, never rely on the
  cursor machinery to surface it.
- **P1 -- the null/null tie rule directly contradicted the declared
  secondary key.** v6 said two null/invalid timestamps should "keep
  whichever row was seen first." Under `fetchAllRows()`'s PK-ascending
  pagination, "seen first" means lowest `id` -- the opposite of "latest
  wins, secondary key `id` DESC" for the three latest-row reducers. A
  null/null tie between an old low-`id` row and a genuinely newer high-`id`
  row would have kept the old one, silently -- exactly the bug class this
  whole migration exists to close. Fixed by deleting the "first-seen"
  special case entirely: null/null and invalid/invalid ties now fall
  through to the same secondary-key comparison as an exact valid-timestamp
  tie, since both mean "no timestamp signal, use the next key."
- **P2 -- the Aug 10 cutoff is a hardcoded production date threshold,**
  which `RULES.md:84` explicitly forbids without a `vi.useFakeTimers()`
  test ("NEVER add hardcoded date thresholds to production logic..."). v6's
  bare `.gte('captured_at', '2026-08-10')` would keep meaning "2026" forever
  once `SEASON` advances, with nothing forcing anyone to update it. Fixed
  by moving the cutoff into a `TRAINING_CAMP_START_BY_SEASON` map keyed by
  `SEASON`, with a `signalFloorForSeason()` accessor that throws loudly if
  a season has no entry -- rather than silently reusing 2026's date. This
  is a code-structure fix only; Andy's underlying product decision (Aug 10
  as the boundary, no floor on `user_picks`) is unchanged.

**Nothing committed/staged/pushed this session.** Only
`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v7_2026-09-10.md` (new)
and `HANDOFF_PROMPT.md` (updated) touched this round -- still proposal-only,
no pipeline code written.

**Next session:** awaiting Codex's review of v7. If clean, next steps
unchanged: authorize + apply the `nfl_trench_ratings` surrogate-key
migration, then begin the actual dialect migration per the now-finalized
sequencing.


## Historical: Codex Round 9 -- Query Dialect Migration Proposal v6, superseded above (2026-09-10)

**Session updated 2026-09-10 ~1400 UTC.**
Full detail docs:
- **Proposal (authoritative):** [`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v6_2026-09-10.md`](file:///E:/dev/projects/NFL_Dashboard/docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v6_2026-09-10.md) (v1-v5 in the same directory, superseded, kept for review trail)
- **Resume/review prompt:** [`HANDOFF_PROMPT.md`](file:///E:/dev/projects/NFL_Dashboard/HANDOFF_PROMPT.md)

### Claude Summary (Query Dialect Migration Proposal, Round 9 -> v6)

Codex reviewed v5 and returned: gate-report fix (round 2) **approved** --
nothing further needed there. Migration proposal itself: **changes
requested**, 1 P1, 2 P2, 1 P3 note.

- **P1 -- a third order-dependency failure mode, missed by v5's own
  per-site audit:** `agents/signal-normalize.js`'s `gatherItems()` article
  lane exhaustively paginates `research_intel_notes` newest-first today,
  and its final `items.slice(0, LIMIT)` depends on that order -- not a
  keyed first/last-wins reduction (v5's Finding 2 category), but a
  straight ordered-list truncation. Under the migration's PK-ascending
  `fetchAllRows()`, `--limit` would silently keep the *oldest* N articles
  instead of the newest. v6 adds a third audit category ("ordered-list
  consumption") alongside "keyed reduction" and "no dependency": any
  exhaustively-read result that's later sliced/truncated must be
  explicitly re-sorted by the business ordering field right after the
  read, never assumed from fetch order.
- **P2 -- the comparison-based reducers needed complete tie/null rules,**
  not just "compare instead of trust order": v6 specifies parsed-epoch
  comparison (not raw string `>`), a null-never-wins rule, and a real
  primary-key secondary tiebreaker per table. Notably, Codex caught that
  `player_injuries`' `espn_player_id` can't break ties the way v5 assumed
  -- it's the per-player *grouping* key, not a tiebreaker between two
  reports for the same player. Verified the table's actual schema and
  switched to its bigserial `id` column (insertion-ordered) instead.
- **P2 -- `fetchPickSignals()`/`fetchUserPicks()`'s top-N classification
  was never actually verified,** since 1,000 is coincidentally also the
  PostgREST page cap -- Codex was right that nothing proved it was a real
  product decision. Investigated live against the production tables this
  round (Andy in the loop on the product call): `research_pick_signals`
  (975 rows) has genuine off-season non-NFL noise -- verified live sample
  included NBA playoff picks, MLB best-bets, and a casino promo article,
  all swept in by the RSS ingest with no sport-relevance filter on the raw
  insert path (the filter that exists only runs downstream in
  `signal-normalize.js`'s normalized output). `user_picks` (38 rows) is
  small and clean -- legitimate podcast-sourced expert picks, nowhere near
  the 1,000-row cap. **Andy's decision:** `research_pick_signals` moves to
  an exhaustive read filtered to `captured_at >= 2026-08-10` (training-camp
  start -- also exactly where the live noise window ends, 175 of 975 rows);
  `user_picks` moves to a fully exhaustive read with no date floor at all
  (a floor would only discard 26 of 38 legitimate rows for no benefit).
  Both leave the `fetchTopRows()` shape entirely; that shape reverts to
  just the two `podcast_transcripts` sites carried from v3/v4.
- **P3 (informational) -- two row-count claims in v5's own Finding 2 table
  were misattributed:** `game_splits_history` is 48 rows live, not
  "100k+" -- that figure belongs to `game_odds_snapshots` (189,367 rows,
  season 2026). Fix unchanged (still needs real pagination), only the
  urgency framing corrected -- it's a latent risk, not a live truncation,
  at today's row count.

**Nothing committed/staged/pushed this session.** Only
`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v6_2026-09-10.md` (new)
and `HANDOFF_PROMPT.md` (updated) touched this round -- still proposal-only,
no pipeline code written.

**Next session:** awaiting Codex's review of v6. If clean, next steps
unchanged from v5: authorize + apply the `nfl_trench_ratings` surrogate-key
migration, then begin the actual dialect migration per the now-finalized
sequencing (reduction-function conversions and the new ordered-list-sort
fix first as hard preconditions, then the roster week-discovery fix, then
the pagination helpers, then the call-site rewrites including the two
newly-resolved `research_pick_signals`/`user_picks` sites, then the ESLint
rule).


## Historical: Codex Round 9 -- Query Dialect Migration Proposal v5, superseded above (2026-09-10)

**Session updated 2026-09-10 ~0900 UTC.**
Full detail docs:
- **Proposal (authoritative):** [`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v5_2026-09-10.md`](file:///E:/dev/projects/NFL_Dashboard/docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v5_2026-09-10.md) (v1-v4 in the same directory, superseded, kept for review trail)
- **Gate-report fix, round 2:** [`handoffs/2026-09-10-0700-claude-gate-error-aggregation-fix-handoff.md`](file:///E:/dev/projects/NFL_Dashboard/handoffs/2026-09-10-0700-claude-gate-error-aggregation-fix-handoff.md) (see 2026-09-10 addendum)
- **Resume/review prompt:** [`HANDOFF_PROMPT.md`](file:///E:/dev/projects/NFL_Dashboard/HANDOFF_PROMPT.md)

### Claude Summary (Query Dialect Migration Proposal, Round 9 -> v5)

Codex's round-9 review of `agents/portfolio-preflight.js`'s AST scanner found
the pattern-matching approach had hit a structural ceiling (builder mutation
via reassignment, terminal-method override, name-only helper trust) and
recommended replacing it with a restricted "query dialect" (a small, fixed
set of provably-safe query shapes) enforced by a custom ESLint rule instead
of a runtime scanner. Scoped the migration and took four successive proposal
drafts (v1 -> v5) through four full rounds of Codex review, verifying every
finding directly against the schema/code before accepting it:

- **v1 -> v2:** dropped a concurrency-unsafe offset-pagination helper;
  closed a callback-based filter hole (filters are now pure declarative data).
- **v2 -> v3:** fixed a factually-wrong cursor-key assumption for
  `nfl_trench_ratings` (it has no surrogate key -- recommended a separately
  authorized additive migration instead); removed caller-controllable
  page-size params that could reproduce silent truncation; found the
  proposal's own preflight-file exemption was hiding 7 real call sites,
  including a live bug (`:831` roster week-discovery, structurally can't
  detect a second week once real volume exists).
- **v3 -> v4:** retargeted `podcast_episodes` from a fixed-set helper to
  exhaustive pagination (its corpus grows) -- and in verifying that finding,
  found and fixed (Andy authorized) an independent, real bug: the gate's
  `safe_to_run_paid_synthesis` JSON field ignored thrown-check `ERROR`
  status entirely, only checking `BLOCK` count. Also introduced a new
  `fetchTopRows()` shape after catching that two "newest 300" reads were
  about to be silently converted to full scans.
- **v4 -> v5 (current):** two P1s. (1) Last round's gate fix was itself
  incomplete -- it only patched the JSON output; the human-readable CLI
  report and the exit code still ignored errors. Fixed properly this round:
  a single `buildDisposition()` function now drives the JSON field, the
  printed headline, and the exit code, so they can't diverge again -- 4 new
  tests assert on the actual rendered text, not just a boolean. (2) A
  bigger, previously-unidentified design gap: `fetchAllRows()` only
  guarantees every row gets visited, not delivery order -- several dossier
  functions (`latestByTeam()` and three inline dedup loops for injuries,
  opening odds, and betting splits) rely on rows already arriving pre-sorted
  to make their first/last-wins deduplication correct. Migrating them
  naively would silently return the wrong row per team/player/game. v5
  requires converting these to explicit comparison-based reductions (keep
  the row with the better timestamp, not the first/last one seen) as a hard
  precondition before their read sites can be migrated. Also closed 4 P2s
  (top-N determinism + cap-drift detection, an unbounded-IN-list request
  problem, an unsafe generic filter-negation flag replaced with a narrow
  `notLike`, and a too-broad ESLint exemption) plus a lower-priority
  JS-vs-Postgres cursor-comparison bug. Awaiting Codex's review of v5.

**Still unstarted, pending Codex's eventual approval:** the migration's
actual implementation -- rewriting the ~24 pipeline read call sites + 7
preflight literal-table sites to the six approved shapes, the
order-dependent reduction-function conversions v5 requires, building the
real ESLint rule with full `RuleTester` coverage, and the separately
authorized `nfl_trench_ratings` surrogate-key schema migration. Every
version (v1-v5) has been explicit that this is proposal-only.

**Newly flagged this round, not yet fixed (out of scope for this
proposal):** `signal-normalize.js:345-346`'s `user_picks` read has no
`ORDER BY` at all before its `.limit(1000)` -- an arbitrary, nondeterministic
slice feeding expert-pick signal extraction. Same bug family as the
`:831` roster week-discovery bug and `fetchGameSplitsLatest()`'s missing
pagination (also newly found this round). Tracked in v5's Finding 2
section; needs its own separately-scoped fix when the migration reaches it.

**Nothing committed/staged/pushed this session.** Touched this session:
`agents/portfolio-preflight.js`, `tests/unit/portfolioPreflightScanner.test.js`,
`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v5_2026-09-10.md` (new),
`handoffs/2026-09-10-0700-claude-gate-error-aggregation-fix-handoff.md`
(addendum appended), `HANDOFF_PROMPT.md`.

**Verified this session:** `node --check` clean, `eslint` clean, `git diff
--check` clean, scoped scanner/gate suite 61/61 (was 53/53 at round-9's
start). Full 95-file/1,413-test suite not re-run from this device-bridge
shell (same ~3-minute per-command cap as prior rounds) -- relying on
Codex's own independently-run full-suite result. Live preflight, both
JSON and human-readable modes, plus the actual process exit code (captured
directly, not through a pipe), all confirmed to agree:
`{block:6, warn:5, error:0, pass:23}`, `safe_to_run_paid_synthesis: false`,
exit code `1`.

**Next session:** awaiting Codex's review of v5. If it comes back clean
(or once whatever it finds is resolved), next steps are: authorize and
apply the `nfl_trench_ratings` surrogate-key migration, then begin the
actual dialect migration per v5's revised sequencing (reduction-function
conversions first, then the pagination helpers, then the call-site
rewrites, then the ESLint rule). If clean, the standing next-up item
beneath that is unchanged from prior rounds: Section 5's
source-weighting/interpretive-framing prompt guidance for
`vault_analytical_reads`/`training_camp_intel`/`master_reports` in the
portfolio-synthesis pipeline spec doc.

## Historical: Antigravity Master Packet Overhaul & Kickoff Game Grading / Claude Round-8 Scanner Fixes, superseded above (2026-09-10)

**Session updated 2026-09-10 ~0500 UTC.**
Full detail docs:
- **Antigravity (Ingestion/Dossier/Distribution):** [`handoffs/2026-09-10-0500-antigravity-master-packet-and-kickoff-grading-handoff.md`](file:///E:/dev/projects/NFL_Dashboard/handoffs/2026-09-10-0500-antigravity-master-packet-and-kickoff-grading-handoff.md)
- **Claude (Portfolio Preflight Scanner Fixes):** [`handoffs/2026-09-10-0257-claude-p2-scanner-round8-fix-handoff.md`](file:///E:/dev/projects/NFL_Dashboard/handoffs/2026-09-10-0257-claude-p2-scanner-round8-fix-handoff.md)

### Antigravity Summary (Week 1 Master Intelligence Packet & Kickoff Grading)
1. **Executive Master Board Overhaul:** Replaced mixed-information rows with a granular 27-selection architecture (`All`: 27, `Sides & Spreads`: 14, `Totals`: 7, `Teasers`: 3, `Player Props`: 7, `SGPs & Parlays`: 4). Zero reload client-side filtering with pure single-wager rows (Totals tab shows 100% pure Over/Under lines with 0 spreads).
2. **Kickoff Game Graded Final:** Seattle 13, New England 10. NE +3.5 covered outright (WIN); Seattle -3.5 lost; Under 44.5 cashed with ease (WIN); Seattle TT Under 24.5 cashed (WIN); Platinum Rose AI model edge (+3.9 on NE +3.5) cashed cleanly; model SGPs settled in ledger (`data/official-picks/platinum-rose-ai-2026.json`).
3. **Sub-Page Functionality & Deep Link Mesh:** Podcasts and Articles hubs equipped with dual-axis filtering (Show/Source & Expert/Author); all 13 solo articles have collapsible accordions with Expand/Collapse All; Section 4 in both Master Board and SuperContest equipped with deep links to source podcasts and articles (1,460 internal links verified, 0 broken).
4. **Layout & Display Standardized:** Viewport and content widths locked to 1200px container with `-webkit-text-size-adjust: 100% !important`, resolving the 75% zoom bug.
5. **Distribution Packet:** `dist/nfl_week1_master_packet.zip` (4.40 MB) reassembled and verified 100% offline self-contained for offsite testing.
6. **Test Suite:** 95/95 test files passed, 1,409/1,409 unit tests passed.

### Claude Summary (Scanner Hardening)
Codex's round-8 review confirmed all 4 round-7 findings fixed as
described, then returned 3 new P2 findings + 1 P3, all still against the
same handful of scanner functions: (1) `propertyKeyName()` never checked
`property.computed`, so a computed relation-scope key (`{ [key]:
'comments' }`) silently bypassed `isForeignTableScoped()`'s fail-closed
check entirely; (2) `chainHasHeadTrueOption()` ignored real JS
last-write-wins semantics *within* one object literal -- a duplicate
`head` key or a trailing spread could still spoof count-only status; (3)
the `SCANNED_SOURCES` loop's catch-all swallowed permission errors and
scanner exceptions the same as a genuinely-absent file, letting a source
vanish from the gate with no BLOCK; (4) a trailing blank line failed
`git diff --check`. All 4 fixed. `propertyKeyName()` corrected at its
source (shared by the `applyFilters`-wrapper check too, strictly more
conservative there as well); `resolvesToHeadTrue()` added (order-aware
last-write-wins walk); `shouldSkipScanError()` extracted (exported,
directly testable, true only for real `ENOENT`). 12 new tests added
(41 -> 53, all passing). Full detail and every fix's rationale in the
handoff doc above.

**Andy asked directly, before authorizing this round, whether this was
legitimate hardening or chasing our tail** -- answered and standing: each
round has found a genuinely different, real fail-open in the same small
set of functions, not a repeat. Also flagged as an open scope question:
this scanner's attack surface (arbitrary JS object construction --
computed keys, duplicate keys, spreads, nested spreads, getters, proxies)
is open-ended for static analysis; no round closes the category, only the
specific construct found. Andy chose to continue into round 9 with that
understood. Worth revisiting an explicit stopping rule if round 9+ keeps
surfacing new constructs rather than converging.

**Not re-run this round:** same no-network constraint as round 7 -- the
full 95-file/1,397-test suite and the live Supabase-backed preflight run
were not re-executed from this device-bridge shell. Per the established
review protocol, both should be re-confirmed on Codex's round-9 pass.

**Nothing committed/staged/pushed this session.** Only
`agents/portfolio-preflight.js` and `tests/unit/portfolioPreflightScanner.test.js`
were touched.

**Next session**: awaiting Codex round-9 review of this fix. If round-9
comes back clean, the standing next-up item beneath it is unchanged from
round-6/7/8: Section 5's source-weighting/interpretive-framing prompt
guidance for `vault_analytical_reads`/`training_camp_intel`/`master_reports`
in the portfolio-synthesis pipeline spec doc.

## Historical: Codex round-7 P2 fix, superseded above (2026-09-10)

**Session closed 2026-09-10 ~0154 UTC.** Full detail:
`handoffs/2026-09-10-0154-claude-p2-scanner-round7-fix-handoff.md`.

Summary: Codex's round-7 independent review of `agents/portfolio-preflight.js`
returned 4 new P2 findings (all "changes requested"), all against the
row-cap scanner: (1) `isForeignTableScoped()` missed the preferred
`referencedTable` option name and didn't fail closed on a dynamic/spread
options argument, (2) `chainHasHeadTrueOption()` read `head: true` off any
argument to `.select()` instead of the actual options slot at
`arguments[1]`, (3) the parse-failure fallback could silently contribute
zero sites (and no BLOCK) for `sb.from(tableVar)` or `sb['from'](...)`, and
(4) the `A:rowcap` gate's aggregation logic (unresolved-table / failed-
rowCount branches) had zero test coverage. All 4 fixed; classification
logic extracted into an exported, directly-testable `classifyRowcapSites()`.
9 new tests added (32 -> 41, all passing).

## Historical: Codex-review triage + 3-way reconciliation + BKR/BetUS ingest closeout, superseded above (2026-09-08)

**Session closed 2026-09-08 21:04 UTC.** Full detail:
`handoffs/2026-09-08-2104-claude-session-close-handoff.md` (read this
first, it links everything else this session produced).

Summary: Codex independently reviewed the futures-portfolio pipeline
(`docs/CODEX_REVIEW_FUTURES_PORTFOLIO_PIPELINE_2026-09-08.md`) and returned
6 findings. Claude fixed 5 and corrected the 6th's denominator rather than
just flipping its threshold; Antigravity and Codex each independently
verified the fixes against live code (three handoffs dated 2026-09-08 in
`handoffs/`, all in agreement, nothing reverted). Andy then had Claude
ingest fresh BKR/BetUS futures odds
(`docs/Futures_Odds/BKR_Odds_0908`/`BetUS_Odds_0908` → parsed via
`scripts/parse-futures-text.js` → written via `scripts/ingest_futures_json.py`,
736 rows total). All of this is now folded into
`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md` and
the spec doc above, both updated in place.

**New team structure**: Antigravity now owns podcast+article ingestion
(already active — see `handoffs/2026-09-08-1405-antigravity-batch1-
exhaustion-handoff.md`, master-report corpus grew 79→83). Claude implements
portfolio-synthesis pipeline changes; Codex reviews/approves before
anything ships.

**Live state at close**: `main` 1 commit ahead of `origin/main` at `0fc6112`
(Codex's own commit, stuck on their invalid GitHub token, not a conflict).
Preflight: `3 BLOCK / 8 WARN / 22 PASS`, `safe_to_run_paid_synthesis: false`
— remaining blockers are `caesars`/`circa` odds gaps (bookmaker/betus now
fresh) and two stale intel files (player-availability, prediction-markets),
none of them code defects, none touched this session.

**Nothing committed/staged/pushed by Claude this session.** Two Supabase
writes occurred (the BKR/BetUS odds upserts above), both dry-run verified
first and explicitly authorized by Andy per-write.

**Next session**: pick up portfolio-synthesis pipeline implementation
(Claude) with Codex reviewing. Top open item per the spec doc's own
ranking: Section 5's source-weighting/interpretive-framing prompt guidance
for `vault_analytical_reads`/`training_camp_intel`/`master_reports`.

## Historical: fantasy-football session closeout, superseded above (2026-09-05 through 2026-09-08)

**Codex reconciliation note, 2026-09-08:** `HANDOFF_PROMPT.md` and
`WORKING-CONTEXT.md` have been refreshed for the next session's review of Claude
team's active portfolio-synthesis pipeline work. Live Git now shows `main`
aligned with `origin/main` at `d3d4b9e`; current dirty review targets are
`agents/portfolio-preflight.js` and `agents/portfolio-synthesize.js`. The
`board-validate.js` loose end below appears superseded in live code:
`agents/lib/board-validate.js` is clean and contains the `quotedComboFor()`
non-wins-market fix. Verify before relying on it, but do not start by blindly
committing/restoring that file.

This session (2026-09-05 through 2026-09-08) was entirely fantasy-football work
across The League and Honey Badgers. **The next session should pivot back to
the Futures/betting-portfolio pipeline** — see the loose end flagged at the
bottom of this entry before starting anything new there.

**What got done this session:**
1. Confirmed The League's pre-existing 2026 custom rankings/keeper files were
   current (`docs/fantasy/2026_The_League_Custom_Rankings.csv`,
   `..._Overall_Board_Detail.csv`, `THE_LEAGUE_2026_MASTER_KEEPER_REPORT.md`,
   `data/fantasy/the_league_declared_keepers_2026.json` — 11/12 teams locked).
2. Built `docs/fantasy/2026_The_League_Draft_Dossier_And_Turn_Playbook.html` —
   a pre-draft turn-by-turn playbook for Andy's slot-12 double-turn (1.12/2.01),
   simulated precisely from the ranked board + keeper file. **Note: this
   dossier's live-pick-numbering model (187 total live picks, assuming keeper
   rounds are skipped entirely) turned out not to match how the real draft
   software behaves** — see point 4 below. Superseded now that the real draft
   is done; keep only for historical reference if a similar dossier is ever
   built for another league.
3. Found and reported (not yet fixed) a real bug in
   `2026_The_League_Custom_Rankings.csv`: IDP players are wildly oversized
   (130 of 260 rows / 50% of the board) versus the Honey Badgers source board
   it was rescored from (40 of 260 / 15%) and versus what the real draft
   actually needed (see point 4: only ~35 IDP picks happened in the real
   17-round draft). Root cause suspected: the IDP replacement-level cutoff
   (132.9 pts) is too generous and let nearly every rosterable NFL LB/DB/DL
   clear it, unlike Honey Badgers' round-paced/quota-limited approach.
   **Not fixed yet** — a CBS Top-200 PPR cross-check was requested to help
   validate outliers before fixing, but stalled on a WebFetch
   `PROVENANCE_REQUIRED` approval error against cbssports.com that was never
   resolved. If picking this back up: either get the CBS list via an approved
   fetch/pasted text, or just apply the same round-pacing/quota curation
   Honey Badgers used directly.
4. **The League's 2026 draft happened and is fully ingested.** Andy pasted the
   full 17-round results as text; parsed into
   `data/fantasy/the_league_final_rosters_2026.csv` (204 rows, 12 teams × 17
   picks — schema matches the existing `league_id,team_id,team_name,
   player_name,nfl_team,position` convention). All 11 declared keepers
   cross-checked clean against the real results (right team, right round,
   right player). **Real-mechanic correction**: the draft platform auto-fills
   a team's keeper into their turn rather than skipping that turn entirely —
   so the real draft has the full 12×17=204 picks, not the 187 "live-only"
   picks the pre-draft dossier (point 2) modeled. Worth remembering for any
   future league draft-day tooling. Also flagged to Andy: his own team (Fat
   Lazy Americans) drafted zero kickers across all 17 rounds — K slot needs a
   waiver add.
5. **2026 final-roster status across all 4 leagues** (tracked in Cowork
   project memory `nfl_dashboard_final_roster_compilation.md`): Honey Badgers
   ✅ done, Rose Bowl ✅ done, The League ✅ done (this session), RFI
   Invitational still open — no 2026 keeper/draft-board/roster file exists for
   it yet. Andy's team there **is** "Fat Lazy Americans" (team_id 5 in the
   2025 file) — a wrong claim that it was "Tremendous Slouch" (a different
   team, team_id 1) was corrected 2026-09-08; Andy's team name is always
   "Fat Lazy Americans" in every league, full stop. Confirm RFI's 2026 draft
   status with Andy before doing any work on it.

**None of this session's file changes have been committed to git** — new/
changed files are `docs/fantasy/2026_The_League_Draft_Dossier_And_Turn_
Playbook.html` (untracked) and `data/fantasy/the_league_final_rosters_2026.csv`
(untracked), on top of the pre-existing dirty worktree below. Standing
guardrail unchanged: no `git add -A`/commit/push without Andy's explicit
approval, scoped `git add <files>` only when approved.

**Futures/portfolio loose end to pick up first, before anything new**: per
`nfl_dashboard_project.md`, a real bug fix in `agents/lib/board-validate.js`
(`quotedComboFor()` false-positived `no_matching_quote` on every non-wins-
market candidate — superbowl/conference/division/playoffs picks) was drafted,
verified three ways, and confirmed working in a mocked dry-run pipeline run on
2026-09-03, but **was never committed** — single-file change, awaiting Andy's
commit/push approval. Check whether that fix is still sitting uncommitted in
the worktree before doing any new futures-pipeline work; if so, get Andy's
approval to land it (or confirm someone else already did) before building on
top of it.

Standing constraints (unchanged): preserve dirty worktrees; no cleanup/reset/
stash/broad stage; no paid committee synthesis; no Supabase writes without
per-write authorization; no betting picks, official-pick promotions, or
portfolio mutations; no Yahoo Fantasy work without explicit approval.


## Historical: 2026-09-05 commit/push/M6 sync closeout (superseded above)

Resume in `E:\dev\projects\NFL_Dashboard`. Start with timestamped handoff
`handoffs/2026-09-05-1255-codex-commit-push-m6-sync-handoff.md`.

Live state verified by Codex on 2026-09-05:

- Local `main`, `origin/main`, and M6 `~/projects/NFL_Dashboard` were synced
  through work-stack commit
  `53c3967 chore: commit remaining approved dashboard artifacts`; this handoff
  closeout is a state-only commit on top.
- The 2026-09-04/05 commit stack is pushed: Tier 4 futures fixes, Antigravity
  final roster + Survivor Alpha work, master report guard, Survivor app wiring,
  intel hardening, The League custom rankings, Twitter harvester/vault sync
  agents, public schedule odds snapshot, and the remaining approved artifacts.
- M6 was fast-forwarded from `ee0931b` to `53c3967` after a fetch/overlap check.
  Its existing local dirty files were preserved: one modified active official
  pick proposal and untracked non-test Gmail summaries.
- Local Windows worktree intentionally remains dirty only for excluded items:
  `vite.config.js`, `.nfl/gmail-summaries/*test*`, sensitive Yahoo files, and
  scratch/tmp/probe piles.
- Handoff closeout updated `.atlas-bridge/memory.json`, `.nfl/session-log.jsonl`,
  this `HANDOFF.md`, and the timestamped handoff file.

Immediate next action: begin from live Git/status, then choose a single next
lane with Andy. Sensible candidates are portfolio-pipeline stabilization,
article-evidence/Bookmaker-BetUS capture integrity, or NFL Writers Room
adoption/config.

Standing constraints: preserve dirty worktrees; no cleanup/reset/stash/broad
stage; no paid committee synthesis; no live `agents/signal-normalize.js --source
pick_signal`; no Supabase writes; no betting picks, official-pick promotions, or
portfolio mutations; no Yahoo Fantasy work without explicit approval.


## Historical S243 Context (stale, retained for provenance)

Awaiting Codex Sign-Off: Alpha Testing Suite & Preseason Week 3 Sandbox Spec.
This section is superseded by the final-roster reconciliation pickup above
unless a future session explicitly resumes Alpha work.

Resume in `E:\dev\projects\NFL_Dashboard`.

Start with:

```powershell
git status --short --branch
git log -n 5 --oneline --decorate
npm run lint
npx vitest run
```

> **Test Suite Note:** `npm run lint` passes (0 errors, 8 warnings). `npx vitest run` executes 77 test files total, 72 passed / 5 failed (1,130 tests total: 1,122 passed / 8 failed) across 5 pre-existing/environment files (`predictionMarketEvidenceCleanup`, `preseasonBankrollTest`, `seasonHardcode`, `sportsRelevanceFilter`, `twitterBookmarksAgent`). `appTabRouting.test.js` is 100% green (20/20 passed).

> **Stale-inventory resolution (Claude, 2026-08-28):** Codex correctly flagged that the "Uncommitted Changes" list below no longer matches live Git. This file is dated 2026-08-26T20:52:00Z, before the most recent commit (`9fe8249`) and before all Alpha-spec work since. Verified directly: `src/App.jsx`, `src/components/layout/Header.jsx`, `src/lib/profiles.js`, and `tests/unit/appTabRouting.test.js` are **clean** in live Git (last touched in the older commit `958f499`, not currently dirty). `public/league_keeper_master_2026.json`, `src/components/injuries/InjuryCenter.jsx`, and `src/lib/injuries.js` **are** dirty live but are missing from the list below. The two `handoffs/*.md` entries below are stale too -- both are `git status`-confirmed **deleted** from their original path, with matching copies already in `handoffs/archive/`. HEAD itself is not in question -- `main` genuinely is `9fe8249`, matching `origin/main`. **Resolution: live `git status --short --branch` supersedes the list below -- use it as the source of truth, not this stale snapshot.** Codex, proceed with Phase 1 using live Git state. Do not touch `public/league_keeper_master_2026.json`, `InjuryCenter.jsx`, or `src/lib/injuries.js` -- they're pre-existing dirty work unrelated to the approved Phase 1 file list. Please re-run `hooks/scripts/build-handoff.js` at session close so this list is fresh for whoever picks up next.

Then read:

```text
HANDOFF.md
docs/specs/ALPHA_TESTING_SPEC.md
docs/fantasy/MASTER_BETTING_INTELLIGENCE_PACKET_2026.md
data/podcasts/actionable_betting_recommendations_2026.json
```

---


## 1. Accomplishments & Verification Summary (Session S243)

1. **100% Uncapped Podcast & Media Extractions (All 56 Master Reports Complete)**:
   - Extracted 100% exhaustive master reports across all 8 NFL divisions and 6 national podcast episodes (`even_money`, `bettingpros`, `sharp_or_square`, `favorites`).
   - Squeezed all speaker turns, rationale, odds, and timecoded quotes without artificial bullet ceilings.

2. **Master Actionable Betting Intelligence Suite (209 Recommendations)**:
   - Generated structured JSON dataset at [`data/podcasts/actionable_betting_recommendations_2026.json`](file:///E:/dev/projects/NFL_Dashboard/data/podcasts/actionable_betting_recommendations_2026.json).
   - Generated human-readable newsletter & user data packet at [`docs/fantasy/MASTER_BETTING_INTELLIGENCE_PACKET_2026.md`](file:///E:/dev/projects/NFL_Dashboard/docs/fantasy/MASTER_BETTING_INTELLIGENCE_PACKET_2026.md).

3. **Automated Live Sharp Vegas Odds Scraper**:
   - Implemented [`agents/vegas-web-odds-ingest.js`](file:///E:/dev/projects/NFL_Dashboard/agents/vegas-web-odds-ingest.js) and [`agents/lib/live-market-fallback.js`](file:///E:/dev/projects/NFL_Dashboard/agents/lib/live-market-fallback.js) supporting Circa Sports & STN Sports (Station Casinos).

4. **Injuries & Availability Intelligence Pipeline Integration**:
   - Resolved off-season empty state by connecting Dr. David Chao / PFF / Rotowire medical intelligence into [`src/lib/expertInjuries.js`](file:///E:/dev/projects/NFL_Dashboard/src/lib/expertInjuries.js) and [`src/lib/injuries.js`](file:///E:/dev/projects/NFL_Dashboard/src/lib/injuries.js).
   - Added medical recovery prognoses, betting impact warnings, and source attribution badges on [`src/components/injuries/InjuryCenter.jsx`](file:///E:/dev/projects/NFL_Dashboard/src/components/injuries/InjuryCenter.jsx).

5. **Formal Alpha Testing Specification (Addressing Codex Audit)**:
   - Alpha UI residue reverted; uncommitted S243 market/injury files preserved.
   - Drafted formal in-repo engineering specification [`docs/specs/ALPHA_TESTING_SPEC.md`](file:///E:/dev/projects/NFL_Dashboard/docs/specs/ALPHA_TESTING_SPEC.md) addressing storage conformance (`storage.js`), exact-5 contest validation, fresh deadline evaluation, real scoring engine, AI rate limiting, and error-checked telemetry.

1. **AFC North 2nd-Pass Intelligence Extraction**:
   - Run 2nd-pass extraction on raw diarized transcript JSON for the AFC North division preview (following NFC North S241 verification), then complete remaining division previews prior to production email dispatch.

2. **RFI Invitational Draft Order Simulation**:
   - As soon as RFI 2026 draft order drops, plug slot position into `docs/fantasy/LEAGUE_DRAFT_ORDERS_2026.json` and model Round 1 & 2 draft room availability.

3. **Track Incoming Opponent Keepers**:
   - Log declared keepers from opponent managers in *Honey Badgers*, *The League*, and *RFI* to refine available draft room pools.

4. **Email Digest Pipeline Dispatch**:
   - Run final dry-run verification of `agents/send-biweekly-digest.js` before any production email dispatch.


## Uncommitted Changes

These are intentionally preserved and excluded from the closeout commit.

### Modified
- scratch/article_nfl_preseason_week_2_results_seahawks_ti_master_100percent_exhaustive.md
- scratch/article_nfl_preseason_week_3_best_bets_master_100percent_exhaustive.md
- scratch/article_nfl_preseason_week_3_starting_quarterbac_master_100percent_exhaustive.md
- vite.config.js

### Untracked
- .nfl/gmail-summaries/*test*
- docs/Yahoo_API_keys
- docs/Fantasy Sports API access is now live.eml
- root scratch/probe files (`_audit_*`, `_pf_*`, `_t1_*`, `audit*_tmp.mjs`, etc.)
- scratch/ large research/tmp pile
- scripts/_tmp* and scripts_tmp_check_transcript.mjs

## In Progress
_No In Progress tasks._

## Last Session Summary
- **Duration:** unknown

---
_Resume by reading CLAUDE.md → this file → TASK_BOARD.md_
