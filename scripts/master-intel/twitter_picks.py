"""Merge Twitter/X video picks (data/twitter/twitter-video-picks-<season>-w<NN>.json, Antigravity) into the
YouTube-picks structure so the queue builder and build.py treat them identically.

Rule (Andy, 2026-10-21): the same pick from the same source caught by two pipelines is ONE opinion. A Twitter-video pick
is dropped when a Grok CSV row for the SAME tweet already has the same team/player + market side.
"""
import csv, glob, json, os

def _norm(s):
    return str(s or '').strip().lower()

def _grok_keys(root, ww):
    keys = set()
    for f in glob.glob(os.path.join(root, f'data/vault-seed/manual/grok-week{ww}-threads/*.csv')):
        for r in csv.DictReader(open(f, encoding='utf-8', errors='ignore')):
            url = _norm(r.get('tweet_url'))
            tm = _norm(r.get('team_or_market'))
            sel = _norm(r.get('selection'))
            keys.add((url, tm)); keys.add((url, sel))
    return keys

TEAM = {'NYJ': 'new york jets', 'BAL': 'baltimore ravens', 'CHI': 'chicago bears', 'LV': 'las vegas raiders', 'BUF': 'buffalo bills',
        'SEA': 'seattle seahawks', 'NE': 'new england patriots', 'MIA': 'miami dolphins', 'ATL': 'atlanta falcons', 'TB': 'tampa bay buccaneers',
        'ARI': 'arizona cardinals', 'DAL': 'dallas cowboys', 'MIN': 'minnesota vikings', 'DET': 'detroit lions', 'KC': 'kansas city chiefs',
        'DEN': 'denver broncos', 'PHI': 'philadelphia eagles', 'WAS': 'washington commanders', 'IND': 'indianapolis colts', 'JAX': 'jacksonville jaguars',
        'TEN': 'tennessee titans', 'CIN': 'cincinnati bengals', 'CLE': 'cleveland browns', 'PIT': 'pittsburgh steelers', 'LAC': 'los angeles chargers',
        'LAR': 'los angeles rams'}

def merge(yt, root, season, ww):
    """Mutates and returns yt (dict with picks/dropped). Adds twitter picks with source_pipeline twitter_video."""
    p = os.path.join(root, f'data/twitter/twitter-video-picks-{season}-w{ww}.json')
    if not os.path.exists(p):
        return yt
    tw = json.load(open(p, encoding='utf-8'))
    yt = yt or {}
    yt.setdefault('picks', []); yt.setdefault('dropped', [])
    gk = _grok_keys(root, ww)
    added = 0
    for r in tw.get('picks', []):
        url = _norm(r.get('tweet_url'))
        who = _norm(r.get('player')) or TEAM.get(str(r.get('team') or r.get('side') or '').upper(), _norm(r.get('team')))
        if (url, who) in gk:
            yt['dropped'].append(dict(r, reason='duplicate of Grok thread pick from the same tweet (one opinion)', source_pipeline='twitter_video'))
            continue
        row = dict(r)
        row.setdefault('source_pipeline', 'twitter_video')
        row.setdefault('show', f"X @{r.get('handle')}" if r.get('handle') else 'X')
        row.setdefault('episode', r.get('tweet_url'))
        yt['picks'].append(row); added += 1
    for r in tw.get('dropped', []):
        yt['dropped'].append(dict(r, source_pipeline='twitter_video'))
    yt.setdefault('sources_merged', []).append(dict(path=p, added=added, status=tw.get('status')))
    return yt
