// Merge per-chunk extraction results into one episode result (shared by podcast-ingest.js).
// Mirrors the July-2026 logic in agents/podcast-reextract.js, plus the `player` field so two
// different player props on the same game/line are not collapsed into one.

export const MAX_INTEL = 30;

export function pickKey(p = {}) {
  return [p.selection, p.player, p.team1, p.team2, p.type, p.line]
    .map((v) => String(v ?? '').toLowerCase().trim()).join('|');
}

export function mergePicks(all = []) {
  const byKey = new Map();
  for (const p of all) {
    if (!p || typeof p !== 'object') continue;
    const k = pickKey(p);
    const prev = byKey.get(k);
    if (!prev || Number(p.confidence ?? 0) > Number(prev.confidence ?? 0)) byKey.set(k, p);
  }
  return [...byKey.values()];
}

export function mergeIntel(all = [], max = MAX_INTEL) {
  const seen = new Set();
  const out = [];
  for (const item of all) {
    const s = String(item ?? '').trim();
    if (!s) continue;
    const norm = s.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}
