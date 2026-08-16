# Platinum Rose AI — Dashboard Matchup Card Legend & Data Guide

This guide details all actionable intel inputs, visual badges, and metrics rendered on the **NFL Dashboard Matchup Cards**.

---

## 🏈 1. Game Header & Market Lines

* **Kickoff Timestamp & Venue**: Local UTC kickoff time and stadium venue.
* **Consensus Spread & Total**: Live de-vigged market lines across major sportsbooks (DraftKings, FanDuel, BetMGM, Caesars, Circa).
* **Live Odds Sync Button**: Synchronizes live market movements directly from The-Odds-API.

---

## 📊 2. Actionable Intelligence Badges

| Badge Indicator | Source Data | Description & Actionability |
|---|---|---|
| 📈 **Money % vs Public %** | `game_splits` | Detects **Reverse Line Movement (RLM)** and sharp money action (e.g. 70% of money on Bills despite 60% of public tickets on Chiefs). |
| 🛡️ **Expert Consensus** | `expertConsensus` | Aggregates consensus recommendations across tracked sharp handicappers (e.g. 5/6 sharp experts on Bills -2.5). |
| ⚡ **Win Sim Probability** | `simResults` | Monte Carlo season & matchup simulation output displaying model win % and fair probability. |
| 🏥 **Injury & Availability** | `player_availability` | High-impact availability status (Out, PUP, IR, Questionable) with position cluster warning chips (e.g. OL cluster risk). |
| 🎯 **Player Prop Stack** | `candidate_proposals` | Evaluates player prop stacks (e.g. Josh Allen Over 295.5 Pass Yds + Stefon Diggs Anytime TD). |

---

## 🤖 3. Persistent Multi-Mode AI Assistant Sidebar

The sidebar docked on the right side of the screen allows instant mode-switching between 4 specialized AI agents:

1. 🎯 **Sides & Totals Agent**: Analyzes spreads, game totals, key numbers (3, 7), and weather/venue impacts.
2. 🏆 **Futures Portfolio Agent**: Manages Super Bowl, Conference, Division, and Win Total portfolio hedging and fair-value gaps.
3. ⚡ **Player Props Agent**: Parses prop odds, yardage thresholds, and matchup usage stacks.
4. 🏈 **Fantasy & Survivor Agent**: Integrates FantasyPros ECR, ADP value scores, and survivor pool optimal choices.
