// src/lib/fantasyOverlayStore.js
// ═══════════════════════════════════════════════════════════════════════════════
// FANTASY OVERLAY & INTEL STORE
// Cross-references Fantasy Board players with Projected Starters, Availability Digest,
// and Prediction Market signals.
// ═══════════════════════════════════════════════════════════════════════════════

import starterSnapshot from '../../data/projected-starters/2026/latest.json';
import availabilityDigest from '../../data/player-availability/impact-digest-latest.json';
import predictionSnapshot from '../../data/prediction-markets/latest.json';

const starterMap = new Map();
if (starterSnapshot && Array.isArray(starterSnapshot.players)) {
  starterSnapshot.players.forEach((p) => {
    if (p.player_name) {
      starterMap.set(p.player_name.trim().toLowerCase(), p);
    }
  });
}

const availabilityMap = new Map();
if (availabilityDigest && Array.isArray(availabilityDigest.digest_events)) {
  availabilityDigest.digest_events.forEach((ev) => {
    if (ev.player_name) {
      availabilityMap.set(ev.player_name.trim().toLowerCase(), ev);
    }
  });
}

/**
 * Enriches a fantasy player row with projected starter role, availability flags, and market signals.
 * @param {Object} row - Fantasy player row
 * @returns {Object} Enriched player object
 */
export function getPlayerOverlay(row) {
  if (!row || !row.player) return null;
  const key = String(row.player).trim().toLowerCase();

  const starter = starterMap.get(key) || null;
  const avail = availabilityMap.get(key) || null;

  const isProjectedStarter = starter ? (starter.role || '').toLowerCase().includes('starter') || starter.starter_confidence > 0.6 : false;
  const isHighImpact = avail ? avail.event_type === 'out' || avail.event_type === 'pup' || avail.event_type === 'ir' : false;

  return {
    starterInfo: starter,
    availabilityInfo: avail,
    isProjectedStarter,
    isHighImpact,
    starterRole: starter?.role || null,
    impactTier: avail?.impact_tier || (isHighImpact ? 'starter' : null),
  };
}
