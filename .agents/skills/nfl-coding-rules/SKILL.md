---
name: nfl-coding-rules
description: Comprehensive coding rules covering JS conventions, testing, data handling, and React patterns.
---

# NFL Coding Rules

**When to Activate:** Read this skill before writing any JavaScript, React components, Vitest tests, or when reviewing/refactoring code.

## JavaScript & React Conventions
- **Module System**: ESM only (`import`/`export`). One default export per file for components/hooks.
- **Async Patterns**: Use `async`/`await` everywhere. Never use `.then()` chains in React components. Never use top-level await in component files.
- **State Management**: Use `useState` + `useEffect`. No Redux/Zustand. Lift state to nearest common ancestor. localStorage is persistence; Supabase is background sync.
- **Performance**: 
  - `useMemo` for expensive computations.
  - `useCallback` for handlers passed to memoized children.
  - `React.memo` for pure display components.
  - Use `Map` for O(1) lookups (never `.find()` inside `.map()`).
  - Use `React.lazy` for non-landing tabs.
- **Tailwind CSS**: Use utility classes directly in JSX. **Never** concatenate dynamic class strings (e.g., `text-${color}-400`). Use conditional objects or `clsx`.
- **Error Handling**: `<ErrorBoundary>` wraps major sections. Async data functions return `{ data, loading, error }`. API failures must show a user-facing fallback.

## Testing Rules
1. **Regression**: Every bug fix gets a regression test.
2. **No Real Data/APIs**: Tests must not depend on real data files or call real APIs. Mock `fetch`, `localStorage`, and Supabase.
3. **File Naming**: `{ComponentName}.test.jsx` or `{utilName}.test.js`.
4. **Framework**: Vitest + React Testing Library (RTL). Playwright for E2E.
5. **Clock/Date Mocking**: Always use `vi.useFakeTimers()` when testing date-dependent logic.
6. **Null/Undefined Robustness**: Every component test should include a case with missing or empty props.

## Data Handling
- **Boot-Clobber Prevention**: Never unconditionally set state from a network fetch at boot. Always check `localStorage` first; only use the remote value if the local key is empty.
- **Confidence Values**: Store as whole numbers (e.g., `57`), not decimals (`0.57`).
- **Dates**: Beware of UTC offsets. API timestamps are UTC ISO strings. Using `.split('T')[0]` on `"2026-02-19T00:00:00Z"` produces a date one day ahead locally. Always convert to local timezone before extracting date string.
