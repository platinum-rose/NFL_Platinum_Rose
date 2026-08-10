// agents/yahoo-league-settings.js
// ═══════════════════════════════════════════════════════════════════════════════
// List the authenticated user's NFL fantasy leagues and dump each league's scoring
// settings → data/fantasy/yahoo-league-<key>-scoring.json. Also infers the coarse
// scoring bucket (ppr | half | standard) from the reception modifier so the value
// board can be run with the right --scoring flag for that league.
//
// Usage:
//   node agents/yahoo-league-settings.js [--season 2026] [--json-dir data/fantasy]
// Env: YAHOO_* (see src/lib/yahoo.js)
// ═══════════════════════════════════════════════════════════════════════════════
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import { yget, deepCollect, collectionItems, findAll } from './lib/yahoo.js';

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const JSON_DIR = getArg('--json-dir', 'data/fantasy');

// A "stats" container is either { stats: [{stat:{...}}] } or numeric-keyed.
function statList(container) {
  if (!container) return [];
  const arr = container.stats ?? container;
  if (Array.isArray(arr)) return arr.map((x) => x.stat ?? x);
  return collectionItems(arr).map((x) => x.stat ?? x);
}

function inferBucket(modifiers) {
  const rec = modifiers.find((m) => /reception/i.test(m.name || m.display_name || ''));
  if (!rec) return { bucket: 'standard', rec_point: 0 };
  const v = Number(rec.value);
  if (v >= 0.9) return { bucket: 'ppr', rec_point: v };
  if (v >= 0.4) return { bucket: 'half', rec_point: v };
  return { bucket: 'standard', rec_point: v };
}

(async () => {
  console.log('📋 Yahoo league settings for the authenticated user');

  // 1) The user's NFL leagues.
  const lj = await yget('users;use_login=1/games;game_keys=nfl/leagues');
  const leagueNodes = findAll(lj?.fantasy_content ?? lj, 'league');
  // Each league node is typically an array whose first element carries the meta.
  const leagues = [];
  const seen = new Set();
  for (const node of leagueNodes) {
    const meta = deepCollect(node);
    if (!meta.league_key || seen.has(meta.league_key)) continue;
    seen.add(meta.league_key);
    leagues.push({ league_key: meta.league_key, name: meta.name, season: meta.season, num_teams: meta.num_teams, scoring_type: meta.scoring_type });
  }
  if (!leagues.length) { console.error('✖ No NFL leagues found for this account. (Wrong Yahoo login, or no NFL league yet.)'); process.exit(2); }
  console.log(`   found ${leagues.length} league(s): ${leagues.map((l) => `${l.name} [${l.league_key}]`).join(', ')}`);

  await mkdir(JSON_DIR, { recursive: true });

  // 2) Each league's scoring settings.
  for (const lg of leagues) {
    const sj = await yget(`league/${lg.league_key}/settings`);
    const settings = findAll(sj?.fantasy_content ?? sj, 'settings')[0] || {};
    const cats = statList(findAll(settings, 'stat_categories')[0]);
    const mods = statList(findAll(settings, 'stat_modifiers')[0]);

    const nameById = {};
    for (const c of cats) nameById[String(c.stat_id)] = { name: c.name, display_name: c.display_name, position_type: c.position_type };

    const modifiers = mods.map((m) => ({
      stat_id: Number(m.stat_id),
      value: Number(m.value),
      ...(nameById[String(m.stat_id)] || {}),
    }));

    const { bucket, rec_point } = inferBucket(modifiers);
    const out = {
      league_key: lg.league_key,
      name: lg.name,
      season: lg.season,
      num_teams: lg.num_teams != null ? Number(lg.num_teams) : null,
      scoring_type: lg.scoring_type,           // Yahoo's own label (e.g. "head")
      inferred_bucket: bucket,                  // ppr | half | standard (for --scoring)
      reception_point: rec_point,
      modifiers,                                // full per-stat scoring
      pulled_at: new Date().toISOString(),
    };
    const file = path.join(JSON_DIR, `yahoo-league-${lg.league_key.replace(/\./g, '_')}-scoring.json`);
    await writeFile(file, JSON.stringify(out, null, 2));
    console.log(`   ✅ ${lg.name}: bucket=${bucket} (rec ${rec_point}pt) · ${modifiers.length} scoring rules → ${file}`);
    console.log(`      → value board: node agents/fantasy-value-report.js --scoring ${bucket}`);
  }
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
