# NFL_Dashboard — Betting Lessons Learned

Durable, reusable lessons from graded tickets, kept separate from `.atlas/lessons-learned.md`
(which is engineering/dependency lessons). Each entry is keyed to the game/date that produced
the lesson. Read this before building a new betting card, not just when reviewing a past one —
these are meant to change how the *next* card gets built, not just document history.

---

## Week 2 TNF — 2026-09-17: DET @ BUF (final BUF 41, DET 31)

### The headline number: 14 of 18 unique player-prop legs hit clean. Tickets still net-lost more than they won.
Across the 6 settled TNF tickets, 14 of 18 unique player-prop legs graded WON — a strong hit
rate on the actual reads. But 5 of the 6 tickets were multi-leg parlays, and each of those 5
lost anyway, because a parlay only needs ONE leg to miss. The lesson isn't "the reads were
bad" (they mostly weren't) — it's that **parlay construction converts a good hit rate into a
bad ticket record** by forcing every leg, including the shakiest one, to be correct
simultaneously.

### Near-misses, not blowouts — margin matters more than result
- Jared Goff 0 INT prop: needed 1+, Goff threw a clean game (0 INT) — a total miss on a
  coinflip-type prop, not a squeaker.
- Khalil Shakir receiving yards: missed by 6.5 yards (38 actual vs. 44.5 line).
- Khalil Shakir receptions: missed by exactly 1 catch (3 actual vs. 4 needed).
- Jameson Williams anytime TD: scoreless night, needed 1+.
Two of the four misses (Shakir's two props) were razor-thin — a single extra catch or one more
short gain would have flipped them. That's a signal to size confidence/stakes by how variance-
sensitive a prop is, not just whether the read is directionally right.

### Graveyard legs — correct standalone reads buried inside parlays that busted elsewhere
These hit as legs but never had a chance to pay out on their own because they were bundled with
the props above that missed:
- James Cook rushing yards — cleared its line by **+54.5 yards**.
- Josh Allen rushing yards — cleared its line.
- Dalton Kincaid receiving yards — cleared its line by **+40.5 yards**.
- Jahmyr Gibbs receiving yards — cleared its line by **+29.5 yards**.
- Rousseau 0.5 sacks — actual 2 sacks, cleared the line cleanly (this one was incorrectly
  recalled mid-session as a "miss" before being re-verified against the graded data; it never
  missed — flagged here as a reminder to verify against `data/official-picks/*.json` before
  trusting recall of what happened on a card).

**Actionable takeaway for future card construction:** legs with this much margin (clearing a
line by 30-55 yards, or a sacks prop hitting 4x the line) are the ones with the most edge on the
board. Bundling a high-margin read into a large parlay with 1-2 coinflip props (like a 0-INT
prop or a tight receiving-yards line) risks burying the highest-conviction read under the
lowest-conviction one. Consider firing the highest-margin reads as smaller standalone/2-leg
tickets alongside — not only inside — the bigger parlays, so a single weak leg elsewhere on the
card doesn't erase a clean, well-margined win.

### Process note
All grading this session was done by hand against the real ESPN final boxscore
(`site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=<id>`), not assumed or
recalled from memory — worth continuing as standard practice given the Rousseau recall slip
above.

---

## Process note — 2026-09-21: Claude wrongly flagged real players as "data contamination" (stale roster knowledge)

### What happened
Building the MNF (NYG @ LAR, Week 2) prop stacks, Claude flagged Isaiah Likely, Patrick
Ricard, and Najee Harris as a scraper contamination bug -- "Ravens/Chargers players who
shouldn't appear on this board" -- and excluded them from consideration. Andy corrected this:
all three actually signed with the Giants in 2026 free agency (John Harbaugh brought
several ex-Ravens players with him when he became Giants HC). The root cause: Claude's
training-data knowledge cutoff is January 2026, before that free-agency period, so it judged
"who plays for which team" from stale memory instead of checking a live source. The captured
board data was correct; Claude's read of it wasn't.

### Standing rule going forward
Never judge a player's current team from Claude's own training knowledge. Before building
any prop stack or flagging any player as misattributed/contaminated data:
1. Cross-check every player against `data/nfl-rosters/roster-map-latest.json` first (check its
   `generated_at` timestamp -- if it's more than a few days old, treat it as possibly stale too).
2. If a player's team looks surprising, unfamiliar, or contradicts what the roster map says,
   verify with a live web search (official team site or a current-season source) before acting
   on the assumption -- never conclude "contamination" or "wrong roster" without that check.
3. Same standard applies to injury status: `data/player-availability/*.json` has known
   classification bugs (see HANDOFF.md 2026-09-19 entry -- active-news blurbs misclassified as
   injuries, e.g. Myles Garrett falsely flagged for LAR). Pull the actual final/game-day injury
   report from team sites or a live search close to kickoff rather than trusting that file
   alone for anything going into a real-money pick.

## Process note — 2026-09-21: quant prop model FAILED validation; what survived

### The test
Built a projection model for the MNF NYG@LAR board (blend 2026 usage with 2025 per-game
baseline; Poisson for counting stats, gamma for yardage), then backtested it against the 73
gradeable legs in `data/official-picks/user-placed-wagers-2026.json` using only
information available before each game.

**Result: Brier 0.2583 vs 0.2500 for simply predicting the base rate. Skill = -3.3%.**
Calibration was near-inverted: the model's 65-80% confidence bucket hit 40%, while its
35-50% bucket hit 59%. The model has no demonstrated predictive skill and its "edge %"
column must not be used to size or select bets. Script: `scratch/backtest-prop-model.py`.

First version of the model was even worse and failed an obvious smell test: with a flat
55/45 blend and only ONE 2026 game played, it recommended almost exclusively Giants props
— it was just extrapolating NYG's Week 1 three-TD game and LAR's 155-yard dud. Shrinkage
(`PRIOR_GAMES` per stat class) fixed the tilt but not the lack of skill.

### What DID survive (direct observation, not model output)
1. **Yardage props are bimodal, not tight.** Across 32 unique graded yardage legs, winners
   cleared by an average of +45.7 (receiving) / +32.8 (rushing) yards; losers missed by
   -27 / -17. These outcomes do not cluster near the line, so paying -110 for the standard
   number is poor structure. Ladder hit rates: +0 yds 56.2%, +20 yds 43.8%, +30 yds 31.2%.
   **Caveat: n=32, and the 90% bootstrap CI on the +20 rung is [28.1%, 59.4%] — fair price
   anywhere from -146 to +256. The direction is suggestive; the optimal rung is NOT
   statistically established. Do not treat this as a proven edge.**
2. **Reception props are genuinely tight.** Winners cleared by +1 to +3.5, losers missed by
   -0.5 to -2.5. This is the one market where the line really does sit near the median, so
   laddering it up is expensive and short prices on low-target players are traps.
3. **The -120..-100 price band is where the bleeding is.** 37 graded legs there, 45.9% hit
   rate — below the ~52% breakeven. Meanwhile legs at -200 or shorter went 12/15 (80%).
   Most legs are being taken in the worst-priced band on the board.
4. **Market-type hit rates (graded legs):** rushing_yards 8/11, passing_touchdowns 7/8,
   anytime_touchdown 14/26, receiving_yards 11/24, spread 8/23, passing_yards 0/3.

### Two data-integrity bugs found while doing this
- **Name mismatch between the board and the roster map.** The sportsbook writes "Cameron
  Skattebo", "Odell Beckham", "Thomas Fidone"; `data/nfl-rosters/roster-map-latest.json`
  has "Cam Skattebo", "Odell Beckham Jr.", "Thomas Fidone II". An exact-match roster check
  silently fails on these. `scratch/verify-mnf-cards.py` now resolves via a normalized
  first-initial + surname key; any automated roster gate needs the same.
- **nflverse codes the Rams as `LA`, the roster map as `LAR`.** Filtering stats on 'LAR'
  returns zero Rams rows and looks like missing data rather than a key mismatch.

### Actionable for card construction
Build from verified ROLE (who actually got the touches last week) rather than from a
projected mean. Week 1 checks that changed this card set: Isaiah Likely 8 tgt/8 rec/78
yds/2 TD as Harbaugh's featured TE; Najee Harris was a **healthy scratch**; Terrance
Ferguson and Konata Mumpfield combined for 0 receptions on 2 targets — an earlier draft of
tonight's moonshot required 5+ and 6+ catches from those two, which was a dead ticket
before kickoff.

## Week 2 MNF — 2026-09-21: NYG @ LAR (final LAR 28, NYG 6)

### Headline (Andy's lesson): a QB injury kills the whole offense he fronts, not just his own props
Jaxson Dart left in Q1 with a knee injury (3/5, 20 yds, 0 rush yds) and Jameis Winston played
the rest (11/27, 111 yds, 0 TD, 1 INT). All 6 MNF tickets lost ($50 risk). The damage went well
beyond Dart's own four legs. Across the 6 tickets, **19 legs depended on the Giants offense or
the game total, and only 4 won**. The Rams-side legs went 8/15 (1 still pending). Dead legs
beyond Dart's own: Nabers 61.5+ rec yds (x2, actual 1), Singletary TD and 2+ rec (x2, actual
0/0), Likely TD, Skattebo rushing (x2, 36 vs 52.5/42.5), Giants +7 (lost by 22) and both
Overs (34 vs 45.5/46).

### What held up anyway
- **Short-volume reception legs survived the backup QB.** Likely 4+ rec (5 on 10 targets, x2)
  and Malachi Fields 2+ rec / 27+ yds (2 for 30) all won. Winston threw 27 times while
  chasing the game, so low-bar catch counts still got there. Yardage, TD and rushing legs
  did not.
- **The injured QB's own defense picks up tackle volume.** Greg Newsome II
  3+ tackles hit at 5. An offense that can't sustain drives keeps its own defense on the
  field longer.
(One game, so treat these two as observations, not established edges.)

### Grading note
A starter who takes the field and then gets hurt is **action**, not void. Dart's legs graded
as normal losses. In the live tracker the 🚑 Out flag is only a label (decoupled from Burnt
as of 2026-09-22) and does not change grading.

### Actionable takeaway for next card
1. **Treat each offense's starting QB as a shared single point of failure.** Every leg on
   that offense (his props, his receivers and backs, his team's side, the Over) is really one
   correlated bet on him staying healthy. Count them as one exposure when building a ticket.
2. **Cap how many legs on any one ticket depend on the same offense**, especially in
   Island Game stacks, where every leg comes from one game. That extends the existing
   diversify-across-tiers rule: tiers should not all hinge on the same QB either.
3. **Before kickoff, scan the card for QB concentration.** If most of the slate's tickets
   need the same QB, that's the card's biggest risk, even if every individual read is sound.
4. For backup-QB scenarios, low-bar reception counts on the primary targets are the most
   robust legs on that offense. Yardage, TDs and the Over are the most fragile.

---

## Template for future entries

```
## Week N <day> — YYYY-MM-DD: <matchup> (final <score>)

### Headline
### Near-misses / margin notes
### Graveyard legs (correct reads that never got a standalone shot)
### Actionable takeaway for next card
```
