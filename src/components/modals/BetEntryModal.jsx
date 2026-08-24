import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, DollarSign, Target, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { addBet, updateBetResult, getBankrollData, calculateAnalytics, BET_TYPES, BET_STATUS, getRecommendedUnit } from '../../lib/bankroll';
import { getGameOptions } from '../../lib/betEntryGameOptions';

export default function BetEntryModal({ 
  isOpen, 
  onClose, 
  selectedGame = null,
  schedule = [],
  refreshBankroll = () => {}
}) {
  const [mode, setMode] = useState('entry'); // 'entry' | 'grading'
  const [bankrollData, setBankrollData] = useState(null);
  // Derived from calculateAnalytics(), not read off bankrollData directly --
  // getBankrollData() returns { settings, bets, weeklyStats }; there is no
  // top-level bankrollData.currentBankroll / bankrollData.unitSize (that was
  // the root cause of the $NaN Kelly-sizing bug -- see loadBankrollData below).
  const [currentBankroll, setCurrentBankroll] = useState(0);

  // Entry form state
  const [betData, setBetData] = useState({
    game: '',
    team: '',
    type: 'spread',
    line: '',
    odds: -110,
    confidence: 60,
    winProbability: 55,
    unitSize: 1,
    customUnit: '',
    notes: ''
  });

  // Grading state
  const [pendingBets, setPendingBets] = useState([]);
  // FLAGGED (lint cleanup, 2026-08-10, not fixed — needs Andy's call):
  // selectedBet/gradingResult are written (reset to null/'' below) but never
  // read/rendered anywhere in this component -- looks like a grading UI
  // that was either moved elsewhere or never finished. Left in place rather
  // than deleting real state during a lint-only pass.
  // eslint-disable-next-line no-unused-vars
  const [selectedBet, setSelectedBet] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [gradingResult, setGradingResult] = useState('');

  const loadBankrollData = () => {
    const data = getBankrollData();
    setBankrollData(data);

    // currentBankroll (starting bankroll + all-time profit) is a computed
    // value, not a stored field -- calculateAnalytics() is the same helper
    // BankrollDashboard.jsx uses for this.
    const analytics = calculateAnalytics('all');
    setCurrentBankroll(analytics?.currentBankroll ?? data.settings.totalBankroll ?? 0);

    // Load pending bets for grading
    const pending = data.bets.filter(bet => bet.status === BET_STATUS.PENDING);
    setPendingBets(pending);
  };

  // Resets bankroll data / pre-populates the game field each time the modal
  // opens -- a real sync effect (reacts to isOpen/selectedGame props), not
  // derivable state.
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadBankrollData();

      // If selectedGame is provided, pre-populate game selection
      if (selectedGame) {
        setBetData(prev => ({
          ...prev,
          game: selectedGame.id || `${selectedGame.visitor || selectedGame.away_team}-${selectedGame.home || selectedGame.home_team}`
        }));
      }
    }
  }, [isOpen, selectedGame]);

  // Auto-calculate unit size when confidence or probability changes.
  // unitSize lives inside betData alongside customUnit (a user-editable
  // override), so this can't be cleanly pulled out into a useMemo without
  // restructuring the form's state shape -- left as a real sync effect.
  useEffect(() => {
    if (betData.confidence > 0 && betData.winProbability > 0 && bankrollData) {
      const recommended = getRecommendedUnit(
        betData.confidence,
        currentBankroll,
        'moderate' // Default risk profile
      );

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBetData(prev => ({ ...prev, unitSize: recommended.units }));
    }
  }, [betData.confidence, betData.winProbability, betData.odds, bankrollData, currentBankroll]);

  const handleInputChange = (field, value) => {
    setBetData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitBet = () => {
    if (!betData.game || !betData.team || !betData.line || !bankrollData) {
      alert('Please fill in all required fields');
      return;
    }

    const unitAmount = betData.customUnit ? parseFloat(betData.customUnit) : betData.unitSize;
    const betAmount = unitAmount * (bankrollData.settings?.unitSize ?? 0);

    const newBet = {
      game: betData.game,
      team: betData.team,
      type: betData.type,
      line: betData.line,
      odds: betData.odds,
      amount: betAmount,
      units: unitAmount,
      confidence: betData.confidence,
      winProbability: betData.winProbability,
      notes: betData.notes,
      date: new Date().toISOString()
    };

    addBet(newBet);
    
    // Reset form
    setBetData({
      game: selectedGame ? (selectedGame.id || `${selectedGame.visitor || selectedGame.away_team}-${selectedGame.home || selectedGame.home_team}`) : '',
      team: '',
      type: 'spread',
      line: '',
      odds: -110,
      confidence: 60,
      winProbability: 55,
      unitSize: 1,
      customUnit: '',
      notes: ''
    });

    refreshBankroll();
    alert('Bet added successfully!');
  };

  const handleGradeBet = (betId, result) => {
    updateBetResult(betId, result);
    loadBankrollData(); // Refresh data
    setSelectedBet(null);
    setGradingResult('');
    refreshBankroll();
    alert(`Bet graded as ${result}!`);
  };

  const selectedGameData = getGameOptions(schedule).find(g => g.id === betData.game);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <DollarSign size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Bet Management</h2>
              <p className="text-slate-400 text-sm">Add new bets and grade pending results</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setMode('entry')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                mode === 'entry'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus size={16} className="inline mr-2" />
              Add Bet
            </button>
            <button
              onClick={() => setMode('grading')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                mode === 'grading'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle size={16} className="inline mr-2" />
              Grade Bets ({pendingBets.length})
            </button>
          </div>
        </div>

        {mode === 'entry' ? (
          <div className="p-6 space-y-6">
            {/* Game Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Game *</label>
                <select
                  value={betData.game}
                  onChange={(e) => handleInputChange('game', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select Game</option>
                  {getGameOptions(schedule).map(game => (
                    <option key={game.id} value={game.id}>{game.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Team *</label>
                <select
                  value={betData.team}
                  onChange={(e) => handleInputChange('team', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  disabled={!selectedGameData}
                >
                  <option value="">Select Team</option>
                  {selectedGameData?.teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bet Type and Line */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Bet Type</label>
                <select
                  value={betData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  {Object.values(BET_TYPES).map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Line *</label>
                <input
                  type="text"
                  value={betData.line}
                  onChange={(e) => handleInputChange('line', e.target.value)}
                  placeholder="e.g., -3.5, o47.5"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Odds</label>
                <input
                  type="number"
                  value={betData.odds}
                  onChange={(e) => handleInputChange('odds', parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Confidence and Probability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Confidence: {betData.confidence}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={betData.confidence}
                  onChange={(e) => handleInputChange('confidence', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Win Probability: {betData.winProbability}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="80"
                  value={betData.winProbability}
                  onChange={(e) => handleInputChange('winProbability', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>50%</span>
                  <span>80%</span>
                </div>
              </div>
            </div>

            {/* Unit Sizing */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={16} className="text-emerald-400" />
                <span className="font-medium text-white">Unit Sizing</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Recommended: {betData.unitSize} units
                  </label>
                  <div className="text-xs text-slate-400">
                    Based on Kelly Criterion and confidence level
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Custom Units</label>
                  <input
                    type="number"
                    step="0.1"
                    value={betData.customUnit}
                    onChange={(e) => handleInputChange('customUnit', e.target.value)}
                    placeholder="Override recommendation"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {bankrollData && (
                <div className="mt-3 p-3 bg-slate-700 rounded-lg">
                  <div className="text-sm text-slate-300">
                    Bet Amount: <span className="text-emerald-400 font-medium">
                      ${((betData.customUnit ? parseFloat(betData.customUnit) : betData.unitSize) * (bankrollData.settings?.unitSize ?? 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Notes</label>
              <textarea
                value={betData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any notes about this bet..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white h-20"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitBet}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Add Bet
            </button>
          </div>
        ) : (
          <div className="p-6">
            {pendingBets.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={48} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Pending Bets</h3>
                <p className="text-slate-400">All your bets have been graded!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBets.map((bet) => (
                  <div key={bet.id} className="bg-slate-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-white">{bet.game}</h4>
                        <p className="text-slate-400 text-sm">
                          {bet.team} {bet.line} ({bet.type})
                        </p>
                        <p className="text-slate-500 text-xs">
                          {bet.units} units • ${bet.amount.toFixed(2)} • {new Date(bet.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGradeBet(bet.id, BET_STATUS.WON)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm"
                        >
                          <CheckCircle size={14} />
                          Win
                        </button>
                        <button
                          onClick={() => handleGradeBet(bet.id, BET_STATUS.LOST)}
                          className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                        >
                          <XCircle size={14} />
                          Loss
                        </button>
                        <button
                          onClick={() => handleGradeBet(bet.id, BET_STATUS.PUSH)}
                          className="flex items-center gap-1 bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded-lg text-sm"
                        >
                          <AlertCircle size={14} />
                          Push
                        </button>
                      </div>
                    </div>
                    {bet.notes && (
                      <div className="text-sm text-slate-400 bg-slate-700 rounded p-2">
                        <strong>Notes:</strong> {bet.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}