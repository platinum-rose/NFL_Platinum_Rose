import json
CB = 'https://x.com/CodyBrownBets/status/2124270916695654774'
SHOW = 'X @CodyBrownBets - "Four Sunday NFL games with serious weather implications" carousel (Sat 11/21 2:37 PM PT)'
ARI_TAG = 'CAVEAT: ARI QB - Josh Johnson preparing to start (Beck Q)'
def cb(game, player, market, side, line, why, extra=None):
    d = {'game': game, 'team': None, 'player': player, 'market': market, 'side': side, 'line': line, 'price': None, 'week': 11,
         'speaker': 'Cody Brown', 'show': SHOW, 'episode': CB, 'rationale': why, 'best_bet': False, 'source_pipeline': 'claude_x_browser_read',
         'pick_type': 'standalone_target'}
    if extra: d['caveat'] = extra
    return d
picks = [
    cb('ARI@KC', 'Emmett Johnson', 'rushing_yards', 'OVER', 86.5, '25 mph wind gusts favor RB rushing / short passing; fade deep receivers.', ARI_TAG),
    cb('ARI@KC', 'Travis Kelce', 'receiving_yards', 'OVER', 38.5, '25 mph wind gusts; short-area targets.', ARI_TAG),
    cb('PIT@PHI', 'Jaylen Warren', 'rushing_yards', 'OVER (implied)', 66.5, '81% rain; RB rushing, RB receptions, QB rushing up. Slide lists 66.5 without an O/U label; direction implied by the up-arrow list.'),
    cb('PIT@PHI', 'Jaylen Warren', 'receptions', 'OVER', 2.5, '81% rain; RB receptions up.'),
    cb('PIT@PHI', 'Joe Milton', 'rushing_yards', 'OVER (implied)', 32.5, '81% rain; QB rushing up. No O/U label on the slide; direction implied.'),
    cb('JAX@NYG', 'Bhayshul Tuten', 'rushing_yards', 'OVER', 69.5, '87% rain; RB and QB rushing up, QB passing and deep receivers down.'),
    cb('JAX@NYG', 'Cam Skattebo', 'rushing_yards', 'OVER', 51.5, '87% rain; RB rushing up.'),
    cb('NO@CHI', "D'Andre Swift", 'rushing_yards', 'OVER', 64.5, '85% rain, 26 mph gusts; RB rushing, QB rushing, short passes up.'),
    cb('NO@CHI', 'Kyle Monangai', 'rushing_yards', 'OVER', 41.5, '85% rain, 26 mph gusts; RB rushing up.'),
]
context = [
    {'author': 'HarryLockPicks', 'url': 'https://x.com/HarryLockPicks/status/2124277345486065999', 'posted': 'Sat 11/21 3:02 PM PT', 'type': 'package (DraftKings 6-pick either/or TD parlay +549)',
     'legs': ["D'Andre Swift or Luther Burden III (NO@CHI)", 'Rashee Rice or Trey McBride (ARI@KC) [' + ARI_TAG + ']', 'Saquon Barkley or Jaylen Warren (PIT@PHI)',
              'Derrick Henry or Chuba Hubbard (BAL@CAR)', 'Jahmyr Gibbs or Bucky Irving (TB@DET) [CAVEAT: TB QB - Mayfield Questionable]', 'James Cook III or Ollie Gordon II (MIA@BUF)']},
    {'author': 'DanGambleAI', 'url': 'https://x.com/DanGambleAI/status/2124277769307640195', 'posted': 'Sat 11/21 3:04 PM PT', 'type': 'package (8-leg SGP+ "Deep Balls", +3831, each leg = player 20+ yard reception)',
     'legs': ['Justin Jefferson + George Kittle (MIN@SF SGP)', 'CeeDee Lamb (TEN@DAL)', 'Amon-Ra St. Brown (TB@DET) [CAVEAT: TB QB - Mayfield Questionable]', 'Zay Flowers (BAL@CAR)',
              'Adonai Mitchell (NYJ@LAC)', 'Malik Nabers (JAX@NYG)', 'Jaylen Waddle (LV@DEN)']},
    {'author': 'DanGambleAI', 'url': 'https://x.com/DanGambleAI/status/2124252682638827952', 'posted': 'Sat 11/21 1:24 PM PT', 'type': 'model sheet (Touchdown AI Edge), context only',
     'legs': ['RB sheet: Javonte Williams 8.99, Jahmyr Gibbs 8.93, James Cook III 8.88, Emmett Johnson 8.76, C. McCaffrey 8.32, D\'Andre Swift 8.27, Jonah Coleman 8.16, Chuba Hubbard 7.84, Bhayshul Tuten 7.63, Derrick Henry 7.13',
              "WR sheet: Ja'Marr Chase 9.02, CeeDee Lamb 8.58, Amon-Ra St. Brown 8.53, Tee Higgins 8.20, Justin Jefferson 7.82, George Pickens 7.69, P. Washington 7.38, Rashee Rice 7.30, Luther Burden III 7.25, Malik Nabers 7.00"]},
    {'author': 'yourlinemate', 'url': 'https://x.com/yourlinemate/status/2124261574659776660', 'posted': 'Sat 11/21 2:00 PM PT', 'type': 'anytime-TD streak sheet, context only',
     'legs': ['McCaffrey 8/8, J. Cook 8/8, B. Tuten 4/4, T. Pollard 3/3, N. Adkins 3/3, J. Gibbs 3/3, S. Barkley 3/3, B. Irving 3/3, E. Johnson 3/3, L. Burden 3/3']},
    {'author': 'xEP_Network', 'url': 'https://x.com/xEP_Network/status/2124282464646660158', 'posted': 'Sat 11/21 3:23 PM PT', 'type': 'matchup stat, context only',
     'legs': ['Dak Prescott vs TEN: TEN allows 281.6 pass yds/g (most), 71.0% completions (31st), 8.25 Y/A (31st), explosive rate 32nd; matchup score 100/100']},
]
out = {'schema': 'chrome_article_picks_v1', 'week': 11, 'season': 2026, 'status': 'pending_andy_review',
       'note': ('Sat 2026-11-21 ~3:35 PM PT, Claude X pass. Bookmark agent re-run in --dry-run (351 bookmarks, 6 new since 1:43 PM; no Supabase writes; Gemini disabled). '
                'The 5 image posts were read directly on x.com via Claude in Chrome (logged-in Browser 1, read-only). Cody Brown (preferred expert) card recorded as standalone weather targets; '
                'everything else is a parlay package or a data sheet (context only). Per Andy 11/21: TB and ARI rows carry QB caveat tags. All names checked against espn-full-rosters-latest.json. '
                'Not loaded into Supabase. No new videos in these posts; the W11 media queue is 12/12 processed.'),
       'picks': picks, 'context_items': context, 'no_card': 0, 'dropped': 0}
json.dump(out, open('data/intel/extracted/2026-w11-chrome-article-picks.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('picks', len(picks), 'context', len(context))
