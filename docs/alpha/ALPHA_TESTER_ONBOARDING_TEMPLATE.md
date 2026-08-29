# ðŸ‘¥ NFL Dashboard Alpha Tester Onboarding Template & Architecture

> **Document Version:** 2.0.0 (Canonical)
> **Target Release:** NFL Dashboard 2026 Alpha
> **Source Schema:** `src/lib/profiles.js` & `src/lib/templates/alphaTesterTemplate.json`
> **Security Baseline:** Zero AI Chat, Zero API Key Storage, Zero Owner Portfolio Mutation, Read-Only Alpha Packet Data Flow.

---

## 1. Executive Summary & Philosophy

The NFL Dashboard Alpha architecture enables active league managers and sports bettors to test the application against their live fantasy rosters while strictly isolating private owner data, paid API keys, and active betting portfolios.

Every Alpha Tester profile binds:
1. **Tester Identity:** Clean ID (e.g. `amanda_rose`, `patrick_fagan`), real name, handle/nickname, contact email, and favorite NFL teams.
2. **Fantasy League & Roster Bindings:** Direct mapping to their team rosters across all 4 supported leagues (`the_league`, `honey_badgers`, `rfi_invitational`, `rose_bowl`).
3. **Usage Priorities & Focus Archetype:** Pre-configured dashboard layout, default landing hub, and widget priority rankings based on how they play fantasy football and bet.
4. **Draft Slot & Keeper Configurations:** Customized draft board positioning and keeper tracking (currently `undeclared` / in-evaluation).
5. **Betting & Contest Preferences:** Specialized widgets for SuperContest, Survivor pools, player props, or game totals.

---

## 2. Usage Priority Archetypes

When onboarding a new Alpha Tester, assign them one of the 6 canonical **Usage Priorities**:

| Usage Priority | ID | Default Landing Hub | Description & Priority Focus | Primary Dashboard Widgets |
|---|---|---|---|---|
| **Waiver & Injury Specialist** | `waiver_and_injuries` | `injuries` | High-stakes waiver grinder focused on real-time practice reports, SIC score recovery deltas, and touch/snap share trends. | `injury-wire`, `sic-score-trends`, `waiver-targets`, `target-share-deltas` |
| **Dynasty & Draft Architect** | `dynasty_and_draft` | `fantasy` | Long-term planner analyzing rookie athletic tiers, ADP market arbitrage, contract cliffs, and multi-year keeper locks. | `draft-cheat-sheet`, `adp-trend-tracker`, `rookie-tiers`, `keeper-value-matrix` |
| **Props & Matchup Bettor** | `props_and_odds` | `odds` | Weekly prop bettor tracking line movement, closing line value (CLV), referee trends, and team totals. | `prop-edge-finder`, `market-odds-board`, `official-picks-card`, `clv-tracker` |
| **Start/Sit & Lineup Optimizer** | `start_sit_optimizer` | `dashboard` | Sunday morning manager prioritizing red-zone touch projections, weather/wind alerts, and start/sit matchup difficulty. | `start-sit-comparator`, `red-zone-shares`, `matchup-grade-matrix`, `weather-wind-alerts` |
| **Multi-League Power User** | `multi_league_matrix` | `fantasy` | Cross-league contender managing exposure across multiple leagues and tracking player ownership conflicts. | `cross-league-roster-grid`, `player-exposure-portfolio`, `multi-league-matchup-tracker` |
| **General Scouting** | `general_scouting` | `dashboard` | Balanced overview covering team command centers, weekly schedules, injury reports, and expert intel. | `command-center-summary`, `weekly-schedule-board`, `expert-intel-feed` |

---

## 3. Official Alpha Tester Cohort Profiles

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                           2026 OFFICIAL ALPHA TESTERS                                            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Tester ID          â”‚ Name                 â”‚ Favorite Teams       â”‚ Associated Fantasy Teams & Leagues            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ amanda_rose        â”‚ Amanda Rose          â”‚ Buffalo Bills (BUF)  â”‚ â€¢ Honey Badgers: Olivators (Slot 7)           â”‚
â”‚                    â”‚                      â”‚                      â”‚ â€¢ The League: Wailin Raylans (Slot 6)         â”‚
â”‚                    â”‚                      â”‚                      â”‚ â€¢ Rose Bowl: Jukin Junies (Slot 8)            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ patrick_fagan      â”‚ Patrick Fagan        â”‚ Undetermined         â”‚ â€¢ Rose Bowl: LV Rosekillers (Slot 7)          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ matt_post          â”‚ Matt Post            â”‚ LV Raiders (LV)      â”‚ â€¢ The League: Postino's Banditos (Slot 11)    â”‚
â”‚                    â”‚                      â”‚                      â”‚ â€¢ Rose Bowl: Concussion Protocol (Slot 2)     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ matt_policare      â”‚ Matt Policare        â”‚ Undetermined         â”‚ â€¢ Honey Badgers: JRZ (Slot 8)                 â”‚
â”‚                    â”‚                      â”‚                      â”‚ â€¢ The League: Rafi Bomb Returns! (Slot 2)     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ alejandro          â”‚ Alejandro            â”‚ Bucs (TB), Rams (LAR)â”‚ â€¢ Honey Badgers: Jesus Take the Wheel (Slot 4)â”‚
â”‚                    â”‚                      â”‚                      â”‚ â€¢ Rose Bowl: Panda XL (Slot 11)               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Detailed Tester Context Dossiers:

1. **Amanda Rose (`amanda_rose`)**
   - **Primary Workflow:** Sunday morning lineup setting, waiver wire hunting, real-time injury monitoring.
   - **Favorite Team:** Buffalo Bills (`BUF`).
   - **Betting Interests:** SuperContest, occasional player props.
   - **Keepers:** Undeclared.
   - **Default Hub:** `dashboard` (Command Hub).
   - **Priority Widgets:** `start-sit-comparator`, `injury-wire`, `waiver-targets`, `supercontest-card`.

2. **Patrick Fagan (`patrick_fagan`)**
   - **Primary Workflow:** Weekly matchup scouting, player props, game spreads/totals, occasional futures.
   - **Favorite Team:** Undetermined.
   - **Betting Interests:** Game spreads, totals, player props, Survivor & SuperContest pools.
   - **Keepers:** Undeclared.
   - **Default Hub:** `odds` (Odds & Props Hub).
   - **Priority Widgets:** `market-odds-board`, `prop-edge-finder`, `supercontest-card`, `survivor-matrix`, `futures-board`.

3. **Matt Post (`matt_post`)**
   - **Primary Workflow:** Dynasty draft strategist (deep scouting, rookie athletic profiles, ADP market value, contract cliffs), weekly matchup grinding, Pick'em/Survivor.
   - **Favorite Team:** Las Vegas Raiders (`LV`).
   - **Betting Interests:** Pick'em pools, Survivor pools.
   - **Keepers:** Undeclared.
   - **Default Hub:** `fantasy` (Fantasy Command Hub).
   - **Priority Widgets:** `draft-cheat-sheet`, `rookie-tiers`, `adp-trend-tracker`, `matchup-grade-matrix`, `survivor-matrix`.

4. **Matt Policare (`matt_policare`)**
   - **Primary Workflow:** Active waiver wire & injury recovery tracking, draft value hunting, weekly sides/totals betting, Pick'em/Survivor/SuperContest.
   - **Favorite Team:** Undetermined.
   - **Betting Interests:** Game spreads, totals, Pick'em, Survivor, SuperContest.
   - **Keepers:** Undeclared.
   - **Default Hub:** `injuries` (Injuries & Practice Wire).
   - **Priority Widgets:** `injury-wire`, `sic-score-trends`, `waiver-targets`, `market-odds-board`, `supercontest-card`, `survivor-matrix`.

5. **Alejandro (`alejandro`)**
   - **Primary Workflow:** Player props specialist (passing yards, rushing/receiving overs, anytime touchdown scorers, same-game parlay prop stacks) & fantasy matchup edges.
   - **Favorite Teams:** Tampa Bay Buccaneers (`TB`), Los Angeles Rams (`LAR`).
   - **Betting Interests:** Passing props, rushing overs, receiving overs, anytime TDs, parlay stacks.
   - **Keepers:** Undeclared.
   - **Default Hub:** `odds` (Odds & Props Hub).
   - **Priority Widgets:** `prop-edge-finder`, `anytime-td-matrix`, `same-game-parlay-builder`, `target-share-deltas`.

---

## 4. Standardized Onboarding Intake Questionnaire (For Future Testers)

Copy and send this questionnaire to any new candidate joining the Alpha testing team:

```markdown
### ðŸˆ NFL Dashboard Alpha Tester Questionnaire

1. **Personal Information:**
   - Full Name:
   - Nickname / Preferred Handle:
   - Contact Email:

2. **Fantasy Football Leagues & Teams:**
   - Which league(s) are you participating in? (The League / Honey Badgers / RFI Invitational / Rose Bowl)
   - What are your exact team names in each league?
   - What are your 2026 draft slot positions (if known)?
   - Are there specific keeper locks you have already declared?

3. **Primary Dashboard Workflow:**
   - What do you care about most on the dashboard?
     [ ] Sunday morning start/sit & lineup optimization
     [ ] Waiver wire grinding & touch/snap share trends
     [ ] Real-time practice & injury recovery tracking (SIC Scores)
     [ ] Dynasty draft board kits & rookie athletic scouting
     [ ] Player prop lines & same-game parlay builders
     [ ] Game spreads, totals & line movement (CLV)
     [ ] Multi-league roster exposure matrix

4. **Betting & Contest Interests:**
   - Do you participate in:
     [ ] SuperContest
     [ ] Survivor Pool
     [ ] Weekly Pick'em
     [ ] Player Props (Passing, Rushing/Receiving, Anytime TDs)
     [ ] Game Spreads & Over/Unders
     [ ] Season Futures & Division Winners

5. **Favorite NFL Teams:**
   - Which team(s) would you like pinned or prioritized across game slates?
```

---

## 5. Developer Onboarding Implementation Workflow

When adding a new tester after receiving their intake form:

1. **Add Definition to `src/lib/profiles.js`:**
   Insert a new tester object into `ALPHA_PRESET_PROFILES` with clean ID (`<first_name>_<last_name>`), team bindings, usage priority, default hub, and favorite teams.

2. **Add Unit Test Assertion to `tests/unit/alphaProfiles.test.js`:**
   Add a test case verifying their name, team bindings, leagues, and favorite teams.

3. **Run Unit Tests:**
   ```powershell
   npx vitest run tests/unit/alphaProfiles.test.js
   ```

4. **Rebuild Static Alpha Data Packet:**
   ```powershell
   node scripts/build-alpha-data-packet.js
   ```

5. **Verify All Suites:**
   ```powershell
   npx vitest run tests/unit/alphaPacket.test.js tests/unit/alphaDataPacket.test.js tests/unit/alphaProfiles.test.js
   ```

---

## 6. Security & Isolation Invariants

All Alpha Tester builds must strictly adhere to the following security invariants:

1. **Zero AI / Agent Chat Access:** `canUseAI: false` and `agents: []` prevent testers from consuming backend LLM tokens or calling AI agents.
2. **Zero API Key Storage:** `canStoreApiKeys: false` blocks local or cloud storage of paid API credentials (TheOddsAPI, FantasyPros, Action Network).
3. **Owner Portfolio Isolation:** `ownerPortfolioAccess: false` and `blockedFeatures: ['owner-futures-portfolio', ...]` strictly hide the owner's real bankroll balances, betting slips, and private futures allocations.
4. **Local REST / Storage Scoping:** Any bets placed by an Alpha tester are stored strictly in local browser storage (`alpha-local-tracking`) without mutating the owner's production pick ledger.
