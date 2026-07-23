#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const dossierPath = path.resolve(ROOT, getArg('--dossier', '.nfl/portfolio/dossier-2026-07-22.json'));

function fail(list, id, message) {
  list.push({ id, message });
}
function hasSideText(team, pattern) {
  return pattern.test(String(team || ''));
}
function checkMarketRows(dossier) {
  const failures = [];
  const wins = dossier.synthesis_input?.wins || [];
  const playoffs = dossier.synthesis_input?.playoffs || [];

  if (wins.length !== 32) fail(failures, 'wins.row_count', `Expected 32 canonical wins rows, found ${wins.length}.`);
  if (playoffs.length !== 32) fail(failures, 'playoffs.row_count', `Expected 32 canonical playoffs rows, found ${playoffs.length}.`);

  for (const row of wins) {
    if (hasSideText(row.team, /\b(?:over|under)\s+\d/i)) fail(failures, 'wins.side_text_team', `Wins row team contains side text: ${row.team}`);
    for (const field of ['over_fair_prob', 'under_fair_prob', 'best_over_edge_pct', 'best_under_edge_pct', 'line_consensus_confidence']) {
      if (row[field] == null) fail(failures, `wins.${field}`, `Wins row missing ${field}: ${row.team}`);
    }
    if (dossier.meta?.sim_version) {
      if (row.sim_win_total?.over_prob == null || row.sim_win_total?.under_prob == null) fail(failures, 'wins.sim_win_total', `Wins row missing simulated side probabilities: ${row.team}`);
      if (row.sim_win_total?.over_ci90?.lower == null || row.sim_win_total?.under_ci90?.lower == null) fail(failures, 'wins.sim_ci90', `Wins row missing simulated side intervals: ${row.team}`);
    }
    for (const [book, b] of Object.entries(row.books || {})) {
      if (!b.observed_at) fail(failures, 'wins.observed_at', `Wins ${row.team} ${book} missing observed_at.`);
      if (b.quote_age_hours == null) fail(failures, 'wins.quote_age_hours', `Wins ${row.team} ${book} missing quote_age_hours.`);
    }
  }

  for (const row of playoffs) {
    if (hasSideText(row.team, /\b(?:yes|no)\b/i)) fail(failures, 'playoffs.side_text_team', `Playoffs row team contains side text: ${row.team}`);
    if (row.fair_prob == null) fail(failures, 'playoffs.fair_prob', `Playoffs row missing devigged fair_prob: ${row.team}`);
    if (!row.best_observed_at) fail(failures, 'playoffs.best_observed_at', `Playoffs row missing best_observed_at: ${row.team}`);
    if (dossier.meta?.sim_version && row.sim?.prob_ci90?.lower == null) fail(failures, 'playoffs.sim_ci90', `Playoffs row missing simulated interval: ${row.team}`);
  }

  return failures;
}

const dossier = JSON.parse(fs.readFileSync(dossierPath, 'utf8'));
const failures = checkMarketRows(dossier);
if (failures.length) {
  console.error(`Futures dossier conformance FAILED (${failures.length})`);
  for (const f of failures.slice(0, 80)) console.error(`- ${f.id}: ${f.message}`);
  if (failures.length > 80) console.error(`- ... ${failures.length - 80} more`);
  process.exitCode = 1;
} else {
  console.log('Futures dossier conformance passed.');
}
