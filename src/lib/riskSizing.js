// src/lib/riskSizing.js
// Code-owned EV, Kelly, and geometric-growth sizing math for picks/futures.

const DEFAULT_FRACTIONAL_KELLY = 0.25;
const DEFAULT_MAX_STAKE_FRACTION = 0.05;

export function normalizeProbability(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n > 1) return n / 100;
  if (n >= 0) return n;
  return null;
}

export function americanOddsToNetOdds(americanOdds) {
  const odds = Number(americanOdds);
  if (!Number.isFinite(odds) || odds === 0) return null;
  if (odds > 0) return odds / 100;
  return 100 / Math.abs(odds);
}

export function impliedProbability(americanOdds) {
  const b = americanOddsToNetOdds(americanOdds);
  if (b == null) return null;
  return 1 / (b + 1);
}

export function expectedValuePerDollar(modelProbability, americanOdds) {
  const p = normalizeProbability(modelProbability);
  const b = americanOddsToNetOdds(americanOdds);
  if (p == null || b == null) return null;
  const q = 1 - p;
  return (p * b) - q;
}

export function returnVolatility(modelProbability, americanOdds) {
  const p = normalizeProbability(modelProbability);
  const b = americanOddsToNetOdds(americanOdds);
  if (p == null || b == null) return null;
  const q = 1 - p;
  const mu = expectedValuePerDollar(p, americanOdds);
  const secondMoment = (p * b * b) + q;
  return Math.sqrt(Math.max(0, secondMoment - (mu * mu)));
}

export function kellyFraction(modelProbability, americanOdds) {
  const p = normalizeProbability(modelProbability);
  const b = americanOddsToNetOdds(americanOdds);
  if (p == null || b == null || b <= 0) return null;
  const q = 1 - p;
  return (b * p - q) / b;
}

export function cappedKellyFraction(modelProbability, americanOdds, cap = 0.25) {
  const raw = kellyFraction(modelProbability, americanOdds);
  if (raw == null) return null;
  return Math.min(Math.max(raw, 0), cap);
}

export function logGrowth(modelProbability, americanOdds, stakeFraction) {
  const p = normalizeProbability(modelProbability);
  const b = americanOddsToNetOdds(americanOdds);
  const f = Number(stakeFraction);
  if (p == null || b == null || !Number.isFinite(f) || f < 0 || f >= 1) return null;
  const q = 1 - p;
  return (p * Math.log(1 + (f * b))) + (q * Math.log(1 - f));
}

export function riskOfRuinEvenMoney(modelProbability, bankrollUnits) {
  const p = normalizeProbability(modelProbability);
  const n = Number(bankrollUnits);
  if (p == null || !Number.isFinite(n) || n <= 0) return null;
  const q = 1 - p;
  if (p <= q) return 1;
  return Math.pow(q / p, n);
}

export function calculateRiskSizing({
  model_probability,
  winProbability,
  odds,
  american_odds,
  bankroll = 0,
  unit_size = null,
  fractional_kelly = DEFAULT_FRACTIONAL_KELLY,
  max_stake_fraction = DEFAULT_MAX_STAKE_FRACTION,
  uncertainty_haircut = 1,
  correlation_haircut = 1,
  bankroll_units = null,
} = {}) {
  const probabilityInput = model_probability ?? winProbability;
  const oddsInput = american_odds ?? odds;
  const p = normalizeProbability(probabilityInput);
  const b = americanOddsToNetOdds(oddsInput);
  const bank = Number(bankroll) || 0;
  const unitSize = Number(unit_size) || null;
  const fraction = Math.max(0, Number(fractional_kelly) || DEFAULT_FRACTIONAL_KELLY);
  const maxFraction = Math.max(0, Number(max_stake_fraction) || DEFAULT_MAX_STAKE_FRACTION);
  const uncertainty = Math.min(Math.max(Number(uncertainty_haircut) || 1, 0), 1);
  const correlation = Math.min(Math.max(Number(correlation_haircut) || 1, 0), 1);

  if (p == null || p <= 0 || p >= 1 || b == null) {
    return {
      status: 'error',
      message: 'model_probability must be between 0 and 1 or 0 and 100, and odds must be valid American odds.',
    };
  }

  const implied = impliedProbability(oddsInput);
  const ev = expectedValuePerDollar(p, oddsInput);
  const volatility = returnVolatility(p, oddsInput);
  const rawKelly = kellyFraction(p, oddsInput);
  const positiveKelly = Math.max(rawKelly, 0);
  const recommendedFraction = Math.min(
    positiveKelly * fraction * uncertainty * correlation,
    maxFraction,
  );
  const recommendedStake = bank * recommendedFraction;
  const fullKellyStake = bank * positiveKelly;
  const signalToNoise = volatility > 0 ? ev / volatility : null;
  const geometricGrowthAtRecommended = logGrowth(p, oddsInput, recommendedFraction);
  const geometricGrowthAtFullKelly = positiveKelly > 0 && positiveKelly < 1
    ? logGrowth(p, oddsInput, positiveKelly)
    : null;
  const ruinUnits = bankroll_units ?? (recommendedFraction > 0 ? 1 / recommendedFraction : null);
  const ruinProxy = ruinUnits ? riskOfRuinEvenMoney(p, ruinUnits) : null;

  const flags = [];
  if (ev <= 0) flags.push('no_positive_ev');
  if (rawKelly <= 0) flags.push('no_kelly_stake');
  if (positiveKelly > 0.1) flags.push('high_full_kelly');
  if (signalToNoise != null && signalToNoise < 0.1) flags.push('thin_signal_to_noise');
  if (recommendedFraction >= maxFraction && positiveKelly * fraction > maxFraction) flags.push('stake_cap_applied');
  if (uncertainty < 1) flags.push('uncertainty_haircut_applied');
  if (correlation < 1) flags.push('correlation_haircut_applied');
  if (geometricGrowthAtRecommended != null && geometricGrowthAtRecommended <= 0) flags.push('non_positive_geometric_growth');

  return {
    status: ev > 0 && recommendedFraction > 0 ? 'sizable_edge' : 'pass',
    doctrine: 'edge first, then variance, then survival, then fractional Kelly, then geometric growth',
    inputs: {
      model_probability: p,
      american_odds: Number(oddsInput),
      bankroll: bank,
      unit_size: unitSize,
      fractional_kelly: fraction,
      max_stake_fraction: maxFraction,
      uncertainty_haircut: uncertainty,
      correlation_haircut: correlation,
    },
    market_implied_probability: implied,
    edge_probability_points: p - implied,
    expected_value_per_dollar: ev,
    return_volatility: volatility,
    signal_to_noise: signalToNoise,
    full_kelly_fraction: rawKelly,
    positive_kelly_fraction: positiveKelly,
    full_kelly_stake: fullKellyStake,
    recommended_stake_fraction: recommendedFraction,
    recommended_stake: recommendedStake,
    recommended_units: unitSize ? recommendedStake / unitSize : null,
    geometric_growth_at_recommended: geometricGrowthAtRecommended,
    geometric_growth_at_full_kelly: geometricGrowthAtFullKelly,
    risk_of_ruin_even_money_proxy: ruinProxy,
    risk_of_ruin_units: ruinUnits,
    flags,
  };
}
