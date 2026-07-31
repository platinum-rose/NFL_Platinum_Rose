# Podcast/YouTube Freshness Reconciliation - 2026-07-31

> Local research freshness and review-status reconciliation only. This does not promote picks, write Supabase, call a model, or mutate production recommendations.

Window: 2026-07-24 through 2026-07-30
Accepted YouTube local-intel picks: 45
Accepted YouTube local-intel notes: 0
Review-status rows: 115
Podcast deep dives in window: 0
YouTube candidates in window: 4
Futures-eligible YouTube candidates in window: 2

## Review Separation

| Status | Count |
|---|---:|
| context_only | 11 |
| needs_review | 3 |
| pending_review | 46 |
| promote_to_local_intel | 45 |
| reject | 10 |

## Anchor Coverage

| Team | Accepted Picks | Accepted Notes | Pending/Needs Review | Accepted Markets |
|---|---:|---:|---:|---|
| BUF | 0 | 0 | 1 | none |
| GB | 1 | 0 | 2 | make_playoffs |
| CIN | 4 | 0 | 1 | conference_no_1_seed, division_winner, mvp, opoy |
| KC | 0 | 0 | 1 | none |
| NO | 2 | 0 | 1 | division_winner |
| NYG | 1 | 0 | 1 | season_rushing_tds |

## July 24-30 YouTube Candidates

| Date | Status | Score | Lane | Title |
|---|---|---:|---|---|
| 2026-07-24 | candidate_not_futures_eligible | 0 | fantasy | Whose Draft Board is WRONG About These Players?! \| Fantasy QB & RB Ranking Discrepancies \| Part: 1 |
| 2026-07-24 | candidate_not_futures_eligible | 0 | fantasy | 2026 Fantasy Football Preview With Fantasy Analyst Kendall Valenzuela! |
| 2026-07-28 | unobserved_futures_candidate | 3 | futures_intel | TOP 10 QUARTERBACKS: NFL Betting Experts' Rankings & Analysis of Greatest QBs For 2026 NFL Season |
| 2026-07-30 | unobserved_futures_candidate | 9 | futures_intel | NFC SOUTH BETTING PREVIEW: Gambling Expert Picks, Predictions & Strategies for 2026 NFL Season |

## July 24-30 Podcast Deep Dives

_No generated podcast deep dives are dated inside this window. Latest generated deep-dive episode is listed below._

Latest: 2026-07-23T21:25:07+00:00 - BettingPros Podcast - Drafting the ULTIMATE 2026 NFL Futures Card \| Win Totals, Division Winners & Award Sleepers (Ep. 1022)

## Anchor Review Queue

### BUF

- pending_review note: roster_or_depth_chart
  - Source: Drafting the ULTIMATE 2026 NFL Futures Card | Win Totals, Division Winners & Award Sleepers
  - Evidence: The Bills don't have the same offensive line coach... that was a significant loss.

### GB

- pending_review note: coaching_or_scheme
  - Source: Greg Cosell: 2026 NFC North Season PREVIEW
  - Evidence: I'm curious to see how Gannon deploys them. He did some really interesting things in Arizona where he basically lined up in like a lot of five-across looks.
- pending_review note: injury_or_health
  - Source: NFL Injury Expert Dr. David Chao On The Major NFL Injury Storylines
  - Evidence: We fully expect him to start on PUP, and we don't expect him to come off PUP as soon as he's eligible. I think it's mid-to-late season before he returns.

### CIN

- pending_review note: player_evaluation
  - Source: Top 10 NFL Starting Quarterbacks Heading Into 2026! | The Favorites
  - Evidence: I do wonder if the physical toll of his career is starting to kill his passion.

### KC

- pending_review note: injury_or_health
  - Source: NFL Injury Expert Dr. David Chao On The Major NFL Injury Storylines
  - Evidence: If week one were the Super Bowl, guarantee, book it, Patrick Mahomes would play and start that game. But it's not the Super Bowl... I see them being conservative.

### NO

- pending_review note: schedule_context
  - Source: Top 12 NFL Best Bets & Playoff Predictions | Division Winners, No. 1 Seeds & Futures Picks (2026)
  - Evidence: You may want to wait to buy in on the New Orleans Saints... first two matchups of the year: at Detroit, at Baltimore.

### NYG

- pending_review note: injury_or_health
  - Source: 2026 NFL Receiving Rooms Tier List | Full Rankings
  - Evidence: He played only four games last year because of the injury.

## Guardrails

- Accepted rows come only from `promote_to_local_intel` status.
- Pending, needs-review, context-only, and rejected rows remain excluded from the agent summary.
- No live model/API calls were made.
- No Supabase writes were made.
- No official picks or production recommendations were created.
