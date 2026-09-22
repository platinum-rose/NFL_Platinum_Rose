#!/usr/bin/env node
// scripts/scan-unprocessed-tweet-threads.mjs
// ═══════════════════════════════════════════════════════════════════════════════
// Automated Scanner for Unprocessed Twitter/X Bookmark Threads
//
// Periodically checks Supabase research_intel_notes against research_pick_signals
// and existing Grok CSVs in data/vault-seed/manual/grok-*/.
//
// NFL Week Schedule Cadence:
//   - Each NFL week runs Tuesday 00:00 ET through Monday Night Football (~23:59 ET).
//   - Week 2 ends with Monday Night Football (tonight, Sep 21).
//   - Week 3 starts Tuesday morning (tomorrow, Sep 22) through next Monday night.
//   - Week 4 starts following Tuesday (Sep 29) through following Monday night.
//   - Each week automatically writes to its dedicated folder:
//     data/vault-seed/manual/grok-weekNN-threads/grok-twitter-picks-YYYY-MM-DD.csv
//
// When unparsed threads or zero-signal bookmark tweets are discovered, it
// generates a ready-to-paste Grok prompt packet:
//   - data/research-intel/grok-thread-prompt-latest.md
//   - data/research-intel/grok-thread-urls-latest.txt
//
// Usage:
//   node scripts/scan-unprocessed-tweet-threads.mjs
//   node scripts/scan-unprocessed-tweet-threads.mjs --dry-run
//   node scripts/scan-unprocessed-tweet-threads.mjs --print-prompt
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VAULT_MANUAL = path.join(ROOT, 'data', 'vault-seed', 'manual');
const INTEL_DIR = path.join(ROOT, 'data', 'research-intel');
const PROMPT_TEMPLATE_PATH = path.join(ROOT, 'docs', 'intel', 'GROK_THREAD_CAPTURE_PROMPT.md');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const PRINT_PROMPT = argv.includes('--print-prompt');
const MAX_URLS_PER_PROMPT = 30;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[error] Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Computes current NFL week and precise Tuesday-to-Monday date boundaries
 * in Eastern Time (America/New_York) to match game kickoff and rollover times.
 * Each week begins Tuesday 00:00 ET and ends Monday night after MNF (~23:59 ET).
 */
function getNFLWeekSchedule(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const map = {};
  for (const p of parts) map[p.type] = p.value;

  const nyDateStr = `${map.year}-${map.month}-${map.day}`;
  const nyDate = new Date(`${nyDateStr}T00:00:00`);

  // 2026 Regular Season Kickoff Anchor: Tuesday September 8, 2026
  const seasonStart = new Date('2026-09-08T00:00:00');
  const season = nyDate.getMonth() < 5 ? nyDate.getFullYear() - 1 : nyDate.getFullYear();

  const diffDays = Math.floor((nyDate.getTime() - seasonStart.getTime()) / (86400 * 1000));
  let week = Math.floor(diffDays / 7) + 1;
  if (week < 1) week = 1;

  // Week boundaries (Tuesday 00:00:00 ET to next Tuesday 00:00:00 ET)
  const weekStartMs = seasonStart.getTime() + (week - 1) * 7 * 86400 * 1000;
  const weekEndMs = weekStartMs + 7 * 86400 * 1000;

  // Convert ET local boundaries to UTC ISO strings
  const weekStart = new Date(weekStartMs);
  const weekEnd = new Date(weekEndMs);

  return {
    week,
    season,
    nyDateStr,
    weekStart,
    weekEnd,
    weekFolder: `grok-week${String(week).padStart(2, '0')}-threads`,
  };
}

/** Recursively find all Grok CSV files in manual vault seed directory */
async function findGrokCsvs(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findGrokCsvs(fullPath));
    } else if (/grok-.*\.csv$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Extract all tweet URLs already captured across existing Grok CSVs */
async function loadCapturedGrokUrls() {
  const csvFiles = await findGrokCsvs(VAULT_MANUAL);
  const capturedUrls = new Set();

  for (const file of csvFiles) {
    try {
      const content = await readFile(file, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const cols = line.split(',');
        // Column 1 is tweet_url
        if (cols[1] && cols[1].startsWith('http')) {
          capturedUrls.add(cols[1].trim());
        }
      }
    } catch (err) {
      console.warn(`[warn] Failed to read ${file}: ${err.message}`);
    }
  }
  return { capturedUrls, csvCount: csvFiles.length };
}

/** Filter out tweets about games already concluded in or before this week */
function isAlreadyPlayedGame(note, currentWeek) {
  const text = `${note.title || ''} ${note.summary || ''}`.toLowerCase();

  // If text refers explicitly to an older week (e.g. "Week 1" when currentWeek >= 2)
  for (let w = 1; w < currentWeek; w++) {
    if (text.includes(`week ${w}`) || text.includes(`week${w}`)) {
      return true;
    }
  }

  // Week 2 Thursday Night Football was Bills @ Lions / Lions @ Bills
  if (currentWeek === 2) {
    if (text.includes('thursday night football') || text.includes('bills vs. lions') || text.includes('lions vs bills') || text.includes('bills/lions')) {
      return true;
    }
  }

  // Week 1 historical games
  if (text.includes('broncos/chiefs') || text.includes('chiefs-broncos') || text.includes('week 1 recap') || text.includes('week 1 reactions') || text.includes('week 1 odds') || text.includes('week 1 betting recap')) {
    return true;
  }

  return false;
}

async function main() {
  const now = new Date();
  const schedule = getNFLWeekSchedule(now);
  const { week, season, nyDateStr, weekStart, weekEnd, weekFolder } = schedule;

  console.log(`[${now.toISOString()}] NFL Grok Thread Scanner Active`);
  console.log(`  Slate: Season ${season} Week ${week} (Folder: ${weekFolder})`);
  console.log(`  Window: ${weekStart.toISOString()} -> ${weekEnd.toISOString()}`);

  // 1. Gather all URLs already processed in Grok CSVs across all weeks
  const { capturedUrls, csvCount } = await loadCapturedGrokUrls();
  console.log(`  Found ${capturedUrls.size} existing unique tweet URLs across ${csvCount} Grok CSV(s).`);

  // 2. Ensure target week folder exists in data/vault-seed/manual/
  const targetWeekDir = path.join(VAULT_MANUAL, weekFolder);
  if (!DRY_RUN && !existsSync(targetWeekDir)) {
    await mkdir(targetWeekDir, { recursive: true });
    console.log(`  Created week folder: ${targetWeekDir}`);
  }

  // 3. Fetch bookmark notes for the CURRENT week window (Tuesday 00:00 ET to Monday night)
  // This automatically ensures tomorrow's bookmarks (Tuesday) start fresh for Week 3!
  const { data: notes, error: nErr } = await supabase
    .from('research_intel_notes')
    .select('id, url, title, author, captured_at, published_at, summary')
    .ilike('url', '%x.com%')
    .gte('captured_at', weekStart.toISOString())
    .lt('captured_at', weekEnd.toISOString())
    .order('captured_at', { ascending: false });

  if (nErr) {
    console.error(`[error] Failed to fetch research_intel_notes: ${nErr.message}`);
    process.exit(1);
  }

  if (!notes || notes.length === 0) {
    console.log(`[info] No Twitter bookmark notes found yet for Week ${week}.`);
    return;
  }

  // 4. Query existing signals for these notes to know if they already produced signals
  const noteIds = notes.map(n => n.id);
  const { data: signals, error: sErr } = await supabase
    .from('research_pick_signals')
    .select('id, note_id, event_ref')
    .in('note_id', noteIds);

  if (sErr) {
    console.error(`[error] Failed to fetch research_pick_signals: ${sErr.message}`);
    process.exit(1);
  }

  const signalNoteIds = new Set((signals || []).map(s => s.note_id));
  const signalUrls = new Set((signals || []).map(s => s.event_ref));

  // 5. Identify unprocessed threads for active slate
  const pendingThreads = [];
  const skippedPlayed = [];

  for (const note of notes) {
    if (capturedUrls.has(note.url)) continue; // Already captured in a Grok CSV

    if (isAlreadyPlayedGame(note, week)) {
      skippedPlayed.push(note);
      continue;
    }

    const hasSignals = signalNoteIds.has(note.id) || signalUrls.has(note.url);
    const text = `${note.title || ''} ${note.summary || ''}`;
    const isExplicitThread = /\[\d+\/\d+\]|🧵|\bthread\b/i.test(text);

    // Prioritize explicit multi-tweet threads and zero-signal notes
    if (!hasSignals || isExplicitThread) {
      pendingThreads.push({
        url: note.url,
        author: note.author || 'unknown',
        title: note.title || '(untitled)',
        published_at: note.published_at || note.captured_at,
        hasSignals,
        isExplicitThread,
      });
    }
  }

  console.log(`[result] Scanned ${notes.length} Week ${week} notes: ${pendingThreads.length} active unprocessed thread(s), ${skippedPlayed.length} skipped.`);

  if (pendingThreads.length === 0) {
    console.log(`[done] All Week ${week} Twitter bookmark threads are processed. No action needed.`);
    return;
  }

  // Sort: explicit multi-tweet threads first, then by recency
  pendingThreads.sort((a, b) => {
    if (a.isExplicitThread && !b.isExplicitThread) return -1;
    if (!a.isExplicitThread && b.isExplicitThread) return 1;
    return new Date(b.published_at) - new Date(a.published_at);
  });

  const cappedThreads = pendingThreads.slice(0, MAX_URLS_PER_PROMPT);

  // 6. Generate Grok prompt packet
  let template = '';
  if (existsSync(PROMPT_TEMPLATE_PATH)) {
    template = await readFile(PROMPT_TEMPLATE_PATH, 'utf8');
  }

  let promptBody = template;
  const promptSplit = template.split(/## Prompt[^\n]*/i);
  if (promptSplit.length > 1) {
    promptBody = promptSplit[1].trim();
  }

  // Inject current date, season, and active week
  promptBody = promptBody
    .replace(/\{DATE\}/g, nyDateStr)
    .replace(/\{SEASON\}/g, String(season))
    .replace(/\{WEEK\}/g, String(week));

  const urlListText = cappedThreads.map(t => t.url).join('\n');
  const fullPrompt = promptBody.replace(/\{PASTE URLS HERE, one per line\}/g, urlListText);

  const tableRows = cappedThreads.map(t =>
    `| @${t.author.replace(/\|/g, '')} | [Tweet Link](${t.url}) | ${t.isExplicitThread ? 'Multi-Tweet Thread' : 'Zero Signal Note'} | ${t.title.slice(0, 60).replace(/\|/g, '')} |`
  ).join('\n');

  const expectedCsvName = `grok-twitter-picks-${nyDateStr}.csv`;
  const expectedCsvPath = `data/vault-seed/manual/${weekFolder}/${expectedCsvName}`;

  const mdReport = `# Grok Thread Capture Packet — ${nyDateStr} (Week ${week})
*Generated automatically by NFL_Dashboard Grok Thread Scanner at ${now.toISOString()}*

Found **${cappedThreads.length}** active unprocessed Twitter/X bookmark threads for **Week ${week}** ready for Grok extraction.

## Unprocessed Threads (${cappedThreads.length}${pendingThreads.length > MAX_URLS_PER_PROMPT ? ` of ${pendingThreads.length}` : ''})

| Author | URL | Type | Context |
| :--- | :--- | :--- | :--- |
${tableRows}

---

## Ready-to-Paste Grok Prompt

Copy the block below and paste it directly into Grok:

\`\`\`markdown
${fullPrompt}
\`\`\`

---

## Instructions Once Grok Generates CSV
1. Save Grok's output CSV to:
   \`${expectedCsvPath}\`
2. Ingest into Supabase:
   \`\`\`powershell
   node scripts/load-external-intel-picks.mjs --dry-run
   node scripts/load-external-intel-picks.mjs --replace
   \`\`\`
*(The scanner will detect \`${expectedCsvName}\` on its next run and retire those URLs from future prompt packets).*
`;

  if (!DRY_RUN) {
    await mkdir(INTEL_DIR, { recursive: true });
    const promptOutPath = path.join(INTEL_DIR, 'grok-thread-prompt-latest.md');
    const urlsOutPath = path.join(INTEL_DIR, 'grok-thread-urls-latest.txt');

    await writeFile(promptOutPath, mdReport, 'utf8');
    await writeFile(urlsOutPath, urlListText, 'utf8');

    console.log(`[saved] Wrote Grok prompt packet to: ${promptOutPath}`);
    console.log(`[saved] Wrote URL list to: ${urlsOutPath}`);
    console.log(`[info] Target CSV for this run: ${expectedCsvPath}`);
  }

  if (PRINT_PROMPT) {
    console.log('\n=================== GROK PROMPT PACKET ===================');
    console.log(fullPrompt);
    console.log('==========================================================\n');
  }

  console.log('\nUnprocessed Twitter Threads:');
  cappedThreads.forEach((t, i) => {
    console.log(`  [${i + 1}] @${t.author}: ${t.url} (${t.title.slice(0, 50)})`);
  });
  console.log('\n[done] Run complete.');
}

main().catch(err => {
  console.error(`[fatal] Scanner failed: ${err.message}`);
  process.exit(1);
});
