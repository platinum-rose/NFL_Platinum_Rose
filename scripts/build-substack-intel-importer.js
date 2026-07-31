#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DATA_DIR = path.join(ROOT, 'data', 'research-intel', 'substack');
const LOCAL_DIR = path.join(ROOT, 'data', 'research-intel', 'local');

export const SUBSTACK_POST_EMR_2026 = {
  id: 'substack_200307567_emr',
  source: 'THE WINDOW (Matt Russell)',
  source_type: 'newsletter',
  author: 'Matt Russell',
  title: '2026 NFL Betting: Estimating every NFL teams’ power rating in the betting market',
  summary: 'Updated Estimated Market Ratings (EMR), regular-season win total movements, DraftKings lookahead spread cross-referencing, and home-field advantage (HFA) adjustments for all 32 NFL teams ahead of training camp.',
  url: 'https://mrussauthentic.substack.com/p/2026-nfl-betting-estimating-every',
  published_at: '2026-07-13T16:37:49.807Z',
  captured_at: new Date().toISOString(),
  confidence: 0.75,
  hfa_handicap: {
    standard_hfa: 1.5,
    boosted_hfa: {
      MIA: 1.75, // Heat acclimation
      DEN: 1.75, // Elevation
    },
    docked_hfa: {
      LAC: 1.0,
      LAR: 1.25,
      SF: 1.25,
      NYG: 1.25,
      NYJ: 1.25,
      ARI: 1.25,
    },
  },
  team_emr_notes: [
    { team: 'ARI', emr_prev: 26, emr_new: 25, win_total: null, note: 'No significant change, moving from 26 to 25' },
    { team: 'ATL', emr_prev: null, emr_new: null, win_total: 7.05, note: 'Dropped a quarter of a win in regular season win totals from 7.3 (7.5, +105) to 7.05 (7.5, +120)' },
    { team: 'BAL', emr_prev: 66, emr_new: 65, win_total: null, note: 'No significant change, moving from 66 to 65' },
    { team: 'BUF', emr_prev: 62, emr_new: 66, win_total: null, note: 'Rise in rankings from 62 to 66 due to point spread data points, indicating a difficult schedule' },
    { team: 'CAR', emr_prev: 38, emr_new: 45, win_total: 7.05, note: 'Big move in rankings from 38 to 45, reflecting both a rise in win total from 6.83 to 7.05 and point spread cross-referencing' },
    { team: 'CHI', emr_prev: 59, emr_new: 60, win_total: null, note: 'No significant change, moving from 59 to 60' },
    { team: 'CIN', emr_prev: 59, emr_new: 57, win_total: 10.21, note: 'Drop in rating from 59 to 57 due to point spread data, but a rise in season win total from 9.98 (9.5, -130) to 10.21, indicative of an easier-than-expected schedule' },
    { team: 'CLE', emr_prev: 35, emr_new: 31, win_total: 5.78, note: 'Drop in rating from 35 to 31, stemming from both point spread data and a change in season win total from 5.98 to 5.78' },
    { team: 'DAL', emr_prev: 54, emr_new: 58, win_total: null, note: 'Rise in rating from 54 to 58, despite a small downward adjustment in regular season win total, indicating a significantly easier non-division schedule than expected' },
    { team: 'DEN', emr_prev: 60, emr_new: 57, win_total: 9.58, note: 'Drop from 60 to 57, reflective of a drop in season win total move from 9.98 to 9.58' },
    { team: 'DET', emr_prev: 69, emr_new: 62, win_total: null, note: 'Biggest drop, from 69 (and the top spot in May’s EMR) to 62, entirely reflective of the Lions’ soft non-division schedule and a high number of point spreads of over a touchdown' },
    { team: 'GB', emr_prev: 64, emr_new: 62, win_total: 9.98, note: 'Small drop from 64 to 62, reflective of a drop in season win total from 10.21 to 9.98' },
    { team: 'HOU', emr_prev: 57, emr_new: 60, win_total: 9.65, note: 'Up from 57 to 60, with a rise of a quarter-win in regular season win total as the over 9.5 has moved from -115 to -130' },
    { team: 'IND', emr_prev: 48, emr_new: 46, win_total: 8.01, note: 'A drop in rating from 48 to 46 isn’t as significant as a drop in lined regular season win total of 8.27 down to 8.01' },
    { team: 'JAX', emr_prev: null, emr_new: null, win_total: 8.5, note: 'No change in rating, but first of four teams to see market shift from plus-money on over 9.5 to juicing the over at 8.5' },
    { team: 'KC', emr_prev: null, emr_new: null, win_total: null, note: 'No change in rating' },
    { team: 'LAC', emr_prev: 60, emr_new: 62, win_total: 9.5, note: 'Small change up from 60 to 62, with win total moving from 10.5 (+115 over) to 9.5 (-135 over)' },
    { team: 'LAR', emr_prev: 68, emr_new: 74, win_total: 12.1, note: 'Big move up for the Super Bowl favorite from 68 to 74 — a significant starting point for 2026-27 — thanks to market interest in Myles Garrett addition, moving win total from 11.2 to 12.1' },
    { team: 'LV', emr_prev: null, emr_new: null, win_total: null, note: 'No change in rating' },
    { team: 'MIA', emr_prev: 25, emr_new: 28, win_total: null, note: 'Small rating increase from 25 to 28, pulling Dolphins out of dead-last, though no change in regular season win total' },
    { team: 'MIN', emr_prev: null, emr_new: null, win_total: null, note: 'No change in rating' },
    { team: 'NE', emr_prev: null, emr_new: null, win_total: 9.98, note: 'Cosmetic change to win total from 10.06 to 9.98, with small rating increase after A.J. Brown trade made official' },
    { team: 'NO', emr_prev: 43, emr_new: 42, win_total: null, note: 'No significant change, going from 43 to 42' },
    { team: 'NYG', emr_prev: 43, emr_new: 44, win_total: null, note: 'Marginal increase in rating from 43 to 44' },
    { team: 'NYJ', emr_prev: 31, emr_new: 35, win_total: null, note: 'Increase in rating (31 to 35) comes without a change in win total, out of respect for schedule' },
    { team: 'PHI', emr_prev: null, emr_new: null, win_total: null, note: 'No change in rating' },
    { team: 'PIT', emr_prev: 48, emr_new: 46, win_total: null, note: 'Small change to rating from 48 to 46' },
    { team: 'SEA', emr_prev: 68, emr_new: 67, win_total: null, note: 'Marginal change to rating from 68 to 67' },
    { team: 'SF', emr_prev: 62, emr_new: 61, win_total: null, note: 'Small decrease in rating from 62 to 61; Rams now -3.5 vs 49ers for Week 1 neutral site matchup' },
    { team: 'TB', emr_prev: 47, emr_new: 51, win_total: null, note: 'Increase in rating from 47 to 51 without change in win total, reflecting difficult schedule & NFC South depth' },
    { team: 'TEN', emr_prev: 39, emr_new: 38, win_total: 6.4, note: 'Win total drop from 6.6 to 6.4 is more significant than rating drop from 39 to 38' },
    { team: 'WAS', emr_prev: 46, emr_new: 48, win_total: null, note: 'Small increase from 46 to 48, without change to season win total' },
  ]
};

export function buildFullArticleBody(postData) {
  const lines = [
    `# ${postData.title}`,
    `By ${postData.author} (${postData.source})`,
    `Published: ${postData.published_at}`,
    `URL: ${postData.url}`,
    '',
    `## Summary`,
    postData.summary,
    '',
    `## Home-Field Advantage (HFA) Handicapping`,
    `- Baseline HFA: ${postData.hfa_handicap.standard_hfa} pts (down from 1.75)`,
    `- Altitude / Heat Boost: Miami (1.75 pts), Denver (1.75 pts)`,
    `- Docked Home Edge: Chargers (1.0 pt), Rams (1.25 pts), 49ers (1.25 pts), Giants (1.25 pts), Jets (1.25 pts), Cardinals (1.25 pts)`,
    '',
    `## Team Estimated Market Ratings (EMR) & Win Total Deltas`,
    ...postData.team_emr_notes.map((item) => {
      const emrStr = item.emr_prev !== null && item.emr_new !== null ? ` (EMR: ${item.emr_prev} -> ${item.emr_new})` : '';
      const wtStr = item.win_total !== null ? ` (Win Total: ${item.win_total})` : '';
      return `- **${item.team}**${emrStr}${wtStr}: ${item.note}`;
    }),
  ];
  return lines.join('\n');
}

export function buildResearchNoteRecord(postData) {
  const bodyText = buildFullArticleBody(postData);
  return {
    id: postData.id,
    source: postData.source,
    source_type: postData.source_type,
    author: postData.author,
    title: postData.title,
    summary: postData.summary,
    body: bodyText,
    url: postData.url,
    published_at: postData.published_at,
    captured_at: postData.captured_at,
    confidence: postData.confidence,
    metadata: {
      publication: 'THE WINDOW',
      hfa: postData.hfa_handicap,
      team_notes_count: postData.team_emr_notes.length,
    }
  };
}

export async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(LOCAL_DIR, { recursive: true });

  const record = buildResearchNoteRecord(SUBSTACK_POST_EMR_2026);
  const jsonContent = JSON.stringify(record, null, 2) + '\n';

  const subPath = path.join(DATA_DIR, '2026-07-13-the-window-emr-ratings.json');
  const localPath = path.join(LOCAL_DIR, '2026-07-13-the-window-emr-ratings.json');

  fs.writeFileSync(subPath, jsonContent, 'utf8');
  fs.writeFileSync(localPath, jsonContent, 'utf8');

  console.log(`Successfully saved Substack EMR research note to:`);
  console.log(` - ${path.relative(ROOT, subPath)}`);
  console.log(` - ${path.relative(ROOT, localPath)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('Substack importer error:', err);
    process.exit(1);
  });
}
