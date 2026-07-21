#!/usr/bin/env python3
"""
scripts/seed-nfl-rosters.py
─────────────────────────────────────────────────────────────────────────────
nfl-roster-refresh-audit-2026-07: upsert nflverse weekly roster data into
Supabase's public.nfl_rosters (migration 038).

Reads the CSV already downloaded by fetch_nflverse_data.py (does NOT fetch
over the network itself — same two-stage pattern as seed-historical-stats.py:
fetch script downloads, this script seeds). Run order:

  python scripts/fetch_nflverse_data.py --datasets rosters_weekly --years <season> --force
  python scripts/seed-nfl-rosters.py --seasons <season>

Usage:
  python scripts/seed-nfl-rosters.py --seasons 2026
  python scripts/seed-nfl-rosters.py --seasons 2026 --dry-run
  python scripts/seed-nfl-rosters.py --seasons 2024-2026

Env vars (from .env):
  SUPABASE_URL              (required)
  SUPABASE_SERVICE_ROLE_KEY (required)
"""

from __future__ import annotations

import argparse
import logging
import math
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / '.env')
except ImportError:
    pass

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
ROSTER_CSV = PROJECT_ROOT / "data" / "vault-seed" / "nflverse" / "rosters_weekly.csv"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger(__name__)

BATCH_SIZE = 100

# nflreadr weekly-roster column -> nfl_rosters column (only the subset this
# table tracks; see migration 038 for why the rest were left out).
COLUMN_MAP = {
    'season': 'season',
    'week': 'week',
    'game_type': 'game_type',
    'team': 'team',
    'gsis_id': 'gsis_id',
    'full_name': 'full_name',
    'first_name': 'first_name',
    'last_name': 'last_name',
    'position': 'position',
    'depth_chart_position': 'depth_chart_position',
    'jersey_number': 'jersey_number',
    'status': 'status',
    'status_description_abbr': 'status_description_abbr',
    'years_exp': 'years_exp',
    'espn_id': 'espn_id',
    'yahoo_id': 'yahoo_id',
    'sleeper_id': 'sleeper_id',
}

REQUIRED_SOURCE_COLS = {'season', 'week', 'team', 'full_name'}


def parse_seasons(raw: str) -> list[int]:
    raw = raw.strip()
    if '-' in raw:
        parts = raw.split('-')
        return list(range(int(parts[0]), int(parts[1]) + 1))
    return [int(raw)]


def _sanitize(row: dict) -> dict:
    """Replace NaN/Inf with None; cast whole-number floats to int (pandas
    upcasts int columns with any missing value to float64)."""
    out = {}
    for k, v in row.items():
        if isinstance(v, float):
            if not math.isfinite(v):
                out[k] = None
            elif v == int(v):
                out[k] = int(v)
            else:
                out[k] = v
        elif v is None or (isinstance(v, str) and v.strip() == ''):
            out[k] = None
        else:
            out[k] = v
    return out


def upsert_batch(client, rows: list[dict], dry_run: bool) -> tuple[int, int]:
    if not rows:
        return 0, 0
    ok = 0
    fail = 0
    conflict_cols = 'season,week,game_type,team,full_name,gsis_id'
    for i in range(0, len(rows), BATCH_SIZE):
        batch = [_sanitize(r) for r in rows[i:i + BATCH_SIZE]]
        if dry_run:
            log.info("[DRY RUN] Would upsert %d rows into nfl_rosters (batch %d)", len(batch), i // BATCH_SIZE)
            ok += len(batch)
            continue
        resp = client.table('nfl_rosters').upsert(batch, on_conflict=conflict_cols).execute()
        if hasattr(resp, 'error') and resp.error:
            log.error("Upsert failed batch starting at row %d: %s", i, resp.error)
            fail += len(batch)
        else:
            ok += len(batch)
    return ok, fail


def main() -> None:
    parser = argparse.ArgumentParser(description='Seed nflverse weekly roster data into Supabase nfl_rosters')
    parser.add_argument('--seasons', default=None, help='Season or range to seed, e.g. 2026 or 2024-2026. Default: all seasons present in the CSV.')
    parser.add_argument('--csv-path', default=None, help=f'Override roster CSV path (default: {ROSTER_CSV})')
    parser.add_argument('--dry-run', action='store_true', help='Print counts without writing to Supabase')
    args = parser.parse_args()

    csv_path = Path(args.csv_path) if args.csv_path else ROSTER_CSV
    if not csv_path.exists():
        log.error(
            "Roster CSV not found at %s — run first:\n"
            "  python scripts/fetch_nflverse_data.py --datasets rosters_weekly --years <season> --force",
            csv_path,
        )
        sys.exit(1)

    if not args.dry_run and (not SUPABASE_URL or not SUPABASE_KEY):
        log.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (or pass --dry-run)")
        sys.exit(1)

    import pandas as pd

    log.info("Reading %s", csv_path)
    df = pd.read_csv(csv_path)

    missing = REQUIRED_SOURCE_COLS - set(df.columns)
    if missing:
        log.error("Roster CSV missing required columns: %s — nflverse schema may have changed, check COLUMN_MAP", missing)
        sys.exit(1)

    if args.seasons:
        seasons = parse_seasons(args.seasons)
        before = len(df)
        df = df[df['season'].isin(seasons)]
        log.info("Filtered to seasons=%s: %d -> %d rows", seasons, before, len(df))

    if df.empty:
        log.warning("No rows to seed after filtering — nothing to do")
        return

    # Select + rename only the columns this table tracks. Missing source
    # columns (schema drift) become None rather than a hard failure, logged
    # once so it's visible without blocking the whole run.
    present_cols = [c for c in COLUMN_MAP if c in df.columns]
    absent_cols = [c for c in COLUMN_MAP if c not in df.columns]
    if absent_cols:
        log.warning("Source CSV missing expected columns (will be null): %s", absent_cols)

    sub = df[present_cols].rename(columns={c: COLUMN_MAP[c] for c in present_cols})
    for c in absent_cols:
        sub[COLUMN_MAP[c]] = None

    rows = [_sanitize(r) for r in sub.to_dict(orient='records')]

    # Drop rows with no usable identity at all (shouldn't happen given the
    # REQUIRED_SOURCE_COLS check above, but be defensive rather than upsert
    # garbage rows that would trip the unique constraint on nulls). Applied
    # AFTER _sanitize(), which turns pandas' NaN-for-empty-cell into real
    # None — checking truthiness on the raw pandas value is a trap:
    # bool(float('nan')) is True in Python, so an empty/no-team row would
    # silently pass this filter instead of being dropped (caught via a
    # synthetic dry-run test before this ever touched real Supabase data).
    before = len(rows)
    rows = [r for r in rows if r.get('team') and r.get('full_name')]
    if len(rows) != before:
        log.warning("Dropped %d rows missing team/full_name", before - len(rows))

    log.info("seed-nfl-rosters | rows=%d | dry_run=%s", len(rows), args.dry_run)

    client = None
    if not args.dry_run:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)

    ok, fail = upsert_batch(client, rows, args.dry_run)
    log.info("Roster upsert: %d OK, %d failed", ok, fail)

    if fail:
        sys.exit(1)


if __name__ == '__main__':
    main()
