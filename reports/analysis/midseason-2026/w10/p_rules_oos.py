"""P1-P12 scored out of sample on Week 10. For each rule: which W10 tickets/picks it would have changed and the counterfactual.
Inputs: ledger, w10/ledger_legs.jsonl, expert_grades.jsonl, w10 podcast grades, pitch_grades.jsonl, model_scores.json, kalshi_scores.json.
Output: w10/p_rules_oos.json. Run from repo root."""
import json, sys, collections, re
sys.path.insert(0, 'reports/analysis/season/claude/scripts'); import lib
M = 'reports/analysis/midseason-2026/'
W = [w for w in lib.load_wagers() if w.get('week') == 10 and w.get('status') == 'SETTLED' and not w.get('legacy_ticket')]
LEGS = [json.loads(l) for l in open(M + 'w10/ledger_legs.jsonl')]
by_t = collections.defaultdict(list)
for l in LEGS: by_t[l['ticket']].append(l)
f = lambda x: float(x or 0)
net = lambda w: f(w.get('settled_payout_usd')) - f(w.get('stake_usd')) if lib.is_cash(w) else 0.0
def tk(ws): return dict(tickets=len(ws), won=sum(w['result'] == 'win' for w in ws), staked=round(sum(f(w['stake_usd']) for w in ws if lib.is_cash(w)), 2), net=round(sum(net(w) for w in ws), 2),
                        ids=[w['id'][4:70] for w in ws])
cash = [w for w in W if lib.is_cash(w)]
is_rr = lambda w: bool(w.get('round_robin')) or 'robin' in str(w.get('ticket_type')).lower()
base = tk(cash); base.pop('ids')
R = {'W10_cash_baseline': base}
def cf(drop, label):
    keep = [w for w in cash if w not in drop]
    return dict(rule_hits=tk(drop), w10_net_if_not_placed=round(sum(net(w) for w in keep), 2), delta=round(-sum(net(w) for w in drop), 2), note=label)
# P1: same-game side+total 2-teamers need fair-line edge >= 1.5 on both legs; first-TD / 2+TD three-packs promo only
FL = {g['game'].replace(' ', ''): g for g in json.load(open('reports/intel/w10-model/fair-lines-w10.json'))['games']} if isinstance(json.load(open('reports/intel/w10-model/fair-lines-w10.json')), dict) else {}
two = [w for w in cash if lib.n_legs(w) == 2 and not is_rr(w)]
p1a = [w for w in two if len({l['game'] for l in by_t[w['id']]}) == 1 and {l['group'] for l in by_t[w['id']]} == {'side/total'}]
p1b = [w for w in cash if lib.n_legs(w) == 3 and all(l['cat'] in ('First TD', '2+ TD') for l in by_t[w['id']])]
R['P1'] = dict(same_game_side_total_2leg=cf(p1a, 'same-game side+total 2-leggers placed for cash'), td_three_packs=cf(p1b, 'first-TD / 2+TD 3-packs placed for cash'),
               other_2leg=tk([w for w in two if w not in p1a]))
# P2: BetOnline cash long-shot prop parlays (5+ legs)
p2 = [w for w in cash if 'BetOnline' in str(w.get('book')) and lib.n_legs(w) >= 5]
R['P2'] = dict(cf(p2, 'BEO cash prop parlays with 5+ legs'), all_beo_cash=tk([w for w in cash if 'BetOnline' in str(w.get('book'))]))
# P3: at most 2 tickets per slate may share a player-stat leg (or a game total). Keep the first two by placed_at; drop later ones.
def lk(l):
    if l['player']: return ('p', l['player'].lower(), {'rec': 'recv', 'rec_yds': 'recv', 'rush_yds': 'rush', 'carries': 'rush', 'atd': 'td', 'tds': 'td', 'first_td': 'td',
                                                         'pass_yds': 'pass', 'pass_td': 'pass', 'completions': 'pass', 'pass_att': 'pass'}.get(l['key'], l['key']))
    if l['key'] == 'total': return ('t', l['game'])
    return None
count = collections.Counter(); drop3 = []; share = collections.Counter()
for w in sorted(cash, key=lambda w: str(w.get('placed_at') or w.get('date'))):
    ks = {lk(l) for l in by_t[w['id']]} - {None}
    if any(count[k] >= 2 for k in ks): drop3.append(w)
    else:
        for k in ks: count[k] += 1
    for k in ks: share[k] += 1
R['P3'] = dict(cf(drop3, 'tickets that would have been the 3rd+ use of a player-stat leg or game total (first two by time kept)'),
               most_reused=[(' '.join(k[1:]), n) for k, n in share.most_common(14)],
               legs_shared_pct=round(sum(1 for w in cash for l in by_t[w['id']] if lk(l) and share[lk(l)] > 1) / max(1, sum(1 for w in cash for l in by_t[w['id']] if lk(l))), 3))
# cluster view: tickets whose only losing legs were one player's (Henry, MNF)
henry = [w for w in cash if any('henry' in (l['player'] or '').lower() and l['player'].lower().startswith('derrick') for l in by_t[w['id']])]
R['P3']['henry_mnf_cluster'] = dict(tk(henry), lost_only_on_henry_legs=sum(1 for w in henry if all((l['result'] != 'L') or 'derrick henry' in (l['player'] or '').lower() for l in by_t[w['id']])))
# P4: fair lines vs expert spreads / totals on W10
E = [json.loads(l) for l in open(M + 'expert_grades.jsonl')]
def rec(rows):
    w_ = sum(r['result'] == 'W' for r in rows); l_ = sum(r['result'] == 'L' for r in rows); u = sum(r['units'] or 0 for r in rows if r['result'] in 'WLP')
    return dict(w=w_, l=l_, pct=round(w_ / max(1, w_ + l_), 3), units=round(u, 1), ci=[round(x, 3) for x in lib.wilson(w_, w_ + l_)], small_n=(w_ + l_) < 20)
e10 = [e for e in E if e['week'] == 10]; e19 = [e for e in E if e['week'] <= 9]
ms = json.load(open(M + 'model_scores.json'))
R['P4'] = dict(fair_lines_w10=ms.get('fair-lines-w10.json'), fair_lines_w9=ms.get('fair-lines-w09.json'),
               expert_spreads=dict(w10=rec([e for e in e10 if e.get('graded_market') == 'spread']), w4_9=rec([e for e in e19 if e.get('graded_market') == 'spread'])),
               expert_totals=dict(w10=rec([e for e in e10 if e.get('graded_market') == 'total']), w4_9=rec([e for e in e19 if e.get('graded_market') == 'total'])),
               expert_best_bets=dict(w10=rec([e for e in e10 if e.get('best_bet')]), w4_9=rec([e for e in e19 if e.get('best_bet')])),
               expert_by_outlet_w10={k: rec([e for e in e10 if (e.get('outlet') or '?') == k]) for k in sorted({e.get('outlet') or '?' for e in e10}) if sum(1 for e in e10 if (e.get('outlet') or '?') == k and e['result'] in 'WL') >= 8})
# P5: podcasts W10 by outlet / market
pg = json.load(open('reports/intel/w10-podcast-pick-grades.json'))
R['P5'] = dict(by_outlet={k: {x: v[x] for x in ('W', 'L', 'units', 'n')} for k, v in pg['summary']['by_outlet'].items()},
               by_market={k: {x: v[x] for x in ('W', 'L', 'units', 'n')} for k, v in pg['summary']['by_market_group'].items()}, overall=pg['summary']['overall'],
               by_expert={k: {x: v[x] for x in ('W', 'L', 'units', 'n')} for k, v in pg['summary']['by_expert'].items() if v['W'] + v['L'] >= 5})
# P6: ATD by price band (priced legs), W10 and W1-10; first TD / 2+ TD cash usage in W10
def band(d):
    a = (d - 1) * 100 if d >= 2 else -100 / (d - 1)
    return 'under even' if a < 100 else '+100-199' if a < 200 else '+200-349' if a < 350 else '+350 up'
def atd(rows):
    out = collections.defaultdict(lambda: [0, 0, 0.0])
    for l in rows:
        if l['cat'] != 'Anytime TD' or not l['dec'] or l['result'] not in 'WL': continue
        b = out[band(l['dec'])]; b[0] += l['result'] == 'W'; b[1] += 1; b[2] += 1 / l['dec']
    return {k: dict(w=v[0], n=v[1], rate=round(v[0] / v[1], 3), breakeven=round(v[2] / v[1], 3)) for k, v in out.items()}
uniq = {}
for l in LEGS: uniq[(l['week'], l['game'], l['player'], l['key'], l['dir'], l['line'], l['need'], l['price'])] = l
UL = list(uniq.values())
R['P6'] = dict(atd_priced_w10=atd([l for l in UL if l['week'] == 10]), atd_priced_w1_9=atd([l for l in UL if l['week'] <= 9]), atd_priced_all=atd(UL),
               atd_all_w10_unique=None)
a10 = [l for l in UL if l['week'] == 10 and l['cat'] == 'Anytime TD']
R['P6']['atd_all_w10_unique'] = dict(w=sum(l['result'] == 'W' for l in a10), n=len(a10))
R['P6']['td_longshot_cash_tickets_w10'] = tk([w for w in cash if any(l['cat'] in ('First TD', '2+ TD') for l in by_t[w['id']])])
# P7: preferred categories vs the rest, W10 unique positions; prop Overs vs Unders
pref = {'Receptions', 'Tackles+Ast', 'Passing TDs', 'QB INT thrown'}
def wl(rows): 
    w_ = sum(l['result'] == 'W' for l in rows); n = sum(l['result'] in 'WL' for l in rows)
    return dict(w=w_, l=n - w_, rate=round(w_ / n, 3) if n else None, ci=[round(x, 3) for x in lib.wilson(w_, n)], small_n=n < 20)
u10 = [l for l in UL if l['week'] == 10]; props10 = [l for l in u10 if l['group'] != 'side/total']
R['P7'] = dict(preferred_cats_w10=wl([l for l in props10 if l['cat'] in pref]), prop_unders_w10=wl([l for l in props10 if l['dir'] == 'under']),
               prop_unders_w1_10=wl([l for l in UL if l['group'] != 'side/total' and l['dir'] == 'under']),
               rec_yds_overs_w10=wl([l for l in props10 if l['cat'] == 'Receiving yds' and l['dir'] != 'under']),
               rec_yds_overs_w1_9=wl([l for l in UL if l['week'] <= 9 and l['cat'] == 'Receiving yds' and l['dir'] != 'under']),
               other_props_w10=wl([l for l in props10 if l['cat'] not in pref and l['cat'] != 'Receiving yds']),
               by_cat_w10={c: wl([l for l in u10 if l['cat'] == c]) for c in sorted({l['cat'] for l in u10})})
# P8: C5 master RR and R9-1 (cash max 6 legs)
p8a = [w for w in cash if 'master' in lib.family(w).lower() or ('master' in str(w.get('card_section')).lower() and is_rr(w))]
p8b = [w for w in cash if lib.n_legs(w) >= 7 and not is_rr(w)]
R['P8'] = dict(C5_master_rr=cf(p8a, 'master round robin placed despite C5'), R9_1_seven_plus=cf(p8b, 'cash tickets with 7+ legs'),
               six_or_fewer_non_rr=tk([w for w in cash if lib.n_legs(w) <= 6 and not is_rr(w)]))
R['P8']['R9_1_seven_plus']['legs'] = wl([l for w in p8b for l in by_t[w['id']]])
# P9: process fields present in W10 artifacts
recs = [json.loads(l) for l in open(M + 'w10/game_recs_graded.jsonl')]
r10 = [r for r in recs if r['week'] == 10]
est = sum(1 for w in W if re.search(r'(?i)est\.? ?p|fair ~|my estimate|estimates? multiply', str(w.get('progress_notes'))))
R['P9'] = dict(w10_recs=len(r10), with_model_prob=sum(r['model_prob'] is not None for r in r10), tickets=len(W), tickets_with_estimate_in_notes=est,
               tickets_with_rules_version=sum(1 for w in W if 'rules_version' in w or 'r2' in str(w.get('progress_notes'))), tickets_with_closing_line=sum(1 for w in W if w.get('closing_line')))
# P10: Kalshi W10
K = json.load(open(M + 'kalshi_scores.json'))['rows']; k10 = [x for x in K if x['week'] == 10]
br = lambda rows, k: round(sum((x[k] - x['won']) ** 2 for x in rows if x[k] is not None) / max(1, sum(1 for x in rows if x[k] is not None)), 4)
R['P10'] = dict(w10_team_games=len(k10), brier_kalshi_w10=br(k10, 'p_kalshi'), brier_spread_w10=br(k10, 'p_spread'),
                brier_kalshi_all=br(K, 'p_kalshi'), brier_spread_all=br(K, 'p_spread'), n_all=len(K))
# pitches
PG = [json.loads(l) for l in open(M + 'pitch_grades.jsonl')]
R['pitches'] = {f"{k} W{w}": f"{sum(p['result'] == 'W' for p in PG if p['kind'] == k and p['week'] == w)}-{sum(p['result'] == 'L' for p in PG if p['kind'] == k and p['week'] == w)}" for k in ('master', 'supercontest') for w in (7, 8, 9, 10)}
json.dump(R, open(M + 'w10/p_rules_oos.json', 'w'), indent=1)
def short(o, d=0):
    for k, v in o.items():
        if isinstance(v, dict) and d < 2 and not all(not isinstance(x, (dict, list)) for x in v.values()): print('  ' * d + k + ':'); short(v, d + 1)
        else: print('  ' * d + f'{k}: {json.dumps(v)[:330]}')
short(R)
