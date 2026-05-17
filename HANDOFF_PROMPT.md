# HANDOFF_PROMPT.md — NFL Platinum Rose

> Rolling session handoff. Read this first in a fresh session, then read WORKING-CONTEXT.md.

## Last Session Summary

- Date: 2026-05-17
- Branch: main
- Sprint state: DS-2 complete, DS-3 complete, DS-4 ready for live validation

## Critical Status

- DS-2 schedule spine shipped with playoff representation and duplicate-ID fix for TBD playoff matchups.
- DS-3 futures breadth shipped with availability receipts; migration 008 applied and verified.
- DS-4 schema and ingest are implemented; migration 009 is now confirmed applied.
- Next session should execute DS-4 live ingest and validate table inserts.

## What To Do Next

1. Run `npm run ingest-research-intel`.
1. Verify rows exist in `research_intel_notes` and `research_pick_signals`.
1. Review latest receipt in `.nfl/receipts/`.
1. If validation is clean, commit any remaining DS-4 verification updates and push.

## Resume Command

```text
Resume Platinum Rose NFL on main. DS-2 and DS-3 are complete. DS-4 migration 009 is applied; execute research intel live ingest and validate research_intel_notes + research_pick_signals, then continue sprint from TASK_BOARD.md.
```

## Notes

- Treat `.nfl/receipts/` and `supabase/.temp/` as local artifacts unless explicitly needed in git history.
- Read order for fresh session: CLAUDE.md -> HANDOFF.md -> WORKING-CONTEXT.md -> TASK_BOARD.md.
