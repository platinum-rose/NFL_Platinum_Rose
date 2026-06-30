"""Tests for nfl_podcast.vault_note."""
from __future__ import annotations

import json
import re

import pytest

from nfl_podcast import vault_note as vn


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

PICKS = [
    {
        "category": "spread",
        "subject": "KC",
        "selection": "KC",
        "team1": "KC",
        "team2": "LV",
        "line": -3.5,
        "odds_american": None,
        "summary": "Mahomes home off bye; LV pass rush banged up",
        "units": 2,
        "confidence": 0.75,
        "speaker": "Seth Woolcock",
    },
    {
        "category": "future",
        "subject": "Lamar Jackson",
        "subject_market": "MVP",
        "selection": "Lamar Jackson",
        "odds_american": 300,
        "summary": "Lamar +300 MVP value",
        "units": 1,
        "confidence": 0.7,
        "speaker": "Andrew Erickson",
    },
]

INTEL = [
    "LV: Maxx Crosby questionable (knee)",
    {
        "speaker": "Andrew Erickson",
        "category": "injury",
        "point": "CMC listed limited — monitor through Thursday",
    },
]

SEGMENTS = [
    {"start": 0.0, "speaker": "Seth Woolcock", "text": "Welcome to the show."},
    {"start": 28.5, "speaker": "Seth Woolcock", "text": "I'm taking Kansas City here."},
    {"start": 90.0, "speaker": "Andrew Erickson", "text": "For me it's Lamar MVP."},
    {"start": 95.0, "speaker": "Andrew Erickson", "text": "Great value at plus three."},
    {"start": 180.0, "speaker": "Seth Woolcock", "text": "Back to the spread market."},
]


# ---------------------------------------------------------------------------
# build_vault_note — path
# ---------------------------------------------------------------------------

class TestBuildVaultNotePath:
    def _build(self, **kwargs):
        defaults = dict(
            show_name="BettingPros Podcast",
            episode_number=1011,
            pub_date="2026-06-25",
            hosts=["Seth Woolcock", "Andrew Erickson"],
            duration_str="57m 20s",
            picks=PICKS,
            intel=INTEL,
            segments=SEGMENTS,
            model_info="whisperx/large-v3-turbo + qwen3:8b",
        )
        defaults.update(kwargs)
        return vn.build_vault_note(**defaults)

    def test_path_convention(self):
        path, _ = self._build()
        assert path == "NFL/Podcasts/BettingPros Podcast/2026-06-25-E1011.md"

    def test_path_uses_pub_date_not_generated(self):
        path, _ = self._build(pub_date="2025-12-31", episode_number=999)
        assert "2025-12-31-E999" in path


# ---------------------------------------------------------------------------
# build_vault_note — frontmatter
# ---------------------------------------------------------------------------

class TestBuildVaultNoteFrontmatter:
    def _build(self, **kwargs):
        defaults = dict(
            show_name="BettingPros Podcast",
            episode_number=1011,
            pub_date="2026-06-25",
            hosts=["Seth Woolcock", "Andrew Erickson"],
            duration_str="57m 20s",
            picks=PICKS,
            intel=INTEL,
            segments=SEGMENTS,
            model_info="whisperx/large-v3-turbo + qwen3:8b",
        )
        defaults.update(kwargs)
        _, md = vn.build_vault_note(**defaults)
        return md

    def test_sensitivity_green(self):
        md = self._build()
        assert "sensitivity: green" in md

    def test_source_is_show_name(self):
        md = self._build()
        assert "source: BettingPros Podcast" in md

    def test_episode_number(self):
        md = self._build()
        assert "episode: 1011" in md

    def test_hosts_in_yaml(self):
        md = self._build()
        assert "  - Seth Woolcock" in md
        assert "  - Andrew Erickson" in md

    def test_picks_count(self):
        md = self._build()
        assert f"picks_count: {len(PICKS)}" in md

    def test_intel_count(self):
        md = self._build()
        assert f"intel_count: {len(INTEL)}" in md

    def test_generated_iso_timestamp(self):
        md = self._build()
        # e.g. generated: 2026-06-30T14:22:00+00:00
        assert re.search(r"generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", md)


# ---------------------------------------------------------------------------
# build_vault_note — picks table
# ---------------------------------------------------------------------------

class TestBuildVaultNotePicksTable:
    def _md(self, picks=PICKS, **kwargs):
        defaults = dict(
            show_name="BettingPros Podcast",
            episode_number=1011,
            pub_date="2026-06-25",
            hosts=["Seth Woolcock"],
            duration_str="60m",
            intel=[],
            segments=[],
            model_info="test",
        )
        defaults.update(kwargs)
        _, md = vn.build_vault_note(picks=picks, **defaults)
        return md

    def test_picks_header_present(self):
        md = self._md()
        assert "## Picks" in md
        assert "| Market | Selection | Odds | Speaker | Summary |" in md

    def test_spread_pick_row(self):
        md = self._md()
        assert "Seth Woolcock" in md
        assert "KC" in md

    def test_future_pick_odds_formatted(self):
        md = self._md()
        # +300 should be formatted with leading +
        assert "+300" in md

    def test_negative_odds_no_plus(self):
        picks = [{"category": "spread", "selection": "KC", "odds_american": -110,
                  "summary": "test", "speaker": "Host"}]
        md = self._md(picks=picks)
        assert "-110" in md
        assert "+-110" not in md

    def test_no_picks_fallback_row(self):
        md = self._md(picks=[])
        assert "No picks extracted" in md


# ---------------------------------------------------------------------------
# build_vault_note — intel bullets
# ---------------------------------------------------------------------------

class TestBuildVaultNoteIntel:
    def _md(self, intel=INTEL, **kwargs):
        defaults = dict(
            show_name="BettingPros Podcast",
            episode_number=1011,
            pub_date="2026-06-25",
            hosts=["Seth Woolcock"],
            duration_str="60m",
            picks=[],
            segments=[],
            model_info="test",
        )
        defaults.update(kwargs)
        _, md = vn.build_vault_note(intel=intel, **defaults)
        return md

    def test_string_intel_as_bullet(self):
        md = self._md()
        assert "- LV: Maxx Crosby questionable (knee)" in md

    def test_dict_intel_with_attribution(self):
        md = self._md()
        assert "**[Andrew Erickson · injury]**" in md
        assert "CMC listed limited" in md

    def test_no_intel_fallback(self):
        md = self._md(intel=[])
        assert "_No intel items._" in md


# ---------------------------------------------------------------------------
# build_vault_note — transcript index
# ---------------------------------------------------------------------------

class TestBuildTranscriptIndex:
    def test_collapses_consecutive_same_speaker(self):
        # Seth appears twice consecutively — only first row should appear
        rows = vn._build_transcript_index(SEGMENTS)
        # Seth at 0:00, Andrew at 1:30, Seth at 3:00 = 3 rows (not 5)
        assert rows.count("Seth Woolcock") == 2
        assert rows.count("Andrew Erickson") == 1

    def test_time_format(self):
        rows = vn._build_transcript_index(SEGMENTS)
        assert "0:00" in rows
        assert "1:30" in rows  # 90s

    def test_max_rows_respected(self):
        segs = [{"start": i * 10.0, "speaker": f"S{i}", "text": "text"} for i in range(100)]
        rows = vn._build_transcript_index(segs, max_rows=5)
        assert rows.count("|") // 3 <= 5 + 1  # header-less, each row has 3 pipes

    def test_empty_segments_fallback(self):
        rows = vn._build_transcript_index([])
        assert "No diarized segments" in rows

    def test_text_truncated_at_80_chars(self):
        long_text = "x" * 200
        segs = [{"start": 0.0, "speaker": "Host", "text": long_text}]
        rows = vn._build_transcript_index(segs)
        # Row contains at most 80 chars of the text + "..."
        assert long_text[80:] not in rows


# ---------------------------------------------------------------------------
# upsert_vault_note
# ---------------------------------------------------------------------------

class TestUpsertVaultNote:
    def _call(self, captured: list, **kwargs):
        def fake_post(url, body, *, headers, timeout):
            captured.append({"url": url, "body": body, "headers": headers})
            return [{"id": 1, "path": body["path"]}]

        defaults = dict(
            supabase_url="https://example.supabase.co",
            supabase_key="test-key",
            vault_path="NFL/Podcasts/BettingPros Podcast/2026-06-25-E1011.md",
            content="# Test",
            episode_id=1011,
            post_json=fake_post,
        )
        defaults.update(kwargs)
        result = vn.upsert_vault_note(**defaults)
        return result

    def test_correct_url(self):
        cap: list = []
        self._call(cap)
        assert cap[0]["url"] == "https://example.supabase.co/rest/v1/vault_notes"

    def test_source_is_agent(self):
        """Must satisfy CHECK constraint: source in ('manual','obsidian_sync','agent')."""
        cap: list = []
        self._call(cap)
        assert cap[0]["body"]["source"] == "agent"

    def test_path_in_payload(self):
        cap: list = []
        self._call(cap)
        assert cap[0]["body"]["path"] == "NFL/Podcasts/BettingPros Podcast/2026-06-25-E1011.md"

    def test_episode_id_in_tags(self):
        cap: list = []
        self._call(cap)
        tags = cap[0]["body"]["tags"]
        assert "episode:1011" in tags

    def test_podcast_tag_always_present(self):
        cap: list = []
        self._call(cap)
        tags = cap[0]["body"]["tags"]
        assert "podcast" in tags

    def test_extra_tags_merged(self):
        cap: list = []
        self._call(cap, tags=["nfl", "futures"])
        tags = cap[0]["body"]["tags"]
        assert "nfl" in tags
        assert "futures" in tags
        assert "episode:1011" in tags

    def test_prefer_header_set(self):
        cap: list = []
        self._call(cap)
        assert "merge-duplicates" in cap[0]["headers"]["Prefer"]

    def test_auth_headers_present(self):
        cap: list = []
        self._call(cap, supabase_key="sk-test")
        h = cap[0]["headers"]
        assert h["apikey"] == "sk-test"
        assert "Bearer sk-test" in h["Authorization"]

    def test_no_episode_id_column_in_payload(self):
        """episode_id must NOT be a top-level payload key (column doesn't exist in schema)."""
        cap: list = []
        self._call(cap)
        assert "episode_id" not in cap[0]["body"]

    def test_returns_response(self):
        cap: list = []
        result = self._call(cap)
        assert isinstance(result, list)
        assert result[0]["id"] == 1
