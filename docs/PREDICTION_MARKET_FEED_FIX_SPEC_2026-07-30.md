# Prediction-Market Feed-Acquisition Fix Spec — 2026-07-30

**Author:** Copilot (VS Code) · docs-only · HEAD `main`
**Implements:** Backlog **#1 (P0)** — the `code`-tier upstream fix.
**Companion:** `docs/FUTURES_DATA_PACKAGE_ENHANCEMENT_BACKLOG_2026-07-30.md` §"P0 · #1".
**Model tier:** `code` (deterministic fetch/targeting). The `flash` classification half
is already shipped (`scripts/build-prediction-market-map.js`, commit `0030cf9`); this
spec is the part the flash suite structurally could not cover.

> **Guardrails:** free/public APIs only (no paid tier, no keys). No Supabase writes, no
> pick persistence, no `git add -A`. This is a spec — no runtime fetch is executed here.

---

## Problem (verified)

`scripts/build-prediction-markets.js` starves its own mapper:

| Fn | Line | Current behavior | Why it fails |
| --- | --- | --- | --- |
| `fetchKalshiNflMarkets` | 47 | `GET /events?limit=100` then regex-filter `nfl\|football\|super bowl`, capped to `.slice(0, 15)` | The first-100 unsorted `events` slice almost never contains the NFL outright **series**; the 15-event cap compounds it. Result: only novelty (`KXNFLENDSTREAK-*`, `KXNFLRETIRE-*`) survives. **0 core NFL futures.** |
| `fetchPolymarketNflMarkets` | 104 | `GET /events?query=NFL&closed=false` | Gamma `/events` has **no `query` param** — it silently returns trending events (Macron, GTA VI, crypto). **0 NFL contracts.** |

Downstream `build-prediction-market-map.js` classifies correctly, but with a 96%-noise
feed the master prompt's cross-venue best-price discipline
(`market_snapshot.prediction_markets.vs_sportsbook`,
`self_check.net_payout_shopped_across_venues`) runs dark for 31/32 teams.

---

## Fix — Kalshi: series-targeted fetch

Replace the generic events slice with **series-targeted** market pulls. Kalshi organizes
outright markets under **series → events → markets**; targeting the series roots reaches
the contracts the current code cannot see.

### Known 2026 NFL series roots (hard-code + discover)

Prefer a resilient two-path approach: (1) hard-code the stable `KXNFL*` roots below as a
floor, and (2) discover any additional Sports-category NFL series at runtime so new
markets self-add.

| Market | Series root (verify at runtime) |
| --- | --- |
| Super Bowl champion | `KXNFLCHAMP` / `KXSBWINNER` |
| Conference champion (AFC/NFC) | `KXNFLCONF` |
| Division winner (×8) | `KXNFLDIV` |
| Team season win total | `KXNFLWINS` |
| Make / miss playoffs | `KXNFLPLAYOFF` |

> Roots drift year to year — **do not trust the table blindly**. Use discovery (below) as
> the source of truth and treat the table as a fallback floor.

### Discovery + fetch flow

```text
1. GET /series?category=Sports
   → keep series where ticker matches /^KXNFL/ OR title mentions
     NFL | Super Bowl | AFC | NFC | <division names>
   → union with the hard-coded roots above (dedupe by series_ticker)

2. For each series_ticker:
     GET /markets?series_ticker=<root>&status=open&limit=100
     paginate on payload.cursor until empty
       (pass &cursor=<cursor>; stop when cursor is null/absent)

3. Map each market → contract (reuse existing calculateNetOdds/price logic).
   Drop the .slice(0, 15) cap entirely — pagination replaces it.
```

### Endpoint notes

- Base already correct: `https://api.elections.kalshi.com/trade-api/v2`.
- `GET /series?category=Sports` — public, no auth. Returns `series[]` with
  `ticker`, `title`, `category`.
- `GET /markets?series_ticker=<root>&status=open` — public, no auth. Returns
  `markets[]` + `cursor`. `status=open` filters to tradeable contracts.
- Keep the existing per-market cent parsing (`yes_ask_dollars`, `yes_bid_dollars`,
  `last_price_dollars`) and the `lastCents <= 0 || >= 100` guard — unchanged.
- Improve `market_type` inference (currently only `super_bowl`/`win_totals`/`general`):
  add `conference`, `division`, `make_playoffs` from the series root/title so the mapper
  gets a clean type.

### Rate/robustness

- `AbortSignal.timeout(10000)` per request (already used); add a small delay between
  series to stay friendly.
- Cap total pagination loops (e.g. 20 pages/series) as a runaway guard.
- On any series failure, `continue` — never let one series abort the whole run
  (current try/catch-per-event pattern already does this; preserve it).

---

## Fix — Polymarket: tag-based discovery

Drop the unsupported `?query=NFL`. Use **tag-based** discovery against the gamma API.

### Flow

```text
1. Resolve the NFL tag id once:
     GET /tags?limit=... (or GET /tags/slug/nfl)
     → find tag where slug === 'nfl' (or label === 'NFL'); cache its id

2. GET /events?tag_id=<nflTagId>&closed=false&limit=100&order=volume&ascending=false
     (paginate with &offset= if needed)

3. Fallback / supplement — keyword search endpoint:
     GET /public-search?q=Super%20Bowl   and   q=NFL%20division
     → union events, dedupe by event.id

4. For each event.markets[]: reuse existing outcomePrices parsing → contract.
```

### Endpoint notes (Polymarket)

- Base already correct: `https://gamma-api.polymarket.com`.
- `GET /events?tag_id=<id>&closed=false` — supported; `tag_id` is the real filter param
  (unlike `query`).
- `/public-search?q=<term>` — supported keyword search; good for catching the
  multi-outcome "Super Bowl Champion 2027" event whose `markets[]` each carry a team
  outcome.
- Keep existing `outcomePrices` JSON parse + `yesPrice <= 0 || >= 1` guard — unchanged.
- Improve `market_type` inference the same way (add `conference`/`division`).

---

## Acceptance criteria

Re-run `npm run prediction-markets` (fetch) then `prediction-markets:map`, and confirm in
`data/prediction-markets/latest.json` + `team_market_map_latest.json`:

1. **Kalshi:** ≥1 real Super Bowl / conference / division / win-total / make-playoffs
   contract for each contending team (not just Jets novelty).
2. **Polymarket:** ≥1 multi-outcome Super Bowl champion event with per-team `markets[]`.
3. Mapped rows carry `mapped: true` and non-null `net_american_odds`.
4. Liquidity-warning ratio drops (feed is majority-NFL, not 96% CPI/crypto noise).
5. No regression: novelty/retirement markets may still appear but no longer dominate.

## Non-goals

- No mapper changes (`build-prediction-market-map.js` is already correct).
- No math changes (`src/lib/predictionMarkets.js` `calculateNetOdds`/`compareMarketOdds`
  unchanged).
- No paid data, no auth, no Supabase writes.

## Files

- **Edit:** `scripts/build-prediction-markets.js`
  - `fetchKalshiNflMarkets` → series discovery + `/markets?series_ticker=` pagination.
  - `fetchPolymarketNflMarkets` → tag-id + `/public-search` discovery.
  - Extend `market_type` inference in both.
- **Unchanged consumers:** `scripts/build-prediction-market-map.js`,
  `src/lib/predictionMarkets.js`.

## Model-tier

`code` — deterministic fetch targeting + pagination. The team/market classification that
runs after is `flash` and already shipped. This closes the compound `code + flash`
Backlog #1 by supplying the missing `code` half.
