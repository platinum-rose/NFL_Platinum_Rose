import json
SRC1='Friday 10/30 fair-line blend and simulator: reports/intel/w08-model/fair-lines-w08.json (AN consensus Fri ~3:40 PM PT moved 35% toward SRS baseline; margin-simulator.mjs) and digest scratch/w08-synthesis-digest-sat.md.'
SRC2='Friday 10/30 market and news write-up: reports/intel/master-intel-narratives-2026-w08.md (AN splits Fri ~3:40 PM PT, AN openers Sun 10/25 5 PM PT, ESPN Friday injury designations, BKR Thu 10/29 4 PM PT board).'
master={"schema":"master_pitches_v1","season":2026,"week":8,"built_at":"2026-10-30T15:50:00-07:00",
 "note":"The Pitch and The Pushback for every Platinum Rose straight-bet recommendation. Keys are GAME|Side or GAME|Total and must match digest section C.",
 "picks":{"MIN@DET|Side":{"pick":"MIN +3.5 (BKR +3 +102)",
  "pitch":[
   {"text":"The number: Friday's blend makes Detroit only a 0.4-point favorite, so +3.5 carries a 3.1-point edge and protects the key number 3. The simulator has Minnesota covering 58.1% at +3.5 (Friday snapshot, not a fresh run). Bookmaker's Thursday board had MIN +3 at +102; the consensus +3.5 is the better number.","ref":[1]},
   {"text":"The matchup: Minnesota is 6-0, first in SRS (8.5) and in net points (+8.5 a game), while Detroit is 4-2 at a 1.7 SRS. Kyler Murray gets a Lions secondary rated high-vulnerability with safety Kerby Joseph out, which is where Justin Jefferson, Jordan Addison and T.J. Hockenson line up. Minnesota's only Friday designation is safety Jay Ward (questionable).","ref":[1,2]},
   {"text":"Who agrees: Sharp or Square takes MIN +3.5, and Even Money uses Minnesota as a teaser leg. Spread money is close to even (49% of money on Minnesota against 58% of bets), so there is no sharp flag on either side.","ref":[2]}],
  "pushback":[
   {"text":"Detroit's path: Jared Goff at home with Amon-Ra St. Brown and Jahmyr Gibbs, neither carrying a Friday designation after practicing in full Thursday. A Gibbs-led early lead turns this into a one-touchdown Lions win, and the market has priced Detroit as the better team despite the records.","ref":[2]},
   {"text":"Who disagrees: Action Network, BettingPros and Even Money all list Lions -3. The line moved from the Action Network open of 3 to 3.5 toward Detroit, and 51% of spread money sits on Detroit with 42% of bets, a nine-point lean that is short of a flag but points the other way.","ref":[2]},
   {"text":"Limits: the edge comes from an SRS baseline built on six or seven games per team; it ignores schedule strength and injuries, so the 58.1% is a rough Friday figure, not high confidence. Thursday's Bookmaker parlay 740984963 also carries Detroit's moneyline, so this single partly offsets it.","ref":[1,3]}],
  "sources":{"1":SRC1,"2":SRC2,"3":"Live ticket 740984963: reports/bets/2026-w08-card.md section 5."}}}}
json.dump(master,open('reports/intel/master-pitches-2026-w08.json','w'),indent=1)

def P(game,pitch,push): return {"game":game,"pitch":[{"text":t,"ref":r} for t,r in pitch],"pushback":[{"text":t,"ref":r} for t,r in push]}
sc={"schema":"supercontest_pitch_v1","season":2026,"week":8,"as_of":"Friday 2026-10-30 evidence review",
 "method":"Explains the Dashboard AI proposal using the Friday fair-line blend [1] and the Friday market/news write-up [2]. Simulator figures are Friday snapshots; projections are not cover probabilities.",
 "picks":{
 "CIN":P("TEN@CIN",[
   ("The number is the case: the contest froze CIN at -10.5 on Thursday, and the market has since moved to -12.5 after Carnell Tate was ruled out. That is two points of line value before any opinion, and Friday's blend puts fair at CIN -15.0, which leaves 4.5 points of room against the contest number.",1),
   ("The matchup supports it. Cincinnati is 4-2 with an 8.2 SRS, third in the league; Tennessee is 1-6 at -9.8 and plays without Tate and Tyjae Spears, with Calvin Ridley questionable. Joe Burrow and Ja'Marr Chase face a Titans defense thinned by a midseason trade of its top interior lineman. BettingPros took Cincinnati at -10 and -10.5.",[1,2])],
  [("Double-digit favorites concede late scores. Cam Ward still has Wan'Dale Robinson and Elic Ayomanor, and Cincinnati is missing Kyle Dugger in the secondary; two explosive plays and a garbage-time touchdown make an 11-point game, which still covers -10.5 but leaves little cushion.",2),
   ("Even Money's Titans +10 is an earlier, teaser-style dissent. The 4.5 points of room come from an SRS baseline that cannot see injuries or schedule strength, so treat it as a rough Friday figure. Most of the move already happened on Tate's news, which the contest number captures.",[1,2])]),
 "JAX":P("IND@JAX",[
   ("The contest gives JAX -9.5 against a market of -10 and a fair line of JAX -11.4, so the pick has 1.9 points of room and stays below 10. The Action Network open was -7.5, and the market has moved 2.5 points toward Jacksonville since.",1),
   ("Trevor Lawrence faces an Indianapolis secondary rated high-vulnerability with cornerback Justin Walley out, which suits Brian Thomas Jr. and Parker Washington. Jacksonville is 4-2 with an 8.4 SRS, second in the league; Indianapolis is 2-5 at -4.1. BettingPros backed Jacksonville at -7.5 earlier in the week.",[1,2])],
  [("Jacksonville leans on one back, Bhayshul Tuten, and Jakobi Meyers is questionable. If Daniel Jones keeps the game short with Josh Downs underneath, a 24–17 result lands under the number.",2),
   ("The edge is modest: 1.9 points of room from a baseline with six or seven games per team. Spread money leans Jacksonville (65% of money, 55% of bets) but not by enough to flag, and most of the 2.5-point move is already priced in.",[1,2])]),
 "MIN":P("MIN@DET",[
   ("Minnesota +3.5 in the contest matches the market, and Friday's blend makes fair DET -0.4: 3.1 points of room, with the key number 3 protected. The simulator has Minnesota covering 58.1% at +3.5. It is the week's only Platinum Rose side.",1),
   ("Minnesota is 6-0, first in SRS (8.5) and net points (+8.5 a game). Kyler Murray gets a Detroit secondary rated high-vulnerability without Kerby Joseph, which is where Justin Jefferson, Jordan Addison and T.J. Hockenson line up. Sharp or Square takes MIN +3.5.",[1,2])],
  [("Detroit is at home with Jared Goff, Amon-Ra St. Brown and Jahmyr Gibbs, none carrying a Friday designation. Action Network, BettingPros and Even Money list Lions -3, and the line moved from the 3 open to 3.5 toward Detroit.",2),
   ("Spread money is 51% on Detroit with 42% of bets, a mild lean the other way. The 58.1% is a Friday snapshot built on an SRS baseline that ignores schedule strength, so it is a moderate edge, not a certainty.",[1,2])]),
 "DAL":P("ARI@DAL",[
   ("DAL -6.5 in the contest sits a half-point under the market's -7 and under the key number 7. Friday's blend puts fair at DAL -8.2, so the pick has 1.7 points of room, and a seven-point Dallas win covers here but only pushes at the book.",1),
   ("Arizona is 2-5 at -9.7, near the bottom of the league by SRS, and plays without defensive tackle Walter Nolen III. Dak Prescott and CeeDee Lamb face a medium-tier Arizona secondary. Even Money took Dallas -6.5.",[1,2])],
  [("Heavy money is on Arizona to win outright (73% of the money on 10% of those bets), and Sharp or Square took ARI +6.5. George Pickens is questionable and KaVontae Turpin is out, which thins Dallas' receiving group behind Lamb.",2),
   ("1.7 points of room is a small edge from a rough Friday baseline. Jacoby Brissett protecting the ball and Trey McBride winning his matchup is a realistic path to a 27–24 game.",[1,2])]),
 "BAL":P("BAL@BUF",[
   ("The contest gives BAL +3.5 while the market has moved to +3, so the pick gains a half-point and the hook over the key number 3. 63% of spread money is on Baltimore with 44% of bets, a big-money flag, and the line fell from the 3.5 open to 3.",2),
   ("Four named voices back Baltimore at +3.5: Warren Sharp, Sharp or Square, Even Money and BettingPros. Lamar Jackson is a full go, while Buffalo lists DJ Moore, Dalton Kincaid and right tackle Spencer Brown as questionable, and Josh Allen faces a Baltimore secondary missing Jaylinn Hawkins.",2)],
  [("Friday's blend disagrees: fair BUF -4.0 leaves Baltimore half a point short at +3.5. Buffalo is 5-1 with a 3.3 SRS; Baltimore is 4-3 at -0.9. That is why BAL is the fifth pick, not a Platinum Rose side.",1),
   ("One BettingPros row has BUF -3.5. If Moore and Kincaid both play, Buffalo's discount disappears, and Allen's running can turn this into a seven-point Bills win.",[1,2])]),
 "CHI":P("CHI@SEA",[
   ("CHI +3 matches the market and Friday's blend makes fair SEA -1.7, 1.3 points of room. The line has held at the -3 open for Monday night.",1),
   ("Chicago is 5-2 with a 6.8 SRS, fourth in the league, against Seattle at 4.6. Seattle's left tackle Charles Cross is doubtful and its defensive front has several questionable players. Action Network and Even Money took CHI +3.5.",[1,2])],
  [("Sharp or Square took SEA -3 and Warren Sharp backs Seattle. Spread money is split 50–50 while 60% of bets are on Chicago, so the money leans Seattle relative to the tickets.",2),
   ("It is an alternate because the room is only 1.3 points, and Monday's injury report on Cross and Colston Loveland can move it before kickoff.",[1,2])]),
 "PHI":P("PHI@WAS",[
   ("PHI +5.5 in the contest against a market of +6; Friday's blend before injuries makes fair WAS -4.3, so the pick keeps 1.2 points of room even after giving up the half-point.",1),
   ("Heavy money backs Philadelphia to win outright (68% of the money on 17% of those bets), and Action Network took the Eagles +6. The teams are nearly even by SRS (WAS -7.7, PHI -7.4).",2)],
  [("The line moved from WAS -3.5 to -6 because DeVonta Smith, Dontayvion Wicks and Britain Covey are out at receiver and cornerback Jonathan Jones and linebacker Jihaad Campbell are out too. The baseline cannot see any of that, so the 1.2 points are probably overstated.",[1,2]),
   ("BettingPros took WAS -3.5 earlier, and Washington's Stefon Diggs draws a medium-tier Philadelphia secondary. It is an alternate because the contest number is worse than the market.",2)]),
 "LAR":P("LAC@LAR",[
   ("LAR -6.5 matches the market, and Friday's blend makes fair LAR -8.2, 1.7 points of room. The Chargers are 0-6 with the league's worst SRS (-10.1).",1),
   ("The Chargers' secondary is missing two starters, Derwin James Jr. and Deane Leonard, which rates Matthew Stafford to Puka Nacua as the slate's clearest passing mismatch. The Rams are 3-4 but carry a -0.4 SRS against the Chargers' -10.1, a gap of nearly 10 points before home field.",[1,2])],
  [("The line moved from the 7.5 open to 6.5 while 70% of bets sat on the Rams, reverse line movement against this side. No named expert backs the Rams.",2),
   ("Justin Herbert can still produce a late backdoor score with Ladd McConkey, and Trent McDuffie is questionable for the Rams. It is an alternate because the market has moved a full point away from it, from 7.5 to 6.5, and the 1.7 points of room rest on a rough Friday baseline.",[1,2])])}}
json.dump(sc,open('reports/intel/supercontest-pitches-2026-w08.json','w'),indent=1)
print('ok')
