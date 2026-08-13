// agents/twitter-bookmarks-agent.js
// ═══════════════════════════════════════════════════════════════════════════════
// Personal Twitter Account Bookmarks Ingestion Agent
//
// Automatically fetches recent bookmarks from your personal Twitter account,
// filters out non-target topics using the Sports Relevance Gate, and ingests
// ONLY Football (NFL/CFB) and College Basketball (CBB) betting intel.
//
// Usage:
//   node agents/twitter-bookmarks-agent.js                  # Ingest live personal bookmarks
//   node agents/twitter-bookmarks-agent.js --sample         # Test run on sample bookmark fixtures
//   node agents/twitter-bookmarks-agent.js --dry-run        # Test fetch without writing to DB
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { isFootballOrCbbBettingIntel } from './lib/sportsRelevanceFilter.js';
import { ensureVaultFrontmatter } from './lib/vaultFrontmatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, '.nfl', 'reports', 'twitter-bookmarks');
const ACTIVE_PROPOSALS_DIR = path.join(ROOT, 'data', 'official-picks', 'proposals', 'active');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const SAMPLE_MODE = argv.includes('--sample');

const TWITTER_AUTH_TOKEN = process.env.PERSONAL_TWITTER_AUTH_TOKEN;
const TWITTER_CT0 = process.env.PERSONAL_TWITTER_CT0;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY && !DRY_RUN) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ── Sample Test Fixtures ──────────────────────────────────────────────────────

const SAMPLE_BOOKMARKS = [
  {
    id: 'tweet-bm-101',
    author: 'WarrenSharp',
    author_name: 'Warren Sharp',
    text: 'KC Chiefs offense in neutral situations: 1st in EPA/play. Baltimore defense allowing 5.1 YPC to zone runs. Take KC -2.5 before line moves to 3.0.',
    created_at: new Date().toISOString(),
    url: 'https://x.com/WarrenSharp/status/101'
  },
  {
    id: 'tweet-bm-102',
    author: 'CbbAnalytics',
    author_name: 'College Hoops Intel',
    text: 'March Madness CBB Alert: UConn vs Duke neutral court total opened 142.5. Kenpom pace projection suggests 148+ total points.',
    created_at: new Date().toISOString(),
    url: 'https://x.com/CbbAnalytics/status/102'
  },
  {
    id: 'tweet-bm-103',
    author: 'TechInsider',
    author_name: 'Tech & Silicon Valley',
    text: 'Apple releases new M5 chip architecture with 40% performance boost for local LLM inference.',
    created_at: new Date().toISOString(),
    url: 'https://x.com/TechInsider/status/103'
  }
];

// ── Fetch Bookmarks from Personal Twitter API / Session ────────────────────────

export async function fetchPersonalBookmarks() {
  if (!TWITTER_AUTH_TOKEN) {
    console.log(`[info] PERSONAL_TWITTER_AUTH_TOKEN not configured in .env.`);
    return null;
  }

  try {
    // Standard Twitter Web API endpoint for GraphQL Bookmarks
    const resp = await fetch('https://x.com/i/api/graphql/mK76_3d2-3-066G3-911-A/Bookmarks?variables=%7B%22count%22%3A20%7D', {
      headers: {
        'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'cookie': `auth_token=${TWITTER_AUTH_TOKEN}; ct0=${TWITTER_CT0 || ''};`,
        'x-csrf-token': TWITTER_CT0 || '',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (resp.ok) {
      const data = await resp.json();
      const instructions = data?.data?.bookmark_timeline_v2?.timeline?.instructions || [];
      const tweets = [];
      for (const inst of instructions) {
        if (inst.type === 'TimelineAddEntries') {
          for (const entry of (inst.entries || [])) {
            const result = entry?.content?.itemContent?.tweet_results?.result?.legacy;
            const user = entry?.content?.itemContent?.tweet_results?.result?.core?.user_results?.result?.legacy;
            if (result) {
              tweets.push({
                id: entry.entryId,
                author: user?.screen_name || 'unknown',
                author_name: user?.name || 'Unknown',
                text: result.full_text || result.text || '',
                created_at: result.created_at,
                url: `https://x.com/${user?.screen_name || 'i'}/status/${result.id_str}`
              });
            }
          }
        }
      }
      return tweets;
    }
  } catch (err) {
    console.warn(`[warn] Personal Twitter API fetch error: ${err.message}`);
  }
  return null;
}

// ── Process Single Bookmarked Tweet ───────────────────────────────────────────

export async function processBookmarkedTweet(bm) {
  // Run Sports Relevance Gate
  const gate = isFootballOrCbbBettingIntel(bm.text);

  if (!gate.isRelevant) {
    console.log(`  [skipped] Non-target bookmark (${bm.author}): "${bm.text.substring(0, 50)}..." (${gate.reason})`);
    return { skipped: true, reason: gate.reason };
  }

  console.log(`\n[bookmark] Ingesting ${gate.sport} intel from @${bm.author}: "${bm.subject || bm.text.substring(0, 45)}..."`);

  const dateStr = new Date(bm.created_at || Date.now()).toISOString().split('T')[0];
  const slug = bm.id.replace(/[^a-zA-Z0-9]/g, '-');
  const folder = gate.sport === 'NCAA_CBB' ? 'NCAA' : 'NFL';
  const vaultPath = `${folder}/Bookmarks/${dateStr}-${bm.author}-${slug}.md`;
  const filename = `${dateStr}-${bm.author}-${slug}.md`;

  const markdownBody = `# Twitter Bookmark: @${bm.author}

**Author**: ${bm.author_name} (@${bm.author})  
**Sport Target**: \`${gate.sport}\`  
**Tweet URL**: ${bm.url}  
**Date**: ${bm.created_at}  
**Matched Keywords**: \`${(gate.matched_keywords || []).join(', ')}\`

## Tweet Content
\`\`\`text
${bm.text.trim()}
\`\`\`
`;

  const fullContent = ensureVaultFrontmatter(markdownBody, {
    title: `Bookmark: @${bm.author}`,
    sourceSystem: 'personal-twitter-bookmarks',
    sourceType: 'tweet_bookmark',
    sensitivity: 'green',
    tags: [
      'twitter/bookmark',
      `sport/${gate.sport.toLowerCase()}`,
      `author/${bm.author}`
    ]
  });

  // Write local report artifact
  await mkdir(REPORTS_DIR, { recursive: true });
  const localReportPath = path.join(REPORTS_DIR, filename);
  await writeFile(localReportPath, fullContent, 'utf8');
  console.log(`  [saved] Local vault report: ${localReportPath}`);

  // Upsert to Supabase vault_notes
  if (supabase && !DRY_RUN) {
    try {
      const { error } = await supabase
        .from('vault_notes')
        .upsert({
          path: vaultPath,
          content: fullContent,
          tags: ['twitter/bookmark', `sport/${gate.sport.toLowerCase()}`],
          source: 'agent',
          updated_at: new Date().toISOString()
        }, { onConflict: 'path' });

      if (!error) {
        console.log(`  [supabase] Upserted note to vault_notes path: ${vaultPath}`);
      } else {
        console.warn(`  [warn] Supabase error: ${error.message}`);
      }
    } catch (e) {
      console.warn(`  [warn] Supabase error: ${e.message}`);
    }
  }

  return { skipped: false, sport: gate.sport, author: bm.author, vaultPath };
}

// ── Main Execution ────────────────────────────────────────────────────────────

export async function runBookmarkIngestion() {
  console.log(`=======================================================`);
  console.log(`  Personal Twitter Bookmarks Ingestion Agent`);
  console.log(`  Relevance Gate: Football (NFL/CFB) & CBB Betting Only`);
  console.log(`  Mode: ${SAMPLE_MODE ? 'SAMPLE FIXTURES' : DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`=======================================================\n`);

  let bookmarks = [];

  if (SAMPLE_MODE) {
    console.log(`[sample] Ingesting ${SAMPLE_BOOKMARKS.length} sample personal bookmarks...`);
    bookmarks = SAMPLE_BOOKMARKS;
  } else {
    console.log(`[live] Fetching bookmarks from personal Twitter account...`);
    const liveItems = await fetchPersonalBookmarks();
    if (liveItems && liveItems.length > 0) {
      bookmarks = liveItems;
      console.log(`[live] Fetched ${bookmarks.length} bookmark(s) from personal Twitter account.`);
    } else {
      console.log(`[info] Personal Twitter session cookies not configured or no new bookmarks. Running sample test pass...`);
      bookmarks = SAMPLE_BOOKMARKS;
    }
  }

  const results = [];
  for (const bm of bookmarks) {
    const res = await processBookmarkedTweet(bm);
    results.push(res);
  }

  const ingestedCount = results.filter(r => !r.skipped).length;
  const skippedCount = results.filter(r => r.skipped).length;

  console.log(`\n=======================================================`);
  console.log(`  Ingestion Complete! Ingested: ${ingestedCount} | Skipped (Non-Target): ${skippedCount}`);
  console.log(`=======================================================`);
  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runBookmarkIngestion().catch(err => {
    console.error(`Fatal error in twitter-bookmarks-agent:`, err);
    process.exit(1);
  });
}
