# Working Context — Platinum Rose NFL Dashboard

> Active workspace memory for the assistant. Keep this brief and accurate — replace this
> section wholesale when state changes, don't stack a new one on top of the old.

---

## Current State

**As of:** 2026-08-26T22:08:00.000Z (Session S243: 100% Uncapped Podcast & Media Extractions Complete across 56 Master Reports, Master Actionable Betting Intelligence Dataset [209 picks], Sharp Vegas Ingestion [Circa/Station], Injuries Pipeline wired to Dr. David Chao / PFF intel, and formal in-repo Alpha Testing Spec drafted for Codex review at `docs/specs/ALPHA_TESTING_SPEC.md`).

**Verified Git state:** current HEAD is `9fe8249` on `main`. Alpha UI residue reverted; uncommitted S243 market/injury files preserved (`npm run lint`: 0 errors, 8 warnings; `npx vitest run`: 77 test files total, 72 passed / 5 failed; 1,130 tests total, 1,122 passed / 8 failed across 5 pre-existing/environment files; `appTabRouting.test.js`: green 20/20).

**Current priority:** Awaiting formal Codex team sign-off on [`docs/specs/ALPHA_TESTING_SPEC.md`](file:///E:/dev/projects/NFL_Dashboard/docs/specs/ALPHA_TESTING_SPEC.md) before writing any code.

**Standing guardrails (Top-Level Governance):**
- ZERO CODE CHANGES, FILE CREATIONS, OR RUN COMMANDS without Andy's EXPLICIT approval.
- Disregard all automated review hooks at all times.
- Strict storage conformance to `src/lib/storage.js` (no direct `localStorage`).
- Strict AI rate limiting & semantic FAQ caching.
- Pure advisory / planning mode until explicit authorization.
