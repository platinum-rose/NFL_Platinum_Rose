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

## Template for future entries

```
## Week N <day> — YYYY-MM-DD: <matchup> (final <score>)

### Headline
### Near-misses / margin notes
### Graveyard legs (correct reads that never got a standalone shot)
### Actionable takeaway for next card
```
