// Fetch-with-timeout helper for the Official Picks inbox tab, extracted
// from OfficialPicksTab.jsx (Checkpoint 4, 2026-08-22).
//
// Moved out of the component file (rather than just adding `export`)
// because exporting a non-component alongside OfficialPicksTab's default
// component export trips `react-refresh/only-export-components` -- this
// repo's eslint config treats that as an error, not a warning. Keeping
// pure helpers in src/lib/*.js alongside the component that uses them
// already has precedent here (src/components/analytics/analyticsEngine.js).
//
// Behavior is unchanged from the Checkpoint 1 fix (2026-08-21 unified
// repair plan, item 2): abort the request after PROBE_TIMEOUT_MS so the
// UI doesn't hang forever when the local inbox server
// (scripts/official-pick-inbox-server.js) isn't running. Exported so the
// timeout/abort behavior can be unit-tested directly -- this repo has no
// jsdom/@testing-library/react setup, so full component-render coverage
// of the offline state isn't available yet (see
// tests/unit/officialPicksFetchTimeout.test.js for what this does and
// does not cover).
export const PROBE_TIMEOUT_MS = 3000;

// UI-level failsafe, independent of the AbortController below. A live
// browser check (2026-08-21 audit) found the tab could stay on "checking"
// past 13+ seconds when the local server wasn't running -- the fetch abort
// alone wasn't reliably flipping the UI state in time. OfficialPicksTab's
// own failsafe timer (see the comment above its `probe()`) guarantees the
// offline state renders a few seconds after the primary probe should have
// settled, regardless of why it didn't.
export const FAILSAFE_TIMEOUT_MS = 6000;

export async function fetchJson(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}
