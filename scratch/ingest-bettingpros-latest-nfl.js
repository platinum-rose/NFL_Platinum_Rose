import fs from 'node:fs/promises';
import path from 'node:path';

const RUN_DATE = '2026-08-28';
const SOURCE = 'BettingPros';
const POSTS_URL = 'https://www.bettingpros.com/wp-json/wp/v2/posts?per_page=50&_embed=1';
const OUTPUT_JSON = path.join('data', 'research-intel', `bettingpros-latest-nfl-${RUN_DATE}.json`);
const MANIFEST_MD = path.join('docs', 'antigravity', `bettingpros-latest-nfl-ingest-${RUN_DATE}.md`);
const LATEST_VISIBLE_SLUGS = new Set([
  'nfl-preseason-picks-commanders-vs-ravens-friday',
  'nfl-preseason-picks-falcons-vs-dolphins-friday',
  'nfl-preseason-picks-saints-vs-cowboys-friday',
  'nfl-preseason-picks-predictions-week-3-saturday',
  'nfl-preseason-picks-predictions-week-3-friday',
]);

function decodeEntities(value = '') {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\u00a2/g, ' cents')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(html = '') {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, '. ')
      .replace(/<[^>]+>/g, ' '),
  );
}

function uniqueList(items, limit = 8) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const cleaned = decodeEntities(item).replace(/\s+/g, ' ').trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
    if (output.length >= limit) break;
  }
  return output;
}

function sentenceList(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => sentence.length >= 35 && sentence.length <= 420);
}

function limitWords(text, maxWords = 28) {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? text : `${words.slice(0, maxWords).join(' ')}...`;
}

function classifyMarket(pick) {
  if (!pick) return 'unknown';
  if (/\b(first touchdown|touchdown scorer|td scorer)\b/i.test(pick)) return 'touchdown_or_scoring_prop';
  if (/\b(team total)\b/i.test(pick)) return 'team_total';
  if (/\b(moneyline|win|cents?)\b|\d+%/i.test(pick)) return 'moneyline';
  if (/\b(over|under)\b/i.test(pick)) return 'total_or_prop_total';
  if (/[+-]\d+(\.\d+)?/.test(pick)) return 'spread';
  return 'unknown';
}

function extractAuthor(post) {
  const embeddedAuthor = post?._embedded?.author?.[0];
  return decodeEntities(embeddedAuthor?.name || embeddedAuthor?.caption || post?.yoast_head_json?.author || 'unknown');
}

function extractTeams(title, slug) {
  const source = decodeEntities(title).replace(/^NFL Preseason Picks:\s*/i, '').replace(/\s*\([^)]*\)\s*$/g, '');
  const match = source.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (match) return [match[1].trim(), match[2].trim()];
  const slugMatch = slug.match(/picks-([a-z-]+)-vs-([a-z-]+)-friday/);
  if (!slugMatch) return [];
  return [slugMatch[1].replace(/-/g, ' '), slugMatch[2].replace(/-/g, ' ')]
    .map((team) => team.replace(/\b\w/g, (letter) => letter.toUpperCase()));
}

function cleanPick(value) {
  return decodeEntities(value)
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ')')
    .replace(/[.\s]+$/g, '')
    .trim();
}

function extractPicks(html, text) {
  const boldPicks = [...html.matchAll(/<(?:b|strong)[^>]*>\s*Pick(?:s)?:\s*([\s\S]*?)<\/(?:b|strong)>/gi)]
    .map((match) => cleanPick(stripHtml(match[1])));
  if (boldPicks.length) return uniqueList(boldPicks, 12);

  const boldSelections = [...html.matchAll(/<(?:b|strong)[^>]*>\s*([\s\S]*?)<\/(?:b|strong)>/gi)]
    .map((match) => cleanPick(stripHtml(match[1])))
    .filter((selection) => (
      /\([+-]?\d+\s*(?:via|at|\))|\([+-]\d+\)|\(-\d+\)/i.test(selection)
      && (/\b(over|under|moneyline|team total|yards|points|touchdown|field goals)\b/i.test(selection)
        || /(?:^|\s)[+-]\d+(\.\d+)?\b/.test(selection))
      && !/\b(best|advice|strategy|cheat sheet|vs\.?)\b/i.test(selection)
    ));
  if (boldSelections.length) return uniqueList(boldSelections, 12);

  const plainPicks = [...text.matchAll(/(?:^|\s)Pick(?:s)?:\s*([A-Z][^.!?]{2,140}(?:\([^)]*\))?)/g)]
    .map((match) => cleanPick(match[1]))
    .filter((pick) => !/\b(vs\.?|predictions?|advice|strategy)\b/i.test(pick));
  return uniqueList(plainPicks, 12);
}

function markdownTableRow(values) {
  return `| ${values.map((value) => String(value || '').replace(/\|/g, '/')).join(' | ')} |`;
}

function buildMasterReport(record) {
  return `${[
    `# ${record.title}`,
    '',
    `**Source:** ${record.source}`,
    `**Author:** ${record.author}`,
    `**URL:** ${record.url}`,
    `**Published:** ${record.published_at}`,
    `**Fetched:** ${record.fetched_at}`,
    `**Status:** local_source_grounded_candidate_only`,
    '',
    '## Candidate Extraction',
    '',
    `- Matchup: ${record.matchup || 'unknown'}`,
    `- Explicit pick(s): ${record.picks.length ? record.picks.join('; ') : 'not found'}`,
    `- Market type(s): ${record.market_types.join(', ') || 'unknown'}`,
    `- Recommendation status: ${record.picks.length ? 'explicit_author_selection_needs_human_review' : 'needs_manual_review'}`,
    '',
    '## Context',
    '',
    ...record.context.map((item) => `- ${item}`),
    '',
    '## Supporting Signals',
    '',
    ...(record.evidence_snippets.length
      ? record.evidence_snippets.map((item) => `- ${item}`)
      : ['- No compact support snippets extracted; manual review required.']),
    '',
    '## Guardrails',
    '',
    '- This file is research/intel only.',
    '- It does not promote an official pick.',
    '- It does not mutate bankroll, portfolio, pick ledger, odds cache, or Supabase data.',
    '- It was generated by deterministic public-feed ingestion without paid APIs or AI/model calls.',
    '',
  ].join('\n')}\n`;
}

async function fetchPosts() {
  const response = await fetch(POSTS_URL, {
    headers: {
      accept: 'application/json',
      'user-agent': 'Mozilla/5.0 NFL_Dashboard local BettingPros freshness check',
    },
  });
  if (!response.ok) {
    throw new Error(`BettingPros feed returned ${response.status}`);
  }
  return response.json();
}

function toRecord(post) {
  const title = decodeEntities(stripHtml(post.title?.rendered || post.slug));
  const html = post.content?.rendered || post.excerpt?.rendered || '';
  const text = stripHtml(html);
  const picks = extractPicks(html, text);
  const teams = extractTeams(title, post.slug);
  const sentences = sentenceList(text);
  const context = uniqueList(
    sentences.filter((sentence) => (
      /\b(odds courtesy|sportsbook|preseason|week 3|friday|quarterback|starter|coach|injur|team total|moneyline|spread|total)\b/i.test(sentence)
      && !/more nfl betting advice|get instant alerts|how to bet|affiliate|gambling problem/i.test(sentence)
    )).map((sentence) => limitWords(sentence, 30)),
    6,
  );
  const evidenceSnippets = uniqueList(
    sentences.filter((sentence) => (
      /\b(quarterback|qb|starter|backup|rotation|preseason|offense|defense|coach|injur|score|drive|touchdown|over|under|moneyline|spread|bet)\b/i.test(sentence)
      && !/more nfl betting advice|get instant alerts|how to bet|affiliate|gambling problem/i.test(sentence)
    )).map((sentence) => limitWords(sentence, 28)),
    10,
  );

  const slug = `bettingpros_${post.slug.replace(/-/g, '_')}`;
  return {
    schema: 'local_bettingpros_latest_nfl_article_v1',
    source: SOURCE,
    status: 'processed',
    post_id: post.id,
    title,
    author: extractAuthor(post),
    url: post.link,
    slug,
    teams,
    matchup: teams.join(' vs '),
    fetched_at: new Date().toISOString(),
    published_at: post.date_gmt ? `${post.date_gmt}Z` : post.date,
    picks,
    market_types: uniqueList(picks.map(classifyMarket), 5),
    context,
    evidence_snippets: evidenceSnippets,
    output_master_report: path.join('scratch', `${slug}_master_100percent_exhaustive.md`),
  };
}

async function writeOutputs(records) {
  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
  await fs.mkdir(path.dirname(MANIFEST_MD), { recursive: true });

  for (const record of records) {
    await fs.writeFile(record.output_master_report, buildMasterReport(record), 'utf8');
  }

  const payload = {
    schema: 'local_bettingpros_latest_nfl_ingest_v1',
    generated_at: new Date().toISOString(),
    run_date: RUN_DATE,
    status: 'research_intel_only_no_promotion',
    guardrails: {
      no_official_pick_mutation: true,
      no_bankroll_or_portfolio_mutation: true,
      no_odds_cache_mutation: true,
      no_supabase_writes: true,
      no_paid_api_calls: true,
      no_ai_model_calls: true,
    },
    source: SOURCE,
    feed_url: POSTS_URL,
    articles_processed: records.length,
    explicit_pick_articles: records.filter((record) => record.picks.length).length,
    explicit_picks_found: records.reduce((total, record) => total + record.picks.length, 0),
    records,
  };

  await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const manifest = [
    '# BettingPros Latest NFL Ingest - 2026-08-28',
    '',
    '> Status: local source-grounded candidate ingestion.',
    '> Guardrails: no official-pick mutation, no bankroll/portfolio mutation, no odds-cache mutation, no Supabase writes, no paid APIs, no AI/model calls.',
    '',
    '## Summary',
    '',
    `- Processed articles: ${payload.articles_processed}`,
    `- Articles with explicit picks: ${payload.explicit_pick_articles}`,
    `- Explicit picks found: ${payload.explicit_picks_found}`,
    `- Structured output: \`${OUTPUT_JSON}\``,
    '',
    '## Extracted Sources',
    '',
    markdownTableRow(['Published', 'Matchup', 'Author', 'Pick(s)', 'Master report']),
    markdownTableRow(['---', '---', '---', '---', '---']),
    ...records.map((record) => markdownTableRow([
      record.published_at,
      record.matchup,
      record.author,
      record.picks.join('; ') || 'manual review',
      `\`${record.output_master_report}\``,
    ])),
    '',
    '## Notes For Recommendation Synthesis',
    '',
    '- These entries are eligible as recommendation candidates only after human review against current placeable lines.',
    '- Prop/scoring markets need extra verification because availability and lines move quickly in preseason.',
    '- Any stale preseason pick after kickoff should be treated as historical/grading-only.',
    '',
  ].join('\n');

  await fs.writeFile(MANIFEST_MD, `${manifest}\n`, 'utf8');
  return payload;
}

const posts = await fetchPosts();
const nflPosts = posts
  .filter((post) => LATEST_VISIBLE_SLUGS.has(post.slug));

const records = nflPosts.map(toRecord);
const payload = await writeOutputs(records);

console.log(JSON.stringify({
  output_json: OUTPUT_JSON,
  manifest_md: MANIFEST_MD,
  articles_processed: payload.articles_processed,
  explicit_pick_articles: payload.explicit_pick_articles,
  explicit_picks_found: payload.explicit_picks_found,
  articles: payload.records.map((record) => ({
    title: record.title,
    author: record.author,
    published_at: record.published_at,
    picks: record.picks,
  })),
}, null, 2));
