# MC Analytics NFL Dashboard Evaluation

**Reviewed:** 2026-09-26  
**Decision:** Do not pursue as an automated NFL Dashboard ingest source.

## What was reviewed

- Proposed dashboard: `https://mcanalytics.co/dashboard/nfl/players`
- Public landing page and Terms of Service (last updated 2024-09-16)
- Existing NFL Dashboard analytics, player-stat, odds, and vault routes

The supplied NFL player-dashboard URL requires authentication. No account was
created, no trial was started, and no paid access was used during this review.

## Publicly represented coverage

MC Analytics publicly markets NFL player and team statistics, player props,
matchup splits, line movement, team/player views, and hit rates. Its landing
page also claims real-time player and team statistics updated every play.

The following could not be verified from public documentation:

- available fields, market definitions, and coverage boundaries;
- historical depth and retention;
- player, team, and game identifiers;
- calculation methodology or model provenance;
- API, export, rate-limit, or service-level contract;
- pricing schedule.

## Access, licensing, and reliability

The Terms of Service permit personal, non-commercial viewing only. They prohibit
commercial use, systematic downloading or storage, scraping/data mining,
reproduction, and incorporation of the site into another product or service
without MC Analytics' express prior written consent. Subscriptions are recurring
and prices can change at renewal. The terms also disclaim guarantees that the
site will remain updated, complete, correct, or uninterrupted.

Accordingly, a dashboard scraper, automated capture, database import, or
redistribution through NFL Dashboard is not authorized by the available terms.

## Repository overlap and gaps

| MC Analytics claim | Existing NFL Dashboard source | Assessment |
| --- | --- | --- |
| Player stats and hit rates | `nflverse` weekly/seasonal player actuals keyed by GSIS `player_id` | Likely overlap; definitions and history unverified |
| Player props and matchup splits | `player_prop_odds`, player stats, and prop-grading routes | Possible enrichment only; no documented schema or settlement contract |
| Line movement | Canonical odds snapshots and line-movement routes | Likely overlap; source, book, and cadence are unverified |
| Advanced team analytics | `team_analytic_snapshots`, FTN-derived fields, ESPN FPI | Methodology and numeric scale cannot be compared |

Existing identifiers are not universally interchangeable: the repository already
has multiple game-ID formats. Any permitted future integration would retain MC
Analytics native IDs and resolve them through a source-specific mapping layer.
It must not overwrite `nflverse`, ESPN FPI, team analytics, or canonical odds
data.

## Conditional future prototype

Consider a fixture-only, source-isolated prototype only after MC Analytics
provides written authorization for automated access, local storage, and internal
dashboard display, plus an API/export contract, licensing/redistribution terms,
pricing, rate limits, data dictionary, methodology, historical coverage, update
cadence, and stable identifiers.

The prototype would use vendor-provided samples rather than dashboard extraction,
record source timestamps and provenance, fail closed on schema/count/freshness or
identifier-resolution problems, and make no Supabase writes until separately
approved.

## Vault handling

Do not record dashboard-derived output in either store at this stage. If a future
prototype is approved, place the licensing/provenance decision in local
`E:\data\Obsidian\NFL` only with separate write approval; mirror a sanitized
note to cloud `vault_notes` only after a visibility review. The verified sync
direction is local Obsidian to `vault_notes`; cloud-to-local parity is not
verified.
