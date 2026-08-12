#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REVIEW_DIR = path.join(ROOT, 'data', 'research-intel', 'review');
const DOC_DIR = path.join(ROOT, 'docs', 'article-intel-review');
const LATEST_JSON = path.join(REVIEW_DIR, 'article-intel-review-latest.json');
const LATEST_MD = path.join(DOC_DIR, 'article-intel-review-latest.md');
const LATEST_HTML = path.join(DOC_DIR, 'article-intel-review-latest.html');

const DEFAULT_SINCE = '2026-07-30T04:48:03.331Z';
const DEFAULT_LIMIT = 0;
const DB_PAGE_SIZE = 1000;
const TEAM_ALIASES = {
  ARI: ['Arizona Cardinals', 'Cardinals'],
  ATL: ['Atlanta Falcons', 'Falcons'],
  BAL: ['Baltimore Ravens', 'Ravens'],
  BUF: ['Buffalo Bills', 'Bills'],
  CAR: ['Carolina Panthers', 'Panthers'],
  CHI: ['Chicago Bears', 'Bears'],
  CIN: ['Cincinnati Bengals', 'Bengals'],
  CLE: ['Cleveland Browns', 'Browns'],
  DAL: ['Dallas Cowboys', 'Cowboys'],
  DEN: ['Denver Broncos', 'Broncos'],
  DET: ['Detroit Lions', 'Lions'],
  GB: ['Green Bay Packers', 'Packers'],
  HOU: ['Houston Texans', 'Texans'],
  IND: ['Indianapolis Colts', 'Colts'],
  JAX: ['Jacksonville Jaguars', 'Jaguars'],
  KC: ['Kansas City Chiefs', 'Chiefs'],
  LAC: ['Los Angeles Chargers', 'Chargers'],
  LAR: ['Los Angeles Rams', 'Rams'],
  LV: ['Las Vegas Raiders', 'Raiders'],
  MIA: ['Miami Dolphins', 'Dolphins'],
  MIN: ['Minnesota Vikings', 'Vikings'],
  NE: ['New England Patriots', 'Patriots'],
  NO: ['New Orleans Saints', 'Saints'],
  NYG: ['New York Giants', 'Giants'],
  NYJ: ['New York Jets', 'Jets'],
  PHI: ['Philadelphia Eagles', 'Eagles'],
  PIT: ['Pittsburgh Steelers', 'Steelers'],
  SEA: ['Seattle Seahawks', 'Seahawks'],
  SF: ['San Francisco 49ers', '49ers', 'Niners'],
  TB: ['Tampa Bay Buccaneers', 'Buccaneers', 'Bucs'],
  TEN: ['Tennessee Titans', 'Titans'],
  WAS: ['Washington Commanders', 'Washington Redskins', 'Commanders', 'Redskins'],
};

const NOTE_TYPES = [
  ['injury_or_health', /\b(injur|hurt|pup|acl|achilles|hamstring|knee|ankle|pec|lcl|mcl|illness|carted off|return[s]? to practice|hold-in|holdout)\b/i],
  ['roster_or_depth_chart', /\b(depth chart|starter|starting qb|qb1|released|signed|extension|trade|waiver|cut|retired|farewell|not rejoining)\b/i],
  ['training_camp_intel', /\b(training camp|practice|camp|first practice|looked good|buzz|hold-in|holdout)\b/i],
  ['coaching_or_scheme', /\b(coach|coordinator|scheme|play call|offense|defense|system)\b/i],
  ['market_sentiment', /\b(odds|market|price|value|favorite|longshot|super bowl|division|playoffs|win total|prediction|best bet|pick|lean|over|under)\b/i],
  ['fantasy_relevance', /\b(fantasy|targets|carries|snap|touches|role|receiving|rushing|passing|touchdown)\b/i],
  ['schedule_context', /\b(schedule|opponent|road|home|stretch|week 1|opening|bye)\b/i],
];

const NON_NFL_TERMS = /\b(PGA|golf|basketball|TBT|tournament|Rocket Classic|La Familia|JHX Hoops|NBA|MLB|NHL|UFC|tennis|soccer)\b/i;
const NFL_TERMS = /\b(NFL|football|Super Bowl|AFC|NFC|quarterback|QB|rookie|training camp|playoffs?|win total|division|team|coach|roster|depth chart)\b/i;
const BOOK_PATTERN = /\b(BetMGM|DraftKings|FanDuel|Caesars|ESPN BET|Hard Rock|BetOnline|BetUS|BookMaker|BKR|Circa|Westgate|WynnBET|PointsBet|Fanatics)\b/i;
const AMERICAN_PRICE_PATTERN = /(?:^|[\s(])([+-]\d{3,5})(?=$|[\s),.;])/;
const NUMBER_LINE_PATTERN = /(?:^|[\s(])([+-]\d+(?:\.\d+)?)(?=$|[\s),.;])/;
const TOTAL_PATTERN = /\b(Over|Under)\s+(\d+(?:\.\d+)?)(?:\s+(wins?|points?|pts|yards?|receiving yards?|rushing yards?|passing yards?|touchdowns?|TDs?))?\b/i;
const PICK_ACTION_PATTERN = /\b(best bets?|pick:|prediction:|recommended bet|recommend(?:ed|s)?|I'm taking|I am taking|I(?:'|’)ll take|I like|we like|play:|bet:|wager|target|lean:|sprinkle|backing|fade)\b/i;
const PAGE_CHROME_PATTERN = /\b(skip to main content|top stories|follow us|newsletter|advertisement|related articles|more news|sign up|log in|subscribe|privacy policy)\b/i;
const PICK_ORIENTED_PATTERN = /\b(best bets?|picks?|predictions?|odds|props?|win totals?|wagers?|futures?)\b/i;
const STRICT_TEAM_MARKETS = new Set([
  'moneyline',
  'spread',
  'team_total',
  'win_total',
  'make_playoffs',
  'super_bowl_winner',
  'conference_winner',
  'division_winner',
]);

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function usage() {
  console.log(`Article Intel Review

Usage:
  node scripts/build-article-intel-review.js [--since ISO] [--limit N] [--local-only]

Builds local review-only article intel JSON/Markdown/HTML from research_intel_notes.
The default limit is 0 (page the complete date window). A positive --limit is an
explicit diagnostic cap. --local-only permits an intentionally partial local build.
No Supabase writes; no official picks; no recommendation promotion.`);
}

function clean(value = '') {
  return String(value || '')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/(?:&#8211;|&ndash;|\u2013|\u2014|\u00e2\u20ac[\u201c\u201d])/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

function esc(value = '') {
  return clean(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdCell(value = '') {
  return clean(value).replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

function snippet(text, needleRe = null, max = 260) {
  const source = clean(text);
  if (!source) return '';
  let idx = 0;
  if (needleRe) {
    const match = source.match(needleRe);
    if (match?.index != null) idx = Math.max(0, match.index - 90);
  }
  const out = source.slice(idx, idx + max).trim();
  return out.length < source.length - idx ? `${out}...` : out;
}

function sentenceSnippets(text, patterns, limit = 3) {
  const sentences = clean(text).split(/(?<=[.!?])\s+/).filter(Boolean);
  const hits = [];
  const seen = new Set();
  for (const sentence of sentences) {
    const key = sentence.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 120);
    if (seen.has(key)) continue;
    if (patterns.some((pattern) => pattern.test(sentence))) {
      hits.push(sentence.slice(0, 320));
      seen.add(key);
    }
    if (hits.length >= limit) break;
  }
  return hits;
}

function articleSentences(text, limit = 900) {
  return clean(text)
    .replace(/([:;])\s+(?=(?:Best Bet|Pick|Prediction|Lean|Play|Bet|Wager)\b)/gi, '$1\n')
    .split(/(?<=[.!?\n])\s+/)
    .map((sentence) => clean(sentence))
    .filter((sentence) => sentence.length >= 18 && sentence.length <= limit);
}

function isPageChromeSentence(sentence) {
  const text = clean(sentence);
  if (PAGE_CHROME_PATTERN.test(text)) return true;
  if (/\b\d+\s+min read\b/i.test(text)) return true;
  if (/^(?:NFL|NBA|MLB|NHL|NCAAF|NCAAB|WNBA)\s+odds\b/i.test(text)) return true;
  return false;
}

function hasMarketDetail(text) {
  if (/\bover\s+\d+(?:\.\d+)?\s+regular-season games\b/i.test(text)) return false;
  return TOTAL_PATTERN.test(text)
    || AMERICAN_PRICE_PATTERN.test(text)
    || /\b(?:moneyline|spread|total|team total|win total|to win|make the playoffs|miss the playoffs|division|conference|Super Bowl|MVP|rookie of the year|player of the year|coach of the year)\b/i.test(text)
    || /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+[+-]\d+(?:\.\d+)?\b/.test(text);
}

function reviewFlagsForPick(text, teams, details, extra = []) {
  return [
    ...extra,
    ...(teams.length ? [] : ['no_team_detected']),
    ...(teams.length > 5 ? ['broad_or_page_chrome_team_match'] : []),
    ...(details.price ? [] : ['missing_price']),
    ...(details.book ? [] : ['missing_book']),
    ...(details.line || ['moneyline', 'super_bowl_winner', 'division_winner', 'conference_winner', 'make_playoffs', 'award_or_player_future'].includes(details.market) ? [] : ['missing_line']),
    ...(details.selection ? [] : ['missing_selection']),
  ];
}

function bodyEvidenceStatus(row) {
  const bodyChars = clean(row?.body).length;
  if (bodyChars === 0) return 'metadata_only';
  if (bodyChars < 500) return 'thin_body';
  if (bodyChars >= 3990) return 'suspected_ingest_cap';
  return 'body_available';
}

function isExecutionUsablePick(details) {
  if (!details?.selection || !details?.market || !details?.price || !details?.book) return false;
  if (['moneyline', 'super_bowl_winner', 'division_winner', 'conference_winner', 'make_playoffs', 'award_or_player_future'].includes(details.market)) {
    return true;
  }
  return Boolean(details.line);
}

function executionEvidenceStatus(details) {
  return isExecutionUsablePick(details)
    ? 'execution_evidence_present'
    : 'needs_price_or_venue_verification';
}

function extractStructuredAnalystSelections(text) {
  const source = clean(text);
  const pattern = /([A-Z][A-Za-z'.-]+(?:\s+(?:[A-Z][A-Za-z'.-]+|Jr\.|Sr\.|II|III)){1,3})\s+-\s+(Over|Under)\s+(\d+(?:\.\d+)?)\s+((?:(?:Passing|Rushing|Receiving)\s+)?(?:Yards?|Touchdowns?|TDs?|Receptions?|Completions?|Attempts?|Interceptions?|Carries|Sacks?))(?:\s*\(([+-]\d{3,5})\)|\s+([+-]\d{3,5}))?(?:\s+(?:at|via)\s+(BetMGM|DraftKings|FanDuel|Caesars|ESPN BET|Hard Rock|BetOnline|BetUS|BookMaker|BKR|Circa|Westgate|WynnBET|PointsBet|Fanatics))?/g;
  const selections = [];
  for (const match of source.matchAll(pattern)) {
    const selection = clean(match[1])
      .replace(/^(?:(?:Best|Top|NFL|Player|Prop|Props|Pick|Picks|Bet|Bets)[\s.:]+)+/i, '')
      .trim();
    if (selection.split(/\s+/).length < 2) continue;
    const details = {
      market: 'player_prop_or_stat_future',
      selection,
      side: match[2].toLowerCase(),
      line: match[3],
      price: match[5] || match[6] || null,
      book: match[7] || null,
    };
    selections.push({
      details,
      quote: clean(match[0]),
    });
  }
  return selections;
}

function parseMarketDetails(text, fallbackTeams = []) {
  const source = clean(text);
  const total = /\bover\s+\d+(?:\.\d+)?\s+regular-season games\b/i.test(source) ? null : source.match(TOTAL_PATTERN);
  const price = source.match(AMERICAN_PRICE_PATTERN)?.[1] || null;
  const book = source.match(BOOK_PATTERN)?.[1] || null;
  const detail = {
    market: classifyMarket(source),
    selection: null,
    side: null,
    line: null,
    price,
    book,
  };

  if (total) {
    detail.side = total[1].toLowerCase();
    detail.line = total[2];
    if (/\bwins?\b/i.test(total[3] || source)) detail.market = 'win_total';
    else if (/\b(receiving|rushing|passing|yards?|touchdowns?|TDs?)\b/i.test(total[3] || source)) detail.market = 'player_prop_or_stat_future';
    else detail.market = /\bteam total\b/i.test(source) ? 'team_total' : 'game_total';
  }

  if (/\bmoneyline|ML\b/i.test(source)) detail.market = 'moneyline';
  if (/\bspread|against the spread|ATS\b/i.test(source)) detail.market = 'spread';
  if (/\bmake(?:s)? the playoffs\b/i.test(source)) detail.market = 'make_playoffs';
  if (/\bmiss(?:es)? the playoffs\b/i.test(source)) {
    detail.market = 'make_playoffs';
    detail.side = 'no';
  }
  if (/\bto win (?:the )?Super Bowl\b|\bSuper Bowl winner\b/i.test(source)) detail.market = 'super_bowl_winner';
  if (/\bto win (?:the )?(?:AFC|NFC)\b|\bconference winner\b/i.test(source)) detail.market = 'conference_winner';
  if (/\bto win (?:the )?(?:AFC|NFC)?\s*(?:East|North|South|West)\b|\bdivision winner\b/i.test(source)) detail.market = 'division_winner';

  if (!detail.line) {
    const line = source.match(/\b(?:wins?|spread|at|line of)?\s*([+-]?\d+(?:\.\d+)?)\s+(?:wins?|points?|pts|yards?)\b/i)?.[1]
      || source.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+([+-]\d+(?:\.\d+)?)\b/)?.[1]
      || null;
    if (line && !/^[+-]\d{3,5}$/.test(line)) detail.line = line;
  }

  const explicitSelection = source.match(/\b(?:Best Bet|Pick|Prediction|Play|Bet|Wager|Lean|Target|Taking|Like):?\s+(.+?)(?=\s+(?:at|with|for)\s+|[.;|]|$)/i)?.[1]
    || source.match(/\b(?:take|taking|like|play|bet|back|fade)\s+(.+?)(?=\s+(?:at|with|for)\s+|[.;|]|$)/i)?.[1]
    || null;
  detail.selection = explicitSelection
    ? clean(explicitSelection).replace(/\s*\(?[+-]\d{3,5}\)?$/, '').trim().slice(0, 120)
    : (fallbackTeams.length === 1 && STRICT_TEAM_MARKETS.has(detail.market) ? fallbackTeams[0] : null);

  return detail;
}

function extractAnalystSelections(article, teams, fullText) {
  if (article.flags.includes('likely_non_nfl_false_positive')) return [];
  const sourceText = `${article.title}. ${article.summary}. ${fullText}`;
  const sentenceCandidates = articleSentences(sourceText)
    .filter((sentence) => PICK_ACTION_PATTERN.test(sentence) || /\b(?:pick|play|bet|lean|target):/i.test(sentence))
    .filter((sentence) => hasMarketDetail(sentence))
    .filter((sentence) => !isPageChromeSentence(sentence))
    .filter((sentence) => !/\b(draft pick|first-round pick|scouting report pick change|pick-six|picked off)\b/i.test(sentence))
    .map((quote) => ({ quote, details: null }));
  const candidates = [
    ...extractStructuredAnalystSelections(sourceText).map((candidate) => ({ ...candidate, structured: true })),
    ...sentenceCandidates,
  ];
  const out = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const sentence = candidate.quote;
    const quoteTeams = mentionedTeams(sentence, article.title);
    const targetTeams = quoteTeams.length ? quoteTeams : teams;
    const details = candidate.details || parseMarketDetails(sentence, targetTeams);
    if (!details.selection) continue;
    if (/^(?:on\s+)?teams?\s+to\b/i.test(details.selection) || /\bgamblers wager on teams\b/i.test(sentence)) continue;
    const key = clean(`${details.market}|${details.selection}|${details.side}|${details.line}|${details.price}|${details.book}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const missingCore = !details.selection
      || (!details.line && !details.price)
      || (details.market === 'make_playoffs' && !details.price && !/^(yes|no)$/i.test(details.side || ''));
    if (missingCore) continue;
    const evidenceStatus = executionEvidenceStatus(details);
    out.push({
      item_id: `article_analyst_selection__${article.id}__${out.length + 1}`,
      item_type: 'analyst_selection',
      lane: evidenceStatus === 'execution_evidence_present' ? 'actual_pick' : 'analyst_selection_needs_execution',
      teams: targetTeams,
      market: details.market,
      selection: details.selection,
      side: details.side || inferLean(sentence),
      line: details.line,
      price: details.price,
      book: details.book,
      evidence_status: evidenceStatus,
      confidence: evidenceStatus === 'execution_evidence_present' ? 'candidate' : 'needs_execution_verification',
      quote: sentence,
      rationale: snippet(`${article.summary} ${fullText}`, new RegExp(sentence.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), 360),
      review_flags: reviewFlagsForPick(sentence, targetTeams, details, [
        ...(missingCore ? ['low_confidence'] : []),
        ...(candidate.structured ? ['structured_multi_pick_extract'] : []),
        ...(evidenceStatus === 'execution_evidence_present' ? [] : ['not_execution_usable']),
      ]),
      source: article.source_meta,
    });
  }
  return out.slice(0, 24);
}

function focusedBody(row) {
  let body = clean(row.body || '');
  const title = clean(row.title || '').replace(/\s+-\s+ESPN$/i, '');
  if (!body) return clean(`${row.title}. ${row.summary}`);

  const titleIndex = title ? body.toLowerCase().indexOf(title.toLowerCase()) : -1;
  if (titleIndex >= 0) body = body.slice(titleIndex);

  const source = String(row.source || '').toLowerCase();
  if (source.includes('espn')) {
    const bylineMatch = body.match(/\b(?:ESPN|NFL Nation|[A-Z][a-z]+ [A-Z][a-z]+)\b(?:\s+Fantasy)?\s+(?:Fantasy\s+)?(?:Jul\s+\d+,\s+2026|[0-9]+h)\b/i);
    if (bylineMatch?.index != null && bylineMatch.index > 80) body = body.slice(0, bylineMatch.index + bylineMatch[0].length);
    body = body.replace(/\bSkip to main content\b[\s\S]{0,1200}?(?=\b[A-Z][a-z]+ [A-Z][a-z]+|\bNew Orleans Saints\b|\bSan Francisco 49ers\b|\bBuffalo Bills\b|\bDallas Cowboys\b)/i, ' ');
  }

  for (const marker of [
    'Top Stories',
    'Follow Us',
    'Betting Online',
    'More News',
    'Latest news, buzz from training camps',
    'Check out the latest news below',
  ]) {
    const idx = body.indexOf(marker);
    if (idx > 300) body = body.slice(0, idx);
  }

  return clean(`${row.title}. ${row.summary}. ${body}`);
}

function mentionedTeams(text, title = '') {
  const haystack = ` ${clean(text).toLowerCase()} `;
  const teams = [];
  for (const [abbr, aliases] of Object.entries(TEAM_ALIASES)) {
    if (aliases.some((alias) => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(haystack))) {
      teams.push(abbr);
    }
  }
  if (teams.length > 5 && title) {
    const titleTeams = mentionedTeams(title);
    if (titleTeams.length) return titleTeams;
  }
  return teams;
}

function articleQualityFlags(article, teams, fullText) {
  const flags = [];
  const title = clean(article.title);
  const combined = clean(`${article.title} ${article.summary} ${fullText}`);
  if (!NFL_TERMS.test(combined)) flags.push('weak_nfl_relevance');
  if (NON_NFL_TERMS.test(title) && !/\bNFL\b/i.test(title)) flags.push('likely_non_nfl_false_positive');
  if (!article.body || clean(article.body).length < 500) flags.push('thin_body');
  if (teams.length === 0) flags.push('no_team_detected');
  if (clean(article.body).length >= 3990) flags.push('body_truncated_4000_chars');
  if (teams.length > 8) flags.push('multi_team_page_chrome_risk');
  return flags;
}

function noteTypes(text) {
  const out = [];
  for (const [type, pattern] of NOTE_TYPES) {
    if (pattern.test(text)) out.push(type);
  }
  return out.length ? out : ['team_evaluation'];
}

function classifyMarket(text) {
  if (/\bsuper bowl era\b|\bplayoff (?:game|loss)\b|\bdraft pick\b|\bfirst-round pick\b|\bscouting report pick change\b/i.test(text)) return 'market_context';
  if (/\bsuper bowl\b/i.test(text)) return 'super_bowl_winner';
  if (/\bdivision\b/i.test(text)) return 'division_winner';
  if (/\bconference\b|\bAFC\b|\bNFC\b/i.test(text)) return 'conference_winner';
  if (/\bmake(?:s)? the playoffs\b|\bplayoff/i.test(text)) return 'make_playoffs';
  if (/\bwin total|regular season wins|over \d+(?:\.\d+)? wins|under \d+(?:\.\d+)? wins/i.test(text)) return 'win_total';
  if (/\bMVP|player of the year|rookie of the year|coach of the year/i.test(text)) return 'award_or_player_future';
  if (/\bfantasy|targets|carries|touches|receiving|rushing|passing|touchdown/i.test(text)) return 'fantasy_inference';
  return 'market_context';
}

function inferLean(text) {
  if (/\b(over|back|buy|bullish|upgrade|positive|favorite|best bet|like|love)\b/i.test(text)) return 'positive_or_over';
  if (/\b(under|fade|bearish|downgrade|negative|concern|miss|avoid)\b/i.test(text)) return 'negative_or_under';
  return 'context';
}

function extractPickLeads(article, teams, fullText) {
  const title = clean(article.title);
  if (article.flags.includes('likely_non_nfl_false_positive')) return [];
  if (!/(bet|prediction|odds|market|value|win total|super bowl|division|conference|playoff|fantasy|projection|favorite|longshot|wager|record)/i.test(`${title} ${article.summary} ${fullText}`)) {
    return [];
  }
  const patterns = [
    /\b(best bet|wager|gamblers wager|prediction|lean|value|odds|market|favorite|longshot|to win (?:the )?(?:super bowl|division|conference)|make the playoffs|miss the playoffs|over \d+(?:\.\d+)? wins|under \d+(?:\.\d+)? wins)\b/i,
    /\b(Super Bowl LXI Prediction|win total|playoff seeding|project(?:ed|ion)|finish(?:es)? \d+-\d+|record (?:of )?\d+-\d+|MVP|rookie of the year|coach of the year)\b/i,
  ];
  const snippets = sentenceSnippets(`${title}. ${article.summary}. ${fullText}`, patterns, 3)
    .filter((quote) => !/skip to main content|follow us|betting online|top stories|super bowl era|draft pick|first-round pick|scouting report pick change|playoff loss|playoff game/i.test(quote));
  return snippets.map((quote, idx) => {
    const quoteTeams = mentionedTeams(quote, title);
    const targetTeams = quoteTeams.length ? quoteTeams : teams;
    return {
      item_id: `article_pick__${article.id}__${idx + 1}`,
      item_type: 'pick_lead',
      lane: classifyMarket(quote),
      teams: targetTeams,
      team_or_market: targetTeams.join(', ') || title,
      market: classifyMarket(quote),
      lean: inferLean(quote),
      confidence: article.source_type === 'betting' ? 0.62 : 0.52,
      quote,
      rationale: snippet(`${article.summary} ${fullText}`, new RegExp(quote.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), 360),
      review_flags: [
        ...(targetTeams.length ? [] : ['no_team_detected']),
        ...(targetTeams.length > 5 ? ['broad_or_page_chrome_team_match'] : []),
        ...(idx > 2 ? ['lower_priority_extra_match'] : []),
      ],
      source: article.source_meta,
    };
  });
}

function extractAnalysisNotes(article, teams, fullText) {
  if (article.flags.includes('likely_non_nfl_false_positive')) return [];
  const types = noteTypes(`${article.title} ${article.summary} ${fullText}`);
  return types.slice(0, 5).map((type) => {
    const pattern = NOTE_TYPES.find(([candidate]) => candidate === type)?.[1] || NFL_TERMS;
    const quote = sentenceSnippets(`${article.summary}. ${fullText}`, [pattern], 1)[0] || snippet(`${article.summary} ${fullText}`, pattern, 260);
    return {
      item_id: `article_note__${article.id}__${type}`,
      item_type: 'analysis_note',
      relevance_tags: [type],
      note_type: type,
      teams,
      players: [],
      topic: clean(article.title).slice(0, 120),
      summary: snippet(`${article.summary} ${fullText}`, pattern, 320),
      quote,
      confidence: article.source_type === 'news' ? 'reported' : 'contextual',
      review_flags: [
        ...(teams.length ? [] : ['no_team_detected']),
        ...(teams.length > 5 ? ['broad_or_page_chrome_team_match'] : []),
        ...(quote ? [] : ['missing_quote']),
      ],
      source: article.source_meta,
    };
  });
}

function normalizedLimit(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

async function loadArticles(since, limit = DEFAULT_LIMIT, { localOnly = false, client = null } = {}) {
  const localDir = path.join(ROOT, 'data', 'research-intel', 'local');
  let localRows = [];
  if (fs.existsSync(localDir)) {
    const files = fs.readdirSync(localDir).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(localDir, f), 'utf8'));
        if (content && content.id && content.source) {
          localRows.push(content);
        }
      } catch (_err) {
        // ignore
      }
    }
  }
  localRows = localRows.filter((row) => {
    const timestamp = row.captured_at || row.published_at;
    return !timestamp || String(timestamp) >= String(since);
  });

  let dbRows = [];
  const requestedLimit = normalizedLimit(limit);
  const collection = {
    since,
    requested_limit: requestedLimit,
    local_only: localOnly,
    local_files_scanned: localRows.length,
    database_status: localOnly ? 'skipped_local_only' : 'not_started',
    database_pages: 0,
    database_rows: 0,
    database_cap_reached: false,
    complete_for_since_window: false,
  };

  if (!localOnly) {
    if (!client && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      throw new Error('Supabase credentials are not configured. Use --local-only only for an explicitly partial diagnostic build.');
    }
    const sb = client || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    let offset = 0;
    let reachedEnd = false;
    while (!reachedEnd && (!requestedLimit || dbRows.length < requestedLimit)) {
      const remaining = requestedLimit ? requestedLimit - dbRows.length : DB_PAGE_SIZE;
      const pageSize = Math.min(DB_PAGE_SIZE, remaining);
      const { data, error } = await sb
        .from('research_intel_notes')
        .select('id,source,source_type,title,summary,body,url,published_at,captured_at,author,confidence')
        .gte('captured_at', since)
        .order('published_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error(`research_intel_notes query failed: ${error.message || error}`);
      const page = Array.isArray(data) ? data : [];
      dbRows.push(...page);
      collection.database_pages += 1;
      offset += page.length;
      if (page.length < pageSize) reachedEnd = true;
      if (page.length === 0) reachedEnd = true;
    }
    collection.database_rows = dbRows.length;
    collection.database_cap_reached = Boolean(requestedLimit && !reachedEnd && dbRows.length >= requestedLimit);
    collection.database_status = collection.database_cap_reached ? 'explicit_cap_reached' : 'complete';
    collection.complete_for_since_window = !collection.database_cap_reached;
  }

  const combined = [...localRows, ...dbRows];
  const seen = new Set();
  const deduped = [];
  for (const row of combined) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      deduped.push(row);
    }
  }
  collection.deduped_records = deduped.length;
  return { rows: deduped, collection };
}

function renderMarkdown(report) {
  const lines = [
    '# Article Intel Review',
    '',
    `Generated: ${report.generated_at}`,
    '',
    '> Local evidence assessment only. Record count is not review coverage. Article-derived selections and notes remain research context until human-reviewed and explicitly promoted.',
    '',
    '## Summary',
    '',
    `- Article records assessed: ${report.summary.article_records_assessed}`,
    `- Complete requested date window: ${report.collection.complete_for_since_window === true ? 'yes' : 'no'}`,
    `- Body evidence — available: ${report.summary.body_evidence.body_available}; suspected ingest cap: ${report.summary.body_evidence.suspected_ingest_cap}; metadata only: ${report.summary.body_evidence.metadata_only}; thin: ${report.summary.body_evidence.thin_body}`,
    `- Pick-oriented records: ${report.summary.pick_oriented_records}`,
    `- Unresolved pick-oriented records: ${report.summary.unresolved_pick_oriented_records}`,
    `- Likely non-NFL false positives: ${report.summary.likely_non_nfl_false_positives}`,
    `- Explicit analyst selection mentions: ${report.summary.explicit_analyst_selection_mentions}`,
    `- Unique explicit analyst selections: ${report.summary.unique_explicit_analyst_selections}`,
    `- Selections needing price or venue verification: ${report.summary.selections_needing_execution_verification}`,
    `- Execution-usable actual pick candidates: ${report.summary.actual_picks}`,
    `- Market/inference leads extracted: ${report.summary.market_leads}`,
    `- Analysis notes extracted: ${report.summary.analysis_notes}`,
    `- Articles with fetched bodies: ${report.summary.articles_with_body}`,
    '',
    '## Source Counts',
    '',
    '| Source | Records | Explicit Selections | Execution-Usable Picks | Market Leads | Notes |',
    '|---|---:|---:|---:|---:|---:|',
    ...report.sources.map((row) => `| ${mdCell(row.source)} | ${row.articles} | ${row.explicit_analyst_selections} | ${row.actual_picks} | ${row.market_leads} | ${row.analysis_notes} |`),
    '',
    '## Article Coverage',
    '',
    '| Source | Article | Body Evidence | Pick Review | Teams | Flags | Explicit Selections | Actual Picks | Leads | Notes |',
    '|---|---|---|---|---|---|---:|---:|---:|---:|',
    ...report.articles.map((article) => `| ${mdCell(article.source)} | [${mdCell(article.title)}](${article.url}) | ${article.body_evidence_status} | ${article.pick_review_status} | ${article.teams.join(', ')} | ${article.flags.join(', ')} | ${article.explicit_analyst_selection_count} | ${article.actual_pick_count} | ${article.market_lead_count} | ${article.analysis_note_count} |`),
    '',
    '## Explicit Analyst Selections',
    '',
    report.analyst_selections.length
      ? '| Selection | Market | Side | Line | Price | Book | Evidence Status | Source | Flags | Quote |'
      : '_No explicit analyst selections extracted._',
    ...(report.analyst_selections.length ? [
      '|---|---|---|---|---|---|---|---|---|---|',
      ...report.analyst_selections.map((item) => `| ${mdCell(item.selection)} | ${item.market} | ${mdCell(item.side)} | ${mdCell(item.line)} | ${mdCell(item.price)} | ${mdCell(item.book)} | ${item.evidence_status} | [${mdCell(item.source.title)}](${item.source.url}) | ${item.review_flags.join(', ')} | ${mdCell(item.quote)} |`),
    ] : []),
    '',
    '## Execution-Usable Actual Pick Candidates',
    '',
    report.actual_picks.length
      ? '| Teams | Market | Selection | Side | Line | Price | Book | Source | Flags | Quote |'
      : '_No actual pick candidates extracted._',
    ...(report.actual_picks.length ? [
      '|---|---|---|---|---|---|---|---|---|---|',
      ...report.actual_picks.map((item) => `| ${item.teams.join(', ')} | ${item.market} | ${mdCell(item.selection)} | ${mdCell(item.side)} | ${mdCell(item.line)} | ${mdCell(item.price)} | ${mdCell(item.book)} | [${mdCell(item.source.title)}](${item.source.url}) | ${item.review_flags.join(', ')} | ${mdCell(item.quote)} |`),
    ] : []),
    '',
    '## Market And Inference Leads',
    '',
    report.market_leads.length
      ? '| Lane | Teams | Market | Lean | Source | Flags | Quote | Rationale |'
      : '_No market leads extracted._',
    ...(report.market_leads.length ? [
      '|---|---|---|---|---|---|---|---|',
      ...report.market_leads.map((item) => `| ${item.lane} | ${item.teams.join(', ')} | ${item.market} | ${item.lean} | [${mdCell(item.source.title)}](${item.source.url}) | ${item.review_flags.join(', ')} | ${mdCell(item.quote)} | ${mdCell(item.rationale)} |`),
    ] : []),
    '',
    '## Analysis Notes',
    '',
    report.analysis_notes.length
      ? '| Tags | Teams | Source | Confidence | Flags | Summary | Quote |'
      : '_No analysis notes extracted._',
    ...(report.analysis_notes.length ? [
      '|---|---|---|---|---|---|---|',
      ...report.analysis_notes.map((item) => `| ${item.relevance_tags.join(', ')} | ${item.teams.join(', ')} | [${mdCell(item.source.title)}](${item.source.url}) | ${item.confidence} | ${item.review_flags.join(', ')} | ${mdCell(item.summary)} | ${mdCell(item.quote)} |`),
    ] : []),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function renderHtml(report, mdPath) {
  const sourceRows = report.sources.map((row) => `<tr><td>${esc(row.source)}</td><td>${row.articles}</td><td>${row.explicit_analyst_selections}</td><td>${row.actual_picks}</td><td>${row.market_leads}</td><td>${row.analysis_notes}</td></tr>`).join('');
  const articleRows = report.articles.map((article) => `<tr><td>${esc(article.source)}</td><td><a href="${esc(article.url)}">${esc(article.title)}</a></td><td>${esc(article.body_evidence_status)}</td><td>${esc(article.pick_review_status)}</td><td>${esc(article.teams.join(', '))}</td><td>${esc(article.flags.join(', '))}</td><td>${article.explicit_analyst_selection_count}</td><td>${article.actual_pick_count}</td><td>${article.market_lead_count}</td><td>${article.analysis_note_count}</td></tr>`).join('');
  const analystSelectionRows = report.analyst_selections.map((item) => `<tr><td>${esc(item.selection)}</td><td>${esc(item.market)}</td><td>${esc(item.side)}</td><td>${esc(item.line)}</td><td>${esc(item.price)}</td><td>${esc(item.book)}</td><td>${esc(item.evidence_status)}</td><td><a href="${esc(item.source.url)}">${esc(item.source.title)}</a></td><td>${esc(item.review_flags.join(', '))}</td><td>${esc(item.quote)}</td></tr>`).join('');
  const actualPickRows = report.actual_picks.map((item) => `<tr><td>${esc(item.teams.join(', '))}</td><td>${esc(item.market)}</td><td>${esc(item.selection)}</td><td>${esc(item.side)}</td><td>${esc(item.line)}</td><td>${esc(item.price)}</td><td>${esc(item.book)}</td><td><a href="${esc(item.source.url)}">${esc(item.source.title)}</a></td><td>${esc(item.review_flags.join(', '))}</td><td>${esc(item.quote)}</td></tr>`).join('');
  const marketRows = report.market_leads.map((item) => `<tr><td>${esc(item.lane)}</td><td>${esc(item.teams.join(', '))}</td><td>${esc(item.market)}</td><td>${esc(item.lean)}</td><td><a href="${esc(item.source.url)}">${esc(item.source.title)}</a></td><td>${esc(item.review_flags.join(', '))}</td><td>${esc(item.quote)}</td><td>${esc(item.rationale)}</td></tr>`).join('');
  const noteRows = report.analysis_notes.map((item) => `<tr><td>${esc(item.relevance_tags.join(', '))}</td><td>${esc(item.teams.join(', '))}</td><td><a href="${esc(item.source.url)}">${esc(item.source.title)}</a></td><td>${esc(item.confidence)}</td><td>${esc(item.review_flags.join(', '))}</td><td>${esc(item.summary)}</td><td>${esc(item.quote)}</td></tr>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Article Intel Review</title>
<style>
body{font-family:Inter,Segoe UI,Arial,sans-serif;margin:28px auto;max-width:1180px;padding:0 18px;color:#172033;line-height:1.45}
a{color:#2455a6} table{width:100%;border-collapse:collapse;margin:14px 0 28px} th,td{border:1px solid #d8dee8;padding:7px 9px;text-align:left;vertical-align:top;font-size:13px} th{background:#f3f6fb}.cards{display:flex;gap:14px;flex-wrap:wrap}.card{border:1px solid #d8dee8;border-radius:8px;padding:12px 14px;min-width:180px}.card b{display:block;font-size:22px}.muted{color:#667085}
</style>
</head>
<body>
<h1>Article Intel Review</h1>
<p class="muted">Generated ${esc(report.generated_at)}. Local evidence assessment only; record count is not review coverage. No official picks or recommendation promotion.</p>
<p><a href="${esc(path.relative(DOC_DIR, mdPath).replace(/\\/g, '/'))}">Markdown copy</a></p>
<div class="cards">
<div class="card"><b>${report.summary.article_records_assessed}</b>Records assessed</div>
<div class="card"><b>${report.summary.body_evidence.body_available}</b>Bodies available</div>
<div class="card"><b>${report.summary.body_evidence.suspected_ingest_cap}</b>Suspected body cap</div>
<div class="card"><b>${report.summary.unresolved_pick_oriented_records}</b>Unresolved pick-oriented</div>
<div class="card"><b>${report.summary.explicit_analyst_selection_mentions}</b>Explicit selection mentions</div>
<div class="card"><b>${report.summary.unique_explicit_analyst_selections}</b>Unique selections</div>
<div class="card"><b>${report.summary.actual_picks}</b>Execution-usable picks</div>
<div class="card"><b>${report.summary.market_leads}</b>Market/inference leads</div>
<div class="card"><b>${report.summary.analysis_notes}</b>Analysis notes</div>
<div class="card"><b>${report.summary.likely_non_nfl_false_positives}</b>Likely false positives</div>
</div>
<h2>Source Counts</h2><table><thead><tr><th>Source</th><th>Records</th><th>Explicit Selections</th><th>Execution-Usable Picks</th><th>Market Leads</th><th>Notes</th></tr></thead><tbody>${sourceRows}</tbody></table>
<h2>Article Coverage</h2><table><thead><tr><th>Source</th><th>Article</th><th>Body Evidence</th><th>Pick Review</th><th>Teams</th><th>Flags</th><th>Explicit Selections</th><th>Actual Picks</th><th>Leads</th><th>Notes</th></tr></thead><tbody>${articleRows}</tbody></table>
<h2>Explicit Analyst Selections</h2><table><thead><tr><th>Selection</th><th>Market</th><th>Side</th><th>Line</th><th>Price</th><th>Book</th><th>Evidence Status</th><th>Source</th><th>Flags</th><th>Quote</th></tr></thead><tbody>${analystSelectionRows || '<tr><td colspan="10">None extracted.</td></tr>'}</tbody></table>
<h2>Execution-Usable Actual Pick Candidates</h2><table><thead><tr><th>Teams</th><th>Market</th><th>Selection</th><th>Side</th><th>Line</th><th>Price</th><th>Book</th><th>Source</th><th>Flags</th><th>Quote</th></tr></thead><tbody>${actualPickRows || '<tr><td colspan="10">None extracted.</td></tr>'}</tbody></table>
<h2>Market And Inference Leads</h2><table><thead><tr><th>Lane</th><th>Teams</th><th>Market</th><th>Lean</th><th>Source</th><th>Flags</th><th>Quote</th><th>Rationale</th></tr></thead><tbody>${marketRows || '<tr><td colspan="8">None extracted.</td></tr>'}</tbody></table>
<h2>Analysis Notes</h2><table><thead><tr><th>Tags</th><th>Teams</th><th>Source</th><th>Confidence</th><th>Flags</th><th>Summary</th><th>Quote</th></tr></thead><tbody>${noteRows || '<tr><td colspan="7">None extracted.</td></tr>'}</tbody></table>
</body>
</html>
`;
}

function buildReport(rows, since, collection = {}) {
  const articles = [];
  const analystSelections = [];
  const actualPicks = [];
  const marketLeads = [];
  const analysisNotes = [];
  for (const row of rows) {
    const fullText = focusedBody(row);
    const teams = mentionedTeams(fullText, row.title);
    const sourceMeta = {
      note_id: row.id,
      source: row.source,
      source_type: row.source_type,
      title: clean(row.title),
      url: row.url,
      published_at: row.published_at,
      captured_at: row.captured_at,
      author: row.author,
    };
    const article = {
      id: row.id,
      source: row.source,
      source_type: row.source_type,
      title: clean(row.title),
      url: row.url,
      published_at: row.published_at,
      captured_at: row.captured_at,
      author: row.author,
      body_chars: clean(row.body).length,
      body_evidence_status: bodyEvidenceStatus(row),
      focused_text_chars: fullText.length,
      summary: clean(row.summary),
      teams,
      pick_oriented: PICK_ORIENTED_PATTERN.test(row.title || ''),
      source_meta: sourceMeta,
      flags: [],
    };
    article.flags = articleQualityFlags(row, teams, fullText);
    const selections = extractAnalystSelections(article, teams, fullText);
    const picks = selections
      .filter((item) => item.evidence_status === 'execution_evidence_present')
      .map((item, index) => ({
        ...item,
        item_id: `article_actual_pick__${article.id}__${index + 1}`,
        item_type: 'actual_pick',
        lane: 'actual_pick',
      }));
    const leads = extractPickLeads(article, teams, fullText).map((lead) => ({
      ...lead,
      item_type: 'market_lead',
      review_flags: [...new Set([...(lead.review_flags || []), 'inference_only'])],
    }));
    const notes = extractAnalysisNotes(article, teams, fullText);
    article.explicit_analyst_selection_count = selections.length;
    article.actual_pick_count = picks.length;
    article.market_lead_count = leads.length;
    article.pick_lead_count = leads.length;
    article.analysis_note_count = notes.length;
    if (!article.pick_oriented) article.pick_review_status = 'not_pick_oriented';
    else if (article.body_evidence_status !== 'body_available') article.pick_review_status = 'unresolved_body_evidence';
    else if (selections.length === 0) article.pick_review_status = 'unresolved_no_selection_extracted';
    else article.pick_review_status = 'explicit_selection_extracted';
    articles.push(article);
    analystSelections.push(...selections);
    actualPicks.push(...picks);
    marketLeads.push(...leads);
    analysisNotes.push(...notes);
  }

  const sourceMap = new Map();
  for (const article of articles) {
    if (!sourceMap.has(article.source)) sourceMap.set(article.source, {
      source: article.source,
      articles: 0,
      explicit_analyst_selections: 0,
      actual_picks: 0,
      market_leads: 0,
      pick_leads: 0,
      analysis_notes: 0,
    });
    const row = sourceMap.get(article.source);
    row.articles += 1;
    row.explicit_analyst_selections += article.explicit_analyst_selection_count;
    row.actual_picks += article.actual_pick_count;
    row.market_leads += article.market_lead_count;
    row.pick_leads += article.market_lead_count;
    row.analysis_notes += article.analysis_note_count;
  }

  const uniqueSelectionKeys = new Set(analystSelections.map((item) => clean([
    item.market,
    item.selection,
    item.side,
    item.line,
  ].join('|')).toLowerCase()));
  const bodyEvidence = Object.fromEntries([
    'metadata_only',
    'thin_body',
    'suspected_ingest_cap',
    'body_available',
  ].map((status) => [status, articles.filter((article) => article.body_evidence_status === status).length]));
  const unresolvedPickOriented = articles.filter((article) => article.pick_review_status.startsWith('unresolved_'));

  return {
    generated_at: new Date().toISOString(),
    schema_version: 2,
    status: 'local_article_evidence_assessment_only',
    guardrail: 'Article-derived leads require human review before promotion. This artifact does not write Supabase signals or create betting recommendations.',
    since,
    collection,
    summary: {
      article_records_assessed: articles.length,
      articles_with_body: articles.filter((article) => article.body_chars > 0).length,
      body_evidence: bodyEvidence,
      pick_oriented_records: articles.filter((article) => article.pick_oriented).length,
      unresolved_pick_oriented_records: unresolvedPickOriented.length,
      likely_non_nfl_false_positives: articles.filter((article) => article.flags.includes('likely_non_nfl_false_positive')).length,
      explicit_analyst_selection_mentions: analystSelections.length,
      unique_explicit_analyst_selections: uniqueSelectionKeys.size,
      selections_needing_execution_verification: analystSelections.length - actualPicks.length,
      actual_picks: actualPicks.length,
      market_leads: marketLeads.length,
      pick_leads: marketLeads.length,
      analysis_notes: analysisNotes.length,
    },
    sources: [...sourceMap.values()].sort((a, b) => a.source.localeCompare(b.source)),
    articles: articles.sort((a, b) => String(a.source).localeCompare(String(b.source)) || String(b.published_at).localeCompare(String(a.published_at))),
    analyst_selections: analystSelections,
    actual_picks: actualPicks,
    market_leads: marketLeads,
    pick_leads: marketLeads,
    analysis_notes: analysisNotes,
  };
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage();
    return;
  }
  const since = arg('--since', DEFAULT_SINCE);
  const limit = Number(arg('--limit', String(DEFAULT_LIMIT)));
  const localOnly = hasFlag('--local-only');
  const loaded = await loadArticles(since, limit, { localOnly });
  const report = buildReport(loaded.rows, since, loaded.collection);

  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  fs.mkdirSync(DOC_DIR, { recursive: true });
  fs.writeFileSync(LATEST_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(LATEST_MD, renderMarkdown(report), 'utf8');
  fs.writeFileSync(LATEST_HTML, renderHtml(report, LATEST_MD), 'utf8');

  console.log(`Wrote article intel review JSON: ${path.relative(ROOT, LATEST_JSON)}`);
  console.log(`Wrote article intel review Markdown: ${path.relative(ROOT, LATEST_MD)}`);
  console.log(`Wrote article intel review HTML: ${path.relative(ROOT, LATEST_HTML)}`);
  console.log(`Article evidence summary: records=${report.summary.article_records_assessed} explicit_selections=${report.summary.explicit_analyst_selection_mentions} unique_selections=${report.summary.unique_explicit_analyst_selections} actual_picks=${report.summary.actual_picks} unresolved_pick_oriented=${report.summary.unresolved_pick_oriented_records}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  main().catch((err) => {
    console.error(`Article intel review failed: ${err.message}`);
    process.exit(1);
  });
}

export {
  bodyEvidenceStatus,
  buildReport,
  executionEvidenceStatus,
  extractAnalystSelections,
  extractStructuredAnalystSelections,
  isExecutionUsablePick,
  loadArticles,
  normalizedLimit,
  renderHtml,
  renderMarkdown,
};
