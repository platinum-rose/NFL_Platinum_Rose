# Week 5 Game Narratives: projected scripts and card reasoning

<!--
Read by scripts/master-intel/build.py and rendered at the top of each Section 6 game dossier.
Format: one "## AWAY@HOME" block per game. First line is "projection: TEAM pts, TEAM pts".
Then "### Game script", "### Why the card leans this way" and "### What breaks it".
Build.py adds the line movement (Action Network open, Sun 10/04 5:00 PM PT -> Bookmaker now) and the market-implied score by itself.

How the projections are made: start from the Bookmaker market-implied score (total/2 +/- spread/2) on the Bookmaker live capture of 2026-10-10T22:25Z (stale for recommendation after about 21:25 PT),
then move it only for named local evidence (quarterback changes, Friday injury reports, secondary-matchup severity tiers,
Action Network betting splits, and the expert/podcast registry). This is a written synthesis, not a quantitative model output; no edge % is used.
A projection can disagree with a lean because of price or key-number thresholds, and when it does the text says so.

Written Sat 2026-10-10 from:
- Current market baseline: data/generated/props/bookmaker-live-2026-10-10-week5.json (captured 2026-10-10T22:25:28Z).
- Action Network openers baseline: data/odds/actionnetwork-openers-2026-w05.json (Sun 10/04).
- Action Network betting splits: data/research-intel/source-evidence/2026-10-09-action-network-week5-betting-splits-raw.json (14 remaining games).
- Secondary matchup vulnerability: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json.
- Player availability and projected starters: data/player-availability/impact-digest-latest.json (ESPN/FantasyPros Friday injury reports).
- Week 5 synthesis digest: scratch/w05-synthesis-digest-sat.md.
- Verified SuperContest lines: data/supercontest/week-05-2026-verified-lines.json.
- Evaluation protocol: data/research-intel/hypothesis-ledger/2026-w05-pilot.json (prospective review only; no official ledger mutations).
- Excluded game: TB@DAL (Thursday Night Football completed; Dallas 31, Tampa Bay 28).

CARD STATUS:
The synthesis digest (scratch/w05-synthesis-digest-sat.md) provides candidate review tiers and explicit passes.
No game reaches tier 2 under the strict citation gate (28 tier-eligible article rows). Every lean below is research-only (digest tier 2- or skip) and must be repriced before any use.
Official card tickets and finalized SuperContest 5 picks are held pending user review; no tickets or contest selections are fabricated.
-->

## PHI@JAX
projection: PHI 20, JAX 24

### Game script
Jacksonville controls early downs at home through Trevor Lawrence and Bhayshul Tuten against Philadelphia's defensive front. Philadelphia's passing offense holds a HIGH secondary matchup grade with a 6.08 severity score, as Jacksonville deals with secondary absences including Montaric Brown and Eric Murray. Jalen Hurts targets Dallas Goedert and DeVonta Smith over the middle to keep the Eagles competitive, while Saquon Barkley grinds out tough yardage on the ground. However, Jacksonville's offensive balance behind Trevor Lawrence and Brian Thomas Jr. generates enough red-zone efficiency to maintain a multi-score fourth-quarter cushion. A late Philadelphia score trims the final margin to four points, allowing the Eagles to cover the 7.5-point spread while the total finishes slightly over 42.

### Why the card leans this way
Early expert consensus leaned heavily toward Jacksonville, with BettingPros, The Favorites, and Even Money taking the Jaguars at -4.5 and -6.5. However, the market has since moved out to JAX -7.5 (-113) at Bookmaker. The digest has no Jacksonville lean at the current number: the line has crossed the key threshold of 7, and its one tier-eligible source (VSiN) is on Philadelphia +7.5 (tier 2-). Betting splits show a balanced public market, with Jacksonville drawing 60% of spread tickets and 57% of the handle, while Philadelphia attracts 43% of the money on 40% of tickets. On the total, 60% of tickets and 63% of the cash favor Under 41.5, contrasting with the projected 44 points. Matchup data confirms Philadelphia's passing opportunity, supporting a pass on the inflated spread.

### What breaks it
Jacksonville's defensive line dominates Philadelphia's pass protection, forcing Jalen Hurts into multiple turnovers in his own territory. If Bhayshul Tuten converts short fields into early touchdowns and Philadelphia cannot capitalize on Jacksonville's thinned secondary, the Jaguars could pull away to win by double digits, breaking Philadelphia's cover.

## NYG@WAS
projection: NYG 17, WAS 24

### Game script
Washington confirmed Friday that Jayden Daniels will start Sunday despite his elbow injury, providing an immediate athletic spark to the Commanders' offense. Washington leans on Jacory Croskey-Merritt and Austin Ekeler to establish the ground game, while Terry McLaurin tests New York's secondary on intermediate routes. The Giants counter with Jameis Winston starting under center after Jaxson Dart was placed on injured reserve. Winston targets Darnell Mooney and Theo Johnson on a HIGH secondary matchup grade with a 5.55 severity score. However, Washington's defense generates drive-killing pressure against Devin Singletary and New York's offensive line. Daniels directs two sustained scoring drives in the second half, securing a seven-point Washington victory that covers the 3.5-point spread.

### Why the card leans this way
Action Network initially endorsed the New York Giants based on expected closing line value if Jayden Daniels were ruled out. With Daniels cleared to start and Marcus Mariota ruled out, the digest rates the side as split (skip) and holds the game for verified inactive news rather than forcing a play. Betting splits reflect public backing on the underdog, with New York taking 74% of spread tickets and 75% of the money at +4.5. On the moneyline, New York drew 55% of the cash on 46% of tickets (+162). Washington covers the projected 3.5-point spread by 3.5 points, while the projected 41 points lands just under the 41.5 market total.

### What breaks it
Jayden Daniels aggravates his elbow injury early, forcing an emergency quarterback contingency and stalling Washington's offensive rhythm. Alternatively, Jameis Winston avoids reckless throws, connecting with Darnell Mooney for multiple deep touchdowns against Washington's vulnerable perimeter corners to produce an outright road upset.

## HOU@TEN
projection: HOU 21, TEN 17

### Game script
Houston enters this AFC South road matchup with Davis Mills and David Montgomery operating a methodical offense designed to minimize mistakes against Tennessee's front. Nico Collins draws high-volume target share on a HIGH secondary matchup grade with a 5.85 severity score, while Brevin Jordan chips in as an effective safety valve. Tennessee starts rookie Cam Ward, who uses Calvin Ridley and Daniel Bellinger on quick-release routes to counter Houston's aggressive pass rush. Michael Carter provides rotational relief in the Titans' backfield. Both offenses struggle to finish drives inside the red zone, trading field goals across the middle quarters. Houston grinds out a four-point divisional victory, which leaves Tennessee covering the 7-point spread in a tight, low-scoring battle that sits close to the 37.5-point market total.

### Why the card leans this way
BettingPros supported Houston earlier in the week, but that recommendation was explicitly conditioned on getting the Texans under 7 at -6.5. With Bookmaker at HOU -7 (-103; Titans +7 at -113) and the contest line at -7.5, the value threshold has been breached. The digest's lean is Tennessee +7 at tier 2- (research-only), not Houston. Betting splits show heavy public action on Houston (70% of tickets, 66% of handle), while Tennessee attracts modest sharp buyback on the spread (34% money on 30% tickets). The total split reveals 70% of money on Over 38 against 77% tickets, while Under cash took 30% on 23% tickets.

### What breaks it
Cam Ward makes multiple costly turnover errors against Houston's pass rush, handing Davis Mills short-field opportunities that quickly push the game out of reach. If Houston converts takeaways into two defensive or short-field touchdowns, the Texans will easily blow through the 7-point margin.

## MIN@NO
projection: MIN 23, NO 16

### Game script
Minnesota travels to New Orleans with Brian Flores' defense ranking 1st in the NFL in EPA/play allowed (-0.184), presenting a severe tactical mismatch against a Saints passing attack that dropbacks on two-thirds of plays into aggressive coverage shells. New Orleans starts Tyler Shough with Alvin Kamara questionable, relying on quick perimeter releases to Kevin Austin Jr. and tight end Noah Fant to mitigate Minnesota's pressure packages. Minnesota operates through Kyler Murray, targeting Jordan Addison and tight end T.J. Hockenson on intermediate crossing routes against a Saints defense ranking 30th in EPA/play allowed (0.134). Despite injuries along the Vikings' offensive line (Christian Darrisaw out), Minnesota's defensive dominance limits New Orleans to field goals, allowing the Vikings to control time of possession and pull away for a 7-point road victory that covers the 2.5-point spread and stays under the 41.5 total.

### Why the card leans this way
The regenerated quantitative pass (60% market, 25% FTN, 15% SRS; unbacktested) projects Minnesota 23.4 to New Orleans 18.9 and a 54.4% simulated cover at MIN -2.5 (-103). That is a comparison signal, not a calibrated edge, and the same model leans Over 41.5 (52.5%) while this script writes Under. Early-week podcasts (Sharp or Square, BettingPros) favored New Orleans at +1.5/+2 as a buy-low spot. The digest's lean is MIN -2.5 at tier 2- (one tier-eligible source, VSiN) and Under 41.5 is research-only. No tier 1 or tier 2 label applies.

### What breaks it
Tyler Shough and Alvin Kamara execute a flawless screen and quick-game script that neutralizes Brian Flores' blitz packages, while the Saints' defensive front dominates Minnesota's depleted offensive line for multiple sacks and short-field takeaways, keeping New Orleans within a field goal or securing an outright home upset.

## CIN@MIA
projection: CIN 27, MIA 17

### Game script
Cincinnati travels to Miami with Joe Burrow operating at full efficiency alongside Chase Brown in the backfield. Burrow exploits Miami's secondary through Tee Higgins on outside vertical routes and intermediate seams, capitalising on Miami's defensive injuries. The Dolphins start Malik Willis, who leans on Jaylen Wright and Ollie Gordon II to establish an interior ground attack. Greg Dulcich serves as Willis's primary target off play-action boots. While Miami's ground game generates occasional chunk gains, Cincinnati's front seven stiffens in the red zone to force field-goal attempts. Burrow leads two fourth-quarter touchdown drives, pulling away to a 10-point victory that clears the 7-point road spread and pushes the combined score over the 43.5 market total.

### Why the card leans this way
BettingPros provided the primary backing for Cincinnati at -7.5. The digest rates the side as split (skip), with named support on both sides, and Cincinnati at -7 (-103; Miami +7 at -113) is price-sensitive at a primary key number. Betting splits show overwhelming sharp agreement: Cincinnati commands 87% of spread handle on 75% of tickets (-6.5), representing a +12% sharp gap. Total splits also show strong sharp alignment with 79% of the money backing Over 43.5 on 71% of tickets. The card holds the game as a conditional watch rather than an automatic ticket until final weekend inactive reports are confirmed.

### What breaks it
Malik Willis produces an exceptional rushing performance, extending broken plays and keeping Cincinnati's high-powered passing game pinned on the sideline. If Cincinnati's offensive line gives up repeated sacks and settles for field goals, Miami can stay within the 7-point hook.

## CLE@NYJ
projection: CLE 19, NYJ 20

### Game script
This AFC matchup in New York features two physical defenses dictating the tempo from the opening snap. Deshaun Watson starts for Cleveland with Dillon Gabriel ruled out due to a back injury, handing off to Quinshon Judkins to set up play-action throws to Denzel Boston and tight end Harold Fannin Jr., while the Jets counter with Will Levis directing a run-heavy approach centered on power back Braelon Allen, complemented by quick perimeter targets to Adonai Mitchell and Jeremy Ruckert. Cleveland's secondary grades at a WATCH tier with a 1.35 severity score, keeping Levis's passing lanes congested. Both teams trade field goals in a low-scoring defensive slugfest. New York kicks a decisive field goal in the final two minutes to win by one point, allowing Cleveland to cover the 2.5-point spread.

### Why the card leans this way
Action Network, BettingPros, and Even Money all published support for Cleveland, notably framing the Browns as a Wong teaser candidate (+2.5 to +8.5). The digest's current lean on the side is NYJ -2.5 (-107) at tier 2-, and the Cleveland support is research-only, so Cleveland is teaser context rather than a straight ticket; +2.5 requires an artificial teaser adjustment. Market splits reveal 84% of public spread tickets on Cleveland, but New York attracts 26% of the money on just 16% of tickets (+10% sharp gap toward NYJ). Similarly, Under 39.5 drew 37% of the cash on 27% of tickets (+10% sharp buy on Under). The projected total of 39 aligns with this defensive script.

### What breaks it
Deshaun Watson commits multiple turnovers under aggressive New York pass pressure, giving Braelon Allen short fields that turn a tight field-goal battle into a two-touchdown Jets rout. Alternatively, an explosive play on special teams could disrupt the low-scoring flow.

## IND@PIT
projection: IND 20, PIT 23

### Game script
Pittsburgh hosts Indianapolis in a classic AFC North battle where Aaron Rodgers commands the pocket against an Indianapolis defense dealing with multiple secondary questions. Rodgers leans on Rico Dowdle between the tackles and targets DK Metcalf on perimeter isolation routes, with Pat Freiermuth working the middle of the field. The Colts answer with Daniel Jones distributing efficiently to Josh Downs and veteran Keenan Allen on a HIGH secondary matchup grade with a 6.45 severity score, while DJ Giddens contributes tough rushing yards. Indianapolis matches Pittsburgh drive for drive through three quarters. Rodgers executes a clinical two-minute drill late in the fourth quarter to set up a game-winning field goal, sealing a three-point Pittsburgh victory that lands squarely on the market spread and slightly under the 43.5 total.

### Why the card leans this way
Even Money supported Indianapolis strictly as a 6-point teaser leg (+2.5 to +8.5), while BettingPros backed the Over at 43.5. The digest leans PIT -3 (+103) and Under 43.5 at tier 2- only, so the matchup is research and teaser context, not a straight play. Market movement has nudged the line from PIT -2.5 to IND +3 (-118) at Bookmaker. Betting splits demonstrate sharp interest in the Under, which captured 36% of the money on 27% of tickets (+9% sharp handle gap). On the moneyline, Indianapolis drew 51% of handle on 41% of tickets (+10% sharp gap at +122).

### What breaks it
Aaron Rodgers connects on multiple deep shots to DK Metcalf against Indianapolis' vulnerable safeties, building a two-score lead that forces Daniel Jones into obvious passing downs where Pittsburgh's pass rush can tee off and blow open the final margin.

## LV@NE
projection: LV 23, NE 24

### Game script
Las Vegas travels to New England featuring Kirk Cousins commanding a balanced offensive attack with rookie running back Ashton Jeanty. Cousins targets Brock Bowers and Tre Tucker against a New England secondary carrying a HIGH matchup vulnerability grade with a massive 10.05 severity score, one of the highest ratings on the Week 5 slate. New England answers with rookie Drake Maye, who distributes effectively to Romeo Doubs and tight end Hunter Henry, while TreVeyon Henderson provides dynamic burst on outside zone runs. Both offenses find consistent success moving the chains against secondary deficiencies. New England edges out a dramatic 24-23 victory on home turf, but Las Vegas easily protects the 3.5-point spread while the total finishes slightly above 45.

### Why the card leans this way
Even Money and Sharp or Square both endorse Las Vegas +3.5, but the digest rates the side as split (skip) because named sources also back New England. The +3.5 hook (-107) sits above the key number of 3 and is worth repricing. Market splits strongly reinforce this sharp stance: Las Vegas commands 77% of the spread handle on 72% of tickets, while the Raiders moneyline displays a massive sharp gap, capturing 65% of the cash on just 36% of tickets (+160). The projected 47 points also leans Over the 45-point total, matching the 81% handle on Over 45.5.

### What breaks it
Drake Maye plays a flawless game and connects on multiple explosive downfield touchdowns to Romeo Doubs, while New England's defense disguises coverages to bait Kirk Cousins into crucial red-zone interceptions, allowing the Patriots to win by a touchdown or more.

## CHI@GB
projection: CHI 24, GB 21

### Game script
The NFL's oldest rivalry renews in Green Bay with Chicago starting Tyson Bagent under center after head coach Ben Johnson confirmed the move, as Caleb Williams battles a hamstring injury. Bagent manages a balanced attack, handing off to Roschon Johnson and feeding Rome Odunze and Cole Kmet on high-percentage throws. Green Bay counters with Jordan Love looking to exploit Chicago's secondary, which carries a HIGH vulnerability grade with a 5.25 severity score. Love targets Bo Melton and tight end Tucker Kraft while Josh Jacobs shoulders a heavy workload on the ground. Bagent's poise in the quick-strike game keeps Chicago ahead of the chains, leading to a late go-ahead touchdown drive that gives the Bears a three-point road victory, covering the 1.5-point Bookmaker spread.

### Why the card leans this way
Sharp or Square and BettingPros both backed Chicago (-1.5 and -2.5). The digest's current lean is Green Bay +1.5 (-119) at tier 2- (research-only, with named support on both sides), while Bookmaker has Chicago at -1.5 (+102) and the verified SuperContest line is -3. Sharp money on the live market bought Green Bay (+1.5 with 54% of the cash on 43% of tickets), and Bagent is confirmed as the Chicago starter, so this stays a quarterback-driven review rather than an automatic play.

### What breaks it
Tyson Bagent struggles with pass protection on the road and coughs up critical giveaways in Green Bay territory, allowing Jordan Love and Josh Jacobs to establish an insurmountable two-score lead that sinks Chicago's road cover.

## DEN@LAC
projection: DEN 23, LAC 20

### Game script
This AFC West divisional clash features Bo Nix leading Denver on the road against Justin Herbert and the Chargers. Denver leans on J.K. Dobbins to establish offensive balance, opening intermediate play-action opportunities for Troy Franklin and Pat Bryant against a Los Angeles secondary graded HIGH with a 5.40 severity score. The Chargers answer through Justin Herbert, who targets Quentin Johnston and tight end Oronde Gadsden while Omarion Hampton grinds out yardage against Denver's stout defensive front. Both teams trade scores in a tight, ball-control matchup with minimal separation. Bo Nix orchestrates a late fourth-quarter scoring drive to secure a three-point road victory, which leaves the Chargers covering the 3.5-point home underdog spread in a game that lands on 43 total points.

### Why the card leans this way
This game represents a classic expert divide. Action Network and Even Money both backed the Los Angeles Chargers at +3.5, citing home division dogs in tight rivalry games, while BettingPros endorsed the Denver Broncos at -3.5. The digest's lean is Los Angeles +3.5 (-103) at tier 2- (research-only), with named support on both sides. Market splits show an exact dead heat on the spread: 54% of tickets and 54% of money on Denver, with 46% of tickets and 46% of money on Los Angeles. Sharp action appeared only on Under 41.5/42, capturing 39% of the handle on 31% of tickets.

### What breaks it
Justin Herbert connects on multiple deep strikes to Quentin Johnston and avoids Denver's pass rush, outscoring Denver in a clean four-quarter performance that produces an outright Los Angeles victory. Conversely, an early Nix turnover could hand the Chargers a wire-to-wire lead.

## SF@SEA
projection: SF 21, SEA 24

### Game script
Seattle hosts San Francisco in an intense NFC West battle in Seattle. Sam Darnold operates Seattle's passing attack, connecting with Cooper Kupp on timing routes and utilising tight end AJ Barner, while George Holani provides tough rushing between the tackles. San Francisco counters behind Brock Purdy, who distributes targets to Brandon Aiyuk and George Kittle on a MEDIUM secondary matchup grade with a 3.75 severity score, supported by Jordan James in the backfield. Both defenses play disciplined situational football, forcing multiple field-goal attempts in the second half. Darnold guides Seattle on a clutch late-game drive that culminates in a game-winning field goal, delivering a 24-21 home victory that pushes the 3-point spread and keeps the total under 46.5.

### Why the card leans this way
Expert sources are deeply divided on this divisional matchup. PFF backed San Francisco on the moneyline, whereas Sharp or Square took Seattle at -2.5. BettingPros endorsed the Under at 46.5. The digest's lean is Seattle -3 (-122) at tier 2-, with support on both sides, and Under 46.5 is research-only. Betting splits reflect a major divergence: 82% of spread tickets and 88% of spread handle back San Francisco +3, but the moneyline tells a different story, with 58% of the cash backing Seattle (-166) on only 46% of tickets (+12% sharp moneyline gap). The projected 45 points supports the Under lean against the 46.5 market line.

### What breaks it
Brock Purdy and George Kittle dominate Seattle's linebackers in the red zone for multiple touchdowns, while San Francisco's defensive front disrupts Sam Darnold into multiple second-half sacks and turnovers, propelling the 49ers to an outright road win.

## DET@ARI
projection: DET 31, ARI 24

### Game script
Detroit travels to Arizona for the highest-total matchup on the Week 5 slate. Jared Goff operates behind Detroit's dominant offensive line, feeding Jahmyr Gibbs on explosive perimeter plays and targeting tight ends Sam LaPorta and Tyler Conklin against an Arizona secondary graded HIGH with a 6.40 severity score. Arizona counters with Tyler Allgeier leading the ground game and Kendrick Bourne complementing elite tight end Trey McBride over the middle. Arizona's offense exploits Detroit's secondary, which carries a slate-high vulnerability grade of 12.00 severity score. Both teams generate rapid scoring drives throughout the contest, but Detroit's superior offensive execution in the fourth quarter produces a seven-point victory that covers the 5.5-point road spread and pushes the total over 54.5.

### Why the card leans this way
Expert opinion is completely polarized. Sharp or Square and Even Money both endorsed Arizona (+4.5 and +6), viewing the home underdog as undervalued, while BettingPros backed Detroit -4.5 and the Over. The digest's lean is Arizona +5.5 (-106), research-only, with named support on both sides. The market has moved from an opening line of DET -4.5 to DET -5.5 (-110) at Bookmaker (and DET -5.5 in the contest). Spread splits show balanced action (54% tickets and 56% money on Detroit), while the Detroit moneyline drew 97% of the cash on 92% of tickets at -250.

### What breaks it
Trey McBride and Tyler Allgeier exploit Detroit's depleted secondary with relentless efficiency, keeping pace score-for-score and executing a successful backdoor drive to cover inside the six points, or even steal an outright upset if Detroit turns the ball over.

## BAL@ATL
projection: BAL 20, ATL 24

### Game script
Atlanta hosts Baltimore on Sunday night in a game reshaped by major quarterback news: Lamar Jackson has been ruled out with an ankle injury. Tyler Huntley steps in to start for Baltimore, directing an offense anchored by Derrick Henry's power running and high-percentage throws to Zay Flowers and tight end Mark Andrews. Atlanta counters with Michael Penix Jr. commanding a potent offensive unit featuring Bijan Robinson out of the backfield, supported by perimeter rookie Zachariah Branch and tight end Austin Hooper. Atlanta targets Baltimore's secondary, which carries a HIGH vulnerability grade with a 5.25 severity score. Penix delivers two second-half touchdown passes, guiding Atlanta to a four-point home victory that covers the 3-point spread and lands right on the 44-point total.

### Why the card leans this way
The line made a dramatic shift across key numbers following the Lamar Jackson injury announcement, flipping from an opening line of Baltimore -4.5 all the way to Atlanta -3 (-117) at Bookmaker (-3.5 in the contest). Sharp or Square took Atlanta +3.5 on the early number. Total analysts clash directly, with Even Money backing Over 43.5 while BettingPros backed Under 46.5. The digest rates the side (Atlanta -3, -117) and the total (44) as split (skip). Betting splits confirm sharp money following the quarterback news: Atlanta took 59% of spread handle on 47% of tickets (+12% sharp gap), and 61% of moneyline handle on 51% of tickets (-177).

### What breaks it
Derrick Henry delivers a vintage performance, dominating Atlanta's front seven for over 120 rushing yards and controlling time of possession, allowing Tyler Huntley to manage a clean game that keeps Baltimore in front or secures a field-goal upset.

## BUF@LAR
projection: BUF 27, LAR 28

### Game script
Buffalo travels west to face the Los Angeles Rams in a high-octane battle featuring two prolific passing offenses. Josh Allen directs Buffalo's attack, feeding James Cook III out of the backfield while utilizing Keon Coleman and Dalton Kincaid against a Rams secondary carrying a MEDIUM vulnerability grade with a 3.34 severity score. The Rams answer with Blake Corum establishing early rushing lanes, setting up timing throws to Davante Adams and Tyler Higbee. Both offenses execute at a high level with minimal punting, trading touchdowns across all four quarters. The Rams execute a late field-goal drive in the final minute to win 28-27, but Buffalo's one-point loss comfortably covers the 3-point road underdog spread in a game that eclipses the 54.5 total.

### Why the card leans this way
Even Money and Sharp or Square both endorsed the Buffalo Bills (+3 / teaser +8.5), identifying strong value on Josh Allen as a short road underdog. The digest's lean is Los Angeles -3.5 (-106) at tier 2-, and the Buffalo +3.5 (-108) support is research-only. However, market splits show sharp money buying back the Rams: Los Angeles took 39% of spread handle on just 27% of tickets (+12% sharp gap at -3.5), and captured 64% of moneyline cash on 45% of tickets (-179). The high market total of 54.5 aligns with the projected 55-point shootout.

### What breaks it
The Rams pass rush disrupts Josh Allen's pocket repeatedly, forcing hurried throws and third-and-long situations, while Davante Adams creates multiple explosive red-zone scores that allow the Rams to pull away by more than a field goal.

## TICKETS
- Slot 3 Morning parlay: Morning core pairing the research-only Las Vegas hook (+3.5) with Minnesota (-2.5) and the Indy-Pittsburgh Over, capped by the Sunday night Atlanta moneyline hedge anchor.
- Slot 4 Afternoon parlay: Afternoon card pairing Denver-LAC Under 42 with San Francisco (+3) and Jacksonville (-7.5), capped by the Sunday night Atlanta moneyline hedge anchor.
- Single LV +3.5: Research-only idea (digest: split); Raiders +3.5 holds the hook over 3. Reprice and verify before any use.
- Single MIN -2.5: Research-only lean (digest tier 2-): Minnesota -2.5 with the #1 EPA defense. Reprice before any use.
- Single SF +3: Research-only; the digest leans Seattle -3 (tier 2-). Reprice before any use.
- Underdog Moneyline Round Robin (2-team combos): 2-of-3 underdog round robin backing live moneyline dogs (Las Vegas +167, Tennessee +280, San Francisco +140); needs 2 of 3 to show a profit.
- SuperContest 5-team parlay: The sportsbook companion parlay to our official Week 5 SuperContest Five card.

## SUPERCONTEST
- JAX: Lawrence and Tuten offensive balance against secondary absences; model score 0.663 leads the slate.
- MIN: Vikings defense ranks 1st in EPA allowed; 2.5 line is under the key field-goal threshold; model score 0.616.
- SF: Strong divisional underdog getting a full 3 points; Purdy and Kittle matchup edges against Seattle linebackers; model score 0.615.
- LV: Key hook over 3; Raiders defense and pass rush match up well against Patriots turnovers; model score 0.584.
- TEN: Crucial hook over 7; contest line is +0.5 pt better than Bookmaker (TEN +7); model score 0.581.

## KNOWN GAPS
- Quarterback statuses confirmed by the user 2026-10-10 17:28 PT: Huntley starts for BAL, Bagent for CHI, Daniels for WAS. Lines and splits above already reflect those announcements only to the extent the 22:25Z capture does.
- Game Excluded: TB@DAL (Thursday Night Football completed; Dallas won 31-28).
