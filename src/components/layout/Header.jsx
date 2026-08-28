import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Trophy, Mic2, Radio, RefreshCw, Activity, ShoppingBag, Save, UploadCloud, RotateCcw, Mic, Shield, Banknote, BarChart3, TrendingUp, Target, Briefcase, Database, Bot, MessageSquare, Layers, Zap, FileText, ShieldCheck, HeartPulse, Shirt, User, Menu } from 'lucide-react';

import { getNFLWeekInfo } from '../../lib/constants';

export default function Header({
  activeTab,
  setActiveTab,
  cartCount,
  onSyncOdds,
  onOpenSplits,
  onOpenSplitsData,
  onOpenSuperContest,
  onOpenCard,
  onImport,
  onAnalyze,
  onManage,
  onSave,
  onReset,
  onOpenStorage,
  onOpenAgentStatus,
  onOpenProfile,
  profileCanUseAI = true,
  profileCanAccessOwnerPortfolio = true,
  profileCanUseLocalTracking = true,
  // Real Profile personalization (Phase 0): array of hub ids the active
  // profile cares about. undefined/null means "no personalization active"
  // -- every nav tab stays fully visible (matches pre-wiring behavior).
  visibleHubs,
}) {

  return (
    <header className="sticky top-0 z-40 bg-slate-950 shadow-2xl">

      {/* --- TOP LAYER --- */}
      <div className="border-b border-slate-800 bg-slate-950 relative z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">

            {/* LEFT: LOGO */}
            <div className="flex items-center gap-3 w-48 flex-shrink-0">
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

            {/* CENTER: TOOLS
                Root-cause fix (2026-08-24): this used to be `absolute
                left-1/2 -translate-x-1/2`, centered on the FULL row
                regardless of how wide the flanking logo/icon clusters
                were -- the original bug Andy reported (buttons
                overlapping at every desktop width, since the row caps
                at max-w-7xl). Promoting SuperContest/Pulse today made
                this cluster wider and reproduced that exact overlap
                against the Profile Settings icon. Real fix: this is now
                a normal flex child taking the remaining space between
                the fixed-width left/right clusters (flex-1, min-w-0)
                and centering its own content within THAT space instead
                of the whole row -- flex siblings can't overlap by
                construction. overflow-x-auto is a safety net so a
                still-too-narrow width scrolls instead of overlapping. */}
            <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 justify-center overflow-x-auto">
                <button
                    onClick={onSyncOdds}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] shadow-lg shadow-indigo-900/20 transition-all mr-2"
                >
                    <RefreshCw size={12} /> SYNC
                </button>
                <div className="h-6 w-px bg-slate-800 mx-1"></div>

                {/* Pulse + SuperContest: promoted out of the flat Tools row per
                    Andy's 2026-08-24 decision -- both are visited deeply/daily.
                    Teasers/Kalshi-Poly/Sizing were relocated OUT of the header
                    entirely in the 2026-08-24 full-redesign pass (Teasers ->
                    passive MatchupCard badge, Kalshi/Poly -> inline card
                    callout, Sizing -> backend-only + reference section) --
                    see nfl_dashboard_header_ux_redesign.md. Splits stays here
                    for now (standalone deep-dive view is still useful
                    alongside the new ambient splits bars on the cards). */}
                {profileCanAccessOwnerPortfolio && <PromotedToolButton onClick={onOpenSuperContest} icon={Trophy} label="SuperContest" colorClass="text-orange-400" glowClass="shadow-orange-900/20" />}
                <PromotedToolButton onClick={onOpenSplits} icon={Activity} label="Pulse" colorClass="text-rose-400" glowClass="shadow-rose-900/20" />
                {profileCanUseLocalTracking && <PromotedToolButton onClick={onOpenCard} icon={ShoppingBag} label={cartCount > 0 ? `Card (${cartCount})` : 'Card'} colorClass="text-emerald-400" glowClass="shadow-emerald-900/20" />}
                <div className="h-6 w-px bg-slate-800 mx-1"></div>

                <ToolButton onClick={onOpenSplitsData} icon={BarChart3} label="Splits" colorClass="text-cyan-400" />
            </div>

            {/* RIGHT: PROFILE + ADMIN MENU
                IA pass (2026-08-24): this used to be a flat row of 8 icons,
                every one of them visible in the header regardless of what
                page you were on -- one of the two concrete regressions Andy
                reported live-testing Phase 0 ("Also, ... Profile Settings /
                Expert Mgr / AI Transcript / Bulk Import / Save Picks /
                Reset Card / Data Manager" all still cluttering the top bar).
                None of these 7 admin actions are things Andy reaches for
                every few minutes the way SuperContest/Pulse are -- they're
                config/maintenance actions -- so they're collapsed into one
                "Admin" overflow menu, grouped by what they actually do.
                Nothing is removed or relocated to a guessed destination;
                every action is still one click away, just not permanently
                taking up header real estate. Profile Settings stays as its
                own always-visible icon since switching personas (Phase 0)
                is the one of these actually used daily. */}
            <div className="flex items-center justify-end gap-2 w-auto flex-shrink-0">
                <div className="hidden md:flex items-center gap-2">
                    <IconButton onClick={onOpenProfile} icon={User} label="Profile Settings" colorClass="text-purple-400 hover:text-purple-300 hover:border-purple-500/30" />
                    {profileCanAccessOwnerPortfolio && (
                      <AdminMenu
                        onManage={onManage}
                        onAnalyze={onAnalyze}
                        onImport={onImport}
                        onSave={onSave}
                        onReset={onReset}
                        onOpenStorage={onOpenStorage}
                        onOpenAgentStatus={onOpenAgentStatus}
                        profileCanUseAI={profileCanUseAI}
                      />
                    )}
                </div>
            </div>
        </div>
      </div>


      {/* --- BOTTOM LAYER: NAVIGATION --- */}
      <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-2 h-11 flex items-center justify-around gap-1 overflow-x-auto">
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="dashboard" label="Dashboard & Games" icon={LayoutDashboard} dimmed={visibleHubs && !visibleHubs.includes('dashboard')} />
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="official-picks" label="Picks & Inbox" icon={ShieldCheck} dimmed={visibleHubs && !visibleHubs.includes('official-picks')} />
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="intel" label="AI Intel & Command" icon={Bot} dimmed={visibleHubs && !visibleHubs.includes('intel')} />
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="fantasy" label="Fantasy & Props" icon={Shirt} dimmed={visibleHubs && !visibleHubs.includes('fantasy')} />
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="injuries" label="Injuries & Availability" icon={HeartPulse} dimmed={visibleHubs && !visibleHubs.includes('injuries')} />
            {/* Bankroll & Futures elevation (2026-08-24 decision): every other
                hub can be dimmed by a focus profile that doesn't list it --
                a real simplification for e.g. Amanda's profile, which
                intentionally hides AI Intel & Command. Bankroll & Futures is
                different: it's where money at risk actually lives, and a
                profile meant to simplify what you SEE shouldn't be able to
                accidentally hide access to your own bankroll. So this tab is
                exempt from profile dimming entirely -- always fully
                available regardless of which profile's active -- while
                still showing up in Profile Settings' hub picker for
                whichever "default landing" purposes that's used for. */}
            <NavTab activeTab={activeTab} setActiveTab={setActiveTab} cartCount={cartCount} id="futures" label="Bankroll & Futures" icon={Briefcase} dimmed={visibleHubs && !visibleHubs.includes('futures')} />
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
          {profileCanUseLocalTracking && <button onClick={() => setActiveTab('mycard')} className={`p-2 rounded-lg flex flex-col items-center gap-1 relative ${activeTab === 'mycard' ? 'text-emerald-400' : 'text-slate-500'}`}><ShoppingBag size={20}/>{cartCount > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>}<span className="text-[10px] font-bold">Card</span></button>}
          {profileCanUseLocalTracking && <button onClick={() => setActiveTab('bankroll')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'bankroll' ? 'text-emerald-400' : 'text-slate-500'}`}><Banknote size={20}/><span className="text-[10px] font-bold">Bankroll</span></button>}
          <button onClick={() => setActiveTab('odds')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'odds' ? 'text-emerald-400' : 'text-slate-500'}`}><TrendingUp size={20}/><span className="text-[10px] font-bold">Odds</span></button>
          <button onClick={() => setActiveTab('analytics')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'analytics' ? 'text-emerald-400' : 'text-slate-500'}`}><BarChart3 size={20}/><span className="text-[10px] font-bold">Analytics</span></button>
          {profileCanUseAI && <button onClick={onAnalyze} className="p-2 rounded-lg flex flex-col items-center gap-1 text-indigo-500"><Mic size={20}/><span className="text-[10px] font-bold">Record</span></button>}
      </div>
    </header>
  );
}

function NavTab({ activeTab, setActiveTab, cartCount, id, label, icon: Icon, dimmed }) {
  return (
    <button
      onClick={() => { if (!dimmed) setActiveTab(id); }}
      title={dimmed ? `${label} — hidden in your current profile` : undefined}
      className={`relative h-full px-3 flex items-center gap-1.5 font-bold text-[11px] whitespace-nowrap transition-all border-b-2 ${
        dimmed
        ? 'border-transparent text-slate-700 opacity-40 cursor-not-allowed'
        : activeTab === id
        ? 'border-emerald-500 text-white'
        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={14} className={!dimmed && activeTab === id ? "text-emerald-400" : ""} />
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

// Elevated variant of ToolButton for the two header-level tools Andy visits
// daily (Pulse, SuperContest) -- a filled/bordered treatment with a subtle
// glow so they read as a distinct tier from the remaining generic Tools row,
// without yet touching those other four (their own relocations are separate,
// bigger backlog items, not part of this shell).
function PromotedToolButton({ onClick, icon: Icon, label, colorClass, glowClass }) {
  return (
      <button
        onClick={onClick}
        className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-slate-700/80 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-600 shadow-md ${glowClass} transition-all ${colorClass}`}
      >
          <Icon size={15} />
          <span className="text-xs font-black tracking-wide">{label}</span>
      </button>
  );
}

// Right-side admin overflow menu (IA pass, 2026-08-24) -- see the RIGHT
// section comment above for why this replaced 7 always-visible header icons.
// Grouped into the same three clusters the old divider-separated row used:
// content tools, betting card actions, and system/status.
const ADMIN_GROUPS = [
  {
    label: 'Content Tools',
    items: [
      { key: 'onManage', icon: Shield, label: 'Expert Mgr', colorClass: 'text-amber-400' },
      { key: 'onAnalyze', icon: Mic, label: 'AI Transcript', colorClass: 'text-indigo-400' },
      { key: 'onImport', icon: UploadCloud, label: 'Bulk Import', colorClass: 'text-blue-400' },
    ],
  },
  {
    label: 'Betting Card',
    items: [
      { key: 'onSave', icon: Save, label: 'Save Picks', colorClass: 'text-emerald-400' },
      { key: 'onReset', icon: RotateCcw, label: 'Reset Card', colorClass: 'text-rose-400' },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'onOpenStorage', icon: Database, label: 'Data Manager', colorClass: 'text-[#00d2be]' },
      { key: 'onOpenAgentStatus', icon: Bot, label: 'Agent Status', colorClass: 'text-purple-400' },
    ],
  },
];

function AdminMenu(handlers) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Admin"
        className={`p-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all ${open ? 'text-white border-slate-600' : 'text-slate-400 hover:text-white'}`}
      >
        <Menu size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {ADMIN_GROUPS.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'border-t border-slate-800' : ''}>
              <div className="px-3 pt-2.5 pb-1 text-[9px] font-bold text-slate-600 uppercase tracking-wider">{group.label}</div>
              {group.items
                .filter((item) => handlers.profileCanUseAI || item.key !== 'onAnalyze')
                .map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setOpen(false); handlers[item.key]?.(); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-slate-800 transition-colors ${item.colorClass}`}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
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
