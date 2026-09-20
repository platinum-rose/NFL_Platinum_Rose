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
Data as of 2026-09-19 (market 3-book median 12Z; Kalshi 09-19; injuries Fri 06:14Z).
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

# Book moneyline on the favorite (3-book median 09-19 12Z)
ML = {'CHI': -225, 'TEN': -350, 'NYJ': -190, 'ATL': -150, 'BAL': -425, 'HOU': -136, 'TB': -450, 'NE': -235,
      'LAC': -305, 'DEN': -148, 'DAL': -210, 'ARI': -210, 'SF': -900, 'KC': -300, 'LAR': -340}
TOTAL_MOVE = {'DEN': '43.5 → 45.5', 'HOU': '46.5 → 45.5', 'TB': '40.5 → 41.5', 'KC': '47.5 → 46.5', 'LAR': '48.5 → 48'}

# Totals / prop notes per game (keyed by home team)
PROPS = {
    'CHI': ["Total 48 — John Ewing: 87% of money on the Over.",
            "Justin Jefferson O6.5 rec (~+100) / O73.5 yds / ATD +160–180 (BettingPros: 53% first-read share with Wentz; Action).",
            "Colson Loveland ATD +190 (Bears TE vs a blitz-heavy D); Caleb Williams ATD +340.",
            "DJ &amp; Bucky, Cody Brown and Gavin McHugh have CHI on the moneyline."],
    'TEN': ["<strong>Under 39.5</strong> — Action ×2, BettingPros, The Favorites.",
            "Saquon Barkley O76.5 rush (Sal Bets: 100 rush yds avg in 11 games as a 7-pt fav); Barkley ATD (Gavin McHugh $500 TD play).",
            "Wan'Dale Robinson (TEN) O34.5 rec yds — Quinyon Mitchell shadows Carnell Tate.",
            "Dallas Goedert ATD +240 (Action; Linemate 5/5 TD streak)."],
    'NYJ': ["Heavy-rain forecast → Under 44.5 lean (heavy-rain unders 202–136).",
            "MarShawn Lloyd O12.5 rush att (MIN blitzed 86% in W1; NYJ won't); Kane Sadiq O20.5 rec yds.",
            "Matthew Golden ATD +220–240; Garrett Wilson ATD +210."],
    'ATL': ["<strong>Bijan Robinson O126.5 rush+rec</strong> (BettingPros, cleared 4 of last 5) and ATD −210 (Harry Lock TD list; Dan's AI: 60+ rush yds 90% L10).",
            "Kyle Pitts ATD +350; Chuba Hubbard first TD +500.",
            "Penix OUT, Tua doubtful → Cooper Rush: play the Bijan props, not the side."],
    'BAL': ["Under 46.5/47 + <strong>Lamar Jackson U221.5 pass yds</strong> (Warren Sharp) — correlated.",
            "Rashod Bateman O2.5 rec (de facto WR1 with Zay Flowers doubtful).",
            "Mark Andrews ATD +125; Juwan Johnson ATD +350; Lamar ATD +165."],
    'HOU': ["Wes Reynolds (VSiN): Under 45.5.",
            "Ja'Marr Chase O70.5 rec yds (−114), 100+ (+250), 125+ (+580) — Cody Brown bounce-back case (HOU allowed two 100-yd WRs in W1).",
            "Tee Higgins ATD +200; Dalton Schultz O3.5–4.5 rec ladder; Chase Brown on a 4/4 TD streak."],
    'TB': ["Quinshon Judkins U49.5 rush (Bowles run D).",
           "Emeka Egbuka first TD +1200 (Joe Holka); Baker Mayfield ATD +550."],
    'NE': ["Mac Hollins O35.5 rec yds (NE→PIT HIGH; Joey Porter Jr. OUT); Drake Maye O25 rush yds.",
           "Eli Raridon first TD +2800 (longshot). Extra-rest trend on NE (18-4 SU)."],
    'LAC': ["Ladd McConkey ATD +175 (if active); Jack Bech ATD +800."],
    'DEN': ["Denver team total O21.5 (BettingPros).",
            "Bo Nix pass-attempt ladder O32.5–O47.5 (Action) vs Warren Sharp's Nix U222.5 pass yds.",
            "Parker Washington O4.5 rec (26% target share W1); Courtland Sutton ATD +230; Jakobi Meyers ATD +320."],
    'DAL': ["Total 50.5 — highest on the slate.",
            "Jake Ferguson first TD +1100 / ATD; Terry McLaurin ATD +200 (two sources); Ryan Flournoy ATD +350."],
    'ARI': ["Jaxon Smith-Njigba ATD +135; Trey McBride ATD +245; Jeremiah Love O15.5 rec yds."],
    'SF': ["Brock Purdy O19.5 completions (BettingPros 5-star); Mike Evans O4.5 rec (alt 5+ at +158) &amp; ATD +130.",
           "Deebo Samuel ATD +215; Chris Bell O19.5 rec yds; Achane 60+ rush+rec (4-game streak); Action Under 44.5."],
    'KC': ["Daniel Jones U32.5 pass att (BettingPros 5-star); Kenneth Walker O78.5 rush; Rashee Rice O53.5 rec yds.",
           "Mahomes first TD +1800; Tyler Warren ATD +250; BettingPros Under 46.5."],
    'LAR': ["Isaiah Likely ATD +270; LAR WR overs once Nacua's status is known; Kyren Williams on a 4/4 TD streak."],
}

PROP_ROWS = [  # player, game home key, market, price, source, note
    ('Justin Jefferson', 'CHI', 'Over 6.5 receptions', '~+100', 'BettingPros; Action', '⭐ Standalone — Grade A'),
    ('Bijan Robinson', 'ATL', 'Over 126.5 rush + rec yds', '—', 'BettingPros', '⭐ Standalone — Grade A−'),
    ('Justin Jefferson', 'CHI', 'Over 73.5 rec yds / Anytime TD', '— / +160–180', 'Action Network', 'Ladder off the receptions play'),
    ('Saquon Barkley', 'TEN', 'Over 76.5 rush yds', '—', 'Sal Bets', '2-leg with PHI/TEN U39.5'),
    ('Lamar Jackson', 'BAL', 'Under 221.5 pass yds', '—', 'Warren Sharp', '2-leg with NO/BAL U46.5'),
    ('Bo Nix', 'DEN', 'Under 222.5 pass yds', '—', 'Warren Sharp', 'Conflicts with Action attempts ladder'),
    ('Dalton Schultz', 'HOU', 'Over 3.5 receptions', '—', 'Intel feed (X / podcasts)', '2-leg with Bateman'),
    ('Rashod Bateman', 'BAL', 'Over 2.5 receptions', '—', 'Intel feed (X / podcasts)', 'Flowers doubtful'),
    ("Ja'Marr Chase", 'HOU', 'Over 70.5 rec yds (100+ +250)', '−114', 'Cody Brown', 'Burrow status matters'),
    ('Brock Purdy', 'SF', 'Over 19.5 completions', '—', 'BettingPros (5-star)', ''),
    ('Daniel Jones', 'KC', 'Under 32.5 pass attempts', '—', 'BettingPros (5-star)', ''),
    ('Kenneth Walker', 'KC', 'Over 78.5 rush yds', '—', 'Intel feed (X / podcasts)', ''),
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
    ('Jaxon Smith-Njigba', 'ARI', 'Anytime TD', '+135', 'Intel feed (X / podcasts)', 'Moonshot ATD stack'),
    ('Mark Andrews', 'BAL', 'Anytime TD', '+125', 'Intel feed (X / podcasts)', 'Moonshot ATD stack'),
    ('Isaiah Likely', 'LAR', 'Anytime TD', '+270', 'Intel feed (X / podcasts)', 'Moonshot ATD stack'),
    ('Dallas Goedert', 'TEN', 'Anytime TD', '+240', 'Action Network', 'Linemate 5/5 TD streak'),
    ('Colson Loveland', 'CHI', 'Anytime TD', '+190', 'Intel feed (X / podcasts)', ''),
    ('Terry McLaurin', 'DAL', 'Anytime TD', '+200', 'Intel feed (2 sources)', ''),
    ('Courtland Sutton', 'DEN', 'Anytime TD', '+230', 'Intel feed (X / podcasts)', ''),
    ('Emeka Egbuka', 'TB', 'First TD', '+1200', 'Joe Holka', 'First-TD stack ($5)'),
    ('Jake Ferguson', 'DAL', 'First TD', '+1100', 'Intel feed (X / podcasts)', 'First-TD stack ($5)'),
    ('Chuba Hubbard', 'ATL', 'First TD', '+500', 'Intel feed (X / podcasts)', 'First-TD stack ($5)'),
    ('Patrick Mahomes', 'KC', 'First TD', '+1800', 'Intel feed (X / podcasts)', 'First-TD swap'),
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
              tip('Market Line', 'Market Line', 'The 3-book median spread and total, Saturday 09-19 12:00Z. SuperContest lines are in the SuperContest dossier.'),
              'Expert(s) &amp; Source Network', 'Official Selection',
              tip('Ticket / Grade', 'Ticket Type &amp; Grade', 'Standalone = fire alone (the Week 2 TNF lesson: our best reads won as singles while 4–6 leg parlays died on one leg). 2-leg = small correlated ticket. Grades A (highest) to C.'),
              tip('Category / Consensus Level', 'Consensus Level', 'How many distinct shows, writers and X accounts landed on this side versus the other side.'),
              'Primary Strategic Edge')
EXEC_ROWS = [
    ('game-min-chi', 'Vikings @ Bears', 'CHI −4.5 (open −5.5)<br>O/U: 48',
     '**BettingPros** *(53% first-read share)*<br>**Action Network** *(O73.5 yds, ATD)*',
     '**Justin Jefferson O6.5 Receptions (~+100)**<br>SuperContest: **MIN +5.5**',
     '**Standalone**<br>Grade **A**', '🎯 **Top Prop + Contest #1**',
     'MIN→CHI rated **HIGH** secondary vulnerability: slot CB Kyler Gordon (PUP) and S Anthony Johnson Jr. (OUT). Wentz named Friday; contest locked +5.5 vs market +4.5.'),
    ('game-car-atl', 'Panthers @ Falcons', 'CAR −2.5<br>O/U: 43.5',
     '**BettingPros** *(cleared 4 of last 5)*<br>**Harry Lock**, **Dan\'s AI** *(60+ rush 90% L10)*',
     '**Bijan Robinson O126.5 Rush + Rec Yds**<br>Bijan ATD (−210)',
     '**Standalone**<br>Grade **A−**', '🎯 **Workhorse Volume Prop**',
     'Carolina allowed ~300 rush yds in W1; Penix OUT and Tua doubtful → Cooper Rush and a run-first script. Side is a clash (5 vs 4) — pass.'),
    ('game-jax-den', 'Jaguars @ Broncos', 'DEN −2.5 (−120)<br>O/U: 45.5 (from 43.5)',
     '**Fezzik**, **Sharp or Square**, **Action ×2**, **The Favorites**, **BettingPros**, **Wes Reynolds (ML)**<br>vs. **Covers** *(JAX)*',
     '**Denver Broncos −2.5**', '**Standalone**<br>Grade **A−**', '🌟 **11-vs-4 Widest Consensus**',
     'No key number to protect; a field-goal win covers. JAX WRs Brian Thomas Jr. and Jakobi Meyers both questionable. Kalshi DEN 58%.'),
    ('game-phi-ten', 'Eagles @ Titans', 'PHI −7<br>O/U: **39.5** (lowest)',
     '**Action ×2**, **BettingPros**, **The Favorites**',
     '**Full Game Under 39.5**', '**Standalone**<br>Grade **B+**', '🛡️ **Consensus Best Total**',
     'Two conservative offenses; a 7-point favorite in a sub-40 total wants to run clock. Greenard OUT is the risk.'),
    ('game-mia-sf', 'Dolphins @ 49ers', 'SF −13.5 (open −12.5)<br>O/U: 44.5',
     '**Sharp or Square**, **Action**, **BettingPros ×2**, **Jason Logan (Covers)**<br>vs. **Covers ATS** *(SF)*',
     '**Miami Dolphins +13.5**', '**Standalone**<br>Grade **B+**', '🌟 **8-vs-1 Near-Unanimous Dog**',
     'SF closes games conservatively; backdoor volume from Chris Bell and Achane. Market moved toward SF — take the best +13.5/+14 available.'),
    ('game-nyg-lar', 'Giants @ Rams (MNF)', 'LAR −7.5 (open −7)<br>O/U: 48',
     '**Lock &amp; Cash ×2**, **Action**, **Sharp or Square**, **BettingPros**, **Wes Reynolds**<br>vs. **Covers**, **Jason Logan**',
     '**Los Angeles Rams −7**', '**Standalone**<br>Grade **B+** (B at −7.5)', '🔥 **Silencer System + Sharp Lean**',
     'LAR→NYG is the week\'s top secondary-vulnerability score (6.49). Kalshi: LAR by 7+ ≈55%, by 8+ ≈46%. Buy −7 where you can.'),
    ('game-cle-tb', 'Browns @ Buccaneers', 'TB −8.5<br>O/U: 41.5',
     '**BettingPros** *(survivor consensus)*, **Action**, **The Favorites**, **Covers**',
     '**TB −8.5** — prefer as **teaser leg −2.5**', '**Teaser Leg**<br>Grade **B**', '🏆 **Survivor Consensus**',
     'Watson-led Browns "non-functional" (BettingPros). −8.5 → −2.5 crosses both 7 and 3.'),
    ('game-cin-hou', 'Bengals @ Texans', 'HOU −2.5<br>O/U: 45.5 (from 46.5)',
     '**Fezzik**, **Sharp or Square**, **Action**, **BettingPros**<br>vs. **Covers** *(CIN)*',
     '**Houston Texans −2.5** *(if Burrow limited/out)*', '**Conditional**<br>Grade **B**', '🌟 **9-vs-3 Consensus**',
     'Joe Burrow questionable (back) is the whole bet. Nico Collins and Tank Dell OUT make HOU thin outside — skip if Burrow practices fully.'),
    ('master-teaser-matrix', '2-Leg: Schultz + Bateman', 'Receptions',
     '**Card draft** *(injury-driven target shares)*', '**Dalton Schultz O3.5 Rec + Rashod Bateman O2.5 Rec**',
     '**2-Leg Ticket**', '🎰 **Target Inheritance**', 'Both inherit targets: Nico Collins OUT (HOU), Zay Flowers doubtful (BAL).'),
    ('game-no-bal', '2-Leg: Saints @ Ravens', 'BAL −8.5<br>O/U: 46.5',
     '**Warren Sharp**', '**Under 46.5 + Lamar Jackson U221.5 Pass Yds**', '**2-Leg Ticket**', '🎰 **Correlated Under**',
     'With Flowers out Baltimore stays on the ground: fewer Lamar attempts, a slower game.'),
    ('game-phi-ten', '2-Leg: Eagles @ Titans', 'PHI −7<br>O/U: 39.5',
     '**Sal Bets**; **Action**, **BettingPros**', '**Saquon Barkley O76.5 Rush + Under 39.5**', '**2-Leg Ticket**', '🎰 **Clock-Control Script**',
     'Barkley averaged 100 rush yds in 11 games as a 7-point favorite; that script also keeps the total down.'),
    ('master-teaser-matrix', 'Wong Teasers', 'BAL/TB −8.5<br>LAR −7.5, ATL +2.5',
     '**Even Money** *(Tucker &amp; Fezzik)*', '**BAL −2.5 / TB −2.5**<br>**LAR −1.5 / ATL +8.5**', '**2-Team Teasers**', '🎲 **Classic Wong Legs**',
     'Every leg crosses 3 and 7. Keep each teaser at two legs.'),
    ('master-teaser-matrix', 'Underdog ML Parlay', 'NYJ +160, ATL +126<br>WAS +175, ARI +175',
     '≥3 spread backers each', '**NYJ + ATL + WAS + ARI ML**', '**Small (0.25u)**', '⚡ **Longshot**',
     'Kalshi prices the four dogs at 34–43% each; a lottery ticket, not a core play.'),
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
def forecast_board():
    hdr = th('Matchup', 'Market Line &amp; Total',
             tip('Market-Implied Score', 'Implied Team Scores', 'Favorite = (total + spread) / 2, underdog = (total − spread) / 2. What the betting market expects — not a simulation.'),
             tip('Book ML Win %', 'Sportsbook Moneyline Probability', 'Win probability implied by the favorite\'s moneyline, vig included (runs ~2 points high).'),
             tip('Kalshi Win %', 'Prediction-Market Probability', 'Kalshi game-winner contract price, 09-19. Close to a no-vig price.'),
             tip('Kalshi − Book', 'Prediction-Market Lean', 'Kalshi minus book ML probability. About −2 is normal (vig). Below −3.5 = Kalshi cooler on the favorite; 0 or above = Kalshi warmer.'),
             tip('Contest Edge', 'SuperContest vs Market', 'Points the locked SuperContest line gives our side versus the current market.'),
             'Grade', 'Recommendation')
    rows = [hdr, '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |']
    for h in ORDER:
        g = BY_HOME[h]
        f_s, d_s = implied(g)
        bp = ml_prob(ML[h])
        diff = g['kalshi'] - bp
        flag = ' 🔻 *cool on fav*' if diff <= -3.5 else (' 🔺 *warm on fav*' if diff >= 0 else '')
        txt, team = pick_text(g)
        edge = sc.movement(g, team)
        edge_s = f"**{fmt(edge)} on {team}**" if edge else '0.0'
        tm = f"<br>*(total {TOTAL_MOVE[h]})*" if h in TOTAL_MOVE else ''
        rows.append(th(f'[**{short(g)}**](#{gid(g)})', f"{line(g)}<br>({g['total']}){tm}",
                       f"**{g['fav']} {f_s:.1f} — {dog(g)} {d_s:.1f}**", f"{bp:.1f}%", f"**{g['kalshi']}%**",
                       f"{diff:+.1f}{flag}", edge_s, f"**{g['grade']}**", f"**{txt}**"))
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
    s = spotlight(1, BY_HOME['DEN'], '🌟', 'Widest Consensus', 'Total moved 43.5 → 45.5.')
    s += spotlight(2, BY_HOME['HOU'], '🌟', 'Near-Unanimous (Burrow-Conditional)', 'Total dipped 46.5 → 45.5 on the Burrow news.')
    s += spotlight(3, BY_HOME['SF'], '🌟', 'Near-Unanimous Dog', 'The line rose a full point toward SF — the dog backers are fighting the market.')
    s += spotlight(4, BY_HOME['LAR'], '🔥', 'Sharp-Show Lean (MNF)', 'LAR by 7+ ≈55%, by 8+ ≈46% on Kalshi.')
    s += spotlight(5, BY_HOME['CHI'], '🎯', 'Media vs Moneyline Crowd', 'The line fell a point after Wentz was named; 87% of money on the Over.')
    s += clash('clash-ind-kc', 'Colts +6.5 vs. Chiefs −6.5 (SNF) — 9 vs 7',
               "* **KC side (9):** The Favorites, Covers, most article writers.\n"
               "* **IND side (7):** Sharp or Square, Action, Wes Reynolds (VSiN) at +6.5.\n"
               "* **Market:** Kalshi prices KC −6.5 at ≈49.5% — a coin flip. **Play props instead:** Daniel Jones U32.5 attempts, Kenneth Walker O78.5 rush.")
    s += clash('clash-was-dal', 'Commanders +4 vs. Cowboys −4 — 3 vs 5',
               "* **DAL side:** Lock &amp; Cash Silencer System (favored in W1, lost outright, W2 total ≥ 47), Covers, BettingPros, Action.\n"
               "* **WAS side:** Even Money, Sharp or Square at +3.5; the contest's +4.5 is a free hook (SuperContest alternate #7).\n"
               "* **Market:** DAL −3.5 → −4; Kalshi DAL by 5+ ≈47.5%. Highest total on the slate (50.5).")
    s += clash('clash-sea-ari', 'Cardinals +4 vs. Seahawks −4 — 7 vs 3',
               "* **ARI side (7):** Fezzik, Even Money, Sharp or Square, Covers, Wes Reynolds at +4 / +4.5.\n"
               "* **SEA side (3):** Robert Mays (The Athletic), Action.\n"
               "* **Read:** Drew Lock starts for SEA (Darnold OUT); ARI is without CB Garrett Williams and James Conner. Bet ARI at +4 or better; the SuperContest's +3.5 is worse than market.")
    s += clash('clash-gb-nyj', 'Jets +3.5 vs. Packers −3.5 — 6 vs 4',
               "* **NYJ side:** Fezzik (five), Sharp or Square, Covers.\n"
               "* **GB side:** BettingPros, Jason Logan (look-ahead spot).\n"
               "* **Market:** GB −4.5 → −3.5; Kalshi 61% vs book 65.5% — the prediction market is the coolest on any favorite this week. Heavy rain → Under 44.5 lean.")
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
                "* **The Case:** BettingPros measured a 53% first-read share for Jefferson with Carson Wentz in Week 1; Action Network also has O73.5 yds and ATD (+160–180).\n"
                "* **Matchup:** Chicago's slot CB Kyler Gordon (PUP) and S Anthony Johnson Jr. (OUT) leave the middle of the field open — MIN→CHI is a HIGH secondary-vulnerability matchup.\n"
                "* **Risk:** Brian O'Neill (Q) — pressure shortens Wentz's reads, which usually helps a first-read target.\n"
                "* **Ticket:** Standalone. Ladders: O73.5 yds, ATD.")
    s += feature('feature-bijan', '🎯 Feature Play 2: Bijan Robinson Over 126.5 Rush + Rec Yds (Panthers @ Falcons)',
                 "* **The Case:** Cleared this number in 4 of his last 5 (BettingPros); Dan's AI has 60+ rush yds hitting 90% of his last 10; ATD −210 is on Harry Lock's list.\n"
                 "* **Matchup:** Carolina allowed ~300 rush yds in Week 1. With Penix OUT and Tua doubtful, Cooper Rush means a run-first plan.\n"
                 "* **Ticket:** Standalone.")
    s += feature('feature-phi-ten-under', '🛡️ Feature Play 3: Eagles @ Titans Under 39.5',
                 "* **Backers:** Action Network ×2, BettingPros, The Favorites.\n"
                 "* **The Case:** Lowest total on the slate; Philadelphia as a 7-point road favorite leans on Barkley and clock control. Tennessee's offense stalled in W1.\n"
                 "* **2-leg option:** Barkley O76.5 rush + Under 39.5 (Sal Bets volume case).")
    s += feature('feature-signature-bets', '🎙️ Signature Expert Bets — Who Has What',
                 "* **Steve Fezzik (via Ross Tucker Pod) — 5 best:** BUF −4.5 ✅ (41–31), NYJ +3.5, HOU −2.5, DEN −2.5, ARI +4.5.\n"
                 "* **Even Money teaser legs:** BAL −2.5, TB −2.5, LAR −1, JAX +8.5, ATL +7.5.\n"
                 "* **Sharp or Square:** LAR −7, MIA +13.5, PIT +5.5, NO +8.5, LV +7, IND +6.5.\n"
                 "* **Lock &amp; Cash:** Official free pick MIN +5.5; Silencer System DAL −3.5, LAR −7.\n"
                 "* **VSiN — Wes Reynolds:** MIN +5, LAR −7, IND +6.5, ARI +4, DEN ML −145, CIN/HOU Under 45.5.\n"
                 "* **Covers — ATS for every game:** CAR −2.5, CHI −5.5, PHI −7.5, PIT +5.5, NYJ +3.5, TB −8.5, NO +8.5, CIN +2.5, JAX +2.5, LV +6.5, DAL −3.5, ARI +4.5, SF −13.5, KC −6.5, NYG +6.5 (opposite four of our five SuperContest picks).\n"
                 "* **Covers — Jason Logan spot bets:** NYG +7 (letdown), GB −3.5 (look-ahead), MIA +13.5 (travel).\n"
                 "* **Warren Sharp:** Lamar Jackson U221.5 pass yds; Bo Nix U222.5 pass yds.\n"
                 "* **BettingPros 5-star props:** Daniel Jones U32.5 pass attempts; Brock Purdy O19.5 completions.\n"
                 "* **Parlay Judge ML card:** BUF ✅, BAL, GB, PHI, HOU, TB, NE, CAR, LAC, ARI (+190), DAL, SF.")
    return s


# ---------------------------------------------------------------- Section 5
TEASER_HDR = th('Game',
                tip('Teaser Leg', 'Teaser Leg', 'The side in a 6-point teaser. Moving favorites of −7.5 to −8.5 down, or dogs of +1.5 to +2.5 up, through 3 and 7 is the Wong strategy.'),
                'Original', tip('Teased', 'Teased Line', 'The line after the 6-point adjustment.'),
                tip('Key Numbers', 'Key Numbers Crossed', '3 and 7 are the most common NFL margins of victory.'),
                'Total', 'Backers')
TEASERS = [
    ('Saints @ Ravens', 'Baltimore Ravens', '−8.5', '−2.5', '3, 7', '46.5', 'Even Money; 5–3 side consensus'),
    ('Browns @ Buccaneers', 'Tampa Bay Buccaneers', '−8.5', '−2.5', '3, 7', '41.5', 'Even Money; survivor consensus'),
    ('Giants @ Rams', 'Los Angeles Rams', '−7.5', '−1.5', '3, 7', '48', 'Even Money (−1 from −7); 8–4 side consensus'),
    ('Panthers @ Falcons', 'Atlanta Falcons', '+2.5', '+8.5', '3, 7', '43.5', 'Even Money (+7.5 from +1.5)'),
    ('Bengals @ Texans', 'Cincinnati Bengals', '+2.5', '+8.5', '3, 7', '45.5', 'Only if Burrow plays — conflicts with HOU side'),
    ('Jaguars @ Broncos', 'Jacksonville Jaguars', '+2.5', '+8.5', '3, 7', '45.5', 'Even Money — <strong>conflicts</strong> with DEN −2.5 (pick one)'),
]


def teaser_section():
    rows = [TEASER_HDR, '| :--- | :--- | :---: | :---: | :---: | :---: | :--- |']
    rows += [th(f'**{a}**', f'**{b}**', c, f'**{d}**', f'**{e}**', f, g) for a, b, c, d, e, f, g in TEASERS]
    return ("Stanford Wong's basic strategy: a 6-point NFL teaser is +EV when it moves favorites of −7.5 to −8.5 down through 7 and 3, "
            "or dogs of +1.5 to +2.5 up through 3 and 7, best in totals of 49 or lower. This week has three textbook favorites (BAL, TB, LAR) and two dogs (ATL, CIN).\n\n"
            "### The Master Week 2 Teaser Board\n\n" + '\n'.join(rows) + """

### Optimal Teaser Pairings (keep each at 2 legs — the TNF lesson)
1. **1:00 PM Window:**
   * Leg 1: Baltimore Ravens (−8.5 → −2.5)
   * Leg 2: Tampa Bay Buccaneers (−8.5 → −2.5)
2. **Sunday/Monday Split:**
   * Leg 1: Atlanta Falcons (+2.5 → +8.5)
   * Leg 2: Los Angeles Rams (−7.5 → −1.5), settles Monday night
3. **Burrow-Plays Alternative:** Cincinnati +8.5 / Tampa Bay −2.5 (replaces the HOU side — don't hold both).

### ⚡ Underdog Moneyline Parlay (small)
* **Leg 1:** New York Jets ML (+160) vs. Green Bay — market moved GB −4.5 → −3.5; heavy rain.
* **Leg 2:** Atlanta Falcons ML (+126) vs. Carolina — Bijan-driven game script.
* **Leg 3:** Washington Commanders ML (+175) at Dallas.
* **Leg 4:** Arizona Cardinals ML (+175) vs. Seattle — Drew Lock starts for SEA.
* **The Rationale:** Each dog has at least three spread backers; Kalshi prices them 34–43%. A four-leg lottery ticket — size it that way.""")


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
CARDS_HDR = th('Card', 'Legs', 'Type', tip('Stake', 'Suggested Stake', 'Suggested draft sizing in units (1u = standard bet) — not from the sources. Not yet logged to the paper ledger.'), 'Status')
CARDS = [
    ('<a id="card-hybrid"></a>**Hybrid Best-Reads Card**', 'DEN −2.5 · PHI/TEN U39.5 · Jefferson O6.5 rec · Bijan O126.5 · LAR −7', '5-leg', '0.25u', 'Draft — only as a small add-on to the singles'),
    ('<a id="card-props"></a>**Prop Legit Stack**', 'Jefferson O6.5 rec · Bijan O126.5 · Purdy O19.5 comp · Barkley O76.5 rush · Mac Hollins O35.5', '5-leg', '0.25u', 'Draft'),
    ('<a id="card-atd"></a>**Moonshot ATD Stack**', 'Mike Evans +130 · JSN +135 · Mark Andrews +125 · Isaiah Likely +270', '4-leg ATD', '0.1u', 'Draft'),
    ('<a id="card-ftd"></a>**First TD Stack ($5)**', 'Egbuka +1200 · Ferguson +1100 · Hubbard +500 (Mahomes +1800 swap)', 'Singles', '$5 each', 'Draft'),
    ('<a id="card-2td"></a>**2+ TD Check**', 'Bijan · Kenneth Walker · Saquon', 'Price check', '—', 'Unlikely to reach +7000 — skip unless boosted'),
]


def parlay_section():
    rows = [CARDS_HDR, '| :--- | :--- | :---: | :---: | :--- |'] + [th(*c) for c in CARDS]
    return ("These cards come from the Week 2 card draft (`docs/cards/2026-W02-sun-mon-card-draft.md`). "
            "**They are not yet logged** to `data/official-picks/platinum-rose-ai-2026.json` — log after the Sunday injury re-check.\n\n"
            + '\n'.join(rows) + """

### Construction Rules After TNF
* The highest-margin reads (Jefferson, Bijan, DEN, U39.5) go in as **singles first**; the multi-leg cards are small add-ons.
* No card mixes a side with its own teaser conflict (DEN −2.5 vs JAX +8.5; HOU −2.5 vs CIN +8.5).""")


STEAM = """* **Feed Status:** 87 bookmarks from the last 6 days processed (thread expansion, image OCR, linked articles); 24 videos transcribed by Antigravity; 19 threads fully captured by Grok (re-run CSV 09-19).
* **Line Movement (Tue open → Sat 12Z):**
  1. **Bears:** CHI −5.5 → **−4.5** after Kevin O'Connell named Wentz — toward MIN, our SuperContest #1.
  2. **49ers:** SF −12.5 → **−13.5** — the market is paying more for SF while 8 sources back MIA.
  3. **Packers:** GB −4.5 → **−3.5** — toward NYJ; Kalshi (61%) is well below the book ML (65.5%).
  4. **Rams:** LAR −7 → **−7.5** — the SuperContest's −7 is a free half-point.
  5. **Cowboys:** DAL −3.5 → **−4**; **Chargers:** LAC −7 → **−6.5**; **Seahawks:** SEA −4.5 → **−4**.
  6. **Totals:** DEN/JAX 43.5 → **45.5**; CIN/HOU 46.5 → 45.5 (Burrow); IND/KC 47.5 → 46.5.
* **Money Splits:** John Ewing — 87% of money on MIN/CHI Over 48.
* **Kalshi Warm Spot:** HOU 59% vs book 57.6% — the only favorite Kalshi prices above the vig-included book number."""


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
* **Green Bay (@ NYJ):** Rain; Kalshi 61% is the coolest read on any favorite; GB blew 9+ point leads twice in its last 4 losses.
* **Anything at −2.5 (HOU, DEN, CAR):** 57–59% — coin flips with a hook.
* **Chicago (vs. MIN):** The line has fallen to −4.5.

### Entry Status
* **LMS 2022:** Week 1 pick LAR lost (SF 27–7) — check whether the entry is still alive.
* **Ken's League:** PHI won Week 1; PHI no longer available.
* *TrueDFS's Week 2 survivor video discussed 2024 examples (LAC @ CAR, BAL vs LV), so its team picks don't map to the 2026 slate. Its principle — save BAL and PHI for later — does.*"""


# ---------------------------------------------------------------- Section 10
SYSTEMS = """### 1. The Silencer System (Lock &amp; Cash)
* **The Rule:** Elite offenses that were favored in Week 1, lost outright, and have a Week 2 total of 47 or more bounce back.
* **Week 2 Qualifiers:** **Dallas −4** (vs WAS) and **LA Rams −7.5** (vs NYG).

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

### 6. Our Week 1 Lesson (SuperContest 1–4)
* **The Rule:** Line value first, key-number stories second. The only Week 1 winner (PIT −3.5) closed at −5.5 (+2.0 CLV); all four "hook through 3" picks lost."""


# ---------------------------------------------------------------- Section 11
REGISTRY = """Every pick in this report lives in Supabase (`user_picks` source EXPERT, `research_pick_signals`) and is graded after the games.

### Capture Breakdown
* **Podcasts:** 35 episodes since Sep 14, full-transcript re-extract → **255 picks**.
* **Twitter/X:** 87 bookmarks from the last 6 days → **384 auto-extracted picks** (thread expansion, image OCR, linked articles) + **195 rows** from the Grok re-run and Antigravity videos (load with `node scripts/load-external-intel-picks.mjs --replace`).
* **Articles:** VSiN, Action Network, BettingPros, Sharp Football, PFF, ESPN, PFT, Rotowire, Walter Football — bodies backfilling.
* **Markets:** 3-book median odds; Kalshi weekly contracts (420: winners, spreads, totals, anytime TD, fantasy points).

### Analysts &amp; Outlets Tracked This Week
* **Audio shows:** Even Money (Ross Tucker, Steve Fezzik), Sharp or Square (Simon Hunter, Chad Millman), Action Network, BettingPros (Matt Perrault, Pat Fitzmaurice), The Favorites, The Athletic (Robert Mays), Move the Sticks (Daniel Jeremiah, Bucky Brooks), Sharp Football (Warren Sharp), PFF, Lock &amp; Cash, TrueDFS.
* **Writers:** Covers ATS column, Jason Logan (Covers), Wes Reynolds (VSiN), John Ewing, Cody Brown, Sal Bets, Gavin McHugh, Harry Lock, Joe Holka, Parlay Judge, Dan's AI.

### Known Gaps
* No Sunday/Monday sportsbook prop board in the repo — prop prices are the sources' quotes.
* Sal Bets' "7 Best Bets" markets are not captured yet.
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
    md = """# 🏈 NFL Week 2 Master Betting Intelligence Report (Draft v3)
## Multi-Platform Consensus, Market-Implied Forecast Board &amp; Game-by-Game Analytical Dossier
### Unified Intelligence from Podcasts, Articles, X/Twitter Sharps &amp; Prediction Markets:
* **Platinum Rose Market Board:** 3-book median lines (Sat 09-19 12:00Z), Kalshi win probabilities, SuperContest-vs-market value
* **Even Money Podcast:** Ross Tucker &amp; Steve Fezzik
* **Sharp or Square / Action Network:** Chad Millman &amp; Simon Hunter; Action Network betting podcast
* **BettingPros &amp; The Favorites:** Matt Perrault, Pat Fitzmaurice; survivor show
* **VSiN &amp; Covers:** Wes Reynolds best bets; Covers' every-game ATS column; Jason Logan spot bets
* **The Athletic, Move the Sticks, Sharp Football, PFF:** Robert Mays; Jeremiah &amp; Brooks; Warren Sharp
* **Live Twitter/X Sharp Intel:** Lock &amp; Cash, John Ewing, Cody Brown, Sal Bets, Gavin McHugh, Harry Lock, Joe Holka, Parlay Judge, Dan's AI — thread-expanded, OCR'd, Grok and Antigravity captures

---

<div class="status-banner" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-left: 5px solid #3B82F6; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; color: #F8FAFC;">
  <div style="font-size: 1.05rem; font-weight: 700; color: #60A5FA; margin-bottom: 4px;">🚨 Slate Status (Sat Sep 19, 2026 — DRAFT, re-check Sunday morning)</div>
  <div style="font-size: 0.92rem; line-height: 1.5;">
    • <strong>TNF (Lions @ Bills):</strong> 🏁 <strong>FINAL — BUF 41, DET 31</strong>. BUF −4.5 covered. 15 Sunday/Monday games remain.<br>
    • <strong>Card Rule From TNF:</strong> Fire the highest-margin reads as <strong>singles or 2-leg tickets</strong>; our Thursday singles won while every 4–6 leg parlay lost a leg.<br>
    • <strong>Sunday Injury Re-Check:</strong> Burrow (CIN — decides HOU), Tua/Rush (ATL), Nacua (LAR), NYG tackles (Thomas, Mauigoa), Flowers (BAL), Bowers (LV), McConkey (LAC).<br>
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
                  "1. **Implied Score** — from the 3-book median spread and total.\n"
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
