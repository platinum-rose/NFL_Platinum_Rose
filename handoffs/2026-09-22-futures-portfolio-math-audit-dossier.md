# Comprehensive 2026 NFL Futures & Super Bowl Exactas Portfolio Dossier
**Prepared for**: Andy Rose & The Codex Review Team  
**Date of Dossier**: September 22, 2026 (21:45 PT)  
**Status**: Pre-Execution Math Audit & Expansion Blueprint  
**Primary Reference Files**:  
- Master Portfolio Ledger: `data/futures-imports/andy-portfolio-ledger-2026.json`  
- Live Circa Board: `data/futures-imports/circa-2026-09-22-live-futures-markets.json`  
- BetUS Matchup Matrix: `docs/Futures_Odds/BetUS_Odds_0916`  
- Open Parlays Hedge Reserve: `data/futures-imports/open-parlays-2026.json`  

---

## 1. Executive Summary & Purpose

This dossier provides a comprehensive technical audit of Andy's 2026 NFL Futures and Super Bowl Exactas portfolio. It documents:
1. **Existing Placed Inventory**: Complete breakdown of the 8 placed Super Bowl exactas, 2 outright Super Bowl winner bets, 2 anchor-ladder bets, and the 6-ticket postseason hedge reserve.
2. **Market Inefficiencies & Price Exploits**: Quantitative comparison between live odds across **Circa Sports Nevada**, **Kalshi Prediction Markets**, **BetOnline**, **BookMaker.eu**, and **BetUS**.
3. **Mathematical Formulas**: Exact fee-adjusted payout formulas for Kalshi prediction contracts and cross-conference parlay math for Circa synthetic exactas.
4. **Proposed Additions & Liquidity Constraints**: Specific unit allocations for Circa Patriots (small allocation), Circa Ravens (larger allocation), and 4 selected Kalshi exactas (with contract-level depth limits).
5. **Codex Audit Checklist**: Specific formulas, rounding thresholds, and book rules for the Codex team to verify prior to execution.

---

## 2. Portfolio Baseline (Audited Ledger)

All existing placed positions are recorded in `data/futures-imports/andy-portfolio-ledger-2026.json`.

### A. Super Bowl Outright Bets (Solo Winners)
* **Buffalo Bills**:
  * Ticket `994540980` (BetOnline, 2026-09-09): **$50.00** @ `+1000` $\to$ **$500.00 win**. *(Qualifies for BetOnline's $10 per regular-season win promo).*
  * Ticket `996987591` (BetOnline, 2026-09-17): **$9.09** @ `+950` $\to$ **$86.36 win**. *(Pre-TNF DET@BUF boost).*
  * **Combined Bills Outright**: **$59.09 staked**, Blended Price: **`+992`**, Potential Win: **$586.36**, Total Return: **$645.45**.
  * **Target Cap**: $200.00 (**$140.91 cap room remaining**).
* **Green Bay Packers**:
  * Ticket `994610591` (BetOnline, 2026-09-09): **$40.00** @ `+2500` $\to$ **$1,000.00 win**, Total Return: **$1,040.00**.
  * **Target Cap**: $200.00 (**$160.00 cap room remaining**).
* **Outrights Subtotal**: **$99.09 Risked** | **$1,586.36 Potential Win** | **$1,685.45 Total Return**.

---

### B. Super Bowl Exactas (All Placed at BetOnline on 2026-09-09)
The portfolio holds 8 exactas clustered around two anchor conference champions (Buffalo Bills AFC, Green Bay Packers NFC):

| Ticket # | Matchup (NFC vs AFC) | Role / Strategy | Stake (USD) | American Odds | Potential Win (USD) | Total Return (USD) | Payout Multiplier |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|
| `994540980` | **Green Bay Packers vs Buffalo Bills** | Core Anchor Matchup | $45.00 | `+8300` | $3,735.00 | $3,780.00 | 84.00x |
| `994659710` | **Seattle Seahawks vs Buffalo Bills** | Bills AFC Cluster | $7.42 | `+5100` | $378.42 | $385.84 | 52.00x |
| `994659710` | **Detroit Lions vs Buffalo Bills** | Bills AFC Cluster | $5.00 | `+7700` | $385.00 | $390.00 | 78.00x |
| `994659710` | **Philadelphia Eagles vs Buffalo Bills** | Bills AFC Cluster | $5.00 | `+6700` | $335.00 | $340.00 | 68.00x |
| `994658662` | **Green Bay Packers vs Baltimore Ravens** | Packers NFC Cluster | $12.00 | `+10300` | $1,236.00 | $1,248.00 | 104.00x |
| `994658662` | **Green Bay Packers vs Kansas City Chiefs** | Packers NFC Cluster | $11.00 | `+10300` | $1,133.00 | $1,144.00 | 104.00x |
| `994658662` | **Green Bay Packers vs Cincinnati Bengals** | Packers NFC Cluster | $8.00 | `+14200` | $1,136.00 | $1,144.00 | 143.00x |
| `994658662` | **Green Bay Packers vs Pittsburgh Steelers** | Packers NFC Cluster | $6.00 | `+53200` | $3,192.00 | $3,198.00 | 533.00x |
| **TOTALS** | **8 Active Exacta Positions** | — | **$99.42** | **`+11598`** *(avg)* | **$11,530.42** | **$11,629.84** | **116.98x** |

---

### C. Anchor-Ladder Postseason Path Bets (BetOnline, 2026-09-13)
* **Ticket `995676044`**: Green Bay Packers to Make the Playoffs (YES) — **$20.00** @ `-120` $\to$ **$16.67 win** ($36.67 return).
* **Ticket `995676044`**: Buffalo Bills Over 10.5 Regular Season Wins — **$20.00** @ `-135` $\to$ **$14.81 win** ($34.81 return).
* **Ladders Subtotal**: **$40.00 Risked** | **$31.48 Potential Win**.

---

### D. Contingent Postseason Hedge Reserve (BookMaker Open Parlays)
From `data/futures-imports/open-parlays-2026.json`, 6 active CBB March Madness open parlay tickets with 11 open legs, valid through Super Bowl LXI (Feb 2027):
* **Total Risked**: **$162.50**
* **Displayed Potential Win**: **$3,327.12**
* **Policy**: Designated strictly as contingent hedging assets during the NFL playoffs.

---

### E. Baseline Portfolio Totals
* **Active Cash Risked (Outrights + Exactas + Ladders)**: **$238.51**
* **Contingent Hedge Reserve (BookMaker)**: **$162.50**
* **Total Portfolio Capital Committed**: **$401.01**
* **Overall Planned Primary Cap**: **$500.00** (Remaining Uncommitted Capital: **$98.99** to $261.49 depending on reserve counting).

---

## 3. Mathematical Models & Pricing Mechanics

### A. Circa Sports Synthetic Exacta Pricing (Cross-Conference Parlays)
Circa Sports Nevada does not list a static 256-cell exact matchup matrix. Instead, Circa allows **2-leg cross-conference parlays** combining:
* Leg 1: **AFC Champion** (Rotation numbers `14551`–`14566`)
* Leg 2: **NFC Champion** (Rotation numbers `14571`–`14586`)

#### Parlay Odds Formula:
For two positive American odds legs $+O_1$ and $+O_2$:
$$\text{Decimal Multiplier}_1 = 1 + \frac{O_1}{100}, \quad \text{Decimal Multiplier}_2 = 1 + \frac{O_2}{100}$$
$$\text{Total Decimal Payout} = \text{Decimal Multiplier}_1 \times \text{Decimal Multiplier}_2$$
$$\text{Synthetic American Odds} = (\text{Total Decimal Payout} - 1) \times 100$$

*Example (Ravens +525 [14557] $\times$ Packers +1600 [14577])*:
$$\text{Dec}_1 = 1 + 5.25 = 6.25, \quad \text{Dec}_2 = 1 + 16.00 = 17.00$$
$$\text{Dec}_{\text{Total}} = 6.25 \times 17.00 = 106.25 \implies \mathbf{+10525\ \text{American}}$$
*Verified via live Circa bet slip (`Screenshot_20260922_201345_Circa Sports Nevada.jpg.jpeg`): $50 to win $5,262.50.*

---

### B. Kalshi Prediction Market Pricing & Fee Deduction
Kalshi contracts settle at **$1.00** if the event occurs, or **$0.00** if it does not.
* Purchase Price (Ask): $P$ (in dollars, e.g., $0.02 for 2¢).
* Gross Return on Win: $\$1.00 - P$.
* Kalshi Standard Transaction Fee Formula (per contract $C=1$):
  $$F = \lceil 0.07 \times (1 - P) \rceil \quad (\text{rounded up to the next full cent})$$
  * At $P = \$0.02$ (2¢): $0.07 \times 0.98 = 0.0686 \to \text{rounded up} = \mathbf{\$0.01\ \text{fee per 7 contracts}}$ ($\approx \$0.001429$ per contract).
  * Effective Net Cost per Contract: $P_{\text{net}} = \$0.02 + \$0.001429 = \mathbf{\$0.021429}$.
  * Effective Net Profit per Contract: $\text{Profit}_{\text{net}} = \$1.00 - \$0.021429 = \mathbf{\$0.978571}$.
* **Net Fee-Adjusted American Odds**:
  $$\text{Net American} = \left( \frac{\$0.978571}{\$0.021429} \right) \times 100 = \mathbf{+4566.57 \to +4573\ \text{Net}}$$
* At $P = \$0.01$ (1¢): Fee per contract $\approx \$0.0008$. Net Cost = $0.0108.
  $$\text{Net American} = \left( \frac{\$0.9892}{\$0.0108} \right) \times 100 = \mathbf{+9159.26 \to +9246\ \text{Net}}$$

> [!IMPORTANT]
> **American Odds Convention**: A larger positive number always represents a higher payout. Therefore:
> * BetUS at `+10000` pays $100 profit on a $1 bet.
> * BetOnline at `+9650` pays $96.50 profit on a $1 bet.
> * Kalshi 1¢ Net at `+9246` pays $92.46 profit on a $1 bet.
> * Both BetUS and BetOnline **beat** Kalshi 1¢. Kalshi only beats traditional books when traditional books offer less than `+9246` (such as Circa `+6800` or BookMaker `+8675`).

---

## 4. Proposed New Additions: Mathematical Audit

### Group A: Circa Sports Rogue Inefficiencies

Circa holds two distinct structural edges against the global market:
1. **Baltimore Ravens AFC Champion (`+525`)**: Lower vig and higher payout than BetOnline (`+450`) or BetUS (`+475`).
2. **New England Patriots Rogue AFC Price (`+1050`)**: Highly anomalous outlier price compared to BetOnline (`+800`), BetUS (`+750`), and BookMaker (`+620`).

#### 1. Ravens Exactas (Larger Allocation Target)
* **Matchup 1: Baltimore Ravens vs Philadelphia Eagles**
  * Legs: Ravens `+525` (`14557`) $\times$ Eagles `+700` (`14573`)
  * Circa Synthetic Price: **`+4900`** ($10 to win $490.00)
  * **Global Comparison**:
    * **Circa: `+4900` (#1 in the World)**
    * BookMaker: `+4820`
    * BetOnline: `+4700`
    * Kalshi: 2¢ Ask $\to$ `+4573 Net`
    * BetUS: `+4000`
  * *Audit Result*: Circa beats the entire global market by +80 to +900 basis points.

* **Matchup 2: Green Bay Packers vs Baltimore Ravens**
  * Legs: Ravens `+525` (`14557`) $\times$ Packers `+1600` (`14577`)
  * Circa Synthetic Price: **`+10525`** ($10 to win $1,052.50)
  * **Global Comparison**:
    * **Circa: `+10525` (#1 in the World)**
    * BetOnline: `+10100` *(portfolio already owns $12 @ +10300)*
    * BookMaker: `+10048`
    * BetUS: `+7000`
  * *Audit Result*: Circa beats BetOnline by +425 points and BetUS by +3,525 points.

---

#### 2. Patriots Exactas (Smaller Allocation Target — Exploiting NE +1050)
* **Matchup 1: New England Patriots vs Seattle Seahawks**
  * Legs: Patriots `+1050` (`14554`) $\times$ Seahawks `+580` (`14586`)
  * Circa Synthetic Price: **`+7720`** ($5 to win $386.00)
  * **Global Comparison**:
    * **Circa: `+7720` (#1 in the World)**
    * BetOnline: `+7050`
    * BetUS: `+7000`
    * BookMaker: `+5363`
  * *Audit Result*: Circa beats BetOnline by +670 points and BetUS by +720 points.

* **Matchup 2: New England Patriots vs Philadelphia Eagles**
  * Legs: Patriots `+1050` (`14554`) $\times$ Eagles `+700` (`14573`)
  * Circa Synthetic Price: **`+9100`** ($5 to win $455.00)
  * **Global Comparison**:
    * **Circa: `+9100` (#1 in the World)**
    * BetUS: `+9000`
    * BetOnline: `+8700`
    * BookMaker: `+7500`
  * *Audit Result*: Circa beats BetUS by +100 points and BetOnline by +400 points.

* **Matchup 3: New England Patriots vs Green Bay Packers**
  * Legs: Patriots `+1050` (`14554`) $\times$ Packers `+1600` (`14577`)
  * Circa Synthetic Price: **`+19450`** ($5 to win $972.50)
  * **Global Comparison**:
    * **Circa: `+19450` (#1 in the World)**
    * BetOnline: `+18600`
    * BookMaker: `+15575`
    * BetUS: `+15000`
  * *Audit Result*: Circa beats BetOnline by +850 points and BetUS by +4,450 points.

---

### Group B: Kalshi Prediction Markets (4 User Targets & Order Book Depth)

From the live order book audit of series `KXNFLMATCHUP-27SB`:

```
┌──────────────────────────────────────────────┬────────────┬─────────────┬──────────────┬────────────────────────────┐
│ Market / Ticker                              │ Kalshi Ask │ Net Odds    │ Depth at Ask │ Competitor Best Price      │
├──────────────────────────────────────────────┼────────────┼─────────────┼──────────────┼────────────────────────────┤
│ Ravens vs Seahawks (KXNFLMATCHUP-27SB-BALSEA)│ 2¢         │ +4573 Net   │ 99,210 ct.   │ Circa +4150, BEO +3800     │
│ Ravens vs 49ers (KXNFLMATCHUP-27SB-BALSF)    │ 2¢         │ +4573 Net   │ 193 ct. (!)  │ BKR +3590, BetUS +3500     │
│ Chiefs vs Seahawks (KXNFLMATCHUP-27SB-KCSEA) │ 2¢         │ +4573 Net   │ 875 ct. (!)  │ BEO +4125, BetUS +4000     │
│ Cowboys vs Ravens (KXNFLMATCHUP-27SB-BALDAL) │ 1¢         │ +9246 Net   │ 83,661 ct.   │ BEO +8900, Circa +7400     │
└──────────────────────────────────────────────┴────────────┴─────────────┴──────────────┴────────────────────────────┘
```

#### Detailed Liquidity & Cross-Book Analysis:
1. **Ravens vs. Seahawks (`KXNFLMATCHUP-27SB-BALSEA`)**:
   * **Kalshi: 2¢ $\to$ `+4573 Net`** with **99,210 contracts** ($1,984.20 capacity).
   * Beats Circa (`+4150`) by +423 points, BetOnline (`+3800`) by +773 points, BetUS (`+3300`) by +1,273 points.
   * *Status*: **High-capacity green light**.
2. **Ravens vs. 49ers (`KXNFLMATCHUP-27SB-BALSF`)**:
   * **Kalshi: 2¢ $\to$ `+4573 Net`**.
   * > [!WARNING]
     > **Order Book Liquidity Warning**: Only **193 contracts** are offered at 2¢ (maximum risk of **$3.86**). The next resting ask is 3¢ (`+3064 Net`), which would be strictly worse than BookMaker (`+3590`), BetUS (`+3500`), and Circa (`+3431`). Limit order must be strictly capped at 2¢ / 193 contracts.
3. **Chiefs vs. Seahawks (`KXNFLMATCHUP-27SB-KCSEA`)**:
   * **Kalshi: 2¢ $\to$ `+4573 Net`**.
   * > [!WARNING]
     > **Order Book Liquidity Warning**: Only **875 contracts** are offered at 2¢ (maximum risk of **$17.50**). The next ask is 3¢ (`+3064 Net`). Limit order must be strictly capped at 2¢ / 875 contracts.
   * Beats BetOnline (`+4125`) by +448 points and BetUS (`+4000`) by +573 points.
4. **Cowboys vs. Ravens (`KXNFLMATCHUP-27SB-BALDAL`)**:
   * **Kalshi: 1¢ $\to$ `+9246 Net`** with **83,661 contracts** ($836.61 capacity).
   * Beats BetOnline (`+8900`) by +346 points, BookMaker (`+7895`) by +1,351 points, and Circa (`+7400`) by +1,846 points.
   * *Status*: **High-capacity green light**.

---

## 5. Teaser Math Appendix: 5-Point vs. 6-Point at -120

### The Problem with 5-Point Teasers at -120 (Circa Sports Slip)
Circa offered a 5-point teaser at -120 (`Screenshot_20260922_203321_Circa Sports Nevada.jpg.jpeg`):
* Leg 1: Packers -5 teased to PK (0)
* Leg 2: Cowboys +3 teased to +8
* **Required Break-Even Win Rate**: $\frac{120}{220} = \mathbf{54.55\%}$ ticket win rate ($\mathbf{73.85\%}$ per leg).

#### The Mathematical Defect:
1. **Packers -5 to PK**: Teasing a favorite onto PK crosses 3, but does NOT cross 7 (starts below 7). It expends points in the low-frequency dead zone (1, 2, 4, 5). Historical cover rate is only **~70.5%** (failing the 73.85% requirement by -3.35%).
2. **Cowboys +3 to +8**: Starting ON +3 already pushes on 3. It does not cross 3. It captures 7, but only covers historically at **~72.0%** (failing the 73.85% requirement by -1.85%).
3. **Expected Value**: Ticket cover probability = $70.5\% \times 72.0\% = \mathbf{50.76\%} \implies \mathbf{-\$8.33\ \text{EV per \$120 staked (-6.94% ROI)}}$.

### The BookMaker 6-Point at -120 Contrast
BookMaker provides the full 6 points at -120:
* Leg 1: Packers -5.5 teased to `+0.5` (Covers on outright win or tie, ~72.8% cover rate).
* Leg 2: Cowboys +3 teased to `+9` (Crosses 7 and captures 8 as an outright win, ~74.8% cover rate).
* **Combined Win Rate**: $72.8\% \times 74.8\% = \mathbf{54.45\%}$ (virtually dead-even with 54.55% break-even, **-0.17% ROI** vs Circa's **-6.94%**).

---

## 6. Proposed Sizing & Execution Blueprint

### Sizing Allocation Schedule

```
┌───────────────────────────┬─────────────┬───────────┬──────────┬──────────────┬────────────────┐
│ Selection                 │ Platform    │ Price     │ Stake    │ To Win       │ Execution Note │
├───────────────────────────┼─────────────┼───────────┼──────────┼──────────────┼────────────────┤
│ Ravens vs Eagles          │ Circa (App) │ +4900     │ $15.00   │ $735.00      │ 14557 x 14573  │
│ Ravens vs Packers         │ Circa (App) │ +10525    │ $10.00   │ $1,052.50    │ 14557 x 14577  │
│ Patriots vs Seahawks      │ Circa (App) │ +7720     │ $5.00    │ $386.00      │ 14554 x 14586  │
│ Patriots vs Eagles        │ Circa (App) │ +9100     │ $5.00    │ $455.00      │ 14554 x 14573  │
│ Patriots vs Packers       │ Circa (App) │ +19450    │ $5.00    │ $972.50      │ 14554 x 14577  │
│ Ravens vs Seahawks        │ Kalshi      │ +4573 Net │ $10.00   │ $457.30      │ 500 ct. @ 2¢   │
│ Ravens vs 49ers           │ Kalshi      │ +4573 Net │ $3.86    │ $176.50      │ 193 ct. @ 2¢   │
│ Chiefs vs Seahawks        │ Kalshi      │ +4573 Net │ $17.50   │ $800.25      │ 875 ct. @ 2¢   │
│ Cowboys vs Ravens         │ Kalshi      │ +9246 Net │ $10.00   │ $924.60      │ 1000 ct. @ 1¢  │
├───────────────────────────┼─────────────┼───────────┼──────────┼──────────────┼────────────────┤
│ PROPOSED EXPANSION TOTALS │             │           │ $81.36   │ $5,959.65    │ 9 New Plays    │
└───────────────────────────┴─────────────┴───────────┴──────────┴──────────────┴────────────────┘
```

### Combined Portfolio Impact After Execution:
* **Current Active Cash**: $238.51 + $81.36 = **$319.87**
* **Total Exactas Placed**: 8 + 9 = **17 Exactas**
* **Total Exactas Risked**: $99.42 + $81.36 = **$180.78**
* **Total Potential Exacta Win**: $11,530.42 + $5,959.65 = **$17,490.07**
* **Target Caps After Execution**:
  * Bills Cap: $59.09 allocated / $200.00 cap (**$140.91 headroom remaining**).
  * Packers Cap: $40.00 outright + $76.00 exactas = $116.00 total Packers exposure / $200.00 cap (**$84.00 headroom remaining**).
  * Primary Overall Portfolio Cap: $319.87 active / $500.00 planned cap (**$180.13 liquid buffer remaining**).

---

## 7. Codex Team Pre-Flight Verification Checklist

Before firing these orders, the Codex review team should independently verify the following:

- [ ] **1. Circa Rotation Numbers & Leg Pairing**: Confirm on Circa NV terminal that `14557` (BAL) and `14554` (NE) can be cross-parlayed with `14573` (PHI), `14577` (GB), and `14586` (SEA) without house correlation restrictions.
- [ ] **2. Kalshi Net Fee Schedule**: Verify that the settlement fee calculation for series `KXNFLMATCHUP-27SB` adheres to $0.07 \times (1 - P)$ with standard rounding up to the nearest cent per transaction order.
- [ ] **3. Kalshi Limit Price Enforcement**: Ensure that orders for `BALSF` and `KCSEA` are entered strictly as **Limit Orders at 2¢** to prevent market fill slippage onto the 3¢ ask.
- [ ] **4. BetUS Odds Confirmation**: Confirm that BetUS `+10000` on KC vs DAL and `+9000` on NE vs PHI remain open on the 256-cell board if secondary routing is needed.
- [ ] **5. Ledger Format Compliance**: Ensure that post-execution ticket logging maps directly to the schema defined in `data/futures-imports/andy-portfolio-ledger-2026.json`.
