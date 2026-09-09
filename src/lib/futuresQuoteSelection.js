export function futuresQuoteFreshnessRank(meta) {
  if (!meta) return -1;
  if (meta.availability_status === 'current') return 2;
  if (meta.availability_status === 'missing_observed_at') return 0;
  return 1;
}

// A stale quote never displaces a current one. Within the current freshness
// window, however, line shopping means the better payout wins; recency only
// breaks equal-price ties. Within the stale tier, recency remains primary so
// an ancient outlier cannot masquerade as an actionable best price.
export function isBetterFuturesOffer(price, meta, bestPrice, bestMeta) {
  if (price == null) return false;
  if (bestPrice == null) return true;
  const rank = futuresQuoteFreshnessRank(meta);
  const bestRank = futuresQuoteFreshnessRank(bestMeta);
  if (rank !== bestRank) return rank > bestRank;

  const age = meta?.quote_age_hours;
  const bestAge = bestMeta?.quote_age_hours;
  if (rank === 2) {
    if (price !== bestPrice) return price > bestPrice;
    if (age != null && bestAge != null && age !== bestAge) return age < bestAge;
    return false;
  }

  if (age != null && bestAge != null && age !== bestAge) return age < bestAge;
  if (price !== bestPrice) return price > bestPrice;
  return false;
}

export const SYNTHETIC_BOOKS = Object.freeze(new Set(['consensus', 'average', 'fair', 'market_consensus']));

export function isSyntheticBook(book) {
  return SYNTHETIC_BOOKS.has(String(book || '').trim().toLowerCase());
}

export function deriveImpliedProbability(row) {
  if (!row) return null;
  if (row.implied_prob != null) return row.implied_prob;
  if (row.odds == null) return null;
  return row.odds > 0
    ? 100 / (row.odds + 100)
    : Math.abs(row.odds) / (Math.abs(row.odds) + 100);
}

export function selectBestAndWorstQuotes(bookEntries) {
  const entries = Array.isArray(bookEntries) ? bookEntries : Array.from(bookEntries || []);
  const implied = (row) => deriveImpliedProbability(row);
  const realBookEntries = entries.filter((r) => !isSyntheticBook(r.book));
  const candidates = realBookEntries.length > 0 ? realBookEntries : entries;
  const best = candidates.reduce((b, r) => (!b || implied(r) < implied(b) ? r : b), null);
  const worst = candidates.reduce((w, r) => (!w || implied(r) > implied(w) ? r : w), null);
  return { best, worst };
}

export function computeAverageImpliedProbability(bookEntries) {
  const entries = Array.isArray(bookEntries) ? bookEntries : Array.from(bookEntries || []);
  if (entries.length === 0) return 0;
  const total = entries.reduce((s, r) => s + (deriveImpliedProbability(r) || 0), 0);
  return total / entries.length;
}

export function aggregateSelectionQuotes(bookEntries) {
  const entries = Array.isArray(bookEntries) ? bookEntries : Array.from(bookEntries || []);
  const { best, worst } = selectBestAndWorstQuotes(entries);
  const avgImplied = computeAverageImpliedProbability(entries);
  return {
    best,
    worst,
    bestOdds: best?.odds ?? null,
    bestBook: best?.book ?? null,
    bestImplied: best ? deriveImpliedProbability(best) : null,
    worstOdds: worst?.odds ?? null,
    avgImplied,
    bookCount: entries.length,
  };
}
