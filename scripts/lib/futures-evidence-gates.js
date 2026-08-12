const TEAM_CODE_ONLY = /^(?:ARI|ATL|BAL|BUF|CAR|CHI|CIN|CLE|DAL|DEN|DET|GB|HOU|IND|JAX|KC|LAC|LAR|LV|MIA|MIN|NE|NO|NYG|NYJ|PHI|PIT|SEA|SF|TB|TEN|WAS)$/i;

export const FUTURES_EVIDENCE_SCHEMAS = Object.freeze({
  article: 'article_intel_review_v2',
  predictionMap: 'prediction_market_team_map_v2',
  predictionCoherence: 'prediction_market_cross_market_coherence_v2',
  youtubeCohort: 'youtube_reviewed_local_intel_cohort_v1',
  oddsExecution: 'futures_odds_execution_validation_v1',
  audit: 'futures_evidence_source_audit_v1',
  bundle: 'futures_evidence_bundle_validation_v1',
});

const FORBIDDEN_YOUTUBE_EPISODES = Object.freeze([
  'youtube-b9NL40Zogkw',
  'youtube-qoCm4G2Jmng',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function finite(value) {
  return value !== null && value !== '' && Number.isFinite(Number(value));
}

function gate(schema, blockers, warnings = [], metrics = {}) {
  return {
    schema,
    status: blockers.length === 0 ? 'pass' : 'blocked',
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    metrics,
  };
}

function cohortFrom(payload, path) {
  return path.reduce((value, key) => value?.[key], payload);
}

function episodeId(value) {
  return value?.source?.episode_id || value?.episode_id || value?.id || '';
}

function forbiddenEpisodeCount(values) {
  return asArray(values).filter((value) => FORBIDDEN_YOUTUBE_EPISODES.includes(episodeId(value))).length;
}

function explicitTeamCollision(row) {
  const text = `${row?.ticker || ''} ${row?.series_ticker || ''} ${row?.title || ''}`;
  const rules = [
    ['NYJ', /\bNew York Jets\b|(?:^|[-_])NYJ(?:$|[-_])/i],
    ['NYG', /\bNew York Giants\b|(?:^|[-_])NYG(?:$|[-_])/i],
    ['LAC', /\bLos Angeles Chargers\b|(?:^|[-_])LAC(?:$|[-_])/i],
    ['LAR', /\bLos Angeles Rams\b|(?:^|[-_])LAR(?:$|[-_])/i],
  ];
  return rules.find(([team, pattern]) => pattern.test(text) && row?.team !== team)?.[0] || null;
}

export function validateArticleEvidence(article) {
  const blockers = [];
  const warnings = [];
  const summary = article?.summary || {};
  const collection = article?.collection || {};
  const schemaOk = article?.schema === FUTURES_EVIDENCE_SCHEMAS.article
    || Number(article?.schema_version || 0) >= 2;
  if (!schemaOk) blockers.push('article artifact is legacy or missing the v2 evidence schema');
  if (collection.complete_for_since_window !== true) {
    blockers.push('requested article date window is not confirmed complete');
  }
  if (collection.local_only === true || collection.database_status === 'skipped_local_only') {
    blockers.push('article corpus is an intentionally partial local-only build');
  }
  if (!Number.isFinite(Number(summary.article_records_assessed))) {
    blockers.push('article record assessment count is missing');
  }
  if (!summary.body_evidence || typeof summary.body_evidence !== 'object') {
    blockers.push('article body-evidence buckets are missing');
  }
  const unresolved = Number(summary.unresolved_pick_oriented_records || 0);
  if (unresolved > 0) blockers.push(`${unresolved} pick-oriented article record(s) remain unresolved`);

  const invalidActualPicks = asArray(article?.actual_picks).filter((pick) => (
    !String(pick?.selection || '').trim()
    || TEAM_CODE_ONLY.test(String(pick?.selection || '').trim())
    || !String(pick?.market || '').trim()
    || !finite(pick?.price)
    || !String(pick?.book || pick?.venue || '').trim()
  ));
  if (invalidActualPicks.length > 0) {
    blockers.push(`${invalidActualPicks.length} actual-pick row(s) lack a named selection, market, price, or venue`);
  }
  if (Number(summary.selections_needing_execution_verification || 0) > 0) {
    warnings.push('explicit analyst selections still need price or venue verification and remain outside actual_picks');
  }
  return gate(FUTURES_EVIDENCE_SCHEMAS.article, blockers, warnings, {
    article_records_assessed: Number(summary.article_records_assessed || 0),
    unresolved_pick_oriented_records: unresolved,
    actual_picks: asArray(article?.actual_picks).length,
    invalid_actual_picks: invalidActualPicks.length,
  });
}

export function validateTeamIdentityArtifact(payload, label = 'team evidence') {
  const validation = payload?.meta?.team_identity_validation;
  const blockers = [];
  if (validation?.schema !== 'team_identity_validation_v1') {
    blockers.push(`${label} is missing team_identity_validation_v1`);
  }
  if (validation?.status !== 'pass') blockers.push(`${label} team-identity validation is not passing`);
  if (Number(validation?.duplicate_evidence_rows || 0) > 0) blockers.push(`${label} contains duplicate evidence rows`);
  if (Number(validation?.primary_source_mismatch_count || 0) > 0) blockers.push(`${label} contains primary/source-prefix mismatches`);
  if (Number(validation?.missing_primary_team_count || 0) > 0) blockers.push(`${label} contains rows without a primary team`);
  return gate('team_identity_artifact_gate_v1', blockers, [], {
    row_count: Number(validation?.row_count || 0),
    duplicate_evidence_rows: Number(validation?.duplicate_evidence_rows || 0),
    primary_source_mismatch_count: Number(validation?.primary_source_mismatch_count || 0),
  });
}

export function validateAvailabilityArtifacts({ availability, starters, impact }) {
  const blockers = [];
  const identity = validateTeamIdentityArtifact(availability, 'player availability');
  blockers.push(...identity.blockers);
  const evidence = availability?.meta?.availability_evidence_validation;
  if (evidence?.schema !== 'availability_evidence_validation_v1' || evidence?.status !== 'pass') {
    blockers.push('player availability evidence validation is missing or blocked');
  }
  if (Number(evidence?.unflagged_contradiction_count || 0) > 0) {
    blockers.push('player availability contains unflagged status contradictions');
  }
  for (const [label, validation] of [
    ['player availability', availability?.meta?.named_status_review_validation],
    ['projected starters', starters?.meta?.named_status_review_validation],
    ['availability impact digest', impact?.meta?.named_status_review_validation],
  ]) {
    if (validation?.schema !== 'named_status_review_validation_v1' || validation?.status !== 'pass') {
      blockers.push(`${label} named-status review validation is missing or blocked`);
    }
  }
  if (impact?.meta?.inputs?.availability?.generated_at !== availability?.meta?.generated_at) {
    blockers.push('availability impact digest does not name the current availability input');
  }
  if (impact?.meta?.inputs?.projected_starters?.generated_at !== starters?.meta?.generated_at) {
    blockers.push('availability impact digest does not name the current projected-starters input');
  }
  return gate('availability_artifact_gate_v1', blockers, [], {
    availability_events: Number(availability?.meta?.event_count || 0),
    conflicted_intel: Number(availability?.meta?.conflicted_intel_count || 0),
    projected_starters: Number(starters?.meta?.player_count || 0),
    digest_events: Number(impact?.meta?.digest_event_count || 0),
  });
}

export function validatePredictionMarketMap(predictionMap, season = 2026) {
  const blockers = [];
  const rows = asArray(predictionMap?.contracts);
  const mapped = rows.filter((row) => row?.mapped === true);
  if (predictionMap?.meta?.schema !== FUTURES_EVIDENCE_SCHEMAS.predictionMap) {
    blockers.push('prediction-market map is missing prediction_market_team_map_v2');
  }
  if (Number(predictionMap?.meta?.season) !== Number(season)) {
    blockers.push(`prediction-market map season is not ${season}`);
  }
  const wrongSeasonMapped = mapped.filter((row) => Number(row?.season) !== Number(season) || row?.season_scope_status !== 'eligible');
  if (wrongSeasonMapped.length > 0 || Number(predictionMap?.meta?.wrong_season_mapped_count || 0) > 0) {
    blockers.push('prediction-market map contains wrong-season mapped contracts');
  }
  const invalidMapped = mapped.filter((row) => (
    !row?.team
    || row?.taxonomy_supported !== true
    || row?.context_eligible !== true
  ));
  if (invalidMapped.length > 0) blockers.push(`${invalidMapped.length} mapped prediction contract(s) fail taxonomy/context eligibility`);
  const collisions = mapped.filter((row) => explicitTeamCollision(row));
  if (collisions.length > 0) blockers.push(`${collisions.length} known NY/LA team-identity collision(s) remain mapped`);
  const warnedActionable = rows.filter((row) => row?.liquidity_warning === true && row?.actionable_coherence_eligible === true);
  if (warnedActionable.length > 0) blockers.push(`${warnedActionable.length} liquidity-warned contract(s) remain actionable for coherence`);
  if (Number(predictionMap?.meta?.mapped_count ?? mapped.length) !== mapped.length) {
    blockers.push('prediction-market mapped count does not match contract rows');
  }
  return gate(FUTURES_EVIDENCE_SCHEMAS.predictionMap, blockers, [], {
    contract_count: rows.length,
    mapped_count: mapped.length,
    wrong_season_mapped_count: wrongSeasonMapped.length,
    identity_collision_count: collisions.length,
    liquidity_warned_actionable_count: warnedActionable.length,
  });
}

export function validatePredictionCoherence(predictionMap, coherence) {
  const blockers = [];
  if (coherence?.meta?.schema !== FUTURES_EVIDENCE_SCHEMAS.predictionCoherence) {
    blockers.push('prediction coherence is missing prediction_market_cross_market_coherence_v2');
  }
  if (coherence?.meta?.source_schema !== FUTURES_EVIDENCE_SCHEMAS.predictionMap) {
    blockers.push('prediction coherence does not declare a v2 map source');
  }
  if (coherence?.meta?.explicit_eligibility_contract !== true) {
    blockers.push('prediction coherence lacks the explicit eligibility contract');
  }
  if (coherence?.meta?.source_generated_at !== predictionMap?.meta?.generated_at) {
    blockers.push('prediction coherence lineage does not match the current map generation');
  }
  const expectedActionable = asArray(predictionMap?.contracts)
    .filter((row) => row?.actionable_coherence_eligible === true).length;
  if (Number(coherence?.meta?.actionable_contract_count) !== expectedActionable) {
    blockers.push('prediction coherence actionable denominator does not match the map');
  }
  if (Number(coherence?.meta?.eligible_context_contract_count) !== Number(predictionMap?.meta?.eligible_context_count)) {
    blockers.push('prediction coherence eligible-context denominator does not match the map');
  }
  if (coherence?.meta?.execution_source_status !== 'blocked_settlement_terms_unverified') {
    blockers.push('prediction coherence does not preserve the settlement-term execution block');
  }
  return gate(FUTURES_EVIDENCE_SCHEMAS.predictionCoherence, blockers, [], {
    eligible_context_contract_count: Number(coherence?.meta?.eligible_context_contract_count || 0),
    actionable_contract_count: Number(coherence?.meta?.actionable_contract_count || 0),
    execution_eligible_contract_count: Number(coherence?.meta?.execution_eligible_contract_count || 0),
  });
}

export function validatePredictionArtifacts({ predictionMap, coherence }, options = {}) {
  const map = validatePredictionMarketMap(predictionMap, options.season || 2026);
  const crossMarket = validatePredictionCoherence(predictionMap, coherence);
  return gate('prediction_market_artifact_gate_v1', [...map.blockers, ...crossMarket.blockers], [], {
    map: map.metrics,
    coherence: crossMarket.metrics,
  });
}

export function validateYoutubeArtifacts({ reviewReport, status, queue, summary, freshness }, options = {}) {
  const expectedItemCount = Number(options.expectedItemCount || 43);
  const blockers = [];
  const cohorts = [
    ['review report', cohortFrom(reviewReport, ['accepted_cohort'])],
    ['status ledger', cohortFrom(status, ['accepted_cohort'])],
    ['local queue', cohortFrom(queue, ['cohort'])],
    ['agent summary', cohortFrom(summary, ['cohort'])],
    ['freshness reconciliation', cohortFrom(freshness, ['youtube', 'accepted', 'cohort'])],
  ];
  const fingerprints = new Set();
  for (const [label, cohort] of cohorts) {
    if (cohort?.schema !== FUTURES_EVIDENCE_SCHEMAS.youtubeCohort) {
      blockers.push(`${label} is missing the reviewed YouTube cohort schema`);
      continue;
    }
    if (!cohort?.fingerprint_sha256) blockers.push(`${label} is missing a cohort fingerprint`);
    else fingerprints.add(cohort.fingerprint_sha256);
    if (Number(cohort?.item_count) !== expectedItemCount) {
      blockers.push(`${label} cohort count is ${cohort?.item_count ?? 'missing'}, expected ${expectedItemCount}`);
    }
    if (cohort?.forbidden_episode_evidence_absent !== true || Number(cohort?.forbidden_episode_evidence_count || 0) > 0) {
      blockers.push(`${label} cohort contains forbidden episode evidence`);
    }
  }
  if (fingerprints.size > 1) blockers.push('YouTube downstream cohort fingerprints do not match');
  const promotedStatus = asArray(status?.items).filter((item) => item?.status === 'promote_to_local_intel');
  const forbiddenAccepted = forbiddenEpisodeCount(promotedStatus)
    + forbiddenEpisodeCount(queue?.items)
    + forbiddenEpisodeCount(queue?.notes)
    + forbiddenEpisodeCount(summary?.items)
    + forbiddenEpisodeCount(summary?.notes);
  if (forbiddenAccepted > 0) blockers.push(`${forbiddenAccepted} forbidden YouTube evidence row(s) remain in accepted artifacts`);
  if (Number(queue?.exported_items) !== expectedItemCount || Number(summary?.exported_items) !== expectedItemCount) {
    blockers.push('YouTube queue/summary exported counts do not match the reviewed cohort');
  }
  return gate('youtube_artifact_gate_v1', blockers, [], {
    cohort_count: expectedItemCount,
    fingerprint_count: fingerprints.size,
    fingerprint_sha256: [...fingerprints][0] || null,
    forbidden_accepted_evidence_count: forbiddenAccepted,
  });
}

export function validateOddsExecutionArtifact(oddsExecution) {
  const blockers = [];
  if (oddsExecution?.meta?.schema !== FUTURES_EVIDENCE_SCHEMAS.oddsExecution) {
    blockers.push('futures odds artifact is missing futures_odds_execution_validation_v1');
  }
  const rows = asArray(oddsExecution?.rows);
  const placeableBooks = new Set(Object.keys(oddsExecution?.meta?.placeable_books || {}));
  const invalidEligible = rows.filter((row) => row?.execution_reference_eligible === true && (
    !placeableBooks.has(row?.book)
    || !finite(row?.price)
    || String(row?.snapshot_time || '').slice(0, 10) !== oddsExecution?.meta?.current_snapshot_date
  ));
  if (invalidEligible.length > 0) blockers.push(`${invalidEligible.length} execution-reference row(s) fail placeability, price, or timestamp checks`);
  if (oddsExecution?.bills_packers_exacta?.execution_claim_allowed === true
    && Number(oddsExecution?.bills_packers_exacta?.placeable_book_count || 0) < 2) {
    blockers.push('Bills/Packers exacta allows execution without two placeable books');
  }
  return gate(FUTURES_EVIDENCE_SCHEMAS.oddsExecution, blockers, [], {
    rows_total: rows.length,
    execution_reference_eligible_rows: Number(oddsExecution?.meta?.execution_reference_eligible_rows || 0),
    invalid_execution_reference_rows: invalidEligible.length,
    exacta_execution_claim_allowed: oddsExecution?.bills_packers_exacta?.execution_claim_allowed === true,
  });
}

export function validateSourceAuditArtifact(sourceAudit) {
  const blockers = [];
  if (!sourceAudit?.generated_at) blockers.push('source audit generated time is missing');
  if (sourceAudit?.summary?.frontierReady !== true) blockers.push('source audit frontier gate is blocked');
  if (Number(sourceAudit?.summary?.counts?.blocked || 0) > 0) blockers.push('source audit contains blocked sources');
  if (Number(sourceAudit?.summary?.counts?.missing || 0) > 0) blockers.push('source audit contains missing sources');
  if (Number(sourceAudit?.summary?.counts?.stale || 0) > 0) blockers.push('source audit contains stale sources');
  return gate(FUTURES_EVIDENCE_SCHEMAS.audit, blockers, [], {
    generated_at: sourceAudit?.generated_at || null,
    counts: sourceAudit?.summary?.counts || null,
  });
}

export function validateFuturesEvidenceBundle(bundle, options = {}) {
  const validations = {
    article: validateArticleEvidence(bundle?.article),
    training_camp_identity: validateTeamIdentityArtifact(bundle?.camp, 'training camp'),
    availability: validateAvailabilityArtifacts({
      availability: bundle?.availability,
      starters: bundle?.starters,
      impact: bundle?.impact,
    }),
    prediction_markets: validatePredictionArtifacts({
      predictionMap: bundle?.predictionMap,
      coherence: bundle?.coherence,
    }, options),
    youtube: validateYoutubeArtifacts({
      reviewReport: bundle?.youtubeReview,
      status: bundle?.youtubeStatus,
      queue: bundle?.youtubeQueue,
      summary: bundle?.youtubeSummary,
      freshness: bundle?.freshness,
    }, options),
    odds_execution: validateOddsExecutionArtifact(bundle?.oddsExecution),
  };
  if (bundle?.sourceAudit) validations.source_audit = validateSourceAuditArtifact(bundle.sourceAudit);
  const blockers = Object.entries(validations)
    .flatMap(([name, validation]) => validation.blockers.map((message) => `${name}: ${message}`));
  return {
    ...gate(FUTURES_EVIDENCE_SCHEMAS.bundle, blockers, [], {
      gate_count: Object.keys(validations).length,
      passing_gate_count: Object.values(validations).filter((value) => value.status === 'pass').length,
    }),
    validations,
  };
}

export { FORBIDDEN_YOUTUBE_EPISODES };
