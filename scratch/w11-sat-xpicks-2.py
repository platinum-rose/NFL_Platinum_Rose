import json, re
p = 'data/intel/extracted/2026-w11-chrome-article-picks.json'
d = json.load(open(p, encoding='utf-8'))
ARI = 'CAVEAT: ARI QB - Josh Johnson preparing to start (Beck Q)'
TB = 'CAVEAT: TB QB - Mayfield Questionable'
add = [
    {'author': 'CodyBrownBets', 'url': 'https://x.com/CodyBrownBets/status/2124209370430873897', 'posted': 'Sat 11/21 10:32 AM PT',
     'type': '5-game streak list ("props that cashed in the last five games"); his favorite 15 went into an unlisted FanDuel lotto. Streak data / package, not standalone picks',
     'legs': ['MIA@BUF: Josh Allen 175+ pass yds; James Cook 80+ rush yds; James Cook ATD; Khalil Shakir 25+ rec yds; Malik Washington 20+ rec yds',
              'BAL@CAR: Justice Hill 5+ rec yds; Justice Hill 2+ rec; Tetairoa McMillan 30+ rec yds',
              'TEN@DAL: George Pickens 40+ rec yds; Ryan Flournoy 20+ rec yds',
              'TB@DET [' + TB + ']: Bucky Irving 40+ rush yds; Jameson Williams 30+ rec yds; Sam LaPorta 15+ rec yds; Jahmyr Gibbs 70+ rush yds',
              'PIT@PHI: Pat Freiermuth 10+ rec yds; Freiermuth 2+ rec; Dallas Goedert 30+ rec yds; Goedert 3+ rec; Darius Cooper 5+ rec yds',
              'NYJ@LAC: Braelon Allen 30+ rush yds; Breece Hall 2+ rec; Mason Taylor 10+ rec yds; Kenyon Sadiq 1+ rec',
              'JAX@NYG: Trevor Lawrence 200+ pass yds; Jakobi Meyers 20+ rec yds; Malik Nabers 40+ rec yds; Nabers 5+ rec',
              'LV@DEN: Courtland Sutton 15+ rec yds; J.K. Dobbins 10+ rush yds; Ashton Jeanty 2+ rec; Marvin Mims 1+ rec',
              'MIN@SF: Kirk Cousins 200+ pass yds; Cousins 1+ pass TD; Aaron Jones Sr. 15+ rush yds; Christian McCaffrey 35+ rush yds, 15+ rec yds, ATD; George Kittle 4+ rec',
              "CIN@WAS: Joe Burrow 5+ rush yds; Burrow 2+ pass TD; Chase Brown 35+ rush yds, 15+ rec yds, 3+ rec; Ja'Marr Chase 60+ rec yds; Samaje Perine 10+ rush yds; Stefon Diggs 30+ rec yds, 3+ rec; Treylon Burks 20+ rec yds"]},
    {'author': 'DanGambleAI', 'url': 'https://x.com/DanGambleAI/status/2124229640327733731', 'posted': 'Sat 11/21 11:53 AM PT', 'type': 'narrative list, context only (no thresholds except Kelce 40.5)',
     'legs': ['Josh Downs (KC) Arrowhead debut; targeted on 63% of routes last week [' + ARI + ' (opponent)]',
              'James Cook 8-game TD streak; BUF -16.5', 'Christian McCaffrey 8-game TD streak; Mexico City SNF',
              'Isaiah Likely (NYG TE, JAX@NYG) one TD from a $250k incentive', 'Trey McBride birthday; "safety net for Arizona\'s rookie QB" [' + ARI + '; post assumes Beck]',
              'Tony Pollard revenge game vs DAL; DAL allows the most RB rush TDs', 'T.J. Hockenson one TD from a $300k incentive; healthy',
              'Travis Kelce 100th Arrowhead game; line 40.5, cleared in all 4 home games (avg 74.3) [' + ARI + ' (opponent)]']},
    {'author': 'PFF', 'url': 'https://x.com/PFF/status/2124224083466555748', 'posted': 'Sat 11/21 11:31 AM PT', 'type': 'context (image not read)', 'legs': ['Chase McLaughlin (TB K) "flawless this season" [' + TB + ']']},
]
unread = [
    {'author': 'CodyBrownBets', 'url': 'https://x.com/CodyBrownBets/status/2124246697874215080', 'posted': 'Sat 11/21 1:00 PM PT', 'type': '+769 FanDuel "Sunday Flyer" parlay (package); legs are in the image, NOT READ (browser unavailable)'},
    {'author': 'HarryLockPicks', 'url': 'https://x.com/HarryLockPicks/status/2124187149167981038', 'posted': 'Sat 11/21 9:04 AM PT', 'type': '+551 RedZone Escalator, 7 players, alt yardage lines 20-80 (package); legs in image, NOT READ'},
    {'author': 'HarryLockPicks', 'url': 'https://x.com/HarryLockPicks/status/2124218795988484359', 'posted': 'Sat 11/21 11:10 AM PT', 'type': 'streak sheets (context); image NOT READ'},
    {'author': 'yourlinemate', 'url': 'https://x.com/yourlinemate/status/2124201177147425086', 'posted': 'Sat 11/21 10:00 AM PT', 'type': 'positional streak sheet (context); image NOT READ'},
]
d['context_items'] += add
d['unread_items'] = unread
d['note'] += (' | Pass 3 (~3:50 PM PT): 372 bookmarks, 7 new (posted 9:04 AM-1:53 PM). Text posts recorded; 4 image posts unread because the Claude in Chrome browser '
              'disconnected; PFF image not needed (caption only). No videos.')
json.dump(d, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('context', len(d['context_items']), 'unread', len(unread))
