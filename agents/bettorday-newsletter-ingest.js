// agents/bettorday-newsletter-ingest.js
// Ingests BettorDay daily newsletters and Trench Strength of Schedule ratings.
// Operates via native fetch without requiring headless browser automation.
//
// Usage:
//   node agents/bettorday-newsletter-ingest.js [--season 2026] [--limit 10] [--dry-run]
//

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data', 'intel');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);

const SEASON = parseInt(getArg('--season', '2026'), 10);
const WEEK = parseInt(getArg('--week', '0'), 10);
const LIMIT = parseInt(getArg('--limit', '10'), 10);
const DRY_RUN = has('--dry-run');
const AS_OF = getArg('--as-of', new Date().toISOString().slice(0, 10));

const SITEMAP_URL = 'https://www.bettorday.com/sitemap-posts.xml';
const TRENCH_URL = 'https://www.bettorday.com/the-2026-trench-strength-of-schedule-report/';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const NFL_TEAMS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',
  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG',
  'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'
];

const TEAM_NAME_MAP = {
  'cardinals': 'ARI', 'falcons': 'ATL', 'ravens': 'BAL', 'bills': 'BUF',
  'panthers': 'CAR', 'bears': 'CHI', 'bengals': 'CIN', 'browns': 'CLE',
  'cowboys': 'DAL', 'broncos': 'DEN', 'lions': 'DET', 'packers': 'GB',
  'texans': 'HOU', 'colts': 'IND', 'jaguars': 'JAX', 'chiefs': 'KC',
  'chargers': 'LAC', 'rams': 'LAR', 'raiders': 'LV', 'dolphins': 'MIA',
  'vikings': 'MIN', 'patriots': 'NE', 'saints': 'NO', 'giants': 'NYG',
  'jets': 'NYJ', 'eagles': 'PHI', 'steelers': 'PIT', 'seahawks': 'SEA',
  '49ers': 'SF', 'buccaneers': 'TB', 'bucs': 'TB', 'titans': 'TEN', 'commanders': 'WAS'
};

function normalizeTeamCode(code) {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  if (upper === 'LA') return 'LAR';
  if (upper === 'JAC') return 'JAX';
  if (upper === 'LVR') return 'LV';
  if (NFL_TEAMS.includes(upper)) return upper;
  return null;
}

export async function fetchTrenchReport() {
  console.log(`→ Fetching 2026 Trench Strength of Schedule from: ${TRENCH_URL}...`);
  const res = await fetch(TRENCH_URL, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml' }
  });
  if (!res.ok) throw new Error(`Failed to fetch Trench report: HTTP ${res.status}`);
  const html = await res.text();

  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const trenchRatings = [];

  for (const r of rows) {
    const cells = (r.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map(c =>
      c.replace(/<[^>]+>/g, '').replace(/&minus;/g, '-').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '-').replace(/−/g, '-').trim()
    );
    if (cells.length >= 7 && cells[0] !== '#' && !isNaN(parseInt(cells[0], 10))) {
      const rank = parseInt(cells[0], 10);
      const rawTeam = cells[1];
      const team = normalizeTeamCode(rawTeam);
      const scoreOverall = parseFloat(cells[2]);
      const runBlock = parseFloat(cells[3]);
      const passBlock = parseFloat(cells[4]);
      const runDef = parseFloat(cells[5]);
      const passRush = parseFloat(cells[6]);

      if (team && !isNaN(scoreOverall)) {
        trenchRatings.push({
          team,
          season: SEASON,
          week: WEEK,
          rank_overall: rank,
          score_overall: scoreOverall,
          run_block_z: runBlock,
          pass_block_z: passBlock,
          run_defense_z: runDef,
          pass_rush_z: passRush,
          as_of_date: AS_OF,
          source: 'bettorday'
        });
      }
    }
  }

  console.log(`✓ Parsed ${trenchRatings.length} NFL team trench composite records.`);
  return trenchRatings;
}

export async function fetchNewsletters(limit = LIMIT) {
  console.log(`→ Discovering BettorDay posts from: ${SITEMAP_URL}...`);
  const res = await fetch(SITEMAP_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Failed to fetch sitemap: HTTP ${res.status}`);
  const xml = await res.text();

  const urlMatches = [...xml.matchAll(/<url>[\s\S]*?<loc>(https:\/\/www\.bettorday\.com\/[^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/g)];
  console.log(`✓ Found ${urlMatches.length} total posts in sitemap.`);

  const candidatePosts = urlMatches
    .map(m => ({ url: m[1], lastmod: m[2] }))
    .filter(p => p.url.includes('2026') && !p.url.includes('trench'))
    .slice(0, limit);

  console.log(`→ Processing top ${candidatePosts.length} newsletter editions...`);
  const articles = [];

  for (const item of candidatePosts) {
    try {
      const postRes = await fetch(item.url, { headers: { 'User-Agent': USER_AGENT } });
      if (!postRes.ok) continue;
      const html = await postRes.text();

      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : item.url;

      const articleMatch = html.match(/<article[\s\S]*?<\/article>/i) || html.match(/<main[\s\S]*?<\/main>/i);
      if (!articleMatch) continue;

      const cleanText = articleMatch[0]
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&mdash;/g, '—')
        .replace(/\s+/g, ' ')
        .trim();

      // Detect teams mentioned
      const lower = cleanText.toLowerCase();
      const teams = new Set();
      for (const [key, code] of Object.entries(TEAM_NAME_MAP)) {
        if (lower.includes(key)) teams.add(code);
      }

      const slug = item.url.replace('https://www.bettorday.com/', '').replace(/\/$/, '');

      articles.push({
        id: `bettorday_${slug}`,
        source: 'bettorday',
        title,
        published_at: item.lastmod,
        url: item.url,
        teams_mentioned: [...teams],
        summary: cleanText.slice(0, 500) + '...',
        raw_content: cleanText,
        captured_at: new Date().toISOString()
      });
      console.log(`  ✓ Ingested: "${title.slice(0, 50)}" (${teams.size} teams detected)`);
    } catch (e) {
      console.error(`  ⚠ Failed fetching ${item.url}:`, e.message);
    }
  }

  return articles;
}

export async function main() {
  console.log(`=======================================================`);
  console.log(`BettorDay Intel Ingestion Agent (Season ${SEASON})`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (local receipts only)' : 'LIVE SUPABASE SYNC'}`);
  console.log(`=======================================================\n`);

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(RECEIPTS_DIR, { recursive: true });

  const trenchRatings = await fetchTrenchReport();
  const newsletters = await fetchNewsletters(LIMIT);

  // Write local receipt files
  const trenchFile = path.join(DATA_DIR, `bettorday_trench_ratings_${SEASON}.json`);
  await writeFile(trenchFile, JSON.stringify(trenchRatings, null, 2), 'utf8');
  console.log(`\n✓ Saved Trench ratings dataset to: ${trenchFile}`);

  const receiptFile = path.join(RECEIPTS_DIR, `bettorday_newsletters_${AS_OF}.json`);
  await writeFile(receiptFile, JSON.stringify(newsletters, null, 2), 'utf8');
  console.log(`✓ Saved newsletter batch receipt to: ${receiptFile}`);

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Skipping database upsert. Process completed successfully.`);
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log(`\n⚠ Supabase credentials not found in environment. Retaining local data.`);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\n→ Syncing ${trenchRatings.length} trench records to Supabase (nfl_trench_ratings)...`);
  const { error: trenchErr } = await supabase
    .from('nfl_trench_ratings')
    .upsert(trenchRatings, { onConflict: 'team,season,week,as_of_date' });
  if (trenchErr) console.error(`⚠ Trench Supabase upsert error:`, trenchErr.message);
  else console.log(`✓ Trench ratings synced to Supabase.`);

  console.log(`→ Syncing ${newsletters.length} newsletter records to Supabase (intel_newsletters)...`);
  const { error: newsErr } = await supabase
    .from('intel_newsletters')
    .upsert(newsletters, { onConflict: 'id' });
  if (newsErr) console.error(`⚠ Newsletter Supabase upsert error:`, newsErr.message);
  else console.log(`✓ Newsletters synced to Supabase.`);
}

main().catch(err => {
  console.error('Fatal error in bettorday-newsletter-ingest:', err);
  process.exit(1);
});
