// src/lib/openai.js
// ═══════════════════════════════════════════════════════════════════════════════
// OpenAI API Integration — Extracted from App.jsx handleAIAnalyze
// ═══════════════════════════════════════════════════════════════════════════════

import { OPENAI_API, AI_PROXY_URL } from './apiConfig.js';
import { getEdgeFunctionHeaders } from './edgeAuth.js';

const TIMEOUT_MS  = 30_000; // 30 s per attempt
const MAX_RETRIES = 1;      // 1 retry on 5xx (2 total attempts)

/**
 * Extract NFL betting picks from a transcript using GPT-4o.
 *
 * @param {string} text - Raw transcript text (truncated to 15k chars internally)
 * @param {object} sourceData - { name: string, apiKey: string } — expert source info
 * @param {string[]} availableGames - Array of "VISITOR @ HOME" strings for context
 * @returns {Promise<object[]>} - Array of extracted pick objects
 * @throws {Error} - On API error, parse failure, or timeout
 */
export async function extractPicksFromTranscript(text, sourceData, availableGames) {
  const prompt = `
Analyze this NFL betting transcript and extract picks.
Source: ${sourceData.name}

Available games THIS WEEK: ${availableGames.join(', ')}

For each pick, identify:
1. The TEAM (must be one of the available games)
2. The TYPE (Spread, Total, or Moneyline)
3. The LINE (the spread/total value, or "ML" for moneyline)
4. The analysis/rationale
5. Units (confidence level)

Return a valid JSON object with this exact format:
{
  "picks": [
    {
      "selection": "SEA",
      "team1": "Seattle",
      "team2": "New England",
      "type": "Spread",
      "line": "-4.5",
      "summary": "Key reasons for this pick",
      "analysis": "Detailed analysis",
      "units": 2
    }
  ]
}

Make sure "selection" is the team's abbreviation or clear identifier from the available games.

Transcript: ${text.substring(0, 15000)}
`;

  // No per-source key → go through ai-proxy (server-side key, signed-in user).
  // A per-source key, if a source still supplies one, keeps the direct path.
  const useProxy = Boolean(AI_PROXY_URL && !sourceData?.apiKey);
  const url = useProxy ? AI_PROXY_URL : OPENAI_API.BASE_URL;
  const headers = useProxy
    ? await getEdgeFunctionHeaders()
    : {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sourceData?.apiKey || ''}`,
      };

  const body = JSON.stringify({
    ...(useProxy ? { provider: 'openai' } : {}),
    model: OPENAI_API.MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a betting analyst JSON extractor. Return ONLY a valid JSON object with \'picks\' array. Ensure team names match the available games provided.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
  });

  // Fetch with timeout + 1 retry on 5xx
  let response;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status >= 500 && attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
    break;
  }

  const data = await response.json();

  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : (data.error?.message || `HTTP ${response.status}`);
    throw new Error(`OpenAI Error: ${msg}`);
  }

  const content = JSON.parse(data.choices[0].message.content);
  let picks = content.picks || content;
  if (!Array.isArray(picks)) picks = [picks];

  return picks;
}

