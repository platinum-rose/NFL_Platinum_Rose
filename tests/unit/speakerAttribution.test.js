/**
 * Unit tests for agents/lib/speaker-attribution.js — the JS port of
 * packages/m6-podcast-service/python/nfl_podcast/speaker_map.py's fuzzy-alias
 * matching, adapted to run on AssemblyAI diarized utterances instead of
 * WhisperX/pyannote segments. Test structure mirrors test_speaker_map.py so
 * behavior parity is easy to eyeball.
 */
import { describe, it, expect } from 'vitest';
import {
  loadShowConfig,
  buildPerSpeakerWindow,
  buildSpeakerMap,
  applySpeakerMap,
  buildLabeledTranscript,
} from '../../agents/lib/speaker-attribution.js';

function utt(start, end, text, speaker = 'A') {
  return { start, end, text, speaker };
}

// Minimal rosters for the 3 shows this module actually needs to handle.
const SHARP_EXPERTS = [
  { name: 'Chad Millman', source: 'Sharp or Square', aliases: ['chad millman', 'millman', 'chad'], isShow: false },
  { name: 'Simon Hunter', source: 'Sharp or Square', aliases: ['simon hunter', 'hunter', 'simon'], isShow: false },
];
const EVEN_MONEY_EXPERTS = [
  { name: 'Ross Tucker', source: 'Even Money', aliases: ['ross tucker', 'tucker', 'ross'], isShow: false },
  { name: 'Steve Fezzik', source: 'Even Money', aliases: ['steve fezzik', 'fezzik', 'fezzick', 'fezik', 'fezick'], isShow: false },
];
const FAVORITES_EXPERTS = [
  { name: 'Kendra Middleton', source: 'The Favorites', aliases: ['kendra middleton', 'middleton', 'kendra'], isShow: false },
  { name: 'Brandon Kravitz', source: 'The Favorites', aliases: ['brandon kravitz', 'kravitz'], isShow: false },
];
const BETTINGPROS_EXPERTS = [
  { name: 'Seth Woolcock', source: 'BettingPros', aliases: ['seth woolcock', 'woolcock'], isShow: false },
  { name: 'Andrew Erickson', source: 'BettingPros', aliases: ['andrew erickson', 'erickson'], isShow: false },
];
const ACTION_NETWORK_EXPERTS = [
  { name: 'Sean Koerner', source: 'Action Network', aliases: ['sean koerner', 'koerner', 'sean'], isShow: false },
  { name: 'Chris Raybon', source: 'Action Network', aliases: ['chris raybon', 'raybon', 'rayburn', 'rabon'], isShow: false },
];

describe('loadShowConfig', () => {
  it('returns config for a known diarized show', () => {
    const cfg = loadShowConfig('Sharp or Square');
    expect(cfg).not.toBeNull();
    expect(cfg.source).toBe('Sharp or Square');
    expect(cfg.fuzzyThreshold).toBeGreaterThan(0);
  });

  it('returns null for a show that does not need diarization', () => {
    // Sharp Football Analysis (Warren Sharp) is the one genuinely single-voice
    // show among the 6 -- BettingPros and Action Network are NOT examples of
    // this (see the correction note above SHOW_CONFIG), so don't reuse them here.
    expect(loadShowConfig('Sharp Football Analysis')).toBeNull();
    expect(loadShowConfig('Nonexistent Show')).toBeNull();
  });
});

describe('buildPerSpeakerWindow', () => {
  it('includes the speaker’s own text', () => {
    const utts = [utt(0, 5, "I'm Chad Millman", 'A')];
    const w = buildPerSpeakerWindow(utts, 'A', 300);
    expect(w).toContain('chad millman');
  });

  it('includes adjacent other-speaker text (cross-introduction)', () => {
    const utts = [
      utt(2, 4, 'Joining us today is Simon Hunter.', 'B'),
      utt(5, 10, 'Thanks for having me.', 'A'),
    ];
    const w = buildPerSpeakerWindow(utts, 'A', 300);
    expect(w).toContain('simon hunter');
  });

  it('excludes non-adjacent other-speaker text', () => {
    const utts = [
      utt(0, 5, 'I am Chad.', 'A'),
      utt(65, 70, 'Way later comment about Simon.', 'B'),
    ];
    const w = buildPerSpeakerWindow(utts, 'A', 300, 15.0);
    expect(w).not.toContain('simon');
  });

  it('excludes text outside the intro window', () => {
    const utts = [
      utt(0, 5, 'Intro text.', 'A'),
      utt(310, 315, 'Late mention of Simon Hunter.', 'B'),
    ];
    const w = buildPerSpeakerWindow(utts, 'A', 300, 15.0);
    expect(w).not.toContain('simon');
  });

  it('returns empty string when the speaker never appears', () => {
    const utts = [utt(0, 5, 'Hello', 'A')];
    expect(buildPerSpeakerWindow(utts, 'Z', 300)).toBe('');
  });

  it('lowercases the result', () => {
    const utts = [utt(0, 5, 'CHAD MILLMAN HERE', 'A')];
    const w = buildPerSpeakerWindow(utts, 'A', 300);
    expect(w).toBe(w.toLowerCase());
  });
});

describe('buildSpeakerMap', () => {
  it('exact alias match — Sharp or Square', () => {
    const utts = [
      utt(0, 5, "Hi I'm Chad Millman welcome to the show.", 'A'),
      utt(6, 10, "And I'm Simon Hunter.", 'B'),
    ];
    const result = buildSpeakerMap(utts, 'Sharp or Square', SHARP_EXPERTS);
    expect(result.A).toBe('Chad Millman');
    expect(result.B).toBe('Simon Hunter');
  });

  it('exact alias match — Even Money', () => {
    const utts = [
      utt(0, 5, 'This is Ross Tucker on Even Money.', 'A'),
      utt(6, 10, 'Joined as always by Steve Fezzik.', 'B'),
    ];
    const result = buildSpeakerMap(utts, 'Even Money', EVEN_MONEY_EXPERTS);
    expect(result.A).toBe('Ross Tucker');
    expect(result.B).toBe('Steve Fezzik');
  });

  it('tolerates a near-miss ASR spelling of a co-host name', () => {
    // "fezzick" (transcribed) vs alias "fezzik" -- real ASR variance, should still match.
    const utts = [utt(0, 5, 'Joined as always by Steve Fezzick.', 'A')];
    const result = buildSpeakerMap(utts, 'Even Money', EVEN_MONEY_EXPERTS);
    expect(result.A).toBe('Steve Fezzik');
  });

  it('falls back to Guest for a completely unrecognized speaker', () => {
    const utts = [utt(0, 5, 'Hello my name is John Smith.', 'A')];
    const result = buildSpeakerMap(utts, 'Sharp or Square', SHARP_EXPERTS);
    expect(result.A).toBe('Guest');
  });

  it('returns empty mapping for a show not configured for diarization', () => {
    const utts = [utt(0, 5, 'Hello.', 'A')];
    expect(buildSpeakerMap(utts, 'Sharp Football Analysis', SHARP_EXPERTS)).toEqual({});
  });

  it('falls back to Guest when the speaker only appears after the intro window', () => {
    const utts = [utt(500, 505, "I'm Chad Millman.", 'A')];
    const result = buildSpeakerMap(utts, 'Sharp or Square', SHARP_EXPERTS);
    expect(result.A).toBe('Guest');
  });

  it('does not double-assign an expert already claimed by an earlier speaker', () => {
    const utts = [
      utt(0, 5, "Hi I'm Chad Millman.", 'A'),
      utt(6, 10, "As Chad said, I'm Simon Hunter.", 'B'),
    ];
    const result = buildSpeakerMap(utts, 'Sharp or Square', SHARP_EXPERTS);
    expect(result.A).toBe('Chad Millman');
    expect(result.B).toBe('Simon Hunter');
  });

  it('does not match a host from a different show’s roster', () => {
    // Kendra Middleton (The Favorites) should not match against a Sharp or Square episode.
    const utts = [utt(0, 5, "I'm Kendra Middleton.", 'A')];
    const result = buildSpeakerMap(utts, 'Sharp or Square', [...SHARP_EXPERTS, ...FAVORITES_EXPERTS]);
    expect(result.A).toBe('Guest');
  });

  it('defaults to the real EXPERTS roster from src/lib/experts.js when none is passed', () => {
    const utts = [utt(0, 5, "I'm Chad Millman.", 'A')];
    const result = buildSpeakerMap(utts, 'Sharp or Square');
    expect(result.A).toBe('Chad Millman');
  });

  it('handles BettingPros Podcast’s rotating roster (correction: this show is NOT single-host)', () => {
    const utts = [
      utt(0, 5, "Hey everybody it's Seth Woolcock.", 'A'),
      utt(6, 10, "And Andrew Erickson here too.", 'B'),
    ];
    const result = buildSpeakerMap(utts, 'BettingPros Podcast', BETTINGPROS_EXPERTS);
    expect(result.A).toBe('Seth Woolcock');
    expect(result.B).toBe('Andrew Erickson');
  });

  it('handles Action Network Sports Betting’s rotating roster (correction: this show is NOT single-host)', () => {
    const utts = [
      utt(0, 5, "This is Sean Koerner.", 'A'),
      utt(6, 10, "Chris Raybon joining as well.", 'B'),
    ];
    const result = buildSpeakerMap(utts, 'Action Network Sports Betting', ACTION_NETWORK_EXPERTS);
    expect(result.A).toBe('Sean Koerner');
    expect(result.B).toBe('Chris Raybon');
  });
});

describe('applySpeakerMap', () => {
  it('replaces speaker ids with resolved names', () => {
    const utts = [utt(0, 1, 'hi', 'A'), utt(1, 2, 'there', 'B')];
    const result = applySpeakerMap(utts, { A: 'Chad Millman', B: 'Simon Hunter' });
    expect(result[0].speaker).toBe('Chad Millman');
    expect(result[1].speaker).toBe('Simon Hunter');
  });

  it('leaves unmapped ids as-is', () => {
    const result = applySpeakerMap([utt(0, 1, 'x', 'Z')], { A: 'Chad Millman' });
    expect(result[0].speaker).toBe('Z');
  });

  it('preserves other fields', () => {
    const result = applySpeakerMap([{ start: 1.5, end: 3.0, text: 'hello', speaker: 'A', extra: 2 }], { A: 'Chad Millman' });
    expect(result[0].extra).toBe(2);
    expect(result[0].start).toBe(1.5);
  });
});

describe('buildLabeledTranscript', () => {
  it('formats as [M:SS] Speaker: text', () => {
    const utts = [
      { start: 0.0, end: 5.0, text: 'Hello everyone.', speaker: 'Chad Millman' },
      { start: 166.0, end: 170.0, text: 'My pick is the Chiefs.', speaker: 'Simon Hunter' },
    ];
    const result = buildLabeledTranscript(utts);
    expect(result).toContain('[0:00] Chad Millman: Hello everyone.');
    expect(result).toContain('[2:46] Simon Hunter: My pick is the Chiefs.');
  });

  it('skips empty-text utterances', () => {
    const utts = [
      { start: 0, end: 1, text: '', speaker: 'Chad Millman' },
      { start: 1, end: 2, text: 'Actual content.', speaker: 'Chad Millman' },
    ];
    expect(buildLabeledTranscript(utts).split('\n')).toHaveLength(1);
  });

  it('falls back to Unknown when speaker is missing', () => {
    expect(buildLabeledTranscript([{ start: 0, end: 1, text: 'Hi.' }])).toContain('Unknown: Hi.');
  });

  it('returns empty string for empty input', () => {
    expect(buildLabeledTranscript([])).toBe('');
  });
});
