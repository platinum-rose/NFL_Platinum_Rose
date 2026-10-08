#!/usr/bin/env node
// Extract mixed-source NFL futures screenshots into local JSON evidence.
// This script is intentionally local-only: it never writes Supabase or a wager ledger.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'docs', 'Futures_Odds');
const ARCHIVE_ROOT = path.join(SOURCE_DIR, '_processed');
const OUT_DIR = path.join(ROOT, 'data', 'futures-imports');
const MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash';

// These files predate a consistent filename convention. Dates come from the
// filename when present, otherwise the original local capture timestamp.
const MANIFEST = [
  ['1000006403.jpg.jpeg', 'unattributed', 'Unattributed', '2026-09-23'],
  ['1000006405.jpg.jpeg', 'unattributed', 'Unattributed', '2026-09-23'],
  ['1000006407.jpg.jpeg', 'unattributed', 'Unattributed', '2026-09-23'],
  ['1000006419.jpg.jpeg', 'unattributed', 'Unattributed', '2026-09-29'],
  ['Fanatics_SB1.PNG', 'fanatics', 'Fanatics', '2026-09-22'],
  ['Fanatics_SB2.PNG', 'fanatics', 'Fanatics', '2026-09-22'],
  ['Screenshot_20260922_191918_Circa Sports Nevada.jpg.jpeg', 'circa', 'Circa', '2026-09-22'],
  ['Screenshot_20260922_191930_Circa Sports Nevada.jpg.jpeg', 'circa', 'Circa', '2026-09-22'],
  ['Screenshot_20260922_192011_Circa Sports Nevada.jpg.jpeg', 'circa', 'Circa', '2026-09-22'],
  ['Screenshot_20260922_192019_Circa Sports Nevada.jpg.jpeg', 'circa', 'Circa', '2026-09-22'],
  ['Screenshot_20260922_201345_Circa Sports Nevada.jpg.jpeg', 'circa', 'Circa', '2026-09-22'],
  ['Screenshot_20260922_203321_Circa Sports Nevada.jpg.jpeg', 'circa', 'Circa', '2026-09-22'],
  ['Screenshot_20260923_003208_Circa Sports Nevada.jpg.jpeg', 'circa', 'Circa', '2026-09-23'],
  ['Screenshot_20260929_213728_Boyd Sports.jpg.jpeg', 'boyd', 'Boyd Sports', '2026-09-29'],
  ['Screenshot_20260929_215001_Boyd Sports.jpg.jpeg', 'boyd', 'Boyd Sports', '2026-09-29'],
].map(([file, book, bookLabel, date]) => ({ file, book, bookLabel, date }));

function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key] ??= rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
function hasFlag(name) { return process.argv.includes(name); }
function mime(file) { return path.extname(file).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'; }
function implied(odds) {
  if (!Number.isFinite(odds)) return null;
  return Math.round((odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)) * 10000) / 10000;
}

const PROMPT = `Extract ONLY visible NFL futures market data from this screenshot. Do not infer omitted rows.
Return ONLY a JSON array. Every item must contain:
market_type: one of superbowl, superbowl_matchup, conference_afc, conference_nfc, division_afc_east, division_afc_north, division_afc_south, division_afc_west, division_nfc_east, division_nfc_north, division_nfc_south, division_nfc_west, playoffs, wins, or superbowl_probability;
team: full NFL team name, or an exact two-team matchup label for superbowl_matchup;
odds: numeric American odds when shown, otherwise null;
line, over_price, under_price for wins when shown, otherwise null;
implied_prob: decimal probability only when the screenshot shows a percentage/probability rather than American odds, otherwise null.
For playoff boards, record the Yes price only. For a single screenshot containing multiple divisions, set the correct division-specific market_type per row. Preserve all visible rows and do not add any that are clipped.`;

async function extract(env, entry) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const full = path.join(SOURCE_DIR, entry.file);
  const payload = { contents: [{ parts: [
    { text: PROMPT },
    { inlineData: { mimeType: mime(entry.file), data: fs.readFileSync(full).toString('base64') } },
  ] }], generationConfig: { responseMimeType: 'application/json' } };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 240)}`);
      const text = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length) return parsed;
      throw new Error('returned no rows');
    } catch (error) {
      if (attempt === 5) throw new Error(`${entry.file}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2500 * attempt));
    }
  }
}

function normalize(raw, entry) {
  if (!raw?.market_type || !raw?.team) return null;
  const odds = raw.odds == null ? null : Number(raw.odds);
  const probability = raw.implied_prob == null ? null : Number(raw.implied_prob);
  if (!Number.isFinite(odds) && !Number.isFinite(probability)) return null;
  const timestamp = `${entry.date}T12:00:00Z`;
  return {
    snapshot_time: timestamp, captured_at: timestamp, season: 2026, book: entry.book,
    market_type: String(raw.market_type).trim(), team: String(raw.team).trim(), selection: String(raw.team).trim(),
    odds: Number.isFinite(odds) ? odds : null, price: Number.isFinite(odds) ? odds : null,
    implied_prob: Number.isFinite(probability) ? probability : implied(odds),
    line: raw.line == null ? null : Number(raw.line),
    over_price: raw.over_price == null ? null : Number(raw.over_price),
    under_price: raw.under_price == null ? null : Number(raw.under_price),
    source: `OCR from docs/Futures_Odds/${entry.file}`,
  };
}

function mergeWrite(entry, rows) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const output = path.join(OUT_DIR, `${entry.book}-${entry.date}.json`);
  const existing = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : [];
  const merged = new Map();
  for (const row of [...existing, ...rows]) {
    const key = [row.book, row.snapshot_time, row.market_type, row.team, row.line, row.odds, row.source].join('|');
    merged.set(key, row);
  }
  fs.writeFileSync(output, JSON.stringify([...merged.values()], null, 2) + '\n', 'utf8');
  return output;
}

async function main() {
  const filter = String(arg('--name-contains', '')).toLowerCase();
  const archive = hasFlag('--archive');
  const chosen = MANIFEST.filter((entry) => !filter || entry.file.toLowerCase().includes(filter));
  if (!chosen.length) throw new Error('No manifest entries match the requested filter');
  const env = loadEnv();
  const archived = [];
  for (const entry of chosen) {
    const source = path.join(SOURCE_DIR, entry.file);
    if (!fs.existsSync(source)) { console.log(`[skip] ${entry.file} is already outside the intake folder`); continue; }
    console.log(`[OCR] ${entry.file} (${entry.bookLabel}, ${entry.date})`);
    const rawRows = await extract(env, entry);
    const rows = rawRows.map((row) => normalize(row, entry)).filter(Boolean);
    if (!rows.length) throw new Error(`${entry.file}: OCR returned no normalizable futures rows; left in intake folder`);
    const output = mergeWrite(entry, rows);
    console.log(`  ${rows.length} rows -> ${path.relative(ROOT, output)}`);
    if (archive) {
      const destinationDir = path.join(ARCHIVE_ROOT, `${entry.bookLabel.replace(/[^A-Za-z0-9]+/g, '_')}_${entry.date}`);
      fs.mkdirSync(destinationDir, { recursive: true });
      fs.renameSync(source, path.join(destinationDir, entry.file));
      archived.push(entry.file);
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  console.log(`Complete: ${chosen.length} file(s) processed; ${archived.length} archived.`);
}

main().catch((error) => { console.error(error.message); process.exit(1); });
