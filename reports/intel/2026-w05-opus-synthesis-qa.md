# Week 5 — Opus synthesis QA

Generated 2026-10-10T23:20Z. Scope: the four other Opus artifacts. Proposed analysis only.

**Verdict:** PASS. The machine validator ran 934 checks across 23 categories with 0 failures. Known data limitations are disclosed (manifest Gaps G1–G28). Price-specific rows are **not** usable until the kickoff delta checklist runs.

## 1. Machine-checkable validator

Code: scratchpad/w5/validate.py (sha256 333e8b8b59fcca27fc169fd930f6dbe0609428b109772492df1b0de63bad47d6). It reloads each source file independently. It resolves every cited BKR/BEO row by file#rows[i] and checks team/game identity, line, odds and capture time. It re-traces every cited expert quote as a verbatim substring of the stored article text, checks that tier support uses only rule-2 qualified rows, checks that every narrative section carries a provenance tag, re-gates named players against the roster and availability feed, and scans for stale sources described as live.

| Check | Pass | Fail |
|---|---|---|
| V1 market row identity | 168 | 0 |
| V1 market line/odds match | 168 | 0 |
| V1 market timestamp present & matches | 168 | 0 |
| V2 disposition price = captured | 56 | 0 |
| V10 no contradictory side promoted | 14 | 0 |
| V10 no contradictory total promoted | 14 | 0 |
| V10 stale-QB games not Tier 1 | 14 | 0 |
| V10 invalidators present | 14 | 0 |
| V3 cited expert row verified+URL+article | 19 | 0 |
| V3 cited row in qualified set | 19 | 0 |
| V3 quote verbatim in stored source | 19 | 0 |
| V3 game identity | 19 | 0 |
| V4 tier support uses qualified rows only | 6 | 0 |
| V5 narrative has market + simulation tags | 14 | 0 |
| V5 every narrative section carries a provenance tag | 84 | 0 |
| V5 narrative length 250-450 prose words | 14 | 0 |
| V6 prop offer resolves (player/line/odds) | 10 | 0 |
| V6 uncaptured prop labelled unavailable | 6 | 0 |
| V7 named player on roster for claimed team | 44 | 0 |
| V7 source-matched prop player gated | 16 | 0 |
| V8 no stale source called live | 33 | 0 |
| V12 ranked row has book and capture time | 10 | 0 |
| V13 output path contains opus, not astra | 5 | 0 |

Cited expert rows (19): rows[383], rows[384], rows[385], rows[386], rows[387], rows[388], rows[390], rows[391], rows[392], rows[393], rows[394], rows[395], rows[396], rows[397], rows[398], rows[399], rows[400], rows[402], rows[403]. Each is verdict=verified, kind=article, has a URL, and has a verbatim quote found in the stored source text (ESPN md body or VSiN feed body).

## 2. Requirement checklist

| Requirement | Status | Evidence |
|---|---|---|
| Every material claim has provenance | PASS | All 84 narrative sections carry ≥1 [Source: path, metric, timestamp] tag (V5). Tables cite file paths and capture times inline. |
| Every named player roster/status checked | PASS | Roster vet --strict PASS (0 blocking; scratch mirror). 44 players named via availability tags all resolve to the claimed team (V7). The 16 source-matched prop players are gated (V7). Menu rows carry gate status; blocked/unresolved/wrong-team rows appear only under 'do not use'. |
| Every listed price has a captured source/time | PASS | V1 (168 market rows), V2 (56 dispositions), V6 (10 prop offers), V12 (10 ranked rows). Uncaptured expert props are labelled unavailable; no price invented. |
| No stale source presented as live | PASS | V8 (33 occurrences of "live" are file or source names, or negations). DKP labelled stale/context. Every row carries stale_for_recommendation at its kickoff window. |
| No official/ticket mutation | PASS | Post-run on the device: 55/55 input SHA-256 unchanged; HEAD 7ef79ff unchanged; git status 915 entries before and after analysis (5 new untracked Opus files added only at delivery). No git add/commit/push. No build.py, pull.mjs, digest generator, scrapers, calibration script, Supabase, TheOddsAPI, paid Gemini, browser or sportsbook action. |
| No contradictory side silently promoted | PASS | V10: at most one side and one total per game; stale-QB games never Tier 1; conflicts listed in the synthesis "Evidence conflicts preserved" section. |
| All 14 remaining games have a source-audited row | PASS | 14 game records with market, simulation, FTN, power, availability, weather, secondary, expert evidence, label and invalidators. |
| Simulation reproduced with assumptions | PASS (with disclosed re-runs) | Accepted run e9a1ddff6e59e162…; two earlier runs rejected for methodology defects (see section 4). |
| Separate outputs for contest, confidence, pick'em, sides, totals, props | PASS | Decision-support sections are separate; parlay menus titled "construction menus — not tickets". |
| Blind rule | PASS | No astra-named file or reports/intel/_bak/ path was opened, listed or searched, except the prompt file the user directed me to follow. git status output was filtered with grep -vi astra. The output paths were checked for "opus" before writing. |

## 3. Digest tier audit (user rule 5)

scratch/w05-synthesis-digest-sat.md (sha256 21aaf322…; regenerated 14:17 PT) was built before the revised rules. Its tier-2 rows lean on expert-feed and podcast names (Action Network registry rows, Sean Koerner, Gilles Gallant, Grant Neiffer and others). It uses an undated BKR display board, and it tags the traceable ESPN article as research-only. **Its tiers are unreliable and were not used.** Re-derivation: 80 digest rows; 69 cite feed/podcast sources; 71 tier-2/2- rows lose their tier under rules 1–3 or the Opus simulation.

| Game | Digest market | Lean | Digest tier | Feed/podcast-sourced | Opus re-derived status | Change |
|---|---|---|---|---|---|---|
| PHI@JAX | JAX -7.5 -113 / ML -348 | JAX | 2- | yes | quantitative candidate (JAX -7.5, P 66.3%) |  |
| PHI@JAX | Bhayshul Tuten ATD | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| PHI@JAX | Brenton Strange ATD +290 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| PHI@JAX | Darius Cooper ATD +460 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| PHI@JAX | Brenton Strange u35.5 rec yds -110 | Under | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| PHI@JAX | Trevor Lawrence ATD +310 | Yes | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| CHI@GB | GB +1.5 -108 / ML +107 | GB | 2- | yes | pass (GB +1.5, P 33.5%) | CHANGED |
| CHI@GB | O45.5 -109 | Over | 2- | no | pass (Over 46, P 47.9%) | CHANGED |
| CHI@GB | Luther Burden ATD +240 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| CHI@GB | Tucker Kraft ATD +250 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| HOU@TEN | HOU -7 -115 / ML -368 | HOU | 2- | yes | pass (HOU -7, P 44.3%) | CHANGED |
| HOU@TEN | U38 -113 | Under | 2- | yes | pass (Under 37.5, P 46.4%) | CHANGED |
| HOU@TEN | Brevin Jordan ATD +2500 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| HOU@TEN | Tony Pollard ATD +250 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| HOU@TEN | Nico Collins ATD +140 | Yes | 2- | no | research_only (no rule-2 trace) | CHANGED |
| CIN@MIA | CIN -7 -108 / ML -334 | CIN | 2- | yes | pass (CIN -7, P 55.1%) | CHANGED |
| CIN@MIA | Mike Gesicki ATD | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| CIN@MIA | Mitchell Tinsley ATD +310 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| CIN@MIA | Greg Dulcich o26.5 rec yds -125 | Over | 2- research-only | no | qualified source-supported (traced) |  |
| LV@NE | LV +3.5 -107 / ML +165 | LV | 2- | yes | quantitative candidate (LV +3.5, P 58.4%) |  |
| LV@NE | O45 -113 | Over | 2- | no | pass (Over 45, P 41.2%) | CHANGED |
| LV@NE | Brock Bowers ATD +145 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| LV@NE | Cody White o1.5 rec | Over | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| LV@NE | Drake Maye ATD +450 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| LV@NE | Ashton Jeanty ATD | Yes | 2- | no | research_only (no rule-2 trace) | CHANGED |
| MIN@NO | NO +2.5 -109 / ML +120 | NO | 2 | yes | pass (NO +2.5, P 38.3%) | CHANGED |
| MIN@NO | U41.5 -113 | Under | 2- | yes | quantitative candidate (Under 41.5, P 58.2%) |  |
| MIN@NO | Devaughn Vele ATD +330 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| MIN@NO | Justin Jefferson ATD | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| MIN@NO | Kyler Murray ATD +475 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| MIN@NO | Aaron Jones ATD | Yes | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| MIN@NO | Aaron Jones rush yds Over (line n/a) | Over | 2- research-only | yes | research_only (no rule-2 trace) | CHANGED |
| CLE@NYJ | NYJ -2.5 -107 / ML -137 | NYJ | 2- | yes | pass (NYJ -2.5, P 49.5%) | CHANGED |
| CLE@NYJ | Garrett Wilson ATD +140 | Yes | 2 | no | research_only (no rule-2 trace) | CHANGED |
| CLE@NYJ | Isaiah Williams ATD +450 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| CLE@NYJ | KC Concepcion ATD +320 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| CLE@NYJ | Quinshon Judkins u59.5 rush yds -114 | Under | 2- | no | qualified source-supported (traced) |  |
| IND@PIT | PIT -3 +103 / ML -145 | PIT | 2 | yes | pass (PIT -3, P 49.7%) | CHANGED |
| IND@PIT | O43.5 -108 | Over | 2 | yes | pass (Over 43.5, P 44.1%) | CHANGED |
| IND@PIT | Laquon Treadwell ATD +600 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| IND@PIT | Pat Freiermuth ATD +300 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| IND@PIT | Roman Wilson ATD +250 | Yes | 2- | no | research_only (no rule-2 trace) | CHANGED |
| IND@PIT | Jaylen Warren o20.5 rec yds | Over | 2- research-only | yes | research_only (no rule-2 trace) | CHANGED |
| NYG@WAS | NYG +3.5 -108 | NYG | 2- | yes | conflicted (NYG +3.5, P 56.7%) | CHANGED |
| NYG@WAS | Isaiah Likely ATD +245 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| NYG@WAS | Jayden Daniels ATD +250 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| NYG@WAS | Isaiah Likely o40.5 rec yds -125 | Over | 2- | no | research_only (no rule-2 trace) | CHANGED |
| NYG@WAS | Isaiah Likely rec Over (line n/a) | Over | 2- research-only | yes | research_only (no rule-2 trace) | CHANGED |
| DEN@LAC | LAC +3.5 -103 / ML +170 | LAC | 2 | yes | pass (LAC +3.5, P 47.2%) | CHANGED |
| DEN@LAC | U42 -102 | Under | 2 | yes | quantitative candidate (Under 42, P 57.1%) |  |
| DEN@LAC | Marquez Valdes-Scantling ATD +1200 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| DEN@LAC | Troy Franklin ATD +650 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| DET@ARI | ARI +6 -111 / ML +226 | ARI | 2- | yes | pass (ARI +5.5, P 52.6%) | CHANGED |
| DET@ARI | O54.5 -108 | Over | 2- | yes | quantitative candidate (Over 54.5, P 57.4%) |  |
| DET@ARI | Amon-Ra St. Brown ATD -140 | Yes | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| DET@ARI | Michael Wilson o72.5 rec yds -110 | Over | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| DET@ARI | Sam LaPorta o50.5 rec yds -120 | Over | 2- | no | research_only (no rule-2 trace) | CHANGED |
| DET@ARI | Trey McBride ATD +120 | Yes | 2- | no | research_only (no rule-2 trace) | CHANGED |
| SF@SEA | SEA -3 -121 / ML -173 | SEA | 2 | yes | pass (SEA -3, P 37.3%) | CHANGED |
| SF@SEA | U46.5 -112 | Under | 2- | yes | price moved (Under 46.5, P 45.6%) |  |
| SF@SEA | Christian McCaffrey o4.5 rec -116 | Over | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| SF@SEA | AJ Barner ATD +310 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| SF@SEA | Mike Evans ATD +210 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| SF@SEA | Brayden Willis ATD +2200 | Yes | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| SF@SEA | Brock Purdy o22.5 rush yds -114 | Over | 2- research-only | yes | research_only (no rule-2 trace) | CHANGED |
| BAL@ATL | ATL -3 -117 / ML -161 | ATL | 2- | yes | pass (ATL -3, P 44.6%) | CHANGED |
| BAL@ATL | total 44 (O -103 / U -113) | split | skip | yes | split/skip |  |
| BAL@ATL | Austin Hooper ATD +900 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| BAL@ATL | Brian Robinson Jr. ATD +240 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| BAL@ATL | Mark Andrews ATD +260 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| BAL@ATL | Derrick Henry o5.5 rec yds -107 | Over | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| BAL@ATL | Tyler Huntley u23.5 rush yds -107 | Under | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| BAL@ATL | Zay Flowers o68.5 rec yds -115 | Over | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| BUF@LAR | BUF +3 +100 / ML +154 | BUF | 2- | yes | pass (BUF +3.5, P 48.0%) | CHANGED |
| BUF@LAR | O54.5 -107 | Over | 2- | yes | pass (Over 54.5, P 49.1%) | CHANGED |
| BUF@LAR | Dalton Kincaid ATD +200 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| BUF@LAR | Khalil Shakir ATD +270 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| BUF@LAR | Kyren Williams 1st TD +500 | Yes | 2 | yes | research_only (no rule-2 trace) | CHANGED |
| BUF@LAR | Josh Allen ATD -105 | Yes | 2- | yes | research_only (no rule-2 trace) | CHANGED |
| BUF@LAR | Kyren Williams o19.5 rec yds -118 | Over | 2- research-only | yes | research_only (no rule-2 trace) | CHANGED |

## 4. Simulation run log

| Run | Time (UTC) | Output SHA-256 | Status | Reason |
|---|---|---|---|---|
| 1 | 2026-10-10T22:53:53Z | 71c92f5ae13a0ac6b5effd9973ab029782330ebc481e9731a8c32b68d897731c | rejected | key-number weights applied at raw location shifted the median: market-only baseline gave 43.0% fav cover at -7.5 and 44.7% at -3.5 instead of 50%; methodology defect, outputs discarded |
| 2 | 2026-10-10T22:54:35Z | 1c0b49360e0a5ef022cc1713f5742f34062a0d3f666baaf3000476b06bd918c8 | rejected | median mapping of a fractional projection made cover probability a step function of the projection (any x in (k,k+1) identical); outputs discarded |
| 3 | 2026-10-10T22:55:19Z | 250c29e375fd6c081a5e45bd014d33457f2a936a413c4d64235c105445b0f533 (file) / e9a1ddff6e59e1627f0e5338d0c831ec66f3d2273691c0429f0a091ff5efd32c (payload) | accepted | unit-tested before run: 50/50 at half-point market lines; monotone and continuous in the projection |

Running more than once departs from the "run exactly once" contract. Both earlier runs were discarded for code defects found in their market-only baselines, not for their conclusions. Seeds and weights did not change between runs, and all three output hashes are recorded.

## 5. Reproducibility

| Item | SHA-256 |
|---|---|
| scratchpad/w5/common.py | 9329ff2bbc8f0057369a9b8715bc3d2935cf9967bee0e68a1fbe0748c38736b9 |
| scratchpad/w5/players.py | a4afcc17b46e0a84148cac3ab580672ac908d05463bf9743a6649eeba845e840 |
| scratchpad/w5/ftn.py | 7d688b69ae4087cd70586e64d59f2bd03db3610801d9eb45a367a7112a1d536a |
| scratchpad/w5/mech_markets.py | 572208c192f6877a891d6222c506d17cef21e7b94d898c71bd09c64e347f3397 |
| scratchpad/w5/mech_coverage.py | 40bf75cab0d97f687141c29fa5521b6ee0ae731b2bb790d27cf085e6a1f0f57e |
| scratchpad/w5/sim.py | a2a45b6248ec822e31a20689506c67b3a4796af5b57f12853a26c060fda8f253 |
| scratchpad/w5/citations.py | 73428eb89548a8f27456339aa282fef3b697bdc504e8d702dc7dc54957d438cc |
| scratchpad/w5/bundle.py | 1ad85eb3700becb0ebf90a9bdfd74710101242a520fb2846741adabebcc51457 |
| scratchpad/w5/props.py | 957396621fbb3baaeeb04a0695b9a2132fb861d771769161fabcf132b00f3bd6 |
| scratchpad/w5/decide.py | de4120212c80f15830b96cf0587216d35b6de11302f953de68646ea58c4c99be |
| scratchpad/w5/narr.py | ace8b40c74c6908cf00cbd8a5908adbb10bcbbb168450ab35f243bd68d3848c5 |
| scratchpad/w5/gen.py | 9c2d09ea1ce3a532d63d8738cbc4ab30dd065a672220931b41aad8edbad3f2e3 |
| scratchpad/w5/gen_docs.py | dcfecd5ba95abdf6fdc518a5f862ef1346b7cb2f9bdbd226ffc324aa01b12416 |
| scratchpad/w5/gen_dec.py | cae46683496d8b65d9f10abc1b51fa863cf4701498ee43e4f117eb4a8ff09fe3 |
| scratchpad/w5/validate.py | 333e8b8b59fcca27fc169fd930f6dbe0609428b109772492df1b0de63bad47d6 |
| scratchpad/w5/qa.py | 67583cf7f67fade382ab999b422f1704f06c28913559b31ed25f551da512af77 |
| reports/intel/2026-w05-opus-evidence-manifest.md | c25914bd298327824ff86edb868af00f413448b49f4dabf7ee8b9211a9e4d440 |
| reports/intel/2026-w05-opus-full-synthesis.md | 714912865931b5c8c980e8f146f94a690a30ee63b881e78ad93d7937fb553c22 |
| data/research-intel/proposed/2026-w05-opus-synthesis.json | 087f0a598a7e41abc8a128dc4a9fab5438e4725c6b77e723b70c38b9e3dca5f8 |
| reports/bets/2026-w05-opus-decision-support.md | 5b2ab6aa0ef594889c364434fe14f4ca390f3434fc6c77004fa5b2e985d43957 |

The scratch code lives outside the repository (this session's workspace); it was not written to the repo, per the run constraints. The repo itself is a dirty shared checkout (915 entries, including modified pipeline code), which is a reproducibility risk for any re-run that uses repo scripts.

## 6. Open items before any use

1. Run the delta checklist per kickoff window: official inactives and starters (CHI QB, MIN OL, Chase/Higgins, McLaurin, Flowers, Jeanty, Kamara, Jefferson), fresh BKR and BEO captures (≤3h), weather refresh (IND@PIT, CLE@NYJ, NYG@WAS, CHI@GB), ESPN status, and source-pick repricing.
2. Re-run the roster vet with --fetch after 2026-10-11T02:16Z.
3. Resolve the BKR/BEO disagreement on MIN@NO (−2.5 vs −1) with a fresh capture.
4. Fix the SuperContest file orientation (6 rows) and add a capture time.
5. Fix the sign defect in the prior quantitative pass (home_spread uses the favourite spread).
6. Adjudication between the Astra and Opus outputs belongs to a separate step; nothing here was reconciled or averaged.

