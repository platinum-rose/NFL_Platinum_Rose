#!/usr/bin/env python3
"""
scripts/seed-historical-stats.py
─────────────────────────────────────────────────────────────────────────────
F-15: Seed historical NFL team + player stats into Supabase.

Data source: nfl-data-py  (wraps nflfastR hosted on GitHub — no API key)
Targets:
  public.nfl_team_season_stats   — season record + EPA + ATS (from odds join)
  public.nfl_player_season_stats — QB/RB/WR/TE season aggregates

Usage:
  python scripts/seed-historical-stats.py [--seasons 2020-2024] [--dry-run]
  python scripts/seed-historical-stats.py --seasons 2024 --positions QB

Env vars (from .env):
  SUPABASE_URL              (required)
  SUPABASE_SERVICE_ROLE_KEY (required)
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

# ── Environment setup ─────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / '.env')
except ImportError:
    pass  # python-dotenv optional; user may export vars manually

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# ── Imports that may need to be installed ─────────────────────────────────────
def _require(pkg: str, import_name: str | None = None) -> object:
    """Import a package or print install hint and exit."""
    import importlib
    name = import_name or pkg
    try:
        return importlib.import_module(name)
    except ImportError:
        print(f"[seed-historical-stats] Missing package: {pkg}")
        print(f"  Install with:  pip install {pkg}")
        sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger(__name__)

# Lazy-load heavy deps only when main() runs
nfl    = None
pd     = None
supabase_create = None

# ─── ATS computation from schedules ──────────────────────────────────────────

# nflfastR team abbreviation → canonical abbr map
# (nflfastR uses older codes for some teams; normalise to current)
ABBR_NORMALISE = {
    'JAC': 'JAX',
    'STL': 'LAR',
    'SD':  'LAC',
    'OAK': 'LV',
    'GB':  'GB',
    'WAS': 'WAS',
}

def normalise_abbr(abbr: str) -> str:
    return ABBR_NORMALISE.get(abbr, abbr)


def compute_ats_from_schedules(df_sched) -> dict[tuple[int, str], dict]:
    """
    Given an nflfastR schedule DataFrame, compute per-team per-season ATS records.

    ATS result:
      spread_line is from home team's perspective in nflfastR (positive = home favoured).
      home_score - away_score vs. spread_line.
        home covers if (home_score - away_score) > spread_line
        away covers if (home_score - away_score) < spread_line
        push if equal
    Returns dict: (season, team) → {ats_wins, ats_losses, ats_pushes,
                                     home_ats, away_ats}
    """
    required_cols = {'season', 'home_team', 'away_team',
                     'home_score', 'away_score', 'spread_line'}
    missing = required_cols - set(df_sched.columns)
    if missing:
        log.warning("ATS calc: missing columns %s — ATS fields will be null", missing)
        return {}

    # Drop games without scores (future games or missing data)
    played = df_sched.dropna(subset=['home_score', 'away_score', 'spread_line'])

    # (season, team) → [home_win, home_loss, home_push, away_win, away_loss, away_push]
    records: dict[tuple[int, str], list[int]] = {}

    def key(season, team):
        t = normalise_abbr(str(team))
        return (int(season), t)

    def ensure(k):
        if k not in records:
            records[k] = [0, 0, 0, 0, 0, 0]  # hw hl hp aw al ap

    for _, row in played.iterrows():
        s  = int(row['season'])
        ht = str(row['home_team'])
        at = str(row['away_team'])
        margin = float(row['home_score']) - float(row['away_score'])
        spread = float(row['spread_line'])  # positive = home favoured

        # Home ATS
        hk = key(s, ht)
        ensure(hk)
        if margin > spread:     records[hk][0] += 1  # home covers
        elif margin < spread:   records[hk][1] += 1  # home doesn't cover
        else:                   records[hk][2] += 1  # push

        # Away ATS (inverse)
        ak = key(s, at)
        ensure(ak)
        if margin < spread:     records[ak][3] += 1  # away covers
        elif margin > spread:   records[ak][4] += 1  # away doesn't cover
        else:                   records[ak][5] += 1  # push

    out = {}
    for (season, team), (hw, hl, hp, aw, al, ap) in records.items():
        total_w = hw + aw
        total_l = hl + al
        total_p = hp + ap
        out[(season, team)] = {
            'ats_wins':        total_w,
            'ats_losses':      total_l,
            'ats_pushes':      total_p,
            'home_ats_record': f'{hw}-{hl}-{hp}',
            'away_ats_record': f'{aw}-{al}-{ap}',
        }
    return out


# ─── Team season stats aggregation ────────────────────────────────────────────

def build_team_stats(seasons: list[int]) -> list[dict]:
    """
    Pull schedule results + EPA from nfl-data-py and return a list of row dicts
    ready to upsert into nfl_team_season_stats.
    """
    log.info("Fetching schedules for seasons: %s", seasons)
    df_sched = nfl.import_schedules(seasons)

    # ATS records from spread + scores
    ats_map = compute_ats_from_schedules(df_sched)

    # W/L record from schedules
    records: dict[tuple[int, str], dict] = {}

    required_rec = {'season', 'home_team', 'away_team', 'home_score', 'away_score'}
    if not required_rec.issubset(df_sched.columns):
        log.warning("Schedule missing columns for W/L; skipping record calc")
        df_played = pd.DataFrame()
    else:
        df_played = df_sched.dropna(subset=['home_score', 'away_score'])

    for _, row in df_played.iterrows():
        s  = int(row['season'])
        ht = normalise_abbr(str(row['home_team']))
        at = normalise_abbr(str(row['away_team']))
        hs = float(row['home_score'])
        as_ = float(row['away_score'])

        def ensure_rec(t):
            k = (s, t)
            if k not in records:
                records[k] = {'wins': 0, 'losses': 0, 'ties': 0, 'games': 0}
            return records[k]

        hr = ensure_rec(ht)
        ar = ensure_rec(at)
        hr['games'] += 1
        ar['games'] += 1

        if hs > as_:
            hr['wins']   += 1
            ar['losses'] += 1
        elif hs < as_:
            ar['wins']   += 1
            hr['losses'] += 1
        else:
            hr['ties'] += 1
            ar['ties'] += 1

    # EPA from pbp (optional — skip if pbp download fails/is disabled)
    epa_map: dict[tuple[int, str], dict] = {}
    try:
        log.info("Fetching play-by-play for EPA (this may take a while)…")
        df_pbp = nfl.import_pbp_data(seasons, columns=[
            'season', 'posteam', 'defteam', 'epa', 'play_type',
        ])
        # Offensive EPA per play
        off_epa = (
            df_pbp
            .dropna(subset=['posteam', 'epa'])
            .query("play_type in ['pass', 'run', 'qb_scramble']")
            .groupby(['season', 'posteam'])['epa']
            .mean()
            .reset_index()
            .rename(columns={'posteam': 'team', 'epa': 'off_epa_per_play'})
        )
        # Defensive EPA per play (lower = better)
        def_epa = (
            df_pbp
            .dropna(subset=['defteam', 'epa'])
            .query("play_type in ['pass', 'run', 'qb_scramble']")
            .groupby(['season', 'defteam'])['epa']
            .mean()
            .reset_index()
            .rename(columns={'defteam': 'team', 'epa': 'def_epa_per_play'})
        )
        for _, r in off_epa.iterrows():
            k = (int(r['season']), normalise_abbr(str(r['team'])))
            epa_map.setdefault(k, {})['off_epa_per_play'] = round(float(r['off_epa_per_play']), 4)
        for _, r in def_epa.iterrows():
            k = (int(r['season']), normalise_abbr(str(r['team'])))
            epa_map.setdefault(k, {})['def_epa_per_play'] = round(float(r['def_epa_per_play']), 4)
    except Exception as exc:
        log.warning("PBP EPA skipped: %s", exc)

    # Compute league rankings for EPA within each season
    # off_epa_rank: rank by off_epa descending; def_epa_rank: rank by def_epa ascending
    # Build a flat list first, rank after
    rows = []
    all_keys = set(records.keys()) | set(epa_map.keys()) | set(ats_map.keys())
    now_iso = datetime.utcnow().isoformat(timespec='seconds') + 'Z'

    for (season, team) in sorted(all_keys):
        rec  = records.get((season, team), {})
        epa  = epa_map.get((season, team), {})
        ats  = ats_map.get((season, team), {})
        row  = {
            'season':           season,
            'team':             team,
            'games':            rec.get('games', 17),
            'wins':             rec.get('wins'),
            'losses':           rec.get('losses'),
            'ties':             rec.get('ties', 0),
            'off_epa_per_play': epa.get('off_epa_per_play'),
            'def_epa_per_play': epa.get('def_epa_per_play'),
            'ats_wins':         ats.get('ats_wins'),
            'ats_losses':       ats.get('ats_losses'),
            'ats_pushes':       ats.get('ats_pushes'),
            'home_ats_record':  ats.get('home_ats_record'),
            'away_ats_record':  ats.get('away_ats_record'),
            'source':           'nfl-data-py',
            'updated_at':       now_iso,
        }
        rows.append(row)

    # Compute per-season EPA rankings
    import pandas as _pd
    df = _pd.DataFrame(rows)
    for season_val in df['season'].unique():
        mask = df['season'] == season_val
        subset = df[mask].copy()

        if 'off_epa_per_play' in subset.columns and subset['off_epa_per_play'].notna().any():
            df.loc[mask, 'off_epa_rank'] = (
                subset['off_epa_per_play']
                .rank(ascending=False, method='min')
                .astype('Int64')
            )
        if 'def_epa_per_play' in subset.columns and subset['def_epa_per_play'].notna().any():
            df.loc[mask, 'def_epa_rank'] = (
                subset['def_epa_per_play']
                .rank(ascending=True, method='min')  # lower EPA allowed = better defense
                .astype('Int64')
            )
        if 'wins' in subset.columns and subset['wins'].notna().any():
            df.loc[mask, 'off_rank'] = (  # crude: win-based rank
                subset['wins']
                .rank(ascending=False, method='min')
                .astype('Int64')
            )

    # Convert NaN → None for JSON serialisation
    return df.where(df.notna(), other=None).to_dict(orient='records')


# ─── Player season stats ───────────────────────────────────────────────────────

_SKILL_POSITIONS = {'QB', 'RB', 'WR', 'TE', 'FB'}

def build_player_stats(seasons: list[int], positions: list[str] | None = None) -> list[dict]:
    """
    Pull weekly player stats, aggregate to season totals.
    Returns list of row dicts for nfl_player_season_stats.
    """
    target_pos = set(positions) if positions else _SKILL_POSITIONS

    log.info("Fetching weekly player data for seasons: %s", seasons)
    df = nfl.import_weekly_data(seasons)

    # Filter to skill positions
    if 'position' in df.columns:
        df = df[df['position'].isin(target_pos)]

    df['team'] = df['recent_team'].apply(normalise_abbr) if 'recent_team' in df.columns else \
                 df.get('posteam', pd.Series(dtype=str)).apply(normalise_abbr)

    # Season aggregates
    group_cols = ['season', 'player_id', 'player_name', 'position', 'team']
    available  = [c for c in group_cols if c in df.columns]
    if 'player_id' not in df.columns:
        log.warning("player_id column missing — using player_name as key")
        df['player_id'] = df.get('player_name', pd.Series(dtype=str))

    # Sum stats, count games
    sum_cols = [
        'completions', 'attempts', 'passing_yards', 'passing_tds', 'interceptions', 'sacks',
        'carries', 'rushing_yards', 'rushing_tds',
        'targets', 'receptions', 'receiving_yards', 'receiving_tds', 'air_yards', 'yards_after_catch',
    ]
    mean_cols = ['pacr', 'dakota', 'cpoe', 'snap_pct']
    agg_dict = {c: 'sum' for c in sum_cols if c in df.columns}
    agg_dict.update({c: 'mean' for c in mean_cols if c in df.columns})
    agg_dict['week'] = 'count'  # games played proxy

    season_df = df.groupby(available).agg(agg_dict).reset_index()
    season_df = season_df.rename(columns={
        'week':            'games',
        'passing_yards':   'pass_yards',
        'passing_tds':     'pass_tds',
        'rushing_yards':   'rush_yards',
        'rushing_tds':     'rush_tds',
        'receiving_yards': 'rec_yards',
        'receiving_tds':   'rec_tds',
        'yards_after_catch': 'yac',
    })

    # Derived rates
    if 'completions' in season_df.columns and 'attempts' in season_df.columns:
        season_df['comp_pct'] = (
            (season_df['completions'] / season_df['attempts'].replace(0, float('nan')))
            .round(3)
        )
    if 'carries' in season_df.columns and 'rush_yards' in season_df.columns:
        season_df['ypc'] = (
            (season_df['rush_yards'] / season_df['carries'].replace(0, float('nan')))
            .round(2)
        )
    if 'receptions' in season_df.columns and 'rec_yards' in season_df.columns:
        season_df['ypr'] = (
            (season_df['rec_yards'] / season_df['receptions'].replace(0, float('nan')))
            .round(2)
        )

    now_iso = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    season_df['source']     = 'nfl-data-py'
    season_df['updated_at'] = now_iso

    # Map column names to DB schema names
    col_map = {
        'passing_tds':   'pass_tds',
        'rushing_yards': 'rush_yards',
        'rushing_tds':   'rush_tds',
        'snap_pct':      'snap_pct',
        'cpoe':          'cpoe',
    }
    season_df = season_df.rename(columns=col_map)

    # Keep only columns that exist in the schema
    schema_cols = {
        'season', 'player_id', 'player_name', 'position', 'team', 'games', 'snap_pct',
        'completions', 'attempts', 'pass_yards', 'pass_tds', 'interceptions', 'sacks',
        'comp_pct', 'cpoe',
        'carries', 'rush_yards', 'rush_tds', 'ypc',
        'targets', 'receptions', 'rec_yards', 'rec_tds', 'ypr', 'air_yards', 'yac',
        'source', 'updated_at',
    }
    keep = [c for c in season_df.columns if c in schema_cols]
    season_df = season_df[keep]

    return season_df.where(season_df.notna(), other=None).to_dict(orient='records')


# ─── Supabase upsert helper ───────────────────────────────────────────────────

BATCH_SIZE = 100

def upsert_batch(client, table: str, rows: list[dict], conflict_cols: str, dry_run: bool) -> tuple[int, int]:
    """Upsert rows in batches. Returns (ok_count, fail_count)."""
    if not rows:
        return 0, 0

    import math

    def _sanitize(row: dict) -> dict:
        """Replace NaN/Inf floats with None; cast whole-number floats to int."""
        out = {}
        for k, v in row.items():
            if isinstance(v, float):
                if not math.isfinite(v):
                    out[k] = None
                elif v == int(v):
                    out[k] = int(v)
                else:
                    out[k] = v
            else:
                out[k] = v
        return out

    ok = 0
    fail = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = [_sanitize(r) for r in rows[i:i + BATCH_SIZE]]
        if dry_run:
            log.info("[DRY RUN] Would upsert %d rows into %s", len(batch), table)
            ok += len(batch)
            continue
        resp = client.table(table).upsert(batch, on_conflict=conflict_cols).execute()
        if hasattr(resp, 'error') and resp.error:
            log.error("Upsert failed batch %d/%d: %s", i, len(rows), resp.error)
            fail += len(batch)
        else:
            ok += len(batch)
    return ok, fail


# ─── CLI ─────────────────────────────────────────────────────────────────────

def parse_seasons(raw: str) -> list[int]:
    """Parse '2020-2024' → [2020, 2021, 2022, 2023, 2024] or '2024' → [2024]."""
    raw = raw.strip()
    if '-' in raw:
        parts = raw.split('-')
        return list(range(int(parts[0]), int(parts[1]) + 1))
    return [int(raw)]


def main() -> None:
    global nfl, pd, supabase_create

    parser = argparse.ArgumentParser(description='Seed historical NFL stats into Supabase')
    parser.add_argument('--seasons', default='2020-2024', help='Season range, e.g. 2020-2024 or 2024')
    parser.add_argument('--positions', default=None, help='Comma-sep positions, e.g. QB,WR')
    parser.add_argument('--skip-team',   action='store_true', help='Skip team stats seeding')
    parser.add_argument('--skip-player', action='store_true', help='Skip player stats seeding')
    parser.add_argument('--dry-run',     action='store_true', help='Print counts without writing')
    args = parser.parse_args()

    seasons   = parse_seasons(args.seasons)
    positions = [p.strip().upper() for p in args.positions.split(',')] if args.positions else None
    dry_run   = args.dry_run

    log.info("seed-historical-stats | seasons=%s | dry_run=%s", seasons, dry_run)

    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        sys.exit(1)

    # Lazy-load deps
    nfl             = _require('nfl-data-py', 'nfl_data_py')
    pd              = _require('pandas')
    supabase_mod    = _require('supabase')
    supabase_create = supabase_mod.create_client

    client = supabase_create(SUPABASE_URL, SUPABASE_KEY)

    # ── Team stats ─────────────────────────────────────────────────────────────
    if not args.skip_team:
        log.info("Building team season stats…")
        team_rows = build_team_stats(seasons)
        log.info("  %d team-season rows computed", len(team_rows))
        ok, fail = upsert_batch(client, 'nfl_team_season_stats', team_rows,
                                'season,team', dry_run)
        log.info("  Team upsert: %d OK, %d failed", ok, fail)

    # ── Player stats ───────────────────────────────────────────────────────────
    if not args.skip_player:
        log.info("Building player season stats…")
        player_rows = build_player_stats(seasons, positions)
        log.info("  %d player-season rows computed", len(player_rows))
        ok, fail = upsert_batch(client, 'nfl_player_season_stats', player_rows,
                                'season,player_id,team', dry_run)
        log.info("  Player upsert: %d OK, %d failed", ok, fail)

    log.info("Done.")


if __name__ == '__main__':
    main()
