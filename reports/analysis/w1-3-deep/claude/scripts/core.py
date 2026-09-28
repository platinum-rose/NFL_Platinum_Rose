"""Claude Team 2 core loader: Team 1 baseline legs (cum.json) + AI-only/paper legs, enriched with ESPN
box-score context and BEO board prices. All paths repo-relative. Read-only on inputs."""
import json, glob, os, re, math, unicodedata, collections
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
SR = os.path.join(ROOT, 'reports/bets/season-recap'); W3R = os.path.join(ROOT, 'reports/bets/week3-recap')
OUT = os.path.join(ROOT, 'reports/analysis/w1-3-deep/claude')
FIX = {'WAS': 'WSH', 'LA': 'LAR', 'LVR': 'LV', 'NOS': 'NO', 'JAC': 'JAX'}
def T(a): return FIX.get(a, a)
def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    s = re.sub(r"[\.'’]", "", s); s = re.sub(r"\b(jr|sr|ii|iii|iv)\b", "", s)
    return ' '.join(re.sub(r"[^a-z ]", " ", s).split())
def jl(p): return json.load(open(p, encoding='utf-8'))
def num(x):
    try: return float(str(x).split('/')[0])
    except ValueError:
        try: return float(str(x).split('-')[0])
        except ValueError: return 0.0
def dec(p):
    try: p = float(str(p).replace('+', ''))
    except (TypeError, ValueError): return None
    if p == 0: return None
    return 1 + p / 100 if p > 0 else 1 + 100 / abs(p)
def amer(d):
    if not d: return None
    return round((d - 1) * 100) if d >= 2 else round(-100 / (d - 1))
def wilson(w, n, z=1.96):
    if n == 0: return (0.0, 1.0)
    p = w / n; d = 1 + z * z / n; c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0, c - h), min(1, c + h))
def zscore(w, n, p0):
    """z of observed hit count vs a reference rate p0 (binomial normal approx)."""
    if n == 0 or p0 <= 0 or p0 >= 1: return 0.0
    return (w - n * p0) / math.sqrt(n * p0 * (1 - p0))
def evidence(z):
    a = abs(z)
    return 'strong' if a >= 2 else ('moderate (hypothesis)' if a >= 1.5 else 'weak (hypothesis)')

# ---------------- games
def load_games():
    G = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'data/fantasy/boxscores/espn-*.json'))):
        d = jl(f); h = d.get('header', {}); comp = (h.get('competitions') or [{}])[0]
        cs = {c['homeAway']: c for c in comp.get('competitors', [])}
        if 'away' not in cs: continue
        a = T(cs['away']['team']['abbreviation']); hm = T(cs['home']['team']['abbreviation'])
        ls = {k: [num(x.get('value', x.get('displayValue'))) for x in cs[k].get('linescores', [])] for k in cs}
        players = {}; team = collections.defaultdict(collections.Counter)
        for tb in d.get('boxscore', {}).get('players', []):
            ab = T(tb['team']['abbreviation'])
            for c in tb.get('statistics', []):
                labels = c.get('labels') or []
                for ath in c.get('athletes', []):
                    nm = ath['athlete']['displayName']; p = players.setdefault(nm, {'team': ab})
                    st = dict(zip(labels, ath.get('stats', []))); p[c['name']] = st
                    if c['name'] == 'passing': team[ab]['patt'] += num((st.get('C/ATT') or '0/0').split('/')[1])
                    if c['name'] == 'rushing': team[ab]['ratt'] += num(st.get('CAR'))
        sc = [dict(text=s['text'], team=T(s['team']['abbreviation']), type=s['type']['text'], q=s['period']['number'])
              for s in d.get('scoringPlays', [])]
        g = dict(week=h.get('week'), away=a, home=hm, key=f'{a}@{hm}', done=comp.get('status', {}).get('type', {}).get('completed'),
                 score={a: num(cs['away'].get('score')), hm: num(cs['home'].get('score'))},
                 half={a: sum(ls.get('away', [])[:2]), hm: sum(ls.get('home', [])[:2])},
                 players=players, team={k: dict(v) for k, v in team.items()}, scoring=sc)
        G[(g['week'], g['key'])] = g
    return G
def game_for(G, week, gstr):
    if not gstr: return None
    m = re.match(r'\s*([A-Za-z]{2,3})\s*@\s*([A-Za-z]{2,3})', gstr)
    if not m: return None
    a, h = T(m.group(1).upper()), T(m.group(2).upper())
    return G.get((week, f'{a}@{h}')) or G.get((week, f'{h}@{a}'))
def player_in(g, name):
    if not g or not name: return None, None
    n = norm(name)
    for pn, p in g['players'].items():
        if norm(pn) == n: return pn, p
    for pn, p in g['players'].items():
        q = norm(pn).split()
        if q and n.split() and q[-1] == n.split()[-1] and q[0][0] == n[0]: return pn, p
    return None, None
def td_scorers(g):
    out = []
    for s in g['scoring']:
        if 'Field Goal' in s['type'] or 'Safety' in s['type'] or 'Two-Point' in s['type']: continue
        t = s['text']; m0 = re.search(r"lateral to (.+?) for \d+", t)
        m = m0 or re.match(r"(.+?)\s+\d+\s+Yd", t) or re.match(r"(.+?)\s+(?:Fumble|Blocked|Interception|Kickoff|Punt)", t)
        if m: out.append((m.group(1).strip(), s['team']))
    return out

# ---------------- legs
QBRUSH = {'Jordan Love', 'Tyler Shough', 'Lamar Jackson', 'Baker Mayfield', 'Jalen Hurts', 'Josh Allen', 'Brock Purdy', 'Drake Maye', 'Jaxson Dart', 'Malik Willis'}
SIDES = ('Moneyline (fav)', 'Moneyline (dog)', 'Spread (fav)', 'Spread (dog)', 'Total Under', 'Total Over', 'Team total', 'CFB', 'Half total')
def cat(l):
    k = l['kind']
    if k == 'ml': return 'Moneyline (fav)' if (dec(l.get('price')) or 2) < 2 else 'Moneyline (dog)'
    if k == 'spread': return 'Spread (fav)' if (l.get('thr') or 0) < 0 else 'Spread (dog)'
    if k == 'total': return 'Total Under' if l.get('dir') == 'under' else 'Total Over'
    if k == 'team_total': return 'Team total'
    if k == 'cfb': return 'CFB'
    if k == 'half_total': return 'Half total'
    key = l.get('key')
    if key == 'atd' and (l.get('thr') or 1) >= 2: key = 'tds'
    if key == 'rush_yds' and l.get('player') in QBRUSH: return 'QB rushing yds'
    return {'rush_yds': 'Rushing yds', 'carries': 'Carries', 'rec': 'Receptions', 'rec_yds': 'Receiving yds', 'pass_td': 'Passing TDs',
            'pass_yds': 'QB volume', 'pass_att': 'QB volume', 'completions': 'QB volume', 'int_thrown': 'QB INT thrown',
            'sacks': 'Sacks', 'tackles': 'Tackles+Ast', 'def_int': 'Defensive INT', 'atd': 'Anytime TD', 'tds': '2+ TD',
            'first_td': 'First TD', 'fgm': 'Kicker FGs'}.get(key, key or 'Other')
def group(c):
    if c in SIDES: return 'side/total'
    if c in ('Anytime TD', '2+ TD', 'First TD'): return 'TD scorer'
    if c in ('Sacks', 'Tackles+Ast', 'Defensive INT'): return 'defense'
    if c in ('Passing TDs', 'QB volume', 'QB INT thrown', 'QB rushing yds'): return 'QB'
    return 'volume/yardage'
def ukey(l):
    who = norm(l.get('player')) if l.get('player') else (l.get('team') or l.get('label'))
    return (l['week'], l.get('game'), l['kind'], who, l.get('key'), l.get('dir'), l.get('thr'))

BOARDMAP = {'rec': 'rec', 'rec_yds': 'rec_yds', 'rush_yds': 'rush_yds', 'carries': 'carries', 'pass_yds': 'pass_yds', 'pass_td': 'pass_td',
            'completions': 'pass_cmp', 'pass_att': 'pass_att', 'tackles': 'tackles_assists', 'sacks': 'sacks', 'def_int': 'def_int',
            'int_thrown': 'pass_int', 'atd': 'atd', 'first_td': 'first_td'}
def load_boards():
    B = {}
    files = {2: ['props/beo.json', 'props/props.json'], 3: ['props/beo-w03-0927_0320.json', 'props/beo-w03.json']}
    for w, fs in files.items():
        for f in fs:
            p = os.path.join(ROOT, 'data/generated', f)
            if not os.path.exists(p): continue
            for r in jl(p):
                if r.get('odds') is None: continue
                k = (w, norm(r['player']), r['market'], None if r['line'] is None else float(r['line']))
                B.setdefault(k, r['odds'])
    return B
def board_price(B, week, player, key, thr, dirn='over'):
    m = BOARDMAP.get(key)
    if not m or not player or dirn == 'under': return None
    n = norm(player)
    if key == 'first_td': return B.get((week, n, m, None))
    if key == 'atd': return B.get((week, n, m, float(thr or 1)))
    if thr is None: return None
    for t in (float(thr), float(thr) + 0.5, float(math.ceil(float(thr))), float(thr) - 0.5):
        v = B.get((week, n, m, t))
        if v is not None: return v
    return None

def enrich(l, G, B):
    l['cat'] = cat(l); l['grp'] = group(l['cat'])
    l['dec'] = dec(l.get('price')); l['price_src'] = 'ticket' if l['dec'] else None
    if not l['dec'] and l['kind'] == 'prop':
        bp = board_price(B, l['week'], l.get('player'), l.get('key'), l.get('thr'), l.get('dir'))
        if bp is not None: l['dec'] = dec(bp); l['price_src'] = 'BEO board'; l['board_price'] = bp
    g = game_for(G, l['week'], l.get('game')); l['_g'] = g['key'] if g else None
    if g and l['kind'] == 'prop':
        pn, p = player_in(g, l.get('player'))
        tm = (p or {}).get('team') or l.get('team'); l['team'] = tm
        if tm in g['score']:
            opp = [x for x in g['score'] if x != tm][0]
            l['team_margin'] = g['score'][tm] - g['score'][opp]; l['half_margin'] = g['half'][tm] - g['half'][opp]
            l['team_patt'] = g['team'].get(tm, {}).get('patt'); l['team_ratt'] = g['team'].get(tm, {}).get('ratt')
            l['opp_patt'] = g['team'].get(opp, {}).get('patt'); l['opp_ratt'] = g['team'].get(opp, {}).get('ratt')
        if p:
            l['tg'] = num((p.get('receiving') or {}).get('TGTS')); l['car'] = num((p.get('rushing') or {}).get('CAR'))
            l['recs'] = num((p.get('receiving') or {}).get('REC'))
        l['dnp'] = p is None
        tds = td_scorers(g); l['game_tds'] = len(tds); l['team_tds'] = sum(1 for _, t in tds if t == tm)
    elif g:
        l['game_total'] = sum(g['score'].values())
    return l

def load_all():
    G = load_games(); B = load_boards()
    C = jl(os.path.join(SR, 'cum.json'))
    tickets = C['T']; legs = C['L']
    wl = {1: jl(os.path.join(SR, 'w1legs.json')), 2: jl(os.path.join(SR, 'w2legs.json')), 3: jl(os.path.join(W3R, 'w3legs.json'))}
    ai_only = []
    for w, d in wl.items():
        for l in d['ai_only']:
            l = dict(l); l['week'] = w; l['origin'] = 'ai_only'; l.setdefault('price', None); ai_only.append(l)
    paper = {1: jl(os.path.join(SR, 'w1paper.json')), 2: jl(os.path.join(SR, 'w2paper.json')), 3: jl(os.path.join(W3R, 'w3paper.json'))}
    for l in legs + ai_only: enrich(l, G, B)
    return dict(G=G, B=B, tickets=tickets, legs=legs, ai_only=ai_only, paper=paper)

def unique_positions(legs):
    U = collections.OrderedDict()
    for l in legs:
        k = ukey(l)
        if k not in U: U[k] = dict(l, n=0, tids=[])
        U[k]['n'] += 1; U[k]['tids'].append(l.get('tid'))
        if not U[k].get('dec') and l.get('dec'): U[k]['dec'] = l['dec']
    return list(U.values())
# Team 1's verified cash returns (all six paying tickets, W1-3 excl. MNF). Everything else returned $0.
RET = {'bet_20260906_bm_738317559_2team': 50.86, 'bet_20260909_bm_738444813_2team': 29.70, 'bet_20260917_738851934_bkr_sgp_2team': 70.02,
       'bet_20260920_739004327_bm_compact_round_robin': 44.83, 'bet_20260920_739003867_bm_compact_round_robin': 16.39,
       'bet_20260926_739358766_bm_compact_round_robin': 39.21}
def struct(t):
    ty = (t.get('type') or '').lower(); n = len(t['legs'])
    if 'round robin' in ty: return '4-team master RR' if '4-team' in ty else '2-team RR'
    if 'teaser' in ty: return 'teaser'
    if n <= 2: return '1-2 legs'
    if n <= 4: return '3-4 legs'
    if n <= 6: return '5-6 legs'
    return '7+ legs'
def is_cash(t):
    return not (t.get('funding') in ('promo_credit', 'free_bet') or 'novig' in (t.get('id') or ''))
