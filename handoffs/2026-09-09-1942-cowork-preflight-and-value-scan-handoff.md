# Cowork session — preflight check, ledger/watchlist review, preliminary value scan

**Created:** 2026-09-09 19:42 UTC, via Cowork (device-bridge session, read-only except for scratch files).

## What this session did

1. Ran `node agents/portfolio-preflight.js --json` (free, read-only).
2. Reviewed `data/futures-imports/andy-portfolio-ledger-2026.json`, `futures-watchlist-2026.json`, `platinum-rose-ai-official-2026.json`, and recent futures-odds imports for anything to update. **Did not modify these files** — the ledger/watchlist need Andy's confirmation of what's actually been placed/closed since 2026-07-22/23; that's not derivable from the repo alone.
3. Queried live Supabase (`futures_odds_snapshots`, `player_injuries`) via throwaway scripts (`scratch/_valuescan*_tmp.mjs`, matches the repo's existing scratch-script convention, left in place, safe to delete) to build a preliminary value-play shortlist. No writes, no synthesis run, no scraper invocations.

## Preflight result

`2 BLOCK / 6 WARN / 0 ERROR / 26 pass`, `safe_to_run_paid_synthesis: false`.

BLOCKs:
- `futures_odds_snapshots` — Circa has never been captured (all other placeable books fresh, 0.2-1.8d old).
- `contract.cutoff` — the futures pre-cutoff window (`2026-09-09T19:00:00Z`, i.e. 12:00 PM PST today) just passed and nothing in the code switches policy on it. Not fixed this session (`portfolio-preflight.js`/`portfolio-synthesize.js` are under active Codex review per `WORKING-CONTEXT.md` — did not touch them).

WARNs: ledger 49.8d stale, watchlist 48.8d stale, podcast host-summary coverage 41.0% (55/134), zero signal coverage for officiating/roster_churn, prompt-size (397K tokens, `--shadow-slim` mandatory — expected/known), nfl_rosters (expected pre-kickoff).

Live git: `main` now matches `origin/main` at `66fcc03` (the prior "1 ahead" state from the 1500 handoff has resolved itself via a merge commit). Worktree still very dirty as documented across the recent handoffs — nothing touched or staged.

## Ledger/watchlist — needs Andy, not derivable from files

`bills_sb` and `packers_sb` in the ledger are still `status: "building"` with `current_stake_usd: null` despite $200 target caps each — no file in the repo shows what (if anything) has actually been placed on those since 07-22. Asked Andy directly rather than guessing.

## Preliminary value-play shortlist (not final — full committee synthesis is a separate later step)

Built from live `futures_odds_snapshots` history (Tier 1: direct book prices) cross-referenced against the dossier's `prediction_markets` (Kalshi-derived, Tier 3) and `player_injuries` (Tier 1 when named/dated).

1. **Green Bay Packers — Super Bowl, BetOnline +2500.** BetOnline drifted from a flat +2000 (held Jun-Aug25) out to +2200 (Aug26) then +2500 (Aug31-present) while BetMGM held flat +2000 the entire time and Caesars just listed +2200. Packers is an existing portfolio anchor with an open $200 target cap and no stake placed yet — this is a concrete, currently-live entry point for that anchor at a materially better number than 3 weeks ago.
2. **New York Giants — Super Bowl, Bookmaker +8500 vs. consensus +6500/+6600.** Bookmaker alone has drifted from ~6550 (June) out to 8500 (since Aug10, holding there through today) while BetUS, BetOnline, and Caesars all cluster tightly at 6500-6600. That's the widest, most persistent cross-book dispersion found in this scan — worth a manual spot-check that Bookmaker's number is actually live/bettable before relying on it (a line that stale relative to three other books is as likely to be a slow feed as a real edge).
3. **Cincinnati Bengals — Super Bowl, BetOnline +2200** vs. BetMGM/Caesars/BetUS/Bookmaker all at +2000. Smaller (~10%) but consistent edge on an existing "high priority" watchlist item (`cin-atb`).
4. **Kansas City Chiefs — Super Bowl, Caesars +1700** vs. BetMGM's flat +1500. Matches the existing `kc-sb-exactas` watchlist item; modest edge.
5. **Bills/Packers exacta (existing $100 anchor position, already open, not a new play)** — current best market (BetOnline +8300) is far above the BetUS +6500 entry price on file, consistent with Codex's 09-09 1500 reconciliation. Just context confirming the open position's paper value has moved favorably; nothing to act on.

**Data-quality flag, not a play:** `prediction_markets.market_implied_win_total` (the Kalshi-derived win-total field in the dossier) reads ~0.7-1.7 wins *higher* than the sportsbook win-total line for essentially every one of the 30 teams checked, uniformly. A real signal would vary by team; a uniform league-wide offset means this field is very likely a calibration/methodology artifact in how it's derived, not evidence of value. The same Kalshi-vs-sportsbook check on the *playoffs* market (once corrected for a Yes/No selection-matching bug in the scan script) shows good calibration, so the win-total field specifically is suspect. Recommend an engineering look before this field is ever used as synthesis evidence — flagging only, did not touch `portfolio-dossier.js` (locked under review).

**Injury watch (not on Andy's current watchlist teams, so flagged only):** Aaron Donald (LAR, DT) ruled out and not traveling for the Rams' season opener; Michael Penix Jr. (ATL, QB) ruled out for Atlanta's opener. Neither team is in the current watchlist/ledger, so no action taken, but both are notable Week 1 outs if either team's futures come up later.

## Standing guardrails followed

No commits/staging/push. No Supabase writes. No paid synthesis run. No scraper invocations (VegasInsider still on hold). Did not touch `agents/portfolio-dossier.js`, `agents/portfolio-synthesize.js`, `agents/portfolio-preflight.js`, or `agents/lib/board-validate.js` — all four are locked under active Codex review per the task brief.
