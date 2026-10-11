# Week 5 — ESPN roster "injuredReserveOrOut" group vs the packets' ESPN injury list

Generated 2026-10-11T06:03Z from `data/nfl-rosters/espn-full-rosters-latest.json` (generated_at 2026-10-11T02:38:50.657541+00:00; snapshot copy in `reports/handoff-snapshots/2026-10-10-h2c2-week5-sunday/copies/`) and `data/research-intel/source-evidence/espn-status-w05.json` (fetched 2026-10-11T04:21:24Z).

**Why this matters:** `scripts/intel/fetch-espn-status.py` builds each packet's AVAILABILITY lines from ESPN's injuries feed only. ESPN's roster endpoint also groups players as `injuredReserveOrOut`; the players below are in that group but NOT in the injuries feed, so no Week 5 packet or per-game output accounted for them. ESPN marks all of them status `day-to-day`, so treat them as **unresolved, likely on a reserve list** — not as confirmed Out — and check official inactives before using any of them in a card. The packet sentence "Players not on this list are not reported injured by ESPN" is therefore incorrect.
**Total: 221 players on the 28 Week 5 teams.**


## PHI@JAX
- **PHI** (8): Andre' Sam S; Eli Stowers TE; Grant Calcaterra TE; Jakorian Bennett CB; Johnny Wilson WR; Landon Dickerson G; Tariq Castro-Fields CB; Tucker Large S
- **JAX** (8): B.J. Green II DE; Devon Marshall CB; Garrett DiGiorgio OT; Jared Bartlett LB; Parker Hughes LB; Patrick Mekari G; Sam Mustipher C; Zach Durfee DE

## CHI@GB
- **CHI** (10): Braxton Jones OT; Brittain Brown RB; Coby Bryant S; Dallis Flowers CB; Hayden Large TE; Jonathan Garvin DE; Nephi Sewell LB; Nikola Kalinic TE; Ruben Hyppolite II LB; Tony Fields II LB
- **GB** (8): Collin Oliver DE; Jayden Reed WR; Johnathan Baldwin II S; Jordon Riley DT; Luke Musgrave TE; Thomas Yassmin TE; Warren Brinson DT; Zach Bako-Bewele OT

## HOU@TEN
- **HOU** (12): Ali Gaye DE; British Brooks RB; Dylan Horton DE; E.J. Speed LB; Henry To'oTo'o LB; Ja'Marcus Ingram CB; Jake Hummel LB; Jayden Higgins WR; K.C. Ossai LB; Mario Edwards Jr. DT; Sam Hagen G; Solomon Byrd DE
- **TEN** (8): Dorian Mausi LB; Fernando Carmona G; Jackson Slater G; Jaren Kanak TE; Jaylen Harrell LB; Kendell Brooks S; Milo Eifler LB; Tanoh Kpassagnon DE

## CIN@MIA
- **CIN** (3): Andrei Iosivas WR; Brian Parker II OT; Ja'Sir Taylor CB
- **MIA** (7): Cole Turner TE; Darrell Baker Jr. CB; De'Von Achane RB; Kyle Louis LB; Rene Konga DT; Ronnie Harrison Jr. LB; Trey Moore LB

## LV@NE
- **LV** (8): Brennan Jackson LB; Carter Runyon TE; Chigozie Anusiem CB; Chris Collier RB; Corey Rucker WR; Jack Bech WR; Justin Pickett G; Keyron Crawford DE
- **NE** (11): Bryce Baringer P; Dell Pettus S; Greg Van Roten G; Harold Landry III LB; Jeremiah Webb WR; Julian Hill TE; Khalil Jacobs LB; Marcus Bryant OT; Mike Onwenu G; Myles Montgomery RB; Quintayvious Hutchins LB

## MIN@NO
- **MIN** (5): Dwight McGlothern Jr. CB; Jamal Adams LB; Jordan Mason RB; Nick Samac C; Tyler Batty LB
- **NO** (12): Bryan Bresee DT; David Long Jr. CB; Dillon Radunz G; Jordyn Tyson WR; Kelvin Banks Jr. OT; Mason Tipton WR; Moliki Matavao TE; Nick Saldiveri OT; Rejzohn Wright CB; Travis Etienne Jr. RB; Ty Chandler RB; Zach Wood LS

## CLE@NYJ
- **CLE** (7): Alex Wright DE; Damarri Mathis CB; Dylan Sampson RB; Edefuan Ulofoshio LB; Elijah Chatman DT; Jeremiah Owusu-Koramoah LB; Joe Royer TE
- **NYJ** (12): Anez Cooper G; Arian Smith WR; Caullin Lacy WR; Chip Trayanum RB; David Onyemata DT; Kingsley Jonathan DE; Marcelino McCrary-Ball LB; Omar Cooper Jr. WR; Tim Patrick WR; Tre Brown CB; Tyler Baron DE; VJ Payne S

## IND@PIT
- **IND** (6): Alec Pierce WR; Cameron Mitchell CB; Carson Towt TE; D.J. Montgomery WR; Micheal Clemons DE; Sean McKeon TE
- **PIT** (7): Cole Burgess WR; Daequan Hardy CB; Donte Kent CB; Gennings Dunker G; Jack Driscoll OT; Logan Lee DT; Max Hurleman RB

## NYG@WAS
- **NYG** (10): Brian Burns LB; Calvin Austin III WR; DJ James CB; Gunner Olszewski WR; Jarrick Bernard-Converse CB; Korie Black CB; Paulson Adebo CB; Rico Payton CB; Roy Robertson-Harris DT; Thaddeus Dixon CB
- **WAS** (0): none

## DEN@LAC
- **DEN** (6): Caleb Lohner TE; Frank Crum OT; Levelle Bailey LB; Matt Henningsen DE; Michael Deiter C; Nick Gargiulo G
- **LAC** (5): David Njoku TE; Denzel Perryman LB; Isaiah World OT; KeAndre Lambert-Smith WR; Trey Pipkins III OT

## DET@ARI
- **DET** (7): Avonte Maddox CB; Damone Clark LB; Giovanni Manu OT; Isiah Pacheco RB; Kendrick Law WR; Kerby Joseph S; Payton Turner DE
- **ARI** (12): Chase Bisontis G; James Conner RB; Jameson Geers TE; Joey Blount S; Josh Minkins S; Kaleb Proctor DT; Kitan Crawford S; Tip Reiman TE; Trey Benson RB; Will Johnson CB; Xavier Weaver WR; Zachary Carter DT

## SF@SEA
- **SF** (17): Alfred Collins DT; Andrew Farmer II DE; Austen Pleasants OT; Brett Toth C; C.J. West DT; Christian Kirk WR; Darrick Forrest S; De'Zhaun Stribling WR; Demarcus Robinson WR; Isaac Guerendo RB; Jake Tonges TE; Mikail Kamara DE; Nate Hobbs CB; Nick Martin LB; Nick Zakelj OT; Ricky Pearsall WR; Sam Okuayinonu DT
- **SEA** (5): Anthony Bradford G; Bud Clark S; Jake Bobo WR; Mason Richman G; Robbie Ouzts FB

## BAL@ATL
- **BAL** (7): Adam Randall RB; Bilhal Kone CB; Danny Pinter C; Ethan Pocic C; Jahquez Robinson S; Jovaughn Gwyn G; T.J. Tampa CB
- **ATL** (9): A.J. Terrell Jr. CB; Anterio Thompson DT; Beaux Collins WR; Cameron Williams OL; Da'Shawn Hand DT; DeAngelo Malone LB; JD Bertrand LB; Storm Norton OT; Trey Sermon RB

## BUF@LAR
- **BUF** (4): Dorian Strong CB; Jordan Hancock CB; Tyrell Shavers WR; Zane Durant DT
- **LAR** (7): Daniel Rickert DE; Eddie Walls III LB; Justin Dedich G; Keagen Trost OT; Keir Thomas II LB; Ronnie Rivers RB; Zech McPhearson CB

