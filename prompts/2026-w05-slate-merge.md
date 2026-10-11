# Week 5 Slate Merge (runs after the 14 single-game runs)

Run parameters (set by the launch message): `MODEL` = `astra` or `opus`; `HEAD` = expected short git commit.

This stage reads only your own model's 14 single-game outputs. It adds no new evidence and no new probabilities: its job is slate-level selection, consistency and exposure, which a single-game run cannot do.

## Boundaries

Read-only, proposed-analysis-only. No wager, pool entry, cashier, TheOddsAPI, Supabase write, ledger/official-pick change, ticket, stake or payout math. Do not commit, push, stage, reset, clean, stash, or overwrite. Preserve the dirty shared checkout. Do not read another model's outputs.

## Step 0: gates (stop on any FAIL)

1. `python3 scripts/intel/week5-preflight.py --model MODEL --game SLATE --prompt prompts/2026-w05-slate-merge.md --expect-head HEAD --espn`. Pinned artifacts it verifies (do not regenerate): calibration JSON sha256 `0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33`; nflverse CSV sha256 `51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51`. Any `[FAIL]`: stop. Existing slate-merge output files are a stop unless the launch message says to overwrite.
2. `python3 scripts/intel/validate-game-output.py --model MODEL --all`. All 14 games must pass. A game whose output is missing or failing is listed as `unavailable` and excluded from every ranking.
3. Compare each game's `market.captured_at` and the packet's `fresh_at_build` with the current time. Any game whose BKR window has lapsed is `stale_for_recommendation`: keep it in the table, exclude it from rankings, and say what recapture would restore it.
4. Games already started or final per ESPN are excluded (the preflight reports this).

## Step 1: build the slate table

One row per game from the JSON outputs only: disposition, tier, side lean, total lean, edge hypothesis (margin, total), simulator probabilities (labelled conditional on the hypothesis), BKR/BEO conflict flag, QB/availability invalidators, weather flag, and the schedule/standings fact the single-game run called most decision-relevant.

## Step 2: slate-level checks the single-game runs could not do

- **Edge sanity.** Report the distribution of your 14 edge hypotheses. If the average absolute margin edge exceeds 1.5 points, you are probably over-disagreeing with an efficient market: shrink every edge by the same stated factor, rerun the simulator CLI for the shrunk values, and show both sets.
- **Correlation and exposure.** Identify games whose theses share a driver (same quarterback story, same weather system, same division) and sides/totals that move together (favorite plus Over, dog plus Under). Describe the shared risk in words. Do not multiply prices or compute parlay payouts.
- **Internal consistency.** A side lean and a total lean for the same game must tell one coherent score story. Flag any that do not.
- **Standings stakes.** Note games where seeding or division stakes are asymmetric, with the packet's numbers. Context only.
- **Price tiers.** Rankings use only `tier` 2 and 2-, ordered by tier then by the size of your own edge hypothesis; ties are listed as ties. Never pad a list: return fewer entries than the old targets (up to 10 sides, up to 8 totals) when the evidence is thin, and show the omitted games with the reason.

## Step 3: contest and pool sections (kept separate from sportsbook rankings)

- **SuperContest.** Read `data/supercontest/week-05-2026-verified-lines.json` for rules and lines. Its away/home labels are reversed for six games (TEN@HOU, MIA@CIN, NO@MIN, GB@CHI, LAC@DEN, ARI@DET); join by unordered team pair and use its favorite/spread fields. Propose five choices and five alternates at the contest lines, each tied to its game output, flagging any difference between the contest line and the BKR line. Proposed only.
- **Pick'em / confidence pools.** State the exact pool file, rules and lock time, or `pool rules unavailable`. Order by win probability only where the single-game outputs support it.
- **Survivor** is not an output (both pools are lost); report data-quality notes only.
- **Props.** Merge the single-game `props` arrays into one menu split into `source-supported`, `usage context only` and `high-variance TD`. Titled "construction menus — not tickets"; show legs, thesis, correlation and anti-correlation risks; builder/pricing verification required.

## Step 4: outputs (new files only)

1. `reports/intel/2026-w05-MODEL-slate-merge.md`: slate table, sanity and exposure findings, gaps.
2. `reports/bets/2026-w05-MODEL-decision-support.md`: rankings, SuperContest five and alternates, pools, prop menus (all labelled proposed only).
3. `data/research-intel/proposed/2026-w05-MODEL-slate-merge.json`: machine-readable version of the table and lists, with the paths of the 14 inputs and their sha256.

## Final response (short)

Files written; validator result for all 14 games; which games were excluded and why; the top sides/totals/SuperContest five (proposed only); whether the edge-sanity check forced shrinkage; confirmation that no ticket, account, Supabase, ledger or official-pick state changed.
