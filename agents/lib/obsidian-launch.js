// agents/lib/obsidian-launch.js
// ═══════════════════════════════════════════════════════════════════════════════
// Auto-launch + wait-for-ready helper for scripts that need Obsidian's Local
// REST API (podcast-host-summary.js's vault write, --vault-sync, and any
// future vault-writing agent). Built 2026-07-21 after a real --vault-sync run
// failed all 40 writes because Obsidian simply wasn't open yet -- rather than
// erroring immediately, this launches Obsidian via its registered `obsidian://`
// URI protocol handler and polls until the Local REST API responds.
//
// Windows-only for the launch step (exec('start ... "obsidian://..."')) --
// this only matters for scripts run natively on Andy's Windows machine, where
// Obsidian actually lives. M6/Linux has no local Obsidian to launch regardless
// (no network route to it either, a separate known limitation), so on any
// non-Windows platform this just throws a clear error immediately instead of
// silently doing nothing.
// ═══════════════════════════════════════════════════════════════════════════════

import { exec } from 'node:child_process';
import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/** Quick reachability check -- any HTTP response (even 401/404) means something's listening. */
export async function isObsidianReachable(url, obsidianKey) {
  try {
    const { default: fetch } = await import('node-fetch');
    await fetch(url, {
      agent: httpsAgent,
      headers: obsidianKey ? { Authorization: `Bearer ${obsidianKey}` } : {},
      signal: AbortSignal.timeout(2500),
    });
    return true;
  } catch {
    return false;
  }
}

/** Fire-and-forget launch via Obsidian's registered URI protocol handler. Returns
 *  false (no-op) on non-Windows platforms rather than attempting anything. */
export function launchObsidian() {
  if (process.platform !== 'win32') return false;
  exec('start "" "obsidian://open"', (err) => {
    if (err) console.error(`  (auto-launch attempt failed: ${err.message})`);
  });
  return true;
}

/**
 * Ensures Obsidian's Local REST API is reachable before a script starts
 * writing notes. If unreachable, attempts to auto-launch Obsidian (Windows
 * only) and polls until the API responds or maxWaitMs elapses.
 *
 * checkFn/launchFn are injectable so the retry/timeout logic itself can be
 * unit-tested without a real network call or spawning a real process.
 *
 * @returns {Promise<{reachable: boolean, launched: boolean}>}
 * @throws if unreachable and either auto-launch isn't supported on this
 *   platform, or it timed out waiting after launching.
 */
export async function ensureObsidianReachable({
  url,
  obsidianKey = '',
  maxWaitMs = 25_000,
  pollIntervalMs = 1_500,
  checkFn = isObsidianReachable,
  launchFn = launchObsidian,
} = {}) {
  if (await checkFn(url, obsidianKey)) return { reachable: true, launched: false };

  const launched = launchFn();
  if (!launched) {
    throw new Error(
      `Obsidian Local REST API unreachable at ${url}, and auto-launch is only supported on Windows ` +
      `(this process is running on ${process.platform}). Start Obsidian manually and retry.`
    );
  }

  console.log('  Obsidian not reachable -- launched it, waiting for Local REST API to come up...');
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    if (await checkFn(url, obsidianKey)) {
      console.log('  Obsidian Local REST API is up.');
      return { reachable: true, launched: true };
    }
  }

  throw new Error(
    `Launched Obsidian but its Local REST API still isn't reachable at ${url} after ` +
    `${Math.round(maxWaitMs / 1000)}s. Check that the Local REST API plugin is enabled and the vault ` +
    `has finished loading, then retry.`
  );
}
