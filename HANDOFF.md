# NFL_Dashboard — Current Handoff

## Pick up here — October 29, 2026

Reconcile live Git, read `AGENTS.md` / `CLAUDE.md`, then use `handoffs/2026-10-29-0215-claude-futures-hedge-planning.md` for the latest futures state (hedge planner, open parlays live, Oct 29 BetOnline ticket) and `handoffs/2026-10-28-1940-codex-claude-week8-futures-tnf.md` for the TNF pickup (CAR @ GB today, 5:15 PM PT; card still HOLD); earlier TNF detail: `handoffs/2026-10-28-1819-claude-h2c2-codex-week8-tnf-parlay-prep.md`. Earlier engineering refresh audit: `reports/engineering/week8-refresh-audit-2026-10-28.md`. Tracker implementation history: `handoffs/2026-10-28-0022-codex-tracker-engineering.md`.

### TNF pickup — Wednesday evening

- Andy confirmed the Week 8 Thursday cadence has **not** run. Run or inspect it on Thursday after the relevant updates; its Supabase and authenticated operations require Andy's scoped authorization. Do not use `--live` odds.
- FTN matchup research: `reports/engineering/week8-tnf-ftn-read-2026-10-28.md`. The local proposal draft at `reports/bets/2026-w08-card.md` contains two alternative, unmodeled scripts and is **HOLD** pending Thursday checks and actual SGP quotes. Post-write roster vet PASS, two distinct card players checked: `reports/engineering/week8-tnf-card-vet-2026-10-28-v2.json`.
- Andy approved two paid podcast extractions; one call per episode was made. The Ross Tucker Gemini timestamps extend past the video and are unusable; an independent free local ASR transcript is retained for audio verification. Sharp or Square's source lean is supported by separately retained YouTube automatic captions. See `reports/engineering/week8-tnf-podcasts-2026-10-28/README.md`. The earlier authorized read-only promoted-podcast query was performed once; it found zero rows under its created-at filter. No Supabase writes or official-pick publication.
- The earlier multi-lane refresh stopped when its subagents hit usage limits. Week 7 power data was partly refreshed; inspect `reports/engineering/week8-profile-refresh/` and validate before relying on every profile. Secondary matrix remains Week 7. Root restored `data/player-availability/latest.json` from the independently refreshed 4:30 PM snapshot after an interrupted, incorrectly labeled review; the rejected copy is retained under `reports/engineering/week8-refresh-run-2026-10-28/`. The availability deduper currently re-enables explicit `synthesis_eligible: false` holds; do not use that rejected filtered preview without fixing and testing the behavior.

- Working branch: `claude/w5-prop-cards-2026-10-11`.
- Last verified HEAD before the Oct 29 futures commit: `866e1f0`; that commit (which contains `handoffs/2026-10-29-0215-claude-futures-hedge-planning.md`) sits on top of it. Tracker code checkpoint: `6dca59f19c7e490b1793c8b67a16995137490379`. Extensive dirty/private/generated work remains; verify live before editing.
- Tracker verification: **21/21 focused tests**, prior offline Chromium false-Hit reproduction and fixed reload replay, source syntax and test lint. Later broad session run: **2,046 passed / 27 failed**; not a full-suite pass. Midday work changed data/reports only; no suite repeat.
- Schedule carry-forward tests (`371010c`) and scanner script repair (`d6ab1f0`) are committed. Tracker source now prioritizes recorded results over stale browser marks, isolates scoreboard data to the rendered week, and uses cached summaries on HTTP failure. Cadence wording now describes Supabase writes correctly.
- Real tracker artifacts were not rebuilt or published for this fix. Scheduled Windows jobs have dirtied both tracker HTML files and the market timestamp again; preserve them. The private Yahoo access document and untracked scratch/backups remain excluded.

## Next work

1. M6 active checkout was inspected clean and safely fast-forwarded to `71c6b4f` earlier this session. Reinspect before any further update. New Windows captures/previews have not been transferred.
2. ARI/MIN independent reconciliation completed with 11 role review tags; disagreements and prior human approvals remain. Details: `reports/engineering/week8-depth-chart-reconciliation-2026-10-28.json`.
3. FTN missing-Monday-game hold is cleared: all 36 tables recaptured; canonical Week 8 context passed 384 team-game-count checks. See `reports/engineering/week8-ftn-mnf-recheck-2026-10-28.md`.
4. Wednesday 9 AM run completed; do not rerun it or Tuesday. At approximately 1:10 PM PT, official TNF final reports and ESPN-only local previews are saved under `reports/engineering/week8-midday-2026-10-28/`. All 17 final-report entries roster-match. Canonical inputs and real tracker files were not replaced.
5. **Readiness HOLD:** canonical secondary/prop intel remain Week 7. Andy approved one read-only article retrieval, completed at 1:23 PM PT: 189 raw records retained locally; offline review assessed 159 current-window NFL records. One narrow-parser prop match is a parlay-only source leg, not a standalone pick. See `reports/engineering/week8-article-retrieval-2026-10-28.md`. This approval is fulfilled; no database writes or paid calls occurred in that action. The existing 3 PM scheduled run refreshed availability/starters/markets, then exited 1 at Alpha on the stale secondary/props dependencies. Its FantasyPros rows also need timestamp-provenance review. Existing task settings were not changed; do not rerun the cadence.
6. Capture remaining Wednesday practice evidence and review role/seed freshness before synthesis. TNF: CAR @ GB, October 29 at 5:15 PM Pacific. Real tracker activation still requires the roster gate, Andy's publication approval, and actual page verification. Hook wiring remains separately unverified.

## Guardrails

- Preserve dirty/concurrent work. No broad staging, reset, clean, stash, or unreviewed deletion. Use `git -c core.fsmonitor=false`.
- No account, wager, portfolio/ledger, Supabase, paid API/model action, or artifact publication without Andy's per-action OK. Live schedule ingest writes Supabase; dry-run can still write local caches.
- A passing live roster gate is required before player-named output. Saved October 27 clearance is not Wednesday PM clearance.
- Active M6 path: `/home/andrewlrose/projects/NFL_Dashboard_w5_current`. Leave legacy checkouts and frozen backups alone.

Details: `reports/engineering/live-tracker-correctness-2026-10-28.md`. Prior scope and original guardrails: `handoffs/2026-10-27-1735-claude-h2c2-codex-week8-wednesday.md`.
