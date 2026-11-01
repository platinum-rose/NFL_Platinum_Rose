# Week 8 Wednesday midday preparation — October 28, 2026

Checked at approximately **1:10 PM Pacific**. **Research readiness: HOLD.** FTN is ready; current Wednesday availability and prop/matchup dependencies are not fully cleared.

Update at 1:23 PM PT: Andy approved the scoped read-only article retrieval, which is now complete. See `week8-article-retrieval-2026-10-28.md` for 189 retained raw records, offline review, and remaining extraction limits. Statements below about pending approval describe the earlier checkpoint.

## Verified checkpoint

- Branch `claude/w5-prop-cards-2026-10-11`, HEAD `71c6b4f9906634293bb24e156aca3a7b16b8a6ff`, unchanged. Existing dirty/private/generated files preserved.
- Strict Week 8 roster vet passed with zero blocking issues. Snapshot: October 28, 07:42Z, 2,549 players / 32 teams; approximately 12.4 hours old at this run. Seven info-only issues remain. This is not practice or role clearance.
- FTN canonical SHA-256 remains `9d1e5ca2603ea752e2391c99161f007eb71bb15b79f1743af648313c7ad18ebd`, Week 8, `pass_week7_game_counts`. The missing Monday game was included in the earlier complete recapture. See `week8-ftn-mnf-recheck-2026-10-28.md`.
- Earlier active M6 fast-forward and ARI/MIN independent reconciliation are recorded in `week8-wednesday-readiness-2026-10-28.md`. The root handoff predates those completed steps. M6 has not been contacted or updated by this midday pass.

## TNF final reports captured

The official [Packers final injury report](https://www.packers.com/news/packers-list-four-questionable-rule-out-three-vs-panthers-week-8-injury-report) supplies both teams' final tables. Carolina's [final report](https://www.panthers.com/news/week-8-wednesday-injury-report-four-ruled-out-for-packers-game) independently confirms its four exclusions and one questionable designation. Both full public pages were retained locally with capture times and hashes. The initial guessed Packers date URL returned 404; the actual article link was found on the public news index and captured successfully.

All **17 table entries** match the correct team in the roster snapshot. Participation is estimated on this short week; do not describe the estimates as full practices.

| Team | Out | Questionable | Listed without a game designation |
|---|---:|---:|---:|
| Carolina | 4 | 1 | 3 |
| Green Bay | 3 | 4 | 2 |

- **CAR out:** Jaelan Phillips, Damien Lewis, Akayleb Evans, Torricelli Simpkins III. **Questionable:** Bobby Brown III.
- **GB out:** Zaire Franklin, Travis Glover, Sean Rhyan. **Questionable:** Matthew Golden, Devonte Wyatt, Anthony Campbell, Brenton Cox Jr.
- Golden improved from estimated DNP Tuesday to limited Wednesday, but remains questionable. Coker is estimated full Wednesday with no game designation. Neither observation is a guarantee of activation, workload, or a fantasy start recommendation.
- Review offensive-line and Carolina secondary implications with current roles and replacements before any matchup or prop recommendation. Tomorrow's transactions and inactive lists remain required.

Structured facts and source row positions: `week8-midday-2026-10-28/tnf-official-status-review.json`.

## Safe local preparation completed

Captured the free public ESPN injury endpoint at **20:05:28Z / 1:05 PM PT**, covering all 32 teams. Built isolated previews with network calls disabled and FantasyPros explicitly disabled:

- Availability: 655 parsed ESPN injury rows plus retained training-camp inputs, yielding **679 events**. Evidence validation passes; three detected conflicts remain flagged and ineligible. Historic camp rows are not new Wednesday evidence.
- Projected starters: **163 players**; named-status validation passes with both required review cases still withheld. Prior human role approvals and the ARI/MIN disagreement tags remain intact.
- Secondary matrix: **28 matchups** for Week 8. Manual coverage seeds retain July/September dates and role seeds September/October dates; generation time does not establish their freshness or accuracy.

The previews feed one another through explicit local paths. None replaced a canonical latest file or a public artifact. Canonical availability, starters, secondary, props, both Alpha packets, and both real tracker files were hash-checked before and after and remained unchanged.

Evidence, previews, source receipts, and machine-readable audit: `week8-midday-2026-10-28/`.

## Remaining readiness gaps

| Canonical input | Saved generation UTC | Current finding |
|---|---|---|
| Availability | Oct 27, 23:30:02 | Tuesday evidence; fresh preview is supplemental and ESPN-only |
| Starters | Oct 27, 23:04:32 | Does not yet include this pass's current availability or reconciliation annotations |
| Secondary matchups | Oct 24, 01:18:48 | Week 7, approximately 115 hours old |
| Prop intel | Oct 24, 01:18:51 | Week 7, approximately 115 hours old |

The pure Alpha freshness evaluator fails on secondary and prop inputs. **Do not use `--allow-stale` or rebuild Alpha to make it appear ready.** Wednesday PM does not rebuild those two dependencies.

The saved article review is newer: 18:35:05Z, 143 deduplicated records, 136 with bodies assessed, zero unresolved pick-oriented records, but 11 suspected ingest-cap bodies and seven metadata-only records remain. Its retained collection metadata reports complete pagination for its since-Tuesday window. That is not a full Week 8 article corpus or recommendation clearance. The review omits full article bodies, so it cannot serve as a lossless input to the prop extractor. A scoped read-only Supabase article retrieval is awaiting Andy's per-action approval.

Canonical corpus inventory was inspected: 104 exhaustive master reports, 57 manifest entries, 394 structured recommendations. These are inventory counts, not a freshness or source-coverage claim. No new recommendation synthesis was performed.

## Wednesday execution and next steps

- The existing 9 AM Wednesday schedule completed at 16:04:28Z, exit 0. It was not rerun. Tuesday was not rerun.
- Its logs record actual Supabase mutations and ten Gemini Vision attempts; the podcast step's "Gemini not run" wording does not describe the other steps. This pass did not launch that schedule, invoke those services, or approve them retroactively.
- Today's 3 PM Wednesday PM run remains pending at this checkpoint. Its installed path includes FantasyPros by default. Do not manually invoke it under the current approval boundary. Existing task settings were not changed.
- The bookmark sync log's last success is October 15. This supports a stale-sync observation, not a completed diagnosis of the task.
- Next: finish official Wednesday report coverage across the Sunday/Monday slate, reconcile role/replacement evidence, and refresh the stale prop dependency only after the scoped data access is approved. Re-run the roster gate before the resulting player-named output.
- Tracker activation and publication remain pending Andy's separate approval and actual page verification. No account, wager, ledger, Supabase, paid/model action, or publication was performed by this midday pass.

## Verification

Data-only work: repository builders exercised with persistence disabled, evidence validation checked, all 17 official TNF rows roster-matched, and protected canonical hashes verified. No production code changed, so the full suite was not repeated. Earlier results remain 21/21 focused tests plus the prior offline Chromium replay; the broader session run was 2,046 passed / 27 failed and is not a full-suite pass.
