// src/components/modals/PredictionMarketModal.jsx
import React, { useState } from 'react';
import { X, ExternalLink, TrendingUp, DollarSign, Activity, Award, Calculator } from 'lucide-react';
import { compareMarketOdds } from '../../lib/predictionMarkets.js';

const PredictionMarketModal = ({ isOpen, contract, onClose }) => {
  // "Compare vs. Sportsbook" (2026-08-24): folded in from the old header-level
  // Kalshi/Poly tool (PredictionMarketConverter.jsx), which was a standalone
  // manual calculator you had to open separately and re-enter a price into.
  // That header button is gone now that every game with a matched contract
  // shows this exact contract inline on its card (see MatchupCard.jsx's
  // PREDICTION MARKET BADGE) -- this section keeps the "is the prediction
  // market or my sportsbook offering better value" comparison, just attached
  // to the specific contract you clicked into instead of a blank global form.
  const [showCompare, setShowCompare] = useState(false);
  const [bookOddsInput, setBookOddsInput] = useState('');

  if (!isOpen || !contract) return null;

  const exchangeName = contract.exchange || 'Kalshi';
  const priceCents = contract.price_cents ?? 50;
  const impliedPct = contract.implied_prob_pct ?? priceCents;
  const isKalshi = String(exchangeName).toLowerCase().includes('kalshi');
  const marketUrl = contract.url || contract.exchange_url || (isKalshi ? 'https://kalshi.com' : 'https://polymarket.com');
  const netOdds = contract.net_american_odds ?? contract.american_odds ?? 100;
  const americanOdds = netOdds > 0 ? `+${netOdds}` : `${netOdds}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
              [{exchangeName}] Market Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Market Title */}
        <div>
          <h3 className="text-base font-bold text-white leading-snug">
            {contract.title || contract.question || 'Prediction Market Contract'}
          </h3>
          {contract.ticker && (
            <div className="text-xs font-mono text-slate-400 mt-1">
              Ticker: <span className="text-slate-200">{contract.ticker}</span>
            </div>
          )}
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Contract Price</div>
            <div className="text-lg font-black text-emerald-400 font-mono">{priceCents}¢</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Implied Prob</div>
            <div className="text-lg font-black text-white font-mono">{impliedPct}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">American Odds</div>
            <div className="text-lg font-black text-emerald-300 font-mono">{americanOdds}</div>
          </div>
        </div>

        {/* Market Details */}
        <div className="space-y-2 text-xs text-slate-300">
          {contract.description && (
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 leading-relaxed">
              {contract.description}
            </div>
          )}
          {contract.volume_usd && (
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Market Volume:</span>
              <span className="text-white font-bold">${Number(contract.volume_usd).toLocaleString()}</span>
            </div>
          )}
          {contract.expiration_date && (
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Expiry Date:</span>
              <span className="text-white">{new Date(contract.expiration_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Compare vs. Sportsbook */}
        <div className="border-t border-slate-800 pt-3">
          <button
            onClick={() => setShowCompare(!showCompare)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-white uppercase tracking-wide transition-colors"
          >
            <span className="flex items-center gap-1.5"><Calculator size={12} /> Compare vs. Sportsbook</span>
            <span className="text-slate-500 normal-case font-normal">{showCompare ? 'Hide ▲' : 'Show ▼'}</span>
          </button>
          {showCompare && (
            <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-500 font-mono shrink-0">Your book's American odds:</label>
                <input
                  type="text"
                  value={bookOddsInput}
                  onChange={(e) => setBookOddsInput(e.target.value)}
                  placeholder="+160"
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-right focus:outline-none focus:border-emerald-500"
                />
              </div>
              {bookOddsInput.trim() !== '' && (() => {
                const parsedBookOdds = parseInt(bookOddsInput, 10);
                if (Number.isNaN(parsedBookOdds)) {
                  return <div className="text-[10px] text-rose-400">Enter a valid American odds number, e.g. +160 or -140.</div>;
                }
                const cmp = compareMarketOdds(netOdds, parsedBookOdds);
                const label = cmp.betterMarket === 'prediction_market' ? `${exchangeName} has the edge` : cmp.betterMarket === 'sportsbook' ? 'Your sportsbook has the edge' : 'Roughly equal value';
                const color = cmp.betterMarket === 'prediction_market' ? 'text-emerald-400' : cmp.betterMarket === 'sportsbook' ? 'text-amber-400' : 'text-slate-400';
                return (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1">
                    <div className={`font-bold ${color}`}>{label}{cmp.isSignificantEdge ? ' — significant edge (3%+)' : ''}</div>
                    <div className="flex justify-between text-slate-400"><span>Value edge:</span><span className="text-white font-mono">{cmp.valueEdgePct}%</span></div>
                    <div className="flex justify-between text-slate-400"><span>American odds delta:</span><span className="text-white font-mono">{cmp.americanDelta > 0 ? `+${cmp.americanDelta}` : cmp.americanDelta}</span></div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Action Button: Direct External Link */}
        <div className="pt-2">
          <a
            href={marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/40"
          >
            <span>Trade / View Market on {exchangeName}.com</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PredictionMarketModal;
