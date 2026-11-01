# Week 8 Saturday close — Codex — 2026-10-31 20:25 PT

## Resume

Baseline commit: `95a4629` on `claude/w5-prop-cards-2026-10-11`.

Run the Sunday card as a fresh, proposal-only session. Read `HANDOFF.md`, reconcile live Git, then this handoff and `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`. Do not place wagers, access sportsbook accounts, make paid calls, push, or write Supabase without Andy's current per-action approval.

## Delivered

- Rebuilt and QA'd the Week 8 Saturday Master Intel packet locally. The report's four tier-B recommendations remained: ARI@DAL Under 54.5, BAL@BUF Over 55, IND@JAX Under 46, and NE@MIA Under 43.5. The generated `dist/` packet is an ignored build artifact; rebuild it rather than treating it as a tracked source.
- Reconciled `reports/intel/expert-review-2026-w08.json` against the current YouTube extraction: source hash refreshed and eight exclusions reindexed.
- Added the small evidence-backed Bookmaker-to-ESPN name alias map in `scripts/nfl-rosters/roster_vet.py`. The prior strict Week 8 roster vet passed with only information-only unmatched Bookmaker rows; do not invent mappings for Zonovan Knight, Josh Palmer, or Re'Mahn Davis.
- Committed three official Alejandro-split tickets to the master ledger:
  - BKR `741107137`: $10 6-team Flex SGP, +4275 / $437.50 return.
  - DK Predictions `49780739`: $9.97 3-pick ATD combo with 10% boost, +2328 / $242.10 return.
  - BEO 3-leg 2+ TD parlay: Bijan Robinson / Chase Brown / Rhamondre Stevenson, $10 at +8300 / $840 return; BEO ticket number and acceptance time absent.

## Important operational state

- BKR and DK tickets were synced to Supabase earlier with Andy's explicit authorization. The latest BEO ticket is **ledger-only**: no fresh Supabase sync was requested.
- The live-tracker generator previously hit a Windows lock on `public/live-tracker-sunday.html`. It is not confirmed current for the DK or latest BEO ticket. Close any process holding that file before an explicitly authorized rerun; do not hand-edit tracker HTML.
- The shared checkout remains heavily dirty. Preserve all unrelated ingest, futures, survivor, paper-wager, shadow-harness, tracker, and availability changes. No broad staging, cleanup, reset, or stash.
- Saturday weekly preflight showed fresh side-market input but flagged roster-vet output access (`PermissionError`), usage trends, promoted podcast output, prop boards, and futures inputs as stale. For Sunday-card recommendations, rerun the relevant preflight and stop on required stale evidence; roster gate must pass before naming player candidates.

## Sunday card starting point

- No moneyline RR was placed in this session. The explored four-dog basket was MIN +167, BAL +142, CLE +164, CHI +154. Analysis favored ATL ML +118 as the fifth-leg add, with PHI +232 or ARI +252 as higher-variance alternatives. These were saved-market references, not executable picks.
- Latest 2+ TD discussion: Chase Brown was preferred over Bhayshul Tuten on game script and saved price; both remain lottery/C-tier outcomes. The placed 2+ TD BEO parlay is official and must be treated as existing exposure.

## Verification and commit

- Commit `95a4629` contains only the Week 8 review/roster fixes and the three Alejandro ledger records. The isolated committed ledger has 254 tickets and ends with those three records.
- JSON parse and payout arithmetic passed for the latest BEO ticket: $10 × 84.00 = $840.

