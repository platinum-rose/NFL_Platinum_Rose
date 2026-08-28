import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { ALPHA_PROFILE_IDS } from '../../src/lib/profiles.js';
import {
  ALPHA_PACKET_SCHEMA_VERSION,
  validateAlphaManifest,
  validateAlphaPacket,
} from '../../src/lib/alphaPacket.js';

const validPacket = () => ({
  schema_version: ALPHA_PACKET_SCHEMA_VERSION,
  generated_at: '2026-08-28T00:00:00.000Z',
  season: 2026,
  alpha_window: { id: 'preseason_week_3' },
  profiles: ALPHA_PROFILE_IDS.map((id) => ({ id })),
  fantasy_leagues: [
    { id: 'the_league' },
    { id: 'honey_badgers' },
    { id: 'rfi_invitational' },
    { id: 'rose_bowl' },
  ],
  fantasy_team_packets: {},
  nfl_team_dashboards: Array.from({ length: 32 }, (_, index) => ({
    team_abbr: `T${index}`,
    full_name: `Team ${index}`,
  })),
  schedule: [
    {
      id: 'game-1',
      game_id: 'nfl_2026_2_w01_NE_at_SEA',
      away_team: 'NE',
      home_team: 'SEA',
      kickoff_utc: '2026-09-10T00:20:00.000Z',
    },
  ],
  injuries: {},
  market_context: {},
  supercontest_demo_lines: [],
  survivor_demo_slate: [],
  source_provenance: [{ source: 'public/schedule.json' }],
});

describe('Alpha packet and manifest validation', () => {
  it('accepts a complete Alpha packet shape with kickoff_utc schedule entries', () => {
    expect(validateAlphaPacket(validPacket())).toEqual({ ok: true, errors: [] });
  });

  it('rejects packets missing kickoff_utc on schedule entries', () => {
    const packet = validPacket();
    delete packet.schedule[0].kickoff_utc;

    const result = validateAlphaPacket(packet);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('schedule[0].kickoff_utc must be an ISO timestamp');
  });

  it('rejects packets missing a required Alpha profile', () => {
    const packet = validPacket();
    packet.profiles = packet.profiles.slice(1);

    const result = validateAlphaPacket(packet);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(`Missing required Alpha profile: ${ALPHA_PROFILE_IDS[0]}`);
  });

  it('rejects packets missing a required fantasy league', () => {
    const packet = validPacket();
    packet.fantasy_leagues = packet.fantasy_leagues.filter((league) => league.id !== 'rose_bowl');

    const result = validateAlphaPacket(packet);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Missing required fantasy league: rose_bowl');
  });

  it('accepts the manifest fallback shape with profile ids, paths, hashes, and versions', () => {
    const result = validateAlphaManifest({
      schema_version: 'alpha_manifest_v1',
      generated_at: '2026-08-28T00:00:00.000Z',
      season: 2026,
      required_profile_ids: ALPHA_PROFILE_IDS,
      source_provenance: [],
      files: [
        {
          path: 'data/alpha/schedule.json',
          schema_version: 'alpha_schedule_v1',
          generated_at: '2026-08-28T00:00:00.000Z',
          sha256: 'abc123',
        },
      ],
    });

    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('confirms public/schedule.json carries kickoff_utc for every schedule entry', () => {
    const schedulePath = path.resolve(__dirname, '../../public/schedule.json');
    const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));

    expect(schedule.length).toBeGreaterThan(0);
    schedule.forEach((game, index) => {
      expect(game, `schedule[${index}]`).toHaveProperty('kickoff_utc');
      expect(Number.isNaN(Date.parse(game.kickoff_utc))).toBe(false);
    });
  });
});
