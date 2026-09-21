# NFL Sunday Live Tracker — Technical Specification

> **Script**: [`generate-live-tracker.mjs`](file:///E:/dev/projects/NFL_Dashboard/scripts/generate-live-tracker.mjs) (4,727 lines)
> **Test**: [`generateLiveTracker.test.js`](file:///E:/dev/projects/NFL_Dashboard/tests/unit/generateLiveTracker.test.js) (92 lines)
> **Output**: `public/live-tracker-sunday.html` + `docs/tracked-wagers/live-tracker-sunday.html`
> **Framework**: Node.js build-time generation → Standalone zero-dependency HTML/CSS/JS
> **Spec Version**: 1.0 — September 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Ingestion Layer](#2-data-ingestion-layer)
3. [Build-Time Processing](#3-build-time-processing)
4. [Page Structure & Layout](#4-page-structure--layout)
5. [Tab 1: Live Ticketboard](#5-tab-1-live-ticketboard)
6. [Tab 2: Player Cheat Sheet & Gauges](#6-tab-2-player-cheat-sheet--gauges)
7. [Tab 3: SuperContest Portfolio & Matrix](#7-tab-3-supercontest-portfolio--matrix)
8. [Tab 4: Fantasy Football Bench Monitor](#8-tab-4-fantasy-football-bench-monitor)
9. [Sidebar Components](#9-sidebar-components)
10. [Live Streaming Integration (ESPN)](#10-live-streaming-integration-espn)
11. [Client-Side State Management](#11-client-side-state-management)
12. [Drag-and-Drop Systems](#12-drag-and-drop-systems)
13. [Modal Dialogs](#13-modal-dialogs)
14. [CSS Architecture & Design System](#14-css-architecture--design-system)
15. [Testing Strategy](#15-testing-strategy)
16. [Known Limitations & Constraints](#16-known-limitations--constraints)
17. [Security & Data Sensitivity](#17-security--data-sensitivity)

---

## 1. Architecture Overview

### 1.1 Build-Time / Runtime Separation

The tracker uses a **two-phase architecture**:

```
┌─────────────────────────────────────────────────┐
│  BUILD TIME (Node.js)                           │
│                                                 │
│  JSON Data Files ──► generateLiveTracker() ──►  │
│  ┌──────────────────────────────────────────┐   │
│  │ Complete Standalone HTML Document        │   │
│  │ - Embedded <style> (1,390 lines of CSS)  │   │
│  │ - Embedded <script> (2,155 lines of JS)  │   │
│  │ - Server-rendered card templates         │   │
│  │ - Inline JSON data (TICKET_CONFIG,       │   │
│  │   SC_MATRIX)                             │   │
│  └──────────────────────────────────────────┘   │
│                    │                            │
│                    ▼                            │
│  Writes to 2 output paths (public/ + docs/)    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  CLIENT TIME (Browser)                          │
│                                                 │
│  Standalone HTML opened directly in browser     │
│  - NO external JS/CSS dependencies              │
│  - NO build tooling or bundler required          │
│  - All interactivity via inline vanilla JS       │
│  - State persisted to localStorage              │
│  - ESPN API polled via browser fetch()           │
└─────────────────────────────────────────────────┘
```

### 1.2 CLI Interface

```bash
node scripts/generate-live-tracker.mjs [--week <num>] [--out <path>]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `--week` | `1` | NFL week number. Filters wagers and selects SuperContest lines file |
| `--out` | Both `public/` and `docs/` | Custom single output path |

### 1.3 Module Exports

```javascript
export async function generateLiveTracker({ week = 1, outPaths = [...] } = {})
// Returns: { html: string, wagersCount: number }
```

---

## 2. Data Ingestion Layer

### 2.1 Data Sources (Build-Time)

| Source | Path | Fallback | Shape |
|--------|------|----------|-------|
| **Placed Wagers** | `data/official-picks/user-placed-wagers-2026.json` | ❌ Required | `Array<Wager>` — filtered by `w.week === week` |
| **Schedule** | `public/schedule.json` | ⚠️ Warning, empty array | `Array<Game>` with `visitor`, `home`, `spread`, `total`, `time` |
| **SuperContest Lines** | `data/supercontest/week-{NN}-lines.json` | Falls back to `data/supercontest/latest.json` | `{ games: Array<ContestLine> }` |
| **SuperContest Market** | `data/supercontest/live-market-comparison.json` | ⚠️ Warning, empty map | `{ games: Array<MarketGame> }` |
| **Yahoo Fantasy Rosters** | `data/fantasy/yahoo-live-rosters.json` | ⚠️ Warning, skeleton object | `{ leagues, unifiedBench, targetKickers, leaguesNeedingKicker, uniqueBenchPlayers }` |

### 2.2 Core Data Shapes

#### Wager Object
```typescript
interface Wager {
  id: string;
  week: number;
  game_title: string;
  game: string;
  book: string;
  ticket_type: string;
  ticket_number?: string;
  category: string;
  is_promo_credit: boolean;
  funding_type: 'cash' | 'promo_credit';
  cash_risk_usd?: number;
  promo_credit_stake_usd?: number;
  stake_usd: number;
  potential_payout_usd: number;
  odds_american: string;
  price: string;
  status: 'ACTIVE' | 'SETTLED';
  result?: 'win' | 'loss';
  is_split?: boolean;
  legs: Array<{
    key?: string;
    player?: string;
    team?: string;
    market: string;
    selection: string;
    line?: number;
    price?: string;
    source?: string;
    expert?: string;
    status?: 'WON' | 'LOST' | 'PENDING';
  }>;
}
```

#### Yahoo Fantasy League
```typescript
interface FantasyLeague {
  leagueKey: string;       // e.g., "423.l.117200"
  leagueName: string;
  teamName: string;
  needsKickerDrop: boolean;
  startingKickerName?: string;
  matchup: { opponentName: string; myScore: number; opponentScore: number };
  bench: Array<FantasyPlayer>;
  starters: Array<FantasyPlayer>;
}

interface FantasyPlayer {
  playerId: string;
  playerKey: string;
  name: string;
  displayPosition: string;   // QB, RB, WR, TE, K, DEF, LB, DB, etc.
  selectedPosition: string;   // Starters only — actual roster slot
  nflTeam: string;
  headshotUrl?: string;
  game: {
    window: 'early' | 'afternoon' | 'snf' | 'mnf' | 'concluded';
    matchup: string;
    time: string;
    status: string;
  };
}
```

### 2.3 Build-Time Data Transformations

1. **Wager Partitioning**: Wagers are split into `liveWagers` (active) and `settledWagers` (status=SETTLED, result=loss). Each group renders in its own `cards-grid`.

2. **Player Props Extraction**: All wager legs with a `player` field are extracted into a deduplicated `playerPropsMap`, keyed by player name, accumulating all prop markets and targets.

3. **SuperContest Matrix Assembly**: Contest lines are merged with live DraftKings market data and the static `SC_RANKINGS` dictionary (10 ranked picks with grades A+/A, model edges, CLV analysis, and expert consensus notes).

4. **Fantasy League Default Ordering**: Leagues matching "cc bowl" or "champions league" are sorted to the bottom via a stable sort ([L88-94](file:///E:/dev/projects/NFL_Dashboard/scripts/generate-live-tracker.mjs#L88-L94)).

5. **Financial Totals**: `totalCashRisk`, `totalPromoRisk`, and `totalPotentialPayout` are computed by iterating all wagers and distinguishing promo vs. cash.

---

## 3. Build-Time Processing

### 3.1 `TICKET_CONFIG` Serialization

A JavaScript object is assembled and `JSON.stringify`'d into the HTML `<script>` tag. Each ticket entry contains:

```javascript
TICKET_CONFIG[bet.id] = {
  name, book, ticketNumber, isPromo,
  cashStake, promoStake, payout, type,
  status, result, isSettled, isLoss,
  legsWon: [legKey, ...],   // Pre-settled leg keys
  legs: [legKey, ...]        // All leg keys
};
```

### 3.2 `SC_MATRIX` Serialization

The 16-game SuperContest matrix list is serialized inline for client-side ATS spread margin computation during live score updates.

### 3.3 `renderCard()` Helper

Server-side function ([L302-369](file:///E:/dev/projects/NFL_Dashboard/scripts/generate-live-tracker.mjs#L302-L369)) that generates a complete bet card HTML string. Handles:
- Promo vs. cash badge rendering
- Pre-burnt state for settled losses
- Drag handle, collapse toggle, Alejandro split toggle, manual burn button
- Leg list with per-leg status icons (✅/❌/⚪)
- Fulfilled legs minimization strip
- Source attribution tags (`🎙️ Expert Intel`)

### 3.4 File Output

```javascript
for (const outPath of outPaths) {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, html, 'utf8');
}
```

Default writes to both:
- `public/live-tracker-sunday.html` (dev server)
- `docs/tracked-wagers/live-tracker-sunday.html` (GitHub Pages)

---

## 4. Page Structure & Layout

### 4.1 Master Grid

Three-column CSS Grid layout (`.app-layout`):

```
┌──────────────┬─────────────────────────────────┬──────────────┐
│  LEFT SIDEBAR │        MAIN CONTENT             │ RIGHT SIDEBAR│
│  (290px)      │  (flexible, minmax(0, 1fr))     │ (300px)      │
│  Sticky       │  4 Tab Views                    │ Sticky       │
│  Game Board   │                                 │ Alejandro    │
│  (10 games)   │                                 │ Split Ledger │
└──────────────┴─────────────────────────────────┴──────────────┘
```

### 4.2 Top Header Ticker

Fixed summary bar with:
- Pulsing green live dot + title
- Financial aggregates: Cash Risk, Promo Credit, Potential Win, Total Cashed
- Countdown timer for next ESPN poll (`⏱️ (Xs)`)
- Action buttons: Global Refresh, Reset, Grade & Settle Slate, History

### 4.3 Tab Navigation

Four tabs managed by `showTab(tabName)`:

| Tab | ID | Label | Badge |
|-----|----|-------|-------|
| Tickets | `tab-btn-tickets` | 🎫 Live Ticketboard | `(N Active)` |
| Players | `tab-btn-players` | ⚡ Player Cheat Sheet & Gauges | `(N Players)` |
| SuperContest | `tab-btn-supercontest` | 🏆 SuperContest | `(Top 5 & 16-Game Matrix)` |
| Fantasy | `tab-btn-fantasy` | 🏈 Fantasy Football | `(N Drop Alerts)` — amber |

Active tab is persisted to `localStorage` and restored on reload.

### 4.4 Responsive Breakpoints

| Breakpoint | Effect |
|------------|--------|
| `> 1400px` | 3-column card grid, 3-column app layout |
| `900–1400px` | 2-column card grid, 3-column layout |
| `< 900px` | Single column everything |
| `< 600px` | Archive metrics: 2 columns instead of 3 |

---

## 5. Tab 1: Live Ticketboard

### 5.1 Filter Bar

Filters: All, Cash, Promo Credits, Alejandro Castro Split, Pending, Cashed, 🔥 Burnt
Actions: Collapse All, Expand All, Hide Burnt (checkbox), Minimize Hit Legs (checkbox), 🧹 Clear Settled, ➕ Add Sunday Slip

### 5.2 Active Slips Section

- Live indicator dot with count
- 3-wide responsive card grid (`cards-grid`)
- Each card generated by `renderCard()` — see §3.3

### 5.3 Card Anatomy

```
┌─────────────────────────────────────────┐
│ Card Header                             │
│   Title • Book • Ticket Type            │
│   [CASH/PROMO] [OPEN PARLAY] [🤝 SPLIT]│
│   Controls: 🤝 Split | 🔥 | ⠿ | ⯆     │
├─────────────────────────────────────────┤
│ Card Body                               │
│   Stake: $X.XX  Odds: +XXX  Payout: $Y │
│   [═══════════════ Progress Bar ════════]│
├─────────────────────────────────────────┤
│ Fulfilled Legs Strip (collapsible)      │
│   ✅ N of M Legs Hit • Click to toggle  │
├─────────────────────────────────────────┤
│ Leg 1: ✅ Player - Selection  🎙️ Source │
│ Leg 2: ❌ Player - Selection  🎙️ Source │
│ Leg 3: ⚪ Player - Selection  🎙️ Source │
└─────────────────────────────────────────┘
```

### 5.4 Burnt / Dropped Section

Below a decorative divider (`burnt-divider-line`), settled losses are rendered in their own `burnt-cards-grid` with red styling, strikethrough payouts, and "BURNT" badges.

### 5.5 Card Interactivity

| Action | Handler | Effect |
|--------|---------|--------|
| Toggle leg | `toggleLeg(legKey, ticketId)` | Flip ✅/⚪, recalculate progress, update ledger |
| Toggle split | `toggleAlejandroSplit(ticketId)` | Add/remove from 50/50 split ledger |
| Manual burn | `toggleManualBurn(ticketId)` | Force burn/revive card visually |
| Collapse | `toggleCardCollapse(ticketId)` | Hide card body + legs |
| Drag reorder | Drag handle `⠿` | Reorder cards within grid, persisted |

---

## 6. Tab 2: Player Cheat Sheet & Gauges

### 6.1 Purpose

Tracks individual player prop stat lines across all placed wagers. Each player card shows their accumulated prop targets with live progress bars.

### 6.2 Filter & Sort Controls

**Filters**: All, 🎯 Needs Stats, ✅ Fulfilled
**Sort**: Needs Stats First (default), Progress % High→Low, Player Name A→Z, Team A→Z, Custom (Drag & Drop)
**Actions**: ⚡ Collapse Fulfilled, Collapse All, Expand All, Auto-Collapse (checkbox), Hide Fulfilled (checkbox)

### 6.3 Player Card Structure

```
┌────────────────────────────────────────┐
│ ⠿ ⯆  Patrick Mahomes  (KC)   0/3    │
├────────────────────────────────────────┤
│  Pass Yds 275+           0 / 275      │
│  [════════════ 0% ═══════════════]    │
│  Pass TDs 2+             0 / 2        │
│  [════════════ 0% ═══════════════]    │
│  Rush Yds 15+            0 / 15       │
│  [════════════ 0% ═══════════════]    │
└────────────────────────────────────────┘
```

### 6.4 Auto-Collapse & Partitioning

When `autoCollapseFulfilled` is on, players hitting 100% of props are automatically collapsed. The `partitionPlayers()` function moves them below a "FULFILLED PLAYERS" divider.

---

## 7. Tab 3: SuperContest Portfolio & Matrix

### 7.1 Structure

Three sections within this tab:

1. **Executive Top 5 Card** — Five ranked A+ picks with full analysis cards
2. **Alternates Strip (#6–#10)** — Five alternate A picks in compact card format
3. **Complete 16-Game ATS Matrix** — Full table of all contest matchups

### 7.2 Top 5 Card Components

Each card contains:
- Team logo (ESPN CDN), rank badge (`#1 BEST BET`), grade badge
- Pick label (e.g., "Carolina Panthers +3.0")
- Market intelligence strip: Contest Locked Line vs. Live DraftKings Spread vs. CLV edge vs. Model Edge
- Rationale & expert consensus summary
- Live game status with real-time ATS cover badge
- "My Card" checkbox (max 5 picks enforced)

### 7.3 16-Game Matrix Table

| Column | Description |
|--------|-------------|
| # | Row number |
| Matchup & Kickoff | Away @ Home with logos, kickoff time |
| Official Contest Spread | Locked SuperContest line |
| Live Market (DraftKings) | Current DK spread + O/U |
| CLV / Stale Line Edge | Closing line value analysis |
| Consensus & Rationale | Expert alignment + reasoning |
| My Card | Toggle buttons for each team side |
| Live ATS Status | Real-time cover badge (Covering/At Risk/Push/Upcoming) |

### 7.4 Filter Toolbar

Filters: All 16 Games, ⭐ Official Top 5, 🔄 Alternates, ⚡ Free CLV/Stale Lines, 🏈 Sunday Live Slate, ✅ Concluded

### 7.5 5-Pick Card Tracker

- Counter widget showing `N / 5 Picks` selected
- Max 5 enforced — shows toast warning on overflow
- Clear Card button with confirm dialog
- Selection state synced across checkboxes, card highlights, and matrix buttons

### 7.6 `SC_RANKINGS` Data Dictionary

Static object with 10 ranked picks ([L98-168](file:///E:/dev/projects/NFL_Dashboard/scripts/generate-live-tracker.mjs#L98-L168)):
- `rank`, `grade`, `isTop5`/`isAlt`
- `pickTeam`, `pickLabel`, `opponent`, `isHome`, `lockedSpread`
- `dkSpread`, `modelEdge`, `clvText`
- `consensus` (expert show alignment)
- `reason` (analytical rationale)

---

## 8. Tab 4: Fantasy Football Bench Monitor

### 8.1 Purpose

Real-time monitoring of Yahoo fantasy rosters across 5 leagues to inform bench player drop decisions for SNF/MNF kicker pickups.

### 8.2 Header Banner

- Title, league count, kicker alert count
- Strategy callout explaining the Sunday kicker workflow
- Metrics strip: Total Leagues, Bench Stashes, Early/Late Candidates, Prime Drops, Decided Kept

### 8.3 Filter Controls

**Window Filter**: All Windows, 1:00 PM Early, 4:25 PM Afternoon, SNF, MNF, Concluded (Thu)
**Priority Filter**: All, 🔴 Prime Drops, 🟡 Evaluating, 🟢 Keepers
**Other**: 🔒 Hide Kept (checkbox), Expand/Collapse All, Player Search input

### 8.4 League Group Structure

Each league renders as a collapsible group (`.ff-league-group`):

```
┌────────────────────────────────────────────────┐
│ ⠿ ▲▼ ⯆  The League (Team Name)               │
│         ⚠️ 1 DROP NEEDED (No Kicker)           │
│         vs Opponent (Score)  [5 Bench Stashes]  │
│                              [Yahoo Add/Drop ↗] │
├────────────────────────────────────────────────┤
│  Bench Player Cards Grid                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Player 1 │ │ Player 2 │ │ Player 3 │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                │
│  ⭐ Starting Lineup (N Starters) ▼             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Starter1 │ │ Starter2 │ │ Starter3 │       │
│  └──────────┘ └──────────┘ └──────────┘       │
└────────────────────────────────────────────────┘
```

### 8.5 Bench Player Card Anatomy

```
┌──────────────────────────────────────────┐
│ ⯆ [Headshot] Patrick Mahomes             │
│              QB • KC     [🟡 Evaluating] │
│                          [🔒 Keep]       │
├──────────────────────────────────────────┤
│ KC @ IND • Sun 1:00 PM  (Pre)           │
│                                          │
│ Pass Production Gauge    0 / 200 Pass Yds│
│ [═══════════════ 0% ═══════════════════] │
│                                          │
│ ⚠️ 1 Drop Needed in League [Drop ↗]     │
└──────────────────────────────────────────┘
```

### 8.6 Starter Card Anatomy

Compact cards with position-colored left border accent:

```
┌──────────────────────────────────────┐
│ [Headshot] Player Name        [QB]   │
│            KC • KC @ IND     (Pre)   │
│ Pass Production Gauge  0/225 Pass Yds│
│ [═══════════════ 0% ════════════════]│
└──────────────────────────────────────┘
```

Position color coding:
| Position | Color | Hex |
|----------|-------|-----|
| QB | Magenta | `#EC4899` |
| RB | Emerald | `#10B981` |
| WR | Sky Blue | `#38BDF8` |
| TE | Purple | `#A855F7` |
| K | Amber | `#F59E0B` |
| DEF | Slate | `#64748B` |
| IDP | Yellow | `#EAB308` |
| FLEX | Cyan | `#06B6D4` |

### 8.7 Position-Specific Stat Targets

| Position | Stat Label | Target | Unit |
|----------|-----------|--------|------|
| QB | Pass Production Gauge | 225 (starter) / 200 (bench) | Pass Yds |
| RB | Opportunity Gauge | 60 (starter) / 35 (bench) | Yds |
| WR | Target / Receiving Gauge | 50 (starter) / 40 (bench) | Rec Yds |
| TE | Target / Receiving Gauge | 35 (starter) / 30 (bench) | Rec Yds |
| K | Scoring / Kicking Gauge | 7 | Pts |
| DEF | Defensive Resistance Gauge | 8 | Pts / Sacks |
| IDP (LB/DB/DL) | Tackles & Playmaking Gauge | 6 (starter) / 5 (bench) | Tackles |
| FLEX | FLEX Opportunity Gauge | 45 | Yds |

### 8.8 Keep/Hide System

- **Keep Toggle** (`toggleKeepPlayer`): Locks a player as "not droppable" — card gets green left border, badge shows "🟢 Kept (Locked)", button label changes to "🔓 Kept"
- **Hide Kept** (`toggleHideKept`): When checked, kept players are hidden from the bench grid
- State persisted to `FF_KEPT_KEY` in localStorage

### 8.9 Drop Priority Escalation (Live)

During ESPN polling, bench player cards automatically escalate:
- **🟡 Evaluating** → **🔴 Prime Drop**: When game is at halftime or later (period ≥ 3) or completed, AND player's window is `early` or `afternoon`
- **🟡 Evaluating** → **🟡 In Game (Clock Q#)**: When game is live but before halftime
- Kept players are immune to escalation

### 8.10 Target Kickers Radar

Below the league groups, a dedicated section lists SNF/MNF kicker pickup candidates with:
- Name, team, game, venue
- Quick-add buttons linking directly to Yahoo Add/Drop for each league

### 8.11 League Reordering

Three reorder mechanisms:
1. **▲/▼ Buttons**: Move league up/down one position
2. **Drag Handle** `⠿`: Full drag-and-drop reorder between league groups
3. **Default Sort**: CC Bowl / Champions League pushed to bottom at build time

Order persisted to `FF_LEAGUE_ORDER_KEY`.

---

## 9. Sidebar Components

### 9.1 Left Sidebar — Sunday Game Board

Sticky panel showing top 10 games from `schedule.json`:
- Away @ Home with spread and O/U
- Game clock updated live from ESPN (element IDs: `game-clock-{id}`)

### 9.2 Right Sidebar — Alejandro Castro Split Ledger

50/50 cost-sharing tracker for split wagers:
- Weekly Bill Balance (running total)
- Split Stakes (50%), Cashed Share (50%), Potential Win Share
- Split Ledger History drawer (expandable table)
- Per-ticket split chips container

---

## 10. Live Streaming Integration (ESPN)

### 10.1 Polling Mechanism

```javascript
async function fetchLiveScoreboard() {
  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
  const data = await res.json();
  updateSuperContestLiveScores(data.events);
  updateFantasyLiveScores(data.events);
}
```

| Property | Value |
|----------|-------|
| **Endpoint** | `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` |
| **Polling Interval** | 15 seconds (countdown timer in header) |
| **Countdown Ticker** | `tickCountdown()` via `setInterval(tickCountdown, 1000)` |
| **Error Handling** | `console.warn`, silently continues polling |
| **CORS** | ESPN scoreboard API is publicly accessible (no auth needed) |

### 10.2 `updateSuperContestLiveScores(events)` ([L2808-2918](file:///E:/dev/projects/NFL_Dashboard/scripts/generate-live-tracker.mjs#L2808-L2918))

For each ESPN event:
1. Extract `home`/`away` competitors, abbreviations, scores
2. Determine status: `isCompleted`, `isLive`, `clock`, `period`, `shortDetail`
3. Match against `SC_MATRIX` entries by team abbreviations
4. Calculate ATS spread margin: `favMargin = (favScore + line) - dogScore`
5. Update matrix table elements: score text + cover badge class/content
6. Update Top 5 and Alternate card elements: score + cover badge

Cover badge states:
| State | Class | Icon | Example |
|-------|-------|------|---------|
| Covering (live) | `sc-cover-covering` | 🟢 | `🟢 CAR +2.5 (7:32 Q3)` |
| At Risk (live) | `sc-cover-atrisk` | 🔴 | `🔴 CHI +2.5 (7:32 Q3)` |
| Push (live) | `sc-cover-push` | 🟡 | `🟡 PUSH (7:32 Q3)` |
| Won (final) | `sc-cover-covering` | ✅ | `✅ WON (+6.5)` |
| Lost (final) | `sc-cover-atrisk` | ❌ | `❌ LOST (-3.5)` |
| Upcoming | `sc-cover-upcoming` | 🕒 | `🕒 Upcoming` |

### 10.3 `updateFantasyLiveScores(events)` ([L3281-3421](file:///E:/dev/projects/NFL_Dashboard/scripts/generate-live-tracker.mjs#L3281-L3421))

Two responsibilities:

#### A. Team Game Clock Updates
Builds `teamStatusMap` keyed by team abbreviation with `isCompleted`, `isLive`, `isHalfOrLater`, `period`, `clock`, `statusDesc`. Updates bench and starter card clock elements.

#### B. Player Stat Progress Bars
Extracts `athleteLeaderMap` from ESPN `comp.leaders[]`:
- Iterates `comp.leaders[].leaders[]` for `passingYards`, `rushingYards`, `receivingYards`
- Keys by `athlete.displayName`, `fullName`, and `shortName` (lowercase)
- Updates progress bar width: `pct = min(100, round((statVal / target) * 100))`
- Updates stat text: `"45 / 50 Rec Yds (4-45-1)"`
- Adds `.cashed` class when target met (≥100%)

> [!WARNING]
> **ESPN Leaders Feed Limitation**: The scoreboard endpoint only returns the **top leader** per stat category per game (1 passing, 1 rushing, 1 receiving per game). Most bench/starter players will NOT receive live stat updates from this feed. A boxscore endpoint would be needed for comprehensive per-player stats — this was not implemented.

#### C. Drop Priority Auto-Escalation
For non-kept bench players in `early`/`afternoon` windows whose game reaches halftime or later:
- Card class changed from `hold-drop` → `prime-drop`
- Badge changed to `🔴 Prime Drop`
- `data-drop-priority` attribute updated

---

## 11. Client-Side State Management

### 11.1 localStorage Keys

There are 24 storage-key constants in total: 19 week-scoped (`week_${week}`) to prevent cross-week collisions, and 5 fantasy-specific keys that persist across weeks.

**Week-Scoped Keys (19):**

| Key Constant | localStorage Key Pattern | Data Shape | Purpose |
|--------------|--------------------------|------------|---------|
| `STORAGE_KEY` | `sunday_tracker_state_week_N` | `{ legKey: boolean }` | Leg check/uncheck state |
| `SPLITS_KEY` | `sunday_splits_week_N` | `{ ticketId: boolean }` | Alejandro 50/50 split toggles |
| `BURNS_KEY` | `sunday_burns_week_N` | `{ ticketId: boolean }` | Manual burn overrides |
| `HIDE_BURNT_KEY` | `sunday_hide_burnt_week_N` | `boolean` | Hide burnt filter toggle |
| `HIDE_FULFILLED_KEY` | `sunday_hide_fulfilled_week_N` | `boolean` | Hide fulfilled player filter |
| `ARCHIVE_KEY` | `sunday_settled_archive_week_N` | `Array<Snapshot>` | Settled game archive history |
| `ORDER_KEY` | `sunday_card_order_week_N` | `string[]` | Ticket card DOM order |
| `COLLAPSED_KEY` | `sunday_card_collapsed_week_N` | `{ ticketId: boolean }` | Collapsed ticket cards |
| `PLAYER_ORDER_KEY` | `sunday_player_order_week_N` | `string[]` | Player card DOM order |
| `PLAYER_COLLAPSED_KEY` | `sunday_player_collapsed_week_N` | `{ playerId: boolean }` | Collapsed player cards |
| `PLAYER_SORT_KEY` | `sunday_player_sort_week_N` | `string` | Active sort mode |
| `AUTO_COLLAPSE_KEY` | `sunday_auto_collapse_week_N` | `boolean` | Auto-collapse fulfilled |
| `SPLIT_HISTORY_KEY` | `sunday_split_history_week_N` | `Array<SplitRecord>` | Alejandro split settlement log |
| `BOARD_CLEARED_KEY` | `sunday_board_cleared_week_N` | `boolean` | Whether settled slips cleared |
| `CUSTOM_SLIPS_KEY` | `sunday_custom_slips_week_N` | `Array<CustomSlip>` | Dynamically added wagers |
| `ACTIVE_TAB_KEY` | `sunday_active_tab_week_N` | `string` | Last active tab name |
| `HIDE_FULFILLED_LEGS_KEY` | `sunday_hide_fulfilled_legs_week_N` | `boolean` | Global minimize hit legs |
| `CARD_MIN_LEGS_KEY` | `sunday_card_min_legs_week_N` | `{ ticketId: boolean }` | Per-card fulfilled leg state |
| `SC_PICKS_KEY` | `sunday_supercontest_picks_week_N` | `{ team: boolean }` | Selected SuperContest picks |

**Fantasy-specific keys** (NOT week-scoped — persist across weeks):

| Key Constant | localStorage Key | Data Shape | Purpose |
|--------------|------------------|------------|---------|
| `FF_KEPT_KEY` | `nfl_live_tracker_ff_kept_v2` | `{ cardKey: boolean }` | Kept player decisions |
| `FF_HIDE_KEPT_KEY` | `nfl_live_tracker_ff_hide_kept_v2` | `boolean` | Hide kept toggle |
| `FF_LEAGUE_COLLAPSE_KEY` | `nfl_live_tracker_ff_league_collapse_v2` | `{ leagueKey: boolean }` | League collapse states |
| `FF_CARD_COLLAPSE_KEY` | `nfl_live_tracker_ff_card_collapse_v2` | `{ cardKey: boolean }` | Fantasy card collapse states |
| `FF_LEAGUE_ORDER_KEY` | `nfl_live_tracker_ff_league_order_v1` | `string[]` | League group DOM order |

### 11.2 Initialization Flow (`loadState()`) ([L2479-2562](file:///E:/dev/projects/NFL_Dashboard/scripts/generate-live-tracker.mjs#L2479-L2562))

```
DOMContentLoaded
  └─► loadState()
       ├─ Read all 18+ localStorage keys
       ├─ Merge pre-settled legsWon into checkedState
       ├─ applyBoardClearState()
       ├─ applyCollapsedState() / applyPlayerCollapsedState()
       ├─ setupDragAndDrop() × 3 (tickets, players, leagues)
       ├─ restoreCardOrder() / restorePlayerCardOrder() / restoreLeagueOrder()
       ├─ showTab(activeTab)
       ├─ applyHideFulfilledLegs()
       ├─ applySuperContestPicks()
       ├─ filterAndRenderFantasy()
       ├─ render() + updateAlejandroLedger()
       ├─ filterCards() + filterAndSortPlayers() + partitionPlayers()
       ├─ fetchLiveScoreboard() ← Initial poll
       └─ setInterval(tickCountdown, 1000) ← Start 15s countdown
```

---

## 12. Drag-and-Drop Systems

Three independent drag-and-drop systems, each following the same pattern:

### 12.1 Pattern

```
setupXDragAndDrop()
  ├─ For each draggable element:
  │   ├─ dragstart: Guard (skip buttons/inputs), add .dragging, setData
  │   ├─ dragend: Remove .dragging, clean .drag-over, saveOrder()
  │   ├─ dragover: preventDefault, add .drag-over
  │   ├─ dragleave: Remove .drag-over
  │   └─ drop: preventDefault, DOM reorder (insertBefore), saveOrder()
  └─ restoreXOrder(): Read saved order from localStorage, re-append in order
```

### 12.2 Implementations

| System | Target Elements | Container | Order Key | Guard Elements |
|--------|----------------|-----------|-----------|----------------|
| **Tickets** | `.bet-card` | `#cards-grid` + `#burnt-cards-grid` | `ORDER_KEY` | buttons, inputs, `.leg-item` |
| **Players** | `.player-box-card` | `#player-sheet-container` | `PLAYER_ORDER_KEY` | buttons, inputs |
| **Leagues** | `.ff-league-group` | `#ff-leagues-container` | `FF_LEAGUE_ORDER_KEY` | buttons, links, inputs, `.ff-player-card`, `.ff-starter-card`, `details` |

**Player D&D Side Effect**: Automatically switches sort mode to `'custom'` and updates the `<select>` element.

---

## 13. Modal Dialogs

### 13.1 Add Slip Modal (`#add-slip-modal`)

**Purpose**: Dynamically add custom wagers to the live board without modifying source JSON.

**Fields**:
- Ticket Title (text)
- Sportsbook (text, default "Custom")
- Stake (number, default $10)
- Potential Payout (number, default $20)
- Funding Type (select: Cash / Promo)
- Legs (textarea, format: `Selection • Source/Expert` per line)

**Submit** (`submitNewSlip()`):
- Generates unique ID `custom_${Date.now()}`
- Registers in `TICKET_CONFIG`
- Creates full card DOM element and prepends to `#cards-grid`
- Re-runs `setupDragAndDrop()`
- Persists to `CUSTOM_SLIPS_KEY`

### 13.2 Performance Archive Modal (`#archive-modal`)

**Purpose**: Grade, settle, and archive the day's wager results for historical tracking.

**Features**:
- `gradeAndSettleSlate()`: Takes a point-in-time snapshot of all ticket states
- Metrics grid: Settled Slips, Net P&L, Cash Risk ROI, Ticket Win Rate, Props Hit Rate, Alejandro Balance
- Historical log with cumulative totals
- Export JSON download
- Clear Archive (with confirm)

### 13.3 Alejandro History Drawer

Inline drawer in the right sidebar (not a modal overlay):
- Settle table: Ticket, Stake, Status, Balance
- Mark All Settled button

---

## 14. CSS Architecture & Design System

### 14.1 Design Tokens (`:root` Custom Properties)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-main` | `#0B1120` | Page background |
| `--bg-card` | `#151F32` | Card backgrounds |
| `--bg-card-hover` | `#1C2A44` | Card hover |
| `--border-color` | `#273752` | Default borders |
| `--accent-blue` | `#3B82F6` | Primary action, active tabs, drag outlines |
| `--accent-green` | `#10B981` | Success, live indicator, cash won |
| `--accent-gold` | `#F59E0B` | SuperContest branding, warnings |
| `--accent-cyan` | `#38BDF8` | Informational, odds, hover accents |
| `--accent-purple` | `#818CF8` | Category accents |
| `--accent-indigo` | `#4F46E5` | Alejandro split branding |
| `--accent-red` | `#EF4444` | Burnt/lost, prime drops |
| `--text-main` | `#F8FAFC` | Primary text |
| `--text-muted` | `#94A3B8` | Secondary text |

### 14.2 Color Identity Per Domain

| Domain | Primary Accent | Secondary |
|--------|---------------|-----------|
| SuperContest | Gold `#F59E0B` | Cyan `#38BDF8` |
| Fantasy Football | Emerald `#10B981` | Sky Blue `#38BDF8` |
| Tickets / Wagers | Blue `#3B82F6` | Green/Red states |
| Alejandro Split | Indigo `#4F46E5` | Purple `#818CF8` |

### 14.3 Typography

- Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Sizes range from `0.55rem` (micro badges) to `1.35rem` (section icons)
- Weights: 600 (semibold), 700 (bold), 800 (extrabold), 900 (black/headlines)
- `font-variant-numeric: tabular-nums` on financial tickers

### 14.4 Animations

| Name | Duration | Usage |
|------|----------|-------|
| `pulse` | 1.5s infinite | Green live dot pulsing box-shadow |
| `livePulse` | 2s infinite | Scale/opacity breathing for indicators |
| `spinRefresh` | 0.75s linear infinite | 🔄 refresh button spin |
| `toastFade` | 3s forwards | Toast slide-up and fade-out |

### 14.5 Responsive Grid Patterns

| Class | Columns | Min Width |
|-------|---------|-----------|
| `.cards-grid` | `repeat(3, minmax(0, 1fr))` | Fixed 3-wide |
| `.sc-top5-grid` | `repeat(auto-fit, minmax(310px, 1fr))` | Fluid |
| `.sc-alternates-grid` | `repeat(auto-fit, minmax(240px, 1fr))` | Fluid |
| `.ff-bench-grid` | `repeat(auto-fill, minmax(320px, 1fr))` | Fluid |
| `.ff-starters-grid` | `repeat(auto-fill, minmax(260px, 1fr))` | Fluid |
| `.ff-kicker-radar-grid` | `repeat(auto-fit, minmax(280px, 1fr))` | Fluid |
| `.players-grid` | `repeat(auto-fit, minmax(320px, 1fr))` | Fluid |
| `.ff-metrics-grid` | `repeat(auto-fit, minmax(150px, 1fr))` | Fluid |

---

## 15. Testing Strategy

### 15.1 Test File

[`tests/unit/generateLiveTracker.test.js`](file:///E:/dev/projects/NFL_Dashboard/tests/unit/generateLiveTracker.test.js) — Single comprehensive test using Vitest.

### 15.2 Test Coverage

The test runs `generateLiveTracker({ week: 1, outPaths: [testOut] })` and validates:

1. **Build Success**: `res.wagersCount > 0`
2. **Element Presence**: 58 `expect(html).toContain()` assertions covering:
   - All 4 tab wrappers and tab buttons
   - Key runtime JS functions (29 function names)
   - CSS classes and DOM element IDs
   - Feature-specific identifiers (fantasy, SuperContest, drag-and-drop)
3. **JavaScript Syntax Validation**: Extracts the `<script>` body via regex and compiles it through `new vm.Script(scriptBody)` — catches any syntax errors in the embedded JS
4. **SSR Partitioning**: Verifies both `liveCount ≥ 1` and `burntCount ≥ 1` to confirm proper wager partitioning
5. **Cleanup**: Deletes the test output file safely

### 15.3 Test Command

```bash
npx vitest run tests/unit/generateLiveTracker.test.js
```

Full suite (108 files, 1,647 tests): `npx vitest run`

### 15.4 Testing Gaps

> [!IMPORTANT]
> **Areas not covered by the current test suite:**
> - No client-side JavaScript behavior tests (DOM manipulation, localStorage, event handlers)
> - No ESPN API integration tests (fetch mocking, response parsing)
> - No visual regression tests
> - No performance/load tests (the uncompressed HTML is ~700KB)
> - No cross-browser compatibility tests
> - Fantasy league ordering and drag-and-drop logic not tested beyond presence checks
> - Modal submission flows not tested

---

## 16. Known Limitations & Constraints

### 16.1 ESPN Data Granularity

The ESPN scoreboard API only provides **game leaders** (top passer, rusher, receiver per game). This means:
- Progress bars will only update for players who are the current game leader in their stat category
- Most bench/starter players will show 0% progress even when producing stats
- A boxscore API (`/apis/site/v2/sports/football/nfl/summary?event=ID`) would provide per-player stats but is not currently integrated

### 16.2 File Size

The generated HTML is ~700KB uncompressed — a single monolithic file. This includes:
- ~1,390 lines of CSS
- ~2,160 lines of JavaScript
- All wager/fantasy/SuperContest data serialized inline
- No code splitting, lazy loading, or external asset loading

### 16.3 Template String Complexity

The file uses deeply nested JavaScript template literals for HTML generation. The `fantasyData.leagues.map()` callback spans ~280 lines of template with nested maps for bench and starter cards. This is fragile to edit and difficult to debug.

### 16.4 No Hot Reload

The HTML is generated once at build time. Changes to source data require re-running `node scripts/generate-live-tracker.mjs`. There is no file watcher or dev server integration.

### 16.5 Yahoo API Dependency

Fantasy roster data requires a prior run of the Yahoo API fetch pipeline to populate `data/fantasy/yahoo-live-rosters.json`. The tracker generator itself does not call Yahoo APIs.

---

## 17. Security & Data Sensitivity

### 17.1 Data Classification

| Data | Sensitivity | Exposure |
|------|-------------|----------|
| Wager amounts / stakes | **Medium** — personal financial data | Embedded in HTML, served locally |
| Yahoo roster data | **Low** — fantasy game data | Serialized in HTML |
| ESPN API responses | **None** — public API | Fetched client-side |
| Alejandro split ledger | **Medium** — financial relationship data | localStorage + HTML |

### 17.2 No Authentication

- The generated HTML has no authentication or access control
- ESPN scoreboard is a public API (no key required)
- All state is in browser localStorage (no server persistence)
- The HTML files are committed to `docs/` for GitHub Pages — **consider whether financial data exposure is acceptable**

### 17.3 localStorage Trust Boundary

All client-side state relies on localStorage, which:
- Can be cleared by the user at any time
- Has a ~5-10MB browser limit
- Is same-origin scoped (safe from cross-site access)
- Is NOT encrypted
