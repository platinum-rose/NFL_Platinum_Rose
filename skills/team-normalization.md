# Team Name Normalization — NFL Platinum Rose

Reference this skill whenever writing code that compares, looks up, or displays
team names from any data source (ESPN, TheOddsAPI, user input, action network).

---

## The Core Problem

Team names come from multiple sources with inconsistent formats:

- **ESPN:** `"Kansas City Chiefs"` / `"KC Chiefs"`
- **TheOddsAPI:** `"Kansas City Chiefs"` / `"Chiefs"`
- **Action Network splits:** `"Kansas City"` / `"KC"`
- **User input:** anything

**Never use strict string equality (`===`) to match team names across sources.**

---

## Function Reference

All normalization utilities live in `src/lib/teams.js`.
Import from there — never duplicate these in components or hooks.

### `normalizeTeam(input)` — `src/lib/teams.js`

- **Returns:** canonical short name (e.g. `"Chiefs"`) OR `null` if no match found
- **Use for:** display normalization, pick storage, Supabase lookups,
  cross-source matching
- **Critical trap:** returns `null` on failure — always guard the result,
  never assume it normalized
- **Lookup chain:** direct name → full name → abbreviation → alias fuzzy match

```js
// ✅ Correct
const team = normalizeTeam("KC Chiefs");   // "Chiefs"
const team2 = normalizeTeam("kc");         // "Chiefs"
const team3 = normalizeTeam("BadInput");   // null — guard this!
if (!team3) console.warn("Unknown team:", input);

// ❌ Wrong — breaks on source format differences
oddsTeam === espnTeam
```

### `TEAM_MAPPING` — `src/lib/teams.js`

- Flat object mapping common string variants to canonical short names
- Used internally by `normalizeTeam` — import directly when you need
  a fast synchronous lookup without the full fuzzy chain

### `getDomeTeams()` — `src/lib/teams.js`

- Returns array of canonical team names that play in a dome
- Use for weather-based model adjustments (dome teams are unaffected by
  wind/rain/cold)

### `getTeamAbbreviation(teamName)` — `src/lib/teams.js`

- **Input:** canonical short name (e.g. `"Chiefs"`)
- **Returns:** primary abbreviation (e.g. `"KC"`)
- Use when building Supabase query params or ESPN API calls

---

## NFL_TEAMS Database — Key Design Facts

- **Key:** canonical short name (e.g. `"Chiefs"`, `"49ers"`, `"Raiders"`)
- Each entry has: `name`, `fullName`, `city`, `abbreviation`,
  `altAbbreviations[]`, `aliases[]`, `logo`, `division`, `conference`, `dome`
- `altAbbreviations` covers historical relocations:
  `Raiders: ["LVR", "OAK"]`, `Chargers: ["SD"]`, `Rams: ["STL"]`,
  `Commanders: ["WSH"]` — these are valid alternate lookups
- Precomputed lookup maps (`_aliasLookup`, `_abbrLookup`) are built at module
  load — no per-call overhead for the alias lookup step

---

## Known Alias Collision Risks

| Ambiguous Input | Resolves To | NOT |
|----------------|-------------|-----|
| `"LA"` | `"Rams"` (LAR primary) | Chargers (use `"LAC"`) |
| `"NY"` | `"Giants"` (NYG first) | Jets (use `"NYJ"`) |
| `"JAC"` | `"Jaguars"` | — (`JAX` is primary but `JAC` is alt) |
| `"WAS"` | `"Commanders"` | — (`WSH` also valid) |
| `"NE"` | `"Patriots"` | — (no collision) |

**Rule:** Before adding a new alias to `NFL_TEAMS`, grep for it across the
existing `aliases[]` and `altAbbreviations[]` arrays first.

---

## Cross-Source Comparison Pattern

When comparing team names from two different sources, always normalize both:

```js
// ✅ Correct
normalizeTeam(oddsTeam) === normalizeTeam(espnTeam)

// ❌ Wrong — breaks silently on "Kansas City Chiefs" vs "KC Chiefs"
oddsTeam === espnTeam
```

---

## Performance: O(n²) Trap

**Never** call `normalizeTeam()` inside `.find()` or `.filter()` inside
`.map()`. This creates O(n²) normalization calls on every render.

```js
// ❌ O(n²) — don't do this
const result = games.map(g => ({
  ...g,
  edge: oddsEdges.find(e => normalizeTeam(e.team) === normalizeTeam(g.home))
}));

// ✅ Pre-build a Map for O(1) lookups
const edgeMap = new Map(
  oddsEdges.map(e => [normalizeTeam(e.team), e])
);
const result = games.map(g => ({
  ...g,
  edge: edgeMap.get(normalizeTeam(g.home))
}));
```

---

## Totals Picks — Skip normalizeTeam

For OVER/UNDER bets, `selection` is `"OVER"` or `"UNDER"` — not a team name.
Skip `normalizeTeam` entirely and use the `team` field as-is for game lookup.

---

## Utility Consolidation Rule

All team utilities live in `src/lib/teams.js` — do NOT duplicate them in
components, hooks, or other lib files. Import from the canonical source.
