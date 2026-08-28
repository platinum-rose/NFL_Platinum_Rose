# ðŸ‘¥ NFL Dashboard Alpha Tester Onboarding Template & Architecture

> **Document Version:** 1.0.0 (Canonical)
> **Target Release:** NFL Dashboard 2026 Alpha
> **Source Schema:** `src/lib/profiles.js` & `src/lib/templates/alphaTesterTemplate.json`
> **Security Baseline:** Zero AI Chat, Zero API Key Storage, Zero Owner Portfolio Mutation, Read-Only Alpha Packet Data Flow.

---

## 1. Executive Summary & Philosophy

The NFL Dashboard Alpha architecture enables curated fantasy football managers and sports bettors to test the application while strictly isolating private owner data, paid API keys, and active betting portfolios.

Every Alpha Tester profile binds:
1. **Tester Persona & Identity:** Real name, handle/nickname, contact, and favorite NFL teams.
2. **Fantasy League & Roster Bindings:** Direct mapping to their team rosters across all 4 supported leagues (`the_league`, `honey_badgers`, `rfi_invitational`, `rose_bowl`).
3. **Usage Priorities & Focus Archetype:** Pre-configured dashboard layout, default landing hub, and widget priority rankings based on how they play fantasy football and bet.
4. **Draft Slot & Keeper Configurations:** Customized draft board positioning and multi-year keeper locks.

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

## 3. Initial Alpha Tester Cohort

The following 5 curated personas represent the core Alpha Testing group:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                           2026 ALPHA TESTER COHORT                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Tester ID     â”‚ Persona Name     â”‚ Nickname / Team     â”‚ Primary Focus         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ alpha_brian   â”‚ Brian            â”‚ Dolphin Boobiez     â”‚ Waiver & Injuries     â”‚
â”‚ alpha_dave    â”‚ Dave             â”‚ Olivators           â”‚ Dynasty & Draft       â”‚
â”‚ alpha_marcus  â”‚ Marcus           â”‚ Sir Nix A Lot       â”‚ Props & Matchup Odds  â”‚
â”‚ alpha_sarah   â”‚ Sarah            â”‚ Any Given Sun God   â”‚ Start/Sit Optimizer   â”‚
â”‚ alpha_alex    â”‚ Alex             â”‚ Fat Lazy Americans  â”‚ Multi-League Power    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 4. Step-by-Step Onboarding Workflow

Follow this procedure whenever a new Alpha Tester is added:

### Step 1: Gather Intake Information
Collect the tester's details using the **Alpha Tester Intake Form**:
- **Full Name & Nickname:** e.g., `"Jordan Smith"` (`"Smitty"`)
- **Email:** e.g., `jordan@example.com`
- **Assigned Usage Priority:** Pick 1 of 6 from Section 2 (e.g., `props_and_odds`).
- **Participating Leagues & Team Names:**
  - League: `honey_badgers` â†’ Team: `"Jesus take the wheel"` (Team ID: `5`)
  - League: `rose_bowl` â†’ Team: `"CallinginSickMonday"` (Team ID: `3`)
- **Draft Slots:** e.g., `{ "honey_badgers": 5, "rose_bowl": 3 }`
- **Keeper Locks:** e.g., `{ "honey_badgers": ["Caleb Williams", "Brock Bowers"] }`
- **Favorite NFL Teams:** e.g., `["CHI", "DET"]`

---

### Step 2: Add Tester Definition to `src/lib/profiles.js`
Open `src/lib/profiles.js` and add the new tester object to `ALPHA_PRESET_PROFILES`:

```javascript
{
  id: 'alpha_jordan',
  name: 'Jordan (Jesus take the wheel)',
  displayLabel: 'Jordan (Props & Odds)',
  realName: 'Jordan Smith',
  nickname: 'Jesus take the wheel',
  email: 'jordan@example.com',
  description: 'Props and game totals specialist competing in Honey Badgers and Rose Bowl.',
  role: 'tester',
  alphaRole: 'tester',
  profileMode: PROFILE_MODES.ALPHA,
  usagePriority: 'props_and_odds',
  defaultHub: 'odds',
  fantasyLeagues: ['honey_badgers', 'rose_bowl'],
  fantasyTeamBindings: [
    { leagueId: 'honey_badgers', teamId: '5', teamName: 'Jesus take the wheel' },
    { leagueId: 'rose_bowl', teamId: '3', teamName: 'CallinginSickMonday' },
  ],
  favoriteTeams: ['CHI', 'DET'],
  draftSlots: { honey_badgers: 5, rose_bowl: 3 },
  keeperLocks: { honey_badgers: ['Caleb Williams', 'Brock Bowers'] },
  hubs: ALPHA_VISIBLE_HUBS,
  agents: [],
  allowedFeatures: [
    'dashboard', 'official-picks', 'intel-hub', 'futures-report',
    'fantasy-packet', 'schedule', 'injuries', 'market-context', 'alpha-local-tracking',
  ],
  blockedFeatures: ['master', 'andy', 'owner-futures-portfolio', 'ai-agent-chat', 'api-key-storage'],
  canUseAI: false,
  canStoreApiKeys: false,
  ownerPortfolioAccess: false,
},
```

---

### Step 3: Run Unit Test Suite
Execute the Vitest profile test suite to ensure schema integrity and security boundaries:

```powershell
npx vitest run tests/unit/alphaProfiles.test.js
```

---

### Step 4: Rebuild the Alpha Data Packet
Rebuild the static offline Alpha packet so the new tester profile is bundled into `data/alpha/alpha-packet-2026.json` and `public/alpha/alpha-packet-2026.json`:

```powershell
node scripts/build-alpha-data-packet.js
```

---

## 5. Security & Isolation Invariants

All Alpha Tester builds must strictly adhere to the following security invariants:

1. **Zero AI / Agent Chat Access:** `canUseAI: false` and `agents: []` prevent testers from consuming backend LLM tokens or calling AI agents.
2. **Zero API Key Storage:** `canStoreApiKeys: false` blocks local or cloud storage of paid API credentials (TheOddsAPI, FantasyPros, Action Network).
3. **Owner Portfolio Isolation:** `ownerPortfolioAccess: false` and `blockedFeatures: ['owner-futures-portfolio', ...]` strictly hide the owner's real bankroll balances, betting slips, and private futures allocations.
4. **Local REST / Storage Scoping:** Any bets placed by an Alpha tester are stored strictly in local browser storage (`alpha-local-tracking`) without mutating the owner's production pick ledger.
