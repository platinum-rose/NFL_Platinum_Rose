import { describe, expect, it } from 'vitest';
import {
  annotateSynthesisInputWithPredictionMarketExecution,
  dossierTargetForKalshiContract,
  eligiblePredictionMarketEntry,
  evaluatePredictionMarketExecution,
  kalshiNetPriceAtAsk,
  kalshiOrderFeeDollars,
} from '../../src/lib/predictionMarketExecution.js';
import { validateBoard } from '../../agents/lib/board-validate.js';
import { calculateNetOdds, probabilityToAmerican } from '../../src/lib/predictionMarkets.js';
import { isPlaceablePredictionMarketVenue, placeableVenuesPromptSentence } from '../../src/lib/executionVenues.js';

const NOW = '2026-09-26T12:00:00Z';
const FRESH = '2026-09-26T10:00:00Z';
const BOOKS = new Set(['bookmaker', 'betonline']);

const kalshi = (over = {}) => ({
  exchange: 'kalshi', ticker: 'KXNFLPLAYOFF-27-WAS', series_ticker: 'KXNFLPLAYOFF',
  title: 'Will Washington be one of the 2026-27 Pro Football playoff qualifiers?',
  price_cents: 20, yes_bid_cents: 19, yes_ask_cents: 20, volume_24h: 500, updated_at: FRESH, ...over,
});
const playoffsRow = (over = {}) => ({
  team: 'Commanders', team_nick: 'Commanders', best_price: 300, best_book: 'bookmaker',
  best_observed_at: FRESH, n_books: 5, ...over,
});

describe('Kalshi fee + net price at ask', () => {
  it('rounds the whole-order fee up to the cent', () => {
    // 29 contracts @34c: 0.07*29*0.34*0.66 = 0.4555 -> 0.46
    expect(kalshiOrderFeeDollars(34, 29)).toBe(0.46);
    const net = kalshiNetPriceAtAsk(34, 10);
    expect(net.contracts).toBe(29);
    expect(net.net_prob).toBeCloseTo(0.3559, 4);
    expect(net.net_american).toBe(181);
  });
});

describe('dossierTargetForKalshiContract', () => {
  it('maps allowlisted series and parses the packed KXNFLWINS ticker', () => {
    expect(dossierTargetForKalshiContract(kalshi())).toMatchObject({ market: 'playoffs', team: 'Commanders' });
    expect(dossierTargetForKalshiContract({ series_ticker: 'KXNFLWINS', ticker: 'KXNFLWINS-27IND-9' }))
      .toMatchObject({ market: 'wins', team: 'Colts', side: 'over', line: 8.5 });
    expect(dossierTargetForKalshiContract({ series_ticker: 'KXNFLNFCNORTH', ticker: 'KXNFLNFCNORTH-27-MIN' }))
      .toMatchObject({ market: 'division_nfc_north', team: 'Vikings' });
  });
  it('rejects non-equivalent series', () => {
    expect(dossierTargetForKalshiContract({ series_ticker: 'KXNFLDIVISIONWINS', ticker: 'KXNFLDIVISIONWINS-27NFCWEST-42' })).toBeNull();
    expect(dossierTargetForKalshiContract({ series_ticker: 'KXNFL1SEED', ticker: 'KXNFL1SEED-27-BUF' })).toBeNull();
  });
});

describe('evaluatePredictionMarketExecution', () => {
  const opts = { now: NOW, placeableBooks: BOOKS };

  it('is eligible when priced at the ask (+fee) and beating a contemporaneous placeable book', () => {
    // ask 20c -> net ~+382 vs book +300
    const r = evaluatePredictionMarketExecution(kalshi(), playoffsRow(), opts);
    expect(r.reasons).toEqual([]);
    expect(r.execution_eligible).toBe(true);
    expect(r.net_american_at_ask).toBeGreaterThan(300);
    expect(r.sportsbook_best_book).toBe('bookmaker');
  });

  it('prices at the ask, never the last trade', () => {
    // last 20c looks great, but ask 26c (+fee) is worse than +300
    const r = evaluatePredictionMarketExecution(kalshi({ yes_bid_cents: 22, yes_ask_cents: 26 }), playoffsRow(), opts);
    expect(r.execution_eligible).toBe(false);
    expect(r.reasons.some((x) => x.startsWith('does_not_beat_sportsbook'))).toBe(true);
  });

  it('blocks thin/wide/stale/missing-ask books', () => {
    const check = (over, prefix) => {
      const r = evaluatePredictionMarketExecution(kalshi(over), playoffsRow(), opts);
      expect(r.execution_eligible).toBe(false);
      expect(r.reasons.some((x) => x.startsWith(prefix))).toBe(true);
    };
    check({ yes_bid_cents: 10, yes_ask_cents: 20 }, 'spread_too_wide');
    check({ volume_24h: 3 }, 'volume_24h_too_low');
    check({ yes_ask_cents: null }, 'no_live_yes_ask');
    check({ yes_bid_cents: 0, yes_ask_cents: 1 }, 'no_two_sided_market');
    check({ updated_at: '2026-09-23T00:00:00Z' }, 'quote_stale');
  });

  it('blocks comparison against a non-contemporaneous sportsbook quote', () => {
    const r = evaluatePredictionMarketExecution(kalshi(), playoffsRow({ best_observed_at: '2026-09-10T00:00:00Z' }), opts);
    expect(r.execution_eligible).toBe(false);
    expect(r.reasons.some((x) => x.startsWith('quotes_not_contemporaneous'))).toBe(true);
  });

  it('flags an implausibly large advantage as a stop-and-verify', () => {
    const r = evaluatePredictionMarketExecution(kalshi(), playoffsRow({ best_price: 150 }), opts);
    expect(r.reasons.some((x) => x.startsWith('implausible_advantage_verify_match'))).toBe(true);
  });

  it('win totals: only books at the exact matching line count, and eligible rows need review', () => {
    const c = kalshi({ ticker: 'KXNFLWINS-27IND-9', series_ticker: 'KXNFLWINS', yes_bid_cents: 33, yes_ask_cents: 34 });
    const row = { team: 'Colts', team_nick: 'Colts', consensus_line: 8.5, books: {
      bookmaker: { line: 8.5, over: 160, observed_at: FRESH },
      betonline: { line: 9.5, over: 300, observed_at: FRESH },
    } };
    const r = evaluatePredictionMarketExecution(c, row, opts);
    expect(r.sportsbook_best_book).toBe('bookmaker');
    expect(r.execution_eligible).toBe(true);
    expect(r.needs_human_review).toBe(true);
    const noLine = evaluatePredictionMarketExecution(c, { ...row, books: { betonline: row.books.betonline } }, opts);
    expect(noLine.reasons).toContain('no_placeable_sportsbook_quote_at_line:8.5');
  });

  it('Polymarket is never execution-eligible', () => {
    const r = evaluatePredictionMarketExecution(kalshi({ exchange: 'polymarket' }), playoffsRow(), opts);
    expect(r.execution_eligible).toBe(false);
    expect(r.reasons).toContain('venue_not_placeable:polymarket');
  });
});

describe('dossier annotation + downstream gates', () => {
  const makeDossier = () => {
    const synthesis_input = { playoffs: [playoffsRow()] };
    annotateSynthesisInputWithPredictionMarketExecution(synthesis_input, [kalshi()], { now: NOW, placeableBooks: BOOKS });
    return { synthesis_input };
  };

  it('annotates the matching row and exposes the eligible entry', () => {
    const d = makeDossier();
    const entry = eligiblePredictionMarketEntry(d.synthesis_input.playoffs[0], 'kalshi');
    expect(entry?.execution_eligible).toBe(true);
  });

  it('board-validate accepts Kalshi only at the gate price', () => {
    const d = makeDossier();
    const price = d.synthesis_input.playoffs[0].prediction_market_execution[0].net_american_at_ask;
    const ok = validateBoard({ market: 'playoffs', selection: 'Commanders', book: 'kalshi', price }, d);
    expect(ok.filter((v) => /bettable|prediction_market|no_matching_quote/.test(v))).toEqual([]);
    const wrongPrice = validateBoard({ market: 'playoffs', selection: 'Commanders', book: 'kalshi', price: price + 50 }, d);
    expect(wrongPrice.some((v) => v.startsWith('no_matching_quote'))).toBe(true);
  });

  it('board-validate rejects Kalshi on a row with no eligible entry', () => {
    const d = { synthesis_input: { playoffs: [playoffsRow()] } };
    const v = validateBoard({ market: 'playoffs', selection: 'Commanders', book: 'kalshi', price: 400 }, d);
    expect(v.some((x) => x.startsWith('prediction_market_not_execution_eligible'))).toBe(true);
  });
});

describe('registry + prompt', () => {
  it('Kalshi is placeable via the gate, Polymarket is not', () => {
    expect(isPlaceablePredictionMarketVenue('Kalshi')).toBe(true);
    expect(isPlaceablePredictionMarketVenue('polymarket')).toBe(false);
    const s = placeableVenuesPromptSentence();
    expect(s).toContain('execution_eligible=true');
    expect(s).toContain('Polymarket is market context only');
  });
});

describe('falsy-zero fix (predictionMarkets.js)', () => {
  it('a real 0c price is a ~1c longshot, not a fake 50%', () => {
    const r = calculateNetOdds({ priceCents: 0, exchange: 'kalshi' });
    expect(r.priceCents).toBe(1);
    expect(r.grossProb).toBe(0.01);
    expect(probabilityToAmerican(0)).toBe(99900);
    expect(calculateNetOdds({ priceCents: undefined }).priceCents).toBe(50);
  });
});
