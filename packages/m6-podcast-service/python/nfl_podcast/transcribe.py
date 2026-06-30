"""Local podcast transcription pipeline (spec §3 Phase 3).

The actual Whisper inference uses ``faster-whisper`` (CTranslate2). That dep
is heavy and platform-specific (CPU-optimized .so files), so this module
isolates it behind a small ``WhisperBackend`` protocol. Tests inject a fake;
M6 production uses :func:`load_faster_whisper_backend`.

L3 additions:
  - ``transcribe_audio`` passes through the ``speaker`` attribute from
    ``DiarizedSegment`` (or ``None`` for plain WhisperSegment).
  - ``TranscriptionResult`` gains a ``diarized`` flag.
  - ``write_outputs`` writes ``<episode_id>.labeled.txt`` when speaker labels
    are present and ``labeled_transcript`` is supplied.
  - ``_cli`` gains ``--diarize`` and ``--show-name`` flags; selects the
    WhisperX backend and runs speaker mapping when appropriate.

Pipeline (per spec):
  1. ffmpeg normalize -> 16 kHz mono WAV in /tmp
  2. If duration > 30 min, split at silence near 25-min boundaries
  3. Transcribe each segment with vad_filter=True, beam_size=5, language='en'
  4. Reassemble with corrected absolute timestamps
  5. Write outputs:
       /var/lib/nfl/transcripts/<episode_id>.txt           (plain text)
       /var/lib/nfl/transcripts/<episode_id>.segments.json (timestamps + optional speaker)
       /var/lib/nfl/transcripts/<episode_id>.labeled.txt   (speaker-labeled, diarized only)
"""

from __future__ import annotations

import json
import tempfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable, Protocol

from . import audio as audio_mod


@dataclass(frozen=True)
class WhisperSegment:
    start: float       # seconds, relative to the segment's audio file
    end: float
    text: str


class WhisperBackend(Protocol):
    """Minimal interface for a Whisper transcriber.

    Production: faster-whisper (or WhisperX diarizing backend).
    Tests: in-memory fake returning canned segments.
    """

    def transcribe(self, audio_path: str | Path) -> Iterable[WhisperSegment]: ...


@dataclass
class TranscriptionResult:
    text: str
    segments: list[dict]      # serializable dicts: {start, end, text, segment_idx, speaker}
    audio_duration_sec: float
    model: str
    chunked: bool             # True if the source was split into >1 chunk
    diarized: bool = field(default=False)  # True when speaker labels are present


def transcribe_audio(
    src_audio: str | Path,
    *,
    backend: WhisperBackend,
    model_name: str,
    work_dir: str | Path | None = None,
    runner: audio_mod.Runner | None = None,
) -> TranscriptionResult:
    """Transcribe ``src_audio`` end-to-end with chunking + reassembly.

    If the backend yields ``DiarizedSegment`` instances (which have a
    ``speaker`` attribute), the speaker label is forwarded into each
    segment dict.  Plain ``WhisperSegment`` instances produce
    ``"speaker": null`` in the output.
    """
    src_path = Path(src_audio)
    if not src_path.exists():
        raise FileNotFoundError(src_path)

    tmp_root = Path(work_dir) if work_dir else Path(tempfile.mkdtemp(prefix="nfl-podcast-"))
    tmp_root.mkdir(parents=True, exist_ok=True)
    norm_wav = tmp_root / f"{src_path.stem}.16k.wav"
    audio_mod.normalize_to_wav(src_path, norm_wav, runner=runner)

    info = audio_mod.probe_audio(norm_wav, runner=runner)
    duration = info.duration_sec

    if duration > audio_mod.LONG_AUDIO_THRESHOLD_SEC:
        silences = audio_mod.detect_silences(norm_wav, runner=runner)
        splits = audio_mod.pick_split_points(duration, silences)
        segments_dir = tmp_root / "segments"
        audio_segments = audio_mod.slice_audio(
            norm_wav,
            splits,
            out_dir=segments_dir,
            duration_sec=duration,
            runner=runner,
        )
        chunked = len(audio_segments) > 1
    else:
        audio_segments = [
            audio_mod.AudioSegment(idx=0, path=norm_wav, start_sec=0.0, duration_sec=duration)
        ]
        chunked = False

    final_segments: list[dict] = []
    text_parts: list[str] = []
    any_speaker = False

    for audio_seg in audio_segments:
        for w in backend.transcribe(audio_seg.path):
            abs_start = audio_seg.start_sec + w.start
            abs_end = audio_seg.start_sec + w.end
            txt = w.text.strip()
            if not txt:
                continue
            # Forward speaker label from DiarizedSegment; None for plain WhisperSegment.
            speaker = getattr(w, 'speaker', None)
            if speaker is not None:
                any_speaker = True
            final_segments.append(
                {
                    "start": round(abs_start, 3),
                    "end": round(abs_end, 3),
                    "text": txt,
                    "segment_idx": audio_seg.idx,
                    "speaker": speaker,
                }
            )
            text_parts.append(txt)

    _verify_monotonic(final_segments)
    return TranscriptionResult(
        text=" ".join(text_parts),
        segments=final_segments,
        audio_duration_sec=duration,
        model=model_name,
        chunked=chunked,
        diarized=any_speaker,
    )


def _verify_monotonic(segments: list[dict]) -> None:
    """Sanity check: timestamps should be non-decreasing across the whole track."""
    last_end = -1.0
    for s in segments:
        if s["start"] < last_end - 0.5:  # allow tiny overlap tolerance
            raise RuntimeError(
                f"Non-monotonic transcription timestamps: "
                f"start={s['start']} after end={last_end}"
            )
        last_end = max(last_end, s["end"])


def write_outputs(
    result: TranscriptionResult,
    *,
    episode_id: str,
    out_dir: str | Path,
    labeled_transcript: str | None = None,
) -> tuple[Path, Path, Path | None]:
    """Write ``<episode_id>.txt``, ``<episode_id>.segments.json``, and
    optionally ``<episode_id>.labeled.txt``.

    Args:
        result: transcription result.
        episode_id: base filename.
        out_dir: output directory (created if needed).
        labeled_transcript: pre-built speaker-labeled text
            (``[MM:SS] Speaker: text`` format). When provided, written to
            ``<episode_id>.labeled.txt``.  Pass the output of
            ``speaker_map.build_labeled_transcript(result.segments)`` here.

    Returns:
        ``(txt_path, segments_path, labeled_txt_path | None)``
    """
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    txt = out_path / f"{episode_id}.txt"
    seg = out_path / f"{episode_id}.segments.json"

    txt.write_text(result.text + "\n", encoding="utf-8")
    seg.write_text(
        json.dumps(
            {
                "episode_id": episode_id,
                "model": result.model,
                "audio_duration_sec": result.audio_duration_sec,
                "chunked": result.chunked,
                "diarized": result.diarized,
                "segments": result.segments,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    labeled_txt: Path | None = None
    if labeled_transcript is not None:
        labeled_txt = out_path / f"{episode_id}.labeled.txt"
        labeled_txt.write_text(labeled_transcript + "\n", encoding="utf-8")

    return txt, seg, labeled_txt


# ---------------------------------------------------------------------------
# Production backend (lazy, optional dep)
# ---------------------------------------------------------------------------

def load_faster_whisper_backend(
    *,
    model_name: str = "large-v3-turbo",
    model_dir: str | Path = "/var/lib/nfl/models",
    compute_type: str = "int8",
    beam_size: int = 5,
    language: str = "en",
    vad_filter: bool = True,
) -> WhisperBackend:
    """Build a faster-whisper backend. Imports lazily so unit tests don't need it."""
    from faster_whisper import WhisperModel  # noqa: WPS433  (deliberate runtime import)

    model = WhisperModel(
        model_size_or_path=str(Path(model_dir) / model_name)
        if (Path(model_dir) / model_name).exists()
        else model_name,
        device="cpu",
        compute_type=compute_type,
        download_root=str(model_dir),
    )

    class _Backend:
        def transcribe(self, audio_path: str | Path) -> Iterable[WhisperSegment]:
            segments, _info = model.transcribe(
                str(audio_path),
                beam_size=beam_size,
                language=language,
                vad_filter=vad_filter,
            )
            for seg in segments:
                yield WhisperSegment(start=float(seg.start), end=float(seg.end), text=seg.text)

    return _Backend()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _cli(argv: list[str] | None = None) -> int:
    import argparse
    import os

    p = argparse.ArgumentParser(description="Transcribe a podcast audio file.")
    p.add_argument("--audio", required=True, help="Path to source audio (mp3/m4a/wav)")
    p.add_argument("--episode-id", required=True)
    p.add_argument(
        "--out-dir",
        default=os.environ.get("NFL_TRANSCRIPT_DIR", "/var/lib/nfl/transcripts"),
    )
    p.add_argument("--model", default=os.environ.get("WHISPER_MODEL", "large-v3-turbo"))
    p.add_argument("--model-dir", default=os.environ.get("WHISPER_MODEL_DIR", "/var/lib/nfl/models"))
    p.add_argument("--work-dir", default=None, help="Scratch dir for ffmpeg output (default: /tmp/...)")
    # L3: diarization flags
    p.add_argument(
        "--diarize",
        action="store_true",
        help="Use pyannote speaker diarization (requires HF_TOKEN + WHISPERX_DIARIZE=true)",
    )
    p.add_argument(
        "--show-name",
        default=None,
        help="Show name for speaker->name mapping via experts roster (e.g. 'BettingPros Podcast')",
    )
    args = p.parse_args(argv)

    # Backend selection
    diarized = False
    if args.diarize:
        from .diarize import load_whisperx_backend_or_fallback  # noqa: WPS433
        backend, diarized = load_whisperx_backend_or_fallback(
            whisper_model=args.model,
            model_dir=args.model_dir,
        )
    else:
        backend = load_faster_whisper_backend(
            model_name=args.model,
            model_dir=args.model_dir,
        )

    result = transcribe_audio(
        args.audio,
        backend=backend,
        model_name=args.model,
        work_dir=args.work_dir,
    )

    # Speaker name resolution (L2)
    labeled_transcript: str | None = None
    if diarized and args.show_name:
        from .speaker_map import (  # noqa: WPS433
            apply_speaker_map,
            build_labeled_transcript,
            build_speaker_map,
        )
        spk_map = build_speaker_map(result.segments, args.show_name)
        result.segments = apply_speaker_map(result.segments, spk_map)
        labeled_transcript = build_labeled_transcript(result.segments)

    txt, seg, labeled_txt = write_outputs(
        result,
        episode_id=args.episode_id,
        out_dir=args.out_dir,
        labeled_transcript=labeled_transcript,
    )

    summary = {
        "episode_id": args.episode_id,
        "model": result.model,
        "audio_duration_sec": result.audio_duration_sec,
        "chunked": result.chunked,
        "diarized": result.diarized,
        "segment_count": len(result.segments),
        "txt": str(txt),
        "segments_json": str(seg),
        "labeled_txt": str(labeled_txt) if labeled_txt else None,
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(_cli())


# Re-export for symmetry with extract.run / extract.main if a caller imports both.
__all__ = [
    "WhisperSegment",
    "WhisperBackend",
    "TranscriptionResult",
    "transcribe_audio",
    "write_outputs",
    "load_faster_whisper_backend",
]


# Silence unused-import warning from ``asdict``; kept for downstream callers
# that may want to serialize TranscriptionResult.
_ = asdict
