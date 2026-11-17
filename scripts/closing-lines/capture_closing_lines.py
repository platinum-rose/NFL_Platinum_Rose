#!/usr/bin/env python3
"""Store closing lines on disk next to the wager ledgers, and compute closing-line value (CLV) for single-game
side/total legs. Free: no paid API, no Supabase. Read-only on every ledger.

Source and definition of "close"
  ESPN's public game summary (site.api.espn.com/.../summary?event=<id>) carries a `pickcenter` block from DraftKings with
  `open` and `close` numbers for the spread, total and moneyline. After kickoff the `close` values are frozen at the last
  pre-game DraftKings line. The weekly post-mortem already caches these summaries in data/fantasy/boxscores/espn-<id>.json,
  so the default run needs no network. --fetch-week N pulls any final game of week N that is not cached yet.

Outputs (both rewritten in full on each run; safe to re-run)
  data/official-picks/closing-lines-2026.json        one row per final game: open/close spread, total, moneylines
  data/official-picks/closing-line-values-2026.json  one row per single-game spread / total / moneyline leg in the placed
                                                     and paper ledgers: line and price taken vs the close, CLV

CLV sign: positive = Andy's number was better than the close.
  spread     clv_points = line taken - closing line for that team   (+3.5 taken, closed +2.5 -> +1.0)
  total      Over: closing total - total taken; Under: total taken - closing total
  moneyline  clv_prob = implied(close price) - implied(price taken)  (took +150, closed +130 -> +0.035)
Skipped (reported in the summary): 1H/2H legs, teaser legs (the stored line is the teased line), college legs, legs whose
team or game cannot be resolved, and games with no pickcenter block.

Usage
  python3 scripts/closing-lines/capture_closing_lines.py                 # all cached 2026 games
  python3 scripts/closing-lines/capture_closing_lines.py --fetch-week 11 # also cache week 11 finals from ESPN first
  python3 scripts/closing-lines/capture_closing_lines.py --dry-run       # print the summary, write nothing
"""
import argparse, datetime, glob, json, os, re, sys, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BOX_DIR = os.path.join(ROOT, 'data', 'fantasy', 'boxscores')
OUT_DIR = os.path.join(ROOT, 'data', 'official-picks')
LEDGERS = [('placed', 'user-placed-wagers-2026.json'), ('paper', 'paper-wagers-2026.json')]
ESPN = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl'
ALIAS = {'WAS': 'WSH', 'LA': 'LAR', 'LVR': 'LV', 'NOS': 'NO', 'JAC': 'JAX'}


def team(a):
    a = (a or '').upper()
    return ALIAS.get(a, a)


def _num(x):
    try:
        return float(str(x).strip().lstrip('ouOU').replace('EVEN', '100').replace('even', '100'))
    except (TypeError, ValueError):
        return None


def _get(o, *keys):
    for k in keys:
        if not isinstance(o, dict):
            return None
        o = o.get(k)
    return o


def implied(american):
    """American price -> implied probability (vig included). None if not a usable price."""
    a = _num(american)
    if a is None or abs(a) < 100:
        return None
    return 100 / (a + 100) if a > 0 else -a / (-a + 100)


def closing_from_summary(d):
    """ESPN summary dict -> closing/opening numbers from the home team's side, or None when there is no pickcenter."""
    pcs = d.get('pickcenter') or []
    pc = next((x for x in pcs if 'draft' in str(_get(x, 'provider', 'name')).lower()), pcs[0] if pcs else None)
    if not pc:
        return None
    sp, tt, ml = pc.get('pointSpread') or {}, pc.get('total') or {}, pc.get('moneyline') or {}
    out = {
        'provider': _get(pc, 'provider', 'name'),
        'spread_home_close': _num(_get(sp, 'home', 'close', 'line')), 'spread_home_open': _num(_get(sp, 'home', 'open', 'line')),
        'spread_home_close_price': _num(_get(sp, 'home', 'close', 'odds')), 'spread_away_close_price': _num(_get(sp, 'away', 'close', 'odds')),
        'total_close': _num(_get(tt, 'over', 'close', 'line')), 'total_open': _num(_get(tt, 'over', 'open', 'line')),
        'over_close_price': _num(_get(tt, 'over', 'close', 'odds')), 'under_close_price': _num(_get(tt, 'under', 'close', 'odds')),
        'ml_home_close': _num(_get(ml, 'home', 'close', 'odds')), 'ml_away_close': _num(_get(ml, 'away', 'close', 'odds')),
        'ml_home_open': _num(_get(ml, 'home', 'open', 'odds')), 'ml_away_open': _num(_get(ml, 'away', 'open', 'odds')),
    }
    # older summaries only carry the flat fields; `spread` is the home line
    if out['spread_home_close'] is None:
        out['spread_home_close'] = _num(pc.get('spread'))
    if out['total_close'] is None:
        out['total_close'] = _num(pc.get('overUnder'))
    if out['spread_home_close'] is None and out['total_close'] is None:
        return None
    return out


def game_from_summary(d, event_id=None):
    """ESPN summary dict -> one closing-line row, or None if the game is not a final 2026 regular-season game."""
    h = d.get('header') or {}
    comp = (h.get('competitions') or [{}])[0]
    cs = {c.get('homeAway'): c for c in comp.get('competitors', [])}
    if 'home' not in cs or 'away' not in cs:
        return None
    if not _get(comp, 'status', 'type', 'completed'):
        return None
    names = {}
    for side in ('home', 'away'):
        t = cs[side].get('team') or {}
        for k in ('displayName', 'shortDisplayName', 'name', 'location', 'abbreviation'):
            if t.get(k):
                names[str(t[k]).lower()] = team(t.get('abbreviation'))
    row = {'season': _get(h, 'season', 'year'), 'season_type': _get(h, 'season', 'type'), 'week': h.get('week'), 'event_id': str(event_id or h.get('id') or ''),
           'kickoff_utc': comp.get('date'), 'away': team(_get(cs['away'], 'team', 'abbreviation')), 'home': team(_get(cs['home'], 'team', 'abbreviation')),
           'away_score': _num(cs['away'].get('score')), 'home_score': _num(cs['home'].get('score')), 'names': names}
    row['closing'] = closing_from_summary(d)
    return row


def load_games(box_dir=BOX_DIR, season=2026):
    games = {}
    for f in sorted(glob.glob(os.path.join(box_dir, 'espn-*.json'))):
        try:
            d = json.load(open(f, encoding='utf-8'))
        except (ValueError, OSError):
            continue
        g = game_from_summary(d, os.path.basename(f)[5:-5])
        if not g or g['season'] not in (None, season) or g.get('season_type') not in (None, 2):
            continue
        games[(g['week'], g['away'], g['home'])] = g
    return games


def fetch_week(week, season=2026, box_dir=BOX_DIR):
    """Cache ESPN summaries for final games of one week that are not on disk yet. Returns the number fetched."""
    sb = json.load(urllib.request.urlopen(f'{ESPN}/scoreboard?seasontype=2&week={week}&dates={season}', timeout=30))
    os.makedirs(box_dir, exist_ok=True)
    n = 0
    for ev in sb.get('events', []):
        path = os.path.join(box_dir, f"espn-{ev['id']}.json")
        if ev['status']['type']['name'] != 'STATUS_FINAL' or os.path.exists(path):
            continue
        txt = urllib.request.urlopen(f"{ESPN}/summary?event={ev['id']}", timeout=30).read().decode('utf-8')
        json.loads(txt)
        open(path, 'w', encoding='utf-8').write(txt)
        n += 1
    return n


def find_game(games, week, leg, wager):
    gs = str(leg.get('game') or wager.get('game') or '')
    m = re.match(r'\s*([A-Za-z]{2,3})\s*@\s*([A-Za-z]{2,3})\b', gs)
    cands = [week] + [week + d for d in (-1, 1)] if leg.get('kickoff_utc') else [week]
    if m:
        a, h = team(m.group(1)), team(m.group(2))
        for w in cands:
            g = games.get((w, a, h)) or games.get((w, h, a))
            if g:
                return g
    t = team(leg.get('team'))
    if t:
        for (w, a, h), g in games.items():
            if w == week and t in (a, h):
                return g
    return None


def leg_side(leg, g):
    t = team(leg.get('team'))
    if t in (g['home'], g['away']):
        return 'home' if t == g['home'] else 'away'
    sel = re.sub(r'(?i)\b(ml|moneyline|alt(ernate)?|spread)\b|[+-]?\d+(\.\d+)?|\(.*?\)', ' ', str(leg.get('selection') or '')).lower()
    sel = ' '.join(sel.split())
    for nm, ab in sorted(g['names'].items(), key=lambda kv: -len(kv[0])):
        if nm and (sel == nm or sel.startswith(nm + ' ') or (' ' + nm) in (' ' + sel)):
            return 'home' if ab == g['home'] else 'away'
    return None


def leg_clv(leg, wager, games):
    """-> dict for a single-game spread / total / moneyline leg, or (None, reason)."""
    market = str(leg.get('market') or '').lower().replace('alternate_', '').replace('sgp_', '')
    sel = str(leg.get('selection') or '')
    if market not in ('spread', 'total', 'total_points', 'moneyline'):
        return None, 'not a side/total'
    if leg.get('period') or re.search(r'(?i)\b(1h|2h|1st half|2nd half|first half|second half|quarter)\b', sel):
        return None, 'half/quarter leg'
    if leg.get('teaser') or leg.get('teaser_points') or 'teaser' in str(wager.get('ticket_type')).lower():
        return None, 'teaser leg'
    if leg.get('sport') or '(cfb)' in str(leg.get('game')).lower() or 'ncaa' in str(leg.get('game')).lower():
        return None, 'not NFL'
    week = wager.get('week')
    g = find_game(games, week, leg, wager)
    if not g:
        return None, 'game not found / not final'
    c = g.get('closing')
    if not c:
        return None, 'no pickcenter close'
    base = {'week': g['week'], 'event_id': g['event_id'], 'game': f"{g['away']}@{g['home']}", 'market': 'total' if market.startswith('total') else market,
            'selection': sel, 'price_taken': leg.get('price'), 'leg_status': leg.get('status'), 'close_provider': c.get('provider')}
    if base['market'] == 'total':
        line = _num(leg.get('line'))
        if line is None or c.get('total_close') is None:
            return None, 'no total line'
        under = str(leg.get('direction') or '').lower() == 'under' or bool(re.search(r'(?i)\bunder\b|\bu\s?\d', sel))
        base.update(direction='under' if under else 'over', line_taken=line, line_close=c['total_close'], line_open=c.get('total_open'),
                    price_close=c.get('under_close_price' if under else 'over_close_price'),
                    clv_points=round((line - c['total_close']) if under else (c['total_close'] - line), 2))
        return base, None
    side = leg_side(leg, g)
    if not side:
        return None, 'team not resolved'
    sgn = 1 if side == 'home' else -1
    base['team'] = g[side]
    if base['market'] == 'spread':
        line = _num(leg.get('line'))
        if line is None or c.get('spread_home_close') is None:
            return None, 'no spread line'
        close = sgn * c['spread_home_close']
        base.update(line_taken=line, line_close=close, line_open=None if c.get('spread_home_open') is None else sgn * c['spread_home_open'],
                    price_close=c.get('spread_home_close_price' if side == 'home' else 'spread_away_close_price'), clv_points=round(line - close, 2))
        return base, None
    pc, pt = implied(c.get(f'ml_{side}_close')), implied(leg.get('price'))
    base.update(price_close=c.get(f'ml_{side}_close'), price_open=c.get(f'ml_{side}_open'), clv_prob=None if pc is None or pt is None else round(pc - pt, 4))
    return base, None


def build(games, ledgers):
    rows, skipped = [], {}
    for name, wagers in ledgers:
        for w in wagers:
            if not w.get('week'):
                continue
            for i, leg in enumerate(w.get('legs') or [], 1):
                r, why = leg_clv(leg, w, games)
                if r is None:
                    if why != 'not a side/total':
                        skipped[why] = skipped.get(why, 0) + 1
                    continue
                r.update(ledger=name, ticket_id=w.get('id'), leg_num=leg.get('leg_num', i), placed_at=w.get('placed_at'), n_legs=len(w.get('legs') or []),
                         single_game_ticket=len({str(l.get('game')) for l in (w.get('legs') or [])}) == 1)
                rows.append(r)
    pts = [r['clv_points'] for r in rows if r.get('clv_points') is not None]
    summary = {'legs': len(rows), 'with_points_clv': len(pts), 'beat_close': sum(p > 0 for p in pts), 'equal_close': sum(p == 0 for p in pts),
               'worse_than_close': sum(p < 0 for p in pts), 'avg_clv_points': round(sum(pts) / len(pts), 3) if pts else None, 'skipped': skipped}
    return rows, summary


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--season', type=int, default=2026)
    ap.add_argument('--fetch-week', type=int, action='append', default=[])
    ap.add_argument('--box-dir', default=BOX_DIR)
    ap.add_argument('--out-dir', default=OUT_DIR)
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args(argv)
    for wk in a.fetch_week:
        print(f'fetched {fetch_week(wk, a.season, a.box_dir)} new final game(s) for week {wk}')
    games = load_games(a.box_dir, a.season)
    ledgers = []
    for name, fn in LEDGERS:
        p = os.path.join(a.out_dir, fn)
        if os.path.exists(p):
            ledgers.append((name, json.load(open(p, encoding='utf-8'))))
    rows, summary = build(games, ledgers)
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    gl = [dict({k: v for k, v in g.items() if k not in ('names', 'closing')}, **(g['closing'] or {'provider': None})) for g in sorted(games.values(), key=lambda g: (g['week'] or 0, g['kickoff_utc'] or ''))]
    lines = {'schema': 'closing_lines_v1', 'season': a.season, 'generated_at': now, 'source': 'ESPN summary pickcenter (DraftKings open/close), cached in data/fantasy/boxscores',
             'close_definition': 'last pre-kickoff DraftKings line as frozen in the post-game ESPN summary', 'games': gl}
    clv = {'schema': 'closing_line_values_v1', 'season': a.season, 'generated_at': now, 'sign': 'positive = better than the close', 'summary': summary, 'legs': rows}
    print(json.dumps({'games': len(gl), 'games_with_close': sum(1 for g in gl if g.get('spread_home_close') is not None), **summary}, indent=1))
    if not a.dry_run:
        for fn, obj in (('closing-lines-2026.json', lines), ('closing-line-values-2026.json', clv)):
            with open(os.path.join(a.out_dir, fn), 'w', encoding='utf-8') as f:
                json.dump(obj, f, indent=1, ensure_ascii=False)
            print('wrote', os.path.join(os.path.relpath(a.out_dir, ROOT), fn))
    return lines, clv


if __name__ == '__main__':
    main()
