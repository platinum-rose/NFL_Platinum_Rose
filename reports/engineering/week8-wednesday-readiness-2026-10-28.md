# Week 8 depth-chart reconciliation and Wednesday readiness

Inspected October 28, 2026, approximately 12:42–12:55 AM Pacific. This is a local engineering and evidence review. **Wednesday execution and real tracker activation remain HOLD.** Neither Wednesday cadence was launched, and Tuesday was not rerun.

**Current FTN update, 8:13 AM Pacific:** Monday's missing game is now included. All 36 tables were recaptured (4,674 rows); all 384 team-table GP checks pass, and the reviewed Week 8 context was promoted locally. See [FTN recheck and promotion](week8-ftn-mnf-recheck-2026-10-28.md). This clears the FTN source-coverage hold only; other readiness gates were not rerun.

**Earlier FTN follow-up, approximately 1:48 AM Pacific:** all 36 Stats IQ tables were freshly captured (4,682 rows), but Dallas/Philadelphia source statistics still omitted their completed Week 7 Monday night game. That held capture and its dated context remain preserved. See [earlier FTN capture](week8-ftn-capture-2026-10-28.md). The FTN references below describe the original readiness inspection.

## Verified checkout and roster state

- Windows branch: `claude/w5-prop-cards-2026-10-11`; HEAD `71c6b4f9906634293bb24e156aca3a7b16b8a6ff`, matching its saved upstream.
- Active M6 checkout `/home/andrewlrose/projects/NFL_Dashboard_w5_current` was clean at `ba8b2e74e8cf3fd93832ab208d72a7be25fcbaf0`. Fetched and inspected the two incoming code/handoff commits, then fast-forwarded it to `71c6b4f9906634293bb24e156aca3a7b16b8a6ff`. Final status was clean and ahead/behind `0/0`. Legacy checkouts and archives were untouched. This session's uncommitted Windows research changes have not been copied to M6.
- Explicit free ESPN roster refresh: **32 teams, 2,549 players**, source `2026-10-28T07:42:38.648326+00:00`. Required `npm run roster:vet -- --week 8 --date 2026-10-28 --fetch --strict`: **PASS, zero blocking issues**. Seven saved-map/previous-week discrepancies were informational. The gate resolved zero card/digest legs; it does not certify a new card or Wednesday practice status.
- Additional direct membership audit matched **all 66 manual chart rows** to their claimed teams in the fresh roster snapshot. Roster membership does not establish starting role or availability.

## Independent comparison completed, conflicts retained

Machine-readable evidence: [week8-depth-chart-reconciliation-2026-10-28.json](week8-depth-chart-reconciliation-2026-10-28.json). It records every manual row, corresponding team-page position/depth cells, capture times, source response hashes, original and annotated chart hashes, and roster provenance. No complete raw HTML archive is claimed.

| Scope | Manual rows checked | Broad role level agrees | Rows needing independent review |
|---|---:|---:|---:|
| ARI | 34 | 27 | 7 |
| MIN | 32 | 28 | 4 |
| Total | 66 | 55 | 11 |

“Agrees” compares broad starter versus depth roles within position families. It does not certify exact alignment, injury status, rank for every backup, or eleven simultaneous starters. The two team pages expose no clear update timestamp; observation time is retained separately. Ourlads still displayed the original ARI October 27, 5:21 PM ET and MIN October 26, 2:01 PM ET updates.

Arizona differences:

- The team page places Tyler Allgeier before Jeremiyah Love at RB; the retained Ourlads-based manual roles put Love first.
- Its two-WR/two-TE layout places Simi Fehoko second and Elijah Higgins in a first TE cell, unlike the manual three-WR/one-TE representation. Reggie Virgil's WR alignment and Devin Duvernay's WR depth also differ.
- Baron Browning shares a first OLB cell with Zaven Collins, who is absent from the manual chart. Defense has twelve position rows and thirteen names in first cells; these cannot be treated as a single lineup. Sources: [Cardinals team chart](https://www.azcardinals.com/team/depth-chart), [Ourlads ARI](https://www.ourlads.com/nfldepthcharts/depthchart/ARZ).

Minnesota differences:

- Aaron Jones Sr. and Jordan Mason share the first RB cell. Demond Claiborne occupies the second cell rather than the third sequential place in the Ourlads-based chart.
- Jay Ward appears as second safety on the team page, versus the manual first nickel/CB role. The team lists eleven defensive rows; Ourlads adds a nickel row. Retain this as a package/role conflict.
- Max Bredeson's first FB row is absent locally. DeeJay Dallas remains outside the manual chart; a team-page depth listing alone does not establish eligibility or role. Sources: [Vikings team chart](https://www.vikings.com/team/depth-chart), [Ourlads MIN](https://www.ourlads.com/nfldepthcharts/depthchart/MIN).

The original manual files model K/P but omit dedicated LS rows (Casey Kreiter and Andrew DePaola). Holder/return duties are separate from offensive depth. These omissions prevent interpreting “all-position” as complete personnel or lineup coverage.

Both manual charts now link the independent report and carry `independent_depth_chart_review` tags on the eleven affected rows. Browning and Ward changed from `needs_human_review: false` to `true`; the other nine were already marked for review. Original roles, confidence values, source counts and Ourlads evidence were preserved. No role was silently promoted or demoted.

**Builder limitation:** a no-persist build retains all eleven tags, but existing human approvals force review flags false for Allgeier, Jones and Mason. Eight remain in review. Human decisions were preserved. The builder also unconditionally retains its “independent second-source depth-chart reconciliation” missing marker for teams with manual data; this review does not remove that gate or reconcile the other thirty teams. Consult this report before activation; a count of zero teams needing a manual chart is not full clearance.

## Wednesday execution readiness

Live Windows Task Scheduler inspection confirmed both tasks are enabled and Ready:

| Task | Last run (Pacific) | Last result | Next run (Pacific) |
|---|---|---:|---|
| `NFL_Dashboard_Toolbox_Wednesday` | October 21, 9:00 AM | 0 | October 28, 9:00 AM |
| `NFL_Dashboard_Toolbox_WednesdayPM` | October 21, 3:00 PM | 0 | October 28, 3:00 PM |

At inspection neither job was due. Missing Week 8 Wednesday logs are expected, not evidence of a failed run. **Tasks remain enabled; no task configuration was changed.** This is a snapshot, not a monitor or authorization for their execution.

The installed Wednesday description promises dry runs and “no Gemini,” but the wrapper invokes the live toolbox lane. `scripts/toolbox.mjs` runs the podcast sweep, live research ingestion, a Supabase-backed article review and authenticated Twitter ingestion. Twitter may call paid Gemini text/Vision and write Supabase. Current per-action approval is required before invoking those operations; old source comments do not supply it.

Wednesday PM refreshes availability, starters and prediction-market context, then builds Alpha. It does **not** refresh two required Alpha inputs. An offline call to the production pure freshness evaluator at `2026-10-28T07:51:26.997Z`, current week 8, returned **not ready**:

| Input | Saved generation time (UTC) | Week | Gate result |
|---|---|---:|---|
| Availability | October 27, 23:30:02 | not declared | Within 36h, but pre-practice |
| Projected starters | October 27, 23:04:32 | not declared | Within 36h; generated file not rebuilt here |
| Secondary matchups | October 24, 01:18:48 | 7 | Stale (~102.5h), wrong week |
| Player-props intel | October 24, 01:18:51 | 7 | Stale (~102.5h), wrong week |

Do not bypass with `--allow-stale`. Alpha's structural freshness pass for the first two inputs is not Wednesday practice clearance. Prediction markets, mapping, coherence, Alpha and FTN context also remain from Week 7. Week 8 podcast-pull and current prop-capture artifacts were absent at inspection; no source-coverage review is claimed.

The schedule retains 272 games, fourteen each in Weeks 7 and 8, with no Week 8 game started at inspection. Usage evidence reaches Week 7. Tuesday needs no rerun.

The full weekly preflight was not invoked: absent `--no-fetch`, it includes a Gemini billing probe. Even `--no-fetch` reruns the roster vet and writes its local result. Static inspection and the pure Alpha freshness evaluator were sufficient for this readiness review.

## Next authorized work and pending actions

1. Resolve chart order/package conflicts using dated team/beat evidence and Wednesday practice reports after approximately 1–2 PM Pacific. Re-run the roster gate after that availability capture and for any new player-named output.
2. Obtain Andy's per-action OK before live Wednesday operations, paid services or Supabase actions. The enabled 9 AM job's actual scope needs review before its scheduled trigger.
3. Prepare current-week secondary-matchup and props inputs before the PM Alpha step; do not treat running Wednesday PM alone as sufficient.
4. Resolve the three persisted-approval conflicts before treating the local starters review queue as clear. No approvals were revoked here.
5. Real tracker rebuild/publication still requires separate approval, the applicable roster gate, and actual generated-page verification. No tracker HTML, ledger, account, wager, Supabase data or paid model was changed by this session.

## Verification and preservation

- Both chart JSON files and the complete 66-row roster comparison validate. An automated before/after comparison verified every original role, confidence, source-count and evidence value unchanged.
- No-persist production starters build: eleven independent-review tags retained; eight review flags true, three false due to recorded approvals. Both newly required reviews remain true. Named-status validation passes. The actual projected-starters latest file was not rewritten.
- Production pure Alpha freshness evaluator returns HOLD for the two stale Week 7 dependencies, without running Alpha generation or making network calls.
- Full unit run: **2,046 passed, 27 failed**, across 145 test files (134 passed, eleven failed). The two focused tracker/schedule files both passed: **21/21 tests**. Full results: [week8-unit-tests-2026-10-28.json](week8-unit-tests-2026-10-28.json). The prior offline Chromium replay was not rerun for these data annotations.
- The first full-suite attempt loaded no tests because the sandbox temporary cache failed with Windows `EPERM` on rename. A workspace-local temporary directory let the second run execute. Eight remaining failures are loopback server fetch failures; one is a Windows path expectation mismatch. Other assertion failures remain untriaged against a clean baseline. **No full-suite pass or claim that all failures predate this session is made.**
- The suite wrote the previously clean tracked test fixture `public/test-live-tracker.html`. Its test-generated bytes were backed up and hash-verified at `E:/data/.tmp/nfl-week8-verification-20261028/test-live-tracker-from-unit-run.html`, then that one file was restored to exact HEAD bytes. No broad restore/reset/clean was used.
- SHA-256 preservation check passed for all four pre-existing modified files (market comparison, private Yahoo access document, both real tracker HTML copies), and for the generated projected-starters latest file. Scoped whitespace checks passed. No production source code, human-review decisions, ledger, account, wager or paid/Supabase state was changed. Nothing was staged, committed, pushed or published.

Windows changes are limited to the fresh roster snapshot, its dated local archive/gate result, annotations on the two manual charts, and these local review/test artifacts. M6 contains the previously committed checkpoint only.
