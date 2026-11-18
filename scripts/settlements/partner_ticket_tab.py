"""Add tabs + the Ticket breakdown tab to a partner statement whose base file has only the Balance card.

Usage (run before partner_leg_tab.py):
  python3 partner_ticket_tab.py <repo_root> --partner Amanda --file reports/settlements/2026-w10/Week10-Balance-Amanda.html \
      --statement PR-2026-W10-AM --pronoun her --key-stake "stake is her share..." [--stake-total 9.94] \
      [--prior "Prior-season balance (2025)=-115"] --net-label "2026 net, Weeks 8–10 TNF" \
      --balance-label "Current balance, Amanda's favor" --note "..." [--note "..."]
"""
import argparse, html, re
from partner_common import resolve, load_wagers, partner_rows, share

ap = argparse.ArgumentParser()
ap.add_argument('root'); ap.add_argument('--partner', required=True); ap.add_argument('--file', required=True)
ap.add_argument('--statement', required=True); ap.add_argument('--pronoun', default='their')
ap.add_argument('--key-stake', default='stake is the partner\'s share of the face value')
ap.add_argument('--stake-total', type=float, help='override the summed stakes (to match issued statements)')
ap.add_argument('--prior', help='LABEL=AMOUNT, amount signed from the partner\'s side (negative = partner owed Andy)')
ap.add_argument('--net-label', default='2026 net'); ap.add_argument('--balance-label', required=True)
ap.add_argument('--note', action='append', default=[])
ap.add_argument('--heading', default='Every split ticket')
a = ap.parse_args()

e = html.escape
t_ = lambda x: html.escape(x, quote=False)
rows = partner_rows(load_wagers(a.root), a.partner)
P = a.pronoun; Pc = P[:1].upper() + P[1:]

def money(x, dp=2):
    s = f"${abs(x):,.{dp}f}"; return ('−' if x < 0 else '') + s
def signed(x):
    return ('+' if x >= 0 else '−') + f"${abs(x):.2f}"
def fmt_stat(v):
    if v is None: return ''
    try: return str(int(v)) if float(v).is_integer() else str(v)
    except (ValueError, TypeError): return str(v)

out = []; totS = totR = 0; wk = None; n = 0
for w in rows:
    den, c = share(w); c3 = round(c, 3)
    win = w.get('result') == 'win'; pay = w.get('settled_payout_usd') or 0
    ret = round(pay / den, 2) if win else 0.0
    net = ret - c3; totS += c3; totR += ret; n += 1
    if w['week'] != wk:
        wk = w['week']; out.append(f'<h3 class="wk">Week {wk}</h3>')
    stake_str = f"${c3:.3f}".rstrip('0') if round(c3, 2) != c3 else f"${c3:.2f}"
    if stake_str.endswith('.'): stake_str += '00'
    promo = ' · promo-funded' if w.get('is_promo_credit') or w.get('funding_type') == 'promo_credit' else ''
    odds = w.get('odds_american'); odds = f" · {('+' if isinstance(odds, (int, float)) and odds > 0 else '')}{odds}" if odds not in (None, '') else ''
    tn = w.get('book_ticket_number') or w.get('ticket_number') or ''
    tt = (w.get('ticket_type') or '')
    tt = tt.replace(' Contract (Event Trading)', '').replace('Combo (', 'combo (')
    tt = re.sub(r'(\d+) Pick Combo', r'\1-pick combo', tt)
    book = w['book'].replace('DraftKings Predictions', 'DK Predictions')
    title = f"{book} {tt}".strip() + (' (solo)' if den == 1 and w.get('ownership_type') == 'solo' else '')
    tn = str(tn)
    if len(tn) > 16 and '-' in tn: tn = tn.split('-')[0]
    legs = []
    for l in w.get('legs', []):
        st = (l.get('status') or '').upper(); cls = {'WON': 'won', 'LOST': 'lost'}.get(st, '')
        act = l.get('actual_stat'); act = f" <span class='act'>(actual {fmt_stat(act)})</span>" if act is not None else ''
        legs.append(f"<li><span class='ls {cls}'>{e(st[:1] or '·')}</span>{e(l.get('selection') or '')} <span class='g'>{e(l.get('game') or '')}</span>{act}</li>")
    res = 'WON' if win else ('LOST' if w.get('result') == 'loss' else e(str(w.get('result')).upper()))
    out.append(f"""<details class="tk"><summary><div class="tl"><div class="tt">{e(title)}{(' #'+e(str(tn))) if tn else ''}</div><div class="sub">{e(w['date'])} · ${w.get('stake_usd'):.2f} face{e(odds)}{promo} · {P} share 1/{den}</div></div><div class="tr"><span class="r {'won' if win else 'lost'}">{res}</span><span class="nm">stake {stake_str}</span><span class="nm">{'return '+money(ret) if win else ''}</span><span class="nm {'pos' if net>0 else 'neg'}">{('+' if net>0 else '')+money(net,3 if round(net,2)!=round(net,3) else 2)}</span></div></summary><ol class="legs">{''.join(legs)}</ol></details>""")

if a.stake_total is not None: totS = a.stake_total
net = totR - totS
prior_html = ''; bal = net
if a.prior:
    lab, amt = a.prior.rsplit('=', 1); amt = float(amt); bal = net + amt
    prior_html = f"""<div><span>{t_(lab)}</span><span class="{'pos' if amt>=0 else 'neg'}">{signed(amt)}</span></div>"""

notes = ''.join(f"<div>{t_(t)}</div>" for t in a.note)
summary = f"""<div class="totals"><div><span>Tickets</span><span>{n}</span></div><div><span>{Pc} stakes</span><span class="neg">−${totS:.2f}</span></div><div><span>{Pc} winning shares</span><span class="pos">+${totR:.2f}</span></div><div><span>{t_(a.net_label)}</span><span class="{'pos' if net>=0 else 'neg'}">{signed(net)}</span></div>{prior_html}<div class="due"><span>{t_(a.balance_label)}</span><span>{signed(bal)}</span></div></div>""" + (f'<div class="notes">{notes}</div>' if notes else '')
pane = f"""<section id="tix" class="pane"><div class="card"><div class="top"><div><div class="kicker">TICKET BREAKDOWN</div><h1>{t_(a.heading)}</h1></div><div class="meta">No. {e(a.statement)}<br>Tap a ticket for its legs</div></div><div class="key"><span class="ls won">W</span> leg won <span class="ls lost">L</span> leg lost · {t_(a.key_stake)}</div>{''.join(out)}{summary}</div></section>"""

p = resolve(a.root, a.file); s = open(p, encoding='utf-8').read()
css = """
.tabs{display:flex;gap:6px;margin:0 0 14px}
.tabs button{font:inherit;font-weight:600;border:1px solid var(--line);background:#fff;color:var(--mute);padding:8px 16px;border-radius:6px;cursor:pointer}
.tabs button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.pane{display:none}.pane.on{display:block}
.wk{font-size:12px;letter-spacing:.1em;color:var(--rose);margin:22px 0 6px;text-transform:uppercase}
.tk{border-bottom:1px solid var(--line)}
.tk summary{list-style:none;display:flex;justify-content:space-between;gap:12px;padding:11px 4px;cursor:pointer}
.tk summary::-webkit-details-marker{display:none}
.tt{font-weight:600}.tl{flex:1;min-width:0}
.tr{display:grid;grid-template-columns:52px 92px 104px 74px;gap:6px;text-align:right;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;align-items:start}
.tr .r{text-align:left;font-family:inherit;font-weight:700;font-size:11px;letter-spacing:.06em}
.legs{margin:0 0 12px;padding:0 0 0 22px;color:#374151;line-height:1.75;font-size:12.5px}
.legs li{list-style:none;margin-left:-22px}
.ls{display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:4px;font-size:10.5px;font-weight:700;margin-right:8px;background:#eef0f3;color:var(--mute)}
.ls.won{background:#e3f1e8;color:var(--green)}.ls.lost{background:#f7e3e3;color:var(--red)}
.g{color:var(--mute);font-size:11px}.act{color:var(--mute);font-size:11px}
.key{color:var(--mute);font-size:11.5px;margin:14px 0 0}
@media (max-width:640px){.wrap{padding:16px}.card{padding:20px 16px}.tk summary{flex-direction:column}.tr{grid-template-columns:repeat(4,auto)}.parties{grid-template-columns:1fr}.totals{width:100%}}
@media print{.tabs{display:none}.pane{display:block!important;page-break-after:always}}
</style>"""
assert '</div></div></body></html>' in s, 'base file must be Balance-tab-only'
s = s.replace('</style>', css, 1)
s = s.replace('<div class="card">', '<div class="tabs"><button class="on" data-t="sum">Balance</button><button data-t="tix">Ticket breakdown</button></div><section id="sum" class="pane on"><div class="card">', 1)
s = s.replace('</div></div></body></html>', '</div></section>' + pane + """</div>
<script>document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id===b.dataset.t))});</script></body></html>""")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print(n, round(totS, 3), totR, round(bal, 2))
