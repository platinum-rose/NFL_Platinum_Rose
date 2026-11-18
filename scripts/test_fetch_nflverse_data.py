"""Offline regression checks for public nflverse downloads; no live requests."""
import importlib.util
import io
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import pandas as pd

SPEC = importlib.util.spec_from_file_location("fetch_nflverse_data", Path(__file__).with_name("fetch_nflverse_data.py"))
FETCH = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(FETCH)


class PublicReleaseTests(unittest.TestCase):
    def test_weekly_download_does_not_require_archived_library(self):
        frame = pd.DataFrame({"season": [2026], "week": [7]})
        with tempfile.TemporaryDirectory() as directory, patch.object(FETCH, "OUTPUT_DIR", Path(directory)), patch.dict(sys.modules, {"nfl_data_py": None}), patch("pandas.read_parquet", return_value=frame):
            self.assertEqual(FETCH.run([2026], True, False, ["player_stats_weekly"], 7), 0)
            self.assertEqual(pd.read_csv(Path(directory) / "player_stats_weekly.csv").iloc[0]["week"], 7)

    def test_missing_parquet_engine_uses_equivalent_public_csv(self):
        with patch("pandas.read_parquet", side_effect=ImportError("no parquet engine")), patch("urllib.request.urlopen", return_value=io.BytesIO(b"season,week\n2026,7\n")) as request:
            frame = FETCH._fetch_player_stats_weekly([2026], FETCH._Cache([2026]))
            self.assertEqual(frame.iloc[0]["week"], 7)
            self.assertTrue(request.call_args.args[0].full_url.endswith("/stats_player/stats_player_week_2026.csv"))
            self.assertEqual(request.call_args.kwargs["timeout"], 30)

    def test_failed_current_year_preserves_last_good_cache(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "player_stats_weekly.csv"
            target.write_text("last good cache", encoding="utf-8")
            original_time = target.stat().st_mtime_ns
            with patch.object(FETCH, "OUTPUT_DIR", Path(directory)), patch.dict(sys.modules, {"nfl_data_py": None}), patch("pandas.read_parquet", side_effect=OSError("download failed")) as read:
                self.assertEqual(FETCH.run([2025, 2026], True, False, ["player_stats_weekly"], 7), 1)
                self.assertEqual(read.call_count, 1)
            self.assertEqual(target.read_text(encoding="utf-8"), "last good cache")
            self.assertEqual(target.stat().st_mtime_ns, original_time)

    def test_library_only_dataset_still_requires_its_dependency(self):
        with patch.dict(sys.modules, {"nfl_data_py": None}), patch("pandas.read_parquet") as read:
            self.assertEqual(FETCH.run([2026], True, False, ["snap_counts"], 7), 1)
            read.assert_not_called()


if __name__ == "__main__":
    unittest.main()
