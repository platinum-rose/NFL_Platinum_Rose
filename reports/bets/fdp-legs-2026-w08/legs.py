import json,urllib.request,math,sys,concurrent.futures as cf
def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=25))
sb=get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard")
games=[]
for e in sb['events']:
    if e['status']['type']['name']!='STATUS_SCHEDULED': continue
    c=e['competitions'][0]
    t={x['homeAway']:(x['team']['abbreviation'],x['team']['id']) for x in c['competitors']}
    games.append((e['shortName'],e['date'],t))
inj=get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries")
bad={}
for t in inj['injuries']:
    for i in t['injuries']:
        if i.get('status') in ('Questionable','Doubtful','Out','Injured Reserve','Suspension'):
            bad[i['athlete']['displayName']]=i['status']
def depth(tid):
    d=get(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{tid}/depthcharts")
    out={}
    for dc in d.get('depthchart',[]):
        for pos,v in dc.get('positions',{}).items():
            a=v.get('athletes',[])
            if not a: continue
            p=pos.lower()
            if p=='qb': out.setdefault('QB',[(a[0]['id'],a[0]['displayName'])])
            elif p=='rb': out.setdefault('RB',[(a[0]['id'],a[0]['displayName'])])
            elif p=='te': out.setdefault('TE',[(a[0]['id'],a[0]['displayName'])])
            elif 'wr' in p: out.setdefault('WR',[]).append((a[0]['id'],a[0]['displayName']))
    return out
LOGS=json.load(open('logs.json'))
def gamelog(aid):
    return list(LOGS.get(str(aid),{}).values())
def _old(aid):
    d=get(f"https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{aid}/gamelog?season=2026")
    names=d.get('names') or []
    rows=[]
    for st in d.get('seasonTypes',[]):
        if 'Regular' not in st.get('displayName',''): continue
        for cat in st.get('categories',[]):
            for ev in cat.get('events',[]):
                rows.append(dict(zip(names,ev.get('stats',[]))))
    return rows
def num(x):
    try: return float(str(x).replace(',',''))
    except: return None
RUNGS={'passingYards':[150,175,200,225,250],'completions':[15,18,20],'rushingYards':[25,40,50,60,75],'receivingYards':[25,30,40,50,60],'receptions':[2,3,4,5]}
def prob(vals,r):
    n=len(vals); hits=sum(v>=r for v in vals)
    pe=(hits+1)/(n+2)
    mu=sum(vals)/n; sd=max((sum((v-mu)**2 for v in vals)/max(n-1,1))**.5, 0.25*mu+1)
    mu*=0.97
    pn=0.5*(1+math.erf((mu-(r-0.5))/(sd*2**.5)))
    return min(0.92,(pe+pn)/2),hits,n
jobs=[]
for g,dt,t in games:
    for side in ('away','home'):
        ab,tid=t[side]
        try: dp=depth(tid)
        except Exception as ex: print('depth fail',ab,ex,file=sys.stderr); continue
        for pos,lst in dp.items():
            for aid,name in lst[:2 if pos=='WR' else 1]:
                jobs.append((g,dt,ab,pos,aid,name))
res=[]
def work(j):
    g,dt,ab,pos,aid,name=j
    try: gl=gamelog(aid)
    except Exception as ex: return []
    out=[]
    stats={'QB':['passingYards','completions','rushingYards'],'RB':['rushingYards','receptions'],'WR':['receivingYards','receptions'],'TE':['receivingYards','receptions']}[pos]
    for s in stats:
        vals=[float(r.get(s,0)) for r in gl]
        if len(vals)<4: continue
        for r in RUNGS[s]:
            p,h,n=prob(vals,r)
            out.append(dict(game=g,date=dt,team=ab,pos=pos,player=name,stat=s,rung=r,p=round(p,3),hits=h,n=n,avg=round(sum(vals)/len(vals),1),status=bad.get(name,'')))
    return out
with cf.ThreadPoolExecutor(8) as ex:
    for o in ex.map(work,jobs): res+=o
json.dump(res,open(sys.argv[1],'w'),indent=1)
print(len(jobs),'players',len(res),'rungs')
