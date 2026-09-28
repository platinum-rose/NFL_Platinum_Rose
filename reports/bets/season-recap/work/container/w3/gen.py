import json,collections,html
from recaps import R
D=json.load(open('w3legs.json')); T=D['tickets']; L=D['legs']; A=D['ai_only']
for _l in L:
    if _l['label'] in ('Green Bay Packers -4','Los Angeles Rams +2'): _l['origin']='andy'; PP=json.load(open('w3paper.json')); GS=json.load(open('w3gamesum.json'))
e=html.escape
# ---------- core numbers
cash=[t for t in T if t['funding']!='promo_credit']
staked=round(sum(t['stake'] for t in cash),2)
RET={'bet_20260926_739358766_bm_compact_round_robin':39.21}
returned=sum(RET.values()); net=round(returned-staked,2)
MR_LIVE=18.24
graded=[l for l in L if l['result']!='pending']; lw=sum(l['result']=='W' for l in graded)
def ukey(l): return tuple(l['pkey'])+((str(l['thr']),) if l['group']=='Sides & totals' else ())
U={}
for l in graded: U.setdefault(ukey(l),l)
UV=list(U.values())
# buckets
def bucket(t):
    i=t['id']
    if 'round_robin' in i or 'master_rr' in i: return 'Round robins'
    if 'tnf_atlgb' in i: return 'TNF prop ladder & SGP'
    if 'snf_tier' in i or 'moonshot' in i: return 'SNF island ladder'
    if t['book']=='BetOnline': return 'BEO prop parlays'
    return 'Game-line parlays & teaser'
B=collections.OrderedDict((k,[0,0,0]) for k in ['Game-line parlays & teaser','Round robins','BEO prop parlays','SNF island ladder','TNF prop ladder & SGP'])
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
              'ai_only':rate([l for l in A if l['group']==grp and l['result']!='pending'])}
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
PROJ={'LAC@BUF':(23,28),'CAR@CLE':(17,20),'NYJ@DET':(23,26),'HOU@IND':(19,21),'KC@MIA':(27,17),'TEN@NYG':(19,16),'CIN@PIT':(23,17),'SEA@WSH':(23,13),'NE@JAX':(20,24),'ARI@SF':(17,30),'MIN@TB':(19,21),'BAL@DAL':(30,24),'LV@NO':(20,22),'LAR@DEN':(21,20)}
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
c_tot=dumbbell([(k,p,a,f'{k}: final total {a} (projected {p}, {a-p:+d})') for k,p,a,pm,am,ok in dd],15,70,'','',' pts')
dm=sorted(dd,key=lambda x:x[4]-x[3])
c_mar=dumbbell([(k,pm,am,f'{k}: home margin {am:+d} (projected {pm:+d}){"" if ok else " — wrong winner"}') for k,p,a,pm,am,ok in dm],-30,30,'','','',zero=0)
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
    labs=[('agree','AI rec · placed','o-agree'),('andy','Andy only','o-andy'),('ai_only','AI rec · not placed','o-aionly')]
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
    r=l['result']; cls={'W':'p-hit','L':'p-miss'}.get(r,'p-pend'); icon={'W':'✓','L':'✗'}.get(r,'…')
    act=l.get('actual'); act='' if act is None else (f"{act:g}" if isinstance(act,(int,float)) else str(act))
    return f'<span class="pill {cls}" data-tip="{e(pretty(l["label"]))} — actual {e(act) or "pending"}"><b>{icon}</b>{e(pretty(l["label"])[:46])}{(" <i>"+e(act)+"</i>") if (r=="L" and act) else ""}</span>'
tk=[]
NAMES={'bet_20260924_tnf_atlgb_bijan_first_td_sgp_bkr':'TNF 1st-TD SGP','bet_20260927_739360277_bm_teaser4':'6-pt teaser (SEA/IND/BUF/SF)','bet_20260927_w03_beo_2td_4leg':'2+ TD 4-leg','bet_20260927_w03_beo_lastmin_8leg':'Last-minute 8-leg','bet_20260927_w03_beo_stackA_pm6':'Stack A 6-leg','bet_20260924_w03_favorites8_open2_bkr':'8-team open (#739211245)','bet_20260924_tnf_atlgb_tier2_atl_functional_bkr':'TNF Tier 2 "ATL functional"','bet_20260927_w03_beo_stackB_pm7':'Stack B 7-leg','bet_20260927_w03_beo_1000102186':'7a morning 6-leg','bet_20260924_tnf_atlgb_tier3_splash_6leg':'TNF Tier 3 splash'}
for t in T:
    if 'round_robin' in t['id'] or 'master_rr' in t['id'] or 'novig' in t['id']: continue
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
DIV=[
('D1','TNF Tier 1','Love Under 0.5 INT','Love 1+ INT','Love threw 1 INT','Andy'),
('D2','TNF Tier 3','Golden anytime TD','Golden 57+ rec yds','Golden 5-100-1: both hit','Push'),
('D3','Slot 10 favorites','GB ML','ATL/GB Under 43.5','GB lost 35–14; total 49: both lost','Push'),
('D4','#739213766 ($60)','Flagged GB −4 / BUF −6.5 as overpriced','Placed anyway','GB −4 lost by 25','AI'),
('D6','Game card','Paper 4-leg SF −7.5 + 3 Unders','5-team: SF −7, same Unders, + BUF −6.5','Both dead on the Unders; BUF −6.5 won','Push'),
('D7','7b afternoon','4-leg ~+929 (Purdy, Roquan, Downs, Jeanty 18+ car)','6-leg +5500 (added CMC 58+, Lamar ATD, Jeanty ATD, Irving)','AI version 3/4, placed 2/6; both lost on Downs (3)','AI closer'),
('D8','Slot 4 afternoon','SF −7.5 / TB ML / BAL −3.5 / U43.5 / U44','SF −7 / TB ML / BAL ML / U44 / U45','AI 0/5, placed 1/5 (BAL ML won; −3.5 lost by 0.5)','Andy'),
('D9','Stack A','McBride / Kittle ATD / Olave / Andrews 39+ / Wiggins 4+ / Henry 80+','Jeanty 18+ car, Andrews 45+, Henry 83+, J. Thompson 6+ T+A','AI 5/6, placed 4/6. Andrews (24) killed every version; Wiggins and Kittle would have hit','AI closer'),
('D10','Stack B','Vele / Otton / Corum 48+ / Jefferson (4-leg)','7-leg: dropped Corum, added Nix INT, Dak, Shough, Juwan','AI 1/4, placed 4/7: both lost','Push'),
('D11','SNF Tier 3','1st-half Under 22.5','Bonitto sack','1H total 16 and Bonitto 1 sack: both hit; ticket died elsewhere','Push'),
('New','SNF side','DEN +2 pregame','LAR +2 live (×2 tickets)','DEN won 30–26','AI'),
('New','SuperContest 5th pick','NYJ +6.5','PHI −4.5 (Andy & Amanda)','NYJ lost by 7 (half a point short); PHI pending MNF','Pending'),
('New','Prop RR','5-leg T+A / pass-TD RR (skipped by rule)','No prop RRs','4 of 5 legs hit (Schwesinger 6) → 6 of 10 combos cash; Roquan was off the board','AI (off board)'),
('New','Game sides','LAC +7 held, NYJ side, SEA removed','BUF ML / −6.5 / −1, DET ML, SEA ML','BUF and DET won; SEA lost','Andy 2–1'),
('New','Master RR adds','8 AI legs incl. BAL −3.5, CAR/CLE U42.5','Swapped in IND +2.5, NYJ/DET O47.5','Both Andy adds won; the two AI legs he cut split 1–1','Andy'),
]
div_rows=''.join(f'<tr><td class="mono">{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td><td>{e(d)}</td><td>{e(f)}</td><td><span class="verdict v-{ {"Andy":"andy","AI":"ai","AI closer":"ai","Push":"push","Pending":"push"}.get(g.split(" ")[0] if g.startswith("Andy") else g,"ai") }">{e(g)}</span></td></tr>' for a,b,c,d,f,g in DIV)
# ---------- game cards
exp=collections.defaultdict(lambda:[0,0])
for l in graded: exp[l['game']][0 if l['result']=='W' else 1]+=1
order_games=['ATL@GB','LAC@BUF','CAR@CLE','NYJ@DET','HOU@IND','KC@MIA','TEN@NYG','CIN@PIT','SEA@WSH','NE@JAX','ARI@SF','MIN@TB','BAL@DAL','LV@NO','LAR@DEN']
def gcard(k):
    g=GM[k]; r=R.get(k); a,h=g['score']; A_,H_=g['away'],g['home']
    ls=g['ls']; nq=max(len(ls[0]),len(ls[1]))
    head=''.join(f'<th>{i+1 if i<4 else "OT"}</th>' for i in range(nq))
    def row(t,q,s,win): return f'<tr class="{ "win" if win else ""}"><td>{t}</td>'+''.join(f'<td>{x}</td>' for x in q)+f'<td class="fin">{s}</td></tr>'
    lstab=f'<table class="ls"><tr><th></th>{head}<th>F</th></tr>{row(A_,ls[0],a,a>h)}{row(H_,ls[1],h,h>a)}</table>'
    w,m=exp.get(k,[0,0]); pj=PROJ.get(k)
    projtxt=(f'{A_} {pj[0]}, {H_} {pj[1]}' if pj else r['proj'])
    ta,th=g[A_],g[H_]
    stats=f'<div class="gstats"><span><b>{A_}</b> {ta["yds"]} yds · {ta["rush"]} rush · {ta["to"]} TO</span><span><b>{H_}</b> {th["yds"]} yds · {th["rush"]} rush · {th["to"]} TO</span></div>'
    expo=f'<div class="expo"><span class="mini hit">✓ {w}</span><span class="mini miss">✗ {m}</span><span class="note">leg instances on our tickets</span></div>' if (w+m) else '<div class="expo"><span class="note">No placed legs</span></div>'
    if not r: return ''
    return f'''<article class="game" id="g-{k.replace("@","-").lower()}"><header><h3>{A_} {a} <span>@</span> {H_} {h}</h3><span class="kick">{e(r["kick"])}</span></header>
{lstab}
<dl><div><dt>Our projection</dt><dd>{e(projtxt)} <span class="total">(total {a+h} vs {pj[0]+pj[1] if pj else "~40"})</span></dd></div>
<div><dt>Our read</dt><dd>{e(r["ai"])}</dd></div>
<div><dt>What happened</dt><dd>{e(r["happened"])}</dd></div>
<div><dt>Where it went wrong</dt><dd>{e(r["wrong"])}</dd></div></dl>
{stats}<footer><span class="gradechip">{e(r["grade"])}</span>{expo}</footer></article>'''
games_html=''.join(gcard(k) for k in order_games)
# ---------- near misses
NM=[('NYJ +6.5 (AI, SuperContest)','Lost by 0.5: Gibbs TD at 2:25'),('BAL −3.5 (AI)','Won by 3 on a 56-yd FG at 0:00; Andy\'s BAL ML won'),('SF −7 / −7.5 / −8','Won by 6 after two missed PATs'),('Rodgers 36+ pass att','34 attempts (last-minute 8-leg, 6/8)'),('Jonathan Taylor 72+ / 73+ rush','68 yards (7a and #1000184658)'),('Dallas Turner 1+ sack','Half a sack'),('Breece Hall 14+ carries (AI 7d)','13 carries'),('Penix 19.5+ completions','18 completions'),('McCaffrey 2+ TD','1 TD (2+ TD 4-leg died on this leg alone)'),('Bucky Irving 3+ rec / Pat Bryant 3+ rec','2 catches each')]
nm_html=''.join(f'<li><b>{e(a)}</b><span>{e(b)}</span></li>' for a,b in NM)
json.dump(dict(staked=staked,returned=returned,net=net,lw=lw,ln=len(graded),u=len(UV),org=ORG,B=B,tot_err=tot_err,winners=winners,over_n=over_n,mae=mae),open('metrics.json','w'),indent=1,default=str)
open('parts.json','w').write(json.dumps(dict(c_pnl=c_pnl,c_tot=c_tot,c_mar=c_mar,c_cat_p=c_cat_p,c_cat_s=c_cat_s,c_org=c_org,close_html=close_html,two_html=two_html,div_rows=div_rows,games_html=games_html,nm_html=nm_html)))
print('tot_err',tot_err,'winners',winners,'over',over_n,'mae',mae,'close',len(close))
