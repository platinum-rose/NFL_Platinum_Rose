#!/usr/bin/env node
// Build offline, transcript-grounded podcast deep dives from exported diarized
// JSON. No database, model, or API calls.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSpeakerMap, applySpeakerMap, AD_SPEAKER_LABEL, AD_COPY_RE } from '../agents/lib/speaker-attribution.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE_DIR = path.join(ROOT, 'data', 'podcasts', 'm6-diarized-all');
const SOURCE_DIR = path.resolve(ROOT, argValue('--source', DEFAULT_SOURCE_DIR));
const OUT_DIR = path.resolve(ROOT, argValue('--out', 'docs/podcast-transcript-deep-dives'));
const LINES_PATH = path.resolve(ROOT, argValue('--lines', 'data/sportsbooks/nfl-week1-lines-2026.json'));
const METADATA_PATH = path.resolve(ROOT, argValue('--metadata', 'data/podcasts/episode-metadata-overrides.json'));
const MIN_BEAT_SECONDS = Number(argValue('--min-beat-seconds', '70'));
const MAX_BEATS = Number(argValue('--max-beats', '48'));
let CURRENT_LINES = { games: [] };

const TEAM_ALIASES = {
  Cardinals: ['cardinals', 'arizona'],
  Falcons: ['falcons', 'atlanta'],
  Ravens: ['ravens', 'baltimore'],
  Bills: ['bills', 'buffalo'],
  Panthers: ['panthers', 'carolina'],
  Bears: ['bears', 'chicago'],
  Bengals: ['bengals', 'cincinnati'],
  Browns: ['browns', 'cleveland'],
  Cowboys: ['cowboys', 'dallas'],
  Broncos: ['broncos', 'denver'],
  Lions: ['lions', 'detroit'],
  Packers: ['packers', 'green bay'],
  Texans: ['texans', 'houston'],
  Colts: ['colts', 'indianapolis'],
  Jaguars: ['jaguars', 'jacksonville', 'jags'],
  Chiefs: ['chiefs', 'kansas city', 'mahomes'],
  Raiders: ['raiders', 'las vegas'],
  Chargers: ['chargers', 'los angeles chargers', 'bolts'],
  Rams: ['rams', 'los angeles rams'],
  Dolphins: ['dolphins', 'miami'],
  Vikings: ['vikings', 'minnesota'],
  Patriots: ['patriots', 'new england', 'pats'],
  Saints: ['saints', 'new orleans'],
  Giants: ['giants', 'new york giants'],
  Jets: ['jets', 'new york jets'],
  Eagles: ['eagles', 'philadelphia'],
  Steelers: ['steelers', 'pittsburgh'],
  '49ers': ['49ers', 'niners', 'san francisco'],
  Seahawks: ['seahawks', 'seattle'],
  Buccaneers: ['buccaneers', 'bucs', 'tampa bay'],
  Titans: ['titans', 'tennessee'],
  Commanders: ['commanders', 'washington'],
};

const MARKET_TOPICS = {
  'Super Bowl': ['super bowl', 'championship'],
  Conference: ['conference', 'afc', 'nfc'],
  Division: ['division', 'afc south', 'nfc east', 'afc west', 'nfc north'],
  Playoffs: ['playoff', 'postseason', 'number one seed', 'one seed'],
  'Win Totals': ['win total', 'season win', 'over under'],
  'Week 1': ['week one', 'week 1', 'opening', 'opener'],
  Spread: ['spread', 'against the spread', 'ats', 'laying', 'points'],
  Total: ['total', 'over', 'under'],
  Moneyline: ['money line', 'moneyline', 'outright'],
  MVP: ['mvp'],
  Awards: ['rookie of the year', 'offensive player', 'defensive player', 'comeback player'],
  Props: ['prop', 'passing yards', 'rushing yards', 'receiving yards', 'touchdowns', 'interceptions'],
  Draft: ['draft', 'rookie', 'combine'],
  Injuries: ['injury', 'injuries', 'healthy', 'health'],
  Schedule: ['schedule', 'rest advantage', 'travel'],
  Coaching: ['coach', 'coordinator', 'scheme', 'play caller'],
};

const MINDSET_RE = /\b(i think|i believe|i trust|i don't trust|for me|because|reason|concern|worry|fade|buy|back|like|love|hate|value|overvalued|undervalued|ceiling|floor|regress|regression|sharp|market)\b/i;
const PICK_RE = /\b(bet|pick|play|take|give me|lay|fade|back|over|under|moneyline|money line|to win|plus|odds|ticket|wager|number)\b/i;
const TIMING_CONJECTURE_RE = /\b(start(?:ing)?\s+(?:one|1)\s+and\s+(?:three|3)|start(?:ing)?\s+1-3|slow\s+start|slow\s+to\s+start|buy\s+after|better\s+(?:number|price|entry)|market\s+(?:panic|overreact|overreacts|overreaction)|see it before|before i start actually believing)\b/i;
const AD_RE = /\b(amazon|pharmacy|orderly\s*meds|orderlymeds|pedigree|dog food|vitamin good bites|free delivery|healthcare|promo|bonus bet|terms and conditions|download the app|subscribe|youtube|apple podcasts|spotify|hard rock bet|gambling problem|iheart podcast|paid for by|must be 21|call 1-800|not a cash offer|wix|apollo|grainger|american express|membership rewards|spinquest|spin quest|mcdonald'?s|refreshers|popping boba|free to play social casino|iheart ?radio app|wherever you get your podcasts|podcast network|terms and points cap apply)\b/i;

function argValue(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function htmlEsc(value) {
  return String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function mdCell(value) {
  return cleanText(value).replace(/\|/g, '\\|') || '-';
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 130) || 'episode';
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}` : `${m}:${String(rem).padStart(2, '0')}`;
}

function speakerDisplay(turn) {
  const raw = turn.raw_speaker ?? turn.original_speaker;
  const mapped = turn.speaker || 'Unknown';
  if (!raw || raw === mapped) return mapped;
  return `${mapped} (Speaker ${raw})`;
}

function sentenceSplit(text) {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map(cleanText)
    .filter((s) => s.length >= 24);
}

function countMatches(text, aliases) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const alias of aliases) {
    const safe = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    count += (lower.match(new RegExp(`\\b${safe}\\b`, 'g')) ?? []).length;
  }
  return count;
}

function detectTopics(text) {
  const lower = text.toLowerCase();
  const teams = Object.entries(TEAM_ALIASES)
    .map(([name, aliases]) => ({ name, count: countMatches(lower, aliases) }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 4)
    .map((t) => t.name);

  const markets = Object.entries(MARKET_TOPICS)
    .map(([name, aliases]) => ({ name, count: countMatches(lower, aliases) }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 4)
    .map((t) => t.name);

  return { teams, markets };
}

function topicKey(topics) {
  const primary = [...topics.teams, ...topics.markets].slice(0, 3);
  return primary.length ? primary.join(' / ') : 'General discussion';
}

function usefulTurn(turn) {
  const text = cleanText(turn.text);
  if (turn.speaker === AD_SPEAKER_LABEL) return false;
  if (!text || AD_RE.test(text) || AD_COPY_RE.test(text)) return false;
  return true;
}

function usefulSentence(sentence) {
  const text = cleanText(sentence);
  if (!text || AD_RE.test(text) || AD_COPY_RE.test(text)) return false;
  if (/^\W*$/.test(text)) return false;
  return true;
}

function visibleSpeakerEntries(speakerMap) {
  return Object.entries(speakerMap).filter(([, name]) => name !== AD_SPEAKER_LABEL);
}

function ignoredSpeakerEntries(speakerMap) {
  return Object.entries(speakerMap).filter(([, name]) => name === AD_SPEAKER_LABEL);
}

function normalizeHostName(show, host, title = '', episodeMetadata = null) {
  const showName = cleanText(show).toLowerCase();
  const hostName = cleanText(host);
  const titleName = cleanText(title).toLowerCase();
  if (hostName.toLowerCase() !== 'guest') return hostName || 'Unknown';

  const participants = (episodeMetadata?.expected_participants ?? []).map(cleanText).filter(Boolean);
  const nonDefaultSharpGuests = participants.filter((name) => !['Chad Millman', 'Simon Hunter'].includes(name));
  if (showName === 'sharp or square' && nonDefaultSharpGuests.length === 1) return nonDefaultSharpGuests[0];
  if (showName === 'sharp or square' && titleName.includes('ben solak')) return 'Ben Solak';
  if (showName === 'sharp or square') return 'Simon Hunter';
  return hostName || 'Unknown';
}

async function loadMetadataOverrides(filePath) {
  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    return Array.isArray(parsed.episodes) ? parsed.episodes : [];
  } catch {
    return [];
  }
}

function findMetadataOverride(overrides, episode) {
  const title = String(episode?.title ?? '').toLowerCase();
  return overrides.find((entry) => entry.episode_id === episode?.id)
    ?? overrides.find((entry) => entry.title && title === String(entry.title).toLowerCase())
    ?? null;
}

function mergeSmallBeats(beats) {
  const merged = [];
  for (const beat of beats) {
    const last = merged[merged.length - 1];
    const duration = Number(beat.end) - Number(beat.start);
    if (last && duration < MIN_BEAT_SECONDS && topicsCompatible(last.topics, beat.topics)) {
      last.turns.push(...beat.turns);
      last.end = beat.end;
      last.text = `${last.text} ${beat.text}`;
      last.topics = detectTopics(last.text);
      last.key = topicKey(last.topics);
    } else {
      merged.push(beat);
    }
  }
  return merged;
}

function sentenceTurns(turns) {
  return turns.flatMap((turn) => {
    const sentences = sentenceSplit(turn.text);
    if (!sentences.length) return [turn];
    const start = Number(turn.start) || 0;
    const end = Number(turn.end) || start;
    const span = Math.max(1, end - start);
    return sentences.map((sentence, index) => {
      const sentenceStart = start + (span * index / sentences.length);
      const sentenceEnd = start + (span * (index + 1) / sentences.length);
      return {
        ...turn,
        text: sentence,
        start: sentenceStart,
        end: sentenceEnd,
      };
    });
  });
}

function topicsCompatible(a, b) {
  const aTeams = a?.teams ?? [];
  const bTeams = b?.teams ?? [];
  if (!aTeams.length || !bTeams.length) return true;
  if (aTeams.length >= 2 && bTeams.some((team) => !aTeams.includes(team))) return false;
  if (bTeams.length >= 2 && aTeams.some((team) => !bTeams.includes(team))) return false;
  const overlap = bTeams.some((team) => aTeams.includes(team));
  if (overlap) return true;
  return aTeams.length < 2 && bTeams.length < 2;
}

function hasTeamDrift(currentTopics, nextTopics) {
  const currentTeams = currentTopics?.teams ?? [];
  const nextTeams = nextTopics?.teams ?? [];
  if (!currentTeams.length || !nextTeams.length) return false;
  if (currentTeams.length >= 2 && nextTeams.some((team) => !currentTeams.includes(team))) return true;
  if (nextTeams.length >= 2 && currentTeams.some((team) => !nextTeams.includes(team))) return true;
  if (nextTeams.some((team) => currentTeams.includes(team))) return false;
  return currentTeams.length >= 2 || nextTeams.length >= 2;
}

function buildBeats(turns) {
  const usable = sentenceTurns(turns).filter(usefulTurn);
  const beats = [];
  let current = null;

  for (const turn of usable) {
    const text = cleanText(turn.text);
    const topics = detectTopics(text);
    const key = topicKey(topics);

    if (!current) {
      current = { key, topics, turns: [turn], start: turn.start, end: turn.end, text };
      continue;
    }

    const lastDuration = Number(current.end) - Number(current.start);
    const sameTeam = topics.teams.some((team) => current.topics.teams.includes(team));
    const sameMarket = topics.markets.some((market) => current.topics.markets.includes(market));
    const driftedTeams = hasTeamDrift(current.topics, topics);
    const shouldContinue = !driftedTeams && (
      key === current.key ||
      sameTeam ||
      (sameMarket && lastDuration < 210) ||
      (lastDuration < MIN_BEAT_SECONDS && topicsCompatible(current.topics, topics))
    );

    if (shouldContinue) {
      current.turns.push(turn);
      current.end = turn.end;
      current.text = `${current.text} ${text}`;
      current.topics = detectTopics(current.text);
      current.key = topicKey(current.topics);
    } else {
      beats.push(current);
      current = { key, topics, turns: [turn], start: turn.start, end: turn.end, text };
    }
  }
  if (current) beats.push(current);

  const enriched = mergeSmallBeats(beats)
    .map(enrichBeat)
    .filter((beat) => {
      const hasNamedSpeaker = beat.speakers.some((speaker) => speaker !== 'Guest' && speaker !== 'Unknown');
      const hasSportsTopic = beat.topics.teams.length || beat.topics.markets.length;
      const hasSubstance = beat.mindset.length || beat.pickTalk.length || beat.representative.length;
      return hasSubstance && (hasNamedSpeaker || hasSportsTopic);
    });

  return mergeSameMatchupBeats(enriched)
    .map(enrichBeat)
    .filter((beat) => {
      const hasNamedSpeaker = beat.speakers.some((speaker) => speaker !== 'Guest' && speaker !== 'Unknown');
      const hasSportsTopic = beat.topics.teams.length || beat.topics.markets.length;
      const hasSubstance = beat.mindset.length || beat.pickTalk.length || beat.representative.length;
      return hasSubstance && (hasNamedSpeaker || hasSportsTopic);
    })
    .slice(0, MAX_BEATS);
}

function mergeSameMatchupBeats(beats) {
  const merged = [];
  const byMatchup = new Map();

  for (const beat of beats) {
    const key = matchupKey(beat.matchup);
    if (!key) {
      merged.push(rawBeat(beat));
      continue;
    }

    const existing = byMatchup.get(key);
    if (existing) {
      existing.turns.push(...beat.turns);
      existing.start = Math.min(existing.start, beat.start);
      existing.end = Math.max(existing.end, beat.end);
      existing.text = `${existing.text} ${beat.text}`;
      existing.topics = detectTopics(existing.text);
      existing.key = topicKey(existing.topics);
    } else {
      const row = rawBeat(beat);
      byMatchup.set(key, row);
      merged.push(row);
    }
  }

  return merged.sort((a, b) => Number(a.start) - Number(b.start));
}

function rawBeat(beat) {
  return {
    key: beat.key,
    topics: beat.topics,
    turns: [...beat.turns],
    start: beat.start,
    end: beat.end,
    text: beat.text,
  };
}

function matchupKey(matchup) {
  const teams = matchup?.teams ?? [];
  if (teams.length < 2) return '';
  return teams.slice(0, 2).map(normalizeTeam).sort().join('|');
}

function enrichBeat(beat) {
  const speakers = [...new Set(beat.turns.map(speakerDisplay).filter(Boolean))];
  const sentences = beat.turns
    .flatMap((turn) => sentenceSplit(turn.text).map((sentence) => ({ speaker: speakerDisplay(turn), sentence })))
    .filter((s) => usefulSentence(s.sentence));
  const quoteBuckets = buildQuoteBuckets(sentences);
  const { mindset, pickTalk, representative } = quoteBuckets;
  const conclusion = conclusionForBeat({ ...beat, pickTalk, mindset, representative });
  const matchup = inferMatchup({ ...beat, sentences, conclusion });

  return {
    ...beat,
    speakers,
    conclusion,
    matchup,
    marketComparison: compareCurrentLines(matchup),
    summary: summarizeBeat({ ...beat, speakers, mindset, pickTalk, representative, conclusion, matchup }),
    mindset,
    pickTalk,
    representative,
  };
}

function timingConjecturesFromTurns(turns) {
  const rows = [];
  const seen = new Set();
  for (const turn of turns.filter(usefulTurn)) {
    const fullText = cleanText(turn.text);
    const sentences = sentenceSplit(fullText);
    for (let i = 0; i < sentences.length; i += 1) {
      const sentence = sentences[i];
      const context = [sentences[i - 1], sentence, sentences[i + 1]].filter(Boolean).join(' ');
      if (!TIMING_CONJECTURE_RE.test(context)) continue;
      const topics = detectTopics(`${fullText} ${context}`);
      if (!topics.teams.length) continue;
      const subject = topics.teams[0];
      const trigger = timingTrigger(subject, context);
      const key = `${speakerDisplay(turn)}|${subject}|${trigger}|${formatTime(turn.start)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        speaker: speakerDisplay(turn),
        subject,
        market: timingMarket(topics),
        trigger,
        implication: timingImplication(subject, context),
        action: timingAction(context),
        time: formatTime(turn.start),
        quote: trimSentence(context, 260),
      });
    }
  }
  return rows.slice(0, 12);
}

function timingTrigger(subject, text) {
  const lower = cleanText(text).toLowerCase();
  if (/\bstart(?:ing)?\s+(?:one|1)\s+and\s+(?:three|3)\b|\bstart(?:ing)?\s+1-3\b/.test(lower)) return `${subject} start 1-3`;
  if (/\bslow\s+(?:start|to start)\b/.test(lower)) return `${subject} slow start`;
  if (/\bsee it before\b|\bbefore i start actually believing\b/.test(lower)) return `${subject} proof-of-concept early in season`;
  if (/\bmarket\s+(?:panic|overreact|overreacts|overreaction)\b/.test(lower)) return `${subject} market overreaction`;
  if (/\bbetter\s+(?:number|price|entry)\b|\bbuy\s+after\b/.test(lower)) return `${subject} better entry price`;
  return `${subject} conditional timing signal`;
}

function timingImplication(subject, text) {
  const lower = cleanText(text).toLowerCase();
  if (/\bstart(?:ing)?\s+(?:one|1)\s+and\s+(?:three|3)\b|\bslow\s+(?:start|to start)\b/.test(lower)) {
    return `Monitor ${subject} futures for a better entry if an early slow start pushes the market price out.`;
  }
  if (/\bsee it before\b|\bbefore i start actually believing\b/.test(lower)) {
    return `Wait for early evidence before treating the ${subject} futures case as buyable.`;
  }
  if (/\bbetter\s+(?:number|price|entry)\b|\bbuy\s+after\b/.test(lower)) {
    return `Wait for a more attractive ${subject} number before entering.`;
  }
  return `Track whether the condition changes the ${subject} futures entry price.`;
}

function timingAction(text) {
  const lower = cleanText(text).toLowerCase();
  if (/\bavoid\b|\bdo not bet\b|\bdon't bet\b/.test(lower)) return 'avoid';
  if (/\bwait\b|\bsee it before\b|\bbefore i start actually believing\b/.test(lower)) return 'wait';
  return 'monitor';
}

function timingMarket(topics) {
  const markets = topics.markets ?? [];
  return markets.find((market) => ['Super Bowl', 'Conference', 'Division', 'Playoffs', 'Win Totals'].includes(market))
    ?? markets[0]
    ?? 'Futures timing';
}

function summarizeBeat(beat) {
  const teams = beat.topics.teams;
  const markets = beat.topics.markets;
  const topicPhrase = teams.length || markets.length
    ? `${[...teams.slice(0, 3), ...markets.slice(0, 2)].join(', ')}`
    : 'general football context';
  const lead = beat.conclusion
    ? `The beat is mainly about ${topicPhrase}.`
    : `No firm pick surfaced in this beat; it is mostly context around ${topicPhrase}.`;
  const reasonSentence = reasonForBeat(beat, beat.conclusion?.sentence);
  const rationale = rationaleTags(beat.text);
  const rationalePhrase = rationale.length
    ? `Rationale themes: ${rationale.join(', ')}.`
    : '';
  const reasonPhrase = reasonSentence
    ? `Reasoning clue: ${reasonSentence.speaker} - ${trimSentence(reasonSentence.sentence, 240)}`
    : '';
  return [lead, reasonPhrase, rationalePhrase].filter(Boolean).join(' ');
}

function buildQuoteBuckets(sentences) {
  const used = new Set();
  const takeUnique = (candidates, max) => {
    const rows = [];
    for (const candidate of candidates) {
      const key = sentenceKey(candidate.sentence);
      if (!key || used.has(key)) continue;
      used.add(key);
      rows.push(candidate);
      if (rows.length >= max) break;
    }
    return rows;
  };

  const pickCandidates = sentences
    .filter((s) => PICK_RE.test(s.sentence))
    .sort((a, b) => quoteSpecificityScore(b.sentence) - quoteSpecificityScore(a.sentence));
  const mindsetCandidates = sentences
    .filter((s) => MINDSET_RE.test(s.sentence))
    .sort((a, b) => quoteSpecificityScore(b.sentence) - quoteSpecificityScore(a.sentence));
  const representativeCandidates = sentences
    .filter((s) => !AD_RE.test(s.sentence))
    .sort((a, b) => scoreSentence(b.sentence) - scoreSentence(a.sentence));

  const pickTalk = takeUnique(pickCandidates, 5);
  const mindset = takeUnique(mindsetCandidates, 5);
  const representative = takeUnique(representativeCandidates, 3);
  return { mindset, pickTalk, representative };
}

function sentenceKey(sentence) {
  return cleanText(sentence)
    .toLowerCase()
    .replace(/[^\w\s.+-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function quoteSpecificityScore(sentence) {
  const text = cleanText(sentence).toLowerCase();
  let score = scoreSentence(sentence);
  if (/\bgive me\b|\bi am taking\b|\bi'm taking\b|\bmy favorite bet\b/.test(text)) score += 8;
  if (/\bagainst the spread\b|\bats\b|\bkey number\b|\btotal\b|\bover\b|\bunder\b/.test(text)) score += 5;
  if (/\bi think\b|\bbecause\b|\bso\b|\bfor me\b/.test(text)) score += 2;
  return score;
}

function conclusionForBeat(beat) {
  const candidates = [...beat.pickTalk, ...beat.mindset, ...beat.representative]
    .filter((candidate) => candidate?.sentence)
    .map((candidate) => ({
      ...candidate,
      summary: conclusionSummary(candidate.sentence),
      score: conclusionScore(candidate.sentence),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.sentence.length - b.sentence.length);
  return candidates[0] ?? null;
}

function conclusionScore(sentence) {
  const text = cleanText(sentence).toLowerCase();
  if (isNonPickSentence(text)) return 0;
  let score = 0;
  if (/\bgive me\b|\bi am taking\b|\bi'm taking\b|\bi will take\b|\bmy play\b|\bmy favorite bet\b/.test(text)) score += 8;
  if (/\bto win outright\b|\bmoneyline\b|\bmoney line\b|\blaying\b|\btaking .* points\b|\bunder \d|\bover \d|\bto win the\b/.test(text)) score += 6;
  if (/\bfade\b|\bback\b|\blay\b|\bbet against\b/.test(text)) score += 4;
  if (/\bi think\b|\bfor me\b|\bthis one for me\b|\bmain argument\b/.test(text)) score += 2;
  if (text.length > 280) score -= 2;
  if (!PICK_RE.test(sentence)) score = 0;
  return score;
}

function conclusionSummary(sentence) {
  const text = cleanText(sentence);
  const lower = text.toLowerCase();
  const giveMe = lower.indexOf('give me ');
  if (giveMe >= 0) {
    return `Back ${cleanText(text.slice(giveMe + 'give me '.length)).replace(/^the\s+/i, '')}`;
  }
  const taking = text.match(/\b(?:i am|i'm)\s+taking\s+(.+)$/i);
  if (taking) return `Back ${cleanText(taking[1]).replace(/^the\s+/i, '')}`;
  const going = text.match(/\bi'?m\s+going\s+(under|over)\s+(.+)$/i);
  if (going) return `Play ${going[1].toLowerCase()} ${cleanText(going[2])}`;
  const favorite = text.match(/\bmy favorite bet\b.*?\bis\s+(.+)$/i);
  if (favorite) return `Preferred play: ${cleanText(favorite[1])}`;
  return text;
}

function isNonPickSentence(text) {
  if (/\bi'?m your host\b|\bback with\b|\bwelcome into\b|\btake us home\b|\bthanks for\b|\bsubscribe\b|\bdownload\b/.test(text)) return true;
  if (/^give me (?:a\s+)?(?:one|two|three|four|five|six|seven|eight|nine|ten|\d)/.test(text) && !/\b(over|under|points|cowboys|steelers|titans|texans|dolphins|vikings|packers|rams|49ers|jets|bills|raiders)\b/.test(text)) return true;
  return false;
}

function reasonForBeat(beat, conclusionSentence = '') {
  const candidates = [...beat.mindset, ...beat.representative]
    .filter((candidate) => candidate?.sentence && candidate.sentence !== conclusionSentence)
    .map((candidate) => ({ ...candidate, score: reasonScore(candidate.sentence) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.sentence.length - b.sentence.length);
  return candidates[0] ?? null;
}

function reasonScore(sentence) {
  const text = cleanText(sentence).toLowerCase();
  let score = 0;
  if (/\bbecause\b|\bthe fact that\b|\bmain argument\b|\bso for me\b|\bfor me\b|\bi think\b/.test(text)) score += 5;
  if (/\bnot going to\b|\bwithout\b|\bfavored\b|\bundervalued\b|\bovervalued\b|\bhome\b|\broad\b|\btrend\b|\bdefense\b|\bquarterback\b|\bcoach\b/.test(text)) score += 3;
  if (PICK_RE.test(sentence)) score += 1;
  if (text.length > 300) score -= 2;
  return score;
}

function inferMatchup(beat) {
  const candidates = (beat.sentences ?? [])
    .map((item) => {
      const teams = teamsInText(item.sentence);
      return {
        ...item,
        teams,
        score: matchupSentenceScore(item.sentence, teams, beat.conclusion?.sentence),
      };
    })
    .filter((item) => item.teams.length >= 2 && item.score > 0)
    .sort((a, b) => b.score - a.score || a.sentence.length - b.sentence.length);

  const best = candidates[0];
  const teams = best?.teams.slice(0, 2) ?? beat.topics.teams.slice(0, 2);
  if (teams.length < 2) return null;

  const spread = inferSpread(beat, teams, best?.sentence ?? '');
  const total = inferTotal(beat);
  return {
    teams,
    matchup: `${teams[0]} vs ${teams[1]}`,
    spread,
    total,
    source: best ? trimSentence(best.sentence, 180) : '',
  };
}

function matchupSentenceScore(sentence, teams, conclusionSentence = '') {
  if (teams.length < 2) return 0;
  const text = cleanText(sentence).toLowerCase();
  let score = 1;
  if (sentence === conclusionSentence) score += 5;
  if (/\bvs\.?\b|\bversus\b|\bagainst\b|\bmatchup\b|\bgame\b/.test(text)) score += 5;
  if (/\broad\b|\bhome\b|\bat\s+(?:the\s+)?[a-z]/.test(text)) score += 2;
  if (PICK_RE.test(sentence)) score += 2;
  if (/\bpreseason\b|\btraining camp\b|\bpractice\b|\bcollege\b|\bdraft\b/.test(text)) score -= 5;
  return score;
}

function teamsInText(text) {
  const found = Object.entries(TEAM_ALIASES)
    .map(([name, aliases]) => {
      const lower = String(text ?? '').toLowerCase();
      const positions = aliases
        .map((alias) => lower.indexOf(alias.toLowerCase()))
        .filter((pos) => pos >= 0);
      return positions.length ? { name, position: Math.min(...positions) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.position - b.position);
  return [...new Set(found.map((item) => item.name))];
}

function inferSpread(beat, teams, matchupSource = '') {
  const text = cleanText(beat.text);
  const lower = text.toLowerCase();
  const primaryContext = cleanText(`${matchupSource} ${beat.conclusion?.summary ?? ''}`).toLowerCase();
  const number = extractSpreadNumber(primaryContext) ?? extractSpreadNumber(lower);
  const side = inferSpreadSide(beat, teams);
  if (!number || !side) return null;
  const move = /\bmove(?:s)?\s+past\b|\bwell past\b/.test(lower)
    ? 'expected to move past the key number'
    : '';
  return {
    side,
    value: number,
    label: `${side} -${number}`,
    note: move,
  };
}

function extractSpreadNumber(lowerText) {
  if (/\bmoney\s*line\b|\bmoneyline\b|\bminus\s+\d{3,4}\b|-\d{3,4}\b/.test(lowerText)) return null;
  if (/\btotal(?:'s| is| at)?\b|\bover\/under\b/.test(lowerText) && /\bunder\b|\bover\b/.test(lowerText)) return null;
  const halfWord = lowerText.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+and\s+a\s+half\b/);
  const halfValue = halfWord ? wordNumber(halfWord[1]) + 0.5 : null;
  const fraction = lowerText.match(/\b([1-9]|1[0-9]|20)\s+1\/2\b/);
  const decimal = lowerText.match(/\b([1-9]|1[0-9]|20)\.5\b/);
  const integer = lowerText.match(/\b(?:laying|lay|taking|take|spread|points?|key number)\D{0,24}([1-9]|1[0-9]|20)\b/);
  const hasSpreadContext = /\bgive me\b|\blay(?:ing)?\b|\btaking\b|\bspread\b|\bpoints?\b|\bkey number\b|\bfield goal\b|\bagainst\b|\bagainst the spread\b|\bats\b/.test(lowerText);
  if (!hasSpreadContext) return null;
  if (halfValue) return String(halfValue);
  if (fraction) return `${fraction[1]}.5`;
  if (decimal) return decimal[0];
  if (/\bfield goal\b|\bthree\b/.test(lowerText) && /\bkey number\b|\bmove(?:s)?\s+past\b/.test(lowerText)) return '3';
  if (integer) return integer[1];
  return null;
}

function wordNumber(word) {
  return {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  }[word] ?? 0;
}

function inferSpreadSide(beat, teams) {
  const text = cleanText(`${beat.conclusion?.summary ?? ''} ${beat.text}`).toLowerCase();
  for (const team of teams) {
    if (teamMentionedAsBetSide(text, team)) return team;
  }
  for (const team of teams) {
    if (teamMentionedNearAction(text, team)) return team;
  }
  return teams[0] ?? null;
}

function teamMentionedAsBetSide(text, team) {
  const aliases = TEAM_ALIASES[team] ?? [team.toLowerCase()];
  for (const alias of aliases) {
    const safe = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const beforeTeam = new RegExp(`\\b(?:give me|back|take|taking|lay|laying|with|side here is probably with)\\b.{0,90}\\b${safe}\\b`, 'i');
    const afterTeam = new RegExp(`\\b${safe}\\b.{0,90}\\b(?:laying|minus|-[1-9]|favored|favorite)\\b`, 'i');
    if (beforeTeam.test(text) || afterTeam.test(text)) return true;
  }
  return false;
}

function teamMentionedNearAction(text, team) {
  const aliases = TEAM_ALIASES[team] ?? [team.toLowerCase()];
  for (const alias of aliases) {
    const idx = text.indexOf(alias.toLowerCase());
    if (idx < 0) continue;
    const window = text.slice(Math.max(0, idx - 90), idx + alias.length + 90);
    if (/\bgive me\b|\bback\b|\btake\b|\btaking\b|\blay\b|\blaying\b|\bwith\b|\bside here is probably with\b/.test(window)) return true;
  }
  return false;
}

function inferTotal(beat) {
  const lower = cleanText(beat.text).toLowerCase();
  const totalMatch = lower.match(/\b(?:total(?:'s| is| at)?|over\/under)\s+(?:at\s+)?(\d+\s+and\s+a\s+half|\d+(?:\.\d+)?)\b/);
  if (!totalMatch) return null;
  const value = totalMatch[1].replace(/\s+and\s+a\s+half/, '.5');
  const direction = /\bunder\b/.test(lower) ? 'Under' : /\bover\b/.test(lower) ? 'Over' : null;
  return {
    value,
    label: direction ? `${direction} ${value}` : value,
  };
}

function compareCurrentLines(matchup) {
  if (!matchup?.teams?.length) return null;
  const game = findCurrentLineGame(matchup.teams);
  if (!game) return null;
  const sources = game.sources ?? [];
  if (!sources.length) return null;
  const displaySource = sources.find((source) => normalizeBook(source.book) === 'oddschecker') ?? sources[0];

  const spreadSide = matchup.spread?.side ?? matchup.teams[0];
  const spread = normalizeSpreadForTeam(displaySource, spreadSide);
  const opponentSpread = normalizeOpponentSpread(displaySource, spreadSide);
  const total = Number.isFinite(Number(displaySource.total?.line))
    ? {
        line: Number(displaySource.total.line),
        over_odds: displaySource.total?.over_odds ?? null,
        under_odds: displaySource.total?.under_odds ?? null,
      }
    : null;

  return {
    matchup: game.matchup,
    spread_side: spreadSide,
    book: displaySource.book,
    as_of: displaySource.as_of ?? CURRENT_LINES.generated_at ?? null,
    source: displaySource.source ?? null,
    spread,
    opponent_spread: opponentSpread,
    total,
  };
}

function findCurrentLineGame(teams) {
  const normalized = new Set(teams.map((team) => normalizeTeam(team)));
  return (CURRENT_LINES.games ?? []).find((game) => {
    const gameTeams = [game.away, game.home].map((team) => normalizeTeam(team));
    return gameTeams.every((team) => normalized.has(team));
  }) ?? null;
}

function normalizeSpreadForTeam(source, team) {
  if (normalizeTeam(source.spread?.team) === normalizeTeam(team)) {
    return { team: source.spread.team, book: source.book, line: Number(source.spread.line), odds: source.spread.odds ?? null, source: source.source };
  }
  if (normalizeTeam(source.opponent_spread?.team) === normalizeTeam(team)) {
    return { team: source.opponent_spread.team, book: source.book, line: Number(source.opponent_spread.line), odds: source.opponent_spread.odds ?? null, source: source.source };
  }
  return null;
}

function normalizeOpponentSpread(source, team) {
  if (normalizeTeam(source.spread?.team) !== normalizeTeam(team)) {
    return { team: source.spread?.team, line: Number(source.spread?.line), odds: source.spread?.odds ?? null };
  }
  return { team: source.opponent_spread?.team, line: Number(source.opponent_spread?.line), odds: source.opponent_spread?.odds ?? null };
}

function normalizeBook(book) {
  return cleanText(book).toLowerCase();
}

function normalizeTeam(team) {
  return cleanText(team).toLowerCase();
}

function normalizeForAttribution(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTimestampSeconds(value) {
  const parts = cleanText(value).split(':').map(Number);
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  if (parts.length === 2) return (parts[0] * 60) + parts[1];
  return null;
}

function attributionTextScore(turn, needles) {
  const haystack = normalizeForAttribution(turn.text);
  let best = 0;
  for (const needle of needles) {
    if (!needle) continue;
    if (haystack.includes(needle) || needle.includes(haystack)) best = Math.max(best, 100);
    const tokens = [...new Set(needle.split(' ').filter((token) => token.length > 2))];
    if (tokens.length) {
      const hits = tokens.filter((token) => haystack.includes(token)).length;
      best = Math.max(best, (hits / tokens.length) * 80);
    }
  }
  return best;
}

function turnForTimestamp(turns, timestamp, needles = []) {
  const seconds = parseTimestampSeconds(timestamp);
  if (!Number.isFinite(seconds)) return null;
  const candidates = (turns ?? [])
    .filter((turn) =>
      turn.speaker
      && turn.speaker !== AD_SPEAKER_LABEL
      && seconds >= (Number(turn.start) - 90)
      && seconds <= (Number(turn.end) + 90)
    )
    .map((turn) => {
      const start = Number(turn.start) || 0;
      const end = Number(turn.end) || start;
      const midpoint = start + ((end - start) / 2);
      const textScore = attributionTextScore(turn, needles);
      const boundaryBonus = seconds >= start && seconds <= end ? 8 : 0;
      return {
        turn,
        score: textScore + boundaryBonus - (Math.abs(midpoint - seconds) / 20),
        textScore,
      };
    })
    .sort((a, b) => b.score - a.score);
  if (needles.length) return candidates.find((candidate) => candidate.textScore >= 35)?.turn ?? null;
  return candidates[0]?.turn ?? null;
}

function resolveFutureHostFromTranscript({ future, fallbackHost, turns }) {
  const quote = normalizeForAttribution(future.quote);
  const prediction = normalizeForAttribution(future.prediction);
  const needles = [quote, prediction].filter((value) => value.length >= 24);
  const timed = turnForTimestamp(turns, future.source_timestamp, needles);
  if (timed?.speaker && timed.speaker !== 'Guest' && timed.speaker !== 'Unknown') return timed.speaker;
  if (!needles.length) return fallbackHost;

  const match = (turns ?? []).find((turn) => {
    if (!turn.speaker || turn.speaker === AD_SPEAKER_LABEL) return false;
    const haystack = normalizeForAttribution(turn.text);
    return needles.some((needle) => haystack.includes(needle) || needle.includes(haystack));
  });

  return match?.speaker && match.speaker !== 'Guest' && match.speaker !== 'Unknown'
    ? match.speaker
    : fallbackHost;
}

function formatNumber(value) {
  return Number.isInteger(Number(value)) ? String(Number(value)) : String(Number(value).toFixed(1));
}

function formatSignedNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return `${n > 0 ? '+' : ''}${formatNumber(n)}`;
}

function formatOdds(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return `${n > 0 ? '+' : ''}${n}`;
}

function formatMarketSide(row) {
  if (!row?.team || !Number.isFinite(Number(row.line))) return '';
  const odds = formatOdds(row.odds);
  return `${row.team} ${formatSignedNumber(row.line)}${odds ? ` (${odds})` : ''}`;
}

function formatMarketTotal(total) {
  if (!total || !Number.isFinite(Number(total.line))) return '';
  const overOdds = formatOdds(total.over_odds);
  const underOdds = formatOdds(total.under_odds);
  const odds = overOdds || underOdds
    ? ` (${overOdds ? `O ${overOdds}` : 'O n/a'} / ${underOdds ? `U ${underOdds}` : 'U n/a'})`
    : '';
  return `total ${formatNumber(total.line)}${odds}`;
}

function trimSentence(sentence, maxLength) {
  const text = cleanText(sentence);
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}...`;
}

function rationaleTags(text) {
  const lower = String(text ?? '').toLowerCase();
  const tags = [];
  const checks = [
    ['market price/line movement', /\b(line|number|price|odds|market|move|key number|point margin)\b/],
    ['quarterback evaluation', /\b(qb|quarterback|dak|herbert|stroud|lamar|tua|rodgers|cam ward|kyler|mendoza|cousins)\b/],
    ['coaching and scheme', /\b(coach|coordinator|scheme|play caller|harbaugh|saleh|daboll|mccarthy|stefanski)\b/],
    ['injury and availability', /\b(injury|injuries|healthy|health|coming off|without|available|questionable)\b/],
    ['home/road and scheduling spot', /\b(home|road|travel|schedule|rest|international|division|divisional)\b/],
    ['defensive quality', /\b(defense|defensive|pressure|sack|secondary|corner|safety)\b/],
    ['offensive personnel', /\b(offense|offensive|receiver|running back|backfield|target|line|weapons)\b/],
    ['trend or regression angle', /\b(trend|regress|regression|last year|dating back|record|against the spread|ats)\b/],
  ];
  for (const [label, re] of checks) {
    if (re.test(lower)) tags.push(label);
    if (tags.length >= 3) break;
  }
  return tags;
}

function scoreSentence(sentence) {
  let score = sentence.length > 220 ? 0 : sentence.length / 40;
  if (MINDSET_RE.test(sentence)) score += 4;
  if (PICK_RE.test(sentence)) score += 3;
  const topics = detectTopics(sentence);
  score += topics.teams.length * 2 + topics.markets.length;
  return score;
}

function hostSummaryRows(hostSummaries, ep = null) {
  return hostSummaries.flatMap((summary) => (summary.futures ?? []).map((future) => ({
    host: resolveFutureHostFromTranscript({
      future,
      fallbackHost: normalizeHostName(ep?.show, future.host || summary.host, ep?.title, ep?.episodeMetadata),
      turns: ep?.turns ?? [],
    }),
    subject: cleanText(future.subject),
    market: cleanText(future.subject_market).replace(/_/g, ' '),
    lean: cleanText(future.lean),
    prediction: cleanText(future.prediction),
    quote: cleanText(future.quote),
  })));
}

function renderCurrentMarketMarkdown(comparison) {
  if (!comparison) return 'No current public-line snapshot loaded for this matchup.';
  const source = comparison.source?.startsWith('http')
    ? `[${comparison.book}](${comparison.source})`
    : comparison.book;
  const asOf = comparison.as_of ? ` as of ${comparison.as_of}` : '';
  const sides = [
    formatMarketSide(comparison.spread),
    formatMarketSide(comparison.opponent_spread),
    formatMarketTotal(comparison.total),
  ].filter(Boolean).join(', ');
  return [
    `${source}${asOf}:`,
    sides || 'line unavailable',
  ].filter(Boolean).join(' ');
}

function renderCurrentMarketHtml(comparison) {
  if (!comparison) return 'No current public-line snapshot loaded for this matchup.';
  const source = comparison.source?.startsWith('http')
    ? `<a href="${htmlEsc(comparison.source)}">${htmlEsc(comparison.book)}</a>`
    : htmlEsc(comparison.book);
  const asOf = comparison.as_of ? ` as of ${htmlEsc(comparison.as_of)}` : '';
  const sides = [
    formatMarketSide(comparison.spread),
    formatMarketSide(comparison.opponent_spread),
    formatMarketTotal(comparison.total),
  ].filter(Boolean).map(htmlEsc).join(', ');
  return [
    `${source}${asOf}:`,
    sides || 'line unavailable',
  ].filter(Boolean).join(' ');
}

function renderMarkdown(ep) {
  const rows = hostSummaryRows(ep.hostSummaries, ep);
  const mapped = visibleSpeakerEntries(ep.speakerMap).map(([label, name]) => `- ${label}: ${name}`).join('\n') || '- No speaker map available.';
  const ignored = ignoredSpeakerEntries(ep.speakerMap).map(([label]) => `- ${label}: ad/commercial audio ignored`).join('\n') || '- None classified as ad/commercial only.';
  const expected = (ep.episodeMetadata?.expected_participants ?? []).map((name) => `- ${name}`).join('\n') || '- No local metadata hint loaded.';
  const timing = (ep.timingConjectures ?? []).map((row) =>
    `- **${row.speaker}** (${row.time}) on ${mdCell(row.subject)} / ${mdCell(row.market)}: trigger: ${mdCell(row.trigger)}; implication: ${mdCell(row.implication)}; action: ${mdCell(row.action)}. Quote: "${mdCell(row.quote)}"`
  ).join('\n');
  const beatText = ep.beats.map((beat, index) => {
    const label = beat.key;
    const topics = [...beat.topics.teams, ...beat.topics.markets].join(', ') || 'General';
    const speakers = beat.speakers.join(', ') || 'Unknown';
    const conclusion = beat.conclusion
      ? `${beat.conclusion.speaker}: ${mdCell(beat.conclusion.summary)}`
      : 'No firm pick surfaced.';
    const matchup = beat.matchup ? beat.matchup.matchup : 'Not inferred.';
    const spread = beat.matchup?.spread
      ? `${beat.matchup.spread.label}${beat.matchup.spread.note ? `; ${beat.matchup.spread.note}` : ''}`
      : 'Not surfaced.';
    const total = beat.matchup?.total?.label ?? 'Not surfaced.';
    const currentMarket = renderCurrentMarketMarkdown(beat.marketComparison);
    const mindset = beat.mindset.map((m) => `  - ${m.speaker}: ${mdCell(m.sentence)}`).join('\n') || '  - None pulled.';
    const pickTalk = beat.pickTalk.map((p) => `  - ${p.speaker}: ${mdCell(p.sentence)}`).join('\n') || '  - None pulled.';
    const representative = beat.representative.map((r) => `  - ${r.speaker}: ${mdCell(r.sentence)}`).join('\n') || '  - None pulled.';
    return `### ${index + 1}. ${label} (${formatTime(beat.start)}-${formatTime(beat.end)})

Speakers: ${speakers}

Topics: ${topics}

Conclusion: ${conclusion}

Matchup: ${matchup}

Spread: ${spread}

Total: ${total}

Current market: ${currentMarket}

Summary: ${mdCell(beat.summary)}

Mindset / reasoning clues:
${mindset}

Betting language / picks:
${pickTalk}

Representative lines:
${representative}`;
  }).join('\n\n');

  const extracted = rows.map((row) =>
    `| ${mdCell(row.host)} | ${mdCell(row.subject)} | ${mdCell(row.market)} | ${mdCell(row.lean)} | ${mdCell(row.prediction)} | ${mdCell(row.quote)} |`
  ).join('\n');

  return `# ${ep.show} - ${ep.title}

Published: ${ep.pubDate || 'unknown'}

Generated offline from the M6 diarized transcript export. No model/API calls.

## Speaker Map

${mapped}

## Expected Participants

${expected}

## Ignored Audio

${ignored}

## Timing / Watchlist Conjectures

${timing || '- None surfaced.'}

## Conversation Beats

${beatText || 'No substantive beats detected.'}

## Extracted Picks From Existing Host Summary Rows

| Host | Subject | Market | Lean | Prediction | Quote |
|---|---|---|---|---|---|
${extracted || '| - | - | - | - | - | - |'}
`;
}

function renderHtml(ep, mdName) {
  const rows = hostSummaryRows(ep.hostSummaries, ep).map((row) =>
    `<tr><td>${htmlEsc(row.host)}</td><td>${htmlEsc(row.subject)}</td><td>${htmlEsc(row.market)}</td><td>${htmlEsc(row.lean)}</td><td>${htmlEsc(row.prediction)}</td><td>${htmlEsc(row.quote)}</td></tr>`
  ).join('');
  const mapped = visibleSpeakerEntries(ep.speakerMap).map(([label, name]) => `<li><b>${htmlEsc(label)}</b>: ${htmlEsc(name)}</li>`).join('');
  const ignored = ignoredSpeakerEntries(ep.speakerMap).map(([label]) => `<li><b>${htmlEsc(label)}</b>: ad/commercial audio ignored</li>`).join('');
  const expected = (ep.episodeMetadata?.expected_participants ?? []).map((name) => `<li>${htmlEsc(name)}</li>`).join('');
  const timing = (ep.timingConjectures ?? []).map((row) =>
    `<li><b>${htmlEsc(row.speaker)}</b> <span class="sub">(${htmlEsc(row.time)})</span> on ${htmlEsc(row.subject)} / ${htmlEsc(row.market)}: <b>trigger:</b> ${htmlEsc(row.trigger)} <b>implication:</b> ${htmlEsc(row.implication)} <b>action:</b> ${htmlEsc(row.action)}<br><span class="sub">"${htmlEsc(row.quote)}"</span></li>`
  ).join('');
  const beats = ep.beats.map((beat, index) => {
    const mindset = beat.mindset.map((m) => `<li><b>${htmlEsc(m.speaker)}:</b> ${htmlEsc(m.sentence)}</li>`).join('');
    const pickTalk = beat.pickTalk.map((p) => `<li><b>${htmlEsc(p.speaker)}:</b> ${htmlEsc(p.sentence)}</li>`).join('');
    const representative = beat.representative.map((r) => `<li><b>${htmlEsc(r.speaker)}:</b> ${htmlEsc(r.sentence)}</li>`).join('');
    const conclusion = beat.conclusion
      ? `<b>${htmlEsc(beat.conclusion.speaker)}:</b> ${htmlEsc(beat.conclusion.summary)}`
      : 'No firm pick surfaced.';
    const matchup = beat.matchup ? htmlEsc(beat.matchup.matchup) : 'Not inferred.';
    const spread = beat.matchup?.spread
      ? `${htmlEsc(beat.matchup.spread.label)}${beat.matchup.spread.note ? ` <span class="muted">${htmlEsc(beat.matchup.spread.note)}</span>` : ''}`
      : 'Not surfaced.';
    const total = beat.matchup?.total?.label ?? 'Not surfaced.';
    const currentMarket = renderCurrentMarketHtml(beat.marketComparison);
    return `<details open><summary><b>${index + 1}. ${htmlEsc(beat.key)}</b> <span>${formatTime(beat.start)}-${formatTime(beat.end)}</span></summary>
      <p><b>Speakers:</b> ${htmlEsc(beat.speakers.join(', ') || 'Unknown')}</p>
      <p><b>Topics:</b> ${htmlEsc([...beat.topics.teams, ...beat.topics.markets].join(', ') || 'General')}</p>
      <p><b>Conclusion:</b> ${conclusion}</p>
      <p><b>Matchup:</b> ${matchup}</p>
      <p><b>Spread:</b> ${spread}</p>
      <p><b>Total:</b> ${htmlEsc(total)}</p>
      <p><b>Current market:</b> ${currentMarket}</p>
      <p><b>Summary:</b> ${htmlEsc(beat.summary)}</p>
      <h3>Mindset / reasoning clues</h3><ul>${mindset || '<li>None pulled.</li>'}</ul>
      <h3>Betting language / picks</h3><ul>${pickTalk || '<li>None pulled.</li>'}</ul>
      <h3>Representative lines</h3><ul>${representative || '<li>None pulled.</li>'}</ul>
    </details>`;
  }).join('');

  return `<!doctype html><meta charset="utf-8"><title>${htmlEsc(ep.show)} - ${htmlEsc(ep.title)}</title>
<style>
body{font-family:Inter,Segoe UI,Arial,sans-serif;max-width:1160px;margin:28px auto;padding:0 18px;color:#172033;line-height:1.45}
a{color:#2457c5}h1{margin-bottom:4px}.sub{color:#667085}details{border:1px solid #d8dee8;border-radius:8px;padding:10px 14px;margin:10px 0}summary{cursor:pointer}
summary span{color:#667085;font-weight:400;margin-left:8px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #d8dee8;padding:6px 8px;vertical-align:top}th{background:#f3f6fb;text-align:left}
li{margin:5px 0}h3{font-size:15px;margin-bottom:4px}
</style>
<h1>${htmlEsc(ep.show)} - ${htmlEsc(ep.title)}</h1>
<div class="sub">Published ${htmlEsc(ep.pubDate || 'unknown')} - offline M6 diarized transcript deep dive - <a href="${htmlEsc(mdName)}">markdown</a> - <a href="index.html">index</a></div>
<h2>Speaker Map</h2><ul>${mapped || '<li>No speaker map available.</li>'}</ul>
<h2>Expected Participants</h2><ul>${expected || '<li>No local metadata hint loaded.</li>'}</ul>
<h2>Ignored Audio</h2><ul>${ignored || '<li>None classified as ad/commercial only.</li>'}</ul>
<h2>Timing / Watchlist Conjectures</h2><ul>${timing || '<li>None surfaced.</li>'}</ul>
<h2>Conversation Beats</h2>${beats || '<p>No substantive beats detected.</p>'}
<h2>Extracted Picks From Existing Host Summary Rows</h2>
<table><thead><tr><th>Host</th><th>Subject</th><th>Market</th><th>Lean</th><th>Prediction</th><th>Quote</th></tr></thead><tbody>${rows || '<tr><td colspan="6">None.</td></tr>'}</tbody></table>`;
}

function renderIndex(episodes) {
  const rows = episodes.map((ep) => `<tr><td>${htmlEsc((ep.pubDate || '').slice(0, 10))}</td><td>${htmlEsc(ep.show)}</td><td><a href="${htmlEsc(ep.slug)}.html">${htmlEsc(ep.title)}</a></td><td>${htmlEsc(Object.values(Object.fromEntries(visibleSpeakerEntries(ep.speakerMap))).filter((v) => v !== 'Guest').join(', ') || '-')}</td><td>${ep.beats.length}</td></tr>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>Podcast Transcript Deep Dives</title>
<style>body{font-family:Inter,Segoe UI,Arial,sans-serif;max-width:1160px;margin:28px auto;padding:0 18px;color:#172033}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8dee8;padding:7px 9px;text-align:left;vertical-align:top}th{background:#f3f6fb}.muted{color:#667085}</style>
<h1>Podcast Transcript Deep Dives</h1>
<p class="muted">Generated offline from M6 diarized transcript JSON exports. No live API calls.</p>
<table><thead><tr><th>Date</th><th>Show</th><th>Episode</th><th>Named speakers</th><th>Beats</th></tr></thead><tbody>${rows}</tbody></table>`;
}

async function main() {
  try {
    CURRENT_LINES = JSON.parse(await readFile(LINES_PATH, 'utf8'));
  } catch {
    CURRENT_LINES = { games: [] };
  }

  const manifestPath = path.join(SOURCE_DIR, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const metadataOverrides = await loadMetadataOverrides(METADATA_PATH);
  const episodes = [];

  for (const entry of manifest) {
    const jsonPath = path.resolve(ROOT, entry.json);
    const payload = JSON.parse(await readFile(jsonPath, 'utf8'));
    const rawTurns = payload.transcript?.speaker_segments ?? [];
    const episodeMetadata = payload.episode_metadata ?? findMetadataOverride(metadataOverrides, payload.episode);
    const speakerMap = buildSpeakerMap(rawTurns, payload.feed?.name, undefined, {
      expectedParticipants: episodeMetadata?.expected_participants ?? [],
    });
    const turns = applySpeakerMap(
      rawTurns.map((turn) => ({ ...turn, raw_speaker: turn.speaker })),
      speakerMap
    );
    const pubDate = payload.episode?.pub_date || entry.pub_date || '';
    const slug = `${(pubDate || 'undated').slice(0, 10)}-${slugify(payload.feed?.name)}-${slugify(payload.episode?.title)}`;
    episodes.push({
      show: cleanText(payload.feed?.name || 'Unknown Show'),
      title: cleanText(payload.episode?.title || 'Untitled Episode'),
      pubDate,
      slug,
      speakerMap,
      beats: buildBeats(turns),
      timingConjectures: timingConjecturesFromTurns(turns),
      hostSummaries: payload.host_summaries ?? [],
      turns,
      episodeMetadata,
    });
  }

  episodes.sort((a, b) => String(b.pubDate).localeCompare(String(a.pubDate)) || a.show.localeCompare(b.show));
  await mkdir(OUT_DIR, { recursive: true });
  for (const ep of episodes) {
    const mdName = `${ep.slug}.md`;
    const htmlName = `${ep.slug}.html`;
    await writeFile(path.join(OUT_DIR, mdName), renderMarkdown(ep), 'utf8');
    await writeFile(path.join(OUT_DIR, htmlName), renderHtml(ep, mdName), 'utf8');
  }
  await writeFile(path.join(OUT_DIR, 'index.html'), renderIndex(episodes), 'utf8');
  await writeFile(path.join(OUT_DIR, 'index.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    source_dir: SOURCE_DIR,
    count: episodes.length,
    episodes: episodes.map((ep) => ({
      show: ep.show,
      title: ep.title,
      pub_date: ep.pubDate,
      slug: ep.slug,
      speaker_map: ep.speakerMap,
      beat_count: ep.beats.length,
      timing_conjecture_count: ep.timingConjectures.length,
      html: pathToFileURL(path.join(OUT_DIR, `${ep.slug}.html`)).href,
      markdown: pathToFileURL(path.join(OUT_DIR, `${ep.slug}.md`)).href,
    })),
  }, null, 2), 'utf8');

  console.log(`wrote ${episodes.length} transcript deep dives to ${OUT_DIR}`);
  console.log(`index: ${pathToFileURL(path.join(OUT_DIR, 'index.html')).href}`);
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exitCode = 1;
});
