# 🎯 2026 In-Season IDP Breakout & Handcuff Watchlist

**Target Audience:** In-Season Roster Management, Waiver Wire Execution  
**League Context:** Rose Bowl (12-team redraft, 3 IDP starter slots, 1 IR bench slot)  
**Roster Directive:** The active roster carries only the minimum 3 required starting IDPs — all drafted from the Top 40 Unquestioned Starters. Players on this list are waiver wire targets only, added in-season under the two triggers below.

> **Data Sourcing Transparency**
>
> Player identities, team affiliations, and depth-chart relationships in this document are based on publicly available preseason reporting and editorial analysis (IDP Show, Footballguys, RotoBaller IDP preseason content). The specific percentages cited (e.g., "17.2% per-snap efficiency") are **editorial estimates from published IDP editorial sources, not computed by this pipeline.** They are labeled as such throughout. Treat them as informed context for waiver decisions, not as pipeline-verified metrics.
>
> When making in-season waiver decisions, verify current snap counts from the live box score data (`player_injuries`, nflverse snap-count releases) rather than from this document.

---

## Two Waiver Addition Triggers

Do **not** add any player from this list to your active roster unless one of the following conditions is met:

**🚨 Trigger 1 — The Injury Replacement Trigger:**  
The primary starter on the player's NFL team is ruled out for multiple weeks or placed on IR. The handcuff inherits 90%+ snap share and Green Dot/every-down duties. Add immediately, before FAAB resets.

**📈 Trigger 2 — The Snap Expansion Trigger:**  
A rotational player's defensive snap share exceeds **80% for two consecutive weeks**, signaling a role change to every-down starter. Add on the waiver wire before the expansion locks in.

---

## Priority 1: Elite Injury Handcuffs

Players who inherit an immediate every-down role and Green Dot snap share if the starter ahead of them misses time. Ranked approximately by how close they are to that scenario.

| Player | Team | Starter Ahead | Draft Board Rank of Starter | Intel |
|---|:---:|---|:---:|---|
| **Payton Wilson** | PIT | Patrick Queen | #187 | Plays a genuine rotational share behind Queen now. Per-snap tackle efficiency cited at ~17% in preseason IDP editorial *(editorial estimate — IDP Show preseason content)*. If Queen misses time, Wilson is a probable top-10 immediate add. |
| **Ventrell Miller** | JAX | Foyesade Oluokun | #127 | Nielsen's defense funnels mass inside tackles; the LB2 role is valuable. Miller secured the weakside starting spot in camp per preseason reporting. |
| **Josiah Trotter** | TB | Alex Anzalone | #204 | 2026 2nd-round pick. Bowles' heavy blitz front; add immediately if Anzalone is injured. |
| **Jihaad Campbell** | PHI | Zack Baun | #93 | Elite closing speed. Early-down rotation role now; inherits full Fangio 3-down workload if Baun is unavailable. |
| **Christian Elliss** | NE | Robert Spillane | #131 | Direct backup in Mayo's gap-control scheme. Clean role inheritance if Spillane goes down. |
| **Omar Speights / Shaun Dolac** | LAR | Nathan Landman | #157 | The Rams' single-LB Dime schema means whoever replaces Landman becomes the exclusive inside tackle earner. |
| **Dee Winters / Jaishawn Barham** | DAL | DeMarvion Overshown | #171 | Christian Parker's quarters scheme; fast-flow run fits. Monitor camp and Week 1 reports for which is LB2. |
| **Anthony Hill** | TEN | Cedric Gray | #89 | Explosive rookie; preseason snap counts suggest early-down rotation already. If Gray is hurt, Hill projects to immediate full-time usage. |

---

## Priority 2: Rotational Breakouts

These players currently log 45–75% of snaps in sub-packages or specialized pass-rush roles. Add them if Trigger 2 fires (80%+ snap share for two consecutive weeks).

| Player | Team | Current Role | Snap Est. *(editorial)* | Breakout Condition |
|---|:---:|---|:---:|---|
| **Dallas Turner** | MIN | EDGE / LB hybrid | ~62% *(editorial)* | Brian Flores pass-rush hybrid. Strong DraftSharks EDGE ranking. If he secures full early-down work, immediate add. |
| **Drue Tranquill** | KC | Sub-package blitzer | ~75% *(editorial)* | Spagnuolo's delayed-blitz weapon. High sack ceiling in favorable pass-volume matchups; useful flex add in big-play scoring formats. |
| **Quincy Williams** | CLE | Weakside 2-LB | ~78% *(editorial)* | Plays alongside Schwesinger. Violent run stopper; worth adding against run-heavy divisional opponents (BAL, PIT) even before Trigger 2. |
| **Jacob Rodriguez** | MIA | 3-down rookie WLB | ~72% *(editorial)* | Camp standout; locked into the LB2 role opposite Jordyn Brooks. Monitor if Anthony Weaver increases his sub-package responsibility. |
| **Sonny Styles** | WAS | S / LB hybrid | ~65% *(editorial)* | 9th overall pick. Dan Quinn tends to develop young LBs quickly. High ceiling add if snap share climbs past 80%. |
| **Arvell Reese** | NYG | WLB | ~60% *(editorial)* | 5th overall pick. Could track toward a full-time role by mid-season. Monitor weekly. |
| **Nick Emmanwori** | SEA | Box safety / LB hybrid | ~65% *(editorial)* | Mike Macdonald's Big Nickel chess piece; functions as a hybrid linebacker in run support. If he sees LB-eligible designations in your league's scoring platform, he becomes a priority add. |

---

## IR Slot Strategy

Rose Bowl carries exactly one IR bench slot. Candidates for it are surfaced automatically by `agents/fantasy-rose-bowl-build.js` (step 3b) at the end of the draft board, ranked by their ADP/ECR quality signal. The IR slot is best used on the highest-ADP-ranked player who:
- Is confirmed on a real team's IR (not waived/released — `MANUAL_FREE_AGENT_OVERRIDES` in the build script captures known cases the roster feed hasn't caught up to yet)
- Plays a rosterable position in Rose Bowl: QB, RB, WR, TE, or LB
- Has a realistic return timeline that falls within the season window

Do not use the IR slot speculatively on a player with no return timeline.
