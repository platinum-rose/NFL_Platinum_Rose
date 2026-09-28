# NFL_Dashboard handoff — 2026-09-28 (Mon, pre-MNF)

Repo handoff: `handoffs/2026-09-28-1200-claude-week1-3-post-mortems-burn-report-expert-scorecard-handoff.md` (commit `2331c3d`, pushed to origin/main via commit-tree workaround).

## Done this session
- Week 1, 2, 3 post-mortems (`reports/bets/week3-recap/`, `reports/bets/season-recap/`).
- Cumulative Week 4 playbook — artifact https://claude.ai/artifact/ANApKDEgpQEN59Gb6UiY9C; summary in `claude/week4-playbook-2026.md`.
- Week 3 Burn Report + Twitter expert prop scorecard — artifact https://claude.ai/artifact/16HuRUb51ktWLptf4jfCBh.
- Decision: prop round robins permanently out (no book offers them; too labor-intensive by hand).

## Git hygiene
Stale locks now include `.git/refs/remotes/origin/main.lock` too. Andy: `del .git\index.lock .git\HEAD.lock .git\refs\heads\main.lock .git\refs\remotes\origin\main.lock`. Local `main` ref lags origin (`2fe6548` vs `2331c3d`) until then.

## Next
1. Ask Andy what he placed for MNF PHI @ CHI; grade master RR #739361263 (PHI −3), Novig credits (expire Tue 9/29 5 PM ET), MNF tickets.
2. Settle Week 3; fix flagged wagers-file grading errors (W3 McBride/Pat Bryant/Bonitto/RJ Harvey; W1 JSN; W2 Likely/Newsome/Malachi Fields) with Andy's OK; update `claude/recommendation-ledger-2026.md`.
3. Extend expert scorecard (prices, first-TD vs ATD split, podcast/YouTube experts) → Week 4 prop screen from the follow list (Sal Bets, Joe Holka, Harry Lock standard lines, Cody Brown yardage).

## Resume prompt
```
Resume in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then handoffs/2026-09-28-1200-claude-week1-3-post-mortems-burn-report-expert-scorecard-handoff.md, and the DEV project doc claude/week4-playbook-2026.md. Reconcile live Git without pull/reset/clean/stash; stale .git/index.lock, .git/HEAD.lock, .git/refs/heads/main.lock and .git/refs/remotes/origin/main.lock may exist, so use the GIT_INDEX_FILE / commit-tree workaround (push with `git push origin <sha>:refs/heads/main`) or ask Andy to delete them. Continue the Weeks 1–3 analysis in reports/bets/season-recap/ (burn-report.html, week4-playbook.html, expert_props.json, scripts/experts.py). First ask Andy what he placed for MNF PHI @ CHI; after MNF, grade master RR #739361263 (needs PHI −3), the Novig credit tickets and any MNF tickets, settle Week 3, fix the flagged wagers-file grading errors with Andy's OK, and update the DEV ledger claude/recommendation-ledger-2026.md. Prop round robins are ruled out (no book offers them; too labor-intensive by hand). Every player named must pass `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict` (use --week 4 for Week 4 work). No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK.
```
