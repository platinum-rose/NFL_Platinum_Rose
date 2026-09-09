// src/lib/futuresImportAudit.js
// Canonical semantic normalization and cryptographic hashing for dated futures imports.
// Shared between backfill-futures-imports.js, portfolio-preflight.js, and regression tests.

import crypto from 'node:crypto';

export const FUTURES_IMPORT_KEYS = Object.freeze([
  'snapshot_time', 'captured_at', 'season', 'book', 'market_type', 'team',
  'selection', 'odds', 'price', 'implied_prob', 'line', 'over_price', 'under_price',
]);

export function stableRecord(value) {
  if (Array.isArray(value)) return value.map(stableRecord);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableRecord(value[key])]));
}

export function canonicalSemanticRows(rows) {
  const semantic = (rows || []).map((r) => {
    const row = {};
    for (const k of FUTURES_IMPORT_KEYS) {
      if (k === 'snapshot_time' || k === 'captured_at') continue;
      let val = r[k] ?? null;
      if (k === 'implied_prob' && val != null) val = Number(val);
      if (k === 'line' && val != null) val = Number(val);
      row[k] = val;
    }
    return stableRecord(row);
  });
  semantic.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return semantic;
}

export function computeSemanticHash(rows) {
  const semantic = canonicalSemanticRows(rows);
  return crypto.createHash('sha256').update(JSON.stringify(semantic)).digest('hex');
}

export async function fetchPersistedImportRowsPaged(sb, entry, { pageSize = 1000 } = {}) {
  if (!sb) {
    return { rows: [], error: new Error('Supabase client is not configured') };
  }
  const dbRows = [];
  let lastId = null;
  let fetchErr = null;

  while (true) {
    let query = sb
      .from('futures_odds_snapshots')
      .select('id, snapshot_time, captured_at, season, book, market_type, team, selection, odds, price, implied_prob, line, over_price, under_price')
      .eq('season', entry.season)
      .eq('book', entry.book)
      .eq('snapshot_time', entry.snapshot_time)
      .order('id', { ascending: true })
      .limit(pageSize);

    if (lastId != null) {
      query = query.gt('id', lastId);
    }

    const { data: pageData, error: pageErr } = await query;
    if (pageErr) {
      fetchErr = pageErr;
      break;
    }
    if (!pageData || pageData.length === 0) break;
    dbRows.push(...pageData);
    lastId = pageData[pageData.length - 1].id;
    if (pageData.length < pageSize) break;
  }

  return { rows: dbRows, error: fetchErr };
}

export async function auditFuturesImportManifest({
  manifestJson,
  fileNames,
  readFileBytes,
  rowCount,
  fetchPersistedRows,
}) {
  const problems = [];
  const manifest = manifestJson || {};
  const entries = new Map((manifest.files || []).map((entry) => [entry.file, entry]));

  for (const name of fileNames || []) {
    const entry = entries.get(name);
    if (!entry) {
      problems.push(`${name}: absent from manifest`);
      continue;
    }
    if (readFileBytes) {
      const bytes = await readFileBytes(name);
      const hash = crypto.createHash('sha256').update(bytes).digest('hex');
      if (hash !== entry.sha256) problems.push(`${name}: content changed after reconciliation`);
    }
    if (!['persisted', 'invalid_duplicate'].includes(entry.status)) {
      problems.push(`${name}: status=${entry.status}`);
    }
    if (entry.status === 'invalid_duplicate' && !entry.duplicate_of) {
      problems.push(`${name}: duplicate has no retained source`);
    }

    const liveCount = rowCount
      ? await rowCount('futures_odds_snapshots', {
          season: entry.season,
          book: entry.book,
          snapshot_time: entry.snapshot_time,
        })
      : null;

    if (entry.status === 'persisted') {
      if (liveCount != null && liveCount !== entry.row_count) {
        problems.push(`${name}: live database has ${liveCount}/${entry.row_count} rows`);
      } else if (!entry.semantic_sha256) {
        problems.push(`${name}: persisted entry is missing semantic_sha256 in manifest`);
      } else if (fetchPersistedRows) {
        const { rows: dbRows, error: fetchErr } = await fetchPersistedRows(entry);
        if (fetchErr) {
          problems.push(`${name}: database content read failed (${fetchErr.message})`);
        } else {
          if (liveCount != null && dbRows.length !== liveCount) {
            problems.push(`${name}: paged read retrieved ${dbRows.length}/${liveCount} rows`);
          }
          const dbHash = computeSemanticHash(dbRows);
          if (dbHash !== entry.semantic_sha256) {
            problems.push(`${name}: live database content hash mismatch`);
          }
        }
      }
    }

    if (entry.status === 'invalid_duplicate' && liveCount !== 0) {
      problems.push(`${name}: invalid duplicate has ${liveCount} live database rows`);
    }
  }

  for (const name of entries.keys()) {
    if (!fileNames?.includes(name)) problems.push(`${name}: manifest entry has no source file`);
  }
  if (manifest.mode !== 'applied') {
    problems.push(`manifest mode=${manifest.mode || 'missing'} (expected applied)`);
  }

  return {
    problems,
    passed: problems.length === 0,
    totals: manifest.totals || {},
  };
}
