"""W1-10 scorecard with the product split, leg types, leg-count table and price calibration.
Inputs: ledger (lib), picks.jsonl (placed legs regraded by the weekly pipeline), paper ledger, SuperContest locked cards.
Money is the full ticket (stake_usd / settled_payout_usd), i.e. the pick-accuracy lens; Andy's share is a separate column.
Output: w10/scorecard_w1_10.json. Run from repo root."""
import json, sys, collections, math, re
sys.path.insert(0, 'reports/analysis/season/claude/scripts'); sys.path.insert(0, 'reports/analysis/midseason-2026')
import lib, tw
OUT = 'reports/analysis/midseason-2026/w10/'
L = [w for w in lib.load_wagers() if w.get('status') == 'SETTLED' and w.get('week') and w['week'] <= 10]
P = [json.loads(l) for l in open('reports/analysis/midseason-2026/picks.jsonl')]
legs = collections.defaultdict(list)
for p in P:
    if p['layer'] == 'placed_leg': legs[p['ticket']].append(p)
def f(x):
    try: return float(x)
    except (TypeError, ValueError): return 0.0
def partner(w):
    s = w.get('ownership_shares') or {}
    if f(s.get('Alejandro')) > 0 or 'lejandro' in str(w.get('split_partner')): return 'Alejandro'
    if f(s.get('Amanda')) > 0 or 'manda' in str(w.get('split_partner')): return 'Amanda'
    return 'split-unknown' if w.get('is_split') else None
def andy_share(w):
    s = w.get('ownership_shares') or {}
    if 'Andy' in s: return f(s['Andy'])
    return 1 / (w.get('split_count') or 2) if w.get('is_split') else 1.0
def is_rr(w): return bool(w.get('round_robin')) or 'robin' in str(w.get('ticket_type')).lower() or 'RR' in lib.family(w)
def is_open(w): return bool(w.get('legacy_ticket') or w.get('open_spots')) or 'open spot' in str(w.get('ticket_type')).lower()
def dec_of(w):
    try:
        d = float(w.get('odds_decimal'))
        if d > 1: return d
    except (TypeError, ValueError): pass
    if w.get('potential_payout_usd') and f(w.get('stake_usd')): return f(w['potential_payout_usd']) / f(w['stake_usd'])
    return None
def summarize(ws, label):
    n = len(ws); won = sum(w.get('result') == 'win' for w in ws); st = sum(f(w.get('stake_usd')) for w in ws); rt = sum(f(w.get('settled_payout_usd')) for w in ws)
    lg = [p for w in ws for p in legs.get(w['id'], [])]; lw = sum(p['result'] == 'W' for p in lg); ll = sum(p['result'] == 'L' for p in lg)
    imp = [1 / dec_of(w) for w in ws if dec_of(w) and not is_rr(w) and w.get('result') in ('win', 'loss')]
    lo, hi = lib.wilson(lw, lw + ll)
    return dict(product=label, tickets=n, won=won, staked=round(st, 2), returned=round(rt, 2), net=round(rt - st, 2), roi=round((rt - st) / st, 3) if st else None,
                andy_share_net=round(sum((f(w.get('settled_payout_usd')) - f(w.get('stake_usd'))) * andy_share(w) for w in ws), 2),
                legs_w=lw, legs_l=ll, leg_rate=round(lw / (lw + ll), 3) if lw + ll else None, leg_ci=[round(lo, 3), round(hi, 3)],
                avg_legs=round(sum(lib.n_legs(w) for w in ws) / n, 1) if n else None,
                expected_wins_at_price=round(sum(imp), 1), priced_tickets=len(imp), small_n=n < 20)
VIEWS = collections.OrderedDict([
 ('Andy solo cash tickets (non-RR, excl. legacy fill)', lambda w: partner(w) is None and lib.is_cash(w) and not is_rr(w) and not is_open(w)),
 ('Alejandro splits', lambda w: partner(w) == 'Alejandro'),
 ('DKP pick-combos: 2-4 legs', lambda w: 'DraftKings Predictions' in str(w.get('book')) and lib.n_legs(w) <= 4),
 ('DKP pick-combos: 5-6 legs', lambda w: 'DraftKings Predictions' in str(w.get('book')) and 5 <= lib.n_legs(w) <= 6),
 ('DKP pick-combos: 7+ legs', lambda w: 'DraftKings Predictions' in str(w.get('book')) and lib.n_legs(w) >= 7),
 ('BKR round robins', lambda w: is_rr(w)),
 ('BKR open-spot parlays (legacy fill; off the 2026 bankroll)', lambda w: is_open(w)),
 ('Island 3-tier tickets (TNF/SNF/MNF)', lambda w: lib.family(w).startswith('Island')),
 ('All placed tickets', lambda w: True),
])
res = {'views_note': 'Views overlap (an Alejandro DKP 7-pick is in both lines). Full-ticket dollars; andy_share_net applies ownership shares.'}
for scope, ws in (('W10', [w for w in L if w['week'] == 10]), ('W1-9', [w for w in L if w['week'] <= 9]), ('W1-10', L)):
    res[scope] = [summarize([w for w in ws if fn(w)], k) for k, fn in VIEWS.items()]
# ---- AI paper tickets
PW = json.load(open('data/official-picks/paper-wagers-2026.json'))
def paper_rows(weeks):
    rows = collections.defaultdict(lambda: dict(tickets=0, won=0, legs_w=0, legs_l=0, units=0.0, implied=0.0))
    for w in weeks:
        try: PP = json.load(open(f'reports/bets/season-recap/w{w}paper.json'))
        except FileNotFoundError: continue
        led = {p['id']: p for p in PW}
        for t in PP:
            nm = t.get('name') or ''; kind = 'Andy imaginary' if 'andy' in (t.get('id') or '').lower() or nm.lower().startswith('andy') else \
                 'AI Master Intel paper' if 'Master Intel' in nm else 'AI TNF/Island paper' if 'TNF' in nm or 'MNF' in nm or 'SNF' in nm else 'AI card paper'
            rs = [l.get('result') for l in t.get('legs', [])]
            if not rs or any(r not in ('W', 'L', 'P') for r in rs): continue
            r = rows[kind]; r['tickets'] += 1; hit = 'L' not in rs; r['won'] += hit
            r['legs_w'] += rs.count('W'); r['legs_l'] += rs.count('L')
            d = lib.dec(t.get('odds')) or (led.get(t.get('id'), {}).get('odds_decimal'))
            try: d = float(d)
            except (TypeError, ValueError): d = None
            if d and d > 1: r['units'] += (d - 1) if hit else -1; r['implied'] += 1 / d
            else: r['unpriced'] = r.get('unpriced', 0) + 1
    return {k: dict(v, units=round(v['units'], 2), implied=round(v['implied'], 2), leg_rate=round(v['legs_w'] / max(1, v['legs_w'] + v['legs_l']), 3)) for k, v in rows.items()}
res['paper'] = {'W10': paper_rows([10]), 'W1-10': paper_rows(range(1, 11))}
# ---- SuperContest: Andy's locked five per week vs the contest line
tm = {}
for r in tw.rows(): tm[(int(r['week']), lib.T(r['team']))] = (f(r['pts']), f(r['opp_pts']))
sc = {}
for w in range(1, 11):
    try: card = json.load(open(f'data/supercontest/locked-card-week-{w}.json'))
    except FileNotFoundError: continue
    card = card if isinstance(card, list) else card.get('picks') or card.get('card') or []
    rec = [0, 0, 0]; det = []
    for c in card:
        t = lib.T(c.get('pickTeam') or c.get('team')); s = tm.get((w, t))
        if not s: det.append((t, 'no result')); continue
        adj = s[0] - s[1] + f(c.get('spread')); k = 0 if adj > 0 else 2 if adj == 0 else 1; rec[k] += 1; det.append((t, c.get('spread'), 'WLP'[k] if k < 2 else 'P'))
    sc[w] = dict(w=rec[0], l=rec[1], p=rec[2], picks=det)
res['supercontest_locked'] = sc
tot = [sum(v[k] for v in sc.values()) for k in ('w', 'l', 'p')]
res['supercontest_total'] = dict(w=tot[0], l=tot[1], p=tot[2], points=tot[0] + 0.5 * tot[2], ci=[round(x, 3) for x in lib.wilson(tot[0], tot[0] + tot[1])])
# ---- leg types
def legtab(rows):
    c = collections.defaultdict(lambda: [0, 0])
    for p in rows:
        if p['result'] in ('W', 'L'): c[p.get('cat') or '?'][0 if p['result'] == 'W' else 1] += 1
    return c
A, B = legtab([p for p in P if p['layer'] == 'placed_leg' and p['week'] <= 9]), legtab([p for p in P if p['layer'] == 'placed_leg' and p['week'] == 10])
lt = []
for cat in sorted(set(A) | set(B), key=lambda k: -(A[k][0] + A[k][1] + B[k][0] + B[k][1])):
    a, b = A[cat], B[cat]; n = sum(a) + sum(b); w = a[0] + b[0]; lo, hi = lib.wilson(w, n)
    lt.append(dict(cat=cat, w1_9=f'{a[0]}-{a[1]}', w1_9_rate=round(a[0] / sum(a), 3) if sum(a) else None, w10=f'{b[0]}-{b[1]}', w10_rate=round(b[0] / sum(b), 3) if sum(b) else None,
                   total=f'{w}-{n - w}', rate=round(w / n, 3), ci=[round(lo, 3), round(hi, 3)], n=n, small_n=n < 20))
res['leg_types'] = lt
# unique positions (one player-stat-direction-threshold per week), so a leg on 5 tickets counts once
def uniq(rows):
    seen = {}
    for p in rows:
        if p['result'] not in ('W', 'L'): continue
        seen[(p['week'], p.get('game'), (p.get('player') or p.get('label') or '').lower(), p.get('key'), p.get('dir'), p.get('thr'))] = p
    return list(seen.values())
U = legtab(uniq([p for p in P if p['layer'] == 'placed_leg']))
res['leg_types_unique_positions'] = [dict(cat=k, rec=f'{v[0]}-{v[1]}', rate=round(v[0] / sum(v), 3), ci=[round(x, 3) for x in lib.wilson(v[0], sum(v))], n=sum(v)) for k, v in sorted(U.items(), key=lambda kv: -sum(kv[1]))]
# ---- by leg count (cash, non-RR), realized vs independent expectation from that ticket's own leg rate
bl = collections.defaultdict(lambda: dict(tickets=0, won=0, staked=0.0, net=0.0, legs_w=0, legs_l=0, implied=0.0, priced=0))
for w in L:
    if not lib.is_cash(w) or is_rr(w) or is_open(w): continue
    n = lib.n_legs(w); k = str(n) if n <= 4 else '5-6' if n <= 6 else '7-8' if n <= 8 else '9+'
    b = bl[k]; b['tickets'] += 1; b['won'] += w.get('result') == 'win'; b['staked'] += f(w.get('stake_usd')); b['net'] += f(w.get('settled_payout_usd')) - f(w.get('stake_usd'))
    for p in legs.get(w['id'], []): b['legs_w'] += p['result'] == 'W'; b['legs_l'] += p['result'] == 'L'
    d = dec_of(w)
    if d and w.get('result') in ('win', 'loss'): b['implied'] += 1 / d; b['priced'] += 1
res['by_leg_count_cash'] = {k: dict(v, staked=round(v['staked'], 2), net=round(v['net'], 2), implied=round(v['implied'], 2),
                                    leg_rate=round(v['legs_w'] / max(1, v['legs_w'] + v['legs_l']), 3),
                                    cash_rate=round(v['won'] / v['tickets'], 3)) for k, v in sorted(bl.items())}
# ---- A2: price calibration (cash, non-RR), W1-9 / W10 / W1-10
def calib(ws):
    rows = [(1 / dec_of(w), w.get('result') == 'win') for w in ws if lib.is_cash(w) and not is_rr(w) and not is_open(w) and dec_of(w) and w.get('result') in ('win', 'loss')]
    out = []
    for lo, hi in ((0, .05), (.05, .15), (.15, .3), (.3, .45), (.45, .6), (.6, 1.01)):
        b = [r for r in rows if lo <= r[0] < hi]
        if b: out.append(dict(implied=f'{lo:.0%}-{min(hi, 1):.0%}', n=len(b), wins=sum(r[1] for r in b), expected=round(sum(r[0] for r in b), 1)))
    return dict(bins=out, n=len(rows), wins=sum(r[1] for r in rows), expected=round(sum(r[0] for r in rows), 1))
res['a2_price_calibration'] = {'W1-9': calib([w for w in L if w['week'] <= 9]), 'W10': calib([w for w in L if w['week'] == 10]), 'W1-10': calib(L)}
json.dump(res, open(OUT + 'scorecard_w1_10.json', 'w'), indent=1)
for scope in ('W10', 'W1-10'):
    print('\n==', scope)
    for r in res[scope]: print(f"{r['product'][:54]:54s} n={r['tickets']:3d} won={r['won']:2d} stk={r['staked']:8.2f} net={r['net']:9.2f} andy={r['andy_share_net']:9.2f} legs {r['legs_w']}-{r['legs_l']} {r['leg_rate']} exp_wins={r['expected_wins_at_price']}")
print('\npaper', json.dumps(res['paper'], indent=0)); print('SC', {k: (v['w'], v['l'], v['p']) for k, v in sc.items()}, res['supercontest_total'])
print('\nleg types'); [print(' ', x) for x in lt[:28]]
print('\nby legs', json.dumps(res['by_leg_count_cash'], indent=0)); print('A2', json.dumps(res['a2_price_calibration']))
