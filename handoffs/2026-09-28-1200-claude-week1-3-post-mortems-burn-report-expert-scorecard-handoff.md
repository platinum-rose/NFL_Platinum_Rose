# Weeks 1–3 post-mortems, Week 4 playbook, Week 3 burn report + Twitter expert scorecard

**Session:** Claude (Cowork), Sun 2026-09-27 21:30 → Mon 2026-09-28 ~12:00 PT. Continues `handoffs/2026-09-27-2130-claude-week3-sunday-graded-mnf-prep-handoff.md`.

## State at handoff
- Git: `main`. This session's work is committed in the commit carrying this file (GIT_INDEX_FILE / commit-tree workaround — stale `.git/index.lock`, `.git/HEAD.lock`, **and `.git/refs/heads/main.lock`** exist; push with `git push origin <sha>:refs/heads/main`, so the local `main` ref may lag origin until Andy runs `del .git\index.lock .git\HEAD.lock .git\refs\heads\main.lock`).
- No wagers, Supabase writes, Bankroll sync or TheOddsAPI calls. One read-only Supabase pull (`data/generated/master-intel/w01-pull.json`, gitignored: 3,366 signals / 149 expert picks) fed the expert scorecard.
- **MNF PHI @ CHI (tonight 5:15 PT) is still ungraded.** MNF intel note written: `reports/bets/week3-mnf-phi-chi-intel-update-2026-09-27.md`. Novig credit #2 and the BKR MNF ladder: status not confirmed this session — ask Andy what (if anything) he placed.

## What was built (all in `reports/bets/`)
- `week3-recap/week3-post-mortem.html` (+ `w3legs.json`, `w3paper.json`, `w3gamesum.json`, `scripts/`) — full Week 3 grade: sides/totals/props, closest parlays, leg categories, AI vs Andy divergences, game recaps.
- `season-recap/week1-post-mortem.html`, `week2-post-mortem.html` — same format for Weeks 1–2 (`gen_week.py` + `cfg_w1/w2.py`).
- `season-recap/week4-playbook.html` + `cum*.json` — cumulative Weeks 1–3 analysis and a proposed Week 4 mix (≈$240). Artifact: https://claude.ai/artifact/ANApKDEgpQEN59Gb6UiY9C
- `season-recap/burn-report.html` (+ `w3burnt.json`, `expert_props.json`, `expert_sides.json`, `scripts/experts.py`, `yt.py`, `burn_build.py`, `burn_page.py`) — why each Week 3 leg burnt, per game, plus Twitter expert prop/side records W1–3. Artifact: https://claude.ai/artifact/16HuRUb51ktWLptf4jfCBh
- DEV project doc `claude/week4-playbook-2026.md` holds the summary numbers.

## Key findings
- Season W1–3 (excl. MNF): $1,266.11 staked, $251.01 back, **−$1,015.10**. Legs 48.7% vs 53.4% break-even. 5+ leg parlays 0/58 ($525); 4-team master RRs 0/3; 2-team RRs 3/4 (+14%) — the only profitable structure.
- Strong-evidence leaks: dog spreads 13/35, receptions 20/46. Winners: pass TD overs, QB INT-yes, dog MLs, +150-or-longer prices. AI-backed props +19%; AI-backed sides −26%.
- W3 burn causes (87 legs): side/total lost 26 · TD to someone else 20 · no volume 16 · sack/INT/tackle didn't happen 13 · QB script 8 · efficiency 4. LAR@DEN burnt 21, ATL@GB 13 (correlated stacks).
- Twitter prop records (ladders collapsed, no prices): **follow** Sal Bets 34–28 (tails 10–3, + all 3 weeks), Joe Holka 29–23 (ATD 11/19), Harry Lock 38–29 (standard lines 14/22), Cody Brown 26–20 (yardage); **screener** Dan's AI 57–44 (alt-line inflated); **fade** SharpieMatters 15–37, FirstTDBets 1–15. Our legs matching an expert 46–37 vs 93–110 unbacked. Sides: experts 118/240, no edge. Caveats: thin W1 Twitter coverage, some first-TD picks graded as ATD.

## Decisions
- **Prop round robins are permanently out** — no book offers them and hand-building combos is too labor-intensive for the return. Substitute: 2–3 hand-built 2-leg prop tickets.

## Wagers-file grading errors found (NOT fixed — confirm with Andy before editing)
- W3: McBride 7+ (had 9), Pat Bryant 28+ (44), Bonitto sack, RJ Harvey 3+ (6) marked lost but hit per ESPN.
- W1: DK NE@SEA JSN legs. W2: MNF Likely, Newsome, Malachi Fields ×2.

## Open items for the next session
1. Grade MNF PHI @ CHI: master RR #739361263 (needs PHI −3), Novig credit #1 (PHI ML + U41.5), Novig #2 / any MNF tickets. Novig credits expire **Tue 9/29 5:00 PM ET**.
2. Settle Week 3; fix the wagers-file grading errors above (with Andy's OK); update DEV ledger `claude/recommendation-ledger-2026.md`; re-run post-mortem/playbook numbers with MNF included.
3. Continue the analysis: extend the expert scorecard (add prices where available, split first-TD vs ATD, add podcast/YouTube experts), and turn the "follow" list into a Week 4 prop screen.
4. Week 4 build (TUE–WED) per `season-recap/week4-playbook.html`; TNF PIT @ CLE island ladder.
5. Only with Andy's explicit OK: Bankroll sync dry-run; Supabase sync of Week 2 changes.

## Resume prompt
```
Resume in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then handoffs/2026-09-28-1200-claude-week1-3-post-mortems-burn-report-expert-scorecard-handoff.md, and the DEV project doc claude/week4-playbook-2026.md. Reconcile live Git without pull/reset/clean/stash; stale .git/index.lock, .git/HEAD.lock and .git/refs/heads/main.lock may exist, so use the GIT_INDEX_FILE / commit-tree workaround (push with `git push origin <sha>:refs/heads/main`) or ask Andy to delete them. Continue the Weeks 1–3 analysis in reports/bets/season-recap/ (burn-report.html, week4-playbook.html, expert_props.json, scripts/experts.py). First ask Andy what he placed for MNF PHI @ CHI; after MNF, grade master RR #739361263 (needs PHI −3), the Novig credit tickets and any MNF tickets, settle Week 3, fix the flagged wagers-file grading errors with Andy's OK, and update the DEV ledger claude/recommendation-ledger-2026.md. Prop round robins are ruled out (no book offers them; too labor-intensive by hand). Every player named must pass `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict` (use --week 4 for Week 4 work). No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK.
```
