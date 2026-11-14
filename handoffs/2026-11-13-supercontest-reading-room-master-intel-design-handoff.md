# Handoff: SuperContest Reading Room and Master Intel layout exploration

**Date:** November 13, 2026
**For:** Claude team working in `E:/dev/projects/NFL_Dashboard`
**Requested by:** Andy
**Scope:** design review and a separate Master Intel layout proposal; preserve the current production report formats.

## Start here

Read the repository's `AGENTS.md`, `CLAUDE.md`, and `HANDOFF.md`, then reconcile the live branch, Git status, and any active work before acting. This is a shared, heavily modified checkout; preserve other teams' work. The branch at this handoff was `claude/w5-prop-cards-2026-10-11`, HEAD `c1f7caa0`; both can change. Do not reset, clean, stash, broad-stage, or overwrite another team's work. Follow the project lock and coordination rules for any shared files.

## Decision: SuperContest Reading Room

Andy selected **Reading Room** as the preferred direction for the SuperContest Intel report. **Amanda's feedback is still pending.** This is a design-review selection, not approval to replace the locked SuperContest v4 template or change its builders.

- Reading Room review copy: `E:/data/impeccable-pilot/week10-reading-concept.html`
- Original Week 10 SuperContest report: `E:/dev/projects/NFL_Dashboard/dist/nfl_week10_master_packet/nfl_week10_supercontest_intelligence_summary.html`
- Alternate dark comparison concept, for context only: `E:/data/impeccable-pilot/week10-workspace-concept.html`
- Review status: `E:/data/impeccable-pilot/DESIGN-REVIEW-STATUS.md`

Reading Room uses a light report surface, larger type and more reading space. On desktop the pick sheet starts collapsed at the bottom and can be opened; the repeated report heading is hidden when a reader switches to another section. The review copy has separate browser storage for its pick sheet, identity and navigation state. The original Week 10 SuperContest format gate was run and **passed**; the review copy is an experimental HTML artifact and has not passed a full acceptance or accessibility audit.

The preview retained baseline report content and scripts except for its presentation, isolated storage names and initial pick-sheet state. Basic tab navigation and one pick-sheet selection worked at 1440px and 390px without page-wide overflow. That is not comprehensive validation. The Impeccable source scan still flagged heading-level and small-text issues in the Reading Room concept; assess them in the rendered report, rather than automatically applying every stylistic warning. Test the full pick-sheet lifecycle, links, filters, tables, keyboard operation, contrast, phone behavior, and print/export if the concept is later advanced.

**Do not apply this concept to the canonical SuperContest template while Amanda's feedback is outstanding.** Once feedback has been considered and Andy explicitly approves any final format changes, implement the approved changes in the canonical builders (`scripts/master-intel/build.py`, `scripts/master-intel/sc_layout.py`, and/or `scripts/master-intel/convert_summary.py` as appropriate), not by editing a generated report. Update the format record and run the report's gates and interaction checks. Preserve the spread-only rule, Pitch / Pushback, attribution, standings, filters, pick-sheet behavior, and distinctions between AI proposals and Andy/Amanda's official five.

## New assignment: Master Intel layout concept

Andy wants the Claude team to **craft an updated Master Intel layout for review**, using Impeccable's design guidance to improve readability and UX efficiency. This authorizes a separate prototype or review copy and design recommendations. It does **not** authorize replacing the locked Master Intel format, changing the production builder, publishing, or altering weekly picks/data without a subsequent approval. The SuperContest Reading Room is a useful reference for clarity and generous reading space, not a requirement that the Master report use the same colors or structure. Master Intel has a broader audience and substantially different tasks, so design for its content and casual readers.

Start with:

1. `docs/MASTER_INTEL_REPORT_FORMAT.md` — locked v2 format, audience, hierarchy, content and current styling; read the current sections and later amendments, not just the opening summary.
2. `docs/MASTER_INTEL_REPORT_RUNBOOK.md` — Friday/Saturday stages, gates, data freshness and QA.
3. The existing Week 10 Master report, if still present: `dist/nfl_week10_master_packet/nfl_week10_master_betting_intelligence_summary.html`. Verify that it is the correct current build and identify its timestamp and limitations before using it as a visual baseline. Week 10 data are a snapshot, not current prices or betting advice.
4. The existing Week 10 SuperContest Reading Room concept above, with its pending-review status.
5. The relevant builder/rendering sources, especially `scripts/master-intel/build.py` and `scripts/master-intel/convert_summary.py`; inspect others as needed. The generated outputs are not the canonical implementation.

### Product and design requirements

- The report is for a casual all-Sunday reader. Keep plain English, definitions, source links, accurate timestamps, caveats and honest descriptions of estimates. The reader needs to find **what to bet**, then **why**, then the reference material.
- Preserve recommendations versus leans, official versus proposed bets, prices and capture times, ticket explanations and linked legs, Pitch / Pushback, source attribution, known gaps, disclaimer, and all sections and required data. Never manufacture current lines, evidence or player status.
- Explore a materially better layout, not merely a font or color adjustment: make recommendations, Slate Status and the main navigation easier to find; reduce repeated headers and unnecessary nesting; improve scan paths through tables, matchup narratives and source details. Preserve collapse behavior and deep links unless a proposed change is clearly documented for review.
- Make the reading experience usable on both desktop and a 390px phone; wide tables may scroll within their own containers, but the page itself should not scroll sideways. Use readable type, deliberate heading levels and spacing, clear focus and selection states, sufficient contrast, and appropriately sized controls. Evaluate the actual information density: don't hide meaningful caveats or make comparisons harder for the sake of whitespace.
- The current approved Master on-screen style is dark Tracker slate + teal, with light reserved for print. **A light or otherwise different screen theme is permitted in a clearly labeled concept for Andy's review**; it is not approved as the new production standard. Retain the current format in official builds until Andy approves a change. Keep print and multi-format exports in mind.
- Keep the full weekly process independent of the design exercise. Friday and Saturday builds still require the applicable GREEN final gate and roster checks, source freshness, and the report's normal QA; an attractive prototype does not validate the underlying data.

### Using Impeccable

An isolated local copy of the Impeccable guidance and engine from this evaluation is at `E:/data/impeccable-pilot/skills/impeccable/`; its Windows engine cache is `E:/data/impeccable-pilot/cache/`. It was **not installed as a project-wide or global skill**, and no automatic project hook was approved or enabled. The local `PRODUCT.md` in `E:/data/impeccable-pilot/` describes the SuperContest experiment, so do not treat it as authoritative context for the separate Master report.

Read the skill's `SKILL.md` and the relevant design guidance (notably `reference/operate.md` and `reference/craft-floor.md`) if using it; follow the Claude environment's applicable instructions. Useful principles here: treat the report as a reading and task surface; prioritize information hierarchy, understandable navigation, familiar controls, purposeful spacing, and readable tables; inspect real rendered pages at their intended sizes; review detector findings with judgment and preserve the project's explicit requirements. Treat automatic findings as leads, not mandates. Avoid enabling hooks, live-edit modes, global installs, or network-dependent features without first understanding their effects and the project's normal approval boundaries.

Keep the prototype isolated, plainly labeled as an experiment, and separate from the official report and its browser storage. Preserve any existing private report content locally; do not publish, push, send, or upload it without Andy's authorization. If copying the real report to a prototype, protect existing pick-sheet/bookmark state and check that the copy does not silently share or overwrite it. Do not hand-edit the canonical generated report as the final solution.

## Deliver back to Andy

Provide a clickable reviewable concept (or genuinely distinct options if useful), a short before/after explanation of what changed and why, desktop and phone screenshots, and a list of any unresolved accessibility or functional issues. State what was actually tested and what remains untested. Explain the proposed path to update the canonical generators and validate HTML, print/PDF and other exports **only after Andy approves the final format**. Keep Amanda's SuperContest feedback separate from approval of the Master concept.
