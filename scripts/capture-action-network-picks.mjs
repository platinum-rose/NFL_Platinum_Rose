#!/usr/bin/env node
/**
 * Capture a rendered Action Network Picks-game panel as raw evidence.
 *
 * This deliberately does not write Supabase, change a sportsbook, or create
 * an official/paper ticket.  The page is client-rendered and its count/lines
 * can change while it is open, so the capture timestamp and complete rendered
 * text are retained before any separate normalization/review step.
 *
 * Usage:
 *   node scripts/capture-action-network-picks.mjs --game "Buccaneers @ Cowboys"
 *   node scripts/capture-action-network-picks.mjs --game "Buccaneers @ Cowboys" --out path/to/raw.json
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};

const game = valueFor('--game');
const outputPath = valueFor('--out');
const visible = args.includes('--visible');

if (!game) {
  console.error('Missing --game (example: --game "Buccaneers @ Cowboys").');
  process.exit(2);
}

const url = 'https://www.actionnetwork.com/nfl/picks/game?league=nfl';
// CI can use Playwright's managed browser. The Windows 30-minute local sweep
// uses the installed Chrome when the managed browser cache is absent.
const chromeCandidates = [
  process.env.ACTION_PICKS_BROWSER_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const executablePath = chromeCandidates.find((candidate) => existsSync(candidate));
const browser = await chromium.launch({ headless: !visible, ...(executablePath ? { executablePath } : {}) });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByRole('button', { name: 'See all picks' }).first().click({ timeout: 30_000 });
  await page.waitForTimeout(1_000);

  const renderedText = await page.locator('body').innerText();
  const panelStart = renderedText.indexOf(`${game} Picks`);
  if (panelStart < 0) {
    throw new Error(`Rendered page did not contain the requested game label: ${game}`);
  }

  // The first repeated "See all picks" after the expanded panel is the next
  // game card. Keep the panel only; page chrome is deliberately excluded.
  const repeatedPanelStart = renderedText.indexOf(`${game} Picks`, panelStart + game.length);
  const seeAllPicks = renderedText.indexOf('\nSee all picks\n', panelStart);
  const panelEnd = [repeatedPanelStart, seeAllPicks].filter((index) => index >= 0).sort((a, b) => a - b)[0];
  const rawPanel = renderedText.slice(panelStart, panelEnd).trim();
  const count = rawPanel.match(/\n(\d+) picks\n/)?.[1] ?? null;

  const capture = {
    schema_version: 1,
    source: 'Action Network Picks',
    source_url: url,
    game,
    captured_at: new Date().toISOString(),
    displayed_pick_count: count ? Number(count) : null,
    raw_rendered_panel: rawPanel,
    extraction_risks: [
      'Dynamic rendered page: count and lines can change during or after capture.',
      'Raw page includes public Action profiles; analyst attribution must be independently reviewed before normalization.',
      'Prices are source-displayed historical pick prices, not verified executable offers.',
    ],
    status: 'raw_source_evidence_only',
  };

  if (outputPath) {
    const resolved = path.resolve(outputPath);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, `${JSON.stringify(capture, null, 2)}\n`, 'utf8');
    console.error(`Wrote raw source evidence to ${resolved}`);
  }

  process.stdout.write(`${JSON.stringify(capture, null, 2)}\n`);
} finally {
  await browser.close();
}
