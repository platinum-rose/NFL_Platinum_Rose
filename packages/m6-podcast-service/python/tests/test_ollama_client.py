import json

import pytest

from nfl_podcast.ollama_client import call_ollama_chat


def _make_post(responses):
    """responses: list of strings to be returned as message.content."""
    calls = {"n": 0}

    def post_json(url, body, *, timeout):
        i = calls["n"]
        calls["n"] += 1
        return {"message": {"role": "assistant", "content": responses[i]}}

    return post_json, calls


def test_call_ollama_chat_parses_first_try():
    payload = {"picks": [], "intel": []}
    post, calls = _make_post([json.dumps(payload)])
    result = call_ollama_chat(
        base_url="http://x",
        model="qwen2.5:3b",
        system_prompt="sys",
        user_prompt="usr",
        post_json=post,
    )
    assert result.attempts == 1
    assert result.payload == payload
    assert calls["n"] == 1


def test_call_ollama_chat_strips_fences():
    payload = {"picks": [], "intel": ["wind"]}
    fenced = f"Here you go:\n```json\n{json.dumps(payload)}\n```"
    post, _ = _make_post([fenced])
    result = call_ollama_chat(
        base_url="http://x",
        model="qwen2.5:3b",
        system_prompt="s",
        user_prompt="u",
        post_json=post,
    )
    assert result.payload == payload


def test_call_ollama_chat_retries_then_succeeds():
    payload = {"picks": [], "intel": []}
    post, calls = _make_post(["not json", json.dumps(payload)])
    result = call_ollama_chat(
        base_url="http://x",
        model="qwen2.5:3b",
        system_prompt="s",
        user_prompt="u",
        post_json=post,
        max_retries=3,
    )
    assert result.attempts == 2
    assert calls["n"] == 2


def test_call_ollama_chat_terminal_failure():
    post, calls = _make_post(["nope", "still bad", "no good"])
    with pytest.raises(RuntimeError):
        call_ollama_chat(
            base_url="http://x",
            model="qwen2.5:3b",
            system_prompt="s",
            user_prompt="u",
            post_json=post,
            max_retries=3,
        )
    assert calls["n"] == 3


def test_call_ollama_chat_validates_picks_is_list():
    bad = {"picks": "not a list"}
    post, _ = _make_post([json.dumps(bad), json.dumps({"picks": []})])
    result = call_ollama_chat(
        base_url="http://x",
        model="qwen2.5:3b",
        system_prompt="s",
        user_prompt="u",
        post_json=post,
    )
    assert result.attempts == 2
