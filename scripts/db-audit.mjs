import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Paginate past the 1000-row cap
const PAGE = 1000;
let from = 0, all = [];
for (;;) {
  const { data, error } = await sb.from('futures_odds_snapshots')
    .select('market_type, team, book, odds, implied_prob, line, over_price, under_price, snapshot_time')
    .eq('season', 2026)
    .order('snapshot_time', { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) { console.log('ERROR:', error.message); process.exit(1); }
  all.push(...(data || []));
  if (!data || data.length < PAGE) break;
  from += PAGE;
}
console.log('Total rows fetched:', all.length);

// Per market: team count, null-odds count, snapshot dates
const mkts = {};
for (const r of all) {
  if (!mkts[r.market_type]) mkts[r.market_type] = { teams: new Set(), nullOdds: 0, nullBoth: 0, rows: 0, dates: new Set() };
  const m = mkts[r.market_type];
  m.teams.add(r.team);
  m.rows++;
  m.dates.add(String(r.snapshot_time).slice(0, 10));
  if (r.odds == null) m.nullOdds++;
  if (r.odds == null && r.implied_prob == null) m.nullBoth++;
}

console.log('');
for (const [k, m] of Object.entries(mkts).sort()) {
  console.log(`${k}: ${m.teams.size} teams, ${m.rows} rows, ${m.dates.size} snapshot dates`);
  console.log(`  null odds: ${m.nullOdds}/${m.rows}  null both(odds+implied): ${m.nullBoth}/${m.rows}`);
  console.log(`  dates: ${[...m.dates].sort().join(', ')}`);
}
