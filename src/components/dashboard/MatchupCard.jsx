// File: src/components/dashboard/MatchupCard.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  TrendingUp, Activity, Trophy, ExternalLink, List, Calculator, Cloud,
  Sun, Umbrella, Snowflake, Wind, ChevronRight, X, Thermometer, Split,
  User, CheckCircle, AlertTriangle, DollarSign, Shield
} from 'lucide-react';

import { InjurySummary, InjuryImpactIcon } from '../ui/InjuryBadge';
import { getTopInjuries, getInjuryDataSourceState } from '../../lib/injuries';
import { TEAM_LOGOS } from '../../lib/teams';
import { getContractForGame, getContractsForTeam } from '../../lib/predictionMarketStore';
import { getSecondaryMatchupsForGame } from '../../lib/secondaryMatchupStore';

const clean = (val) => parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
const getAbbr = (name) => {
    if (!name) return "UNK";
    return name.substring(0, 3).toUpperCase();
};
const STADIUM_DATA = { "Cardinals": { type: "Dome", lat: 33.5276, long: -112.2626 }, "Arizona": { type: "Dome", lat: 33.5276, long: -112.2626 }, "Falcons": { type: "Dome", lat: 33.7554, long: -84.4010 }, "Atlanta": { type: "Dome", lat: 33.7554, long: -84.4010 }, "Ravens": { type: "Open", lat: 39.2780, long: -76.6227 }, "Baltimore": { type: "Open", lat: 39.2780, long: -76.6227 }, "Bills": { type: "Open", lat: 42.7738, long: -78.7870 }, "Buffalo": { type: "Open", lat: 42.7738, long: -78.7870 }, "Panthers": { type: "Open", lat: 35.2258, long: -80.8528 }, "Carolina": { type: "Open", lat: 35.2258, long: -80.8528 }, "Bears": { type: "Open", lat: 41.8623, long: -87.6167 }, "Chicago": { type: "Open", lat: 41.8623, long: -87.6167 }, "Bengals": { type: "Open", lat: 39.0955, long: -84.5161 }, "Cincinnati": { type: "Open", lat: 39.0955, long: -84.5161 }, "Browns": { type: "Open", lat: 41.5061, long: -81.6995 }, "Cleveland": { type: "Open", lat: 41.5061, long: -81.6995 }, "Cowboys": { type: "Dome", lat: 32.7473, long: -97.0945 }, "Dallas": { type: "Dome", lat: 32.7473, long: -97.0945 }, "Broncos": { type: "Open", lat: 39.7439, long: -105.0201 }, "Denver": { type: "Open", lat: 39.7439, long: -105.0201 }, "Lions": { type: "Dome", lat: 42.3400, long: -83.0456 }, "Detroit": { type: "Dome", lat: 42.3400, long: -83.0456 }, "Packers": { type: "Open", lat: 44.5013, long: -88.0622 }, "Green Bay": { type: "Open", lat: 44.5013, long: -88.0622 }, "Texans": { type: "Dome", lat: 29.6847, long: -95.4107 }, "Houston": { type: "Dome", lat: 29.6847, long: -95.4107 }, "Colts": { type: "Dome", lat: 39.7601, long: -86.1639 }, "Indianapolis": { type: "Dome", lat: 39.7601, long: -86.1639 }, "Jaguars": { type: "Open", lat: 30.3240, long: -81.6373 }, "Jacksonville": { type: "Open", lat: 30.3240, long: -81.6373 }, "Chiefs": { type: "Open", lat: 39.0489, long: -94.4839 }, "Kansas City": { type: "Open", lat: 39.0489, long: -94.4839 }, "Raiders": { type: "Dome", lat: 36.0909, long: -115.1833 }, "Las Vegas": { type: "Dome", lat: 36.0909, long: -115.1833 }, "Chargers": { type: "Dome", lat: 33.9534, long: -118.3390 }, "Los Angeles": { type: "Dome", lat: 33.9534, long: -118.3390 }, "Rams": { type: "Dome", lat: 33.9534, long: -118.3390 }, "Dolphins": { type: "Open", lat: 25.9580, long: -80.2389 }, "Miami": { type: "Open", lat: 25.9580, long: -80.2389 }, "Vikings": { type: "Dome", lat: 44.9735, long: -93.2575 }, "Minnesota": { type: "Dome", lat: 44.9735, long: -93.2575 }, "Patriots": { type: "Open", lat: 42.0909, long: -71.2643 }, "New England": { type: "Open", lat: 42.0909, long: -71.2643 }, "Saints": { type: "Dome", lat: 29.9511, long: -90.0812 }, "New Orleans": { type: "Dome", lat: 29.9511, long: -90.0812 }, "Giants": { type: "Open", lat: 40.8135, long: -74.0745 }, "New York": { type: "Open", lat: 40.8135, long: -74.0745 }, "Jets": { type: "Open", lat: 40.8135, long: -74.0745 }, "Eagles": { type: "Open", lat: 39.9008, long: -75.1675 }, "Philadelphia": { type: "Open", lat: 39.9008, long: -75.1675 }, "Steelers": { type: "Open", lat: 40.4468, long: -80.0158 }, "Pittsburgh": { type: "Open", lat: 40.4468, long: -80.0158 }, "49ers": { type: "Open", lat: 37.4014, long: -121.9695 }, "San Francisco": { type: "Open", lat: 37.4014, long: -121.9695 }, "Seahawks": { type: "Open", lat: 47.5952, long: -122.3316 }, "Seattle": { type: "Open", lat: 47.5952, long: -122.3316 }, "Buccaneers": { type: "Open", lat: 27.9759, long: -82.5033 }, "Tampa Bay": { type: "Open", lat: 27.9759, long: -82.5033 }, "Titans": { type: "Open", lat: 36.1665, long: -86.7713 }, "Tennessee": { type: "Open", lat: 36.1665, long: -86.7713 }, "Commanders": { type: "Open", lat: 38.9076, long: -76.8645 }, "Washington": { type: "Open", lat: 38.9076, long: -76.8645 } };

const MatchupCard = ({ game, onPlaceBet, onShowHistory, onAnalyze, onShowInjuries, onAddBankrollBet, experts, myBets = [], simData }) => {
  const [showPicks, setShowPicks] = useState(false);
  const [showMoneyline, setShowMoneyline] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);

  const secMatchups = useMemo(() => getSecondaryMatchupsForGame(game.visitor, game.home), [game.visitor, game.home]);

  const formatLine = (val) => { if(!val && val !== 0) return '-'; return val > 0 ? `+${val}` : val; };
  const formatGameTime = (dateStr) => { if (!dateStr) return 'TBD'; const date = new Date(dateStr); if (isNaN(date.getTime())) return 'TBD'; return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long', hour: 'numeric', minute: '2-digit', }).format(date); };
  const isSelected = (type, side) => { const betId = `${game.id}-${type}-${side}-std`; return myBets.some(b => b.uniqueKey === betId); };

  // F-27c — flag when a team's injury badges came from the mock fallback
  // (ESPN feed unavailable for that team) instead of a live report.
  const injurySourceState = useMemo(() => getInjuryDataSourceState(), [game.injuries]); // eslint-disable-line react-hooks/exhaustive-deps
  const visitorInjuryIsMock = injurySourceState.mockTeams.includes(game.visitor);
  const homeInjuryIsMock = injurySourceState.mockTeams.includes(game.home);

  const WeatherDisplay = () => {
      const [weather, setWeather] = useState(game.weather && game.weather !== 'Open Field' ? game.weather : null);
      const [loading, setLoading] = useState(false);
      const homeName = (game.home || '').toLowerCase();
      const teamKey = Object.keys(STADIUM_DATA).find(k => homeName.includes(k.toLowerCase()) || k.toLowerCase().includes(homeName));
      const stadium = teamKey ? STADIUM_DATA[teamKey] : { type: "Open", lat: 0, long: 0 };
      // Intentional mount-once fetch: stadium/weather are read from the closure
      // captured at mount, using the [] dep array on purpose so this only fires
      // once per WeatherDisplay instance. Adding stadium.*/weather as deps
      // would refire this on every weather state update it causes itself.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      useEffect(() => { if (stadium.type === "Dome" || stadium.type === "Retractable Roof") { setWeather(stadium.type); return; } if (weather || !stadium.lat) return; const fetchWeather = async () => { setLoading(true); try { const url = `https://api.open-meteo.com/v1/forecast?latitude=${stadium.lat}&longitude=${stadium.long}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`; const res = await fetch(url); const data = await res.json(); if (data.current_weather) { const { temperature, windspeed, weathercode } = data.current_weather; let cond = "Clear"; if (weathercode > 50) cond = "Rain/Snow"; else if (weathercode > 3) cond = "Cloudy"; setWeather(`${Math.round(temperature)}°F ${cond}, ${Math.round(windspeed)}mph Wind`); } } catch (_e) { setWeather("Open Field"); } finally { setLoading(false); } }; fetchWeather(); }, []);
      const getWeatherIcon = (txt) => { if (!txt) return <Cloud size={12} />; const lower = txt.toLowerCase(); if (lower.includes('snow') || lower.includes('tundra')) return <Snowflake size={12} className="text-cyan-300" />; if (lower.includes('rain') || lower.includes('shower')) return <Cloud size={12} className="text-slate-400" />; if (lower.includes('dome') || lower.includes('roof')) return <Umbrella size={12} className="text-indigo-400" />; if (lower.includes('clear') || lower.includes('sunny')) return <Sun size={12} className="text-amber-400" />; return <Wind size={12} className="text-slate-500" />; };
      return (<div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">{loading ? <Activity size={12} className="animate-spin text-slate-500" /> : getWeatherIcon(weather)}<span>{loading ? "Loading..." : (weather || "Open Field")}</span></div>);
  };

  const BetSelector = ({ type, side, baseLine }) => {
      const [isOpen, setIsOpen] = useState(false);
      const [style, setStyle] = useState({});
      const dropdownRef = useRef(null);
      useEffect(() => { const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsOpen(false); } }; const updatePos = () => { if (isOpen && dropdownRef.current) { const rect = dropdownRef.current.getBoundingClientRect(); const ladderHeight = 280; const headerHeight = 100; let top = rect.top + (rect.height / 2); if (top - (ladderHeight / 2) < headerHeight) { top = headerHeight + (ladderHeight / 2); } setStyle({ top: `${top}px`, left: `${rect.left + (rect.width / 2)}px`, transform: `translate(-50%, -50%)`, zIndex: 9999 }); } }; if (isOpen) { updatePos(); window.addEventListener('scroll', updatePos); window.addEventListener('resize', updatePos); } document.addEventListener('mousedown', handleClickOutside); return () => { document.removeEventListener('mousedown', handleClickOutside); window.removeEventListener('scroll', updatePos); window.removeEventListener('resize', updatePos); }; }, [isOpen]);
      const handleSelect = (finalLine, isMain) => { onPlaceBet(game.id, type, side, finalLine, -110, false, isMain); setIsOpen(false); };
      const isBetActive = isSelected(type, side);
      const styleClass = isBetActive ? 'bg-emerald-900/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.4)] border-emerald-400 scale-[1.02] ring-1 ring-emerald-400' : 'bg-slate-800 hover:bg-slate-700 border-slate-700/50 text-slate-500';
      const highSteps = [2.5, 2.0, 1.5, 1.0, 0.5]; const lowSteps = [-0.5, -1.0, -1.5, -2.0, -2.5];
      const formatSelectorLine = (val) => { if (type === 'total') return val; return formatLine(val); };
      return (
          <div ref={dropdownRef} className="relative w-full">
              <button onClick={() => setIsOpen(!isOpen)} className={`w-full relative flex flex-col items-center justify-center py-2 rounded border transition-all ${styleClass}`}>
                  <div className="text-[9px] uppercase font-bold leading-none mb-0.5">{type === 'spread' ? 'Spread' : 'Total'}</div>
                  <div className="font-bold text-sm text-white flex items-center gap-1">{formatSelectorLine(baseLine)}<ChevronRight size={10} className={`opacity-50 transition-transform ${isOpen ? 'rotate-90' : ''}`} /></div>
              </button>
              {isOpen && (<div className="fixed bg-slate-950 border border-slate-600 rounded-lg shadow-2xl w-24 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col" style={style}>
                      {highSteps.map(step => (<button key={`pos-${step}`} onClick={() => handleSelect(baseLine + step, false)} className="w-full text-center py-1.5 text-xs bg-slate-900 hover:bg-emerald-900/30 text-slate-300 hover:text-emerald-400 font-mono border-b border-slate-800/50">{formatSelectorLine(baseLine + step)}</button>))}
                      <button onClick={() => handleSelect(baseLine, true)} className="w-full text-center py-2 bg-indigo-900/80 hover:bg-indigo-800 text-white font-black text-sm border-y border-indigo-500/50 shadow-inner">{formatSelectorLine(baseLine)}</button>
                      {lowSteps.map(step => (<button key={`neg-${step}`} onClick={() => handleSelect(baseLine + step, false)} className="w-full text-center py-1.5 text-xs bg-slate-900 hover:bg-rose-900/30 text-slate-300 hover:text-rose-400 font-mono border-b border-slate-800/50 last:border-0">{formatSelectorLine(baseLine + step)}</button>))}
                  </div>)}
          </div>
      );
  };

  const TeaserSelector = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [style, setStyle] = useState({});
      const btnRef = useRef(null);
      const teaserLines = { home: game.spread + 6, visitor: (game.spread * -1) + 6, over: game.total - 6, under: game.total + 6 };
      useEffect(() => { const handleClickOutside = (event) => { if (btnRef.current && !btnRef.current.contains(event.target)) setIsOpen(false); }; const updatePos = () => { if (isOpen && btnRef.current) { const rect = btnRef.current.getBoundingClientRect(); setStyle({ top: `${rect.bottom + 5}px`, left: `${rect.left + (rect.width/2)}px`, transform: 'translateX(-50%)', zIndex: 9999 }); } }; if(isOpen) { updatePos(); window.addEventListener('scroll', updatePos); window.addEventListener('resize', updatePos); } document.addEventListener('mousedown', handleClickOutside); return () => { document.removeEventListener('mousedown', handleClickOutside); window.removeEventListener('scroll', updatePos); window.removeEventListener('resize', updatePos); }; }, [isOpen]);
      const placeTeaser = (type, side, line) => { onPlaceBet(game.id, type, side, line, -120, true, true); setIsOpen(false); };
      return (
          <div ref={btnRef} className="relative w-full mt-2">
              <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 border border-purple-400 text-white text-[10px] font-bold transition-all shadow-lg shadow-purple-900/50"><Split size={12} /> TEASER OPTIONS</button>
              {isOpen && (<div className="fixed bg-slate-900 border border-purple-500/50 rounded-lg shadow-2xl p-2 w-48 animate-in fade-in zoom-in-95 duration-150 z-[9999]" style={style}>
                      <div className="text-[9px] uppercase font-bold text-purple-400 mb-2 text-center tracking-wider border-b border-slate-800 pb-1">6-Point Teaser</div>
                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => placeTeaser('spread', 'visitor', teaserLines.visitor)} className="flex flex-col items-center p-1.5 bg-slate-800 hover:bg-purple-900/30 rounded border border-slate-700 hover:border-purple-500/50 transition-colors"><span className="text-[9px] text-slate-400">{game.visitor}</span><span className="text-xs font-bold text-white font-mono">+{teaserLines.visitor}</span></button>
                          <button onClick={() => placeTeaser('spread', 'home', teaserLines.home)} className="flex flex-col items-center p-1.5 bg-slate-800 hover:bg-purple-900/30 rounded border border-slate-700 hover:border-purple-500/50 transition-colors"><span className="text-[9px] text-slate-400">{game.home}</span><span className="text-xs font-bold text-white font-mono">{formatLine(teaserLines.home)}</span></button>
                          <button onClick={() => placeTeaser('total', 'over', teaserLines.over)} className="flex flex-col items-center p-1.5 bg-slate-800 hover:bg-purple-900/30 rounded border border-slate-700 hover:border-purple-500/50 transition-colors"><span className="text-[9px] text-slate-400">OVER</span><span className="text-xs font-bold text-white font-mono">{teaserLines.over}</span></button>
                          <button onClick={() => placeTeaser('total', 'under', teaserLines.under)} className="flex flex-col items-center p-1.5 bg-slate-800 hover:bg-purple-900/30 rounded border border-slate-700 hover:border-purple-500/50 transition-colors"><span className="text-[9px] text-slate-400">UNDER</span><span className="text-xs font-bold text-white font-mono">{teaserLines.under}</span></button>
                      </div>
                  </div>)}
          </div>
      );
  };

  // --- 🔥 UPDATED PROP SELECTOR UI (WITH AI APPROVAL) ---
  const PropSelector = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [style, setStyle] = useState({});
      const btnRef = useRef(null);
      const props = game.props || []; 

      useEffect(() => {
          const handleClickOutside = (event) => { if (btnRef.current && !btnRef.current.contains(event.target)) setIsOpen(false); };
          const updatePos = () => { if (isOpen && btnRef.current) { const rect = btnRef.current.getBoundingClientRect(); setStyle({ top: `${rect.bottom + 5}px`, left: `${rect.left + (rect.width/2)}px`, transform: 'translateX(-50%)', zIndex: 9999 }); } };
          if(isOpen) { updatePos(); window.addEventListener('scroll', updatePos); window.addEventListener('resize', updatePos); }
          document.addEventListener('mousedown', handleClickOutside);
          return () => { document.removeEventListener('mousedown', handleClickOutside); window.removeEventListener('scroll', updatePos); window.removeEventListener('resize', updatePos); };
      }, [isOpen]);

      const placeProp = (prop) => {
          onPlaceBet(game.id, 'prop', prop.side, prop.line, prop.odds, false, true, prop);
          setIsOpen(false);
      };

      if (!props || props.length === 0) return null;

      // Calculate if ANY prop has an edge to highlight the main button
      const hasAnyEdge = props.some(p => {
          if (!simData || !simData.stats) return false;
          const normalize = (n) => n.toLowerCase();
          const isHome = normalize(p.team || '').includes(normalize(game.home));
          const stats = isHome ? simData.stats.home : simData.stats.visitor;
          let proj = null;
          if (normalize(p.market).includes('pass')) proj = stats.pass;
          else if (normalize(p.market).includes('rush')) proj = stats.rush; 
          else if (normalize(p.market).includes('rec')) proj = stats.pass * 0.25; // Crude approx for WR1 if needed
          
          if (!proj) return false;
          const diff = proj - p.line;
          const edgePct = (Math.abs(diff) / p.line) * 100;
          return edgePct > 5.0 && ((p.side === 'Over' && diff > 0) || (p.side === 'Under' && diff < 0));
      });

      return (
          <div ref={btnRef} className="relative w-full mt-2">
              <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded border text-[10px] font-bold transition-all shadow-lg ${hasAnyEdge ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-900/50 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                  {hasAnyEdge ? <CheckCircle size={12} /> : <User size={12} />} 
                  PLAYER PROPS ({props.length})
                  {hasAnyEdge && <span className="ml-1 bg-white/20 px-1 rounded text-[9px]">EDGES FOUND</span>}
              </button>
              
              {isOpen && (
                  <div className="fixed bg-slate-900 border border-cyan-500/50 rounded-lg shadow-2xl p-2 w-72 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 z-[9999]" style={style}>
                      <div className="text-[9px] uppercase font-bold text-cyan-400 mb-2 text-center tracking-wider border-b border-slate-800 pb-1">Available Props & AI Audit</div>
                      <div className="space-y-2">
                          {props.map((prop, i) => {
                              // 🔥 AI AUDIT LOGIC
                              let aiProj = null;
                              let edgeBadge = null;
                              let diffDisplay = null;

                              if (simData && simData.stats) {
                                  const normalize = (n) => n.toLowerCase();
                                  const isHome = normalize(prop.team || '').includes(normalize(game.home));
                                  const stats = isHome ? simData.stats.home : simData.stats.visitor;
                                  
                                  // Map Market to Stat
                                  if (normalize(prop.market).includes('pass')) aiProj = stats.pass;
                                  else if (normalize(prop.market).includes('rush')) aiProj = stats.rush; 
                                  // Can extend to Receiving if we add WR specific logic later
                              }

                              if (aiProj) {
                                  const diff = aiProj - prop.line; // Positive = Over is good, Negative = Under is good
                                  const diffPct = (Math.abs(diff) / prop.line) * 100;
                                  
                                  // Determine Approval
                                  const isOverApproved = prop.side === 'Over' && diff > 0 && diffPct > 5.0;
                                  const isUnderApproved = prop.side === 'Under' && diff < 0 && diffPct > 5.0;
                                  const isApproved = isOverApproved || isUnderApproved;

                                  const sign = diff > 0 ? '+' : '';
                                  diffDisplay = (
                                      <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                          Proj: <span className="text-white font-bold">{aiProj}</span> 
                                          <span className={diff > 0 ? 'text-emerald-400 ml-1' : 'text-rose-400 ml-1'}>
                                              ({sign}{diff.toFixed(1)} / {diffPct.toFixed(1)}%)
                                          </span>
                                      </div>
                                  );

                                  if (isApproved) {
                                      edgeBadge = (
                                          <div className="absolute right-2 top-2 flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide">
                                              <CheckCircle size={8} /> AI Approved
                                          </div>
                                      );
                                  } else if (diffPct > 20 && !isApproved) {
                                       // If huge edge but wrong side selected (e.g. User looking at Over, but AI says HUGE Under)
                                       edgeBadge = (
                                          <div className="absolute right-2 top-2 flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide">
                                              <AlertTriangle size={8} /> Fade Risk
                                          </div>
                                      );
                                  }
                              }

                              return (
                                  <button key={i} onClick={() => placeProp(prop)} className="w-full relative flex justify-between items-center p-3 bg-slate-800 hover:bg-cyan-900/20 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-all text-left group">
                                      <div>
                                          <div className="text-xs font-bold text-white flex items-center gap-2">
                                              {prop.player}
                                          </div>
                                          <div className="text-[10px] text-slate-500">{prop.market}</div>
                                          {diffDisplay}
                                      </div>
                                      
                                      <div className="text-right mt-4">
                                          <div className="text-xs font-mono font-bold text-cyan-300">{prop.side} {prop.line}</div>
                                          <div className="text-[10px] text-slate-500">{prop.odds > 0 ? `+${prop.odds}` : prop.odds}</div>
                                      </div>
                                      {edgeBadge}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  // --- CONSENSUS/BADGES LOGIC (Rest of existing code) ---
  const spreadPicks = game.consensus?.expertPicks?.spread || [];
  const totalPicks = game.consensus?.expertPicks?.total || [];
  const allPicks = [...spreadPicks, ...totalPicks];
  const homePicks = spreadPicks.filter(p => p.pick.includes(game.home)).length;
  const visPicks = spreadPicks.filter(p => p.pick.includes(game.visitor)).length;
  const totalSpread = homePicks + visPicks;
  const hPct = totalSpread ? Math.round((homePicks / totalSpread) * 100) : 50;
  const vPct = totalSpread ? Math.round((visPicks / totalSpread) * 100) : 50;
  const overPicks = totalPicks.filter(p => p.pick.toLowerCase().includes('over')).length;
  const underPicks = totalPicks.filter(p => p.pick.toLowerCase().includes('under')).length;
  const totalTotal = overPicks + underPicks;
  const oPct = totalTotal ? Math.round((overPicks / totalTotal) * 100) : 50;
  const uPct = totalTotal ? Math.round((underPicks / totalTotal) * 100) : 50;

  const getBadges = () => {
      const badges = [];
      const ats = game.splits?.ats || {};
      const tot = game.splits?.total || {};

      if (ats.visitorTicket || ats.homeTicket) {
          const vTix = clean(ats.visitorTicket); const hTix = clean(ats.homeTicket);
          const vCash = clean(ats.visitorMoney); const hCash = clean(ats.homeMoney);
          const hLine = formatLine(game.spread); const vLine = formatLine(game.spread * -1);

          if ((vCash - vTix) >= 10) badges.push({ type: 'SHARP', text: `${game.visitor} ${vLine}`, color: 'bg-emerald-500 text-slate-950 border-emerald-400' });
          if ((hCash - hTix) >= 10) badges.push({ type: 'SHARP', text: `${game.home} ${hLine}`, color: 'bg-emerald-500 text-slate-950 border-emerald-400' });
          if (vTix >= 60) badges.push({ type: 'PUBLIC', text: `${game.visitor} ${vLine}`, color: 'bg-blue-600 text-white border-blue-400' });
          if (hTix >= 60) badges.push({ type: 'PUBLIC', text: `${game.home} ${hLine}`, color: 'bg-blue-600 text-white border-blue-400' });
      }
      if (tot.overTicket || tot.underTicket) {
          const oTix = clean(tot.overTicket); const uTix = clean(tot.underTicket);
          const oCash = clean(tot.overMoney); const uCash = clean(tot.underMoney);
          if ((oCash - oTix) >= 10) badges.push({ type: 'SHARP', text: `Over ${game.total}`, color: 'bg-emerald-500 text-slate-950 border-emerald-400' });
          if ((uCash - uTix) >= 10) badges.push({ type: 'SHARP', text: `Under ${game.total}`, color: 'bg-emerald-500 text-slate-950 border-emerald-400' });
      }
      
      if (simData) {
          if (parseFloat(simData.homeCoverPct) >= 55) {
              const line = game.spread;
              const formatted = line > 0 ? `+${line}` : line;
              badges.push({ type: 'AI MODEL', text: `${game.home} ${formatted}`, color: 'bg-purple-600 text-white border-purple-400' });
          } else if (parseFloat(simData.visCoverPct) >= 55) {
              const line = game.spread * -1;
              const formatted = line > 0 ? `+${line}` : line;
              badges.push({ type: 'AI MODEL', text: `${game.visitor} ${formatted}`, color: 'bg-purple-600 text-white border-purple-400' });
          }
          
          if (parseFloat(simData.overPct) >= 55) {
              badges.push({ type: 'AI MODEL', text: `OVER ${game.total}`, color: 'bg-purple-900/50 text-purple-200 border-purple-500' });
          } else if (parseFloat(simData.underPct) >= 55) {
              badges.push({ type: 'AI MODEL', text: `UNDER ${game.total}`, color: 'bg-purple-900/50 text-purple-200 border-purple-500' });
          }
      }

      const edge = game.edge || 0;
      if (edge >= 0.5) {
          let styleClass = '';
          if (edge >= 3.0) {
              styleClass = 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black border-yellow-300 shadow-md shadow-amber-500/20';
          } else if (edge >= 1.5) {
              styleClass = 'bg-amber-600 text-white font-bold border-amber-400';
          } else {
              styleClass = 'bg-amber-900/40 text-amber-300 font-bold border-amber-500/40';
          }
          badges.push({
              type: 'EDGE',
              text: `+${edge.toFixed(1)} Value`,
              color: styleClass,
              icon: <Trophy size={10} className="mr-1" />
          });
      }
      return badges;
  };
  
  const activeBadges = getBadges(); 

  const renderEdgeBadge = (side) => {
      if (game.edgeSide !== side || !game.edge || game.edge < 0.5) return null;
      let colorClass = 'bg-amber-900/40 text-amber-300 border-amber-500/40'; 
      if (game.edge >= 3.0) colorClass = 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-yellow-300 shadow-amber-500/40 animate-pulse';
      else if (game.edge >= 1.5) colorClass = 'bg-amber-600 text-white border-amber-400';
      return (
          <div className={`absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shadow-lg z-10 ${colorClass}`}>
             <Trophy size={10} className="inline mb-0.5 mr-1" /> +{game.edge.toFixed(1)} Edge
          </div>
      );
  };

  return (
    <div className="relative p-4 rounded-xl border transition-all duration-300 group bg-slate-900/50 border-slate-800 hover:border-slate-700">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4 text-[11px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>{formatGameTime(game.commence_time)} PT</span>
            {secMatchups && secMatchups.maxSeverity >= 2 && (
              <div className="relative group/sec font-sans normal-case tracking-normal">
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold cursor-help">
                  <Shield size={11} className="text-amber-400 shrink-0" /> SEC MISMATCH
                </div>
                
                {/* MOUSE-OVER TOOLTIP POPUP */}
                <div className="absolute top-full mt-1.5 left-0 hidden group-hover/sec:block w-64 p-2.5 bg-[#0c1019] text-slate-200 text-[11px] leading-normal rounded-xl border border-amber-500/40 shadow-2xl z-50 pointer-events-none text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="font-bold text-amber-400 flex items-center gap-1 mb-1">
                    <Shield size={12} /> Secondary Vulnerability Target
                  </div>
                  <div>
                    {secMatchups.visOffVsHomeDef?.vulnerability_tier === 'high' ? (
                      <p>• <strong>{game.visitor} Passing Attack</strong> has strong OVER & WR receiving prop signals against {game.home}'s secondary.</p>
                    ) : secMatchups.homeOffVsVisDef?.vulnerability_tier === 'high' ? (
                      <p>• <strong>{game.home} Passing Attack</strong> has strong OVER & WR receiving prop signals against {game.visitor}'s secondary.</p>
                    ) : (
                      <p>• Pass-defense mismatch detected for {game.visitor} vs {game.home}. High OVER & WR receiving prop signals.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <WeatherDisplay />
      </div>


      {/* MATCHUP ROW */}
      <div className="flex items-start justify-between mb-6">
        
        {/* VISITOR */}
        <div className="flex-1 flex flex-col items-center text-center gap-2 relative">
            {renderEdgeBadge('visitor')}
            <div className="w-14 h-14 bg-white/5 rounded-full p-2 flex items-center justify-center shadow-lg border border-white/5">
                {TEAM_LOGOS[game.visitor] ? <img src={TEAM_LOGOS[game.visitor]} alt={game.visitor} className="w-full h-full object-contain" /> : <span className="text-xl font-bold text-slate-500">{game.visitor.substring(0,2)}</span>}
            </div>
            <div>
                <div className="font-black text-lg text-white leading-none tracking-tight">{game.visitor}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">{game.visitorRecord || '(0-0)'}</div>
                {/* Injury Summary */}
                <div className="mt-1 flex items-center justify-center gap-1">
                    <InjurySummary
                        injuries={getTopInjuries(game.injuries?.visitor || [], 2)}
                        teamAbbrev={game.visitor}
                        maxDisplay={2}
                        onClick={onShowInjuries}
                    />
                    {visitorInjuryIsMock && (
                        <AlertTriangle
                            size={10}
                            className="text-amber-400 shrink-0"
                            title="Simulated injury data — ESPN's live feed was unavailable for this team"
                        />
                    )}
                </div>
            </div>
            <button onClick={() => onPlaceBet(game.id, 'moneyline', 'visitor', game.visitor_ml)} className={`mt-1 px-3 py-1 rounded-full text-[10px] transition-all font-bold border ${isSelected('moneyline', 'visitor') ? 'bg-emerald-900/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'}`}>
                ML {formatLine(game.visitor_ml)}
            </button>
        </div>

        {/* CENTER ODDS */}
        <div className="flex-[1.2] flex flex-col justify-center gap-2 px-2 mt-2">
            {/* SPREAD ROW */}
            <div className="grid grid-cols-2 gap-2 relative z-20">
                <BetSelector type="spread" side="visitor" baseLine={game.spread * -1} />
                <BetSelector type="spread" side="home" baseLine={game.spread} />
            </div>
            {/* TOTAL ROW */}
            <div className="grid grid-cols-2 gap-2 relative z-10">
                <BetSelector type="total" side="over" baseLine={game.total} />
                <BetSelector type="total" side="under" baseLine={game.total} />
            </div>
            {/* TEASER BUTTON */}
            <TeaserSelector />
            {/* 🔥 NEW PROP BUTTON */}
            <PropSelector />
            {/* 📊 PREDICTION MARKET BADGE */}
            {(() => {
              const contract = getContractForGame(game.visitor, game.home) || getContractsForTeam(game.home)[0];
              if (!contract) return null;
              const netOddsStr = contract.net_american_odds > 0 ? `+${contract.net_american_odds}` : `${contract.net_american_odds}`;
              return (
                <div className="mt-2 text-center bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-1.5 flex items-center justify-between text-[10px] shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 font-bold uppercase">[{contract.exchange}]</span>
                    <span className="text-slate-300 truncate max-w-[110px]" title={contract.title}>{contract.title}</span>
                  </div>
                  <div className="font-mono text-emerald-300 font-bold">
                    {contract.price_cents}¢ ({netOddsStr})
                  </div>
                </div>
              );
            })()}
        </div>

        {/* HOME */}
        <div className="flex-1 flex flex-col items-center text-center gap-2 relative">
             {renderEdgeBadge('home')}
            <div className="w-14 h-14 bg-white/5 rounded-full p-2 flex items-center justify-center shadow-lg border border-white/5">
                {TEAM_LOGOS[game.home] ? <img src={TEAM_LOGOS[game.home]} alt={game.home} className="w-full h-full object-contain" /> : <span className="text-xl font-bold text-slate-500">{game.home.substring(0,2)}</span>}
            </div>
            <div>
                <div className="font-black text-lg text-white leading-none tracking-tight">{game.home}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">{game.homeRecord || '(0-0)'}</div>
                {/* Injury Summary */}
                <div className="mt-1 flex items-center justify-center gap-1">
                    <InjurySummary
                        injuries={getTopInjuries(game.injuries?.home || [], 2)}
                        teamAbbrev={game.home}
                        maxDisplay={2}
                        onClick={onShowInjuries}
                    />
                    {homeInjuryIsMock && (
                        <AlertTriangle
                            size={10}
                            className="text-amber-400 shrink-0"
                            title="Simulated injury data — ESPN's live feed was unavailable for this team"
                        />
                    )}
                </div>
            </div>
            <button onClick={() => onPlaceBet(game.id, 'moneyline', 'home', game.home_ml)} className={`mt-1 px-3 py-1 rounded-full text-[10px] transition-all font-bold border ${isSelected('moneyline', 'home') ? 'bg-emerald-900/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'}`}>
                ML {formatLine(game.home_ml)}
            </button>
        </div>
      </div>

      {/* --- CONSENSUS BARS & BADGES & FOOTER (Keep Existing) --- */}
      <div className="space-y-3 mb-4">
        {/* SPREAD */}
        <div>
            <div className="flex justify-between text-[9px] text-slate-500 mb-1 font-bold uppercase tracking-wider"><span>Spread Consensus (Experts)</span></div>
            <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${vPct}%` }}></div>
                <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${hPct}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-medium"><span>{vPct}% {game.visitor}</span><span>{hPct}% {game.home}</span></div>
        </div>
        {/* TOTAL */}
        <div>
             <div className="flex justify-between text-[9px] text-slate-500 mb-1 font-bold uppercase tracking-wider"><span>Total Consensus ({game.total} Pts)</span></div>
            <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                 <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${oPct}%` }}></div>
                 <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${uPct}%` }}></div>
            </div>
             <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-medium"><span>{oPct}% Over</span><span>{uPct}% Under</span></div>
        </div>
        {/* MONEYLINE */}
        <div>
             <button onClick={() => setShowMoneyline(!showMoneyline)} className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider hover:text-white mb-1 transition-colors"><Calculator size={10} /> {showMoneyline ? "Hide Implied Probability" : "Show Implied Probability"}</button>
             {showMoneyline && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden flex opacity-80">
                        <div className="h-full bg-violet-600 transition-all duration-500" style={{ width: `${vPct}%` }}></div>
                        <div className="h-full bg-lime-400 transition-all duration-500" style={{ width: `${hPct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-medium"><span className="text-violet-400">{vPct}% {game.visitor}</span><span className="text-lime-400">{hPct}% {game.home}</span></div>
                </div>
             )}
        </div>
      </div>

      {(activeBadges.length > 0 || game.teaser) && (
          <div className="mb-4 flex flex-wrap gap-2">
              {game.teaser && <div className="flex items-center gap-2 px-2 py-1 bg-purple-900/40 border border-purple-500/40 rounded text-[10px] font-bold text-purple-200 shadow-sm"><List size={12} /> Wong Teaser: {game.teaserSide}</div>}
              {activeBadges.map((badge, idx) => (<div key={idx} className={`px-2 py-1 rounded text-[10px] font-bold border shadow-sm ${badge.color}`}>{badge.type}: {badge.text}</div>))}
          </div>
      )}

      {/* SECONDARY MATCHUP VULNERABILITY BADGE & DRAWER */}
      {secMatchups && (secMatchups.maxTier === 'high' || secMatchups.maxTier === 'medium' || secMatchups.hasAbsences) && (
        <div className="mb-4">
          <button
            onClick={() => setShowSecondary(!showSecondary)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              secMatchups.maxTier === 'high'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/40'
                : secMatchups.maxTier === 'medium'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/40'
                : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🛡️</span>
              <span>SEC MISMATCH: {secMatchups.maxTier.toUpperCase()} ({secMatchups.maxSeverity.toFixed(1)})</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              {showSecondary ? 'Hide Details ▲' : 'View Scheme & Absences ▼'}
            </span>
          </button>

          {showSecondary && (
            <div className="mt-2 bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-3 text-xs animate-in fade-in duration-150">
              {secMatchups.visOffVsHomeDef && (
                <div>
                  <div className="font-bold text-slate-300 flex justify-between border-b border-slate-800 pb-1 mb-1">
                    <span>{game.visitor} Offense vs {game.home} Defense</span>
                    <span className="text-emerald-400 font-mono capitalize">{secMatchups.visOffVsHomeDef.coverage_scheme?.primary_coverage_family || 'Standard'}</span>
                  </div>
                  {secMatchups.visOffVsHomeDef.secondary_absences?.map((abs, i) => (
                    <div key={i} className="text-rose-400 text-[11px] font-mono">
                      ⚠ {abs.player_name} ({abs.position}) — {abs.event_type.toUpperCase()}
                    </div>
                  ))}
                  {secMatchups.visOffVsHomeDef.target_receivers?.slice(0, 2).map((rec, i) => (
                    <div key={i} className="text-emerald-300 text-[11px] flex justify-between">
                      <span>🚀 {rec.player_name} ({rec.notes || 'WR'})</span>
                      <span className="font-mono">Opp Score: {rec.opportunity_score}</span>
                    </div>
                  ))}
                </div>
              )}

              {secMatchups.homeOffVsVisDef && (
                <div>
                  <div className="font-bold text-slate-300 flex justify-between border-b border-slate-800 pb-1 mb-1">
                    <span>{game.home} Offense vs {game.visitor} Defense</span>
                    <span className="text-emerald-400 font-mono capitalize">{secMatchups.homeOffVsVisDef.coverage_scheme?.primary_coverage_family || 'Standard'}</span>
                  </div>
                  {secMatchups.homeOffVsVisDef.secondary_absences?.map((abs, i) => (
                    <div key={i} className="text-rose-400 text-[11px] font-mono">
                      ⚠ {abs.player_name} ({abs.position}) — {abs.event_type.toUpperCase()}
                    </div>
                  ))}
                  {secMatchups.homeOffVsVisDef.target_receivers?.slice(0, 2).map((rec, i) => (
                    <div key={i} className="text-emerald-300 text-[11px] flex justify-between text-slate-300 font-mono">
                      <span>🚀 {rec.player_name} ({rec.notes || 'WR'})</span>
                      <span className="font-mono">Opp Score: {rec.opportunity_score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {allPicks.length > 0 && (
        <div className="space-y-1 mb-4">
            {allPicks.slice(0, showPicks ? 99 : 2).map((pick, idx) => (
                 <div key={idx} className="flex justify-between items-center px-2 py-1.5 bg-slate-800/30 rounded text-xs border border-transparent hover:border-slate-700 transition-colors">
                    <span className="font-bold text-slate-400">{experts.find(e => e.id === pick.expertId)?.name || 'Unknown'}</span>
                    <div className="flex items-center gap-2"><span className={`px-1.5 py-px rounded text-[10px] font-bold ${pick.pickType === 'BEST BET' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 bg-slate-700'}`}>{pick.pickType}</span><span className="font-mono text-slate-200">{pick.pick} {pick.line && <span className="ml-1.5 text-emerald-400 font-bold">{pick.line}</span>}</span></div>
                 </div>
            ))}
            {allPicks.length > 2 && <button onClick={() => setShowPicks(!showPicks)} className="w-full text-center text-[10px] text-slate-500 hover:text-white mt-2 transition-colors">{showPicks ? 'Show Less' : `Show ${allPicks.length - 2} More Picks`}</button>}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-auto">
            {game.contestLine ? (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Trophy size={14} className="text-amber-500" /> Contest: <span className="text-white ml-1">{getAbbr(game.contestTeam)} {game.contestLine > 0 ? `+${game.contestLine}` : game.contestLine}</span></div>
            ) : (
                <button onClick={() => onShowHistory(game)} className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors text-xs"><Activity size={14} /> <span className="font-medium">Line History</span></button>
            )}
            <div className="flex gap-2">
                {onAddBankrollBet && (
                    <button 
                        onClick={() => onAddBankrollBet(game)} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white transition-all text-xs font-bold border border-emerald-600"
                    >
                        <DollarSign size={12} /> 
                        Bankroll
                    </button>
                )}
                <button onClick={() => onAnalyze(game)} className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-xs font-bold border border-slate-700"><Trophy size={12} className="text-amber-500" /> Analyze Matchup</button>
            </div>
      </div>
    </div>
  );
};

export default MatchupCard;