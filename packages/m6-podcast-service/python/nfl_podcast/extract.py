"""CLI entry point: transcript path -> picks JSON.

Usage:
    python -m nfl_podcast.extract \\
        --transcript /path/to/transcript.txt \\
        --episode-id 42 \\
        [--out /path/to/picks.json] \\
        [--ollama-url http://127.0.0.1:11434] \\
        [--model qwen2.5:3b]

Returns exit 0 on success. Quality gate outcome (including
``needs_cloud_fallback``) is included in the JSON envelope so the calling
Fastify worker can decide whether to escalate to a cloud LLM.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from . import chunk as chunk_mod
from . import prompts
from .ollama_client import call_ollama_chat, httpx_post_json_factory
from .quality_gate import apply_quality_gate, reduce_picks


def run(
    *,
    transcript: str,
    episode_id: str | None,
    ollama_url: str,
    model: str,
    post_json=None,
) -> dict:
    chunks = chunk_mod.chunk_transcript(transcript)
    picks_per_chunk: list[tuple[int, str, list[dict]]] = []
    if post_json is None:
        post_json = httpx_post_json_factory()
    for c in chunks:
        result = call_ollama_chat(
            base_url=ollama_url,
            model=model,
            system_prompt=prompts.SYSTEM_PROMPT,
            user_prompt=prompts.build_user_prompt(c.text, chunk_idx=c.idx),
            post_json=post_json,
        )
        picks_per_chunk.append((c.idx, c.text, result.payload.get("picks", [])))

    deduped = reduce_picks(picks_per_chunk)
    outcome = apply_quality_gate(deduped)
    return {
        "episode_id": episode_id,
        "model": model,
        "chunks": len(chunks),
        "picks": outcome.kept,
        "dropped": outcome.dropped,
        "extraction_quality_score": outcome.episode_quality,
        "fail_ratio": outcome.fail_ratio,
        "needs_cloud_fallback": outcome.needs_cloud_fallback,
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Extract NFL betting picks from a podcast transcript.")
    p.add_argument("--transcript", required=True, help="Path to transcript .txt file")
    p.add_argument("--episode-id", default=None, help="Opaque episode identifier (string)")
    p.add_argument("--out", default=None, help="Write JSON here; default = stdout")
    p.add_argument(
        "--ollama-url",
        default=os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
    )
    p.add_argument("--model", default=os.environ.get("OLLAMA_MODEL", "qwen2.5:3b"))
    args = p.parse_args(argv)

    text = Path(args.transcript).read_text(encoding="utf-8")
    result = run(
        transcript=text,
        episode_id=args.episode_id,
        ollama_url=args.ollama_url,
        model=args.model,
    )
    payload = json.dumps(result, indent=2)
    if args.out:
        Path(args.out).write_text(payload, encoding="utf-8")
    else:
        sys.stdout.write(payload + "\n")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
