#!/usr/bin/env python3
"""Week 2 SuperContest dossier -- same structure/markup as the Week 1 builder
(scratch/build_supercontest_report.py), but data-driven. Produces:
  scratch/nfl_week2_supercontest_intelligence_summary.md
  dist/nfl_week2_master_packet/nfl_week2_supercontest_intelligence_summary.{md,html,docx}
  dist/nfl_week2_master_packet/supercontest.html   (packet page with nav, like Week 1)
Data as of 2026-09-19 (contest lines 09-18 00:48Z; market 3-book median 09-19 12Z; Kalshi 09-19).
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scratch'))
import convert_summary  # noqa: E402

# convert_summary embeds team logos from a hardcoded Windows path; make it work from any checkout.
_RealPath = convert_summary.Path


def _PortablePath(*a, **k):
    if a and isinstance(a[0], str) and a[0].startswith('E:/dev/projects/NFL_Dashboard'):
        a = (a[0].replace('E:/dev/projects/NFL_Dashboard', str(ROOT)),) + a[1:]
    return _RealPath(*a, **k)


convert_summary.Path = _PortablePath


def tip(term, title, desc):
    return f'<span class="term-tooltip">{term}<span class="tip-text"><strong>{title}</strong>{desc}</span></span>'


def logo(abbr, size="normal"):
    cls = "team-logo" if size == "normal" else "team-logo-sm"
    return f'<img src="https://a.espncdn.com/i/teamlogos/nfl/500/{abbr.lower()}.png" alt="" class="{cls}">'


NAMES = {'ARI': 'Arizona Cardinals', 'ATL': 'Atlanta Falcons', 'BAL': 'Baltimore Ravens', 'BUF': 'Buffalo Bills',
         'CAR': 'Carolina Panthers', 'CHI': 'Chicago Bears', 'CIN': 'Cincinnati Bengals', 'CLE': 'Cleveland Browns',
         'DAL': 'Dallas Cowboys', 'DEN': 'Denver Broncos', 'DET': 'Detroit Lions', 'GB': 'Green Bay Packers',
         'HOU': 'Houston Texans', 'IND': 'Indianapolis Colts', 'JAX': 'Jacksonville Jaguars', 'KC': 'Kansas City Chiefs',
         'LAC': 'Los Angeles Chargers', 'LAR': 'Los Angeles Rams', 'LV': 'Las Vegas Raiders', 'MIA': 'Miami Dolphins',
         'MIN': 'Minnesota Vikings', 'NE': 'New England Patriots', 'NO': 'New Orleans Saints', 'NYG': 'New York Giants',
         'NYJ': 'New York Jets', 'PHI': 'Philadelphia Eagles', 'PIT': 'Pittsburgh Steelers', 'SEA': 'Seattle Seahawks',
         'SF': 'San Francisco 49ers', 'TB': 'Tampa Bay Buccaneers', 'TEN': 'Tennessee Titans', 'WAS': 'Washington Commanders'}


def fmt(x):
    s = f"{x:+.1f}"
    return '0.0' if s in ('+0.0', '-0.0') else s


# fav, contest (fav line), open (fav line, Tue 09-15), cur (market 09-19), kalshi fav win %
G = [
    dict(away='MIN', home='CHI', kick='Sun 1:00 PM ET', fav='CHI', contest=-5.5, open=-5.5, cur=-4.5, kalshi=67, total=48,
         pick='MIN', rank=1, grade='A',
         align=('Media Consensus + Free Point', '6 vs 3',
                [('Even Money', 'expert-even-money'), ('Sharp or Square', 'expert-sharp-or-square'), ('Action', 'expert-action-network'),
                 ('Lock &amp; Cash', 'expert-lockandcash'), ('Wes Reynolds', 'expert-vsin')],
                [('Covers (CHI)', 'expert-covers'), ('BettingPros (CHI)', 'expert-bettingpros')]),
         why=[('Free Point on the Lock', 'Contest locked CHI -5.5; the market fell to -4.5 after Wentz was named — a full point of value.'),
              ('Bears Slot Hole', 'Kyler Gordon (PUP) and S Anthony Johnson Jr. (OUT) leave the middle open — MIN→CHI is a HIGH secondary-vulnerability matchup.'),
              ('Wentz Full-Week Prep', "Kevin O'Connell named Wentz on Friday; Jefferson drew a 53% first-read share with him in Week 1.")],
         adv='Minnesota (Jefferson &amp; Hockenson vs depleted Bears slot/seam coverage)',
         injuries="MIN: Kyler Murray OUT (concussion), Jauan Jennings OUT, Brian O'Neill Q. CHI: S Anthony Johnson Jr. OUT, Kyler Gordon PUP, Kyle Monangai Q.",
         extra=['Lock &amp; Cash made MIN +5.5 its official free pick; its power rating sees value down to +3.5.',
                'Wes Reynolds (VSiN): MIN +5 — Bears Week 1 total regression; Cover-0 looks Wentz can beat.',
                'John Ewing: 87% of money on the Over 48 — the public expects a shootout.']),
    dict(away='NYG', home='LAR', kick='Mon 8:15 PM ET', fav='LAR', contest=-7.0, open=-7.0, cur=-7.5, kalshi=75, total=48,
         pick='LAR', rank=2, grade='A-',
         align=('Sharp-Show Lean + Key-7 Push Equity', '8 vs 4',
                [('Lock &amp; Cash ×2', 'expert-lockandcash'), ('Sharp or Square', 'expert-sharp-or-square'), ('Action', 'expert-action-network'),
                 ('BettingPros', 'expert-bettingpros'), ('Wes Reynolds', 'expert-vsin')],
                [('Covers (NYG +6.5)', 'expert-covers'), ('J. Logan', 'expert-covers-jlo')]),
         why=[('Free Half-Point', 'Contest -7 vs market -7.5; Kalshi: LAR by 7+ ≈55%, by 8+ ≈46% → roughly 46% win / 9% push / 45% loss at -7.'),
              ('Top Secondary Target', "LAR→NYG is the week's highest vulnerability score (6.49): Deonte Banks Q, Korie Black OUT, Greg Newsome Q."),
              ('Silencer System', 'Favored in W1, lost outright, W2 total ≥ 47 — Lock &amp; Cash bounce-back qualifier; power rating LAR by 9.')],
         adv='Los Angeles (Rams passing game vs Giants CB room)',
         injuries='LAR: Puka Nacua Q, Kam Curl Q, Kamren Kinchens Q, Jordan Whittington Q. NYG: LT Andrew Thomas Q, Francis Mauigoa Q, Deonte Banks Q, Greg Newsome II Q, Korie Black OUT.',
         extra=["Risk: first home game after the Melbourne opener (BettingPros flags travel); Giants off an emotional upset of Dallas (Covers' Jason Logan: letdown spot).",
                'Monday night is the last game of the week; a push is worth 0.5.']),
    dict(away='JAX', home='DEN', kick='Sun 4:05 PM ET', fav='DEN', contest=-2.5, open=-2.5, cur=-2.5, kalshi=58, total=45.5,
         pick='DEN', rank=3, grade='B+',
         align=('Widest Consensus of the Week', '11 vs 4',
                [('Fezzik', 'expert-even-money'), ('Sharp or Square', 'expert-sharp-or-square'), ('Action ×2', 'expert-action-network'),
                 ('The Favorites', 'expert-favorites'), ('BettingPros', 'expert-bettingpros'), ('Wes Reynolds (ML)', 'expert-vsin')],
                [('Covers (JAX)', 'expert-covers')]),
         why=[('11-Source Consensus', 'Fezzik, Sharp or Square, Action, Even Money, The Favorites, BettingPros, Janvrin, Adee, VSiN and Gavin McHugh are all on Denver.'),
              ('Short Number', 'No key number to protect at -2.5 — a field-goal win covers.'),
              ('Jaguars WR Questions', 'Brian Thomas Jr. (shoulder) and Jakobi Meyers (thumb) are both questionable.')],
         adv='Denver (home pass rush vs a banged-up Jaguars WR room)',
         injuries='DEN: Marvin Mims Jr. OUT, RJ Harvey Q. JAX: Brian Thomas Jr. Q, Jakobi Meyers Q, LeQuint Allen Jr. Q.',
         extra=['Total moved 43.5 → 45.5; BettingPros likes the Denver team total Over 21.5.',
                'Counterpoint: Even Money uses JAX +8.5 as a teaser leg — a teaser, not a side.']),
    dict(away='CIN', home='HOU', kick='Sun 1:00 PM ET', fav='HOU', contest=-2.5, open=-2.5, cur=-2.5, kalshi=59, total=45.5,
         pick='HOU', rank=4, grade='B (Burrow-conditional)',
         align=('Near-Unanimous Favorite', '9 vs 3',
                [('Fezzik', 'expert-even-money'), ('Sharp or Square', 'expert-sharp-or-square'), ('Action', 'expert-action-network'), ('BettingPros', 'expert-bettingpros')],
                [('Covers (CIN)', 'expert-covers')]),
         why=[('Burrow Questionable', 'Joe Burrow is questionable (back); the pick assumes he is limited or out.'),
              ('Bengals Slow Starts', "BettingPros' survivor show and Fezzik both lean on Cincinnati's September history."),
              ('WR Risk (why B)', 'Nico Collins and Tank Dell are OUT — Houston is thin outside. Swap to an alternate if Burrow practices fully.')],
         adv='Houston (front seven vs a compromised Burrow)',
         injuries='CIN: Joe Burrow Q (back). HOU: Nico Collins OUT, Tank Dell OUT, Jadeveon Clowney OUT.',
         extra=['Wes Reynolds (VSiN): Under 45.5 in this game.',
                "Cody Brown: Ja'Marr Chase O70.5 receiving — the Texans allowed two 100-yard WRs in Week 1."]),
    dict(away='MIA', home='SF', kick='Sun 4:25 PM ET', fav='SF', contest=-13.5, open=-12.5, cur=-13.5, kalshi=90, total=44.5,
         pick='MIA', rank=5, grade='B',
         align=('Near-Unanimous Dog', '8 vs 1',
                [('Sharp or Square', 'expert-sharp-or-square'), ('Action', 'expert-action-network'), ('BettingPros ×2', 'expert-bettingpros'), ('J. Logan', 'expert-covers-jlo')],
                [('Covers (SF)', 'expert-covers')]),
         why=[('Two Touchdowns', 'SF closes games conservatively; 13.5 needs a two-score margin to hold into the final minutes.'),
              ('Schedule Spot', "Covers' Jason Logan: Miami's back-to-back cross-country trips."),
              ('Backdoor Volume', "Miami trails and throws: Chris Bell (54% routes in W1) and De'Von Achane volume.")],
         adv='San Francisco on talent; Miami on the number',
         injuries="MIA: Chop Robinson OUT, Ronnie Harrison Jr. OUT. SF: De'Zhaun Stribling OUT, Kaelon Black Q.",
         extra=['The line opened -12.5 and moved to -13.5 — the market is paying more for SF, not less.']),
    # alternates
    dict(away='CLE', home='TB', kick='Sun 1:00 PM ET', fav='TB', contest=-8.5, open=-8.5, cur=-8.5, kalshi=79, total=41.5,
         pick='TB', rank=6, grade='B',
         align=('Survivor Consensus', '7 vs 2',
                [('BettingPros', 'expert-bettingpros'), ('Action', 'expert-action-network'), ('The Favorites', 'expert-favorites'), ('Covers', 'expert-covers')],
                []),
         why=[('Watson-Led Browns', "BettingPros survivor show: Cleveland's offense is 'non-functional' under Deshaun Watson."),
              ('Better as a Teaser', '-8.5 → -2.5 crosses 7 and 3 (Even Money uses it).')],
         adv='Tampa Bay (Egbuka vs a CLE secondary that allowed 3 WR TDs in W1)',
         injuries='CLE: Tyson Campbell Q. TB: Miles Killebrew Q, Jacob Parrish Q, Jalen McMillan Q.', extra=[]),
    dict(away='WAS', home='DAL', kick='Sun 4:25 PM ET', fav='DAL', contest=-4.5, open=-3.5, cur=-4.0, kalshi=66, total=50.5,
         pick='WAS', rank=7, grade='B',
         align=('Hook Value', '3 vs 5',
                [('Even Money', 'expert-even-money'), ('Sharp or Square', 'expert-sharp-or-square')],
                [('Lock &amp; Cash', 'expert-lockandcash'), ('Covers', 'expert-covers')]),
         why=[('Free Hook', 'Contest +4.5 vs market +4; Kalshi prices Washington +4.5 at ≈52.5%.'),
              ('Why Only an Alternate', 'Dallas qualifies for the Silencer bounce-back system; Chig Okonkwo is OUT for WAS.')],
         adv='Even — highest total on the slate (50.5)',
         injuries='WAS: Chig Okonkwo OUT. DAL: Malik Hooker OUT.', extra=[]),
    dict(away='PIT', home='NE', kick='Sun 1:00 PM ET', fav='NE', contest=-5.5, open=-5.5, cur=-5.0, kalshi=69, total=41.5,
         pick='PIT', rank=8, grade='B-',
         align=('Split Panel', '4 vs 3',
                [('Sharp or Square', 'expert-sharp-or-square'), ('The Favorites', 'expert-favorites'), ('Covers', 'expert-covers')],
                [('Action', 'expert-action-network'), ('BettingPros', 'expert-bettingpros')]),
         why=[('Free Half-Point', 'Contest +5.5 vs market +5.'),
              ('Why Only an Alternate', 'NE has 3+ extra rest (18-4 SU / 14-8 ATS) and PIT lost CB Joey Porter Jr. — a HIGH NE→PIT matchup.')],
         adv='New England (passing game vs Steelers secondary)',
         injuries='PIT: Joey Porter Jr. OUT, Michael Pittman Jr. Q, Troy Fautanu Q. NE: Dametrious Crownover OUT, Carlton Davis III Q.', extra=[]),
    dict(away='GB', home='NYJ', kick='Sun 1:00 PM ET', fav='GB', contest=-3.5, open=-4.5, cur=-3.5, kalshi=61, total=44.5,
         pick='NYJ', rank=9, grade='B-',
         align=('Fezzik + Rain', '6 vs 4',
                [('Fezzik', 'expert-even-money'), ('Sharp or Square', 'expert-sharp-or-square'), ('Covers', 'expert-covers')],
                [('BettingPros', 'expert-bettingpros'), ('J. Logan', 'expert-covers-jlo')]),
         why=[('Market Moved Our Way', 'Opened GB -4.5, now -3.5 — the value is already gone at the contest number.'),
              ('Weather', 'Heavy-rain forecast (heavy-rain unders 202–136) — low scoring helps the dog.')],
         adv='Green Bay on talent; the Jets are missing Minkah Fitzpatrick, Joseph Ossai and Omar Cooper Jr.',
         injuries='NYJ: Minkah Fitzpatrick OUT, Joseph Ossai OUT, Omar Cooper Jr. OUT, Will McDonald IV Q. GB: Lukas Van Ness Q.', extra=[]),
    dict(away='NO', home='BAL', kick='Sun 1:00 PM ET', fav='BAL', contest=-8.5, open=-8.5, cur=-8.5, kalshi=79, total=46.5,
         pick='BAL', rank=10, grade='C+',
         align=('Teaser Leg', '5 vs 3',
                [('Action', 'expert-action-network'), ('The Favorites', 'expert-favorites'), ('Even Money (teaser)', 'expert-even-money')],
                [('Covers (NO)', 'expert-covers'), ('Sharp or Square', 'expert-sharp-or-square')]),
         why=[('Run-Heavy Script', 'Zay Flowers doubtful keeps Baltimore on the ground — good for a teaser (-2.5), shaky at -8.5.')],
         adv='Baltimore (run game)',
         injuries='BAL: Zay Flowers D, Ronnie Stanley Q, Trey Hendrickson Q, T.J. Tampa OUT. NO: Chris Olave Q, Chase Young Q.', extra=[]),
    # passes
    dict(away='PHI', home='TEN', kick='Sun 1:00 PM ET', fav='PHI', contest=-7.0, open=-7.0, cur=-7.0, kalshi=76, total=39.5,
         pick=None, lean='PHI', rank=None, grade='Pass',
         align=('Totals Game', '5 vs 2',
                [('Sharp or Square', 'expert-sharp-or-square'), ('BettingPros', 'expert-bettingpros'), ('Covers', 'expert-covers')],
                [('Action (TEN)', 'expert-action-network')]),
         why=[('Push Risk', 'A 7-point line in a 39.5 total — a PHI 7-point win is very live. Play the Under 39.5 elsewhere.')],
         adv='Philadelphia', injuries="PHI: Jonathan Greenard OUT, Andrew Mukuba Q. TEN: Cor'Dale Flott Q.", extra=[]),
    dict(away='CAR', home='ATL', kick='Sun 1:00 PM ET', fav='CAR', contest=-2.5, open=-2.5, cur=-2.5, kalshi=58, total=43.5,
         pick=None, lean='CAR', rank=None, grade='Pass',
         align=('Clash', '5 vs 4',
                [('BettingPros', 'expert-bettingpros'), ('Covers', 'expert-covers')],
                [('Even Money', 'expert-even-money'), ('Sharp or Square', 'expert-sharp-or-square'), ('Action', 'expert-action-network')]),
         why=[('QB Uncertainty', 'Penix OUT, Tua doubtful → Cooper Rush. Play Bijan Robinson props, not the side.')],
         adv='Atlanta run game vs a CAR defense that allowed ~300 rush yds in W1',
         injuries='ATL: Michael Penix Jr. OUT, Tua Tagovailoa D, A.J. Terrell Jr. Q.', extra=[]),
    dict(away='LV', home='LAC', kick='Sun 4:05 PM ET', fav='LAC', contest=-6.5, open=-7.0, cur=-6.5, kalshi=73, total=43.5,
         pick=None, lean='LV', rank=None, grade='Pass',
         align=('Clash', '6 vs 4',
                [('Even Money', 'expert-even-money'), ('Sharp or Square', 'expert-sharp-or-square'), ('Covers', 'expert-covers')],
                [('The Favorites', 'expert-favorites'), ('BettingPros', 'expert-bettingpros')]),
         why=[('Split', "Raiders fans travel (little LAC home edge), but Bowers is doubtful and O'Connell questionable.")],
         adv='Even', injuries="LV: Brock Bowers D, Aidan O'Connell Q, Darien Porter OUT. LAC: Ladd McConkey Q, Trey Pipkins III OUT, Elijah Molden OUT.", extra=[]),
    dict(away='SEA', home='ARI', kick='Sun 4:25 PM ET', fav='SEA', contest=-3.5, open=-4.5, cur=-4.0, kalshi=66, total=41,
         pick=None, lean='ARI', rank=None, grade='Pass (contest)',
         align=('Wrong Side of 4', '7 vs 3',
                [('Fezzik', 'expert-even-money'), ('Sharp or Square', 'expert-sharp-or-square'), ('Covers', 'expert-covers'), ('Wes Reynolds', 'expert-vsin')],
                [('Robert Mays', 'expert-mays'), ('Action', 'expert-action-network')]),
         why=[('Contest Number Is Worse', 'ARI backers are on +4/+4.5; the contest gives only +3.5 (market +4).')],
         adv='Seattle secondary edge (ARI CB Garrett Williams OUT); Drew Lock starts for SEA',
         injuries='SEA: Sam Darnold OUT, Zach Charbonnet OUT, Ty Okada OUT. ARI: Garrett Williams OUT, James Conner OUT, Max Melton Q.', extra=[]),
    dict(away='IND', home='KC', kick='Sun 8:20 PM ET', fav='KC', contest=-6.5, open=-6.5, cur=-6.5, kalshi=73, total=46.5,
         pick=None, lean='IND', rank=None, grade='Pass',
         align=('Clash', '9 vs 7',
                [('Sharp or Square', 'expert-sharp-or-square'), ('Action', 'expert-action-network'), ('Wes Reynolds', 'expert-vsin')],
                [('The Favorites (KC)', 'expert-favorites'), ('Covers (KC)', 'expert-covers')]),
         why=[('Coin Flip', 'Kalshi prices KC -6.5 at ≈49.5%. Props instead: Daniel Jones U32.5 attempts, Kenneth Walker O78.5.')],
         adv='Kansas City at home', injuries='IND: Ashton Dulin OUT, DJ Giddens Q. KC: Chamarri Conner OUT, Mansoor Delane Q.', extra=[]),
]


def side_line(g, team):
    return g['contest'] if team == g['fav'] else -g['contest']


def label(team, line):
    return f"{team} {fmt(line)}"


def movement(g, team):
    # points the contest line gives `team` vs the current market
    delta_for_fav = g['contest'] - g['cur']
    return delta_for_fav if team == g['fav'] else -delta_for_fav


def stability(g):
    mv = abs(g['cur'] - g['open'])
    score = int(round(100 - 25 * mv))
    if mv == 0:
        return '<span class="badge badge-stable">Stable (90)</span>'
    if mv <= 1:
        return f'<span class="badge badge-watch">Watch ({score})</span>'
    return f'<span class="badge badge-volatile">Volatile ({score})</span>'


def move_badge(g, team):
    d = movement(g, team)
    if d > 0:
        return f'<span class="badge badge-best">▲ +{d:.1f} ({team} free pts)</span>'
    if d < 0:
        return f'<span class="badge badge-unit">▼ {d:.1f} ({team})</span>'
    return '<span class="badge badge-zero">0.0</span>'


def gid(g):
    return f"game-{g['away'].lower()}-{g['home'].lower()}"


def matchup_cell(g, rank=None):
    r = f"<strong>#{rank}</strong> " if rank else ""
    return (f"<td>{r}{logo(g['away'], 'sm')} {g['away']} @ {logo(g['home'], 'sm')} <strong>{g['home']}</strong><br>"
            f"<small style=\"color:#64748b;\">{g['kick']}</small><br>{stability(g)}</td>")


def align_cell(g):
    head, count, pro, con = g['align']
    pro_l = ', '.join(f'<a href="#{a}" class="table-link">{n}</a>' for n, a in pro)
    con_l = ', '.join(f'<a href="#{a}" class="table-link">{n}</a>' for n, a in con)
    color = '#16a34a' if (g.get('rank') or 99) <= 5 else '#2563eb'
    out = f"<strong>{head} ({count})</strong><br><small style=\"color:{color};font-weight:600;\">{pro_l}</small>"
    if con:
        out += f"<br><small style=\"color:#64748b;\">vs. {con_l}</small>"
    return out


def grade_badge(g):
    if g.get('rank') and g['rank'] <= 5:
        return f'<span class="badge badge-best">Grade {g["grade"]} (Rank {g["rank"]} Pick)</span>'
    if g.get('rank'):
        return f'<span class="badge badge-consensus">Grade {g["grade"]} (Rank {g["rank"]} Alternate)</span>'
    return f'<span class="badge badge-zero">{g["grade"]}</span>'


def row(g, with_rank=True, with_id=True):
    team = g['pick'] or g.get('lean')
    ln = side_line(g, team)
    why = '<br>\n'.join(f'  • <a href="#{gid(g)}"><strong>{t}:</strong></a> {d}' for t, d in g['why'])
    pick_txt = f"{NAMES[team]} {fmt(ln)}" if g['pick'] else f"Lean {NAMES[team]} {fmt(ln)} (no contest play)"
    rid = f' id="exec-{team.lower()}"' if with_id else ''
    return f"""<tr{rid}>
{matchup_cell(g, g['rank'] if with_rank else None)}
<td><strong>{label(g['fav'], g['open'])}</strong></td>
<td><strong>{label(g['fav'], g['contest'])}</strong></td>
<td><strong>{label(g['fav'], g['cur'])}</strong></td>
<td>{move_badge(g, team)}</td>
<td><a href="#{gid(g)}" class="table-link">{logo(team, 'sm')} <strong>{pick_txt}</strong></a><br>{grade_badge(g)}</td>
<td>{align_cell(g)}</td>
<td>
{why}
</td>
</tr>"""


HDR = [
    tip("Matchup &amp; Kickoff", "Game Details", "NFL Week 2 matchup, kickoff day/time (ET), team logos, and a Line Stability Score (90 = no movement since Tuesday's open)."),
    tip("Opening Line", "Tuesday Line", "The point spread on Tuesday 09-15 (DraftKings via the schedule feed), before most Week 2 betting action."),
    tip("Contest Line", "Official SuperContest Spread", "The point spread locked by the Westgate SuperContest on Wednesday. This number never changes for our card."),
    tip("Current Line", "Live Market Spread", "3-book median point spread, Saturday 09-19 12:00Z. Shows where public and sharp money have moved the line."),
    tip("Movement", "Contest vs. Market", "Points the contest line gives our side versus the current market. Green = free points (CLV) from playing the locked number."),
    tip("Contest Pick &amp; Grade", "Recommended Selection", "Our spread recommendation and conviction grade for Andy and Amanda's contest entry."),
    tip("Expert Alignment", "Podcast, Article &amp; X Consensus", "Distinct shows/writers with a spread pick on our side vs. the other side (podcasts Sep 14+, articles, X bookmarks incl. Grok/Antigravity captures)."),
    tip("Why We Like It (Deep Dive)", "Core Football &amp; Contest Analysis", "Matchup factors, injuries and line value. Click any bold title to jump to the full breakdown."),
]
THEAD = "<thead>\n<tr>\n" + "\n".join(f"<th>{h}</th>" for h in HDR) + "\n</tr>\n</thead>"

top5 = [g for g in G if g.get('rank') and g['rank'] <= 5]
alts = [g for g in G if g.get('rank') and g['rank'] > 5]
matrix_order = ['MIN', 'PHI', 'NYJ', 'CAR', 'BAL', 'HOU', 'TB', 'PIT', 'LV', 'DEN', 'WAS', 'ARI', 'MIA', 'IND', 'LAR']
by_team = {(g['pick'] or g.get('lean')): g for g in G}


def quick(gs):
    parts = []
    for g in gs:
        t = g['pick']
        parts.append(f'<a href="#exec-{t.lower()}" class="quick-pick-link">{logo(t, "sm")} <strong>{t} {fmt(side_line(g, t))}</strong></a>')
    return '\n      <span class="quick-pick-sep">-</span>\n      '.join(parts)


def rollup_table(gs):
    return ('<div class="table-responsive"><table class="sortable-table">\n' + THEAD + '\n<tbody>\n'
            + '\n'.join(row(g) for g in gs) + '\n</tbody>\n</table></div>')


def matrix_table():
    rows = [row(by_team[t], with_rank=bool(by_team[t].get('rank')), with_id=False) for t in matrix_order]
    return ('<div class="table-responsive"><table class="sortable-table">\n' + THEAD + '\n<tbody>\n'
            + '\n'.join(rows) + '\n</tbody>\n</table></div>')


def gm(a, h):
    return f'game-{a.lower()}-{h.lower()}'


def pick_item(team, line, game, note):
    n = f' ({note})' if note else ''
    return f'* {logo(team, "sm")} <a href="#{game}" class="table-link"><strong>{NAMES[team]} {fmt(line)}</strong></a>{n}'


EXPERTS = [
    ('expert-ai', '1. Platinum Rose Top 5 (Consensus + Contest-Value Card)', [
        pick_item('MIN', 5.5, gm('MIN', 'CHI'), 'Rank 1 / +1.0 free point vs market / 6-3 consensus'),
        pick_item('LAR', -7, gm('NYG', 'LAR'), 'Rank 2 / +0.5 vs market / top secondary-vulnerability matchup'),
        pick_item('DEN', -2.5, gm('JAX', 'DEN'), 'Rank 3 / 11-4 consensus, widest of the week'),
        pick_item('HOU', -2.5, gm('CIN', 'HOU'), 'Rank 4 / Burrow-conditional / 9-3 consensus'),
        pick_item('MIA', 13.5, gm('MIA', 'SF'), 'Rank 5 / 8-1 consensus / two-score cushion')]),
    ('expert-even-money', '2. Even Money (Ross Tucker &amp; Steve Fezzik — 2x SuperContest Champion)', [
        pick_item('MIN', 5.5, gm('MIN', 'CHI'), 'Even Money side'),
        pick_item('NYJ', 3.5, gm('GB', 'NYJ'), "<strong>Fezzik's five</strong> (via Ross Tucker Pod)"),
        pick_item('HOU', -2.5, gm('CIN', 'HOU'), "<strong>Fezzik's five</strong>"),
        pick_item('DEN', -2.5, gm('JAX', 'DEN'), "<strong>Fezzik's five</strong>"),
        pick_item('ARI', 4.5, gm('SEA', 'ARI'), "<strong>Fezzik's five</strong> (the contest gives only +3.5)"),
        "* Also: WAS +3.5, LV +7. Fezzik's fifth, BUF −4.5 on TNF, ✅ covered 41–31. Teaser legs: BAL −2.5, TB −2.5, LAR −1, JAX +8.5, ATL +7.5."]),
    ('expert-sharp-or-square', '3. Sharp or Square (Simon Hunter &amp; Chad Millman)', [
        pick_item('LAR', -7, gm('NYG', 'LAR'), 'Sharp side'),
        pick_item('MIA', 13.5, gm('MIA', 'SF'), 'Big-dog cushion'),
        pick_item('PIT', 5.5, gm('PIT', 'NE'), 'Repeated across episodes'),
        pick_item('ARI', 4, gm('SEA', 'ARI'), '+4 / +4.5'),
        pick_item('HOU', -2.5, gm('CIN', 'HOU'), 'Core leg'),
        '* Also: DEN −2.5, PHI −7, NYJ +4.5, WAS +3.5, NO +8.5, LV +7, IND +6.5, ATL +2.']),
    ('expert-action-network', '4. Action Network', [
        pick_item('MIN', 4.5, gm('MIN', 'CHI'), 'Market number; the contest gives +5.5'),
        pick_item('LAR', -7, gm('NYG', 'LAR'), ''),
        pick_item('DEN', -2.5, gm('JAX', 'DEN'), ''),
        pick_item('HOU', -2.5, gm('CIN', 'HOU'), ''),
        pick_item('MIA', 13.5, gm('MIA', 'SF'), ''),
        '* Also: TB −8.5, BAL −8.5, NYJ +4.5, NE −4.5, SEA −3.5, PHI −6.5, DAL −3.5, IND +6.5/+7, ATL +1.5.']),
    ('expert-bettingpros', '5. BettingPros', [
        pick_item('HOU', -2.5, gm('CIN', 'HOU'), "Also the survivor show's lean"),
        pick_item('TB', -8.5, gm('CLE', 'TB'), 'Survivor consensus'),
        pick_item('MIA', 13.5, gm('MIA', 'SF'), ''),
        '* Also: NE −5.5, PHI −7, DAL −3.5, GB −4.5, LAC −7, CHI −5.5, CIN +3.']),
    ('expert-favorites', '6. The Favorites', [
        pick_item('TB', -8.5, gm('CLE', 'TB'), ''), pick_item('BAL', -8.5, gm('NO', 'BAL'), ''),
        pick_item('KC', -6.5, gm('IND', 'KC'), ''), pick_item('LAC', -6.5, gm('LV', 'LAC'), ''),
        pick_item('PIT', 5.5, gm('PIT', 'NE'), '')]),
    ('expert-covers', '7. Covers — ATS Picks for Every Week 2 Game (Contrarian Check)', [
        '* CAR −2.5, CHI −5.5, PHI −7.5, PIT +5.5, NYJ +3.5, TB −8.5, NO +8.5, CIN +2.5, JAX +2.5, LV +6.5, DAL −3.5, ARI +4.5, SF −13.5, KC −6.5, NYG +6.5.',
        '* <strong>Opposite our Top 5 on CHI, NYG, JAX, CIN and SF</strong> — agrees on PIT +5.5 and NYJ +3.5 (alternates).']),
    ('expert-vsin', '8. VSiN — Wes Reynolds Best Bets', [
        pick_item('MIN', 5, gm('MIN', 'CHI'), 'Bears W1 total regression; Wentz vs Cover-0'),
        pick_item('LAR', -7, gm('NYG', 'LAR'), 'McVay ATS off a loss; rest edge'),
        pick_item('ARI', 4, gm('SEA', 'ARI'), ''), pick_item('IND', 6.5, gm('IND', 'KC'), ''),
        '* Also: Denver ML (−145); CIN/HOU Under 45.5.']),
    ('expert-lockandcash', '9. Lock &amp; Cash (video + X)', [
        pick_item('MIN', 5.5, gm('MIN', 'CHI'), '<strong>Official free pick</strong>'),
        pick_item('LAR', -7, gm('NYG', 'LAR'), 'Silencer System + power rating LAR by 9'),
        pick_item('DAL', -3.5, gm('WAS', 'DAL'), 'Silencer System')]),
    ('expert-covers-jlo', '10. Covers — Jason Logan Spot Bets', [
        pick_item('NYG', 7, gm('NYG', 'LAR'), 'Letdown spot (against our LAR)'),
        pick_item('GB', -3.5, gm('GB', 'NYJ'), 'Look-ahead spot'),
        pick_item('MIA', 13.5, gm('MIA', 'SF'), 'Back-to-back cross-country schedule spot')]),
    ('expert-mays', '11. Robert Mays (The Athletic)', [pick_item('SEA', -3.5, gm('SEA', 'ARI'), '')]),
]


def dossier():
    order = top5 + alts + [by_team[t] for t in ['PHI', 'CAR', 'LV', 'ARI', 'IND']]
    out = []
    for i, g in enumerate(order, 1):
        team = g['pick'] or g.get('lean')
        ln = side_line(g, team)
        dog = g['home'] if g['fav'] == g['away'] else g['away']
        if g.get('rank') and g['rank'] <= 5:
            tag, pk = f"[RANK #{g['rank']} PICK]", f"Rank #{g['rank']} Pick"
        elif g.get('rank'):
            tag, pk = f"[ALTERNATE #{g['rank']}]", f"Alternate #{g['rank']}"
        else:
            tag, pk = "[PASS]", "No contest play — lean only"
        head, count, pro, con = g['align']
        pro_n = ', '.join(n for n, _ in pro)
        con_n = ', '.join(n for n, _ in con)
        reasons = '\n'.join(f"  {k}. **{t}:** {d}" for k, (t, d) in enumerate(g['why'], 1))
        extra = ''.join(f"\n  * {e}" for e in g['extra'])
        mv = movement(g, team)
        verb = 'Cover' if g['pick'] else '(Lean Only)'
        against = f" | against: {con_n}" if con_n else ''
        out.append(f"""<details class="rollup-box section-games" id="{gid(g)}" open>
<summary>🏈 Game {i}: {NAMES[g['away']]} at {NAMES[g['home']]} (Contest: {label(g['fav'], g['contest'])} / {dog} {fmt(-g['contest'])}) — {tag}</summary>
<div class="rollup-content">

* **Line Trajectory:** Open (Tue): {label(g['fav'], g['open'])} | Contest: {label(g['fav'], g['contest'])} | Market (Sat): {label(g['fav'], g['cur'])} | Contest vs market for {team}: {fmt(mv)} pts
* **Market Win Probability (Kalshi):** {NAMES[g['fav']]} {g['kalshi']}% | Total {g['total']}
* **Line Matchup Advantage:** {g['adv']}
* **Game-Status Injuries (Fri):** {g['injuries']}
* **Expert Alignment:** 🌟 **{head} ({count})** — for: {pro_n}{against}
* **Why {NAMES[team].split()[-1]} {verb}:**
{reasons}{extra}
* **SuperContest Pick:** **{NAMES[team]} {fmt(ln)} ({pk})**

[⬆ Back to Top Matchup Table](#executive-board)
</div>
</details>
""")
    out.append("""<details class="rollup-box section-games" id="game-det-buf" open>
<summary>🏈 Game 16: Detroit Lions at Buffalo Bills (Contest: BUF -4.5 / DET +4.5) — [CONTEST LOCK EXPIRED]</summary>
<div class="rollup-content">

* **Line Trajectory:** Contest: BUF -4.5 | Final: **BUF 41 — DET 31** (Bills covered by 5.5)
* **Contest Perspective:** Thursday Night Football kicked off Thursday at 5:15 PM PDT and is locked. 15 matchups remain for the Sunday/Monday card.
* **SuperContest Pick:** 🔒 **CONTEST LOCK EXPIRED**

[⬆ Back to Top Matchup Table](#executive-board)
</div>
</details>
""")
    return '\n'.join(out)


def section(n, key, anchor, title, summary, body, extra_buttons=''):
    return f"""
<a id="{anchor}"></a>
## {n}. {title}

<div class="rollup-controls">
  <button class="btn-toggle btn-primary" onclick="toggleRollups('{key}', true)">Expand Section {n}</button>
  <button class="btn-toggle" onclick="toggleRollups('{key}', false)">Collapse Section {n}</button>{extra_buttons}
</div>

<details class="rollup-box section-main {key}" id="section-{n}-box" open>
<summary>{summary}</summary>
<div class="rollup-content">

{body}

[⬆ Back to Top](#top5-portfolio)
</div>
</details>

---
"""


def build_md():
    md = f"""# 🏆 NFL Week 2 SuperContest Master Intelligence Report
## Spread-Only Analytical Dossier, Ranked 5-Pick Contest Card & Full 16-Game ATS Matrix

---

<div class="quick-nav-panel">
  <div class="quick-nav-header">
    <div class="quick-nav-controls">
      <span class="quick-nav-label">⚡ Controls:</span>
      <button class="btn-pill btn-primary" onclick="toggleAllRollups(true)">Expand All</button>
      <button class="btn-pill" onclick="toggleAllRollups(false)">Collapse All</button>
      <button class="btn-pill" onclick="toggleRollups('section-alternates', true); openTargetDetails('#top5-alternates-box');">Alternates (#6–10)</button>
    </div>
    <span class="quick-nav-hint">💡 Tip: Clicking any matchup glides directly to that analysis.</span>
  </div>
  <div class="quick-picks-list">
    <div class="quick-pick-line">
      <span class="pick-tier-badge badge-top5">Top 5:</span>
      {quick(top5)}
    </div>
    <div class="quick-pick-line">
      <span class="pick-tier-badge badge-alt">Alternates:</span>
      {quick(alts)}
    </div>
  </div>
</div>

<details class="rollup-box section-rules" id="contest-rules-box">
<summary>📋 SuperContest Rules &amp; Overview (Spread-Only Format, Scoring, Lock Times &amp; Market Data)</summary>
<div class="rollup-content">
  <div class="status-banner" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-left: 5px solid #10B981; padding: 14px 18px; border-radius: 8px; margin-bottom: 12px; color: #F8FAFC;">
    <div style="font-size: 1.05rem; font-weight: 700; color: #34D399; margin-bottom: 4px;">🟢 Market Snapshot: 3-Book Median + Kalshi Integrated (DRAFT — re-check Sunday)</div>
    <div style="font-size: 0.92rem; line-height: 1.5;">
      • <strong>Market Lines:</strong> 3-book median spreads, <strong>Sep 19, 2026, 12:00 PM UTC</strong>. Kalshi/Polymarket refreshed Sep 19.<br>
      • <strong>Contest Lines:</strong> Westgate SuperContest Week 2 lines captured <strong>Sep 18, 2026, 12:48 AM UTC</strong>.<br>
      • <strong>Contest Format:</strong> <strong>Spread-Only</strong>. Select exactly <strong>five (5) NFL sides</strong> against the locked contest lines. Zero totals, zero moneylines, zero props, zero teasers.<br>
      • <strong>Scoring System:</strong> Win = <strong>1.0 point</strong>, Push/Tie = <strong>0.5 points</strong>, Loss = <strong>0.0 points</strong>.<br>
      • <strong>Game 16 Status (Lions @ Bills, TNF):</strong> 🏁 <strong>FINAL — BUF 41, DET 31</strong> (BUF -4.5 covered). 15 active games remain.<br>
      • <strong>Sunday Re-Check:</strong> Burrow (CIN), Tua/Rush (ATL), Nacua (LAR), NYG OL (Thomas, Mauigoa), Flowers (BAL), Bowers (LV), McConkey (LAC).<br>
      • <strong>Interactive Sortable Tables:</strong> 💡 Hover over any header marked with <strong>ⓘ</strong> for definitions. <strong>Click any column header to sort</strong> ascending or descending.
    </div>
  </div>
</div>
</details>

<details class="rollup-box section-rules" id="week1-review-box">
<summary>📉 Week 1 Card Review: 1–4 (1.0 pt) — What We Carry Forward</summary>
<div class="rollup-content">

| Pick | Result | Final |
|---|---|---|
| TB +3.5 @ CIN | ❌ Loss | CIN 33–27 |
| IND +3.5 vs BAL | ❌ Loss | BAL 41–23 |
| PIT −3.5 vs ATL | ✅ Win | PIT 20–13 (market closed −5.5: +2.0 CLV) |
| DAL −3.0 @ NYG | ❌ Loss | NYG 28–20 |
| CAR +3.0 vs CHI | ❌ Loss | CHI 59–37 |

Four of five leaned on "hook through key number 3" logic; the only winner was the pick with real closing-line value. **Week 2 ranking rule: contest-vs-market value and consensus first, key-number narratives second.** Week 2 card balance: 2 dogs, 3 favorites.

</div>
</details>

---

<a id="top5-portfolio"></a><a id="executive-board"></a>
## 1. Executive Ranked Recommendations: The Official Platinum Rose "Top 5" SuperContest Card

<div class="rollup-controls">
  <button class="btn-toggle btn-primary" onclick="toggleRollups('section-top5', true)">Expand Section 1</button>
  <button class="btn-toggle" onclick="toggleRollups('section-top5', false)">Collapse Section 1</button>
  <button class="btn-toggle" onclick="toggleRollups('section-alternates', true)">Expand Alternates (#6–10)</button>
  <button class="btn-toggle" onclick="toggleRollups('section-alternates', false)">Collapse Alternates (#6–10)</button>
</div>

<details class="rollup-box section-main section-top5" id="section-1-box" open>
<summary>🏆 Section 1: Executive Ranked Recommendations — Official "Top 5" Card &amp; Alternates</summary>
<div class="rollup-content">

Modeled on the **SuperContest Dashboard Tab**, this board tracks line progression from **Tuesday Open → Wednesday Contest Lock → Saturday Market → Contest-vs-Market Value**, with expert consensus *(💡 Click any column header to sort)*:

### The Primary "Top 5" Contest Card (Ranks #1 to #5)

{rollup_table(top5)}

<div style="background:#fff7ed; border-left:4px solid #f97316; padding:12px 16px; margin:14px 0; border-radius:6px; font-size:13px; color:#334155; line-height:1.5;">
  <strong>⚠️ Contrarian check:</strong> Covers' every-game ATS column is on the other side of four of our five (CHI, NYG, JAX, CIN) and on SF. Every Top-5 pick still holds at least a 2-to-1 edge in distinct backers, and Wes Reynolds (VSiN) independently has MIN, LAR and Denver.
</div>

<details class="rollup-box section-alternates" id="top5-alternates-box" open>
<summary>🔄 Alternates (#6–10): Backup Contest Selections</summary>
<div class="rollup-content">

<p style="margin-top:0; color:#64748b; font-size:13.5px;">For late injury swaps (e.g. HOU if Burrow is a full go) or a second entry:</p>

{rollup_table(alts)}

</div>
</details>

[⬆ Back to Top](#top5-portfolio)
</div>
</details>

---
"""
    md += section(2, 'section-matrix', 'contest-master-matrix', 'Complete 16-Game SuperContest ATS Matrix (Spread-Only)',
                  '📊 Section 2: Complete Locked Spread Matrix, Market Lines &amp; Value Differentials',
                  "This board covers all 15 Sunday/Monday matchups (TNF is final) from **Tuesday Open → Wednesday Contest Lock → Saturday Market → Movement**, with hyperlinked deep dives *(💡 Click any column header to sort)*:\n\n"
                  + matrix_table())
    panel = """Direct comparison of the Week 2 spread cards from the shows, writers and X accounts we track:

<div style="background:#f8fafc; border-left:4px solid #2563eb; padding:12px 16px; margin-bottom:18px; border-radius:6px; font-size:13px; color:#334155; line-height:1.5;">
  <strong>💡 Source Verification:</strong><br>
  Picks come from full-transcript extraction of Week 2 podcast episodes (Sep 14+), article feeds, and X/Twitter bookmarks (thread-expanded, image OCR, Antigravity video transcription, Grok thread capture). Multi-writer outlets (Action Network, BettingPros, VSiN) can appear on both sides of a game.
</div>
"""
    for anchor, title, items in EXPERTS:
        panel += f'\n<a id="{anchor}"></a>\n### {title}\n' + '\n'.join(items) + '\n'
    panel += """
### 🌟 Panel Consensus Takeaways:
* **DEN −2.5 and HOU −2.5** are the sides almost every panel shares (Covers is the notable dissenter on both).
* **MIN +5.5** is the best contest-specific number — a full point better than the market.
* **LAR −7** has the sharp-show support and the best matchup data, with ~9% push equity.
"""
    md += section(3, 'section-experts', 'expert-comparison-cards', 'Expert Panel Contest Five Showdown',
                  '👥 Section 3: Expert Panel Contest Card Showdown (Even Money, Sharp or Square, Action, BettingPros, The Favorites, Covers, VSiN, Lock &amp; Cash, Platinum Rose)', panel)
    md += section(4, 'section-dossier', 'game-by-game-ats', 'Game-by-Game Spread-Only Analytical Dossier (All 16 Games)',
                  '🔍 Section 4: Game-by-Game Spread-Only Analytical Dossier (All 16 Games)', dossier(),
                  extra_buttons="\n  <button class=\"btn-toggle\" onclick=\"toggleRollups('section-games', true)\">Expand All 16 Matchups</button>\n  <button class=\"btn-toggle\" onclick=\"toggleRollups('section-games', false)\">Collapse All 16 Matchups</button>")
    md += section(5, 'section-strategy', 'strategy-guide', 'Strategic Playbook: The 3 Golden Rules of SuperContest Success',
                  '📐 Section 5: The 3 Golden Rules of SuperContest Success', """### 1. Free Points on Locked Lines (Our #1 Rule After Week 1)
* SuperContest lines lock every Wednesday and never change; late injury news and money move the market for free.
* **Week 2 Example 1:** The contest locked **CHI −5.5**; the market fell to **−4.5** after Wentz was named — **Vikings +5.5 gets a full free point**.
* **Week 2 Example 2:** The contest locked **LAR −7**; the market went to **−7.5** — the Rams get the half-point *and* push protection on 7.
* **Week 2 Example 3:** **WAS +4.5** (market +4) and **PIT +5.5** (market +5) each carry a free half-point (alternates).
* **Counter-example:** **ARI +3.5** is *worse* than the market's +4 — the seven ARI backers are on +4/+4.5. Don't play the contest number just because the side is popular.

### 2. The Half-Point Hook — Only When It's Free
* Margins of **3 and 7** are the most common NFL results. In Week 1 four hook-through-3 picks all lost; the hook only helps when the number itself is right.
* This week the only key-number edge we hold comes from line value (LAR −7 vs −7.5), not from picking dogs at +3.5.

### 3. The 3.0 &amp; 7.0 Safety Net (Push Economics)
* On flat numbers like **Rams −7** or **Eagles −7**, a tie awards **0.5 points** instead of 0.0.
* Kalshi puts roughly a 9% chance on the Rams winning by exactly 7 — worth about 0.05 points of expected contest score on its own.
""")
    return md


def main():
    md = build_md()
    name = 'nfl_week2_supercontest_intelligence_summary'
    out_dir = ROOT / 'dist' / 'nfl_week2_master_packet'
    out_dir.mkdir(parents=True, exist_ok=True)
    (ROOT / 'scratch' / f'{name}.md').write_text(md, encoding='utf-8')
    (out_dir / f'{name}.md').write_text(md, encoding='utf-8')
    convert_summary.generate_docx(str(out_dir / f'{name}.md'), str(out_dir / f'{name}.docx'))
    convert_summary.generate_html(str(out_dir / f'{name}.md'), str(out_dir / f'{name}.html'))

    # Packet page (supercontest.html) -- same treatment as Week 1's assemble step.
    w1 = ROOT / 'dist' / 'nfl_week1_master_packet'
    for sub in ('assets/css', 'assets/js', 'assets/logos'):
        src = w1 / sub
        if src.exists():
            shutil.copytree(src, out_dir / sub, dirs_exist_ok=True)
    asm = (ROOT / 'scripts' / 'assemble_master_packet.py').read_text(encoding='utf-8')
    logo_style = re.search(r'logo_style_block = """(.*?)"""', asm, re.S).group(1)
    html = (out_dir / f'{name}.html').read_text(encoding='utf-8')
    html = re.sub(r'https://a\.espncdn\.com/i/teamlogos/nfl/500/([a-z]+)\.png',
                  r'assets/logos/\1.png" onerror="this.onerror=null;this.src=\'https://a.espncdn.com/i/teamlogos/nfl/500/\1.png\';', html)
    html = html.replace('class="team-logo"', 'class="team-logo" width="22" height="22"')
    html = html.replace('class="team-logo-sm"', 'class="team-logo-sm" width="18" height="18"')
    html = html.replace('</style>', logo_style, 1)
    nav = f"""<nav class="packet-nav">
  <div class="packet-nav-container">
    <a href="nfl_week2_master_betting_intelligence_summary.html" class="packet-nav-brand">
      <span>🏈</span>
      <span>NFL WEEK 2 INTEL</span>
      <span class="brand-badge">2026 DOSSIER</span>
    </a>
    <button class="packet-nav-toggle" aria-label="Toggle navigation">☰</button>
    <ul class="packet-nav-menu">
      <li class="packet-nav-item"><a href="nfl_week2_master_betting_intelligence_summary.html" class="packet-nav-link"><span>📊 Master Board</span></a></li>
      <li class="packet-nav-item"><a href="supercontest.html" class="packet-nav-link active"><span>🏆 SuperContest</span></a></li>
      <li class="packet-nav-item"><a href="../nfl_week1_master_packet/supercontest.html" class="packet-nav-link"><span>⏮ Week 1 Packet</span></a></li>
      <li class="packet-nav-item">
        <a href="#" class="packet-nav-link"><span>💾 Formats</span><span class="dropdown-arrow">▼</span></a>
        <div class="packet-dropdown right-aligned">
<div class="packet-dropdown-header">💾 Standalone Formats</div>
<a href="nfl_week2_master_betting_intelligence_summary.docx"><span>📝 Master Dossier (Word DOCX)</span></a>
<a href="nfl_week2_master_betting_intelligence_summary.md"><span>📋 Master Dossier (Raw MD)</span></a>
<div class="packet-dropdown-divider"></div>
<a href="{name}.docx"><span>🏆 SuperContest Dossier (Word)</span></a>
<a href="{name}.md"><span>🏆 SuperContest Dossier (MD)</span></a>
        </div>
      </li>
    </ul>
  </div>
</nav>
<div class="packet-breadcrumb-bar">
  <div class="packet-breadcrumb-inner">
    <a href="nfl_week2_master_betting_intelligence_summary.html" class="back-btn">← Back to Master Board</a>
    <span class="sep">/</span>
    <span class="current">SuperContest Only Mode</span>
  </div>
</div>"""
    html = html.replace('</head>', '<link rel="stylesheet" href="assets/css/packet-nav.css">\n<script src="assets/js/packet-nav.js" defer></script>\n</head>', 1)
    m = re.search(r'<body[^>]*>', html, re.I)
    html = html[:m.end()] + '\n' + nav + '\n' + html[m.end():]
    (out_dir / 'supercontest.html').write_text(html, encoding='utf-8')
    print('Wrote', out_dir / 'supercontest.html')


if __name__ == '__main__':
    main()
