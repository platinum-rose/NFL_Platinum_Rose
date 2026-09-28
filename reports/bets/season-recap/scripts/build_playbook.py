import json,collections,math,html
e=html.escape
D=json.load(open('cum.json')); T=D['T']; UV=json.load(open('uv.json'))
css=open('css_part.txt').read().replace('{{','{').replace('}}','}').replace('<title>Week 3 Post-Mortem</title>','<title>Week 4 Betting Playbook</title>')
css=css.replace('</style>','''.heat{border-collapse:collapse;font:13px var(--body);min-width:560px;width:100%}
.heat th{font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--ink2);padding:6px 8px;text-align:center;border-bottom:2px solid var(--ink)}
.heat th:first-child,.heat td:first-child{text-align:left}
.heat td{padding:6px 8px;text-align:center;border-bottom:1px solid var(--rule);font-variant-numeric:tabular-nums;font-family:var(--mono);font-size:12px}
.heat td.c{border-radius:3px}
.ev{font:600 10.5px var(--mono);padding:1px 6px;border-radius:3px;border:1px solid currentColor;white-space:nowrap}
.ev-strong{color:var(--miss)} .ev-good{color:var(--hit)} .ev-thin{color:var(--ink3)}
.plays{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px}
.play{background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:14px 16px;display:grid;gap:6px;align-content:start}
.play h3{font-size:21px;font-weight:600;text-transform:uppercase}
.play .tag2{font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase}
.lean .tag2{color:var(--hit)} .cut .tag2{color:var(--miss)} .rule .tag2{color:var(--o1)}
.play p{margin:0;font-size:14px} .play .evid{font:12px var(--mono);color:var(--ink2)}
.alloc{border-collapse:collapse;width:100%;min-width:560px;font-size:13.5px}
.alloc th{text-align:left;font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--ink2);border-bottom:2px solid var(--ink);padding:6px 8px}
.alloc td{padding:7px 8px;border-bottom:1px solid var(--rule);vertical-align:top} .alloc td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.note-box{border-left:3px solid var(--o3);padding:8px 12px;background:var(--paper);font-size:13.5px;color:var(--ink2);max-width:80ch}
</style>''')
def dec(p):
    try: p=float(str(p).replace('+',''))
    except: return None
    return 1+p/100 if p>0 else 1+100/abs(p)
RET={'bet_20260906_bm_738317559_2team':50.86,'bet_20260909_bm_738444813_2team':29.70,'bet_20260917_738851934_bkr_sgp_2team':70.02,'bet_20260920_739004327_bm_compact_round_robin':44.83,'bet_20260920_739003867_bm_compact_round_robin':16.39,'bet_20260926_739358766_bm_compact_round_robin':39.21}
def struct(t):
    ty=(t['type'] or '').lower(); n=len(t['legs'])
    if 'round robin' in ty: return '2-team round robins' if '2-team' in ty else '4-team master RRs'
    if 'teaser' in ty or n<=2: return '1–2 leg tickets + teaser'
    if n<=4: return '3–4 leg parlays'
    if n<=6: return '5–6 leg parlays'
    return '7+ leg parlays'
S=collections.OrderedDict((k,[0,0,0,0]) for k in ['2-team round robins','1–2 leg tickets + teaser','3–4 leg parlays','5–6 leg parlays','7+ leg parlays','4-team master RRs'])
for t in T:
    if t['funding'] in ('promo_credit','free_bet') or 'novig' in t['id']: continue
    s=S[struct(t)]; r=RET.get(t['id'],0); s[0]+=1; s[1]+=t['stake']; s[2]+=r; s[3]+=1 if r>0 else 0
staked=sum(v[1] for v in S.values()); ret=sum(v[2] for v in S.values())
# ---- chart helpers
def hbars(rows,width=760,label_w=200,right_w=250,maxv=None):
    maxv=maxv or max(sum(s[0] for s in r[1]) for r in rows); plot=width-label_w-right_w; rh=32; h=rh*len(rows)+8
    o=[f'<svg class="chart" viewBox="0 0 {width} {h}" role="img">']
    for i,(lab,segs,right) in enumerate(rows):
        y=i*rh+6; x=label_w
        o.append(f'<text class="lab" x="{label_w-10}" y="{y+13}" text-anchor="end">{e(lab)}</text>')
        for j,(v,cls,tip) in enumerate(segs):
            if v<=0: continue
            w=v/maxv*plot; o.append(f'<rect class="{cls}" x="{x:.1f}" y="{y}" width="{max(w-2,1):.1f}" height="18" rx="3" data-tip="{e(tip)}"/>'); x+=w
        o.append(f'<text class="val" x="{x+8:.1f}" y="{y+13}">{e(right)}</text>')
    o.append('</svg>'); return ''.join(o)
rows=[]
for k,(n,s,r,c) in S.items():
    rows.append((k,[(r,'s-ret',f'{k}: returned ${r:.2f}'),(max(s-r,0),'s-stake',f'{k}: ${s:.2f} staked on {n} tickets')] if r<=s else [(s,'s-ret',f'{k}: returned ${r:.2f} on ${s:.2f}'),(r-s,'s-prof',f'{k}: profit ${r-s:.2f}')],f'${s:.0f} in · ${r:.0f} back · {c}/{n} cashed'))
c_struct=hbars(rows)
# compounding
pr=[x for x in UV if x['dec']]; hit=sum(x['result']=='W' for x in pr)/len(pr); be=sum(1/x['dec'] for x in pr)/len(pr); ratio=hit/be
def comp_chart():
    W,H=640,260; L,R,Tp,B=56,20,16,40; pw=W-L-R; ph=H-Tp-B
    X=lambda n: L+(n-1)/7*pw; Y=lambda v: Tp+(1.1-v)/1.1*ph
    o=[f'<svg class="chart" viewBox="0 0 {W} {H}" role="img">']
    for v in (0,0.25,0.5,0.75,1.0):
        o.append(f'<line class="grid" x1="{L}" x2="{W-R}" y1="{Y(v):.1f}" y2="{Y(v):.1f}"/><text class="tick" x="{L-8}" y="{Y(v)+4:.1f}" text-anchor="end">${v:.2f}</text>')
    o.append(f'<line class="zero" x1="{L}" x2="{W-R}" y1="{Y(1):.1f}" y2="{Y(1):.1f}"/>')
    pts=[(n,ratio**n) for n in range(1,9)]
    o.append('<polyline fill="none" stroke="var(--miss)" stroke-width="2" points="'+' '.join(f'{X(n):.1f},{Y(v):.1f}' for n,v in pts)+'"/>')
    for n,v in pts:
        o.append(f'<circle cx="{X(n):.1f}" cy="{Y(v):.1f}" r="5" fill="var(--miss)" stroke="var(--paper)" stroke-width="2" data-tip="{n}-leg ticket: about ${v:.2f} back per $1 at the season leg edge"/>')
        o.append(f'<text class="tick" x="{X(n):.1f}" y="{H-B+18}" text-anchor="middle">{n}</text>')
        if n in (1,2,4,6,8): o.append(f'<text class="val" x="{X(n):.1f}" y="{Y(v)+(22 if n==1 else -10):.1f}" text-anchor="middle">${v:.2f}</text>')
    o.append(f'<text class="tick" x="{L+pw/2}" y="{H-4}" text-anchor="middle">legs per ticket</text><text class="val" x="{W-R-4}" y="{Y(1)-6:.1f}" text-anchor="end">break-even $1.00</text></svg>')
    return ''.join(o)
c_comp=comp_chart()
# category dot plot
g=collections.defaultdict(list)
for l in UV: g[l['cat']].append(l)
cats=[]
for k,v in g.items():
    p=[x for x in v if x['dec']]
    if len(v)<8 or not p: continue
    n=len(v); w=sum(x['result']=='W' for x in v); b=sum(1/x['dec'] for x in p)/len(p); z=(w/n-b)/math.sqrt(b*(1-b)/n)
    roi=sum((x['dec']-1) if x['result']=='W' else -1 for x in p)/len(p)
    wk={i:(sum(x['result']=='W' for x in v if x['week']==i),sum(1 for x in v if x['week']==i)) for i in (1,2,3)}
    cats.append(dict(k=k,n=n,w=w,hit=w/n,be=b,z=z,roi=roi,wk=wk))
cats.sort(key=lambda c:-(c['hit']-c['be']))
def dot_chart():
    W=760; L=190; R=150; rh=28; H=rh*len(cats)+46; pw=W-L-R
    X=lambda v: L+v*pw
    o=[f'<svg class="chart" viewBox="0 0 {W} {H}" role="img">']
    for v in (0,.2,.4,.6,.8,1):
        o.append(f'<line class="grid" x1="{X(v):.1f}" x2="{X(v):.1f}" y1="4" y2="{H-30}"/><text class="tick" x="{X(v):.1f}" y="{H-12}" text-anchor="middle">{int(v*100)}%</text>')
    for i,c in enumerate(cats):
        y=i*rh+18; up=c['hit']>=c['be']
        o.append(f'<text class="lab" x="{L-10}" y="{y+4}" text-anchor="end">{e(c["k"])}</text>')
        o.append(f'<line x1="{X(c["be"]):.1f}" x2="{X(c["hit"]):.1f}" y1="{y}" y2="{y}" stroke="{"var(--hit)" if up else "var(--miss)"}" stroke-width="3" opacity=".55"/>')
        o.append(f'<line x1="{X(c["be"]):.1f}" x2="{X(c["be"]):.1f}" y1="{y-8}" y2="{y+8}" stroke="var(--ink)" stroke-width="2" data-tip="{e(c["k"])}: break-even {c["be"]*100:.0f}% at the prices paid"/>')
        o.append(f'<circle cx="{X(c["hit"]):.1f}" cy="{y}" r="6" fill="{"var(--hit)" if up else "var(--miss)"}" stroke="var(--paper)" stroke-width="2" data-tip="{e(c["k"])}: hit {c["w"]}/{c["n"]} = {c["hit"]*100:.0f}% vs break-even {c["be"]*100:.0f}% · flat ROI {c["roi"]*100:+.0f}%"/>')
        o.append(f'<text class="val" x="{W-R+10}" y="{y+4}">{c["w"]}/{c["n"]} · {c["roi"]*100:+.0f}%</text>')
    o.append('</svg>'); return ''.join(o)
c_cat=dot_chart()
def ev(z):
    if abs(z)>=2: return '<span class="ev ev-strong">strong</span>' if z<0 else '<span class="ev ev-good">strong</span>'
    if abs(z)>=1: return '<span class="ev ev-thin">moderate</span>'
    return '<span class="ev ev-thin">thin</span>'
def cell(w,n):
    if not n: return '<td>—</td>'
    r=w/n; a=min(abs(r-0.5)*1.6,0.55)
    col=f'color-mix(in srgb, var(--hit) {int(a*100)}%, transparent)' if r>=.5 else f'color-mix(in srgb, var(--miss) {int(a*100)}%, transparent)'
    return f'<td class="c" style="background:{col}">{w}/{n}</td>'
heat=''.join(f'<tr><td>{e(c["k"])}</td>'+''.join(cell(*c["wk"][i]) for i in (1,2,3))+f'<td><b>{c["w"]}/{c["n"]}</b></td><td>{c["be"]*100:.0f}%</td><td>{ev(c["z"])}</td></tr>' for c in sorted(cats,key=lambda c:c['z']))
# price bands
def band(d):
    p=(d-1)*100 if d>=2 else -100/(d-1)
    if p<=-200: return '−200 or shorter'
    if p<=-151: return '−199 to −151'
    if p<=-121: return '−150 to −121'
    if p<=-100: return '−120 to −100'
    if p<150: return '+100 to +149'
    return '+150 or longer'
BO=['−200 or shorter','−199 to −151','−150 to −121','−120 to −100','+100 to +149','+150 or longer']
bg=collections.defaultdict(list)
for x in pr: bg[band(x['dec'])].append(x)
def roi(v): return sum((x['dec']-1) if x['result']=='W' else -1 for x in v)/len(v)
def div_chart(items,W=760,L=190,R=170):
    rh=30; H=rh*len(items)+30; pw=W-L-R; lo,hi=-0.5,0.5
    X=lambda v: L+(max(lo,min(hi,v))-lo)/(hi-lo)*pw
    o=[f'<svg class="chart" viewBox="0 0 {W} {H}" role="img">']
    for v in (-0.5,-0.25,0,0.25,0.5):
        o.append(f'<line class="{"zero" if v==0 else "grid"}" x1="{X(v):.1f}" x2="{X(v):.1f}" y1="2" y2="{H-24}"/><text class="tick" x="{X(v):.1f}" y="{H-8}" text-anchor="middle">{int(v*100):+d}%</text>')
    for i,(lab,val,txt) in enumerate(items):
        y=i*rh+6; x0=X(0); x1=X(val)
        o.append(f'<text class="lab" x="{L-10}" y="{y+13}" text-anchor="end">{e(lab)}</text>')
        o.append(f'<rect class="{"s-hit" if val>=0 else "s-miss"}" x="{min(x0,x1):.1f}" y="{y}" width="{max(abs(x1-x0),1):.1f}" height="18" rx="3" data-tip="{e(lab)}: {e(txt)}"/>')
        o.append(f'<text class="val" x="{W-R+10}" y="{y+13}">{e(txt)}</text>')
    o.append('</svg>'); return ''.join(o)
c_price=div_chart([(b,roi(bg[b]),f"{sum(x['result']=='W' for x in bg[b])}/{len(bg[b])} · {roi(bg[b])*100:+.0f}%") for b in BO])
# game script + origin + direction
def grp(f):
    v=[x for x in pr if f(x)]; return v
gs=[('Prop on the team that won',grp(lambda x:x['kind']=='prop' and x['team_won'] is True)),('Prop on the team that lost',grp(lambda x:x['kind']=='prop' and x['team_won'] is False)),
    ('AI-backed props (placed)',grp(lambda x:x['kind']=='prop' and x['origin']=='agree')),('AI-backed sides & totals (placed)',grp(lambda x:x['kind']!='prop' and x['origin']=='agree')),
    ('Your own sides & totals',grp(lambda x:x['kind']!='prop' and x['origin'] in ('andy','unlogged'))),('Dog moneylines',grp(lambda x:x['kind']=='ml' and x['dec']>=2)),('Dog spreads',grp(lambda x:x['kind']=='spread' and (x['thr'] or 0)>0))]
c_cuts=div_chart([(k,roi(v),f"{sum(x['result']=='W' for x in v)}/{len(v)} · {roi(v)*100:+.0f}%") for k,v in gs])
json.dump(dict(staked=staked,ret=ret,ratio=ratio,hit=hit,be=be,npr=len(pr),S=S,cats=cats,gs={k:(sum(x['result']=='W' for x in v),len(v),roi(v)) for k,v in gs},bands={b:(sum(x['result']=='W' for x in bg[b]),len(bg[b]),roi(bg[b])) for b in BO}),open('pb_metrics.json','w'),indent=1,default=str)
json.dump(dict(css=css,c_struct=c_struct,c_comp=c_comp,c_cat=c_cat,heat=heat,c_price=c_price,c_cuts=c_cuts),open('pb_parts.json','w'))
print(round(staked,2),round(ret,2),ratio,hit,be,len(pr))
for k,v in S.items(): print(k,v)
print(json.load(open('pb_metrics.json'))['gs'])
