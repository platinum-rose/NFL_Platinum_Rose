# Claude Team 2 → fresh Claude session: continue the Weeks 1–3 deep analysis

**Written:** Wed 2026-09-30 ~01:10 PT by Claude Team 2 (Cowork), at Andy's request, to continue the W1–3 deep analysis in a fresh session. This is the pick-up point for the **analysis lane**. It does not replace the futures-lane handoff (`handoffs/2026-09-30-0050-claude-futures-exactas-placed-week4-intel-resume-handoff.md`) or Codex's Week 4 intel handoff (`handoffs/2026-09-29-1235-codex-tuesday-pipeline-w1-3-week4-m6-handoff.md`). Background: `handoffs/2026-09-28-2050-claude-team2-mnf-graded-w3-closed-weekly-analysis-handoff.md` (Week 3 close, season tools). Guardrails in §5 are unchanged.

## 1. Where things stand
- **Settled record (local, gitignored wagers file):** W1 −$290.21 · W2 −$297.55 · W3 −$459.20 · **season −$1,046.96 on $1,297.97** (92 cash tickets). Every W1–3 ticket is SETTLED. Master RR #739361263 is recorded at **$0, derived by grading — Andy has still not confirmed the Bookmaker ticket.**
- **Claude outputs:**
  - `reports/analysis/w1-3-deep/claude/`: T2-A…T2-D, SUMMARY, Week 4 checklist, Basket Review (artifact https://claude.ai/artifact/K7YdWU2GMvdqG7HFfZUFMF, v3, MNF included). `scripts/core.py` folds MNF in via `scripts/mnf_patch.py`; pre-MNF outputs are in `pre-mnf/`.
  - `reports/analysis/season/claude/`: weekly tools and the Season Review artifact (https://claude.ai/artifact/WTZiq94LiJXozJF9LSN7j9); README lists the scripts.
- **Codex C1/C4 have landed** in `reports/analysis/w1-3-deep/codex/` (commit on origin after `2a2d40b`):
  - C1 `legs_all.csv` / `regrade_legs.json`: 559 legs, 547 resolved (256 W / 291 L / 1 P). **0 terminal mismatches** vs the ledger and vs Team 1's tables. 11 unresolved: 6 CFB/open-slot, 5 unmatched players. 2 ledger legs still PENDING though they independently lost. These are almost certainly the two W2 dead-ticket legs that `grade_week.py --week 2 --fill-dead-legs` would fill; it was not applied.
  - C4 `alternative_baskets.json`: a distinct-game bootstrap of all-legs-won rates (single 46.4%, 2-leg 21.4%, 3-leg 10.1%, 4-leg 4.9%, 5-leg 2.1%). Descriptive only; no ROI.
- **Findings so far** (FINDINGS.md `[claude]` and `[codex]` entries; season re-test in `reports/analysis/season/claude/out/week-03-summary.md`):
  - **Strong:** dog spreads $0.67/$1 (2.1 SE); AI side/total picks −26% (2.7 SE); receiving props when the team threw <35 times, 30/80, with the 35+ vs <35 gap at 3.3 SE (**post-game split**).
  - **Hypotheses:** QB INT-yes, pass-TD overs, ATD with team 3+ TDs, dog ML, sacks negative, props on the losing team (2.05 SE, **post-game**).
  - **Checklist:** tickets that kept every Week 4 rule −$18 on $188; tickets that broke one −$1,029 on $1,110.

## 2. What the deep analysis still needs (in priority order)
1. **Switch to Codex C1 as the canonical leg table.**
   - Add a loader in `claude/scripts/core.py` (or a new `core_c1.py`) that reads `codex/legs_all.csv` (fields: week, book, ticket, structure, leg, game, player, market, direction, line, price, implied_prob, result, actual, evidence, baseline_origin, baseline_ai_sources, …).
   - Keep Team 1's AI-only and paper legs (not in C1) from `cum.json` / `w*legs.json`.
   - Re-run t2a–t2d on it and write a short reconciliation: position counts, and any category whose hit rate or return moves by more than ~1 point.
   - Compare C4's bootstrap all-legs-won rates with t2d's simulated no-edge hit rates by leg count. Note that C4 excludes same-game correlation and t2d models it at ρ = 0.15.
2. **Turn the post-game findings into pre-game rules.** This is the main analytical gap: H1 (35+ pass attempts), H2 (team 3+ TDs) and H6 (losing team) all split on post-game facts, so they can't yet be used to build a card.
   - Pre-game proxies are available. `public/schedule.json` has ESPN spread and total for all 48 W1–3 games (`odds_source: espn`), and each `data/fantasy/boxscores/espn-*.json` has a `pickcenter` block. Implied team total = total/2 − spread/2 for the team laying points.
   - **H1:** does implied team total, spread (trailing script) or opponent pass-defense rank predict 35+ attempts? Fit a simple logistic or bucketed model on W1–3 team-games (96 of them), then re-test receiving-prop hit rates by the **pre-game** bucket.
   - **H2:** re-test ATD by pre-game implied team total ≥ 24 (the checklist rule) rather than realised TDs.
   - **H6:** re-test props by pre-game favourite vs dog.
   - Report each at ≥ 2 SE or label it a hypothesis. Update `week4-build-checklist.md` only where a pre-game rule clears 2 SE.
3. **Grade the recovered ledger history.**
   - `docs/claude-project-dev/recommendation-ledger-2026-pre-rebuild.md` (cite as P-D1…P-D15: W2 D1–D12, W3 TNF D13–D15) was recovered after T2-C ran; T2-C only covered the rebuilt D1–D11.
   - Add P-D1…P-D12 and D12–D13 (MNF) to T2-C's divergence table, as a Claude-right / Andy-right / neither tally.
   - Refresh the Basket Review's ledger panel, which is still labelled D1–D11.
4. **Better Claude-vs-Andy provenance.**
   - Replace the heuristic in `reports/analysis/season/claude/scripts/weekly_review.py` (`provenance_map`) with C1's per-leg `baseline_origin` (agree / andy / unlogged) where available. Keep `provenance.json` overrides on top.
   - Recompute the provenance cut. The current one calls 28 of 38 W3 tickets "claude", which looks too high.
5. **More priced legs.**
   - `season/claude/scripts/lib.py` only uses prices written on the ticket, and many BetOnline prop legs have none.
   - Port `w1-3-deep/claude/scripts/core.py`'s `load_boards` / `board_price` (BEO board captures in `data/generated/props/`) into the season lib, so return per $1 covers W2–W3 props. Flag board-priced legs separately from ticket-priced ones.
6. **Data hygiene** (report only; each write to the wagers file needs Andy's OK first):
   - the 2 PENDING W2 legs
   - C1's 5 unmatched-player legs (identify them)
   - the 9 LOST legs with a wrong `actual_stat: 0` (`w1-3-deep/claude/scripts/zero_sweep.py`)
   - Team 1's 7 stale `pending` rows in `reports/bets/week3-recap/w3legs.json` (Team 1's file; flag it, don't edit).
7. **Close out.**
   - Update `claude/SUMMARY.md` and republish the Basket Review (same URL; read it first).
   - Re-run `season/claude/scripts/weekly_review.py --week 3` + `build_season_report.py --week 3` and republish the Season Review if the inputs changed.
   - Append `[claude]` FINDINGS entries, write a dated handoff, and update HANDOFF.md.

## 3. Open items that need Andy (don't block the analysis on them)
- Confirm master RR #739361263's Bookmaker payout ($0 recorded).
- W1–3 Bankroll / Supabase sync — needs his explicit per-action OK.
- ESPN's API was blocked from both machines on 9/28 (proxy 403). If it still is, `--fetch` roster vets use the cache, and `reports/analysis/season/claude/scripts/merge_box_tsv.py` is the fallback for finals.

## 4. Git
Origin was `16d8061` at 01:10 PT. Other lanes (futures, Codex Week 4) are committing in parallel, and the M6 checkout may be behind origin. This handoff was committed via a temp `GIT_INDEX_FILE` + `read-tree <origin sha>` + `commit-tree`, and pushed with `git push origin <sha>:refs/heads/main`. HANDOFF.md was edited from **origin's** copy (the local file lags).

## 5. Guardrails (unchanged)
- `main` only; never pull/reset/clean/stash or `git add -A`.
- Claude writes under `reports/analysis/w1-3-deep/claude/` and `reports/analysis/season/claude/`. Codex writes under `…/codex/` + `scripts/analysis/season-post-mortem/`. FINDINGS.md is append-only.
- No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK. The wagers file is read-only for this lane unless Andy approves a specific fix.
- Every player named must pass `npm run roster:vet -- --week <N> --date <capture-date> --fetch --strict`.
- Prop round robins are ruled out.
- Anything under ~2 SE is a hypothesis. Post-game splits are descriptive until a pre-game version is tested.

## 6. Resume prompt
```
You are Claude Team 2, continuing the Weeks 1–3 deep analysis for NFL_Dashboard. Work in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then handoffs/2026-09-30-0110-claude-team2-w1-3-deep-analysis-continue-handoff.md end to end, then reports/analysis/w1-3-deep/claude/SUMMARY.md, reports/analysis/w1-3-deep/FINDINGS.md, reports/analysis/w1-3-deep/codex/README.md and reports/analysis/season/claude/README.md. Reconcile Git without pull/reset/clean/stash or `git add -A`; the local checkout lags origin, so read shared files (HANDOFF.md, FINDINGS.md) from origin (`git show origin/main:<path>`) before editing, commit via a temp GIT_INDEX_FILE + read-tree <origin sha from `git ls-remote origin refs/heads/main`> + commit-tree, and push with `git push origin <sha>:refs/heads/main`.

Tasks, in the handoff's §2 order:
1. Make Codex C1 (codex/legs_all.csv) the canonical leg table for t2a–t2d (keep Team 1's AI-only/paper legs), re-run, and reconcile against the Team 1 baseline and Codex C4.
2. Turn H1 (35+ pass attempts), H2 (team TDs) and H6 (losing team) into pre-game rules using the ESPN spreads/totals in public/schedule.json and box-score pickcenter (implied team totals, favourite/dog), and re-test them. Update week4-build-checklist.md only where a rule clears 2 SE.
3. Add the recovered pre-rebuild ledger (P-D1…P-D15) and D12–D13 to the T2-C divergence tally.
4. Replace the season tool's provenance heuristic with C1 baseline_origin.
5. Board-price the unpriced BEO prop legs in the season lib.
6. List (don't write) the data-hygiene fixes for Andy's OK.
7. Update SUMMARY.md, republish the W1–3 Basket Review (https://claude.ai/artifact/K7YdWU2GMvdqG7HFfZUFMF) and, if inputs changed, the Season Review (https://claude.ai/artifact/WTZiq94LiJXozJF9LSN7j9), append [claude] FINDINGS entries, and hand off with a dated file in handoffs/ plus a HANDOFF.md update.
Flag conclusions under ~2 SE as hypotheses. No wagers, account actions, TheOddsAPI calls, Supabase writes, Bankroll sync or wagers-file edits without Andy's explicit per-action OK. Every player named must pass `npm run roster:vet -- --week <N> --date <capture-date> --fetch --strict`. Prop round robins are ruled out.
```
