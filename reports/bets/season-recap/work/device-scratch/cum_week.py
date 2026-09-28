import json,os,sys
sys.path.insert(0,os.path.expanduser('~/scratch'))
from grade import *
from parse_placed import w3,parse_leg,grade_spec
WEEK=os.environ['WEEK']
out=[]
for w in w3:
    tl=[]
    for l in w.get('legs') or []:
        s=parse_leg(l)
        if not s: continue
        r=grade_spec(s)
        team=None; won=None
        if s['kind']=='prop':
            g=game_by_str(s['game']) if s['game'] else None
            g2,pn,p=find_player(s['player'],g)
            g=g or g2
            if p: team=p['team']
            elif l.get('team'): team=FIX.get(l['team'],l['team'])
            if g and team:
                a,h=int(g['away_score']),int(g['home_score'])
                won = (a>h) if team==g['away'] else (h>a) if team==g['home'] else None
        tl.append(dict(label=s['label'],kind=s['kind'],key=s.get('key'),player=s.get('player'),team=s.get('team') or team,thr=s.get('thr',s.get('line')),dir=s.get('dir'),result=r['result'],actual=r.get('actual'),margin=r.get('margin'),game=r.get('game') or s.get('game'),price=l.get('price'),team_won=won))
    out.append(dict(week=int(WEEK),id=w['id'],num=w.get('ticket_number'),book=w['book'],type=w.get('ticket_type'),title=w.get('game_title'),stake=w.get('stake_usd'),funding=w.get('funding_type'),odds=w.get('odds_american'),placed_at=w.get('placed_at'),legs=tl))
json.dump(out,open(f'cum_w{WEEK}.json','w'),default=str)
print(WEEK,len(out),sum(len(t['legs']) for t in out))
