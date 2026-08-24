// agents/screenshot-watcher.js
// ═══════════════════════════════════════════════════════════════════════════════
// NFL Dashboard — Local Screenshot & Image OCR Intake Watcher
//
// Watches a local drop folder on Windows (default: data/intake-drop/) for
// dropped screenshots, tweets, tickets, or graphics. Uses Gemini 2.0 Vision
// to extract text, identify Twitter handles, analyze betting intel, and
// save formatted Markdown notes to Supabase vault_notes and local Obsidian.
//
// Usage:
//   node agents/screenshot-watcher.js                  # Process current files in drop folder once
//   node agents/screenshot-watcher.js --watch          # Run continuous watcher (polls folder every 3s)
//   node agents/screenshot-watcher.js --dry-run        # Dry run OCR extraction without writing to DB
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile, readFile, readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import 'dotenv/config';
import { ensureVaultFrontmatter } from './lib/vaultFrontmatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');

const DROP_DIR = process.env.SCREENSHOT_DROP_DIR 
  ? path.resolve(process.env.SCREENSHOT_DROP_DIR)
  : path.join(ROOT, 'data', 'intake-drop');
const PROCESSED_DIR = path.join(DROP_DIR, 'processed');
const REPORTS_DIR = path.join(ROOT, '.nfl', 'reports', 'visual-intel');
const ACTIVE_PROPOSALS_DIR = path.join(ROOT, 'data', 'official-picks', 'proposals', 'active');

const argv = process.argv.slice(2);
const WATCH_MODE = argv.includes('--watch');
const DRY_RUN = argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TO_EMAIL = process.env.TO_EMAIL || 'andrewlrose@hotmail.com';

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY && !DRY_RUN) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

export async function analyzeScreenshotWithAI(filePath) {
  const mimeType = getMimeType(filePath);
  const fileBuffer = await readFile(filePath);
  const base64Data = fileBuffer.toString('base64');
  const filename = path.basename(filePath);

  const prompt = `You are the Platinum Rose NFL Intelligence Vision AI. Analyze this screenshot/image dropped by the user (likely from Twitter / X, a sportsbook, or injury report):
Filename: ${filename}

Extract all text, tweet author, handle, affected teams, affected players, betting lines, and takeaways.
Output JSON format:
{
  "tweet_author": "@handle or Author Name if Twitter screenshot, else null",
  "category": "official_picks | injury_reports | line_moves | market_news",
  "urgency": "emergency | high | normal | low",
  "executive_summary": "1-3 bullet points summarizing core intel",
  "affected_teams": ["Team abbreviations e.g. KC, BAL, SF"],
  "affected_players": ["Player full names"],
  "key_takeaways": ["Takeaway 1", "Takeaway 2"],
  "official_pick_candidate": {
    "has_candidate": true/false,
    "pick_label": "e.g. KC Chiefs -3",
    "confidence": 75,
    "rationale": "Brief rationale"
  }
}`;

  if (!GEMINI_API_KEY) {
    return {
      tweet_author: 'Unknown',
      category: 'market_news',
      urgency: 'normal',
      executive_summary: `Screenshot dropped: ${filename}`,
      affected_teams: [],
      affected_players: [],
      key_takeaways: ['GEMINI_API_KEY not set for visual OCR.'],
      official_pick_candidate: null,
      ai_provider: 'fallback'
    };
  }

  try {
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
        const parsed = JSON.parse(rawText);
        return {
          tweet_author: parsed.tweet_author || 'Unknown',
          category: parsed.category || 'market_news',
          urgency: parsed.urgency || 'normal',
          summary: parsed.executive_summary || filename,
          teams: parsed.affected_teams || [],
          players: parsed.affected_players || [],
          takeaways: parsed.key_takeaways || [],
          pick_candidate: parsed.official_pick_candidate || null,
          ai_provider: 'gemini-2.0-flash-vision'
        };
      }
    }
  } catch (err) {
    console.warn(`  [warn] Gemini Vision OCR failed for ${filename}: ${err.message}`);
  }

  return {
    tweet_author: 'Unknown',
    category: 'market_news',
    urgency: 'normal',
    summary: `Visual Intel Screenshot: ${filename}`,
    teams: [],
    players: [],
    takeaways: ['Fallback visual ingestion completed.'],
    pick_candidate: null,
    ai_provider: 'fallback'
  };
}

export async function processScreenshotFile(filePath) {
  const filename = path.basename(filePath);
  console.log(`\n[screenshot] Processing visual drop: "${filename}"...`);

  const analysis = await analyzeScreenshotWithAI(filePath);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const slug = filename.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 45).toLowerCase();
  const reportFilename = `${dateStr}-ocr-${slug}.md`;
  const vaultPath = `NFL/VisualIntel/${reportFilename}`;

  const markdownBody = `# Visual Intel Screenshot: ${filename}

**Source File**: \`${filename}\`  
**Tweet Author**: ${analysis.tweet_author || 'N/A'}  
**Date Processed**: ${now.toISOString()}  
**Category**: \`${analysis.category}\` | **Urgency**: \`${analysis.urgency}\`  
**OCR Engine**: \`${analysis.ai_provider}\`

## Executive Summary
${Array.isArray(analysis.summary) ? analysis.summary.map(s => `- ${s}`).join('\n') : analysis.summary}

## Key Intelligence Takeaways
${(analysis.takeaways || []).map(t => `- ${t}`).join('\n') || '- No specific takeaways extracted.'}

## Affected Entities
- **Teams**: ${(analysis.teams || []).join(', ') || 'None specified'}
- **Players**: ${(analysis.players || []).join(', ') || 'None specified'}
`;

  const fullContent = ensureVaultFrontmatter(markdownBody, {
    title: `Visual Intel: ${filename}`,
    sourceSystem: 'local-screenshot-watcher',
    sourceType: 'visual_ocr',
    sensitivity: analysis.urgency === 'emergency' ? 'red' : 'green',
    tags: [
      'nfl/visual-intel',
      'source/twitter-screenshot',
      `category/${analysis.category}`,
      `urgency/${analysis.urgency}`,
      ...(analysis.teams || []).map(t => `team/${t}`)
    ]
  });

  // Save local report
  await mkdir(REPORTS_DIR, { recursive: true });
  const localReportPath = path.join(REPORTS_DIR, reportFilename);
  await writeFile(localReportPath, fullContent, 'utf8');
  console.log(`  [saved] Markdown report: ${localReportPath}`);

  // Upsert to Supabase vault_notes
  if (supabase && !DRY_RUN) {
    try {
      const { error } = await supabase
        .from('vault_notes')
        .upsert({
          path: vaultPath,
          content: fullContent,
          tags: ['nfl/visual-intel', `category/${analysis.category}`, `urgency/${analysis.urgency}`],
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

  // Stage candidate official pick proposal if detected
  if (analysis.pick_candidate && analysis.pick_candidate.has_candidate && !DRY_RUN) {
    await mkdir(ACTIVE_PROPOSALS_DIR, { recursive: true });
    const proposalFile = path.join(ACTIVE_PROPOSALS_DIR, `candidate-inbox-ocr-${slug}.json`);
    const proposalPayload = {
      id: `ocr-pick-${Date.now()}`,
      source: 'twitter_screenshot_ocr',
      subject: `OCR Pick: ${analysis.pick_candidate.pick_label}`,
      pick: analysis.pick_candidate.pick_label,
      confidence: analysis.pick_candidate.confidence || 75,
      rationale: analysis.pick_candidate.rationale || analysis.summary,
      status: 'pending_review',
      created_at: new Date().toISOString()
    };
    await writeFile(proposalFile, JSON.stringify(proposalPayload, null, 2), 'utf8');
    console.log(`  [official-picks] Staged pick candidate proposal from screenshot: ${proposalFile}`);
  }

  // Send high-urgency alert if emergency/high
  if ((analysis.urgency === 'emergency' || analysis.urgency === 'high') && !DRY_RUN) {
    const senderAddr = process.env.GMAIL_ADDRESS;
    const senderPass = process.env.GMAIL_APP_PASSWORD;
    if (senderAddr && senderPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: senderAddr, pass: senderPass },
        });
        await transporter.sendMail({
          from: `"Platinum Rose Vision Alert" <${senderAddr}>`,
          to: TO_EMAIL,
          subject: `🚨 [VISION ${analysis.urgency.toUpperCase()} ALERT] Screenshot Intel: ${filename}`,
          html: `<div style="font-family:sans-serif;padding:16px;border:2px solid #b42318;border-radius:8px;"><h3 style="color:#b42318;margin-top:0;">🚨 Visual Intel Screenshot Alert</h3><p><b>File:</b> ${filename}</p><p><b>Author:</b> ${analysis.tweet_author}</p><p><b>Summary:</b> ${Array.isArray(analysis.summary) ? analysis.summary.join(' ') : analysis.summary}</p></div>`
        });
        console.log(`  [alert-sent] Email alert sent to ${TO_EMAIL}`);
      } catch (err) {
        console.warn(`  [warn] Email alert error: ${err.message}`);
      }
    }
  }

  // Move processed image to processed/ archive folder
  await mkdir(PROCESSED_DIR, { recursive: true });
  const archivePath = path.join(PROCESSED_DIR, `${now.getTime()}-${filename}`);
  await rename(filePath, archivePath);
  console.log(`  [archived] Moved processed image to: ${archivePath}`);

  return { filename, vaultPath, category: analysis.category, urgency: analysis.urgency };
}

export async function scanDropDirectory() {
  await mkdir(DROP_DIR, { recursive: true });
  await mkdir(PROCESSED_DIR, { recursive: true });

  const entries = await readdir(DROP_DIR, { withFileTypes: true });
  const validExts = ['.png', '.jpg', '.jpeg', '.webp'];
  const imageFiles = entries.filter(e => e.isFile() && validExts.includes(path.extname(e.name).toLowerCase()));

  if (imageFiles.length === 0) {
    return [];
  }

  console.log(`[watcher] Found ${imageFiles.length} new screenshot(s) in drop folder: ${DROP_DIR}`);
  const results = [];
  for (const f of imageFiles) {
    const fullPath = path.join(DROP_DIR, f.name);
    try {
      const res = await processScreenshotFile(fullPath);
      results.push(res);
    } catch (err) {
      console.error(`  [error] Failed to process ${f.name}:`, err);
    }
  }
  return results;
}

export async function startWatcher() {
  console.log(`=======================================================`);
  console.log(`  NFL Dashboard — Screenshot & Vision OCR Watcher`);
  console.log(`  Drop Directory: ${DROP_DIR}`);
  console.log(`  Mode: ${WATCH_MODE ? 'CONTINUOUS WATCHER (polling every 3s)' : 'ONCE'}`);
  console.log(`=======================================================\n`);

  await scanDropDirectory();

  if (WATCH_MODE) {
    console.log(`\n[watcher] Monitoring ${DROP_DIR} for new screenshots... (Press Ctrl+C to stop)`);
    setInterval(async () => {
      try {
        await scanDropDirectory();
      } catch (err) {
        console.error(`[watcher-error]`, err);
      }
    }, 3000);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startWatcher().catch(err => {
    console.error(`Fatal error in screenshot-watcher:`, err);
    process.exit(1);
  });
}
