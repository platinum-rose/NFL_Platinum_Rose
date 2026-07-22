#!/usr/bin/env python3
"""
scripts/seed-game-context.py
─────────────────────────────────────────────────────────────────────────────
S296 (Futures/Betting agent data-wiring, track 2): upsert rest/travel,
division-game flag, venue, referee, and closing-line context from nflverse's
schedules.csv onto the existing public.games rows (migration 039).

Reads the CSV already downloaded by fetch_nflverse_data.py (does NOT fetch
over the network itself — same two-stage pattern as seed-historical-stats.py
and seed-nfl-rosters.py). Run order:

  python scripts/fetch_nflverse_data.py --datasets schedules --years <season> --force
  python scripts/seed-game-context.py --seasons <season>

IMPORTANT — game_id is NOT a shared key across tables in this repo:
  - public.games.game_id            = "nfl_{season}_{seasonType}_w{WW}_{AWAY}_at_{HOME}"
  - public.game_odds_snapshots.game_id = "{season}_{WW}_{HOME}_{AWAY}"
  - nflverse schedules.csv game_id  = "{season}_{WW}_{AWAY}_{HOME}"
Three different formats. This script resolves each schedules.csv row to the
correct existing games.game_id by (season, week, home_abbrev, away_abbrev)
instead of trusting any game_id string match — team abbreviations are
normalized first since nflverse uses some historical/alternate codes (e.g.
"LA" for the Rams, "JAC" for the Jaguars) that don't match this repo's
canonical abbreviations (LAR, JAX, etc.).

Usage:
  python scripts/seed-game-context.py --seasons 2026
  python scripts/seed-game-context.py --seasons 2026 --dry-run
  python scripts/seed-game-context.py --seasons 2024-2026

Env vars (from .env):
  SUPABASE_URL              (required, unless --dry-run)
  SUPABASE_SERVICE_ROLE_KEY (required, unless --dry-run)
"""

from __future__ import annotations

import argparse
import logging
import math
import os
import sys
from datetime import datetime, timezone
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
SCHEDULES_CSV = PROJECT_ROOT / "data" / "vault-seed" / "nflverse" / "schedules.csv"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger(__name__)

# nflverse abbreviation -> this repo's canonical abbreviation (src/lib/teams.js).
# nflverse's modern schedules.csv mostly uses current codes but keeps a few
# historical/alternate ones; normalize defensively rather than assume.
ABBR_NORMALISE = {
    'LA':  'LAR',
    'STL': 'LAR',
    'SD':  'LAC',
    'OAK': 'LV',
    'JAC': 'JAX',
    'WSH': 'WAS',
}

CONTEXT_COLUMNS = [
    'away_rest', 'home_rest', 'div_game', 'roof', 'surface', 'referee',
    'temp', 'wind',
    'closing_spread_line', 'closing_total_line',
    'closing_home_moneyline', 'closing_away_moneyline',
]

SOURCE_TO_CONTEXT = {
    'away_rest': 'away_rest',
    'home_rest': 'home_rest',
    'div_game': 'div_game',
    'roof': 'roof',
    'surface': 'surface',
    'referee': 'referee',
    'temp': 'temp',
    'wind': 'wind',
    'spread_line': 'closing_spread_line',
    'total_line': 'closing_total_line',
    'home_moneyline': 'closing_home_moneyline',
    'away_moneyline': 'closing_away_moneyline',
}

REQUIRED_SOURCE_COLS = {'season', 'week', 'home_team', 'away_team'}


def normalise_abbr(abbr: str) -> str:
    return ABBR_NORMALISE.get(abbr, abbr)


def parse_seasons(raw: str) -> list[int]:
    raw = raw.strip()
    if '-' in raw:
        parts = raw.split('-')
        return list(range(int(parts[0]), int(parts[1]) + 1))
    return [int(raw)]


def _sanitize(row: dict) -> dict:
    """Replace NaN/Inf with None; cast whole-number floats to int (pandas
    upcasts int columns with any missing value to float64). Mirrors
    seed-nfl-rosters.py's fix for the bool(float('nan')) is True trap."""
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


def load_existing_games(client, seasons: list[int]) -> dict[tuple, str]:
    """Returns {(season, week, home_abbrev, away_abbrev): game_id} for the
    requested seasons, so each schedules.csv row can be resolved to the
    correct existing games.game_id without trusting any game_id string
    format match across tables."""
    resp = (
        client.table('games')
        .select('game_id,season,week,home_abbrev,away_abbrev')
        .in_('season', seasons)
        .execute()
    )
    rows = resp.data or []
    lookup = {}
    collisions = 0
    for r in rows:
        key = (r['season'], r['week'], r['home_abbrev'], r['away_abbrev'])
        if key in lookup and lookup[key] != r['game_id']:
            # Two different games rows share (season, week, home_abbrev, away_abbrev) —
            # this key intentionally omits season_type/game_type, so it can't tell a
            # regular-season game apart from a postseason placeholder row that happens
            # to reuse the same week number and (still-TBD-turned-real) team pairing.
            # Keep the FIRST match rather than silently overwriting with the second —
            # an update to the wrong game_id is worse than skipping an ambiguous one.
            collisions += 1
            log.warning(
                "Ambiguous games lookup key %s matches both %s and %s — keeping the first, "
                "skipping context for the rest (likely a regular-season/postseason-placeholder "
                "collision; season_type isn't part of this key)",
                key, lookup[key], r['game_id'],
            )
            continue
        lookup[key] = r['game_id']
    log.info("Loaded %d existing games rows for seasons=%s (%d ambiguous key collisions skipped)", len(rows), seasons, collisions)
    return lookup


def build_context_rows(df, game_lookup: dict[tuple, str]) -> tuple[list[dict], int]:
    """Resolve each schedules.csv row to an existing game_id and shape the
    context columns for upsert. Returns (rows, unmatched_count)."""
    rows = []
    unmatched = 0
    for rec in df.to_dict(orient='records'):
        rec = _sanitize(rec)
        season = rec.get('season')
        week = rec.get('week')
        home_abbr = normalise_abbr(str(rec.get('home_team', '')))
        away_abbr = normalise_abbr(str(rec.get('away_team', '')))
        key = (season, week, home_abbr, away_abbr)
        game_id = game_lookup.get(key)
        if not game_id:
            unmatched += 1
            continue

        row = {'game_id': game_id, 'context_updated_at': datetime.now(timezone.utc).isoformat()}
        for src_col, dest_col in SOURCE_TO_CONTEXT.items():
            row[dest_col] = rec.get(src_col)
        # div_game arrives as 0/1 from the CSV; cast to real boolean.
        if row.get('div_game') is not None:
            row['div_game'] = bool(row['div_game'])
        rows.append(row)
    return rows, unmatched


def update_batch(client, rows: list[dict], dry_run: bool) -> tuple[int, int]:
    """UPDATE only — never upsert/insert. Every row's game_id came from a live
    SELECT against an existing games row (see load_existing_games), so this
    must never create a new row. upsert() was tried first and is why this
    function exists: on at least one real run it fell through to a plain
    INSERT for a game_id whose ON CONFLICT target didn't fire as expected,
    which crashed on games' NOT NULL columns (season/week/home_team/...) that
    this script never sets, since it only ever intends to touch context
    columns on rows that already exist. A real per-row UPDATE ... WHERE
    game_id = ... can only ever affect 0 or 1 existing rows — it cannot insert."""
    if not rows:
        return 0, 0
    ok = 0
    fail = 0
    for i, row in enumerate(rows):
        game_id = row.pop('game_id')
        if dry_run:
            if i < 3 or i % 100 == 0:
                log.info("[DRY RUN] Would UPDATE games WHERE game_id=%s with %d context columns", game_id, len(row))
            ok += 1
            continue
        # Same success/failure convention as every other seed script in this repo
        # (resp.error is the authoritative signal) — not relying on resp.data
        # truthiness, since whether the client returns row representation by
        # default on .update() isn't something to assume without checking the
        # installed client version.
        resp = client.table('games').update(row).eq('game_id', game_id).execute()
        if hasattr(resp, 'error') and resp.error:
            log.error("Update failed for game_id=%s: %s", game_id, resp.error)
            fail += 1
        else:
            ok += 1
    return ok, fail


def main() -> None:
    parser = argparse.ArgumentParser(description='Seed rest/travel/referee/closing-line context onto public.games')
    parser.add_argument('--seasons', default=None, help='Season or range to seed, e.g. 2026 or 2024-2026. Default: all seasons present in the CSV.')
    parser.add_argument('--csv-path', default=None, help=f'Override schedules CSV path (default: {SCHEDULES_CSV})')
    parser.add_argument('--dry-run', action='store_true', help='Print counts without writing to Supabase (does not require SUPABASE_* env vars, but also cannot resolve real game_ids — reports parse/shape stats only)')
    args = parser.parse_args()

    csv_path = Path(args.csv_path) if args.csv_path else SCHEDULES_CSV
    if not csv_path.exists():
        log.error(
            "Schedules CSV not found at %s — run first:\n"
            "  python scripts/fetch_nflverse_data.py --datasets schedules --years <season> --force",
            csv_path,
        )
        sys.exit(1)

    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set — even --dry-run needs a read-only "
                   "connection to resolve existing games.game_id (there's no local copy of that table).")
        sys.exit(1)

    import pandas as pd
    from supabase import create_client

    log.info("Reading %s", csv_path)
    df = pd.read_csv(csv_path)

    missing = REQUIRED_SOURCE_COLS - set(df.columns)
    if missing:
        log.error("Schedules CSV missing required columns: %s — nflverse schema may have changed", missing)
        sys.exit(1)

    if args.seasons:
        seasons = parse_seasons(args.seasons)
        before = len(df)
        df = df[df['season'].isin(seasons)]
        log.info("Filtered to seasons=%s: %d -> %d rows", seasons, before, len(df))
    else:
        seasons = sorted(df['season'].unique().tolist())

    if df.empty:
        log.warning("No rows to seed after filtering — nothing to do")
        return

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    game_lookup = load_existing_games(client, seasons)

    rows, unmatched = build_context_rows(df, game_lookup)
    if unmatched:
        log.warning(
            "%d of %d schedules.csv rows had no matching games row (season/week/home/away tuple not found — "
            "likely a game schedule-ingest.js hasn't created yet, or a genuine abbreviation mismatch worth checking)",
            unmatched, len(df),
        )

    log.info("seed-game-context | rows=%d | unmatched=%d | dry_run=%s", len(rows), unmatched, args.dry_run)

    ok, fail = update_batch(client, rows, args.dry_run)
    log.info("Game context update: %d OK, %d failed", ok, fail)

    if fail:
        sys.exit(1)


if __name__ == '__main__':
    main()
