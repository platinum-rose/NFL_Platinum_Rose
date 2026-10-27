# H2C2 cross-team briefing: Week 8 readiness, Week 7 closeout, and BEO futures

- **Written:** Tue 2026-10-27, 3:49 PM PT, for Claude Team 2.
- **Purpose:** Continue the NFL_Dashboard project after the approved project-work-only Git closeout. This briefing is a routing layer; pick one work lane and load only its sources.
- **Git before closeout:** branch `claude/w5-prop-cards-2026-10-11`, HEAD `929be0255dae58d0a18ac3f7084617be52803345`; upstream was the same commit. Recheck current Git after pickup. The closeout commit includes the project files and this packet.
- **Data boundary:** Yahoo fantasy authorization material, personal sportsbook transaction history / statement, scratch downloads, backups, and `.nfl` private or temporary handoff files are intentionally excluded. Do not copy secrets or account-session material into this packet.

## 1. Current state

### Week 7 closeout

Week 7 ticket results and the Platinum AI imaginary-ticket accuracy record have been written under `reports/analysis/week7-postmortem/`. Start with `w07-closeout-2026-10-27.md`, `platinum-rose-w7-paper-accuracy-2026-10-27.md`, and `platinum-rose-w7-paper-leg-grades-2026-10-27.csv`. Week 7 is settled; preserve real wagers, paper recommendations, and proposal grading as separate records.

The user also reported that Live Tracker had labeled some Over legs Hit despite final results being Under in GB @ DET. The current changed implementation is `scripts/generate-live-tracker.mjs`; review the exact settlement logic and generated output before claiming the defect is fixed. Do not alter official ledgers or publish tracker artifacts without a separate explicit instruction.

### Week 8 readiness

The Tuesday cadence ran on 10/27 at approximately 07:18 PT. Do not rerun Tuesday; next scheduled cadence is Wednesday. TNF is CAR @ GB, Thu 10/29. Week 8 source snapshots and current artifacts are in the file manifest; key ones include `public/schedule.json`, `data/projected-starters/2026/latest.json`, the 10/27 projected-starter snapshot, and the Week 7 usage-history snapshot. The Tuesday run marked Tampa Bay depth as estimated and noted Week 8 opening odds for ARI @ DAL and PHI @ WAS fell back to ESPN lines. Verify freshness before using either as live market prices.

### BEO futures follow-up

The latest user-provided BetOnline futures capture is timestamped 10/27 14:56 PT. The raw rendered source has 673 rows; the normalized/import records contain 324 rows across 126 markets / 19 pages (per the capture notes). Inspect `data/odds/BEO_futures_1027_1456.md`, `data/generated/futures/betonline-futures-2026-10-27_1456.json`, its `.raw.txt` source, and `data/futures-imports/betonline-2026-10-27.json` alongside the saved portfolio selection source. The prior conversation compared line movement, merged duplicate wagers into combined odds, and checked promo availability. Recompute from those files if needed; do not infer placed wagers or live executable availability from a saved capture.

## 2. Lane map

| Lane | Start with | Guardrail |
|---|---|---|
| Week 8 weekly prep | `HANDOFF.md`, then `public/schedule.json`, `data/projected-starters/2026/latest.json`, and current Week 8 sources | Tuesday cadence already ran; the next cadence is Wednesday. Check current source timestamps and mandatory roster gate. |
| Week 7 closeout / grading | `reports/analysis/week7-postmortem/w07-closeout-2026-10-27.md` and the paper accuracy report | Keep actual ticket results separate from imagined proposal accuracy. No duplicate grading. |
| Live Tracker O/U correctness | `scripts/generate-live-tracker.mjs`, `docs/tracked-wagers/reconciliation-latest.md`, `public/live-tracker-sunday.html` | Verify Over and Under settlement against final stats, especially GB @ DET. Do not claim resolution without output verification. |
| Futures movement / grouping | `data/odds/BEO_futures_1027_1456.md` and normalized capture JSONs | Analysis only. No sportsbook account action or portfolio ledger update is authorized by this handoff. |
| Yahoo fantasy research | Ask Andy to configure an authorized read-only connection in the receiving environment | The Yahoo access briefing was excluded from Git. Never request, expose, or copy credentials. Do not fill missing API fields with guesses. |

## 3. Closeout selection and review limits

The user clarified **“Project work only.”** The closeout stages the repository's project changes and relevant untracked artifacts, while excluding the Yahoo API access briefing, account statement / transaction history, scratch downloads and media, backups, and `.nfl` private/test/temporary buffers. Dated large prediction-market snapshots were also excluded; the current tracked `team-market-map-latest.json` remains part of the project change.

The repository hook `.claude/hooks/check-secrets.js` is malformed in the working tree (`const {{ execSync }}` and doubled braces produce a Node syntax error). A fallback content scan of the approved candidate set found only the excluded Yahoo briefing. The Yahoo briefing must not be added to this commit. `git diff --check` passes after trimming trailing whitespace from the generated Week 8 reconciliation report. No tests were run during closeout.

## 4. Resume steps

1. Read `reports/handoff-snapshots/2026-10-27-h2c2-week8-futures-claude2/H2C2_START_HERE.md` and reconcile live Git.
2. Select the requested lane above; do not read all lane artifacts by default.
3. For Week 8, confirm Wednesday cadence state and source freshness before research. Follow repo gates and distinguish qualitative judgments from modeled outputs.
4. For the O/U defect, verify the GB @ DET legs through the exact scoring branch and generated tracker.
5. For futures, compare the saved current capture with saved portfolio data, label capture time, and report uncertainty. Do not mutate wagers, account state, portfolio records, or Supabase.

## 5. Snapshot references

- `reports/handoff-snapshots/2026-10-27-h2c2-week8-futures-claude2/README.md`
- `reports/handoff-snapshots/2026-10-27-h2c2-week8-futures-claude2/file-manifest.md`
- `reports/handoff-snapshots/2026-10-27-h2c2-week8-futures-claude2/H2C2_START_HERE.md`

The snapshot contains routing and manifest documents only. Project sources remain at their original repository paths; no secret, account, or private session files were copied.
