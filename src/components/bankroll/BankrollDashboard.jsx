// src/components/bankroll/BankrollDashboard.jsx
// Main bankroll management dashboard

import logger from '../../lib/logger';
import React, { useState, useEffect } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown, Target, Calculator,
    Plus, Settings, Download, Upload, Calendar, BarChart3,
    Award, AlertTriangle, Clock, CheckCircle
} from 'lucide-react';
import {
    calculateAnalytics,
    getBankrollData,
    updateBankrollSettings,
    BET_STATUS,
    BET_TYPES,
    exportBankrollData,
    importBankrollData,
    calculateKellyUnit,
    getRecommendedUnit
} from '../../lib/bankroll';

// ── Kelly Criterion Sizing Calculator ──────────────────────────────────────

function KellyCalculator({ bankroll = 1000, unitSize = 50 }) {
    const [winProb, setWinProb]     = useState(55);
    const [odds, setOdds]           = useState(-110);
    const [riskProfile, setProfile] = useState('moderate');
    const [expanded, setExpanded]   = useState(false);

    // Decimal odds of profit: -110 → 100/110 ≈ 0.909; +150 → 1.5
    const decimalB = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
    const p = winProb / 100;
    const q = 1 - p;
    const kellyFraction = (decimalB * p - q) / decimalB;
    const cappedFull    = Math.min(Math.max(kellyFraction, 0), 0.25);

    const fullKelly    = bankroll * cappedFull;
    const halfKelly    = fullKelly / 2;
    const quarterKelly = fullKelly / 4;
    const recommended  = getRecommendedUnit(winProb, bankroll, riskProfile);
    const hasEdge      = kellyFraction > 0;
    const breakEvenWin = 1 / (1 + decimalB) * 100;

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    const pct = (n) => `${(n * 100).toFixed(2)}%`;

    const tierColor = (amount) => {
        const pctOfBankroll = amount / bankroll;
        if (pctOfBankroll > 0.1) return 'text-rose-400';
        if (pctOfBankroll > 0.05) return 'text-amber-400';
        return 'text-emerald-400';
    };

    return (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            {/* Header / toggle */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-900/40 rounded-lg">
                        <Calculator className="text-indigo-400" size={18} />
                    </div>
                    <div className="text-left">
                        <p className="text-white font-semibold text-sm">Kelly Criterion Sizer</p>
                        <p className="text-slate-400 text-xs">Optimal stake sizing based on edge &amp; odds</p>
                    </div>
                </div>
                <TrendingUp size={16} className={`text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>

            {expanded && (
                <div className="p-5 border-t border-slate-700 space-y-6">
                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                Win Probability (%)
                            </label>
                            <input
                                type="number" min="1" max="99" step="1"
                                value={winProb}
                                onChange={e => setWinProb(Math.min(99, Math.max(1, Number(e.target.value))))}
                                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Break-even: {breakEvenWin.toFixed(1)}%</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                Odds (American)
                            </label>
                            <input
                                type="number" step="5"
                                value={odds}
                                onChange={e => setOdds(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="-110"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Decimal profit: {decimalB.toFixed(3)}x</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                Risk Profile
                            </label>
                            <select
                                value={riskProfile}
                                onChange={e => setProfile(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            >
                                <option value="conservative">Conservative (1u max 3%)</option>
                                <option value="moderate">Moderate (2u max 5%)</option>
                                <option value="aggressive">Aggressive (3u max 10%)</option>
                            </select>
                        </div>
                    </div>

                    {/* Edge indicator */}
                    {!hasEdge && (
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                            <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                            <p className="text-rose-300 text-xs font-medium">
                                No positive edge detected at {winProb}% / {odds > 0 ? '+' : ''}{odds}.
                                Kelly recommends <strong>no bet</strong> ({(kellyFraction * 100).toFixed(2)}% fraction).
                            </p>
                        </div>
                    )}

                    {/* Sizing results */}
                    {hasEdge && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Full Kelly', amount: fullKelly, pctFrac: cappedFull, desc: 'Max theoretical' },
                                { label: 'Half Kelly', amount: halfKelly, pctFrac: cappedFull / 2, desc: 'Recommended' },
                                { label: 'Quarter Kelly', amount: quarterKelly, pctFrac: cappedFull / 4, desc: 'Conservative' },
                                { label: 'Recommended', amount: recommended.amount, pctFrac: recommended.percentage / 100, desc: riskProfile + ' profile' },
                            ].map(tier => (
                                <div key={tier.label} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{tier.label}</p>
                                    <p className={`text-xl font-black ${tierColor(tier.amount)}`}>{fmt(tier.amount)}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{pct(tier.pctFrac)} of bankroll</p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">{tier.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Comparison to current unit size */}
                    {hasEdge && (
                        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/50">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">vs. Your Current Unit</p>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-500" />
                                    <span className="text-sm text-slate-300">Current unit: <strong className="text-white">{fmt(unitSize)}</strong> ({pct(unitSize / bankroll)})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-400" />
                                    <span className="text-sm text-slate-300">½ Kelly: <strong className={tierColor(halfKelly)}>{fmt(halfKelly)}</strong></span>
                                </div>
                                {halfKelly > unitSize * 1.5 && (
                                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                                        ↑ Edge suggests sizing up
                                    </span>
                                )}
                                {halfKelly < unitSize * 0.5 && (
                                    <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                                        ↓ Overbet for this edge
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function BankrollDashboard({ onAddBet, onShowCalculator, onImportBets, onShowPending, onShowSettings }) {
    const [analytics, setAnalytics] = useState(null);
    const [timeframe, setTimeframe] = useState('all');
    const [loading, setLoading] = useState(true);
    const [bankrollData, setBankrollData] = useState(null);

    useEffect(() => {
        loadData();
    }, [timeframe]);

    const loadData = () => {
        setLoading(true);
        try {
            const data = getBankrollData();
            const analyticsData = calculateAnalytics(timeframe);
            setBankrollData(data);
            setAnalytics(analyticsData);
        } catch (error) {
            logger.error('Error loading bankroll data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const data = exportBankrollData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bankroll-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatPercent = (value) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    if (loading || !analytics) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const { settings } = bankrollData;
    const profitColor = analytics.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400';
    const roiColor = analytics.roi >= 0 ? 'text-emerald-400' : 'text-red-400';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Bankroll Management</h1>
                    <p className="text-slate-400 mt-1">Track your betting performance and manage your bankroll</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Timeframe Filter */}
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                        <option value="all">All Time</option>
                        <option value="season">This Season</option>
                        <option value="month">Last 30 Days</option>
                        <option value="week">Last 7 Days</option>
                        <option value="today">Today</option>
                    </select>

                    <button
                        onClick={onShowCalculator}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-white transition-colors"
                    >
                        <Calculator size={16} />
                        Calculator
                    </button>

                    <button
                        onClick={onImportBets}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
                    >
                        <Upload size={16} />
                        Import Bets
                    </button>

                    <button
                        onClick={onShowPending}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg text-white transition-colors"
                    >
                        <Clock size={16} />
                        Pending Bets
                    </button>

                    <button
                        onClick={onAddBet}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-white transition-colors"
                    >
                        <Plus size={16} />
                        Add Bet
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Current Bankroll */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Current Bankroll</p>
                            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(analytics.currentBankroll)}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Started: {formatCurrency(settings.totalBankroll)}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${analytics.totalProfit >= 0 ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
                            <DollarSign className={`w-6 h-6 ${profitColor}`} />
                        </div>
                    </div>
                </div>

                {/* Total P&L */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Total P&L</p>
                            <p className={`text-2xl font-bold mt-1 ${profitColor}`}>
                                {formatCurrency(analytics.totalProfit)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {analytics.unitsWon > 0 ? '+' : ''}{analytics.unitsWon.toFixed(2)} units
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${analytics.totalProfit >= 0 ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
                            {analytics.totalProfit >= 0 ?
                                <TrendingUp className="w-6 h-6 text-emerald-400" /> :
                                <TrendingDown className="w-6 h-6 text-red-400" />
                            }
                        </div>
                    </div>
                </div>

                {/* Win Rate */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Win Rate</p>
                            <p className="text-2xl font-bold text-white mt-1">{analytics.winRate.toFixed(1)}%</p>
                            <p className="text-xs text-slate-500 mt-1">
                                {analytics.wins}W - {analytics.losses}L - {analytics.pushes}P
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-900/20">
                            <Target className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* ROI */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">ROI</p>
                            <p className={`text-2xl font-bold mt-1 ${roiColor}`}>
                                {formatPercent(analytics.roi)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {formatCurrency(analytics.totalWagered)} wagered
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${analytics.roi >= 0 ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
                            <BarChart3 className={`w-6 h-6 ${roiColor}`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Form & Streaks */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400 text-sm">Recent Form (Last 10)</span>
                                <span className="text-white font-medium">{analytics.recentForm.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${analytics.recentForm}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="text-center">
                                <p className="text-slate-400 text-xs">Current Streak</p>
                                <p className={`text-lg font-bold ${analytics.currentStreak.type === 'win' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {analytics.currentStreak.count} {analytics.currentStreak.type === 'win' ? 'W' : 'L'}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400 text-xs">Best Streak</p>
                                <p className="text-lg font-bold text-emerald-400">{analytics.longestWinStreak}W</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bet Type Breakdown */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Bet Types</h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.betsByType).map(([type, data]) => {
                            const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0;
                            const profitColor = data.profit >= 0 ? 'text-emerald-400' : 'text-red-400';

                            return (
                                <div key={type} className="flex justify-between items-center">
                                    <div>
                                        <p className="text-white font-medium capitalize">{type}</p>
                                        <p className="text-xs text-slate-400">{data.count} bets • {winRate.toFixed(1)}%</p>
                                    </div>
                                    <p className={`font-bold ${profitColor}`}>
                                        {formatCurrency(data.profit)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total Bets</span>
                            <span className="text-white font-medium">{analytics.totalBets}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Pending</span>
                            <span className="text-yellow-400 font-medium">{analytics.pendingBets}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Avg Bet Size</span>
                            <span className="text-white font-medium">{formatCurrency(analytics.avgWager)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Biggest Win</span>
                            <span className="text-emerald-400 font-medium">{formatCurrency(analytics.biggestWin)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Biggest Loss</span>
                            <span className="text-red-400 font-medium">{formatCurrency(analytics.biggestLoss)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kelly Criterion Sizing Calculator */}
            <KellyCalculator bankroll={analytics.currentBankroll} unitSize={settings.unitSize} />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white transition-colors"
                >
                    <Download size={16} />
                    Export Data
                </button>
                <button
                    onClick={() => onShowSettings()}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white transition-colors"
                >
                    <Settings size={16} />
                    Settings
                </button>
            </div>
        </div>
    );
}