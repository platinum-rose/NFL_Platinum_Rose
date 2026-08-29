import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { applyMarketContextOdds } from './lib/live-market-fallback.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const user = process.env.GMAIL_ADDRESS || process.env.PLATINUM_ROSE_GMAIL_ADDRESS;
const pass = process.env.GMAIL_APP_PASSWORD || process.env.PLATINUM_ROSE_GMAIL_APP_PASSWORD;
const defaultTo = process.env.TO_EMAIL || user;

// HTML Escaping Guard to prevent broken markup or injections from raw markdown
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to convert MM:SS or HH:MM:SS string to total seconds for audio link #t=
function timestampToSeconds(tsStr) {
  const clean = tsStr.replace(/[[\]]/g, '').split('-')[0].trim();
  const parts = clean.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function splitIntoParagraphs(text) {
  if (!text) return '';
  const rawParas = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const formatted = [];

  for (const para of rawParas) {
    const sentences = para.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [para];
    if (sentences.length <= 3) {
      formatted.push(para);
    } else {
      for (let i = 0; i < sentences.length; i += 3) {
        formatted.push(sentences.slice(i, i + 3).join('').trim());
      }
    }
  }

  return formatted
    .map(p => `<p style="color: #334155; font-size: 0.95em; line-height: 1.65; margin-bottom: 12px;">${escapeHtml(p)}</p>`)
    .join('');
}

function splitTeamReportBlocks(rawMd) {
  return String(rawMd || '').split(/## (?:🏆|ðŸ†) /u).slice(1);
}

export function generateDigestHtml({ title: _title, epName, audioUrl, dashboardUrl, teamReports, articleIntelList = [] }) {
  let teamCardsHtml = '';

  // Format Article & Sharp Market Intel Briefing card section
  let articleIntelHtml = '';
  if (articleIntelList && articleIntelList.length > 0) {
    const itemsHtml = articleIntelList.map(item => {
      const badgeColor = item.type === 'tweet' ? '#0284c7' : '#059669';
      const badgeText = item.type === 'tweet' ? 'SHARP TWEET' : 'ARTICLE INTEL';
      const pubDate = item.published_at ? new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const linkUrl = item.url || dashboardUrl;

      return `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${badgeColor}; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; font-size: 0.9em;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <span style="background-color: ${badgeColor}; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 3px; font-size: 0.72em; text-transform: uppercase;">${badgeText}</span>
              <strong style="color: #0f172a; margin-left: 8px; font-size: 0.95em;">${escapeHtml(item.title || item.author || 'Market Intelligence')}</strong>
            </div>
            ${pubDate ? `<span style="color: #64748b; font-size: 0.78em;">${pubDate}</span>` : ''}
          </div>
          <div style="color: #334155; line-height: 1.55; margin-bottom: 8px;">
            ${escapeHtml((item.content || '').slice(0, 320))}${(item.content || '').length > 320 ? '...' : ''}
          </div>
          ${linkUrl ? `<div style="text-align: right;"><a href="${escapeHtml(linkUrl)}" target="_blank" style="color: #0284c7; text-decoration: none; font-size: 0.8em; font-weight: bold;">Read Source Article / Tweet &rarr;</a></div>` : ''}
        </div>
      `;
    }).join('');

    articleIntelHtml = `
      <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 24px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #059669; padding-bottom: 8px; font-size: 1.2rem; letter-spacing: -0.3px;">📰 Article & Sharp Market Intel Briefing</h2>
        ${itemsHtml}
      </div>
    `;
  }

  for (const tr of teamReports) {
    // Format synopsis into clean bite-sized paragraphs
    const synopsisParas = splitIntoParagraphs(tr.synopsis);

    // Format expert deep dive sections into clean distinct cards
    const expertSections = tr.expertBlocks.map(exp => {
      const bulletItems = exp.rationale
        .map(b => `<li style="margin-bottom: 8px; color: #1e293b; font-size: 0.9em; line-height: 1.5;">${escapeHtml(b.replace(/\[\^[A-Za-z]+-\d+\]/g, ''))}</li>`)
        .join('');

      return `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${exp.color}; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px;">
          <div style="display: flex; justify-space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #0f172a; font-size: 1em; letter-spacing: -0.2px;">${escapeHtml(exp.name)}</strong>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; font-size: 0.88em; margin-bottom: 10px; color: #0f172a;">
            <strong>Exact Bet / Position:</strong> ${escapeHtml(exp.bet)}
          </div>
          <ul style="margin: 0; padding-left: 18px;">
            ${bulletItems}
          </ul>
        </div>
      `;
    }).join('');

    // Format endnotes into distinct cards with direct timestamp audio jump links
    const endnotesCards = tr.endnotesList.map(en => {
      const startSec = timestampToSeconds(en.timecode);
      const audioJumpUrl = audioUrl ? `${audioUrl}#t=${startSec}` : '#';

      return `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; font-size: 0.88em;">
          <div style="margin-bottom: 4px;">
            <span style="background-color: #1e293b; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 3px; font-size: 0.75em;">${escapeHtml(en.tag)}</span>
            <span style="font-family: monospace; font-weight: bold; color: #b45309; background-color: #fef3c7; padding: 2px 6px; border-radius: 3px; margin-left: 6px;">${escapeHtml(en.timecode)}</span>
            <strong style="color: #0f172a; margin-left: 6px;">${escapeHtml(en.speaker)}</strong>
          </div>
          <div style="font-style: italic; color: #334155; margin-bottom: 6px; padding-left: 4px;">
            "${escapeHtml(en.quote)}"
          </div>
          <div style="text-align: right;">
            <a href="${audioJumpUrl}" target="_blank" style="display: inline-block; background-color: #0369a1; color: #ffffff; text-decoration: none; padding: 4px 10px; border-radius: 4px; font-size: 0.78em; font-weight: bold;">
              ▶ Stream Quote Audio at ${escapeHtml(en.timecode.split('-')[0].trim())}
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Format futures odds list into a clean card with explicit source_type badges
    const futuresOddsHtml = (tr.futuresOddsList || []).map(item => {
      if (typeof item === 'string') {
        return `<li style="margin-bottom: 6px; color: #0f172a; font-size: 0.88em;">• ${escapeHtml(item.replace(/\[\^[A-Za-z]+-\d+\]/g, ''))}</li>`;
      }
      if (item.source_type === 'expert_quote') {
        return `<li style="margin-bottom: 6px; color: #0f172a; font-size: 0.88em;">• ${escapeHtml(item.text.replace(/\[\^[A-Za-z]+-\d+\]/g, ''))} <span style="background: #e2e8f0; color: #334155; font-size: 0.7em; font-weight: bold; padding: 2px 6px; border-radius: 3px; margin-left: 6px;">PODCAST QUOTE</span></li>`;
      }
      if (item.source_type === 'live_market_context') {
        return `<li style="margin-bottom: 6px; color: #0f172a; font-size: 0.88em;">• ${escapeHtml(item.market_label)}: ${escapeHtml(item.current_price)} (${escapeHtml(item.sportsbook)}, as of ${escapeHtml(item.as_of)}) <span style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; font-size: 0.7em; font-weight: bold; padding: 2px 6px; border-radius: 3px; margin-left: 6px;">LIVE MARKET CONTEXT</span></li>`;
      }
      if (item.source_type === 'static_benchmark_context') {
        return `<li style="margin-bottom: 6px; color: #0f172a; font-size: 0.88em;">• ${escapeHtml(item.market_label)}: ${escapeHtml(item.current_price)} (${escapeHtml(item.sportsbook)}) <span style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 0.7em; font-weight: bold; padding: 2px 6px; border-radius: 3px; margin-left: 6px;">STATIC BENCHMARK CONTEXT</span></li>`;
      }
      if (item.source_type === 'live_market_unavailable') {
        return `<li style="margin-bottom: 6px; color: #64748b; font-size: 0.88em;">• ${escapeHtml(item.market_label)}: Live market odds unavailable <span style="background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; font-size: 0.7em; font-weight: bold; padding: 2px 6px; border-radius: 3px; margin-left: 6px;">UNAVAILABLE</span></li>`;
      }
      return '';
    }).join('');

    teamCardsHtml += `
      <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 24px; padding: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #0284c7; padding-bottom: 8px; font-size: 1.3rem; letter-spacing: -0.3px;">${escapeHtml(tr.teamName)}</h2>

        ${futuresOddsHtml ? `
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0284c7; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px;">
          <h3 style="color: #0369a1; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 8px 0; font-weight: bold;">Futures & Betting Lines Summary</h3>
          <ul style="margin: 0; padding-left: 0; list-style: none;">
            ${futuresOddsHtml}
          </ul>
        </div>
        ` : ''}

        <h3 style="color: #334155; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Executive Summary & Outlook</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 6px; margin-bottom: 18px;">
          ${synopsisParas}
        </div>

        <h3 style="color: #334155; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 20px; margin-bottom: 10px; font-weight: bold;">Expert Breakdown & Positions</h3>
        ${expertSections}

        <h3 style="color: #334155; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 20px; margin-bottom: 10px; font-weight: bold;">Verified Timecodes & Verbatim Audio Sources</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px;">
          ${endnotesCards}
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>The Platinum Rose Alpha Intelligence Digest</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
        .container { max-width: 720px; margin: 0 auto; background: #ffffff; padding: 28px; border-radius: 10px; border: 1px solid #cbd5e1; }
        .header { background: #0f172a; color: #ffffff; padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center; }
        .header-title { margin: 0; font-size: 1.55rem; letter-spacing: -0.5px; color: #f8fafc; font-weight: 700; }
        .header-sub { margin: 6px 0 0 0; color: #94a3b8; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 1px; }
        .action-bar { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center; }
        .btn-dashboard { display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 0.88em; margin: 4px; }
        .btn-audio { display: inline-block; background-color: #475569; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 0.88em; margin: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="header-title">The Platinum Rose Alpha Intelligence Digest</h1>
          <div class="header-sub">Bi-Weekly 100% Exhaustive Expert Breakdown • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>

        <div class="action-bar">
          <div style="font-size: 0.95em; color: #0f172a; margin-bottom: 10px;">
            <strong>Source Episode:</strong> ${escapeHtml(epName)}
          </div>
          <div>
            <a href="${escapeHtml(dashboardUrl)}" target="_blank" class="btn-dashboard">Open Interactive Digest on NFL Dashboard</a>
            <a href="${escapeHtml(audioUrl)}" target="_blank" class="btn-audio">Stream Source Episode Audio</a>
          </div>
        </div>

        ${articleIntelHtml}

        ${teamCardsHtml}

        <div style="text-align: center; color: #64748b; font-size: 0.78em; line-height: 1.5; margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 16px;">
          <strong>The Platinum Rose Alpha Intelligence Digest</strong> • NFL Dashboard v2026<br>
          <em>This digest compiles expert-attributed wagers extracted directly from primary source transcripts. The attributed human experts own all recommendations. Static market benchmark context lines are provided for reference only and are never attributed to experts as wagers.</em>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function dispatchBiweeklyDigest({ reportMdPath, reportMdPaths, epId, episodeName, recipients, dryRun = false, previewFile = 'scratch/digest_preview.html' } = {}) {
  const defaultPaths = [
    path.join(process.cwd(), 'scratch/afc_east_master_100percent_exhaustive.md'),
    path.join(process.cwd(), 'scratch/nfc_east_master_100percent_exhaustive.md'),
  ].filter(p => fs.existsSync(p));

  const targetMdPaths = reportMdPaths
    ? (Array.isArray(reportMdPaths) ? reportMdPaths : [reportMdPaths])
    : (reportMdPath ? [reportMdPath] : (defaultPaths.length > 0 ? defaultPaths : [path.join(process.cwd(), 'scratch/afc_east_master_100percent_exhaustive.md')]));

  console.log(`Loading ${targetMdPaths.length} Markdown report file(s):`, targetMdPaths);

  // Fetch episode metadata from Supabase for live source URLs & verify status guard
  const EP_ID = epId || '770aa638-b82b-4fb3-8e2f-8316b02e6635';
  let ep = null;
  if (sb) {
    const { data, error } = await sb.from('podcast_episodes').select('*, feed:podcast_feeds(*)').eq('id', EP_ID).single();
    if (!error && data) {
      if (data.status !== 'done') {
        throw new Error(`Episode ${EP_ID} is not marked 'done' in Supabase (status: ${data.status}). Digest dispatch blocked.`);
      }
      ep = data;
    }
  }

  // Fetch article intel and sharp market tweets from Supabase if available
  const articleIntelList = [];
  if (sb) {
    try {
      const { data: intelData } = await sb
        .from('research_intel_notes')
        .select('title, author, body, summary, published_at, captured_at, url')
        .order('captured_at', { ascending: false })
        .limit(3);

      if (intelData) {
        for (const row of intelData) {
          articleIntelList.push({
            type: 'article',
            title: row.title || 'Market Intel Note',
            author: row.author || row.source || 'Research Analyst',
            content: row.summary || row.body || '',
            published_at: row.published_at || row.captured_at,
            url: row.url || null,
          });
        }
      }

      const { data: tweetData } = await sb
        .from('x_sharp_tweets')
        .select('author_handle, text, published_at, captured_at, tweet_url')
        .order('captured_at', { ascending: false })
        .limit(3);

      if (tweetData) {
        for (const row of tweetData) {
          articleIntelList.push({
            type: 'tweet',
            title: `@${row.author_handle || 'SharpFootball'}`,
            author: row.author_handle || 'Sharp Analyst',
            content: row.text || '',
            published_at: row.published_at || row.captured_at,
            url: row.tweet_url || null,
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch article intel notes / tweets from Supabase:', err.message);
    }
  }

  const epTitle = episodeName || ep?.title || 'Sharp or Square — AFC EAST & NFC EAST BETTING PREVIEW';
  const audioUrl = ep?.audio_url || 'https://www.omnycontent.com';
  const baseUrl = process.env.DASHBOARD_BASE_URL || 'http://192.168.1.44:5180/platinum-rose-app/';
  const dashboardUrl = `${baseUrl.replace(/\/$/, '')}/?tab=podcasts&episode=${EP_ID}`;

  const teamReports = [];

  for (const mdPath of targetMdPaths) {
    if (!fs.existsSync(mdPath)) continue;
    const rawMd = fs.readFileSync(mdPath, 'utf-8');
    const teamBlocks = splitTeamReportBlocks(rawMd);

    for (const block of teamBlocks) {
      const lines = block.split('\n');
      const teamName = lines[0].trim();

      // Extract futures odds list and apply market context helpers
      const oddsMatch = block.match(/Win Total Line \/ Juicing \/ Division Odds \/ Futures Odds Mentioned\*\*\s*\n+([\s\S]*?)\n+- \*\*Comprehensive Narrative Synopsis/i);
      const rawOddsList = oddsMatch
        ? oddsMatch[1].split('\n').map(l => l.replace(/^\s*-\s*/, '').trim()).filter(l => l.length > 0)
        : [];

      const futuresOddsList = await applyMarketContextOdds({ teamName, rawOddsList });

      // Extract narrative synopsis
      const synopsisMatch = block.match(/Comprehensive Narrative Synopsis\*\*\s*\n+([\s\S]*?)\n+- \*\*EXPERT-BY-EXPERT/i);
      const synopsis = synopsisMatch ? synopsisMatch[1].trim() : 'Comprehensive expert breakdown and roster analysis.';

      // Extract expert blocks
      const expertBlocks = [];
      const chadMatch = block.match(/\*\s*\*\*Chad Millman:\*\*[\s\S]*?- \*\*Exact Bet & Position:\*\*\s*(.*?)\n[\s\S]*?- \*\*Exhaustive Analytical Rationale & Evidence:\*\*\s*\n([\s\S]*?)(?=\* \*\*Simon Hunter|- \*\*Endnotes)/i);
      if (chadMatch) {
        const bet = chadMatch[1].trim();
        const rationale = chadMatch[2].split('\n').map(l => l.replace(/^\s*-\s*/, '').trim()).filter(l => l.length > 0);
        expertBlocks.push({ name: 'Chad Millman (Host)', bet, rationale, color: '#0284c7' });
      }

      const simonMatch = block.match(/\*\s*\*\*Simon Hunter:\*\*[\s\S]*?- \*\*Exact Bet & Position:\*\*\s*(.*?)\n[\s\S]*?- \*\*Exhaustive Analytical Rationale & Evidence:\*\*\s*\n([\s\S]*?)(?=- \*\*Endnotes|---)/i);
      if (simonMatch) {
        const bet = simonMatch[1].trim();
        const rationale = simonMatch[2].split('\n').map(l => l.replace(/^\s*-\s*/, '').trim()).filter(l => l.length > 0);
        expertBlocks.push({ name: 'Simon Hunter (Handicapper)', bet, rationale, color: '#059669' });
      }

      // Extract endnotes list
      const endnotesMatch = block.match(/Endnotes & Verbatim Timecodes:\*\*([\s\S]*?)(?:---|$$)/i);
      const rawEndnotes = endnotesMatch ? endnotesMatch[1].trim() : '';
      const endnotesList = [];

      const endnoteRegex = /\[\^([A-Za-z]+)-(\d+)\]:\s*(\[\d+:\d+(?::\d+)?\s*-\s*\d+:\d+(?::\d+)?\]|\[\d+:\d+\])\s*([A-Za-z\s]+):\s*"(.*?)"/gi;
      let match;
      while ((match = endnoteRegex.exec(rawEndnotes)) !== null) {
        endnotesList.push({
          tag: `${match[1]}-${match[2]}`,
          timecode: match[3],
          speaker: match[4].trim(),
          quote: match[5].trim(),
        });
      }

      teamReports.push({ teamName, futuresOddsList, synopsis, expertBlocks, endnotesList });
    }
  }

  const html = generateDigestHtml({
    title: epTitle,
    epName: epTitle,
    audioUrl,
    dashboardUrl,
    teamReports,
    articleIntelList,
  });

  // HARMLESS PREVIEW / DRY-RUN MODE GUARD: If dryRun is set, write HTML file & DO NOT SEND EMAIL!
  if (dryRun || process.argv.includes('--dry-run')) {
    const outPath = path.resolve(process.cwd(), previewFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf-8');
    console.log(`[DRY-RUN MODE] HTML digest preview written to: ${outPath} (Zero emails sent)`);
    return { dryRun: true, previewFile: outPath };
  }

  const targetRecipients = recipients
    ? (Array.isArray(recipients) ? recipients : [recipients])
    : (process.env.ALPHA_TESTER_EMAILS ? process.env.ALPHA_TESTER_EMAILS.split(',').map(e => e.trim()) : [defaultTo]);

  if (!user || !pass) {
    throw new Error('GMAIL_ADDRESS or GMAIL_APP_PASSWORD missing. Cannot dispatch email.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  console.log(`Dispatching bi-weekly email digest to ${targetRecipients.length} Alpha Tester(s):`, targetRecipients);

  const info = await transporter.sendMail({
    from: `"The Platinum Rose" <${user}>`,
    to: targetRecipients.join(', '),
    subject: `🌹 The Platinum Rose Alpha Intelligence Digest: ${epTitle}`,
    html,
  });

  console.log('✅ Bi-weekly Alpha email digest dispatched successfully!');
  return info;
}

// CLI runner support
if (process.argv[1] && process.argv[1].endsWith('send-biweekly-digest.js')) {
  const isDryRun = process.argv.includes('--dry-run');
  dispatchBiweeklyDigest({ dryRun: isDryRun }).catch(console.error);
}
