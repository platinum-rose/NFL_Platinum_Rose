---
inclusion: always
description: Model-tier routing convention — every plan and handoff task tags its best-fit model tier
---

# Model-Tier Routing Convention

**Purpose:** The creator swaps between platforms (Claude, Codex/GPT, Gemini/Antigravity)
regularly. Every **plan, backlog, and handoff** must tag each task with the model tier
best suited to it, so work can be routed to the cheapest capable model on whichever
platform is active. Cost and quality both improve when extraction isn't sent to a
frontier model and synthesis isn't sent to a mini model.

## The four tiers (platform-agnostic)

| Tier | Use for | Example models |
| --- | --- | --- |
| `code` | **Deterministic** pipeline / math / data-engineering. **No LLM at all.** Fetchers, parsers with fixed schemas, EPA/regression math, joins, aggregations, arbitrage math. | — (scripts) |
| `flash` | High-volume **extraction, classification, normalization, summarization** over text. Low reasoning depth, fixed output schema. | Gemini Flash, GPT-5-mini / 4o-mini, Claude Haiku |
| `standard` | **Moderate reasoning** — judgment calls, multi-field correlation, scheme-fit assessment, contextual tagging that needs more than pattern-matching. | Gemini Pro, Claude Sonnet, GPT-5 |
| `frontier` | **Deep multi-step synthesis / strategy** — betting theses, market-vs-model edge, skeptic/risk passes, anything where a wrong nuance costs money. | Gemini 2.5 Pro Deep Think, Claude Opus, GPT-5 Pro / o-series |

**Compound tags** are allowed for pipelines: `code + flash` (code fetches, flash
classifies), `flash → frontier` (flash pre-digests inputs, frontier synthesizes).

## Routing rules

1. **Don't send deterministic work to any LLM.** If the output is fully specified by
   the input (a schema map, a math derivation), it is `code`.
2. **Default extraction/normalization to `flash`.** Only escalate to `standard` when the
   task needs genuine judgment, not just pattern-matching.
3. **Reserve `frontier` for synthesis and strategy.** Let cheaper tiers pre-digest inputs
   into compact structured signals first.
4. **Preserve the existing split:** code owns math/validation/correlation/persistence;
   LLMs own synthesis/skepticism. `flash`/`standard` slot in as the ingestion tier.

## Handoff / plan requirement

- Any ranked table, backlog, or task list in a plan or handoff must include a
  **model-tier tag per task** (a `Tier` column or a `## Model-tier routing` section).
- When a task is picked up, note the tier actually used if it differed from the tag, so
  the routing calibrates over time.
