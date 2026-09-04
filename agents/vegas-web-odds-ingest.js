// agents/vegas-web-odds-ingest.js
// ═══════════════════════════════════════════════════════════════════════════════
// VegasWebOddsIngestAgent — Automated Web Scraper for Vegas Sharp Futures
// (Circa Sports & Station Casinos / STN Sports).
//
// Runtime: Node.js ESM (run via GitHub Actions or: node agents/vegas-web-odds-ingest.js)
// Env vars required:
//   SUPABASE_URL              — https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service_role JWT (bypasses RLS for writes)
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { normalizeTeam } from '../src/lib/teams.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const ARG_DRY_RUN = process.argv.includes('--dry-run');
const DRY_RUN = ARG_DRY_RUN || process.env.DRY_RUN === 'true';

function truncateToHour(date) {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

// ── Web Scraper Feed Sources ──────────────────────────────────────────────────
const VEGAS_WEB_FEEDS = [
  {
    name: 'VSiN Nevada Futures Feed',
    url: 'https://data.vsin.com/nfl/futures/',
    type: 'vsin',
  },
];

export async function scrapeCircaAndStationOdds() {
  const rows = [];
  const snapshotTime = truncateToHour(new Date());

  console.log('🌐 Polling Nevada web feeds for Circa Sports & Station Casinos odds...');

  for (const feed of VEGAS_WEB_FEEDS) {
    try {
      console.log(`  Fetching ${feed.name} (${feed.url})...`);
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!res.ok) {
        console.warn(`  ⚠️ HTTP ${res.status} from ${feed.url}`);
        continue;
      }

      const html = await res.text();
      console.log(`  Received ${html.length} bytes from ${feed.name}`);

      // Extract JSON or embedded data attributes containing odds
      const matches = html.match(/data-team=["']([^"']+)["'][^>]*data-book=["']([^"']+)["'][^>]*data-odds=["']([^"']+)["']/gi);

      if (matches) {
        for (const m of matches) {
          const teamMatch = m.match(/data-team=["']([^"']+)["']/i);
          const bookMatch = m.match(/data-book=["']([^"']+)["']/i);
          const oddsMatch = m.match(/data-odds=["']([^"']+)["']/i);

          if (teamMatch && bookMatch && oddsMatch) {
            const rawTeam = teamMatch[1];
            const rawBook = bookMatch[1].toLowerCase();
            const oddsVal = parseInt(oddsMatch[1], 10);

            let book = null;
            if (rawBook.includes('circa')) book = 'circa';
            else if (rawBook.includes('station') || rawBook.includes('stn')) book = 'station';

            if (book && !isNaN(oddsVal)) {
              const team = normalizeTeam(rawTeam) || rawTeam;
              let impliedProb;
              if (oddsVal >= 100) impliedProb = 100 / (oddsVal + 100);
              else impliedProb = Math.abs(oddsVal) / (Math.abs(oddsVal) + 100);

              rows.push({
                snapshot_time: snapshotTime,
                market_type: 'superbowl',
                team,
                book,
                odds: oddsVal,
                implied_prob: parseFloat(impliedProb.toFixed(4)),
                season: 2026,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn(`  ⚠️ Scrape error for ${feed.name}:`, err.message);
    }
  }

  console.log(`  Extracted ${rows.length} sharp Vegas line(s) (Circa / Station)`);
  return rows;
}

export async function writeSnapshots(supabase, rows) {
  if (rows.length === 0) return 0;
  const BATCH = 200;
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('futures_odds_snapshots')
      .upsert(batch, { onConflict: 'market_type,team,book,snapshot_time' });
    if (error) throw new Error(`Supabase upsert error: ${error.message}`);
    written += batch.length;
  }
  return written;
}

async function writeReceipt(receipt) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RECEIPTS_DIR, `vegas-web-odds-ingest-${ts}.json`);
  await writeFile(filePath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return filePath;
}

async function main() {
  const startTime = Date.now();
  console.log('🎰 VegasWebOddsIngestAgent (Circa & Station) starting…');
  console.log(`   DRY_RUN=${DRY_RUN}`);

  const rows = await scrapeCircaAndStationOdds();

  const receipt = {
    captured_at: truncateToHour(new Date()),
    completed_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    total_rows: rows.length,
    sample_rows: rows.slice(0, 5),
  };

  if (DRY_RUN || !SUPABASE_URL || !SUPABASE_KEY) {
    console.log('🔍 DRY RUN — skipping Supabase write. Sample extracted rows:');
    console.table(rows.slice(0, 10));
    const receiptPath = await writeReceipt(receipt);
    console.log(`🧾 Run receipt: ${receiptPath}`);
    console.log('✅ Dry run complete.');
    return;
  }

  if (rows.length > 0) {
    const supabase = getSupabase();
    console.log('💾 Writing snapshots to Supabase...');
    const written = await writeSnapshots(supabase, rows);
    console.log(`  ✅ Wrote ${written} rows to futures_odds_snapshots`);
  }

  const receiptPath = await writeReceipt(receipt);
  console.log(`🧾 Run receipt: ${receiptPath}`);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ VegasWebOddsIngestAgent done in ${elapsed}s`);
}

if (process.argv[1] && process.argv[1].endsWith('vegas-web-odds-ingest.js')) {
  main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}
