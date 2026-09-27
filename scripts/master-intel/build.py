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
import argparse, collections, datetime, glob, json, os, re, sys, zoneinfo
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PT = zoneinfo.ZoneInfo('America/Los_Angeles')
FULL = {'Arizona Cardinals':'ARI','Atlanta Falcons':'ATL','Baltimore Ravens':'BAL','Buffalo Bills':'BUF','Carolina Panthers':'CAR','Chicago Bears':'CHI','Cincinnati Bengals':'CIN','Cleveland Browns':'CLE','Dallas Cowboys':'DAL','Denver Broncos':'DEN','Detroit Lions':'DET','Green Bay Packers':'GB','Houston Texans':'HOU','Indianapolis Colts':'IND','Jacksonville Jaguars':'JAX','Kansas City Chiefs':'KC','Las Vegas Raiders':'LV','Los Angeles Chargers':'LAC','Los Angeles Rams':'LAR','Miami Dolphins':'MIA','Minnesota Vikings':'MIN','New England Patriots':'NE','New Orleans Saints':'NO','New York Giants':'NYG','New York Jets':'NYJ','Philadelphia Eagles':'PHI','Pittsburgh Steelers':'PIT','San Francisco 49ers':'SF','Seattle Seahawks':'SEA','Tampa Bay Buccaneers':'TB','Tennessee Titans':'TEN','Washington Commanders':'WAS'}
NICK = {v: k.split()[-1] for k, v in FULL.items()}
CITY = {v: ' '.join(k.split()[:-1]).lower() for k, v in FULL.items()}
ALIAS = {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX', 'LVR': 'LV', 'NOS': 'NO'}
LOW_TRUST_CITY = {'NYG', 'NYJ', 'LAC', 'LAR'}  # shared cities: match only by nickname

def FULL_NAME(ab): return next((k for k, v in FULL.items() if v == ab), ab)
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
    'Tier': ('Sourcing Tier', '1 = matchup data (secondary-matchup HIGH/MED or a verified role/usage edge). 2 = named expert, week-specific, 2+ independent sources. 3 = prediction market beats the book. 4 = price only. "1+2" has both.'),
    'Lean': ('Lean', 'The side or outcome the evidence points to. A lean is not a ticket; tickets live in the card.'),
    'Sources': ('Evidence', 'Where the lean comes from: matchup data, named experts/podcasts, splits, injuries.'),
    'Price / structure': ('Price & Structure', 'Combined American price (naive multiply for parlays; same-game parlays price lower at the book) or round-robin combos with average returns by hits.'),
    'Stake': ('Stake', 'Template stake for the ticket (unit = $10).'),
    'Fav / spread': ('Favorite & Spread', 'Bookmaker (BKR) spread on the favorite at capture time.'),
    'Total': ('Game Total', 'BKR over/under points line.'),
    'Projected': ('Projected Final Score', 'Written projection from §6: market-implied score adjusted for injuries, secondary-matchup tier, sharp splits, line movement and expert consensus. Not a model output.'),
    'Implied score': ('Market-Implied Score', 'Favorite = total/2 + spread/2, underdog = total/2 − spread/2. What the betting market expects, not a simulation.'),
    'Win % (no-vig)': ('No-Vig Win Probability', 'Both BKR moneylines converted to implied probability, then scaled so they sum to 100% (vig removed).'),
    'Spread tix/$ (home)': ('Spread Splits', 'Action Network share of spread tickets / share of spread money on the HOME team. Money well above tickets = bigger (sharper) bets on that side.'),
    'Total tix/$ (over)': ('Total Splits', 'Share of total tickets / money on the OVER.'),
    'Flag': ('Sharp-Money Flag', 'Raised when money share minus ticket share is 15+ points on one side: fewer, larger bets.'),
    'Side A (sources)': ('Away-Side Sources', 'Distinct sources leaning to the away team. Each source counts once per game, on the side it picked most often; ties dropped.'),
    'Side B (sources)': ('Home-Side Sources', 'Distinct sources leaning to the home team (same counting rule).'),
    'Total lean': ('Total Consensus', 'Over/Under side with more distinct sources (count in brackets).'),
    'Clash?': ('Clash', 'Both sides have 2+ distinct sources: a genuine disagreement, not a consensus.'),
    'Leg': ('Teaser Leg', 'The side in a 6-point teaser. Wong strategy: favorites −7.5 to −8.5 down, dogs +1.5 to +2.5 up, crossing both 3 and 7.'),
    'Current': ('Current Line', 'BKR spread and price at capture time.'),
    'Teased': ('Teased Line', 'The line after the 6-point adjustment.'),
    'Consensus on that side': ('Consensus Support', 'Distinct sources on that side (from §3).'),
    'Rung': ('Ladder Rung', 'Threshold for an "N+" prop ladder; N+ equals Over N−0.5. Shown rung is the one priced closest to −110.'),
    'Price': ('Quoted Price', 'Book price at capture time. Re-check the slip before placing.'),
    'No-vig win %': ('No-Vig Win Probability', 'Survivor ranking by vig-free BKR moneyline probability.'),
    'Market': ('Market', 'Bet type and line as quoted.'),
    'Source': ('Source', 'Outlet or analyst the pick came from.'),
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

ROLL_END = ['', '[⬆ Back to Executive Master Board](#executive-master-board)', '</div>', '</details>']

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

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--date', required=True)
    ap.add_argument('--season', type=int, default=2026); ap.add_argument('--no-export', action='store_true')
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
    dk = [json.load(open(f)) for f in dkfiles]
    digest_p = next((p for p in [f'scratch/w{WW}-synthesis-digest-sat.md', f'scratch/w{WW}-synthesis-digest.md'] if (ROOT / p).exists()), None)
    card_p = f'reports/bets/{a.season}-w{WW}-card.md'
    card = (ROOT / card_p).read_text(encoding='utf-8') if (ROOT / card_p).exists() else ''
    nar_p = f'reports/intel/master-intel-narratives-{a.season}-w{WW}.md'
    NAR = load_narratives(ROOT / nar_p)
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
    for r in pull['expert']:
        T = teams_in(f"{r.get('visitor')} {r.get('home')}")
        for gid, g in ids.items():
            if {g['visitor'], g['home']} <= T:
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
    for e in avail:
        if e.get('position') not in ('QB', 'RB', 'WR', 'TE'): continue
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
    else: gaps.append('No synthesis digest (scratch/w<NN>-synthesis-digest*.md) — sections 1/4 fall back to consensus counts only.')
    # ---------- card tickets ----------
    miss_nar = [g['id'] for g in live if not (NAR.get(g['id']) or {}).get('secs')]
    if miss_nar: gaps.append(f'No §6 narrative/projection for: {", ".join(miss_nar)} ({nar_p}).')
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
        r = [x for x in rows if x['player'] == player and x['market'] == market and x['available'] and x['odds'] is not None]
        return min(r, key=lambda x: abs(dec(x['odds']) - 1.91), default=None)

    L = []
    asof = bkr['rows'][0].get('capturedAt', '')[:16]
    L += [f'# 🏈 NFL Week {W} Master Betting Intelligence Report',
          '## Multi-Platform Consensus, Market-Implied Board & Game-by-Game Analytical Dossier',
          f'### Built {datetime.datetime.now(PT).strftime("%a %b %d %Y %H:%M PT")} by scripts/master-intel/build.py — prices are BKR {D} capture ({asof}Z); verify every slip',
          '', '_Proposals and research context only. Nothing here is placed. Sportsbook prices ≠ prediction-market percentages; never mix them without a fee/spread check._', '',
          '| Input | Status |', '|---|---|',
          f"| BKR SGP + game lines | {len(G)} games, {len(bkr['rows'])} lines |",
          f"| BEO prop boards | {len({r['game'] for r in beo})} games |",
          f"| DK Predictions saves | {len(dk)} games |",
          f"| Research signals / articles / expert picks | {len(pull['signals'])} / {len(pull['notes'])} / {len(pull['expert'])} (since {pull['window_start'][:10]}) |",
          f"| Podcast transcripts processed | {pull.get('podcast_transcripts_processed')} |",
          f"| YouTube picks (cleaned) | {len(yt.get('picks', []))} |",
          f"| Splits | {len(SPL)} games |", '']
    FS = final_scores(W)
    done = [g for g in sched if g['done']]
    def gsid(gid): return 'game-' + gid.lower().replace('@', '-')
    def proj_txt(gid):
        pj = (NAR.get(gid) or {}).get('proj')
        return f'{pj[0][0]} {pj[0][1]} – {pj[1][0]} {pj[1][1]}' if pj else ''
    qb_notes = []
    for g in live:
        for t in (g['visitor'], g['home']):
            for n, e in INJ.get(t, {}).items():
                if e.get('position') == 'QB' and str(e.get('normalized_status', '')).upper().startswith(('OUT', 'DOUBTFUL')): qb_notes.append(f'{t} {n} {e["normalized_status"].title()}')
    sharp = []
    for g in live:
        sp_ = SPL.get(g['id']) or SPL.get(g['id'].replace('WAS', 'WSH'))
        if not sp_: continue
        if (sp_['spread_home_money'] or 0) - (sp_['spread_home_bettors'] or 0) >= 15: sharp.append(f"{g['home']} spread")
        if (sp_['spread_home_bettors'] or 0) - (sp_['spread_home_money'] or 0) >= 15: sharp.append(f"{g['visitor']} spread")
        if (sp_['total_over_money'] or 0) - (sp_['total_over_bettors'] or 0) >= 15: sharp.append(f"{g['id']} Over")
        if (sp_['total_over_bettors'] or 0) - (sp_['total_over_money'] or 0) >= 15: sharp.append(f"{g['id']} Under")
    pulled_all = []
    for gid_, b_ in G.items():
        pp = sorted({r['player'] for r in b_['rows'] if not r['available']})
        if pp: pulled_all.append(f"{gid_}: {', '.join(pp)}")
    results = []
    for g in done:
        f_ = FS.get(g['id'])
        results.append(f"<strong>{g['id']}</strong> 🏁 FINAL — {f_['away'][0]} {f_['away'][1]}, {f_['home'][0]} {f_['home'][1]}" if f_ else f"<strong>{g['id']}</strong> 🏁 FINAL")
    L += ['<div class="status-banner" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-left: 5px solid #3B82F6; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; color: #F8FAFC;">',
          f'  <div style="font-size: 1.05rem; font-weight: 700; color: #60A5FA; margin-bottom: 4px;">🚨 Slate Status ({datetime.datetime.now(PT).strftime("%a %b %d, %Y %H:%M PT")} — BKR lines {D})</div>',
          '  <div style="font-size: 0.92rem; line-height: 1.5;">',
          f"    • <strong>Played:</strong> {'; '.join(results) or 'none yet'}. <strong>{len(live)} games remain.</strong><br>",
          f"    • <strong>QB changes (Out/Doubtful):</strong> {', '.join(qb_notes) or 'none'}.<br>",
          f"    • <strong>Sharp money (money − tickets ≥ 15 pts):</strong> {', '.join(sharp) or 'none'}.<br>",
          f"    • <strong>Pulled at BKR (listed, no odds — status check):</strong> {'; '.join(pulled_all) or 'none'}.<br>",
          '    • <strong>Known gaps:</strong> __GAPS__ — details in §11.<br>',
          '    • <strong>Interactive tooltips &amp; sortable tables:</strong> 💡 hover any underlined column header for its definition; click any column header to sort; use the controls below §1 to expand/collapse every dossier.',
          '  </div>', '</div>', '']
    # Executive summary
    L += ['<a id="executive-summary"></a>', '## 📌 Executive Summary', '']
    tops = [x for x in LEANS if x['tier'].startswith('1') and x['lean'].lower() not in ('skip', 'split', '—')][:6]
    if tops:
        L.append('**Top matchup-data reads (tier 1 = secondary-matchup HIGH/MED or verified role + expert support):**'); L.append('')
        for x in tops: L.append(f"- **{esc(x['game'])} — {esc(x['market'])}** → {esc(x['lean'])} ({esc(x['tier'])})")
        L.append('')
    one_sided = []
    clashes = []
    for g in live:
        c_ = CONS.get(g['id'], {}); A_, H_ = g['visitor'], g['home']; na, nh = len(c_.get(A_, ())), len(c_.get(H_, ()))
        if max(na, nh) >= 4 and min(na, nh) <= 1: one_sided.append(f"{A_ if na > nh else H_} ({max(na, nh)}–{min(na, nh)})")
        if na >= 3 and nh >= 3: clashes.append(f"{g['id']} ({na}–{nh})")
    L += [f"- **Most one-sided consensus:** {', '.join(one_sided) or 'none'}.",
          f"- **Biggest clashes (≥3 sources each side):** {', '.join(clashes) or 'none'}.",
          f"- **Sharp-money flags:** {', '.join(sharp) or 'none'}.",
          f"- **QB watch:** {', '.join(qb_notes) or 'none'}.",
          f"- **Card:** {len(TICK)} tickets in `{card_p}`" + (f" — total ${sum(float(t[2]) for t in TICK):.0f} as built." if TICK else '.'), '']
    # 1
    L += ['<a id="executive-master-board"></a>', '## 1. Executive Master Board: Best Bets, Props, Tickets & Teasers', '']
    if LEANS:
        L += ['| Game | Market | Lean | Tier | Sources |', '|---|---|---|---|---|']
        for x in sorted(LEANS, key=lambda x: (not x['tier'].startswith('1'), x['game'])):
            if x['lean'].lower() in ('skip', '—', 'split'): continue
            L.append(f"| {esc(x['game'])} | {esc(x['market'])} | {esc(x['lean'])} | {esc(x['tier'])} | {esc(x['source'])[:140]} |")
    if TICK:
        L += ['', f'**Card tickets** (full leg tables: `{card_p}`)', '', '| Ticket | Book | Stake | Price / structure |', '|---|---|---|---|']
        for n, b, st, pr, ret in TICK: L.append(f'| {esc(n)} | {esc(b)} | ${st} | {esc(pr)} — {esc(ret)} |')
    L += ['', '<div class="global-rollup-bar">', '  <span class="bar-title">⚡ Matchup &amp; Section Dossier Controls:</span>',
          '  <button class="btn-toggle btn-primary" onclick="toggleAllRollups(true)">Expand All Sections</button>',
          '  <button class="btn-toggle" onclick="toggleAllRollups(false)">Collapse All Sections</button>',
          '  <span class="bar-hint">💡 Click any matchup link to jump to its dossier. Click any table header to sort.</span>', '</div>', '', '---']
    # 2
    L += ['', '<a id="synth-engine-section"></a>', '## 2. Platinum Rose Market-Implied Forecast Board', ''] + controls('section-synth', 'Section 2') + roll('section-synth', 'platinum-rose-board', '📊 Full market board — implied scores, no-vig win %, splits &amp; sharp flags', True) + [ '_Implied scores = total/2 ± spread/2 (BKR). Win % = no-vig BKR moneyline. Splits: Action Network tickets / money (home side for spread & ML, Over for total). **Sharp** = money − tickets ≥ 15 pts._', '',
          '| Kickoff (PT) | Game | Fav / spread | Total | Implied score | Projected | Win % (no-vig) | Spread tix/$ (home) | Total tix/$ (over) | Flag |', '|---|---|---|---|---|---|---|---|---|---|']
    for g in live:
        gid = g['id']; b = G.get(gid)
        if not b: L.append(f"| {g['k'].astimezone(PT):%a %H:%M} | {gid} | not on BKR capture | | | | | | | |"); continue
        f, s = fav(gid); t = (b['tot'].get('Over') or (None,))[0]
        imps = ''
        if f is not None and t is not None:
            dog = b['home'] if f == b['away'] else b['away']; fs = t / 2 - s / 2; ds = t - fs; imps = f'{f} {fs:.1f} – {dog} {ds:.1f}'
        nv = novig(gid); wp = ' / '.join(f'{k} {v*100:.0f}%' for k, v in sorted(nv.items(), key=lambda x: -x[1]))
        sp = SPL.get(gid) or SPL.get(gid.replace('WAS', 'WSH'))
        flag = []
        if sp:
            if (sp['spread_home_money'] or 0) - (sp['spread_home_bettors'] or 0) >= 15: flag.append(f"sharp {b['home']} spread")
            if (sp['spread_home_bettors'] or 0) - (sp['spread_home_money'] or 0) >= 15: flag.append(f"sharp {b['away']} spread")
            if (sp['total_over_money'] or 0) - (sp['total_over_bettors'] or 0) >= 15: flag.append('sharp Over')
            if (sp['total_over_bettors'] or 0) - (sp['total_over_money'] or 0) >= 15: flag.append('sharp Under')
        L.append(f"| {g['k'].astimezone(PT):%a %H:%M} | [{gid}](#{gsid(gid)}) | {f} {s:+g} | {t} | {imps} | {proj_txt(gid)} | {wp} | {sp and str(sp['spread_home_bettors'])+'/'+str(sp['spread_home_money'])} | {sp and str(sp['total_over_bettors'])+'/'+str(sp['total_over_money'])} | {', '.join(flag)} |")
    L += ROLL_END
    # 3
    L += ['', '<a id="consensus-section"></a>', '## 3. In-Depth Multi-Platform Consensus & High-Stakes Clashes', ''] + controls('section-3', 'Section 3') + roll('section-3', 'consensus-overview', '🧭 Consensus overview — every game', True) + [ '_Each source (writer/outlet, podcast expert, YouTube host) counts **once per game**, on the side it leaned to most often; ties are dropped. Note: outlet-level feeds (ESPN NFL, VSiN) aggregate several writers, so treat them as one vote. A **clash** = both sides have ≥2 sources._', '',
          '| Game | Side A (sources) | Side B (sources) | Total lean | Clash? |', '|---|---|---|---|---|']
    for g in live:
        gid = g['id']; c = CONS.get(gid, {}); A, H = g['visitor'], g['home']
        a_, h_ = c.get(A, set()), c.get(H, set()); u, o = c.get('Under', set()), c.get('Over', set())
        tl = f"Under ({len(u)})" if len(u) > len(o) else (f"Over ({len(o)})" if o else '—')
        L.append(f"| {gid} | {A} {len(a_)} — {esc(', '.join(sorted(a_))[:90])} | {H} {len(h_)} — {esc(', '.join(sorted(h_))[:90])} | {tl} | {'**yes**' if len(a_) >= 2 and len(h_) >= 2 else ''} |")
    L += ROLL_END
    ranked = []
    for g in live:
        c_ = CONS.get(g['id'], {}); A_, H_ = g['visitor'], g['home']
        a_, h_ = c_.get(A_, set()), c_.get(H_, set())
        side, n1, n2, fr, ag = (A_, len(a_), len(h_), a_, h_) if len(a_) >= len(h_) else (H_, len(h_), len(a_), h_, a_)
        if n1 >= 2: ranked.append((n1 - n2, n1, g, side, fr, ag))
    ranked.sort(key=lambda x: (-x[0], -x[1]))
    for i, (m_, n1, g, side, fr, ag) in enumerate(ranked):
        n2 = len(ag); badge = '🌟 Near-Unanimous' if n2 == 0 or n1 >= 3 * max(n2, 1) else ('🔥 Majority' if m_ >= 2 else '⚔️ Clash')
        b_ = G.get(g['id']); f_, s_ = fav(g['id']); tot_ = b_ and (b_['tot'].get('Over') or (None,))[0]
        ln = b_ and b_['sp'].get(side); nv = novig(g['id']).get(side)
        L += roll('section-3', 'consensus-' + g['id'].lower().replace('@', '-'), f"{badge} #{i+1}: {NICK_FULL(side)} {ln[0]:+g} — {g['visitor']} at {g['home']} ({n1} vs {n2})" if ln else f"{badge} #{i+1}: {side} — {g['id']} ({n1} vs {n2})")
        L += [f"* **Game Details:** {g['k'].astimezone(PT):%a %H:%M PT} | **Market Spread:** {f_} {s_:+g} | **Total:** {tot_}" if f_ else f"* **Game Details:** {g['k'].astimezone(PT):%a %H:%M PT}",
              f"* **Consensus Count:** {badge} ({n1} vs {n2}) — for: {esc(', '.join(sorted(fr)))} | against: {esc(', '.join(sorted(ag))) or 'none'}",
              f"* **Market Read:** no-vig win % {side} {nv*100:.0f}%" if nv else '* **Market Read:** n/a']
        for r in EXP.get(g['id'], [])[:4]:
            L.append(f"  * _{esc(r.get('expert'))}_: {esc(r.get('pick_type'))} **{esc(r.get('selection'))}** {esc(r.get('line') or '')} — {esc(r.get('rationale'))[:120]}")
        for x in LEANS:
            if x['game'].split(' ')[0] == g['id']: L.append(f"* **Card lean:** {esc(x['market'])} → {esc(x['lean'])} (tier {esc(x['tier'])})")
        L.append(f"* **Full breakdown:** [game dossier](#{gsid(g['id'])})")
        L += ROLL_END
    # 4
    L += ['', '<a id="feature-plays"></a>', '## 4. High-Conviction Feature Plays & Signature Expert Bets', ''] + controls('section-4', 'Section 4')
    feats = [x for x in LEANS if x['tier'].startswith('1')]
    for i, x in enumerate(feats):
        L += roll('section-4', f'feature-{i+1}', f"🎯 #{i+1} {esc(x['game'])} — {esc(x['market'])} (tier {esc(x['tier'])})")
        L += [f"* **Lean:** {esc(x['lean'])}", f"* **Evidence:** {esc(x['source'])}"]
        gid_ = x['game'].split(' ')[0]
        if gid_ in ids: L.append(f"* **Full breakdown:** [game dossier](#{gsid(gid_)})")
        L += ROLL_END
    if not feats: L.append('- No tier-1 leans in the digest.')
    L += ['', '**Signature expert bets (week-specific, named):**', '']
    seen = set()
    for gid in ids:
        for r in EXP.get(gid, [])[:4]:
            k = (r.get('expert'), r.get('selection'))
            if k in seen: continue
            seen.add(k); L.append(f"- {gid}: **{esc(r.get('expert'))}** — {esc(r.get('pick_type'))} {esc(r.get('selection'))} {esc(r.get('line') or '')} — _{esc(r.get('rationale'))[:120]}_")
    # 5
    L += ['', '## 5. The Master 6-Point Wong Teaser Matrix & Underdog ML Parlay', '', '_Wong-eligible = favorites −7.5 to −8.5 (tease to −1.5/−2.5) and dogs +1.5 to +2.5 (tease to +7.5/+8.5), crossing 3 and 7. Keep teasers to 2 legs._', '',
          '| Game | Leg | Current | Teased | Consensus on that side |', '|---|---|---|---|---|']
    anyw = False
    for g in live:
        b = G.get(g['id'])
        if not b: continue
        for t, (ln, od) in b['sp'].items():
            if -8.5 <= ln <= -7.5 or 1.5 <= ln <= 2.5:
                anyw = True; L.append(f"| {g['id']} | {t} | {ln:+g} ({od:+d}) | {ln+6:+g} | {len(CONS.get(g['id'], {}).get(t, set()))} |")
    if not anyw: L.append('| — | no Wong-eligible lines | | | |')
    dogrr = [t for t in TICK if 'Dog' in t[0]]
    if dogrr: L += ['', f'**Underdog ML round robin:** {esc(dogrr[0][0])} — {esc(dogrr[0][1])} — ${dogrr[0][2]} — {esc(dogrr[0][3])} ({esc(dogrr[0][4])}). Legs in the card.']
    # 6
    L += ['', '<a id="game-dossier"></a>', '## 6. Full Chronological Analytical Dossier (With Market Cards)', '', '_Each game opens with a written game script, projected final score and the reasoning behind the card lean (source: `' + nar_p + '`), then the evidence it was built from._', ''] + controls('section-6', 'Section 6')
    for g in sched:
        gid = g['id']; A, H = g['visitor'], g['home']
        b0 = G.get(gid); f0, s0 = fav(gid) if b0 else (None, None); t0 = b0 and (b0['tot'].get('Over') or (None,))[0]
        fsc = FS.get(gid)
        head = f"⏰ {g['k'].astimezone(PT):%a %H:%M PT} — {FULL_NAME(A)} @ {FULL_NAME(H)}" + (f" — {f0} {s0:+g} · O/U {t0}" if f0 else '') + ((f" · Proj {proj_txt(gid)}") if proj_txt(gid) and not g['done'] else '') + ((f" — 🏁 FINAL {fsc['away'][0]} {fsc['away'][1]}–{fsc['home'][0]} {fsc['home'][1]}" if fsc else ' — 🏁 FINAL') if g['done'] else '')
        L += [f'<a id="{gsid(gid)}"></a>'] + roll('section-6', gsid(gid) + '-box', head)
        if g['done']: L += ['_Played before this build; excluded from every slot._'] + ROLL_END; continue
        b = G.get(gid)
        nar = NAR.get(gid) or {}
        if nar.get('secs') or nar.get('proj'):
            L += ['<div class="game-narrative" style="border-left: 4px solid #3B82F6; background: rgba(59,130,246,0.07); padding: 12px 16px; border-radius: 6px; margin: 4px 0 16px 0;">']
            pj = nar.get('proj')
            if pj:
                (t1, s1), (t2, s2) = pj; w_, l_ = ((t1, s1), (t2, s2)) if s1 >= s2 else ((t2, s2), (t1, s1))
                ctx = []
                f_, sp_ = fav(gid) if b else (None, None); tt_ = b and (b['tot'].get('Over') or (None,))[0]
                if f_ is not None and tt_ is not None:
                    dog_ = b['home'] if f_ == b['away'] else b['away']; fs_ = tt_ / 2 - sp_ / 2
                    ctx.append(f"market-implied {f_} {fs_:.1f} – {dog_} {tt_ - fs_:.1f}")
                    fav_margin = (s1 - s2) if t1 == f_ else (s2 - s1)
                    cov = f_ if fav_margin > -sp_ else (dog_ if fav_margin < -sp_ else 'push')
                    ctx.append(f"projected margin {w_[0]} by {w_[1] - l_[1]} → covers: {cov} ({f_} {sp_:+g})")
                    ctx.append(f"total {s1 + s2} vs {tt_} → {'Over' if s1 + s2 > tt_ else 'Under' if s1 + s2 < tt_ else 'push'}")
                L.append(f'<div style="font-size: 1.08rem; font-weight: 700; margin-bottom: 4px;">🎯 Projected final: {w_[0]} {w_[1]}, {l_[0]} {l_[1]}</div>')
                if ctx: L.append(f'<div style="font-size: 0.86rem; opacity: 0.85; margin-bottom: 8px;">{" · ".join(ctx)}</div>')
            o = OPEN.get(gid)
            if o and b:
                mv = []
                for t in (A, H):
                    if t in o['sp'] and t in b['sp'] and o['sp'][t] < 0 or (t in o['sp'] and t in b['sp'] and o['sp'][t] == 0):
                        mv.append(f"spread {t} {o['sp'][t]:+g} → {b['sp'][t][0]:+g}")
                if b['tot'].get('Over'): mv.append(f"total {o['tot']:g} → {b['tot']['Over'][0]:g}")
                for t in (A, H):
                    if t in o['ml'] and t in b['ml']: mv.append(f"ML {t} {o['ml'][t]:+d} → {b['ml'][t]:+d}")
                L.append(f'<div style="font-size: 0.86rem; margin-bottom: 8px;">📈 <strong>Line movement</strong> (BKR {o["src"]} → {D} capture): {" · ".join(mv)}</div>')
            icons = {'game script': '📖', 'why the card leans this way': '🧠', 'what breaks it': '⚠️'}
            for t, body in nar.get('secs', []):
                L.append(f'<div style="font-weight: 700; margin-top: 8px;">{icons.get(t.lower(), "•")} {t}</div>')
                for para in [x.strip() for x in body.split('\n\n') if x.strip()]:
                    L.append(f'<p style="margin: 4px 0 6px 0;">{md_inline(" ".join(para.splitlines()))}</p>')
            L += ['</div>', '']
        if b:
            L += ['| | ' + A + ' | ' + H + ' |', '|---|---|---|',
                  f"| Spread (BKR) | {b['sp'].get(A, ('', 0))[0]:+g} ({b['sp'].get(A, ('', 0))[1]:+d}) | {b['sp'].get(H, ('', 0))[0]:+g} ({b['sp'].get(H, ('', 0))[1]:+d}) |" if A in b['sp'] and H in b['sp'] else '| Spread | n/a | n/a |',
                  f"| Moneyline | {b['ml'].get(A, 0):+d} | {b['ml'].get(H, 0):+d} |" if b['ml'] else '| Moneyline | n/a | n/a |',
                  f"| Total | O {b['tot'].get('Over', ('?', 0))[0]} ({b['tot'].get('Over', ('?', 0))[1]:+d}) | U {b['tot'].get('Under', ('?', 0))[0]} ({b['tot'].get('Under', ('?', 0))[1]:+d}) |" if b['tot'] else '| Total | n/a | n/a |']
            qbs = {team_of(r['player']): r['player'] for r in b['rows'] if r['market'] == 'pass_yds'}
            L.append(f"| QB (BKR markets) | {qbs.get(A, '?')} | {qbs.get(H, '?')} |")
            for t in (A, H):
                pass
            L.append('')
        sp = SPL.get(gid) or SPL.get(gid.replace('WAS', 'WSH'))
        if sp: L.append(f"- **Splits (AN):** spread {H} {sp['spread_home_bettors']}% tickets / {sp['spread_home_money']}% money · ML {H} {sp['ml_home_bettors']}% / {sp['ml_home_money']}% · Over {sp['total_over_bettors']}% / {sp['total_over_money']}%")
        for off, de in ((A, H), (H, A)):
            m = SEC.get((off, de))
            if m and str(m.get('vulnerability_tier')).lower() in ('high', 'medium'):
                rec = ', '.join(str((x.get('player_name') or x.get('name') or '?') if isinstance(x, dict) else x) for x in (m.get('target_receivers') or [])[:3])
                L.append(f"- **Secondary matchup:** {off} passing O vs {de} D — **{m['vulnerability_tier'].upper()}** (severity {m.get('severity_score')}){'; targets: ' + rec if rec else ''}")
        for t in (A, H):
            inj = INJ.get(t, {})
            if inj: L.append(f"- **{t} injuries (skill):** " + '; '.join(f"{n} {e['position']} {e['normalized_status'].title()}" for n, e in sorted(inj.items())))
        c = CONS.get(gid, {})
        if c: L.append('- **Consensus:** ' + ' · '.join(f"{k} ({len(v)}: {', '.join(sorted(v))[:80]})" for k, v in sorted(c.items(), key=lambda x: -len(x[1]))))
        for r in EXP.get(gid, [])[:6]:
            L.append(f"- _{esc(r.get('expert'))}_: {esc(r.get('pick_type'))} **{esc(r.get('selection'))}** {esc(r.get('line') or '')} — {esc(r.get('rationale'))[:110]}")
        for p in YT.get(gid, [])[:6]:
            L.append(f"- _{esc(p['speaker'])} (YouTube, {esc(p['show'].split(' — ')[0])})_: **{esc(p['pick'])}** {p.get('price') or ''} {('— ⚠ ' + esc(p['verify'])) if p.get('verify') else ''}")
        ps = sorted(PROPSIG.get(gid, {}).items(), key=lambda x: -len(x[1]))[:4]
        for k, v in ps: L.append(f"- _Prop signal_ ({len(v)}): {k} — {', '.join(sorted(v))[:60]}")
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
            if key: L.append('- **BKR main-rung props (≈−110):** ' + ' · '.join(key))
            if atd: L.append('- **Shortest anytime TD (BKR):** ' + ' · '.join(f"{r['player']} {r['odds']:+d}" for r in atd))
            pulled = sorted({r['player'] for r in rows if not r['available']})
            if pulled: L.append('- **Listed without odds at BKR (status check):** ' + ', '.join(pulled))
        for d_ in dk:
            if {FULL.get(d_['away'].replace('CAR Panthers', 'Carolina Panthers')), FULL.get(d_['home'])} and (NICK.get(A, '') in d_['away'] and NICK.get(H, '') in d_['home']):
                gl = {(r['market'], r['side']): r for r in d_['rows'] if r['market'].startswith('game_')}
                L.append('- **DK Predictions (contract %, pre-fee):** ' + ' · '.join(f"{r['side']} {r['market'].replace('game_', '')} {('' if r['line'] is None else format(r['line'], '+g') if 'spread' in r['market'] else r['line'])} {r['prob']*100:.0f}%" for r in gl.values()))
        for x in LEANS:
            if x['game'].split(' ')[0] == gid: L.append(f"- **Card lean:** {esc(x['market'])} → {esc(x['lean'])} (tier {esc(x['tier'])})")
        L += ROLL_END
    # 7
    L += ['', '<a id="parlay-cards"></a>', '## 7. Platinum Rose Parlay Cards & Construction Rules', ''] + controls('section-7', 'Section 7') + roll('section-7', 'parlay-card-list', '🎟️ Card tickets &amp; season build rules', True)
    if TICK:
        L += ['| Ticket | Book | Stake | Price |', '|---|---|---|---|'] + [f'| {esc(n)} | {esc(b)} | ${s} | {esc(p)} |' for n, b, s, p, r in TICK]
    m = re.search(r'\*\*Build rules that come from the data\.[^\n]*\n\n(\|.*?\n)(?:\n)', (ROOT / 'agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md').read_text(encoding='utf-8'), re.S)
    if m: L += ['', '**Build rules from the season record** (`agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` §5):', '', m.group(1).strip()]
    L += ROLL_END
    # 8
    L += ['', '<a id="prop-card"></a>', '## 8. Master Player Prop & Exotic Wager Card', ''] + controls('section-8', 'Section 8') + roll('section-8', 'prop-card-box', '🧾 Props: article tier-1, tackles+assists, 2+ pass TD', True)
    ppi = J('data/research-intel/review/player-props-intel-latest.json', {}) or {}
    pl = ppi.get('props') or ppi.get('rows') or []
    live_games = {f"{g['visitor']} @ {g['home']}" for g in live}
    t1 = [p for p in pl if str(p.get('tier', '')).lower().startswith(('tier 1', '1', 'tier_1')) and p.get('game') in live_games][:24]
    if t1:
        L += ['**Article-sourced tier-1 props** (`player-props-intel`, completed games excluded):', '', '| Game | Player | Market | Line | Price | Source |', '|---|---|---|---|---|---|']
        for p in t1: L.append(f"| {esc(p.get('game'))} | {esc(p.get('player'))} | {esc(p.get('market') or p.get('category'))} | {esc(p.get('line') or p.get('selection'))} | {esc(p.get('odds') or p.get('price'))} | {esc(p.get('source') or p.get('expert'))[:40]} |")
    ta = [r for r in beo if r.get('market') == 'tackles_assists']
    if ta:
        best = {}
        for r in ta:
            if -250 <= r['odds'] <= 130:
                k = r['player']; best.setdefault(k, r)
                if abs(dec(r['odds']) - 1.91) < abs(dec(best[k]['odds']) - 1.91): best[k] = r
        L += ['', '**Tackles + assists main rungs (BEO)** — the season\'s best-hitting prop type:', '', '| Game | Player | Rung | Price |', '|---|---|---|---|']
        for r in sorted(best.values(), key=lambda r: r['game']): L.append(f"| {r['game']} | {r['player']} | {r['line']:g}+ | {r['odds']:+d} |")
    ptd = sorted([r for r in bkr['rows'] if r['market'] == 'pass_td' and r['threshold'] == 2 and r['available']], key=lambda r: r['odds'])
    if ptd: L += ['', '**2+ passing TD (BKR):** ' + ' · '.join(f"{r['player']} {r['odds']:+d}" for r in ptd)]
    L += ROLL_END
    # 9
    L += ['', '<a id="survivor"></a>', '## 9. Master Survivor Contest Strategy Hierarchy', '']
    se = J('data/survivor/yahoo-survivor-entrants-2026.json', {}) or {}
    for gr in se.get('groups', []):
        me = [e for e in gr['entrants'] if e.get('is_user_team')]
        alive = sum(1 for e in gr['entrants'] if e.get('status') == 'alive')
        for e in me: L.append(f"- **{gr['name']}:** {e['team_name']} — **{e['status']}**" + (f" (eliminated wk {e['elimination_week']} on {e['elimination_pick']})" if e.get('eliminated') else '') + f"; field {alive}/{gr['num_teams']} alive")
    cands = []
    for g in live:
        for t, p in novig(g['id']).items(): cands.append((p, t, g['id']))
    L += ['', '| Rank | Team | Game | No-vig win % |', '|---|---|---|---|'] + [f'| {i+1} | {t} | {gid} | {p*100:.0f}% |' for i, (p, t, gid) in enumerate(sorted(cands, reverse=True)[:8])]
    # 10
    L += ['', '## 10. Master Quantitative Betting Systems, Model Rules & Historical Trends', '', '_Articles this week that describe a system, trend or ATS/SU record (auto-selected by keyword; read the source before using)._', '']
    sysn = [n for n in pull['notes'] if re.search(r'\b(system|trend|ATS|since 20\d\d|\d+-\d+ (ATS|SU))\b', f"{n.get('title')} {n.get('summary')}", re.I)]
    for n in sysn[:15]: L.append(f"- **{esc(n['source'])}** — [{esc(n['title'])[:110]}]({n.get('url') or ''}) — {esc(n.get('summary'))[:160]}")
    L.append('- **Our own model rule:** the quant prop model failed validation (Brier skill −3.3%, calibration inverted). Never use a model edge % to select or size legs.')
    # 11
    L += ['', '## 11. Unified Expert Pick Registry & Source Coverage', '']
    srcs = collections.Counter(n['source'] for n in pull['notes'])
    auth = collections.Counter((r.get('author') or r.get('source')) for r in pull['signals'])
    exps = collections.Counter(r.get('expert') for r in pull['expert'])
    L += ['| Articles by source | n |', '|---|---|'] + [f'| {esc(k)} | {v} |' for k, v in srcs.most_common(20)]
    L += ['', '| Pick signals by author/outlet | n |', '|---|---|'] + [f'| {esc(k)} | {v} |' for k, v in auth.most_common(20)]
    L += ['', '| Podcast experts (user_picks EXPERT) | n |', '|---|---|'] + [f'| {esc(k)} | {v} |' for k, v in exps.most_common(20)]
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
    txt = '\n'.join(add_tooltips(L)).replace('__GAPS__', '; '.join(gaps) if gaps else 'none')
    md.write_text(txt + '\n', encoding='utf-8')
    print(f'wrote {md} ({len(L)} lines)')
    if not a.no_export:
        sys.path.insert(0, str(Path(__file__).parent))
        import convert_summary
        convert_summary.generate_docx(str(md), str(md.with_suffix('.docx')))
        convert_summary.generate_html(str(md), str(md.with_suffix('.html')))
    for x in gaps: print('GAP:', x)

if __name__ == '__main__':
    main()
