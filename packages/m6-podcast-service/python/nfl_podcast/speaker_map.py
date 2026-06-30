"""Map pyannote SPEAKER_X IDs to named experts from the show roster (L2).

Strategy (spec §14 -- fuzzy alias matching):
  1. For each SPEAKER_X, collect their text + adjacent other-speaker text from
     the intro window (first N minutes).
  2. Fuzzy-match every alias in the show's expert roster against that window.
  3. First alias that exceeds fuzzy_threshold wins.
  4. Unmatched speakers labeled 'Guest'.

show_hosts.json: per-show tuning params (source, intro_window_sec, fuzzy_threshold).
experts_roster.json: all 36 experts from experts.js, fields: name/source/aliases/isShow.
  - Regenerate with: node scripts/generate_experts_json.js  (when experts.js changes)
  - Or pass experts inline via the `experts` parameter.

Dependencies: rapidfuzz (already in .venv-whisperx requirements).
"""
from __future__ import annotations

import json
from pathlib import Path

from rapidfuzz import fuzz

_SHOW_HOSTS_FILE = Path(__file__).parent / 'show_hosts.json'
_EXPERTS_FILE = Path(__file__).parent / 'experts_roster.json'
_ADJACENT_GAP_SEC = 15.0   # seconds window for intro cross-mentions


# ---------------------------------------------------------------------------
# Config loaders
# ---------------------------------------------------------------------------

def load_show_config(show_name: str) -> dict | None:
    """Return per-show tuning config or None if show not in show_hosts.json."""
    if not _SHOW_HOSTS_FILE.exists():
        return None
    data = json.loads(_SHOW_HOSTS_FILE.read_text(encoding='utf-8'))
    return data.get(show_name)


def load_experts(experts_path: str | Path | None = None) -> list[dict]:
    """Load experts roster from JSON file.

    Args:
        experts_path: override path; defaults to experts_roster.json next to this module.

    Returns:
        List of expert dicts with keys: name, source, aliases, isShow.
    """
    path = Path(experts_path) if experts_path else _EXPERTS_FILE
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding='utf-8'))


# ---------------------------------------------------------------------------
# Window text builder
# ---------------------------------------------------------------------------

def _build_per_speaker_window(
    segments: list[dict],
    speaker_id: str,
    intro_window_sec: float,
    adjacent_gap_sec: float = _ADJACENT_GAP_SEC,
) -> str:
    """Collect intro-window text for one speaker.

    Combines:
    - The speaker's own segments within intro_window_sec.
    - Text from OTHER speakers whose segments are adjacent (within adjacent_gap_sec)
      to any of this speaker's own segments, also within intro_window_sec.
      This captures cross-introductions ("joining us today is Seth Woolcock").
    """
    window_segs = [s for s in segments if s.get('start', 0.0) <= intro_window_sec]
    own_segs = [s for s in window_segs if s.get('speaker') == speaker_id]
    other_segs = [s for s in window_segs if s.get('speaker') != speaker_id]

    if not own_segs:
        return ''

    # Find adjacent OTHER-speaker segments (close in time to any own segment)
    adjacent_texts: list[str] = []
    seen_texts: set[str] = set()
    for other in other_segs:
        o_start = float(other.get('start', 0.0))
        o_end = float(other.get('end', o_start))
        for own in own_segs:
            gap_before = float(own.get('start', 0.0)) - o_end
            gap_after = o_start - float(own.get('end', 0.0))
            if (0.0 <= gap_before <= adjacent_gap_sec) or (0.0 <= gap_after <= adjacent_gap_sec):
                txt = other.get('text', '')
                if txt and txt not in seen_texts:
                    adjacent_texts.append(txt)
                    seen_texts.add(txt)
                break  # already captured this other-segment

    own_text = ' '.join(s.get('text', '') for s in own_segs)
    all_text = ' '.join([own_text] + adjacent_texts)
    return all_text.lower()


# ---------------------------------------------------------------------------
# Core mapping
# ---------------------------------------------------------------------------

def build_speaker_map(
    segments: list[dict],
    show_name: str,
    *,
    experts: list[dict] | None = None,
    experts_path: str | Path | None = None,
) -> dict[str, str]:
    """Map SPEAKER_X IDs to expert names via fuzzy alias matching.

    Args:
        segments: list of {start, end, text, speaker} dicts (diarized).
        show_name: show name matching a key in show_hosts.json.
        experts: pre-loaded expert roster (from Node.js caller or tests).
                 Falls back to experts_roster.json if None.
        experts_path: override path for experts_roster.json.

    Returns:
        dict mapping 'SPEAKER_00' -> 'Seth Woolcock', 'SPEAKER_01' -> 'Guest', ...
        Returns empty dict if show not in show_hosts.json.
    """
    config = load_show_config(show_name)
    if not config:
        return {}

    source: str = config.get('source', show_name)
    intro_window_sec: float = float(config.get('intro_window_sec', 300.0))
    # rapidfuzz scores are 0-100; config stores 0.0-1.0
    threshold: float = float(config.get('fuzzy_threshold', 0.82)) * 100.0

    # Load roster if not passed in
    roster = experts if experts is not None else load_experts(experts_path)

    # Filter to individual hosts for this show's source
    show_experts = [
        e for e in roster
        if not e.get('isShow', True) and e.get('source') == source
    ]

    # Unique speaker IDs in order of first appearance
    speaker_ids: list[str] = []
    for seg in segments:
        spk = seg.get('speaker', '')
        if spk and spk not in speaker_ids:
            speaker_ids.append(spk)

    # Experts already assigned to an earlier speaker are excluded from subsequent candidates.
    # Speakers are processed in first-appearance order so the first speaker to exhibit a
    # strong own-text signal "claims" the expert, preventing cross-contamination.
    assigned_experts: set[str] = set()

    mapping: dict[str, str] = {}
    for speaker_id in speaker_ids:
        # Use only this speaker's own segments in the intro window.
        # Adjacent-text collection (_build_per_speaker_window) is available for
        # future use but causes false positives in standard 2-host podcast format.
        own_segs = [
            s for s in segments
            if s.get('speaker') == speaker_id and s.get('start', 0.0) <= intro_window_sec
        ]
        if not own_segs:
            mapping[speaker_id] = 'Guest'
            continue

        window_text = ' '.join(s.get('text', '') for s in own_segs).lower()
        if not window_text.strip():
            mapping[speaker_id] = 'Guest'
            continue

        best_name: str | None = None
        best_score: float = 0.0

        for expert in show_experts:
            if expert['name'] in assigned_experts:
                continue  # already claimed by an earlier speaker
            for alias in expert.get('aliases', []):
                score = float(fuzz.partial_ratio(alias, window_text))
                if score > best_score:
                    best_score = score
                    best_name = expert['name']

        if best_name and best_score >= threshold:
            mapping[speaker_id] = best_name
            assigned_experts.add(best_name)
        else:
            mapping[speaker_id] = 'Guest'

    return mapping


# ---------------------------------------------------------------------------
# Post-processing helpers
# ---------------------------------------------------------------------------

def apply_speaker_map(
    segments: list[dict],
    speaker_map: dict[str, str],
) -> list[dict]:
    """Replace 'speaker' value in each segment with the resolved name.

    Unknown speaker IDs (not in map) are left as-is.
    """
    out = []
    for seg in segments:
        raw_spk = seg.get('speaker', '')
        resolved = speaker_map.get(raw_spk, raw_spk or 'Unknown')
        out.append({**seg, 'speaker': resolved})
    return out


def build_labeled_transcript(segments: list[dict]) -> str:
    """Format segments as [MM:SS] Speaker: text for LLM extraction.

    Example line: '[2:46] Andrew Erickson: For me, a trend that I like...'
    """
    lines = []
    for seg in segments:
        spk = seg.get('speaker', 'Unknown')
        text = seg.get('text', '').strip()
        if not text:
            continue
        ts = float(seg.get('start', 0.0))
        m = int(ts) // 60
        s = int(ts) % 60
        lines.append(f'[{m}:{s:02d}] {spk}: {text}')
    return '\n'.join(lines)


__all__ = [
    'load_show_config',
    'load_experts',
    'build_speaker_map',
    'apply_speaker_map',
    'build_labeled_transcript',
    '_build_per_speaker_window',  # exported for tests
]
