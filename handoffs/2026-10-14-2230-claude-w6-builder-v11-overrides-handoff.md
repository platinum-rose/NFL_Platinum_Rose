# Handoff — W6 Wednesday session: Lanes D/E/C, permanent overrides, dossier builder v1.1

Written Wed 2026-10-14 22:30 PT by Claude (Team 2 session). Branch `claude/w5-prop-cards-2026-10-11`, HEAD `88d20c0`, **pushed** to origin (50c5396..88d20c0). Predecessor: `handoffs/2026-10-14-1100-claude-h2c2-team2-week6-wednesday-briefing.md` (still the lane map; read one lane only).

## 1. State in one screen
- Lane A (podcast picks): NOT touched here. Andy's other session owns it (podcast credit-bleed work); its commits `e54789b`, `d8febac`, `d349f03` are in the history.
- Lane D done (`7d07879`): ESPN status snapshot, per-game availability layer (14 games), roster gate PASS.
- Lane E done (`6475ba3`): read-only ledger hygiene report `reports/intel/2026-w06-ledger-hygiene-wed-1014.md`. No ledger edits.
- Lane C dry run done (`178a59c`): `reports/intel/2026-w06-lane-c-dry-run-diff.md`. Quant synthesis needed no rebuild (0/14 diffs).
- Latest commit `88d20c0`: operator overrides, builder v1.1, refreshed availability digest, rebuilt dossiers.
- **Quant synthesis has NOT been run.** Andy's order: rebuild dossiers, refresh digest, extend builder, then run quant synthesis. The first three are done; the run itself awaits his go. It is free but its numbers are provisional and unbacktested, not recommendations.

## 2. Permanent facts (Andy-reported, 2026-10-14)
- Marvin Harrison Jr.: traded ARI -> HOU (effective 10/13).
- Troy Franklin (DEN WR): Injured Reserve, extended, no return date.
- Stored in `data/nfl-rosters/operator-status-overrides.json` (schema `operator_status_overrides_v1`), applied by `scripts/nfl-rosters/operator_overrides.py` inside `fetch_espn_rosters.py` on every fetch (test: `scripts/nfl-rosters/test_operator_overrides.py`). `roster-map-latest.json` Harrison team was edited by hand to HOU.
- To add or retire an override: edit the JSON, then re-run the pipeline below. Remove an entry once ESPN reflects it.

## 3. Dossier builder v1.1
- `scripts/build-team-dossiers.mjs` (v1.1) writes `data/generated/team-dossiers/2026-w06/` (32 teams, 14 matchups, league table, crosswalk, index, `latest.json`). Validator: `scripts/validate-team-dossiers.mjs` (0 errors, 0 warnings at commit). Spec: `reports/analysis/week6-intel/team-dossier-schema-v1.md` (section 8 = v1.1 notes).
- Availability section: ESPN status, live events (10 days), impact digest, projected starters, OL/DL cluster risk, operator-reported items. Priors: 2025 final (`prior_season`), camp notes and trench ratings (`preseason_prior`). Names appear only in the Availability section and only after the roster gate.
- Operator-IR or reported-Out players move from `target_receivers` to `excluded_unavailable`. Camp notes naming a player no longer on the team go to `withheld_roster_changed`.
- Re-run order after any roster or status change (all free, no Supabase):
  1. `python3 scripts/intel/fetch-espn-status.py --out data/research-intel/source-evidence/espn-status-w06.json`
  2. `python3 scripts/nfl-rosters/roster_vet.py --week 6 --date 2026-10-18 --strict`
  3. `python3 scripts/intel/build-w06-availability-layer.py`
  4. `node scripts/build-player-availability.js --live-injuries` then `node scripts/build-availability-impact-digest.js`
  5. `node scripts/build-team-dossiers.mjs` then `node scripts/validate-team-dossiers.mjs`
- Roster snapshot refresh (`fetch_espn_rosters.py`) is what applies overrides; the current snapshot (10/14 08:00Z) already has them.

## 4. Next steps
1. When Andy says go: `node scripts/build-w05-quantitative-synthesis.mjs --week 6 --dry-run` first, review, then the real run. Expected warnings: "no SuperContest lines", "no master-intel pull for week 6". Re-run the pipeline in section 3 first if more than a few hours have passed or Andy reports new injuries.
2. Pending small item: `build-w06-availability-layer.py` still lists Franklin among "unconfirmed roster IR/Out"; split operator-reported IR from unconfirmed entries.
3. Needs Andy: Week 6 starting QBs for `data/research-intel/operator-confirmed-starters-2026-w06.json` (none exists, so QB status is ESPN-only; Mayfield doubtful, Lamar Jackson and Caleb Williams questionable); DEN WR3 replacement for Franklin (no seed row added); Lane E questions (ticket 994540980 duplicate, Bears exacta book, Week 3/5 credits, reloads).
4. Other lanes from the 11:00 briefing remain open: Antigravity podcast extraction validation, BEO props re-run (Andy, >=500 rows).

## 5. Guardrails (binding)
No paid synthesis, no Supabase writes, no wagers or account actions without Andy's explicit per-action OK. Sportsbooks read-only. Never `git add -A`; never `git status` casually; never reset/clean/stash/pull. Proposed != placed. Roster gate before naming any player in a card or narrative. Andy's explicit instruction this session: commit locally and (on 10/14 22:15) "stage, commit and push from here" was authorized for this push only.
Git on this mount: temp-index commit (`GIT_INDEX_FILE`, `git read-tree HEAD`, `git add -- <paths>`, `write-tree`, `commit-tree -p HEAD`, `update-ref HEAD <new> <old>`), then `mv .git/HEAD.lock .git/stale-head-lock-<ts>`. Add only your own paths: my last commit swept in earlier daily availability snapshots and `.bak-*` files because I added whole directories.

## 6. Cleanup for Andy (Windows)
Delete `.git/stale-head-lock-*` files, `.git/objects/*/tmp_obj_*`, and `*.bak-*` files under `data/` (some are now committed; remove with a normal commit if wanted).

## 7. Resume prompt
Read `HANDOFF.md`, then this file. Verify `git rev-parse --short HEAD` (expect `88d20c0` or later) and branch `claude/w5-prop-cards-2026-10-11` with a 20 s timeout. Do not run `git status`. Ask Andy for Week 6 QBs and the go for the quant synthesis; run the section 3 pipeline first if data may be stale; run the synthesis as `--dry-run` before the real run; commit only your own paths via the temp-index procedure; Andy pushes unless he says otherwise.
