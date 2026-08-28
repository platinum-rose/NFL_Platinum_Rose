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
    expect(packet.market_context.synthesized_recommendations).toHaveLength(209);
    expect(packet.market_context.synthesized_recommendations.every((item) => item.execution_authorized === false)).toBe(true);
    expect(packet.market_context.synthesized_recommendations.every((item) => item.alpha_visibility_status === 'research_context_not_official_pick')).toBe(true);
    expect(packet.market_context.official_paper_ledger.read_only).toBe(true);
  });

  it('bundles active official-pick draft proposals for the Alpha Picks inbox view', () => {
    const drafts = packet.market_context.official_paper_ledger.active_proposals;
    expect(drafts).toHaveLength(3);
    expect(drafts.map((item) => item.file)).toEqual(
      expect.arrayContaining([
        'candidate-inbox-gmail-week-1-sharp-props---line-steam--kc-mahomes-o.json',
        'candidate-prop-stack-twitter-bm-kc-rice.json',
        'candidate-supercontest-week1-bills.json',
      ])
    );
    expect(drafts.every((item) => item.proposal.status === 'pending_review')).toBe(true);
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

  it('is byte-identical between data and public packet targets', () => {
    const dataHash = crypto.createHash('sha256').update(fs.readFileSync(packetPath)).digest('hex');
    const publicHash = crypto.createHash('sha256').update(fs.readFileSync(publicPacketPath)).digest('hex');

    expect(publicHash).toBe(dataHash);
  });
});
