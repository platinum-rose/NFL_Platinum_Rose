#!/usr/bin/env node
// scripts/fix-guest-attribution.js
// ═══════════════════════════════════════════════════════════════════════════
// Andy noticed a "Guest" placeholder host on the Sharp or Square playoff-
// predictions episode and asked whether the real name could be inferred from
// the opening-monologue introduction (all guests are introduced there).
//
// Investigation found this is bigger than one episode: 32 of 47 rows (68%) in
// podcast_host_summaries carry a "Guest"/"unknown" placeholder host. Re-running
// the CURRENT agents/lib/speaker-attribution.js::buildSpeakerMap() against the
// real AssemblyAI speaker_segments for each affected episode shows the
// attribution logic has since been fixed/improved (see the file's own
// "CORRECTION 2026-07-20" note) -- these rows are stale, written before that
// fix, and never reprocessed. Re-running the CURRENT code against the SAME
// transcript correctly resolves several of them today.
//
// This script does NOT re-run the full GPT-4o extraction (that would re-spend
// API cost and could change the actual futures content). It only recomputes
// the speaker map from the already-diarized transcript and, where exactly one
// unclaimed real name resolves for exactly one Guest-labeled row on that
// episode, renames the row's host field in place (and each item inside its
// futures[] array, which also carries a redundant host field) -- content
// (quotes/predictions/leans) is untouched.
//
// Conservative by design: an episode where the speaker map now yields MORE
// unclaimed candidate names than there are Guest rows to fill (e.g. a third
// real host neither previously stored) is left alone as "ambiguous" -- not
// guessed at. An episode where the map itself still can't resolve a name
// (returns the literal string "Guest") is left alone as "still-unresolved" --
// today's code genuinely can't identify that speaker either, so there's
// nothing to backfill.
//
// Usage:
//   node scripts/fix-guest-attribution.js            # dry run, all episodes
//   node scripts/fix-guest-attribution.js --write    # apply the clean renames
// ═══════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { buildSpeakerMap } from '../agents/lib/speaker-attribution.js';

const WRITE = process.argv.includes('--write');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ATTRIBUTION_METHOD = 'speaker_map_backfill_2026-08-30';

async function main() {
  const { data: all, error: allErr } = await supabase.from('podcast_host_summaries').select('episode_id,host,model,futures');
  if (allErr) { console.error(allErr); process.exit(1); }

  const byEp = new Map();
  for (const r of all) {
    if (!byEp.has(r.episode_id)) byEp.set(r.episode_id, []);
    byEp.get(r.episode_id).push(r);
  }
  const guestEpisodes = [...byEp.entries()].filter(([, rows]) => rows.some((r) => /guest|unknown/i.test(r.host)));

  const { data: episodes } = await supabase.from('podcast_episodes').select('id,title,feed_id');
  const epById = new Map(episodes.map((e) => [e.id, e]));
  const { data: feeds } = await supabase.from('podcast_feeds').select('id,name');
  const feedById = new Map(feeds.map((f) => [f.id, f.name]));

  const toRename = []; // { episodeId, model, oldHost, newHost, futures }
  const skipped = [];

  for (const [epId, rows] of guestEpisodes) {
    const ep = epById.get(epId);
    const feedName = ep ? feedById.get(ep.feed_id) : null;
    const { data: t } = await supabase.from('podcast_transcripts').select('speaker_segments').eq('episode_id', epId).single();
    if (!t?.speaker_segments || !feedName) { skipped.push({ epId, title: ep?.title, reason: 'no transcript/feed' }); continue; }

    const map = buildSpeakerMap(t.speaker_segments, feedName);
    const resolvedNames = new Set(Object.values(map).filter((n) => n && n !== 'Ad/Commercial'));
    const knownHosts = new Set(rows.filter((r) => !/guest|unknown/i.test(r.host)).map((r) => r.host));
    const candidateNames = [...resolvedNames].filter((n) => !knownHosts.has(n) && n.toLowerCase() !== 'guest');
    const guestRows = rows.filter((r) => /guest|unknown/i.test(r.host));

    if (candidateNames.length === 1 && guestRows.length === 1) {
      const row = guestRows[0];
      toRename.push({
        episodeId: epId,
        title: ep?.title,
        feedName,
        model: row.model,
        oldHost: row.host,
        newHost: candidateNames[0],
        futures: row.futures,
      });
    } else {
      skipped.push({
        epId,
        title: ep?.title,
        reason: candidateNames.length === 0 ? 'still unresolved by current code' : `ambiguous (${guestRows.length} guest row(s), ${candidateNames.length} candidate(s): ${candidateNames.join(', ')})`,
      });
    }
  }

  console.log(`=== Clean renames (exactly one candidate name for exactly one Guest row) ===`);
  for (const r of toRename) {
    console.log(`- ${r.title}`);
    console.log(`  episode_id=${r.episodeId}  ${r.oldHost} -> ${r.newHost}  (${r.futures?.length ?? 0} futures, content unchanged)`);
  }
  console.log(`\n${toRename.length} clean rename(s).`);

  console.log(`\n=== Left alone (not guessed at) ===`);
  for (const s of skipped) console.log(`- ${s.title || s.epId}: ${s.reason}`);
  console.log(`\n${skipped.length} episode(s) left alone.`);

  if (!WRITE) {
    console.log(`\n[dry-run] No writes performed. Re-run with --write to apply the clean renames.`);
    return;
  }

  let wrote = 0, errors = 0;
  for (const r of toRename) {
    const updatedFutures = Array.isArray(r.futures)
      ? r.futures.map((f) => ({ ...f, host: r.newHost }))
      : r.futures;
    const { error: updErr } = await supabase
      .from('podcast_host_summaries')
      .update({ host: r.newHost, futures: updatedFutures, attribution_method: ATTRIBUTION_METHOD })
      .eq('episode_id', r.episodeId)
      .eq('host', r.oldHost)
      .eq('model', r.model);
    if (updErr) { console.error(`  ❌ ${r.episodeId}: ${updErr.message}`); errors++; continue; }
    console.log(`  ✅ ${r.episodeId}: ${r.oldHost} -> ${r.newHost}`);
    wrote++;
  }
  console.log(`\nDone. renamed=${wrote} errors=${errors}`);
}

main().catch((err) => { console.error(`Fatal: ${err.message}`); process.exit(1); });
