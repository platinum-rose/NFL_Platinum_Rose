// scripts/evaluate-week2-survivor.mjs
import fs from 'node:fs';
import path from 'node:path';
import {
  build18WeekGrid,
  calculateTeamFutureValue,
  computeAllTeamsFutureValues,
  solveOptimalPaths,
  spreadToWinProbability,
  getFavoriteTier,
} from '../src/lib/survivorAlpha.js';

const schedule = JSON.parse(fs.readFileSync('public/schedule.json', 'utf8'));

// Build 18-week grid from actual schedule
const grid = build18WeekGrid(schedule, {}, new Date('2026-09-17T12:00:00Z'));

// Get all teams and compute future values starting from Week 2 (looking at Weeks 3..18)
const fvMap = computeAllTeamsFutureValues(2, grid);

// Analyze Week 2 matchups from the ACTUAL 2026 schedule
const week2Games = (schedule || []).filter(g => Number(g.week) === 2);

const analyzedMatchups = week2Games.map(g => {
  const homeSpread = typeof g.spread === 'number' ? g.spread : 0;
  const awaySpread = -homeSpread;
  const homeWinProb = spreadToWinProbability(homeSpread);
  const awayWinProb = spreadToWinProbability(awaySpread);

  const homeFV = fvMap[g.home] || { fvScore: 0, tier: 'Unknown', topFutureWeeks: [] };
  const awayFV = fvMap[g.visitor] || { fvScore: 0, tier: 'Unknown', topFutureWeeks: [] };

  const favTeam = homeWinProb >= 0.5 ? g.home : g.visitor;
  const dogTeam = homeWinProb >= 0.5 ? g.visitor : g.home;
  const favSpread = homeWinProb >= 0.5 ? homeSpread : awaySpread;
  const favWinProb = homeWinProb >= 0.5 ? homeWinProb : awayWinProb;
  const favIsHome = favTeam === g.home;
  const favFV = favTeam === g.home ? homeFV : awayFV;
  const dogFV = dogTeam === g.home ? homeFV : awayFV;

  return {
    gameId: g.id || `${g.visitor}_${g.home}_w2`,
    kickoff: g.kickoff_utc,
    visitor: g.visitor,
    home: g.home,
    favTeam,
    dogTeam,
    favSpread,
    favWinProb,
    favIsHome,
    favFV,
    dogFV,
    favTier: getFavoriteTier(favWinProb, favSpread),
  };
});

// Sort by win probability descending
analyzedMatchups.sort((a, b) => b.favWinProb - a.favWinProb);

// Check scarcity across all 18 weeks
const weekScarcity = [];
for (let w = 1; w <= 18; w++) {
  const summary = grid.weekSummaries[w];
  weekScarcity.push({
    week: w,
    heavyFavs: summary.heavyFavCount,
    solidFavs: summary.favoriteCount,
    scarcityIndex: summary.scarcityIndex,
  });
}

// Generate optimal routes
const optimalRoutes = solveOptimalPaths(grid, {});

const output = {
  season: 2026,
  week: 2,
  generatedAt: new Date().toISOString(),
  week2Matchups: analyzedMatchups,
  weekScarcity,
  topBurnCandidates: analyzedMatchups
    .filter(m => m.favWinProb >= 0.65 && m.favFV.fvScore < 5.0)
    .map(m => ({
      team: m.favTeam,
      opponent: m.dogTeam,
      isHome: m.favIsHome,
      spread: m.favSpread,
      winProb: m.favWinProb,
      fvScore: m.favFV.fvScore,
      fvTier: m.favFV.tier,
      verdict: 'HIGH VALUE BURN — Great win probability with low opportunity cost',
    })),
  topFutureValueSaves: analyzedMatchups
    .filter(m => m.favWinProb >= 0.65 && m.favFV.fvScore >= 5.0)
    .map(m => ({
      team: m.favTeam,
      opponent: m.dogTeam,
      isHome: m.favIsHome,
      spread: m.favSpread,
      winProb: m.favWinProb,
      fvScore: m.favFV.fvScore,
      fvTier: m.favFV.tier,
      topFutureWeeks: m.favFV.topFutureWeeks,
      verdict: 'PRESERVE / HIGH FUTURE VALUE — Needed in upcoming bottleneck weeks',
    })),
  dangerTraps: analyzedMatchups
    .filter(m => m.favWinProb < 0.65 && m.favSpread <= -2.5)
    .map(m => ({
      team: m.favTeam,
      opponent: m.dogTeam,
      spread: m.favSpread,
      winProb: m.favWinProb,
      risk: 'TRAP — Spread under 3.5 or win probability under 65% on road/divisional spot',
    })),
  optimalRoutes: optimalRoutes.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    badge: r.badge,
    week2Pick: {
      team: r.picks[2],
      matchup: analyzedMatchups.find(m => m.favTeam === r.picks[2] || m.dogTeam === r.picks[2]),
    },
    fullSeasonPicks: r.picks,
    survivalProb: r.simulation.survivalProbPct,
    bottleneck: r.simulation.bottleneck,
  }))
};

fs.writeFileSync('data/research-intel/review/survivor-schedule-evaluated-week2.json', JSON.stringify(output, null, 2));
console.log('Successfully wrote data/research-intel/review/survivor-schedule-evaluated-week2.json');
