#!/usr/bin/env python3
"""Verify every expert / podcast / article pick for a week against the actual matchup before it is used.

Andy, 2026-10-03: "we definitely need a verification check on every name and article against the actual matchup,
to ensure its veracity, before it should be included." Read-only; local files only.

Inputs : data/generated/master-intel/w<NN>-pull.json (expert, signals, podcast_gemini), public/schedule.json,
         data/odds/actionnetwork-openers-<season>-w<NN>.json, data/generated/props/bookmaker-live-<date>-week<N>.json,
         data/nfl-rosters/espn-full-rosters-latest.json
Outputs: data/generated/master-intel/w<NN>-expert-verified.json   (every candidate row with verdict + reasons)
         reports/intel/expert-verification-<season>-w<NN>.md        (human-readable rejects)

A row is a PICK only if it carries a bet: a side with a team, a total with over/under and a number, a moneyline
with a team, or a player prop with a player. News items are 'not_pick' (never shown, never counted).
A pick is VERIFIED only if every check passes:
  game      - it maps to one Week N game on the schedule (both teams named, or one team + the pick's own matchup data)
  final     - that game has not been played yet (picks on finished games are not counted)
  timing    - published after both teams' previous game kicked off (so a Week 3 article can't count for Week 4)
  other-opp - the article text doesn't name a third NFL team as the opponent ("Eagles vs Bears" for NYJ@CHI)
  side      - the side is one of the two teams (or over/under for totals)
  line      - spread: same favorite/dog direction as the open or current line and within 3.5 pts (teasers exempt);
              total: within 6 pts of the open/current total; moneyline price: same favorite/dog direction
  players   - every named player in a prop is on one of the two ESPN 2026 rosters (a prop whose player belongs to a
              different Week N game is re-tagged to that game, flagged 'retagged')
Usage: python3 scripts/master-intel/verify_expert_rows.py --week 4 --date 2026-10-03
"""
import argparse, collections, datetime, html, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--date', required=True)
ap.add_argument('--season', type=int, default=2026); a = ap.parse_args()
W, WW, D = a.week, f'{a.week:02d}', a.date
J = lambda p, d=None: json.load(open(ROOT / p, encoding='utf-8')) if (ROOT / p).exists() else d

FULL = {'Arizona Cardinals':'ARI','Atlanta Falcons':'ATL','Baltimore Ravens':'BAL','Buffalo Bills':'BUF','Carolina Panthers':'CAR','Chicago Bears':'CHI','Cincinnati Bengals':'CIN','Cleveland Browns':'CLE','Dallas Cowboys':'DAL','Denver Broncos':'DEN','Detroit Lions':'DET','Green Bay Packers':'GB','Houston Texans':'HOU','Indianapolis Colts':'IND','Jacksonville Jaguars':'JAX','Kansas City Chiefs':'KC','Las Vegas Raiders':'LV','Los Angeles Chargers':'LAC','Los Angeles Rams':'LAR','Miami Dolphins':'MIA','Minnesota Vikings':'MIN','New England Patriots':'NE','New Orleans Saints':'NO','New York Giants':'NYG','New York Jets':'NYJ','Philadelphia Eagles':'PHI','Pittsburgh Steelers':'PIT','San Francisco 49ers':'SF','Seattle Seahawks':'SEA','Tampa Bay Buccaneers':'TB','Tennessee Titans':'TEN','Washington Commanders':'WAS'}
NICK = {v: k.split()[-1].lower() for k, v in FULL.items()}
EXTRA = {'NYJ': ['jets'], 'NYG': ['giants'], 'LAR': ['rams'], 'LAC': ['chargers'], 'JAX': ['jags', 'jaguars'], 'SF': ['niners', '49ers'],
         'TB': ['bucs', 'buccaneers'], 'NE': ['pats', 'patriots'], 'WAS': ['commanders', 'commies'], 'LV': ['raiders'], 'KC': ['chiefs']}
CITY = {'ARI':'arizona','ATL':'atlanta','BAL':'baltimore','BUF':'buffalo','CAR':'carolina','CHI':'chicago','CIN':'cincinnati','CLE':'cleveland','DAL':'dallas','DEN':'denver','DET':'detroit','GB':'green bay','HOU':'houston','IND':'indianapolis','JAX':'jacksonville','KC':'kansas city','LV':'las vegas','MIA':'miami','MIN':'minnesota','NE':'new england','NO':'new orleans','PHI':'philadelphia','PIT':'pittsburgh','SF':'san francisco','SEA':'seattle','TB':'tampa bay','TEN':'tennessee','WAS':'washington'}
ALIAS = {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX', 'LVR': 'LV', 'OAK': 'LV', 'NOS': 'NO', 'SD': 'LAC', 'STL': 'LAR'}
WORD = {'TITANS':'TEN','JETS':'NYJ','COWBOYS':'DAL','EAGLES':'PHI','CHARGERS':'LAC','RAVENS':'BAL','GIANTS':'NYG'}
def teams_in(text, cities=True):
    t = ' ' + html.unescape(text or '').lower() + ' '; hit = set()
    for ab, nk in NICK.items():
        words = {nk} | set(EXTRA.get(ab, []))
        if any(re.search(r'\b' + re.escape(w) + r'\b', t) for w in words): hit.add(ab)
        elif cities and ab in CITY and re.search(r'\b' + re.escape(CITY[ab]) + r'\b', t) and ab not in ('NYG', 'NYJ', 'LAR', 'LAC'): hit.add(ab)
    if re.search(r'\bnew york\b', t) and not hit & {'NYG', 'NYJ'}: pass
    return hit
def abbr(x):
    x = (x or '').strip().upper(); x = ALIAS.get(x, x)
    return x if x in NICK else WORD.get(x.split()[0], None) if x else None

sched = [g for g in J('public/schedule.json', []) if g.get('season') == a.season and g.get('season_type') == 2]
fx = lambda t: ALIAS.get(t, t)
GAMES = {f"{fx(g['visitor'])}@{fx(g['home'])}": g for g in sched if g['week'] == W}
TEAM_GAME = {t: gid for gid in GAMES for t in gid.split('@')}
def kt(g): return datetime.datetime.fromisoformat(g['kickoff_utc'].replace('Z', '+00:00'))
PREV = {}   # team -> kickoff of its previous game
for g in sched:
    if g['week'] < W:
        for t in (fx(g['visitor']), fx(g['home'])):
            if t not in PREV or kt(g) > PREV[t]: PREV[t] = kt(g)
FINAL = {gid for gid, g in GAMES.items() if g.get('status') == 'post'}
# lines: AN open + BKR now
OPEN = (J(f'data/odds/actionnetwork-openers-{a.season}-w{WW}.json', {}) or {}).get('games', {})
NOW = collections.defaultdict(dict)
for r in (J(f'data/generated/props/bookmaker-live-{D}-week{W}.json', {}) or {}).get('rows', []):
    if r['market'] != 'game_lines': continue
    a_, h_ = r['event'].split(' @ '); gid = f'{FULL[a_]}@{FULL[h_]}'
    if r['bet'] == 'spread': NOW[gid].setdefault('sp', {})[FULL[r['side']]] = r['line']
    if r['bet'] == 'total': NOW[gid]['tot'] = r['line']
    if r['bet'] == 'moneyline': NOW[gid].setdefault('ml', {})[FULL[r['side']]] = r['odds']
def spreads(gid, team):
    out = [x for x in ((OPEN.get(gid) or {}).get('sp', {}).get(team), (NOW.get(gid) or {}).get('sp', {}).get(team)) if x is not None]
    return out
def totals(gid): return [x for x in ((OPEN.get(gid) or {}).get('tot'), (NOW.get(gid) or {}).get('tot')) if x is not None]
def mls(gid, team): return [x for x in ((OPEN.get(gid) or {}).get('ml', {}).get(team), (NOW.get(gid) or {}).get('ml', {}).get(team)) if x is not None]
# rosters
E = (J('data/nfl-rosters/espn-full-rosters-latest.json', {}) or {}).get('players', {})
def norm(n):
    n = re.sub(r"[.'’]", '', (n or '').lower()); n = re.sub(r'\b(jr|sr|ii|iii|iv|v)\b', '', n); return re.sub(r'\s+', ' ', n).strip()
RT = collections.defaultdict(set)
for n, recs in E.items():
    for r in recs:
        if r.get('group') != 'practiceSquad': RT[norm(n)].add(fx(r['team']) if r['team'] != 'WSH' else 'WAS')
RTKEYS = sorted(RT, key=len, reverse=True)
# people named inside outlet rationales (outlet -> person)
PEOPLE = [('Steve Fezzik', r'\bfezz?ik\b'), ('Ross Tucker', r'\bross\b'), ('Doug Kezirian', r'\bdoug\b'), ('Brandon Anderson', r'\bbrandon anderson\b'),
          ('Brandon Kravitz', r'\bkravitz\b'), ('Simon Hunter', r'\bsimon\b'), ('Chad Millman', r'\bchad\b'), ('Stuckey', r'\bstuckey\b'),
          ('Andrew Erickson', r'\berickson\b'), ('Wes Reynolds', r'\bwes reynolds\b')]
SPEAKER_FIX = {'Steve Fezik': 'Steve Fezzik', 'Steve': 'Steve Fezzik', 'Doug': 'Doug Kezirian', 'Dave': 'Dave (podcast co-host)', 'EC': 'EC (podcast)'}
def persons(outlet, text):
    t = (text or '').lower(); out = [p for p, rx in PEOPLE if re.search(rx, t)]
    if outlet == 'Even Money' and re.search(r'\bboth hosts\b', t): out = ['Steve Fezzik', 'Ross Tucker']
    return out
BEST = re.compile(r'best bet|pick of the week|top play|\block\b|favorite bet|trade of the week|bet of the week', re.I)
CONTEST = re.compile(r'contest pick|six-pack|splash|supercontest|circa million', re.I)

rows = []
def add(**k):
    k.setdefault('reasons', []); k.setdefault('flags', []); rows.append(k)

pull = J(f'data/generated/master-intel/w{WW}-pull.json', {})
# 1) expert feed
for r in pull.get('expert', []):
    v, h = teams_in(r.get('visitor'), False) or teams_in(r.get('visitor')), teams_in(r.get('home'), False) or teams_in(r.get('home'))
    gid = next((g for g in GAMES if {g.split('@')[0]} <= v and {g.split('@')[1]} <= h), None)
    pt = r.get('pick_type'); sel = str(r.get('selection') or ''); q = r.get('rationale') or ''
    market = {'spread': 'spread', 'moneyline': 'moneyline', 'total': 'total', 'teaser': 'teaser', 'player_prop': 'prop'}.get(pt, pt)
    side = None
    if market in ('spread', 'moneyline', 'teaser'):
        ts = teams_in(sel) & set((gid or '@').split('@')); side = next(iter(ts)) if len(ts) == 1 else None
    elif market == 'total': side = 'Over' if 'over' in sel.lower() else 'Under' if 'under' in sel.lower() else None
    add(kind='expert_feed', outlet=r.get('expert'), persons=persons(r.get('expert'), q), game=gid, market=market, side=side,
        line=r.get('line'), price=None, selection=sel, quote=q, source_title='expert registry', url=None,
        published=r.get('created_at'), players=[sel.split(' OVER')[0].split(' UNDER')[0]] if market == 'prop' else [])
# 2) podcasts
for ep in pull.get('podcast_gemini', []):
    for p in ep.get('picks') or []:
        team = abbr(p.get('team')); gid = TEAM_GAME.get(team) if team else None
        mk = p.get('market') or ''; side = str(p.get('side') or ''); line = p.get('line')
        market = ('spread' if mk in ('spread', 'lean') else 'contest' if mk in ('contest_pick', 'pickem_pick') else
                  'total' if mk == 'total' else 'teaser' if mk == 'teaser' else 'moneyline' if mk == 'moneyline' else
                  'prop' if p.get('player') else mk)
        s = None
        if market in ('spread', 'contest', 'teaser', 'moneyline') and gid:
            s = abbr(side) or abbr(side.split()[0] if side else '')
            if s is None and side.upper() in ('UNDER', 'OVER', 'FAVORITE', 'UNDERDOG') and line is not None:
                # speakers often say "take the 3.5" (dog) or "lay -2.5" (favorite): resolve by the sign of the line
                sp = (NOW.get(gid) or {}).get('sp', {}); fav = min(sp, key=sp.get) if sp else None
                dog = next((t for t in gid.split('@') if t != fav), None)
                s = fav if (side.upper() == 'FAVORITE' or float(line) < 0) else dog
            if s and market == 'contest': m = re.search(r'([+-]?\d+(?:\.\d)?)', side); line = float(m.group(1)) if m else line
        elif market == 'total': s = 'Over' if side.upper() == 'OVER' else 'Under' if side.upper() == 'UNDER' else None
        sp_ = p.get('speaker') or '?'
        add(kind='podcast', outlet=ep.get('episode_title'), persons=[SPEAKER_FIX.get(sp_, sp_)], game=gid, market=market, side=s if market != 'prop' else side,
            line=line, price=p.get('price'), selection=f"{p.get('player') or ''} {mk} {side} {line if line is not None else ''}".strip(),
            quote=p.get('rationale') or '', source_title=ep.get('episode_title'), url=None,
            published=ep.get('episode_published_at'), players=[p['player']] if p.get('player') else [], week_tag=p.get('week'), team_tag=p.get('team'))
# 3) article signals that carry an actual bet
for r in pull.get('signals', []):
    bt = r.get('bet_type'); lean = html.unescape(f"{r.get('team_or_market') or ''} | {r.get('lean') or ''}")
    if bt not in ('spread', 'moneyline', 'total', 'player_prop'): continue
    title_text = html.unescape(f"{r.get('event_ref') or ''} {r.get('rationale') or ''}")
    num = re.search(r'(?<![\w.])([+-]?\d{1,2}(?:\.\d)?)(?![\d%])', lean)
    if bt == 'total':
        ou = 'Over' if re.search(r'\bover\b', lean, re.I) else 'Under' if re.search(r'\bunder\b', lean, re.I) else None
        if not ou or not num: continue
        # match the game from the pick's own text first ("Vikings/Dolphins UNDER 38.5"), the article title only as a fallback
        T = teams_in(lean); g = [x for x in GAMES if set(x.split('@')) <= T]
        if len(g) != 1:
            T = teams_in(title_text); g = [x for x in GAMES if set(x.split('@')) <= T]
        add(kind='article', outlet=r.get('source'), persons=[r['author']] if r.get('author') and r['author'] != 'None' else [], game=g[0] if len(g) == 1 else None,
            market='total', side=ou, line=float(num.group(1)), price=None, selection=lean, quote=(r.get('rationale') or '')[:300],
            source_title=r.get('event_ref'), url=r.get('event_ref'), published=r.get('captured_at'), players=[], text=title_text)
    elif bt in ('spread', 'moneyline'):
        T = teams_in(lean)
        if len(T) != 1: continue
        core = (r.get('lean') or '').strip()
        if len(core.split()) > 7 or not re.search(r'[+-]\d|\bpk\b|pick.?em|\bml\b|moneyline|to win|predicted', core, re.I): continue   # headline / no bet
        if re.search(r'\b(are|is|as|opened|around|odds)\b', core, re.I): continue   # odds description ("Bears are +168"), not a pick
        t = next(iter(T)); gid = TEAM_GAME.get(t)
        add(kind='article', outlet=r.get('source'), persons=[r['author']] if r.get('author') and r['author'] != 'None' else [], game=gid,
            market=bt, side=t, line=float(num.group(1)) if (num and bt == 'spread') else None, price=None, selection=lean,
            quote=(r.get('rationale') or '')[:300], source_title=r.get('event_ref'), url=r.get('event_ref'), published=r.get('captured_at'), players=[], text=title_text)
    elif bt == 'player_prop':
        pl = (r.get('team_or_market') or '').split(' - ')[0].strip()
        ts = RT.get(norm(pl), set()); gids = {TEAM_GAME[t] for t in ts if t in TEAM_GAME}
        hm = re.search(r'x\.com/([A-Za-z0-9_]+)/', r.get('event_ref') or '')
        who = [r['author']] if r.get('author') and r['author'] != 'None' else ([f"@{hm.group(1)}"] if hm else [])
        add(kind='article', outlet=r.get('source'), persons=who, game=next(iter(gids)) if len(gids) == 1 else None,
            market='prop', side=r.get('lean'), line=None, price=None, selection=f"{pl}: {r.get('team_or_market')} {r.get('lean')}",
            quote=(r.get('rationale') or '')[:300], source_title=r.get('event_ref'), url=r.get('event_ref'), published=r.get('captured_at'), players=[pl], text=title_text)

# 4) picks read from the FULL article text (scripts/intel/archive_week_articles.mjs -> hand extraction). These replace the
#    headline-level signal rows from the same article, which are dropped below.
AP = J(f'data/intel/extracted/{a.season}-w{WW}-article-picks.json', {}) or {}
full_urls = set()
for r in AP.get('rows', []):
    full_urls.add(r['url'])
    m = r['market']; side = r.get('side')
    players = []
    if m == 'prop':
        ns = ' ' + norm(side or '') + ' '
        players = [nm for nm in RTKEYS if len(nm) > 5 and f' {nm} ' in ns]
        players = [p_ for p_ in players if not any(p_ != q and p_ in q for q in players)][:1]   # longest match only
    add(kind='article', outlet=r['outlet'], persons=[r['person']] if r.get('person') else [], game=r['game'], market=m, side=side, line=r.get('line'),
        price=r.get('price'), selection=(f"{side or ''} {r['line'] if r.get('line') is not None else ''}".strip() if m != 'prop' else side) or 'pass',
        quote=r.get('quote') or '', source_title=r.get('title'), url=r['url'], published=r.get('published'), players=players,
        full_text=True, flags_in=r.get('flags') or [])
rows[:] = [x for x in rows if not (x['kind'] == 'article' and not x.get('full_text') and x.get('url') in full_urls)]

# ---- one pick per source: the same tweet/article parsed twice (author + handle) is one row ----
seen = set(); keep = []
for x in rows:
    k = (x['kind'], x.get('url') or x.get('outlet'), x['game'], x['market'], (x['players'] or [''])[0], x['side'] if x['market'] != 'prop' else '', re.sub(r'[^0-9.]', '', str(x['selection']))[-6:])
    if x['kind'] == 'article' and k in seen: continue
    seen.add(k); keep.append(x)
rows[:] = keep
# ---- article rows count only when they read as somebody's pick ----
PICKY = re.compile(r"\b(give me|plays?|take|taking|pick|best bet|lean|like|predicted|to win|bet)\b", re.I)
NOTPICK = re.compile(r"^(no on|the losses|losses|opened|odds)\b|\bwere\b", re.I)
NOPAGE = re.compile(r"schedule-odds|survivor|odds-betting-point-spreads|odds-spreads-lines|fashionable", re.I)
URLPERSON = [(r"steve-makinen", "Steve Makinen"), (r"tuleys-takes", "Dave Tuley"), (r"\bsolak", "Ben Solak"), (r"wes-reynolds", "Wes Reynolds"),
             (r"matt-youmans", "Matt Youmans"), (r"zachary-cohen", "Zachary Cohen"), (r"sharpfootballanalysis\.com/betting/best-bets", "Josh Shepardson")]
for x in rows:
    if x['kind'] != 'article' or x.get('full_text'): continue   # full-text picks were read and confirmed as picks by hand
    u = x.get('url') or ''
    for rx, who in URLPERSON:
        if re.search(rx, u, re.I) and who not in x['persons']: x['persons'].append(who)
    if re.search(r"\bsolak\b", x['selection'] or '', re.I) and 'Ben Solak' not in x['persons']: x['persons'].append('Ben Solak')
    lean = (x['selection'] or '').split('|')[-1].strip()
    if NOPAGE.search(u) or NOTPICK.search(lean) or not (x['persons'] or PICKY.search(x['selection'] or '')):
        x['verdict_hint'] = 'not_pick'
# ---- an article page that shows both Over and Under at the same number is an odds table, not a pick ----
both = collections.Counter((x['url'], x['line']) for x in rows if x['kind'] == 'article' and x['market'] == 'total')
for x in rows:
    if x['kind'] == 'article' and x['market'] == 'total' and not x.get('full_text'):
        sides = {y['side'] for y in rows if y['kind'] == 'article' and y['market'] == 'total' and y['url'] == x['url'] and y['line'] == x['line'] and y['game'] == x['game'] and not y.get('full_text')}
        if len(sides) > 1: x['reasons'] = ['page lists both over and under (odds table, not a pick)']
# ---- checks ----
def ts(x):
    try:
        t = datetime.datetime.fromisoformat(str(x).replace('Z', '+00:00'))
        return t if t.tzinfo else t.replace(tzinfo=datetime.timezone.utc)
    except Exception: return None
for x in rows:
    R = x['reasons']; gid = x['game']
    # players first: a prop filed under the wrong game is re-tagged when its player's team plays exactly one Week N game
    for pl in x['players']:
        tms = RT.get(norm(pl), set())
        if not tms: R.append(f"player '{pl}' is not on any 2026 ESPN roster"); continue
        if gid and not (tms & set(gid.split('@'))):
            g2 = {TEAM_GAME[t] for t in tms if t in TEAM_GAME}
            if len(g2) == 1 and x['market'] == 'prop': x['flags'].append(f'retagged from {gid}'); x['game'] = gid = next(iter(g2))
            else: R.append(f"player '{pl}' plays for {'/'.join(sorted(tms))}, not {gid}")
    if not gid: R.append('does not map to one Week %d NFL game' % W); x['verdict'] = 'reject'; continue
    A, H = gid.split('@')
    if gid in FINAL or (NOW and gid not in NOW): R.append('game already played (not on the current board)')
    if x.get('week_tag') not in (None, W): R.append(f"podcast tagged week {x['week_tag']}")
    pub = ts(x.get('published'))
    if pub and x['kind'] == 'article':
        prev = max([PREV[t] for t in (A, H) if t in PREV], default=None)
        if prev and pub < prev + datetime.timedelta(hours=3): R.append(f"published {pub:%a %m/%d %H:%MZ}, before both teams' previous game ended")
    if x['kind'] == 'article' and x.get('text'):
        other = teams_in(x['text']) - {A, H}
        if other and not (teams_in(x['text']) >= {A, H}) and re.search(r'\bvs\.?\b|\b@\b|\bat\b', x['text'].lower()):
            R.append(f"article is about {'/'.join(sorted(other))}, not {gid}")
        if re.search(r'week\s*(\d+)', x['text'].lower()) and int(re.search(r'week\s*(\d+)', x['text'].lower()).group(1)) != W:
            R.append('article title names a different week')
    m, s, ln = x['market'], x['side'], x['line']
    if m == 'pass':   # the expert explicitly passed on the game: verified as a stance, never counted as a side
        x['best_bet'] = x['contest'] = False; x['verdict'] = 'reject' if R else 'verified'; continue
    if 'alt' in (x.get('flags_in') or []) and m == 'spread': x['flags'].append('alternate line (as stated by the source)'); ln = None
    if m in ('spread', 'moneyline', 'teaser', 'contest'):
        if s not in (A, H): R.append(f"side '{s}' is not {A} or {H}")
        elif m in ('spread', 'contest') and ln is not None:
            ln = float(ln); ref = spreads(gid, s)
            fits = lambda v: any((abs(v - r_) <= 3.5 and (r_ * v >= 0 or abs(r_) <= 1.5 or abs(v) <= 1.5)) for r_ in ref)
            pr = x.get('price')
            if ref and not fits(ln) and fits(-ln) and any(abs(abs(ln) - abs(r_)) <= 0.5 for r_ in ref):
                x['flags'].append(f'line sign corrected ({ln:+g} -> {-ln:+g}; same size as the market, wrong sign in extraction)'); x['line'] = -ln
            elif ref and not fits(ln) and pr is not None and float(pr) >= 150:   # plus-money alternate spread (e.g. NYG -6.5 +285)
                x['flags'].append(f'alternate line ({s} {ln:+g} at {float(pr):+.0f})')
            elif ref and not fits(ln):
                R.append(f"line {s} {ln:+g} doesn't fit this game ({s} {'/'.join(f'{r_:+g}' for r_ in ref)} open/now)")
        elif m == 'moneyline' and x.get('price') is not None:
            ref = mls(gid, s)
            if ref and not any((r_ < 0) == (float(x['price']) < 0) for r_ in ref): R.append(f"moneyline price {x['price']:+} has the wrong favorite/dog direction for {s}")
    if m == 'total':
        if s not in ('Over', 'Under'): R.append('total without over/under')
        elif ln is not None and totals(gid) and not any(abs(float(ln) - t_) <= 6 for t_ in totals(gid)):
            R.append(f"total {ln:g} doesn't fit this game ({'/'.join(f'{t_:g}' for t_ in totals(gid))} open/now)")
    if m not in ('spread', 'moneyline', 'teaser', 'contest', 'total', 'prop'): x['flags'].append(f'market {m}')
    if m == 'moneyline' and x['kind'] == 'expert_feed' and re.search(r'scor\w* last', x['quote'] or '', re.I): R.append('a game-prop, not a moneyline on this game')
    x['best_bet'] = bool(BEST.search(f"{x.get('quote') or ''} {x.get('source_title') or ''}")) or 'best' in (x.get('flags_in') or [])
    for f_ in x.get('flags_in') or []:
        if f_ in ('sgp', 'pro', 'lean', 'survivor'): x['flags'].append({'sgp': 'same-game-parlay leg', 'pro': 'Action PRO model prediction', 'lean': 'lean, not a full play', 'survivor': 'survivor pick'}[f_])
    x['contest'] = bool(m == 'contest' or CONTEST.search(x.get('quote') or ''))
    x['verdict'] = 'not_pick' if x.pop('verdict_hint', None) == 'not_pick' else ('reject' if R else 'verified')
    x.pop('text', None)
for x in rows: x.pop('text', None)

# ---- context lanes (never counted as picks): trends & systems (Evan Abrams' primer), news & angles (archived headlines) ----
CTX = []
PI = J(f'data/intel/extracted/{a.season}-w{WW}-primer-intel.json', {}) or {}
for r in PI.get('rows', []):
    g = r['game']
    if g != 'SLATE' and (g not in GAMES or g in FINAL or (NOW and g not in NOW)): continue
    CTX.append(dict(lane='trend' if r['kind'] == 'trend' else 'system', game=g, text=r.get('text') if r['kind'] == 'trend' else
                    f"{r['label']}: {('play on ' + r['side']) if r['side'] not in ('Over', 'Under') else r['side'].lower()} ({r['record']}{', ' + r['units'] + ' units' if r.get('units') else ''})",
                    side=r.get('side'), market=r.get('market') or r.get('group'), category=r.get('category'), top=r.get('top'), person=r.get('person'), outlet=r.get('outlet'), url=r.get('url'), published=r.get('published')))
AIDX = J(f'data/intel/articles/{a.season}-w{WW}/index.json', {}) or {}
NEWSRX = re.compile(r"\b(out|ruled|questionable|doubtful|injur\w*|ir\b|injured reserve|return\w*|activat\w*|start\w*|qb|quarterback|trade\w*|signs?|releas\w*|practice|game-time|concussion|hamstring|ankle|knee|debut|benched|suspend\w*)\b", re.I)
NOISE = re.compile(r"historic start|offensive start|stronger starts|record-setting|reacting to|need to start|evaluating|weighs in|right move|will he succeed|swung and missed|has time to prove|stephen a\.|first take|get up|fantasy|dfs|start/sit|start-sit|waiver|draft|uniform|arrivals|mascot|hall of fame|ratings|viewers|power rankings|mock", re.I)
seen_t = set()
for r in AIDX.values():
    if r.get('source') not in ('ESPN NFL', 'Pro Football Talk', 'Rotowire NFL'): continue
    if r.get('class') in ('prior_week_recap', 'out_of_window', 'general'): continue   # tagged by scripts/intel/classify_week_articles.py
    t = html.unescape(r.get('title') or '')
    if not NEWSRX.search(t) or NOISE.search(t) or t.lower() in seen_t: continue
    tm = teams_in(t, cities=False)   # nicknames only: 'Dallas Goedert' must not read as the Cowboys
    gs = {TEAM_GAME[x] for x in tm if x in TEAM_GAME}
    if len(gs) != 1: continue
    g = next(iter(gs))
    if g in FINAL or (NOW and g not in NOW): continue
    pub = ts(r.get('published'))
    prev = max([PREV[x] for x in g.split('@') if x in PREV], default=None)
    if pub and prev and pub < prev: continue
    seen_t.add(t.lower())
    CTX.append(dict(lane='news', game=g, text=t, outlet=r['source'], url=r['url'], published=r.get('published')))
out = dict(schema='expert_verified_v1', season=a.season, week=W, date=D, generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
           checks=['game', 'final', 'timing', 'other-opponent', 'side', 'line', 'players'], counts=dict(collections.Counter(x['verdict'] for x in rows)), rows=rows,
           context=CTX, context_counts=dict(collections.Counter(c['lane'] for c in CTX)))
(ROOT / f'data/generated/master-intel/w{WW}-expert-verified.json').write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding='utf-8')
L = [f'# Expert pick verification: {a.season} Week {W}', '', f'Generated {out["generated_at"]} by `scripts/master-intel/verify_expert_rows.py`. '
     f'{out["counts"].get("verified", 0)} picks verified, {out["counts"].get("reject", 0)} rejected. Rejected picks are not shown or counted anywhere in the report.', '',
     '| Kind | Source | Person | Game | Pick | Why rejected |', '|---|---|---|---|---|---|']
for x in sorted(rows, key=lambda r: (str(r['game']), r['kind'])):
    if x['verdict'] != 'reject': continue
    L.append(f"| {x['kind']} | {html.escape(str(x['outlet']))[:40]} | {', '.join(x['persons'])[:30]} | {x['game'] or '—'} | {html.escape(str(x['selection'])).replace('|', '/')[:60]} | {'; '.join(x['reasons'])} |")
(ROOT / f'reports/intel/expert-verification-{a.season}-w{WW}.md').write_text('\n'.join(L) + '\n', encoding='utf-8')
print(f"verified {out['counts'].get('verified', 0)} · rejected {out['counts'].get('reject', 0)} · retagged {sum(1 for x in rows if any('retagged' in f for f in x['flags']))}")
