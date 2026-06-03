"""Thin Ollama HTTP client.

Two responsibilities:
  1. POST a chat completion to /api/chat and return parsed JSON
  2. Retry up to N times on JSON parse failure (the model can return prose
     when it gets confused; we re-prompt with a stricter instruction)

Network is injected via a ``post_json`` callable so tests can run without
hitting a real server.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Callable, Protocol


# Cold-loading qwen2.5:3b on M6 CPU can take ~30-60s on first call;
# qwen3:8b takes 90-180s. Override with OLLAMA_TIMEOUT env var (seconds).
# Default 600s is generous for either model on slower hosts.
_DEFAULT_OLLAMA_TIMEOUT = float(os.environ.get("OLLAMA_TIMEOUT", "600"))

from .schema import EXTRACTION_RESPONSE_SCHEMA

try:
    from jsonschema import Draft202012Validator
except ImportError:  # pragma: no cover - hard dep, but keep import safe
    Draft202012Validator = None  # type: ignore[assignment]


class PostJSON(Protocol):
    def __call__(self, url: str, body: dict, *, timeout: float) -> dict: ...


@dataclass(frozen=True)
class OllamaResult:
    payload: dict          # validated extraction payload {"picks": [...], "intel": [...]}
    raw_text: str          # raw assistant message content
    attempts: int          # how many tries it took


# Strip ```json ... ``` fences and surrounding prose if the model wrapped its
# response despite our instruction.
_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)


def _strip_to_json(text: str) -> str:
    text = text.strip()
    m = _FENCE_RE.search(text)
    if m:
        return m.group(1).strip()
    # Fall back: take from first '{' to last '}'.
    if "{" in text and "}" in text:
        return text[text.index("{") : text.rindex("}") + 1]
    return text


def _validate_payload(payload: dict) -> None:
    if Draft202012Validator is None:
        # Soft-validate: just require the shape we depend on downstream.
        if not isinstance(payload, dict) or "picks" not in payload:
            raise ValueError("payload missing 'picks'")
        if not isinstance(payload["picks"], list):
            raise ValueError("'picks' must be a list")
        return
    Draft202012Validator(EXTRACTION_RESPONSE_SCHEMA).validate(payload)


def call_ollama_chat(
    *,
    base_url: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    post_json: PostJSON,
    max_retries: int = 3,
    timeout: float = _DEFAULT_OLLAMA_TIMEOUT,
) -> OllamaResult:
    """Run a single chunk through Ollama. Raises on terminal failure."""
    body = {
        "model": model,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "options": {"temperature": 0.1, "num_ctx": 8192},
    }
    url = f"{base_url.rstrip('/')}/api/chat"

    last_err: Exception | None = None
    for attempt in range(1, max_retries + 1):
        resp = post_json(url, body, timeout=timeout)
        # Ollama chat shape: {"message": {"role": "assistant", "content": "..."}}.
        content = (resp.get("message") or {}).get("content", "")
        try:
            parsed = json.loads(_strip_to_json(content))
            _validate_payload(parsed)
            return OllamaResult(payload=parsed, raw_text=content, attempts=attempt)
        except Exception as err:  # noqa: BLE001 - parse/validation errors all retried
            last_err = err
            if attempt >= max_retries:
                break
            # Tighten the next prompt: stuff the failure back in.
            body["messages"] = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": content},
                {
                    "role": "user",
                    "content": (
                        f"Your last response was invalid JSON: {err}. "
                        f"Return ONLY valid JSON matching the schema. "
                        f"No markdown, no prose."
                    ),
                },
            ]
    raise RuntimeError(
        f"Ollama returned unparseable output after {max_retries} attempts: {last_err}"
    )


def httpx_post_json_factory() -> Callable[[str, dict], dict]:
    """Build a ``post_json`` backed by httpx. Imported lazily so tests stay offline."""
    import httpx  # noqa: WPS433

    client = httpx.Client(timeout=_DEFAULT_OLLAMA_TIMEOUT)

    def post_json(url: str, body: dict, *, timeout: float) -> dict:
        r = client.post(url, json=body, timeout=timeout)
        r.raise_for_status()
        return r.json()

    return post_json
