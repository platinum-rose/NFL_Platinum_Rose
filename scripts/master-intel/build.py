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
  optional  data/odds/actionnetwork-openers-<season>-w<NN>.json     (scripts/master-intel/actionnetwork_openers.py; preferred line-move baseline)
  optional  data/odds/BKR_Opening_lines_* (legacy BKR_current_lines_*) (opening-line history only; fallback baseline = earliest one for the week)
  optional  reports/bets/2026-w<NN>-card.md                           (card; "### <ticket> — <book> — **$x** — price" headings)
  optional  data/player-availability/latest.json, data/secondary-matchups/latest.json,
            data/nfl-rosters/roster-map-latest.json, data/survivor/*, data/research-intel/review/player-props-intel-latest.json
Outputs:
  dist/nfl_week<N>_master_packet/nfl_week<N>_master_betting_intelligence_summary.{md,html,docx}
"""
import argparse, math, base64, collections, datetime, glob, html, json, os, re, sys, zoneinfo
from pathlib import Path
import sc_review

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
    rules = ['.tl.tl-xl{width:72px;height:72px;margin:0;vertical-align:middle;}', '.tl{display:inline-block;width:20px;height:20px;background-size:contain;background-repeat:no-repeat;background-position:center;vertical-align:-4px;margin:0 4px 0 1px;}']
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
    try: return json.load(open(ROOT / p, encoding='utf-8'))
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

def _pnum(x):
    f = round(float(x), 1)
    return int(f) if f == int(f) else f

_POS_MAP = None
_NOT_PLAYERS = {'brandon anderson', 'steve fezzik', 'ross tucker', 'stuckey', 'andrew erickson', 'simon hunter', 'pat fitzmaurice', 'joe pisapia', 'matt perrault',
                'chad millman', 'doug kezirian', 'joe gibbs', 'matt moore', 'evan abrams', 'seth wilcox', 'scott bogman', 'brandon kravitz', 'kendra middleton',
                'collin wilson', 'sean koerner', 'rich hribar', 'warren sharp', 'chris welsh', 'dave tuley', 'terrell furman', 'ben solak', 'joe madden', 'seth woolcock'}
def _nkey(n):
    t = re.sub(r"[\.'’]", '', str(n).lower()).replace('-', ' ')
    t = re.sub(r'\b(jr|sr|ii|iii|iv)\b', '', t)
    return re.sub(r'\s+', ' ', t).strip()
_RM_POS = {}
def _pos_map():
    global _POS_MAP
    if _POS_MAP is not None: return _POS_MAP
    m = collections.defaultdict(set)
    try:
        d = json.loads((ROOT / 'data/nfl-rosters/espn-full-rosters-latest.json').read_text(encoding='utf-8'))
        for nm, lst in (d.get('players') or {}).items():
            for e in lst:
                if e.get('position'): m[_nkey(nm)].add((e.get('team'), e['position'], e.get('status') == 'active' or e.get('group') in ('offense', 'defense', 'specialTeam')))
    except Exception: pass
    try:
        d = json.loads((ROOT / 'data/nfl-rosters/roster-map-latest.json').read_text(encoding='utf-8'))
        for nm, e in (d.get('players') or {}).items():
            if e.get('position'):
                _RM_POS[_nkey(nm)] = e['position']
                if _nkey(nm) not in m: m[_nkey(nm)].add((e.get('team'), e['position'], True))
    except Exception: pass
    _POS_MAP = dict(m)
    return _POS_MAP
_NAME_CAND = re.compile(r"(?<![\w])[A-Z][A-Za-z'’\.\-]*(?: (?:[A-Z][A-Za-z'’\.\-]*|Jr\.|Sr\.|II|III|IV)){1,3}(?![\w])")
def _pos_for(k, teams):
    ent = _pos_map().get(k)
    if not ent: return None
    if k in _RM_POS: return _RM_POS[k]
    if teams:
        tt = set(teams) | ({'WSH'} if 'WAS' in teams else set()) | ({'WAS'} if 'WSH' in teams else set())
        sub = {e for e in ent if e[0] in tt}
        if sub: ent = sub
    act = {e for e in ent if e[2]}
    if act: ent = act
    ps = {e[1] for e in ent}
    return next(iter(ps)) if len(ps) == 1 else None
def posify(text, teams=None):
    """Append (POS) after each player named in narrative text, e.g. 'Saquon Barkley (RB)'. teams = the game's two team codes, used to pick between same-named players.
    Skips names already followed by a position and known expert names."""
    if not text: return text
    if not _pos_map(): return text
    out = []; last = 0
    for m in _NAME_CAND.finditer(text):
        toks = m.group(0).split(' ')
        for n in range(len(toks), 1, -1):
            sp = ' '.join(toks[:n])
            if sp.endswith('.') and not re.search(r'(\b(Jr|Sr)|\b[A-Z])\.$', sp): sp = sp[:-1]
            k = _nkey(sp)
            if k in _NOT_PLAYERS: continue
            pos = _pos_for(k, teams)
            if pos:
                end = m.start() + len(sp)
                if re.match(r'\s*\((?:[A-Z]{1,3})\)', text[end:end + 8]): break
                out.append(text[last:end]); out.append(f' ({pos})'); last = end
                break
    out.append(text[last:])
    return ''.join(out)

def load_narratives(path):
    """## AWAY@HOME blocks: 'projection: TEAM pts, TEAM pts' then ### subsections."""
    out = {}
    if not path.exists(): return out
    txt = re.sub(r'<!--.*?-->', '', path.read_text(encoding='utf-8'), flags=re.S)
    for blk in re.split(r'^## ', txt, flags=re.M)[1:]:
        head, _, body = blk.partition('\n'); gid = head.strip()
        m = re.search(r'^projection:\s*([A-Z]{2,3})\s+(\d+(?:\.\d+)?)\s*,\s*([A-Z]{2,3})\s+(\d+(?:\.\d+)?)', body, re.M)
        secs = [(t.strip(), posify(b.strip(), set(re.findall(r'[A-Z]{2,3}', gid)))) for t, b in re.findall(r'^### (.+?)\n(.*?)(?=^### |\Z)', body, re.M | re.S)]
        out[gid] = dict(proj=((m.group(1), _pnum(m.group(2))), (m.group(3), _pnum(m.group(4)))) if m else None, secs=secs)
    return out

def load_ticket_notes(path, block='TICKETS'):
    out = {}
    if not path.exists(): return out
    txt = re.sub(r'<!--.*?-->', '', path.read_text(encoding='utf-8'), flags=re.S)
    m = re.search(r'^## ' + block + r'\n(.*?)(?=^## |\Z)', txt, re.M | re.S)
    for ln in (m.group(1).splitlines() if m else []):
        mm = re.match(r'^- (.+?): (.+)$', ln.strip())
        if mm: out[mm.group(1).strip()] = posify(mm.group(2).strip())
    return out

def opening_lines(sched, season=None, week=None):
    """Opening line per game, used as the line-movement baseline.
    1st choice (since 2026-10-03, Andy): data/odds/actionnetwork-openers-<season>-w<NN>.json, written by
    scripts/master-intel/actionnetwork_openers.py (Action Network "Open" book, first line after the previous
    Sunday 5 PM PT re-open). 2nd choice, per game, when that file or game is missing: the earliest pasted BKR
    opening-line snapshot (new `BKR_Opening_lines_*` naming; historical `BKR_current_lines_*` names remain readable)
    whose date header matches the game's PT kickoff date. These archived snapshots are never the current market input.
    Every entry carries 'label', which the report prints so the reader knows where the opener came from."""
    want = {g['id']: g['k'].astimezone(PT).strftime('%b %d').upper() for g in sched}
    an = {}
    if season and week:
        anf = ROOT / f'data/odds/actionnetwork-openers-{season}-w{int(week):02d}.json'
        try: an = json.loads(anf.read_text(encoding='utf-8'))
        except Exception: an = {}
    an_out = {}
    for gid, v in (an.get('games') or {}).items():
        gid = '@'.join(ALIAS.get(t, t) for t in gid.split('@'))
        if gid not in want or not v.get('sp') or v.get('tot') is None: continue
        an_out[gid] = dict(src='AN-open', label=an.get('label', 'Action Network open') + (' (carried from before the re-open)' if v.get('carried_from_before_cutoff') else ''),
                           source='Action Network', sp={ALIAS.get(k, k): float(x) for k, x in v['sp'].items()}, tot=float(v['tot']),
                           ml={ALIAS.get(k, k): int(x) for k, x in (v.get('ml') or {}).items()})
    pat = re.compile(r'^(\w+) @ (\w+) \d+:\d+.*?\s(\w+) ([+-][\d.]+)[+-]\d+ / (\w+) ([+-][\d.]+)[+-]\d+\s+o([\d.]+)[+-]\d+ u[\d.]+[+-]\d+\s+(\w+) ([+-]\d+) (\w+) ([+-]\d+)')
    out = {}
    files = sorted(
        glob.glob(str(ROOT / 'data/odds/BKR_Opening_lines_*'))
        + glob.glob(str(ROOT / 'data/odds/BKR_current_lines_*')),
        key=os.path.getmtime,
    )
    for f in files:
        try: lines = open(f, encoding='utf-8').read().splitlines()
        except Exception: continue
        name = Path(f).name
        label = name.replace('BKR_Opening_lines_', '').replace('BKR_current_lines_', '')
        day = None
        for ln in lines:
            h = re.match(r'GAME LINES - (\w{3}) (\d+)', ln)
            if h: day = f'{h.group(1).upper()} {int(h.group(2)):02d}'; continue
            m = pat.match(ln.strip())
            if not m: continue
            aw, hm = ALIAS.get(m.group(1), m.group(1)), ALIAS.get(m.group(2), m.group(2)); gid = f'{aw}@{hm}'
            if gid in out or want.get(gid) != day: continue
            out[gid] = dict(src=label, label=f'Bookmaker paste {label}', source='Bookmaker', sp={ALIAS.get(m.group(3), m.group(3)): float(m.group(4)), ALIAS.get(m.group(5), m.group(5)): float(m.group(6))},
                            tot=float(m.group(7)), ml={ALIAS.get(m.group(8), m.group(8)): int(m.group(9)), ALIAS.get(m.group(10), m.group(10)): int(m.group(11))})
    out.update(an_out)
    return out

def split_sents(t):
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'\b((?:[A-Z]\.){2,})', lambda m_: m_.group(1).replace('.', '\x01'), t)
    for ab_ in ('Jr.', 'Sr.', 'vs.', 'St.', 'No.', 'Mr.', 'Dr.', 'Inc.'): t = t.replace(ab_ + ' ', ab_.replace('.', '\x01') + ' ')
    parts_ = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9(“"\'])', t)
    return [p_.replace('\x01', '.').strip() for p_ in parts_ if p_.strip()]

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
    b8a = ['', '### 📋 Prop reference boards: article picks and 2+ passing TD prices', ''] + [x for x in strip_controls(b8a) if not x.startswith('Reference boards for player props.')]
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
          '2': 'A pool of player props to build your own tickets, grouped by game, plus the prop reference boards (article picks and 2+ passing TD prices).',
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
          'background:var(--raised,var(--highlight));color:var(--text);border-left:4px solid var(--accent);font-size:1.08rem;letter-spacing:.01em;box-shadow:none;}'
          '.part-banner .pb-sub{opacity:.88;font-size:.86rem;font-weight:400;}.part-banner.part-b{border-left-color:var(--info,#38bdf8);}.part-banner.part-c{border-left-color:var(--muted);}'
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
            '.side-toc a{display:block;padding:6px 8px;border-radius:6px;color:var(--primary);text-decoration:none;line-height:1.3;}.side-toc a:hover{background:var(--raised,var(--highlight));}'
            '.side-toc-title{font-weight:700;margin:2px 8px 6px;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;}'
            '.side-toc a{display:flex;gap:8px;align-items:flex-start;}.toc-ico{flex:0 0 20px;text-align:center;}.toc-txt{flex:1 1 auto;}'
            '.side-tip{position:fixed;z-index:70;max-width:280px;background:#0f172a;color:#f8fafc;font-size:12.5px;line-height:1.45;padding:9px 11px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.25);pointer-events:none;display:none;}'
            '.toc-toggle{position:fixed;top:12px;left:12px;z-index:60;background:var(--accent,var(--primary));color:var(--on-accent,#fff);border:0;border-radius:999px;min-height:40px;padding:8px 16px;font-weight:800;font-size:13.5px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);}'
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
    short_gaps = [re.sub(r'(\s*\([^)]*/[^)]*\)|(?:[a-zA-Z0-9_\-\.]+/)+[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)', '', g_).strip().rstrip('.').replace('<', '&lt;') for g_ in gaps]  # banner: plain text, no file paths
    txt = '\n'.join(add_tooltips(L)).replace('__GAPS__', '; '.join(short_gaps) if short_gaps else 'none')
    txt = re.sub(r'§\s?(\d+)', r'Section \1', txt).replace('§', '')
    return txt

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--date', required=True)
    ap.add_argument('--season', type=int, default=2026); ap.add_argument('--no-export', action='store_true'); ap.add_argument('--allow-empty-card', action='store_true', help='build even with no synthesis digest and no card (the report will show 0 bets and an empty Props Lab)')
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
    # Andy may provide a newer rendered BKR game-lines board without a source capture
    # timestamp. Keep the raw DOM capture and its prop rows intact; overlay only the
    # spread/total/moneyline values, and preserve the user's provenance explicitly.
    bkr_user_board = J(f'data/generated/props/bookmaker-user-board-{D}-week{W}.json', {}) or {}
    pull = J(f'data/generated/master-intel/w{WW}-pull.json')
    if not pull: sys.exit(f'missing data/generated/master-intel/w{WW}-pull.json — run scripts/master-intel/pull.mjs --week {W}')
    roster = (J('data/nfl-rosters/roster-map-latest.json', {}) or {}).get('players', {})
    import market_captures
    beo_source, beo = market_captures.beo_rows(W, D)
    if not beo: gaps.append(f'No parsed BEO boards (data/generated/props/beo-w{WW}.json).')
    yt = J(f'data/podcasts/youtube-extracted-picks-2026-w{WW}.json', {}) or {}
    if not yt: gaps.append('No cleaned YouTube pick digest this week.')
    # W7+ YouTube files use a flat schema (team/player/market/side/line/price); normalize to the pick/raw shape used below
    for _p in (yt.get('picks', []) if yt else []):
        if 'pick' in _p: continue
        _mk, _sd, _ln = str(_p.get('market') or ''), str(_p.get('side') or ''), _p.get('line')
        _p['raw'] = {k: _p.get(k) for k in ('team', 'player', 'market', 'side', 'line', 'price')}
        if _mk in ('total', 'game_total'):
            _p['pick'] = f"{'Under' if _sd.upper().startswith('U') else 'Over'} {_ln if _ln is not None else ''}".strip()
        elif _mk in ('spread', 'teaser') and not _p.get('player'):
            _p['pick'] = f"{_sd or _p.get('team') or ''} {('%+g' % _ln) if isinstance(_ln, (int, float)) else (_ln or '')}".strip()
        else:
            _p['pick'] = ' '.join(str(x) for x in (_p.get('player') or _p.get('team'), _mk.replace('_', ' '), _sd, _ln) if x not in (None, ''))
        _ep = str(_p.get('episode') or '').replace('youtube-', '')
        _p.setdefault('timestamp_url', f"https://www.youtube.com/watch?v={_ep}&t={int(_p.get('source_timestamp') or 0)}s" if _ep else None)
        _p.setdefault('verify', None); _p.setdefault('show', _p.get('show') or 'YouTube'); _p.setdefault('speaker', _p.get('speaker') or 'YouTube')
    avail = (J('data/player-availability/latest.json', {}) or {}).get('events', [])
    sec = (J('data/secondary-matchups/latest.json', {}) or {}).get('matchups', [])
    dk_source, dk = market_captures.dkp_events(W, D)
    if dk_source is None:
        dkfiles = sorted(glob.glob(str(ROOT / f'data/generated/props/dk-predictions-{D}-*.json')))
        dk = [d_ for d_ in (json.load(open(f, encoding='utf-8')) for f in dkfiles) if isinstance(d_, dict) and 'away' in d_ and 'home' in d_ and 'rows' in d_]
    capture_sources = dict(BKR=dict(path=f'data/generated/props/bookmaker-live-{D}-week{W}.json', captured_at=bkr.get('capturedAt'), rows=len(bkr['rows'])),
                           BEO=dict(path=str(Path(beo_source).relative_to(ROOT)) if beo_source else None, captured_at=next((r.get('capturedAt') for r in beo if r.get('capturedAt')), None), rows=len(beo)),
                           DKP=dict(path=str(Path(dk_source).relative_to(ROOT)) if dk_source else None, captured_at=next((e.get('capturedAt') for e in dk if e.get('capturedAt')), None), rows=sum(len(e['rows']) for e in dk)))
    for book, meta in capture_sources.items(): print(f'CAPTURE {book}: {meta}')
    digest_p = next((p for p in [f'scratch/w{WW}-synthesis-digest-sat.md', f'scratch/w{WW}-synthesis-digest.md'] if (ROOT / p).exists()), None)
    card_p = f'reports/bets/{a.season}-w{WW}-card.md'
    card = (ROOT / card_p).read_text(encoding='utf-8') if (ROOT / card_p).exists() else ''
    if not digest_p and not card.strip() and not a.allow_empty_card:
        sys.exit(f'BUILD STOPPED: no synthesis digest (scratch/w{WW}-synthesis-digest*.md) and no card ({card_p}). '
                 'Without them the report renders the normal layout with 0 bets and an empty Props Lab. Run runbook step 7 '
                 '(agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md) first, or pass --allow-empty-card for a data-only build.')
    nar_p = f'reports/intel/master-intel-narratives-{a.season}-w{WW}.md'
    NAR = load_narratives(ROOT / nar_p)
    TNOTE = load_ticket_notes(ROOT / nar_p)
    SCNOTE = load_ticket_notes(ROOT / nar_p, 'SUPERCONTEST')
    OPEN = opening_lines(sched, a.season, W)

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
        G[f'{aw}@{hm}'] = dict(away=aw, home=hm, sp=sp, ml=ml, tot=tot, rows=rows,
                              line_source='Bookmaker rendered capture', line_capture_time=next((r.get('capturedAt') for r in gl if r.get('capturedAt')), bkr.get('capturedAt')))
    for _board_game in bkr_user_board.get('games', []):
        _gid = _board_game.get('game')
        if _gid not in G: continue
        _g = G[_gid]
        _g['sp'] = {t: (q.get('line'), q.get('odds')) for t, q in (_board_game.get('spread') or {}).items()}
        _g['ml'] = dict(_board_game.get('moneyline') or {})
        _tot = _board_game.get('total') or {}
        _g['tot'] = {s: (_tot.get('line'), _tot.get(f'{s.lower()}_odds')) for s in ('Over', 'Under')}
        _g['line_source'] = bkr_user_board.get('source', 'user-supplied BKR board')
        _g['line_capture_time'] = bkr_user_board.get('capture_time')
    def team_of(p):
        return (roster.get(p) or {}).get('team')

    # ---------- splits ----------
    SPL = {}
    for r in pull.get('splits', []):
        aw, hm = ALIAS.get(r['away_team'], r['away_team']), ALIAS.get(r['home_team'], r['home_team'])
        SPL[f'{aw}@{hm}'] = r
    # Fresher spread/total splits from a local, read-only refresh (agents/betting-splits-ingest.js --dry-run writes public/betting_splits.json
    # without touching Supabase). Overlay them on the pull's rows when the file is newer than the pull's capture; moneyline splits stay from the pull.
    try:
        _lf = ROOT / 'public' / 'betting_splits.json'
        _lc = json.loads(_lf.read_text(encoding='utf-8')); _lt = datetime.datetime.fromtimestamp(_lf.stat().st_mtime, tz=datetime.timezone.utc)
        _n_ov = 0
        for _k, _v in _lc.items():
            if not (isinstance(_v, dict) and _v.get('visitor') and _v.get('home') and '_' not in _k[:0] and re.fullmatch(r'\d+|[A-Z]+_[A-Z]+', _k)): continue
            _gid = f"{ALIAS.get(_v['visitor'], _v['visitor'])}@{ALIAS.get(_v['home'], _v['home'])}"
            if _gid not in SPL: continue
            try: _pt = datetime.datetime.fromisoformat(SPL[_gid]['captured_at'])
            except Exception: _pt = None
            if _pt is not None and _pt >= _lt: continue
            _ats = (_v.get('splits') or {}).get('ats') or {}; _tt = (_v.get('splits') or {}).get('total') or {}
            SPL[_gid] = dict(SPL[_gid], spread_home_bettors=_ats.get('homeTicket', 0), spread_home_money=_ats.get('homeMoney', 0),
                             total_over_bettors=_tt.get('overTicket', 0), total_over_money=_tt.get('overMoney', 0), captured_at=_lt.isoformat())
            _n_ov += 1
        if _n_ov: print(f'betting splits: overlaid fresher spread/total splits for {_n_ov} games from public/betting_splits.json ({_lt.astimezone(PT):%a %H:%M PT})')
    except Exception as _e:
        print('betting splits overlay skipped:', _e)
    if not SPL: gaps.append(f'No Action Network betting splits for Week {a.week} in the pull (game_splits has 0 rows); bets-vs-money bars and big-money signals are empty.')

    # ---------- consensus ----------
    ids = {g['id']: g for g in live}
    VOTES = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))  # gid -> source -> side counts
    PROPSIG = collections.defaultdict(lambda: collections.defaultdict(set))
    PROPSRC = collections.defaultdict(list)   # gid -> [(selection, who, url, outlet, why)]
    for r in pull['signals']:
        T = teams_in(' '.join(str(r.get(k) or '') for k in ('event_ref', 'team_or_market', 'lean')))
        for gid, g in ids.items():
            A, H = g['visitor'], g['home']
            if not ({A, H} & T): continue
            lean = f"{r.get('lean') or ''} {r.get('team_or_market') or ''}".lower(); who = (r.get('author') or r.get('source') or '?')[:28]
            if r['bet_type'] == 'total':
                side = 'Under' if 'under' in lean else ('Over' if 'over' in lean else None)
            elif r['bet_type'] == 'player_prop':
                PROPSIG[gid][esc(r.get('team_or_market'))[:60] + ' ' + esc(r.get('lean'))[:20]].add(who); PROPSRC[gid].append((f"{r.get('team_or_market') or ''} {r.get('lean') or ''}".strip(), (r.get('author') or r.get('source') or '?'), (r.get('event_ref') if str(r.get('event_ref') or '').startswith('http') else None), r.get('source') or '', r.get('rationale') or '')); continue
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
    # Verified picks (scripts/master-intel/verify_expert_rows.py, Andy 2026-10-03): when the file exists, consensus
    # counts, the expert registry and the per-expert section use ONLY picks checked against the actual matchup.
    VER = J(f'data/generated/master-intel/w{WW}-expert-verified.json')
    VROWS = [x for x in (VER or {}).get('rows', []) if x.get('verdict') == 'verified' and x.get('game') in ids] if VER else []
    def vwho(x): return (x.get('persons') or [None])[0] or x.get('outlet') or '?'
    if VER:
        VOTES = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
        PROPSIG = collections.defaultdict(lambda: collections.defaultdict(set))
        for x in VROWS:
            g_ = x['game']; who = vwho(x)[:28]
            if x['market'] in ('spread', 'moneyline', 'contest') and x.get('side') in g_.split('@'): VOTES[g_][who][x['side']] += 1
            elif x['market'] == 'total' and x.get('side') in ('Over', 'Under'): VOTES[g_][who][x['side']] += 1
            elif x['market'] == 'prop':
                PROPSIG[g_][esc(x.get('selection'))[:70]].add(who)
                PROPSRC[g_].append((str(x.get('selection') or ''), vwho(x), x.get('url'), x.get('outlet') or '', x.get('quote') or ''))
        CONS = collections.defaultdict(lambda: collections.defaultdict(set))
        for gid, bysrc in VOTES.items():
            for src, cnt in bysrc.items():
                for axis in (lambda k: k not in ('Over', 'Under'), lambda k: k in ('Over', 'Under')):
                    c = [(k, v) for k, v in cnt.items() if axis(k)]
                    if not c: continue
                    c.sort(key=lambda x: -x[1])
                    if len(c) > 1 and c[0][1] == c[1][1]: continue
                    CONS[gid][c[0][0]].add(src)
        rej = {(x.get('outlet'), str(x.get('selection')), str(x.get('line')), x.get('published')) for x in VER.get('rows', []) if x.get('kind') == 'expert_feed' and x.get('verdict') != 'verified'}
        for gid in list(EXP):
            EXP[gid] = [r for r in EXP[gid] if (r.get('expert'), str(r.get('selection') or ''), str(r.get('line')), r.get('created_at')) not in rej]
    else:
        gaps.append(f'No verified expert picks (data/generated/master-intel/w{WW}-expert-verified.json); consensus counts use unverified article matches. Run scripts/master-intel/verify_expert_rows.py.')
    YT = collections.defaultdict(list)
    for p in yt.get('picks', []):
        gm = p.get('game');
        if gm in ids: YT[gm].append(p)
    # analysis_notes (film study / matchup context, not bets) from the same digest: attach to a game when a named team is in it
    YTN = collections.defaultdict(list); YTN_GENERAL = []
    for n_ in (yt.get('analysis_notes', []) if yt else []):
        hit = [gid_ for gid_, g_ in ids.items() if (set(n_.get('teams') or []) & {g_['visitor'], g_['home']})]
        if hit:
            for gid_ in hit: YTN[gid_].append(n_)
        else: YTN_GENERAL.append(n_)

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
    LEANS = []; SOFT = []   # SOFT = digest section L: leans that did not clear the elevation bar (game cards / write-ups only)
    if digest_p:
        _dsec = ''
        for ln in (ROOT / digest_p).read_text(encoding='utf-8').splitlines():
            _m = re.match(r'^#{2,3}\s+([A-Z])\.', ln)
            if _m: _dsec = _m.group(1)
            _tbl = ln.lstrip().startswith('|')
            if _tbl and _dsec not in ('C', 'L'): continue   # table rows: C = Platinum Rose recommendations, L = leans only
            if _tbl and re.match(r'^\|[\s:|-]+\|?\s*$', ln.strip()): continue
            c = [x.strip() for x in re.sub(r'^\s*[-*]\s+', '', ln.strip().strip('|') if _tbl else ln).split('|')]
            if c and c[0]: c[0] = re.sub(r'\s*@\s*', '@', c[0].strip('`*'))
            if len(c) >= 5 and c[0] and re.match(r'^[A-Z]{2,4}@[A-Z]{2,4}$', c[0]) and c[-1]:
                (SOFT if (_tbl and _dsec == 'L') else LEANS).append(dict(game=c[0], market=c[1], lean=c[2], source=c[3], tier=c[4], note=(c[5] if len(c) > 5 else '')))
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
    # the picks may sit on the heading line ('## SuperContest — proposed five (contest lines): ARI −1.5, ...') or in a list under it
    sc_section = re.search(r'^## SuperContest\s*\n(.*?)(?=^## |\Z)', card_cur, re.M | re.S)
    picks = []
    alt_picks = []
    if sc_section:
        sec_text = sc_section.group(1)
        for l in sec_text.splitlines():
            bm = re.match(r'^[*-]\s+([A-Z]{2,3})\s+([+−-]?\d+(?:\.\d+)?)', l.strip())
            if bm: picks.append((bm.group(1), bm.group(2)))
        if not picks:
            picks = re.findall(r'\b([A-Z]{2,3}) ([+−-]\s?[\d.]+)', sec_text.split('Alternates')[0].split('(alt')[0])
        m_alt = re.search(r'Alternates:\s*(.*?)(?=\n\n|\n## |\Z)', sec_text, re.I)
        if m_alt:
            alt_picks = re.findall(r'([A-Z]{2,3})\s+([+−-]?\d+(?:\.\d+)?)', m_alt.group(1))
        elif '(alt:' in sec_text:
            alt_picks = re.findall(r'\(alt:\s*([A-Z]{2,3})\s*([+−-][\d.]+)\)', sec_text)
    sc_line = bool(picks)
    left_off = re.search(r'^## Left off and why\n(.*?)(?=^## |\Z)', card_cur, re.M | re.S)

    PROPWORDS = r'(\brec\b|\brush\b|pass TD|pass yds|\bTD\b|\bATD\b|T\+A|tackles|sacks|defensive|field goals?|kicking points|receptions|rec yds|completions|attempts|interceptions)'
    def is_prop_text(t): return bool(re.search(PROPWORDS, t, re.I)) and not re.search(r'\bML\b', t)
    def prop_kind(t):
        s_ = t.lower().replace('touchdowns', 'td').replace('touchdown', 'td').replace('passing td', 'pass td')
        if '1st td' in s_ or 'first td' in s_: return 'First TD'
        if re.search(r'2\+ td', s_) and 'pass' not in s_: return '2+ TDs'
        if 'pass td' in s_ or 'passing td' in s_: return 'Passing'
        if 'atd' in s_ or 'anytime' in s_ or re.search(r'\btd\b', s_): return 'Anytime TD'
        if re.search(r'field[ _]?goals?|kicking points?', s_): return 'Kicking'
        if 't+a' in s_ or re.search(r'tackle|sack|defensive', s_): return 'Defense'
        if 'rush' in s_: return 'Rushing'
        if 'rec' in s_ or 'receiving' in s_ or 'recept' in s_: return 'Receiving'
        if 'pass' in s_ or 'completion' in s_ or 'attempt' in s_ or 'interception' in s_: return 'Passing'
        return 'Other'
    def ticket_is_props(t): return bool(t['legs']) and (bool(re.search(r'Perfect Lottery|Core 7-Leg|Field-Goal Ticket|Pressure Ticket|IDP Tackles|^7[a-e] ', t['name'])) or sum(is_prop_text(l['market']) for l in t['legs']) * 2 > len(t['legs']))   # Prop Stack Agent tickets by name (2026-10-24)

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
        market_ = str(x.get('market') or '').strip().lower()
        if x['game'].startswith(('T+A', 'Pass TD')) or market_ in ('prop', 'player_prop', 'player prop', 'player props') or is_prop_text(market_): return 'Prop'
        if market_ in ('total', 'totals', 'game total', 'over/under', 'o/u') or re.match(r'^(?:over|under|[ou])\s*\d', str(x.get('lean') or ''), re.I) or re.match(r'^[UO]\d', market_, re.I): return 'Total'
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
    # show the actual number: 'spread / JAX' becomes 'JAX -2.5' (price in lean_disp), 'total / Under' becomes 'Under 42'
    for r_ in RANKED:
        r_['lean_disp'] = r_['lean']
        if r_['type'] in ('Side', 'Total'):
            m_ = re.match(r'^(.+?)\s*\(([+-]?\d+)\)\.?\s*(?:Risk:.*)?$', (r_.get('note') or '').strip())
            if m_:
                r_['market'] = m_.group(1).strip(); r_['price'] = m_.group(2)
                r_['lean_disp'] = f"{m_.group(1).strip()} ({m_.group(2)})"

    # ---- The Pitch / The Pushback for every Platinum Rose straight bet (Andy 2026-10-24: nothing is elevated without them) ----
    pitch_p = f'reports/intel/master-pitches-{a.season}-w{WW}.json'
    PITCH = (J(pitch_p, {}) or {}).get('picks', {})
    miss_pitch = [f"{r_['gid']} {r_['type']}" for r_ in RANKED if r_['type'] in ('Side', 'Total') and f"{r_['gid']}|{r_['type']}" not in PITCH]
    if miss_pitch: gaps.append(f'Platinum Rose recommendations without The Pitch / The Pushback in {pitch_p}: ' + ', '.join(miss_pitch))
    def pitch_block(gid_, typ_):
        th = PITCH.get(f'{gid_}|{typ_}')
        if not th: return []
        pre = f"pr-{slug(gid_)}-{typ_.lower()}"
        def cite(it):
            refs = it.get('ref', []); refs = refs if isinstance(refs, list) else [refs]
            return esc(it['text']) + ' ' + ' '.join(f'<sup><a href="#{pre}-src-{r}">[{r}]</a></sup>' for r in refs)
        out = []
        for key, title in (('pitch', '✅ The Pitch'), ('pushback', '⚠️ The Pushback')):
            out += roll('rec-thesis', f'{pre}-{key}', f"{title} — {esc(th.get('pick') or typ_)}")
            out += [f'- {cite(it)}' for it in th.get(key, [])] + ['', '</div>', '</details>', '']
        out += ['<div class="rec-thesis-sources" style="font-size:.85em;color:var(--muted)">'] + [f'<p id="{pre}-src-{k}"><b>[{k}]</b> {esc(v)}</p>' for k, v in (th.get('sources') or {}).items()] + ['</div>', '']
        return out

    # ---- Leans that did not clear the Platinum Rose bar (digest §L): listed on Picks / Ranked, clearly labelled (Andy 2026-10-24 9:06 PM) ----
    def soft_block(rid, cls):
        if not SOFT: return []
        rows_ = []
        for x_ in SOFT:
            gid_ = lean_gid(x_); typ_ = lean_type(x_)
            m_ = re.search(r'conf\s+(\d+(?:\.\d+)?)%', x_.get('source', ''))
            n_ = re.match(r'^(.*?)\s*\(([+-]?\d+)\)\.?\s*(?:Risk:\s*(.*))?$', (x_.get('note') or '').strip())
            pick_ = n_.group(1) if n_ else x_['lean']; px_ = n_.group(2) if n_ else ''; risk_ = (n_.group(3) or '') if n_ else ''
            rows_.append((kick.get(gid_) or datetime.datetime.max.replace(tzinfo=PT), f"| {glink(gid_) if gid_ in ids else esc(x_['game'])} | {typ_} | **{esc(pick_)}** | {esc(px_)} | {(m_.group(1) + '%') if m_ else '—'} | {esc(x_['tier'])} | {esc(risk_)} |"))
        rows_.sort(key=lambda t: t[0])
        return roll(cls, rid, f'🟡 Leans: not elevated to Platinum Rose recommendations ({len(SOFT)})') + [
            'These sides and totals have a model lean but did **not** clear the Platinum Rose evidence bar (model edge, an independent expert or sharp signal on the same side, and no serious contrary evidence). They are shown for reference and for building your own tickets; they carry no Pitch and are not our recommendations. Confidence is the simulator\'s cover/total probability from the per-game syntheses.', '',
            '| Game | Type | Lean | Price | Confidence | Tier | Risk |', '|---|---|---|---|---|---|---|'] + [r_ for _, r_ in rows_] + RE

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
    # ---- plain-English glossary (hover/tap) and expert-citation popups for the game write-ups ----
    GLOSS = [
        (r'SRS', 'SRS (Simple Rating System): a team\'s average scoring margin, adjusted for how strong its opponents were. +11.2 means about 11 points better than an average team; negative means worse than average.'),
        (r'(?:off(?:ensive)?\.? |def(?:ensive)?\.? )?EPA/play', 'EPA/play (Expected Points Added per play): how many points a team gains or loses on an average play compared with what is normal for that down, distance and field position. 0 is about average; higher is better for an offense, lower is better for a defense.'),
        (r'ATS', 'ATS (against the spread): the record against the point spread, not just wins and losses.'),
        (r'SU', 'SU (straight up): the plain win/loss record, ignoring the spread.'),
        (r'ML', 'ML (moneyline): a bet on which team wins outright, with no point spread.'),
        (r'FTN', 'FTN: a football analytics provider whose team ratings are one input to our model.'),
        (r'DVOA', 'DVOA: an efficiency rating that compares a team to league average, adjusted for opponent. Positive is better than average.'),
        (r'run offense efficiency', 'Run offense efficiency: how many points a team\'s rushing plays add compared with an average rushing play.'),
        (r'pace', 'Pace: how many plays a team runs. A faster pace means more possessions and usually more total points.'),
        (r'teasers?', 'Teaser: a parlay that moves each spread in your favor (6 points for the NFL) in exchange for a smaller payout.'),
        (r'hook', 'Hook: the half point on a spread or total (the .5 in 3.5). It decides games that land on a key number.'),
        (r'sharps?|sharp money', 'Sharp: a professional, high-limit bettor. "Sharp money" is bets from those bettors, which tend to move the line.'),
        (r'lines imply', 'The point spread and the total together imply a score. For example, a 3-point favorite in a 45-point game is implied to win about 24 to 21.'),
        (r'projected margin', 'Projected margin: how many points our projection says the winner wins by. It is our number, not the sportsbook\'s.'),
    ]
    _GLRX = re.compile(r'(?<![\w/>-])(' + '|'.join(f'(?P<g{i}>{p})' for i, (p, _) in enumerate(GLOSS)) + r')(?![\w-])')
    def gloss_html(text, seen):
        parts = re.split(r'(<[^>]*>|\x00\d+\x00)', text); out_ = []; in_a = False
        for pt in parts:
            if pt.startswith('<') or pt.startswith('\x00'):
                if pt.lower().startswith('<a '): in_a = True
                if pt.lower().startswith('</a'): in_a = False
                out_.append(pt); continue
            def _r(m_):
                i = next(k for k in range(len(GLOSS)) if m_.group(f'g{k}') is not None)
                if i in seen or in_a: return m_.group(0)
                seen.add(i)
                return f'<abbr class="gl" tabindex="0" data-tip="{html.escape(GLOSS[i][1], quote=True)}">{m_.group(0)}</abbr>'
            out_.append(_GLRX.sub(_r, pt))
        return ''.join(out_)
    def _trim(s_, n_=190):
        s_ = html.unescape(str(s_ or '')).strip()
        return esc(s_[:n_].rsplit(' ', 1)[0] + '…') if len(s_) > n_ else esc(s_)
    def cite_pop(gid_, name_, anchor_):
        nm_ = name_.lower(); al_ = ALIAS_EXP.get(name_, '').lower()
        def same(x_):
            x_ = (x_ or '').lower()
            return bool(x_) and (nm_ in x_ or x_ in nm_ or (al_ and (al_ in x_ or x_ in al_)))
        items = []
        for x in VROWS:
            if x['game'] != gid_: continue
            if any(same(p_) for p_ in (x.get('persons') or [])) or (not x.get('persons') and same(x.get('outlet'))):
                try: pk0_ = vpick(x)
                except NameError: pk0_ = str(x.get('selection') or '')
                items.append((pk0_, x.get('quote'), x.get('url'), x.get('outlet') or 'Article'))
        if not items:
            for r in EXP.get(gid_, []):
                if same(r.get('expert')): items.append((f"{r.get('selection') or ''} {r.get('line') or ''}".strip(), r.get('rationale'), r.get('url'), r.get('expert') + ' (expert feed)'))
            for p in YT.get(gid_, []):
                if same(p.get('speaker')):
                    show_ = str(p.get('show') or 'YouTube').split(' — ')[0].split(':')[0].strip()
                    items.append((f"{p.get('pick')} {p.get('price') or ''}".strip(), p.get('quote') or p.get('rationale'), p.get('timestamp_url'), f'{show_} (YouTube)'))
        h_ = f'<span class="cite-pop" role="tooltip"><b>{esc(name_)}</b> on this game'
        if not items: h_ += '<br>See their picks on this game below.'
        seen_ = set()
        for pk_, q_, u_, o_ in items[:3]:
            if (pk_, u_) in seen_: continue
            seen_.add((pk_, u_))
            h_ += f'<span class="cite-row"><b>{esc(pk_)}</b>' + (f'<i>“{_trim(q_)}”</i>' if q_ else '') \
                + (f'<a href="{html.escape(u_, quote=True)}" target="_blank" rel="noopener noreferrer">Source: {esc(str(o_)[:40])} ↗</a>' if u_ else f'<em>Source: {esc(str(o_)[:40])} (no public link)</em>') + '</span>'
        return h_ + f'<a class="cite-all" href="#{anchor_}">All their picks on this game →</a></span>'
    def src_pat(name):
        """Regex for a source name. A one-word alias ("Fezzik", "Ross", "Erickson") also takes the adjoining first/last
        name, so "Steve Fezzik" or "Ross Tucker" is linked whole instead of splitting the person's name around the link."""
        core = re.escape(name)
        if name in ALIAS_EXP:   # a first name may follow a tag (<strong>Steve Fezzik); an already-linked name ends in </a>, which (?![\w<]) skips
            return r'(?<![\w#-])((?:[A-Z][a-z]+ )?' + core + r'(?: [A-Z][a-z]+)?)(?![\w<])'
        return r'(?<![\w>#-])(' + core + r')(?![\w<])'
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
            pat_ = src_pat(name)
            if re.search(pat_, t_):
                t_ = re.sub(pat_, lambda m_: f'<a href="#{anch[name]}">{m_.group(1)}</a>', t_, count=1); done_.add(anch[name])
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
    # Emailed expert props (Andy dropped the file in docs/; picks parsed into data/generated/master-intel/w<NN>-email-props-*.json).
    # Each player is checked against the live ESPN roster map: the player must be on one of the two teams in the game, otherwise it is skipped and listed as a gap.
    for _ef in sorted(glob.glob(str(ROOT / f'data/generated/master-intel/w{WW}-email-props-*.json'))):
        try: _ed = json.loads(Path(_ef).read_text(encoding='utf-8'))
        except Exception as _e: gaps.append(f'Could not read {Path(_ef).name}: {_e}'); continue
        _who = _ed.get('author') or 'email'; _nadd = 0
        for _p in _ed.get('picks', []):
            _gid = _p['game']
            if _gid not in ids: gaps.append(f"{_who} email: {_p['player']} ({_gid}) is not on this week's slate, skipped."); continue
            _teams = {ALIAS.get(t, t) for t in _gid.split('@')} | set(_gid.split('@'))
            _cands = {ALIAS.get(c[0], c[0]) for c in _pos_map().get(_nkey(_p['player']), set())}
            if not (_cands & _teams):
                gaps.append(f"{_who} email: could not place {_p['player']} on {_gid} in the 2026 rosters (found: {', '.join(sorted(_cands)) or 'nobody'}), skipped. Needs a human check."); continue
            _why = (('⚠ ' + _p['flag'] + '. ') if _p.get('flag') else '') + (_p.get('why') or '')
            pool_add(_gid, _p['text'], _p.get('price') or '', _p.get('book') or '—', 'expert', _why, f"{_who} email")
            PROPSIG[_gid][esc(_p['text'])[:70]].add(_who); _nadd += 1
        print(f'{_who} email: {_nadd} props added to the prop pool')
        for p in YT.get(g['id'], []):
            if yt_kind(p) == 'Prop':
                pool_add(g['id'], p['pick'], str(p.get('price') or ''), '—', 'expert', ('⚠ ' + p['verify']) if p.get('verify') else f"{p['show'].split(' — ')[0]}", p['speaker'])
    # verified expert prop calls (podcasts, articles, pick feed): until 2026-10-04 the pool skipped these, which left it thin
    for x in VROWS:
        if x.get('market') != 'prop': continue
        sel_ = re.sub(r'^[^:]{3,40}:\s*', '', x.get('selection') or '').replace('season_', '').replace('player_', '').replace('_', ' ')
        who_ = ', '.join(x.get('persons') or []) or x.get('outlet') or 'expert'
        q_ = re.sub(r'^\[[^\]]*\]\s*', '', x.get('quote') or '')
        pool_add(x['game'], sel_, (f"{int(x['price']):+d}" if isinstance(x.get('price'), (int, float)) else ''), '—', 'expert (verified)',
                 esc(q_)[:120] + (f" [source]({x['url']})" if x.get('url') else ''), who_)
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
    def pt12(dt_): return dt_.astimezone(PT).strftime('%a %b %-d, %-I:%M %p PT') if os.name != 'nt' else dt_.astimezone(PT).strftime('%a %b %#d, %#I:%M %p PT')
    try: asof_txt = pt12(datetime.datetime.fromisoformat(bkr['rows'][0].get('capturedAt', '').replace('Z', '+00:00')))
    except Exception: asof_txt = f'{D}'
    L += [logo_css(), f'# 🏈 NFL Week {W} Master Betting Intelligence Report',
          "## What to bet this week, why we like it, and what every expert and betting market is saying",
          (f'### Built {pt12(datetime.datetime.now(PT))} · BKR prop snapshot as of {asof_txt}; game lines use Andy-supplied board (capture time not stated)' if bkr_user_board.get('games') else f'### Built {pt12(datetime.datetime.now(PT))} · Prices from Bookmaker as of {asof_txt} — always check the price on your bet slip'),
          '']
    L += roll('section-top', 'inputs-box', '🧾 Data inputs &amp; freshness — what this report was built from') + [
          '| Input | Coverage | Navigation & Details |', '|---|---|---|',
          f"| Bookmaker (BKR) props | {len(G)} games, {len(bkr['rows'])} rows from {asof_txt} | [Jump to Market Board](#board-defs) · [Game Dossier](#game-dossier) |",
          (f"| BKR game lines | {len(bkr_user_board.get('games', []))} games from Andy-supplied board; capture time not stated | Overlaid for market comparisons; raw DOM capture retained |" if bkr_user_board.get('games') else ''),
          f"| BetOnline (BEO) prop boards | {len({r['game'] for r in beo})} games, {len(beo)} lines | [Jump to Props Pool](#prop-pool) |",
          f"| DraftKings Predictions saves | {len(dk)} games, {capture_sources['DKP']['rows']} rows; contract prices before fees | [Jump to Quantitative Systems](#systems) |",
          *[f"| {book} capture provenance | {meta['captured_at'] or 'time not recorded'}; {meta['rows']} rows | {meta['path'] or 'legacy saved files'} |" for book, meta in capture_sources.items()],
          f"| Research signals / articles / expert picks | {len(pull['signals'])} / {len(pull['notes'])} / {len(pull['expert'])} | [View Sourced Articles ({len(pull['notes'])})](#sourced-articles) |",
          f"| Podcast transcripts & YouTube picks | {len(yt.get('picks', []))} picks, {len(yt.get('analysis_notes', []))} notes | [View Sourced Shows](#sourced-podcasts) · [Expert Registry](#expert-registry) |",
          f"| Betting splits (Action Network) | {len(SPL)} games | [Jump to Market Board](#board-defs) |",
          f"| Opening lines (line-movement baseline) | {', '.join(f'{n} games: {l}' for l, n in collections.Counter(o.get('label', o['src']) for g_, o in OPEN.items() if g_ in {x['id'] for x in live}).most_common()) or 'none'} | Verified opening numbers |"] + RE
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
    L += roll('section-top', 'slate-status-box', f'🚨 Slate Status — {datetime.datetime.now(PT).strftime("%a %b %d, %H:%M PT")}', False) + [
          '<div style="font-size: 0.9rem; margin-bottom: 10px;"><strong>What is the Slate Status?</strong> A quick snapshot of the news that changes how to read this report: games already played, quarterback changes, where the big-money bettors are putting their money, and players the sportsbook has taken off its menu (usually an injury or lineup question). Check it before placing anything.</div>',
          '<div class="status-banner" style="background: var(--bg); border: 1px solid var(--border); border-left: 5px solid var(--accent); padding: 14px 18px; border-radius: 10px; color: var(--text); font-size: 0.92rem; line-height: 1.55;">',
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
    def ticket_prop_estimate(t):
        if not ticket_is_props(t) or len(t.get('legs') or []) < 2: return None
        prices = []
        for leg in t['legs']:
            m_ = re.search(r'(?<!\d)([+-])\s*(\d{2,5})(?!\d)', str(leg.get('price') or ''))
            if not m_: return None
            a_ = int(m_.group(2)) * (1 if m_.group(1) == '+' else -1)
            prices.append(dec(a_))
        d_ = math.prod(prices)
        american_ = round((d_ - 1) * 100) if d_ >= 2 else -round(100 / (d_ - 1))
        return dict(decimal=d_, american=american_)

    def ticket_box(t, cls):
        out = roll(cls, t['id'], f"🎟️ {esc(t['disp'])} — {esc(t['book'])} — ${t['stake']} — {esc(t['price'])}")
        note = tnote(t)
        if note: out += [f"💬 **What it is and why:** {esc(note)}", '']
        est_ = ticket_prop_estimate(t)
        if est_:
            out += [f"**Independent-leg implied price:** ~{est_['american']:+d} (decimal {est_['decimal']:.2f}), multiplying the listed leg odds. Same-game correlation is not adjusted; this is an estimate, not the book's quoted payout. Request the live combo price.", '']
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
               '  <button class="btn-toggle btn-primary" data-filter="all">All</button>'] + [(f'  <button class="btn-toggle" data-filter="{o[0]}">{o[1]}</button>' if isinstance(o, tuple) else f'  <button class="btn-toggle" data-filter="{o}">{o}</button>') for o in opts]
        if sort_scope:
            out += [f'  <span class="bar-hint" style="margin-left: 12px;">Sort:</span>',
                    f'  <button class="btn-toggle group-sort btn-primary" data-scope="{sort_scope}" data-key="conf">Strongest first</button>',
                    f'  <button class="btn-toggle group-sort" data-scope="{sort_scope}" data-key="kick">Kickoff</button>',
                    f'  <button class="btn-toggle group-sort" data-scope="{sort_scope}" data-key="game">A–Z</button>']
        return out + ['</div>', '']
    L += ['', '<a id="recommendations"></a>', '## ⭐ Platinum Rose Recommendations: What to Bet This Week', '',
          'Everything Platinum Rose recommends this week, in one place. Prices are Bookmaker (BKR) or BetOnline (BEO) at capture time: **check the price on your slip before placing**. More stars = more evidence behind the bet ([how stars work](#confidence-defs)).', '']

    # At-a-glance picks banner: team logo + spread, or matchup logos + total, with quick links to full write-up
    glance_pills = []
    glance_kind = []
    seen_glance = set()
    for r_ in RANKED:
        gid_ = r_.get('gid')
        if not gid_ or gid_ not in ids: continue
        typ_ = r_.get('type') or lean_type(r_)  # market text is rewritten to 'Under 44' above, so re-deriving misreads totals as sides
        if typ_ == 'Side':
            A_, H_ = gid_.split('@')
            side_text = str(r_.get('lean_disp') or r_.get('lean') or '').strip()
            team_ = next((t_ for t_ in (A_, H_) if re.search(r'\b' + re.escape(t_) + r'\b', side_text, re.I)), None)
            if not team_: continue
            if (gid_, team_) in seen_glance: continue
            spr_ = re.sub(r'^SC\s+', '', side_text)
            pill_id = f"pill-pick-{slug(gid_)}-{slug(team_)}"
            glance_pills.append(
                f'<div class="at-glance-item" id="{pill_id}">'
                f'<a href="#{gsid(gid_)}" class="at-glance-pill" title="Click to view full game write-up">{tl(team_)}<span>{team_} {spr_[len(team_):].strip()}</span></a>'
                f'<button class="bm-btn pill-bm-btn" type="button" data-pick="{spr_}" data-ctx="{gid_}" data-page="{gsid(gid_)}" title="Add {spr_} to your weekend card">'
                f'<span class="bm-icon">☆</span><span class="bm-text">+ Card</span></button></div>'
            )
            seen_glance.add((gid_, team_))
            glance_kind.append('Side')
        elif typ_ == 'Total' and '@' in gid_:
            if (gid_, 'Total') in seen_glance: continue
            A_, H_ = gid_.split('@')
            pm_ = re.search(r'\b(Over|Under|[OU])\s*(\d+(?:\.\d)?)', str(r_.get('lean_disp') or r_.get('lean') or r_.get('market', '')), re.I)
            if pm_:
                s_txt = 'Under' if pm_.group(1).upper().startswith('U') else 'Over'
                tot_lbl = f"{s_txt} {pm_.group(2)}"
            else:
                tot_lbl = str(r_.get('lean_disp') or r_.get('lean') or r_.get('market', ''))
            pill_id = f"pill-pick-{slug(gid_)}-total"
            glance_pills.append(
                f'<div class="at-glance-item" id="{pill_id}">'
                f'<a href="#{gsid(gid_)}" class="at-glance-pill" title="{FULL_NAME(A_)} @ {FULL_NAME(H_)} total · view full game write-up">{tl(A_)}<small>{A_}</small> @ {tl(H_)}<small>{H_}</small><span>{tot_lbl}</span></a>'
                f'<button class="bm-btn pill-bm-btn" type="button" data-pick="{tot_lbl}" data-ctx="{gid_}" data-page="{gsid(gid_)}" title="Add {tot_lbl} to your weekend card">'
                f'<span class="bm-icon">☆</span><span class="bm-text">+ Card</span></button></div>'
            )
            seen_glance.add((gid_, 'Total'))
            glance_kind.append('Total')

    if glance_pills:
        L += [
            '<div class="at-a-glance-bar">',
            '  <div class="at-a-glance-header">',
            '    <span class="at-a-glance-title">⚡ At-a-Glance Card Leans &amp; Quick Links</span>',
            '    <span style="font-size: 11.5px; color: var(--muted);">Tap pick for write-up · Tap <b>+ Card</b> to build your weekend card</span>',
            '  </div>',
        ]
        for _k, _lbl in (('Side', 'Sides'), ('Total', 'Totals')):
            _grp = [p for p, k in zip(glance_pills, glance_kind) if k == _k]
            if _grp:
                L += [f'  <div class="glance-group-label">{_lbl} <span>({len(_grp)})</span></div>', '  <div class="at-a-glance-pills">'] + [f'    {p}' for p in _grp] + ['  </div>']
        L += ['</div>', '']

    straight = [r for r in RANKED if r['type'] in ('Side', 'Total')]
    # 2026-10-04 (Andy): a lean written as 'NYJ +3.5 -103 / NYJ ML +167' becomes two rows, a Spread and an ML, so the
    # Moneylines filter shows only moneylines. An underdog ML says plainly that it is a price play (usually a leg of the
    # dog round robin), not a call that the team wins, when our projection has it losing.
    dogrr = next((t for t in TK if 'dog' in t['name'].lower()), None)
    dogrr_teams = {lg['market'].split()[0] for lg in (dogrr['legs'] if dogrr else [])}
    def split_rows(r):
        parts = [x.strip() for x in r['market'].split(' / ') if x.strip()]
        out_ = []
        for part in parts:
            if r['type'] == 'Total':
                typ = 'Total'
            elif re.search(r'\bML\b', part):
                typ = 'ML'
            else:
                typ = 'Spread'
            if re.match(r'^[+−-]', part) and r['lean']:
                part = f"{r['lean']} {part}"
            note = ''
            pm = re.search(r'\bML\s*([+−-]\d+)', part)
            pj = (NAR.get(r['gid']) or {}).get('proj')
            if typ == 'ML' and pm and pj:
                od = int(pm.group(1).replace('−', '-'))
                pts = dict(pj); team = r['lean']; opp = next((t_ for t_ in pts if t_ != team), None)
                if opp and team in pts and pts[team] < pts[opp] and od > 0:
                    imp = 100 / (od + 100) * 100
                    note = (f"Underdog moneyline: our projection has {opp} winning by {pts[opp] - pts[team]}, so this is a price play, not a call that {team} wins. "
                            f"At {od:+d} it only needs to win about {imp:.0f}% of the time"
                            + (", and it is one of the six legs of the Dog-ML round robin." if team in dogrr_teams else ".") + ' ')
            out_.append(dict(r, market=part, type=typ, note=note))
        return out_
    rows_all = [x for r in straight for x in split_rows(r)]
    bygame = collections.OrderedDict()
    for r in rows_all: bygame.setdefault(r['gid'], []).append(r)
    L += roll('section-rec', 'rec-straight', f'✅ Straight bets: spreads, moneylines &amp; totals — {len(rows_all)} bets in {len(bygame)} games') + [
          'Grouped by game. Filter to spreads, moneylines or totals, and sort by strength, kickoff or name. Open a game for our projected score and the reasoning.', '']
    L += fbar('Type', ['Spread', 'ML', 'Total'], 'rec-games', 'rec-games') + ['<div id="rec-games">']
    for gid, rs in bygame.items():
        best = max(r['conf'] for r in rs); k_ = kick.get(gid)
        head = f"{matchup(gid)} — " + ' · '.join(f"{esc(r['market'])} ({r['conf']:.1f}★)" for r in rs) + (f" — {k_.astimezone(PT):%a %H:%M PT}" if k_ else '')
        L += [f'<details class="rollup-box section-rec filter-group sort-group" id="rec-{slug(gid)}" data-conf="{best:.2f}" data-kick="{k_.isoformat() if k_ else ""}" data-game="{gid}">', f'<summary>🏈 {head}</summary>', '<div class="rollup-content">', '',
              '| Type | Pick | Lean | Confidence | Why |', '|---|---|---|---|---|'] + [
              f"| {r['type']} | **{esc(r['market'])}** | {esc(r['lean_disp'])} | {stars(r['conf'])} | {('<strong>' + esc(r['note']) + '</strong>') if r.get('note') else ''}{link_sources(r['source'], gid)} <em>({esc('; '.join(r['conf_why']))})</em> |" for r in rs]
        for r in rs:
            _pt = {'Spread': 'Side', 'Side': 'Side', 'ML': 'Side', 'Total': 'Total'}.get(r['type'])
            if _pt: L += [''] + pitch_block(gid, _pt)
        if proj_txt(gid): L += ['', f"🎯 **Our projected score:** {proj_txt(gid)}"]
        if gwhy(gid): L += ['', f"🧠 **Why:** {esc(gwhy(gid))}"]
        L += ['', f"[Full game write-up →](#{gsid(gid)}) · [all expert picks →](#experts-{slug(gid)})"] + RE
    L += ['</div>'] + RE
    L += soft_block('rec-leans', 'section-rec')
    singles = [t for t in TK if not ticket_is_props(t) and t['name'].lower().startswith('single')]
    parl = [t for t in TK if not ticket_is_props(t) and t not in singles]; stacks = [t for t in TK if ticket_is_props(t)]
    if singles:
        L += roll('section-rec', 'rec-singles', f'🎯 Singles — {len(singles)} bets') + ['One bet, one result: no parlay math. These are the card\'s highest-margin single reads.', '']
        for t in singles: L += ticket_box(t, 'section-tickets')
        L += RE
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
    if picks:
        alt_str = (' Alternate if a pick is unavailable: **' + ' · '.join(f'{t_} {l_}' for t_, l_ in alt_picks) + '**.') if alt_picks else ''
        L += roll('section-rec', 'rec-supercontest', f'🏆 SuperContest 5 — {" · ".join(t_ + " " + l_ for t_, l_ in picks)}') + [
              'Five picks against the contest\'s locked spreads (only covering the spread counts).' + alt_str, '',
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
            L.append(f"- **{esc(r['lean_disp'] if r['type'] != 'Prop' else r['market'] + ' → ' + r['lean'])}** · {r['type']} · {glink(r['gid'], (r['gid'] or '') + ' breakdown') if r['gid'] else ''} · confidence {stars(r['conf'])}")
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
        mkt_clean = re.sub(r'\bATD\b', 'Anytime TD', r['market'])
        L.append(f"| {i+1} | {r['type']} | {glink(r['gid']) if r['gid'] else esc(r['game'])} | {esc(mkt_clean)} | {esc(r['lean_disp'])} | {stars(r['conf'])} | {esc(r['tier'])} | {link_sources(r['source'], r['gid'])} |")
    L += [''] + soft_block('ranked-leans', 'section-1')
    L += ['', '<a id="card-tickets"></a>', '### 🎟️ Card tickets', '', 'All tickets, with what each one is, why it is on the card and every leg, are in the [Parlays &amp; round robins](#rec-parlays) and [Player prop stacks](#rec-props) boxes at the top of the report.', '']
    kinds = ['Tackles+Assists', 'Defense', 'Kicking', 'Rushing', 'Receiving', 'Passing', 'Anytime TD', 'First TD', '2+ TDs']
    def prop_category(p):
        return {'First TD': ('TDs', '🏈 Touchdowns (Anytime / First / 2+)'), 'Anytime TD': ('TDs', '🏈 Touchdowns (Anytime / First / 2+)'),
                '2+ TDs': ('TDs', '🏈 Touchdowns (Anytime / First / 2+)'),
                'Passing': ('Passing', '🎯 Passing (Yards / TDs / Completions)'), 'Rushing': ('Rushing', '🏃 Rushing (Yards / Attempts)'),
                'Receiving': ('Receiving', '🙌 Receiving (Yards / Receptions)'), 'Tackles+Assists': ('DEF', '🛡️ Defense (Tackles + Assists)'),
                'Defense': ('DEF', '🛡️ Defense (Tackles / Sacks / Interceptions)'), 'Kicking': ('Kicking', '🦵 Kicking (Field Goals / Points)')}.get(
                p.get('kind'), ('Other', '⚡ Other Markets'))

    cat_order = ['TDs', 'Passing', 'Rushing', 'Receiving', 'DEF', 'Kicking', 'Other']
    pool_games = [g for g in live if POOL.get(g['id'])]
    # ---- card §7f (props by position, every game) and §7g (ATD per team / first TD per game), Andy 2026-10-24 ----
    def _card_tables(head_re):
        m_ = re.search(r'^## ' + head_re + r'.*?$(.*?)(?=^## |\Z)', card_cur, re.M | re.S)
        if not m_: return None, []
        txt_ = m_.group(1); intro_ = next((l for l in txt_.split('\n') if l.strip() and not l.startswith('|') and not l.startswith('#')), '')
        return intro_, txt_
    PBP = []
    _intro, _txt = _card_tables(r'7f\.')
    if _txt:
        _rows = [[c.strip() for c in l.strip().strip('|').split('|')] for l in _txt.split('\n') if l.startswith('|') and not re.match(r'^\|[\s:|-]+\|$', l.strip())]
        _hdr, _rows = _rows[0], _rows[1:]
        _byg = collections.OrderedDict()
        for r_ in _rows: _byg.setdefault(r_[0], []).append(r_)
        PBP += roll('section-2', 'props-by-position', f'🧩 Props by position — every game ({len(_rows)} props: QB / RB / WR / TE / K / IDP)', True) + [esc(_intro).replace('**', '**'), '']
        for gid_, rs_ in _byg.items():
            cnt_ = collections.Counter(r_[1] for r_ in rs_)
            PBP += roll('section-2 pbp-game', f'pbp-{slug(gid_)}', f"{matchup(gid_) if gid_ in ids else esc(gid_)} — " + ' · '.join(f"{k} {cnt_[k]}" for k in ('QB','RB','WR','TE','K','IDP') if cnt_.get(k)))
            PBP += ['| Pos | Player | Prop | Price | Book | Tier | Source | Why / flag |', '|---|---|---|---|---|---|---|---|'] + [f"| {r_[1]} | **{r_[2]}** | {r_[3]} | {r_[4]} | {r_[5]} | {r_[6]} | {r_[7]} | {r_[8]} |" for r_ in rs_] + ['', f"[Full game write-up →](#{gsid(gid_)})" if gid_ in ids else '', '</div>', '</details>', '']
        PBP += ['</div>', '</details>', '']
    _intro, _txt = _card_tables(r'7g\.')
    if _txt:
        _td = re.sub(r'^### (.+)$', r'**\\1**', _txt.replace(_intro, '', 1), flags=re.M)
        PBP += roll('section-2', 'td-menu', '🏈 Touchdown menu — one anytime TD per team, one first TD per game', True) + [_intro, '', _td, '', '</div>', '</details>', '']
    L += ['', '<a id="prop-pool"></a>'] + PBP + ['### 🧰 Build your own: actionable props pool', '',
          'Every player prop that is on the card, in a card lean, called by a named expert, or rated tier 1 by the article feed, grouped by prop category and then by matchup so you can build your own stacks. **"Card"** rows passed our build rules; **"expert"** rows are calls we have not checked ourselves.', '',
          '**Jump to a category:** ' + ' · '.join(f"[{lab} ({sum(1 for g in pool_games for p in POOL[g['id']] if prop_category(p)[0] == ck)})](#props-cat-{ck.lower()})" for ck, lab in (('TDs','Touchdowns'),('Passing','Passing'),('Rushing','Rushing'),('Receiving','Receiving'),('DEF','Defense'),('Kicking','Kicking'),('Other','Other')) if any(prop_category(p)[0] == ck for g in pool_games for p in POOL[g['id']])), '']
    _kc = collections.Counter(p['kind'] for g in pool_games for p in POOL[g['id']])
    _missing = [k for k in kinds if not _kc.get(k)]
    if _missing: L += [f"*No {', '.join(m.replace('+', ' + ') for m in _missing)} props are in this week's pool, so those filters are hidden. Captured-board gaps are not a recommendation to invent a line.*", '']
    L += fbar('Type', [(k, f'{k} ({_kc[k]})') for k in kinds if _kc.get(k)], 'prop-pool-tables') + [
          '<div class="rollup-controls">', "  <button class=\"btn-toggle\" onclick=\"toggleRollups('section-pool', true)\">Open all games</button>",
          "  <button class=\"btn-toggle\" onclick=\"toggleRollups('section-pool', false)\">Close all games</button>", '</div>', '', '<div id="prop-pool-tables">']

    # grouped by prop category first, then by matchup inside each category
    cat_tot = collections.Counter()
    for g in pool_games:
        for p in POOL[g['id']]: cat_tot[prop_category(p)[0]] += 1
    cat_lbl = {}
    for g in pool_games:
        for p in POOL[g['id']]:
            ck_, cl_ = prop_category(p); cat_lbl.setdefault(ck_, cl_)
    anchored = set()
    for ck in cat_order:
        if not cat_tot.get(ck): continue
        L += [f'<details class="rollup-box section-pool prop-cat-box" id="props-cat-{ck.lower()}" open>',
              f'<summary>{cat_lbl[ck]} — {cat_tot[ck]} props across {sum(1 for g in pool_games if any(prop_category(p)[0] == ck for p in POOL[g["id"]]))} games</summary>',
              '<div class="rollup-content">']
        for g in pool_games:
            cat_props = [p for p in POOL[g['id']] if prop_category(p)[0] == ck]
            if not cat_props: continue
            anc = ''
            if g['id'] not in anchored:
                anchored.add(g['id']); anc = f'<a id="props-{slug(g["id"])}"></a>'
            L += [f'{anc}<details class="rollup-box section-pool filter-group prop-subcat-box" id="props-{slug(g["id"])}-{ck.lower()}">',
                  f'<summary style="font-size:13.5px;font-weight:650;background:var(--raised);padding:7px 12px;margin:6px 0;border-radius:6px;">{matchup(g["id"])} · {g["k"].astimezone(PT):%a %H:%M PT} ({len(cat_props)})</summary>',
                  '<div class="rollup-content" style="padding-top:4px;">', '',
                  '| Type | Prop | Price | Book | Tier / source | Why |', '|---|---|---|---|---|---|'
            ] + [
                f"| {p['kind']} | {esc(re.sub(r'\\bATD\\b', 'Anytime TD', p['text']))} | {esc(p['price'])} | {esc(p['book'])} | {esc(p['tier'])} ({esc(p['src'])[:40]}) | {p['why'] if '](' in p['why'] else esc(p['why'])[:140]} |" for p in cat_props
            ] + ['', f"[Full game write-up →](#{gsid(g['id'])})", '</div>', '</details>']
        L += ['</div>', '</details>']
    L += ['</div>', '', '---']

    # ---------------- 2. Market board ----------------
    def bar(x):
        x = max(0, min(100, int(x or 0)))
        return f'<span style="display:inline-block;width:64px;height:8px;border-radius:4px;vertical-align:middle;margin-right:6px;background:linear-gradient(90deg,var(--primary) 0 {x}%,var(--border) {x}% 100%);"></span>{x}%'
    L += ['', '<a id="synth-engine-section"></a>', '## 2. Platinum Rose Market-Implied Forecast Board', ''] + controls('section-board', 'Market Board') + [
          '**What the betting lines are predicting.** Every point spread and total is really a forecast. Put the two together and you get the final score the sportsbook expects; the moneylines give each team\'s chance of winning. Next to that is **our own projected score** (from the game write-ups in [§7](#section-7-box)) and **where the bets and the money are landing**, on both sides of every market.', '']
    # ---- line movement, betting splits, steam and reverse-line-movement flags (open -> now) ----
    def mv_info(gid_):
        g_ = next((x_ for x_ in live if x_['id'] == gid_), None); b_ = G.get(gid_); o_ = OPEN.get(gid_)
        if not g_ or not b_: return None
        A_, H_ = g_['visitor'], g_['home']; sp_ = SPL.get(gid_) or SPL.get(gid_.replace('WAS', 'WSH')) or {}
        out_ = dict(gid=gid_, A=A_, H=H_, flags=[], size=0.0, when='', spl=None, sp_txt='', tot_txt='', ml_txt='')
        hb_ = sp_.get('spread_home_bettors'); hm_ = sp_.get('spread_home_money'); ob_ = sp_.get('total_over_bettors'); om_ = sp_.get('total_over_money')
        mb_ = sp_.get('ml_home_bettors'); mm_ = sp_.get('ml_home_money')
        if sp_:
            try: out_['when'] = datetime.datetime.fromisoformat(sp_['captured_at']).astimezone(PT).strftime('%a %I:%M %p PT').replace(' 0', ' ')
            except Exception: pass
            out_['spl'] = dict(hb=hb_, hm=hm_, ob=ob_, om=om_, mb=mb_, mm=mm_)
        nowH = (b_['sp'].get(H_) or (None, None))[0]; nowT = (b_['tot'].get('Over') or (None, None))[0]
        openH = o_ and o_['sp'].get(H_); openT = o_ and o_.get('tot')
        if nowH is not None and openH is not None:
            d_ = nowH - openH; out_['sp_txt'] = f"{H_} {openH:+g} → {nowH:+g}" if abs(d_) > 0.01 else f"{H_} {nowH:+g} (no move)"
            out_['sp_d'] = d_
            if abs(d_) >= 1: out_['flags'].append(('Big move', f"The spread moved {abs(d_):g} points toward {H_ if d_ < 0 else A_} since the open."))
            if hb_ is not None and abs(d_) >= 0.5:
                tow_ = H_ if d_ < 0 else A_; tb_ = hb_ if tow_ == H_ else 100 - hb_; tm_ = hm_ if tow_ == H_ else 100 - (hm_ or 0)
                if tb_ <= 45: out_['flags'].append(('RLM', f"Reverse line movement: the line moved toward {tow_} even though only {tb_}% of bets are on {tow_} (the public is on the other side)."))
                if abs(d_) >= 1 and tm_ is not None and tm_ - tb_ >= 10: out_['flags'].append(('Steam', f"Steam (proxy): the spread moved {abs(d_):g}+ toward {tow_} and {tow_} has {tm_}% of the money against {tb_}% of the bets."))
            out_['size'] += abs(d_)
        if nowT is not None and openT is not None:
            d_ = nowT - openT; out_['tot_txt'] = f"{openT:g} → {nowT:g}" if abs(d_) > 0.01 else f"{nowT:g} (no move)"
            out_['tot_d'] = d_
            if abs(d_) >= 1.5: out_['flags'].append(('Big move', f"The total moved {abs(d_):g} points {'up' if d_ > 0 else 'down'} since the open."))
            if ob_ is not None and abs(d_) >= 0.5:
                tow_ = 'Over' if d_ > 0 else 'Under'; tb_ = ob_ if tow_ == 'Over' else 100 - ob_; tm_ = om_ if tow_ == 'Over' else 100 - (om_ or 0)
                if tb_ <= 45: out_['flags'].append(('RLM', f"Reverse line movement: the total moved toward the {tow_} although only {tb_}% of bets are on the {tow_}."))
                if abs(d_) >= 1.5 and tm_ is not None and tm_ - tb_ >= 10: out_['flags'].append(('Steam', f"Steam (proxy): the total moved {abs(d_):g}+ toward the {tow_} and the {tow_} has {tm_}% of the money against {tb_}% of the bets."))
            out_['size'] += abs(d_) * 0.6
        if o_ and b_['ml']:
            ml_ = []
            for t_ in (A_, H_):
                if t_ in o_.get('ml', {}) and t_ in b_['ml'] and o_['ml'][t_] != b_['ml'][t_]: ml_.append(f"{t_} {o_['ml'][t_]:+d} → {b_['ml'][t_]:+d}")
            out_['ml_txt'] = ' · '.join(ml_)
        out_['open_label'] = (o_ or {}).get('label', '')
        return out_
    def mv_badges(m_, tip=True):
        ic_ = {'Steam': '🚂 Steam', 'RLM': '↩️ RLM', 'Big move': '📈 Big move'}
        seen_ = set(); parts_ = []
        for k_, t_ in m_['flags']:
            if k_ in seen_: continue
            seen_.add(k_)
            parts_.append(f'<span class="mv-badge mv-{k_.replace(" ", "").lower()}" title="{html.escape(" ".join(t2_ for k2_, t2_ in m_["flags"] if k2_ == k_), quote=True)}">{ic_[k_]}</span>')
        return ' '.join(parts_)
    def splits_strip(gid_):
        m_ = mv_info(gid_)
        if not m_ or not m_['spl']: return None
        s_ = m_['spl']; A_, H_ = m_['A'], m_['H']
        def side_(lbl_, bt_, mn_):
            bt_ = int(bt_ or 0); mn_ = int(mn_ or 0); big_ = ' spl-big' if mn_ - bt_ >= 15 else ''
            return (f'<div class="spl-row{big_}"><span class="spl-side">{esc(lbl_)}</span>'
                    f'<span class="spl-bar spl-bets" title="{bt_}% of bets"><i style="width:{bt_}%"></i><em>{bt_}%</em></span>'
                    f'<span class="spl-bar spl-money" title="{mn_}% of money"><i style="width:{mn_}%"></i><em>{mn_}%</em></span></div>')
        def cell_(title_, rows_): return f'<div class="spl-cell"><b>{title_}</b>{"".join(rows_)}</div>'
        cells_ = [cell_('Spread', [side_(A_, 100 - s_['hb'], 100 - s_['hm']), side_(H_, s_['hb'], s_['hm'])]),
                  cell_('Total', [side_('Over', s_['ob'], s_['om']), side_('Under', 100 - s_['ob'], 100 - s_['om'])]),
                  cell_('Moneyline', [side_(A_, 100 - s_['mb'], 100 - s_['mm']), side_(H_, s_['mb'], s_['mm'])])]
        mv_ = ' · '.join(x_ for x_ in (('Spread ' + m_['sp_txt']) if m_['sp_txt'] else '', ('Total ' + m_['tot_txt']) if m_['tot_txt'] else '') if x_)
        return (f'<div class="spl-strip"><div class="spl-head">📊 <b>Latest betting splits</b> <span class="spl-when">Action Network, {m_["when"]}</span> {mv_badges(m_)}</div>'
                f'<div class="spl-key"><span class="spl-k spl-kb"></span> % of bets <span class="spl-k spl-km"></span> % of money <span class="spl-note">(highlighted row = money beats bets by 15+ points)</span></div><div class="spl-cells">{"".join(cells_)}</div>' + (f'<div class="spl-mv">Line movement since the open: {esc(mv_)}</div>' if mv_ else '') + '</div>')
    def sec_callout(gid_):
        g_ = next((x_ for x_ in live if x_['id'] == gid_), None)
        if not g_: return ''
        rows_ = []
        for off_, de_ in ((g_['visitor'], g_['home']), (g_['home'], g_['visitor'])):
            m_ = SEC.get((off_, de_))
            if m_ and str(m_.get('vulnerability_tier')).lower() in ('high', 'medium'):
                tg_ = [str((x.get('player_name') or x.get('name') or '?') if isinstance(x, dict) else x) for x in (m_.get('target_receivers') or [])[:3]]
                tier_ = str(m_['vulnerability_tier']).upper()
                rows_.append(f'<div class="sec-row sec-{tier_.lower()}"><span class="sec-badge">{tier_} · {m_.get("severity_score")}</span>'
                             f'<div class="sec-body"><b>{tl(off_)}{off_} passing offense vs {tl(de_)}{de_} defense</b>'
                             + (f'<div class="sec-targets">Targets: ' + ''.join(f'<span class="sec-chip">{esc(t_)}</span>' for t_ in tg_) + '</div>' if tg_ else '') + '</div></div>')
        if not rows_: return ''
        return ('<div class="sec-callout"><div class="sec-title">🎯 Secondary matchup edges <span>our matchup data; use for Over leans and receiver or QB yardage props</span></div>' + ''.join(rows_)
                + '<div class="sec-note">HIGH means the defense is the most beatable through the air for this offense; severity is our score (higher is more exploitable). Check inactives before betting a target.</div></div>')
    def game_top(gid_):
        g_ = next((x_ for x_ in live if x_['id'] == gid_), None); b_ = G.get(gid_)
        if not g_ or not b_: return None
        A_, H_ = g_['visitor'], g_['home']
        def sp_(t_):
            v_ = b_['sp'].get(t_); return f"{v_[0]:+g} ({v_[1]:+d})" if v_ and v_[0] is not None else '—'
        def ml_(t_):
            v_ = b_['ml'].get(t_); return f"{v_:+d}" if v_ is not None else '—'
        ov_ = b_['tot'].get('Over'); un_ = b_['tot'].get('Under')
        tA_ = f"O {ov_[0]:g} ({ov_[1]:+d})" if ov_ and ov_[0] is not None else '—'; tH_ = f"U {un_[0]:g} ({un_[1]:+d})" if un_ and un_[0] is not None else '—'
        qbs_ = {team_of(r['player']): r['player'] for r in b_['rows'] if r['market'] == 'pass_yds'}
        tbl_ = ('<table class="mkt-lines"><thead><tr><th></th>' f'<th>{A_}</th><th>{H_}</th></tr></thead><tbody>'
                f'<tr><th>Spread (BKR)</th><td>{sp_(A_)}</td><td>{sp_(H_)}</td></tr>'
                f'<tr><th>Moneyline</th><td>{ml_(A_)}</td><td>{ml_(H_)}</td></tr>'
                f'<tr><th>Total</th><td>{tA_}</td><td>{tH_}</td></tr>'
                f'<tr><th>QB (BKR markets)</th><td>{esc(qbs_.get(A_, "?"))}</td><td>{esc(qbs_.get(H_, "?"))}</td></tr></tbody></table>')
        big = lambda t_: f'<div class="gh-team"><span class="tl tl-{t_.lower()} tl-xl" title="{FULL_NAME(t_)}"></span><b>{t_}</b><small>{FULL_NAME(t_)}</small></div>'
        return '<div class="gh">' + big(A_) + '<div class="gh-mid">' + tbl_ + '</div>' + big(H_) + '</div>' + (splits_strip(gid_) or '') + sec_callout(gid_)
    def mv_tables():
        rows_ = [mv_info(g_['id']) for g_ in live if not g_.get('done')]
        rows_ = [r_ for r_ in rows_ if r_]
        sig_ = sorted([r_ for r_ in rows_ if r_['flags']], key=lambda r_: -r_['size'])
        out_ = ['**What moved since the open.** Sorted by size of the move. 🚂 **Steam** = a big move with the money on the side the line moved toward. ↩️ **RLM** (reverse line movement) = the line moved toward the side with the *minority* of bets. '
                '📈 **Big move** = the spread moved 1+ point or the total 1.5+. We only have the opening line and the current line, not timestamps, so "Steam" is a proxy for a sharp-style move, not a confirmed multi-book steam move.', '']
        hdr_ = ['| Game | Spread (home) open → now | Total open → now | Moneyline | Bets / money (spread, total) | Signals |', '|---|---|---|---|---|---|']
        def rowf(r_):
            s_ = r_['spl']
            sp_c = f"{r_['H']} {s_['hb']}% / {s_['hm']}% · Over {s_['ob']}% / {s_['om']}%" if s_ else 'no splits'
            return f"| {glink(r_['gid'])} | {esc(r_['sp_txt']) or '—'} | {esc(r_['tot_txt']) or '—'} | {esc(r_['ml_txt']) or '—'} | {sp_c} | {mv_badges(r_) or '—'} |"
        if sig_: out_ += hdr_ + [rowf(r_) for r_ in sig_]
        else: out_ += ['No game has moved enough to flag since the open.']
        quiet_ = [r_ for r_ in rows_ if not r_['flags']]
        if quiet_: out_ += ['', '<details class="rollup-box section-synth"><summary>Games with no significant move (' + str(len(quiet_)) + ')</summary><div class="rollup-content">', ''] + hdr_ + [rowf(r_) for r_ in quiet_] + ['', '</div>', '</details>']
        any_open_ = next((r_['open_label'] for r_ in rows_ if r_['open_label']), '')
        if any_open_: out_ += ['', f'Opening lines: {esc(any_open_)}. Splits: Action Network, most recent pull.']
        return out_
    L += roll('section-synth', 'line-moves', '📡 Line movement and betting splits: steam &amp; reverse line movement', True) + mv_tables() + RE
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
        L.append(f"| {g['k'].astimezone(PT):%a %H:%M} | {glink(gid)} | {f} {s_:+g} | {t} | {imps} | {proj_txt(gid)} | {wp} | {spc} | {toc_} | {sig_short(gid)} |")
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
          '| Rank | Game | Consensus side | BKR spread quote | For – Against | Strength | Total lean | BKR total quote | Details |', '|---|---|---|---|---|---|---|---|---|']
    for i, (m_, n1, g, side, fr, ag) in enumerate(ranked):
        c_ = CONS.get(g['id'], {}); u, o = c_.get('Under', set()), c_.get('Over', set())
        if len(u) == len(o) and u:
            tlean = f"Split (Over {len(o)} / Under {len(u)})"
        else:
            tlean = f"Under ({len(u)})" if len(u) > len(o) else (f"Over ({len(o)})" if o else '—')
        market_ = G.get(g['id']) or {}
        def _bkr_spread(team_):
            q_ = (market_.get('sp') or {}).get(team_)
            return f"{team_} {q_[0]:+g} ({q_[1]:+d})" if q_ and q_[0] is not None and q_[1] is not None else (f"{team_} {q_[0]:+g}" if q_ and q_[0] is not None else '—')
        if n1 == len(ag) and n1:
            bkr_side = f"{_bkr_spread(g['visitor'])} / {_bkr_spread(g['home'])}"
        else:
            bkr_side = _bkr_spread(side) if n1 else '—'
        if len(u) == len(o) and u:
            bkr_total = ' / '.join(f"{lab_} {q_[0]:g} ({q_[1]:+d})" if q_ and q_[0] is not None and q_[1] is not None else f"{lab_} {q_[0]:g}" if q_ and q_[0] is not None else f"{lab_} —" for lab_, q_ in [('Over', (market_.get('tot') or {}).get('Over')), ('Under', (market_.get('tot') or {}).get('Under'))])
        elif tlean.startswith('Under') or tlean.startswith('Over'):
            lab_ = 'Under' if tlean.startswith('Under') else 'Over'
            q_ = (market_.get('tot') or {}).get(lab_)
            bkr_total = f"{lab_} {q_[0]:g} ({q_[1]:+d})" if q_ and q_[0] is not None and q_[1] is not None else (f"{lab_} {q_[0]:g}" if q_ and q_[0] is not None else '—')
        else:
            bkr_total = '—'
        det = [f"[game](#{gsid(g['id'])})", f"[experts](#experts-{slug(g['id'])})"] + ([f"[breakdown](#consensus-{g['id'].lower().replace('@', '-')})"] if n1 >= 2 else [])
        L.append(f"| {i+1} | {glink(g['id'])} | {('split ' + g['visitor'] + '/' + g['home']) if n1 and n1 == len(ag) else (side if n1 else '—')} | {bkr_side} | {n1} – {len(ag)} | <span data-sort='{BRANK[badge(n1, len(ag), m_)] * 100 + max(0, m_)}'>{badge(n1, len(ag), m_)}</span> | {tlean} | {bkr_total} | {' · '.join(det)} |")
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
            if x['gid'] == g['id']: L.append(f"* **Platinum Rose recommendation:** {esc(x['lean_disp'] if x['type'] != 'Prop' else x['market'] + ' → ' + x['lean'])} (confidence {stars(x['conf'])})")
        for x in SOFT:
            if lean_gid(x) == g['id']: L.append(f"* **Lean only (not a Platinum Rose recommendation):** {esc((x.get('note') or x['lean']).split('. Risk:')[0])}")
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
              f"| {i+1} | **{esc(r['market'])}** | {esc(r['lean_disp'])} | {glink(r['gid']) if r['gid'] else esc(r['game'])} | {stars(r['conf'])} | {esc('; '.join(r['conf_why']))} | {link_sources(r['source'], r['gid'])} |" for i, r in enumerate(rs)] + ROLL_END
    if VROWS:
        def vpick(x):
            m_, sd, ln = x['market'], x.get('side'), x.get('line')
            lnt = (f" {float(ln):+g}" if m_ in ('spread', 'contest', 'teaser') else f" {float(ln):g}") if ln not in (None, '') else ''
            if m_ == 'pass': return 'Pass (no play on this game)'
            if m_ in ('spread', 'contest', 'teaser'): return f"{sd}{lnt}" + {'contest': ' (contest pick)', 'teaser': ' (teaser leg)'}.get(m_, '')
            if m_ == 'moneyline': return f"{sd} to win" + (f" ({float(x['price']):+.0f})" if x.get('price') not in (None, '') else '')
            if m_ == 'total': return f"{sd}{lnt}"
            sel = re.sub(r'\b(season_|player_)', '', str(x.get('selection') or '')).replace('_', ' ')
            return sel + (f" ({float(x['price']):+.0f})" if x.get('price') not in (None, '') and m_ == 'prop' else '')
        BYX = collections.defaultdict(list)
        for x in VROWS:
            if x['market'] not in ('spread', 'moneyline', 'total', 'teaser', 'contest', 'prop', 'pass'): continue   # futures, parlays, win totals
            for who in (x.get('persons') or [x.get('outlet') or '?']): BYX[who].append(x)
        # the same pick heard on a podcast and logged in the registry is one pick with two sources
        for who, xs in BYX.items():
            merged = {}
            for x in xs:
                mk_ = 'spread' if x['market'] in ('spread', 'contest') else x['market']
                k = (x['game'], mk_, str(x.get('side')), str(x.get('line')), (x.get('players') or [''])[0] if mk_ == 'prop' else '')
                if k in merged:
                    y = merged[k]; y['best_bet'] = y.get('best_bet') or x.get('best_bet'); y['contest'] = y.get('contest') or x.get('contest')
                    y['_srcs'].append(x); continue
                merged[k] = dict(x, _srcs=[x])
            BYX[who] = list(merged.values())
        order = sorted(BYX, key=lambda k: (-sum(1 for x in BYX[k] if x.get('best_bet') or x.get('contest')), -len(BYX[k]), k))
        L += ['', '<a id="expert-best-bets"></a>', "### ⭐ Every expert's picks this week", '',
              f"All {len(VROWS)} verified Week {W} picks, grouped by expert. ⭐ = the expert called it a best bet (or it came from a best-bets show); 🏆 = a contest pick (SuperContest, Splash, Six-Pack). "
              "Every pick here passed the matchup check (right teams, this week, a line that fits the game, a player on one of the two rosters); "
              f"rejected picks are listed in `reports/intel/expert-verification-{a.season}-w{WW}.md`. Where a pick has an outlet but no named person, it's filed under the outlet.", '']
        for who in order:
            xs = sorted(BYX[who], key=lambda x: (not (x.get('best_bet') or x.get('contest')), kick.get(x['game']) or datetime.datetime.max.replace(tzinfo=datetime.timezone.utc), x['market']))
            nb = sum(1 for x in xs if x.get('best_bet')); nc = sum(1 for x in xs if x.get('contest'))
            L += roll('section-4', f"bx-{slug(who)}", f"🎙️ {esc(who)} — {len(xs)} pick{'s' if len(xs) != 1 else ''}" + (f" · ⭐ {nb}" if nb else '') + (f" · 🏆 {nc}" if nc else ''))
            L += ['| | Game | Pick | Why (their words) | Source |', '|---|---|---|---|---|']
            for x in xs:
                mk_ = ('⭐' if x.get('best_bet') else '') + ('🏆' if x.get('contest') else '')
                def one_src(y):
                    t_ = esc(html.unescape(str(y.get('outlet') if y.get('kind') != 'expert_feed' else f"{y.get('outlet')} registry")))[:48]
                    return f"[{t_}]({y['url']})" if y.get('url') else t_
                srcs = x.get('_srcs') or [x]
                quote_ = max((html.unescape(y.get('quote') or '') for y in srcs), key=len)
                L.append(f"| {mk_} | {glink(x['game'])} | **{esc(vpick(x))}** | {esc(quote_)[:220]} | {' · '.join(dict.fromkeys(one_src(y) for y in srcs))} |")
            L += ['', '</div>', '</details>']
    # ---------- expert reasoning narratives (hand/agent-written, reports/intel/expert-narratives-<season>-w<NN>.md) ----------
    xn_p = ROOT / f'reports/intel/expert-narratives-{a.season}-w{WW}.md'
    if xn_p.exists():
        _xn = xn_p.read_text(encoding='utf-8').splitlines()
        L += ['', '<a id="expert-narratives"></a>', "### 🧠 Why the experts like what they like: narrative summaries", '']
        _intro, _i = [], 0
        while _i < len(_xn) and not _xn[_i].startswith('## '):
            if _xn[_i].strip() and not _xn[_i].startswith('# ') and _xn[_i].strip() != '---': _intro.append(_xn[_i])
            _i += 1
        L += _intro + ['']
        _open = False
        for ln in _xn[_i:]:
            if ln.strip() == '---': continue
            if ln.startswith('## '):
                if _open: L += ['', '</div>', '</details>']; _open = False
                L += ['', f"#### {ln[3:].strip()}", '']
            elif ln.startswith('### '):
                if _open: L += ['', '</div>', '</details>']
                L += roll('section-4', f"xn-{slug(ln[4:].strip())[:60]}", f"🧠 {esc(ln[4:].strip())}"); _open = True
            else:
                L.append(ln)
        if _open: L += ['', '</div>', '</details>']
        L += ['']
    else:
        gaps.append(f'No expert narrative summaries ({xn_p.relative_to(ROOT).as_posix()}).')
    EXPERT_SHOW = {'Ross Tucker': 'Even Money', 'Steve Fezzik': 'Even Money', 'Steve Fezzick': 'Even Money',
                   'Chad Millman': 'Sharp or Square', 'Simon Hunter': 'Sharp or Square', 'Sharp or Square': 'Sharp or Square',
                   'Matt Perrault': 'BettingPros', 'Joe Pisapia': 'BettingPros', 'Pat Fitzmaurice': 'BettingPros', 'Andrew Erickson': 'BettingPros',
                   'Scott Bogman': 'BettingPros', 'Seth Wilcox': 'BettingPros', 'Terrell Furman Jr.': 'BettingPros', 'BettingPros': 'BettingPros',
                   'Brandon Anderson': 'Action Network', 'Evan Abrams': 'Action Network', 'Stuckey': 'Action Network', 'Doug Kezirian': 'Action Network', 'Action Network': 'Action Network',
                   'Emerson Lotzia': 'The Favorites', 'Brandon Kravitz': 'The Favorites', 'Kendra Middleton': 'The Favorites',
                   'The Favorites': 'The Favorites'}
    def _yt_show(name):
        c_ = collections.Counter(str(p_['show']).split(' — ')[0].strip() for p_ in (yt.get('picks', []) if yt else []) if p_.get('speaker') == name and p_.get('show'))
        if not c_: return None
        g_ = c_.most_common(1)[0][0]
        return {'The Action Network': 'Action Network', 'The Action Network: Sports Betting Picks & Tips': 'Action Network', 'Warren Sharp': 'Sharp Football Analysis'}.get(g_, g_)
    L += ['', '<a id="expert-registry"></a>', '### 🎙️ Expert Pick Registry (By Expert)', '',
          'Every named expert pick captured this week, grouped by the show or network they appear on, so you can find your favorites fast and see each analyst\'s full card and rationale in one place.', '']
    by_expert = collections.defaultdict(list)
    notes_by_expert = collections.defaultdict(list)
    for gid in ids:
        for r in EXP.get(gid, []):
            name = r.get('expert') or 'Unknown Expert'
            by_expert[name].append((gid, exp_kind(r), r))
        for p in YT.get(gid, []):
            name = p.get('speaker') or 'Unknown Expert'
            by_expert[name].append((gid, yt_kind(p), p))
        for n in YTN.get(gid, []):
            name = n.get('speaker') or 'Unknown Expert'
            notes_by_expert[name].append((gid, n))
    for n in YTN_GENERAL:
        name = n.get('speaker') or 'Unknown Expert'
        notes_by_expert[name].append(('League-wide', n))
    all_names = sorted(set(list(by_expert.keys()) + list(notes_by_expert.keys())), key=lambda s: s.lower())
    EXPERT_INTRO_SKIP = True
    EXP_BLOCKS = {}
    for name in all_names:
        _save_L, L = L, []
        items = by_expert.get(name, [])
        notes = notes_by_expert.get(name, [])
        sides_c = sum(1 for _, k, _ in items if k == 'Side')
        totals_c = sum(1 for _, k, _ in items if k == 'Total')
        props_c = sum(1 for _, k, _ in items if k == 'Prop')
        parts = []
        if sides_c: parts.append(f"{sides_c} side{'s' if sides_c!=1 else ''}")
        if totals_c: parts.append(f"{totals_c} total{'s' if totals_c!=1 else ''}")
        if props_c: parts.append(f"{props_c} prop{'s' if props_c!=1 else ''}")
        summary_str = ' · '.join(parts) if parts else f"{len(items)} picks"
        if notes: summary_str += f" · {len(notes)} analysis note{'s' if len(notes)!=1 else ''}"
        anc_html = f'<span id="exp-{slug(name)}"></span>'
        for gid in ids:
            if gid in EXPANCH and name in EXPANCH[gid]:
                anc_html += f'<span id="{EXPANCH[gid][name]}"></span>'
        L += [anc_html] + roll('section-4', f"exp-{slug(name)}", f"🎙️ {esc(name)} — {len(items)} pick{'s' if len(items)!=1 else ''} ({summary_str})")
        if items:
            L += ['| Game | Type | Pick | Rationale | Source |', '|---|---|---|---|---|']
            for gid, k, p in sorted(items, key=lambda x: (x[1] != 'Side', x[1] != 'Total', x[0])):
                glink_str = glink(gid)
                if 'pick_type' in p:
                    sel = f"**{esc(p.get('selection'))}** {esc(p.get('line') or '')}".strip()
                    rat = esc(p.get('rationale') or '')[:180]
                    src = esc(p.get('outlet') or p.get('source') or 'Article')[:40]
                    if p.get('url'): src = f"[{src}]({p['url']})"
                else:
                    sel = f"**{esc(p.get('pick'))}** {esc(p.get('price') or '')}".strip()
                    rat = esc(p.get('verify') or '')[:180]
                    show = esc((p.get('show') or 'YouTube').split(' — ')[0])[:40]
                    src = f"[{show}]({p['timestamp_url']})" if p.get('timestamp_url') else show
                L.append(f"| {glink_str} | {k} | {sel} | {rat} | {src} |")
            L.append('')
        if notes:
            L += ['**Film study & matchup analysis notes:**', '']
            for gid, n in notes:
                gm_lbl = f"[{gid}](#{gsid(gid)})" if gid != 'League-wide' else "Slate-wide"
                top = esc(n.get('topic') or '')
                smm = esc(n.get('summary') or '')[:240]
                url_b = f" [▶]({n.get('timestamp_url')})" if n.get('timestamp_url') else ""
                L.append(f"- **{gm_lbl}**: {top} — {smm}{url_b}")
            L.append('')
        L += ROLL_END
        EXP_BLOCKS[name] = L; L = _save_L
    # ---- group the expert boxes by show / network (2026-10-17) ----
    def _show_of(name):
        if EXPERT_SHOW.get(name): return EXPERT_SHOW[name]
        s_ = _yt_show(name)
        if s_: return s_
        outs = collections.Counter(str(p_.get('outlet') or p_.get('source') or '').strip() for _, _, p_ in by_expert.get(name, []) if 'pick_type' in p_ and (p_.get('outlet') or p_.get('source')))
        o_ = outs.most_common(1)[0][0] if outs else ''
        o_ = {'The Action Network': 'Action Network'}.get(o_, o_)
        return o_ if o_ and o_.lower() not in ('article', 'unknown') and len(o_) < 40 else 'Other / independent'
    OURSIDE = {}
    for r_ in RANKED:
        if r_['type'] == 'Side' and r_.get('gid') and r_['gid'] not in OURSIDE: OURSIDE[r_['gid']] = r_['lean']
    def _side_picks(name):
        out = []
        for gid_, k_, p_ in by_expert.get(name, []):
            if k_ != 'Side' or gid_ not in OURSIDE: continue
            txt = str(p_.get('selection') or '') if 'pick_type' in p_ else str(p_.get('pick') or '')
            tm = teams_in(txt) & set(gid_.split('@'))
            if len(tm) == 2:
                pos = {t_: re.search(r'\b' + t_ + r'\b', txt) for t_ in tm}
                tm = {min((t_ for t_ in tm if pos[t_]), key=lambda t_: pos[t_].start())} if any(pos.values()) else tm
            if len(tm) != 1: continue
            ln_ = p_.get('line') if 'pick_type' in p_ else (p_.get('raw') or {}).get('line')
            try: ln_ = float(ln_) if ln_ is not None and abs(float(ln_)) < 40 else None
            except Exception: ln_ = None
            ml_ = p_.get('pick_type') == 'moneyline' or bool(re.search(r'\bML\b|moneyline', txt, re.I))
            out.append((list(tm)[0], gid_, ln_, ml_))
        seen_ = []
        for q in out:
            if (q[0], q[1]) not in [(z[0], z[1]) for z in seen_]: seen_.append(q)
        return seen_
    _CITED2 = collections.defaultdict(list)
    for nm_ in all_names:
        for t_, g_, l_, ml_ in _side_picks(nm_):
            if l_ is not None and not ml_: _CITED2[(t_, g_)].append(l_)
    def _line_txt(q, name):
        t_, g_, l_, ml_ = q
        if ml_: return ' ML'
        if l_ is not None: return f' **{l_:+g}**'
        oth = sorted(x_ for x_ in _CITED2.get((t_, g_), []))
        est = oth[len(oth) // 2] if oth else None
        if est is None: est = (((OPEN.get(g_) or {}).get('sp')) or {}).get(t_)
        if est is None:
            mk = (((G.get(g_) or {}).get('sp')) or {}).get(t_)
            est = mk[0] if mk and mk[0] is not None else None
        return f' ~{est:+g} (est.)' if est is not None else ' (line n/a)'
    show_groups = collections.defaultdict(list)
    for nm_ in all_names:
        if by_expert.get(nm_) or notes_by_expert.get(nm_): show_groups[_show_of(nm_)].append(nm_)
    gorder = sorted(show_groups.items(), key=lambda kv: (kv[0].startswith('Other'), -sum(len(by_expert.get(n_, [])) for n_ in kv[1]), kv[0]))
    L += ['', '<div class="expert-finder" style="margin: 6px 0 12px 0;"><input type="search" id="expert-search" class="expert-search-input" placeholder="Find your favorite expert or show…" oninput="filterExperts(this.value)" autocomplete="off" style="width: 100%; max-width: 420px; padding: 8px 12px; font-size: 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--card-bg, var(--bg)); color: var(--text);"> <span id="expert-search-count" style="font-size: 12px; color: var(--muted);"></span></div>', '',
          '<div class="rollup-controls">', '  <button class="btn-toggle btn-primary" onclick="toggleRollups(\'show-grp\', true)">Expand all shows</button>', '  <button class="btn-toggle" onclick="toggleRollups(\'show-grp\', false)">Collapse all shows</button>', '</div>', '',
          '<div class="jump-to-show-bar" style="margin: 4px 0 14px 0; font-size: 13px; line-height: 1.8;"><strong>Jump to a show or network:</strong> ' + ' · '.join(f'<a href="#show-{slug(g_)}" class="table-link">{esc(g_)} ({len(m_)})</a>' for g_, m_ in gorder) + '</div>', '',
          'Experts are grouped by the show or network their picks came from. Each show opens on its own, and the table at the top of a show lines each expert up against our side lean in every game. The number after each team is the line the expert cited (bold). A ~ number with "est." means the expert did not state a line, so it is estimated from what other experts cited for that side this week, then the opening line, then the current Bookmaker number.', '']
    for g_, members in gorder:
        npk = sum(len(by_expert.get(n_, [])) for n_ in members)
        L += roll('show-grp', f'show-{slug(g_)}', f"🎙️ {esc(g_)} — {len(members)} expert{'s' if len(members) != 1 else ''}, {npk} pick{'s' if npk != 1 else ''}: <span class='show-members'>{', '.join(esc(n_) for n_ in members)}</span>")
        rows_ = []
        for n_ in members:
            sp_ = _side_picks(n_)
            if not sp_: continue
            agree_ = [q[0] for q in sp_ if OURSIDE.get(q[1]) == q[0]]
            fade_ = [q[0] for q in sp_ if OURSIDE.get(q[1]) != q[0]]
            rows_.append(f"| [**{esc(n_)}**](#exp-{slug(n_)}) | {' · '.join(tl(q[0]) + q[0] + _line_txt(q, n_) for q in sp_)} | {', '.join(agree_) or '—'} | {', '.join(fade_) or '—'} |")
        if rows_:
            L += ['| Expert | Sides picked this week, with line | Backs our side lean | Fades our side lean |', '|---|---|---|---|'] + rows_ + ['', '_Open an expert below for every pick and the reasoning, including totals and props._', '']
        else:
            L += ['_No side picks from this show this week. Open an expert below for totals, props and notes._', '']
        for n_ in members: L += EXP_BLOCKS.get(n_, [])
        L += ROLL_END
    # ---------------- 5. Wong teaser ----------------
    L += ['', '<a id="teaser-matrix"></a>', '## 5. The Master 6-Point Wong Teaser Matrix', '',]
    L += roll('section-5', 'teaser-def', '❓ What is a Wong teaser? (tap if you need the definition)') + [
          '**What a teaser is:** you move the point spread 6 points in your favor on every leg, in exchange for a smaller payout, and every leg must win. The "Wong" version only uses lines where those 6 points cross both **3 and 7**, the two most common NFL winning margins: favorites of −7.5 to −8.5 (teased down to −1.5 / −2.5) and underdogs of +1.5 to +2.5 (teased up to +7.5 / +8.5). Keep teasers to 2 legs.', ''] + RE
    L += ['', '| Game | Leg | Current | Teased | Experts on that side |', '|---|---|---|---|---|']
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
    _rr = [r for r in pull['expert'] if 'round robin' in str(r.get('rationale') or '').lower()]
    if _rr:
        L += ['**Experts\' declared underdog round robins**', '']
        for _who in dict.fromkeys(r['expert'] for r in _rr):
            _legs = [r for r in _rr if r['expert'] == _who]
            _m = re.search(r'(\d+)-team', str(_legs[0].get('rationale') or ''))
            _n = int(_m.group(1)) if _m else len(_legs)
            L += [f"**{esc(_who)}**'s underdog moneyline ticket has {len(_legs)} underdogs: " + ' and '.join(f"{esc(r['selection'])} {int(r['line']):+d}" for r in _legs) + '. With only two legs, the "round robin" is a single two-team parlay.', '',
                  '| Leg | Game | Their price | Bookmaker now | Our projection | Our read |', '|---|---|---|---|---|---|']
            for r in _legs:
                _aw, _hm = FULL.get(r['visitor']), FULL.get(r['home']); _gid = f'{_aw}@{_hm}'; _tm = FULL.get(r['selection'])
                _g = G.get(_gid); _now = _g and _g['ml'].get(_tm)
                _pj = proj_txt(_gid) if _gid in ids else ''
                _side = next((x_ for x_ in RANKED if x_.get('gid') == _gid and x_['type'] == 'Side'), None)
                _read = (f"our side lean is {esc(_side['lean_disp'])}" + (' (same team)' if _side['lean'] == _tm else ' (other team)')) if _side else 'no side lean'
                L.append(f"| **{esc(r['selection'])} ML** | {glink(_gid) if _gid in ids else esc(_gid)} | {int(r['line']):+d} | " + (f"{int(_now):+d}" if _now else '—') + f" | {_pj or '—'} | {_read} |")
            try:
                _dp = 1.0; _dn = 1.0
                for r in _legs:
                    _dp *= dec(int(r['line']))
                    _g2 = G.get(f"{FULL.get(r['visitor'])}@{FULL.get(r['home'])}"); _o2 = _g2 and _g2['ml'].get(FULL.get(r['selection']))
                    _dn = _dn * dec(int(_o2)) if (_o2 and _dn) else 0
                _am = lambda d_: f"+{(d_ - 1) * 100:.0f}" if d_ >= 2 else f"-{100 / (d_ - 1):.0f}"
                L += ['', f"A two-team parlay at their prices pays about {_am(_dp)}" + (f"; at Bookmaker's current moneylines about {_am(_dn)}" if _dn else '') + '. Both underdogs must win.', '']
            except Exception: L.append('')
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
        L += ['<em>Our own card has no underdog round robin this week; the expert ticket above is shown for reference.</em>']

    # ---------------- 7. Dossier ----------------
    L += ['', '<a id="game-dossier"></a>', '## 7. Full Chronological Analytical Dossier (With Market Cards)', '',
          'Each game opens with a written game script, our projected final score and the reasoning behind the card lean, with links to the experts cited and the actionable props for that game. Below that: the betting lines, key context, and every pick grouped by **sides**, **totals** and **player props**.', ''] + controls('section-7', 'Section 7')
    # ---- game grid (cards) at the top of the Games tab: one card per game, links to the game box ----
    def _lean_card(gid_, typ_):
        r_ = next((x_ for x_ in RANKED if x_.get('gid') == gid_ and x_['type'] == typ_), None); soft_ = False
        if not r_:
            r_ = next((x_ for x_ in SOFT if lean_gid(x_) == gid_ and lean_type(x_) == typ_), None); soft_ = True
        if not r_: return None
        m_ = re.search(r'conf\s+(\d+(?:\.\d+)?)%', r_.get('source', ''))
        n_ = re.match(r'^(.*?)\s*\(([+-]?\d+)\)\.?\s*(?:Risk:\s*(.*))?$', (r_.get('note') or '').strip())
        return dict(pick=(n_.group(1) if n_ else r_['lean']), price=(n_.group(2) if n_ else ''), conf=(float(m_.group(1)) if m_ else None), risk=((n_.group(3) or '') if n_ else ''), soft=soft_)
    _cards = []
    for g in sched:
        gid = g['id']; A, H = g['visitor'], g['home']
        k_ = g['k'].astimezone(PT)
        when_ = f"{k_:%a} {k_.strftime('%I:%M %p').lstrip('0')} PT"
        b0 = G.get(gid); f0, s0 = fav(gid) if b0 else (None, None); t0 = b0 and (b0['tot'].get('Over') or (None,))[0]
        line_ = (f"{f0} {s0:+g}" if f0 else '') + (f" · O/U {t0}" if t0 else '')
        pj_ = proj_txt(gid)
        if pj_ and not g['done']: line_ += f" · Proj {pj_}"
        fsc = FS.get(gid)
        done_ = bool(g['done'])
        sd_ = None if done_ else _lean_card(gid, 'Side'); tt_ = None if done_ else _lean_card(gid, 'Total')
        best_ = max([x_['conf'] for x_ in (sd_, tt_) if x_ and x_.get('conf') is not None and not x_.get('soft')] or [-1])
        def _pk(lbl, d_):
            if not d_: return ''
            if d_.get('soft'): lbl = f'{lbl} · Lean'
            return (f'<div class="gg-pick"' + (' style="opacity:.6" title="Lean only: did not clear the Platinum Rose evidence bar"' if d_.get('soft') else '') + f'><span class="gg-lbl">{lbl}</span><b>{esc(d_["pick"])}</b>' + (f'<span class="gg-px">{esc(d_["price"])}</span>' if d_['price'] else '')
                    + (f'<span class="gg-conf">{d_["conf"]:.1f}%<small>conf</small></span>' if d_['conf'] is not None else '') + '</div>')
        risk_ = next((d_['risk'] for d_ in (sd_, tt_) if d_ and d_['risk'] and not d_.get('soft')), '') or next((d_['risk'] for d_ in (sd_, tt_) if d_ and d_['risk']), '')
        badge_ = ''
        if done_: badge_ = '<span class="gg-badge gg-badge-final">FINAL' + (f" {fsc['away'][0]} {fsc['away'][1]}–{fsc['home'][0]} {fsc['home'][1]}" if fsc else '') + '</span>'
        _cards.append(f'<a class="gg-card{" gg-final" if done_ else ""}" href="#{gsid(gid)}-box" data-gid="{gid}" data-day="{k_:%a}" data-kick="{int(g["k"].timestamp())}" data-conf="{best_:.1f}">'
                      f'<div class="gg-top"><span class="gg-when">{when_}</span>{badge_}</div>'
                      f'<div class="gg-teams">{tl(A)}{A} @ {tl(H)}{H}</div>'
                      f'<div class="gg-line">{esc(line_)}</div>'
                      + (_pk('Side', sd_) + _pk('Total', tt_) + (f'<div class="gg-risk">Risk: {esc(risk_)}</div>' if risk_ else '') if not done_ else '<div class="gg-line">Played before this build.</div>')
                      + '</a>')
    _days = []
    for g in sched:
        d_ = f"{g['k'].astimezone(PT):%a}"
        if d_ not in _days: _days.append(d_)
    L += ['<div class="gg" id="gg-grid"><div class="gg-bar"><div class="gg-chips" role="group" aria-label="Filter games by day"><button type="button" class="gg-chip active" data-f="all">All games</button>'
          + ''.join(f'<button type="button" class="gg-chip" data-f="{d_}">{d_}</button>' for d_ in _days)
          + '</div><label class="gg-sort">Sort <select id="gg-sort" aria-label="Sort games"><option value="kick">Kickoff</option><option value="conf">Confidence</option></select></label></div>'
          + '<div class="gg-cards">' + ''.join(_cards) + '</div>'
          + '<p class="gg-note">Confidence is our estimated chance the lean cashes (pushes excluded); break-even at -110 is 52.4%. Tap a game for the full write-up.</p></div>', '']
    icons = {'game script': '📖', 'why the card leans this way': '🧠', 'what breaks it': '⚠️', 'what the experts are saying': '🎙️'}
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
        linked = set(); cited = []; gl_seen = set(); toks = []
        def cite(text):
            def _tok(name_, shown_):
                toks.append(f'<span class="cite" tabindex="0">{shown_}{cite_pop(gid, ALIAS_EXP.get(name_, name_), anch[name_])}</span>')
                return f'\x00{len(toks) - 1}\x00'
            for name in sorted(anch, key=len, reverse=True):
                if anch[name] in linked and name not in ALIAS_EXP: continue
                pat = src_pat(name)
                if re.search(pat, text):
                    text = re.sub(pat, lambda m_: _tok(name, m_.group(1)), text, count=1)
                    if anch[name] not in linked: linked.add(anch[name]); cited.append(_tok(name, ALIAS_EXP.get(name, name)))
            text = gloss_html(text, gl_seen)
            return re.sub(r'\x00(\d+)\x00', lambda m_: toks[int(m_.group(1))], text)
        _ss = game_top(gid)
        if _ss: L += [_ss, '']
        if nar.get('secs') or nar.get('proj'):
            L += ['<div class="game-narrative" style="border-left: 4px solid var(--accent); background: rgba(0,210,190,0.07); padding: 12px 16px; border-radius: 8px; margin: 4px 0 16px 0;">']
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
                    ctx.append(f"projected margin {w_[0]} by {round(w_[1] - l_[1], 1):g} → covers: {cov} ({f_} {sp_:+g})")
                    ctx.append(f"total {round(s1 + s2, 1):g} vs {tt_} → {'Over' if s1 + s2 > tt_ else 'Under' if s1 + s2 < tt_ else 'push'}")
                L.append(f'<div style="font-size: 1.08rem; font-weight: 700; margin-bottom: 4px;">🎯 Projected final: {w_[0]} {w_[1]}, {l_[0]} {l_[1]}</div>')
                if ctx: L.append(f'<div style="font-size: 0.86rem; opacity: 0.85; margin-bottom: 8px;">{gloss_html(" · ".join(ctx), set())}</div>')
            o = OPEN.get(gid)
            if o and b:
                mv = []
                for t in (A, H):
                    if t in o['sp'] and t in b['sp'] and b['sp'][t][0] <= 0:
                        mv.append(f"spread {t} {o['sp'][t]:+g} → {b['sp'][t][0]:+g}"); break
                if b['tot'].get('Over'): mv.append(f"total {o['tot']:g} → {b['tot']['Over'][0]:g}")
                for t in (A, H):
                    if t in o['ml'] and t in b['ml']: mv.append(f"moneyline {t} {o['ml'][t]:+d} → {b['ml'][t]:+d}")
                L.append(f'<div style="font-size: 0.86rem; margin-bottom: 8px;">📈 <strong>Line movement</strong> (opening line: {o.get("label", o["src"])} → Bookmaker now, {D}): {" · ".join(mv)}</div>')
            for t, body in nar.get('secs', []):
                L.append(f'<div style="font-weight: 700; margin-top: 10px;">{icons.get(t.lower(), "•")} {t}</div>')
                _sents = []
                for para in [x.strip() for x in body.split('\n\n') if x.strip()]:
                    _sents += split_sents(" ".join(para.splitlines()))
                if len(_sents) > 1: L.append('<ul class="gs-list">' + ''.join(f'<li>{cite(md_inline(s_))}</li>' for s_ in _sents) + '</ul>')
                else: L.append(f'<p style="margin: 4px 0 6px 0;">{cite(md_inline(body.strip()))}</p>')
            if cited: L.append(f'<div style="font-size: 0.88rem; margin-top: 8px;">🎙️ <strong>Experts cited:</strong> {re.sub(chr(0) + r'(\d+)' + chr(0), lambda m_: toks[int(m_.group(1))], " · ".join(cited))}</div>')
            gp = POOL.get(gid, [])
            if gp:
                L.append(f'<div style="font-size: 0.88rem; margin-top: 6px;">🧾 <strong>Actionable props called out:</strong> ' + ' · '.join(f'<a href="#props-{slug(gid)}">{p["text"]}{(" " + p["price"]) if p["price"] else ""}</a>' for p in gp[:12]) + (f' · <a href="#props-{slug(gid)}">+{len(gp) - 12} more</a>' if len(gp) > 12 else '') + '</div>')
            L += ['</div>', '']
        # key context
        ctxl = []
        sp = SPL.get(gid) or SPL.get(gid.replace('WAS', 'WSH'))
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
        # context lanes from the verified file (never counted as picks): trends & systems, news & angles
        cx = [c for c in (VER or {}).get('context', []) if c.get('game') == gid]
        tr = [c for c in cx if c['lane'] in ('trend', 'system')]
        if tr:
            trl_ = [f"- {'⚙️ **System**' if c['lane'] == 'system' else '📈'} {esc(html.unescape(c['text']))[:330]}" + (f" <em>({esc(c['market'])})</em>" if c['lane'] == 'trend' and c.get('market') else '') for c in sorted(tr, key=lambda c: (c['lane'] != 'system', not c.get('top')))]
            src_ = sorted({c.get('person') or c.get('outlet') for c in tr})
            L += roll('section-7-sub', f'{gsid(gid)}-trends', f'📊 Trends & systems ({len(tr)})') + [f"From {', '.join(src_)} — [Action Network betting primer]({tr[0]['url']}). Trends and systems are context, not picks; none of them is counted in the expert consensus.", ''] + trl_ + RE
        nw = [c for c in cx if c['lane'] == 'news']
        if nw:
            nwl_ = [f"- [{esc(html.unescape(c['text']))[:150]}]({c['url']}) — {esc(c['outlet'])}, {str(c.get('published') or '')[:10]}" for c in sorted(nw, key=lambda c: str(c.get('published') or ''), reverse=True)]
            L += roll('section-7-sub', f'{gsid(gid)}-news', f'📰 News & angles ({len(nw)})') + ['Headlines matched to this game by team name and date (newest first). Check the inactive list before kickoff.', ''] + nwl_ + RE
        # grouped picks: one uniform line everywhere: **pick** · source · reason; sides and totals split into the two camps
        def xl(name): i_ = EXPANCH.get(gid, {}).get(name); return f'<span class="cite" tabindex="0">{esc(name)}{cite_pop(gid, name, i_)}</span>' if i_ else esc(name)
        def gp_line(pick_, src_, why_='', card_pick=None):
            pick_ = pick_.replace('parlay_price_note', '(parlay price note)').replace('_', ' ')
            action_ = ''
            if card_pick:
                safe_pick = html.escape(str(card_pick), quote=True)
                safe_gid = html.escape(gid, quote=True)
                safe_page = html.escape(gsid(gid), quote=True)
                action_ = (f'<button class="bm-btn gp-bm-btn" type="button" data-pick="{safe_pick}" data-ctx="{safe_gid}" data-page="{safe_page}" '
                           f'title="Add {safe_pick} to My Card"><span class="bm-icon">☆</span><span class="bm-text">+ My Card</span></button>')
            return f'<li><b>{pick_}</b> {action_} <span class="gp-src">· {src_}</span>' + (f' <span class="gp-why">— {why_}</span>' if why_ else '') + '</li>'
        def side_of(kind_, text_):
            t_ = (text_ or '').lower()
            if kind_ == 'Total':
                if re.search(r'\bunder\b|\bu\s?\d', t_): return 'Under'
                if re.search(r'\bover\b|\bo\s?\d', t_): return 'Over'
                return None
            ts_ = teams_in(text_) & {A, H}
            return next(iter(ts_)) if len(ts_) == 1 else None
        gitems = {'Side': [], 'Total': [], 'Prop': []}
        for r in EXP.get(gid, []):
            k_ = exp_kind(r); sel_ = f"{r.get('selection') or ''} {r.get('line') or ''}".strip()
            gitems[k_].append((side_of(k_, sel_), gp_line(esc(sel_), xl(r.get('expert')), esc(str(r.get('rationale') or '')[:150]), sel_)))
        for p in YT.get(gid, []):
            k_ = yt_kind(p); sel_ = f"{p['pick']} {p.get('price') or ''}".strip()
            gitems[k_].append((side_of(k_, p['pick']), gp_line(esc(sel_), xl(p['speaker']) + ' (YouTube)', ('⚠ ' + esc(p['verify'])) if p.get('verify') else '', sel_)))
        for x in RANKED:
            if x['gid'] == gid:
                pick_ = x['lean_disp'] if x['type'] != 'Prop' else x['market'] + ' → ' + x['lean']
                lead_ = gp_line('⭐ ' + esc(pick_), 'Platinum Rose card lean', f'confidence {stars(x["conf"])}', pick_).replace('<li>', '<li class="gp-ours">', 1)
                gitems[x['type']].insert(0, (x['lean'] if x['type'] in ('Side', 'Total') else None, lead_))
        _ps = collections.OrderedDict()
        for sel_, who_, url_, out_, why_ in PROPSRC.get(gid, []):
            sel_ = re.sub(r'^(.+?):\s*\1\s*-\s*', r'\1 - ', sel_)
            _ps.setdefault(re.sub(r'\s+', ' ', sel_).strip().lower(), dict(sel=re.sub(r'\s+', ' ', sel_).strip(), src=[], why=why_))['src'].append((who_, url_, out_))
        for _k, _d in sorted(_ps.items(), key=lambda kv: -len(kv[1]['src']))[:8]:
            _links = []
            for who_, url_, out_ in _d['src'][:4]:
                lab_ = esc(who_) + (f" ({esc(str(out_)[:24])})" if out_ and out_ != who_ and 'Bookmarks' not in str(out_) else '')
                _links.append(f'<a href="{html.escape(url_, quote=True)}" target="_blank" rel="noopener noreferrer">{lab_} ↗</a>' if url_ else lab_ + ' <em>(no public link)</em>')
            gitems['Prop'].append((None, gp_line(esc(_d['sel']), ' · '.join(_links), esc(html.unescape(str(_d['why'])))[:140] if _d['why'] else '')))
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
            if key: gitems['Prop'].append((None, gp_line('Main lines (priced near −110)', 'Bookmaker', esc(' · '.join(key)))))
            if atd: gitems['Prop'].append((None, gp_line('Shortest anytime-TD prices', 'Bookmaker', esc(' · '.join(f"{r['player']} {r['odds']:+d}" for r in atd)))))
            pulled = sorted({r['player'] for r in rows if not r['available'] and r.get('player')})
            if pulled: gitems['Prop'].append((None, gp_line('Listed without odds (check status)', 'Bookmaker', esc(', '.join(pulled)))))
        if POOL.get(gid): gitems['Prop'].append((None, f'<li><a href="#props-{slug(gid)}">🧰 All actionable props for this game →</a></li>'))
        def camps(kind_, a_key, a_lbl, b_key, b_lbl):
            its_ = gitems[kind_]
            ca_ = [h_ for s_, h_ in its_ if s_ == a_key]; cb_ = [h_ for s_, h_ in its_ if s_ == b_key]; co_ = [h_ for s_, h_ in its_ if s_ not in (a_key, b_key)]
            na_, nb_ = len(ca_), len(cb_); tot_ = max(na_ + nb_, 1)
            h_ = (f'<div class="sent"><div class="sent-head"><span><b>{na_}</b> {a_lbl}</span><span class="sent-bar" title="{na_} vs {nb_}"><i style="width:{na_ / tot_ * 100:.0f}%"></i></span><span>{b_lbl} <b>{nb_}</b></span></div>'
                  f'<div class="sent-cols"><div><div class="sent-col-t">{a_lbl}</div><ul class="gp-list">{"".join(ca_) or "<li class=gp-none>No picks</li>"}</ul></div>'
                  f'<div><div class="sent-col-t">{b_lbl}</div><ul class="gp-list">{"".join(cb_) or "<li class=gp-none>No picks</li>"}</ul></div></div>')
            if co_: h_ += f'<div class="sent-other"><div class="sent-col-t">Other / unclear</div><ul class="gp-list">{"".join(co_)}</ul></div>'
            return h_ + '</div>'
        fT_ = fav(gid)[0] if b else None
        if fT_ not in (A, H): fT_ = None
        dT_ = (H if fT_ == A else A) if fT_ else None
        sp_f = (b['sp'].get(fT_) or (None,))[0] if (b and fT_) else None
        if gitems['Side']:
            fk_, dk_ = (fT_, dT_) if fT_ else (A, H)
            fl_ = f"{tl(fk_)}{fk_}" + (f" {sp_f:+g} · Favorite" if fT_ and sp_f is not None else ''); dl_ = f"{tl(dk_)}{dk_}" + (f" {-sp_f:+g} · Underdog" if fT_ and sp_f is not None else '')
            L += roll('section-7-sub', f'{gsid(gid)}-side', f'⚖️ Sides: favorite vs underdog ({len(gitems["Side"])})', True) + [camps('Side', fk_, fl_, dk_, dl_)] + RE
        if gitems['Total']:
            tn_ = (b['tot'].get('Over') or (None,))[0] if b else None
            L += roll('section-7-sub', f'{gsid(gid)}-total', f'📈 Totals: over vs under ({len(gitems["Total"])})', True) + [camps('Total', 'Over', 'Over' + (f' {tn_:g}' if tn_ else ''), 'Under', 'Under' + (f' {tn_:g}' if tn_ else ''))] + RE
        if gitems['Prop']:
            L += roll('section-7-sub', f'{gsid(gid)}-prop', f'🧾 Player props ({len(gitems["Prop"])})') + ['<ul class="gp-list">' + ''.join(h_ for _, h_ in gitems['Prop']) + '</ul>'] + RE
        L += ROLL_END

    # ---------------- 8. Props + under the hood ----------------
    L += ['', '<a id="prop-card"></a>', '## 8. Master Player Prop & Exotic Wager Card', ''] + controls('section-8', 'Section 8') + [
          f'Reference boards for player props. For the props we actually recommend, see the [props pool](#prop-pool) and the prop stacks in [card tickets](#card-tickets).', '']
    L += roll('section-8', 'prop-card-box', '🧾 Prop reference boards: article picks and 2+ passing TD prices')
    L += ['These boards are reference material. Each row says what the pick is, the price, who made it (linked to the original article), and our read. '
          'The props we actually recommend are in the [props pool](#prop-pool) and the card tickets.', '']
    def _clean_why(s_):
        s_ = html.unescape(str(s_ or '')).strip()
        if 'Sharp Betting Tools' in s_: s_ = re.sub(r'^.*?Best Prop Bet:[^)]*\)\s*', '', s_)
        return esc(s_)[:230]
    def _ours(player_, mk_hint=''):
        last_ = player_.split()[-1].lower()
        for x_ in RANKED:
            if x_['type'] == 'Prop' and last_ in (x_['market'] or '').lower():
                return f"✅ Also our lean: {esc(x_['market'])[:80]}"
        return '— Article pick only; not on our card'
    t1x = [p for p in t1][:24]
    if t1x:
        L += ['**Article-sourced tier-1 props** (completed games excluded). "Our read" tells you whether our own card agrees.', '',
              '| Game | Player | Pick | Price | Who and where (link) | Their reason | Our read |', '|---|---|---|---|---|---|---|']
        for p in t1x:
            ln_ = str(p.get('line') or '').strip(); sd_ = str(p.get('side') or '').capitalize()
            lbl_ = str(p.get('category_label') or p.get('category') or '').lower()
            pick_ = f"{ln_} {lbl_}" if ln_.endswith('+') else f"{sd_} {ln_} {lbl_}".strip()
            who_ = esc(str(p.get('analyst') or p.get('source') or p.get('expert') or 'Article'))[:60]
            src_ = f"[{who_} ↗]({p['source_url']})" if p.get('source_url') else who_
            L.append(f"| {glink(live_games.get(p.get('game')), esc(p.get('game')))} | {esc(p.get('player'))} | **{esc(pick_)}** | {esc(p.get('price') or p.get('odds'))} | {src_} | {_clean_why(p.get('rationale'))} | {_ours(str(p.get('player') or ''))} |")
        L.append('')
    ta = [r for r in beo if r.get('market') == 'tackles_assists']
    if ta:
        best = {}
        for r in ta:
            if -250 <= r['odds'] <= 130:
                k = r['player']; best.setdefault(k, r)
                if abs(dec(r['odds']) - 1.91) < abs(dec(best[k]['odds']) - 1.91): best[k] = r
        L += ['', '**Tackles + assists main lines (BetOnline).** Over means the player must reach the number; the price is for the Over.', '', '| Game | Player | Pick | Price | Our read |', '|---|---|---|---|---|']
        for r in sorted(best.values(), key=lambda r: r['game']): L.append(f"| {r['game']} | {r['player']} | **Over {r['line']:g} tackles + assists** | {r['odds']:+d} | {_ours(r['player'])} |")
    else:
        L += ['**Tackles + assists:** no BetOnline tackles-and-assists board was captured for Week 6, so there is nothing to list here. Re-capture before listing any.', '']
    if ptd_all:
        PTD = []
        for r in ptd_all:
            try:
                aw_, hm_ = [FULL.get(z_.strip()) for z_ in r['event'].split(' @ ')]
                gid_ = f'{aw_}@{hm_}'; tm_ = team_of(r['player']); b_ = G.get(gid_); f_, sp_ = fav(gid_) if b_ else (None, None)
                tt_ = b_ and (b_['tot'].get('Over') or (None,))[0]
                if not (tm_ and f_ and tt_): raise KeyError
                fp_ = tt_ / 2 - sp_ / 2; imp_ = fp_ if tm_ == f_ else tt_ - fp_
                mu_ = 0.062 * imp_; est_ = 1 - math.exp(-mu_) * (1 + mu_)
            except Exception:
                gid_, tm_, imp_, est_ = None, None, None, None
            book_ = 1 / dec(r['odds'])
            art_ = next((p for p in t1 if str(p.get('player')) == r['player'] and 'pass' in str(p.get('category')) ), None)
            if est_ is None: read_ = '⚪ No lean (could not price the game)'
            elif est_ - book_ >= 0.04: read_ = '🟢 Lean Yes (2+)'
            elif est_ - book_ <= -0.04: read_ = '🔴 Lean No / avoid'
            else: read_ = '⚪ No lean (price is about fair)'
            if art_: read_ += f" · also an article pick ([{esc(str(art_.get('analyst'))[:30])} ↗]({art_['source_url']}))"
            PTD.append((((est_ - book_) if est_ is not None else -9), r, gid_, tm_, imp_, est_, book_, read_))
        PTD.sort(key=lambda z: -z[0])
        L += ['', '**2+ passing TDs (Bookmaker).** The bet is that the QB throws two or more touchdown passes (a Yes bet; there is no Under on this board).',
              '', '- **How we read it:** the price implies a chance; our rough estimate comes from the points the betting lines expect from his team (about 0.062 passing TDs per expected point, then the chance of two or more). '
              'Green or red means our estimate is at least 4 points away from the price. This is a provisional rule of thumb, not a backtested model.', '',
              '| QB | Game | Pick | Price | Price implies | Our rough estimate | Our read |', '|---|---|---|---|---|---|---|']
        for _, r, gid_, tm_, imp_, est_, book_, read_ in PTD:
            L.append(f"| {esc(r['player'])} ({tm_ or '?'}) | {glink(gid_) if gid_ else esc(r['event'])} | **2+ passing TDs (Yes)** | {r['odds']:+d} | {book_ * 100:.0f}% | " + (f"{est_ * 100:.0f}%" if est_ is not None else '—') + f" | {read_} |")
    L += ROLL_END
    L += roll('section-8', 'under-the-hood', '🔧 Under the hood: how the card was built (ticket list &amp; season build rules)')
    if TK: L += ['| Ticket | Book | Stake | Price |', '|---|---|---|---|'] + [f"| [{esc(t['disp'])}](#{t['id']}) | {esc(t['book'])} | ${t['stake']} | {esc(t['price'])} |" for t in TK]
    m = re.search(r'\*\*Build rules that come from the data\.[^\n]*\n\n(\|.*?\n)(?:\n)', (ROOT / 'agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md').read_text(encoding='utf-8'), re.S)
    if m: L += ['', '**Build rules from the season record:**', '', m.group(1).strip()]
    L += ROLL_END
    # ---------------- 9 ----------------
    L += ['', '<a id="survivor"></a>', '## 9. Master Survivor Contest Strategy Hierarchy', '',
          ]
    L += roll('section-9', 'survivor-def', '❓ How survivor pools work (tap if you need the definition)') + [
          '**Survivor pools:** pick one team to win each week; you cannot use a team twice, and one loss usually ends your run. So the best pick balances three things: **how likely the team is to win**, **how many others in your pool are on the same team** (if a popular pick loses, much of the field goes with it), and **whether you would rather save the team for a better spot later**.', ''] + RE
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
        L += ['', f"<em>Pick share and value score: [{spi['sources'].get('pick_pct_label', 'SurvivorGrid')}]({spi['sources'].get('pick_pct')}) (value score blends win chance with popularity; above 1.00 is a better-than-average pick this week; '—' = no value score from this source). Save-for-later notes: [{spi['sources'].get('note_label', 'Covers')}]({spi['sources'].get('note')}). Captured {spi.get('captured_at', '')[:16].replace('T', ' ')}.</em>"]
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
    L += ['', '<a id="registry"></a>', '<a id="data-sources"></a>', '## 11. Unified Expert Pick Registry & Source Coverage', '']
    srcs = collections.Counter(n['source'] for n in pull['notes'])
    auth = collections.Counter((r.get('author') or r.get('source')) for r in pull['signals'])
    exps = collections.Counter(r.get('expert') for r in pull['expert'])
    L += ['| Articles by source | n |', '|---|---|'] + [f'| {esc(k)} | {v} |' for k, v in srcs.most_common(20)]
    L += ['', '| Pick signals by author/outlet | n |', '|---|---|'] + [f'| {esc(k)} | {v} |' for k, v in auth.most_common(20)]
    L += ['', '| Podcast experts | n |', '|---|---|'] + [f'| {esc(k)} | {v} |' for k, v in exps.most_common(20)]

    L += ['', '<div class="rollup-controls">', "  <button class=\"btn-toggle btn-primary\" onclick=\"toggleRollups('section-sources', true)\">Expand source lists</button>", "  <button class=\"btn-toggle\" onclick=\"toggleRollups('section-sources', false)\">Collapse source lists</button>", '</div>', '']
    L += roll('section-sources', 'sourced-articles', f'📚 Sourced Articles &amp; Research Citations — {len(pull["notes"])} articles with direct links &amp; summaries')
    L += ['| Outlet / Source | Article Title & Link | Summary | Published |', '|---|---|---|---|']
    for n in sorted(pull['notes'], key=lambda x: (x.get('source') or '', x.get('title') or '')):
        src_lbl = esc(n.get('source') or 'Article')
        ttl = esc(_html.unescape(n.get('title') or 'Untitled'))
        url_link = f"[{ttl}]({n['url']})" if n.get('url') else ttl
        summ = esc(_html.unescape(n.get('summary') or '—'))[:200]
        pub = esc((n.get('published') or '')[:10])
        L.append(f"| {src_lbl} | {url_link} | {summ} | {pub} |")
    L += ROLL_END

    pod_episodes = collections.defaultdict(lambda: {'picks': 0, 'notes': 0, 'hosts': set(), 'url': ''})
    for p in yt.get('picks', []):
        sh = p.get('show', 'YouTube').split(' — ')[0]
        pod_episodes[sh]['picks'] += 1
        if p.get('speaker'): pod_episodes[sh]['hosts'].add(p['speaker'])
        if p.get('timestamp_url') and not pod_episodes[sh]['url']: pod_episodes[sh]['url'] = p['timestamp_url']
    for n in yt.get('analysis_notes', []):
        sh = n.get('show', 'YouTube').split(' — ')[0]
        pod_episodes[sh]['notes'] += 1
        if n.get('speaker'): pod_episodes[sh]['hosts'].add(n['speaker'])
        if n.get('timestamp_url') and not pod_episodes[sh]['url']: pod_episodes[sh]['url'] = n['timestamp_url']
    
    L += roll('section-sources', 'sourced-podcasts', f'🎙️ Sourced Podcasts &amp; Video Episodes — {len(pod_episodes)} shows ({len(yt.get("picks", []))} picks, {len(yt.get("analysis_notes", []))} notes)')
    L += ['| Show / Outlet | Host(s) / Analyst(s) | Volume | Episode / Timestamp Link |', '|---|---|---|---|']
    for sh, dat in sorted(pod_episodes.items(), key=lambda x: -(x[1]['picks'] + x[1]['notes'])):
        hosts_str = ', '.join(sorted(dat['hosts'])) if dat['hosts'] else 'Various Analysts'
        url_str = f"[Listen / Watch Link]({dat['url']})" if dat['url'] else "Podcast Feed"
        L.append(f"| **{esc(sh)}** | {esc(hosts_str)} | {dat['picks']} picks, {dat['notes']} notes | {url_str} |")
    L += ROLL_END
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
        known_gaps=gaps, market_captures=capture_sources)
    json.dump(export, open(md.with_suffix('.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False, default=_j)
    print(f'wrote {md} ({len(L)} lines)')
    sys.path.insert(0, str(Path(__file__).parent))
    import convert_summary
    if not a.no_export:
        convert_summary.generate_docx(str(md), str(md.with_suffix('.docx')))
        convert_summary.generate_html(str(md), str(md.with_suffix('.html')))
        try:  # multi-page client site (dist/.../site/), split from the single page
            import build_site
            build_site.main(str(md.with_suffix('.html')))
        except ImportError as e_:
            print(f'NOTE: multi-page site skipped ({e_}); pip install beautifulsoup4')
    for x in gaps:
        try:
            print('GAP:', x)
        except Exception:
            print('GAP:', x.encode('ascii', 'backslashreplace').decode('ascii'))
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
    card_alt = [(t_, float(l_.replace('−', '-').replace(' ', ''))) for t_, l_ in alt_picks]
    sc_pitch_path = f'reports/intel/supercontest-pitches-{a.season}-w{WW}.json'
    SC_PITCH = (J(sc_pitch_path, {}) or {}).get('picks', {})
    our5 = {t_ for t_, _ in card_sc}; alts = {t_ for t_, _ in card_alt}
    KEYS = (3, 7, 10, 14)
    SCX = set()
    SC_VOTES = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
    for g in live:
        for r in EXP.get(g['id'], []):
            if r.get('pick_type') == 'spread':
                expert = r.get('expert') or '?'
                teams = teams_in(str(r.get('selection') or '')) & {g['visitor'], g['home']}
                if len(teams) == 1:
                    SCX.add(expert); SC_VOTES[g['id']][expert][next(iter(teams))] += 1
        for p_ in YT.get(g['id'], []):
            if str(p_.get('market') or '').lower() == 'spread':
                expert = p_.get('speaker') or '?'
                side = p_.get('side')
                if side not in (g['visitor'], g['home']):
                    teams = teams_in(str(p_.get('pick') or '')) & {g['visitor'], g['home']}
                    side = next(iter(teams)) if len(teams) == 1 else None
                if side in (g['visitor'], g['home']):
                    SCX.add(expert); SC_VOTES[g['id']][expert][side] += 1
    SC_CONS = collections.defaultdict(lambda: collections.defaultdict(set))
    for gid_, by_source in SC_VOTES.items():
        for source_, counts_ in by_source.items():
            top_ = max(counts_.values())
            leaders_ = [side_ for side_, count_ in counts_.items() if count_ == top_]
            if len(leaders_) == 1: SC_CONS[gid_][leaders_[0]].add(source_)
    def sc_expert_counts(z):
        return len(SC_CONS[z['gid']].get(z['side'], set())), len(SC_CONS[z['gid']].get(z['opp'], set()))
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
            nf, na = len(SC_CONS[gid].get(side, set())), len(SC_CONS[gid].get(opp, set()))
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
    def verdict(z): return '⭐ Dashboard AI proposal' if z['side'] in our5 else ('🔁 AI alternate' if z['side'] in alts else ('Top 10' if z.get('rank', 99) <= 10 else '—'))
    # season record
    def grade_week(wk, card_):
        out = []
        box = {}
        for f in glob.glob(str(ROOT / 'data/fantasy/boxscores/espn-*.json')):
            try:
                d_ = json.load(open(f, encoding='utf-8'))
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
    def glink(gid, text=None): return f'[{text or matchup(gid, False)}](#sc-game-{slug(gid)})' if gid else (text or '—')
    def link_sources(text, gid):
        t_ = esc(text)
        for pat_, rep_ in ABBR: t_ = re.sub(pat_, rep_, t_)
        t_ = t_.replace('The The Favorites', 'The Favorites')
        done_ = set()
        for name in sorted(SCX | set(ALIAS_EXP), key=len, reverse=True):
            tgt = ALIAS_EXP.get(name, name)
            if tgt not in SCX or tgt in done_: continue
            pat_ = src_pat(name)
            if re.search(pat_, t_):
                t_ = re.sub(pat_, lambda m_: f'<a href="#scx-{slug(tgt)}">{m_.group(1)}</a>', t_, count=1); done_.add(tgt)
        return t_
    S = [logo_css(), f'# 🏆 NFL Week {W} SuperContest Intelligence Report', '## Spread-Only Dashboard AI Proposal, Every Side Ranked, and the Game-by-Game Case',
         '']
    S += roll('sc-top', 'sc-rules', '📋 How the SuperContest works') + [
         '- **Five picks a week, against the contest\'s own point spreads** (locked for the whole week). This report covers point-spread sides only.',
         '- **Scoring:** a win is 1 point, a push (lands exactly on the number) is ½, a loss is 0.',
         '- **Why the contest line matters:** the contest locks its lines early in the week, while sportsbook lines keep moving. When the contest gives our side a better number than the market does now, that is free value. When it gives a worse number, we are paying for it, and it matters most around **3 and 7**, the most common winning margins.'] + RE
    played = [z for z in SIDES if z['result']]
    S += roll('sc-top', 'sc-status', f'🚨 Contest status — Week {W}', True) + [
         f"- **Season so far:** {wins}–{losses}" + (f"–{pushes}" if pushes else '') + f" ({season_pts:g} of {season_n} points)" + ''.join(f" · Week {wk}: {sum(1 for r in rs if r['result']=='Win')}–{sum(1 for r in rs if r['result']=='Loss')}" for wk, rs in HIST) + '. [Review →](#sc-review)',
         f"- **Already played this week:** " + ('; '.join(f"{matchup(z['gid'], False)} — {z['side']} {z['lc']:+g} **{z['result']}**" for z in played if z['result'] == 'Win') or 'none') + '.',
         f"- **Dashboard AI proposal ({len(card_sc)} sides):** " + ' · '.join(f"{tl(t_)}**{t_} {l_:+g}**" for t_, l_ in card_sc) + (f" (alternate: {card_alt[0][0]} {card_alt[0][1]:+g})" if card_alt else '') + '.',
          ("- **Slot 5:** Dashboard AI has no pick. Andy and Amanda will decide the separate official five later." if len(card_sc) < 5 else "- **Status:** This is the Dashboard AI proposal; Andy and Amanda will declare the official five separately."),
         f"- **Contest line better than the market right now:** " + (', '.join(f"{z['side']} {z['lc']:+g} (market {z['lm']:+g})" for z in live_sides if (z['val'] or 0) > 0) or 'none') + '.',
         f"- **Key-number watch on the proposal:** " + (', '.join(f"{z['side']} {z['lc']:+g} {z['key']} vs the market ({z['lm']:+g})" for z in live_sides if z['side'] in our5 and z['key']) or 'none') + '.'] + RE

    # ⭐ Our five (Home tab): quick-link header, then two collapsible groups of brief cards
    def _mk(v): return ('%+g' % v) if v is not None else '—'
    def _zfor(t_, l_): return next((q for q in SIDES if q['side'] == t_ and abs(q['lc'] - l_) < 0.01), None) or next((q for q in SIDES if q['side'] == t_), None)
    def _chip(t_, l_):
        z = _zfor(t_, l_)
        return f"<a class='pk-chip' href='#sc5-{slug(t_)}' title='Jump to the {t_} breakdown'>{tl(t_)}<b>{t_} {l_:+g}</b></a>" if z else ''
    S += ['', '<a id="sc-our-five"></a>', '## ⭐ Dashboard AI Proposal for Andy & Amanda', '',
          '<div class="pk-quick"><div class="pk-qrow"><span class="pk-qlabel">⭐ Dashboard AI proposal</span>' + ''.join(_chip(t_, l_) for t_, l_ in card_sc) + ("<span class='pk-chip' style='border-style:dashed;opacity:.75;cursor:default'><b>#5</b> No AI pick</span>" if len(card_sc) < 5 else '') + '</div>'
          + ('<div class="pk-qrow"><span class="pk-qlabel">🔁 AI alternates</span>' + ''.join(_chip(t_, l_) for t_, l_ in card_alt) + '</div>' if card_alt else '') + '</div>', '',
        f'The Dashboard AI proposal contains {len(card_sc)} sides, each with The Pitch and The Pushback. These selections are tracked as Dashboard AI picks, not as Andy and Amanda’s official card. ' + ('Slot 5 has no Dashboard AI pick; Andy and Amanda will decide and declare the official five separately. ' if len(card_sc) < 5 else 'Andy and Amanda will decide and declare the official five separately. ') + 'Alternates are proposal swap-ins if a recommended side falls through. Tap a side above to jump to its breakdown; every card and group collapses. Every other side is on the Ranked & Market tab.', '']
    def sc_pitch_sections(z):
        team = z['side']; gid = z['gid']; prefix = f"sc5-{slug(team)}"
        thesis = SC_PITCH.get(team, {})
        if thesis.get('game') != gid:
            thesis = {}
        out = []
        def cited(item):
            refs = item.get('ref', [])
            if not isinstance(refs, list): refs = [refs]
            return esc(item['text']) + ' ' + ' '.join(f'[{ref}](#{prefix}-source-{ref})' for ref in refs)
        def expert_names(side):
            return ', '.join(f'[{esc(name)}](#scx-{slug(name)})' for name in sorted(SC_CONS[gid].get(side, set()))) or 'none recorded'
        for key, title in (('pitch', 'The Pitch'), ('pushback', 'The Pushback')):
            out += roll('sc-more sc-thesis', f'{prefix}-{key}', title, True)
            paragraphs = thesis.get(key, [])
            if paragraphs:
                for item in paragraphs: out += [cited(item), '']
            else:
                out += [f'No sourced {title.lower()} has been saved for this side yet.', '']
            if key == 'pitch':
                out += [f"**Spread support in the report:** {expert_names(team)}. **{z['nf']} for / {z['na']} against** in the saved registry. [Expert picks and cited lines →](#sc-experts)", '']
                if z['lm'] is not None:
                    price_note = (f"{z['val']:+g} points of contest advantage" if z['val'] > 0 else f"{abs(z['val']):g} points worse in the contest" if z['val'] < 0 else 'the same spread')
                    board = G.get(gid) or {}
                    out += [f"**Number check:** contest {team} {z['lc']:+g}; supplied BKR {team} {z['lm']:+g} — {price_note}. Source: {esc(board.get('line_source') or 'saved Bookmaker capture')}; capture time: {esc(str(board.get('line_capture_time') or 'not stated'))}. [Market comparison →](#sc-market)", '']
                sp = SPL.get(gid) or {}
                hb, hm = sp.get('spread_home_bettors'), sp.get('spread_home_money')
                if hb is not None and hm is not None and (hb or hm):
                    bets, money = (float(hb), float(hm)) if team == z['g']['home'] else (100 - float(hb), 100 - float(hm))
                    gap = money - bets
                    read = 'Money share exceeds ticket share' if gap > 0 else 'Money share trails ticket share' if gap < 0 else 'Money and ticket shares are equal'
                    out += [f"**Saved spread splits:** {team} {bets:g}% of tickets / {money:g}% of money; {z['opp']} {100-bets:g}% / {100-money:g}%. {read} ({gap:+g} percentage points). This describes the sampled action, not bettor identity or a cover probability. Action Network capture: {esc(str(sp.get('captured_at') or 'time unavailable'))}. [Split evidence →](#sc-splits-anchor)", '']
                else:
                    out += ['**Spread splits:** no usable saved split for this game; no money-based support is inferred.', '']
            else:
                out += [f"**Opposing spread voices in the report:** {expert_names(z['opp'])}. Earlier picks can be at different lines; shared shows and repeated analyst appearances are not independent evidence. Tied source votes are omitted from the directional count. [Inspect expert evidence →](#sc-experts)", '']
            out += RE
        if thesis:
            source_path = f"reports/intel/games/{a.season}-w{WW}-game-{gid.replace('@', '_at_')}-sides.md"
            out += [f'<div class="sc-thesis-sources" style="font-size:.85em;color:var(--muted)">',
                    f'<p id="{prefix}-source-1"><b>[1] Saved Friday matchup synthesis, {esc(gid)}.</b> Game script, quantitative analysis, expert agreement, market history and counter-case. Includes dossier/FTN/nflverse figures, attributed expert recommendations and saved simulation results. Source: <code>{esc(source_path)}</code>. Figures describe that snapshot; no simulation was rerun for this update.</p>',
                    f'<p id="{prefix}-source-2"><b>[2] Saturday Week {W} review, {esc(gid)}.</b> Game section, Saturday market/news recheck and contest notes in <code>{esc(nar_p)}</code>; latest supplied BKR spread is displayed above. These notes update Friday information where explicitly stated. The analyst score projection is qualitative.</p>',
                    '</div>', '']
        return out
    def _card(t_, l_, is_five):
        z = _zfor(t_, l_)
        if not z: return []
        out = []
        tag = '⭐' if is_five else '🔁'
        head = f"{tag} {tl(t_)}{FULL_NAME(t_)} {z['lc']:+g} — {matchup(z['gid'], False)} · {z['g']['k'].astimezone(PT):%a %H:%M PT}"
        out += roll('sc-five', f"sc5-{slug(t_)}", head, True)
        _nf, _na = sc_expert_counts(z)
        out += [f"**Contest {z['side']} {z['lc']:+g}** · market now {_mk(z['lm'])}{(' (%+d)' % z['lm_price']) if z['lm'] is not None else ''} · line value {('%+.1f' % z['val']) if z['val'] is not None else '—'}{(' · ' + z['key']) if z['key'] else ''} · projected margin {_mk(z['marg'])} (room {('%+.1f' % z['cush']) if z['cush'] is not None else '—'}) · spread experts {_nf} – {_na}" + (f" · projection {proj_txt(z['gid'])}" if proj_txt(z['gid']) else ''), '']
        out += sc_pitch_sections(z)
        out += [f"[SuperContest game breakdown →](#sc-game-{slug(z['gid'])})"] + RE
        return out
    S += roll('sc-group', 'sc-grp-five', f'⭐ Dashboard AI proposal ({len(card_sc)} sides)', True)
    for t_, l_ in card_sc: S += _card(t_, l_, True)
    S += RE
    if card_alt:
        S += roll('sc-group sc-group-alt', 'sc-grp-alt', f'🔁 Alternates ({len(card_alt)}): swap-ins if a pick falls through', True)
        for t_, l_ in card_alt: S += _card(t_, l_, False)
        S += RE
    # pinned pick-sheet side panel (JS moves it to the page edge)
    _rows = []
    _gm = collections.OrderedDict()
    for z in sorted(live_sides, key=lambda q: (q['g']['k'], q['gid'])): _gm.setdefault(z['gid'], []).append(z)
    for gid_, zs_ in _gm.items():
        A_, H_ = gid_.split('@')
        zs_ = sorted(zs_, key=lambda q: 0 if q['side'] == A_ else 1)
        f_ = next((q for q in zs_ if q['fav']), zs_[0])
        mk_ = ('%+g' % f_['lm']) if f_['lm'] is not None else '—'
        def _pair(who):
            out_ = []
            for q in zs_:
                lab = f"{q['side']} {q['lc']:+g}"
                mq_ = ('%+g' % q['lm']) if q['lm'] is not None else '—'
                out_.append(f"<label title='{lab} (market {mq_})'><input type='checkbox' class='pk-box' data-who='{who}' data-side='{lab}' data-game='{gid_}' data-default='{1 if q['side'] in our5 else 0}' aria-label='{who.title()}: {lab}'>{lab}</label>")
            return ''.join(out_)
        _rows.append(f"<tr class='pk-first'><td class='pk-side'><div class='pk-g'>{tl(A_)}<b>{A_}</b> @ {tl(H_)}<b>{H_}</b></div><div class='pk-mk'>mkt {f_['side']} {mk_}</div><div class='pk-st' data-game='{gid_}'></div></td>"
                     f"<td class='pk-pair'>{_pair('andy')}</td><td class='pk-pair'>{_pair('amanda')}</td></tr>")
    S += ['', '<a id="sc-pick-sheet"></a>',
          '<aside id="pk-panel" class="pk-panel" aria-label="Andy and Amanda pick sheet"><div class="pk-ph" onclick="pkTogglePanel()"><span>✍️ Our pick sheet</span><span id="pk-counts" class="pk-counts"></span><span class="pk-caret">▾</span></div>'
          '<div class="pk-body"><div class="pk-top"><span>Andy <b id="pk-n-andy">0/5</b></span><span>Amanda <b id="pk-n-amanda">0/5</b></span><span>Official <b id="pk-n-lock">0/5</b></span></div>'
          '<div id="pk-status" class="pk-statusline">Pick your sides</div>'
          '<div class="pk-btns"><button class="btn-toggle" type="button" onclick="pkSeed(\'andy\')">Andy: our five</button><button class="btn-toggle" type="button" onclick="pkSeed(\'amanda\')">Amanda: our five</button><button class="btn-toggle" type="button" onclick="pkClear(\'andy\')">Clear Andy</button><button class="btn-toggle" type="button" onclick="pkClear(\'amanda\')">Clear Amanda</button></div>'
          '<div class="pk-scroll"><table class="pk-table"><thead><tr><th>Game</th><th>Andy</th><th>Amanda</th></tr></thead><tbody>' + ''.join(_rows) + '</tbody></table></div>'
          '<div class="pk-official"><div class="pk-oh">🔒 Official five</div><ol id="pk-list-lock"></ol><div id="pk-frozen" class="bar-hint"></div>'
          '<div class="pk-btns"><button class="btn-toggle btn-primary" type="button" onclick="pkLockAgreed()">Lock agreed picks</button><button class="btn-toggle" type="button" id="pk-freeze" onclick="pkFreeze()">Freeze official five</button><button class="btn-toggle" type="button" onclick="copyPicks()">Copy official five</button></div>'
          '<details class="pk-share"><summary>📨 Send / receive picks (remote)</summary><div class="pk-hint">Amanda: tick your five, tap <b>Copy Amanda\'s picks</b>, then text or email it to Andy. Andy: paste it in the box and tap <b>Load from box</b>. A plain text like “Amanda: JAX -2.5, CLE +5.5…” works too.</div><textarea id="pk-text" rows="4" placeholder="Paste picks here…"></textarea><div class="pk-btns"><button class="btn-toggle" type="button" onclick="pkShare(\'amanda\')">Copy Amanda\'s picks</button><button class="btn-toggle" type="button" onclick="pkShare(\'andy\')">Copy Andy\'s picks</button><button class="btn-toggle btn-primary" type="button" onclick="pkReceive()">Load from box</button><button class="btn-toggle" type="button" onclick="pkShare(\'sheet\')">Copy full sheet</button><button class="btn-toggle" type="button" onclick="resetPicks()">Reset all</button></div></details></div></div></aside>', '']
    # 1. every side ranked
    S += ['', '<a id="sc-ranked"></a>', '## 1. Every Side, Ranked for the Contest', '',
          'Every game still to be played, with both sides on one line. Each side shows its rank among all sides (#1 is strongest), the market line, line value, room, experts and score. Tick the box next to a side to add it to the pick sheet for whoever is chosen at the top left.', '']
    S += roll('sc-rank', 'sc-score-defs', '📖 How the contest ranking works') + [
         '- **Room vs contest line:** our projected margin for the side, compared with the contest spread. "+5.5" means our projection clears the contest line by 5½ points; negative means our projection does not cover.',
         '- **Line value:** how many points better (positive) or worse (negative) the contest line is than the sportsbook line right now. Getting on or off 3 or 7 counts extra.',
         '- **Experts:** how many named experts picked this side vs the other side.',
         '- **Big money:** where larger bettors are putting their money on the spread.',
         '- **The score** adds these up: room (capped at 7) + 1½× line value + ½ per net expert (up to ±3) ± ½ for big money and key numbers. It ranks sides against each other; it is not a win chance. Our projections are written estimates, not a computer model.'] + RE
    S += ['| Game | Favorite | Underdog | Best side |', '|---|---|---|---|']
    _by = collections.OrderedDict()
    for z in live_sides: _by.setdefault(z['gid'], []).append(z)
    def _rcell(z):
        lab = f"{z['side']} {z['lc']:+g}"
        return '<br>'.join([f"<span class='sc-slot' data-side='{lab}'></span>{sline(z)} · **#{z['rank']}** {verdict(z)}",
                            f"market {('%+g' % z['lm']) if z['lm'] is not None else '—'} · value {('%+.1f' % z['val']) if z['val'] is not None else '—'}{(' · ' + z['key']) if z['key'] else ''}",
                            f"room {('%+.1f' % z['cush']) if z['cush'] is not None else '—'} · experts {z['nf']}–{z['na']}{' · 💰' if z['bm'] else ''} · score {z['score']:.1f}"])
    for gid_, zs_ in _by.items():
        f_ = next((q for q in zs_ if q['fav']), None); d_ = next((q for q in zs_ if not q['fav']), None); b_ = zs_[0]
        S.append(f"| <a href='#sc-game-{slug(gid_)}' data-mi='game-{slug(gid_)}' class='mi-link' title='Open the Master Intel write-up'>{matchup(gid_, False)}</a> | {_rcell(f_) if f_ else '—'} | {_rcell(d_) if d_ else '—'} | {sline(b_)} · score {b_['score']:.1f} |")
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
    # 2b. betting splits
    def _spl_cell(b, m):
        return f"{b}% / {m}%" if (b or m) else '—'
    S += ['', '<a id="sc-splits-anchor"></a>'] + roll('sc-split', 'sc-splits', f"📊 Betting splits by game (Action Network, {len(SPL)} games)", True)
    if SPL:
        try: _w = datetime.datetime.fromisoformat(max(r_['captured_at'] for r_ in SPL.values())).astimezone(PT).strftime('%a %b %d %H:%M PT')
        except Exception: _w = 'unknown time'
        S += [f"Spread splits only. Bars show the share of bets (tickets) and the share of money on each side of the spread, as on Action Network. Captured {_w}, so it can lag the market. 💰 = the money share beats the bets share by 15+ points (big-money side). A game with no posted spread split says so.", '',
              '<div class="sp-legend"><span><i class="sp-k bets"></i>% of bets</span><span><i class="sp-k money"></i>% of money</span></div>']
        def _bar(lab, v, cls):
            return f'<div class="sp-row {cls}"><span class="sp-lab">{lab}</span><span class="sp-bar"><i style="width:{v}%"></i></span><b>{v}%</b></div>'
        def _side(label, bt, mn):
            flag = ' 💰' if (mn - bt) >= 15 else ''
            return f'<div class="sp-side"><div class="sp-name">{label}{flag}</div>{_bar("Bets", bt, "bets")}{_bar("Money", mn, "money")}</div>'
        def _mkt(title, a_lab, a_bt, a_mn, h_lab, h_bt, h_mn, has):
            if not has: return f'<div class="sp-mkt"><div class="sp-mt">{title}</div><div class="sp-na">no split posted</div></div>'
            return f'<div class="sp-mkt"><div class="sp-mt">{title}</div>{_side(a_lab, a_bt, a_mn)}{_side(h_lab, h_bt, h_mn)}</div>'
        cards = []
        for x in sorted(scl['games'], key=lambda x: next((g['k'] for g in sched if g['id'] == sc_gid(x)), datetime.datetime.max.replace(tzinfo=datetime.timezone.utc))):
            gid = sc_gid(x)
            if not gid or gid not in SPL: continue
            sp_ = SPL[gid]; A_, H_ = gid.split('@'); g_ = next((g for g in sched if g['id'] == gid), None); b_ = G.get(gid) or {}
            hb, hm = sp_['spread_home_bettors'], sp_['spread_home_money']; ob, om = sp_['total_over_bettors'], sp_['total_over_money']; mb, mm = sp_['ml_home_bettors'], sp_['ml_home_money']
            sA = (b_.get('sp') or {}).get(A_, (None, None))[0]; sH = (b_.get('sp') or {}).get(H_, (None, None))[0]
            tO = (b_.get('tot') or {}).get('Over', (None, None))[0]
            mA = (b_.get('ml') or {}).get(A_); mH = (b_.get('ml') or {}).get(H_)
            lab = lambda ab, ln: f"{tl(ab)}{ab}" + (f" <em>{ln}</em>" if ln not in (None, '') else '')
            when = g_['k'].astimezone(PT).strftime('%a %H:%M PT') if g_ else ''
            cards.append('<div class="sp-game"><div class="sp-head"><strong>' + f"{tl(A_)}{A_} @ {tl(H_)}{H_}" + f'</strong><span>{when}{" · 🏁 played" if (g_ and g_["done"]) else ""}</span></div><div class="sp-cols">'
                + (_side(lab(A_, f"{sA:+g}" if sA is not None else ''), 100 - hb, 100 - hm) + _side(lab(H_, f"{sH:+g}" if sH is not None else ''), hb, hm) if (hb or hm) else '<div class="sp-na">no spread split posted</div>')
                + '</div></div>')
        S += ['<div class="sp-grid">' + ''.join(cards) + '</div>']
    else:
        S += ['No betting splits were posted for this week yet.']
    S += RE
    # 3. expert panel
    S += ['', '<a id="sc-experts"></a>', '## 3. The Expert Panel: Who Is on Which Side', '',
          'Every verified point-spread pick a named expert made this week, lined up against our five.', '']
    byx = collections.defaultdict(list)
    for g in live:
        for r in EXP.get(g['id'], []):
            if r.get('pick_type') != 'spread': continue
            tm = teams_in(str(r.get('selection') or '')) & {g['visitor'], g['home']}
            if len(tm) == 1: byx[r.get('expert') or '?'].append((list(tm)[0], g['id'], r))
        for p_ in YT.get(g['id'], []):
            if str(p_.get('market') or '').lower() != 'spread': continue
            tm = teams_in(p_['pick']) & {g['visitor'], g['home']}
            if len(tm) == 2:
                pos = {t_: re.search(r'\b' + t_ + r'\b', p_['pick']) for t_ in tm}
                tm = {min((t_ for t_ in tm if pos[t_]), key=lambda t_: pos[t_].start())} if any(pos.values()) else tm
            if len(tm) == 1: byx[p_['speaker']].append((list(tm)[0], g['id'], dict(selection=p_['pick'], line=(p_.get('raw') or {}).get('line'), price=p_.get('price'), yt=True)))
    _panel_votes = collections.defaultdict(set)
    _panel_game = {}
    for _ex, _lst in byx.items():
        _per_game = collections.defaultdict(collections.Counter)
        for _team, _gid, _r in _lst: _per_game[_gid][_team] += 1
        for _gid, _counts in _per_game.items():
            _top = max(_counts.values())
            _leaders = [t_ for t_, n_ in _counts.items() if n_ == _top]
            if len(_leaders) == 1:
                _team = _leaders[0]
                _panel_votes[_team].add(_ex); _panel_game[_team] = _gid
    _panel_ranked = sorted(_panel_votes, key=lambda t_: (-len(_panel_votes[t_]), t_))
    S += ['### Pick Summary — sides experts named most',
          'Each expert counts once per game on the side they named most; an expert split between both teams is omitted. The current BKR spread is shown as a reference quote.',
          '| Rank | Side | Experts | Current BKR spread | Game | Names |', '|---|---|---:|---|---|---|']
    for _i, _team in enumerate(_panel_ranked, 1):
        _gid = _panel_game[_team]; _q = ((G.get(_gid) or {}).get('sp') or {}).get(_team)
        _bkr = f"{_team} {_q[0]:+g} ({_q[1]:+d})" if _q and _q[0] is not None and _q[1] is not None else (f"{_team} {_q[0]:+g}" if _q and _q[0] is not None else '—')
        S.append(f"| {_i} | {tl(_team)}{_team} | {len(_panel_votes[_team])} | {_bkr} | {matchup(_gid, False)} | {esc(', '.join(sorted(_panel_votes[_team])))} |")
    if not _panel_ranked: S.append('| — | — | 0 | — | — | No verified side picks |')
    S.append('')
    _CITED = collections.defaultdict(list)
    for _ex, _lst in byx.items():
        for _t, _g, _r in _lst:
            try: _v = float(_r.get('line')) if _r.get('line') is not None else None
            except Exception: _v = None
            if _v is not None and abs(_v) < 40 and _r.get('pick_type') == 'spread': _CITED[(_t, _g)].append(_v)
    def _xl(q):
        # line for one expert pick: as cited if the expert/transcript gave it, otherwise estimated from the Bookmaker line we hold (marked ~)
        tm_, gid_, r_ = q; ln = r_.get('line'); sel = str(r_.get('selection') or '')
        try: v = float(ln) if ln is not None else None
        except Exception: v = None
        if v is not None and abs(v) < 40: return f" **{v:+g}**"
        # 1) other experts' cited lines on this same side this week (the number the market was offering when picks were made), 2) the opening line, 3) the line we hold now
        oth = sorted(x_ for x_ in _CITED.get((tm_, gid_), []) if x_ is not r_.get('_self'))
        est = oth[len(oth) // 2] if oth else None
        if est is None:
            o_ = (OPEN.get(gid_) or {}).get('sp') or {}
            est = o_.get(tm_)
        if est is None:
            mk = ((G.get(gid_) or {}).get('sp') or {}).get(tm_)
            est = mk[0] if mk and mk[0] is not None else None
        if est is not None: return f" ~{est:+g} (est.)"
        return ' (line n/a)'
    xgroups = collections.defaultdict(list)
    for ex_, lst in byx.items(): xgroups[EXPERT_SHOW.get(ex_) or _yt_show(ex_) or 'Other / independent'].append((ex_, lst))
    S += ['Experts are grouped by the show or network their picks came from. Each group opens and closes on its own. The number after each team is the spread the expert cited (bold). A ~ number with "est." means the expert did not state a spread, so it is estimated from what other experts cited for that side this week, then the opening spread, then the current BKR spread.', '']
    for gname, items in sorted(xgroups.items(), key=lambda kv: (kv[0].startswith('Other'), -sum(len(l_) for _, l_ in kv[1]))):
        items = sorted(items, key=lambda kv: -len(kv[1]))
        S += roll('sc-exp', f'sc-exp-{slug(gname)}', f"🎙️ {esc(gname)} — {len(items)} expert{'s' if len(items) != 1 else ''}: {', '.join(esc(e_) for e_, _ in items)}", True)
        S += ['| Expert | Sides picked this week, with line | Agrees with our five | Disagrees with our five |', '|---|---|---|---|']
        for ex_, lst in items:
            seen_ = []; [seen_.append(q) for q in lst if (q[0], q[1]) not in [(s0, s1) for s0, s1, _ in seen_]]
            agree = [q[0] for q in seen_ if q[0] in our5]
            disagree = [q[0] for q in seen_ if any(q[1] == z['gid'] and z['side'] in our5 and q[0] != z['side'] for z in SIDES)]
            S.append(f"| <span id='scx-{slug(ex_)}'></span>**{esc(ex_)}** | {' · '.join(tl(q[0]) + q[0] + _xl(q) for q in seen_)} | {', '.join(agree) or '—'} | {', '.join(disagree) or '—'} |")
        S += RE
    # 4. game by game
    S += ['', '<a id="sc-games"></a>', '## 4. Game-by-Game Spread-Only Breakdowns', '',
          'Every game on the contest board, in kickoff order: the contest line, both sides\' room against it, and side-specific evidence. Only evidence that bears on a side is included here.', ''] + controls('sc-game', 'games')
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
              f"| Spread experts on this side | {sc_expert_counts(f_)[0]} | {sc_expert_counts(d_)[0]} |",
              f"| Big money on the spread | {'💰' if f_['bm'] else ''} | {'💰' if d_['bm'] else ''} |",
              f"| Contest rank | {f_.get('rank', '—')} | {d_.get('rank', '—')} |", '']
        _context = next((SCNOTE.get(t_) for t_, _ in card_sc + card_alt if SCNOTE.get(t_) and any(gg['id'] == gid and t_ in (gg['visitor'], gg['home']) for gg in sched)), '')
        if _context: S += [f"**Selected-side evidence:** {esc(_context)}", '']
        sp_ex = [r for r in EXP.get(gid, []) if r.get('pick_type') == 'spread']
        if sp_ex:
            S += roll('sc-game-sub', f"sc-game-{slug(gid)}-experts", f"🎙️ Expert spread picks ({len(sp_ex)})") + [
                  f"- {link_sources(r.get('expert') or '?', gid)}: **{esc(r.get('selection'))}** {esc(r.get('line') or '')}" for r in sp_ex] + RE
        S += [f"[Game-by-game spread analysis →](#sc-game-{slug(gid)})"] + RE
    # 5. review + rules
    standings_path = ROOT / f'data/supercontest/standings-week-{WW}-{D}.md'
    if not standings_path.exists():
        snapshots = sorted(p for p in (ROOT / 'data/supercontest').glob(f'standings-week-{WW}-{a.season}-*.md') if p.stem[-10:] <= D)
        if snapshots: standings_path = snapshots[-1]
    standings_lines = standings_path.read_text(encoding='utf-8').strip().splitlines() if standings_path.exists() else []
    ai_review_path = ROOT / 'data/supercontest/dashboard-ai-review-2026.json'
    ai_review = json.loads(ai_review_path.read_text(encoding='utf-8')) if ai_review_path.exists() else {}
    review_weeks = ai_review.get('weeks', [])
    graded_weeks = [r for r in review_weeks if r.get('status') == 'graded']
    source_note = ''
    S += ['', '<a id="sc-review"></a>', '## 5. SuperContest Standings & Season Review', '']
    if standings_lines:
        # Surface Amanda Rose's current point gaps and the fifth-place payout cutoff
        # before the full standings tables. Snapshot has points, not W-L records.
        standings_text = '\n'.join(standings_lines)
        parsed = {}
        for section, body in re.findall(r'^###\s+([^\n]+)\n(.*?)(?=^###\s+|\Z)', standings_text, re.M | re.S):
            rows = []
            for line in body.splitlines():
                if not line.startswith('|'): continue
                cells = [x.strip() for x in line.strip().strip('|').split('|')]
                if cells and not all(re.fullmatch(r'[-: ]+', x or ' ') for x in cells): rows.append(cells)
            if rows: parsed[section.lower()] = rows
        overall_rows = next((v for k, v in parsed.items() if 'overall' in k), [])
        quarterly_rows = next((v for k, v in parsed.items() if 'quarter' in k), [])
        def standings_values(rows, heading):
            if len(rows) < 2: return None
            header = [x.lower() for x in rows[0]]
            player_col = next((i for i, x in enumerate(header) if x == 'player'), 0)
            score_col = next((i for i, x in enumerate(header) if x in (heading, 'qtrly score', 'quarterly score')), 1)
            data = rows[1:]
            def value(row):
                try: return float(row[score_col].replace(',', ''))
                except (IndexError, ValueError): return None
            amanda = next((r for r in data if len(r) > player_col and r[player_col].strip().lower() == 'amanda rose'), None)
            scores = sorted((value(r) for r in data if value(r) is not None), reverse=True)
            return (value(amanda), scores[0] if scores else None, scores[4] if len(scores) >= 5 else None)
        overall = standings_values(overall_rows, 'total score')
        quarterly = standings_values(quarterly_rows, 'qtrly score')
        if overall and overall[0] is not None:
            S += [f'**Amanda Rose — Overall:** {overall[0]:g} points; **GB:** {overall[1]-overall[0]:g}; {overall[2]-overall[0]:g} points below the current fifth-place payout score ({overall[2]:g}).']
        if quarterly and quarterly[0] is not None:
            S += [f'**Amanda Rose — Quarterly:** {quarterly[0]:g} points; **GB:** {quarterly[1]-quarterly[0]:g}. The quarter ends after Week 8.']
        if graded_weeks:
            ai_points = sum(float(r.get('ai_score', 0)) for r in graded_weeks)
            amanda_points = sum(float(r.get('official_score', 0)) for r in graded_weeks)
            S += [f'**Dashboard AI total:** {ai_points:g}/{5 * len(graded_weeks)} points.']
        S += ['']
        # In the HTML report, keep each standings table independently collapsible.
        # The DOCX converter treats these summaries as normal section labels.
        rendered_standings = []
        standings_open = False
        source_note = standings_lines[0] if standings_lines and standings_lines[0].startswith('Source: ') else ''
        standings_content = standings_lines[1:] if source_note else standings_lines
        for standings_line in standings_content:
            heading = re.match(r'^###\s+(Overall standings|Quarterly leaderboard)\s*$', standings_line, re.I)
            if heading:
                if standings_open: rendered_standings.append('</details>')
                title = heading.group(1)
                ident = 'sc-overall-standings' if title.lower().startswith('overall') else 'sc-quarterly-standings'
                rendered_standings += [f'<details class="rollup-box sc-standings-table" id="{ident}">', f'<summary>{title}</summary>']
                standings_open = True
            else:
                rendered_standings.append(standings_line)
        if standings_open: rendered_standings.append('</details>')
        S += rendered_standings + ['', '<details class="rollup-box" id="sc-card-record">', '<summary>Platinum Rose card record — weekly review</summary>', '<div class="rollup-content">', '']
    else:
        S += ['_No supplied SuperContest standings snapshot was found for this build._', '', '<details class="rollup-box" id="sc-card-record">', '<summary>Platinum Rose card record — weekly review</summary>', '<div class="rollup-content">', '']
    if ai_review:
        ai_pts = sum(float(r.get('ai_score', 0)) for r in graded_weeks)
        official_pts = sum(float(r.get('official_score', 0)) for r in graded_weeks)
        S += ['', f"**Dashboard AI total:** {ai_pts:g}/{5 * len(graded_weeks)} points.", '', '_Pick assessment: near-miss is 3 or fewer ATS points short; completely off is 10 or more points short._', '']
    history_by_week = {wk: rs for wk, rs in HIST}
    for review_row in review_weeks:
        wk = int(review_row.get('week', 0) or 0)
        official_rows = history_by_week.get(wk, [])
        official_file = J(f'data/supercontest/locked-card-week-{wk}.json', []) or []
        amanda_picks = sc_review.grade_picks(wk, official_file) if official_file else []
        amanda_score = sc_review.score_picks(amanda_picks)
        ai_picks = sc_review.grade_picks(wk, review_row.get('ai_picks', []))
        ai_card_score = sc_review.score_picks(ai_picks)
        amanda_summary = amanda_score['summary'] if official_file else 'awaiting frozen five'
        if amanda_score['unknown']: amanda_summary += f" · {amanda_score['unknown']} ungraded"
        ai_summary = ai_card_score['summary'] if review_row.get('ai_picks') else 'not comparable'
        S += roll('sc-review sc-week-review', f'sc-week-review-{wk}', f"📉 Week {wk}: Amanda {amanda_summary} · Dashboard AI {ai_summary}")

        def review_table(label, rows):
            out = [f'### {label}', '', '| Pick | Result | Final | Margin vs line | Pick assessment | Game post-mortem |', '|---|---|---|---:|---|---|']
            for item in rows:
                mark = '✅' if item.get('result') == 'Win' else ('➖' if item.get('result') == 'Push' else ('❌' if item.get('result') == 'Loss' else '—'))
                margin = '%+g' % item['margin'] if item.get('margin') is not None else '—'
                assessment = esc(sc_review.pick_postmortem(wk, item, review_row).get('assessment', ''))
                details = sc_review.postmortem_html(wk, item, review_row).replace('|', '&#124;')
                out.append(f"| {esc(item.get('pick', ''))} | {mark} {esc(item.get('result', '?'))} | {esc(item.get('final', '—'))} | {margin} | {assessment} | {details} |")
            return out

        if amanda_picks:
            S += review_table(f"Amanda — official card: {amanda_score['summary']}", amanda_picks)
            if amanda_score['unknown']:
                S += ['', f"_Ungraded picks excluded from score: {amanda_score['unknown']}._"]
        else:
            S += ['### Amanda — official card', '', '_No frozen official card is preserved for this week._']
        if review_row.get('ai_picks'):
            S += [''] + review_table(f"Dashboard AI — frozen five: {ai_card_score['summary']}", ai_picks)
        elif review_row.get('status') == 'missing_snapshot':
            S += ['', '### Dashboard AI — not comparable', '', f"_No complete frozen five-pick recommendation set was preserved. {esc(review_row.get('dashboard_why') or review_row.get('note', ''))}_"]
        else:
            S += ['', '### Dashboard AI proposal', '', f"_{esc(review_row.get('note', 'Results pending; the Dashboard AI proposal is tracked separately from Andy and Amanda’s official contest five.'))}_"]
        if review_row.get('source'):
            S += ['', f"_Review source: {esc(review_row['source'])}_"]
        S += ['', '</div>', '</details>', '']
    hooks = [r for _, rs in HIST for r in rs if r.get('note')]
    S += ['', '**Rules of thumb we carry forward:**', '',
          '- **Contest-vs-market value first.** The one Week 1 winner was the pick with the best contest-vs-market number. Prefer sides where the contest gives more points than the market does now.',
          f"- **Respect 3 and 7.** " + (f"Last week {', '.join(r['pick'] for r in hooks)} lost by the half point." if hooks else 'Half points around 3 and 7 decide contest weeks.') + ' A contest line that is worse than the market by a half point around those numbers needs a clearly stronger case.',
          '- **Spread the risk.** Avoid stacking picks that all need the same thing to happen (for example several games that all depend on a backup quarterback struggling).',
          '- **Agreement is a tiebreaker, not a reason.** A lopsided expert count helps, but heavy public agreement can already be priced into the market line.']
    S += ['', '</div>', '</details>', '']
    if source_note:
        caveat = '“Games behind” is expressed as a contest-points gap because this snapshot does not include win-loss records. The fifth-place score is a current cutoff reference; final ties follow contest rules.'
        S += [f'<p class="sc-standings-footnote"><em>{esc(caveat)}</em><br>{esc(source_note)}</p>', '']
    S += ['<a id="disclaimer"></a>',
          '<div class="legal-disclaimer" style="margin-top: 36px; padding: 16px 18px; border: 1px solid var(--border); border-radius: 8px; background: var(--highlight); font-size: 0.82rem; line-height: 1.55; color: var(--muted);"><strong style="color: var(--text);">⚖️ Disclaimer — for entertainment purposes only.</strong> This report is opinion and research for entertainment and informational purposes. It is not financial, investment, legal or betting advice, and no result is guaranteed. Lines, injuries and availability change. Any pick or wager is your own decision, made at your own risk: the author and Platinum Rose accept no responsibility or liability for any outcome arising from use of this report. Play only where it is legal for you, and only if you are of legal age. If gambling stops being fun, help is available at 1-800-GAMBLER.</div>']
    SC_ICON = {'rec': '⭐', '1': '📊', '2': '⚖️', '3': '🎙️', '4': '🏈', '5': '📉'}
    SC_PLAIN = {'rec': 'Dashboard AI Proposal', '1': 'Every Side, Ranked', '2': 'Contest vs. Market', '3': 'The Expert Panel', '4': 'Game-by-Game', '5': 'Standings & Review'}
    SC_TIP = {'rec': 'The five contest picks on this week\'s card, each with the case for it, plus the pick sheet to settle your joint five.',
              '1': 'Every side still to be played, ranked for the contest by room against the line, contest-vs-market value, experts and big money.',
              '2': 'Where the contest\'s locked line is better or worse than the sportsbook line right now.',
              '3': 'Which named experts are on which sides, and where they agree or disagree with our five.',
              '4': 'Each game on the contest board: both sides\' numbers and the write-up.',
              '5': 'The current overall and quarterly contest standings, our card record and the lessons we carry forward.'}
    S, STOC = wrap_sections(S, icons=SC_ICON, names={'rec': 'Dashboard AI Proposal — Platinum Rose contest card'})
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
                   our_five=[dict(team=t_, line=l_, note=SCNOTE.get(t_, ''), reasoning=SC_PITCH.get(t_, {})) for t_, l_ in card_sc], alternates=[dict(team=t_, line=l_, reasoning=SC_PITCH.get(t_, {})) for t_, l_ in card_alt],
                   season_record=dict(wins=wins, losses=losses, pushes=pushes, points=season_pts, weeks=[dict(week=wk, picks=rs) for wk, rs in HIST]),
                   sides=[{k: z[k] for k in ('gid', 'side', 'opp', 'lc', 'lm', 'marg', 'cush', 'val', 'key', 'nf', 'na', 'bm', 'score', 'result', 'fav')} | dict(rank=z.get('rank'), stars=(z['lean']['conf'] if z['lean'] else None)) for z in SIDES]),
              open(smd.with_suffix('.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False, default=_j)
    print(f'wrote {smd}')
    if not a.no_export:
        convert_summary.generate_docx(str(smd), str(smd.with_suffix('.docx')))
        convert_summary.generate_html(str(smd), str(smd.with_suffix('.html')))
        # Locked-format gate (Andy 2026-10-25): layout, spread-only, Pitch/Pushback on every AI pick + alternate
        import check_sc_report
        _f, _w = check_sc_report.check(W, a.season, out_dir)
        for _x in _w: print('  sc warn:', _x)
        if _f:
            print(f'SuperContest format gate: FAIL ({len(_f)}) — do not send; fill the pitch file (pitch_scaffold.py) and rebuild')
            for _x in _f: print('  ✗', _x)
        else:
            print('SuperContest format gate: PASS')

if __name__ == '__main__':
    main()
