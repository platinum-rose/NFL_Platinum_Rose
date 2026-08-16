// src/components/modals/ProfileSettingsModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// User Profile & Preferences Customizer Modal
// Allows users (e.g. Amanda, Andy) to customize their visible Command Hubs,
// default agent modes, and layout simplicity, with instant toggle to activate all.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { X, User, Check, Sparkles, Shield, Trophy, Shirt, LayoutDashboard, Briefcase, HeartPulse, Bot } from 'lucide-react';
import { loadFromStorage, saveToStorage } from '../../lib/storage';

const PROFILE_KEY = 'nfl_user_profile_v1';

export const PRESET_PROFILES = [
  {
    id: 'master',
    name: 'Master View (Full Dashboard)',
    description: 'All 6 Command Hubs and all 7 specialized AI Agents active.',
    hubs: ['dashboard', 'official-picks', 'intel', 'fantasy', 'injuries', 'futures'],
    agents: ['general', 'futures', 'props', 'fantasy', 'survivor', 'supercontest', 'confidence']
  },
  {
    id: 'amanda',
    name: 'Amanda’s Focus Profile',
    description: 'Simplified view focused on SuperContest, Survivor Pool, and Fantasy Rosters.',
    hubs: ['official-picks', 'fantasy', 'injuries'],
    agents: ['supercontest', 'survivor', 'fantasy']
  },
  {
    id: 'andy',
    name: 'Andy’s Analytics Profile',
    description: 'Focused on Futures Portfolio, Matchup Odds, Sides & Totals, and Player Props.',
    hubs: ['dashboard', 'official-picks', 'intel', 'futures'],
    agents: ['general', 'futures', 'props']
  }
];

export default function ProfileSettingsModal({ isOpen, onClose, onProfileUpdated }) {
  const [selectedProfileId, setSelectedProfileId] = useState('master');
  const [activeProfile, setActiveProfile] = useState(() => {
    return loadFromStorage(PROFILE_KEY, PRESET_PROFILES[0]);
  });

  useEffect(() => {
    if (activeProfile?.id) {
      setSelectedProfileId(activeProfile.id);
    }
  }, [activeProfile]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setSelectedProfileId(preset.id);
    setActiveProfile(preset);
    saveToStorage(PROFILE_KEY, preset);
    if (onProfileUpdated) onProfileUpdated(preset);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121824] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-slate-800 bg-[#0a0d14] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">User Profile & Layout Settings</h3>
              <p className="text-[11px] text-slate-400">Customize visible Command Hubs and active agent modes.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* PRESET PROFILES */}
        <div className="p-5 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Preset Profile</div>

          <div className="space-y-3">
            {PRESET_PROFILES.map((preset) => {
              const isSelected = selectedProfileId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                    isSelected
                      ? 'bg-purple-900/20 border-purple-500/60 shadow-lg shadow-purple-900/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{preset.name}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{preset.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {preset.hubs.map((hub) => (
                        <span key={hub} className="px-2 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {hub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 ${
                    isSelected ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-700 bg-slate-800'
                  }`}>
                    {isSelected && <Check size={12} />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>You can toggle between profiles anytime in the top header.</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
