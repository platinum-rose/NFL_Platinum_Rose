import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { NFL_TEAMS, getTeamAbbreviation, normalizeTeam } from '../../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..', '..');
export const GENERATED_DIR = path.join(ROOT, 'data', 'generated', 'team-profiles');

export function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

export async function readCsv(filePath) {
  const text = await readFile(filePath, 'utf8');
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
  if (parsed.errors?.length) {
    const msg = parsed.errors.slice(0, 3).map((e) => e.message).join('; ');
    throw new Error(`CSV parse failed for ${filePath}: ${msg}`);
  }
  return parsed.data;
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function fileStamp(filePath) {
  const s = await stat(filePath);
  return s.mtime.toISOString();
}

export async function writeJsonArtifact(defaultName, payload, explicitOut = null) {
  const outPath = explicitOut ? path.resolve(ROOT, explicitOut) : path.join(GENERATED_DIR, defaultName);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return outPath;
}

export function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function round(value, digits = 4) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  return Number(Number(value).toFixed(digits));
}

export function ratio(numer, denom, digits = 4) {
  if (!Number.isFinite(numer) || !Number.isFinite(denom) || denom === 0) return null;
  return round(numer / denom, digits);
}

export function latestSeason(rows) {
  return Math.max(...rows.map((r) => Number(r.season)).filter(Number.isFinite));
}

export function maxWeek(rows, season) {
  return Math.max(...rows
    .filter((r) => Number(r.season) === Number(season) && String(r.season_type || r.game_type || '').toUpperCase() === 'REG')
    .map((r) => Number(r.week))
    .filter(Number.isFinite));
}

export function rankRows(rows, valueKey, rankKey, direction = 'desc') {
  const sorted = [...rows]
    .filter((r) => r[valueKey] !== null && r[valueKey] !== undefined)
    .sort((a, b) => direction === 'asc' ? a[valueKey] - b[valueKey] : b[valueKey] - a[valueKey]);
  sorted.forEach((row, idx) => {
    row[rankKey] = idx + 1;
  });
}

export function canonicalTeam(input) {
  return normalizeTeam(input) || null;
}

export function teamAbbr(input) {
  return getTeamAbbreviation(input) || String(input || '').toUpperCase();
}

export function allCanonicalTeams() {
  return Object.keys(NFL_TEAMS).sort();
}

export function addTo(obj, key, value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return;
  obj[key] = (obj[key] || 0) + Number(value);
}

export function uniqCount(values) {
  return new Set(values.filter(Boolean)).size;
}
