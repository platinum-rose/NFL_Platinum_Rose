"""End-to-end test of the extract pipeline with a mocked Ollama."""
from __future__ import annotations

import json

from nfl_podcast import extract


SHORT_TRANSCRIPT = (
    "Welcome to the show. We have a stacked slate this week. "
    "I'm taking Kansas City minus three and a half against the Raiders. "
    "Mahomes is healthy and the Vegas pass rush is hurting. Two units. "
    "Switching gears: I'll back the under in Bills-Dolphins at forty-seven and a half. "
    "Wind is going to be a factor in Buffalo, give me UNDER. "
)


def make_post_json(canned_response: dict):
    def post_json(url, body, *, timeout):  # noqa: ARG001
        return {"message": {"role": "assistant", "content": json.dumps(canned_response)}}

    return post_json


def test_extract_run_end_to_end():
    canned = {
        "picks": [
            {
                "category": "spread",
                "subject": "KC",
                "subject_market": None,
                "selection": "KC",
                "team1": "KC",
                "team2": "LV",
                "line": -3.5,
                "odds_american": None,
                "summary": "Mahomes home; LV pass rush hurt",
                "units": 2,
                "confidence": 0.78,
            },
            {
                "category": "total",
                "subject": "BUF@MIA",
                "subject_market": None,
                "selection": "UNDER",
                "team1": "BUF",
                "team2": "MIA",
                "line": 47.5,
                "odds_american": None,
                "summary": "Wind in Buffalo",
                "units": 1,
                "confidence": 0.72,
            },
        ],
        "intel": ["LV pass rush degraded"],
    }
    result = extract.run(
        transcript=SHORT_TRANSCRIPT,
        episode_id=99,
        ollama_url="http://stub",
        model="qwen2.5:3b",
        post_json=make_post_json(canned),
    )
    assert result["episode_id"] == 99
    assert result["chunks"] >= 1
    # Both picks survive the gate (confirmation phrases present in transcript).
    assert len(result["picks"]) == 2
    assert result["needs_cloud_fallback"] is False
    assert 0.0 < result["extraction_quality_score"] <= 1.0
    cats = {p["category"] for p in result["picks"]}
    assert cats == {"spread", "total"}


def test_extract_run_triggers_fallback_on_low_quality():
    weak = {
        "picks": [
            {
                "category": "spread",
                "subject": "KC",
                "selection": "KC",
                "team1": "KC",
                "team2": "LV",
                "line": -3.5,
                "confidence": 0.42,
            }
        ],
        "intel": [],
    }
    # Transcript with no confirmation phrases.
    plain = "The Chiefs play the Raiders. Vegas has been struggling. The line is three and a half."
    result = extract.run(
        transcript=plain,
        episode_id=1,
        ollama_url="http://stub",
        model="qwen2.5:3b",
        post_json=make_post_json(weak),
    )
    assert result["needs_cloud_fallback"] is True
