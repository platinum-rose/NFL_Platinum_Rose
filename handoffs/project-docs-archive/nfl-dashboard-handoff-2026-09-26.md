# NFL Dashboard handoff — Sat 2026-09-26 22:15 PT

**Repo:** `E:\dev\projects\NFL_Dashboard`, branch `main`, pushed through `6443fa9` (in sync with origin).
**Full handoff:** `handoffs/2026-09-26-2215-claude-master-intel-template-supercontest-handoff.md` (resume prompt inside).

## Done
- Master Intel Report **template v1 locked** (sent to clients). Build: `python3 scripts/master-intel/build.py --week <N> --date <capture-date>` then `python3 scripts/master-intel/export_pdf.py <html>`. Spec `docs/MASTER_INTEL_REPORT_FORMAT.md`, steps `docs/MASTER_INTEL_REPORT_RUNBOOK.md`, skill `.agents/skills/master-intel-report/SKILL.md`. Exports html/pdf/docx/md/json.
- SuperContest companion report builds in the same run (needs `data/supercontest/week-<NN>-lines.json`).
- Week 3 card morning/afternoon parlays rebuilt to Andy's templates; night ML is the hedge placeholder.

## Next session
Design the weekly SuperContest cadence around the new report and save Week 3's joint five to `data/supercontest/locked-card-week-3.json`. Other open items: DK saves for 14 games, Drive archive, 739211245 open spots, ledger update after placement, MNF card, B-YT-OAUTH before ~10/3.
