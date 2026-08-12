#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  buildYoutubeCohort,
  isForbiddenYoutubeEpisode,
  PROMOTED_LOCAL_INTEL_STATUS,
} from './lib/youtube-futures-cohort.js';

const ROOT = process.cwd();
const CANDIDATES_PATH = path.join(ROOT, 'data', 'podcasts', 'youtube-discovery-candidates-2026.json');
const OBS_DIR = path.join(ROOT, 'data', 'shadow-harness', 'observations');
const REPORT_DIR = path.join(ROOT, 'data', 'shadow-harness', 'reports');
const REVIEW_DIR = path.join(ROOT, 'data', 'shadow-harness', 'review');
const REVIEW_STATUS_PATH = path.join(REVIEW_DIR, 'youtube-futures-intel-review-status.json');
const DOC_DIR = path.join(ROOT, 'docs', 'antigravity');

const TEAM_FIXUPS = { JAC: 'JAX', LOS: 'LAC' };
const VALID_TEAMS = new Set([
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',
  'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
]);
const YES_NO_MARKETS = new Set([
  'division_winner', 'conference_winner', 'conference_no_1_seed', 'super_bowl_winner',
  'mvp', 'opoy', 'dpoy', 'oroy', 'droy', 'coach_of_the_year', 'no_1_overall_pick'
]);
const FUTURES_MARKETS = new Set([
  'win_total', 'make_playoffs', 'division_winner', 'conference_winner', 'conference_no_1_seed',
  'super_bowl_winner', 'mvp', 'opoy', 'dpoy', 'oroy', 'droy', 'coach_of_the_year',
  'no_1_overall_pick',
  // Added during "fix now" pass off the manual quality read (Phase 4): these
  // canonical markets were missing entirely, so normalizeMarket() fell through
  // to a raw slug and picks landed in market_context with a spurious
  // non_futures_market flag even though they're clearly season-long futures.
  'comeback_player_of_the_year', 'fewest_wins', 'interceptions_leader', 'rushing_tds_leader',
  'season_receiving_yards', 'season_passing_yards', 'season_passing_tds', 'season_rushing_tds'
]);
const NON_FUTURES_BETTING_MARKETS = new Set([
  'spread', 'game_line', 'moneyline', 'total', 'player_prop', 'player_receiving_yds'
]);
const SURVIVOR_PICKEM_MARKETS = new Set(['survivor_pick', 'pickem_pick']);
const NOTE_TYPE_TAG_MAP = {
  team_evaluation: ['matchup_analysis'],
  player_evaluation: ['fantasy_intel'],
  injury_or_health: ['injury_intel'],
  roster_or_depth_chart: ['roster_transaction_intel'],
  coaching_or_scheme: ['matchup_analysis'],
  matchup_analysis: ['matchup_analysis'],
  schedule_context: ['market_context'],
  fantasy_relevance: ['fantasy_intel'],
  market_sentiment: ['market_context'],
  other: ['market_context']
};
const QB_LIST_SUBJECTS = [
  ['Josh Allen', ['Josh Allen', 'Allen']],
  ['Lamar Jackson', ['Lamar Jackson', 'Lamar']],
  ['Joe Burrow', ['Joe Burrow', 'Burrow']],
  ['Patrick Mahomes', ['Patrick Mahomes', 'Mahomes']],
  ['Matthew Stafford', ['Matthew Stafford', 'Stafford']],
  ['Drake Maye', ['Drake Maye', 'Maye']],
  ['Dak Prescott', ['Dak Prescott', 'Dak']],
  ['Jordan Love', ['Jordan Love']],
  ['Justin Herbert', ['Justin Herbert', 'Herbert']],
  ['Caleb Williams', ['Caleb Williams']],
  ['Brock Purdy', ['Brock Purdy', 'Purdy']],
  ['Jalen Hurts', ['Jalen Hurts', 'Hurts']],
  ['Baker Mayfield', ['Baker Mayfield', 'Baker']],
  ['Trevor Lawrence', ['Trevor Lawrence']],
  ['Jared Goff', ['Jared Goff', 'Goff']],
  ['Sam Darnold', ['Sam Darnold', 'Darnold']]
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseRawModelResponse(observation) {
  const raw = observation?.run?.raw_model_response || observation?.raw_model_response;
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function textHasAlias(text, alias) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function rankedQbCompletenessIssue(candidate, observation) {
  const title = String(candidate.title || '');
  if (!/\btop\s*10\b/i.test(title) || !/\b(qbs?|quarterbacks?)\b/i.test(title)) return null;

  const payload = parseRawModelResponse(observation);
  const speakerSegments = payload?.speaker_segments || [];
  const transcriptText = speakerSegments.map(segment => segment.text || '').join('\n');
  if (!transcriptText.trim()) return null;

  const structuredText = JSON.stringify({
    extracted_picks: observation?.run?.extracted_picks || [],
    analysis_notes: observation?.run?.analysis_notes || []
  });

  const discussedSubjects = QB_LIST_SUBJECTS
    .filter(([, aliases]) => aliases.some(alias => textHasAlias(transcriptText, alias)))
    .map(([name]) => name);
  const structuredSubjects = QB_LIST_SUBJECTS
    .filter(([, aliases]) => aliases.some(alias => textHasAlias(structuredText, alias)))
    .map(([name]) => name);

  if (discussedSubjects.length < 10) return null;
  const requiredStructuredSubjects = Math.max(8, Math.ceil(discussedSubjects.length * 0.75));
  if (structuredSubjects.length >= requiredStructuredSubjects) return null;

  const missingSubjects = discussedSubjects.filter(name => !structuredSubjects.includes(name));
  return [
    `ranked QB list coverage incomplete: raw transcript references ${discussedSubjects.length} QB subjects`,
    `but structured picks/notes cover ${structuredSubjects.length}`,
    `missing ${missingSubjects.slice(0, 10).join(', ')}`
  ].join('; ');
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2));
  try {
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    fs.rmSync(tmpPath, { force: true });
    throw err;
  }
}

function normalizeMarket(raw) {
  const clean = String(raw || 'general').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (clean.includes('win_total') || clean === 'wins' || clean.includes('season_win')) return 'win_total';
  if (clean.includes('make_playoff') || clean === 'playoffs') return 'make_playoffs';
  if (clean.includes('division_winner') || clean.includes('division_champion') || clean.includes('division_champ') || clean.includes('afc_south_champ')) return 'division_winner';
  if (clean.includes('conference_no_1_seed') || clean.includes('no_1_seed') || clean.includes('number_1_seed') || clean.includes('number_one_seed')) return 'conference_no_1_seed';
  if (clean.includes('super_bowl')) return 'super_bowl_winner';
  if (clean.includes('conference_champion') || clean.includes('conference_winner') || clean.includes('nfc_conference') || clean.includes('afc_conference') || clean.includes('nfc_champion') || clean.includes('afc_champion')) return 'conference_winner';
  if (clean.includes('overall_pick') || clean.includes('no_1_overall') || clean.includes('number_1_overall')) return 'no_1_overall_pick';
  if (clean.includes('mvp') || clean.includes('most_valuable_player')) return 'mvp';
  if (clean === 'opoy' || clean.includes('offensive_player_of_the_year')) return 'opoy';
  if (clean === 'dpoy' || clean.includes('defensive_player_of_the_year')) return 'dpoy';
  if (clean === 'oroy' || clean.includes('offensive_rookie_of_the_year')) return 'oroy';
  if (clean === 'droy' || clean.includes('defensive_rookie_of_the_year')) return 'droy';
  if (clean.includes('coach_of_the_year')) return 'coach_of_the_year';
  // Added during "fix now" pass off the manual quality read (Phase 4): these
  // raw market slugs were falling through to the generic `return clean`
  // fallback (no canonical name), so they never matched FUTURES_MARKETS and
  // landed in market_context with a spurious non_futures_market flag.
  if (clean.includes('comeback_player')) return 'comeback_player_of_the_year';
  if (clean.includes('fewest_win')) return 'fewest_wins';
  if (clean.includes('receiving_yard')) return 'season_receiving_yards';
  if (clean.includes('passing_yard')) return 'season_passing_yards';
  if (clean.includes('passing_touchdown') || clean.includes('passing_td')) return 'season_passing_tds';
  if (clean.includes('interception')) return 'interceptions_leader';
  if (clean.includes('rushing_touchdown') && clean.includes('leader')) return 'rushing_tds_leader';
  if (clean.includes('rushing_touchdown') || clean.includes('rushing_td')) return 'season_rushing_tds';
  return clean;
}

function normalizeSide(raw, market, team = null) {
  const clean = String(raw || 'UNKNOWN').trim().toUpperCase();
  // BUG FOUND + FIXED 2026-07-28 (Andy's verification-report request): Gemini's
  // own convention for YES/NO markets is often to put the picked team's own
  // abbreviation in `side` (e.g. side:"TEN" for "Titans win the AFC South")
  // rather than a literal YES token. A sibling copy of this function in
  // scripts/gemini-podcast-shadow-harness.js had a bare single-letter 'N'
  // fallback token that turned this into a silent bug (any side containing
  // the letter N read as "NO"); THIS copy didn't have that specific defect,
  // but it still didn't resolve team-code sides to their real YES meaning --
  // confirmed via a direct scan of all 13 real processed episodes (11/85
  // picks, 13%, had a side value that didn't reflect the actual pick). Add
  // the team-code short-circuit here too so both copies agree and neither
  // silently returns a raw team code where a real YES/NO belongs.
  if (YES_NO_MARKETS.has(market) && team && clean === String(team).toUpperCase()) return 'YES';
  if (YES_NO_MARKETS.has(market) && (clean === 'UNKNOWN' || clean.includes('OVER') || clean.includes('WIN') || clean.includes('YES') || clean.includes('TO WIN'))) return 'YES';
  if (YES_NO_MARKETS.has(market) && (clean.includes('NO') || clean.includes('UNDER') || clean.includes('FADE'))) return 'NO';
  // Bug fix (Phase 3 verification, surfaced by survivor_pick/pickem_pick's
  // legitimately-null side): the literal fallback string "UNKNOWN" itself
  // contains the substring "NO" (U-N-K-N-O-W-N), so the .includes('NO')
  // check below was silently mis-classifying every missing/null side as
  // side="NO" for non-YES/NO markets. Must short-circuit on the exact
  // "UNKNOWN" sentinel before any substring heuristics run.
  if (clean === 'UNKNOWN') return 'UNKNOWN';
  if (clean.includes('OVER')) return 'OVER';
  if (clean.includes('UNDER')) return 'UNDER';
  if (clean.includes('YES') || clean.includes('WIN')) return 'YES';
  if (clean.includes('NO')) return 'NO';
  return clean;
}

function normalizePick(p) {
  const market = normalizeMarket(p.market);
  const team = TEAM_FIXUPS[String(p.team || '').toUpperCase()] || String(p.team || 'UNK').toUpperCase();
  return {
    ...p,
    team,
    market,
    side: normalizeSide(p.side || p.selection, market, team),
    line: p.line != null && p.line !== '' ? Number(p.line) : null,
    price: p.price != null && p.price !== '' ? Number(p.price) : null,
    week: p.week != null && p.week !== '' ? Number(p.week) : null,
    source_timestamp: Number(p.source_timestamp || p.timestamp || 0),
    rationale: p.rationale || ''
  };
}

function normalizeNote(n) {
  const teams = Array.isArray(n.teams)
    ? n.teams
      .map(t => TEAM_FIXUPS[String(t || '').toUpperCase()] || String(t || '').toUpperCase())
      .filter(t => VALID_TEAMS.has(t))
    : [];
  const players = Array.isArray(n.players) ? n.players.filter(Boolean).map(String) : [];
  return {
    ...n,
    note_type: String(n.note_type || 'other').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    teams,
    players,
    topic: n.topic || '',
    summary: n.summary || '',
    speaker: n.speaker || '',
    source_timestamp: Number(n.source_timestamp || n.timestamp || 0),
    quote: n.quote || '',
    confidence: n.confidence || 'stated'
  };
}

function youtubeTimestamp(url, seconds) {
  if (!url || !Number.isFinite(seconds)) return url || '';
  return `${url}${url.includes('?') ? '&' : '?'}t=${Math.max(0, Math.round(seconds))}s`;
}

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

function priceText(price) {
  if (price == null || Number.isNaN(Number(price))) return '';
  const n = Number(price);
  return n > 0 ? `+${n}` : String(n);
}

function priceMentionedInQuote(price, quote) {
  if (price == null || Number.isNaN(Number(price))) return true;
  const n = Math.abs(Number(price));
  const text = String(quote || '').toLowerCase().replace(/[^a-z0-9+.-]+/g, ' ');
  const numeric = String(n);
  const decimal = `${Math.floor(n / 100)}${n % 100 === 0 ? '' : `.${String(n % 100).padStart(2, '0')}`}`;
  return text.includes(`+${numeric}`)
    || text.includes(`plus ${numeric}`)
    || text.includes(numeric)
    || text.includes(`${decimal} to 1`)
    || text.includes(`${decimal}-to-1`);
}

function suspiciousPriceShape(pick) {
  if (pick.price == null || Number.isNaN(Number(pick.price))) return false;
  const price = Number(pick.price);
  if (pick.market === 'division_winner' && price >= 1000) return true;
  if (pick.market === 'make_playoffs' && Math.abs(price) >= 800) return true;
  if (pick.market === 'win_total' && Math.abs(price) >= 400) return true;
  return false;
}

// Exclusive quote-to-pick assignment: each quote_timestamps entry is matched
// to at most one pick (whichever pick is truly closest to it, within 90s).
// The previous design let every pick independently grab "the nearest quote
// within 90s" with no notion that another, closer pick had already claimed
// it — so two distinct picks landing e.g. 29 seconds apart in the same
// episode could both display the same supporting_quote, even when that
// quote clearly belongs to only one of them (found via manual review of a
// real run: two different Round-of-the-Year picks both showed the same
// "Fernando Mendoza at +400" quote). Assigning quotes globally per-episode
// rather than per-pick fixes this: a pick only gets a quote it actually won.
function assignQuotesForRow(row) {
  const quotes = row.observation.run?.quote_timestamps || [];
  const picks = row.picks;
  const bestForPick = new Array(picks.length).fill(null);
  for (const quote of quotes) {
    const qTime = Number(quote.timestamp || 0);
    let bestPickIdx = -1;
    let bestDelta = Infinity;
    picks.forEach((pick, pIdx) => {
      const delta = Math.abs(Number(pick.source_timestamp || 0) - qTime);
      if (delta <= 90 && delta < bestDelta) {
        bestDelta = delta;
        bestPickIdx = pIdx;
      }
    });
    if (bestPickIdx === -1) continue;
    const candidate = { ...quote, delta: bestDelta };
    const existing = bestForPick[bestPickIdx];
    if (!existing || candidate.delta < existing.delta) bestForPick[bestPickIdx] = candidate;
  }
  return bestForPick;
}

function stablePickId(pick) {
  return [
    pick.episode_id,
    pick.team || 'UNK',
    pick.market || 'general',
    pick.side || 'UNKNOWN',
    pick.line ?? '',
    pick.price ?? '',
    pick.source_timestamp || 0
  ].join('__');
}

function stableNoteId(note) {
  return [
    'note',
    note.episode_id,
    note.note_type || 'other',
    (note.topic || '').toLowerCase().trim().replace(/\s+/g, '_').slice(0, 40),
    note.source_timestamp || 0
  ].join('__');
}

function classifyPick(pick) {
  const text = `${pick.episode_title || ''} ${pick.market || ''} ${pick.rationale || ''}`.toLowerCase();
  if (SURVIVOR_PICKEM_MARKETS.has(pick.market)) return 'survivor_pickem_pick';
  if (NON_FUTURES_BETTING_MARKETS.has(pick.market)) return 'non_futures_betting';
  if (FUTURES_MARKETS.has(pick.market)) return 'futures_pick';
  if (text.includes('injury') || text.includes('acl') || text.includes('achilles') || text.includes('ligament') || pick.market === 'player_decision') return 'injury_intel';
  if (text.includes('training camp') || text.includes('camp') || text.includes('sic score')) return 'training_camp_intel';
  return 'market_context';
}

// Notes can matter to more than one consumer at once (e.g. a role-expansion
// note is both fantasy-relevant and futures context), so classifyNote returns
// an array of relevance tags rather than a single lane.
function classifyNote(note) {
  const tags = new Set(NOTE_TYPE_TAG_MAP[note.note_type] || ['market_context']);
  const text = `${note.topic || ''} ${note.summary || ''} ${note.quote || ''}`.toLowerCase();
  if (text.includes('injury') || text.includes('acl') || text.includes('achilles') || text.includes('ligament')) tags.add('injury_intel');
  if (text.includes('training camp') || text.includes('camp') || text.includes('sic score')) tags.add('training_camp_intel');
  if (text.includes('fantasy') || text.includes('target share') || text.includes('breakout') || text.includes('bust') || text.includes('waiver')) tags.add('fantasy_intel');
  if (text.includes('trade') || text.includes('depth chart') || text.includes('coaching staff') || text.includes('signed') || text.includes('released') || text.includes('cut from')) tags.add('roster_transaction_intel');
  if (text.includes('survivor') || text.includes("pick'em") || text.includes('pickem') || text.includes('pick em')) tags.add('survivor_pickem_intel');
  return Array.from(tags);
}

function defaultReviewStatus(pick) {
  if (isRejectedDispute(pick.disputed)) return 'reject';
  if (pick.human_verification?.verified) {
    return pick.item_lane === 'futures_pick' ? PROMOTED_LOCAL_INTEL_STATUS : 'context_only';
  }
  if (pick.review_flags.includes('non_futures_market')) return 'context_only';
  if (pick.review_flags.length > 0) return 'needs_review';
  return 'pending_review';
}

function isRejectedDispute(disputed) {
  if (!disputed || disputed.resolved !== true) return false;
  const text = [disputed.status, disputed.reason, disputed.action]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes('reject')
    || text.includes('inaccurate')
    || text.includes('fabricat')
    || text.includes('out of scope');
}

function reviewFlags(pick) {
  const flags = [];
  if (!VALID_TEAMS.has(pick.team)) flags.push('invalid_team');
  if (!pick.market || pick.market === 'general') flags.push('unclear_market');
  if (pick.market && !FUTURES_MARKETS.has(pick.market)) flags.push('non_futures_market');
  if (!pick.side || pick.side === 'UNKNOWN') flags.push('unclear_side');
  if (pick.market === 'win_total' && pick.line == null) flags.push('missing_win_total_line');
  if (pick.price == null) flags.push('missing_price');
  if (pick.price != null && !priceMentionedInQuote(pick.price, pick.supporting_quote)) flags.push('price_not_in_quote');
  if (suspiciousPriceShape(pick)) flags.push('suspicious_price_shape');
  if (!pick.source_timestamp) flags.push('missing_timestamp');
  if (!pick.rationale || pick.rationale.length < 20) flags.push('thin_rationale');
  return flags;
}

function defaultNoteReviewStatus(note) {
  return note.review_flags.length > 0 ? 'needs_review' : 'pending_review';
}

function noteReviewFlags(note) {
  const flags = [];
  if (!note.summary || note.summary.length < 15) flags.push('thin_summary');
  if ((!note.teams || note.teams.length === 0) && (!note.players || note.players.length === 0)) flags.push('no_team_or_player');
  if (!note.source_timestamp) flags.push('missing_timestamp');
  if (!note.quote) flags.push('missing_quote');
  return flags;
}

function observationReprocessReason(candidate, observation) {
  if (observation?.reprocess_required === true) {
    return observation.reprocess_reason || 'Gemini coverage was incomplete.';
  }

  const knownDuration = Number(candidate.duration_seconds || 0);
  const coverage = observation?.run?.coverage_assessment || observation?.coverage_assessment || {};
  if (coverage.suspected_incomplete === true) {
    return coverage.reason || 'Gemini coverage was incomplete.';
  }
  if (!knownDuration) return null;

  const durationUsed = Number(coverage.duration_used_for_check || 0);
  if (durationUsed > 0 && durationUsed < knownDuration * 0.85) {
    return `coverage check used ${durationUsed}s, but YouTube metadata says the video is ${knownDuration}s`;
  }
  const lastCovered = Number(coverage.last_covered_timestamp || 0);
  if (lastCovered > 0 && lastCovered < knownDuration * 0.85) {
    return `last covered timestamp ${lastCovered}s is short of known video duration ${knownDuration}s`;
  }
  const rankedListIssue = rankedQbCompletenessIssue(candidate, observation);
  if (rankedListIssue) return rankedListIssue;
  return null;
}

function persistObservationReprocess(obsPath, observation, reason) {
  if (!reason || observation?.reprocess_required === true) return;
  observation.reprocess_required = true;
  observation.reprocess_reason = reason;
  observation.quality_flags = [...new Set([
    ...(observation.quality_flags || []),
    reason.includes('ranked QB list coverage incomplete') ? 'ranked_qb_list_coverage_incomplete' : 'reprocess_required'
  ])];
  writeJson(obsPath, observation);
}

function loadObservation(candidate) {
  const obsPath = path.join(OBS_DIR, `${candidate.id}-shadow-youtube.json`);
  if (!fs.existsSync(obsPath)) return null;
  const observation = readJson(obsPath);
  const reprocessReason = observationReprocessReason(candidate, observation);
  persistObservationReprocess(obsPath, observation, reprocessReason);
  const picks = (observation.run?.extracted_picks || []).map(normalizePick);
  const notes = (observation.run?.analysis_notes || []).map(normalizeNote);
  return {
    candidate,
    observation,
    reprocessRequired: Boolean(reprocessReason),
    reprocessReason,
    humanVerification: observation.human_verification || null,
    picks,
    notes,
    obsPath
  };
}

function loadReviewStatus() {
  if (!fs.existsSync(REVIEW_STATUS_PATH)) {
    return {
      generated_at: new Date().toISOString(),
      status: 'local_review_status_only',
      guardrail: 'Human-editable local status file for the research/bench-scoring shadow-harness track. This file itself does not promote official picks or write production recommendations. A separate PRODUCTION review gate now exists (podcast_gemini_intel, migration 045, promoted via agents/podcast-gemini-intel.js --promote) — see docs/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md Phase 5. The two pipelines run in parallel and are not reconciled against each other.',
      items: []
    };
  }
  return readJson(REVIEW_STATUS_PATH);
}

function writeReviewStatus(existing, picks, notes) {
  const existingById = new Map((existing.items || []).map(item => [item.item_id, item]));

  const pickItems = picks.map(pick => {
    const prior = existingById.get(pick.item_id) || {};
    const derivedStatus = defaultReviewStatus(pick);
    const status = (pick.human_verification?.verified || isRejectedDispute(pick.disputed))
      ? derivedStatus
      : prior.status && prior.status !== 'pending_review'
        ? prior.status
        : derivedStatus;
    return {
      item_id: pick.item_id,
      item_type: 'pick',
      status,
      item_lane: pick.item_lane,
      episode_id: pick.episode_id,
      episode_title: pick.episode_title,
      team: pick.team,
      market: pick.market,
      side: pick.side,
      line: pick.line,
      price: pick.price,
      week: pick.week ?? null,
      source_timestamp: pick.source_timestamp,
      review_flags: pick.review_flags,
      supporting_quote: pick.supporting_quote || '',
      human_verification: pick.human_verification || null,
      disputed: pick.disputed || null,
      legacy_review_match: prior.legacy_review_match || pick.legacy_review_match || null,
      human_review_decision: prior.human_review_decision || pick.human_review_decision || null,
      reviewer_notes: prior.reviewer_notes || '',
      updated_at: prior.updated_at || null
    };
  });

  const noteItems = (notes || []).map(note => {
    const prior = existingById.get(note.item_id) || {};
    const status = prior.status && prior.status !== 'pending_review'
      ? prior.status
      : defaultNoteReviewStatus(note);
    return {
      item_id: note.item_id,
      item_type: 'note',
      status,
      relevance_tags: note.relevance_tags,
      episode_id: note.episode_id,
      episode_title: note.episode_title,
      note_type: note.note_type,
      teams: note.teams,
      players: note.players,
      topic: note.topic,
      summary: note.summary,
      speaker: note.speaker,
      source_timestamp: note.source_timestamp,
      quote: note.quote,
      confidence: note.confidence,
      review_flags: note.review_flags,
      reviewer_notes: prior.reviewer_notes || '',
      updated_at: prior.updated_at || null
    };
  });

  const acceptedPickItems = pickItems.filter((item) => item.status === PROMOTED_LOCAL_INTEL_STATUS && !isForbiddenYoutubeEpisode(item));
  const acceptedNoteItems = noteItems.filter((item) => item.status === PROMOTED_LOCAL_INTEL_STATUS && !isForbiddenYoutubeEpisode(item));
  const acceptedCohort = buildYoutubeCohort({ items: acceptedPickItems, notes: acceptedNoteItems });
  const payload = {
    generated_at: new Date().toISOString(),
    status: 'local_review_status_only',
    guardrail: 'Human-editable local status file. This does not promote official picks or write production recommendations.',
    allowed_statuses: ['pending_review', 'needs_review', 'context_only', PROMOTED_LOCAL_INTEL_STATUS, 'reject'],
    accepted_cohort: acceptedCohort,
    items: [...pickItems, ...noteItems]
  };
  writeJson(REVIEW_STATUS_PATH, payload);
  return payload;
}

if (!fs.existsSync(CANDIDATES_PATH)) {
  throw new Error(`Missing candidates file: ${CANDIDATES_PATH}`);
}

const candidates = readJson(CANDIDATES_PATH).episodes || [];
const futuresCandidates = candidates
  .filter(candidate => candidate.gemini_futures_eligible)
  .sort((a, b) => (b.futures_score || 0) - (a.futures_score || 0));
const rows = futuresCandidates.map(loadObservation).filter(Boolean);
const missing = futuresCandidates.filter(candidate => !fs.existsSync(path.join(OBS_DIR, `${candidate.id}-shadow-youtube.json`)));
const reprocessRows = rows.filter(row => row.reprocessRequired);
const usableRows = rows.filter(row => !row.reprocessRequired);

const allPicks = [];
for (const row of usableRows) {
  const quoteAssignments = assignQuotesForRow(row);
  row.picks.forEach((pick, pickIndex) => {
    const supportingQuote = quoteAssignments[pickIndex];
    const rowPick = {
      episode_id: row.candidate.id,
      episode_title: row.candidate.title,
      show: row.candidate.show,
      video_url: row.candidate.url,
      human_verification: row.humanVerification,
      timestamp_url: youtubeTimestamp(row.candidate.url, pick.source_timestamp),
      ...pick,
      supporting_quote: supportingQuote?.quote || '',
      supporting_quote_topic: supportingQuote?.topic || '',
      supporting_quote_timestamp: supportingQuote?.timestamp ?? null,
      supporting_quote_delta_seconds: supportingQuote?.delta ?? null
    };
    rowPick.review_flags = reviewFlags(rowPick);
    allPicks.push(rowPick);
  });
}

const duplicateKeys = new Map();
for (const pick of allPicks) {
  const key = [pick.team, pick.market, pick.side, pick.line ?? '', pick.price ?? ''].join('|');
  duplicateKeys.set(key, (duplicateKeys.get(key) || 0) + 1);
}
for (const pick of allPicks) {
  const key = [pick.team, pick.market, pick.side, pick.line ?? '', pick.price ?? ''].join('|');
  if ((duplicateKeys.get(key) || 0) > 1) pick.review_flags.push('duplicate_candidate');
}

for (const pick of allPicks) {
  pick.item_id = stablePickId(pick);
  pick.item_lane = classifyPick(pick);
}

const allNotes = [];
for (const row of usableRows) {
  for (const note of row.notes) {
    const rowNote = {
      episode_id: row.candidate.id,
      episode_title: row.candidate.title,
      show: row.candidate.show,
      video_url: row.candidate.url,
      timestamp_url: youtubeTimestamp(row.candidate.url, note.source_timestamp),
      ...note
    };
    rowNote.review_flags = noteReviewFlags(rowNote);
    allNotes.push(rowNote);
  }
}

for (const note of allNotes) {
  note.item_id = stableNoteId(note);
  note.relevance_tags = classifyNote(note);
}

const existingReviewStatus = loadReviewStatus();
const reviewStatus = writeReviewStatus(existingReviewStatus, allPicks, allNotes);

const pickLaneCounts = allPicks.reduce((acc, pick) => {
  acc[pick.item_lane] = (acc[pick.item_lane] || 0) + 1;
  return acc;
}, {});
const flagCounts = allPicks.reduce((acc, pick) => {
  for (const flag of pick.review_flags) acc[flag] = (acc[flag] || 0) + 1;
  return acc;
}, {});
const noteTagCounts = allNotes.reduce((acc, note) => {
  for (const tag of note.relevance_tags) acc[tag] = (acc[tag] || 0) + 1;
  return acc;
}, {});
const noteFlagCounts = allNotes.reduce((acc, note) => {
  for (const flag of note.review_flags) acc[flag] = (acc[flag] || 0) + 1;
  return acc;
}, {});
// Combined lane/tag view so the weekly report surfaces note volume alongside
// pick volume in one place (Phase 3 step 5); pickLaneCounts above stays
// available separately for pure pick-only breakdowns.
const laneCounts = { ...pickLaneCounts };
for (const [tag, count] of Object.entries(noteTagCounts)) {
  laneCounts[tag] = (laneCounts[tag] || 0) + count;
}

const summary = {
  generated_at: new Date().toISOString(),
  status: 'local_review_only',
  guardrail: 'This local shadow-harness track requires human review before anything is treated as a real pick. For actual production promotion, see podcast_gemini_intel (migration 045) and agents/podcast-gemini-intel.js --promote (docs/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md Phase 5) -- a separate, real review gate this local JSON file does not itself enforce.',
  futures_candidates: futuresCandidates.length,
  observed_episodes: rows.length,
  usable_observed_episodes: usableRows.length,
  reprocess_required_observations: reprocessRows.length,
  missing_observations: missing.length,
  total_extracted_picks: allPicks.length,
  flagged_picks: allPicks.filter(pick => pick.review_flags.length > 0).length,
  item_lane_counts: laneCounts,
  pick_lane_counts: pickLaneCounts,
  review_flag_counts: flagCounts,
  total_analysis_notes: allNotes.length,
  flagged_notes: allNotes.filter(note => note.review_flags.length > 0).length,
  note_relevance_tag_counts: noteTagCounts,
  note_review_flag_counts: noteFlagCounts,
  accepted_cohort: reviewStatus.accepted_cohort,
  total_cost_usd: Number(rows.reduce((sum, row) => sum + Number(row.observation.run?.estimated_cost_usd || 0), 0).toFixed(6)),
  average_latency_ms: rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.observation.run?.latency_ms || 0), 0) / rows.length) : 0
};

const report = {
  ...summary,
  missing,
  reprocess_required: reprocessRows.map(row => ({
    id: row.candidate.id,
    show: row.candidate.show,
    title: row.candidate.title,
    url: row.candidate.url,
    reason: row.reprocessReason || 'Gemini coverage was incomplete.',
    coverage_assessment: row.observation.run?.coverage_assessment || null
  })),
  episodes: usableRows.map(row => ({
    id: row.candidate.id,
    show: row.candidate.show,
    title: row.candidate.title,
    url: row.candidate.url,
    futures_score: row.candidate.futures_score,
    cost_usd: row.observation.run?.estimated_cost_usd || 0,
    latency_ms: row.observation.run?.latency_ms || 0,
    extracted_pick_count: row.picks.length,
    extracted_note_count: row.notes.length,
    no_pick_context: row.picks.length === 0 ? 'No explicit betting picks extracted; review as contextual intel only.' : null
  })),
  picks: allPicks,
  notes: allNotes
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(DOC_DIR, { recursive: true });
const jsonOut = path.join(REPORT_DIR, 'youtube-futures-intel-review-latest.json');
const mdOut = path.join(DOC_DIR, 'youtube-futures-intel-review-latest.md');
writeJson(jsonOut, report);

const lines = [
  '# YouTube Futures Intel Review',
  '',
  `Generated: ${summary.generated_at}`,
  '',
  '> Local review only. Do not promote Gemini-derived observations to official picks or production recommendations without human review.',
  '',
  '## Summary',
  '',
  `- Futures candidates: ${summary.futures_candidates}`,
  `- Observed episodes: ${summary.observed_episodes}`,
  `- Usable observed episodes: ${summary.usable_observed_episodes}`,
  `- Reprocess-required observations: ${summary.reprocess_required_observations}`,
  `- Missing observations: ${summary.missing_observations}`,
  `- Extracted picks/leads: ${summary.total_extracted_picks}`,
  `- Flagged picks/leads: ${summary.flagged_picks}`,
  `- Analysis notes: ${summary.total_analysis_notes}`,
  `- Flagged notes: ${summary.flagged_notes}`,
  `- Accepted cohort fingerprint: ${summary.accepted_cohort.fingerprint_sha256}`,
  `- Total Gemini cost: $${summary.total_cost_usd}`,
  `- Average latency: ${summary.average_latency_ms} ms`,
  `- Review status file: ${path.relative(ROOT, REVIEW_STATUS_PATH)}`,
  '',
  '## Lane Counts',
  '',
  '_Combined pick lanes + note relevance tags. See Note Tag Counts below for the notes-only breakdown._',
  '',
  '| Lane | Count |',
  '|---|---:|',
  ...Object.entries(summary.item_lane_counts).sort(([a], [b]) => a.localeCompare(b)).map(([lane, count]) => `| ${lane} | ${count} |`),
  '',
  '## Flag Counts',
  '',
  '| Flag | Count |',
  '|---|---:|',
  ...Object.entries(summary.review_flag_counts).sort(([a], [b]) => a.localeCompare(b)).map(([flag, count]) => `| ${flag} | ${count} |`),
  '',
  '## Note Tag Counts',
  '',
  '| Tag | Count |',
  '|---|---:|',
  ...Object.entries(summary.note_relevance_tag_counts).sort(([a], [b]) => a.localeCompare(b)).map(([tag, count]) => `| ${tag} | ${count} |`),
  '',
  '## Episode Coverage',
  '',
  '| Score | Picks | Notes | Cost | Episode | URL |',
  '|---:|---:|---:|---:|---|---|',
  ...report.episodes.map(ep => `| ${ep.futures_score ?? ''} | ${ep.extracted_pick_count} | ${ep.extracted_note_count} | $${Number(ep.cost_usd).toFixed(5)} | ${mdCell(ep.title)} | ${ep.url} |`),
  '',
  '## Extracted Picks And Leans',
  '',
  '| Lane | Episode | Team | Market | Side | Line | Price | Week | Speaker | Time | Flags | Quote | Rationale |',
  '|---|---|---|---|---|---:|---:|---:|---|---|---|---|---|',
  ...allPicks.map(pick => `| ${pick.item_lane} | ${mdCell(pick.episode_title)} | ${pick.team} | ${pick.market} | ${pick.side} | ${pick.line ?? ''} | ${priceText(pick.price)} | ${pick.week ?? ''} | ${mdCell(pick.speaker)} | [${pick.source_timestamp}s](${pick.timestamp_url}) | ${pick.review_flags.join(', ')} | ${mdCell(pick.supporting_quote)} | ${mdCell(pick.rationale)} |`),
  '',
  '## Analysis & Context Notes',
  '',
  allNotes.length > 0
    ? '| Tags | Episode | Note Type | Teams | Players | Speaker | Time | Confidence | Flags | Summary | Quote |'
    : '_No analysis notes extracted yet — re-run episodes against the Phase 1 schema (see docs/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md Phase 4) to populate this section._',
  ...(allNotes.length > 0 ? [
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...allNotes.map(note => `| ${note.relevance_tags.join(', ')} | ${mdCell(note.episode_title)} | ${note.note_type} | ${mdCell((note.teams || []).join(', '))} | ${mdCell((note.players || []).join(', '))} | ${mdCell(note.speaker)} | [${note.source_timestamp}s](${note.timestamp_url}) | ${note.confidence} | ${note.review_flags.join(', ')} | ${mdCell(note.summary)} | ${mdCell(note.quote)} |`)
  ] : [])
];

if (missing.length > 0) {
  lines.push('', '## Missing Observations', '');
  for (const item of missing) lines.push(`- ${item.id}: ${item.title} (${item.url})`);
}

if (report.reprocess_required.length > 0) {
  lines.push('', '## Reprocess Required', '');
  lines.push('These observations were saved for auditability but are excluded from extracted picks/notes until reprocessed.');
  lines.push('');
  for (const item of report.reprocess_required) {
    lines.push(`- ${item.id}: ${item.title} (${item.url})`);
    lines.push(`  - Reason: ${item.reason}`);
  }
}

fs.writeFileSync(mdOut, `${lines.join('\n')}\n`);
console.log(`Wrote YouTube futures review JSON: ${jsonOut}`);
console.log(`Wrote YouTube futures review Markdown: ${mdOut}`);
console.log(`Wrote YouTube futures review status: ${REVIEW_STATUS_PATH}`);
console.log(`Review summary: episodes=${summary.observed_episodes} usable=${summary.usable_observed_episodes} reprocess=${summary.reprocess_required_observations} picks=${summary.total_extracted_picks} flagged=${summary.flagged_picks} notes=${summary.total_analysis_notes} flagged_notes=${summary.flagged_notes} missing=${summary.missing_observations}`);
