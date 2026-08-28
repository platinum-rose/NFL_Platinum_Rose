import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = (relativePath) => fs.readFileSync(path.resolve(__dirname, '../../', relativePath), 'utf8');

describe('Alpha AI/API-key and owner-surface gating', () => {
  it('detects Alpha tester mode without overwriting the owner profile key', () => {
    const app = source('src/App.jsx');

    expect(app).toContain("params.get('alpha') === '1'");
    expect(app).toContain('VITE_ALPHA_TESTER_MODE');
    expect(app).toContain('coerceProfileForMode(');
  });

  it('gates the persistent AI sidebar for Alpha tester profiles', () => {
    const app = source('src/App.jsx');
    const layout = source('src/components/layout/DashboardLayout.jsx');

    expect(app).toContain('showAgentSidebar={profileCanUseAI}');
    expect(layout).toContain('showAgentSidebar = true');
    expect(layout).toContain('{showAgentSidebar &&');
  });

  it('gates AI chat and API-key entry points in App.jsx', () => {
    const app = source('src/App.jsx');

    expect(app).toContain("onAnalyze={() => { if (profileCanUseAI) openModal('audio'); }}");
    expect(app).toContain("{profileCanUseAI && modals.audio && <AudioUploadModal");
    expect(app).toContain("{activeTab === 'props' && profileCanUseAI &&");
    expect(app).toContain("{activeTab === 'intel' && <div");
    expect(app).toContain('<UnifiedIntelHub profileCanUseAI={profileCanUseAI}');
  });

  it('gates the Intel hub AI Assistant subtab', () => {
    const hub = source('src/components/intel/UnifiedIntelHub.jsx');

    expect(hub).toContain('profileCanUseAI = true');
    expect(hub).toContain("{profileCanUseAI && (");
    expect(hub).toContain("{profileCanUseAI && activeSubTab === 'agent-chat' && <AgentChat />}");
  });

  it('keeps main Alpha hubs and local tracking open while gating owner-only surfaces', () => {
    const app = source('src/App.jsx');
    const header = source('src/components/layout/Header.jsx');
    const profiles = source('src/lib/profiles.js');
    const futuresHub = source('src/components/futures/FuturesHub.jsx');
    const bankroll = source('src/lib/bankroll.js');
    const futures = source('src/lib/futures.js');
    const picks = source('src/lib/picksDatabase.js');

    expect(profiles).toContain("'dashboard',");
    expect(profiles).toContain("'odds',");
    expect(profiles).toContain("'analytics',");
    expect(profiles).toContain("'bankroll',");
    expect(profiles).toContain("'mycard',");
    expect(profiles).toContain("'picks',");
    expect(app).toContain("const OWNER_ONLY_TABS = new Set(['dfs']);");
    expect(app).toContain("const AI_ONLY_TABS = new Set(['props']);");
    expect(app).toContain('profileCanUseLocalTracking');
    expect(app).toContain("{activeTab === 'futures' && <div");
    expect(app).toContain('profileCanAccessOwnerPortfolio={profileCanUseLocalTracking}');
    expect(app).toContain("{activeTab === 'bankroll' && profileCanUseLocalTracking &&");
    expect(app).toContain("{activeTab === 'mycard' && profileCanUseLocalTracking &&");
    expect(app).toContain("onPlaceBet={profileCanUseLocalTracking ? handleBet : undefined}");
    expect(app).toContain("onOpenCard={profileCanUseLocalTracking ? () => openModal('myCard') : undefined}");
    expect(header).toContain('profileCanAccessOwnerPortfolio');
    expect(header).toContain('profileCanUseLocalTracking');
    expect(header).toContain("dimmed={visibleHubs && !visibleHubs.includes('futures')}");
    expect(header).toContain('{profileCanAccessOwnerPortfolio && (');
    expect(futuresHub).toContain('profileCanUseAI = true');
    expect(futuresHub).toContain("profileCanUseAI && { id: 'futures-ai'");
    expect(futuresHub).toContain("profileCanAccessOwnerPortfolio && { id: 'portfolio'");
    expect(bankroll).toContain('configureBankrollStorageScope');
    expect(futures).toContain('configureFuturesStorageScope');
    expect(picks).toContain('configurePicksStorageScope');
    expect(bankroll).toContain('if (storageScope?.disableCloudSync) return Promise.resolve();');
    expect(picks).toContain('if (storageScope?.disableCloudSync) return Promise.resolve();');
  });
});
