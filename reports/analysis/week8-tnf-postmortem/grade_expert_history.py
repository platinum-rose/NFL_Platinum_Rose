#!/usr/bin/env python3
"""Grade verified expert picks (Weeks 4-7 master-intel) against saved ESPN box scores.

Reads data/generated/master-intel/wNN-expert-verified.json and ESPN summaries in
data/fantasy/boxscores + data/defensive-props/cache. Local only.
Writes graded rows + per-source summary next to this script.
"""
import json, glob, re, os, collections, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.dirname(os.path.abspath(__file__))
ALIAS = {'WAS': 'WSH', 'LA': 'LAR', 'JAC': 'JAX', 'LVR': 'LV', 'OAK': 'LV', 'SD': 'LAC', 'ARZ': 'ARI', 'NOR': 'NO', 'GNB': 'GB', 'KAN': 'KC', 'NWE': 'NE', 'SFO': 'SF', 'TAM': 'TB'}
TEAMNAME = {}

def norm_team(t):
    t = (t or '').strip().upper()
    return ALIAS.get(t, t)

def norm_name(n):
    n = re.sub(r"[.'’]", '', (n or '').lower())
    n = re.sub(r'\b(jr|sr|ii|iii|iv)\b', '', n)
    return re.sub(r'\s+', ' ', n).strip()

# ---------- box scores ----------
games = {}  # (week, AWAY, HOME) -> game dict
for f in glob.glob(os.path.join(ROOT, 'data/fantasy/boxscores/espn-*.json')) + glob.glob(os.path.join(ROOT, 'data/defensive-props/cache/espn-*.json')):
    try:
        d = json.load(open(f))
    except Exception:
        continue
    h = d.get('header', {}); c = (h.get('competitions') or [{}])[0]
    if not c.get('status', {}).get('type', {}).get('completed'):
        continue
    teams = {x['homeAway']: (x['team']['abbreviation'], int(x.get('score') or 0)) for x in c['competitors']}
    for x in c['competitors']:
        TEAMNAME[x['team']['displayName'].lower()] = x['team']['abbreviation']
        TEAMNAME[x['team'].get('name', '').lower()] = x['team']['abbreviation']
        TEAMNAME[x['team'].get('shortDisplayName', '').lower()] = x['team']['abbreviation']
    players = collections.defaultdict(lambda: collections.defaultdict(float))
    for tp in d.get('boxscore', {}).get('players', []):
        for cat in tp.get('statistics', []):
            keys = cat.get('keys') or []
            for a in cat.get('athletes', []):
                nm = norm_name(a['athlete']['displayName']); s = a.get('stats') or []
                st = players[nm]; st['_team'] = tp['team']['abbreviation']
                def g(k):
                    if k in keys:
                        v = s[keys.index(k)]
                        try: return float(str(v).split('/')[0].split('-')[0])
                        except Exception: return 0.0
                    return 0.0
                n = cat['name']
                if n == 'passing':
                    ca = str(s[keys.index('completions/passingAttempts')]) if 'completions/passingAttempts' in keys else '0/0'
                    cmp_, att = (ca.split('/') + ['0'])[:2]
                    st['pass_cmp'] += float(cmp_ or 0); st['pass_att'] += float(att or 0)
                    st['pass_yds'] += g('passingYards'); st['pass_td'] += g('passingTouchdowns'); st['int_thrown'] += g('interceptions')
                elif n == 'rushing':
                    st['rush_att'] += g('rushingAttempts'); st['rush_yds'] += g('rushingYards'); st['rush_td'] += g('rushingTouchdowns')
                elif n == 'receiving':
                    st['rec'] += g('receptions'); st['rec_yds'] += g('receivingYards'); st['rec_td'] += g('receivingTouchdowns')
                elif n == 'defensive':
                    st['ta'] += g('totalTackles'); st['sacks'] += g('sacks')
                elif n in ('kickReturns', 'puntReturns'):
                    st['ret_td'] += g('kickReturnTouchdowns') + g('puntReturnTouchdowns')
                elif n == 'kicking':
                    fg = str(s[keys.index('fieldGoalsMade/fieldGoalAttempts')]) if 'fieldGoalsMade/fieldGoalAttempts' in keys else '0/0'
                    st['fg'] += float(fg.split('/')[0] or 0)
    for st in players.values():
        st['td'] = st['rush_td'] + st['rec_td'] + st['ret_td']
        st['rr_yds'] = st['rush_yds'] + st['rec_yds']
    games[(h.get('week'), teams['away'][0], teams['home'][0])] = {'away': teams['away'], 'home': teams['home'], 'players': players}

def find_game(week, game):
    m = re.match(r'([A-Za-z]+)\s*@\s*([A-Za-z]+)', game or '')
    if not m: return None
    a, h = norm_team(m.group(1)), norm_team(m.group(2))
    return games.get((week, a, h)) or games.get((week, h, a))

# ---------- parsing ----------
STAT_PATTERNS = [
    (r'parlay|first (td|touchdown)|longest|1q|first quarter|1st quarter|first half|1h|season_', None),
    (r'2\+ (td|touchdown)', 'td2'),
    (r'pass(ing)?[ _]*(td|touchdown)', 'pass_td'),
    (r'interception', 'int_thrown'),
    (r'rush(ing)?[ _]*\+[ _]*rec|rush(ing)? ?(and|&) ?rec|rushing \+ receiving|rush\+rec|rush_rec', 'rr_yds'),
    (r'rush(ing)?[ _]*attempts|carries', 'rush_att'),
    (r'pass(ing)?[ _]*attempts', 'pass_att'),
    (r'completions', 'pass_cmp'),
    (r'receiving[ _]*yards|rec(\.|eiving)? ?yds|receiving_yards', 'rec_yds'),
    (r'receptions|\brec\b', 'rec'),
    (r'rushing[ _]*yards|rush(ing)? ?yds|rushing_yards', 'rush_yds'),
    (r'passing[ _]*yards|pass(ing)? ?yds|passing_yards', 'pass_yds'),
    (r'tackles', 'ta'),
    (r'sacks?', 'sacks'),
    (r'field goals?', 'fg'),
    (r'anytime|touchdowns? over 0\.5|td scorer|to score|\btd\b|touchdown', 'td'),
]

def parse_prop(r):
    text = f"{r.get('selection') or ''} {r.get('side') or ''}".lower()
    stat = None
    for pat, s in STAT_PATTERNS:
        if re.search(pat, text):
            stat = s; break
    if stat is None:
        return None
    if stat == 'td2':
        return ('td', 'over', 1.5)
    direction, line = None, None
    m = re.search(r'(\d+(?:\.\d+)?)\+', text)
    if m:
        direction, line = 'over', float(m.group(1)) - 0.5
    m2 = re.search(r'\b(over|under)\b\s*(\d+(?:\.\d+)?)?', text)
    if m2:
        direction = m2.group(1)
        if m2.group(2): line = float(m2.group(2))
    if line is None and isinstance(r.get('line'), (int, float)) and abs(r['line']) < 400 and stat != 'td':
        line = float(r['line'])
    if stat == 'td':
        if direction == 'under': return ('td', 'under', 0.5)
        return ('td', 'over', 0.5 if line is None or line > 3 else line)
    if direction is None: direction = 'over'
    if line is None: return None
    return (stat, direction, line)

def player_of(r, g):
    cands = [p for p in (r.get('players') or [])] + [r.get('selection') or '']
    names = list(g['players'].keys())
    for c in cands:
        c = norm_name(c.split(':')[0].split(' - ')[0])
        best = None
        for n in names:
            if n and c.startswith(n) and (best is None or len(n) > len(best)):
                best = n
        if best: return best
    return None

def team_of(side, sel):
    for t in [side or '', sel or '']:
        tt = t.strip()
        if norm_team(tt) in {x for k in games for x in k[1:]}: return norm_team(tt)
        low = tt.lower()
        for nm, ab in sorted(TEAMNAME.items(), key=lambda x: -len(x[0])):
            if nm and nm in low: return ab
        m = re.match(r'(?:spread\s+)?([A-Z]{2,3})\b', tt)
        if m and norm_team(m.group(1)) in {x for k in games for x in k[1:]}: return norm_team(m.group(1))
    return None

def american(r):
    p = r.get('price')
    if isinstance(p, (int, float)) and p != 0: return float(p)
    m = re.search(r'\(([+-]\d{3,4})\)', f"{r.get('selection')} {r.get('side')}")
    if m: return float(m.group(1))
    return None

LAST = {}
def grade(r, week):
    LAST.clear()
    g = find_game(week, r.get('game'))
    if not g: return None, 'no game'
    mk = r.get('market')
    a, h = g['away'], g['home']
    if mk in ('total', 'totals'):
        sd = f"{r.get('side') or ''} {r.get('selection') or ''}".lower()
        line = r.get('line')
        if line is None:
            m = re.search(r'(\d{2}(?:\.\d)?)', sd); line = float(m.group(1)) if m else None
        if line is None or not ('over' in sd or 'under' in sd): return None, 'total unparsed'
        tot = a[1] + h[1]
        if tot == line: return 'push', None
        return ('win' if (tot > line) == ('over' in sd) else 'loss'), None
    if mk in ('spread', 'moneyline'):
        t = team_of(r.get('side'), r.get('selection'))
        if not t: return None, 'team unparsed'
        mine, opp = (a, h) if a[0] == t else (h, a) if h[0] == t else (None, None)
        if not mine: return None, 'team not in game'
        margin = mine[1] - opp[1]
        if mk == 'moneyline':
            return ('win' if margin > 0 else 'push' if margin == 0 else 'loss'), None
        line = r.get('line')
        if not isinstance(line, (int, float)):
            m = re.search(r'([+-]?\d+(?:\.\d)?)', str(r.get('selection')))
            line = float(m.group(1)) if m else None
        if line is None: return None, 'spread line unparsed'
        v = margin + float(line)
        return ('win' if v > 0 else 'push' if v == 0 else 'loss'), None
    if mk == 'prop':
        p = parse_prop(r)
        if not p: return None, 'prop unparsed/excluded'
        pl = player_of(r, g)
        LAST.clear(); LAST.update({'parsed': p, 'player': pl})
        if not pl: return None, 'player not in box (likely DNP; excluded, books void)'
        stat, d, line = p
        v = g['players'][pl].get(stat, 0.0); LAST['value'] = v
        if v == line: return 'push', None
        return ('win' if (v > line) == (d == 'over') else 'loss'), None
    return None, 'market not graded'

def source_key(r):
    ps = [p for p in (r.get('persons') or []) if p]
    return ' / '.join(ps) if ps else (r.get('outlet') or '?')

rows = []
for w in (4, 5, 6, 7):
    d = json.load(open(os.path.join(ROOT, f'data/generated/master-intel/w{w:02d}-expert-verified.json')))
    seen = set()
    for r in d['rows']:
        if r.get('verdict') != 'verified': continue
        k = (source_key(r), r.get('game'), (r.get('selection') or '').lower(), (r.get('side') or '').lower())
        if k in seen: continue
        seen.add(k)
        res, why = grade(r, w)
        rows.append({'week': w, 'source': source_key(r), 'outlet': r.get('outlet'), 'kind': r.get('kind'), 'game': r.get('game'), 'market': r.get('market'),
                     'selection': r.get('selection'), 'side': r.get('side'), 'price': american(r), 'best_bet': r.get('best_bet'), 'result': res, 'note': why,
                     'parsed': LAST.get('parsed'), 'matched_player': LAST.get('player'), 'value': LAST.get('value')})

def summarize(rs):
    g = [x for x in rs if x['result'] in ('win', 'loss', 'push')]
    w = sum(x['result'] == 'win' for x in g); l = sum(x['result'] == 'loss' for x in g); p = sum(x['result'] == 'push' for x in g)
    priced = [x for x in g if x['price'] and x['result'] != 'push']
    units = 0.0
    for x in priced:
        pr = x['price']; units += (pr / 100 if pr > 0 else 100 / -pr) if x['result'] == 'win' else -1
    return {'graded': len(g), 'w': w, 'l': l, 'p': p, 'hit': round(w / (w + l), 3) if w + l else None,
            'priced_n': len(priced), 'units_at_price': round(units, 2), 'roi_priced': round(units / len(priced), 3) if priced else None}

by = collections.defaultdict(list)
for x in rows: by[x['source']].append(x)
summary = {s: summarize(v) for s, v in by.items()}
by_mkt = collections.defaultdict(list)
for x in rows: by_mkt[(x['source'], x['market'])].append(x)
json.dump({'rows': rows, 'by_source': summary, 'by_source_market': {f'{k[0]}|{k[1]}': summarize(v) for k, v in by_mkt.items()},
           'unparsed': collections.Counter(x['note'] for x in rows if x['result'] is None)},
          open(os.path.join(OUT, 'expert-history-graded-w04-w07.json'), 'w'), indent=1, default=str)
tot = summarize(rows)
print('ALL', tot, 'ungraded', sum(x['result'] is None for x in rows), collections.Counter(x['note'] for x in rows if x['result'] is None).most_common(6))
for s, v in sorted(summary.items(), key=lambda kv: -kv[1]['graded'])[:45]:
    print(f"{s[:45]:45s} {v}")
