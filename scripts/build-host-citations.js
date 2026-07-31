#!/usr/bin/env node

/**
 * scripts/build-host-citations.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Offline extraction of expert host citations from podcast transcript deep-dives.
 * Scans structured markdown beats for team mentions, sentiment keywords, and
 * betting language to build a structured citation index.
 *
 * Input:  docs/podcast-transcript-deep-dives/index.json + *.md files
 * Output: data/generated/host-citations-latest.json
 *
 * Zero API calls. Reads local markdown files only.
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'docs', 'podcast-transcript-deep-dives', 'index.json');
const DEEP_DIVES_DIR = path.join(ROOT, 'docs', 'podcast-transcript-deep-dives');
const OUT_DIR = path.join(ROOT, 'data', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'host-citations-latest.json');

// ── Team matching ─────────────────────────────────────────────────────────────

const TEAM_KEYWORDS = {
  ARI: ['cardinals', 'arizona'],
  ATL: ['falcons', 'atlanta'],
  BAL: ['ravens', 'baltimore'],
  BUF: ['bills', 'buffalo'],
  CAR: ['panthers', 'carolina'],
  CHI: ['bears', 'chicago'],
  CIN: ['bengals', 'cincinnati'],
  CLE: ['browns', 'cleveland'],
  DAL: ['cowboys', 'dallas'],
  DEN: ['broncos', 'denver'],
  DET: ['lions', 'detroit'],
  GB:  ['packers', 'green bay'],
  HOU: ['texans', 'houston'],
  IND: ['colts', 'indianapolis', 'indy'],
  JAX: ['jaguars', 'jacksonville', 'jags'],
  KC:  ['chiefs', 'kansas city'],
  LV:  ['raiders', 'las vegas', 'vegas'],
  LAC: ['chargers', 'la chargers'],
  LAR: ['rams', 'la rams'],
  MIA: ['dolphins', 'miami'],
  MIN: ['vikings', 'minnesota'],
  NE:  ['patriots', 'new england'],
  NO:  ['saints', 'new orleans'],
  NYG: ['giants', 'ny giants'],
  NYJ: ['jets', 'ny jets'],
  PHI: ['eagles', 'philadelphia', 'philly'],
  PIT: ['steelers', 'pittsburgh'],
  SF:  ['49ers', 'niners', 'san francisco'],
  SEA: ['seahawks', 'seattle'],
  TB:  ['buccaneers', 'tampa bay', 'bucs', 'tampa'],
  TEN: ['titans', 'tennessee'],
  WAS: ['commanders', 'washington'],
};

const TEAM_FULL_NAMES = {
  ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens',
  BUF: 'Buffalo Bills', CAR: 'Carolina Panthers', CHI: 'Chicago Bears',
  CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys',
  DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers',
  HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars',
  KC: 'Kansas City Chiefs', LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers',
  LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings',
  NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants',
  NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers',
  SF: 'San Francisco 49ers', SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers',
  TEN: 'Tennessee Titans', WAS: 'Washington Commanders',
};

// ── Sentiment detection ───────────────────────────────────────────────────────

const BULLISH_PATTERNS = [
  /\b(?:i (?:like|love|lean)|back|bet on|take the|go with|really like|feel (?:good|confident)|over \d)/i,
  /\b(?:make (?:the )?playoffs|win (?:the )?division|super bowl contender|sleeper|value|upside)/i,
  /\b(?:plus money|good price|undervalued|buy|sharp money|steam)/i,
];

const BEARISH_PATTERNS = [
  /\b(?:fade|avoid|stay away|don't like|not buying|skeptical|overrated|sell)/i,
  /\b(?:miss (?:the )?playoffs|under \d|won't win|can't see|regression|decline)/i,
  /\b(?:overvalued|too short|bad price|chalk|square|trap)/i,
];

function detectSentiment(text) {
  const bullishScore = BULLISH_PATTERNS.reduce((n, p) => n + (p.test(text) ? 1 : 0), 0);
  const bearishScore = BEARISH_PATTERNS.reduce((n, p) => n + (p.test(text) ? 1 : 0), 0);
  if (bullishScore > bearishScore && bullishScore >= 1) return 'bullish';
  if (bearishScore > bullishScore && bearishScore >= 1) return 'bearish';
  return 'neutral';
}

// ── Market slot detection ─────────────────────────────────────────────────────

function detectMarketSlot(topicsLine, text) {
  const combined = `${topicsLine} ${text}`.toLowerCase();
  if (/super bowl|sb\b|championship/i.test(combined)) return 'superbowl';
  if (/conference|afc champion|nfc champion|conf\. winner/i.test(combined)) return 'conference';
  if (/division|div\. winner|nfc (?:east|west|north|south)|afc (?:east|west|north|south)/i.test(combined)) return 'division';
  if (/win total|over.under|wins|season (?:win|total)|o\/u/i.test(combined)) return 'wins';
  if (/playoff|make.the.playoffs|postseason/i.test(combined)) return 'playoffs';
  return 'general';
}

// ── Team extraction from Topics line ──────────────────────────────────────────

function extractTeamsFromTopics(topicsStr) {
  const lower = topicsStr.toLowerCase();
  const matched = [];
  for (const [abbr, keywords] of Object.entries(TEAM_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matched.push(abbr);
        break;
      }
    }
  }
  return matched;
}

// ── Markdown beat parser ──────────────────────────────────────────────────────

function parseBeats(markdown) {
  const beats = [];
  const beatRegex = /^### \d+\.\s+(.+?)$/gm;
  const headers = [];
  let match;
  while ((match = beatRegex.exec(markdown)) !== null) {
    headers.push({ title: match[1], index: match.index });
  }

  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : markdown.length;
    const section = markdown.slice(start, end);

    const speakers = (section.match(/^Speakers:\s*(.+)$/m) || [])[1] || '';
    const topics   = (section.match(/^Topics:\s*(.+)$/m)   || [])[1] || '';
    const conclusion = (section.match(/^Conclusion:\s*(.+)$/m) || [])[1] || '';

    const bettingMatch = section.match(/Betting language \/ picks:\n([\s\S]*?)(?=\n(?:Representative lines|###|\n## ))/);
    const bettingLines = bettingMatch
      ? bettingMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^\s*-\s*/, ''))
      : [];

    const reasoningMatch = section.match(/Mindset \/ reasoning clues:\n([\s\S]*?)(?=\nBetting language)/);
    const reasoningLines = reasoningMatch
      ? reasoningMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^\s*-\s*/, ''))
      : [];

    beats.push({
      title: headers[i].title,
      speakers,
      topics,
      conclusion,
      bettingLines,
      reasoningLines,
      fullText: section,
    });
  }

  return beats;
}

// ── Speaker name extraction from attribution ──────────────────────────────────

// Known noise phrases that regex matches but aren't real host names
const SPEAKER_NOISE = ['one of our greatest', 'my co host', 'the host', 'our guest', 'the guest'];

function extractSpeakerName(line) {
  const match = line.match(/^([\w\s.'-]+?)\s*\(Speaker [A-Z]\)/);
  if (!match) return null;
  const name = match[1].trim();
  if (SPEAKER_NOISE.some(n => name.toLowerCase().includes(n))) return null;
  // Reject names that are too short (likely parsing artifacts)
  if (name.length < 4 || name.split(' ').length < 2) return null;
  return name;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

async function main() {
  console.log('🎙️  Building Host Citation Index from podcast deep-dives...');

  let index;
  try {
    index = JSON.parse(await readFile(INDEX_PATH, 'utf8'));
  } catch (err) {
    console.error('❌ Could not read podcast index:', err.message);
    process.exit(1);
  }

  const episodes = index.episodes || [];
  console.log(`   Found ${episodes.length} episodes in index.`);

  const allCitations = [];

  for (const ep of episodes) {
    const mdPath = path.join(DEEP_DIVES_DIR, `${ep.slug}.md`);
    let markdown;
    try {
      markdown = await readFile(mdPath, 'utf8');
    } catch {
      continue;
    }

    const speakerMap = ep.speaker_map || {};
    const hostNames = Object.entries(speakerMap)
      .filter(([, name]) => name && !name.toLowerCase().includes('ad/commercial') && name !== 'Guest')
      .map(([, name]) => name);

    const beats = parseBeats(markdown);

    for (const beat of beats) {
      const teams = extractTeamsFromTopics(beat.topics);
      if (teams.length === 0) continue;

      const allLines = [
        ...beat.bettingLines,
        beat.conclusion && beat.conclusion !== 'No firm pick surfaced.' ? beat.conclusion : '',
        ...beat.reasoningLines,
      ].filter(Boolean);

      if (allLines.length === 0) continue;

      const marketSlot = detectMarketSlot(beat.topics, beat.fullText);

      for (const line of allLines) {
        const speakerName = extractSpeakerName(line);
        if (!speakerName) continue;
        if (!hostNames.includes(speakerName)) continue;

        const quoteMatch = line.match(/\(Speaker [A-Z]\)[\s:–-]*(.+)/);
        const quote = quoteMatch ? quoteMatch[1].trim() : line;

        const sentiment = detectSentiment(quote);
        if (sentiment === 'neutral') continue;

        for (const team of teams) {
          const citationId = `cite_${sha([team, speakerName, ep.slug, quote.slice(0, 50)].join('|'))}`;

          allCitations.push({
            id: citationId,
            host: speakerName,
            show: ep.show,
            team,
            teamFullName: TEAM_FULL_NAMES[team] || team,
            market: marketSlot,
            sentiment,
            quote: quote.length > 200 ? quote.slice(0, 197) + '...' : quote,
            episodeSlug: ep.slug,
            episodeTitle: ep.title,
            pubDate: ep.pub_date,
          });
        }
      }
    }
  }

  // Deduplicate by citation ID
  const dedupMap = new Map();
  for (const c of allCitations) {
    if (!dedupMap.has(c.id)) {
      dedupMap.set(c.id, c);
    }
  }
  const citations = [...dedupMap.values()].sort(
    (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
  );

  // Build summary stats
  const teamCounts = {};
  const hostCounts = {};
  for (const c of citations) {
    teamCounts[c.team] = (teamCounts[c.team] || 0) + 1;
    hostCounts[c.host] = (hostCounts[c.host] || 0) + 1;
  }

  const output = {
    meta: {
      schema: 'host_citations_v1',
      generated_at: new Date().toISOString(),
      source: 'docs/podcast-transcript-deep-dives/',
      episode_count: episodes.length,
      citation_count: citations.length,
      unique_teams: Object.keys(teamCounts).length,
      unique_hosts: Object.keys(hostCounts).length,
      team_coverage: teamCounts,
      host_coverage: hostCounts,
    },
    citations,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(output, null, 2));

  console.log(`✅ Host Citation Index built!`);
  console.log(`   Citations: ${citations.length}`);
  console.log(`   Teams:     ${Object.keys(teamCounts).length}/32`);
  console.log(`   Hosts:     ${Object.keys(hostCounts).length}`);
  console.log(`   Saved to:  ${OUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
