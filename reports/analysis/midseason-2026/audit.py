"""Model audit for the mid-season post-mortem (A1 correlation clusters, A2 price calibration, A5 bootstrap).
Inputs: tickets.jsonl, picks.jsonl (placed_leg rows link to tickets), expert_grades.jsonl, podcast grades.
Output: audit_results.json. Run: python3 audit.py  (from this folder). Deterministic seed."""
import json, collections, random, math, re, glob, os
random.seed(20261113)
T = {t['id']: t for t in map(json.loads, open('tickets.jsonl'))}
P = [json.loads(l) for l in open('picks.jsonl')]
LEDGER = {w['id']: w for w in json.load(open('../../../data/official-picks/user-placed-wagers-2026.json', encoding='utf-8'))}

def net(t):  # cash only, as in the season scorecard
    return (t['returned'] - t['stake']) if t['cash'] else 0.0

# ---------- A1: correlation clusters ----------
FAM = {'receptions': 'recv', 'rec': 'recv', 'rec_yds': 'recv', 'receiving_yards': 'recv', 'rush_yds': 'rush', 'rushing_yards': 'rush',
       'carries': 'rush', 'rush_att': 'rush', 'rushing_attempts': 'rush', 'pass_yds': 'pass', 'pass_td': 'pass', 'passing_yards': 'pass',
       'passing_tds': 'pass', 'completions': 'pass', 'pass_comp': 'pass', 'atd': 'td', 'anytime_td': 'td', 'td2': 'td', 'first_td': 'td',
       'tackles': 'tkl', 'tackles_assists': 'tkl', 'int_thrown': 'int', 'sacks': 'sack'}
def leg_keys(p):
    g = (p.get('game') or '').replace(' ', '')
    if p.get('player'):
        return [(p['week'], g, p['player'].lower(), FAM.get(p.get('key'), p.get('key') or p.get('cat')))]
    lab = (p.get('label') or '').lower()
    if 'over' in lab or 'under' in lab or p.get('cat', '').lower().startswith('total'):
        return [(p['week'], g, 'game_total')]
    return [(p['week'], g, 'side', re.sub(r'[\s+\-\d.()]+$', '', lab))]

legs_by_ticket = collections.defaultdict(list)
for p in P:
    if p['layer'] == 'placed_leg' and p.get('ticket') in T:
        legs_by_ticket[p['ticket']].append(p)
parent = {i: i for i in T}
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]; x = parent[x]
    return x
owner = {}
for tid, legs in legs_by_ticket.items():
    for p in legs:
        for k in leg_keys(p):
            if k in owner: parent[find(tid)] = find(owner[k])
            else: owner[k] = tid
clusters = collections.defaultdict(list)
for tid in T: clusters[find(tid)].append(tid)
cash_ids = [i for i in T if T[i]['cash'] and 'legacy' not in i]  # W10: the March NCAA open-spot fill is off the 2026 bankroll (Andy 11/16)
multi = [c for c in clusters.values() if sum(T[i]['cash'] for i in c) >= 2]
def summarize_period(weeks):
    ids = [i for i in cash_ids if T[i]['week'] in weeks]
    cl = collections.defaultdict(list)
    for i in ids: cl[find(i)].append(i)
    in_multi = [i for c in cl.values() if len(c) >= 2 for i in c]
    return dict(cash_tickets=len(ids), independent_clusters=len(cl), tickets_in_shared_clusters=len(in_multi),
                stake_in_shared=round(sum(T[i]['stake'] for i in in_multi), 2),
                stake_total=round(sum(T[i]['stake'] for i in ids), 2),
                largest_cluster=max((len(c) for c in cl.values()), default=0))
a1 = {'W1-4': summarize_period(range(1, 5)), 'W5-9': summarize_period(range(5, 10)), 'W1-9': summarize_period(range(1, 10)), 'W10': summarize_period([10]), 'W1-10': summarize_period(range(1, 11))}
# biggest cash clusters for the report
big = sorted(((len([i for i in c if T[i]['cash']]), c) for c in clusters.values()), key=lambda x: -x[0])[:5]
a1['largest'] = [{'week': T[c[0]]['week'], 'cash_tickets': n, 'won': sum(T[i]['result'] == 'win' for i in c if T[i]['cash']),
                  'net': round(sum(net(T[i]) for i in c), 2),
                  'shared_legs': sorted({' '.join(map(str, k[2:])) for i in c for p in legs_by_ticket[i] for k in leg_keys(p)
                                         if sum(1 for j in c if any(k in leg_keys(q) for q in legs_by_ticket[j])) >= 2})[:6]}
                 for n, c in big]

# ---------- A5: cluster bootstrap of cash net ----------
def boot(ids, reps=10000):
    cl = collections.defaultdict(float)
    for i in ids: cl[find(i)] += net(T[i])
    vals = list(cl.values()); n = len(vals)
    if n == 0: return None
    sims = sorted(sum(random.choice(vals) for _ in range(n)) for _ in range(reps))
    obs = sum(vals)
    return dict(n_tickets=len(ids), n_clusters=n, net=round(obs, 2), p05=round(sims[int(.05 * reps)], 2), p95=round(sims[int(.95 * reps)], 2),
                p_net_le_0=round(sum(s <= 0 for s in sims) / reps, 3))
def sel(f): return [i for i in cash_ids if f(T[i])]
nine = max((i for i in cash_ids if T[i]['week'] == 6), key=lambda i: net(T[i]))
a5 = {
 'W1-4 all cash': boot(sel(lambda t: t['week'] <= 4)),
 'W5-9 all cash': boot(sel(lambda t: 5 <= t['week'] <= 9)),
 'W5-9 without the W6 9-team hit': boot([i for i in sel(lambda t: 5 <= t['week'] <= 9) if i != nine]),
 'W10 all cash (excl. legacy fill)': boot(sel(lambda t: t['week'] == 10)),
 'W5-10 all cash': boot(sel(lambda t: 5 <= t['week'] <= 10)),
 'W5-10 without the W6 9-team hit': boot([i for i in sel(lambda t: 5 <= t['week'] <= 10) if i != nine]),
 'W1-10 all cash': boot(sel(lambda t: t['week'] <= 10)),
 '7+ leg cash tickets (W1-10)': boot(sel(lambda t: t['legs_bucket'] in ('7+', '7-8', '9+') or t['n_legs'] >= 7)),
 '7+ leg cash tickets without the W6 9-team hit': boot([i for i in sel(lambda t: t['n_legs'] >= 7) if i != nine]),
 'Island SGP ladder cash (W1-10)': boot(sel(lambda t: t['family'].startswith('Island'))),
 'Prop parlay / stack cash (W1-10)': boot(sel(lambda t: t['family'].startswith('Prop parlay'))),
 'Game-line parlays (W1-10)': boot(sel(lambda t: t['family'] == 'Game-line parlay')),
 '2-leg tickets': boot(sel(lambda t: t['legs_bucket'] == '2')),
 '3-leg tickets': boot(sel(lambda t: t['legs_bucket'] == '3')),
 '4-team master RRs': boot(sel(lambda t: 'round robin' in t['family'].lower() or 'master' in t['family'].lower())),
 'BetOnline cash': boot(sel(lambda t: 'BetOnline' in t['book'])),
 'Bookmaker cash': boot(sel(lambda t: t['book'].startswith('Bookmaker'))),
}
a5['_nine_team_ticket'] = {'id': nine, 'net': round(net(T[nine]), 2)}

# ---------- A2: price calibration (does a ticket hit more often than its price implies?) ----------
rows = []
for i in cash_ids:
    w = LEDGER.get(i, {}); dec = w.get('odds_decimal')
    try: dec = float(dec)
    except (TypeError, ValueError):
        dec = (T[i]['returned'] / T[i]['stake']) if (T[i]['result'] == 'win' and T[i]['stake']) else None
        if dec is None and w.get('potential_payout_usd') and w.get('stake_usd'):
            dec = float(w['potential_payout_usd']) / float(w['stake_usd'])
    if not dec or dec <= 1: continue
    if T[i]['result'] not in ('win', 'loss'): continue
    rows.append((1 / dec, 1 if T[i]['result'] == 'win' else 0, T[i]['week']))
bins = [(0, .05), (.05, .15), (.15, .3), (.3, .45), (.45, .6), (.6, 1.01)]
a2 = []
for lo, hi in bins:
    b = [r for r in rows if lo <= r[0] < hi]
    if not b: continue
    a2.append(dict(implied=f'{lo:.0%}-{min(hi,1):.0%}', n=len(b), implied_avg=round(sum(r[0] for r in b) / len(b), 3),
                   hit_rate=round(sum(r[1] for r in b) / len(b), 3), wins=sum(r[1] for r in b),
                   expected_wins=round(sum(r[0] for r in b), 1)))
a2_tot = dict(n=len(rows), wins=sum(r[1] for r in rows), expected_wins=round(sum(r[0] for r in rows), 1))
for lab, ws in (('W1-4', range(1, 5)), ('W5-9', range(5, 10)), ('W10', [10])):
    rr = [r for r in rows if r[2] in ws]
    a2_tot[lab] = dict(n=len(rr), wins=sum(r[1] for r in rr), expected_wins=round(sum(r[0] for r in rr), 1))
# note: implied prob includes the vig, so "wins = expected" is roughly break-even minus margin

# ---------- A5b: bootstrap of expert/podcast units by outlet ----------
E = [json.loads(l) for l in open('expert_grades.jsonl')]
by = collections.defaultdict(list)
for e in E:
    if e.get('units') is None or e.get('result') not in ('W', 'L', 'P'): continue
    by[(e['kind'], e.get('outlet') or '?')].append(float(e['units']))
def boot_units(v, reps=10000):
    n = len(v); s = sorted(sum(random.choice(v) for _ in range(n)) for _ in range(reps))
    return dict(n=n, units=round(sum(v), 1), p05=round(s[int(.05 * reps)], 1), p95=round(s[int(.95 * reps)], 1), p_le_0=round(sum(x <= 0 for x in s) / reps, 3))
a5b = {f'{k[0]}: {k[1]}': boot_units(v) for k, v in sorted(by.items(), key=lambda kv: -len(kv[1])) if len(v) >= 30}
# market-level (all expert kinds)
bm = collections.defaultdict(list)
for e in E:
    if e.get('units') is None or e.get('result') not in ('W', 'L', 'P'): continue
    bm[e.get('graded_market') or e.get('market')].append(float(e['units']))
a5c = {k: boot_units(v) for k, v in bm.items() if len(v) >= 30}


# ---------- A5d: podcast units by outlet (weekly grade files + older formats) ----------
pod = collections.defaultdict(list); pod_rec = collections.defaultdict(lambda: [0, 0])
for f in sorted(glob.glob('../../intel/w*-podcast-pick-grades.json')):
    d = json.load(open(f, encoding='utf-8'))
    for g in d.get('grades', []):
        if g.get('duplicate_of_earlier') or g.get('units') is None or g.get('result') not in ('W', 'L', 'P'): continue
        if g.get('market') == 'futures': continue
        pod[g.get('outlet') or '?'].append(float(g['units']))
        if g['result'] in ('W', 'L'): pod_rec[g.get('outlet') or '?'][0 if g['result'] == 'W' else 1] += 1
for l in open('podcast_old_grades.jsonl'):
    g = json.loads(l)
    if g.get('units') is None or g.get('result') not in ('W', 'L', 'P'): continue
    pod[g.get('source') or '?'].append(float(g['units']))
    if g['result'] in ('W', 'L'): pod_rec[g.get('source') or '?'][0 if g['result'] == 'W' else 1] += 1
a5d = {k: dict(boot_units(v), record=f'{pod_rec[k][0]}-{pod_rec[k][1]}') for k, v in sorted(pod.items(), key=lambda kv: -len(kv[1])) if len(v) >= 20}

# ---------- A1b: pairwise overlap (non-transitive) ----------
wk_t = collections.defaultdict(list)
for i in cash_ids: wk_t[T[i]['week']].append(i)
kset = {i: {k for p in legs_by_ticket[i] for k in leg_keys(p)} for i in cash_ids}
def overlap(weeks):
    shared = tot = 0; pairs = sharing_pairs = 0
    for w in weeks:
        ids = wk_t[w]
        for i in ids:
            others = set().union(*(kset[j] for j in ids if j != i)) if len(ids) > 1 else set()
            shared += len(kset[i] & others); tot += len(kset[i])
        for a in range(len(ids)):
            for b in range(a + 1, len(ids)):
                pairs += 1; sharing_pairs += bool(kset[ids[a]] & kset[ids[b]])
    return dict(legs=tot, legs_also_on_another_ticket=shared, pct=round(shared / tot, 3) if tot else None,
                same_week_pairs=pairs, pairs_sharing_a_leg=sharing_pairs, pair_pct=round(sharing_pairs / pairs, 3) if pairs else None)
a1['pairwise'] = {'W1-4': overlap(range(1, 5)), 'W5-9': overlap(range(5, 10)), 'W10': overlap([10])}

out = dict(generated='2026-11-16', scope='W1-10', a1_correlation=a1, a2_price_calibration=dict(bins=a2, totals=a2_tot), a5_bootstrap_cash=a5,
           a5_bootstrap_experts=a5b, a5_bootstrap_markets=a5c, a5_bootstrap_podcasts=a5d)
json.dump(out, open('audit_results.json', 'w'), indent=1)
print(json.dumps({'pairwise':a1['pairwise'],'podcasts':a5d}, indent=1))
