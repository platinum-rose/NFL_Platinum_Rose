#!/usr/bin/env python3
"""Weekly Master Betting Intelligence Report builder (data-driven; replaces the hand-typed
scratch/build_master_report_week2.py pattern). Same 11-section structure as Weeks 1-2.

usage:
  node scripts/master-intel/pull.mjs --week 3                 # Supabase read-only pull (step 1)
  python3 scripts/master-intel/build.py --week 3 --date 2026-09-26   # build (step 2)

Inputs (all local, all read-only; missing optional inputs are listed under "Known gaps"):
  REQUIRED  public/schedule.json
  REQUIRED  data/generated/props/bookmaker-live-<date>-week<N>.json   (BKR SGP capture; see runbook)
  REQUIRED  data/generated/master-intel/w<NN>-pull.json               (pull.mjs)
  optional  data/generated/props/beo-w<NN>.json                       (scripts/props/beo.py on docs/Player_Prop_Odds_Weekly/Week<N>)
  optional  data/generated/props/dk-predictions-<date>-*.json         (scripts/props/dk-predictions-mhtml-parse.py)
  optional  data/podcasts/youtube-extracted-picks-2026-w<NN>.json     (cleaned YouTube digest)
  optional  scratch/w<NN>-synthesis-digest-sat.md (or w<NN>-synthesis-digest.md)  (lean table, "game | market | lean | source | tier")
  optional  reports/intel/master-intel-narratives-<season>-w<NN>.md  (hand/LLM-written §6 game scripts + projected scores; see runbook)
  optional  data/odds/BKR_current_lines_*                          (earlier BKR pastes; earliest one for the week = line-move baseline)
  optional  reports/bets/2026-w<NN>-card.md                           (card; "### <ticket> — <book> — **$x** — price" headings)
  optional  data/player-availability/latest.json, data/secondary-matchups/latest.json,
            data/nfl-rosters/roster-map-latest.json, data/survivor/*, data/research-intel/review/player-props-intel-latest.json
Outputs:
  dist/nfl_week<N>_master_packet/nfl_week<N>_master_betting_intelligence_summary.{md,html,docx}
"""
import argparse, base64, collections, datetime, glob, json, os, re, sys, zoneinfo
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PT = zoneinfo.ZoneInfo('America/Los_Angeles')
FULL = {'Arizona Cardinals':'ARI','Atlanta Falcons':'ATL','Baltimore Ravens':'BAL','Buffalo Bills':'BUF','Carolina Panthers':'CAR','Chicago Bears':'CHI','Cincinnati Bengals':'CIN','Cleveland Browns':'CLE','Dallas Cowboys':'DAL','Denver Broncos':'DEN','Detroit Lions':'DET','Green Bay Packers':'GB','Houston Texans':'HOU','Indianapolis Colts':'IND','Jacksonville Jaguars':'JAX','Kansas City Chiefs':'KC','Las Vegas Raiders':'LV','Los Angeles Chargers':'LAC','Los Angeles Rams':'LAR','Miami Dolphins':'MIA','Minnesota Vikings':'MIN','New England Patriots':'NE','New Orleans Saints':'NO','New York Giants':'NYG','New York Jets':'NYJ','Philadelphia Eagles':'PHI','Pittsburgh Steelers':'PIT','San Francisco 49ers':'SF','Seattle Seahawks':'SEA','Tampa Bay Buccaneers':'TB','Tennessee Titans':'TEN','Washington Commanders':'WAS'}
NICK = {v: k.split()[-1] for k, v in FULL.items()}
CITY = {v: ' '.join(k.split()[:-1]).lower() for k, v in FULL.items()}
ALIAS = {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX', 'LVR': 'LV', 'NOS': 'NO'}
LOW_TRUST_CITY = {'NYG', 'NYJ', 'LAC', 'LAR'}  # shared cities: match only by nickname

def FULL_NAME(ab): return next((k for k, v in FULL.items() if v == ab), ab)
def tl(ab):
    """Small team logo (CSS class filled by logo_css(); falls back to nothing if the logo file is missing)."""
    return f'<span class="tl tl-{str(ab).lower()}" title="{FULL_NAME(ab)}"></span>' if ab in FULL.values() else ''
def logo_css():
    rules = ['.tl{display:inline-block;width:20px;height:20px;background-size:contain;background-repeat:no-repeat;background-position:center;vertical-align:-4px;margin:0 4px 0 1px;}']
    for ab in FULL.values():
        f = ROOT / 'data/team-logos' / f'{ab}.png'
        if f.exists(): rules.append(f".tl-{ab.lower()}{{background-image:url(data:image/png;base64,{base64.b64encode(f.read_bytes()).decode()});}}")
    return '<style>' + ''.join(rules) + '</style>'
def ticket_display(name):
    """Reader-facing ticket name: drop internal slot/template codes ('Slot 2', '7a', '(= ...)') and spell out shorthand."""
    n = re.sub(r'^Slot \d+\s+', '', name.strip())
    n = re.sub(r'^\d+[a-z]\s+', '', n)
    n = re.sub(r'\s*\(=.*?\)', '', n)
    n = re.sub(r'^Island SNF Tier (\d+)', r'Sunday Night Island Game — Tier \1', n)
    if n.strip().lower() == 'hybrid': n = 'Hybrid parlay'
    n = re.sub(r'^Dog-ML 2-team RR', 'Underdog Moneyline Round Robin (2-team combos)', n)
    for a_, b_ in ((r'\bDog-ML\b', 'Underdog Moneyline'), (r'\bRR\b', 'Round Robin'), (r'\bT\+A\b', 'Tackles + Assists'), (r'\bpass TD\b', 'Passing TDs'),
                   (r'\bATD\b', 'Anytime TD'), (r'\bSNF\b', 'Sunday Night')):
        n = re.sub(a_, b_, n)
    n = re.sub(r'\b(parlay|prop|stack|hybrid|leg|optional)\b', lambda m: m.group(1).capitalize(), n)
    return n[0].upper() + n[1:] if n else name

def matchup(gid, full=True):
    if not gid or '@' not in gid: return gid or ''
    a_, h_ = gid.split('@')
    txt = f"{tl(a_)}{FULL_NAME(a_) if full else a_} @ {tl(h_)}{FULL_NAME(h_) if full else h_}"
    return txt if full else f'<span style="white-space:nowrap">{txt}</span>'
def NICK_FULL(ab): return FULL_NAME(ab)

def J(p, d=None):
    try: return json.load(open(ROOT / p))
    except Exception: return d

def dec(a): return 1 + a / 100 if a > 0 else 1 + 100 / -a
def imp(a): return 1 / dec(a)
def esc(s): return str(s).replace('|', '/').replace('\n', ' ')

def teams_in(text):
    t = ' ' + (text or '').lower() + ' '
    hit = set()
    for ab, nick in NICK.items():
        if re.search(r'\b' + re.escape(nick.lower()) + r'\b', t) or re.search(r'\b' + ab.lower() + r'\b', t): hit.add(ab)
        elif ab not in LOW_TRUST_CITY and CITY[ab] and re.search(r'\b' + re.escape(CITY[ab]) + r'\b', t): hit.add(ab)
    if 'niners' in t: hit.add('SF')
    return hit

# Column-header tooltips (Week 2 "term-tooltip" markup; convert_summary.py styles them in html and strips them from docx).
TIPS = {
    'Tier': ('Evidence level', 'How much backs the pick. 1 = our own matchup numbers point this way. 2 = at least two named experts picked it this week. 1+2 = both agree. A minus sign means only partly.'),
    'Lean': ('Our lean', 'The side or result we think the evidence favors. A lean is an opinion; the tickets are the actual bets.'),
    'Sources': ('Where it comes from', 'The matchup data, named experts, betting splits or injury news behind the pick.'),
    'Price / structure': ('Price and payout', 'What the bet pays and how the ticket is built.'),
    'Stake': ('Stake', 'How much the ticket risks.'),
    'Fav / spread': ('Favorite and spread', 'Who the sportsbook expects to win, and by how many points.'),
    'Total': ('Total', 'The combined points line for both teams (over/under).'),
    'Implied score': ('Score the lines point to', 'The final score the spread and total suggest together.'),
    'Win % (no-vig)': ('Win chance', 'The moneyline turned into a percent chance to win, with the sportsbook\'s cut taken out.'),
    'Spread tix/$ (home)': ('Bets vs. money', 'Share of bets and share of dollars on the home team.'),
    'Total tix/$ (over)': ('Bets vs. money on the Over', 'Share of bets and share of dollars on the Over.'),
    'Flag': ('Big-money alert', 'Shows where the dollars are much heavier than the number of bets: fewer, bigger bettors.'),
    'Side A (sources)': ('Away-team backers', 'How many experts picked the away team.'),
    'Side B (sources)': ('Home-team backers', 'How many experts picked the home team.'),
    'Total lean': ('Over or Under?', 'Whether more experts picked the Over or the Under (count in brackets).'),
    'Clash?': ('Split opinion', 'Experts are divided: at least two on each side.'),
    'Leg': ('Teaser leg', 'The team you would move 6 points in your favor.'),
    'Current': ('Line now', 'The spread and price at the sportsbook right now.'),
    'Teased': ('Line after teasing', 'The spread after you move it 6 points your way.'),
    'Consensus on that side': ('Experts on that side', 'How many experts picked that team.'),
    'Rung': ('Line', 'The number the player has to reach. "9+" means 9 or more.'),
    'Price': ('Price', 'What the bet pays. −150 = risk $150 to win $100. +150 = risk $100 to win $150. Check your slip; prices move.'),
    'No-vig win %': ('Win chance', 'The sportsbook\'s moneyline turned into a percent chance to win, with its cut taken out.'),
    'Market': ('Bet', 'The bet and the line.'),
    'Source': ('Source', 'Who made the pick.'),
    'Type': ('Bet type', 'Side = pick a team to win or cover. Total = over/under on combined points. Prop = a single player\'s stat.'),
    'Confidence': ('How strong the case is', 'More stars = more evidence lines up behind the bet (matchup data, expert agreement, big money). It ranks our picks against each other; it is not a win percentage.'),
    'Rank': ('Rank', 'Strongest first.'),
    'Pick': ('Pick', 'The bet, with the price we saw.'),
    'Evidence': ('Why we like it', 'What the pick is built on: matchup numbers, experts, betting splits, injuries.'),
    'Why': ('Why', 'The short reason this is on the card.'),
    'Favorite & spread': ('Favorite and spread', 'Who the sportsbook expects to win, and by how many. "BUF −7" means Buffalo has to win by 8 or more to cover.'),
    'Total points': ('Total points', 'The over/under line on both teams\' combined score.'),
    'Score the lines imply': ('Score the lines point to', 'Put the spread and total together and this is the final score the sportsbook is expecting.'),
    'Our projection': ('Our projected score', 'Our own call on the final score, after injuries, matchups, expert opinion and money moves.'),
    'Win chance (no-vig)': ('Win chance', 'Each team\'s chance to win according to the moneyline, with the sportsbook\'s cut taken out.'),
    'Home spread: % bets / % money': ('Who is betting the home team', 'First number: share of bets. Second: share of dollars. When dollars run well ahead of bets, bigger bettors are on that side.'),
    'Over: % bets / % money': ('Who is betting the Over', 'Share of bets and share of dollars on the Over.'),
    'Big-money signal': ('Big-money alert', 'The dollars are much heavier than the number of bets on this side, usually a sign of experienced bettors.'),
    'Consensus side': ('Expert favorite', 'The team more experts picked.'),
    'For – Against': ('Expert count', 'Experts on the favored side vs. the other side. Each expert counts once per game.'),
    'Strength': ('How strong the agreement is', '🌟 almost everyone agrees · 🔥 clear majority · ⚔️ experts are split.'),
    'Details': ('More', 'Jump to the game write-up, all expert picks for the game, or the full breakdown.'),
    'What moves it': ('Why this many stars', 'What raised or lowered the score: evidence level, expert agreement, big money, injury flags.'),
    'Structure & payout': ('How it pays', 'What the ticket returns and how it is built.'),
    "Book's win chance (no-vig)": ('Win chance', 'The sportsbook\'s own estimate of this team\'s chance to win, with its cut taken out.'),
    'Experts for – against': ('Expert count', 'Experts picking this underdog vs. its opponent.'),
    'Moneyline move': ('Price move this week', 'Earlier price → now. When an underdog\'s price shrinks (+126 → +120), money has been coming in on it.'),
    'Tier / source': ('Evidence level and source', 'How the prop made the list: our card, a named expert, or an article pick.'),
    'Prop': ('Prop', 'The player and the number he has to reach.'),
    'Book': ('Sportsbook', 'Where the price came from: BKR = Bookmaker, BEO = BetOnline.'),
    'Legs': ('Legs', 'How many bets are combined in the ticket.'),
    'Ticket': ('Ticket', 'The bet slip. Open it for every leg.'),
    'Contest line': ('Contest line', 'The locked spread the SuperContest uses for this game.'),
    'Game': ('Game', 'Click to jump to the full game write-up.'),
}

def tip(term, title, desc):
    return f'<span class="term-tooltip">{term}<span class="tip-text"><strong>{title}</strong>{desc}</span></span>'

def add_tooltips(lines):
    out = []
    for i, ln in enumerate(lines):
        nxt = lines[i + 1] if i + 1 < len(lines) else ''
        if ln.startswith('|') and re.match(r'^\|(\s*:?-{3,}:?\s*\|)+\s*$', nxt):
            cells = ln.strip().strip('|').split('|')
            cells = [(' ' + tip(c.strip(), *TIPS[c.strip()]) + ' ') if c.strip() in TIPS else c for c in cells]
            ln = '|' + '|'.join(cells) + '|'
        out.append(ln)
    return out

def roll(cls, rid, summary, is_open=False):
    return [f'<details class="rollup-box {cls}" id="{rid}"{" open" if is_open else ""}>', f'<summary>{summary}</summary>', '<div class="rollup-content">', '']

ROLL_END = ['', '[⬆ Back to Our Picks](#recommendations)', '</div>', '</details>']

def controls(cls, label):
    return ['<div class="rollup-controls">', f'  <button class="btn-toggle btn-primary" onclick="toggleRollups(\'{cls}\', true)">Expand {label}</button>',
            f'  <button class="btn-toggle" onclick="toggleRollups(\'{cls}\', false)">Collapse {label}</button>', '</div>', '']

def load_narratives(path):
    """## AWAY@HOME blocks: 'projection: TEAM pts, TEAM pts' then ### subsections."""
    out = {}
    if not path.exists(): return out
    txt = re.sub(r'<!--.*?-->', '', path.read_text(encoding='utf-8'), flags=re.S)
    for blk in re.split(r'^## ', txt, flags=re.M)[1:]:
        head, _, body = blk.partition('\n'); gid = head.strip()
        m = re.search(r'^projection:\s*([A-Z]{2,3})\s+(\d+)\s*,\s*([A-Z]{2,3})\s+(\d+)', body, re.M)
        secs = [(t.strip(), b.strip()) for t, b in re.findall(r'^### (.+?)\n(.*?)(?=^### |\Z)', body, re.M | re.S)]
        out[gid] = dict(proj=((m.group(1), int(m.group(2))), (m.group(3), int(m.group(4)))) if m else None, secs=secs)
    return out

def load_ticket_notes(path, block='TICKETS'):
    out = {}
    if not path.exists(): return out
    txt = re.sub(r'<!--.*?-->', '', path.read_text(encoding='utf-8'), flags=re.S)
    m = re.search(r'^## ' + block + r'\n(.*?)(?=^## |\Z)', txt, re.M | re.S)
    for ln in (m.group(1).splitlines() if m else []):
        mm = re.match(r'^- (.+?): (.+)$', ln.strip())
        if mm: out[mm.group(1).strip()] = mm.group(2).strip()
    return out

def opening_lines(sched):
    """Earliest pasted BKR game-line snapshot (data/odds/BKR_current_lines_*) whose date header matches each game's PT kickoff date."""
    want = {g['id']: g['k'].astimezone(PT).strftime('%b %d').upper() for g in sched}
    pat = re.compile(r'^(\w+) @ (\w+) \d+:\d+.*?\s(\w+) ([+-][\d.]+)[+-]\d+ / (\w+) ([+-][\d.]+)[+-]\d+\s+o([\d.]+)[+-]\d+ u[\d.]+[+-]\d+\s+(\w+) ([+-]\d+) (\w+) ([+-]\d+)')
    out = {}
    files = sorted(glob.glob(str(ROOT / 'data/odds/BKR_current_lines_*')), key=os.path.getmtime)
    for f in files:
        try: lines = open(f, encoding='utf-8').read().splitlines()
        except Exception: continue
        label = Path(f).name.replace('BKR_current_lines_', ''); day = None
        for ln in lines:
            h = re.match(r'GAME LINES - (\w{3}) (\d+)', ln)
            if h: day = f'{h.group(1).upper()} {int(h.group(2)):02d}'; continue
            m = pat.match(ln.strip())
            if not m: continue
            aw, hm = ALIAS.get(m.group(1), m.group(1)), ALIAS.get(m.group(2), m.group(2)); gid = f'{aw}@{hm}'
            if gid in out or want.get(gid) != day: continue
            out[gid] = dict(src=label, sp={ALIAS.get(m.group(3), m.group(3)): float(m.group(4)), ALIAS.get(m.group(5), m.group(5)): float(m.group(6))},
                            tot=float(m.group(7)), ml={ALIAS.get(m.group(8), m.group(8)): int(m.group(9)), ALIAS.get(m.group(10), m.group(10)): int(m.group(11))})
    return out

def md_inline(t):
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', re.sub(r'(?<![*\w])_(.+?)_(?![*\w])', r'<em>\1</em>', t))

SEC_ICON = {'rec': '⭐', 'exec': '📌', '1': '🏆', '2': '🧾', '3': '🔁', '4': '🐶', '5': '🛡️', '6': '🔍', '7': '🧭', '8': '🎙️', '9': '📐', '10': '🔧', '11': '📚'}

def wrap_sections(lines, icons=None, names=None):
    """Week-2 SuperContest pattern: every top-level '## ' section body sits in its own
    collapsible <details class="rollup-box section-main"> box (open by default), with
    Expand/Collapse buttons for the section plus any sub-box buttons the section already had."""
    heads = [i for i, ln in enumerate(lines) if ln.startswith('## ') and not (i > 0 and lines[i - 1].startswith('# '))]
    if not heads: return lines, []
    out = lines[:heads[0]]; toc = []
    for n, h in enumerate(heads):
        end = heads[n + 1] if n + 1 < len(heads) else len(lines)
        title = lines[h][3:].strip()
        num = title.split('.')[0] if title[0].isdigit() else ('rec' if title.startswith('⭐') else 'exec')
        key = f'secmain-{num}'; rid = f'section-{num}-box'
        label = '§' + num if num[0].isdigit() else {'rec': 'Picks', 'exec': 'Summary'}[num]
        short = title.split(':')[0] if num != 'exec' else title.replace('📌 ', '')
        toc.append((rid, num, title.split('. ', 1)[-1].split(':')[0] if num[0].isdigit() else {'rec': 'Platinum Rose Recommendations', 'exec': 'Executive Summary'}[num]))
        body = lines[h + 1:end]
        # trailing anchors/blank lines belong to the NEXT section
        tail = []
        while body and (not body[-1].strip() or body[-1].startswith(('<a id=', '<div class="part-banner'))):
            tail.insert(0, body.pop())
        # pull an existing controls block (right after the heading) out of the body
        j = next((x for x in range(min(6, len(body))) if body[x].startswith('<div class="rollup-controls">')), None)
        sub = []
        if j is not None:
            k = j
            while body[k].strip() != '</div>': k += 1
            what = 'games' if ('Dossier' in title or 'Forecast Board' in title or 'Game-by-Game' in title) else 'boxes'
            sub = [re.sub(r'>Expand Section [^<]*<', f'>Open all {what}<', re.sub(r'>Collapse Section [^<]*<', f'>Close all {what}<', b)) for b in body[j + 1:k]]
            body = body[:j] + body[k + 1:]
        ctl = ['<div class="rollup-controls">',
               f'  <button class="btn-toggle btn-primary" onclick="toggleRollups(\'{key}\', true)">Expand {label}</button>',
               f'  <button class="btn-toggle" onclick="toggleRollups(\'{key}\', false)">Collapse {label}</button>'] + sub + ['</div>', '']
        icon = (icons or SEC_ICON).get(num, '📄')
        summ = f'{icon} ' + (f'Section {num}: ' + title.split('. ', 1)[-1] if num[0].isdigit() else (names or {}).get(num) or {'rec': 'Platinum Rose Recommendations — what to bet this week', 'exec': 'Executive Summary'}[num])
        out += [lines[h], ''] + ctl + [f'<details class="rollup-box section-main {key}" id="{rid}" open>', f'<summary>{summ}</summary>', '<div class="rollup-content">', ''] + body + ['', '</div>', '</details>'] + tail
    return out, toc


# ======================================================================
# Template v2 (2026-10-01, Andy): picks first, reasoning second, reference last.
#   Part A  What to bet:      ⭐ Our Picks · 1 Every Bet, Ranked · 2 Player Props · 3 Teasers · 4 Underdog ticket · 5 Survivor
#   Part B  Why we like them: 📌 The Week at a Glance · 6 Game-by-Game (odds + money folded in) · 7 What the Experts Say
#   Part C  Reference:        8 Expert Pick Registry · 9 Betting Trends · 10 How the Card Was Built · 11 Sources & Data Notes
# The section builders still emit the v1 order; reorder_sections() rearranges the
# pre-wrap lines and remaps every in-report section reference (§N / Section N / #section-N-box).
# ======================================================================
OLD2NEW = {'1': '1', '2': '6', '3': '7', '4': '8', '5': '3', '6': '4', '7': '6', '8': '2', '9': '5', '10': '9', '11': '11'}
V2_TITLES = {
    '1': 'Every Bet, Ranked: Sides, Totals & Props by Confidence',
    '2': 'Player Props: Build-Your-Own Pool & Prop Boards',
    '3': 'Teaser Bets: 6-Point Wong Teasers',
    '4': 'The Underdog Upset Ticket: The Dogs and Why',
    '5': 'Survivor Pool Picks: Safest Teams This Week',
    '6': 'Game-by-Game Breakdowns: Odds, Money, Projections & the Case',
    '7': 'What the Experts Say: Consensus & Clashes',
    '8': 'Expert Pick Registry by Game',
    '9': 'Betting Trends & Systems',
    '10': 'How the Card Was Built',
    '11': 'Sources, Feed Health & Known Gaps'}
PART_OF = {'rec': 'A', '1': 'A', '2': 'A', '3': 'A', '4': 'A', '5': 'A', 'exec': 'B', '6': 'B', '7': 'B', '8': 'C', '9': 'C', '10': 'C', '11': 'C'}
PART_LABEL = {'A': ('🎯', 'Part A — What to bet', 'Every pick and ticket, ready for the slip.'),
              'B': ('🧠', 'Part B — Why we like them', 'The week at a glance, then the case for every game.'),
              'C': ('📚', 'Part C — Reference', 'Expert registry, trends, build rules and data notes.')}

def remap_refs(text):
    """Old (v1) section numbers -> v2 numbers in §N, 'Section N' and #section-N-box references. Apply once."""
    def f(m):
        if m.group(1): return '§' + OLD2NEW.get(m.group(1), m.group(1))
        if m.group(2): return 'Section ' + OLD2NEW.get(m.group(2), m.group(2))
        return '#section-' + OLD2NEW.get(m.group(3), m.group(3)) + '-box'
    return re.sub(r'§\s?(\d+)\b|\bSection (\d+)\b|#section-(\d+)-box', f, text)

def _block_end(lines, i):
    d = 0
    for j in range(i, len(lines)):
        d += lines[j].count('<details') - lines[j].count('</details>')
        if d <= 0: return j
    return len(lines) - 1

def part_banner(p):
    ico, title, sub = PART_LABEL[p]
    return ['', f'<div class="part-banner part-{p.lower()}"><span class="pb-ico">{ico}</span><strong>{title}</strong><span class="pb-sub">{sub}</span></div>']

def reorder_sections(L):
    heads = [i for i, ln in enumerate(L) if ln.startswith('## ') and not (i > 0 and L[i - 1].startswith('# '))]
    def key_of(t):
        t = t[3:].strip()
        if t.startswith('⭐'): return 'rec'
        if t.startswith('📌'): return 'exec'
        m = re.match(r'(\d+)\.', t); return m.group(1) if m else None
    starts = []
    for h in heads:
        s0 = h
        while s0 > 0 and (L[s0 - 1].startswith('<a id=') or not L[s0 - 1].strip()): s0 -= 1
        starts.append(s0)
    if not starts: return L
    seg = {}
    for n, (s0, h) in enumerate(zip(starts, heads)):
        e = starts[n + 1] if n + 1 < len(starts) else len(L)
        seg[key_of(L[h])] = dict(pre=[x for x in L[s0:h] if x.startswith('<a id=')], head=L[h], body=L[h + 1:e])
    if not ({'rec', 'exec'} | {str(i) for i in range(1, 12)}) <= set(seg):
        print('WARN reorder_sections: unexpected section layout, leaving v1 order'); return L
    def cut_block(lines, marker):
        i = next((k for k, x in enumerate(lines) if x.lstrip().startswith('<details') and marker in x), None)
        if i is None: return lines, []
        j = _block_end(lines, i); return lines[:i] + lines[j + 1:], lines[i:j + 1]
    def split_at(lines, pred):
        k = next((i for i, x in enumerate(lines) if pred(x)), len(lines)); return lines[:k], lines[k:]
    def strip_controls(lines):
        i = next((k for k, x in enumerate(lines[:8]) if x.startswith('<div class="rollup-controls">')), None)
        if i is None: return lines
        j = next(k for k in range(i, len(lines)) if lines[k].strip() == '</div>'); return lines[:i] + lines[j + 1:]
    pre, inputs = cut_block(L[:starts[0]], 'id="inputs-box"')
    b1a, b1b = split_at(seg['1']['body'], lambda x: x.startswith('<a id="prop-pool"'))
    b4a, b4b = split_at(seg['4']['body'], lambda x: x.startswith('<a id="expert-registry"'))
    b4a = ['', '### 🎯 The same plays, grouped by bet type', ''] + [x for x in strip_controls(b4a) if not x.startswith('Every play on the card, **ranked')]
    b4b = [x for x in b4b if not x.startswith('### 🎙️ Expert pick registry')]
    b8a, b8b = split_at(seg['8']['body'], lambda x: x.startswith('<details') and 'id="under-the-hood"' in x)
    b8a = ['', '### 📋 Prop boards: article tier-1, tackles + assists, 2+ passing TDs', ''] + [x for x in strip_controls(b8a) if not x.startswith('Reference boards for player props.')]
    if b8b and ' open' not in b8b[0]: b8b = [b8b[0][:-1] + ' open>'] + b8b[1:]
    # fold §2's per-game odds/money boxes into each game's §7 box
    b2 = strip_controls(seg['2']['body']); boards = {}
    while True:
        i = next((k for k, x in enumerate(b2) if x.startswith('<details') and 'id="board-' in x and 'id="board-defs"' not in x), None)
        if i is None: break
        j = _block_end(b2, i); rid = re.search(r'id="board-([^"]+)"', b2[i]).group(1); blk = b2[i:j + 1]
        blk = [re.sub(r'^\[Full game write-up →\]\([^)]*\)( · )?', '', x) for x in blk]
        if len(blk) > 1:
            m = re.match(r'<summary>📊 (.*?) — (.*)</summary>$', blk[1])
            if m: blk[1] = f'<summary>💵 Odds, win chance &amp; where the money is — {m.group(2)}</summary>'
        boards[rid] = blk; b2 = b2[:i] + b2[j + 1:]
    b2 = [x for x in b2 if not x.startswith('**Game by game**')]
    b7 = list(seg['7']['body'])
    for rid, blk in boards.items():
        i = next((k for k, x in enumerate(b7) if x.startswith('<details') and f'id="game-{rid}-box"' in x), None)
        if i is None: continue
        j = _block_end(b7, i)
        k = next((k for k in range(i + 1, j) if b7[k].startswith('<details') and f'id="game-{rid}-context"' in b7[k]), None)
        if k is None: k = next((k for k in range(j, i, -1) if b7[k].startswith('[⬆ Back')), j)
        b7 = b7[:k] + blk + [''] + b7[k:]
    ci = next((k for k, x in enumerate(b7[:10]) if x.startswith('<div class="rollup-controls">')), None)
    if ci is not None:
        ce = next(k for k in range(ci, len(b7)) if b7[k].strip() == '</div>'); b7_head, b7_rest = b7[:ce + 1], b7[ce + 1:]
    else:
        b7_head, b7_rest = [], b7
    b6 = b7_head + [''] + b2 + [''] + b7_rest
    def sec(num, pre_, body):
        return [''] + pre_ + [f'## {num}. {V2_TITLES[num]}', ''] + body
    out = pre + part_banner('A') + [''] + seg['rec']['pre'] + [seg['rec']['head']] + seg['rec']['body']
    out += sec('1', seg['1']['pre'] + seg['4']['pre'], b1a + b4a)
    out += sec('2', seg['8']['pre'], b1b + b8a)
    out += sec('3', seg['5']['pre'], seg['5']['body'])
    out += sec('4', seg['6']['pre'], seg['6']['body'])
    out += sec('5', seg['9']['pre'], seg['9']['body'])
    out += part_banner('B') + [''] + seg['exec']['pre'] + ['## 📌 The Week at a Glance', ''] + seg['exec']['body']
    out += sec('6', seg['7']['pre'] + seg['2']['pre'], b6)
    out += sec('7', seg['3']['pre'], seg['3']['body'])
    out += part_banner('C') + sec('8', [], b4b)
    out += sec('9', seg['10']['pre'], seg['10']['body'])
    out += sec('10', ['<a id="how-card-built"></a>'], b8b)
    out += sec('11', seg['11']['pre'], (['**What this report was built from:**', ''] + inputs + [''] if inputs else []) + seg['11']['body'])
    return [remap_refs(x) for x in out]

V2_PLAIN = {'rec': 'Our Picks This Week', 'exec': 'The Week at a Glance', '1': 'Every Bet, Ranked', '2': 'Player Props', '3': 'Teaser Bets',
            '4': 'The Underdog Upset Ticket', '5': 'Survivor Pool Picks', '6': 'Game-by-Game Breakdowns', '7': 'What the Experts Say',
            '8': 'Expert Pick Registry', '9': 'Betting Trends', '10': 'How the Card Was Built', '11': 'Sources & Data Notes'}
V2_TIP = {'rec': 'Everything we recommend betting this week in one place: straight bets, parlays, prop stacks and SuperContest picks.',
          '1': 'Every pick on the card, strongest first, then the same plays grouped by sides, totals and props. Stars rank our picks against each other; they are not win chances.',
          '2': 'A pool of player props to build your own tickets, grouped by game, plus the prop boards (tackles + assists, 2+ passing TDs, article favorites).',
          '3': 'Games where a 6-point teaser (moving the spread in your favor for a smaller payout) makes the most sense.',
          '4': 'The underdogs we like to win outright, and why each one is on the ticket.',
          '5': 'The safest teams to pick in a survivor pool this week, how popular each pick is, and who to save for later.',
          'exec': 'The handful of things to know about this week: top reads, one-sided consensus, clashes, big money and quarterback news.',
          '6': 'One box per game: our projected score, the case for the pick and what could go wrong, plus the odds, win chances and where the bets and money are going.',
          '7': 'How many betting experts picked each side of every game, and where they agree or are split.',
          '8': 'Every named expert pick we captured, by game. The game write-ups link here when they cite an expert.',
          '9': 'Past betting records and situations that point to a side this week. Useful for breaking ties, not a reason on their own.',
          '10': 'Every ticket on the card and the season build rules behind them.',
          '11': 'What the report was built from, which feeds were working, and what data is missing this week.'}

V2_CSS = ('<style>.part-banner{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;margin:38px 0 12px;padding:11px 16px;border-radius:9px;'
          'background:var(--primary);color:#fff;font-size:1.08rem;letter-spacing:.01em;box-shadow:0 2px 8px rgba(0,0,0,.12);}'
          '.part-banner .pb-sub{opacity:.88;font-size:.86rem;font-weight:400;}.part-banner.part-b{background:#0f766e;}.part-banner.part-c{background:#475569;}'
          '.toc-part{grid-column:1/-1;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:8px 2px 0;}'
          '.side-toc .side-part{font-weight:800;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:10px 8px 2px;}</style>')

def final_scores(week):
    out = {}
    for f in glob.glob(str(ROOT / 'data/fantasy/boxscores/espn-*.json')):
        try:
            d = json.load(open(f))
            if d['header'].get('week') != week: continue
            c = d['header']['competitions'][0]
            if not c.get('status', {}).get('type', {}).get('completed'): continue
            t = {x['homeAway']: (ALIAS.get(x['team']['abbreviation'], x['team']['abbreviation']), int(x.get('score') or 0)) for x in c['competitors']}
            out[f"{t['away'][0]}@{t['home'][0]}"] = t
        except Exception:
            continue
    return out

SIDE_BTN = '<button class="toc-toggle" type="button" onclick="document.body.classList.toggle(\'toc-open\')">☰ Contents</button>'
SIDE_CSS = ('<style>.side-toc{position:fixed;top:16px;left:16px;bottom:16px;width:236px;overflow-y:auto;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 8px;font-size:13px;z-index:50;display:none;box-shadow:0 4px 14px rgba(0,0,0,.10);}'
            '.side-toc a{display:block;padding:6px 8px;border-radius:6px;color:var(--primary);text-decoration:none;line-height:1.3;}.side-toc a:hover{background:var(--highlight);}'
            '.side-toc-title{font-weight:700;margin:2px 8px 6px;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;}'
            '.side-toc a{display:flex;gap:8px;align-items:flex-start;}.toc-ico{flex:0 0 20px;text-align:center;}.toc-txt{flex:1 1 auto;}'
            '.side-tip{position:fixed;z-index:70;max-width:280px;background:#0f172a;color:#f8fafc;font-size:12.5px;line-height:1.45;padding:9px 11px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.25);pointer-events:none;display:none;}'
            '.toc-toggle{position:fixed;top:12px;left:12px;z-index:60;background:var(--primary);color:#fff;border:0;border-radius:8px;padding:8px 12px;font-weight:600;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);}'
            'body.toc-open .side-toc{display:block;top:56px;}'
            '@media (min-width:1420px){.side-toc{display:block;top:16px;}.toc-toggle{display:none;}.container{margin-left:276px !important;margin-right:auto !important;}}</style>')

def finalize_report(L, gaps):
    """Wrap sections, add the grouped TOC, side menu and disclaimer; return the report markdown text."""
    L, TOC = wrap_sections(L, names={'exec': 'The Week at a Glance — what to know before the reasoning'})
    PLAIN = V2_PLAIN
    _PLAIN_V1 = {'rec': 'Our Picks This Week', 'exec': 'The Week at a Glance', '1': 'Every Bet, Ranked', '2': 'What the Odds Predict',
             '3': 'What the Experts Say', '4': 'Strongest Plays & Expert Picks', '5': 'Teaser Bets', '6': 'The Underdog Upset Ticket',
             '7': 'Game-by-Game Breakdowns', '8': 'Player Props & How the Card Was Built', '9': 'Survivor Pool Picks', '10': 'Betting Trends', '11': 'Sources & Data Notes'}
    SHORT_TIP = V2_TIP
    _TIP_V1 = {'rec': 'Everything we recommend betting this week in one place: straight bets, parlays, prop stacks and SuperContest picks.',
                 'exec': 'The six things to know about this week before you read anything else.',
                 '1': 'Every pick on the card in one table, strongest first. Filter to sides, totals or player props, plus a pool of props to build your own tickets.',
                 '2': 'What the sportsbook lines say the final score will be, our own projected score, and where the public and the big-money bettors are putting their money.',
                 '3': 'How many betting experts picked each side of every game, and where they agree or are split.',
                 '4': 'Our plays ranked by how much evidence backs them (the star ratings), plus every named expert pick for each game.',
                 '5': 'Games where a 6-point teaser (moving the spread in your favor for a smaller payout) makes the most sense.',
                 '6': 'The five underdogs we like to win outright, and why each one is on the ticket.',
                 '7': 'A full write-up for every game: how we think it plays out, our projected score, the reasoning, and what could go wrong.',
                 '8': 'Reference boards for player props, and the behind-the-scenes rules we use to build the card.',
                 '9': 'The safest teams to pick in a survivor pool this week, how popular each pick is, and who to save for later.',
                 '10': 'Past betting records and situations that point to a side this week. Useful for breaking ties, not a reason on their own.',
                 '11': 'Where the information came from, which feeds were working, and what data is missing this week.'}
    def toc_label(num): return (f'{num}. ' if num[0].isdigit() else '') + PLAIN.get(num, num)
    BLURB = {'rec': 'What we recommend betting, in one place', 'exec': 'The week at a glance', '1': 'Every lean, sortable & filterable · tickets · props pool',
             '2': 'What the betting lines predict, in plain English', '3': 'Where the experts agree and disagree, ranked', '4': 'Plays ranked by confidence + expert pick registry',
             '5': '6-point teaser candidates', '6': 'The underdogs on the ticket and why', '7': 'Game-by-game scripts, projections & evidence',
             '8': 'Player prop boards + how the card was built', '9': 'Survivor pool ranking', '10': 'Systems & trends worth reading', '11': 'Sources, feed health & known gaps'}
    nav = ['<div class="global-rollup-bar" id="report-controls">', '  <span class="bar-title">⚡ Report Sections:</span>',
           '  <button class="btn-toggle btn-primary" onclick="toggleAllMainSections(true)">Expand All Sections</button>',
           '  <button class="btn-toggle" onclick="toggleAllMainSections(false)">Collapse All Sections</button>',
           '  <button class="btn-toggle" onclick="toggleAllRollups(true)">Open Everything</button>',
           '  <button class="btn-toggle" onclick="toggleAllRollups(false)">Close Everything</button>', '</div>',
           '<div class="toc-title" style="font-weight: 700; font-size: 0.95rem; margin: 4px 0 8px 0; color: var(--primary);">📑 Table of Contents</div>',
           '<div class="toc-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; margin: 0 0 26px 0;">'] + \
          sum((([f'<div class="toc-part">{PART_LABEL[PART_OF[num]][0]} {PART_LABEL[PART_OF[num]][1]}</div>'] if PART_OF.get(num) and (i == 0 or PART_OF.get(TOC[i - 1][1]) != PART_OF.get(num)) else []) + [f'<div style="border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; background: var(--highlight);"><a href="#{rid}" style="font-weight: 700; text-decoration: none; color: var(--primary);">{SEC_ICON.get(num, "📄")} {toc_label(num)}</a><div style="font-size: 0.8rem; color: var(--muted); line-height: 1.35; margin-top: 2px;">{SHORT_TIP.get(num, "")}</div></div>'] for i, (rid, num, name) in enumerate(TOC)), []) + ['</div>', '']
    side = ('<div class="side-toc" id="side-toc"><div class="side-toc-title">Contents</div>'
            + ''.join((f'<div class="side-part">{PART_LABEL[PART_OF[num]][1]}</div>' if PART_OF.get(num) and (i == 0 or PART_OF.get(TOC[i - 1][1]) != PART_OF.get(num)) else '') + f'<a href="#{rid}" data-tip="{SHORT_TIP.get(num, "")}" onclick="document.body.classList.remove(\'toc-open\')"><span class="toc-ico">{SEC_ICON.get(num, "📄")}</span><span class="toc-txt">{toc_label(num)}</span></a>' for i, (rid, num, name) in enumerate(TOC))
            + '<a href="#disclaimer" data-tip="The fine print: this report is for entertainment only, and every bet is your own decision and risk." onclick="document.body.classList.remove(\'toc-open\')"><span class="toc-ico">⚖️</span><span class="toc-txt">Disclaimer</span></a></div>')
    side_btn = SIDE_BTN
    side_css = SIDE_CSS
    at = next((i for i, ln in enumerate(L) if ln.startswith('<div class="part-banner')), None)
    if at is None: at = next(i for i, ln in enumerate(L) if ln.startswith('<a id="recommendations"'))
    L = [side_css, V2_CSS, side, side_btn] + L[:at] + nav + L[at:]
    L += ['', '<a id="disclaimer"></a>',
          '<div class="legal-disclaimer" style="margin-top: 36px; padding: 16px 18px; border: 1px solid var(--border); border-radius: 8px; background: var(--highlight); font-size: 0.82rem; line-height: 1.55; color: var(--muted);">'
          '<strong style="color: var(--text);">⚖️ Disclaimer — for entertainment purposes only.</strong> This report is opinion and research for entertainment and informational purposes. It is not financial, investment, legal or betting advice, and no result is guaranteed. '
          'Odds, lines and player availability change, and the information here may be incomplete or out of date. Sports betting involves real risk of loss. Any bet you place is your own decision, made at your own risk: '
          'the author and Platinum Rose accept no responsibility or liability for any wager, loss or other outcome arising from use of this report. Bet only where it is legal for you, only if you are of legal age, and only what you can afford to lose. '
          'If gambling stops being fun, help is available at 1-800-GAMBLER.</div>']
    short_gaps = [re.sub(r'\s*\([^)]*/[^)]*\)', '', g_).strip().rstrip('.').replace('<', '&lt;') for g_ in gaps]  # banner: plain text, no file paths
    txt = '\n'.join(add_tooltips(L)).replace('__GAPS__', '; '.join(short_gaps) if short_gaps else 'none')
    txt = re.sub(r'§\s?(\d+)', r'Section \1', txt).replace('§', '')
    return txt

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--date', required=True)
    ap.add_argument('--season', type=int, default=2026); ap.add_argument('--no-export', action='store_true')
    ap.add_argument('--allow-roster-issues', action='store_true', help='build even if the roster gate fails (needs Andy OK; issues are printed in the report)')
    a = ap.parse_args(); W, WW, D = a.week, f'{a.week:02d}', a.date
    gaps = []
    sched = [g for g in J('public/schedule.json', []) if g.get('week') == W and g.get('season') == a.season and g.get('season_type') == 2]
    now = datetime.datetime.now(datetime.timezone.utc)
    for g in sched:
        g['k'] = datetime.datetime.fromisoformat(g['kickoff_utc'].replace('Z', '+00:00'))
        g['done'] = g['k'] + datetime.timedelta(hours=4) < now
        g['id'] = f"{g['visitor']}@{g['home']}"
    sched.sort(key=lambda g: g['k'])
    live = [g for g in sched if not g['done']]
    bkr = J(f'data/generated/props/bookmaker-live-{D}-week{W}.json')
    if not bkr: sys.exit(f'missing BKR capture data/generated/props/bookmaker-live-{D}-week{W}.json (see docs/MASTER_INTEL_REPORT_RUNBOOK.md)')
    pull = J(f'data/generated/master-intel/w{WW}-pull.json')
    if not pull: sys.exit(f'missing data/generated/master-intel/w{WW}-pull.json — run scripts/master-intel/pull.mjs --week {W}')
    roster = (J('data/nfl-rosters/roster-map-latest.json', {}) or {}).get('players', {})
    beo = J(f'data/generated/props/beo-w{WW}.json') or []
    if not beo: gaps.append(f'No parsed BEO boards (data/generated/props/beo-w{WW}.json).')
    yt = J(f'data/podcasts/youtube-extracted-picks-2026-w{WW}.json', {}) or {}
    if not yt: gaps.append('No cleaned YouTube pick digest this week.')
    avail = (J('data/player-availability/latest.json', {}) or {}).get('events', [])
    sec = (J('data/secondary-matchups/latest.json', {}) or {}).get('matchups', [])
    dkfiles = sorted(glob.glob(str(ROOT / f'data/generated/props/dk-predictions-{D}-*.json')))
    dk = [d_ for d_ in (json.load(open(f)) for f in dkfiles) if isinstance(d_, dict) and 'away' in d_ and 'home' in d_ and 'rows' in d_]  # skip the week inventory/summary files
    digest_p = next((p for p in [f'scratch/w{WW}-synthesis-digest-sat.md', f'scratch/w{WW}-synthesis-digest.md'] if (ROOT / p).exists()), None)
    card_p = f'reports/bets/{a.season}-w{WW}-card.md'
    card = (ROOT / card_p).read_text(encoding='utf-8') if (ROOT / card_p).exists() else ''
    nar_p = f'reports/intel/master-intel-narratives-{a.season}-w{WW}.md'
    NAR = load_narratives(ROOT / nar_p)
    TNOTE = load_ticket_notes(ROOT / nar_p)
    SCNOTE = load_ticket_notes(ROOT / nar_p, 'SUPERCONTEST')
    OPEN = opening_lines(sched)

    # ---------- BKR per game ----------
    ev = collections.defaultdict(list)
    for r in bkr['rows']: ev[r['event']].append(r)
    G = {}
    for name, rows in ev.items():
        aw, hm = [FULL.get(x.strip()) for x in name.split(' @ ')]
        gl = [r for r in rows if r['market'] == 'game_lines']
        sp = {FULL.get(r['side']): (r['line'], r['odds']) for r in gl if r.get('bet') == 'spread'}
        ml = {FULL.get(r['side']): r['odds'] for r in gl if r.get('bet') == 'moneyline'}
        tot = {r['side']: (r['line'], r['odds']) for r in gl if r.get('bet') == 'total'}
        G[f'{aw}@{hm}'] = dict(away=aw, home=hm, sp=sp, ml=ml, tot=tot, rows=rows)
    def team_of(p):
        return (roster.get(p) or {}).get('team')

    # ---------- splits ----------
    SPL = {}
    for r in pull.get('splits', []):
        aw, hm = ALIAS.get(r['away_team'], r['away_team']), ALIAS.get(r['home_team'], r['home_team'])
        SPL[f'{aw}@{hm}'] = r
    if not SPL: gaps.append(f'No Action Network betting splits for Week {a.week} in the pull (game_splits has 0 rows); bets-vs-money bars and big-money signals are empty.')

    # ---------- consensus ----------
    ids = {g['id']: g for g in live}
    VOTES = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))  # gid -> source -> side counts
    PROPSIG = collections.defaultdict(lambda: collections.defaultdict(set))
    for r in pull['signals']:
        T = teams_in(' '.join(str(r.get(k) or '') for k in ('event_ref', 'team_or_market', 'lean')))
        for gid, g in ids.items():
            A, H = g['visitor'], g['home']
            if not ({A, H} & T): continue
            lean = f"{r.get('lean') or ''} {r.get('team_or_market') or ''}".lower(); who = (r.get('author') or r.get('source') or '?')[:28]
            if r['bet_type'] == 'total':
                side = 'Under' if 'under' in lean else ('Over' if 'over' in lean else None)
            elif r['bet_type'] == 'player_prop':
                PROPSIG[gid][esc(r.get('team_or_market'))[:60] + ' ' + esc(r.get('lean'))[:20]].add(who); continue
            elif r['bet_type'] in ('spread', 'moneyline', 'spread_or_ml'):
                ls = teams_in(lean) & {A, H}; side = list(ls)[0] if len(ls) == 1 else None
            else: side = None
            if side: VOTES[gid][who][side] += 1
    EXP = collections.defaultdict(list)
    exp_dropped = []
    for r in pull['expert']:
        T = teams_in(f"{r.get('visitor')} {r.get('home')}")
        for gid, g in ids.items():
            if {g['visitor'], g['home']} <= T:
                # side picks must name one of this game's teams; otherwise it's a mis-tagged pick
                # (e.g. college "Texas -4.5" stored against TEN@NYG because "Tennessee" resolved to TEN)
                if r.get('pick_type') in ('spread', 'moneyline', 'teaser') and not (teams_in(str(r.get('selection') or '')) & {g['visitor'], g['home']}):
                    exp_dropped.append(f"{gid}: {r.get('expert')} {r.get('pick_type')} {r.get('selection')} {r.get('line') or ''}".strip()); continue
                EXP[gid].append(r)
                sel = str(r.get('selection') or ''); ls = teams_in(sel) & {g['visitor'], g['home']}
                side = 'Under' if 'under' in sel.lower() else 'Over' if 'over' in sel.lower() and r.get('pick_type') == 'total' else (list(ls)[0] if len(ls) == 1 and r.get('pick_type') in ('spread', 'moneyline') else None)
                if side: VOTES[gid][(r.get('expert') or '?')[:28]][side] += 1
    for p in (yt.get('picks', []) if yt else []):
        g = ids.get(p.get('game'))
        if not g: continue
        A, H = g['visitor'], g['home']; ls = teams_in(p['pick']) & {A, H}
        if 'Under' in p['pick']: VOTES[p['game']][p['speaker']]['Under'] += 1
        elif len(ls) == 1 and not p['raw'].get('player'): VOTES[p['game']][p['speaker']][list(ls)[0]] += 1
    # collapse: each source counts once per game for its majority side on each axis (side / total); ties dropped
    CONS = collections.defaultdict(lambda: collections.defaultdict(set))
    for gid, bysrc in VOTES.items():
        for src, cnt in bysrc.items():
            for axis in (lambda k: k not in ('Over', 'Under'), lambda k: k in ('Over', 'Under')):
                c = [(k, v) for k, v in cnt.items() if axis(k)]
                if not c: continue
                c.sort(key=lambda x: -x[1])
                if len(c) > 1 and c[0][1] == c[1][1]: continue
                CONS[gid][c[0][0]].add(src)
    YT = collections.defaultdict(list)
    for p in yt.get('picks', []):
        gm = p.get('game');
        if gm in ids: YT[gm].append(p)

    # ---------- injuries ----------
    INJ = collections.defaultdict(dict)
    # Practice-squad players aren't game-day options, so their injury tags don't belong in a game's
    # key context (2026-09-27: JAX practice-squad QB Joey Aguilar printed as "Questionable at QB").
    ESPN_R = (J('data/nfl-rosters/espn-full-rosters-latest.json', {}) or {}).get('players', {})
    practice_squad = {n for n, rs in ESPN_R.items() if rs and all(r.get('group') == 'practiceSquad' for r in rs)}
    for e in avail:
        if e.get('position') not in ('QB', 'RB', 'WR', 'TE'): continue
        if e.get('player_name') in practice_squad: continue
        st = str(e.get('normalized_status') or '').upper()
        if not re.match(r'^(OUT|DOUBTFUL|QUESTIONABLE)', st): continue
        t = e.get('team_abbr'); n = e['player_name']
        if n not in INJ[t] or str(e.get('published_at')) > str(INJ[t][n]['published_at']): INJ[t][n] = e
    SEC = {(m.get('offense_team'), m.get('defense_team')): m for m in sec}

    # ---------- digest leans ----------
    LEANS = []
    if digest_p:
        for ln in (ROOT / digest_p).read_text(encoding='utf-8').splitlines():
            c = [x.strip() for x in ln.split('|')]
            if len(c) >= 5 and c[0] and not c[0].startswith(('game', '#', 'Sources', 'Live')) and c[-1]:
                LEANS.append(dict(game=c[0], market=c[1], lean=c[2], source=c[3], tier=c[4]))
    else: gaps.append(f'No synthesis digest (scratch/w{WW}-synthesis-digest*.md) — sections 1/4 fall back to consensus counts only.')
    # ---------- card tickets ----------
    if exp_dropped: gaps.append('Dropped mis-tagged expert side picks (selection names neither team): ' + '; '.join(exp_dropped))
    miss_nar = [g['id'] for g in live if not (NAR.get(g['id']) or {}).get('secs')]
    if miss_nar: gaps.append(f'No game narrative/projection for: {", ".join(miss_nar)} ({nar_p}).')
    # ---------- ROSTER GATE (mandatory; added 2026-09-27 after A.J. Brown / Mike Evans / Rachaad White were printed on old teams) ----------
    # Every player->team claim in the card, digest, narratives, matchup seeds and picks is checked against the live 2026 ESPN rosters
    # (refreshed automatically when older than 24h). Any blocking issue STOPS the build. --allow-roster-issues overrides it only
    # with Andy's explicit OK, and the report then carries the issues in its gaps list.
    import subprocess
    rv_p = ROOT / f'data/generated/master-intel/w{WW}-roster-vet.json'
    rv_run = subprocess.run([sys.executable, str(ROOT / 'scripts/nfl-rosters/roster_vet.py'), '--week', str(W), '--date', D, '--season', str(a.season), '--fetch', '--strict'],
                            cwd=ROOT, capture_output=True, text=True)
    print(rv_run.stdout.strip().splitlines()[-1] if rv_run.stdout.strip() else rv_run.stderr.strip())
    if rv_run.returncode:
        rv = json.load(open(rv_p, encoding='utf-8')) if rv_p.exists() else {'blocking': []}
        issues = [f"{b[0]}: {b[1]} {b[2]} (says {'/'.join(b[3]) if b[3] else '-'}, roster {'/'.join(b[4]) if isinstance(b[4], list) else b[4]})" for b in rv.get('blocking', [])]
        if not a.allow_roster_issues:
            print(rv_run.stdout)
            sys.exit('ROSTER GATE FAILED — fix every issue above (narratives by hand; seeds via scripts/nfl-rosters/rebuild_matchup_seeds.py '
                     '+ npm run secondary-matchups; picks at their source) and rebuild. Details: ' + str(rv_p.relative_to(ROOT)))
        gaps.append(f'⛔ ROSTER GATE OVERRIDDEN (--allow-roster-issues) — {len(issues)} unverified player/team claims: ' + '; '.join(issues[:25]))
    TICK = re.findall(r'^### (.+?) — (.+?) — \*\*\$([\d.]+)\*\* — (.+?) — (.+)$', card, re.M)
    if not TICK: gaps.append(f'No card tickets found in {card_p}.')

    def fav(gid):
        g = G.get(gid)
        if not g or not g['sp']: return None, None
        t = min(g['sp'], key=lambda k: g['sp'][k][0]); return t, g['sp'][t][0]
    def novig(gid):
        g = G.get(gid); m = g and g['ml']
        if not m or len(m) < 2: return {}
        p = {k: imp(v) for k, v in m.items()}; s = sum(p.values()); return {k: v / s for k, v in p.items()}
    def main_rung(player, market, rows):
        r = [x for x in rows if x['player'] == player and x['market'] == market and x['available'] and x['odds'] is not None and x.get('threshold') is not None]
        return min(r, key=lambda x: abs(dec(x['odds']) - 1.91), default=None)

    sharp = []          # 'TEAM spread' / 'GID Over|Under' keys (used by the confidence score)
    SIG = collections.defaultdict(list)   # gid -> signals with the exact line
    def _sig(gid, market, side, bets, money):
        b_ = G.get(gid) or {}
        if market == 'spread' and side in b_.get('sp', {}): ln_, pr_ = b_['sp'][side]
        elif market == 'total' and side in b_.get('tot', {}): ln_, pr_ = b_['tot'][side]
        elif market == 'moneyline' and side in b_.get('ml', {}): ln_, pr_ = None, b_['ml'][side]
        else: ln_, pr_ = None, None
        SIG[gid].append(dict(gid=gid, market=market, side=side, bets=bets, money=money, line=ln_, price=pr_))
    for g in live:
        sp_ = SPL.get(g['id']) or SPL.get(g['id'].replace('WAS', 'WSH'))
        if not sp_: continue
        A_, H_ = g['visitor'], g['home']
        hb, hm = sp_['spread_home_bettors'] or 0, sp_['spread_home_money'] or 0
        ob, om = sp_['total_over_bettors'] or 0, sp_['total_over_money'] or 0
        mb, mm = sp_['ml_home_bettors'] or 0, sp_['ml_home_money'] or 0
        if hm - hb >= 15: sharp.append(f"{H_} spread"); _sig(g['id'], 'spread', H_, hb, hm)
        if hb - hm >= 15: sharp.append(f"{A_} spread"); _sig(g['id'], 'spread', A_, 100 - hb, 100 - hm)
        if om - ob >= 15: sharp.append(f"{g['id']} Over"); _sig(g['id'], 'total', 'Over', ob, om)
        if ob - om >= 15: sharp.append(f"{g['id']} Under"); _sig(g['id'], 'total', 'Under', 100 - ob, 100 - om)
        if mm - mb >= 15: _sig(g['id'], 'moneyline', H_, mb, mm)
        if mb - mm >= 15: _sig(g['id'], 'moneyline', A_, 100 - mb, 100 - mm)
    # persist: first time a signal is seen we store its line; later builds show drift from that number
    flag_p = ROOT / f'data/generated/master-intel/big-money-flags-{a.season}-w{WW}.json'
    FLAGS = {}
    try: FLAGS = json.load(open(flag_p)) if flag_p.exists() else {}
    except Exception: FLAGS = {}
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    for k_ in FLAGS: FLAGS[k_]['active'] = False
    for gid, ss in SIG.items():
        sp_ = SPL.get(gid) or SPL.get(gid.replace('WAS', 'WSH')) or {}
        for x in ss:
            k_ = f"{gid}|{x['market']}|{x['side']}"
            rec = FLAGS.get(k_) or dict(first_line=x['line'], first_price=x['price'], first_bets=x['bets'], first_money=x['money'],
                                        first_seen=now_iso, splits_at=sp_.get('captured_at'))
            rec.update(active=True, last_line=x['line'], last_price=x['price'], last_bets=x['bets'], last_money=x['money'], last_seen=now_iso)
            FLAGS[k_] = rec; x['flag'] = rec
    flag_p.parent.mkdir(parents=True, exist_ok=True)
    json.dump(FLAGS, open(flag_p, 'w'), indent=1)
    def sig_label(x, line=None, price=None):
        ln_ = x['line'] if line is None else line; pr_ = x['price'] if price is None else price
        if x['market'] == 'moneyline': return f"{x['side']} ML {pr_:+d}" if pr_ is not None else f"{x['side']} ML"
        if x['market'] == 'spread': return f"{x['side']} {ln_:+g} ({pr_:+d})" if ln_ is not None else f"{x['side']} spread"
        return f"{x['side']} {ln_:g} ({pr_:+d})" if ln_ is not None else x['side']
    def sig_drift(x):
        f_ = x.get('flag') or {}; l0, l1 = f_.get('first_line'), x['line']; p0, p1 = f_.get('first_price'), x['price']
        when = ''
        try: when = datetime.datetime.fromisoformat(f_.get('splits_at') or f_['first_seen']).astimezone(PT).strftime('%a %H:%M PT')
        except Exception: pass
        base = f"First flagged on the {when} splits, at {sig_label(x, l0, p0)}"
        if x['market'] == 'moneyline':
            if p0 is None or p1 is None or p0 == p1: return base + ' — no move since'
            toward = dec(p1) < dec(p0)
            return base + f" — now {p1:+d}, moved {'toward' if toward else 'away from'} {x['side']}"
        if l0 is None or l1 is None: return base
        d_ = l1 - l0
        if d_ == 0: return base + ' — no move since' + (f' (price {p0:+d} → {p1:+d})' if p0 != p1 and p0 is not None else '')
        if x['market'] == 'spread': toward = d_ < 0
        else: toward = (d_ > 0) == (x['side'] == 'Over')
        return base + f" — now {l1:+g}, moved {abs(d_):g} {'toward' if toward else 'away from'} this side"
    def sig_short(gid): return ', '.join(f"💰 {sig_label(x)}" for x in SIG.get(gid, []))
    SIG_ALL = [f"{sig_label(x)} ({gid})" for gid, ss in SIG.items() for x in ss]
    # ======================================================================
    # Reader-facing layout (v3, 2026-09-26): recommendations up top, ranked
    # and filterable boards, lay-language definitions, linked dossiers.
    # ======================================================================
    FS = final_scores(W)
    done = [g for g in sched if g['done']]
    def gsid(gid): return 'game-' + gid.lower().replace('@', '-')
    def slug(s): return re.sub(r'[^a-z0-9]+', '-', str(s).lower()).strip('-')
    def glink(gid, text=None): return f'[{text or matchup(gid, False)}](#{gsid(gid)})' if gid in ids else (text or gid or '—')
    def proj_txt(gid):
        pj = (NAR.get(gid) or {}).get('proj')
        return f'{pj[0][0]} {pj[0][1]} – {pj[1][0]} {pj[1][1]}' if pj else ''

    # ---- card tickets + legs (only the newest rebuild block if the card has one) ----
    card_cur = card
    sup = [m.start() for m in re.finditer(r'^#+ .*supersedes', card, re.M)]
    if sup: card_cur = card[sup[-1]:]
    TK = []
    for blk in re.split(r'^### ', card_cur, flags=re.M)[1:]:
        head = blk.split('\n', 1)[0]
        m = re.match(r'(.+?) — (.+?) — \*\*\$([\d.]+)\*\* — (.+?) — (.+)$', head)
        if not m: continue
        body_ = blk.split('\n## ')[0]
        rows_ = [l for l in body_.split('\n') if l.startswith('|')]
        legs = []
        if rows_:
            hdr = [c.strip().lower() for c in rows_[0].strip('|').split('|')]
            for l in rows_[1:]:
                if re.match(r'^\|[\s:|-]+\|$', l): continue
                c = [x.strip() for x in l.strip('|').split('|')]
                d_ = dict(zip(hdr, c))
                legs.append(dict(game=d_.get('game', ''), market=d_.get('market & line', ''), book=d_.get('book', ''), price=d_.get('price', ''), tier=d_.get('tier', ''), why=d_.get('why', '')))
        flags = re.search(r'^Flags:.*$', body_, re.M)
        _px = lambda z: re.sub(r'\s*\bnaive\b', ' (est.)', z.strip())
        TK.append(dict(name=m.group(1).strip(), disp=ticket_display(m.group(1)), book=m.group(2).strip(), stake=m.group(3), price=_px(m.group(4)), ret=_px(m.group(5)), legs=legs,
                       flags=flags.group(0) if flags else '', id='ticket-' + slug(m.group(1))))
    sc_line = re.search(r'^## SuperContest[^\n]*\n([^\n]+)', card_cur, re.M)
    left_off = re.search(r'^## Left off and why\n(.*?)(?=^## |\Z)', card_cur, re.M | re.S)

    PROPWORDS = r'(\brec\b|\brush\b|pass TD|pass yds|\bTD\b|\bATD\b|T\+A|tackles|receptions|rec yds|completions|attempts|interceptions)'
    def is_prop_text(t): return bool(re.search(PROPWORDS, t, re.I)) and not re.search(r'\bML\b', t)
    def prop_kind(t):
        s_ = t.lower().replace('touchdowns', 'td').replace('touchdown', 'td').replace('passing td', 'pass td')
        if '1st td' in s_ or 'first td' in s_: return 'First TD'
        if re.search(r'2\+ td', s_) and 'pass' not in s_: return '2+ TDs'
        if 'pass td' in s_ or 'passing td' in s_: return 'Passing'
        if 'atd' in s_ or 'anytime' in s_ or re.search(r'\btd\b', s_): return 'Anytime TD'
        if 't+a' in s_ or 'tackle' in s_: return 'Tackles+Assists'
        if 'rush' in s_: return 'Rushing'
        if 'rec' in s_ or 'receiving' in s_ or 'recept' in s_: return 'Receiving'
        if 'pass' in s_ or 'completion' in s_ or 'attempt' in s_ or 'interception' in s_: return 'Passing'
        return 'Other'
    def ticket_is_props(t): return t['legs'] and sum(is_prop_text(l['market']) for l in t['legs']) * 2 > len(t['legs'])

    # ---- leans: game, type, confidence ----
    def lean_gid(x):
        g0 = x['game'].split(' ')[0]
        if g0 in ids: return g0
        nm = re.split(r'\s+[+-]?\d', x['market'])[0].strip()
        last = nm.split()[-1].lower() if nm else ''
        for t in TK:
            for lg in t['legs']:
                if last and len(last) > 2 and last in lg['market'].lower() and lg['game'] in ids: return lg['game']
        return None
    def lean_type(x):
        if x['game'].startswith(('T+A', 'Pass TD')) or is_prop_text(x['market']): return 'Prop'
        if x['lean'] in ('Over', 'Under') or re.match(r'^[UO]\d', x['market']): return 'Total'
        return 'Side'
    TIERBASE = [('1+2', 3.5), ('1-', 2.0), ('2-', 2.0), ('1', 3.0), ('2', 2.5)]
    def conf(x):
        t = x['tier'].lower()
        if 'skip' in t or x['lean'].lower() in ('skip', 'split', '—', ''): return None, []
        v = next((val for k, val in TIERBASE if t.startswith(k)), 2.0)
        tw = ('our matchup numbers and 2+ experts agree' if t.startswith('1+2') else 'partial matchup support' if t.startswith('1-') else
              'partial expert support' if t.startswith('2-') else 'our matchup numbers back it' if t.startswith('1') else '2+ experts picked it')
        why = [tw]
        gid = lean_gid(x); typ = lean_type(x)
        if gid and typ == 'Side' and '@' in gid:
            A_, H_ = gid.split('@'); me = x['lean']; opp = H_ if me == A_ else A_
            c_ = CONS.get(gid, {}); n1, n2 = len(c_.get(me, ())), len(c_.get(opp, ()))
            if n1 >= 4 and n1 >= 2 * max(n2, 1): v += 0.5; why.append(f'experts {n1}–{n2} in favor')
            elif n2 > n1: v -= 0.5; why.append(f'more experts on the other side ({n2}–{n1})')
            if f'{me} spread' in sharp: v += 0.5; why.append('big money agrees')
            elif f'{opp} spread' in sharp: v -= 0.5; why.append('big money disagrees')
        if gid and typ == 'Total':
            other = 'Under' if x['lean'] == 'Over' else 'Over'
            if f'{gid} {x["lean"]}' in sharp: v += 0.5; why.append('big money agrees')
            elif f'{gid} {other}' in sharp: v -= 0.5; why.append('big money disagrees')
        if 'flag' in t: v -= 0.5; why.append('open injury/lineup question — check before placing')
        return max(0.5, min(5.0, v)), why
    def stars(v): n = int(v + 0.5); return f"{v:.1f} " + '★' * n + '☆' * (5 - n)
    RANKED = []
    for x in LEANS:
        v, why = conf(x)
        if v is None: continue
        RANKED.append(dict(x, gid=lean_gid(x), type=lean_type(x), conf=v, conf_why=why))
    RANKED.sort(key=lambda r: -r['conf'])

    # ---- expert registry anchors (used by §4 and §7 citations) ----
    def yt_kind(p):
        t = p['pick']
        if (p.get('raw') or {}).get('player') or is_prop_text(t): return 'Prop'
        if re.search(r'\b(Under|Over)\b', t): return 'Total'
        return 'Side'
    def exp_kind(r):
        pt = r.get('pick_type')
        return 'Prop' if pt == 'player_prop' else ('Total' if pt == 'total' else 'Side')
    EXPANCH = collections.defaultdict(dict)
    for g in live:
        for r in EXP.get(g['id'], []):
            EXPANCH[g['id']].setdefault(r.get('expert') or '?', f"exp-{slug(g['id'])}-{slug(r.get('expert'))}")
        for p in YT.get(g['id'], []):
            EXPANCH[g['id']].setdefault(p['speaker'], f"exp-{slug(g['id'])}-{slug(p['speaker'])}")
    ALIAS_EXP = {'Fezzik': 'Even Money', 'Ross': 'Even Money', 'Erickson': 'BettingPros', 'Wormley': 'BettingPros'}
    ABBR = [(r'\bAN\b', 'Action Network'), (r'\bSoS\b', 'Sharp or Square'), (r'\bBP\b', 'BettingPros'), (r'\bEM\b', 'Even Money'),
            (r'\b([A-Z]{2,3}) O vs ([A-Z]{2,3}) D\b', r'\1 passing offense vs \2 defense'), (r'\bmed\b', 'medium'),
            (r'\bsecondary (HIGH|MEDIUM|medium)', r'secondary matchup \1'), (r'\bFavorites\b', 'The Favorites')]
    def link_sources(text, gid):
        """Spell out source abbreviations and link each named source to its pick in the §4 expert registry."""
        t_ = esc(text)
        for pat_, rep_ in ABBR: t_ = re.sub(pat_, rep_, t_)
        t_ = t_.replace('The The Favorites', 'The Favorites')
        anch = dict(EXPANCH.get(gid, {}))
        for al, tgt in ALIAS_EXP.items():
            if tgt in anch: anch.setdefault(al, anch[tgt])
        done_ = set()
        for name in sorted(anch, key=len, reverse=True):
            if anch[name] in done_: continue
            pat_ = r'(?<![\w>#-])' + re.escape(name) + r'(?![\w<])'
            if re.search(pat_, t_):
                t_ = re.sub(pat_, f'<a href="#{anch[name]}">{name}</a>', t_, count=1); done_.add(anch[name])
        return t_

    # ---- actionable props pool ----
    POOL = collections.defaultdict(list); seenp = set()
    def pool_add(gid, text, price, book, tier, why, src):
        if gid not in ids: return
        nm = re.split(r'\s+(?:[+-]?\d|OVER|UNDER|over|under|o\d|u\d)', text)[0].split()
        num = re.search(r'\d+(?:\.\d)?', text)
        k = (gid, (nm[1] if len(nm) > 1 else (nm[0] if nm else '')).lower(), num.group(0) if num else '', prop_kind(text))
        if k in seenp: return
        seenp.add(k); POOL[gid].append(dict(kind=prop_kind(text), text=text, price=price, book=book, tier=tier, why=why, src=src))
    for t in TK:
        for lg in t['legs']:
            if is_prop_text(lg['market']): pool_add(lg['game'], lg['market'], lg['price'], lg['book'], lg['tier'], lg['why'], f"card: {t['disp']}")
    for x in RANKED:
        if x['type'] == 'Prop' and x['gid'] and not x['game'].startswith('Pass TD'):
            pool_add(x['gid'], x['market'] + (' T+A' if x['game'].startswith('T+A') else ''), '', 'BKR/BEO', x['tier'], x['source'], 'card lean')
    ptd_all = [r for r in bkr['rows'] if r['market'] == 'pass_td' and r.get('threshold') == 2 and r['available']]
    for x in RANKED:
        if x['game'].startswith('Pass TD'):
            for r in ptd_all:
                if r['player'].split()[-1] in x['market']:
                    aw, hm = [FULL.get(z.strip()) for z in r['event'].split(' @ ')]
                    pool_add(f'{aw}@{hm}', f"{r['player']} 2+ pass TD", f"{r['odds']:+d}", 'BKR', x['tier'], x['source'], 'card lean')
    for g in live:
        for r in EXP.get(g['id'], []):
            if r.get('pick_type') == 'player_prop':
                pool_add(g['id'], f"{r.get('selection')} {r.get('line') or ''}".strip(), '', '—', 'expert', esc(r.get('rationale'))[:140], r.get('expert'))
        for p in YT.get(g['id'], []):
            if yt_kind(p) == 'Prop':
                pool_add(g['id'], p['pick'], str(p.get('price') or ''), '—', 'expert', ('⚠ ' + p['verify']) if p.get('verify') else f"{p['show'].split(' — ')[0]}", p['speaker'])
    ppi = J('data/research-intel/review/player-props-intel-latest.json', {}) or {}
    pl = ppi.get('props') or ppi.get('rows') or []
    live_games = {f"{g['visitor']} @ {g['home']}": g['id'] for g in live}
    t1 = [p for p in pl if str(p.get('tier', '')).lower().startswith(('tier 1', '1', 'tier_1')) and p.get('game') in live_games]
    for p in t1:
        pool_add(live_games[p['game']], f"{p.get('player')} {p.get('side') or ''} {p.get('line') or ''} {p.get('category_label') or p.get('category') or ''}".strip(), str(p.get('price') or p.get('odds') or ''), 'DK/FD (article)', 'article tier 1',
                 esc(p.get('rationale') or '')[:110] + (f" [source]({p['source_url']})" if p.get('source_url') else ''), p.get('analyst') or 'article')

    L = []
    asof = bkr['rows'][0].get('capturedAt', '')[:16]
    RE = ['', '</div>', '</details>']  # rollup end without back-link
    L += [logo_css(), f'# 🏈 NFL Week {W} Master Betting Intelligence Report',
          '## Multi-Platform Consensus, Market-Implied Board & Game-by-Game Analytical Dossier',
          f'### Built {datetime.datetime.now(PT).strftime("%a %b %d %Y %H:%M PT")} — prices are Bookmaker (BKR) {D} capture ({asof}Z); verify every slip',
          '', '<em>Proposals and research context only. Nothing here is placed. Sportsbook prices ≠ prediction-market percentages; never mix them without a fee/spread check.</em>', '']
    L += roll('section-top', 'inputs-box', '🧾 Data inputs &amp; freshness — what this report was built from') + [
          '| Input | Status |', '|---|---|',
          f"| Bookmaker (BKR) same-game props + game lines | {len(G)} games, {len(bkr['rows'])} lines |",
          f"| BetOnline (BEO) prop boards | {len({r['game'] for r in beo})} games |",
          f"| DraftKings Predictions saves | {len(dk)} games |",
          f"| Research signals / articles / expert picks | {len(pull['signals'])} / {len(pull['notes'])} / {len(pull['expert'])} (since {pull['window_start'][:10]}) |",
          f"| Podcast transcripts processed | {pull.get('podcast_transcripts_processed')} |",
          f"| YouTube picks (cleaned) | {len(yt.get('picks', []))} |",
          f"| Betting splits (Action Network) | {len(SPL)} games |"] + RE
    qb_notes = []
    for g in live:
        for t in (g['visitor'], g['home']):
            for n, e in INJ.get(t, {}).items():
                if e.get('position') == 'QB' and str(e.get('normalized_status', '')).upper().startswith(('OUT', 'DOUBTFUL')): qb_notes.append(f'{t} {n} {e["normalized_status"].title()}')
    pulled_all = []
    for gid_, b_ in G.items():
        prow = [r for r in b_['rows'] if r.get('player')]
        pp = sorted({r['player'] for r in prow if not r['available']})
        if prow and len([r for r in prow if not r['available']]) >= 0.8 * len(prow):
            pulled_all.append(f"{gid_}: <em>no player props priced at capture ({len(pp)} players listed, all without odds) — the whole menu is off, not an injury signal</em>")
        elif pp: pulled_all.append(f"{gid_}: {', '.join(pp)}")
    results = []
    for g in done:
        f_ = FS.get(g['id'])
        results.append(f"<strong>{g['id']}</strong> 🏁 FINAL — {f_['away'][0]} {f_['away'][1]}, {f_['home'][0]} {f_['home'][1]}" if f_ else f"<strong>{g['id']}</strong> 🏁 FINAL")
    L += roll('section-top', 'slate-status-box', f'🚨 Slate Status — {datetime.datetime.now(PT).strftime("%a %b %d, %H:%M PT")}', True) + [
          '<div style="font-size: 0.9rem; margin-bottom: 10px;"><strong>What is the Slate Status?</strong> A quick snapshot of the news that changes how to read this report: games already played, quarterback changes, where the big-money bettors are putting their money, and players the sportsbook has taken off its menu (usually an injury or lineup question). Check it before placing anything.</div>',
          '<div class="status-banner" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-left: 5px solid #3B82F6; padding: 14px 18px; border-radius: 8px; color: #F8FAFC; font-size: 0.92rem; line-height: 1.55;">',
          f"<div>• <strong>Played:</strong> {'; '.join(results) or 'none yet'}. <strong>{len(live)} games remain.</strong></div>",
          f"<div>• <strong>Quarterback changes (out or doubtful):</strong> {', '.join(qb_notes) or 'none'}.</div>",
          f"<div>• <strong>Big-money (\"sharp\") signals</strong> — share of money beats share of bets by 15+ points, at the line when first seen: {', '.join(SIG_ALL) or ('none' if SPL else 'not available yet — no Action Network splits this week')}. Full detail in §2.</div>",
          f"<div>• <strong>Pulled from the Bookmaker menu (listed without odds — check status):</strong> {'; '.join(pulled_all) or 'none'}.</div>",
          '<div>• <strong>Known data gaps:</strong> __GAPS__ — details in §11.</div>',
          '<div>• <strong>How to use this page:</strong> 💡 hover or tap an underlined column header for its definition; click a header to sort; use the buttons on each section to open or close it.</div>',
          '</div>'] + RE

    # ---------------- ⭐ Recommendations ----------------
    kick = {g['id']: g['k'] for g in live}
    def tnote(t):
        for k_, v_ in TNOTE.items():
            if t['name'].startswith(k_) or k_.startswith(t['name']): return v_
        return ''
    def gwhy(gid, key='Why the card leans this way'):
        return ' '.join(dict((NAR.get(gid) or {}).get('secs', [])).get(key, '').split())
    def mid_words(team, ln_):
        pts = list(range(1, int(-(-ln_ // 1))))
        pts = [x for x in pts if x < ln_]
        txt = f"{team} wins by " + (' or '.join(str(x) for x in pts) if len(pts) <= 2 else f"1 to {pts[-1]}") + (' point' if pts == [1] else ' points')
        return txt + (f"; by exactly {ln_:g} the hedge is refunded" if float(ln_).is_integer() else '')
    def night_cap(t):
        """A straight parlay whose last leg is a moneyline in the latest (night) game on the ticket: the hedge anchor."""
        if 'round robin' in t['disp'].lower() or len(t['legs']) < 2: return None
        gl = [lg for lg in t['legs'] if lg['game'] in kick]
        if len({lg['game'] for lg in gl}) < 2: return None
        last = max(gl, key=lambda lg: kick[lg['game']])
        if kick[last['game']].astimezone(PT).hour < 17 or not re.search(r'\bML\b', last['market']): return None
        team = last['market'].split()[0]; A_, H_ = last['game'].split('@'); opp = H_ if team == A_ else A_
        b_ = G.get(last['game']) or {}
        pm = re.search(r'([+-]\d+)', t['price'])
        if not pm or opp not in b_.get('ml', {}): return None
        R = float(t['stake']) * dec(int(pm.group(1))); st = float(t['stake'])
        opts = []
        d_ml = dec(b_['ml'][opp]); H1 = R / d_ml
        opts.append(dict(label=f"{tl(opp)}{opp} moneyline {b_['ml'][opp]:+d}", H=H1, lock=R - st - H1, middle=None))
        if opp in b_.get('sp', {}):
            ln_, pr_ = b_['sp'][opp]
            if ln_ > 0:
                d_sp = dec(pr_); H2 = R / d_sp
                opts.append(dict(label=f"{tl(opp)}{opp} {ln_:+g} ({pr_:+d})", H=H2, lock=R - st - H2, middle=R - st + H2 * (d_sp - 1), mid_txt=mid_words(team, ln_)))
        return dict(team=team, opp=opp, game=last['game'], when=kick[last['game']].astimezone(PT).strftime('%a %H:%M PT'), R=R, stake=st, opts=opts)
    def ticket_box(t, cls):
        out = roll(cls, t['id'], f"🎟️ {esc(t['disp'])} — {esc(t['book'])} — ${t['stake']} — {esc(t['price'])}")
        note = tnote(t)
        if note: out += [f"💬 **What it is and why:** {esc(note)}", '']
        out += [f"**Payout:** {esc(t['ret'])}", '', '| Game | Leg | Book | Price | Tier | Why |', '|---|---|---|---|---|---|'] + [
                f"| {glink(lg['game'])} | {esc(lg['market'])} | {esc(lg['book'])} | {esc(lg['price'])} | {esc(lg['tier'])} | {link_sources(lg['why'], lg['game'])} |" for lg in t['legs']]
        nc = night_cap(t)
        if nc:
            out += ['', f"🛡️ **The night-game hedge.** The {tl(nc['team'])}{nc['team']} moneyline ({nc['when']}) is a placeholder, not a pick we need to win. If every other leg hits, this ticket is worth **${nc['R']:.2f}** going into the night game, and you can bet the other side ({nc['opp']}) to lock in a profit no matter who wins. [How the night-game hedge works](#night-cap-howto).", '',
                    '| Hedge bet (prices at build time) | Stake to lock profit | Profit locked either way | If it lands in the middle |', '|---|---|---|---|'] + [
                    f"| {o['label']} | ${o['H']:.2f} | **${o['lock']:.2f}** | " + (f"both tickets win: **${o['middle']:.2f}** ({o['mid_txt']})" if o['middle'] else '—') + ' |' for o in nc['opts']] + [
                    '', '<em>Recalculate with live prices before hedging: the numbers above use this build\'s lines. You can also hedge a smaller amount and keep some upside.</em>']
        out += RE
        return out
    def fbar(col, opts, scope='', sort_scope=''):
        out = [f'<div class="table-filter rollup-controls" data-col="{col}"' + (f' data-scope="{scope}"' if scope else '') + '>',
               '  <button class="btn-toggle btn-primary" data-filter="all">All</button>'] + [f'  <button class="btn-toggle" data-filter="{o}">{o}</button>' for o in opts]
        if sort_scope:
            out += [f'  <span class="bar-hint" style="margin-left: 12px;">Sort:</span>',
                    f'  <button class="btn-toggle group-sort btn-primary" data-scope="{sort_scope}" data-key="conf">Strongest first</button>',
                    f'  <button class="btn-toggle group-sort" data-scope="{sort_scope}" data-key="kick">Kickoff</button>',
                    f'  <button class="btn-toggle group-sort" data-scope="{sort_scope}" data-key="game">A–Z</button>']
        return out + ['</div>', '']
    L += ['', '<a id="recommendations"></a>', '## ⭐ Platinum Rose Recommendations: What to Bet This Week', '',
          'Everything Platinum Rose recommends this week, in one place. Prices are Bookmaker (BKR) or BetOnline (BEO) at capture time: **check the price on your slip before placing**. More stars = more evidence behind the bet ([how stars work](#confidence-defs)).', '']
    straight = [r for r in RANKED if r['type'] in ('Side', 'Total')]
    bygame = collections.OrderedDict()
    for r in straight: bygame.setdefault(r['gid'], []).append(r)
    L += roll('section-rec', 'rec-straight', f'✅ Straight bets: sides &amp; totals — {len(straight)} picks in {len(bygame)} games') + [
          'Grouped by game. Filter to only sides or only totals, and sort by strength, kickoff or name. Open a game for our projected score and the reasoning.', '']
    L += fbar('Type', ['Side', 'Total'], 'rec-games', 'rec-games') + ['<div id="rec-games">']
    for gid, rs in bygame.items():
        best = max(r['conf'] for r in rs); k_ = kick.get(gid)
        head = f"{matchup(gid)} — " + ' · '.join(f"{esc(r['market'])} ({r['conf']:.1f}★)" for r in rs) + (f" — {k_.astimezone(PT):%a %H:%M PT}" if k_ else '')
        L += [f'<details class="rollup-box section-rec filter-group sort-group" id="rec-{slug(gid)}" data-conf="{best:.2f}" data-kick="{k_.isoformat() if k_ else ""}" data-game="{gid}">', f'<summary>🏈 {head}</summary>', '<div class="rollup-content">', '',
              '| Type | Pick | Lean | Confidence | Why |', '|---|---|---|---|---|'] + [
              f"| {r['type']} | **{esc(r['market'])}** | {esc(r['lean'])} | {stars(r['conf'])} | {link_sources(r['source'], gid)} <em>({esc('; '.join(r['conf_why']))})</em> |" for r in rs]
        if proj_txt(gid): L += ['', f"🎯 **Our projected score:** {proj_txt(gid)}"]
        if gwhy(gid): L += ['', f"🧠 **Why:** {esc(gwhy(gid))}"]
        L += ['', f"[Full game write-up →](#{gsid(gid)}) · [all expert picks →](#experts-{slug(gid)})"] + RE
    L += ['</div>'] + RE
    parl = [t for t in TK if not ticket_is_props(t)]; stacks = [t for t in TK if ticket_is_props(t)]
    L += roll('section-rec', 'rec-parlays', f'🎟️ Parlays &amp; round robins — {len(parl)} tickets') + [
          'Each ticket opens to show what it is, why it\'s on the card, and every leg.', '', '💡 **"(est.)" price:** each leg\'s odds multiplied together, the standard way to estimate what a parlay pays. The book\'s actual payout can differ a little, and same-game parlays (several legs from one game) pay noticeably less because the legs are related. Check the payout on your slip.', '',
          '<div class="rollup-controls">', "  <button class=\"btn-toggle btn-primary\" onclick=\"toggleRollups('section-tickets', true)\">Open all tickets</button>",
          "  <button class=\"btn-toggle\" onclick=\"toggleRollups('section-tickets', false)\">Close all tickets</button>", '</div>', '']
    if any(night_cap(t) for t in TK):
        L += ['<a id="night-cap-howto"></a>'] + roll('section-tickets', 'night-cap-explainer', '🛡️ How the night-game hedge works (read this first)') + [
              '- **Why the last leg is a night game.** These parlays end with the moneyline favorite in the Sunday-night (or Monday-night) game. That leg is a **placeholder**: it keeps the ticket alive until night so that, if the morning and afternoon legs all win, you still have a decision to make.',
              '- **Locking in a profit.** Once only the night leg is left, bet the **underdog** in that same game. Size the bet so you come out ahead whichever team wins: if the favorite wins, the parlay pays; if the underdog wins, the hedge pays. Each ticket below shows the stake and the profit it locks at today\'s prices.',
              '- **Finding a middle.** Instead of the underdog moneyline, you can hedge with the underdog **plus the points**. If the favorite wins but by less than the spread, **both** bets win. Middles are uncommon, but they are the best outcome on these tickets. If the underdog wins outright, the hedge still covers you.',
              '- **What it costs.** The hedge is a bigger second bet, often ten times the parlay stake, and prices will have moved by the night game, so recalculate first. Hedging part of the way is fine if you want to keep some upside.',
              '- **The formula.** Hedge stake = what the parlay pays back (stake included) ÷ the hedge bet\'s decimal odds. Profit locked = parlay payback − parlay stake − hedge stake.'] + RE
    for t in parl: L += ticket_box(t, 'section-tickets')
    L += RE
    L += roll('section-rec', 'rec-props', f'🧾 Player prop stacks — {len(stacks)} tickets')
    for t in stacks: L += ticket_box(t, 'section-tickets')
    L += ['', f'**Build your own:** every actionable prop on the card and from the experts is in the [props pool](#prop-pool), grouped by game and filterable by prop type.'] + RE
    if sc_line:
        picks = re.findall(r'\b([A-Z]{2,3}) ([+−-]\s?[\d.]+)', sc_line.group(1).split('(alt')[0])
        alt = re.search(r'\(alt: ([A-Z]{2,3}) ([+−-][\d.]+)\)', sc_line.group(1))
        L += roll('section-rec', 'rec-supercontest', f'🏆 SuperContest 5 — {" · ".join(t_ + " " + l_ for t_, l_ in picks)}') + [
              'Five picks against the contest\'s locked spreads (only covering the spread counts).' + (f' Alternate if a pick is unavailable: **{alt.group(1)} {alt.group(2)}**.' if alt else ''), '',
              '| Pick | Game | Contest line | Our projection | Why |', '|---|---|---|---|---|']
        for t_, l_ in picks:
            gid = next((g['id'] for g in live if t_ in (g['visitor'], g['home'])), None)
            w_ = SCNOTE.get(t_) or ((gwhy(gid).split('. ')[0] + '.') if gid and gwhy(gid) else '')
            L.append(f"| **{t_}** | {glink(gid) if gid else '—'} | {t_} {l_} | {proj_txt(gid) if gid else ''} | {esc(w_)} |")
        L += RE
    if left_off:
        def linkify_pass(ln):
            for t_ in TK:
                mm = re.match(r'^(\d+[a-z])\s', t_['name'])
                if mm: ln = re.sub(r'\b' + mm.group(1) + r'\b', t_['disp'], ln)
            ln = re.sub(r'\b7c SNF DK combos\b', 'Sunday-night DraftKings combos', ln)
            ln = re.sub(r'\b8a/8b\b', 'the First TD and 2+ TD tickets', ln)
            ln = re.sub(r'^(-\s*)Rule \d+:\s*', r'\1House rule: ', ln)
            ln = re.sub(r'\bdog RR\b', 'underdog round robin', ln)
            ln = re.sub(r'\s*\(rule \d+(?::[^)]*)?\)', ' (house rule)', ln, flags=re.I)
            ln = re.sub(r'\brule (\d+)\b', 'our house rule', ln, flags=re.I)
            gids = []
            for m_ in re.finditer(r'\b([A-Z]{2,3})\s*[@/]\s*([A-Z]{2,3})\b', ln):
                gg = f'{m_.group(1)}@{m_.group(2)}'
                if gg in ids: gids.append(gg)
            if not gids and re.search(r'\bSNF\b', ln):
                sun = [g for g in live if g['k'].astimezone(PT).strftime('%a') == 'Sun']
                if sun: gids.append(max(sun, key=lambda g: g['k'])['id'])
            if not gids and re.search(r'\bMNF\b', ln):
                mon = [g for g in live if g['k'].astimezone(PT).strftime('%a') == 'Mon']
                if mon: gids.append(mon[0]['id'])
            if not gids:
                for nm in re.findall(r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b', ln):
                    gg = next((g_ for g_, ps in POOL.items() if any(nm in p['text'] for p in ps)), None)
                    if gg: gids.append(gg); break
            if not gids:
                for tok in re.findall(r'\b([A-Z]{2,3})\b', ln):
                    gg = next((g['id'] for g in live if tok in (g['visitor'], g['home'])), None)
                    if gg and gg not in gids: gids.append(gg); break
            return ln + (' → ' + ' · '.join(f'[{g_} write-up](#{gsid(g_)})' for g_ in gids) if gids else '')
        L += roll('section-rec', 'rec-passes', '🚫 Games and bets we are passing on, and why') + [linkify_pass(ln) for ln in left_off.group(1).strip().splitlines() if ln.strip()] + RE

    # ---------------- 📌 Executive summary ----------------
    L += ['', '<a id="executive-summary"></a>', '## 📌 Executive Summary', '']
    tops = [r for r in RANKED if r['tier'].startswith('1')][:6]
    if tops:
        L += ['**Top matchup-data reads**', '',
              '- **What these are:** bets where our own matchup data — not just opinions — points the same way. Either a passing offense faces a secondary our model grades as a HIGH or MEDIUM mismatch, or a player\'s role is verified from the first two weeks (tackles, carries, targets). "Tier 1+2" means named experts independently agree.',
              '- **How to use them:** these are the strongest reads on the slate. Each links to its full game breakdown, with the projected score and what could go wrong.', '', '**This week\'s top reads:**', '']
        for r in tops:
            L.append(f"- **{esc(r['market'])}** → {esc(r['lean'])} · {r['type']} · {glink(r['gid'], (r['gid'] or '') + ' breakdown') if r['gid'] else ''} · confidence {stars(r['conf'])}")
        L.append('')
    one_sided, clashes = [], []
    for g in live:
        c_ = CONS.get(g['id'], {}); A_, H_ = g['visitor'], g['home']; na, nh = len(c_.get(A_, ())), len(c_.get(H_, ()))
        if max(na, nh) >= 4 and min(na, nh) <= 1: one_sided.append(f"{A_ if na > nh else H_} ({max(na, nh)}–{min(na, nh)}, {glink(g['id'])})")
        if na >= 3 and nh >= 3: clashes.append(f"{glink(g['id'])} ({na}–{nh})")
    L += [f"- **Most one-sided expert consensus:** {', '.join(one_sided) or 'none'} — ranked in [§3](#section-3-box).",
          f"- **Biggest expert clashes (3+ sources each side):** {', '.join(clashes) or 'none'}.",
          f"- **Big-money signals:** {', '.join(SIG_ALL) or 'none'} — [details and line moves](#synth-engine-section).",
          f"- **Quarterback watch:** {', '.join(qb_notes) or 'none'}.",
          f"- **Card:** {len(TK)} tickets, ${sum(float(t['stake']) for t in TK):.0f} total as built — see [card tickets](#card-tickets)." if TK else '- **Card:** no tickets found.', '']

    # ---------------- 1. Executive master board ----------------
    L += ['', '<a id="executive-master-board"></a>', '## 1. Executive Master Board: Best Bets, Props, Tickets & Teasers', '',
          'Every lean on the card in one table, ranked by confidence. Use the buttons to show only **sides**, **totals** or **player props**; click a column header to re-sort; click a game to jump to its full breakdown.', '']
    L += fbar('Type', ['Side', 'Total', 'Prop']) + ['| Rank | Type | Game | Pick | Lean | Confidence | Tier | Evidence |', '|---|---|---|---|---|---|---|---|']
    for i, r in enumerate(RANKED):
        L.append(f"| {i+1} | {r['type']} | {glink(r['gid']) if r['gid'] else esc(r['game'])} | {esc(r['market'])} | {esc(r['lean'])} | {stars(r['conf'])} | {esc(r['tier'])} | {link_sources(r['source'], r['gid'])} |")
    L += ['', '<a id="card-tickets"></a>', '### 🎟️ Card tickets', '', 'All tickets, with what each one is, why it is on the card and every leg, are in the [Parlays &amp; round robins](#rec-parlays) and [Player prop stacks](#rec-props) boxes at the top of the report.', '']
    kinds = ['Tackles+Assists', 'Rushing', 'Receiving', 'Passing', 'Anytime TD', 'First TD', '2+ TDs']
    pool_games = [g for g in live if POOL.get(g['id'])]
    L += ['', '<a id="prop-pool"></a>', '### 🧰 Build your own: actionable props pool', '',
          'Every player prop that is on the card, in a card lean, called by a named expert, or rated tier 1 by the article feed, grouped by game so you can build your own stacks. **"Card"** rows passed our build rules; **"expert"** rows are calls we have not checked ourselves.', '',
          '**Jump to a game:** ' + ' · '.join(f"[{g['id']} ({len(POOL[g['id']])})](#props-{slug(g['id'])})" for g in pool_games), '']
    L += fbar('Type', kinds, 'prop-pool-tables') + [
          '<div class="rollup-controls">', "  <button class=\"btn-toggle\" onclick=\"toggleRollups('section-pool', true)\">Open all games</button>",
          "  <button class=\"btn-toggle\" onclick=\"toggleRollups('section-pool', false)\">Close all games</button>", '</div>', '', '<div id="prop-pool-tables">']
    for g in pool_games:
        rows_ = sorted(POOL[g['id']], key=lambda p: (kinds.index(p['kind']) if p['kind'] in kinds else 99))
        L += [f'<details class="rollup-box section-pool filter-group" id="props-{slug(g["id"])}">',
              f"<summary>🧾 {matchup(g['id'])} — {len(rows_)} props · {g['k'].astimezone(PT):%a %H:%M PT}</summary>", '<div class="rollup-content">', '',
              '| Type | Prop | Price | Book | Tier / source | Why |', '|---|---|---|---|---|---|'] + [
              f"| {p['kind']} | {esc(p['text'])} | {esc(p['price'])} | {esc(p['book'])} | {esc(p['tier'])} ({esc(p['src'])[:40]}) | {p['why'] if '](' in p['why'] else esc(p['why'])[:140]} |" for p in rows_] + [
              '', f"[Full game write-up →](#{gsid(g['id'])})", '</div>', '</details>']
    L += ['</div>', '', '---']

    # ---------------- 2. Market board ----------------
    def bar(x):
        x = max(0, min(100, int(x or 0)))
        return f'<span style="display:inline-block;width:64px;height:8px;border-radius:4px;vertical-align:middle;margin-right:6px;background:linear-gradient(90deg,var(--primary) 0 {x}%,var(--border) {x}% 100%);"></span>{x}%'
    L += ['', '<a id="synth-engine-section"></a>', '## 2. Platinum Rose Market-Implied Forecast Board', ''] + controls('section-board', 'Market Board') + [
          '**What the betting lines are predicting.** Every point spread and total is really a forecast. Put the two together and you get the final score the sportsbook expects; the moneylines give each team\'s chance of winning. Next to that is **our own projected score** (from the game write-ups in [§7](#section-7-box)) and **where the bets and the money are landing**, on both sides of every market.', '']
    L += roll('section-synth', 'board-defs', '📖 What each column means (plain English)') + [
          '- **Favorite & spread:** the team expected to win and by how many points. "BUF −7" means Buffalo has to win by 8 or more for a Buffalo spread bet to cash.',
          '- **Total points:** the combined score the sportsbook set as its over/under line.',
          '- **Score the lines imply:** the final score the spread and total point to together. Example: total 50.5 and BUF −7 → Buffalo about 28.8, Chargers about 21.8.',
          '- **Our projection:** Platinum Rose\'s own projected final: the line, adjusted for injuries, matchups, expert opinion and money moves. Not a computer-model output.',
          '- **Win chance:** each moneyline turned into a win probability, with the sportsbook\'s built-in cut removed so the two sides add up to 100%.',
          '- **Spread / Total (bets / money):** for each side, the share of bets placed and the share of dollars wagered. Example: "O 25/51 · U 75/49" means only 25% of bets are on the Over but they carry 51% of the money.',
          '- **💰 Big-money signal:** a side where the money share beats the bet share by 15+ points — fewer, bigger bets, usually experienced ("sharp") bettors. We record **the exact line when the signal first appears**, so later builds show whether the line has moved toward or away from that side since.'] + RE
    L += roll('section-synth', 'platinum-rose-board', '📊 All games at a glance') + [
          '| Kickoff (PT) | Game | Favorite & spread | Total points | Score the lines imply | Our projection | Win chance (no-vig) | Spread: bets / money | Total: bets / money | Big-money signal |', '|---|---|---|---|---|---|---|---|---|---|']
    for g in live:
        gid = g['id']; b = G.get(gid); A_, H_ = g['visitor'], g['home']
        if not b: L.append(f"| {g['k'].astimezone(PT):%a %H:%M} | {glink(gid)} | not on BKR capture | | | | | | | |"); continue
        f, s_ = fav(gid); t = (b['tot'].get('Over') or (None,))[0]
        imps = ''
        if f is not None and t is not None:
            dog = b['home'] if f == b['away'] else b['away']; fs = t / 2 - s_ / 2; imps = f'{f} {fs:.1f} – {dog} {t - fs:.1f}'
        nv = novig(gid); wp = ' / '.join(f'{k} {v*100:.0f}%' for k, v in sorted(nv.items(), key=lambda x: -x[1]))
        sp = SPL.get(gid) or SPL.get(gid.replace('WAS', 'WSH'))
        spc = f"{A_} {100 - sp['spread_home_bettors']}/{100 - sp['spread_home_money']}<br>{H_} {sp['spread_home_bettors']}/{sp['spread_home_money']}" if sp else ''
        toc_ = f"O {sp['total_over_bettors']}/{sp['total_over_money']}<br>U {100 - sp['total_over_bettors']}/{100 - sp['total_over_money']}" if sp else ''
        L.append(f"| {g['k'].astimezone(PT):%a %H:%M} | [{matchup(gid, False)}](#board-{slug(gid)}) | {f} {s_:+g} | {t} | {imps} | {proj_txt(gid)} | {wp} | {spc} | {toc_} | {sig_short(gid)} |")
    L += RE
    L += ['', '**Game by game** — open a game for both sides of every market, the split between bets and money, and any big-money signal with the line it started at.', '']
    for g in live:
        gid = g['id']; b = G.get(gid); A_, H_ = g['visitor'], g['home']
        if not b: continue
        f, s_ = fav(gid); t = (b['tot'].get('Over') or (None,))[0]
        L += roll('section-board', f'board-{slug(gid)}', f"📊 {matchup(gid)} — {f} {s_:+g} · O/U {t}" + (f" · Proj {proj_txt(gid)}" if proj_txt(gid) else '') + (' · ' + sig_short(gid) if SIG.get(gid) else ''))
        nv = novig(gid); fs = t / 2 - s_ / 2 if f is not None and t is not None else None
        imp_ = {f: fs, (H_ if f == A_ else A_): (t - fs)} if fs is not None else {}
        pj = (NAR.get(gid) or {}).get('proj'); pjd = dict(pj) if pj else {}
        L += ['| | ' + tl(A_) + A_ + ' | ' + tl(H_) + H_ + ' |', '|---|---|---|',
              f"| Spread | {b['sp'][A_][0]:+g} ({b['sp'][A_][1]:+d}) | {b['sp'][H_][0]:+g} ({b['sp'][H_][1]:+d}) |" if A_ in b['sp'] and H_ in b['sp'] else '| Spread | n/a | n/a |',
              f"| Moneyline | {b['ml'].get(A_, 0):+d} | {b['ml'].get(H_, 0):+d} |" if b['ml'] else '| Moneyline | n/a | n/a |',
              f"| Win chance (no-vig) | {nv.get(A_, 0)*100:.0f}% | {nv.get(H_, 0)*100:.0f}% |" if nv else '| Win chance | n/a | n/a |',
              f"| Score the lines imply | {imp_.get(A_, 0):.1f} | {imp_.get(H_, 0):.1f} |" if imp_ else '| Score the lines imply | n/a | n/a |',
              f"| Our projection | {pjd.get(A_, '')} | {pjd.get(H_, '')} |", '']
        sp = SPL.get(gid) or SPL.get(gid.replace('WAS', 'WSH'))
        if sp:
            flagged = {(x['market'], x['side']) for x in SIG.get(gid, [])}
            def row(mk, lab, side, bets, money, line_txt):
                gap = money - bets; mark = '💰 ' if (mk, side) in flagged else ''
                return f"| {lab} | {mark}{tl(side) if side in (A_, H_) else ''}{side} {line_txt} | {bar(bets)} | {bar(money)} | {gap:+d} |"
            spA = b['sp'].get(A_, (None, None)); spH = b['sp'].get(H_, (None, None))
            oo = b['tot'].get('Over', (None, None)); uu = b['tot'].get('Under', (None, None))
            try: when_ = datetime.datetime.fromisoformat(sp['captured_at']).astimezone(PT).strftime('%a %H:%M PT')
            except Exception: when_ = ''
            L += [f"**Where the bets are landing** (Action Network splits, {when_}; 💰 = big-money signal)", '',
                  '| Market | Side | % of bets | % of money | Money minus bets |', '|---|---|---|---|---|',
                  row('spread', 'Spread', A_, 100 - sp['spread_home_bettors'], 100 - sp['spread_home_money'], f"{spA[0]:+g}" if spA[0] is not None else ''),
                  row('spread', 'Spread', H_, sp['spread_home_bettors'], sp['spread_home_money'], f"{spH[0]:+g}" if spH[0] is not None else ''),
                  row('total', 'Total', 'Over', sp['total_over_bettors'], sp['total_over_money'], f"{oo[0]:g}" if oo[0] is not None else ''),
                  row('total', 'Total', 'Under', 100 - sp['total_over_bettors'], 100 - sp['total_over_money'], f"{uu[0]:g}" if uu[0] is not None else ''),
                  row('moneyline', 'Moneyline', A_, 100 - sp['ml_home_bettors'], 100 - sp['ml_home_money'], f"{b['ml'].get(A_, 0):+d}" if b['ml'] else ''),
                  row('moneyline', 'Moneyline', H_, sp['ml_home_bettors'], sp['ml_home_money'], f"{b['ml'].get(H_, 0):+d}" if b['ml'] else ''), '']
        for x in SIG.get(gid, []):
            L.append(f"- 💰 **Big-money signal: {sig_label(x)}** — {x['bets']}% of bets but {x['money']}% of the money. {sig_drift(x)}.")
        if not SIG.get(gid): L.append('- No big-money signal in this game (no side where money beats bets by 15+ points).')
        L += ['', f"[Full game write-up →](#{gsid(gid)}) · [expert consensus →](#experts-{slug(gid)})"] + RE

    # ---------------- 3. Consensus ----------------
    L += ['', '<a id="consensus-section"></a>', '## 3. In-Depth Multi-Platform Consensus & High-Stakes Clashes', ''] + controls('section-3', 'Section 3') + [
          '**What the experts are saying, counted fairly.** We collect picks from betting podcasts, YouTube shows and betting writers, then count each source **once per game** on the side it picked most. A lopsided count (for example 6–1) means broad agreement; a **clash** means credible sources are split. The table ranks games from the strongest agreement down.', '']
    L += roll('section-3', 'consensus-defs', '📖 How to read this section') + [
          '- **Source:** one outlet, podcast host or writer. Outlets that publish several writers (ESPN, VSiN) still count as one vote.',
          '- **For – Against:** sources backing the consensus side vs. the other side. Ties inside one source are dropped.',
          '- **Strength** (the table is ordered by this first): 🌟 Near-unanimous = at least 3× as many sources on one side, or none against · 🔥 Majority = ahead by 2 or more · ⚔️ Clash = ahead by only 1 · ⚖️ Split = dead even.',
          '- **Total lean:** whether more sources picked the Over or the Under.',
          '- **Agreement is not a guarantee.** Heavy consensus on a popular side can already be priced into the line; see the big-money column in §2.'] + ROLL_END
    ranked = []
    for g in live:
        c_ = CONS.get(g['id'], {}); A_, H_ = g['visitor'], g['home']
        a_, h_ = c_.get(A_, set()), c_.get(H_, set())
        side, n1, n2, fr, ag = (A_, len(a_), len(h_), a_, h_) if len(a_) >= len(h_) else (H_, len(h_), len(a_), h_, a_)
        ranked.append((n1 - n2, n1, g, side, fr, ag))
    def badge(n1, n2, m_):
        if n1 < 2: return '—'
        if n1 == n2: return '⚖️ Split'
        return '🌟 Near-unanimous' if n2 == 0 or n1 >= 3 * max(n2, 1) else ('🔥 Majority' if m_ >= 2 else '⚔️ Clash')
    BRANK = {'🌟 Near-unanimous': 4, '🔥 Majority': 3, '⚔️ Clash': 2, '⚖️ Split': 1, '—': 0}
    ranked.sort(key=lambda x: (-BRANK[badge(x[1], len(x[5]), x[0])], -x[0], -x[1]))
    L += roll('section-3', 'consensus-overview', '🧭 Consensus ranking — every game') + [
          '| Rank | Game | Consensus side | For – Against | Strength | Total lean | Details |', '|---|---|---|---|---|---|---|']
    for i, (m_, n1, g, side, fr, ag) in enumerate(ranked):
        c_ = CONS.get(g['id'], {}); u, o = c_.get('Under', set()), c_.get('Over', set())
        tlean = f"Under ({len(u)})" if len(u) > len(o) else (f"Over ({len(o)})" if o else '—')
        det = [f"[game](#{gsid(g['id'])})", f"[experts](#experts-{slug(g['id'])})"] + ([f"[breakdown](#consensus-{g['id'].lower().replace('@', '-')})"] if n1 >= 2 else [])
        L.append(f"| {i+1} | {glink(g['id'])} | {('split ' + g['visitor'] + '/' + g['home']) if n1 and n1 == len(ag) else (side if n1 else '—')} | {n1} – {len(ag)} | <span data-sort='{BRANK[badge(n1, len(ag), m_)] * 100 + max(0, m_)}'>{badge(n1, len(ag), m_)}</span> | {tlean} | {' · '.join(det)} |")
    L += ROLL_END
    cur_bd = None
    for i, (m_, n1, g, side, fr, ag) in enumerate([r for r in ranked if r[1] >= 2]):
        n2 = len(ag); bd = badge(n1, n2, m_)
        if bd != cur_bd:
            if cur_bd is not None: L += RE
            cnt = sum(1 for r in ranked if r[1] >= 2 and badge(r[1], len(r[5]), r[0]) == bd)
            L += roll('section-3', 'cgroup-' + slug(bd), f"{bd} — {cnt} game{'s' if cnt != 1 else ''}"); cur_bd = bd
        b_ = G.get(g['id']); f_, s_ = fav(g['id']); tot_ = b_ and (b_['tot'].get('Over') or (None,))[0]
        ln = b_ and b_['sp'].get(side); nv = novig(g['id']).get(side)
        if n1 == n2: ln = None; side = f"{g['visitor']}/{g['home']} split"
        L += roll('section-3', 'consensus-' + g['id'].lower().replace('@', '-'), f"#{i+1}: {tl(side)}{NICK_FULL(side)} {ln[0]:+g} — {matchup(g['id'], False)} ({n1} vs {n2})" if ln else f"#{i+1}: {side} — {matchup(g['id'], False)} ({n1} vs {n2})")
        L += [f"* **Game:** {g['k'].astimezone(PT):%a %H:%M PT} | **Spread:** {f_} {s_:+g} | **Total:** {tot_}" if f_ else f"* **Game:** {g['k'].astimezone(PT):%a %H:%M PT}",
              f"* **Count:** {bd} ({n1} vs {n2}) — for: {esc(', '.join(sorted(fr)))} | against: {esc(', '.join(sorted(ag))) or 'none'}",
              f"* **Market read:** the book gives {side} a {nv*100:.0f}% chance to win" if nv and n1 != n2 else '* **Market read:** n/a']
        for r in EXP.get(g['id'], [])[:4]:
            L.append(f"  * _{esc(r.get('expert'))}_: {esc(r.get('pick_type'))} **{esc(r.get('selection'))}** {esc(r.get('line') or '')} — {esc(r.get('rationale'))[:120]}")
        for x in RANKED:
            if x['gid'] == g['id']: L.append(f"* **Card lean:** {esc(x['market'])} → {esc(x['lean'])} (confidence {stars(x['conf'])})")
        L.append(f"* **Full breakdown:** [game dossier](#{gsid(g['id'])}) · [all expert picks](#experts-{slug(g['id'])})")
        L += ROLL_END
    if cur_bd is not None: L += RE

    # ---------------- 4. Feature plays ranked + expert registry ----------------
    L += ['', '<a id="feature-plays"></a>', '## 4. High-Conviction Feature Plays & Signature Expert Bets', ''] + controls('section-4', 'Section 4') + [
          'Every play on the card, **ranked by confidence and grouped by bet type**. Below the rankings is the full registry of named expert picks for each game — the citations the game write-ups link to.', '']
    L += roll('section-4', 'confidence-defs', '📖 How the stars work') + [
          '- **Stars show how much evidence lines up behind a bet**, compared with our other bets this week. More stars = a stronger case. They are **not** a win percentage.',
          '- **Where a bet starts:** ★★★½ when our own matchup numbers **and** at least two named experts back it · ★★★ when our matchup numbers back it · ★★½ when at least two named experts picked it · ★★ when the support is only partial.',
          '- **Up half a star** when the experts are lopsided in its favor (at least four of them, two-to-one or better), or when the big-money bettors are on the same side.',
          '- **Down half a star** when more experts picked the other side, when the big money is on the other side, or when an injury or lineup question is still open.',
          '- We do not use a computer model\'s win percentage here: ours failed its accuracy test, so it is left out.'] + ROLL_END
    for typ, icon, label in (('Side', '✅', 'Sides (who wins / covers)'), ('Total', '📈', 'Totals (over / under)'), ('Prop', '🧾', 'Player props')):
        rs = [r for r in RANKED if r['type'] == typ]
        if not rs: continue
        L += roll('section-4', f'feature-{typ.lower()}', f'{icon} {label} — {len(rs)} ranked') + [
              '| Rank | Pick | Lean | Game | Confidence | What moves it | Evidence |', '|---|---|---|---|---|---|---|'] + [
              f"| {i+1} | **{esc(r['market'])}** | {esc(r['lean'])} | {glink(r['gid']) if r['gid'] else esc(r['game'])} | {stars(r['conf'])} | {esc('; '.join(r['conf_why']))} | {link_sources(r['source'], r['gid'])} |" for i, r in enumerate(rs)] + ROLL_END
    L += ['', '<a id="expert-registry"></a>', '### 🎙️ Expert pick registry by game', '', 'Every named expert pick we captured this week, by game. The game write-ups in §7 link here when they cite an expert.', '']
    for g in live:
        ex, yp = EXP.get(g['id'], []), YT.get(g['id'], [])
        if not ex and not yp: continue
        L += roll('section-4', f"experts-{slug(g['id'])}", f"🎙️ {matchup(g['id'])} — {len(ex) + len(yp)} picks")
        used = set()
        def anc(name):
            i_ = EXPANCH[g['id']].get(name)
            if not i_ or i_ in used: return ''
            used.add(i_); return f'<span id="{i_}"></span>'
        for kind in ('Side', 'Total', 'Prop'):
            items = [f"- {anc(r.get('expert'))}**{esc(r.get('expert'))}** — {esc(r.get('pick_type'))} **{esc(r.get('selection'))}** {esc(r.get('line') or '')} — {esc(r.get('rationale'))[:170]}" for r in ex if exp_kind(r) == kind]
            items += [f"- {anc(p['speaker'])}**{esc(p['speaker'])}** (YouTube, {esc(p['show'].split(' — ')[0])}) — **{esc(p['pick'])}** {p.get('price') or ''}{(' — ⚠ ' + esc(p['verify'])) if p.get('verify') else ''}" for p in yp if yt_kind(p) == kind]
            if items: L += ['', f"**{ {'Side': 'Sides', 'Total': 'Totals', 'Prop': 'Player props'}[kind] }**", ''] + items
        L += ['', f"[⬆ Back to the {g['id']} game write-up](#{gsid(g['id'])})", '</div>', '</details>']

    # ---------------- 5. Wong teaser ----------------
    L += ['', '<a id="teaser-matrix"></a>', '## 5. The Master 6-Point Wong Teaser Matrix', '',
          '**What a teaser is:** you move the point spread 6 points in your favor on every leg, in exchange for a smaller payout, and every leg must win. The "Wong" version only uses lines where those 6 points cross both **3 and 7**, the two most common NFL winning margins: favorites of −7.5 to −8.5 (teased down to −1.5 / −2.5) and underdogs of +1.5 to +2.5 (teased up to +7.5 / +8.5). Keep teasers to 2 legs.', '',
          '| Game | Leg | Current | Teased | Experts on that side |', '|---|---|---|---|---|']
    anyw = False
    for g in live:
        b = G.get(g['id'])
        if not b: continue
        for t, (ln, od) in b['sp'].items():
            if -8.5 <= ln <= -7.5 or 1.5 <= ln <= 2.5:
                anyw = True; L.append(f"| {glink(g['id'])} | {t} | {ln:+g} ({od:+d}) | {ln+6:+g} | {len(CONS.get(g['id'], {}).get(t, set()))} |")
    if not anyw: L.append('| — | no Wong-eligible lines | | | |')

    # ---------------- 6. Underdog ML round robin ----------------
    dogt = next((t for t in TK if 'dog' in t['name'].lower()), None)
    L += ['', '<a id="dog-rr"></a>', '## 6. Underdog Moneyline Round Robin: The Dogs and Why', '']
    if dogt:
        n_ = len(dogt['legs'])
        L += [f"**How it works:** {n_} underdogs to win outright, combined into every two-team parlay — {esc(dogt['price'])}, **${dogt['stake']} total**. Payout by number of winners: {esc(dogt['ret'].replace('returns: ', ''))}. "
              f"Two winners does **not** turn a profit on this build; it needs three or more. Each dog is on the ticket because we think its chance of winning is better than its price implies — not because we expect all of them to win.", '',
              '| Dog | Game | Price | Book\'s win chance (no-vig) | Our projection | Experts for – against | Big money | Moneyline move |', '|---|---|---|---|---|---|---|---|']
        for lg in dogt['legs']:
            gid = lg['game']; team = lg['market'].split()[0]
            if gid not in ids: continue
            A_, H_ = gid.split('@'); opp = H_ if team == A_ else A_
            c_ = CONS.get(gid, {}); nv = novig(gid).get(team); o = OPEN.get(gid); b = G.get(gid)
            mv = f"{o['ml'][team]:+d} → {b['ml'][team]:+d}" if o and b and team in o['ml'] and team in b['ml'] else ''
            bigm = 'yes' if f'{team} spread' in sharp else ('against' if f'{opp} spread' in sharp else '')
            L.append(f"| **{team} ML** | {glink(gid)} | {esc(lg['price'])} | {nv*100:.0f}% |" if nv else f"| **{team} ML** | {glink(gid)} | {esc(lg['price'])} | — |")
            L[-1] += f" {proj_txt(gid)} | {len(c_.get(team, ()))} – {len(c_.get(opp, ()))} | {bigm} | {mv} |"
        L += ['', '<div class="rollup-controls">', "  <button class=\"btn-toggle btn-primary\" onclick=\"toggleRollups('section-dogs', true)\">Open all dogs</button>", "  <button class=\"btn-toggle\" onclick=\"toggleRollups('section-dogs', false)\">Close all dogs</button>", '</div>', '']
        for lg in dogt['legs']:
            gid = lg['game']; team = lg['market'].split()[0]
            if gid not in ids: continue
            nar = NAR.get(gid) or {}; why = dict(nar.get('secs', [])).get('Why the card leans this way', ''); brk = dict(nar.get('secs', [])).get('What breaks it', '')
            L += roll('section-dogs', f'dog-{slug(gid)}', f"🐶 {tl(team)}{FULL_NAME(team)} {esc(lg['price'])} — {gid} · tier {esc(lg['tier'])}" + (f" · our projection {proj_txt(gid)}" if proj_txt(gid) else ''))
            L += [f"**Why it's on the ticket:** {' '.join(why.split())}" if why else f"**Why:** {link_sources(lg['why'], gid)}", '',
                  f"**What breaks it:** {' '.join(brk.split())}" if brk else '', '', f"**Card evidence:** {link_sources(lg['why'], gid)} · [full game write-up](#{gsid(gid)})"] + ROLL_END
    else:
        L += ['<em>No underdog round robin on this week\'s card yet.</em>']

    # ---------------- 7. Dossier ----------------
    L += ['', '<a id="game-dossier"></a>', '## 7. Full Chronological Analytical Dossier (With Market Cards)', '',
          'Each game opens with a written game script, our projected final score and the reasoning behind the card lean, with links to the experts cited and the actionable props for that game. Below that: the betting lines, key context, and every pick grouped by **sides**, **totals** and **player props**.', ''] + controls('section-7', 'Section 7')
    icons = {'game script': '📖', 'why the card leans this way': '🧠', 'what breaks it': '⚠️'}
    for g in sched:
        gid = g['id']; A, H = g['visitor'], g['home']
        b0 = G.get(gid); f0, s0 = fav(gid) if b0 else (None, None); t0 = b0 and (b0['tot'].get('Over') or (None,))[0]
        fsc = FS.get(gid)
        head = f"⏰ {g['k'].astimezone(PT):%a %H:%M PT} — {matchup(gid)}" + (f" — {f0} {s0:+g} · O/U {t0}" if f0 else '') + ((f" · Proj {proj_txt(gid)}") if proj_txt(gid) and not g['done'] else '') + ((f" — 🏁 FINAL {fsc['away'][0]} {fsc['away'][1]}–{fsc['home'][0]} {fsc['home'][1]}" if fsc else ' — 🏁 FINAL') if g['done'] else '')
        L += [f'<a id="{gsid(gid)}"></a>'] + roll('section-7', gsid(gid) + '-box', head)
        if g['done']: L += ['<em>Played before this build; excluded from every slot.</em>'] + ROLL_END; continue
        b = G.get(gid); nar = NAR.get(gid) or {}
        anch = dict(EXPANCH.get(gid, {}))
        for al, tgt in ALIAS_EXP.items():
            if tgt in anch: anch.setdefault(al, anch[tgt])
        linked = set(); cited = []
        def cite(text):
            for name in sorted(anch, key=len, reverse=True):
                if anch[name] in linked and name not in ALIAS_EXP: continue
                pat = r'(?<![\w>#-])' + re.escape(name) + r'(?![\w<])'
                if re.search(pat, text):
                    text = re.sub(pat, f'<a href="#{anch[name]}">{name}</a>', text, count=1)
                    if anch[name] not in linked: linked.add(anch[name]); cited.append(f'<a href="#{anch[name]}">{ALIAS_EXP.get(name, name)}</a>')
            return text
        if nar.get('secs') or nar.get('proj'):
            L += ['<div class="game-narrative" style="border-left: 4px solid #3B82F6; background: rgba(59,130,246,0.07); padding: 12px 16px; border-radius: 6px; margin: 4px 0 16px 0;">']
            pj = nar.get('proj')
            if pj:
                (t1_, s1), (t2_, s2) = pj; w_, l_ = ((t1_, s1), (t2_, s2)) if s1 >= s2 else ((t2_, s2), (t1_, s1))
                ctx = []
                f_, sp_ = fav(gid) if b else (None, None); tt_ = b and (b['tot'].get('Over') or (None,))[0]
                if f_ is not None and tt_ is not None:
                    dog_ = b['home'] if f_ == b['away'] else b['away']; fs_ = tt_ / 2 - sp_ / 2
                    ctx.append(f"lines imply {f_} {fs_:.1f} – {dog_} {tt_ - fs_:.1f}")
                    fav_margin = (s1 - s2) if t1_ == f_ else (s2 - s1)
                    cov = f_ if fav_margin > -sp_ else (dog_ if fav_margin < -sp_ else 'push')
                    ctx.append(f"projected margin {w_[0]} by {w_[1] - l_[1]} → covers: {cov} ({f_} {sp_:+g})")
                    ctx.append(f"total {s1 + s2} vs {tt_} → {'Over' if s1 + s2 > tt_ else 'Under' if s1 + s2 < tt_ else 'push'}")
                L.append(f'<div style="font-size: 1.08rem; font-weight: 700; margin-bottom: 4px;">🎯 Projected final: {w_[0]} {w_[1]}, {l_[0]} {l_[1]}</div>')
                if ctx: L.append(f'<div style="font-size: 0.86rem; opacity: 0.85; margin-bottom: 8px;">{" · ".join(ctx)}</div>')
            o = OPEN.get(gid)
            if o and b:
                mv = []
                for t in (A, H):
                    if t in o['sp'] and t in b['sp'] and b['sp'][t][0] <= 0:
                        mv.append(f"spread {t} {o['sp'][t]:+g} → {b['sp'][t][0]:+g}"); break
                if b['tot'].get('Over'): mv.append(f"total {o['tot']:g} → {b['tot']['Over'][0]:g}")
                for t in (A, H):
                    if t in o['ml'] and t in b['ml']: mv.append(f"moneyline {t} {o['ml'][t]:+d} → {b['ml'][t]:+d}")
                L.append(f'<div style="font-size: 0.86rem; margin-bottom: 8px;">📈 <strong>Line movement</strong> (Bookmaker, {o["src"]} → {D}): {" · ".join(mv)}</div>')
            for t, body in nar.get('secs', []):
                L.append(f'<div style="font-weight: 700; margin-top: 8px;">{icons.get(t.lower(), "•")} {t}</div>')
                for para in [x.strip() for x in body.split('\n\n') if x.strip()]:
                    L.append(f'<p style="margin: 4px 0 6px 0;">{cite(md_inline(" ".join(para.splitlines())))}</p>')
            if cited: L.append(f'<div style="font-size: 0.88rem; margin-top: 8px;">🎙️ <strong>Experts cited:</strong> {" · ".join(cited)}</div>')
            gp = POOL.get(gid, [])
            if gp:
                L.append(f'<div style="font-size: 0.88rem; margin-top: 6px;">🧾 <strong>Actionable props called out:</strong> ' + ' · '.join(f'<a href="#props-{slug(gid)}">{p["text"]}{(" " + p["price"]) if p["price"] else ""}</a>' for p in gp[:12]) + (f' · <a href="#props-{slug(gid)}">+{len(gp) - 12} more</a>' if len(gp) > 12 else '') + '</div>')
            L += ['</div>', '']
        if b:
            L += ['| | ' + A + ' | ' + H + ' |', '|---|---|---|',
                  f"| Spread (BKR) | {b['sp'].get(A, ('', 0))[0]:+g} ({b['sp'].get(A, ('', 0))[1]:+d}) | {b['sp'].get(H, ('', 0))[0]:+g} ({b['sp'].get(H, ('', 0))[1]:+d}) |" if A in b['sp'] and H in b['sp'] else '| Spread | n/a | n/a |',
                  f"| Moneyline | {b['ml'].get(A, 0):+d} | {b['ml'].get(H, 0):+d} |" if b['ml'] else '| Moneyline | n/a | n/a |',
                  f"| Total | O {b['tot'].get('Over', ('?', 0))[0]} ({b['tot'].get('Over', ('?', 0))[1]:+d}) | U {b['tot'].get('Under', ('?', 0))[0]} ({b['tot'].get('Under', ('?', 0))[1]:+d}) |" if b['tot'] else '| Total | n/a | n/a |']
            qbs = {team_of(r['player']): r['player'] for r in b['rows'] if r['market'] == 'pass_yds'}
            L += [f"| QB (BKR markets) | {qbs.get(A, '?')} | {qbs.get(H, '?')} |", '']
        # key context
        ctxl = []
        sp = SPL.get(gid) or SPL.get(gid.replace('WAS', 'WSH'))
        if sp: ctxl.append(f"- **Betting splits:** spread {H} {sp['spread_home_bettors']}% of bets / {sp['spread_home_money']}% of money · moneyline {H} {sp['ml_home_bettors']}% / {sp['ml_home_money']}% · Over {sp['total_over_bettors']}% / {sp['total_over_money']}%")
        for off, de in ((A, H), (H, A)):
            m = SEC.get((off, de))
            if m and str(m.get('vulnerability_tier')).lower() in ('high', 'medium'):
                rec = ', '.join(str((x.get('player_name') or x.get('name') or '?') if isinstance(x, dict) else x) for x in (m.get('target_receivers') or [])[:3])
                ctxl.append(f"- **Secondary matchup:** {off} passing offense vs {de} defense — **{m['vulnerability_tier'].upper()}** (severity {m.get('severity_score')}){'; targets: ' + rec if rec else ''}")
        for t in (A, H):
            inj = INJ.get(t, {})
            if inj: ctxl.append(f"- **{t} injuries (skill positions):** " + '; '.join(f"{n} {e['position']} {e['normalized_status'].title()}" for n, e in sorted(inj.items())))
        c = CONS.get(gid, {})
        if c: ctxl.append('- **Expert consensus:** ' + ' · '.join(f"{k} ({len(v)}: {', '.join(sorted(v))[:80]})" for k, v in sorted(c.items(), key=lambda x: -len(x[1]))) + f" — [all picks](#experts-{slug(gid)})")
        for d_ in dk:
            if NICK.get(A, '') in d_['away'] and NICK.get(H, '') in d_['home']:
                gl = {(r['market'], r['side']): r for r in d_['rows'] if r['market'].startswith('game_')}
                ctxl.append('- **DraftKings Predictions (contract %, before fees):** ' + ' · '.join(f"{r['side']} {r['market'].replace('game_', '')} {('' if r['line'] is None else format(r['line'], '+g') if 'spread' in r['market'] else r['line'])} {r['prob']*100:.0f}%" for r in gl.values()))
        if ctxl: L += roll('section-7-sub', f'{gsid(gid)}-context', f'🔑 Key context — splits, matchups, injuries, consensus ({len(ctxl)})') + ctxl + RE
        # grouped picks
        def xl(name): i_ = EXPANCH.get(gid, {}).get(name); return f"[{esc(name)}](#{i_})" if i_ else f"_{esc(name)}_"
        grp = {'Side': [], 'Total': [], 'Prop': []}
        for r in EXP.get(gid, []):
            grp[exp_kind(r)].append(f"- {xl(r.get('expert'))}: {esc(r.get('pick_type'))} **{esc(r.get('selection'))}** {esc(r.get('line') or '')} — {esc(r.get('rationale'))[:110]}")
        for p in YT.get(gid, []):
            grp[yt_kind(p)].append(f"- {xl(p['speaker'])} (YouTube): **{esc(p['pick'])}** {p.get('price') or ''} {('— ⚠ ' + esc(p['verify'])) if p.get('verify') else ''}")
        for x in RANKED:
            if x['gid'] == gid: grp[x['type']].insert(0, f"- ⭐ **Platinum Rose card lean:** {esc(x['market'])} → {esc(x['lean'])} · confidence {stars(x['conf'])}")
        for k, v in sorted(PROPSIG.get(gid, {}).items(), key=lambda x: -len(x[1]))[:4]:
            grp['Prop'].append(f"- _Prop signal_ ({len(v)}): {k} — {', '.join(sorted(v))[:60]}")
        if b:
            rows = b['rows']; key = []
            for t in (A, H):
                q = [r['player'] for r in rows if r['market'] == 'pass_yds' and team_of(r['player']) == t][:1]
                ru = sorted({r['player'] for r in rows if r['market'] == 'rush_yds' and team_of(r['player']) == t and (roster.get(r['player']) or {}).get('position') == 'RB'}, key=lambda p: -(main_rung(p, 'rush_yds', rows) or {'threshold': 0})['threshold'])[:1]
                re_ = sorted({r['player'] for r in rows if r['market'] == 'rec_yds' and team_of(r['player']) == t}, key=lambda p: -(main_rung(p, 'rec_yds', rows) or {'threshold': 0})['threshold'])[:2]
                for p, mk in [(x, 'pass_yds') for x in q] + [(x, 'rush_yds') for x in ru] + [(x, 'rec_yds') for x in re_]:
                    m = main_rung(p, mk, rows)
                    if m: key.append(f"{p} {m['threshold']}+ {mk.replace('_', ' ')} {m['odds']:+d}")
            atd = sorted([r for r in rows if r['market'] == 'atd_1_plus' and r['odds'] is not None], key=lambda r: r['odds'])[:3]
            if key: grp['Prop'].append('- **Bookmaker main lines (priced near −110):** ' + ' · '.join(key))
            if atd: grp['Prop'].append('- **Shortest anytime-TD prices (Bookmaker):** ' + ' · '.join(f"{r['player']} {r['odds']:+d}" for r in atd))
            pulled = sorted({r['player'] for r in rows if not r['available'] and r.get('player')})
            if pulled: grp['Prop'].append('- **Listed without odds at Bookmaker (check status):** ' + ', '.join(pulled))
        if POOL.get(gid): grp['Prop'].append(f"- 🧰 [All actionable props for this game](#props-{slug(gid)})")
        for k_, lab in (('Side', '⚖️ Sides'), ('Total', '📈 Totals'), ('Prop', '🧾 Player props')):
            if grp[k_]: L += roll('section-7-sub', f'{gsid(gid)}-{k_.lower()}', f'{lab} ({len(grp[k_])})') + grp[k_] + RE
        L += ROLL_END

    # ---------------- 8. Props + under the hood ----------------
    L += ['', '<a id="prop-card"></a>', '## 8. Master Player Prop & Exotic Wager Card', ''] + controls('section-8', 'Section 8') + [
          f'Reference boards for player props. For the props we actually recommend, see the [props pool](#prop-pool) and the prop stacks in [card tickets](#card-tickets).', '']
    L += roll('section-8', 'prop-card-box', '🧾 Props: article tier-1, tackles + assists, 2+ passing TDs')
    t1x = t1[:24]
    if t1x:
        L += ['**Article-sourced tier-1 props** (completed games excluded):', '', '| Game | Player | Market | Line | Price | Source |', '|---|---|---|---|---|---|']
        for p in t1x: L.append(f"| {glink(live_games.get(p.get('game')), esc(p.get('game')))} | {esc(p.get('player'))} | {esc(p.get('market') or p.get('category'))} | {esc(p.get('line') or p.get('selection'))} | {esc(p.get('odds') or p.get('price'))} | {esc(p.get('source') or p.get('expert'))[:40]} |")
    ta = [r for r in beo if r.get('market') == 'tackles_assists']
    if ta:
        best = {}
        for r in ta:
            if -250 <= r['odds'] <= 130:
                k = r['player']; best.setdefault(k, r)
                if abs(dec(r['odds']) - 1.91) < abs(dec(best[k]['odds']) - 1.91): best[k] = r
        L += ['', '**Tackles + assists main lines (BetOnline)** — the season\'s best-hitting prop type:', '', '| Game | Player | Rung | Price |', '|---|---|---|---|']
        for r in sorted(best.values(), key=lambda r: r['game']): L.append(f"| {r['game']} | {r['player']} | {r['line']:g}+ | {r['odds']:+d} |")
    if ptd_all: L += ['', '**2+ passing TDs (Bookmaker):** ' + ' · '.join(f"{r['player']} {r['odds']:+d}" for r in sorted(ptd_all, key=lambda r: r['odds']))]
    L += ROLL_END
    L += roll('section-8', 'under-the-hood', '🔧 Under the hood: how the card was built (ticket list &amp; season build rules)')
    if TK: L += ['| Ticket | Book | Stake | Price |', '|---|---|---|---|'] + [f"| [{esc(t['disp'])}](#{t['id']}) | {esc(t['book'])} | ${t['stake']} | {esc(t['price'])} |" for t in TK]
    m = re.search(r'\*\*Build rules that come from the data\.[^\n]*\n\n(\|.*?\n)(?:\n)', (ROOT / 'agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md').read_text(encoding='utf-8'), re.S)
    if m: L += ['', '**Build rules from the season record:**', '', m.group(1).strip()]
    L += ROLL_END
    # ---------------- 9 ----------------
    L += ['', '<a id="survivor"></a>', '## 9. Master Survivor Contest Strategy Hierarchy', '',
          '**Survivor pools:** pick one team to win each week; you cannot use a team twice, and one loss usually ends your run. So the best pick balances three things: **how likely the team is to win**, **how many others in your pool are on the same team** (if a popular pick loses, much of the field goes with it), and **whether you would rather save the team for a better spot later**.', '']
    se = J('data/survivor/yahoo-survivor-entrants-2026.json', {}) or {}
    for gr in se.get('groups', []):
        me = [e for e in gr['entrants'] if e.get('is_user_team')]
        alive = sum(1 for e in gr['entrants'] if e.get('status') == 'alive')
        for e in me: L.append(f"- **{gr['name']}:** {e['team_name']} — **{e['status']}**" + (f" (eliminated week {e['elimination_week']} on {tl(e['elimination_pick'])}{e['elimination_pick']})" if e.get('eliminated') else '') + f"; {alive} of {gr['num_teams']} entries still alive")
    spi = J(f'data/survivor/pick-intel-{a.season}-w{WW}.json', {}) or {}
    spt = spi.get('teams', {})
    if not spt: gaps.append(f'No survivor pick-popularity file (data/survivor/pick-intel-{a.season}-w{WW}.json); §9 shows win chance only.')
    fut = collections.defaultdict(list)
    for g2 in J('public/schedule.json', []):
        if g2.get('season') == a.season and g2.get('season_type') == 2 and W < (g2.get('week') or 0) <= W + 3:
            fut[g2['visitor']].append((g2['week'], f"@{g2['home']}")); fut[g2['home']].append((g2['week'], f"vs {g2['visitor']}"))
    cands = []
    for g in live:
        for t, p_ in novig(g['id']).items(): cands.append((p_, t, g['id']))
    cands.sort(reverse=True)
    L += ['', f"| Rank | Team | Opponent | Win chance (no-vig) | Picked by (share of pools) | Value score | Save-for-later & notes | Next 3 weeks |", '|---|---|---|---|---|---|---|---|']
    for i, (p_, t, gid) in enumerate(cands[:12]):
        A_, H_ = gid.split('@'); opp = f"@ {tl(H_)}{H_}" if t == A_ else f"vs {tl(A_)}{A_}"
        x_ = spt.get(t, {}); pk = x_.get('pick_pct')
        note = x_.get('note', '')
        if pk is not None and pk >= 25: note = (note + ' ' if note else '') + f'Very popular ({pk:.0f}% of entries): a loss here knocks out a big part of the field, so fading it can pay off in large pools.'
        elif pk is not None and pk < 1 and p_ >= 0.6: note = (note + ' ' if note else '') + 'Barely picked: a contrarian option if you trust the win chance.'
        qb_out = [n for n, e in INJ.get(t, {}).items() if e.get('position') == 'QB' and str(e.get('normalized_status', '')).upper().startswith(('OUT', 'DOUBTFUL'))]
        opp_t = H_ if t == A_ else A_
        opp_qb = [n for n, e in INJ.get(opp_t, {}).items() if e.get('position') == 'QB' and str(e.get('normalized_status', '')).upper().startswith(('OUT', 'DOUBTFUL'))]
        if opp_qb: note = (note + ' ' if note else '') + f"Opponent's QB {', '.join(opp_qb)} is out."
        if qb_out: note = (note + ' ' if note else '') + f"Own QB {', '.join(qb_out)} out/doubtful."
        nx = ' · '.join(f"W{w_} {o_}" for w_, o_ in sorted(fut.get(t, [])))
        pk_s = f'{pk:.1f}%' if pk is not None else '—'
        ev_s = f"{x_['ev']:.2f}" if x_.get('ev') is not None else '—'
        L.append(f"| {i+1} | {tl(t)}**{t}** | {opp} ([game](#{gsid(gid)})) | {p_*100:.0f}% | {pk_s} | {ev_s} | {esc(note) or '—'} | {nx} |")
    if spt:
        L += ['', f"<em>Pick share and value score: [SurvivorGrid]({spi['sources'].get('pick_pct')}) (value score blends win chance with popularity; above 1.00 is a better-than-average pick this week). Save-for-later notes: [Covers]({spi['sources'].get('note')}). Captured {spi.get('captured_at', '')[:16].replace('T', ' ')}.</em>"]
    # ---------------- 10 ----------------
    import html as _html
    L += ['', '<a id="systems"></a>', '## 10. Master Quantitative Betting Systems, Model Rules & Historical Trends', '',
          '**Betting trends are history, not a forecast.** A record like "11-0 against the spread" can be real and still be luck; use trends to break ties between picks you already like, not as a reason on their own. Below, every trend we captured this week is tied to the game and the side it points to.', '',
          '> ⚠️ **Our own model rule:** our computer prop model failed its accuracy test (it was less accurate than simply using the betting line). We never use a model edge to pick or size bets.', '']
    TREND = re.compile(r'(\d+-\d+(?:-\d+)? ?(?:ATS|SU)|since 20\d\d|\d+(?:\.\d)?% (?:rate|cover|ATS)|cover at|covers at|unders? (?:are|is) \d+-\d+|overs? (?:are|is) \d+-\d+)', re.I)
    def trend_kind(txt, pick):
        tl_ = f'{txt} {pick}'.lower()
        if re.search(r'\b(under|over)\b', pick.lower()) or (re.search(r'\b(unders?|overs?) (are|is|have|hit|went)\b', txt.lower()) and not teams_in(pick)): return 'Totals'
        if re.search(r'0-2|winless|without a win|rest advantage|desperate|bounce|after (a|losing)|off (a|an)|kitchen sink|home dogs?|road fav|divisional|buy-low', tl_): return 'Situational spot'
        return 'Team / coach record'
    TR = []
    for g in live:
        for r in EXP.get(g['id'], []):
            if r.get('pick_type') == 'player_prop': continue
            txt = r.get('rationale') or ''
            if TREND.search(txt):
                TR.append(dict(gid=g['id'], txt=txt, pick=f"{r.get('selection')} {r.get('line') or ''}".strip(), src=r.get('expert') or '?', kind=trend_kind(txt, str(r.get('selection')))))
    for r in pull['signals']:
        txt = r.get('rationale') or ''
        if r.get('bet_type') == 'player_prop' or not TREND.search(txt): continue
        T_ = teams_in(' '.join(str(r.get(k) or '') for k in ('event_ref', 'team_or_market', 'lean')))
        gm = [g['id'] for g in live if {g['visitor'], g['home']} & T_]
        if len(gm) != 1: continue
        tom_, ln_ = str(r.get('team_or_market') or '').strip(), str(r.get('lean') or '').strip()
        pick_ = ln_ if tom_.lower() in ln_.lower() else (tom_ if ln_.lower() in tom_.lower() else f'{tom_} {ln_}'.strip())
        if any(z['gid'] == gm[0] and z['txt'][:60] == txt[:60] for z in TR): continue
        TR.append(dict(gid=gm[0], txt=txt, pick=pick_, src=(r.get('author') or r.get('source') or '?').replace('Twitter/X Bookmarks (Personal)', 'X/Twitter (saved post)'), kind=trend_kind(txt, pick_)))
    kick_ = {g['id']: g['k'] for g in live}
    TR.sort(key=lambda z: (kick_.get(z['gid']), z['gid']))
    L += roll('section-10', 'trend-table', f'📐 Trends by game — {len(TR)} trends tied to a side') + fbar('Type', ['Situational spot', 'Team / coach record', 'Totals']) + [
          '| Game | Type | Trend | Points to | Source |', '|---|---|---|---|---|'] + [
          f"| {glink(z['gid'])} | {z['kind']} | {esc(_html.unescape(z['txt']))[:220]} | **{esc(z['pick'])[:60]}** | {link_sources(z['src'], z['gid'])} |" for z in TR] + RE
    sysn = [n for n in pull['notes'] if re.search(r'\b(system|trend|ATS|since 20\d\d|\d+-\d+ (ATS|SU))\b', f"{n.get('title')} {n.get('summary')}", re.I)]
    byg = collections.OrderedDict()
    for n in sysn:
        T_ = teams_in(f"{n.get('title')} {n.get('summary')}")
        gm = [g['id'] for g in live if {g['visitor'], g['home']} & T_]
        byg.setdefault(gm[0] if len(gm) == 1 else 'Slate-wide', []).append(n)
    L += roll('section-10', 'trend-articles', f'📰 Trend articles & posts to read — {len(sysn)}, grouped by game')
    for gk in sorted(byg, key=lambda k: (k == 'Slate-wide', kick_.get(k) or datetime.datetime.max.replace(tzinfo=datetime.timezone.utc))):
        L += ['', f"**{matchup(gk, False) if gk != 'Slate-wide' else '🗓️ Slate-wide angles'}**", '']
        for n in byg[gk][:8]:
            src_ = (n.get('source') or '').replace('Twitter/X Bookmarks (Personal)', 'X/Twitter (saved post)')
            ttl = esc(_html.unescape(n.get('title') or ''))[:110]
            L.append(f"- **{esc(src_)}** — " + (f"[{ttl}]({n['url']})" if n.get('url') else ttl) + f" — {esc(_html.unescape(n.get('summary') or ''))[:180]}")
    L += RE
    # ---------------- 11 ----------------
    L += ['', '<a id="registry"></a>', '## 11. Unified Expert Pick Registry & Source Coverage', '']
    srcs = collections.Counter(n['source'] for n in pull['notes'])
    auth = collections.Counter((r.get('author') or r.get('source')) for r in pull['signals'])
    exps = collections.Counter(r.get('expert') for r in pull['expert'])
    L += ['| Articles by source | n |', '|---|---|'] + [f'| {esc(k)} | {v} |' for k, v in srcs.most_common(20)]
    L += ['', '| Pick signals by author/outlet | n |', '|---|---|'] + [f'| {esc(k)} | {v} |' for k, v in auth.most_common(20)]
    L += ['', '| Podcast experts | n |', '|---|---|'] + [f'| {esc(k)} | {v} |' for k, v in exps.most_common(20)]
    fh = pull.get('feed_health', [])
    bad = [f for f in fh if f.get('last_status') != 'available']
    L += ['', f"**Feed health:** {len(fh) - len(bad)}/{len(fh)} feeds available" + ('; down: ' + ', '.join(f"{f['source']} ({f['last_reason']})" for f in bad) if bad else '')]
    beo_games = {r['game'] for r in beo}
    miss = [g['id'] for g in live if not any(NICK[g['visitor']][:3].upper() in x.upper() or g['visitor'] in x for x in beo_games)] if beo else []
    if miss: gaps.append('No BEO board for: ' + ', '.join(miss))
    if len(dk) < len(live): gaps.append(f'DK Predictions saves for {len(dk)} of {len(live)} remaining games.')
    L += ['', '### Known Gaps', ''] + [f'- {x}' for x in gaps]
    out_dir = ROOT / f'dist/nfl_week{W}_master_packet'; out_dir.mkdir(parents=True, exist_ok=True)
    md = out_dir / f'nfl_week{W}_master_betting_intelligence_summary.md'
    L = reorder_sections(L)
    gaps[:] = [remap_refs(x) for x in gaps]
    txt = finalize_report(L, gaps)
    md.write_text(txt + '\n', encoding='utf-8')
    # ---------- structured JSON export (archive / downstream tools) ----------
    def _j(v):
        if isinstance(v, datetime.datetime): return v.isoformat()
        if isinstance(v, set): return sorted(v)
        if isinstance(v, tuple): return list(v)
        return str(v)
    games_out = []
    for g in live:
        gid = g['id']; b_ = G.get(gid) or {}; nar = NAR.get(gid) or {}; sp_ = SPL.get(gid) or SPL.get(gid.replace('WAS', 'WSH')) or {}
        games_out.append(dict(
            game=gid, away=g['visitor'], home=g['home'], kickoff_utc=g['k'].isoformat(), kickoff_pt=g['k'].astimezone(PT).strftime('%a %H:%M'),
            lines=dict(spread={k: dict(line=v[0], price=v[1]) for k, v in (b_.get('sp') or {}).items()}, moneyline=b_.get('ml') or {},
                       total={k: dict(line=v[0], price=v[1]) for k, v in (b_.get('tot') or {}).items()}),
            opening_lines=OPEN.get(gid), win_chance_no_vig={k: round(v, 4) for k, v in novig(gid).items()},
            projection=dict(nar['proj']) if nar.get('proj') else None, write_up={t: body for t, body in nar.get('secs', [])},
            splits=dict(spread_home_bets=sp_.get('spread_home_bettors'), spread_home_money=sp_.get('spread_home_money'),
                        total_over_bets=sp_.get('total_over_bettors'), total_over_money=sp_.get('total_over_money'),
                        ml_home_bets=sp_.get('ml_home_bettors'), ml_home_money=sp_.get('ml_home_money'), captured_at=sp_.get('captured_at')) if sp_ else None,
            big_money_signals=[{k: x[k] for k in ('market', 'side', 'bets', 'money', 'line', 'price')} | dict(first_line=(x.get('flag') or {}).get('first_line'), first_seen=(x.get('flag') or {}).get('splits_at')) for x in SIG.get(gid, [])],
            expert_consensus={k: sorted(v) for k, v in CONS.get(gid, {}).items()},
            injuries_skill=[dict(player=n, position=e.get('position'), status=e.get('normalized_status')) for t_ in (g['visitor'], g['home']) for n, e in INJ.get(t_, {}).items()],
            expert_picks=[dict(expert=r.get('expert'), type=r.get('pick_type'), selection=r.get('selection'), line=r.get('line'), rationale=r.get('rationale')) for r in EXP.get(gid, [])]
                         + [dict(expert=p_['speaker'], type='youtube', selection=p_['pick'], line=p_.get('price'), rationale=p_.get('verify') or '') for p_ in YT.get(gid, [])],
            actionable_props=POOL.get(gid, [])))
    export = dict(
        schema='master_intel_report_v1', season=a.season, week=W, bkr_capture_date=D, built_at=datetime.datetime.now(PT).isoformat(),
        disclaimer='For entertainment purposes only. Not financial, investment, legal or betting advice. Every wager is the reader\'s own decision and risk; the author and Platinum Rose accept no liability.',
        recommendations=dict(
            straight_bets=[dict(game=r['gid'], type=r['type'], pick=r['market'], lean=r['lean'], tier=r['tier'], stars=r['conf'], why=r['source'], score_notes=r['conf_why']) for r in RANKED if r['type'] in ('Side', 'Total')],
            tickets=[dict(name=t['disp'], card_name=t['name'], book=t['book'], stake=float(t['stake']), price=t['price'], payout=t['ret'], summary=tnote(t),
                          kind='prop_stack' if ticket_is_props(t) else 'parlay_or_round_robin', legs=t['legs'],
                          night_hedge=(lambda nc: None if not nc else dict(night_leg=nc['team'], hedge_team=nc['opp'], game=nc['game'], parlay_payback=round(nc['R'], 2),
                                       options=[dict(bet=re.sub(r'<[^>]+>', '', o['label']), stake=round(o['H'], 2), profit_locked=round(o['lock'], 2), middle_payout=(round(o['middle'], 2) if o['middle'] else None)) for o in nc['opts']]))(night_cap(t)))
                     for t in TK],
            supercontest=[dict(team=t_, line=l_, note=SCNOTE.get(t_, '')) for t_, l_ in (picks if sc_line else [])],
            passing_on=[ln.strip('- ').strip() for ln in (left_off.group(1).strip().splitlines() if left_off else []) if ln.strip()]),
        ranked_plays=[dict(game=r['gid'], type=r['type'], pick=r['market'], lean=r['lean'], tier=r['tier'], stars=r['conf'], score_notes=r['conf_why'], evidence=r['source']) for r in RANKED],
        consensus_ranking=[dict(rank=i + 1, game=g_['id'], side=side_, sources_for=sorted(fr_), sources_against=sorted(ag_), strength=badge(n1_, len(ag_), m_)) for i, (m_, n1_, g_, side_, fr_, ag_) in enumerate(ranked)],
        games=games_out,
        survivor=[dict(rank=i + 1, team=t_, game=gid_, win_chance=round(p_, 4), **{k: v for k, v in (spt.get(t_) or {}).items()}) for i, (p_, t_, gid_) in enumerate(cands[:12])],
        trends=[dict(game=z['gid'], type=z['kind'], trend=z['txt'], points_to=z['pick'], source=z['src']) for z in TR],
        known_gaps=gaps)
    json.dump(export, open(md.with_suffix('.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False, default=_j)
    print(f'wrote {md} ({len(L)} lines)')
    sys.path.insert(0, str(Path(__file__).parent))
    import convert_summary
    if not a.no_export:
        convert_summary.generate_docx(str(md), str(md.with_suffix('.docx')))
        convert_summary.generate_html(str(md), str(md.with_suffix('.html')))
    for x in gaps: print('GAP:', x)
    # ======================================================================
    # SuperContest report (spread-only, 5 picks) — same data, same look
    # ======================================================================
    scl = J(f'data/supercontest/week-{WW}-lines.json', {}) or {}
    if not scl.get('games'):
        print(f'SKIP supercontest report: no data/supercontest/week-{WW}-lines.json')
        return
    SCK = {'Falcons': 'ATL', 'Packers': 'GB'}
    NICK2AB = {v: k for k, v in NICK.items()}
    def sc_gid(x):
        tm = {ALIAS.get(x['favorite_abbr'], x['favorite_abbr']), ALIAS.get(x['underdog_abbr'], x['underdog_abbr'])}
        return next((g['id'] for g in sched if {g['visitor'], g['home']} == tm), None)
    FSall = FS
    card_sc = [(t_, float(l_.replace('−', '-').replace(' ', ''))) for t_, l_ in (picks if sc_line else [])]
    card_alt = []
    if sc_line:
        mm = re.search(r'\(alt: ([A-Z]{2,3}) ([+−-][\d.]+)\)', sc_line.group(1))
        if mm: card_alt = [(mm.group(1), float(mm.group(2).replace('−', '-')))]
    our5 = {t_ for t_, _ in card_sc}; alts = {t_ for t_, _ in card_alt}
    KEYS = (3, 7, 10, 14)
    SIDES = []
    for x in scl['games']:
        gid = sc_gid(x)
        if not gid: continue
        g = next(gg for gg in sched if gg['id'] == gid)
        fav_, dog_ = ALIAS.get(x['favorite_abbr'], x['favorite_abbr']), ALIAS.get(x['underdog_abbr'], x['underdog_abbr'])
        Lc = float(x['contest_line'])
        for side, lc in ((fav_, Lc), (dog_, -Lc)):
            opp = dog_ if side == fav_ else fav_
            b_ = G.get(gid) or {}
            lm = (b_.get('sp') or {}).get(side, (None, None))[0]
            pj = dict((NAR.get(gid) or {}).get('proj') or [])
            marg = (pj[side] - pj[opp]) if side in pj and opp in pj else None
            cush = (marg + lc) if marg is not None else None
            val = (lc - lm) if lm is not None else None
            tc, tm_ = -lc, (-lm if lm is not None else None)
            key_note = ''
            if tm_ is not None and tc != tm_:
                lo, hi = sorted((tc, tm_))
                ks = [k for k in KEYS if lo <= k < hi]
                if ks: key_note = (f"gains key number {ks[0]}" if tc < tm_ else f"loses key number {ks[0]}")
            c_ = CONS.get(gid, {}); nf, na = len(c_.get(side, ())), len(c_.get(opp, ()))
            bm = f'{side} spread' in sharp; bm_against = f'{opp} spread' in sharp
            lean = next((r for r in RANKED if r['gid'] == gid and r['type'] == 'Side' and r['lean'] == side), None)
            score = None
            if not g['done'] and cush is not None:
                score = min(cush, 7) + 1.5 * (val or 0) + 0.5 * max(-3, min(3, nf - na)) + (0.5 if bm else 0) - (0.5 if bm_against else 0) + (0.5 if key_note.startswith('gains') else -0.5 if key_note.startswith('loses') else 0)
            fsc = FSall.get(gid); result = None
            if g['done'] and fsc:
                sc_ = {fsc['away'][0]: fsc['away'][1], fsc['home'][0]: fsc['home'][1]}
                mg = sc_.get(side, 0) - sc_.get(opp, 0) + lc
                result = 'Win' if mg > 0 else ('Push' if mg == 0 else 'Loss')
            SIDES.append(dict(gid=gid, g=g, side=side, opp=opp, lc=lc, lm=lm, lm_price=(b_.get('sp') or {}).get(side, (None, None))[1], marg=marg, cush=cush, val=val, key=key_note,
                              nf=nf, na=na, bm=bm, bm_against=bm_against, lean=lean, score=score, result=result, fav=(side == fav_)))
    live_sides = sorted([z for z in SIDES if z['score'] is not None], key=lambda z: -z['score'])
    for i, z in enumerate(live_sides): z['rank'] = i + 1
    def sline(z): return f"{tl(z['side'])}**{z['side']} {z['lc']:+g}**"
    def verdict(z): return '⭐ Our five' if z['side'] in our5 else ('🔁 Alternate' if z['side'] in alts else ('Top 10' if z.get('rank', 99) <= 10 else '—'))
    # season record
    def grade_week(wk, card_):
        out = []
        box = {}
        for f in glob.glob(str(ROOT / 'data/fantasy/boxscores/espn-*.json')):
            try:
                d_ = json.load(open(f))
                if d_['header'].get('week') != wk: continue
                c0 = d_['header']['competitions'][0]
                if not c0.get('status', {}).get('type', {}).get('completed'): continue
                tt = {x['homeAway']: (ALIAS.get(x['team']['abbreviation'], x['team']['abbreviation']), int(x.get('score') or 0)) for x in c0['competitors']}
                for s_ in ('home', 'away'):
                    o_ = 'away' if s_ == 'home' else 'home'
                    box[tt[s_][0]] = (tt[s_][1], tt[o_][0], tt[o_][1], tt)
            except Exception: continue
        for p_ in card_:
            tm = ALIAS.get(p_['team'], p_['team']); sp = float(p_['spread'])
            if tm not in box: out.append(dict(pick=p_['spreadLabel'], result='?', final='')); continue
            ms, opp, os_, tt = box[tm]; mg = ms - os_ + sp
            res_ = 'Win' if mg > 0 else ('Push' if mg == 0 else 'Loss')
            note = 'missed by the hook (half point)' if res_ == 'Loss' and mg >= -0.5 else ('missed by a point or less' if res_ == 'Loss' and mg >= -1 else '')
            out.append(dict(pick=p_['spreadLabel'], matchup=p_['matchup'], result=res_, final=f"{tt['away'][0]} {tt['away'][1]}–{tt['home'][0]} {tt['home'][1]}", margin=mg, note=note))
        return out
    HIST = []
    for wk in range(1, W):
        cf = J(f'data/supercontest/locked-card-week-{wk}.json', None)
        if cf: HIST.append((wk, grade_week(wk, cf)))
    pts = lambda rs: sum(1 if r['result'] == 'Win' else 0.5 if r['result'] == 'Push' else 0 for r in rs)
    season_pts = sum(pts(rs) for _, rs in HIST); season_n = sum(len(rs) for _, rs in HIST)
    wins = sum(1 for _, rs in HIST for r in rs if r['result'] == 'Win'); losses = sum(1 for _, rs in HIST for r in rs if r['result'] == 'Loss'); pushes = sum(1 for _, rs in HIST for r in rs if r['result'] == 'Push')

    # links inside this report point to this report's own game boxes and expert panel
    SCX = set()
    for g in live:
        for r in EXP.get(g['id'], []):
            if r.get('pick_type') in ('spread', 'moneyline', 'teaser'): SCX.add(r.get('expert') or '?')
        for p_ in YT.get(g['id'], []):
            if yt_kind(p_) == 'Side': SCX.add(p_['speaker'])
    def glink(gid, text=None): return f'[{text or matchup(gid, False)}](#sc-game-{slug(gid)})' if gid else (text or '—')
    def link_sources(text, gid):
        t_ = esc(text)
        for pat_, rep_ in ABBR: t_ = re.sub(pat_, rep_, t_)
        t_ = t_.replace('The The Favorites', 'The Favorites')
        done_ = set()
        for name in sorted(SCX | set(ALIAS_EXP), key=len, reverse=True):
            tgt = ALIAS_EXP.get(name, name)
            if tgt not in SCX or tgt in done_: continue
            pat_ = r'(?<![\w>#-])' + re.escape(name) + r'(?![\w<])'
            if re.search(pat_, t_):
                t_ = re.sub(pat_, f'<a href="#scx-{slug(tgt)}">{name}</a>', t_, count=1); done_.add(tgt)
        return t_
    S = [logo_css(), f'# 🏆 NFL Week {W} SuperContest Intelligence Report', '## Spread-Only Contest Card: Our Five, Every Side Ranked, and the Game-by-Game Case',
         f'### Built {datetime.datetime.now(PT).strftime("%a %b %d %Y %H:%M PT")} — contest lines from {esc(scl.get("source", "the contest"))[:60]}; market lines Bookmaker (BKR) {D}', '',
         '<em>For our own contest review. Nothing here is a bet; SuperContest picks are made on the contest site.</em>', '']
    S += roll('sc-top', 'sc-rules', '📋 How the SuperContest works') + [
         '- **Five picks a week, against the contest\'s own point spreads** (locked for the whole week). No totals, moneylines or props: only sides.',
         '- **Scoring:** a win is 1 point, a push (lands exactly on the number) is ½, a loss is 0.',
         '- **Why the contest line matters:** the contest locks its lines early in the week, while sportsbook lines keep moving. When the contest gives our side a better number than the market does now, that is free value. When it gives a worse number, we are paying for it, and it matters most around **3 and 7**, the most common winning margins.'] + RE
    played = [z for z in SIDES if z['result']]
    S += roll('sc-top', 'sc-status', f'🚨 Contest status — Week {W}', True) + [
         f"- **Season so far:** {wins}–{losses}" + (f"–{pushes}" if pushes else '') + f" ({season_pts:g} of {season_n} points)" + ''.join(f" · Week {wk}: {sum(1 for r in rs if r['result']=='Win')}–{sum(1 for r in rs if r['result']=='Loss')}" for wk, rs in HIST) + '. [Review →](#sc-review)',
         f"- **Already played this week:** " + ('; '.join(f"{matchup(z['gid'], False)} — {z['side']} {z['lc']:+g} **{z['result']}**" for z in played if z['result'] == 'Win') or 'none') + '.',
         f"- **Our five:** " + ' · '.join(f"{tl(t_)}**{t_} {l_:+g}**" for t_, l_ in card_sc) + (f" (alternate: {card_alt[0][0]} {card_alt[0][1]:+g})" if card_alt else '') + '.',
         f"- **Contest line better than the market right now:** " + (', '.join(f"{z['side']} {z['lc']:+g} (market {z['lm']:+g})" for z in live_sides if (z['val'] or 0) > 0) or 'none') + '.',
         f"- **Key-number watch on our five:** " + (', '.join(f"{z['side']} {z['lc']:+g} {z['key']} vs the market ({z['lm']:+g})" for z in live_sides if z['side'] in our5 and z['key']) or 'none') + '.'] + RE

    # ⭐ Our five
    S += ['', '<a id="sc-our-five"></a>', '## ⭐ Our Five: The Platinum Rose Contest Card', '',
          'The five sides on this week\'s card, with the contest line, today\'s market line, our projected score and how much room it leaves, and the reasoning. Alternates and every other side are ranked in Section 1.', '']
    for t_, l_ in card_sc + card_alt:
        z = next((q for q in SIDES if q['side'] == t_ and abs(q['lc'] - l_) < 0.01), None) or next((q for q in SIDES if q['side'] == t_), None)
        if not z: continue
        tag = '⭐' if t_ in our5 else '🔁 Alternate:'
        head = f"{tag} {tl(t_)}{FULL_NAME(t_)} {z['lc']:+g} — {matchup(z['gid'], False)} · {z['g']['k'].astimezone(PT):%a %H:%M PT}" + (f" · projection {proj_txt(z['gid'])}" if proj_txt(z['gid']) else '')
        S += roll('sc-five', f"sc5-{slug(t_)}", head)
        S += ['| Contest line | Market now (BKR) | Line value | Our projected margin | Room vs contest line | Experts for – against | Big money | Stars |', '|---|---|---|---|---|---|---|---|',
              f"| {z['side']} {z['lc']:+g} | {('%+g (%+d)' % (z['lm'], z['lm_price'])) if z['lm'] is not None else '—'} | {('%+.1f' % z['val']) if z['val'] is not None else '—'}{(' · ' + z['key']) if z['key'] else ''} | {('%+g' % z['marg']) if z['marg'] is not None else '—'} | {('%+.1f' % z['cush']) if z['cush'] is not None else '—'} | {z['nf']} – {z['na']} | {'yes' if z['bm'] else ('against' if z['bm_against'] else '')} | {stars(z['lean']['conf']) if z['lean'] else '—'} |", '']
        note = SCNOTE.get(t_, '')
        if note: S += [f"🏆 **Why it's in our five:** {esc(note)}", '']
        w_ = gwhy(z['gid']); brk = gwhy(z['gid'], 'What breaks it')
        if w_: S += [f"🧠 **The case:** {link_sources(w_, z['gid'])}", '']
        if brk: S += [f"⚠️ **What breaks it:** {link_sources(brk, z['gid'])}", '']
        if z['key'].startswith('loses'): S += [f"🔑 **Key-number warning:** the market has this at {z['lm']:+g}, so the contest's {z['lc']:+g} costs us the half point around {z['key'].split()[-1]}. A {z['key'].split()[-1]}-point result is a win at the market number and a loss here.", '']
        S += [f"[Full game breakdown →](#sc-game-{slug(z['gid'])})"] + RE
    # pick sheet
    S += ['', '<a id="sc-pick-sheet"></a>', '### ✍️ Our pick sheet (Andy & Amanda)', '',
          'Tick the five sides you both agree on. It starts with Platinum Rose\'s five; change anything. The counter shows how many are picked, and **Copy our picks** copies the list so you can paste it into the contest site or a text. Picks are saved in this browser only.', '',
          '<div class="pick-sheet-bar rollup-controls"><span id="pick-count" class="bar-title">0 of 5 picked</span><button class="btn-toggle btn-primary" type="button" onclick="copyPicks()">Copy our picks</button><button class="btn-toggle" type="button" onclick="resetPicks()">Reset to our five</button><span id="pick-list" class="bar-hint"></span></div>', '',
          '| Pick | Side | Game | Kickoff (PT) | Room vs contest line | Line value | Experts | Verdict |', '|---|---|---|---|---|---|---|---|']
    for z in sorted(live_sides, key=lambda q: (q['g']['k'], q['gid'], not q['fav'])):
        lab = f"{z['side']} {z['lc']:+g}"
        S.append(f"| <input type='checkbox' class='sc-pick' data-side='{lab}' data-default='{1 if z['side'] in our5 else 0}' aria-label='{lab}'> | {sline(z)} | {glink(z['gid'])} | {z['g']['k'].astimezone(PT):%a %H:%M} | {('%+.1f' % z['cush']) if z['cush'] is not None else '—'} | {('%+.1f' % z['val']) if z['val'] is not None else '—'} | {z['nf']} – {z['na']} | {verdict(z)} |")
    # 1. every side ranked
    S += ['', '<a id="sc-ranked"></a>', '## 1. Every Side, Ranked for the Contest', '',
          'All the sides still to be played, ranked for this contest. Use the buttons to show only favorites or only underdogs; click a header to re-sort.', '']
    S += roll('sc-rank', 'sc-score-defs', '📖 How the contest ranking works') + [
         '- **Room vs contest line:** our projected margin for the side, compared with the contest spread. "+5.5" means our projection clears the contest line by 5½ points; negative means our projection does not cover.',
         '- **Line value:** how many points better (positive) or worse (negative) the contest line is than the sportsbook line right now. Getting on or off 3 or 7 counts extra.',
         '- **Experts:** how many named experts picked this side vs the other side.',
         '- **Big money:** where larger bettors are putting their money on the spread.',
         '- **The score** adds these up: room (capped at 7) + 1½× line value + ½ per net expert (up to ±3) ± ½ for big money and key numbers. It ranks sides against each other; it is not a win chance. Our projections are written estimates, not a computer model.'] + RE
    S += fbar('Type', ['Favorite', 'Underdog']) + ['| Rank | Side | Type | Game | Contest line | Market now | Line value | Room vs contest line | Experts for – against | Big money | Score | Verdict |', '|---|---|---|---|---|---|---|---|---|---|---|---|']
    for z in live_sides:
        S.append(f"| {z['rank']} | {sline(z)} | {'Favorite' if z['fav'] else 'Underdog'} | {glink(z['gid'])} | {z['lc']:+g} | {('%+g' % z['lm']) if z['lm'] is not None else '—'} | {('%+.1f' % z['val']) if z['val'] is not None else '—'}{(' · ' + z['key']) if z['key'] else ''} | {('%+.1f' % z['cush']) if z['cush'] is not None else '—'} | {z['nf']} – {z['na']} | {'💰' if z['bm'] else ''} | {z['score']:.1f} | {verdict(z)} |")
    # 2. contest vs market
    S += ['', '<a id="sc-market"></a>', '## 2. Contest Lines vs. the Market', '',
          'Where the contest line is better or worse than the sportsbook line right now, game by game. Positive value means the contest is giving that side extra points compared with the market.', '',
          '| Game | Contest line | Bookmaker now | Value side | Points of value | Key number | Line move this week |', '|---|---|---|---|---|---|---|']
    for x in scl['games']:
        gid = sc_gid(x)
        if not gid: continue
        zs = [z for z in SIDES if z['gid'] == gid]; f_ = next(z for z in zs if z['fav']); d_ = next(z for z in zs if not z['fav'])
        best = max(zs, key=lambda z: z['val'] or 0)
        o = OPEN.get(gid); b_ = G.get(gid) or {}
        mv = f"{f_['side']} {o['sp'].get(f_['side'], 0):+g} → {b_['sp'][f_['side']][0]:+g}" if o and f_['side'] in (b_.get('sp') or {}) and f_['side'] in o['sp'] else ''
        status = ' · 🏁 played' if f_['g']['done'] else ''
        S.append(f"| {glink(gid) if gid in ids else matchup(gid, False)}{status} | {f_['side']} {f_['lc']:+g} | {('%s %+g' % (f_['side'], f_['lm'])) if f_['lm'] is not None else '—'} | {(best['side'] if (best['val'] or 0) > 0 else 'even')} | {('%+.1f' % best['val']) if (best['val'] or 0) > 0 else '0'} | {best['key'] or f_['key'] or ''} | {mv} |")
    # 3. expert panel
    S += ['', '<a id="sc-experts"></a>', '## 3. The Expert Panel: Who Is on Which Side', '',
          'Every spread or moneyline pick a named expert made this week, lined up against our five. Moneyline picks count as the side (a team to win outright also covers as an underdog).', '']
    byx = collections.defaultdict(list)
    for g in live:
        for r in EXP.get(g['id'], []):
            if r.get('pick_type') not in ('spread', 'moneyline', 'teaser'): continue
            tm = teams_in(str(r.get('selection') or '')) & {g['visitor'], g['home']}
            if len(tm) == 1: byx[r.get('expert') or '?'].append((list(tm)[0], g['id'], r))
        for p_ in YT.get(g['id'], []):
            if yt_kind(p_) != 'Side': continue
            tm = teams_in(p_['pick']) & {g['visitor'], g['home']}
            if len(tm) == 2:
                pos = {t_: re.search(r'\b' + t_ + r'\b', p_['pick']) for t_ in tm}
                tm = {min((t_ for t_ in tm if pos[t_]), key=lambda t_: pos[t_].start())} if any(pos.values()) else tm
            if len(tm) == 1: byx[p_['speaker']].append((list(tm)[0], g['id'], dict(selection=p_['pick'])))
    S += ['| Expert | Sides picked this week | Agrees with our five | Disagrees with our five |', '|---|---|---|---|']
    for ex_, lst in sorted(byx.items(), key=lambda kv: -len(kv[1])):
        seen_ = []; [seen_.append(q) for q in lst if (q[0], q[1]) not in [(s0, s1) for s0, s1, _ in seen_]]
        agree = [q[0] for q in seen_ if q[0] in our5]
        disagree = [q[0] for q in seen_ if any(q[1] == z['gid'] and z['side'] in our5 and q[0] != z['side'] for z in SIDES)]
        S.append(f"| <span id='scx-{slug(ex_)}'></span>**{esc(ex_)}** | {' · '.join(tl(q[0]) + q[0] for q in seen_)} | {', '.join(agree) or '—'} | {', '.join(disagree) or '—'} |")
    # 4. game by game
    S += ['', '<a id="sc-games"></a>', '## 4. Game-by-Game Spread-Only Breakdowns', '',
          'Every game on the contest board, in kickoff order: the contest line, both sides\' room against it, and the case for each side.', ''] + controls('sc-game', 'games')
    for x in sorted(scl['games'], key=lambda x: next((g['k'] for g in sched if g['id'] == sc_gid(x)), datetime.datetime.max.replace(tzinfo=datetime.timezone.utc))):
        gid = sc_gid(x)
        if not gid: continue
        zs = [z for z in SIDES if z['gid'] == gid]; f_ = next(z for z in zs if z['fav']); d_ = next(z for z in zs if not z['fav'])
        g = f_['g']
        pick_tag = ''.join(f" · ⭐ {z['side']} {z['lc']:+g}" for z in zs if z['side'] in our5)
        if g['done']:
            win = next((z for z in zs if z['result'] == 'Win'), None)
            S += roll('sc-game', f"sc-game-{slug(gid)}", f"🏁 {matchup(gid)} — contest {f_['side']} {f_['lc']:+g} — FINAL" + (f" · {win['side']} covered" if win else ''))
            S += ['_Played before this build._'] + RE; continue
        S += roll('sc-game', f"sc-game-{slug(gid)}", f"🏈 {g['k'].astimezone(PT):%a %H:%M PT} — {matchup(gid)} — contest {f_['side']} {f_['lc']:+g}" + (f" · proj {proj_txt(gid)}" if proj_txt(gid) else '') + pick_tag)
        S += ['| | ' + tl(f_['side']) + f_['side'] + ' (favorite) | ' + tl(d_['side']) + d_['side'] + ' (underdog) |', '|---|---|---|',
              f"| Contest line | {f_['lc']:+g} | {d_['lc']:+g} |",
              f"| Market now (BKR) | {('%+g' % f_['lm']) if f_['lm'] is not None else '—'} | {('%+g' % d_['lm']) if d_['lm'] is not None else '—'} |",
              f"| Line value vs market | {('%+.1f' % f_['val']) if f_['val'] is not None else '—'} | {('%+.1f' % d_['val']) if d_['val'] is not None else '—'} |",
              f"| Our projected margin | {('%+g' % f_['marg']) if f_['marg'] is not None else '—'} | {('%+g' % d_['marg']) if d_['marg'] is not None else '—'} |",
              f"| Room vs contest line | {('%+.1f' % f_['cush']) if f_['cush'] is not None else '—'} | {('%+.1f' % d_['cush']) if d_['cush'] is not None else '—'} |",
              f"| Experts on this side | {f_['nf']} | {d_['nf']} |",
              f"| Big money on the spread | {'💰' if f_['bm'] else ''} | {'💰' if d_['bm'] else ''} |",
              f"| Contest rank | {f_.get('rank', '—')} | {d_.get('rank', '—')} |", '']
        for t_, body in (NAR.get(gid) or {}).get('secs', []):
            S += [f"**{ {'game script': '📖', 'why the card leans this way': '🧠', 'what breaks it': '⚠️'}.get(t_.lower(), '•') } {t_}**", '', link_sources(' '.join(body.split()), gid), '']
        sp_ex = [r for r in EXP.get(gid, []) if r.get('pick_type') in ('spread', 'moneyline', 'teaser')]
        if sp_ex:
            S += roll('sc-game-sub', f"sc-game-{slug(gid)}-experts", f"🎙️ Expert spread picks ({len(sp_ex)})") + [
                  f"- {link_sources(r.get('expert') or '?', gid)}: **{esc(r.get('selection'))}** {esc(r.get('line') or '')} — {esc(r.get('rationale'))[:150]}" for r in sp_ex] + RE
        trs = [z_ for z_ in TR if z_['gid'] == gid and z_['kind'] != 'Totals']
        if trs:
            S += roll('sc-game-sub', f"sc-game-{slug(gid)}-trends", f"📐 Trends pointing to a side ({len(trs)})") + [
                  f"- {esc(z_['txt'])[:200]} → **{esc(z_['pick'])[:50]}** ({link_sources(z_['src'], gid)})" for z_ in trs] + RE
        S += [f"[Full Master Intel write-up for this game →]({'nfl_week%d_master_betting_intelligence_summary.html' % W}#{gsid(gid)})"] + RE
    # 5. review + rules
    S += ['', '<a id="sc-review"></a>', '## 5. Season Review & Contest Rules of Thumb', '']
    for wk, rs in HIST:
        S += roll('sc-review', f"sc-week-{wk}", f"📉 Week {wk}: {sum(1 for r in rs if r['result']=='Win')}–{sum(1 for r in rs if r['result']=='Loss')}" + (f"–{sum(1 for r in rs if r['result']=='Push')}" if any(r['result']=='Push' for r in rs) else '') + f" ({pts(rs):g} pts)") + [
              '| Pick | Result | Final | Margin vs line | Note |', '|---|---|---|---|---|'] + [
              f"| {esc(r['pick'])} | {'✅' if r['result']=='Win' else '➖' if r['result']=='Push' else '❌'} {r['result']} | {r.get('final','')} | {('%+g' % r['margin']) if r.get('margin') is not None else ''} | {r.get('note','')} |" for r in rs] + RE
    hooks = [r for _, rs in HIST for r in rs if r.get('note')]
    S += ['', '**Rules of thumb we carry forward:**', '',
          '- **Contest-vs-market value first.** The one Week 1 winner was the pick with the best contest-vs-market number. Prefer sides where the contest gives more points than the market does now.',
          f"- **Respect 3 and 7.** " + (f"Last week {', '.join(r['pick'] for r in hooks)} lost by the half point." if hooks else 'Half points around 3 and 7 decide contest weeks.') + ' A contest line that is worse than the market by a half point around those numbers needs a clearly stronger case.',
          '- **Spread the risk.** Avoid stacking picks that all need the same thing to happen (for example several games that all depend on a backup quarterback struggling).',
          '- **Agreement is a tiebreaker, not a reason.** A lopsided expert count helps, but heavy public agreement can already be priced into the market line.']
    S += ['', '<a id="disclaimer"></a>',
          '<div class="legal-disclaimer" style="margin-top: 36px; padding: 16px 18px; border: 1px solid var(--border); border-radius: 8px; background: var(--highlight); font-size: 0.82rem; line-height: 1.55; color: var(--muted);"><strong style="color: var(--text);">⚖️ Disclaimer — for entertainment purposes only.</strong> This report is opinion and research for entertainment and informational purposes. It is not financial, investment, legal or betting advice, and no result is guaranteed. Lines, injuries and availability change. Any pick or wager is your own decision, made at your own risk: the author and Platinum Rose accept no responsibility or liability for any outcome arising from use of this report. Play only where it is legal for you, and only if you are of legal age. If gambling stops being fun, help is available at 1-800-GAMBLER.</div>']
    SC_ICON = {'rec': '⭐', '1': '📊', '2': '⚖️', '3': '🎙️', '4': '🏈', '5': '📉'}
    SC_PLAIN = {'rec': 'Our Five', '1': 'Every Side, Ranked', '2': 'Contest vs. Market', '3': 'The Expert Panel', '4': 'Game-by-Game', '5': 'Season Review'}
    SC_TIP = {'rec': 'The five contest picks on this week\'s card, each with the case for it, plus the pick sheet to settle your joint five.',
              '1': 'Every side still to be played, ranked for the contest by room against the line, contest-vs-market value, experts and big money.',
              '2': 'Where the contest\'s locked line is better or worse than the sportsbook line right now.',
              '3': 'Which named experts are on which sides, and where they agree or disagree with our five.',
              '4': 'Each game on the contest board: both sides\' numbers and the write-up.',
              '5': 'How our contest picks have done this season, and the lessons we carry forward.'}
    S, STOC = wrap_sections(S, icons=SC_ICON, names={'rec': 'Our Five — the Platinum Rose contest card'})
    sc_side = ('<div class="side-toc" id="side-toc"><div class="side-toc-title">Contents</div>'
               + ''.join(f'<a href="#{rid}" data-tip="{SC_TIP.get(num, "")}" onclick="document.body.classList.remove(\'toc-open\')"><span class="toc-ico">{SC_ICON.get(num, "📄")}</span><span class="toc-txt">{(num + ". ") if num[0].isdigit() else ""}{SC_PLAIN.get(num, name)}</span></a>' for rid, num, name in STOC)
               + '<a href="#sc-pick-sheet" data-tip="Tick your joint five and copy them."><span class="toc-ico">✍️</span><span class="toc-txt">Pick Sheet</span></a>'
               + '<a href="#disclaimer" data-tip="The fine print: for entertainment only; every pick is your own decision."><span class="toc-ico">⚖️</span><span class="toc-txt">Disclaimer</span></a></div>')
    sc_nav = ['<div class="global-rollup-bar" id="report-controls">', '  <span class="bar-title">⚡ Report Sections:</span>',
              '  <button class="btn-toggle btn-primary" onclick="toggleAllMainSections(true)">Expand All Sections</button>',
              '  <button class="btn-toggle" onclick="toggleAllMainSections(false)">Collapse All Sections</button>',
              '  <button class="btn-toggle" onclick="toggleAllRollups(true)">Open Everything</button>',
              '  <button class="btn-toggle" onclick="toggleAllRollups(false)">Close Everything</button>', '</div>', '']
    at = next(i for i, ln in enumerate(S) if ln.startswith('<a id="sc-our-five"'))
    S = [SIDE_CSS, sc_side, SIDE_BTN] + S[:at] + sc_nav + S[at:]
    stxt = '\n'.join(add_tooltips(S))
    stxt = re.sub(r'§\s?(\d+)', r'Section \1', stxt).replace('§', '')
    smd = out_dir / f'nfl_week{W}_supercontest_intelligence_summary.md'
    smd.write_text(stxt + '\n', encoding='utf-8')
    json.dump(dict(schema='supercontest_report_v1', season=a.season, week=W, built_at=datetime.datetime.now(PT).isoformat(), contest_lines_source=scl.get('source'),
                   our_five=[dict(team=t_, line=l_, note=SCNOTE.get(t_, '')) for t_, l_ in card_sc], alternates=[dict(team=t_, line=l_) for t_, l_ in card_alt],
                   season_record=dict(wins=wins, losses=losses, pushes=pushes, points=season_pts, weeks=[dict(week=wk, picks=rs) for wk, rs in HIST]),
                   sides=[{k: z[k] for k in ('gid', 'side', 'opp', 'lc', 'lm', 'marg', 'cush', 'val', 'key', 'nf', 'na', 'bm', 'score', 'result', 'fav')} | dict(rank=z.get('rank'), stars=(z['lean']['conf'] if z['lean'] else None)) for z in SIDES]),
              open(smd.with_suffix('.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False, default=_j)
    print(f'wrote {smd}')
    if not a.no_export:
        convert_summary.generate_docx(str(smd), str(smd.with_suffix('.docx')))
        convert_summary.generate_html(str(smd), str(smd.with_suffix('.html')))

if __name__ == '__main__':
    main()
