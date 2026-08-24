// scripts/ingest-idp-strategy-guide.js
// Ingests the IDP Defensive Schemes & Strategy Guide into local JSON vault storage and Supabase vault_notes.

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INTEL_DIR = path.join(ROOT, 'data', 'intel');
const GUIDE_PATH = path.join(ROOT, 'docs', 'IDP_DEFENSIVE_SCHEMES_STRATEGY_GUIDE.md');

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  IDP Defensive Schemes Strategy Guide Ingest');
  console.log('══════════════════════════════════════════════════\n');

  const mdContent = await readFile(GUIDE_PATH, 'utf-8');

  const payload = {
    id: 'idp-defensive-schemes-strategy-guide',
    title: 'IDP Defensive Schemes & Strategy Guide',
    source: 'idpguru.com',
    url: 'https://idpguru.com/2010/07/guide-to-nfl-defensive-schemes/',
    author: 'Ryan Sitzmann',
    category: 'idp_strategy',
    ingested_at: new Date().toISOString(),
    summary: 'Comprehensive guide on how NFL defensive schemes, alignments, nickel/dime sub-packages, green-dot roles, and coverage shells dictate IDP fantasy value.',
    content_md: mdContent,
    key_takeaways: [
      'Opportunity = Snap Volume x Proximity to the ball',
      'Base 4-3 and 3-4 personnel represent less than 35% of modern NFL snaps',
      'Sub-packages (Nickel 4-2-5, 3-3-5, Big Nickel) determine true 3-down linebackers and DB fantasy value',
      'The green dot helmet communicator is the strongest indicator of a 3-down off-ball linebacker',
      'Platform position designations (DL/EDGE vs LB) create massive arbitrage opportunities in fantasy',
      '3-technique penetrating DTs offer strong TFL/sack upside while 0/1-tech nose tackles absorb double teams',
      'Box & slot safeties yield high tackle floors compared to deep single-high safeties',
      'Shutdown cornerbacks avoided by opposing quarterbacks suffer low fantasy tackle/PBU floors'
    ]
  };

  await mkdir(INTEL_DIR, { recursive: true });
  const jsonPath = path.join(INTEL_DIR, 'idp-defensive-schemes-strategy-2026.json');
  await writeFile(jsonPath, JSON.stringify(payload, null, 2));

  console.log(`✅ Saved local intel JSON to: ${jsonPath}`);

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    console.log('→ Upserting to Supabase vault_notes...');
    const { error } = await sb.from('vault_notes').upsert({
      path: 'docs/IDP_DEFENSIVE_SCHEMES_STRATEGY_GUIDE.md',
      content: payload.content_md,
      tags: ['IDP', 'Defensive Schemes', 'Fantasy Strategy', 'Snap Counts', 'Linebackers', 'Edge Rushers'],
      source: 'agent',
      updated_at: new Date().toISOString()
    }, { onConflict: 'path' });

    if (error) {
      console.warn('[WARN] Supabase vault_notes upsert:', error.message);
    } else {
      console.log('✅ Supabase vault_notes upsert completed!');
    }
  }
}

main().catch((err) => {
  console.error('✖ Ingestion error:', err);
  process.exit(1);
});
