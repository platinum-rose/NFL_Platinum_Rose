# Week 4 evidence complete → narratives next (fresh session)

**Date:** Sat 2026-10-03, 08:54–12:00 PT · **Agent:** Claude (Cowork) · **Branch:** `main`.
**Session result:** the read-only evidence for the Saturday narrative/card review is in place. Action Network opening lines are now wired into `build.py` and persistent for the season. **No narratives, card, digest or bets were written or placed.** No Supabase writes, no paid model calls, no sportsbook clicks.

## CRITICAL

- **Andy has authorized the narrative phase for a fresh session.** Write `reports/intel/master-intel-narratives-2026-w04.md` to the minimum in `docs/MASTER_INTEL_REPORT_FORMAT.md` §3; the model block is Week 3 `master-intel-narratives-2026-w03.md`, LAC@BUF.
- **Roster gate:** run `npm run roster:vet -- --week 4 --date <capture-date> --fetch --strict` after writing. Stop on BLOCK and never repair names from memory.
  - The gate's narrative parser reads a capitalized status word next to a name as part of that name ("Jayden Daniels Out" is treated as one unknown name). Write statuses in lower case or put them away from the name.
- **PIT@CLE is final.** Exclude it everywhere.
- **QB changes the 10/03 preliminary synthesis doesn't reflect** (ESPN designation feed, 10/03 17:51 UTC):
  - WAS: Jayden Daniels is out; Marcus Mariota is expected to start.
  - CHI: Caleb Williams is out; Tyson Bagent is expected to start.
  - TB: Baker Mayfield is out; Jalon Daniels starts.
  - NYG: Jaxson Dart is on IR; Jameis Winston starts.
- **Venues:** IND@WAS is in London (06:30 PT Sunday). ATL@NO, MIA@MIN and KC@LV are fixed-roof stadiums; DAL@HOU has a retractable roof.

## Evidence index (all in `reports/analysis/week4-intel/` unless noted)

| What | File | As of |
|---|---|---|
| Current BKR main lines (15 games) | `data/odds/BKR_current_lines_1003_1046` (verbatim) + `…_buildfmt` (build format) + `.provenance.md` | Andy-supplied board, saved 10:46 PT |
| BKR prop pages (14 games; no ATL@NO) | `WEEK4_BKR_RENDERED_CAPTURE_INDEX_2026-10-03.md`; normalized local `data/generated/props/bookmaker-rendered-2026-10-03-week4*.json` | 09:29–09:59 PT |
| Opening lines (line-movement baseline) | `data/odds/actionnetwork-openers-2026-w04.json` (+ the exploratory `week4-opening-lines-actionnetwork-2026-10-03.json`) | AN open after Sun 9/27 5 PM PT |
| Injury designations | `week4-injury-status-espn-2026-10-03T1751Z.json` (supersedes the `T1559Z` file) | 10:51 PT |
| Weather / venues | `week4-weather-venue-2026-10-03T1751Z.json` (supersedes the `T1559Z` file) | 10:51 PT |
| Expert/podcast positions re-priced | `week4-source-price-reconciliation-2026-10-03-board1046.json` (`current_price_status` per row) | vs 10:46 board |
| Promoted podcast evidence + expert rows + splits | `data/generated/master-intel/w04-pull.json` (local) | 10/03 early AM |
| Team baselines W1–3 | `WEEK4_MATCHUP_INTEL.md`, `week4-team-baselines.json` (Codex's; uncommitted changes by another team) | 10/03 |
| Preliminary synthesis (Codex) | `WEEK4_PRELIMINARY_RESEARCH_SYNTHESIS.md`. Untracked and not committed by this session; it belongs to the other team. Read it alongside the corrections above. | 10/03 |

Session handoffs with full detail:
- `handoffs/2026-10-03-0905-claude-week4-evidence-readiness.md`: per-game status at 09:05 and corrections to the preliminary synthesis.
- `handoffs/2026-10-03-1030-claude-week4-bkr-rendered-capture-normalization.md`: prop-menu availability, the BKR board, and its differences from the per-game pages.
- `handoffs/2026-10-03-1100-claude-week4-evidence-refresh.md`: inactive-list timing, the weather re-check, the price re-check, and the Action Network opener wiring.

## IMPORTANT

**Line moves to note in the narratives** (AN open → BKR 10:46):
- GB@TB: TB -2.5 → +3; total 46 → 39.5 (Mayfield).
- ARI@NYG: NYG -2.5 → +2.5 (Dart).
- DAL@HOU: HOU -1.5 → -3.
- IND@WAS: WAS +3.5 → +4.5.
- TEN@BAL: BAL -11.5, total 43.
- MIA@MIN: total 42.5 → 38.5.
- LAR@PHI: PHI +2.5 → +3.5; total 46 → 42.5.

**Key-number price checks** (expert positions vs the current board):
- DEN +3 is now +2.5.
- HOU -2.5 is now -3.
- PHI +3 is now +3.5.
- BUF -6.5 is now -7.
- SEA -6.5 is now -7.
- ATL +3 is now +2.5.
- Every IND@WAS position predates the WAS QB news.

**Prop menus as of 10/03 morning:**
- DET@CAR: the whole player-prop menu was unpriced.
- IND@WAS: 18 SGP sections unpriced, and no TD-scorer menu.
- MIA@MIN: no TD-scorer menu and no player Over/Unders.
- ATL@NO: not captured.
- Andy skipped any further BKR props capture for the Sunday synthesis.

**Weather:** rain risk at DET@CAR (most consistent), LAR@PHI (mid-game showers), TEN@BAL (the models disagree) and ARI@NYG (2nd-half chance). All light; no game reaches 15 mph wind.

**Build input:** `build.py` takes its *current* lines from `data/generated/props/bookmaker-live-<date>-week4.json` (`--date`). Only the 2026-10-02 version exists.
- To show the 10/03 prices, someone has to create `bookmaker-live-2026-10-03-week4.json` from the rendered captures plus the 10:46 board. Not done; it's Andy's call.
- `--date 2026-10-02` builds on the Oct 2 prices.

**Missing for the full report:**
- the card (`reports/bets/2026-w04-card.md`);
- the Saturday digest (`scratch/w04-synthesis-digest-sat.md`);
- `data/survivor/pick-intel-2026-w04.json`;
- the narratives' `## TICKETS` / `## SUPERCONTEST` blocks, which depend on the card. SuperContest lines exist in `data/supercontest/week-04-lines.json`.

## Blockers / game-day only

- **90-minute inactive lists:** ~05:00 PT (IND@WAS), ~08:30 (10:00 window), ~11:35/11:55 (afternoon), ~15:50 (SNF), Mon ~15:45 (ATL@NO).
- **Weather re-pull** within ~3 h of each kickoff.

## Commit

This session's files only, staged by explicit path, in commit `feat(week4): AN opening-line baseline in build.py + 10/03 evidence refresh`. Pushed to `origin/main`.

Left uncommitted on purpose; they belong to other lanes or teams:
- `reports/analysis/week4-intel/WEEK4_MATCHUP_INTEL.md`, `week4-team-baselines.json`, `WEEK4_PRELIMINARY_RESEARCH_SYNTHESIS.md`
- `scripts/master-intel/build_site.py`
- the BEO Week 4 files
- every other pre-existing dirty file

## Resume prompt (fresh session)

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard on main.
Goal: write the Week 4 game narratives (Andy authorized). Read-only on sportsbooks; no Supabase writes, no paid models, no bets.
Start: git fetch; git status --short --branch; git rev-list --left-right --count '@{u}...HEAD'. Never reset/clean/stash/git add -A.
Read in order: HANDOFF.md → handoffs/2026-10-03-1200-claude-week4-evidence-ready-narratives-next-handoff.md → docs/MASTER_INTEL_REPORT_FORMAT.md §3 → docs/MASTER_INTEL_REPORT_RUNBOOK.md §8 → reports/intel/master-intel-narratives-2026-w03.md (LAC@BUF model block) → the evidence files in that handoff's index.
Confirm with Andy before writing: (1) whether a Week 4 card/digest exists or is being built first (the narrative minimum names card tickets); (2) which BKR date the build should use (2026-10-02 as-is, or create bookmaker-live-2026-10-03-week4.json from the 10/03 captures).
Then write reports/intel/master-intel-narratives-2026-w04.md for the 15 remaining games (exclude PIT@CLE), ~200–300 words each, citing only dossier evidence with named experts on each side. After writing, run npm run roster:vet -- --week 4 --date <capture-date> --fetch --strict; stop on BLOCK and don't repair names from memory. Write status words in lower case to avoid the gate's name-capture issue.
Do not build the card or publish without Andy's go-ahead.
```
