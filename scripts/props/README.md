# Prop board tooling

Parses sportsbook prop board dumps into queryable JSON, and works out which players
are actually free to use on a new ticket.

Lived in `~/pp/` on the device VM through Week 2 and was wiped when the VM recycled
its scratch space — hence living in the repo now.

## Pipeline

```bash
# 1. parse the week's boards  (board dumps: docs/Player_Prop_Odds_Weekly/Week<N>/)
python3 scripts/props/beo.py   docs/Player_Prop_Odds_Weekly/Week2 data/generated/props/beo.json
python3 scripts/props/parse.py docs/Player_Prop_Odds_Weekly/Week2 data/generated/props/props.json

# 2. build last week's box stats for context
python3 scripts/props/mkw1.py data/fantasy/boxscores data/generated/props/w1.json

# 3. work out what's still spoken for  (re-run whenever legs grade)
node scripts/props/availability.mjs --week 2

# 4. scan
python3 scripts/props/c.py --book beo --game MIA_SF --market rec_yds \
        --max-juice -150 --limit 20 --w1 --avail
```

## Board revisions

A board re-pulled during the day lands as `BEO_Week2_MIA_SF_v2` alongside the
original. `beo.py` keeps only the highest revision per game, so a refresh replaces
the stale board instead of doubling it.

## Availability tiers

`--avail` tags every row against `data/generated/prop-availability.json`:

| Tag | Meaning |
|---|---|
| `FREE` | no pending leg on any live ticket |
| `~SOFT` | player is live on a ticket, but in a different market or at a different line |
| `!HARD` | exact same market and line already live — a true duplicate |

`--free` filters to FREE only.

**Why this exists.** A parlay is dead the moment one leg LOSES, but the book leaves
it `PENDING` until settlement. Week 2 treated "on any non-settled ticket" as
unavailable, which left 12 afternoon and evening players locked behind morning legs
that had already busted. `availability.mjs` decides on *liveness* instead: a player
is spoken for only if he has a PENDING leg on a ticket that can still win. Round
robins survive partial losses (an N-selection K-team RR dies only once fewer than K
selections remain), and a leg that already WON frees its player too.

Re-run step 3 whenever leg states change — `scripts/reconcile-settlement.mjs` is what
grades them.

## Parser note

BEO emits 13 player-market section headers. Any header the parser doesn't recognise
used to be invisible to it, so its rows silently continued the *previous* market —
that's how "Pass Attempts 32+" once surfaced as a passing-TD line. `beo.py` now
enumerates all 13 and hard-stops on anything unknown. Keep that behaviour.
