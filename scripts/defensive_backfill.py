#!/usr/bin/env python3
"""Defensive props backfill: nflverse snap counts + play-by-play tackle credits joined to the
ESPN defensive game log, an expected-plays model from closing spread/total, and a walk-forward
backtest (v2) of snap/volume-based projections.

Inputs:  data/defensive-props/defensive-game-log-<season>.json  (npm run defense:props)
         data/nflverse/<season>/snap_counts_<season>.csv, play_by_play_<season>.csv.gz
         (node scripts/fetch-nflverse.mjs)
Outputs: data/defensive-props/defensive-enriched-<season>.json
         data/defensive-props/expected-plays-model-<season>.json
         data/defensive-props/defensive-backtest-v2-<season>-wNN.json
         docs/defensive-props/defensive-backtest-v2-<season>-wNN.md
Local only; no network, no Supabase.
Usage: python scripts/defensive_backfill.py [--season 2026] [--through-week 7]
"""
import csv, gzip, json, os, re, sys, statistics, collections
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
args = sys.argv[1:]
def arg(n, d):
    return args[args.index(n) + 1] if n in args else d
SEASON = int(arg('--season', 2026))
LOG = json.load(open(os.path.join(ROOT, f'data/defensive-props/defensive-game-log-{SEASON}.json')))
THROUGH = int(arg('--through-week', LOG['through_week']))
NV = {'LA': 'LAR', 'WAS': 'WSH'}
nv = lambda t: NV.get(t, t)
SUFFIX = re.compile(r'\b(jr|sr|ii|iii|iv|v)\b')
def full_key(n):
    n = SUFFIX.sub('', re.sub(r"[.'’\-]", ' ', (n or '').lower()))
    return ' '.join(n.split())
def abbr_key(n):
    """'Xavier McKinney' -> 'x mckinney'; pbp 'X.McKinney' -> 'x mckinney'."""
    n = (n or '').strip()
    if '.' in n and ' ' not in n.split('.', 1)[0]:
        first, last = n.split('.', 1)
        last = SUFFIX.sub('', re.sub(r"[.'’\-]", ' ', last.lower()))
        return f"{first[:1].lower()} {''.join(last.split())}"
    parts = full_key(n).split()
    return f"{parts[0][:1]} {''.join(parts[1:])}" if len(parts) > 1 else (parts[0] if parts else '')

rows = [r for r in LOG['rows'] if r['completed'] and r['week'] <= THROUGH]

# ---------- snaps ----------
snaps = {}; team_def_plays = collections.defaultdict(int)
for s in csv.DictReader(open(os.path.join(ROOT, f'data/nflverse/{SEASON}/snap_counts_{SEASON}.csv'))):
    if s['game_type'] != 'REG' or int(s['week']) > THROUGH: continue
    w, t = int(s['week']), nv(s['team'])
    ds, dp = int(float(s['defense_snaps'] or 0)), float(s['defense_pct'] or 0)
    snaps[(w, t, full_key(s['player']))] = (ds, dp, s['position'])
    if dp >= 0.5 and ds:
        team_def_plays[(w, t)] = max(team_def_plays[(w, t)], round(ds / dp))

# ---------- play-by-play tackle credits + game lines ----------
TCOLS = [f'solo_tackle_{i}' for i in (1, 2)] + [f'assist_tackle_{i}' for i in (1, 2, 3, 4)] + [f'tackle_with_assist_{i}' for i in (1, 2)]
pbp_ta = collections.defaultdict(lambda: collections.Counter())
lines = {}
for p in csv.DictReader(gzip.open(os.path.join(ROOT, f'data/nflverse/{SEASON}/play_by_play_{SEASON}.csv.gz'), 'rt')):
    if p['season_type'] != 'REG' or int(p['week']) > THROUGH: continue
    w = int(p['week'])
    if p['spread_line'] and p['total_line']:
        lines[(w, nv(p['home_team']), nv(p['away_team']))] = (float(p['spread_line']), float(p['total_line']))
    st = p.get('special_teams_play') == '1' or p['play_type'] in ('kickoff', 'punt', 'field_goal', 'extra_point')
    if p['play_type'] == 'run': cat = 'run'
    elif p['play_type'] == 'pass':
        cat = 'sack' if p.get('sack') == '1' else ('pass_deep' if p.get('pass_length') == 'deep' else 'pass_short')
    else: cat = 'other'
    if st: cat = 'special_teams'
    credited = set()
    for c in TCOLS:
        nm, tm = p.get(f'{c}_player_name'), p.get(f'{c}_team')
        if not nm or not tm: continue
        k = (w, nv(tm), abbr_key(nm))
        if k in credited: continue
        credited.add(k)
        pbp_ta[k][cat] += 1

# ---------- enrich ----------
matched_snaps = matched_pbp = 0
diffs = []
for r in rows:
    w, t = r['week'], r['team']
    s = snaps.get((w, t, full_key(r['player'])))
    r['def_snaps'], r['def_pct'] = (s[0], s[1]) if s else (None, None)
    r['team_def_plays'] = team_def_plays.get((w, t))
    matched_snaps += bool(s)
    c = pbp_ta.get((w, t, abbr_key(r['player'])))
    if c:
        matched_pbp += 1
        r['pbp_ta_by_type'] = dict(c)
        r['pbp_ta_scrimmage'] = sum(v for k, v in c.items() if k != 'special_teams')
        diffs.append(r['tackles_assists'] - r['pbp_ta_scrimmage'])
    else:
        r['pbp_ta_by_type'], r['pbp_ta_scrimmage'] = None, None
    home = r['stat_crew_home_team']; away = r['opp'] if home == r['team'] else r['team']
    ln = lines.get((w, home, away))
    if ln:
        spread_home, total = ln
        r['total_line'] = total
        r['team_spread'] = spread_home if r['team'] == home else -spread_home  # + = this defense's team favored
    else:
        r['total_line'] = r['team_spread'] = None

# ---------- expected plays model (defense plays faced) ----------
tg = {}
for r in rows:
    k = (r['event_id'], r['team'])
    if k not in tg and r['opp_plays'] and r['total_line'] is not None:
        tg[k] = {'week': r['week'], 'team': r['team'], 'opp': r['opp'], 'plays': r['opp_plays'], 'total': r['total_line'], 'spread': r['team_spread']}
TG = sorted(tg.values(), key=lambda x: x['week'])

def feats(g, prior):
    off = [x['plays'] for x in prior if x['opp'] == g['opp']]  # wrong side guard below
    return None

def design(g, prior):
    # prior averages: plays the opponent offense ran (as anyone's opponent) and plays this defense faced
    opp_off = [x['plays'] for x in prior if x['opp'] == g['opp'] and False]
    off_runs = [x['plays'] for x in prior if x['opp'] != g['team'] and x['opp'] == g['opp']]
    return None

def fit_predict(train, test):
    def x_of(g, hist):
        opp_off = [h['plays'] for h in hist if h['opp'] == g['opp']]  # plays g.opp ran in earlier games
        faced = [h['plays'] for h in hist if h['team'] == g['team']]   # plays this defense faced earlier
        lg = statistics.mean(h['plays'] for h in hist) if hist else 63
        return [1.0, g['total'], g['spread'], statistics.mean(opp_off) if opp_off else lg, statistics.mean(faced) if faced else lg]
    X = np.array([x_of(g, [h for h in train if h['week'] < g['week']]) for g in train if g['week'] > min(h['week'] for h in train)])
    y = np.array([g['plays'] for g in train if g['week'] > min(h['week'] for h in train)])
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    preds = [float(np.dot(beta, x_of(g, train))) for g in test]
    return beta, preds

model_eval = []
pred_plays = {}
for W in range(3, THROUGH + 1):
    train = [g for g in TG if g['week'] < W]; test = [g for g in TG if g['week'] == W]
    if len({g['week'] for g in train}) < 2 or not test: continue
    beta, preds = fit_predict(train, test)
    naive = statistics.mean(g['plays'] for g in train)
    for g, p in zip(test, preds):
        pred_plays[(W, g['team'])] = p
        model_eval.append({'week': W, 'team': g['team'], 'actual': g['plays'], 'pred': p, 'naive': naive, 'total': g['total'], 'spread': g['spread']})
beta_full, _ = fit_predict(TG, [])
def corr(a, b):
    return float(np.corrcoef(a, b)[0, 1]) if len(a) > 2 else None
ev_a = [e['actual'] for e in model_eval]
plays_summary = {
    'n_test': len(model_eval),
    'mae_model': round(statistics.mean(abs(e['pred'] - e['actual']) for e in model_eval), 2),
    'mae_naive_league_mean': round(statistics.mean(abs(e['naive'] - e['actual']) for e in model_eval), 2),
    'r_model': round(corr([e['pred'] for e in model_eval], ev_a), 3),
    'r_total_only': round(corr([e['total'] for e in model_eval], ev_a), 3),
    'r_spread_only': round(corr([e['spread'] for e in model_eval], ev_a), 3),
    'coefficients_full_sample': dict(zip(['intercept', 'total_line', 'team_spread', 'opp_offense_prior_plays', 'defense_prior_plays_faced'], [round(float(b), 3) for b in beta_full])),
}

# ---------- walk-forward backtest v2 ----------
by_player = collections.defaultdict(list)
for r in rows: by_player[r['athlete_id']].append(r)
for v in by_player.values(): v.sort(key=lambda x: x['week'])
present = collections.defaultdict(set)  # (week, team) -> athlete ids with a defensive snap
for r in rows:
    if (r['def_snaps'] or 0) > 0: present[(r['week'], r['team'])].add(r['athlete_id'])
VAC = {('LB', 'LB'): 1.4, ('S', 'S'): 1.6, ('LB', 'S'): 0.4}
def calib(raw): return 0.10 + 0.67 * raw
preds = []
for W in range(3, THROUGH + 1):
    for aid, games in by_player.items():
        prior = [g for g in games if g['week'] < W]; cur = [g for g in games if g['week'] == W]
        if not cur or len(prior) < 2: continue
        cur = cur[0]; ta = [g['tackles_assists'] for g in prior]
        base = statistics.mean(ta)
        if base < 3: continue
        snp = [g for g in prior if g['def_snaps']]
        rate = sum(g['tackles_assists'] for g in snp) / sum(g['def_snaps'] for g in snp) if snp else None
        pct3 = statistics.mean(g['def_pct'] for g in snp[-3:]) if snp else None
        team_plays = pred_plays.get((W, cur['team']))
        proj_snap = rate * pct3 * team_plays if (rate and pct3 and team_plays) else None
        # vacated: anchors (prior avg >= 6, 3+ games) on this team with no defensive snap this week
        bump = 0.0
        for bid, bg in by_player.items():
            if bid == aid: continue
            bp = [g for g in bg if g['week'] < W]
            if len(bp) < 3 or statistics.mean(g['tackles_assists'] for g in bp) < 6 or bp[-1]['team'] != cur['team']: continue
            if bid in present[(W, cur['team'])]: continue
            share = len({g['week'] for g in prior} & {g['week'] for g in bp}) / len(prior)
            bump += VAC.get((bp[-1]['group'], cur['group']), 0) * share
        med = statistics.median(ta)
        preds.append({'week': W, 'player': cur['player'], 'team': cur['team'], 'group': cur['group'], 'actual': cur['tackles_assists'],
                      'actual_snaps': cur['def_snaps'], 'base': base, 'median': med, 'proj_snap': proj_snap, 'bump': bump,
                      'prior_hit_4': sum(t >= 4 for t in ta) / len(ta), 'prior_hit_6': sum(t >= 6 for t in ta) / len(ta)})

def score(key, sel=lambda p: True):
    ps = [p for p in preds if sel(p) and p.get(key) is not None]
    e = [p[key] - p['actual'] for p in ps]
    return {'n': len(e), 'mae': round(statistics.mean(map(abs, e)), 3), 'bias': round(statistics.mean(e), 3), 'within_1': round(sum(abs(x) <= 1 for x in e) / len(e), 3)}
for p in preds:
    p['base_vac'] = p['base'] + p['bump']
    p['snap_vac'] = p['proj_snap'] + p['bump'] if p['proj_snap'] is not None else None
    p['blend_vac'] = (p['base'] + p['proj_snap']) / 2 + p['bump'] if p['proj_snap'] is not None else None
has_snap = lambda p: p['proj_snap'] is not None
methods = {k: score(k, has_snap) for k in ('base', 'median', 'base_vac', 'proj_snap', 'snap_vac', 'blend_vac')}
by_group = {g: {k: score(k, lambda p, g=g: has_snap(p) and p['group'] == g) for k in ('base_vac', 'snap_vac', 'blend_vac')} for g in ('LB', 'S', 'CB', 'DL')}

def edge_table(key):
    out = []
    for lo, hi, lab in [(-99, -1, '< -1'), (-1, 0, '-1 to 0'), (0, 1, '0 to +1'), (1, 2, '+1 to +2'), (2, 99, '> +2')]:
        g = [p for p in preds if p.get(key) is not None and lo <= p[key] - (p['median'] - 0.5) < hi]
        if g: out.append({'proj_minus_line': lab, 'n': len(g), 'over_rate': round(sum(p['actual'] > p['median'] - 0.5 for p in g) / len(g), 3)})
    return out
edges = {k: edge_table(k) for k in ('base_vac', 'snap_vac', 'blend_vac')}

# tackle sources by position (scrimmage)
src = collections.defaultdict(collections.Counter)
for r in rows:
    if r['pbp_ta_by_type']:
        for k, v in r['pbp_ta_by_type'].items(): src[r['group']][k] += v
src_share = {g: {k: round(v / sum(c.values()), 3) for k, v in c.items()} for g, c in src.items()}

# snap-share stability: does last-3 def_pct predict this week's snaps better than season?
snap_pred = []
for aid, games in by_player.items():
    for i, g in enumerate(games):
        pr = [x for x in games[:i] if x['def_pct'] is not None]
        if len(pr) >= 3 and g['def_pct'] is not None:
            snap_pred.append((statistics.mean(x['def_pct'] for x in pr[-3:]), statistics.mean(x['def_pct'] for x in pr), g['def_pct']))
snap_stab = {'n': len(snap_pred), 'mae_last3_pct': round(statistics.mean(abs(a - c) for a, b, c in snap_pred), 3), 'mae_season_pct': round(statistics.mean(abs(b - c) for a, b, c in snap_pred), 3)}

meta = {'season': SEASON, 'through_week': THROUGH, 'rows': len(rows), 'snap_match_rate': round(matched_snaps / len(rows), 3), 'pbp_match_rate': round(matched_pbp / len(rows), 3),
        'espn_minus_pbp_scrimmage_ta': {'mean': round(statistics.mean(diffs), 3), 'exact_share': round(sum(d == 0 for d in diffs) / len(diffs), 3)} if diffs else None,
        'games_with_lines': len({(k[0], k[1]) for k in lines})}
out_dir = os.path.join(ROOT, 'data/defensive-props'); docs = os.path.join(ROOT, 'docs/defensive-props')
tag = f'{SEASON}-w{THROUGH:02d}'
json.dump({**meta, 'rows': rows}, open(os.path.join(out_dir, f'defensive-enriched-{SEASON}.json'), 'w'), indent=1)
json.dump({**meta, 'summary': plays_summary, 'walk_forward': model_eval}, open(os.path.join(out_dir, f'expected-plays-model-{SEASON}.json'), 'w'), indent=1)
res = {**meta, 'plays_model': plays_summary, 'methods': methods, 'by_group': by_group, 'edge_vs_median_line': edges, 'tackle_sources_by_group': src_share, 'snap_share_stability': snap_stab}
json.dump({**res, 'predictions': preds}, open(os.path.join(out_dir, f'defensive-backtest-v2-{tag}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
