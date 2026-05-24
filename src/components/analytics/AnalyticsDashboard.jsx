// src/components/analytics/AnalyticsDashboard.jsx
// Thin orchestrator — delegates logic to analyticsEngine + sub-components

import logger from '../../lib/logger';
import React, { useState, useEffect } from 'react';
import { RefreshCw, BarChart3, Target } from 'lucide-react';
import OutcomesDashboard from './OutcomesDashboard';
import { getBankrollData, calculateAnalytics as calcBasicAnalytics, BET_STATUS } from '../../lib/bankroll';
import { generateTestData, calculateDetailedAnalytics } from './analyticsEngine';

import KeyMetricsGrid    from './KeyMetricsGrid';
import BetTypeBreakdown  from './BetTypeBreakdown';
import TeamPerformance   from './TeamPerformance';
import RiskAnalysis      from './RiskAnalysis';
import BettingPatterns   from './BettingPatterns';
import TrendChart        from './TrendChart';
import EdgeAnalysis      from './EdgeAnalysis';
import BookAnalytics     from './BookAnalytics';

export default function AnalyticsDashboard() {
  const [activeView, setActiveView] = useState('overview'); // 'overview' | 'outcomes'
  const [analytics, setAnalytics]       = useState(null);
  const [timeframe, setTimeframe]       = useState('all');
  const [betTypeFilter, setBetTypeFilter] = useState('all');
  const [loading, setLoading]           = useState(true);
  const [detailedStats, setDetailedStats] = useState(null);

  useEffect(() => { loadAnalytics(); }, [timeframe, betTypeFilter]);

  const loadAnalytics = () => {
    setLoading(true);
    try {
      const bankrollData = getBankrollData();
      const settledBets = bankrollData.bets
        ? bankrollData.bets.filter(b => b.status !== BET_STATUS.PENDING)
        : [];

      if (!settledBets || settledBets.length === 0) {
        const testData = generateTestData();
        setAnalytics(testData.analytics);
        setDetailedStats(testData.detailedStats);
      } else {
        setAnalytics(calcBasicAnalytics(timeframe));
        setDetailedStats(calculateDetailedAnalytics(bankrollData.bets, timeframe, betTypeFilter));
      }
    } catch (error) {
      logger.error('Error loading analytics:', error);
      const testData = generateTestData();
      setAnalytics(testData.analytics);
      setDetailedStats(testData.detailedStats);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ─────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading analytics...</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── View Switcher ──────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveView('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'overview'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 size={15} />
          Overview
        </button>
        <button
          onClick={() => setActiveView('outcomes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'outcomes'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target size={15} />
          Outcomes
        </button>
      </div>

      {/* ── Outcomes view ───────────────────────────────── */}
      {activeView === 'outcomes' && <OutcomesDashboard />}

      {/* ── Overview view ───────────────────────────────── */}
      {activeView === 'overview' && <>

      {/* Demo-mode banner */}
      {analytics && analytics.totalBets === 16 && (
        <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-blue-300 text-sm">
              <span className="font-medium">Demo Mode:</span> Showing sample betting data for demonstration. Complete some settled bets to see your real analytics!
            </p>
          </div>
        </div>
      )}

      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Betting Analytics</h1>
          <p className="text-slate-400 mt-1">Track performance and identify betting patterns</p>
        </div>

        <div className="flex flex-wrap gap-3">
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

          <select
            value={betTypeFilter}
            onChange={(e) => setBetTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm"
          >
            <option value="all">All Bet Types</option>
            <option value="spread">Spread</option>
            <option value="total">Total</option>
            <option value="moneyline">Moneyline</option>
            <option value="parlay">Parlay</option>
            <option value="prop">Prop</option>
            <option value="futures">Futures</option>
          </select>

          <button
            onClick={loadAnalytics}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Sub-components */}
      <KeyMetricsGrid analytics={analytics} detailedStats={detailedStats} />
      <BetTypeBreakdown performanceByType={detailedStats?.performanceByType} />
      <TeamPerformance teamPerformance={detailedStats?.teamPerformance} />

      {detailedStats?.riskMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskAnalysis riskMetrics={detailedStats.riskMetrics} />
          <BettingPatterns patterns={detailedStats?.patterns} />
        </div>
      )}

      <TrendChart trends={detailedStats?.trends} />
      <BookAnalytics bookAnalytics={detailedStats?.bookAnalytics} />
      <EdgeAnalysis analytics={analytics} detailedStats={detailedStats} />

      </> /* end overview */}
    </div>
  );
}