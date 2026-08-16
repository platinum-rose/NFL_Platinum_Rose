# NFL Futures Portfolio Synthesis Incident Review and Independent Claude Audit Brief

**Date:** August 13, 2026  
**Repository:** `E:\dev\projects\NFL_Dashboard`  
**Status:** Forensic review and planning only  
**Authority:** No bets, official picks, portfolio mutations, paid API calls, persistence, commits, or pushes are authorized.

## Purpose

This document briefs the Claude development and analysis team on the first maximum-effort NFL futures portfolio synthesis attempt.

Claude is being asked to perform an independent assessment of:

1. What actually ran.
2. Which evidence was contaminated, incomplete, stale, or non-actionable.
3. Whether the original abstention was correct.
4. Whether the August 12 cleanup adequately repaired the known failure modes.
5. Which truth gaps must be closed before a combined Codex-Claude synthesis.
6. How the next evidence-acquisition and portfolio-analysis system should be designed.

Do not accept the Codex findings below as ground truth merely because they are documented here. Reproduce material counts and conclusions from repository artifacts wherever possible, identify disagreements, and explain the evidence supporting each disagreement.

---

# 1. Authoritative portfolio facts

The following facts were clarified directly by the project owner after the first forensic review.

## Current positions

- No NFL futures have been placed.
- The previously discussed $100 Bills-Packers exact Super Bowl matchup at +6500 is not an existing ticket.
- It is a proposed "dream ticket" around which the portfolio may be designed.
- Six Bookmaker parlays remain nominally open.
- Those parlays are beyond their stated expiration date and may be forfeited at Bookmaker's discretion.
- Therefore, they must contribute zero guaranteed value, zero available bankroll, and zero dependable hedge capacity.
- They may appear only in a separate contingent scenario showing what happens if Bookmaker honors them.

## Capital

- Target portfolio liability: **$500**.
- The $500 is presently uncommitted because no futures have been placed.
- The owner may authorize spending beyond $500 if unusually strong actionable intelligence and hedge structures justify pressing the position.
- No model may autonomously exceed $500.
- Any amount beyond $500 must appear as an unallocated "press proposal" requiring explicit human approval.

## Mandatory anchors

- Buffalo and Green Bay are the intended portfolio anchors.
- A surviving portfolio should normally contain separate Bills and Packers positions.
- The Bills-Packers exacta does not by itself satisfy both anchor requirements.
- The exacta is the dream outcome, while the broader objective is to profit from separate deep playoff runs by Buffalo in the AFC and Green Bay in the NFC.
- A model may challenge the chosen anchors only through a well-formulated rebuttal demonstrating superior:
  - Verified evidence.
  - Price-adjusted probability.
  - Portfolio resilience.
  - Deep-playoff payoff structure.
- A small conviction stake is permissible when an anchor thesis remains attractive but the available price does not clear the full model edge threshold.
- The preferred default in that situation is still reserve/watch status rather than forcing a full anchor allocation.

## Execution venues

Currently usable venues are:

- Bookmaker/BKR.
- BetUS.
- BetOnline.
- BetMGM through a proxy.
- Caesars/William Hill through a proxy.
- Circa through a proxy.
- Kalshi.
- Polymarket.

Kalshi and Polymarket are execution candidates when their net executable price is better than an equivalent sportsbook market.

"Better" must account for:

- Bid and ask rather than a headline probability.
- Available fill size.
- Fees.
- Settlement language.
- Contract expiration.
- Market equivalence.
- Material funding or withdrawal friction.

## Data access

- Live web research is authorized for the future intelligence-recovery phase.
- The owner has paid access to:
  - FantasyPros.
  - Action Network.
- Other intelligence sources use free or unpaid subscription access.
- Access must remain within the owner's authorized accounts and lawful source boundaries.
- Missing paywalled text must not be inferred or fabricated.

## Frontier-model route

- The next validation run should use Codex and Claude subscription tasks.
- Paid model APIs are not authorized at this stage.
- The subscription workflow must be validated before API spending is considered.

## Desired output

The next completed synthesis should produce:

> **Price-verified proposals awaiting human approval.**

It should not place bets, mark official picks, or write recommendations into production systems without separate authorization.

## Timing

No execution date has been selected.

The final synthesis will run only after the intelligence-gathering and synthesis systems have been strengthened. The project owner will decide when the evidence is ready.

---

# 2. What the first attempt actually was

The first attempt had two separate layers that must not be conflated.

## 2.1 Prepared automated synthesis

A personalized maximum-effort prompt and portfolio dossier were prepared for the project's automated synthesis runner.

Artifacts included:

- `.nfl/portfolio/dossier-2026-08-11.json`
- `.nfl/portfolio/prompt-preview-2026-08-11.json`
- `.nfl/portfolio/prompt-preview-sol-2026-08-11.json`
- `.nfl/portfolio/prompt-preview-sol-max-2026-08-11.json`

The final Sol-max prompt preview was approximately 103,876 input tokens.

The preview artifacts explicitly recorded that no model calls occurred.

The automated three-stage committee was not executed. Therefore there was no:

- Paid Responses API call.
- Claude committee call.
- Persisted HTML/Markdown portfolio.
- Official-pick mutation.
- Supabase write.
- Betting action.
- Completed automated committee result.

## 2.2 Local maximum-effort Codex analysis

A separate local GPT-5.6 Sol task was started at maximum reasoning effort.

It was explicitly prohibited from:

- Using network research.
- Calling model APIs.
- Running `agents/portfolio-synthesize.js`.
- Writing reports.
- Mutating portfolio state.
- Persisting recommendations.
- Placing bets.

That task did return a single-model, research-only analysis in its task response.

Its overall conclusion was:

> **MONITOR-ONLY RESEARCH - ACTIONABLE NOW: NONE.**

This was not the intended Codex-Claude committee and did not generate a validated portfolio artifact. It was a one-model local assessment of the August 11 packet.

The research response then became the trigger for the August 12 evidence-cleanup work.

---

# 3. What the August 11 dossier contained

The August 11 dossier contained 6,559 price snapshots:

- 5,760 database snapshots.
- 799 local sportsbook overlays dated August 10.

The local overlays consisted of:

- Bookmaker/BKR: 256.
- BetUS: 416.
- BetOnline: 127.

Market coverage included:

- 32 Super Bowl rows.
- 32 playoff rows.
- 32 win-total rows.
- 256 exact Super Bowl matchup rows.
- 128 exact division-position rows.
- 32 most-wins rows.
- 32 least-wins rows.
- 32 No. 1 seed rows.
- Conference and division winner rows.

The problem was not insufficient prompt size. The packet was extremely large. The problem was that a substantial portion was:

- Truncated.
- Duplicated.
- Assigned to the wrong entity.
- Stale.
- Single-book only.
- Missing original quotations.
- Missing speaker identity.
- Missing settlement terms.
- Market-derived rather than independently predictive.
- Not eligible for an execution claim.

A frontier model receiving more than 100,000 tokens of mixed-quality data must spend considerable reasoning effort determining what cannot be trusted. Worse, it may create a coherent narrative from individually plausible but incorrectly joined facts.

---

# 4. Detailed evidence failures

## 4.1 Article corpus and pick extraction

### Attempt state

The prompt reported:

- 101 articles reviewed.
- 70 articles with a body.
- One actual pick.
- 59 market leads.
- 299 analysis notes.

This presentation overstated both completeness and actionability.

The 101 records consisted effectively of:

- A default 100-row database retrieval cap.
- One local note.

They did not represent the complete requested article window.

Of those records:

- 31 had no stored article body.
- 45 appeared to end near a known approximately 4,000-character ingestion cap.
- Only about 25 had a nonempty body clearly shorter than that cap.

### Malformed "actual pick"

The sole extracted actual pick was nominally:

- Tyler Shough under 3,449.5 passing yards at +100.

Its structured representation contained:

- `selection: "NO"`
- `book: null`
- `inference_only`

`NO` was the New Orleans abbreviation, not the player selection.

The source also contained more than one player selection, including Fernando Mendoza, but the extractor flattened or lost the multi-pick structure.

This was not a clean executable pick. It was a malformed extraction from an incomplete corpus.

### Risk introduced

The synthesis could have:

- Assigned a player prop to the Saints team entity.
- Treated an inferred selection as an explicit recommendation.
- Assumed missing book provenance existed.
- Collapsed multiple selections into one.
- Counted 299 contextual notes as 299 independent signals.
- Believed the 101 rows represented the complete research window.

### Cleanup result

The August 12 article rebuild produced:

- 292 deduplicated records.
- 291 database records plus one local note.
- Complete requested date window.
- 31 metadata-only records.
- 181 suspected ingestion-cap truncations.
- 80 records with usable bodies.
- 16 pick-oriented records.
- 19 auditable manual dispositions.
- 10 explicit selection mentions.
- Nine unique selections.
- Zero unresolved pick-oriented records.
- Zero execution-usable actual picks.
- Ten selections retained outside `actual_picks` pending venue and price verification.

The repaired lane is more honest, but the source-recovery problem remains.

### Required next action

Reacquire the original body for all affected records:

- 31 metadata-only.
- 181 suspected truncated.
- Up to 212 records total, subject to overlap already represented by the artifact classification.

For every recovered source:

- Preserve original URL.
- Preserve author.
- Preserve publication timestamp.
- Record retrieval timestamp.
- Hash the full body.
- Retain the previous truncated version for comparison.
- Split every distinct recommendation into a separate record.
- Attach an exact supporting excerpt.
- Separate historical quoted price from current executable price.
- Mark inaccessible text as unavailable rather than reconstructing it.

## 4.2 Team identity and duplicate evidence

### Training-camp lane

The original camp lane had 322 records and contained both duplicate and incorrectly assigned evidence.

Examples included:

- A Raiders depth-chart story about Fernando Mendoza appearing under New Orleans.
- A Bengals-Lions game preview appearing in multiple team contexts.
- Opponent mentions becoming primary-team assignments.
- Short aliases such as `NO` and `WAS` matching prose.
- Shared-city ambiguity between:
  - Giants and Jets.
  - Rams and Chargers.
- Identical URLs attached to multiple primary teams.

The local analysis found:

- 116 camp items whose source-prefix team differed from the assigned team.
- 96 URLs appearing under multiple teams.

### Risk introduced

This failure could:

- Transfer one team's roster improvement to another.
- Attribute an injury to the opponent.
- Transform duplicated evidence into apparent source consensus.
- Contaminate team-specific strength and availability summaries.
- Give models multiple "confirmations" that originated from one story.

### Cleanup result

Training-camp evidence changed from:

- 322 rows to 198 unique rows.
- 124 duplicates removed.
- 87 source-team assignments corrected.
- 129 related-team references preserved separately.
- Zero remaining primary/source mismatches.
- Zero remaining duplicates under the repaired identity contract.

Honest camp coverage fell from 31 teams to 25, exposing seven teams without genuine team-specific camp coverage.

The availability lane changed from:

- 850 rows to 822 unique rows.
- 28 duplicates removed.
- 23 primary assignments corrected.
- 89 related-team references preserved.
- Zero remaining identity mismatches or duplicates under the repaired contract.

### Remaining gap

The cleanup repaired ownership but revealed real missing coverage.

Seven teams still require genuine team-specific camp intelligence if they become relevant to the portfolio.

## 4.3 Availability and named-player status

### Attempt state

The original availability system had:

- 850 events.
- 659 digest events.
- 216 starter matches.
- Only 47 likely starter or primary-player events.

Structured status sometimes contradicted supporting text.

Failure patterns included:

- "Removed from PUP" treated as placed on PUP.
- "Activated from PUP/NFI" retaining a restrictive classification.
- Return or participation text assigned a worsening status.
- Replacement players inheriting another player's status.
- Team ownership inferred inconsistently.

Important unresolved cases included:

- Connor McGovern.
- Micah Parsons.

### Risk introduced

Availability evidence influences:

- Win projections.
- Quarterback efficiency.
- Offensive-line continuity.
- Defensive-front strength.
- Division and conference paths.
- Exacta correlation.
- Entry timing.

A reversed PUP or activation status can invert the direction of the thesis.

### Cleanup result

The repaired availability lane contains:

- 822 events.
- 784 synthesis-eligible.
- 37 conflicted.
- One requiring confirmation.

The 37 conflicts include:

- 36 text/status contradictions:
  - 28 worsening labels against return or participation language.
  - Seven restrictive statuses against return language.
  - One open status conflicting with IR placement.
- One additional Micah Parsons team-ownership conflict.

The impact digest contains:

- 632 rows.
- 594 eligible.
- 37 conflicts.
- One needs-confirmation row.

Connor McGovern remains withheld pending:

- Current health confirmation.
- Bills role confirmation.
- Current depth-chart evidence.

Micah Parsons remains withheld pending:

- Resolution of Dallas/Green Bay ownership signals.
- Current team verification.
- PUP/injury status.
- Return expectation.
- Expected role.

### Remaining gap

The cleanup quarantined false certainty; it did not establish the missing truth.

These named cases must be resolved from current, timestamped evidence or excluded from candidate reasoning.

## 4.4 Projected starters and depth charts

### Attempt state

The attempted packet contained approximately:

- 224 estimated starter signals.
- Zero manually verified starter signals.
- All 32 teams requiring confirmation.

After cleanup:

- 223 estimated signals.
- Zero manually verified.
- All 32 teams still lacking manual depth-chart coverage.

### Correct interpretation

These signals can generate research questions. They cannot be treated as verified regular-season starters.

This is particularly important during preseason because:

- Current depth charts may be procedural.
- Competitions remain unresolved.
- Roster cuts have not finished.
- Injured players may return.
- Teams may obscure expected roles.
- Week 1 usage can differ from published depth charts.

### Required next design

Use candidate-first depth-chart verification.

Every candidate team should include:

- Current listed starter.
- Source and timestamp.
- Competition status.
- Expected Week 1 starter.
- Confidence in that expectation.
- Known injury/PUP/NFI constraints.
- Roster-cut vulnerability.
- Alternative scenarios.
- Next required recheck date.

A current preseason depth chart must be treated as a dated observation, not gospel truth for the regular season.

## 4.5 Prediction markets

### Attempt state

The original July 31 prediction-market snapshot contained:

- 1,993 contracts.
- 745 mapped.
- 1,248 unmapped.
- 1,542 liquidity warnings, or 77.37%.
- 15 of 32 teams described as incoherent.
- 20 ladder inversions.
- One nesting violation.

Mapping failures included:

- Giants/Jets collisions.
- Rams/Chargers collisions.
- Wrong-season contracts.
- Unknown-season contracts.
- Unsupported taxonomies mapped as NFL team futures.
- Team mapping occurring before taxonomy and season validation.
- Missing settlement terms.
- Missing execution eligibility.

### Risk introduced

The system could mistake mapping errors for:

- Arbitrage.
- Cross-market incoherence.
- Mispriced ladders.
- Team-specific market disagreement.

A prediction-market discrepancy has no execution meaning unless the contracts match in:

- Team.
- Season.
- Settlement outcome.
- Expiration.
- Liquidity.
- Fees.
- Executable price.

### Cleanup result

The repaired v2 map reports:

- 596 context-eligible rows.
- 1,397 excluded rows.
- 78 wrong-season contracts.
- 476 unknown-season contracts.
- Zero wrong-season rows entering the eligible map.
- 255 actionable for coherence calculations.
- 341 context-only due to liquidity warnings.
- Zero Giants/Jets or Rams/Chargers collisions.
- Zero eligible actionable inversions.
- Zero eligible actionable nesting violations.
- Zero execution-eligible rows.

The disappearance of the old inversions does not prove the market is executable or perfectly coherent. It proves the old findings were driven substantially by invalid inputs.

### Required next action

Kalshi and Polymarket can become execution candidates, but new acquisition must capture:

- Current bid.
- Current ask.
- Fillable size.
- Volume.
- Fees.
- Settlement terms.
- Expiration.
- Contract identifier.
- Retrieval timestamp.
- Equivalent sportsbook outcome.
- Net price comparison.
- Execution access confirmation.

Until these are populated, prediction markets remain context-only.

## 4.6 YouTube and podcast evidence

### Attempt state

The review ecosystem contained:

- 16 candidate episodes.
- 14 usable episodes.
- Two requiring reprocessing.
- 87 extracted picks.
- 65 analysis notes.
- 152 review-ledger items:
  - 43 promoted.
  - Nine rejected.
  - 65 pending.
  - 17 needing review.
  - 18 context-only.

The 43 accepted items did not initially share a common downstream cohort fingerprint.

Two forbidden or reprocess-required episodes could leak through stale state:

- `youtube-b9NL40Zogkw`
- `youtube-qoCm4G2Jmng`

Among the 43 items accepted into the attempted prompt:

- 38 had `price_not_in_quote`.
- 34 had no supporting quotation.
- Four had an unknown or unclear side.
- Three were missing price.
- Six had duplicate-candidate flags.

These categories overlap.

### Risk introduced

A promoted thesis could be incorrectly interpreted as:

- A price-verified recommendation.
- A direct quote.
- A named analyst's opinion.
- A current price.
- Multiple independent opinions.

### Cleanup result

The repaired accepted cohort has:

- 43 items.
- One shared fingerprint:
  - `2b416c20772bcc2d6be95ecaed72aac0437cdf957ac6cd3921ae22fa673bdfdc`
- Consistent membership across:
  - Review status.
  - Queue.
  - Summary.
  - Freshness reconciliation.
  - Synthesis context.
- Zero forbidden accepted items.
- Forbidden episodes retained only as visible reprocess-required audit records.

### Remaining gap

Human-promoted thesis evidence is not automatically price evidence.

Every material podcast claim should carry:

- Actual speaker.
- Episode.
- Publication time.
- Transcript timestamp.
- Exact quotation.
- Selection.
- Side.
- Whether a price was explicitly spoken.
- Whether that price remains current.
- Human review disposition.
- Duplicate/source-family key.

## 4.7 Stale GPT-4o normalized-signal sidecar

The August 11 dossier used:

- `.nfl/portfolio/normalized-signals-gpt-4o.json`

The file was generated July 16 and contained:

- 112 normalized signals.
- Approximately 30 apparent experts.
- Approximately 34 team/market combinations.

The records lacked:

- Current accepted-cohort fingerprint.
- Human review disposition.
- Source timestamp.
- Exact quotation verification.
- Price provenance.
- Venue.
- Conflict state.
- Eligibility state.
- Evidence hash.

Several `author` values were episode or show titles rather than people.

Observed examples included:

- "Even Money."
- "Sharp or Square."
- Mixed-topic episode titles covering the Kentucky Derby, Stanley Cup, NFL Draft, or schedule release.

Substantive concerns included:

- Patriots regression reasoning assigned to a Seahawks signal.
- A Miami/Malik Willis roster assertion requiring current verification.
- Game picks used as adjacent futures evidence.
- Episode titles counted as expert identities.
- Mixed-topic material contributing to futures lean counts.

### Required disposition

This file must not enter the next dossier.

It must either be:

- Explicitly excluded, or
- Rebuilt from the cleaned accepted evidence cohort.

A replacement normalized-signal record should include:

- True speaker or author.
- Original source.
- Source timestamp.
- Exact supporting excerpt.
- Team and market identity.
- Thesis versus explicit selection classification.
- Historical price versus current price separation.
- Human review state.
- Conflict state.
- Synthesis eligibility.
- Execution eligibility.
- Source-family and duplicate keys.

## 4.8 Sportsbook prices and execution eligibility

### Attempt state

Local August 10 overlays were:

- Bookmaker/BKR: 256.
- BetUS: 416.
- BetOnline: 127.
- Total: 799.

The dossier also used database context from BetMGM, DraftKings, and FanDuel.

Material quality problems included:

- Ten Super Bowl rows choosing BetMGM as "best."
- Five stale playoff rows.
- Fourteen stale most-wins rows.
- Seven stale least-wins rows.
- 128 stale exact division-position rows.
- 256 single-book exactas.
- 128 single-book exact division-position rows.
- 32 single-book No. 1 seed rows.

The stale and single-book categories overlap and should not be summed as distinct records.

### Bills-Packers exacta

The dossier contained:

- Bills-Packers exact Super Bowl matchup.
- BetUS at +6500.
- One observed book.
- Internal diagnostic fair probability around 1.08%, approximately +9159.

That diagnostic estimate was not an independent source of truth. It arose from the same market-anchored modeling environment.

The repaired validator correctly marks the exacta:

- Monitor-only.
- `execution_claim_allowed: false`.

### Cleanup result

The execution validator now requires:

- 2026 season.
- Current local snapshot date.
- Numeric price.
- Placeable venue.
- Exact two-team syntax.
- More than one placeable book for an exacta execution claim.
- No execution authority from simulation-only rows.

For the August 10 imports:

- 799 rows checked.
- 543 execution-reference eligible.
- 256 exacta rows monitor-only.
- Zero exacta pairs execution-claim eligible.

### Venue-policy inconsistency

The synthesis runner's placeable list includes:

- Bookmaker.
- BetOnline.
- BetUS.
- Circa.
- BetMGM.
- Caesars/William Hill.

The repaired execution validator currently accepts only:

- Bookmaker/BKR.
- BetUS.
- BetOnline.

Kalshi and Polymarket are now also authorized venues under the project owner's clarified rules.

The next design must provide one canonical execution-venue registry consumed by:

- Dossier builder.
- Price selector.
- Execution validator.
- Synthesis prompt.
- Final approval report.

DraftKings and FanDuel may appear as market context but are not currently placeable venues.

## 4.9 Probability estimates and simulations

This was the main analytical weakness.

### Model fair probability

The synthesis schema asks the language model to provide:

- `model_fair_prob`
- `edge_pct`
- confidence
- thesis
- disconfirming factor

Code recomputes the expected-value arithmetic from the model's probability and the observed price.

That verifies the arithmetic. It does not validate the probability.

### Market-derived probability

The dossier's de-vigged fair probabilities are derived from sportsbook consensus. They are useful market priors, not independent football forecasts.

### Simulation architecture

The current schedule simulation is internally coherent, but it is substantially market-anchored:

- Win-distribution means originate from market win totals.
- Team ratings are solved to reproduce those means through the schedule.
- Global home-field and scale parameters are calibrated against de-vigged division prices.
- Simulation probabilities are compared against other book probabilities.

This is useful for:

- Cross-market coherence.
- Schedule consistency.
- Joint outcomes.
- Correlation.
- Detecting one market that differs from related markets.

It is not fully independent alpha.

### Required separation

The next system should explicitly maintain three probability layers:

1. **Market prior**
   - De-vigged sportsbook and prediction-market consensus.

2. **Independent football projection**
   - Source-grounded team-strength model using verified roster, quarterback, injury, coaching, schedule, and performance evidence.

3. **Posterior scenario distribution**
   - Combines market prior and independent football evidence with explicit uncertainty and scenario weights.

Every proposed edge must state which layer supports it.

Agreement between Codex and Claude is analyst agreement. It is not a second independent data source.

## 4.10 Prompt and committee architecture

### Forced recommendation pressure

The current synthesis prompt says:

- A portfolio containing only favorites has failed the assignment.
- Surface at least 12-20 plays.
- Stopping at a handful means the market was under-mined.

This conflicts with truth-first abstention.

The next prompt must permit:

- Zero plays.
- One play.
- An entirely reserve/watch portfolio.
- Mandatory anchors remaining unbet because the price is poor.

### Current-fact memory leakage

The prompt permits the model to use its own NFL knowledge for current roster, injury, and coaching claims if flagged as `knowledge_based`.

That is insufficiently strict for a 2026 truth-first run.

Models may use general football reasoning, but current factual claims must come from the frozen evidence registry. Model memory may generate a research question; it may not resolve that question.

### Output enforcement

The current runner requests a JSON object but does not enforce a strict field-level JSON Schema.

The next system should validate:

- Required fields.
- Enumerated statuses.
- Probability ranges.
- Evidence IDs.
- Price identifiers.
- Missing-data declarations.
- Unsupported-claim rejection.

### Committee independence

The intended pipeline has:

- Stage 1 analyst models.
- Stage 2 skeptic.
- Stage 3 risk/editor.

By default, the skeptic and risk/editor use the first Stage 1 model unless separately configured.

That is not genuinely independent review.

### Stage 1 merge

When multiple models nominate the same candidate, the current merger:

- Selects the highest-confidence model's full version.
- Averages confidence.
- Preserves other versions as metadata.

It does not:

- Pool probability estimates.
- Preserve disagreement intervals.
- Penalize factual disagreement.
- Identify the cause of disagreement.
- Require reconciliation before portfolio entry.

This should be replaced by an explicit comparison record.

---

# 5. Why the local analysis returned no actionable portfolio

The local maximum-effort result was appropriately conservative.

Its historical research board contained possible price triggers, conflicts, and passes, but it did not have enough verified evidence for allocation.

Historical monitor examples included:

- Bills Super Bowl around +1000, seeking +1300 plus offensive-line confirmation.
- Packers Super Bowl around +2000/+2227, seeking +2750 plus roster confirmation.
- Bills-Packers exacta at +6500, requiring a second placeable market.
- Bengals Super Bowl around +2200, seeking +2600.
- Saints playoffs around +183, seeking +250.
- Chiefs Super Bowl around +1600, seeking +2100 plus quarterback confirmation.
- Chargers Super Bowl around +1800, seeking +2250 plus line confirmation.
- Lions Super Bowl around +2151, seeking +2500 plus line confirmation.

These were August 11 historical research thresholds. They are not current recommendations.

The attempted conditional $500 sketch assumed:

- $100 Bills-Packers exacta.
- $50 conditional queue.
- $250 reserve.
- $100 unassigned buffer.

That structure was invalid as a final portfolio because:

- The exacta was not actually placed.
- It was supported by one sportsbook.
- Direct Bills and Packers positions were absent.
- Existing portfolio state had not been reconciled.
- Several prices were stale or thin.
- Independent probability evidence was inadequate.
- The six expired parlays could not provide dependable hedge value.

---

# 6. August 12 cleanup: what it proves

The repaired synthesis context is:

- `.nfl/portfolio/frontier-synthesis-context-2026-08-12.json`

The verification receipt is:

- `.nfl/verification/futures-evidence-verification-2026-08-12T05-40-00-000Z.json`

The final deterministic verification reported:

- Seven focused files and 47 focused tests passed.
- Full suite: 59 files and 971 tests passed.
- Lint: zero errors and seven existing warnings.
- Production build passed.
- Strict source audit passed.
- Synthesis-context validation passed.
- No network calls.
- No model calls.
- No Supabase writes.
- No official-pick mutations.
- No recommendation persistence.
- No portfolio mutation.

This proves that the repaired system can consistently quarantine known bad evidence.

It does not prove:

- Full factual completeness.
- Current price validity.
- Verified regular-season starters.
- Resolution of named-player cases.
- Complete article bodies.
- Prediction-market executability.
- Calibrated independent probabilities.
- Portfolio readiness.
- Positive expected value.

There is also no post-cleanup portfolio dossier. The newest dossier remains:

- `.nfl/portfolio/dossier-2026-08-11.json`

The August 12 context is an evidence-gated bundle, not a freshly regenerated portfolio dossier.

---

# 7. Proposed unit and portfolio framework

This is a design convention for synthesis, not a recommendation to place these stakes.

## Base unit

Proposed base unit:

> **1 unit = $20**

This produces:

- $500 target liability = 25 units.
- Proposed $100 dream ticket = 5 units.
- Half-unit granularity = $10.

## Stake vocabulary

| Classification | Units | Dollars | Intended use |
|---|---:|---:|---|
| Pass/reserve | 0u | $0 | No qualifying edge |
| Conviction exception | 0.5u | $10 | Small anchor exposure despite weak model edge; explicitly labeled |
| Standard | 1u | $20 | Qualified but ordinary proposal |
| Supported | 1.5u | $30 | Multiple verified mechanisms |
| Strong | 2u | $40 | Positive lower-bound edge with good execution |
| Core | 2.5u | $50 | High-quality portfolio component |
| Initial anchor sleeve | Up to 3u | Up to $60 | Separate Bills or Packers opening exposure |
| Dream exacta proposal | 5u | $100 | Special conviction structure; requires full validation |

The 5u exacta is intentionally outside normal longshot sizing. Claude should independently challenge whether committing 20% of target liability to a +6500 exacta is justified.

The comparison should show at least:

- Owner-conviction view with the proposed 5u exacta.
- Model-risk view using conservative probability and uncertainty caps.
- Price-trigger view showing what odds would justify each stake.

## Preliminary portfolio envelope

A useful initial research envelope is:

| Sleeve | Provisional cap |
|---|---:|
| Bills-Packers dream exacta | 5u / $100 |
| Separate Bills sleeve | 3u / $60 initial |
| Separate Packers sleeve | 3u / $60 initial |
| Diversifying failure-path positions | 6u / $120 |
| Unallocated roster/price reserve | 8u / $160 |
| **Total** | **25u / $500** |

This is an analysis template, not a forced allocation.

If Bills or Packers prices fail the model threshold:

- A 0.5u conviction exception may be proposed.
- The unused anchor allocation returns to reserve.
- The model must not force the full 3u sleeve.

## Exposure accounting

The exacta must be counted carefully:

- Total portfolio liability counts the $100 exacta once.
- Bills-failure exposure counts the full $100 exacta because a Bills failure loses the ticket.
- Packers-failure exposure also counts the full $100 exacta.
- Joint Bills/Packers correlated capital counts it once in aggregate.

Proposed initial caps:

- Maximum ordinary ticket: 3u/$60.
- Maximum separate team sleeve: 5u/$100.
- Maximum dream exacta: 5u/$100.
- Maximum initial Bills/Packers-correlated portfolio liability: 15u/$300.
- Recommended reserve before final roster clarity: at least 5u/$100, preferably 8u/$160.
- Non-anchor speculative ticket: normally no more than 1u/$20.
- Aggregate non-anchor speculative allocation: normally no more than 4u/$80.

## Weighted objective

Proposed default portfolio objective:

- 35% risk-adjusted expected value.
- 25% probability of finishing profitable.
- 25% payoff from Bills and Packers deep-playoff paths.
- 15% diversification and protection against anchor failure.

Execution quality should be a hard gate, not merely another weighted preference.

---

# 8. Required Codex-Claude collaboration protocol

## Step 1: Frozen evidence packet

Create one timestamped, hashed packet containing:

- Accepted evidence claims.
- Conflicts and exclusions.
- Exact source excerpts.
- Current prices.
- Portfolio state.
- Modeling assumptions.
- Missing facts.
- Scenario definitions.

No evidence changes may occur between blind analyses without generating a new packet version.

## Step 2: Blind independent analysis

Codex and Claude independently receive the same packet.

Neither sees the other's output.

Each candidate output should contain:

- Status:
  - Consider.
  - Watch.
  - Pass.
  - Insufficient evidence.
- Market.
- Selection.
- Venue and price ID.
- Market-implied probability.
- Independent probability and uncertainty interval.
- Market-coherence probability, if applicable.
- Football mechanism.
- Evidence claim IDs.
- Disconfirming evidence IDs.
- Missing inputs.
- Price threshold.
- Data-quality confidence.
- Thesis confidence.
- Correlation tags.
- Proposed units.
- Reason for any conviction exception.

Current facts absent from the packet are prohibited.

## Step 3: Deterministic comparison

Code should produce:

- Candidate overlap.
- Probability differences.
- Stake differences.
- Evidence overlap.
- Unsupported claims.
- Missing-field violations.
- Directional conflicts.
- Price-threshold differences.
- Correlation disagreements.
- Cases where apparent agreement comes from the same underlying source.

## Step 4: Adversarial cross-review

After blind outputs are frozen:

- Codex reviews anonymized Claude conclusions.
- Claude reviews anonymized Codex conclusions.
- Initial self-reported confidence should be hidden during the first critique.
- Criticism must cite an evidence ID or be labeled as a reasoning concern.
- New factual claims are not allowed.
- New factual questions return to the acquisition queue.

## Step 5: Deterministic portfolio construction

Code owns:

- Price conversion.
- De-vigging.
- Expected-value arithmetic.
- Uncertainty lower bounds.
- Exposure limits.
- Correlation.
- Scenario payoff tables.
- Exacta and ladder arithmetic.
- Reserve accounting.
- Existing-ticket accounting.
- Worst-case loss.
- Portfolio concentration.

The optimizer must be allowed to choose zero new proposals.

## Step 6: Human approval artifact

The final report should contain:

- Price-verified proposals.
- Watch thresholds.
- Passes.
- Unresolved questions.
- Source ledger.
- Before/after portfolio exposure.
- Scenario payoff matrix.
- Final-price recheck list.
- Explicit statement that nothing is official until human approval.

---

# 9. Requested independent Claude-team deliverables

Please return an independent report addressing:

1. Do repository artifacts support the conclusion that no actionable portfolio existed on August 11?
2. Which Codex contamination findings can be reproduced exactly?
3. Which findings are overstated, understated, or incorrectly classified?
4. Did any historical candidate have enough source and price support to survive as more than monitor/watch?
5. Did the August 12 cleanup adequately prevent the known contamination from re-entering synthesis?
6. Which cleanup gates verify consistency but not factual truth?
7. What additional gates are needed before generating a new dossier?
8. How should the 212 affected article records be reacquired, versioned, hashed, reviewed, and deduplicated?
9. How should authenticated FantasyPros and Action Network data be incorporated without confusing access with verification?
10. How should Kalshi and Polymarket be normalized against sportsbook markets?
11. What independent football probability architecture should supplement the market-anchored simulation?
12. How should preseason depth-chart uncertainty be represented probabilistically?
13. Is 1u = $20 the right scale for a $500 target and proposed $100 exacta?
14. Is the proposed 5u dream-ticket allocation defensible?
15. What alternative Bills/Packers anchor sleeves better monetize separate deep playoff runs?
16. What failure-path hedges can profit when only one anchor succeeds or when both fail?
17. How should model disagreement alter stake size?
18. What evidence should be mandatory before a model can assign a nonzero fair-probability adjustment?
19. How should prompt design remove forced-bet pressure?
20. How should Codex and Claude outputs be compared without treating model agreement as source corroboration?

Please distinguish every conclusion as:

- Verified from current artifact.
- Historical snapshot.
- Estimated.
- Inferred.
- Conflicted.
- Missing.
- Recommended design.

---

# 10. Evidence file map

Start with these repository files:

- `handoffs/2026-08-11-1355-futures-synthesis-prompt-handoff.md`
- `.nfl/portfolio/dossier-2026-08-11.json`
- `.nfl/portfolio/prompt-preview-sol-max-2026-08-11.json`
- `.nfl/portfolio/normalized-signals-gpt-4o.json`
- `docs/FUTURES_EVIDENCE_CLEANUP_ROADMAP_2026-08-11.md`
- `.nfl/portfolio/frontier-synthesis-context-2026-08-12.json`
- `.nfl/verification/futures-evidence-verification-2026-08-12T05-40-00-000Z.json`
- `docs/FUTURES_ANALYST_SYSTEM_INTELLIGENCE_AUDIT_2026-07-22.md`
- `docs/FUTURES_PORTFOLIO_GOAL_CONTEXT_QUESTIONS_2026-08-11.md`
- `agents/portfolio-synthesize.js`
- `agents/portfolio-simulate.js`
- `agents/lib/win-dist.js`
- `scripts/lib/futures-odds-execution.js`
- `data/research-intel/review/article-intel-review-latest.json`
- `data/research-intel/review/article-intel-manual-dispositions.json`
- `data/prediction-markets/team-market-map-latest.json`
- `data/prediction-markets/cross-market-coherence-latest.json`

Also inspect the current Git state before analysis. Preserve all dirty and untracked work. In particular, do not alter the local FantasyPros availability-default changes.

---

# 11. Decision boundaries

This handoff authorizes:

- Read-only repository inspection.
- Independent forensic analysis.
- Architecture recommendations.
- Identification of factual and modeling gaps.
- A proposed article-reacquisition design.

It does not authorize:

- Betting.
- Marking official picks.
- Portfolio mutation.
- Recommendation persistence.
- Supabase writes.
- Paid model API calls.
- Broad web collection before the reacquisition design is approved.
- Repository edits.
- Commit or push.
- Treating the six expired parlays as dependable value.
- Treating the proposed Bills-Packers exacta as an existing ticket.

The immediate goal is not to produce picks. It is to establish what must be true before the next combined Codex-Claude synthesis can deserve confidence.
