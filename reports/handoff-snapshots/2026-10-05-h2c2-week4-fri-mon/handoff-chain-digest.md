> **About this file.** A subagent read the 26 handoff docs in the window (plus `HANDOFF.md` and the four Week 4 bet reports) on Mon 10/05 ~12:45 PT and wrote this digest, changing nothing. It is a faithful summary of what those docs *say*. Where the H2C2 briefing (`handoffs/2026-10-05-1300-claude-h2c2-team2-briefing-week4-fri-mon.md`) differs, **the briefing wins**. Known corrections:
> - `scripts/master-intel/build_site.py` is **not** dirty. Andy's nav work was committed in `10138d5` (10/04 ~23:00 PT), and the file matches HEAD.
> - All commits through `6887ca8` are pushed; `origin/main` = `6887ca8`. The "`8949848` not pushed" note is obsolete.
> - Phone tracker artifact URL: https://claude.ai/artifact/R4qQo7h1ds6hjyXmkvZr22.
> - §4 item 4 / §7 item 20: the Bills free wager Andy described as "JAX +7" is **NE +7 BetOnline #1002306890** ($10 at −115, +$8.70). Andy confirmed this on 10/05, and it is now recorded as a free bet. The second Bills credit is unused and goes on BUF@LAR.
> - §7 item 19: the 24 real tickets are itemised in `week4-ticket-ledger.md`. That file reconciles the 13 tickets from 10/04 10:54 with the later afternoon and SNF placements.
> - Jay's Lock Box is recorded as SETTLED / loss with $0 cash in the ledger. Book, odds and ticket # are still unknown.

# NFL_Dashboard ("Platinum Rose") cross-team handoff digest, Fri 10/02 to Mon 10/05/2026 (PT)

I read all 30 files in full and changed nothing. Everything below comes from those files. Where a document is ambiguous, or two documents disagree, I say so instead of guessing.

---

## 1. Timeline, Fri 10/02 → Mon 10/05 (PT)

- **10/02 13:25, Codex**, `2026-10-02-1325-codex-week4-bkr-sgp-live-capture.md`
  - Did a read-only rendered capture of all 15 open Week 4 Bookmaker (BKR) SGP pages. PIT@CLE was left out because it was final.
  - Raw file: `data/generated/props/bookmaker-live-2026-10-02-week4.raw.txt` (192,695 bytes). Main-line snapshot: `data/odds/BKR_current_lines_1002_1320`.
  - Parser output: 15 games, `unknown=0`, but **MIA@MIN `unparsed=24`** (1st/2nd-quarter rows rendered without odds).
  - Whole-menu "no odds" problems: NYJ@CHI (432/468 rows unavailable) and DET@CAR (391/427). ATL@NO had only 36 rows.
  - Roster vet: 0 BLOCK, 13 non-blocking BKR name mismatches. No names were corrected from memory.
- **10/02 13:40, Codex**, `…-1340-codex-live-market-capture-session-handoff.md`
  - Pushed through **`cd48156`** ("Capture Week 4 Bookmaker SGP lines"). Committed only the two new tracked artifacts.
  - Parser command and roster gate are recorded (§2).
  - Explicitly incomplete: BKR futures, BEO full lines/futures/Props Builder (only the IND@WAS O/U raw file exists), and prediction markets.
  - Warns not to reuse the JWT-bearing `troya.xyz` URL.
- **10/02 16:40, Claude**, `…-1640-claude-week4-tnf-graded-v2-template-dk-rungs-handoff.md`
  - TNF PIT@CLE graded into the gitignored local wagers ledger. Mason Graham leg marked `injury_exit: true`. Backup: `.bak-claude-20261001-pre-tnf-grade`.
  - Commits:
    - `8107c5d`: Live Tracker legsOut / Burnt+Out / injury bad-beat badge
    - `48cfb6e`: Master Intel template v2, picks first (for review)
    - `4bb4fbd`: roster gate "No Week" phrase
    - `ce11bdd`: narrative-minimum checklist and Week 4 narrative hold
    - `248aa71`: SuperContest W4 lines and report build fix
    - `8712129`: SC dashboard shows the current week only
    - `9698310`: secondary matchups regenerated
    - `f64dbaf`: Andy's BEO W4 prop boards for 14 games
  - Market data parsed:
    - BKR: 6,304 rows
    - BEO: `beo-w04.json`
    - DK Predictions: all 15 games, including DK-highlighted yardage rungs for 289 players (197 matched BKR alt ladders; 10 fringe lines differ by more than 12)
  - Caleb Williams is OUT (from Andy). Podcasts are blocked: Gemini returns 402 and OpenAI is out of credits.
- **10/02 19:05, Claude → Antigravity**, `…-1905-claude-to-antigravity-gemini-billing-investigation.md`
  - Read-only billing investigation brief. 13 Week 4 episodes stuck `pending`.
  - Extraction chain is `gemini-3.6-flash → claude-sonnet-4-5 → gpt-4o`. Lists every Gemini caller and six questions.
- **10/02 19:15, Antigravity**, `…-1915-antigravity-gemini-billing-findings.md`
  - Key ends **`vbGs`**, project `platinum-rose-gmail` (#`563752605285`), AI Studio prepaid, balance $0.00, no auto-reload.
  - First failure: 10/02 14:54:42 UTC, GH run `37023091252`.
  - About $4.62 spent over 30 days. Run-rate is about $1.14/week (about $4.73/month).
  - `ANTHROPIC_API_KEY` is missing from GH secrets, so the Claude fallback is silently skipped.
  - Stale `gemini-2.0-flash` model ids remain in `tweet-ingest.js`, `gmail-intake-agent.js` and `screenshot-watcher.js`.
  - Recommends a $25 top-up, auto-reload ($25 when below $5) and adding the GH secret.
- **10/02 19:50, Claude → Antigravity**, `…-1950-claude-to-antigravity-windows-tasks-restore-checklist.md`
  - Every local task log stopped at 10/01 13:32Z. Gives a 7-step restore checklist.
- **10/02 20:00 (body says 20:15), Antigravity**, `…-2000-antigravity-windows-tasks-restore.md`
  - Root cause: a network blip, then a Windows Update reboot on 10/1 at 1:53 PM PT left **0 tasks registered**.
  - Re-registered 12 tasks in hidden mode on `LAPTOP-1P2J0006` (repo at `8712129`). X cookies are valid.
  - Five manual runs succeeded:
    - research intel: 4 notes / 26 signals
    - bookmarks: 12 ingested
    - Grok: 9 Week 4 threads
    - availability: 1,173 events
    - Live Tracker regenerated
  - Proposes a `pipeline-health-watchdog.yml` and an `@onstartup` trigger.
- **10/02 20:50, Claude**, `…-2050-claude-week4-intel-gather-youtube-queue-futures-handoff.md`
  - HEAD is on top of `47eb968`. Andy's rule: no wagering synthesis until intel is complete.
  - Set 11 `podcast_episodes.youtube_url` rows (Supabase write, Andy-authorized). Video queue file created.
  - "Andy topped up credits."
  - Futures: parsed BKR/BetUS 10/2 boards and BetUS 9/29; hand-transcribed BEO 10/2 (96 rows). Report written.
  - Logged Jay's Lock Box $100 promo.
- **10/02 21:45 (+22:05 and 22:15 follow-up commits), Claude → Claude Team 2 + Codex**, `…-2145-claude-week4-multipage-intel-site-team2-codex-handoff.md`
  - Template v2 **LOCKED** by Andy at 21:15.
  - Commits: `17afa34` (build fixes), `4ea7d0f` (v2 locked, plain header), `8207d26` (multi-page site, `build_site.py`).
  - Site hosted at artifact `E6RSz4VGWJayUWNJG9mRi6`. 29 pages, 0 broken links.
  - 22:05 correction commit **`40cb644`**: Codex BKR parser fix gives 15 games, `unparsed=0`, `unknown=0`.
  - 22:15 snapshot commit (hash not given): per-ticket futures ledger, restored 9/29 boards and the 9/30 handoff, `reports/handoff-snapshots/2026-10-02-week4/`.
  - Separate resume prompts for Team 2 and for Codex.
- **10/02 23:00, Antigravity → Codex/Claude**, `…-2300-antigravity-to-codex-week4-podcast-intel.md`
  - 17 episodes (11 RSS plus 6 standalone YouTube) extracted with `gemini-3.5-flash`: **155 picks, 96 notes**, 39 Obsidian host notes, 100% promoted.
  - Cost $0.5074; about $24.49 left of the $25 top-up.
  - Rebuilt host citations (1,517), 13 expert dossiers and 57 podcast deep dives.
- **10/03 ~00:00, Codex**, `2026-10-03-0000-codex-week4-podcast-bridge-prelim-synthesis-resume.md`
  - `scripts/master-intel/pull.mjs` now carries promoted `podcast_gemini_intel` rows: 17 / 155 / 96, 0 provenance gaps.
  - Pull counts: signals=681, notes=592, expert=86, **splits=16**, podcasts=19. Action Network splits refreshed for 16 games.
  - Team baselines rebuilt.
  - The handoff commit should contain only this file and `pull.mjs` (hash not given).
- **10/03 09:05, Claude**, `…-0905-claude-week4-evidence-readiness.md`
  - HEAD `4970ebd`. Verdict: **NOT evidence-ready**, because the BKR Chrome session was logged out.
  - Wrote ESPN injury, weather, and source-price reconciliation files at 15:59Z. 241 exclusions.
  - Corrections to Codex's preliminary synthesis: IND@WAS is in London, and there are QB changes at WAS, CHI, TB and NYG.
  - Roster gate PASS. The extra `--narratives` run on the handoff itself gave 52 UNKNOWN_NAME, which is a format artifact, not a roster problem.
- **10/03 10:30 (+10:46 update), Claude**, `…-1030-claude-week4-bkr-rendered-capture-normalization.md`
  - New `bookmaker-rendered-text-parse.py`: 14 pages, 9,038 selections (8,373 priced), 808 SGP sections.
  - DET@CAR whole menu unpriced.
  - 10:46 board saved verbatim as `data/odds/BKR_current_lines_1003_1046`.
- **10/03 11:00 (+11:30 update), Claude**, `…-1100-claude-week4-evidence-refresh.md`
  - Andy skipped the BKR props re-capture at 10:47.
  - New injury, weather and reconciliation files at 17:51Z. Price check: 43 same / 14 better / 40 worse.
  - Action Network openers wired into `build.py` (Andy-approved for the whole season). Nothing committed at that point.
- **10/03 12:00, Claude**, `…-1200-claude-week4-evidence-ready-narratives-next-handoff.md`
  - Evidence ready. Andy authorized the narratives phase.
  - Commit "`feat(week4): AN opening-line baseline in build.py + 10/03 evidence refresh`" pushed (hash not given).
- **10/03 12:25, Claude**, `…-1225-claude-week4-narratives-written-card-next-handoff.md`
  - Narratives written for 15 games. Roster gate PASS with `--date 2026-10-03`.
  - New `bkr_live_from_rendered.py` built `bookmaker-live-2026-10-03-week4.json`.
  - `build.py` `src_pat()` linker fix. 15 analyst names added to non-player names. `dist/` restored from the 04:31 copy.
  - The 2030 brief cites the narratives commit as `421db5a`.
- **10/03 13:00, Claude**, `…-1300-claude-week4-expert-verification-best-bets-handoff.md`
  - New `verify_expert_rows.py`: **257 verified / 83 rejected / 79 not picks / 3 re-tagged**.
  - `build.py` counts consensus from verified picks only and adds the "⭐ Every expert's picks this week" block.
  - Every narrative got "What the experts are saying". GB@TB named experts lean TB.
- **10/03 14:15 (+evening addendum), Claude**, `…-1415-claude-week4-fulltext-ingestion-handoff.md`
  - Full-text archive of 604 articles. Abrams primer feed: 169 trends, 32 systems.
  - 118 hand-extracted article picks, 117 verified.
  - Trend and news lanes added. NE@BUF lean flipped to NE +7.
  - Addendum commits: `553e261` (classifier), `e6d6988` (body cap 20k → 200k, pick caps raised), `f57656b` (gated parser on every feed body).
- **10/03 19:45, Claude → UX_EXPERT**, `…-1945-claude-ux-master-intel-dark-redesign-brief.md`
  - Task **F-mi-dark**: dark restyle to match the Dashboard and Live Tracker.
  - Review artifact `Ba1F5icQmPZf96U3N4Bxth`. Lists locked files and must-not-break rules.
- **10/03 20:10, UX_EXPERT**, `…-2010-claude-ux-f-mi-dark-done.md`
  - HEAD **`8949848`**, not pushed. Andy approved token option A, "Tracker slate + teal".
  - 30 pages, 0 broken links, 0 console errors. PDF has 194 pages (light).
  - Review artifact v2. `build_site.py` stays dirty with Andy's nav work.
- **10/03 20:30, Claude → WEEKLY_SYNTHESIS_SESSION**, `…-2030-claude-synthesis-w04-fill-master-intel-brief.md`
  - Brief to fill the empty report: digest, card, TICKETS/SUPERCONTEST blocks, survivor file.
  - HEAD should be `b56fa7d` or later. Cites 371 verified picks.
- **10/03 20:45, WEEKLY_SYNTHESIS_SESSION**, `…-2045-claude-synthesis-w04-card-built-intel-filled-handoff.md`
  - Digest has 31 lean rows. STOP B: Andy said "Go as proposed".
  - Card: **14 tickets, $174.95**, nothing placed.
  - SuperContest five proposed. Survivor file written. Rebuild done. Review artifact v3. PDF exported.
- **10/04 03:00, Claude**, `…-2026-10-04-0300-claude-pickem-w04-podcast-screen-rules-handoff.md`
  - Pick'em committed in **`710a2be`**.
  - New `podcast_gemini_normalize.py` props screen.
  - Andy removed several betting rules (§3). Slot 3 must be rebuilt to the morning template. "No unders in parlays" was never a rule.
- **10/04 ~03:30**: card roster gate `--date 2026-10-04` PASS: 22 player legs, digest 11 (from the card file footer).
- **10/04 10:54, Claude**, `…-2026-10-04-1054-claude-week4-card-tracker-handoff.md`
  - 13 placed tickets logged:
    - BKR `739714646`, `739714534`, `739714258`, `739713560`, `739713279`, `739713278`
    - BEO `1002306890`, `1002306799`, `1002306704`, `1002306303`, `1002304945`, `1002303293`, `1002396982`
  - 11 paper AI records ($110). Card re-priced on Andy's 10/04 BKR board. 2-team RR sections removed.
  - `npm test`: 1,918 total / 15 failed.
  - Commit uses a temp index (hash not given).
- **10/04 ~11:30, report** `reports/bets/2026-w04-afternoon-props.md`: afternoon prop stacks 7b-A ($5, +769), 7b-B ($5, +3597) and 7b-C (+4511, or +7691 with St. Brown), on BEO `_v2` boards. Proposals only.
- **10/04 ~12:45, report** `reports/bets/2026-w04-snf-island.md`: SNF DET@CAR ladder. Tier 1 $10 +787, Tier 2 $5 +2675, Tier 3 $5 +7152. Proposals only.
- **10/05 12:35, Claude**, `…-2026-10-05-1235-claude-week4-closeout-futures-w5-lines-mnf-planner-handoff.md`
  - Week 4 settled: 24 real tickets, $353.51 risk, **−$208.42**. SuperContest 4–1.
  - `reconcile-settlement.mjs` fixed (**`a096758`**).
  - GB SB future moved to the portfolio ledger. 10/05 BKR board saved. MNF prop planner built.
  - Pushed `a096758`, `189f8f7`, `70e0def` plus the handoff commit.

---

## 2. Workstreams: current state

### 2.1 Week 4 betting card and placed tickets
- **Card:** `reports/bets/2026-w04-card.md`. It labels itself proposals only.
  - Built Sat 10/03 at about 20:30 from `scratch/w04-synthesis-digest-sat.md`. Builder and self-check: `scratch/w04-card-build.py`.
  - Re-priced 10/04 on Andy's pasted BKR board (no capture time). BEO prices are from 10/02 and stale.
  - Current contents:
    - Slot 3 Morning: NE +7, NYJ +3.5, GB/TB U38.5, SEA ML, DET ML. +1319; $20 wins $263.83.
    - Slot 4 Afternoon: ARI ML, LAR ML, MIA +9.5, DEN +2.5, DET ML. +1378; $20 wins $275.57.
    - Slot 5 Hybrid: ARI ML, MIA +9.5, NE +7, DEN ML. +1295.
    - Singles: MIA +9.5 $15, GB-TB U38.5 $10, NYJ +3.5 $10.
    - 2-leg ARI+JAX ML $10 (+298).
    - SuperContest A 5-team $15 (+2495).
    - Prop stacks 7a, 7b, 7d, 8b, 7e, 8a.
    - 6-pt Wong teaser JAX/DEN/ATL $10 (+160 est.).
  - Self-check: $155.00 staked (13 tickets plus the teaser; 7e and 8a were added 10/04).
  - Concentration after the RR removal: DEN@SF $65, ARI@NYG $55, MIA@MIN $55.
  - Master RR skipped.
- **Placed tickets:** `data/official-picks/user-placed-wagers-2026.json`, normally gitignored. It was committed on 10/04 because Andy explicitly asked.
  - Latest late ticket `1002396982`: 8-leg prop parlay, $5 to win $735.
  - Slot 3 was booked as `739714258`, with GB/TB Under 40.
  - Some Week 4 prop parlays carry placeholder IDs (`afternoon_*`, `snf_*`).
- **AI paper benchmark:** `data/official-picks/paper-wagers-2026.json` and `reports/bets/2026-w04-ai-recommendations-unbooked.md`.
  - 11 `is_paper: true` records, $110 stake, $5,301.54 potential profit. 46 legs to grade.
  - Accuracy tracking only; never present these as placed bets.
- **Extra proposals:** `reports/bets/2026-w04-afternoon-props.md` and `reports/bets/2026-w04-snf-island.md`. Both are proposals; booking status is not stated.
- **Open:** Andy may still send BEO ticket numbers for the placeholder IDs (10/05 item 5). MNF ATL@NO island tickets were never built as a card section; the 10/05 MNF planner is for Alejandro.

### 2.2 Settlement and ledger
- Week 4 settled except the GB SB future: 24 tickets, $353.51 cash risk, −$208.42.
  - BKR round robins: 8x4 `#739714646` returned $84.47 (−$20.53); 5x2 `#739713279` $29.64 (+$14.64); 6x2 `#739713560` $12.28 (−$17.72).
- `scripts/reconcile-settlement.mjs` (`a096758`):
  - no longer re-grades SETTLED tickets
  - computes RR payouts from leg prices
  - strips Sr/Jr/II suffixes
  - grades `pass_interceptions`
  - 10/10 regression tests pass
- TNF grading was written 10/02 with backup `.bak-claude-20261001-pre-tnf-grade`.
- Jay's Lock Box: `bet_20261002_w04_jays_lockbox_promo_2team` (NE/BUF U48.5 + CIN −2.5, $100) logged as `funding_type: promo_credit`, `exclude_from_bankroll: true`, `needs_confirmation` (odds, payout, book and ticket # unknown). Backup `.bak-claude-20261002-pre-jays-lockbox`. No settlement is stated anywhere.
- After placements, update the recommendation ledger (DEV project `claude/recommendation-ledger-2026.md`) with proposed vs placed (2045). No document confirms this was done.
- Still local only: no Supabase/Bankroll sync of anything.

### 2.3 Live Tracker
- Generator: `node scripts/generate-live-tracker.mjs --week 4`.
  - Outputs: `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html`.
  - Includes the 13 tickets plus 11 paper records. The ESPN scoreboard fetch failed during the 10/04 build.
- Features from `8107c5d`: `legsOut`, Burnt+Out busts a ticket, and the injury bad-beat badge/banner.
- The phone tracker artifact (private page "Platinum Rose Live Tracker", URL not given) was republished with final Week 4 results. Builder: `scripts/build-phone-tracker.mjs`.
- The GB SB future now shows through the futures path.
- Pre-existing test failures: see §7.

### 2.4 Master Intel report, site and template
- **Builder:** `python3 scripts/master-intel/build.py --week 4 --date 2026-10-03`.
  - Takes about 30 s and runs the roster gate.
  - Writes the single page, docx, md, json and `site/`.
  - `--no-export` is used for checks.
- **Pieces:**
  - `convert_summary.py`: single page
  - `build_site.py`: multi-page site, needs `beautifulsoup4` (the Windows `.venv` lacks it)
  - `export_pdf.py`: Playwright; fails on the Windows bridge, so run it in the cloud container
  - `rebuild_review.py`: re-lays out an existing md in v2 order
- **Template v2 (picks first)** locked 10/02 21:15 and documented in `docs/MASTER_INTEL_REPORT_FORMAT.md` §2.
- **Dark theme** (F-mi-dark, `8949848`): token option A, documented in §1a. Light is used only in `@media print`.
- **Site:** `dist/nfl_week4_master_packet/site/`, gitignored.
  - Pages: home `index.html`; section pages `ranked`, `props`, `teasers`, `underdogs`, `survivor`, `glance`, `games`, `experts`, `registry`, `trends`, `card-build`, `sources`; one `game-<away>-<home>.html` per game.
  - Assets: `assets/report.css` and `assets/report.js`.
  - Publish `_artifact_index.html`, never `index.html`.
- **Republish steps** (2145 §3.3):
  1. Rebuild.
  2. Stage `site/_artifact_index.html`, `site/*.html` and `site/assets/*`.
  3. Publish with `url` = the artifact, `file_path` = `_artifact_index.html`, `root` = staged `site/`, `files` = the rest. Omit `icon`.
  4. First run a Playwright pass at desktop and 390 px, light and dark.
- **Artifacts:** the client site `E6RSz4VGWJayUWNJG9mRi6` (2145) and the review copy `Ba1F5icQmPZf96U3N4Bxth`, which is at v3 after 2045. See §7 on which one is canonical.
- **Remaining build gaps** (2045): YouTube digest and DK Predictions.
- **Not acted on:**
  - "More" menu auto-opens and is clipped (in Andy's `top_nav()`).
  - `ranked.html` has no empty state. 2045 says it now has rows.
  - A stale Week 3 Cohen/VSiN Herbert line shows under LAC@SEA in the props pool.
  - Format items Andy has not approved: empty-state boxes, duplicate section titles, 12-hour kickoff times in game rows, mobile title size.
- **Tests:** the `build_site.py` test plus a `beautifulsoup4` requirement was a Codex task (2145 §5 task 3). No later document reports it done.

### 2.5 Evidence and intel ingestion
- **Master pull:** `node scripts/master-intel/pull.mjs --week 4 --season 2026` writes the gitignored `data/generated/master-intel/w04-pull.json`. It now includes `podcast_gemini`.
- **Expert verification:** `python3 scripts/master-intel/verify_expert_rows.py --week 4 --date 2026-10-03`.
  - Outputs `data/generated/master-intel/w04-expert-verified.json` and `reports/intel/expert-verification-2026-w04.md`.
  - Also loads article picks as `kind=article`, plus trends, systems and news lanes.
- **Full-text articles:**
  - `scripts/intel/archive_week_articles.mjs` (flags `--max N --an-pages N --refetch --refetch-small`; keep about 20 per call) writes `data/intel/articles/2026-w04/<source>/<slug>.md` and `index.json`, plus `reports/intel/article-archive-2026-w04.md`.
  - `scripts/intel/primer_feed.py` writes `data/intel/extracted/2026-w04-primer-intel.json`.
  - `scripts/intel/classify_week_articles.py`: 244 preview, 173 team news, 122 W3 recap, 64 general, 1 out of window.
  - Hand picks: `data/intel/extracted/2026-w04-article-picks.json`.
- **Analytical parser:** `agents/lib/analytical-picks.js`, gated per `f57656b`. Not yet observed on a live ingest run; check the next run's `research_pick_signals` counts.
- **Podcasts/YouTube:**
  - Antigravity's 17 episodes are promoted.
  - `podcast_gemini_normalize.py` writes `reports/intel/podcast-gemini-props-screen-2026-w04.md`, `reports/intel/podcast-gemini-delta-2026-w04.md` and `data/generated/master-intel/w04-podcast-gemini-normalized.json` (gitignored).
  - Antigravity extraction errors were flagged ("DEN vs KC", "Rams +2.5", "BAL vs Bills", 5 CFB rows, 4 unknown players).
  - Standalone videos run with `scripts/youtube-podcast-sweep.js --urls-only --run-gemini --gemini-scope all` (the default scope `futures` skips weekly picks). Queue: `data/podcasts/youtube-manual-urls-2026-w04.json`.
- **Open:**
  - The cleaned digest `data/podcasts/youtube-extracted-picks-2026-w04.json` was never built.
  - The 13 audio-only `pending` episodes (BettingPros Ep. 1083, Move the Sticks, PFF, etc.) have no confirmed drain.
  - Run `node agents/pick-extraction.js` on Windows; never confirmed.
  - Schedule `archive_week_articles` and `primer_feed` weekly (Thu and Sat).
  - Add a jina-error check to research-intel-ingest.
  - Make `pull.mjs` read article bodies.
  - Coaching-staff file `data/nfl-rosters/coaching-staff-2026.json` and Week 5 coaching trends (`scripts/build-coaching-tendency-snapshots.js`).
  - Expert season records (needs a read-only `pull.mjs --week 2`).
  - Optional Obsidian mirror of the archive.
- **Other evidence files** (in `reports/analysis/week4-intel/`):
  - injury and weather snapshots at T1559Z and T1751Z
  - reconciliation JSONs
  - `WEEK4_BKR_RENDERED_CAPTURE_INDEX_2026-10-03.md`
  - Codex's `WEEK4_MATCHUP_INTEL.md`, `week4-team-baselines.json` and `WEEK4_PRELIMINARY_RESEARCH_SYNTHESIS.md` (another team's, left uncommitted; its framing was corrected in 0905)
- **Splits:** the 10/02 0-rows gap was covered by Codex's AN refresh (16 games). The root cause of `betting-splits-ingest.yml` writing nothing is **not reported** in any later document.

### 2.6 BKR/BEO/DK line and prop capture, and parsers
- **BKR SGP capture:** `scripts/props/bookmaker-sgp-extract.browser.js` runs in the logged-in `be.bookmaker.eu` page. `bkrDownload()` needs Andy's OK. Parse with:
  `node scripts/props/bookmaker-sgp-dump-parse.mjs --in data/generated/props/bookmaker-live-2026-10-02-week4.raw.txt --date 2026-10-02 --week 4`
  The parser was fixed in `40cb644`: Second Half sections, unpriced TD-scorer listings, and `Player - Over/Under` rows.
- **Rendered-text parser:** `scripts/props/bookmaker-rendered-text-parse.py` writes `data/generated/props/bookmaker-rendered-2026-10-03-week4{,.summary,.name-resolution}.json`. 35 of 346 labels are unresolved and were not repaired.
- **Build-format live file:**
  ```
  python3 scripts/master-intel/bkr_live_from_rendered.py --week 4 --date 2026-10-03 \
    --board data/odds/BKR_current_lines_1003_1046_buildfmt --board-time 2026-10-03T17:46:00Z \
    --fallback-date 2026-10-02 --no-carry IND@WAS,NYJ@CHI,GB@TB,ARI@NYG
  ```
- **Boards on disk:**
  - `BKR_current_lines_1002_1320`
  - `BKR_current_lines_1003_1046` (plus `_buildfmt` and `.provenance.md`). Its Markdown-link headers defeat `build.py`'s baseline regex.
  - `BKR_current_lines_1005_1205` (plus `_buildfmt` and `.provenance.md`): Week 5 openers (12 games) and MNF NO −1 / 48.5.
- **Action Network openers:** `python3 scripts/master-intel/actionnetwork_openers.py --week <N>` writes `data/odds/actionnetwork-openers-2026-w04.json` and `data/generated/odds/actionnetwork-history-2026-w04/`. The redundant `…-2026-10-03-week4/` directory can be deleted.
- **BEO:** `scripts/props/beo.py` parses into `data/generated/props/beo-w04.json`. Boards are in `docs/Player_Prop_Odds_Weekly/Week4/` (`BEO_Week4_*`, `*_v2`, `BEO_Week4_ATL_NOS_v3`, `BEO_Week4_DET_CAR_v2`; `BKR_Week4_*`, `BKR_Week4_ATL_NOS`).
- **DK Predictions:** `dk-predictions-2026-10-02-<away>-at-<home>.json` (schema `dk_predictions_markets_v1`). Must use a verbatim (keyless firecrawl) extract; the interpretive extract got 32 rungs wrong.
- **Prop planner:** `scripts/props/build-prop-planner.py` writes `reports/analysis/prop-planner/player-prop-parlay-planner-2026-w04-atl-no.html` (BEO 619 + BKR 690 selections).
- **Open:**
  - The three missing Week 5 games (MIN@NO, BAL@ATL SNF, BUF@LAR MNF) go in a new `BKR_current_lines_*` snapshot when Andy pastes the board.
  - Fix CHI@GB to 10:00 PT in `BKR_current_lines_1005_1205.provenance.md`.
  - Codex's "safe next steps" (separate BKR futures capture, BEO capture, prediction markets) have no completion record.

### 2.7 SuperContest
- Week 4 lines: `data/supercontest/week-04-lines.json`. The dashboard shows the current week only (`SC_CURRENT_WEEK`).
- Proposed five: ARI −1.5, MIA +10.5, LAR −3, TEN +11.5, DEN +2.5. Alternates: HOU −2.5, LV +4.5, GB −3.5, NYJ +3.5, NE +6.5.
- Result (10/05): **4–1, ARI −1.5 the miss.** No document says which five Andy and Amanda actually submitted.
- Whether `data/supercontest/locked-card-week-4.json` was saved (a 1640 to-do) is never confirmed.
- `data/supercontest/live-market-comparison.json` keeps being modified by an unknown process. Left uncommitted.

### 2.8 Pick'em, confidence and survivor
- Committed in `710a2be`:
  - `data/pickem/odds-bkr-2026-w04-1003_1046.json`
  - `data/pickem/leans-2026-w04.json`
  - `data/pickem/picks-2026-w04.json`
  - `data/pickem/plan-2026-w04.json`
  - `reports/pickem/2026-w04-pickem.md`
- TNF: PIT locked (lost) in all 3 pools, at slot 4 in both confidence pools. Yahoo has an LV heavy fade at 3 and an ATL flip at 1; CBS has an ATL flip.
- Other picks are proposals, marked `submitted` only on Andy's confirmation. Pool standings are null (Andy to supply).
- Grade after MNF: `node scripts/pickem-grade.mjs --week 4`. Still open.
- Survivor: `data/survivor/pick-intel-2026-w04.json` uses ESPN selection % plus AN/ESPN/VSiN notes. SurvivorGrid was unreachable, so there is no EV score. `build.py` survivor footer labels now come from `sources.pick_pct_label` / `note_label`.

### 2.9 Futures portfolio and promos
- **Ledger:** `data/futures-imports/andy-portfolio-ledger-2026.json`. Per-ticket layout chosen by Andy and committed 10/02: 19 positions, $179.42.
- **`packers_sb`:** now includes BEO `#1002306799` ($20 at +6600). Totals: stake $60, blended +3867, $140 of the $200 cap left.
- **Futures boards:** `data/futures-imports/betonline-2026-10-02.json` (96 rows, hand-transcribed). Report: `reports/futures/futures-line-movement-2026-10-02.md`.
  - Bills SB BEO +650 vs Andy's +992 (+CLV). Packers SB +6600 vs +2500 (−CLV).
  - Parser: `scripts/parse-futures-text.js`.
- **Open (10/05):**
  - Log the JAX +7 free-wager win ($8.70) as `received_used` in `data/sportsbooks/promotions-2026.json` → `beo-sb-futures-special-bills`, and record the $8.70 liability reduction against `bills_sb`.
  - Log the BEO reloads (3 × $1.61 = $4.83) in `beo-reloads.balance_log`, put $4.83 on BUF SB at the best-priced book after a fresh capture, and add the ticket to `bills_sb`.
  - Next week's Bills-win free wager goes on BUF@LAR (MNF Week 5).
  - The Bills $10 credits ×2 were undecided as of 10/04 (see §7).

### 2.10 Gemini billing
- Credits topped up (2050). 2300 implies the top-up was $25.
- **Still open:**
  - The auto-reload setting is never confirmed.
  - The `ANTHROPIC_API_KEY` GH secret is never confirmed.
  - Antigravity's billing-alert code is **not committed** per 2145 (`agents/lib/billing-alert.js`, `agents/podcast-ingest.js`, `agents/podcast-gemini-intel.js`, `.github/workflows/podcast-ingest.yml`, `scripts/weekly-synthesis-preflight.mjs`). It needs GH secrets `GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD` and `TO_EMAIL`, and Andy must confirm the fallback recipient address. The preflight now does a live Gemini probe unless `--no-fetch` is passed.
  - Stale `gemini-2.0-flash` ids remain in the three dormant agents.
- Resume command: `$env:MAX_PER_RUN="15"; node agents/podcast-ingest.js`.

### 2.11 Windows scheduled tasks
- 12 tasks on `LAPTOP-1P2J0006`, run through `wscript.exe run-hidden.vbs <x>.cmd`:
  - Research_Intel_Sync and Twitter_Bookmarks_Sync every 30 min
  - Grok every 60 min
  - Live_Odds, Live_Tracker_Builder and Screenshot_Watcher every 120 min
  - Player_Availability daily 16:30
  - Podcast_Ingestion daily 06:30 and 14:30
  - Daily_Brief 07:00
  - Settlement 03:30
  - Yahoo_Survivor 10:00 and 18:00
  - `NFL Fantasy Waiver Sync` Wed 03:15
- The twitter-bookmarks daemon was replaced by the 30-minute task.
- Re-registered with `scripts\setup-all-nfl-scheduled-tasks.ps1`, `setup-research-intel-task.ps1`, `setup-twitter-bookmarks-task.ps1`, `setup-windows-task.ps1`, the task-backup XML, and `hide-nfl-task-windows.ps1`.
- Proposals not built: `pipeline-health-watchdog.yml`, and an `@onstartup`/`@logon` trigger. The 2145 to-do ("spot-check `logs/` timestamps Saturday morning") has no recorded result.

### 2.12 UX
- F-mi-dark is done (`8949848`). Tokens are in the format doc §1a. The Dashboard reference is `agents/dev/UX_EXPERT_PROMPT.md`.
- Follow-ups: fix the More-menu auto-open in Andy's `top_nav()`, and add a `ranked.html` empty state.
- `build_site.py` holds Andy's uncommitted work (150+/18− lines: top nav, "Choose your Week" cards, Market Intel).

---

## 3. Decisions and standing rules from Andy (10/02–10/05)

### Confirmed by Andy
- **Caleb Williams OUT; price NYJ@CHI with Tyson Bagent** (Andy, multiple sources). Source: 1640.
- **"No wagering synthesis until intel gathering is complete"** (Andy, 10/2). Source: 2050. It was lifted step by step: narratives authorized (1200), then STOP B "Go as proposed" (2045).
- **Gemini credits topped up.** Source: 2050.
- **Supabase `youtube_url` writes (11 rows) authorized,** plus the Jay's Lock Box ledger write. Source: 2050.
- **Template v2 (picks first) LOCKED** 10/2 21:15. Of the format changes offered, he chose only the "plain header". Source: 2145.
- **Futures ledger:** the per-ticket layout is canonical. "Exactas are mutually exclusive; never sum `to_win` across them." Source: 2145.
- **"Andy pastes every bet slip to Claude for verification before he buys it."** Source: 2145 guardrails.
- **BKR props re-capture skipped** ("it isn't needed for the Sunday synthesis", 10:47 PT). Source: 1100.
- **Action Network opening lines are the line-movement baseline,** "Andy-approved, persistent for the season". Sources: 1100, 1200.
- **Narrative phase authorized for a fresh session.** Source: 1200.
- **Write narrative leans now; add tickets once the card exists. Build on BKR date 2026-10-03.** Source: 1225.
- **Expert rules** (1300):
  - every expert name and article must be "verified against the actual matchup"; irrelevant articles are dropped
  - expert blocks don't repeat the BKR number unless the expert's number differs
  - add a section listing every expert's picks: "all their picks", best bets starred
  - coaching staff goes in `data/nfl-rosters/coaching-staff-2026.json`
  - coaching trends start Week 5
- **Dark redesign request:** "Can we make the design look like the main NFL Dashboard and Live Tracker (dark background, easy buttons). Hand it off to the UI Agent for the design." Approved token option A, "Tracker slate + teal". Andy owns the remaining `build_site.py` diff. Sources: 1945, 2010.
- **"The multi-layout is approved, but there is no actual data here…"**, followed by yes to handing off to a synthesis agent. Source: 2030.
- **STOP B: "Go as proposed."** Source: 2045.
- **Morning parlay template:** "1–2 morning sides/totals → 1–2 easy afternoon MLs → SNF ML cap". Source: 0300.
- **Rules removed by Andy on 10/04** (0300):
  - data rules "props on the side you expect to win", "2-leg tickets/2-team RRs first; 5+ leg straights = $5 moonshots", "moonshot ATD stacks lose"
  - playbook items "max 4 legs on anything over $5" and "drop first TD/sacks/QB rushing"
  - "2-team round robins → Bookmaker" ("there is no such thing as a 2-team round robin")
- **Remove every card section titled `2-team RR`.** Source: 1054.
- **8a First TD 3-leg** added as an "intel recommendation at Andy's request (10/04)". Source: card file.
- **Commit and push the placed-ticket ledger and tracker update** (an explicit request). Source: 1054.
- **Week 5 instructions** (10/05):
  - use 10:00 PT for CHI@GB
  - next Bills-win free wager goes on BUF@LAR
  - the $4.83 in reloads goes on BUF SB at the best book
  - capture the missing Week 5 games when Andy pastes the board

### Proposals not adopted, or not confirmed
- **"No full-game unders in parlays"** was a Week 4 playbook *proposal* that the card mislabeled as a "house rule". The wording is now "playbook proposal", and "Full-game unders are permissible under the confirmed card template". Sources: 0300, 1054.
- **The team-power-ratings rule flip** ("team power ratings are allowed as evidence") sits in edits to 8 older handoffs. It is **unconfirmed**; the patch is in `reports/handoff-snapshots/…/handoffs-team-power-ratings-rule-change.patch`. Source: 2145.
- **Antigravity's $25 + auto-reload recommendation:** a top-up happened, but the amount and auto-reload are only implied (2300 says $25). Adding the `ANTHROPIC_API_KEY` secret is unconfirmed.
- **Watchdog workflow, `@onstartup` trigger, local-task staleness alert:** proposed, not approved. Sources: 1950, 2000.
- **Format items offered but not approved:** see §2.4. Source: 2145.
- **SuperContest five and alternates, and Bills-credit options:** proposals (2045, card).
- **Pick'em picks:** proposals until Andy confirms (0300).
- **Afternoon and SNF prop stacks, and AI paper tickets:** proposals or paper only.

---

## 4. Open items, needs-Andy and stop conditions (as of 10/05 12:35)

**Resolved during the period, so no longer open:**
- template v2 approval
- the narratives hold
- the "no synthesis" hold
- Gemini 402 (credits topped up)
- Windows tasks restored
- BKR MIA@MIN `unparsed=24` (fixed in `40cb644`)
- the standalone 10/03 BKR board (saved at 10:46)
- the BKR Chrome logout (a later capture happened)
- Week 4 splits (Codex refresh, 16 games)
- creating the card, digest, survivor file and TICKETS/SC blocks
- Slot 3 rebuild and "house rule" wording (1054)
- 2-team RR naming, for the card only
- the multiple `.git` lock stale files were renamed, but they still need deleting (see below)

**Still open:**
1. **GB SB future** is the only unsettled Week 4 item. Log the JAX +7 free-wager win ($8.70) and the `bills_sb` liability reduction. Log the $4.83 BEO reloads and bet them on BUF SB after a fresh futures capture.
2. **Week 5 board:** MIN@NO, BAL@ATL and BUF@LAR are not posted. Fix the CHI@GB provenance note to 10:00 PT, and check whether the `_buildfmt` label matters.
3. **Optional:** BEO ticket numbers for the placeholder `afternoon_*` / `snf_*` tickets.
4. **Bills $10 credits ×2:** "Andy decides" (card, 0300). 10/05 records one free-wager win on JAX +7. Whether that used one or both credits is unclear.
5. **Jay's Lock Box promo:** odds, book, ticket # and payout still `needs_confirmation`. No settlement is recorded.
6. **Pick'em:** mark submissions as confirmed, supply pool standings, and grade after MNF with `node scripts/pickem-grade.mjs --week 4`.
7. **Recommendation ledger update** in the DEV project (2045). Not confirmed.
8. **Team-power-ratings rule** confirmation (2145).
9. **Gemini guardrails:** commit or review Antigravity's billing-alert code, create the GH secrets `GMAIL_ADDRESS` / `GMAIL_APP_PASSWORD` / `TO_EMAIL`, confirm the alert address, set `ANTHROPIC_API_KEY` in GH secrets, confirm auto-reload, and fix the stale `gemini-2.0-flash` ids.
10. **Podcasts:** 13 audio-only pending episodes not confirmed drained. YouTube cleaned digest not built. `node agents/pick-extraction.js` on Windows not confirmed.
11. **Ingestion follow-ups:** scheduling of `archive_week_articles`/`primer_feed`; jina-error check; `pull.mjs` reading bodies; checking the next live ingest's signal counts.
12. **Content backlog:** coaching-staff file; Week 5 coaching trends; expert season records (needs a W2 pull).
13. **Codex tasks from 2145 with no completion record:**
    - `betting-splits-ingest.yml` root cause
    - working-tree per-file report
    - `build_site.py` test plus `beautifulsoup4` requirement (Andy may also need to `pip install beautifulsoup4` on Windows)
    - pre-existing `npm test` failures
    - billing-alert review
14. **UX:** fix the More-menu auto-open. Andy should commit his `build_site.py` work separately.
15. **Report data quality:** the stale Cohen/VSiN Herbert W3 line under LAC@SEA.
16. **Git hygiene for Andy, from Windows:**
    - delete `.git/HEAD.lock.stale-20261005`, `.git/HEAD.lock.stale-20261005b`, `.git/main.lock.stale-20261004`, `.git/index.lock` (from 10/03), `.git/index.tmpcopy` and `_to_delete/`
    - the stale real `.git/index` shows phantom staged deletions
17. **Which artifact URL is canonical** for the client report (§7).
18. **Carry-overs still listed in HANDOFF.md, not touched in this period:**
    - Supabase sync approval for 19 Week 2 ticket numbers plus 1 book fix
    - the `bookmaker-live-parser.mjs` CLI decision
    - AssemblyAI top-up
    - eslint retry on `generate-live-tracker.mjs`
    - the paper AI Master RR
    - Master RR #739361263 payout ($0 recorded, Andy to confirm)
    - DraftKings credit payout confirmation and the Circa exacta board (from the 9/30 entry)
19. **Standing stop conditions:**
    - re-check 90-minute inactives before any placement
    - re-pull weather within about 3 h of kickoff
    - re-run the roster gate after any narrative or card edit and stop on BLOCK
    - never repair names from memory
    - recheck grading data against a live scoreboard before settling

---

## 5. Repo file paths referenced (deduplicated)

Tags: **[gi]** = gitignored or local only, **[gen]** = generated, **[uncommitted]** = deliberately left dirty, **[outside]** = not in the repo, **[proposed]** = does not exist yet, **[missing]** = noted as absent.

**Root and dot-paths**
- `HANDOFF.md`, `CLAUDE.md`, `AGENTS.md`, `HANDOFF_PROMPT.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, `.env` [secret]
- `.github/workflows/podcast-ingest.yml`, `.github/workflows/betting-splits-ingest.yml`, `.github/workflows/pipeline-health-watchdog.yml` [proposed]
- `.agents/skills/master-intel-report/SKILL.md`
- `.git/HEAD.lock`, `.git/index.lock`, `.git/HEAD.lock.stale-20261005`, `.git/HEAD.lock.stale-20261005b`, `.git/main.lock.stale-20261004`, `.git/index.tmpcopy`, `.git/refs/heads/main`
- `.nfl/reports/twitter-bookmarks/2026-10-02-DanGambleAI-2106033434476880306.md`
- `_to_delete/`
- `config/youtube-oauth-client.json`
- `logs/podcast-ingest.log`, `logs/research-intel-sync.log`, `logs/grok-thread-scanner.log`, `logs/twitter-bookmarks-sync.log`, `logs/player-availability.log`, `logs/live-tracker.log`, `logs/twitter-harvester-daemon.log`

**handoffs/**
- All 24 period handoffs listed in the task.
- `handoffs/archive/2026-09-22-legacy-rolling-HANDOFF-before-governance-trim.md`
- `2026-10-01-2005-claude-week4-merge-tickets-analytical-parser-handoff.md`, `2026-10-01-2230-codex-week4-bkr-sgp-capture.md`, `2026-10-01-2330-claude-to-codex-week4-narratives-hold.md`, `2026-10-01-2335-codex-week4-live-market-capture.md`
- `2026-09-30-0110-claude-team2-w1-3-deep-analysis-continue-handoff.md`, `2026-09-30-0050-claude-futures-exactas-placed-week4-intel-resume-handoff.md`
- `2026-09-28-2050-…`, `2026-09-28-1910-…`, `2026-09-28-1515-…`, `2026-09-28-1300-…`, `2026-09-28-1200-…`
- `2026-09-27-2130-…`, `2026-09-27-1010-…`, `2026-09-27-0315-…`, `2026-09-27-0245-codex-…`, `2026-09-27-0125-codex-…`, `2026-09-27-0100-…`, `2026-09-27-0012-…`
- `2026-09-26-2215-…`, `2026-09-26-1202-…`, `2026-09-26-1057-…`
- `2026-09-24-2110-…`, `2026-09-24-1805-…`, `2026-09-24-1435-…`, `2026-09-24-1100-…`
- `2026-09-23-1630-claude-branch-consolidation-inventory.md`, `2026-09-23-1831-codex-consolidation-merge-report.md`, `2026-09-23-1455-claude-task-branch-consolidation-main.md`, `2026-09-23-1420-…`, `2026-09-23-0055-…`
- `2026-09-22-2300-…`, `2026-09-22-2130-claude-gemini-podcast-hardening-and-youtube-intel-promotion.md`, `2026-09-22-1900-claude-gemini-podcast-diarization-fix-handoff.md`, `2026-09-22-1130-antigravity-…`, `2026-09-22-1110-codex-…`, `2026-09-22-0240-…`, `2026-09-22-0120-…`
- `2026-09-21-2310-…`, `2026-09-21-2011-…`, `2026-09-21-1810-claude-codex-request-bookmaker-live-parser-cli.md`
- `2026-09-20-1440-…`, `2026-09-19-1040-…`, `2026-09-18-0110-…`, `2026-09-17-2130-…`
- Named without a full filename: Codex 9/22 1405 (Fanatics futures).

**reports/**
- `reports/bets/`:
  - `2026-w04-card.md`, `2026-w04-ai-recommendations-unbooked.md`, `2026-w04-afternoon-props.md`, `2026-w04-snf-island.md`
  - `2026-w03-card.md`, `2026-w03-sunday-props-2026-09-27.md`, `week3-mnf-phi-chi-prop-stacks-2026-09-28.md`
  - `season-recap/`, `season-recap/work/`, `week3-recap/`
- `reports/intel/`:
  - `master-intel-narratives-2026-w04.md`, `master-intel-narratives-2026-w03.md`
  - `expert-verification-2026-w04.md`, `article-archive-2026-w04.md`, `signal-reextract-2026-w04.md`
  - `podcast-gemini-props-screen-2026-w04.md`, `podcast-gemini-delta-2026-w04.md`
- `reports/analysis/week4-intel/`:
  - `WEEK4_MATCHUP_INTEL.md`, `week4-team-baselines.json`, `WEEK4_PRELIMINARY_RESEARCH_SYNTHESIS.md` [uncommitted, other team]
  - `week4-injury-status-espn-2026-10-03T1559Z.json`, `…T1751Z.json`
  - `week4-weather-venue-2026-10-03T1559Z.json`, `…T1751Z.json`
  - `week4-source-price-reconciliation-2026-10-03.json`, `…-board1046.json`
  - `WEEK4_BKR_RENDERED_CAPTURE_INDEX_2026-10-03.md`, `week4-opening-lines-actionnetwork-2026-10-03.json`
- `reports/analysis/prop-planner/player-prop-parlay-planner-2026-w04-atl-no.html`
- `reports/analysis/season/claude/`, `reports/analysis/w1-3-deep/`, `reports/analysis/w1-3-deep/claude/`
- `reports/futures/futures-line-movement-2026-10-02.md`
- `reports/pickem/2026-w04-pickem.md`
- `reports/handoff-snapshots/2026-10-02-week4/` (and its README), `…/other-agents-wip/handoffs-team-power-ratings-rule-change.patch`

**data/**
- `data/generated/props/` [gi/gen]:
  - `bookmaker-live-2026-10-02-week4.raw.txt`, `bookmaker-live-2026-10-02-week4.json` (plus per-game files)
  - `bookmaker-live-2026-10-03-week4.json`, `bookmaker-live-2026-10-03-week4.raw.txt` [missing, never created; superseded by the rendered capture]
  - `bookmaker-rendered-2026-10-03-week4.json`, `….summary.json`, `….name-resolution.json`
  - `betonline-live-2026-10-02-ind-was.ou.raw.txt`, `beo-w04.json`
  - `dk-predictions-2026-10-02-<away>-at-<home>.json`, `dk-predictions-…-week4-inventory.json`
- `data/generated/master-intel/` [gi]: `w04-pull.json`, `w04-roster-vet.json`, `w04-expert-verified.json`, `w04-podcast-gemini-normalized.json`
- `data/generated/odds/actionnetwork-history-2026-w04/`, `…-2026-10-03-week4/` [redundant, can be deleted]
- `data/generated/host-citations-latest.json`
- `data/odds/`:
  - `BKR_current_lines_1002_1320`
  - `BKR_current_lines_1003_1046`, `…_buildfmt`, `….provenance.md`
  - `BKR_current_lines_1005_1205`, `…_buildfmt`, `….provenance.md`
  - `actionnetwork-openers-2026-w04.json` [uncommitted per 10/05]
  - six Week 4 line captures from 10/1–10/2 (unnamed)
- `data/official-picks/`:
  - `user-placed-wagers-2026.json` [gi, committed 10/04 by request], backups `.bak-claude-20261001-pre-tnf-grade` and `.bak-claude-20261002-pre-jays-lockbox`
  - `paper-wagers-2026.json`, `platinum-rose-ai-2026.json` [uncommitted]
- `data/futures-imports/`: `andy-portfolio-ledger-2026.json`, `betonline-2026-10-02.json`, `*`
  - The directory is unclear for: `betonline-2026-09-09.json`, `betonline-2026-10-01-live-conference-futures.json`, `bookmaker-2026-10-01-live-division-futures.json`, `bookmaker-2026-10-01-live-make-playoffs.json`, `price-watch-list-2026.json`
- `data/supercontest/`: `week-04-lines.json`, `locked-card-week-4.json` [unconfirmed], `locked-card-week-3.json`, `live-market-comparison.json` [uncommitted]
- `data/podcasts/`: `youtube-manual-urls-2026-w04.json`, `youtube-extracted-picks-2026-w04.json` [missing]
- `data/survivor/`: `pick-intel-2026-w04.json`, `pick-intel-2026-w03.json`
- `data/pickem/`: `odds-bkr-2026-w04-1003_1046.json`, `leans-2026-w04.json`, `picks-2026-w04.json`, `plan-2026-w04.json`
- `data/intel/` [gi]: `articles/2026-w04/<source>/<slug>.md`, `articles/2026-w04/index.json`, `extracted/2026-w04-primer-intel.json`, `extracted/2026-w04-article-picks.json`
- `data/nfl-rosters/`: `non-player-names.json`, `coaching-staff-2026.json` [proposed]. Roster fetch outputs `espn-full-rosters-latest.json` and `roster-map-latest.json` [uncommitted; directory not stated]
- `data/research-intel/`: `grok-thread-prompt-latest.md`, `grok-thread-urls-latest.txt`
- `data/vault-seed/manual/grok-week04-threads/grok-twitter-picks-2026-10-02.csv`
- `data/player-availability/player-availability-2026-10-03.json`
- `data/expert-dossiers/latest.json`
- `data/sportsbooks/promotions-2026.json`
- `data/fantasy/boxscores`

**scripts/**
- `scripts/master-intel/`: `build.py`, `build_site.py` [uncommitted Andy diff], `convert_summary.py`, `export_pdf.py`, `rebuild_review.py`, `pull.mjs`, `actionnetwork_openers.py`, `bkr_live_from_rendered.py`, `verify_expert_rows.py`, `podcast_gemini_normalize.py`
- `scripts/props/`: `bookmaker-sgp-extract.browser.js`, `bookmaker-sgp-dump-parse.mjs`, `bookmaker-rendered-text-parse.py`, `beo.py`, `build-prop-planner.py`, `run-prop-*-agent.mjs` [untracked]
- `scripts/intel/`: `archive_week_articles.mjs`, `primer_feed.py`, `classify_week_articles.py`
- `scripts/nfl-rosters/roster_vet.py`
- Other scripts: `scripts/weekly-synthesis-preflight.mjs`, `scripts/generate-live-tracker.mjs`, `scripts/build-phone-tracker.mjs`, `scripts/reconcile-settlement.mjs`, `scripts/pickem-grade.mjs`, `scripts/parse-futures-text.js`, `scripts/youtube-podcast-sweep.js`, `scripts/run_gemini_youtube_shadow.py`, `scripts/run_gemini_live_shadow.py`, `scripts/transcribe_twitter_video.py`, `scripts/ingest-beo-screenshots.js`, `scripts/parse_beo_screenshots.py`, `scripts/ingest_survivor_youtube.py`, `scripts/test_youtube_multimodal_audio.py`, `scripts/twitter-bookmarks-cron.js`, `scripts/build-coaching-tendency-snapshots.js`, `build-ai-matchup-packets.mjs` [untracked; directory not stated]
- Windows setup: `scripts/setup-all-nfl-scheduled-tasks.ps1`, `scripts/setup-research-intel-task.ps1`, `scripts/setup-grok-thread-scanner-task.ps1`, `scripts/setup-twitter-bookmarks-task.ps1`, `scripts/setup-windows-task.ps1`
- `scripts/windows/hidden-tasks/*.cmd`: `research-intel-sync`, `twitter-bookmarks-sync`, `grok-thread-scanner`, `player-availability-sync`, `live-tracker-builder`, `podcast-ingestion-sync`, `live-odds-sync`, `screenshot-watcher`, `daily-brief`, `settlement-reconciliation`, `yahoo-survivor-sync`, `fantasy-waiver-sync`
- `scripts/windows/hide-nfl-task-windows.ps1`
- `scripts/windows/task-backups/` and `task-backups/20260919-231045/NFL Fantasy Waiver Sync.xml`

**agents/**
- `agents/podcast-ingest.js`, `agents/podcast-gemini-intel.js`, `agents/pick-extraction.js`, `agents/twitter-bookmarks-agent.js`, `agents/tweet-ingest.js`, `agents/gmail-intake-agent.js`, `agents/screenshot-watcher.js`
- `agents/lib/gemini-audio-transcribe.js`, `agents/lib/gemini-master-extractor.js`, `agents/lib/extraction-providers.js`, `agents/lib/billing-alert.js` [uncommitted], `agents/lib/analytical-picks.js`
- `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`, `agents/dev/UX_EXPERT_PROMPT.md`, `agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md` (reference only)

**docs/**
- `MASTER_INTEL_REPORT_FORMAT.md`, `MASTER_INTEL_REPORT_RUNBOOK.md`, `NFL_WEEKLY_CARD_PROCESS.md`, `ANTI_PATTERNS.md`
- `docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md`, `docs/antigravity/expert-dossiers/`
- `docs/claude-project-dev/`, `docs/claude-project-dev/week4-playbook-2026.md`
- `docs/Player_Prop_Odds_Weekly/Week4/`: `BEO_Week4_*`, `BKR_Week4_*`, `*_v2`, `BEO_Week4_ATL_NOS_v3`, `BKR_Week4_ATL_NOS`, `BEO_Week4_DET_CAR_v2`
- `docs/tracked-wagers/live-tracker-sunday.html`, `docs/tracked-wagers/` (BetOnline account PDFs [uncommitted])
- `docs/player-availability/player-availability-latest.md`, `.html`
- `docs/futures-odds-20260929/`
- `docs/podcast-transcript-deep-dives/`, `…/index.html`

**dist/** [gi/gen]
- `dist/nfl_week4_master_packet/`, `…/nfl_week4_master_betting_intelligence_summary.html`, `….pdf`
- `…/site/`: `index.html`, `_artifact_index.html`, `games.html`, `game-<away>-<home>.html`, `ranked.html` and the other section pages, `assets/report.css`, `assets/report.js`

**public/**
- `public/live-tracker-sunday.html` (wager data; committed 10/04), `public/schedule.json`

**src/ and scratch/**
- `src/lib/agentTools.js` (`get_youtube_futures_intel`), `src/lib/executionVenues.js` (HANDOFF.md)
- `scratch/w04-synthesis-digest-sat.md`, `scratch/w04-card-build.py`, `scratch/w04-synthesis-digest*.md`

**Outside the repo**
- `E:\data\Obsidian\NFL\Podcasts\<Show>\<Host>\<date>-<slug>-gemini-intel.md`
- `E:\dev\projects\switch-to-main.ps1`
- `E:\dev\ATLAS\services\m6-mcp`, `u11_harden_m6.sh`
- `~/w4/recon.py`
- `C:\Program Files\nodejs\node.exe`
- claude.ai DEV project docs: `claude/recommendation-ledger-2026.md`, `claude/week4-playbook-2026.md`, `claude/handoff-2026-09-29-m6-dev-workstation-setup`
- Supabase project `aambmuzfcojxqvbzhngp` (tables `podcast_episodes`, `podcast_gemini_intel`, `podcast_transcripts`, `podcast_feeds`, `user_picks`, `game_splits`, `research_intel_notes`, `research_pick_signals`, `player_injuries`, `feed_health`, `game_odds_snapshots`)

**Artifact URLs and external pages**
- https://claude.ai/artifact/E6RSz4VGWJayUWNJG9mRi6: client multi-page site (2145)
- https://claude.ai/artifact/Ba1F5icQmPZf96U3N4Bxth: review copy, v2 (2010) then v3 (2045)
- Private "Platinum Rose Live Tracker" phone artifact; URL not given (10/05)
- "Platinum Rose Season Review" and Basket Review artifacts (HANDOFF.md, older)
- https://ai.studio/projects
- `be.bookmaker.eu`
- `troya.xyz` (sensitive or expired JWT; do not reuse)

---

## 6. Guardrails and git procedure (as stated)

- **Checkout:** preserve the dirty shared checkout (about 1,100–1,260 unrelated dirty files). Never reset, clean, stash, revert or force-push. **Never `git add -A`**; stage only explicit, reviewed paths. Live Git beats handoff prose, so report any mismatch.
- **Session start:** `git fetch; git status --short --branch; git rev-list --left-right --count '@{u}...HEAD'`.
- **Branch:** `main` only (`wip/yahoo-sync` is retired as tag `archive/wip-yahoo-sync-2026-09-23`).
- **Temp-index commits** (stale locks and a stale `.git/index` with phantom deletions):
  1. `git read-tree HEAD` into a temp `GIT_INDEX_FILE`
  2. add the explicit paths
  3. `git write-tree`
  4. `git commit-tree`
  5. `update-ref`, or write `.git/refs/heads/main` directly

  Don't run plain `git add` or `git commit`. The device bridge can't `rm`, so stale locks were renamed.
- **Never stage `scripts/master-intel/build_site.py`** (Andy's work). The UX agent committed only its own hunks, as a blob of HEAD plus those hunks.
- **Sportsbooks:** read-only. No wagers, account, cashier or bet-slip actions, and no odds clicks. Agents must not sign in. `bkrDownload()` needs Andy's OK. Prices are displayed information, not executable confirmation.
- **TheOddsAPI:** no calls. 10/04: no `game_odds_snapshots` was used for pricing.
- **Supabase:**
  - no writes without Andy's per-change go; SELECT-only reads are fine
  - the Codex exception: a splits ingest through the existing workflow only
  - Windows tasks may make their normal writes only
  - the 1054 handoff extends this to "No Supabase reads/writes for board pricing or tracker updates unless Andy expressly changes that instruction"
- **Paid synthesis or models:** need explicit authorization. Gemini investigations allow one minimal 402-test call.
- **No ledger, portfolio, official-pick or promotion mutation** without explicit scope. Placed tickets go only into `data/official-picks/user-placed-wagers-2026.json`; then the sync and tracker scripts run. Keep placed tickets, paper records and card proposals separate. Never alter an entered ticket's accepted price or stake from later board prices.
- **Roster gate:** `npm run roster:vet -- --week 4 --date <capture-date> --fetch --strict`, or `python3 scripts/nfl-rosters/roster_vet.py --week 4 --date 2026-10-02 --fetch --strict`.
  - Stop on BLOCK. Never repair or state names or teams from memory.
  - Write status words in lower case. The parser captures capitalized "Out"/"Questionable" as part of a name.
  - Re-run after every narrative or card edit.
- **Do not hand-edit** the hosted artifact or `dist/`. Change only `build.py`, `convert_summary.py` and `build_site.py`. Log approved format changes in the format doc §7. Don't change the look outside the UX lane.
- **Don't edit `.env` or GH secrets** without telling Andy. Don't log in to X for him.
- **Save every handoff** in `handoffs/` and give Andy the path.
- **`.gitignore` artifacts** (pull json, generated props) must not be force-added. The exception: the wagers ledger, which Andy explicitly asked to commit on 10/04.
- **Andy verifies every bet slip** with Claude before buying.

---

## 7. Contradictions and stale statements

1. **HANDOFF.md is stale.**
   - "Last verified HEAD: 10/03 14:15 Claude commit … on top of `94a5193`". Later commits include `553e261`, `e6d6988`, `f57656b`, `8949848`, `b56fa7d`, `710a2be`, the 10/04 commit, `a096758`, `189f8f7` and `70e0def`.
   - Four entries are marked **LATEST** (10/04-0300, 10/03-2045, 10/03-1415, 10/02-2145), plus older "LATEST" lane tags.
   - The 10/04-1054 and 10/05-1235 handoffs are **not listed** at all.
   - Its "Current state" items still describe Week 2/3 (Week 3 TUE-WED intel, STOP A).
   - "Needs Andy" still lists BRANCH-CONSOLIDATE-MAIN, which line 48 says was merged 9/23, and the "Bills-win free-bet credit lands Wed 9/23".
   - It says "13 tasks"; Antigravity registered 12. The 1950 checklist expected 11 plus the daemons.
2. **HANDOFF.md pointer for 1640** still says template v2 is "awaiting Andy's approval". 2145 says it was locked 10/2 21:15.
3. **Card totals differ.** 2045 and HANDOFF.md: 14 tickets, $174.95 (about $175). The card's self-check: $155.00 (13 tickets plus the teaser, after removing both 2-team RRs and adding 7e and 8a). The card header still says "built Sat 10/03 ~20:30" but prices are "BKR game lines 10/04".
4. **Concentration figures.** 2045: DEN@SF about $85 across six tickets, ARI@NYG $80. The card now: DEN $65 on four tickets, ARI $55. 1054 still repeats "Denver's six-ticket exposure and Arizona's $80 exposure".
5. **Slot 3 versions.**
   - 0300: U39.5 + NYJ +3.5 → SEA ML → DET ML, about +594.
   - Card: NE +7, NYJ +3.5, U38.5, SEA ML, DET ML, +1319. Its template line says "two morning sides/totals" but lists three.
   - Booked as `739714258` with Under 40.
6. **Slot 4 template.** The card's Slot 4 template reads "two easy morning MLs → two afternoon sides/totals → SNF ML cap". That is the inverse of Andy's stated template (1–2 morning sides/totals → 1–2 easy afternoon MLs → SNF cap). No document says Andy approved this variant.
7. **Stale MIA labels in the card.** The "Single MIA +9.5" and SuperContest flag rows still say "MIA +10". 2045 lists "Singles MIA +10".
8. **2-team RR naming.** 0300 left it as an open question, including the §7.1 slot "Dog 2-team RR" in `WEEKLY_SYNTHESIS_SESSION_PROMPT.md`. 1054 removed only the *card* sections. Whether the prompt's §7.1 wording was changed is unclear.
9. **Verified-pick counts.** 1300: 257 verified. 1415 added 117 verified article picks. The 2030 brief and the card cite 371, not 374. The source of the 3-pick difference is not explained.
10. **DK Predictions.** 1640 says DK files exist for all 15 games (10/02). 2030 and 2045 say "DK Predictions saves: 0 of 15" and the card says "no DK Predictions saves". This is probably date- or format-specific, but no document explains it.
11. **Splits.** 2145: 0 Week 4 rows, needs a Codex fix of `betting-splits-ingest.yml`. 0000 Codex: AN splits refreshed, splits=16. The root cause of the workflow failure is never reported.
12. **Billing-alert code status.** 2300 says an "Active email alert guardrail installed (`agents/lib/billing-alert.js`)". 2145 says it is NOT committed and needs GH secrets and confirmation. No later commit is recorded.
13. **Top-up amount.** 2050 says only "Andy topped up credits". 2300 assumes a $25.00 top-up ($24.49 remaining). Auto-reload is unconfirmed.
14. **Bookmarks count.** 2000: "Ingested: 12". 2050: "14 new by 20:08 PT". These may be different counts.
15. **Grok setup script.** 1950 lists `setup-grok-thread-scanner-task.ps1`. Antigravity's re-registration list omits it, yet the Grok task shows as registered.
16. **Futures ledger stake.** HANDOFF.md's 9/30 entry says "$278.51 staked" (seven exactas). 2145 says the per-ticket ledger has "19 positions, the same $179.42 stake". The scopes may differ; unclear.
17. **Two artifact URLs.** 2145 says the client site `E6RSz4VGWJayUWNJG9mRi6` should be republished after *every* rebuild, and the format doc §5 records it. All later rebuilds (v2, v3) went to `Ba1F5icQmPZf96U3N4Bxth`, and UX says it "didn't touch the older client link". `E6RS…` is likely stale relative to the filled report.
18. **"Week 4 fully settled"** at 10/05 12:35 PT, before MNF ATL@NO kicks off (17:15 PT). This implies no real MNF tickets, or none logged yet. The pick'em plan includes ATL flips that can't be graded yet, and the Jay's Lock Box promo has no settlement recorded.
19. **Ticket counts.** 1054: 13 pending placed tickets. 10/05: 24 settled real tickets. The difference likely comes from the 5 earlier official Week 4 tickets ($51.37), the promo, and later `afternoon_*` / `snf_*` placeholder tickets, but no handoff records those later placements.
20. **Bills credits.** The card offers NE +7 (Andy default), MIA +9.5, NYJ +3.5 or TEN +11.5. 10/05 records the free wager as **JAX +7** (not a line on the card; JAX was +2.5 or +8.5 teased). The second $10 credit is unaccounted for.
21. **Test status.** 1640: 2 pre-existing failures (`generateLiveTracker.test.js`, `superContestView.test.js`). 1054: "1,918 total, 1,903 passed, 15 failed across 21 failing test files". More failing files than failing tests is internally odd (possibly suite-level errors). Either way, the failure count grew.
22. **Name spelling.** 1100 uses "Steve Fezik". 1225 lists "Steve Fezik" as a non-roster podcast string and adds "Steve Fezzik" to non-player names.
23. **Unpushed commits.** 2010 says `8949848` was not pushed, and 2045 says local main was 3 ahead and "doesn't push". 10/05 reports pushing later commits on `main`, which would include them if the history is linear; not explicitly confirmed.
24. **HANDOFF.md active-rules item 5** (leg barrier −350, etc.) predates the 10/04 rule pruning. 0300 says HANDOFF.md was updated for the pruning, but the "Current state" text shown doesn't reflect any of the removed or added rules beyond the pointer line.
25. **`.git/HEAD.lock` and `.git/index.lock`** were described as stale in 1415, 2010 and 2030. 10/05 says HEAD.lock variants were renamed and `index.lock` (10/03) remains. Andy's deletion is still pending.

**For memory:** nothing new about Andy personally. The project facts (open Week 5 board capture, Bills free-wager plan on BUF@LAR, the $4.83 reloads going to BUF SB, CHI@GB at 10:00 PT) belong in the project's NFL Dashboard notes if the main session wants them kept.
agentId: a364487d12e453394 (use SendMessage with to: 'a364487d12e453394', summary: '<5-10 word recap>' to continue this agent)
<usage>subagent_tokens: 228645
tool_uses: 31
duration_ms: 340664</usage>