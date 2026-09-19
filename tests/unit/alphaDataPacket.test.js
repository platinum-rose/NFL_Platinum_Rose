import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  ALPHA_FANTASY_LEAGUE_IDS,
  ALPHA_PROFILE_IDS,
} from '../../src/lib/profiles.js';
import { validateAlphaPacket } from '../../src/lib/alphaPacket.js';

const packetPath = path.resolve(__dirname, '../../data/alpha/alpha-packet-2026.json');
const publicPacketPath = path.resolve(__dirname, '../../public/alpha/alpha-packet-2026.json');
const scriptPath = path.resolve(__dirname, '../../scripts/build-alpha-data-packet.js');

const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));
const publicPacket = JSON.parse(fs.readFileSync(publicPacketPath, 'utf8'));
const scriptSource = fs.readFileSync(scriptPath, 'utf8');

describe('Alpha data packet', () => {
  it('matches the canonical Alpha packet shape and browser-loadable copy', () => {
    expect(validateAlphaPacket(packet)).toEqual({ ok: true, errors: [] });
    expect(publicPacket).toEqual(packet);
  });

  it('covers every Alpha tester profile and fantasy league', () => {
    expect(packet.profiles.map((profile) => profile.id)).toEqual(ALPHA_PROFILE_IDS);
    expect(packet.fantasy_leagues.map((league) => league.id).sort()).toEqual([...ALPHA_FANTASY_LEAGUE_IDS].sort());
    expect(packet.fantasy_team_packets.map((teamPacket) => teamPacket.league_id).sort()).toEqual(
      [...ALPHA_FANTASY_LEAGUE_IDS].sort()
    );
  });

  it('covers all 32 NFL team dashboards with schedule kickoff_utc values', () => {
    expect(packet.nfl_team_dashboards).toHaveLength(32);
    expect(new Set(packet.nfl_team_dashboards.map((team) => team.team_abbr)).size).toBe(32);
    expect(packet.schedule).toHaveLength(272);
    expect(packet.schedule.every((game) => typeof game.kickoff_utc === 'string' && !Number.isNaN(Date.parse(game.kickoff_utc)))).toBe(true);
  });

  it('labels recommendations and market context as non-execution Alpha research context', () => {
    expect(packet.market_context.recommendation_status).toBe('research_context_only_not_betting_execution');
    // Was hardcoded to 209 and silently went stale when the source file grew (394 as of 2026-09-19).
    const sourceRecommendations = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/podcasts/actionable_betting_recommendations_2026.json'), 'utf8'));
    expect(packet.market_context.synthesized_recommendations).toHaveLength(sourceRecommendations.length);
    expect(packet.market_context.synthesized_recommendations.every((item) => item.execution_authorized === false)).toBe(true);
    expect(packet.market_context.synthesized_recommendations.every((item) => item.alpha_visibility_status === 'research_context_not_official_pick')).toBe(true);
    expect(packet.market_context.official_paper_ledger.read_only).toBe(true);
  });

  it('bundles active official-pick draft proposals for the Alpha Picks inbox view', () => {
    const drafts = packet.market_context.official_paper_ledger.active_proposals;
    expect(drafts).toHaveLength(2);
    expect(drafts.map((item) => item.file)).toEqual(
      expect.arrayContaining([
        'candidate-inbox-2026-08-29-cb2cd120.json',
        'candidate-inbox-gmail-week-1-sharp-props---line-steam--kc-mahomes-o.json',
      ])
    );
    expect(drafts.filter((item) => item.proposal?.status).every((item) => item.proposal.status === 'pending_review')).toBe(true);
  });

  it('records source provenance with hashes for every local input', () => {
    const provenance = packet.source_provenance.files;
    expect(provenance.length).toBeGreaterThan(15);
    expect(provenance.map((source) => source.path)).toEqual(
      expect.arrayContaining([
        'public/schedule.json',
        'data/podcasts/actionable_betting_recommendations_2026.json',
        'data/prediction-markets/cross-market-coherence-latest.json',
        'data/official-picks/platinum-rose-ai-2026.json',
      ])
    );
    expect(provenance.every((source) => /^[a-f0-9]{64}$/.test(source.sha256))).toBe(true);
  });

  it('does not run live, paid, AI, Supabase-write, owner-portfolio, or betting-execution workflows', () => {
    expect(packet.guardrails).toMatchObject({
      local_only: true,
      live_model_calls: false,
      paid_api_calls: false,
      network_fetches: false,
      supabase_writes: false,
      official_pick_mutations: false,
      owner_portfolio_mutations: false,
      betting_execution: false,
      in_app_api_key_storage: false,
    });
    expect(scriptSource).not.toContain("from '../src/lib/supabase");
    expect(scriptSource).not.toContain('fetch(');
    expect(scriptSource).not.toContain('ODDS_API_KEY');
    expect(scriptSource).not.toContain('SUPABASE_');
    expect(scriptSource).not.toMatch(/from ['"][^'"]*(openai|anthropic)/i);
  });

  it('is built from this week\'s Friday intel, not static preseason data', () => {
    const provenancePaths = packet.source_provenance.files.map((source) => source.path);
    expect(provenancePaths).toEqual(expect.arrayContaining([
      'data/player-availability/latest.json',
      'data/projected-starters/2026/latest.json',
      'data/secondary-matchups/latest.json',
      'data/research-intel/review/player-props-intel-latest.json',
    ]));
    expect(packet.weekly_intel.schema).toBe('alpha_weekly_intel_v1');
    expect(packet.injuries.schema).toBe('weekly_game_status_availability_v1');
    // Either every input was fresh, or the build was a deliberate, stamped --allow-stale override.
    expect(packet.weekly_intel.freshness.ok || packet.weekly_intel.freshness.allow_stale_override).toBe(true);
    expect(packet.nfl_team_dashboards.every((team) => team.weekly_intel && Array.isArray(team.injuries))).toBe(true);
  });

  it('is byte-identical between data and public packet targets', () => {
    const dataHash = crypto.createHash('sha256').update(fs.readFileSync(packetPath)).digest('hex');
    const publicHash = crypto.createHash('sha256').update(fs.readFileSync(publicPacketPath)).digest('hex');

    expect(publicHash).toBe(dataHash);
  });
});
