#!/usr/bin/env python3
"""
fetch_nflverse_data.py — Auto-download free nflverse CSVs into data/vault-seed/nflverse/

Datasets fetched:
  schedules              → schedules.csv   (all games incl. future, spread_line, total_line)
  games                  → games.csv       (completed games only — has final scores)
  player_stats_weekly    → player_stats_weekly.csv
  player_stats_seasonal  → player_stats_seasonal.csv
  team_stats             → team_stats.csv  (team-week aggregates from player_stats)
  ftn_charting           → ftn_charting.csv
  espn_data              → espn_data.csv   (ESPN QBR via import_qbr, weekly)

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
# Optional rich console — graceful degradation if not installed
# ---------------------------------------------------------------------------
try:
    from rich.console import Console
    from rich.table import Table

    _console = Console()
    _HAS_RICH = True
except ImportError:
    _console = None  # type: ignore[assignment]
    _HAS_RICH = False


def _log(msg: str, style: str = "") -> None:
    if _HAS_RICH:
        _console.print(f"  {msg}", style=style or "")
    else:
        # Strip any Rich markup tags for plain output
        import re
        clean = re.sub(r"\[/?[^\]]*\]", "", msg)
        print(f"  {clean}")


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

class _Cache:
    """Lazy cache so weekly_data isn't fetched twice."""

    def __init__(self, years: list[int]) -> None:
        self._years = years
        self._weekly: Any = None
        self._schedules: Any = None

    def weekly(self) -> "pd.DataFrame":  # noqa: F821
        if self._weekly is None:
            import nfl_data_py as nfl
            _log("[cyan]  (loading weekly player data — shared by player_stats + team_stats)[/cyan]")
            self._weekly = nfl.import_weekly_data(self._years)
        return self._weekly

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
    return cache.weekly()


def _fetch_player_stats_seasonal(years: list[int], cache: _Cache) -> "pd.DataFrame":
    import nfl_data_py as nfl
    return nfl.import_seasonal_data(years)


def _fetch_team_stats(years: list[int], cache: _Cache) -> "pd.DataFrame":
    """Aggregate weekly player stats to team-week level (sum of numeric cols)."""
    df = cache.weekly()
    group_cols = [c for c in ["season", "season_type", "week", "recent_team"] if c in df.columns]
    if not group_cols:
        return df
    numeric_cols = df.select_dtypes("number").columns.tolist()
    return df.groupby(group_cols, as_index=False)[numeric_cols].sum()


def _fetch_ftn_charting(years: list[int], cache: _Cache) -> "pd.DataFrame":
    import nfl_data_py as nfl
    return nfl.import_ftn_data(years)


def _fetch_espn_data(years: list[int], cache: _Cache) -> "pd.DataFrame":
    # nfl_data_py 0.3.x uses import_qbr (not import_espn_data).
    # frequency='weekly' gives one row per QB per game week.
    import nfl_data_py as nfl
    return nfl.import_qbr(years=years, level="nfl", frequency="weekly")


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
        "desc": "Team-week aggregates (numeric sums from player_stats_weekly)",
    },
    {
        "name": "ftn_charting",
        "file": "ftn_charting.csv",
        "fetch": _fetch_ftn_charting,
        "desc": "FTN charting: snap counts, targets, pass rush, blocking grades",
    },
    {
        "name": "espn_data",
        "file": "espn_data.csv",
        "fetch": _fetch_espn_data,
        "desc": "ESPN QBR (import_qbr, weekly) — qbr_total, pts_added, pressures",
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

    if _HAS_RICH:
        _console.rule("[bold cyan]nflverse data fetch[/bold cyan]")
    else:
        print("\n=== nflverse data fetch ===")

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
    if _HAS_RICH:
        tbl = Table(title="Fetch summary", show_header=True, header_style="bold magenta")
        tbl.add_column("Dataset", style="cyan", min_width=26)
        tbl.add_column("Status", min_width=10)
        tbl.add_column("Detail")
        _style_map = {"ok": "green", "skipped": "dim", "error": "red bold", "dry-run": "yellow"}
        for n, status, detail in results:
            s = _style_map.get(status, "white")
            tbl.add_row(n, f"[{s}]{status}[/{s}]", detail)
        _console.print(tbl)
    else:
        print(f"{'Dataset':<28} {'Status':<12} Detail")
        print("-" * 72)
        for n, status, detail in results:
            print(f"{n:<28} {status:<12} {detail}")

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
        parser.err