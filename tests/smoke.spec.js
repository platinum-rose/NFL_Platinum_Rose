/**
 * tests/smoke.spec.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Smoke tests for NFL Platinum Rose UI.
 * Goal: verify every tab and every header modal opens without crashing.
 * These tests run on `vite preview` of the production build in GHA.
 *
 * What counts as a crash?
 *   1. ErrorBoundary fallback is visible  (data-testid="error-boundary")
 *   2. An uncaught JS error is thrown     (page.on('pageerror'))
 */

import { test, expect } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Wait for the React loading gate to clear, then networkidle. */
async function waitForApp(page) {
  // Loading gate: "Loading Data Engine..." disappears when schedule.json loads
  const loadingText = page.getByText('Loading Data Engine...');
  try {
    await expect(loadingText).toBeHidden({ timeout: 15_000 });
  } catch {
    // Might never show if data loads instantly — proceed anyway
  }
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

/** Assert the ErrorBoundary fallback is NOT showing. */
async function assertNoError(page) {
  await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible();
}

/**
 * Collect uncaught JS errors during a test.
 * Returns a cleanup function and a getter for accumulated error messages.
 */
function trackPageErrors(page) {
  const errors = [];
  const handler = (err) => errors.push(err.message);
  page.on('pageerror', handler);
  return {
    getErrors: () => errors,
    stop: () => page.off('pageerror', handler),
  };
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  'The Board',
  'My Card',
  'Bankroll',
  'Analytics',
  'Live Odds',
  'Expert Standings',
  'Picks Tracker',
  'Futures',
  'AI Dev Lab',
  'Props',
];

// ─── Modal config ─────────────────────────────────────────────────────────────
// Each entry: how to open the modal + a heading text to assert it rendered.

const HEADER_MODALS = [
  // 'Teasers' header modal removed 2026-08-24 (full-redesign pass): Wong
  // Teaser detection is now a passive MatchupCard badge (game.teaser /
  // game.teaserSide, computed in App.jsx's gamesWithSplits) -- no header
  // button or modal left to smoke-test.
  // 'SuperContest' header modal/tool removed 2026-08-25: it is now a real
  // nav route beside Command Hub (`?tab=supercontest`), not a duplicated
  // elevated top-row tool.
  {
    name:    'Pulse',
    open:    (page) => page.getByRole('button', { name: 'Pulse' }).click(),
    heading: 'Market Pulse',
  },
  {
    name:    'Splits',
    open:    (page) => page.getByRole('button', { name: 'Splits' }).click(),
    heading: 'Splits Analysis',
  },
  {
    name:    'AI Transcript',
    open:    (page) => page.locator('button[title="AI Transcript"]').click(),
    heading: 'AI Transcript Analyzer',
  },
  {
    name:    'Agent Status',
    open:    (page) => page.locator('button[title="Agent Status"]').click(),
    heading: 'Agent Status',
  },
  {
    name:    'Data Manager',
    open:    (page) => page.locator('button[title="Data Manager"]').click(),
    heading: 'Data & Storage Manager',
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('App boot', () => {
  test('loads without crashing', async ({ page }) => {
    const { getErrors, stop } = trackPageErrors(page);

    await page.goto('/');
    await waitForApp(page);
    await assertNoError(page);

    stop();
    const jsErrors = getErrors();
    expect(jsErrors, `JS errors on load: ${jsErrors.join('\n')}`).toHaveLength(0);
  });
});

test.describe('Tab navigation', () => {
  test('all tabs render without crashing', async ({ page }) => {
    const { getErrors, stop } = trackPageErrors(page);

    await page.goto('/');
    await waitForApp(page);

    for (const tabLabel of TABS) {
      await test.step(`tab: ${tabLabel}`, async () => {
        const btn = page.getByRole('button', { name: tabLabel, exact: true });
        // Tab bar uses overflow:hidden — some tabs are outside the visible
        // viewport and can't be reached via normal click().  dispatchEvent
        // fires the React click handler directly, bypassing viewport checks.
        await btn.dispatchEvent('click');
        // Brief settle — React renders synchronously except for lazy-loaded chunks
        await page.waitForTimeout(400);
        await assertNoError(page);
      });
    }

    stop();
    const jsErrors = getErrors().filter(msg =>
      // Filter out known non-fatal warnings (Supabase unavailable in test env, etc.)
      !msg.includes('supabase') &&
      !msg.includes('non-fatal') &&
      !msg.includes('hydration')
    );
    expect(jsErrors, `JS errors during tab navigation:\n${jsErrors.join('\n')}`).toHaveLength(0);
  });
});

test.describe('Header modals', () => {
  for (const modal of HEADER_MODALS) {
    test(`${modal.name} opens without crashing`, async ({ page }) => {
      const { getErrors, stop } = trackPageErrors(page);

      await page.goto('/');
      await waitForApp(page);

      // Open the modal
      await modal.open(page);

      // Verify the modal heading is visible (scoped to h2/h3 to avoid tooltip text collisions)
      await expect(
        page.locator('h2, h3').filter({ hasText: modal.heading })
      ).toBeVisible({ timeout: 8_000 });

      // No error boundary
      await assertNoError(page);

      stop();
      const jsErrors = getErrors().filter(msg =>
        !msg.includes('supabase') &&
        !msg.includes('non-fatal') &&
        !msg.includes('hydration')
      );
      expect(jsErrors, `JS errors opening ${modal.name}:\n${jsErrors.join('\n')}`).toHaveLength(0);
    });
  }
});
