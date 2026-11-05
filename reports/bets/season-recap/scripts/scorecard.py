#!/usr/bin/env python3
"""Fixed weekly scorecard (same sections every week, so weeks compare).

  python3 scripts/scorecard.py --week 9 [--legs w9legs.json] [--paper w9paper.json] [--outdir work/w9]
  -> scorecard_w9.json, scorecard_w9.md, scorecard_w9.html (a <section> page_week.py drops into the post-mortem page)

Sections
  1 Cash net (cash tickets as tagged; promo, bonus and free-bet tickets excluded)
  2 Legs per ticket vs tickets won
  3 P&L by ticket family
  4 AI-backed vs Andy-only vs unplaced AI (unique positions, and cash tickets by who built them)
  5 Near misses (one leg away: placed and paper/AI builds)
  6 Projection error (Master Intel fair line vs final)
  7 Cash vs promo split
  8 Season to date by week
  9 Rules check (rules_wN.json from rules.py, if present)
Read-only on the ledger.
"""
import argparse, collections, html, json, os, sys
D = os.path.dirname(os.path.abspath(__file__)); RECAP = os.path.abspath(os.path.join(D, '..'))
ROOT = os.path.abspath(os.path.join(RECAP, '..', '..', '..'))
sys.path.insert(0, D); sys.path.insert(0, os.path.join(ROOT, 'reports', 'analysis', 'season', 'claude', 'scripts'))
import lib  # noqa: E402
import ai_record  # noqa: E402
e = html.escape


def money(x): return ('+' if x >= 0 else '−') + f'${abs(x):,.2f}'


def agg(ws, keyf, order=()):
    B = collections.OrderedDict((k, dict(tickets=0, won=0, staked=0.0, returned=0.0)) for k in order)
    for w in ws:
        b = B.setdefault(keyf(w), dict(tickets=0, won=0, staked=0.0, returned=0.0))
        b['tickets'] += 1; b['won'] += w.get('result') == 'win'; b['staked'] += lib.cash_stake(w); b['returned'] += lib.cash_return(w)
    for k in list(B):
        b = B[k]
        if not b['tickets']: del B[k]; continue
        b['staked'] = round(b['staked'], 2); b['returned'] = round(b['returned'], 2); b['net'] = round(b['returned'] - b['staked'], 2)
    return B


def projections(week):
    pj = ai_record.projections(week)
    if pj: return pj, 'AI record / ai_recs'
    for name in (f'fair-lines-w{week:02d}-synth.json', f'fair-lines-w{week:02d}.json'):
        p = os.path.join(ROOT, 'reports', 'intel', f'w{week:02d}-model', name)
        if os.path.exists(p):
            out = {}
            for g in json.load(open(p, encoding='utf-8')):
                T, Mh = g.get('fair_total'), g.get('fair_home_line')
                if T is None or Mh is None: continue
                m = -Mh; out[g['game'].replace(' ', '')] = (round((T - m) / 2, 1), round((T + m) / 2, 1))
            return out, os.path.relpath(p, ROOT)
    return {}, None


def build(week, legs_path, paper_path):
    W = lib.load_wagers(); wk = [w for w in W if w.get('week') == week]
    S = [w for w in wk if w.get('status') == 'SETTLED']; cash = [w for w in S if lib.is_cash(w)]; promo = [w for w in S if not lib.is_cash(w)]
    open_ = [w['id'] for w in wk if w.get('status') != 'SETTLED']
    L = json.load(open(legs_path)) if legs_path and os.path.exists(legs_path) else None
    PP = json.load(open(paper_path)) if paper_path and os.path.exists(paper_path) else []
    out = dict(week=week, open_tickets=open_)
    # 1 cash net
    out['cash'] = dict(agg(cash, lambda w: 'all').get('all') or dict(tickets=0, won=0, staked=0, returned=0, net=0))
    dk = [w for w in cash if (w.get('book') or '').lower().startswith('draftkings')]
    out['cash']['draftkings_predictions'] = dict(agg(dk, lambda w: 'dk').get('dk') or {}) if dk else None
    # 2 legs per ticket
    out['by_legs'] = agg(cash, lib.legs_bucket, lib.LEGB)
    # 3 family
    out['by_family'] = agg(cash, lib.family, lib.FAMILIES)
    # 4 AI vs Andy
    if L:
        graded = [l for l in L['legs'] if l['result'] in ('W', 'L')]
        U = {}
        for l in graded: U.setdefault(tuple(l['pkey']) + ((str(l['thr']),) if l['group'] == 'Sides & totals' else ()), l)
        UV = [l for l in U.values() if l['kind'] != 'cfb']
        def r(v): return [sum(x['result'] == 'W' for x in v), len(v)]
        org = {g: {'ai_backed': r([l for l in UV if l['group'] == g and l['origin'] == 'agree']),
                   'andy_only': r([l for l in UV if l['group'] == g and l['origin'] == 'andy']),
                   'unplaced_ai': r([l for l in L['ai_only'] if l['group'] == g and l['result'] in ('W', 'L')])} for g in ('Player props', 'Sides & totals')}
        tick = {t['id']: t for t in L['tickets']}
        def builder(w):
            ls = (tick.get(w['id']) or {}).get('legs') or []
            if not ls: return 'unknown'
            f = sum(l['origin'] == 'agree' for l in ls) / len(ls)
            return 'AI-built (all legs in AI record)' if f == 1 else ('Andy-built (no AI legs)' if f == 0 else 'Mixed')
        out['ai_vs_andy'] = dict(unique_positions=org, ai_record_size=L.get('ai_record_size'),
                                 tickets_by_builder=agg(cash, builder, ['AI-built (all legs in AI record)', 'Mixed', 'Andy-built (no AI legs)', 'unknown']))
    else:
        out['ai_vs_andy'] = None
    # 5 near misses
    nm = []
    if L:
        for t in L['tickets']:
            ls = [l for l in t['legs'] if l['result'] in ('W', 'L')]
            miss = [l for l in ls if l['result'] == 'L']
            if len(ls) >= 2 and len(miss) == 1 and 'round_robin' not in t['id']:
                cash = t.get('cash', t.get('funding') not in ('promo_credit', 'free_bet'))
                m = miss[0]; nm.append(dict(name=t['title'] or t['id'], kind='cash' if cash else 'promo', stake=t['stake'], odds=t['odds'],
                                            legs=len(ls), missed=m['label'], actual=m.get('actual'), margin=m.get('margin')))
    for p in PP:
        ls = [l for l in p['legs'] if l['result'] in ('W', 'L')]; miss = [l for l in ls if l['result'] == 'L']
        if len(ls) >= 2 and len(miss) == 1:
            m = miss[0]; nm.append(dict(name=p['name'], kind='paper', stake=p.get('stake'), odds=p.get('odds'), legs=len(ls), missed=m['label'],
                                        actual=m.get('actual'), margin=m.get('margin')))
    out['near_misses'] = nm
    # 6 projection error
    PJ, src = projections(week); GS = os.path.join(RECAP, f'w{week}gamesum.json'); rows = []
    if PJ and os.path.exists(GS):
        GM = {f"{g['away']}@{g['home']}": g for g in json.load(open(GS))}
        for k, (pa, ph) in PJ.items():
            g = GM.get(k)
            if not g: continue
            a, h = g['score']; rows.append(dict(game=k, proj_total=round(pa + ph, 1), total=a + h, proj_margin=round(ph - pa, 1), margin=h - a, winner_right=(pa > ph) == (a > h)))
    out['projection'] = dict(source=src, games=len(rows),
                             margin_mae=round(sum(abs(r['margin'] - r['proj_margin']) for r in rows) / len(rows), 1) if rows else None,
                             total_mae=round(sum(abs(r['total'] - r['proj_total']) for r in rows) / len(rows), 1) if rows else None,
                             total_bias=round(sum(r['total'] - r['proj_total'] for r in rows) / len(rows), 1) if rows else None,
                             winners_right=sum(r['winner_right'] for r in rows), rows=rows)
    # 7 cash vs promo
    out['split'] = dict(cash=out['cash'], promo=dict(tickets=len(promo), won=sum(w.get('result') == 'win' for w in promo),
                                                     credit_staked=round(sum(float(w.get('stake_usd') or 0) for w in promo), 2),
                                                     value_returned=round(sum(lib.credit_return(w) for w in promo), 2)))
    # 8 season to date
    season = []
    for n in range(1, week + 1):
        cw = [w for w in W if w.get('week') == n and w.get('status') == 'SETTLED' and lib.is_cash(w)]
        if not cw: continue
        b = agg(cw, lambda w: 'x')['x']; lp = os.path.join(RECAP, f'w{n}legs.json')
        if os.path.exists(lp):
            ll = [l for l in json.load(open(lp))['legs'] if l['result'] in ('W', 'L')]; b['legs_hit'] = [sum(l['result'] == 'W' for l in ll), len(ll)]
        season.append(dict(week=n, **b))
    out['season'] = season
    # 9 rules
    rp = os.path.join(RECAP, 'work', f'w{week}', f'rules_w{week}.json')
    out['rules'] = json.load(open(rp)) if os.path.exists(rp) else None
    return out


def tab(head, rows, cls='season'):
    return f'<table class="{cls}"><thead><tr>' + ''.join(f'<th>{e(h)}</th>' for h in head) + '</tr></thead><tbody>' + \
        ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table>'


def netc(v): return f'<span class="{"pos" if v >= 0 else "neg"}">{money(v)}</span>'


def fam_rows(B): return [(e(k), b['tickets'], b['won'], f"${b['staked']:.2f}", f"${b['returned']:.2f}", netc(b['net'])) for k, b in B.items()]


def pct(w, n): return f'{w}/{n} · {round(100 * w / n)}%' if n else '—'


def to_html(o):
    c = o['cash']; H = ['<section id="scorecard"><span class="eyebrow">Fixed scorecard</span><h2>The same nine numbers every week</h2>',
                        f'<p class="sub">Cash tickets as tagged (promo, bonus and free-bet tickets excluded). {len(o["open_tickets"])} ticket(s) still open.</p>']
    H.append('<div class="panel"><h4>1 · Cash net</h4>' + tab(['Tickets', 'Won', 'Staked', 'Returned', 'Net'],
             [(c['tickets'], c['won'], f"${c['staked']:.2f}", f"${c['returned']:.2f}", netc(c['net']))]) +
             (f'<p class="sub">DraftKings Predictions inside that: {c["draftkings_predictions"]["tickets"]} tickets, net {money(c["draftkings_predictions"]["net"])}.</p>' if c.get('draftkings_predictions') else '') + '</div>')
    H.append('<div class="two"><div class="panel"><h4>2 · Legs per ticket vs tickets won</h4>' + tab(['Legs', 'Tickets', 'Won', 'Staked', 'Returned', 'Net'], fam_rows(o['by_legs'])) + '</div>')
    H.append('<div class="panel"><h4>3 · P&amp;L by ticket family</h4>' + tab(['Family', 'Tickets', 'Won', 'Staked', 'Returned', 'Net'], fam_rows(o['by_family'])) + '</div></div>')
    av = o.get('ai_vs_andy')
    if av:
        rows = [(g, pct(*v['ai_backed']), pct(*v['andy_only']), pct(*v['unplaced_ai'])) for g, v in av['unique_positions'].items()]
        H.append('<div class="two"><div class="panel"><h4>4 · AI-backed vs Andy-only vs unplaced AI (unique positions)</h4>' + tab(['', 'AI-backed · placed', 'Andy-only · placed', 'AI · not placed'], rows) +
                 (f'<p class="sub">AI record for the week: {av["ai_record_size"]} distinct legs.</p>' if av.get('ai_record_size') is not None else '') + '</div>')
        H.append('<div class="panel"><h4>Cash tickets by who built them</h4>' + tab(['Builder', 'Tickets', 'Won', 'Staked', 'Returned', 'Net'], fam_rows(av['tickets_by_builder'])) + '</div></div>')
    nm = o['near_misses']
    H.append('<div class="panel"><h4>5 · Near misses (one leg away)</h4>' + (tab(['Ticket', 'Type', 'Legs', 'Missed leg', 'Actual'],
             [(e(str(x['name'])[:70]), x['kind'], x['legs'], e(x['missed'][:50]), e('' if x['actual'] is None else str(x['actual']))) for x in nm]) if nm else '<p class="sub">None.</p>') + '</div>')
    p = o['projection']
    H.append('<div class="panel"><h4>6 · Projection error</h4>' + (f'<p class="sub">{p["games"]} games ({e(p["source"] or "")}): home-margin error {p["margin_mae"]} pts, total error {p["total_mae"]} pts '
             f'(finals ran {p["total_bias"]:+} vs the fair total on average), winner right {p["winners_right"]} of {p["games"]}.</p>' if p['games'] else '<p class="sub">No fair-line projection for this week.</p>') + '</div>')
    s = o['split']
    H.append('<div class="panel"><h4>7 · Cash vs promo</h4>' + tab(['', 'Tickets', 'Won', 'Staked / credit', 'Returned / value'],
             [('Cash', s['cash']['tickets'], s['cash']['won'], f"${s['cash']['staked']:.2f}", f"${s['cash']['returned']:.2f}"),
              ('Promo / bonus / free bet', s['promo']['tickets'], s['promo']['won'], f"${s['promo']['credit_staked']:.2f}", f"${s['promo']['value_returned']:.2f}")]) + '</div>')
    rows = [(f"Week {x['week']}", f"${x['staked']:.2f}", f"${x['returned']:.2f}", netc(x['net']), pct(*x['legs_hit']) if x.get('legs_hit') else '—') for x in o['season']]
    ts = sum(x['staked'] for x in o['season']); tr = sum(x['returned'] for x in o['season'])
    rows.append(('<b>Season</b>', f'<b>${ts:.2f}</b>', f'<b>${tr:.2f}</b>', netc(tr - ts), ''))
    H.append('<div class="panel"><h4>8 · Season to date (cash)</h4>' + tab(['Week', 'Staked', 'Returned', 'Net', 'Placed legs hit'], rows) + '</div>')
    R = o.get('rules')
    if R:
        rr = [(e(f"{r['id']}: {r['text']}"), {True: 'yes', False: '<b class="neg">no</b>', None: 'by hand'}[r['followed']], e(r['verdict'])) for r in R['checked']]
        if not rr: rr = [('No rules were active this week', '—', 'The rules loop starts with Week 9 (C1-C5, accepted 11/04).')]
        nx = ''.join(f'<li><b>{e(r["id"])}</b> {e(r["text"])}</li>' for r in R['proposed_for_next_week']) or '<li>None proposed yet (max 3).</li>'
        H.append('<div class="panel"><h4>9 · Rules check</h4>' + tab(['Rule', 'Followed', 'Verdict'], rr) + f'<h4>Rules for next week</h4><ul class="method">{nx}</ul></div>')
    H.append('</section>')
    return ''.join(H)


def to_md(o):
    c = o['cash']; m = [f"# Week {o['week']} scorecard", '', f"Open tickets: {len(o['open_tickets'])}", '', '## 1 Cash net',
                        f"{c['tickets']} cash tickets, {c['won']} won, staked ${c['staked']:.2f}, returned ${c['returned']:.2f}, net **{money(c['net'])}**."]
    def t(B): return ['| | Tickets | Won | Staked | Returned | Net |', '|---|---:|---:|---:|---:|---:|'] + [f"| {k} | {b['tickets']} | {b['won']} | ${b['staked']:.2f} | ${b['returned']:.2f} | {money(b['net'])} |" for k, b in B.items()]
    m += ['', '## 2 Legs per ticket vs tickets won'] + t(o['by_legs']) + ['', '## 3 P&L by family'] + t(o['by_family'])
    av = o.get('ai_vs_andy')
    if av:
        m += ['', '## 4 AI-backed vs Andy-only vs unplaced AI (unique positions)', '| | AI-backed | Andy-only | Unplaced AI |', '|---|---|---|---|']
        m += [f"| {g} | {pct(*v['ai_backed'])} | {pct(*v['andy_only'])} | {pct(*v['unplaced_ai'])} |" for g, v in av['unique_positions'].items()]
        m += ['', 'Cash tickets by builder:'] + t(av['tickets_by_builder'])
    m += ['', '## 5 Near misses (one leg away)'] + ([f"- {x['name']} ({x['kind']}, {x['legs']} legs): missed {x['missed']} (actual {x['actual']})" for x in o['near_misses']] or ['- none'])
    p = o['projection']
    m += ['', '## 6 Projection error', (f"{p['games']} games: home-margin MAE {p['margin_mae']}, total MAE {p['total_mae']} (bias {p['total_bias']:+}), winners {p['winners_right']}/{p['games']}." if p['games'] else 'No fair-line projection this week.')]
    s = o['split']['promo']
    m += ['', '## 7 Cash vs promo', f"Cash net {money(c['net'])}; promo {s['tickets']} tickets, ${s['credit_staked']:.2f} credit -> ${s['value_returned']:.2f}."]
    m += ['', '## 8 Season to date (cash)', '| Week | Staked | Returned | Net | Legs hit |', '|---|---:|---:|---:|---|']
    m += [f"| {x['week']} | ${x['staked']:.2f} | ${x['returned']:.2f} | {money(x['net'])} | {pct(*x['legs_hit']) if x.get('legs_hit') else '—'} |" for x in o['season']]
    if o.get('rules'):
        m += ['', '## 9 Rules check'] + [f"- {r['id']} ({'followed' if r['followed'] else 'by hand' if r['followed'] is None else 'BROKEN'}): {r['verdict']}" for r in o['rules']['checked']]
    return '\n'.join(m) + '\n'


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--legs'); ap.add_argument('--paper'); ap.add_argument('--outdir')
    a = ap.parse_args(); wk = a.week
    od = a.outdir or os.path.join(RECAP, 'work', f'w{wk}'); os.makedirs(od, exist_ok=True)
    o = build(wk, a.legs or os.path.join(RECAP, f'w{wk}legs.json'), a.paper or os.path.join(RECAP, f'w{wk}paper.json'))
    json.dump(o, open(os.path.join(od, f'scorecard_w{wk}.json'), 'w'), indent=1, default=str)
    open(os.path.join(od, f'scorecard_w{wk}.md'), 'w', encoding='utf-8').write(to_md(o))
    open(os.path.join(od, f'scorecard_w{wk}.html'), 'w', encoding='utf-8').write(to_html(o))
    print(to_md(o))


if __name__ == '__main__':
    main()
