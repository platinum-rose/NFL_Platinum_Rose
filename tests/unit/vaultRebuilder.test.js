// tests/unit/vaultRebuilder.test.js
import { describe, it, expect } from 'vitest';
import {
  renderTeamPodcastIntel,
  renderTeamSeasonTrend,
  renderExpertLedger,
  renderExpertLeaderboard,
  renderWeeklyConsensus,
  renderFuturesMarket,
  renderPlayerProp,
  pickOneLiner,
} from '../../agents/lib/vaultRebuilderRenderers.js';
import {
  groupByTeam,
  groupByExpert,
  aggregateExpertLedger,
  rebuildTeamNote,
  rebuildExpertNote,
  composeTeamSections,
  PATHS,
  slugify,
} from '../../agents/vault-rebuilder.js';

const NOW = '2026-09-15';

const samplePicks = [
  {
    category: 'spread', subject: 'KC', selection: 'KC', team1: 'KC', team2: 'BUF',
    line: -3.5, odds_american: -110, units: 1, confidence: 0.7,
    summary: 'Mahomes at home off bye.',
    needs_review: false,
    expert_name: 'Warren Sharp', expert_slug: 'warren-sharp',
    podcast_name: 'Sharp Football Analysis',
    episode_title: 'Week 2 Picks',
    episode_published_at: '2026-09-12T10:00:00Z',
    result: 'win', units_pl: 0.91, clv: 0.04,
  },
  {
    category: 'total', subject: 'KC@BUF', selection: 'OVER', team1: 'KC', team2: 'BUF',
    line: 47.5, odds_american: -110, units: 1, confidence: 0.6,
    needs_review: false,
    expert_name: 'Warren Sharp', expert_slug: 'warren-sharp',
    episode_title: 'Week 2 Picks',
    episode_published_at: '2026-09-12T10:00:00Z',
    result: 'loss', units_pl: -1.0, clv: -0.01,
  },
  {
    category: 'future', subject: 'NFC North', subject_market: 'NFC_North',
    selection: 'DET', units: 0.5, odds_american: 150, confidence: 0.55,
    needs_review: false,
    expert_name: 'Sharon Lee', expert_slug: 'sharon-lee',
    podcast_name: 'PrimeTime Bets',
    episode_title: 'Futures Pod',
    episode_published_at: '2026-09-10T18:00:00Z',
  },
  {
    category: 'spread', subject: 'BUF', selection: 'BUF', team1: 'KC', team2: 'BUF',
    line: 3.5, units: 1, confidence: 0.4,
    needs_review: true, // should NOT appear in usable output
    expert_name: 'Sharon Lee', expert_slug: 'sharon-lee',
    episode_title: 'Hot Takes',
    episode_published_at: '2026-09-09T18:00:00Z',
  },
];

describe('pickOneLiner', () => {
  it('formats a spread pick', () => {
    const s = pickOneLiner(samplePicks[0]);
    expect(s).toContain('[spread] KC');
    expect(s).toContain('-3.5');
    expect(s).toContain('-110');
    expect(s).toContain('1u');
  });

  it('flags needs_review picks with a warning glyph', () => {
    expect(pickOneLiner(samplePicks[3])).toContain('needs review');
  });
});

describe('renderTeamPodcastIntel', () => {
  it('buckets picks by category and hides needs_review entries', () => {
    const body = renderTeamPodcastIntel({
      abbr: 'KC',
      picks: samplePicks.filter((p) => (p.team1 === 'KC' || p.team2 === 'KC')),
      now: NOW,
    });
    expect(body).toContain('### Spread');
    expect(body).toContain('### Total');
    expect(body).toContain('Warren Sharp');
    // needs_review pick (BUF -3.5 from Sharon) must be filtered out
    expect(body).not.toContain('needs review');
    // Newest first
    const idxSpread = body.indexOf('### Spread');
    const idxTotal = body.indexOf('### Total');
    expect(idxSpread).toBeGreaterThan(-1);
    expect(idxTotal).toBeGreaterThan(idxSpread);
  });

  it('emits a friendly empty-state message when no usable picks', () => {
    const body = renderTeamPodcastIntel({ abbr: 'NYJ', picks: [], now: NOW });
    expect(body).toContain('No recent podcast picks');
    expect(body).toContain('NYJ');
  });
});

describe('renderTeamSeasonTrend', () => {
  it('renders a record table when trend is supplied', () => {
    const body = renderTeamSeasonTrend({
      abbr: 'KC',
      now: NOW,
      trend: {
        su_record: { w: 12, l: 4 },
        ats_record: { w: 9, l: 7 },
        ou_record: { w: 8, l: 8 },
      },
    });
    expect(body).toContain('Straight-Up');
    expect(body).toContain('12-4');
    expect(body).toContain('9-7');
  });

  it('handles empty trend', () => {
    const body = renderTeamSeasonTrend({ abbr: 'KC', trend: null, now: NOW });
    expect(body).toContain('No season data');
  });
});

describe('renderExpertLedger', () => {
  it('shows headline stats and recent picks table', () => {
    const expert = { slug: 'warren-sharp', name: 'Warren Sharp', podcast: 'Sharp Football Analysis' };
    const ledger = aggregateExpertLedger(samplePicks.filter((p) => p.expert_slug === 'warren-sharp'));
    const body = renderExpertLedger({
      expert, ledger,
      picks: samplePicks.filter((p) => p.expert_slug === 'warren-sharp'),
      now: NOW,
    });
    expect(body).toContain('Sharp Football Analysis');
    expect(body).toContain('Season Ledger');
    expect(body).toContain('Recent Picks');
    expect(body).toContain('[spread] KC');
    expect(body).toMatch(/\| 1-1 \|/);
    expect(body).toMatch(/\| -0\.09u \|/);
  });
});

describe('renderExpertLeaderboard', () => {
  it('renders ranked rows with vault links', () => {
    const body = renderExpertLeaderboard({
      experts: [
        { slug: 'warren-sharp', name: 'Warren Sharp', graded: 2, wins: 1, losses: 1, units: -0.09, roi: -0.045, clv_avg: 0.015 },
        { slug: 'sharon-lee', name: 'Sharon Lee', graded: 0, wins: 0, losses: 0, units: 0, roi: null, clv_avg: null },
      ],
      now: NOW,
    });
    expect(body).toContain('| Rank |');
    expect(body).toContain('[Warren Sharp](../Experts/warren-sharp.md)');
    expect(body).toContain('[Sharon Lee](../Experts/sharon-lee.md)');
  });
});

describe('renderWeeklyConsensus', () => {
  it('groups picks by game and shows tally', () => {
    const body = renderWeeklyConsensus({
      week: { season: 2026, week: 2 },
      games: [
        {
          home: 'BUF', away: 'KC', kickoff_at: '2026-09-15T20:20:00Z',
          picks: samplePicks.slice(0, 2),
        },
      ],
      now: NOW,
    });
    expect(body).toContain('Season 2026');
    expect(body).toContain('Week 2');
    expect(body).toContain('KC @ BUF');
    expect(body).toContain('Consensus');
    expect(body).toContain('Picks');
  });
});

describe('renderFuturesMarket', () => {
  it('renders calls + line history', () => {
    const body = renderFuturesMarket({
      market: 'NFC North',
      picks: [samplePicks[2]],
      lineHistory: [
        { captured_at: '2026-09-01T12:00:00Z', selection: 'DET', odds_american: 130 },
        { captured_at: '2026-09-08T12:00:00Z', selection: 'DET', odds_american: 150 },
      ],
      now: NOW,
    });
    expect(body).toContain('NFC North');
    expect(body).toContain('Sharon Lee');
    expect(body).toContain('Line History');
    expect(body).toContain('+130');
    expect(body).toContain('+150');
  });
});

describe('renderPlayerProp', () => {
  it('renders a timeline list', () => {
    const body = renderPlayerProp({
      player: 'Patrick Mahomes',
      prop: 'pass_yds',
      picks: [
        { category: 'prop', subject: 'Patrick Mahomes', subject_market: 'pass_yds',
          selection: 'OVER', line: 281.5, odds_american: -115, units: 1, confidence: 0.6,
          summary: 'Bills run defense good, force passing.',
          expert_name: 'Warren Sharp', expert_slug: 'warren-sharp',
          episode_published_at: '2026-09-12T10:00:00Z' },
      ],
      now: NOW,
    });
    expect(body).toContain('Patrick Mahomes');
    expect(body).toContain('pass_yds');
    expect(body).toContain('Picks Timeline');
    expect(body).toContain('281.5');
  });
});

describe('groupByTeam / groupByExpert', () => {
  it('routes picks to every team mentioned via team1/team2/selection', () => {
    const map = groupByTeam(samplePicks);
    expect(Object.keys(map).sort()).toEqual(expect.arrayContaining(['BUF', 'KC']));
    // KC selection appears in Spread #1; KC@BUF total puts KC + BUF in
    expect(map.KC.length).toBeGreaterThan(0);
    expect(map.BUF.length).toBeGreaterThan(0);
  });

  it('groups by expert_slug and ignores experts without slug', () => {
    const map = groupByExpert(samplePicks);
    expect(Object.keys(map).sort()).toEqual(['sharon-lee', 'warren-sharp']);
    expect(map['warren-sharp']).toHaveLength(2);
  });
});

describe('aggregateExpertLedger', () => {
  it('computes record + units + clv from graded picks', () => {
    const ledger = aggregateExpertLedger(
      samplePicks.filter((p) => p.expert_slug === 'warren-sharp'),
    );
    expect(ledger.graded).toBe(2);
    expect(ledger.wins).toBe(1);
    expect(ledger.losses).toBe(1);
    expect(ledger.units).toBeCloseTo(-0.09, 3);
    expect(ledger.clv_avg).toBeCloseTo(0.015, 3);
  });

  it('returns nulls when no graded picks', () => {
    const ledger = aggregateExpertLedger([{ category: 'spread' }]);
    expect(ledger.graded).toBe(0);
    expect(ledger.roi).toBeNull();
    expect(ledger.win_rate).toBeNull();
  });
});

describe('rebuildTeamNote', () => {
  it('preserves manual content above the auto sections', () => {
    const existing = [
      '# KC Chiefs',
      '',
      'Hand-written stub Andy maintains.',
      '',
      '## Recent Intel',
      '_(legacy intel-to-vault output, not touched here)_',
      '',
    ].join('\n');
    const out = rebuildTeamNote({
      existing,
      abbr: 'KC',
      picks: samplePicks.filter((p) => p.team1 === 'KC' || p.team2 === 'KC'),
      trend: null,
      now: NOW,
    });
    expect(out).toContain('Hand-written stub Andy maintains.');
    expect(out).toContain('## Recent Intel');
    expect(out).toContain('_(legacy intel-to-vault output');
    expect(out).toContain('## Podcast Intel');
    expect(out).toContain('## Season Trend');
    expect(out).toContain('<!-- auto-start:vault-rebuilder/v1 -->');
  });

  it('refuses to rebuild when fences are corrupt', () => {
    const corrupt = '## Podcast Intel\n<!-- auto-start:v1 -->\nstuff (no end)\n';
    expect(() =>
      rebuildTeamNote({ existing: corrupt, abbr: 'KC', picks: [], trend: null, now: NOW }),
    ).toThrow();
  });

  it('rebuild round-trip on identical inputs is a no-op', () => {
    const picks = samplePicks.filter((p) => p.team1 === 'KC' || p.team2 === 'KC');
    const a = rebuildTeamNote({ existing: '', abbr: 'KC', picks, trend: null, now: NOW });
    const b = rebuildTeamNote({ existing: a, abbr: 'KC', picks, trend: null, now: NOW });
    expect(b).toBe(a);
  });
});

describe('rebuildExpertNote', () => {
  it('keeps the auto-fence and replaces inner body deterministically', () => {
    const expert = { slug: 'warren-sharp', name: 'Warren Sharp' };
    const picks = samplePicks.filter((p) => p.expert_slug === 'warren-sharp');
    const ledger = aggregateExpertLedger(picks);
    const a = rebuildExpertNote({ existing: '', expert, ledger, picks, now: NOW });
    const b = rebuildExpertNote({ existing: a, expert, ledger, picks, now: NOW });
    expect(b).toBe(a);
    expect(a).toContain('## Season Ledger');
    expect(a).toContain('<!-- auto-start:vault-rebuilder/v1 -->');
    expect(a).toContain('<!-- auto-end -->');
  });
});

describe('PATHS / slugify', () => {
  it('produces expected vault paths', () => {
    expect(PATHS.team('KC')).toBe('NFL/Teams/KC.md');
    expect(PATHS.expert('warren-sharp')).toBe('NFL/Experts/warren-sharp.md');
    expect(PATHS.weekly(2026, 2)).toBe('NFL/Weekly/2026-W2.md');
    expect(PATHS.futures('NFC_North')).toBe('NFL/Futures/NFC_North.md');
    expect(PATHS.prop('Patrick Mahomes', 'pass_yds')).toBe(
      'NFL/Props/patrick-mahomes-pass-yds.md',
    );
  });

  it('slugify lowercases and dasherizes', () => {
    expect(slugify('Warren Sharp')).toBe('warren-sharp');
    expect(slugify("DK Metcalf — Rec Yds")).toBe('dk-metcalf-rec-yds');
  });
});

describe('composeTeamSections', () => {
  it('returns two sections in fixed order', () => {
    const out = composeTeamSections({ abbr: 'KC', picks: [], trend: null, now: NOW });
    expect(out).toHaveLength(2);
    expect(out[0].header).toBe('## Podcast Intel');
    expect(out[1].header).toBe('## Season Trend');
  });
});
