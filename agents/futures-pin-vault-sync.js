// agents/futures-pin-vault-sync.js
// ═══════════════════════════════════════════════════════════════════════════════
// NFL-ATLAS-1: Futures Pin → Vault Sync Agent (piece C)
//
// Obsidian side of the pinned-futures feature. Mirrors the shape of
// agents/intel-to-vault-sync.js (F-15) as closely as possible — same
// splice-a-generated-section-into-vault_notes pattern, same frontmatter
// helper, same receipts convention — just pointed at a different source
// table and a new NFL/Futures/ path prefix instead of NFL/Teams/.
//
// Design doc: docs/NFL_ATLAS_1_FUTURES_WATCHLIST_DESIGN.md
//
// Flow:
//   1. Read active rows from futures_pins (migration 048; browser-writable,
//      populated when Andy pins something in the FuturesWatchList tab).
//   2. For each pin, match research_pick_signals + research_intel_notes by
//      team nickname and/or market/selection keyword — same algorithm
//      already used server-side in agents/futures-intel-report-v2.js
//      (expertSignalsForTeam/valueSpotSourceLinks) and ported to the browser
//      in src/lib/expertSignals.js. Re-implemented locally here (not
//      imported from either) because agent scripts and src/lib/ live in
//      different module/build contexts in this repo (see
//      intel-to-vault-sync.js, which does the same rather than importing
//      from src/lib).
//   3. Update the "## Expert Signals" section in vault_notes at
//      NFL/Futures/<slug>.md, preserving any hand-written content above it.
//
// Framing: neutral, per Andy's 2026-08-23 call — "signals mentioning this
// pick," never agree/disagree (research_pick_signals has no real stance
// field; see the design doc's Open Item 2).
//
// This agent only READS futures_pins — it never writes to it. The pin list
// itself is owned by the browser (src/lib/supabase.js's addFuturesPin/
// removeFuturesPin).
//
// Usage:
//   node agents/futures-pin-vault-sync.js [--dry-run]
//
// Env vars:
//   SUPABASE_URL              (required)
//   SUPABASE_SERVICE_ROLE_KEY (required)
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { ensureVaultFrontmatter } from './lib/vaultFrontmatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN       = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const SIGNAL_LOOKBACK_DAYS = Number(process.env.PIN_SIGNAL_LOOKBACK_DAYS || 30);
const MAX_SIGNALS_PER_PIN  = 6;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

function nowIso() {
  return new Date().toISOString().slice(0, 10);
}

function sha256(v) {
  return createHash('sha256').update(String(v)).digest('hex').slice(0, 8);
}

function trunc(text, n = 220) {
  if (!text) return '';
  return text.length <= n ? text : text.slice(0, n - 1) + '…';
}

/** e.g. "Josh Allen" + "mvp" → "mvp-josh-allen" */
function pinSlug(pin) {
  const raw = `${pin.market}-${pin.selection}`;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ─── Matching (local port of agents/futures-intel-report-v2.js's
// expertSignalsForTeam / valueSpotSourceLinks — see header note above) ────────

function matchSignalsForPin(pin, notes, signals) {
  const teamLower = String(pin.team || '').toLowerCase();
  const nickLower = teamLower.split(' ').at(-1);
  const selectionLower = String(pin.selection || '').toLowerCase();
  const marketWords = [pin.market, pin.selection]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const broadMatches = signals.filter((s) => {
    const text = [s.team_or_market, s.bet_type, s.lean, s.rationale].filter(Boolean).join(' ').toLowerCase();
    const teamHit = teamLower && (text.includes(teamLower) || (nickLower && text.includes(nickLower)));
    const selectionHit = selectionLower && text.includes(selectionLower);
    const marketHit = marketWords.some((w) => text.includes(w));
    return teamHit || selectionHit || marketHit;
  });

  // Strict nickname pass first when a team is set (mirrors
  // expertSignalsForTeam's tighter rule); fall back to the broad set.
  const strict = nickLower ? broadMatches.filter((s) => String(s.team_or_market || '').toLowerCase().includes(nickLower)) : [];
  const chosen = strict.length > 0 ? strict : broadMatches;

  const noteById = new Map(notes.map((n) => [n.id, n]));
  const seen = new Set();
  const sourceLinks = [];
  for (const s of chosen) {
    const n = noteById.get(s.note_id);
    if (!n?.url || seen.has(n.url)) continue;
    seen.add(n.url);
    sourceLinks.push({ source: n.source, title: n.title || n.url, url: n.url });
    if (sourceLinks.length >= 3) break;
  }

  return { signals: chosen.slice(0, MAX_SIGNALS_PER_PIN), sourceLinks };
}

// ─── Vault note section ────────────────────────────────────────────────────────

const SIGNALS_SECTION_HEADER = '## Expert Signals';
const SIGNALS_SECTION_FENCE  = '<!-- futures-pin-auto-end -->';

function spliceSignalsSection(existingContent, newSection) {
  const headerIdx = existingContent.indexOf(`\n${SIGNALS_SECTION_HEADER}`);
  if (headerIdx === -1) {
    return existingContent.trimEnd() + '\n\n' + newSection + '\n';
  }
  return existingContent.slice(0, headerIdx) + '\n' + newSection + '\n';
}

function buildSignalsSection(pin, matched) {
  const lines = [
    SIGNALS_SECTION_HEADER, '',
    `_Auto-updated: ${nowIso()} — signals mentioning this pick, not an agree/disagree verdict (research_pick_signals has no stance field; see docs/NFL_ATLAS_1_FUTURES_WATCHLIST_DESIGN.md)._`,
    '',
  ];

  if (matched.signals.length === 0) {
    lines.push('_No tracked expert signals mention this pick yet._', '');
  } else {
    for (const s of matched.signals) {
      const who   = s.author || s.source || 'Unknown';
      const conf  = s.confidence != null ? ` (conf ${Math.round(s.confidence * 100)}%)` : '';
      const type  = s.bet_type ? ` [${s.bet_type}]` : '';
      const text  = trunc(s.rationale, 240);
      lines.push(`- **${who}**${type}${conf}${text ? ` — ${text}` : ''}`);
    }
    lines.push('');
  }

  if (matched.sourceLinks.length > 0) {
    lines.push('**Sources:**');
    for (const l of matched.sourceLinks) {
      lines.push(`- [${l.title}](${l.url})${l.source ? ` — ${l.source}` : ''}`);
    }
    lines.push('');
  }

  lines.push(SIGNALS_SECTION_FENCE);
  return lines.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const supabase = getSupabase();

  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}futures-pin-vault-sync — signal lookback: ${SIGNAL_LOOKBACK_DAYS} days\n`);

  const { data: pins, error: pinsErr } = await supabase
    .from('futures_pins')
    .select('id, market, selection, team, label')
    .eq('active', true);

  if (pinsErr) {
    // Same degrade-gracefully spirit as the browser side: migration 048 may
    // not be applied yet. Report clearly rather than a raw stack trace.
    console.error(`[FAIL] Could not read futures_pins: ${pinsErr.message}`);
    console.error('Has migration 048_futures_pins.sql been run yet? (Supabase Dashboard → SQL Editor)');
    process.exit(1);
  }

  if (!pins || pins.length === 0) {
    console.log('No active pins to sync. Done.\n');
    return;
  }
  console.log(`  ${pins.length} active pin(s)`);

  const cutoff = new Date(Date.now() - SIGNAL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const [signalsRes, notesRes] = await Promise.all([
    supabase
      .from('research_pick_signals')
      .select('note_id, source, author, team_or_market, bet_type, lean, rationale, confidence, captured_at')
      .gte('captured_at', cutoff)
      .limit(2000),
    supabase
      .from('research_intel_notes')
      .select('id, source, title, url')
      .gte('captured_at', cutoff)
      .limit(2000),
  ]);

  if (signalsRes.error) throw new Error(`Signals fetch: ${signalsRes.error.message}`);
  if (notesRes.error)   throw new Error(`Notes fetch: ${notesRes.error.message}`);

  const signals = signalsRes.data || [];
  const notes   = notesRes.data   || [];
  console.log(`  ${signals.length} signals, ${notes.length} notes in the lookback window\n`);

  let updated = 0;
  let failed  = 0;

  for (const pin of pins) {
    const vaultPath = `NFL/Futures/${pinSlug(pin)}.md`;
    const matched   = matchSignalsForPin(pin, notes, signals);

    let existing = '';
    const { data: noteRow, error: noteErr } = await supabase
      .from('vault_notes')
      .select('content')
      .eq('path', vaultPath)
      .maybeSingle();

    if (noteErr) {
      console.error(`  [FAIL] ${vaultPath}: fetch error — ${noteErr.message}`);
      failed++;
      continue;
    }
    if (noteRow) existing = noteRow.content || '';

    const displayName = pin.label || pin.selection;
    // Seed a starter stub the first time this note is created, mirroring
    // intel-to-vault-sync.js's team-note stubs — Andy can hand-edit anything
    // above the auto-generated section.
    if (!existing) {
      existing = `# ${displayName} — ${pin.market}\n\n_Add your own notes above this line — everything below "${SIGNALS_SECTION_HEADER}" is auto-generated and will be overwritten each sync._\n`;
    }

    const signalsSection = buildSignalsSection(pin, matched);
    const rawContent     = spliceSignalsSection(existing, signalsSection);
    const newContent     = ensureVaultFrontmatter(rawContent, {
      title: `${displayName} (${pin.market})`,
      sourceSystem: 'futures-pin-vault-sync',
      sourceType: 'futures-pin',
      tags: ['futures', pin.market, 'auto-pin'],
    })
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[\uD800-\uDFFF]/g, '');

    if (DRY_RUN) {
      console.log(`  [DRY RUN] ${vaultPath} — ${matched.signals.length} signal(s)`);
      updated++;
      continue;
    }

    const { error: upsertErr } = await supabase
      .from('vault_notes')
      .upsert(
        { path: vaultPath, content: newContent, tags: ['futures', pin.market, 'auto-pin'], source: 'agent' },
        { onConflict: 'path' },
      );

    if (upsertErr) {
      console.error(`  [FAIL] ${vaultPath}: ${upsertErr.message} | code: ${upsertErr.code} | details: ${upsertErr.details}`);
      failed++;
    } else {
      console.log(`  [OK] ${vaultPath} (${matched.signals.length} signal(s))`);
      updated++;
    }
  }

  const receipt = {
    run_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    signal_lookback_days: SIGNAL_LOOKBACK_DAYS,
    pins_synced: pins.length,
    vault_notes_updated: updated,
    failures: failed,
  };
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const rcptFile = path.join(RECEIPTS_DIR, `futures-pin-vault-${nowIso()}-${sha256(nowIso())}.json`);
  await writeFile(rcptFile, JSON.stringify(receipt, null, 2), 'utf8');

  console.log(`\nDone. ${updated} updated, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('[futures-pin-vault-sync] Fatal:', err.message);
  process.exit(1);
});
