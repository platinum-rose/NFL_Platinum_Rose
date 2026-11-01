import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { canonicalTeam, playerNameKey } from '../../../agents/lib/secondary-matchup-vulnerability.js';

const root = process.cwd();
const reportDir = path.join(root, 'reports/engineering/week8-secondary-refresh');
const manualDir = path.join(root, 'data/secondary-matchups/manual');
const read = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const json = (v) => JSON.stringify(v, null, 2) + '\n';
const reviewedAt = new Date().toISOString();
const baseline = await read(path.join(reportDir, 'baseline.json'));
const rosterBytes = await fs.readFile(path.join(root, baseline.roster.path));
if (sha(rosterBytes) !== baseline.roster.sha256) throw new Error('Roster changed during review; re-audit before writing.');
const roster = JSON.parse(rosterBytes);
const byId = new Map();
const byIdentity = new Map();
for (const [name, records] of Object.entries(roster.players)) {
  for (const record of records) {
    const rec = { ...record, team: canonicalTeam(record.team), name };
    byId.set(String(record.espn_id), rec);
    const key = `${rec.team}|${playerNameKey(name)}`;
    const existing = byIdentity.get(key);
    if (!existing || existing.group === 'practiceSquad') byIdentity.set(key, rec);
  }
}
const receipts = await read(path.join(reportDir, 'capture-receipts.json'));
if (receipts.length !== 33) throw new Error(`Expected 33 retained captures, got ${receipts.length}`);
for (const receipt of receipts) {
  const bytes = await fs.readFile(path.join(root, receipt.path));
  if (sha(bytes) !== receipt.sha256 || bytes.length !== receipt.bytes) throw new Error(`Capture changed: ${receipt.path}`);
}
const catalog = await read(path.join(reportDir, 'raw-depth/teams.json'));
const depthByIdentity = new Map();
const depthMissingRoster = [];
const firstUnit = { secondary: new Map(), receivers: new Map() };
const teamCharts = [];
const secondarySlots = new Set(['lcb', 'rcb', 'nb', 'fs', 'ss', 'cb', 's']);
for (const { team } of catalog.sports[0].leagues[0].teams) {
  const abbr = canonicalTeam(team.abbreviation);
  const rawPath = `reports/engineering/week8-secondary-refresh/raw-depth/${team.abbreviation}.json`;
  const raw = await read(path.join(root, rawPath));
  const receipt = receipts.find((x) => x.path === rawPath);
  if (!receipt) throw new Error(`Missing capture receipt: ${abbr}`);
  teamCharts.push({ team: abbr, source_url: receipt.source_url, observed_at: receipt.observed_at, sha256: receipt.sha256, source_updated_at: null });
  for (const group of raw.items || []) {
    for (const [slot, position] of Object.entries(group.positions || {})) {
      if (!secondarySlots.has(slot) && !['wr', 'te'].includes(slot)) continue;
      const minimumRank = Math.min(...(position.athletes || []).map((a) => Number(a.rank)));
      for (const athlete of position.athletes || []) {
        const id = athlete.athlete?.$ref?.split('/').pop()?.split('?')[0];
        const person = byId.get(String(id));
        if (!person || person.team !== abbr) {
          depthMissingRoster.push({ team: abbr, espn_id: id, slot, rank: athlete.rank, reason: !person ? 'not_in_fresh_roster_snapshot' : 'team_disagrees_with_fresh_roster', roster_team: person?.team || null });
          continue;
        }
        const key = `${abbr}|${playerNameKey(person.name)}`;
        const evidence = { slot, rank: Number(athlete.rank), package_slot: athlete.slot, chart_group: group.name, source_url: receipt.source_url, captured_at: receipt.observed_at, source_updated_at: null };
        if (!depthByIdentity.has(key)) depthByIdentity.set(key, []);
        depthByIdentity.get(key).push(evidence);
        const isFirst = ['wr'].includes(slot) ? Number(athlete.rank) <= 3 : Number(athlete.rank) === minimumRank;
        if (isFirst && person.group !== 'practiceSquad') {
          (secondarySlots.has(slot) ? firstUnit.secondary : firstUnit.receivers).set(key, person);
        }
      }
    }
  }
}

const roles = {
  lcb: { role: 'outside_cb', side: 'left', tags: ['outside_wr_boost'] },
  rcb: { role: 'outside_cb', side: 'right', tags: ['outside_wr_boost'] },
  nb: { role: 'nickel_cb', side: 'slot', tags: ['slot_wr_boost', 'inside_seam_boost'] },
  fs: { role: 'free_safety', side: 'middle', tags: ['deep_pass_boost'] },
  ss: { role: 'strong_safety', side: 'middle', tags: ['te_middle_boost'] },
};
const reviewRows = [];
const excluded = [];
const staged = new Map();
const changes = { secondary: { before: 0, after: 0, added_from_depth: 0 }, receivers: { before: 0, after: 0, added_from_depth: 0 } };

for (const [kind, filename] of [['secondary', 'secondary-roles-2026.json'], ['receivers', 'receiver-roles-2026.json']]) {
  const originalPath = `data/secondary-matchups/manual/${filename}`;
  const expected = baseline.files.find((x) => x.path === originalPath);
  const oldBytes = await fs.readFile(path.join(root, originalPath));
  if (sha(oldBytes) !== expected.sha256) throw new Error(`Seed changed before review: ${originalPath}`);
  const oldRows = JSON.parse(oldBytes);
  changes[kind].before = oldRows.length;
  const oldIndex = new Map(oldRows.map((r) => [`${canonicalTeam(r.team)}|${playerNameKey(r.player_name)}`, r]));
  const identities = new Set([...oldIndex.keys(), ...firstUnit[kind].keys()]);
  const next = [];
  for (const key of [...identities].sort()) {
    const old = oldIndex.get(key);
    const person = byIdentity.get(key);
    if (!person || person.group === 'practiceSquad') {
      excluded.push({ kind, prior_row: old || null, reason: !person ? 'unverified_current_team_membership' : 'practice_squad_role_not_confirmed' });
      continue;
    }
    const depth = (depthByIdentity.get(key) || []).filter((d) => kind === 'secondary' ? secondarySlots.has(d.slot) : ['wr', 'te'].includes(d.slot));
    const primary = depth.filter((d) => kind === 'secondary' ? d.rank === 1 : d.slot === 'wr' ? d.rank <= 3 : d.rank === 1);
    const uniqueSlots = [...new Set(primary.map((d) => d.slot))];
    const currentRole = kind === 'secondary' && uniqueSlots.length === 1 ? roles[uniqueSlots[0]] : null;
    const row = {
      team: person.team, player_name: person.name, position: person.position,
      ...(kind === 'secondary' ? {
        role: currentRole?.role || null,
        side: currentRole?.side || null,
        impact_tier: primary.length ? 'starter' : depth.length ? 'depth' : 'unrated',
        receiver_archetypes_impacted: [], weakness_tags: currentRole?.tags || [],
      } : { roles: [], target_share_tier: 'unknown', route_area_tags: [] }),
      source: depth.length ? 'espn_2026_depth_chart_review' : 'espn_2026_roster_membership_only',
      source_url: depth[0]?.source_url || 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
      source_date: null,
      reviewed_at: reviewedAt,
      roster_source: roster.generated_at,
      roster_group: person.group,
      current_depth_evidence: depth,
      needs_human_review: true,
      review_status: kind === 'secondary' && currentRole ? 'current_depth_slot_only_quality_unrated' : kind === 'secondary' ? 'no_unique_first_unit_role' : 'receiver_archetype_and_target_tier_withheld',
      notes: kind === 'secondary'
        ? 'ESPN depth slot/rank is source evidence, not a simultaneous lineup, coverage tendency, shutdown assignment, skill grade or game-availability clearance. Starter/depth impact uses the existing uncalibrated research heuristic; all subjective prior elite/plus tiers are withheld.'
        : 'Current team membership and any depth slots are retained. Prior alpha/slot/route-area/target-share archetypes are withheld because the captured depth chart does not establish them. No replacement archetype is guessed.',
      prior_claim: old || null,
    };
    next.push(row);
    if (!old) changes[kind].added_from_depth += 1;
    reviewRows.push({ kind, player_name: person.name, team: person.team, roster_group: person.group, prior_name: old?.player_name || null, prior_roles: kind === 'secondary' ? old?.role || null : old?.roles || [], current_depth_slots: depth, active_role: kind === 'secondary' ? row.role : [], status: row.review_status });
  }
  next.sort((a, b) => a.team.localeCompare(b.team) || a.player_name.localeCompare(b.player_name));
  changes[kind].after = next.length;
  staged.set(originalPath, json(next));
}

const schemePath = 'data/secondary-matchups/manual/coverage-schemes-2026.json';
const schemeBytes = await fs.readFile(path.join(root, schemePath));
if (sha(schemeBytes) !== baseline.files.find((x) => x.path === schemePath).sha256) throw new Error('Coverage scheme seed changed before review.');
const priorSchemes = JSON.parse(schemeBytes);
const schemes = priorSchemes.map((r) => ({
  team: canonicalTeam(r.team), season: 2026, week: 8,
  primary_coverage_family: null, scheme_tags: [], pressure_profile: null, confidence: 0,
  source: 'withheld_stale_scheme_claim', source_url: r.source_url || null,
  source_date: r.source_date || null, updated_at: r.updated_at || null, stale_after: r.stale_after || null,
  reviewed_at: reviewedAt, needs_human_review: true, review_status: 'withheld_no_current_coverage_tendency_source',
  notes: 'Historical scheme claim is preserved below but excluded from Week 8 amplifiers. Current depth-chart formation/personnel does not verify man/zone, pressure rates or coaching tendencies.',
  prior_claim: r,
}));
staged.set(schemePath, json(schemes));

const audit = {
  schema: 'week8_secondary_seed_review_v1', reviewed_at: reviewedAt, week: 8,
  status: 'current_depth_and_membership_review_complete_with_withheld_claims',
  roster: baseline.roster,
  depth_sources: teamCharts,
  source_update_time_policy: 'Sources do not expose a verified chart update timestamp. Capture time is observation time only.',
  counts: { ...changes, coverage_schemes_withheld: schemes.length, depth_refs_withheld_for_roster_mismatch: depthMissingRoster.length, excluded_prior_rows: excluded.length },
  tier_policy: 'No prior elite/plus quality grade is carried into current scoring. Starter/depth refers only to captured depth rank; the legacy severity formula remains an uncalibrated diagnostic.',
  receiver_policy: 'All unsupported receiver archetypes, route areas and target-share tiers are withheld; no receiver opportunity ranking is produced from unverified role claims.',
  rows: reviewRows, excluded_prior_rows: excluded, depth_roster_mismatches: depthMissingRoster,
  write_preconditions: baseline.files.filter((x) => x.path.includes('/manual/')),
  resulting_hashes: Object.fromEntries([...staged].map(([p, contents]) => [p, sha(contents)])),
  guardrails: { paid_calls: 0, supabase_actions: 0, account_actions: 0, human_approval_files_changed: false, tracker_publication: false },
};
await fs.writeFile(path.join(reportDir, 'seed-review.json'), json(audit));
for (const [p, contents] of staged) await fs.writeFile(path.join(reportDir, path.basename(p)), contents);
if (process.argv.includes('--write-reviewed-seeds')) {
  for (const [p, contents] of staged) await fs.writeFile(path.join(root, p), contents);
}
console.log(JSON.stringify({ wrote_reviewed_seeds: process.argv.includes('--write-reviewed-seeds'), counts: audit.counts, role_rows: reviewRows.length, raw_receipts: receipts.length }));
