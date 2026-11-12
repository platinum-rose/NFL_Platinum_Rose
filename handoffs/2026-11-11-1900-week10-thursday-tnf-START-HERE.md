# Week 10 handoff: Wednesday intel done, Thursday TNF next (START HERE)

Written Wed 11/11 ~7:00 PM PT by Claude Team 2. Previous handoff: `handoffs/2026-11-10-1500-week10-intel-gathering-START-HERE.md`.
Repo: `E:\dev\projects\NFL_Dashboard` (checkout on branch `claude/w5-prop-cards-2026-10-11`; commits go to `main` via a temp index built from `refs/heads/main`).

## Standing rules (unchanged)
- No wagers, sportsbook or pool-site actions, ledger edits, Supabase writes or TheOddsAPI calls without Andy's per-action OK.
- Read the toolbox cadence logs; don't re-run the cadences.
- `git -c core.fsmonitor=false` always; commit only when Andy asks; scoped paths; no .bak/.prev/__pycache__.
- Back up any file before editing it as `*.bak-claude-<date>-<tag>`.
- Cash rules: R9-1 (cash max 6 legs; 7+ promo only), C2-C5, leg floor -350. C4 = no totals or same-team stacks on a shaky-QB game before inactives. Promo tickets (DK Predictions, Pick6, FDP promos) are exempt.
- Use the existing capture utilities by default (e.g., FTN Stats iQ capture in Andy's signed-in Chrome), not manual steps for Andy.
- Write a local copy of every handoff doc.

## Done through Wednesday 11/11
- **Card:** `reports/bets/2026-w10-card.md`. Rules, C4 list (MIN@GB, SEA@LV, LAR@ARI, MIA@IND, LAC@BAL, WAS@NYG), QB picture, slate table (DK open / BEO 1:10 PM / fair / intel), leads L1-L12, TNF section.
- **Fair lines:** `reports/intel/w10-model/` (`fair_lines_w10.py`, `fair-lines-w10.json`, `fair-lines-w10.beo-1310.json`, `w10-fair-lines-summary.md`). Re-run 11/11 ~6:30 PM PT on the full W9 FTN capture.
  - BEO run: build a plain lines JSON from `beo-lines-2026-11-10-1310.json` minus `_source`, then set `W10_LINES=<that file> W10_LINES_LABEL="BEO 11/10 1:10 PM" W10_OUT=fair-lines-w10.beo-1310.json`. W10_OUT is relative to the model folder.
  - Edges vs BEO: JAX 2.6, SF 2.5, CAR 1.8, KC 1.5. LAC@BAL leans BAL by 1.8, but the models disagree, so skip that side.
- **FTN:** `data/research-intel/source-evidence/2026-11-11-pm-ftn-stats-iq/`. 36/36 tables, 32/32 GP agreement, MNF included. Context rebuilt with `--week 10`. Andy should delete the `stats-iq-*.csv` files from Downloads.
- **QB notes:** `reports/bets/2026-w10-slate-qb-notes.md` (Wed update: Watson starts for CLE, MIN starter TBD, Mahomes full, McCarthy and Skattebo full).
- **Packets:** `reports/bets/2026-w10-slate-prep-packet.md` and `reports/bets/2026-w10-tnf-prep-packet.md`.
- **Podcasts:** Antigravity W10 sweep in `reports/intel/antigravity-w10-tuesday-podcast-sweep.md`; veracity check in `reports/intel/w10-podcast-veracity-2026-11-10.md`.
- **Pools:** preliminary picks submitted by Andy. See `reports/pickem/2026-w10-pickem.md` and `data/pickem/plan-2026-w10.json`.
- **Futures:** `reports/bets/2026-w10-futures-review.md`. Covers the JAX-vs exacta plan (JAX/SF $12.50, JAX/CHI $9.40, JAX/SEA $4.50, funded by BEO reloads) and the Kalshi/Circa checks.
- **TNF tickets logged:**
  - Andy's real FDP 4-leg ticket, $5 to pay $21.94. Ledger id `bet_20261111_fdp_tnf_sgc4_...`, synced to Supabase.
  - DK Predictions paper ticket `paper_w10_andy_imaginary_dkp_tnf_4pick`: $10 to pay $250, never placed because the DK weekly limit was hit; Andy filed a support ticket.
- **AI proposal record:** `data/official-picks/ai-proposals/2026-w10.json` (`w10-tnf-candidates-wed`).

## Thursday 11/12: TNF WAS @ NYG (kick 5:15 PM PT)
1. Before ~3:45 PM PT inactives, Andy runs the prop captures:
   - `.\runbkrprops.cmd` (Bookmaker sign-in)
   - `.\runbolprops.cmd`
   - `.\rundkprops.cmd`
2. Price the TNF candidates: Styles 8+ tackles+assists, Reese 7+, Skattebo 40+ rush, Nabers lowest receiving rung, McCarthy sacked 2+. No side; no total under C4 until McCarthy is confirmed.
3. Propose up to 2 cash tickets plus a promo ticket for Andy's OK. Andy pastes each slip for verification before buying.
4. Check the SuperContest W10 lines (`data/supercontest/week-10-lines.json`; there were 0 at 12:45 PM Wed).
5. Re-check pools: McCarthy's status, and the WAS-over-NYG leverage decision for the duma 7-10 window.
6. DK Predictions limit resets Saturday. Pick6 and FDP remain available for promo stacks.

## Mid-season post-mortem: due Fri/Sat
- Folder: `reports/analysis/midseason-2026/`. Start with `PLAN.md`, then `interim-findings-2026-11-11.md`.
- All graders/scorers are built. The independent re-grade agreed on 138/140; both disagreements are fixed.
- Remaining: write `midseason-postmortem.md` plus an HTML version, with a ranked source table and proposed W11-18 changes for Andy's OK. Save a DEV project copy too.
- Headlines so far:
  - W1-4: -$1,317. W5-9: +$1,094.
  - Master RRs: -$441. 3-leg tickets: 0/16. BetOnline: 0/112.
  - Prop screen: Unders +5.9u vs Overs -43.4u.
  - Podcasts: BettingPros +14.3u; Action Network -31.1u.
  - The analytics-first W9 fair lines beat the market.

## Open questions for Andy
- A possible duplicate SNF DK 2-pick (`_dup2`) in the ledger.
- `bet_20261108_fdp_6pick...`: the id says fdp, but the book is DK Predictions.
- "Bookmaker" vs "Bookmaker.eu" book labels.
- Does BEO allow AFC+NFC conference parlays? This decides the JAX-vs plan.
- `data/futures-imports/andy-portfolio-ledger-2026.json` has 9 new exacta positions plus 4 edits that Team 2 didn't make. They were left out of the 11/11 commit; whoever owns them should commit them.
