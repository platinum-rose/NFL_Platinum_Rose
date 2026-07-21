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
      const gapAfter  = oStart - Number(own.end ?? 0);
      return (gapBefore >= 0 && gapBefore <= adjacentGapSec) || (gapAfter >= 0 && gapAfter <= adjacentGapSec);
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
export function buildSpeakerMap(utterances, showName, experts = EXPERTS) {
  const config = loadShowConfig(showName);
  if (!config) return {};

  const { source, introWindowSec, fuzzyThreshold } = config;
  const threshold = fuzzyThreshold * 100; // fuzzball scores are 0-100, config is 0-1

  const showExperts = experts.filter(e => e.isShow === false && e.source === source);

  // Unique speaker ids in order of first appearance.
  const speakerIds = [];
  for (const u of utterances) {
    if (u.speaker && !speakerIds.includes(u.speaker)) speakerIds.push(u.speaker);
  }

  const assignedExperts = new Set();
  const mapping = {};

  for (const speakerId of speakerIds) {
    const ownUtts = utterances.filter(u => u.speaker === speakerId && (u.start ?? 0) <= introWindowSec);
    if (!ownUtts.length) { mapping[speakerId] = 'Guest'; continue; }

    const windowText = ownUtts.map(u => u.text ?? '').join(' ').toLowerCase();
    if (!windowText.trim()) { mapping[speakerId] = 'Guest'; continue; }

    let bestName = null;
    let bestScore = 0;

    for (const expert of showExperts) {
      if (assignedExperts.has(expert.name)) continue; // already claimed by an earlier speaker
      for (const alias of expert.aliases ?? []) {
        const score = partialRatio(alias, windowText);
        if (score > bestScore) {
          bestScore = score;
          bestName = expert.name;
        }
      }
    }

    if (bestName && bestScore >= threshold) {
      mapping[speakerId] = bestName;
      assignedExperts.add(bestName);
    } else {
      mapping[speakerId] = 'Guest';
    }
  }

  return mapping;
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
