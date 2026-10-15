# Week 6 Lane C dry-run diff: dossier + quant synthesis rebuild on refreshed seeds

Run Wed 2026-10-14 ~17:30 PT by Claude Team 2. **Nothing live was overwritten.** No paid calls, no Gemini, no Supabase writes, no network. Dossier builder ran as a patched scratch copy (reads the repo, writes to `~/dryrun/dossiers/`, which is outside the repo); quant synthesis ran with its own `--dry-run`. Lane C rebuild is **not** authorized yet; this report is the input to that decision.

## Bottom line

1. **Quant synthesis: rebuilding changes nothing.** `node scripts/build-w05-quantitative-synthesis.mjs --week 6 --dry-run` matches the committed `data/research-intel/proposed/2026-w06-quantitative-synthesis.json` in all 14 games (market lines, side and total picks with cover %, home win %). It was already rerun on the 10/14 BKR board. No action needed.
2. **Dossier rebuild changes only the secondary-matchup layer.** Of the 82 files the builder writes, 17 are unchanged (ignoring timestamps and hashes) and 65 differ. All 65 differ because the refreshed `data/secondary-matchups/latest.json` is embedded: `sources[6].sha256` changes in every dossier (33 JSON files and their `.md` twins), and 16 team JSONs also get content changes (below).
3. **A rebuild does NOT fix the two gaps the 10/13 handoff called out.** Builder v1.0 hard-codes `availability: not_built_in_this_version` / `roster_gate: not_run` and `priors: not_built_in_this_version` (`scripts/build-team-dossiers.mjs` lines 232-233, 243, 334). The Lane D availability layer (`data/research-intel/availability/2026-w06-availability-layer.*`) is separate and is not wired into the dossiers. Wiring it in, and building priors, needs a builder change (the handoff's "build step 3"), not just a rerun.
4. **The quant synthesis availability gates are stale and now disagree with ESPN.** The script reads `data/player-availability/impact-digest-latest.json` (generated 2026-10-13T06:36Z, roughly 42 hours old). It lists Lamar Jackson and Caleb Williams as `out` (from 10/11 and 10/12 news items) and Jaxson Dart as IR. ESPN's feed at 10/14 13:20 PT has Jackson and Williams Questionable. Refreshing needs `npm run player-availability:live` then `npm run availability:impact-digest` (writes `data/player-availability/`; I have not run them). The picks themselves did not change in the dry run, but any reader of the gate list sees the older status.

## What changes in the dossiers (16 teams, all in `scheme_context.secondary_matchup.entries[]`)

The refreshed seed adds target receivers and nudges confidence up about 0.03 to 0.04. No one is removed. Pairs that share a matchup show identical changes.

| Team (matchup) | Added target | Confidence |
|---|---|---|
| ARI, LAR | Jalen Brooks (ARI slot) | 0.54 to 0.57 |
| CAR, PHI | Brycen Tremayne (CAR) | 0.83 to 0.87 |
| DEN, SEA | Troy Franklin (DEN) | 0.85 to 0.89 |
| HOU, JAX | Marvin Harrison Jr. (HOU) | 0.89 to 0.93 |
| IND, TEN | Laquon Treadwell (IND) | unchanged |
| KC, LAC | Jalen Royals (KC) | 0.64 to 0.68 |
| NYJ, NE (entry 0) | Tim Patrick (NYJ) | 0.85 to 0.89 |
| NYJ, NE (entry 1) | Efton Chism III (NE) | 0.86 to 0.90 |
| PIT, TB | Germie Bernard (PIT) | 0.81 to 0.85 |

Cross-check of all 98 distinct dossier target receivers against ESPN (`espn-status-w06.json`, fetched 10/14 13:20 PT) and the roster file (10/14 01:00 PT):
- **All 9 added players are on the roster of the team the seed gives.** Eight are in the regular `offense` group.
- **Tim Patrick (NYJ) is in ESPN's roster `injuredReserveOrOut` group** and not in the injury feed. This is the unconfirmed-IR situation from the Week 5 gap; do not treat as confirmed Out, but do not use him as a player leg without official inactives.
- **Marvin Harrison Jr.:** the seed now has him on HOU, matching the roster file. The older `roster-map-latest.json` still has him at ARI (gate info-only MISMATCH; stale file).
- **Already-in-dossier targets with a status:** 15 are Questionable/Doubtful in ESPN (Adonai Mitchell Doubtful; CeeDee Lamb, DJ Moore, Darius Slayton, DeVonta Smith, Jaxon Smith-Njigba, KC Concepcion, Keenan Allen, Kenyon Sadiq, Ladd McConkey, Quentin Johnston, Rashee Rice, Skyy Moore, Stefon Diggs Questionable). Tank Dell (HOU) is in the roster IR/Out group (unconfirmed). Dossiers carry none of this, by design ("do NOT name players from this file").
- Chris Godwin (TB) and Kyle Pitts (ATL) did not match by exact name; ESPN lists them as "Chris Godwin Jr." and "Kyle Pitts Sr." (both active). Name-suffix mismatch, not a problem.

## Orphans in the live dossier folder (not caused by a rebuild)

`data/generated/team-dossiers/2026-w06/matchups/LAR@ARI.json` and `LV@BUF.json` exist in the live folder but the builder does not produce them; the builder writes `ARI@LAR.json` and `BUF@LV.json` (the real orientation, as on the BKR board). The live folder holds both. These look like leftovers from an earlier build with home/away reversed. A rebuild would not remove them, and files cannot be deleted on this mount, so any consumer globbing `matchups/*.json` could read a wrong-orientation duplicate. Also, `postmortem/` (66 files) exists only in the live folder; it is built by a different script (`npm run dossiers:postmortem`) and a rebuild would leave it alone. I did not compare postmortems with the refreshed seeds.

## Other warnings from the quant dry run

- `no SuperContest lines file for week 6: contest field is null` (needs `data/supercontest/week-06-lines.json`, a native-Windows item for Andy).
- `no master-intel pull for week 6: podcast accounting omitted` (the podcast ingest on this branch is not reflected in the synthesis; Andy's other session owns that).

## Options for Andy

A. **Do nothing to the quant synthesis.** Already current.
B. **Rebuild dossiers now** (`node scripts/build-team-dossiers.mjs --week=6`, then `node scripts/validate-team-dossiers.mjs --tag=2026-w06`). Gains the 16 secondary-matchup additions only. Writes to the live folder and `latest.json`. Free and local.
C. **Refresh the availability digest first** (`player-availability:live`, then `availability:impact-digest`), then rerun the quant synthesis for fresh gates. Needs network and writes `data/player-availability/`. Free, but not run yet.
D. **Extend the builder with step 3** (availability from the Lane D layer, roster gate result, priors). Code change; `build-team-dossiers.mjs` and `validate-team-dossiers.mjs` would both need updating. Not started.

## Reproduce

```
cd $HOME/mnt/dev/projects/NFL_Dashboard
node scripts/build-w05-quantitative-synthesis.mjs --week 6 --dry-run
# dossier dry run: copy scripts/build-team-dossiers.mjs, set ROOT to the repo path, the teams.js import to an absolute path,
# and OUT_BASE to a scratch folder, then: node <copy> --week=6
```
