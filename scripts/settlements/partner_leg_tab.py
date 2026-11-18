"""Add the Leg analysis tab to a partner statement (run after partner_ticket_tab.py).

Usage: python3 partner_leg_tab.py <repo_root> --partner Amanda --file reports/settlements/2026-w10/Week10-Balance-Amanda.html --statement PR-2026-W10-AM
"""
import argparse,html,collections
from partner_common import resolve, load_wagers, partner_rows
ap=argparse.ArgumentParser(); ap.add_argument('root'); ap.add_argument('--partner',required=True); ap.add_argument('--file',required=True); ap.add_argument('--statement',required=True)
args=ap.parse_args()
root=args.root; e=html.escape
P=resolve(root,args.file)
rows=partner_rows(load_wagers(root),args.partner)
CAT={'total':'Game totals','anytime_touchdown':'Anytime TD','anytime_td':'Anytime TD','atd':'Anytime TD','two_plus_touchdowns':'2+ TDs','touchdowns_2_plus':'2+ TDs',
'receptions':'Receptions','receiving_yards':'Receiving yards','rushing_yards':'Rushing yards / carries','carries':'Rushing yards / carries',
'passing_yards':'QB passing (yds, TDs, completions)','passing_tds':'QB passing (yds, TDs, completions)','passing_touchdowns':'QB passing (yds, TDs, completions)','pass_completions':'QB passing (yds, TDs, completions)',
'pass_interceptions':'QB interceptions','tackles_assists':'Defense (tackles + assists)','moneyline':'Game lines (ML, spread)','spread':'Game lines (ML, spread)',
'team_field_goals':'Team props (FGs, TDs)','team_touchdowns':'Team props (FGs, TDs)'}
def num(v):
    try: return float(v)
    except (TypeError,ValueError): return None
def f(v):
    if v is None: return '—'
    return str(int(v)) if float(v).is_integer() else f"{v:g}"
def short(w):
    import re
    tt=(w.get('ticket_type') or '').replace(' Contract (Event Trading)','')
    tt=re.sub(r'(\d+) Pick Combo',r'\1-pick combo',tt)
    tn=str(w.get('book_ticket_number') or w.get('ticket_number') or '')
    if len(tn)>16 and '-' in tn: tn=tn.split('-')[0]
    return f"{w['book'].replace('DraftKings Predictions','DK Predictions')} {tt}"+(f" #{tn}" if tn else '')
cat=collections.OrderedDict(); allw=alll=0; near=[]; blocks=[]
for w in rows:
    legs=w.get('legs',[]); won=sum(l.get('status')=='WON' for l in legs); lost=[l for l in legs if l.get('status')=='LOST']
    if len(lost)==1: near.append((w,lost[0]))
    trs=[]
    for l in legs:
        st=l.get('status'); c=CAT.get(l.get('market'),l.get('market'))
        d=cat.setdefault(c,[0,0]); d[0 if st=='WON' else 1]+=1
        if st=='WON': allw+=1
        else: alll+=1
        line=num(l.get('line')); act=num(l.get('actual_stat')); dirn=(l.get('direction') or '').lower()
        if line is not None and act is not None:
            import math
            if dirn=='under':
                thr=math.floor(line) if line%1 else line-1; m=thr-act
            else:
                thr=math.ceil(line) if line%1 else line; m=act-thr
            if m>=0: mg="<span class='pos'>"+('exact' if m==0 else f"+{f(m)} spare")+"</span>"
            else: mg=f"<span class='neg'>short {f(-m)}</span>"
            need=('U ' if dirn=='under' else '')+(f"{f(line+0.5)}+" if dirn in ('over','yes') and float(line)%1==0.5 else f(line))
            actual=f(act)
        else:
            mg='—'; need='win'; actual=e(str(l.get('actual_stat') or '—'))
        cls='won' if st=='WON' else 'lost'
        trs.append(f"<tr class='{cls}'><td class='t'>{e(l.get('selection') or '')}<div class='sub'>{e(l.get('game') or '')}</div></td><td class='t c'>{e(c)}</td><td>{need}</td><td>{actual}</td><td>{mg}</td><td class='r {cls}'>{'CASHED' if st=='WON' else 'LOST'}</td></tr>")
    res='WON' if w.get('result')=='win' else 'LOST'
    tag=f"<span class='pill {'won' if res=='WON' else ('near' if len(lost)==1 else 'lost')}'>{res} · {won}/{len(legs)} legs</span>"
    blocks.append(f"<div class='lt'><div class='lh'><div><b>{e(short(w))}</b><div class='sub'>Week {w['week']} · {e(w['date'])} · ${w.get('stake_usd'):.2f} face</div></div>{tag}</div><table class='lg'><tr><th>LEG</th><th>TYPE</th><th>NEEDED</th><th>ACTUAL</th><th>MARGIN</th><th>RESULT</th></tr>{''.join(trs)}</table></div>")
tot=allw+alll
crow=[]
for c,(a,b) in sorted(cat.items(),key=lambda kv:(-(kv[1][0]/(sum(kv[1]))),-sum(kv[1]))):
    n=a+b; p=a/n*100
    crow.append(f"<tr><td class='t'>{e(c)}</td><td>{n}</td><td class='pos'>{a}</td><td class='neg'>{b}</td><td><div class='bar'><i style='width:{p:.0f}%;background:{'var(--green)' if p>=60 else ('#c9a227' if p>=45 else 'var(--red)')}'></i></div></td><td><b>{p:.0f}%</b></td></tr>")
nears=''.join(f"<li><b>{e(short(w))}</b> (Week {w['week']}): {e(l.get('selection') or '')} <span class='g'>— actual {e(f(num(l.get('actual_stat'))) if num(l.get('actual_stat')) is not None else str(l.get('actual_stat')))}</span></li>" for w,l in near)
tw=sum(w.get('result')=='win' for w in rows)
atd=cat.get('Anytime TD',[0,0]); two=cat.get('2+ TDs',[0,0])
tdpct=f"{(atd[0]+two[0])/(sum(atd)+sum(two))*100:.0f}% hit" if sum(atd)+sum(two) else 'none placed'
pane=f"""<section id="legs" class="pane"><div class="card"><div class="top"><div><div class="kicker">LEG ANALYSIS</div><h1>Every leg, graded</h1></div><div class="meta">No. {e(args.statement)}<br>{len(rows)} tickets · {tot} legs</div></div>
<div class="kpis"><div><span>{allw}/{tot}</span>legs cashed ({allw/tot*100:.0f}%)</div><div><span>{tw}/{len(rows)}</span>tickets cashed</div><div><span>{len(near)}</span>tickets lost by one leg</div><div><span>{sum(atd)+sum(two)}</span>TD-scorer legs ({tdpct})</div></div>
<h3 class="wk">Success rate by leg type</h3><table class="cat"><tr><th>TYPE</th><th>LEGS</th><th>CASHED</th><th>LOST</th><th></th><th>HIT RATE</th></tr>{''.join(crow)}<tr class="tot"><td class='t'>All legs</td><td>{tot}</td><td class='pos'>{allw}</td><td class='neg'>{alll}</td><td><div class='bar'><i style='width:{allw/tot*100:.0f}%;background:var(--ink)'></i></div></td><td><b>{allw/tot*100:.0f}%</b></td></tr></table>
<div class="notes"><div>Needed is the threshold the leg had to reach (78+ for a 77.5 line). Margin counts from that threshold: "+2 spare" cleared it with room to spare, "exact" hit the threshold exactly, "short 1" missed by one.</div></div>
<h3 class="wk">One leg away ({len(near)} ticket{'' if len(near)==1 else 's'})</h3><ul class="near">{nears}</ul>
<h3 class="wk">Leg by leg</h3>{''.join(blocks)}</div></section>"""
css="""
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0 4px}
.kpis div{background:#f7f8fa;border:1px solid var(--line);border-radius:6px;padding:12px;color:var(--mute);font-size:11.5px;line-height:1.4}
.kpis span{display:block;font-size:22px;font-weight:700;color:var(--ink);font-family:ui-monospace,Menlo,Consolas,monospace}
table.cat td,table.lg td{padding:8px 6px}
.cat td:nth-child(5){width:30%}
.bar{background:#eef0f3;border-radius:3px;height:9px;overflow:hidden}.bar i{display:block;height:100%}
tr.tot td{border-top:2px solid var(--ink);font-weight:700}
.near{margin:6px 0 0;padding-left:18px;line-height:1.8;font-size:12.5px}.near .g{color:var(--mute)}
.lt{margin:14px 0 18px}.lh{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:4px}
.pill{font-size:10.5px;font-weight:700;letter-spacing:.05em;padding:4px 8px;border-radius:4px;white-space:nowrap}
.pill.won{background:#e3f1e8;color:var(--green)}.pill.lost{background:#f7e3e3;color:var(--red)}.pill.near{background:#fbf1d6;color:#8a6a00}
table.lg{table-layout:fixed}table.lg th:nth-child(1){width:36%}table.lg th:nth-child(2){width:20%}table.lg th:nth-child(3),table.lg th:nth-child(4){width:9%}table.lg th:nth-child(5){width:14%}table.lg th:nth-child(6){width:12%}table.lg th{font-size:10px;padding:6px}table.lg td{font-size:12px}table.lg td.t{width:40%}table.lg td.c{width:auto;color:var(--mute);font-size:11.5px}
table.lg tr.lost td.t:first-child{box-shadow:inset 3px 0 0 var(--red)}table.lg tr.won td.t:first-child{box-shadow:inset 3px 0 0 var(--green)}
@media (max-width:640px){.kpis{grid-template-columns:1fr 1fr}.lg,.cat{display:block;overflow-x:auto}}
</style>"""
s=open(P,encoding='utf-8').read()
s=s.replace('</style>',css,1)
s=s.replace('<button data-t="tix">Ticket breakdown</button>','<button data-t="tix">Ticket breakdown</button><button data-t="legs">Leg analysis</button>',1)
s=s.replace('</div>\n<script>',pane+'</div>\n<script>',1)
open(P,'w',encoding='utf-8',newline='\n').write(s)
print(allw,alll,len(near),tw)
