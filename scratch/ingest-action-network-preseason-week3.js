import fs from 'node:fs/promises';
import path from 'node:path';

const RUN_DATE = '2026-08-28';
const SOURCE = 'Action Network';
const OUTPUT_JSON = path.join(
  'data',
  'research-intel',
  `action-network-preseason-week3-${RUN_DATE}.json`,
);
const MANIFEST_MD = path.join(
  'docs',
  'antigravity',
  `action-network-preseason-week3-ingest-${RUN_DATE}.md`,
);

const ARTICLES = [
  {
    slug: 'action_network_commanders_ravens_preseason_week3_aug28',
    teams: ['Washington Commanders', 'Baltimore Ravens'],
    url: 'https://www.actionnetwork.com/nfl/washington-commanders-vs-baltimore-ravens-prediction-pick-odds-for-nfl-preseason-week-3-august-28',
  },
  {
    slug: 'action_network_falcons_dolphins_preseason_week3_aug28',
    teams: ['Atlanta Falcons', 'Miami Dolphins'],
    url: 'https://www.actionnetwork.com/nfl/atlanta-falcons-vs-miami-dolphins-prediction-pick-odds-nfl-preseason-week-3-august-28',
  },
  {
    slug: 'action_network_texans_panthers_preseason_week3_aug28',
    teams: ['Houston Texans', 'Carolina Panthers'],
    url: 'https://www.actionnetwork.com/nfl/houston-texans-vs-carolina-panthers-prediction-pick-odds-nfl-preseason-week-3-august-28',
  },
  {
    slug: 'action_network_giants_jets_preseason_week3_aug28',
    teams: ['New York Giants', 'New York Jets'],
    url: 'https://www.actionnetwork.com/nfl/new-york-giants-vs-new-york-jets-prediction-pick-odds-nfl-preseason-week-3-august-28',
  },
  {
    slug: 'action_network_buccaneers_jaguars_preseason_week3_aug28',
    teams: ['Tampa Bay Buccaneers', 'Jacksonville Jaguars'],
    url: 'https://www.actionnetwork.com/nfl/tampa-bay-buccaneers-vs-jacksonville-jaguars-prediction-pick-odds-nfl-preseason-week-3-august-28',
  },
  {
    slug: 'action_network_cardinals_packers_preseason_week3_aug28',
    teams: ['Arizona Cardinals', 'Green Bay Packers'],
    url: 'https://www.actionnetwork.com/nfl/arizona-cardinals-vs-green-bay-packers-prediction-pick-odds-nfl-preseason-week-3-august-28',
  },
  {
    slug: 'action_network_saints_cowboys_preseason_week3_aug28',
    teams: ['New Orleans Saints', 'Dallas Cowboys'],
    url: 'https://www.actionnetwork.com/nfl/new-orleans-saints-vs-dallas-cowboys-prediction-pick-odds-nfl-preseason-week-3-august-28',
  },
  {
    slug: 'action_network_seahawks_chiefs_preseason_week3_aug28',
    teams: ['Seattle Seahawks', 'Kansas City Chiefs'],
    url: 'https://www.actionnetwork.com/nfl/seattle-seahawks-vs-kansas-city-chiefs-prediction-pick-odds-nfl-preseason-week-3-august-28',
  },
  {
    slug: 'action_network_bengals_eagles_preseason_week3_aug28',
    teams: ['Cincinnati Bengals', 'Philadelphia Eagles'],
    url: 'https://www.actionnetwork.com/nfl/cincinnati-bengals-vs-philadelphia-eagles-prediction-pick-odds-nfl-preseason-week-3-august-28',
  },
  {
    slug: 'action_network_vikings_broncos_preseason_week3_aug28',
    teams: ['Minnesota Vikings', 'Denver Broncos'],
    url: 'https://www.actionnetwork.com/nfl/minnesota-vikings-vs-denver-broncos-prediction-pick-odds-nfl-preseason-week-3-august-28',
  },
];

function decodeEntities(value = '') {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00a2/g, ' cents')
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '-')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, '. '),
  );
}

function parseJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => decodeEntities(match[1]))
    .map((block) => {
      try {
        return JSON.parse(block);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return blocks.flatMap((block) => (Array.isArray(block) ? block : [block]));
}

function findArticleSchema(schemas) {
  return schemas.find((schema) => {
    const type = Array.isArray(schema['@type']) ? schema['@type'] : [schema['@type']];
    return type.some((item) => ['Article', 'NewsArticle', 'BlogPosting'].includes(item));
  }) || {};
}

function extractNextArticle(html) {
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(marker);
  if (start < 0) return {};
  const bodyStart = start + marker.length;
  const end = html.indexOf('</script>', bodyStart);
  if (end < 0) return {};

  try {
    return JSON.parse(html.slice(bodyStart, end))?.props?.pageProps?.article || {};
  } catch {
    return {};
  }
}

function uniqueList(items, limit = 8) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const cleaned = item.replace(/\s+/g, ' ').trim();
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
    .filter((sentence) => sentence.length >= 40 && sentence.length <= 360);
}

function limitWords(text, maxWords = 24) {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? text : `${words.slice(0, maxWords).join(' ')}...`;
}

function extractPick(text) {
  const compact = text.replace(/\s+/g, ' ');
  const match = compact.match(
    /\b[A-Z][A-Za-z .]+ vs\.? [A-Z][A-Za-z .]+ pick:\s*([^*]{2,120}?)(?:\s+My\s+[A-Z]|\s+As always|\s+Make sure|\s+Pick:|\s+###|\s+\* \* \*|$)/i,
  );
  return match ? decodeEntities(match[1]).replace(/[.\s]+$/g, '').trim() : null;
}

function classifyMarket(pick) {
  if (!pick) return 'unknown';
  if (/\b(moneyline|win|cents?)\b|\d+%/i.test(pick)) return 'moneyline_or_prediction_market';
  if (/\b(over|under)\b/i.test(pick)) return 'total';
  if (/[+-]\d+(\.\d+)?/.test(pick)) return 'spread';
  return 'unknown';
}

function extractFirst(regex, text) {
  const match = text.match(regex);
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
}

function articleWindow(text, teams) {
  const compact = text.replace(/\s+/g, ' ');
  const aliases = teams.flatMap((team) => {
    const words = team.split(/\s+/);
    return [team, words[words.length - 1]];
  });
  const articleSentences = sentenceList(compact);
  const introIndex = articleSentences.findIndex((sentence) => (
    aliases.some((alias) => sentence.includes(alias))
    && aliases.slice(2).some((alias) => sentence.includes(alias))
    && /\b(will face off|will host|will meet|meet|square off|kickoff)\b/i.test(sentence)
  ));
  const startNeedle = introIndex >= 0 ? articleSentences[introIndex] : null;
  const start = startNeedle ? compact.indexOf(startNeedle) : 0;
  const aboutAuthor = compact.search(/\bAbout the Author\b/i);
  const end = aboutAuthor > start ? aboutAuthor : Math.min(compact.length, start + 6500);
  return compact.slice(start, end);
}

function markdownTableRow(values) {
  return `| ${values.map((value) => String(value || '').replace(/\|/g, '/')).join(' | ')} |`;
}

function buildMasterReport(record) {
  const lines = [
    `# ${record.title}`,
    '',
    `**Source:** ${record.source}`,
    `**Author:** ${record.author || 'unknown'}`,
    `**URL:** ${record.url}`,
    `**Published:** ${record.published_at || 'unknown'}`,
    `**Updated:** ${record.updated_at || 'unknown'}`,
    `**Fetched:** ${record.fetched_at}`,
    `**Status:** local_source_grounded_candidate_only`,
    '',
    '## Candidate Extraction',
    '',
    `- Matchup: ${record.matchup}`,
    `- Explicit pick: ${record.pick || 'not found'}`,
    `- Market type: ${record.market_type}`,
    `- Recommendation status: ${record.pick ? 'explicit_author_selection_needs_human_review' : 'needs_manual_review'}`,
    '',
    '## Schedule And Market Context',
    '',
    `- Kickoff context: ${record.kickoff || 'not found'}`,
    ...record.odds_context.map((item) => `- ${item}`),
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
    '- It was generated by deterministic public-page ingestion without paid APIs or AI/model calls.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

async function fetchArticle(article) {
  const response = await fetch(article.url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'Mozilla/5.0 NFL_Dashboard local source freshness check',
    },
  });
  const html = await response.text();
  const visibleText = stripHtml(html);
  const scopedText = articleWindow(visibleText, article.teams);
  const schemas = parseJsonLd(html);
  const schema = findArticleSchema(schemas);
  const nextArticle = extractNextArticle(html);

  const headline = schema.headline || nextArticle.title || extractFirst(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html);
  const authorValue = Array.isArray(schema.author) ? schema.author[0] : schema.author;
  const author = authorValue?.name || nextArticle.author?.name || nextArticle.author || null;
  const updated = schema.dateModified || nextArticle.updated_at || nextArticle.updatedAt || null;
  const published = schema.datePublished || nextArticle.published_at || nextArticle.publishedAt || null;
  const pick = extractPick(visibleText);
  const kickoff = extractFirst(/\b(Kickoff is set[\s\S]{0,220}?(?:ET|EDT)[\s\S]{0,120}?\.)/i, scopedText);
  const sentences = sentenceList(scopedText);
  const oddsContext = uniqueList(
    sentences.filter((sentence) => (
      /\b(favored|favorites?|underdogs?|spread|over\/under|moneyline|priced|cents?|total points)\b/i.test(sentence)
      && !/promo code|download app|about the author|odds comparison|action network app/i.test(sentence)
    )),
    4,
  );
  const evidenceSnippets = uniqueList(
    sentences
      .filter((sentence) => (
        /\b(quarterback|qb|starter|backup|rotation|preseason|offense|defense|market|public|sharp|coach|injur|rest|motivat|fade|cover|win|under|over)\b/i.test(sentence)
        && !/promo code|download app|about the author|commercial content|gambling problem|odds props futures|best prediction market/i.test(sentence)
      ))
      .map((sentence) => decodeEntities(limitWords(sentence, 24))),
    10,
  );

  return {
    schema: 'local_action_network_preseason_week3_article_v1',
    source: SOURCE,
    status: response.ok ? 'processed' : `http_${response.status}`,
    http_status: response.status,
    title: decodeEntities(headline || article.slug),
    author: typeof author === 'string' ? decodeEntities(author) : null,
    url: article.url,
    slug: article.slug,
    teams: article.teams,
    matchup: article.teams.join(' vs '),
    fetched_at: new Date().toISOString(),
    published_at: published,
    updated_at: updated,
    pick,
    market_type: classifyMarket(pick),
    kickoff,
    odds_context: oddsContext.map((item) => limitWords(item, 32)),
    evidence_snippets: evidenceSnippets,
    output_master_report: path.join('scratch', `${article.slug}_master_100percent_exhaustive.md`),
  };
}

async function writeOutputs(records) {
  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
  await fs.mkdir(path.dirname(MANIFEST_MD), { recursive: true });

  for (const record of records) {
    await fs.writeFile(record.output_master_report, buildMasterReport(record), 'utf8');
  }

  const payload = {
    schema: 'local_action_network_preseason_week3_ingest_v1',
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
    articles_requested: ARTICLES.length,
    articles_processed: records.filter((record) => record.status === 'processed').length,
    explicit_picks_found: records.filter((record) => Boolean(record.pick)).length,
    records,
  };

  await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const manifest = [
    '# Action Network Preseason Week 3 Ingest - 2026-08-28',
    '',
    '> Status: local source-grounded candidate ingestion.',
    '> Guardrails: no official-pick mutation, no bankroll/portfolio mutation, no odds-cache mutation, no Supabase writes, no paid APIs, no AI/model calls.',
    '',
    '## Summary',
    '',
    `- Requested articles: ${payload.articles_requested}`,
    `- Processed articles: ${payload.articles_processed}`,
    `- Explicit picks found: ${payload.explicit_picks_found}`,
    `- Structured output: \`${OUTPUT_JSON}\``,
    '',
    '## Extracted Sources',
    '',
    markdownTableRow(['Matchup', 'Author', 'Updated', 'Pick', 'Master report']),
    markdownTableRow(['---', '---', '---', '---', '---']),
    ...records.map((record) => markdownTableRow([
      record.matchup,
      record.author || 'unknown',
      record.updated_at || 'unknown',
      record.pick || 'manual review',
      `\`${record.output_master_report}\``,
    ])),
    '',
    '## Notes For Recommendation Synthesis',
    '',
    '- These entries are eligible as recommendation candidates only after human review against current placeable lines.',
    '- Prediction-market cents are retained as article context, not executable sportsbook odds.',
    '- Any stale preseason pick after kickoff should be treated as historical/grading-only.',
    '',
  ].join('\n');

  await fs.writeFile(MANIFEST_MD, `${manifest}\n`, 'utf8');
  return payload;
}

const records = [];
for (const article of ARTICLES) {
  try {
    records.push(await fetchArticle(article));
  } catch (error) {
    records.push({
      schema: 'local_action_network_preseason_week3_article_v1',
      source: SOURCE,
      status: 'fetch_or_parse_failed',
      error: error.message,
      title: article.slug,
      author: null,
      url: article.url,
      slug: article.slug,
      teams: article.teams,
      matchup: article.teams.join(' vs '),
      fetched_at: new Date().toISOString(),
      published_at: null,
      updated_at: null,
      pick: null,
      market_type: 'unknown',
      kickoff: null,
      odds_context: [],
      evidence_snippets: [],
      output_master_report: path.join('scratch', `${article.slug}_master_100percent_exhaustive.md`),
    });
  }
}

const payload = await writeOutputs(records);
console.log(JSON.stringify({
  output_json: OUTPUT_JSON,
  manifest_md: MANIFEST_MD,
  articles_requested: payload.articles_requested,
  articles_processed: payload.articles_processed,
  explicit_picks_found: payload.explicit_picks_found,
  failures: payload.records.filter((record) => record.status !== 'processed').map((record) => ({
    slug: record.slug,
    status: record.status,
    error: record.error,
  })),
}, null, 2));
