---
name: ASTRA_W06_SUNDAY_CARD
role: Fresh-session prompt - Week 6 Sunday card (slots 1-9) incl. prop parlays and the SNF Island ladder, built on the Astra game reports and portfolio
category: dev
docsOnly: true
created: 2026-10-17
---

# Astra Week 6 - Sunday card + prop parlays + SNF Island ladder (Platinum Rose)

## Activation (paste as the first message of a fresh session)

```text
Run the Platinum Rose Week 6 Astra SUNDAY CARD build: all parlays, round robins, prop parlays, TD stacks and the SNF Island ladder (DAL@GB, Sun 5:20 PM PT).
Repo: E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard).
Read agents/dev/ASTRA_W06_SUNDAY_CARD_SESSION_PROMPT.md and follow it.
NO PINS, NO STOP GATES, NO EMPTY SLOTS: every gate/hash/roster/kickoff/condition issue is a note, never a stop. Fill every slot; if evidence is thin, fill it with the best available legs and label the conviction.
Outputs: reports/bets/2026-w06-sunday-card-astra.md ; reports/bets/2026-w06-snf-island-dal-gb-astra.md ; data/research-intel/proposed/cards-w06/2026-w06-sunday-card-astra.json ; append one line to reports/intel/games/2026-w06-astra-RUNLOG.md.
```

## 1. Mission

Turn the finished Astra work into Andy's actual Sunday card, using his standing templates, and propose every ticket with its legs, prices, stake and a one-line reason. It is a proposal Andy reacts to. You place nothing.

Sources of truth for structure (read these first, follow them exactly, do not reinvent):
- `docs/NFL_WEEKLY_CARD_PROCESS.md` - the 9 card slots, the build order, round-robin formats, SuperContest split stake, prop stack rules (leg price barrier -350), sourcing tier, 2-team RR format. Treat every rule written there as binding.
- Island ladder (locked 2026-09-15): Tier 1 $10 @ +600 to +1000, Tier 2 $5 @ +1800 to +3000, Tier 3 "Moonshot" $5 @ +6500 to +20000. Each tier uses its OWN distinct legs/players/markets: no shared anchor. Positive correlation named per ticket; never stack negatively correlated legs; check backup depth before any injury-flagged leg. Worked example of the output shape: `reports/bets/2026-w04-snf-island.md`.
- Last week's card for format and tone: `reports/bets/2026-w05-card.md`; this week's earlier proposals for what changed: `reports/bets/2026-w06-card.md`, `2026-w06-card-revised-proposal-1017-1715.md`, `2026-w06-picks-sheet-1017-1830.md`.

## 2. The no-empty-slot rules (these override everything below)

1. Fill EVERY slot: 1 Master RR, 2 Dog ML RR, 3 Morning parlay(s), 4 Afternoon parlay(s), 5 Hybrid parlay(s), 6 SuperContest split stake (parlay + 2-team RR), 7 Player prop parlays (7a-7e), 8a First TD stack, 8b 2+ TD stack, 9 SNF Island ladder (3 tiers, own legs each). A slot is never "skipped". If fewer legs than the template wants clear the bar, take the best remaining legs, mark each `conviction C`, say why it is only a C, and still deliver the ticket.
2. Gates, pins, HEAD, hashes, roster status, kickoff time, open conditions, stale prices and unconfirmed news are NOTES (a "Gate notes" section and a per-leg caveat). They never stop the run and never empty a slot. Unconfirmed starters (Williams, A.J. Brown, Barkley, Daniels, inactives): use the more likely scenario, name the flip condition, and add a swap-out leg.
3. If a price is not on a captured board use the best available number marked `price-est.` with the break-even; never omit a leg only for a missing price. Re-price at placement is Andy's job; say so once, not per leg.
4. Pick when unsure; state the alternative in one line; do not ask questions; finish in one pass. Do not re-hash files, do not rerun `roster:vet`, do not re-verify what the game reports already verified.
5. Season evidence is context, not a veto. Where the template and the post-mortem data disagree (e.g. 5+ leg parlays 0/58 in W1-3, only 2-team RRs profitable, legs shorter than -200 under-hit), build the template as Andy specified and put the evidence in a one-line `flag` on that ticket. Andy decides; you do not shrink the card on your own.

Hard prohibitions (the only rules that bind): no wagers or sportsbook clicks, no TheOddsAPI, no Supabase writes, no paid model/API calls (Gemini, AssemblyAI, OpenAI), no edits to `data/official-picks/user-placed-wagers-2026.json` or any ledger/portfolio/official pick, no git add -A / reset / clean / stash / commit / push. Standing Andy rules: no prop round robins (retired 2026-09-27), no first-half legs on full-game tickets, BEO "Game Props" cannot be parlayed, BKR does not allow INT legs in same-game parlays, no 70+/80+ receiving ladders in SNF combos (use 40+/50+/60+), a player missing from the box score grades as a loss. Stakes in the card are PROPOSED stakes taken from the template; the JSON uses `proposed_stake`, never `stake`, `ticket`, `wager_amount`, `bet_slip` or `payout` keys.

## 3. Inputs (read in this order; stop when you have enough)

1. The Astra outputs: `reports/intel/portfolio/2026-w06-astra-portfolio.md` and its JSON (the ranked 12, 3 parlays, 3 teasers, SuperContest five), then the 13 game reports `reports/intel/games/2026-w06-astra-*_at_*.md` / `data/research-intel/proposed/games-w06/*.json` (leans, tiers, sim runs, availability, ambiguities, delta checklists).
2. Prices: `data/odds/BKR_current_lines_1017_1240_buildfmt` (game lines, 12:40 PM PT), the BKR prop boards (rec, TD; Fri 19:33 PT), BetOnline (BEO) artifacts (latest 2:15 PM PT; full player markets for HOU@JAX, BUF@LV, DAL@GB only), DraftKings Predictions contracts (reference only, not executable). `docs/Player_Prop_Odds_Weekly/` for the parsed prop boards if present for Week 6. Each event keeps its own captured timestamp.
3. Analytics and intel: `data/research-intel/proposed/2026-w06-quantitative-synthesis.json`, `data/generated/master-intel/` (`w06-splits-all.json`, `big-money-flags-2026-w06.json`, `w06-expert-verified.json`, `w06-email-props-cody-brown.json`), `data/podcasts/youtube-extracted-picks-2026-w06.json` (approved signals), `data/research-intel/review/w06-article-leads-read-2026-10-17.json`, Twitter prop ideas if a W06 file exists, game logs `data/fantasy/boxscores/` (W1-5) for hit-rate evidence on props.
4. Availability: `data/generated/master-intel/w06-roster-vet.json` (read only; do not rerun) and `data/player-availability/latest.json`. This season's data is the only source of truth; never infer team/role/status from memory. Roster map uses WSH; schedule uses WAS.
5. SuperContest: `data/supercontest/week-06-lines.json` (locked 10/15 numbers); compare to the current market and flag any gap (the only positive-edge hedge is a middle when the book moves past the contest line).
6. Weather/venue: `data/research-intel/review/2026-w06-weather-venue.json` (forecast only). ATL and IND retractable roofs, LV fixed dome.
7. Simulator for side/total probabilities: `scripts/intel/margin-simulator.mjs`. Props, SGPs, teasers and parlays have no calibrated joint model: show combined price as a product of leg prices, flag that BetOnline SGPs pay 10-62% below the raw product, and never present a parlay probability as calibrated.

## 4. Known facts (verify against the game reports; do not infer)

- Slate (PT): HOU@JAX 6:30 AM (London); 10:00 AM slate: NYJ@NE, PIT@TB, BAL@CLE, CHI@ATL, TEN@IND, CAR@PHI, NO@NYG; afternoon: ARI@LAR 1:05, BUF@LV and LAC@KC 1:25; SNF DAL@GB 5:20; MNF WAS@SF Mon 5:15. SEA@DEN is final: exclude it everywhere.
- PHI: Hurts OUT, McKee starts. BAL: Lamar Jackson out per ESPN, Huntley starts (Lamar-conditional picks void). TB: Mayfield out per ESPN, Daniels operator-recorded. CHI: Williams unconfirmed until Sunday morning. NE: A.J. Brown day-to-day. WAS RB Croskey-Merritt reported Out. Barkley OUT is a reporter hedge.
- Isaiah Likely is on NYG (anytime-TD +225 unverified). Najee Harris unresolved: do not use.
- The SNF/DAL@GB game: GB defensive line reported depleted (Parsons, Hargrave, Ford, Riley), 86% of money on the over; the DAL@GB article leads contradict each other (AN 8238 has an unrelated Seahawks-Broncos template error: zero weight).
- The SNF-favorite cap for slots 3 and 4: pick the SNF favorite leg ONCE and use the identical leg in both tickets. If the Astra read does not favor GB at -1.5, use the better available SNF side/total and say so.

## 5. Build order and method

1. Board: one row per game (lean, tier, price, break-even, news risk, flip condition) from the Astra reports. Mark which window each game settles in.
2. Fill slots in the process-doc order: RRs (1-2) first, then 3-5, then 6, then 7a-7e, 8a-8b, then 9 (SNF Island ladder). Reuse the Astra top-12 and portfolio parlays wherever they fit a slot; do not invent legs that contradict an Astra lean without saying why.
3. Every leg row: game, market and line, book, price (captured or `price-est.`), band, tier, side expected to win, QB exposure, availability, why, `[Source: path, field, timestamp]`, conviction A/B/C. Include the combined price and the weakest leg, and a named swap-out for each ticket.
4. Dedupe across tickets: do not reuse the exact same leg in more than two tickets; call out intentional repeats (e.g. the shared SNF-favorite cap). Within the Island ladder every tier has distinct players/markets.
5. SNF Island ladder (slot 9, DAL@GB): three SGP-style tickets built on BEO DAL@GB (the only book with full player markets) - Tier 1 $10 @ +600/+1000, Tier 2 $5 @ +1800/+3000, Tier 3 $5 @ +6500/+20000 - plus up to two optional moonshots if the board supports them. Prefer legs with a streak/hit-rate source (box-score log, e.g. "5 of 6") or a HIGH matchup tier. Show the combined price, and confirm it falls inside the tier's band; if the correlated-leg trim could push it outside the band, add or swap a leg and say so. Output also goes to its own file.
6. MNF (optional, if time): a short WAS@SF Island ladder in the same file with the same rules; the weather file's wind values for that game are unreliable, so make no wind claim.
7. 8a First TD stack ($5, 3 legs, target well above +7000) and 8b 2+ TD stack ($5, 3 legs): if 3 legs cannot realistically reach +7000 at fair pricing, show the realistic combined odds and keep the ticket. Likely and Harris: no.
8. Slot 6: split stake - ~$15 straight 5-team parlay + $10 2-team RR (10 x $1) on the SuperContest five. Use the Astra SuperContest five unless a better set exists; flag any half-point buy or open slot.
9. Tally the card: total proposed stake per slot, total, window-by-window exposure, and a "hedge map" for the SNF cap (which tickets are alive into the night and what live hedge/middle would apply).
10. Counter-case: for the three biggest tickets, one sentence on what kills them.

## 6. Required report sections (`reports/bets/2026-w06-sunday-card-astra.md`)

1. Header (as-of PT, generated UTC, HEAD as a note, data ages). 2. Gate notes (never blocking). 3. Game board. 4. Slots 1-8b, each a table in the leg-row format above with stake, combined price and the swap-out. 5. Card tally and hedge map. 6. Sunday-morning refresh list (Williams, inactives, A.J. Brown, Barkley, Likely price, IND/ATL roof, weather, any leg price that moved) with the exact swap for each. 7. Not on the card and why. 8. Ambiguity / missing data. The SNF Island ladder goes in `reports/bets/2026-w06-snf-island-dal-gb-astra.md` (same format as `2026-w04-snf-island.md`: template line, prices source, exclusions, three tier tables with flags), and a summary table of it is repeated as slot 9 in the main report.

## 7. Outputs and finish

- Reports: the two files above. Structured: `data/research-intel/proposed/cards-w06/2026-w06-sunday-card-astra.json` with keys: generated_at, head, gate_notes[], board[], slots{1..9 incl. 7a-7e, 8a, 8b, each a list of tickets with legs[], combined_price, proposed_stake, conviction, swap_out}, tally, hedge_map, refresh_list[], not_on_card[], ambiguities[]. Create directories if needed.
- Run log: append ONE line to `reports/intel/games/2026-w06-astra-RUNLOG.md`: `UTC time | SUNDAY-CARD | HEAD | COMPLETE | slots 1-9 filled | files`.
- Do not commit. Finish with a short summary (ticket count, total proposed stake, the SNF ladder in one line per tier, top 2 risks, output paths). Andy or the Claude team stages the paths by name.
