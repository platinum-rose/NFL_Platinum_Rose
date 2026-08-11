import React, { useState, useEffect, useCallback } from 'react';
import logger from '../../lib/logger';
import { X, Plus, Save, Trash2, AlertTriangle, Edit } from 'lucide-react';
import { getBankrollData, saveBankrollData, BET_TYPES } from '../../lib/bankroll';

export default function EditBetModal({ 
  isOpen, 
  onClose, 
  bet,
  schedule = [],
  onBetUpdated = () => {} 
}) {
  const [editedBet, setEditedBet] = useState(null);
  const [newLeg, setNewLeg] = useState({
    team: '',
    betType: 'spread',
    line: '',
    odds: -110,
    game: '',
    gameTime: ''
  });
  const [editingLegIndex, setEditingLegIndex] = useState(null); // For editing existing legs

  const getGameOptions = useCallback(() => {
    return schedule.map(game => ({
      id: game.id || `${game.visitor}-${game.home}`,
      label: `${game.visitorName || game.visitor} @ ${game.homeName || game.home}`,
      teams: [game.visitor, game.home],
      teamNames: [game.visitorName || game.visitor, game.homeName || game.home]
    }));
  }, [schedule]);

  useEffect(() => {
    logger.log('ðŸˆ EditBetModal - Schedule data:', schedule);
    if (schedule && schedule.length > 0) {
      logger.log('ðŸˆ EditBetModal - Available games:', getGameOptions());
    }
    
    if (bet && isOpen) {
      setEditedBet({
        ...bet,
        legs: [...bet.legs] // Deep copy of legs
      });
    }
  }, [bet, isOpen, schedule, getGameOptions]);

  const handleAddLeg = () => {
    if (!isNewLegValid()) {
      const missingFields = [];
      if (!newLeg.team) missingFields.push('team');
      if (!newLeg.game) missingFields.push('game');
      if (newLeg.betType !== 'moneyline' && (!newLeg.line || newLeg.line.trim() === '')) {
        missingFields.push('line');
      }
      
      alert(`Please fill in the following fields: ${missingFields.join(', ')}`);
      return;
    }

    const updatedLegs = editedBet.legs.map(leg => 
      leg.betType === 'open' ? { ...newLeg } : leg
    );

    const updatedBet = {
      ...editedBet,
      legs: updatedLegs,
      openSlots: Math.max(0, editedBet.openSlots - 1),
      isHedgingBet: updatedLegs.some(leg => leg.betType === 'open'),
      updatedAt: new Date().toISOString()
    };

    // Auto-save the updated bet immediately
    const data = getBankrollData();
    const betIndex = data.bets.findIndex(b => b.id === editedBet.id);
    
    if (betIndex !== -1) {
      data.bets[betIndex] = updatedBet;
      saveBankrollData(data);
      
      setEditedBet(updatedBet);
      onBetUpdated(updatedBet);
      
      alert('Open slot filled successfully!');
    } else {
      alert('Failed to update bet');
      return;
    }

    // Reset new leg form
    setNewLeg({
      team: '',
      betType: 'spread',
      line: '',
      odds: -110,
      game: '',
      gameTime: ''
    });
  };

  const handleRemoveLeg = (index) => {
    if (editedBet.legs.length <= 1) {
      alert('Cannot remove the last leg of a parlay');
      return;
    }

    const updatedLegs = editedBet.legs.filter((_, i) => i !== index);
    setEditedBet(prev => ({
      ...prev,
      legs: updatedLegs
    }));
  };

  const handleStartEditingLeg = (index) => {
    const leg = editedBet.legs[index];
    if (leg.betType !== 'open') {
      setNewLeg({
        team: leg.team,
        betType: leg.betType,
        line: leg.line || '',
        odds: leg.odds || -110,
        game: leg.game || '',
        gameTime: leg.gameTime || ''
      });
      setEditingLegIndex(index);
    }
  };

  const handleUpdateExistingLeg = () => {
    if (editingLegIndex === null || !isNewLegValid()) return;

    const updatedLegs = [...editedBet.legs];
    updatedLegs[editingLegIndex] = { ...newLeg };

    const updatedBet = {
      ...editedBet,
      legs: updatedLegs,
      updatedAt: new Date().toISOString()
    };

    // Auto-save the updated bet immediately
    const data = getBankrollData();
    const betIndex = data.bets.findIndex(b => b.id === editedBet.id);
    
    if (betIndex !== -1) {
      data.bets[betIndex] = updatedBet;
      saveBankrollData(data);
      
      setEditedBet(updatedBet);
      onBetUpdated(updatedBet);
      
      alert('Leg updated successfully!');
    }

    // Reset editing state
    setEditingLegIndex(null);
    setNewLeg({
      team: '',
      betType: 'spread',
      line: '',
      odds: -110,
      game: '',
      gameTime: ''
    });
  };

  const handleSave = () => {
    if (!editedBet) return;

    // Update bet in storage
    const data = getBankrollData();
    const betIndex = data.bets.findIndex(b => b.id === editedBet.id);
    
    if (betIndex !== -1) {
      data.bets[betIndex] = editedBet;
      saveBankrollData(data);
      
      onBetUpdated(editedBet);
      onClose();
      alert('Bet updated successfully!');
    } else {
      alert('Failed to update bet');
    }
  };

  const isNewLegValid = () => {
    if (!newLeg.team || !newLeg.game) return false;
    
    // For moneyline bets, line is not required
    if (newLeg.betType === 'moneyline') {
      return true;
    }
    
    // For spread and total bets, line is required
    return newLeg.line && newLeg.line.trim() !== '';
  };

  const selectedGameData = getGameOptions().find(g => g.id === newLeg.game);

  if (!isOpen || !bet) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Parlay</h2>
              <p className="text-slate-400 text-sm">
                {bet.description || 'Imported Parlay'} â€¢ {editedBet?.openSlots || 0} open slots
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Bet Overview */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-medium text-white mb-3">Bet Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Risk Amount:</span>
                <span className="text-white ml-2 font-medium">${bet.amount?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400">Potential Win:</span>
                <span className="text-emerald-400 ml-2 font-medium">${bet.potentialWin?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400">Ticket Number:</span>
                <span className="text-white ml-2 font-mono">{bet.ticketNumber}</span>
              </div>
              <div>
                <span className="text-slate-400">Source:</span>
                <span className="text-blue-400 ml-2">{bet.source}</span>
              </div>
            </div>
          </div>

          {/* Current Legs */}
          <div>
            <h3 className="font-medium text-white mb-3">Parlay Legs</h3>
            <div className="space-y-3">
              {editedBet?.legs.map((leg, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded border ${
                    leg.betType === 'open' 
                      ? 'border-orange-500/30 bg-orange-900/10' 
                      : 'border-slate-600 bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">Leg {index + 1}:</span>
                        {leg.betType === 'open' ? (
                          <span className="text-orange-400 font-medium flex items-center gap-1">
                            <Plus size={12} />
                            OPEN SLOT - Ready to Fill
                          </span>
                        ) : (
                          <span className="text-white font-medium">
                            {leg.team} {leg.line} ({leg.odds})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {leg.game}
                      </div>
                    </div>
                    {leg.betType !== 'open' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEditingLeg(index)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Edit this leg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveLeg(index)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Remove this leg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Leg (if open slots exist) OR Edit Existing Leg */}
          {(editedBet?.openSlots > 0 || editingLegIndex !== null) && (
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white flex items-center gap-2">
                  {editingLegIndex !== null ? (
                    <>
                      <Edit size={16} className="text-blue-400" />
                      Edit Leg {editingLegIndex + 1}
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="text-orange-400" />
                      Fill Open Slot
                    </>
                  )}
                </h3>
                {editingLegIndex !== null && (
                  <button
                    onClick={() => {
                      setEditingLegIndex(null);
                      setNewLeg({
                        team: '',
                        betType: 'spread',
                        line: '',
                        odds: -110,
                        game: '',
                        gameTime: ''
                      });
                    }}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Game Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Game</label>
                    <select
                      value={newLeg.game}
                      onChange={(e) => setNewLeg(prev => ({ ...prev, game: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select Game</option>
                      {getGameOptions().map(game => (
                        <option key={game.id} value={game.id}>{game.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Team</label>
                    <select
                      value={newLeg.team}
                      onChange={(e) => setNewLeg(prev => ({ ...prev, team: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      disabled={!selectedGameData}
                    >
                      <option value="">Select Team</option>
                      {selectedGameData?.teams.map((team, index) => (
                        <option key={team} value={team}>
                          {selectedGameData.teamNames[index] || team}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bet Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Bet Type</label>
                    <select
                      value={newLeg.betType}
                      onChange={(e) => setNewLeg(prev => ({ ...prev, betType: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="spread">Spread</option>
                      <option value="total">Total</option>
                      <option value="moneyline">Moneyline</option>
                      <option value="prop">Prop</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Line {newLeg.betType === 'moneyline' ? '(Optional)' : ''}
                    </label>
                    <input
                      type="text"
                      value={newLeg.line}
                      onChange={(e) => setNewLeg(prev => ({ ...prev, line: e.target.value }))}
                      placeholder={
                        newLeg.betType === 'moneyline' ? 'Not applicable for moneyline' :
                        newLeg.betType === 'spread' ? 'e.g., -3.5, +7' :
                        newLeg.betType === 'total' ? 'e.g., o47.5, u42' :
                        'e.g., -3.5, o47.5'
                      }
                      disabled={newLeg.betType === 'moneyline'}
                      className={`w-full border border-slate-600 rounded-lg px-3 py-2 text-white ${
                        newLeg.betType === 'moneyline' 
                          ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Odds</label>
                    <input
                      type="number"
                      value={newLeg.odds || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericValue = value === '' ? '' : parseInt(value) || 0;
                        setNewLeg(prev => ({ ...prev, odds: numericValue }));
                      }}
                      placeholder="e.g., -110, +205"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={editingLegIndex !== null ? handleUpdateExistingLeg : handleAddLeg}
                  disabled={!isNewLegValid()}
                  className={`w-full font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:text-slate-400 text-white ${
                    editingLegIndex !== null 
                      ? 'bg-blue-600 hover:bg-blue-500' 
                      : 'bg-orange-600 hover:bg-orange-500'
                  }`}
                >
                  {editingLegIndex !== null ? (
                    <>
                      <Edit size={16} />
                      Update Leg
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Fill Open Slot
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Warning for Open Slots */}
          {editedBet?.openSlots > 1 && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-amber-300 font-medium">Multiple Open Slots</h4>
                  <p className="text-amber-200 text-sm mt-1">
                    This parlay still has {editedBet.openSlots} open slot{editedBet.openSlots !== 1 ? 's' : ''}. 
                    You can fill them one at a time for hedging strategies.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}