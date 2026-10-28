# NFL_Dashboard — Current Handoff

## Pick up here — October 28, 2026

Read `handoffs/2026-10-28-0022-codex-tracker-engineering.md`, then reconcile live Git and read `AGENTS.md` / `CLAUDE.md`.

- Working branch: `claude/w5-prop-cards-2026-10-11`.
- Code checkpoint: `6dca59f19c7e490b1793c8b67a16995137490379`; this documentation closeout follows it. Verify final HEAD/upstream live.
- Verified: **21/21 focused tests**, offline Chromium false-Hit reproduction and fixed reload replay, source syntax, test lint, and staged secret-pattern/whitespace checks. No full-suite result is claimed.
- Schedule carry-forward tests (`371010c`) and scanner script repair (`d6ab1f0`) are committed. Tracker source now prioritizes recorded results over stale browser marks, isolates scoreboard data to the rendered week, and uses cached summaries on HTTP failure. Cadence wording now describes Supabase writes correctly.
- Real tracker artifacts were not rebuilt or published for this fix. Scheduled Windows jobs have dirtied both tracker HTML files and the market timestamp again; preserve them. The private Yahoo access document and untracked scratch/backups remain excluded.

## Next work

1. Inspect the active M6 worktree before updating it; last verified clean at `ba8b2e7`, not advanced by this Windows closeout.
2. Finish the independent depth-chart reconciliation; sampled position differences remain. Inspect Wednesday run logs/readiness before considering any cadence.
3. Next cadence is **Wednesday**, then Wednesday PM after practice reports. **Do not rerun Tuesday.** TNF: CAR @ GB, October 29 at 5:15 PM Pacific.
4. Real tracker activation requires the roster gate, Andy's publication approval, and actual page verification. Hook invocation paths also need separate review; scanner syntax is fixed, automatic wiring is unverified.

## Guardrails

- Preserve dirty/concurrent work. No broad staging, reset, clean, stash, or unreviewed deletion. Use `git -c core.fsmonitor=false`.
- No account, wager, portfolio/ledger, Supabase, paid API/model action, or artifact publication without Andy's per-action OK. Live schedule ingest writes Supabase; dry-run can still write local caches.
- A passing live roster gate is required before player-named output. Saved October 27 clearance is not Wednesday PM clearance.
- Active M6 path: `/home/andrewlrose/projects/NFL_Dashboard_w5_current`. Leave legacy checkouts and frozen backups alone.

Details: `reports/engineering/live-tracker-correctness-2026-10-28.md`. Prior scope and original guardrails: `handoffs/2026-10-27-1735-claude-h2c2-codex-week8-wednesday.md`.
