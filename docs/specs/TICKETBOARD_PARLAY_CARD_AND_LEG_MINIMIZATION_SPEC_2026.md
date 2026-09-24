# TICKETBOARD ENGINE SPECIFICATION
## Parlay Card Lifecycle, Round Robin Combinatorics, Leg Minimization, and Live Scoring Architecture

**Document Version:** 1.0.0  
**Target Audience:** Engineering Team (Claude / Autonomous Agents / Human Reviewers)  
**Author:** Antigravity Engineering  
**Project:** NFL Dashboard & Live Sunday Tracker  
**Date:** September 13, 2026  
**Primary Files Under Scope:**
- `scripts/generate-live-tracker.mjs` (Standalone compiler & reactive client runtime)
- `data/official-picks/user-placed-wagers-2026.json` (Canonical placed wager dataset)
- `public/schedule.json` (NFL 2026 official schedule & kickoff timestamps)
- `public/live-tracker-sunday.html` / `docs/tracked-wagers/live-tracker-sunday.html` (Generated client artifacts)

---

## 1. Executive Summary & Root Problem Statement

During the NFL Week 1 live Sunday slate, user operations revealed critical UI state failures on the **Ticketboard** tab:
1. **Burnt Leg Minimization Failure:** When a user clicked the fire button (`[🔥]`) on an individual leg within a parlay card, the leg was styled with a burnt icon (`🔥`), but **failed to minimize/hide**. The leg remained fully rendered in the active leg list, cluttering cards with dead legs.
2. **Round Robin (28P-2T) Card Leg Clutter:** On high-leg Round Robin cards (such as the 8-leg, 28-pair parlay card), burnt legs remained visible instead of collapsing into the settled accordion summary strip, forcing the user to visually scan dead legs across dozens of active combinations.
3. **Morning Slate Status Regression:** A cascading state update inside the live score synchronization pipeline caused scoreboard status badges and pacing indicators (`❌ Lost (10-34)`, `🟡 Live`, `🟢 Hit`) to be cleared or reset, making the dashboard appear as if it had "reverted 10 versions back."
4. **Mutual Recursion in Render Pipeline:** An attempt to link leg pacing updates with the master card render loop introduced mutual recursion between `render()` and `updateAllLegPacingGrades()`, resulting in call-stack churn and erratic UI re-renders.

This specification provides the **complete, authoritative, and exhaustive blueprint** of the Ticketboard subsystem. It documents every data structure, DOM ID, CSS class, LocalStorage key, state machine transition, math formula, and event flow required to resolve these issues permanently.

---

## 2. End-to-End Architectural Hierarchy & Pipeline

```
[ data/official-picks/user-placed-wagers-2026.json ]
[ public/schedule.json                            ]
                       │
                       ▼
    [ scripts/generate-live-tracker.mjs ]
       ├── 1. Ingestion & Normalization
       ├── 2. Round Robin Combination Indexing
       ├── 3. Standalone Client Compilation (HTML + CSS + JS)
                       │
                       ▼
 [ public/live-tracker-sunday.html ] (Client Runtime)
       ├── LocalStorage State Hydration (7 Isolated Stores)
       ├── Master Render Loop: render()
       ├── ESPN Scoreboard Streaming: fetchLiveScoreboard() (30s poll)
       ├── ESPN Boxscore Streaming: fetchSummaryForEvent() (60s poll)
       ├── Pacing & Live Grade Evaluation: updateAllLegPacingGrades()
       └── Leg & Card Minimization Engine: applyHideFulfilledLegs()
```

### 2.1 Master Ingestion Schema (`user-placed-wagers-2026.json`)
The source of truth for all placed bets lives in `data/official-picks/user-placed-wagers-2026.json`. Each entry represents a single slip:

```typescript
interface PlacedWager {
  id: string;                      // e.g. "wager_2026_w01_dk_rr_01"
  book: string;                    // "DraftKings", "FanDuel", "BetMGM", "Caesars", "Bovada"
  ticket_type: string;             // "Parlay", "Round Robin", "Single", "Open Parlay"
  game_title?: string;             // e.g. "Week 1 Sunday 8-Leg Round Robin (2s)"
  game?: string;                   // Fallback title
  cash_stake_usd?: number;         // Dollar amount risked from cash balance
  promo_stake_usd?: number;        // Dollar amount risked via bonus bets / promo credits
  odds_american?: string;          // "+23745" or "-110"
  price?: string;                  // Fallback odds
  potential_payout_usd: number;    // Gross payout if all legs / combos hit
  is_split?: boolean;              // 50/50 Alejandro Castro split flag
  status?: "PENDING" | "WON" | "LOST" | "PUSH" | "BURNT";
  round_robin?: {
    combo_size: number;            // k in nCr (e.g. 2 for 2-team pairs)
    total_combinations: number;    // e.g. 28 for 8C2
    stake_per_combination_usd: number; // cash_stake_usd / total_combinations
  };
  legs: PlacedLeg[];
}

interface PlacedLeg {
  key?: string;                    // e.g. "leg_rr_01_1" (auto-generated if missing)
  player?: string;                 // "Bijan Robinson", "Josh Allen" (empty for game lines)
  team?: string;                   // "ATL", "KC", "BAL"
  opponent?: string;               // "CAR", "LAC"
  market: string;                  // "rushing_yards", "touchdown", "spread", "moneyline", "total"
  line?: number;                   // 68.5, -3.5, 47.5
  selection: string;               // "Over 68.5", "ATL Falcons -3.5", "Anytime TD"
  price?: string;                  // "-115", "+140"
  decimal_odds?: number;           // 1.87, 2.40 (computed if missing from price)
  status?: "PENDING" | "WON" | "LOST" | "PUSH";
  actual_stat?: number;            // Settled or live stat value
  source?: string;                 // "Model Edge", "The Favorites", "Sharp Football"
  game?: string;                   // "CAR @ ATL"
}
```

### 2.2 Client In-Memory Representation (`TICKET_CONFIG`)
During page compilation, `scripts/generate-live-tracker.mjs` converts all placed wagers into a client dictionary `window.TICKET_CONFIG`:

```javascript
window.TICKET_CONFIG = {
  [ticketId]: {
    name: "Week 1 Sunday 8-Leg Round Robin (2s)",
    book: "DraftKings",
    type: "Round Robin",
    isPromo: false,
    cashStake: 28.00,
    promoStake: 0.00,
    payout: 2374.50,
    isSettled: false,
    isWin: false,
    isLoss: false,
    isRoundRobin: true,
    rrComboSize: 2,
    rrStakePerCombo: 1.00,
    legs: ["leg_rr_1", "leg_rr_2", "leg_rr_3", ...],
    legsWon: [],                   // Leg keys verified won from JSON
    legsLost: [],                  // Leg keys verified lost from JSON
    legDetails: [
      { key: "leg_rr_1", player: "Bijan Robinson", market: "rushing_yards", decimalOdds: 1.87 },
      ...
    ]
  }
};
```

---

## 3. DOM Component Structure & Element IDs

Every ticket on the Ticketboard renders into a 3-wide responsive CSS grid (`#cards-grid`). Cards follow this strict DOM layout:

```html
<!-- Bet Card Container -->
<div class="bet-card [is-promo] [cashed] [burnt] [collapsed]" 
     id="card-{ticketId}" 
     draggable="true" 
     data-id="{ticketId}" 
     data-is-promo="false" 
     data-is-split="false">

  <!-- 1. Card Header -->
  <div class="card-header">
    <div class="card-title-wrap">
      <div class="card-title">{Game Title or Ticket Name}</div>
      <div class="card-subtitle">{Book} • {Ticket Type}</div>
      
      <!-- Badges Row -->
      <div class="badges-row">
        <span class="badge badge-cash">CASH</span>
        <span class="badge badge-promo" style="display:none;">🎁 PROMO CREDIT</span>
        <span class="badge badge-cash" id="badge-split-{ticketId}" style="display:none;">🤝 50/50 SPLIT</span>
        <span class="cashed-badge" style="display:none;">CASHED</span>
        <span class="burnt-badge" style="display:none;">BURNT</span>
      </div>

      <!-- Quick Bullet Summary Strip -->
      <div class="card-bullet-summary" id="bullet-summary-{ticketId}">
        <span class="badge badge-cash" style="font-size:0.6rem; padding:1px 4px;">$28</span>
        <span id="bullet-payout-{ticketId}" style="color:var(--accent-green); font-size:0.72rem; font-weight:800;">$2,374.50</span>
        <span id="bullet-hits-{ticketId}" style="color:#94A3B8; font-size:0.65rem;">3/8 Hits (1🔥)</span>
        <span class="bullet-temp-badge bullet-temp-green" id="bullet-temp-{ticketId}">🟢 On Pace</span>
      </div>
    </div>

    <!-- Header Control Buttons -->
    <div class="card-controls">
      <button class="btn-alejandro-toggle" id="btn-split-{ticketId}" onclick="toggleAlejandroSplit('{ticketId}')" title="Toggle 50/50 Split">🤝 Split</button>
      <button class="btn-cash-toggle" id="btn-cash-{ticketId}" onclick="toggleManualCash('{ticketId}')" title="Mark Won / Cashed">🏆</button>
      <button class="btn-burn-toggle" id="btn-burn-{ticketId}" onclick="toggleManualBurn('{ticketId}')" title="Mark Burnt / Alive">🔥</button>
      <span class="drag-handle" title="Drag to reorder">⠿</span>
      <button class="btn-card-toggle" onclick="toggleCardCollapse('{ticketId}')">⯆</button>
    </div>
  </div>

  <!-- 2. Card Body -->
  <div class="card-body">
    <!-- Burnt Reason Banner -->
    <div class="burn-reason-banner" id="burn-banner-{ticketId}" style="display:none;">
      <span>🔥</span><strong>Burnt / Eliminated:</strong> Leg marked burnt eliminated this parlay.
    </div>

    <!-- Financial Metrics Strip -->
    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:2px;">
      <span>Stake: <strong>$28.00</strong></span>
      <span>Odds: <strong style="color:var(--accent-cyan);">+23745</strong></span>
      <span>Payout: <strong class="payout-val" id="card-payout-{ticketId}" style="color:var(--accent-green);">$2,374.50</strong></span>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar-wrap">
      <div class="progress-fill" id="prog-{ticketId}" style="width: 37.5%;"></div>
    </div>
  </div>

  <!-- 3. Legs Container & Minimization Strip -->
  <div class="card-legs" id="legs-wrap-{ticketId}">
    <!-- Accordion Minimization Strip (Appears when any leg is Hit or Burnt) -->
    <div class="fulfilled-legs-strip" id="minstrip-{ticketId}" onclick="toggleCardFulfilledLegs('{ticketId}')" style="display: flex;">
      <span>✅ 3 Hit • 🔥 1 Burnt • 4 Active • Click to toggle</span>
      <span id="hit-arrow-{ticketId}">⯈ (Hidden)</span>
    </div>

    <!-- Leg Item Row -->
    <div class="leg-item [checked] [leg-burnt] [leg-missed] [pace-green] [pace-red] [pace-yellow] [pace-pre]" 
         id="leg-{legKey}" 
         data-key="{legKey}" 
         data-player="Bijan Robinson" 
         data-market="rushing_yards" 
         data-target="68.5" 
         data-team="ATL" 
         data-opp="CAR" 
         data-line="68.5" 
         data-selection="Over 68.5" 
         data-game="CAR @ ATL" 
         data-kickoff="1726419600000" 
         data-kickoff-text="1:00 PM" 
         onclick="toggleLeg('{legKey}', '{ticketId}')">
      
      <div class="leg-row">
        <div class="leg-left">
          <span class="leg-icon">⚪</span> <!-- ⚪ = Pending, ✅ = Hit, 🔥 = Burnt, ❌ = Busted -->
          <span class="leg-time-pill" title="Kickoff: 1:00 PM">1:00 PM</span>
          <span><strong>Bijan Robinson • </strong>Over 68.5 Rushing Yds</span>
          <span class="source-tag" title="Source: Model Edge">🎙️ Model Edge</span>
        </div>
        <div class="leg-right" style="display:flex; align-items:center; gap:6px;">
          <!-- Live Pacing Grade Badge -->
          <span class="leg-pace-badge badge-pacing-green" id="pace-badge-{legKey}">🟢 On Pace (45/68.5 • Proj 82)</span>
          <span style="font-size:0.68rem; color:var(--text-muted);">-115</span>
          <!-- Leg Burn Button -->
          <button class="btn-leg-burn" id="btn-burn-leg-{legKey}" onclick="toggleLegBurn('{legKey}', '{ticketId}', event)" title="Mark Leg Burnt / Missed">🔥</button>
        </div>
      </div>

      <!-- Player Prop Stat Gauge (Only rendered for prop legs) -->
      <div class="leg-prop-gauge-wrap" style="margin-top:4px; padding-left:22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.67rem;">
          <span style="color:var(--text-muted); font-size:0.64rem;">Stat Progress</span>
          <span id="card-stat-{legKey}" style="font-weight:700; color:#CBD5E1;">45 / 68.5</span>
        </div>
        <div class="progress-bar-wrap" style="height:3px; margin-top:2px; background:rgba(255,255,255,0.08);">
          <div class="progress-fill" id="card-bar-{legKey}" style="width:65.7%; background:#38BDF8;"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 4. LocalStorage State Management & Lifecycle Contract

The client application maintains seven primary isolated state stores in `localStorage`, parameterized by season week (e.g. `week = 1`):

| Constant Variable | LocalStorage Key | Data Type | Description |
|---|---|---|---|
| `CHECKED_LEGS_KEY` | `sunday_checked_legs_week_{w}` | `{ [legKey: string]: boolean }` | Tracks legs manually clicked as "Hit" (`✅`). |
| `BURNT_LEGS_KEY` | `sunday_burnt_legs_week_{w}` | `{ [legKey: string]: boolean }` | Tracks legs manually marked as "Burnt" (`🔥`) via `.btn-leg-burn`. |
| `CARD_MIN_LEGS_KEY` | `sunday_card_min_legs_week_{w}` | `{ [ticketId: string]: boolean }` | Per-ticket override for collapsing Hit & Burnt legs under the accordion strip. |
| `HIDE_FULFILLED_LEGS_KEY` | `sunday_hide_fulfilled_legs_week_{w}` | `boolean` (JSON string) | Global toggle: `[⚡ Minimize Hit & Burnt Legs]`. |
| `BURNT_KEY` | `sunday_manual_burns_week_{w}` | `{ [ticketId: string]: boolean }` | Tracks entire slips marked manually burnt via card header button. |
| `CASHED_KEY` | `sunday_manual_cashed_week_{w}` | `{ [ticketId: string]: boolean }` | Tracks entire slips marked manually won/cashed via card header button. |
| `SPLIT_KEY` | `sunday_splits_week_{w}` | `{ [ticketId: string]: boolean }` | Tracks slips enrolled in the Alejandro Castro 50/50 split ledger. |
| `COLLAPSED_KEY` | `sunday_card_collapsed_week_{w}` | `{ [ticketId: string]: boolean }` | Tracks entire card collapse state (`⯆` vs `⯈`). |
| `ORDER_KEY` | `sunday_cards_order_week_{w}` | `string[]` | Array of card IDs preserving drag-and-drop user ordering. |

### 4.1 Hydration Lifecycle Rules
1. On initial page boot, all stores are read via `JSON.parse(localStorage.getItem(KEY) || '{}')`.
2. Missing or corrupt keys must safely default to `{}` (or `false` for booleans) without throwing errors.
3. State hydration occurs **prior** to running `render()`, `filterCards()`, or `updateAllLegPacingGrades()`.

---

## 5. The Leg Minimization & Burnt Mechanics Specification

### 5.1 The Fire Button (`[🔥]`) Contract
Each leg row has an individual burn button:
```html
<button class="btn-leg-burn" id="btn-burn-leg-{legKey}" onclick="toggleLegBurn('{legKey}', '{ticketId}', event)" title="Mark Leg Burnt / Missed">🔥</button>
```

When clicked, `toggleLegBurn(legKey, ticketId, event)` executes:
1. `event.stopPropagation()` **must be called** to prevent triggering `toggleLeg(legKey, ticketId)` on the parent row.
2. Toggle `burntLegsState[legKey]`:
   - If previously `true`: delete key from `burntLegsState`.
   - If previously `false` or `undefined`: set `burntLegsState[legKey] = true`.
   - If previously checked as Hit in `checkedState[legKey]`: delete key from `checkedState` (a leg cannot be simultaneously Hit and Burnt).
3. **Automatic Card Minimization Initialization:**
   - If the card has not had an explicit user preference recorded in `cardMinLegsState[ticketId]`, marking a leg as Burnt **must automatically set `cardMinLegsState[ticketId] = true`**.
   - This guarantees that marking a leg burnt immediately collapses that dead leg under the accordion strip without requiring the user to find and toggle the global checkbox!
4. Persist updated `burntLegsState` and `cardMinLegsState` to `localStorage`.
5. Run `render()` to update card totals, payouts, and board partitions.
6. Run `applyHideFulfilledLegs()` to update DOM visibility.

### 5.2 Accordion Strip Lifecycle & Label Formatting
For any card where `fulfilledCount = wonCount + burntCount > 0`:
1. The accordion strip (`#minstrip-{ticketId}`) **must be visible** (`display: flex`).
2. If `fulfilledCount === 0`, the strip **must be hidden** (`display: none`).
3. The strip text **must dynamically summarize** all settled legs:
   ```javascript
   let label = '';
   if (wonCount > 0) label += '✅ ' + wonCount + ' Hit';
   if (burntCount > 0) label += (label ? ' • ' : '') + '🔥 ' + burntCount + ' Burnt';
   if (activeCount > 0) {
     label += ' • ' + activeCount + ' Active • Click to toggle';
   } else {
     label += ' • All Settled • Click to toggle';
   }
   ```
4. The arrow indicator (`#hit-arrow-{ticketId}`) displays:
   - When minimized: `⯈ (Hidden)`
   - When expanded: `⯆ (Visible)`

### 5.3 Leg Visibility Resolution Formula
In `applyHideFulfilledLegs()`, each card's minimization state `isMin` is resolved as:
```javascript
const defaultMin = (config.isRoundRobin && burntCount > 0 && cardMinLegsState[tId] === undefined) 
  ? true 
  : hideFulfilledLegs;

const isMin = cardMinLegsState[tId] !== undefined 
  ? cardMinLegsState[tId] 
  : defaultMin;
```

**CRITICAL REQUIREMENT:**
When `isMin === true`:
- The container `#legs-wrap-{tId}` receives the CSS class `.hide-fulfilled-legs`.
- Every leg element where `isWon === true` OR `isBurnt === true` **must have its inline style set to**:
  ```javascript
  el.style.setProperty('display', 'none', 'important');
  ```
When `isMin === false`:
- The container `#legs-wrap-{tId}` removes `.hide-fulfilled-legs`.
- Every leg element removes its inline display override:
  ```javascript
  el.style.removeProperty('display');
  ```

---

## 6. Parlay Cards vs. Round Robin Lifecycle & Combinatorics

The Ticketboard handles two fundamentally different wager architectures: **Standard Parlays** (all-or-nothing) and **Round Robins** (multi-combination portfolios).

### 6.1 Standard Parlays (Single Tickets & Multi-Leg Parlays)
- **Elimination Rule:** Any single burnt or busted leg (`burntLegsInTicket.length > 0`) **instantly eliminates the entire slip**.
- **Card State:**
  - Card receives class `.burnt`.
  - Payout is reduced to `$0.00`.
  - Progress bar turns red (`.progress-fill.burnt`).
  - Burn reason banner appears:
    `<span>🔥</span><strong>Burnt / Eliminated:</strong> Leg marked burnt eliminated this parlay.`
  - Card automatically migrates from the `#cards-grid` (Live Slips) to `#burnt-cards-grid` (Burnt / Settled Slips).

### 6.2 Round Robin Parlays (e.g. 28P-2T: 8-Leg Round Robin by 2s)
- In a Round Robin, $n$ legs are combined into all possible subsets of size $k$:
  $$\binom{n}{k} = \frac{n!}{k!(n - k)!}$$
  For an 8-leg card with 2-leg pairings ($n = 8, k = 2$):
  $$\binom{8}{2} = 28 \text{ combinations}$$
- **Combinatorial Evaluation Engine:**
  ```javascript
  function getCombinations(arr, k) {
    if (k === 0) return [[]];
    if (!arr || arr.length === 0) return [];
    const head = arr[0];
    const tail = arr.slice(1);
    const withHead = getCombinations(tail, k - 1).map(c => [head, ...c]);
    const withoutHead = getCombinations(tail, k);
    return [...withHead, ...withoutHead];
  }
  ```
- **Live Potential Recalculation Algorithm:**
  1. For each combination $C \in \binom{\text{legs}}{k}$:
     - If **any** leg in $C$ is burnt (`combo.some(lKey => !!burntLegsState[lKey])`), the combination is **dead** and skipped.
     - If no legs in $C$ are burnt, the combination is **alive**:
       $$\text{Combo Multiplier} = \prod_{l \in C} \text{DecimalOdds}(l)$$
       $$\text{Combo Payout} = \text{StakePerCombo} \times \text{Combo Multiplier}$$
       $$\text{Live Potential} = \sum_{C_{\text{alive}}} \text{Combo Payout}(C)$$
  2. If all legs in a surviving combination are Won (`allLegsWon === true`), that combination is cashed:
     $$\text{Cashed Winnings} = \sum_{C_{\text{cashed}}} \text{Combo Payout}(C)$$
- **Elimination Boundary:**
  A Round Robin card **does NOT burn when 1 leg fails**. It remains **alive and active** as long as at least 1 combination survives (`rrAliveCombosCount > 0`).
  - The card payout label dynamically reflects surviving combinations:
    `$1,820.10 (21/28 Combos)`
  - Only when `rrAliveCombosCount === 0` (e.g. when enough legs fail that no $k$-sized pair can be formed) does the entire Round Robin card receive `.burnt` status and move to the burnt section.

---

## 7. Live Scoring & Pacing Pipeline vs. Manual Override Isolation

The dashboard polls live scores from ESPN endpoints every 30 seconds (`fetchLiveScoreboard()`) and athlete boxscores every 60 seconds (`fetchSummaryForEvent()`).

### 7.1 Separation of Concerns: Machine Scores vs. User Overrides
To avoid the regression where live score updates wiped morning grades:
1. **Manual User Overrides are Sovereign:**
   - `checkedState[legKey]` (user clicked Hit) and `burntLegsState[legKey]` (user clicked Burnt) **must NEVER be overwritten by ESPN scoreboard data**.
   - If `burntLegsState[legKey] === true`:
     - Leg always displays `leg-burnt` with icon `🔥`.
     - Pacing badge displays `❌ BURNT`.
     - Evaluation halts; the live score engine does not touch the leg.
   - If `checkedState[legKey] === true`:
     - Leg always displays `checked` with icon `✅`.
     - Pacing badge displays `✅ HIT`.
     - Evaluation halts; the live score engine does not touch the leg.
2. **Machine Live Pacing States:**
   - When a leg has not been manually overridden by the user, the live scoring engine applies non-destructive pacing classes:
     - `pace-green`: Ahead of pace or mathematically hit.
     - `pace-yellow`: On pace / in play.
     - `pace-red`: Behind pace or game ended with stat below line.
     - `pace-pre`: Game not yet kicked off.
   - **CRITICAL RESTRICTION:** The live scoring engine must **never mutate `.checked` or `.leg-burnt`** on DOM elements. It operates exclusively through `pace-*` classes and `#pace-badge-${legKey}` content.

### 7.2 Preventing Mutual Recursion
In `updateAllLegPacingGrades(events)`:
- **NEVER call `render()` inside `updateAllLegPacingGrades()`.**
- `render()` updates ticket-level totals and card positions, then invokes `updateAllLegPacingGrades()` as a leaf operation.
- Re-calling `render()` from within the pacing function creates mutual recursion and overflows the call stack.

---

## 8. Root Cause Analysis: The Exact Bugs in the Codebase

### Bug 1: Burnt Legs Failed to Minimize on Standard Parlays
**Location:** `scripts/generate-live-tracker.mjs`, line 6373  
**Root Cause:**
```javascript
// BUGGY CODE:
const defaultMin = (config.isRoundRobin && burntCount > 0 && cardMinLegsState[tId] === undefined) 
  ? true 
  : hideFulfilledLegs;
const isMin = cardMinLegsState[tId] !== undefined ? cardMinLegsState[tId] : defaultMin;
```
When clicking `[🔥]` on a standard parlay leg:
- `config.isRoundRobin` is `false`.
- `cardMinLegsState[tId]` was `undefined`.
- `hideFulfilledLegs` was `false` (default unless user checked the global checkbox).
- Result: `isMin` evaluated to `false`.
- `applyHideFulfilledLegs()` removed `.hide-fulfilled-legs` from `#legs-wrap-${tId}` and executed `el.style.removeProperty('display')`.
- **The burnt leg remained 100% visible on screen!**

### Bug 2: Missing Card Minimization State on Leg Burn Click
**Location:** `scripts/generate-live-tracker.mjs`, line 3752 (`toggleLegBurn`)  
**Root Cause:**
`toggleLegBurn` updated `burntLegsState[legKey]`, but did not set `cardMinLegsState[ticketId] = true`. Because the card had no recorded minimization preference, it fell back to the inactive global state.

### Bug 3: Live Score Poll Mutating User State Classes
**Location:** `scripts/generate-live-tracker.mjs`, line 5801  
**Root Cause:**
During final game processing, ESPN completed games were executing `el.classList.add('leg-burnt')` and removing `checked`. This corrupted the separation between user intent and scoreboard telemetry, wiping out detailed score badges and making cards misfire when the user clicked controls.

---

## 9. Turnkey Implementation Guide for the Claude Team

To ensure flawless operation, execute the following 4-step patch in `scripts/generate-live-tracker.mjs`:

### Step 1: Update `toggleLegBurn` to Automatically Minimize the Card
In `scripts/generate-live-tracker.mjs`, replace `toggleLegBurn` with:

```javascript
function toggleLegBurn(legKey, ticketId, event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const isCurrentlyBurnt = !!burntLegsState[legKey];
  if (isCurrentlyBurnt) {
    delete burntLegsState[legKey];
  } else {
    burntLegsState[legKey] = true;
    if (checkedState[legKey]) {
      delete checkedState[legKey];
      saveState();
    }
    // Automatically engage card-level minimization if unconfigured
    if (ticketId && cardMinLegsState[ticketId] === undefined) {
      cardMinLegsState[ticketId] = true;
      try { localStorage.setItem(CARD_MIN_LEGS_KEY, JSON.stringify(cardMinLegsState)); } catch (e) {}
    }
  }
  saveLegBurns();
  render();
  updateAlejandroLedger();
  filterCards();
  applyHideFulfilledLegs();
}
```

### Step 2: Unify `defaultMin` in `applyHideFulfilledLegs`
In `scripts/generate-live-tracker.mjs`, update `applyHideFulfilledLegs`:

```javascript
function applyHideFulfilledLegs() {
  for (const [tId, config] of Object.entries(TICKET_CONFIG)) {
    const legsWrap = document.getElementById('legs-wrap-' + tId);
    const strip = document.getElementById('minstrip-' + tId);
    const arrow = document.getElementById('hit-arrow-' + tId);

    if (!legsWrap) continue;

    const totalLegs = (config.legs || []).length;
    let wonCount = 0;
    let burntCount = 0;
    if (config.legs) {
      config.legs.forEach(lKey => {
        const el = document.getElementById('leg-' + lKey);
        const isWon = !!checkedState[lKey] || (config.legsWon && config.legsWon.includes(lKey));
        const isBurnt = !!burntLegsState[lKey];
        if (isWon) wonCount++;
        else if (isBurnt) burntCount++;
      });
    }

    const fulfilledCount = wonCount + burntCount;
    const activeCount = Math.max(0, totalLegs - fulfilledCount);

    if (strip) {
      if (fulfilledCount > 0) {
        strip.style.display = 'flex';
        let label = '';
        if (wonCount > 0) label += '✅ ' + wonCount + ' Hit';
        if (burntCount > 0) label += (label ? ' • ' : '') + '🔥 ' + burntCount + ' Burnt';
        if (activeCount > 0) {
          label += ' • ' + activeCount + ' Active • Click to toggle';
        } else {
          label += ' • All Settled • Click to toggle';
        }
        const firstSpan = strip.querySelector('span:first-child');
        if (firstSpan) firstSpan.innerHTML = label;
      } else {
        strip.style.display = 'none';
      }
    }

    // Default to true if card has burnt legs or global toggle is enabled
    const defaultMin = (burntCount > 0 && cardMinLegsState[tId] === undefined) ? true : hideFulfilledLegs;
    const isMin = cardMinLegsState[tId] !== undefined ? cardMinLegsState[tId] : defaultMin;

    if (isMin) {
      legsWrap.classList.add('hide-fulfilled-legs');
      if (arrow) arrow.textContent = '⯈ (Hidden)';
    } else {
      legsWrap.classList.remove('hide-fulfilled-legs');
      if (arrow) arrow.textContent = '⯆ (Visible)';
    }

    if (config.legs) {
      config.legs.forEach(lKey => {
        const el = document.getElementById('leg-' + lKey);
        if (!el) return;
        const isWon = !!checkedState[lKey] || (config.legsWon && config.legsWon.includes(lKey));
        const isBurnt = !!burntLegsState[lKey];
        if (isMin && (isWon || isBurnt)) {
          el.style.setProperty('display', 'none', 'important');
        } else {
          el.style.removeProperty('display');
        }
      });
    }
  }
}
```

### Step 3: Sanitize `updateAllLegPacingGrades` Against DOM Pollution
Ensure that live game processing in `updateAllLegPacingGrades`:
1. Reads `isBurnt` from `burntLegsState[legKey]` and `isChecked` from `checkedState[legKey]`.
2. Leaves user-settled legs untouched (`return`).
3. Never calls `el.classList.add('leg-burnt')` or `el.classList.add('checked')`.
4. Never calls `render()`.

### Step 4: Recompile and Verify Outputs
Run the generator script to compile both public and docs endpoints:
```bash
node scripts/generate-live-tracker.mjs --week 1
```
Verify that both target files are regenerated cleanly:
- `public/live-tracker-sunday.html`
- `docs/tracked-wagers/live-tracker-sunday.html`

---

## 10. Automated Verification & Test Suite Requirements

The Claude team should run and pass the following integration tests:

1. **Test: Leg Burn Minimization on Parlay Cards**
   - Given a 6-leg parlay card with all legs pending.
   - When clicking `[🔥]` on Leg 1.
   - Assert `burntLegsState['leg_1'] === true`.
   - Assert `#minstrip-{ticketId}` style display is `'flex'`.
   - Assert `#leg-leg_1` has `display: none !important`.
   - Assert active legs (Legs 2–6) remain visible with `display !== 'none'`.

2. **Test: Round Robin Payout Degradation**
   - Given an 8-leg Round Robin by 2s ($28$ combos, $\$2,374.50$ pot).
   - When marking Leg 1 burnt.
   - Assert $7$ combos containing Leg 1 are eliminated ($21$ alive combos).
   - Assert potential payout decreases to exact mathematical product of remaining $21$ combos.
   - Assert card potential label displays `$... (21/28 Combos)`.
   - Assert card remains in `#cards-grid` (NOT moved to `#burnt-cards-grid`).

3. **Test: Accordion Toggle Interaction**
   - Given a card with 2 hit legs and 1 burnt leg currently hidden (`isMin === true`).
   - When user clicks the accordion strip (`#minstrip-{ticketId}`).
   - Assert `cardMinLegsState[ticketId] === false`.
   - Assert all 3 fulfilled legs become visible.
   - Assert arrow text switches to `⯆ (Visible)`.
   - When user clicks the accordion strip again.
   - Assert all 3 fulfilled legs hide immediately.
   - Assert arrow text switches to `⯈ (Hidden)`.

4. **Test: Scoreboard Polling Non-Interference**
   - Given a card with Leg 1 marked burnt by the user.
   - When ESPN scoreboard poll arrives with completed game events.
   - Assert Leg 1 retains `❌ BURNT` badge and `display: none`.
   - Assert active legs update with live score badges (`🟢 Covering (+7.0)` or `🟡 Live`).
   - Assert `checkedState` and `burntLegsState` remain identical before and after the poll.

---

## 11. Appendix: CSS Rules for Leg Minimization

For reference, the styling rules governing leg hiding in `public/live-tracker-sunday.html` are:

```css
/* Container rules */
.card-legs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px 12px;
}

/* Fulfilled accordion strip */
.fulfilled-legs-strip {
  display: none;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.7);
  border: 1px dashed rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 0.67rem;
  font-weight: 700;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  margin-bottom: 4px;
}

.fulfilled-legs-strip:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(148, 163, 184, 0.6);
  color: #F1F5F9;
}

/* CSS fallback for hiding fulfilled legs */
.card-legs.hide-fulfilled-legs .leg-item.checked,
.card-legs.hide-fulfilled-legs .leg-item.leg-burnt,
.card-legs.hide-fulfilled-legs .leg-item.leg-missed {
  display: none !important;
}
```
