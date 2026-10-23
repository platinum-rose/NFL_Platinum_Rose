# Week 5 Astra evidence manifest — STOPPED AT PREFLIGHT

## Final verification update — calibration hash drift

At 2026-10-10T22:04:42.602Z, the calibration JSON SHA-256 is 0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33, which differs from the user's required 32d278dc6f20c52ac754549951f782b6b33295d6014b3318de519188c87062f8. The prompt also changed during the run (current SHA-256 4b5941bfb93c9d03adff7c1eb5d4625170e90bd76becb3f317a8dad74bb3b76c) to reference the new hash and describe the 2026 lines as preseason placeholders. Neither file was modified by this run. The CSV SHA-256 and HEAD remain as requested.

The original metadata contradiction below documents the inputs as initially read; the current prompt has corrected that wording. The decisive final blocker is now **calibration hash drift against the user's explicit pin**. The replacement pin in a concurrently changed file is not accepted as a user instruction. No simulation or analysis was started. The initial integrity table below is a point-in-time record and no longer describes the current calibration/prompt hashes.

Status: blocked before analysis; incomplete evidence audit.

Checked 10/10/2026, 3:03:48 PM PDT (2026-10-10T22:03:48.499Z). Existing checkout only: E:/dev/projects/NFL_Dashboard.

## Blocking finding

Calibration source-description contradiction: the pinned JSON says 2026 rows have "no scores, no lines", but the pinned CSV contains 77 of 272 season-2026 rows with a spread and 76 with a total (77 with either). All 272 lack scores and results. This is NOT hash drift. The result-free portion of the schedule-only requirement passes; the explicit no-lines claim does not.

The prompt and pinned artifact were unchanged at the initial content check; the final concurrent changes are recorded above. No calibration regeneration, model analysis, simulation, recommendations, or player-prop menu construction was performed. The 2018–2025 era has not been rejected statistically; this stop concerns the required source-content validation and a contradicted factual claim. Correcting metadata or revising this validation expectation requires a reviewed input/contract change outside this run.

## Identity and integrity

- Branch: main. HEAD: 5dfda50aa7797f6e7628cfce0af0124c5411af14; expected 5dfda50: PASS.
- Calibration SHA-256: 32d278dc6f20c52ac754549951f782b6b33295d6014b3318de519188c87062f8: PASS.
- Historical CSV SHA-256: 51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51: PASS.
- JSON embedded source hash equals pinned CSV constant: PASS.
- CSV total rows: 7,548; regular-season rows with spread, total and result: 6,967; maximum season with results: 2025: PASS.
- Calibration default: 2018–2025, 2,127 games, margin residual SD 12.772, total residual SD 13.128. Four eras present. No alternative era selected.
- Required ignored expert-verifier and article-Gemini files exist; Git check-ignore confirmed both.
- Dirty checkout at start: 280 modified tracked paths, 9 deleted tracked paths, 616 untracked status entries. The quantitative-synthesis script is untracked. These are reproducibility risks; no existing changes were altered. Git fsmonitor emitted an IPC error; tracked status was independently checked with core.fsmonitor=false (289 tracked changes).

## Corpus and exclusions

Pinned pull: window_start=2026-10-05T04:00:00.000Z, pulled_at=2026-10-10T20:44:35.275Z. Full row eligibility and independent count validation deferred at stop. Verifier counts read from artifact: 460 verified, 132 reject, 41 not_pick. Verified status alone is not recommendation eligibility. Simulation and FTN remain quantitative evidence only, separate from verified expert evidence.

Week 5 exclusions retained verbatim from data/research-intel/week-exclusions.json:

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

## Market capture inventory

| Book | Capture time PT | Age hours at report | Declared games | Rows | Assessment |
|---|---|---:|---:|---:|---|
| bookmaker | 10/10/2026, 9:16:12 AM PDT | 5.793 | 14 | 5376 | within six-hour age limit only; structure and prices not yet validated |
| betonline | 10/10/2026, 2:15:15 PM PDT | 0.809 | 14 | 1146 | within six-hour age limit only; structure and prices not yet validated |

BKR six-hour boundary: October 10, 2026, 3:16:12 PM PDT. Freshness must be recomputed on any resumed run. Aggregate timestamps do not establish row-level freshness or price verification. Both raw text captures and source-evidence parsed mirrors exist. No sportsbook was accessed or refreshed.

## Game-status gate

Incomplete. Public ESPN date-range scoreboard access failed (HTTP 400 after restricted-environment DNS failure); season/week scoreboard returned no events at 2026-10-10T22:01:53Z. A direct summary for event 401872981 responded with PHI/JAX and kickoff 2026-10-11T13:30Z at 2026-10-10T22:02:03Z, but a complete status matrix was not generated before the content-validation stop. No started/final conclusion is asserted for the remaining slate. Local schedule status is not accepted as current: it still marks the prompt-excluded TB@DAL game pre. TB@DAL stays excluded under the prompt.

## Handoff reconciliation

Newest dated handoff present: handoffs/2026-10-10-codex-week5-card-prep-and-prop-capture-handoff.md. It lacks a precise capture timestamp and describes BEO as 976 rows/78 players; the current normalized artifact declares 1,146 rows/130 players. Current input takes precedence. No missing committed handoff identified in this limited check.

## Input integrity inventory

This is a preflight inventory, not a completed eligibility manifest. Hashing an input does not certify its citations, freshness, identities, prices, or recommendation quality. Directories below are present but their individual contents have not been audited. No retired DVOA artifact was read.

| Path | Capture/generated UTC | Age hours | SHA-256 / presence |
|---|---|---:|---|
| prompts/2026-w05-astra-full-synthesis.md | not established | — | 689686fa97562cad546038ce600319b8ec52517bb22fd5c5f430a1f949631cfa |
| data/generated/master-intel/w05-pull.json | 2026-10-10T20:44:35.275Z | 1.32 | c5628b4aa5602990ac046f3d11874743671592483c6372f8e0c987c5868eb9de |
| data/research-intel/week-exclusions.json | not established | — | 0f08691e65b8812a271db20cb5aaeee8a0ccd6f57f5e4592722ad232edd3b9af |
| data/generated/master-intel/w05-expert-verified.json | 2026-10-10T20:44:36+00:00 | 1.32 | 5fe1d48a2513f5ac0a6f9198078638c5233ea74bfad7c58d40fbd92511dcd1f5 |
| public/schedule.json | not established | — | f6569c27766fa7237a748b04e74ca577a2e0f64ff7925b28f2407ef73684983a |
| data/research-intel/proposed/2026-w05-historical-market-calibration.json | 2026-10-10T21:29:09.997833+00:00 | 0.577 | 32d278dc6f20c52ac754549951f782b6b33295d6014b3318de519188c87062f8 |
| data/vault-seed/nflverse/games-full-1999-2026.csv | not established | — | 51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51 |
| docs/POSTMORTEM_DATA.md | not established | — | f4d667250c215815a56ca39fa2cf99a4209757c556db7f409ce1470b7b60bee9 |
| data/expert-dossiers/ | not established | — | directory exists; contents not yet audited |
| reports/bets/season-recap/expert_sides.json | not established | — | b97ad3c709231ce870442d8d9364003c814393166aed8f38c7e2f5b4eb6953a6 |
| reports/bets/season-recap/expert_props.json | not established | — | 3c5268f9b7daf645e658402778aa302dfb33a745c5d82b4f8523c5015e0573ee |
| data/prediction-markets/cross-market-coherence-latest.json | not established | — | 25fbdfa76f817acc454407f92dc5fe9728b89916afb9b1e589621c79bd88e3f8 |
| data/official-picks/user-placed-wagers-2026.json | not established | — | 4ddfc1b7029ed449ba32f56519f865534fb4787f296f534f5dab0bb97557ad06 |
| data/generated/props/bookmaker-live-2026-10-10-week5.json | 2026-10-10T16:16:12.396Z | 5.793 | 33bc8b6dbccf8eae809e195c7a10ef5fbbea9a9b6c0168ee797308334ebff9cd |
| data/generated/props/betonline-live-2026-10-10-week5.json | 2026-10-10T21:15:15.131Z | 0.809 | 227cde7166332d3c804219162d6aeefefa09b5264759d4330131ed5430a16925 |
| data/generated/props/draftkings-predictions-live-2026-10-10-week5.json | 2026-10-10T16:23:47.127Z | 5.667 | 6330f705bb6d01edcb906a840761737ff76242ebf322ab434714856c4af672dc |
| data/supercontest/week-05-2026-verified-lines.json | not established | — | 836b11a4d6f3b4e43d4629e89ee8ef688155c833f22e5740b5d7198b8dfd2544 |
| data/odds/actionnetwork-openers-2026-w05.json | not established | — | ba977a355909b9826e966cf2e2271233c5636605289a58674f6422b126aba446 |
| data/generated/odds/actionnetwork-history-2026-w05/ | not established | — | directory exists; contents not yet audited |
| data/research-intel/source-evidence/ | not established | — | directory exists; contents not yet audited |
| data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json | 2026-10-09T21:53:39.961Z | 24.169 | c030473bd752a162edfe9dd844ed0dfd5dbc3f3ce0b4b9126891dad8a1801fc3 |
| data/generated/team-profiles/team-power-ratings-2026.json | not established | — | e23a6e48f0bd60f2969a7095c6752460e8087347e04ebe80c100fef9eabb4f25 |
| data/generated/team-profiles/team-coaching-tendency-snapshots-2026-w2.json | not established | — | fdfa2f6309defc421756220a7126eeecd6e5c5a2e97358d24c7bbfa197dcac58 |
| data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json | not established | — | 1f19496c3b8a01880e816942aa802e395d1063f45beab66f3c2b097618735aed |
| data/player-availability/latest.json | not established | — | 92ab7e25de80436a8f2082407f7cb3466edc94103790b02b6e73016f604b4cb4 |
| data/player-availability/impact-digest-latest.json | not established | — | 98c16306da7a27f489c243ac08ac09c8162eaee6a6e0134375e48484d560b716 |
| data/projected-starters/2026/latest.json | not established | — | bc01261c74cab070914a3e5e164103d585cc9e379a7dfb2429a839330b3e495c |
| data/nfl-rosters/roster-map-latest.json | 2026-10-10T19:52:27.977Z | 2.189 | a8aa789bce1a299e1770ce4fbc7cfdb0b87748fffa44a0b0b89819f154dcf6b2 |
| data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json | 2026-10-10T17:56:55.559Z | 4.115 | c9cfd68220052e4ea1493d30b636bc041e0ad41f40a7229c2189abb74f269085 |
| data/research-intel/review/2026-w05-weather-venue.json | 2026-10-10T17:56:55.559Z | 4.115 | fa7ee70f0cea94dcdd41bc65866eaf7eafdf10c124fa07654e27ecc4fdcc8cf3 |
| data/research-intel/review/player-props-intel-latest.json | 2026-10-10T19:52:28.215Z | 2.189 | 1341dfb25d8a859da2a42253e783b1d36d8aadac2588ec9c2ebc5edbe66606df |
| reports/intel/master-intel-narratives-2026-w05.md | not established | — | 533b137843886685a125b690a47b36ff298be9570308c126e4493e78dc2499c8 |
| scratch/w05-synthesis-digest-sat.md | not established | — | 21aaf322cb40699d7733697e5e2f6b03238c1d7ee158911f62d80d79f64e3845 |
| data/vault-seed/nflverse/player_stats_weekly.csv | not established | — | 9e682bd066a36abb67a12932c588b24ad7024713f7aac27a073254f449383394 |
| data/projected-starters/2026/manual/week-usage-locks.json | not established | — | ea63e077f142ad0439de69d8bc320e720912b9ca2115e3b8213915ea0e9073f3 |
| data/research-intel/proposed/2026-w05-quantitative-synthesis.json | 2026-10-10T16:59:28.476Z | 5.072 | dd61c5071093833a55e4c37c74acca55afb76b061cb9adbdcd720ae18e50e988 |
| reports/intel/2026-w05-quantitative-synthesis.md | not established | — | 1d856303757fdb2c1993ce1598a5cbaff28b333f1ad4d34c1475e03a43c885ac |
| data/research-intel/proposed/2026-w05-expanded-decision-support.json | 2026-10-10T16:50:16.917Z | 5.225 | 6cd77f61cc6be852eeceba34276359e328575f4a99e8a109a5f9b9bab866af0b |
| reports/bets/2026-w05-expanded-decision-support.md | not established | — | bf568e6863918f778ebff89081cb95feed06d690deda69c9065b7b7287ea236a |
| data/generated/master-intel/w05-article-gemini-picks.json | 2026-10-10T20:38:33.844Z | 1.421 | 1f6283afce94ed5f88cada1921697f233aa3edcd7610209af181fb49b2caf239 |
| data/generated/props/bookmaker-live-2026-10-10-week5.raw.txt | not established | — | bb628f10fc13e39e76d12abf1062d80e1ac8aea1e98c7ee022c1c7f012966b79 |
| data/generated/props/betonline-live-2026-10-10-week5.raw.txt | not established | — | d2854b3071c789a93d4b35b9fb486fcb22a40ee84db4a188fc0359a9f2025139 |
| data/research-intel/source-evidence/2026-10-10-bookmaker-week5-sgp-parsed.json | 2026-10-10T16:16:12.396Z | 5.793 | 33bc8b6dbccf8eae809e195c7a10ef5fbbea9a9b6c0168ee797308334ebff9cd |
| data/research-intel/source-evidence/2026-10-10-betonline-week5-props-parsed.json | 2026-10-10T21:15:15.131Z | 0.809 | 227cde7166332d3c804219162d6aeefefa09b5264759d4330131ed5430a16925 |
| HANDOFF.md | not established | — | d5daf2867ab649c472973ac5e55ca0297cfac5d8d477715f5b1322d8b826847f |
| handoffs/2026-10-10-codex-week5-card-prep-and-prop-capture-handoff.md | not established | — | fcea86f7d878ef17d2726a452de4ff9b29e7e918e037efe14915bb36247f7e37 |
| scripts/build-w05-quantitative-synthesis.mjs | not established | — | 78715f113cabd37963007071bf70b35c3f08482e6eccef22b87bc5305af95def |

## Remaining validation

Roster-vet, FTN row/team checks, full market structure and raw-row price matching, citation validation, current ESPN status for all games, weather/venue audit, exposure summary, pool rules, game crosswalk, coverage matrix and simulation are NOT RUN / incomplete. No model or expert consensus is asserted.
