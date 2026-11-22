# NFL Dashboard handoff — 2026-10-17 12:15 PT — SuperContest report v3 locked

## State
- Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`, HEAD `ea74728` (pushed to origin). Checkout is still very dirty (~1570 changed paths, many from other sessions): do NOT `git add -A`; commit with `git commit --only -- <paths>`.
- This session committed only: `scripts/master-intel/build.py`, `convert_summary.py`, `docs/MASTER_INTEL_REPORT_FORMAT.md` (§8 + change log), `data/supercontest/locked-card-week-5.json` (reconstructed W5 five: CIN -7, ARI +5.5, ATL -3.5, LV +3.5, NO +2.5), `week-05-lines.json`, `week-06-lines.json`, `data/generated/master-intel/w06-email-props-cody-brown.json` (force-added; the dir is gitignored).
- Not committed (ignored/other): `dist/*` outputs, `public/betting_splits.json` (refreshed Sat 11:14 PT via `agents/betting-splits-ingest.js --dry-run`, no Supabase write), `scripts/master-intel/build_single.py` (modified by an earlier session, untouched here), `data/supercontest/bkr-current-lines-week-05.json`.

## OFFICIAL SuperContest report layout (v3, locked by Andy 2026-10-17)
Use for every week until Andy asks for changes. Spec: `docs/MASTER_INTEL_REPORT_FORMAT.md` §8. Build: `py -3.14 -W ignore scripts/master-intel/build.py --week 6 --date 2026-10-17-0100` (Windows PowerShell via Desktop Commander). Output: `dist/nfl_week6_master_packet/nfl_week6_supercontest_intelligence_summary.html`.
- Tabs: Home · Ranked & Market · Experts · Game-by-Game · Season Review. Andy/Amanda toggle top left. Pinned 450px pick sheet, one row per game, one side per game, conflict flag if they differ.
- Ranked table: one row per matchup (Game | Favorite | Underdog | Best side) with checkboxes; matchup name opens the Master Intel pop-up.
- Spread-only Action Network-style splits bars; expert picks carry a line (cited or "~X (est.)"); Season Review includes W5.

## Standing constraints
- No spend on Gemini, AssemblyAI or OpenAI. Everything is a proposal; nothing placed, promoted or written to Supabase by Claude. Sportsbooks read-only.
- Hold all CHI cards until Sunday's Caleb Williams decision; rerun the roster gate Sunday morning. Isaiah Likely and Najee Harris need a human check before any use.
- Andy prefs: generated files viewable in-session; copy-paste text inline in a code block.

## Known caveats (unfixed)
- Master report's moneyline splits still come from the older Supabase pull; SC splits are the 11:14 PT capture.
- Cody's sheet lists Kittle -125 but his parlay slip +115 (report keeps +115). Millman CAR +1.5 sign looks suspect.
- CAR@PHI narrative says "TNF rule applies" (wrong); stale PDF; main packet shows 0 card bets ("GAP: No card tickets found", ticket format mismatch).
- Picks live in each browser's localStorage; no 5-pick cap in the pick sheet.

## Next
1. New session: work on the official **Master Intel report** (Andy's stated next focus).
2. Sunday AM: roster gate rerun; CHI/ATL card decision after Caleb Williams.
3. Await Andy and Amanda's official five (then save to `data/supercontest/locked-card-week-6.json`), the optional GB SB add go/no-go, and the contest deadline check.
4. Update digest/card for the Lamar Jackson/Huntley change.
5. Offer: position tags on prop lines/tables/expert rationales.

## Resume prompt
Resume NFL_Dashboard. HEAD `ea74728` on `claude/w5-prop-cards-2026-10-11` (pushed). SuperContest report v3 layout is locked as official (docs/MASTER_INTEL_REPORT_FORMAT.md §8); do not change it unless asked. Today's focus: the official Master Intel report for Week 6. Read the project handoff `claude/nfl-dashboard-handoff-2026-10-17-1215-sc-report-v3-locked.md` first, keep the dirty checkout untouched (no `git add -A`), and await direction.
