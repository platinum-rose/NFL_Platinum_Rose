# Futures Synthesis Source Readiness - 2026-07-30

Purpose: verify the current intel bundle for a maximum-effort frontier-model futures portfolio synthesis.

This is a source-readiness checklist, not a betting recommendation and not approval to call a paid model. It reads local artifacts only.

## Gate Status

- Latest audit command: `npm.cmd run intel:source-audit`
- Last fully passing written verdict: `PASSABLE`
- Last fully passing counts: Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7 / Inference 1
- Last fully passing generated at: `2026-07-30T07:41:18.119Z`
- Last fully passing JSON: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json`
- Last fully passing HTML: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.html`
- Post-restore written check: `npm.cmd run intel:source-audit`
- Current written verdict: `PASSABLE`
- Current written counts: Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7 / Inference 1
- Current written JSON: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T15-21-51-624Z.json`
- Current written HTML: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T15-21-51-624Z.html`
- Current source-gate state: the fresh approved live RSS training-camp scout has been written into the app-facing files; there are 0 stale, 0 blocked, and 0 missing sources.

## Scope Decision

The current focus is futures portfolio synthesis readiness. The following are out of scope for this gate:

- DraftKings/FanDuel bet-slip parser implementation or verification.
- Weekly live-props source wiring.
- Official-picks approval/proposal persistence.
- Supabase writes or portfolio mutation.

## Source Acceptance Matrix

| Source | Decision | Use in frontier synthesis |
|---|---|---|
| TheOddsAPI futures ingest receipt | Accepted with caveat | Public market context only. One market was available and 14 were unavailable, so betting recommendations still require a primary-book quote or an explicit Vegas-proxy alert. |
| Public/API team futures market coverage | Accepted with caveat | Consensus and market-shape context only. Do not treat public/API gaps as blockers when primary-book exports are current. |
| Manual book export: BetUS | Accepted | Fresh normalized 2026-07-29 primary-book rows, 416 rows. Can be used as current placeable-price evidence after normal portfolio gates. |
| Manual book export: Bookmaker | Accepted | Fresh normalized 2026-07-29 primary-book rows, 128 rows. Can be used as current placeable-price evidence after normal portfolio gates. |
| Manual book export: BetOnline | Accepted | Fresh manually normalized 2026-07-29 primary-book rows, 160 rows. Can be used as current placeable-price evidence for listed markets after normal portfolio gates. |
| Raw current sportsbook export: Bookmaker/BKR | Accepted | Current primary-book market memory from `BKR_Odds_0729`; raw prices remain authoritative until replaced by a newer export. |
| Raw current sportsbook export: BetUS | Accepted | Current primary-book market memory from `BetUS_ALL_0729`; useful for futures prices and fantasy role/volume inference. |
| Raw current sportsbook export: BetOnline | Accepted | Current screenshots are date-identifiable and normalized into `data/futures-imports/betonline-2026-07-29.json`. Use `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md` for playoff No-side values. |
| Latest local portfolio report | Accepted with caveat | Prior context only. It was generated before the current source-acceptance pass and must be rebuilt before any final recommendation packet. |
| Primary M6 diarized store | Accepted with caveat | 54-episode store remains useful context, but the all-export store is the newer podcast source for synthesis. |
| All-export M6 diarized store | Accepted | 57 manifest episodes through the July 23 futures-card episode. Use this as the current podcast transcript base. |
| Generated podcast narratives and deep dives | Accepted with caveat | Regenerated after the expanded ad/legal filter at `2026-07-30T08:48:17.626Z`. Expanded hard promo/legal scan is clean; sportsbook mentions that remain are price/context references rather than ad/legal copy. |
| Research/article RSS ingest | Accepted with caveat | Fresh July 30 review lane with one feed issue. Use as research context, not direct pick authority. |
| Article full-body intel review | Accepted with caveat | 39 articles reviewed, 0 actual pick candidates, 8 market/inference leads, 103 contextual notes. Use leads as context only. |
| Training camp local snapshot | Accepted with caveat | Fresh approved live RSS scout snapshot now lives in `data/training-camp/2026/latest.json` and `data/training-camp/2026/training-camp-intel-2026-07-30.json` with 19 items across 10 teams. Review/highlight before model synthesis. |
| Training camp RSS scout | Accepted with caveat | 19 merged manual+RSS items across 10 teams with one feed issue. Review merged output before model synthesis. |
| Latest season readiness smoke | Accepted with caveat | READY WITH WATCH ITEMS, PASS 11 / WARN 6 / FAIL 0. Watch items are waived for source freshness but still matter for product readiness. |

## Verification Receipts

- `node --check scripts\build-podcast-transcript-deep-dives.js` passed.
- `node --check agents\lib\speaker-attribution.js` passed.
- `npm.cmd run podcast-deep-dives` regenerated 57 transcript deep dives at `2026-07-30T08:48:17.626Z`.
- Hard promo/legal scan over `docs\podcast-transcript-deep-dives` returned no matches for DraftKings promo/legal, Total Wireless, sponsorship copy, sponsored-by copy, gamble-responsibly, or DKNG/legal disclaimers.
- Expanded hard promo/legal scan, including Hard Rock break/promo phrasing, returned no matches; remaining sportsbook mentions are retained only as price/context references.
- `docs/podcast-transcript-deep-dives/index.json` parsed with Count 57 / Episodes 57 / GeneratedAt `2026-07-30T08:48:17.626Z`; referenced Markdown/HTML files all exist.
- All `docs/podcast-transcript-deep-dives/*.json` parsed successfully.
- All `data/podcasts/m6-diarized-all/*.json` parsed successfully.
- `node scripts/ingest-futures-json.js --file data/futures-imports/betus-2026-07-29.json --dry-run` passed with 416 rows and no DB write.
- `node scripts/ingest-futures-json.js --file data/futures-imports/bookmaker-2026-07-29.json --dry-run` passed with 128 rows and no DB write.
- `node scripts/ingest-futures-json.js --file data/futures-imports/betonline-2026-07-29.json --dry-run` passed with 160 rows and no DB write.
- `npm.cmd run intel:source-audit` returned `PASSABLE` with 0 stale, 0 blocked, and 0 missing sources.
- `npm.cmd run futures:betonline-0729` generated `data/futures-imports/betonline-2026-07-29.json` and `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md`.
- `node scripts/build-betonline-0729-import.js --check-only` passed with 160 rows.
- `node scripts/ingest-futures-json.js --file data/futures-imports/betonline-2026-07-29.json --dry-run` passed with 160 rows and no DB write.
- `npm.cmd run intel:source-audit` returned `PASSABLE` after the fresh approved live RSS scout refreshed the app-facing files.
- `.nfl/receipts/training-camp-rss-scout-2026-07-30T15-21-35-524Z.json` records 19 items across 10 teams from `2026-07-30T15:21:34.180Z`; five feeds were available and Football Outsiders returned `fetch failed`.
- `node --check scripts\build-intel-source-audit-report.js` passed after adding the recovered-snapshot action to empty training-camp latest reports.

## Required Caveats Before Frontier Synthesis

- BetOnline July 29 listed markets are normalized, but exact Super Bowl matchup was not present in the BetOnline screenshot bundle.
- The training-camp latest snapshot is refreshed. Treat it as research context that still needs review/highlighting before model synthesis.
- Generated podcast/deep-dive text is accepted only after the July 30 ad/legal-filter regeneration. If new podcast ingestion runs again, regenerate and re-scan before model synthesis.
- The latest portfolio synthesis artifact is useful prior context, but it was generated before this source-acceptance pass. Rebuild the synthesis packet from accepted current sources.
- Season readiness is `READY WITH WATCH ITEMS`, PASS 11 / WARN 6 / FAIL 0. The watch items are not source-freshness blockers, but should be explicitly waived or noted before model execution.

## Next Acceptance Steps

1. Use `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the frontier-model evidence packet.
2. Ask for explicit approval before any paid model/API call or persisted recommendation output.
3. Keep generated recommendations out of official-pick/persistence flows unless separately approved.
