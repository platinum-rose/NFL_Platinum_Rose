"""End-of-week analysis (Claude Team 2). Week-parameterised, reads only the settled wagers file + cached ESPN boxes.

  python weekly_review.py --week 4          # writes out/week-04.json, out/season-through-w04.json, out/week-04-summary.md

Per week and season-to-date:
  - cash stake / return / net by book, ticket family, legs per ticket, ticket price band, provenance (Claude vs Andy)
  - promo / trade-credit tickets tracked separately (credit value, never counted as cash)
  - leg hit rates by market on unique positions (one leg on five tickets counts once), with Wilson intervals and,
    where the leg price is on the ticket, implied break-even and return per $1 as a single
  - the W1–3 hypotheses from reports/analysis/w1-3-deep/claude/SUMMARY.md re-tested every week
  - Week 4 build-checklist compliance: which tickets broke which rule and what those tickets returned
Anything under 2 SE is labelled a hypothesis. Nothing here writes to the wagers file.
"""
import argparse, collections, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from lib import *

PROV_FILE = os.path.join(HERE, 'provenance.json')
CUM = os.path.join(ROOT, 'reports/bets/season-recap/cum.json')


# ------------------------------------------------------------------ provenance
def provenance_map(W):
    over = jl(PROV_FILE)['tickets'] if os.path.exists(PROV_FILE) else {}
    team1 = {}
    if os.path.exists(CUM):
        for t in jl(CUM)['T']:
            o = [l.get('origin') for l in t.get('legs', [])]
            if o: team1[t['id']] = sum(x == 'agree' for x in o) / len(o)
    out = {}
    for w in W:
        i = w['id']
        if i in over: out[i] = (over[i]['by'], 'override: ' + over[i].get('why', '')); continue
        if w.get('recommended_by'): out[i] = (w['recommended_by'], 'ticket field'); continue
        txt = ' '.join(str(w.get(k) or '') for k in ('progress_notes', 'game_title')).lower()
        if re.search(r"andy[- ]built|independent action|by andy'?s choice|andy'?s own", txt): out[i] = ('andy', 'notes'); continue
        if i in team1:
            f = team1[i]; out[i] = ('claude' if f >= 0.5 else 'mixed' if f > 0 else 'andy', f'Team 1 leg origins ({f:.0%} AI-agree)'); continue
        if re.search(r'claude (rec|recommended|ladder|card)|ai card|team 2|\btier \d|\bslot \d', txt): out[i] = ('claude', 'notes'); continue
        out[i] = ('unknown', 'no signal')
    return out


# ------------------------------------------------------------------ helpers
def agg(rows, keyf, order=None):
    B = collections.OrderedDict((k, dict(tickets=0, won=0, staked=0.0, returned=0.0)) for k in (order or []))
    for w in rows:
        k = keyf(w); b = B.setdefault(k, dict(tickets=0, won=0, staked=0.0, returned=0.0))
        b['tickets'] += 1; b['won'] += (w.get('result') == 'win'); b['staked'] += cash_stake(w); b['returned'] += cash_return(w)
    for k, b in list(B.items()):
        if not b['tickets']: del B[k]; continue
        b['staked'] = round(b['staked'], 2); b['returned'] = round(b['returned'], 2); b['net'] = round(b['returned'] - b['staked'], 2)
        b['roi'] = round(b['net'] / b['staked'], 4) if b['staked'] else None
    return B


def rate(v):
    w = sum(x['res'] == 'WON' for x in v); n = len(v); lo, hi = wilson(w, n)
    pr = [x for x in v if x.get('dec')]
    ret = round(sum(x['dec'] for x in pr if x['res'] == 'WON') / len(pr), 3) if pr else None
    be = round(sum(1 / x['dec'] for x in pr) / len(pr), 3) if pr else None
    z = round(zscore(sum(x['res'] == 'WON' for x in pr), len(pr), be), 2) if pr and be else None
    return dict(n=n, won=w, hit=round(w / n, 3) if n else None, ci=[round(lo, 3), round(hi, 3)], priced=len(pr),
                ret_per_1=ret, breakeven=be, z_vs_price=z, evidence=evidence(z) if z is not None else 'unpriced')


def split(v, pred, a_lab, b_lab):
    A = [x for x in v if pred(x) is True]; Bv = [x for x in v if pred(x) is False]
    ra, rb = rate(A), rate(Bv)
    z = round(ztwo(ra['won'], ra['n'], rb['won'], rb['n']), 2)
    return {a_lab: ra, b_lab: rb, 'z_diff': z, 'evidence': evidence(z)}


# ------------------------------------------------------------------ legs
def build_legs(W, G, weeks):
    rows = []
    for w in W:
        if w.get('week') not in weeks or w.get('status') != 'SETTLED': continue
        for l in real_legs(w):
            n = norm_leg(l, w); c = category(n); g = game_for(G, w['week'], n['game'])
            res = l.get('status') if l.get('status') in ('WON', 'LOST', 'PUSH') else None
            src = 'wagers file'
            if res is None:
                st, act, _ = grade(n, g)
                if st: res, src = st, 'box (leg was left PENDING on a dead ticket)'
            if res not in ('WON', 'LOST'): continue
            r = dict(week=w['week'], tid=w['id'], book=w.get('book'), cash=is_cash(w), cat=c, grp=group(c), key=n['key'], dir=n['dir'],
                     player=n['player'], sel=n['sel'], res=res, src=src, dec=n['dec'], line=n['line'], need=n['need'],
                     game=g['key'] if g else n['game'])
            if g:
                if n['kind'] == 'prop':
                    pn, p = player_in(g, n['player']); tm = (p or {}).get('team') or n['team']
                else:
                    tm = team_of(n, g) if n['key'] in ('spread', 'ml', 'team_total') else None
                if tm in g['score']:
                    opp = [x for x in g['score'] if x != tm][0]
                    r.update(team=tm, team_won=g['score'][tm] > g['score'][opp], team_patt=g['team'].get(tm, {}).get('patt'),
                             team_tds=sum(1 for _, t in td_plays(g) if t == tm))
            rows.append(r)
    U = collections.OrderedDict()
    for r in rows:
        who = norm(r['player']) if r['player'] else (r.get('team') or r['sel'])
        k = (r['week'], r['game'], who, r['key'], r['dir'], r['need'], r['line'])
        if k not in U: U[k] = dict(r, instances=0)
        U[k]['instances'] += 1
        if not U[k].get('dec') and r.get('dec'): U[k]['dec'] = r['dec']
    return rows, list(U.values())


HYP = [
    ('H1', 'Receiving props hit when the team throws 35+ times', 'W1–3: 25/32 with 35+ team attempts vs 31/82 otherwise (post-game split).'),
    ('H2', 'Anytime TDs hit when the team scores 3+ TDs', 'W1–3: 54% with 3+ team TDs vs 26% otherwise.'),
    ('H3', 'QB markets (pass-TD overs, INT yes) are positive', 'W1–3: INT yes $1.41/$1 (n=8), pass-TD over $1.25 (n=20).'),
    ('H4', 'Sacks are negative', 'W1–3: $0.72 per $1.'),
    ('H5', 'Dog ML beats dog spread', 'W1–3: dog ML $1.19 (n=21) vs dog spread $0.67 (n=33, 2.1 SE).'),
    ('H6', 'Props on the losing team underperform', 'W1–3: 70/157 on the losing team (−1.0 SE).'),
]


def hypotheses(U):
    rec = [x for x in U if x['cat'] in ('Receptions', 'Receiving yds') and x['dir'] != 'under' and x.get('team_patt') is not None]
    atd = [x for x in U if x['cat'] == 'Anytime TD' and x.get('team_tds') is not None]
    props = [x for x in U if x['grp'] != 'side/total' and x.get('team_won') is not None]
    return {
        'H1': split(rec, lambda x: x['team_patt'] >= 35, 'team 35+ att', 'team <35 att'),
        'H2': split(atd, lambda x: x['team_tds'] >= 3, 'team 3+ TDs', 'team <3 TDs'),
        'H3': {'Passing TD over': rate([x for x in U if x['cat'] == 'Passing TDs' and x['dir'] != 'under']),
               'QB INT yes': rate([x for x in U if x['cat'] == 'QB INT thrown' and x['dir'] != 'under'])},
        'H4': {'Sacks': rate([x for x in U if x['cat'] == 'Sacks'])},
        'H5': {'Moneyline (dog)': rate([x for x in U if x['cat'] == 'Moneyline (dog)']),
               'Spread (dog)': rate([x for x in U if x['cat'] == 'Spread (dog)']),
               'Spread (fav)': rate([x for x in U if x['cat'] == 'Spread (fav)'])},
        'H6': split(props, lambda x: not x['team_won'], 'prop on losing team', 'prop on winning team'),
    }


# ------------------------------------------------------------------ checklist compliance (Team 2 Week 4 checklist)
def violations(w):
    v = []; legs = real_legs(w); ns = [norm_leg(l, w) for l in legs]; fam = family(w)
    if fam == '4-team master RR': v.append('4-team master RR')
    if fam in ('Prop parlay / stack', 'Island SGP ladder (TNF/SNF/MNF)', 'Game-line parlay') and len(legs) > 3: v.append('more than 3 legs')
    if fam == 'Game-line parlay' and len(legs) >= 5: v.append('5+ side-leg parlay')
    if any(category(n) == 'Sacks' for n in ns): v.append('sack leg')
    if any(category(n) == 'Spread (dog)' for n in ns) and 'RR' not in fam: v.append('dog spread')
    if len(ns) > 1 and any(n['key'] == 'total' and n['dir'] == 'under' for n in ns): v.append('full-game Under in a parlay')
    if len(ns) > 1 and any(n['dec'] and n['dec'] < 1.5 for n in ns): v.append('leg shorter than −200')
    if is_cash(w) and float(w.get('stake_usd') or 0) > 10 and fam in ('Prop parlay / stack', 'Island SGP ladder (TNF/SNF/MNF)'): v.append('prop ticket over $10')
    return v


def exposure(T, G):
    E = collections.defaultdict(lambda: dict(cash=0.0, tickets=set()))
    for w in T:
        if not is_cash(w) or w.get('round_robin'): continue
        games = {re.sub(r'[^A-Z@]', '', (norm_leg(l, w)['game'] or '').upper()) for l in real_legs(w)}
        games.discard('')
        for gk in games:
            E[(w['week'], gk)]['cash'] += cash_stake(w); E[(w['week'], gk)]['tickets'].add(w['id'])
    rows = sorted([dict(week=k[0], game=k[1], cash=round(v['cash'], 2), tickets=len(v['tickets'])) for k, v in E.items() if v['cash'] > 25],
                  key=lambda x: (x['week'], -x['cash']))
    per = collections.Counter(); out = []
    for r in rows:
        r['games_over_25_that_week'] = sum(1 for x in rows if x['week'] == r['week'])
        per[r['week']] += 1
        if per[r['week']] <= 3: out.append(r)
    return out


# ------------------------------------------------------------------ main
def analyse(W, G, weeks, prov):
    T = [w for w in W if w.get('week') in weeks]
    open_ = [w['id'] for w in T if w.get('status') != 'SETTLED']
    S = [w for w in T if w.get('status') == 'SETTLED']
    cash = [w for w in S if is_cash(w)]; promo = [w for w in S if not is_cash(w)]
    for w in S: w['_prov'] = prov[w['id']][0]
    rows, U = build_legs(W, G, set(weeks))
    cats = collections.defaultdict(list)
    for x in U: cats[x['cat']].append(x)
    V = []
    for w in cash:
        vs = violations(w)
        V.append(dict(id=w['id'], num=w.get('ticket_number'), week=w['week'], title=w.get('game_title'), stake=cash_stake(w),
                      returned=cash_return(w), rules=vs))
    broke = [v for v in V if v['rules']]; kept = [v for v in V if not v['rules']]
    rule_tab = collections.OrderedDict()
    for v in broke:
        for r in v['rules']:
            b = rule_tab.setdefault(r, dict(tickets=0, staked=0.0, returned=0.0)); b['tickets'] += 1; b['staked'] += v['stake']; b['returned'] += v['returned']
    for b in rule_tab.values(): b['staked'] = round(b['staked'], 2); b['returned'] = round(b['returned'], 2); b['net'] = round(b['returned'] - b['staked'], 2)
    def tot(vs):
        s = round(sum(v['stake'] for v in vs), 2); r = round(sum(v['returned'] for v in vs), 2); return dict(tickets=len(vs), staked=s, returned=r, net=round(r - s, 2))
    staked = round(sum(cash_stake(w) for w in cash), 2); ret = round(sum(cash_return(w) for w in cash), 2)
    return dict(
        weeks=list(weeks), open_tickets=open_,
        totals=dict(tickets=len(cash), won=sum(w.get('result') == 'win' for w in cash), staked=staked, returned=ret, net=round(ret - staked, 2),
                    roi=round((ret - staked) / staked, 4) if staked else None),
        promo=dict(tickets=len(promo), credit_staked=round(sum(float(w.get('stake_usd') or 0) for w in promo), 2),
                   credit_value_returned=round(sum(credit_return(w) for w in promo), 2),
                   detail=[dict(id=w['id'], book=w['book'], title=w.get('game_title'), stake=w.get('stake_usd'), result=w.get('result'),
                                value=credit_return(w)) for w in promo]),
        by_week=agg(cash, lambda w: f"Week {w['week']}", [f'Week {k}' for k in weeks]),
        by_book=agg(cash, lambda w: {'Bookmaker': 'Bookmaker.eu'}.get(w.get('book'), w.get('book'))),
        by_family=agg(cash, family, FAMILIES),
        by_legs=agg(cash, legs_bucket, LEGB),
        by_band=agg(cash, price_band, BANDS),
        by_prov=agg(cash, lambda w: w['_prov'], ['claude', 'mixed', 'andy', 'unknown']),
        legs=dict(instances=len(rows), unique=len(U), won_unique=sum(x['res'] == 'WON' for x in U),
                  from_box=sum(1 for x in rows if x['src'] != 'wagers file')),
        by_market={k: dict(rate(v), grp=v[0]['grp']) for k, v in sorted(cats.items(), key=lambda kv: -len(kv[1]))},
        by_group={g: rate([x for x in U if x['grp'] == g]) for g in ('side/total', 'TD scorer', 'QB', 'volume/yardage', 'defense')},
        hypotheses=hypotheses(U), hyp_text=HYP,
        checklist=dict(rules=rule_tab, broke=tot(broke), kept=tot(kept), tickets=V),
        exposure_over_25=exposure(S, G),
        provenance=[dict(id=w['id'], num=w.get('ticket_number'), week=w['week'], by=prov[w['id']][0], why=prov[w['id']][1],
                         family=family(w), stake=cash_stake(w), returned=cash_return(w)) for w in S],
    )


def md(week, wk, sd):
    def money(x): return f"{'−' if x < 0 else '+'}${abs(x):,.2f}"
    L = [f'# Week {week} end-of-week analysis (Claude Team 2)', '',
         f"Generated by `reports/analysis/season/claude/scripts/weekly_review.py --week {week}` from the settled wagers file. "
         'Cash only; promo/trade credits are listed separately. Anything under 2 SE is a hypothesis.', '']
    if wk['open_tickets']: L += [f"**Open tickets (not counted):** {', '.join(wk['open_tickets'])}", '']
    for lab, d in (('Week ' + str(week), wk), ('Season to date', sd)):
        t = d['totals']
        L += [f'## {lab}', '', f"{t['tickets']} cash tickets, {t['won']} won · staked ${t['staked']:,.2f} · returned ${t['returned']:,.2f} · net **{money(t['net'])}**"
              + (f" ({t['roi']*100:+.1f}%)" if t['roi'] is not None else ''), '']
        p = d['promo']
        if p['tickets']: L += [f"Promo/credit: {p['tickets']} tickets, ${p['credit_staked']:.2f} credit → ${p['credit_value_returned']:.2f} value.", '']
        for name, key in (('Book', 'by_book'), ('Ticket family', 'by_family'), ('Legs per ticket', 'by_legs'), ('Price band', 'by_band'), ('Provenance', 'by_prov')):
            L += [f'| {name} | Tickets | Won | Staked | Returned | Net |', '|---|---|---|---|---|---|']
            for k, b in d[key].items(): L.append(f"| {k} | {b['tickets']} | {b['won']} | ${b['staked']:.2f} | ${b['returned']:.2f} | {money(b['net'])} |")
            L.append('')
    L += ['## Leg markets, season to date (unique positions)', '', '| Market | Hit | n | 95% CI | Priced | $ back per $1 | Break-even | z vs price |', '|---|---|---|---|---|---|---|---|']
    for k, r in sd['by_market'].items():
        ret = '—' if r['ret_per_1'] is None else f"${r['ret_per_1']:.2f}"
        be = '—' if r['breakeven'] is None else f"{r['breakeven']*100:.0f}%"
        z = '—' if r['z_vs_price'] is None else r['z_vs_price']
        L.append(f"| {k} | {r['won']}/{r['n']} ({(r['hit'] or 0)*100:.0f}%) | {r['n']} | {r['ci'][0]*100:.0f}–{r['ci'][1]*100:.0f}% | {r['priced']} | {ret} | {be} | {z} |")
    L += ['', '## W1–3 hypotheses re-tested (season to date)', '']
    for h, title, base in HYP:
        L.append(f'**{h}. {title}.** Baseline: {base}')
        for k, r in sd['hypotheses'][h].items():
            if isinstance(r, dict): L.append(f"- {k}: {r['won']}/{r['n']}" + (f", ${r['ret_per_1']:.2f} per $1 on {r['priced']} priced" if r['ret_per_1'] is not None else '') + f" — {r['evidence']}")
            elif k == 'z_diff': L.append(f'- difference: {r} SE')
        L.append('')
    c = sd['checklist']
    L += ['## Build-checklist compliance (season to date)', '',
          f"Tickets that broke at least one rule: {c['broke']['tickets']} · ${c['broke']['staked']:.2f} staked · net {money(c['broke']['net'])}",
          f"Tickets that kept every rule: {c['kept']['tickets']} · ${c['kept']['staked']:.2f} staked · net {money(c['kept']['net'])}", '',
          '| Rule broken | Tickets | Staked | Returned | Net |', '|---|---|---|---|---|']
    for r, b in c['rules'].items(): L.append(f"| {r} | {b['tickets']} | ${b['staked']:.2f} | ${b['returned']:.2f} | {money(b['net'])} |")
    L += ['', '## Cash exposure over $25 on one game (top 3 per week; a parlay counts its full stake against every game in it)', '']
    for x in sd['exposure_over_25']: L.append(f"- Week {x['week']} {x['game']}: ${x['cash']:.2f} across {x['tickets']} tickets ({x['games_over_25_that_week']} games over $25 that week)")
    unk = [p for p in sd['provenance'] if p['by'] == 'unknown']
    if unk: L += ['', f"## Provenance unknown ({len(unk)} tickets) — add them to provenance.json", ''] + [f"- W{p['week']} {p['id']}" for p in unk]
    return '\n'.join(L) + '\n'


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--first', type=int, default=1)
    a = ap.parse_args()
    W = load_wagers(); G = load_games(); prov = provenance_map(W)
    wk = analyse(W, G, [a.week], prov); sd = analyse(W, G, list(range(a.first, a.week + 1)), prov)
    os.makedirs(OUT, exist_ok=True)
    json.dump(wk, open(os.path.join(OUT, f'week-{a.week:02d}.json'), 'w'), indent=1, default=str)
    json.dump(sd, open(os.path.join(OUT, f'season-through-w{a.week:02d}.json'), 'w'), indent=1, default=str)
    open(os.path.join(OUT, f'week-{a.week:02d}-summary.md'), 'w', encoding='utf-8').write(md(a.week, wk, sd))
    t = sd['totals']
    print(f"Week {a.week}: net {wk['totals']['net']:+.2f} on ${wk['totals']['staked']:.2f} · season net {t['net']:+.2f} on ${t['staked']:.2f} "
          f"· open {len(wk['open_tickets'])} · unique legs {sd['legs']['unique']} (from box {sd['legs']['from_box']})")


if __name__ == '__main__':
    main()
