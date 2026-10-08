# 2026-10-08 — Codex handoff: TNF props evidence and article-intake next lane

## Resume protocol

1. Read `HANDOFF.md`, then reconcile live Git (`git status -sb`, branch, last five commits).
2. Preserve the shared checkout. Do not reset, clean, stash, or broad-stage. For any later commit, use an explicit-path temporary index.
3. This handoff records read-only research. Do not place bets, change a sportsbook account, call TheOddsAPI, write Supabase, alter the official portfolio/ledger, or present a lead as a placed ticket.

## This session's state

- Base before this session: `main` at `d0551e8` (`data: ingest futures odds and track exactas`).
- The roster gate was refreshed and passed for 2026 Week 5 on 2026-10-08: 32 teams and 2,561 players in `data/nfl-rosters/espn-full-rosters-latest.json`.
- `data/nfl-rosters/roster-map-latest.json` now records `Mar'Keise Irving` as an alias of canonical TB RB Bucky Irving. The roster map is supplemental; the full ESPN roster remains the identity ground truth.
- Fresh user-supplied TB @ DAL BKR and BEO props were reviewed as raw market evidence only. Do not call their display prices executable without a current, venue-specific check. No parlay, ticket, or official pick was created.

## Article-ingestion audit (local review artifact)

Source: `data/research-intel/review/article-intel-review-latest.json`, generated 2026-10-07T21:45:39Z.

- Collection window since 2026-10-06T07:00:00Z: 214 database rows, 205 deduplicated articles, collection complete.
- Body status: 201 with a body; 185 body-available; 4 metadata-only; 16 suspected ingest-cap truncations.
- Review outputs: 14 explicit analyst-selection mentions, 13 tiered picks, 2 actual-pick records, 225 market/pick leads, and 684 analysis notes.
- The review guardrail remains: article-derived leads require human review before promotion; there were no Supabase signals/recommendations.

### Direct TB @ DAL material

Only these three records are directly scoped to both teams without the `multi_team_page_chrome_risk` flag:

| Source / id | Captured | Review result | Treatment |
|---|---|---|---|
| Action Network `6831` — *Cowboys vs. Buccaneers Predictions, Picks, Odds for Thursday Night Football ...* | 2026-10-07T20:03:16Z | One Tier 2 analyst selection; quote says Dallas -9.5 and Over 49.5 | `needs_price_or_venue_verification`; no execution use |
| VSiN `6735` — *Buccaneers vs. Cowboys Predictions: Week 5 Thursday Night Football odds, picks, and player props* | 2026-10-07T03:33:19Z | One Tier 3 Chris Godwin over 27.5 receiving-yards lean at stated -114 | Missing book; author says he would not play props; no execution use |
| Sharp Football `6722` — *Bucs vs. Cowboys Fantasy Football Worksheet, Week 5* | 2026-10-06T22:03:19Z | Two contextual/inference leads (Prescott efficiency; Javonte workload) | Body was truncated; not pick-oriented; no selection |

For the three direct records, the review contains two analyst selections, two tiered picks, zero actual-pick records, and eight market/pick leads. Leads are not picks. The only standalone article-picks export currently present is `data/intel/extracted/2026-w04-article-picks.json`; it is Week 4, not a Week 5/TNF export.

## Next lane: article extraction

Start with the captured Week 5 sources, especially Action Network, VSiN, BettingPros, and Walter Football. Work read-only first. For each candidate, retain title, URL, author, published/captured time, exact quote, directional selection, market, line, price, venue, and review flags. Do not turn weekly-page/chrome matches or inference-only text into a pick. Keep unverified lines explicitly unpriced/unexecutable.

## Copy/paste resume prompt

```text
Resume NFL Dashboard from handoffs/2026-10-08-codex-tnf-article-intake-handoff.md. Reconcile live Git before trusting the handoff and preserve the dirty shared checkout; use explicit-path temporary-index commits only. Work read-only on the captured Week 5 article corpus, prioritizing TB @ DAL TNF. Audit which records have full body evidence, then extract only attributable analyst selections with exact quote, source URL, author, publication/capture time, market, side, line, price, and book. Keep raw source evidence, normalized review records, proposed analysis, and placed tickets separate. Do not place bets, change sportsbook/cashier state, call TheOddsAPI, write Supabase, alter official portfolio/ledger records, or promote anything into an official ticket without fresh authorization. Report gaps and page-chrome/truncation risks plainly.
```
