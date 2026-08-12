import { readFile } from 'node:fs/promises';
import path from 'node:path';

function normalizedPart(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function splitInputPaths(value, root = process.cwd()) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => path.resolve(root, item));
}

export function snapshotIdentity(row) {
  return [
    row?.market_type,
    row?.team,
    row?.selection,
    row?.book,
    row?.snapshot_time || row?.captured_at,
    row?.line,
    row?.over_price,
    row?.under_price,
  ].map(normalizedPart).join('|');
}

export function mergeSnapshotSources(primaryRows = [], overlayRows = []) {
  const merged = new Map();
  for (const row of [...primaryRows, ...overlayRows]) {
    merged.set(snapshotIdentity(row), row);
  }
  return [...merged.values()];
}

export function validateLocalSnapshotRows(rows, { season = null, source = 'local import' } = {}) {
  if (!Array.isArray(rows)) throw new Error(`${source}: expected a JSON array`);
  return rows.filter((row, index) => {
    if (!row || typeof row !== 'object') throw new Error(`${source}: row ${index + 1} is not an object`);
    for (const field of ['market_type', 'book']) {
      if (!row[field]) throw new Error(`${source}: row ${index + 1} is missing ${field}`);
    }
    if (!row.team && !row.selection) throw new Error(`${source}: row ${index + 1} needs team or selection`);
    if (season != null && Number(row.season) !== Number(season)) return false;
    return true;
  });
}

export async function loadLocalSnapshotFiles(paths, { season = null } = {}) {
  const rows = [];
  const sources = [];
  for (const filePath of paths) {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    const accepted = validateLocalSnapshotRows(parsed, { season, source: filePath });
    rows.push(...accepted);
    sources.push({ path: filePath, rows: accepted.length });
  }
  return { rows, sources };
}

export function beatSourceTeam(source) {
  const match = String(source || '').trim().match(/^([A-Z]{2,3})\s+Beat\s+-/i);
  return match ? match[1].toUpperCase() : null;
}

export function isSourceTeamAligned(team, source) {
  const sourceTeam = beatSourceTeam(source);
  return !sourceTeam || sourceTeam === String(team || '').trim().toUpperCase();
}

export function extractResumePrompt(markdown) {
  const text = String(markdown || '');
  const match = text.match(/## Resume Prompt[\s\S]*?```text\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : text.trim();
}
