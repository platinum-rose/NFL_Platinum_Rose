import crypto from 'node:crypto';

export const YOUTUBE_COHORT_SCHEMA = 'youtube_reviewed_local_intel_cohort_v1';
export const PROMOTED_LOCAL_INTEL_STATUS = 'promote_to_local_intel';
export const FORBIDDEN_YOUTUBE_EPISODE_IDS = new Set([
  'youtube-b9NL40Zogkw',
  'youtube-qoCm4G2Jmng',
]);

export function youtubeEpisodeId(item) {
  return item?.source?.episode_id || item?.episode_id || null;
}

export function isForbiddenYoutubeEpisode(item) {
  const episodeId = youtubeEpisodeId(item);
  return Boolean(episodeId && FORBIDDEN_YOUTUBE_EPISODE_IDS.has(episodeId));
}

export function withoutForbiddenYoutubeEpisodes(items = []) {
  return items.filter((item) => !isForbiddenYoutubeEpisode(item));
}

export function youtubeCohortFingerprint(items = [], notes = []) {
  const ids = [...items, ...notes]
    .map((item) => item?.item_id)
    .filter(Boolean)
    .sort();
  return crypto.createHash('sha256').update(ids.join('\n')).digest('hex');
}

export function buildYoutubeCohort({ items = [], notes = [], includeForbiddenEpisodeIds = true } = {}) {
  const cleanItems = withoutForbiddenYoutubeEpisodes(items);
  const cleanNotes = withoutForbiddenYoutubeEpisodes(notes);
  const excludedCount = (items.length - cleanItems.length) + (notes.length - cleanNotes.length);
  const cohort = {
    schema: YOUTUBE_COHORT_SCHEMA,
    status: 'reviewed_local_intel_context_only',
    promoted_status: PROMOTED_LOCAL_INTEL_STATUS,
    item_count: cleanItems.length + cleanNotes.length,
    pick_count: cleanItems.length,
    note_count: cleanNotes.length,
    fingerprint_sha256: youtubeCohortFingerprint(cleanItems, cleanNotes),
    forbidden_episode_evidence_count: excludedCount,
    forbidden_episode_evidence_absent: excludedCount === 0,
  };
  if (includeForbiddenEpisodeIds) {
    cohort.forbidden_episode_ids = [...FORBIDDEN_YOUTUBE_EPISODE_IDS].sort();
  }
  return cohort;
}

export function assertYoutubeCohortClean(items = [], notes = [], label = 'YouTube cohort') {
  const leaked = [...items, ...notes].filter(isForbiddenYoutubeEpisode);
  if (leaked.length > 0) {
    const examples = leaked.slice(0, 5).map((item) => `${youtubeEpisodeId(item)}:${item.item_id || 'missing_item_id'}`);
    throw new Error(`${label} includes forbidden episode evidence: ${examples.join(', ')}`);
  }
}
