// src/components/dfs/DFSOptimizer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// F-7: DFS Lineup Optimizer
// DraftKings / FanDuel / Yahoo lineup builder with a mock player pool.
// Greedy optimizer: value = proj_pts / salary * 1000
// Lineups persisted to localStorage nfl_dfs_lineups_v1
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import { Layers, ChevronUp, ChevronDown, Lock, X, RotateCcw, Save, Trash2, Zap, DollarSign } from 'lucide-react';
import { loadFromStorage, saveToStorage } from '../../lib/storage.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = {
  dk: {
    label: 'DraftKings',
    cap: 50000,
    slots: [
      { id: 'QB',    positions: ['QB'],              label: 'QB' },
      { id: 'RB1',   positions: ['RB'],              label: 'RB' },
      { id: 'RB2',   positions: ['RB'],              label: 'RB' },
      { id: 'WR1',   positions: ['WR'],              label: 'WR' },
      { id: 'WR2',   positions: ['WR'],              label: 'WR' },
      { id: 'WR3',   positions: ['WR'],              label: 'WR' },
      { id: 'TE',    positions: ['TE'],              label: 'TE' },
      { id: 'FLEX',  positions: ['RB','WR','TE'],    label: 'FLEX' },
      { id: 'DST',   positions: ['DST'],             label: 'DST' },
    ],
  },
  fd: {
    label: 'FanDuel',
    cap: 60000,
    slots: [
      { id: 'QB',    positions: ['QB'],              label: 'QB' },
      { id: 'RB1',   positions: ['RB'],              label: 'RB' },
      { id: 'RB2',   positions: ['RB'],              label: 'RB' },
      { id: 'WR1',   positions: ['WR'],              label: 'WR' },
      { id: 'WR2',   positions: ['WR'],              label: 'WR' },
      { id: 'WR3',   positions: ['WR'],              label: 'WR' },
      { id: 'TE',    positions: ['TE'],              label: 'TE' },
      { id: 'FLEX',  positions: ['WR','RB','TE'],    label: 'FLEX' },
      { id: 'K',     positions: ['K'],               label: 'K' },
      { id: 'DST',   positions: ['DST'],             label: 'DST' },
    ],
  },
  // Phase 0 (2026-08-24): Yahoo added by extending the existing DK/FD
  // platform-switcher pattern -- a $200 salary-style cap (vs. DK/FD's $50k/
  // $60k), same 9-man roster shape as DK (no K slot; Yahoo's classic
  // contest excludes kickers, same as DraftKings). yhSal is derived from
  // each player's dkSal below rather than hand-authored, consistent with
  // this whole pool already being illustrative mock data.
  yh: {
    label: 'Yahoo',
    cap: 200,
    slots: [
      { id: 'QB',    positions: ['QB'],              label: 'QB' },
      { id: 'RB1',   positions: ['RB'],              label: 'RB' },
      { id: 'RB2',   positions: ['RB'],              label: 'RB' },
      { id: 'WR1',   positions: ['WR'],              label: 'WR' },
      { id: 'WR2',   positions: ['WR'],              label: 'WR' },
      { id: 'WR3',   positions: ['WR'],              label: 'WR' },
      { id: 'TE',    positions: ['TE'],              label: 'TE' },
      { id: 'FLEX',  positions: ['RB','WR','TE'],    label: 'FLEX' },
      { id: 'DST',   positions: ['DST'],             label: 'DST' },
    ],
  },
};

// ─── Mock Player Pool ─────────────────────────────────────────────────────────
// Realistic salaries + projections for the upcoming season (offseason mock data).
// Projections are season-average expected DK pts per game.

const MOCK_PLAYERS = [
  // ── QBs ──
  { id: 'p1',  name: 'Lamar Jackson',     pos: 'QB',  team: 'BAL', dkSal: 8600, fdSal: 9400, proj: 32.4 },
  { id: 'p2',  name: 'Josh Allen',        pos: 'QB',  team: 'BUF', dkSal: 8400, fdSal: 9200, proj: 31.2 },
  { id: 'p3',  name: 'Jalen Hurts',       pos: 'QB',  team: 'PHI', dkSal: 8200, fdSal: 9000, proj: 30.1 },
  { id: 'p4',  name: 'Patrick Mahomes',   pos: 'QB',  team: 'KC',  dkSal: 8100, fdSal: 8900, proj: 29.6 },
  { id: 'p5',  name: 'Joe Burrow',        pos: 'QB',  team: 'CIN', dkSal: 7800, fdSal: 8600, proj: 27.8 },
  { id: 'p6',  name: 'Dak Prescott',      pos: 'QB',  team: 'DAL', dkSal: 7200, fdSal: 8000, proj: 24.5 },
  { id: 'p7',  name: 'Tua Tagovailoa',    pos: 'QB',  team: 'MIA', dkSal: 7000, fdSal: 7700, proj: 23.1 },
  { id: 'p8',  name: 'Brock Purdy',       pos: 'QB',  team: 'SF',  dkSal: 6800, fdSal: 7500, proj: 22.4 },
  { id: 'p9',  name: 'Jayden Daniels',    pos: 'QB',  team: 'WAS', dkSal: 6700, fdSal: 7400, proj: 23.8 },
  { id: 'p10', name: 'Bo Nix',            pos: 'QB',  team: 'DEN', dkSal: 6200, fdSal: 6800, proj: 21.0 },

  // ── RBs ──
  { id: 'p11', name: 'Christian McCaffrey',pos:'RB',  team: 'SF',  dkSal: 9000, fdSal: 10000, proj: 28.5 },
  { id: 'p12', name: 'Saquon Barkley',    pos: 'RB',  team: 'PHI', dkSal: 8600, fdSal: 9400, proj: 26.8 },
  { id: 'p13', name: 'Derrick Henry',     pos: 'RB',  team: 'BAL', dkSal: 7800, fdSal: 8500, proj: 24.2 },
  { id: 'p14', name: 'Breece Hall',       pos: 'RB',  team: 'NYJ', dkSal: 7200, fdSal: 7900, proj: 22.0 },
  { id: 'p15', name: 'Bijan Robinson',    pos: 'RB',  team: 'ATL', dkSal: 7000, fdSal: 7700, proj: 21.4 },
  { id: 'p16', name: 'De\'Von Achane',    pos: 'RB',  team: 'MIA', dkSal: 6800, fdSal: 7400, proj: 20.8 },
  { id: 'p17', name: 'Josh Jacobs',       pos: 'RB',  team: 'GB',  dkSal: 6500, fdSal: 7100, proj: 19.5 },
  { id: 'p18', name: 'Kyren Williams',    pos: 'RB',  team: 'LAR', dkSal: 6400, fdSal: 7000, proj: 19.2 },
  { id: 'p19', name: 'James Cook',        pos: 'RB',  team: 'BUF', dkSal: 6200, fdSal: 6800, proj: 18.8 },
  { id: 'p20', name: 'Tony Pollard',      pos: 'RB',  team: 'TEN', dkSal: 5800, fdSal: 6400, proj: 17.1 },
  { id: 'p21', name: 'Rhamondre Stevenson',pos:'RB',  team: 'NE',  dkSal: 5500, fdSal: 6000, proj: 15.8 },
  { id: 'p22', name: 'Alvin Kamara',      pos: 'RB',  team: 'NO',  dkSal: 6000, fdSal: 6600, proj: 17.9 },

  // ── WRs ──
  { id: 'p23', name: 'CeeDee Lamb',       pos: 'WR',  team: 'DAL', dkSal: 9200, fdSal: 10200, proj: 31.0 },
  { id: 'p24', name: 'Tyreek Hill',       pos: 'WR',  team: 'MIA', dkSal: 8800, fdSal: 9600, proj: 28.5 },
  { id: 'p25', name: 'Justin Jefferson',  pos: 'WR',  team: 'MIN', dkSal: 8600, fdSal: 9400, proj: 27.8 },
  { id: 'p26', name: 'Ja\'Marr Chase',    pos: 'WR',  team: 'CIN', dkSal: 8400, fdSal: 9200, proj: 27.2 },
  { id: 'p27', name: 'Amon-Ra St. Brown', pos: 'WR',  team: 'DET', dkSal: 7800, fdSal: 8500, proj: 25.1 },
  { id: 'p28', name: 'Davante Adams',     pos: 'WR',  team: 'LAR', dkSal: 7200, fdSal: 7900, proj: 22.4 },
  { id: 'p29', name: 'Stefon Diggs',      pos: 'WR',  team: 'HOU', dkSal: 7000, fdSal: 7700, proj: 21.8 },
  { id: 'p30', name: 'Puka Nacua',        pos: 'WR',  team: 'LAR', dkSal: 6800, fdSal: 7400, proj: 21.0 },
  { id: 'p31', name: 'Garrett Wilson',    pos: 'WR',  team: 'NYJ', dkSal: 6700, fdSal: 7300, proj: 20.5 },
  { id: 'p32', name: 'DJ Moore',          pos: 'WR',  team: 'CHI', dkSal: 6400, fdSal: 7000, proj: 19.8 },
  { id: 'p33', name: 'Chris Olave',       pos: 'WR',  team: 'NO',  dkSal: 6200, fdSal: 6800, proj: 18.9 },
  { id: 'p34', name: 'Tee Higgins',       pos: 'WR',  team: 'CIN', dkSal: 6000, fdSal: 6600, proj: 18.4 },
  { id: 'p35', name: 'Calvin Ridley',     pos: 'WR',  team: 'TEN', dkSal: 5600, fdSal: 6100, proj: 16.9 },
  { id: 'p36', name: 'Rashee Rice',       pos: 'WR',  team: 'KC',  dkSal: 5800, fdSal: 6400, proj: 17.5 },
  { id: 'p37', name: 'Zay Flowers',       pos: 'WR',  team: 'BAL', dkSal: 5700, fdSal: 6200, proj: 17.0 },

  // ── TEs ──
  { id: 'p38', name: 'Sam LaPorta',       pos: 'TE',  team: 'DET', dkSal: 6800, fdSal: 7400, proj: 18.5 },
  { id: 'p39', name: 'Trey McBride',      pos: 'TE',  team: 'ARI', dkSal: 6600, fdSal: 7200, proj: 17.8 },
  { id: 'p40', name: 'Dalton Kincaid',    pos: 'TE',  team: 'BUF', dkSal: 5800, fdSal: 6400, proj: 15.2 },
  { id: 'p41', name: 'Jake Ferguson',     pos: 'TE',  team: 'DAL', dkSal: 5600, fdSal: 6100, proj: 14.6 },
  { id: 'p42', name: 'Tucker Kraft',      pos: 'TE',  team: 'GB',  dkSal: 5200, fdSal: 5700, proj: 13.1 },
  { id: 'p43', name: 'Pat Freiermuth',    pos: 'TE',  team: 'PIT', dkSal: 4800, fdSal: 5300, proj: 11.9 },
  { id: 'p44', name: 'Evan Engram',       pos: 'TE',  team: 'JAC', dkSal: 5000, fdSal: 5500, proj: 12.5 },

  // ── Ks (FD only) ──
  { id: 'p45', name: 'Evan McPherson',    pos: 'K',   team: 'CIN', dkSal: 0,    fdSal: 5200, proj: 9.8  },
  { id: 'p46', name: 'Jake Moody',        pos: 'K',   team: 'SF',  dkSal: 0,    fdSal: 4900, proj: 9.2  },
  { id: 'p47', name: 'Harrison Butker',   pos: 'K',   team: 'KC',  dkSal: 0,    fdSal: 5000, proj: 9.5  },
  { id: 'p48', name: 'Tyler Bass',        pos: 'K',   team: 'BUF', dkSal: 0,    fdSal: 4800, proj: 9.0  },
  { id: 'p49', name: 'Brandon Aubrey',    pos: 'K',   team: 'DAL', dkSal: 0,    fdSal: 5100, proj: 9.6  },

  // ── DSTs ──
  { id: 'p50', name: 'San Francisco 49ers', pos: 'DST', team: 'SF',  dkSal: 4200, fdSal: 5000, proj: 12.0 },
  { id: 'p51', name: 'Baltimore Ravens',    pos: 'DST', team: 'BAL', dkSal: 4000, fdSal: 4800, proj: 11.5 },
  { id: 'p52', name: 'Dallas Cowboys',      pos: 'DST', team: 'DAL', dkSal: 3800, fdSal: 4600, proj: 10.8 },
  { id: 'p53', name: 'Buffalo Bills',       pos: 'DST', team: 'BUF', dkSal: 3600, fdSal: 4400, proj: 10.2 },
  { id: 'p54', name: 'Kansas City Chiefs',  pos: 'DST', team: 'KC',  dkSal: 3400, fdSal: 4200, proj: 9.8  },
  { id: 'p55', name: 'Pittsburgh Steelers', pos: 'DST', team: 'PIT', dkSal: 3200, fdSal: 4000, proj: 9.1  },
  { id: 'p56', name: 'New York Jets',       pos: 'DST', team: 'NYJ', dkSal: 3000, fdSal: 3800, proj: 8.5  },
  { id: 'p57', name: 'Cleveland Browns',    pos: 'DST', team: 'CLE', dkSal: 2800, fdSal: 3600, proj: 8.0  },
];

// Yahoo (Phase 0, 2026-08-24): derive yhSal from dkSal, scaled to a $200
// cap the same way DK's $50,000 cap scales down (dkSal / 250, i.e. the same
// ratio as 50000 / 200), rounded to a whole dollar to match how Yahoo
// actually prices players. K stays $0/excluded, same as dkSal.
for (const p of MOCK_PLAYERS) {
  p.yhSal = p.dkSal > 0 ? Math.max(4, Math.round(p.dkSal / 250)) : 0;
}

const STORAGE_KEY = 'nfl_dfs_lineups_v1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSalary(player, platform) {
  return player[`${platform}Sal`] ?? 0;
}

function getValue(player, platform) {
  const sal = getSalary(player, platform);
  if (!sal) return 0;
  return ((player.proj / sal) * 1000).toFixed(2);
}

/**
 * Greedy DFS optimizer.
 * Fills each slot with the highest-value eligible player not already used.
 * Returns { lineup: [{slot, player}], totalSalary, totalProj } or null.
 */
function greedyOptimize(platform, players, locked, excluded) {
  const cfg = PLATFORMS[platform];
  const excludedIds = new Set(excluded);
  const pool = players.filter(p => {
    const sal = getSalary(p, platform);
    return sal > 0 && !excludedIds.has(p.id);
  });

  const lineup = [];
  const usedIds = new Set();

  // Pre-fill locked players into matching slots
  const lockedMap = new Map();
  for (const pid of locked) {
    const p = pool.find(x => x.id === pid);
    if (p) {
      for (const slot of cfg.slots) {
        if (!lockedMap.has(slot.id) && slot.positions.includes(p.pos)) {
          lockedMap.set(slot.id, p);
          break;
        }
      }
    }
  }

  let totalSalary = 0;
  for (const [, p] of lockedMap) totalSalary += getSalary(p, platform);

  const remainingCap = cfg.cap - totalSalary;
  const unlockedSlots = cfg.slots.filter(s => !lockedMap.has(s.id));
  const perSlotCap = unlockedSlots.length > 0 ? Math.floor(remainingCap / unlockedSlots.length) : 0;

  // Fill locked slots
  for (const slot of cfg.slots) {
    if (lockedMap.has(slot.id)) {
      const p = lockedMap.get(slot.id);
      lineup.push({ slot: slot.id, player: p });
      usedIds.add(p.id);
    }
  }

  // Fill remaining slots greedily by value
  for (const slot of cfg.slots) {
    if (lockedMap.has(slot.id)) continue;

    const candidates = pool
      .filter(p => slot.positions.includes(p.pos) && !usedIds.has(p.id))
      .sort((a, b) => parseFloat(getValue(b, platform)) - parseFloat(getValue(a, platform)));

    const pick = candidates.find(p => getSalary(p, platform) <= perSlotCap * 1.5 + 1000);
    if (!pick) {
      // Fallback: cheapest eligible
      const cheapest = candidates.sort((a, b) => getSalary(a, platform) - getSalary(b, platform))[0];
      if (!cheapest) return null;
      lineup.push({ slot: slot.id, player: cheapest });
      usedIds.add(cheapest.id);
    } else {
      lineup.push({ slot: slot.id, player: pick });
      usedIds.add(pick.id);
    }
  }

  const total = lineup.reduce((sum, s) => sum + getSalary(s.player, platform), 0);
  const proj  = lineup.reduce((sum, s) => sum + s.player.proj, 0);

  return {
    lineup,
    totalSalary: total,
    totalProj: proj.toFixed(1),
    overBudget: total > cfg.cap,
  };
}

// ─── Sort State ───────────────────────────────────────────────────────────────

function useSortableTable(defaultField, defaultDir = 'desc') {
  const [sort, setSort] = useState({ field: defaultField, dir: defaultDir });
  const toggle = (field) => {
    setSort(prev => prev.field === field
      ? { field, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      : { field, dir: 'desc' }
    );
  };
  return [sort, toggle];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortHeader({ label, field, sort, onSort, className = '' }) {
  const active = sort.field === field;
  return (
    <th
      className={`px-3 py-2 text-left cursor-pointer select-none hover:text-white transition-colors ${active ? 'text-white' : 'text-slate-400'} ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? (sort.dir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />)
          : <ChevronDown size={11} className="opacity-30" />}
      </div>
    </th>
  );
}

function PosTag({ pos }) {
  const colors = {
    QB: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    RB: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    WR: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    TE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    K:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
    DST:'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colors[pos] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
      {pos}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DFSOptimizer() {
  const [platform, setPlatform]  = useState('dk');
  const [locked, setLocked]      = useState(new Set());   // player ids
  const [excluded, setExcluded]  = useState(new Set());   // player ids
  const [result, setResult]      = useState(null);
  const [savedLineups, setSavedLineups] = useState(() => loadFromStorage(STORAGE_KEY, []));
  const [posFilter, setPosFilter] = useState('ALL');
  const [sort, toggleSort]        = useSortableTable('value');

  const cfg = PLATFORMS[platform];

  // Player pool filtered + sorted for table
  const displayPlayers = useMemo(() => {
    let list = MOCK_PLAYERS.filter(p => {
      const sal = getSalary(p, platform);
      if (sal === 0) return false; // K has 0 DK salary → hide on DK
      if (posFilter !== 'ALL' && p.pos !== posFilter) return false;
      return true;
    });

    const dir = sort.dir === 'desc' ? -1 : 1;
    list = list.sort((a, b) => {
      if (sort.field === 'value') return dir * (parseFloat(getValue(b, platform)) - parseFloat(getValue(a, platform))) * -1;
      if (sort.field === 'salary') return dir * (getSalary(b, platform) - getSalary(a, platform)) * -1;
      if (sort.field === 'proj') return dir * (b.proj - a.proj) * -1;
      if (sort.field === 'name') return dir * a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [platform, posFilter, sort]);

  const toggleLock = useCallback((id) => {
    setLocked(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      setExcluded(e => { const ne = new Set(e); ne.delete(id); return ne; });
      next.add(id);
      return next;
    });
  }, []);

  const toggleExclude = useCallback((id) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      setLocked(l => { const nl = new Set(l); nl.delete(id); return nl; });
      next.add(id);
      return next;
    });
  }, []);

  const handleOptimize = useCallback(() => {
    const r = greedyOptimize(platform, MOCK_PLAYERS, locked, excluded);
    setResult(r);
  }, [platform, locked, excluded]);

  const handleSave = useCallback(() => {
    if (!result) return;
    const lineup = {
      id: Date.now(),
      platform,
      createdAt: new Date().toLocaleDateString(),
      totalSalary: result.totalSalary,
      totalProj: result.totalProj,
      slots: result.lineup.map(s => ({ slot: s.slot, playerId: s.player.id, playerName: s.player.name, pos: s.player.pos, salary: getSalary(s.player, platform), proj: s.player.proj })),
    };
    const updated = [lineup, ...savedLineups].slice(0, 10); // keep 10 max
    setSavedLineups(updated);
    saveToStorage(STORAGE_KEY, updated);
  }, [result, platform, savedLineups]);

  const handleDeleteSaved = useCallback((id) => {
    const updated = savedLineups.filter(l => l.id !== id);
    setSavedLineups(updated);
    saveToStorage(STORAGE_KEY, updated);
  }, [savedLineups]);

  const handleClear = useCallback(() => {
    setLocked(new Set());
    setExcluded(new Set());
    setResult(null);
  }, []);

  const totalSalary   = result?.totalSalary ?? 0;
  const capRemaining  = cfg.cap - totalSalary;
  const capPct        = Math.min(100, (totalSalary / cfg.cap) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <Layers size={18} className="text-sky-400" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg tracking-tight">DFS Optimizer</h1>
            <p className="text-slate-500 text-xs">Lineup Builder · Mock Player Pool</p>
          </div>
        </div>

        {/* Platform toggle */}
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {Object.entries(PLATFORMS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => { setPlatform(key); setResult(null); }}
              className={`px-5 py-2 text-sm font-bold transition-colors ${platform === key ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Player Pool ─────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Player Pool</h2>
            <div className="flex items-center gap-2">
              {/* Position filter */}
              {['ALL','QB','RB','WR','TE', ...(platform === 'fd' ? ['K'] : []), 'DST'].map(p => (
                <button
                  key={p}
                  onClick={() => setPosFilter(p)}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${posFilter === p ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-400 w-8"></th>
                  <SortHeader label="Player" field="name" sort={sort} onSort={toggleSort} />
                  <th className="px-3 py-2 text-left text-slate-400">Pos</th>
                  <th className="px-3 py-2 text-left text-slate-400">Tm</th>
                  <SortHeader label="Salary" field="salary" sort={sort} onSort={toggleSort} />
                  <SortHeader label="Proj"   field="proj"   sort={sort} onSort={toggleSort} />
                  <SortHeader label="Value"  field="value"  sort={sort} onSort={toggleSort} />
                  <th className="px-3 py-2 text-left text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayPlayers.map(p => {
                  const isLocked   = locked.has(p.id);
                  const isExcluded = excluded.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`border-t border-slate-800/60 transition-colors ${
                        isExcluded ? 'opacity-30' : isLocked ? 'bg-sky-500/5' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="px-3 py-2">
                        {isLocked && <Lock size={10} className="text-sky-400" />}
                      </td>
                      <td className="px-3 py-2 font-medium text-white">{p.name}</td>
                      <td className="px-3 py-2"><PosTag pos={p.pos} /></td>
                      <td className="px-3 py-2 text-slate-400">{p.team}</td>
                      <td className="px-3 py-2 font-mono text-slate-300">
                        ${getSalary(p, platform).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-mono text-emerald-400">{p.proj}</td>
                      <td className="px-3 py-2 font-mono text-amber-300">{getValue(p, platform)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => toggleLock(p.id)}
                            title={isLocked ? 'Unlock' : 'Lock'}
                            className={`p-1 rounded transition-colors ${isLocked ? 'text-sky-400 bg-sky-500/20' : 'text-slate-500 hover:text-sky-400 hover:bg-sky-500/10'}`}
                          >
                            <Lock size={11} />
                          </button>
                          <button
                            onClick={() => toggleExclude(p.id)}
                            title={isExcluded ? 'Re-include' : 'Exclude'}
                            className={`p-1 rounded transition-colors ${isExcluded ? 'text-rose-400 bg-rose-500/20' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'}`}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right Panel ──────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Optimizer Controls */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <h2 className="text-sm font-bold text-white mb-3">Optimizer</h2>
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleOptimize}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
              >
                <Zap size={14} />
                Optimize
              </button>
              <button
                onClick={handleClear}
                className="p-2.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
                title="Clear locks and result"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Locks / Excludes summary */}
            <div className="flex gap-3 text-xs text-slate-500 mb-1">
              <span><Lock size={9} className="inline mr-1 text-sky-400" />{locked.size} locked</span>
              <span><X size={9} className="inline mr-1 text-rose-400" />{excluded.size} excluded</span>
            </div>
          </div>

          {/* Lineup Result */}
          {result && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">Lineup</h2>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 px-2 py-1 rounded border border-sky-500/30 hover:border-sky-400/60 transition-colors"
                >
                  <Save size={11} />
                  Save
                </button>
              </div>

              {/* Salary bar */}
              <div className="px-4 pt-3 pb-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Salary</span>
                  <span className={result.overBudget ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    ${totalSalary.toLocaleString()} / ${cfg.cap.toLocaleString()}
                    {result.overBudget && ' ⚠ OVER'}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${result.overBudget ? 'bg-rose-500' : capPct > 90 ? 'bg-amber-400' : 'bg-sky-500'}`}
                    style={{ width: `${Math.min(capPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Remaining: ${capRemaining.toLocaleString()}</span>
                  <span>Projected: <strong className="text-emerald-400">{result.totalProj} pts</strong></span>
                </div>
              </div>

              {/* Slots */}
              <div className="px-2 py-2 space-y-1">
                {result.lineup.map(({ slot, player }) => (
                  <div key={slot} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                    <span className="text-[10px] font-bold text-slate-500 w-10 flex-shrink-0">{slot}</span>
                    <span className="flex-1 text-xs font-medium text-white truncate">{player.name}</span>
                    <PosTag pos={player.pos} />
                    <span className="text-[10px] text-slate-400 w-14 text-right font-mono">${getSalary(player, platform).toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-400 w-10 text-right font-mono">{player.proj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Lineups */}
          {savedLineups.length > 0 && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">Saved Lineups</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {savedLineups.map(lineup => (
                  <div key={lineup.id} className="flex items-center gap-3 px-4 py-2.5">
                    <DollarSign size={12} className="text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white">
                        {lineup.platform.toUpperCase()} · {lineup.totalProj} pts
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ${lineup.totalSalary.toLocaleString()} · {lineup.createdAt}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSaved(lineup.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
