// src/components/modals/UnitCalculatorModal.jsx
// Unit sizing calculator with Kelly Criterion and risk management

import React, { useState, useEffect, useCallback } from 'react';
import { X, Calculator, TrendingUp, AlertTriangle, Target, Info } from 'lucide-react';
import { calculateKellyUnit, getRecommendedUnit, getBankrollData } from '../../lib/bankroll';

export default function UnitCalculatorModal({ isOpen, onClose }) {
    const [bankroll, setBankroll] = useState(1000);
    const [winProbability, setWinProbability] = useState(55);
    const [odds, setOdds] = useState(-110);
    const [confidence, setConfidence] = useState(70);
    const [riskProfile, setRiskProfile] = useState('moderate');
    const [results, setResults] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // Load current bankroll settings
            const data = getBankrollData();
            setBankroll(data.settings.totalBankroll);
            setRiskProfile(data.settings.riskTolerance || 'moderate');
        }
    }, [isOpen]);

    const calculateBreakevenRate = (americanOdds) => {
        if (americanOdds > 0) {
            return (100 / (americanOdds + 100)) * 100;
        } else {
            return (Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)) * 100;
        }
    };

    const calculateRecommendations = useCallback(() => {
        if (winProbability <= 0 || winProbability >= 100 || bankroll <= 0) {
            setResults(null);
            return;
        }

        // Kelly Criterion calculation
        const kellyAmount = calculateKellyUnit(winProbability, odds, bankroll);
        
        // Conservative recommendation (capped Kelly)
        const cappedKelly = Math.min(kellyAmount, bankroll * 0.05); // Max 5% of bankroll
        
        // Risk-based recommendation
        const recommended = getRecommendedUnit(confidence, bankroll, riskProfile);
        
        // Fixed percentage recommendations
        const conservative = bankroll * 0.01; // 1%
        const moderate = bankroll * 0.025; // 2.5%
        const aggressive = bankroll * 0.05; // 5%

        setResults({
            kelly: kellyAmount,
            cappedKelly,
            recommended: recommended.amount,
            recommendedUnits: recommended.units,
            conservative,
            moderate,
            aggressive,
            breakeven: calculateBreakevenRate(odds)
        });
    }, [bankroll, winProbability, odds, confidence, riskProfile]);

    useEffect(() => {
        calculateRecommendations();
    }, [calculateRecommendations]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getOddsColor = (value) => {
        if (value <= bankroll * 0.02) return 'text-emerald-400';
        if (value <= bankroll * 0.05) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getRiskLevel = (amount) => {
        const percentage = (amount / bankroll) * 100;
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
                                            <span className="text-slate-300 font-medium">Capped Kelly (Max 5%)</span>
                                            <Target className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <p className="text-xl font-bold text-emerald-400">
                                            {formatCurrency(results.cappedKelly)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {((results.cappedKelly / bankroll) * 100).toFixed(2)}% of bankroll
                                        </p>
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
                            f = (bp - q) / b
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-xs text-slate-400">
                            <div><strong>f</strong> = fraction to bet</div>
                            <div><strong>b</strong> = decimal odds</div>
                            <div><strong>p</strong> = win probability</div>
                            <div><strong>q</strong> = loss probability (1-p)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}