# Codex follow-up request — reusable `bookmaker-live-parser.mjs` CLI (2026-09-21/22)

## Context

BetOnline's live prop capture has a real, committed extractor:
`scripts/props/betonline-live-parser.mjs` (`--in`/`--out` CLI,
`parseBetOnlineEventText`/`parseBetOnlineBoardPayload` exports, a real
test suite). Bookmaker.eu's does not — every Bookmaker capture so far
(`scratch/bookmaker-sgp-live-2026-09-21-nyg-lar.json`,
`scratch/bookmaker-live-2026-09-21-repull-nyg-lar.json`, both
`bookmaker_live_dom`/`bookmaker_live_markets_v1` schema) has been an
agent reading the rendered DOM directly and writing out structured JSON
by hand, not a deterministic parser reading raw page text/HTML the way
BetOnline's does. Andy asked (2026-09-21 evening handoff, item 6)
whether to have you build a real, reusable CLI mirroring BetOnline's
convention — this is that ask, confirmed by Andy 2026-09-22.

## Why this matters concretely

Because there's no deterministic extractor, bugs in a Bookmaker capture
are bugs in that one JSON file, not in code that can be read, tested,
and trusted to behave the same way next time. Two showed up in the
2026-09-21 repull capture and were confirmed and root-caused this
session:

1. **TD-scorer rows had their `player` field set to the section title
   instead of the real player name.** All 103 `first_td`/`atd_1_plus`/
   `td_2_plus`/`td_3_plus` rows read `player: "Player To Score 1st
   Touchdown"` (etc.) — the real name was still intact, uncorrupted, in
   `selection`.
2. **44 `carries` rows were misclassified as `unknown`** because their
   section titles picked up a new `"<Away> vs <Home>: "` game prefix
   (e.g. `"Giants vs Rams: Jaxson Dart Carries"`) that whatever
   classified them never stripped before matching.

Both are now patched — see `scripts/props/bookmaker-live-normalize.mjs`
(+ `tests/unit/bookmakerLiveNormalize.test.js`, 5/5 passing) — but that
module is explicitly a **post-hoc corrector**, run against an already-
captured JSON file after the fact. It cannot catch a bug that changes
what gets captured in the first place (a section that goes missing
entirely, a market type the ad hoc pass has never seen before, a
selection format that shifts). BetOnline's parser catches that class of
bug because it's a real function with real tests exercised against raw
input; Bookmaker's capture has no equivalent safety net.

## What's requested

A committed `scripts/props/bookmaker-live-parser.mjs`, matching
BetOnline's shape as closely as Bookmaker's page structure allows:

1. **`--in <raw> --out <parsed>` CLI**, same convention as
   `betonline-live-parser.mjs` (see its `main()`).
2. **Exported, unit-testable parsing functions** (e.g.
   `parseBookmakerEventText`/`parseBookmakerBoardPayload`, or whatever
   shape fits the actual raw input Bookmaker's page provides — text dump,
   HTML, or a DOM snapshot; your call once you've looked at what's
   actually capturable there without a live authenticated session).
3. **Section-title handling that's robust to the game prefix** —
   `"<Away> vs <Home>: "` (with the odd extra-space variant seen live,
   `"Giants vs Rams : ..."`) should be stripped once, centrally, before
   any market classification, not per-market-type as an afterthought.
4. **Market classification driven by patterns against the
   prefix-stripped title**, not a piecemeal per-section approach — so a
   new market type failing to classify shows up as `unknown` (visible,
   auditable) rather than silently mis-set.
5. **Player name always taken from the actual selection/name field**,
   never derived from a section title, so the TD-scorer regression can't
   recur in a different market by the same root cause.
6. **A real test suite** (`tests/unit/bookmakerLiveParser.test.js`)
   covering at minimum: the game-prefix stripping, the TD-scorer family
   (`first_td`/`atd_1_plus`/`td_2_plus`/`td_3_plus`), `carries`, and
   whatever other markets appear in
   `scratch/bookmaker-sgp-live-2026-09-21-nyg-lar.json` /
   `scratch/bookmaker-live-2026-09-21-repull-nyg-lar.json` — both are
   available in the repo as real fixture material.

## Known constraint

Bookmaker.eu requires a real logged-in browser session to view live
lines (same real-money-account bot-detection concern that applies to
BetOnline) — Andy has explicitly ruled out a headless/cookie-based
scraper. Whatever raw input format you design the parser around has to
be something a human or agent can plausibly produce from that live,
human-driven session (a copy-pasted text dump, a saved HTML snapshot,
whatever's actually practical) — not something that implies automating
the login/browse step itself. If BetOnline's `--in` format (rendered
page text, see `parseBetOnlineEventText`'s docstring-equivalent input
shape) is achievable the same way for Bookmaker, matching it exactly
would make the two books' data trivially comparable; if not, document
why and propose the closest practical alternative.

## Reference material already in the repo

- `scripts/props/betonline-live-parser.mjs` — the shape to mirror.
- `scripts/props/bookmaker-live-normalize.mjs` — today's stopgap fixes;
  useful as a spec of two known failure modes to design around, but
  should become unnecessary (or trivially reducible to a no-op) once a
  real parser exists.
- `scratch/bookmaker-sgp-live-2026-09-21-nyg-lar.json` and
  `scratch/bookmaker-live-2026-09-21-repull-nyg-lar.json` — two real
  captures of the same game, useful as before/after fixture data.
- `scratch/compare-prop-market-repull.mjs` — the ad hoc movement-report
  script that currently has to work around both books' quirks by hand;
  a real parser should make its `rowKey()`/`sectionKey()` normalization
  logic mostly unnecessary for Bookmaker's side.

## Verification to include in the handoff back

- `node node_modules/vitest/dist/cli.js run tests/unit/bookmakerLiveParser.test.js`
  passing, with the count reported.
- Re-parse both existing scratch captures' raw form (or your chosen raw
  input format re-derived from them) and confirm 0 TD-scorer
  player-field regressions and 0 carries-as-unknown misclassifications
  — i.e. `bookmaker-live-normalize.mjs` finds nothing left to fix.
- `eslint` clean on the new files.
