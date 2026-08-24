// src/components/supercontest/SuperContestView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SuperContest — dedicated, persistent view.
//
// Promoted out of the old flat header "Tools" row per Andy's 2026-08-24
// per-feature placement decision: SuperContest is visited deeply a few times
// a week with his betting partner and needs its own standalone surface, not
// a generic modal buried among Teasers/Splits/Kalshi-Poly/Sizing.
//
// Phase 2 (2026-08-24) -- drift table + first-draft confidence model. This
// was blocked on two open decisions (how a line's "lock" is captured/timed,
// and what feeds the confidence model). Andy asked to see the entire
// redesign built end-to-end rather than stopping at more placeholders, so
// this ships a real, working first draft using explicit, defensible defaults
// instead of guessing at something more elaborate:
//
//   LOCK MOMENT: the timestamp of the most recent "Save Updates" click that
//   actually changed that game's line. Re-saving without editing a line does
//   NOT reset its lock time (see handleSave below) -- lock is meant to mean
//   "when I committed to this number," not "when I last opened this screen."
//   This is stored alongside the line value in contestLines (App.jsx /
//   useSchedule.js): { value, lockedAt } instead of a bare number. Old
//   bare-number entries from before this change are still read correctly
//   (App.jsx normalizes both shapes).
//
//   CONFIDENCE MODEL: there is no "which side did I take" concept anywhere
//   in this data model -- SuperContest only ever stored a single spread
//   NUMBER per game, not a home/visitor selection. A real win-probability
//   confidence score would need that and doesn't exist yet (a bigger,
//   separate decision). What's real and available today: how far the
//   market has moved off your locked number, and how lopsided public/expert
//   consensus is on this game. Combined into a "Line Stability Score" --
//   NOT a win-probability, just a real signal for "is my locked number
//   still well-positioned or has the market moved past it." See
//   calculateStability() below for the exact (simple, transparent) formula.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Trophy, X, Activity, Save, TrendingUp, Percent, Info } from 'lucide-react';

/** Real-data "Line Stability Score" -- see file header for what this is and isn't. */
function calculateStability(game, lockedValue) {
  const currentSpread = typeof game.spread === 'number' ? game.spread : lockedValue;
  const driftPts = Math.round((currentSpread - lockedValue) * 10) / 10;

  // Market conviction (0 = coinflip, 50 = fully lopsided) from whichever
  // real split source is available -- same priority MatchupCard.jsx uses:
  // real public tickets first, expert pick tally as a fallback.
  const atsSplits = game.splits?.ats || {};
  let convictionPct = null; // 0-50
  if (atsSplits.visitorTicket != null || atsSplits.homeTicket != null) {
    const v = parseFloat(atsSplits.visitorTicket) || 0;
    const h = parseFloat(atsSplits.homeTicket) || 0;
    convictionPct = Math.abs(Math.max(v, h) - 50);
  } else {
    const spreadPicks = game.consensus?.expertPicks?.spread || [];
    if (spreadPicks.length > 0) {
      const homePicks = spreadPicks.filter(p => p.pick?.includes(game.home)).length;
      convictionPct = Math.abs(Math.round((homePicks / spreadPicks.length) * 100) - 50);
    }
  }

  const stabilityFromDrift = Math.max(0, 100 - Math.abs(driftPts) * 15);
  const stabilityFromConviction = convictionPct == null ? 50 : convictionPct * 2; // 0-100
  const score = Math.round(stabilityFromDrift * 0.6 + stabilityFromConviction * 0.4);

  const tier = score >= 70
    ? { label: 'Stable', className: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30' }
    : score >= 40
    ? { label: 'Watch', className: 'text-amber-400 bg-amber-900/30 border-amber-500/30' }
    : { label: 'Volatile', className: 'text-rose-400 bg-rose-900/30 border-rose-500/30' };

  return { driftPts, score, tier, hasConviction: convictionPct != null };
}

function timeAgo(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function SuperContestView({ isOpen, onClose, games, onUpdateContestLines }) {
  const [lines, setLines] = useState({});

  // Initialize with existing contest lines. Resets local draft state each
  // time the view opens or the games prop changes -- a real sync effect,
  // not derivable state. (Carried over unchanged from ContestLinesModal.)
  useEffect(() => {
    if (isOpen) {
      const init = {};
      games.forEach(g => init[g.id] = g.contestSpread ?? '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLines(init);
    }
  }, [isOpen, games]);

  if (!isOpen) return null;

  const handleSyncLive = () => {
    if (window.confirm('Overwrite all SuperContest lines with current live spreads?')) {
      const newLines = {};
      games.forEach(g => newLines[g.id] = g.spread);
      setLines(newLines);
    }
  };

  // Lock timestamps only advance for lines that actually changed value --
  // re-saving an untouched line keeps its original lock time.
  const handleSave = () => {
    const now = new Date().toISOString();
    const locked = {};
    games.forEach(g => {
      const val = lines[g.id];
      if (val === '' || val === undefined || Number.isNaN(val)) return;
      const unchanged = g.contestSpread != null && Number(val) === Number(g.contestSpread);
      locked[g.id] = { value: Number(val), lockedAt: unchanged && g.contestLineLockedAt ? g.contestLineLockedAt : now };
    });
    onUpdateContestLines(locked);
    onClose();
  };

  const lockedGames = games.filter(g => g.contestSpread != null);

  return (
    <div className="fixed inset-0 bg-[#0a0d14] z-[80] flex flex-col animate-in fade-in duration-200">

      {/* VIEW HEADER -- styled as its own dedicated screen, not a small modal */}
      <div className="border-b border-slate-800 bg-slate-950 shadow-lg">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/30">
              <Trophy size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-base tracking-tight leading-none">SuperContest</h2>
              <p className="text-[11px] text-slate-500 mt-1">Spread-only, entry-locked lines &mdash; no totals or moneylines, ever.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">

          {/* TOOLBAR */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 justify-center">
            <button onClick={handleSyncLive} className="px-4 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 flex items-center gap-2 transition-all">
              <Activity size={14} />
              Sync Live Odds
            </button>
            <span className="text-[11px] text-slate-500">Official contest lines aren't available via API &mdash; enter manually below or sync live spreads.</span>
          </div>

          {/* LINES GRID */}
          <div className="grid gap-3">
            {games.map(g => (
              <div key={g.id} className="flex justify-between items-center bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                <div className="w-1/3 font-bold text-slate-300 text-sm">{g.visitor}</div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Line</span>
                  <input
                    type="number"
                    step="0.5"
                    className="w-20 bg-slate-950 border border-slate-700 rounded py-1.5 text-center text-white font-mono font-bold focus:border-orange-500 outline-none transition-all"
                    value={lines[g.id] !== undefined ? lines[g.id] : ''}
                    onChange={e => setLines({ ...lines, [g.id]: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="w-1/3 text-right font-bold text-slate-300 text-sm">{g.home}</div>
              </div>
            ))}
            {games.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8">No games on the current slate.</div>
            )}
          </div>

          {/* DRIFT + STABILITY -- Phase 2 (2026-08-24), real first draft */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-300">
                <TrendingUp size={16} />
                <Percent size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Drift &amp; Line Stability</span>
              </div>
              <div className="group relative">
                <Info size={13} className="text-slate-600 cursor-help" />
                <div className="hidden group-hover:block absolute right-0 top-5 w-72 bg-slate-950 border border-slate-700 rounded-lg p-3 text-[11px] text-slate-400 leading-relaxed z-10 shadow-xl">
                  First draft. This is NOT a win-probability -- SuperContest only stores a
                  spread number here, not which side you took, so a real confidence-in-your-pick
                  score isn't possible yet. "Stability" instead measures two real things:
                  how far the market has drifted off your locked number, and how lopsided
                  public/expert consensus is on the game. A low score means the market has
                  moved a lot since you locked, or the game is a near-coinflip -- worth a
                  second look, not necessarily bad.
                </div>
              </div>
            </div>

            {lockedGames.length === 0 ? (
              <p className="text-[12px] text-slate-500">
                No locked lines yet. Enter or sync lines above and hit Save Updates to start tracking drift.
              </p>
            ) : (
              <div className="space-y-2">
                {lockedGames.map(g => {
                  const { driftPts, score, tier, hasConviction } = calculateStability(g, g.contestSpread);
                  const ago = timeAgo(g.contestLineLockedAt);
                  return (
                    <div key={g.id} className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2 text-xs">
                      <div className="w-1/4 min-w-0 truncate font-bold text-slate-300">{g.visitor} @ {g.home}</div>
                      <div className="w-1/6 text-center">
                        <div className="text-slate-500 text-[9px] uppercase">Locked</div>
                        <div className="font-mono text-white font-bold">{g.contestSpread > 0 ? `+${g.contestSpread}` : g.contestSpread}</div>
                      </div>
                      <div className="w-1/6 text-center">
                        <div className="text-slate-500 text-[9px] uppercase">Current</div>
                        <div className="font-mono text-white font-bold">{g.spread > 0 ? `+${g.spread}` : g.spread}</div>
                      </div>
                      <div className="w-1/6 text-center">
                        <div className="text-slate-500 text-[9px] uppercase">Drift</div>
                        <div className={`font-mono font-bold ${driftPts === 0 ? 'text-slate-400' : driftPts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {driftPts > 0 ? `+${driftPts}` : driftPts}
                        </div>
                      </div>
                      <div className="flex-1 text-right flex items-center justify-end gap-2">
                        {ago && <span className="text-slate-600 text-[10px]">locked {ago}</span>}
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${tier.className}`}>
                          {tier.label} ({score}{hasConviction ? '' : '*'})
                        </span>
                      </div>
                    </div>
                  );
                })}
                {lockedGames.some(g => !calculateStability(g, g.contestSpread).hasConviction) && (
                  <p className="text-[10px] text-slate-600 pt-1">* no public/expert split data available yet for this game -- score is drift-only.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-5xl mx-auto px-5 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Close</button>
          <button onClick={handleSave} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all">
            <Save size={16} /> Save Updates
          </button>
        </div>
      </div>
    </div>
  );
}
