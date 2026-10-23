# Week 5 Astra synthesis QA — PREFLIGHT BLOCKED

## Final verification update — calibration hash drift

At 2026-10-10T22:04:42.602Z, the calibration JSON SHA-256 is 0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33, which differs from the user's required 32d278dc6f20c52ac754549951f782b6b33295d6014b3318de519188c87062f8. The prompt also changed during the run (current SHA-256 4b5941bfb93c9d03adff7c1eb5d4625170e90bd76becb3f317a8dad74bb3b76c) to reference the new hash and describe the 2026 lines as preseason placeholders. Neither file was modified by this run. The CSV SHA-256 and HEAD remain as requested.

The original metadata contradiction below documents the inputs as initially read; the current prompt has corrected that wording. The decisive final blocker is now **calibration hash drift against the user's explicit pin**. The replacement pin in a concurrently changed file is not accepted as a user instruction. No simulation or analysis was started. The initial integrity table below is a point-in-time record and no longer describes the current calibration/prompt hashes.

Calibration source-description contradiction: the pinned JSON says 2026 rows have "no scores, no lines", but the pinned CSV contains 77 of 272 season-2026 rows with a spread and 76 with a total (77 with either). All 272 lack scores and results. This is NOT hash drift. The result-free portion of the schedule-only requirement passes; the explicit no-lines claim does not.

This is a stop report, not a passing synthesis QA or a completed citation-validation report.

## Machine-readable validation results

```json
{
  "status": "blocked_before_analysis",
  "checked_at": "2026-10-10T22:03:48.499Z",
  "head": "5dfda50aa7797f6e7628cfce0af0124c5411af14",
  "csv": {
    "total": 7548,
    "regular_with_lines_and_result": 6967,
    "max_season_with_result": 2025,
    "season_2026": {
      "rows": 272,
      "spread_populated": 77,
      "total_populated": 76,
      "either_line_populated": 77,
      "result_populated": 0,
      "either_score_populated": 0
    }
  },
  "blocking_findings": [
    {
      "code": "calibration_hash_drift",
      "expected": "32d278dc6f20c52ac754549951f782b6b33295d6014b3318de519188c87062f8",
      "actual": "0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33"
    },
    {
      "code": "concurrent_prompt_change",
      "note": "New on-disk pin not accepted over explicit user pin"
    }
  ],
  "simulation_runs": 0,
  "full_synthesis_complete": false,
  "market_inventory": [
    {
      "book": "bookmaker",
      "path": "data/generated/props/bookmaker-live-2026-10-10-week5.json",
      "capturedAt": "2026-10-10T16:16:12.396Z",
      "pt": "10/10/2026, 9:16:12 AM PDT",
      "age_hours": 5.793,
      "games": 14,
      "rows": 5376
    },
    {
      "book": "betonline",
      "path": "data/generated/props/betonline-live-2026-10-10-week5.json",
      "capturedAt": "2026-10-10T21:15:15.131Z",
      "pt": "10/10/2026, 2:15:15 PM PDT",
      "age_hours": 0.809,
      "games": 14,
      "rows": 1146
    }
  ],
  "not_run": [
    "roster_vet",
    "full_citation_validator",
    "complete_current_game_status",
    "simulation",
    "analysis",
    "recommendation_rankings"
  ],
  "final_checked_at": "2026-10-10T22:04:42.602Z",
  "hash_checks_at_start": {
    "calibration": true,
    "historical_csv": true,
    "embedded_source_hash": true
  },
  "final_hash_checks": {
    "calibration": false,
    "historical_csv": true
  },
  "final_calibration_hash": "0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33",
  "user_pinned_calibration_hash": "32d278dc6f20c52ac754549951f782b6b33295d6014b3318de519188c87062f8",
  "final_prompt_hash": "4b5941bfb93c9d03adff7c1eb5d4625170e90bd76becb3f317a8dad74bb3b76c"
}
```

## Reproduction

Checks executed with Get-FileHash -Algorithm SHA256, git rev-parse HEAD, git log/status, git check-ignore, JSON parsing, and PowerShell Import-Csv. CSV counts use nonempty spread_line, total_line, result, home_score and away_score fields; the 6,967-row count additionally requires game_type=REG. No historical artifact was regenerated.

Example contradicted row: game_id=2026_01_NE_SEA, season=2026, game_type=REG, spread_line=3.5, total_line=44.5; home_score, away_score and result are blank. This is a source-schema example, not a current market offer or betting recommendation.

## Completion and mutation boundary

Only the evidence manifest and this QA stop report were written by this run. Full synthesis, synthesis JSON, decision-support report and simulation outputs were not created. No prompt, source evidence, historical calibration, digest, ticket, account, pool, ledger, portfolio, official pick or Supabase state was modified by this run. No pull.mjs, sportsbook capture runner or paid API was called. Existing dirty work was preserved.

Before resuming, resolve the contradicted source description or explicitly revise the validation expectation; do not silently regenerate or re-pin. Re-run freshness and current-game-status gates. Even though hashes match, the requested content-validation gate has not passed.
