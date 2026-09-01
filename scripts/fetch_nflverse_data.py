#!/usr/bin/env python3
"""
fetch_nflverse_data.py — Auto-download free nflverse CSVs into data/vault-seed/nflverse/

Datasets fetched:
  schedules              → schedules.csv   (all games incl. future, spread_line, total_line)
  games                  → games.csv       (completed games only — has final scores)
  player_stats_weekly    → player_stats_weekly.csv
  player_stats_seasonal  → player_stats_seasonal.csv
  team_stats             → team_stats.csv  (team-week aggregates from nflverse stats_team release)
  ftn_charting           → ftn_charting.csv
  espn_data              → espn_data.csv   (ESPN QBR via import_qbr, weekly)
  snap_counts            → snap_counts.csv (per-player snap % — offense/defense/st)
  depth_charts           → depth_charts.csv (official weekly depth charts, all 32)

Usage:
  python scripts/fetch_nflverse_data.py
  python scripts/fetch_nflverse_data.py --years 2024 2025
  python scripts/fetch_nflverse_data.py --force
  python scripts/fetch_nflverse_data.py --dry-run
  python scripts/fetch_nflverse_data.py --datasets schedules games ftn_charting

Requirements:
  pip install nfl_data_py pandas rich
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Output directory (relative to this script's location: scripts/ → project root)
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "data" / "vault-seed" / "nflverse"

DEFAULT_YEARS: list[int] = [2022, 2023, 2024, 2025]
FRESHNESS_DAYS: int = 7  # skip re-download if file modified within this many days

# ---------------------------------------------------------------------------
# Console output — plain print(), no rich dependency for reliability
# ---------------------------------------------------------------------------
import re as _re

def _log(msg: str, style: str = "") -> None:
    """Print a log line, stripping any Rich markup tags."""
    clean = _re.sub(r"\[/?[^\]]*\]", "", msg)
    print(f"  {clean}", flush=True)


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def _is_fresh(path: Path, days: int) -> bool:
    """Return True if file exists and was modified within `days` days."""
    if not path.exists():
        return False
    age = datetime.now(timezone.utc) - datetime.fromtimestamp(
        path.stat().st_mtime, tz=timezone.utc
    )
    return age < timedelta(days=days)


def _age_hours(path: Path) -> int:
    delta = datetime.now(timezone.utc) - datetime.fromtimestamp(
        path.stat().st_mtime, tz=timezone.utc
    )
    return int(delta.total_seconds() / 3600)


def _save_csv(df: "pd.DataFrame", path: Path, label: str) -> None:  # noqa: F821
    df.to_csv(path, index=False)
    rows, cols = len(df), len(df.columns)
    _log(f"[green]✓[/green] {label} → {path.name}  ({rows:,} rows × {cols} cols)")


# ---------------------------------------------------------------------------
# Per-dataset fetch functions
# Each receives the year list and the shared _Cache; returns a DataFrame.
# ---------------------------------------------------------------------------

# nfl_data_py 0.3.3 is archived (Sep 2025). The old `player_stats` release tag
# on nflverse-data is gone (HTTP 404). The successor library nflreadpy uses:
#   stats_player/stats_player_week_{year}.parquet   — weekly player stats
#   stats_player/stats_player_reg_{year}.parquet    — regular-season totals
#   stats_team/stats_team_week_{year}.parquet       — weekly team aggregates
_NFLVERSE_BASE = (
    "https://github.com/nflverse/nflverse-data/releases/download"
)


def _read_parquets(url_tmpl: str, years: list[int], label: str) -> "pd.DataFrame":  # noqa: F821
    """Download one parquet per year and concat; skip years that 404."""
    import pandas as pd
    frames = []
    for yr in years:
        url = url_tmpl.format(yr)
        try:
            frames.append(pd.read_parquet(url))
        except Exception as exc:
            _log(f"[yellow]  ↷  {label} {yr} skipped — {str(exc)[:80]}[/yellow]")
    if not frames:
        raise RuntimeError(f"No data fetched for {label} — all years failed")
    return pd.concat(frames, ignore_index=True)


class _Cache:
    """Lazy cache for shared downloads (schedules; weekly is now direct-download)."""

    def __init__(self, years: list[int]) -> None:
        self._years = years
        self._schedules: Any = None

    def schedules(self) -> "pd.DataFrame":  # noqa: F821
        if self._schedules is None:
            import nfl_data_py as nfl
            self._schedules = nfl.import_schedules(self._years)
        return self._schedules


def _fetch_schedules(years: list[int], cache: _Cache) -> "pd.DataFrame":
    return cache.schedules()


def _fetch_games(years: list[int], cache: _Cache) -> "pd.DataFrame":
    df = cache.schedules()
    return df[df["home_score"].notna()].copy()


def _fetch_player_stats_weekly(years: list[int], cache: _Cache) -> "pd.DataFrame":
    """Weekly player stats — new stats_player release tag (replaces old player_stats tag)."""
    return _read_parquets(
        f"{_NFLVERSE_BASE}/stats_player/stats_player_week_{{0}}.parquet",
        years,
        "player_stats_weekly",
    )


def _fetch_player_stats_seasonal(years: list[int], cache: _Cache) -> "pd.DataFrame":
    """Regular-season totals — stats_player_reg (replaces import_seasonal_data)."""
    return _read_parquets(
        f"{_NFLVERSE_BASE}/stats_player/stats_player_reg_{{0}}.parquet",
        years,
        "player_stats_seasonal",
    )


def _fetch_team_stats(years: list[int], cache: _Cache) -> "pd.DataFrame":
    """Weekly team aggregates — dedicated stats_team release (no longer derived from player_stats)."""
    return _read_parquets(
        f"{_NFLVERSE_BASE}/stats_team/stats_team_week_{{0}}.parquet",
        years,
        "team_stats",
    )


def _fetch_ftn_charting(years: list[int], cache: _Cache) -> "pd.DataFrame":
    import nfl_data_py as nfl
    return nfl.import_ftn_data(years)


def _fetch_pbp_team_join(years: list[int], cache: _Cache) -> "pd.DataFrame":
    # 2026-09-01: ftn_charting.csv is deliberately play-level with no team
    # column (see its own DATASETS desc) -- FTN charts a play by
    # nflverse_game_id/nflverse_play_id only. To aggregate its motion/play-
    # action/no-huddle/blitz fields per team (the point of pulling this at
    # all -- team_analytic_snapshots.{motion_rate,play_action_rate,
    # no_huddle_rate} exist in the schema, migration 044, but have sat null
    # since that table was created; see build-team-analytics-snapshots.js's
    # own comment on why), something needs to answer "which team was on
    # offense/defense for this game_id+play_id". The full nflverse PBP
    # dataset (import_pbp_data) has that, but it's ~400 columns and would
    # bloat this folder for no reason -- this fetcher pulls only the 6
    # join-relevant columns and discards the rest before saving.
    import nfl_data_py as nfl
    df = nfl.import_pbp_data(years, downcast=True, cache=False)
    keep = ["game_id", "play_id", "posteam", "defteam", "season", "week"]
    return df[keep].dropna(subset=["game_id", "play_id"])


def _fetch_snap_counts(years: list[int], cache: _Cache) -> "pd.DataFrame":
    # Expansion C: prior-season snap % per player — the truest "who actually
    # plays" signal; quantifies backup dropoff for roster-depth theses.
    import nfl_data_py as nfl
    return nfl.import_snap_counts(years)


def _fetch_depth_charts(years: list[int], cache: _Cache) -> "pd.DataFrame":
    # Expansion C: official weekly depth charts (all 32 teams) — authoritative
    # depth order, replacing the sprint's manual confirmation for free.
    import nfl_data_py as nfl
    return nfl.import_depth_charts(years)


def _fetch_espn_data(years: list[int], cache: _Cache) -> "pd.DataFrame":
    # nfl_data_py 0.3.x uses import_qbr (not import_espn_data).
    # frequency='weekly' gives one row per QB per game week.
    import nfl_data_py as nfl
    return nfl.import_qbr(years=years, level="nfl", frequency="weekly")


def _fetch_rosters_weekly(years: list[int], cache: _Cache) -> "pd.DataFrame":
    # nfl-roster-refresh-audit-2026-07: week-level rosters (team, position,
    # status, gsis_id per player per week) — dedicated `weekly_rosters`
    # release tag, same repo/pattern as the stats_* fetches above. Confirmed
    # live 2026-07-21: roster_weekly_2026.parquet last updated 2026-07-09,
    # i.e. this gets refreshed during the season/offseason, not just once a
    # year like the rest of this script's default cadence — that's *why*
    # this dataset needs its own weekly GH Actions workflow
    # (nfl-roster-refresh.yml) rather than riding along on this script's
    # annual schedule.
    return _read_parquets(
        f"{_NFLVERSE_BASE}/weekly_rosters/roster_weekly_{{0}}.parquet",
        years,
        "rosters_weekly",
    )


# ---------------------------------------------------------------------------
# Dataset registry
# ---------------------------------------------------------------------------

DATASETS: list[dict] = [
    {
        "name": "schedules",
        "file": "schedules.csv",
        "fetch": _fetch_schedules,
        "desc": "Full schedule + results (spread_line, total_line, div_game, roof, etc.)",
    },
    {
        "name": "games",
        "file": "games.csv",
        "fetch": _fetch_games,
        "desc": "Completed games only — final scores, actual results",
    },
    {
        "name": "player_stats_weekly",
        "file": "player_stats_weekly.csv",
        "fetch": _fetch_player_stats_weekly,
        "desc": "Week-level player stats: passing / rushing / receiving",
    },
    {
        "name": "player_stats_seasonal",
        "file": "player_stats_seasonal.csv",
        "fetch": _fetch_player_stats_seasonal,
        "desc": "Season-total player stats",
    },
    {
        "name": "team_stats",
        "file": "team_stats.csv",
        "fetch": _fetch_team_stats,
        "desc": "Team-week aggregates (nflverse stats_team release)",
    },
    {
        "name": "ftn_charting",
        "file": "ftn_charting.csv",
        "fetch": _fetch_ftn_charting,
        "desc": "FTN charting: snap counts, targets, pass rush, blocking grades",
    },
    {
        "name": "pbp_team_join",
        "file": "pbp_team_join.csv",
        "fetch": _fetch_pbp_team_join,
        "desc": "game_id/play_id -> posteam/defteam only -- join key for aggregating ftn_charting.csv by team",
    },
    {
        "name": "espn_data",
        "file": "espn_data.csv",
        "fetch": _fetch_espn_data,
        "desc": "ESPN QBR (import_qbr, weekly) — qbr_total, pts_added, pressures",
    },
    {
        "name": "snap_counts",
        "file": "snap_counts.csv",
        "fetch": _fetch_snap_counts,
        "desc": "Per-player snap counts/% (offense/defense/st) — roster depth truth",
    },
    {
        "name": "depth_charts",
        "file": "depth_charts.csv",
        "fetch": _fetch_depth_charts,
        "desc": "Official weekly depth charts, all 32 teams (import_depth_charts)",
    },
    {
        "name": "rosters_weekly",
        "file": "rosters_weekly.csv",
        "fetch": _fetch_rosters_weekly,
        "desc": "Week-level rosters: team/position/status/gsis_id per player (nfl-roster-refresh-audit-2026-07)",
    },
]

DATASET_NAMES = [d["name"] for d in DATASETS]


# ---------------------------------------------------------------------------
# Core runner
# ---------------------------------------------------------------------------

def run(
    years: list[int],
    force: bool,
    dry_run: bool,
    selected_names: list[str],
    freshness_days: int,
) -> int:
    try:
        import nfl_data_py  # noqa: F401
    except ImportError:
        print("ERROR: nfl_data_py not installed.")
        print("       pip install nfl_data_py pandas rich")
        return 1

    try:
        import pandas  # noqa: F401
    except ImportError:
        print("ERROR: pandas not installed.  pip install pandas")
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    selected = [d for d in DATASETS if not selected_names or d["name"] in selected_names]

    print("\n=== nflverse data fetch ===", flush=True)

    _log(f"Years:       {years}")
    _log(f"Output dir:  {OUTPUT_DIR}")
    _log(f"Fresh gate:  {freshness_days} days  (--force={force})")
    _log(f"Datasets:    {[d['name'] for d in selected]}")
    print()

    cache = _Cache(years)
    results: list[tuple[str, str, str]] = []
    errors: list[tuple[str, str]] = []

    for ds in selected:
        name: str = ds["name"]
        path: Path = OUTPUT_DIR / ds["file"]

        # Freshness gate
        if not force and _is_fresh(path, freshness_days):
            age_h = _age_hours(path)
            _log(f"[dim]↷  {name:<28} fresh ({age_h}h old) — skipping[/dim]")
            results.append((name, "skipped", f"fresh ({age_h}h old)"))
            continue

        if dry_run:
            _log(f"[yellow]○  {name:<28}[/yellow] {ds['desc']}")
            results.append((name, "dry-run", ds["desc"]))
            continue

        _log(f"[cyan]↓  {name:<28}[/cyan] {ds['desc']}")
        try:
            df = ds["fetch"](years, cache)
            _save_csv(df, path, name)
            results.append((name, "ok", f"{len(df):,} rows"))
        except Exception as exc:
            short = str(exc)[:100]
            _log(f"[red]✗  {name}  ERROR: {short}[/red]")
            errors.append((name, str(exc)))
            results.append((name, "error", short))

    # Summary
    print()
    print(f"{'Dataset':<28} {'Status':<12} Detail", flush=True)
    print("-" * 72, flush=True)
    for n, status, detail in results:
        print(f"{n:<28} {status:<12} {detail}", flush=True)

    ok_count = sum(1 for _, s, _ in results if s == "ok")
    skip_count = sum(1 for _, s, _ in results if s == "skipped")
    err_count = len(errors)
    print()
    _log(f"Done — {ok_count} downloaded, {skip_count} skipped, {err_count} errors.")

    if errors:
        print()
        for name, msg in errors:
            _log(f"[red]✗ {name}:[/red] {msg}")
        return 1

    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download free nflverse CSVs into data/vault-seed/nflverse/",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--years", nargs="+", type=int, default=DEFAULT_YEARS,
        metavar="YEAR",
        help=f"Seasons to fetch (default: {DEFAULT_YEARS})",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Re-download even if files are within the freshness window",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be fetched without downloading anything",
    )
    parser.add_argument(
        "--datasets", nargs="+", default=[], dest="datasets",
        metavar="NAME",
        help=f"Fetch only these datasets. Choices: {DATASET_NAMES}",
    )
    parser.add_argument(
        "--freshness-days", type=int, default=FRESHNESS_DAYS,
        dest="freshness_days",
        metavar="N",
        help=f"Re-download if file is older than N days (default: {FRESHNESS_DAYS})",
    )
    parser.add_argument(
        "--out-dir", type=Path, default=None,
        dest="out_dir",
        metavar="DIR",
        help="Override output directory (default: <project_root>/data/vault-seed/nflverse/)",
    )

    args = parser.parse_args()

    # Allow --out-dir override
    if args.out_dir:
        global OUTPUT_DIR
        OUTPUT_DIR = args.out_dir.resolve()

    # Validate --datasets
    invalid = [n for n in args.datasets if n not in DATASET_NAMES]
    if invalid:
        parser.error(f"Unknown dataset(s): {invalid}. Choose from: {DATASET_NAMES}")

    sys.exit(run(args.years, args.force, args.dry_run, args.datasets, args.freshness_days))


if __name__ == "__main__":
    main()
