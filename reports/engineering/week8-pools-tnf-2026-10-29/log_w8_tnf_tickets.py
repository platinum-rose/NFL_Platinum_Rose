import json
P='data/official-picks/user-placed-wagers-2026.json'
W=json.load(open(P,encoding='utf-8'))
ids={w['id'] for w in W}
TNF='10/29/2026 @ 05:15 PM'
CG='CAR @ GB'
NOTE=("Logged by Claude 2026-10-29 ~17:30 PT at Andy's request ('verify our parlay stacks and send them to the live tracker'). "
      "Slip text pasted by Andy in chat. Roster gate PASS (espn-full-rosters-latest 2026-10-29T15:40Z). "
      "3:47-3:53 PM PT inactives checked: all TNF players active.")
DKSRC='DK Predictions pick (no per-leg price on slip)'

def leg(n,key,game,player,team,opp,market,selection,line,price,start,ts,src,psrc=None,direction='over'):
    d={'leg_num':n,'game':game,'player':player,'team':team,'opponent':opp,'market':market,'selection':selection,
       'line':line,'price':price,'direction':direction,'game_start':start,'status':'PENDING','key':key,
       'target_stat':ts,'source':src}
    if psrc: d['price_source']=psrc
    return d

def tnf(n,k,player,team,market,sel,line,price,ts,src,psrc=None):
    return leg(n,k,CG,player,team,'CAR' if team=='GB' else 'GB',market,sel,line,price,TNF,ts,src,psrc)

SUN={'BAL @ BUF':'11/01/2026 @ 10:00 AM','ARI @ DAL':'11/01/2026 @ 10:00 AM','CLE @ PIT':'11/01/2026 @ 10:00 AM',
     'LAC @ LAR':'11/01/2026 @ 01:05 PM','PHI @ WSH':'11/01/2026 @ 05:20 PM','NE @ MIA':'11/01/2026 @ 01:25 PM',
     'TEN @ CIN':'11/01/2026 @ 10:00 AM','ATL @ TB':'11/01/2026 @ 10:00 AM','IND @ JAX':'11/01/2026 @ 10:00 AM',
     'KC @ DEN':'11/01/2026 @ 01:25 PM','MIN @ DET':'11/01/2026 @ 10:00 AM'}
def ml(n,k,game,team,opp,name,price):
    return leg(n,k,game,None,team,opp,'moneyline',f'{name} Moneyline',None,price,SUN[game],'moneyline','Bookmaker',direction=None)
def tot(n,k,game,side,line,price):
    return leg(n,k,game,None,None,None,'total',f'{side} {line}',line,price,SUN[game],'total_points','Bookmaker',direction=side.lower())
def atd(n,k,game,player,team,opp,price):
    return leg(n,k,game,player,team,opp,'anytime_touchdown',f'{player} Player To Score 1+ Touchdown',0.5,price,SUN[game],'touchdowns','Bookmaker')
def ptd(n,k,game,player,team,opp,price,start):
    return leg(n,k,game,player,team,opp,'passing_touchdowns',f'{player} 2+ Passing Touchdowns',1.5,price,start,'passing_tds','Bookmaker')

def base(id_,tn,placed,game,title,book,ttype,cat,funding,stake,odds_am,odds_dec,profit,payout,legs,notes,source,needs,promo=None,url=None):
    d={'id':id_,'ticket_number':tn,'book_ticket_number':tn,'placed_at':placed,'date':'2026-10-29','season':2026,'week':8,
       'game':game,'game_title':title,'book':book,'ticket_type':ttype,'category':cat,'funding_type':funding,
       'is_promo_credit':funding=='promo_credit','cash_risk_usd':0 if funding=='promo_credit' else stake,'stake_usd':stake,
       'units':round(stake/10,3),'odds_american':odds_am,'odds_decimal':odds_dec,'potential_profit_usd':profit,
       'potential_payout_usd':payout,'status':'PENDING','result':None,'is_split':False,'split_partner':None,
       'external_url':url,'needs_confirmation':needs,'progress_notes':notes+' '+NOTE,'platinum_rose_source':source,'legs':legs}
    if promo: d['promotion']=promo
    return d

new=[]
# 1 DK 6-pick
L=[tnf(1,'leg_dkp_w8tnf6_1_hubbard_atd','Chuba Hubbard','CAR','anytime_touchdown','Chuba Hubbard Anytime TD Scorer',0.5,None,'touchdowns','DK Predictions board',DKSRC),
   tnf(2,'leg_dkp_w8tnf6_2_mckinney_ta','Xavier McKinney','GB','tackles_assists','Xavier McKinney 4+ Tackles + Assists',3.5,None,'tackles_combined','DK Predictions board',DKSRC),
   tnf(3,'leg_dkp_w8tnf6_3_jacobs_carries','Josh Jacobs','GB','carries','Josh Jacobs 15+ Rushing Attempts',14.5,None,'carries','DK Predictions board',DKSRC),
   tnf(4,'leg_dkp_w8tnf6_4_young_int','Bryce Young','CAR','pass_interceptions','Bryce Young 1+ Interceptions Thrown',0.5,None,'interceptions_thrown','DK Predictions board',DKSRC),
   tnf(5,'leg_dkp_w8tnf6_5_kraft_rec','Tucker Kraft','GB','receptions','Tucker Kraft 4+ Receptions',3.5,None,'receptions','DK Predictions board',DKSRC),
   tnf(6,'leg_dkp_w8tnf6_6_watson_rec','Christian Watson','GB','receptions','Christian Watson 5+ Receptions',4.5,None,'receptions','DK Predictions board',DKSRC)]
new.append(base('bet_20261029_dkp_tnf_6pick_car_gb_boost30',None,'2026-10-29T15:53:00-07:00','CAR @ GB (TNF)',
 'DraftKings Predictions 6-Pick Combo (3.4%), TNF CAR @ GB, 30% profit boost: Hubbard ATD, McKinney 4+ T+A, Jacobs 15+ carries, Young 1+ INT, Kraft 4+ rec, Watson 5+ rec',
 'DraftKings Predictions','N-Pick Combo Contract (Event Trading)','Prop/Prediction Market','promo_credit',10.0,'+3458',35.58,345.80,355.80,L,
 'Andy 2026-10-29 15:53 PT: DK Predictions 6 Pick Combo 3.4%, Total $10, payout $276 -> $355.80 with +30% boost. Funding per Andy rule: DK Predictions = promo credit.',
 'Claude Island ladder S1/S2 + Andy own build',['DK position number','placed_at (approx)'],promo='30% profit boost (base payout $276.00)'))
# 2 BEO 4-leg, ticket 1010127424
K='1010127424'
L=[tnf(1,f'leg_{K}_1','Jordan Love','GB','pass_interceptions','Jordan Love Over 0.5 Pass Interceptions',0.5,'-127','interceptions_thrown','BetOnline'),
   tnf(2,f'leg_{K}_2','Lukas Van Ness','GB','sacks','Lukas Van Ness Over 0.5 Sacks',0.5,'+140','sacks','BetOnline'),
   tnf(3,f'leg_{K}_3','Jalen Coker','CAR','anytime_touchdown','Jalen Coker 1+ Touchdowns',0.5,'+190','touchdowns','BetOnline'),
   tnf(4,f'leg_{K}_4','Darren Waller','CAR','receiving_yards','Darren Waller Over 21.5 Receiving Yards',21.5,'-117','receiving_yards','BetOnline')]
new.append(base(f'bet_20261029_beo_{K}_prop4_tnf_car_gb',K,'2026-10-29T16:48:00-07:00','CAR @ GB (TNF)',
 'Week 8 TNF BEO 4-leg prop parlay (Love o0.5 INT, Van Ness o0.5 sacks, Coker ATD, Waller o21.5 rec yds)','BetOnline','Future/Prop (4 legs)','Prop Parlay','cash',6.02,'+2300',24.0,138.46,144.48,L,
 f'Andy 2026-10-29 16:48 PT slip; account record 17:25 PT: ticket {K}, $6.02 to win $138.46, Future/Prop.','Claude Island ladder S4 (rebuilt on 3:59 PM BEO SGP board)',['funding_type (assumed cash)','placed_at (approx)']))
# 3 BEO 8-leg $5, ticket 1010107890
K='1010107890'
L=[tnf(1,f'leg_{K}_1','Chuba Hubbard','CAR','anytime_touchdown','Chuba Hubbard 1+ Touchdowns',0.5,None,'touchdowns','BetOnline'),
   tnf(2,f'leg_{K}_2','Christian Watson','GB','receptions','Christian Watson Over 4.5 Receptions',4.5,None,'receptions','BetOnline'),
   tnf(3,f'leg_{K}_3','Christian Watson','GB','anytime_touchdown','Christian Watson 1+ Touchdowns',0.5,None,'touchdowns','BetOnline'),
   tnf(4,f'leg_{K}_4','Bryce Young','CAR','pass_interceptions','Bryce Young Over 0.5 Pass Interceptions',0.5,None,'interceptions_thrown','BetOnline'),
   tnf(5,f'leg_{K}_5','Josh Jacobs','GB','anytime_touchdown','Josh Jacobs 1+ Touchdowns',0.5,None,'touchdowns','BetOnline'),
   tnf(6,f'leg_{K}_6','Jalen Coker','CAR','anytime_touchdown','Jalen Coker 1+ Touchdowns',0.5,None,'touchdowns','BetOnline'),
   tnf(7,f'leg_{K}_7','Tetairoa McMillan','CAR','receiving_yards','Tetairoa McMillan 66+ Receiving Yards',65.5,None,'receiving_yards','BetOnline'),
   tnf(8,f'leg_{K}_8','John Metchie III','CAR','receptions','John Metchie III Over 1.5 Receptions',1.5,None,'receptions','BetOnline')]
new.append(base(f'bet_20261029_beo_{K}_prop8_tnf_car_gb',K,None,'CAR @ GB (TNF)',
 'Week 8 TNF BEO 8-leg prop parlay (Hubbard ATD, Watson o4.5 rec, Watson ATD, Young o0.5 INT, Jacobs ATD, Coker ATD, McMillan 66+ rec yds, Metchie o1.5 rec)','BetOnline','Future/Prop (8 legs)','Prop Parlay','cash',5.0,'+9800',99.0,490.0,495.0,L,
 f'Andy 2026-10-29 17:25 PT: account record ticket {K}, $5.00 to win $490.00, Future/Prop, accepted 10/29/26. Not discussed earlier in session; placed time unknown.','Andy own build',['funding_type (assumed cash)','placed_at unknown','per-leg prices']))
# 4 BEO SGP 8-leg insured, ticket 1010136110
K='1010136110'
L=[tnf(1,f'leg_{K}_1','Christian Watson','GB','anytime_touchdown','Christian Watson Score anytime',0.5,None,'touchdowns','BetOnline'),
   tnf(2,f'leg_{K}_2','Chuba Hubbard','CAR','anytime_touchdown','C. Hubbard Score anytime',0.5,None,'touchdowns','BetOnline'),
   tnf(3,f'leg_{K}_3','Darren Waller','CAR','receiving_yards','D. Waller 15+ Receiving yds',14.5,None,'receiving_yards','BetOnline'),
   tnf(4,f'leg_{K}_4','Trey Smack','GB','field_goals_made','Trey Smack 1+ Field goals',0.5,None,'field_goals_made','BetOnline'),
   tnf(5,f'leg_{K}_5','Chuba Hubbard','CAR','receiving_yards','C. Hubbard 10+ Receiving yds',9.5,None,'receiving_yards','BetOnline'),
   tnf(6,f'leg_{K}_6','Josh Jacobs','GB','rushing_receiving_yards','J. Jacobs 70+ Rushing + Receiving yds',69.5,None,'rushing_receiving_yards','BetOnline'),
   tnf(7,f'leg_{K}_7','Bryce Young','CAR','pass_interceptions','Bryce Young 1+ Pass interceptions',0.5,None,'interceptions_thrown','BetOnline'),
   tnf(8,f'leg_{K}_8','John Metchie III','CAR','receiving_yards','John Metchie III 15+ Receiving yds',14.5,None,'receiving_yards','BetOnline')]
new.append(base(f'bet_20261029_beo_{K}_sgp8_tnf_car_gb',K,'2026-10-29T17:12:00-07:00','CAR @ GB (TNF)',
 'Week 8 TNF BEO SGP 8-leg (Watson ATD, Hubbard ATD, Waller 15+, Smack 1+ FG, Hubbard 10+ rec yds, Jacobs 70+ R+R, Young 1+ INT, Metchie 15+)','BetOnline','Same Game Parlay (8 Legs)','Prop Parlay','cash',10.0,'+2800',29.0,280.0,290.0,L,
 f'Andy 2026-10-29 17:12 PT: BetOnline SGP ticket {K}, $10 to win $280, accepted 10/30/26 (server date), Parlay Insurance eligible per Andy.','Andy own build from Claude quick-hit legs',
 ['funding_type (assumed cash)','insurance terms/opt-in','per-leg prices'],promo='BetOnline Primetime Parlay Insurance (Andy: eligible; terms not verified)'))
# 5 BKR 11-team
K='740983886'
L=[tnf(1,f'leg_{K}_1','Josh Jacobs','GB','anytime_touchdown','Josh Jacobs Player To Score 1+ Touchdown',0.5,'-164','touchdowns','Bookmaker'),
   ml(2,f'leg_{K}_2','BAL @ BUF','BUF','BAL','Buffalo Bills','-174'), ml(3,f'leg_{K}_3','ARI @ DAL','DAL','ARI','Dallas Cowboys','-292'),
   ml(4,f'leg_{K}_4','CLE @ PIT','PIT','CLE','Pittsburgh Steelers','-188'), ml(5,f'leg_{K}_5','LAC @ LAR','LAR','LAC','Los Angeles Rams','-280'),
   ml(6,f'leg_{K}_6','PHI @ WSH','WSH','PHI','Washington Commanders','-255'), ml(7,f'leg_{K}_7','NE @ MIA','NE','MIA','New England Patriots','-320'),
   atd(8,f'leg_{K}_8','TEN @ CIN',"Ja'Marr Chase",'CIN','TEN','-126'), atd(9,f'leg_{K}_9','ATL @ TB','Bucky Irving','TB','ATL','-130'),
   tot(10,f'leg_{K}_10','IND @ JAX','Under',47.5,'-131'), tot(11,f'leg_{K}_11','KC @ DEN','Under',42,'-131')]
L[8]['selection']="Mar'Keise (Bucky) Irving Player To Score 1+ Touchdown"
new.append(base(f'bet_20261029_bkr_{K}_11team_weekend_parlay',K,'2026-10-29T16:57:00-07:00','Week 8 multi-game (TNF + Sunday, SNF cap)',
 'BKR 11-team weekend parlay: Jacobs ATD (TNF), BUF/DAL/PIT/LAR/NE ML, WSH ML (SNF cap), Chase ATD, Irving ATD, IND-JAX u47.5, KC-DEN u42','Bookmaker','11 Teams Parlay','Parlay','cash',10.0,'+12656',127.56,1265.60,1275.60,L,
 f'Andy 2026-10-29 16:57 PT: Bookmaker 1 parlay of 11 teams, ticket {K}, risk $10.00 win $1,265.60. BKR accepted multi-game player props.','Claude weekend parlay proposal (11-leg revision)',
 ['funding_type (assumed cash)','placed_at (approx)','Sunday game_start entered in PT'],url=f'https://be.bookmaker.eu/#ticket_{K}'))
# 6 BKR 10-team
K='740984963'
L=[ptd(1,f'leg_{K}_1',CG,'Jordan Love','GB','CAR','-171',TNF), ml(2,f'leg_{K}_2','MIN @ DET','DET','MIN','Detroit Lions','-177'),
   tot(3,f'leg_{K}_3','LAC @ LAR','Over',43,'-145'), atd(4,f'leg_{K}_4','IND @ JAX','Bhayshul Tuten','JAX','IND','-130'),
   tot(5,f'leg_{K}_5','CLE @ PIT','Under',40.5,'-133'), atd(6,f'leg_{K}_6','NE @ MIA','Rhamondre Stevenson','NE','MIA','-171'),
   tot(7,f'leg_{K}_7','BAL @ BUF','Over',53,'-132'), tot(8,f'leg_{K}_8','ATL @ TB','Under',46,'-147'),
   ptd(9,f'leg_{K}_9','TEN @ CIN','Joe Burrow','CIN','TEN','-386',SUN['TEN @ CIN']), ml(10,f'leg_{K}_10','PHI @ WSH','WSH','PHI','Washington Commanders','-255')]
new.append(base(f'bet_20261029_bkr_{K}_10team_weekend_parlay',K,'2026-10-29T17:07:00-07:00','Week 8 multi-game (TNF + Sunday, SNF cap)',
 'BKR 10-team weekend parlay: Love 2+ pass TD (TNF), DET ML, LAC-LAR o43, Tuten ATD, CLE-PIT u40.5, Stevenson ATD, BAL-BUF o53, ATL-TB u46, Burrow 2+ pass TD, WSH ML (SNF cap)','Bookmaker','10 Teams Parlay','Parlay','cash',10.0,'+10555',106.55,1055.54,1065.54,L,
 f'Andy 2026-10-29 17:08 PT: Bookmaker 10 teams parlay ticket {K}, placed 17:07 PT, risk $10.00 win $1,055.54.','Claude second weekend parlay proposal (9-leg) + Andy edits',
 ['funding_type (assumed cash)','Burrow 2+ at -386 exceeds -350 leg barrier (flagged)'],url=f'https://be.bookmaker.eu/#ticket_{K}'))
# 7 DK 7-pick
L=[tnf(1,'leg_dkp_w8tnf7_1_vanness_sack','Lukas Van Ness','GB','sacks','Lukas Van Ness 0.5+ Total Sacks',0.5,None,'sacks','DK Predictions board',DKSRC),
   tnf(2,'leg_dkp_w8tnf7_2_mckinney_ta','Xavier McKinney','GB','tackles_assists','Xavier McKinney 4+ Tackles + Assists',3.5,None,'tackles_combined','DK Predictions board',DKSRC),
   tnf(3,'leg_dkp_w8tnf7_3_young_ptd','Bryce Young','CAR','passing_touchdowns','Bryce Young 2+ Passing Touchdowns',1.5,None,'passing_tds','DK Predictions board',DKSRC),
   tnf(4,'leg_dkp_w8tnf7_4_jacobs_atd','Josh Jacobs','GB','anytime_touchdown','Josh Jacobs Anytime TD Scorer',0.5,None,'touchdowns','DK Predictions board',DKSRC),
   tnf(5,'leg_dkp_w8tnf7_5_golden_atd','Matthew Golden','GB','anytime_touchdown','Matthew Golden Anytime TD Scorer',0.5,None,'touchdowns','DK Predictions board',DKSRC),
   tnf(6,'leg_dkp_w8tnf7_6_mcmillan_rec','Tetairoa McMillan','CAR','receptions','Tetairoa McMillan 6+ Receptions',5.5,None,'receptions','DK Predictions board',DKSRC),
   tnf(7,'leg_dkp_w8tnf7_7_metchie_rec','John Metchie III','CAR','receptions','John Metchie III 2+ Receptions',1.5,None,'receptions','DK Predictions board',DKSRC)]
new.append(base('bet_20261029_dkp_tnf_7pick_car_gb_boost20',None,'2026-10-29T17:14:00-07:00','CAR @ GB (TNF)',
 'DraftKings Predictions 7-Pick Combo (3.5%), TNF CAR @ GB, 20% profit boost: Van Ness sack, McKinney 4+ T+A, Young 2+ pass TD, Jacobs ATD, Golden ATD, McMillan 6+ rec, Metchie 2+ rec',
 'DraftKings Predictions','N-Pick Combo Contract (Event Trading)','Prop/Prediction Market','promo_credit',9.98,'+3102',32.02,309.62,319.60,L,
 'Andy 2026-10-29 17:14 PT: DK Predictions 7 Pick Combo 3.5%, Total $9.98, payout $268 -> $319.60 with +20% boost. Funding per Andy rule: promo credit.',
 'Andy own build (moonshot request; legs overlap Claude ladder)',['DK position number','placed_at (approx)'],promo='20% profit boost (base payout $268.00)'))

added=0
for n in new:
    if n['id'] in ids:
        print('SKIP existing',n['id']); continue
    W.append(n); added+=1
json.dump(W,open(P,'w',encoding='utf-8'),indent=2,ensure_ascii=False)
print('added',added,'total',len(W))
