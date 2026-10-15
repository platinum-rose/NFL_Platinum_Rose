#!/usr/bin/env node
// scripts/props/beo-futures-to-imports.mjs
// ==============================================================================
// Converts a BetOnline live-scrape capture (data/generated/futures/betonline-futures-*.json,
// schema betonline_futures_v1, written by scripts/props/cron-bol-futures-scrape.mjs) into the
// dated import file the futures pipeline reads: data/futures-imports/betonline-YYYY-MM-DD.json.
//
// That file is what scripts/backfill-futures-imports.js reconciles into Supabase
// futures_odds_snapshots (the Intel Report's source). This module does NOT touch Supabase.
//
// Markets mapped: Super Bowl winner, AFC/NFC winner, the 8 divisions, To Make Playoffs (Yes price),
// Super Bowl exact matchup, regular-season win totals (line + over/under). NOT mapped (no import
// market_type): awards, 1-seed, first coach fired, worst record, most wins, draft, etc.
//
// Usage:
//   node scripts/props/beo-futures-to-imports.mjs <capture.json>            # preview, writes nothing
//   node scripts/props/beo-futures-to-imports.mjs <capture.json> --write    # write the import file
//   (refuses to overwrite an existing file for that date unless --overwrite)
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const SEASON = 2026;

const DIVISIONS = /^(AFC|NFC) (East|North|South|West)$/i;

export function mapMarket(market, selection) {
  const m = String(market || '').trim();
  if (/^Super Bowl Winner\b/i.test(m)) return { marketType: 'superbowl', team: selection };
  if (/^Super Bowl .*Exact Matchup$/i.test(m)) return { marketType: 'superbowl_matchup', team: selection };
  if (/^AFC Winner\b/i.test(m)) return { marketType: 'conference_afc', team: selection };
  if (/^NFC Winner\b/i.test(m)) return { marketType: 'conference_nfc', team: selection };
  if (DIVISIONS.test(m)) return { marketType: `division_${m.toLowerCase().replace(/\s+/g, '_')}`, team: selection };
  const mp = m.match(/^To Make Playoffs:\s*(.+)$/i);
  if (mp) return String(selection).toLowerCase() === 'yes' ? { marketType: 'playoffs', team: mp[1].trim() } : null;
  return null;
}

export function convertCapture(capture) {
  const capturedAt = String(capture.capturedAt || '').replace(/\.\d+Z$/, 'Z');
  const out = [];
  const skipped = {};
  const wins = {};
  for (const r of capture.rows || []) {
    const wm = String(r.market || '').match(/^Win Total:\s*(.+)$/i);
    if (wm) {
      const sm = String(r.selection || '').match(/^(Over|Under)\s+([\d.]+)/i);
      if (sm && typeof r.odds === 'number') {
        const w = (wins[wm[1].trim()] ||= {});
        w.line = Number(sm[2]);
        w[sm[1].toLowerCase()] = r.odds;
      }
      continue;
    }
    const hit = mapMarket(r.market, r.selection);
    if (!hit) {
      const isNoSide = /^To Make Playoffs:/i.test(r.market || '');
      if (!isNoSide) skipped[r.market] = (skipped[r.market] || 0) + 1;
      continue;
    }
    if (!hit.team || typeof r.odds !== 'number') continue;
    out.push({
      snapshot_time: capturedAt,
      captured_at: capturedAt,
      season: SEASON,
      book: 'betonline',
      market_type: hit.marketType,
      team: hit.team,
      selection: hit.team,
      odds: r.odds,
      price: r.odds,
      implied_prob: impliedProb(r.odds),
      source: `BEO live scrape (${capture.schema || 'betonline_futures_v1'})`,
    });
  }
  for (const [team, w] of Object.entries(wins)) {
    if (w.over == null || w.under == null) { skipped[`Win Total (incomplete): ${team}`] = 1; continue; }
    out.push({
      snapshot_time: capturedAt, captured_at: capturedAt, season: SEASON, book: 'betonline',
      market_type: 'wins', team, selection: team, odds: w.over, price: w.over, implied_prob: impliedProb(w.over),
      line: w.line, over_price: w.over, under_price: w.under,
      source: `BEO live scrape (${capture.schema || 'betonline_futures_v1'})`,
    });
  }
  return { rows: out, skipped, capturedAt };
}

// Vig-inclusive implied probability from American odds, 4dp (matches the BetUS/Bookmaker import files,
// e.g. +750 -> 0.1176). Needed by generate-live-tracker.mjs, which skips rows without implied_prob.
export function impliedProb(odds) {
  if (typeof odds !== 'number' || !Number.isFinite(odds) || odds === 0) return null;
  const p = odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
  return Math.round(p * 10000) / 10000;
}

export function importPathFor(day, repoRoot = REPO_ROOT) {
  return path.join(repoRoot, 'data', 'futures-imports', `betonline-${day}.json`);
}

export function writeImportFile(capture, day, { repoRoot = REPO_ROOT, overwrite = false } = {}) {
  const { rows, skipped, capturedAt } = convertCapture(capture);
  const target = importPathFor(day, repoRoot);
  if (!rows.length) return { written: false, reason: 'no mappable rows', rows: 0, skipped, target };
  if (fs.existsSync(target) && !overwrite) {
    return { written: false, reason: 'import file for this date already exists (use --overwrite)', rows: rows.length, skipped, target };
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(rows, null, 2) + '\n', 'utf8');
  return { written: true, rows: rows.length, skipped, target, capturedAt };
}

function summarize(rows) {
  const by = {};
  for (const r of rows) by[r.market_type] = (by[r.market_type] || 0) + 1;
  return by;
}

if (process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  const file = process.argv[2];
  if (!file || file.startsWith('--')) {
    console.error('usage: node scripts/props/beo-futures-to-imports.mjs <capture.json> [--write] [--overwrite]');
    process.exit(2);
  }
  const capture = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const { rows, skipped, capturedAt } = convertCapture(capture);
  // Local-date label to match the scraper's own stamp() naming.
  const d = new Date(capture.capturedAt);
  const p = (n) => String(n).padStart(2, '0');
  const day = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  console.log(`capturedAt ${capturedAt} -> file betonline-${day}.json`);
  console.log('mapped rows by market_type:', summarize(rows));
  console.log('skipped (not in import schema):', skipped);
  if (process.argv.includes('--write')) {
    const res = writeImportFile(capture, day, { overwrite: process.argv.includes('--overwrite') });
    console.log(res.written ? `wrote ${res.rows} rows -> ${res.target}` : `NOT written: ${res.reason}`);
  } else {
    console.log('(preview only; pass --write to create the import file)');
  }
}
