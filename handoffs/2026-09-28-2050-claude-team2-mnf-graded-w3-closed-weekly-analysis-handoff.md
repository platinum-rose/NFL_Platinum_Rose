# Claude Team 2: MNF graded, Week 3 closed, weekly end-of-week analysis built

**Written:** Mon 2026-09-28 ~20:50 PT by Claude Team 2 (Cowork). **Replaces** `handoffs/2026-09-28-1910-claude-team3-mnf-placed-w1-3-settled-weekly-analysis-handoff.md` as the pick-up point. Guardrails unchanged (§5). Division of labour with Codex unchanged: Claude writes under `reports/analysis/w1-3-deep/claude/` and `reports/analysis/season/claude/`, Codex under `…/codex/` + `scripts/analysis/season-post-mortem/`, `FINDINGS.md` is shared and append-only.

## 1. Results
**MNF final: CHI 27, PHI 7 (total 34).** Every MNF-dependent ticket lost.

| Week | Cash tickets | Staked | Returned | Net |
|---|---|---|---|---|
| 1 | 21 | $370.77 | $80.56 | −$290.21 |
| 2 | 33 | $428.79 | $131.24 | −$297.55 |
| 3 (TNF–MNF) | 38 | $498.41 | $39.21 | **−$459.20** |
| **Season** | 92 | **$1,297.97** | **$251.01** | **−$1,046.96** |

Novig trade credits #1 and #2: both lost, $0 credit value. Placed legs hit, W3: 87/206 (42%); season 257/553.

- **Master RR #739361263 settled at $0, derived by grading** (its one live 4-team combo needed PHI −3; 0 of 70 combos won). **Andy has not yet confirmed the Bookmaker ticket.** If it shows anything else: `python reports/analysis/season/claude/scripts/grade_week.py --week 3 --payout 739361263=<USD> --apply` (settled tickets are skipped, so first set the RR's `status` back to `PENDING` in the wagers file), then re-run steps 4–6 of the runbook.

## 2. What this session did
| # | Work | Where |
|---|---|---|
| 1 | **MNF box score.** The ESPN API was blocked from both the device and the cloud shell (proxy 403). Transcribed the final box from the ESPN box-score page (firecrawl) and merged it into the cached summary. Column sums checked against ESPN's team rows. | `reports/analysis/season/claude/data/final-401872963.tsv`, `scripts/merge_box_tsv.py` → `data/fantasy/boxscores/espn-401872963.json` (added to git; `.pre-merge` copy is local only) |
| 2 | **Graded + settled Week 3** (8 open tickets) and filled 64 PENDING W3 legs (27 on already-dead tickets). 0 open W3 tickets. Backup `data/official-picks/user-placed-wagers-2026.json.bak-team2-20260929-031647`. Live Tracker regenerated. | `grade_week.py --week 3 --fill-dead-legs --payout 739361263=0 --apply` |
| 3 | **Ledger.** MNF results, D12/D13 graded IRRELEVANT, Week 3 close-out and season net. **Recovered the lost D1–D12 history:** the claude.ai DEV project still held the pre-rebuild ledger (Week 2 D1–D12, Week 3 TNF D13–D15). It is preserved verbatim as `claude/recommendation-ledger-2026-pre-rebuild.md` (cite as P-D1…P-D15) before the project ledger was replaced with the repo version. | `docs/claude-project-dev/recommendation-ledger-2026.md` + `…-pre-rebuild.md`; both mirrored to the DEV project |
| 4 | **Post-mortems.** Week 3 now "TNF through MNF · settled": KPIs, MNF row in the stake chart, SuperContest row, MNF recap with ticket cards, season-to-date table (new on this page), method note. Season tables updated in Weeks 1 and 2. `.pre-mnf` copies are local only. | `reports/bets/week3-recap/week3-post-mortem.html`, `reports/bets/season-recap/week{1,2}-post-mortem.html`, `reports/bets/week3-recap/scripts/patch_postmortems_mnf.py` |
| 5 | **W1–3 deep analysis re-run with MNF.** `core.py` now folds in the settled MNF results (`scripts/mnf_patch.py`; disable with `INCLUDE_MNF=0`). Team 2 core basket +$4/wk observed, −$18 no edge, −$26 conservative; W1–3 mix −$136. No recommendation changes. Pre-MNF outputs kept in `claude/pre-mnf/`. **W1–3 Basket Review republished** (same URL, v3). | `reports/analysis/w1-3-deep/claude/` |
| 6 | **Repeatable end-of-week analysis (handoff §3.4).** Week-parameterised, reads only the settled wagers file. Per week + season: net by book, ticket family, legs per ticket, price band, provenance; leg-market hit rates (Wilson CI, return per $1 where priced); H1–H6 re-tests; build-checklist compliance; cash exposure per game. **New artifact "Platinum Rose Season Review"** (https://claude.ai/artifact/WTZiq94LiJXozJF9LSN7j9). Runbook added to `docs/NFL_WEEKLY_CARD_PROCESS.md` ("End-of-week close-out"). | `reports/analysis/season/claude/` (README lists every script) |
| 7 | `[claude]` FINDINGS entries (4) and a SUMMARY.md MNF addendum. | `reports/analysis/w1-3-deep/FINDINGS.md` |

**Season findings worth carrying into Week 4 (all from `out/week-03-summary.md`):**
- Tickets that kept every Week 4 checklist rule: −$17.62 on $188.07 (10 tickets). Tickets that broke one: −$1,029.34 on $1,109.90 (82).
- H1 receiving props, team 35+ vs <35 attempts: 20/27 vs 30/80 (3.3 SE, post-game split → pre-game rule still a hypothesis). MNF fit it: PHI (26 att) receiving legs 2/8, CHI (34 att) 5/6.
- H5 dog spread $0.67/$1 on 33 priced (strong). Sacks 4/20, $0.58 (hypothesis). QB INT-yes $1.26 on 9 (hypothesis).
- H6 props on the losing team 67/164 vs 87/167 on the winner (2.05 SE; descriptive, post-game).

**Roster gate:** `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict --card reports/analysis/season/claude/roster-vet-names.md` → BLOCK on one name only: Zach Ertz (ESPN lists him on PHI's practice squad). He is in the final box score (1 rec, 9 yds), so he played on a game-day elevation; these are already-placed Andy-built tickets, not a recommendation. `--fetch` could not reach ESPN, so the vet used the 2026-09-28 18:48Z roster cache.

## 3. Open items
1. **Andy:** confirm master RR #739361263 payout ($0 expected).
2. **Andy's OK needed, not requested again this session:** W1–3 Bankroll sync / Supabase sync (all settlements are local-only in the gitignored wagers file); pick promotion (stale since 9/25).
3. **Provenance:** W1–3 Claude-vs-Andy split is inferred (Team 1 leg origins + notes) and is approximate; Week 3 shows 28 "claude" tickets. From Week 4, log `recommended_by: claude | mixed | andy` on each ticket when placed; correct guesses in `reports/analysis/season/claude/provenance.json`.
4. Codex C1/C4 still not landed in `reports/analysis/w1-3-deep/codex/`. When they do, point `weekly_review.py`'s leg inputs at them.
5. ESPN API blocked from both machines tonight (proxy 403 on `site.api.espn.com`, `site.web.api.espn.com`, `cdn.espn.com`, `sports.core.api.espn.com`). Future Live Tracker runs and `--fetch` roster vets will fail until that clears; `merge_box_tsv.py` is the fallback for finals.
6. Still open from before: wrong `actual_stat: 0` on 9 LOST legs (`w1-3-deep/claude/scripts/zero_sweep.py`); research-intel-ingest dry-run hang; Sharp Football MNF transcript truncated.
7. The Basket Review's ledger table still covers D1–D11 only (T2-C input); D12–D13 are graded in the ledger.

## 4. Git
Committed via temp `GIT_INDEX_FILE` + `read-tree` on origin `33dfbcf` + `commit-tree`, pushed with `git push origin <sha>:refs/heads/main`. Narrow file list only; local main ref still lags origin. Not committed: wagers file (gitignored) + backups, Live Tracker HTML, `.pre-mnf` / `.pre-merge` copies, `__pycache__`.

## 5. Guardrails (unchanged)
`main` only; never pull/reset/clean/stash or `git add -A`. No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK. Every player named must pass `npm run roster:vet -- --week <N> --date <capture-date> --fetch --strict`. Prop round robins are ruled out. Anything under ~2 SE is a hypothesis.

## 6. Resume prompt (next session — Week 4 build, any Claude team)
```
You are picking up NFL_Dashboard (E:\dev\projects\NFL_Dashboard; device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then handoffs/2026-09-28-2050-claude-team2-mnf-graded-w3-closed-weekly-analysis-handoff.md end to end, reports/analysis/w1-3-deep/claude/week4-build-checklist.md, reports/analysis/season/claude/out/week-03-summary.md and docs/NFL_WEEKLY_CARD_PROCESS.md (End-of-week close-out). Reconcile Git without pull/reset/clean/stash or `git add -A`; commit via a temp GIT_INDEX_FILE + read-tree <origin sha from `git ls-remote origin refs/heads/main`> + commit-tree and push with `git push origin <sha>:refs/heads/main`.
First: ask Andy to confirm master RR #739361263's Bookmaker payout (recorded $0) and whether he wants the W1–3 Bankroll/Supabase sync (needs his explicit OK). Then build the Week 4 card from the checklist (core basket ≈ $165), log `recommended_by` on every ticket Andy places, and after Week 4's MNF run the End-of-week close-out runbook (grade_week.py → weekly_review.py → build_season_report.py → republish "Platinum Rose Season Review" → post-mortem → ledger → FINDINGS).
No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK. Every player named must pass `npm run roster:vet -- --week 4 --date <capture-date> --fetch --strict`. Prop round robins are ruled out. Flag conclusions under ~2 SE as hypotheses. Hand off with a dated file in handoffs/ and update HANDOFF.md.
```
