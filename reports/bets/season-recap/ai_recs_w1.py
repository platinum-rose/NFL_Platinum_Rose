from ai_recs import P,S
AI=[
# Master packet v5: Platinum Rose AI forecast board recommendations
S('spread','NE',3.5,'NE @ SEA','Forecast board (locked)'),S('total',None,44.5,'NE @ SEA','Forecast board (locked)','under'),
S('spread','SF',3.5,'SF @ LAR','Forecast board 88 (A)'),S('total',None,48.5,'SF @ LAR','Forecast board lean','under'),
S('spread','CAR',3.5,'CHI @ CAR','Forecast board 94 (A+)'),S('ml','CAR',None,'CHI @ CAR','Forecast board 94 (A+)'),
S('spread','HOU',7.5,'BUF @ HOU','Forecast board 96 (A+) teaser leg'),
S('spread','TB',3.5,'TB @ CIN','Forecast board 92 (A+)'),S('total',None,50.5,'TB @ CIN','Forecast board 92 (A+)','under'),
S('spread','IND',3.5,'BAL @ IND','Forecast board 89 (A)'),S('ml','IND',None,'BAL @ IND','Forecast board 89 (A)'),S('total',None,48,'BAL @ IND','Forecast board 89 (A)','over'),
S('total',None,41.5,'NYJ @ TEN','Forecast board 82 (B+)','under'),S('spread','TEN',-1.5,'NYJ @ TEN','Forecast board 82 (B+)'),
S('spread','PHI',-5.5,'WSH @ PHI','Forecast board 78 (contest only)'),
S('ml','JAX',None,'CLE @ JAX','Forecast board survivor #1'),S('spread','CLE',14.5,'CLE @ JAX','Forecast board teaser anchor'),
S('ml','DET',None,'NO @ DET','Forecast board survivor #2'),S('total',None,48.5,'NO @ DET','Forecast board','under'),
S('spread','ARI',10,'ARI @ LAC','Forecast board 91 (A+)'),
S('spread','MIA',3.5,'MIA @ LV','Forecast board 85 (A)'),S('total',None,40.5,'MIA @ LV','Forecast board 85 (A)','over'),
S('total',None,46.5,'GB @ MIN','Forecast board 84 (B+)','under'),S('spread','GB',7.5,'GB @ MIN','Forecast board teaser leg'),
S('ml','PIT',None,'ATL @ PIT','Forecast board survivor value'),
S('total',None,48.5,'DAL @ NYG','Forecast board best bet','under'),
S('spread','DEN',8.5,'DEN @ KC','Forecast board teaser leg'),S('total',None,43.5,'DEN @ KC','Forecast board','under'),
# AI official paper cards
P('Mike Evans','atd',1,'over','SF @ LAR','AI card: Melbourne SGP'),P('Christian McCaffrey','rush_yds',61,'over','SF @ LAR','AI card: Melbourne SGP'),
P('Kyle Juszczyk','rec_yds',4.5,'over','SF @ LAR','AI card: Melbourne SGP'),P('Brock Purdy','rush_yds',14.5,'over','SF @ LAR','AI card: Melbourne 4-leg'),
P('Jonathan Taylor','atd',1,'over','BAL @ IND','AI card: TD Trio'),P('Jalen Hurts','atd',1,'over','WSH @ PHI','AI card: TD Trio'),P('Omarion Hampton','atd',1,'over','ARI @ LAC','AI card: TD Trio'),
P('Zay Flowers','rec_yds',50,'over','BAL @ IND','AI card: Safe Floor'),P('Alec Pierce','rec_yds',44.5,'over','BAL @ IND','AI card: Safe Floor'),P('Sean Tucker','rush_yds',14.5,'over','TB @ CIN','AI card: Safe Floor'),
# Master prop card (AI-compiled from expert sources)
P('Matthew Stafford','pass_td',1.5,'over','SF @ LAR','Master prop card'),P('Christian McCaffrey','rec_yds',36.5,'over','SF @ LAR','Master prop card'),
P('Kyren Williams','rec_yds',10.5,'over','SF @ LAR','Master prop card'),P('Zay Flowers','rec_yds',64.5,'over','BAL @ IND','Master prop card'),
P('Jonathan Taylor','first_td',None,'over','BAL @ IND','Master prop card'),P('Geno Smith','int_thrown',0.5,'over','NYJ @ TEN','Master prop card'),
P('Omarion Hampton','rush_yds',65.5,'over','ARI @ LAC','Master prop card'),P('Tyler Shough','rush_yds',14.5,'over','NO @ DET','Master prop card'),
P('James Cook','first_td',None,'over','BUF @ HOU','Master prop card'),P('Dalton Kincaid','first_td',None,'over','BUF @ HOU','Master prop card'),
P('Parker Washington','first_td',None,'over','CLE @ JAX','Master prop card'),P('Rhamondre Stevenson','rush_yds',57.5,'over','NE @ SEA','Master prop card'),
P('Hunter Henry','rec_yds',34.5,'over','NE @ SEA','Master prop card'),P('A.J. Brown','atd',1,'over','NE @ SEA','Master prop card'),
P('A.J. Brown','rec_yds',62.5,'over','NE @ SEA','Master prop card'),P('Drake Maye','rush_yds',24.5,'over','NE @ SEA','Master prop card'),
P('Rashid Shaheed','rec_yds',40,'over','NE @ SEA','Master prop card'),P('DeMarcus Lawrence','sacks',0.5,'over','NE @ SEA','Master prop card'),
P('Jadarian Price','first_td',None,'over','NE @ SEA','Master prop card'),
]
PROJ={'NE@SEA':(25.5,25.1),'SF@LAR':(23.9,25.2),'CHI@CAR':(23.1,20.2),'BUF@HOU':(25.9,25.3),'TB@CIN':(22.3,23.6),'BAL@IND':(22.2,24.1),'NYJ@TEN':(17.4,19.9),'WSH@PHI':(20.7,24.0),'CLE@JAX':(16.3,24.2),'NO@DET':(19.1,23.1),'ARI@LAC':(21.3,23.4),'MIA@LV':(20.4,18.8),'GB@MIN':(23.5,21.5),'ATL@PIT':(19.2,20.5),'DAL@NYG':(22.6,20.1),'DEN@KC':(22.5,25.1)}
