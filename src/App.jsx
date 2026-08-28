import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { X } from 'lucide-react';
import logger from './lib/logger';

// --- Hooks ---
import { useModals } from './hooks/useModals';
import { useSchedule } from './hooks/useSchedule';
import { useExperts } from './hooks/useExperts';
import { useBettingCard } from './hooks/useBettingCard';
import { useAutoGrade } from './hooks/useAutoGrade';

// --- Lib ---
import { INITIAL_EXPERTS } from './lib/experts';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS, ALPHA_STATE_DOMAINS, getAlphaStorageKey } from './lib/storage';
import { getBankrollData, saveBankrollData, configureBankrollStorageScope } from './lib/bankroll';
import { configureFuturesStorageScope } from './lib/futures';
import { configurePicksStorageScope } from './lib/picksDatabase';
import { getNFLWeekInfo } from './lib/constants';
import { loadUserPicks, loadUserBets, syncBet, syncPick, deleteSyncedPick } from './lib/supabase';
import { flushDirtyQueue } from './lib/syncQueue';
import { mergeByUpdatedAt } from './lib/syncMerge';
import { AlphaDataPacketProvider } from './lib/alphaDataPacketContext';
import {
  PROFILE_KEY,
  PROFILE_MODES,
  canProfileAccessOwnerPortfolio,
  canProfileUseAI,
  coerceProfileForMode,
  getDefaultProfileForMode,
  isAlphaTesterProfile,
} from './lib/profiles';

// --- Components ---
// Core shell: always needed for first paint, stays eager/static.
import AuthGate from './components/auth/AuthGate';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import DashboardLayout from './components/layout/DashboardLayout';

const ExpertLeaderboard = lazy(() => import('./components/dashboard/ExpertLeaderboard'));
const DevLab = lazy(() => import('./components/dev-lab/DevLab'));
const BankrollDashboard = lazy(() => import('./components/bankroll/BankrollDashboard'));
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const OddsCenter = lazy(() => import('./components/odds/OddsCenter'));
const PicksTracker = lazy(() => import('./components/picks-tracker/PicksTracker'));

// Checkpoint 3 (item 9): every modal/tool surface below is only ever rendered
// while closed/hidden === not mounted (conditional `{flag && <X />}` render, or
// gated on selectedGame/selectedPmContract) except the four "always mounted,
// isOpen prop controls visibility" ones noted below -- those are now also mounted
// on-demand (see the JSX below) so none of these ship in the initial dashboard
// chunk. Behavior is unchanged: same props, same open/close semantics.
const MatchupWizardModal = lazy(() => import('./components/modals/MatchupWizardModal'));
const MyCardModal = lazy(() => import('./components/modals/MyCardModal'));
const SplitsModal = lazy(() => import('./components/modals/SplitsModal'));
const PulseModal = lazy(() => import('./components/modals/PulseModal'));
// Phase 0 (2026-08-24): promoted out of the flat header Tools row into its
// own dedicated, persistent view -- see the file for why ContestLinesModal's
// content moved here rather than being extended in place.
const SuperContestView = lazy(() => import('./components/supercontest/SuperContestView'));
const AudioUploadModal = lazy(() => import('./components/modals/AudioUploadModal'));
const ReviewPicksModal = lazy(() => import('./components/modals/ReviewPicksModal'));
const BulkImportModal = lazy(() => import('./components/modals/BulkImportModal'));
const ExpertManagerModal = lazy(() => import('./components/modals/ExpertManagerModal'));
const InjuryReportModal = lazy(() => import('./components/modals/InjuryReportModal'));
const UnitCalculatorModal = lazy(() => import('./components/modals/UnitCalculatorModal'));
const BetEntryModal = lazy(() => import('./components/modals/BetEntryModal'));
const BetImportModal = lazy(() => import('./components/modals/BetImportModal'));
const PendingBetsModal = lazy(() => import('./components/modals/PendingBetsModal'));
const EditBetModal = lazy(() => import('./components/modals/EditBetModal'));
const ManualGradeModal = lazy(() => import('./components/modals/ManualGradeModal'));
const BankrollSettingsModal = lazy(() => import('./components/modals/BankrollSettingsModal'));
const FuturesEntryModal = lazy(() => import('./components/modals/FuturesEntryModal'));
const StorageBackupModal = lazy(() => import('./components/modals/StorageBackupModal'));
// These four used to be statically imported AND unconditionally mounted (isOpen
// prop just gated their own internal `if (!isOpen) return null`) -- that meant
// their code loaded eagerly even when closed. They're now also conditionally
// mounted (see JSX below), matching the pattern every other modal already uses.
const PodcastIngestModal = lazy(() => import('./components/modals/PodcastIngestModal'));
const AgentStatusModal = lazy(() => import('./components/modals/AgentStatusModal'));
const ProfileSettingsModal = lazy(() => import('./components/modals/ProfileSettingsModal'));
const LineHistoryModal = lazy(() => import('./components/modals/LineHistoryModal'));
const PredictionMarketModal = lazy(() => import('./components/modals/PredictionMarketModal'));

// Newly-wired tabs (Checkpoint 1, 2026-08-21): these components already existed
// and were already reachable as sub-tabs elsewhere (podcasts/training-camp inside
// UnifiedIntelHub, props/dfs inside FantasyHub, bankroll inside FuturesHub) but had
// no top-level route, so real deeplinks like ?tab=podcasts (see agents/nfl-daily-brief.js)
// and the mobile nav footer (Bankroll/Odds/Analytics/Card buttons) landed on blank content.
const PodcastDigestTab = lazy(() => import('./components/podcasts/PodcastDigestTab'));
const TrainingCampIntel = lazy(() => import('./components/intel/TrainingCampIntel'));
const PropsAgentChat = lazy(() => import('./components/agent/PropsAgentChat'));
const DFSOptimizer = lazy(() => import('./components/dfs/DFSOptimizer'));

const FuturesHub = lazy(() => import('./components/futures/FuturesHub'));

const UnifiedIntelHub = lazy(() => import('./components/intel/UnifiedIntelHub'));
const FantasyHub = lazy(() => import('./components/fantasy/FantasyHub'));
const OfficialPicksTab = lazy(() => import('./components/official-picks/OfficialPicksTab'));
const InjuryCenter = lazy(() => import('./components/injuries/InjuryCenter'));



const VALID_TABS = new Set([
  'dashboard', 'official-picks', 'intel', 'fantasy', 'injuries', 'futures',
  'standings', 'mycard', 'devlab', 'bankroll', 'analytics', 'odds', 'picks', 'props', 'dfs', 'podcasts', 'training-camp'
]);

const AI_ONLY_TABS = new Set(['props']);
const OWNER_ONLY_TABS = new Set(['dfs']);

const detectProfileMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('alpha') === '1' || import.meta.env.VITE_ALPHA_TESTER_MODE === 'true'
    ? PROFILE_MODES.ALPHA
    : PROFILE_MODES.OWNER;
};

function App() {
  // --- UI State (local to App) ---
  const [profileMode] = useState(detectProfileMode);
  const [activeProfile, setActiveProfile] = useState(() => {
    return coerceProfileForMode(
      loadFromStorage(PROFILE_KEY, getDefaultProfileForMode(profileMode)),
      profileMode
    );
  });
  const profileCanUseAI = canProfileUseAI(activeProfile);
  const profileCanAccessOwnerPortfolio = canProfileAccessOwnerPortfolio(activeProfile);
  const profileIsAlphaTester = isAlphaTesterProfile(activeProfile);
  const profileCanUseLocalTracking = profileCanAccessOwnerPortfolio || profileIsAlphaTester;
  const weekInfo = useMemo(() => getNFLWeekInfo(), []);
  const alphaStorageScope = useMemo(() => (
    profileIsAlphaTester
      ? {
          profileId: activeProfile.id,
          season: weekInfo.season,
          week: weekInfo.week,
          disableCloudSync: true,
        }
      : null
  ), [activeProfile.id, profileIsAlphaTester, weekInfo.season, weekInfo.week]);
  const bettingCardStorageKey = alphaStorageScope
    ? getAlphaStorageKey({
        profileId: alphaStorageScope.profileId,
        stateDomain: ALPHA_STATE_DOMAINS.BETTING_CARD,
        season: alphaStorageScope.season,
        week: alphaStorageScope.week,
      })
    : PR_STORAGE_KEYS.MY_BETS.key;

  useEffect(() => {
    configureBankrollStorageScope(alphaStorageScope);
    configureFuturesStorageScope(alphaStorageScope);
    configurePicksStorageScope(alphaStorageScope);
  }, [alphaStorageScope]);

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (!VALID_TABS.has(tab)) return 'dashboard';
    if (profileMode === PROFILE_MODES.ALPHA && !activeProfile?.hubs?.includes(tab)) return 'dashboard';
    if (profileMode === PROFILE_MODES.ALPHA && (OWNER_ONLY_TABS.has(tab) || AI_ONLY_TABS.has(tab))) return 'dashboard';
    return tab;
  });
  const [selectedGame, setSelectedGame] = useState(null);
  const [betEntryGame, setBetEntryGame] = useState(null);
  const [podcastModalOpen, setPodcastModalOpen] = useState(false);
  const [agentStatusOpen, setAgentStatusOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedPmContract, setSelectedPmContract] = useState(null);

  // Picks & Inbox sub-view (fix, 2026-08-24): found live-testing the Task #8
  // pin feature -- PicksTracker.jsx (AI Lab/Expert picks, with delete and
  // now pin) had NO way to reach it from the UI at all. `activeTab ===
  // 'picks'` has a real render target (line ~309 below, pre-dating this
  // session per the "Checkpoint 1 stale-tab repair" comment there) but
  // nothing anywhere calls setActiveTab('picks') -- confirmed via repo-wide
  // grep. Rather than leave the pin feature real but unreachable, or invent
  // a whole new top-level nav slot, "Picks & Inbox" becomes a real toggle
  // between the two picks-related surfaces it's already named for.
  const [picksSubView, setPicksSubView] = useState('inbox'); // 'inbox' | 'tracker'

  // Real Profile personalization (Phase 0, 2026-08-24): which Command Hubs
  // the active profile cares about. Previously ProfileSettingsModal saved a
  // preset to localStorage but nothing else in the app ever read it back
  // (confirmed via grep -- zero other call sites) -- this is the wiring that
  // makes it actually do something. Initialized from whatever was last saved
  // so a returning user's profile choice survives a refresh.
  const [visibleHubs, setVisibleHubs] = useState(() => {
    return activeProfile?.hubs || getDefaultProfileForMode(profileMode).hubs;
  });

  const handleProfileUpdated = useCallback((profile) => {
    const coercedProfile = coerceProfileForMode(profile, profileMode);
    setActiveProfile(coercedProfile);
    const hubs = coercedProfile?.hubs || getDefaultProfileForMode(profileMode).hubs;
    setVisibleHubs(hubs);
    // If the tab we're currently on isn't visible under the new profile,
    // jump to the first hub that is -- otherwise switching to Amanda's
    // profile while on Bankroll & Futures would leave a dimmed-and-disabled
    // tab as the active one, with no visible way back via the nav row.
    setActiveTab(current => (hubs.includes(current) ? current : (hubs[0] || 'dashboard')));
  }, [profileMode]);

  // --- Custom Hooks ---
  // Sync active tab to URL so briefing deeplinks work
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === 'dashboard') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', activeTab);
    }
    window.history.replaceState(null, '', url.toString());
  }, [activeTab]);

  const {
    modals, openModal, closeModal,
    selectedBetForEdit, setSelectedBetForEdit,
    gradeGameData, setGradeGameData,
    picksRefreshKey, setPicksRefreshKey,
  } = useModals();

  const {
    schedule, stats, splits, injuries, loading,
    contestLines, setContestLines,
    simResults, setSimResults,
    findGameForTeam,
    handleBulkImport,
  } = useSchedule();

  const {
    expertConsensus, stagedPicks, setStagedPicks,
    handleAIAnalyze, handleConfirmPicks,
    handleUpdatePick, handleDeletePick, handleClearExpert,
  } = useExperts({ schedule, findGameForTeam, openModal, closeModal });

  const {
    myBets, handleBet, removeBet, handleLockBets, handleCreateParlay, clearBets,
  } = useBettingCard(schedule, bettingCardStorageKey);

  // --- Auto-grade pending picks from Supabase game_results ---
  const { autoGraded, runGradingCheck, checking } = useAutoGrade();

  // --- Sync handlers (also called by Header buttons) ---
  const handleSync = useCallback(async () => {
    if (profileIsAlphaTester) {
      logger.log('[sync] Alpha tester mode: Supabase sync/dirty-queue flush skipped');
      return;
    }
    try {
      const [cloudPicks, cloudBets] = await Promise.all([loadUserPicks(), loadUserBets()]);
      let hydrated = false;

      if (cloudPicks.length > 0) {
        const localPicks = loadFromStorage(PR_STORAGE_KEYS.PICKS.key, []);
        const { merged: mergedPicks, changed: picksChanged } =
          mergeByUpdatedAt(localPicks, cloudPicks);

        if (picksChanged) {
          saveToStorage(PR_STORAGE_KEYS.PICKS.key, mergedPicks);
          logger.log('[sync] Picks hydrated/updated from Supabase');
          hydrated = true;
        }
      }

      if (cloudBets.length > 0) {
        const localData = getBankrollData();
        const { merged: mergedBets, changed: betsChanged } =
          mergeByUpdatedAt(localData.bets, cloudBets);

        if (betsChanged) {
          localData.bets = mergedBets;
          saveBankrollData(localData);
          logger.log('[sync] Bets hydrated/updated from Supabase');
          hydrated = true;
        }
      }

      if (hydrated) setPicksRefreshKey(k => k + 1);

      await flushDirtyQueue(syncBet, syncPick, deleteSyncedPick);
    } catch (e) {
      logger.warn('[sync] Sync failed (non-fatal):', e.message);
    }
  }, [profileIsAlphaTester, setPicksRefreshKey]);

  const handleSave = useCallback(async () => {
    try {
      await flushDirtyQueue(syncBet, syncPick, deleteSyncedPick);
      logger.log('[sync] Manual save complete');
    } catch (e) {
      logger.warn('[sync] Manual save failed (non-fatal):', e.message);
    }
  }, []);

  // --- Boot hydration: restore picks + bets from Supabase if missing locally,
  //     update locally-stale records when cloud has a newer updated_at, and
  //     flush any dirty-queue items that failed during the previous session. ---
  useEffect(() => {
    handleSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Derived Data (cross-cutting: merges schedule + experts + splits) ---
  const gamesWithSplits = useMemo(() => schedule.map(game => {
    const gameData = splits[game.id] ||
                     splits[game.game_id] ||
                     splits[`${game.visitor}_${game.home}`] ||
                     splits[`${game.visitor}_at_${game.home}`] ||
                     Object.values(splits).find(s => (s.visitor === game.visitor && s.home === game.home) || (s.visitor === game.home && s.home === game.visitor));

    const expertData = expertConsensus[game.id] ||
                       expertConsensus[game.game_id] ||
                       expertConsensus[`${game.visitor}_${game.home}`] ||
                       expertConsensus[`${game.visitor}_at_${game.home}`] ||
                       { expertPicks: { spread: [], total: [] } };

    const homeInjuries = injuries[game.home] || [];
    const visitorInjuries = injuries[game.visitor] || [];

    // --- Wong Teaser detection (Phase 1, 2026-08-24) -----------------------
    // Ported verbatim from the old header-modal WongTeaserModal.jsx (Cross
    // 3 & 7: favorites -7.5..-8.5, dogs +1.5..+2.5). Header modal is gone;
    // this now populates the passive `teaser`/`teaserSide` fields that
    // MatchupCard.jsx already renders as an inline badge (previously dead
    // code -- the JSX existed, nothing ever set these fields). Strict mode
    // (Total <= 49) is applied by default since there's no more UI toggle
    // to turn it off from; that matches the modal's original default.
    let teaser = null;
    let teaserSide = null;
    if (typeof game.total !== 'number' || game.total <= 49) {
      const spread = game.spread;
      const vSpread = -spread;
      if (spread <= -7.5 && spread >= -8.5) { teaser = 'Favorite'; teaserSide = game.home; }
      else if (spread >= 1.5 && spread <= 2.5) { teaser = 'Underdog'; teaserSide = game.home; }
      else if (vSpread <= -7.5 && vSpread >= -8.5) { teaser = 'Favorite'; teaserSide = game.visitor; }
      else if (vSpread >= 1.5 && vSpread <= 2.5) { teaser = 'Underdog'; teaserSide = game.visitor; }
    }

    // SuperContest Phase 2 (2026-08-24): contestLines entries used to be a
    // bare number; they're now { value, lockedAt } so the drift table can
    // show when each line locked (see SuperContestView.jsx file header for
    // the full rationale). Both shapes are read here so lines saved before
    // this change still work.
    const rawContestLine = contestLines[game.id];
    const contestSpread = rawContestLine == null
      ? null
      : (typeof rawContestLine === 'object' ? rawContestLine.value : rawContestLine);
    const contestLineLockedAt = rawContestLine && typeof rawContestLine === 'object'
      ? rawContestLine.lockedAt
      : null;

    return {
      ...game,
      splits: gameData?.splits || gameData || null,
      contestSpread,
      contestLineLockedAt,
      consensus: expertData,
      injuries: { home: homeInjuries, visitor: visitorInjuries },
      teaser,
      teaserSide
    };
  }), [schedule, splits, expertConsensus, contestLines, injuries]);

  // --- Loading Gate ---
  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-[#00d2be] font-mono">Loading Data Engine...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 font-sans pb-20 selection:bg-[#00d2be] selection:text-black">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} cartCount={profileCanUseLocalTracking ? myBets.length : 0} onSyncOdds={handleSync} onOpenSplits={() => openModal('pulse')} onOpenSplitsData={() => openModal('splits')} onOpenSuperContest={() => { if (profileCanAccessOwnerPortfolio) openModal('contest'); }} onOpenCard={() => { if (profileCanUseLocalTracking) openModal('myCard'); }} onImport={() => { if (profileCanAccessOwnerPortfolio) openModal('import'); }} onAnalyze={() => { if (profileCanUseAI) openModal('audio'); }} onManage={() => { if (profileCanAccessOwnerPortfolio) openModal('expertMgr'); }} onSave={profileCanAccessOwnerPortfolio ? handleSave : () => {}} onReset={() => { if(profileCanUseLocalTracking && window.confirm("Reset all picks?")) clearBets(); }} onOpenStorage={() => { if (profileCanAccessOwnerPortfolio) openModal('storage'); }} onOpenAgentStatus={() => { if (profileCanUseAI) setAgentStatusOpen(true); }} onOpenProfile={() => setProfileModalOpen(true)} visibleHubs={visibleHubs} profileCanUseAI={profileCanUseAI} profileCanAccessOwnerPortfolio={profileCanAccessOwnerPortfolio} profileCanUseLocalTracking={profileCanUseLocalTracking} />
      <AlphaDataPacketProvider enabled={profileMode === PROFILE_MODES.ALPHA}>
        <DashboardLayout showAgentSidebar={profileCanUseAI}>
          <main>
            <Suspense fallback={<div className="flex items-center justify-center py-24 text-[#00d2be] font-mono text-sm">Loading...</div>}>
            {activeTab === 'dashboard' && <div className="animate-in fade-in zoom-in duration-300"><Dashboard schedule={gamesWithSplits} stats={stats} simResults={simResults} onGameClick={setSelectedGame} onPlaceBet={profileCanUseLocalTracking ? handleBet : undefined} myBets={profileCanUseLocalTracking ? myBets : []} onShowHistory={(game) => { setSelectedGame(game); openModal('lineHistory'); }} onShowInjuries={(game) => { setSelectedGame(game); openModal('injuryReport'); }} onOpenCard={profileCanUseLocalTracking ? () => openModal('myCard') : undefined} onShowPmContract={(contract) => setSelectedPmContract(contract)} /></div>}
            {activeTab === 'official-picks' && (
              <div className="animate-in fade-in zoom-in duration-300 space-y-4">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setPicksSubView('inbox')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${picksSubView === 'inbox' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-white'}`}
                  >
                    AI Official Picks Inbox
                  </button>
                  <button
                    onClick={() => setPicksSubView('tracker')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${picksSubView === 'tracker' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-white'}`}
                  >
                    My Picks (AI Lab / Expert)
                  </button>
                </div>
                {picksSubView === 'inbox' && <OfficialPicksTab key={picksRefreshKey} alphaMode={profileIsAlphaTester} />}
                {picksSubView === 'tracker' && <PicksTracker key={autoGraded} onOpenGradeModal={(g) => { setGradeGameData(g); openModal('gradeModal'); }} onAutoGrade={profileCanAccessOwnerPortfolio ? runGradingCheck : null} autoGrading={checking} onOpenPodcastModal={profileCanAccessOwnerPortfolio ? () => setPodcastModalOpen(true) : null} />}
              </div>
            )}
            {activeTab === 'intel' && <div className="animate-in fade-in zoom-in duration-300"><UnifiedIntelHub profileCanUseAI={profileCanUseAI} /></div>}
            {activeTab === 'fantasy' && <div className="animate-in fade-in zoom-in duration-300"><FantasyHub /></div>}
            {activeTab === 'injuries' && <div className="animate-in fade-in zoom-in duration-300"><InjuryCenter injuries={injuries} /></div>}
            {activeTab === 'futures' && <div className="animate-in fade-in zoom-in duration-300"><FuturesHub onShowCalculator={() => openModal('unitCalculator')} onAddPosition={() => { if (profileCanUseLocalTracking) openModal('futuresEntry'); }} onAddBet={() => { if (profileCanUseLocalTracking) openModal('betEntry'); }} onImportBets={profileCanAccessOwnerPortfolio ? () => openModal('betImport') : undefined} onShowPending={() => { if (profileCanUseLocalTracking) openModal('pendingBets'); }} onShowSettings={profileCanAccessOwnerPortfolio ? () => openModal('bankrollSettings') : undefined} profileCanUseAI={profileCanUseAI} profileCanAccessOwnerPortfolio={profileCanUseLocalTracking} /></div>}
            {/* --- Checkpoint 1 stale-tab repair: real render targets for the remaining VALID_TABS ids --- */}
            {activeTab === 'bankroll' && profileCanUseLocalTracking && <div className="animate-in fade-in zoom-in duration-300"><BankrollDashboard onShowCalculator={() => openModal('unitCalculator')} onAddBet={() => openModal('betEntry')} onImportBets={profileCanAccessOwnerPortfolio ? () => openModal('betImport') : undefined} onShowPending={() => openModal('pendingBets')} onShowSettings={profileCanAccessOwnerPortfolio ? () => openModal('bankrollSettings') : undefined} /></div>}
            {activeTab === 'odds' && <div className="animate-in fade-in zoom-in duration-300"><OddsCenter /></div>}
            {activeTab === 'analytics' && <div className="animate-in fade-in zoom-in duration-300"><AnalyticsDashboard /></div>}
            {activeTab === 'mycard' && profileCanUseLocalTracking && <div className="animate-in fade-in zoom-in duration-300"><MyCardModal bets={myBets} onRemoveBet={removeBet} onLockBets={handleLockBets} onClearCard={() => { if (window.confirm('Clear all bets from the card?')) clearBets(); }} onCreateParlay={handleCreateParlay} /></div>}
            {activeTab === 'devlab' && <div className="animate-in fade-in zoom-in duration-300"><DevLab games={gamesWithSplits} stats={stats} savedResults={simResults} onSimComplete={setSimResults} /></div>}
            {activeTab === 'picks' && profileCanUseLocalTracking && <div className="animate-in fade-in zoom-in duration-300"><PicksTracker key={autoGraded} onOpenGradeModal={(g) => { setGradeGameData(g); openModal('gradeModal'); }} onAutoGrade={profileCanAccessOwnerPortfolio ? runGradingCheck : null} autoGrading={checking} onOpenPodcastModal={profileCanAccessOwnerPortfolio ? () => setPodcastModalOpen(true) : null} /></div>}
            {activeTab === 'standings' && <div className="animate-in fade-in zoom-in duration-300"><ExpertLeaderboard expertConsensus={expertConsensus} /></div>}
            {activeTab === 'podcasts' && <div className="animate-in fade-in zoom-in duration-300"><PodcastDigestTab /></div>}
            {activeTab === 'training-camp' && <div className="animate-in fade-in zoom-in duration-300"><TrainingCampIntel /></div>}
            {activeTab === 'props' && profileCanUseAI && <div className="animate-in fade-in zoom-in duration-300"><PropsAgentChat /></div>}
            {activeTab === 'dfs' && profileCanAccessOwnerPortfolio && <div className="animate-in fade-in zoom-in duration-300"><DFSOptimizer /></div>}
            </Suspense>
          </main>
        </DashboardLayout>
      </AlphaDataPacketProvider>


      {/* --- LAZY-MOUNTED MODALS ---
          Checkpoint 3 (item 9): each of these is now a React.lazy() import (see
          top of file), so its code is a separate chunk that only downloads the
          first time it actually mounts -- i.e. the first time its modal opens.
          A single Suspense boundary with a lightweight overlay fallback covers
          the whole block; only ever visible on a cold first-open of a given
          modal (subsequent opens reuse the already-loaded chunk). */}
      <Suspense fallback={
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-[#00d2be] font-mono text-sm">Loading...</div>
        </div>
      }>
        {selectedGame && <MatchupWizardModal isOpen game={selectedGame} stats={stats} currentWizardData={expertConsensus[selectedGame.id] || null} onClose={() => setSelectedGame(null)} onBet={(id, type, sel, line) => { handleBet(id, type, sel, line); setSelectedGame(null); }} />}
        {modals.pulse && <PulseModal isOpen onClose={() => closeModal('pulse')} games={gamesWithSplits} />}
        {profileCanAccessOwnerPortfolio && modals.contest && <SuperContestView isOpen onClose={() => closeModal('contest')} games={gamesWithSplits} onUpdateContestLines={setContestLines} />}
        {modals.splits && <SplitsModal isOpen onClose={() => closeModal('splits')} games={gamesWithSplits} />}
        {profileCanUseAI && modals.audio && <AudioUploadModal isOpen onClose={() => closeModal('audio')} onAnalyze={handleAIAnalyze} />}
        {modals.review && <ReviewPicksModal isOpen onClose={() => closeModal('review')} stagedPicks={stagedPicks} onConfirm={handleConfirmPicks} onDiscard={(idx) => setStagedPicks(prev => prev.filter((_, i) => i !== idx))} />}
        {profileCanAccessOwnerPortfolio && modals.import && <BulkImportModal isOpen onClose={() => closeModal('import')} onImport={handleBulkImport} />}
        {profileCanAccessOwnerPortfolio && modals.expertMgr && <ExpertManagerModal isOpen onClose={() => closeModal('expertMgr')} experts={INITIAL_EXPERTS} expertConsensus={expertConsensus} onUpdatePick={handleUpdatePick} onDeletePick={handleDeletePick} onClearExpert={handleClearExpert} />}
        {modals.injuryReport && <InjuryReportModal isOpen onClose={() => closeModal('injuryReport')} game={selectedGame} injuries={injuries} />}
        {modals.unitCalculator && <UnitCalculatorModal isOpen onClose={() => closeModal('unitCalculator')} />}
        {profileCanUseLocalTracking && modals.betEntry && <BetEntryModal isOpen onClose={() => { closeModal('betEntry'); setBetEntryGame(null); }} selectedGame={betEntryGame} schedule={schedule} refreshBankroll={() => {}} />}
        {profileCanAccessOwnerPortfolio && modals.betImport && <BetImportModal isOpen onClose={() => closeModal('betImport')} onImportComplete={(betId, bet) => { logger.log('Bet imported:', betId, bet); alert('Bet imported successfully!'); }} />}
        {profileCanUseLocalTracking && modals.pendingBets && <PendingBetsModal isOpen onClose={() => closeModal('pendingBets')} onEditBet={(bet) => { setSelectedBetForEdit(bet); openModal('editBet'); }} />}
        {profileCanUseLocalTracking && modals.editBet && <EditBetModal isOpen onClose={() => { closeModal('editBet'); setSelectedBetForEdit(null); }} bet={selectedBetForEdit} schedule={schedule} onBetUpdated={() => { closeModal('pendingBets'); setTimeout(() => openModal('pendingBets'), 100); }} />}
        {profileCanUseLocalTracking && modals.myCard && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-20 overflow-y-auto">
            <div className="w-full max-w-6xl bg-[#0f0f0f] border border-slate-700 rounded-xl shadow-2xl p-4 md:p-6 relative">
              <button
                onClick={() => closeModal('myCard')}
                className="absolute right-4 top-4 p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all z-10"
                title="Close card"
              >
                <X size={16} />
              </button>
              <MyCardModal bets={myBets} onRemoveBet={removeBet} onLockBets={handleLockBets} onClearCard={() => { if (window.confirm('Clear all bets from the card?')) clearBets(); }} onCreateParlay={handleCreateParlay} />
            </div>
          </div>
        )}
        {modals.gradeModal && <ManualGradeModal isOpen onClose={() => { closeModal('gradeModal'); setGradeGameData(null); setPicksRefreshKey(k => k + 1); }} gameData={gradeGameData} onGraded={() => setPicksRefreshKey(k => k + 1)} />}
        {modals.bankrollSettings && <BankrollSettingsModal isOpen onClose={() => closeModal('bankrollSettings')} onSettingsUpdated={() => {}} />}
        {profileCanUseLocalTracking && modals.futuresEntry && <FuturesEntryModal isOpen onClose={() => closeModal('futuresEntry')} onAdded={() => {}} />}
        {profileCanAccessOwnerPortfolio && modals.storage && <StorageBackupModal isOpen onClose={() => closeModal('storage')} />}
        {modals.lineHistory && <LineHistoryModal isOpen onClose={() => closeModal('lineHistory')} game={selectedGame} />}
        {selectedPmContract && <PredictionMarketModal isOpen contract={selectedPmContract} onClose={() => setSelectedPmContract(null)} />}
        {/* Checkpoint 3: these four used to always be mounted (isOpen just gated
            their own internal render); now mounted on-demand like every modal
            above -- same isOpen=true-while-mounted semantics, same onClose. */}
        {podcastModalOpen && <PodcastIngestModal isOpen onClose={() => setPodcastModalOpen(false)} onPicksImported={() => setPicksRefreshKey(k => k + 1)} />}
        {profileCanUseAI && agentStatusOpen && <AgentStatusModal isOpen onClose={() => setAgentStatusOpen(false)} />}
        {profileModalOpen && <ProfileSettingsModal isOpen onClose={() => setProfileModalOpen(false)} onProfileUpdated={handleProfileUpdated} profileMode={profileMode} />}
      </Suspense>

    </div>
  );
}

export default function AppWithAuth() {
  return (
    <AuthGate>
      <App />
    </AuthGate>
  );
}
