// scripts/intel/attribute-podcast-picks.mjs — re-attribute a week's podcast picks (user_picks, source EXPERT) from show level to the individual expert.
// Order: single-host show map (data/expert-tracking/podcast-host-map.json) -> speaker of the matching YouTube pick from the same show/game.
// Usage: WEEK=8 WEEK_START=2026-10-27T00:00:00Z node scripts/intel/attribute-podcast-picks.mjs   (dry run)  |  add APPLY=true to write.
// Week-scoped attribution backfill for user_picks (source EXPERT). DRY by default; APPLY=true writes.
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const APPLY = process.env.APPLY === 'true';
const WS = process.env.WEEK_START || (() => { throw new Error('set WEEK_START=YYYY-MM-DDT00:00:00Z (Tuesday of the NFL week)'); })();
const map = JSON.parse(fs.readFileSync('data/expert-tracking/podcast-host-map.json', 'utf8')).rules;
const yt = JSON.parse(fs.readFileSync(process.env.YT_PICKS || 'data/podcasts/youtube-extracted-picks-2026-w' + String(process.env.WEEK || '').padStart(2, '0') + '.json', 'utf8')).picks || [];
const { data: tx } = await s.from('podcast_transcripts').select('episode_id,podcast_episodes(id,title,podcast_feeds(name,expert))').gte('processed_at', WS);
const ep = {}; for (const t of tx) { const e = t.podcast_episodes; if (e) ep[String(e.id).slice(0, 8)] = { title: e.title, feed: e.podcast_feeds?.expert || e.podcast_feeds?.name }; }
const { data: up, error } = await s.from('user_picks').select('id,expert,selection,pick_type,line,visitor,home,created_at').eq('source', 'EXPERT').gte('created_at', WS);
if (error) { console.log('ERR', error.message); process.exit(1); }
const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9.]+/g, ' ').trim();
const last = (n) => norm(n).split(' ').slice(-1)[0];
const res = []; const stats = {};
for (const r of up) {
  const m = r.id.match(/-ep([0-9a-f]{8})-/i); const e = m ? ep[m[1]] : null;
  if (!e) continue;
  if (r.expert && r.expert.includes('(')) continue; // already attributed
  let host = null, how = null;
  const rule = map.find((x) => x.feed === e.feed && new RegExp(x.title_regex, 'i').test(e.title || ''));
  if (rule) { host = rule.host; how = 'single-host map'; }
  if (!host) { // borrow speaker from a YouTube pick of the same show + same selection
    const sel = norm(r.selection);
    const TEAM = {ARI:'arizona',ATL:'atlanta',BAL:'baltimore',BUF:'buffalo',CHI:'chicago',CIN:'cincinnati',CLE:'cleveland',DAL:'dallas',DEN:'denver',DET:'detroit',IND:'indianapolis',JAX:'jacksonville',KC:'kansas city',LV:'las vegas',LAC:'chargers',LAR:'rams',MIA:'miami',MIN:'minnesota',NE:'new england',NYJ:'jets',PHI:'philadelphia',PIT:'pittsburgh',SEA:'seattle',TB:'tampa bay',TEN:'tennessee',WAS:'washington'};
    const gameOk = (p) => { const [a, h] = String(p.game || '').split('@'); return a && h && norm(r.visitor + ' ' + r.home).includes(TEAM[a] || '#') && norm(r.visitor + ' ' + r.home).includes(TEAM[h] || '#'); };
    const subj = (p) => { const t = String(p.pick || ''); const m = t.match(/^([A-Z]{2,3})\b/); if (m && TEAM[m[1]]) return TEAM[m[1]]; return norm(t.split(/\s+[ou]?\d|\s+(over|under|anytime)/i)[0]).split(' ').slice(0, 2).join(' '); };
    const showOk = (p) => norm(p.show).startsWith(norm(e.feed).split(' ')[0]);
    const cands = yt.filter((p) => p.speaker && !/^unknown/i.test(p.speaker) && showOk(p) && gameOk(p) && subj(p) && sel.includes(subj(p)));
    const spk = [...new Set(cands.map((p) => p.speaker))];
    if (spk.length === 1) { host = spk[0]; how = 'matched YouTube pick'; }
  }
  const key = `${e.feed} | ${(e.title || '').slice(0, 45)}`;
  stats[key] = stats[key] || { total: 0, attributed: 0, hosts: {} };
  stats[key].total++;
  if (host) { stats[key].attributed++; stats[key].hosts[host] = (stats[key].hosts[host] || 0) + 1; res.push({ id: r.id, expert: `${host} (${e.feed})`, how }); }
}
console.log(JSON.stringify(stats, null, 1));
console.log(`rows to update: ${res.length}`);
if (APPLY) {
  let ok = 0;
  for (const r of res) { const { error: e2 } = await s.from('user_picks').update({ expert: r.expert }).eq('id', r.id); if (!e2) ok++; else console.log('fail', r.id, e2.message); }
  console.log(`updated ${ok}/${res.length}`);
  fs.writeFileSync('scratch/attribution-applied-w' + String(process.env.WEEK || '') + '.json', JSON.stringify(res, null, 1));
}
