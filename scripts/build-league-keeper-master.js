// scripts/build-league-keeper-master.js
// ═══════════════════════════════════════════════════════════════════════════════
// Master League Keeper JSON Generator
// Reads draft_board_2025.csv and final_rosters_2025.csv from data/fantasy/,
// applies league keeper rules (-2 draft spots, Round 10 FA, dropped mid-season ineligible),
// and outputs public/league_keeper_master_2026.json for NFL_Dashboard.
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseRawRosterText } from '../src/lib/fantasyRosterParser.js';
import { reconcileRosterWithDraftBoard } from '../src/lib/keeperEvaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const draftBoardPathFull = path.join(projectRoot, 'data', 'fantasy', 'draft_board_2025_full.csv');
const draftBoardPathOrig = path.join(projectRoot, 'data', 'fantasy', 'draft_board_2025.csv');
const draftBoardPath = fs.existsSync(draftBoardPathFull) ? draftBoardPathFull : draftBoardPathOrig;
const finalRostersPathFull = path.join(projectRoot, 'data', 'fantasy', 'final_rosters_2025_full.csv');
const finalRostersPathOrig = path.join(projectRoot, 'data', 'fantasy', 'final_rosters_2025.csv');
const finalRostersPath = fs.existsSync(finalRostersPathFull) ? finalRostersPathFull : finalRostersPathOrig;
const outputPath = path.join(projectRoot, 'public', 'league_keeper_master_2026.json');

console.log("=== Building League Keeper Master JSON ===");

// 1. Load Draft Board CSV
let draftBoardText = '';
if (fs.existsSync(draftBoardPath)) {
  draftBoardText = fs.readFileSync(draftBoardPath, 'utf8');
  console.log(`Loaded draft board CSV: ${draftBoardPath}`);
} else {
  console.warn(`Warning: Draft board file not found at ${draftBoardPath}`);
}

// 2. Load Final Rosters CSV
let finalRostersText = '';
if (fs.existsSync(finalRostersPath)) {
  finalRostersText = fs.readFileSync(finalRostersPath, 'utf8');
  console.log(`Loaded final rosters CSV: ${finalRostersPath}`);
} else {
  console.warn(`Warning: Final rosters file not found at ${finalRostersPath}`);
}

// 3. Parse CSVs
const draftBoard = parseRawRosterText(draftBoardText);
const finalRosters = parseRawRosterText(finalRostersText);

console.log(`Parsed ${draftBoard.length} draft board entries.`);
console.log(`Parsed ${finalRosters.length} final roster entries.`);

// 4. Reconcile Roster vs Draft Board using Rule Engine
const reconciled = reconcileRosterWithDraftBoard(
  finalRosters.length > 0 ? finalRosters : draftBoard,
  draftBoard
);

// 5. Clean up draftTeam values (filter out "Waiver Pickup" and noise entries)
reconciled.forEach(item => {
  if (item.draftTeam === 'Waiver Pickup' || item.draftTeam === 'Pos' || !item.draftTeam) {
    item.draftTeam = 'Fat Lazy Americans';
  }
  if (item.draftTeam === 'My Team') {
    item.draftTeam = 'Fat Lazy Americans';
  }
});

// 6. Group by Manager / Team
const teamsMap = new Map();
reconciled.forEach(item => {
  const teamName = item.draftTeam || 'Fat Lazy Americans';
  if (!teamsMap.has(teamName)) {
    teamsMap.set(teamName, []);
  }
  teamsMap.get(teamName).push(item);
});

const teamsList = [];
teamsMap.forEach((players, teamName) => {
  teamsList.push({
    teamName,
    finalRoster: players
  });
});

const masterJson = {
  season: 2026,
  leagueName: "Fat Lazy Americans Fantasy League",
  leagueSize: 12,
  rules: {
    draftedDiscountRounds: 2,
    freeAgentKeeperRound: 10
  },
  totalPlayers: reconciled.length,
  players: reconciled, // TOP LEVEL PLAYERS ARRAY FOR EASY IMPORT
  teams: teamsList,
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(outputPath, JSON.stringify(masterJson, null, 2), 'utf8');
console.log(`✅ Successfully generated Master League JSON: ${outputPath}`);
console.log(`Total Teams: ${teamsList.length} | Total Players: ${reconciled.length}`);

// Print Team Breakdown
console.log("\n=== 12-TEAM INGESTION VERIFICATION ===");
teamsList.forEach(t => {
  console.log(`- ${t.teamName}: ${t.finalRoster.length} players`);
});
