# Andy's Weekly Card-Building Process — v1 (locked 2026-09-15, drafted 2026-09-13)

This is the repeatable process for building Andy's Sunday card, based on his standing tendencies. Each
section is a template slot to fill in fresh every week, not something to rebuild from scratch. Promoted out
of `scratch/` on 2026-09-15 — this is the standing Sunday template going forward, not a draft.

See also `docs/NFL_ISLAND_GAME_PARLAY_TEMPLATE.md` (if/when written) for the Thu/Sun-night/Mon standalone-slate
counterpart referenced in slot 9 below.

## The 9 card slots, every week

| # | Slot | Legs | Wager | Target | Notes |
|---|---|---|---|---|---|
| 1 | Master Round Robin | 8 legs, 4-team combos | $70-140 total | — | Biggest structural bet of the week |
| 2 | Moneyline Underdog Round Robin | 5-6 legs | ≤$30 total | — | Small, dog-heavy |
| 3 | Morning-Weighted Parlay(s) | varies | $20-30 each | $300-400+ | Heavy favorites AM, 1 confident PM leg, capped with SNF favorite |
| 4 | Afternoon-Weighted Parlay(s) | varies | $20-30 each | $300-400+ | Heavy favorites PM + AM favorites for value, capped with SNF favorite |
| 5 | Hybrid Parlay(s) | max 5-6 legs | ~$20 each | — | Highest-conviction picks only, spans both windows |
| 6 | SuperContest 5-teamer | 5 legs | — | — | Mirrors actual SuperContest picks; optional bought half-point or 1 open slot |
| 7 | Player Prop Parlays | multiple slips | $25-30 total | $300-400 on $5-10 slips | A couple moonshots + a few legit stacks. Runs every week alongside slots 3-5, not as a substitute. **Standing shape (from the Week 1 placements):** 7a Morning 6-leg ($5), 7b Afternoon 6-leg ($5), 7c Evening/SNF combos (DK Predictions 4/6/8-pick), 7d Hybrid 8-leg ($10), 7e Anytime TD 7-leg ($5) — see "Prop stack rules" below |
| 8a | First Touchdown Scorer Stack | 3 legs | $5 | Well above +7000 | Highest-variance TD market — who scores their game's literal first TD, not just any TD. Real example: 3 legs at +550/+300/+420 combined to +13,420 (that ticket was $40; ours targets $5) |
| 8b | 2+ Touchdown Scorer Stack | 3 legs | $5 | Well above +7000 (aspirational — 2+ TD props individually price shorter than First-TD-Scorer props, so 3 legs may not reach this; flag the realistic combined odds when building rather than force a number) | Favorite RB/skill players for 2+ TD in-game (e.g. Derrick Henry, Ashton Jeanty) |
| 9 | Island Game Props (Thu/Sun/Mon standalone slates only) | 3-4 separate stacks | varies | — | Sometimes split with Alejandro. Built on the locked 3-tier ladder: Tier 1 $10 @ +600-1000, Tier 2 $5 @ +1800-3000, Tier 3 "Moonshot" $5 @ +6500-20000, diversified legs per tier (no shared anchor across tiers) |

**Slots 3 and 4's SNF-favorite cap is deliberate, not incidental**: it keeps multiple tickets alive into the
night game specifically to create live hedge/middle opportunities (e.g. taking points on the underdog against
an already-covering favorite ticket).

## Round Robin build approach (slots 1-2) — resolved 2026-09-15

Andy wants a first-pass recommendation to react to for both Round Robins, the same way slots 3-8b get built
together. **Neither the in-repo BETTING agent nor the FUTURES chat agent is currently usable for this**:

- `agents/product/tier1/BETTING.md` (spec) and `src/components/agent/AgentChat.jsx` (chat UI) both exist in
  the repo, but the spec's own frontmatter says `status: draft` and `AgentChat.jsx` is never imported or
  rendered anywhere in `src/App.jsx` — there's no tab or route that reaches it. It's built but not wired in.
- `src/components/agent/FuturesAgentChat.jsx` is in the same state — present in the repo, not wired into
  `App.jsx`, no live entry point.
- The only tier-1 chat agent actually reachable in the running app is `PropsAgentChat.jsx`, under the Props
  tab (gated by `profileCanUseAI`) — and that's props-specific, not built for Round Robin game-line
  construction anyway.
- Separately, the `FUTURES` *pipeline* (`agents/portfolio-synthesize.js`, driven by
  `agents/product/tier1/FUTURES_PORTFOLIO_MASTER.md`'s synthesis prompt) is real and actively used by Andy for
  season-long futures via CLI — but that's a distinct system from the FUTURES chat agent, and it's a futures
  tool, not a weekly game-line Round Robin builder.

Practical upshot: until BETTING.md is taken out of draft and `AgentChat.jsx` gets wired into `App.jsx`, the
Round Robin first-pass recommendation for slots 1-2 gets built directly in a Cowork/Claude session — pulling
`data/secondary-matchups/latest.json`, line movement, and the sourcing tier below by hand — not via an
in-app agent tool call. Worth flagging to Andy as a real gap if he wants the BETTING agent live for this
going forward, rather than a one-off workaround.

**Methodology used for that manual build (reconciled 2026-09-15):** `agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md`
is a `docsOnly: true` manual-activation prompt (not wired into app code either, but directly usable by pasting
its activation block into a fresh chat). Its Best Bets Ranking Formula, Round Robin domain knowledge, and
Constraints & Safety Rules were updated this same date to match the Master RR (8 legs, 4-team, 70 combos,
$70-140) and Underdog RR (5-6 legs, 2-team, 10-15 combos, ≤$30) formats above, replacing a stale 5-game/10-combo
cap — and its Intel Integration Protocol / Required Reading now reference the real intel sources in this repo
(secondary-matchups, prediction-markets, podcast intel, article/Twitter intel, expert tracking, SuperContest CLV,
trench/IDP ratings, alpha packet, and the live `get_betting_splits`/CLV tools in `agentTools.js`) rather than
just `public/schedule.json`/`public/weekly_stats.json`. Use it as the standing methodology for the slot 1-2
first-pass build.

## Prop stack rules (slot 7) — added 2026-09-19 after the Week 1 Sunday prop tickets
- Build 7a–7e every week, split by kickoff window so each ticket's legs settle together; keep a night-game leg in the Hybrid and ATD tickets to keep them alive for live hedges.
- No QB rushing or INT props in stacks (Week 1: Allen O30.5 rush, Shough O18.5 rush, Geno O0.5 INT all missed).
- No 70+/80+ receiving ladders in SNF combos (all missed in Week 1); use 40+/50+/60+.
- Prefer legs with a streak/hit-rate source (4 straight vs this opponent, 90% L10) or a HIGH secondary-matchup tier over tight median lines.
- Highest-margin reads also go out as singles (BETTING_LESSONS_LEARNED.md).

## Build-day sequence

1. **Pull the board.** Parse the week's `docs/Player_Prop_Odds_Weekly` files and `public/schedule.json` fresh
   — never reuse last week's parsed data. Confirm morning/afternoon/SNF game groupings from the real schedule,
   not assumption.
2. **Roster/data trust check.** This season's data (prop board, `data/player-availability/latest.json`,
   schedule) is the only source of truth. No real-world prior-season roster cross-checks, ever.
3. **Exclude dead games.** Drop any game that's already been played (Thu/early-week slates) from every slot
   except the Island Game Props slot, which is built separately and earlier in the week for those specific
   games.
4. **Fill slots 1-2 (Round Robins) first**, since they're the largest stakes and most sensitive to price —
   build a first-pass recommendation directly (see "Round Robin build approach" above) for Andy to react to.
5. **Fill slots 3-5 (side/total-weighted + Hybrid parlays)**, applying the sourcing tier below to every leg
   before it goes in, and locking the SNF-favorite leg once so slots 3 and 4 share the identical selection.
6. **Fill slot 6 (SuperContest 5-teamer)** directly from that week's SuperContest picks — flag any half-point
   buy or open-slot decision explicitly rather than assuming.
7. **Fill slot 7 (Player Prop Parlays)** using the moonshot + legit-stack pattern from Week 1.
8. **Fill slots 8a and 8b (First TD Scorer Stack + 2+ TD Scorer Stack)** — 2 separate 3-leg, $5 tickets.
   Don't conflate the markets: First TD Scorer is who scores *first* in the game (higher variance, bigger
   payout ceiling); 2+ TD Scorer is anyone scoring twice-plus (lower variance, shorter individual odds — be
   upfront if 3 legs can't realistically clear +7000 at fair pricing rather than reaching for junk legs to
   force the number).
9. **Log every ticket to `data/official-picks/user-placed-wagers-2026.json` as Andy places it**, then run
   `node scripts/sync-placed-wagers-to-bankroll.mjs` and `node scripts/generate-live-tracker.mjs` once all of
   that week's tickets are in — never write to `public/`, Supabase, or any `data/futures-imports/*` file
   directly.

## Sourcing tier — check once per leg, before it goes in a card

1. **Matchup-data hit** (`data/secondary-matchups/latest.json` vulnerability tier + weakness tags) — strongest.
2. **Named expert, week-specific pick** from the podcast recommendations database — strong.
3. **Kalshi price check** (see below) — use when it beats the sportsbook price for a comparable outcome.
4. **Board price alone, no independent backing** — allowed, but flagged explicitly in the card as
   "price-driven" so Andy isn't surprised later.

## Kalshi & DraftKings Predictions

- **Kalshi**: `data/prediction-markets/latest.json` is a live, automated feed (Kalshi + Polymarket combined,
  refreshed same-day) with fee-adjusted `net_american_odds` already computed per contract — directly
  comparable to a sportsbook price. Mostly season-long futures, but also weekly per-player "Over X.X fantasy
  points" contracts. Check any player already going into a card against their Kalshi fantasy-points contract;
  flag it when Kalshi's net price beats the board.
- **DraftKings Predictions**: no live feed in this repo. Every DK leg has to come from Andy relaying what the
  app is currently showing before a card locks — I can't check it proactively the way I can Kalshi.
