import json,sys,os,re
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from grade import *
from parse_placed import w3,parse_leg,grade_spec
WEEK=os.environ.get('WEEK','3')
if WEEK=='3':
    from ai_recs import AI
else:
    AI=__import__(f'ai_recs_w{WEEK}').AI
def pkey(s):
    if s['kind']=='prop':
        k=s['key']
        if k=='atd' and (s.get('thr') or 1)>=2: k='tds'
        return ('prop',norm(s['player']).split()[-1],norm(s['player'])[0],k,s['dir'])
    g=game_by_str(s['game']); gk=(g['away'],g['home']) if g else s['game']
    if s['kind'] in('ml','spread'): return ('side',gk,s['team'])
    if s['kind']=='total': return ('total',gk,s['dir'])
    if s['kind']=='team_total': return ('tt',gk,s['team'],s['dir'])
    return ('x',s['kind'])
QBRUSH={'Jordan Love','Tyler Shough','Lamar Jackson','Baker Mayfield','Jalen Hurts','Josh Allen','Brock Purdy','Drake Maye','Jaxson Dart','Malik Willis'}
def category(s):
    if s['kind']=='ml': return 'Moneyline'
    if s['kind']=='spread': return 'Spread (fav)' if s['line']<0 else 'Spread (dog)'
    if s['kind']=='total': return 'Total Under' if s.get('dir')=='under' else 'Total Over'
    if s['kind']=='team_total': return 'Team total'
    if s['kind']=='half_total': return 'Total Under'
    if s['kind']=='cfb': return 'College (CFB)'
    if s['kind']=='dst_td': return 'D/ST TD'
    k=s['key']
    if k=='atd' and (s.get('thr') or 1)>=2: k='tds'
    if k=='rush_yds' and s['player'] in QBRUSH: return 'QB rushing yds'
    return {'rush_yds':'Rushing yds','carries':'Carries','rec':'Receptions','rec_yds':'Receiving yds','pass_td':'Passing TDs','pass_yds':'QB volume','pass_att':'QB volume','completions':'QB volume','int_thrown':'QB INT thrown','sacks':'Sacks','tackles':'Tackles+Ast','def_int':'Defensive INT','atd':'Anytime TD','tds':'2+ TD','first_td':'First TD','fgm':'Kicker FGs','kicking_points':'Kicker points'}[k]
GROUP={'College (CFB)':'Sides & totals','Moneyline':'Sides & totals','Spread (fav)':'Sides & totals','Spread (dog)':'Sides & totals','Total Under':'Sides & totals','Total Over':'Sides & totals','Team total':'Sides & totals'}
AIK={}
for a in AI: AIK.setdefault(pkey(a),[]).append(a)
tickets=[];legs=[];matched=set()
for w in w3:
    tl=[]
    for l in w.get('legs') or []:
        s=parse_leg(l)
        if not s: continue
        r=grade_spec(s); k=pkey(s)
        origin='agree' if k in AIK else 'andy'
        if origin=='agree': matched.add(k)
        cat=category(s)
        leg=dict(ticket=w['id'],label=s['label'],game=r.get('game') or s['game'],kind=s['kind'],player=s.get('player'),key=s.get('key'),thr=s.get('thr',s.get('line')),dir=s.get('dir'),result=r['result'],actual=r.get('actual'),margin=r.get('margin'),cat=cat,group=GROUP.get(cat,'Player props'),origin=origin,ai_src=[a['src'] for a in AIK.get(k,[])],pkey=list(map(str,k)),placed=True)
        tl.append(leg);legs.append(leg)
    stake=w.get('stake_usd') or 0
    tickets.append(dict(id=w['id'],num=w.get('ticket_number'),book=w['book'],type=w.get('ticket_type'),title=w.get('game_title'),stake=stake,funding=w.get('funding_type'),odds=w.get('odds_american'),to_win=w.get('potential_profit_usd'),placed_at=w.get('placed_at'),legs=tl))
# AI-only
ai_only=[]
for a in AI:
    k=pkey(a)
    if k in matched: continue
    r=grade_spec(a) if a['kind']!='half_total' else None
    cat=category(a)
    ai_only.append(dict(label=a['label'],src=a['src'],game=r.get('game') or a['game'],kind=a['kind'],player=a.get('player'),key=a.get('key'),thr=a.get('thr',a.get('line')),dir=a.get('dir'),result=r['result'],actual=r.get('actual'),margin=r.get('margin'),cat=cat,group=GROUP.get(cat,'Player props'),origin='ai_only',pkey=list(map(str,k))))
if WEEK=='3':
  g=GAMES[('LAR','DEN')];   h1=sum(int(x) for x in g['away_ls'][:2])+sum(int(x) for x in g['home_ls'][:2])
  ai_only.append(dict(label='LAR@DEN 1st half Under 22.5',src='SNF T3 (dropped by Andy, D11)',game='LAR@DEN',kind='half_total',thr=22.5,dir='under',result='W' if h1<22.5 else 'L',actual=f'1H total {h1}',margin=22.5-h1,cat='Total Under',group='Sides & totals',origin='ai_only',pkey=['half','LAR@DEN']))
json.dump(dict(tickets=tickets,legs=legs,ai_only=ai_only),open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..',f'w{WEEK}legs.json'),'w'),default=str,indent=1)
import collections
print('placed legs',len(legs),'ai_only',len(ai_only))
c=collections.Counter((l['origin'],l['result']) for l in legs); print(c)
c=collections.Counter(l['result'] for l in ai_only); print('ai_only',c)
for a in ai_only: print(f"  {a['result']:7} {a['cat']:16} {a['label'][:45]:45} act={a['actual']} [{a['src']}]")
