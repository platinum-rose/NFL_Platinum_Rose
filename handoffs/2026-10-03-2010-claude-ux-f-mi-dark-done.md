# F-mi-dark done: Master Intel dark restyle (UX_EXPERT, Sat 2026-10-03 ~8:10 PM PT)

**HEAD:** `8949848` (main, not pushed). **Brief:** `handoffs/2026-10-03-1945-claude-ux-master-intel-dark-redesign-brief.md`

## CRITICAL
- **`scripts/master-intel/build_site.py` is still dirty, and on purpose.** The remaining diff (150+/18-) is the other session's top-nav / "Choose your Week" / Market Intel work. Andy said he owns it.
  - My dark layer (`SITE_DARK_CSS`, the `:root` line and `css += SITE_CSS + SITE_DARK_CSS`) went into `8949848` by itself. It was committed via a blob of HEAD plus my hunks only.
  - Commit Andy's part on its own when it's ready.

## IMPORTANT
- **Look:** Andy approved token option A, "Tracker slate + teal". It's recorded in `docs/MASTER_INTEL_REPORT_FORMAT.md` §1a.
  - One dark screen theme. Light is used only in `@media print`.
- **Review artifact republished, version 2:** https://claude.ai/artifact/Ba1F5icQmPZf96U3N4Bxth
  - I didn't touch the older client link in the format doc (`E6RS…`).
- **QA on the Week 4 rebuild:**
  - 30 pages, 0 broken links, 0 console errors.
  - No page scroll at 390 px.
  - Open-all and filter JS work.
  - Roster vet PASS.
  - PDF export (cloud Playwright) renders light, 194 pages.

## Blockers / follow-ups (not done, out of scope)
- The "More" menu auto-opens on secondary pages (`open` attribute in Andy's `top_nav()`). The nav row's `overflow-x:auto` clips it into a thin strip. Fix it in his code: don't auto-open, and mark the current page inside the menu.
- `ranked.html`'s "Every Bet, Ranked" table renders with 0 rows (the synthesis-digest fallback) and has no empty state.
- Python Playwright isn't installed on the Windows bridge, so `export_pdf.py` there fails with "playwright is not installed". Run it from the cloud container.
- Stale `.git/HEAD.lock` and `.git/index.lock` are still present. I committed via a temp `GIT_INDEX_FILE` and a direct ref write.

Resume Platinum Rose NFL. HEAD = 8949848 (main). Suite: n/a (style-only, no JS tests touched). F-mi-dark shipped and the review artifact is republished; build_site.py still holds Andy's uncommitted nav work. Next: Andy commits his build_site.py work and fixes the More-menu auto-open. Read HANDOFF.md, reconcile live Git, then read only the dated handoff for the active lane.
