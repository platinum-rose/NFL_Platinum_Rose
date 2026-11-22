import json
p = 'reports/intel/supercontest-pitches-2026-w11.json'
d = json.load(open(p, encoding='utf-8'))
P = d['picks']
P['TB']['pushback'][0]['text'] = 'CAVEAT: Mayfield Questionable (foot/plantar fascia and thumb). Bowles said only that he is trending toward starting; if rookie Jalon Daniels starts instead, the 3.5-point value case collapses.'
P['TB']['pushback'][1]['text'] = 'Tampa Bay is without S Antoine Winfield Jr., and the baseline fair line still makes Detroit a 4.6-point favorite, so the model edge on +7 is 2.4 points rather than the full 3.5 against market.'
P['TEN']['pushback'][0]['text'] = "Tennessee's pass defense ranks last in the NFL (xEP Network rates Dak Prescott's matchup 100/100), and RB Tyjae Spears went to IR on Saturday, leaving 1 healthy lead back."
P['NYJ']['pitch'][1]['text'] = "The Chargers' secondary is short: S Kendall Williamson and CB Rodney Shelley are out, and CBs Tarheeb Still and Isas Waxter are questionable, leaving up to 4 of the defensive backs limited or missing."
P['NYJ']['pushback'][0]['text'] = 'The Jets are without WRs Omar Cooper Jr. and Isaiah Williams (2 receivers out), and Geno Smith was only cleared from an ankle issue on Friday, two days before kickoff.'
P['NYJ']['pushback'][1]['text'] = '75% of BetMGM money was on the Chargers -3 (John Ewing), and the Jets travel three time zones to the West Coast for a 1:05 pm PT kickoff after a short week of practice.'
P['MIA']['pushback'][0]['text'] = 'Buffalo has the top scoring offense in the NFL, and James Cook III has scored in 8 straight games (DanGambleAI, Linemate), so a two-touchdown margin is a normal Bills outcome.'
P['MIA']['pushback'][1]['text'] = '66% of BetMGM money was on Bills -16.5 (John Ewing), and Kyle McCord is making only his second NFL start in place of the injured Malik Willis, with a lower passing floor.'
P['CAR']['pitch'][1]['text'] = 'Ben Fawkes reported sharp sportsbook action on the Panthers at -1.5, and 84% of BetMGM money was on Carolina -3 (John Ewing), so both the early and the public money point the same way.'
P['DEN']['pitch'][0]['text'] = 'The contest gives Denver -10, half a point better than Bookmaker (-10.5) at 5:43 pm PT, so a 10-point Broncos win is a push here instead of a loss at the book.'
P['DEN']['pushback'][1]['text'] = 'TE Brock Bowers and K Matt Gay are both questionable for Las Vegas; if either plays, the Raiders keep a late-score path that raises the backdoor-cover risk on a 10-point spread.'
import re
for t, v in P.items():
    for k in ('pitch', 'pushback'):
        for i, b in enumerate(v[k], 1):
            x = b['text']
            if len(x) < 120 or not re.search(r'\d', x) or re.search(r'(?i)rushing yards|passing yards|receiving yards', x):
                print('STILL BAD', t, k, i, len(x))
json.dump(d, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('ok')
