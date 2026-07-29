# CLAUDE.md - AI Assistant Guidelines for NFL Platinum Rose

## Project Overview
NFL betting analytics and line shopping dashboard (React + Vite + Tailwind CSS).
Integrates real-time odds from 8 sportsbooks, tracks betting performance, manages expert picks, and provides simulation-based edge analysis.

**Repository**: https://github.com/andrewlrose/NFL_Platinum_Rose
**Workspace (Windows dev)**: `E:\dev\projects\NFL_Dashboard`
**Workspace (M6/Linux)**: `~/projects/NFL_Dashboard` (path may vary — use GitHub URL as canonical)
**Dev URL**: http://localhost:5173/platinum-rose-app/

## Orchestration Directives
1. **Agent-first**: Route work to the specialist agent with deepest domain knowledge. See `AGENTS.md` routing guide.
2. **Context check**: Read `WORKING-CONTEXT.md` at session start. Current mode determines current priorities.
3. **Rules are laws**: `RULES.md` must-never rules require explicit Creator approval to override.
4. **Anti-patterns are supreme**: Read `docs/ANTI_PATTERNS.md` before touching dates, team names, storage keys, or scoring logic.
5. **Quality gates are self-enforced**: Run tests before closing tasks, lint changed files, check for stray `console.log` before commit.
6. **Hot files require PM lock**: `App.jsx`, `storage.js`, `picksDatabase.js`, `CLAUDE.md`, `AGENT_LOCK.json` — claim explicit scope before editing.

## Key Commands
```bash
npm run dev              # Start dev server (Vite)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint
npm run update-schedule  # Refresh schedule.json from external source
```

> Before touching dates, team names, or storage keys: **see `docs/ANTI_PATTERNS.md`** first.

## File Structure Conventions
- Components: `src/components/{category}/{ComponentName}.jsx`
- Utils/libs: `src/lib/{utilName}.js`
- Data files: `public/*.json`
- Modals: `src/components/modals/{ModalName}Modal.jsx`
- Python scripts: `scripts/*.py`

## Vite Config
- **Base path**: `/platinum-rose-app/` (GitHub Pages deployment)
- **Alias**: `@` → `./src`
- **Public files**: NEVER use hardcoded `/filename.json` — Vite base is `/platinum-rose-app/` so `public/` files must be fetched as relative `./filename.json`. Hardcoded `/` prefix 404s.

## Environment Variables

**Fixed 2026-07-07 (Fable tri-project audit, Finding 3):** this section
previously still documented `VITE_OPENAI_API_KEY` / `VITE_ODDS_API_KEY` as
browser env vars — the exact pattern `src/lib/apiConfig.js` deliberately
eliminated (see `API-KEYS` in `docs/NFL_AUDIT_BACKLOG.md`, closed S139) by
moving paid keys behind server-side proxies. Do NOT reintroduce
`VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, or `VITE_ODDS_API_KEY` —
`apiConfig.js` itself says these "must never appear in the browser bundle."

Browser env (safe to bundle — public values only):
```
VITE_SUPABASE_URL=...          # https://aambmuzfcojxqvbzhngp.supabase.co
VITE_SUPABASE_ANON_KEY=...     # Supabase anon/public JWT (read-only)
```
Accessed via `import.meta.env.VITE_*` in browser code.
Centralized in `src/lib/apiConfig.js` — all endpoints and keys in one file.

Paid/secret keys — stored as Supabase Edge Function secrets (`supabase secrets set`),
never in `.env` or any `VITE_*` var. Read server-side only, via
`Deno.env.get(...)` inside the functions listed:
```
OPENAI_API_KEY                 # ai-proxy edge function (GPT-4o extraction, transcript analysis)
ANTHROPIC_API_KEY              # ai-proxy edge function
GEMINI_API_KEY                 # ai-proxy edge function
ODDS_API_KEY                   # odds-proxy edge function (TheOddsAPI, 500 req/month free plan)
```
The browser calls `AI_PROXY_URL` / `ODDS_PROXY_URL` (from `apiConfig.js`) instead
of these APIs directly — the proxy holds the key, the browser never sees it.

GHA-only secrets (not in .env, used by scheduled agent workflows):
```
OPENAI_API_KEY                 # GPT-4o extraction (agents)
GROQ_API_KEY                   # Free Whisper transcription, priority 1 (7200 sec/hr)
ASSEMBLYAI_API_KEY             # Paid fallback transcription, priority 2 (no rate limit, URL-based)
SUPABASE_SERVICE_ROLE_KEY      # Bypasses RLS for agent writes
```

## Tab Routing (App.jsx)
| `activeTab` | Component |
|-------------|-----------|
| `'dashboard'` | `<Dashboard>` — Main matchup card grid (eager import; landing page) |
| `'standings'` | `<ExpertLeaderboard>` — Expert leaderboard |
| `'mycard'` | `<MyCardModal>` — Personal betting card |
| `'devlab'` | `<DevLab>` — Monte Carlo simulation lab |
| `'bankroll'` | `<BankrollDashboard>` — Bankroll management |
| `'analytics'` | `<AnalyticsDashboard>` — Performance analytics |
| `'odds'` | `<OddsCenter>` — Live odds + line movements |
| `'picks'` | `<PicksTracker>` — Pick tracking + grading |
| `'futures'` | `<FuturesPortfolio>` — Futures positions, exposure, hedge lab |
| `'agent'` | `<AgentChat>` — BETTING Tier-1 agent chat (F-6) |
| `'props'` | `<PropsAgentChat>` — PROPS Tier-1 agent chat (F-8; violet theme, Zap icon) |
| `'dfs'` | `<DFSOptimizer>` — DraftKings/FanDuel lineup builder (F-7) |

## localStorage Keys
All keys are catalogued in `PR_STORAGE_KEYS` in `src/lib/storage.js`. Use `loadFromStorage`/`saveToStorage`/`clearStorage` — never call `localStorage` directly.

**Sync architecture:** localStorage is the PRIMARY store (instant reads, offline-capable). Supabase is a fire-and-forget sync layer. On every write to `pr_picks_v1` or `nfl_bankroll_data_v1`, the change is upserted to Supabase in the background. On app boot, `hydrateFromSupabase()` in App.jsx fetches any records missing from localStorage (restores data after browser clear or on a new device). The **PickExtractionAgent** (GHA) also writes directly to `user_picks` with `source='EXPERT'`, adding `rationale`, `expert`, and `units` columns (migration 005); these are hydrated into localStorage on next boot.

| Key | Purpose | Permanence | Managed By |
|-----|---------|------------|------------|
| `nfl_splits` | Action Network betting splits | persistent | useSchedule.js |
| `nfl_my_bets` | User's betting card | persistent | useBettingCard.js |
| `nfl_sim_results` | Dev Lab simulation results | persistent | useSchedule.js |
| `nfl_contest_lines` | Contest line overrides | persistent | useSchedule.js |
| `nfl_expert_consensus` | Expert pick consensus per game | **critical** | useExperts.js |
| `pr_picks_v1` | Picks tracker data | **critical** | picksDatabase.js |
| `pr_game_results_v1` | Cached game results for grading | persistent | picksDatabase.js |
| `nfl_bankroll_data_v1` | Bankroll bet data | **critical** | bankroll.js |
| `nfl_futures_portfolio_v1` | Futures positions + open parlays | **critical** | futures.js |
| `pr_playoff_bracket_v1` | Playoff bracket seed assignments (AFC/NFC 7 seeds each) | persistent | PlayoffBracket.jsx |
| `cached_odds_data` | Cached API odds response (fallback when Supabase unavailable) | ephemeral | LiveOddsDashboard.jsx |
| `cached_odds_time` | Cache timestamp for odds | ephemeral | LiveOddsDashboard.jsx |
| `lineMovements` | Line movements from in-browser tracking (fallback; Supabase is primary) | ephemeral | enhancedOddsApi.js |
| `PR_OPENAI_KEY` | User-provided OpenAI key | persistent | AudioUploadModal.jsx |
| `nfl_props_picks_v1` | Player-prop picks logged by PROPS agent (`log_prop` tool); separate from `pr_picks_v1`. No auto-grading yet | **critical** | PropsAgentChat.jsx via propsTools.js |

**Permanence rules:**
- **critical** — `removeFromStorage()` is blocked; only explicit user action via StorageBackupModal can clear
- **persistent** — survives refresh; must always be saved even when empty (no length guards)
- **ephemeral** — cache/temp data; safe to wipe

**Rule**: NEVER change localStorage key names without a migration helper. Old data becomes invisible.

## API Integrations
| API | Endpoint | Usage |
|-----|----------|-------|
| **TheOddsAPI** | `api.the-odds-api.com/v4/sports/americanfootball_nfl/odds` | Live odds from 8 sportsbooks |
| **OpenAI** | `api.openai.com/v1/chat/completions` | GPT-4o transcript → picks extraction (via lib/openai.js) |
| **Supabase** | `aambmuzfcojxqvbzhngp.supabase.co` | Persistent storage: odds snapshots, line movements, game results |
| **ESPN Injuries** | `site.api.espn.com/.../teams/{ID}/injuries` | NFL team injury reports |
| **GitHub Raw** | `raw.githubusercontent.com/andrewlrose/NFL_Platinum_Rose/main/betting_splits.json` | Splits data sync |
| **Local** | `./schedule.json`, `./weekly_stats.json` | Schedule + stats from `public/` |

### TheOddsAPI Rate Limits (CRITICAL)
- Free plan: **500 requests/month**
- Auto-refresh is DISABLED (was burning 30 calls/hour)
- Startup fetch is DISABLED (every browser refresh = 1 call)
- 10-minute caching layer in LiveOddsDashboard.jsx
- Only fetches when user explicitly clicks Sync or visits Odds tab

## Sportsbooks Integrated
DraftKings, FanDuel, BetMGM, Caesars, BetOnline, Bookmaker, PointsBet, Unibet

---

## Session Protocols

### Session Start
- **Tight turnaround (< 4 hrs since last session):** Use the resume command → HANDOFF_PROMPT.md only.
- **Overnight gap or unsure if tree is clean:** Paste `agents/dev/SESSION_STARTER_PROMPT.md` activation block first — it runs live git/vitest/server checks.
- Either way: read `WORKING-CONTEXT.md` before touching any file.
- **Persistent Backlogs:** Check `HANDOFF.md`'s `## Persistent Backlogs` table — if it has open rows, read each referenced file and surface open items before proceeding.

### Resume Command Format (Gen-4 canonical)
```
Resume Platinum Rose NFL. HEAD = {commit} ({branch}). Suite: {N/N}. {one-sentence state}. Next: {task}. Read HANDOFF_PROMPT.md for full context before touching any file.
```
- NEVER paste a resume command without HEAD commit + test count

### Session Close (every session, in order)
```bash
git add -A
git commit -m "S{N}: {description}"
git push origin main
# Then run /handoff to update HANDOFF_PROMPT.md
```
- Commit message format: `S{session number}: {what changed}`
- **Persistent Backlogs:** Mark completed items `[x]` in each referenced backlog file; update Open Items count and Last Touched column in `HANDOFF.md`.

### Git Rejected Push Recovery
- **1–3 commits ahead, no agent conflicts**: `git push --force-with-lease origin main`
- **Diverged history**: `git pull --rebase origin main` then `git push origin main`
- **Never** use `git push --force` (without `--lease`)
- Check `AGENT_LOCK.json` before force-pushing — concurrent agent writes can cause divergence

---

## Custom Commands

### /handoff
Produce: (1) session summary with CRITICAL / IMPORTANT / Blockers labels + **Resume Command printed at the bottom**, (2) a self-contained context briefing block with all modified files, current state, next steps, and a Resume Command that points the next session to `HANDOFF_PROMPT.md` for details, and (3) overwrite `HANDOFF_PROMPT.md` with the context briefing.

---

## Workflow & Process

### Plan Before You Build
- For any task with 3+ steps, or touching data pipelines/storage: write out the steps before touching code
- If implementation goes sideways: STOP and re-plan — don't keep pushing through a bad path
- Always ask "What can go wrong with data formats or hook ordering?" before starting changes to App.jsx

### Autonomous Bug Fixing
- When given a bug report: just fix it. Point at logs/errors, resolve them, confirm the fix
- Check console errors, localStorage state, and network responses before concluding a root cause

### Verification Gate
- A task is **not done** until it is proven to work — check console, verify UI behavior, confirm localStorage state
- For grading/scoring changes: manually verify at least one bet grades correctly end-to-end

### Self-Improvement Rule
- After ANY user correction: immediately add a new entry to `docs/ANTI_PATTERNS.md` under the appropriate category
- Don't wait for `/handoff` — capture it while it's fresh
- Pattern format: `**Bold title**: What went wrong, why, and the rule to avoid it`
- Also update the Anti-Patterns section below if the pattern is critical enough for inline reference

### Context Management
Context is a finite resource — preserve it by delegating exploration and research to subagents.

**Default to spawning a subagent for:**
- Codebase orientation (reading 3+ files to answer a question)
- Research tasks (web searches, doc lookups, investigating how something works)
- Code review or analysis that produces verbose output
- Any investigation where only the summary matters

**Stay in main context for:**
- Direct file edits the user requested
- Short, targeted reads (1–2 files)
- Conversations requiring back-and-forth
- Tasks where the user needs to see intermediate steps

**Rule of thumb:** If a task will read more than ~3 files or produce output the user doesn't need verbatim, delegate it to a subagent and return a summary.

**Subagent best practices:**
- Include relevant localStorage keys, data formats, and file paths in the prompt — subagents don't inherit CLAUDE.md
- Don't subagent a 1-file read that returns a short answer — spawning overhead > just reading it
- Batch related investigations into one subagent instead of 3 separate spawns
- Never subagent an edit that depends on uncommitted changes from earlier in the conversation — the subagent can't see them

**Project-specific triggers** — always delegate when asked to:
- "What's already done vs. missing?" across hooks/modals/App.jsx
- Audit for an anti-pattern across the whole `src/` tree
- Investigate a build/runtime error spanning multiple files
- Investigate runtime errors spanning picksDatabase.js + bankroll.js + App.jsx

### Prompting Discipline (Creator habits)
Every **feature request** must include: phase number, target file(s), spec doc reference, and a gate-check condition.
Every **bug report** must include: exact observed output, exact observed input, and affected file — **no pre-diagnosis**. Pre-diagnosis anchors the AI on wrong paths.
For any file touching `commence_time`, `Date()`, or team name comparison: start the prompt with "See `docs/ANTI_PATTERNS.md` — {Date & Time | Team Name Matching} section before writing any code."
If a previous session's fix is incomplete, **amend the original bug entry** — do not file a new bug ID unless it's a genuinely new symptom in a different file.

---

## Learnings & Gotchas

### Props & State
- Always verify prop names match between parent and child
- When adding new Header props, update both Header.jsx AND App.jsx simultaneously
- Default prop values prevent undefined errors: `schedule = []`, `edges = []`

### Data Formats
- Confidence values: Store as whole numbers (57), not decimals (0.57)
- Stats for MatchupWizardModal: Must be ARRAY format, not object
- Convert with: `Object.entries(obj).map(([team, data]) => ({team, ...data}))`

### API & Network
- TheOddsAPI returns games, transform to schedule format in merge logic
- Always add safety checks: `if (!schedule || !Array.isArray(schedule)) return`
- 404 errors on GitHub raw URLs: Use local files or remove fetch
- GitHub splits URL: `https://raw.githubusercontent.com/andrewlrose/NFL_Platinum_Rose/main/betting_splits.json`

### Component Patterns
- Modal props pattern: `isOpen`, `onClose`, `onAction`
- Tab rendering: Use `{activeTab === 'tabname' && <Component />}`
- Always import new components AND add to render
- Before displaying parsed data, verify actual object structure from parser (console.log the object)

---

## Anti-Patterns to Avoid

- **API auto-refresh burning quota**: Never use `setInterval(loadOdds, N)` for rate-limited APIs. The LiveOddsDashboard was firing every 2 minutes, burning 30 calls/hour. Auto-refresh is now disabled; only manual fetch. Always cache API responses in localStorage with a TTL check.

- **Startup API fetch on every refresh**: `fetchLiveOdds()` in the boot `useEffect` called the API on every page load. Now replaced with `Promise.resolve([])`. Only fetch on explicit user action.

- **Don't assume GitHub raw URLs exist**: Verify the file exists in the repo before adding a fetch. 404s degrade silently.

- **Don't change storage keys without data migration**: Old key: `ncaa_picks_database` → New key: `pr_picks_v1`. Always check both keys when debugging "missing data".

- **Don't use `.map()` on potentially undefined arrays**: Always default: `(arr || []).map(...)`.

- **UTC commence_time +1 day offset**: API timestamps are UTC ISO strings. 7pm ET games store as `"2026-02-19T00:00:00Z"` (midnight UTC = next day). Using `.split('T')[0]` produces a date one day ahead. Fix: convert to local timezone before extracting date string.

- **Date-only string display UTC trap**: `new Date("2026-02-25").toLocaleDateString()` renders as 2/24 in ET because JS parses `YYYY-MM-DD` as midnight UTC. Always append `T12:00:00` or use timezone-aware formatting when displaying date strings.

- **GPT total selection casing**: GPT-4o returns `"OVER"`/`"UNDER"` in all-caps, not `"Over"`/`"Under"`. Always use `.toLowerCase()` when checking for total picks.

- **O(n²) lookups in loops**: Never call a `.find()` inside `.map()` — pre-build a `Map` keyed by the lookup field for O(1) access.

- **NCAA content in NFL project**: Cleaned up. All NCAA files have been removed.

- **Hook TDZ ordering**: Never call a hook that receives a `const fn = () =>` callback BEFORE that `const` declaration in the same component body. `const` is NOT hoisted. Move the hook call BELOW the function definition. Symptom: `ReferenceError: Cannot access 'X' before initialization`.

- **Public file fetches**: NEVER use hardcoded `/filename.json`. Vite base is `/platinum-rose-app/` so `public/` files must be fetched as `./filename.json` or `` `${import.meta.env.BASE_URL}filename.json` ``. Hardcoded `/` prefix 404s in production.

- **React.memo comparator must match actual prop names**: If comparator checks `g1.overUnder` but the game object uses `g1.total`, field changes are invisible to the memo. Always verify field names match the actual data object.

- **Bankroll bet ID type mismatch**: Bet IDs are created as `Date.now()` (number) but filtering may use string comparison. Always normalize: `const sids = new Set([...ids].map(String))` and filter with `!sids.has(String(b.id))`.

- **ReviewPicksModal Context field**: `handleAIAnalyze` creates picks with `rationale: p.summary || p.rationale || p.analysis` — GPT never returns `analysis` directly, so `pick.analysis` is always undefined. The "Context" field must read `pick.rationale`.

- **Auto-save guard anti-pattern**: `if (state.length > 0) { saveToStorage(key, state) }` seems safe but prevents cleared state from persisting. After `clearBets()`, state becomes `[]`, the guard skips the save, and data resurrects after refresh. Solution: remove all guards and call `clearStorage(key, emptyDefault)` explicitly in clear handlers. Initial-render skips are unnecessary — hooks already load from localStorage.

- **Boot clobber — never unconditionally set state from a network fetch**: `setSplits(splitsData || {})` in the boot effect overwrites the user's Action Network splits on every hard refresh (and wipes them entirely on network failure). Always check localStorage first: only use the remote value if the local key is empty. Rule: boot effects initialize; they don't overwrite.

- **AssemblyAI `speech_models` is required and is an array**: The API does not default to any model. Must pass `speech_models: ['universal-2']` (or `['universal-3-pro']` for higher quality). `speech_model` (singular, string) is deprecated and will also error. Always check AssemblyAI docs when the submit returns a 400 with a model-related error.

- **GHA runs check out the commit at trigger time**: If you push a fix and immediately re-trigger a workflow, the run may still use the pre-fix commit if the trigger races the push. Wait for the push to complete before triggering, or verify the commit SHA in the run's "Checkout" step output.

- **React.lazy tabs must stay lazy**: The non-landing tabs are lazy-loaded via `React.lazy()` with a `<Suspense>` wrapper in App.jsx. As of F-8 the lazy set is: `standings`, `devlab`, `bankroll`, `analytics`, `odds`, `picks`, `futures`, `agent`, `props`, `dfs` (10 tabs). This originally dropped index.js from ~700KB to 466KB and must stay intact — do NOT revert to static imports. `dashboard` stays eager (landing page). Modals are conditionally mounted (already OK). New tabs should also be added via `const X = lazy(() => import(...))`.

- **Raw localStorage calls outside storage.js**: `picksDatabase.js`, `bankroll.js`, and `EditBetModal.jsx` all had direct `localStorage.getItem/setItem` calls that bypassed try/catch and the key catalog. All reads/writes must go through `loadFromStorage`/`saveToStorage`. This also means `PR_STORAGE_KEYS` is the single source of truth — key string changes only need to happen in one place.

---

## Style Constants
- Primary accent: `#00d2be` (teal)
- Background: `#0f0f0f`
- AI Lab: emerald (`text-emerald-400`, `bg-emerald-500/20`)
- Positive: emerald, Negative: rose, Neutral: amber/slate
- Selection highlight: `selection:bg-[#00d2be] selection:text-black`

## Reference Docs (load on demand)
- `docs/ARCHITECTURE.md` — Component/hook/lib internals; load when editing any `src/` file
- `docs/PIPELINE_AGENTS.md` — GHA pipeline agent system, workflows, Supabase tables; load when working in `agents/` or `.github/`
- `docs/TESTING.md` — Verification checklists; load after changes to App.jsx, storage, or parsers
- `docs/ROADMAP.md` — Feature tracking & completed phases; load for planning tasks
- `docs/HANDOFF.md` — `/handoff` command output format; load on `/handoff`
- `docs/ANTI_PATTERNS.md` — Categorized anti-patterns; load before touching dates, team names, storage keys
- `AGENTS.md` — Agent routing guide + lock protocol; load when delegating work
- `WORKING-CONTEXT.md` — Live operational state; load at session start
- `RULES.md` — Must-always / must-never rules; load for any code change

<!-- BEGIN UNIFIED SESSION CONTEXT PROTOCOL -->
## Unified Session Context Protocol (Claude, Codex, Antigravity, VS Code Copilot)

### Session Start Protocol (Targeted Read)
1. **Dynamic Session Counter**: Evaluate `global.total_sessions` from `.atlas/memory.json` or `HANDOFF.md §Pick Up Here`. Do not assume session numbers.
2. **Targeted State Read**:
   - Read `HANDOFF.md` §`Pick Up Here` (stop at historical archive).
   - Read `HANDOFF.md` §`Persistent Backlogs` (if present).
   - Read machine state (`.atlas/memory.json` or `.atlas-bridge/` state).
3. **Git State Verification**: Run `git status --short` and `git log -n 5 --oneline` to note recent commits and uncommitted files.
4. **Surface Brief**: Print compact summary (Last Commit, Active Task, Open Backlog Count) and confirm next steps with user.

### Session Close Protocol (State Persistence)
1. **Update Memory State**: Write updated domain/task state to `.atlas/memory.json` (including `last_session_platform` = `claude` | `codex` | `antigravity` | `copilot`).
2. **Update Session Handoff**: Write a clean `(DONE)` summary block (≤ 30 lines) to `HANDOFF.md §Pick Up Here`.
3. **Update Backlogs**: Reconcile open items in tracking backlog files.
4. **Snapshot Audit**: Log immutable session log snapshot via `SessionLogger` (if supported).
<!-- END UNIFIED SESSION CONTEXT PROTOCOL -->
