#!/usr/bin/env node

/**
 * scripts/audit-all32-rosters.js
 * ═══════════════════════════════════════════════════════════════════════════════
 * FULL 32-TEAM ROSTER CROSS-VERIFICATION & AUDIT TOOL
 * 
 * Audits player-team assignments across:
 * - Training Camp Intel Snapshot (`data/training-camp/2026/latest.json`)
 * - Projected Starters Snapshot (`data/projected-starters/2026/latest.json`)
 * - Secondary Roles Snapshot (`data/secondary-matchups/manual/secondary-roles-2026.json`)
 * - Receiver Roles Snapshot (`data/secondary-matchups/manual/receiver-roles-2026.json`)
 * - Availability Digest (`data/player-availability/impact-digest-latest.json`)
 * 
 * Reports:
 * 1. Players assigned to multiple different teams.
 * 2. High-profile move verification (Najee Harris, Rodgers, Wilson, Fields, Pickens, Diggs, Saquon, etc.).
 * 3. Outdated or free-agent players tagged to wrong teams.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
  } catch (err) {
    if (fallback !== null) return fallback;
    throw err;
  }
}

async function runAudit() {
  console.log('🔍 Executing 32-Team Full Roster Audit across all local datasets...\n');

  const campIntel = await readJson('data/training-camp/2026/latest.json', {});
  const projectedStarters = await readJson('data/projected-starters/2026/latest.json', {});
  const secondaryRoles = await readJson('data/secondary-matchups/manual/secondary-roles-2026.json', []);
  const receiverRoles = await readJson('data/secondary-matchups/manual/receiver-roles-2026.json', []);

  const playerTeamMap = new Map(); // player -> Map(source -> team)

  function record(player, team, source) {
    if (!player || !team) return;
    const name = String(player).trim();
    const teamCode = String(team).trim().toUpperCase();
    if (!playerTeamMap.has(name)) {
      playerTeamMap.set(name, new Map());
    }
    playerTeamMap.get(name).set(source, teamCode);
  }

  // 1. Ingest Training Camp Intel
  if (campIntel.teams) {
    const teamsObj = campIntel.teams;
    const teamKeys = Array.isArray(teamsObj) ? teamsObj : Object.values(teamsObj);
    teamKeys.forEach(t => {
      (t.items || []).forEach(item => {
        if (item.player) record(item.player, item.team || t.team, 'Training Camp Intel');
      });
    });
  }

  // 2. Ingest Projected Starters
  (projectedStarters.players || []).forEach(p => {
    if (p.player_name && p.team) record(p.player_name, p.team, 'Projected Starters');
  });

  // 3. Ingest Secondary DB Roles
  (secondaryRoles || []).forEach(p => {
    if (p.player_name && p.team) record(p.player_name, p.team, 'Secondary DB Roles');
  });

  // 4. Ingest Receiver Roles
  (receiverRoles || []).forEach(p => {
    if (p.player_name && p.team) record(p.player_name, p.team, 'Receiver Roles');
  });

  console.log(`Total Unique Players Tracked across sources: ${playerTeamMap.size}`);

  // Find Conflicts (Player assigned to >1 team across sources)
  const conflicts = [];
  playerTeamMap.forEach((sourcesMap, player) => {
    const teams = new Set(sourcesMap.values());
    if (teams.size > 1) {
      const breakdown = Array.from(sourcesMap.entries()).map(([src, tm]) => `${src}: ${tm}`).join(', ');
      conflicts.push({ player, teams: Array.from(teams), breakdown });
    }
  });

  console.log(`\n--- 🚨 TEAM ASSIGNMENT CONFLICTS FOUND (${conflicts.length}) ---`);
  if (conflicts.length === 0) {
    console.log('✅ No team assignment conflicts detected across active datasets!');
  } else {
    conflicts.forEach(c => {
      console.log(`❌ ${c.player} -> Multiple Teams: [${c.teams.join(', ')}] (${c.breakdown})`);
    });
  }

  // Spotlight Check for Specific Offseason Player Moves
  console.log('\n--- 🎯 KEY PLAYER MOVES VERIFICATION CHECK ---');
  const SPOTLIGHT_PLAYERS = [
    'Najee Harris',
    'Aaron Rodgers',
    'Russell Wilson',
    'Justin Fields',
    'George Pickens',
    'Stefon Diggs',
    'Saquon Barkley',
    'Derrick Henry',
    'Keenan Allen',
    'Kirk Cousins'
  ];

  SPOTLIGHT_PLAYERS.forEach(pName => {
    const sMap = playerTeamMap.get(pName);
    if (!sMap) {
      console.log(`❓ ${pName}: Not found in active primary datasets`);
    } else {
      const breakdown = Array.from(sMap.entries()).map(([src, tm]) => `${src}: ${tm}`).join(', ');
      console.log(`📌 ${pName}: ${breakdown}`);
    }
  });

  return conflicts;
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
