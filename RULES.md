# Platinum Rose — Governance Rules
> **Last updated:** 2026-04-17
> **Authority:** These rules apply to all agents, all sessions. Creator approval required to override any must-never rule.
> **Source:** Consolidated from `CLAUDE.md`, anti-patterns section, and confirmed architecture decisions.

---

## MUST-ALWAYS

### Data & Storage
- **Always normalize team names** before any cross-source comparison: `normalizeTeam(a) === normalizeTeam(b)`. Never use raw string equality on names from different sources.
- **Always use ET-timezone-safe date formatting** for any date comparison involving `commence_time` fields. Never use `.toISOString().split('T')[0]` or `.split('T')[0]` on UTC timestamps — produces the wrong calendar day for evening ET games.
- **Always append `T12:00:00`** when displaying plain `YYYY-MM-DD` date strings. Plain date strings parsed by `new Date()` render in UTC, which appears one day earlier in ET.
- **Always fetch public files as** `` `${import.meta.env.BASE_URL}filename.json` `` or `./filename.json`. Never use a bare `/filename.json` path — Vite base is `/platinum-rose-app/` and hardcoded `/` 404s.
- **Always include `&groups=50`** in ESPN scoreboard API URLs. Without it, only top-25/featured games are returned.
- **Always use `loadFromStorage()`/`saveToStorage()`** from `src/lib/storage.js`. Never call `localStorage.getItem()`/`setItem()` directly — bypasses try/catch and key catalog.

### Storage Keys
- **Always use the canonical storage key names** (see list below). Never invent aliases. Never rename without a migration helper that reads both old and new keys.

| Key | Managed By | Permanence |
|-----|-----------|------------|
| `nfl_splits` | useSchedule.js | persistent |
| `nfl_my_bets` | useBettingCard.js | persistent |
| `nfl_sim_results` | useSchedule.js | persistent |
| `nfl_contest_lines` | useSchedule.js | persistent |
| `nfl_expert_consensus` | useExperts.js | **critical** |
| `pr_picks_v1` | picksDatabase.js | **critical** |
| `pr_game_results_v1` | picksDatabase.js | persistent |
| `nfl_bankroll_data_v1` | bankroll.js | **critical** |
| `nfl_futures_portfolio_v1` | futures.js | **critical** |
| `pr_playoff_bracket_v1` | PlayoffBracket.jsx | persistent |
| `cached_odds_data` | LiveOddsDashboard.jsx | ephemeral |
| `cached_odds_time` | LiveOddsDashboard.jsx | ephemeral |
| `lineMovements` | enhancedOddsApi.js | ephemeral |
| `PR_OPENAI_KEY` | AudioUploadModal.jsx | persistent |
| `nfl_props_picks_v1` | PropsAgentChat.jsx (via `log_prop` tool) | **critical** |

**Permanence rules:**
- **critical** — `removeFromStorage()` is blocked; only explicit user action via StorageBackupModal can clear
- **persistent** — survives refresh; must always be saved even when empty (no length guards)
- **ephemeral** — cache/temp data; safe to wipe

### React & Component Rules
- **Always declare `const fn` before calling any hook that receives it as a callback.** `const` is not hoisted — hook calls above the declaration throw `ReferenceError: Cannot access before initialization`.
- **Always use `React.memo` with a custom comparator** for list components rendered N times (e.g. MatchupCard ×16).
- **Always verify comparator field names match actual data object field names** before committing a `React.memo` component. A wrong field name makes the memo invisible to changes.
- **Always use `import.meta.env.BASE_URL`** as the prefix for all public asset paths.
- **Never use `querySelector` with Tailwind slash classes** (e.g., `.bg-rose-500/20`). Use `innerHTML.includes()` or a regex check instead.

### Testing
- **Always `vi.useFakeTimers()` + `vi.setSystemTime()`** in tests for any hook with a hard-coded date threshold. Failing to freeze the clock causes assertions to break when the real date passes the threshold.
- **Always run `npm test`** before closing a session and confirm count matches WORKING-CONTEXT.md.

### Git & Session
- **Always verify `git remote -v` shows the correct origin** before committing. Always work in `E:\dev\projects\NFL_Dashboard`.
- **Always use `git push --force-with-lease`** (not `--force`) when pushing diverged history.
- **Always check `AGENT_LOCK.json`** before force-pushing — concurrent agent writes can cause divergence.

---

## MUST-NEVER

### Data Integrity (Creator Approval Required to Override)
- **NEVER change localStorage key names without a migration helper.** This is the single most destructive change possible — all user data silently disappears. If a rename is necessary, write a migration function that reads both old and new keys and copies old → new on first load.
- **NEVER use `--no-verify`** when committing. This bypasses quality gates.
- **NEVER use `git push --force`** (without `--lease`). Only `--force-with-lease`.
- **NEVER add `timeZone: 'UTC'`** to a date formatter that displays game dates. Use `timeZone: 'America/New_York'`.
- **NEVER use `normalizeTeam` for OVER/UNDER bet selection lookup.** When `selection === 'OVER'` or `'UNDER'`, skip team name normalization entirely — use the `team` field directly.
- **NEVER use `position:absolute` for a content column inside a variable-height card.** Use flex siblings instead.
- **NEVER use auto-refresh (`setInterval`) for rate-limited APIs.** TheOddsAPI has 500 requests/month. Only fetch on explicit user action.
- **NEVER call `localStorage.getItem()`/`setItem()` directly.** All reads/writes go through `loadFromStorage`/`saveToStorage` in `src/lib/storage.js`.
- **NEVER boot-clobber state from a network fetch.** `setSplits(splitsData || {})` in a boot effect overwrites user data on every refresh. Always check localStorage first; only use remote value if local key is empty.

### Architecture (Creator Approval Required + Documented Reason)
- **NEVER add a dependency without PM/Creator approval.** Bundle size and security implications must be evaluated first.
- **NEVER change `src/lib/picksDatabase.js` key names, field shapes, or storage schema** without simultaneously writing a migration path and updating all callers.
- **NEVER duplicate utility functions from `teams.js`, `storage.js`, or `picksDatabase.js`** into components. Use imports.
- **NEVER use static imports for heavy optional dependencies** (like `@supabase/supabase-js`) when env vars may not be present. Use dynamic `import()` inside the factory function.
- **NEVER revert lazy-loaded tabs to static imports.** As of a3335f8, the 7 non-landing tabs are `React.lazy()` with `<Suspense>`. This dropped index.js from ~700KB to 466KB. Dashboard stays eager (landing page).

### Code Quality
- **NEVER call `normalizeTeam()` inside `.find()` or `.filter()` inside `.map()`.** This is O(n²). Pre-build a `Map` and use `Map.get()`.
- **NEVER add hardcoded date thresholds** to production logic without a corresponding `vi.useFakeTimers()` pattern in the test file. **Exception (Andy, 2026-09-10, Codex v7 query-dialect review):** this applies to wall-clock expiry logic -- code whose behavior depends on comparing against *today's date at run time* (e.g. "is this row stale", "has this window closed"), where `vi.useFakeTimers()` is how a test controls what "today" means. It does NOT apply to a static per-season configuration value (e.g. `TRAINING_CAMP_START_BY_SEASON[season]`) that never reads the current date at all -- there is no wall clock for a fake timer to control. A static per-season constant still may not be a bare inline literal at its use site: it must be named, keyed by the season variable already governing the surrounding reads, and fail loudly (throw) rather than silently reuse a stale value when a season has no entry. Its test coverage is a plain unit test on the accessor (returns the right value per season, throws on a missing one) plus a wiring assertion at the call site proving the resolved value actually reaches the query (e.g. asserting `.gte()` was called with the accessor's return value) -- no `vi.useFakeTimers()` needed, since nothing in the accessor or the call site reads the current date.
- **NEVER add new storage keys** without first adding them to `PR_STORAGE_KEYS` in `src/lib/storage.js`.

---

## Style Constants
- Primary accent: `#00d2be` (teal)
- Background: `#0f0f0f`
- AI Lab: emerald (`text-emerald-400`, `bg-emerald-500/20`)
- Positive: emerald · Negative: rose · Neutral: amber/slate
- Selection highlight: `selection:bg-[#00d2be] selection:text-black`

---

## Commit Message Format
```
{description}
```
Clear, descriptive commit messages. If test count changes, include it.

---

*Maintained by the DOCS agent. Add new entries immediately after any user correction, per the Self-Improvement Rule in `CLAUDE.md`.*
