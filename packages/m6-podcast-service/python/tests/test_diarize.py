"""Unit tests for nfl_podcast.diarize (L1).

No GPU dependencies -- faster_whisper and pyannote are NOT imported.
Tests cover:
  - DiarizedSegment dataclass construction + defaults
  - _assign_speakers overlap logic (via mock annotation)
  - load_whisperx_backend_or_fallback falls back when env vars absent
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from nfl_podcast.diarize import DiarizedSegment, _assign_speakers
from nfl_podcast.transcribe import WhisperSegment


# ---------------------------------------------------------------------------
# DiarizedSegment
# ---------------------------------------------------------------------------

class TestDiarizedSegment:
    def test_is_whisper_segment_subclass(self):
        seg = DiarizedSegment(start=0.0, end=1.0, text='hello')
        assert isinstance(seg, WhisperSegment)

    def test_default_speaker_is_unknown(self):
        seg = DiarizedSegment(start=0.0, end=1.0, text='hello')
        assert seg.speaker == 'UNKNOWN'

    def test_explicit_speaker(self):
        seg = DiarizedSegment(start=2.5, end=4.0, text='world', speaker='SPEAKER_00')
        assert seg.speaker == 'SPEAKER_00'

    def test_frozen(self):
        seg = DiarizedSegment(start=0.0, end=1.0, text='x')
        with pytest.raises((AttributeError, TypeError)):
            seg.speaker = 'SPEAKER_01'  # type: ignore[misc]

    def test_inherits_start_end_text(self):
        seg = DiarizedSegment(start=1.1, end=2.2, text='test text', speaker='S0')
        assert seg.start == 1.1
        assert seg.end == 2.2
        assert seg.text == 'test text'


# ---------------------------------------------------------------------------
# _assign_speakers
# ---------------------------------------------------------------------------

def _make_annotation(turns):
    """Build a fake pyannote Annotation-like object from (start, end, speaker) tuples."""
    class _Turn:
        def __init__(self, start, end):
            self.start = start
            self.end = end

    ann = MagicMock()
    ann.itertracks.return_value = [
        (_Turn(start, end), None, spk) for start, end, spk in turns
    ]
    return ann


class TestAssignSpeakers:
    def test_exact_overlap(self):
        segs = [{'start': 0.0, 'end': 2.0, 'text': 'hello'}]
        ann = _make_annotation([(0.0, 2.0, 'SPEAKER_00')])
        result = _assign_speakers(segs, ann)
        assert result[0]['speaker'] == 'SPEAKER_00'

    def test_partial_overlap_picks_best(self):
        # Segment 0-4s; SPEAKER_00 covers 0-1s, SPEAKER_01 covers 1-4s
        segs = [{'start': 0.0, 'end': 4.0, 'text': 'mixed'}]
        ann = _make_annotation([
            (0.0, 1.0, 'SPEAKER_00'),
            (1.0, 4.0, 'SPEAKER_01'),
        ])
        result = _assign_speakers(segs, ann)
        assert result[0]['speaker'] == 'SPEAKER_01'  # 3s overlap vs 1s

    def test_no_overlap_gives_unknown(self):
        segs = [{'start': 5.0, 'end': 6.0, 'text': 'late'}]
        ann = _make_annotation([(0.0, 2.0, 'SPEAKER_00')])
        result = _assign_speakers(segs, ann)
        assert result[0]['speaker'] == 'UNKNOWN'

    def test_multiple_segments(self):
        segs = [
            {'start': 0.0, 'end': 3.0, 'text': 'first'},
            {'start': 5.0, 'end': 8.0, 'text': 'second'},
        ]
        ann = _make_annotation([
            (0.0, 3.0, 'SPEAKER_00'),
            (5.0, 8.0, 'SPEAKER_01'),
        ])
        result = _assign_speakers(segs, ann)
        assert result[0]['speaker'] == 'SPEAKER_00'
        assert result[1]['speaker'] == 'SPEAKER_01'

    def test_preserves_other_keys(self):
        segs = [{'start': 0.0, 'end': 1.0, 'text': 'hi', 'segment_idx': 0}]
        ann = _make_annotation([(0.0, 1.0, 'SPEAKER_00')])
        result = _assign_speakers(segs, ann)
        assert result[0]['segment_idx'] == 0
        assert result[0]['text'] == 'hi'

    def test_empty_segments(self):
        ann = _make_annotation([(0.0, 5.0, 'SPEAKER_00')])
        result = _assign_speakers([], ann)
        assert result == []

    def test_empty_turns(self):
        segs = [{'start': 0.0, 'end': 1.0, 'text': 'lonely'}]
        ann = _make_annotation([])
        result = _assign_speakers(segs, ann)
        assert result[0]['speaker'] == 'UNKNOWN'

    def test_adjacent_turns_no_gap(self):
        # Turn boundary falls exactly at segment midpoint
        segs = [{'start': 0.0, 'end': 2.0, 'text': 'split'}]
        ann = _make_annotation([
            (0.0, 1.0, 'SPEAKER_00'),
            (1.0, 2.0, 'SPEAKER_01'),
        ])
        result = _assign_speakers(segs, ann)
        # Both turns have exactly 1s overlap -- either is valid
        assert result[0]['speaker'] in ('SPEAKER_00', 'SPEAKER_01')


# ---------------------------------------------------------------------------
# load_whisperx_backend_or_fallback -- fallback path only (no GPU)
# ---------------------------------------------------------------------------

class TestFallback:
    def test_falls_back_when_diarize_flag_off(self, monkeypatch):
        monkeypatch.setenv('HF_TOKEN', 'hf_fake')
        monkeypatch.delenv('WHISPERX_DIARIZE', raising=False)

        fake_backend = MagicMock()
        with patch('nfl_podcast.diarize.load_faster_whisper_backend', return_value=fake_backend):
            from nfl_podcast.diarize import load_whisperx_backend_or_fallback
            backend, diarized = load_whisperx_backend_or_fallback()
        assert diarized is False
        assert backend is fake_backend

    def test_falls_back_when_no_token(self, monkeypatch):
        monkeypatch.delenv('HF_TOKEN', raising=False)
        monkeypatch.setenv('WHISPERX_DIARIZE', 'true')

        fake_backend = MagicMock()
        with patch('nfl_podcast.diarize.load_faster_whisper_backend', return_value=fake_backend):
            from nfl_podcast.diarize import load_whisperx_backend_or_fallback
            backend, diarized = load_whisperx_backend_or_fallback()
        assert diarized is False
        assert backend is fake_backend

    def test_falls_back_on_import_error(self, monkeypatch):
        monkeypatch.setenv('HF_TOKEN', 'hf_fake')
        monkeypatch.setenv('WHISPERX_DIARIZE', 'true')

        fake_backend = MagicMock()
        with (
            patch('nfl_podcast.diarize.load_whisperx_backend', side_effect=ImportError('no pyannote')),
            patch('nfl_podcast.diarize.load_faster_whisper_backend', return_value=fake_backend),
        ):
            from nfl_podcast.diarize import load_whisperx_backend_or_fallback
            backend, diarized = load_whisperx_backend_or_fallback()
        assert diarized is False
        assert backend is fake_backend

    def test_diarized_true_path_calls_load_whisperx_backend(self, monkeypatch):
        monkeypatch.setenv('HF_TOKEN', 'hf_fake')
        monkeypatch.setenv('WHISPERX_DIARIZE', 'true')

        fake_backend = MagicMock()
        with patch('nfl_podcast.diarize.load_whisperx_backend', return_value=fake_backend) as mock_lx:
            from nfl_podcast.diarize import load_whisperx_backend_or_fallback
            backend, diarized = load_whisperx_backend_or_fallback()
        assert diarized is True
        assert backend is fake_backend
        mock_lx.assert_called_once()
