// scripts/backfill-analytical-signals.mjs
// One-off/backfill: run agents/lib/analytical-picks.js over analytical-feed notes
// already stored in research_intel_notes (captured before 2026-10-01, when those
// feeds skipped pick extraction) and insert the resulting research_pick_signals.
// Deduped against signals already stored for each note. Dry run unless --write.
//   node scripts/backfill-analytical-signals.mjs --since 2026-09-29T04:00:00Z [--write]
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { extractAnalyticalSignals } from '../agents/lib/analytical-picks.js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const SINCE = arg('--since');
const WRITE = process.argv.includes('--write');
if (!SINCE) { console.error('usage: --since <ISO> [--write]'); process.exit(1); }
// Current feed confidences (agents/research-intel-ingest.js FEEDS).
const CONF = { 'Sharp Football': 0.69, 'Pro Football Talk': 0.66, PFF: 0.67, 'Rotowire NFL': 0.65, 'Walter Football': 0.5 };

const s = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: notes, error } = await s.from('research_intel_notes')
  .select('id,source,title,summary,body,url,author').in('source', Object.keys(CONF)).gte('captured_at', SINCE);
if (error) throw error;
const { data: prior, error: pErr } = await s.from('research_pick_signals')
  .select('note_id,team_or_market,bet_type').in('note_id', notes.map((n) => n.id));
if (pErr) throw pErr;
const seen = new Set(prior.map((x) => `${x.note_id}|${String(x.team_or_market).toLowerCase().trim()}|${x.bet_type}`));
const rows = [];
for (const n of notes) {
  const o = { source: n.source, baseConfidence: CONF[n.source], eventRef: n.url };
  for (const sig of [...extractAnalyticalSignals(`${n.title}. ${n.summary || ''}`, o), ...extractAnalyticalSignals(n.body || '', o)]) {
    const key = `${n.id}|${String(sig.team_or_market).toLowerCase().trim()}|${sig.bet_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ note_id: n.id, source: sig.source, author: n.author || null, team_or_market: sig.team_or_market,
      bet_type: sig.bet_type, lean: sig.lean, rationale: sig.rationale, event_ref: sig.event_ref, confidence: sig.confidence });
  }
}
console.log(`notes scanned: ${notes.length}; already-stored analytical signals: ${prior.length}; new signals: ${rows.length}`);
for (const r of rows) console.log(`  ${r.source.padEnd(17)} ${r.bet_type.padEnd(10)} ${r.team_or_market}  (${r.confidence})`);
if (!WRITE) { console.log('dry run -- pass --write to insert'); process.exit(0); }
const { data: ins, error: iErr } = await s.from('research_pick_signals').insert(rows).select('id');
if (iErr) throw iErr;
console.log(`inserted: ${ins.length}`);
