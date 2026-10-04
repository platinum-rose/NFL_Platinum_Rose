#!/usr/bin/env python3
"""Extra site pages and blocks for the Master Intel client site (called by build_site.py).

  sc_page(ctx)        Super Contest tab: the five, five alternates, reasoning, then expert sides (ATS only) with citations
  props_lab(ctx)      Props Lab: recommended legs per game from every intel source, with the best price across BKR / BEO / DK
  teaser_extras(ctx)  Teaser Board: named experts per Wong leg, expert teaser calls, teaser / round-robin math
  BOOKMARKS_*         bookmark page body, script and styles (localStorage, per viewer)

Everything is read from files already on disk (read-only): the card, the narratives, the verified expert rows,
the podcast episode links (scripts/master-intel/podcast_links.mjs), the BKR / BEO / DK price captures and the
master packet json that build.py writes. Nothing here changes a pick; it only presents what the card and the
intel already say.
"""
import glob, html, json, math, re
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
E = lambda s: html.escape(str(s if s is not None else ''), quote=True)

TEAMS = {
    'ARI': 'Cardinals', 'ATL': 'Falcons', 'BAL': 'Ravens', 'BUF': 'Bills', 'CAR': 'Panthers', 'CHI': 'Bears',
    'CIN': 'Bengals', 'CLE': 'Browns', 'DAL': 'Cowboys', 'DEN': 'Broncos', 'DET': 'Lions', 'GB': 'Packers',
    'HOU': 'Texans', 'IND': 'Colts', 'JAX': 'Jaguars', 'KC': 'Chiefs', 'LV': 'Raiders', 'LAC': 'Chargers',
    'LAR': 'Rams', 'MIA': 'Dolphins', 'MIN': 'Vikings', 'NE': 'Patriots', 'NO': 'Saints', 'NYG': 'Giants',
    'NYJ': 'Jets', 'PHI': 'Eagles', 'PIT': 'Steelers', 'SF': '49ers', 'SEA': 'Seahawks', 'TB': 'Buccaneers',
    'TEN': 'Titans', 'WAS': 'Commanders'}
NICK = {v.lower(): k for k, v in TEAMS.items()}
BEO_CODE = {'LVR': 'LV', 'NOS': 'NO', 'WSH': 'WAS', 'JAC': 'JAX', 'TBB': 'TB', 'GBP': 'GB', 'KCC': 'KC', 'NEP': 'NE', 'SFO': 'SF', 'LA': 'LAR'}


def slug(s): return re.sub(r'[^a-z0-9]+', '-', str(s).lower()).strip('-')
def gpage(gid): return f'game-{slug(gid)}.html'
def am(o):
    try: o = int(round(float(o)))
    except (TypeError, ValueError): return ''
    return f'{o:+d}'.replace('-', '−')
def dec(o):
    o = float(o); return 1 + (o / 100 if o > 0 else 100 / -o)
def ln(x):
    return ('+' if x > 0 else '') + (f'{x:g}'.replace('-', '−'))
def J(p, d=None):
    try: return json.loads(Path(p).read_text(encoding='utf-8'))
    except Exception: return d


# ---------------------------------------------------------------- context
def load(week, date):
    W = f'{int(week):02d}'
    pk = ROOT / f'dist/nfl_week{int(week)}_master_packet/nfl_week{int(week)}_master_betting_intelligence_summary.json'
    M = J(pk, {}) or {}
    games = {g['game']: g for g in M.get('games', [])}
    order = sorted(games, key=lambda k: games[k].get('kickoff_utc', ''))
    ver = J(ROOT / f'data/generated/master-intel/w{W}-expert-verified.json', {}) or {}
    vrows = [r for r in ver.get('rows', []) if r.get('verdict') == 'verified' and r.get('game') in games]
    pods = J(ROOT / f'data/generated/master-intel/w{W}-podcast-links.json', {}) or {}
    card = (ROOT / f'reports/bets/{date[:4]}-w{W}-card.md')
    card = card.read_text(encoding='utf-8') if card.exists() else ''
    narr = ROOT / f'reports/intel/master-intel-narratives-{date[:4]}-w{W}.md'
    narr = narr.read_text(encoding='utf-8') if narr.exists() else ''
    digest = ROOT / f'scratch/w{W}-synthesis-digest-sat.md'
    digest = digest.read_text(encoding='utf-8') if digest.exists() else ''
    team_game = {}
    for gid, g in games.items():
        team_game[g['away']] = gid; team_game[g['home']] = gid
    return dict(week=int(week), date=date, M=M, games=games, order=order, vrows=vrows, pods=pods, card=card,
                narr=narr, digest=digest, team_game=team_game, W=W)


def block(txt, name):
    m = re.search(r'^## ' + re.escape(name) + r'\n(.*?)(?=^## |\Z)', txt, re.M | re.S)
    out = {}
    for l in (m.group(1).splitlines() if m else []):
        mm = re.match(r'^- (.+?): (.+)$', l.strip())
        if mm: out[mm.group(1).strip()] = mm.group(2).strip()
    return out


def fmt_date(s):
    try: return datetime.fromisoformat(str(s).replace('Z', '+00:00')).strftime('%b %-d')
    except Exception: return ''


def who_of(r):
    p = ', '.join(r.get('persons') or [])
    if r.get('kind') == 'podcast':
        return p or 'podcast host'
    return p or r.get('outlet') or 'expert'


def source_html(r, ctx):
    """Citation: outlet / show, date and a public link when one exists."""
    d = fmt_date(r.get('published'))
    if r.get('kind') == 'podcast':
        t = r.get('source_title') or r.get('outlet') or ''
        lk = ctx['pods'].get(t) or ctx['pods'].get(html.unescape(t)) or {}
        links = []
        if lk.get('youtube_url'): links.append(f'<a href="{E(lk["youtube_url"])}" target="_blank" rel="noopener">▶ YouTube episode</a> (auto-transcript on YouTube)')
        if lk.get('audio_url'): links.append(f'<a href="{E(html.unescape(lk["audio_url"]))}" target="_blank" rel="noopener">audio</a>')
        return f'podcast · <em>{E(html.unescape(t))}</em> · {d}' + (' · ' + ' · '.join(links) if links else ' · no public link found')
    if r.get('url'):
        host = urlparse(r['url']).netloc.replace('www.', '')
        title = r.get('source_title') or host
        return f'{E(r.get("outlet") or host)} · {d} · <a href="{E(r["url"])}" target="_blank" rel="noopener">{E(title[:70])} ↗</a>'
    return f'{E(r.get("outlet") or "")} · {d} · expert pick feed (no public link stored)'


def game_label(ctx, gid):
    g = ctx['games'].get(gid) or {}
    return f'{g.get("away", "")} @ {g.get("home", "")}', g.get('kickoff_pt', '')


# ---------------------------------------------------------------- Super Contest
def sc_rows(ctx):
    card = ctx['card']
    m = re.search(r'^## SuperContest[^\n]*\n(.*?)(?=^## |\Z)', card, re.M | re.S)
    five, alts, cur = [], [], None
    if not m: return five, alts, ''
    body = m.group(1)
    hdr = None
    for l in body.splitlines():
        if not l.startswith('|'): continue
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        if hdr is None: hdr = [h.lower() for h in c]; cur = five; continue
        if re.match(r'^[\s:-]*$', ''.join(c)): continue
        if 'alternates' in c[0].lower(): cur = alts; continue
        cur.append(dict(zip(hdr, c)))
    note = next((l for l in body.splitlines() if l.lower().startswith('middle check')), '')
    return five, alts, note


def sc_page(ctx):
    five, alts, note = sc_rows(ctx)
    r5 = block(ctx['narr'], 'SUPERCONTEST'); ralt = block(ctx['narr'], 'SUPERCONTEST ALTERNATES')
    rank = block(ctx['narr'], 'SUPERCONTEST RANKING')
    stars = {}
    for x in (ctx['M'].get('ranked_plays') or []):
        if x.get('type') == 'Side' and x.get('lean') and x['lean'] not in stars:
            stars[x['lean']] = (x.get('stars'), x.get('tier'))
    def aid(team, alt): return f'sc-{"alt" if alt else "pick"}-{slug(team)}'
    def tile(i, r, alt):
        team = r.get('pick', ''); gid = ctx['team_game'].get(team, '')
        lab, ko = game_label(ctx, gid)
        st, tr = stars.get(team, (None, None))
        conf = f'{st:g}★ · tier {tr}' if st is not None else 'no card side lean'
        return (f'<a class="sc-tile{" sc-tile-alt" if alt else ""}" href="#{aid(team, alt)}">'
                f'<span class="sct-rank">{"ALT " if alt else "#"}{i}</span>'
                f'<span class="sct-pick">{E(team)} {E(r.get("contest line", ""))}</span>'
                f'<span class="sct-game">{E(lab)}<br>{E(ko)} PT</span>'
                f'<span class="sct-room">Room {E(r.get("margin vs contest line", ""))}</span>'
                f'<span class="sct-conf">{E(conf)}</span>'
                '<span class="sct-go">Breakdown ↓</span></a>')
    def card_html(i, r, reason, alt=False):
        team = r.get('pick', ''); gid = ctx['team_game'].get(team, '')
        lab, ko = game_label(ctx, gid)
        chips = [('Contest line', r.get('contest line')), ('Book now (BKR)', r.get('book now (bkr)')),
                 ('Our projection', r.get('projection')), ('Room vs contest line', r.get('margin vs contest line'))]
        st, tr = stars.get(team, (None, None))
        if st is not None: chips.append(('Card confidence', f'{st:g}★ · tier {tr}'))
        ch = ''.join(f'<span class="sc-chip"><b>{E(k)}</b> {E(v)}</span>' for k, v in chips if v)
        pos = f'alternate {i}' if alt else f'#{i} of the five'
        how = rank.get(team)
        return (f'<article class="sc-pick bm-item{" sc-alt" if alt else ""}" id="{aid(team, alt)}">'
                f'<div class="sc-rank">{"ALT " if alt else ""}{i}</div><div class="sc-body">'
                f'<h3 class="sc-title">{E(team)} {E(r.get("contest line", ""))}'
                f' <span class="sc-game">{E(lab)} · {E(ko)} PT · <a href="{gpage(gid)}">matchup →</a></span></h3>'
                f'<div class="sc-chips">{ch}</div>'
                + (f'<p class="sc-how"><b>How it got to {E(pos)}:</b> {E(how)}</p>' if how else '')
                + f'<p class="sc-why"><b>Why:</b> {E(reason or "")}</p>'
                f'<p class="sc-support"><b>Evidence:</b> {E(r.get("support", ""))} · <a href="#sc-exp-{slug(gid)}">experts on this game ↓</a> · <a href="#sc-strip">back to the top ↑</a></p></div></article>')
    h = ['<div class="sc-shell" id="sc-page">',
         '<h2 class="page-h">🏆 Super Contest — 5 sides against the spread</h2>',
         '<p class="dashboard-intro">The contest is five picks against the spread at the contest\'s fixed lines: '
         '<b>sides only</b> — no totals, moneylines, props or teasers on this page. The card ranks sides by how much room '
         'our projection leaves against the contest line, then by the evidence. Tap a pick for its breakdown; tap ☆ on a breakdown to save it.</p>',
         '<div class="sc-strip" id="sc-strip"><div class="sc-strip-group"><div class="sc-strip-label">Our five</div><div class="sc-tiles">']
    h += [tile(i + 1, r, False) for i, r in enumerate(five)]
    h += ['</div></div><div class="sc-strip-group"><div class="sc-strip-label">Five alternates</div><div class="sc-tiles">']
    h += [tile(i + 1, r, True) for i, r in enumerate(alts)]
    h += ['</div></div></div>']
    if note: h.append(f'<p class="muted-note">{E(note)}</p>')
    h += ['<h3 id="sc-top5">Our five: breakdowns</h3><div class="sc-list">']
    h += [card_html(i + 1, r, r5.get(r.get('pick', ''))) for i, r in enumerate(five)]
    h += ['</div>', '<h3 id="sc-alternates">Five alternates: breakdowns</h3>',
          '<p class="muted-note">The next-best sides beyond the five recommendations, best first, with what would make each worth swapping in.</p>',
          '<div class="sc-list">']
    h += [card_html(i + 1, r, ralt.get(r.get('pick', '')), alt=True) for i, r in enumerate(alts)]
    h += ['</div>']
    # ---- expert sides, grouped by game ----
    picks = {r.get('pick') for r in five}; altp = {r.get('pick') for r in alts}
    by = defaultdict(list)
    for r in ctx['vrows']:
        if r.get('market') in ('spread', 'contest') and r.get('side'):
            by[r['game']].append(r)
    h += ['<h3 id="sc-experts">What the experts picked against the spread</h3>',
          '<p class="muted-note">Every verified side (spread and contest picks) from this week\'s expert feed, articles and podcasts, '
          'grouped by game. Contest picks are marked 🏆. Podcast picks link to the YouTube episode, where YouTube shows the transcript '
          '(⋯ → Show transcript); article picks link to the article. Rows marked "expert pick feed" came from the pick registry, '
          'which stores no public link.</p>',
          '<div class="rollup-controls"><button class="btn-toggle" onclick="toggleRollups(\'sc-exp\', true)">Open all games</button>'
          '<button class="btn-toggle" onclick="toggleRollups(\'sc-exp\', false)">Close all games</button></div>']
    for gid in ctx['order']:
        rows = by.get(gid, [])
        if not rows: continue
        g = ctx['games'][gid]
        cnt = defaultdict(set)
        for r in rows: cnt[r['side']].add(who_of(r))
        tally = ' · '.join(f'{t} {len(cnt.get(t, ()))}' for t in (g['away'], g['home']))
        ours = [t for t in (g['away'], g['home']) if t in picks] or [t for t in (g['away'], g['home']) if t in altp]
        tag = (' · our pick: ' + ours[0]) if ours and ours[0] in picks else (' · alternate: ' + ours[0]) if ours else ''
        rows.sort(key=lambda r: (r['side'] != g['away'], r.get('market') != 'contest', who_of(r)))
        h += [f'<details class="rollup-box sc-exp" id="sc-exp-{slug(gid)}"><summary><span class="sum-text">'
              f'{E(g["away"])} @ {E(g["home"])} — {E(g.get("kickoff_pt", ""))} PT — experts {E(tally)}{E(tag)}</span></summary>'
              '<div class="rollup-content"><div class="table-responsive"><table><thead><tr>'
              '<th>Side</th><th>Expert</th><th>Line</th><th>Reasoning</th><th>Source</th></tr></thead><tbody>']
        for r in rows:
            line = r.get('line')
            lns = ln(float(line)) if isinstance(line, (int, float)) else ''
            q = re.sub(r'^\[[^\]]*\]\s*', '', r.get('quote') or '')
            h.append(f'<tr><td><b>{E(r["side"])}</b>{" 🏆" if r.get("market") == "contest" else ""}</td>'
                     f'<td>{E(who_of(r))}</td><td>{E(lns)}</td><td>{E(q[:260])}</td><td>{source_html(r, ctx)}</td></tr>')
        h += ['</tbody></table></div>', f'<p><a href="{gpage(gid)}">Full matchup →</a></p></div></details>']
    h.append('</div>')
    return ''.join(h)


# ---------------------------------------------------------------- props
MKEYS = [
    (r'field[ _]?goal', 'fg_made'),
    (r'kicking', 'kick_pts'),
    (r'tackle|\bsacks?\b|defensive', 'defense'),
    (r'longest[ _]rush', 'long_rush'),
    (r'longest[ _](?:reception|rec)', 'long_rec'),
    (r'longest[ _](?:completion|pass)', 'long_pass'),
    (r'total[ _]yards|rush\s*\+\s*rec|scrimmage', 'rr_yds'),
    (r'team[ _]total', 'team_total'),
    (r'first[ _]?(?:td|touchdown)', 'first_td'),
    (r'pass(?:ing)?[ _]?(?:td|touchdown)', 'pass_td'),
    (r'2\+ ?td|2_touchdowns|two touchdowns', 'td2'),
    (r'anytime|\batd\b', 'atd'),
    (r'interception|\bints?\b|pass_int', 'pass_int'),
    (r'pass(?:ing)?[ _]?att|pass attempts', 'pass_att'),
    (r'completion|pass_cmp', 'pass_cmp'),
    (r'pass(?:ing)?[ _]?yard', 'pass_yds'),
    (r'rush(?:ing)?[ _]?att|carries', 'carries'),
    (r'rush(?:ing)?[ _]?yard', 'rush_yds'),
    (r'reception', 'rec'),
    (r'rec(?:eiving)?[ _]?yard', 'rec_yds'),
]
MNAME = {'first_td': 'first TD', 'pass_td': 'pass TDs', 'td2': '2+ TDs', 'atd': 'anytime TD', 'pass_int': 'interceptions',
         'pass_att': 'pass attempts', 'pass_cmp': 'completions', 'pass_yds': 'pass yds', 'carries': 'carries',
         'rush_yds': 'rush yds', 'rec': 'receptions', 'rec_yds': 'rec yds', 'other': '',
         'fg_made': 'field goals made', 'kick_pts': 'kicking points', 'defense': 'tackles / sacks', 'long_rush': 'longest rush',
         'long_rec': 'longest reception', 'long_pass': 'longest completion', 'rr_yds': 'rush + rec yds', 'team_total': 'team total points'}
MKIND = {'first_td': 'TD scorer', 'td2': 'TD scorer', 'atd': 'TD scorer', 'pass_td': 'Passing', 'pass_int': 'Passing',
         'pass_att': 'Passing', 'pass_cmp': 'Passing', 'pass_yds': 'Passing', 'carries': 'Rushing', 'rush_yds': 'Rushing',
         'rec': 'Receiving', 'rec_yds': 'Receiving', 'other': 'Other',
         'fg_made': 'Kicking', 'kick_pts': 'Kicking', 'defense': 'Defense', 'long_rush': 'Rushing', 'long_rec': 'Receiving',
         'long_pass': 'Passing', 'rr_yds': 'Rushing', 'team_total': 'Game props'}
YES = ('atd', 'first_td', 'td2')


def nkey(name):
    t = re.sub(r"[.'’]", '', str(name).lower()).replace('-', ' ').split()
    t = [x for x in t if x not in ('jr', 'sr', 'ii', 'iii', 'iv')]
    if not t: return ('', '')
    return (t[-1], t[0][0] if len(t) > 1 else '')


def parse_leg(text, player=None):
    """'Jacoby Brissett 2+ pass TD' / 'X season_receiving_yards OVER 71.5' / 'X 40+ receiving yards' -> leg dict."""
    t = re.sub(r'^[^:]{3,40}:\s*', '', str(text))           # 'Name: Name - passing_yards OVER 254.5'
    low = t.lower()
    mk = next((k for p, k in MKEYS if re.search(p, low)), None) or 'other'
    side, line = ('yes', None) if mk in YES else (None, None)
    if mk not in YES:
        m = re.search(r'(\d+(?:\.\d+)?)\+', low)
        if m: side, line = 'over', float(m.group(1)) - 0.5
        m = re.search(r'\b(over|under|o|u)\s?(\d+(?:\.\d+)?)', low)
        if m:
            side = 'over' if m.group(1).startswith('o') else 'under'; line = float(m.group(2))
            if line == int(line) and side == 'over': line -= 0.5         # ladder rung 'OVER 300' = 300+
        if mk == 'pass_td' and line is None and re.search(r'2\+', low): side, line = 'over', 1.5
        if side is None:
            side = 'over' if 'over' in low else 'under' if 'under' in low else None
    if not player:
        player = re.split(r'\s+(?:\d|o\d|u\d|over\b|under\b|OVER\b|UNDER\b|anytime|first|season_|player_|rushing|receiving|passing|pass\b|rush\b|receptions|longest|total|2\+|2_|anytime_|first_|over_under|field|kicking|tackles|sacks)', t, maxsplit=1)[0]
        player = player.strip(' -:')
    return dict(player=player.strip(), mkey=mk, side=side, line=line)


def price_books(ctx):
    """Index BKR / BEO / DK player prices: (gid, last, mkey, side) -> {book: [(line, odds, first_initial)]}."""
    idx = defaultdict(lambda: defaultdict(list))
    full2abbr = {}
    for a, n in TEAMS.items(): full2abbr[n.lower()] = a
    def gid_from_names(a, h):
        return next((g for g, x in ctx['games'].items() if x['away'] == a and x['home'] == h), None)
    # BKR (latest capture for the date)
    bk = J(ROOT / f'data/generated/props/bookmaker-live-{ctx["date"]}-week{ctx["week"]}.json', {}) or {}
    BMAP = {'rec_yds': 'rec_yds', 'rec': 'rec', 'rush_yds': 'rush_yds', 'carries': 'carries', 'pass_yds': 'pass_yds',
            'pass_cmp': 'pass_cmp', 'pass_td': 'pass_td', 'atd_1_plus': 'atd', 'first_td': 'first_td', 'td_2_plus': 'td2'}
    for r in bk.get('rows', []):
        mk = BMAP.get(r.get('market'))
        if not mk or not r.get('player') or r.get('odds') is None or r.get('available') is False: continue
        ev = r.get('event', '').split(' @ ')
        if len(ev) != 2: continue
        a = full2abbr.get(ev[0].split()[-1].lower()); hh = full2abbr.get(ev[1].split()[-1].lower())
        gid = gid_from_names(a, hh)
        if not gid: continue
        side = 'yes' if mk in YES else str(r.get('side', '')).lower()
        l_, f_ = nkey(r['player'])
        idx[(gid, l_, mk, side)]['BKR'].append((r.get('line') if mk not in YES else None, int(r['odds']), f_))
    # BEO ladders: line N = N+ (over N-0.5); atd line 2 = 2+ TDs
    for r in J(ROOT / f'data/generated/props/beo-w{ctx["W"]}.json', []) or []:
        a, hh = [BEO_CODE.get(x, x) for x in str(r.get('game', '')).split('_')[:2]] + [None] * (2 - len(str(r.get('game', '')).split('_')[:2]))
        gid = gid_from_names(a, hh)
        if not gid or r.get('odds') is None: continue
        m = r.get('market'); lv = r.get('line')
        if m == 'atd': mk = 'atd' if (lv or 1) == 1 else 'td2' if lv == 2 else None
        elif m == 'first_td': mk = 'first_td'
        else: mk = m if m in MNAME else None
        if not mk: continue
        l_, f_ = nkey(r.get('player'))
        line = None if mk in YES else float(lv) - 0.5
        idx[(gid, l_, mk, 'yes' if mk in YES else 'over')]['BEO'].append((line, int(r['odds']), f_))
    # DK Predictions (contract prices, gross of fees)
    DMAP = {'atd_1_plus': 'atd', 'first_td': 'first_td', 'td_2_plus': 'td2', 'rec_yds': 'rec_yds', 'rush_yds': 'rush_yds', 'pass_yds': 'pass_yds'}
    for f in sorted(glob.glob(str(ROOT / 'data/generated/props/dk-predictions-*-*-at-*.json'))):
        mm = re.search(r'dk-predictions-(\d{4}-\d{2}-\d{2})-([a-z0-9]+)-at-([a-z0-9]+)\.json$', f)
        if not mm or mm.group(1) < ctx['date'][:8] + '01': continue
        gid = gid_from_names(NICK.get(mm.group(2)), NICK.get(mm.group(3)))
        if not gid: continue
        d = J(f, {}) or {}
        for r in d.get('rows', []):
            mk = DMAP.get(r.get('market'))
            if not mk or r.get('american_gross') is None: continue
            pl = r.get('player') or r.get('side') or ''
            pl = re.sub(r'\s+\d+\+$', '', pl)
            l_, f_ = nkey(pl)
            line = None if mk in YES else (float(r['line']) - 0.5 if r.get('line') is not None else None)
            idx[(gid, l_, mk, 'yes' if mk in YES else 'over')]['DK'].append((line, int(r['american_gross']), f_))
    return idx


def best_prices(idx, gid, leg):
    l_, f_ = nkey(leg['player'])
    got = idx.get((gid, l_, leg['mkey'], leg['side'] or 'over')) or {}
    out = {}
    for book, opts in got.items():
        opts = [o for o in opts if not f_ or not o[2] or o[2] == f_]
        if not opts: continue
        if leg['mkey'] in YES or leg['line'] is None:
            exact = opts
        else:
            exact = [o for o in opts if o[0] is not None and abs(o[0] - leg['line']) < 0.01]
        if exact:
            o = max(exact, key=lambda z: dec(z[1])); out[book] = dict(line=o[0], odds=o[1], exact=True)
        elif leg['line'] is not None:
            near = [o for o in opts if o[0] is not None]
            if near:
                o = min(near, key=lambda z: (abs(z[0] - leg['line']), -dec(z[1]))); out[book] = dict(line=o[0], odds=o[1], exact=False)
    return out


def injury_status(ctx, gid, player):
    l_, f_ = nkey(player)
    for x in (ctx['games'].get(gid) or {}).get('injuries_skill') or []:
        l2, f2 = nkey(x.get('player'))
        if l2 == l_ and (not f_ or not f2 or f_ == f2):
            return str(x.get('status', '')).lower()
    return ''


def card_prop_legs(ctx):
    out = []
    for m in re.finditer(r'^### (.+?) — (\w+) — \*\*\$[\d.]+\*\*.*?\n(.*?)(?=^### |^## |\Z)', ctx['card'], re.M | re.S):
        name, body = m.group(1).strip(), m.group(3)
        hdr = None
        for l in body.splitlines():
            if not l.startswith('|'): continue
            c = [x.strip() for x in l.strip().strip('|').split('|')]
            if hdr is None: hdr = [h.lower() for h in c]; continue
            if re.match(r'^[\s:-]*$', ''.join(c)): continue
            d = dict(zip(hdr, c))
            leg = parse_leg(d.get('market & line', ''))
            if leg and leg['mkey'] != 'other' and d.get('game') in ctx['games']:
                out.append(dict(gid=d['game'], leg=leg, ticket=name, price=d.get('price'), book=d.get('book'), why=d.get('why', ''), tier=d.get('tier', '')))
    return out


def digest_prop_legs(ctx):
    out = []
    for l in ctx['digest'].splitlines():
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        if len(c) < 5: continue
        gid = c[0].split(' ')[0]
        if gid not in ctx['games']: continue
        leg = parse_leg(c[1])
        if not leg or leg['mkey'] == 'other': continue
        if not re.search(r'TD|yds|rec|rush|pass|interception', c[1], re.I): continue
        out.append(dict(gid=gid, leg=leg, lean=c[2], why=c[3], tier=c[4]))
    return out


def props_lab(ctx):
    idx = price_books(ctx)
    clusters = {}
    def add(gid, leg, src):
        if not leg or not leg['player']: return
        l_, f_ = nkey(leg['player'])
        k = (gid, l_, leg['mkey'], leg['side'])
        c = clusters.setdefault(k, dict(gid=gid, player=leg['player'], mkey=leg['mkey'], side=leg['side'], lines=[], src=[], card=None, lean=None, raw=leg.get('raw')))
        if len(leg['player']) > len(c['player']): c['player'] = leg['player']
        if leg['line'] is not None: c['lines'].append(leg['line'])
        src.setdefault('line', leg['line'])
        c['src'].append(src)
        return c
    for x in card_prop_legs(ctx):
        c = add(x['gid'], x['leg'], dict(kind='card', who='Platinum Rose card', what=x['ticket'], price=x['price'], book=x['book'], why=x['why']))
        if c: c['card'] = x['ticket']; c['card_line'] = x['leg']['line']
    for x in digest_prop_legs(ctx):
        skip = 'skip' in x['tier'].lower()
        c = add(x['gid'], x['leg'], dict(kind='lean', who='Platinum Rose synthesis', what=('skip' if skip else 'tier ' + x['tier']), why=x['why']))
        if c: c['lean'] = 'skip' if skip else x['tier']
    for r in ctx['vrows']:
        if r.get('market') != 'prop': continue
        pl = (r.get('players') or [None])[0]
        leg = parse_leg(r.get('selection') or '', None)
        if leg and pl: leg['player'] = pl.title() if pl.islower() else pl
        if leg and leg['line'] is None and isinstance(r.get('line'), (int, float)) and leg['mkey'] not in YES:
            leg['line'] = float(r['line'])
        if leg and leg['mkey'] == 'other':
            leg['raw'] = re.sub(r'^[^:]{3,40}:\s*', '', r.get('selection') or '').replace('_', ' ')
        add(r['game'], leg, dict(kind=r.get('kind'), who=who_of(r), row=r, price=r.get('price'), why=re.sub(r'^\[[^\]]*\]\s*', '', r.get('quote') or '')))
    # game props the intel calls out (team totals inside a total pick, e.g. 'Lions team total over')
    for r in ctx['vrows']:
        txt = f"{r.get('selection') or ''} {r.get('quote') or ''}"
        if r.get('market') != 'total' or not re.search(r'team total', txt, re.I): continue
        m_ = re.search(r'(\w+)\s+team total', txt, re.I)
        tm = NICK.get((m_.group(1) if m_ else '').lower())
        if not tm: continue
        side = 'over' if re.search(r'\bover\b', txt, re.I) else 'under'
        leg = dict(player=TEAMS[tm], mkey='team_total', side=side, line=float(r['line']) if isinstance(r.get('line'), (int, float)) else None, team=tm)
        add(r['game'], leg, dict(kind=r.get('kind'), who=who_of(r), row=r, price=r.get('price'), why=re.sub(r'^\[[^\]]*\]\s*', '', r.get('quote') or '')))
    # player -> team (BetOnline boards carry the team), for the game-context line on every leg
    teamof = {}
    for r in J(ROOT / f'data/generated/props/beo-w{ctx["W"]}.json', []) or []:
        a_, h_ = [BEO_CODE.get(x, x) for x in (str(r.get('game', '')).split('_') + ['', ''])[:2]]
        gid_ = next((g for g, x in ctx['games'].items() if x['away'] == a_ and x['home'] == h_), None)
        tm = NICK.get(str(r.get('team', '')).split()[-1].lower()) if r.get('team') else None
        if gid_ and tm: teamof.setdefault((gid_, nkey(r.get('player'))[0]), tm)
    for r in ctx['vrows']:
        if r.get('team_tag') and r.get('players'):
            teamof.setdefault((r['game'], nkey(r['players'][0])[0]), r['team_tag'])
    def context(c):
        g = ctx['games'].get(c['gid']) or {}
        tm = c.get('team') or (TEAMS and next((t for t, n in TEAMS.items() if n == c['player']), None)) or teamof.get((c['gid'], nkey(c['player'])[0]))
        pj = g.get('projection') or {}
        if not tm or tm not in pj: return ''
        opp = g['home'] if tm == g['away'] else g['away']
        d = pj[tm] - pj.get(opp, 0)
        res = f'projected to win by {d}' if d > 0 else (f'projected to lose by {-d}' if d < 0 else 'projected even')
        return f'{tm} {res} ({tm} {pj[tm]} – {opp} {pj.get(opp, "?")}, our projection)'
    # score, line, prices
    per = defaultdict(list)
    for k, c in clusters.items():
        people = {s['who'] for s in c['src'] if s['kind'] not in ('card', 'lean')}
        score = (3 if c['card'] else 0) + (0 if c['lean'] in (None, 'skip') else 2 if str(c['lean']).startswith('1') else 1.5) + len(people)
        if c.get('card_line') is not None: line = c['card_line']
        elif c['lines']:
            cnt = defaultdict(int)
            for v in c['lines']: cnt[v] += 1
            line = sorted(cnt, key=lambda v: (-cnt[v], v if c['side'] == 'over' else -v))[0]
        else: line = None
        leg = dict(player=c['player'], mkey=c['mkey'], side=c['side'], line=line)
        c.update(score=score, line=line, people=sorted(people), prices=best_prices(idx, c['gid'], leg) if c['mkey'] in MNAME and c['mkey'] not in ('other', 'fg_made', 'kick_pts', 'defense', 'long_rush', 'long_rec', 'long_pass', 'rr_yds', 'team_total') else {}, ctx_line=context(c),
                 status=injury_status(ctx, c['gid'], c['player']))
        if c['status'] in ('out', 'doubtful', 'injured reserve', 'ir'): c['score'] -= 10
        if c['lean'] == 'skip' and not c['card']: c['score'] -= 1
        per[c['gid']].append(c)
    total = sum(len(v) for v in per.values())
    nexp = sum(1 for r in ctx['vrows'] if r.get('market') == 'prop')
    kinds = ['TD scorer', 'Passing', 'Rushing', 'Receiving', 'Kicking', 'Defense', 'Game props', 'Other']
    kcount = defaultdict(int)
    for v in per.values():
        for c in v: kcount[MKIND[c['mkey']]] += 1
    kinds = [k for k in kinds if k != 'Other' or kcount[k]]
    h = ['<div class="props-lab" id="props-lab-legs">',
         '<h3 id="props-recommended">🎯 Recommended legs by game</h3>',
         f'<p class="muted-note">{total} legs in {len(per)} games from the card, the synthesis leans and {nexp} verified expert prop calls. '
         'Each line shows the leg, its best price and how much backs it; tap a leg for the price at each book and the reasoning. '
         '<b>Support</b> = card 3 + synthesis lean 1.5–2 + 1 per named expert. Best price compares the same line at Bookmaker (BKR), '
         'BetOnline (BEO) and DraftKings Predictions (DK, before its fee).</p>',
         '<div class="legs-filter no-bm" id="legs-filter">'
         '<div class="lf-row"><span class="lf-label">Type</span>'
         + ''.join(f'<button type="button" class="btn-toggle lf-kind{" btn-primary" if k == "All" else ""}" data-kind="{E(k)}"{" disabled" if k != "All" and not kcount[k] else ""}>{E(k)} <small>{total if k == "All" else kcount[k]}</small></button>' for k in ['All'] + kinds)
         + ('' if kcount['Defense'] else '<span class="muted-note lf-none">No defensive props were called out by this week\'s intel (and no BetOnline tackles board was posted).</span>')
         + '</div><div class="lf-row"><label class="lf-check"><input type="checkbox" id="lf-card"> Card legs only</label>'
         '<label class="lf-check"><input type="checkbox" id="lf-multi"> 2+ supporters</label>'
         '<label class="lf-check"><input type="checkbox" id="lf-priced" checked> Hide out / doubtful</label>'
         '<input type="search" id="lf-q" placeholder="Search player" aria-label="Search player"></div>'
         '<div class="lf-row"><button type="button" class="btn-toggle" id="lf-open">Open all games</button>'
         '<button type="button" class="btn-toggle" id="lf-close">Close all games</button>'
         '<button type="button" class="btn-toggle" id="lf-expand">Expand all legs</button>'
         '<button type="button" class="btn-toggle" id="lf-collapse">Collapse all legs</button>'
         '<span class="lf-count" id="lf-count"></span></div></div>']
    for gid in ctx['order']:
        cs = sorted(per.get(gid, []), key=lambda c: (-c['score'], MKIND[c['mkey']], c['player']))
        if not cs: continue
        g = ctx['games'][gid]
        h += [f'<details class="rollup-box section-pool legs-game" id="props-{slug(gid)}"><summary><span class="sum-text">'
              f'🧾 {E(g["away"])} @ {E(g["home"])} · {E(g.get("kickoff_pt", ""))} PT — <span class="lg-n">{len(cs)}</span> legs</span></summary>'
              '<div class="rollup-content"><div class="leg-list">']
        for c in cs:
            sd = '' if c['side'] in ('yes', None) else ('o' if c['side'] == 'over' else 'u')
            ltxt = f'{sd}{c["line"]:g} ' if c['line'] is not None else (f'{c["side"]} ' if c['side'] in ('over', 'under') and c['mkey'] not in YES else '')
            leg = f'{c["player"]} {ltxt}{MNAME[c["mkey"]]}'.strip()
            if c['mkey'] == 'other' and c.get('raw'): leg = c['raw']
            if c['mkey'] == 'pass_td' and c['line'] == 1.5 and c['side'] == 'over': leg = f'{c["player"]} 2+ pass TDs'
            pr = c['prices']; exact = {b: v for b, v in pr.items() if v['exact']}
            best = max(exact.items(), key=lambda kv: dec(kv[1]['odds'])) if exact else None
            bad = c['status'] in ('out', 'doubtful', 'injured reserve', 'ir')
            flags = []
            if c['card']: flags.append(f'<span class="leg-tag tag-card">card</span>')
            if c['lean'] and c['lean'] != 'skip': flags.append(f'<span class="leg-tag">lean {E(c["lean"])}</span>')
            if c['lean'] == 'skip': flags.append('<span class="leg-tag tag-warn">synthesis skip</span>')
            if c['status']: flags.append(f'<span class="leg-tag tag-warn">⚠ {E(c["status"])}</span>')
            if not pr: flags.append('<span class="leg-tag">no captured price</span>')
            nsup = len(c['people']) + (1 if c['card'] else 0) + (1 if c['lean'] not in (None, 'skip') else 0)
            bt = f'<b>{am(best[1]["odds"])}</b> <span class="lg-book">{best[0]}</span>' if best else '<span class="px-none">no same-line price</span>'
            def cell(b):
                v = pr.get(b)
                if not v: return f'<div class="lp-cell"><span class="lp-b">{b}</span><span class="px-none">—</span></div>'
                cls = 'px-best' if best and best[0] == b else ('px-alt' if not v['exact'] else '')
                lab = am(v['odds']) if v['exact'] else f'{("o" if c["side"] == "over" else "")}{v["line"]:g} {am(v["odds"])} (other line)'
                return f'<div class="lp-cell"><span class="lp-b">{b}</span><span class="{cls}">{E(lab)}</span></div>'
            whos = []
            if c.get('ctx_line'): whos.append(f'<li class="leg-ctx">📌 <b>Game context:</b> {E(c["ctx_line"])}</li>')
            for s in c['src']:
                wy = (s.get('why') or '')[:220]
                if s['kind'] in ('card', 'lean'):
                    whos.append(f'<li><b>{E(s["who"])}</b> ({E(s.get("what", ""))}): {E(wy)}</li>')
                else:
                    r = s['row']; q = f' {am(s["price"])}' if s.get('price') not in (None, '') else ''
                    lq = f' at {s["line"]:g}' if s.get('line') is not None and c['mkey'] not in YES else ''
                    if not wy.strip() or wy.strip().lower() == (r.get('selection') or '').strip().lower():
                        wy = 'called this leg (no written reason stored; see the source)'
                    whos.append(f'<li><b>{E(s["who"])}</b>{E(lq)}{E(q)}: {E(wy)} <span class="src">— {source_html(r, ctx)}</span></li>')
            dat = (f'data-kind="{E(MKIND[c["mkey"]])}" data-card="{1 if c["card"] else 0}" data-sup="{nsup}" '
                   f'data-bad="{1 if bad else 0}" data-player="{E(c["player"].lower())}"')
            h.append(f'<details class="leg bm-item" {dat}><summary class="bm-host">'
                     f'<span class="lg-main"><span class="lg-name">{E(leg)}</span><span class="lg-tags">{" ".join(flags)}</span></span>'
                     f'<span class="lg-kind">{E(MKIND[c["mkey"]])}</span>'
                     f'<span class="lg-price">{bt}</span>'
                     f'<span class="lg-sup" title="support score">▲ {c["score"]:g}<small>{nsup} source{"s" if nsup != 1 else ""}</small></span></summary>'
                     f'<div class="leg-body"><div class="lp-row">{cell("BKR")}{cell("BEO")}{cell("DK")}</div>'
                     f'<ul class="leg-src">{"".join(whos)}</ul></div></details>')
        h += ['</div>', f'<p class="lg-none muted-note" hidden>No legs match the filters in this game.</p>',
              f'<p><a href="{gpage(gid)}">Full matchup →</a></p></div></details>']
    h.append('</div>')
    return ''.join(h)


# ---------------------------------------------------------------- teasers
def teaser_extras(ctx, legs):
    """legs: [(gid, team)] from the Wong table. Returns (experts_cell_html_by_leg, calls_html, math_html)."""
    cells = {}
    for gid, team in legs:
        ppl = defaultdict(list)
        for r in ctx['vrows']:
            if r.get('game') == gid and r.get('side') == team and r.get('market') in ('spread', 'contest', 'teaser', 'moneyline'):
                ppl[who_of(r)].append(r)
        items = []
        for w, rs in sorted(ppl.items(), key=lambda kv: (not any(x['market'] == 'teaser' for x in kv[1]), kv[0])):
            r = next((x for x in rs if x['market'] == 'teaser'), rs[0])
            lk = ''
            if r.get('url'): lk = f' <a href="{E(r["url"])}" target="_blank" rel="noopener">↗</a>'
            elif r.get('kind') == 'podcast':
                p = ctx['pods'].get(r.get('source_title') or '') or {}
                if p.get('youtube_url'): lk = f' <a href="{E(p["youtube_url"])}" target="_blank" rel="noopener">▶</a>'
            mk = {'teaser': 'teaser', 'contest': 'contest', 'moneyline': 'ML', 'spread': 'spread'}[r['market']]
            qt = re.sub(r'^\[[^\]]*\]\s*', '', r.get('quote') or '')[:200]
            items.append(f'<span class="exp-chip" title="{E(qt)}">{E(w)} <i>{mk}</i>{lk}</span>')
        cells[(gid, team)] = (len(ppl), ' '.join(items) or '—')
    calls = [r for r in ctx['vrows'] if r.get('market') == 'teaser']
    ch = ['<h3 id="teaser-calls">Expert teaser calls this week</h3>',
          '<div class="table-responsive"><table><thead><tr><th>Game</th><th>Leg</th><th>Expert</th><th>What they said</th><th>Source</th></tr></thead><tbody>']
    for r in sorted(calls, key=lambda r: (ctx['order'].index(r['game']) if r['game'] in ctx['order'] else 99)):
        q = r.get('quote') or ''
        tag = re.match(r'^\[TEASER — ([^\]]*)\]', q)
        q2 = re.sub(r'^\[[^\]]*\]\s*', '', q)
        ch.append(f'<tr><td><a href="{gpage(r["game"])}">{E(r["game"])}</a></td><td><b>{E(r["side"])} {E(ln(r["line"]) if isinstance(r.get("line"), (int, float)) else "")}</b>'
                  f'<br><span class="muted-note">{E(tag.group(1) if tag else "")}</span></td><td>{E(who_of(r))}</td><td>{E(q2[:220])}</td><td>{source_html(r, ctx)}</td></tr>')
    ch.append('</tbody></table></div>')
    # math
    pays = [('2-team', 2, -120), ('3-team', 3, 160), ('4-team', 4, 260)]
    ps = [0.70, 0.72, 0.74, 0.76]
    def ev(n, odds, p): return p ** n * dec(odds) - 1
    rows = ''.join(f'<tr><td><b>{nm}</b> ({am(o)})</td><td>{(1 / dec(o)) ** (1 / n) * 100:.1f}%</td>' +
                   ''.join(f'<td class="{"ev-pos" if ev(n, o, p) > 0 else "ev-neg"}">{ev(n, o, p) * 100:+.1f}%</td>' for p in ps) + '</tr>' for nm, n, o in pays)
    def rr(nlegs, size, odds, p):
        """round robin of all size-team teasers from nlegs legs, $1 each: EV per $ and chance of a profit."""
        combos = math.comb(nlegs, size); evs = 0; pprofit = 0
        for k in range(nlegs + 1):
            pk = math.comb(nlegs, k) * p ** k * (1 - p) ** (nlegs - k)
            ret = math.comb(k, size) * dec(odds) if k >= size else 0
            evs += pk * ret
            if ret > combos: pprofit += pk
        return evs / combos - 1, pprofit, combos
    rr_rows = []
    for nm, nl, sz, o in [('3 legs by 2s', 3, 2, -120), ('4 legs by 2s', 4, 2, -120), ('4 legs by 3s', 4, 3, 160), ('4-team straight', 4, 4, 260), ('3-team straight', 3, 3, 160)]:
        e, pp, cb = rr(nl, sz, o, 0.74)
        rr_rows.append(f'<tr><td><b>{nm}</b></td><td>{cb}</td><td class="{"ev-pos" if e > 0 else "ev-neg"}">{e * 100:+.1f}%</td><td>{pp * 100:.0f}%</td></tr>')
    mh = ['<h3 id="teaser-math">Teaser math: 2, 3 and 4 legs, and round robins</h3>',
          '<p class="muted-note">Prices are the usual 6-point payouts (2-team −120, 3-team +160, 4-team +260); confirm BKR\'s on the slip. '
          '"Break-even per leg" is how often each leg must cover for the ticket to break even. Historically, Wong legs have covered '
          'roughly 72–75% of the time, but that is a long-run average, not a promise for this week\'s legs.</p>',
          '<div class="table-responsive"><table class="no-bm"><thead><tr><th>Ticket</th><th>Break-even per leg</th>' +
          ''.join(f'<th>EV if legs cover {p * 100:.0f}%</th>' for p in ps) + f'</tr></thead><tbody>{rows}</tbody></table></div>',
          '<p><b>What the table says:</b> the edge per leg compounds. If the legs really cover 74% or better, bigger teasers return more per dollar; '
          'at 72% the 2-team loses and the 3- and 4-team are near break-even; at 70% all of them lose, the 4-team most. A round robin does not '
          'change the expected return per dollar of a single ticket of the same size; it trades some upside for a better chance of getting something back.</p>',
          '<div class="table-responsive"><table class="no-bm"><thead><tr><th>Structure ($1 per ticket, legs at 74%)</th><th>Tickets</th><th>EV per $</th><th>Chance of a profit</th></tr></thead>'
          f'<tbody>{"".join(rr_rows)}</tbody></table></div>',
          '<div class="teaser-calc no-bm" id="teaser-calc"><h4>Try your own numbers</h4>'
          '<label>Leg cover rate % <input type="number" id="tc-p" value="74" min="50" max="95" step="0.5"></label> '
          '<label>2-team <input type="number" id="tc-2" value="-120"></label> <label>3-team <input type="number" id="tc-3" value="160"></label> '
          '<label>4-team <input type="number" id="tc-4" value="260"></label><div id="tc-out" class="table-responsive"></div></div>']
    return cells, ''.join(ch), ''.join(mh)


# ---------------------------------------------------------------- bookmarks
BOOKMARKS_PAGE = (
    '<div class="bm-page"><h2 class="page-h" id="bookmarks">☆ Bookmarks</h2>'
    '<p class="dashboard-intro">Picks, legs, sides and totals you starred anywhere in this report. They are saved in this browser only '
    '(not on other devices, and cleared if you clear site data). Tap a bookmark to jump back to it.</p>'
    '<div class="rollup-controls"><button class="btn-toggle" id="bm-copy">Copy list as text</button>'
    '<button class="btn-toggle" id="bm-clear">Remove all</button></div><div id="bm-list"><p class="muted-note">No bookmarks yet. Tap ☆ next to any pick, leg or table row.</p></div></div>')

BOOKMARKS_CSS = r"""
/* ---- bookmarks + extras (site_extras.py) ---- */
.bm-btn{appearance:none;border:1px solid var(--border);background:transparent;color:var(--muted);border-radius:999px;width:26px;height:26px;min-width:26px;margin:0 6px 0 0;padding:0;cursor:pointer;font-size:14px;line-height:24px;vertical-align:middle}
.bm-btn::before{content:'☆'}.bm-btn.on{color:#facc15;border-color:#facc15}.bm-btn.on::before{content:'★'}
.bm-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.bm-flash{animation:bmflash 2.4s ease-out 1}@keyframes bmflash{0%{background:rgba(250,204,21,.35)}100%{background:transparent}}
.bm-count{display:inline-block;min-width:18px;margin-left:5px;padding:0 5px;border-radius:999px;background:#facc15;color:#0f172a;font-size:11px;line-height:18px;text-align:center}.bm-count:empty{display:none}
.bm-group{margin:16px 0}.bm-group h3{margin:0 0 8px;font-size:15px}.bm-row{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--border);border-radius:9px;background:var(--card);margin:6px 0}
.bm-row a{color:var(--text);text-decoration:none;flex:1;min-width:0;overflow-wrap:anywhere}.bm-row a:hover{color:var(--primary)}.bm-row .bm-ctx{display:block;color:var(--muted);font-size:12px}
.site-ref-nav{display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;padding:0 0 10px;font-size:12.5px}
.site-ref-nav .ref-label{color:var(--muted);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:10.5px}
.site-ref-nav a{color:var(--body);text-decoration:none;font-weight:650}.site-ref-nav a:hover{color:var(--primary)}.site-ref-nav a.current{color:var(--primary);text-decoration:underline;text-underline-offset:3px}
.sc-list{display:grid;gap:10px;margin:10px 0 18px}
.sc-pick{display:flex;gap:14px;padding:14px 16px;border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:12px;background:var(--card)}
.sc-pick.sc-alt{border-left-color:var(--border)}
.sc-rank{flex:0 0 auto;min-width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--raised,var(--highlight));color:var(--text);font-weight:800;font-size:15px}
.sc-alt .sc-rank{font-size:11.5px}
.sc-body{min-width:0;flex:1}.sc-title{margin:0 0 6px;font-size:18px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px}
.sc-game{font-size:12.5px;font-weight:600;color:var(--muted)}.sc-game a{color:var(--primary)}
.sc-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.sc-chip{font-size:12px;padding:3px 9px;border:1px solid var(--border);border-radius:999px;color:var(--body)}.sc-chip b{color:var(--muted);font-weight:700;margin-right:3px}
.sc-why,.sc-support{margin:4px 0;font-size:14px;line-height:1.5}.sc-support{color:var(--muted);font-size:13px}
.muted-note{color:var(--muted);font-size:13px;line-height:1.5}
.leg-tag{display:inline-block;margin:3px 4px 0 0;padding:1px 7px;border-radius:999px;border:1px solid var(--border);font-size:11px;color:var(--muted)}
.leg-tag.tag-card{border-color:var(--accent);color:var(--accent)}.leg-tag.tag-warn{border-color:#f59e0b;color:#f59e0b}
.px-best{color:#22c55e;font-weight:800}.px-alt{color:var(--muted);font-size:12px}.px-none{color:var(--muted)}.px-best-cell{font-weight:800;white-space:nowrap}
.leg-src{margin:0;padding-left:16px;font-size:12.5px;line-height:1.45}.leg-src .src{color:var(--muted)}
.legs-table td{vertical-align:top}
.exp-chip{display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;border:1px solid var(--border);border-radius:999px;font-size:12px;white-space:nowrap}.exp-chip i{color:var(--muted);font-style:normal;font-size:11px}
.ev-pos{color:#22c55e;font-weight:700}.ev-neg{color:#f87171}
.teaser-calc{margin:14px 0;padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--card)}.teaser-calc h4{margin:0 0 8px}
.teaser-calc label{display:inline-flex;align-items:center;gap:6px;margin:4px 12px 4px 0;font-size:13px;color:var(--muted)}
.teaser-calc input{width:74px;padding:5px 7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);color:var(--text)}
.splits-top{margin:0 0 16px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:var(--card)}.splits-top h3{margin:0 0 6px;font-size:15px}
.mi-pointer{margin:16px 0;padding:10px 14px;border-left:3px solid var(--accent);border-radius:7px;background:var(--card);font-size:13.5px}
.sc-strip{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:8px 0 14px}
.sc-strip-group{min-width:0}
.sc-strip-label{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin:0 0 6px}
.sc-strip-group:last-child .sc-strip-label{color:var(--muted)}
.sc-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.sc-tile{display:flex;flex-direction:column;gap:2px;min-width:0;padding:10px 10px 9px;border:1px solid var(--border);border-top:3px solid var(--accent);border-radius:10px;background:var(--card);color:var(--text);text-decoration:none;transition:border-color .15s,transform .15s}
.sc-tile:hover{border-color:var(--accent);transform:translateY(-2px)}.sc-tile:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.sc-tile-alt{border-top-color:var(--border)}
.sct-rank{font-size:11px;font-weight:800;color:var(--muted)}.sct-pick{font-size:17px;font-weight:800;white-space:nowrap}
.sct-game{font-size:11px;color:var(--muted);line-height:1.35}.sct-conf{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sct-room{font-size:12px;font-weight:700;color:var(--body)}.sct-go{margin-top:4px;font-size:11.5px;font-weight:800;color:var(--primary)}
.sc-how{margin:4px 0 6px;font-size:14px;line-height:1.5;padding:8px 10px;border-radius:8px;background:var(--raised,var(--highlight))}
.sc-pick{scroll-margin-top:150px}
@media (max-width:1050px){.sc-strip{grid-template-columns:minmax(0,1fr)}}
@media (max-width:640px){.sc-tiles{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:4px}.sc-tile{flex:0 0 132px;scroll-snap-align:start}}
.legs-filter{margin:10px 0 12px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--card)}
.lf-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:3px 0}.lf-label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-right:4px}
.lf-check{display:inline-flex;align-items:center;gap:5px;font-size:13px;color:var(--body);margin-right:8px}
#lf-q{flex:1;min-width:140px;max-width:240px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text)}
.lf-count{margin-left:auto;font-size:12px;color:var(--muted)}
.leg-list{display:grid;gap:6px}
.leg{border:1px solid var(--border);border-radius:10px;background:var(--bg)}
.leg[open]{border-color:var(--accent)}
.leg-list .leg>summary{display:grid !important;grid-template-columns:auto minmax(0,1fr) 92px 120px 86px;justify-content:stretch;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;list-style:none}
.leg>summary::-webkit-details-marker{display:none}
.leg>summary .bm-btn{grid-column:1}
.lg-main{min-width:0}.lg-name{display:block;font-weight:750;font-size:14.5px;color:var(--text)}.lg-tags .leg-tag{margin-top:2px}
.lg-kind{font-size:12px;color:var(--muted)}.lg-price{font-size:14px;white-space:nowrap}.lg-book{font-size:11px;color:var(--muted);margin-left:3px}
.lg-sup{font-weight:800;font-size:13px;color:var(--accent);text-align:right;white-space:nowrap}.lg-sup small{display:block;font-weight:600;font-size:10.5px;color:var(--muted)}
.leg-body{padding:2px 14px 12px 14px;border-top:1px solid var(--border)}
.lp-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.lp-cell{display:flex;flex-direction:column;min-width:96px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:13.5px}.lp-b{font-size:10.5px;font-weight:800;letter-spacing:.06em;color:var(--muted)}
@media (max-width:640px){.leg-list .leg>summary{grid-template-columns:auto minmax(0,1fr) auto;gap:4px 8px}.lg-kind{display:none}.lg-sup{grid-column:2/4;text-align:left}.lg-sup small{display:inline;margin-left:6px}.lg-price{grid-column:3;grid-row:1}}
.rec-filter{display:inline-flex;flex-wrap:wrap;gap:6px;margin-right:6px}
.rp:not([hidden])~.rp:not([hidden])::before{content:' · '}
.rp[hidden]{display:none}
.mu-jump{position:sticky;top:150px;z-index:6;display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 0 14px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--card)}
.mu-jump-label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-right:2px}
.mu-jump-link{padding:5px 11px;border:1px solid var(--border);border-radius:999px;color:var(--text);text-decoration:none;font-size:12.5px;font-weight:700;white-space:nowrap}
.mu-jump-link:hover{border-color:var(--accent);color:var(--primary)}
.mu-jump .mu-all{margin-left:auto}.mu-jump .mu-all+.mu-all{margin-left:0}
.mu-card{scroll-margin-top:220px}
.mu-badge{display:inline-block;margin-left:8px;padding:1px 9px;border-radius:999px;background:#facc15;color:#0f172a;font-size:12px;font-weight:800}.mu-badge.lean{background:transparent;color:#f59e0b;border:1px solid #f59e0b}
.split-alert{margin:4px 0 12px;padding:10px 14px;border:1px solid #facc15;border-left:4px solid #facc15;border-radius:10px;background:rgba(250,204,21,.08)}
.split-alert ul{margin:6px 0;padding-left:18px}.split-alert li{margin:3px 0;font-size:14px}
tr.split-big td{background:rgba(250,204,21,.12)}tr.split-lean td{background:rgba(245,158,11,.07)}
@media (max-width:640px){.mu-jump{position:static}.mu-card{scroll-margin-top:80px}}
@media (max-width:640px){.sc-pick{padding:12px;gap:10px}.sc-rank{min-width:34px;height:34px}.sc-title{font-size:16px}}
"""

BOOKMARKS_JS = r"""
/* ---- bookmarks, teaser calculator (site_extras.py) ---- */
(function(){
  var wk = document.body.getAttribute('data-week') || '';
  var KEY = 'pr-bookmarks-w' + wk;
  function load(){ try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch(e){ return []; } }
  function save(a){ try { localStorage.setItem(KEY, JSON.stringify(a)); } catch(e){} }
  function hash(s){ var x = 5381; for (var i = 0; i < s.length; i++){ x = ((x << 5) + x + s.charCodeAt(i)) | 0; } return (x >>> 0).toString(36); }
  var page = (location.pathname.split('/').pop() || 'index.html');
  if (page.indexOf('.html') < 0) page = 'index.html';
  function clean(t){ return (t || '').replace(/\s+/g, ' ').trim(); }
  // single-file edition: every page is a <section data-page> in one document
  var SINGLE = !!document.querySelector('[data-page]');
  function pageOf(el){ var s = el.closest && el.closest('[data-page]'); return s ? s.getAttribute('data-page') : page; }
  function hrefOf(b){ return SINGLE ? '#/' + b.page.replace(/\.html$/, '') + '/' + b.id : b.page + '#' + b.id; }
  function ctxOf(el){
    var d = el.closest('details'); var s = d && d.querySelector('summary');
    if (s) return clean(s.textContent).slice(0, 90);
    var h = document.querySelector('.container h2'); return h ? clean(h.textContent).slice(0, 90) : document.title;
  }
  function count(){ var n = load().length; document.querySelectorAll('.bm-count').forEach(function(c){ c.textContent = n ? String(n) : ''; }); }
  function setup(){
    var marks = {}; load().forEach(function(b){ marks[b.id] = 1; });
    var els = document.querySelectorAll('.container table tbody tr, .container .bm-item');
    els.forEach(function(el){
      if (el.closest('.no-bm') || el.closest('#bm-list')) return;
      var text = clean(el.textContent);
      if (!text || text.length < 3) return;
      var host = el.matches('tr') ? el.querySelector('td') : (el.querySelector('.bm-host') || el.querySelector('.sc-title') || el);
      if (!host) return;
      var pg = pageOf(el);
      if (!el.id) el.id = 'bm-' + hash(pg + '|' + text.slice(0, 200));
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bm-btn' + (marks[el.id] ? ' on' : '');
      b.setAttribute('aria-label', 'Bookmark for review'); b.setAttribute('aria-pressed', marks[el.id] ? 'true' : 'false');
      b.title = 'Bookmark for review';
      b.addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        var a = load(), i = -1;
        for (var k = 0; k < a.length; k++){ if (a[k].id === el.id && a[k].page === pg){ i = k; break; } }
        if (i >= 0){ a.splice(i, 1); b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
        else { var sec = SINGLE && el.closest('[data-page]'); a.push({id: el.id, page: pg, text: text.slice(0, 220), ctx: ctxOf(el), title: sec ? (sec.getAttribute('data-title') || pg) : document.title.replace(/ · Week.*$/, ''), t: Date.now()});
               b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
        save(a); count();
        var lst = document.getElementById('bm-list'); if (lst) render(lst);
      });
      host.insertBefore(b, host.firstChild);
    });
    count();
    if (location.hash.length > 1){
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t){ if (t.tagName === 'DETAILS') t.open = true; var p = t.parentElement; while (p){ if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; }
              t.scrollIntoView({block: 'center'}); t.classList.add('bm-flash'); }
    }
    var list = document.getElementById('bm-list');
    if (list) render(list);
  }
  function render(list){
    var a = load();
    if (!a.length){ list.innerHTML = '<p class="muted-note">No bookmarks yet. Tap ☆ next to any pick, leg or table row.</p>'; return; }
    var groups = {}, orderG = [];
    a.forEach(function(b){ if (!groups[b.page]){ groups[b.page] = []; orderG.push(b.page); } groups[b.page].push(b); });
    list.innerHTML = '';
    orderG.forEach(function(pg){
      var g = document.createElement('div'); g.className = 'bm-group';
      var h = document.createElement('h3'); h.textContent = groups[pg][0].title || pg; g.appendChild(h);
      groups[pg].forEach(function(b){
        var r = document.createElement('div'); r.className = 'bm-row';
        var l = document.createElement('a'); l.href = hrefOf(b); l.textContent = b.text;
        var c = document.createElement('span'); c.className = 'bm-ctx'; c.textContent = b.ctx || ''; l.appendChild(c);
        var x = document.createElement('button'); x.type = 'button'; x.className = 'btn-toggle'; x.textContent = 'Remove';
        x.addEventListener('click', function(){ save(load().filter(function(z){ return !(z.id === b.id && z.page === b.page); })); count(); render(list); });
        r.appendChild(l); r.appendChild(x); g.appendChild(r);
      });
      list.appendChild(g);
    });
  }
  function wire(){
    var c = document.getElementById('bm-clear'), cp = document.getElementById('bm-copy'), list = document.getElementById('bm-list');
    if (c) c.addEventListener('click', function(){ save([]); count(); if (list) render(list); });
    if (cp) cp.addEventListener('click', function(){
      var txt = load().map(function(b){ return '- ' + b.text + ' (' + (b.title || b.page) + ')'; }).join('\n');
      try { navigator.clipboard.writeText(txt); cp.textContent = 'Copied'; } catch(e){ cp.textContent = 'Copy failed'; }
      setTimeout(function(){ cp.textContent = 'Copy list as text'; }, 1600);
    });
  }
  function calc(){
    var box = document.getElementById('teaser-calc'); if (!box) return;
    function dec(o){ o = +o; return o > 0 ? 1 + o / 100 : 1 + 100 / -o; }
    function comb(n, k){ if (k < 0 || k > n) return 0; var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
    function run(){
      var p = (+document.getElementById('tc-p').value || 74) / 100;
      var o2 = document.getElementById('tc-2').value, o3 = document.getElementById('tc-3').value, o4 = document.getElementById('tc-4').value;
      var rows = [['2-team', 2, 2, o2], ['3-team', 3, 3, o3], ['4-team', 4, 4, o4], ['3 legs by 2s', 3, 2, o2], ['4 legs by 2s', 4, 2, o2], ['4 legs by 3s', 4, 3, o3]];
      var h = '<table class="no-bm"><thead><tr><th>Ticket</th><th>Break-even per leg</th><th>EV per $</th><th>Chance of a profit</th></tr></thead><tbody>';
      rows.forEach(function(r){
        var n = r[1], s = r[2], d = dec(r[3]), cb = comb(n, s), ev = 0, pp = 0;
        for (var k = 0; k <= n; k++){ var pk = comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k); var ret = k >= s ? comb(k, s) * d : 0; ev += pk * ret; if (ret > cb) pp += pk; }
        ev = ev / cb - 1;
        var be = Math.pow(1 / d, 1 / s) * 100;
        h += '<tr><td><b>' + r[0] + '</b></td><td>' + be.toFixed(1) + '%</td><td class="' + (ev > 0 ? 'ev-pos' : 'ev-neg') + '">' + (ev >= 0 ? '+' : '') + (ev * 100).toFixed(1) + '%</td><td>' + (pp * 100).toFixed(0) + '%</td></tr>';
      });
      document.getElementById('tc-out').innerHTML = h + '</tbody></table>';
    }
    box.querySelectorAll('input').forEach(function(i){ i.addEventListener('input', run); });
    run();
  }
  function legs(){
    var f = document.getElementById('legs-filter'); if (!f) return;
    var kind = 'All';
    var q = document.getElementById('lf-q'), card = document.getElementById('lf-card'), multi = document.getElementById('lf-multi'), priced = document.getElementById('lf-priced');
    function apply(){
      var term = (q.value || '').trim().toLowerCase(), shown = 0, games = 0;
      document.querySelectorAll('.legs-game').forEach(function(g){
        var n = 0;
        g.querySelectorAll('.leg').forEach(function(l){
          var ok = (kind === 'All' || l.getAttribute('data-kind') === kind)
            && (!card.checked || l.getAttribute('data-card') === '1')
            && (!multi.checked || +l.getAttribute('data-sup') >= 2)
            && (!priced.checked || l.getAttribute('data-bad') !== '1')
            && (!term || l.getAttribute('data-player').indexOf(term) >= 0);
          l.hidden = !ok; if (ok) n++;
        });
        var c = g.querySelector('.lg-n'); if (c) c.textContent = n;
        var none = g.querySelector('.lg-none'); if (none) none.hidden = n > 0;
        g.hidden = n === 0; if (n) games++; shown += n;
      });
      var out = document.getElementById('lf-count'); if (out) out.textContent = shown + ' legs in ' + games + ' games';
    }
    f.querySelectorAll('.lf-kind').forEach(function(b){ b.addEventListener('click', function(){
      kind = b.getAttribute('data-kind');
      f.querySelectorAll('.lf-kind').forEach(function(x){ x.classList.toggle('btn-primary', x === b); });
      apply(); }); });
    [card, multi, priced].forEach(function(x){ x.addEventListener('change', apply); });
    q.addEventListener('input', function(){ apply(); if (q.value.trim()) document.querySelectorAll('.legs-game:not([hidden])').forEach(function(g){ g.open = true; }); });
    function setAll(sel, v){ document.querySelectorAll(sel).forEach(function(d){ if (!d.hidden) d.open = v; }); }
    document.getElementById('lf-open').addEventListener('click', function(){ setAll('.legs-game', true); });
    document.getElementById('lf-close').addEventListener('click', function(){ setAll('.legs-game', false); });
    document.getElementById('lf-expand').addEventListener('click', function(){ setAll('.legs-game', true); setAll('.leg', true); });
    document.getElementById('lf-collapse').addEventListener('click', function(){ setAll('.leg', false); });
    apply();
  }
  function recFilter(){
    var bar = document.getElementById('rec-filter'); if (!bar) return;
    bar.querySelectorAll('button[data-t]').forEach(function(b){ b.addEventListener('click', function(){
      var k = b.getAttribute('data-t');
      bar.querySelectorAll('button[data-t]').forEach(function(x){ x.classList.toggle('btn-primary', x === b); });
      document.querySelectorAll('.rec-game').forEach(function(g){
        var n = 0;
        g.querySelectorAll('tbody tr[data-t]').forEach(function(tr){
          var ok = k === 'all' || tr.getAttribute('data-t').split(' ').indexOf(k) >= 0; tr.style.display = ok ? '' : 'none'; if (ok) n++; });
        g.querySelectorAll('.rp[data-t]').forEach(function(sp){
          sp.hidden = !(k === 'all' || sp.getAttribute('data-t').split(' ').indexOf(k) >= 0); });
        g.style.display = n ? '' : 'none';
      });
    }); });
  }
  function muJump(){
    document.querySelectorAll('.mu-jump-link').forEach(function(a){ a.addEventListener('click', function(){
      var h = a.getAttribute('href'); if (h.charAt(0) !== '#') return;
      var t = document.getElementById(h.slice(1)); if (t && t.tagName === 'DETAILS') t.open = true; }); });
    document.querySelectorAll('.mu-all').forEach(function(b){ b.addEventListener('click', function(){
      var v = b.getAttribute('data-open') === '1'; document.querySelectorAll('.mu-card').forEach(function(d){ d.open = v; }); }); });
  }
  function go(){ setup(); wire(); calc(); legs(); recFilter(); muJump(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
"""
