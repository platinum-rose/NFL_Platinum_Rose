import { describe, expect, it } from 'vitest';
import {
  auditTeamIdentity,
  inferTeamMentions,
  resolveEvidenceTeamOwnership,
  sourcePrimaryTeam,
  teamIdentityValidationBlockers,
} from '../../agents/lib/team-identity.js';

describe('team identity contract', () => {
  it('does not infer NO or WAS from ordinary prose', () => {
    expect(inferTeamMentions('There was no injury update after practice.')).toEqual([]);
    expect(inferTeamMentions('No ordinary update was expected today.')).toEqual([]);
    expect(inferTeamMentions('BUF will host GB while WAS visits NO.')).toEqual(['BUF', 'GB', 'WAS', 'NO']);
  });

  it('disambiguates shared-city teams and rejects a city-only assignment', () => {
    expect(inferTeamMentions('New York and Los Angeles opened practice today.')).toEqual([]);
    expect(inferTeamMentions('The New York Giants practiced with the New York Jets.')).toEqual(['NYG', 'NYJ']);
    expect(inferTeamMentions('The LA Chargers later met the LA Rams.')).toEqual(['LAC', 'LAR']);
    expect(inferTeamMentions('LA opened camp on Tuesday.')).toEqual([]);
  });

  it('makes a team-specific feed authoritative and stores opponents as related', () => {
    const ownership = resolveEvidenceTeamOwnership({
      source: 'BUF Beat - Buffalo Rumblings',
      sourceTeam: 'BUF',
      text: 'The Bills discussed a Packers trade target after practice.',
    });

    expect(sourcePrimaryTeam('BUF Beat - Buffalo Rumblings')).toBe('BUF');
    expect(ownership.primary_team).toBe('BUF');
    expect(ownership.related_teams).toEqual(['GB']);
    expect(ownership.ownership_source).toBe('feed_team');
    expect(ownership.flags).toEqual([]);
  });

  it('keeps the explicit primary team ahead of already-normalized related teams', () => {
    const ownership = resolveEvidenceTeamOwnership({
      declaredTeam: 'DAL',
      declaredTeams: ['GB'],
      source: 'ESPN injuries API',
      text: 'The player is targeting a return against the Cowboys.',
    });

    expect(ownership.primary_team).toBe('DAL');
    expect(ownership.related_teams).toContain('GB');
    expect(ownership.flags).toContain('multiple_declared_teams');
  });

  it('blocks duplicate evidence rows or source-prefix mismatches', () => {
    const audit = auditTeamIdentity([
      { evidence_id: 'same', team: 'GB', source: 'BUF Beat - Buffalo Rumblings' },
      { evidence_id: 'same', team: 'BUF', source: 'BUF Beat - Buffalo Rumblings' },
    ]);

    expect(audit.status).toBe('blocked');
    expect(audit.primary_source_mismatch_count).toBe(1);
    expect(audit.duplicate_evidence_rows).toBe(1);
  });

  it('blocks ambiguous inferred ownership and missing evidence identity', () => {
    const audit = auditTeamIdentity([{
      team: 'NYG',
      source: 'General NFL feed',
      team_identity: {
        source_team: null,
        flags: ['ambiguous_inferred_primary'],
      },
    }]);

    expect(audit.status).toBe('blocked');
    expect(audit.ambiguous_inferred_primary_count).toBe(1);
    expect(audit.missing_evidence_id_count).toBe(1);
  });

  it('turns legacy or failed validation metadata into audit blockers', () => {
    expect(teamIdentityValidationBlockers(null)).toEqual([
      'legacy artifact has no team-identity validation',
    ]);
    expect(teamIdentityValidationBlockers({
      schema: 'team_identity_validation_v1',
      status: 'pass',
      primary_source_mismatch_count: 0,
      duplicate_evidence_rows: 0,
      missing_primary_team_count: 0,
      missing_evidence_id_count: 0,
      ambiguous_inferred_primary_count: 0,
    })).toEqual([]);
    expect(teamIdentityValidationBlockers({
      schema: 'team_identity_validation_v1',
      status: 'blocked',
      primary_source_mismatch_count: 1,
      duplicate_evidence_rows: 2,
    })).toEqual(expect.arrayContaining([
      'team identity status=blocked',
      '1 primary/source-team mismatch(es)',
      '2 duplicate evidence row(s)',
    ]));
  });
});
