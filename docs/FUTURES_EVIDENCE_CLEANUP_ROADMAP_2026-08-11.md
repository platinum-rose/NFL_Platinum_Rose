# Futures Evidence Cleanup Roadmap — 2026-08-11

## Decision

Do not run another frontier futures synthesis until every hard re-entry gate in this document passes. The August 11 evidence snapshot is useful as a preserved diagnostic baseline, but it is not synthesis-ready.

No task in this roadmap approves a bet, creates an official pick, persists a recommendation, changes a portfolio, writes Supabase, or authorizes a paid model/API call.

## Why The Article Result Was Misleading

The `1 actual pick / 101 articles` result does not mean only one analyst published a pick.

- The builder defaulted to a global `100`-row database limit and then appended one local article, producing exactly `101` records.
- In `data/research-intel/review/article-intel-review-latest.json`, 31 records have no stored body.
- Another 45 bodies are at least 3,990 characters long and carry the known 4,000-character truncation risk.
- Only 25 records have a non-empty body below that ceiling.
- Ten titles are pick-oriented; nine of those records produced no strict actual-pick row.
- The extractor flattened structured multi-pick text and could substitute a team abbreviation for a player selection. That is why Tyler Shough was malformed and why additional explicit analyst selections could be missed.

The repaired contract must report three different things:

1. article records assessed;
2. explicit analyst selections found, including unique-selection and mention counts;
3. execution-usable actual picks with a named selection, market evidence, price, and venue.

## Work Board

| ID | Priority | Lane | Task | Acceptance test | Execution tier | Status |
|---|---:|---|---|---|---|---|
| A01 | P0 | Article corpus | Remove the default 100-row cap and page through the complete date window. Record database/local counts, page count, requested cap, and corpus-completeness status. | A fixture with more than 100 rows is not truncated; an implicit partial build cannot write a seemingly complete artifact. | code | CODE COMPLETE — rebuild pending |
| A02 | P0 | Article bodies | Record `metadata_only`, `thin_body`, `suspected_ingest_cap`, or `body_available` per article. Never render the aggregate as “articles reviewed.” | Summary and HTML/Markdown expose all body-evidence buckets and unresolved pick-oriented records. | code | CODE COMPLETE — rebuild pending |
| A03 | P0 | Pick extraction | Parse multiple structured analyst selections from one article and prohibit team abbreviations from standing in for player names. | The two known Sharp Football examples yield four selection mentions and three unique selections; no selection is `NO`, `BUF`, or another team code. | code | COMPLETE — fixture passes |
| A04 | P0 | Pick semantics | Separate explicit analyst selections from execution-usable actual picks. | A selection lacking a book or price remains visible but cannot enter `actual_picks`; strict actual picks have selection, market, price, and venue. | code | COMPLETE — fixture passes |
| A05 | P1 | Article source QA | Manually re-review every pick-oriented record that is metadata-only, truncated, or extraction-empty; exclude page chrome and non-NFL material. | Zero unresolved pick-oriented records, with source URL and review disposition retained. | human review | NOT STARTED |
| T01 | P0 | Team identity | Make source/feed team the primary team on team-specific feeds; store other mentioned teams as related entities only. | Zero primary-team/source-prefix mismatches in regenerated camp and availability artifacts. | code | COMPLETE — regenerated artifacts pass |
| T02 | P0 | Alias safety | Prevent short aliases such as `NO` and `WAS` from matching ordinary prose; add NYG/NYJ and LAC/LAR disambiguation fixtures. | Team-normalization fixture suite passes with zero known collision cases. | code | COMPLETE — fixtures pass |
| T03 | P1 | Aggregation | Deduplicate repeated article/feed records before team-level counts and strength summaries. | Aggregate counts equal unique evidence IDs, not duplicated cross-team rows. | code | COMPLETE — regenerated artifacts pass |
| V01 | P0 | Availability | Reconcile structured status against source text and label contradictions as conflicted intel. | Zero unflagged `Active`/IR/PUP contradictions; every conflict has a source and human-review flag. | code + human review | COMPLETE — validator and rebuilt artifacts pass |
| V02 | P0 | Depth charts | Confirm Bills McGovern and Packers Micah Parsons/team-status items; replace estimated-only starter claims where manual evidence exists. | Named confirmations recorded; estimated starters remain explicitly estimated elsewhere. | human review | WITHHELD — required cases recorded; confirmation not established |
| P01 | P0 | Prediction markets | Fix NYG/NYJ and LAC/LAR mapping, enforce 2026 season scope, and classify contract taxonomy before team mapping. | Zero known city/team collisions and zero wrong-season contracts in fixtures. | code | COMPLETE — fixtures and rebuilt map pass |
| P02 | P0 | Coherence | Exclude liquidity-warned/ineligible contracts from actionable coherence math and preserve fee/liquidity/settlement caveats. | Coherence reports eligible-context counts separately; July 31, 77%-warned map cannot pass as an execution source. | code | COMPLETE — eligibility and execution-source gates pass |
| Y01 | P0 | YouTube | Put review, freshness, queue, and agent summary on one cohort fingerprint. | All artifacts report the same 43-item cohort and fingerprint. | code | COMPLETE — cohort fingerprint passes |
| Y02 | P0 | YouTube exclusions | Hard-exclude both stale Drake Maye rows from `youtube-b9NL40Zogkw` and all evidence from `youtube-qoCm4G2Jmng`. | Forbidden episode IDs are absent from synthesis inputs and tested. | code | COMPLETE — accepted and synthesis inputs gated |
| O01 | P0 | Odds execution | Revalidate BKR, BetUS, and BetOnline prices at synthesis time and preserve exact venue/timestamp provenance. | Every actionable row has a current placeable venue; unavailable books are context-only. | local data + human check | NOT STARTED |
| O02 | P0 | Exacta | Require exact two-team rows and multiple-book confirmation; keep simulation-price-only rows out of execution claims. | Bills–Packers exacta remains monitor-only until every explicit guardrail passes. | code + human check | NOT STARTED |
| G01 | P0 | Audit gate | Make source audit block on incomplete article corpus, unresolved identity contamination, stale/mismatched YouTube cohorts, or invalid prediction mapping. | A legacy/contaminated artifact produces `blocked`, not `passable`. | code | PARTIAL — article, team-identity, availability, and named-status blockers implemented |
| G02 | P1 | Rebuild | Rebuild all dependent artifacts deterministically after upstream fixes, in dependency order. | Each artifact names its inputs, generated time, schema version, and validation results. | code | PARTIAL — camp, availability, projected-starters, and impact-digest rebuild complete |
| G03 | P0 | Final verification | Run focused fixtures, full tests, lint, build, source audit, and synthesis-context validation without model or DB writes. | All commands pass; GitHub, local, and M6 resolve to the same verified commit. | code | NOT STARTED |

## Dependency Order

1. Article corpus/body/extraction contract (`A01`–`A04`).
2. Team identity and deduplication (`T01`–`T03`).
3. Availability and depth-chart resolution (`V01`–`V02`).
4. Prediction-market mapping and eligible coherence (`P01`–`P02`).
5. YouTube cohort fingerprint and hard exclusions (`Y01`–`Y02`).
6. Odds/exacta execution validation (`O01`–`O02`).
7. Blocking audit, deterministic rebuild, and final verification (`G01`–`G03`).

Downstream artifacts must be rebuilt after, not before, their upstream lane passes.

## T01-T03 Completion Evidence

The team-identity tranche was completed offline on August 11 without network fetches, model calls, Supabase writes, recommendation persistence, or portfolio changes.

- The shared `team_identity_validation_v1` contract makes a team-specific feed/source prefix authoritative. Opponents and other mentioned teams are retained in `related_teams`; they no longer receive duplicate primary aggregate rows.
- Short abbreviations are inferred from prose only when their original uppercase form is present. Ordinary `no` and `was` text no longer maps to the Saints or Commanders. City-only `New York` and `Los Angeles` text maps to neither team; explicit NYG/NYJ and LAC/LAR names/codes are disambiguated in fixtures.
- `data/training-camp/2026/latest.json` normalized from 322 rows to 198 unique evidence IDs. It now reports zero duplicate evidence rows, zero primary/source-prefix mismatches, 87 corrected legacy source assignments, and 129 related-team references.
- `data/player-availability/latest.json` normalized from 850 rows to 822 unique evidence IDs. It now reports zero duplicate evidence rows, zero primary/source-prefix mismatches, 23 corrected legacy source assignments, and 89 related-team references.
- Honest camp coverage fell from 31 teams to 25 after false cross-team assignments were removed. This is a coverage gap, not a regression to conceal; the missing teams need real team-specific or manually reviewed evidence in a later collection pass.
- The local source audit accepts both identity validations. The overall frontier gate remains blocked by the unreconstructed article corpus; the availability contradiction gate now passes, while the two named cases remain explicitly withheld rather than confirmed.

## V01-V02 Completion Evidence

The availability/depth-chart tranche was completed offline on August 11 without network fetches, model calls, Supabase writes, recommendation persistence, or portfolio changes.

- `availability_evidence_validation_v1` now compares structured status with player-anchored source text, blocks any unflagged contradiction, and requires every detected conflict to carry source evidence, a human-review flag, and `synthesis_eligible: false`.
- The parser no longer mistakes “removed from PUP” for “placed on PUP,” handles “activated [player] off PUP/NFI” as return language, and prevents a replacement player from inheriting another named player's IR/PUP phrase. The rebuilt 822-event availability snapshot has 784 synthesis-eligible rows, 37 conflicted-intel rows, one needs-confirmation row, and zero unflagged status contradictions.
- Thirty-six player-anchored status/classification conflicts remain visible for review but are excluded from team trend, unit-cluster, projected-starter, and impact-digest aggregates: 28 worsening labels against return/participation text, seven restrictive structured statuses against return text, and one open status against explicit IR-placement text. The 37th conflicted row is the separately gated Micah Parsons team-assignment case.
- `data/projected-starters/2026/named-status-review.json` records both required named dispositions. Connor McGovern is withheld pending a current health update and human-verified Bills role/depth-chart source. Micah Parsons is conflicted intel because local evidence carried DAL and GB team ownership signals; current team, PUP/injury, return-timeline, and role confirmation are still missing.
- Neither named case is represented as confirmed. Both have `human_verified: false` and `eligible_for_synthesis: false`; the named-review validator passes because the hard gate permits an explicit withheld disposition rather than a manufactured confirmation.
- The projected-starters rebuild contains 223 estimated rows, zero manual rows, and all 32 teams needing manual depth-chart coverage. The impact digest contains 632 review rows: 594 synthesis-eligible, 37 conflicted, one needs confirmation, and zero residual classification-review rows.
- The rebuild also fixed an idempotency bug in the prior team-identity contract: an explicit primary team now stays ahead of already-normalized related teams on subsequent passes. Compared with the committed 822-row baseline, the final availability rebuild has zero player-event classification changes and zero primary-team changes; only review/eligibility metadata and aggregate results changed.
- `V02` therefore closes the contamination path but not the real-world information gap. A later human/source review can promote a named case only with current source evidence; until then both remain withheld.

## P01-P02 Completion Evidence

The prediction-market mapping/coherence tranche was completed offline on August 11 without network fetches, model calls, Supabase writes, recommendation persistence, official-pick actions, or portfolio changes.

- `prediction_market_team_map_v2` classifies supported NFL team-futures taxonomy and verifies the 2026 season before attempting team identity. Player/transaction, award, seed, division-order, multi-season, headline, and unsupported contracts cannot leak into team-futures mapping.
- Ticker abbreviations and explicit team names now resolve NYG versus NYJ and LAC versus LAR without using shared city text as a team identity. The focused fixture and full local snapshot both report zero Jets-as-Giants, Giants-as-Jets, Rams-as-Chargers, or Chargers-as-Rams collisions.
- The rebuilt 1,993-contract map contains 596 mapped/eligible-context contracts and 1,397 excluded contracts. It records 78 wrong-season contracts, 476 unknown-season contracts, and zero wrong-season mapped rows rather than defaulting undated or future-season contracts into 2026.
- The July 31 source's 1,542 liquidity warnings (77.37%) remain explicit. Of the 596 eligible-context contracts, 255 are eligible for actionable coherence math and 341 are context-only because of liquidity warnings; execution eligibility remains zero because settlement terms are not present in the local snapshot.
- `prediction_market_cross_market_coherence_v2` consumes only rows explicitly marked actionable for coherence math. It reports eligible-context, actionable, context-only, excluded, warned, fee-missing, team, and execution-eligible counts separately; legacy maps without the explicit v2 eligibility contract produce no actionable math.
- The rebuilt actionable-coherence output covers all 32 teams and currently reports zero ladder inversions and zero nesting violations. This means the prior 20 inversions and one nesting violation do not survive the season/taxonomy/liquidity gates; it is not a claim that warned context prices are coherent or executable.
- Fee-adjusted net odds remain in the map, while coherence uses gross yes-price probabilities and preserves explicit fee, liquidity, and settlement caveats. Both artifacts are labeled consensus context only and blocked as execution sources.

## Y01-Y02 Completion Evidence

The YouTube cohort/exclusion tranche was completed offline on August 11 without network fetches, model/API calls, Supabase writes, recommendation persistence, official-pick actions, or portfolio changes.

- `youtube_reviewed_local_intel_cohort_v1` now gives the review status ledger, local intel queue, agent summary, freshness reconciliation, and local synthesis-context supplement a shared accepted-cohort contract. The accepted cohort is 43 items with fingerprint `2b416c20772bcc2d6be95ecaed72aac0437cdf957ac6cd3921ae22fa673bdfdc`.
- Accepted YouTube local intel is filtered through a single forbidden-episode gate before export and before agent-summary construction. A stale status row cannot promote evidence from `youtube-b9NL40Zogkw` or `youtube-qoCm4G2Jmng` into accepted local intel.
- The review report still records `youtube-b9NL40Zogkw` and `youtube-qoCm4G2Jmng` as reprocess-required audit rows, but extracted review picks/notes, the status ledger, accepted queue, agent summary, and local synthesis-context supplement do not carry their evidence forward.
- The local synthesis-context builder verifies that the queue, summary, and freshness fingerprints match before writing. Its regenerated 2026-08-11 context contains the 43-item accepted cohort and no forbidden episode IDs.
- Focused fixtures now cover the stale Drake Maye/forbidden-episode exclusion path, cohort fingerprint propagation, and synthesis-context leak check.

## Hard Frontier Re-entry Gates

The next frontier synthesis is allowed only when all of these are true:

- **Repository parity:** local `main`, `origin/main`, and the M6 checkout point to the same verified commit. Any remaining dirty M6 operational artifacts are enumerated and non-overlapping.
- **Article corpus:** the complete requested date window was paged; body-evidence buckets are explicit; zero pick-oriented records remain unresolved; multi-pick fixtures pass; strict `actual_picks` contain a usable market, price, and venue.
- **Identity:** zero known source-prefix/team mismatches, short-alias collisions, NYG/NYJ collisions, or LAC/LAR collisions survive validation.
- **Availability:** contradictions are labeled conflicted; Bills McGovern and Packers Micah Parsons/team-status claims are confirmed or withheld; projected starters remain estimated unless sourced manually.
- **Prediction context:** season and taxonomy filters pass; liquidity-warned rows are context-only; coherence calculations disclose eligible denominators and do not imply executability.
- **YouTube/podcast:** every downstream artifact shares the reviewed 43-item cohort fingerprint; both prohibited episode groups are absent.
- **Odds:** BKR, BetUS, and BetOnline timestamps and placeable prices are rechecked; no unavailable-book price is presented as executable; exacta guardrails remain enforced.
- **Portfolio constraints:** July 30 distribution/coherence rules, discrete research sizes, Bills/Packers caps, correlation limits, and the $200–$250 reserve remain encoded and validated.
- **Audit and tests:** the source audit is not blocked; focused regression fixtures, the full unit suite, lint, build, and local synthesis-context validation all pass.
- **Human boundary:** no research candidate is promoted to an approved bet. The frontier run remains decision support and requires separate human approval for any later action.

## Rebuild Order After Fixes

1. article review;
2. training-camp identity-normalized artifact;
3. availability, projected starters, and impact digest;
4. prediction-market map and coherence;
5. YouTube queue/review/freshness/agent summary;
6. source audit;
7. local frontier-synthesis context;
8. final no-model validation report;
9. only then, a separately authorized frontier futures synthesis.

## Decisive Baseline Files

- `data/research-intel/review/article-intel-review-latest.json`
- `scripts/build-article-intel-review.js`
- `scripts/build-intel-source-audit-report.js`
- `data/training-camp/2026/latest.json`
- `data/player-availability/latest.json`
- `data/player-availability/impact-digest-latest.json`
- `data/projected-starters/2026/latest.json`
- `data/prediction-markets/team-market-map-latest.json`
- `data/prediction-markets/cross-market-coherence-latest.json`
- `data/shadow-harness/review/youtube-futures-agent-intel-summary.json`
- `data/shadow-harness/review/podcast-youtube-freshness-latest.json`
- `data/futures-imports/bookmaker-2026-08-10.json`
- `data/futures-imports/betus-2026-08-10.json`
- `data/futures-imports/betonline-2026-08-10.json`
- `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`
- `docs/spec-win-dist-and-coherence-sim.md`
