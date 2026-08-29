import React, { useState } from 'react';
import logger from '../../lib/logger';
import { X, Clock, Edit, CheckCircle, XCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { getBankrollData, updateBetResult, BET_STATUS } from '../../lib/bankroll';

// Utility function to calculate parlay payout
const calculateParlayPayout = (legs, amount) => {
  const validLegs = legs.filter(leg => leg.betType !== 'open' && leg.odds);
  if (validLegs.length === 0) return amount;
  
  let combinedOdds = 1;
  
  validLegs.forEach(leg => {
    const odds = leg.odds;
    let decimalOdds;
    
    if (odds > 0) {
      // Positive odds: +200 = 3.0 decimal
      decimalOdds = (odds / 100) + 1;
    } else {
      // Negative odds: -150 = 1.67 decimal
      decimalOdds = (100 / Math.abs(odds)) + 1;
    }
    
    combinedOdds *= decimalOdds;
  });
  
  return amount * combinedOdds;
};

export default function PendingBetsModal({ 
  isOpen, 
  onClose, 
  onEditBet = () => {},
  refreshData = () => {} 
}) {
  const [pendingBets, setPendingBets] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      loadPendingBets();
    }
  }, [isOpen]);

  // Add a method to refresh from outside
  React.useEffect(() => {
    if (isOpen) {
      const interval = setInterval(loadPendingBets, 1000); // Refresh every second while open
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadPendingBets = () => {
    setLoading(true);
    try {
      const data = getBankrollData();
      const pending = data.bets.filter(bet => bet.status === BET_STATUS.PENDING);
      setPendingBets(pending);
    } catch (error) {
      logger.error('Error loading pending bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeBet = (betId, status) => {
    const success = updateBetResult(betId, status);
    if (success) {
      loadPendingBets(); // Refresh list
      refreshData(); // Refresh parent data
      alert(`Bet graded as ${status}!`);
    } else {
      alert('Failed to grade bet');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getBetTypeColor = (betType) => {
    switch (betType) {
      case 'futures': return 'text-purple-400';
      case 'parlay': return 'text-blue-400';
      case 'spread': return 'text-emerald-400';
      case 'total': return 'text-amber-400';
      case 'moneyline': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600 p-2 rounded-lg">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Pending Bets</h2>
              <p className="text-slate-400 text-sm">
                {loading ? 'Loading...' : `${pendingBets.length} bet${pendingBets.length !== 1 ? 's' : ''} awaiting results`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading pending bets...</p>
            </div>
          ) : pendingBets.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Pending Bets</h3>
              <p className="text-slate-400">All your bets have been graded!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBets.map((bet) => (
                <div key={bet.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  
                  {/* Bet Header */}
                  <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">
                            {bet.game && bet.description && !bet.description.includes(bet.game) 
                              ? `${bet.game} — ${bet.description}` 
                              : (bet.description || bet.game || bet.selection || 'Imported Bet')}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getBetTypeColor(bet.type)} bg-slate-700`}>
                            {bet.type?.toUpperCase() || 'BET'}
                          </span>
                          {bet.imported && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-blue-900/20 text-blue-400">
                              {bet.source}
                            </span>
                          )}
                          {bet.isHedgingBet && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-orange-900/20 text-orange-400">
                              HEDGING
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Risk:</span>
                            <span className="text-white ml-2 font-medium">${bet.amount?.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">To Win:</span>
                            <span className="text-emerald-400 ml-2 font-medium">
                              ${bet.type === 'parlay' && bet.legs 
                                ? calculateParlayPayout(bet.legs, bet.amount).toFixed(2)
                                : (bet.potentialWin?.toFixed(2) || '0.00')
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Units:</span>
                            <span className="text-white ml-2 font-medium">{bet.units?.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Placed:</span>
                            <span className="text-white ml-2 font-medium">{formatDate(bet.date || bet.timestamp)}</span>
                          </div>
                        </div>

                        {bet.ticketNumber && (
                          <div className="mt-2">
                            <span className="text-slate-400 text-xs">Ticket #</span>
                            <span className="text-white ml-2 font-mono text-xs">{bet.ticketNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => onEditBet(bet)}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        
                        {bet.isParlay && bet.openSlots > 0 && (
                          <button
                            onClick={() => onEditBet(bet)}
                            className="flex items-center gap-1 bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                          >
                            <Plus size={14} />
                            Fill Slots
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleGradeBet(bet.id, BET_STATUS.WON)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          <CheckCircle size={14} />
                          Win
                        </button>
                        <button
                          onClick={() => handleGradeBet(bet.id, BET_STATUS.LOST)}
                          className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          <XCircle size={14} />
                          Loss
                        </button>
                        <button
                          onClick={() => handleGradeBet(bet.id, BET_STATUS.PUSHED)}
                          className="flex items-center gap-1 bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          <AlertCircle size={14} />
                          Push
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bet Legs (for parlays) */}
                  {bet.legs && bet.legs.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-white">
                          Bet Legs ({bet.legs.length})
                          {bet.openSlots > 0 && (
                            <span className="text-orange-400 ml-2">
                              • {bet.openSlots} open slot{bet.openSlots !== 1 ? 's' : ''}
                            </span>
                          )}
                        </h4>
                        <button
                          onClick={() => onEditBet(bet)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Edit size={12} />
                          Edit Legs
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {bet.legs.map((leg, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded border ${
                              leg.betType === 'open' 
                                ? 'border-orange-500/30 bg-orange-900/10' 
                                : 'border-slate-600 bg-slate-700/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">
                                    Leg {index + 1}:
                                  </span>
                                  {leg.betType === 'open' ? (
                                    <span className="text-orange-400 font-medium flex items-center gap-1">
                                      <Plus size={12} />
                                      OPEN SLOT
                                    </span>
                                  ) : (
                                    <span className="text-white font-medium">
                                      {leg.selection || (leg.team ? `${leg.team} ${leg.line ?? ''}` : leg.detail || 'Pick')}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {leg.betType === 'open' ? 'To Be Determined' : (leg.game || leg.matchup || '')}
                                </div>
                                {leg.gameTime && leg.gameTime !== 'TBD' && (
                                  <div className="text-xs text-slate-500">
                                    {leg.gameTime}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-white">
                                  {leg.betType === 'open' ? 'TBD' : leg.odds != null ? `${leg.odds > 0 ? '+' : ''}${leg.odds}` : ''}
                                </div>
                                <div className="text-xs text-slate-400 capitalize">
                                  {leg.betType || leg.type || ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {bet.notes && (
                    <div className="p-4 border-t border-slate-700 bg-slate-800/30">
                      <div className="text-sm text-slate-300">
                        <strong className="text-slate-400">Notes:</strong> {bet.notes}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/30">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400">
              ðŸ’¡ Tip: Use "Fill Slots" to complete open parlay legs for hedging opportunities
            </div>
            <button
              onClick={onClose}
              className="bg-slate-600 hover:bg-slate-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}