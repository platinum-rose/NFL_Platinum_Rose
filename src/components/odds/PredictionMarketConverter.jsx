import React, { useState } from 'react';
import {
  americanToDecimal,
  americanToProbability,
  calculateNetOdds,
  compareMarketOdds,
  evaluateOrderBook,
} from '../../lib/predictionMarkets.js';

export default function PredictionMarketConverter({ isOpen = true, onClose }) {
  const [exchange, setExchange] = useState('kalshi');
  const [customFeePct, setCustomFeePct] = useState(1.5);
  const [applyFee, setApplyFee] = useState(true);
  const [inputMode, setInputMode] = useState('single_price'); // 'single_price' | 'order_book'
  const [priceCents, setPriceCents] = useState(35);
  const [yesBid, setYesBid] = useState(34);
  const [yesAsk, setYesAsk] = useState(36);
  const [comparisonBookOdds, setComparisonBookOdds] = useState('+160');

  if (!isOpen && onClose) return null;

  // Single price evaluation
  const singleOdds = calculateNetOdds({
    priceCents,
    exchange,
    customFeePct,
    applyFee,
  });

  // Order book evaluation
  const orderBook = evaluateOrderBook({
    yesBid,
    yesAsk,
    exchange,
    customFeePct,
  });

  const activeOdds = inputMode === 'single_price' ? singleOdds : orderBook.buyYes;
  const parsedBookOdds = parseInt(comparisonBookOdds, 10) || 100;
  const comparison = compareMarketOdds(activeOdds.netAmericanOdds, parsedBookOdds);

  const formatAmerican = (val) => (val > 0 ? `+${val}` : `${val}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gray-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl text-gray-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 text-xl font-bold">
              📊
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Prediction Market Odds Converter & Shopping Engine
              </h2>
              <p className="text-xs text-gray-400">
                Kalshi & Polymarket Cents ➔ Fee-Adjusted American Betting Odds
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-semibold px-2 py-1 rounded-lg hover:bg-gray-800 transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Input Mode & Exchange Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
              Exchange & Fee Model
            </label>
            <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
              {['kalshi', 'polymarket', 'custom'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setExchange(ex)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium capitalize transition ${
                    exchange === ex
                      ? 'bg-emerald-500 text-black font-semibold shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
              Calculation Mode
            </label>
            <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
              <button
                onClick={() => setInputMode('single_price')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition ${
                  inputMode === 'single_price'
                    ? 'bg-emerald-500 text-black font-semibold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Single Contract Price
              </button>
              <button
                onClick={() => setInputMode('order_book')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition ${
                  inputMode === 'order_book'
                    ? 'bg-emerald-500 text-black font-semibold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Order Book Bid/Ask
              </button>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-5 mb-5 space-y-4">
          {inputMode === 'single_price' ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-200">
                  YES Contract Price
                </span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  {priceCents}¢ <span className="text-xs text-gray-400">(${(priceCents / 100).toFixed(2)})</span>
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="99"
                value={priceCents}
                onChange={(e) => setPriceCents(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-2xs text-gray-500 mt-1">
                <span>1¢ (Underdog +9900)</span>
                <span>50¢ (+100)</span>
                <span>99¢ (Favorite -9900)</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">YES Bid Price (Cents)</label>
                <input
                  type="number"
                  min="1"
                  max="98"
                  value={yesBid}
                  onChange={(e) => setYesBid(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-base focus:border-emerald-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">YES Ask Price (Cents)</label>
                <input
                  type="number"
                  min="2"
                  max="99"
                  value={yesAsk}
                  onChange={(e) => setYesAsk(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-base focus:border-emerald-400 outline-none"
                />
              </div>
            </div>
          )}

          {/* Fee Adjuster Toggles */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700/50 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                checked={applyFee}
                onChange={(e) => setApplyFee(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-0"
              />
              <span>Deduct Exchange Fees (Vig Adjuster)</span>
            </label>
            {exchange === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Custom Fee %:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={customFeePct}
                  onChange={(e) => setCustomFeePct(Number(e.target.value))}
                  className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-0.5 text-white font-mono text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 text-center">
            <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Implied Prob.
            </span>
            <span className="text-lg font-mono font-bold text-white">
              {(activeOdds.grossProb * 100).toFixed(1)}%
            </span>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 text-center">
            <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Gross American
            </span>
            <span className="text-lg font-mono font-bold text-gray-300">
              {formatAmerican(activeOdds.grossAmericanOdds)}
            </span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-center shadow-lg">
            <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
              Net Fee-Adjusted
            </span>
            <span className="text-xl font-mono font-bold text-emerald-300">
              {formatAmerican(activeOdds.netAmericanOdds)}
            </span>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 text-center">
            <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Decimal Payout
            </span>
            <span className="text-lg font-mono font-bold text-gray-300">
              {activeOdds.decimalOdds.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Order Book Midpoint Summary (if in order book mode) */}
        {inputMode === 'order_book' && (
          <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3 mb-5 text-xs text-blue-200 flex justify-between items-center">
            <div>
              <span className="font-semibold">No-Vig Midpoint:</span> {orderBook.midpointCents}¢ ({(orderBook.midpointProb * 100).toFixed(1)}%)
            </div>
            <div>
              <span className="font-semibold">Fair No-Vig American:</span>{' '}
              <span className="font-mono text-blue-300 font-bold">{formatAmerican(orderBook.fairMidAmericanOdds)}</span>
            </div>
          </div>
        )}

        {/* Head-to-Head Sportsbook Price Matcher */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
            <span>🛒</span> Head-to-Head Sportsbook Price Shopping Matcher
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:w-auto flex items-center gap-3">
              <span className="text-xs text-gray-400 whitespace-nowrap">Sportsbook Line:</span>
              <input
                type="text"
                value={comparisonBookOdds}
                onChange={(e) => setComparisonBookOdds(e.target.value)}
                placeholder="+160"
                className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm text-center outline-none focus:border-emerald-400"
              />
            </div>

            <div className="w-full sm:w-auto text-right">
              {comparison.betterMarket === 'prediction_market' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-semibold">
                  <span>🚀 Prediction Market is Better (+{comparison.americanDelta} cent edge, +{comparison.valueEdgePct}% EV)</span>
                </div>
              ) : comparison.betterMarket === 'sportsbook' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-semibold">
                  <span>🏛️ Sportsbook Offers Better Price ({comparison.americanDelta} cent diff)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs">
                  <span>Equal Value</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
