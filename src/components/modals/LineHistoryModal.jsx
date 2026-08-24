// src/components/modals/LineHistoryModal.jsx
import React from 'react';
import { X, Activity } from 'lucide-react';
import LineHistoryChart from '../odds/LineHistoryChart';

const LineHistoryModal = ({ isOpen, game, onClose }) => {
  if (!isOpen || !game) return null;

  const gameKey = `${game.visitorName || game.visitor} vs ${game.homeName || game.home}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00d2be]" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Line Movement History: <span className="text-[#00d2be]">{game.visitor} @ {game.home}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Line History Chart Container */}
        <div className="flex-1 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
          <LineHistoryChart initialGameKey={gameKey} />
        </div>
      </div>
    </div>
  );
};

export default LineHistoryModal;
