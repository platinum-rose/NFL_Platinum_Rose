// src/lib/bankroll.js
// Bankroll management, bet tracking, and analytics

import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from './storage';
import { syncBet } from './supabase';
import { enqueueDirty, dequeueSuccess } from './syncQueue';

// Sync helper — writes locally first, queues for retry on cloud failure
const fireSync = (bet) =>
    syncBet(bet)
        .then(() => dequeueSuccess('bet', bet.id))
        .catch(() => enqueueDirty('bet', bet.id, bet));

const STORAGE_KEY = PR_STORAGE_KEYS.BANKROLL.key;

// Default bankroll settings
const DEFAULT_SETTINGS = {
    totalBankroll: 1000,
    unitSize: 50, // Default: 5% of bankroll (50/1000)
    unitPercentage: 5, // 5%
    currency: 'USD',
    riskTolerance: 'moderate' // conservative, moderate, aggressive
};

// Bet status types
export const BET_STATUS = {
    PENDING: 'pending',
    WON: 'won',
    LOST: 'lost',
    PUSHED: 'pushed',
    VOID: 'void'
};

// Bet types
export const BET_TYPES = {
    SPREAD: 'spread',
    MONEYLINE: 'moneyline',
    TOTAL: 'total',
    PROP: 'prop',
    TEASER: 'teaser',
    PARLAY: 'parlay',
    FUTURES: 'futures'
};

// Risk tolerance settings
const RISK_PROFILES = {
    conservative: { maxUnitPercentage: 3, recommendedUnit: 1 },
    moderate: { maxUnitPercentage: 5, recommendedUnit: 2 },
    aggressive: { maxUnitPercentage: 10, recommendedUnit: 3 }
};

/**
 * Get current bankroll data from localStorage
 */
export const getBankrollData = () => {
    try {
        const stored = loadFromStorage(STORAGE_KEY, null);
        if (!stored) {
            const defaultData = {
                settings: DEFAULT_SETTINGS,
                bets: [],
                weeklyStats: {},
                lastUpdated: new Date().toISOString()
            };
            saveBankrollData(defaultData);
            return defaultData;
        }
        return stored;
    } catch (error) {
        console.error('Error loading bankroll data:', error);
        return {
            settings: DEFAULT_SETTINGS,
            bets: [],
            weeklyStats: {},
            lastUpdated: new Date().toISOString()
        };
    }
};

/**
 * Save bankroll data to localStorage
 */
export const saveBankrollData = (data) => {
    try {
        data.lastUpdated = new Date().toISOString();
        saveToStorage(STORAGE_KEY, data);
        return true;
    } catch (error) {
        console.error('Error saving bankroll data:', error);
        return false;
    }
};

/**
 * Add a new bet to tracking
 */
export const addBet = (bet) => {
    const data = getBankrollData();
    const newBet = {
        id: generateBetId(),
        timestamp: new Date().toISOString(),
        week: getCurrentWeek(),
        status: BET_STATUS.PENDING,
        // Support for imported bets and parlays
        isParlay: bet.isParlay || false,
        isHedgingBet: bet.isHedgingBet || false,
        openSlots: bet.openSlots || 0,
        legs: bet.legs || [],
        source: bet.source || 'Manual',
        ticketNumber: bet.ticketNumber || null,
        imported: bet.imported || false,
        importedAt: bet.importedAt || null,
        description: bet.description || '',
        potentialWin: bet.potentialWin || 0,
        ...bet
    };

    data.bets.push(newBet);
    saveBankrollData(data);
    fireSync(newBet);  // cloud sync — non-blocking
    return newBet;
};

/**
 * Update bet result (win/loss/push)
 */
export const updateBetResult = (betId, status, actualOdds = null) => {
    const data = getBankrollData();
    const betIndex = data.bets.findIndex(bet => bet.id === betId);

    if (betIndex === -1) return false;

    const bet = data.bets[betIndex];
    bet.status = status;
    bet.settledAt = new Date().toISOString();

    // Calculate profit/loss
    if (status === BET_STATUS.WON) {
        const odds = actualOdds || bet.odds;
        bet.profit = calculateProfit(bet.amount, odds);
    } else if (status === BET_STATUS.LOST) {
        bet.profit = -bet.amount;
    } else if (status === BET_STATUS.PUSHED || status === BET_STATUS.VOID) {
        bet.profit = 0;
    }

    data.bets[betIndex] = bet;
    saveBankrollData(data);
    fireSync(bet);  // cloud sync — non-blocking
    return true;
};

/**
 * Update bet details (for editing bet information, not just results)
 */
export const updateBet = (betId, updatedBet) => {
    const data = getBankrollData();
    const betIndex = data.bets.findIndex(bet => bet.id === betId);

    if (betIndex === -1) return false;

    // Preserve original metadata and update with new data
    const originalBet = data.bets[betIndex];
    const updatedBetData = {
        ...originalBet,
        ...updatedBet,
        updatedAt: new Date().toISOString()
    };

    data.bets[betIndex] = updatedBetData;
    saveBankrollData(data);
    fireSync(updatedBetData);  // cloud sync — non-blocking
    return true;
};

/**
 * Calculate profit based on American odds
 */
const calculateProfit = (wagerAmount, americanOdds) => {
    if (americanOdds > 0) {
        // Positive odds: profit = wager * (odds / 100)
        return wagerAmount * (americanOdds / 100);
    } else {
        // Negative odds: profit = wager / (odds / -100)
        return wagerAmount / (Math.abs(americanOdds) / 100);
    }
};

/**
 * Calculate optimal unit size using Kelly Criterion
 */
export const calculateKellyUnit = (winProbability, odds, bankroll) => {
    const b = Math.abs(odds) > 100 ? (odds > 0 ? odds / 100 : 100 / Math.abs(odds)) : 1;
    const p = winProbability / 100; // Convert percentage to decimal
    const q = 1 - p;

    // Kelly formula: f = (bp - q) / b
    const kellyFraction = (b * p - q) / b;

    // Cap at 25% max bet size for safety
    const cappedFraction = Math.min(Math.max(kellyFraction, 0), 0.25);

    return bankroll * cappedFraction;
};

/**
 * Get recommended unit size based on confidence and risk profile
 */
export const getRecommendedUnit = (confidence, bankroll, riskProfile = 'moderate') => {
    const profile = RISK_PROFILES[riskProfile];
    const confidenceMultiplier = confidence / 100; // 0-1 scale

    // Base unit percentage from risk profile
    const basePercentage = profile.recommendedUnit;

    // Adjust based on confidence
    const adjustedPercentage = basePercentage * (0.5 + confidenceMultiplier * 0.5);

    // Cap at max for risk profile
    const finalPercentage = Math.min(adjustedPercentage, profile.maxUnitPercentage);

    return {
        amount: bankroll * (finalPercentage / 100),
        percentage: finalPercentage,
        units: finalPercentage / basePercentage
    };
};

/**
 * Calculate current bankroll analytics
 */
export const calculateAnalytics = (timeframe = 'all') => {
    const data = getBankrollData();
    let filteredBets = data.bets;

    // Debug logging
    console.log('🔍 Analytics Debug:', {
        totalBetsInStorage: data.bets.length,
        timeframe: timeframe,
        allBets: data.bets.map(bet => ({
            id: bet.id,
            status: bet.status,
            timestamp: bet.timestamp,
            source: bet.source
        }))
    });

    // Filter by timeframe
    if (timeframe !== 'all') {
        const cutoffDate = getTimeframeCutoff(timeframe);
        filteredBets = data.bets.filter(bet => new Date(bet.timestamp) >= cutoffDate);
    }

    const settledBets = filteredBets.filter(bet =>
        [BET_STATUS.WON, BET_STATUS.LOST, BET_STATUS.PUSHED].includes(bet.status)
    );

    const wins = settledBets.filter(bet => bet.status === BET_STATUS.WON);
    const losses = settledBets.filter(bet => bet.status === BET_STATUS.LOST);
    const pushes = settledBets.filter(bet => bet.status === BET_STATUS.PUSHED);

    const totalWagered = settledBets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalProfit = settledBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);

    const winRate = settledBets.length > 0 ? (wins.length / settledBets.length) * 100 : 0;
    const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;

    // Calculate average odds
    const avgWinOdds = wins.length > 0 ? wins.reduce((sum, bet) => sum + bet.odds, 0) / wins.length : 0;
    const avgLossOdds = losses.length > 0 ? losses.reduce((sum, bet) => sum + bet.odds, 0) / losses.length : 0;

    // Units tracking
    const currentBankroll = data.settings.totalBankroll + totalProfit;
    const unitsWon = totalProfit / data.settings.unitSize;

    // Streak calculations
    const currentStreak = calculateCurrentStreak(settledBets);
    const longestWinStreak = calculateLongestStreak(settledBets, BET_STATUS.WON);
    const longestLossStreak = calculateLongestStreak(settledBets, BET_STATUS.LOST);

    return {
        // Basic stats
        totalBets: filteredBets.length, // All bets, not just settled
        pendingBets: filteredBets.filter(bet => bet.status === BET_STATUS.PENDING).length,
        settledBets: settledBets.length,
        wins: wins.length,
        losses: losses.length,
        pushes: pushes.length,

        // Financial metrics
        totalWagered,
        totalProfit,
        currentBankroll,
        winRate,
        roi,
        unitsWon,

        // Advanced metrics
        avgWinOdds,
        avgLossOdds,
        avgWager: totalWagered / settledBets.length || 0,
        biggestWin: Math.max(...wins.map(bet => bet.profit || 0), 0),
        biggestLoss: Math.min(...losses.map(bet => bet.profit || 0), 0),

        // Streaks
        currentStreak,
        longestWinStreak,
        longestLossStreak,

        // Breakdowns
        betsByType: groupBetsByType(settledBets),
        weeklyPerformance: calculateWeeklyPerformance(settledBets),
        recentForm: calculateRecentForm(settledBets, 10)
    };
};

/**
 * Helper functions
 */
const generateBetId = () => {
    return 'bet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const getCurrentWeek = () => {
    // Simple week calculation - could be enhanced
    const start = new Date('2026-09-01'); // Season start
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
};

const getTimeframeCutoff = (timeframe) => {
    const now = new Date();
    switch (timeframe) {
        case 'today': return new Date(now.setHours(0, 0, 0, 0));
        case 'week': return new Date(now.setDate(now.getDate() - 7));
        case 'month': return new Date(now.setMonth(now.getMonth() - 1));
        case 'season': return new Date('2026-09-01');
        default: return new Date(0);
    }
};

const calculateCurrentStreak = (bets) => {
    if (bets.length === 0) return { type: 'none', count: 0 };

    const sortedBets = [...bets].sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt));
    let count = 0;
    let type = sortedBets[0].status === BET_STATUS.WON ? 'win' : 'loss';

    for (const bet of sortedBets) {
        if (bet.status === BET_STATUS.PUSHED) continue;
        if ((type === 'win' && bet.status === BET_STATUS.WON) ||
            (type === 'loss' && bet.status === BET_STATUS.LOST)) {
            count++;
        } else {
            break;
        }
    }

    return { type, count };
};

const calculateLongestStreak = (bets, status) => {
    let longest = 0;
    let current = 0;

    for (const bet of bets) {
        if (bet.status === status) {
            current++;
            longest = Math.max(longest, current);
        } else if (bet.status !== BET_STATUS.PUSHED) {
            current = 0;
        }
    }

    return longest;
};

const groupBetsByType = (bets) => {
    const grouped = {};
    for (const bet of bets) {
        if (!grouped[bet.type]) {
            grouped[bet.type] = { count: 0, profit: 0, wins: 0 };
        }
        grouped[bet.type].count++;
        grouped[bet.type].profit += bet.profit || 0;
        if (bet.status === BET_STATUS.WON) grouped[bet.type].wins++;
    }
    return grouped;
};

const calculateWeeklyPerformance = (bets) => {
    const weekly = {};
    for (const bet of bets) {
        const week = bet.week || getCurrentWeek();
        if (!weekly[week]) {
            weekly[week] = { profit: 0, bets: 0, wins: 0 };
        }
        weekly[week].profit += bet.profit || 0;
        weekly[week].bets++;
        if (bet.status === BET_STATUS.WON) weekly[week].wins++;
    }
    return weekly;
};

const calculateRecentForm = (bets, count = 10) => {
    const recent = bets.slice(-count);
    const wins = recent.filter(bet => bet.status === BET_STATUS.WON).length;
    return recent.length > 0 ? (wins / recent.length) * 100 : 0;
};

/**
 * Update bankroll settings
 */
export const updateBankrollSettings = (newSettings) => {
    const data = getBankrollData();
    data.settings = { ...data.settings, ...newSettings };

    // Recalculate unit size if bankroll or percentage changed
    if (newSettings.totalBankroll || newSettings.unitPercentage) {
        data.settings.unitSize = (data.settings.totalBankroll * data.settings.unitPercentage) / 100;
    }

    saveBankrollData(data);
    return data.settings;
};

/**
 * Export data for backup
 */
export const exportBankrollData = () => {
    const data = getBankrollData();
    const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
};

/**
 * Import data from backup
 */
export const importBankrollData = (jsonData) => {
    try {
        const importedData = JSON.parse(jsonData);
        // Validate structure
        if (!importedData.bets || !importedData.settings) {
            throw new Error('Invalid data format');
        }
        saveBankrollData(importedData);
        return true;
    } catch (error) {
        console.error('Import failed:', error);
        return false;
    }
};