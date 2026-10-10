# Week 5 — Remaining Slate Synthesis Digest

**Built:** 2026-10-10 PT  
**Scope:** 14 remaining games (Sun. Oct. 11–Mon. Oct. 12). TB @ DAL is complete and excluded.  
**Status:** research digest only — not a card, recommendation, ticket, or official record.

## Evidence status

- Readiness preflight: **PASS — 0 stale gates**. Roster vet passed before this digest.
- Current display-board baseline: `data/odds/BKR_current_lines_1010_user_provided_buildfmt` (user-provided; intake time only; no executable-price claim).
- Contest baseline: `data/supercontest/week-05-2026-verified-lines.json` (user verified; contest reference only).
- Podcast evidence: `data/generated/master-intel/w05-pull.json` — 18 promoted episodes, 172 picks, 100 notes. Analyst selections below remain source evidence, not model picks.
- Excluded: `data/supercontest/live-market-comparison.json`, which is recently written but contains Week 4 matchups; do not use it for Week 5.

## Candidate / pass ledger

Format: `game | market at current BKR display | finding | evidence | tier / disposition`

- PHI @ JAX | JAX -7.5 (-113), 42 | Multiple sources favor Jacksonville, but the cited -4.5/-6.5 thresholds have already moved to -7.5. | BettingPros, The Favorites, Even Money; BKR 10/10 | **Tier 2 evidence; PASS at current number**.
- IND @ PIT | IND +3 (-118), 43.5 | Prior teaser support crosses through key numbers only after a 6-point adjustment; no straight-side case is carried forward. | Even Money; BKR 10/10 | **Teaser context only; no straight lean**.
- MIN @ NO | NO +2.5 (-109), 41.5 | Saints support is sourced at +1.5/+2 and includes a moneyline call; current BKR is +2.5, but the source price/time is not current. | Sharp or Square, BettingPros, Even Money; BKR 10/10 | **Tier 2 source consensus; WATCH pending Saturday/Sunday availability**.
- CLE @ NYJ | CLE +2.5 (-109), 39.5 | Browns are supported by two named sources, including a teaser-specific crossing-number rationale; current +2.5 is not a Wong teaser number without adjustment. | Action Network, BettingPros, Even Money; BKR 10/10 | **Tier 2 evidence; WATCH, not a ticket**.
- CIN @ MIA | CIN -7 (-108), 43.5 | A cited Bengals case was -7.5, while current BKR is -7. The value is price-sensitive at the key number and requires final injury verification. | BettingPros; BKR 10/10 | **Tier 2 single-source; conditional WATCH only**.
- LV @ NE | LV +3.5 (-107), 45 | Raiders +3.5 has two independent named-source endorsements and retains the hook at BKR. | Even Money, Sharp or Square; BKR 10/10 | **Tier 2 consensus; candidate for later card review**.
- NYG @ WAS | NYG +3.5 (-108), 41.5 | Giants case is explicitly conditional on quarterback-status clarity; do not treat it as a current play. | Action Network; BKR 10/10 | **Tier 2 conditional; HOLD for verified inactive news**.
- HOU @ TEN | HOU -7 (-115), 38 | Texans support was explicitly "under 7" at -6.5; current BKR is -7. | BettingPros; BKR 10/10 | **Tier 2 source; PASS at -7 absent a better number**.
- DEN @ LAC | DEN -3.5 (-113), 42 | Source opinions conflict: Chargers +3.5 versus Broncos -3.5; total support for the Under is single-source. | Action Network, Even Money, BettingPros; BKR 10/10 | **Conflicted; PASS**.
- SF @ SEA | SF +3 (+104), 46.5 | Side opinions conflict (SF moneyline versus SEA -3); total has an Under source at the current number. | PFF, Sharp or Square, BettingPros; BKR 10/10 | **Conflicted side; total WATCH only**.
- DET @ ARI | ARI +6 (-111), 54.5 | Arizona +6 appears in named-source support, but there is also Detroit support and an Over thesis; this is not consensus. | Even Money, Sharp or Square, BettingPros; BKR 10/10 | **Conflicted; PASS**.
- CHI @ GB | CHI -1.5 (-108), 45.5 | Chicago support is at -1.5/-2.5 and current BKR is -1.5; SuperContest is CHI -3, creating a meaningful contest-versus-display-price difference. | Sharp or Square, BettingPros; verified contest lines; BKR 10/10 | **Tier 2 consensus; candidate for contest review, availability dependent**.
- BAL @ ATL | ATL -3 (-117), 44 | Side and total sources conflict: Atlanta side support exists, while total calls oppose each other. Contest ATL -3.5 is a half-point worse than BKR -3. | Sharp or Square, Even Money, BettingPros; verified contest lines; BKR 10/10 | **Side WATCH; total PASS**.
- BUF @ LAR | BUF +3 (+100), 54.5 | Bills short-dog support persists from multiple source types and current BKR supplies +3; total calls are only Over support and the number is high. | Even Money, Sharp or Square, BettingPros; BKR 10/10 | **Tier 2 consensus; candidate for later card review, verify late availability**.

## Contest-price deltas worth reviewing

- **CHI -3 contest vs. CHI -1.5 BKR:** better display number than contest line; only relevant if the underlying Chicago case survives availability review.
- **ATL -3.5 contest vs. ATL -3 BKR:** better display number than contest line; source support is present but not sufficient alone.
- **DET -5.5 contest vs. DET -6 BKR:** BKR is worse than the contest line; no automatic substitution.
- **HOU -7.5 contest vs. HOU -7 BKR:** BKR is better than the contest line but sits on the key number; the existing source threshold was under 7.

## Required before a card

1. Refresh game-day team reports/inactives for all candidate games.
2. Re-price any surviving side against the current board immediately before a proposed card.
3. Decide whether to use the contest candidates separately from sportsbook candidates; no automatic copying between them.
4. Build a proposed card only after that review, then rerun roster vet on every named player leg.
