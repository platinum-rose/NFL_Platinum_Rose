"""Part 3 (a): calibration of the synthesizer and input attribution.
- per-game recommendations (W7, W8, W10): hit rate / units by tier, market, pass type; model_prob reliability + Brier
- reasons text tagged by input family -> hit rate by input mix
- fair lines vs expert spread consensus, game by game (W8-10)
- placed legs: Andy-only vs AI-backed vs AI-unplaced (W1-10)
Output: w10/synth_calibration.json. Run from repo root."""
import json, sys, collections, re, glob, math
sys.path.insert(0, 'reports/analysis/season/claude/scripts'); sys.path.insert(0, 'reports/analysis/midseason-2026')
import lib, tw
M = 'reports/analysis/midseason-2026/'
R = [json.loads(l) for l in open(M + 'w10/game_recs_graded.jsonl')]
for r in R:  # W8 wrote some probabilities as a dict (cover / push / cover_excl_push)
    if isinstance(r.get('model_prob'), dict): r['model_prob'] = r['model_prob'].get('cover_excl_push') or r['model_prob'].get('cover')
    if not isinstance(r.get('model_prob'), (int, float)): r['model_prob'] = None
def units(r):
    d = lib.dec(r.get('price'))
    if r['result'] == 'P': return 0.0
    if d is None: d = 1 + 100 / 110
    return d - 1 if r['result'] == 'W' else -1.0
def rec(rows):
    g = [r for r in rows if r['result'] in 'WL']; w = sum(r['result'] == 'W' for r in g); n = len(g)
    pr = [1 / lib.dec(r['price']) for r in g if lib.dec(r.get('price'))]
    return dict(w=w, l=n - w, rate=round(w / n, 3) if n else None, ci=[round(x, 3) for x in lib.wilson(w, n)], units=round(sum(units(r) for r in g), 1),
                avg_breakeven=round(sum(pr) / len(pr), 3) if pr else None, priced=len(pr), small_n=n < 20)
def tier(r):
    t = r['tier'].upper()
    return 'PASS' if r['passed'] else t[0] if t[:1] in 'ABC' else 'other'
out = {}
live = [r for r in R if not r['passed']]
out['recs_total'] = dict(all=len(R), graded=sum(r['result'] in 'WL' for r in R), by_week={w: rec([r for r in live if r['week'] == w]) for w in (7, 8, 10)})
out['by_tier'] = {t: rec([r for r in R if tier(r) == t]) for t in ('A', 'B', 'C', 'PASS', 'other')}
out['by_tier_week'] = {f'{t} W{w}': rec([r for r in R if tier(r) == t and r['week'] == w]) for t in ('B', 'C') for w in (7, 8, 10)}
mk = lambda r: {'player_prop': 'prop: ' + (r['key'] or '?'), 'atd': 'prop: atd', 'first_td': 'prop: first_td'}.get(r['market'], r['market'])
out['by_market'] = {k: rec([r for r in live if mk(r) == k]) for k in sorted({mk(r) for r in live})}
out['by_tier_and_group'] = {f'{t} {g}': rec([r for r in live if tier(r) == t and (('side/total' if r['market'] in ('spread', 'total', 'moneyline') else 'TD scorer' if r['key'] in ('atd', 'first_td', 'tds') else 'prop')) == g])
                            for t in ('B', 'C') for g in ('side/total', 'prop', 'TD scorer')}
out['passes_if_played'] = dict(spread=rec([r for r in R if r['passed'] and r['market'] == 'spread']), total=rec([r for r in R if r['passed'] and r['market'] == 'total']),
                               moneyline=rec([r for r in R if r['passed'] and r['market'] == 'moneyline']), prop=rec([r for r in R if r['passed'] and r['market'] not in ('spread', 'total', 'moneyline')]))
out['prop_direction'] = dict(overs=rec([r for r in live if r['market'] == 'player_prop' and r['dir'] == 'over']), unders=rec([r for r in live if r['market'] == 'player_prop' and r['dir'] == 'under']))
out['flags'] = dict(standalone_preferred=rec([r for r in live if r.get('standalone_preferred')]), parlay_leg_ok_only=rec([r for r in live if r.get('parlay_leg_ok') and not r.get('standalone_preferred')]),
                    supercontest_candidate=rec([r for r in R if r.get('sc')]))
# model_prob reliability (all recs with a probability, including PASS rows: the probability is for the stated selection)
mp = [r for r in R if r['model_prob'] is not None and r['result'] in 'WL']
def brier(rows, pf): return round(sum((pf(r) - (r['result'] == 'W')) ** 2 for r in rows) / len(rows), 4) if rows else None
bins = []
for lo, hi in ((0, .45), (.45, .5), (.5, .55), (.55, .6), (.6, .7), (.7, 1.01)):
    b = [r for r in mp if lo <= r['model_prob'] < hi]
    if b: bins.append(dict(bin=f'{lo:.2f}-{min(hi, 1):.2f}', n=len(b), avg_prob=round(sum(r['model_prob'] for r in b) / len(b), 3), hit=round(sum(r['result'] == 'W' for r in b) / len(b), 3)))
pm = [r for r in mp if lib.dec(r.get('price'))]
out['model_prob'] = dict(n=len(mp), brier_model=brier(mp, lambda r: r['model_prob']), brier_coinflip=brier(mp, lambda r: .5),
                         n_priced=len(pm), brier_model_priced=brier(pm, lambda r: r['model_prob']), brier_price_implied=brier(pm, lambda r: min(.99, 1 / lib.dec(r['price']) / 1.045)),
                         reliability=bins, by_week={w: dict(n=sum(r['week'] == w for r in mp), brier=brier([r for r in mp if r['week'] == w], lambda r: r['model_prob'])) for w in (7, 8, 10)},
                         edge_positive=rec([r for r in pm if r['model_prob'] > 1 / lib.dec(r['price'])]), edge_negative=rec([r for r in pm if r['model_prob'] <= 1 / lib.dec(r['price'])]),
                         edge_ge_3pts=rec([r for r in pm if r['model_prob'] - 1 / lib.dec(r['price']) >= .03]))
# edge_pts buckets for sides/totals
ep = [r for r in R if r.get('edge_pts') is not None and r['result'] in 'WL']
out['edge_pts'] = {k: rec([r for r in ep if f(abs(float(r['edge_pts'])))]) for k, f in (('<1', lambda e: e < 1), ('1-1.9', lambda e: 1 <= e < 2), ('2+', lambda e: e >= 2))}
# ---- input attribution from the reasons text
TAGS = collections.OrderedDict([
 ('simulator / fair line', r'\bsim\b|simulat|fair line|fair total|edge|model\b|break-?even'),
 ('expert / podcast', r'erickson|bettingpros|fezzik|florio|pft|expert|podcast|action network|vsin|sharp or square|tucker|consensus|best bet|reynolds|bogman|prop dealer|hansen'),
 ('prediction market ref', r'kalshi|dkp|polymarket'),
 ('usage / FTN / EPA', r'\bftn\b|\bepa\b|target|share|snaps?|route|usage|hit rate|\bl\d\b|last \d|per game|averag'),
 ('injury / role news', r'injur|\bout\b|questionable|doubtful|inactive|returns?|limited|backup|starter|practice'),
 ('weather', r'wind|rain|weather|snow|gust'),
 ('splits / money', r'money|bettors|tickets|public|sharp side|handle'),
 ('defense matchup', r'allows?|defense ranks?|funnel|matchup|pressure|blitz|coverage|vs (the )?\w+ (run|pass)'),
 ('line move / price', r'moved|price improved|steam|opener|open(ed)?|hook|closing'),
])
def tags(r):
    t = ' '.join(r.get('reasons') or []).lower()
    return [k for k, p in TAGS.items() if re.search(p, t)]
tg = collections.defaultdict(list); ntag = collections.defaultdict(list)
for r in live:
    ts = tags(r)
    for k in ts: tg[k].append(r)
    ntag[min(len(ts), 4)].append(r)
out['by_input_tag'] = {k: rec(v) for k, v in tg.items()}
out['by_input_tag_sides_totals'] = {k: rec([r for r in v if r['market'] in ('spread', 'total', 'moneyline')]) for k, v in tg.items()}
out['by_input_tag_props'] = {k: rec([r for r in v if r['market'] not in ('spread', 'total', 'moneyline')]) for k, v in tg.items()}
out['by_number_of_input_families'] = {str(k) + ('+' if k == 4 else ''): rec(v) for k, v in sorted(ntag.items())}
sim_only = [r for r in live if 'simulator / fair line' in tags(r) and 'expert / podcast' not in tags(r)]
both = [r for r in live if 'simulator / fair line' in tags(r) and 'expert / podcast' in tags(r)]
exp_only = [r for r in live if 'expert / podcast' in tags(r) and 'simulator / fair line' not in tags(r)]
out['model_vs_expert_mix'] = dict(model_without_expert=rec(sim_only), model_and_expert=rec(both), expert_without_model=rec(exp_only), neither=rec([r for r in live if not {'simulator / fair line', 'expert / podcast'} & set(tags(r))]))
# ---- fair lines vs expert spread consensus (W8-10)
res = {}
for r in tw.rows():
    if r['home_away'] == 'home': res[(int(r['week']), f"{lib.T(r['opp'])}@{lib.T(r['team'])}")] = float(r['pts']) - float(r['opp_pts'])
E = [json.loads(l) for l in open(M + 'expert_grades.jsonl')]
cons = collections.defaultdict(lambda: collections.Counter())
for e in E:
    if e.get('graded_market') != 'spread' or e['result'] not in 'WLP' or '@' not in (e.get('game') or ''): continue
    a, h = [lib.T(x) for x in e['game'].split('@')]; side = (e.get('selection') or '')
    m = re.match(r'\s*([A-Z]{2,3})\b', side)
    tm = lib.T(m.group(1)) if m else None
    if tm not in (a, h):  # fall back: infer side from the result and the final margin vs line is not reliable; skip
        continue
    cons[(e['week'], f'{a}@{h}')]['home' if tm == h else 'away'] += 1
def fl_games(path):
    d = json.load(open(path)); G = d['games'] if isinstance(d, dict) else d; outg = []
    for g in G:
        gid = g['game'].replace(' ', ''); a, h = [lib.T(x) for x in gid.split('@')]
        if isinstance(d, dict): line, fair = g['market_home_line'], g['fair_line']
        else:
            line = next((g[k] for k in ('home_line', 'bkr_home_line', 'sat_home_line', 'fri_home_line') if g.get(k) is not None), None); fair = g.get('fair_line', g.get('fair_home_line'))
        if line is None or fair is None: continue
        outg.append((f'{a}@{h}', line, fair))
    return outg
cmpr = collections.defaultdict(lambda: [0, 0]); detail = []
for w, p in ((8, 'reports/intel/w08-model/fair-lines-w08.json'), (9, 'reports/intel/w09-model/fair-lines-w09.json'), (10, 'reports/intel/w10-model/fair-lines-w10.json')):
    for gid, line, fair in fl_games(p):
        if (w, gid) not in res: continue
        cover = res[(w, gid)] + line
        if cover == 0: continue
        edge = line - fair; mside = 'home' if edge > 0 else 'away'; c = cons.get((w, gid)) or {}
        n = sum(c.values()); eside = None if n < 2 or c.get('home', 0) == c.get('away', 0) else ('home' if c.get('home', 0) > c.get('away', 0) else 'away')
        won_side = 'home' if cover > 0 else 'away'
        if abs(edge) >= 0.5:
            k = ('no expert consensus' if eside is None else 'model and experts agree' if eside == mside else 'model vs experts (model side)') + (' [W8 blended model]' if w == 8 else '')
            cmpr[k][0] += mside == won_side; cmpr[k][1] += 1
        if eside:
            k2 = 'expert consensus side, all games' + (' [W8]' if w == 8 else ''); cmpr[k2][0] += eside == won_side; cmpr[k2][1] += 1
        detail.append(dict(week=w, game=gid, market_home_line=line, fair_home_line=fair, edge=round(edge, 2), model_side=mside if abs(edge) >= .5 else None, expert_picks=dict(c), expert_side=eside, covered=won_side))
out['fair_vs_expert'] = dict(summary={k: f'{v[0]}-{v[1] - v[0]}' for k, v in sorted(cmpr.items())}, games=detail)
# ---- placed legs by origin (weekly pipeline's origin tag), W1-10 and W10
P = [json.loads(l) for l in open(M + 'picks.jsonl')]
def uq(rows):
    s = {}
    for p in rows:
        if p['result'] in ('W', 'L'): s[(p['week'], p.get('game'), (p.get('player') or p.get('label') or '').lower(), p.get('key'), p.get('dir'), p.get('thr'))] = p
    return list(s.values())
def wl(rows):
    w = sum(p['result'] == 'W' for p in rows); n = len(rows)
    return dict(w=w, l=n - w, rate=round(w / n, 3) if n else None, ci=[round(x, 3) for x in lib.wilson(w, n)], small_n=n < 20)
og = {}
for scope, ws in (('W1-9', range(1, 10)), ('W10', [10]), ('W1-10', range(1, 11)), ('W5-10', range(5, 11))):
    for grp in ('Player props', 'Sides & totals'):
        for lab, f in (('Andy-only', lambda p: p['layer'] == 'placed_leg' and p['source'] == 'andy'), ('AI-backed (placed)', lambda p: p['layer'] == 'placed_leg' and p['source'] == 'agree'),
                       ('AI unplaced', lambda p: p['layer'] == 'ai_unplaced')):
            og[f'{scope} | {grp} | {lab}'] = wl(uq([p for p in P if p['week'] in ws and p.get('group') == grp and f(p)]))
out['origin'] = og
json.dump(out, open(M + 'w10/synth_calibration.json', 'w'), indent=1)
for k, v in out.items():
    if k == 'fair_vs_expert': print(k, v['summary']); continue
    print('\n' + k)
    if isinstance(v, dict):
        for a, b in v.items(): print('  ', a, json.dumps(b)[:260])
