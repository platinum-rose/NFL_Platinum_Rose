import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { gradeGame } from '../../lib/picksDatabase';

/**
 * ManualGradeModal
 *
 * User enters the final score for a game, then all PENDING picks
 * for that gameId are graded automatically via gradeGame().
 */
export default function ManualGradeModal({ isOpen, onClose, gameData, onGraded }) {
  const [homeScore, setHomeScore] = useState('');
  const [visitorScore, setVisitorScore] = useState('');
  const [gradedCount, setGradedCount] = useState(null);

  if (!isOpen || !gameData) return null;

  const handleGrade = () => {
    const h = parseInt(homeScore, 10);
    const v = parseInt(visitorScore, 10);

    if (isNaN(h) || isNaN(v) || h < 0 || v < 0) {
      alert('Please enter valid scores (non-negative integers).');
      return;
    }

    const count = gradeGame(gameData.gameId, h, v);
    setGradedCount(count);

    if (onGraded) onGraded(count);
  };

  const handleClose = () => {
    setHomeScore('');
    setVisitorScore('');
    setGradedCount(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600/20 p-2 rounded-lg">
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Grade Game</h2>
              <p className="text-xs text-slate-500">{gameData.visitor} @ {gameData.home}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {gradedCount === null ? (
            <div className="space-y-4">
              {/* Stale warning */}
              {gameData.isStale && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>This game date has passed. The picks should be graded.</span>
                </div>
              )}

              <p className="text-sm text-slate-400">
                Enter the final score. All <strong className="text-white">{gameData.picks?.length || 0}</strong> pending
                pick{(gameData.picks?.length || 0) !== 1 ? 's' : ''} for this game will be graded automatically.
              </p>

              {/* Picks preview */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 space-y-1">
                {(gameData.picks || []).map(p => (
                  <div key={p.id} className="text-xs text-slate-400 flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      p.source === 'AI_LAB'
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    }`}>
                      {p.source === 'AI_LAB' ? 'AI' : p.source === 'EXPERT' ? 'EX' : p.source}
                    </span>
                    <span className="text-white font-bold">
                      {p.pickType === 'spread' || p.pickType === 'teaser'
                        ? `${p.selection} ${p.line > 0 ? '+' : ''}${p.line}${p.pickType === 'teaser' ? ' (teaser leg)' : ''}`
                        : `${p.selection} ${p.line}`
                      }
                    </span>
                  </div>
                ))}
              </div>

              {/* Score inputs */}
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 mb-1 block">{gameData.visitor}</label>
                  <input
                    type="number"
                    min="0"
                    value={visitorScore}
                    onChange={e => setVisitorScore(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-lg text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="text-slate-600 font-bold text-lg pb-2">@</div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 mb-1 block">{gameData.home}</label>
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={e => setHomeScore(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-lg text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="bg-emerald-500/20 p-3 rounded-full inline-flex mb-3">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {gradedCount} Pick{gradedCount !== 1 ? 's' : ''} Graded
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {gameData.visitor} {visitorScore} — {gameData.home} {homeScore}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Check the <strong>Overview</strong> tab for updated standings.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 p-5 border-t border-slate-800">
          {gradedCount === null ? (
            <>
              <button onClick={handleClose} className="text-sm text-slate-500 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleGrade}
                disabled={!homeScore || !visitorScore}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all"
              >
                Grade All
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
