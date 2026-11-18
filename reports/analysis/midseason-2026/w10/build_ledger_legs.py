"""One row per placed NFL leg (W1-10) straight from the ledger, with price, category, re-graded result and margin,
team closing spread/total (ESPN pickcenter DK close) and ticket context. Read-only. Output: w10/ledger_legs.jsonl"""
import json, sys, collections, re
sys.path.insert(0, 'reports/analysis/season/claude/scripts'); sys.path.insert(0, 'reports/analysis/midseason-2026')
import lib, tw
G = lib.load_games(); W = lib.load_wagers()
CL = {}
for g in tw.games():
    c = g['closing'] or {}
    for side, sgn in (('home', 1), ('away', -1)):
        CL[(g['week'], lib.T(g[side]))] = dict(spread=None if c.get('home_spread_close') is None else sgn * c['home_spread_close'], total=c.get('total_close'),
                                              open_spread=None if c.get('home_spread_open') is None else sgn * c['home_spread_open'], open_total=c.get('total_open'),
                                              ml=c.get(side + '_ml_close'), date=g['date'], opp=lib.T(g['away' if side == 'home' else 'home']), home=side == 'home')
def partner(w):
    s = w.get('ownership_shares') or {}
    try:
        if float(s.get('Alejandro') or 0) > 0: return 'Alejandro'
        if float(s.get('Amanda') or 0) > 0: return 'Amanda'
    except (TypeError, ValueError): pass
    sp = str(w.get('split_partner'))
    return 'Alejandro' if 'lejandro' in sp else 'Amanda' if 'manda' in sp else None
rows = []
for w in W:
    wk = w.get('week')
    if not wk or wk > 10 or w.get('status') != 'SETTLED': continue
    for l in lib.real_legs(w):
        n = lib.norm_leg(l, w)
        if n['kind'] == 'cfb' or n['key'] in ('open', 'other') or l.get('sport'): continue
        g = lib.game_for(G, wk, n['game'])
        st, txt, mg = lib.grade(n, g)
        stored = str(l.get('status')).upper(); half = bool(l.get('period')) or re.search(r'half|1h|2h', str(l.get('market')).lower())
        res = stored if (half or st is None) else st
        if res not in ('WON', 'LOST', 'PUSH'): continue
        team = n.get('team')
        if not team and g and n.get('player'):
            pn, p = lib.player_in(g, n['player']); team = p and p.get('team')
        if not team and g and n['kind'] != 'prop': team = lib.team_of(n, g)
        cl = CL.get((wk, team)) or {}
        rows.append(dict(week=wk, ticket=w['id'], book=w.get('book'), family=lib.family(w), cash=lib.is_cash(w), exempt=bool(w.get('bankroll_exempt')), partner=partner(w),
                         n_legs=lib.n_legs(w), ticket_result=w.get('result'), placed_at=w.get('placed_at'), card_section=w.get('card_section'),
                         game=n['game'], player=n['player'], team=team, key=n['key'], cat=lib.category(n), group=lib.group(lib.category(n)), dir=n['dir'], line=n['line'], need=n['need'],
                         price=l.get('price'), dec=n['dec'], sel=n['sel'], result=res[0], actual=txt, margin=None if half else mg, half=bool(half),
                         team_spread=cl.get('spread'), game_total=cl.get('total'), source=l.get('source')))
with open('reports/analysis/midseason-2026/w10/ledger_legs.jsonl', 'w') as f:
    for r in rows: f.write(json.dumps(r) + '\n')
print(len(rows), 'legs;', sum(r['dec'] is not None for r in rows), 'priced;', sum(r['team'] is None for r in rows), 'no team')
print(sorted(collections.Counter(r['week'] for r in rows).items()))
print(collections.Counter((r['week'] == 10, r['dec'] is not None) for r in rows))
