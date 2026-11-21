# Public-source picks for Master Intel

Implementation task for review · 2026-11-20

## Outcome

Give readers specific NFL picks to evaluate when Platinum Rose AI passes on a game, market, or slate. The task uses public material already gathered and reviewed for the report. It synthesizes a choice, a reason to favor it, the best reason to pass, and the exact terms that make the choice worth checking. It can recommend a direction without a Platinum model edge or a complete official card.

Use **Public-source picks** as the reader-facing heading. Display **No Platinum Rose endorsement** on each pick and in any copied or standalone view. Label the analyst's original selection separately from the Dashboard's assessment, especially when the Dashboard adds a condition or uses a different threshold.

## Scope and trigger

- First release covers pregame full-game spreads, totals, moneylines, and single player props. Teasers, contest picks, parlays, futures, stakes, and live markets are outside this task.
- Run after reading the official recommendation result. Evaluate uncovered markets even when another market in the same matchup has a Platinum Rose pick. Start with props on the Week 11 Friday replay.
- If an official recommendation already covers the same game, market, and player where applicable, keep the extra source evidence in the research views. Compare by market family as well as exact line so an alternate number cannot duplicate or quietly contradict an official pick.
- If the official run stops on market coverage, price freshness, media coverage, or manual news confirmation, the research task can still evaluate independently supported rows from the saved evidence. Show the relevant official gate reason. Missing schedule or roster evidence blocks the affected rows.
- Run locally against saved inputs at an explicit as-of time. Collection, paid calls, scheduling, execution, and publication are separate work.

## Inputs

| Input | Use |
| --- | --- |
| Reviewed article picks, approved podcast or YouTube digest, reviewed X posts and media | Named source, exact selection, publication or recording time, URL or transcript timestamp, and the reason actually given. Use the reviewed records feeding Props Lab and Experts. |
| Canonical matchup schedule, strict roster vet, availability and starter reports | Confirm event and player identity, kickoff, and the status of material lineup assumptions. |
| Public usage, opponent tendencies, game results, and official team or league news in the saved packet | Test the source's football case against dated evidence. Preserve the measured window, sample, and relevant counterexamples. |
| Saved sportsbook rows and published source quotes | Check the stated threshold and price. Preserve the source and capture timestamps separately. Compare only equivalent markets and display the original quote separately from any verified sportsbook row. |
| Official result and gate details | Identify uncovered markets and explain whether a candidate missed a model hurdle, lacked required input, or encountered other concerns. The official result is read-only. |

## Decision policy

| Requirement | Public-source policy |
| --- | --- |
| Model edge and simulation agreement | Optional. A grounded matchup, role, or usage argument can justify a pick. Display a relevant conflicting model result if available. Leave probabilities, edge estimates, and confidence scores blank unless supported by a documented calculation. |
| Source policy and consensus | A named expert spread, total, moneyline, or prop can support this view even if the official synthesis treats it as context or a flag. One named call plus independent evidence that supports the direction is enough. An original conclusion without a named pick requires at least two independent, directly relevant public observations and a clear reason they support the exact threshold. Price availability alone is not directional evidence. |
| Independent support | Collapse repeat posts, clips, aggregators, and article summaries that trace to the same underlying call. Co-host repetition of a shared pick does not add evidence. A poll, trend list, or odds feed alone does not establish consensus. Stale betting splits remain dated context. |
| Conflict or uncertainty | Present the best opposing case. A material unresolved assumption produces a conditional pick only if a reader can check the condition before kickoff. If credible evidence contradicts the thesis and the available record cannot resolve it or express a testable condition, retain the sources without recommending a side. |
| Market and roster identity | Require a uniquely mapped game, pre-kickoff status, exact market and period, direction, and threshold where applicable. Player picks require a fresh strict roster vet and the correct team. Suppress ruled-out players and unverifiable identities. Preserve explicit availability and role caveats for eligible players. |
| Price and freshness | Use the existing freshness policy for any sportsbook row shown as current. Require underlying provider, exact selection and threshold, exact price, source time, capture time, and a raw-evidence locator. A later scrape cannot refresh an old quote. An analyst's posted price stays an attributed historical quote. If there is no fresh exact match, a supported pick can still display with an explicit price check. |
| Prediction markets and OddsRelay | DraftKings Predictions and other prediction markets remain reference-only. Distinguish DraftKings Sportsbook. OddsRelay remains evaluation-stage and can supply labeled research context subject to row provenance. Its use here cannot satisfy a Bookmaker or BetOnline requirement or establish a placeable offer. |

### Output decisions

- **Research pick.** The direction is supported, key assumptions hold in the saved evidence, and an exact sportsbook line and price pass the freshness check at the as-of time. Show the quote time. Require readers to recheck the number before they rely on it.
- **Conditional pick.** The direction is supported and there is a concrete pre-kickoff check. Examples include finding the stated line or price on a fresh board, confirming the starting quarterback, or checking that a player is active without a reported workload restriction. State the consequence of failure in plain language, such as “Pass if the number moves to 34.5.” Keep missing or stale prices out of the current quote field.
- **Source only.** A traceable opinion or lead with insufficient independent support or an unresolved conflict. Keep it visible in Props Lab or Experts. Entries with incorrect identity, missing provenance, or a game that has started are ineligible for the pick list and receive a reason in the audit.

Give the reader exact terms. Use the source threshold and price as the comparison target unless the evidence supports a different number. If the source has no price, say “No price target established” and identify the exact line to price. A fresh number at a different threshold stays separate. Do not infer a play-to price or a fair price from an analyst's quote or odds screen.

**Example from the Week 11 replay.** If the saved usage and availability evidence supports the call, the row could read “Mark Andrews over 33.5 receiving yards · Conditional pick · No Platinum Rose endorsement.” Attribute −108 to Josh Shepardson's November 20 article. Explain the Week 10 receiving rebound and the risk of reading too much into one game. Show “Check for 33.5 at −108 or better on a fresh board. Pass if the line is higher or the price is worse.” The price is the published comparison target and carries no estimated edge.

## Implementation

1. **Normalize source records.** Reuse the evidence behind `research_evidence.py`, the verified expert feed, and the saved sportsbook rows. Carry stable IDs for the game and market, and player ID for props. Preserve period, side, line, price, dates, URL or local locator, and review status. Snapshot inputs or record hashes so a replay reads the same versions.
2. **Evaluate.** Apply identity and timing rules first. Group repeated opinions and compare compatible quotes. Produce a direction and rationale using only source IDs in the snapshot, plus a counter-case and any condition. Keep validation deterministic even if the assessment text is drafted separately. Enforce the output rules after synthesis. Reject an unsupported line, quote, consensus, or statistical claim.
3. **Emit a local review artifact.** Write `data/research-intel/review/<season>-w<NN>-public-source-picks.json` with schema version, as-of time, input versions, and one decision per candidate. Each record carries game, kickoff, player and team if applicable, market/period, side, line or threshold, decision, source call, why, risk, check, source references, original quote, verified quote if any, and official disposition or gate reason. The schema fixes endorsement and execution eligibility to false. Record counts by decision, source coverage, and why missing candidates were withheld. Identical inputs and as-of time produce stable IDs and ordering.
4. **Render in the existing Master Intel HTML.** Add a direct link from Picks to a **Public-source picks** block in the research area. Show the strongest eligible picks first, with a proposed initial limit of five visible at a glance and the full list grouped by matchup or market. Sort by evidence quality, actionable conditions, then kickoff. Show selection, line, price status, one reason, one risk, and what would make it a pass. Expand for citations and why it missed Platinum. If the list is empty, show the specific reason and link to the source evidence.
5. **Keep official workflows independent.** Render the review artifact through the local HTML packaging path when the base report already exists. A new full report still requires its normal gates. This task has no path to the Platinum recommendations, official or paper ledgers, SuperContest, My Card, sportsbook accounts, Supabase, or automated publication. To promote a research pick later, run it independently through the existing Platinum workflow and human approval.

## Acceptance and replay

| Test | Expected behavior |
| --- | --- |
| Empty official card or an uncovered matchup market with sufficient evidence | Produce a named research or conditional pick with exact terms, citations, risk, and the endorsement label. A zero-pick outcome requires an evidence reason. |
| One verified published call, independent usage or matchup support, no Platinum model edge | Eligible for a public-source pick. No fabricated edge, probability, stake, or official status. |
| An analyst call appears in an article, podcast clip, and X repost | One underlying call. Show source links without inflating independent support. |
| Conflicting analysts, moved threshold, unresolved QB role, or stale sportsbook quote | Show the competing case or the explicit line or lineup condition. Keep stale, missing, or unmatched prices out of the current quote field. If no defensible condition remains, show source evidence only. |
| Wrong team, bad player identity, out player, stale roster vet, or a game at or after kickoff | No public-source pick for the affected row. A valid unrelated matchup can still be assessed. |
| Prediction-market percentage, OddsRelay trial evidence, or an unpriced social parlay leg | Preserve provenance and reference status. None becomes a sportsbook price, standalone offer, or ticket. |
| Week 11 Friday replay | Use the existing 12-game pre-kickoff snapshot, reviewed article props, podcast records, and X legs. Demonstrate at least one conditional pick from a source-backed prop whose role or exact market can be checked even though the official prop list is empty. Confirm the Jets official-path proposal and the concluded IND@HOU report are unchanged. |
| Repeat run and local HTML QA | Identical snapshot and as-of time produce the same decisions. Picks link works in the self-contained HTML, all research entries carry the endorsement label, and official outputs remain byte-identical. Run strict roster validation and `scripts/master-intel/check_sc_report.py --week 11` for the replay. |

Review the Week 11 replay with Andy before enabling the task in the weekly workflow. Use that replay to review the evidence minimum, the conditional wording, and the proposed display limit.
