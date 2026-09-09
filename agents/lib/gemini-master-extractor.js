// agents/lib/gemini-master-extractor.js
// ═══════════════════════════════════════════════════════════════════════════════
// Unified 100% Exhaustive Master Intelligence Extractor (Gemini 3.8 Flash)
//
// Extracts podcast transcripts and research articles into structured 100%
// exhaustive master intelligence reports in scratch/, validated against
// agents/lib/masterReportGuard.js.
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import fs from 'fs';
import { validateMasterReport } from './masterReportGuard.js';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Format timestamp in seconds to [MM:SS] or [HH:MM:SS]
 */
export function fmtTimestamp(sec) {
  const totalSec = Math.floor(sec);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Known podcast sign-off patterns to identify the editorial close of shows
 * and strip trailing commercials, post-roll ads, and network promos.
 */
export const SHOW_SIGNOFF_RULES = [
  {
    name: 'Even Money',
    matchFeed: /(?:even\s*money|ross\s*tucker)/i,
    // Ross Tucker's canonical sign-off: "Good luck everybody. Hope you guys win some money."
    // Also handles slight variations like "Good luck everybody. Hope you guys win some money this weekend." or "Thanks for tuning in to Even Money"
    signoffRegex: /(?:good luck,?\s*everybody[.!?,]?\s*(?:hope you (?:guys )?win some money|enjoy|i think we(?:'re| are) done here)[.!?,]?|thanks for tuning in to (?:the )?even money[.!?,]?)/i,
  }
];

/**
 * Trims speaker segments after a detected sign-off string to strip post-roll commercials.
 */
export function trimPodcastCommercials(title = '', source = '', speakerSegments = []) {
  const showIdentifier = `${title} ${source}`;
  const rule = SHOW_SIGNOFF_RULES.find(r => r.matchFeed.test(showIdentifier));
  if (!rule || !speakerSegments || speakerSegments.length === 0) {
    return speakerSegments;
  }

  for (let i = 0; i < speakerSegments.length; i++) {
    const seg = speakerSegments[i];
    const match = seg.text.match(rule.signoffRegex);
    if (match) {
      const matchEndIndex = match.index + match[0].length;
      const trimmedText = seg.text.slice(0, matchEndIndex).trim();
      const keptSegments = speakerSegments.slice(0, i);
      if (trimmedText.length > 0) {
        keptSegments.push({
          ...seg,
          text: trimmedText,
        });
      }
      const discardedCount = speakerSegments.length - 1 - i;
      console.log(`✂️ Trimmed post-show commercials for "${rule.name}" after segment ${i + 1}/${speakerSegments.length} (discarded ${discardedCount} post-roll commercial segments)`);
      return keptSegments;
    }

    // Handle sign-off phrase split across adjacent diarized speaker turns
    if (i + 1 < speakerSegments.length) {
      const nextSeg = speakerSegments[i + 1];
      const combined = `${seg.text} ${nextSeg.text}`;
      const splitMatch = combined.match(rule.signoffRegex);
      if (splitMatch) {
        const matchEndInCombined = splitMatch.index + splitMatch[0].length;
        if (matchEndInCombined > seg.text.length) {
          const keptSegments = speakerSegments.slice(0, i + 1);
          const offsetInNext = matchEndInCombined - (seg.text.length + 1);
          const trimmedNextText = nextSeg.text.slice(0, offsetInNext).trim();
          if (trimmedNextText.length > 0) {
            keptSegments.push({
              ...nextSeg,
              text: trimmedNextText,
            });
          }
          const discardedCount = speakerSegments.length - (i + 2);
          console.log(`✂️ Trimmed split-segment post-show commercials for "${rule.name}" after segment ${i + 2}/${speakerSegments.length} (discarded ${discardedCount} post-roll commercial segments)`);
          return keptSegments;
        }
      }
    }
  }

  return speakerSegments;
}

/**
 * Trims raw transcript text after a detected sign-off string to strip post-roll commercials.
 */
export function trimPodcastText(title = '', source = '', text = '') {
  const showIdentifier = `${title} ${source}`;
  const rule = SHOW_SIGNOFF_RULES.find(r => r.matchFeed.test(showIdentifier));
  if (!rule || !text) return text;

  const match = text.match(rule.signoffRegex);
  if (match) {
    const matchEndIndex = match.index + match[0].length;
    console.log(`✂️ Trimmed post-show commercials for "${rule.name}" in raw text at character ${matchEndIndex}/${text.length}`);
    return text.slice(0, matchEndIndex).trim();
  }
  return text;
}

/**
 * Low-level call to Google Generative Language API
 */
export async function callGemini(prompt, { systemInstruction, model = DEFAULT_GEMINI_MODEL, apiKey } = {}) {
  const key = apiKey ?? process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 64000,
      }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status} (${model}): ${err}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error(`No candidate returned by Gemini (${model}): ${JSON.stringify(data)}`);
  }

  // P1 Fix: Reject truncated outputs where model was cut off by token limit
  const finishReason = candidate.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw new Error(`Gemini generation stopped abnormally (${model}): finishReason=${finishReason}. Output was truncated.`);
  }

  // P1 Fix: Concatenate all content parts rather than reading only parts[0]
  const parts = candidate.content?.parts || [];
  const text = parts.map((p) => p.text || '').join('');
  if (!text) {
    throw new Error(`No text returned by Gemini (${model}): ${JSON.stringify(data)}`);
  }

  return {
    text,
    model,
    finishReason: finishReason || 'STOP',
    usage: data.usageMetadata || null,
  };
}

/**
 * Exhaustively extract an article into a 100% master markdown report
 */
export async function extractArticleToMasterReport({
  title,
  source,
  author,
  publishedAt,
  url,
  body,
  outFile,
  model = DEFAULT_GEMINI_MODEL
}) {
  console.log(`\n📰 Extracting Article: "${title}" (${source}) via ${model}...`);

  const systemInstruction = `You are an elite NFL sports analytics director, professional handicapper, and master scouting intelligence compiler.
Your assignment is to generate a 100% EXHAUSTIVE, UNCOMPROMISING MASTER INTELLIGENCE REPORT from the provided article text.
Every single piece of data, statistic, offensive/defensive scheme change, trench matchup, coaching tendency, injury update, player grade, projected snap share, and betting recommendation must be preserved in rich detail.
DO NOT summarize or compress. Capture every specific number, line, juice, model edge, quote, and analytical angle.`;

  const prompt = `Generate a 100% Exhaustive Master Intelligence Report based on this article:

TITLE: ${title}
SOURCE: ${source}
AUTHOR: ${author || 'Analyst'}
PUBLISHED: ${publishedAt || '2026'}
URL: ${url || 'N/A'}

ARTICLE CONTENT:
${body}

CRITICAL STRUCTURAL REQUIREMENTS:
You MUST follow this exact structure to guarantee compatibility with the NFL Dashboard automated ingestion and portfolio synthesis pipeline:

# 🏈 ${title}: 100% Exhaustive Master Intelligence Report

**Source:** ${source}  
**Author:** ${author || 'Analyst'}  
**URL:** [${title}](${url || '#'})  

---

## 📌 Executive Summary
Provide a thorough executive summary of the macro storylines, prevailing market biases, critical injury situations, and key overarching betting dynamics detailed in the text.

For EVERY NFL TEAM mentioned or analyzed in the text, you MUST include a dedicated section with the EXACT header format:
## 🏆 <Full Official Team Name>
(For example: ## 🏆 New England Patriots, ## 🏆 Seattle Seahawks, ## 🏆 Los Angeles Rams, etc.)
Under each team header, provide:
### 🎯 Betting Lines & Market Intel
- Exhaustive listing of every spread, total, moneyline, derivative, player prop, win total, or futures odds mentioned for this team or its opponents.
### 📊 Analytical Breakdown & Strategic Matchup Details
- In-depth tactical, personnel, scheme, offensive/defensive line, snap share, and coaching analysis.
### 💡 Betting & Fantasy Rationale
- The explicit reasoning behind bets, fades, totals, or fantasy outlooks for this team.
### 🔍 Citations & Source Notes
- Verbatim or near-verbatim quotes, author attributions, and exact references.

After all individual team sections, conclude with:
## 💡 Betting & Fantasy Rationale: Comprehensive Portfolio Strategy
Synthesize all actionable recommendations, value bets, contrarian angles, and bankroll allocations.

## 🔍 Key Citations & Source Notes
Summarize the key source credentials, methodologies, and source quotes.`;

  const result = await callGemini(prompt, { systemInstruction, model });
  console.log(`   Generated ${result.text.length} chars (finishReason: ${result.finishReason})`);

  let markdown = result.text.trim();
  // Append durable extraction provenance & model usage receipt
  const auditReceipt = `\n\n---\n<!-- Extraction Provenance: model=${result.model} finishReason=${result.finishReason} promptTokens=${result.usage?.promptTokenCount ?? 'N/A'} candidateTokens=${result.usage?.candidatesTokenCount ?? 'N/A'} totalTokens=${result.usage?.totalTokenCount ?? 'N/A'} extractedAt=${new Date().toISOString()} -->\n`;
  markdown += auditReceipt;

  const validation = validateMasterReport(markdown, { minBytes: 1500, requireSections: true, requireTerminalSection: true });
  if (!validation.valid) {
    throw new Error(`Master report validation failed: ${validation.reason} (${validation.details || ''})`);
  }

  if (outFile) {
    fs.writeFileSync(outFile, markdown, 'utf-8');
    console.log(`✅ Successfully saved validated master report to: ${outFile}`);
  }

  return markdown;
}

/**
 * Exhaustively extract a podcast episode into a 100% master markdown report
 */
export async function extractPodcastToMasterReport({
  title,
  source,
  experts,
  speakerSegments,
  rawText,
  outFile,
  model = DEFAULT_GEMINI_MODEL
}) {
  console.log(`\n🎙️ Extracting Podcast: "${title}" (${source}) via ${model}...`);

  const cleanedSegments = trimPodcastCommercials(title, source, speakerSegments);
  const cleanedRawText = trimPodcastText(title, source, rawText);

  const timecodedText = (cleanedSegments && cleanedSegments.length > 0)
    ? cleanedSegments.map(s => `[${fmtTimestamp(s.start)} - ${fmtTimestamp(s.end)}] Speaker ${s.speaker}: ${s.text}`).join('\n')
    : cleanedRawText;

  const systemInstruction = `You are an elite NFL sports betting analyst, mathematical handicapper, and master scouting compiler.
Your assignment is to generate a 100% EXHAUSTIVE, UNCOMPROMISING MASTER INTELLIGENCE REPORT from this diarized podcast transcript.
Every single wager, spread, moneyline, game total, teaser leg, survivor pool pick, upset trap, player prop, unit size, handicap reasoning, and verbatim quote must be captured in meticulous detail.
DO NOT summarize or gloss over games. Preserving all timecodes and speaker attributions is essential.`;

  const prompt = `Generate a 100% Exhaustive Master Intelligence Report based on this episode transcript:

TITLE: ${title}
SOURCE: ${source}
EXPERTS ATTRIBUTED: ${experts}

CRITICAL STRUCTURAL REQUIREMENTS:
You MUST follow this exact structure to guarantee compatibility with the NFL Dashboard automated ingestion and portfolio synthesis pipeline:

# 🏈 ${title}: 100% Exhaustive Master Intelligence Report

**Source Episode:** ${source}  
**Experts Attributed:** ${experts}  

---

## 📌 Executive Summary
Thorough summary of all overarching betting themes, survivor contest strategies (e.g. Circa Survivor considerations), key line movements, market traps, and consensus/contrarian stances between the experts.

For EVERY NFL TEAM discussed or bet in this episode, you MUST include a dedicated section with the EXACT header format:
## 🏆 <Full Official Team Name>
(For example: ## 🏆 Baltimore Ravens, ## 🏆 Kansas City Chiefs, ## 🏆 Philadelphia Eagles, ## 🏆 Green Bay Packers, etc.)
Under each team header, provide:
### 🎯 Betting Lines & Market Intel
- List all exact wagers, lines (spread, total, ML, teaser, survivor pick), unit sizes, and bookmaker odds mentioned for this team or its matchup.
### 📊 Analytical Breakdown & Strategic Matchup Details
- In-depth tactical, personnel, trench matchup, coaching, situational spot, and rest advantage analysis.
### 💡 Betting & Fantasy Rationale
- The explicit reasoning from ${experts} for backing, fading, teasing, or surviving with this team.
### 🔍 Citations & Timestamps
- Real timestamps [MM:SS], speaker name, and verbatim or near-verbatim quotes.

After all individual team sections, conclude with:
## 💡 Betting & Fantasy Rationale: Comprehensive Portfolio Strategy
Consolidated betting card, unit allocations, best bets, teasers, and survivor pool ranking order.

## 🔍 Key Citations & Source Notes
Full list of key quote citations with exact timestamps and speakers.

TRANSCRIPT:
${timecodedText}`;

  const result = await callGemini(prompt, { systemInstruction, model });
  console.log(`   Generated ${result.text.length} chars (finishReason: ${result.finishReason})`);

  let markdown = result.text.trim();
  // Append durable extraction provenance & model usage receipt
  const auditReceipt = `\n\n---\n<!-- Extraction Provenance: model=${result.model} finishReason=${result.finishReason} promptTokens=${result.usage?.promptTokenCount ?? 'N/A'} candidateTokens=${result.usage?.candidatesTokenCount ?? 'N/A'} totalTokens=${result.usage?.totalTokenCount ?? 'N/A'} extractedAt=${new Date().toISOString()} -->\n`;
  markdown += auditReceipt;

  const validation = validateMasterReport(markdown, { minBytes: 1500, requireSections: true, requireTerminalSection: true });
  if (!validation.valid) {
    throw new Error(`Master report validation failed: ${validation.reason} (${validation.details || ''})`);
  }

  if (outFile) {
    fs.writeFileSync(outFile, markdown, 'utf-8');
    console.log(`✅ Successfully saved validated master report to: ${outFile}`);
  }

  return markdown;
}
