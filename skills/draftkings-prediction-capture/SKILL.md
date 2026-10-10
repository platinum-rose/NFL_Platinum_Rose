---
name: draftkings-prediction-capture
description: Automated workflow to discover, extract, and parse live DraftKings Prediction Markets NFL game lines and player proposition contracts.
---

# DraftKings Predictions NFL Game Lines & Props Automated Capture

**When to Activate:**
- When capturing, updating, or auditing live NFL prediction market contracts and game lines from DraftKings Predictions (`predictions.draftkings.com`).
- Cross-referencing prediction market probabilities and implied odds against Bookmaker.eu, BetOnline.ag, and domestic sportsbooks.
- Checking prediction market consensus pricing for spreads, game totals, moneylines/to-win contracts, and touchdown markets (Anytime TD, First TD, 2+ TDs).

---

## 1. Architectural Overview & Cloudflare Bypass

DraftKings Predictions (`predictions.draftkings.com`) operates as a CFTC-regulated event contract exchange protected by Cloudflare/Akamai bot mitigations.

Direct raw HTTP fetches receive HTTP 403 Forbidden. The automated capture is executed **via a dedicated Chrome instance running with Chrome DevTools Protocol (CDP port 9224) and persistent profile (`.chrome-dkp`)**:
- **Zero Tab Hijacking:** The runner creates an isolated dedicated capture tab (`await defaultContext.newPage()`) inside `.chrome-dkp`, executes discovery and extraction, and closes it in a `finally` block. Operator tabs are never touched or navigated.
- **Atomic Concurrency Protection:** Uses atomic exclusive lock creation (`flag: 'wx'`) with unique ownership tokens (`crypto.randomUUID()`). Live processes are never expired or stolen regardless of duration.
- **Slate-Wide Ingestion:** Leverages DraftKings' clean slate-wide category views (`game-lines` and `td-scorers`) to ingest hundreds of contracts across all 14 active weekly matchups in under 10 seconds.
- **Probability-to-Odds Conversion:** Normalizes contract prices in cents / probabilities into standard American odds and normalized `bet` classifications (`spread`, `total`, `moneyline`, `prop`).
- **Strict Acceptance Gate:** Output is validated against a 14-game / zero-defect gate before promoting to the master registry.

---

## 2. Step-by-Step Operator Workflow

### Step 1: Launch Persistent Chrome Session (Port 9224)
```powershell
npm run props:dkp:launch
```
or double-click `scripts\props\launch-dkp-browser.bat`.
This opens Chrome with profile `.chrome-dkp`. Clear any Turnstile prompt once; cookies and clearance persist.

### Step 2: Run On-Demand Refresh via CLI
Run any of the global shortcuts from anywhere:
```bash
dkp
# or: rundkprops
# or: npm run dkp
# or: npm run props:dkp:cron
```

### Step 3: Register Recurring Background Scheduler (Windows Task Scheduler)
Run PowerShell as Administrator to schedule the scraper automatically:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\props\register-dkp-cron.ps1 -IntervalHours 3
```
- Task name: `NFL_DraftKings_Prediction_Sync`
- Runs automatically every 3 hours at `:30` past the hour (staggered with Bookmaker at `:00` and BetOnline at `:15`).

---

## 3. Output Artifacts & Registries

1. **Master Consolidated JSON:**
   `data/generated/props/draftkings-predictions-live-<date>-week<N>.json`
2. **Research Evidence Mirror:**
   `data/research-intel/source-evidence/<date>-draftkings-predictions-week<N>-props-parsed.json`
3. **Raw Text Evidence:**
   `data/research-intel/source-evidence/<date>-dkp-live-week<N>.raw.txt`
4. **Per-Matchup Dedicated JSONs:**
   `data/generated/props/draftkings-predictions-live-<date>-<away>-at-<home>.json`

---

## 4. Market Key Reference

| Market Key | Bet Type | Description | Example Selection |
|---|---|---|---|
| `game_lines` | `spread` | Game Spread (+/- Line & Probability) | `PHI +7.5 (50%)` |
| `game_lines` | `total` | Game Total Points (Over/Under Line & Probability) | `Over 42.5 (49%)` |
| `game_lines` | `moneyline` | Moneyline / To Win Contract | `PHI Win (24%)` |
| `atd_1_plus` | `prop` | Anytime Touchdown Scorer Contract | `Bhayshul Tuten Anytime TD (48%)` |
| `first_td` | `prop` | First Touchdown Scorer Contract | `Bhayshul Tuten First TD (17%)` |
| `two_plus_td` | `prop` | 2+ Touchdowns Scorer Contract | `Bhayshul Tuten 2+ TDs (14%)` |

---

## 5. Acceptance Gate Requirements

Before overwriting master data, the gate verifies:
1. Captured event count exactly equals 14.
2. Total rows `>= 500`.
3. Zero rows with null, undefined, or NaN odds.
4. Zero rows with invalid prices (must be strictly `0 < price < 100`).
5. Zero game lines with non-null player names.
6. Zero player props without player names.
