import json
S = {
    'lines': 'data/supercontest/week-11-lines.json (locked contest lines) and data/generated/props/bookmaker-gamelines-2026-11-21-week11.raw.txt (Bookmaker 5:43 pm PT)',
    'bol': 'data/generated/props/betonline-live-2026-11-22-week11.json (BetOnline 5:46 pm PT)',
    'fair': 'reports/intel/w11-model/fair-lines-w11.json (baseline fair line)',
    'pods': 'data/intel/articles/2026-w11/reviewed-podcast-picks.json (timestamped expert calls)',
    'x': 'data/intel/articles/2026-w11/bookmark-text-intelligence-digest.md (X bookmarks: sharp action, BetMGM splits, injury news)',
    'avail': 'data/player-availability/latest.json (ESPN injury feed, Sat 11:08 am PT)',
    'qb': 'reports/intel/w11-qb-injury-news-check-2026-11-21.md (QB check and Andy caveats)',
}
def src(*keys): return {str(i + 1): S[k] for i, k in enumerate(keys)}
P = {
 'TB': {'game': 'TB@DET',
  'pitch': [{'text': 'The contest gives Tampa Bay +7, while Bookmaker moved from DET -6 Thursday to DET -3.5 at 5:43 pm. That is 3.5 points of contest value, the most on the slate.', 'ref': [1]},
            {'text': 'Doug Kezirian named TB +7 his second favorite bet on the Action Network podcast, and Ben Fawkes reported sharp sportsbook action on the Bucs at +7 and +6.5.', 'ref': [2, 3]}],
  'pushback': [{'text': 'CAVEAT: Mayfield Questionable (foot/plantar fascia and thumb). Bowles said only that he is trending toward starting; if rookie Jalon Daniels starts, the value case collapses.', 'ref': [4]},
               {'text': 'Tampa Bay is without S Antoine Winfield Jr., and the baseline fair line still makes Detroit a 4.6-point favorite.', 'ref': [5, 6]}],
  'sources': src('lines', 'pods', 'x', 'qb', 'avail', 'fair')},
 'TEN': {'game': 'TEN@DAL',
  'pitch': [{'text': 'The contest gives Tennessee +8, while Bookmaker is at TEN +7. The extra point runs through 7, the second key number. The fair line is DAL -7.8.', 'ref': [1, 2]},
            {'text': 'Dallas is missing CB DaRon Bland, TE Jake Ferguson, WR Jonathan Mingo, S P.J. Locke and G Tyler Booker. Andrew Erickson backed TEN +8.5, and Ben Fawkes reported sharp action on the Titans at +8.', 'ref': [3, 4, 5]}],
  'pushback': [{'text': "Tennessee's pass defense allows the most passing yards in the NFL (xEP Network rates Dak Prescott's matchup 100/100), and RB Tyjae Spears went to IR on Saturday.", 'ref': [5, 3]},
               {'text': '62% of BetMGM money was on Dallas -7.5 (John Ewing), and BetOnline already offers TEN +9 at -125, so the contest number is not unique in the market.', 'ref': [5, 6]}],
  'sources': src('lines', 'fair', 'avail', 'pods', 'x', 'bol')},
 'NYJ': {'game': 'NYJ@LAC',
  'pitch': [{'text': 'The baseline fair line is LAC +0.2, so the contest NYJ +3.5 carries a 3.7-point model edge and the half point through 3 that the books (LAC -3) do not offer.', 'ref': [1, 2]},
            {'text': "The Chargers' secondary is short: S Kendall Williamson and CB Rodney Shelley are out, and CBs Tarheeb Still and Isas Waxter are questionable.", 'ref': [3]}],
  'pushback': [{'text': 'The Jets are without WRs Omar Cooper Jr. and Isaiah Williams, and Geno Smith was only cleared from an ankle issue on Friday.', 'ref': [3, 4]},
               {'text': '75% of BetMGM money was on the Chargers -3 (John Ewing), and the Jets travel to the West Coast.', 'ref': [4]}],
  'sources': src('fair', 'lines', 'avail', 'x')},
 'SF': {'game': 'MIN@SF',
  'pitch': [{'text': 'The contest has SF -3, while Bookmaker and BetOnline are at -3.5. The contest number wins on a field-goal margin, and the fair line is SF -5.', 'ref': [1, 2]},
            {'text': 'The SGPN on-air recap backed SF -3, and Kendra Middleton nominated SF -3.5 on her contest card. Favorites are 39-25 ATS in NFL international games (John Ewing).', 'ref': [3, 4]}],
  'pushback': [{'text': 'San Francisco is without WR Brandon Aiyuk, WR Mike Evans is questionable, and Kirk Cousins threw for 207 yards and 2 TDs in his Week 10 return.', 'ref': [5, 4]},
               {'text': 'The 49ers were the most-bet side at BetMGM (76% of money on -3). Mexico City altitude and a 61% rain chance add variance.', 'ref': [4, 6]}],
  'sources': {'1': S['lines'], '2': S['fair'], '3': S['pods'], '4': S['x'], '5': S['avail'], '6': 'data/research-intel/review/2026-w11-weather-venue.json (Open-Meteo, Estadio Banorte)'}},
 'MIA': {'game': 'MIA@BUF',
  'pitch': [{'text': 'The contest gives Miami +16.5, while Bookmaker moved to BUF -16. The fair line is BUF -15.8, so the contest number sits 0.7 points past fair.', 'ref': [1, 2]},
            {'text': 'Andrew Erickson (MIA +16.5) and Kendra Middleton (MIA +16.5, her "Peg of the Week") both backed Miami, and Doug Kezirian leaned the same way.', 'ref': [3]}],
  'pushback': [{'text': 'Buffalo has the top scoring offense, and James Cook III has an 8-game touchdown streak (DanGambleAI, Linemate).', 'ref': [4]},
               {'text': '66% of BetMGM money was on Bills -16.5, and Kyle McCord is making his second start in place of injured Malik Willis.', 'ref': [4, 5]}],
  'sources': src('lines', 'fair', 'pods', 'x', 'qb')},
 'CAR': {'game': 'BAL@CAR',
  'pitch': [{'text': 'The contest gives Carolina -2.5, while Bookmaker moved to CAR -3 (+102). The contest number wins on a field-goal margin; the fair line is CAR -2.9.', 'ref': [1, 2]},
            {'text': 'Ben Fawkes reported sharp action on the Panthers at -1.5, and 84% of BetMGM money was on Carolina -3 (John Ewing).', 'ref': [3]}],
  'pushback': [{'text': 'Skooshi backed BAL +3, and Baltimore is starting Jacoby Brissett with Lamar Jackson on IR, but Derrick Henry anchors the run game.', 'ref': [4, 5]},
               {'text': 'Baltimore is missing CB Marlon Humphrey, DT Nnamdi Madubuike and S Jaylinn Hawkins, yet the margin model has no edge beyond the hook. Rain (41-62%) adds variance.', 'ref': [6, 2]}],
  'sources': src('lines', 'fair', 'x', 'pods', 'qb', 'avail')},
 'DEN': {'game': 'LV@DEN',
  'pitch': [{'text': 'The contest gives Denver -10, half a point better than Bookmaker (-10.5).', 'ref': [1]},
            {'text': 'Doug Kezirian (first favorite bet), Lock & Cash and the SGPN recap all backed Denver at -10 or -9.5, and Ben Fawkes reported sharp action at -9 and -9.5.', 'ref': [2, 3]}],
  'pushback': [{'text': 'The baseline fair line is DEN -8.9, so the model sides with Las Vegas at +10. Kendra Middleton disclosed a personal bet on the Raiders +10.5.', 'ref': [4, 2]},
               {'text': 'TE Brock Bowers and K Matt Gay are questionable for Las Vegas; their status changes the backdoor-cover risk.', 'ref': [5]}],
  'sources': src('lines', 'pods', 'x', 'fair', 'avail')},
}
p = 'reports/intel/supercontest-pitches-2026-w11.json'
d = json.load(open(p, encoding='utf-8'))
d['as_of'] = '2026-11-21'
d['method'] = ('Saturday provisional contest proposals (Andy approved in chat ~6:10 pm PT): locked contest line vs Bookmaker 5:43 pm PT, '
               'baseline fair line, ESPN injury feed and reviewed expert/media intake. Named expert picks are context. Friday entries are in the .bak file.')
d['picks'] = P
json.dump(d, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(list(P))
