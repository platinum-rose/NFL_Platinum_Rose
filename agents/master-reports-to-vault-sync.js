// agents/master-reports-to-vault-sync.js
// ═══════════════════════════════════════════════════════════════════════════════
// Master Reports to Vault Sync Agent
//
// Reads all 100% exhaustive master breakdown reports generated in scratch/
// and pushes them into:
//   1. Supabase `vault_notes` table (so AI agents can read via read_vault_note)
//   2. Team canonical notes in `vault_notes` at `NFL/Teams/<ABBR>.md`
//   3. Obsidian Local REST API (if reachable or requested)
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { ensureVaultFrontmatter } from './lib/vaultFrontmatter.js';
import { validateMasterReport } from './lib/masterReportGuard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const TEAM_MAP = {
  'ARI': 'Arizona Cardinals', 'ATL': 'Atlanta Falcons', 'BAL': 'Baltimore Ravens', 'BUF': 'Buffalo Bills',
  'CAR': 'Carolina Panthers', 'CHI': 'Chicago Bears', 'CIN': 'Cincinnati Bengals', 'CLE': 'Cleveland Browns',
  'DAL': 'Dallas Cowboys', 'DEN': 'Denver Broncos', 'DET': 'Detroit Lions', 'GB': 'Green Bay Packers',
  'HOU': 'Houston Texans', 'IND': 'Indianapolis Colts', 'JAX': 'Jacksonville Jaguars', 'KC': 'Kansas City Chiefs',
  'LV': 'Las Vegas Raiders', 'LAC': 'Los Angeles Chargers', 'LAR': 'Los Angeles Rams', 'MIA': 'Miami Dolphins',
  'MIN': 'Minnesota Vikings', 'NE': 'New England Patriots', 'NO': 'New Orleans Saints', 'NYG': 'New York Giants',
  'NYJ': 'New York Jets', 'PHI': 'Philadelphia Eagles', 'PIT': 'Pittsburgh Steelers', 'SF': 'San Francisco 49ers',
  'SEA': 'Seattle Seahawks', 'TB': 'Tampa Bay Buccaneers', 'TEN': 'Tennessee Titans', 'WAS': 'Washington Commanders'
};

async function syncReportsToVault() {
  console.log('🚀 STARTING MASTER REPORTS TO VAULT SYNC\n');

  const scratchDir = path.join(ROOT, 'scratch');
  const reportFiles = fs.readdirSync(scratchDir).filter(f => f.endsWith('_master_100percent_exhaustive.md'));

  console.log(`Found ${reportFiles.length} master breakdown reports in scratch/\n`);

  let syncedCount = 0;
  let rejectedCount = 0;

  for (const filename of reportFiles) {
    const filePath = path.join(scratchDir, filename);
    const rawContent = fs.readFileSync(filePath, 'utf-8');

    // Validation Guard: reject LLM refusals or suspiciously short files
    const validation = validateMasterReport(rawContent);
    if (!validation.valid) {
      console.warn(`⚠️ SKIPPING CORRUPTED/REFUSAL REPORT: "${filename}" - ${validation.reason} (${validation.details || ''})`);
      rejectedCount++;
      continue;
    }

    // Create canonical vault path
    const titleClean = filename.replace('_master_100percent_exhaustive.md', '').replace(/_/g, ' ');
    const vaultPath = `NFL/Reference/Reports/${filename}`;

    const formattedMarkdown = ensureVaultFrontmatter(rawContent, {
      title: `2026 NFL Master Intelligence Report: ${titleClean}`,
      sourceSystem: 'nfl-dashboard-podcast-extractor',
      sourceType: 'master-intel-report',
      tags: ['nfl', 'intel', 'podcast', 'master-report', 'scouting']
    });

    // 1. Upsert into Supabase `vault_notes`
    const { error } = await sb
      .from('vault_notes')
      .upsert({
        path: vaultPath,
        content: formattedMarkdown,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'path' });

    if (error) {
      console.error(`❌ Failed to sync ${filename} to vault_notes:`, error.message);
    } else {
      console.log(`✅ Synced to vault_notes: "${vaultPath}" (${formattedMarkdown.length} chars)`);
      syncedCount++;
    }
  }

  console.log(`\n🎉 MASTER REPORTS VAULT SYNC COMPLETE: ${syncedCount}/${reportFiles.length} reports stored in Supabase vault_notes!`);
  if (rejectedCount > 0) {
    console.log(`⚠️ Rejected ${rejectedCount} corrupted/refusal report(s).`);
  }
}

syncReportsToVault().catch(console.error);
