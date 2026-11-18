"""DKP combo pricing on W10: (1) price cost of one milestone notch from the captured ladders,
(2) each W10 DKP ticket's actual payout multiple vs the product of its legs' single prices from the same day's feed
(ratio < 1 = DKP cut the price for correlation; > 1 = boost or better-than-independent).
Read-only. Output: w10/dkp_pricing.json. Run from repo root."""
import json, sys, glob, collections, re, statistics
sys.path.insert(0, 'reports/analysis/season/claude/scripts'); import lib
M = 'reports/analysis/midseason-2026/'
feeds = {}
for p in sorted(glob.glob('data/generated/props/draftkings-predictions-feed-2026-11-1[1-6]*.json')):
    try: d = json.load(open(p))
    except Exception: continue
    day = re.search(r'feed-(\d{4}-\d{2}-\d{2})', p).group(1); rows = feeds.setdefault(day, {})
    for r in d.get('rows', []):
        if not r.get('decimal'): continue
        who = lib.norm(r['player']) if r.get('player') else (r.get('team') or r.get('label') or '')
        thr = r.get('milestone') if r.get('milestone') is not None else r.get('line')
        side = 'under' if str(r.get('side', '')).lower() == 'under' else 'over'
        rows[(r.get('game'), who, r.get('market'), None if thr is None else float(thr), side, r.get('kind'))] = float(r['decimal'])
# ---- (1) notch cost
cost = collections.defaultdict(list)
for day, rows in feeds.items():
    lad = collections.defaultdict(dict)
    for (g, who, mk, thr, side, kind), dec in rows.items():
        if kind == 'milestone' and thr is not None: lad[(g, who, mk)][thr] = dec
    for k, rungs in lad.items():
        ks = sorted(rungs)
        for a, b in zip(ks, ks[1:]):
            if 1.25 <= rungs[b] <= 4.0 and rungs[a] > 1.02:  # rungs someone would actually play
                cost[k[2]].append((1 / rungs[a] - 1 / rungs[b], rungs[a], rungs[b], b - a))
notch = {mk: dict(pairs=len(v), typical_step=statistics.median(x[3] for x in v), median_implied_gain=round(statistics.median(x[0] for x in v), 3),
                  median_decimal_higher_rung=round(statistics.median(x[2] for x in v), 2), median_decimal_one_lower=round(statistics.median(x[1] for x in v), 2),
                  price_given_up_pct=round(1 - statistics.median(x[1] / x[2] for x in v), 3)) for mk, v in cost.items() if len(v) >= 15}
# ---- (2) ticket multiple vs product of singles
MK = {'receiving_yards': 'rec_yds', 'rushing_yards': 'rush_yds', 'receptions': 'rec', 'carries': 'carries', 'passing_yards': 'pass_yds', 'passing_touchdowns': 'pass_td', 'passing_tds': 'pass_td',
      'anytime_touchdown': 'atd_1_plus', 'anytime_td': 'atd_1_plus', 'touchdowns_2plus': 'td_2_plus', 'two_plus_touchdowns': 'td_2_plus', 'tackles_assists': 'tackles_assists', 'sacks': 'sacks',
      'first_touchdown': 'first_td', 'spread': 'spread', 'total': 'game_total', 'moneyline': 'moneyline'}
out_t = []
for w in lib.load_wagers():
    if w.get('week') != 10 or 'DraftKings Predictions' not in str(w.get('book')): continue
    st, pay = float(w.get('stake_usd') or 0), float(w.get('potential_payout_usd') or 0)
    if not st or not pay: continue
    day = str(w.get('placed_at') or w.get('date'))[:10]; rows = feeds.get(day) or feeds.get(str(w.get('date'))[:10]) or {}
    allrows = {}
    for dd in sorted(feeds): allrows.update(feeds[dd])
    prod = 1.0; matched = 0; legs = lib.real_legs(w); miss = []
    for l in legs:
        n = lib.norm_leg(l, w); mk = MK.get(str(l.get('market')).replace('alternate_', ''))
        g = (l.get('game') or '').replace(' ', ''); who = lib.norm(l['player']) if l.get('player') else None
        thr = n['need'] if n['need'] is not None else n['line']
        cand = None
        for src in (rows, allrows):
            for (fg, fwho, fmk, fthr, fside, fkind), dec in src.items():
                if fmk != mk or fg != g: continue
                if who and fwho != who: continue
                if mk in ('atd_1_plus', 'td_2_plus', 'first_td'): cand = dec; break
                if fthr is None or thr is None: continue
                if fkind == 'milestone' and n['dir'] != 'under' and abs(fthr - thr) < 0.01: cand = dec; break
                if fkind == 'ou' and fside == n['dir'] and abs(fthr - (n['line'] if n['line'] is not None else thr - 0.5)) < 0.01: cand = dec; break
            if cand: break
        if cand: prod *= cand; matched += 1
        else: miss.append(l.get('selection'))
    try: boost = float(w.get('boost_pct') or w.get('boost_percent') or 0)
    except (TypeError, ValueError): boost = 0.0
    games = collections.Counter(str(l.get('game')) for l in legs)
    def_same = max(collections.Counter(l.get('team') for l in legs if str(l.get('market')) in ('tackles_assists', 'sacks')).values() or [0])
    mult = pay / st
    out_t.append(dict(id=w['id'][4:66], legs=len(legs), matched=matched, multiple=round(mult, 2), boost_pct=boost, product_of_singles=round(prod, 2) if matched == len(legs) else None,
                      ratio=round(mult / prod, 3) if matched == len(legs) else None, games=len(games), max_same_game=max(games.values()), same_team_def_legs=def_same, unmatched=miss[:4]))
full = [t for t in out_t if t['ratio']]
def med(v): return round(statistics.median(v), 3) if v else None
res = dict(notch_cost=notch, tickets=out_t, fully_matched=len(full), w10_dkp_tickets=len(out_t),
           ratio_all=med([t['ratio'] for t in full]),
           ratio_single_game=med([t['ratio'] for t in full if t['games'] == 1]), n_single_game=sum(t['games'] == 1 for t in full),
           ratio_multi_game=med([t['ratio'] for t in full if t['games'] > 1]), n_multi_game=sum(t['games'] > 1 for t in full),
           ratio_same_team_def_2plus=med([t['ratio'] for t in full if t['same_team_def_legs'] >= 2]), n_same_team_def_2plus=sum(t['same_team_def_legs'] >= 2 for t in full),
           max_multiple_w10=max(t['multiple'] for t in out_t))
json.dump(res, open(M + 'w10/dkp_pricing.json', 'w'), indent=1)
for k, v in notch.items(): print(k, v)
for t in out_t: print(t['id'][:52], t['legs'], t['matched'], t['multiple'], t['product_of_singles'], t['ratio'], 'games', t['games'], 'def', t['same_team_def_legs'], 'boost', t['boost_pct'], t['unmatched'][:2])
print({k: v for k, v in res.items() if k not in ('notch_cost', 'tickets')})
