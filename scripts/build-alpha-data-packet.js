import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALPHA_FANTASY_LEAGUE_IDS,
  PROFILE_MODES,
  getPresetProfilesForMode,
} from '../src/lib/profiles.js';
import { NFL_TEAMS, normalizeTeam } from '../src/lib/teams.js';
import { EXPERT_INJURIES } from '../src/lib/expertInjuries.js';
import { validateAlphaPacket } from '../src/lib/alphaPacket.js';

export const ALPHA_DATA_PACKET_SCHEMA_VERSION = 'alpha_packet_v1';
export const DEFAULT_ALPHA_PACKET_PATH = 'data/alpha/alpha-packet-2026.json';
export const DEFAULT_PUBLIC_ALPHA_PACKET_PATH = 'public/alpha/alpha-packet-2026.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ALPHA_FANTASY_LEAGUES = [
  {
    id: 'the_league',
    name: 'The League',
    tagline: 'Primary 12-Team Keeper Dynasty Matrix',
    isKeeperLeague: true,
    maxKeepers: 2,
    leagueSize: 12,
  },
  {
    id: 'honey_badgers',
    name: 'Honey Badgers',
    tagline: 'High-Stakes Rivalry League',
    isKeeperLeague: true,
    maxKeepers: 2,
    leagueSize: 12,
  },
  {
    id: 'rfi_invitational',
    name: 'RFI Invitational',
    tagline: 'Single Keeper Invitational League',
    isKeeperLeague: true,
    maxKeepers: 1,
    leagueSize: 12,
  },
  {
    id: 'rose_bowl',
    name: 'Rose Bowl',
    tagline: 'Redraft / Non-Keeper Season-Long League',
    isKeeperLeague: false,
    maxKeepers: 0,
    leagueSize: 12,
  },
];

const toRepoPath = (absolutePath) => path.relative(ROOT, absolutePath).replaceAll(path.sep, '/');
const resolveRepoPath = (repoPath) => path.resolve(ROOT, repoPath);

const requiredJson = async (repoPath, provenance, label) => {
  const absolutePath = resolveRepoPath(repoPath);
  const raw = await fsp.readFile(absolutePath, 'utf8');
  const stat = await fsp.stat(absolutePath);
  provenance.push({
    label,
    path: toRepoPath(absolutePath),
    sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    bytes: Buffer.byteLength(raw),
    mtime: stat.mtime.toISOString(),
  });
  return JSON.parse(raw);
};

const optionalText = async (repoPath, provenance, label) => {
  const absolutePath = resolveRepoPath(repoPath);
  if (!fs.existsSync(absolutePath)) return null;
  const raw = await fsp.readFile(absolutePath, 'utf8');
  const stat = await fsp.stat(absolutePath);
  provenance.push({
    label,
    path: toRepoPath(absolutePath),
    sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    bytes: Buffer.byteLength(raw),
    mtime: stat.mtime.toISOString(),
  });
  return raw;
};

const parseCsv = (text) => {
  if (!text) return [];
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted && char === '"' && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      row.push(value);
      value = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  }

  const [headers = [], ...body] = rows;
  return body.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
};

const readCsv = async (repoPath, provenance, label) => {
  const text = await optionalText(repoPath, provenance, label);
  return parseCsv(text);
};

const readJsonFilesFromDir = async (repoDir, provenance, label) => {
  const absoluteDir = resolveRepoPath(repoDir);
  if (!fs.existsSync(absoluteDir)) return [];

  const files = (await fsp.readdir(absoluteDir))
    .filter((file) => file.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));

  const rows = [];
  for (const file of files) {
    const repoPath = `${repoDir}/${file}`;
    rows.push({
      file,
      proposal: await requiredJson(repoPath, provenance, `${label}:${file}`),
    });
  }
  return rows;
};

const byTeam = (rows = []) => {
  const map = new Map();
  for (const row of rows) {
    const team = row.team || row.team_abbr || row.Team || row.nfl_team;
    const normalized = normalizeTeam(team);
    if (!normalized) continue;
    map.set(normalized, row);
  }
  return map;
};

const groupByTeam = (items = [], getTeamValue) => {
  const map = new Map();
  for (const item of items) {
    const normalized = normalizeTeam(getTeamValue(item));
    if (!normalized) continue;
    if (!map.has(normalized)) map.set(normalized, []);
    map.get(normalized).push(item);
  }
  return map;
};

const findRichestTrainingCampSnapshot = async (provenance) => {
  const candidates = [
    'data/training-camp/2026/latest.json',
    'data/training-camp/2026/training-camp-intel-2026-08-22.json',
    'data/training-camp/2026/training-camp-intel-2026-08-16.json',
    'data/training-camp/2026/training-camp-intel-2026-08-13.json',
    'data/training-camp/2026/training-camp-intel-2026-08-12.json',
    'data/training-camp/2026/training-camp-intel-2026-08-11.json',
    'data/training-camp/2026/training-camp-intel-2026-07-31.json',
  ];

  const snapshots = [];
  for (const candidate of candidates) {
    const absolutePath = resolveRepoPath(candidate);
    if (!fs.existsSync(absolutePath)) continue;
    const raw = await fsp.readFile(absolutePath, 'utf8');
    const json = JSON.parse(raw);
    const itemCount = Array.isArray(json.items) ? json.items.length : Number(json.meta?.item_count || 0);
    const generatedAt = json.meta?.generated_at || json.generated_at || null;
    snapshots.push({ candidate, json, itemCount, generatedAt });
  }

  snapshots.sort((a, b) => {
    if (b.itemCount !== a.itemCount) return b.itemCount - a.itemCount;
    return String(b.generatedAt).localeCompare(String(a.generatedAt));
  });

  const selected = snapshots[0];
  if (!selected) return { snapshot: { meta: { item_count: 0 }, items: [], teams: {} }, sourcePath: null };
  await requiredJson(selected.candidate, provenance, 'training_camp_intel_selected');
  return { snapshot: selected.json, sourcePath: selected.candidate };
};

const buildFantasyPackets = async (profiles, provenance) => {
  const draftOrders = await requiredJson('docs/fantasy/LEAGUE_DRAFT_ORDERS_2026.json', provenance, 'fantasy_draft_orders');
  const valueBoard = await requiredJson('docs/fantasy/value-board-2026-08-22.json', provenance, 'fantasy_value_board');
  await optionalText('docs/fantasy/MASTER_FANTASY_LEAGUE_RULES.md', provenance, 'fantasy_league_rules');

  const rosterSources = {
    the_league: 'data/fantasy/final_rosters_2025_full.csv',
    honey_badgers: 'data/fantasy/honey_badgers_final_rosters_2025.csv',
    rfi_invitational: 'data/fantasy/rfi_invitational_final_rosters_2025.csv',
    rose_bowl: 'data/fantasy/rose_bowl_final_rosters_2025.csv',
  };
  const draftSources = {
    the_league: 'data/fantasy/draft_board_2025_full.csv',
    honey_badgers: 'data/fantasy/honey_badgers_draft_board_2025.csv',
    rfi_invitational: 'data/fantasy/rfi_invitational_draft_board_2025.csv',
  };

  const packets = [];
  for (const leagueId of ALPHA_FANTASY_LEAGUE_IDS) {
    const roster = await readCsv(rosterSources[leagueId], provenance, `fantasy_roster_${leagueId}`);
    const draftBoard = draftSources[leagueId]
      ? await readCsv(draftSources[leagueId], provenance, `fantasy_draft_board_${leagueId}`)
      : [];
    const profile = profiles.find((entry) => entry.fantasyLeagues?.includes(leagueId));
    const testerDraftSlot = profile?.draftSlots?.[leagueId] ?? null;
    const testerTeamName = draftOrders[leagueId]?.find((entry) => entry.slot === testerDraftSlot)?.team || null;

    packets.push({
      league_id: leagueId,
      profile_id: profile?.id || null,
      tester_team_name: testerTeamName,
      tester_draft_slot: testerDraftSlot,
      keeper_locks: profile?.keeperLocks?.[leagueId] || [],
      roster_rows: roster,
      draft_board_rows: draftBoard,
      value_board_meta: valueBoard.meta,
      value_board_top_values: Array.isArray(valueBoard.board) ? valueBoard.board.slice(0, 75) : [],
      source_paths: [rosterSources[leagueId], draftSources[leagueId], 'docs/fantasy/value-board-2026-08-22.json'].filter(Boolean),
    });
  }

  return packets;
};

const buildTeamDashboards = ({
  schedule,
  injuries,
  trainingCamp,
  analytics,
  dvoa,
  powerRatings,
  coaching,
  regression,
  predictionMarkets,
  recommendationsByTeam,
  officialPicksByTeam,
}) => {
  const trainingTeams = trainingCamp.teams || {};
  const predictionTeams = Array.isArray(predictionMarkets.teams) ? predictionMarkets.teams : [];
  const predictionByTeam = new Map(predictionTeams.map((team) => [normalizeTeam(team.team || team.team_nick), team]));

  return Object.values(NFL_TEAMS).map((team) => {
    const normalized = normalizeTeam(team.abbreviation);
    const teamSchedule = schedule.filter((game) => {
      return normalizeTeam(game.home) === normalized || normalizeTeam(game.visitor) === normalized;
    });
    return {
      team: team.name,
      team_abbr: team.abbreviation,
      full_name: team.fullName,
      division: team.division,
      conference: team.conference,
      dome: team.dome,
      schedule: teamSchedule,
      injuries: injuries[team.abbreviation] || [],
      training_camp: trainingTeams[team.abbreviation] || { team: team.abbreviation, items: [] },
      analytics_snapshot: analytics.get(normalized) || null,
      dvoa_snapshot: dvoa.get(normalized) || null,
      power_rating: powerRatings.get(normalized) || null,
      coaching_tendency: coaching.get(normalized) || null,
      regression_profile: regression.get(normalized) || null,
      prediction_market_context: predictionByTeam.get(normalized) || null,
      synthesized_recommendations: recommendationsByTeam.get(normalized) || [],
      official_paper_picks: officialPicksByTeam.get(normalized) || [],
    };
  });
};

const normalizeRecommendations = (rows) => {
  return rows.map((row, index) => ({
    id: row.id || row.pick_id || `actionable_recommendation_${index + 1}`,
    alpha_visibility_status: 'research_context_not_official_pick',
    execution_authorized: false,
    ...row,
  }));
};

export const buildAlphaDataPacket = async ({ generatedAt = new Date().toISOString() } = {}) => {
  const provenance = [];
  const profiles = getPresetProfilesForMode(PROFILE_MODES.ALPHA);
  const fantasyLeagues = ALPHA_FANTASY_LEAGUES.filter((league) => ALPHA_FANTASY_LEAGUE_IDS.includes(league.id));
  const schedule = await requiredJson('public/schedule.json', provenance, 'canonical_schedule');
  const fantasyTeamPackets = await buildFantasyPackets(profiles, provenance);

  const analytics = byTeam((await requiredJson('data/generated/team-profiles/team-analytic-snapshots-2025-w18.json', provenance, 'team_analytics')).rows);
  const dvoa = byTeam((await requiredJson('data/generated/team-profiles/team-dvoa-snapshots-2025.json', provenance, 'team_dvoa')).rows);
  const powerRatings = byTeam((await requiredJson('data/generated/team-profiles/team-power-ratings-2025.json', provenance, 'team_power_ratings')).rows);
  const coaching = byTeam((await requiredJson('data/generated/team-profiles/team-coaching-tendency-snapshots-2025-w18.json', provenance, 'team_coaching_tendencies')).rows);
  const regression = byTeam((await requiredJson('data/generated/team-profiles/team-regression-snapshots-2025-w18.json', provenance, 'team_regression')).rows);

  const predictionMarkets = await requiredJson('data/prediction-markets/cross-market-coherence-latest.json', provenance, 'prediction_market_coherence');
  const sportsbookContext = await requiredJson('data/generated/sportsbook-normalized-latest.json', provenance, 'sportsbook_normalized_context');
  const actionableRecommendations = normalizeRecommendations(
    await requiredJson('data/podcasts/actionable_betting_recommendations_2026.json', provenance, 'synthesized_betting_recommendations')
  );
  const officialPaperLedger = await requiredJson('data/official-picks/platinum-rose-ai-2026.json', provenance, 'official_paper_pick_ledger_read_only');
  const activeOfficialPickProposals = await readJsonFilesFromDir(
    'data/official-picks/proposals/active',
    provenance,
    'official_pick_active_proposal_read_only'
  );
  const articleIntel = await requiredJson('data/research-intel/review/article-intel-review-latest.json', provenance, 'article_intel_review');
  const youtubeFuturesIntel = await requiredJson('data/shadow-harness/review/youtube-futures-agent-intel-summary.json', provenance, 'youtube_futures_intel_summary');
  const { snapshot: trainingCamp, sourcePath: trainingCampSourcePath } = await findRichestTrainingCampSnapshot(provenance);

  const recommendationsByTeam = groupByTeam(actionableRecommendations, (row) => row.team || row.selection);
  const officialPicksByTeam = groupByTeam(officialPaperLedger.picks || [], (row) => row.team || row.selection);
  const nflTeamDashboards = buildTeamDashboards({
    schedule,
    injuries: EXPERT_INJURIES,
    trainingCamp,
    analytics,
    dvoa,
    powerRatings,
    coaching,
    regression,
    predictionMarkets,
    recommendationsByTeam,
    officialPicksByTeam,
  });

  const packet = {
    schema_version: ALPHA_DATA_PACKET_SCHEMA_VERSION,
    generated_at: generatedAt,
    season: 2026,
    alpha_window: {
      label: 'Alpha v1 local dashboard testing',
      status: 'offline_read_only_packet',
      generated_for: 'private_alpha_testers',
    },
    guardrails: {
      local_only: true,
      live_model_calls: false,
      paid_api_calls: false,
      network_fetches: false,
      supabase_writes: false,
      official_pick_mutations: false,
      owner_portfolio_mutations: false,
      betting_execution: false,
      in_app_api_key_storage: false,
    },
    profiles,
    fantasy_leagues: fantasyLeagues,
    fantasy_team_packets: fantasyTeamPackets,
    nfl_team_dashboards: nflTeamDashboards,
    schedule,
    injuries: {
      schema: 'expert_injuries_alpha_static_v1',
      source: 'src/lib/expertInjuries.js',
      recommendation_status: 'injury_context_only_not_picks',
      teams: EXPERT_INJURIES,
    },
    market_context: {
      recommendation_status: 'research_context_only_not_betting_execution',
      sportsbook_context: {
        meta: sportsbookContext.meta || null,
        source_path: 'data/generated/sportsbook-normalized-latest.json',
      },
      prediction_market_coherence: {
        meta: predictionMarkets.meta,
        teams: predictionMarkets.teams,
      },
      synthesized_recommendations: actionableRecommendations,
      official_paper_ledger: {
        meta: officialPaperLedger.meta,
        policy: officialPaperLedger.policy,
        picks: officialPaperLedger.picks || [],
        active_proposals: activeOfficialPickProposals,
        read_only: true,
      },
      article_intel: {
        generated_at: articleIntel.generated_at,
        status: articleIntel.status,
        summary: articleIntel.summary,
        actual_picks: articleIntel.actual_picks || [],
        market_leads: articleIntel.market_leads || [],
        analysis_notes_count: articleIntel.analysis_notes?.length || 0,
      },
      youtube_futures_intel: {
        generated_at: youtubeFuturesIntel.generated_at,
        status: youtubeFuturesIntel.status,
        counts: youtubeFuturesIntel.counts,
        by_team: youtubeFuturesIntel.by_team,
        items: youtubeFuturesIntel.items || [],
      },
    },
    supercontest_demo_lines: {
      schema_version: 'alpha_supercontest_demo_lines_placeholder_v1',
      status: 'not_built_phase_3_pending',
      source: 'canonical schedule entries with kickoff_utc are present in packet.schedule',
      lines: [],
    },
    survivor_demo_slate: {
      schema_version: 'alpha_survivor_demo_slate_placeholder_v1',
      status: 'not_built_phase_3_pending',
      source: 'canonical schedule entries with kickoff_utc are present in packet.schedule',
      games: [],
    },
    source_provenance: {
      generated_by: 'scripts/build-alpha-data-packet.js',
      training_camp_selected_source: trainingCampSourcePath,
      files: provenance,
    },
  };

  const validation = validateAlphaPacket(packet);
  if (!validation.ok) {
    throw new Error(`Alpha packet validation failed:\n${validation.errors.join('\n')}`);
  }
  if (nflTeamDashboards.length !== 32) {
    throw new Error(`Expected 32 NFL team dashboards, got ${nflTeamDashboards.length}`);
  }

  return packet;
};

const writePacket = async (packet, repoPath) => {
  const absolutePath = resolveRepoPath(repoPath);
  await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
  await fsp.writeFile(absolutePath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const packet = await buildAlphaDataPacket();
  await writePacket(packet, DEFAULT_ALPHA_PACKET_PATH);
  await writePacket(packet, DEFAULT_PUBLIC_ALPHA_PACKET_PATH);
  console.log(`Alpha packet written: ${DEFAULT_ALPHA_PACKET_PATH}`);
  console.log(`Public Alpha packet written: ${DEFAULT_PUBLIC_ALPHA_PACKET_PATH}`);
  console.log(`Profiles: ${packet.profiles.length}`);
  console.log(`Fantasy leagues: ${packet.fantasy_leagues.length}`);
  console.log(`NFL team dashboards: ${packet.nfl_team_dashboards.length}`);
  console.log(`Schedule games: ${packet.schedule.length}`);
  console.log(`Synthesized recommendations: ${packet.market_context.synthesized_recommendations.length}`);
}
