import json,collections,math,html
e=html.escape
B=json.load(open('w3burnt_c.json')); C=json.load(open('props_collapsed.json')); S=json.load(open('expert_sides.json')); D=json.load(open('cum.json'))
css=open('css_part.txt').read().replace('{{','{').replace('}}','}').replace('<title>Week 3 Post-Mortem</title>','<title>Week 3 Burn Report</title>')
css=css.replace('</style>','''.xt{border-collapse:collapse;width:100%;min-width:760px;font-size:13.5px}
.xt th{text-align:left;font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--ink2);border-bottom:2px solid var(--ink);padding:6px 8px}
.xt td{padding:7px 8px;border-bottom:1px solid var(--rule);vertical-align:top} .xt td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.verdict{font:600 11px var(--mono);padding:2px 7px;border-radius:4px;border:1px solid currentColor;white-space:nowrap}
.v-follow{color:var(--hit)} .v-fade{color:var(--miss)} .v-screen{color:var(--o1)} .v-thin{color:var(--ink3)}
.why{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,470px),1fr));gap:14px}
.wcard{background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:14px 16px;display:grid;gap:8px;align-content:start}
.wcard header{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}
.wcard h3{font-size:22px;font-weight:700} .wcard .cnt{font:600 12px var(--mono);color:var(--miss)}
.wcard p{margin:0;font-size:14px} .wcard .lesson{font-size:13.5px;color:var(--ink2);border-top:1px solid var(--rule);padding-top:8px}
.wcard .lesson b{color:var(--accent);font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.08em;margin-right:6px}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip{font:11.5px var(--mono);border:1px solid var(--rule);border-radius:4px;padding:1px 6px;background:var(--bg)}
.c-td{border-color:var(--o2)} .c-def{border-color:var(--o3)} .c-side{border-color:var(--miss)} .c-vol{border-color:var(--o1)}
.note-box{border-left:3px solid var(--o3);padding:8px 12px;background:var(--paper);font-size:13.5px;color:var(--ink2);max-width:80ch}
.cc-td{fill:var(--o2)} .cc-def{fill:var(--o3)} .cc-side{fill:var(--miss)} .cc-vol{fill:var(--o1)} .cc-eff{fill:#8a6fd6} .cc-qb{fill:var(--proj)}
</style>''')
CAUSEGRP={'TD went elsewhere':('TD went to someone else','cc-td','c-td'),"Defensive stat didn't come":('Sack / INT / tackle didn\'t happen','cc-def','c-def'),'Side lost':('Side or total lost','cc-side','c-side'),'Total went over':('Side or total lost','cc-side','c-side'),'Low target volume':('Player didn\'t get the volume','cc-vol','c-vol'),'Low carry volume':('Player didn\'t get the volume','cc-vol','c-vol'),'QB script / volume':('QB game script','cc-qb','c-vol'),'Targets there, catches not':('Volume there, production not','cc-eff','c-vol'),'Carries there, yards not':('Volume there, production not','cc-eff','c-vol')}
ORDER=['TD went to someone else','Side or total lost','Sack / INT / tackle didn\'t happen','Player didn\'t get the volume','QB game script','Volume there, production not']
CLS={v[0]:v[1] for v in CAUSEGRP.values()}
cnt=collections.Counter(CAUSEGRP[b['cause']][0] for b in B)
def hb(items,W=760,L=250,R=90):
    mx=max(v for _,v,_ in items); rh=30; H=rh*len(items)+8; pw=W-L-R
    o=[f'<svg class="chart" viewBox="0 0 {W} {H}" role="img">']
    for i,(lab,v,cls) in enumerate(items):
        y=i*rh+6; w=v/mx*pw
        o.append(f'<text class="lab" x="{L-10}" y="{y+13}" text-anchor="end">{e(lab)}</text><rect class="{cls}" x="{L}" y="{y}" width="{w:.1f}" height="18" rx="3" data-tip="{e(lab)}: {v} of {len(B)} burnt legs"/><text class="val" x="{L+w+8:.1f}" y="{y+13}">{v} · {v/len(B)*100:.0f}%</text>')
    return ''.join(o)+'</svg>'
c_cause=hb([(k,cnt[k],CLS[k]) for k in ORDER])
# per game stacked
gb=collections.defaultdict(collections.Counter)
for b in B: gb[b['game']][CAUSEGRP[b['cause']][0]]+=1
games=sorted(gb,key=lambda g:-sum(gb[g].values()))
def stack(W=760,L=110,R=60):
    rh=26; H=rh*len(games)+8; mx=max(sum(gb[g].values()) for g in games); pw=W-L-R
    o=[f'<svg class="chart" viewBox="0 0 {W} {H}" role="img">']
    for i,g in enumerate(games):
        y=i*rh+5; x=L
        o.append(f'<text class="lab" x="{L-10}" y="{y+12}" text-anchor="end">{e(g)}</text>')
        for k in ORDER:
            v=gb[g][k]
            if not v: continue
            w=v/mx*pw; o.append(f'<rect class="{CLS[k]}" x="{x:.1f}" y="{y}" width="{max(w-2,1):.1f}" height="16" rx="2" data-tip="{e(g)} · {e(k)}: {v}"/>'); x+=w
        o.append(f'<text class="val" x="{x+6:.1f}" y="{y+12}">{sum(gb[g].values())}</text>')
    return ''.join(o)+'</svg>'
c_games=stack()
legend=''.join(f'<span><i class="lg" style="background:var(--{ {"cc-td":"o2","cc-def":"o3","cc-side":"miss","cc-vol":"o1","cc-qb":"proj"}.get(CLS[k],"o1") })"></i>{e(k)}</span>' for k in ORDER if CLS[k]!='cc-eff')+'<span><i style="background:#8a6fd6"></i>Volume there, production not</span>'
WHY={
'LAR@DEN':('The script flipped at halftime, and we were stacked on the half that didn\'t happen.','LA led 16–0 at the half; Denver scored 30 after it. With Nacua out the Rams threw 55 times and gave Corum 6 carries (15 yds), so every run-first leg died. The pass-catchers we picked barely saw the ball: Terrance Ferguson 2 targets (on three tickets), Engram 2, Waddle 7 targets for 2 catches. Adams had 13 targets and 137 yards but no TD. Byron Young and Kobie Turner had no sacks, and neither Curl nor Surtain got a pick (Denver\'s pick-six was Hufanga\'s). The Unders were done by the 4th quarter.','Three tiers, two moonshots and two live SGPs all rode one read. Ferguson and Waddle appeared on multiple tiers, so one wrong script burned more than 20 legs at once.'),
'ATL@GB':('We built for a pass-rush grind; Atlanta ran the ball down Green Bay\'s throat.','ATL led 17–7 at the half and ran 41 times for 242. That killed the Green Bay pass-rush legs (Wyatt, Van Ness: ATL had only 25 dropbacks) and Penix\'s completion Over (18 on 25 attempts). It also forced Love into 53 attempts, which killed the completions Under and his rushing leg (1 carry). Bijan got 2 targets because Atlanta never needed to throw to him. London had 194 yards and no TD.','Sack legs need the other team to drop back. When our side read says a team will lead, don\'t also bet on its pass rush getting home.'),
'CIN@PIT':('The CIN defense thesis was wrong, and the Under and the Bengals legs went together.','Pittsburgh scored on its opening drive and never trailed by more than 3. Rodgers threw 34 times (36 needed) with 3 TDs, and Warren ran for 127 with Dowdle out. Freiermuth got only 4 targets. Chase Brown ran for 61 but Chase, Higgins and Gesicki caught the CIN touchdowns. The Under missed by 13.5.','CIN −3, CIN ML and the CIN/PIT Under sat on six tickets. They were one read, not three. Treat a side plus the matching total as one exposure.'),
'SEA@WSH':('A low-scoring Seattle win became a 64-point shootout.','Washington\'s pass offense against Seattle\'s depleted safeties (our own flagged counter-argument) produced 3 Mariota TDs. Seattle trailed, threw 46 times and ran 18, so Jadarian Price got 5 carries. JSN scored twice but not first (Rachaad White did). A late pick-six decided it.','When our own write-up names the counter-argument as HIGH severity, don\'t put the total on multiple tickets.'),
'ARI@SF':('The side legs lost on two missed extra points; the TD legs lost to spread-out scoring.','SF won by 6 after Pineiro missed two PATs, so SF −7, −7.5 and −8 all lost. Deebo scored the first TD on a lateral. McCaffrey scored once (2+ TD needed), and McBride had 11 targets with no TD while Kittle scored twice.','Kicker variance is real. Buying through 7 is worth more than it looks against a kicker who has been shaky.'),
'BAL@DAL':('Baltimore won on the ground, so the passing and secondary legs had nothing to feed on.','BAL threw just 20 passes and ran 38 times. That starved Andrews (5 targets, 24 yds) and left Dallas safeties Downs and Thompson with 3 tackles each. Javonte scored the first TD; Henry scored twice later. Lamar ran for 50 but didn\'t score. Dak threw for 276 and 1 TD.','Safety tackle props need the other team to throw. Against a run-first team, the linebackers get the tackles.'),
'MIN@TB':('Minnesota barely threw, and Tampa couldn\'t block.','MIN threw 29 passes and Jefferson got just 2 targets (Addison scored). Tampa was sacked 6 times, so Mayfield had 2 rushes, and Irving caught 2 of 4 targets. Dallas Turner got half a sack. TB ML lost on a punt-return TD and two late MIN field goals.','A WR receptions line assumes normal pass volume. Check the team\'s projected pass attempts, not just the player\'s share.'),
'HOU@IND':('The side hit; the running back legs died in the red zone.','Taylor had the carries (23) but only 68 yards, 4 to 5 short of the lines, and no TD because Indianapolis kicked four field goals (1 of 3 in the red zone). Tyler Warren had 10 targets and no TD.','Volume RB overs near a player\'s average are coin flips; this one missed by 5 yards.'),
'TEN@NYG':('The whole case was Winston turnovers, and he played clean.','The Giants ran 33 times and let Winston throw only 22 passes: 0 INTs, 0 TDs. Tennessee scored its only touchdown with 5:35 left.','An INT-yes leg on a QB whose team can run is a low-volume bet. Winston only threw 22 times.'),
'LV@NO':('The Saints ML and the Under lost to Raiders touchdowns and Saints turnovers.','New Orleans turned it over 4 times; Las Vegas scored the last 19 points. Jeanty got 19 carries but LV\'s TDs went to Mayer, White, Bowers and a Mike Washington run. Vele saw 6 targets and caught 3.','Our LV dog-ML read was right. The NO ML leg on the favorites parlay was a direct contradiction of it.'),
'NYJ@DET':('The Jets covered all game until the last two minutes.','Gibbs\' TD with 2:25 left made it 31–24, so NYJ +6.5 and the ML lost. Sadiq (NYJ) scored the first TD, not St. Brown. Breece Hall had 13 carries because the Jets were throwing 37 times to chase.','The +6.5 lost by half a point. Buying to +7 through the key number is worth a look on double-digit-total games.'),
'CAR@CLE':('Carolina threw 48 times and kicked four field goals.','Bryce Young had the volume (48 attempts) but one TD pass. Schwesinger made 6 tackles instead of 9+ because Carolina passed rather than running Hubbard 20 times.','Linebacker tackle props need the other team to run. 23 CAR runs capped Schwesinger.'),
'LAC@BUF':('Allen scored twice himself, so the passing leg missed.','Allen had 0 TD passes and 2 INTs but ran in two 1-yard TDs. LAC +7 lost by 8 on a late Cook TD.','Allen\'s TDs can come on the ground. A 2+ pass-TD leg for him is weaker than his 2+ total-TD leg (which hit).'),
'KC@MIA':('Miami held the ball, so Rodriguez had fewer tackle chances.','Miami ran 67 plays to KC\'s 49 and held the ball 34 minutes. Rodriguez (MIA linebacker) made 6 tackles.','Tackle volume comes from the other team\'s plays. A defense that is on the field less makes fewer tackles.'),
'NE@JAX':('Jacksonville spread the ball in a blowout.','Five red-zone trips produced five TDs to different players. Parker Washington caught 3 of 5 targets (and scored).','In a blowout, a WR3 target share gets spread out. Take the TD or yardage, not receptions.'),
}
BG={b['game'] for b in B}
wc=''
for g in games:
    t,body,lesson=WHY.get(g,('','',''))
    chips=''.join(f'<span class="chip {CAUSEGRP[b["cause"]][2]}" data-tip="{e(b["cause"])}">{e(b["label"][:38])}</span>' for b in B if b['game']==g)
    wc+=f'<article class="wcard"><header><h3>{e(g)}</h3><span class="cnt">{sum(gb[g].values())} burnt legs</span></header><p><b>{e(t)}</b></p><p>{e(body)}</p><div class="chips">{chips}</div><p class="lesson"><b>Lesson</b>{e(lesson)}</p></article>'
# ---------- experts
def wilson(w,n,z=1.645):
    if n==0: return (0,0)
    p=w/n; d=1+z*z/n; c=(p+z*z/(2*n))/d; h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d; return (c-h,c+h)
NAMES={'DanGambleAI':"Dan's AI Sports Picks",'HarryLockPicks':'Harry Lock Picks','salbets_':'Sal Bets','thejoeholkashow':'Joe Holka','CodyBrownBets':'Cody Brown Bets','SharpieMatters':'SharpieMatters','ParlayScience':'ParlayScience','NoExpertFS':'No Expert Fantasy Sports','FirstTDBets':'FirstTDBets','JoeOrrico':'Joe Orrico','GOATedAnalytics':'GOATed Analytics','Capper_Kale':'Capper_Kale','thepropdealer':'The Prop Dealer','TheDegenWeekly':'TheDegenWeekly'}
by=collections.defaultdict(list)
for p in C: by[p['h']].append(p)
# tails
import re,unicodedata
def ln(s):
    s=unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode().lower(); s=re.sub(r"[\.'’]","",s); s=re.sub(r"\b(jr|sr|ii|iii|iv)\b","",s); return s.split()[-1] if s.split() else ''
EXP=collections.defaultdict(set)
for p in C:
    k=p['key']; k='tds' if k=='atd' and (p['thr'] or 0)>=1.5 else k
    EXP[(p['week'],ln(p['player']),k,p['dir'])].add(p['h'])
tail=collections.defaultdict(lambda:[0,0]); seen=set(); mt=[0,0]; nm=[0,0]
for l in D['L']:
    if l['kind']!='prop' or l['result'] not in ('W','L'): continue
    k=l['key']; k='tds' if k=='atd' and (l['thr'] or 1)>=2 else k
    key=(l['week'],ln(l['player']),k,l['dir'])
    if (key,l['thr']) in seen: continue
    seen.add((key,l['thr'])); hs=EXP.get(key); i=0 if l['result']=='W' else 1
    if hs:
        mt[i]+=1
        for h in hs: tail[h][i]+=1
    else: nm[i]+=1
VERD={'salbets_':('Follow','follow','Positive across 3 weeks and 28 games; the best tail record for us (10–3). Only handicapper posting Unders.'),
'thejoeholkashow':('Follow for TDs','follow','Best anytime-TD picker (11 of 19). Some of his "TD" picks are first-TD calls, graded here as anytime.'),
'HarryLockPicks':('Follow on standard lines','follow','57% overall; 14 of 22 on standard lines. Anytime TDs only 11 of 27.'),
'CodyBrownBets':('Follow yardage','follow','Yardage 18–9; receptions and QB props weaker. Week 3 dipped to 5–7.'),
'DanGambleAI':('Use as a screener','screen','Mostly alt lines far below the player\'s average (34 of 47 hit). On standard lines 17 of 27. Anytime TDs 12 of 35.'),
'SharpieMatters':('Fade / ignore','fade','Anytime-TD lists only: 15 of 52 (29%), well below what those prices need.'),
'FirstTDBets':('Ignore','fade','First-TD picks 1 of 16. That is roughly the market rate for first-TD longshots, not an edge.'),
'NoExpertFS':('Ignore for now','fade','9 of 22; QB props 1 of 5.'),
'ParlayScience':('Too thin','thin','16–7, but every pick was the Week 2 TNF shootout (one game, laddered pass yards).'),
'Capper_Kale':('Too thin','thin','11–1, all on one game (Week 2 TNF) and mostly low alt lines.'),
'GOATedAnalytics':('Too thin','thin','Anytime TDs 9 of 14, one week only.'),
'JoeOrrico':('Too thin','thin','7–8 across 4 games.'),
'thepropdealer':('Too thin','thin','TD picks 4 of 9.'),'TheDegenWeekly':('Too thin','thin','3 of 9.')}
rows=[]
for h,v in by.items():
    if len(v)<8: continue
    w=sum(p['res']=='W' for p in v); n=len(v)
    std=[p for p in v if p['key'] not in ('atd','first_td','first_team_td') and p.get('cushion') is not None and p['cushion']<=0.4]
    td=[p for p in v if p['key']=='atd']
    wk=collections.Counter((p['week'],p['res']) for p in v)
    rows.append(dict(h=h,name=NAMES.get(h,h),w=w,n=n,games=len({(p['week'],p['game']) for p in v}),std=(sum(p['res']=='W' for p in std),len(std)),td=(sum(p['res']=='W' for p in td),len(td)),wk=wk,tail=tail.get(h,[0,0]),ci=wilson(w,n)))
rows.sort(key=lambda r:-r['w']/r['n'])
def ci_chart():
    W=760; L=210; R=110; rh=28; H=rh*len(rows)+40; pw=W-L-R; X=lambda v:L+v*pw
    o=[f'<svg class="chart" viewBox="0 0 {W} {H}" role="img">']
    for v in (0,.25,.5,.75,1): o.append(f'<line class="grid" x1="{X(v):.1f}" x2="{X(v):.1f}" y1="4" y2="{H-26}"/><text class="tick" x="{X(v):.1f}" y="{H-8}" text-anchor="middle">{int(v*100)}%</text>')
    o.append(f'<line class="zero" x1="{X(.5):.1f}" x2="{X(.5):.1f}" y1="4" y2="{H-26}"/>')
    for i,r in enumerate(rows):
        y=i*rh+16; p=r['w']/r['n']; lo,hi=r['ci']; col={'follow':'var(--hit)','fade':'var(--miss)','screen':'var(--o1)','thin':'var(--ink3)'}[VERD.get(r['h'],('','thin'))[1]]
        o.append(f'<text class="lab" x="{L-10}" y="{y+4}" text-anchor="end">{e(r["name"])}</text><line x1="{X(lo):.1f}" x2="{X(hi):.1f}" y1="{y}" y2="{y}" stroke="{col}" stroke-width="3" opacity=".4"/><circle cx="{X(p):.1f}" cy="{y}" r="6" fill="{col}" stroke="var(--paper)" stroke-width="2" data-tip="{e(r["name"])}: {r["w"]}–{r["n"]-r["w"]} ({p*100:.0f}%), 90% range {lo*100:.0f}–{hi*100:.0f}%"/><text class="val" x="{W-R+10}" y="{y+4}">{r["w"]}–{r["n"]-r["w"]} · {p*100:.0f}%</text>')
    return ''.join(o)+'</svg>'
c_exp=ci_chart()
def f(t): return f'{t[0]}/{t[1]}' if t[1] else '—'
xrows=''.join(f'<tr><td><b>{e(r["name"])}</b><br><span class="mono" style="color:var(--ink3)">@{e(r["h"])}</span></td><td class="num">{r["w"]}–{r["n"]-r["w"]}<br>{r["w"]/r["n"]*100:.0f}%</td><td class="num">{r["games"]}</td><td class="num">{f(r["std"])}</td><td class="num">{f(r["td"])}</td><td class="num">'+' · '.join(f'W{x} {r["wk"][(x,"W")]}–{r["wk"][(x,"L")]}' for x in (1,2,3) if r["wk"][(x,"W")]+r["wk"][(x,"L")])+f'</td><td class="num">{r["tail"][0]}–{r["tail"][1]}</td><td><span class="verdict v-{VERD.get(r["h"],("","thin"))[1]}">{e(VERD.get(r["h"],("Too thin","thin"))[0])}</span><br><span style="font-size:12.5px;color:var(--ink2)">{e(VERD.get(r["h"],("",""," "))[2] if r["h"] in VERD else "")}</span></td></tr>' for r in rows)
# sides
sb=collections.defaultdict(list)
for s in S:
    if s['res'] in ('W','L'): sb[s['h']].append(s)
SN={'lockandcash':'Lock & Cash Sports (Twitter)','Covers':'Covers (Twitter)','refereeinsider':'Daily Ref (Twitter)','CodyBrownBets':'Cody Brown Bets (Twitter)','JudgmentParlays':'JudgmentParlays (Twitter)','HarryLockPicks':'Harry Lock Picks (Twitter)','jaredsmithbets':'Jared Smith (Twitter)','gavinmchughh':'Gavin McHugh (Twitter)','VSiNLive':'VSiN (Twitter)','RossTuckerPod':'Ross Tucker (Twitter)','BettingPros':'BettingPros (podcast)','Sharp or Square':'Sharp or Square (podcast)','Even Money':'Even Money (podcast)','Action Network':'Action Network (podcast)','Brandon Anderson':'Brandon Anderson (YouTube)','Simon Hunter':'Simon Hunter (YouTube)','Chad Millman':'Chad Millman (YouTube)'}
srows=sorted([(h,v) for h,v in sb.items() if len(v)>=5],key=lambda x:-sum(s['res']=='W' for s in x[1])/len(x[1]))
srows_html=''.join(f'<tr><td>{e(SN.get(h,h))}</td><td class="num">{sum(s["res"]=="W" for s in v)}–{sum(s["res"]=="L" for s in v)}</td><td class="num">{sum(s["res"]=="W" for s in v)/len(v)*100:.0f}%</td><td class="num">{", ".join(f"W{w}" for w in sorted({s["week"] for s in v}))}</td></tr>' for h,v in srows)
allside=[s for v in sb.values() for s in v]
json.dump(dict(css=css,c_cause=c_cause,c_games=c_games,legend=legend,wc=wc,c_exp=c_exp,xrows=xrows,srows=srows_html,mt=mt,nm=nm,nB=len(B),cnt=cnt,nsides=len(allside),wsides=sum(s['res']=='W' for s in allside),nprops=len(C),wprops=sum(p['res']=='W' for p in C),nh=len(by)),open('parts.json','w'))
print(cnt, mt, nm, len(allside), sum(s['res']=='W' for s in allside), len(C), sum(p['res']=='W' for p in C))
