#!/usr/bin/env python3
"""
scripts/derive_referee_tendencies.py
─────────────────────────────────────────────────────────────────────────────
S296 (Futures/Betting agent data-wiring, track 2): derive per-referee
historical tendencies (total-friendliness, penalty rate) and upsert into
Supabase's public.referee_tendencies (migration 040).

Data sources (both already downloaded by fetch_nflverse_data.py — no new
external dependency, no network call from this script):
  - data/vault-seed/nflverse/schedules.csv   — referee name + actual total
    points per game (result columns) per game_id
  - data/vault-seed/nflverse/team_stats.csv  — penalties/penalty_yards per
    team per game_id (two rows per game, one per team — summed here to get
    the combined per-game figure)

nflverse's own game_id ("{season}_{WW}_{away}_{home}") is consistent between
these two specific files since both come from the same nflverse release
family. This is NOT the same game_id format either public.games or
public.game_odds_snapshots use in this repo — see seed-game-context.py's
header for that landmine. This script never touches those tables at all
(referee_tendencies is a standalone aggregation table, keyed on referee name,
not game_id), so the mismatch doesn't matter here.

Run order:
  python scripts/fetch_nflverse_data.py --datasets schedules team_stats --years <range> --force
  python scripts/derive_referee_tendencies.py --seasons 2018-2025

Usage:
  python scripts/derive_referee_tendencies.py --seasons 2018-2025
  python scripts/derive_referee_tendencies.py --seasons 2018-2025 --dry-run
  python scripts/derive_referee_tendencies.py --seasons 2018-2025 --min-games 8

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
from collections import defaultdict
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
TEAM_STATS_CSV = PROJECT_ROOT / "data" / "vault-seed" / "nflverse" / "team_stats.csv"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger(__name__)

BATCH_SIZE = 100
DEFAULT_MIN_GAMES = 5  # below this, a "tendency" is mostly noise — still stored, but callers should treat with caution


def parse_seasons(raw: str) -> list[int]:
    raw = raw.strip()
    if '-' in raw:
        parts = raw.split('-')
        return list(range(int(parts[0]), int(parts[1]) + 1))
    return [int(raw)]


def _clean_num(v):
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


def derive_tendencies(schedules_df, team_stats_df, seasons: list[int], min_games: int) -> list[dict]:
    sched = schedules_df[schedules_df['season'].isin(seasons)].copy()
    sched = sched.dropna(subset=['referee'])

    # Sum penalties/penalty_yards per game_id across both teams.
    ts = team_stats_df[team_stats_df['season'].isin(seasons)]
    penalty_by_game = (
        ts.groupby('game_id')[['penalties', 'penalty_yards']]
        .sum(min_count=1)
        .to_dict(orient='index')
    )

    agg: dict[str, dict] = defaultdict(lambda: {
        'games': 0, 'seasons': set(),
        'total_points': [], 'total_penalties': [], 'total_penalty_yards': [],
        'home_wins': 0, 'decided_games': 0,
    })

    for rec in sched.to_dict(orient='records'):
        ref = str(rec.get('referee', '')).strip()
        if not ref:
            continue
        a = agg[ref]
        a['games'] += 1
        a['seasons'].add(int(rec['season']))

        total_pts = _clean_num(rec.get('total'))
        if total_pts is not None:
            a['total_points'].append(total_pts)

        game_id = rec.get('game_id')
        pen = penalty_by_game.get(game_id)
        if pen:
            p = _clean_num(pen.get('penalties'))
            py = _clean_num(pen.get('penalty_yards'))
            if p is not None:
                a['total_penalties'].append(p)
            if py is not None:
                a['total_penalty_yards'].append(py)

        home_score = _clean_num(rec.get('home_score'))
        away_score = _clean_num(rec.get('away_score'))
        if home_score is not None and away_score is not None and home_score != away_score:
            a['decided_games'] += 1
            if home_score > away_score:
                a['home_wins'] += 1

    def avg(xs):
        return round(sum(xs) / len(xs), 2) if xs else None

    rows = []
    for ref, a in agg.items():
        if a['games'] < min_games:
            continue
        rows.append({
            'referee': ref,
            'games_officiated': a['games'],
            'seasons': sorted(a['seasons']),
            'avg_total_points': avg(a['total_points']),
            'avg_total_penalties': avg(a['total_penalties']),
            'avg_penalty_yards': avg(a['total_penalty_yards']),
            'home_win_pct': round(a['home_wins'] / a['decided_games'], 4) if a['decided_games'] else None,
        })

    rows.sort(key=lambda r: -r['games_officiated'])
    return rows


def upsert_batch(client, rows: list[dict], dry_run: bool) -> tuple[int, int]:
    if not rows:
        return 0, 0
    ok = 0
    fail = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        if dry_run:
            log.info("[DRY RUN] Would upsert %d rows into referee_tendencies (batch %d)", len(batch), i // BATCH_SIZE)
            ok += len(batch)
            continue
        resp = client.table('referee_tendencies').upsert(batch, on_conflict='referee').execute()
        if hasattr(resp, 'error') and resp.error:
            log.error("Upsert failed batch starting at row %d: %s", i, resp.error)
            fail += len(batch)
        else:
            ok += len(batch)
    return ok, fail


def main() -> None:
    parser = argparse.ArgumentParser(description='Derive per-referee tendencies from nflverse data and seed referee_tendencies')
    parser.add_argument('--seasons', required=True, help='Season or range, e.g. 2018-2025')
    parser.add_argument('--min-games', type=int, default=DEFAULT_MIN_GAMES, help=f'Minimum games officiated to keep a row (default: {DEFAULT_MIN_GAMES})')
    parser.add_argument('--dry-run', action='store_true', help='Print counts without writing to Supabase')
    args = parser.parse_args()

    for path, label in ((SCHEDULES_CSV, 'schedules'), (TEAM_STATS_CSV, 'team_stats')):
        if not path.exists():
            log.error(
                "%s CSV not found at %s — run first:\n"
                "  python scripts/fetch_nflverse_data.py --datasets schedules team_stats --years <range> --force",
                label, path,
            )
            sys.exit(1)

    if not args.dry_run and (not SUPABASE_URL or not SUPABASE_KEY):
        log.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (or pass --dry-run)")
        sys.exit(1)

    import pandas as pd

    seasons = parse_seasons(args.seasons)
    log.info("Reading %s and %s for seasons=%s", SCHEDULES_CSV.name, TEAM_STATS_CSV.name, seasons)
    schedules_df = pd.read_csv(SCHEDULES_CSV)
    team_stats_df = pd.read_csv(TEAM_STATS_CSV)

    rows = derive_tendencies(schedules_df, team_stats_df, seasons, args.min_games)
    if not rows:
        log.warning("No referees met --min-games=%d for seasons=%s — nothing to do", args.min_games, seasons)
        return

    log.info("derive-referee-tendencies | referees=%d | dry_run=%s", len(rows), args.dry_run)
    for r in rows[:5]:
        log.info("  %-20s games=%-4d avg_total=%-6s avg_penalties=%-6s home_win_pct=%s",
                  r['referee'], r['games_officiated'], r['avg_total_points'], r['avg_total_penalties'], r['home_win_pct'])

    client = None
    if not args.dry_run:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)

    ok, fail = upsert_batch(client, rows, args.dry_run)
    log.info("Referee tendencies upsert: %d OK, %d failed", ok, fail)

    if fail:
        sys.exit(1)


if __name__ == '__main__':
    main()
