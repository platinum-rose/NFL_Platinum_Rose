// src/lib/fantasyOverlayStore.js
// ═══════════════════════════════════════════════════════════════════════════════
// FANTASY OVERLAY & INTEL STORE
// Cross-references Fantasy Board players with Projected Starters, Availability Digest,
// and Prediction Market signals.
// ═══════════════════════════════════════════════════════════════════════════════

import starterSnapshot from '../../data/projected-starters/2026/latest.json';
import availabilityDigest from '../../data/player-availability/impact-digest-latest.json';
// FLAGGED (lint cleanup, 2026-08-10, not fixed — needs Andy's call): this
// module's own header comment promises "Prediction Market signals" as a
// third overlay source alongside starterMap/availabilityMap below, but no
// predictionMap was ever built from this import and getPlayerOverlay()'s
// return value has no market-signal fields at all. Looks like the same
// kind of half-wired-feature gap as the FantasyPros F-26c work found
// elsewhere this session — left in place rather than deleting a real data
// import or guessing at what the market-signal fields should be.
// eslint-disable-next-line no-unused-vars
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
