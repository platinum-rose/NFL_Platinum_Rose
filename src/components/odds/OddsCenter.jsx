// src/components/odds/OddsCenter.jsx
// Main container for all live odds and line shopping features

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Target, Activity, DollarSign, LineChart } from 'lucide-react';
import LiveOddsDashboard from './LiveOddsDashboard';
import LineMovementTracker from './LineMovementTracker';
import ArbitrageFinder from './ArbitrageFinder';
import SteamMoveTracker from './SteamMoveTracker';
import BetValueComparison from './BetValueComparison';
import LineHistoryChart from './LineHistoryChart';
import {
  findArbitrageOpportunities,
  generateMockMultiBookData,
  getLineMovements,
} from '../../lib/enhancedOddsApi';
import { loadFromStorage, PR_STORAGE_KEYS } from '../../lib/storage';

// --- Arbitrage badge: mirrors ArbitrageFinder.loadOpportunities ---
function computeArbCount() {
  const games = loadFromStorage(PR_STORAGE_KEYS.CACHED_ODDS.key, null);
  if (games !== null) {
    try {
      const arbs = findArbitrageOpportunities(games);
      if (arbs.length > 0) return arbs.length;
    } catch (_) { /* fall through */ }
  }
  // Fall back to mock multi-book data (same as child component)
  return findArbitrageOpportunities(generateMockMultiBookData()).length;
}

// --- Steam badge: mirrors SteamMoveTracker.load ---
function computeSteamCount() {
  return getLineMovements(24).length;
}

export default function OddsCenter() {
  const [activeTab, setActiveTab] = useState('live-odds');
  // Lazy initializers instead of useState(0) + a mount-only effect: both
  // badges are a one-time sync read from localStorage, so there's nothing
  // to "effect" -- computed once, directly, as the initial state.
  const [arbBadge] = useState(computeArbCount);
  const [steamBadge] = useState(computeSteamCount);

  const tabs = [
    {
      id: 'live-odds',
      label: 'Live Odds',
      icon: BarChart3,
      description: 'Real-time odds comparison'
    },
    {
      id: 'line-movements',
      label: 'Line Movements',
      icon: TrendingUp,
      description: 'Track line changes and alerts'
    },
    {
      id: 'arbitrage',
      label: 'Arbitrage',
      icon: Target,
      description: 'Find guaranteed profit opportunities',
      badge: arbBadge > 0 ? String(arbBadge) : null,
    },
    {
      id: 'steam-moves',
      label: 'Steam Moves',
      icon: Activity,
      description: 'Sharp money movements',
      badge: steamBadge > 0 ? String(steamBadge) : null,
    },
    {
      id: 'bet-value',
      label: 'Bet Value',
      icon: DollarSign,
      description: 'Your bets vs market lines',
    },
    {
      id: 'line-history',
      label: 'Line History',
      icon: LineChart,
      description: 'Historical line movement charts',
    },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'live-odds':
        return <LiveOddsDashboard />;
      case 'line-movements':
        return <LineMovementTracker />;
      case 'arbitrage':
        return <ArbitrageFinder />;
      case 'steam-moves':
        return <SteamMoveTracker />;
      case 'bet-value':
        return <BetValueComparison />;
      case 'line-history':
        return <LineHistoryChart />;
      default:
        return <LiveOddsDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 items-center justify-center gap-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
}
