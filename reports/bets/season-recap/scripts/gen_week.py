import json,collections,html,sys,importlib,os
WK=sys.argv[1]
CFG=importlib.import_module(f'cfg_w{WK}')
R=CFG.R
D=json.load(open(f'w{WK}legs.json')); T=D['tickets']; L=D['legs']; A=D['ai_only']
for _l in L:
    if _l['label'] in CFG.FORCE_ANDY: _l['origin']='andy'
PP=json.load(open(f'w{WK}paper.json')); GS=json.load(open(f'w{WK}gamesum.json'))
e=html.escape
# ---------- core numbers
cash=[t for t in T if t['funding'] not in ('promo_credit','free_bet')]
staked=round(sum(t['stake'] for t in cash),2)
RET=CFG.RET
returned=sum(RET.values()); net=round(returned-staked,2)
MR_LIVE=18.24
graded=[l for l in L if l['result'] in ('W','L')]; lw=sum(l['result']=='W' for l in graded)
def ukey(l): return tuple(l['pkey'])+((str(l['thr']),) if l['group']=='Sides & totals' else ())
U={}
for l in graded: U.setdefault(ukey(l),l)
UV=[l for l in U.values() if l['kind']!='cfb']
# buckets
bucket=CFG.bucket
B=collections.OrderedDict((k,[0,0,0]) for k in CFG.BUCKETS)
for t in cash:
    b=B[bucket(t)]; b[0]+=t['stake']; b[1]+=RET.get(t['id'],0); b[2]+=1
# category table
cat=collections.defaultdict(lambda:[0,0])
for l in UV: cat[(l['group'],l['cat'])][0 if l['result']=='W' else 1]+=1
# origin
def rate(v): w=sum(x['result']=='W' for x in v); return w,len(v)
ORG={}
for grp in ['Player props','Sides & totals']:
    ORG[grp]={'agree':rate([l for l in UV if l['group']==grp and l['origin']=='agree']),
              'andy':rate([l for l in UV if l['group']==grp and l['origin']=='andy']),
              'ai_only':rate([l for l in A if l['group']==grp and l['result'] in ('W','L')])}
print(staked,returned,net,lw,len(graded),len(UV),ORG,dict(B))
# ---------- svg helpers
def bar_h(rows, width=640, label_w=150, maxv=None, fmt=lambda v:str(v), row_h=30, legend=None, right_w=130):
    """rows: [(label, [(value, cls, tip)], right_text)] stacked horizontal bars"""
    maxv=maxv or max(sum(s[0] for s in r[1]) for r in rows) or 1
    plot=width-label_w-right_w; h=row_h*len(rows)+10
    out=[f'<svg class="chart" viewBox="0 0 {width} {h}" role="img" preserveAspectRatio="xMinYMin meet">']
    for i,(lab,segs,right) in enumerate(rows):
        y=i*row_h+6; x=label_w
        out.append(f'<text class="lab" x="{label_w-10}" y="{y+13}" text-anchor="end">{e(lab)}</text>')
        n=len([s for s in segs if s[0]>0])
        for j,(v,cls,tip) in enumerate(segs):
            if v<=0: continue
            w=v/maxv*plot
            gap=2 if j<len(segs)-1 else 0
            out.append(f'<rect class="{cls}" x="{x:.1f}" y="{y}" width="{max(w-gap,1):.1f}" height="18" rx="3" data-tip="{e(tip)}"/>')
            x+=w
        out.append(f'<text class="val" x="{x+8:.1f}" y="{y+13}">{e(right)}</text>')
    out.append('</svg>'); return ''.join(out)
# ---------- chart 1: P&L buckets
rows=[]
for k,(s,r,n) in B.items():
    segs=[(r,'s-ret',f'{k}: returned ${r:.2f}'),(s-r,'s-stake',f'{k}: ${s:.2f} staked on {n} tickets')]
    rows.append((k,segs,f'${s:.2f} · {n} tkt'+(f' · back ${r:.2f}' if r else '')))
c_pnl=bar_h(rows,label_w=190,right_w=250,width=760)
# ---------- chart 2: projection vs actual totals (dumbbell)
PROJ=CFG.PROJ
GM={f"{g['away']}@{g['home']}":g for g in GS}
dd=[]
for k,(pa,ph) in PROJ.items():
    g=GM[k]; a,h=g['score']; dd.append((k,pa+ph,a+h,ph-pa,h-a,(pa>ph)==(a>h)))
dd.sort(key=lambda x:x[2]-x[1])
def dumbbell(items,lo,hi,title_proj,title_act,unit,width=640,label_w=90,zero=None):
    plot=width-label_w-30; rh=26; h=rh*len(items)+44
    X=lambda v: label_w+(v-lo)/(hi-lo)*plot
    o=[f'<svg class="chart" viewBox="0 0 {width} {h}" role="img">']
    for t in range(lo,hi+1,10 if hi-lo>40 else 7):
        o.append(f'<line class="grid" x1="{X(t):.1f}" x2="{X(t):.1f}" y1="4" y2="{h-30}"/><text class="tick" x="{X(t):.1f}" y="{h-14}" text-anchor="middle">{t}</text>')
    if zero is not None: o.append(f'<line class="zero" x1="{X(zero):.1f}" x2="{X(zero):.1f}" y1="4" y2="{h-30}"/>')
    for i,(k,p,a,tip) in enumerate(items):
        y=i*rh+16
        o.append(f'<text class="lab" x="{label_w-10}" y="{y+4}" text-anchor="end">{e(k)}</text>')
        o.append(f'<line class="conn" x1="{X(p):.1f}" x2="{X(a):.1f}" y1="{y}" y2="{y}"/>')
        o.append(f'<circle class="dot-proj" cx="{X(p):.1f}" cy="{y}" r="5" data-tip="{e(k)}: projected {p:+g}{unit}" />' if zero is not None else f'<circle class="dot-proj" cx="{X(p):.1f}" cy="{y}" r="5" data-tip="{e(k)}: projected {p}{unit}"/>')
        o.append(f'<circle class="dot-act" cx="{X(a):.1f}" cy="{y}" r="5.5" data-tip="{e(tip)}"/>')
    o.append('</svg>'); return ''.join(o)
c_tot=dumbbell([(k,round(p,1),a,f'{k}: final total {a} (projected {p:.1f}, {a-p:+.1f})') for k,p,a,pm,am,ok in dd],CFG.TOT_LO,CFG.TOT_HI,'','',' pts')
dm=sorted(dd,key=lambda x:x[4]-x[3])
c_mar=dumbbell([(k,round(pm,1),am,f'{k}: home margin {am:+d} (projected {pm:+.1f})'+('' if ok else ' — wrong winner')) for k,p,a,pm,am,ok in dm],-40,40,'','','',zero=0)
tot_err=sum(a-p for k,p,a,*_ in dd)/len(dd); winners=sum(ok for *_,ok in dd); over_n=sum(a>p for k,p,a,*_ in dd)
mae=sum(abs(am-pm) for k,p,a,pm,am,ok in dd)/len(dd)
# ---------- chart 3: category hit rate
order=[]
for (grp,c),(w,lo) in cat.items(): order.append((grp,c,w,lo))
order.sort(key=lambda x:(x[0]!='Player props',-(x[2]/(x[2]+x[3])),-(x[2]+x[3])))
def catrows(grp):
    rr=[]
    for g,c,w,lo in order:
        if g!=grp: continue
        rr.append((c,[(w,'s-hit',f'{c}: {w} hit'),(lo,'s-miss',f'{c}: {lo} missed')],f'{w}/{w+lo} · {round(100*w/(w+lo))}%'))
    return rr
mx=max(w+lo for *_,w,lo in order)
c_cat_p=bar_h(catrows('Player props'),label_w=150,maxv=mx)
c_cat_s=bar_h(catrows('Sides & totals'),label_w=150,maxv=mx)
# ---------- chart 4: origin comparison
def orig_chart():
    labs=CFG.ORIGIN_LABELS
    width=640; label_w=150; plot=width-label_w-90; rh=26
    o=[f'<svg class="chart" viewBox="0 0 {width} {2*(3*rh+26)+10}" role="img">']; y=4
    for grp in ['Player props','Sides & totals']:
        o.append(f'<text class="grp" x="0" y="{y+12}">{grp}</text>'); y+=22
        for key,lab,cls in labs:
            w,n=ORG[grp][key]; r=w/n if n else 0
            o.append(f'<text class="lab" x="{label_w-10}" y="{y+13}" text-anchor="end">{lab}</text>')
            o.append(f'<rect class="track" x="{label_w}" y="{y}" width="{plot}" height="18" rx="3"/>')
            o.append(f'<rect class="{cls}" x="{label_w}" y="{y}" width="{max(r*plot,1):.1f}" height="18" rx="3" data-tip="{grp} · {lab}: {w} of {n} hit"/>')
            o.append(f'<text class="val" x="{label_w+plot+8}" y="{y+13}">{round(100*r)}% · {w}/{n}</text>')
            y+=rh
        y+=8
    x50=label_w+plot*0.5
    o.append(f'<line class="zero" x1="{x50}" x2="{x50}" y1="22" y2="{y-8}"/>')
    o.append('</svg>'); return ''.join(o)
c_org=orig_chart()
# ---------- tickets closeness
PRETTY=[(' rec_yds',' rec yds'),(' rush_yds',' rush yds'),(' pass_td',' pass TD'),(' atd',' ATD'),(' tackles',' T+A'),(' int_thrown',' INT thrown'),(' first_td',' 1st TD'),(' tds',' TDs'),(' sacks',' sack'),(' carries',' carries'),(' pass_att',' pass att')]
def pretty(t):
    for a,b in PRETTY: t=t.replace(a,b)
    return t
def pill(l):
    r=l['result']; cls={'W':'p-hit','L':'p-miss'}.get(r,'p-pend'); icon={'W':'✓','L':'✗','P':'='}.get(r,'…')
    act=l.get('actual'); act='' if act is None else (f"{act:g}" if isinstance(act,(int,float)) else str(act))
    return f'<span class="pill {cls}" data-tip="{e(pretty(l["label"]))} — actual {e(act) or "pending"}"><b>{icon}</b>{e(pretty(l["label"])[:46])}{(" <i>"+e(act)+"</i>") if (r=="L" and act) else ""}</span>'
tk=[]
NAMES=CFG.NAMES
for t in T:
    if 'round_robin' in t['id'] or 'master_rr' in t['id'] or 'novig' in t['id'] or not t['legs']: continue
    ls=t['legs']; m=sum(l['result']=='L' for l in ls)
    tk.append(dict(name=NAMES.get(t['id'],(t['title'] or t['id'])[:60]),num=t['num'],stake=t['stake'],odds=t['odds'],legs=ls,miss=m,hit=sum(l['result']=='W' for l in ls),paper=False,book=t['book']))
for p in PP:
    ls=p['legs']; tk.append(dict(name=p['name'],num=None,stake=None,odds=None,legs=ls,miss=sum(l['result']=='L' for l in ls),hit=sum(l['result']=='W' for l in ls),paper=True,book='paper'))
tk.sort(key=lambda x:(x['miss'],-x['hit']/max(len(x['legs']),1)))
close=[x for x in tk if x['miss']<=1]
def tcard(x):
    tag='<span class="tag tag-paper">Not placed</span>' if x['paper'] else f'<span class="tag">{e(x["book"])}{(" #"+e(str(x["num"]))) if x["num"] else ""} · ${x["stake"]:g}{(" @ "+e(str(x["odds"]))) if x["odds"] else ""}</span>'
    return f'<div class="tcard"><div class="thead"><span class="tname">{e(x["name"])}</span>{tag}<span class="score">{x["hit"]}/{len(x["legs"])}</span></div><div class="pills">{"".join(pill(l) for l in x["legs"])}</div></div>'
close_html=''.join(tcard(x) for x in close)
two_html=''.join(tcard(x) for x in tk if x['miss']==2)
# ---------- divergences
DIV=CFG.DIV
div_rows=''.join(f'<tr><td class="mono">{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td><td>{e(d)}</td><td>{e(f)}</td><td><span class="verdict v-{ {"Andy":"andy","AI":"ai","AI closer":"ai","Push":"push","Pending":"push"}.get(g.split(" ")[0] if g.startswith("Andy") else g,"ai") }">{e(g)}</span></td></tr>' for a,b,c,d,f,g in DIV)
# ---------- game cards
exp=collections.defaultdict(lambda:[0,0])
for l in graded: exp[l['game']][0 if l['result']=='W' else 1]+=1
order_games=CFG.ORDER
_EXP_PATH=getattr(CFG,'EXPERTS',None)
EXP=json.load(open(_EXP_PATH)) if _EXP_PATH and os.path.exists(_EXP_PATH) else None
def expert_row(k,r):
    if not r.get('experts'): return ''
    links=''
    if EXP:
        seen=[]
        for t in EXP['games'].get(k,{}).get('takeaways',[]):
            if t['src'] not in seen: seen.append(t['src'])
        links=' '.join(f'<a class="src" href="{e(EXP["sources"][x]["url"])}" target="_blank" rel="noopener">{e(EXP["sources"][x]["outlet"].split(" (")[0])}</a>' for x in seen if x in EXP['sources'])
    return f'<div><dt>Expert view</dt><dd>{e(r["experts"])}{(" <span class=\"srcs\">"+links+"</span>") if links else ""}</dd></div>'
def gcard(k):
    g=GM[k]; r=R.get(k); a,h=g['score']; A_,H_=g['away'],g['home']
    ls=g['ls']; nq=max(len(ls[0]),len(ls[1]))
    head=''.join(f'<th>{i+1 if i<4 else "OT"}</th>' for i in range(nq))
    def row(t,q,s,win): return f'<tr class="{ "win" if win else ""}"><td>{t}</td>'+''.join(f'<td>{x}</td>' for x in q)+f'<td class="fin">{s}</td></tr>'
    lstab=f'<table class="ls"><tr><th></th>{head}<th>F</th></tr>{row(A_,ls[0],a,a>h)}{row(H_,ls[1],h,h>a)}</table>'
    w,m=exp.get(k,[0,0]); pj=PROJ.get(k)
    projtxt=(f'{A_} {pj[0]:g}, {H_} {pj[1]:g}' if pj else CFG.NOPROJ)
    ta,th=g[A_],g[H_]
    stats=f'<div class="gstats"><span><b>{A_}</b> {ta["yds"]} yds · {ta["rush"]} rush · {ta["to"]} TO</span><span><b>{H_}</b> {th["yds"]} yds · {th["rush"]} rush · {th["to"]} TO</span></div>'
    expo=f'<div class="expo"><span class="mini hit">✓ {w}</span><span class="mini miss">✗ {m}</span><span class="note">leg instances on our tickets</span></div>' if (w+m) else '<div class="expo"><span class="note">No placed legs</span></div>'
    if not r: return ''
    return f'''<article class="game" id="g-{k.replace("@","-").lower()}"><header><h3>{A_} {a} <span>@</span> {H_} {h}</h3><span class="kick">{e(r["kick"])}</span></header>
{lstab}
<dl><div><dt>{CFG.PROJ_LABEL}</dt><dd>{e(projtxt)} <span class="total">(total {a+h}{(" vs "+format(pj[0]+pj[1],"g")) if pj else ""})</span></dd></div>
<div><dt>Our read</dt><dd>{e(r["ai"])}</dd></div>
<div><dt>What happened</dt><dd>{e(r["happened"])}</dd></div>
<div><dt>Where it went wrong</dt><dd>{e(r["wrong"])}</dd></div>{expert_row(k,r)}</dl>
{stats}<footer><span class="gradechip">{e(r["grade"])}</span>{expo}</footer></article>'''
games_html=''.join(gcard(k) for k in order_games)
# ---------- near misses
NM=CFG.NM
nm_html=''.join(f'<li><b>{e(a)}</b><span>{e(b)}</span></li>' for a,b in NM)
json.dump(dict(staked=staked,returned=returned,net=net,lw=lw,ln=len(graded),u=len(UV),org=ORG,B=B,tot_err=tot_err,winners=winners,over_n=over_n,mae=mae),open(f'metrics_w{WK}.json','w'),indent=1,default=str)
open(f'parts_w{WK}.json','w').write(json.dumps(dict(c_pnl=c_pnl,c_tot=c_tot,c_mar=c_mar,c_cat_p=c_cat_p,c_cat_s=c_cat_s,c_org=c_org,close_html=close_html,two_html=two_html,div_rows=div_rows,games_html=games_html,nm_html=nm_html)))
print('tot_err',tot_err,'winners',winners,'over',over_n,'mae',mae,'close',len(close))
