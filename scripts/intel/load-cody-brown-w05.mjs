// One-off: load Cody Brown Bets "one leg per game" email (2026-10-10) into research_intel_notes + research_pick_signals.
import 'dotenv/config'; import fs from 'node:fs'; import crypto from 'node:crypto'; import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const URL = 'https://tail.link/W5BBBP'; const h = (x) => crypto.createHash('sha256').update(x).digest('hex');
const body = fs.readFileSync(process.argv[2], 'utf8');
const note = { source: 'Cody Brown Bets', source_type: 'betting', url: URL, canonical_url: URL, url_hash: h(URL), content_hash: h(body),
  title: "It's time to cash a one leg per game... (Cody Brown Bets email, Oct 10 2026)", summary: body.slice(0, 300), body, published_at: '2026-10-10T13:04:05+00:00', confidence: 0.6, author: 'Cody Brown' };
let { data: n, error } = await s.from('research_intel_notes').upsert(note, { onConflict: 'url_hash' }).select('id').single();
if (error) throw error;
const R = (g, team, bet_type, lean, rationale, c = 0.6) => ({ note_id: n.id, source: 'Cody Brown Bets', author: 'Cody Brown', team_or_market: team, bet_type, lean, rationale: `[${g}] ${rationale}`.slice(0, 220), event_ref: URL, confidence: c });
const rows = [
  R('SEA@SF', 'Brock Purdy - rushing yards', 'player_prop', 'OVER 22.5 (-114)', 'SUNDAY BEST BET (FanDuel). Cleared 22.5 in all 4 games, 30.5/g; SEA allows 4th-most rush yds to QBs.', 0.7),
  R('MIN@NO', 'Aaron Jones - rushing yards', 'player_prop', 'OVER', 'Saints allow league-worst 138.5 rush yds/g to RBs; "take his rushing yards and maybe a TD too".'),
  R('IND@PIT', 'Jaylen Warren - receiving yards', 'player_prop', 'OVER 20.5', 'Cashed 20.5 in all 4 games; IND 4th-most rec yds/g to RBs.'),
  R('NYG@WAS', 'Isaiah Likely - receptions', 'player_prop', 'OVER', '8+ targets in 3 of 4, 5.5 rec/g; WAS allows 60.8 yds/g and 5 TDs to TEs (no line given).', 0.5),
  R('LV@NE', 'Las Vegas Raiders', 'spread', 'LV (ATS lean)', 'Raiders covered 5 straight (longest active streak); trend note, no number given.', 0.4),
  R('DEN@LAC', 'Denver Broncos @ Los Angeles Chargers total', 'total', 'UNDER', 'Chargers and Broncos 2-6 combined to the under; Nix not creating downfield.', 0.5),
  R('DET@ARI', 'Michael Wilson - targets', 'player_prop', 'OVER (targets/receiving lean)', '13+ targets in each of last 2 games; DET allows most fantasy pts/g to WRs (no line given).', 0.4),
  R('CHI@GB', 'Chicago Bears RBs (Swift/Monangai) - rushing', 'player_prop', 'OVER (rushing lean)', 'GB allows 113+ rush yds/g to RBs; Monangai 146 yds + 2 TD vs NYJ (no line given).', 0.4),
  R('LOTTO', 'One-leg-per-game lotto (+5777, FanDuel)', 'parlay_leg', 'unspecified', 'One leg from each red-zone game plus SNF; legs not listed in the email (tail link only).', 0.2),
];
const { data: have } = await s.from('research_pick_signals').select('team_or_market,lean').eq('note_id', n.id);
const seen = new Set((have || []).map((r) => r.team_or_market + '|' + r.lean)); const fresh = rows.filter((r) => !seen.has(r.team_or_market + '|' + r.lean));
if (fresh.length) { const { error: e } = await s.from('research_pick_signals').insert(fresh); if (e) throw e; }
console.log(`note ${n.id}; inserted ${fresh.length} signals`);
