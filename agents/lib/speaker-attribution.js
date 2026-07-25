// agents/lib/speaker-attribution.js
// ═══════════════════════════════════════════════════════════════════════════════
// Maps AssemblyAI's anonymous diarized speaker labels ('A', 'B', ...) to real
// host names for the 3 multi-host shows (Sharp or Square, Even Money,
// The Favorites) — see podcast_feeds.needs_diarization (migration 036).
//
// This is a JS port of packages/m6-podcast-service/python/nfl_podcast/
// speaker_map.py's fuzzy-alias-matching approach (same algorithm family:
// rapidfuzz.partial_ratio there, fuzzball.partial_ratio here — both are
// fuzzywuzzy-lineage partial-ratio implementations). That Python module was
// written for a different upstream (WhisperX/pyannote diarization on M6); the
// matching logic itself has no GPU/diarization-source dependency, so it ports
// cleanly on top of AssemblyAI's utterances instead.
//
// Roster source: src/lib/experts.js (EXPERTS) — the app's single source of
// truth for expert names/aliases/sources, already used for pick attribution
// elsewhere. Deliberately NOT re-reading experts_roster.json (the Python
// module's copy) to avoid two rosters drifting apart; if that JSON and
// experts.js disagree in the future, experts.js wins for anything reachable
// from Node.
//
// Per-show tuning (intro window length, fuzzy match threshold) mirrors
// packages/m6-podcast-service/python/nfl_podcast/show_hosts.json's values for
// the 3 shows this module actually needs to handle.
// ═══════════════════════════════════════════════════════════════════════════════

import { partial_ratio as partialRatio } from 'fuzzball';
import { EXPERTS } from '../../src/lib/experts.js';

const ADJACENT_GAP_SEC = 15.0;
const GUEST_REPLY_GAP_SEC = 20.0;
export const AD_SPEAKER_LABEL = 'Ad/Commercial';
export const AD_COPY_RE = /\b(amazon|pharmacy|orderly\s*meds|orderlymeds|zepbound|tirzepatide|lilly\.com|pedigree|dog food|vitamin good bites|free delivery|healthcare|promo|bonus bet|terms and conditions|download the app|subscribe|youtube|apple podcasts|spotify|hard rock bet|gambling problem|iheart podcast|iheart ?radio app|guaranteed human|paid for by|must be 21|call 1-800|not a cash offer|wix|business idea|sign to take action|cash back deals|credit card rewards|apollo|grainger|american express|americanexpress\.com|mx gold|points are piling up|membership rewards|spinquest|spin quest|mcdonald'?s|refreshers|popping boba|free to play social casino|wherever you get your podcasts|podcast network|terms and points cap apply|zbiotics|use code|at checkout|topgolf|funpass|ally bank|member fdic|bank of america|b of a rewards|what would you like the power to do|t mobile|ookla|monthly bill credits|nhtsa|u\.s\. transportation secretary|nora jones|playing along|paul'?s best podcast|paul virzi|paul verze|will ferrell|big money players|first america|levels to this|tareka foster|sheryl swoopes|wnba analysis|alzheimer|burden of guilt)\b/i;

function normalizeAliasText(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function cleanIntroducedName(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/[.!?:;,"“”]+$/g, '')
    .replace(/^(?:mr|mrs|ms|dr)\.?\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractIntroducedGuestName(text) {
  const raw = String(text ?? '').replace(/\s+/g, ' ').trim();
  const patterns = [
    /\bwelcome to the show,?\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3})\b/i,
    /\bwelcome (?:in|on),?\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3})\b/i,
    /\b(?:joined|joining) (?:by|us|me)(?: today| now| on the show| for the show)?(?: is|,)?\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3})\b/i,
    /\b(?:first time guest|guest) (?:on|for) (?:the )?show,?\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3})\b/i,
    /\b([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}),?\s+(?:fly in|would you like to|keeping us in check)\b/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match) continue;
    const name = cleanIntroducedName(match[1]);
    if (name && !/\b(show|podcast|episode|today|thanks|welcome)\b/i.test(name)) return name;
  }
  return null;
}

function inferIntroducedGuests(utterances, mapping, introWindowSec) {
  const ordered = utterances
    .filter(u => u.speaker && Number(u.start ?? 0) <= introWindowSec + GUEST_REPLY_GAP_SEC)
    .slice()
    .sort((a, b) => Number(a.start ?? 0) - Number(b.start ?? 0));

  const out = { ...mapping };
  const usedNames = new Set(Object.values(out).filter(name => name && name !== 'Guest'));
  for (let i = 1; i < ordered.length; i += 1) {
    const current = ordered[i];
    if (out[current.speaker] !== 'Guest') continue;

    const previous = ordered[i - 1];
    if (!previous || previous.speaker === current.speaker) continue;
    if (!out[previous.speaker] || out[previous.speaker] === 'Guest') continue;

    const gap = Number(current.start ?? 0) - Number(previous.end ?? previous.start ?? 0);
    if (gap < 0 || gap > GUEST_REPLY_GAP_SEC) continue;

    const introducedName = extractIntroducedGuestName(previous.text);
    if (!introducedName || usedNames.has(introducedName)) continue;

    out[current.speaker] = introducedName;
    usedNames.add(introducedName);
  }
  return out;
}

function speakerStats(utterances) {
  const stats = new Map();
  for (const u of utterances) {
    const speaker = u.speaker;
    if (!speaker) continue;
    const current = stats.get(speaker) ?? { turns: 0, adTurns: 0, duration: 0, adDuration: 0 };
    const duration = Math.max(0, Number(u.end ?? u.start ?? 0) - Number(u.start ?? 0));
    const isAd = AD_COPY_RE.test(String(u.text ?? ''));
    current.turns += 1;
    current.duration += duration;
    if (isAd) {
      current.adTurns += 1;
      current.adDuration += duration;
    }
    stats.set(speaker, current);
  }
  return stats;
}

export function isAdOnlySpeaker(stat) {
  if (!stat || !stat.turns) return false;
  const turnRatio = stat.adTurns / stat.turns;
  const durationRatio = stat.duration > 0 ? stat.adDuration / stat.duration : turnRatio;
  return stat.adTurns > 0 && (
    turnRatio >= 0.67
    || durationRatio >= 0.67
    || (stat.adTurns >= 2 && durationRatio >= 0.5)
  );
}

export function markAdOnlySpeakers(utterances, mapping) {
  const stats = speakerStats(utterances);
  const out = { ...mapping };
  for (const [speaker, stat] of stats.entries()) {
    if (out[speaker] && out[speaker] !== 'Guest') continue;
    if (isAdOnlySpeaker(stat)) out[speaker] = AD_SPEAKER_LABEL;
  }
  return out;
}

function inferExpectedParticipants(utterances, mapping, expectedParticipants = []) {
  const expected = expectedParticipants
    .map((name) => String(name ?? '').trim())
    .filter(Boolean);
  if (!expected.length) return mapping;

  const usedNames = new Set(Object.values(mapping).filter(name => name && name !== 'Guest' && name !== AD_SPEAKER_LABEL));
  const out = { ...mapping };
  for (const [speaker, mappedName] of Object.entries(out)) {
    if (mappedName !== 'Guest') continue;
    const text = normalizeAliasText(utterances.filter(u => u.speaker === speaker).map(u => u.text ?? '').join(' '));
    if (!text) continue;
    for (const name of expected) {
      if (usedNames.has(name)) continue;
      const normalizedName = normalizeAliasText(name);
      const score = text.includes(normalizedName) ? 100 : partialRatio(normalizedName, text);
      if (score >= 92) {
        out[speaker] = name;
        usedNames.add(name);
        break;
      }
    }
  }
  return out;
}

function inferNamedReplyParticipants(utterances, mapping, expectedParticipants = []) {
  const expected = new Set(
    expectedParticipants
      .map((name) => String(name ?? '').trim())
      .filter(Boolean)
  );
  if (!expected.size) return mapping;

  const out = { ...mapping };
  const usedNames = new Set(Object.values(out).filter(name => name && name !== 'Guest' && name !== AD_SPEAKER_LABEL));
  const ordered = utterances
    .filter(u => u.speaker)
    .slice()
    .sort((a, b) => Number(a.start ?? 0) - Number(b.start ?? 0));

  for (let i = 1; i < ordered.length; i += 1) {
    const current = ordered[i];
    if (out[current.speaker] !== 'Guest') continue;

    const previous = ordered[i - 1];
    if (!previous || previous.speaker === current.speaker) continue;
    if (!out[previous.speaker] || out[previous.speaker] === 'Guest') continue;

    const introducedName = extractIntroducedGuestName(previous.text);
    if (!introducedName || !expected.has(introducedName) || usedNames.has(introducedName)) continue;

    const gap = Number(current.start ?? 0) - Number(previous.end ?? previous.start ?? 0);
    if (gap < 0 || gap > GUEST_REPLY_GAP_SEC) continue;

    out[current.speaker] = introducedName;
    usedNames.add(introducedName);
  }
  return out;
}

function inferKnownShowIntros(utterances, showName, mapping) {
  const out = { ...mapping };
  if (showName !== 'The Favorites') return out;

  for (const u of utterances) {
    const speaker = u.speaker;
    if (!speaker || out[speaker]) continue;
    const text = normalizeAliasText(u.text);
    if (
      text.includes('welcome to the favorites')
      && text.includes('my cohort kendra middleton')
    ) {
      out[speaker] = 'Brandon Kravitz';
    }
  }
  return out;
}

// Kept in sync by hand with show_hosts.json's 5 diarized shows (all of them
// except Warren Sharp / Sharp Football Analysis, which stays single-voice).
// CORRECTION 2026-07-20 (037_podcast_diarization_fix.sql): the first pass here
// only had 3 of these 5 -- BettingPros Podcast and Action Network Sports
// Betting were wrongly called "single-voice" despite src/lib/experts.js
// documenting both as rotating multi-analyst rosters. The Python scaffold
// (show_hosts.json) already had all 5 right; this was a JS-port miss, not a
// disagreement with the original design.
export const SHOW_CONFIG = {
  'Sharp or Square':              { source: 'Sharp or Square', introWindowSec: 300, fuzzyThreshold: 0.80 },
  'Even Money':                   { source: 'Even Money',      introWindowSec: 300, fuzzyThreshold: 0.82 },
  'The Favorites':                { source: 'The Favorites',   introWindowSec: 240, fuzzyThreshold: 0.82 },
  'BettingPros Podcast':          { source: 'BettingPros',     introWindowSec: 300, fuzzyThreshold: 0.82 },
  'Action Network Sports Betting': { source: 'Action Network', introWindowSec: 300, fuzzyThreshold: 0.82 },
};

export function loadShowConfig(showName) {
  return SHOW_CONFIG[showName] ?? null;
}

/**
 * Build a lowercased intro-window text blob for one speaker: their own
 * utterances within introWindowSec, plus any OTHER speaker's utterances
 * adjacent in time to one of this speaker's own turns (captures cross-
 * introductions like "joining us today is Seth Woolcock").
 */
export function buildPerSpeakerWindow(utterances, speakerId, introWindowSec, adjacentGapSec = ADJACENT_GAP_SEC) {
  const windowUtts = utterances.filter(u => (u.start ?? 0) <= introWindowSec);
  const ownUtts   = windowUtts.filter(u => u.speaker === speakerId);
  const otherUtts = windowUtts.filter(u => u.speaker !== speakerId);

  if (!ownUtts.length) return '';

  const adjacentTexts = [];
  const seen = new Set();
  for (const other of otherUtts) {
    const oStart = Number(other.start ?? 0);
    const oEnd   = Number(other.end ?? oStart);
    const isAdjacent = ownUtts.some(own => {
      const gapBefore = Number(own.start ?? 0) - oEnd;
      return gapBefore >= 0 && gapBefore <= adjacentGapSec;
    });
    if (isAdjacent) {
      const txt = other.text ?? '';
      if (txt && !seen.has(txt)) {
        adjacentTexts.push(txt);
        seen.add(txt);
      }
    }
  }

  const ownText = ownUtts.map(u => u.text ?? '').join(' ');
  return [ownText, ...adjacentTexts].join(' ').toLowerCase();
}

/**
 * Map AssemblyAI speaker labels -> expert names via fuzzy alias matching.
 *
 * @param {Array<{speaker: string, text: string, start: number, end: number}>} utterances
 * @param {string} showName  must match a key in SHOW_CONFIG
 * @param {Array} [experts]  override roster (defaults to EXPERTS from src/lib/experts.js)
 * @returns {Object<string,string>} e.g. { A: 'Chad Millman', B: 'Simon Hunter' }
 */
export function buildSpeakerMap(utterances, showName, experts = EXPERTS, options = {}) {
  const config = loadShowConfig(showName);
  if (!config) return {};

  const { source, introWindowSec, fuzzyThreshold } = config;
  const threshold = fuzzyThreshold * 100; // fuzzball scores are 0-100, config is 0-1

  const showExperts = experts.filter(e => e.isShow !== true && e.source === source);

  // Unique speaker ids in order of first appearance.
  const speakerIds = [];
  for (const u of utterances) {
    if (u.speaker && !speakerIds.includes(u.speaker)) speakerIds.push(u.speaker);
  }

  const scoreSpeaker = (windowText, assignedExperts) => {
    const normalizedWindowText = normalizeAliasText(windowText);
    if (!normalizedWindowText) return null;

    let bestName = null;
    let bestScore = 0;
    let bestPosition = Infinity;

    for (const expert of showExperts) {
      if (assignedExperts.has(expert.name)) continue; // already claimed by an earlier speaker
      for (const alias of expert.aliases ?? []) {
        const normalizedAlias = normalizeAliasText(alias);
        const aliasPosition = normalizedWindowText.indexOf(normalizedAlias);
        const score = aliasPosition >= 0
          ? 100
          : partialRatio(normalizedAlias, normalizedWindowText);
        const position = aliasPosition >= 0 ? aliasPosition : Infinity;
        if (score > bestScore || (score === bestScore && position < bestPosition)) {
          bestScore = score;
          bestPosition = position;
          bestName = expert.name;
        }
      }
    }

    return bestName && bestScore >= threshold
      ? { name: bestName, score: bestScore, position: bestPosition }
      : null;
  };

  const mapping = inferKnownShowIntros(utterances, showName, {});
  const assignedExperts = new Set(Object.values(mapping).filter(Boolean));
  const speakerWindows = new Map();

  for (const speakerId of speakerIds) {
    const ownUtts = utterances.filter(u => u.speaker === speakerId && (u.start ?? 0) <= introWindowSec);
    const ownText = ownUtts.map(u => u.text ?? '').join(' ').toLowerCase();
    const adjacentText = buildPerSpeakerWindow(utterances, speakerId, introWindowSec);
    const ownDuration = utterances
      .filter(u => u.speaker === speakerId)
      .reduce((sum, u) => sum + Math.max(0, Number(u.end ?? u.start ?? 0) - Number(u.start ?? 0)), 0);
    speakerWindows.set(speakerId, { ownText, adjacentText, hasOwnIntroTurns: ownUtts.length > 0, ownDuration });
  }

  // First let speakers claim names that appear in their own intro-window turns.
  // This prevents adjacent intro text from making a guest/co-host steal the
  // host's self-identification before the host label is processed.
  for (const speakerId of speakerIds) {
    if (mapping[speakerId]) continue;
    const { ownText, hasOwnIntroTurns } = speakerWindows.get(speakerId);
    if (!hasOwnIntroTurns) continue;

    const scored = scoreSpeaker(ownText, assignedExperts);
    if (scored) {
      mapping[speakerId] = scored.name;
      assignedExperts.add(scored.name);
    }
  }

  // Then use adjacent intro text for speakers who were introduced by someone
  // else ("back with Andrew Erickson" followed by Andrew answering "thanks").
  // Sort the candidates globally so pre-roll ad labels adjacent to the intro
  // do not steal an expert from a much larger conversation speaker label.
  const adjacentCandidates = [];
  for (const speakerId of speakerIds) {
    if (mapping[speakerId]) continue;
    const { adjacentText, hasOwnIntroTurns, ownDuration } = speakerWindows.get(speakerId);
    if (!hasOwnIntroTurns) continue;

    const scored = scoreSpeaker(adjacentText, assignedExperts);
    if (scored) adjacentCandidates.push({ speakerId, ...scored, ownDuration });
  }

  adjacentCandidates.sort((a, b) => (
    b.score - a.score
    || b.ownDuration - a.ownDuration
    || a.position - b.position
    || speakerIds.indexOf(a.speakerId) - speakerIds.indexOf(b.speakerId)
  ));

  for (const candidate of adjacentCandidates) {
    if (mapping[candidate.speakerId]) continue;
    if (assignedExperts.has(candidate.name)) continue;
    mapping[candidate.speakerId] = candidate.name;
    assignedExperts.add(candidate.name);
  }

  for (const speakerId of speakerIds) {
    if (!mapping[speakerId]) {
      mapping[speakerId] = 'Guest';
    }
  }

  const withIntroducedGuests = inferIntroducedGuests(utterances, mapping, introWindowSec);
  const withMetadataGuests = inferExpectedParticipants(utterances, withIntroducedGuests, options.expectedParticipants);
  const withNamedReplies = inferNamedReplyParticipants(utterances, withMetadataGuests, options.expectedParticipants);
  return markAdOnlySpeakers(utterances, withNamedReplies);
}

/** Replace each utterance's speaker id with its resolved name. Unmapped ids are left as-is. */
export function applySpeakerMap(utterances, speakerMap) {
  return utterances.map(u => ({
    ...u,
    speaker: speakerMap[u.speaker] ?? u.speaker ?? 'Unknown',
  }));
}

/** Format utterances as "[M:SS] Speaker: text" lines for LLM extraction prompts. */
export function buildLabeledTranscript(utterances) {
  const lines = [];
  for (const u of utterances) {
    const text = (u.text ?? '').trim();
    if (!text) continue;
    const spk = u.speaker ?? 'Unknown';
    const ts = Number(u.start ?? 0);
    const m = Math.floor(ts / 60);
    const s = Math.floor(ts % 60);
    lines.push(`[${m}:${String(s).padStart(2, '0')}] ${spk}: ${text}`);
  }
  return lines.join('\n');
}
