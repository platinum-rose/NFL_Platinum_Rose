# Handoff — Week 8 Saturday delta done; Codex continues building + enhancing the Master Intel Report
Claude (Opus 5.5) · Sat 2026-10-31 ~3:50 PM PT · branch `claude/w5-prop-cards-2026-10-11` (commit with this file; not main)
Previous handoff: `handoffs/2026-10-31-1320-claude-w8-sc-v4-locked-master-intel-next.md` (SC v4 layout LOCKED — do not change it).

## Andy's ask
Codex takes over the Week 8 Master Intel Report: finish the Saturday rebuild, QA it, and keep enhancing the report. Andy wants to send it out early tonight.
Nothing is published, sent to clients, Drive-archived or pushed to `main` without Andy's OK. Andy skipped the Saturday BetOnline re-scrape on purpose (props stay on the Sat 2:14 PM board).

## FIRST: the Master report has NOT been rebuilt yet
Andy ran the build at ~3:35 PM PT; it stopped at the roster gate (output below). The blocker was Claude's narrative wording "the Friday Lean" (read as a player name) in BAL@BUF — FIXED ("Friday's lean"); `scripts/nfl-rosters/roster_vet.py --week 8 --date 2026-10-31 --season 2026 --strict` now PASSES (0 blocking).
Because build.py stopped, `dist/nfl_week8_master_packet/` still holds the PREVIOUS (Friday-data) html/md/docx/json, and the PDF Andy exported at ~3:36 PM was made from that old html. Friday's packet was snapshotted to `dist/nfl_week8_master_packet_friday/` (do not overwrite it).

Next commands (Windows, Andy's .venv; the device shell has only Python 3.10 and cannot run build.py):
```
.\.venv\Scripts\python scripts\master-intel\build.py --week 8 --date 2026-10-31
.\.venv\Scripts\python scripts\master-intel\check_sc_report.py
.\.venv\Scripts\python scripts\master-intel\export_pdf.py dist\nfl_week8_master_packet\nfl_week8_master_betting_intelligence_summary.html
```
Then QA per docs/MASTER_INTEL_REPORT_RUNBOOK.md §6 (open html + pdf; collapses, filters, links, logos, disclaimer; all 5 exports + site/). If the roster gate blocks again, fix names in the source text (never `--allow-roster-issues` without Andy).

Andy's 3:35 PM build output (for reference):
```
CAPTURE BKR: {'path': 'data/generated/props/bookmaker-live-2026-10-31-week8.json', 'captured_at': '2026-10-31T21:26:44.573Z', 'rows': 5726}
CAPTURE BEO: {'path': 'data\\generated\\props\\betonline-live-2026-10-31-week8.json', 'captured_at': '2026-10-31T21:32:06.867Z', 'rows': 972}
CAPTURE DKP: {'path': 'data\\generated\\props\\draftkings-predictions-live-2026-10-28-week8.json', 'captured_at': '2026-10-29T03:20:25.181Z', 'rows': 972}
ROSTER VET: BLOCK - 1 blocking issue(s); player legs resolved: card 29, digest 13; ESPN rosters 2026-10-31T21:31Z (1.1h old, 2560 players)
== narratives: 1 issue(s)  [BLOCKING]
  UNKNOWN_NAME   Friday Lean   claimed ['BAL', 'BUF']  roster -  BAL@BUF: … update: the Ravens +3 price moved to -108, which turns the Friday Lean into a pass …
== secondary-matchups:absences: 2 issue(s)  [info only]   Israel Mukuamu (PIT), Travis Hunter (CB) (JAX) UNVERIFIED
== book-props:bookmaker-live-2026-10-31-week8.json: 12 issue(s)  [info only]
  UNVERIFIED: Zonovan Knight, Reginald Virgil (ARI@DAL); Mar'Keise Irving, Kenneth Gainwell (ATL@TB); Josh Palmer, Re'Mahn Davis, Matthew Hibner (BAL@BUF);
  Andrew Ogletree (IND@JAX); Cameron Ward (TEN@CIN); Ollie Gordon ll (NE@MIA); Marquise Brown, Chigoziem Okonkwo (PHI@WAS)
ROSTER GATE FAILED — fix every issue above … and rebuild. Details: data\generated\master-intel\w08-roster-vet.json
wrote ...\dist\nfl_week8_master_packet\nfl_week8_master_betting_intelligence_summary.pdf   (<- old html)
```
(Info-only rows are BKR name variants, e.g. "Cameron Ward" = Cam Ward, "Ollie Gordon ll" with lowercase L's; worth a name-alias fix as an enhancement.)

## Saturday state (all inputs refreshed; gate)
- Final gate (saturday): sides queue PASS; only S2 props queue RED (BetOnline Sunday boards thin) — accepted by Andy. Report: reports/intel/gates/w08-final-gate-saturday.md.
- BKR: Sat 2:26-2:31 PM PT capture (13 games; CHI@SEA Monday menu thin). Friday copies in data/generated/props/_friday-20261031/. Game lines: data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt.
  Moves since Fri: CIN -11.5 -> -13; NYJ -1 -> -1.5; MIN@DET total 46 -> 45.5; KC@DEN total 40.5 -> 40. Seth McGowan (IND) market pulled.
- AN splits Sat 2:23 PM PT: reports/engineering/week8-an-browser-pull-2026-10-31-sat/raw.json, merged into data/generated/master-intel/w08-pull.json.
  TRAP: every `pull.mjs` re-pull wipes `splits` (Supabase has none) — restore from the latest raw.json/backup before building queues.
- Pull: re-pulled 2:55 PM PT (425 signals, 793 notes) incl. Andy's 2:45-2:51 PM X bookmark sync (28 new posts).
- Articles: auto ingest current to ~2:33 PM PT. Chrome refresh ~3:05 PM PT: AN (Kolodziej PRO Systems: High Winds unders IND@JAX/NE@MIA/ATL@TB, Dogs-After-Blowout BAL +3; primer feeds unchanged) + BettingPros 5 new articles -> data/intel/extracted/2026-w08-chrome-article-picks.json (33 rows) and reports/intel/bettingpros-articles-2026-w08.md (Saturday section).
- Podcasts: Antigravity zero-cost caption sweep (9 Saturday episodes). Its digest rebuild wrongly included 120 Week 6/7 picks (297 rows): FIXED by a week filter in scripts/master-intel/youtube_digest_from_staging.py -> 177 picks / 22 episodes. Their report: reports/intel/antigravity-w08-saturday-podcast-sweep.md (still says 297).
- Injuries/starters: Andy ran build-player-availability.js (FantasyPros only; ESPN feed skipped — `--live-injuries` would add it) and projected-starters at ~2:45 PM. Patriots ruled out A.J. Brown, TreVeyon Henderson, T Marcus Bryant (official Sat).
- BEO parser fix (scripts/props/betonline-prop-dump-parse.mjs): "X to Score Touchdown in the Game" -> atd_1_plus; truncated "Fantasy Points (Standard ESPN" -> fantasy_points.

## Saturday re-synthesis (done) and recommendations
- All 13 sides syntheses re-run (one agent per game, ~3:20-3:30 PM PT): reports/intel/games/2026-w08-game-*-sides.md + data/research-intel/proposed/games-w08/*-sides.json (each has "Changes vs Friday" / changes_vs_friday[]). Friday copies: reports/intel/games/_friday-w08/, data/research-intel/proposed/games-w08/_friday/. Props syntheses carried from Friday.
- Quant: reports/intel/w08-model/fair-lines-w08-synth.json (Saturday lines + adjustments; Friday copy .fri.json; fair_lines_sat.py = pre-delta market-only view).
- Digest rewritten: scratch/w08-synthesis-digest-sat.md (Friday build kept as scratch/w08-synthesis-digest-sat.fri-build.md).
- Platinum Rose recs unchanged, all tier B: ARI@DAL Under 54.5 -108 · BAL@BUF Over 55 -101 (edge 1.0 < ~1.5 guideline; kept as Friday, flagged to Andy) · IND@JAX Under 46 -103 · NE@MIA Under 43.5 -111.
- Leans: new KC@DEN Under 40 (C), PHI +6 -107 (C); dropped BAL +3, LAC +6.5 (price); TEN@CIN now pass (lean TEN +13).
- SuperContest AI five unchanged: CIN -10.5 (now tier A), BAL +3.5 (B), CLE +3.5 (C), LAC +6.5 (thin), CHI +3 (weakest). SC v4 layout locked.
- Pitches: reports/intel/master-pitches-2026-w08.json (Saturday pitch + pushback appended per rec). Narratives: reports/intel/master-intel-narratives-2026-w08.md ("Saturday update" sentence on 8 games). Card reports/bets/2026-w08-card.md not touched (its 4 straights unchanged).

## Open items / enhancement backlog for Codex
1. Rebuild + QA + PDF (above). Send Andy the 15-line summary; he publishes/sends.
2. Expert source review out of date: reports/intel/expert-review-2026-w08.json hash != rebuilt youtube picks file -> exclusions not applied (Known Gaps). Reconcile.
3. Master consensus still counts show-level expert rows as experts (Sharp or Square / BettingPros); port scl4.attribute_show_rows from the SC report (needs Andy's OK).
4. Roster-vet name aliases for BKR variants (Cameron Ward, Ollie Gordon ll, Marquise Brown, etc.).
5. youtube_digest_from_staging.py week filter is new — keep it; staging holds every week.
6. Sunday morning: inactives ~8:30 AM PT (early window). Swing items: Lamar Jackson (BAL Over/BUF), Jonathan Taylor trade talk (IND under), Pickens/Froholdt (ARI@DAL), Barkley (PHI@WAS, ~3:50 PM PT), Charles Cross (CHI@SEA), Goedeke (ATL@TB). Weather not refreshed since Fri 6:02 PM PT (device can't reach Open-Meteo).
7. 4 X videos queued untranscribed (data/research-intel/twitter-video-queue.json).
8. Stale feeds: DraftKings Predictions (Andy login), prediction-market coherence (22h).

## Access + traps
- Repo on device: $HOME/mnt/dev/projects/NFL_Dashboard (= E:\dev\projects\NFL_Dashboard). Device shell: Python 3.10 only, no network to YouTube/X/ESPN/article sites (Supabase + npm + GitHub OK). git: `-c core.fsmonitor=false -c gc.auto=0`, stage explicit paths, rename new .git/*.lock to .git/stale-*.
- Not ours to commit: data/official-picks/*wagers*, survivor, tracked-wagers/live-tracker, public/live-tracker*, futures ledger, scripts/build-player-availability.js, scripts/sync-live-market-lines.mjs, shadow-harness reports, data/supercontest/{dashboard-ai-review,live-market-comparison}, grok-thread files, docs/YAHOO_FANTASY_API_ACCESS_FOR_CODEX.md.
- Gitignored but present locally: data/generated/props/*, data/generated/master-intel/*, dist/.
