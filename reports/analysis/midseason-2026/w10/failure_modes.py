"""Part 3 (b): failure modes and ticket construction, W1-10. Unique positions unless stated (a leg on 5 tickets counts once).
Inputs: w10/ledger_legs.jsonl, picks.jsonl, w10/game_recs_graded.jsonl, expert_grades.jsonl, prop_screen_scores.json, box scores,
weather-venue files, master-intel pulls (splits), DKP feed (W10 ladders). Output: w10/failure_modes.json. Run from repo root."""
import json, sys, collections, re, glob, math, random, itertools, os
sys.path.insert(0, 'reports/analysis/season/claude/scripts'); sys.path.insert(0, 'reports/analysis/midseason-2026')
import lib, tw
random.seed(20261116)
M = 'reports/analysis/midseason-2026/'
LEGS = [json.loads(l) for l in open(M + 'w10/ledger_legs.jsonl')]
def uq(rows):
    s = {}
    for l in rows: s[(l['week'], l['game'], l['player'], l['key'], l['dir'], l['line'], l['need'], l['team'] if not l['player'] else None, l['half'])] = l
    return list(s.values())
U = uq(LEGS)
def wl(rows):
    w = sum(l['result'] == 'W' for l in rows); n = sum(l['result'] in 'WL' for l in rows)
    pr = [1 / l['dec'] for l in rows if l.get('dec') and l['result'] in 'WL']
    return dict(w=w, l=n - w, rate=round(w / n, 3) if n else None, ci=[round(x, 3) for x in lib.wilson(w, n)], n=n, small_n=n < 20,
                priced=len(pr), avg_breakeven=round(sum(pr) / len(pr), 3) if pr else None,
                priced_rate=round(sum(l['result'] == 'W' for l in rows if l.get('dec') and l['result'] in 'WL') / len(pr), 3) if pr else None)
def binom_p_ge(k, n, p): return sum(math.comb(n, i) * p ** i * (1 - p) ** (n - i) for i in range(k, n + 1))
out = {}
P = [json.loads(l) for l in open(M + 'picks.jsonl')]
RECS = [json.loads(l) for l in open(M + 'w10/game_recs_graded.jsonl')]
EXP = [json.loads(l) for l in open(M + 'expert_grades.jsonl')]
SCR = json.load(open(M + 'prop_screen_scores.json'))['rows']
simple = lambda rows: (lambda w, n: dict(w=w, l=n - w, rate=round(w / n, 3) if n else None, ci=[round(x, 3) for x in lib.wilson(w, n)], n=n, small_n=n < 20))(sum(r['result'] == 'W' for r in rows), sum(r['result'] in ('W', 'L') for r in rows))
# ---------- 1. receiving-yard Overs
ry = lambda l: l['cat'] == 'Receiving yds' and l['dir'] != 'under'
paper = [p for p in P if p['layer'] == 'paper_leg' and p.get('key') == 'rec_yds']
out['rec_yds_overs'] = dict(
    placed_w1_9=wl([l for l in U if ry(l) and l['week'] <= 9]), placed_w10=wl([l for l in U if ry(l) and l['week'] == 10]), placed_all=wl([l for l in U if ry(l)]),
    placed_by_threshold={k: wl([l for l in U if ry(l) and f((l['need'] or l['line'] or 0))]) for k, f in (('under 40', lambda t: t < 40), ('40-69', lambda t: 40 <= t < 70), ('70+', lambda t: t >= 70))},
    paper_ai_all=simple(paper), paper_ai_w10=simple([p for p in paper if p['week'] == 10]),
    ai_recs_overs=simple([r for r in RECS if r['key'] == 'rec_yds' and r['dir'] == 'over' and not r['passed']]),
    ai_recs_unders=simple([r for r in RECS if r['key'] == 'rec_yds' and r['dir'] == 'under' and not r['passed']]),
    experts=simple([e for e in EXP if e.get('graded_market') == 'receiving_yards' and 'over' in (e.get('selection') or '').lower()]),
    prop_screen_w9_overs=simple([s for s in SCR if s['mk'] == 'rec_yds' and s['side'].lower() == 'over']),
    prop_screen_w9_unders=simple([s for s in SCR if s['mk'] == 'rec_yds' and s['side'].lower() == 'under']),
    receptions_overs_placed=wl([l for l in U if l['cat'] == 'Receptions' and l['dir'] != 'under']),
    margins_lost=sorted(round(l['margin']) for l in U if ry(l) and l['result'] == 'L' and l['margin'] is not None)[-25:])
# ---------- 2. committee-RB / backup ATDs: role from prior weeks only
G = lib.load_games()
carries = collections.defaultdict(lambda: collections.defaultdict(float)); teamc = collections.defaultdict(lambda: collections.defaultdict(float))
recs_ = collections.defaultdict(lambda: collections.defaultdict(float))
for (wk, key), g in G.items():
    for pn, p in g['players'].items():
        c = lib.num((p.get('rushing') or {}).get('CAR')); qb = bool((p.get('passing') or {}).get('C/ATT')) and lib.num(((p.get('passing') or {}).get('C/ATT') or '0/0').split('/')[1]) >= 5
        if c and not qb: carries[lib.norm(pn)][wk] += c; teamc[p['team']][wk] += c
        recs_[lib.norm(pn)][wk] += lib.num((p.get('receiving') or {}).get('REC'))
def role(l):
    n = lib.norm(l['player']); wk = l['week']; prior = [w for w in range(max(1, wk - 4), wk)]
    pc = sum(carries[n].get(w, 0) for w in prior); tc = sum(teamc[l['team']].get(w, 0) for w in prior) if l['team'] else 0
    gp = sum(1 for w in prior if carries[n].get(w, 0) or recs_[n].get(w, 0))
    if not prior or gp == 0: return 'no prior games (rookie/returning/W1)'
    sh = pc / tc if tc else 0
    if sh >= 0.55: return 'lead RB (55%+ of RB carries, prior 4 wks)'
    if sh >= 0.15: return 'committee / backup RB (15-55%)'
    return 'WR / TE / other'
atd = [l for l in U if l['cat'] == 'Anytime TD']
by_role = collections.defaultdict(list)
for l in atd: by_role[role(l)].append(l)
out['atd_by_role'] = dict(all=wl(atd), **{k: wl(v) for k, v in sorted(by_role.items())},
                          committee_w10=[(l['player'], l['result']) for l in by_role['committee / backup RB (15-55%)'] if l['week'] == 10],
                          by_role_w5_10={k: wl([l for l in v if l['week'] >= 5]) for k, v in sorted(by_role.items())})
# ---------- 3. defender tackles by game script
tk = [l for l in U if l['cat'] == 'Tackles+Ast']
def fav(l): return 'no line' if l['team_spread'] is None else 'big favorite (-7 or more)' if l['team_spread'] <= -7 else 'favorite (-1 to -6.5)' if l['team_spread'] < 0 else 'underdog / pick'
bt = collections.defaultdict(list)
for l in tk: bt[fav(l)].append(l)
out['tackles_by_spread'] = dict(all=wl(tk), **{k: wl(v) for k, v in sorted(bt.items())},
                                big_fav_legs=[(l['week'], l['player'], l['team'], l['team_spread'], l['need'] or l['line'], l['actual'], l['result']) for l in bt['big favorite (-7 or more)']])
# ---------- 4. milestone choice
NOTCH = {'rush_yds': 10, 'rec_yds': 10, 'pass_yds': 25, 'rush_rec_yds': 10, 'rec': 1, 'carries': 1, 'tackles': 1, 'completions': 1, 'pass_att': 1, 'pass_td': 1, 'fgm': 1}
ms = [l for l in U if l['key'] in NOTCH and l['dir'] != 'under' and l['margin'] is not None and l['result'] in 'WL']
def notch_tab(rows):
    t = collections.defaultdict(lambda: dict(n=0, lost=0, lost_by_one_notch=0, won=0, won_by_under_one_notch=0))
    for l in rows:
        k = l['cat']; n = NOTCH[l['key']]; b = t[k]; b['n'] += 1
        if l['result'] == 'L': b['lost'] += 1; b['lost_by_one_notch'] += (-l['margin'] <= n)
        else: b['won'] += 1; b['won_by_under_one_notch'] += (l['margin'] < n)
    for b in t.values():
        b['rate_now'] = round(b['won'] / b['n'], 3); b['rate_one_notch_lower'] = round((b['won'] + b['lost_by_one_notch']) / b['n'], 3)
    return dict(t)
tot = lambda rows: (lambda t: dict(n=sum(b['n'] for b in t.values()), won=sum(b['won'] for b in t.values()), lost_by_one_notch=sum(b['lost_by_one_notch'] for b in t.values()),
                                   won_by_under_one_notch=sum(b['won_by_under_one_notch'] for b in t.values())))(notch_tab(rows))
out['milestones'] = dict(notch_definition=NOTCH, w1_10=notch_tab(ms), w10=notch_tab([l for l in ms if l['week'] == 10]), total_w1_10=tot(ms), total_w10=tot([l for l in ms if l['week'] == 10]),
                         dkp_only_w10=tot([l for l in ms if l['week'] == 10 and 'DraftKings' in str(l['book'])]))
byt = collections.defaultdict(list)
for l in LEGS: byt[l['ticket']].append(l)
def one_notch_miss(l): return l['key'] in NOTCH and l['dir'] != 'under' and l['margin'] is not None and l['result'] == 'L' and -l['margin'] <= NOTCH[l['key']]
flip = [t for t, ls in byt.items() if any(l['result'] == 'L' for l in ls) and all(one_notch_miss(l) for l in ls if l['result'] == 'L')]
out['milestones']['tickets_lost_only_on_one_notch_misses'] = dict(w1_10=len(flip), w10=[t[4:70] for t in flip if byt[t][0]['week'] == 10], by_week=dict(sorted(collections.Counter(byt[t][0]['week'] for t in flip).items())),
    potential_payout_forgone=round(sum(float(w.get('potential_payout_usd') or 0) for w in lib.load_wagers() if w['id'] in flip and lib.is_cash(w)), 2))
cost = collections.defaultdict(list)
for fpath in sorted(glob.glob('data/generated/props/draftkings-predictions-feed-2026-11-1[3-6]-week10.json')):
    d = json.load(open(fpath)); lad = collections.defaultdict(dict)
    for r in d.get('rows', []):
        if r.get('player') and r.get('milestone') is not None and r.get('decimal') and str(r.get('side', 'Over')).lower() in ('over', 'yes', ''):
            lad[(r['game'], r['player'], r['market'])][float(r['milestone'])] = float(r['decimal'])
    for (g_, pl, mk), rungs in lad.items():
        ks = sorted(rungs)
        for a, b in zip(ks, ks[1:]):
            if 1.2 <= rungs[b] <= 6 and rungs[a] > 1.01: cost[mk].append((1 / rungs[a]) - (1 / rungs[b]))
out['milestones']['dkp_notch_price_cost_w10'] = {k: dict(pairs=len(v), avg_implied_prob_gain_per_notch_lower=round(sum(v) / len(v), 3), median=round(sorted(v)[len(v) // 2], 3)) for k, v in sorted(cost.items(), key=lambda kv: -len(kv[1]))[:14] if len(v) >= 10}
# ---------- 5. public sides
splits = {}
for fpath in sorted(glob.glob('data/generated/master-intel/w*-pull.json')):
    try: d = json.load(open(fpath))
    except Exception: continue
    for s in d.get('splits') or []:
        if s.get('spread_home_bettors') is None: continue
        splits[(int(s['week']), lib.T(s['home_team']))] = s
res = {}
for r in tw.rows():
    try: res[(int(r['week']), lib.T(r['team']))] = (float(r['pts']) - float(r['opp_pts']), float(r['line']), float(r['pts']) + float(r['opp_pts']), float(r['total']), r['home_away'], lib.T(r['opp']))
    except (ValueError, TypeError): pass
pub = collections.defaultdict(lambda: [0, 0])
for (wk, home), s in splits.items():
    if (wk, home) not in res: continue
    mg, line, tot_, tl, _, _ = res[(wk, home)]; cover = mg + line
    hb = float(s['spread_home_bettors']); hm = s.get('spread_home_money'); ob = s.get('total_over_bettors')
    if cover != 0:
        if hb >= 60 or hb <= 40:
            pub['public spread side (60%+ of bets)'][0] += (hb >= 60) == (cover > 0); pub['public spread side (60%+ of bets)'][1] += 1
        if hb >= 70 or hb <= 30:
            pub['public spread side (70%+ of bets)'][0] += (hb >= 70) == (cover > 0); pub['public spread side (70%+ of bets)'][1] += 1
        if hm is not None and abs(float(hm) - hb) >= 10:
            pub['money side when money% - bets% gap >= 10'][0] += (float(hm) > hb) == (cover > 0); pub['money side when money% - bets% gap >= 10'][1] += 1
    if ob is not None and tot_ != tl and (float(ob) >= 65 or float(ob) <= 35):
        pub['public total side (65%+ of bets)'][0] += (float(ob) >= 65) == (tot_ > tl); pub['public total side (65%+ of bets)'][1] += 1
mine = collections.defaultdict(list)
for l in U:
    if l['key'] != 'spread' or not l['team'] or l['half']: continue
    s = splits.get((l['week'], l['team'])); hb = None
    if s: hb = float(s['spread_home_bettors'])
    else:
        r_ = res.get((l['week'], l['team']))
        s = splits.get((l['week'], r_[5])) if r_ else None
        if s: hb = 100 - float(s['spread_home_bettors'])
    if hb is None: continue
    mine['with the public (55%+ of bets on our side)' if hb >= 55 else 'against the public (45% or less on our side)' if hb <= 45 else 'split (45-55%)'].append(l)
out['public_sides'] = dict(weeks_with_splits=sorted({k[0] for k in splits}), games=len(splits),
                           market={k: dict(record=f'{v[0]}-{v[1] - v[0]}', rate=round(v[0] / v[1], 3), ci=[round(x, 3) for x in lib.wilson(v[0], v[1])], small_n=v[1] < 20) for k, v in pub.items()},
                           our_spread_legs={k: wl(v) for k, v in mine.items()})
# ---------- 6. totals in wind / weather (W5-10)
wx = {}
for fpath in sorted(glob.glob('data/research-intel/review/2026-w*-weather-venue.json')):
    if '.bak' in fpath: continue
    d = json.load(open(fpath))
    for r in d.get('rows', []):
        try: a, h = [lib.T(x) for x in r['game'].split('@')]
        except Exception: continue
        wx[(int(d['week']), h)] = r
wt = collections.defaultdict(lambda: [0, 0, 0.0]); windy_games = []
for (wk, home), r in wx.items():
    if (wk, home) not in res: continue
    mg, line, tot_, tl, _, opp = res[(wk, home)]
    wind = float(r.get('wind_kmh') or 0); gust = float(r.get('gust_kmh') or 0); mat = str(r.get('materiality') or 'none').lower()
    indoor = bool(re.search(r'dome|roof|indoor', str(r.get('note', '')).lower()))
    k = 'indoor / roof' if indoor else 'windy (wind 25+ km/h or gust 40+)' if (wind >= 25 or gust >= 40) else 'breezy (wind 15-25)' if wind >= 15 else 'calm outdoor'
    if tot_ != tl: wt[k][0] += tot_ < tl; wt[k][1] += 1
    wt[k][2] += tot_ - tl
    if k.startswith('windy'): windy_games.append((wk, f'{opp}@{home}', wind, gust, tl, tot_, mat))
our_tot = collections.defaultdict(list)
for l in U:
    if l['key'] != 'total' or l['half']: continue
    m = re.match(r'\s*([A-Za-z]{2,3})\s*@\s*([A-Za-z]{2,3})', l['game'] or ''); r = wx.get((l['week'], lib.T(m.group(2)))) if m else None
    if not r: continue
    wind = float(r.get('wind_kmh') or 0); gust = float(r.get('gust_kmh') or 0)
    our_tot[('windy/breezy (15+ km/h)' if wind >= 15 or gust >= 40 else 'calm or indoor') + ' | ' + ('Under' if l['dir'] == 'under' else 'Over')].append(l)
out['weather_totals'] = dict(games={k: dict(unders=f'{v[0]}-{v[1] - v[0]}', n=v[1], avg_total_minus_close=round(v[2] / max(1, v[1]), 1), small_n=v[1] < 20) for k, v in sorted(wt.items())},
                             windy_games=sorted(windy_games), our_total_legs={k: wl(v) for k, v in sorted(our_tot.items())},
                             all_total_legs=dict(under=wl([l for l in U if l['key'] == 'total' and l['dir'] == 'under' and not l['half']]), over=wl([l for l in U if l['key'] == 'total' and l['dir'] != 'under' and not l['half']])))
# ---------- 7. QB INT: real or luck?
qi = [l for l in U if l['cat'] == 'QB INT thrown' and l['dir'] != 'under']
base = [0, 0]
for (wk, key), g in G.items():
    for pn, p in g['players'].items():
        ca = ((p.get('passing') or {}).get('C/ATT') or '0/0').split('/')
        if len(ca) > 1 and lib.num(ca[1]) >= 15: base[0] += lib.num((p.get('passing') or {}).get('INT')) >= 1; base[1] += 1
q = wl(qi); p0 = base[0] / base[1]
pr = [l for l in qi if l.get('dec')]
out['qb_int'] = dict(our_legs=q, by_period={'W1-4': wl([l for l in qi if l['week'] <= 4]), 'W5-9': wl([l for l in qi if 5 <= l['week'] <= 9]), 'W10': wl([l for l in qi if l['week'] == 10])},
                     league_base_rate_qb_15plus_att=dict(with_int=base[0], qb_games=base[1], rate=round(p0, 3)),
                     p_value_vs_league_base=round(binom_p_ge(q['w'], q['n'], p0), 3),
                     priced=dict(n=len(pr), won=sum(l['result'] == 'W' for l in pr), avg_breakeven=round(sum(1 / l['dec'] for l in pr) / len(pr), 3) if pr else None,
                                 units=round(sum((l['dec'] - 1) if l['result'] == 'W' else -1 for l in pr), 2),
                                 p_value_vs_price=round(binom_p_ge(sum(l['result'] == 'W' for l in pr), len(pr), sum(1 / l['dec'] for l in pr) / len(pr)), 3) if pr else None),
                     by_qb=sorted(((k, f"{sum(x['result'] == 'W' for x in v)}-{sum(x['result'] == 'L' for x in v)}") for k, v in ((k, list(v)) for k, v in itertools.groupby(sorted(qi, key=lambda l: l['player']), key=lambda l: l['player']))), key=lambda kv: -int(kv[1].split('-')[0]) - int(kv[1].split('-')[1]))[:14],
                     all_placed_not_unique=wl([l for l in LEGS if l['cat'] == 'QB INT thrown' and l['dir'] != 'under']))
# ---------- construction: leg count vs realized
tix = {}
for t, ls in byt.items():
    l0 = ls[0]
    if not l0['cash'] or 'RR' in l0['family'] or 'legacy' in t: continue
    tix[t] = ls
bucket = lambda n: str(n) if n <= 4 else '5-6' if n <= 6 else '7-8' if n <= 8 else '9+'
cons = collections.defaultdict(lambda: dict(tickets=0, won=0, legs=0, legs_won=0, one_leg_short=0, two_short=0))
for t, ls in tix.items():
    n = ls[0]['n_legs']; b = cons[bucket(n)]; miss = sum(l['result'] == 'L' for l in ls)
    b['tickets'] += 1; b['won'] += ls[0]['ticket_result'] == 'win'; b['legs'] += len(ls); b['legs_won'] += sum(l['result'] == 'W' for l in ls)
    b['one_leg_short'] += miss == 1; b['two_short'] += miss == 2
for k, b in cons.items():
    p = b['legs_won'] / b['legs']; n = b['legs'] / b['tickets']
    b.update(leg_rate=round(p, 3), avg_legs=round(n, 1), cash_rate=round(b['won'] / b['tickets'], 3), expected_cash_rate_if_independent=round(p ** n, 4),
             expected_one_short_if_independent=round(n * p ** (n - 1) * (1 - p), 3), one_short_rate=round(b['one_leg_short'] / b['tickets'], 3))
out['leg_count'] = dict(sorted(cons.items()))
out['leg_count']['reference_at_57pct'] = {str(n): round(0.57 ** n, 4) for n in (3, 4, 5, 6, 7, 8)}
# ---------- DKP combo pricing
W = lib.load_wagers(); dk = []
for w in W:
    if 'DraftKings Predictions' not in str(w.get('book')) or not w.get('week') or w['week'] > 10: continue
    st, pay = float(w.get('stake_usd') or 0), float(w.get('potential_payout_usd') or 0)
    if not st or not pay: continue
    ls = lib.real_legs(w); games = collections.Counter(str(l.get('game')) for l in ls); n = len(ls)
    try: boost = float(w.get('boost_pct') or w.get('boost_percent') or 0)
    except (TypeError, ValueError): boost = 0
    teams_def = collections.Counter(l.get('team') for l in ls if str(l.get('market')) in ('tackles_assists', 'sacks', 'tackles_combined'))
    dk.append(dict(week=w['week'], id=w['id'][4:64], legs=n, multiple=round(pay / st, 2), per_leg_decimal=round((pay / st) ** (1 / n), 3), games=len(games), max_same_game=max(games.values()),
                   same_team_def_legs=max(teams_def.values()) if teams_def else 0, boost=boost, displayed_prob=w.get('displayed_probability_pct'), result=w.get('result')))
agg = collections.defaultdict(list)
for d in dk: agg[('single game' if d['games'] == 1 else 'multi game') + f" | {bucket(d['legs'])} legs"].append(d)
med = lambda v: sorted(v)[len(v) // 2] if v else None
out['dkp_pricing'] = dict(n=len(dk), max_multiple=max(d['multiple'] for d in dk), top=sorted(dk, key=lambda d: -d['multiple'])[:8],
                          by_shape={k: dict(n=len(v), median_multiple=med([x['multiple'] for x in v]), min=min(x['multiple'] for x in v), max=max(x['multiple'] for x in v),
                                            median_per_leg_decimal=med([x['per_leg_decimal'] for x in v]), won=sum(x['result'] == 'win' for x in v)) for k, v in sorted(agg.items())},
                          same_team_def=dict(two_plus=[(d['id'][:44], d['legs'], d['multiple'], d['per_leg_decimal']) for d in dk if d['same_team_def_legs'] >= 2][:10],
                                             median_per_leg_two_plus=med([d['per_leg_decimal'] for d in dk if d['same_team_def_legs'] >= 2 and d['games'] == 1]),
                                             median_per_leg_single_game_other=med([d['per_leg_decimal'] for d in dk if d['same_team_def_legs'] < 2 and d['games'] == 1])),
                          displayed_prob_vs_price=[(d['id'][:40], d['multiple'], d['displayed_prob'], round(100 / d['multiple'], 1)) for d in dk if d['displayed_prob']][:12])
# ---------- round robins and Island tiers
rr = [w for w in W if w.get('week') and w['week'] <= 10 and w.get('status') == 'SETTLED' and ('RR' in lib.family(w))]
out['round_robins'] = {fam: dict(tickets=len(v), won=sum(w['result'] == 'win' for w in v), staked=round(sum(float(w['stake_usd']) for w in v), 2),
                                 net=round(sum(float(w.get('settled_payout_usd') or 0) - float(w['stake_usd']) for w in v), 2),
                                 by_week=[(w['week'], round(float(w.get('settled_payout_usd') or 0) - float(w['stake_usd']), 2)) for w in v])
                       for fam, v in ((f, [w for w in rr if lib.family(w) == f]) for f in sorted({lib.family(w) for w in rr}))}
isl = [w for w in W if w.get('week') and w['week'] <= 10 and w.get('status') == 'SETTLED' and lib.family(w).startswith('Island')]
def tierof(w):
    s = (w['id'] + ' ' + str(w.get('game_title')) + ' ' + str(w.get('card_section'))).lower()
    m = re.search(r'tier ?([123])|\bt([123])\b|slot ?([123])\b', s)
    if m: return 'Tier ' + next(x for x in m.groups() if x)
    return 'moonshot/lottery' if re.search(r'moonshot|lotto|lottery', s) else 'untiered'
it = collections.defaultdict(list)
for w in isl: it[tierof(w)].append(w)
def dec_of(w):
    try:
        d = float(w.get('odds_decimal'))
        if d > 1: return d
    except (TypeError, ValueError): pass
    return float(w['potential_payout_usd']) / float(w['stake_usd']) if w.get('potential_payout_usd') and float(w.get('stake_usd') or 0) else None
band = lambda d: 'under +400' if d < 5 else '+400 to +1500' if d < 16 else '+1500 to +5000' if d < 51 else '+5000 up'
def isum(v): return dict(tickets=len(v), won=sum(w['result'] == 'win' for w in v), staked=round(sum(float(w['stake_usd']) for w in v if lib.is_cash(w)), 2),
                         net=round(sum(float(w.get('settled_payout_usd') or 0) - float(w['stake_usd']) for w in v if lib.is_cash(w)), 2),
                         median_decimal=(lambda x: round(med(x), 1) if x else None)([dec_of(w) for w in v if dec_of(w)]),
                         expected_wins_at_price=round(sum(1 / dec_of(w) for w in v if dec_of(w)), 2), avg_legs=round(sum(lib.n_legs(w) for w in v) / len(v), 1),
                         legs=wl([l for w in v for l in byt.get(w['id'], [])]))
out['island_tiers'] = {k: isum(v) for k, v in sorted(it.items())}
out['island_by_odds_band'] = {k: isum([w for w in isl if dec_of(w) and band(dec_of(w)) == k]) for k in ('under +400', '+400 to +1500', '+1500 to +5000', '+5000 up')}
# ---------- Alejandro "core split" backtest (walk-forward)
props = [l for l in U if l['group'] != 'side/total' and l['cat'] not in ('First TD', '2+ TD')]
bt_rows = []; sims = {3: [0, 0, 0.0], 4: [0, 0, 0.0]}
DEFAULT_DEC = 1.80
for wk in range(5, 11):
    hist = collections.defaultdict(lambda: [0, 0])
    for l in props:
        if l['week'] < wk: hist[l['cat']][0] += l['result'] == 'W'; hist[l['cat']][1] += 1
    strong = [c for c, v in sorted(hist.items(), key=lambda kv: -kv[1][0] / max(1, kv[1][1])) if v[1] >= 20 and v[0] / v[1] >= 0.57][:5]
    pool = [l for l in props if l['week'] == wk and l['cat'] in strong and (l['dec'] is None or l['dec'] <= 2.5)]
    row = dict(week=wk, strong_categories=strong, pool=len(pool), pool_hit=round(sum(l['result'] == 'W' for l in pool) / max(1, len(pool)), 3))
    for k in (3, 4):
        won = n = 0; pay = 0.0; odds = []
        for _ in range(20000):
            if len(pool) < k: break
            pick = random.sample(pool, k)
            if len({l['player'] for l in pick}) < k or len({l['game'] for l in pick}) < min(k, 3): continue
            d = 1.0
            for l in pick: d *= (l['dec'] or DEFAULT_DEC)
            n += 1; odds.append(d); hit = all(l['result'] == 'W' for l in pick); won += hit; pay += d if hit else 0
        row[f'{k}leg'] = dict(combos=n, cash_rate=round(won / n, 3) if n else None, avg_decimal=round(sum(odds) / n, 2) if n else None, roi=round(pay / n - 1, 3) if n else None)
        if n: sims[k][0] += won / n; sims[k][1] += 1; sims[k][2] += pay / n - 1
    bt_rows.append(row)
alej = [w for w in W if w.get('week') and 5 <= w['week'] <= 10 and (float((w.get('ownership_shares') or {}).get('Alejandro') or 0) > 0 or 'lejandro' in str(w.get('split_partner')))]
out['core_split_backtest'] = dict(method="Walk-forward. For week k: prop categories at 57%+ with n>=20 on unique placed legs through week k-1 (top 5). Pool = that week's placed legs in those categories with decimal <= 2.5 (unpriced legs assumed 1.80). 20,000 random 3- and 4-leg combos, different players, 3+ games. Payout = product of leg decimals: no SGP haircut, legs treated as independent.",
                                  weeks=bt_rows, avg_cash_rate={k: round(v[0] / v[1], 3) for k, v in sims.items() if v[1]}, avg_roi={k: round(v[2] / v[1], 3) for k, v in sims.items() if v[1]},
                                  actual_alejandro_w5_10=dict(tickets=len(alej), cashed=sum(w['result'] == 'win' for w in alej), avg_legs=round(sum(lib.n_legs(w) for w in alej) / max(1, len(alej)), 1),
                                                              staked=round(sum(float(w['stake_usd']) for w in alej), 2), net=round(sum(float(w.get('settled_payout_usd') or 0) - float(w['stake_usd']) for w in alej), 2)))
json.dump(out, open(M + 'w10/failure_modes.json', 'w'), indent=1)
for k, v in out.items():
    print('\n## ' + k)
    for a, b in (v.items() if isinstance(v, dict) else []): print('  ', a, json.dumps(b)[:400])
