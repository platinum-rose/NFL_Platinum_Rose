import json,sys,os
sys.path.insert(0,os.path.expanduser('~/scratch'))
from grade import *
from parse_placed import grade_spec
from ai_recs import P,S
WEEK=os.environ['WEEK']
if WEEK=='1':
  PAPER={
  'AI card: Melbourne Primetime SGP (Evans ATD / CMC 61+ / Juszczyk 5+ yds)':[P('Mike Evans','atd',1,'over','SF @ LAR',''),P('Christian McCaffrey','rush_yds',61,'over','SF @ LAR',''),P('Kyle Juszczyk','rec_yds',4.5,'over','SF @ LAR','')],
  'AI card: Melbourne 4-leg expansion (+ Purdy 15+ rush)':[P('Mike Evans','atd',1,'over','SF @ LAR',''),P('Christian McCaffrey','rush_yds',61,'over','SF @ LAR',''),P('Kyle Juszczyk','rec_yds',4.5,'over','SF @ LAR',''),P('Brock Purdy','rush_yds',14.5,'over','SF @ LAR','')],
  'AI card: Sunday Workhorse TD Trio (Taylor / Hurts / Hampton ATD)':[P('Jonathan Taylor','atd',1,'over','BAL @ IND',''),P('Jalen Hurts','atd',1,'over','WSH @ PHI',''),P('Omarion Hampton','atd',1,'over','ARI @ LAC','')],
  'AI card: Safe Floor Builder (Flowers 50+ / Pierce 45+ / S. Tucker 15+ rush)':[P('Zay Flowers','rec_yds',50,'over','BAL @ IND',''),P('Alec Pierce','rec_yds',44.5,'over','BAL @ IND',''),P('Sean Tucker','rush_yds',14.5,'over','TB @ CIN','')],
  'AI forecast board A+ plays (CAR +3.5 / HOU +7.5 / TB +3.5 / ARI +10)':[S('spread','CAR',3.5,'CHI @ CAR',''),S('spread','HOU',7.5,'BUF @ HOU',''),S('spread','TB',3.5,'TB @ CIN',''),S('spread','ARI',10,'ARI @ LAC','')],
  'AI forecast board totals (7 Unders + 2 Overs)':[S('total',None,44.5,'NE @ SEA','','under'),S('total',None,48.5,'SF @ LAR','','under'),S('total',None,50.5,'TB @ CIN','','under'),S('total',None,41.5,'NYJ @ TEN','','under'),S('total',None,48.5,'NO @ DET','','under'),S('total',None,46.5,'GB @ MIN','','under'),S('total',None,48.5,'DAL @ NYG','','under'),S('total',None,43.5,'DEN @ KC','','under'),S('total',None,48,'BAL @ IND','','over'),S('total',None,40.5,'MIA @ LV','','over')],
  }
else:
  PAPER={
  'AI 7a Morning 6 (Jefferson / Barkley / Bijan / Chase / Bateman / Lloyd)':[P('Justin Jefferson','rec',7,'over','MIN @ CHI',''),P('Saquon Barkley','rush_yds',79.5,'over','PHI @ TEN',''),P('Bijan Robinson','rush_yds',82,'over','CAR @ ATL',''),P("Ja'Marr Chase",'rec',7,'over','CIN @ HOU',''),P('Rashod Bateman','rec_yds',40,'over','NO @ BAL',''),P('MarShawn Lloyd','carries',14,'over','CAR @ ATL','')],
  'AI 7b Afternoon 6 (McBride / JSN / Lamb / P. Washington / CMC / Jeanty)':[P('Trey McBride','rec',7,'over','SEA @ ARI',''),P('Jaxon Smith-Njigba','rec_yds',81.5,'over','SEA @ ARI',''),P('CeeDee Lamb','rec',6,'over','WAS @ DAL',''),P('Parker Washington','rec',5,'over','JAX @ DEN',''),P('Christian McCaffrey','rush_yds',62.5,'over','MIA @ SF',''),P('Ashton Jeanty','rush_yds',62.5,'over','LV @ LAC','')],
  'AI 7c SNF 4-pick (Walker 81+ / Rice 50+ / Pierce 45+ / K. Allen 4+)':[P('Kenneth Walker III','rush_yds',80.5,'over','IND @ KC',''),P('Rashee Rice','rec_yds',50,'over','IND @ KC',''),P('Alec Pierce','rec_yds',45,'over','IND @ KC',''),P('Keenan Allen','rec',4,'over','IND @ KC','')],
  'AI 7c SNF 6-pick (+ Worthy 4+ / D. Jones U32.5 att)':[P('Kenneth Walker III','rush_yds',80.5,'over','IND @ KC',''),P('Rashee Rice','rec_yds',50,'over','IND @ KC',''),P('Alec Pierce','rec_yds',45,'over','IND @ KC',''),P('Keenan Allen','rec',4,'over','IND @ KC',''),P('Xavier Worthy','rec',4,'over','IND @ KC',''),P('Daniel Jones','pass_att',32.5,'under','IND @ KC','')],
  'AI 7d Hybrid 8':[P('Justin Jefferson','rec',7,'over','MIN @ CHI',''),P('Saquon Barkley','rush_yds',79.5,'over','PHI @ TEN',''),P("Ja'Marr Chase",'rec',7,'over','CIN @ HOU',''),P('Bijan Robinson','rush_yds',82,'over','CAR @ ATL',''),P('Trey McBride','rec',7,'over','SEA @ ARI',''),P('CeeDee Lamb','rec',6,'over','WAS @ DAL',''),P('Christian McCaffrey','rush_yds',62.5,'over','MIA @ SF',''),P('Kenneth Walker III','rush_yds',80.5,'over','IND @ KC','')],
  'AI 7e Anytime TD 7':[P('Jaxon Smith-Njigba','atd',1,'over','SEA @ ARI',''),P('CeeDee Lamb','atd',1,'over','WAS @ DAL',''),P('Chase Brown','atd',1,'over','CIN @ HOU',''),P('Ashton Jeanty','atd',1,'over','LV @ LAC',''),P('Rashee Rice','atd',1,'over','IND @ KC',''),P("Ja'Marr Chase",'atd',1,'over','CIN @ HOU',''),P('Cam Skattebo','atd',1,'over','NYG @ LAR','')],
  'AI 8a First TD (Egbuka / Loveland)':[P('Emeka Egbuka','first_td',None,'over','CLE @ TB',''),P('Colston Loveland','first_td',None,'over','MIN @ CHI','')],
  'AI 8b 2+ TD (Bijan / Henry / CMC / Kyren)':[P('Bijan Robinson','tds',2,'over','CAR @ ATL',''),P('Derrick Henry','tds',2,'over','NO @ BAL',''),P('Christian McCaffrey','tds',2,'over','MIA @ SF',''),P('Kyren Williams','tds',2,'over','NYG @ LAR','')],
  'AI MNF Tier 1 (Kyren 64+ / Skattebo 50+ / Likely 46+ yds)':[P('Kyren Williams','rush_yds',64,'over','NYG @ LAR',''),P('Cam Skattebo','rush_yds',50,'over','NYG @ LAR',''),P('Isaiah Likely','rec_yds',46,'over','NYG @ LAR','')],
  'AI Master RR 8 (4-team combos)':[S('spread','DEN',-3,'JAX @ DEN',''),S('total',None,39,'PHI @ TEN','','under'),S('spread','LAR',-6.5,'NYG @ LAR',''),S('spread','MIA',13,'MIA @ SF',''),S('spread','TB',-8.5,'CLE @ TB',''),S('spread','MIN',5,'MIN @ CHI',''),S('spread','NYJ',3,'GB @ NYJ',''),S('spread','IND',6.5,'IND @ KC','')],
  'AI Dog-ML RR 6 (NYJ / ATL / WAS / ARI / MIN / IND)':[S('ml','NYJ',None,'GB @ NYJ',''),S('ml','ATL',None,'CAR @ ATL',''),S('ml','WAS',None,'WAS @ DAL',''),S('ml','ARI',None,'SEA @ ARI',''),S('ml','MIN',None,'MIN @ CHI',''),S('ml','IND',None,'IND @ KC','')],
  'AI SuperContest five (MIN / DEN / NYJ / MIA / WAS)':[S('spread','MIN',5.5,'MIN @ CHI',''),S('spread','DEN',-2.5,'JAX @ DEN',''),S('spread','NYJ',3.5,'GB @ NYJ',''),S('spread','MIA',13.5,'MIA @ SF',''),S('spread','WAS',4.5,'WAS @ DAL','')],
  'AI AM chalk parlay (TB/BAL/PHI/NE/CHI/DEN/KC ML)':[S('ml',t,None,g,'') for t,g in [('TB','CLE @ TB'),('BAL','NO @ BAL'),('PHI','PHI @ TEN'),('NE','PIT @ NE'),('CHI','MIN @ CHI'),('DEN','JAX @ DEN'),('KC','IND @ KC')]],
  'AI Standalones (DEN −3 / LAR −6.5 / U39 / MIA +13)':[S('spread','DEN',-3,'JAX @ DEN',''),S('spread','LAR',-6.5,'NYG @ LAR',''),S('total',None,39,'PHI @ TEN','','under'),S('spread','MIA',13,'MIA @ SF','')],
  }
out=[]
for name,ls in PAPER.items():
    gl=[]
    for s in ls:
        r=grade_spec(s); gl.append(dict(label=s['label'],result=r['result'],actual=r.get('actual'),margin=r.get('margin'),kind=s['kind'],key=s.get('key'),thr=s.get('thr',s.get('line')),player=s.get('player')))
    out.append(dict(name=name,paper=True,legs=gl))
    print(f"{sum(l['result']=='W' for l in gl)}/{len(gl)} {name} :: "+'; '.join(f"{l['label'][:24]}={l['result']}({l['actual']})" for l in gl if l['result']!='W'))
json.dump(out,open(os.path.expanduser(f'~/scratch/w{WEEK}paper.json'),'w'),default=str,indent=1)
