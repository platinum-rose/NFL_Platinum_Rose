#!/usr/bin/env python3
"""Week 2 Master Betting Intelligence Report -- same 11-section structure and
HTML-in-markdown markup as the Week 1 master dossier
(dist/nfl_week1_master_packet/nfl_week1_master_betting_intelligence_summary.md),
driven by the game data in build_supercontest_report_week2.py.

Produces:
  scratch/nfl_week2_master_betting_intelligence_summary.md
  dist/nfl_week2_master_packet/nfl_week2_master_betting_intelligence_summary.{md,html,docx}
  dist/nfl_week2_master_packet/index.html   (packet page with nav, like Week 1)

There is no Week 2 Monte Carlo run. Section 2 is a MARKET-IMPLIED board
(implied team scores from spread + total, book ML vs Kalshi win probability) and
is labeled as such.
Data as of 2026-09-19 night (market: BKR sportsbook lines; Kalshi 09-19; injuries Fri 06:14Z + Burrow cleared).
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scratch'))
import build_supercontest_report_week2 as sc  # noqa: E402  (also patches convert_summary.Path)
import convert_summary  # noqa: E402

tip, logo, NAMES, fmt, G = sc.tip, sc.logo, sc.NAMES, sc.fmt, sc.G
BY_HOME = {g['home']: g for g in G}
BACK = '[⬆ Back to Executive Master Board](#executive-master-board)'

# Chronological order (ET kickoffs)
ORDER = ['CHI', 'TEN', 'NYJ', 'ATL', 'BAL', 'HOU', 'TB', 'NE', 'LAC', 'DEN', 'DAL', 'ARI', 'SF', 'KC', 'LAR']

# Book moneyline on the favorite
ML = {'CHI': -222, 'TEN': -320, 'NYJ': -175, 'ATL': -143, 'BAL': -403, 'HOU': -147, 'TB': -414, 'NE': -236,
      'LAC': -318, 'DEN': -151, 'DAL': -204, 'ARI': -199, 'SF': -1055, 'KC': -280, 'LAR': -309}  # BKR 09-19 evening
# total: Saturday 12Z 3-book median -> BKR
TOTAL_MOVE = {'CHI': '48 → 47.5', 'TEN': '39.5 → 39', 'NYJ': '44.5 → 44', 'ATL': '43.5 → 43', 'BAL': '46.5 → 45.5',
              'NE': '41.5 → 41', 'SF': '44.5 → 45', 'DAL': '50.5 → 51', 'KC': '46.5 → 47'}

# Totals / prop notes per game (keyed by home team)
PROPS = {
    'CHI': ["Total 48 — John Ewing: 87% of money on the Over.",
            "Justin Jefferson O6.5 rec (~+100) / O73.5 yds / ATD +160–180 (BettingPros: 53% first-read share with Wentz; Action).",
            "Colson Loveland ATD +190 (Bears TE vs a blitz-heavy D); Caleb Williams ATD +340.",
            "DJ &amp; Bucky, Cody Brown and Gavin McHugh have CHI on the moneyline.",
            "<em>Late adds:</em> Harry Lock — Jefferson O59.5 rec yds; Sal Bets — Luther Burden O53.5 rec yds; Colston Loveland first TD +1200 (FirstTDBets); Rome Odunze ATD (Harry Lock) and 30+ rec yds 4 straight vs MIN (Cody Brown)."],
    'TEN': ["<strong>Under 39.5</strong> — Action ×2, BettingPros, The Favorites.",
            "Saquon Barkley O76.5 rush (Sal Bets: 100 rush yds avg in 11 games as a 7-pt fav); Barkley ATD (Gavin McHugh $500 TD play).",
            "Wan'Dale Robinson (TEN) O34.5 rec yds — Quinyon Mitchell shadows Carnell Tate.",
            "Dallas Goedert ATD +240 (Action; Linemate 5/5 TD streak).",
            "<em>Late adds:</em> Jalen Hurts first TD +700 (FirstTDBets); DeVonta Smith O39.5 rec yds and ATD (Harry Lock); Gunnar Helm first TD +3000."],
    'NYJ': ["Heavy-rain forecast → Under 44.5 lean (heavy-rain unders 202–136).",
            "MarShawn Lloyd O12.5 rush att (MIN blitzed 86% in W1; NYJ won't); Kane Sadiq O20.5 rec yds.",
            "Matthew Golden ATD +220–240; Garrett Wilson ATD +210.",
            "<em>Late adds:</em> Sal Bets — Breece Hall O18.5 rec yds (32.3 avg as a home dog); Christian Watson O39.5 rec yds (Harry Lock); Kenyon Sadiq first TD +3000."],
    'ATL': ["<strong>Bijan Robinson O126.5 rush+rec</strong> (BettingPros, cleared 4 of last 5) and ATD −210 (Harry Lock TD list; Dan's AI: 60+ rush yds 90% L10).",
            "Kyle Pitts ATD +350; Chuba Hubbard first TD +500.",
            "Penix OUT, Tua doubtful → Cooper Rush: play the Bijan props, not the side.",
            "<em>Late adds:</em> Bijan ATD also from Joe Holka and Harry Lock; 70+ rush yds 4 straight vs CAR (Cody Brown); Chuba Hubbard O52.5 rush (Sal Bets); Tetairoa McMillan O57.5 rec yds (Cody Brown); Drake London O39.5 rec yds (Harry Lock)."],
    'BAL': ["Under 46.5/47 + <strong>Lamar Jackson U221.5 pass yds</strong> (Warren Sharp) — correlated.",
            "Rashod Bateman O2.5 rec (de facto WR1 with Zay Flowers doubtful).",
            "Mark Andrews ATD +125; Juwan Johnson ATD +350; Lamar ATD +165.",
            "<em>Late adds:</em> Derrick Henry ATD (Joe Holka, Harry Lock; 60+ rush yds 10 of 10 per Dan's AI); Chris Olave first TD +1500 and O39.5 rec yds (Harry Lock). Total now 45.5 at BKR (was 46.5) — the Under lost a point."],
    'HOU': ["Wes Reynolds (VSiN): Under 45.5.",
            "Ja'Marr Chase O70.5 rec yds (−114), 100+ (+250), 125+ (+580) — Cody Brown bounce-back case (HOU allowed two 100-yd WRs in W1).",
            "Tee Higgins ATD +200; Dalton Schultz O3.5–4.5 rec ladder; Chase Brown on a 4/4 TD streak.",
            "<strong>Burrow is active</strong> — Chase props get stronger: Chase first TD +750 (FirstTDBets), Xavier Hutchinson O26.5 rec yds with Collins out (Cody Brown), Chase Brown O39.5 rush (Harry Lock)."],
    'TB': ["Quinshon Judkins U49.5 rush (Bowles run D).",
           "Emeka Egbuka first TD +1200 (Joe Holka); Baker Mayfield ATD +550.",
           "<em>Late adds:</em> Harold Fannin first TD +2200 (FirstTDBets); Mayfield O1.5 pass TDs and Egbuka ATD (Harry Lock)."],
    'NE': ["Mac Hollins O35.5 rec yds (NE→PIT HIGH; Joey Porter Jr. OUT); Drake Maye O25 rush yds.",
           "Eli Raridon first TD +2800 (longshot). Extra-rest trend on NE (18-4 SU).",
           "<em>Late adds:</em> Pat Freiermuth O30.5 rec yds (Cody Brown) / O2.5 rec (Harry Lock); Drake Maye ATD (Harry Lock)."],
    'LAC': ["Ladd McConkey ATD +175 (if active); Jack Bech ATD +800.",
            "<em>Late adds:</em> Ashton Jeanty O49.5 rush and ATD (Harry Lock); Quentin Johnston first TD +900 (FirstTDBets) and 3+ rec 4 straight (Cody Brown)."],
    'DEN': ["Denver team total O21.5 (BettingPros).",
            "Bo Nix pass-attempt ladder O32.5–O47.5 (Action) vs Warren Sharp's Nix U222.5 pass yds.",
            "Parker Washington O4.5 rec (26% target share W1); Courtland Sutton ATD +230; Jakobi Meyers ATD +320.",
            "<em>Late adds:</em> BKR moved to DEN −3 (+102). Parker Washington O39.5 rec yds (Harry Lock); Brenton Strange first TD +1750; Denver D/ST TD (Harry Lock)."],
    'DAL': ["Total 50.5 — highest on the slate.",
            "Jake Ferguson first TD +1100 / ATD; Terry McLaurin ATD +200 (two sources); Ryan Flournoy ATD +350.",
            "<em>Late adds:</em> Ferguson first TD also from FirstTDBets (+1600); CeeDee Lamb ATD (Joe Holka, Harry Lock) and 5+ rec 4 straight vs WAS (Cody Brown); Dak O1.5 pass TDs (Harry Lock, Cody Brown)."],
    'ARI': ["Jaxon Smith-Njigba ATD +135 — now from three sources (Joe Holka, Harry Lock, card); Trey McBride ATD +245 and O4.5 rec (Harry Lock); Jeremiah Love O15.5 rec yds."],
    'SF': ["Brock Purdy O19.5 completions (BettingPros 5-star); Mike Evans O4.5 rec (alt 5+ at +158) &amp; ATD +130.",
           "Deebo Samuel ATD +215; Chris Bell O19.5 rec yds; Achane 60+ rush+rec (4-game streak); Action Under 44.5.",
           "<em>Late adds:</em> Purdy O231.5 pass yds (Sal Bets); Christian McCaffrey ATD (Joe Holka, Harry Lock); Achane first TD +1000 (FirstTDBets). BKR: SF −13, total 45."],
    'KC': ["Daniel Jones U32.5 pass att (BettingPros 5-star); Kenneth Walker O78.5 rush; Rashee Rice O53.5 rec yds.",
           "Mahomes first TD +1800; Tyler Warren ATD +250; BettingPros Under 46.5.",
           "<em>Late adds (Joe Holka SNF card):</em> Kenneth Walker O79.5 rush (second source), Alec Pierce O45.5 rec yds, Jonathan Taylor ATD, Keenan Allen O3.5 rec, Xavier Worthy O3.5 rec."],
    'LAR': ["Isaiah Likely ATD +270; LAR WR overs once Nacua's status is known; Kyren Williams on a 4/4 TD streak.",
            "<em>Late adds (Sal Bets):</em> Kyren Williams ATD, Cam Skattebo O52.5 rush, Jaxson Dart U38.5 rush, Matthew Stafford U259.5 pass yds. BKR: LAR −6.5 (−117)."],
}

PROP_ROWS = [  # player, game home key, market, price, source, note
    ('Justin Jefferson', 'CHI', 'Over 6.5 receptions', '~+100', 'BettingPros; Action', '⭐ Standalone — Grade A'),
    ('Bijan Robinson', 'ATL', 'Over 126.5 rush + rec yds', '—', 'BettingPros', '⭐ Standalone — Grade A−'),
    ('Justin Jefferson', 'CHI', 'Over 73.5 rec yds / Anytime TD', '— / +160–180', 'Action Network', 'Ladder off the receptions play'),
    ('Saquon Barkley', 'TEN', 'Over 76.5 rush yds', '−115', 'Sal Bets', '2-leg with PHI/TEN U39'),
    ('Lamar Jackson', 'BAL', 'Under 221.5 pass yds', '—', 'Warren Sharp', '2-leg with NO/BAL U46.5'),
    ('Bo Nix', 'DEN', 'Under 222.5 pass yds', '—', 'Warren Sharp', 'Conflicts with Action attempts ladder'),
    ('Dalton Schultz', 'HOU', 'Over 3.5 receptions', '—', 'Intel feed (X / podcasts)', '2-leg with Bateman'),
    ('Rashod Bateman', 'BAL', 'Over 2.5 receptions', '—', 'Intel feed (X / podcasts)', 'Flowers doubtful'),
    ("Ja'Marr Chase", 'HOU', 'Over 70.5 rec yds (100+ +250)', '−114', 'Cody Brown', 'Burrow status matters'),
    ('Brock Purdy', 'SF', 'Over 19.5 completions', '—', 'BettingPros (5-star)', ''),
    ('Daniel Jones', 'KC', 'Under 32.5 pass attempts', '—', 'BettingPros (5-star)', ''),
    ('Kenneth Walker', 'KC', 'Over 78.5–79.5 rush yds', '—', 'Intel feed; Joe Holka', 'Two sources'),
    ('Rashee Rice', 'KC', 'Over 53.5 rec yds', '—', 'Intel feed (X / podcasts)', ''),
    ('Mac Hollins', 'NE', 'Over 35.5 rec yds', '—', 'Intel feed (X / podcasts)', 'NE→PIT HIGH matchup'),
    ('Drake Maye', 'NE', 'Over 25 rush yds', '—', 'Intel feed (X / podcasts)', ''),
    ('MarShawn Lloyd', 'NYJ', 'Over 12.5 rush attempts', '—', 'Intel feed (X / podcasts)', ''),
    ('Kane Sadiq', 'NYJ', 'Over 20.5 rec yds', '—', 'Intel feed (X / podcasts)', ''),
    ("Wan'Dale Robinson", 'TEN', 'Over 34.5 rec yds', '—', 'Intel feed (X / podcasts)', ''),
    ('Quinshon Judkins', 'TB', 'Under 49.5 rush yds', '—', 'Intel feed (X / podcasts)', ''),
    ('Parker Washington', 'DEN', 'Over 4.5 receptions', '—', 'Intel feed (X / podcasts)', '26% target share W1'),
    ('Jeremiah Love', 'ARI', 'Over 15.5 rec yds', '—', 'Intel feed (X / podcasts)', ''),
    ('Mike Evans', 'SF', 'Over 4.5 rec / Anytime TD', '+158 (5+) / +130', 'Action; intel feed', 'Moonshot ATD stack'),
    ('Chris Bell', 'SF', 'Over 19.5 rec yds', '—', 'Intel feed (X / podcasts)', ''),
    ("De'Von Achane", 'SF', '60+ rush + rec yds', '—', 'Intel feed (X / podcasts)', '4-game streak'),
    ('Jaxon Smith-Njigba', 'ARI', 'Anytime TD', '+135', 'Joe Holka; Harry Lock; intel feed', 'Three sources — moonshot stack'),
    ('Mark Andrews', 'BAL', 'Anytime TD', '+125', 'Intel feed (X / podcasts)', 'Moonshot ATD stack'),
    ('Isaiah Likely', 'LAR', 'Anytime TD', '+270', 'Intel feed (X / podcasts)', 'Moonshot ATD stack'),
    ('Dallas Goedert', 'TEN', 'Anytime TD', '+240', 'Action Network', 'Linemate 5/5 TD streak'),
    ('Colson Loveland', 'CHI', 'Anytime TD', '+190', 'Intel feed (X / podcasts)', ''),
    ('Terry McLaurin', 'DAL', 'Anytime TD', '+200', 'Intel feed (2 sources)', ''),
    ('Courtland Sutton', 'DEN', 'Anytime TD', '+230', 'Intel feed (X / podcasts)', ''),
    ('Emeka Egbuka', 'TB', 'First TD', '+1200', 'Joe Holka', 'First-TD stack ($5)'),
    ('Jake Ferguson', 'DAL', 'First TD', '+1100 / +1600', 'Joe Holka; FirstTDBets', 'First-TD stack ($5)'),
    ('Chuba Hubbard', 'ATL', 'First TD', '+500', 'Intel feed (X / podcasts)', 'First-TD stack ($5)'),
    ('Patrick Mahomes', 'KC', 'First TD', '+1800', 'Joe Holka', 'First-TD swap'),
    ("Ja'Marr Chase", 'HOU', 'First TD', '+750', 'FirstTDBets', 'Burrow active — first-TD stack'),
    ('Colston Loveland', 'CHI', 'First TD', '+1200', 'FirstTDBets', 'Second source on Loveland'),
    ('Jalen Hurts', 'TEN', 'First TD', '+700', 'FirstTDBets', ''),
    ('Christian McCaffrey', 'SF', 'Anytime TD', '—', 'Joe Holka; Harry Lock', 'Two sources'),
    ('Derrick Henry', 'BAL', 'Anytime TD', '—', 'Joe Holka; Harry Lock', 'Two sources; 2+ TD candidate'),
    ('CeeDee Lamb', 'DAL', 'Anytime TD', '—', 'Joe Holka; Harry Lock', 'Two sources'),
    ('Kyren Williams', 'LAR', 'Anytime TD', '—', 'Sal Bets; Linemate 4/4', 'MNF'),
    ('Brock Purdy', 'SF', 'Over 231.5 pass yds', '—', 'Sal Bets', 'Pairs with O19.5 completions'),
    ('Luther Burden', 'CHI', 'Over 53.5 rec yds', '—', 'Sal Bets', ''),
    ('Breece Hall', 'NYJ', 'Over 18.5 rec yds', '—', 'Sal Bets', ''),
    ('Chuba Hubbard', 'ATL', 'Over 52.5 rush yds', '—', 'Sal Bets', 'Also first TD +500'),
    ('Cam Skattebo', 'LAR', 'Over 52.5 rush yds', '—', 'Sal Bets', 'MNF'),
    ('Matthew Stafford', 'LAR', 'Under 259.5 pass yds', '—', 'Sal Bets', 'MNF'),
    ('Jaxson Dart', 'LAR', 'Under 38.5 rush yds', '—', 'Sal Bets', 'MNF — line jumped from 28.5'),
    ('Xavier Hutchinson', 'HOU', 'Over 26.5 rec yds', '—', 'Cody Brown', 'Collins OUT'),
    ('Tetairoa McMillan', 'ATL', 'Over 57.5 rec yds', '—', 'Cody Brown', ''),
    ('Pat Freiermuth', 'NE', 'Over 30.5 rec yds', '—', 'Cody Brown; Harry Lock (O2.5 rec)', ''),
    ('Alec Pierce', 'KC', 'Over 45.5 rec yds', '—', 'Joe Holka', 'SNF'),
    ('Keenan Allen', 'KC', 'Over 3.5 receptions', '—', 'Joe Holka', 'SNF'),
    ('Xavier Worthy', 'KC', 'Over 3.5 receptions', '—', 'Joe Holka', 'SNF'),
]


def line(g):
    return f"{g['fav']} {fmt(g['cur'])}"


def dog(g):
    return g['home'] if g['fav'] == g['away'] else g['away']


def implied(g):
    s = abs(g['cur'])
    return (g['total'] + s) / 2, (g['total'] - s) / 2


def ml_prob(ml):
    return -ml / (-ml + 100) * 100 if ml < 0 else 100 / (ml + 100) * 100


def gid(g):
    return sc.gid(g)


def title(g):
    return f"{NAMES[g['away']]} at {NAMES[g['home']]}"


def short(g):
    return f"{g['away']} @ {g['home']}"


def pick_text(g):
    team = g['pick'] or g.get('lean')
    ln = sc.side_line(g, team)
    return (f"{NAMES[team]} {fmt(ln)}" if g['pick'] else f"Lean {NAMES[team]} {fmt(ln)} (pass)"), team


# ---------------------------------------------------------------- Section 1
def th(*cells):
    return '| ' + ' | '.join(cells) + ' |'


EXEC_HDR = th('Matchup',
              tip('Market Line', 'Market Line', 'BKR sportsbook spread and total, Saturday 09-19 night. SuperContest lines are in the SuperContest dossier.'),
              'Expert(s) &amp; Source Network', 'Official Selection',
              tip('Ticket / Grade', 'Ticket Type &amp; Grade', 'Standalone = fire alone (the Week 2 TNF lesson: our best reads won as singles while 4–6 leg parlays died on one leg). 2-leg = small correlated ticket. Grades A (highest) to C.'),
              tip('Category / Consensus Level', 'Consensus Level', 'How many distinct shows, writers and X accounts landed on this side versus the other side.'),
              'Primary Strategic Edge')
EXEC_ROWS = [
    ('game-min-chi', 'Vikings @ Bears', 'CHI −5 (open −5.5)<br>O/U: 47.5',
     '**BettingPros** *(53% first-read share)*<br>**Action Network** *(O73.5 yds, ATD)*<br>**Harry Lock** *(O59.5 yds)*',
     '**Justin Jefferson O6.5 Receptions (~+100)**<br>SuperContest: **MIN +5.5**',
     '**Standalone**<br>Grade **A**', '🎯 **Top Prop + Contest #1**',
     'MIN→CHI rated **HIGH** secondary vulnerability: slot CB Kyler Gordon (PUP) and S Anthony Johnson Jr. (OUT). Wentz named Friday.'),
    ('game-car-atl', 'Panthers @ Falcons', 'CAR −2.5<br>O/U: 43',
     '**BettingPros** *(cleared 4 of last 5)*<br>**Joe Holka**, **Harry Lock** *(ATD)*, **Cody Brown** *(70+ rush 4 straight vs CAR)*',
     '**Bijan Robinson O126.5 Rush + Rec Yds**<br>Bijan ATD (−210)',
     '**Standalone**<br>Grade **A−**', '🎯 **Workhorse Volume Prop**',
     'Carolina allowed ~300 rush yds in W1; Penix OUT and Tua doubtful → Cooper Rush and a run-first script. The late X captures added three more Bijan backers.'),
    ('game-jax-den', 'Jaguars @ Broncos', 'DEN −3 (+102)<br>O/U: 45.5',
     '**Fezzik**, **Sharp or Square**, **Action ×2**, **The Favorites**, **BettingPros**, **Wes Reynolds (ML)**, **Gavin McHugh**<br>vs. **Covers** *(JAX)*',
     '**Denver Broncos −3 (+102)**', '**Standalone**<br>Grade **A−**', '🌟 **11-vs-4 Widest Consensus**',
     'BKR moved to −3 at plus money — about the same price as −2.5 at −120. JAX WRs Brian Thomas Jr. and Jakobi Meyers both questionable.'),
    ('game-nyg-lar', 'Giants @ Rams (MNF)', 'LAR −6.5 (−117)<br>O/U: 48',
     '**Lock &amp; Cash ×3**, **Action**, **Sharp or Square**, **BettingPros**, **Wes Reynolds**<br>vs. **Covers**, **Jason Logan**',
     '**Los Angeles Rams −6.5**', '**Standalone**<br>Grade **B+**', '🔥 **Silencer + Zigzag Systems**',
     'The market fell to −6.5: a better number for a bet (a 7-point win now cashes), a worse one for the contest. LAR→NYG is the week\'s top secondary-vulnerability score (6.49).'),
    ('game-phi-ten', 'Eagles @ Titans', 'PHI −7<br>O/U: **39** (was 39.5)',
     '**Action ×2**, **BettingPros**, **The Favorites**',
     '**Full Game Under 39 (−103)**', '**Standalone**<br>Grade **B**', '🛡️ **Consensus Best Total**',
     'Lost half a point since Saturday morning. Two conservative offenses; a 7-point favorite in a sub-40 total wants to run clock. Greenard OUT is the risk.'),
    ('game-mia-sf', 'Dolphins @ 49ers', 'SF −13 (open −12.5)<br>O/U: 45',
     '**Sharp or Square**, **Action**, **BettingPros ×2**, **Jason Logan (Covers)**<br>vs. **Covers ATS** *(SF)*',
     '**Miami Dolphins +13 (−104)** — shop +13.5', '**Standalone**<br>Grade **B**', '🌟 **8-vs-1 Near-Unanimous Dog**',
     'SF closes games conservatively; backdoor volume from Chris Bell and Achane. BKR has +13; +13.5 elsewhere is worth the shop.'),
    ('game-cle-tb', 'Browns @ Buccaneers', 'TB −8.5 (−103)<br>O/U: 41.5',
     '**BettingPros** *(survivor consensus)*, **Action**, **The Favorites**, **Covers**',
     '**TB −8.5** — prefer as **teaser leg −2.5**', '**Teaser Leg**<br>Grade **B**', '🏆 **Survivor Consensus**',
     'Watson-led Browns "non-functional" (BettingPros). −8.5 → −2.5 crosses both 7 and 3.'),
    ('game-cin-hou', 'Bengals @ Texans', 'HOU −2.5 (−111)<br>O/U: 45.5',
     '**Fezzik**, **Sharp or Square**, **Action**, **BettingPros**, **Lock &amp; Cash**, **Gavin McHugh**<br>vs. **Covers** *(CIN)*',
     '**Pass on HOU −2.5** → **CIN +8.5 teaser leg**', '**Pass / Teaser**', '🔄 **Burrow Cleared**',
     "Our HOU case assumed Burrow was limited; he's active. The market didn't move (HOU ML −136 → −147), but our reason for the bet is gone. Chase props get stronger."),
    ('master-teaser-matrix', '2-Leg: Schultz + Bateman', 'Receptions',
     '**Card draft** *(injury-driven target shares)*; **Cody Brown** *(Hutchinson O26.5)*', '**Dalton Schultz O3.5 Rec + Rashod Bateman O2.5 Rec**',
     '**2-Leg Ticket**', '🎰 **Target Inheritance**', 'Both inherit targets: Nico Collins OUT (HOU), Zay Flowers doubtful (BAL).'),
    ('game-phi-ten', '2-Leg: Eagles @ Titans', 'PHI −7<br>O/U: 39',
     '**Sal Bets** *(also on video, −115)*; **Action**, **BettingPros**', '**Saquon Barkley O76.5 Rush + Under 39**', '**2-Leg Ticket**', '🎰 **Clock-Control Script**',
     'Barkley averaged 100 rush yds in 11 games as a 7-point favorite; that script also keeps the total down.'),
    ('game-no-bal', '2-Leg: Saints @ Ravens', 'BAL −8.5<br>O/U: **45.5** (was 46.5)',
     '**Warren Sharp**; **Wes Reynolds** *(U46.5)*', '**Under 45.5 + Lamar Jackson U221.5 Pass Yds**', '**2-Leg (downgraded)**<br>Grade **C+**', '🎰 **Correlated Under**',
     'The total dropped a full point, so most of the Under value is gone. Keep only if you can still find 46.5.'),
    ('master-teaser-matrix', 'Wong Teasers', 'BAL/TB −8.5<br>ATL/CIN +2.5',
     '**Even Money** *(Tucker &amp; Fezzik)*', '**BAL −2.5 / TB −2.5**<br>**ATL +8.5 / CIN +8.5**', '**2-Team Teasers**', '🎲 **Classic Wong Legs**',
     'Every leg crosses 3 and 7. LAR dropped out — at −6.5 it no longer fits the teaser rule. CIN +8.5 is live now that Burrow plays.'),
    ('master-teaser-matrix', 'Underdog ML Round Robin', 'NYJ +152, ATL +125, WAS +177<br>ARI +174, IND +239, MIN +191',
     '≥3 spread backers each', '**6 dogs, 2-team RR (15 × $2)**', '**Small (≤$30)**', '⚡ **Dog RR (Card Slot 2)**',
     'Each dog has at least three spread backers; Kalshi priced them 27–43%. Two hits out of six return about half the stake; three hits return about 1.5× the stake.'),
    ('game-det-buf', 'Lions @ Bills (TNF)', 'BUF −4.5<br>**Final: 41–31**',
     '**Fezzik** *(BUF −4.5)*', '**BUF −4.5 (WIN ✅)**', '🏁 **FINAL**', '🏆 **GRADED: WIN**',
     'Bills covered by 5.5. TNF lesson: the highest-margin reads cashed as singles; long parlays died on one leg.'),
]

def exec_board():
    rows = [EXEC_HDR, '| :--- | :--- | :--- | :--- | :---: | :--- | :--- |']
    for anchor, m, mk, ex, sel, tk, cat, edge in EXEC_ROWS:
        rows.append(th(f'[**{m}**](#{anchor})', mk, ex, f'[{sel}](#{anchor})', tk, f'[{cat}](#{anchor})', edge))
    return '\n'.join(rows)


# ---------------------------------------------------------------- Section 2
REC_NOTE = {
    'CHI': 'Market play: Jefferson O6.5 rec (A)', 'TEN': 'Market play: Under 39 (B)',
    'ATL': 'Market play: Bijan O126.5 rush+rec (A−)', 'BAL': 'Market play: teaser −2.5',
    'TB': 'Market play: teaser −2.5', 'NYJ': 'Market play: dog ML RR leg (+152); rain Under 44',
    'ARI': 'Market play: ARI +4 or better; dog ML RR (+174)', 'KC': 'Market play: D. Jones U32.5 att, Walker O79.5',
    'LAR': 'Market play: LAR −6.5 (B+)', 'SF': 'Market play: MIA +13 (B; shop +13.5)', 'DEN': 'Market play: DEN −3 +102 (A−)',
    'HOU': 'Market play: CIN +8.5 teaser leg; Chase props', 'DAL': 'Market play: WAS ML in dog RR (+177)',
}
def forecast_board():
    hdr = th('Matchup', 'Market Line &amp; Total',
             tip('Market-Implied Score', 'Implied Team Scores', 'Favorite = (total + spread) / 2, underdog = (total − spread) / 2. What the betting market expects — not a simulation.'),
             tip('Book ML Win %', 'Sportsbook Moneyline Probability', 'Win probability implied by the favorite\'s moneyline, vig included (runs ~2 points high).'),
             tip('Kalshi Win %', 'Prediction-Market Probability', 'Kalshi game-winner contract price, 09-19. Close to a no-vig price.'),
             tip('Kalshi − Book', 'Prediction-Market Lean', 'Kalshi minus book ML probability. About −2 is normal (vig). Below −3.5 = Kalshi cooler on the favorite; 0 or above = Kalshi warmer.'),
             tip('Contest Edge', 'SuperContest vs Market', 'Points the locked SuperContest line gives our side versus the current market.'),
             tip('SC Grade', 'SuperContest Grade', 'Conviction on the side at the locked SuperContest number (from the SuperContest dossier). Grades for market bets are in Section 1.'),
             'Recommendation')
    rows = [hdr, '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |']
    for h in ORDER:
        g = BY_HOME[h]
        f_s, d_s = implied(g)
        bp = ml_prob(ML[h])
        diff = g['kalshi'] - bp
        flag = ' 🔻 *cool on fav*' if diff <= -3.5 else (' 🔺 *warm on fav*' if diff >= 0 else '')
        txt, team = pick_text(g)
        rec = f"**{txt}**" + (f"<br>*{REC_NOTE[h]}*" if h in REC_NOTE else '')
        edge = sc.movement(g, team)
        edge_s = f"**{fmt(edge)} on {team}**" if edge else '0.0'
        tm = f"<br>*(total {TOTAL_MOVE[h]})*" if h in TOTAL_MOVE else ''
        rows.append(th(f'[**{short(g)}**](#{gid(g)})', f"{line(g)}<br>({g['total']}){tm}",
                       f"**{g['fav']} {f_s:.1f} — {dog(g)} {d_s:.1f}**", f"{bp:.1f}%", f"**{g['kalshi']}%**",
                       f"{diff:+.1f}{flag}", edge_s, f"**{g['grade']}**", rec))
    return '\n'.join(rows)


# ---------------------------------------------------------------- Section 3
def spotlight(n, g, emoji, label_, lead):
    head, count, pro, con = g['align']
    txt, team = pick_text(g)
    f_s, d_s = implied(g)
    why = '\n'.join(f"  * **{t}:** {d}" for t, d in g['why'])
    extra = ''.join(f"\n  * {e}" for e in g['extra'])
    con_s = ', '.join(n_ for n_, _ in con) or '—'
    return f"""<details class="rollup-box section-3" id="consensus-{g['away'].lower()}-{g['home'].lower()}">
<summary>{emoji} #{n} {label_}: {txt} — {title(g)}</summary>
<div class="rollup-content">

* **Game Details:** {g['kick']} | **Market Spread:** {line(g)} (opened {g['fav']} {fmt(g['open'])}; contest {g['fav']} {fmt(g['contest'])}) | **Total:** {g['total']}
* **Market Read:** Implied score {g['fav']} {f_s:.1f} — {dog(g)} {d_s:.1f}; Kalshi {NAMES[g['fav']]} {g['kalshi']}% to win. {lead}
* **Consensus Count:** 🌟 **{head} ({count})** — for: {', '.join(n_ for n_, _ in pro)} | against: {con_s}
* **The Case:**
{why}{extra}
* **Injuries (Fri game status):** {g['injuries']}
* **Recommendation:** **{txt}** (Grade {g['grade']}) — full breakdown in the [game dossier](#{gid(g)}).

{BACK}
</div>
</details>
"""


def clash(anchor, head, body):
    return f"""<details class="rollup-box section-3" id="{anchor}">
<summary>⚔️ Clash: {head}</summary>
<div class="rollup-content">

{body}

{BACK}
</div>
</details>
"""


def consensus_section():
    s = spotlight(1, BY_HOME['DEN'], '🌟', 'Widest Consensus', 'BKR moved to −3 (+102); the total moved 43.5 → 45.5.')
    s += spotlight(2, BY_HOME['SF'], '🌟', 'Near-Unanimous Dog', 'The line peaked at −13.5 and is back to −13 at BKR.')
    s += spotlight(3, BY_HOME['LAR'], '🔥', 'Sharp-Show Lean (MNF)', 'The market went −7.5 → −6.5 — better for a bet, worse for the contest.')
    s += spotlight(4, BY_HOME['CHI'], '🎯', 'Media vs Moneyline Crowd', 'The line dipped to −4.5 after Wentz was named and is back to −5 at BKR.')
    s += spotlight(5, BY_HOME['NYJ'], '🎯', 'Key-Number Value + Rain', 'BKR has GB −3 (from −4.5 open) — the move is toward the Jets.')
    s += clash('clash-cin-hou', 'Bengals +2.5 vs. Texans −2.5 — 11 vs 3, but Burrow is active',
               "* **HOU side (11):** Fezzik, Sharp or Square, Action, BettingPros, plus late captures from Lock &amp; Cash (Zigzag) and Gavin McHugh.\n"
               "* **CIN side (3):** Covers' ATS column (+2.5), BettingPros alternate, DJ &amp; Bucky.\n"
               "* **Read:** Our HOU pick assumed Burrow was limited; his designation was removed. The market barely moved (HOU still −2.5, ML −136 → −147), so this isn't a fade of Houston — we just no longer have a reason to lay it. Use **CIN +8.5** as a Wong teaser leg and play Chase (O70.5 rec yds, first TD +750).")
    s += clash('clash-ind-kc', 'Colts +6.5 vs. Chiefs −6.5 (SNF) — 10 vs 8',
               "* **KC side:** The Favorites, Covers, Gavin McHugh, most article writers.\n"
               "* **IND side:** Sharp or Square, Action, Wes Reynolds (VSiN) at +6.5, Lock &amp; Cash (Zigzag).\n"
               "* **Market:** Kalshi prices KC −6.5 at ≈49.5% — a coin flip. IND +6.5 is a Master Round Robin leg; **props:** Daniel Jones U32.5 attempts, Kenneth Walker O79.5 rush (two sources).")
    s += clash('clash-was-dal', 'Commanders +4 vs. Cowboys −4 — 4 vs 5',
               "* **DAL side:** Lock &amp; Cash Silencer System, Covers, BettingPros, Action.\n"
               "* **WAS side:** Even Money, Sharp or Square, Gavin McHugh (+4); the contest's +4.5 is a free hook (SuperContest #5).\n"
               "* **Market:** BKR DAL −4, total 51 — highest on the slate.")
    s += clash('clash-sea-ari', 'Cardinals +4 vs. Seahawks −4 — 7 vs 3',
               "* **ARI side (7):** Fezzik, Even Money, Sharp or Square, Covers, Wes Reynolds at +4 / +4.5.\n"
               "* **SEA side (3):** Robert Mays (The Athletic), Action.\n"
               "* **Read:** Drew Lock starts for SEA (Darnold OUT); ARI is without CB Garrett Williams and James Conner. Bet ARI at +4 or better (BKR +4, −113); the SuperContest's +3.5 is worse than market.")
    return s

# ---------------------------------------------------------------- Section 4
def feature(anchor, head, body):
    return f"""<details class="rollup-box section-4" id="{anchor}">
<summary>{head}</summary>
<div class="rollup-content">

{body}

{BACK}
</div>
</details>
"""


def feature_section():
    s = feature('feature-jefferson', '🎯 Feature Play 1: Justin Jefferson Over 6.5 Receptions (Vikings @ Bears)',
                "* **The Case:** BettingPros measured a 53% first-read share for Jefferson with Carson Wentz in Week 1; Action Network also has O73.5 yds and ATD (+160–180); Harry Lock has O59.5 yds.\n"
                "* **Matchup:** Chicago's slot CB Kyler Gordon (PUP) and S Anthony Johnson Jr. (OUT) leave the middle of the field open — MIN→CHI is a HIGH secondary-vulnerability matchup.\n"
                "* **Risk:** Brian O'Neill (Q) — pressure shortens Wentz's reads, which usually helps a first-read target.\n"
                "* **Ticket:** Standalone. Ladders: O73.5 yds, ATD.")
    s += feature('feature-bijan', '🎯 Feature Play 2: Bijan Robinson Over 126.5 Rush + Rec Yds (Panthers @ Falcons)',
                 "* **The Case:** Cleared this number in 4 of his last 5 (BettingPros); 70+ rush yds in 4 straight vs Carolina (Cody Brown); 60+ rush yds in 9 of his last 10 (Dan's AI); ATD from Joe Holka and Harry Lock.\n"
                 "* **Matchup:** Carolina allowed ~300 rush yds in Week 1. With Penix OUT and Tua doubtful, Cooper Rush means a run-first plan.\n"
                 "* **Ticket:** Standalone.")
    s += feature('feature-phi-ten-under', '🛡️ Feature Play 3: Eagles @ Titans Under 39',
                 "* **Backers:** Action Network ×2, BettingPros, The Favorites.\n"
                 "* **The Case:** Lowest total on the slate; Philadelphia as a 7-point road favorite leans on Barkley and clock control. BKR has 39 (−103) — half a point worse than Saturday morning.\n"
                 "* **2-leg option:** Barkley O76.5 rush (−115) + Under 39 (Sal Bets' volume case).")
    s += feature('feature-late-captures', '🐦 Late X Captures (Grok re-run 2): Multi-Source Props',
                 "The nine late bookmark threads added 85 picks. The ones that line up with something already on our board:\n\n"
                 "* **Anytime TD, two or more sources:** Jaxon Smith-Njigba (Holka, Harry Lock, card +135), Christian McCaffrey (Holka, Harry Lock), Derrick Henry (Holka, Harry Lock), CeeDee Lamb (Holka, Harry Lock), Bijan Robinson (Holka, Harry Lock), Kyren Williams (Sal Bets, Linemate 4/4).\n"
                 "* **First TD, two sources:** Jake Ferguson (Holka +1100, FirstTDBets +1600); Colston Loveland (earlier ATD +190, FirstTDBets first TD +1200).\n"
                 "* **Sal Bets' 7 best bets — now captured (was a gap):** Barkley O76.5 rush, Wan'Dale Robinson O34.5 rec yds, MarShawn Lloyd O12.5 att, Chris Bell O19.5 rec yds, Purdy O231.5 pass yds, Luther Burden O53.5 rec yds, Breece Hall O18.5 rec yds; plus Dart U38.5 rush, Skattebo O52.5, Stafford U259.5, Hubbard O52.5, Kyren ATD.\n"
                 "* **Joe Holka SNF card:** Kenneth Walker O79.5 rush, Alec Pierce O45.5 rec yds, Jonathan Taylor ATD, Keenan Allen O3.5 rec, Xavier Worthy O3.5 rec.\n"
                 "* **Cody Brown:** Xavier Hutchinson O26.5 rec yds (Collins OUT), Tetairoa McMillan O57.5, Pat Freiermuth O30.5; plus a 14-player 'cashed 4 straight vs this opponent' list.\n"
                 "* **Lock &amp; Cash Zigzag system:** GB −3.5, HOU −2.5, LAC −6.5, IND +6.5, LAR −7 (see Section 10).")
    s += feature('feature-signature-bets', '🎙️ Signature Expert Bets — Who Has What',
                 "* **Steve Fezzik (via Ross Tucker Pod) — 5 best:** BUF −4.5 ✅ (41–31), NYJ +3.5, HOU −2.5, DEN −2.5, ARI +4.5.\n"
                 "* **Even Money teaser legs:** BAL −2.5, TB −2.5, LAR −1, JAX +8.5, ATL +7.5.\n"
                 "* **Sharp or Square:** LAR −7, MIA +13.5, PIT +5.5, NO +8.5, LV +7, IND +6.5.\n"
                 "* **Lock &amp; Cash:** Official free pick MIN +5.5; Silencer System DAL −3.5, LAR −7; Zigzag GB, HOU, LAC, IND, LAR.\n"
                 "* **VSiN — Wes Reynolds:** MIN +5, LAR −7, IND +6.5, ARI +4, DEN ML −145, CIN/HOU Under 45.5, NO/BAL Under 46.5.\n"
                 "* **Covers — ATS for every game:** CAR −2.5, CHI −5.5, PHI −7.5, PIT +5.5, NYJ +3.5, TB −8.5, NO +8.5, CIN +2.5, JAX +2.5, LV +6.5, DAL −3.5, ARI +4.5, SF −13.5, KC −6.5, NYG +6.5.\n"
                 "* **Covers — Jason Logan spot bets:** NYG +7 (letdown), GB −3.5 (look-ahead), MIA +13.5 (travel).\n"
                 "* **Gavin McHugh:** HOU −2.5, LAC −6.5, DEN −2.5, WAS +4, KC −6.5; Barkley ATD ($500).\n"
                 "* **Warren Sharp:** Lamar Jackson U221.5 pass yds; Bo Nix U222.5 pass yds.\n"
                 "* **BettingPros 5-star props:** Daniel Jones U32.5 pass attempts; Brock Purdy O19.5 completions.\n"
                 "* **Moneyline cards:** Parlay Judge (BUF ✅, BAL, GB, PHI, HOU, TB, NE, CAR, LAC, ARI +190, DAL, SF); thepropdealer 14-leg favorites parlay (CHI, PHI, BAL, NE, TB, GB, CAR, HOU, LAC, DEN, DAL, SEA, SF, KC).")
    return s

# ---------------------------------------------------------------- Section 5
TEASER_HDR = th('Game',
                tip('Teaser Leg', 'Teaser Leg', 'The side in a 6-point teaser. Moving favorites of −7.5 to −8.5 down, or dogs of +1.5 to +2.5 up, through 3 and 7 is the Wong strategy.'),
                'Original', tip('Teased', 'Teased Line', 'The line after the 6-point adjustment.'),
                tip('Key Numbers', 'Key Numbers Crossed', '3 and 7 are the most common NFL margins of victory.'),
                'Total', 'Backers')
TEASERS = [
    ('Saints @ Ravens', 'Baltimore Ravens', '−8.5', '−2.5', '3, 7', '45.5', 'Even Money; 5–3 side consensus'),
    ('Browns @ Buccaneers', 'Tampa Bay Buccaneers', '−8.5', '−2.5', '3, 7', '41.5', 'Even Money; survivor consensus'),
    ('Panthers @ Falcons', 'Atlanta Falcons', '+2.5', '+8.5', '3, 7', '43', 'Even Money (+7.5 from +1.5)'),
    ('Bengals @ Texans', 'Cincinnati Bengals', '+2.5', '+8.5', '3, 7', '45.5', 'Burrow active; Covers ATS on CIN +2.5'),
    ('Giants @ Rams', 'Los Angeles Rams', '−6.5', '−0.5', '3, 6', '48', '<strong>No longer fits</strong> — the rule wants −7.5 to −8.5'),
    ('Jaguars @ Broncos', 'Jacksonville Jaguars', '+3', '+9', '6, 7', '45.5', '<strong>No longer fits</strong> at +3, and it conflicts with DEN'),
]


def teaser_section():
    rows = [TEASER_HDR, '| :--- | :--- | :---: | :---: | :---: | :---: | :--- |']
    rows += [th(f'**{a}**', f'**{b}**', c, f'**{d}**', f'**{e}**', f, g) for a, b, c, d, e, f, g in TEASERS]
    return ("Stanford Wong's basic strategy: a 6-point NFL teaser is +EV when it moves favorites of −7.5 to −8.5 down through 7 and 3, "
            "or dogs of +1.5 to +2.5 up through 3 and 7, best in totals of 49 or lower. At BKR's lines this week has two textbook favorites (BAL, TB) and two dogs (ATL, CIN); LAR and JAX moved out of range.\n\n"
            "### The Master Week 2 Teaser Board\n\n" + '\n'.join(rows) + """

### Optimal Teaser Pairings (keep each at 2 legs — the TNF lesson)
1. **Favorites Pair (1:00 PM):**
   * Leg 1: Baltimore Ravens (−8.5 → −2.5)
   * Leg 2: Tampa Bay Buccaneers (−8.5 → −2.5)
2. **Dogs Pair (1:00 PM):**
   * Leg 1: Atlanta Falcons (+2.5 → +8.5)
   * Leg 2: Cincinnati Bengals (+2.5 → +8.5) — live now that Burrow plays
3. **Optional 4-leg round robin of the same legs** (six 2-team teasers) if you want one ticket family instead of two.

### ⚡ Underdog Moneyline Round Robin (Card Slot 2 — 6 legs, 2-team, 15 × $2 = $30)
* **New York Jets ML (+152)** vs. Green Bay — market moved GB −4.5 → −3; heavy rain.
* **Atlanta Falcons ML (+125)** vs. Carolina — Bijan-driven game script.
* **Washington Commanders ML (+177)** at Dallas.
* **Arizona Cardinals ML (+174)** vs. Seattle — Drew Lock starts for SEA.
* **Minnesota Vikings ML (+191)** at Chicago — our SuperContest #1; Lock &amp; Cash thinks MIN can win outright.
* **Indianapolis Colts ML (+239)** at Kansas City (SNF) — Wes Reynolds, Sharp or Square, Action on IND +6.5.
* **The Rationale:** Each dog has at least three spread backers; Kalshi prices them 27–43%. A 2-team round robin needs only two of six to hit to return about half the stake; three hits return about 1.5× the stake.""")


# ---------------------------------------------------------------- Section 6
def dossier_card(i, g):
    head, count, pro, con = g['align']
    txt, team = pick_text(g)
    f_s, d_s = implied(g)
    bp = ml_prob(ML[g['home']])
    tag = (f"[SUPERCONTEST #{g['rank']}]" if g.get('rank') and g['rank'] <= 5
           else f"[ALTERNATE #{g['rank']}]" if g.get('rank') else '[PASS — PROPS/TOTALS]')
    reasons = '\n'.join(f"  * **{t}:** {d}" for t, d in g['why'])
    extra = ''.join(f"\n  * {e}" for e in g['extra'])
    props = '\n'.join(f"  * {p}" for p in PROPS[g['home']])
    con_s = f" | against: {', '.join(n for n, _ in con)}" if con else ''
    tm = f" (moved {TOTAL_MOVE[g['home']]})" if g['home'] in TOTAL_MOVE else ''
    return f"""<details class="rollup-box section-6" id="{gid(g)}">
<summary>{i}. {title(g)} — {g['kick']} {tag}</summary>
<div class="rollup-content">

* **Lines:** Market {line(g)} (opened {g['fav']} {fmt(g['open'])}; SuperContest {g['fav']} {fmt(g['contest'])}) | **Total:** {g['total']}{tm} | **ML:** {g['fav']} {ML[g['home']]}
* **Market-Implied Card:**
  * **Implied Score:** {NAMES[g['fav']]} {f_s:.1f} — {NAMES[dog(g)]} {d_s:.1f}
  * **Win Probability:** Kalshi {g['kalshi']}% vs book ML {bp:.1f}% (vig included)
  * **Matchup Edge:** {g['adv']}
* **Expert Alignment:** 🌟 **{head} ({count})** — for: {', '.join(n for n, _ in pro)}{con_s}
* **Side Analysis:**
{reasons}{extra}
* **Totals &amp; Props:**
{props}
* **Injuries (Fri game status):** {g['injuries']}
* **Recommendation:** **{txt}** — Grade {g['grade']}.

{BACK}
</div>
</details>
"""


def dossier_section():
    out = [dossier_card(i, BY_HOME[h]) for i, h in enumerate(ORDER, 1)]
    out.append(f"""<details class="rollup-box section-6" id="game-det-buf">
<summary>16. Detroit Lions at Buffalo Bills — Thu 8:15 PM ET [🏁 FINAL: BUF 41, DET 31]</summary>
<div class="rollup-content">

* **Closing Line:** BUF −4.5 | **Final:** Bills 41 — Lions 31 (BUF covered by 5.5; 72 total points).
* **Graded:** Fezzik's BUF −4.5 ✅. The Thursday card's best single reads won; the long parlays each lost a leg — the reason this report fires top reads as singles or 2-leg tickets.

{BACK}
</div>
</details>
""")
    return '\n'.join(out)


# ---------------------------------------------------------------- Section 7
CARDS_HDR = th('Card Slot', 'Legs', 'Format', tip('Stake', 'Template Stake', 'The stake range from the weekly card template.'), 'Payout / Note')
CARDS = [
    ('<a id="card-master-rr"></a>**1. Master Round Robin**', 'DEN −3 · PHI/TEN U39 · LAR −6.5 · MIA +13 · TB −8.5 · MIN +5 · NYJ +3 · IND +6.5', '8 legs, 4-team (70 combos)', '$1–2 per combo ($70–140)', 'Each 4-team combo pays ≈13.4–15.6×'),
    ('<a id="card-dog-rr"></a>**2. ML Underdog Round Robin**', 'NYJ +152 · ATL +125 · WAS +177 · ARI +174 · MIN +191 · IND +239', '6 legs, 2-team (15 combos)', '$2 per combo ($30)', 'Average 2-team combo pays ≈7.6×'),
    ('<a id="card-am"></a>**3. Morning-Weighted Parlay**', 'TB ML −414 · BAL ML −403 · PHI ML −320 · NE ML −236 · CHI ML −222 · DEN ML −151 (PM) · cap KC ML −280', '7 legs', '$25–30', '≈+847 ($237–284 on $25–30); adding HOU ML −147 → ≈+1492'),
    ('<a id="card-pm"></a>**4. Afternoon-Weighted Parlay**', 'SF ML −1055 · LAC ML −318 · DEN ML −151 · TB ML −414 · BAL ML −403 · PHI ML −320 · cap KC ML −280', '7 legs', '$25–30', '≈+560; SEA and DAL MLs would push it past +1000 but conflict with the ARI/WAS dog legs'),
    ('<a id="card-hybrid"></a>**5. Hybrid Best-Reads**', 'Jefferson O6.5 rec · Bijan O126.5 R+R · DEN −3 · PHI/TEN U39 · LAR −6.5', '5 legs', '~$20', 'Singles first; this is the add-on'),
    ('<a id="card-sc"></a>**6. SuperContest 5-Teamer**', 'MIN +5 · DEN −3 · NYJ +3 · MIA +13 · WAS +4 (BKR); buy DEN to −2.5 and NYJ to +3.5 to mirror the contest', '5 legs', 'Your call', '≈+2812 at BKR prices before buying points'),
    ('<a id="card-props"></a>**7. Player Prop Stacks**', 'Legit: Jefferson O6.5 rec · Bijan O126.5 · Purdy O19.5 comp · Barkley O76.5 rush · Walker O79.5 rush · Hutchinson O26.5 rec yds<br>Moonshot ATD: JSN · CMC · Derrick Henry · Mark Andrews +125 · Isaiah Likely +270', '2–4 slips', '$25–30 total', 'Prices from the book'),
    ('<a id="card-ftd"></a>**8a. First TD Stack**', "Egbuka +1200 · Jake Ferguson +1100–1600 · Ja'Marr Chase +750 (swaps: Loveland +1200, Mahomes +1800)", '3 legs', '$5', 'Well above +7000'),
    ('<a id="card-2td"></a>**8b. 2+ TD Stack**', 'Bijan Robinson · Derrick Henry · Christian McCaffrey', '3 legs', '$5', 'Price-check; 3 legs may not reach +7000'),
    ('<a id="card-island"></a>**9. Island Games**', 'SNF: D. Jones U32.5 att · Walker O79.5 · Pierce O45.5 · Worthy O3.5 rec · JT ATD<br>MNF: Kyren ATD · Skattebo O52.5 · Stafford U259.5 · Dart U38.5 rush · Likely ATD +270', 'Tiered ladders', '$10 / $5 / $5', 'Tier prices from the book'),
]


def parlay_section():
    rows = [CARDS_HDR, '| :--- | :--- | :---: | :---: | :--- |'] + [th(*c) for c in CARDS]
    return ("The Week 2 card, slot by slot, from Andy's weekly card template (`docs/NFL_WEEKLY_CARD_PROCESS.md`). Full notes: `docs/cards/2026-W02-sun-mon-card-draft.md`. "
            "Prices are BKR (Sat night) where BKR lists the market. **Nothing is placed or logged yet** — log each ticket to `data/official-picks/user-placed-wagers-2026.json` as it's placed.\n\n"
            + '\n'.join(rows) + """

### Construction Rules After TNF
* The highest-margin reads (Jefferson, Bijan, DEN, U39.5) go in as **singles first**; the multi-leg cards are small add-ons.
* No card mixes a side with its own teaser conflict (DEN −3 vs JAX +9 is out; HOU is a pass, so CIN +8.5 is clean).
* Deliberate middles: KC ML (slots 3–4 cap) with IND +6.5 (RR) and IND ML (dog RR) — KC by 1–6 wins both; CHI ML (slot 3) with MIN +5 (RR) — CHI by 1–4 wins both.""")


STEAM = """* **Feed Status:** 87 bookmarks from the last 6 days, plus 9 late threads captured by Grok (re-run 2). All 280 Grok/Antigravity picks are now loaded to `research_pick_signals`, each linked to its tweet note.
* **Line Movement (Tue open → Sat 12Z → BKR Sat night):**
  1. **Broncos:** DEN −2.5 → −2.5 → **−3 (+102)** — through the key number; the SuperContest −2.5 is now a free half-point.
  2. **Packers:** GB −4.5 → −3.5 → **−3** — toward NYJ; the contest's +3.5 has the hook for free.
  3. **Rams:** LAR −7 → −7.5 → **−6.5** — reversed; the contest −7 is now half a point worse.
  4. **Bears:** CHI −5.5 → −4.5 → **−5** — the Wentz move partly retraced.
  5. **49ers:** SF −12.5 → −13.5 → **−13**.
  6. **Texans:** HOU −2.5 unchanged; ML −136 → **−147** despite Burrow being cleared.
  7. **Totals:** PHI/TEN 39.5 → **39**; NO/BAL 46.5 → **45.5**; GB/NYJ 44.5 → **44**; MIN/CHI 48 → **47.5**; WAS/DAL 50.5 → **51**; IND/KC 46.5 → **47**.
* **Money Splits:** John Ewing — 87% of money on MIN/CHI Over (48 at the time).
* **Kalshi vs BKR:** see Section 2 — Kalshi sits 0–3 points below the vig-inclusive BKR price on every favorite, i.e. it roughly agrees. The coolest reads are LAC (73% vs 76.1%) and GB (61% vs 63.6%)."""


# ---------------------------------------------------------------- Section 8
def props_section():
    hdr = th('Player', 'Game', 'Market', tip('Price', 'Quoted Price', "The price the source quoted. There is no Sunday/Monday sportsbook prop board in the repo yet — shop before betting."), 'Source', 'Note')
    rows = [hdr, '| :--- | :--- | :--- | :---: | :--- | :--- |']
    for p, h, m, pr, src, note in PROP_ROWS:
        g = BY_HOME[h]
        rows.append(th(f'**{p}**', f'[{short(g)}](#{gid(g)})', m, pr, src, note))
    return "Player props and exotics from the podcasts, articles and X bookmarks, sorted by conviction:\n\n" + '\n'.join(rows)


# ---------------------------------------------------------------- Section 9
SURVIVOR = """Win probabilities: Kalshi (09-19). Future value from `data/research-intel/review/survivor-schedule-evaluated-week2.json`.

### Tier 1: Premier Survivor Picks
1. **Tampa Bay Buccaneers (vs. Cleveland Browns) — Kalshi 79%:**
   * **Backers:** BettingPros survivor-show consensus; Action; The Favorites.
   * **Why:** The only heavy favorite graded **Moderate Utility** for future value (every other big favorite is an "Elite Cornerstone" worth saving). Watson-led Browns. **Best burn of the week.**
2. **Baltimore Ravens (vs. New Orleans Saints) — Kalshi 79%:**
   * **Why:** Same win probability as TB, but **Elite Cornerstone (Save)** — home vs TEN (Wk 4) and CLE (Wk 16) later. Use only in multi-entry to diversify.

### Tier 2: Secondary Options
* **San Francisco 49ers (vs. Miami) — Kalshi 90%:** Safest this week, but Elite Cornerstone with ARI at home in Week 3. Spend only if protecting a small field.
* **Los Angeles Rams (vs. NYG, MNF) — 75%:** No fallback if it loses Monday night; first home game after the Melbourne trip.
* **Kansas City (vs. IND) — 73%**, **LA Chargers (vs. LV) — 73%:** Chargers get little home edge against Raiders crowds.
* **Philadelphia (@ TEN) — 76%:** Already used in Ken's League.

### Tier 3: Minefield Chalk to Avoid
* **Green Bay (@ NYJ):** Rain; the line fell to −3 and Kalshi (61%) is below the book; GB blew 9+ point leads twice in its last 4 losses.
* **Anything at −3 or shorter (HOU, DEN, CAR):** 57–60% — coin flips. HOU also lost its Burrow edge.
* **Chicago (vs. MIN):** The line has fallen to −4.5.

### Entry Status
* **LMS 2022:** Week 1 pick LAR lost (SF 27–7) — check whether the entry is still alive.
* **Ken's League:** PHI won Week 1; PHI no longer available.
* *TrueDFS's Week 2 survivor video discussed 2024 examples (LAC @ CAR, BAL vs LV), so its team picks don't map to the 2026 slate. Its principle — save BAL and PHI for later — does.*"""


# ---------------------------------------------------------------- Section 10
SYSTEMS = """### 1. The Silencer System (Lock &amp; Cash)
* **The Rule:** Elite offenses that were favored in Week 1, lost outright, and have a Week 2 total of 47 or more bounce back.
* **Week 2 Qualifiers:** **Dallas −4** (vs WAS) and **LA Rams −6.5** (vs NYG).

### 2. Extra Rest in Week 2 (Stick to the Model)
* **The Rule:** Since 2015, Week 2 teams with 3+ extra days of rest are **18–4 SU / 14–8 ATS**.
* **Week 2 Qualifier:** **New England** (vs PIT) — a reason PIT +5.5 is only an alternate.

### 3. Heavy-Rain Unders
* **The Rule:** Games played in heavy rain are **202–136 to the Under**.
* **Week 2 Qualifier:** **GB @ NYJ Under 44.5** (forecast — re-check Sunday morning).

### 4. Small Road Dogs in Week 2 (VSiN Insights)
* **The Rule:** Week 2 road underdogs of a field goal or less have been profitable.
* **Week 2 Qualifiers:** JAX +2.5, CIN +2.5 (ATL +2.5 is a home dog). Note this cuts against two of our consensus favorites (DEN, HOU).

### 5. Week 2 Overreaction / Bounce-Back (VSiN)
* **The Rule:** Fade the market's reaction to Week 1 blowouts.
* **Week 2 Relevance:** LAR and DAL (lost outright as favorites), CAR (allowed ~300 rush yds).

### 6. The Zigzag System (Lock &amp; Cash — late Grok capture)
* **The Rule:** A team that did not win and cover in Week 1, facing a non-playoff team that did, bounces back.
* **Week 2 Qualifiers:** GB −3.5, HOU −2.5, LAC −6.5, IND +6.5, LAR −7. Note it points against our NYJ +3.5.

### 7. Our Week 1 Lesson (SuperContest 1–4)
* **The Rule:** Line value first, key-number stories second. The only Week 1 winner (PIT −3.5) closed at −5.5 (+2.0 CLV); all four "hook through 3" picks lost."""


# ---------------------------------------------------------------- Section 11
REGISTRY = """Every pick in this report lives in Supabase (`user_picks` source EXPERT, `research_pick_signals`) and is graded after the games.

### Capture Breakdown
* **Podcasts:** 35 episodes since Sep 14, full-transcript re-extract → **255 picks**.
* **Twitter/X:** 87 bookmarks from the last 6 days → **384 auto-extracted picks** (thread expansion, image OCR, linked articles), plus **280 rows** from Grok (two re-runs, incl. 9 late threads) and Antigravity videos — loaded Sat night, all linked to their tweet notes.
* **Articles:** VSiN, Action Network, BettingPros, Sharp Football, PFF, ESPN, PFT, Rotowire, Walter Football — bodies backfilling.
* **Markets:** BKR sportsbook lines (Sat night), 3-book median snapshots; Kalshi weekly contracts (420: winners, spreads, totals, anytime TD, fantasy points).

### Analysts &amp; Outlets Tracked This Week
* **Audio shows:** Even Money (Ross Tucker, Steve Fezzik), Sharp or Square (Simon Hunter, Chad Millman), Action Network, BettingPros (Matt Perrault, Pat Fitzmaurice), The Favorites, The Athletic (Robert Mays), Move the Sticks (Daniel Jeremiah, Bucky Brooks), Sharp Football (Warren Sharp), PFF, Lock &amp; Cash, TrueDFS.
* **Writers &amp; X accounts:** Covers ATS column, Jason Logan (Covers), Wes Reynolds (VSiN), John Ewing, Cody Brown, Sal Bets, Gavin McHugh, Harry Lock, Joe Holka, FirstTDBets, thepropdealer, Parlay Judge, Dan's AI, Linemate, xEP Network.

### Known Gaps
* No Sunday/Monday sportsbook prop board in the repo — prop prices are the sources' quotes.
* Secondary-matrix receiver names use stale rosters (tiers and tags are fine)."""


# ---------------------------------------------------------------- assembly
def section(n, anchor, title_, key, box_id, summary, body, open_=False):
    op = ' open' if open_ else ''
    return f"""
<a id="{anchor}"></a>
## {n}. {title_}

<div class="rollup-controls">
  <button class="btn-toggle btn-primary" onclick="toggleRollups('{key}', true)">Expand Section {n}</button>
  <button class="btn-toggle" onclick="toggleRollups('{key}', false)">Collapse Section {n}</button>
</div>

<details class="rollup-box {key}" id="{box_id}"{op}>
<summary>{summary}</summary>
<div class="rollup-content">

{body}

{BACK}
</div>
</details>

---
"""


def multi(n, anchor, title_, key, label_, body):
    return f"""
<a id="{anchor}"></a>
## {n}. {title_}

<div class="rollup-controls">
  <button class="btn-toggle btn-primary" onclick="toggleRollups('{key}', true)">Expand {label_}</button>
  <button class="btn-toggle" onclick="toggleRollups('{key}', false)">Collapse {label_}</button>
</div>

{body}

---
"""


def build_md():
    md = """# 🏈 NFL Week 2 Master Betting Intelligence Report (Draft v4)
## Multi-Platform Consensus, Market-Implied Forecast Board &amp; Game-by-Game Analytical Dossier
### Unified Intelligence from Podcasts, Articles, X/Twitter Sharps &amp; Prediction Markets:
* **Platinum Rose Market Board:** BKR sportsbook lines (Sat 09-19 night), Kalshi win probabilities, SuperContest-vs-market value
* **Even Money Podcast:** Ross Tucker &amp; Steve Fezzik
* **Sharp or Square / Action Network:** Chad Millman &amp; Simon Hunter; Action Network betting podcast
* **BettingPros &amp; The Favorites:** Matt Perrault, Pat Fitzmaurice; survivor show
* **VSiN &amp; Covers:** Wes Reynolds best bets; Covers' every-game ATS column; Jason Logan spot bets
* **The Athletic, Move the Sticks, Sharp Football, PFF:** Robert Mays; Jeremiah &amp; Brooks; Warren Sharp
* **Live Twitter/X Sharp Intel:** Lock &amp; Cash, John Ewing, Cody Brown, Sal Bets, Gavin McHugh, Harry Lock, Joe Holka, Parlay Judge, Dan's AI — thread-expanded, OCR'd, Grok and Antigravity captures

---

<div class="status-banner" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-left: 5px solid #3B82F6; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; color: #F8FAFC;">
  <div style="font-size: 1.05rem; font-weight: 700; color: #60A5FA; margin-bottom: 4px;">🚨 Slate Status (Sat Sep 19, 2026, night — BKR lines, Burrow cleared)</div>
  <div style="font-size: 0.92rem; line-height: 1.5;">
    • <strong>TNF (Lions @ Bills):</strong> 🏁 <strong>FINAL — BUF 41, DET 31</strong>. BUF −4.5 covered. 15 Sunday/Monday games remain.<br>
    • <strong>Card Rule From TNF:</strong> Fire the highest-margin reads as <strong>singles or 2-leg tickets</strong>; our Thursday singles won while every 4–6 leg parlay lost a leg.<br>
    • <strong>Changes Tonight:</strong> Burrow cleared → HOU is a pass (CIN +8.5 teaser, Chase props). BKR moves: DEN −3, GB −3, LAR −6.5, SF −13, U39 and U45.5. Late Grok captures: 85 more picks (Sal Bets' best bets, Joe Holka's SNF card, FirstTDBets).<br>
    • <strong>Sunday Injury Re-Check:</strong> Tua/Rush (ATL), Nacua (LAR), NYG tackles (Thomas, Mauigoa), Flowers (BAL), Bowers (LV), McConkey (LAC).<br>
    • <strong>No Week 2 simulation:</strong> Section 2 is a <strong>market-implied</strong> board (implied scores, book vs Kalshi win %), not a model forecast.<br>
    • <strong>Interactive Tooltips &amp; Sortable Tables:</strong> 💡 Hover any header marked <strong>ⓘ</strong> for definitions. <strong>Click any column header to sort.</strong>
  </div>
</div>

<a id="executive-master-board"></a><a id="executive-board"></a>
## 1. Executive Master Board: Best Bets, Props, Tickets &amp; Teasers

The master board lists every official selection, graded and sized per the TNF lesson *(💡 Click any column header to sort)*:

""" + exec_board() + """

<div class="global-rollup-bar">
  <span class="bar-title">⚡ Matchup &amp; Section Dossier Controls:</span>
  <button class="btn-toggle btn-primary" onclick="toggleAllRollups(true)">Expand All Sections</button>
  <button class="btn-toggle" onclick="toggleAllRollups(false)">Collapse All Sections</button>
  <span class="bar-hint">💡 Tip: Click any matchup to navigate directly below. Click any table header to sort rows.</span>
</div>

---
"""
    md += section(2, 'synth-engine-section', 'Platinum Rose Market-Implied Forecast Board', 'section-synth', 'platinum-rose-synth-engine',
                  '📈 Market-Implied Scores, Book vs. Kalshi Win Probability &amp; Contest Edge',
                  "This week's board is built from the markets, not a simulation:\n"
                  "1. **Implied Score** — from the BKR spread and total.\n"
                  "2. **Book ML vs Kalshi** — where the prediction market disagrees with sportsbooks beyond the normal vig gap.\n"
                  "3. **Contest Edge** — free points from the locked SuperContest line.\n"
                  "4. **Grade** — our conviction on the recommended side, from consensus, matchup data and injuries.\n\n"
                  "### Full 15-Game Market Board *(💡 Click any column header to sort)*\n\n" + forecast_board(), open_=True)
    md += multi(3, 'consensus-section', 'In-Depth Multi-Platform Consensus &amp; High-Stakes Clashes', 'section-3', 'Consensus Plays', consensus_section())
    md += multi(4, 'feature-section', 'High-Conviction Feature Plays &amp; Signature Expert Bets', 'section-4', 'Feature Plays', feature_section())
    md += section(5, 'teaser-section', 'The Master 6-Point Wong Teaser Matrix &amp; Underdog ML Parlay', 'section-5', 'master-teaser-matrix',
                  '🎲 Master 6-Point Wong Teaser Matrix &amp; Leg Analysis', teaser_section())
    md += multi(6, 'dossier-section', 'Full 16-Game Chronological Analytical Dossier (With Market Cards)', 'section-6', 'All 16 Games', dossier_section())
    md += multi(7, 'parlay-section', 'Platinum Rose Parlay Cards &amp; Twitter Market Steam Audit', 'section-7', 'Parlays &amp; Steam',
                f"""<details class="rollup-box section-7" id="master-parlay-vault">
<summary>🎰 Platinum Rose Week 2 Parlay Cards (Draft)</summary>
<div class="rollup-content">

{parlay_section()}

{BACK}
</div>
</details>

<details class="rollup-box section-7" id="twitter-steam-audit">
<summary>🐦 Live Twitter/X Sharp Intel &amp; Market Steam Audit</summary>
<div class="rollup-content">

{STEAM}

{BACK}
</div>
</details>""")
    md += section(8, 'props-section', 'Master Player Prop &amp; Exotic Wager Card', 'section-8', 'master-props-card',
                  f'🎯 Master Player Prop &amp; Exotic Wager Card ({len(PROP_ROWS)} Tracked Selections)', props_section())
    md += section(9, 'survivor-section', 'Master Survivor Contest Strategy Hierarchy', 'section-9', 'master-survivor-hierarchy',
                  '🏆 Master Survivor Strategy Hierarchy (Future Value + Kalshi)', SURVIVOR)
    md += section(10, 'systems-section', 'Master Quantitative Betting Systems, Model Rules &amp; Historical Trends', 'section-10', 'master-quantitative-systems',
                  '📈 Week 2 Betting Systems &amp; Historical Angles', SYSTEMS)
    md += section(11, 'registry-section', 'Unified Expert Pick Registry &amp; Source Coverage', 'section-11', 'expert-registry-preview',
                  '👥 Expert Pick Registry &amp; Source Coverage (Week 2)', REGISTRY)
    return md


NAV = """<nav class="packet-nav">
  <div class="packet-nav-container">
    <a href="index.html" class="packet-nav-brand">
      <span>🏈</span>
      <span>NFL WEEK 2 INTEL</span>
      <span class="brand-badge">2026 DOSSIER</span>
    </a>
    <button class="packet-nav-toggle" aria-label="Toggle navigation">☰</button>
    <ul class="packet-nav-menu">
      <li class="packet-nav-item"><a href="index.html" class="packet-nav-link active"><span>📊 Master Board</span></a></li>
      <li class="packet-nav-item"><a href="supercontest.html" class="packet-nav-link"><span>🏆 SuperContest</span></a></li>
      <li class="packet-nav-item"><a href="../nfl_week1_master_packet/index.html" class="packet-nav-link"><span>⏮ Week 1 Packet</span></a></li>
      <li class="packet-nav-item">
        <a href="#" class="packet-nav-link"><span>💾 Formats</span><span class="dropdown-arrow">▼</span></a>
        <div class="packet-dropdown right-aligned">
<div class="packet-dropdown-header">💾 Standalone Formats</div>
<a href="nfl_week2_master_betting_intelligence_summary.docx"><span>📝 Master Dossier (Word DOCX)</span></a>
<a href="nfl_week2_master_betting_intelligence_summary.md"><span>📋 Master Dossier (Raw MD)</span></a>
<div class="packet-dropdown-divider"></div>
<a href="nfl_week2_supercontest_intelligence_summary.docx"><span>🏆 SuperContest Dossier (Word)</span></a>
<a href="nfl_week2_supercontest_intelligence_summary.md"><span>🏆 SuperContest Dossier (MD)</span></a>
        </div>
      </li>
    </ul>
  </div>
</nav>"""


def main():
    md = build_md()
    name = 'nfl_week2_master_betting_intelligence_summary'
    out_dir = ROOT / 'dist' / 'nfl_week2_master_packet'
    out_dir.mkdir(parents=True, exist_ok=True)
    (ROOT / 'scratch' / f'{name}.md').write_text(md, encoding='utf-8')
    (out_dir / f'{name}.md').write_text(md, encoding='utf-8')
    convert_summary.generate_docx(str(out_dir / f'{name}.md'), str(out_dir / f'{name}.docx'))
    convert_summary.generate_html(str(out_dir / f'{name}.md'), str(out_dir / f'{name}.html'))

    w1 = ROOT / 'dist' / 'nfl_week1_master_packet'
    for sub in ('assets/css', 'assets/js', 'assets/logos'):
        if (w1 / sub).exists():
            shutil.copytree(w1 / sub, out_dir / sub, dirs_exist_ok=True)
    asm = (ROOT / 'scripts' / 'assemble_master_packet.py').read_text(encoding='utf-8')
    logo_style = re.search(r'logo_style_block = """(.*?)"""', asm, re.S).group(1)
    html = (out_dir / f'{name}.html').read_text(encoding='utf-8')
    html = re.sub(r'https://a\.espncdn\.com/i/teamlogos/nfl/500/([a-z]+)\.png',
                  r'assets/logos/\1.png" onerror="this.onerror=null;this.src=\'https://a.espncdn.com/i/teamlogos/nfl/500/\1.png\';', html)
    html = html.replace('class="team-logo"', 'class="team-logo" width="22" height="22"')
    html = html.replace('class="team-logo-sm"', 'class="team-logo-sm" width="18" height="18"')
    html = html.replace('</style>', logo_style, 1)
    html = html.replace('</head>', '<link rel="stylesheet" href="assets/css/packet-nav.css">\n<script src="assets/js/packet-nav.js" defer></script>\n</head>', 1)
    m = re.search(r'<body[^>]*>', html, re.I)
    html = html[:m.end()] + '\n' + NAV + '\n' + html[m.end():]
    (out_dir / 'index.html').write_text(html, encoding='utf-8')
    (out_dir / f'{name}.html').write_text(html, encoding='utf-8')
    print('Wrote', out_dir / 'index.html')


if __name__ == '__main__':
    main()
