# NFL-ATLAS-1 — Futures Pin/Watchlist Expert-Citation Design

**Status:** APPROVED (2026-08-23) — pieces A/B/C built this session; migration 048 written but **not yet run live** (Andy runs it natively per the standing no-Supabase-writes-from-this-session rule).
**Date:** 2026-08-23
**Source task:** ATLAS `nfl-futures-watchlist-2026-07` ("Build NFL Futures watchlist with expert agree/disagree citations")

**Decisions Andy made (2026-08-23):**
- Extend the existing Watchlist tab (Question 1 in the original scoping pass) rather than build a separate concept.
- Add `futures_pins` as a new table (Open Item 1) — approved.
- Expert Signals panel uses **neutral framing** ("Signals mentioning this pick," not agree/disagree) — approved, per Open Item 2's recommendation.

## Implementation status

| Piece | What | Status |
|---|---|---|
| Migration | `supabase/migrations/048_futures_pins.sql` | Written, committed to the working tree — **not run live yet**. Run it in the Supabase Dashboard SQL editor when ready; everything below degrades gracefully (empty lists, "not saved" errors) until then, same pattern the rest of this app already uses for not-yet-migrated tables. |
| A — broaden what can be pinned | `src/lib/supabase.js` (`getFuturesPins`/`addFuturesPin`/`removeFuturesPin`), `FuturesWatchList.jsx`'s new "Pin a Future" button + Pinned Futures section + Add Pin modal | Built |
| B — Expert Signals panel | `src/lib/expertSignals.js`, `ExpertSignalPanel` in `FuturesWatchList.jsx` | Built — neutral framing, reads `research_pick_signals`/`research_intel_notes` live, no new ingestion |
| C — Obsidian sync | `agents/futures-pin-vault-sync.js` | Built — not yet run (needs live pins to sync against) |

Lint-clean (`eslint` on all 4 touched/new files: 0 errors, 0 warnings). **Verified live in Chrome (2026-08-23)** after Andy ran migration 048: opened Futures → Portfolio → Watch List, clicked "Pin a Future," pinned MVP → Josh Allen, confirmed it saved to `futures_pins` (survived a full page reload, not just local state), confirmed the Expert Signals panel rendered its correct "no signals yet" state (none exist for that pick currently — expected, not a bug), no console errors, then unpinned it (soft-delete removal also verified) to leave the real watchlist clean. `agents/futures-pin-vault-sync.js` itself is still unrun — needs at least one real, kept pin to sync against; that's the next natural check once Andy pins something for real.

## The original ask

Andy wants to "pin" specific Futures (SB / conference / division / wins / MVP / etc.) he might potentially bet on, with links to any tracked expert who agrees or disagrees on that specific future, including their cited stats/historical data as the citation. Andy's 2026-07-20 decision: build **both** an Obsidian side (one .md note per pinned future, matching the existing 255-note NFL vault convention) **and** a section/page in the dashboard alongside the futures-intel-report / Value Spots UI.

## What scoping found: this is mostly already built, just not the way the original task assumed

The task description guessed the citation data would come from `research-intel-ingest.js` → `futures-intel-report-v2.js`'s Value Spots blockquotes. That data does exist and is live — but it turns out there's a **second, separate, already-shipped feature** closer to this ask than that path: `FuturesWatchList.jsx` (997 lines), wired in today at **Futures → Portfolio → Watchlist tab**. It already does:

- Pins **teams** to a `nfl_futures_watchlist_v1` localStorage blob (`{ teams: [], targets: {} }`)
- 5 market slots per pinned team — Super Bowl, Conference, Division, Win Total (O), Make Playoffs — with price-history charts from `futures_odds_snapshots`
- A citation drawer (`CitationDrawer`, `MarketConsensusIndicator`, `getUniqueHostTakes`) showing podcast-host quotes per market, colored bullish (👍) / bearish (👎)

That citation drawer's data comes from `data/generated/host-citations-latest.json`, an **offline, keyword-matched sentiment index** built by `scripts/build-host-citations.js` from `docs/podcast-transcript-deep-dives/*.md`. It is not the `research_pick_signals` pipeline the task envisioned, and it has real gaps against the original ask:

1. **No MVP/award-level pinning** — market slots are team+market only, no player-level future.
2. **No cited stats/historical data** — citations are a sentiment-classified quote, not the analytical `rationale` field the task wants.
3. **Not tied to the live expert-signal pipeline** — `research_pick_signals` (populated live by `agents/research-intel-ingest.js`) is never queried by the dashboard. `futures-intel-report-v2.js` even has a fully-built matching function, `valueSpotSourceLinks(market, team, notes, signals)`, that returns up to 3 `{source, title, url, why}` links by keyword/nickname match — but it has **zero callers anywhere in the app** (flagged during this repo's 2026-08-10 lint cleanup as a real, non-trivial dormant feature, deliberately left alone rather than guessed at).
4. **No Obsidian side at all** — nothing writes pinned futures to `vault_notes`.

Andy's call this session: **extend the existing Watchlist tab** rather than build a parallel "pinned futures" concept from scratch.

## Proposed design — three additive pieces

Nothing here replaces or rewrites `FuturesWatchList.jsx`'s existing team/price/podcast-citation behavior. All three pieces are additive.

### A. Broaden what can be "pinned"

Today: `nfl_futures_watchlist_v1 = { teams: [...], targets: {} }` — team-scoped only.

Add a parallel `pins` array to the same watchlist state: `{ id, market, selection, team?, label, pinnedAt }`. `market` reuses the vocabulary already used across the repo (`superbowl | conference | division | wins | playoffs | mvp | opoy | dpoy | oroy | droy | coach_of_year | ...`); `selection` is the free-text pick (e.g. "Josh Allen", "Lions"). An existing team pin is just the special case where `team` is set and `market` is one of the current 5 slots — no migration of existing pins needed.

**No live odds tracking for award markets.** Confirmed: `futures_odds_snapshots` only carries `superbowl | conference_* | division_* | wins | playoffs` (team+market, migration 002), and `player_prop_odds` (migration 033) is weekly in-season player props, not season-long awards. Nothing in this repo ingests MVP/OPOY/DPOY/etc. odds today. That's the same real, external-data blocker Andy already chose to leave stubbed for PROPS-1 — this design pins and cites award futures but does not fabricate or promise live odds for them. The watchlist UI shows the price chart only when `futures_odds_snapshots` actually has rows for that market+team; otherwise it shows the citation panels only.

### B. Second citation panel — real expert signals with cited rationale

New component (e.g. `ExpertSignalPanel`), shown alongside — not replacing — the existing `CitationDrawer`. Label them distinctly since they're genuinely different sources: "🎙️ Podcast Takes" (existing) vs. "📊 Expert Signals & Stats" (new).

Data source: `research_pick_signals`, already populated live by `agents/research-intel-ingest.js` — no new ingestion needed. A new small reader (e.g. `src/lib/expertSignals.js`) queries it directly, reusing the matching logic that already exists server-side in `agents/futures-intel-report-v2.js`:

- `expertSignalsForTeam(team, signals)` — strict nickname match, up to 4 signals — for team pins.
- `valueSpotSourceLinks(market, team, notes, signals)` — market-keyword + team-nickname match against both `research_pick_signals` and `research_intel_notes`, returns up to 3 sourced links — this generalizes cleanly to non-team pins (MVP etc.) since its market-keyword half doesn't require a team at all.

Both functions are plain JS with no server-only dependencies — they can be imported directly rather than re-implemented, and this finally gives `valueSpotSourceLinks()` a real caller without touching `futures-intel-report-v2.js`'s own report logic (that file stays governed by `FUTURES_REPORT_SPEC.md`, untouched).

Each signal already carries `author`, `lean`, `rationale`, `confidence` — `rationale` is exactly the "cited stats/historical data" the original task asked for. Render it verbatim with author attribution; where `valueSpotSourceLinks()` finds a matching `research_intel_notes` row, show that source link too.

**Correction after checking the actual ingest code (`agents/research-intel-ingest.js extractSignals()`):** `lean` is not a stance flag — it's free text, either the raw matched spread/total string (e.g. "Bills -3.5") or the article title as a fallback. There is no agree/disagree polarity anywhere in `research_pick_signals` the way the podcast citation store has `sentiment: bullish/bearish`. See Open Item 2 — this is a real design gap, not just an unverified detail.

### C. Obsidian side — one `vault_notes` row per pin

Reuses the exact pattern `agents/intel-to-vault-sync.js` already uses for team notes: splice a generated section into a `vault_notes` row, preserving any hand-written content above the marker, upsert, `ensureVaultFrontmatter()` with `sensitivity: green` (this table is partner-readable via the anon key, same fail-safe default already enforced elsewhere).

New script `agents/futures-pin-vault-sync.js` (same shape as `intel-to-vault-sync.js`): reads the current pin list, runs the same expert-signal match as panel B, writes/updates one `vault_notes` row per pin at `NFL/Futures/<slug>.md` (e.g. `NFL/Futures/mvp-josh-allen.md`, `NFL/Futures/sb-bills.md`) with an auto-generated "## Expert Signals" section (author, lean, rationale, source link — refreshed each run) under a static stub Andy can hand-edit. Matches the "255-note NFL vault convention" — same frontmatter shape, same folder-per-concept structure (`NFL/Teams/`, `NFL/Reference/`, `NFL/Sessions/`, now `NFL/Futures/`).

## Open items — need Andy's call before any code gets written

1. **Where does the pin list live for the sync agent to read?** Today `nfl_futures_watchlist_v1` is browser localStorage only — a Node script can't read that. This design needs a thin new Supabase table (`futures_pins`: `id, market, selection, team, label, pinned_at, active`) so the browser and the vault-sync agent share one source of truth. This is the **one piece of this design that requires an actual new table/migration** — flagging it explicitly rather than creating it without sign-off. Alternative: skip the Obsidian side and keep pins localStorage-only, but that contradicts the 2026-07-20 decision to build both.
2. **`research_pick_signals` has no real agree/disagree signal to key off of.** Confirmed by reading `extractSignals()`: `lean` is free text (the matched spread/total, or the article title), not a stance flag — unlike the podcast citation store's explicit `sentiment: bullish/bearish`. A signal that mentions the pinned team/market isn't automatically "agreement" with that specific pin (e.g. a division-winner pin on the Bills and a signal about "Dolphins to win the AFC East" both mention that division market, but one supports the pin and one opposes it — nothing in the schema distinguishes them without knowing each market's full selection set, which isn't modeled anywhere today). Two honest options: (i) drop the agree/disagree framing for this panel and label it neutrally as "Signals mentioning this pick" — matches, not verdicts; or (ii) best-effort matching that only surfaces signals naming the pin's own `selection` (not competing ones) and doesn't attempt real opposition-detection, same caveated spirit as the podcast panel. Leaning toward (i) — it's honest about what the data supports and is a small copy choice either way. Your call.
3. **Award markets (MVP/OPOY/DPOY/etc.) have no live odds anywhere in this repo.** This design pins and cites them but does not add odds tracking — that's a separate, larger task with the same external-data-source blocker as PROPS-1.

## Suggested build order, if approved

1. `futures_pins` table (open item 1) + wire the existing pin UI to it instead of/alongside localStorage.
2. `ExpertSignalPanel` (piece B) — pure read against data that already exists live, no new writes, lowest risk, ships value fastest.
3. `agents/futures-pin-vault-sync.js` (piece C) — once pins live in Supabase so the agent can actually read them.

Nothing in this plan touches `futures-intel-report-v2.js`'s own report-generation logic, and no migration or Supabase write happens until Andy explicitly signs off on open item 1.
