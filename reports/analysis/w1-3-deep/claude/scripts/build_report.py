"""Build the Andy-facing Weeks 1-3 basket review (HTML) from the T2 JSON outputs.
Usage: python build_report.py <dir with t2a..t2d json> <out.html> [mnf.json]"""
import json, sys, html, math
D = sys.argv[1]; OUTF = sys.argv[2]
e = html.escape
A = json.load(open(f'{D}/t2a_summary.json')); B = json.load(open(f'{D}/t2b_experts.json'))
C = json.load(open(f'{D}/t2c_sources.json')); K = json.load(open(f'{D}/t2d_basket.json'))
MNF = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else None

def pct(x, d=0): return '—' if x is None else f'{x*100:.{d}f}%'
def money(x): return f"{'−' if x < 0 else '+'}${abs(x):,.0f}"
def sgn(x, d=0): return f"{'−' if x < 0 else '+'}{abs(x)*100:.{d}f}%"

# ---------------- chart 1: basket EV ranges
BK = [('A', 'What we bet, W1–3'), ('B', 'Team 1 playbook'), ('C', 'Team 2 core'), ('D', 'Team 2 lean'), ('E', 'All singles benchmark')]
def bk(letter):
    for k, v in K['baskets'].items():
        if k.startswith(letter + '.'): return k, v
def c_basket():
    W, L, R = 760, 190, 40; rh = 50; H = rh * len(BK) + 56
    lo, hi = -180, 40; X = lambda v: L + (v - lo) / (hi - lo) * (W - L - R)
    o = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Expected weekly profit by basket under three edge scenarios">']
    for v in range(-180, 41, 20):
        o.append(f'<line class="grid" x1="{X(v):.1f}" x2="{X(v):.1f}" y1="8" y2="{H-34}"/>')
        if v % 40 == 0: o.append(f'<text class="tick" x="{X(v):.1f}" y="{H-16}" text-anchor="middle">{money(v) if v else "$0"}</text>')
    o.append(f'<line class="zero" x1="{X(0):.1f}" x2="{X(0):.1f}" y1="8" y2="{H-34}"/>')
    for i, (L1, name) in enumerate(BK):
        k, v = bk(L1); y = 28 + i * rh
        ob = v['observed (shrunk) | rho=0.15']; ne = v['no edge (0.95/leg) | rho=0.15']; co = v['conservative (negatives kept, positives -> 0.95) | rho=0.15']
        a, b = min(co['ev'], ob['ev'], ne['ev']), max(co['ev'], ob['ev'], ne['ev'])
        o.append(f'<text class="grp" x="{L-12}" y="{y+5}" text-anchor="end">{e(name)}</text><text class="tick" x="{L-12}" y="{y+21}" text-anchor="end">${ob["stake"]:.0f} a week</text>')
        o.append(f'<rect class="band" x="{X(a):.1f}" y="{y-5}" width="{max(X(b)-X(a),2):.1f}" height="10" rx="5"/>')
        for val, cls, lab in ((co['ev'], 'm-cons', 'Conservative'), (ne['ev'], 'm-none', 'No edge'), (ob['ev'], 'm-obs', 'Observed edges')):
            o.append(f'<circle class="{cls}" cx="{X(val):.1f}" cy="{y}" r="7" data-tip="{e(name)} · {lab}: {money(val)} a week ({sgn(val/ob["stake"])} of stake)"/>')
        o.append(f'<text class="val" x="{X(ob["ev"]):.1f}" y="{y-12}" text-anchor="middle">{money(ob["ev"])}</text>')
    return ''.join(o) + '</svg>'
basket_rows = ''
for L1, name in BK:
    k, v = bk(L1); ob = v['observed (shrunk) | rho=0.15']; ne = v['no edge (0.95/leg) | rho=0.15']; co = v['conservative (negatives kept, positives -> 0.95) | rho=0.15']
    basket_rows += (f'<tr><td><b>{e(name)}</b></td><td class="num">${ob["stake"]:.0f}</td><td class="num">{money(ob["ev"])}<br><span class="dim">{sgn(ob["ev_pct"])}</span></td>'
                    f'<td class="num">{money(ne["ev"])}</td><td class="num">{money(co["ev"])}</td><td class="num">${ob["sd"]:.0f}</td><td class="num">{pct(ob["p_week_profit"])}</td>'
                    f'<td class="num">{money(ob["season_med"])}<br><span class="dim">{money(ob["season_q05"])} to {money(ob["season_q95"])}</span></td><td class="num">{money(ne["season_med"])}</td></tr>')
k, vc = bk('C'); partsC = vc['observed (shrunk) | rho=0.15']['parts']
k, va = bk('A'); partsA = va['observed (shrunk) | rho=0.15']['parts']
def parts_rows(P):
    return ''.join(f'<tr><td>{e(n)}</td><td class="num">${p["stake"]:.0f}</td><td class="num {"neg" if p["ev"] < 0 else "pos"}">{money(p["ev"])}</td><td class="num">{pct(p["p_cash"])}</td></tr>' for n, p in P.items())

# ---------------- chart 2: market return per $1 with 95% interval
E = K['edges']
def c_edges():
    rows = sorted([(c, v) for c, v in E.items() if v['n'] >= 8], key=lambda kv: -kv[1]['raw'])
    W, L, R = 760, 150, 150; rh = 26; H = rh * len(rows) + 44
    lo, hi = 0.0, 2.2; X = lambda v: L + (min(max(v, lo), hi) - lo) / (hi - lo) * (W - L - R)
    o = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Return per dollar by market with 95 percent interval">']
    for v in (0, .5, 1, 1.5, 2):
        o.append(f'<line class="grid" x1="{X(v):.1f}" x2="{X(v):.1f}" y1="6" y2="{H-30}"/><text class="tick" x="{X(v):.1f}" y="{H-12}" text-anchor="middle">${v:.2f}</text>')
    o.append(f'<line class="zero" x1="{X(1):.1f}" x2="{X(1):.1f}" y1="6" y2="{H-30}"/>')
    for i, (c, v) in enumerate(rows):
        y = 16 + i * rh; a, b = v['raw'] - 1.96 * v['se'], v['raw'] + 1.96 * v['se']
        cls = 'm-good' if a > 1 else ('m-bad' if b < 1 else ('m-lean-good' if v['raw'] >= 1 else 'm-lean-bad'))
        o.append(f'<text class="lab" x="{L-10}" y="{y+4}" text-anchor="end">{e(c)}</text>'
                 f'<line class="ci" x1="{X(a):.1f}" x2="{X(b):.1f}" y1="{y}" y2="{y}"/>'
                 f'<circle class="{cls}" cx="{X(v["raw"]):.1f}" cy="{y}" r="6" data-tip="{e(c)}: ${v["raw"]:.2f} back per $1 over {v["n"]} priced legs (95% range ${max(a,0):.2f}–${b:.2f})"/>'
                 f'<text class="val" x="{W-R+12}" y="{y+4}">${v["raw"]:.2f} · n={v["n"]}</text>')
    return ''.join(o) + '</svg>'

# ---------------- chart 3: burn causes by week
G6 = ['Side or total lost', "Player didn't get the volume", 'TD went to someone else', "Sack / INT / tackle didn't happen", 'QB game script', 'Volume there, production not']
def c_causes():
    W, L = 760, 250; cw = (W - L - 20) / 4; rh = 30; H = rh * len(G6) + 40
    mx = max(max(A['by_week'][w].get(c, 0) for w in ('1', '2', '3')) for c in G6); ms = max(A['season'].get(c, 0) for c in G6)
    o = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Burnt legs by cause and week">']
    for j, h in enumerate(('Week 1', 'Week 2', 'Week 3', 'Season')):
        o.append(f'<text class="grp" x="{L + j*cw + 4:.1f}" y="14">{h}</text>')
    for i, c in enumerate(G6):
        y = 26 + i * rh
        o.append(f'<text class="lab" x="{L-10}" y="{y+13}" text-anchor="end">{e(c)}</text>')
        for j, w in enumerate(('1', '2', '3', 'S')):
            v = A['season'].get(c, 0) if w == 'S' else A['by_week'][w].get(c, 0); m = ms if w == 'S' else mx
            bw = v / m * (cw - 50); x = L + j * cw + 4
            o.append(f'<rect class="{"b-season" if w == "S" else "b-week"}" x="{x:.1f}" y="{y}" width="{max(bw,1):.1f}" height="18" rx="3" data-tip="{e(c)}, {"season" if w=="S" else "Week "+w}: {v} burnt legs"/><text class="val" x="{x+bw+6:.1f}" y="{y+13}">{v}</text>')
    return ''.join(o) + '</svg>'

# ---------------- chart 4: paired bars hit vs break-even for script tests
def c_pairs(items, title):
    W, L, R = 760, 290, 120; rh = 34; H = rh * len(items) + 40; X = lambda v: L + v * (W - L - R)
    o = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="{e(title)}">']
    for v in (0, .25, .5, .75, 1):
        o.append(f'<line class="grid" x1="{X(v):.1f}" x2="{X(v):.1f}" y1="6" y2="{H-30}"/><text class="tick" x="{X(v):.1f}" y="{H-12}" text-anchor="middle">{int(v*100)}%</text>')
    for i, (lab, r) in enumerate(items):
        y = 10 + i * rh
        o.append(f'<text class="lab" x="{L-10}" y="{y+13}" text-anchor="end">{e(lab)}</text><rect class="track" x="{L}" y="{y}" width="{X(1)-L:.1f}" height="18" rx="3"/>'
                 f'<rect class="{"b-good" if r["hit"] >= (r["be"] or .5) else "b-bad"}" x="{L}" y="{y}" width="{X(r["hit"])-L:.1f}" height="18" rx="3" data-tip="{e(lab)}: {r["w"]} of {r["n"]} hit ({pct(r["hit"])}); break-even {pct(r["be"])}"/>'
                 f'<line class="be" x1="{X(r["be"] or .5):.1f}" x2="{X(r["be"] or .5):.1f}" y1="{y-4}" y2="{y+22}"/>'
                 f'<text class="val" x="{X(1)+10:.1f}" y="{y+13}">{r["w"]}/{r["n"]} · {pct(r["hit"])}</text>')
    return ''.join(o) + '</svg>'
vol = A['volume']; scr = A['script']; tdc = A['tdconc']
c_vol = c_pairs([('Receiving props, team threw 35+', vol['receiving legs, team threw >=35']), ('Receiving props, team threw < 35', vol['receiving legs, team threw <35']),
                 ('Rushing props, team ran 28+', vol['rushing legs, team ran >=28']), ('Rushing props, team ran < 28', vol['rushing legs, team ran <28']),
                 ('Anytime TD, team scored 3+ TDs', tdc['hit_when_team_3plus']), ('Anytime TD, team scored 0–2 TDs', tdc['hit_when_team_0_2']),
                 ('Props on the team that won', scr['team won']), ('Props on the team that lost', scr['team lost'])], 'Prop hit rate by game script')

# ---------------- chart 5: source ROI bars
def c_src():
    who = C['who']
    items = [('AI side / total picks (placed)', who['AI-proposed, placed']['sides']), ('Andy side / total picks', who['Andy (own / not in AI log)']['sides']),
             ('AI props (placed)', who['AI-proposed, placed']['props']), ('AI props (not placed)', who['AI-proposed, not placed']['props']),
             ('Andy props', who['Andy (own / not in AI log)']['props']),
             ('AI TD-scorer picks', C['ai_split']['TD scorer']), ('AI QB-market picks', C['ai_split']['QB']),
             ('Andy volume / yardage props', C['andy_split']['volume/yardage'])]
    W, L, R = 760, 260, 150; rh = 32; H = rh * len(items) + 40; lo, hi = -.6, .6; X = lambda v: L + (min(max(v, lo), hi) - lo) / (hi - lo) * (W - L - R)
    o = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Flat-stake return by source">']
    for v in (-.6, -.3, 0, .3, .6):
        o.append(f'<line class="grid" x1="{X(v):.1f}" x2="{X(v):.1f}" y1="6" y2="{H-30}"/><text class="tick" x="{X(v):.1f}" y="{H-12}" text-anchor="middle">{sgn(v) if v else "0%"}</text>')
    o.append(f'<line class="zero" x1="{X(0):.1f}" x2="{X(0):.1f}" y1="6" y2="{H-30}"/>')
    for i, (lab, r) in enumerate(items):
        y = 10 + i * rh; v = r['roi'] or 0; x0, x1 = sorted((X(0), X(v)))
        o.append(f'<text class="lab" x="{L-10}" y="{y+13}" text-anchor="end">{e(lab)}</text><rect class="{"b-good" if v >= 0 else "b-bad"}" x="{x0:.1f}" y="{y}" width="{max(x1-x0,1):.1f}" height="18" rx="3" data-tip="{e(lab)}: {r["wp"]} of {r["priced"]} priced legs won, {sgn(v)} flat-stake return, {abs(r["z"]):.1f} SE from break-even"/>'
                 f'<text class="val" x="{W-R+12}" y="{y+13}">{sgn(v)} · {r["wp"]}/{r["priced"]}</text>')
    return ''.join(o) + '</svg>'

# ---------------- chart 6: expert Wilson intervals
X_ORDER = ['thejoeholkashow', 'salbets_', 'CodyBrownBets', 'HarryLockPicks', 'DanGambleAI', 'SharpieMatters', 'FirstTDBets', 'NoExpertFS', 'JoeOrrico']
VERD = {'thejoeholkashow': ('Screen', 'Idea source for receptions (11 of 16) and anytime TDs (8 of 14). Priced legs 13 of 28, +6% flat return.'),
        'salbets_': ('Screen', 'Above 50% in all three weeks and the only handicapper posting Unders, but standard lines 11 of 21 and only 9 priced legs.'),
        'CodyBrownBets': ('Screen', 'Receiving yards 11 of 16. Receptions 4 of 11. Priced legs +2%. Week 3 fell to 5 of 12.'),
        'HarryLockPicks': ('Screen', '46–37 overall, but 46 of 48 graded lines were easier alt lines. At BetOnline prices his picks returned −8%.'),
        'DanGambleAI': ('Fade', '67–53 looks good, but at the prices on the board his picks returned −26% (22 of 55 priced legs won).'),
        'SharpieMatters': ('Fade', 'Anytime-TD lists only: 12 of 44 priced legs won, a −33% return.'),
        'FirstTDBets': ('Fade', 'First-TD picks 1 of 16. That is the market rate for longshots, with no edge.'),
        'NoExpertFS': ('Ignore', '10 of 23; priced legs returned −47%.'),
        'JoeOrrico': ('Ignore', '7 of 15 across four games; standard lines 0 of 5.')}
def c_experts():
    X_ = B['experts']; rows = [(h, X_[h]) for h in X_ORDER if h in X_]
    W, L, R = 760, 190, 130; rh = 30; H = rh * len(rows) + 40; Xf = lambda v: L + v * (W - L - R)
    o = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Expert prop hit rates with 95 percent intervals">']
    for v in (0, .25, .5, .75, 1):
        o.append(f'<line class="grid" x1="{Xf(v):.1f}" x2="{Xf(v):.1f}" y1="6" y2="{H-30}"/><text class="tick" x="{Xf(v):.1f}" y="{H-12}" text-anchor="middle">{int(v*100)}%</text>')
    o.append(f'<line class="zero" x1="{Xf(.5):.1f}" x2="{Xf(.5):.1f}" y1="6" y2="{H-30}"/>')
    for i, (h, x) in enumerate(rows):
        a = x['all']; y = 16 + i * rh; v = VERD[h][0]
        cls = {'Screen': 'm-screen', 'Fade': 'm-bad', 'Ignore': 'm-none'}[v]
        o.append(f'<text class="lab" x="{L-10}" y="{y+4}" text-anchor="end">{e(x["name"])}</text><line class="ci" x1="{Xf(a["lo"]):.1f}" x2="{Xf(a["hi"]):.1f}" y1="{y}" y2="{y}"/>'
                 f'<circle class="{cls}" cx="{Xf(a["hit"]):.1f}" cy="{y}" r="6" data-tip="{e(x["name"])}: {a["w"]}–{a["n"]-a["w"]} ({pct(a["hit"])}), 95% range {pct(a["lo"])}–{pct(a["hi"])}"/>'
                 f'<text class="val" x="{W-R+12}" y="{y+4}">{a["w"]}–{a["n"]-a["w"]} · {v}</text>')
    return ''.join(o) + '</svg>'
xrows = ''
for h in X_ORDER:
    x = B['experts'].get(h)
    if not x: continue
    a = x['all']; st = x['by_line'].get('standard', {'w': 0, 'n': 0}); v, why = VERD[h]
    wk = ' · '.join(f"W{w} {r['w']}–{r['n']-r['w']}" for w, r in x['by_wk'].items())
    xrows += (f'<tr><td><b>{e(x["name"])}</b></td><td><span class="pill p-{v.lower()}">{v}</span></td><td class="num">{a["w"]}–{a["n"]-a["w"]}<br><span class="dim">{pct(a["lo"])}–{pct(a["hi"])}</span></td>'
              f'<td class="num">{a["wp"]}/{a["priced"]}<br><span class="dim">{"—" if a["roi"] is None else sgn(a["roi"])}</span></td><td class="num">{st["w"]}/{st["n"]}</td><td class="num">{wk}</td>'
              f'<td>{e(why)}<br><span class="dim">Evidence: {e(x["evidence"])}</span></td></tr>')
mk = B['market_all']
mk_rows = ''.join(f'<tr><td>{e(m)}</td><td class="num">{v["w"]}/{v["n"]}</td><td class="num">{v["wp"]}/{v["priced"]}</td><td class="num">{pct(v["be"])}</td><td class="num {"neg" if (v["roi"] or 0) < 0 else "pos"}">{"—" if v["roi"] is None else sgn(v["roi"])}</td></tr>'
                  for m, v in mk.items() if v['n'] >= 10 and m != 'Other')
sd = B['sides']
# ledger
led_rows = ''.join(f'<tr><td class="num">{e(x["d"])}</td><td>{e(x["what"])}</td><td><span class="pill p-{ {"Andy":"andy","Claude":"claude","Claude (legs)":"claude","Claude (leg)":"claude"}.get(x["winner"],"none")}">{e(x["winner"])}</span></td><td class="dim">{e(x["note"])}</td></tr>' for x in C['ledger'])
filt = C['filter_placed']
def frow(lab, r): return f'<tr><td>{e(lab)}</td><td class="num">{r["w"]}/{r["n"]}</td><td class="num">{r["wp"]}/{r["priced"]}</td><td class="num {"neg" if (r["roi"] or 0) < 0 else "pos"}">{"—" if r["roi"] is None else sgn(r["roi"])}</td><td class="num">{abs(r["z"]):.1f}</td></tr>'
filt_rows = frow('A keep-list expert had the same pick', filt['keep-list expert']) + frow('Only a fade-list expert had it', filt['fade-list expert only']) + frow('Other or mixed experts', filt['other / mixed expert']) + frow('No expert had it', filt['no expert'])
cl = A['clustering']; pc = A['percause']
edge_rows = ''.join(f'<tr><td>{e(c)}</td><td class="num">{v["n"]}</td><td class="num">${v["raw"]:.2f}</td><td class="num">${max(v["raw"]-1.96*v["se"],0):.2f}–${v["raw"]+1.96*v["se"]:.2f}</td><td class="num">${v["shrunk"]:.2f}</td><td class="num">{v["z"]:+.1f}</td></tr>'
                    for c, v in sorted(E.items(), key=lambda kv: -kv[1]['raw']))
mnf_block = ''
if MNF:
    mnf_block = f'<section id="mnf"><div class="eyebrow">Monday night</div><h2>MNF PHI @ CHI</h2><p class="sub">{e(MNF["summary"])}</p></section>'

page = f'''<title>W1–3 Basket Review</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: one reading column, a decision table up top, evidence sections below; shares the Platinum Rose recap system (Team 1 pages) */
:root{{--bg:#f3f4f1;--paper:#fbfbf9;--ink:#15212e;--ink2:#4a5561;--ink3:#6f7880;--rule:#d9ddd6;--track:#e7e9e3;--accent:#1f5f46;
--hit:#0f8a3a;--miss:#c43838;--o1:#2a78d6;--o2:#eb6834;--o3:#1baf7a;--o4:#8a6fd6;--proj:#9aa3ab;--band:#dfe3dc;
--disp:"Barlow Condensed","Arial Narrow",sans-serif;--body:"Public Sans",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{color-scheme:dark;--bg:#12171c;--paper:#182027;--ink:#eef1f3;--ink2:#b3bcc4;--ink3:#8d97a1;--rule:#2b353e;--track:#243039;--accent:#5fbf95;--hit:#3fbf6a;--miss:#e0605a;--o1:#3987e5;--o2:#d95926;--o3:#199e70;--o4:#8a6fd6;--proj:#6d7883;--band:#26313a}}}}
:root[data-theme="dark"]{{color-scheme:dark;--bg:#12171c;--paper:#182027;--ink:#eef1f3;--ink2:#b3bcc4;--ink3:#8d97a1;--rule:#2b353e;--track:#243039;--accent:#5fbf95;--hit:#3fbf6a;--miss:#e0605a;--o1:#3987e5;--o2:#d95926;--o3:#199e70;--o4:#8a6fd6;--proj:#6d7883;--band:#26313a}}
body{{background:var(--bg);color:var(--ink);font:15px/1.55 var(--body)}}
.wrap{{max-width:1080px;margin:0 auto;padding-inline:20px;padding-block:28px 64px}}
h1,h2,h3{{font-family:var(--disp);text-wrap:balance;margin:0;letter-spacing:.01em}}
h1{{font-size:clamp(40px,7vw,66px);line-height:.95;font-weight:700;text-transform:uppercase}}
h2{{font-size:30px;font-weight:600;text-transform:uppercase}}
h3{{font-size:21px;font-weight:600;text-transform:uppercase}}
.eyebrow{{font:600 12px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}}
.lede{{max-width:68ch;color:var(--ink2);font-size:16px;margin:0}}
header.top{{display:grid;gap:14px;padding-bottom:22px;border-bottom:2px solid var(--ink)}}
.kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule)}}
.kpi{{background:var(--paper);padding:14px 16px;display:grid;gap:4px;align-content:start}}
.kpi .n{{font:600 30px/1 var(--disp);font-variant-numeric:tabular-nums}} .kpi .n.neg{{color:var(--miss)}} .kpi .n.pos{{color:var(--hit)}}
.kpi .l{{font-size:12.5px;color:var(--ink2)}}
section{{margin-top:52px;display:grid;gap:14px}} section>*,header.top>*{{min-width:0}} code{{overflow-wrap:anywhere;font:12.5px var(--mono)}}
.sub{{color:var(--ink2);max-width:72ch;margin:0}}
.panel{{background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:16px 16px 10px;overflow-x:auto;min-width:0}}
.panel h4{{margin:0 0 8px;font:600 12px/1.3 var(--mono);color:var(--ink2);text-transform:uppercase;letter-spacing:.08em}}
.chart{{width:100%;max-width:900px;height:auto;display:block;min-width:560px}}
.chart text{{font:12px var(--body);fill:var(--ink2)}} .chart .val,.chart .tick{{font:11.5px var(--mono);fill:var(--ink2)}} .chart .grp{{font:600 13px var(--body);fill:var(--ink)}}
.chart .grid{{stroke:var(--rule);stroke-width:1}} .chart .zero{{stroke:var(--ink3);stroke-dasharray:3 3}} .chart .be{{stroke:var(--ink);stroke-width:2}}
.chart .ci{{stroke:var(--proj);stroke-width:3;stroke-linecap:round;opacity:.7}} .chart .band{{fill:var(--band)}} .track{{fill:var(--track)}}
.m-obs{{fill:var(--o1);stroke:var(--paper);stroke-width:2}} .m-none{{fill:var(--proj);stroke:var(--paper);stroke-width:2}} .m-cons{{fill:var(--o2);stroke:var(--paper);stroke-width:2}}
.m-good{{fill:var(--hit);stroke:var(--paper);stroke-width:2}} .m-bad{{fill:var(--miss);stroke:var(--paper);stroke-width:2}}
.m-lean-good{{fill:var(--paper);stroke:var(--hit);stroke-width:2.5}} .m-lean-bad{{fill:var(--paper);stroke:var(--miss);stroke-width:2.5}} .m-screen{{fill:var(--o1);stroke:var(--paper);stroke-width:2}}
.b-week{{fill:var(--o1)}} .b-season{{fill:var(--accent)}} .b-good{{fill:var(--hit)}} .b-bad{{fill:var(--miss)}}
.legend{{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12.5px;color:var(--ink2)}} .legend i{{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:6px;vertical-align:-1px}}
table.t{{border-collapse:collapse;width:100%;min-width:640px;font-size:13.5px}}
.t th{{text-align:left;font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--ink2);border-bottom:2px solid var(--ink);padding:6px 8px;vertical-align:bottom}}
.t td{{padding:7px 8px;border-bottom:1px solid var(--rule);vertical-align:top}} .t td.num{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;font-family:var(--mono);font-size:12.5px}}
.num.neg,.neg{{color:var(--miss)}} .num.pos,.pos{{color:var(--hit)}} .dim{{color:var(--ink3);font-size:12px}}
.pill{{font:600 10.5px var(--mono);padding:2px 7px;border-radius:4px;border:1px solid currentColor;white-space:nowrap;text-transform:uppercase;letter-spacing:.05em}}
.p-screen{{color:var(--o1)}} .p-fade{{color:var(--miss)}} .p-ignore,.p-none{{color:var(--ink3)}} .p-claude{{color:var(--o1)}} .p-andy{{color:var(--o2)}}
.p-keep{{color:var(--hit)}} .p-cut{{color:var(--miss)}} .p-hyp{{color:var(--o2)}} .p-strong{{color:var(--hit)}}
.grid2{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:14px}}
.card{{background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:14px 16px;display:grid;gap:8px;align-content:start;min-width:0}}
.card p{{margin:0;font-size:14px}} .card .ev{{font:12px var(--mono);color:var(--ink2)}}
ol.check{{margin:0;padding-left:22px;display:grid;gap:8px;max-width:78ch}} ol.check li{{padding-left:4px}}
.note{{border-left:3px solid var(--o2);padding:8px 12px;background:var(--paper);font-size:13.5px;color:var(--ink2);max-width:80ch}}
#tip{{position:fixed;pointer-events:none;background:var(--ink);color:var(--bg);font:12px/1.4 var(--body);padding:6px 9px;border-radius:4px;max-width:300px;z-index:10}}
[data-tip]{{cursor:default}} [data-tip]:hover{{opacity:.85}}
a{{color:var(--accent)}} :focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
</style>
<div class="wrap">
<header class="top">
  <div class="eyebrow">Platinum Rose · Claude Team 2 · Weeks 1–3 deep analysis · built Mon 9/28 · MNF added Tue 9/29</div>
  <h1>W1–3 Basket Review</h1>
  <p class="lede">Weeks 1–3 lost $1,047 on $1,298 staked, MNF included. The main causes were structural: too many legs per ticket, too many dollars on side parlays and master round robins, and receiving props bet without a pass-heavy script. The proposal below cuts the weekly outlay by about 60%. It moves money to the only markets that have paid so far: QB props, anytime TDs at plus money and dog moneylines in 2-team round robins. Most of the market edges are hypotheses. The structural savings hold even if every edge is noise.</p>
  <div class="kpis">
    <div class="kpi"><span class="n neg">−$1,047</span><span class="l">Net, W1–3 with MNF. $1,298 staked, $251 back</span></div>
    <div class="kpi"><span class="n neg">{money(bk("A")[1]["observed (shrunk) | rho=0.15"]["ev"])}</span><span class="l">Modeled EV per week of the W1–3 mix ({sgn(bk("A")[1]["observed (shrunk) | rho=0.15"]["ev_pct"])})</span></div>
    <div class="kpi"><span class="n">{money(bk("C")[1]["observed (shrunk) | rho=0.15"]["ev"])} / {money(bk("C")[1]["no edge (0.95/leg) | rho=0.15"]["ev"])}</span><span class="l">Team 2 core, ${bk("C")[1]["observed (shrunk) | rho=0.15"]["stake"]:.0f}/wk: EV with observed edges / with no edge</span></div>
    <div class="kpi"><span class="n pos">≈ +$67</span><span class="l">Weekly saving from structure alone (no-edge case, core vs W1–3 mix)</span></div>
  </div>
</header>

<section id="basket">
  <div class="eyebrow">T2-D · The decision</div>
  <h2>Which basket to run from Week 4</h2>
  <p class="sub">Monte Carlo, 40,000 simulated weeks per basket. Leg win rates come from each market's W1–3 return per $1, shrunk toward a no-edge prior of $0.95 (30 pseudo-legs). Same-game legs are correlated (ρ = 0.15), and same-game parlays are priced the way books price them, off the correlated joint probability. Each basket is shown under three edge assumptions. The grey band is the range between them.</p>
  <div class="panel"><h4>Expected profit per week ($)</h4>{c_basket()}
    <div class="legend"><span><i style="background:var(--o1)"></i>Observed edges (shrunk)</span><span><i style="background:var(--proj)"></i>No edge anywhere (−5% per leg)</span><span><i style="background:var(--o2)"></i>Conservative: losing markets kept, winning markets set to no edge</span></div></div>
  <div class="panel"><table class="t"><thead><tr><th>Basket</th><th>Stake/wk</th><th>EV/wk, observed</th><th>EV, no edge</th><th>EV, conservative</th><th>SD/wk</th><th>P(winning week)</th><th>Next 14 weeks, median (5th–95th)</th><th>14 wks, no edge</th></tr></thead><tbody>{basket_rows}</tbody></table></div>
  <div class="grid2">
    <div class="panel"><h4>W1–3 mix: EV by slot (observed edges)</h4><table class="t"><thead><tr><th>Slot</th><th>Stake</th><th>EV</th><th>P(cash)</th></tr></thead><tbody>{parts_rows(partsA)}</tbody></table></div>
    <div class="panel"><h4>Team 2 core: EV by slot (observed edges)</h4><table class="t"><thead><tr><th>Slot</th><th>Stake</th><th>EV</th><th>P(cash)</th></tr></thead><tbody>{parts_rows(partsC)}</tbody></table></div>
  </div>
  <p class="note">Read the table this way. In the no-edge column, the drop from about −$84 a week (W1–3 mix) to about −$18 (Team 2 core) comes from structure alone: fewer legs per ticket and fewer dollars in markets that have lost. That part is robust. The move from −$18 to +$4 depends on the QB, anytime-TD and dog-ML edges being real, and each of those is under 2 standard errors, so treat it as a hypothesis. The SuperContest entries are modeled as plain parlays. Their contest value depends on the prize pool, which isn't modeled.</p>
</section>

<section id="week4">
  <div class="eyebrow">T2-E · Build checklist</div>
  <h2>Week 4 build checklist</h2>
  <p class="sub">For the weekly synthesis session (<code>agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md</code>). The same list is in <code>reports/analysis/w1-3-deep/claude/week4-build-checklist.md</code>.</p>
  <ol class="check">
    <li><b>Budget.</b> Core basket ≈ $165 (lean ≈ $105), including the SuperContest $15 five and $10 2-team RR. Cash only. Promo credits are separate.</li>
    <li><b>Slot 1, dog-ML 2-team RR ($20–25).</b> 4–5 dogs at +110 to +250, all from different games. Andy's side reads lead here.</li>
    <li><b>Slot 2, QB-market singles or 2-leg tickets ($30–40).</b> Pass-TD overs and INT-yes. Each needs a stated matchup fit and a projected 30+ pass attempts.</li>
    <li><b>Slot 3, three hand-built 2-leg prop tickets ($30).</b> Anytime TD at +150 or longer paired with a QB leg. Take the TD leg only on a team with a team total of 24+ (ATD hit 53% when the team scored 3+ TDs, 26% otherwise). Prop round robins stay out.</li>
    <li><b>Slot 4, islands (TNF PIT@CLE, SNF, MNF).</b> One ticket per game, 3 legs or fewer, $10 each. No receptions or receiving-yard legs unless the team is projected to throw 35+ times.</li>
    <li><b>Slot 5, lotto.</b> One 5-leg ticket, $10 max, with ATD and QB legs only. First TD is fun money only ($5).</li>
    <li><b>Cut.</b> 4-team master RR (−46% EV). Straight parlays of 5+ side legs. Dog spreads (take the ML instead). Full-game Unders inside parlays. Sacks. AI side/total picks unless Andy or a second source agrees.</li>
    <li><b>Exposure.</b> Max $25 of cash risk tied to one game across all tickets. A side plus its matching total counts as one read. Don't pair a side read with props that need the opposite script, such as pass-rush props on a team projected to lead.</li>
    <li><b>Prices.</b> No parlay leg shorter than −200. Avoid −121 to −199 connectors. Props at +100 or longer are preferred. Record every leg's price on the ticket so Week 4 can be graded on return, not just hit rate.</li>
    <li><b>Experts.</b> Use Joe Holka, Sal Bets, Cody Brown and Harry Lock (standard lines only) as idea sources, then confirm the line and price yourself. Tag a leg "keep-list agree" when one of them has the same pick. Don't tail Dan's AI, SharpieMatters or FirstTDBets. No handicapper's sides get extra weight.</li>
    <li><b>Gate.</b> Run <code>npm run roster:vet -- --week 4 --date &lt;capture-date&gt; --fetch --strict</code> on the card before anything is proposed.</li>
    <li><b>After Week 4.</b> Re-run <code>reports/analysis/w1-3-deep/claude/scripts/</code> (t2a to t2d) with Week 4 added. Promote a hypothesis only when it reaches 2 SE.</li>
  </ol>
</section>

<section id="markets">
  <div class="eyebrow">Evidence · markets</div>
  <h2>Return per $1 by market</h2>
  <p class="sub">Unique priced positions (placed plus unplaced AI picks), W1–3. Ticket prices first, then the BetOnline board capture for unpriced W2–W3 props. A filled dot means the 95% range clears $1.00 (green) or stays below it (red). A hollow dot means the result is still inside noise. Only dog spreads come close to strong evidence of a leak.</p>
  <div class="panel">{c_edges()}</div>
  <div class="panel"><table class="t"><thead><tr><th>Market</th><th>Priced legs</th><th>Return per $1</th><th>95% range</th><th>Shrunk (used in model)</th><th>SE vs $0.95</th></tr></thead><tbody>{edge_rows}</tbody></table></div>
</section>

<section id="burn">
  <div class="eyebrow">T2-A · Burn taxonomy</div>
  <h2>Why legs burnt, Weeks 1–3</h2>
  <p class="sub">{A["n_burnt"]} of {A["n_positions"]} unique positions lost. Causes use the same six groups as Team 1's Week 3 report. The rules reproduce Team 1's hand classification on all {A["w3_label_agreement"][1]} matched Week 3 legs.</p>
  <div class="panel">{c_causes()}</div>
  <div class="grid2">
    <div class="card"><h3>Structural</h3>
      <p><b>Receiving props are a bet on pass volume.</b> They hit {vol["receiving legs, team threw >=35"]["w"]} of {vol["receiving legs, team threw >=35"]["n"]} when the team threw 35+ times, but {vol["receiving legs, team threw <35"]["w"]} of {vol["receiving legs, team threw <35"]["n"]} otherwise, against a 57% break-even. That gap is 3.3 SE. The split uses post-game attempts, so the pre-game rule (projected 35+) is a hypothesis.</p>
      <p><b>TD legs are a bet on the team total.</b> In {tdc["team_scored_2plus"]} of {tdc["lost"]} lost TD legs, the team scored 2+ TDs but not our player. Anytime TDs hit {pct(tdc["hit_when_team_3plus"]["hit"])} when the team scored 3+ TDs and {pct(tdc["hit_when_team_0_2"]["hit"])} otherwise.</p>
      <p><b>Burns cluster by game.</b> Leg results within a game-week vary more than chance allows: χ² {cl["chi"]:.0f} on {cl["df"]} df, permutation p = {cl["perm_p"]:.2f}. The per-pair correlation is small (φ ≈ {cl["same_game_phi"][0]:.2f}), so the damage comes from how many legs sit on one read. NYG@LAR (W2) burnt 25 legs, LAR@DEN (W3) 21 and MIA@SF (W2) 14.</p>
      <p><b>Volume beats efficiency.</b> {A["season"]["Player didn't get the volume"]} burns came from players who didn't get the touches. Only {A["season"]["Volume there, production not"]} had the volume and missed on production.</p></div>
    <div class="card"><h3>Mostly variance</h3>
      <p><b>Near misses.</b> {pc["Side or total lost"]["near"]} of {pc["Side or total lost"]["n"]} side and total burns lost by 3 points or fewer. {pc["Sack / INT / tackle didn't happen"]["near"]} of {pc["Sack / INT / tackle didn't happen"]["n"]} defensive-stat burns missed by one sack or tackle.</p>
      <p><b>Game script by result.</b> Props on the team that won hit {pct(scr["team won"]["hit"])}; on the team that lost, {pct(scr["team lost"]["hit"])}; trailing at the half, {pct(scr["trailed at half"]["hit"])}. That's 1.0–1.3 SE, a hypothesis.</p>
      <p><b>Sacks.</b> {A["cats"]["Sacks"]["w"]} of {A["cats"]["Sacks"]["n"]}. Too few to separate skill from luck, but no reason to keep paying for them.</p></div>
  </div>
  <div class="panel"><h4>Prop hit rate by game script (bar), with break-even (black tick)</h4>{c_vol}</div>
</section>

<section id="sources">
  <div class="eyebrow">T2-C · Sources and decisions</div>
  <h2>Who was right: AI, Andy, experts</h2>
  <p class="sub">Flat-stake return on unique priced positions, W1–3. "Andy" includes W1–W2 legs that weren't in the AI logs.</p>
  <div class="panel">{c_src()}</div>
  <div class="grid2">
    <div class="card"><h3>Division of labour</h3>
      <p><b>AI side and total picks are the one source leak with strong evidence:</b> {C["who"]["AI-proposed, placed"]["sides"]["wp"]} of {C["who"]["AI-proposed, placed"]["sides"]["priced"]} priced, {sgn(C["who"]["AI-proposed, placed"]["sides"]["roi"])}, {abs(C["who"]["AI-proposed, placed"]["sides"]["z"]):.1f} SE. Andy's own sides returned {sgn(C["who"]["Andy (own / not in AI log)"]["sides"]["roi"])}.</p>
      <p><b>AI props were break-even or better.</b> Placed AI props returned {sgn(C["who"]["AI-proposed, placed"]["props"]["roi"])}, unplaced ones {sgn(C["who"]["AI-proposed, not placed"]["props"]["roi"])}. AI TD-scorer picks returned {sgn(C["ai_split"]["TD scorer"]["roi"])} and QB picks {sgn(C["ai_split"]["QB"]["roi"])} (1.5 SE each, a hypothesis). Andy's own volume and yardage props returned {sgn(C["andy_split"]["volume/yardage"]["roi"])}.</p>
      <p><b>Proposed split:</b> Andy owns sides and the dog-ML RR. The AI proposes QB and TD-scorer props. An AI side pick needs Andy or a second source before it goes on a ticket.</p></div>
    <div class="card"><h3>Expert agreement as a filter</h3>
      <div style="overflow-x:auto"><table class="t" style="min-width:480px"><thead><tr><th>Our placed prop legs</th><th>Hit</th><th>Priced</th><th>Return</th><th>SE</th></tr></thead><tbody>{filt_rows}</tbody></table></div>
      <p class="dim">Agreement with a keep-list expert lines up with a better return (1.2 SE, hypothesis). Agreement with the fade list alone lines up with a worse one (1.7 SE). Use agreement as a tiebreaker, not a reason to add a leg.</p></div>
  </div>
  <div class="panel"><h4>Recommendation ledger divergences, Week 3 (D1–D11), graded leg by leg</h4><table class="t"><thead><tr><th>#</th><th>Divergence</th><th>Right call</th><th>What happened</th></tr></thead><tbody>{led_rows}</tbody></table></div>
</section>

<section id="experts">
  <div class="eyebrow">T2-B · Expert scorecard v2</div>
  <h2>Follow, screen or fade</h2>
  <p class="sub">{B["n_raw"]} Twitter and YouTube prop picks, collapsed to {B["n_collapsed"]} (one rung per ladder). {B["ftd_moved"]} first-TD calls were moved out of anytime TD using the tweet text, and {B["priced"]} picks were priced from the BetOnline board at the exact rung. Intervals are 95% Wilson. No expert clears 2 SE on priced return, so nobody is on a follow list yet.</p>
  <div class="panel">{c_experts()}<div class="legend"><span><i style="background:var(--o1)"></i>Screen (idea source)</span><span><i style="background:var(--miss)"></i>Fade</span><span><i style="background:var(--proj)"></i>Ignore</span></div></div>
  <div class="panel"><table class="t"><thead><tr><th>Expert</th><th>Verdict</th><th>Record (95%)</th><th>Priced, return</th><th>Standard lines</th><th>By week</th><th>Why</th></tr></thead><tbody>{xrows}</tbody></table></div>
  <div class="grid2">
    <div class="panel"><h4>All expert props at board prices, by market</h4><table class="t" style="min-width:420px"><thead><tr><th>Market</th><th>Hit</th><th>Priced</th><th>Break-even</th><th>Return</th></tr></thead><tbody>{mk_rows}</tbody></table>
      <p class="dim">Taken as a group, expert props lost money at BetOnline prices. Standard lines hit {B["line_all"]["standard"]["w"]} of {B["line_all"]["standard"]["n"]} against 52.4% needed.</p></div>
    <div class="card"><h3>Podcasts, YouTube, dossiers</h3>
      <p><b>Sides:</b> Twitter {sd["Twitter"]["w"]}/{sd["Twitter"]["n"]}, podcasts {sd["Podcast"]["w"]}/{sd["Podcast"]["n"]}, YouTube {sd["YouTube"]["w"]}/{sd["YouTube"]["n"]}. None of them beats the 52.4% that −110 requires.</p>
      <p><b>Podcast props</b> (Supabase <code>user_picks</code>, read-only, Week 3 only): BettingPros {B["podcast_props"]["BettingPros"]["w"]}/{B["podcast_props"]["BettingPros"]["n"]}, Action Network {B["podcast_props"]["Action Network"]["w"]}/{B["podcast_props"]["Action Network"]["n"]}. One week is too thin to judge.</p>
      <p><b>YouTube:</b> Brandon Anderson's Week 3 props went 0 for 9 (thin).</p>
      <p><b>Expert dossiers</b> hold sentiment citations with no line or price. They stay context only and are not scored.</p></div>
  </div>
</section>
{mnf_block}
<section id="method">
  <div class="eyebrow">Method and caveats</div>
  <h2>How this was built</h2>
  <ul class="sub">
    <li>Baseline: Team 1's graded tables (<code>cum.json</code>, <code>w*legs.json</code>, <code>w*paper.json</code>, <code>expert_*.json</code>). Codex's independent re-grade (C1) and backtest (C4) had not landed when this was built. Re-run the scripts against <code>codex/</code> when they do.</li>
    <li>Wagers-file grading errors from the briefing were checked against ESPN box scores and fixed in the local wagers file (14 legs). No ticket result or payout changed. Team 1's tables already had them right.</li>
    <li>"SE" means standard errors from break-even (binomial). Anything under 2 SE is labelled a hypothesis. Returns use flat $1 per leg as a single, which is how a leg's edge enters a parlay's EV.</li>
    <li>Board prices are one BetOnline capture per week (W2 Sun 9/20, W3 Sat 9/26 and Sun 9/27). W1 props are unpriced unless the ticket shows a price.</li>
    <li>Scripts and outputs: <code>reports/analysis/w1-3-deep/claude/</code>. No wagers, account actions, TheOddsAPI calls or Supabase writes were made.</li>
  </ul>
</section>
</div>
<div id="tip" hidden></div>
<script>
(function(){{const t=document.getElementById('tip');document.addEventListener('mouseover',ev=>{{const el=ev.target.closest('[data-tip]');if(!el){{t.hidden=true;return}}t.textContent=el.getAttribute('data-tip');t.hidden=false}});
document.addEventListener('mousemove',ev=>{{if(t.hidden)return;const x=Math.min(ev.clientX+14,window.innerWidth-t.offsetWidth-8);t.style.left=x+'px';t.style.top=(ev.clientY+14)+'px'}});}})();
</script>'''
open(OUTF, 'w').write(page)
print('ok', len(page))
