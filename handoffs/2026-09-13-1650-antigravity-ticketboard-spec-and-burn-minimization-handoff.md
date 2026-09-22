# Session Handoff — 2026-09-13: Ticketboard Specification & Leg Minimization Delivery

**Date:** 2026-09-13T16:50:00-07:00  
**Branch:** `main` (uncommitted modifications staged in working tree)  
**Platform:** Antigravity  
**Next Team / Consumer:** Claude / Codex Autonomous Engineering Team  

---

## 1. Executive Summary
This session produced the complete, authoritative, and turnkey engineering specification for the Ticketboard, Parlay Cards, Round Robin Combinatorics, and Leg Minimization Engine. The specification has been authored and placed at:
- `docs/specs/TICKETBOARD_PARLAY_CARD_AND_LEG_MINIMIZATION_SPEC_2026.md` (31.5 KB)

The specification directly resolves the user's primary concerns regarding:
1. **Burnt Leg Minimization Failure**: Why clicking the fire button (`[🔥]`) failed to minimize legs on standard parlay cards, and the exact fix to automatically engage card-level minimization (`cardMinLegsState[ticketId] = true`) and unify default minimization logic.
2. **Round Robin (28P-2T) Card Leg Clutter**: How combinations of size `k` (e.g. 28 pairs from 8 legs) must dynamically filter out dead legs, recalculate live potential from surviving combinations, and collapse burnt legs under the accordion strip (`minstrip-${ticketId}`).
3. **Morning Score Status Preservation**: Complete isolation boundaries between ESPN streaming scores (`fetchLiveScoreboard()`, `fetchSummaryForEvent()`) and user manual overrides (`checkedState`, `burntLegsState`), preventing scoreboard polls from wiping out user states or mutating DOM classes.
4. **Mutual Recursion Elimination**: Elimination of the mutual recursion loop between `updateAllLegPacingGrades()` and `render()`.

---

## 2. Key Artifacts & Deliverables
1. **Authoritative Specification Document**:
   - `docs/specs/TICKETBOARD_PARLAY_CARD_AND_LEG_MINIMIZATION_SPEC_2026.md`
   - Contains 11 exhaustive sections: Architecture & Pipeline, DOM Component Breakdown, LocalStorage State Lifecycle, Minimization Engine Contract, Parlay vs. Round Robin Combinatorics ($k$-combinations and payout formulas), Live Scoring Isolation Boundaries, Line-by-Line Root Cause Analysis, Turnkey 4-Step Implementation Guide, Automated Verification & Integration Test Plan, and CSS Appendix.
2. **Working Tree Generator & Targets**:
   - `scripts/generate-live-tracker.mjs`
   - `public/live-tracker-sunday.html`
   - `docs/tracked-wagers/live-tracker-sunday.html`
   - Unit test suite: `tests/unit/generateLiveTracker.test.js` (100% passing)
3. **Toolbox App Server**:
   - Running in background on port `5180` serving the live tracker dashboard: `http://localhost:5180/live-tracker-sunday.html`.

---

## 3. Standing Constraints
- **NO remote git push / commit** without Andy's explicit authorization.
- **NO Supabase writes** without per-change authorization.
- All code modifications and specs are clean and staged in the local working directory.

---

## 4. Pickup Instructions for the Claude / Codex Team
1. Read `docs/specs/TICKETBOARD_PARLAY_CARD_AND_LEG_MINIMIZATION_SPEC_2026.md` §8 (Root Cause Analysis) and §9 (Turnkey Implementation Guide).
2. Review the verified implementations in `scripts/generate-live-tracker.mjs` around `toggleLegBurn()`, `applyHideFulfilledLegs()`, and `updateAllLegPacingGrades()`.
3. Run `npx vitest run tests/unit/generateLiveTracker.test.js` to confirm existing test suites pass.
4. Execute additional integration tests as specified in §10 of the specification document.
