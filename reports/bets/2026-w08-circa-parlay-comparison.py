import json, re, sys
R = sys.argv[1]
circa = {}
for r in json.load(open(f'{R}/data/futures-imports/circa-2026-10-28.json')):
    circa[(r['market_type'][-3:].upper(), r['team'])] = r['odds']
bkr, dk = {}, {}
for line in open(f'{R}/reports/bets/2026-w08-missing-exacta-composite.md'):
    m = re.match(r'\| (AFC|NFC) \| ([^|]+?) \| \+([\d,]+) \| \+([\d,]+) \|', line)
    if m:
        k = (m[1], m[2]); bkr[k] = int(m[3].replace(',', '')); dk[k] = int(m[4].replace(',', ''))
pm = {}
pmd = json.load(open(f'{R}/data/prediction-markets/cross-market-coherence-latest.json'))
for t in pmd['teams']:
    v = t.get('implied_win_pct_by_market', {}).get('conference')
    if v is not None: pm[t['team_nick']] = v / 100
assert len(circa) == 32 and len(bkr) == 32, (len(circa), len(bkr))
dec = lambda a: 1 + a / 100
def am(d): return round((d - 1) * 100)
def devig(book):
    out = {}
    for c in ('AFC', 'NFC'):
        s = sum(1 / dec(v) for (cc, _), v in book.items() if cc == c)
        for (cc, t), v in book.items():
            if cc == c: out[(c, t)] = (1 / dec(v)) / s
        out[('over', c)] = s - 1
    return out
fc, fb = devig(circa), devig(bkr)
blend = {k: (fc[k] + fb[k]) / 2 for k in fc if k[0] != 'over'}
AFC = ['Buffalo Bills','Kansas City Chiefs','Cincinnati Bengals','Jacksonville Jaguars','New England Patriots','Denver Broncos']
NFC = ['San Francisco 49ers','Seattle Seahawks','Chicago Bears','Detroit Lions','Green Bay Packers','Dallas Cowboys','Minnesota Vikings']
held = {('Green Bay Packers','Buffalo Bills'),('Seattle Seahawks','Buffalo Bills'),('Detroit Lions','Buffalo Bills'),('Green Bay Packers','Kansas City Chiefs'),('Green Bay Packers','Cincinnati Bengals'),('Green Bay Packers','Denver Broncos'),('Chicago Bears','Kansas City Chiefs'),('Chicago Bears','Buffalo Bills'),('San Francisco 49ers','Buffalo Bills'),('Seattle Seahawks','Kansas City Chiefs')}
nick = lambda t: t.split()[-1]
rows = []
for a in AFC:
    for n in NFC:
        cd = dec(circa[('AFC', a)]) * dec(circa[('NFC', n)])
        bd = dec(bkr[('AFC', a)]) * dec(bkr[('NFC', n)])
        pb = fb[('AFC', a)] * fb[('NFC', n)]
        pbl = blend[('AFC', a)] * blend[('NFC', n)]
        pa, pn = pm.get(nick(a)), pm.get(nick(n))
        ppm = pa * pn if pa and pn else None
        rows.append(dict(m=f'{n} vs {a}', held=(n, a) in held, circa=am(cd), bkr=am(bd),
            ev_b=cd * pb - 1, ev_bl=cd * pbl - 1, ev_pm=(cd * ppm - 1) if ppm else None,
            fair_b=am(1 / pb), fair_bl=am(1 / pbl), adv=cd / bd - 1))
rows.sort(key=lambda r: -r['ev_bl'])
f = lambda x: '—' if x is None else f'{x*100:+.1f}%'
p = lambda x: f'+{x:,}'
print('OVERROUND', {k: round(v*100,1) for k, v in fc.items() if k[0]=='over'}, {k: round(v*100,1) for k, v in fb.items() if k[0]=='over'})
print('| Matchup (NFC vs AFC) | Held? | Circa parlay | BKR synthetic | Circa vs BKR payout | Fair (BKR no-vig) | Fair (Circa+BKR blend) | EV vs BKR fair | EV vs blend | EV vs pred. mkt (gross) |')
print('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|')
for r in rows:
    print(f"| {r['m']} | {'held' if r['held'] else ''} | {p(r['circa'])} | {p(r['bkr'])} | {f(r['adv'])} | {p(r['fair_b'])} | {p(r['fair_bl'])} | {f(r['ev_b'])} | {f(r['ev_bl'])} | {f(r['ev_pm'])} |")
# per-team conference price ratio circa vs bkr fair
print('TEAMS')
for c, L in (('AFC', AFC), ('NFC', NFC)):
    for t in L:
        print(c, t, circa[(c,t)], bkr[(c,t)], f"{(dec(circa[(c,t)])*fb[(c,t)]-1)*100:+.1f}%", f"{(dec(circa[(c,t)])*blend[(c,t)]-1)*100:+.1f}%", pm.get(nick(t)))
