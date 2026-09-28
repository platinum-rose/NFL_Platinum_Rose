import json,os,re,sys,importlib.util,collections,datetime as dt
H=os.path.expanduser('~'); sys.path.insert(0,H+'/scratch')
MODS={}
for w in (1,2,3):
    os.environ['WEEK']=str(w)
    spec=importlib.util.spec_from_file_location(f'g{w}',H+'/scratch/grade.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); MODS[w]=m
def piso(x):
    x=re.sub(r'\.\d+','',x.replace('Z','+00:00'))
    return dt.datetime.fromisoformat(x)
def kick(g): return dt.datetime.fromisoformat(g['date'].replace('Z','+00:00'))
def tweet_time(ref,cap):
    m=re.search(r'status/(\d{15,})',ref or '')
    if m: return dt.datetime.fromtimestamp(((int(m.group(1))>>22)+1288834974657)/1000,dt.timezone.utc)
    return piso(cap)
norm=MODS[1].norm
PIDX=collections.defaultdict(list)  # norm name -> (week, game, pname)
for w,m in MODS.items():
    for g in m.G:
        for pn,p in g['players'].items(): PIDX[norm(pn)].append((w,g,pn,p))
def find_player(name,t):
    n=norm(name); c=PIDX.get(n)
    if not c:
        parts=n.split()
        if not parts: return None
        c=[x for k,v in PIDX.items() for x in v if k.split()[-1]==parts[-1] and k[0]==n[0]]
    c=[x for x in c if kick(x[1])>t and (kick(x[1])-t).days<8]
    return min(c,key=lambda x:kick(x[1])) if c else None
MK={'touchdowns':'atd','anytime td':'atd','anytime touchdown':'atd','first td':'first_td','first touchdown':'first_td','first touchdown scorer':'first_td','first team touchdown':'first_team_td','receptions':'rec','receiving_yards':'rec_yds','receiving yards':'rec_yds','rushing_yards':'rush_yds','rushing yards':'rush_yds','passing_yards':'pass_yds','passing yards':'pass_yds','rush attempts':'carries','rushing attempts':'carries','rushing_attempts':'carries','passing touchdowns':'pass_td','passing tds':'pass_td','interceptions':'int','passing_attempts':'pass_att','pass attempts':'pass_att','pass_attempts':'pass_att','completions':'completions','passing_completions':'completions','rushing_receiving_yards':'rr','rushing_plus_receiving_yards':'rr','rush + rec yards':'rr','rushing + receiving yards':'rr','field goals made':'fgm','longest reception':'long_rec','pass + rush yards':'pr','passing + rushing yards':'pr'}
def num(x):
    try: return float(x)
    except: return 0.0
def stat(key,p,g,pn,m):
    if key=='rr': return num(p.get('rushing',{}).get('YDS'))+num(p.get('receiving',{}).get('YDS'))
    if key=='pr': return num(p.get('rushing',{}).get('YDS'))+num(p.get('passing',{}).get('YDS'))
    if key=='long_rec': return num(p.get('receiving',{}).get('LONG'))
    if key=='int': key='int_thrown' if 'passing' in p else 'def_int'
    return m.stat(p,key,g,pn)
def grade_prop(name,market,lean,t):
    key=MK.get(market.strip().lower())
    if not key: return None
    f=find_player(name,t)
    if not f: return dict(res='nogame')
    w,g,pn,p=f; m=MODS[w]
    if w==3 and g['home']=='CHI': return dict(res='pending')
    L=(lean or '').upper()
    mm=re.search(r'(OVER|UNDER)\s*([\d.]+)',L)
    d='under' if 'UNDER' in L else 'over'; thr=float(mm.group(2)) if mm else 0.5
    if key in ('first_td','first_team_td'):
        if key=='first_team_td':
            tds=[sc for sc,s in m.td_list(g) if s['team']==p['team']]
            hit=bool(tds) and norm(tds[0]).split()[-1]==norm(pn).split()[-1]
        else:
            f1=m.first_td(g); hit=bool(f1) and norm(f1)==norm(pn)
        return dict(res='W' if hit else 'L',week=w,game=f"{g['away']}@{g['home']}",player=pn,key=key,thr=None,dir='over',actual=None,team=p['team'])
    a=stat(key,p,g,pn,m)
    hit=(a>thr) if d=='over' else (a<thr)
    if abs(a-thr)<1e-9 and thr==int(thr): return dict(res='P',week=w,game=f"{g['away']}@{g['home']}",player=pn,key=key,thr=thr,dir=d,actual=a,team=p['team'])
    return dict(res='W' if hit else 'L',week=w,game=f"{g['away']}@{g['home']}",player=pn,key=key,thr=thr,dir=d,actual=a,team=p['team'])
d=json.load(open(os.path.expanduser('~/mnt/dev/projects/NFL_Dashboard/data/generated/master-intel/w01-pull.json')))
out=[];seen=set()
for s in d['signals']:
    if 'Twitter' not in s['source'] or s['bet_type'] not in ('player_prop','parlay_leg'): continue
    tm=s['team_or_market'] or ''
    if ' - ' not in tm: continue
    name,market=tm.rsplit(' - ',1)
    mh=re.search(r'x\.com/([^/]+)/status',s['event_ref'] or ''); h=mh.group(1) if mh else (s['author'] or '?')
    t=tweet_time(s['event_ref'],s['captured_at'])
    r=grade_prop(name,market,s['lean'],t)
    if not r or r['res'] in ('nogame','pending'): continue
    k=(h.lower(),r['week'],r['player'],r['key'],r['dir'],r['thr'])
    if k in seen: continue
    seen.add(k)
    out.append(dict(handle=h,author=s['author'],bet_type=s['bet_type'],market=market,lean=s['lean'],tweet=s['event_ref'],t=t.isoformat(),**r))
json.dump(out,open(H+'/scratch/expert_props.json','w'),default=str,indent=0)
c=collections.defaultdict(lambda:[0,0,0])
for o in out: c[o['handle'].lower()][{'W':0,'L':1,'P':2}[o['res']]]+=1
print(len(out))
for h,(w,l,p) in sorted(c.items(),key=lambda x:-(x[1][0]+x[1][1])):
    if w+l>=4: print(f'{h:18} {w:3}-{l:<3} {w/(w+l)*100:4.0f}%')

# ---------- normalize handles, difficulty, sides
AUTH={'harry lock picks':'HarryLockPicks','harrylockpicks':'HarryLockPicks','dan’s ai sports picks':'DanGambleAI',"dan's ai sports picks":'DanGambleAI','dangambleai':'DanGambleAI','sal bets':'salbets_','salbets_':'salbets_','joe holka':'thejoeholkashow','thejoeholkashow':'thejoeholkashow','cody brown bets':'CodyBrownBets','codybrownbets':'CodyBrownBets','the prop dealer':'thepropdealer','thepropdealer':'thepropdealer','no expert fantasy sports':'NoExpertFS','noexpertfs':'NoExpertFS','firsttdbets':'FirstTDBets','joeorrico':'JoeOrrico','joe orrico':'JoeOrrico'}
for o in out:
    o['h']=AUTH.get(o['handle'].lower(),AUTH.get((o['author'] or '').lower(),o['handle']))
# leave-one-out baseline
def val(key,p,g,pn,w):
    try: return stat(key,p,g,pn,MODS[w])
    except Exception: return None
for o in out:
    o['cushion']=None
    if o['key'] in ('atd','first_td','first_team_td') or o['thr'] is None: continue
    others=[x for x in PIDX.get(norm(o['player']),[]) if x[0]!=o['week']]
    vs=[val(o['key'],x[3],x[1],x[2],x[0]) for x in others]; vs=[v for v in vs if v is not None]
    if vs:
        avg=sum(vs)/len(vs); o['base']=avg
        o['cushion']=(avg-o['thr'])/max(avg,1) if o['dir']=='over' else (o['thr']-avg)/max(o['thr'],1)
json.dump(out,open(H+'/scratch/expert_props.json','w'),default=str,indent=0)
# sides from twitter
TEAMS=MODS[1].NICK
def team_in(txt):
    t=(txt or '').lower()
    for k,v in TEAMS.items():
        if re.search(r'\b'+re.escape(k)+r'\b',t): return v
    m=re.search(r'\b([A-Z]{2,3})\b',txt or '')
    return m.group(1) if m else None
def next_game(team,t):
    c=[]
    for w,m in MODS.items():
        for g in m.G:
            if team in (g['away'],g['home']) and kick(g)>t and (kick(g)-t).days<8: c.append((w,g))
    return min(c,key=lambda x:kick(x[1])) if c else None
sides=[];seen=set()
for s in d['signals']:
    if 'Twitter' not in s['source'] or s['bet_type'] not in ('spread','moneyline','spread_or_ml','total'): continue
    mh=re.search(r'x\.com/([^/]+)/status',s['event_ref'] or ''); h=mh.group(1) if mh else (s['author'] or '?')
    h=AUTH.get(h.lower(),h); t=tweet_time(s['event_ref'],s['captured_at'])
    lean=s['lean'] or ''; tm=s['team_or_market'] or ''
    if s['bet_type']=='total':
        mm=re.search(r'\b(O|U|OVER|UNDER)\s*([\d.]+)',lean.upper())
        if not mm: continue
        teams=[v for k,v in TEAMS.items() if re.search(r'\b'+k+r'\b',tm.lower())]
        if not teams: continue
        ng=next_game(teams[0],t)
        if not ng: continue
        w,g=ng
        if w==3 and g['home']=='CHI': continue
        tot=int(g['away_score'])+int(g['home_score']); line=float(mm.group(2)); dr='under' if mm.group(1).startswith('U') else 'over'
        res='P' if tot==line else ('W' if (tot<line)==(dr=='under') else 'L')
        if line>80: continue
        lab=f"{g['away']}@{g['home']} {dr} {line}"
    else:
        team=team_in(tm) or team_in(lean)
        if not team: continue
        team=MODS[1].FIX.get(team,team)
        ng=next_game(team,t)
        if not ng: continue
        w,g=ng
        if w==3 and g['home']=='CHI': continue
        a,hh=int(g['away_score']),int(g['home_score']); mine,opp=(a,hh) if team==g['away'] else (hh,a)
        mm=re.search(r'([+-]?\d+(?:\.\d+)?)(?!\d*\))',re.sub(r'\([^)]*\)','',lean))
        if s['bet_type']=='moneyline' or not mm:
            res='W' if mine>opp else 'L'; lab=f'{team} ML'
        else:
            line=float(mm.group(1))
            if abs(line)>25: continue
            v=mine-opp+line; res='W' if v>0 else ('P' if v==0 else 'L'); lab=f'{team} {line:+g}'
    k=(h.lower(),w,lab)
    if k in seen: continue
    seen.add(k); sides.append(dict(h=h,week=w,label=lab,res=res,tweet=s['event_ref'],bet_type=s['bet_type']))
# podcast / article experts (user_picks EXPERT)
for e in d['expert']:
    t=piso(e['created_at'])
    team=team_in(e['visitor']); home=team_in(e['home'])
    if not team: continue
    ng=next_game(MODS[1].FIX.get(team,team),t)
    if not ng: continue
    w,g=ng
    if w==3 and g['home']=='CHI': continue
    a,hh=int(g['away_score']),int(g['home_score'])
    pt=(e['pick_type'] or '').lower(); sel=e['selection'] or ''; line=e['line']
    if 'total' in pt or re.match(r'(?i)^(over|under)',sel):
        if line is None: continue
        tot=a+hh; dr='under' if 'under' in sel.lower() else 'over'; res='P' if tot==line else ('W' if (tot<line)==(dr=='under') else 'L'); lab=f"{g['away']}@{g['home']} {dr} {line}"
    else:
        st=team_in(sel)
        if not st: continue
        st=MODS[1].FIX.get(st,st)
        if st not in (g['away'],g['home']): continue
        mine,opp=(a,hh) if st==g['away'] else (hh,a)
        if 'money' in pt or line is None: res='W' if mine>opp else 'L'; lab=f'{st} ML'
        else: v=mine-opp+float(line); res='W' if v>0 else ('P' if v==0 else 'L'); lab=f'{st} {float(line):+g}'
    k=(e['expert'],w,lab)
    if k in seen: continue
    seen.add(k); sides.append(dict(h=e['expert'],week=w,label=lab,res=res,src='podcast/article',bet_type=pt))
json.dump(sides,open(H+'/scratch/expert_sides.json','w'),default=str,indent=0)
c=collections.defaultdict(lambda:[0,0,0])
for o in sides: c[o['h']][{'W':0,'L':1,'P':2}[o['res']]]+=1
print('SIDES',len(sides))
for h,(w,l,p) in sorted(c.items(),key=lambda x:-(x[1][0]+x[1][1])):
    if w+l>=3: print(f'  {h:34} {w:3}-{l:<3}-{p} {w/(w+l)*100:4.0f}%')
c=collections.defaultdict(lambda:[0,0])
for o in out:
    if o['res'] in 'WL': c[o['h']][0 if o['res']=='W' else 1]+=1
print('PROPS')
for h,(w,l) in sorted(c.items(),key=lambda x:-(x[1][0]+x[1][1])):
    if w+l>=5: print(f'  {h:20} {w:3}-{l:<3} {w/(w+l)*100:4.0f}%')
