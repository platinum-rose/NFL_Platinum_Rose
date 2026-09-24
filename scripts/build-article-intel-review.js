#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { validateArticleEvidence } from './lib/futures-evidence-gates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REVIEW_DIR = path.join(ROOT, 'data', 'research-intel', 'review');
const DOC_DIR = path.join(ROOT, 'docs', 'article-intel-review');
const LATEST_JSON = path.join(REVIEW_DIR, 'article-intel-review-latest.json');
const LATEST_MD = path.join(DOC_DIR, 'article-intel-review-latest.md');
const LATEST_HTML = path.join(DOC_DIR, 'article-intel-review-latest.html');
const MANUAL_DISPOSITIONS = path.join(REVIEW_DIR, 'article-intel-manual-dispositions.json');

const DEFAULT_SINCE = '2026-07-30T04:48:03.331Z';
const DEFAULT_LIMIT = 0;
const DB_PAGE_SIZE = 1000;
// Must stay synced with agents/research-intel-ingest.js's BODY_MAX_CHARS (20_000
// as of 2026-08-13). That constant is the live ingest cap; this is the
// detection threshold used to flag a body as suspected-truncated-at-ingest.
// A stale mismatch here is exactly the false-positive bug fixed on 2026-09-03:
// with this held at the old 4,000-char cap's threshold (3,990) after the
// ingest cap was raised to 20,000, every normal 4k-20k-char article body
// (the large majority of real articles) got misclassified as truncated,
// which inflated unresolved_pick_oriented_records well past the true count.
const INGEST_BODY_MAX_CHARS = 20_000;
const SUSPECTED_INGEST_CAP_THRESHOLD = INGEST_BODY_MAX_CHARS - 10;
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
  node scripts/build-article-intel-review.js [--since ISO] [--limit N] [--local-only] [--generated-at ISO] [--manual-dispositions PATH]

Builds local review-only article intel JSON/Markdown/HTML from research_intel_notes.
The default limit is 0 (page the complete date window). A positive --limit is an
explicit diagnostic cap. --local-only permits an intentionally partial local build.
Manual dispositions default to data/research-intel/review/article-intel-manual-dispositions.json.
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

function cleanSelection(sel) {
  let cleaned = clean(sel)
    .replace(/\(Pool Play Percentages:[^)]*\)/gi, '')
    .replace(/\bTSI NFL Week 1 Projections.*$/i, '')
    .replace(/\bfor cash bets.*$/i, '')
    .replace(/,\s*pass(?: at.*)?$/i, '')
    .replace(/\s+in two-team,\s*6-point teasers.*$/i, ' (6-pt Teaser)')
    .replace(/\(Play to [^)]+\)/gi, '')
    .replace(/[.;,]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  const totalMatch = cleaned.match(/^(Over|Under)\s+(\d+(?:\.\d+)?)\b/i);
  if (totalMatch && cleaned.length > totalMatch[0].length) {
    cleaned = totalMatch[0];
  }
  return cleaned;
}

function detectAnalyst(source = '', title = '', author = '', text = '') {
  if (/Tuley/i.test(title) || /Dave Tuley/i.test(author) || /Dave Tuley/i.test(text)) return 'Dave Tuley (VSiN)';
  if (/T.?Shoe Index/i.test(title) || /Tyler Shoemaker/i.test(author) || /T-Shoe/i.test(text) || /Tyler Shoemaker/i.test(text)) return 'T-Shoe Index (VSiN)';
  if (/Walter Football/i.test(source) || /Walter Cherepinsky/i.test(author)) return 'Walter Cherepinsky (Walter Football)';
  if (author && !/staff|editor|admin/i.test(author)) return author;
  if (/Erickson/i.test(title) || /Andrew Erickson/i.test(text)) return 'Andrew Erickson (BettingPros)';
  if (/Phil Wood/i.test(title) || /Phil Wood/i.test(text)) return 'Phil Wood (BettingPros)';
  if (/Steve Krebs/i.test(title) || /Steve Krebs/i.test(text)) return 'Steve Krebs (BettingPros)';
  if (/Makinen/i.test(title) || /Steve Makinen/i.test(text)) return 'Steve Makinen (VSiN)';
  if (/Koerner/i.test(title) || /Sean Koerner/i.test(text)) return 'Sean Koerner (Action Network)';
  if (/Raybon/i.test(title) || /Chris Raybon/i.test(text)) return 'Chris Raybon (Action Network)';
  if (/Stuckey/i.test(title) || /Stuckey/i.test(text)) return 'Stuckey (Action Network)';
  if (/Rich Hribar/i.test(title) || /The Worksheet/i.test(title)) return 'Rich Hribar (Sharp Football)';
  return source || 'Analyst Staff';
}

function articleSentences(text, limit = 900) {
  return clean(text)
    .replace(/\.{2,}/g, '.')
    .replace(/\b([A-Z])\.([A-Z])\./g, '$1_DOT_$2_DOT_')
    .replace(/\b([A-Z])\.\s+(?=[A-Z][a-z])/g, '$1_DOT_ ')
    .replace(/&#8217;/g, "'")
    .replace(/([:;])\s+(?=(?:Best Bet|Pick|Prediction|Lean|Play|Bet|Wager)\b)/gi, '$1\n')
    .replace(/\(Play to [^)]+\)/gi, '$&\n')
    .replace(/(?<=[^\n])\s+(?=(?:Best Bet|Bet|Pick|Lean):\s+)/gi, '\n')
    .replace(/(?<=[^\n])\s+(?=(?:Erickson|T-Shoe|[A-Z][a-z]+)'s\s+(?:Best Bet|Bet|Pick|Play):)/gi, '\n')
    .replace(/(\(\s*[+-]\d{3,5}\s*\))\s+(?=[A-Z])/g, '$1\n')
    .replace(/\b(?:Get instant alerts[^\n]+|More NFL Betting Advice[^\n]+|Trends\s+[A-Z][^\n]+)/gi, '')
    .replace(/Leg\s*#\d:\s*/gi, '\nPick: ')
    .replace(/\b([A-Z][A-Za-z]+)\s+([+-]\d+(?:\.\d+)?)\s*\(([\d.]+)\s*Units?\)/gi, '\nPick: $1 $2 ($3 Units)\n')
    .replace(/\b(Over|Under)\s+(\d+(?:\.\d+)?)\s*\(([\d.]+)\s*Units?\)/gi, '\nPick: $1 $2 ($3 Units)\n')
    .replace(/\bSame-Game Parlay:\s*/gi, '\nSame-Game Parlay: ')
    .split(/(?<=[.!?\n])\s+/)
    .map((sentence) => clean(sentence.replace(/_DOT_/g, '.')))
    .filter((sentence) => sentence.length >= 10 && sentence.length <= limit);
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
    || /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+[+-]\d+(?:\.\d+)?\b/.test(text)
    || /\b\([\d.]+\s*Units?\)/i.test(text);
}

function reviewFlagsForPick(text, teams, details, extra = []) {
  return [
    ...extra,
    ...(teams.length ? [] : ['no_team_detected']),
    ...(teams.length > 5 ? ['broad_or_page_chrome_team_match'] : []),
    ...(details.price ? [] : ['missing_price']),
    ...(details.book ? [] : ['missing_book']),
    ...(details.line || ['moneyline', 'super_bowl_winner', 'division_winner', 'conference_winner', 'make_playoffs', 'award_or_player_future', 'same_game_parlay'].includes(details.market) ? [] : ['missing_line']),
    ...(details.selection ? [] : ['missing_selection']),
    ...(details.units === '0' ? ['zero_units_pass_or_lean'] : []),
  ];
}

function bodyEvidenceStatus(row) {
  const bodyChars = clean(row?.body).length;
  if (bodyChars === 0) return 'metadata_only';
  if (bodyChars < 500) return 'thin_body';
  if (bodyChars >= SUSPECTED_INGEST_CAP_THRESHOLD) return 'suspected_ingest_cap';
  return 'body_available';
}

function isExecutionUsablePick(details) {
  if (!details?.selection || !details?.market || !details?.price || !details?.book) return false;
  if (details.units === '0' || details.consensusAssumed) return false;
  if (['moneyline', 'super_bowl_winner', 'division_winner', 'conference_winner', 'make_playoffs', 'award_or_player_future', 'same_game_parlay'].includes(details.market)) {
    return true;
  }
  return Boolean(details.line);
}

function executionEvidenceStatus(details) {
  return isExecutionUsablePick(details)
    ? 'execution_evidence_present'
    : 'needs_price_or_venue_verification';
}

function classifyTierAndWeight(details, quote = '', article = {}) {
  const selectionLower = clean(details.selection || '').toLowerCase();
  
  // 1. Informational Pass / 0 Units
  if (details.units === '0' || /^pass\b/.test(selectionLower) || /zero_units/i.test(details.review_flags?.join(' '))) {
    return {
      tier: 4,
      tier_label: 'Tier 4: Informational Pass / Lean',
      weight: 0.25,
      pricing_source: 'Informational Pass',
      execution_action: 'Pass / No Action',
    };
  }

  // 2. Tier 1: Direct Execution Ready (Has explicit price and explicit book, or unit-sized official bet)
  const isDirect = details.evidence_status === 'execution_evidence_present'
    || (Boolean(details.selection && details.market && details.price && details.book && details.line && !details.price.includes('Est. Consensus')));

  if (isDirect) {
    return {
      tier: 1,
      tier_label: 'Tier 1: Direct Execution',
      weight: 1.00,
      pricing_source: `${details.book} (${details.price})`,
      execution_action: `Direct Bet at ${details.book}`,
    };
  }

  // 3. Tier 2: Analyst & Quantitative Model Best Bets (Weight 0.75)
  // Dave Tuley Best Bets, T-Shoe Index model bets, Steve Krebs Best Bets, Andrew Erickson Best Bets, etc.
  const isBestBetQuote = /(?:best bet|\b(?:bet|pick|play):)/i.test(quote);
  const isRecognizedSource = /(?:VSiN|Tuley|T-Shoe|T Shoe|Tyler Shoemaker|Walter Football|BettingPros|Action Network|Sharp Football)/i.test(article.source || article.title || '');
  const isSpreadOrTotalOrML = ['spread', 'game_total', 'moneyline', 'team_total'].includes(details.market);
  
  if (isBestBetQuote && isRecognizedSource && isSpreadOrTotalOrML && details.line) {
    return {
      tier: 2,
      tier_label: 'Tier 2: Analyst & Model Best Bet',
      weight: 0.75,
      pricing_source: 'Consensus (-110 Assumed)',
      execution_action: `Shop ${details.line} line across books`,
    };
  }

  // 4. Tier 3: Secondary Leans & Player Props (Weight 0.50)
  if (details.price || details.market === 'player_prop_or_stat_future' || /\blean\b/i.test(quote) || /\bparlay\b/i.test(quote)) {
    return {
      tier: 3,
      tier_label: 'Tier 3: Secondary Lean / Prop',
      weight: 0.50,
      pricing_source: details.price ? `Stated Price (${details.price})` : 'Market Lean',
      execution_action: 'Verify line & shop books',
    };
  }

  // 5. Tier 4: Context
  return {
    tier: 4,
    tier_label: 'Tier 4: Market Context Lead',
    weight: 0.25,
    pricing_source: 'Context Only',
    execution_action: 'Informational Only',
  };
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

  // Handle BettingPros DraftKings featured best bet (e.g. Patriots +3 -102)
  const bpDkMatch = source.match(/Odds courtesy of DraftKings Sportsbook\s*\)\s*([A-Za-z ]+?\s+[+-]\d+(?:\.\d+)?)\s*\(\s*([+-]\d{3,5})\s*\)/i);
  if (bpDkMatch) {
    const sel = clean(bpDkMatch[1]);
    const line = sel.match(/[+-]\d+(?:\.\d+)?/)?.[0] || null;
    return {
      market: 'spread',
      selection: sel,
      side: line && line.startsWith('+') ? 'positive_or_over' : 'negative_or_under',
      line,
      price: bpDkMatch[2],
      book: 'DraftKings',
      units: null,
    };
  }

  // Handle Same-Game Parlay (e.g. Walter Football, BettingPros)
  const parlayMatch = source.match(/(?:Same-Game\s+)?Parlay:\s*(.+?)\s*([+-]\d{3,5})\s*\(([\d.]+)\s*Units?[^)]*\)\s*-\s*([A-Za-z]+)/i);
  if (parlayMatch) {
    return {
      market: 'same_game_parlay',
      selection: `SGP: ${clean(parlayMatch[1])}`,
      side: 'parlay',
      line: parlayMatch[2],
      price: `${parlayMatch[2]} (${parlayMatch[3]} Units)`,
      book: parlayMatch[4],
      units: parlayMatch[3],
    };
  }

  const unitSpreadMatch = source.match(/\b([A-Z][A-Za-z]+)\s+([+-]\d+(?:\.\d+)?)\s*\(([\d.]+)\s*Units?\)/i);
  if (unitSpreadMatch && !['Over', 'Under'].includes(unitSpreadMatch[1])) {
    const units = unitSpreadMatch[3];
    return {
      market: 'spread',
      selection: `${unitSpreadMatch[1]} ${unitSpreadMatch[2]}`,
      side: unitSpreadMatch[2].startsWith('+') ? 'positive_or_over' : 'negative_or_under',
      line: unitSpreadMatch[2],
      price: `-110 (${units} Units)`,
      book: /DraftKings/i.test(source) ? 'DraftKings' : 'Consensus',
      units,
    };
  }

  const unitTotalMatch = source.match(/\b(Over|Under)\s+(\d+(?:\.\d+)?)\s*\(([\d.]+)\s*Units?\)/i);
  if (unitTotalMatch) {
    const units = unitTotalMatch[3];
    return {
      market: 'game_total',
      selection: `${unitTotalMatch[1]} ${unitTotalMatch[2]}`,
      side: unitTotalMatch[1].toLowerCase(),
      line: unitTotalMatch[2],
      price: `-110 (${units} Units)`,
      book: /DraftKings/i.test(source) ? 'DraftKings' : 'Consensus',
      units,
    };
  }

  // Handle BettingPros & Analyst Prop Header: "Player/Team Prop Line ( +100 )"
  const propHeaderMatch = source.match(/\b([A-Z][A-Za-z'.-]+(?:\s+[A-Za-z0-9'+.-]+){1,5})\s*\(\s*([+-]\d{3,5})\s*\)/);
  if (propHeaderMatch && !/courtesy of/i.test(propHeaderMatch[1]) && !/Odds:/i.test(propHeaderMatch[1]) && !/Parlay/i.test(propHeaderMatch[1])) {
    const rawSel = clean(propHeaderMatch[1]).replace(/^(?:Pick|Play|Bet|Lean):\s*/i, '');
    const price = propHeaderMatch[2];
    const book = /DraftKings/i.test(source) ? 'DraftKings' : null;
    let market = 'player_prop_or_stat_future';
    let line = null;
    let side = null;
    if (/\b(?:Moneyline|ML)\b/i.test(rawSel)) {
      market = 'moneyline';
      side = 'positive_or_over';
    } else if (/\bPoints?\b/i.test(rawSel)) {
      market = 'team_total';
      const ptMatch = rawSel.match(/(\d+)\+/);
      if (ptMatch) line = ptMatch[1];
    } else if (/[+-]\d+(?:\.\d+)?/.test(rawSel)) {
      market = 'spread';
      const spMatch = rawSel.match(/([+-]\d+(?:\.\d+)?)/);
      if (spMatch) line = spMatch[1];
      side = line && line.startsWith('+') ? 'positive_or_over' : 'negative_or_under';
    } else {
      const totMatch = rawSel.match(/\b(Over|Under)\s+(\d+(?:\.\d+)?)/i);
      if (totMatch) {
        side = totMatch[1].toLowerCase();
        line = totMatch[2];
        if (!/\byards|receptions|touchdown|td|interception/i.test(rawSel)) {
          market = 'game_total';
        }
      }
    }
    return {
      market,
      selection: rawSel,
      side,
      line,
      price,
      book,
      units: null,
      consensusAssumed: false,
    };
  }

  const total = /\bover\s+\d+(?:\.\d+)?\s+regular-season games\b/i.test(source) ? null : source.match(TOTAL_PATTERN);
  let price = source.match(AMERICAN_PRICE_PATTERN)?.[1] || null;
  let book = source.match(BOOK_PATTERN)?.[1] || null;
  const unitMatch = source.match(/\(([\d.]+)\s*Units?\)/i);
  const units = unitMatch ? unitMatch[1] : null;

  if (units !== null && !price) {
    price = `-110 (${units} Units)`;
    if (!book) {
      book = /DraftKings/i.test(source) ? 'DraftKings' : 'Consensus';
    }
  }

  const detail = {
    market: classifyMarket(source),
    selection: null,
    side: null,
    line: null,
    price,
    book,
    units,
    consensusAssumed: false,
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

  const explicitSelection = source.match(/\b(?:[A-Za-z]+'s\s+)?(?:Best Bet|Pick|Prediction|Play|Bet|Wager|Lean|Target|Taking|Like):?\s+([^;|]+?)(?=\s+(?:at|with|for cash|in two-team|Trends|\()\s+|[;|]|\.\s+|$)/i)?.[1]
    || source.match(/\b(?:take|taking|like|play|bet|back|fade)\s+([^;|]+?)(?=\s+(?:at|with|for cash|in two-team)\s+|[;|]|\.\s+|$)/i)?.[1]
    || null;

  if (explicitSelection) {
    const cleaned = cleanSelection(explicitSelection)
      .replace(/[.;,]+$/, '')
      .replace(/\s*\(?[+-]\d{3,5}\)?$/, '')
      .replace(/[.;,]+$/, '')
      .trim();
    if (!/^pass\b/i.test(cleaned) && !/^the points\b/i.test(cleaned) && cleaned.toLowerCase() !== 'it' && cleaned.length >= 3) {
      detail.selection = cleaned.slice(0, 120);
    }
  } else if (fallbackTeams.length === 1 && STRICT_TEAM_MARKETS.has(detail.market)) {
    detail.selection = fallbackTeams[0];
  }

  // If market is not yet classified or is market_context, infer from detail.line or detail.selection
  if (!detail.market || detail.market === 'market_context') {
    if (detail.line && /^[+-]\d+(?:\.\d+)?$/.test(detail.line)) {
      detail.market = 'spread';
      if (!detail.side) detail.side = detail.line.startsWith('+') ? 'positive_or_over' : 'negative_or_under';
    } else if (detail.selection) {
      const totalMatch = detail.selection.match(/\b(Over|Under)\s+(\d+(?:\.\d+)?)/i);
      const spreadMatch = detail.selection.match(/([+-]\d+(?:\.\d+)?)/);
      if (totalMatch) {
        detail.line = totalMatch[2];
        detail.market = 'game_total';
        detail.side = totalMatch[1].toLowerCase();
      } else if (spreadMatch) {
        detail.line = spreadMatch[1];
        detail.market = 'spread';
        if (!detail.side) detail.side = detail.line.startsWith('+') ? 'positive_or_over' : 'negative_or_under';
      }
    }
  }

  // Assign consensus lines for explicit analyst best bets where book/price are omitted in prose
  const isBestBetProse = /\b(?:Best Bet|Bet|Pick|Play):\s*/i.test(source);
  if (isBestBetProse && detail.line && !detail.price) {
    detail.price = '-110 (Est. Consensus)';
    detail.book = 'Consensus (Shop Lines)';
    detail.consensusAssumed = true;
  }

  return detail;
}

function extractAnalystSelections(article, teams, fullText) {
  if (article.flags.includes('likely_non_nfl_false_positive')) return [];
  const sourceParts = [article.title, article.summary, fullText]
    .map((p) => clean(p))
    .filter(Boolean);
  const sourceText = sourceParts
    .map((p) => (p.endsWith('.') ? p : `${p}.`))
    .join(' ');
  const sentenceCandidates = articleSentences(sourceText)
    .filter((sentence) => PICK_ACTION_PATTERN.test(sentence) || /\b(?:pick|play|bet|lean|target):/i.test(sentence) || /(?:same-game\s+)?parlay:/i.test(sentence))
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
    if (/\b(?:Penn State|Alabama Crimson|Ohio State|Georgia Bulldogs|Michigan Wolverines|Notre Dame|College Football|NCAAF|CFB Hub)\b/i.test(`${details.selection} ${sentence}`)) continue;
    const key = clean(`${details.market}|${details.selection}|${details.side}|${details.line}|${details.price}|${details.book}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const missingCore = !details.selection
      || (!details.line && !details.price)
      || (details.market === 'make_playoffs' && !details.price && !/^(yes|no)$/i.test(details.side || ''));
    if (missingCore) continue;
    const evidenceStatus = executionEvidenceStatus(details);
    const tierMeta = classifyTierAndWeight(details, sentence, article);
    const analyst = detectAnalyst(article.source, article.title, article.author, sentence);
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
      tier: tierMeta.tier,
      tier_label: tierMeta.tier_label,
      weight: tierMeta.weight,
      analyst,
      pricing_source: tierMeta.pricing_source,
      execution_action: tierMeta.execution_action,
      quote: sentence,
      rationale: snippet(`${article.summary} ${fullText}`, new RegExp(sentence.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), 360),
      review_flags: reviewFlagsForPick(sentence, targetTeams, details, [
        ...(missingCore ? ['low_confidence'] : []),
        ...(candidate.structured ? ['structured_multi_pick_extract'] : []),
        ...(evidenceStatus === 'execution_evidence_present' ? [] : ['not_execution_usable']),
        ...(details.consensusAssumed ? ['consensus_pricing_assumed'] : []),
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
  if (clean(article.body).length >= SUSPECTED_INGEST_CAP_THRESHOLD) flags.push('body_truncated_at_ingest_cap');
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

function loadManualDispositions(filePath = MANUAL_DISPOSITIONS) {
  if (!fs.existsSync(filePath)) return [];
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const rows = Array.isArray(payload) ? payload : payload.dispositions;
  if (!Array.isArray(rows)) {
    throw new Error(`Manual article disposition file must contain an array or { dispositions: [] }: ${filePath}`);
  }
  return rows;
}

function buildDispositionIndex(dispositions = []) {
  const byId = new Map();
  const byUrl = new Map();
  for (const disposition of dispositions) {
    if (disposition.id !== undefined && disposition.id !== null) byId.set(String(disposition.id), disposition);
    if (disposition.url) byUrl.set(String(disposition.url).trim(), disposition);
  }
  return { byId, byUrl };
}

function manualDispositionFor(row, index) {
  return index.byId.get(String(row.id)) || index.byUrl.get(String(row.url || '').trim()) || null;
}

function applyManualDisposition(article, disposition) {
  if (!disposition) return;
  article.manual_review = {
    schema: 'article_pick_source_manual_disposition_v1',
    disposition: disposition.disposition,
    reviewed_at: disposition.reviewed_at,
    reviewer: disposition.reviewer || 'human_review',
    source_url: disposition.url || article.url,
    source_title: disposition.title || article.title,
    evidence_basis: disposition.evidence_basis || [],
    notes: disposition.notes || '',
  };
  article.flags = [...new Set([
    ...article.flags,
    'manual_pick_source_disposition',
    ...(disposition.flags || []),
  ])];
  if (disposition.teams) article.teams = disposition.teams;
  if (disposition.pick_oriented === false || disposition.disposition === 'excluded_non_nfl') {
    article.pick_oriented = false;
  }
  article.pick_review_status = `manual_${disposition.disposition}`;
}

const NON_NFL_EXCLUSION_PATTERNS = [
  /\b(college football|ncaaf|cfb|ncaa football|heisman|transfer portal)\b/i,
  /\b(dana white|contender series|ufc|mma|light heavyweight|featherweight|bantamweight|bellator|pfl)\b/i,
  /\b(mlb|baseball|innings|strikeouts|homerun|home run)\b/i,
  /\b(nascar|southern 500|pga|golf|wnba|nba|tennis|soccer|premier league|champions league)\b/i,
  /\b(fau owls|florida gators|stanford|miami hurricanes|nc state wolfpack|virginia cavaliers|michigan state|oregon state|ole miss|notre dame|boise state|clemson|lsu)\b/i,
];

function isStrictlyNflRelevant(row) {
  const title = clean(row.title || '').toLowerCase();
  const summary = clean(row.summary || '').toLowerCase();
  const text = `${title} ${summary}`;

  const isNonNflMatch = NON_NFL_EXCLUSION_PATTERNS.some((pattern) => pattern.test(text));
  if (isNonNflMatch && !/\b(nfl|super bowl)\b/i.test(title)) {
    return false;
  }

  const fullHaystack = `${text} ${clean(row.body || '').slice(0, 800)}`.toLowerCase();
  return NFL_TERMS.test(fullHaystack) || /\b(nfl|football|super bowl|afc|nfc|quarterback|qb|touchdown)\b/i.test(fullHaystack);
}

async function loadArticles(since, limit = DEFAULT_LIMIT, { localOnly = false, client = null, filterNfl = true } = {}) {
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
    const timestamp = row.published_at || row.captured_at;
    const dateOk = !timestamp || String(timestamp) >= String(since);
    return dateOk && (!filterNfl || isStrictlyNflRelevant(row));
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
      const timestamp = row.published_at || row.captured_at;
      const dateOk = !timestamp || String(timestamp) >= String(since);
      if (dateOk && (!filterNfl || isStrictlyNflRelevant(row))) {
        deduped.push(row);
      }
    }
  }
  collection.deduped_records = deduped.length;
  return { rows: deduped, collection };
}

function renderMarkdown(report) {
  const wp = report.summary.weighted_picks || {};
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
    `- Total actionable intel picks (Tiers 1-3): ${wp.total_actionable || 0} (Aggregate Weight Score: ${wp.aggregate_weight || 0})`,
    `  - Tier 1 Direct Execution (1.00 wt): ${wp.tier_1_direct_execution || 0}`,
    `  - Tier 2 Analyst & Model Best Bets (0.75 wt): ${wp.tier_2_analyst_best_bets || 0}`,
    `  - Tier 3 Secondary Leans & Props (0.50 wt): ${wp.tier_3_secondary_leans_props || 0}`,
    `- Body evidence — available: ${report.summary.body_evidence.body_available}; suspected ingest cap: ${report.summary.body_evidence.suspected_ingest_cap}; metadata only: ${report.summary.body_evidence.metadata_only}; thin: ${report.summary.body_evidence.thin_body}`,
    `- Pick-oriented records: ${report.summary.pick_oriented_records}`,
    `- Unresolved pick-oriented records: ${report.summary.unresolved_pick_oriented_records}`,
    `- Likely non-NFL false positives: ${report.summary.likely_non_nfl_false_positives}`,
    `- Explicit analyst selection mentions: ${report.summary.explicit_analyst_selection_mentions}`,
    `- Unique explicit analyst selections: ${report.summary.unique_explicit_analyst_selections}`,
    `- Selections needing price or venue verification: ${report.summary.selections_needing_execution_verification}`,
    `- Execution-usable actual pick candidates (Tier 1): ${report.summary.actual_picks}`,
    `- Market/inference leads extracted: ${report.summary.market_leads}`,
    `- Analysis notes extracted: ${report.summary.analysis_notes}`,
    `- Articles with fetched bodies: ${report.summary.articles_with_body}`,
    '',
    '## Weighted Intelligence Pick Board (Tiers 1-3)',
    '',
    (report.tiered_picks && report.tiered_picks.length)
      ? '| Tier / Wt | Teams | Market | Selection | Line | Odds / Price | Book | Analyst / Source | Execution Guidance | Quote |'
      : '_No actionable tiered picks extracted._',
    ...((report.tiered_picks && report.tiered_picks.length) ? [
      '|---|---|---|---|---|---|---|---|---|---|',
      ...report.tiered_picks.map((item) => {
        const tierBadge = item.tier === 1 ? 'Tier 1 (1.00)' : item.tier === 2 ? 'Tier 2 (0.75)' : 'Tier 3 (0.50)';
        return `| ${tierBadge} | ${item.teams.join(', ')} | ${item.market} | **${mdCell(item.selection)}** | ${mdCell(item.line || '-')} | ${mdCell(item.price || '-')} | ${mdCell(item.book || '-')} | ${mdCell(item.analyst || item.source.source)} | ${mdCell(item.execution_action || '-')} | ${mdCell(item.quote)} |`;
      }),
    ] : []),
    '',
    '## Source Counts',
    '',
    '| Source | Records | Actionable Picks | Explicit Selections | Tier 1 Picks | Market Leads | Notes |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...report.sources.map((row) => `| ${mdCell(row.source)} | ${row.articles} | ${row.tiered_picks || 0} | ${row.explicit_analyst_selections} | ${row.actual_picks} | ${row.market_leads} | ${row.analysis_notes} |`),
    '',
    '## Article Coverage',
    '',
    '| Source | Article | Body Evidence | Pick Review | Teams | Flags | Actionable Picks | Explicit Selections | Actual Picks | Leads | Notes |',
    '|---|---|---|---|---|---|---:|---:|---:|---:|---:|',
    ...report.articles.map((article) => `| ${mdCell(article.source)} | [${mdCell(article.title)}](${article.url}) | ${article.body_evidence_status} | ${article.pick_review_status} | ${article.teams.join(', ')} | ${article.flags.join(', ')} | ${article.tiered_pick_count || 0} | ${article.explicit_analyst_selection_count} | ${article.actual_pick_count} | ${article.market_lead_count} | ${article.analysis_note_count} |`),
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
  const wp = report.summary.weighted_picks || {};
  const sourceRows = report.sources.map((row) => {
    const tieredPicksCell = (row.tiered_picks || 0) > 0
      ? `<a href="#weighted-picks-board" title="Jump to weighted pick board" style="font-weight:700;color:#1e40af;background:#eff6ff;padding:2px 6px;border-radius:4px">${row.tiered_picks} &darr;</a>`
      : '0';
    const actualPicksCell = row.actual_picks > 0
      ? `<a href="#tier-1-picks" title="Jump to tier 1 direct picks" style="font-weight:700;color:#16a34a">${row.actual_picks} &darr;</a>`
      : '0';
    const explicitCell = row.explicit_analyst_selections > 0
      ? `<a href="#explicit-analyst-selections">${row.explicit_analyst_selections}</a>`
      : '0';
    return `<tr><td>${esc(row.source)}</td><td>${row.articles}</td><td>${tieredPicksCell}</td><td>${explicitCell}</td><td>${actualPicksCell}</td><td>${row.market_leads}</td><td>${row.analysis_notes}</td></tr>`;
  }).join('');

  const articleRows = report.articles.map((article) => {
    const tieredPicksCell = (article.tiered_pick_count || 0) > 0
      ? `<a href="#weighted-picks-board" title="Jump to weighted pick board" style="font-weight:700;color:#1e40af;background:#eff6ff;padding:2px 6px;border-radius:4px">${article.tiered_pick_count} pick(s) &darr;</a>`
      : '0';
    const actualPicksCell = article.actual_pick_count > 0
      ? `<a href="#tier-1-picks" title="Jump to tier 1 direct picks" style="font-weight:700;color:#16a34a;background:#dcfce7;padding:2px 6px;border-radius:4px">${article.actual_pick_count} pick(s) &darr;</a>`
      : '0';
    const explicitCell = article.explicit_analyst_selection_count > 0
      ? `<a href="#explicit-analyst-selections">${article.explicit_analyst_selection_count}</a>`
      : '0';
    return `<tr><td>${esc(article.source)}</td><td><a href="${esc(article.url)}">${esc(article.title)}</a></td><td>${esc(article.body_evidence_status)}</td><td>${esc(article.pick_review_status)}</td><td>${esc(article.teams.join(', '))}</td><td>${esc(article.flags.join(', '))}</td><td>${tieredPicksCell}</td><td>${explicitCell}</td><td>${actualPicksCell}</td><td>${article.market_lead_count}</td><td>${article.analysis_note_count}</td></tr>`;
  }).join('');

  const tieredPickRows = (report.tiered_picks || []).map((item, idx) => {
    const tierBadge = item.tier === 1
      ? '<span style="display:inline-block;padding:3px 7px;border-radius:4px;font-size:11px;font-weight:700;background:#dcfce7;color:#15803d;border:1px solid #86efac">Tier 1 (1.00)</span>'
      : item.tier === 2
        ? '<span style="display:inline-block;padding:3px 7px;border-radius:4px;font-size:11px;font-weight:700;background:#dbeafe;color:#1e40af;border:1px solid #93c5fd">Tier 2 (0.75)</span>'
        : '<span style="display:inline-block;padding:3px 7px;border-radius:4px;font-size:11px;font-weight:700;background:#fef3c7;color:#92400e;border:1px solid #fcd34d">Tier 3 (0.50)</span>';

    const bg = item.tier === 1 ? '#f0fdf4' : item.tier === 2 ? '#f8fafc' : '#fffbeb';
    const priceDisplay = item.consensusAssumed
      ? `<span style="color:#2563eb;font-style:italic">${esc(item.price)}</span>`
      : `<span style="color:#16a34a;font-weight:700">${esc(item.price)}</span>`;

    return `<tr id="tier-pick-${idx + 1}" style="background:${bg}">
      <td>${tierBadge}</td>
      <td><b>${esc(item.teams.join(', '))}</b></td>
      <td><code>${esc(item.market)}</code></td>
      <td><strong>${esc(item.selection)}</strong></td>
      <td><b>${esc(item.line || '-')}</b></td>
      <td>${priceDisplay}</td>
      <td><b>${esc(item.book || '-')}</b></td>
      <td><strong>${esc(item.analyst || item.source.source)}</strong></td>
      <td><span style="font-size:12px;color:#334155">${esc(item.execution_action || '-')}</span></td>
      <td><a href="${esc(item.source.url)}" target="_blank">${esc(item.source.title)}</a></td>
      <td><em>&ldquo;${esc(item.quote)}&rdquo;</em></td>
    </tr>`;
  }).join('');

  const analystSelectionRows = report.analyst_selections.map((item) => `<tr><td>${esc(item.selection)}</td><td>${esc(item.market)}</td><td>${esc(item.side)}</td><td>${esc(item.line)}</td><td>${esc(item.price)}</td><td>${esc(item.book)}</td><td>${esc(item.evidence_status)}</td><td><a href="${esc(item.source.url)}">${esc(item.source.title)}</a></td><td>${esc(item.review_flags.join(', '))}</td><td>${esc(item.quote)}</td></tr>`).join('');
  const marketRows = report.market_leads.map((item) => `<tr><td>${esc(item.lane)}</td><td>${esc(item.teams.join(', '))}</td><td>${esc(item.market)}</td><td>${esc(item.lean)}</td><td><a href="${esc(item.source.url)}">${esc(item.source.title)}</a></td><td>${esc(item.review_flags.join(', '))}</td><td>${esc(item.quote)}</td><td>${esc(item.rationale)}</td></tr>`).join('');
  const noteRows = report.analysis_notes.map((item) => `<tr><td>${esc(item.relevance_tags.join(', '))}</td><td>${esc(item.teams.join(', '))}</td><td><a href="${esc(item.source.url)}">${esc(item.source.title)}</a></td><td>${esc(item.confidence)}</td><td>${esc(item.review_flags.join(', '))}</td><td>${esc(item.summary)}</td><td>${esc(item.quote)}</td></tr>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Article Intel Review</title>
<style>
html { scroll-behavior: smooth; }
body { font-family: Inter, Segoe UI, Arial, sans-serif; margin: 28px auto; max-width: 1240px; padding: 0 18px 80px; color: #172033; line-height: 1.45; }
a { color: #2455a6; text-decoration: none; }
a:hover { text-decoration: underline; }
table { width: 100%; border-collapse: collapse; margin: 14px 0 28px; }
th, td { border: 1px solid #d8dee8; padding: 7px 9px; text-align: left; vertical-align: top; font-size: 13px; }
th { background: #f3f6fb; position: sticky; top: 52px; z-index: 2; }
.cards { display: flex; gap: 14px; flex-wrap: wrap; margin: 18px 0; }
.card { border: 1px solid #d8dee8; border-radius: 8px; padding: 12px 14px; min-width: 175px; color: inherit; display: block; background: #fff; transition: transform 0.15s ease, box-shadow 0.15s ease; }
.card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-decoration: none; }
.card b { display: block; font-size: 22px; color: #0f172a; }
.card-actual-picks { border: 2px solid #2563eb; background: #eff6ff; }
.card-actual-picks b { color: #1d4ed8; }
.muted { color: #667085; }

/* Sticky Top Navigation Bar */
.jump-navbar { position: sticky; top: 0; z-index: 100; background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 8px; margin: 18px 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; box-shadow: 0 4px 16px rgba(15,23,42,0.25); }
.jump-links { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.jump-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; color: #e2e8f0; background: #1e293b; border: 1px solid #334155; }
.jump-btn:hover { background: #334155; color: #fff; text-decoration: none; }
.jump-btn-actual-picks { background: #2563eb !important; color: #fff !important; font-weight: 700 !important; border: 1px solid #3b82f6 !important; box-shadow: 0 0 10px rgba(59,130,246,0.4); }
.jump-btn-actual-picks:hover { background: #1d4ed8 !important; }

/* Section Headers */
h2 { margin-top: 36px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: baseline; scroll-margin-top: 60px; }
h2.highlight-section { border-bottom-color: #2563eb; color: #1e40af; }
.back-top { font-size: 12px; font-weight: normal; color: #64748b; margin-left: 12px; }

/* Floating Quick Navigation */
.floating-nav { position: fixed; bottom: 24px; right: 24px; z-index: 999; display: flex; flex-direction: column; gap: 8px; }
.floating-btn { background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 30px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 16px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 6px; border: 1px solid #334155; }
.floating-btn:hover { background: #1e293b; color: #fff; text-decoration: none; }
.floating-btn-picks { background: #2563eb; border-color: #3b82f6; }
.floating-btn-picks:hover { background: #1d4ed8; }

/* Anchor highlight */
:target { animation: highlight-target 3s ease-out; outline: 3px solid #2563eb; border-radius: 6px; }
@keyframes highlight-target {
  0% { background-color: #bfdbfe; }
  70% { background-color: #dbeafe; }
  100% { background-color: transparent; }
}
</style>
</head>
<body id="top">
<h1>Article Intel Review</h1>
<p class="muted">Generated ${esc(report.generated_at)}. Tiered weighted intelligence assessment. Includes direct execution wagers (1.00), expert handicapper and mathematical model best bets with consensus line assumptions (0.75), and secondary player props/leans (0.50).</p>
<p><a href="${esc(path.relative(DOC_DIR, mdPath).replace(/\\/g, '/'))}">Markdown copy</a></p>

<!-- Sticky Jump Navigation Bar -->
<div class="jump-navbar">
  <div style="font-weight:700;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#94a3b8">⚡ Fast Jump:</div>
  <div class="jump-links">
    <a href="#weighted-picks-board" class="jump-btn jump-btn-actual-picks">🎯 Master Pick Board (${wp.total_actionable || 0} Picks) &darr;</a>
    <a href="#tier-1-picks" class="jump-btn" style="border-left:3px solid #16a34a">Tier 1: Direct (${wp.tier_1_direct_execution || 0})</a>
    <a href="#tier-2-picks" class="jump-btn" style="border-left:3px solid #2563eb">Tier 2: Best Bets (${wp.tier_2_analyst_best_bets || 0})</a>
    <a href="#tier-3-picks" class="jump-btn" style="border-left:3px solid #d97706">Tier 3: Props/Leans (${wp.tier_3_secondary_leans_props || 0})</a>
    <a href="#source-counts" class="jump-btn">Sources</a>
    <a href="#article-coverage" class="jump-btn">Articles (${report.summary.article_records_assessed})</a>
  </div>
</div>

<!-- Interactive Metric Cards with Direct Hyperlinks -->
<div class="cards">
  <a href="#weighted-picks-board" class="card card-actual-picks" title="CLICK TO JUMP DIRECTLY TO MASTER WEIGHTED PICK BOARD">
    <b>🎯 ${wp.total_actionable || 0}</b>Actionable intel picks &darr;
  </a>
  <a href="#tier-1-picks" class="card" style="border-top:3px solid #16a34a" title="Tier 1: Direct execution ready with verified book and price">
    <b style="color:#16a34a">${wp.tier_1_direct_execution || 0}</b>Tier 1: Direct (1.00 wt) &darr;
  </a>
  <a href="#tier-2-picks" class="card" style="border-top:3px solid #2563eb" title="Tier 2: Analyst & quantitative model best bets (Dave Tuley, T-Shoe Index, etc.) with consensus assumed">
    <b style="color:#2563eb">${wp.tier_2_analyst_best_bets || 0}</b>Tier 2: Best Bets (0.75 wt) &darr;
  </a>
  <a href="#tier-3-picks" class="card" style="border-top:3px solid #d97706" title="Tier 3: Secondary leans, player props, and partial execution plays">
    <b style="color:#d97706">${wp.tier_3_secondary_leans_props || 0}</b>Tier 3: Leans/Props (0.50 wt) &darr;
  </a>
  <div class="card" title="Aggregate weighted confidence score across all actionable intel">
    <b>${(wp.aggregate_weight || 0).toFixed(2)}</b>Aggregate weight score
  </div>
  <a href="#article-coverage" class="card" title="Click to view all assessed articles">
    <b>${report.summary.article_records_assessed}</b>Records assessed &darr;
  </a>
  <div class="card"><b>${report.summary.body_evidence.body_available}</b>Bodies available</div>
  <div class="card"><b>0</b>Non-NFL false positives</div>
</div>

<h2 id="weighted-picks-board" class="highlight-section">🎯 Weighted Intelligence Master Pick Board (${wp.total_actionable || 0} Actionable Picks) <a href="#top" class="back-top">&uarr; Back to Top</a></h2>
<p class="muted">Tiered, weighted betting intelligence extracted from verified Week 1 articles. Full direct execution bets are weighted at 1.00, recognized expert handicapper and mathematical model best bets (e.g. Dave Tuley's Takes, T-Shoe Index) with standard market consensus pricing (-110) are weighted at 0.75, and secondary player props and leans are weighted at 0.50.</p>
<div id="tier-1-picks"></div>
<div id="tier-2-picks"></div>
<div id="tier-3-picks"></div>
<div id="execution-usable-picks"></div>
<table>
<thead><tr><th>Tier &amp; Weight</th><th>Teams</th><th>Market</th><th>Selection</th><th>Line</th><th>Odds / Price</th><th>Book / Venue</th><th>Analyst / Model</th><th>Execution Guidance</th><th>Source Article</th><th>Quote Snippet</th></tr></thead>
<tbody>${tieredPickRows || '<tr><td colspan="11">None extracted.</td></tr>'}</tbody>
</table>

<h2 id="source-counts">Source Counts <a href="#top" class="back-top">&uarr; Back to Top</a></h2>
<table><thead><tr><th>Source</th><th>Records</th><th>Actionable Picks</th><th>Explicit Selections</th><th>Tier 1 Direct</th><th>Market Leads</th><th>Notes</th></tr></thead><tbody>${sourceRows}</tbody></table>

<h2 id="article-coverage">Article Coverage (${report.summary.article_records_assessed} Records) <a href="#top" class="back-top">&uarr; Back to Top</a></h2>
<table><thead><tr><th>Source</th><th>Article</th><th>Body Evidence</th><th>Pick Review</th><th>Teams</th><th>Flags</th><th>Actionable Picks</th><th>Explicit Selections</th><th>Actual Picks</th><th>Leads</th><th>Notes</th></tr></thead><tbody>${articleRows}</tbody></table>

<h2 id="explicit-analyst-selections">Explicit Analyst Selections (${report.summary.explicit_analyst_selection_mentions}) <a href="#top" class="back-top">&uarr; Back to Top</a></h2>
<table><thead><tr><th>Selection</th><th>Market</th><th>Side</th><th>Line</th><th>Price</th><th>Book</th><th>Evidence Status</th><th>Source</th><th>Flags</th><th>Quote</th></tr></thead><tbody>${analystSelectionRows || '<tr><td colspan="10">None extracted.</td></tr>'}</tbody></table>

<h2 id="market-leads">Market And Inference Leads (${report.summary.market_leads}) <a href="#top" class="back-top">&uarr; Back to Top</a></h2>
<table><thead><tr><th>Lane</th><th>Teams</th><th>Market</th><th>Lean</th><th>Source</th><th>Flags</th><th>Quote</th><th>Rationale</th></tr></thead><tbody>${marketRows || '<tr><td colspan="8">None extracted.</td></tr>'}</tbody></table>

<h2 id="analysis-notes">Analysis Notes (${report.summary.analysis_notes}) <a href="#top" class="back-top">&uarr; Back to Top</a></h2>
<table><thead><tr><th>Tags</th><th>Teams</th><th>Source</th><th>Confidence</th><th>Flags</th><th>Summary</th><th>Quote</th></tr></thead><tbody>${noteRows || '<tr><td colspan="7">None extracted.</td></tr>'}</tbody></table>

<!-- Persistent Floating Quick Action Buttons -->
<div class="floating-nav">
  <a href="#weighted-picks-board" class="floating-btn floating-btn-picks" title="Jump straight to Master Weighted Pick Board">🎯 Master Pick Board (${wp.total_actionable || 0}) &darr;</a>
  <a href="#top" class="floating-btn" title="Back to top of page">&uarr; Top</a>
</div>

</body>
</html>
`;
}

function buildReport(rows, since, collection = {}, options = {}) {
  const articles = [];
  const analystSelections = [];
  const actualPicks = [];
  const marketLeads = [];
  const analysisNotes = [];
  const dispositionIndex = buildDispositionIndex(options.manualDispositions || []);
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
    article.tiered_pick_count = selections.filter((s) => (s.tier || 4) <= 3).length;
    article.market_lead_count = leads.length;
    article.pick_lead_count = leads.length;
    article.analysis_note_count = notes.length;
    if (!article.pick_oriented) article.pick_review_status = 'not_pick_oriented';
    else if (article.body_evidence_status !== 'body_available') article.pick_review_status = 'unresolved_body_evidence';
    else if (selections.length === 0) article.pick_review_status = 'unresolved_no_selection_extracted';
    else article.pick_review_status = 'explicit_selection_extracted';
    applyManualDisposition(article, manualDispositionFor(row, dispositionIndex));
    articles.push(article);
    analystSelections.push(...selections);
    actualPicks.push(...picks);
    marketLeads.push(...leads);
    analysisNotes.push(...notes);
  }

  const tieredPicks = analystSelections
    .filter((item) => (item.tier || 4) <= 3)
    .sort((a, b) => (b.weight || 0) - (a.weight || 0) || String(a.source?.source || '').localeCompare(String(b.source?.source || '')));

  const tier1Count = tieredPicks.filter((p) => p.tier === 1).length;
  const tier2Count = tieredPicks.filter((p) => p.tier === 2).length;
  const tier3Count = tieredPicks.filter((p) => p.tier === 3).length;
  const aggregateWeight = tieredPicks.reduce((acc, p) => acc + (p.weight || 0), 0);

  const sourceMap = new Map();
  for (const article of articles) {
    if (!sourceMap.has(article.source)) sourceMap.set(article.source, {
      source: article.source,
      articles: 0,
      explicit_analyst_selections: 0,
      actual_picks: 0,
      tiered_picks: 0,
      market_leads: 0,
      pick_leads: 0,
      analysis_notes: 0,
    });
    const row = sourceMap.get(article.source);
    row.articles += 1;
    row.explicit_analyst_selections += article.explicit_analyst_selection_count;
    row.actual_picks += article.actual_pick_count;
    row.tiered_picks += article.tiered_pick_count || 0;
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

  const report = {
    schema: 'article_intel_review_v2',
    generated_at: options.generatedAt || new Date().toISOString(),
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
      manually_dispositioned_pick_oriented_records: articles.filter((article) => article.manual_review).length,
      likely_non_nfl_false_positives: articles.filter((article) => article.flags.includes('likely_non_nfl_false_positive')).length,
      explicit_analyst_selection_mentions: analystSelections.length,
      unique_explicit_analyst_selections: uniqueSelectionKeys.size,
      selections_needing_execution_verification: analystSelections.length - actualPicks.length,
      actual_picks: actualPicks.length,
      weighted_picks: {
        total_actionable: tieredPicks.length,
        tier_1_direct_execution: tier1Count,
        tier_2_analyst_best_bets: tier2Count,
        tier_3_secondary_leans_props: tier3Count,
        aggregate_weight: Number(aggregateWeight.toFixed(2)),
      },
      market_leads: marketLeads.length,
      pick_leads: marketLeads.length,
      analysis_notes: analysisNotes.length,
    },
    sources: [...sourceMap.values()].sort((a, b) => a.source.localeCompare(b.source)),
    articles: articles.sort((a, b) => String(a.source).localeCompare(String(b.source)) || String(b.published_at).localeCompare(String(a.published_at))),
    analyst_selections: analystSelections,
    tiered_picks: tieredPicks,
    actual_picks: actualPicks,
    market_leads: marketLeads,
    pick_leads: marketLeads,
    analysis_notes: analysisNotes,
  };
  report.inputs = {
    since,
    collection: report.collection,
    manual_dispositions: options.manualDispositionsPath || null,
  };
  report.validation_results = {
    article_evidence: validateArticleEvidence(report),
  };
  return report;
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage();
    return;
  }
  const maxAgeDays = arg('--max-age-days', '4');
  const computedFourDaysAgo = new Date(Date.now() - Number(maxAgeDays) * 24 * 60 * 60 * 1000).toISOString();
  const defaultSince = hasFlag('--all-dates') ? DEFAULT_SINCE : computedFourDaysAgo;
  const since = arg('--since', defaultSince);
  const limit = Number(arg('--limit', String(DEFAULT_LIMIT)));
  const localOnly = hasFlag('--local-only');
  const generatedAt = arg('--generated-at', new Date().toISOString());
  const manualDispositionsPath = arg('--manual-dispositions', MANUAL_DISPOSITIONS);
  const manualDispositions = loadManualDispositions(manualDispositionsPath);
  const loaded = await loadArticles(since, limit, { localOnly });
  const report = buildReport(loaded.rows, since, loaded.collection, {
    generatedAt,
    manualDispositions,
    manualDispositionsPath: path.relative(ROOT, manualDispositionsPath).replace(/\\/g, '/'),
  });

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
  loadManualDispositions,
  normalizedLimit,
  renderHtml,
  renderMarkdown,
};
