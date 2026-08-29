// src/components/modals/UnitCalculatorModal.jsx
// Unit sizing calculator with Kelly Criterion and risk management

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, TrendingUp, AlertTriangle, Target, Info } from 'lucide-react';
import { getRecommendedUnit, getBankrollData } from '../../lib/bankroll';
import { calculateRiskSizing } from '../../lib/riskSizing';

export default function UnitCalculatorModal({ isOpen, onClose }) {
    const [bankroll, setBankroll] = useState(1000);
    const [winProbability, setWinProbability] = useState(55);
    const [odds, setOdds] = useState(-110);
    const [confidence, setConfidence] = useState(70);
    const [riskProfile, setRiskProfile] = useState('moderate');

    // Resets bankroll/riskProfile from storage each time the modal opens --
    // a real sync effect (reacts to the isOpen prop), not derivable state.
    useEffect(() => {
        if (isOpen) {
            // Load current bankroll settings
            const data = getBankrollData();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBankroll(data.settings.totalBankroll);
            setRiskProfile(data.settings.riskTolerance || 'moderate');
        }
    }, [isOpen]);

    // Pure derivation of the calculator inputs -- computed during render via
    // useMemo rather than useState+useEffect (avoids
    // react-hooks/set-state-in-effect and the extra render that a
    // setState-from-effect round-trip would cost).
    const results = useMemo(() => {
        if (winProbability <= 0 || winProbability >= 100 || bankroll <= 0) {
            return null;
        }

        const risk = calculateRiskSizing({
            model_probability: winProbability,
            odds,
            bankroll,
            unit_size: bankroll * 0.01,
            fractional_kelly: 0.25,
            max_stake_fraction: 0.05,
        });

        if (risk.status === 'error') return null;

        // Risk-based recommendation
        const recommended = getRecommendedUnit(confidence, bankroll, riskProfile);

        // Fixed percentage recommendations
        const conservative = bankroll * 0.01; // 1%
        const moderate = bankroll * 0.025; // 2.5%
        const aggressive = bankroll * 0.05; // 5%

        return {
            risk,
            kelly: risk.full_kelly_stake,
            cappedKelly: risk.recommended_stake,
            recommended: recommended.amount,
            recommendedUnits: recommended.units,
            conservative,
            moderate,
            aggressive,
            breakeven: risk.market_implied_probability * 100,
            evPerDollar: risk.expected_value_per_dollar,
            edgePoints: risk.edge_probability_points * 100,
            volatility: risk.return_volatility,
            signalToNoise: risk.signal_to_noise,
            growthAtRecommended: risk.geometric_growth_at_recommended,
        };
    }, [bankroll, winProbability, odds, confidence, riskProfile]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getOddsColor = (value) => {
        if (bankroll <= 0) return 'text-slate-400';
        if (value <= bankroll * 0.02) return 'text-emerald-400';
        if (value <= bankroll * 0.05) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getRiskLevel = (amount) => {
        const safeBankroll = Number(bankroll) > 0 ? Number(bankroll) : 1;
        const percentage = (Number(amount) / safeBankroll) * 100;
        if (percentage <= 2) return { level: 'Conservative', color: 'text-emerald-400' };
        if (percentage <= 5) return { level: 'Moderate', color: 'text-yellow-400' };
        return { level: 'Aggressive', color: 'text-red-400' };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <Calculator className="w-6 h-6 text-blue-400" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Unit Size Calculator</h2>
                            <p className="text-slate-400 text-sm">Calculate optimal bet sizing using Kelly Criterion and risk management</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Panel */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Bet Parameters</h3>
                            
                            {/* Bankroll */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Total Bankroll
                                </label>
                                <input
                                    type="number"
                                    value={bankroll}
                                    onChange={(e) => setBankroll(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                    min="1"
                                    step="10"
                                />
                            </div>

                            {/* Win Probability */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Win Probability (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="range"
                                        value={winProbability}
                                        onChange={(e) => setWinProbability(Number(e.target.value))}
                                        className="w-full"
                                        min="1"
                                        max="99"
                                        step="0.5"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>1%</span>
                                        <span className="text-white font-medium">{winProbability}%</span>
                                        <span>99%</span>
                                    </div>
                                    {results && (
                                        <p className="text-xs text-slate-400 mt-2">
                                            Breakeven: {results.breakeven.toFixed(1)}%
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Odds */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    American Odds
                                </label>
                                <input
                                    type="number"
                                    value={odds}
                                    onChange={(e) => setOdds(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                    step="5"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Common: -110, +100, -200, +150
                                </p>
                            </div>

                            {/* Confidence */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Confidence Level (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="range"
                                        value={confidence}
                                        onChange={(e) => setConfidence(Number(e.target.value))}
                                        className="w-full"
                                        min="0"
                                        max="100"
                                        step="5"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>Low</span>
                                        <span className="text-white font-medium">{confidence}%</span>
                                        <span>High</span>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Profile */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Risk Profile
                                </label>
                                <select
                                    value={riskProfile}
                                    onChange={(e) => setRiskProfile(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                >
                                    <option value="conservative">Conservative (1-3%)</option>
                                    <option value="moderate">Moderate (2-5%)</option>
                                    <option value="aggressive">Aggressive (3-10%)</option>
                                </select>
                            </div>
                        </div>

                        {/* Results Panel */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
                            
                            {results ? (
                                <div className="space-y-4">
                                    {/* Kelly Criterion */}
                                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-slate-300 font-medium">Kelly Criterion</span>
                                            <div className="flex items-center gap-1">
                                                <Info className="w-4 h-4 text-blue-400" />
                                            </div>
                                        </div>
                                        <p className={`text-xl font-bold ${getOddsColor(results.kelly)}`}>
                                            {formatCurrency(results.kelly)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {((results.kelly / bankroll) * 100).toFixed(2)}% of bankroll
                                        </p>
                                        <div className={`text-xs mt-2 ${getRiskLevel(results.kelly).color}`}>
                                            Risk Level: {getRiskLevel(results.kelly).level}
                                        </div>
                                    </div>

                                    {/* Capped Kelly */}
                                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-slate-300 font-medium">Quarter Kelly / Capped</span>
                                            <Target className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <p className="text-xl font-bold text-emerald-400">
                                            {formatCurrency(results.cappedKelly)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {((results.cappedKelly / bankroll) * 100).toFixed(2)}% of bankroll after 25% Kelly and 5% cap
                                        </p>
                                    </div>

                                    {/* Risk Lens */}
                                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-slate-300 font-medium">Risk Lens</span>
                                            <Info className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <p className="text-slate-500">Market breakeven</p>
                                                <p className="text-white font-semibold">{results.breakeven.toFixed(2)}%</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Model edge</p>
                                                <p className={results.edgePoints > 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                                                    {results.edgePoints > 0 ? '+' : ''}{results.edgePoints.toFixed(2)} pts
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">EV per $1</p>
                                                <p className={results.evPerDollar > 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                                                    {results.evPerDollar >= 0 ? '+' : ''}{results.evPerDollar.toFixed(3)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Signal / noise</p>
                                                <p className="text-white font-semibold">
                                                    {results.signalToNoise == null ? 'N/A' : results.signalToNoise.toFixed(3)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Return volatility</p>
                                                <p className="text-white font-semibold">{results.volatility.toFixed(3)}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Log growth</p>
                                                <p className={results.growthAtRecommended > 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                                                    {(results.growthAtRecommended * 100).toFixed(3)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommended */}
                                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 border-blue-500/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-slate-300 font-medium">Recommended</span>
                                            <TrendingUp className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <p className="text-xl font-bold text-blue-400">
                                            {formatCurrency(results.recommended)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {results.recommendedUnits.toFixed(1)} units • {((results.recommended / bankroll) * 100).toFixed(2)}%
                                        </p>
                                    </div>

                                    {/* Fixed Percentages */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-slate-300">Fixed Percentage Options</h4>
                                        
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-slate-800 rounded p-3 text-center">
                                                <p className="text-xs text-slate-400">Conservative</p>
                                                <p className="text-sm font-bold text-emerald-400">{formatCurrency(results.conservative)}</p>
                                                <p className="text-xs text-slate-500">1%</p>
                                            </div>
                                            <div className="bg-slate-800 rounded p-3 text-center">
                                                <p className="text-xs text-slate-400">Moderate</p>
                                                <p className="text-sm font-bold text-yellow-400">{formatCurrency(results.moderate)}</p>
                                                <p className="text-xs text-slate-500">2.5%</p>
                                            </div>
                                            <div className="bg-slate-800 rounded p-3 text-center">
                                                <p className="text-xs text-slate-400">Aggressive</p>
                                                <p className="text-sm font-bold text-red-400">{formatCurrency(results.aggressive)}</p>
                                                <p className="text-xs text-slate-500">5%</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warning */}
                                    {results.kelly > bankroll * 0.1 && (
                                        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-yellow-400">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="text-sm font-medium">High Risk Warning</span>
                                            </div>
                                            <p className="text-xs text-yellow-300 mt-1">
                                                Kelly suggests a high bet size. Consider using capped Kelly or fixed percentages for safer bankroll management.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-8">
                                    <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Enter valid parameters to see recommendations</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Educational Info */}
                    <div className="mt-8 pt-6 border-t border-slate-700">
                        <h4 className="text-sm font-medium text-white mb-3">Kelly Criterion Formula</h4>
                        <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300">
                            EV = p*b - q  |  f = (bp - q) / b  |  g(f) = p ln(1 + fb) + q ln(1 - f)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-xs text-slate-400">
                            <div><strong>f</strong> = fraction to bet</div>
                            <div><strong>b</strong> = net odds</div>
                            <div><strong>p</strong> = win probability</div>
                            <div><strong>q</strong> = loss probability (1-p)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
