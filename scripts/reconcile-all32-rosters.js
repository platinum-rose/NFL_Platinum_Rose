#!/usr/bin/env node

/**
 * scripts/reconcile-all32-rosters.js
 * ═══════════════════════════════════════════════════════════════════════════════
 * ALL-32 ROSTER RECONCILER
 * Fixes player team assignment conflicts across receiver-roles, secondary-roles,
 * projected-starters, and training-camp-all32.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ROSTER_CORRECTIONS = {
  'Javonte Williams': 'DEN',
  'Adonai Mitchell': 'IND',
  'Isiah Pacheco': 'KC',
  'Jalen Ramsey': 'MIA',
  'Nate Hobbs': 'LV',
  'Darnell Mooney': 'ATL',
  'Evan Engram': 'JAX',
  'Jahan Dotson': 'WAS',
  'Cooper Kupp': 'LAR',
  'Rasul Douglas': 'BUF',
  'Hollywood Brown': 'KC',
  'Jakobi Meyers': 'LV',
  'Joshua Palmer': 'LAC',
  'Jauan Jennings': 'SF',
  'George Pickens': 'DAL',
  'Aaron Rodgers': 'PIT',
  'Russell Wilson': 'NYJ',
  'Justin Fields': 'NYJ',
};

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
}

async function writeJson(relativePath, data) {
  await writeFile(path.join(ROOT, relativePath), JSON.stringify(data, null, 2), 'utf8');
}

async function reconcile() {
  console.log('🔧 Reconciling All-32 Roster Assignments across local datasets...\n');

  // 1. Reconcile Receiver Roles
  const receiverRolesPath = 'data/secondary-matchups/manual/receiver-roles-2026.json';
  const receiverRoles = await readJson(receiverRolesPath);
  let recEdits = 0;

  receiverRoles.forEach(r => {
    if (r.player_name && ROSTER_CORRECTIONS[r.player_name]) {
      const correctTeam = ROSTER_CORRECTIONS[r.player_name];
      if (r.team !== correctTeam) {
        console.log(`[Receiver Roles] Correcting ${r.player_name}: ${r.team} -> ${correctTeam}`);
        r.team = correctTeam;
        recEdits += 1;
      }
    }
  });

  if (recEdits > 0) {
    await writeJson(receiverRolesPath, receiverRoles);
    console.log(`✅ Updated ${receiverRolesPath} (${recEdits} edits)`);
  }

  // 2. Reconcile Secondary Roles
  const secondaryRolesPath = 'data/secondary-matchups/manual/secondary-roles-2026.json';
  const secondaryRoles = await readJson(secondaryRolesPath);
  let secEdits = 0;

  secondaryRoles.forEach(r => {
    if (r.player_name && ROSTER_CORRECTIONS[r.player_name]) {
      const correctTeam = ROSTER_CORRECTIONS[r.player_name];
      if (r.team !== correctTeam) {
        console.log(`[Secondary Roles] Correcting ${r.player_name}: ${r.team} -> ${correctTeam}`);
        r.team = correctTeam;
        secEdits += 1;
      }
    }
  });

  if (secEdits > 0) {
    await writeJson(secondaryRolesPath, secondaryRoles);
    console.log(`✅ Updated ${secondaryRolesPath} (${secEdits} edits)`);
  }

  // 3. Reconcile Projected Starters
  const projectedStartersPath = 'data/projected-starters/2026/latest.json';
  const projectedStarters = await readJson(projectedStartersPath);
  let psEdits = 0;

  (projectedStarters.players || []).forEach(p => {
    if (p.player_name && ROSTER_CORRECTIONS[p.player_name]) {
      const correctTeam = ROSTER_CORRECTIONS[p.player_name];
      if (p.team !== correctTeam) {
        console.log(`[Projected Starters] Correcting ${p.player_name}: ${p.team} -> ${correctTeam}`);
        p.team = correctTeam;
        psEdits += 1;
      }
    }
  });

  if (psEdits > 0) {
    await writeJson(projectedStartersPath, projectedStarters);
    console.log(`✅ Updated ${projectedStartersPath} (${psEdits} edits)`);
  }

  console.log('\n✨ All-32 Roster Reconciler completed cleanly!');
}

reconcile().catch(err => {
  console.error('Reconciliation failed:', err);
  process.exit(1);
});
