// src/lib/injuries.js
// NFL Injury tracking and data fetching

import logger from './logger';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from './storage.js';

// Try multiple ESPN API endpoints for injury data
const ESPN_INJURY_APIS = [
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{TEAM_ID}/injuries",
    "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/2/teams/{TEAM_ID}/injuries",
    "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/types/2/teams/{TEAM_ID}/injuries",
    "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/types/2/teams/{TEAM_ID}/injuries"
];

// Team ID mapping for ESPN API
const ESPN_TEAM_IDS = {
    'ARI': 22, 'ATL': 1, 'BAL': 33, 'BUF': 2, 'CAR': 29, 'CHI': 3, 'CIN': 4, 'CLE': 5,
    'DAL': 6, 'DEN': 7, 'DET': 8, 'GB': 9, 'HOU': 34, 'IND': 11, 'JAX': 30, 'KC': 12,
    'LV': 13, 'LAC': 24, 'LAR': 14, 'MIA': 15, 'MIN': 16, 'NE': 17, 'NO': 18, 'NYG': 19,
    'NYJ': 20, 'PHI': 21, 'PIT': 23, 'SF': 25, 'SEA': 26, 'TB': 27, 'TEN': 28, 'WAS': 35
};

// Injury status mapping
const INJURY_STATUS = {
    'OUT': { label: 'OUT', color: '#ef4444', priority: 1 },
    'DOUBTFUL': { label: 'D', color: '#f97316', priority: 2 },
    'QUESTIONABLE': { label: 'Q', color: '#eab308', priority: 3 },
    'PROBABLE': { label: 'P', color: '#22c55e', priority: 4 },
    'HEALTHY': { label: '', color: '#22c55e', priority: 5 }
};

// Mock injury data for testing/fallback (February 2026 - realistic injuries)
const MOCK_INJURIES = {
    'SEA': [
        { name: 'DK Metcalf', position: 'WR', status: 'QUESTIONABLE', injury: 'Knee', impact: 'high' },
        { name: 'Tyler Lockett', position: 'WR', status: 'DOUBTFUL', injury: 'Hamstring', impact: 'high' },
        { name: 'Jamal Adams', position: 'S', status: 'OUT', injury: 'Finger', impact: 'medium' }
    ],
    'NE': [
        { name: 'Mac Jones', position: 'QB', status: 'OUT', injury: 'Shoulder', impact: 'critical' },
        { name: 'Mike Gesicki', position: 'TE', status: 'QUESTIONABLE', injury: 'Ankle', impact: 'medium' },
        { name: 'Rhamondre Stevenson', position: 'RB', status: 'QUESTIONABLE', injury: 'Ankle', impact: 'high' }
    ],
    // Add more teams for future games
    'KC': [
        { name: 'Patrick Mahomes', position: 'QB', status: 'QUESTIONABLE', injury: 'Ankle', impact: 'critical' },
        { name: 'Travis Kelce', position: 'TE', status: 'DOUBTFUL', injury: 'Knee', impact: 'high' }
    ],
    'BUF': [
        { name: 'Josh Allen', position: 'QB', status: 'QUESTIONABLE', injury: 'Elbow', impact: 'critical' },
        { name: 'Stefon Diggs', position: 'WR', status: 'OUT', injury: 'Oblique', impact: 'high' }
    ],
    'SF': [
        { name: 'Brock Purdy', position: 'QB', status: 'DOUBTFUL', injury: 'Shoulder', impact: 'critical' },
        { name: 'Christian McCaffrey', position: 'RB', status: 'OUT', injury: 'Achilles', impact: 'critical' }
    ]
};

/**
 * Fetch injury data for a specific team, plus whether it came from the
 * live ESPN feed or the mock fallback (F-27c). Internal — callers that
 * only need the array should use the public `fetchTeamInjuries` below.
 */
const _fetchTeamInjuriesWithSource = async (teamAbbrev) => {
    const teamId = ESPN_TEAM_IDS[teamAbbrev?.toUpperCase()];
    if (!teamId) {
        logger.warn(`⚠️ No ESPN team ID for: ${teamAbbrev}`);
        return { injuries: MOCK_INJURIES[teamAbbrev] || [], isMock: true };
    }

    // Try multiple API endpoints until one works
    for (let i = 0; i < ESPN_INJURY_APIS.length; i++) {
        const apiUrl = ESPN_INJURY_APIS[i];
        try {
            const url = apiUrl.replace('{TEAM_ID}', teamId);

            const response = await fetch(url);

            if (!response.ok) {
                if (i === 0) logger.log(`🏥 ESPN API ${response.status} for ${teamAbbrev}, trying alternatives...`);
                continue; // Try next API
            }

            const data = await response.json();
            const injuries = normalizeInjuries(data.items || data.injuries || []);
            logger.log(`✅ Live injuries for ${teamAbbrev}: ${injuries.length} players`);
            return { injuries, isMock: false };

        } catch (_error) {
            if (i === 0) logger.log(`🏥 ESPN API error for ${teamAbbrev}, trying alternatives...`);
            continue; // Try next API
        }
    }

    // All APIs failed, use mock data
    logger.log(`🏥 Using mock injuries for ${teamAbbrev}: ${(MOCK_INJURIES[teamAbbrev] || []).length} players`);
    return { injuries: MOCK_INJURIES[teamAbbrev] || [], isMock: true };
};

/**
 * Fetch injury data for a specific team
 */
export const fetchTeamInjuries = async (teamAbbrev) => {
    const { injuries } = await _fetchTeamInjuriesWithSource(teamAbbrev);
    return injuries;
};

/**
 * Persist which teams fell back to mock data on the last `fetchAllInjuries`
 * run, so the UI can warn when injury data isn't live (F-27c — mirrors the
 * isMock pattern in enhancedOddsApi.js's getOddsQuotaState).
 */
const _setInjurySourceState = (mockTeams) => {
    saveToStorage(PR_STORAGE_KEYS.INJURY_SOURCE.key, {
        mockTeams,
        fetchedAt: Date.now(),
    });
};

/**
 * Returns { mockTeams: string[], isMock: boolean, fetchedAt: number|null }
 * describing whether the last injury fetch fell back to mock/stale data,
 * and for which teams specifically.
 */
export const getInjuryDataSourceState = () => {
    const state = loadFromStorage(PR_STORAGE_KEYS.INJURY_SOURCE.key, null);
    if (!state) return { mockTeams: [], isMock: false, fetchedAt: null };
    const mockTeams = state.mockTeams || [];
    return { mockTeams, isMock: mockTeams.length > 0, fetchedAt: state.fetchedAt || null };
};

/**
 * Fetch injuries for all teams in the schedule
 */
export const fetchAllInjuries = async (schedule = []) => {
    logger.log("🏥 Fetching injury reports for all teams...");

    const teams = new Set();
    schedule.forEach(game => {
        if (game.home) teams.add(game.home);
        if (game.visitor) teams.add(game.visitor);
    });

    const injuryPromises = Array.from(teams).map(async team => {
        const { injuries, isMock } = await _fetchTeamInjuriesWithSource(team);
        return { team, injuries, isMock };
    });

    const results = await Promise.all(injuryPromises);

    // Convert to object format: { "SEA": [...], "NE": [...] }
    const injuryData = {};
    const mockTeams = [];
    results.forEach(({ team, injuries, isMock }) => {
        injuryData[team] = injuries;
        if (isMock) mockTeams.push(team);
    });
    _setInjurySourceState(mockTeams);

    const totalInjuries = Object.values(injuryData).reduce((sum, arr) => sum + arr.length, 0);
    logger.log(`✅ Injury reports loaded: ${totalInjuries} injuries across ${teams.size} teams (${mockTeams.length} mock fallback)`);

    return injuryData;
};

/**
 * Normalize ESPN injury data to our format
 */
const normalizeInjuries = (espnInjuries) => {
    return espnInjuries.map(injury => {
        const athlete = injury.athlete || {};
        const status = mapInjuryStatus(injury.status);
        
        return {
            name: athlete.displayName || 'Unknown',
            position: athlete.position?.abbreviation || 'N/A',
            status: status,
            injury: injury.type || 'Undisclosed',
            impact: calculateImpact(athlete.position?.abbreviation, status),
            lastUpdate: injury.date || new Date().toISOString()
        };
    });
};

/**
 * Map ESPN status to our standard format
 */
const mapInjuryStatus = (espnStatus) => {
    const statusMap = {
        'Active': 'HEALTHY',
        'Out': 'OUT',
        'Doubtful': 'DOUBTFUL', 
        'Questionable': 'QUESTIONABLE',
        'Probable': 'PROBABLE'
    };
    return statusMap[espnStatus] || 'QUESTIONABLE';
};

/**
 * Calculate injury impact based on position and status
 */
const calculateImpact = (position, status) => {
    if (status === 'OUT') {
        // Critical positions
        if (['QB', 'RB1', 'WR1', 'TE1'].includes(position)) return 'critical';
        // High impact positions
        if (['WR', 'RB', 'TE', 'OL'].includes(position)) return 'high';
        return 'medium';
    }
    if (status === 'DOUBTFUL') {
        if (['QB', 'RB1', 'WR1'].includes(position)) return 'high';
        return 'medium';
    }
    return 'low';
};

/**
 * Get top injuries for a team (for display on matchup cards)
 */
export const getTopInjuries = (teamInjuries = [], limit = 3) => {
    return teamInjuries
        .filter(injury => injury.status !== 'HEALTHY')
        .sort((a, b) => {
            // Sort by impact priority, then status priority
            const impactPriority = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
            const aImpact = impactPriority[a.impact] || 4;
            const bImpact = impactPriority[b.impact] || 4;
            
            if (aImpact !== bImpact) return aImpact - bImpact;
            
            const aStatus = INJURY_STATUS[a.status]?.priority || 5;
            const bStatus = INJURY_STATUS[b.status]?.priority || 5;
            return aStatus - bStatus;
        })
        .slice(0, limit);
};

/**
 * Get injury status styling
 */
export const getInjuryStatusStyle = (status) => {
    return INJURY_STATUS[status] || INJURY_STATUS['QUESTIONABLE'];
};

/**
 * Roll a team's injury list up into a single "how bad is this" summary.
 * Shared by InjuryReportModal (per-game) and InjuryCenter (league-wide, F-25)
 * so the two views agree on what counts as critical/high/etc.
 * `rank` is lower = worse, for sorting teams worst-first.
 */
export const getTeamImpactSummary = (teamInjuries = []) => {
    const criticalCount = teamInjuries.filter(i => i.impact === 'critical').length;
    const highCount = teamInjuries.filter(i => i.impact === 'high').length;

    if (criticalCount > 0) return { level: 'critical', text: `${criticalCount} Critical`, rank: 0 };
    if (highCount > 1) return { level: 'high', text: `${highCount} High Impact`, rank: 1 };
    if (highCount > 0) return { level: 'medium', text: `${highCount} Notable`, rank: 2 };
    if (teamInjuries.length > 0) return { level: 'low', text: 'Minor', rank: 3 };
    return { level: 'none', text: 'Clear', rank: 4 };
};

export { INJURY_STATUS };