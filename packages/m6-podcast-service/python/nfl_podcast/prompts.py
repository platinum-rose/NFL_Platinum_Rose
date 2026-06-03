"""System prompt + few-shot examples for the extraction LLM.

Kept terse on purpose — small instruction-tuned models (qwen2.5:3b,
qwen3:8b) follow tight instructions better than fluffy ones. Few-shots
cover all 5 categories (spread / total / moneyline / future / prop) so
the model has at least one anchor per category.
"""

from __future__ import annotations

import json

SYSTEM_PROMPT = """\
You are an extractor that reads NFL betting podcast transcript chunks and
returns ONLY the explicit picks the host(s) made. Do NOT speculate or
include opinions, "leans", or "I might".

Return STRICT JSON with shape: {"picks": [...], "intel": ["..."]}.
- picks: every explicit bet, with the schema below
- intel: short factual bullets (injury, weather, role change) — no picks here

Pick categories:
- spread     team line (e.g. KC -3.5)
- total      OVER/UNDER on a game total (e.g. 47.5 OVER)
- moneyline  outright winner without points
- future     season-long market (division, MVP, win total, super bowl)
- prop       single-player stat market (rush_yds, receptions, anytime_td, etc.)

Confirmation phrases that signal a real pick:
"I'm taking", "give me", "lock", "play", "lay the points", "hammer",
"my pick is", "I'm on", "best bet", "I'll back", "fade".

If no picks are present in this chunk, return {"picks": [], "intel": [...]}.

Per-pick fields:
- category (enum above) — REQUIRED
- subject (team abbr, player name, or market name like "AFC_North") — REQUIRED
- subject_market (for futures/props: "rush_yds", "MVP", etc.; null otherwise)
- selection (team abbr, "OVER"/"UNDER", "YES"/"NO") — REQUIRED
- team1, team2 (game involved; null for futures with no game)
- line (numeric; null if not stated)
- odds_american (integer; null if not stated)
- summary (≤200 char rationale, single sentence)
- units (1–5; default 1 if not stated)
- confidence (0..1, your read of conviction)
- season, week, game_date (if stated; else null)
"""


_EXAMPLE_TRANSCRIPT_1 = (
    "...so I'm taking Kansas City minus three and a half against the Raiders "
    "this Sunday. Mahomes at home off a bye, Vegas pass rush is banged up "
    "with Crosby out — give me the Chiefs to cover. Two units."
)
_EXAMPLE_OUTPUT_1 = {
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
            "summary": "Mahomes home off bye; LV pass rush banged up (Crosby out)",
            "units": 2,
            "confidence": 0.75,
            "season": None,
            "week": None,
            "game_date": None,
        }
    ],
    "intel": ["LV: Maxx Crosby out (pass rush degraded)"],
}


_EXAMPLE_TRANSCRIPT_2 = (
    "Bills-Dolphins total opened at fifty, now down to forty-seven and a "
    "half — and with the wind forecast in Buffalo I'm hammering the under. "
    "Best bet of the week."
)
_EXAMPLE_OUTPUT_2 = {
    "picks": [
        {
            "category": "total",
            "subject": "BUF@MIA",
            "subject_market": None,
            "selection": "UNDER",
            "team1": "BUF",
            "team2": "MIA",
            "line": 47.5,
            "odds_american": None,
            "summary": "Wind in Buffalo; total down 2.5 from open. Best bet.",
            "units": 3,
            "confidence": 0.85,
            "season": None,
            "week": None,
            "game_date": None,
        }
    ],
    "intel": ["BUF wx: high wind expected"],
}


_EXAMPLE_TRANSCRIPT_3 = (
    "Lock it in: Lamar Jackson MVP at plus three hundred is my favorite "
    "future on the board. One unit."
)
_EXAMPLE_OUTPUT_3 = {
    "picks": [
        {
            "category": "future",
            "subject": "Lamar Jackson",
            "subject_market": "MVP",
            "selection": "Lamar Jackson",
            "team1": None,
            "team2": None,
            "line": None,
            "odds_american": 300,
            "summary": "Lamar +300 is host's favorite MVP future",
            "units": 1,
            "confidence": 0.7,
            "season": None,
            "week": None,
            "game_date": None,
        }
    ],
    "intel": [],
}


_EXAMPLE_TRANSCRIPT_4 = (
    "I'll back Saquon Barkley over seventy-two and a half rush yards "
    "against a Giants run defense allowing four point eight per carry."
)
_EXAMPLE_OUTPUT_4 = {
    "picks": [
        {
            "category": "prop",
            "subject": "Saquon Barkley",
            "subject_market": "rush_yds",
            "selection": "OVER",
            "team1": None,
            "team2": "NYG",
            "line": 72.5,
            "odds_american": None,
            "summary": "NYG run D allowing 4.8 ypc",
            "units": 1,
            "confidence": 0.65,
            "season": None,
            "week": None,
            "game_date": None,
        }
    ],
    "intel": ["NYG run defense: 4.8 ypc allowed"],
}


def build_user_prompt(chunk_text: str, *, chunk_idx: int) -> str:
    """Wrap a transcript chunk with explicit instructions + few-shot examples."""
    examples = "\n\n".join(
        f"### Example transcript:\n{t}\n\n### Example JSON:\n{json.dumps(o)}"
        for t, o in [
            (_EXAMPLE_TRANSCRIPT_1, _EXAMPLE_OUTPUT_1),
            (_EXAMPLE_TRANSCRIPT_2, _EXAMPLE_OUTPUT_2),
            (_EXAMPLE_TRANSCRIPT_3, _EXAMPLE_OUTPUT_3),
            (_EXAMPLE_TRANSCRIPT_4, _EXAMPLE_OUTPUT_4),
        ]
    )
    return (
        f"{examples}\n\n"
        f"### Chunk index: {chunk_idx}\n"
        f"### Transcript chunk:\n{chunk_text}\n\n"
        f"### JSON output (strict; no prose, no markdown fences):"
    )
