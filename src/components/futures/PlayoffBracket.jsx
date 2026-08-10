// src/components/futures/PlayoffBracket.jsx
// Phase E — Playoff Bracket overlay with futures exposure per team
// Visual bracket showing all 14 playoff seeds (AFC + NFC) and cumulative
// futures exposure (stake, max payout, bet types) from the user's portfolio.
import React, { useState, useMemo, useCallback } from 'react';
import {
  Trophy, Edit3, Save, RotateCcw, DollarSign,
  TrendingUp, ChevronDown, ChevronUp, Info,
  Star, Target, X, Layers
} from 'lucide-react';
import { getPositions, FUTURES_TYPES, FUTURES_TYPE_LABELS } from '../../lib/futures';
import { TEAM_LOGOS, NFL_TEAMS } from '../../lib/teams';
import { loadFromStorage, saveToStorage } from '../../lib/storage';

// ── Constants ─────────────────────────────────────────────────────────────────
const BRACKET_KEY = 'pr_playoff_bracket_v1';

// Default demo bracket — realistic 2026-27 projected seedings.
// These are starting-point defaults users can override in-app via the seed picker.
const DEFAULT_SEEDS = {
  afc: ['Chiefs', 'Bills', 'Ravens', 'Texans', 'Steelers', 'Chargers', 'Broncos'],
  nfc: ['Eagles', 'Lions', 'Vikings', 'Rams', 'Buccaneers', 'Commanders', 'Packers'],
};

// Wild card matchup pairs by seed
//  Seed 1 = bye. Remaining: (2v7), (3v6), (4v5)
const WC_PAIRS = [[1, 6], [2, 5], [3, 4]]; // 0-indexed into seeds array

// Bet type color scheme
const TYPE_COLOR = {
  [FUTURES_TYPES.SUPERBOWL]:  { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40', dot: 'bg-purple-400' },
  [FUTURES_TYPES.CONFERENCE]: { bg: 'bg-blue-500/20',   text: 'text-blue-300',   border: 'border-blue-500/40',   dot: 'bg-blue-400' },
  [FUTURES_TYPES.DIVISION]:   { bg: 'bg-teal-500/20',   text: 'text-teal-300',   border: 'border-teal-500/40',   dot: 'bg-teal-400' },
  [FUTURES_TYPES.PLAYOFFS]:   { bg: 'bg-amber-500/20',  text: 'text-amber-300',  border: 'border-amber-500/40',  dot: 'bg-amber-400' },
  [FUTURES_TYPES.WINS]:       { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40', dot: 'bg-orange-400' },
  [FUTURES_TYPES.SB_MATCHUP]: { bg: 'bg-rose-500/20',   text: 'text-rose-300',   border: 'border-rose-500/40',   dot: 'bg-rose-400' },
  default:                    { bg: 'bg-slate-500/20',  text: 'text-slate-300',  border: 'border-slate-500/40',  dot: 'bg-slate-400' },
};

const TYPE_SHORT = {
  [FUTURES_TYPES.SUPERBOWL]:  'SB',
  [FUTURES_TYPES.CONFERENCE]: 'CONF',
  [FUTURES_TYPES.DIVISION]:   'DIV',
  [FUTURES_TYPES.PLAYOFFS]:   'PO',
  [FUTURES_TYPES.WINS]:       'WIN',
  [FUTURES_TYPES.SB_MATCHUP]: 'SBM',
};

const fmt  = (n) => n?.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? '0';
const fmtK = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : fmt(n);

// ── All 32 NFL teams sorted alphabetically for seed picker ───────────────────
const ALL_TEAMS = Object.keys(NFL_TEAMS).sort();

// ── Logo helper ───────────────────────────────────────────────────────────────
function getLogo(team) {
  return TEAM_LOGOS?.[team] || TEAM_LOGOS?.[team?.split(' ').pop()] || '';
}

// ═════════════════════════════════════════════════════════════════════════════
// Hook: load / save bracket state
// ═════════════════════════════════════════════════════════════════════════════
function useBracket() {
  const saved = loadFromStorage(BRACKET_KEY, null);
  const [seeds, setSeeds] = useState(() => saved || DEFAULT_SEEDS);

  const saveBracket = useCallback((updated) => {
    setSeeds(updated);
    saveToStorage(BRACKET_KEY, updated);
  }, []);

  const resetBracket = useCallback(() => {
    saveBracket(DEFAULT_SEEDS);
  }, [saveBracket]);

  const setSeed = useCallback((conference, index, team) => {
    setSeeds(prev => {
      const updated = { ...prev, [conference]: prev[conference].map((t, i) => i === index ? team : t) };
      saveToStorage(BRACKET_KEY, updated);
      return updated;
    });
  }, []);

  return { seeds, setSeed, resetBracket };
}

// ═════════════════════════════════════════════════════════════════════════════
// Exposure calculator — group positions by team
// ═════════════════════════════════════════════════════════════════════════════
function buildExposureMap(positions) {
  const map = new Map();
  for (const p of positions) {
    if (p.status !== 'OPEN' && p.status !== 'WON') continue; // skip lost/voided
    const key = p.team;
    if (!map.has(key)) map.set(key, { team: key, totalStake: 0, totalPayout: 0, positions: [] });
    const entry = map.get(key);
    entry.totalStake   += p.stake;
    entry.totalPayout  += p.potentialPayout;
    entry.positions.push(p);
  }
  return map;
}

// ═════════════════════════════════════════════════════════════════════════════
// TEAM SLOT — a single seed card with exposure overlay
// ═════════════════════════════════════════════════════════════════════════════
function TeamSlot({ team, seed, conf, exposure, onPick, editMode, isBye = false, compact = false }) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch]         = useState('');
  const logo = getLogo(team);
  const exp  = exposure?.get(team);
  const hasBet = exp && exp.positions.length > 0;

  const seedLabel = `#${seed}${isBye ? ' (BYE)' : ''}`;
  const confColor = conf === 'afc' ? 'text-blue-400' : 'text-red-400';

  const filteredTeams = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_TEAMS.filter(t => !q || t.toLowerCase().includes(q));
  }, [search]);

  function handleSelect(t) {
    onPick(t);
    setShowPicker(false);
    setSearch('');
  }

  return (
    <div className="relative">
      <div
        className={`
          rounded-lg border transition-all w-full
          ${hasBet
            ? 'bg-slate-800/80 border-purple-500/40 shadow-md shadow-purple-900/20'
            : 'bg-slate-900/60 border-slate-800'}
          ${editMode ? 'cursor-pointer hover:border-slate-600' : ''}
          ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}
        `}
        onClick={() => editMode && setShowPicker(v => !v)}
      >
        <div className={`flex items-center gap-${compact ? '1.5' : '2'}`}>
          {/* Seed badge */}
          <span className={`text-[9px] font-black shrink-0 ${confColor} w-6 text-center`}>{seedLabel}</span>

          {/* Logo */}
          {logo ? (
            <img
              src={logo}
              alt=""
              className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} object-contain shrink-0`}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-full bg-slate-700 shrink-0`} />
          )}

          {/* Name */}
          <span className={`text-white font-bold truncate ${compact ? 'text-xs' : 'text-sm'} flex-1 min-w-0`}>
            {team || <span className="text-slate-600 italic">—empty—</span>}
          </span>

          {/* Edit pencil */}
          {editMode && <Edit3 size={11} className="text-slate-600 shrink-0" />}
        </div>

        {/* Exposure badges (non-compact) */}
        {hasBet && !compact && (
          <div className="flex flex-wrap gap-1 mt-1.5 ml-[52px]">
            {exp.positions.map(p => {
              const c = TYPE_COLOR[p.type] || TYPE_COLOR.default;
              return (
                <span
                  key={p.id}
                  className={`inline-flex items-center gap-0.5 text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${c.bg} ${c.text} ${c.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
                  {TYPE_SHORT[p.type]} ${fmtK(p.stake)}→${fmtK(p.potentialPayout)}
                </span>
              );
            })}
          </div>
        )}

        {/* Compact exposure dot */}
        {hasBet && compact && (
          <div className="absolute top-0.5 right-0.5 flex gap-0.5">
            {exp.positions.map(p => {
              const c = TYPE_COLOR[p.type] || TYPE_COLOR.default;
              return <span key={p.id} className={`w-2 h-2 rounded-full ${c.dot}`} title={`${TYPE_SHORT[p.type]} $${fmt(p.stake)}`} />;
            })}
          </div>
        )}
      </div>

      {/* Team picker dropdown */}
      {editMode && showPicker && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-56">
          <div className="p-2 border-b border-slate-800">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search team..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            <button
              onClick={e => { e.stopPropagation(); handleSelect(''); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-800 transition"
            >
              — Clear slot —
            </button>
            {filteredTeams.map(t => (
              <button
                key={t}
                onClick={e => { e.stopPropagation(); handleSelect(t); }}
                className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-slate-800 transition flex items-center gap-2"
              >
                <img src={getLogo(t)} alt="" className="w-4 h-4 object-contain" onError={e => { e.target.style.display='none'; }} />
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MATCHUP PAIR — two team slots with VS divider
// ═════════════════════════════════════════════════════════════════════════════
function MatchupPair({ topIdx, botIdx, conf, seeds, exposure, onPick, editMode }) {
  const topTeam = seeds[conf][topIdx];
  const botTeam = seeds[conf][botIdx];
  const topSeed = topIdx + 1;
  const botSeed = botIdx + 1;
  return (
    <div className="flex flex-col gap-px">
      <TeamSlot team={topTeam} seed={topSeed} conf={conf} exposure={exposure} onPick={t => onPick(conf, topIdx, t)} editMode={editMode} />
      <div className="text-center text-[8px] font-black text-slate-600 py-0.5">vs</div>
      <TeamSlot team={botTeam} seed={botSeed} conf={conf} exposure={exposure} onPick={t => onPick(conf, botIdx, t)} editMode={editMode} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CONFERENCE HALF — all rounds for one conference
// ═════════════════════════════════════════════════════════════════════════════
function ConferenceHalf({ conf, seeds, exposure, onPick, editMode }) {
  const label    = conf.toUpperCase();
  const confColor = conf === 'afc' ? 'text-blue-400' : 'text-red-400';
  const confBg    = conf === 'afc' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-red-500/5 border-red-500/20';

  return (
    <div className="flex-1 min-w-0">
      <div className={`text-center text-xs font-black ${confColor} mb-3 py-1.5 rounded-lg border ${confBg} tracking-widest`}>
        {label}
      </div>

      {/* Round labels */}
      <div className="grid grid-cols-3 gap-2 mb-2 text-center">
        {['Wild Card', 'Divisional', 'Conf. Champ'].map(r => (
          <div key={r} className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">{r}</div>
        ))}
      </div>

      {/* Bracket columns */}
      <div className="grid grid-cols-3 gap-2 items-start">
        {/* Col 1: Wild Card (3 matchups) + Seed 1 bye */}
        <div className="flex flex-col gap-3">
          {WC_PAIRS.map(([hi, lo]) => (
            <MatchupPair
              key={`${conf}-wc-${hi}-${lo}`}
              topIdx={hi}
              botIdx={lo}
              conf={conf}
              seeds={seeds}
              exposure={exposure}
              onPick={onPick}
              editMode={editMode}
            />
          ))}
          {/* Seed 1 bye row */}
          <div className="flex flex-col gap-px">
            <TeamSlot
              team={seeds[conf][0]}
              seed={1}
              conf={conf}
              exposure={exposure}
              onPick={t => onPick(conf, 0, t)}
              editMode={editMode}
              isBye={true}
            />
          </div>
        </div>

        {/* Col 2: Divisional (2 matchups) */}
        <div className="flex flex-col gap-3 mt-4">
          {/* Top divisional: winner of (2v7) vs winner of (1 bye) */}
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/30 px-2 py-2 text-center">
            <div className="text-[9px] text-slate-600 font-bold mb-1">Top Half</div>
            <div className="text-[10px] text-slate-500">W(2v7) vs #1</div>
          </div>
          {/* Bottom divisional: winner of (3v6) vs winner of (4v5) */}
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/30 px-2 py-2 text-center">
            <div className="text-[9px] text-slate-600 font-bold mb-1">Bottom Half</div>
            <div className="text-[10px] text-slate-500">W(3v6) vs W(4v5)</div>
          </div>
        </div>

        {/* Col 3: Conference Championship */}
        <div className="flex flex-col gap-3 mt-8">
          <div className={`rounded-xl border px-2 py-3 text-center ${confBg}`}>
            <div className={`text-[9px] font-black tracking-wider mb-1 ${confColor}`}>CONF CHAMP</div>
            <div className="text-[10px] text-slate-500">Top vs Bottom</div>
            <div className={`text-[10px] font-bold mt-1 ${confColor}`}>→ Super Bowl</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPOSURE LEGEND + SUMMARY
// ═════════════════════════════════════════════════════════════════════════════
function ExposureSummary({ positions, seeds }) {
  const allSeededTeams = new Set([...seeds.afc, ...seeds.nfc].filter(Boolean));
  const relevant = positions.filter(p =>
    (p.status === 'OPEN' || p.status === 'WON') && allSeededTeams.has(p.team)
  );
  const irrelevant = positions.filter(p =>
    (p.status === 'OPEN' || p.status === 'WON') && !allSeededTeams.has(p.team)
  );

  const totalStake   = relevant.reduce((s, p) => s + p.stake, 0);
  const totalPayout  = relevant.reduce((s, p) => s + p.potentialPayout, 0);

  if (positions.length === 0) return null;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Target size={13} className="text-purple-400" />
        <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Portfolio Exposure in Bracket</span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-lg font-black text-white">{relevant.length}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Active Bets</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-amber-400">${fmt(totalStake)}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Total Staked</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-emerald-400">${fmt(totalPayout)}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Max Payout</div>
        </div>
      </div>

      {/* Per-team breakdown (relevant only) */}
      {relevant.length > 0 && (
        <div className="space-y-1.5 border-t border-slate-800 pt-2">
          {[...new Set(relevant.map(p => p.team))].map(team => {
            const teamBets = relevant.filter(p => p.team === team);
            const teamStake  = teamBets.reduce((s, p) => s + p.stake, 0);
            const teamPayout = teamBets.reduce((s, p) => s + p.potentialPayout, 0);
            const logo = getLogo(team);
            return (
              <div key={team} className="flex items-center gap-2">
                <img src={logo} alt="" className="w-5 h-5 object-contain shrink-0" onError={e => { e.target.style.display='none'; }} />
                <span className="text-white text-xs font-bold flex-1 truncate">{team}</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {teamBets.map(p => {
                    const c = TYPE_COLOR[p.type] || TYPE_COLOR.default;
                    return (
                      <span key={p.id} className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${c.bg} ${c.text} ${c.border}`}>
                        {TYPE_SHORT[p.type]}
                      </span>
                    );
                  })}
                </div>
                <span className="text-amber-400 font-mono text-xs">${fmt(teamStake)}</span>
                <span className="text-slate-500 text-xs">→</span>
                <span className="text-emerald-400 font-mono text-xs">${fmt(teamPayout)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bets on teams NOT in bracket */}
      {irrelevant.length > 0 && (
        <div className="border-t border-slate-800 pt-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Info size={11} className="text-amber-400" />
            <span className="text-[10px] text-amber-400 font-bold">
              {irrelevant.length} bet{irrelevant.length > 1 ? 's' : ''} on teams not in bracket
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set(irrelevant.map(p => p.team))].map(team => (
              <span key={team} className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {team}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BET TYPE LEGEND
// ═════════════════════════════════════════════════════════════════════════════
function Legend() {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Bet Types:</span>
      {Object.entries(TYPE_SHORT).map(([type, short]) => {
        const c = TYPE_COLOR[type] || TYPE_COLOR.default;
        return (
          <span key={type} className={`inline-flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {short} = {FUTURES_TYPE_LABELS[type]}
          </span>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SUPER BOWL CENTER PANEL
// ═════════════════════════════════════════════════════════════════════════════
// FLAGGED (lint cleanup, 2026-08-10, not fixed — needs Andy's call): every
// other sibling panel in this file (TeamSlot, SeedTable, etc.) uses the
// `exposure` map (exposure.get(team)) to show per-team position info, but
// this one receives the same prop and ignores it, independently re-deriving
// SB-specific positions via a raw getPositions() filter instead. May be
// intentional (SB panel wants matchup-type positions specifically, not
// general per-team exposure) or may be a leftover unused prop -- left the
// param as-is (not renamed to `_exposure`) since it's real data threaded in
// from the parent, not obviously dead.
// eslint-disable-next-line no-unused-vars
function SuperBowlPanel({ exposure }) {
  // SB matchup bets
  const sbPositions = getPositions().filter(p =>
    p.type === FUTURES_TYPES.SUPERBOWL || p.type === FUTURES_TYPES.SB_MATCHUP
  );
  const openSb = sbPositions.filter(p => p.status === 'OPEN' || p.status === 'WON');

  return (
    <div className="flex items-center justify-center px-2">
      <div className="text-center space-y-2 max-w-[120px]">
        <div className="bg-gradient-to-b from-amber-500/20 to-purple-600/20 border border-amber-500/30 rounded-xl p-3 shadow-lg shadow-amber-900/20">
          <Trophy size={20} className="text-amber-400 mx-auto mb-1" />
          <div className="text-amber-300 font-black text-sm tracking-widest">SUPER</div>
          <div className="text-amber-300 font-black text-sm tracking-widest">BOWL</div>
        </div>

        {openSb.length > 0 && (
          <div className="space-y-1">
            {openSb.map(p => {
              const c = TYPE_COLOR[p.type] || TYPE_COLOR.default;
              const logo = getLogo(p.team);
              return (
                <div key={p.id} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${c.bg} ${c.border}`}>
                  <img src={logo} alt="" className="w-4 h-4 object-contain" onError={e => { e.target.style.display='none'; }} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-[9px] font-black ${c.text} truncate`}>{p.team}</div>
                    <div className="text-[8px] text-slate-500 font-mono">${fmt(p.stake)}→${fmtK(p.potentialPayout)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// QUICK REFERENCE TABLE — flat list of all 14 seeds
// ═════════════════════════════════════════════════════════════════════════════
function SeedTable({ seeds, exposure }) {
  const [open, setOpen] = useState(false);
  const allSeeds = [
    ...seeds.afc.map((t, i) => ({ team: t, seed: i + 1, conf: 'AFC' })),
    ...seeds.nfc.map((t, i) => ({ team: t, seed: i + 1, conf: 'NFC' })),
  ].filter(s => s.team);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-800/30 transition"
      >
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-300">All Seeds Reference</span>
          <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
            {allSeeds.length}
          </span>
        </div>
        {open ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
      </button>

      {open && (
        <div className="border-t border-slate-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2 text-left text-[10px] uppercase text-slate-500 font-bold">Seed</th>
                <th className="px-4 py-2 text-left text-[10px] uppercase text-slate-500 font-bold">Team</th>
                <th className="px-4 py-2 text-right text-[10px] uppercase text-slate-500 font-bold">Staked</th>
                <th className="px-4 py-2 text-right text-[10px] uppercase text-slate-500 font-bold">Max Payout</th>
                <th className="px-4 py-2 text-left text-[10px] uppercase text-slate-500 font-bold">Bet Types</th>
              </tr>
            </thead>
            <tbody>
              {allSeeds.map(({ team, seed, conf }) => {
                const exp      = exposure?.get(team);
                const hasBet   = exp && exp.positions.length > 0;
                const confCl   = conf === 'AFC' ? 'text-blue-400' : 'text-red-400';
                const logo     = getLogo(team);
                return (
                  <tr key={`${conf}-${seed}`} className={`border-b border-slate-800/50 ${hasBet ? 'bg-purple-500/5' : ''}`}>
                    <td className="px-4 py-2">
                      <span className={`font-black text-[11px] ${confCl}`}>{conf} #{seed}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <img src={logo} alt="" className="w-5 h-5 object-contain" onError={e => { e.target.style.display='none'; }} />
                        <span className={`font-bold ${hasBet ? 'text-white' : 'text-slate-400'}`}>{team}</span>
                        {seed === 1 && <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">BYE</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {hasBet ? <span className="text-amber-400">${fmt(exp.totalStake)}</span> : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {hasBet ? <span className="text-emerald-400">${fmt(exp.totalPayout)}</span> : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="px-4 py-2">
                      {hasBet ? (
                        <div className="flex flex-wrap gap-1">
                          {exp.positions.map(p => {
                            const c = TYPE_COLOR[p.type] || TYPE_COLOR.default;
                            return (
                              <span key={p.id} className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${c.bg} ${c.text} ${c.border}`}>
                                {TYPE_SHORT[p.type]}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-700 text-[10px]">No bets</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function PlayoffBracket() {
  const { seeds, setSeed, resetBracket } = useBracket();
  const [editMode, setEditMode] = useState(false);
  // FLAGGED (lint cleanup, 2026-08-10, not fixed — needs Andy's call):
  // setRefreshKey is never called anywhere in this component -- there's no
  // refresh/reload button wired to it, so `positions` below can only ever
  // be computed once at mount despite the useMemo depending on refreshKey.
  // If a position is added/edited/deleted elsewhere while this component
  // stays mounted, this view will show stale data with no way to refresh
  // short of a full remount. Left the state in place (it's real scaffolding
  // for a refresh mechanism, just currently unreachable) rather than
  // deleting it or guessing where a refresh trigger should go.
  // eslint-disable-next-line no-unused-vars
  const [refreshKey, setRefreshKey] = useState(0);

  const positions = useMemo(() => getPositions(), [refreshKey]);
  const exposure  = useMemo(() => buildExposureMap(positions), [positions]);

  const isDemo = JSON.stringify(seeds) === JSON.stringify(DEFAULT_SEEDS);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Playoff Bracket</span>
          {isDemo && (
            <span className="text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full">
              DEMO
            </span>
          )}
          <span className="text-[10px] text-slate-600">— overlay shows open futures exposure per team</span>
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <button
              onClick={() => { resetBracket(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-700 transition"
            >
              <RotateCcw size={11} /> Reset Demo
            </button>
          )}
          <button
            onClick={() => setEditMode(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border
              ${editMode
                ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
          >
            {editMode ? <><Save size={11} /> Done Editing</> : <><Edit3 size={11} /> Edit Seeds</>}
          </button>
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 text-xs text-purple-300">
          <Edit3 size={11} />
          Click any team card to change the seed assignment. Use the search box to find teams quickly.
        </div>
      )}

      {/* Legend */}
      <Legend />

      {/* MAIN BRACKET */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
        <div className="flex gap-1 min-w-[700px]">
          {/* AFC half */}
          <div className="flex-1">
            <ConferenceHalf
              conf="afc"
              seeds={seeds}
              exposure={exposure}
              onPick={setSeed}
              editMode={editMode}
            />
          </div>

          {/* Super Bowl center column */}
          <SuperBowlPanel exposure={exposure} />

          {/* NFC half */}
          <div className="flex-1">
            <ConferenceHalf
              conf="nfc"
              seeds={seeds}
              exposure={exposure}
              onPick={setSeed}
              editMode={editMode}
            />
          </div>
        </div>
      </div>

      {/* Exposure summary */}
      <ExposureSummary positions={positions} seeds={seeds} />

      {/* Seed reference table */}
      <SeedTable seeds={seeds} exposure={exposure} />
    </div>
  );
}
