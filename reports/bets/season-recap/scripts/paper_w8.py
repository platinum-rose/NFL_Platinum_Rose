# Grade the Week 8 AI paper tickets (data/official-picks/paper-wagers-2026.json) from box scores -> ../w4paper.json.
# Paper != real: these are unbooked AI proposals, kept out of every cash total.
import json,sys,os
D=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,D)
os.environ.setdefault('WEEK','8'); os.environ.setdefault('RECAP_DIR',os.path.join(D,'..'))
from grade import *
from parse_placed import parse_leg,grade_spec
WEEK=os.environ['WEEK']
PW=json.load(open(os.path.join(D,'..','..','..','..','data','official-picks','paper-wagers-2026.json')))
out=[]
for p in PW:
    if str(p.get('week'))!=WEEK: continue
    gl=[]
    for l in p.get('legs') or []:
        s=parse_leg(l)
        if not s: continue
        r=grade_spec(s)
        gl.append(dict(label=s['label'],result=r['result'],actual=r.get('actual'),margin=r.get('margin'),kind=s['kind'],key=s.get('key'),thr=s.get('thr',s.get('line')),player=s.get('player')))
    name=(p.get('game_title') or p['id']).replace('AI paper: ','AI ').replace(' (not booked)','')
    out.append(dict(name=name,id=p['id'],paper=True,stake=p.get('stake_usd'),odds=p.get('odds_american'),legs=gl))
    print(f"{sum(l['result']=='W' for l in gl)}/{len(gl)} {name} :: "+'; '.join(f"{l['label'][:30]}={l['result']}({l['actual']})" for l in gl if l['result']!='W'))
# Unbooked AI builds that are not in the paper ledger (Sunday 11:30 stacks, SNF ladder, TNF scenarios), graded the same way.
from ai_recs_w8 import AI
def pick(tag,drop=()):
    return [x for x in AI if tag in [t.strip() for t in x['src'].replace('(',' / ').replace(')','').split('/')] and x['label'] not in drop]
EXTRA={
 'AI TNF S1 (Jacobs R+R / Young INT / Kraft 5+ / Young U10.5 rush)':pick('TNF S1'),
 'AI TNF S2 (Jacobs / Watson / Hubbard ATD)':pick('TNF S2'),
 'AI TNF S3 (Young 23+ cmp / Metchie / Hubbard / Watson / Jacobs carries)':pick('TNF S3'),
 'AI TNF S3b (Young / Metchie / Hubbard / Love 2+ TD / McMillan 6+)':pick('TNF S3b')+pick('S3b'),
 'AI TNF S4 rebuilt (Love INT / Van Ness / Waller 22+ / Coker ATD)':pick('S4 rebuilt')+pick('TNF S4 rebuilt'),
 'AI TNF S5 (Love 3+ TD / Young 2+ TD / McMillan / Kraft ATD / Coker 6+)':pick('TNF S5'),
 'AI D50 weekend 11-leg':pick('D50'),
 'AI D51 weekend 9-leg':pick('D51'),
 'AI Afternoon 5 (Stafford INT / Mack / Dobbins / Nix / NE-MIA U43)':pick('Afternoon 5'),
 'AI SNF T1 (McKee / Okonkwo / Barkley)':pick('SNF T1'),
 'AI SNF T2 (Daniels 2+ TD / Diggs 5+ / Lemon ATD)':pick('SNF T2'),
 'AI SNF T3 (Goedert / Hollywood / A. Williams ATD)':pick('SNF T3'),
}
# Waller 22+ (rebuilt) differs from v1 18.5; add it explicitly
from ai_recs import P
EXTRA['AI TNF S4 rebuilt (Love INT / Van Ness / Waller 22+ / Coker ATD)'].append(P('Darren Waller','rec_yds',22,'over','CAR @ GB','TNF S4 rebuilt'))
for name,ls in EXTRA.items():
    gl=[]
    for s_ in ls:
        r=grade_spec(s_); gl.append(dict(label=s_['label'],result=r['result'],actual=r.get('actual'),margin=r.get('margin'),kind=s_['kind'],key=s_.get('key'),thr=s_.get('thr',s_.get('line')),player=s_.get('player')))
    out.append(dict(name=name,id=None,paper=True,extra=True,legs=gl))
    print(f"{sum(l['result']=='W' for l in gl)}/{len(gl)} {name} :: "+'; '.join(f"{l['label'][:30]}={l['result']}({l['actual']})" for l in gl if l['result']!='W'))
json.dump(out,open(os.path.join(D,'..',f'w{WEEK}paper.json'),'w'),default=str,indent=1)
