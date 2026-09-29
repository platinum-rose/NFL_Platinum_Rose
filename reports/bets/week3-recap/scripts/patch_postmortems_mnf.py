"""Close Week 3 in the Team 1 post-mortems after MNF (Claude Team 2, 2026-09-28).
Reads the settled wagers file; patches week3-post-mortem.html (header, KPIs, stake chart, SuperContest row, MNF recap,
season table, method note) and the season-to-date table in week1/week2 post-mortems. Writes .pre-mnf copies first.
Usage: python patch_postmortems.py <final score line e.g. "CHI 27, PHI 7"> """
import json, os, re, shutil, sys, html
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../analysis/season/claude/scripts'))
from lib import *
e = html.escape
SR = os.path.join(ROOT, 'reports/bets/season-recap'); W3 = os.path.join(ROOT, 'reports/bets/week3-recap')
FINAL = sys.argv[1]

W = load_wagers()
cum = jl(os.path.join(SR, 'cum.json'))
st = {(w['id'], l.get('selection')): l for w in W for l in (w.get('legs') or [])}
wk = {k: [w for w in W if w['week'] == k] for k in (1, 2, 3)}
assert all(w['status'] == 'SETTLED' for w in wk[3]), 'Week 3 still has open tickets'
def tot(k):
    c = [w for w in wk[k] if is_cash(w)]
    s = round(sum(cash_stake(w) for w in c), 2); r = round(sum(cash_return(w) for w in c), 2); return s, r, round(r - s, 2), len(c)
# placed-leg instances (Team 1 counting: every placed leg instance incl. promo tickets)
hit = {1: (63, 136), 2: (107, 211)}
L3 = [l for l in cum['L'] if l['week'] == 3]
w3h = sum(l['result'] == 'W' for l in L3); w3n = sum(l['result'] in ('W', 'L') for l in L3)
pend = [l for l in L3 if l['result'] == 'pending']
ph = sum(st.get((l['tid'], l['label']), {}).get('status') == 'WON' for l in pend)
have = {t['id'] for t in cum['T']}
new = [w for w in wk[3] if w['id'] not in have]
newlegs = [l for w in new for l in real_legs(w)]
nh = sum(l.get('status') == 'WON' for l in newlegs)
hit[3] = (w3h + ph + nh, w3n + len(pend) + len(newlegs))
print('W3 legs', hit[3], 'pending', len(pend), ph, 'new', len(newlegs), nh, [w['id'] for w in new])
T = {k: tot(k) for k in (1, 2, 3)}
S = (round(sum(T[k][0] for k in T), 2), round(sum(T[k][1] for k in T), 2)); S = S + (round(S[1] - S[0], 2),)
def m(x): return f"{'−' if x < 0 else ''}${abs(x):.2f}"
def season_table(cur):
    rows = ''
    for k in (1, 2, 3):
        s, r, n, _ = T[k]; h, nn = hit[k]
        rows += f'<tr class="{"cur" if k == cur else ""}"><td>Week {k}</td><td>${s:.2f}</td><td>${r:.2f}</td><td class="neg">{m(n)}</td><td>{h}/{nn} · {round(100*h/nn)}%</td></tr>'
    hh = sum(hit[k][0] for k in hit); nn = sum(hit[k][1] for k in hit)
    rows += f'<tr><td><b>Season</b></td><td><b>${S[0]:.2f}</b></td><td><b>${S[1]:.2f}</b></td><td class="neg"><b>{m(S[2])}</b></td><td><b>{hh}/{nn}</b></td></tr>'
    return f'<div class="panel"><h4>Season to date (cash tickets)</h4><table class="season"><thead><tr><th>Week</th><th>Staked</th><th>Returned</th><th>Net</th><th>Placed legs hit</th></tr></thead><tbody>{rows}</tbody></table></div>'

for k in (1, 2):
    p = os.path.join(SR, f'week{k}-post-mortem.html'); s = open(p, encoding='utf-8').read(); shutil.copy2(p, p + '.pre-mnf')
    s2 = re.sub(r'<div class="panel"><h4>Season to date \(cash tickets\)</h4>.*?</table></div>', lambda _: season_table(k), s, count=1, flags=re.S)
    assert s2 != s; open(p, 'w', encoding='utf-8').write(s2); print('patched', p)

# ---------------- Week 3
p = os.path.join(W3, 'week3-post-mortem.html'); s = open(p, encoding='utf-8').read(); shutil.copy2(p, p + '.pre-mnf')
s0 = s
st3, rt3, nt3, n3 = T[3]
promo3 = [w for w in wk[3] if not is_cash(w)]
def rep(a, b):
    global s
    assert a in s, a[:80]; s = s.replace(a, b, 1)
rep('TNF through SNF · MNF PHI @ CHI pending', 'TNF through MNF · settled')
rep('<span class="n">$466.55</span><span class="l">Cash staked · 33 tickets (+1 Novig promo credit)</span>',
    f'<span class="n">${st3:.2f}</span><span class="l">Cash staked · {n3} tickets (+{len(promo3)} Novig trade credits)</span>')
rr = next(w for w in wk[3] if w['id'] == 'bet_20260927_739361263_bm_master_rr')
retlab = 'Returned: dog-ML RR, 3 of 10 combos' + (f'; master RR ${rr["settled_payout_usd"]:.2f}' if rr.get('settled_payout_usd') else '')
rep('<span class="n">$39.21</span><span class="l">Returned: dog-ML RR, 3 of 10 combos</span>', f'<span class="n">${rt3:.2f}</span><span class="l">{e(retlab)}</span>')
rep('<span class="n neg">−$427.34</span><span class="l">Net before MNF. Best case +$18.24 if PHI −3 covers.</span>',
    f'<span class="n neg">{m(nt3)}</span><span class="l">Net for the week, MNF included. Novig credits won ${sum(credit_return(w) for w in promo3):.2f} in credit value.</span>')
h, nn = hit[3]
rep('<span class="n">74/165</span><span class="l">Placed leg instances hit (45%). 7 legs wait on MNF.</span>',
    f'<span class="n">{h}/{nn}</span><span class="l">Placed leg instances hit ({round(100*h/nn)}%), MNF included.</span>')
# stake chart: add an MNF row at the same $ scale (320px = $218.08)
mnf_cash = [w for w in new if is_cash(w)]; ms = round(sum(cash_stake(w) for w in mnf_cash), 2); mr = round(sum(cash_return(w) for w in mnf_cash), 2)
sc = 320.0 / 218.08
row = (f'<text class="lab" x="180" y="169" text-anchor="end">MNF island tickets</text>'
       + (f'<rect class="s-ret" x="190.0" y="156" width="{mr*sc:.1f}" height="18" rx="3" data-tip="MNF island tickets: returned ${mr:.2f}"/>' if mr else '')
       + f'<rect class="s-stake" x="{190+mr*sc:.1f}" y="156" width="{max(ms-mr,0)*sc:.1f}" height="18" rx="3" data-tip="MNF island tickets: ${ms:.2f} staked on {len(mnf_cash)} tickets"/>'
       + f'<text class="val" x="{190+max(ms,mr)*sc+8:.1f}" y="169">${ms:.2f} · {len(mnf_cash)} tkt' + (f' · back ${mr:.2f}' if mr else '') + '</text></svg>')
i = s.find('<svg class="chart" viewBox="0 0 760 160"'); j = s.find('</svg>', i)
s = s[:i] + s[i:j].replace('viewBox="0 0 760 160"', 'viewBox="0 0 760 190"') + row + s[j + 6:]
# SuperContest row
sc5 = next((w for w in wk[3] if w['id'] == 'bet_20260927_739360142_bm_5team'), None)
phil = next((l for l in (sc5 or {}).get('legs', []) if 'PHI' in (l.get('selection') or '')), {})
rep('<td>NYJ lost by 7 (half a point short); PHI pending MNF</td><td><span class="verdict v-push">Pending</span></td>',
    f'<td>NYJ lost by 7 (half a point short); PHI −4.5 lost ({e(FINAL)})</td><td><span class="verdict v-push">Both lost</span></td>')
# MNF recap
def pill(l):
    ok = l.get('status') == 'WON'; a = l.get('actual_stat') or ''
    return (f'<span class="pill {"p-hit" if ok else "p-miss"}" data-tip="{e(l.get("selection") or "")} — actual {e(str(a))}"><b>{"✓" if ok else "✗"}</b>'
            f'{e(l.get("selection") or "")}' + ('' if ok else f' <i>{e(str(a))}</i>') + '</span>')
cards = ''
for w in sorted(new + [rr], key=lambda w: -sum(l.get('status') == 'WON' for l in real_legs(w)) / max(len(real_legs(w)), 1)):
    legs = [l for l in real_legs(w) if w is not rr or 'PHI' in (l.get('selection') or '')]
    tag = f"{e(w['book'])}{' #' + str(w['ticket_number']) if w.get('ticket_number') else ''} · ${float(w.get('stake_usd') or 0):.2f}" + ('' if is_cash(w) else ' credit') + f" @ {e(str(w.get('odds_american') or 'RR'))}"
    cards += (f'<div class="tcard"><div class="thead"><span class="tname">{e(w.get("game_title") or w["id"])}</span><span class="tag">{tag}</span>'
              f'<span class="score">{sum(l.get("status") == "WON" for l in legs)}/{len(legs)}</span></div><div class="pills">{"".join(pill(l) for l in legs)}</div></div>')
won = [w for w in new + [rr] if w.get('result') == 'win']
summary = (f'<b>Final: {e(FINAL)}.</b> PHI lost by 20, so the master RR\'s last live combo died ($0, derived by grading; confirm against the Bookmaker ticket) and both Novig trade credits lost ($0 credit value). '
           f'MNF-only cash: ${ms:.2f} on {len(mnf_cash)} BetOnline prop parlays, returned ${mr:.2f}. '
           + ('No MNF ticket cashed. ' if not won else f'Cashed: {", ".join(e(w.get("game_title") or w["id"]) for w in won)}. ')
           + 'D1 (Hurts 2+ pass TD / Nolan Smith sack / CHI TT U18.5) was Claude\'s and placed as proposed; D3, #1000553845 and the two Andy-built 6–7 leg tickets sit outside the Team 2 rules (≤3 legs) by Andy\'s choice. '
           'The game fit the W1–3 findings. PHI threw 26 times: its receiving legs on our tickets went 2 of 8 and both Hurts 2+ pass-TD legs lost. CHI threw 34: its receiving legs went 5 of 6. The DEF-ladder legs went 0 for 8 (no PHI sacks, no Keenum INT).')
rep(s[s.find('<div class="mnf">'):s.find('</div>', s.find('<div class="mnf">')) + 6],
    f'<div class="mnf"><h3>MNF PHI @ CHI — graded</h3><p>{summary}</p><div class="tcards">{cards}</div></div>')
# season table + css
css = '\ntable.season{border-collapse:collapse;width:100%;font-size:13.5px}table.season th{text-align:left;font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--ink2);border-bottom:2px solid var(--ink);padding:6px 8px}table.season td{padding:7px 8px;border-bottom:1px solid var(--rule);font-variant-numeric:tabular-nums}table.season tr.cur td{font-weight:600}.mnf h3{margin:0 0 6px}.mnf p{margin:0 0 10px;max-width:80ch}\n'
k = s.find('</style>'); s = s[:k] + css + s[k:]
k = s.find('<section id="money">'); s = s[:k] + season_table(3) + '\n' + s[k:]
rep('<ul class="method">', '<ul class="method">\n<li>MNF PHI @ CHI was graded on 2026-09-28 by Claude Team 2 from the ESPN final box score (merged into <span class="mono">data/fantasy/boxscores/espn-401872963.json</span> from the ESPN box-score page because the ESPN API was unreachable) and settled in the wagers file with <span class="mono">reports/analysis/season/claude/scripts/grade_week.py</span>.</li>')
open(p, 'w', encoding='utf-8').write(s); print('patched', p, len(s0), '->', len(s))
print('T', T, 'S', S, 'hit', hit)
