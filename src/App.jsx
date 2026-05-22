import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';

// --- Hooks ---
import { useModals } from './hooks/useModals';
import { useSchedule } from './hooks/useSchedule';
import { useExperts } from './hooks/useExperts';
import { useBettingCard } from './hooks/useBettingCard';
import { useAutoGrade } from './hooks/useAutoGrade';

// --- Lib ---
import { INITIAL_EXPERTS } from './lib/experts';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from './lib/storage';
import { getBankrollData, saveBankrollData } from './lib/bankroll';
import { loadUserPicks, loadUserBets } from './lib/supabase';

// --- Components ---
import AuthGate from './components/auth/AuthGate';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
const ExpertLeaderboard = lazy(() => import('./components/dashboard/ExpertLeaderboard'));
import MatchupWizardModal from './components/modals/MatchupWizardModal';
import MyCardModal from './components/modals/MyCardModal';
const DevLab = lazy(() => import('./components/dev-lab/DevLab'));
import SplitsModal from './components/modals/SplitsModal';
import WongTeaserModal from './components/modals/WongTeaserModal';
import PulseModal from './components/modals/PulseModal';
import ContestLinesModal from './components/modals/ContestLinesModal';
import AudioUploadModal from './components/modals/AudioUploadModal';
import ReviewPicksModal from './components/modals/ReviewPicksModal';
import BulkImportModal from './components/modals/BulkImportModal';
import ExpertManagerModal from './components/modals/ExpertManagerModal';
import InjuryReportModal from './components/modals/InjuryReportModal';
import UnitCalculatorModal from './components/modals/UnitCalculatorModal';
import BetEntryModal from './components/modals/BetEntryModal';
import BetImportModal from './components/modals/BetImportModal';
import PendingBetsModal from './components/modals/PendingBetsModal';
import EditBetModal from './components/modals/EditBetModal';
const BankrollDashboard = lazy(() => import('./components/bankroll/BankrollDashboard'));
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const OddsCenter = lazy(() => import('./components/odds/OddsCenter'));
const PicksTracker = lazy(() => import('./components/picks-tracker/PicksTracker'));
import ManualGradeModal from './components/modals/ManualGradeModal';
import BankrollSettingsModal from './components/modals/BankrollSettingsModal';
const FuturesPortfolio = lazy(() => import('./components/futures/FuturesPortfolio'));
const AgentChat = lazy(() => import('./components/agent/AgentChat'));
const PropsAgentChat = lazy(() => import('./components/agent/PropsAgentChat'));
const DFSOptimizer = lazy(() => import('./components/dfs/DFSOptimizer'));
import FuturesEntryModal from './components/modals/FuturesEntryModal';
import StorageBackupModal from './components/modals/StorageBackupModal';
import PodcastIngestModal from './components/modals/PodcastIngestModal';
import AgentStatusModal from './components/modals/AgentStatusModal';

function App() {
  // --- UI State (local to App) ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGame, setSelectedGame] = useState(null);
  const [betEntryGame, setBetEntryGame] = useState(null);
  const [podcastModalOpen, setPodcastModalOpen] = useState(false);
  const [agentStatusOpen, setAgentStatusOpen] = useState(false);

  // --- Custom Hooks ---
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
    myBets, handleBet, removeBet, handleLockBets, clearBets,
  } = useBettingCard(schedule);

  // --- Auto-grade pending picks from Supabase game_results ---
  const { autoGraded, runGradingCheck, checking } = useAutoGrade();

  // --- Boot hydration: restore picks + bets from Supabase if missing locally ---
  useEffect(() => {
    async function hydrateFromSupabase() {
      try {
        const [cloudPicks, cloudBets] = await Promise.all([loadUserPicks(), loadUserBets()]);
        let hydrated = false;

        if (cloudPicks.length > 0) {
          const localPicks = loadFromStorage(PR_STORAGE_KEYS.PICKS.key, []);
          const localIds = new Set(localPicks.map(p => p.id));
          const added = cloudPicks.filter(p => !localIds.has(p.id));
          if (added.length > 0) {
            saveToStorage(PR_STORAGE_KEYS.PICKS.key, [...localPicks, ...added]);
            console.log(`[sync] Hydrated ${added.length} picks from Supabase`);
            hydrated = true;
          }
        }

        if (cloudBets.length > 0) {
          const localData = getBankrollData();
          const localIds = new Set(localData.bets.map(b => String(b.id)));
          const added = cloudBets.filter(b => !localIds.has(String(b.id)));
          if (added.length > 0) {
            localData.bets = [...localData.bets, ...added];
            saveBankrollData(localData);
            console.log(`[sync] Hydrated ${added.length} bets from Supabase`);
            hydrated = true;
          }
        }

        if (hydrated) setPicksRefreshKey(k => k + 1);
      } catch (e) {
        console.warn('[sync] Boot hydration failed (non-fatal):', e.message);
      }
    }
    hydrateFromSupabase();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Derived Data (cross-cutting: merges schedule + experts + splits) ---
  const gamesWithSplits = useMemo(() => schedule.map(game => {
    const gameData = splits[game.id] || splits[String(game.id)];
    const expertData = expertConsensus[game.id] || { expertPicks: { spread: [], total: [] } };
    const homeInjuries = injuries[game.home] || [];
    const visitorInjuries = injuries[game.visitor] || [];
    return {
      ...game,
      splits: gameData?.splits || null,
      contestSpread: contestLines[game.id] || null,
      consensus: expertData,
      injuries: { home: homeInjuries, visitor: visitorInjuries }
    };
  }), [schedule, splits, expertConsensus, contestLines, injuries]);

  // --- Loading Gate ---
  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-[#00d2be] font-mono">Loading Data Engine...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 font-sans pb-20 selection:bg-[#00d2be] selection:text-black">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} cartCount={myBets.length} onSyncOdds={() => console.log("Sync")} onOpenSplits={() => openModal('pulse')} onOpenSplitsData={() => openModal('splits')} onOpenTeasers={() => openModal('teasers')} onOpenContest={() => openModal('contest')} onImport={() => openModal('import')} onAnalyze={() => openModal('audio')} onManage={() => openModal('expertMgr')} onSave={() => alert("Save functionality coming soon")} onReset={() => { if(window.confirm("Reset all picks?")) clearBets(); }} onOpenStorage={() => openModal('storage')} onOpenAgentStatus={() => setAgentStatusOpen(true)} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<div className="flex items-center justify-center py-24 text-[#00d2be] font-mono text-sm">Loading...</div>}>
          {activeTab === 'dashboard' && <div className="animate-in fade-in zoom-in duration-300"><Dashboard schedule={gamesWithSplits} stats={stats} simResults={simResults} onGameClick={setSelectedGame} onShowInjuries={(game) => { setSelectedGame(game); openModal('injuryReport'); }} onAddBankrollBet={(game) => { setBetEntryGame(game); openModal('betEntry'); }} /></div>}
          {activeTab === 'standings' && <div className="max-w-5xl mx-auto animate-in fade-in zoom-in duration-300"><ExpertLeaderboard expertConsensus={expertConsensus} refreshKey={picksRefreshKey + autoGraded} /></div>}
          {activeTab === 'mycard' && <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300"><MyCardModal bets={myBets} onRemoveBet={removeBet} onLockBets={handleLockBets} onClearCard={clearBets} /></div>}
          {activeTab === 'devlab' && <DevLab games={schedule} stats={stats} savedResults={simResults} onSimComplete={setSimResults} />}
          {activeTab === 'bankroll' && <div className="animate-in fade-in zoom-in duration-300"><BankrollDashboard onAddBet={() => openModal('betEntry')} onShowCalculator={() => openModal('unitCalculator')} onImportBets={() => openModal('betImport')} onShowPending={() => openModal('pendingBets')} onShowSettings={() => openModal('bankrollSettings')} /></div>}
          {activeTab === 'analytics' && <div className="animate-in fade-in zoom-in duration-300"><AnalyticsDashboard /></div>}
          {activeTab === 'odds' && <div className="animate-in fade-in zoom-in duration-300"><OddsCenter /></div>}
          {activeTab === 'picks' && <div className="animate-in fade-in zoom-in duration-300"><PicksTracker onOpenGradeModal={(gameData) => { setGradeGameData(gameData); openModal('gradeModal'); }} onAutoGrade={runGradingCheck} autoGrading={checking} onOpenPodcastModal={() => setPodcastModalOpen(true)} key={`picks-${picksRefreshKey}-${autoGraded}`} /></div>}
          {activeTab === 'futures' && <div className="animate-in fade-in zoom-in duration-300"><FuturesPortfolio onAddPosition={() => openModal('futuresEntry')} /></div>}
          {activeTab === 'agent' && <div className="animate-in fade-in zoom-in duration-300"><AgentChat /></div>}
          {activeTab === 'props' && <div className="animate-in fade-in zoom-in duration-300"><PropsAgentChat /></div>}
          {activeTab === 'dfs' && <div className="animate-in fade-in zoom-in duration-300"><DFSOptimizer /></div>}
        </Suspense>
      </main>

      {/* --- LAZY-MOUNTED MODALS --- */}
      {selectedGame && <MatchupWizardModal isOpen game={selectedGame} stats={stats} currentWizardData={expertConsensus[selectedGame.id] || null} onClose={() => setSelectedGame(null)} onBet={(id, type, sel, line) => { handleBet(id, type, sel, line); setSelectedGame(null); }} />}
      {modals.pulse && <PulseModal isOpen onClose={() => closeModal('pulse')} games={gamesWithSplits} />}
      {modals.contest && <ContestLinesModal isOpen onClose={() => closeModal('contest')} games={gamesWithSplits} onUpdateContestLines={setContestLines} />}
      {modals.teasers && <WongTeaserModal isOpen onClose={() => closeModal('teasers')} games={gamesWithSplits} />}
      {modals.splits && <SplitsModal isOpen onClose={() => closeModal('splits')} games={gamesWithSplits} />}
      {modals.audio && <AudioUploadModal isOpen onClose={() => closeModal('audio')} onAnalyze={handleAIAnalyze} />}
      {modals.review && <ReviewPicksModal isOpen onClose={() => closeModal('review')} stagedPicks={stagedPicks} onConfirm={handleConfirmPicks} onDiscard={(idx) => setStagedPicks(prev => prev.filter((_, i) => i !== idx))} />}
      {modals.import && <BulkImportModal isOpen onClose={() => closeModal('import')} onImport={handleBulkImport} />}
      {modals.expertMgr && <ExpertManagerModal isOpen onClose={() => closeModal('expertMgr')} experts={INITIAL_EXPERTS} expertConsensus={expertConsensus} onUpdatePick={handleUpdatePick} onDeletePick={handleDeletePick} onClearExpert={handleClearExpert} />}
      {modals.injuryReport && <InjuryReportModal isOpen onClose={() => closeModal('injuryReport')} game={selectedGame} injuries={injuries} />}
      {modals.unitCalculator && <UnitCalculatorModal isOpen onClose={() => closeModal('unitCalculator')} />}
      {modals.betEntry && <BetEntryModal isOpen onClose={() => { closeModal('betEntry'); setBetEntryGame(null); }} selectedGame={betEntryGame} schedule={schedule} refreshBankroll={() => {}} />}
      {modals.betImport && <BetImportModal isOpen onClose={() => closeModal('betImport')} onImportComplete={(betId, bet) => { console.log('Bet imported:', betId, bet); alert('Bet imported successfully!'); }} />}
      {modals.pendingBets && <PendingBetsModal isOpen onClose={() => closeModal('pendingBets')} onEditBet={(bet) => { setSelectedBetForEdit(bet); openModal('editBet'); }} />}
      {modals.editBet && <EditBetModal isOpen onClose={() => { closeModal('editBet'); setSelectedBetForEdit(null); }} bet={selectedBetForEdit} schedule={schedule} onBetUpdated={() => { closeModal('pendingBets'); setTimeout(() => openModal('pendingBets'), 100); }} />}
      {modals.gradeModal && <ManualGradeModal isOpen onClose={() => { closeModal('gradeModal'); setGradeGameData(null); setPicksRefreshKey(k => k + 1); }} gameData={gradeGameData} onGraded={() => setPicksRefreshKey(k => k + 1)} />}
      {modals.bankrollSettings && <BankrollSettingsModal isOpen onClose={() => closeModal('bankrollSettings')} onSettingsUpdated={() => {}} />}
      {modals.futuresEntry && <FuturesEntryModal isOpen onClose={() => closeModal('futuresEntry')} onAdded={() => {}} />
      }
      {modals.storage && <StorageBackupModal isOpen onClose={() => closeModal('storage')} />
      }
      <PodcastIngestModal isOpen={podcastModalOpen} onClose={() => setPodcastModalOpen(false)} onPicksImported={() => setPicksRefreshKey(k => k + 1)} />
      <AgentStatusModal isOpen={agentStatusOpen} onClose={() => setAgentStatusOpen(false)} />
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