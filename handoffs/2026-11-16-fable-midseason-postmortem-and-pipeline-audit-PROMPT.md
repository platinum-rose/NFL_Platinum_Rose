# Fable run: finish the 2026 mid-season post-mortem (W1-10), audit the data pipeline, and review how intel becomes picks

Written by Claude (Opus 5.5) for Andy, Mon 2026-11-16. Paste everything below the line into a fresh Fable session.

---

## Who you're working for and what this is

You're working for Andy on **NFL_Dashboard ("Platinum Rose")**, his personal NFL betting-intelligence system. Each week it collects odds, props, injuries, splits, expert podcasts/articles/X threads, prediction markets and analytics models, synthesizes them into betting recommendations (the Master Intel report, SuperContest picks, AI proposals, prop cards), and Andy places tickets across Bookmaker (BKR), BetOnline (BEO), DraftKings Predictions (DKP) and FanDuel Predicts (FDP). His friend **Alejandro** splits some tickets 50/50 and has his own tracker page.

The repo is on Andy's Windows machine at `E:\dev\projects\NFL_Dashboard`. Reach it only through the device shell (`mcp__remote-devices__device_bash`, mounted at `$HOME/mnt/dev/projects/NFL_Dashboard`). The cloud workspace's Read/Write/Bash tools act on a different machine. Bridge quirks you will hit:
- `rm`/`mv`-style deletes fail with "Operation not permitted", so git leaves `.lock` files behind. Rename stale locks (`mv .git/index.lock .git/stale-index-lock-<tag>`), never under `.git/refs`.
- `npx eslint`/`npx vitest`/`npm run test` hang. Call the CLI entry file with `node` directly.
- Each call has a ~180 s cap. Scope greps (exclude node_modules, archive, .bak files) and split long jobs.
- ESPN's public site API (`site.api.espn.com/apis/site/v2/sports/football/nfl/...`) is reachable from the device shell.

## Scope and authority (Andy's answers, 11/16)

- **Primary goal: pick accuracy first, ROI second.** Hit rate and calibration of the AI picks, Master Intel pitches and SuperContest picks matter most. Cash ROI on placed tickets is the second lens.
- **Authority: audit and propose only.** Read everything, write analysis files under `reports/analysis/midseason-2026/` and scratch files, and propose code or rule changes as patches/diffs for Andy to approve. Do **not** change pipeline code, scheduled tasks, synthesis weights, card rules or `data/official-picks/*.json` ledgers. **One exception: closing-line capture (audit A4).** You may implement the fix that gets closing lines onto disk next to the ledger, on a branch, with a test, and show Andy the diff before he merges.
- **No paid API spend.** No OpenAI, Gemini, AssemblyAI, Grok API or TheOddsAPI calls. Use what's on disk plus free public endpoints (ESPN, Open-Meteo, nflverse).
- **Deadline: findings in hand before Week 11 TNF (Thu 11/19, HOU @ IND, 5:15 PM PT)**, so they can feed the W11 card. If time runs short, deliver Part 1 and the Part 3 findings first, and the Part 2 audit table second.
- **Include Alejandro's splits and DKP pick-combos as their own product** in every scorecard.

## Read first (in this order)

1. `reports/analysis/midseason-2026/PLAN.md`: the W1-9 plan, scoring layers, metrics, audits A1-A6.
2. `reports/analysis/midseason-2026/midseason-postmortem.md` (+ `.html`): the W1-9 findings and the 12 proposed changes P1-P12. **None of P1-P12 were formally adopted for W10**, so W10 is the first out-of-sample test of all of them.
3. `reports/analysis/midseason-2026/interim-findings-2026-11-11.md`, `audit_results.json` and the scripts (`audit.py`, `build_picks.py`, `grade_experts.py`, `score_models.py`, `score_kalshi.py`, `score_prop_screen.py`). Reuse and extend these rather than rebuilding.
4. `docs/NFL_WEEKLY_CARD_PROCESS.md` (card slots, rules C2-C5, R9-1, leg floor, build-day sequence, close-out), `docs/MASTER_INTEL_REPORT_RUNBOOK.md`, `docs/PIPELINE_AGENTS.md`, `docs/LOCAL_PIPELINE_SPEC.md`, `docs/WEEKLY_ARCHIVE_RUNBOOK.md`.
5. The latest handoffs in `handoffs/` (2026-11-15 0135 and 1145) and this session's W10 notes, listed below.

## Week 10 material to fold in

- Ledger: `data/official-picks/user-placed-wagers-2026.json` (**W10 is fully settled**: Claude settled all 42 W10 tickets on 11/16 before MNF, since no live ticket depended on LAC@BAL; the only MNF leg, D. Henry first TD, is marked moot on an already-lost ticket. **Exception:** the MNF Island tickets Andy placed 11/16 afternoon on DKP are PENDING until LAC@BAL finishes; grade them from the ESPN box score or wait for Andy's settlement). Paper/AI tickets: `paper-wagers-2026.json` (`paper_w10_mi_*`, `paper_w10_ai_tnf_*`). AI proposals: `ai-proposals/2026-w10.json`.
- W10 synthesis and recommendations: `scratch/w10-synthesis-digest-sat.md`, `scratch/w10-game-synthesis-queue-{sides,props}.json`, `data/research-intel/proposed/games-w10/*.json`, `data/generated/master-intel/w10-*.json`, `scratch/w10-friday-supercontest-ai-proposal.json`.
- W10 captures: `data/generated/props/*2026-11-1[3-5]*` (BEO, BKR, DKP feed, Kalshi), `data/defensive-props/defensive-matchups-week-10.json`, `scripts/analysis/def_tackle_split_model.py`, `scratch/w10-kicking-fg-check-2026-11-15.md`.
- This session's W10 findings (Claude, 11/15; re-verify against final settlement):
  - `scratch/w10-alejandro-postmortem-2026-11-15.html`: Alejandro's splits, 10 tickets, 0 cashed, legs 37-28 (57%).
  - Category hit rates, Sunday + SNF. **Alejandro splits:** QB INT 5-1, rushing 5-1, receiving 6-4, ATD 11-10, QB pass TD 6-5, game lines 3-3, tackles 0-2. **Andy solo (excl. RRs):** 0/17 cashed, legs 40-46 (47%); game lines 19-11, ATD 7-15, receiving 4-11. **AI Master-Intel paper:** 1 of 10 graded cashed, legs 30-22 (58%); game lines 13-3 (81%), receiving 4-10 (29%), rushing 6-5.
  - Near misses on rushing/carries milestones (Chase Brown 44 vs 45.5/46.5/50 on 4 tickets; Cook 18 carries vs 18.5/19.5 on 3), and heavy leg overlap (Warren ATD on 5 tickets; Kyren, Javonte, Charbonnet ATD, Lake tackles, McBride 40+ on 2-3 each).
  - Official W10 (settled ledger): see the recomputed numbers below. **Andy ruled 11/16: legacy NCAA open-spot parlays (and fills on them, e.g. BKR #730846806's $399.43) are OFF the 2026 bankroll** (marked bankroll_exempt); new 2026 open-spot parlays (e.g. the BKR 9-team with 1 open spot placed 11/16, logged as week 11) count toward 2026 even if they carry into 2027. Alejandro W10 -$49.95. Season bankroll about -$190 (W1-5 about -$1,610, W6-10 about +$1,420); exempt promo tickets about +$186. Pools: the Duma (SimplySportsware) has paid $50 so far ($25 Quattro W6-9, $25 Weakly #9), covering the entry fee (`data/pickem/pools-2026.json`).
  - Hedging lessons: `scratch/w10-snf-live-hedge-price-log-2026-11-15.md` (live total ladder, 2H-total rule) and `docs/strategies/endcap-open-spot-hedge.md`. Legacy Bookmaker open-spot parlays: `data/official-picks/legacy-open-spot-parlays.json`.
  - MNF rework: `scratch/w10-mnf-island-rework-2026-11-15.md` (moved away from receiving overs).

## Part 1: finish the mid-season post-mortem (Weeks 1-10)

Extend the W1-9 report to W1-10 using the same methods (`picks.jsonl` normalization, Wilson intervals, cluster bootstrap with 10,000 resamples where tickets sharing a leg resample together, units at the stated price, n < 20 marked directional only).

1. Add W10 to every layer: podcasts, articles, Grok/X, Master Intel and SuperContest pitches, fair lines and the simulator, Kalshi, prop screen, defensive tackle model, AI proposals, paper and placed tickets, pools.
2. **Score P1-P12 out of sample on W10.** For each rule: what W10 tickets or picks would it have changed, and what was the counterfactual result? Then recommend lock in / revise / drop, citing which audits (A1-A6) back it. Remember A3: everything W1-9 said about these rules was in-sample.
3. Add a **product split** to the scorecard, with each line shown separately:
   - Andy solo cash tickets
   - Alejandro splits
   - DKP pick-combos, by leg count
   - BKR round robins and open-spot parlays
   - Island 3-tier tickets
   - AI paper tickets
   - SuperContest
4. Finish the incomplete audits: **A2** (calibration; log estimates where missing), **A4** (CLV; see Part 2 item 4), and refresh **A1** correlation clusters with W10.
5. Update `midseason-postmortem.md` and `.html` (keep the W1-9 version as a `.bak`), and add a one-page "what changed with W10" summary at the top.

## Part 2: audit the weekly data capture and automated tasks

Goal: confirm every automated input is being captured **correctly, completely and on time**, and flag waste.

1. **Inventory every automated task:**
   - GitHub workflows in `.github/workflows/` (odds, game-odds, futures-odds, injuries, betting splits, podcasts, pick extraction, research intel, nflverse refresh, roster refresh, auto-grade, props auto-grade, daily brief, weekly update, vault syncs, smoke test).
   - Windows scheduled tasks set up by `scripts/setup-*.ps1` (all-NFL tasks, Grok thread scanner, research intel, Twitter bookmarks).
   - Cron scripts (`scripts/research-intel-cron.js`, `scripts/futures-brief-cron.js`) and Toolbox capture buttons (`scripts/toolbox.mjs`, `toolbox-app-server.mjs`).

   For each task, record: purpose, schedule, output path, last successful run, and whether the output feeds the synthesis.
2. **Verify freshness and completeness for W8-W10.** Did each source land before the synthesis that used it (file mtimes vs proposal timestamps, as in A6)? Look for missing games, missing markets, and stale snapshots. Known suspects:
   - BKR capture needing a manual login.
   - The DKP capture taking about 1 game per minute.
   - The scheduled BOL sync skipping Props Builder.
   - DKP feed spread rows appearing team-flipped (reported W6).
   - No QB INT markets in some DKP game feeds.
   - The futures ledger path warning in the partner tracker build.
   - Yahoo Fantasy API still blocked.
   - The falsy-zero bug in `src/lib/predictionMarkets.js`.
   - **Confirmed W10 bug:** `scripts/settle_from_mobile_state.py` (reads `public/live-tracker-mobile-state.json`) inverts Under legs. W10: Dulcich U3.5 rec (0) and Kyren U64.5 rush yds (23) were graded LOST, and Collins U4.5 rec (9) was graded WON. It also left ATD legs PENDING on settled tickets. Ticket results were right this week only because those tickets lost elsewhere. Claude corrected 44 W10 leg grades on 11/16 (backup `user-placed-wagers-2026.json.bak-claude-20261116-w10-settle`). Check every earlier week's Under legs, and every leg-type hit rate in Part 1, for the same corruption before trusting them; trace whether the bug lives in the settler or in the mobile tracker's grading.
3. **Efficiency:** find duplicated captures, captures nobody consumes, captures that run too often or too late, and paid-API calls that could be replaced with free ones. Rank fixes by impact on pick accuracy.
4. **Closing-line capture (the one fix you may implement).** Closing lines live only in Supabase `game_odds_snapshots`, not on disk, which blocks CLV. Build a free, scheduled-or-Tuesday step that stores the closing line (DK or BKR, at a defined close time) next to each single-game side/total pick and ticket. Backfill W1-10 where any snapshot exists, and add a test. Branch only; show Andy the diff. Then run A4 on whatever history it recovers.

Deliverable: `reports/analysis/midseason-2026/pipeline-audit-2026-11.md`, with one table row per task (status: OK / degraded / broken / unused) and ranked fixes, written as patches or step-by-step changes, not applied.

## Part 3: deep review of how intel becomes recommendations, against real outcomes

Trace, week by week (W5-10 at minimum, where artifacts exist), the path from raw inputs to the published recommendations:

```
captures (odds, props, injuries, splits, weather, prediction markets)
  -> intel (podcasts, articles, X threads, expert dossiers, big-money flags)
  -> models (fair lines, margin simulator, EPA, prop screen, tackle model, kicking check)
  -> synthesis (game synthesis queues, Master Intel, SuperContest, AI proposals, Island tiers)
  -> what Andy actually placed
```

For each stage, answer: **what did this stage add to accuracy, and where did it lose it?**

1. **Attribution.**
   - For every graded recommendation, record which inputs pushed it. Compare hit rate and calibration (Brier, reliability bins) by input mix.
   - Find stages where a good input was overridden or diluted, for example fair lines vs expert consensus, or the prop screen vs podcast props.
2. **Failure modes,** each tested with evidence and sample sizes:
   - Receiving-yard Overs: W10 AI 4-10; P7 already flagged them.
   - Committee-RB and backup ATDs.
   - Defender tackles on big favorites (Lake on LAR -9.5, 2 tackles).
   - Milestone choice: how often one notch lower on DKP would have flipped a leg, and what it cost in price.
   - Public-side fades.
   - Totals in wind or weather.
   - QB INT (Andy's best category, season ~70%): is it real or luck?
3. **Construction review.**
   - Leg count vs realized hit rate. At 57% per leg, a 7-leg combo cashes about 2% of the time.
   - Overlap and correlation across tickets (P3).
   - DKP combo caps: payouts observed at about 46x in W6 and about 94.6x in W10.
   - Round robins.
   - Island tier construction vs its own odds bands.
   - Alejandro "core split" idea: a 3-4 leg split at +300 to +600 built from the strongest categories. Backtest it on W5-10.
4. **Calibration of the synthesizer itself.**
   - Did the stated tiers (A/B/C, "2- [C]") and the AI's probability estimates match outcomes?
   - Propose a recalibration if they don't.
5. **Recommendations for W11-18,** each tagged with:
   - the evidence and its n
   - the audits it passed
   - an expected effect on hit rate
   - a confidence level (high / medium / low)
   - whether it changes source weights, model inputs, synthesis rules, card construction or capture

   Keep it to the 10-15 highest-value changes. Andy approves before anything changes. P12 (re-audit after W13) still stands.

Deliverable: `reports/analysis/midseason-2026/synthesis-review-2026-11.md` + `.html`, with an executive summary first: the top 5 changes, the 3 sources to lean on more, and the 3 to cut or down-weight.

## Working rules Andy expects

- **Show arithmetic in code, not prose.**
- **Lead with numbers;** keep commentary short.
- **Mark small samples.**
- **Separate "real" from "not yet distinguishable from luck".**
- **Never place, log or settle wagers.** Proposals are non-binding until Andy says so.
- **Never `git add -A`.** Use `git commit --only <files>` on a branch, and leave Andy's dirty working tree alone.
- **Grade from cached or public box scores,** using the house rules already in `PLAN.md`: inactive-player handling is shown both ways, and an absent player counts as a loss under the house rule.
- **Independent check:** have a separate agent re-grade a random 10% of W10 picks from raw ESPN box scores without seeing your grades, then adjudicate any disagreements (step 5 of the W1-9 plan).
- **When you finish,** write a handoff in `handoffs/` with:
  - what was delivered
  - what's still open
  - the exact decisions Andy needs to make, as a numbered list he can answer yes or no
