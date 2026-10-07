# Week 4 AI record (proposals only), graded vs w4games.json by scripts/build.py (WEEK=4).
# Sources: reports/analysis/week4-intel/tnf-pit-cle-source-check-and-scenario-drafts-2026-10-01.md (TNF S1/S2),
#          reports/bets/2026-w04-card.md (Sat 10/03 card + 10/04 adds), reports/bets/2026-w04-afternoon-props.md (7b-A/B/C),
#          reports/bets/2026-w04-snf-island.md (SNF tiers 1-3). No MNF AI card (MNF tickets were built from the prop planner).
from ai_recs import P,S
AI=[
# ---- TNF PIT@CLE scenario drafts (competing; Andy placed neither as drafted)
P('Jaylen Warren','rush_yds',75.5,'over','PIT @ CLE','TNF S1'),P('Aaron Rodgers','completions',19.5,'under','PIT @ CLE','TNF S1'),
S('spread','PIT',-2.5,'PIT @ CLE','TNF S1 (optional)'),
S('ml','CLE',None,'PIT @ CLE','TNF S2'),P('Aaron Rodgers','int_thrown',1,'over','PIT @ CLE','TNF S2'),
# ---- Sunday card: game-line tickets
S('spread','NE',7,'NE @ BUF','Slot 3 / Hybrid / Bills credit'),S('spread','NYJ',3.5,'NYJ @ CHI','Slot 3 / single'),
S('total',None,38.5,'GB @ TB','Slot 3 / single','under'),S('ml','SEA',None,'LAC @ SEA','Slot 3'),S('ml','DET',None,'DET @ CAR','Slot 3/4 SNF cap'),
S('ml','ARI',None,'ARI @ NYG','Slot 4 / Hybrid / 2-leg'),S('ml','LAR',None,'LAR @ PHI','Slot 4'),S('spread','MIA',9.5,'MIA @ MIN','Slot 4 / Hybrid / single / SC'),
S('spread','DEN',2.5,'DEN @ SF','Slot 4 / SC'),S('ml','DEN',None,'DEN @ SF','Hybrid'),S('ml','JAX',None,'JAX @ CIN','2-leg'),
S('spread','ARI',-2.5,'ARI @ NYG','SuperContest A'),S('spread','LAR',-3.5,'LAR @ PHI','SuperContest A'),S('spread','TEN',11.5,'TEN @ BAL','SuperContest A'),
S('spread','JAX',8.5,'JAX @ CIN','Wong teaser'),S('spread','DEN',8.5,'DEN @ SF','Wong teaser'),S('spread','ATL',8.5,'ATL @ NO','Wong teaser (MNF)'),
# ---- Sunday card: prop stacks 7a / 7b / 7d / 8b / 7e / 8a
P('Jacoby Brissett','pass_td',2,'over','ARI @ NYG','7a'),P('Matthew Stafford','pass_td',2,'over','LAR @ PHI','7a'),
P('Jameis Winston','int_thrown',1,'over','ARI @ NYG','7a'),P('Jalon Daniels','int_thrown',1,'over','GB @ TB','7a / 7d'),
P('Puka Nacua','atd',1,'over','LAR @ PHI','7a'),P('Jakobi Meyers','atd',1,'over','JAX @ CIN','7a'),P('Tony Pollard','atd',1,'over','TEN @ BAL','7a'),
P('Sam Darnold','pass_td',2,'over','LAC @ SEA','7b / 7b-A'),P('Patrick Mahomes','pass_td',2,'over','KC @ LV','7b'),P('Malik Willis','int_thrown',1,'over','MIA @ MIN','7b'),
P('Parker Washington','rec',6,'over','JAX @ CIN','7d'),P('Puka Nacua','rec',7,'over','LAR @ PHI','7d'),P('Tony Pollard','rush_yds',48,'over','TEN @ BAL','7d'),
P('James Cook','rush_yds',85,'over','NE @ BUF','7d'),P('Christian McCaffrey','rec_yds',41,'over','DEN @ SF','7d'),P('Jameson Williams','atd',1,'over','DET @ CAR','7d / 7e'),
P('Derrick Henry','tds',2,'over','TEN @ BAL','8b'),P('David Montgomery','tds',2,'over','DAL @ HOU','8b'),P('Jahmyr Gibbs','tds',2,'over','DET @ CAR','8b'),
P('Michael Wilson','atd',1,'over','ARI @ NYG','7e'),P('Garrett Wilson','atd',1,'over','NYJ @ CHI','7e'),P('Lamar Jackson','atd',1,'over','TEN @ BAL','7e'),
P('James Cook','first_td',None,'over','NE @ BUF','8a'),P('Derrick Henry','first_td',None,'over','TEN @ BAL','8a'),P('Travis Kelce','first_td',None,'over','KC @ LV','8a'),
# ---- Sunday 11:30 afternoon stacks 7b-A / 7b-B / 7b-C
P('Brock Purdy','pass_td',2,'over','DEN @ SF','7b-A'),P('Nick Bolton','tackles',9,'over','KC @ LV','7b-A'),P('Blake Cashman','tackles',8,'over','MIA @ MIN','7b-A'),
P('Justin Herbert','int_thrown',1,'over','LAC @ SEA','7b-B'),P('Ernest Jones','tackles',8,'over','LAC @ SEA','7b-B / 7b-C'),P('Rashee Rice','rec',5,'over','KC @ LV','7b-B'),
P('Nakobe Dean','tackles',8,'over','KC @ LV','7b-B'),P('Alex Singleton','tackles',9,'over','DEN @ SF','7b-B'),P('Courtland Sutton','atd',1,'over','DEN @ SF','7b-B'),
P('Kirk Cousins','pass_td',2,'over','KC @ LV','7b-C'),P('Travis Kelce','atd',1,'over','KC @ LV','7b-C'),P('Jaxon Smith-Njigba','rec',7,'over','LAC @ SEA','7b-C'),
P('Fred Warner','tackles',9,'over','DEN @ SF','7b-C'),P('Michael Taaffe','tackles',6,'over','MIA @ MIN','7b-C'),P('Amon-Ra St. Brown','rec',7,'over','DET @ CAR','7b-C (opt. SNF)'),
# ---- SNF DET@CAR island ladder
P('Bryce Young','pass_yds',233,'over','DET @ CAR','SNF T1'),P('Jahmyr Gibbs','rec',5,'over','DET @ CAR','SNF T1'),P('Derrick Barnes','tackles',5,'over','DET @ CAR','SNF T1'),
P('Jared Goff','completions',23,'over','DET @ CAR','SNF T1'),
P('Chuba Hubbard','atd',1,'over','DET @ CAR','SNF T2'),P('Devin Lloyd','tackles',9,'over','DET @ CAR','SNF T2'),P('Chuck Clark','tackles',7,'over','DET @ CAR','SNF T2'),
P('Jameson Williams','rec',4,'over','DET @ CAR','SNF T2'),P('Aidan Hutchinson','sacks',1,'over','DET @ CAR','SNF T2'),
P('Tetairoa McMillan','rec_yds',94,'over','DET @ CAR','SNF T3'),P('Isaac TeSlaa','atd',1,'over','DET @ CAR','SNF T3'),P('Tommy Tremble','rec',3,'over','DET @ CAR','SNF T3'),
P('Bobby Okereke','tackles',8,'over','DET @ CAR','SNF T3'),
]
# Master Intel projections (dist/nfl_week4_master_packet/...summary.json); no TNF projection.
PROJ={'IND@WSH':(26,20),'NE@BUF':(21,27),'NYJ@CHI':(20,23),'JAX@CIN':(25,27),'ARI@NYG':(24,20),'LAR@PHI':(23,18),'GB@TB':(21,16),'TEN@BAL':(16,26),
'DAL@HOU':(22,26),'MIA@MIN':(14,22),'KC@LV':(25,22),'DEN@SF':(23,24),'LAC@SEA':(16,24),'DET@CAR':(28,24),'ATL@NO':(23,25)}
