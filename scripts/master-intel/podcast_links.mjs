#!/usr/bin/env node
// scripts/master-intel/podcast_links.mjs — Supabase READ-ONLY: public episode links (YouTube / audio) for the
// podcast titles cited in the week's verified expert rows, so the report can link the source behind each pick.
// usage: node scripts/master-intel/podcast_links.mjs --week 4
// Writes data/generated/master-intel/w<NN>-podcast-links.json  { "<episode title>": {youtube_url, audio_url, pub_date, show} }
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WEEK = Number(arg('--week'));
if (!WEEK) { console.error('usage: --week N'); process.exit(1); }
const W = String(WEEK).padStart(2, '0');
const dir = 'data/generated/master-intel';
const ver = JSON.parse(fs.readFileSync(`${dir}/w${W}-expert-verified.json`, 'utf8'));
const titles = [...new Set(ver.rows.filter(r => r.kind === 'podcast' && r.source_title).map(r => r.source_title))];
const s = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const dec = t => t.replace(/&amp;/g, '&');
const out = {};
for (const t of titles) {
  const { data, error } = await s.from('podcast_episodes').select('*').in('title', [t, dec(t)]).order('pub_date', { ascending: false }).limit(1);
  if (error) { console.error(t, error.message); continue; }
  const e = data?.[0];
  if (!e) { console.log('no episode row:', t); continue; }
  out[t] = { youtube_url: e.youtube_url || null, audio_url: e.audio_url || null, pub_date: e.pub_date || null,
             show: e.show_name || e.podcast_name || e.channel_title || null };
}
fs.writeFileSync(`${dir}/w${W}-podcast-links.json`, JSON.stringify(out, null, 1));
console.log(`podcast links: ${Object.keys(out).length}/${titles.length} titles -> ${dir}/w${W}-podcast-links.json`);
