# Anti-Patterns — NFL Platinum Rose

> **Purpose:** Categorized anti-patterns discovered through AI corrections and production bugs.
> **Rule:** After ANY user correction, immediately add a new entry here under the appropriate category.
> **Format:** `**Bold title**: What went wrong, why, and the rule to avoid it.`

---

## Date & Time

- **UTC commence_time +1 day offset**: API timestamps are UTC ISO strings. 7pm ET games store as `"2026-02-19T00:00:00Z"` (midnight UTC = next day). Using `.split('T')[0]` produces a date one day ahead. Fix: convert to local timezone before extracting date string.

- **Date-only string display UTC trap**: `new Date("2026-02-25").toLocaleDateString()` renders as 2/24 in ET because JS parses `YYYY-MM-DD` as midnight UTC. Always append `T12:00:00` or use timezone-aware formatting when displaying date strings.

---

## React / Component Architecture

- **Hook TDZ ordering**: Never call a hook that receives a `const fn = () =>` callback BEFORE that `const` declaration in the same component body. `const` is NOT hoisted. Move the hook call BELOW the function definition. Symptom: `ReferenceError: Cannot access 'X' before initialization`.

- **React.memo comparator must match actual prop names**: If comparator checks `g1.overUnder` but the game object uses `g1.total`, field changes are invisible to the memo. Always verify field names match the actual data object.

- **React.lazy tabs must stay lazy**: The non-landing tabs are lazy-loaded via `React.lazy()` with a `<Suspense>` wrapper in App.jsx. As of F-8 the lazy set is: `standings`, `devlab`, `bankroll`, `analytics`, `odds`, `picks`, `futures`, `agent`, `props`, `dfs` (10 tabs). This originally dropped index.js from ~700KB to 466KB. Do NOT revert to static imports — it bloats the initial bundle. Dashboard stays eager (landing page). Any new tab must also be `lazy()`-imported.

---

## Storage & Data

- **Artifact row count is not evidence coverage**: A dated artifact can still be incomplete when its query is capped, article bodies are missing, or stored text ends at an ingest ceiling. Never label article records as "reviewed" from row count alone. Report corpus completeness and body-evidence status separately, keep pick-oriented rows unresolved until their usable bodies are examined, and block frontier synthesis when those gates are unknown or failed.

- **Public file fetches — Vite base path**: NEVER use hardcoded `/filename.json`. Vite base is `/platinum-rose-app/` so `public/` files must be fetched as `./filename.json` or `` `${import.meta.env.BASE_URL}filename.json` ``. Hardcoded `/` prefix 404s in production.

- **localStorage direct access**: Never call `localStorage.getItem()` or `localStorage.setItem()` directly outside `src/lib/storage.js`. All reads/writes must go through `loadFromStorage`/`saveToStorage`/`clearStorage`. This ensures try/catch safety and the `PR_STORAGE_KEYS` catalog stays as the single source of truth.

- **Don't change storage keys without data migration**: Old key: `ncaa_picks_database` → New key: `pr_picks_v1`. Always check both keys when debugging "missing data". NEVER rename a key without a migration helper.

- **Auto-save guard anti-pattern**: `if (state.length > 0) { saveToStorage(key, state) }` seems safe but prevents cleared state from persisting. After `clearBets()`, state becomes `[]`, the guard skips the save, and data resurrects after refresh. Solution: remove all guards and call `clearStorage(key, emptyDefault)` explicitly in clear handlers.

- **Boot clobber — never unconditionally set state from a network fetch**: `setSplits(splitsData || {})` in the boot effect overwrites the user's Action Network splits on every hard refresh (and wipes them entirely on network failure). Always check localStorage first: only use the remote value if the local key is empty. Rule: boot effects initialize; they don't overwrite.

- **Bankroll bet ID type mismatch**: Bet IDs are created as `Date.now()` (number) but filtering may use string comparison. Always normalize: `const sids = new Set([...ids].map(String))` and filter with `!sids.has(String(b.id))`.

---

## API & Network

- **API auto-refresh burning quota**: Never use `setInterval(loadOdds, N)` for rate-limited APIs. The LiveOddsDashboard was firing every 2 minutes, burning 30 calls/hour. Auto-refresh is now disabled; only manual fetch. Always cache API responses in localStorage with a TTL check.

- **Startup API fetch on every refresh**: `fetchLiveOdds()` in the boot `useEffect` called the API on every page load. Now replaced with `Promise.resolve([])`. Only fetch on explicit user action.

- **Don't assume GitHub raw URLs exist**: Verify the file exists in the repo before adding a fetch. 404s degrade silently.

- **ESPN `groups=50` parameter**: Always include `&groups=50` in ESPN scoreboard API calls or only a subset of games return. This is not documented in their public API — discovered through trial and error.

---

## AI / GPT Quirks

- **GPT total selection casing**: GPT-4o returns `"OVER"`/`"UNDER"` in all-caps, not `"Over"`/`"Under"`. Always use `.toLowerCase()` when checking for total picks.

- **ReviewPicksModal Context field**: `handleAIAnalyze` creates picks with `rationale: p.summary || p.rationale || p.analysis` — GPT never returns `analysis` directly, so `pick.analysis` is always undefined. The "Context" field must read `pick.rationale`.

---

## Infrastructure

- **AssemblyAI `speech_models` is required and is an array**: The API does not default to any model. Must pass `speech_models: ['universal-2']` (or `['universal-3-pro']` for higher quality). `speech_model` (singular, string) is deprecated and will also error.

- **GHA runs check out the commit at trigger time**: If you push a fix and immediately re-trigger a workflow, the run may still use the pre-fix commit if the trigger races the push. Wait for the push to complete before triggering, or verify the commit SHA in the run's "Checkout" step output.

---

## Performance

- **O(n²) lookups in loops**: Never call a `.find()` inside `.map()` — pre-build a `Map` keyed by the lookup field for O(1) access.

- **Don't use `.map()` on potentially undefined arrays**: Always default: `(arr || []).map(...)`.
