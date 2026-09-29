"""Claude Team 2 season analysis: shared library.

Reads the settled wagers file (data/official-picks/user-placed-wagers-2026.json, gitignored) and the cached ESPN
summary box scores (data/fantasy/boxscores/espn-<eventId>.json). Read-only on both unless a caller explicitly writes.

Leg grading rules match the project rules: a player missing from the final box score = lost leg; 'N+' selections
need stat >= N; otherwise over = stat > line, under = stat < line, equality = push.
"""
import json, glob, os, re, math, unicodedata, collections, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
WAGERS = os.path.join(ROOT, 'data/official-picks/user-placed-wagers-2026.json')
BOX = os.path.join(ROOT, 'data/fantasy/boxscores')
HERE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(HERE, 'out')
FIX = {'WAS': 'WSH', 'LA': 'LAR', 'LVR': 'LV', 'NOS': 'NO', 'JAC': 'JAX'}


def T(a): return FIX.get((a or '').upper(), (a or '').upper())


def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    s = re.sub(r"[\.'’]", "", s); s = re.sub(r"\b(jr|sr|ii|iii|iv)\b", "", s)
    return ' '.join(re.sub(r"[^a-z ]", " ", s).split())


def jl(p): return json.load(open(p, encoding='utf-8'))


def num(x):
    try: return float(str(x).replace('−', '-'))
    except (TypeError, ValueError): return 0.0


def dec(p):
    """American ('+150', -110) or multiplier ('1.53x') -> decimal odds, else None."""
    if p is None: return None
    s = str(p).strip().split(' ')[0]
    if s.endswith('x'):
        try: return float(s[:-1])
        except ValueError: return None
    try: v = float(s.replace('+', ''))
    except ValueError: return None
    if abs(v) < 100: return None
    return 1 + v / 100 if v > 0 else 1 + 100 / abs(v)


def wilson(w, n, z=1.96):
    if n == 0: return (0.0, 1.0)
    p = w / n; d = 1 + z * z / n; c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0, c - h), min(1, c + h))


def zscore(w, n, p0):
    if n == 0 or not (0 < p0 < 1): return 0.0
    return (w - n * p0) / math.sqrt(n * p0 * (1 - p0))


def ztwo(w1, n1, w2, n2):
    """Two-proportion z (pooled)."""
    if not n1 or not n2: return 0.0
    p = (w1 + w2) / (n1 + n2)
    if p in (0, 1): return 0.0
    return (w1 / n1 - w2 / n2) / math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))


def evidence(z):
    a = abs(z)
    return 'strong (≥2 SE)' if a >= 2 else ('hypothesis (1.5–2 SE)' if a >= 1.5 else 'hypothesis (<1.5 SE)')


# ------------------------------------------------------------------ box scores
def _stats(d):
    players = {}; team = collections.defaultdict(collections.Counter)
    for tb in d.get('boxscore', {}).get('players', []):
        ab = T(tb['team']['abbreviation'])
        for c in tb.get('statistics', []):
            labels = c.get('labels') or []
            for ath in c.get('athletes', []):
                nm = ath['athlete']['displayName']; p = players.setdefault(nm, {'team': ab})
                st = dict(zip(labels, ath.get('stats', []))); p[c['name']] = st
                if c['name'] == 'passing':
                    ca = (st.get('C/ATT') or '0/0').split('/'); team[ab]['patt'] += num(ca[1] if len(ca) > 1 else 0)
                if c['name'] == 'rushing': team[ab]['ratt'] += num(st.get('CAR'))
    return players, team


def load_games(weeks=None):
    G = {}
    for f in sorted(glob.glob(os.path.join(BOX, 'espn-*.json'))):
        try: d = jl(f)
        except Exception: continue
        h = d.get('header', {}); comp = (h.get('competitions') or [{}])[0]
        cs = {c.get('homeAway'): c for c in comp.get('competitors', [])}
        if 'away' not in cs or 'home' not in cs: continue
        wk = h.get('week'); season = (h.get('season') or {}).get('year')
        if season and season != 2026: continue
        if weeks and wk not in weeks: continue
        a = T(cs['away']['team']['abbreviation']); hm = T(cs['home']['team']['abbreviation'])
        names = {}
        for side in ('away', 'home'):
            tm = cs[side]['team']; ab = T(tm['abbreviation'])
            for k in ('displayName', 'shortDisplayName', 'name', 'location', 'abbreviation'):
                if tm.get(k): names[norm(tm[k])] = ab
        ls = {k: [num(x.get('value', x.get('displayValue'))) for x in cs[k].get('linescores', [])] for k in cs}
        players, team = _stats(d)
        sc = [dict(text=s.get('text', ''), team=T(s['team']['abbreviation']), type=s['type']['text'], q=s['period']['number'])
              for s in d.get('scoringPlays', [])]
        st = comp.get('status', {}).get('type', {})
        g = dict(week=wk, event=os.path.basename(f)[5:-5], away=a, home=hm, key=f'{a}@{hm}', done=bool(st.get('completed')),
                 status=st.get('detail') or st.get('description'), names=names,
                 score={a: num(cs['away'].get('score')), hm: num(cs['home'].get('score'))},
                 half={a: sum(ls.get('away', [])[:2]), hm: sum(ls.get('home', [])[:2])},
                 players=players, team={k: dict(v) for k, v in team.items()}, scoring=sc)
        prev = G.get((wk, g['key']))
        if not prev or (g['done'] and not prev['done']): G[(wk, g['key'])] = g
    return G


def game_for(G, week, gstr):
    m = re.match(r'\s*([A-Za-z]{2,3})\s*@\s*([A-Za-z]{2,3})\b', gstr or '')
    if not m: return None
    a, h = T(m.group(1)), T(m.group(2))
    return G.get((week, f'{a}@{h}')) or G.get((week, f'{h}@{a}'))


def player_in(g, name):
    if not g or not name: return None, None
    n = norm(name)
    for pn, p in g['players'].items():
        if norm(pn) == n: return pn, p
    for pn, p in g['players'].items():
        q = norm(pn).split(); nn = n.split()
        if q and nn and q[-1] == nn[-1] and q[0][0] == nn[0][0]: return pn, p
    return None, None


def player_tds(p):
    t = 0.0
    for c in ('rushing', 'receiving', 'kickReturns', 'puntReturns', 'interceptions', 'defensive'):
        t += num((p.get(c) or {}).get('TD'))
    return t


def td_plays(g):
    out = []
    for s in g['scoring']:
        ty = s['type']
        if any(x in ty for x in ('Field Goal', 'Safety', 'Two-Point', 'Extra Point')): continue
        t = s['text']; m0 = re.search(r"lateral to (.+?) for \d+", t)
        m = m0 or re.match(r"(.+?)\s+\d+\s+Yd", t) or re.match(r"(.+?)\s+(?:Fumble|Blocked|Interception|Kickoff|Punt)", t)
        if m: out.append((m.group(1).strip(), s['team']))
    return out


# ------------------------------------------------------------------ legs
MKT = {'spread': 'spread', 'moneyline': 'ml', 'total': 'total', 'alternate_total_points': 'total', 'team_total': 'team_total',
       'anytime_touchdown': 'atd', 'anytime_td': 'atd', 'touchdowns': 'atd', 'first_touchdown': 'first_td',
       'receiving_yards': 'rec_yds', 'receptions': 'rec', 'rushing_yards': 'rush_yds', 'carries': 'carries', 'rush_attempts': 'carries',
       'passing_touchdowns': 'pass_td', 'passing_tds': 'pass_td', 'passing_yards': 'pass_yds', 'pass_attempts': 'pass_att',
       'completions': 'completions', 'pass_completions': 'completions', 'pass_interceptions': 'int_thrown',
       'interceptions_thrown': 'int_thrown', 'sacks': 'sacks', 'tackles_assists': 'tackles', 'field_goals_made': 'fgm',
       'open_slot': 'open'}
QBRUSH = {'jordan love', 'tyler shough', 'lamar jackson', 'baker mayfield', 'jalen hurts', 'josh allen', 'brock purdy', 'drake maye',
          'jaxson dart', 'malik willis', 'jayden daniels', 'justin fields', 'kyler murray', 'anthony richardson', 'bo nix', 'caleb williams'}


def norm_leg(l, w):
    m = (l.get('market') or '').lower(); sel = l.get('selection') or ''; sl = sel.lower()
    key = MKT.get(m)
    if m == 'interceptions': key = 'int_thrown' if 'pass int' in sl else 'def_int'
    if key is None:
        if 'ml' in sl.split() or 'moneyline' in sl: key = 'ml'
        elif re.search(r'[+-]\d', sel) and not l.get('player'): key = 'spread'
        else: key = 'other'
    gm = l.get('game') or w.get('game') or ''
    if '(cfb)' in gm.lower() or 'cfb' in (w.get('game_title') or '').lower() and key in ('spread', 'ml', 'total', 'other') and ' @ ' in gm and len(gm) > 12:
        key = 'cfb'
    kind = key if key in ('spread', 'ml', 'total', 'team_total', 'open', 'other', 'cfb') else 'prop'
    dirn = (l.get('direction') or ('under' if re.search(r'\bunder\b', sl) else 'over')).lower()
    mm = re.search(r'(\d+)\+', sel); need = int(mm.group(1)) if mm else None
    if key == 'int_thrown' and 'at least 1' in sl: need = 1
    line = l.get('line')
    try: line = float(line) if line is not None else None
    except (TypeError, ValueError): line = None
    if key == 'atd' and need and need >= 2: key = 'tds'
    return dict(kind=kind, key=key, dir=dirn, need=need, line=line, player=l.get('player'),
                team=T(l.get('team')) if l.get('team') else None, game=gm, sel=sel, price=l.get('price'), dec=dec(l.get('price')))


def category(n):
    k = n['key']
    if k == 'ml': return 'Moneyline (fav)' if (n['dec'] or 2) < 2 else 'Moneyline (dog)'
    if k == 'spread': return 'Spread (fav)' if (n['line'] or 0) < 0 else 'Spread (dog)'
    if k == 'total': return 'Total Under' if n['dir'] == 'under' else 'Total Over'
    if k == 'rush_yds' and norm(n['player']) in QBRUSH: return 'QB rushing yds'
    return {'team_total': 'Team total', 'cfb': 'CFB', 'rush_yds': 'Rushing yds', 'carries': 'Carries', 'rec': 'Receptions',
            'rec_yds': 'Receiving yds', 'pass_td': 'Passing TDs', 'pass_yds': 'QB volume', 'pass_att': 'QB volume',
            'completions': 'QB volume', 'int_thrown': 'QB INT thrown', 'sacks': 'Sacks', 'tackles': 'Tackles+Ast',
            'def_int': 'Defensive INT', 'atd': 'Anytime TD', 'tds': '2+ TD', 'first_td': 'First TD', 'fgm': 'Kicker FGs',
            'open': 'Open slot', 'other': 'Other'}.get(k, k)


SIDECATS = {'Moneyline (fav)', 'Moneyline (dog)', 'Spread (fav)', 'Spread (dog)', 'Total Under', 'Total Over', 'Team total', 'CFB'}


def group(c):
    if c in SIDECATS: return 'side/total'
    if c in ('Anytime TD', '2+ TD', 'First TD'): return 'TD scorer'
    if c in ('Sacks', 'Tackles+Ast', 'Defensive INT'): return 'defense'
    if c in ('Passing TDs', 'QB volume', 'QB INT thrown', 'QB rushing yds'): return 'QB'
    if c in ('Open slot', 'Other'): return 'other'
    return 'volume/yardage'


PROPSTAT = {'rec': ('receiving', 'REC'), 'rec_yds': ('receiving', 'YDS'), 'rush_yds': ('rushing', 'YDS'), 'carries': ('rushing', 'CAR'),
            'pass_td': ('passing', 'TD'), 'pass_yds': ('passing', 'YDS'), 'int_thrown': ('passing', 'INT'), 'sacks': ('defensive', 'SACKS'),
            'tackles': ('defensive', 'TOT'), 'def_int': ('interceptions', 'INT')}


def team_of(n, g):
    if n.get('team') and n['team'] in g['score']: return n['team']
    s = norm(re.sub(r'(?i)\b(ml|moneyline|team total|total points|over|under)\b|[+-]?\d+(\.\d+)?', ' ', n['sel']))
    for nm, ab in sorted(g['names'].items(), key=lambda x: -len(x[0])):
        if nm and (s == nm or s.startswith(nm + ' ') or s.startswith(nm)): return ab
    return None


def _cmp(stat, n):
    if n['need'] is not None and n['dir'] != 'under': return 'WON' if stat >= n['need'] else 'LOST'
    ln = n['line']
    if ln is None: return 'WON' if stat >= 1 else 'LOST'
    if stat == ln: return 'PUSH'
    return 'WON' if ((stat > ln) if n['dir'] != 'under' else (stat < ln)) else 'LOST'


def grade(n, g):
    """-> (status, actual_stat_text, margin) ; status None when ungradable (text says why)."""
    if not g: return None, 'no box score', None
    if not g['done']: return None, f"game not final ({g.get('status')})", None
    k = n['key']
    if k in ('spread', 'ml', 'team_total'):
        tm = team_of(n, g)
        if not tm: return None, 'team not resolved', None
        opp = [x for x in g['score'] if x != tm][0]; mg = g['score'][tm] - g['score'][opp]
        txt = f"{tm} {int(g['score'][tm])}-{int(g['score'][opp])}"
        if k == 'ml': return ('WON' if mg > 0 else ('PUSH' if mg == 0 else 'LOST')), txt, mg
        if k == 'spread':
            v = mg + (n['line'] or 0); return ('WON' if v > 0 else ('PUSH' if v == 0 else 'LOST')), txt, v
        s = g['score'][tm]; return _cmp(s, n), f"{tm} {int(s)}", s - (n['line'] or 0)
    if k == 'total':
        s = sum(g['score'].values()); return _cmp(s, n), f"total {int(s)}", s - (n['line'] or 0)
    if k == 'first_td':
        tp = td_plays(g)
        if not tp: return 'LOST', 'no TD scored', None
        who = tp[0][0]; hit = norm(who) == norm(n['player']) or norm(who).split()[-1:] == norm(n['player']).split()[-1:]
        return ('WON' if hit else 'LOST'), f"{who} ({tp[0][1]}) scored 1st TD", None
    if n['kind'] != 'prop': return None, f'unsupported market {k}', None
    pn, p = player_in(g, n['player'])
    if not p: return 'LOST', 'not in box score (DNP = lost leg)', None
    if k in ('atd', 'tds'):
        s = player_tds(p)
    elif k in ('pass_att', 'completions'):
        ca = ((p.get('passing') or {}).get('C/ATT') or '0/0').split('/'); s = num(ca[1] if k == 'pass_att' else ca[0])
    elif k == 'fgm':
        s = num(((p.get('kicking') or {}).get('FG') or '0/0').split('/')[0])
    elif k in PROPSTAT:
        c, lab = PROPSTAT[k]; s = num((p.get(c) or {}).get(lab))
    else:
        return None, f'unsupported prop {k}', None
    st = _cmp(s, n); thr = n['need'] if n['need'] is not None else (n['line'] if n['line'] is not None else 0.5)
    return st, (str(int(s)) if s == int(s) else str(s)), s - thr


# ------------------------------------------------------------------ tickets
def load_wagers(): return jl(WAGERS)


def is_cash(w):
    return not (w.get('funding_type') in ('promo_credit', 'free_bet') or w.get('is_promo_credit'))


def real_legs(w): return [l for l in (w.get('legs') or []) if (l.get('market') or '') != 'open_slot']


def n_legs(w): return len(real_legs(w))


def slot_of(l):
    m = re.match(r'(\d\d)/(\d\d)/(\d{4}) @ (\d\d):(\d\d) (AM|PM)', l.get('game_start') or '')
    if not m: return None
    mo, d, y, hh, mi, ap = m.groups(); hh = int(hh) % 12 + (12 if ap == 'PM' else 0)
    wd = datetime.datetime(int(y), int(mo), int(d), hh, int(mi)).strftime('%a')
    if wd == 'Thu': return 'TNF'
    if wd == 'Mon': return 'MNF'
    if wd == 'Sun': return 'SNF' if hh >= 17 else 'Sunday'
    return wd


FAMILIES = ['Game-line parlay', '2-team RR', '4-team master RR', 'Teaser', 'Single', 'Prop parlay / stack',
            'Island SGP ladder (TNF/SNF/MNF)', 'Promo / trade credit']


def family(w):
    ty = (w.get('ticket_type') or '').lower(); legs = real_legs(w)
    if not is_cash(w): return 'Promo / trade credit'
    if w.get('round_robin') or 'round robin' in ty:
        return '4-team master RR' if (w.get('round_robin') or {}).get('teams_per_combination') == 4 else '2-team RR'
    if 'teaser' in ty: return 'Teaser'
    if len(legs) <= 1: return 'Single'
    ns = [norm_leg(l, w) for l in legs]
    if not any(n['kind'] == 'prop' for n in ns): return 'Game-line parlay'
    games = {re.sub(r'[^A-Z@]', '', (n['game'] or '').upper()) for n in ns}
    tag = ((w.get('game') or '') + ' ' + (w.get('game_title') or '')).upper()
    island = {slot_of(l) for l in legs} & {'TNF', 'SNF', 'MNF'} or any(x in tag for x in ('TNF', 'SNF', 'MNF'))
    if len(games) == 1 and island: return 'Island SGP ladder (TNF/SNF/MNF)'
    return 'Prop parlay / stack'


BANDS = ['≤ +150', '+151 to +400', '+401 to +1000', '+1001 to +3000', '> +3000', 'RR (n/a)', 'unknown']


def ticket_dec(w):
    d = w.get('odds_decimal') or dec(w.get('odds_american'))
    if not d and w.get('potential_payout_usd') and w.get('stake_usd'): d = w['potential_payout_usd'] / w['stake_usd']
    return d


def price_band(w):
    if w.get('round_robin') or 'round robin' in (w.get('ticket_type') or '').lower(): return 'RR (n/a)'
    d = ticket_dec(w)
    if not d: return 'unknown'
    a = (d - 1) * 100
    for hi, lab in ((150, '≤ +150'), (400, '+151 to +400'), (1000, '+401 to +1000'), (3000, '+1001 to +3000'), (1e12, '> +3000')):
        if a <= hi: return lab


LEGB = ['1', '2', '3', '4', '5-6', '7+', 'RR']


def legs_bucket(w):
    if w.get('round_robin'): return 'RR'
    n = n_legs(w)
    return '1' if n <= 1 else str(n) if n <= 4 else ('5-6' if n <= 6 else '7+')


def cash_stake(w): return float(w.get('stake_usd') or 0) if is_cash(w) else 0.0


def cash_return(w): return float(w.get('settled_payout_usd') or 0) if is_cash(w) else 0.0


def credit_return(w): return 0.0 if is_cash(w) else float(w.get('settled_payout_usd') or 0)
