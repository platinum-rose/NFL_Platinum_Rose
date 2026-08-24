# Handoff: Preseason Matchup Cards UX, Prediction Market Modal & Line History Wiring

**Date**: 2026-08-20 18:00 PT  
**Session Goal**: Resolve user-reported matchup card UX issues (consensus bars, prediction market Kalshi badge, line history modal, betting agent recommendations & evidence, source hyperlinks).

---

## 1. Accomplished Work

### A. Prediction Market [KALSHI] Badge Cleanup & Interactive Modal
* **Root Cause Fixed**: `getContractForGame()` in `src/lib/predictionMarketStore.js` had a loose regex fallback (`/WEEK 1/i`) that caused an irrelevant Atlanta Falcons contract (*"Will Cooper Rush be Starting QB for Atlanta in Week 1?"*) to match every matchup card.
* **Changes**:
  1. Updated `getContractForGame()` to **strictly require an exact 2-team matchup match** (`SF AT LAC` or `SF VS LAC`). Irrelevant contracts no longer display on unrelated matchup cards.
  2. Created `src/components/modals/PredictionMarketModal.jsx` to render contract price in cents, implied probability %, net American odds, and a **direct clickable hyperlink** to `kalshi.com` / `polymarket.com`.
  3. Fixed `americanOdds` scope variable in `PredictionMarketModal.jsx`.

### B. Interactive Line History Modal Wiring
* Created `src/components/modals/LineHistoryModal.jsx` wrapping `LineHistoryChart.jsx`.
* Wired `onShowHistory` prop chain (`MatchupCard` -> `Dashboard` -> `App.jsx`). Clicking **Line History** opens line movement charts for Spread, Total, and Moneyline.

### C. Structured Betting Agent Recommendations & Evidence
* Enhanced `MatchupWizardModal.jsx` (opened via **Analyze Matchup**) with a **Betting Agent Matchup Recommendations & Evidence Box** providing explicit picks and supporting data points for:
  * **Spread Pick**: Backed by Action Network cash % vs ticket % splits and analyst consensus counts.
  * **Total Pick**: Backed by money split ratios and preseason pace models.
  * **Moneyline Pick**: Backed by QB depth chart rotation advantage and coaching SU records.

### D. Direct Clickable Hyperlinks for Intel Bullets
* Updated `MatchupWizardModal.jsx` so Substack notes, Twitter/beat updates, and training camp intel bullets render as **clickable hyperlinks (`<a target="_blank">`)** with `ExternalLink` icons leading directly to the source URLs.

---

## 2. Outstanding Watch Item / Unresolved Bug

### Consensus Bars Displaying Default 50/50
* **Status**: *UNRESOLVED (Requires deep dive in fresh session)*.
* **Observation**: Although `public/betting_splits.json` was updated with 78 multi-key entries (`401873285`, `game_id`, `SF_LAC`, `SF_at_LAC`), and `useSchedule.js` was updated to merge `splitsData` with `localStorage`, some matchup cards in the browser still show default 50/50 bars.
* **Next Session Investigation**:
  1. Check if `localStorage` key `PR_STORAGE_KEYS.SPLITS.key` (`nfl_betting_splits_v1`) has cached legacy empty objects that take precedence or if `splits[game.id]` lookup needs a normalized key accessor in `MatchupCard.jsx`.
  2. Add a `console.log` / debug state in `MatchupCard.jsx` to verify exact structure of `game.splits` at render time.

---

## 3. Modified Files

- `src/App.jsx` — Imported and mounted `LineHistoryModal` & `PredictionMarketModal`; wired `onShowHistory` and `onShowPmContract`.
- `src/components/dashboard/Dashboard.jsx` — Passed `onShowHistory` and `onShowPmContract` to `MatchupCard`.
- `src/components/dashboard/MatchupCard.jsx` — Added `onShowPmContract` prop; cleaned duplicate Total bar JSX block; fixed Kalshi contract matching button.
- `src/components/modals/MatchupWizardModal.jsx` — Re-instated React hooks import; added Betting Agent Recommendations & Evidence box; added clickable source links.
- `src/components/modals/PredictionMarketModal.jsx` *(NEW)* — Modal for Kalshi/Polymarket contract details & external links.
- `src/components/modals/LineHistoryModal.jsx` *(NEW)* — Modal wrapping `LineHistoryChart.jsx`.
- `src/lib/predictionMarketStore.js` — Enforced strict 2-team game matching for prediction market contracts.
- `src/hooks/useSchedule.js` — Merged `public/betting_splits.json` with `localStorage` splits state.

---

## 4. Verification

* **Build Compiler**: `npx esbuild src/App.jsx --loader:.jsx=jsx` passed with **0 errors**.
* **Unit Tests**: `npx vitest run tests/unit/preseasonBankrollTest.test.js` passed (9/9 unit tests passing; 1,082 overall unit tests passing).
