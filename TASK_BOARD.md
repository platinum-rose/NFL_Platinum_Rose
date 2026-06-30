# Platinum Rose — Task Board (NFL)
> **Last updated:** 2026-06-30 (reconciled against HEAD `2c0fb68`)
> **Owner:** PM agent is the sole writer of this file.

---

## 🏗️ IN PROGRESS

| ID | Task | Assignee | Notes |
|----|------|----------|-------|
| — | (none) | — | — |

---

## 📋 BACKLOG

### Features (open)

| ID | Task | Priority | Notes |
|----|------|----------|-------|
| F-24 | Debug Tailscale always-on URL | P0 | `https://atlas.tail1e459d.ts.net` failing. Check: `nfl-podcast.service` status on M6, `tailscale serve`/`funnel` config, `VITE_M6_BASE` in `.env`. Podcast Digest Tab "Open digest" links all broken until resolved. |
| F-25 | Player Injury UI — dedicated view | P1 | Ingest (F-19) and BETTING agent injection (F-22) are done. Missing: dedicated injury tab or enriched matchup card showing impact-level badges. `InjuryReportModal.jsx` + `InjuryBadge.jsx` exist but may not be fully wired. |
| F-27 | UI QC pass | P1 | Full audit across all 12+ tabs. Look for: broken buttons, dead routes, offseason-mode stale states, clunky workflows, features that can be deprecated or simplified. No code changes — produce a prioritised defect list first. |
| F-26 | Fantasy Football features — spec + build | P2 | DFSOptimizer (F-7) is the only fantasy feature. Need spec: roster/waiver intel, weekly projections, FantasyDouche/Adam Levitan X feed already in sharp-accounts.json. Decide scope before building. |
| F-14 | Vault pre-load (reference data) | P2 | `agents/vault-seed.js` + drop dirs built (S158). Coaching tendencies + DVOA seeded. Andy collecting PFF/ATS/splits source files — drop in `data/vault-seed/{pff,ats,splits}/` when ready. |
| OPS-1 | stats-to-vault-sync recurring cron | P3 | `agents/stats-to-vault-sync.js` run once manually (S157, 35 vault notes). No GHA workflow exists — seasonal data goes stale. Add `nflverse-data-refresh.yml` trigger or cron. |

### Podcast Intel Pipeline (M6) — All Phases Complete ✅
> Phases 1–8 DONE. All ops closed (S239: migrations applied, odds-proxy deployed, share tokens minted). See DONE section + `docs/PODCAST_PIPELINE_PM_HANDOFF.md`.

### Bugs

| ID | Task | Priority | Notes |
|----|------|----------|-------|
| — | (none) | — | — |

---

## ✅ DONE

| ID | Task | Completed | Notes |
|----|------|-----------|-------|
| F-0 | Phase 1: Governance Foundation | 2026-04-02 | SOUL.md, RULES.md, WORKING-CONTEXT.md, TASK_BOARD.md, AGENTS.md |
| F-1 | Phase 2: Contexts + Hooks + Rules | 2026-04-02 | contexts/ (5), hooks/hooks.json, rules/ (4) |
| F-2 | Phase 3: Dev Agent Architecture | 2026-04-02 | agents/dev/ — 15 adapted YAML-frontmatter prompts |
| F-3 | Phase 4: Product Agent Layer | 2026-04-02 | BETTING.md, INTEL.md (tier1), betting.manifest.json |
| F-4 | Phase 5: CLAUDE.md Consolidation | 2026-04-02 | Orchestration directives, session protocols, commands |
| F-5 | Phase 6: NFL-Specific Additions | 2026-04-02 | ANTI_PATTERNS.md, HANDOFF_PROMPT.md, AGENT_LOCK.json, GOTCHAS.md, gen_resume.js |
| F-6 | Agent Chat POC (BETTING agent) | 2026-04-02 | anthropicClient.js, agentTools.js, AgentChat.jsx — Agent tab live |
| F-7 | DFS Lineup Optimizer | 2026-04-02 | DFSOptimizer.jsx — DK/FD platform toggle, greedy optimizer, lock/exclude, save lineups |
| F-8 | Props Agent | 2026-04-17 | propsTools.js (7 tools), PropsAgentChat.jsx, PROPS.md + manifest, Props tab — stubbed data sources flagged |
| DS-2 | Build 2026 season schedule spine (`games`) | 2026-05-17 | `agents/schedule-ingest.js` + migration 007 applied; 272 games (weeks 1–18) in Supabase + `public/schedule.json`; deterministic `game_id`; `toolAnalyzeMatchup` now uses `normalizeTeam` for exact abbreviation lookup; receipt writing added. |
| DS-3 | Expand futures ingest breadth (`futures_odds_snapshots`) | 2026-05-17 | `agents/futures-odds-ingest.js` covers 10 markets (SB + conf + division + 6 awards); migration 008 applied (selection/price/captured_at/season columns); conf/division/awards return 404 from TheOddsAPI offseason — handled gracefully; Bookmaker manual snapshot imported 96 rows; live SB snapshot 96 rows written today. |
| DS-4 | Research intel ingest v1 (`research_intel_notes`, `research_pick_signals`) | 2026-05-18 | `agents/research-intel-ingest.js` + migration 009 applied; Action Network, VSiN, ESPN NFL RSS feeds active; NFL offseason keyword filter (36 terms); non-NFL contamination fix (title-only for NON_NFL_HINTS); GHA workflow (`.github/workflows/research-intel-ingest.yml`) runs 09:00 + 21:00 UTC daily; BETTING agent now loads intel at session start via `getRecentResearchIntelNotes`/`getRecentResearchPickSignals` injected as `### Research Intel` block in `buildSystemPrompt`; 60+ notes + 34+ signals live in Supabase. |
| F-9 | Sunday Slate Briefing mode (BETTING agent proactive entry) | 2026-05-18 | Season-aware `PROACTIVE_BRIEF_PROMPT` (offseason/regular/playoffs branches); `buildSystemPrompt` now passes `phase` + tool-use guidance block; `react-markdown` + `remark-gfm` render markdown in `AssistantMessage`; `AgentStatusBar` phase color (green in-season, grey offseason); offseason empty-state suggestions (futures/open-picks). |
| F-10 | Performance feedback loop | 2026-05-18 | `get_performance_stats` tool added to `agentTools.js` (8th tool); `buildCalibrationSummary()` helper computes all-time record, units, ROI, last-10, high-conf win rate from local picks; injected as `### Performance` block in `buildSystemPrompt`; ack instruction updated; 3 new tests (68 total). |
| F-11 | Intel search tool (`search_intel`) Phase 1 | 2026-05-18 | `searchResearchIntel(query, opts)` added to `supabase.js`; `search_intel` (9th BETTING tool) in `agentTools.js` with full `toolSearchIntel()` impl; `ilike` on title+summary, optional source/hours/limit params, returns notes + attached pick_signals; system prompt tool list + `ToolCallCard` label updated; 4 new tests (72 total). |
| F-11 | Intel search tool Phase 2 (FTS + body scraping) | 2026-05-18 | Migration 011 adds `body text` + `tsv tsvector` + GIN index + auto-trigger to `research_intel_notes`; `searchResearchIntel` upgraded to Postgres FTS (`textSearch` via tsvector) with ilike fallback pre-migration; ingest agent adds `fetchArticleBody()` (8s timeout, HTML strip, 4000-char cap) + `INTEL_FETCH_BODY=true` in GHA env; back-fill trigger covers existing rows. |
| DS-5 | `game_odds_snapshots` — game-level odds time series | 2026-05-18 | Migration 010: append-only table with (game_id, season, week, home/away team, book, market, spread, total, home/away price, captured_at); GIN indexes on game_id+market and week; RLS public read. `agents/game-odds-ingest.js`: TheOddsAPI spreads+h2h+totals, team normalization map, week derivation from commence_time, chunked Supabase insert, TTL prune, receipt. GHA `.github/workflows/game-odds-ingest.yml` runs 4×/day offseason, hourly on game days (Thu/Sun/Mon). `getGameOddsForWeek(week, season)` added to `supabase.js`. |
| F-15 | Props auto-grade GHA agent | 2026-05-18 | `.github/workflows/props-auto-grade.yml` mirrors nfl-auto-grade.yml schedule (hourly Sun/Thu/Mon, 4h other days); manual --week override; `props-auto-grade.js` updated to use `SUPABASE_SERVICE_ROLE_KEY` + `dotenv/config` (was incorrectly using ANON_KEY). Degrades gracefully when `player_stats` table absent. |
| DS-1 | 2026 Data Sprint Kickoff (scope + sequencing) | 2026-05-20 | All sub-tasks complete: DS-2 (schedule spine), DS-3 (futures breadth), DS-4 (research intel), DS-5 (game odds snapshots). All 5 tables live in Supabase. GHA ingest agents active. |
| F-13 | X/Twitter sharp-account ingestion via RSSHub | 2026-05-18 | `config/sharp-accounts.json` (8 accounts: Warren Sharp, Action Network, VSiN, PFF, etc.); migration 013 (`x_sharp_tweets` table — FTS + RLS; applied ✅); `agents/x-sharp-ingest.js` (GHA agent; RSSHub RSS; dedup via url_hash); GHA workflow every 4h + hourly game days; `searchSharpTweets` + `getRecentSharpTweets` in supabase.js; `search_sharp_tweets` tool (12 tools total); sharp tweets injected as `### Sharp Account Tweets` block in system prompt. 84/84 tests passing. Commit `4d1125b`. |
| F-12 | NFL Betting Vault (Obsidian + Supabase dual backend) | 2026-05-18 | Migration 012 applied (`vault_notes` table: FTS/tsvector, GIN indexes, auto-updated_at trigger, RLS, 4 seeded reference stubs). `src/lib/vaultClient.js`: dual-backend VaultClient (ObsidianRESTBackend + SupabaseVaultBackend), switch via `VITE_VAULT_BACKEND` env. `agentTools.js`: `read_vault_note` + `write_vault_note` tools (11 tools total; path-scoped to `NFL/` for safety). `AgentChat.jsx`: vault reference notes pre-loaded at session start, injected as `### Vault Reference Notes` system-prompt block (3000-char cap). `agents/obsidian-vault-sync.js`: one-shot Obsidian → Supabase sync for production sharing. Flip `VITE_VAULT_BACKEND=supabase` when sharing with betting partners. 80/80 tests passing. |
| F-19 | Player injuries ingest (`player_injuries` table) | 2026-05-21 | Migration 016: `player_injuries` table (espn_injury_id upsert key, Out/Doubtful/Questionable/IR/PUP statuses, captured_at). `agents/injury-ingest.js`: ESPN NFL injury report API + team roster loop, dedup on espn_injury_id, receipt. GHA `injury-ingest.yml` daily + pre-game days. |
| F-22 | Injuries context injection (BETTING agent) | 2026-05-21 | `getRecentPlayerInjuries(168, 100)` in supabase.js; `buildInjurySummary()` helper; `### Recent Injuries` block in `buildSystemPrompt`; loaded in `Promise.all` at session mount. Commit `36e3c3d`. |
| F-23 | Current game lines pre-load (BETTING agent) | 2026-05-21 | `getLatestWeekOdds(week, season)` in supabase.js with DraftKings-first dedup; `buildOddsSummary()` helper; `### Current Lines` block in `buildSystemPrompt`. Commit `36e3c3d`. |
| F-21 | Action Network betting splits (Pillar 2) | 2026-05-21 | Migration 017: `game_splits` table (upsert on game_id; spread/total/ML home % for bettors + money). `agents/betting-splits-ingest.js`: AN public API, multi-shape field extraction, --dry-run/--dump flags, graceful offseason exit. GHA `betting-splits-ingest.yml`: 2h game days, 3×/day game week. `getGameSplitsForWeek(week, season)` in supabase.js. `get_betting_splits` tool (#13) in agentTools.js. `buildSplitsSummary()` + `### Betting Splits` context block in AgentChat.jsx. 84/84 tests. Commit `36e3c3d`. |
| F-15/F-16 | nflverse PBP seed + formation cols + stats-to-vault bridge | 2026-05-22 | Commit `5025af4`. Migration 015 (3 formation cols on `nfl_team_season_stats`, applied ✅). `scripts/seed-historical-stats.py` (direct nflverse Parquet CDN via httpx; `shotgun_rate`/`no_huddle_rate`/`pass_rate`; `--no-pbp`/`--cache-dir`/`--dry-run`). 192 rows (32 teams × 6 seasons) seeded. `agents/stats-to-vault-sync.js` writes per-team + league-wide vault notes. **Note: vault sync NOT yet run live.** (F-15 ID collides with Props auto-grade — distinguish by hash.) |
| F-17 | Analytical RSS ingest into vault | 2026-05-22 | Commit `8d7c34e`. Analytical RSS feeds + Atom parser + `source_type` split in vault. Articles (Football Outsiders, etc.) flow into `research_intel_notes` for vault sync. |
| F-19 | Player injuries ingest (`player_injuries` table) | 2026-05-21 | Commits `44419cf`/`982d712`/`fa5058b`. Migration 016 + 018 (public read RLS). `agents/injury-ingest.js`: ESPN injury API + roster loop, dedup on espn_injury_id, GHA daily. |
| F-20 | Futures intel report + vault export | 2026-05-22 | Commit `01618bc`. Futures intel report, vault export, cron fixes. |
| OPS | NFL daily brief email agent | 2026-05-22 | Commits `d595a9e`/`8a51e5f`/`37d36c6`. `agents/nfl-daily-brief.js` + GHA workflow; gmail + hotmail recipients. |
| AUDIT | Security & Quality tri-audit (30/30) | 2026-05-23 | S139→S152. All CRITICAL/HIGH/MEDIUM/LOW items closed. See `docs/NFL_AUDIT_BACKLOG.md` + receipt `docs/AUDIT_RECEIPT_2026-05-23.md`. CI gate (`ci.yml`) live. |
| UI | 12-tab nav + odds/routing fixes | 2026-05-23 | `b64b0a7` compact 12-tab bar (no scrollbars) + OddsCenter sub-tab fix; `8d9f1d3` LiveOddsDashboard reads `game_odds_snapshots`, clears isMock on hit; `68d5873` brief→dashboard deeplinks + URL tab routing; `6ecb316` game-odds-ingest ESM/season fixes; `c1898b2` removed legacy VSiN scrape pipeline. |
| PODCAST-M6 | Podcast intel pipeline v2 (Phases 1–6) | 2026-06-03 | Commits `64b279d`→`df020a4`. P1 schema migration (M6 paths/quality/share tokens), P2 Fastify service skeleton (HMAC/runs/systemd) in `packages/m6-podcast-service/`, P3 Python transcription, P4 Python extractor + quality gate, P5 vault-rebuilder agent (fence-guard auto-sections), P6a 6 Supabase query helpers (12/12), P6b `PODCAST_INTEL_TOOLS` (6 tools) + executor, P6c `agents/manifests/futures.manifest.json`, P6d `FuturesAgentChat.jsx` + `?tab=futures-agent` (spec divergence: `?tab=futures` kept for FuturesPortfolio), P6e podcast tools in `betting.manifest.json`. See `docs/PODCAST_PIPELINE_PM_HANDOFF.md`. |
| FUT-TOOLS | Futures-specific agent tools | 2026-06-05 | Commits `896455c`, `a48cfb5`. Implemented `analyze_futures_hedge` (3-scenario hedge model: hold/partial/full lock with line-appreciation context), `project_division_paths` (division winner odds + implied probs from Supabase), `track_award_race` (MVP/OPOY/DPOY/OROY/DROY/CPOY/COY ranked leaderboard). FUTURES_TOOLS exported; FuturesAgentChat wired; futures.manifest.json updated. 578/578 tests. |
| vault-seed | Vault reference data ingestion agent | 2026-06-05 | Commit `a48cfb5`. `agents/vault-seed.js`: CSV/JSON/MD ingestion into vault_notes. Auto-detects schema (PFF, ATS, splits, DVOA, nflverse). Writes league-wide + per-team notes. `data/vault-seed/{pff,ats,splits,dvoa,nflverse,manual}/` drop dirs. README with column specs. 607/607 tests. |
| PODCAST-P7-P8 | Podcast pipeline Phases 7a/7-serving/7b/7c/8 | 2026-06-04 | Commit `51ac195`. P7a: static digest renderer (`render/` — 4 files, 10/10 tests). P7-serving: `/digest/*` Fastify routes + `src/digest.js` (14/14 tests). P7b: `PodcastDigestTab.jsx` + `?tab=podcasts` lazy route + `apiConfig.M6`. P7c: `fetchTopPodcastPicks` + `renderTopPodcastPicks` in `nfl-daily-brief.js`. P8: signed `/share/*` partner surface + `src/share.js` + `scripts/share-token.js` (10/10 tests). Migrations 019+023 applied. ai-proxy Edge Fn deployed. GPT-4o auto-fallback wired. 64/64 tests. All pending ops closed (S158/S239): `VITE_M6_BASE` set, share tokens minted for Patrick + Amanda, `odds-proxy` deployed. |
| B-1 | `oddsIdempotent` tests (futures upsert path) | 2026-06-03 | Root cause: `f1e6f19` reverted S152 upsert path to delete-then-insert. Restored `.upsert(..., { onConflict: 'market_type,team,book,snapshot_time' })` in `agents/futures-odds-ingest.js`. 552/552 green. Committed. |
| PODCAST-L1-L5 | Local diarization pipeline (S235–S238) | 2026-06-30 | L1-L3 (`68da421`): `diarize.py` (pyannote 4.x), `speaker_map.py`, `show_hosts.json`, `experts_roster.json`; `transcribe.py` patched with `--diarize`/`--show-name`; 54 tests. Six pyannote 4.x compat fixes (generator API, DiarizeOutput unwrap, audio pre-load, PLDA patch). L4 (`5586a56`): `extract.py` gains `labeled_transcript` param; `prompts.py` adds speaker attribution. L5: `vault_note.py` — `build_vault_note` + `upsert_vault_note`, 32 tests. |
| PODCAST-B1-B4 | Vault Bridge — podcast episode vault notes (S238–S239) | 2026-06-30 | B1: schema designed (`docs/LOCAL_PIPELINE_SPEC.md §8`). B2: `vault_note.py` — 32 tests (`5586a56`). B3: `backfill_vault_notes.py` — 59 done episodes backfilled (`5586a56`). B4 (`13fb03f`): `search_episode_vault_notes` added to `PODCAST_INTEL_TOOLS`; `betting.manifest.json` updated (14 tools); `futures.manifest.json` gets `search_episode_vault_notes` + `read_vault_note`. |
| S239-OPS | Production ops close-out | 2026-06-30 | Commit `13fb03f`. Migrations 018/019/021/022 confirmed applied (all return "already exists"). `odds-proxy` Edge Fn deployed (was never deployed). Phantom `clever-endpoint` duplicate deleted. `supabase secrets list` confirms ANTHROPIC/OPENAI/ODDS keys set. |
| S240-RECOVERY | NTFS recovery + LF enforcement | 2026-06-30 | Commit `2c0fb68`. 10 NTFS-truncated working-tree files restored from git HEAD objects (futures-intel-report-v2.js, experts.js, agentTools.js, research-intel-ingest.js, diarize.py, extract.py, prompts.py, vault_note.py, test_extract.py, backfill_vault_notes.py). `.gitattributes` (`* text=auto eol=lf`) committed via git plumbing. Known index quirk: `.gitattributes` not in git index (plumbing bypass) — cosmetic only, file is in HEAD tree. |

---

## 🚫 BLOCKED

| ID | Task | Blocker | Notes |
|----|------|---------|-------|
| — | (none) | — | — |

---

## Legend
- **Priority:** P0 (critical path) · P1 (high) · P2 (medium) · P3 (low/backlog)
- **Prefixes:** F- = feature, B- = bug
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          