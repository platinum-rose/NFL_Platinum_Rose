"""Season-to-date review page (claude.ai artifact "Platinum Rose Season Review").

  python build_season_report.py --week 3            # -> ../season-review.html
Reuses weekly_review.analyse() per week and for the season, so the page and the markdown summaries never disagree.
Styling shares the Platinum Rose recap system (Team 1 post-mortems, W1-3 Basket Review)."""
import argparse, html, json, os, sys, datetime
sys.path.insert(0, os.path.dirname(__file__))
from lib import *
from weekly_review import analyse, provenance_map, HYP

e = html.escape
def money(x, d=2): return f"{'−' if x < 0 else '+'}${abs(x):,.{d}f}"
def cls(x): return 'neg' if x < 0 else ('pos' if x > 0 else '')
def pct(x, d=0): return '—' if x is None else f'{x*100:.{d}f}%'


def week_chart(rows):
    """rows: [(label, staked, returned)] grouped bars + net labels."""
    W, L, R, H0 = 760, 70, 20, 30; n = len(rows); top = max([s for _, s, _ in rows] + [1])
    top = (int(top / 100) + 1) * 100; ph = 190; H = ph + 70
    Y = lambda v: H0 + ph - v / top * ph; bw = min(46, (W - L - R) / max(n, 1) / 2.8); step = (W - L - R) / max(n, 1)
    o = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Cash staked and returned by week">']
    for v in range(0, top + 1, 100 if top <= 600 else 200):
        o.append(f'<line class="grid" x1="{L}" x2="{W-R}" y1="{Y(v):.1f}" y2="{Y(v):.1f}"/><text class="tick" x="{L-8}" y="{Y(v)+4:.1f}" text-anchor="end">${v}</text>')
    for i, (lab, s, r) in enumerate(rows):
        cx = L + step * i + step / 2
        o.append(f'<rect class="b-stake" x="{cx-bw-2:.1f}" y="{Y(s):.1f}" width="{bw:.1f}" height="{Y(0)-Y(s):.1f}" rx="2" data-tip="{e(lab)}: ${s:,.2f} staked"/>')
        o.append(f'<rect class="b-ret" x="{cx+2:.1f}" y="{Y(r):.1f}" width="{bw:.1f}" height="{max(Y(0)-Y(r),0.01):.1f}" rx="2" data-tip="{e(lab)}: ${r:,.2f} returned"/>')
        o.append(f'<text class="grp" x="{cx:.1f}" y="{H-30}" text-anchor="middle">{e(lab)}</text>')
        o.append(f'<text class="val {cls(r-s)}" x="{cx:.1f}" y="{H-12}" text-anchor="middle">{money(r-s, 0)}</text>')
    return ''.join(o) + '</svg>'


def money_table(title, B, note=''):
    mx = max([abs(b['net']) for b in B.values()] + [1])
    rows = ''.join(
        f"<tr><td>{e(k)}</td><td class='num'>{b['tickets']}</td><td class='num'>{b['won']}</td><td class='num'>${b['staked']:,.2f}</td>"
        f"<td class='num'>${b['returned']:,.2f}</td><td class='num {cls(b['net'])}'>{money(b['net'])}</td>"
        f"<td class='barcell'><span class='nb {cls(b['net'])}' style='width:{abs(b['net'])/mx*100:.1f}%'></span></td></tr>" for k, b in B.items())
    return (f"<div class='panel'><h4>{e(title)}</h4>{('<p class=dim>' + e(note) + '</p>') if note else ''}<table class='t'><thead><tr><th>{e(title.split(' · ')[0])}</th>"
            f"<th class='num'>Tickets</th><th class='num'>Won</th><th class='num'>Staked</th><th class='num'>Returned</th><th class='num'>Net</th><th>Net loss scale</th></tr></thead><tbody>{rows}</tbody></table></div>")


def market_chart(M):
    items = [(k, r) for k, r in M.items() if r['n'] >= 3]
    W, L, R = 760, 170, 150; rh = 26; H = rh * len(items) + 50
    X = lambda v: L + v * (W - L - R)
    o = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Leg hit rate by market with 95% intervals and break-even">']
    for v in (0, .25, .5, .75, 1):
        o.append(f'<line class="grid" x1="{X(v):.1f}" x2="{X(v):.1f}" y1="8" y2="{H-30}"/><text class="tick" x="{X(v):.1f}" y="{H-12}" text-anchor="middle">{int(v*100)}%</text>')
    for i, (k, r) in enumerate(items):
        y = 22 + i * rh
        o.append(f'<text class="lab" x="{L-10}" y="{y+4}" text-anchor="end">{e(k)}</text>')
        o.append(f'<line class="ci" x1="{X(r["ci"][0]):.1f}" x2="{X(r["ci"][1]):.1f}" y1="{y}" y2="{y}"/>')
        if r['breakeven']:
            o.append(f'<line class="be" x1="{X(r["breakeven"]):.1f}" x2="{X(r["breakeven"]):.1f}" y1="{y-8}" y2="{y+8}" data-tip="{e(k)}: break-even {pct(r["breakeven"])} at the average ticket price of {r["priced"]} priced legs"/>')
        good = r['breakeven'] and r['hit'] >= r['breakeven']
        c = 'm-good' if good else ('m-bad' if r['breakeven'] else 'm-none')
        o.append(f'<circle class="{c}" cx="{X(r["hit"]):.1f}" cy="{y}" r="6" data-tip="{e(k)}: {r["won"]}/{r["n"]} hit ({pct(r["hit"])}), 95% CI {pct(r["ci"][0])}–{pct(r["ci"][1])}"/>')
        ret = f'${r["ret_per_1"]:.2f}/$1' if r['ret_per_1'] is not None else 'unpriced'
        o.append(f'<text class="val" x="{W-R+12}" y="{y+4}">{r["won"]}/{r["n"]} · {ret}</text>')
    return ''.join(o) + '</svg>'


def hyp_cards(season, weeks):
    out = []
    for h, title, base in HYP:
        S = season['hypotheses'][h]
        lines = []
        for k, r in S.items():
            if not isinstance(r, dict): continue
            per = ' · '.join(f"W{w}: {wk['hypotheses'][h][k]['won']}/{wk['hypotheses'][h][k]['n']}" for w, wk in weeks)
            ret = f", ${r['ret_per_1']:.2f} per $1 on {r['priced']} priced" if r['ret_per_1'] is not None else ''
            lines.append(f"<li><b>{e(k)}</b>: {r['won']}/{r['n']} ({pct(r['hit'])}){ret}<br><span class='dim'>{e(per)}</span></li>")
        z = S.get('z_diff'); ev = S.get('evidence')
        if z is None:
            zs = [r.get('z_vs_price') for r in S.values() if isinstance(r, dict) and r.get('z_vs_price') is not None]
            z = max(zs, key=abs) if zs else None; ev = evidence(z) if z is not None else 'unpriced'
        pill = 'p-strong' if ev.startswith('strong') else 'p-hyp'
        zt = f"{z:+.1f} SE" if z is not None else 'no priced legs'
        out.append(f"<div class='card'><div class='ch'><span class='mono'>{h}</span><span class='pill {pill}'>{e(ev.split(' (')[0])}</span></div>"
                   f"<h3>{e(title)}</h3><p class='ev'>Baseline — {e(base)}</p><ul class='hl'>{''.join(lines)}</ul><p class='ev'>Season test: {zt}</p></div>")
    return ''.join(out)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--out', default=os.path.join(HERE, 'season-review.html'))
    a = ap.parse_args()
    Wg = load_wagers(); G = load_games(); prov = provenance_map(Wg)
    wks = list(range(1, a.week + 1))
    per = [(w, analyse(Wg, G, [w], prov)) for w in wks]
    S = analyse(Wg, G, wks, prov)
    t = S['totals']; p = S['promo']; c = S['checklist']
    open_n = sum(len(x['open_tickets']) for _, x in per)
    chart_w = week_chart([(f'Week {w}', x['totals']['staked'], x['totals']['returned']) for w, x in per])
    weekrows = ''.join(f"<tr><td>Week {w}</td><td class='num'>{x['totals']['tickets']}</td><td class='num'>{x['totals']['won']}</td><td class='num'>${x['totals']['staked']:,.2f}</td>"
                       f"<td class='num'>${x['totals']['returned']:,.2f}</td><td class='num {cls(x['totals']['net'])}'>{money(x['totals']['net'])}</td>"
                       f"<td class='num'>{x['legs']['won_unique']}/{x['legs']['unique']}</td><td class='num'>{x['promo']['tickets']} · ${x['promo']['credit_value_returned']:.2f}</td></tr>" for w, x in per)
    rules = ''.join(f"<tr><td>{e(r)}</td><td class='num'>{b['tickets']}</td><td class='num'>${b['staked']:,.2f}</td><td class='num'>${b['returned']:,.2f}</td><td class='num {cls(b['net'])}'>{money(b['net'])}</td></tr>" for r, b in sorted(c['rules'].items(), key=lambda kv: kv[1]['net']))
    expo = ''.join(f"<tr><td>Week {x['week']}</td><td>{e(x['game'])}</td><td class='num'>${x['cash']:,.2f}</td><td class='num'>{x['tickets']}</td><td class='num'>{x['games_over_25_that_week']}</td></tr>" for x in S['exposure_over_25'])
    promo = ''.join(f"<tr><td>{e(d['book'])}</td><td>{e(d['title'] or d['id'])}</td><td class='num'>${float(d['stake'] or 0):.2f}</td><td>{e(d['result'] or '')}</td><td class='num'>${d['value']:.2f}</td></tr>" for d in p['detail'])
    unk = [x for x in S['provenance'] if x['by'] == 'unknown']
    gen = datetime.datetime.now().strftime('%a %b %d, %Y %H:%M')
    body = f"""
<header class="top">
  <span class="eyebrow">Platinum Rose · 2026 season · Weeks 1–{a.week} · settled tickets only</span>
  <h1>Season Review</h1>
  <p class="lede">Every settled ticket in the wagers file, re-cut each week: where the cash went, which leg markets hit, whether the Weeks 1–3 findings are holding, and which tickets broke the build checklist. Cash only; promo and trade credits sit in their own table.{' ' + str(open_n) + ' ticket(s) still open and excluded.' if open_n else ''}</p>
  <div class="kpis">
    <div class="kpi"><span class="n {cls(t['net'])}">{money(t['net'], 0)}</span><span class="l">Season net · {t['roi']*100:+.0f}% of stake</span></div>
    <div class="kpi"><span class="n">${t['staked']:,.0f}</span><span class="l">Cash staked on {t['tickets']} tickets</span></div>
    <div class="kpi"><span class="n">${t['returned']:,.0f}</span><span class="l">Returned by {t['won']} winning tickets</span></div>
    <div class="kpi"><span class="n">{S['legs']['won_unique']}/{S['legs']['unique']}</span><span class="l">Unique placed legs hit ({pct(S['legs']['won_unique']/max(S['legs']['unique'],1))})</span></div>
    <div class="kpi"><span class="n">${p['credit_value_returned']:,.0f}</span><span class="l">Promo/credit value won from ${p['credit_staked']:,.0f} of credits</span></div>
  </div>
</header>
<section id="weeks"><h2>Week by week</h2>
  <div class="panel"><div class="legend"><span><i style="background:var(--stake)"></i>Staked</span><span><i style="background:var(--ret)"></i>Returned</span><span>Net under each week</span></div>{chart_w}</div>
  <div class="panel"><table class="t"><thead><tr><th>Week</th><th class="num">Tickets</th><th class="num">Won</th><th class="num">Staked</th><th class="num">Returned</th><th class="num">Net</th><th class="num">Unique legs hit</th><th class="num">Promo · value</th></tr></thead><tbody>{weekrows}
  <tr class="tot"><td><b>Season</b></td><td class="num">{t['tickets']}</td><td class="num">{t['won']}</td><td class="num">${t['staked']:,.2f}</td><td class="num">${t['returned']:,.2f}</td><td class="num {cls(t['net'])}"><b>{money(t['net'])}</b></td><td class="num">{S['legs']['won_unique']}/{S['legs']['unique']}</td><td class="num">{p['tickets']} · ${p['credit_value_returned']:.2f}</td></tr></tbody></table></div>
</section>
<section id="money"><h2>Where the cash went</h2>
  <p class="sub">Season to date. The bar shows each row's net against the largest net in the table.</p>
  {money_table('Ticket family', S['by_family'])}
  <div class="grid2">{money_table('Legs per ticket', S['by_legs'])}{money_table('Ticket price band', S['by_band'])}</div>
  <div class="grid2">{money_table('Book', S['by_book'])}{money_table('Provenance · who built it', S['by_prov'], 'Claude = recommended by Claude and placed as proposed or nearly so; mixed = Claude card edited by Andy; andy = Andy-built. W1–3 is inferred from Team 1 leg origins and notes, so treat that split as approximate.')}</div>
</section>
<section id="markets"><h2>Leg markets</h2>
  <p class="sub">Unique placed positions (a leg on five tickets counts once), markets with 3+ legs. Dot = hit rate, grey bar = 95% interval, black tick = break-even at the average price where the leg price was on the ticket. Green dot clears its break-even; red does not; grey is unpriced.</p>
  <div class="panel">{market_chart(S['by_market'])}</div>
</section>
<section id="hypotheses"><h2>W1–3 findings, re-tested</h2>
  <p class="sub">Each finding from the Weeks 1–3 deep analysis, re-scored on everything settled so far. A finding becomes a rule only at 2 SE; everything else stays a hypothesis.</p>
  <div class="grid2">{hyp_cards(S, per)}</div>
</section>
<section id="checklist"><h2>Build checklist</h2>
  <p class="sub">Cash tickets checked against the Week 4 build checklist (max 3 legs on prop and island tickets, $10 cap, no sacks, no dog spreads, no full-game Unders in parlays, no legs shorter than −200, no 4-team master RR, no 5+ side parlays).</p>
  <div class="kpis two">
    <div class="kpi"><span class="n {cls(c['kept']['net'])}">{money(c['kept']['net'], 0)}</span><span class="l">Kept every rule · {c['kept']['tickets']} tickets · ${c['kept']['staked']:,.0f} staked</span></div>
    <div class="kpi"><span class="n {cls(c['broke']['net'])}">{money(c['broke']['net'], 0)}</span><span class="l">Broke at least one rule · {c['broke']['tickets']} tickets · ${c['broke']['staked']:,.0f} staked</span></div>
  </div>
  <div class="panel"><table class="t"><thead><tr><th>Rule broken</th><th class="num">Tickets</th><th class="num">Staked</th><th class="num">Returned</th><th class="num">Net</th></tr></thead><tbody>{rules}</tbody></table>
  <p class="dim">A ticket can break several rules, so rows overlap.</p></div>
  <div class="panel"><h4>Cash tied to one game above $25 · top 3 per week</h4><p class="dim">A parlay's whole stake rides on every game in it, so it counts in full against each one. Round robins excluded. The checklist cap is $25 a game.</p><table class="t"><thead><tr><th>Week</th><th>Game</th><th class="num">Cash</th><th class="num">Tickets</th><th class="num">Games over $25 that week</th></tr></thead><tbody>{expo or '<tr><td colspan=5>None</td></tr>'}</tbody></table></div>
</section>
<section id="promo"><h2>Promo and trade credits</h2>
  <div class="panel"><table class="t"><thead><tr><th>Book</th><th>Ticket</th><th class="num">Credit</th><th>Result</th><th class="num">Value won</th></tr></thead><tbody>{promo or '<tr><td colspan=5>None</td></tr>'}</tbody></table></div>
</section>
<section id="method"><h2>Method</h2>
  <ul class="method">
    <li>Source: <code>data/official-picks/user-placed-wagers-2026.json</code>, settled tickets only. Box context (team pass attempts, team TDs, winner) comes from ESPN box scores in <code>data/fantasy/boxscores/</code>. Legs left PENDING on dead tickets are graded from the box ({S['legs']['from_box']} leg instances this season); a player missing from the box is a lost leg.</li>
    <li>Built by <code>reports/analysis/season/claude/scripts/build_season_report.py --week {a.week}</code> on {gen} PT. The per-week markdown is <code>out/week-NN-summary.md</code>.</li>
    <li>Return per $1 treats each priced leg as a single at its ticket price. Many BetOnline prop legs carry no leg price, so those markets show hit rates only.</li>
    <li>Provenance: {len(unk)} settled ticket(s) have no signal and show as unknown. Correct any row in <code>reports/analysis/season/claude/provenance.json</code>.</li>
  </ul>
</section>"""
    css = open(os.path.join(os.path.dirname(__file__), 'season.css'), encoding='utf-8').read()
    page = ('<title>Platinum Rose Season Review</title>\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">\n'
            f'<style>{css}</style>\n<div class="wrap">{body}</div><div id="tip" hidden></div>\n'
            '<script>(()=>{const t=document.getElementById("tip");document.addEventListener("mousemove",ev=>{const el=ev.target.closest("[data-tip]");'
            'if(!el){t.hidden=true;return}t.textContent=el.getAttribute("data-tip");t.hidden=false;const x=Math.min(ev.clientX+14,innerWidth-t.offsetWidth-8);'
            't.style.left=x+"px";t.style.top=(ev.clientY+14)+"px"})})();</script>\n')
    open(a.out, 'w', encoding='utf-8').write(page)
    print('wrote', a.out, len(page), 'bytes')


if __name__ == '__main__':
    main()
