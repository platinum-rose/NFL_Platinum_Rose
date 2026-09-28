from ai_recs import P,S
AI=[
# Card v2 (Sat night BKR) standalones + Master RR + dog ML RR + chalk parlays + SuperContest AI five
S('spread','DEN',-3,'JAX @ DEN','Standalone A-'),S('spread','LAR',-6.5,'NYG @ LAR','Standalone B+'),S('total',None,39,'PHI @ TEN','Standalone B','under'),S('spread','MIA',13,'MIA @ SF','Standalone B'),
S('spread','TB',-8.5,'CLE @ TB','Master RR'),S('spread','MIN',5,'MIN @ CHI','Master RR'),S('spread','NYJ',3,'GB @ NYJ','Master RR'),S('spread','IND',6.5,'IND @ KC','Master RR'),
S('ml','NYJ',None,'GB @ NYJ','Dog-ML RR'),S('ml','ATL',None,'CAR @ ATL','Dog-ML RR'),S('ml','WAS',None,'WAS @ DAL','Dog-ML RR'),S('ml','ARI',None,'SEA @ ARI','Dog-ML RR'),S('ml','MIN',None,'MIN @ CHI','Dog-ML RR'),S('ml','IND',None,'IND @ KC','Dog-ML RR'),
S('ml','TB',None,'CLE @ TB','AM chalk parlay'),S('ml','BAL',None,'NO @ BAL','AM chalk parlay'),S('ml','PHI',None,'PHI @ TEN','AM chalk parlay'),S('ml','NE',None,'PIT @ NE','AM chalk parlay'),
S('ml','CHI',None,'MIN @ CHI','AM chalk parlay'),S('ml','DEN',None,'JAX @ DEN','AM/PM chalk'),S('ml','KC',None,'IND @ KC','AM/PM chalk cap'),S('ml','SF',None,'MIA @ SF','PM chalk parlay'),S('ml','LAC',None,'LV @ LAC','PM chalk parlay'),
S('spread','MIN',5.5,'MIN @ CHI','SuperContest AI five'),S('spread','DEN',-2.5,'JAX @ DEN','SuperContest AI five'),S('spread','NYJ',3.5,'GB @ NYJ','SuperContest AI five'),S('spread','MIA',13.5,'MIA @ SF','SuperContest AI five'),S('spread','WAS',4.5,'WAS @ DAL','SuperContest AI five'),
S('spread','CIN',8.5,'CIN @ HOU','Teaser leg'),S('spread','BAL',-8.5,'NO @ BAL','Market board C+'),S('spread','PIT',5.5,'PIT @ NE','Market board B-'),
# BKR-priced prop card (Sun 2:40 AM) 7a-8b + MNF T1
P('Justin Jefferson','rec',7,'over','MIN @ CHI','7a'),P('Saquon Barkley','rush_yds',79.5,'over','PHI @ TEN','7a'),P('Bijan Robinson','rush_yds',82,'over','CAR @ ATL','7a'),
P("Ja'Marr Chase",'rec',7,'over','CIN @ HOU','7a'),P('Rashod Bateman','rec_yds',40,'over','NO @ BAL','7a'),P('MarShawn Lloyd','carries',14,'over','CAR @ ATL','7a'),
P('Trey McBride','rec',7,'over','SEA @ ARI','7b'),P('Jaxon Smith-Njigba','rec_yds',81.5,'over','SEA @ ARI','7b'),P('CeeDee Lamb','rec',6,'over','WAS @ DAL','7b'),
P('Parker Washington','rec',5,'over','JAX @ DEN','7b'),P('Christian McCaffrey','rush_yds',62.5,'over','MIA @ SF','7b'),P('Ashton Jeanty','rush_yds',62.5,'over','LV @ LAC','7b'),
P('Kenneth Walker III','rush_yds',80.5,'over','IND @ KC','7c SNF'),P('Rashee Rice','rec_yds',50,'over','IND @ KC','7c SNF'),P('Alec Pierce','rec_yds',45,'over','IND @ KC','7c SNF'),
P('Keenan Allen','rec',4,'over','IND @ KC','7c SNF'),P('Xavier Worthy','rec',4,'over','IND @ KC','7c SNF'),P('Daniel Jones','pass_att',32.5,'under','IND @ KC','7c SNF'),
P('Patrick Mahomes','pass_td',2,'over','IND @ KC','7c SNF'),P('Tyler Warren','atd',1,'over','IND @ KC','7c SNF'),
P('Jaxon Smith-Njigba','atd',1,'over','SEA @ ARI','7e'),P('CeeDee Lamb','atd',1,'over','WAS @ DAL','7e'),P('Chase Brown','atd',1,'over','CIN @ HOU','7e'),P('Ashton Jeanty','atd',1,'over','LV @ LAC','7e'),
P('Rashee Rice','atd',1,'over','IND @ KC','7e'),P("Ja'Marr Chase",'atd',1,'over','CIN @ HOU','7e'),P('Cam Skattebo','atd',1,'over','NYG @ LAR','7e (MNF)'),
P('Emeka Egbuka','first_td',None,'over','CLE @ TB','8a'),P('Colston Loveland','first_td',None,'over','MIN @ CHI','8a'),
P('Bijan Robinson','tds',2,'over','CAR @ ATL','8b'),P('Derrick Henry','tds',2,'over','NO @ BAL','8b'),P('Christian McCaffrey','tds',2,'over','MIA @ SF','8b'),P('Kyren Williams','tds',2,'over','NYG @ LAR','8b (MNF)'),
P('Kyren Williams','rush_yds',64,'over','NYG @ LAR','MNF T1'),P('Cam Skattebo','rush_yds',50,'over','NYG @ LAR','MNF T1'),P('Isaiah Likely','rec_yds',46,'over','NYG @ LAR','MNF T1'),
# card v2 draft legs dropped in the priced version
P('Rome Odunze','rec_yds',40,'over','MIN @ CHI','Card v2 7a'),P("Wan'Dale Robinson",'rec_yds',34.5,'over','PHI @ TEN','Card v2 7a'),P('Xavier Hutchinson','rec_yds',26.5,'over','CIN @ HOU','Card v2 7a'),
P('Brock Purdy','completions',19.5,'over','MIA @ SF','Card v2 7b'),P('Chris Bell','rec_yds',19.5,'over','MIA @ SF','Card v2 7b'),P('Dalton Schultz','rec',4,'over','CIN @ HOU','Card v2 2-leg'),
P('Matthew Stafford','pass_yds',259.5,'under','NYG @ LAR','Card v2 MNF'),P('Jaxson Dart','rush_yds',38.5,'under','NYG @ LAR','Card v2 MNF'),P('Isaiah Likely','atd',1,'over','NYG @ LAR','Card v2 MNF'),
P('Kyren Williams','atd',1,'over','NYG @ LAR','Card v2 MNF'),P('Jonathan Taylor','atd',1,'over','IND @ KC','Card v2 SNF'),P('David Njoku','rec',3,'over','','D4 (Claude)'),
]
PROJ={'MIN@CHI':(21.2,26.2),'PHI@TEN':(23.0,16.0),'GB@NYJ':(23.5,20.5),'CAR@ATL':(22.8,20.2),'NO@BAL':(18.5,27.0),'CIN@HOU':(21.5,24.0),'CLE@TB':(16.5,25.0),'PIT@NE':(18.0,23.0),'LV@LAC':(18.5,25.0),'JAX@DEN':(21.2,24.2),'WSH@DAL':(23.5,27.5),'SEA@ARI':(22.5,18.5),'MIA@SF':(16.0,29.0),'IND@KC':(20.2,26.8),'NYG@LAR':(20.8,27.2)}
