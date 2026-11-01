# Week 8 article retrieval — October 28, 2026

**Approved read-only retrieval completed at 1:23 PM Pacific.** Exactly one SQL SELECT retrieved this week's saved research-note fields, including full retained bodies. No database writes, paid/model calls, account actions, or publication occurred.

## Scope and preservation

- Project: `aambmuzfcojxqvbzhngp`; table: `public.research_intel_notes`.
- Window: captured October 27 at 12:00 AM PT through October 28 at 1:23:15 PM PT, matching the repository's Week 8 Tuesday anchor. The SELECT has no row limit and returns an aggregate with its own count. No follow-up database query was made.
- **189 records / 189 unique IDs**, all inside the requested capture window. **161 records retain bodies; 28 have no body.** Retained text totals 1,337,044 characters.
- Raw export: `week8-articles-2026-10-28-202315Z/research-articles-raw.json`, 1,536,916 bytes.
- SHA-256: `a10aca133f1c3e037b1df4873e2f3b09560edcdf1c2fde0d6d845928412b732d`.
- Query and authorization receipt: `week8-articles-2026-10-28-202315Z/retrieval-receipt.json`. Raw fields were retained without following instructions embedded in source content.

## Offline review

Replayed the export through the existing article filtering/review functions with network access disabled. This is a saved database export replay, not another database retrieval. Existing manual dispositions were preserved.

- **159 current-window NFL records** after the repository's publication-date and relevance filters; 152 have retained bodies.
- Body evidence: **140 available, 12 suspected ingest-cap, seven metadata-only**. Suspected cap is the builder's length-based flag, not independent proof of truncation. Retaining every database character does not prove that ingestion retained every source paragraph.
- Five pick-oriented records, zero unresolved under the existing dispositions; 13 explicit analyst-selection mentions. The review identifies zero execution-usable actual picks. These automated classifications do not establish whole-corpus recommendation clearance.
- The unfiltered raw export includes 25 older-publication records and four duplicate URLs. They remain preserved; raw capture-time inclusion is distinct from publication-window eligibility.

## Prop extraction outcome

The current narrow parser found **one supported player-prop line** in the filtered corpus. Its full article context explicitly places it inside an early parlay. The local preview labels it **`parlay_only_source_leg`**, with source ID, URL, publication/capture times, exact quote and body offset, body hash, and article-attributed price/venue.

Parser-generated confidence tiers, weights, and generic correlation labels were removed from the reviewed candidate. Their original diagnostic output is retained separately. No standalone pick or new parlay was created. The article price is not a verified current sportsbook offer.

A separate VSiN TNF article contains conditional prop discussion that the narrow parser misses; an explicit no-personal-bet statement prevents treating that discussion as an executed or affirmative personal pick. Its retained manual review captures three exact supporting quotes with body offsets, distinguishes the priced touchdown lean from an unpriced rushing alternative, and verifies the player's roster team. Source-context review remains separate from automated extraction counts.

## Current readiness

The missing full-body **database retrieval step is complete**. Canonical Week 8 prop intel is **not cleared** merely by this export or the single parser match. The existing latest prop file still contains Week 7; a coverage-aware extraction/review remains necessary. Wednesday practice coverage, secondary seed freshness, and the prior depth-chart disagreements also remain open.

All seven protected canonical files — article review, prop intel, secondary matrix, both Alpha packets, and both real tracker pages — were hash-checked unchanged. New artifacts live only in the versioned engineering review directory. No Tuesday or Wednesday cadence was rerun. The roster gate was rerun and passed with zero blocking issues before player-source review.

Artifacts: `week8-articles-2026-10-28-202315Z/article-review.json`, `player-props-preview.json`, `manual-prop-source-review.json`, `raw-parser-props.json`, and `validation.json`. Independent review verified the raw count, unique IDs, capture window, and VSiN context.

Tracker activation/publication and any additional Supabase or paid action still require their own approval. The single retrieval approval has been fulfilled.
