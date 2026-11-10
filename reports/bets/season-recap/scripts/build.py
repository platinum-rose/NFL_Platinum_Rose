import json,sys,os,re
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from grade import *
from parse_placed import w3,parse_leg,grade_spec
from ai_record import load_ai  # 2026-11-04: JSON AI record (data/official-picks/ai-proposals/2026-wNN.json); falls back to ai_recs_wN.py
WEEK=os.environ.get('WEEK','3')
_LIB=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','analysis','season','claude','scripts')
if _LIB not in sys.path: sys.path.append(_LIB)
import lib as _lib  # ticket family / cash flags for the scorecard
AI=load_ai(WEEK)
STORED={'WON':'W','LOST':'L','PUSH':'P'}
AI_FROM_PAPER=False
if not AI:  # 2026-11-04: no JSON record and no ai_recs_wN.py (W5-W7 backfill): the week's paper tickets are the AI proposals on record
    _pw=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..','data','official-picks','paper-wagers-2026.json')))
    for _p in _pw:
        if str(_p.get('week'))!=WEEK: continue
        for _l in _p.get('legs') or []:
            try: _s=parse_leg(_l)
            except Exception: _s=None
            if _s and _s['kind'] in ('prop','ml','spread','total','team_total') and not (_s['kind']=='prop' and _s.get('key') is None):
                AI.append(dict(_s,src=(_p.get('game_title') or _p['id']).replace('AI paper: ','')[:60])); AI_FROM_PAPER=True
def safe_grade(s,l=None):
    """grade_spec, falling back to the ledger's settled leg status for markets neither grader handles (teasers, cross-week SGP legs)."""
    try: r=grade_spec(s)
    except Exception as ex: r=dict(result='pending',actual=None,note=f'grader error: {ex}')
    if r.get('result') not in ('W','L','P') and l is not None and STORED.get((l.get('status') or '').upper()):
        r=dict(r,result=STORED[l['status'].upper()],actual=r.get('actual') if r.get('actual') is not None else l.get('actual_stat'),note='stored status (grader cannot grade this market)')
    return r
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
    if s['kind']=='team_count': return 'Team total'
    k=s['key']
    if k=='atd' and (s.get('thr') or 1)>=2: k='tds'
    if k=='rush_yds' and s['player'] in QBRUSH: return 'QB rushing yds'
    return {'rush_yds':'Rushing yds','rush_rec_yds':'Rush+rec yds','carries':'Carries','rec':'Receptions','rec_yds':'Receiving yds','pass_td':'Passing TDs','pass_yds':'QB volume','pass_att':'QB volume','completions':'QB volume','int_thrown':'QB INT thrown','sacks':'Sacks','tackles':'Tackles+Ast','def_int':'Defensive INT','atd':'Anytime TD','tds':'2+ TD','first_td':'First TD','fgm':'Kicker FGs','kicking_points':'Kicker points'}.get(k,'Other')
GROUP={'College (CFB)':'Sides & totals','Moneyline':'Sides & totals','Spread (fav)':'Sides & totals','Spread (dog)':'Sides & totals','Total Under':'Sides & totals','Total Over':'Sides & totals','Team total':'Sides & totals'}
AIK={}
for a in AI: AIK.setdefault(pkey(a),[]).append(a)
tickets=[];legs=[];matched=set()
for w in w3:
    tl=[]
    for l in w.get('legs') or []:
        try: s=parse_leg(l)
        except Exception: s=dict(kind='other',label=l.get('selection') or '',game=l.get('game') or '')  # 2026-11-04: unparseable exotic leg
        if not s: continue
        r=safe_grade(s,l) if s['kind']!='other' else dict(result=STORED.get((l.get('status') or '').upper(),'pending'),actual=l.get('actual_stat'),note='stored status')
        k=pkey(s) if s['kind']!='other' else ('x','other',s['label'])
        origin='agree' if k in AIK else 'andy'
        if origin=='agree': matched.add(k)
        cat=category(s) if s['kind']!='other' else 'Other'
        leg=dict(ticket=w['id'],label=s['label'],game=r.get('game') or s['game'],kind=s['kind'],player=s.get('player'),key=s.get('key'),thr=s.get('thr',s.get('line')),dir=s.get('dir'),result=r['result'],actual=r.get('actual'),margin=r.get('margin'),cat=cat,group=GROUP.get(cat,'Player props'),origin=origin,ai_src=[a['src'] for a in AIK.get(k,[])],pkey=list(map(str,k)),placed=True,note=r.get('note'))
        tl.append(leg);legs.append(leg)
    stake=w.get('stake_usd') or 0
    tickets.append(dict(id=w['id'],num=w.get('ticket_number'),book=w['book'],type=w.get('ticket_type'),title=w.get('game_title'),stake=stake,funding=w.get('funding_type'),odds=w.get('odds_american'),to_win=w.get('potential_profit_usd'),placed_at=w.get('placed_at'),
                        result=w.get('result'),status=w.get('status'),cash=_lib.is_cash(w),family=_lib.family(w),returned=_lib.cash_return(w) if _lib.is_cash(w) else _lib.credit_return(w),legs=tl))
# AI-only
ai_only=[]
for a in AI:
    k=pkey(a)
    if k in matched: continue
    r=safe_grade(a) if a['kind']!='half_total' else None
    cat=category(a)
    ai_only.append(dict(label=a['label'],src=a['src'],game=r.get('game') or a['game'],kind=a['kind'],player=a.get('player'),key=a.get('key'),thr=a.get('thr',a.get('line')),dir=a.get('dir'),result=r['result'],actual=r.get('actual'),margin=r.get('margin'),cat=cat,group=GROUP.get(cat,'Player props'),origin='ai_only',pkey=list(map(str,k))))
if WEEK=='3':
  g=GAMES[('LAR','DEN')];   h1=sum(int(x) for x in g['away_ls'][:2])+sum(int(x) for x in g['home_ls'][:2])
  ai_only.append(dict(label='LAR@DEN 1st half Under 22.5',src='SNF T3 (dropped by Andy, D11)',game='LAR@DEN',kind='half_total',thr=22.5,dir='under',result='W' if h1<22.5 else 'L',actual=f'1H total {h1}',margin=22.5-h1,cat='Total Under',group='Sides & totals',origin='ai_only',pkey=['half','LAR@DEN']))
_out=os.environ.get('LEGS_OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)),'..',f'w{WEEK}legs.json')  # 2026-11-04: LEGS_OUT lets postmortem.py write a scratch copy
json.dump(dict(tickets=tickets,legs=legs,ai_only=ai_only,ai_record_size=len(AI),ai_record_source='paper ledger' if AI_FROM_PAPER else ('ai-proposals json' if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..','data','official-picks','ai-proposals',f'2026-w{int(WEEK):02d}.json')) else 'ai_recs module')),open(_out,'w'),default=str,indent=1)
import collections
print('placed legs',len(legs),'ai_only',len(ai_only),'ai record',len(AI))
c=collections.Counter((l['origin'],l['result']) for l in legs); print(c)
c=collections.Counter(l['result'] for l in ai_only); print('ai_only',c)
if not os.environ.get('QUIET'):
    for a in ai_only: print(f"  {a['result']:7} {a['cat']:16} {a['label'][:45]:45} act={a['actual']} [{a['src']}]")
