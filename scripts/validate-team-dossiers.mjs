#!/usr/bin/env node
// Validates a built dossier set: 32 teams, schema, no market keys, every section has status/through_week,
// WAS/LAR canonical, md present with through_week header, matchups reference real dossiers.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tag = (process.argv.find((a) => a.startsWith('--tag=')) || '--tag=2026-w06').split('=')[1];
const dir = path.join(ROOT, 'data/generated/team-dossiers', tag);
const errs = []; const warn = [];
const J = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const idx = J('index.json'); const cw = J('team-crosswalk.json');
if (idx.teams.length !== 32) errs.push(`index.teams=${idx.teams.length}`);
for (const bad of ['WSH', 'LA', 'JAC']) if (idx.teams.includes(bad)) errs.push(`non-canonical code ${bad}`);
const BAN = /^(ats|ou|line|ml|spread|total|cover_margin|implied_pts|moneyline|market_implied.*|odds|price|ticket|bankroll|pick)$/i;
const scan = (o, p, f) => { if (Array.isArray(o)) o.forEach((x, i) => scan(x, `${p}[${i}]`, f)); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (BAN.test(k)) errs.push(`${f}: market key ${p}.${k}`); scan(v, `${p}.${k}`, f); } };
const SECS = ['identity', 'standing', 'game_log', 'season_profile_espn', 'efficiency_nflverse', 'ftn', 'power', 'scheme_context', 'availability', 'priors', 'data_quality'];
for (const t of idx.teams) {
  const f = `${t}.json`; if (!fs.existsSync(path.join(dir, f))) { errs.push(`missing ${f}`); continue; }
  const d = J(f);
  if (d.schema !== 'team_dossier_v1' || d.team !== t) errs.push(`${f}: schema/team`);
  if (d.market_data_included !== false) errs.push(`${f}: market_data_included`);
  for (const s of SECS) if (!(s in d)) errs.push(`${f}: missing section ${s}`);
  if (!d.standing) errs.push(`${f}: no standing`);
  if (d.game_log.length !== d.completed_weeks) errs.push(`${f}: game_log length ${d.game_log.length}`);
  const played = d.game_log.filter((g) => !g.bye).length; if (played !== d.standing?.games) errs.push(`${f}: game_log ${played} != standing games ${d.standing?.games}`);
  const ptsFor = d.game_log.filter((g) => !g.bye).reduce((s, g) => s + g.pts, 0); if (ptsFor !== d.standing?.pf) errs.push(`${f}: PF log ${ptsFor} != standing ${d.standing?.pf}`);
  const ptsAg = d.game_log.filter((g) => !g.bye).reduce((s, g) => s + g.opp_pts, 0); if (ptsAg !== d.standing?.pa) errs.push(`${f}: PA log ${ptsAg} != standing ${d.standing?.pa}`);
  for (const k of ['standing', 'ftn', 'efficiency_nflverse', 'power']) if (!(k in d.data_quality)) errs.push(`${f}: data_quality.${k}`);
  const av = d.availability, pr = d.priors;
  if (!['built', 'partial'].includes(av.status)) errs.push(`${f}: availability.status ${av.status}`);
  if (!['built', 'partial'].includes(pr.status)) errs.push(`${f}: priors.status ${pr.status}`);
  if (typeof av.roster_gate !== 'string') errs.push(`${f}: roster_gate not a string`);
  else if (av.roster_gate !== 'passed') warn.push(`${f}: roster_gate ${av.roster_gate}`);
  for (const k of ['as_of', 'use_policy', 'reported_injuries', 'operator_reported', 'projected_starters', 'impact_digest', 'live_events']) if (!(k in av)) errs.push(`${f}: availability.${k} missing`);
  const prl = pr.prior_season_2025; if (!prl) errs.push(`${f}: priors.prior_season_2025 missing`);
  if (!JSON.stringify(pr).includes('preseason_prior') && pr.camp_notes?.items?.length) errs.push(`${f}: camp notes not labelled preseason_prior`);
  if (!JSON.stringify(pr).includes('prior_season')) errs.push(`${f}: priors lacks prior_season label`);
  const excl = new Set((av.operator_reported || []).filter((o) => o.kind === 'status').map((o) => o.player));
  for (const e of d.scheme_context?.secondary_matchup?.entries || []) for (const r of e.target_receivers || []) if (excl.has(r.player_name) || ['operator_ir', 'reported_out'].includes(r.availability_flag)) errs.push(`${f}: unavailable player ${r.player_name} still in target_receivers`);
  if (av.as_of?.espn_status && Date.now() - Date.parse(av.as_of.espn_status) > 36 * 3600e3) warn.push(`${f}: ESPN status older than 36h`);
  scan(d, '$', f);
  const md = path.join(dir, `${t}.md`); if (!fs.existsSync(md)) errs.push(`missing ${t}.md`); else {
    const m = fs.readFileSync(md, 'utf8'); if (!/data through W\d/.test(m)) errs.push(`${t}.md: no through_week header`); if (!/FTN \w+ \(through W/.test(m)) errs.push(`${t}.md: FTN freshness missing`); if (/\b(ATS|over\/under)\b/i.test(m.replace('no market data (lines, ATS/OU, prices)', ''))) errs.push(`${t}.md: market term`);
    const approxTok = Math.round(m.length / 3.6); if (approxTok > 2500) warn.push(`${t}.md ~${approxTok} tokens > 2500`);
  }
}
for (const mu of idx.matchups) { const [a, h] = mu.split('@'); if (!idx.teams.includes(a) || !idx.teams.includes(h)) errs.push(`matchup ${mu} unknown team`); const m = J(`matchups/${mu}.json`); scan(m, '$', mu); if (m.market_data_included !== false) errs.push(`${mu}: market flag`); }
scan(J('league-table.json'), '$', 'league-table.json');
if (Object.keys(cw.teams).length !== 32) errs.push('crosswalk size');
console.log(`validate ${tag}: ${errs.length} errors, ${warn.length} warnings`); errs.forEach((e) => console.log('ERR ', e)); warn.forEach((w) => console.log('WARN', w));
process.exit(errs.length ? 1 : 0);
