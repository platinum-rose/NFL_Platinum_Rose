# NFL Dashboard handoff — 2026-10-16 18:30 PT — resume Master Intel report (Week 6)

Repo: E:\dev\projects\NFL_Dashboard (device bridge: $HOME/mnt/dev/projects/NFL_Dashboard), branch claude/w5-prop-cards-2026-10-11.
Pushed: f0e1a42 (Circa 10/16 + exacta comparison) on top of 509db4a (W6 Friday-finals refresh). Origin is up to date.

## Done today
- Friday-finals injury chain rerun, roster gate PASS (order in prior handoff 0845; fetch-espn-status needs `--out data/research-intel/source-evidence/espn-status-w06.json`).
- W6 narratives (13 games), weather, quant synthesis (provisional 60/25/15, no QB-change term).
- BKR 10/16 lines captured: data/odds/BKR_current_lines_1016_1038_buildfmt.
- Pick'em card (SSW, Yahoo, CBS) + standings captured. SSW 429.5 (site rank 47); CBS 27th tied at 48; Yahoo pick'em 34/54.
- Master Intel built (162-page PDF + HTML) in dist/nfl_week6_master_packet/ (gitignored; rebuild from the chain).
- Circa futures 10/16 logged: data/futures-imports/circa-2026-10-16.json (16 NFC + 16 AFC champion prices).
- Circa-derived vs BEO exacta comparison (256 combos): data/futures-imports/exacta-comparison-circa-vs-beo-2026-10-16.json. BEO better on 173, Circa better on 83 (realistic: GB/BAL +16950 vs +15500; MIN/BAL +5400 vs +5000). BEO capture is 10/13 (stale) -> recapture before acting.
- Andy GB vs BAL: two BEO tickets, $12 @ +10300 (994658662) and $8 @ +20600 (1000995399); stake-weighted avg +14420.

## Master Intel rebuild — checklist ("make sure nothing is missing")
1. Fresh BKR/BetOnline prop capture (Andy runs it) -> data/generated/props/bookmaker-live-<date>-week6.json. Without it the build uses my overlay (fresh game lines + carried-forward 10/14 props). Also refresh DK predictions + BEO live props; rerun parsers.
2. Rerun injury chain in order (see 0845 handoff), then `python3 scripts/nfl-rosters/roster_vet.py --week 6 --date 2026-10-18 --strict` (avoid "Name Questionable/Out" phrasing and practice-squad names).
3. Rerun synthesis: `node scripts/build-w05-quantitative-synthesis.mjs --week 6 --bkr <latest BKR file>`; rebuild team dossiers (`node scripts/build-team-dossiers.mjs`).
4. Build: `uv run --python 3.12 --with python-docx --with markdown --with beautifulsoup4 python scripts/master-intel/build.py --week 6 --date <date>`; export_pdf.py needs Chromium -> run in the cloud container; redeliver PDF/HTML.
5. Verify coverage: all 13 games present in narratives, packets, synthesis and pick'em plan; weather flags (HOU@JAX gusts 40.7 km/h, DAL@GB 51.8 km/h, PIT@TB borderline); line sanity vs BKR 10/16 (HOU +2.5/JAX -2.5 o42.5; NYJ+7/NE; PIT-2.5/TB o39; BAL-3/CLE o40.5; CHI-1/ATL o51.5; TEN+7/IND; CAR-3.5/PHI o39; NO-1/NYG; ARI+13.5/LAR; BUF-4.5/LV; LAC+8/KC; DAL+1.5/GB; WSH+7.5/SF).
6. TNF/low-total rule: totals under 41 with no weather -> defensive props, max 1-2 anytime TD legs (docs/BETTING_LESSONS_LEARNED.md).

## Open items
- CHI Caleb Williams is a game-time decision; hold CHI-dependent cards until Sunday morning.
- Yahoo SEA@DEN pick/slot not captured.
- Survivor: Andy is eliminated in both Yahoo survival leagues; ask if another pool exists. No survivor intel file written.
- BetOnline parser: Cousin/Cousins -> Kirk Cousins normalization (not yet authorized/made).
- Drive archive: connector can't take the big files; Andy drags manually.
- import-manifest-2026.json not updated for circa-2026-10-16 (importer not run).
- Git: stale .lock files get moved aside to .git/stale-* (deletion not permitted); leftover tmp_obj files are harmless. Commit via temp-index recipe; trailers: Co-Authored-By Claude Sonnet 5.5 + Claude-Session.
