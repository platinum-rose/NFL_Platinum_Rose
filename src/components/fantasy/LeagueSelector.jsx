// src/components/fantasy/LeagueSelector.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Multi-League Selector Bar for Fantasy & Props Command Hub
// Allows instant switching between "The League", "Honey Badgers", "Rose Bowl", and "RFI Invitational"
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Trophy, Shield, Award, Users, CheckCircle2, Info } from 'lucide-react';
import { FANTASY_LEAGUES } from '../../lib/fantasyLeagues';

export default function LeagueSelector({ activeLeagueId, onSelectLeague }) {
  const activeProfile = FANTASY_LEAGUES.find(l => l.id === activeLeagueId) || FANTASY_LEAGUES[0];

  return (
    <div className="bg-[#121824] border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
            {activeProfile.icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{activeProfile.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${
                activeProfile.id === 'the_league' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                activeProfile.id === 'honey_badgers' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                activeProfile.id === 'rose_bowl' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                'bg-purple-500/10 text-purple-400 border-purple-500/30'
              }`}>
                {activeProfile.isKeeperLeague ? `${activeProfile.maxKeepers} Keeper${activeProfile.maxKeepers > 1 ? 's' : ''}` : 'Redraft (Non-Keeper)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{activeProfile.description}</p>
          </div>
        </div>

        {/* LEAGUE TABS */}
        <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1.5 rounded-xl border border-slate-800/90 overflow-x-auto">
          {FANTASY_LEAGUES.map(league => {
            const isActive = league.id === activeLeagueId;
            return (
              <button
                key={league.id}
                onClick={() => onSelectLeague(league.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? league.id === 'the_league' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' :
                      league.id === 'honey_badgers' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' :
                      league.id === 'rose_bowl' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40' :
                      'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{league.icon}</span>
                <span>{league.name}</span>
                {isActive && <CheckCircle2 size={12} className="text-white/90" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
