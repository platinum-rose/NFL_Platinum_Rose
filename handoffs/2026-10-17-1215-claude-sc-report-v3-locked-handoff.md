# NFL Dashboard handoff — 2026-10-17 12:15 PT — SuperContest report v3 locked
(Repo copy of the Project doc `claude/nfl-dashboard-handoff-2026-10-17-1215-sc-report-v3-locked.md`, so non-Claude agents can read it. Added Sat 2026-10-17 ~13:30 PT.)

## State
- Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`, HEAD `ea74728` (pushed to origin). Checkout is still very dirty (~1570 changed paths, many from other sessions): do NOT `git add -A`; commit with `git commit --only -- <paths>`.
- That session committed only: `scripts/master-intel/build.py`, `convert_summary.py`, `docs/MASTER_INTEL_REPORT_FORMAT.md` (§8 + change log), `data/supercontest/locked-card-week-5.json` (reconstructed W5 five: CIN -7, ARI +5.5, ATL -3.5, LV +3.5, NO +2.5), `week-05-lines.json`, `week-06-lines.json`, `data/generated/master-intel/w06-email-props-cody-brown.json` (force-added; the dir is gitignored).
- Not committed (ignored/other): `dist/*` outputs, `public/betting_splits.json` (refreshed via `agents/betting-splits-ingest.js --dry-run`, no Supabase write), `scripts/master-intel/build_single.py`, `data/supercontest/bkr-current-lines-week-05.json`.

## OFFICIAL SuperContest report layout (v3, locked by Andy 2026-10-17)
Use for every week until Andy asks for changes. Spec: `docs/MASTER_INTEL_REPORT_FORMAT.md` §8. Build: `py -3.14 -W ignore scripts/master-intel/build.py --week 6 --date 2026-10-17-0100` (Windows PowerShell via Desktop Commander). Output: `dist/nfl_week6_master_packet/nfl_week6_supercontest_intelligence_summary.html`.
- Tabs: Home · Ranked & Market · Experts · Game-by-Game · Season Review. Andy/Amanda toggle top left. Pinned 450px pick sheet, one row per game, one side per game, conflict flag if they differ.
- Ranked table: one row per matchup (Game | Favorite | Underdog | Best side) with checkboxes; matchup name opens the Master Intel pop-up.
- Spread-only Action Network-style splits bars; expert picks carry a line (cited or "~X (est.)"); Season Review includes W5.

## SuperContest lines (repo files)
- Locked contest lines: `data/supercontest/week-06-lines.json` (same content as `latest.json`), captured 2026-10-15T21:29Z, 14 games incl. SEA@DEN (final).
- Live comparison vs DK/FD: `data/supercontest/live-market-comparison.json` (spread signs are dropped in live_dk/live_fd fields; use clv_summary and locked_contest_spread for direction).

## Standing constraints
- No spend on Gemini, AssemblyAI or OpenAI. Everything is a proposal; nothing placed, promoted or written to Supabase by Claude. Sportsbooks read-only.
- Hold all CHI cards until Sunday's Caleb Williams decision (expected to play, not confirmed by the team as of Sat 13:13 PT); rerun the roster gate Sunday morning. Isaiah Likely and Najee Harris need a human check before any use.
- Andy prefs: generated files viewable in-session; copy-paste text inline in a code block.

## Known caveats
- Master report's moneyline splits still come from the older Supabase pull; spread/total splits are the Sat 11:14 AM PT capture.
- Cody's sheet lists Kittle -125 but his parlay slip +115 (report keeps +115).
- Millman CAR +1.5 was placed BEFORE Jalen Hurts was ruled out (not a sign error; line is now CAR -3).
- CAR@PHI narrative says "TNF rule applies" (wrong); stale PDF; main packet shows 0 card bets ("GAP: No card tickets found", ticket format mismatch).
- Picks live in each browser's localStorage; no 5-pick cap in the pick sheet.
