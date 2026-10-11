# Week 5 Single-Game Synthesis (one game per run)

Run parameters (the launch message sets these; do not change them):

- `GAME` = `AWAY@HOME`, for example `CHI@GB`. File stem `GK` = `AWAY_at_HOME`, for example `CHI_at_GB`.
- `MODEL` = `astra` or `opus`. It only names your output files, so two models never overwrite each other.
- `HEAD` = the expected short git commit.

You analyze exactly one game. Do not open another game's packet. Concentrating on this matchup is the point of this prompt.

## Role and boundaries

You are a read-only research reviewer for `E:\dev\projects\NFL_Dashboard`. Produce a proposed analysis for one remaining Week 5 game. This is not authorization to place a wager, submit a pool entry, use a cashier, call TheOddsAPI, write Supabase, alter an official pick/portfolio/ledger record, create a ticket, or stake anything. Do not commit, push, stage, reset, clean, stash, or overwrite concurrent work. Preserve the dirty shared checkout. Write only the two output files named below. The paid-API, Supabase and ledger restrictions in `HANDOFF.md` apply.

## Step 0: preflight (stop on any FAIL)

Run exactly:

`python3 scripts/intel/week5-preflight.py --model MODEL --game GAME --prompt prompts/2026-w05-game-synthesis.md --expect-head HEAD`

- Any `[FAIL]`: stop and report it. Do not analyze.
- `[WARN]` lines: continue, and carry each one that touches this game into `gaps`. A BKR/BEO conflict on this game, a packet `fresh_at_build: false`, or an existing output file means: do not issue a price-specific recommendation (disposition cannot be a candidate; tier `research_only`).
- Pinned artifacts (the preflight verifies them; do not regenerate): calibration JSON sha256 `0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33`; nflverse CSV sha256 `51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51`. State the current time in PT and each market capture time. A capture older than 6 hours (3 hours within 6 hours of kickoff) is `stale_for_recommendation`.

## Step 1: read only these inputs

1. `data/research-intel/game-packets/2026-w05/GK.md` (the evidence packet; `GK.json` has the same data). It was built mechanically from the pinned local files and contains: both books' captured lines and recommendation windows, both teams' full 2026 results, records, home/away/division splits, rest, byes and remaining schedule, division and conference standings, the existing quantitative row, a calibrated simulator edge sweep, power ratings, availability, secondary-matchup context, FTN team-level tables, digest rows, and every verified source row for this game with its eligibility flag.
2. Directly, only for this game: `data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json` (this game's rows), BKR/BEO prop rows for this game's event, `data/vault-seed/nflverse/player_stats_weekly.csv` (season 2026, these two teams), and `data/projected-starters/2026/latest.json` (these two teams).
3. Run `npm run roster:vet -- --week 5 --date 2026-10-10 --strict` once, or read `data/generated/master-intel/w05-roster-vet.json`, before naming any player.

Do not read `reports/intel/master-intel-narratives-2026-w05.md`, the Opus/Astra slate reports, or another model's output for this game. You must work blind.

## Step 2: what to analyze

Cover each of these with specific numbers from the packet, and say what is missing instead of filling it from memory.

1. **Schedule and standings context.** For both teams: results to date in order with margins; opponent quality (use the opponents' records in the packet, not outside rankings); home/away and division splits; rest days and any bye already used or still ahead; what this game does to the division race and conference order; the next opponents (a look-ahead or letdown claim needs a specific schedule fact from the packet and is context only, never a numeric adjustment). Four games is a small sample: say so, and do not turn a hot or cold start into a rating.
2. **Matchup mechanics.** Explain how offense meets defense using named FTN fields (table and metric), the power-rating comparison and its provenance, pace, pressure/protection, availability and starters (verified against the roster gate), weather and venue (indoor games: `not applicable indoors`), and secondary context (capped, never dominant). Do not list metrics without explaining what they imply for this game's script.
3. **Market.** Spread, total and moneyline at both books with capture times; the market-implied score; key numbers (3, 7); the Action Network opener and movement; public/handle splits as context only; the SuperContest line as a separate contest reference (its away/home labels may be reversed: use its favorite and spread fields).
4. **Evidence quality.** Only rows with `tier_eligible: true` may support a tier. `near_miss` and `corroboration_only` rows are context: you may mention them but must label them so. If a source's quoted number differs from the current number by 1 point or more, downgrade it; if it crosses 3 or 7, treat it as a different bet. Disagreement between sources is preserved, never averaged.
5. **Edge hypothesis (the part that replaces free-form probabilities).** State, in points, how far your evidence moves the home-team margin and the total away from the BKR line. Defaults and limits:
   - Default is 0.0. Historical market residual SD is 12.77 points, so unsupported disagreement with the market is noise.
   - An edge above 2.0 points needs a `cap_exception` that names at least two independent numeric inputs agreeing on direction; no edge may exceed 3.0 points.
   - Convert the hypothesis to probabilities only by running `node scripts/intel/margin-simulator.mjs --home-line H --total T --margin-adj M --total-adj A` (or reading the packet's sweep). Never do the arithmetic yourself. Report the zero-edge 50/50 baseline next to your hypothesis-conditional numbers. These are conditional on your hypothesis, not calibrated edges: say so.
6. **Disposition and tier.** Disposition is one of `quantitative candidate`, `qualitative candidate`, `conflicted`, `price moved`, `unavailable`, `pass`. Tier is one of `2` (two or more independent tier-eligible outlets and a clear margin), `2-` (a single tier-eligible source, contested, or moved), `skip`, `research_only`. Tier 1 is not available in a single-game run. Pass is a legitimate answer.
7. **Counter-thesis and invalidators.** The strongest reason you are wrong, and the named availability change, line threshold, weather threshold, role change or missing evidence that would flip the disposition. Include the pre-kickoff delta checklist: official inactives and starters, fresh market capture, weather recheck, game status, and repricing of source picks.
8. **Player-prop research candidates (optional, at most 5).** Only from captured, available BKR/BEO rows for this game, roster-gated, each with 2026 usage evidence from `player_stats_weekly.csv` (cite weeks), the exact line, price, book and capture time. No model probability or edge. Mark `high-variance TD` where it applies. If nothing qualifies, return an empty list.

Provenance: every material factual claim in the narrative carries a compact tag `[Source: <path or publisher>, <metric or claim>, <timestamp>]`. Source-pick claims cite the row ID `w05-expert-verified.json#rows[<index>]` from the packet. Never present a stale snapshot as live.

## Step 3: outputs (new files only)

1. `reports/intel/games/2026-w05-MODEL-GK.md`: 600 to 900 words of narrative covering items 1 to 7 in plain language (game script, away state, home state, matchup mechanics, market comparison, thesis and counter-thesis), followed by a short gaps list and the delta checklist. No self-authored QA section; the validator is the QA.
2. `data/research-intel/proposed/games/2026-w05-MODEL-GK.json` with this shape (all keys required unless marked optional; no ticket, stake or payout fields):

```
{
  "schema": "w05_game_synthesis_v1", "game": "AWAY@HOME", "model": "MODEL",
  "generated_at": "<ISO>", "head": "<short sha>",
  "market": {"book": "BKR", "captured_at": "<packet BKR captured_at>", "home_line": <number>, "total": <number>},
  "disposition": "...", "tier": "2 | 2- | skip | research_only",
  "side": {"pick": "<team abbr or null>", "line": <n|null>, "price": <n|null>},
  "total_lean": {"pick": "Over | Under | null"},
  "edge_hypothesis": {"home_margin_pts": <n>, "total_pts": <n>, "basis": ["named input", "..."], "cap_exception": null},
  "simulator": {"home_cover": <n>, "away_cover": <n>, "over": <n>, "under": <n>, "side_push": <n>, "total_push": <n>},
  "cited_rows": [{"row": "w05-expert-verified.json#rows[N]", "outlet": "...", "supports_tier": true, "quote": "<verbatim from packet, optional>"}],
  "context": {"away": "<=60 words on schedule/standing", "home": "<=60 words"},
  "invalidators": ["..."], "gaps": ["..."],
  "props": [{"player": "...", "team": "...", "market": "...", "side": "...", "line": <n>, "price": <n>, "book": "BKR|BEO", "captured_at": "<ISO>", "status": "source-supported | usage context only | high-variance TD", "rationale": "..."}]
}
```

3. Validate before you finish: `python3 scripts/intel/validate-game-output.py --model MODEL --game GAME`. Fix every `[FAIL]` and rerun. Report any remaining `[WARN]`.

## Final response (short)

1. The two files written. 2. Disposition, tier, side/total lean, edge hypothesis and the simulator probabilities (conditional on that hypothesis). 3. The three most decision-relevant schedule/standing facts for this game. 4. Gaps and WARNs. 5. Validator result. 6. Confirmation that no ticket, account, Supabase, ledger or official-pick state changed.
