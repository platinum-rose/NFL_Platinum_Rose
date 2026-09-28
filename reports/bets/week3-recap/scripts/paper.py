import json,sys,os
sys.path.insert(0,os.path.expanduser('~/scratch'))
from grade import *
from parse_placed import grade_spec
from ai_recs import P,S
PAPER={
 'AI Official paper 4-leg (SF −7.5 / 3 Unders)':[S('spread','SF',-7.5,'ARI @ SF',''),S('total',None,45,'LAR @ DEN','','under'),S('total',None,43.5,'CIN @ PIT','','under'),S('total',None,43,'PHI @ CHI','','under')],
 'AI Clean synthesis Morning 3-leg (TEN +2 / CIN −3 / CAR-CLE U42.5)':[S('spread','TEN',2,'TEN @ NYG',''),S('spread','CIN',-3,'CIN @ PIT',''),S('total',None,42.5,'CAR @ CLE','','under')],
 'AI Clean synthesis Afternoon 3-leg (SF −8 / TB +1 / BAL −3.5)':[S('spread','SF',-8,'ARI @ SF',''),S('spread','TB',1,'MIN @ TB',''),S('spread','BAL',-3.5,'BAL @ DAL','')],
 'AI Clean synthesis Dog spread RR legs (TEN +2 / NYJ +6.5 / CLE +2 / TB +1)':[S('spread','TEN',2,'TEN @ NYG',''),S('spread','NYJ',6.5,'NYJ @ DET',''),S('spread','CLE',2,'CAR @ CLE',''),S('spread','TB',1,'MIN @ TB','')],
 'AI Clean synthesis Master RR 8 (4-team combos)':[S('spread','TEN',2,'TEN @ NYG',''),S('spread','CIN',-3,'CIN @ PIT',''),S('spread','JAX',-3,'NE @ JAX',''),S('spread','SF',-8,'ARI @ SF',''),S('spread','BAL',-3.5,'BAL @ DAL',''),S('total',None,42.5,'CAR @ CLE','','under'),S('total',None,44,'LAR @ DEN','','under'),S('spread','PHI',-3,'PHI @ CHI','')],
 'AI Slot 4 afternoon T3 (SF −7.5 / TB ML / BAL −3.5 / LV-NO U43.5 / LAR-DEN U44)':[S('spread','SF',-7.5,'ARI @ SF',''),S('ml','TB',None,'MIN @ TB',''),S('spread','BAL',-3.5,'BAL @ DAL',''),S('total',None,43.5,'LV @ NO','','under'),S('total',None,44,'LAR @ DEN','','under')],
 'AI v5 Slot 3 Morning (CIN/CLE/BAL/LAR ML + SF −8)':[S('ml','CIN',None,'CIN @ PIT',''),S('ml','CLE',None,'CAR @ CLE',''),S('spread','SF',-8,'ARI @ SF',''),S('ml','BAL',None,'BAL @ DAL',''),S('ml','LAR',None,'LAR @ DEN','')],
 'AI SuperContest five (TEN/NYJ/CIN/JAX/SF)':[S('spread','TEN',2.5,'TEN @ NYG',''),S('spread','NYJ',6.5,'NYJ @ DET',''),S('spread','CIN',-3.5,'CIN @ PIT',''),S('spread','JAX',-3,'NE @ JAX',''),S('spread','SF',-8.5,'ARI @ SF','')],
 'AI Prop RR 5 (Schwesinger/Roquan/Burrow/D. Thomas/Purdy)':[P('Carson Schwesinger','tackles',9,'over','CAR @ CLE',''),P('Roquan Smith','tackles',8,'over','BAL @ DAL',''),P('Joe Burrow','pass_td',2,'over','CIN @ PIT',''),P('Drake Thomas','tackles',7,'over','SEA @ WAS',''),P('Brock Purdy','pass_td',2,'over','ARI @ SF','')],
 'AI 7b v1 4-leg (Purdy / Roquan / Downs / Jeanty 18+ car)':[P('Brock Purdy','pass_td',2,'over','ARI @ SF',''),P('Roquan Smith','tackles',8,'over','BAL @ DAL',''),P('Caleb Downs','tackles',7,'over','BAL @ DAL',''),P('Ashton Jeanty','carries',18,'over','LV @ NO','')],
 'AI 7b v5 5-leg (Purdy / Downs / Cousins / Irving / Jeanty ATD)':[P('Brock Purdy','pass_td',2,'over','ARI @ SF',''),P('Caleb Downs','tackles',7,'over','BAL @ DAL',''),P('Kirk Cousins','pass_td',2,'over','LV @ NO',''),P('Bucky Irving','rec',3,'over','MIN @ TB',''),P('Ashton Jeanty','atd',1,'over','LV @ NO','')],
 'AI 7d Hybrid 8-leg':[P('Parker Washington','rec',5,'over','NE @ JAX',''),P('Jacob Rodriguez','tackles',10,'over','KC @ MIA',''),P('Nate Wiggins','tackles',4,'over','BAL @ DAL',''),P('Devon Witherspoon','tackles',5,'over','SEA @ WAS',''),P('Breece Hall','carries',14,'over','NYJ @ DET',''),P('Derrick Henry','rush_yds',80,'over','BAL @ DAL',''),P('Blake Corum','rush_yds',38,'over','LAR @ DEN',''),P('Kyren Williams','carries',12,'over','LAR @ DEN','')],
 'AI 7e Anytime TD 7-leg':[P('Josh Allen','atd',1,'over','LAC @ BUF',''),P('Derrick Henry','atd',1,'over','BAL @ DAL',''),P('Chase Brown','atd',1,'over','CIN @ PIT',''),P('Bhayshul Tuten','atd',1,'over','NE @ JAX',''),P('George Kittle','atd',1,'over','ARI @ SF',''),P('Jonathan Taylor','atd',1,'over','HOU @ IND',''),P('Kyren Williams','atd',1,'over','LAR @ DEN','')],
 'AI Stack A v1 6-leg (McBride/Kittle ATD/Olave/Andrews 39+/Wiggins/Henry 80+)':[P('Trey McBride','rec',7,'over','ARI @ SF',''),P('George Kittle','atd',1,'over','ARI @ SF',''),P('Chris Olave','rec',6,'over','LV @ NO',''),P('Mark Andrews','rec_yds',39,'over','BAL @ DAL',''),P('Nate Wiggins','tackles',4,'over','BAL @ DAL',''),P('Derrick Henry','rush_yds',80,'over','BAL @ DAL','')],
 'AI Stack A final 6-leg (McBride/Olave/Humphrey/Henry 83+/Andrews 40+/Jeanty 19+)':[P('Trey McBride','rec',7,'over','ARI @ SF',''),P('Chris Olave','rec',6,'over','LV @ NO',''),P('Marlon Humphrey','tackles',4,'over','BAL @ DAL',''),P('Derrick Henry','rush_yds',83,'over','BAL @ DAL',''),P('Mark Andrews','rec_yds',40,'over','BAL @ DAL',''),P('Ashton Jeanty','carries',19,'over','LV @ NO','')],
 'AI Stack B v1 4-leg (Lamb 7+ / Olave 77+ / Corum 38+ / Kyren 12+ car)':[P('CeeDee Lamb','rec',7,'over','BAL @ DAL',''),P('Chris Olave','rec_yds',77,'over','LV @ NO',''),P('Blake Corum','rush_yds',38,'over','LAR @ DEN',''),P('Kyren Williams','carries',12,'over','LAR @ DEN','')],
 'AI Stack B v2 4-leg (Vele / Otton / Corum 48+ / Jefferson)':[P('Devaughn Vele','rec',5,'over','LV @ NO',''),P('Cade Otton','rec',3,'over','MIN @ TB',''),P('Blake Corum','rush_yds',48,'over','LAR @ DEN',''),P('Justin Jefferson','rec',6,'over','MIN @ TB','')],
 'AI SNF T3 v3 (Adams ATD / Bryant 28+ / K. Turner sack / 1H U22.5 / Engram 22+)':[P('Davante Adams','atd',1,'over','LAR @ DEN',''),P('Pat Bryant','rec_yds',28,'over','LAR @ DEN',''),P('Kobie Turner','sacks',1,'over','LAR @ DEN',''),dict(kind='half',thr=22.5,label='1H U22.5'),P('Evan Engram','rec_yds',22,'over','LAR @ DEN','')],
 'Andy attempted 7-leg (rejected by BEO limit)':[P('Ashton Jeanty','atd',1,'over','LV @ NO',''),P('Chris Olave','atd',1,'over','LV @ NO',''),P('Tyler Shough','pass_att',32,'over','LV @ NO',''),P('Javonte Williams','atd',1,'over','BAL @ DAL',''),P('Lamar Jackson','atd',1,'over','BAL @ DAL',''),P('Pat Bryant','rec',3,'over','LAR @ DEN',''),P('Devaughn Vele','rec',4,'over','LV @ NO','')],
}
out=[]
for name,ls in PAPER.items():
    gl=[]
    for s in ls:
        if s['kind']=='half':
            g=GAMES[('LAR','DEN')]; h1=sum(int(x) for x in g['away_ls'][:2])+sum(int(x) for x in g['home_ls'][:2])
            gl.append(dict(label='LAR@DEN 1H Under 22.5',result='W' if h1<22.5 else 'L',actual=f'1H {h1}',margin=22.5-h1,kind='half_total',key=None,thr=22.5)); continue
        r=grade_spec(s); gl.append(dict(label=s['label'],result=r['result'],actual=r.get('actual'),margin=r.get('margin'),kind=s['kind'],key=s.get('key'),thr=s.get('thr',s.get('line')),player=s.get('player')))
    out.append(dict(name=name,paper=True,legs=gl))
    print(f"{sum(l['result']=='W' for l in gl)}/{len(gl)} pend={sum(l['result']=='pending' for l in gl)} {name}  :: "+'; '.join(f"{l['label'][:22]}={l['result']}({l['actual']})" for l in gl if l['result']!='W'))
json.dump(out,open(os.path.expanduser('~/scratch/w3paper.json'),'w'),default=str,indent=1)
