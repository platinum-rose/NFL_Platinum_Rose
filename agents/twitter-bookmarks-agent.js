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

import { existsSync } from 'node:fs';
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
const maxDaysArg = argv.find(a => a.startsWith('--max-days='));
const MAX_DAYS = maxDaysArg ? parseInt(maxDaysArg.split('=')[1], 10) : 30;

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

export async function fetchPersonalBookmarks(queryKeywords = ['NFL', 'CBB', 'football', 'basketball', 'betting', 'spread', 'props']) {
  if (!TWITTER_AUTH_TOKEN) {
    console.log(`[info] PERSONAL_TWITTER_AUTH_TOKEN not configured in .env.`);
    return null;
  }

  const qid = 'ioP4Xb7LV__rVXS2f88ayg';
  const op = 'BookmarkSearchTimeline';

  const features = {
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    articles_preview_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    rweb_video_timestamps_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_enhance_cards_enabled: false
  };

  const allTweets = [];
  const seenIds = new Set();

  for (const q of queryKeywords) {
    try {
      const variables = { rawQuery: q, count: 20 };
      const url = `https://x.com/i/api/graphql/${qid}/${op}?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(features))}`;

      const resp = await fetch(url, {
        headers: {
          'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
          'cookie': `auth_token=${TWITTER_AUTH_TOKEN}; ct0=${TWITTER_CT0 || ''};`,
          'x-csrf-token': TWITTER_CT0 || '',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        const instructions = data?.data?.search_by_raw_query?.bookmarks_search_timeline?.timeline?.instructions || [];
        for (const inst of instructions) {
          if (inst.type === 'TimelineAddEntries') {
            for (const entry of (inst.entries || [])) {
              const tweetResult = entry?.content?.itemContent?.tweet_results?.result;
              const legacy = tweetResult?.legacy || tweetResult?.tweet?.legacy;
              
              if (legacy && legacy.id_str && !seenIds.has(legacy.id_str)) {
                seenIds.add(legacy.id_str);
                const userRes = tweetResult?.core?.user_results?.result || tweetResult?.tweet?.core?.user_results?.result;
                const userLegacy = userRes?.legacy || userRes;
                const authorHandle = userLegacy?.screen_name || 'twitter_user';
                const authorName = userLegacy?.name || authorHandle;

                const mediaItems = legacy.extended_entities?.media || legacy.entities?.media || [];
                const mediaUrls = mediaItems.map(m => m.media_url_https).filter(Boolean);

                allTweets.push({
                  id: legacy.id_str,
                  author: authorHandle,
                  author_name: authorName,
                  text: legacy.full_text || legacy.text || '',
                  created_at: legacy.created_at,
                  url: `https://x.com/${authorHandle}/status/${legacy.id_str}`,
                  media_urls: mediaUrls
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn(`  [warn] Bookmark search error for "${q}": ${err.message}`);
    }
  }

  return allTweets;
}

export async function analyzeTweetImageWithGeminiVision(imageUrl) {
  if (!GEMINI_API_KEY) return null;

  try {
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) return null;
    const arrayBuffer = await imgResp.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const prompt = `Analyze this NFL / College Sports betting graphic, player prop cheat sheet, or ticket screenshot. Extract all player prop stacks, betting lines, and recommendations. Output JSON:
{
  "has_prop_stacks": true,
  "player_props": [
    {
      "player_name": "Full Player Name",
      "team": "Team Abbreviation e.g. KC, NE, DEN",
      "prop_type": "passing_yards | rushing_yards | receiving_yards | receptions | touchdowns | points",
      "line": 39.5,
      "side": "OVER | UNDER",
      "odds": "-115",
      "rationale": "Brief rationale from graphic"
    }
  ],
  "game_picks": [
    {
      "team": "Team Name",
      "line": "-3.0 or O45.5",
      "confidence": 80
    }
  ]
}`;

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return JSON.parse(rawText);
      }
    }
  } catch (err) {
    console.warn(`  [warn] Gemini Vision tweet media OCR error: ${err.message}`);
  }
  return null;
}

export async function generateLocalOllamaSummary(text, sport) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
  const model = process.env.OLLAMA_MODEL || 'llama3';
  try {
    const resp = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `Analyze this ${sport} sports betting tweet. Output a 2-bullet point executive summary:\n"${text}"`,
        stream: false
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.response ? data.response.trim() : null;
    }
  } catch (_err) {
    // Silent fallback if Ollama is not running locally
  }
  return null;
}

// ── Process Single Bookmarked Tweet ───────────────────────────────────────────

export async function processBookmarkedTweet(bm) {
  // 1. Recency Gate (skip tweets older than MAX_DAYS)
  const tweetDate = new Date(bm.created_at || Date.now());
  const ageDays = (Date.now() - tweetDate.getTime()) / (1000 * 60 * 60 * 24);
  const dateStr = tweetDate.toISOString().split('T')[0];

  if (ageDays > MAX_DAYS) {
    console.log(`  [skipped-stale] Bookmark (@${bm.author}): Created ${dateStr} exceeds ${MAX_DAYS}-day recency limit.`);
    return { skipped: true, reason: `Exceeds ${MAX_DAYS}-day recency limit` };
  }

  // 2. Deduplication Gate (skip if local report already exists)
  const slug = bm.id.replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `${dateStr}-${bm.author}-${slug}.md`;
  const localReportPath = path.join(REPORTS_DIR, filename);

  if (existsSync(localReportPath)) {
    console.log(`  [already-processed] Skipping @${bm.author}: "${bm.text.substring(0, 40)}..." (already in local vault)`);
    return { skipped: true, reason: 'Already in local vault' };
  }

  // 3. Run Sports Relevance Gate
  const gate = isFootballOrCbbBettingIntel(bm.text);

  if (!gate.isRelevant) {
    console.log(`  [skipped] Non-target bookmark (${bm.author}): "${bm.text.substring(0, 50)}..." (${gate.reason})`);
    return { skipped: true, reason: gate.reason };
  }

  console.log(`\n[bookmark] Ingesting ${gate.sport} intel from @${bm.author}: "${bm.subject || bm.text.substring(0, 45)}..."`);

  // Optional local LLM summary via Ollama if enabled
  let localSummary = null;
  if (process.env.USE_LOCAL_LLM === 'true') {
    localSummary = await generateLocalOllamaSummary(bm.text, gate.sport);
    if (localSummary) {
      console.log(`  [ollama] Generated local LLM summary via ${process.env.OLLAMA_MODEL || 'llama3'}`);
    }
  }

  // Vision OCR analysis for attached tweet images / prop stack graphics
  let visionAnalysis = null;
  if (bm.media_urls && bm.media_urls.length > 0) {
    console.log(`  [vision] Found ${bm.media_urls.length} media attachment(s). Running Gemini Vision OCR...`);
    for (const imgUrl of bm.media_urls) {
      const vRes = await analyzeTweetImageWithGeminiVision(imgUrl);
      if (vRes) {
        visionAnalysis = vRes;
        console.log(`  [vision] Extracted ${vRes.player_props?.length || 0} player prop(s) from graphic.`);
        break;
      }
    }
  }

  // dateStr, slug, filename, and localReportPath are already defined above
  const folder = gate.sport === 'NCAA_CBB' ? 'NCAA' : 'NFL';
  const vaultPath = `${folder}/Bookmarks/${dateStr}-${bm.author}-${slug}.md`;

  let propSection = '';
  if (visionAnalysis && visionAnalysis.player_props && visionAnalysis.player_props.length > 0) {
    propSection = `\n## Extracted Player Prop Stacks (Vision OCR)\n`;
    propSection += `| Player | Team | Prop Type | Line | Side | Odds | Rationale |\n`;
    propSection += `| --- | --- | --- | --- | --- | --- | --- |\n`;
    for (const p of visionAnalysis.player_props) {
      propSection += `| ${p.player_name || 'N/A'} | ${p.team || 'N/A'} | ${p.prop_type || 'N/A'} | ${p.line || 'N/A'} | ${p.side || 'N/A'} | ${p.odds || 'N/A'} | ${p.rationale || 'N/A'} |\n`;
    }
  }

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
${propSection}`;

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
