import React from 'react';
import { LayoutDashboard, Trophy, Mic2, Radio, RefreshCw, Activity, ListFilter, Split, ShoppingBag, Save, UploadCloud, RotateCcw, Mic, Shield, Banknote, BarChart3, TrendingUp, Target, Briefcase, Database, Bot, MessageSquare, Layers, Zap, FileText, ShieldCheck, HeartPulse, Shirt, User, Calculator } from 'lucide-react';

import { getNFLWeekInfo } from '../../lib/constants';

export default function Header({
  activeTab,
  setActiveTab,
  cartCount,
  onSyncOdds,
  onOpenSplits,
  onOpenSplitsData,
  onOpenTeasers,
  onOpenContest,
  onOpenPredictionConverter,
  onOpenUnitCalculator,
  onImport,
  onAnalyze,
  onManage,
  onSave,
  onReset,
  onOpenStorage,
  onOpenAgentStatus,
  onOpenProfile,
}) {

  return (
    <header className="sticky top-0 z-40 bg-slate-950 shadow-2xl">

      {/* --- TOP LAYER --- */}
      <div className="border-b border-slate-800 bg-slate-950 relative z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">

            {/* LEFT: LOGO */}
            <div className="flex items-center gap-3 w-48">
                <div className="bg-gradient-to-br from-rose-600 to-purple-700 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-rose-900/20">
                    <span className="text-white font-black text-sm tracking-tighter">PR</span>
                </div>
                <div className="hidden md:block">
                    <h1 className="text-white font-black text-sm tracking-tight leading-none">PLATINUM ROSE</h1>
                    <div className="flex items-center gap-1.5 opacity-80">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[9px] font-bold text-emerald-500 tracking-wider">{getNFLWeekInfo().label} • LIVE</span>
                    </div>
                </div>
            </div>

            {/* CENTER: TOOLS */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
                <button
                    onClick={onSyncOdds}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] shadow-lg shadow-indigo-900/20 transition-all mr-2"
                >
                    <RefreshCw size={12} /> SYNC
                </button>
                <div className="h-6 w-px bg-slate-800 mx-1"></div>
                <ToolButton onClick={onOpenTeasers} icon={Split} label="Teasers" colorClass="text-purple-400" />
                <ToolButton onClick={onOpenContest} icon={ListFilter} label="Contest" colorClass="text-orange-400" />
                <ToolButton onClick={onOpenSplits} icon={Activity} label="Pulse" colorClass="text-rose-400" />
                <ToolButton onClick={onOpenSplitsData} icon={BarChart3} label="Splits" colorClass="text-cyan-400" />
                <ToolButton onClick={onOpenPredictionConverter} icon={TrendingUp} label="Kalshi/Poly" colorClass="text-emerald-400" />
                <ToolButton onClick={onOpenUnitCalculator} icon={Calculator} label="Sizing" colorClass="text-blue-400" />
            </div>

            {/* RIGHT: DATA BUTTONS */}
            <div className="flex items-center justify-end gap-2 w-auto">
                <div className="hidden md:flex items-center gap-2">
                    <IconButton onClick={onOpenProfile} icon={User} label="Profile Settings" colorClass="text-purple-400 hover:text-purple-300 hover:border-purple-500/30" />
                    <div className="h-6 w-px bg-slate-800 mx-1"></div>

                    <IconButton onClick={onManage} icon={Shield} label="Expert Mgr" colorClass="text-amber-400 hover:text-amber-300 hover:border-amber-500/30" />
                    <IconButton onClick={onAnalyze} icon={Mic} label="AI Transcript" colorClass="text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/30" />
                    <IconButton onClick={onImport} icon={UploadCloud} label="Bulk Import" colorClass="text-blue-400 hover:text-blue-300 hover:border-blue-500/30" />
                    <div className="h-6 w-px bg-slate-800 mx-1"></div>
                    <IconButton onClick={onSave} icon={Save} label="Save Picks" colorClass="text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30" />
                    <IconButton onClick={onReset} icon={RotateCcw} label="Reset Card" colorClass="text-rose-400 hover:text-rose-300 hover:border-rose-500/30" />
                    <div className="h-6 w-px bg-slate-800 mx-1"></div>
                    <IconButton onClick={onOpenStorage} icon={Database} label="Data Manager" colorClass="text-[#00d2be] hover:text-white hover:border-[#00d2be]/30" />
                    <IconButton onClick={onOpenAgentStatus} icon={Bot} label="Agent Status" colorClass="text-purple-400 hover:text-purple-300 hover:border-purple-500/30" />
                </div>
            </div>
        </div>
      </div>


      {/* --- BOTTOM LAYER: NAVIGATION --- */}
      <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-2 h-11 flex items-center justify-around gap-1 overflow-x-auto">
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="dashboard" label="Dashboard & Games" icon={LayoutDashboard} />
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="official-picks" label="Picks & Inbox" icon={ShieldCheck} />
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="intel" label="AI Intel & Command" icon={Bot} />
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="fantasy" label="Fantasy & Props" icon={Shirt} />
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="injuries" label="Injuries & Availability" icon={HeartPulse} />
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="futures" label="Bankroll & Futures" icon={Briefcase} />
        </div>

      </div>

      {/* --- DISCLAIMER STRIP --- */}
      <div className="bg-slate-950 border-b border-slate-900/60 py-0.5 text-center">
        <span className="text-[9px] text-slate-600 font-mono tracking-wider">
          For entertainment only — not financial advice. Must be 21+ to wager. Please gamble responsibly.
        </span>
      </div>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 p-2 z-50 flex justify-around pb-safe">
          <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-500'}`}><LayoutDashboard size={20}/><span className="text-[10px] font-bold">Board</span></button>
          <button onClick={() => setActiveTab('mycard')} className={`p-2 rounded-lg flex flex-col items-center gap-1 relative ${activeTab === 'mycard' ? 'text-emerald-400' : 'text-slate-500'}`}><ShoppingBag size={20}/>{cartCount > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>}<span className="text-[10px] font-bold">Card</span></button>
          <button onClick={() => setActiveTab('bankroll')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'bankroll' ? 'text-emerald-400' : 'text-slate-500'}`}><Banknote size={20}/><span className="text-[10px] font-bold">Bankroll</span></button>
          <button onClick={() => setActiveTab('odds')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'odds' ? 'text-emerald-400' : 'text-slate-500'}`}><TrendingUp size={20}/><span className="text-[10px] font-bold">Odds</span></button>
          <button onClick={() => setActiveTab('analytics')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'analytics' ? 'text-emerald-400' : 'text-slate-500'}`}><BarChart3 size={20}/><span className="text-[10px] font-bold">Analytics</span></button>
          <button onClick={onAnalyze} className="p-2 rounded-lg flex flex-col items-center gap-1 text-indigo-500"><Mic size={20}/><span className="text-[10px] font-bold">Record</span></button>
      </div>
    </header>
  );
}

function NavTab({ activeTab, setActiveTab, cartCount, id, label, icon: Icon }) {
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative h-full px-3 flex items-center gap-1.5 font-bold text-[11px] whitespace-nowrap transition-all border-b-2 ${
        activeTab === id
        ? 'border-emerald-500 text-white'
        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={14} className={activeTab === id ? "text-emerald-400" : ""} />
      {label}
      {id === 'mycard' && cartCount > 0 && (
          <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1 shadow-sm shadow-emerald-500/50">
              {cartCount}
          </span>
      )}
    </button>
  );
}

function ToolButton({ onClick, icon: Icon, label, colorClass }) {
  return (
      <button
        onClick={onClick}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all ${colorClass}`}
      >
          <Icon size={14} />
          <span className="text-xs font-bold">{label}</span>
      </button>
  );
}

function IconButton({ onClick, icon: Icon, label, colorClass = "text-slate-400 hover:text-white" }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all group relative ${colorClass}`}
      title={label}
    >
        <Icon size={16} />
        <span className="absolute -bottom-10 right-0 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50 border border-slate-800">
            {label}
        </span>
    </button>
  );
}
