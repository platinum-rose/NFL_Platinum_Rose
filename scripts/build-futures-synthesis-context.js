// Build a compact, local-only supplement for portfolio-synthesize.js.
// This does not call a model, access Supabase, promote picks, or mutate portfolio state.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSourceTeamAligned } from '../agents/lib/portfolio-local-inputs.js';
import {
  assertYoutubeCohortClean,
  buildYoutubeCohort,
  isForbiddenYoutubeEpisode,
} from './lib/youtube-futures-cohort.js';
import { validateFuturesEvidenceBundle } from './lib/futures-evidence-gates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const date = getArg('--date', '2026-08-11');
const outPath = path.resolve(ROOT, getArg('--out', `.nfl/portfolio/frontier-synthesis-context-${date}.json`));
const generatedAt = getArg('--generated-at', new Date().toISOString());
const sourceAuditPath = getArg('--source-audit', null);
const validateOnly = argv.includes('--validate-only');
if (!sourceAuditPath) {
  throw new Error('An explicit --source-audit <path> is required; stale audit discovery is not permitted.');
}

const files = {
  bookmaker: 'data/futures-imports/bookmaker-2026-08-10.json',
  betus: 'data/futures-imports/betus-2026-08-10.json',
  betonline: 'data/futures-imports/betonline-2026-08-10.json',
  oddsExecution: 'data/futures-imports/odds-execution-validation-latest.json',
  predictionMap: 'data/prediction-markets/team-market-map-latest.json',
  coherence: 'data/prediction-markets/cross-market-coherence-latest.json',
  youtubeReview: 'data/shadow-harness/reports/youtube-futures-intel-review-latest.json',
  youtubeStatus: 'data/shadow-harness/review/youtube-futures-intel-review-status.json',
  youtubeQueue: 'data/shadow-harness/review/youtube-futures-local-intel-queue.json',
  youtubeSummary: 'data/shadow-harness/review/youtube-futures-agent-intel-summary.json',
  freshness: 'data/shadow-harness/review/podcast-youtube-freshness-latest.json',
  article: 'data/research-intel/review/article-intel-review-latest.json',
  availability: 'data/player-availability/latest.json',
  impact: 'data/player-availability/impact-digest-latest.json',
  starters: 'data/projected-starters/2026/latest.json',
  camp: 'data/training-camp/2026/latest.json',
  sourceAudit: sourceAuditPath,
};

async function json(relativePath) {
  return JSON.parse(await readFile(path.resolve(ROOT, relativePath), 'utf8'));
}

function counts(values, key) {
  return values.reduce((out, value) => {
    const label = value?.[key] || 'missing';
    out[label] = (out[label] || 0) + 1;
    return out;
  }, {});
}

function findExactMatchup(rows, teamA, teamB) {
  const wanted = [teamA, teamB].map((value) => value.toLowerCase()).sort();
  return rows.filter((row) => {
    if (row.market_type !== 'superbowl_matchup') return false;
    const selection = String(row.selection || row.team || '').toLowerCase();
    return wanted.every((team) => selection.includes(team));
  });
}

function compactAvailabilityEvent(event) {
  return {
    player_name: event.player_name,
    position: event.position,
    event_type: event.event_type,
    availability_trend: event.availability_trend,
    normalized_status: event.normalized_status,
    impact_bucket: event.impact_bucket,
    availability_group: event.availability_group,
    summary: event.short_summary,
    source: event.source,
    published_at: event.published_at,
    needs_human_review: event.needs_human_review,
  };
}

function compactCampItem(item) {
  return {
    signal_type: item.signal_type,
    signal_strength: item.signal_strength,
    summary: item.summary,
    source: item.source,
    published_at: item.published_at,
    linked_markets: item.linked_markets,
    needs_human_review: item.needs_human_review,
  };
}

function compactCoherenceTeam(team) {
  return {
    team: team.team,
    team_nick: team.team_nick,
    implied_win_pct_by_market: team.implied_win_pct_by_market,
    fair_american_by_market: team.fair_american_by_market,
    win_total_ladder: {
      monotonic: team.win_total_ladder?.monotonic,
      violations: team.win_total_ladder?.violations,
      implied_median_wins: team.win_total_ladder?.implied_median_wins,
    },
    championship_ladder: team.championship_ladder,
    max_divergence_pct: team.max_divergence_pct,
    softest_market: team.softest_market,
    edge_type: team.edge_type,
  };
}

function compactArticleLead(item) {
  return {
    teams: item.teams,
    market: item.market,
    selection: item.selection,
    side: item.side,
    line: item.line,
    price: item.price,
    book: item.book,
    confidence: item.confidence,
    quote: item.quote,
    rationale: item.rationale,
    review_flags: item.review_flags,
    source: item.source,
  };
}

const [bookmaker, betus, betonline, oddsExecution, predictionMap, coherence, youtubeReview, youtubeStatus, youtubeQueue, youtubeSummary, freshness, article, availability, impact, starters, camp, sourceAudit] = await Promise.all([
  json(files.bookmaker), json(files.betus), json(files.betonline), json(files.oddsExecution), json(files.predictionMap), json(files.coherence),
  json(files.youtubeReview), json(files.youtubeStatus), json(files.youtubeQueue), json(files.youtubeSummary), json(files.freshness), json(files.article),
  json(files.availability), json(files.impact), json(files.starters), json(files.camp), json(files.sourceAudit),
]);

const evidenceValidation = validateFuturesEvidenceBundle({
  article,
  camp,
  availability,
  impact,
  starters,
  predictionMap,
  coherence,
  youtubeReview,
  youtubeStatus,
  youtubeQueue,
  youtubeSummary,
  freshness,
  oddsExecution,
  sourceAudit,
});
if (evidenceValidation.status !== 'pass') {
  throw new Error(`Refusing to build frontier synthesis context: ${evidenceValidation.blockers.join('; ')}`);
}

const watchTeams = ['BUF', 'GB', 'NYG', 'CIN', 'NO', 'KC', 'LAC', 'DET', 'DAL'];
const availabilityByTeam = Object.fromEntries(watchTeams.map((team) => {
  const events = (availability.teams?.[team]?.events || [])
    .filter((event) => isSourceTeamAligned(team, event.source))
    .sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')))
    .slice(0, 6)
    .map(compactAvailabilityEvent);
  return [team, events];
}));
const campByTeam = Object.fromEntries(watchTeams.map((team) => {
  const items = (camp.teams?.[team]?.items || [])
    .filter((item) => isSourceTeamAligned(team, item.source))
    .sort((a, b) => Number(b.signal_strength || 0) - Number(a.signal_strength || 0)
      || String(b.published_at || '').localeCompare(String(a.published_at || '')))
    .slice(0, 4)
    .map(compactCampItem);
  return [team, items];
}));

const cleanArticleLeads = (article.market_leads || []).filter((item) => {
  const flags = new Set(item.review_flags || []);
  return !flags.has('broad_or_page_chrome_team_match') && !flags.has('no_team_detected');
});
const statusCounts = counts(youtubeStatus.items || [], 'status');
const billsPackersExact = findExactMatchup(betus, 'Buffalo Bills', 'Green Bay Packers');
const acceptedYoutubeItems = (youtubeSummary.items || []).filter((item) => !isForbiddenYoutubeEpisode(item));
const acceptedYoutubeNotes = (youtubeSummary.notes || []).filter((note) => !isForbiddenYoutubeEpisode(note));
assertYoutubeCohortClean(acceptedYoutubeItems, acceptedYoutubeNotes, 'Frontier synthesis YouTube accepted cohort');
const youtubeCohort = buildYoutubeCohort({
  items: acceptedYoutubeItems,
  notes: acceptedYoutubeNotes,
  includeForbiddenEpisodeIds: false,
});
if (youtubeSummary.cohort?.fingerprint_sha256 && youtubeSummary.cohort.fingerprint_sha256 !== youtubeCohort.fingerprint_sha256) {
  throw new Error(`YouTube cohort fingerprint mismatch: summary=${youtubeSummary.cohort.fingerprint_sha256} synthesis=${youtubeCohort.fingerprint_sha256}`);
}
if (freshness.youtube?.accepted?.cohort?.fingerprint_sha256 && freshness.youtube.accepted.cohort.fingerprint_sha256 !== youtubeCohort.fingerprint_sha256) {
  throw new Error(`YouTube cohort fingerprint mismatch: freshness=${freshness.youtube.accepted.cohort.fingerprint_sha256} synthesis=${youtubeCohort.fingerprint_sha256}`);
}

const output = {
  meta: {
    schema: 'frontier_futures_synthesis_context_v2',
    generated_at: generatedAt,
    local_only: true,
    recommendation_status: 'research_and_decision_support_only',
    inputs: Object.fromEntries(Object.entries(files).map(([name, inputPath]) => [name, inputPath])),
    validation_results: evidenceValidation,
    guardrails: {
      model_calls: false,
      network_fetches: false,
      supabase_reads: false,
      supabase_writes: false,
      official_picks_generated: false,
      portfolio_mutations: false,
    },
  },
  execution_policy: {
    potentially_placeable: ['Bookmaker/BKR', 'BetUS', 'BetOnline'],
    context_only: ['DraftKings', 'FanDuel', 'other unavailable online books'],
    prediction_markets_context_only: ['Kalshi', 'Polymarket'],
    prediction_market_adjustment: 'Require placeability, fees, liquidity, and settlement-risk adjustment; current local map is consensus context, not an execution quote.',
  },
  local_sportsbook_imports: {
    sources: [
      { path: files.bookmaker, rows: bookmaker.length, book: 'bookmaker' },
      { path: files.betus, rows: betus.length, book: 'betus' },
      { path: files.betonline, rows: betonline.length, book: 'betonline' },
    ],
    execution_validation_meta: oddsExecution.meta,
    execution_validation_sources: oddsExecution.sources,
    bills_packers_exact_matchup: billsPackersExact,
    bills_packers_exacta_gate: oddsExecution.bills_packers_exacta,
    exacta_gate: {
      minimum_price: 4500,
      current_local_confirmation: oddsExecution.bills_packers_exacta?.status || 'not_confirmed',
      execution_claim_allowed: Boolean(oddsExecution.bills_packers_exacta?.execution_claim_allowed),
      required: 'Exact two-team row plus at least two placeable books; remain monitor-only until satisfied.',
    },
  },
  prediction_markets: {
    map_meta: predictionMap.meta,
    coherence_meta: coherence.meta,
    teams: (coherence.teams || []).map(compactCoherenceTeam),
    authority: 'Consensus and coherence context only. Source snapshot predates this synthesis and has extensive liquidity warnings.',
  },
  reviewed_media: {
    review_summary: {
      generated_at: youtubeReview.generated_at,
      status: youtubeReview.status,
      futures_candidates: youtubeReview.futures_candidates,
      usable_observed_episodes: youtubeReview.usable_observed_episodes,
      reprocess_required_observations: youtubeReview.reprocess_required_observations,
      total_extracted_picks: youtubeReview.total_extracted_picks,
      total_analysis_notes: youtubeReview.total_analysis_notes,
    },
    status_ledger: { generated_at: youtubeStatus.generated_at, total: youtubeStatus.items?.length || 0, counts: statusCounts },
    accepted_summary: {
      generated_at: youtubeSummary.generated_at,
      cohort: youtubeCohort,
      exported_items: acceptedYoutubeItems.length,
      counts: youtubeSummary.counts,
      items: acceptedYoutubeItems,
    },
    anchor_review_context: freshness.anchors,
    caveats: [
      'Only accepted/promoted summary rows are reviewed context; pending, needs_review, and context_only rows are weak context.',
      'Known reprocess-required QB-list episode groups are excluded from synthesis inputs and accepted authority.',
      'Podcast deep dives are historical context: regenerated locally, but underlying episode coverage ends 2026-07-23.',
    ],
  },
  article_intel: {
    generated_at: article.generated_at,
    summary: article.summary,
    actual_picks: article.actual_picks,
    clean_market_lead_count: cleanArticleLeads.length,
    sample_clean_market_leads: cleanArticleLeads.slice(0, 8).map(compactArticleLead),
    caveats: [
      'Only execution-usable actual_picks from the complete, human-resolved article corpus are included.',
      'Market leads are inference_only and cannot make a card actionable.',
      'Page-chrome and no-team contaminated rows are excluded from this supplement.',
    ],
  },
  roster_availability_and_camp: {
    availability_meta: availability.meta,
    impact_digest_meta: impact.meta,
    projected_starters_meta: starters.meta,
    training_camp_meta: {
      ...camp.meta,
      feed_health: undefined,
    },
    selected_team_availability: availabilityByTeam,
    selected_team_camp: campByTeam,
    caveats: [
      `Projected starters contain ${starters.meta?.estimated_row_count ?? 'unknown'} estimated rows and ${starters.meta?.manual_row_count ?? 'unknown'} manual rows; estimated rows need depth-chart confirmation.`,
      `The impact digest contains ${impact.meta?.starter_matched_count ?? 'unknown'} starter-matched rows; automated classifications remain weaker than manual depth charts.`,
      'Team identity and availability validations pass; aggregate counts still remain research context.',
      'All selected availability/camp rows still need human review; conflicting status text must be labeled conflicted intel.',
    ],
  },
  source_audit: {
    generated_at: sourceAudit.generated_at,
    frontier_ready_inventory_gate: sourceAudit.summary?.frontierReady,
    counts: sourceAudit.summary?.counts,
    path: files.sourceAudit,
    caveat: 'This exact passing audit was supplied explicitly. frontierReady is an evidence-integrity gate, not betting authorization.',
  },
};

if (validateOnly) {
  console.log(`Frontier synthesis context validation passed for explicit audit ${files.sourceAudit}.`);
} else {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`wrote ${outPath}`);
}
