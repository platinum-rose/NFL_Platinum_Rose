# Codex Handoff — 2026 NFL Futures & Super Bowl Exactas Math Audit & Expansion Review

**Captured:** 2026-09-22 21:45 PT (America/Los_Angeles)  
**Repository:** `E:\dev\projects\NFL_Dashboard`  
**Branch:** `wip/yahoo-sync`  
**Task Type:** Mathematical Audit, Verification, and Pre-Execution Validation  

---

## 1. Objective

Independently audit and verify the mathematical models, live sportsbook and prediction market prices, order book liquidity constraints, and unit sizing calculations for Andy's 2026 NFL Futures Portfolio before executing 9 proposed new Super Bowl exactas (5 on Circa Sports Nevada, 4 on Kalshi).

---

## 2. Mandatory First Reads (In Order)

1. **Portfolio Master Dossier**: `handoffs/2026-09-22-futures-portfolio-math-audit-dossier.md` (and companion artifact `futures_portfolio_dossier.md`)
2. **Current Master Ledger**: `data/futures-imports/andy-portfolio-ledger-2026.json`
3. **Live Circa Board Capture**: `data/futures-imports/circa-2026-09-22-live-futures-markets.json`
4. **BetUS Fixed Exacta Matrix**: `docs/Futures_Odds/BetUS_Odds_0916`
5. **Open Parlays Hedge Reserve**: `data/futures-imports/open-parlays-2026.json`
6. **Scratch Math Verification Scripts**:
   - `scratch/tally-exactas.mjs` (Current ledger verification)
   - `scratch/teaser-math.js` (Circa 5-pt vs BKR 6-pt teaser analysis)
   - `scratch/scan-all-contender-exactas.mjs` (Cross-book global comparisons)
   - `scratch/kalshi-matchup-analysis.mjs` (Kalshi fee & liquidity modeling)

---

## 3. Mandatory Live Git Reconciliation

Before performing the audit, execute read-only reconciliation:

```powershell
git rev-parse HEAD
git rev-parse --abbrev-ref HEAD
git status --short
```

*Note on Worktree*: The worktree contains existing uncommitted changes in shared modules and test files. **Do not run `git clean`, `git reset`, `git stash`, or `git add -A`.** Stage only files explicitly designated for this audit.

---

## 4. Summary of Audit Scope & Mathematical Targets

### A. Current Portfolio State (Verified Baseline)
* **Super Bowl Outrights**: \$99.09 staked across Buffalo Bills (\$59.09 @ blended `+992`) and Green Bay Packers (\$40.00 @ `+2500`). Potential profit: \$1,586.36.
* **Super Bowl Exactas**: \$99.42 staked across 8 BetOnline tickets (placed 2026-09-09). Potential profit: \$11,530.42. Blended multiplier: `+11598` (116.98x).
* **Anchor Ladders**: \$40.00 staked (GB Playoffs YES `-120` $\to$ \$16.67; BUF Over 10.5 Wins `-135` $\to$ \$14.81).
* **Hedge Reserve**: 6 CBB open parlay tickets at BookMaker (\$162.50 risked, 11 open legs, \$3,327.12 potential win) reserved for postseason hedging.
* **Active Committed Capital**: \$238.51 active cash / \$401.01 total including reserve.

---

### B. Group 1: Circa Sports Synthetic Exacta Pricing (Cross-Conference Parlays)
Circa Nevada allows 2-leg cross-conference parlays between AFC Champions (`14551`–`14566`) and NFC Champions (`14571`–`14586`):
* Formula: $\text{Dec}_{\text{Total}} = \left(1 + \frac{O_1}{100}\right) \times \left(1 + \frac{O_2}{100}\right)$, American Odds $= (\text{Dec}_{\text{Total}} - 1) \times 100$.

**Targets to Audit**:
1. **Ravens vs. Eagles**: BAL `+525` (`14557`) $\times$ PHI `+700` (`14573`) = **`+4900`** (\$15 stake $\to$ \$735 win).
   * Verify Circa `+4900` beats BookMaker (`+4820`), BetOnline (`+4700`), Kalshi Net (`+4573`), BetUS (`+4000`).
2. **Ravens vs. Packers**: BAL `+525` (`14557`) $\times$ GB `+1600` (`14577`) = **`+10525`** (\$10 stake $\to$ \$1,052.50 win).
   * Verify Circa `+10525` beats BetOnline (`+10100`), BookMaker (`+10048`), BetUS (`+7000`).
3. **Patriots vs. Seahawks**: NE `+1050` (`14554`) $\times$ SEA `+580` (`14586`) = **`+7720`** (\$5 stake $\to$ \$386 win).
   * Verify Circa `+7720` beats BetOnline (`+7050`), BetUS (`+7000`), BookMaker (`+5363`).
4. **Patriots vs. Eagles**: NE `+1050` (`14554`) $\times$ PHI `+700` (`14573`) = **`+9100`** (\$5 stake $\to$ \$455 win).
   * Verify Circa `+9100` beats BetUS (`+9000`), BetOnline (`+8700`), BookMaker (`+7500`).
5. **Patriots vs. Packers**: NE `+1050` (`14554`) $\times$ GB `+1600` (`14577`) = **`+19450`** (\$5 stake $\to$ \$972.50 win).
   * Verify Circa `+19450` beats BetOnline (`+18600`), BookMaker (`+15575`), BetUS (`+15000`).

---

### C. Group 2: Kalshi Prediction Market Exactas (Fee Deduction & Depth Checks)
* Fee schedule formula: $F = \lceil 0.07 \times C \times (1 - P) \rceil$.
* At 2¢ Ask: Net price $\approx \$0.021429$, Net American = **`+4573 Net`**.
* At 1¢ Ask: Net price $\approx \$0.0108$, Net American = **`+9246 Net`**.

**Targets & Critical Depth Ceilings to Audit**:
1. **Ravens vs. Seahawks (`KXNFLMATCHUP-27SB-BALSEA`)**: 2¢ Ask $\to$ `+4573 Net`.
   * Liquidity: 99,210 contracts available. Proposed: \$10.00 (500 contracts).
2. **Ravens vs. 49ers (`KXNFLMATCHUP-27SB-BALSF`)**: 2¢ Ask $\to$ `+4573 Net`.
   * **STRICT DEPTH CEILING**: Only 193 contracts available at 2¢ (\$3.86 maximum risk). Verify that order MUST be capped at \$3.86 to prevent slippage into 3¢ (`+3064 Net`).
3. **Chiefs vs. Seahawks (`KXNFLMATCHUP-27SB-KCSEA`)**: 2¢ Ask $\to$ `+4573 Net`.
   * **STRICT DEPTH CEILING**: Only 875 contracts available at 2¢ (\$17.50 maximum risk). Verify order cap at \$17.50.
4. **Cowboys vs. Ravens (`KXNFLMATCHUP-27SB-BALDAL`)**: 1¢ Ask $\to$ `+9246 Net`.
   * Liquidity: 83,661 contracts available. Proposed: \$10.00 (1,000 contracts).

---

### D. Teaser Math Confirmation (Circa vs BookMaker)
* Verify that Circa's 5-point teaser at -120 on GB PK and DAL +8 carries a negative expected value (**-6.94% ROI**, 50.76% win rate vs 54.55% break-even).
* Verify that BookMaker's 6-point teaser at -120 on GB +0.5 and DAL +9 achieves flat break-even (**-0.17% ROI**, 54.45% win rate) and provides positive EV on classic Wong numbers (+2 / -7.5).

---

## 5. Codex Specific Review Instructions

1. **Verify No Double-Counting**: Confirm that none of the 9 proposed additions conflict with or duplicate existing tickets in `data/futures-imports/andy-portfolio-ledger-2026.json`.
2. **Verify Portfolio Cap Space**: Confirm that after adding \$81.36 across the 9 plays:
   - Total active risk becomes \$319.87 (well below the \$500.00 primary cap).
   - Packers exposure becomes \$116.00 (well within the \$200.00 target cap).
   - Bills exposure remains \$59.09 (\$140.91 headroom remaining).
3. **Sign-off**: Provide a clear green-light or note any discrepancies in math, pricing, or order execution limits.
