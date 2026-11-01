# Week 8 roster map and DK Predictions refresh

Completed October 28, 2026, at approximately **4:25 PM Pacific**.

## Outcome

The retained October 28 full ESPN roster already contained both players responsible for the five unresolved DK Predictions rows. One was in the active offense group and the other in injured/out. The older October 23 offense-only map omitted them.

Rebuilt `data/nfl-rosters/roster-map-latest.json` from the existing full snapshot, including offensive players in injured/out and practice-squad groups. No network request was needed.

- **1,230 offensive players**, including 384 outside the active offense group.
- Compared with the old map: 392 additions, four names absent from the current full snapshot removed, and one team assignment corrected from the retained current roster.
- Same-name defensive identities were excluded by offensive position before selecting a unique offensive team. No ambiguous offensive identity remained.
- The map records the real full-snapshot capture time, source hash and path, derivation policy, and operator overrides. Its new generation timestamp does not claim a new ESPN retrieval.

Replayed the original saved DK Predictions capture through the existing parser and its actual acceptance gate. **PASS:** 14 games, 698 rows, 242 distinct players, four markets, zero unresolved teams, zero team-not-in-game rows, and zero unresolved dates. No priced row was removed or invented to pass the gate. The parser source was unchanged.

## Normalized output

`data/generated/props/draftkings-predictions-live-2026-10-28-week8.json`

- SHA-256: `006cf91b2d8e7e2c481d9e0f1b29fe6d7d4501e89583685492672067e7eaa7e4`
- Original capture time retained: **2:20:14 PM Pacific**, `2026-10-28T21:20:14.591Z`.
- 84 game-line rows; 242 anytime-TD rows; 188 first-TD rows; 184 two-plus-TD rows.
- Game lines cover all 14 games. Anytime-TD coverage is **13 of 14 games**, exceeding the existing gate's 80% requirement. PHI at WAS has game lines only in this capture; the missing TD market remains missing.
- These are prediction-contract display prices before fees, not verified executable sportsbook odds. No wager or recommendation was created.

## Preservation and checks

Before mutation, copied the original roster map, parser source, and raw capture to `before-*` files in this directory and verified their hashes. Checked the roster-map and full-snapshot hashes again immediately before replacing the map. Retained the raw capture unchanged.

`validation.json` records the actual gate result, source/output hashes, timestamps, and direct parser-versus-roster team checks. No parser code changed, so no code unit suite was needed for this data-only repair; the actual 698-row parser acceptance gate and independent row/market totals were exercised.

No Tuesday or other cadence was run. No Supabase, paid/model, account, ledger, wager, publication, commit, or push action occurred. No shared handoff, task board, lock, BetOnline, or Bookmaker file was modified. A source-evidence mirror lies outside this delegated scope and can be copied by the parent if required.
