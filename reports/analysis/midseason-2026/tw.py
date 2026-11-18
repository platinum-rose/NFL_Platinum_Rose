"""Team-week results for the mid-season scripts: the archive's team-weeks.csv (W1-9) plus any later week that the archive
has not built yet, derived from the cached ESPN summaries (score + pickcenter DraftKings closing line). Read-only.
rows() yields dicts with at least: week, team, opp, home_away, pts, opp_pts, line (team's closing spread), total."""
import csv, glob, json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
CSV = os.path.join(ROOT, 'data/archive/2026/season/team-weeks.csv')
def _f(x):
    try: return float(str(x).lstrip('ou'))
    except (TypeError, ValueError): return None
def closing(d):
    """DK closing/opening numbers from an ESPN summary's pickcenter -> dict (home perspective) or None."""
    pcs = d.get('pickcenter') or []
    pc = next((x for x in pcs if 'draft' in (x.get('provider', {}).get('name') or '').lower()), pcs[0] if pcs else None)
    if not pc: return None
    ps, tt, ml = pc.get('pointSpread') or {}, pc.get('total') or {}, pc.get('moneyline') or {}
    g = lambda o, *k: (lambda v: v)(__import__('functools').reduce(lambda a, b: (a or {}).get(b), k, o))
    out = dict(provider=pc.get('provider', {}).get('name'),
               home_spread_close=_f(g(ps, 'home', 'close', 'line')), home_spread_open=_f(g(ps, 'home', 'open', 'line')),
               home_spread_close_odds=_f(g(ps, 'home', 'close', 'odds')), away_spread_close_odds=_f(g(ps, 'away', 'close', 'odds')),
               total_close=_f(g(tt, 'over', 'close', 'line')), total_open=_f(g(tt, 'over', 'open', 'line')),
               over_close_odds=_f(g(tt, 'over', 'close', 'odds')), under_close_odds=_f(g(tt, 'under', 'close', 'odds')),
               home_ml_close=_f(g(ml, 'home', 'close', 'odds')), away_ml_close=_f(g(ml, 'away', 'close', 'odds')),
               home_ml_open=_f(g(ml, 'home', 'open', 'odds')), away_ml_open=_f(g(ml, 'away', 'open', 'odds')))
    if out['home_spread_close'] is None: out['home_spread_close'] = _f(pc.get('spread'))
    if out['total_close'] is None: out['total_close'] = _f(pc.get('overUnder'))
    return out
def games(weeks=None):
    """One dict per final 2026 regular-season game in the box-score cache."""
    out = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'data/fantasy/boxscores/espn-*.json'))):
        try: d = json.load(open(f, encoding='utf-8'))
        except Exception: continue
        h = d.get('header', {}); comp = (h.get('competitions') or [{}])[0]
        if (h.get('season') or {}).get('year') not in (None, 2026): continue
        wk = h.get('week')
        if weeks and wk not in weeks: continue
        cs = {c.get('homeAway'): c for c in comp.get('competitors', [])}
        if 'home' not in cs or not comp.get('status', {}).get('type', {}).get('completed'): continue
        ls = {k: [float(x.get('value', x.get('displayValue')) or 0) for x in cs[k].get('linescores', [])] for k in cs}
        out[(wk, cs['away']['team']['abbreviation'], cs['home']['team']['abbreviation'])] = dict(
            week=wk, event=os.path.basename(f)[5:-5], date=comp.get('date'), away=cs['away']['team']['abbreviation'], home=cs['home']['team']['abbreviation'],
            away_pts=float(cs['away'].get('score') or 0), home_pts=float(cs['home'].get('score') or 0), linescores=ls, closing=closing(d))
    return list(out.values())
def rows():
    have = set()
    for r in csv.DictReader(open(CSV, encoding='utf-8')):
        have.add(int(r['week'])); yield r
    for g in games():
        if g['week'] in have: continue
        c = g['closing'] or {}
        for side, opp, ha, sgn in (('home', 'away', 'home', 1), ('away', 'home', 'away', -1)):
            line = None if c.get('home_spread_close') is None else sgn * c['home_spread_close']
            yield dict(week=str(g['week']), team=g[side], opp=g[opp], home_away=ha, pts=str(g[side + '_pts']), opp_pts=str(g[opp + '_pts']),
                       line='' if line is None else str(line), total='' if c.get('total_close') is None else str(c['total_close']))
if __name__ == '__main__':
    import collections
    print(sorted(collections.Counter(int(r['week']) for r in rows()).items()))
