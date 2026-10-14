# Handoff — BEO futures capture built; live run in flight (Tue 2026-10-13 ~21:45 PT)

Branch `claude/w5-prop-cards-2026-10-11`. Parent HEAD `d0addbd` (secondary-matchup commit, pushed).

## State
- `scripts/props/cron-bol-futures-scrape.mjs` (`npm run futures:bol`): CDP capture of 19 explicit BetOnline futures pages; clicks SHOW MORE, wheel-scrolls and snapshots the virtualized list; parser `parseFuturesDump`; gate `validateFuturesGate` (pages>0, >=20 rows, 0 bad rows, warns if a Super Bowl market has <32 selections).
- Dry run 3 (21:23): 842 rows, 100 markets, 19 pages, gate passed. Raw dump audited: Super Bowl winner / Coach of the Year / Worst Record / Most Wins = 32 each; exact matchup = 256; award markets (MVP 22, Comeback 19, DPOY 26, DROY 18, OPOY 29, OROY 18, 1st pick 7, first coach fired 11) are the site's posted lists, not parse losses.
- Fix after audit: win-total and make-playoffs per-team markets shared bare team names; parser now emits `Win Total: <team>` and `To Make Playoffs: <team>` (842 rows, 131 markets, 0 bad on re-parse of the saved dump).
- Site typos kept as posted: "Green Pay Packers", "Dan Quinn (Wahington)", "Las Vegas Raiders ... AFC South".
- Andy started the LIVE run (`npm run futures:bol`) ~21:40 PT. Its outputs (`data/odds/BEO_futures_MMDD_HHMM.md`, `data/generated/futures/betonline-futures-<date>_<hhmm>.json` + raw) are NOT in this commit; check/commit them next session. The live run may have started before the market-name fix was saved, so confirm win-total market names in its output.
- `cron-bol-scrape.mjs` saves a `.pregate.raw.txt` before the acceptance gate (props).

## Next
1. Inspect the live-run output files; verify `Win Total:` / `To Make Playoffs:` naming and row counts (~842 rows). If names are bare, re-run `parseFuturesDump` on the raw to regenerate.
2. Commit the futures outputs via plumbing (explicit paths only).
3. Wed/Thu: BEO props `npm run bolp -- --week 6` (needs >=500 rows).
4. Fresh BKR W6 lines for all 14 games, then rerun `node scripts/build-w05-quantitative-synthesis.mjs --week 6 --bkr <boards>`.
5. Dossier availability/priors layer (roster gate); optional secondary-matchup seed refresh (`scripts/nfl-rosters/rebuild_matchup_seeds.py`).

## Guardrails (unchanged)
No paid synthesis or Supabase writes without explicit authorization; sportsbooks read-only; roster gate before naming players; no `git add -A`.
