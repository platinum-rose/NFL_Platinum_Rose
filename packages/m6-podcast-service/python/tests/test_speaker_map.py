"""Unit tests for nfl_podcast.speaker_map (L2).

No GPU deps. Tests:
  - load_show_config: known / unknown show
  - _build_per_speaker_window: own text, adjacent text, windowing
  - build_speaker_map: exact match, fuzzy/noisy match, threshold miss, Guest fallback
  - apply_speaker_map: name substitution
  - build_labeled_transcript: format check
"""
from __future__ import annotations

import json
import pytest

from nfl_podcast.speaker_map import (
    _build_per_speaker_window,
    apply_speaker_map,
    build_labeled_transcript,
    build_speaker_map,
    load_show_config,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_BETTINGPROS_EXPERTS = [
    {"name": "Seth Woolcock",   "source": "BettingPros", "aliases": ["seth woolcock", "woolcock"],         "isShow": False},
    {"name": "Andrew Erickson", "source": "BettingPros", "aliases": ["andrew erickson", "erickson"],       "isShow": False},
    {"name": "Joe Pisapia",     "source": "BettingPros", "aliases": ["joe pisapia", "pisapia"],            "isShow": False},
]

_SHARP_EXPERTS = [
    {"name": "Chad Millman",  "source": "Sharp or Square", "aliases": ["chad millman", "millman", "chad"], "isShow": False},
    {"name": "Simon Hunter",  "source": "Sharp or Square", "aliases": ["simon hunter", "hunter", "simon"], "isShow": False},
]


def _seg(start, end, text, speaker='SPEAKER_00'):
    return {'start': start, 'end': end, 'text': text, 'speaker': speaker}


# ---------------------------------------------------------------------------
# load_show_config
# ---------------------------------------------------------------------------

class TestLoadShowConfig:
    def test_known_show_returns_dict(self):
        cfg = load_show_config('BettingPros Podcast')
        assert cfg is not None
        assert cfg['source'] == 'BettingPros'
        assert 'fuzzy_threshold' in cfg
        assert 'intro_window_sec' in cfg

    def test_unknown_show_returns_none(self):
        assert load_show_config('Nonexistent Show XYZ') is None

    def test_sharp_or_square_loaded(self):
        cfg = load_show_config('Sharp or Square')
        assert cfg is not None
        assert cfg['source'] == 'Sharp or Square'


# ---------------------------------------------------------------------------
# _build_per_speaker_window
# ---------------------------------------------------------------------------

class TestBuildPerSpeakerWindow:
    def test_own_text_included(self):
        segs = [_seg(0, 5, "I'm Seth Woolcock", 'SPEAKER_00')]
        window = _build_per_speaker_window(segs, 'SPEAKER_00', intro_window_sec=300)
        assert 'seth woolcock' in window

    def test_adjacent_other_speaker_included(self):
        # SPEAKER_00 speaks at 5s; SPEAKER_01 introduces them 3s before at 2s
        segs = [
            _seg(2, 4, 'Joining us today is Seth Woolcock.', 'SPEAKER_01'),
            _seg(5, 10, 'Thanks for having me.', 'SPEAKER_00'),
        ]
        window = _build_per_speaker_window(segs, 'SPEAKER_00', intro_window_sec=300)
        assert 'seth woolcock' in window

    def test_non_adjacent_other_speaker_excluded(self):
        # SPEAKER_01 speaks 60s after SPEAKER_00's last segment -- not adjacent
        segs = [
            _seg(0, 5, 'I am Seth.', 'SPEAKER_00'),
            _seg(65, 70, 'Way later comment about Woolcock.', 'SPEAKER_01'),
        ]
        window = _build_per_speaker_window(segs, 'SPEAKER_00', intro_window_sec=300, adjacent_gap_sec=15.0)
        assert 'woolcock' not in window

    def test_outside_window_excluded(self):
        segs = [
            _seg(0, 5, 'Intro text.', 'SPEAKER_00'),
            _seg(310, 315, 'Late mention of Seth Woolcock.', 'SPEAKER_01'),
        ]
        window = _build_per_speaker_window(segs, 'SPEAKER_00', intro_window_sec=300, adjacent_gap_sec=15.0)
        assert 'woolcock' not in window

    def test_empty_when_speaker_absent(self):
        segs = [_seg(0, 5, 'Hello', 'SPEAKER_00')]
        window = _build_per_speaker_window(segs, 'SPEAKER_99', intro_window_sec=300)
        assert window == ''

    def test_returns_lowercase(self):
        segs = [_seg(0, 5, 'Seth Woolcock HERE', 'SPEAKER_00')]
        window = _build_per_speaker_window(segs, 'SPEAKER_00', intro_window_sec=300)
        assert window == window.lower()


# ---------------------------------------------------------------------------
# build_speaker_map
# ---------------------------------------------------------------------------

class TestBuildSpeakerMap:
    def test_exact_alias_match(self):
        segs = [
            _seg(0, 5, "Hi I'm Seth Woolcock welcome to the show.", 'SPEAKER_00'),
            _seg(6, 10, "And I'm Andrew Erickson.", 'SPEAKER_01'),
        ]
        result = build_speaker_map(segs, 'BettingPros Podcast', experts=_BETTINGPROS_EXPERTS)
        assert result['SPEAKER_00'] == 'Seth Woolcock'
        assert result['SPEAKER_01'] == 'Andrew Erickson'

    def test_partial_alias_match(self):
        # "woolcock" is enough (alias in the list)
        segs = [_seg(0, 5, 'This is woolcock speaking.', 'SPEAKER_00')]
        result = build_speaker_map(segs, 'BettingPros Podcast', experts=_BETTINGPROS_EXPERTS)
        assert result['SPEAKER_00'] == 'Seth Woolcock'

    def test_fuzzy_noisy_transcription(self):
        # "wilcock" vs alias "woolcock" -- partial_ratio should be >= 82%
        segs = [_seg(0, 5, "I'm your host seth wilcock.", 'SPEAKER_00')]
        result = build_speaker_map(segs, 'BettingPros Podcast', experts=_BETTINGPROS_EXPERTS)
        assert result['SPEAKER_00'] == 'Seth Woolcock'

    def test_below_threshold_gives_guest(self):
        # Completely unrecognised speaker
        segs = [_seg(0, 5, 'Hello my name is John Smith.', 'SPEAKER_00')]
        result = build_speaker_map(segs, 'BettingPros Podcast', experts=_BETTINGPROS_EXPERTS)
        assert result['SPEAKER_00'] == 'Guest'

    def test_unknown_show_returns_empty(self):
        segs = [_seg(0, 5, 'Hello.', 'SPEAKER_00')]
        result = build_speaker_map(segs, 'Nonexistent Show', experts=_BETTINGPROS_EXPERTS)
        assert result == {}

    def test_no_window_text_gives_guest(self):
        # Speaker only appears after intro_window (300s)
        segs = [_seg(500, 505, "I'm Seth Woolcock.", 'SPEAKER_00')]
        result = build_speaker_map(segs, 'BettingPros Podcast', experts=_BETTINGPROS_EXPERTS)
        assert result['SPEAKER_00'] == 'Guest'

    def test_deduplication_prevents_double_assignment(self):
        # SPEAKER_00 says their own name; SPEAKER_01's text also contains it (adjacency).
        # Deduplication ensures Seth Woolcock is not re-assigned to SPEAKER_01.
        segs = [
            _seg(0, 5, "Hi I'm Seth Woolcock.", 'SPEAKER_00'),
            _seg(6, 10, "And as Seth said, I'm Andrew Erickson.", 'SPEAKER_01'),
        ]
        result = build_speaker_map(segs, 'BettingPros Podcast', experts=_BETTINGPROS_EXPERTS)
        assert result['SPEAKER_00'] == 'Seth Woolcock'
        # SPEAKER_01's own text contains both names -- but Seth Woolcock is already taken
        assert result['SPEAKER_01'] == 'Andrew Erickson'

    def test_show_filter_by_source(self):
        # Sharp or Square experts should NOT match against BettingPros segments
        segs = [_seg(0, 5, "I'm chad millman.", 'SPEAKER_00')]
        result = build_speaker_map(segs, 'BettingPros Podcast', experts=_BETTINGPROS_EXPERTS + _SHARP_EXPERTS)
        # chad millman is source=Sharp or Square, not BettingPros -- should be Guest
        assert result['SPEAKER_00'] == 'Guest'

    def test_sharp_or_square_show(self):
        segs = [
            _seg(0, 5, "I'm chad millman.", 'SPEAKER_00'),
            _seg(6, 10, 'And I am simon hunter.', 'SPEAKER_01'),
        ]
        result = build_speaker_map(segs, 'Sharp or Square', experts=_SHARP_EXPERTS)
        assert result['SPEAKER_00'] == 'Chad Millman'
        assert result['SPEAKER_01'] == 'Simon Hunter'

    def test_loads_roster_from_file_when_experts_none(self):
        # Use the real experts_roster.json -- must match at least one BettingPros host
        segs = [_seg(0, 5, "I'm seth woolcock.", 'SPEAKER_00')]
        result = build_speaker_map(segs, 'BettingPros Podcast')
        assert result.get('SPEAKER_00') == 'Seth Woolcock'


# ---------------------------------------------------------------------------
# apply_speaker_map
# ---------------------------------------------------------------------------

class TestApplySpeakerMap:
    def test_replaces_speaker_ids(self):
        segs = [
            {'start': 0.0, 'end': 1.0, 'text': 'hi', 'speaker': 'SPEAKER_00'},
            {'start': 1.0, 'end': 2.0, 'text': 'there', 'speaker': 'SPEAKER_01'},
        ]
        spk_map = {'SPEAKER_00': 'Seth Woolcock', 'SPEAKER_01': 'Andrew Erickson'}
        result = apply_speaker_map(segs, spk_map)
        assert result[0]['speaker'] == 'Seth Woolcock'
        assert result[1]['speaker'] == 'Andrew Erickson'

    def test_unknown_id_kept_as_is(self):
        segs = [{'start': 0, 'end': 1, 'text': 'x', 'speaker': 'SPEAKER_99'}]
        result = apply_speaker_map(segs, {'SPEAKER_00': 'Seth Woolcock'})
        assert result[0]['speaker'] == 'SPEAKER_99'

    def test_preserves_other_fields(self):
        segs = [{'start': 1.5, 'end': 3.0, 'text': 'hello', 'speaker': 'SPEAKER_00', 'segment_idx': 2}]
        result = apply_speaker_map(segs, {'SPEAKER_00': 'Seth Woolcock'})
        assert result[0]['segment_idx'] == 2
        assert result[0]['start'] == 1.5

    def test_empty_segments(self):
        assert apply_speaker_map([], {'SPEAKER_00': 'Name'}) == []


# ---------------------------------------------------------------------------
# build_labeled_transcript
# ---------------------------------------------------------------------------

class TestBuildLabeledTranscript:
    def test_format(self):
        segs = [
            {'start': 0.0, 'end': 5.0, 'text': 'Hello everyone.', 'speaker': 'Seth Woolcock'},
            {'start': 166.0, 'end': 170.0, 'text': 'My pick is the Chiefs.', 'speaker': 'Andrew Erickson'},
        ]
        result = build_labeled_transcript(segs)
        assert '[0:00] Seth Woolcock: Hello everyone.' in result
        assert '[2:46] Andrew Erickson: My pick is the Chiefs.' in result

    def test_skips_empty_text(self):
        segs = [
            {'start': 0.0, 'end': 1.0, 'text': '', 'speaker': 'Seth Woolcock'},
            {'start': 1.0, 'end': 2.0, 'text': 'Actual content.', 'speaker': 'Seth Woolcock'},
        ]
        result = build_labeled_transcript(segs)
        assert result.count('\n') == 0  # only one line

    def test_unknown_speaker_fallback(self):
        segs = [{'start': 0.0, 'end': 1.0, 'text': 'Hi.'}]  # no 'speaker' key
        result = build_labeled_transcript(segs)
        assert 'Unknown: Hi.' in result

    def test_empty_input(self):
        assert build_labeled_transcript([]) == ''
