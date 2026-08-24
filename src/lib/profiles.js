// src/lib/profiles.js
// ═══════════════════════════════════════════════════════════════════════════════
// Shared preset-profile definitions + storage key.
//
// Pulled out of ProfileSettingsModal.jsx (Phase 0, 2026-08-24) so App.jsx can
// read the active profile's `hubs` list without eagerly importing the modal
// itself (ProfileSettingsModal is lazy-loaded on first open). Keeping one
// source of truth here means the editor UI and the actual nav-filtering
// logic can never drift out of sync on preset ids/hub lists.
// ═══════════════════════════════════════════════════════════════════════════════

export const PROFILE_KEY = 'nfl_user_profile_v1';

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
