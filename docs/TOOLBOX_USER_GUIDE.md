# 🏈 NFL Toolbox • Graphical User Guide & Weekly Cadence Manual

Welcome to the **NFL Toolbox Desktop Dashboard** (`http://127.0.0.1:4567`). This guide provides a visual map of the dashboard interface, explains each UI element, and details how to operate your weekly NFL sports betting and data intelligence workflows.

---

## 🖥️ Layout Overview & Visual Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  🏈 NFL DASHBOARD TOOLBOX  [● SERVER ACTIVE]                           ⏱ 20:30 EDT   PORT: 4567   ⚙   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ⚡ QUICK FILTERS:  [All Tasks]  [Ingestions]  [Pipelines]  [Reports & Trackers]  [Verify]  [↺ Reset]   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│  📅 WEEKLY CADENCE ROADMAP (Drag cards by ⠿ to reorder • Click ⯆ to collapse)                        │
│                                                                                                        │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────┐    │
│  │ 📅 TUESDAY: Line Openings   [⯆] │  │ 📅 WEDNESDAY: Lines & Injury[⯆] │  │ 📅 THURSDAY: TNF   [⯆]│    │
│  ├─────────────────────────────────┤  ├─────────────────────────────────┤  ├─────────────────────┤    │
│  │ ⠿ Ingest Opening Lines    [▶]   │  │ ⠿ Ingest Prop Lines & Odds  [▶] │  │ ⠿ Run Full TNF Pipe [▶]│    │
│  │ ⠿ Ingest Fantasy Pros ADP [▶]   │  │ ⠿ Refresh Injury Reports    [▶] │  │ ⠿ Pre-Game Freeze    [▶]│    │
│  │ ⠿ Melbourne Kickoff Sync  [▶]   │  │ ⠿ Line Movement Alert Audit [▶] │  │ ⠿ Melbourne Live Hub [▶]│    │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────┘    │
│                                                                                                        │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────┐    │
│  │ 📅 FRIDAY: Prop Drift       [⯆] │  │ 📅 SATURDAY: Lock Slips     [⯆] │  │ 📅 SUNDAY: Main Slate[⯆]│    │
│  ├─────────────────────────────────┤  ├─────────────────────────────────┤  ├─────────────────────┤    │
│  │ ⠿ Scan Weekend Prop Drift [▶]   │  │ ⠿ Compile Sunday Slips      [▶] │  │ ⠿ Run Full Pipeline [▶]│    │
│  │ ⠿ Weather & Stadium Report[▶]   │  │ ⠿ Lock User Wagers JSON     [▶] │  │ ⠿ Sunday Live Tracker[▶]│    │
│  │ ⠿ Practice Participation  [▶]   │  │ ⠿ Final Injury Designations [▶] │  │ ⠿ Alejandro Split Hub[▶]│    │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────┘    │
│                                                                                                        │
│  ┌─────────────────────────────────┐                                                                  │
│  │ 📅 MONDAY: Settle & Reconcile[⯆]│                                                                  │
│  ├─────────────────────────────────┤                                                                  │
│  │ ⠿ Run Weekly Settlement   [▶]   │                                                                  │
│  │ ⠿ Reconcile Alejandro Bill[▶]   │                                                                  │
│  │ ⠿ Export Portfolio Recap   [▶]   │                                                                  │
│  └─────────────────────────────────┘                                                                  │
│                                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ⚡ DOCKED RUNNER CONSOLE  [● RUNNING: tnf_pipeline] [Elapsed: 00:14]  [Preview: ESPN Boxscore OK] [▲]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [20:30:02] [SERVER] Initializing execution for task: tnf_pipeline                                    │
│  [20:30:03] [RUN] node scripts/run-thursday-pipeline.mjs --live                                      │
│  [20:30:04] 🏈 Starting Thursday Night Football Full Automation Pipeline...                           │
│  [20:30:06] 📡 Polling ESPN CDN Endpoint for Game 401872657 (SF @ LAR)...                             │
│  [20:30:08] 📊 Melbourne Kickoff Live Scoreboard: SF 27, LAR 7 (Final)                                │
│  [20:30:10] 🔥 Ticket #7 (Rams ML + Under 48): SF 24+ pts detected → Auto-Burnt (Impossible to Cash)  │
│  [20:30:12] 🤝 Alejandro Castro Split Ledger: $0.00 cash risk for promo plays, $22.50 cash liability   │
│  [20:30:14] ✅ Thursday Pipeline Completed Successfully with exit code 0.                              │
│                                                                 [🗑 Clear Logs]  [⤓ Download Output]   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Breakdown

### 1. Header Telemetry & Status Bar
- **Application Brand**: Shows `🏈 NFL Dashboard Toolbox`.
- **Server Health Badge**: Shows green `● SERVER ACTIVE` indicating the background daemon is alive on `http://127.0.0.1:4567`.
- **System Time**: Live Eastern Time clock for aligning with NFL kickoff schedules.
- **Port Identifier**: Confirms local loopback communication.

### 2. Quick Filters Toolbar
Allows instant filtering of tasks across the entire week:
- **All Tasks**: Shows every available script and pipeline.
- **Ingestions**: Filters down to data fetchers (ESPN, FantasyPros, Lines, Injuries, Weather).
- **Pipelines**: Highlights end-to-end composite runners (Thursday TNF, Sunday Main Slate, Monday Settlement).
- **Reports & Trackers**: Quick access to live dashboards (Melbourne Live Tracker, Sunday Tracker, Fantasy Value Report).
- **Verify**: Verification suites, unit test runners, and integrity audits.
- **↺ Reset Layout**: Restores default drag-and-drop order and expands all collapsed sections.

### 3. Weekly Cadence Day Roadmaps
Organized by day of the week to eliminate guesswork on what to run:

| Day | Focus Area | Essential Tasks |
| :--- | :--- | :--- |
| **📅 Tuesday** | *Line Openings & Baseline* | Ingest Opening Odds, FantasyPros ADP, Initialize Melbourne Kickoff portfolio. |
| **📅 Wednesday** | *Movement & Practice* | Sync Prop lines, audit market movement, check initial Wednesday injury participation. |
| **📅 Thursday** | *Thursday Night Football (TNF)* | **Run Full Thursday TNF Pipeline**, Pre-Game Odds Freeze, Launch Melbourne Live Tracker. |
| **📅 Friday** | *Weekend Preparation* | Run Weekend Prop Drift Audit, stadium weather check, injury designation review. |
| **📅 Saturday** | *Market Locking* | Lock final prop lines, audit `user-placed-wagers-2026.json`, compile Sunday tracker slips. |
| **📅 Sunday** | *Main Slate (12+ Games)* | **Run Full Sunday Slate Pipeline**, launch Sunday Multi-Game Tracker, monitor live Alejandro 50/50 splits. |
| **📅 Monday** | *Settlement & Ledger* | Run Wager Reconciliation, settle Alejandro Castro's 50/50 weekly ledger, export historical audit. |

### 4. Interactive Task Cards & Instant Button Feedback
- **Run Button (`▶ Run`)**:
  - Immediately transforms to `⏳ Running [taskKey]...` upon click.
  - Border transitions to an animated glowing blue pulse while executing.
  - Auto-switches to `✔ Completed!` (green) or `✖ Failed` (red) upon exit code resolution.
- **Reorder Handle (`⠿`)**: Drag any day card or task up and down to prioritize custom routines. Order is automatically saved in `localStorage`.
- **Collapse Toggle (`⯆` / `⯈`)**: Minimize completed day cards to keep your workspace clean and compact.

### 5. Persistent Docked Console Drawer
- **Collapsed Mode**: Sits unobtrusively at the bottom with a 1-line live ticker showing the latest log output, active task key, and elapsed timer.
- **Expanded Mode (`▲ Console`)**: Expands to view the full streaming terminal output (`stdout` and `stderr`) via real-time Server-Sent Events (SSE).
- **Execution Ticker**:
  - `IDLE`: Server is waiting for command.
  - `RUNNING: <taskKey>`: Script currently running.
- **Controls**:
  - `▲ / ▼`: Toggle drawer height.
  - `🗑 Clear`: Wipe console buffer.
  - `⤓ Download`: Save current console session log to disk.

---

## 🚀 How to Use the Toolbox

### Launching the Toolbox
1. **Desktop Shortcut**: Double-click the **NFL Toolbox** icon on your Windows desktop (`C:\Users\andre\OneDrive\Desktop\NFL Toolbox.lnk`).
   - Launches silently with zero command prompt window popups via [`launch-toolbox.vbs`](file:///e:/dev/projects/NFL_Dashboard/launch-toolbox.vbs).
   - Opens your default web browser directly to `http://127.0.0.1:4567`.
2. **From PowerShell** (alternative manual start):
   ```powershell
   node scripts/toolbox-app-server.mjs --port 4567 --open
   ```

### Daily Routine Example: Operating Thursday (TNF)
1. Open the Toolbox on Thursday morning.
2. In the **📅 Thursday: Thursday Night Football** card, click **`Run Full Thursday TNF Pipeline`**.
3. Observe the bottom console drawer immediately stream live logs:
   - Verifies ESPN live connectivity.
   - Audits Melbourne Kickoff wager lines.
   - Pre-computes mathematical burn exclusions.
4. Click **`Open Melbourne Live Tracker`** to track in-game prop gauges, mutual-exclusion parlay auto-burns, and Alejandro Castro's 50/50 split bill in real-time.

---

## 🤝 Alejandro Castro Split Accounting Rules
When operating the Live Trackers launched from the Toolbox:
1. **$0 Cash Risk for Promo Credits**: DraftKings predictions or bonus credits risk `$0.00` cash. In split accounting, Alejandro is never billed for promo credit risk.
2. **50% Cash Stake Liability**: On cash wagers, Alejandro owes 50% of the cash risk whether the ticket wins or loses.
3. **Burned Tickets ($0.00 Win)**: If a ticket is burned (e.g. SF 24+ pts busts Under 48 on Ticket #7), the potential win share drops to `$0.00`, but Alejandro's cash risk liability remains active.
4. **Instant Settlement Toggle**: Click `🤝 Split` on any card to add/remove it from Alejandro Castro's ledger.
