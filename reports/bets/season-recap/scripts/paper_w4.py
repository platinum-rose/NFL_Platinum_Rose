# Grade the Week 4 AI paper tickets (data/official-picks/paper-wagers-2026.json) from box scores -> ../w4paper.json.
# Paper != real: these are unbooked AI proposals, kept out of every cash total.
import json,sys,os
D=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,D)
os.environ.setdefault('WEEK','4'); os.environ.setdefault('RECAP_DIR',os.path.join(D,'..'))
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
from ai_recs import P,S
EXTRA={
 'AI TNF S2: CLE ML + Rodgers 1+ INT':[S('ml','CLE',None,'PIT @ CLE',''),P('Aaron Rodgers','int_thrown',1,'over','PIT @ CLE','')],
 'AI TNF S1: Warren 76+ rush + Rodgers U19.5 comp':[P('Jaylen Warren','rush_yds',75.5,'over','PIT @ CLE',''),P('Aaron Rodgers','completions',19.5,'under','PIT @ CLE','')],
 'AI 7b-A Afternoon 4 (Darnold / Purdy 2+ TD, Bolton / Cashman T+A)':[P('Sam Darnold','pass_td',2,'over','LAC @ SEA',''),P('Brock Purdy','pass_td',2,'over','DEN @ SF',''),P('Nick Bolton','tackles',9,'over','KC @ LV',''),P('Blake Cashman','tackles',8,'over','MIA @ MIN','')],
 'AI 7b-B Afternoon 6 moonshot':[P('Justin Herbert','int_thrown',1,'over','LAC @ SEA',''),P('Ernest Jones','tackles',8,'over','LAC @ SEA',''),P('Rashee Rice','rec',5,'over','KC @ LV',''),P('Nakobe Dean','tackles',8,'over','KC @ LV',''),P('Alex Singleton','tackles',9,'over','DEN @ SF',''),P('Courtland Sutton','atd',1,'over','DEN @ SF','')],
 'AI 7b-C Afternoon #2 (7 with St. Brown)':[P('Kirk Cousins','pass_td',2,'over','KC @ LV',''),P('Travis Kelce','atd',1,'over','KC @ LV',''),P('Ernest Jones','tackles',8,'over','LAC @ SEA',''),P('Jaxon Smith-Njigba','rec',7,'over','LAC @ SEA',''),P('Fred Warner','tackles',9,'over','DEN @ SF',''),P('Michael Taaffe','tackles',6,'over','MIA @ MIN',''),P('Amon-Ra St. Brown','rec',7,'over','DET @ CAR','')],
 'AI SNF Tier 1 (Young 233+ / Gibbs 5+ rec / Barnes 5+ / Goff 23+ comp)':[P('Bryce Young','pass_yds',233,'over','DET @ CAR',''),P('Jahmyr Gibbs','rec',5,'over','DET @ CAR',''),P('Derrick Barnes','tackles',5,'over','DET @ CAR',''),P('Jared Goff','completions',23,'over','DET @ CAR','')],
 'AI SNF Tier 2 (Hubbard ATD / Lloyd / Clark / J. Williams 4+ / Hutchinson)':[P('Chuba Hubbard','atd',1,'over','DET @ CAR',''),P('Devin Lloyd','tackles',9,'over','DET @ CAR',''),P('Chuck Clark','tackles',7,'over','DET @ CAR',''),P('Jameson Williams','rec',4,'over','DET @ CAR',''),P('Aidan Hutchinson','sacks',1,'over','DET @ CAR','')],
 'AI SNF Tier 3 (McMillan 94+ / TeSlaa ATD / Tremble 3+ / Okereke 8+)':[P('Tetairoa McMillan','rec_yds',94,'over','DET @ CAR',''),P('Isaac TeSlaa','atd',1,'over','DET @ CAR',''),P('Tommy Tremble','rec',3,'over','DET @ CAR',''),P('Bobby Okereke','tackles',8,'over','DET @ CAR','')],
}
for name,ls in EXTRA.items():
    gl=[]
    for s_ in ls:
        r=grade_spec(s_); gl.append(dict(label=s_['label'],result=r['result'],actual=r.get('actual'),margin=r.get('margin'),kind=s_['kind'],key=s_.get('key'),thr=s_.get('thr',s_.get('line')),player=s_.get('player')))
    out.append(dict(name=name,id=None,paper=True,extra=True,legs=gl))
    print(f"{sum(l['result']=='W' for l in gl)}/{len(gl)} {name} :: "+'; '.join(f"{l['label'][:30]}={l['result']}({l['actual']})" for l in gl if l['result']!='W'))
json.dump(out,open(os.path.join(D,'..',f'w{WEEK}paper.json'),'w'),default=str,indent=1)
