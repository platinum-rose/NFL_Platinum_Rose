# Week 5 Astra evidence manifest — preflight stopped

Checked Saturday, October 10, 2026 at 3:40:08 PM PDT (2026-10-10T22:40:08.973Z). This is a validation-only inventory, not a completed synthesis or a claim that all sources are eligible. No model reading, simulation, rankings, or player-prop analysis followed the citation stop.

## Live state and pins

Existing checkout only: `E:\dev\projects\NFL_Dashboard`, branch `main`, HEAD `7ef79fff37c4cab99fd3b23699452dc1fafcfcdc`. Calibration SHA-256 `0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33`; historical CSV SHA-256 `51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51`. All pass, including embedded CSV hash.

Initial dirty state: 284 modified, 9 deleted, 617 untracked entries. Pre-existing synthesis/FTN scripts are untracked; reproducibility cannot be described as clean. An fsmonitor IPC warning occurred; status was re-read with `git -c core.fsmonitor=false status --porcelain` without changing Git configuration. The newest dated handoff present is the October 10 card-prep handoff, last modified 16:30:30Z, before the pinned 20:44:35Z pull. It does not document the current pinned corpus. No newer handoff was found; reproducibility gap retained.

## Acceptance gates

| Source / check | Evidence | Disposition |
|---|---|---|
| Calibration CSV | 7,548 total; 6,967 REG complete market/result rows; max result season 2025; 272 rows in 2026 with no scores/results | PASS; 2026 placeholder lines excluded |
| Calibration artifact | Four eras; default 2018–2025, 2,127 games, margin SD 12.772, total SD 13.128 | PASS; market-only, not a blend backtest; simulation not run |
| BKR normalized + raw mirror | 14 games, 5,836 rows, captured 2026-10-10T22:25:28.425Z (3:25:28 PM PT) | Fresh at preflight; no offer execution or full price validation |
| BEO normalized + raw mirror | 14 games, 1,146 rows, captured 2026-10-10T21:15:15.131Z (2:15:15 PM PT) | Fresh at preflight; no offer execution or full price validation |
| FTN | 36 tables / 4,613 rows / 32 mapped teams; Week 5; capture completed 2026-10-09T21:53:39.961Z | Counts PASS; separately labeled quantitative input, not expert tier |
| Player CSV | 4,449 season-2026 rows; latest week 4; file mtime 2026-10-06T18:44:56Z | Expected baseline PASS; no player projections issued |
| Pull | 421 signals / 840 notes / 205 expert rows; window 2026-10-05T04:00:00.000Z; pulled 2026-10-10T20:44:35.275Z | Counts PASS; not independently recommendation eligible |
| Verifier | Generated 2026-10-10T20:44:36+00:00; 460 verified / 132 reject / 41 not_pick | FAIL citation prerequisites: 460 missing source IDs, 319 missing URLs, 22 empty quotes |
| Named ignored files | w05-expert-verified.json and w05-article-gemini-picks.json exist and git check-ignore confirms ignored | PASS existence only |
| ESPN current status | Read 2026-10-10T22:36:43.319Z; 14 scheduled, TB@DAL final | TB@DAL excluded; no additional started game |
| Strict roster vet | PASS, zero blocking issues; snapshot 2026-10-10T02:16Z; 2,562 players, 20.3h old | Info-only unresolved names are not player-leg approval |

For BKR/BEO, the six-hour age limit applied: the first remaining kickoff was more than six hours away. Captures were approximately 11 and 81 minutes old at the ESPN check. These are timestamped captures, not live executable offers.

## Stop reason and remaining scope

The user explicitly required stopping on an unverifiable citation. The verifier status alone fails the prompt's necessary ID/URL/time/verbatim-quote contract. The validation report identifies every failing array location without fabricating upstream IDs. `scripts/master-intel/verify_expert_rows.py` lines 109–117 copy expert rationale into `quote`; lines 137–140 copy podcast rationale into `quote` and set URL to null. This does not prove any claim false; it means the stored field cannot establish a verbatim source quotation. Whether missing provenance is recoverable from other raw artifacts was not determined after the stop.

No sources were promoted to recommendation tiers. Raw-source quote matching, complete game/price/identity validation, coverage matrix, simulation, per-game narratives, pools, open-exposure analysis, diagnostic dossiers, and ranking reconciliation remain unperformed. Optional DKP structural eligibility was not established. The retired DVOA artifact was not read. Weather/availability files were inventoried but not cleared for recommendations.

ESPN source: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=5 . The initial date-range request returned HTTP 400; the weekly endpoint and Sunday endpoint both succeeded. The local schedule still labels TB@DAL pre; current ESPN superseded that stale status.

## Pinned pull exclusions

```json
[
  {
    "event_ref": "https://x.com/salbets_/status/2107093711704179099",
    "reason": "Week 4 MNF slate (posted Mon 2026-10-05 for 'tonight's game'); not a Week 5 pick"
  },
  {
    "expert": "Action Network",
    "selection": "Isaiah Likely Anytime TD",
    "visitor": "Baltimore Ravens",
    "home": "Atlanta Falcons",
    "reason": "Wrong game: Likely is on the Giants (NYG@WAS), not BAL@ATL. The correct NYG@WAS rows are kept."
  },
  {
    "expert": "BettingPros",
    "selection": "Daniel Jones UNDER pass attempts",
    "visitor": "New York Giants",
    "home": "Washington Commanders",
    "reason": "Wrong game: Jones is on the Colts (IND@PIT). The IND@PIT row is kept."
  },
  {
    "expert": "BettingPros",
    "selection": "Jayden Daniels OVER rush attempts",
    "visitor": "Tampa Bay Buccaneers",
    "home": "Dallas Cowboys",
    "reason": "Wrong game: TB@DAL was already played, and Daniels is on the Commanders (NYG@WAS). The NYG@WAS row is kept."
  }
]
```

TB@DAL is additionally excluded prospectively by current ESPN final status. No game was analyzed.

## Input SHA-256 inventory

File mtimes are filesystem metadata, not capture times. Null declared timestamps mean no top-level timestamp was established by this limited inventory; nested timestamps were not automatically assumed. Directory existence is not a complete manifest of its contents. All below are inventoried, not automatically eligible.

```json
[
  {
    "path": "prompts/2026-w05-astra-full-synthesis.md",
    "exists": true,
    "sha256": "4b5941bfb93c9d03adff7c1eb5d4625170e90bd76becb3f317a8dad74bb3b76c",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T22:04:03.031Z"
  },
  {
    "path": "HANDOFF.md",
    "exists": true,
    "sha256": "d5daf2867ab649c472973ac5e55ca0297cfac5d8d477715f5b1322d8b826847f",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T16:30:30.895Z"
  },
  {
    "path": "handoffs/2026-10-10-codex-week5-card-prep-and-prop-capture-handoff.md",
    "exists": true,
    "sha256": "fcea86f7d878ef17d2726a452de4ff9b29e7e918e037efe14915bb36247f7e37",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T16:30:30.414Z"
  },
  {
    "path": "data/research-intel/proposed/2026-w05-historical-market-calibration.json",
    "exists": true,
    "sha256": "0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33",
    "declared_timestamp": "2026-10-10T22:03:55.965010+00:00",
    "file_mtime": "2026-10-10T22:03:56.008Z"
  },
  {
    "path": "data/vault-seed/nflverse/games-full-1999-2026.csv",
    "exists": true,
    "sha256": "51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51",
    "declared_timestamp": null,
    "file_mtime": "2026-06-05T22:02:33.667Z"
  },
  {
    "path": "data/generated/props/bookmaker-live-2026-10-10-week5.json",
    "exists": true,
    "sha256": "e8ec4fe5b40bc678d82cf124bb86ee109bf4934e7820059cf9f3402c99159e45",
    "declared_timestamp": "2026-10-10T22:25:28.425Z",
    "file_mtime": "2026-10-10T22:27:43.454Z"
  },
  {
    "path": "data/generated/props/bookmaker-live-2026-10-10-week5.raw.txt",
    "exists": true,
    "sha256": "9ba6bd7785fc81d219396a35fd577bcdfad33fd0ae1d1c248fd28631b061f533",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T22:27:43.264Z"
  },
  {
    "path": "data/research-intel/source-evidence/2026-10-10-bkr-sgp-live-week5.raw.txt",
    "exists": true,
    "sha256": "9ba6bd7785fc81d219396a35fd577bcdfad33fd0ae1d1c248fd28631b061f533",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T22:27:43.265Z"
  },
  {
    "path": "data/generated/props/betonline-live-2026-10-10-week5.json",
    "exists": true,
    "sha256": "227cde7166332d3c804219162d6aeefefa09b5264759d4330131ed5430a16925",
    "declared_timestamp": "2026-10-10T21:15:15.131Z",
    "file_mtime": "2026-10-10T21:16:01.149Z"
  },
  {
    "path": "data/generated/props/betonline-live-2026-10-10-week5.raw.txt",
    "exists": true,
    "sha256": "d2854b3071c789a93d4b35b9fb486fcb22a40ee84db4a188fc0359a9f2025139",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T21:16:01.124Z"
  },
  {
    "path": "data/research-intel/source-evidence/2026-10-10-bol-live-week5.raw.txt",
    "exists": true,
    "sha256": "d2854b3071c789a93d4b35b9fb486fcb22a40ee84db4a188fc0359a9f2025139",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T21:16:01.124Z"
  },
  {
    "path": "data/generated/props/draftkings-predictions-live-2026-10-10-week5.json",
    "exists": true,
    "sha256": "6330f705bb6d01edcb906a840761737ff76242ebf322ab434714856c4af672dc",
    "declared_timestamp": "2026-10-10T16:23:47.127Z",
    "file_mtime": "2026-10-10T16:23:47.171Z"
  },
  {
    "path": "data/generated/master-intel/w05-pull.json",
    "exists": true,
    "sha256": "c5628b4aa5602990ac046f3d11874743671592483c6372f8e0c987c5868eb9de",
    "declared_timestamp": "2026-10-10T20:44:35.275Z",
    "file_mtime": "2026-10-10T20:44:35.472Z"
  },
  {
    "path": "data/generated/master-intel/w05-expert-verified.json",
    "exists": true,
    "sha256": "5fe1d48a2513f5ac0a6f9198078638c5233ea74bfad7c58d40fbd92511dcd1f5",
    "declared_timestamp": "2026-10-10T20:44:36+00:00",
    "file_mtime": "2026-10-10T20:44:36.167Z"
  },
  {
    "path": "data/generated/master-intel/w05-article-gemini-picks.json",
    "exists": true,
    "sha256": "1f6283afce94ed5f88cada1921697f233aa3edcd7610209af181fb49b2caf239",
    "declared_timestamp": "2026-10-10T20:38:33.844Z",
    "file_mtime": "2026-10-10T20:38:33.847Z"
  },
  {
    "path": "data/supercontest/week-05-2026-verified-lines.json",
    "exists": true,
    "sha256": "836b11a4d6f3b4e43d4629e89ee8ef688155c833f22e5740b5d7198b8dfd2544",
    "declared_timestamp": null,
    "file_mtime": "2026-10-09T22:38:20.893Z"
  },
  {
    "path": "data/odds/actionnetwork-openers-2026-w05.json",
    "exists": true,
    "sha256": "ba977a355909b9826e966cf2e2271233c5636605289a58674f6422b126aba446",
    "declared_timestamp": null,
    "file_mtime": "2026-10-08T03:36:16.454Z"
  },
  {
    "path": "data/generated/odds/actionnetwork-history-2026-w05",
    "exists": true,
    "scope": "directory existence only; contents not audited after stop"
  },
  {
    "path": "data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json",
    "exists": true,
    "sha256": "c030473bd752a162edfe9dd844ed0dfd5dbc3f3ce0b4b9126891dad8a1801fc3",
    "declared_timestamp": "2026-10-09T22:15:31.022Z",
    "file_mtime": "2026-10-09T22:15:31.103Z"
  },
  {
    "path": "data/generated/team-profiles/team-power-ratings-2026.json",
    "exists": true,
    "sha256": "e23a6e48f0bd60f2969a7095c6752460e8087347e04ebe80c100fef9eabb4f25",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T07:06:04.906Z"
  },
  {
    "path": "data/generated/team-profiles/team-coaching-tendency-snapshots-2026-w2.json",
    "exists": true,
    "sha256": "fdfa2f6309defc421756220a7126eeecd6e5c5a2e97358d24c7bbfa197dcac58",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T02:01:26.549Z"
  },
  {
    "path": "data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json",
    "exists": true,
    "sha256": "1f19496c3b8a01880e816942aa802e395d1063f45beab66f3c2b097618735aed",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T17:31:50.422Z"
  },
  {
    "path": "data/player-availability/impact-digest-latest.json",
    "exists": true,
    "sha256": "98c16306da7a27f489c243ac08ac09c8162eaee6a6e0134375e48484d560b716",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T16:45:23.953Z"
  },
  {
    "path": "data/player-availability/latest.json",
    "exists": true,
    "sha256": "92ab7e25de80436a8f2082407f7cb3466edc94103790b02b6e73016f604b4cb4",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T16:45:22.981Z"
  },
  {
    "path": "data/projected-starters/2026/latest.json",
    "exists": true,
    "sha256": "bc01261c74cab070914a3e5e164103d585cc9e379a7dfb2429a839330b3e495c",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T16:45:21.101Z"
  },
  {
    "path": "data/nfl-rosters/roster-map-latest.json",
    "exists": true,
    "sha256": "a8aa789bce1a299e1770ce4fbc7cfdb0b87748fffa44a0b0b89819f154dcf6b2",
    "declared_timestamp": "2026-10-10T19:52:27.977Z",
    "file_mtime": "2026-10-10T19:52:28.015Z"
  },
  {
    "path": "data/nfl-rosters/espn-full-rosters-latest.json",
    "exists": true,
    "sha256": "469ca6ccd10ba312233f290c5331751338a8f8ef4b69af320af72fb144d77f3f",
    "declared_timestamp": "2026-10-10T02:16:47.619206+00:00",
    "file_mtime": "2026-10-10T02:16:47.645Z"
  },
  {
    "path": "data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json",
    "exists": true,
    "sha256": "c9cfd68220052e4ea1493d30b636bc041e0ad41f40a7229c2189abb74f269085",
    "declared_timestamp": "2026-10-10T17:56:55.559Z",
    "file_mtime": "2026-10-10T17:58:34.915Z"
  },
  {
    "path": "data/research-intel/review/2026-w05-weather-venue.json",
    "exists": true,
    "sha256": "fa7ee70f0cea94dcdd41bc65866eaf7eafdf10c124fa07654e27ecc4fdcc8cf3",
    "declared_timestamp": "2026-10-10T17:56:55.559Z",
    "file_mtime": "2026-10-10T17:58:35.432Z"
  },
  {
    "path": "data/research-intel/review/player-props-intel-latest.json",
    "exists": true,
    "sha256": "1341dfb25d8a859da2a42253e783b1d36d8aadac2588ec9c2ebc5edbe66606df",
    "declared_timestamp": "2026-10-10T19:52:28.215Z",
    "file_mtime": "2026-10-10T19:52:28.312Z"
  },
  {
    "path": "reports/intel/master-intel-narratives-2026-w05.md",
    "exists": true,
    "sha256": "533b137843886685a125b690a47b36ff298be9570308c126e4493e78dc2499c8",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T07:21:36.358Z"
  },
  {
    "path": "scratch/w05-synthesis-digest-sat.md",
    "exists": true,
    "sha256": "21aaf322cb40699d7733697e5e2f6b03238c1d7ee158911f62d80d79f64e3845",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T21:17:36.999Z"
  },
  {
    "path": "data/vault-seed/nflverse/player_stats_weekly.csv",
    "exists": true,
    "sha256": "9e682bd066a36abb67a12932c588b24ad7024713f7aac27a073254f449383394",
    "declared_timestamp": null,
    "file_mtime": "2026-10-06T18:44:56.773Z"
  },
  {
    "path": "data/projected-starters/2026/manual/week-usage-locks.json",
    "exists": true,
    "sha256": "ea63e077f142ad0439de69d8bc320e720912b9ca2115e3b8213915ea0e9073f3",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T02:01:25.911Z"
  },
  {
    "path": "data/research-intel/proposed/2026-w05-quantitative-synthesis.json",
    "exists": true,
    "sha256": "dd61c5071093833a55e4c37c74acca55afb76b061cb9adbdcd720ae18e50e988",
    "declared_timestamp": "2026-10-10T16:59:28.476Z",
    "file_mtime": "2026-10-10T16:59:28.501Z"
  },
  {
    "path": "reports/intel/2026-w05-quantitative-synthesis.md",
    "exists": true,
    "sha256": "1d856303757fdb2c1993ce1598a5cbaff28b333f1ad4d34c1475e03a43c885ac",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T16:59:28.502Z"
  },
  {
    "path": "data/research-intel/proposed/2026-w05-expanded-decision-support.json",
    "exists": true,
    "sha256": "6cd77f61cc6be852eeceba34276359e328575f4a99e8a109a5f9b9bab866af0b",
    "declared_timestamp": "2026-10-10T16:50:16.917Z",
    "file_mtime": "2026-10-10T16:50:16.984Z"
  },
  {
    "path": "reports/bets/2026-w05-expanded-decision-support.md",
    "exists": true,
    "sha256": "bf568e6863918f778ebff89081cb95feed06d690deda69c9065b7b7287ea236a",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T16:50:16.986Z"
  },
  {
    "path": "docs/POSTMORTEM_DATA.md",
    "exists": true,
    "sha256": "f4d667250c215815a56ca39fa2cf99a4209757c556db7f409ce1470b7b60bee9",
    "declared_timestamp": null,
    "file_mtime": "2026-10-07T08:02:01.874Z"
  },
  {
    "path": "data/expert-dossiers",
    "exists": true,
    "scope": "directory existence only; contents not audited after stop"
  },
  {
    "path": "reports/bets/season-recap/expert_sides.json",
    "exists": true,
    "sha256": "b97ad3c709231ce870442d8d9364003c814393166aed8f38c7e2f5b4eb6953a6",
    "declared_timestamp": null,
    "file_mtime": "2026-09-28T18:53:04.644Z"
  },
  {
    "path": "reports/bets/season-recap/expert_props.json",
    "exists": true,
    "sha256": "3c5268f9b7daf645e658402778aa302dfb33a745c5d82b4f8523c5015e0573ee",
    "declared_timestamp": null,
    "file_mtime": "2026-09-28T18:53:04.622Z"
  },
  {
    "path": "data/prediction-markets/cross-market-coherence-latest.json",
    "exists": true,
    "sha256": "25fbdfa76f817acc454407f92dc5fe9728b89916afb9b1e589621c79bd88e3f8",
    "declared_timestamp": null,
    "file_mtime": "2026-10-09T22:01:54.854Z"
  },
  {
    "path": "data/official-picks/user-placed-wagers-2026.json",
    "exists": true,
    "sha256": "4ddfc1b7029ed449ba32f56519f865534fb4787f296f534f5dab0bb97557ad06",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T17:00:03.697Z"
  },
  {
    "path": "data/research-intel/week-exclusions.json",
    "exists": true,
    "sha256": "0f08691e65b8812a271db20cb5aaeee8a0ccd6f57f5e4592722ad232edd3b9af",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T19:58:54.748Z"
  },
  {
    "path": "public/schedule.json",
    "exists": true,
    "sha256": "f6569c27766fa7237a748b04e74ca577a2e0f64ff7925b28f2407ef73684983a",
    "declared_timestamp": null,
    "file_mtime": "2026-10-06T18:44:48.187Z"
  },
  {
    "path": "scripts/master-intel/verify_expert_rows.py",
    "exists": true,
    "sha256": "d4fdcec7f7ede07dbd1c7afd8648a0d62cc722b056d2608c74b386d23360e4f6",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T20:28:11.022Z"
  },
  {
    "path": "scripts/build-w05-quantitative-synthesis.mjs",
    "exists": true,
    "sha256": "78715f113cabd37963007071bf70b35c3f08482e6eccef22b87bc5305af95def",
    "declared_timestamp": null,
    "file_mtime": "2026-10-10T17:23:47.211Z"
  }
]
```
