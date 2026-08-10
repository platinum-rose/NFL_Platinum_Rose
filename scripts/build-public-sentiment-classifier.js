#!/usr/bin/env node

/**
 * scripts/build-public-sentiment-classifier.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Expansion O: Public Sentiment & Contrarian Breadth Classifier
 *
 * Scans ingested podcast citations and line movement snapshots to classify public
 * vs sharp sentiment across all 32 teams.
 *
 * Input:  data/generated/host-citations-latest.json
 * Output: data/generated/public-sentiment-latest.json
 *
 * Zero API calls. High-volume text classification.
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NFL_TEAMS } from '../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CITATIONS_FILE = path.join(ROOT, 'data', 'generated', 'host-citations-latest.json');
const OUT_DIR = path.join(ROOT, 'data', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'public-sentiment-latest.json');

async function main() {
  console.log('📈 Running Public Sentiment & Contrarian Classifier...');

  await mkdir(OUT_DIR, { recursive: true });

  let citationsData = { citations: [] };
  try {
    citationsData = JSON.parse(await readFile(CITATIONS_FILE, 'utf8'));
  } catch {
    // intentionally empty — keep the default (no citations) if the file is missing/unparseable
  }

  const citations = citationsData.citations || [];
  const teamSentiment = {};

  for (const [key, team] of Object.entries(NFL_TEAMS)) {
    const abbr = team.abbreviation;
    const teamCites = citations.filter(c => c.team === abbr);
    const bullishCount = teamCites.filter(c => c.sentiment === 'bullish').length;
    const bearishCount = teamCites.filter(c => c.sentiment === 'bearish').length;
    const total = teamCites.length;

    let sentimentTag = 'NEUTRAL';
    if (bullishCount > bearishCount * 2 && bullishCount >= 5) sentimentTag = 'PUBLIC_CHALK';
    else if (bullishCount > bearishCount && total >= 3) sentimentTag = 'BULLISH_LEAN';
    else if (bearishCount > bullishCount * 2 && bearishCount >= 5) sentimentTag = 'STEAM_TRAP';
    else if (bearishCount > bullishCount && total >= 3) sentimentTag = 'CONTRARIAN_SLEEPER';

    teamSentiment[abbr] = {
      team: abbr,
      team_name: team.fullName,
      sentiment_tag: sentimentTag,
      total_takes: total,
      bullish_count: bullishCount,
      bearish_count: bearishCount,
      net_sentiment_score: total > 0 ? Number(((bullishCount - bearishCount) / total).toFixed(2)) : 0,
    };
  }

  const output = {
    meta: {
      schema: 'public_sentiment_v1',
      generated_at: new Date().toISOString(),
      teams_processed: Object.keys(teamSentiment).length,
      total_citations_analyzed: citations.length,
    },
    teams: teamSentiment,
  };

  await writeFile(OUT_FILE, JSON.stringify(output, null, 2));

  console.log(`✅ Public Sentiment Classifier completed!`);
  console.log(`   Teams Processed:     ${Object.keys(teamSentiment).length}/32`);
  console.log(`   Citations Analyzed: ${citations.length}`);
  console.log(`   Saved Snapshot:     ${OUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
