# Resume Prompt - NFL_Dashboard Checkpoint 5 / Archive Cleanup Review

Resume in `E:\dev\projects\NFL_Dashboard`.

First run:

- `git status --short --branch`
- `git log -n 8 --oneline --decorate`
- `git branch -vv`
- `git diff --stat -- .gitignore HANDOFF.md HANDOFF_PROMPT.md WORKING-CONTEXT.md docs handoffs .project-delegation.md CONTEXT_HANDOFF_PROTOCOL.md RESUME_PROMPT.md Complete_with_Docusign_Personal_Use_-_Andrew_NFL_Dashboard_Yahoo_API_agreement.pdf template_trace.txt`

Read first:

- `HANDOFF.md`
- `WORKING-CONTEXT.md`
- `handoffs/2026-08-22-1155-codex-checkpoint5-archive-cleanup-handoff.md`
- `docs/audits/2026-08-21-codex-independent/CHECKPOINT_5_SUMMARY.md`
- `docs/audits/2026-08-21-codex-independent/CODEX_CHECKPOINT_3_REVIEW.md`
- `docs/audits/2026-08-21-codex-independent/CHECKPOINT_4_SUMMARY.md`
- `docs/audits/2026-08-21-codex-independent/UNIFIED_REPAIR_PLAN_FOR_CLAUDE.md`

Current verified context:

- Checkpoints 1-4 are Codex-approved.
- Checkpoint 5 item 14 correction pass was Codex-approved for the state where
  ebook/license files were restored to `docs/`, `_to_delete_checkpoint5_item14/`
  was gitignored, and the 12 build snapshot dirs were empty.
- The repo changed again after that: Antigravity performed a broader non-code
  archive cleanup that moved many tracked docs and handoffs into
  `docs/archive/` and `handoffs/archive/`.
- That broader archive cleanup is not Codex-approved yet.
- `docs/audits/2026-08-21-codex-independent/CHECKPOINT_5_SUMMARY.md` is now
  partly stale because the ebook/license files were moved again into
  `docs/archive/`.

Objective:

Independently review the broad archive cleanup before any commit, staging, or
next checkpoint. Confirm whether the tracked deletions from root `docs/`,
tracked deletions from root `handoffs/`, Yahoo PDF relocation, root file
archive, and tracked ebook/license archive are intentional and safe.

Immediate checks:

- Compare `docs/archive/` additions to root `docs/` deletions.
- Compare `handoffs/archive/` additions to root `handoffs/` deletions.
- Decide whether `docs/The Genius of Desperation.epub` and
  `docs/TheGeniusofDesperati_9781641250825_3892848.acsm` should stay archived
  or be restored.
- Verify `.gitignore`'s `_to_delete*/` rule and the remaining
  `_to_delete_checkpoint5_item14/` disk-cleanup residual.
- Update handoff docs only after the archive layout is approved.

Guardrails:

- Preserve the dirty worktree.
- No `git clean`, destructive reset/checkout, blind revert, broad staging,
  `git add -A`, commit, or push without Andy's explicit approval.
- No Supabase writes, betting, official picks, portfolio/parlay mutation,
  recommendation persistence, Yahoo work, paid model/API call, or fresh
  synthesis without explicit approval.
- Stage narrowly by workstream only after review.
