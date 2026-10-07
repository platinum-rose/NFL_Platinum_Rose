# Bookmaker Live Extraction Handoff

Date: 2026-09-21

Purpose: hand off the first live Bookmaker extraction result for independent verification.

## Live Bookmaker Route

```text
https://be.bookmaker.eu/en/sports/football/nfl/game-lines/new-york-giants-vs-los-angeles-rams/
```

The logged-in rendered page exposed the game page sections directly in the DOM, including SGP player ladders and ordinary game/period lines. No odds were clicked and no betslip/account action was taken.

## Extracted Result Artifact

```text
scratch/bookmaker-sgp-live-2026-09-21-nyg-lar.json
```

The generated props folder refused writes in this checkout, so the JSON artifact was saved under `scratch/`.

## Observed Summary

```json
{
  "sections": 57,
  "rows": 530,
  "unknownSections": []
}
```

Observed market row counts:

```json
{
  "atd_1_plus": 27,
  "carries": 44,
  "first_half_lines": 6,
  "first_quarter_lines": 6,
  "first_td": 28,
  "fourth_quarter_lines": 6,
  "game_lines": 6,
  "pass_cmp": 16,
  "pass_td": 8,
  "pass_yds": 34,
  "rec": 97,
  "rec_yds": 136,
  "rush_yds": 50,
  "second_quarter_lines": 6,
  "td_2_plus": 27,
  "td_3_plus": 27,
  "third_quarter_lines": 6
}
```

## Verification Command

```powershell
node -e "const fs=require('fs'); const p='scratch/bookmaker-sgp-live-2026-09-21-nyg-lar.json'; const j=JSON.parse(fs.readFileSync(p,'utf8')); console.log(JSON.stringify({rows:j.rows.length, sections:j.sections.length, markets:j.summary.markets, unknown:j.summary.unknownSections, first:j.rows[0], last:j.rows[j.rows.length-1]}, null, 2));"
```

Observed result:

- 530 rows
- 57 sections
- 0 unknown sections

## Notes For Verifier

- The extraction uses rendered DOM selection labels under Bookmaker SGP components.
- The payload intentionally excludes account header text, PIN/balance text, betslip text, and page chrome.
- 2026-09-21 follow-up: Claude review confirmed row/section accounting and flagged that the original `*_sgp` labels on standard game/period spread-total-moneyline sections were misleading. The saved JSON artifact now uses `game_lines`, `first_half_lines`, `first_quarter_lines`, `second_quarter_lines`, `third_quarter_lines`, and `fourth_quarter_lines` for those ordinary line sections.
- 2026-09-21 follow-up: the artifact schema label was also renamed from `bookmaker_live_sgp_v1` to `bookmaker_live_markets_v1`, because the payload includes both SGP ladders and ordinary game/period lines.
- Market labels are normalized in the artifact, but this was a live extraction pass rather than a committed reusable parser.
- The existing `scripts/props/parse.py` still parses copied BKR board dumps; this live extraction is separate from that legacy copied-board parser.
