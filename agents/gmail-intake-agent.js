// agents/gmail-intake-agent.js
// ═══════════════════════════════════════════════════════════════════════════════
// NFL Dashboard — Gmail Auto-Summarization & Tracking Agent
// Exclusive account: platinumrose75@gmail.com
//
// Ingests emails from platinumrose75@gmail.com, classifies category and urgency,
// extracts key takeaways, affected teams/players, and pick proposals, and stores
// formatted markdown into Supabase vault_notes and local Obsidian/reports directories.
//
// Usage:
//   node agents/gmail-intake-agent.js                  # Ingest live emails
//   node agents/gmail-intake-agent.js --dry-run        # Process without writing to DB / labeling
//   node agents/gmail-intake-agent.js --sample         # Run with sample test fixtures
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { ensureVaultFrontmatter } from './lib/vaultFrontmatter.js';
import { isFootballOrCbbBettingIntel } from './lib/sportsRelevanceFilter.js';

const execFileAsync = promisify(execFile);



const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, '.nfl', 'reports', 'newsletters');
const ACTIVE_PROPOSALS_DIR = path.join(ROOT, 'data', 'official-picks', 'proposals', 'active');
const GMAIL_SUMMARY_DIR = path.join(ROOT, '.nfl', 'gmail-summaries');

// Config & Flags
const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const SAMPLE_MODE = argv.includes('--sample');

const GMAIL_ADDR = process.env.PLATINUM_ROSE_GMAIL_ADDRESS || 'platinumrose75@gmail.com';
const GMAIL_PASS = process.env.PLATINUM_ROSE_GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY && !DRY_RUN) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ── Sample Test Fixtures ──────────────────────────────────────────────────────

const SAMPLE_EMAILS = [
  {
    id: 'msg-sample-001',
    from: 'Establish The Run <intel@establishtherun.com>',
    subject: 'Week 1 Sharp Props & Line Steam: KC Mahomes Over & BAL Jackson Rushing',
    date: new Date().toISOString(),
    body: `
      Welcome to the ETR Week 1 Market Intel update.
      
      Key Sharp Moves:
      - Kansas City Chiefs (KC) vs Baltimore Ravens (BAL): Sharp money pushed KC spread from -2.5 to -3.0.
      - Patrick Mahomes over 268.5 passing yards is seeing heavy volume.
      - Lamar Jackson rushing total opened at 48.5 and is climbing to 52.5.
      
      Injury Notes:
      - Isiah Pacheco (KC) practiced fully Thursday, clear of injury report.
      - Mark Andrews (BAL) back in full contact drills.
      
      Recommended Play:
      Pick: KC Chiefs -3 (-110) vs Baltimore Ravens. Risk: 1.1u to win 1.0u.
    `
  },
  {
    id: 'msg-sample-002',
    from: 'Action Network Alert <steam@actionnetwork.com>',
    subject: 'EMERGENCY LINE ALERT: Christian McCaffrey ruled OUT for Week 1',
    date: new Date().toISOString(),
    body: `
      BREAKING: SF RB Christian McCaffrey (calf/Achilles) has officially been ruled OUT for Monday Night Football against NYJ.
      Jordan Mason will start.
      San Francisco line moved from -4.5 down to -3.5 across all books.
      Under 43.5 total points is getting hit hard by sharps.
    `
  }
];

// ── Fallback / Rule-based Classifier & AI Summarizer ────────────────────────

export function classifyEmailRuleBased({ subject = '', body = '' }) {
  const content = `${subject}\n${body}`.toLowerCase();

  let category = 'market_news';
  let urgency = 'normal';

  if (content.includes('emergency') || content.includes('ruled out') || content.includes('steam alert')) {
    urgency = 'emergency';
  } else if (content.includes('sharp') || content.includes('pick') || content.includes('recommended play')) {
    urgency = 'high';
  }

  if (content.includes('pick') || content.includes('recommended play') || content.includes('lock')) {
    category = 'official_picks';
  } else if (content.includes('injury') || content.includes('ruled out') || content.includes('dnp') || content.includes('limited')) {
    category = 'injury_reports';
  } else if (content.includes('line move') || content.includes('steam') || content.includes('spread moved')) {
    category = 'line_moves';
  } else if (content.includes('podcast') || content.includes('episode') || content.includes('youtube')) {
    category = 'podcast_digests';
  } else if (content.includes('unsubscribe') || content.includes('promo') || content.includes('bonus')) {
    category = 'spam_promo';
    urgency = 'low';
  }

  // Extract team abbreviations
  const knownTeams = ['KC', 'BAL', 'SF', 'NYJ', 'PHI', 'DAL', 'BUF', 'MIA', 'DET', 'GB', 'CIN', 'CLE'];
  const extractedTeams = knownTeams.filter(team => new RegExp(`\\b${team}\\b`, 'i').test(content));

  // Extract key summary lines
  const lines = body.split('\n').map(l => l.trim()).filter(l => l.length > 10 && !l.startsWith('>'));
  const summarySnippet = lines.slice(0, 3).join(' ') || subject;

  return {
    category,
    urgency,
    teams: extractedTeams,
    summary: summarySnippet,
    raw_response: 'Rule-based fallback classifier executed successfully.'
  };
}

export async function summarizeWithAI({ subject, body, from, date }) {
  const prompt = `You are the Platinum Rose NFL Intelligence AI. Analyze this email received from ${from}:
Subject: ${subject}
Date: ${date}

Email Body:
${body}

Extract and format in JSON:
{
  "category": "official_picks | injury_reports | line_moves | podcast_digests | market_news | spam_promo",
  "urgency": "emergency | high | normal | low",
  "executive_summary": "1-3 bullet points summarizing core intel",
  "affected_teams": ["Team abbreviations e.g. KC, BAL"],
  "affected_players": ["Player full names"],
  "key_takeaways": ["Takeaway 1", "Takeaway 2"],
  "official_pick_candidate": {
    "has_candidate": true/false,
    "pick_label": "e.g. KC Chiefs -3",
    "odds": "-110",
    "unit_size": 1.0,
    "confidence": 75,
    "rationale": "Brief rationale"
  }
}`;

  // Try Gemini 2.0 Flash REST API if key exists
  if (GEMINI_API_KEY) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          return {
            category: parsed.category || 'market_news',
            urgency: parsed.urgency || 'normal',
            summary: parsed.executive_summary || subject,
            teams: parsed.affected_teams || [],
            players: parsed.affected_players || [],
            takeaways: parsed.key_takeaways || [],
            pick_candidate: parsed.official_pick_candidate || null,
            ai_provider: 'gemini-2.0-flash'
          };
        }
      }
    } catch (err) {
      console.warn(`[warn] Gemini AI summarization failed: ${err.message}. Using rule-based fallback.`);
    }
  }

  // Fallback to rule-based classification
  const fallback = classifyEmailRuleBased({ subject, body });
  return {
    category: fallback.category,
    urgency: fallback.urgency,
    summary: fallback.summary,
    teams: fallback.teams,
    players: [],
    takeaways: [fallback.summary],
    pick_candidate: fallback.category === 'official_picks' ? {
      has_candidate: true,
      pick_label: subject,
      confidence: 60,
      rationale: fallback.summary
    } : null,
    ai_provider: 'rule-based-fallback'
  };
}

// ── Note Generation & Vault Sync ─────────────────────────────────────────────

export async function processEmailItem(msg) {
  // 1. Recency Gate (max 30 days)
  const emailDate = new Date(msg.date || Date.now());
  const ageDays = (Date.now() - emailDate.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > 30) {
    console.log(`  [skipped-stale] Email "${msg.subject}": Dated ${emailDate.toISOString().split('T')[0]} exceeds 30-day limit.`);
    return { skipped: true, reason: 'Exceeds 30-day recency limit' };
  }

  // 2. NFL Relevance Gate
  const fullText = `${msg.subject}\n${msg.body}`;
  const gate = isFootballOrCbbBettingIntel(fullText);
  if (!gate.isRelevant) {
    console.log(`  [skipped-non-nfl] Email "${msg.subject}": ${gate.reason}`);
    return { skipped: true, reason: gate.reason };
  }

  console.log(`\n[ingest] Processing: "${msg.subject}" from ${msg.from}...`);

  const analysis = await summarizeWithAI(msg);
  const dateStr = new Date(msg.date).toISOString().split('T')[0];
  const slug = msg.subject.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 45).toLowerCase();
  const filename = `${dateStr}-${slug}.md`;
  const vaultPath = `NFL/Newsletters/${filename}`;

  const markdownBody = `# ${msg.subject}

**From**: ${msg.from}  
**Date**: ${msg.date}  
**Category**: \`${analysis.category}\` | **Urgency**: \`${analysis.urgency}\`  
**AI Provider**: \`${analysis.ai_provider}\`

## Executive Summary
${Array.isArray(analysis.summary) ? analysis.summary.map(s => `- ${s}`).join('\n') : analysis.summary}

## Key Intelligence & Takeaways
${(analysis.takeaways || []).map(t => `- ${t}`).join('\n') || '- No specific takeaways extracted.'}

## Affected Entities
- **Teams**: ${(analysis.teams || []).join(', ') || 'None specified'}
- **Players**: ${(analysis.players || []).join(', ') || 'None specified'}

---
### Original Email Body
\`\`\`text
${msg.body.trim()}
\`\`\`
`;

  const fullNoteContent = ensureVaultFrontmatter(markdownBody, {
    title: msg.subject,
    sourceSystem: 'platinumrose75-gmail-agent',
    sourceType: 'email_newsletter',
    sensitivity: analysis.urgency === 'emergency' ? 'red' : 'green',
    tags: [
      'nfl/newsletter',
      `category/${analysis.category}`,
      `urgency/${analysis.urgency}`,
      ...(analysis.teams || []).map(t => `team/${t}`)
    ]
  });

  // Write local report artifact
  await mkdir(REPORTS_DIR, { recursive: true });
  await mkdir(GMAIL_SUMMARY_DIR, { recursive: true });
  const localReportPath = path.join(REPORTS_DIR, filename);
  await writeFile(localReportPath, fullNoteContent, 'utf8');
  console.log(`  [saved] Local report: ${localReportPath}`);

  // Write JSON metadata summary for Inbox Server API
  const jsonSummaryPath = path.join(GMAIL_SUMMARY_DIR, `${dateStr}-${slug}.json`);
  const jsonSummaryData = {
    id: msg.id,
    subject: msg.subject,
    from: msg.from,
    date: msg.date,
    category: analysis.category,
    urgency: analysis.urgency,
    summary: analysis.summary,
    teams: analysis.teams,
    players: analysis.players,
    local_path: localReportPath,
    vault_path: vaultPath,
    pick_candidate: analysis.pick_candidate
  };
  await writeFile(jsonSummaryPath, JSON.stringify(jsonSummaryData, null, 2), 'utf8');

  // If Supabase is connected and not dry run, upsert into vault_notes
  if (supabase && !DRY_RUN) {
    try {
      const { error } = await supabase
        .from('vault_notes')
        .upsert({
          path: vaultPath,
          content: fullNoteContent,
          tags: ['newsletter', `category/${analysis.category}`, `urgency/${analysis.urgency}`],
          source: 'agent',
          updated_at: new Date().toISOString()
        }, { onConflict: 'path' });

      if (error) {
        console.warn(`  [warn] Supabase vault_notes upsert error: ${error.message}`);
      } else {
        console.log(`  [supabase] Upserted note to vault_notes path: ${vaultPath}`);
      }
    } catch (e) {
      console.warn(`  [warn] Supabase error: ${e.message}`);
    }
  }


  // If official pick candidate detected, stage into active proposals directory
  if (analysis.pick_candidate && analysis.pick_candidate.has_candidate && !DRY_RUN) {
    await mkdir(ACTIVE_PROPOSALS_DIR, { recursive: true });
    const proposalFile = path.join(ACTIVE_PROPOSALS_DIR, `candidate-inbox-gmail-${slug}.json`);
    const proposalPayload = {
      id: `gmail-pick-${Date.now()}`,
      source: 'gmail_platinumrose75',
      subject: msg.subject,
      pick: analysis.pick_candidate.pick_label,
      confidence: analysis.pick_candidate.confidence || 70,
      rationale: analysis.pick_candidate.rationale || analysis.summary,
      status: 'pending_review',
      created_at: new Date().toISOString()
    };
    await writeFile(proposalFile, JSON.stringify(proposalPayload, null, 2), 'utf8');
    console.log(`  [official-picks] Staged pick candidate proposal: ${proposalFile}`);
  }

  // Trigger high-urgency email/SMS alert if urgency is emergency or high
  if (analysis.urgency === 'emergency' || analysis.urgency === 'high') {
    await sendUrgentIntelAlert(msg, analysis);
  }

  return jsonSummaryData;
}

// ── High Urgency Alert Dispatcher ──────────────────────────────────────────────

export async function sendUrgentIntelAlert(msg, analysis) {
  const recipient = process.env.TO_EMAIL || 'andrewlrose@hotmail.com';
  if (DRY_RUN || SAMPLE_MODE) {
    console.log(`  [alert-simulated] High-urgency alert for "${msg.subject}" (Urgency: ${analysis.urgency}) targeted to ${recipient}`);
    return;
  }

  const senderAddr = process.env.GMAIL_ADDRESS || GMAIL_ADDR;
  const senderPass = process.env.GMAIL_APP_PASSWORD || GMAIL_PASS;

  if (!senderAddr || !senderPass) {
    console.warn(`  [warn] Cannot send email/SMS alert: GMAIL_ADDRESS or GMAIL_APP_PASSWORD not configured.`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: senderAddr, pass: senderPass },
    });

    const subjectLine = `🚨 [${analysis.urgency.toUpperCase()} INTEL ALERT] ${msg.subject}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #b42318; border-radius: 8px; max-width: 600px;">
        <h2 style="color: #b42318; margin-top: 0;">🚨 High Urgency NFL Intelligence Alert</h2>
        <p><strong>From:</strong> ${msg.from}</p>
        <p><strong>Subject:</strong> ${msg.subject}</p>
        <p><strong>Category:</strong> ${analysis.category} | <strong>Urgency:</strong> ${analysis.urgency}</p>
        <hr style="border: 0; border-top: 1px solid #ddd;" />
        <h3>Executive Summary</h3>
        <p style="font-size: 15px; background: #fff5f5; padding: 12px; border-left: 4px solid #b42318;">
          ${Array.isArray(analysis.summary) ? analysis.summary.join('<br/>') : analysis.summary}
        </p>
        <h3>Affected Entities</h3>
        <p><strong>Teams:</strong> ${(analysis.teams || []).join(', ') || 'N/A'}<br/>
        <strong>Players:</strong> ${(analysis.players || []).join(', ') || 'N/A'}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Platinum Rose AI Alerts" <${senderAddr}>`,
      to: recipient,
      subject: subjectLine,
      html: htmlBody,
    });
    console.log(`  [alert-sent] Instant email/SMS alert sent to ${recipient} for "${msg.subject}"`);
  } catch (err) {
    console.warn(`  [warn] Failed to send email alert: ${err.message}`);
  }
}


const FETCHER_SCRIPT = path.join(ROOT, 'agents', 'lib', 'gmail_fetcher.py');

async function fetchLiveEmails() {
  try {
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const { stdout } = await execFileAsync(pythonExe, [FETCHER_SCRIPT, GMAIL_ADDR, GMAIL_PASS]);
    const parsed = JSON.parse(stdout.trim() || '[]');
    if (parsed && parsed.error) {
      console.warn(`  [warn] Live IMAP fetch error for ${GMAIL_ADDR}: ${parsed.error}`);
      return null;
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`  [warn] Failed to execute gmail_fetcher.py: ${err.message}`);
    return null;
  }
}

// ── Main Execution ────────────────────────────────────────────────────────────

export async function runIngestion() {
  console.log(`=======================================================`);
  console.log(`  NFL Dashboard — Gmail Intake Agent`);
  console.log(`  Target Inbox: ${GMAIL_ADDR}`);
  console.log(`  Mode: ${SAMPLE_MODE ? 'SAMPLE FIXTURES' : DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`=======================================================\n`);

  let messages = [];

  if (SAMPLE_MODE) {
    console.log(`[sample] Ingesting ${SAMPLE_EMAILS.length} sample emails...`);
    messages = SAMPLE_EMAILS;
  } else {
    console.log(`[live] Fetching unread emails for ${GMAIL_ADDR}...`);
    const liveItems = await fetchLiveEmails();
    if (liveItems !== null) {
      messages = liveItems;
      console.log(`[live] Retrived ${messages.length} unread email(s) from IMAP.`);
    } else {
      console.log(`[info] Live IMAP connection not available or credentials invalid. Running test ingestion on sample fixtures...`);
      messages = SAMPLE_EMAILS;
    }
  }

  const results = [];
  for (const msg of messages) {
    const res = await processEmailItem(msg);
    results.push(res);
  }

  console.log(`\n=======================================================`);
  console.log(`  Ingestion Complete! Processed ${results.length} email(s).`);
  console.log(`=======================================================`);
  return results;
}


if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runIngestion().catch(err => {
    console.error(`Fatal error in gmail-intake-agent:`, err);
    process.exit(1);
  });
}
