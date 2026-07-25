# Training Camp Intel Spec 2026

## Purpose

Build a local-first training camp intelligence layer for the NFL Dashboard that captures source-stamped camp reports for all 32 teams, turns them into compact reviewable nuggets, and feeds those nuggets into futures dossiers for portfolio planning.

This is decision support. It must not become an autonomous betting engine. Platinum Rose AI may use the data to explain proposals, identify watchlist changes, and surface hedge scenarios, but official futures and weekly paper picks still require human approval before they are tracked.

## User Decisions

- Brand/expert identity: Platinum Rose AI.
- Futures bankroll: $500 fixed, $20 unit.
- In-season bankroll: $1000 fixed, $10 unit.
- Confidence sizing: 0.25u, 0.5u, 1u, 2u.
- Futures cutoff: September 9, 2026 at 12:00 PM Pacific.
- Platinum Rose AI may propose futures before the cutoff, but the user locks/rejects official tracked paper picks.
- Exacta plays are on hold until BetOnline secondary markets appear for price shopping.
- Training camp sources should start free/manual.
- Build all 32 teams from day one.
- Manual pasted notes/articles are first-class inputs alongside RSS/API data.

## Guardrails

- Do not make live model/API calls without explicit approval.
- Do not write to Supabase without explicit approval.
- Do not persist production betting recommendations.
- Do not modify open parlay slots.
- Do not generate official real AI proposals until the full futures synthesis is approved.
- Local dry-run snapshots and reports are allowed.
- Any live RSS/web collection should be explicitly invoked and source-stamped.

## Source Policy

Preferred sources:

- RotoWire.
- Team official sites.
- ESPN NFL and ESPN beat writers.
- PFF.
- The Athletic, if manually pasted by the user.
- Local beat reporters and official media.
- Team press conferences and official transcripts when available.

Current phase:

- Stay free/manual.
- No paid feed integration yet.
- No scraping behind paywalls.
- Manual paste/import should preserve attribution, captured time, published time when known, URL, source name, and raw excerpt.

Potential later sources:

- SportsDataIO, Sportradar, or MySportsFeeds if the user chooses a paid structured feed.
- Self-hosted RSSHub on M6 for beat/social accounts.
- Sleeper public NFL player metadata as a low-cost structured fantasy/depth-chart signal.

## Data Model

Create a normalized local record type named `training_camp_intel`.

Required fields:

```json
{
  "id": "stable hash",
  "season": 2026,
  "team": "BUF",
  "player": "Josh Allen",
  "position": "QB",
  "source": "RotoWire",
  "source_type": "official_media|team_site|beat_report|rss|manual|structured_feed|market_signal",
  "source_url": "https://example.com/article",
  "published_at": "2026-08-01T15:30:00-07:00",
  "captured_at": "2026-08-01T16:05:00-07:00",
  "signal_type": "injury|depth_chart|role_usage|coach_quote|beat_consensus|roster_move|preseason_usage|market_move|scheme|weather|other",
  "signal_strength": 0.0,
  "confidence": 0.0,
  "summary": "Short human-readable nugget.",
  "raw_excerpt": "Short excerpt or pasted note, capped for review.",
  "betting_relevance": "Why this matters for futures or weekly betting.",
  "linked_markets": ["wins", "make_playoffs", "division", "conference", "super_bowl", "week_1_spread"],
  "anchor_relevance": ["Bills", "Packers", "hedge", "opponent"],
  "needs_human_review": true,
  "tags": ["camp", "depth-chart"],
  "dedupe_key": "source-url-or-hash"
}
```

Notes:

- `team` should use canonical abbreviations.
- `player` may be null for team-level reports.
- `published_at` may be null for manual notes when unknown, but `captured_at` is required.
- `signal_strength` is directional importance, not betting edge.
- `confidence` is source/process confidence, not pick confidence.
- `raw_excerpt` should be short; store links and summaries rather than full copyrighted articles.

## Local File Layout

Proposed durable local paths:

```text
config/training-camp-sources.json
data/training-camp/2026/manual/
data/training-camp/2026/raw/
data/training-camp/2026/training-camp-intel-YYYY-MM-DD.json
data/training-camp/2026/latest.json
.nfl/training-camp/training-camp-intel-YYYY-MM-DD.md
.nfl/training-camp/training-camp-intel-YYYY-MM-DD.html
```

Manual note options:

- Markdown file with YAML frontmatter.
- Plain text with a required source header.
- JSON array of already-structured nuggets.

Suggested manual Markdown frontmatter:

```yaml
---
source: ESPN Beat Writer
source_url: https://example.com
published_at: 2026-08-01T15:30:00-07:00
captured_at: 2026-08-01T16:05:00-07:00
teams: [BUF, GB]
source_type: manual
---
```

## Classifier

The first implementation should use deterministic keyword classification, not a live model.

Signal types:

- `injury`: injured, limited, did not practice, returned, setback, PUP, NFI.
- `depth_chart`: first team, second team, starter, backup, competition, reps.
- `role_usage`: slot reps, target share, red zone, third down, two-minute, packages.
- `coach_quote`: coach says, coordinator says, press conference, quote.
- `beat_consensus`: multiple reports, beat writers agree, camp buzz.
- `roster_move`: signed, waived, traded, released, activated.
- `preseason_usage`: preseason snaps, starters playing, snap count, drive count.
- `scheme`: motion, play action, tempo, pressure, coverage, personnel grouping.
- `market_move`: line movement, win total move, futures price move.

Strength tiers:

- 0.90 to 1.00: major QB/OL/pass-rush/injury/depth-chart change with market relevance.
- 0.70 to 0.89: starter-level role or availability change.
- 0.45 to 0.69: meaningful rotation, coaching, or usage signal.
- 0.20 to 0.44: soft buzz or low-confidence report.
- 0.00 to 0.19: background context only.

## Report Requirements

Generate a local review report with:

- Coverage summary across all 32 teams.
- Bills and Packers anchor watch section.
- Potential playoff/hedge opponent watch section.
- Team-by-team accordions or headings.
- Source/date badges.
- Signals grouped by type.
- Human-review flags.
- Staleness warnings.
- "No current camp intel" explicitly shown for teams with no items.

The report should avoid implying that empty data means no news. Empty means not collected yet.

## Futures Dossier Integration

Add compact nuggets to `team_profiles` after the local snapshot layer exists.

Suggested field:

```json
{
  "team_profiles": {
    "Bills": {
      "training_camp_intel": {
        "snapshot_at": "2026-08-01T16:05:00-07:00",
        "items_count": 4,
        "high_priority_count": 1,
        "latest_signal_at": "2026-08-01T15:30:00-07:00",
        "stale_after": "2026-08-04T16:05:00-07:00",
        "nuggets": [
          {
            "id": "camp_...",
            "signal_type": "depth_chart",
            "summary": "Short source-stamped nugget.",
            "source": "RotoWire",
            "published_at": "2026-08-01T15:30:00-07:00",
            "betting_relevance": "Impacts WR role and early-season passing projection.",
            "linked_markets": ["wins", "week_1_spread"],
            "confidence": 0.72
          }
        ]
      }
    }
  }
}
```

Dossier rules:

- Keep nuggets compact to protect model context.
- Cite source/date when a nugget supports a thesis.
- Mark stale or thin samples.
- Do not let camp buzz override price/math gates.
- Do not turn a nugget into a pick by itself.

## Build Plan

### Phase 1 - Local Schema And Manual Import

Build:

- `config/training-camp-sources.json`.
- Manual import parser for Markdown/text/JSON drops.
- Local snapshot writer.
- Local Markdown/HTML review report.
- Unit or fixture test for 32-team coverage and manual-note ingestion.

No network required.

### Phase 2 - Free RSS Scout

Build:

- RSS fetch for approved free feeds.
- `--dry-run`, `--no-persist`, `--camp-only`, and `--source` controls.
- Deduplication by URL/hash.
- Source health/errors in report.

Requires explicit approval before live network fetches.

### Phase 3 - Dossier Hook

Build:

- Loader in `agents/portfolio-dossier.js`.
- Compact `training_camp_intel` field in `team_profiles`.
- Conformance test updates.
- Prompt guidance in `agents/portfolio-synthesize.js` that treats camp data as source-stamped context, not recommendation authority.

### Phase 4 - Review UX

Build:

- Local HTML report polish.
- Optional dashboard tab/backlog follow-up after local reports are proven.
- Filters by team, source, signal type, anchor relevance, and needs-human-review.

## Acceptance Criteria

- All 32 teams appear in every snapshot/report, even with zero items.
- Manual pasted notes are first-class inputs.
- Source, URL, published time, captured time, and source type are preserved when available.
- No Supabase writes happen in the first implementation.
- No live model/API calls happen.
- No official picks are generated.
- The report clearly distinguishes collected intel from recommendations.
- Bills/Packers anchor relevance is visible, but the system still covers all 32 teams.
- Dossier integration is compact and source-stamped.

## Safe Initial Command Targets

These commands are interfaces to build, not guaranteed to exist yet:

```powershell
npm.cmd run training-camp:build -- --season 2026 --from-manual --no-persist
npm.cmd run training-camp:report -- --season 2026
npm.cmd run test:training-camp-intel
```

Use `npm.cmd` in Windows PowerShell.
