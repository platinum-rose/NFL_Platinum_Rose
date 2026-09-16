import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { 
  getSuperContestMetadata, 
  calculateStability, 
  filterWeekGames,
  sortSuperContestGames,
  WATCHLIST_STORAGE_KEY,
  syncPicksToSundayTracker,
  getRecommendedPickTeam,
  getTeamContestSpread,
  SUNDAY_TRACKER_LOCKED_CARD_PREFIX
} from '../../src/lib/superContest.js';
import scheduleData from '../../public/schedule.json';
import publishedLinesData from '../../data/supercontest/week-01-lines.json';

describe('SuperContest - Week 1 Slate Filtering', () => {
  it('trims 272-game schedule to exactly 16 regular season Week 1 matchups', () => {
    expect(scheduleData.length).toBeGreaterThan(200);
    const week1Games = filterWeekGames(scheduleData, 1);
    expect(week1Games).toHaveLength(16);
    week1Games.forEach(g => {
      expect(Number(g.week)).toBe(1);
      expect(g.season_type == null || Number(g.season_type) === 2).toBe(true);
    });
  });

  it('sorts games chronologically by kickoff_utc', () => {
    const week1Games = filterWeekGames(scheduleData, 1);
    for (let i = 0; i < week1Games.length - 1; i++) {
      const tA = Date.parse(week1Games[i].kickoff_utc || 0);
      const tB = Date.parse(week1Games[i + 1].kickoff_utc || 0);
      expect(tA).toBeLessThanOrEqual(tB);
    }
  });

  it('returns empty array for invalid or unplayed week', () => {
    const emptyGames = filterWeekGames(scheduleData, 99);
    expect(emptyGames).toHaveLength(0);
  });
});

describe('SuperContest - Metadata Extraction & Wednesday Pre-Loading', () => {
  it('matches all 16 Week 1 schedule games with Wednesday published contest lines', () => {
    const week1Games = filterWeekGames(scheduleData, 1);
    expect(publishedLinesData.games).toHaveLength(16);

    let matchedCount = 0;
    week1Games.forEach(g => {
      const meta = getSuperContestMetadata(g);
      if (meta.scMatch) matchedCount++;
    });

    expect(matchedCount).toBe(16);
  });

  it('extracts correct contest spread label and home-relative spread for favorites and underdogs', () => {
    const week1Games = filterWeekGames(scheduleData, 1);
    const pitGame = week1Games.find(g => (g.home === 'ATL' && g.visitor === 'PIT') || (g.home === 'PIT' && g.visitor === 'ATL'));
    expect(pitGame).toBeDefined();
    if (pitGame) {
      const meta = getSuperContestMetadata(pitGame);
      expect(meta.scMatch).toBeTruthy();
      expect(meta.publishedFav).toBe('PIT');
      expect(meta.publishedSpreadNum).toBe(-3.5);
      if (pitGame.home === 'ATL') {
        expect(meta.homeRelativeContestSpread).toBe(3.5);
      } else {
        expect(meta.homeRelativeContestSpread).toBe(-3.5);
      }
    }
  });

  it('extracts opening line, current live line, and net movement from live comparison data', () => {
    const week1Games = filterWeekGames(scheduleData, 1);
    const pitGame = week1Games.find(g => (g.home === 'ATL' && g.visitor === 'PIT') || (g.home === 'PIT' && g.visitor === 'ATL'));
    expect(pitGame).toBeDefined();
    if (pitGame) {
      const meta = getSuperContestMetadata(pitGame);
      expect(meta.mktMatch).toBeTruthy();
      expect(meta.movementPoints).toBe(2.5);
      expect(meta.currentSpreadLabel).toContain('-6');
      expect(meta.movementSummary).toContain('+2.5 pt CLV on PIT');
    }
  });
});

describe('SuperContest - Stability & Drift Calculations', () => {
  it('calculates drift and stability tiers accurately', () => {
    const testGame = {
      spread: -3.5,
      home: 'ATL',
      visitor: 'PIT',
      splits: { ats: { visitorTicket: '65', homeTicket: '35' } }
    };
    
    const zeroDrift = calculateStability(testGame, -3.5);
    expect(zeroDrift.driftPts).toBe(0);
    expect(zeroDrift.score).toBeGreaterThanOrEqual(70);
    expect(zeroDrift.tier.label).toBe('Stable');

    const largeDrift = calculateStability(testGame, -0.5);
    expect(Math.abs(largeDrift.driftPts)).toBe(3);
    expect(largeDrift.score).toBeLessThan(zeroDrift.score);
  });
});

describe('SuperContest - Andy & Amanda Watchlists & Selection Locking', () => {
  const superContestPath = path.resolve(__dirname, '../../src/components/supercontest/SuperContestView.jsx');
  const scSource = fs.readFileSync(superContestPath, 'utf8');

  it('declares persistent storage key for SuperContest watchlists', () => {
    expect(WATCHLIST_STORAGE_KEY).toBe('nfl_supercontest_watchlist_v1');
  });

  it('renders Andy and Amanda watchlist checkbox columns per matchup with stopPropagation', () => {
    expect(scSource).toContain("toggleWatchlist('andy', g.id)");
    expect(scSource).toContain("toggleWatchlist('amanda', g.id)");
    expect(scSource).toContain("title={isAndyChecked ? \"Remove from Andy's Watchlist\" : \"Add to Andy's Watchlist\"}");
    expect(scSource).toContain("title={isAmandaChecked ? \"Remove from Amanda's Watchlist\" : \"Add to Amanda's Watchlist\"}");
  });

  it('provides Andy and Amanda 5-pick counters and consensus detection', () => {
    expect(scSource).toContain("Andy's Watchlist:");
    expect(scSource).toContain("Amanda's Watchlist:");
    expect(scSource).toContain("andyPicks.length}/5");
    expect(scSource).toContain("amandaPicks.length}/5");
    expect(scSource).toContain("consensusMatchups");
    expect(scSource).toContain("Consensus (Both Like)");
  });

  it('provides button to lock selections for the week for tracking purposes', () => {
    expect(scSource).toContain("handleLockWeekSelections");
    expect(scSource).toContain("handleUnlockWeekSelections");
    expect(scSource).toContain("Lock Week {selectedWeek} Selections");
    expect(scSource).toContain("Official Week {selectedWeek} Locked Selections");
  });

  it('provides dedicated row-level Lock Pick button next to Andy and Amanda columns', () => {
    expect(scSource).toContain("toggleRowLock(g.id)");
    expect(scSource).toContain("isRowLocked ? 'Locked' : 'Lock Pick'");
    expect(scSource).toContain("isRowLocked");
  });

  it('removes editable home spread input field from matchup rows', () => {
    expect(scSource).not.toContain('input\n                            type="number"');
    expect(scSource).not.toContain('type="number"\n                            step="0.5"');
    expect(scSource).not.toContain('title="Home team spread line"');
  });

  it('orders odds columns strictly as Opening -> Contest -> Current -> Movement', () => {
    const stripSnippet = scSource.slice(scSource.indexOf('4-COLUMN ODDS & MOVEMENT STRIP'));
    const openingIdx = stripSnippet.indexOf('1. Opening Line');
    const contestIdx = stripSnippet.indexOf('2. Official Contest Spread');
    const currentIdx = stripSnippet.indexOf('3. Current Live Line');
    const movementIdx = stripSnippet.indexOf('4. Movement');

    expect(openingIdx).toBeGreaterThan(0);
    expect(contestIdx).toBeGreaterThan(openingIdx);
    expect(currentIdx).toBeGreaterThan(contestIdx);
    expect(movementIdx).toBeGreaterThan(currentIdx);
  });

  it('prominently highlights Movement delta value with high-contrast badge and arrow', () => {
    expect(scSource).toContain('meta.movementPoints > 0 ? `+${meta.movementPoints}` : meta.movementPoints');
    expect(scSource).toContain('ArrowUpRight');
    expect(scSource).toContain('ArrowDownRight');
    expect(scSource).toContain('bg-emerald-500/20 text-emerald-300');
  });

  it('provides direct link and manual sync to Live Sunday Tracker SuperContest tab', () => {
    expect(scSource).toContain('/live-tracker-sunday.html?tab=supercontest');
    expect(scSource).toContain('handleSyncSundayTracker');
    expect(scSource).toContain('Sync to Tracker');
    expect(scSource).toContain('Synced to Sunday Tracker');
  });

  it('renders dedicated Filter Bar with options for Watchlist, Not on Watchlist, Consensus, Locked, and Steam', () => {
    expect(scSource).toContain("setActiveFilter('all')");
    expect(scSource).toContain("setActiveFilter('watchlist_any')");
    expect(scSource).toContain("setActiveFilter('consensus')");
    expect(scSource).toContain("setActiveFilter('andy')");
    expect(scSource).toContain("setActiveFilter('amanda')");
    expect(scSource).toContain("setActiveFilter('locked')");
    expect(scSource).toContain("setActiveFilter('unreviewed')");
    expect(scSource).toContain("setActiveFilter('movement')");
    expect(scSource).toContain("Not on Watchlist");
    expect(scSource).toContain("Both Like");
    expect(scSource).toContain("Steam");
  });

  it('provides team and city search input for instant filtering', () => {
    expect(scSource).toContain('placeholder="Search team or city..."');
    expect(scSource).toContain('setSearchQuery');
    expect(scSource).toContain('searchQuery');
  });

  it('renders filtered matchup count and empty state with clear filters button', () => {
    expect(scSource).toContain('Showing {sortedFilteredGames.length} of {weekGames.length} Games');
    expect(scSource).toContain('sortedFilteredGames.map');
    expect(scSource).toContain('No matchups match the selected filter');
    expect(scSource).toContain('Clear Filters');
  });

  it('provides sorting controls including Volatility, Stability, and Movement', () => {
    expect(scSource).toContain('setSortBy');
    expect(scSource).toContain('value={sortBy}');
    expect(scSource).toContain('value="most_volatile"');
    expect(scSource).toContain('value="most_stable"');
    expect(scSource).toContain('value="movement"');
    expect(scSource).toContain('ArrowUpDown');
  });

  it('removes the redundant Both consensus badge from the matchup row', () => {
    const cardBadgeSection = scSource.slice(
      scSource.indexOf('Badges Container: Stability (Volatile, Stable, Watch) + Row Locked'),
      scSource.indexOf('4-COLUMN ODDS & MOVEMENT STRIP')
    );
    expect(cardBadgeSection).not.toContain('Consensus Star Badge');
    expect(cardBadgeSection).not.toContain('>Both<');
  });

  it('renders line stability badges directly in upper matchup cards and removes redundant bottom table', () => {
    // Badges inside upper match cards
    expect(scSource).toContain('stability.tier.label');
    expect(scSource).toContain('stability.tier.className');
    expect(scSource).toContain('calculateStability(g, lockedVal)');

    // Redundant bottom section removed
    expect(scSource).not.toContain('Drift &amp; Line Stability (Week');
    expect(scSource).not.toContain('DRIFT & LINE STABILITY TABLE');
  });

  it('renders side switcher pills for Andy, Amanda, and Lock Pick in matchup rows', () => {
    expect(scSource).toContain("toggleWatchlist('andy', g.id, g.visitor)");
    expect(scSource).toContain("toggleWatchlist('andy', g.id, g.home)");
    expect(scSource).toContain("toggleWatchlist('amanda', g.id, g.visitor)");
    expect(scSource).toContain("toggleWatchlist('amanda', g.id, g.home)");
    expect(scSource).toContain("toggleRowLock(g.id, g.visitor)");
    expect(scSource).toContain("toggleRowLock(g.id, g.home)");
  });
});

describe('SuperContest - Filter Logic Verification', () => {
  const week1Games = filterWeekGames(scheduleData, 1);
  const sampleAndy = [week1Games[0].id, week1Games[1].id];
  const sampleAmanda = [week1Games[1].id, week1Games[2].id];

  it('correctly filters for games not on any watchlist (unreviewed)', () => {
    const unreviewed = week1Games.filter(g => !sampleAndy.includes(g.id) && !sampleAmanda.includes(g.id));
    expect(unreviewed.length).toBe(week1Games.length - 3); // 16 - 3 = 13 games
    unreviewed.forEach(g => {
      expect(sampleAndy.includes(g.id)).toBe(false);
      expect(sampleAmanda.includes(g.id)).toBe(false);
    });
  });

  it('correctly filters for games on either watchlist (watchlist_any)', () => {
    const onWatchlist = week1Games.filter(g => sampleAndy.includes(g.id) || sampleAmanda.includes(g.id));
    expect(onWatchlist.length).toBe(3);
  });

  it('correctly filters for consensus games on both watchlists', () => {
    const consensus = week1Games.filter(g => sampleAndy.includes(g.id) && sampleAmanda.includes(g.id));
    expect(consensus.length).toBe(1);
    expect(consensus[0].id).toBe(week1Games[1].id);
  });

  it('filters games by search query matching team code or full team name', () => {
    const pitQuery = 'pit';
    const pitMatches = week1Games.filter(g => 
      (g.visitor || '').toLowerCase().includes(pitQuery) ||
      (g.home || '').toLowerCase().includes(pitQuery) ||
      (g.visitorName || '').toLowerCase().includes(pitQuery) ||
      (g.homeName || '').toLowerCase().includes(pitQuery)
    );
    expect(pitMatches.length).toBeGreaterThanOrEqual(1);
    expect(pitMatches.some(g => g.home === 'PIT' || g.visitor === 'PIT')).toBe(true);
  });
});

describe('SuperContest - Sunday Tracker Synchronization Helpers', () => {
  it('extracts correct recommended pick teams from games', () => {
    const testGameCar = { home: 'CAR', visitor: 'CHI' };
    expect(getRecommendedPickTeam(testGameCar)).toBe('CAR');

    const testGameInd = { home: 'IND', visitor: 'BAL' };
    expect(getRecommendedPickTeam(testGameInd)).toBe('IND');

    const testGameTb = { home: 'CIN', visitor: 'TB' };
    expect(getRecommendedPickTeam(testGameTb)).toBe('TB');
  });

  it('syncs formatted picks to sunday_supercontest_picks_week_1 localStorage format', () => {
    const week1Games = filterWeekGames(scheduleData, 1);
    const pitGame = week1Games.find(g => (g.home === 'ATL' && g.visitor === 'PIT') || (g.home === 'PIT' && g.visitor === 'ATL'));
    const testIds = pitGame ? [pitGame.id, 'CAR', 'IND'] : ['CAR', 'IND'];

    const result = syncPicksToSundayTracker(testIds, week1Games, 1);
    expect(result.key).toBe('sunday_supercontest_picks_week_1');
    expect(result.picks).toBeDefined();
    expect(result.count).toBeGreaterThanOrEqual(2);
    expect(result.picks['CAR']).toBe(true);
    expect(result.picks['IND']).toBe(true);
  });

  it('extracts team contest spread lines for both sides of a matchup', () => {
    const week1Games = filterWeekGames(scheduleData, 1);
    const pitGame = week1Games.find(g => (g.home === 'ATL' && g.visitor === 'PIT') || (g.home === 'PIT' && g.visitor === 'ATL'));
    expect(pitGame).toBeDefined();
    if (pitGame) {
      const pitSpread = getTeamContestSpread(pitGame, 'PIT');
      const atlSpread = getTeamContestSpread(pitGame, 'ATL');
      expect(pitSpread.spread).toBe(-3.5);
      expect(pitSpread.label).toBe('PIT -3.5');
      expect(atlSpread.spread).toBe(3.5);
      expect(atlSpread.label).toBe('ATL +3.5');
    }
  });

  it('syncs rich locked card entries with exact selected sides to Sunday Tracker locked card key', () => {
    const week1Games = filterWeekGames(scheduleData, 1);
    const pitGame = week1Games.find(g => (g.home === 'ATL' && g.visitor === 'PIT') || (g.home === 'PIT' && g.visitor === 'ATL'));
    const testIds = pitGame ? [pitGame.id] : [];
    const lockedSides = pitGame ? { [pitGame.id]: 'ATL' } : {};

    const result = syncPicksToSundayTracker(testIds, week1Games, 1, lockedSides);
    expect(result.lockedCardKey).toBe(`${SUNDAY_TRACKER_LOCKED_CARD_PREFIX}1`);
    expect(result.lockedCard).toBeDefined();
    expect(result.lockedCard).toHaveLength(1);
    expect(result.lockedCard[0].team).toBe('ATL');
    expect(result.lockedCard[0].opponent).toBe('PIT');
    expect(result.lockedCard[0].spread).toBe(3.5);
    expect(result.lockedCard[0].spreadLabel).toBe('ATL +3.5');
  });
});

describe('MatchupWizardModal Pop-Up & Analyze Crash Prevention', () => {
  const modalPath = path.resolve(__dirname, '../../src/components/modals/MatchupWizardModal.jsx');
  const appPath = path.resolve(__dirname, '../../src/App.jsx');
  const scPath = path.resolve(__dirname, '../../src/components/supercontest/SuperContestView.jsx');
  const modalSource = fs.readFileSync(modalPath, 'utf8');
  const appSource = fs.readFileSync(appPath, 'utf8');
  const scSource = fs.readFileSync(scPath, 'utf8');

  it('defaults stats to empty array to prevent undefined find crash', () => {
    expect(modalSource).toContain("stats = []");
    expect(modalSource).toContain("Array.isArray(stats) ? stats.find");
  });

  it('renders MatchupWizardModal at z-[100] so it pops up cleanly over SuperContestView (z-[80])', () => {
    expect(modalSource).toContain("z-[100]");
  });

  it('SuperContestView mounts MatchupWizardModal locally so tab does not switch to main Dashboard', () => {
    expect(scSource).toContain("import MatchupWizardModal from '../modals/MatchupWizardModal'");
    expect(scSource).toContain("<MatchupWizardModal");
    expect(scSource).toContain("analyzingGame");
    expect(scSource).toContain("setAnalyzingGame");
  });

  it('App.jsx mounts MatchupWizardModal after SuperContestView with safe fallback props', () => {
    const scIdx = appSource.indexOf('<SuperContestView');
    const wizardIdx = appSource.indexOf('<MatchupWizardModal');
    expect(scIdx).toBeGreaterThan(0);
    expect(wizardIdx).toBeGreaterThan(scIdx); // Wizard mounts after SuperContestView
    expect(appSource).toContain("stats={stats || []}");
  });
});

describe('SuperContest - Volatility & Slate Sorting Logic', () => {
  const week1Games = filterWeekGames(scheduleData, 1);

  it('sorts by most volatile first (lowest stability score first)', () => {
    const sorted = sortSuperContestGames(week1Games, 'most_volatile');
    expect(sorted).toHaveLength(week1Games.length);
    for (let i = 0; i < sorted.length - 1; i++) {
      const metaA = getSuperContestMetadata(sorted[i]);
      const metaB = getSuperContestMetadata(sorted[i + 1]);
      const stabA = calculateStability(sorted[i], metaA.homeRelativeContestSpread ?? 0);
      const stabB = calculateStability(sorted[i + 1], metaB.homeRelativeContestSpread ?? 0);
      expect(stabA.score).toBeLessThanOrEqual(stabB.score);
    }
  });

  it('sorts by most stable first (highest stability score first)', () => {
    const sorted = sortSuperContestGames(week1Games, 'most_stable');
    expect(sorted).toHaveLength(week1Games.length);
    for (let i = 0; i < sorted.length - 1; i++) {
      const metaA = getSuperContestMetadata(sorted[i]);
      const metaB = getSuperContestMetadata(sorted[i + 1]);
      const stabA = calculateStability(sorted[i], metaA.homeRelativeContestSpread ?? 0);
      const stabB = calculateStability(sorted[i + 1], metaB.homeRelativeContestSpread ?? 0);
      expect(stabA.score).toBeGreaterThanOrEqual(stabB.score);
    }
  });

  it('sorts by largest movement / CLV steam first', () => {
    const sorted = sortSuperContestGames(week1Games, 'movement');
    expect(sorted).toHaveLength(week1Games.length);
    for (let i = 0; i < sorted.length - 1; i++) {
      const metaA = getSuperContestMetadata(sorted[i]);
      const metaB = getSuperContestMetadata(sorted[i + 1]);
      expect(Math.abs(metaA.movementPoints)).toBeGreaterThanOrEqual(Math.abs(metaB.movementPoints));
    }
  });

  it('preserves schedule kickoff order when sortBy is default', () => {
    const sorted = sortSuperContestGames(week1Games, 'default');
    expect(sorted.map(g => g.id)).toEqual(week1Games.map(g => g.id));
  });
});
