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
