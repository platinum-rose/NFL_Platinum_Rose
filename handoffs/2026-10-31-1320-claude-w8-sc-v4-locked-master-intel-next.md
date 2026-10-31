# Handoff — Week 8: SuperContest v4 layout LOCKED; next session works on the Master Intel Report
Claude (Opus 5.5) · Sat 2026-10-31 ~1:20 PM PT · branch `claude/w5-prop-cards-2026-10-11` · committed and pushed with this file (not main)

## Andy's ask for the fresh session
Work on the **Master Intel Report** (Andy will give the specifics). The SuperContest report is done for Week 8 and its layout is frozen.
Nothing is published, sent to clients, Drive-archived or pushed to `main` without Andy's OK.

## State at handoff
- **Both Week 8 reports are built from Friday data** (`build.py --week 8 --date 2026-10-31`) in `dist/nfl_week8_master_packet/` (dist is git-ignored).
  SuperContest format gate: PASS. Master PDF was exported by Andy on Windows (~11:20 AM); the SuperContest PDF needs a fresh export after the last layout edits.
- Overnight 1:10 AM build is preserved in `dist/nfl_week8_master_packet_overnight-0110/` (do not use; its SC section was out of format).
- Dashboard AI five (unchanged): **CIN -10.5, BAL +3.5, CLE +3.5, LAC +6.5, CHI +3**; alternates MIN +3.5, MIA +7, JAX -9.5. Not Andy and Amanda's official five.

## SuperContest v4 — locked 2026-10-31 (supersedes every earlier SC layout)
- Spec: `docs/MASTER_INTEL_REPORT_FORMAT.md` §8 (first bullet) + change-log row 2026-10-31. Frozen reference: `docs/reference/supercontest-report-locked-w08.html` (+ `.json`).
- Rendering: `scripts/master-intel/sc_layout.py` (new; tiles, bullets, splits, experts for/against, game headers, grids, filters, CSS/JS);
  `build.py` SC section calls it; `convert_summary.py` injects `SC4_CSS` / `SC4_JS`.
- Gate: `scripts/master-intel/check_sc_report.py` now also requires the v4 pieces (verified: W8 PASS, old W7 report FAILS on all 9 v4 checks).
- Expert attribution (SC report only): a feed row saved under a multi-host show's own name (Sharp or Square, BettingPros) is credited to the host the
  verifier/reasoning names, moved if the reasoning names the other host (Sharp or Square NYJ +1.5: Chad → Simon), else listed as
  "(show pick, host not named)" and never counted. `build.py` prints each change as `SC expert attribution: ...`.

## Builder changes this session (all in this commit)
1. Restored the committed SC section of `build.py` after an overnight uncommitted edit had stripped Pitch/Pushback, standings, Dashboard AI total and the
   gate call (kept its additive Master-side changes: expert-review exclusions, gate advisories in Known Gaps). `convert_summary.py` SC-only edit reverted.
2. SC v4 layout (above). Local backups, not committed: `scripts/master-intel/*.overnight-20261031-0110.bak`, `*.pre-sc4*-20261031.bak`.

## Access + traps
- Repo on the device: `$HOME/mnt/NFL_Dashboard` (connected folder `E:\dev\projects\NFL_Dashboard`). Shell can't delete; git leaves lock files —
  rename new ones to `.git/stale-*`. git with `-c core.fsmonitor=false -c gc.auto=0`; stage explicit paths only.
- **Python 3.12 is per-session.** The device shell only has Python 3.10, which cannot parse build.py (3.12 f-strings). This session set up
  `$HOME/pyenv312` from conda-forge (micromamba from `conda.anaconda.org`; python=3.12 python-docx beautifulsoup4 lxml) with Andy's explicit OK.
  A fresh session must ask again, or Andy runs the build on Windows: `.\.venv\Scripts\python scripts\master-intel\build.py --week 8 --date 2026-10-31`.
- PDF export (`export_pdf.py`) needs Playwright + Chromium: only Andy's Windows `.venv` has it (installed today).
- Not ours to commit: `data/official-picks/*wagers*`, survivor, tracked-wagers/live-tracker, `public/live-tracker*`, futures ledger,
  `scripts/build-player-availability.js`, `scripts/sync-live-market-lines.mjs`, shadow-harness reports, `data/supercontest/{dashboard-ai-review,live-market-comparison}`.

## Open items for the Master Intel session
- **Master consensus still counts show-level expert rows as experts** (e.g. Sharp or Square / BettingPros show rows; can double-count Simon on
  MIN +3.5 and SEA -3). The SC fix (`scl4.attribute_show_rows`) could be applied to the Master's VOTES/CONS — offered to Andy, not yet approved.
- **Expert source review is out of date**: `reports/intel/expert-review-2026-w08.json` hash no longer matches
  `data/podcasts/youtube-extracted-picks-2026-w08.json`, so its exclusions are NOT applied (Known Gaps says so). Conflicting rows (Jets ±1.5,
  TB -2.5 Anderson vs Matt Moore) can appear in Master panels and votes. Reconcile before publication.
- Stale feeds: BetOnline props 31.6h old at build; DraftKings Predictions stale (needs Andy's manual login).
- Master news feed includes one stale Week 7 item (Puka Nacua "Wk 7 TBD").
- Saturday delta run is still due tonight per `agents/dev/WEEKLY_INTEL_REPORT_RUN_PROMPT.md` (BEO props after ~2 PM, AN/BKR recapture, Saturday gate);
  snapshot `dist/nfl_week8_master_packet` to a `_friday` folder first. DST ends Sunday: early games 10:00 AM PST, inactives ~8:30 AM PT.
- Week 7 client editions remain the template for the Master client copy; client-specific trims still need Andy's spec.
