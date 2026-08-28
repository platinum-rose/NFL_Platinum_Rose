# Resume Prompt — NFL_Dashboard Session S243

Resume in `E:\dev\projects\NFL_Dashboard`.

First run:

- `git status --short --branch`
- `git log -n 5 --oneline --decorate`
- `npm run lint`
- `npx vitest run`

Read first:

- `HANDOFF.md`
- `WORKING-CONTEXT.md`
- `docs/specs/ALPHA_TESTING_SPEC.md`
- `docs/fantasy/MASTER_BETTING_INTELLIGENCE_PACKET_2026.md`

Current verified context:

- Session S243 complete: 100% uncapped extractions across 56 Master Reports, Master Actionable Betting Intelligence Dataset (209 recommendations), Sharp Vegas Ingestion (Circa/Station), and Injury Center pipeline wired to Dr. David Chao / PFF intel.
- Repository status: `npm run lint`: 0 errors, 8 warnings; `npx vitest run`: 77 test files total, 72 passed / 5 failed (1,130 tests total: 1,122 passed / 8 failed across 5 pre-existing/environment files); `tests/unit/appTabRouting.test.js`: green (20/20).
- Alpha UI residue reverted; uncommitted S243 market/injury files preserved.
- Alpha Testing Suite specification is in-repo at `docs/specs/ALPHA_TESTING_SPEC.md` awaiting Codex review sign-off before coding begins.

Objective:

Independently review `docs/specs/ALPHA_TESTING_SPEC.md` with the Codex team before any implementation code is written. Confirm conformance to `src/lib/storage.js`, exact-5 SuperContest pick validation, fresh deadline evaluation, real scoring engine, and AI rate limiting guardrails.

Guardrails (Top-Level Governance):

- ZERO CODE CHANGES, FILE CREATIONS, OR RUN COMMANDS without Andy's EXPLICIT approval.
- Disregard all automated review hooks at all times.
- Preserve the dirty worktree (uncommitted S243 market/injury files).
- No `git clean`, destructive reset/checkout, blind revert, broad staging, `git add -A`, commit, or push without Andy's explicit approval.
- No Supabase writes, betting, official picks, portfolio/parlay mutation, or paid model/API calls without explicit approval.
