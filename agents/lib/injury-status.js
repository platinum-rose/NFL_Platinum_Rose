// agents/lib/injury-status.js
// Single source of truth for interpreting player_injuries.injury_status.
//
// Why this is shared (2026-09-04, Tier 1 pipeline remediation):
//   The dossier's filter compared a lowercased raw status against the short codes
//   {out, doubtful, ir, pup, questionable}. The table actually stores human-readable
//   values — "Injured Reserve", "Suspension", "Reserve-Ret" — so "Injured Reserve"
//   lowercased to "injured reserve", never equalled 'ir', and every IR designation
//   (353 rows, the largest and most decision-relevant non-Active bucket) was
//   silently discarded. The literals 'ir' and 'pup' matched nothing at all.
//
//   agents/portfolio-preflight.js validates this lane, so the logic lives here
//   rather than being copied into both — a gate checking its own stale copy of a
//   constant is how the original bug survived review in the first place.

/** Map any source spelling to a canonical status token. */
export function normalizeInjuryStatus(raw) {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'active') return 'active';
  if (/injured\s*reserve|^ir$|^i\.r\.$/.test(s)) return 'ir';
  if (/physically\s*unable|^pup$/.test(s)) return 'pup';
  if (/non[-\s]?football/.test(s)) return 'nfi';
  if (/suspend|suspension/.test(s)) return 'suspension';
  if (/reserve-?ret|retired/.test(s)) return 'retired';
  if (s.startsWith('question')) return 'questionable';
  if (s.startsWith('doubt')) return 'doubtful';
  if (s === 'out') return 'out';
  return s; // unrecognized — callers should count these, not drop them silently
}

/** Statuses that represent a real availability concern (excludes 'active'). */
export const INJURY_RELEVANT_STATUS = new Set([
  'out', 'doubtful', 'ir', 'pup', 'nfi', 'questionable', 'suspension', 'retired',
]);

/** Most severe first — orders the per-team players[] sample before truncation. */
export const INJURY_SEVERITY = {
  ir: 0, retired: 1, nfi: 2, suspension: 3, out: 4, pup: 5, doubtful: 6, questionable: 7,
};
