# Task brief for UX_EXPERT: Master Intel report: dark redesign to match the NFL Dashboard + Live Tracker

**From:** Claude (Cowork), Sat 2026-10-03 ~7:45 PM PT · **Requested by:** Andy
**Andy's words:** "Can we make the design look like the main NFL Dashboard and Live Tracker (dark background, easy buttons). Hand it off to the UI Agent for the design."
**Task ID:** F-mi-dark (TASK_BOARD.md, Backlog → Features)

## What exists now
- The Week 4 report was built tonight with `python3 scripts/master-intel/build.py --week 4 --date 2026-10-03`, which takes about 30 s and runs the roster gate itself.
- Outputs land in `dist/nfl_week4_master_packet/`:
  - the single-page `nfl_week4_master_betting_intelligence_summary.html` (from `convert_summary.py`)
  - the multi-page client site in `site/` (from `build_site.py`): 30 pages plus `assets/report.css` and `assets/report.js`
- **Review copy (private):** https://claude.ai/artifact/Ba1F5icQmPZf96U3N4Bxth
  - It is published from `site/_artifact_index.html`, with every other `site/*.html` and `site/assets/*` passed in `files`.
  - `index.html` can't be a published path; the artifact index stands in for it.
- **The current look is light.** It uses a navy, slate and white palette, and has `prefers-color-scheme: dark` overrides in `convert_summary.py` and `build_site.py`, plus a top nav with these links:
  - Dashboard
  - Super Contest
  - Props Lab
  - Teaser Board
  - Survivor Center
  - Matchups
  - Market Intel
  - More
- ⚠️ **`scripts/master-intel/build_site.py` has 150+ lines of uncommitted changes from another session.** Those changes add the workspace nav and the "Choose your Week" cards. Ask Andy whose they are before you edit that file. Don't overwrite them or commit them as your own.

## Target look
**1. Main NFL Dashboard (React app).** The design system is in `agents/dev/UX_EXPERT_PROMPT.md`:
  - background `#0f0f0f`
  - teal accent `#00d2be`
  - cards `bg-slate-800/50` with a `border-slate-700/40` border
  - body text `slate-300`, headers white
  - buttons `px-3 py-1.5 rounded text-xs font-medium`
  - tabs with an accent border-bottom

**2. Live Tracker (`scripts/generate-live-tracker.mjs`, standalone HTML).** Its most-used colors:

| Role | Color |
|---|---|
| Page background | `#0F172A` |
| Cards | `#1E293B` |
| Borders | `#334155` |
| Text | `#F8FAFC` |
| Muted text | `#94A3B8` and `#CBD5E1` |
| Positive | `#10B981` / `#34D399` |
| Negative | `#EF4444` |
| Info | `#38BDF8` |
| Warning | `#F59E0B` / `#FCD34D` |

The two references aren't identical (`#0f0f0f` against `#0F172A`, teal against emerald). Propose one shared token set and get Andy's pick before implementing.

**"Easy buttons"** means:
- large, clearly labelled pill or tab buttons for the main navigation and section jumps
- expand/collapse controls that are obvious and big enough to tap
- the filter and sort buttons (All / Side / Total / Prop, Strongest first / Kickoff / A–Z) as clear toggle groups with a visible active state

## Files LOCKED for this task (style only, no data or content logic)
- `scripts/master-intel/convert_summary.py`: the single-page HTML/CSS shell, including its dark-mode blocks at about lines 726, 1044, 1082 and 1184.
- `scripts/master-intel/build_site.py`: site CSS/JS, header and nav. See the warning above.
- `scripts/master-intel/build.py`: **only** its 19 inline `style="..."` attributes (narrative paragraphs, badges, a few `background:#0f172a` / `#475569` / `#0f766e` chips) and HTML class names. Don't change any data, ranking, verification or text logic.
- `docs/MASTER_INTEL_REPORT_FORMAT.md`: record the new look and the tokens.

The format doc says to change the look only in build.py, convert_summary.py and build_site.py, never in the hosted copy.

## Must not break
- **Anchors and IDs.** Every `#game-...`, `#exp-...`, `#props-...` and section link must still resolve. Tonight's check found 0 broken links across 30 pages.
- **Collapsible `<details>` sections and toolbar buttons:** Expand All / Collapse All / Open Everything / Close Everything, the per-section toggles, and the table sort and filter JS in `assets/report.js`.
- **PDF export** (`scripts/master-intel/export_pdf.py`, Playwright, expands all boxes). Keep a light `@media print` stylesheet so the PDF stays printable.
- **The DOCX export (python-docx) ignores CSS.** Keep the markdown content unchanged.
- **Readability:** WCAG AA contrast on dark backgrounds for body text, links, the star ratings, and the red/green numbers in tables.
- **Usable at phone width:** about 390 px with no horizontal page scroll, because Andy reviews from the app. Wide tables can scroll inside their own box.
- **Roster gate and content are not part of this task.** Don't edit `reports/intel/master-intel-narratives-2026-w04.md`.

## How to work (per UX_EXPERT_PROMPT.md)
1. Read `CLAUDE.md`, then `agents/dev/UX_EXPERT_PROMPT.md`, then this brief. Look at the current pages and the two reference designs. Live Tracker: run `scripts/generate-live-tracker.mjs` or open its last output.
2. **UX audit first**, in the prompt's audit format: issues, quick wins, a proposed token set and a mock layout for the home page, a game page and the expert picks block. Send it to Andy and wait for approval.
3. Implement and rebuild with `python3 scripts/master-intel/build.py --week 4 --date 2026-10-03`.
4. **QA:**
   - Take before/after screenshots at 1300 px and 390 px of `index`, `game-ne-buf`, `experts` and `ranked`.
   - Run a link check over `site/*.html`; Playwright with Chromium works in the Cowork cloud container.
   - Check the browser console for errors.
   - Run the PDF export once.
5. Republish the review artifact to the same URL (read it first, then publish with `url`). Report in the prompt's UX Change Report format.
6. Commit by explicit path only. Never `git add -A`.
   - `.git/HEAD.lock` and `.git/index.lock` are stale on this machine.
   - Commit through a temporary `GIT_INDEX_FILE`, as described in the 10/03 handoffs.

## Activation prompt (paste into a new session)
```
You are the UX Expert agent for "Platinum Rose". Workspace: E:\dev\projects\NFL_Dashboard (branch main).
Read in order: CLAUDE.md -> agents/dev/UX_EXPERT_PROMPT.md -> handoffs/2026-10-03-1945-claude-ux-master-intel-dark-redesign-brief.md.
Task F-mi-dark: restyle the Master Intel report (single-page HTML + multi-page site) to match the main NFL Dashboard
and Live Tracker: dark background, big clear buttons. Style-only; files locked in the brief. Start with the UX audit
and a proposed token set, and wait for Andy's approval before implementing. Ask Andy about the uncommitted
build_site.py changes before touching that file.
```
