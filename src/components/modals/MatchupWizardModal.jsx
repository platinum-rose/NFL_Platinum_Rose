import React, { useState, useMemo } from 'react';
import { X, Wand2, User, Quote, Microscope, Target, DollarSign, TrendingUp, Shield, Zap, Activity, Newspaper, Radio, Award } from 'lucide-react';
import latestCampReport from '../../../data/training-camp/2026/latest.json';
import latestEmrReport from '../../../data/research-intel/local/2026-07-13-the-window-emr-ratings.json';
import { getSecondaryMatchupsForGame } from '../../lib/secondaryMatchupStore';

// --- 1. SHARED LOGOS ---
const TEAM_LOGOS = {
  "ARI": "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png", "ATL": "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png", "BAL": "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png", "BUF": "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png", "CAR": "https://a.espncdn.com/i/teamlogos/nfl/500/car.png", "CHI": "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png", "CIN": "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png", "CLE": "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png", "DAL": "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png", "DEN": "https://a.espncdn.com/i/teamlogos/nfl/500/den.png", "DET": "https://a.espncdn.com/i/teamlogos/nfl/500/det.png", "GB":  "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png", "HOU": "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png", "IND": "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png", "JAX": "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png", "KC":  "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", "LAC": "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png", "LAR": "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png", "LV":  "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png", "MIA": "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png", "MIN": "https://a.espncdn.com/i/teamlogos/nfl/500/min.png", "NE":  "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png", "NO":  "https://a.espncdn.com/i/teamlogos/nfl/500/no.png", "NYG": "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png", "NYJ": "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png", "PHI": "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png", "PIT": "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png", "SEA": "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png", "SF":  "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png", "TB":  "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png", "TEN": "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png", "WAS": "https://a.espncdn.com/i/teamlogos/nfl/500/was.png", "WSH": "https://a.espncdn.com/i/teamlogos/nfl/500/was.png",
  "Cardinals": "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png", "Falcons": "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png", "Ravens": "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png", "Bills": "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png", "Panthers": "https://a.espncdn.com/i/teamlogos/nfl/500/car.png", "Bears": "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png", "Bengals": "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png", "Browns": "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png", "Cowboys": "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png", "Broncos": "https://a.espncdn.com/i/teamlogos/nfl/500/den.png", "Lions": "https://a.espncdn.com/i/teamlogos/nfl/500/det.png", "Packers": "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png", "Texans": "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png", "Colts": "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png", "Jaguars": "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png", "Chiefs": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", "Raiders": "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png", "Chargers": "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png", "Rams": "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png", "Dolphins": "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png", "Vikings": "https://a.espncdn.com/i/teamlogos/nfl/500/min.png", "Patriots": "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png", "Saints": "https://a.espncdn.com/i/teamlogos/nfl/500/no.png", "Giants": "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png", "Jets": "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png", "Eagles": "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png", "Steelers": "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png", "49ers": "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png", "Seahawks": "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png", "Buccaneers": "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png", "Titans": "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png", "Commanders": "https://a.espncdn.com/i/teamlogos/nfl/500/was.png", "Washington": "https://a.espncdn.com/i/teamlogos/nfl/500/was.png"
};

// --- 2. PICK ITEM COMPONENT ---
const PickItem = ({ pick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasRationale = pick.rationale && Array.isArray(pick.rationale) && pick.rationale.length > 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg hover:border-indigo-500/30 transition-colors">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                    <User size={16} />
                </div>
                <div>
                    <div className="font-bold text-white text-sm">{pick.expert || "Expert Pick"}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                        {pick.pickType} • <span className="text-white font-mono">{pick.pick} {pick.line}</span>
                    </div>
                </div>
            </div>
            {pick.units > 1 && (
                <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-1 rounded border border-amber-500/20 font-bold">
                    {pick.units} UNIT PLAY
                </span>
            )}
        </div>
        <div className="flex gap-3 mt-3">
            <Quote size={16} className="text-indigo-500 min-w-[16px] mt-1" />
            <div className="flex-1">
                <p className="text-sm text-slate-200 italic leading-relaxed">"{pick.analysis}"</p>
                {hasRationale && (
                    <div className="mt-3">
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                                isExpanded ? "bg-indigo-600 text-white" : "bg-slate-900 text-indigo-400 border border-indigo-500/30 hover:text-white"
                            }`}
                        >
                            <Microscope size={14} className={isExpanded ? "" : "animate-pulse"} />
                            {isExpanded ? "Close Analysis" : "Deep Dive"}
                        </button>
                        {isExpanded && (
                            <div className="mt-3 p-4 bg-slate-950 rounded-lg border border-indigo-500/30">
                                <h5 className="text-[10px] text-indigo-400 font-bold uppercase mb-3 border-b border-indigo-900/50 pb-2">Detailed Rationale</h5>
                                <ul className="space-y-2">
                                    {pick.rationale.map((point, i) => (
                                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                                            <span className="text-indigo-500 mt-1">•</span><span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

// --- 3. PLATINUM RANK BADGE ---
const RankBadge = ({ rank, type }) => {
    let color = "bg-slate-800 text-slate-400";
    if (rank <= 5) color = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    else if (rank >= 25) color = "bg-rose-500/20 text-rose-400 border-rose-500/50";
    return (
        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border border-transparent ${color}`}>
            <span className="text-[8px] font-bold uppercase">{type}</span>
            <span className="text-sm font-black">{rank ? `#${rank}` : '-'}</span>
        </div>
    );
};

// --- 4. BET SELECTION BUTTON ---
const BetButton = ({ type, label, value, edge, selectedBet, setSelectedBet }) => {
    const isSelected = selectedBet === type;
    const handleClick = () => {
        if (isSelected) setSelectedBet(null);
        else setSelectedBet(type);
    };

    let displayValue = value;
    if (type.includes('total')) {
        displayValue = value;
    } else {
        displayValue = value > 0 ? `+${value}` : value;
    }

    return (
        <button
          onClick={handleClick}
          className={`relative w-full p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
              isSelected ? 'bg-emerald-900/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
          }`}
        >
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{label}</span>
            <span className="text-lg font-black text-white">{displayValue}</span>
            {edge && <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-lg animate-pulse">AI EDGE</div>}
        </button>
    );
};

function normalizeTeamCode(code) {
  if (!code) return '';
  const upper = String(code).trim().toUpperCase();
  const ALIASES = {
    KAN: 'KC', KCC: 'KC', SFO: 'SF', GNB: 'GB', NWE: 'NE', NOR: 'NO', TAM: 'TB', WAS: 'WSH', WDC: 'WSH', LVR: 'LV', OAK: 'LV', LAC: 'LAC', SD: 'LAC', LAR: 'LAR', STL: 'LAR'
  };
  return ALIASES[upper] || upper;
}

function cleanIntelText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\[&#8230;\]/g, '...')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// --- MAIN COMPONENT ---
export default function MatchupWizardModal({ isOpen, onClose, game, onBet, stats, currentWizardData }) {
  const [selectedBet, setSelectedBet] = useState(null);

  // --- MERGE EXPERT PICKS DATA ---
  const expertData = currentWizardData || game?.consensus || { expertPicks: { spread: [], total: [] } };
  const hasExpertPicks = expertData.expertPicks && (expertData.expertPicks.spread.length > 0 || expertData.expertPicks.total.length > 0);

  // --- STATS LOGIC ---
  const ranks = useMemo(() => {
    if (!stats || stats.length === 0) return {};
    const processed = stats.map(s => ({
        team: s.team,
        off: parseFloat(s.off_epa || 0),
        def: parseFloat(s.def_epa || 0)
    }));
    const offSorted = [...processed].sort((a,b) => b.off - a.off);
    const defSorted = [...processed].sort((a,b) => a.def - b.def);
    const rankMap = {};
    processed.forEach(t => {
        rankMap[t.team] = {
            off: offSorted.findIndex(x => x.team === t.team) + 1,
            def: defSorted.findIndex(x => x.team === t.team) + 1
        };
    });
    return rankMap;
  }, [stats]);

  // --- MATCHUP INTEL BULLETS AGGREGATOR ---
  const matchupIntelBullets = useMemo(() => {
    if (!game) return [];
    const bullets = [];

    const vis = game.visitor;
    const home = game.home;
    const visNorm = normalizeTeamCode(vis);
    const homeNorm = normalizeTeamCode(home);

    // 1. Secondary Mismatch
    const sec = getSecondaryMatchupsForGame(vis, home);
    if (sec && sec.maxSeverity >= 2) {
      bullets.push({
        source: '🛡️ Secondary Mismatch Engine',
        category: 'Matchup Vulnerability',
        title: `${vis} vs ${home} Secondary Target Alert`,
        detail: sec.visOffVsHomeDef?.vulnerability_tier === 'high'
          ? `${vis} passing attack has strong OVER & WR receiving prop signals against ${home}'s secondary.`
          : sec.homeOffVsVisDef?.vulnerability_tier === 'high'
          ? `${home} passing attack has strong OVER & WR receiving prop signals against ${vis}'s secondary.`
          : `Secondary mismatch detected between ${vis} & ${home} pass defenses.`,
        badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
      });
    }

    // 2. Training Camp Beat Intel (STRICT PRIMARY TEAM MATCH ONLY)
    if (latestCampReport && Array.isArray(latestCampReport.items)) {
      const visItems = latestCampReport.items.filter(i => {
        const itemTeam = normalizeTeamCode(i.primary_team || i.team);
        return itemTeam === visNorm;
      }).slice(0, 2);

      const homeItems = latestCampReport.items.filter(i => {
        const itemTeam = normalizeTeamCode(i.primary_team || i.team);
        return itemTeam === homeNorm;
      }).slice(0, 2);

      [...visItems, ...homeItems].forEach(item => {
        bullets.push({
          source: item.source || '🏈 Training Camp Scout',
          category: `${item.primary_team || item.team} Camp News`,
          title: cleanIntelText(item.summary || item.title || 'Camp Update'),
          detail: cleanIntelText(item.raw_excerpt || item.snippet || item.summary),
          badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
        });
      });
    }

    // 3. Substack EMR Ratings & Notes (STRICT TEAM CODE MATCH)
    if (latestEmrReport && latestEmrReport.body) {
      const lines = latestEmrReport.body.split('\n');
      lines.forEach(line => {
        const hasVis = line.includes(`**${visNorm}**`);
        const hasHome = line.includes(`**${homeNorm}**`);
        if (hasVis || hasHome) {
          bullets.push({
            source: '📰 Substack EMR Ratings (Matt Russell)',
            category: 'Market Power Rating',
            title: cleanIntelText(line.replace(/^- /, '').replace(/\*\*/g, '')),
            detail: 'Cross-referenced lookahead spread & win total market adjustments.',
            badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-300'
          });
        }
      });
    }

    return bullets;
  }, [game]);


  if (!isOpen || !game) return null;

  const hRank = ranks[game.home] || { off: '-', def: '-' };
  const vRank = ranks[game.visitor] || { off: '-', def: '-' };
  const homeEPA = stats.find(s => s.team === game.home)?.off_epa || 0;
  const visEPA = stats.find(s => s.team === game.visitor)?.off_epa || 0;
  const projHome = 21 + (homeEPA * 30); 
  const projVis = 21 + (visEPA * 30);
  const projSpread = (projVis - projHome).toFixed(1);
  const hasEdge = Math.abs(projSpread - game.spread) > 2.0;
  const edgeSide = hasEdge ? (projSpread < game.spread ? game.home : game.visitor) : null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* --- SECTION 1: PLATINUM HEADER --- */}
        <div className="relative bg-slate-950 p-6 border-b border-slate-800">
            <button onClick={onClose} className="absolute top-3 right-3 z-20 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors shadow-lg"><X size={18} /></button>
            <div className="flex justify-between items-center gap-4 pr-10">
                <div className="flex flex-col items-center">
                    <img src={TEAM_LOGOS[game.visitor]} alt={game.visitor} className="w-16 h-16 object-contain mb-2 drop-shadow-lg" />
                    <div className="text-2xl font-black text-white tracking-tight">{Math.round(projVis)}</div>
                    <div className="text-[10px] font-mono text-emerald-400">Proj. Score</div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Matchup Analysis</div>
                    <div className="text-3xl font-thin text-slate-700">@</div>
                    {hasEdge && (
                        <div className="mt-2 px-3 py-1 bg-purple-900/30 border border-purple-500/50 rounded-full text-purple-300 text-[10px] font-bold flex items-center gap-1">
                            <Zap size={10} className="fill-purple-300" /> Model Likes {edgeSide}
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center">
                    <img src={TEAM_LOGOS[game.home]} alt={game.home} className="w-16 h-16 object-contain mb-2 drop-shadow-lg" />
                    <div className="text-2xl font-black text-white tracking-tight">{Math.round(projHome)}</div>
                    <div className="text-[10px] font-mono text-emerald-400">Proj. Score</div>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* --- SECTION 2: STATS & BETTING --- */}
            <div className="p-6 bg-slate-900 border-b border-slate-800">
                <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                    <div className="flex justify-between items-center px-4 border-r border-slate-800">
                        <RankBadge rank={vRank.off} type="OFF" />
                        <div className="px-2 py-1 bg-slate-800 rounded text-[9px] font-bold text-slate-500 uppercase">VS</div>
                        <RankBadge rank={hRank.off} type="OFF" />
                    </div>
                    <div className="flex justify-between items-center px-4">
                        <RankBadge rank={vRank.def} type="DEF" />
                        <div className="px-2 py-1 bg-slate-800 rounded text-[9px] font-bold text-slate-500 uppercase">VS</div>
                        <RankBadge rank={hRank.def} type="DEF" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-sm font-bold text-white flex items-center gap-2"><Target size={16} className="text-emerald-400" /> Select Your Wager</div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        <BetButton selectedBet={selectedBet} setSelectedBet={setSelectedBet} type="vis_spread" label={`${game.visitor} Spread`} value={game.spread * -1} edge={edgeSide === game.visitor} />
                        <BetButton selectedBet={selectedBet} setSelectedBet={setSelectedBet} type="total_over" label="Over" value={game.total} />
                        <BetButton selectedBet={selectedBet} setSelectedBet={setSelectedBet} type="home_spread" label={`${game.home} Spread`} value={game.spread} edge={edgeSide === game.home} />
                    </div>
                    
                    <button 
                        onClick={() => { if(selectedBet) { onBet(game.id, 'spread', selectedBet, -110); onClose(); } }}
                        disabled={!selectedBet}
                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <DollarSign size={18} /> {selectedBet ? 'ADD TO CARD' : 'Select a Play above'}
                    </button>
                </div>
            </div>

            {/* --- SECTION 3: EXPERT & ANALYST INTEL BULLETS --- */}
            <div className="p-6 bg-slate-900 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <Wand2 size={20} className="text-indigo-400" />
                        <h3 className="font-bold text-white text-base">Expert & Analyst Intel</h3>
                    </div>
                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                        {hasExpertPicks ? expertData.expertPicks.spread.length + expertData.expertPicks.total.length : 0} Expert Picks • {matchupIntelBullets.length} Intel Bullets
                    </span>
                </div>

                {/* A. TRACKED EXPERT PICKS */}
                {hasExpertPicks && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Award size={14} /> Tracked Expert Picks & Rationale
                        </h4>
                        <div className="grid gap-4">
                            {[...expertData.expertPicks.spread, ...expertData.expertPicks.total].map((pick, i) => (
                                <PickItem key={i} pick={pick} />
                            ))}
                        </div>
                    </div>
                )}

                {/* B. MATCHUP INTEL BULLETS */}
                {matchupIntelBullets.length > 0 ? (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-[#00d2be] uppercase tracking-wider flex items-center gap-1.5">
                            <Newspaper size={14} /> Substack, Training Camp & Secondary Intel Bullets
                        </h4>
                        <div className="grid gap-3">
                            {matchupIntelBullets.map((bullet, i) => (
                                <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <div className="flex items-center">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${bullet.badgeColor}`}>
                                                {bullet.category}
                                            </span>

                                            {/* EMR MOUSE-OVER TOOLTIP POPUP */}
                                            {bullet.category === 'Market Power Rating' && (
                                              <div className="relative group/emr inline-block ml-2 font-sans normal-case tracking-normal">
                                                <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded cursor-help">
                                                  💡 What is EMR?
                                                </span>

                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/emr:block w-72 p-3 bg-[#0c1019] text-slate-200 text-[11px] leading-snug rounded-xl border border-purple-500/50 shadow-2xl z-50 pointer-events-none text-left animate-in fade-in zoom-in-95 duration-150">
                                                  <div className="font-bold text-purple-400 mb-1 flex items-center gap-1">
                                                    📈 Estimated Market Rating (EMR)
                                                  </div>
                                                  <p className="text-slate-300 mb-1.5">
                                                    <strong>EMR</strong> is a 32-team betting power rating index created by sharp handicapper Matt Russell (THE WINDOW).
                                                  </p>
                                                  <ul className="space-y-1 text-[10px] text-slate-400">
                                                    <li>• <strong>Scale (0–100)</strong>: ~50 = League Average, 70+ = Elite Super Bowl Favorite (e.g. LAR 74).</li>
                                                    <li>• <strong>Point Spread Driver</strong>: The rating gap between two teams directly dictates lookahead point spreads.</li>
                                                    <li>• <strong>Deltas</strong>: Tracks sharp offseason betting shifts & roster impacts (e.g., Myles Garrett move).</li>
                                                  </ul>
                                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#0c1019]"></div>
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-500">{bullet.source}</span>
                                    </div>
                                    <h5 className="text-xs font-bold text-white mb-1">{bullet.title}</h5>
                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{bullet.detail}</p>
                                </div>

                            ))}
                        </div>
                    </div>
                ) : (
                    !hasExpertPicks && (
                        <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">
                            No expert commentary or research intel available for this matchup yet.
                        </div>
                    )
                )}
            </div>
        </div>
      </div>
    </div>
  );
}