# Futures Portfolio Strategy — Andy Rose (Platinum Rose)

> **Version:** 1.0 · **Created:** 2026-06-26 · **Author:** Andy Rose via ATLAS S223  
> **Loaded by:** BETTING agent at session start · ANALYST agent for strategy R&D · WEEKLY_BETTING_ANALYST for portfolio context  
> **Companion file:** `data/futures-imports/open-parlays-2026.json` — structured inventory of live open parlay tickets

---

## 1. Philosophy

The goal of this futures strategy is not to win individual bets — it is to **engineer a self-financing hedge network** that compounds in value as the NFL season progresses. Each position is chosen with downstream optionality in mind: can it fund or justify a future position? Does it create a hedge opportunity in the postseason bracket? Does it reduce the effective cost of a longer-odds position?

Early legs are not profit vehicles. They are **cost-basis reduction engines** for the positions that pay large.

---

## 2. The Three-Tier Bet Structure

Every team in the portfolio is evaluated for a "leg stack" — one or more of the following tiers:

### Tier 1 — Playoff Entry (the recoup engine)
- **Odds range:** -180 to +200 (high probability)
- **Purpose:** Recoup 30–40% of the Tier 2 cost when it hits. Not a profit play — a cost reducer.
- **Sizing rule:** Size so the win amount = 35% of the Tier 2 stake on that team.
  - Example: $50 Tier 2 stake → Tier 1 sized to win ~$17.50
  - At -120: risk ~$21 to win $17.50
- **Effect:** After Tier 1 hits, Tier 2 is effectively a "partial free roll." The SB ticket still costs something, but far less than face value.

### Tier 2 — Super Bowl Winner (the core position)
- **Odds range:** +400 to +3000 (longshot to mid-tier)
- **Purpose:** The primary profit vehicle for each team. The size of this position drives the portfolio math.
- **Sizing rule:** ~5–7% of the season's futures bankroll (F) per team. With a max of 10–12 teams, total exposure = 50–84% of F.
- **Do not stack Tier 2 on extreme favorites** (under +350 SB odds). The implied probability is already too high; the upside doesn't justify the capital.

### Tier 3 — Super Bowl Exact Matchup (the crown)
- **Odds range:** +7500 to +30000 (75:1 to 300:1)
- **Purpose:** Portfolio multiplier. If both teams in a matchup make the playoffs, the entire postseason bracket becomes a hedge network on that ticket.
- **Sizing rule:** Flat $10–25 per ticket, or ~1% of F. Small enough to hold 10–15 matchup tickets.
- **Selection criteria (either or both):**
  1. **Mathematical:** Both teams have credible playoff paths. At least one team already in the portfolio at Tier 2.
  2. **Narrative:** A compelling story that would drive public attention and potentially favorable line movement mid-season. The Rodgers/McCarthy Steelers vs. Packers is the canonical example — two former teammates/coaches facing each other in the Super Bowl after previously winning together.

### Conference Championship (selective — Tier 1.5)
- Used sparingly, primarily as a **hedge engine against main AFC contenders** in the portfolio.
- Example: holding Chargers AFC Championship creates a hedge against Bills/Ravens/Steelers SB tickets if one of those contenders loses the AFC Championship game.
- Look for longshot AFC teams at +300 to +600 with a credible path through a weak division.
- Do not add conference legs on favorites already in the portfolio at Tier 2 — the juice is too tight for the hedge value.

---

## 3. Portfolio Construction Rules

1. **Max 10–12 teams.** Beyond this, the portfolio becomes impossible to track and the hedge chains overlap destructively.
2. **Minimum 2 tiers per core team.** A standalone SB bet with no playoff entry leg is an unhedged position — avoid.
3. **Diversify across conferences.** At least 3–4 NFC teams and 3–4 AFC teams. All-AFC or all-NFC portfolios eliminate cross-conference SB matchup opportunities.
4. **At least 1 "narrative bet" team** in the Tier 3 matchup book — a team whose story (coach situation, redemption arc, rivalry) creates a matchup ticket with outsized narrative premium.
5. **Reserve 15–20% of F for in-season adds.** Do not deploy the full futures bankroll in August. Opportunities arise during the season that are often better priced than preseason.

---

## 4. Entry Calendar

### Preseason Core (August 1 – September 10)
- Set the base portfolio before Week 1 kickoff (2026 season starts Thursday, September 10).
- August is the window: depth charts settle, camp injuries clarify paths, lines are freshest.
- Target: 6–8 teams with full leg stacks (Tier 1 + Tier 2) and 5–10 Tier 3 matchup tickets.
- Also create new NFL open parlays during the preseason (5–7 team parlays with 1–2 open slots) that can be shelved for playoff use.

### Early Season Opportunistic Window (Weeks 1–4)
- Watch for teams that were overlooked preseason but show something in the first few weeks.
- Triggers:
  - Team outperforming record (3-1 but the market hasn't moved their futures line yet)
  - Key rival QB injury opening up a division or conference path
  - Sharp line movement on a team's futures that hasn't yet reflected on the public books
- Can still add new leg stacks for teams not in the preseason portfolio.

### Mid-Season Window (Weeks 5–9)
- Add only when the signal is very strong. The odds on a team that's clearly good have already moved.
- Best use of mid-season: deepening existing positions (adding a Tier 3 matchup ticket on a team already in the portfolio that has exceeded expectations).
- **Hard stop for new positions: after Week 9.** By mid-season the paths are clearer, but the odds reflect it.

### Playoff Window (Postseason)
- No new futures positions. The portfolio is set.
- All activity is hedge execution: using open parlays, Tier 1 recoup math, and Tier 3 matchup insurance.
- See Section 6 for the hedge playbook.

---

## 5. Sizing Framework (Kelly-lite)

Define **F** = your total futures bankroll for the season.

| Position | Size | Notes |
|---|---|---|
| Per-team max (all tiers combined) | 10% of F | Hard cap. One team cannot exceed this. |
| Tier 2 (SB Winner) per team | 5–7% of F | Core position. |
| Tier 1 (Playoff Entry) per team | Calculated | Win amount = 35% of Tier 2 stake |
| Tier 1.5 (Conference) per team | 2–3% of F | Only for hedge-engine plays |
| Tier 3 (SB Matchup) per ticket | 1% of F or $10–25 flat | Whichever is smaller |
| Open parlay creation budget | 5–8% of F | Preseason parlay stakes for new open parlay tickets |
| In-season reserve | 15–20% of F | Do not deploy until a clear opportunity arises |

**Tier 1 sizing formula:**
```
tier1_stake = (tier2_stake × 0.35) / (1 / (1 + (|odds| / 100)))
```
At -120: `(tier2_stake × 0.35) / 0.545`

Example: Tier 2 = $50 → Tier 1 stake = $50 × 0.35 / 0.545 = **$32.11** → wins **$17.50** if it hits

---

## 6. Open Parlay Integration

Bookmaker allows parlays with 1–2 "Open Slots" that can be filled with any side or total up to ~1 year later.

### What they are
A standard parlay where the base legs (typically 4–6 heavy CBB or NFL favorites) have already won. The remaining open slots are **free hedge instruments** — the original stake is already lost/spent; the potential payout is pure upside.

### How to use them in the NFL portfolio

**Crown jewel tickets ($800+):** Save both open slots for the postseason exclusively. Fill only when a specific playoff hedge situation has been identified. Do not waste a slot on a regular season ML.

**Mid-tier tickets ($300–$600):** Flexible. Can use one slot mid-season on a very high-confidence side/total to "bank" that leg. Save the second slot for playoffs.

**Single-slot tickets:** Reserve for a targeted playoff situation already identified.

### Playoff hedge use case (the core play)
Scenario: Team A (in your SB futures portfolio) is playing Team B (an underdog you have no ticket on) in the playoffs.
- Fill an open parlay slot with **Team B + the points**.
- If Team B loses but covers the spread → open parlay wins outright + Team A's futures ticket is still alive.
- If Team A wins outright → futures ticket advances; open parlay loses that slot but you still have the remaining open slot.
- Net effect: insured coverage on the spread side while your futures chain remains intact.

### Current open parlay inventory (2026 season)
See `data/futures-imports/open-parlays-2026.json` for the full structured inventory.

| Ticket | Potential Win | Open Slots | Priority |
|---|---|---|---|
| #730888303 | $1,109.46 | 2 | 🔴 Crown — playoffs only |
| #730737412 | $850.71 | 2 | 🔴 Crown — playoffs only |
| #730846806 | $415.07 | 1 | 🟡 Save for specific playoff spot |
| #731062665 | $350.21 | 2 | 🟡 1 slot mid-season OK, 1 for playoffs |
| #731063264 | $345.99 | 2 | 🟡 1 slot mid-season OK, 1 for playoffs |
| #731536472 | $255.68 | 2 | 🟢 More flexible — both slots usable |

**Total potential:** $3,327.12 across 11 slots · All tickets expire ~March 2027 (usable through Super Bowl)

---

## 7. Hedge Engineering Playbook

### The Cost-Basis Cascade

The core mechanic: each leg that hits **reduces the effective cost** of all downstream legs on that team.

```
Effective SB cost = SB stake - Σ(winnings from all prior legs on this team)
Effective SB payout = SB payout / Effective SB cost
```

Example (Packers portfolio):
- Tier 1 (Playoffs): $22 at -120 → wins $20 if Packers make playoffs
- Tier 2 (SB): $50 at +2416 → pays $1,208 if Packers win SB
- After playoffs hit: Effective cost = $50 - $20 = $30 · Effective payout = $1,208 / $30 = 40.3:1 (+4030)

### The Conference Hedge

If holding a longshot AFC team (e.g., Chargers) at AFC Championship odds, and main AFC contenders (Bills, Ravens, Steelers) are in the portfolio:

- If Chargers win the AFC → Chargers AFC Championship ticket wins, AND it creates a hedge on which AFC team you'll face in the SB.
- Fill an open parlay slot with the Chargers ML in a late-season or playoff game to compound the return.

### The Matchup Insurance Play

When a Tier 3 SB Matchup ticket is live and both teams reach the playoffs:

1. Identify which team is the underdog in each playoff game.
2. Fill open parlay slots with the underdog + points for the games involving your Tier 3 matchup teams.
3. Each parlay win is pure profit; each loss keeps the matchup ticket alive for the next round.
4. If both teams reach the Super Bowl: Tier 3 pays 75:1 to 300:1, and the postseason parlay wins are bonus.

---

## 8. What the Intel Report Must Surface

The futures intel report should function as a **portfolio construction tool**, not just an odds table. Required sections for the futures strategy:

### Mandatory
- **SB Matchup odds** with implied probability for both teams reaching the Super Bowl
- **"Hedge engine" candidates:** Longshot AFC conference teams (+400 to +700) with a viable division path — annotated with "creates hedge against [Team X]"
- **Portfolio construction recommendations:** "If you hold [Team A] at SB +800, a [Team B] playoff entry at +150 creates this hedge structure: ..."
- **Value spots:** Cases where sharp books (BetOnline, Bookmaker) price a team meaningfully tighter than public books — actionable signal

### Important
- **Line movement on playoff odds:** A team whose playoff line has drifted but whose SB line hasn't caught up yet is a mid-season add opportunity
- **Narrative bet candidates:** Teams with a compelling storyline whose matchup odds may be underpriced relative to the story's media traction
- **Path analysis:** For Tier 3 matchup consideration — "Team A's path to the Super Bowl requires beating X, Y, Z; current implied probability = N%"

### Nice to have (Phase 4)
- **Recommended position sizing** given the current portfolio (if portfolio data is loaded)
- **Hedge math on existing positions** — for each team in the current portfolio, show the effective cost and effective payout as of the current moment

---

## 9. Disciplines Never to Break

- **Never recommend selling/cashing out a futures position early.** The hedge chain depends on the ticket being live.
- **Never recommend adding a new SB futures position after Week 9.** The odds no longer compensate for the compressed path.
- **Never fill a crown parlay slot ($800+) on a regular season game.** Save for the postseason.
- **Never stack Tier 2 on a team with SB odds under +350.** The return doesn't justify the capital.
- **Never put a Tier 1 leg on a team without also holding Tier 2.** A standalone playoff entry bet with no SB ticket has no downstream purpose in this strategy.
- **When in doubt on parlay slot use, wait.** A slot unfilled is more valuable than a slot used prematurely.
