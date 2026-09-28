import json, re, os, unicodedata
H=os.path.expanduser('~')
WEEK=os.environ.get('WEEK','3')
G=json.load(open(H+f'/scratch/w{WEEK}games.json'))
def norm(s):
    s=unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode().lower()
    s=re.sub(r"[\.'’]","",s); s=re.sub(r"\b(jr|sr|ii|iii|iv)\b","",s); s=re.sub(r"[^a-z ]"," ",s)
    return ' '.join(s.split())
FIX={'WAS':'WSH','LA':'LAR'}
def gkey(a,h): return (FIX.get(a,a),FIX.get(h,h))
GAMES={gkey(g['away'],g['home']):g for g in G}
TEAMS={}
NICK={'falcons':'ATL','packers':'GB','bengals':'CIN','steelers':'PIT','ravens':'BAL','cowboys':'DAL','eagles':'PHI','bears':'CHI','saints':'NO','raiders':'LV','jaguars':'JAX','patriots':'NE','rams':'LAR','broncos':'DEN','panthers':'CAR','browns':'CLE','seahawks':'SEA','commanders':'WSH','lions':'DET','jets':'NYJ','bills':'BUF','chargers':'LAC','49ers':'SF','cardinals':'ARI','titans':'TEN','giants':'NYG','colts':'IND','texans':'HOU','buccaneers':'TB','vikings':'MIN','chiefs':'KC','dolphins':'MIA'}
def team_of(txt):
    t=txt.lower()
    for k,v in NICK.items():
        if k in t: return v
    m=re.match(r'\s*([A-Z]{2,3})\b',txt)
    return FIX.get(m.group(1),m.group(1)) if m else None
def game_for_team(t):
    for k,g in GAMES.items():
        if t in k: return g
def game_by_str(s):
    m=re.match(r'\s*([A-Z]{2,3})\s*@\s*([A-Z]{2,3})',s or '')
    if not m: return None
    return GAMES.get(gkey(m.group(1),m.group(2)))
def num(x):
    try: return float(x)
    except: return 0.0
def find_player(name, g=None):
    n=norm(name); pools=[g] if g else G
    best=None
    for gg in pools:
        for pn,p in gg['players'].items():
            pnn=norm(pn)
            if pnn==n: return gg,pn,p
            a=n.split(); b=pnn.split()
            if a and b and a[-1]==b[-1] and (a[0]==b[0] or a[0][0]==b[0][0]): best=(gg,pn,p)
    return best if best else (g,None,None)
def scorer(text):
    m0=re.search(r"lateral to (.+?) for \d+",text)
    if m0: return m0.group(1).strip()
    m=re.match(r"(.+?)\s+\d+\s+Yd",text) or re.match(r"(.+?)\s+(?:Safety|Fumble|Blocked)",text)
    return m.group(1).strip() if m else None
def td_list(g):
    out=[]
    for s_ in g['scoring']:
        if 'Field Goal' in s_['type'] or 'Safety' in s_['type']: continue
        sc=scorer(s_['text'])
        if sc: out.append((sc,s_))
    return out
def stat(p, key, g, pname):
    P=p or {}
    pa=P.get('passing',{}); ru=P.get('rushing',{}); re_=P.get('receiving',{}); de=P.get('defensive',{}); it=P.get('interceptions',{})
    ca=(pa.get('C/ATT') or '0/0').split('/')
    if key=='completions': return num(ca[0])
    if key=='pass_att': return num(ca[1])
    if key=='pass_yds': return num(pa.get('YDS'))
    if key=='pass_td': return num(pa.get('TD'))
    if key=='int_thrown': return num(pa.get('INT'))
    if key=='rush_yds': return num(ru.get('YDS'))
    if key=='carries': return num(ru.get('CAR'))
    if key=='rec': return num(re_.get('REC'))
    if key=='rec_yds': return num(re_.get('YDS'))
    if key=='sacks': return num(de.get('SACKS'))
    if key=='tackles': return num(de.get('TOT'))
    if key=='def_int': return num(it.get('INT'))
    if key=='fgm': return num((P.get('kicking',{}).get('FG') or '0/0').split('/')[0])
    if key in ('atd','tds'):
        return float(sum(1 for sc,_ in td_list(g) if norm(sc)==norm(pname) or (norm(sc).split()[-1]==norm(pname).split()[-1] and norm(sc)[0]==norm(pname)[0])))
    raise KeyError(key)
def first_td(g):
    t=td_list(g); return t[0][0] if t else None
def grade_prop(player,key,thr,dirn,gamestr=None):
    g=game_by_str(gamestr) if gamestr else None
    g2,pn,p=find_player(player,g)
    g=g or g2
    if g is None: return dict(result='pending',actual=None,note='no game')
    if key=='first_td':
        f=first_td(g); hit = f is not None and (norm(f)==norm(player) or norm(f).split()[-1]==norm(player).split()[-1] and norm(f)[0]==norm(player)[0])
        return dict(result='W' if hit else 'L',actual=f,margin=None,game=f"{g['away']}@{g['home']}",pname=pn)
    if pn is None and key not in ('atd','tds'):
        return dict(result='L',actual=0,margin=None if thr is None else (0-thr if dirn=='over' else thr-0),game=f"{g['away']}@{g['home']}",pname=None,note='no box line (DNP/0)')
    a=stat(p,key,g,pn or player)
    if dirn=='over': hit=a>=thr; margin=a-thr
    else: hit=a<thr; margin=thr-a  # thr is the under line (e.g. 19.5 -> a<19.5)
    return dict(result='W' if hit else 'L',actual=a,margin=margin,game=f"{g['away']}@{g['home']}",pname=pn)
def final(g): return int(g['away_score']),int(g['home_score'])
def grade_side(kind,team,line,gamestr=None,dirn=None,total=None):
    team=FIX.get(team,team) if team else team
    g=game_by_str(gamestr) if gamestr else game_for_team(team)
    if g is None: return dict(result='pending',actual=None)
    a,h=final(g); A,Hm=g['away'],g['home']
    if kind in ('total',):
        t=a+h
        if dirn=='under': r='W' if t<line else ('P' if t==line else 'L'); m=line-t
        else: r='W' if t>line else ('P' if t==line else 'L'); m=t-line
        return dict(result=r,actual=f"total {t}",margin=m,game=f"{A}@{Hm}")
    if kind=='team_total':
        s=a if team==A else h
        r='W' if (s<line if dirn=='under' else s>line) else 'L'; m=(line-s) if dirn=='under' else s-line
        return dict(result=r,actual=f"{team} {s}",margin=m,game=f"{A}@{Hm}")
    mine,opp=(a,h) if team==A else (h,a)
    diff=mine-opp
    if kind=='ml': return dict(result='W' if diff>0 else 'L',actual=f"{team} {mine}-{opp}",margin=diff,game=f"{A}@{Hm}")
    v=diff+line
    return dict(result='W' if v>0 else ('P' if v==0 else 'L'),actual=f"{team} {mine}-{opp}",margin=v,game=f"{A}@{Hm}")
