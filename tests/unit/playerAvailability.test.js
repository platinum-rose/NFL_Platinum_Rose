import { describe, expect, it } from 'vitest';
import {
  availabilityEventFromInjuryRecord,
  availabilityEventFromTrainingCampItem,
  availabilityGroup,
  buildAvailabilitySnapshot,
  classifyAvailabilityEvent,
  clusterAvailabilitySummary,
  normalizeInjuryStatus,
} from '../../agents/lib/player-availability.js';

describe('normalizeInjuryStatus', () => {
  it('normalizes ESPN long-form status labels used by the injury feed', () => {
    expect(normalizeInjuryStatus('Injured Reserve')).toBe('IR');
    expect(normalizeInjuryStatus('active/PUP list')).toBe('PUP');
    expect(normalizeInjuryStatus('Physically Unable to Perform')).toBe('PUP');
    expect(normalizeInjuryStatus('Suspension')).toBe('SUSPENSION');
    expect(normalizeInjuryStatus('Questionable')).toBe('QUESTIONABLE');
  });
});

describe('classifyAvailabilityEvent', () => {
  it('keeps active practice notes as improving return intel', () => {
    const event = classifyAvailabilityEvent({
      status: 'Active',
      text: 'Tagovailoa (back) is doing individual drills at Thursday practice.',
    });
    expect(event).toEqual({ event_type: 'limited_return', availability_trend: 'improving' });
  });

  it('does not turn active historical injury context into a setback', () => {
    const event = classifyAvailabilityEvent({
      status: 'Active',
      text: 'Active after missing last season with a torn ACL.',
    });
    expect(event.availability_trend).not.toBe('worsening');
  });

  it('correctly classifies active practice participation as improving return intel', () => {
    const djTurner = classifyAvailabilityEvent({
      status: 'Active',
      text: "Bengals cornerback DJ Turner II (calf) was active in Wednesday's training camp practice, mixing it up with Ja'Marr Chase during 7-on-7 and 11-on-11 drills.",
    });
    expect(djTurner.availability_trend).toBe('improving');

    const christensen = classifyAvailabilityEvent({
      status: 'Active',
      text: "Coach Dave Canales says Christensen (Achilles) 'looked good' in his first practice back from injury.",
    });
    expect(christensen.event_type).toBe('return_to_practice');
    expect(christensen.availability_trend).toBe('improving');

    const erickAll = classifyAvailabilityEvent({
      status: 'Active',
      text: 'All (knee) has been cleared to participate at training camp in a limited capacity.',
    });
    expect(erickAll.event_type).toBe('limited_return');
    expect(erickAll.availability_trend).toBe('improving');
  });

  it('extracts active/PUP and active/NFI list placements from comment text when status is Active', () => {
    const hargrave = classifyAvailabilityEvent({
      status: 'Active',
      text: "Hargrave is on the Packers' active/PUP list during training camp due to a knee injury.",
    });
    expect(hargrave).toEqual({ event_type: 'pup', availability_trend: 'worsening' });

    const tressWay = classifyAvailabilityEvent({
      status: 'Active',
      text: 'Washington placed Way (pectoral) on its active/non-football injury list Wednesday.',
    });
    expect(tressWay).toEqual({ event_type: 'pup', availability_trend: 'worsening' });
  });

  it('classifies severe status labels as worsening availability', () => {
    expect(classifyAvailabilityEvent({ status: 'Injured Reserve', text: 'expected to miss the season' })).toEqual({
      event_type: 'ir',
      availability_trend: 'worsening',
    });
    expect(classifyAvailabilityEvent({ status: 'Out', text: 'placed on active/PUP list' })).toEqual({
      event_type: 'out',
      availability_trend: 'worsening',
    });
  });
});

describe('availabilityGroup and clusterAvailabilitySummary', () => {
  it('separates offensive line from defensive front injuries', () => {
    expect(availabilityGroup('OT')).toBe('offensive_line');
    expect(availabilityGroup('G')).toBe('offensive_line');
    expect(availabilityGroup('C')).toBe('offensive_line');
    expect(availabilityGroup('DE')).toBe('defensive_front');
    expect(availabilityGroup('DT')).toBe('defensive_front');
    expect(availabilityGroup('EDGE')).toBe('defensive_front');
  });

  it('flags reciprocal defensive-front cluster risk for opponent offense', () => {
    const summary = clusterAvailabilitySummary([
      { position: 'DE', availability_trend: 'worsening' },
      { position: 'DT', availability_trend: 'worsening' },
      { position: 'OT', availability_trend: 'worsening' },
      { position: 'G', availability_trend: 'worsening' },
    ]);

    expect(summary.offensive_line.cluster_risk).toBe(true);
    expect(summary.defensive_front.cluster_risk).toBe(true);
    expect(summary.defensive_front.opponent_offense_boost_risk).toBe(true);
  });
});

describe('availabilityEventFromInjuryRecord', () => {
  it('turns an ESPN row into a futures-friendly availability event', () => {
    const row = {
      espn_injury_id: 'abc123',
      espn_player_id: '42',
      player_name: 'Tua Tagovailoa',
      team_abbr: 'ATL',
      position: 'QB',
      injury_status: 'Active',
      short_comment: "Tagovailoa (back) is doing individual drills at Thursday's practice.",
      reported_at: '2026-07-30T14:00:00.000Z',
      captured_at: '2026-07-30T15:00:00.000Z',
    };

    const event = availabilityEventFromInjuryRecord(row, { season: 2026 });
    expect(event.player_name).toBe('Tua Tagovailoa');
    expect(event.team_abbr).toBe('ATL');
    expect(event.position).toBe('QB');
    expect(event.normalized_status).toBe('ACTIVE_NEWS');
    expect(event.event_type).toBe('limited_return');
    expect(event.availability_trend).toBe('improving');
    expect(event.injury_type).toBe('back');
    expect(event.impact_bucket).toBe('qb_major');
    expect(event.availability_group).toBe('quarterback');
    expect(event.linked_markets).toContain('wins');
    expect(event.linked_markets).toContain('player_props');
  });

  it('marks offensive linemen as offensive-line major risks', () => {
    const event = availabilityEventFromInjuryRecord({
      espn_injury_id: 'ol1',
      player_name: 'Left Tackle A',
      team_abbr: 'GB',
      position: 'OT',
      injury_status: 'Out',
      short_comment: 'Left Tackle A (knee) was placed on the active/PUP list.',
    }, { season: 2026 });

    expect(event.impact_bucket).toBe('offensive_line_major');
    expect(event.availability_group).toBe('offensive_line');
    expect(event.availability_trend).toBe('worsening');
  });
});

describe('availabilityEventFromTrainingCampItem', () => {
  it('promotes camp return stories into availability events', () => {
    const event = availabilityEventFromTrainingCampItem({
      id: 'camp1',
      season: 2026,
      team: 'BAL',
      player: 'Justin Madubuike',
      position: 'DT',
      source: 'ESPN NFL',
      source_url: 'https://example.com/madubuike',
      published_at: '2026-07-30T12:00:00.000Z',
      captured_at: '2026-07-30T15:00:00.000Z',
      signal_type: 'injury',
      summary: "Ravens' Madubuike (neck) returns to practice",
      raw_excerpt: 'Madubuike practiced for the first time in 10 months.',
      linked_markets: ['wins'],
    }, { season: 2026 });

    expect(event.event_type).toBe('return_to_practice');
    expect(event.availability_trend).toBe('improving');
    expect(event.impact_bucket).toBe('defensive_front_major');
    expect(event.availability_group).toBe('defensive_front');
    expect(event.needs_human_review).toBe(true);
  });
});

describe('buildAvailabilitySnapshot', () => {
  it('groups improving/worsening events by team and preserves source health', () => {
    const snapshot = buildAvailabilitySnapshot({
      season: 2026,
      generatedAt: '2026-07-30T15:00:00.000Z',
      sourceHealth: [{ source: 'ESPN injuries API', status: 'available' }],
      injuryRecords: [
        {
          espn_injury_id: '1',
          player_name: 'Quarterback A',
          team_abbr: 'BUF',
          position: 'QB',
          injury_status: 'Questionable',
          short_comment: 'Quarterback A (elbow) returned to practice.',
        },
        {
          espn_injury_id: '2',
          player_name: 'Edge B',
          team_abbr: 'BUF',
          position: 'EDGE',
          injury_status: 'Injured Reserve',
          short_comment: 'Edge B (knee) is expected to miss the season.',
        },
      ],
    });

    expect(snapshot.meta.schema).toBe('player_availability_snapshot_v1');
    expect(snapshot.meta.event_count).toBe(2);
    expect(snapshot.meta.improving_count).toBe(1);
    expect(snapshot.meta.worsening_count).toBe(1);
    expect(snapshot.teams.BUF.event_count).toBe(2);
    expect(snapshot.teams.BUF.major_count).toBe(2);
    expect(snapshot.teams.BUF.defensive_front_worsening_count).toBe(1);
    expect(snapshot.teams.BUF.cluster_risks.defensive_front.opponent_offense_boost_risk).toBe(true);
    expect(snapshot.meta.source_health).toHaveLength(1);
  });
});
