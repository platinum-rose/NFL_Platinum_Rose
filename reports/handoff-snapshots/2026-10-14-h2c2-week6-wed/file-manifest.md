# File manifest

| Path | Git state at handoff | Purpose |
|---|---|---|
| `data/shadow-harness/antigravity-staging/*.json`, `_SUMMARY.md` | untracked (live); copied under `copies/` | Antigravity transcript extractions, 3 of 6 episodes, unvalidated |
| `data/podcasts/youtube-discovery-candidates-2026.json` | tracked, **modified** (105 episodes vs 101 at dbf8225) | 4 new candidates from the 10/14 re-run of the sweep; not committed |
| `data/shadow-harness/reports/saved-futures-gemini-batch-report-latest.json` | untracked/modified | records the 5 failed Gemini calls (402), cost $0 |
| `data/odds/BKR_current_lines_1014_0020` (+ `_buildfmt`, `.provenance.md`) | tracked (23d9810) | W6 full-slate BKR board |
| `data/generated/props/betonline-w6-baseline-2026-10-13_2315PT.pregate.raw.txt` | tracked (9cff701) | BEO props baseline (SEA@DEN only) |
| `data/odds/BEO_futures_1013_2144.md`, `data/generated/futures/betonline-futures-2026-10-13_2144.json` | tracked (999b55a) | BEO futures |
| `data/sportsbooks/promotions-2026.json` | tracked (506bcf8) | BEO free-slots balance $15.86 |
| `data/research-intel/proposed/2026-w06-quantitative-synthesis.json`, `reports/intel/2026-w06-quantitative-synthesis.md` | tracked (23d9810) | provisional model output |
| `data/secondary-matchups/manual/{secondary,receiver}-roles-2026.json`, `data/nfl-rosters/espn-full-rosters-latest.json` | tracked (7b7cc9a) | refreshed seeds/rosters |
| `*.bak-claude-*` next to the seed, promo and roster files | untracked | backups from my edits; do not commit |
