export const FUTURES_ODDS_EXECUTION_SCHEMA = 'futures_odds_execution_validation_v1';

export const PLACEABLE_BOOKS = new Map([
  ['bookmaker', 'Bookmaker/BKR'],
  ['betus', 'BetUS'],
  ['betonline', 'BetOnline'],
]);

export const REQUIRED_EXACTA_BOOK_COUNT = 2;
export const DEFAULT_EXACTA_MIN_PRICE = 4500;

function norm(value) {
  return String(value ?? '').trim().toLowerCase();
}

function dateKey(value) {
  const text = String(value || '');
  const direct = text.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (direct) return direct;
  const time = new Date(text).getTime();
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().slice(0, 10);
}

function priceFields(row) {
  return [row.price, row.odds, row.over_price, row.under_price]
    .filter((value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)));
}

export function exactMatchupTeams(row) {
  if (row?.market_type !== 'superbowl_matchup') return null;
  const selection = String(row.selection || row.team || '').trim();
  const parts = selection.split(/\s+vs\.?\s+/i).map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  return parts;
}

export function exactMatchupKey(rowOrTeams) {
  const teams = Array.isArray(rowOrTeams) ? rowOrTeams : exactMatchupTeams(rowOrTeams);
  if (!teams || teams.length !== 2) return null;
  return teams.map(norm).sort().join('|');
}

export function classifyFuturesOddsRow(row, options = {}) {
  const expectedSeason = Number(options.season ?? 2026);
  const currentSnapshotDate = options.currentSnapshotDate || '2026-08-10';
  const book = norm(row?.book);
  const snapshotDate = dateKey(row?.snapshot_time || row?.captured_at);
  const reasons = [];

  if (!PLACEABLE_BOOKS.has(book)) reasons.push('non_placeable_book');
  if (Number(row?.season) !== expectedSeason) reasons.push('wrong_season');
  if (!snapshotDate) reasons.push('missing_snapshot_timestamp');
  if (snapshotDate && snapshotDate !== currentSnapshotDate) reasons.push('not_current_local_snapshot');
  if (priceFields(row).length === 0) reasons.push('missing_price');

  const exactTeams = exactMatchupTeams(row);
  if (row?.market_type === 'superbowl_matchup' && !exactTeams) reasons.push('invalid_exact_two_team_matchup');

  const base = {
    book,
    book_label: PLACEABLE_BOOKS.get(book) || row?.book || 'unknown',
    market_type: row?.market_type || 'unknown',
    snapshot_date: snapshotDate,
    exact_matchup_key: exactTeams ? exactMatchupKey(exactTeams) : null,
    exact_matchup_teams: exactTeams,
    execution_reference_eligible: reasons.length === 0 && row?.market_type !== 'superbowl_matchup',
    execution_source_status: 'context_only',
    exclusion_reasons: reasons,
  };

  if (base.execution_reference_eligible) {
    return {
      ...base,
      execution_source_status: 'execution_reference_eligible_local_snapshot',
    };
  }

  if (row?.market_type === 'superbowl_matchup' && reasons.length === 0) {
    return {
      ...base,
      execution_source_status: 'monitor_only_exacta_requires_multiple_books',
      exclusion_reasons: ['exacta_requires_multiple_placeable_books'],
    };
  }

  return base;
}

export function buildFuturesOddsExecutionValidation(input = {}, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const season = Number(options.season ?? 2026);
  const currentSnapshotDate = options.currentSnapshotDate || '2026-08-10';
  const exactaMinPrice = Number(options.exactaMinPrice ?? DEFAULT_EXACTA_MIN_PRICE);
  const sources = input.sources || {};
  const rows = [];

  for (const [sourcePath, sourceRows] of Object.entries(sources)) {
    for (const row of sourceRows || []) {
      const validation = classifyFuturesOddsRow(row, { season, currentSnapshotDate });
      rows.push({ source_path: sourcePath, row, validation });
    }
  }

  const exactaRows = rows.filter((item) => item.row.market_type === 'superbowl_matchup');
  const exactaByPair = new Map();
  for (const item of exactaRows) {
    const key = item.validation.exact_matchup_key || 'invalid';
    if (!exactaByPair.has(key)) exactaByPair.set(key, []);
    exactaByPair.get(key).push(item);
  }

  const exactaPairs = [...exactaByPair.entries()].map(([key, items]) => {
    const books = [...new Set(items.map((item) => item.validation.book).filter(Boolean))].sort();
    const prices = items.map((item) => Number(item.row.price ?? item.row.odds)).filter(Number.isFinite);
    const bestPrice = prices.length ? Math.max(...prices) : null;
    const validRows = items.filter((item) => item.validation.exclusion_reasons.length === 1
      && item.validation.exclusion_reasons[0] === 'exacta_requires_multiple_placeable_books');
    const multipleBookConfirmed = books.length >= REQUIRED_EXACTA_BOOK_COUNT;
    const priceGatePass = bestPrice != null && bestPrice >= exactaMinPrice;
    return {
      key,
      teams: items[0]?.validation.exact_matchup_teams || null,
      row_count: items.length,
      placeable_book_count: books.length,
      books,
      best_price: bestPrice,
      price_gate_pass: priceGatePass,
      multiple_book_confirmed: multipleBookConfirmed,
      execution_claim_allowed: validRows.length > 0 && multipleBookConfirmed && priceGatePass,
      status: validRows.length > 0 && multipleBookConfirmed && priceGatePass
        ? 'exacta_execution_reference_confirmed'
        : 'monitor_only_exacta',
      rows: items.map((item) => ({
        source_path: item.source_path,
        book: item.validation.book,
        selection: item.row.selection,
        price: item.row.price ?? item.row.odds,
        snapshot_time: item.row.snapshot_time || item.row.captured_at || null,
        exclusion_reasons: item.validation.exclusion_reasons,
      })),
    };
  }).sort((a, b) => String(a.key).localeCompare(String(b.key)));

  const billsPackersKey = ['Buffalo Bills', 'Green Bay Packers'].map(norm).sort().join('|');
  const billsPackersExacta = exactaPairs.find((pair) => pair.key === billsPackersKey) || null;

  const sourceSummaries = Object.fromEntries(Object.entries(sources).map(([sourcePath, sourceRows]) => {
    const scoped = rows.filter((item) => item.source_path === sourcePath);
    const latestSnapshot = [...new Set(scoped.map((item) => item.validation.snapshot_date).filter(Boolean))].sort().at(-1) || null;
    return [sourcePath, {
      rows: sourceRows.length,
      latest_snapshot_date: latestSnapshot,
      current_snapshot_rows: scoped.filter((item) => item.validation.snapshot_date === currentSnapshotDate).length,
      execution_reference_eligible_rows: scoped.filter((item) => item.validation.execution_reference_eligible).length,
      monitor_only_exacta_rows: scoped.filter((item) => item.validation.execution_source_status === 'monitor_only_exacta_requires_multiple_books').length,
      context_only_rows: scoped.filter((item) => item.validation.execution_source_status === 'context_only').length,
    }];
  }));

  const validationRows = rows.map((item) => ({
    source_path: item.source_path,
    book: item.validation.book,
    market_type: item.validation.market_type,
    team: item.row.team || null,
    selection: item.row.selection || null,
    price: item.row.price ?? item.row.odds ?? null,
    line: item.row.line ?? null,
    over_price: item.row.over_price ?? null,
    under_price: item.row.under_price ?? null,
    snapshot_time: item.row.snapshot_time || item.row.captured_at || null,
    execution_source_status: item.validation.execution_source_status,
    execution_reference_eligible: item.validation.execution_reference_eligible,
    exclusion_reasons: item.validation.exclusion_reasons,
  }));

  return {
    meta: {
      schema: FUTURES_ODDS_EXECUTION_SCHEMA,
      generated_at: generatedAt,
      season,
      current_snapshot_date: currentSnapshotDate,
      local_only: true,
      recommendation_status: 'execution_validation_only_not_picks',
      guardrails: {
        network_fetches: false,
        model_calls: false,
        supabase_writes: false,
        official_picks_generated: false,
        portfolio_mutations: false,
      },
      placeable_books: Object.fromEntries(PLACEABLE_BOOKS),
      rows_total: rows.length,
      execution_reference_eligible_rows: validationRows.filter((row) => row.execution_reference_eligible).length,
      context_only_rows: validationRows.filter((row) => row.execution_source_status === 'context_only').length,
      monitor_only_exacta_rows: validationRows.filter((row) => row.execution_source_status === 'monitor_only_exacta_requires_multiple_books').length,
      exacta_pairs: exactaPairs.length,
      exacta_execution_claim_allowed_pairs: exactaPairs.filter((pair) => pair.execution_claim_allowed).length,
    },
    sources: sourceSummaries,
    exacta_policy: {
      required_exact_two_team_rows: true,
      required_placeable_book_count: REQUIRED_EXACTA_BOOK_COUNT,
      minimum_price: exactaMinPrice,
      simulation_price_only_rows_execution_claim_allowed: false,
    },
    bills_packers_exacta: billsPackersExacta,
    exacta_pairs: exactaPairs,
    rows: validationRows,
  };
}
