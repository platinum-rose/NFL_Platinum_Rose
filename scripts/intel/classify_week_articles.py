#!/usr/bin/env python3
"""Tag every archived article for an NFL week with what it is about, and drop nothing silently.

Andy, 2026-10-03: the week archive (archive_week_articles.mjs) collects everything captured in the week window, which
includes Week N-1 game recaps and an occasional evergreen Action Network archive piece. This tags each index entry:
  week_preview      about Week N games: names Week N, a Week N matchup (both teams), or its text talks about Week N more than N-1
  team_news         one team's injuries / transactions / practice news dated after that team's previous game (feeds News & angles)
  prior_week_recap  about Week N-1: names Week N-1, a Week N-1 matchup, recap language, or text about Week N-1 more than Week N
  general           league-wide or evergreen content with no Week N game in it (fantasy, waivers, explainers)
  out_of_window     published before the week window (e.g. an August evergreen article on the archive pages)
Writes `class` and `class_reason` into data/intel/articles/<season>-wNN/index.json and rewrites the committed index
reports/intel/article-archive-<season>-wNN.md with a per-class summary. Downstream: verify_expert_rows.py (news lane) and
game_digest.py skip prior_week_recap / out_of_window / general.
Usage: python3 scripts/intel/classify_week_articles.py --week 4
"""
import argparse, collections, datetime, html, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--season', type=int, default=2026); a = ap.parse_args()
W, WW = a.week, f'{a.week:02d}'
D = ROOT / f'data/intel/articles/{a.season}-w{WW}'
idx = json.load(open(D / 'index.json', encoding='utf-8'))
WS = datetime.datetime(2026, 9, 8, 4, tzinfo=datetime.timezone.utc) + datetime.timedelta(days=(W - 1) * 7 - 1)   # same window as pull.mjs / the archive
NAMES = {'ARI':['cardinals'],'ATL':['falcons'],'BAL':['ravens'],'BUF':['bills'],'CAR':['panthers'],'CHI':['bears'],'CIN':['bengals'],'CLE':['browns'],'DAL':['cowboys'],'DEN':['broncos'],'DET':['lions'],'GB':['packers'],'HOU':['texans'],'IND':['colts'],'JAX':['jaguars','jags'],'KC':['chiefs'],'LV':['raiders'],'LAC':['chargers'],'LAR':['rams'],'MIA':['dolphins'],'MIN':['vikings'],'NE':['patriots','pats'],'NO':['saints'],'NYG':['giants'],'NYJ':['jets'],'PHI':['eagles'],'PIT':['steelers'],'SF':['49ers','niners'],'SEA':['seahawks'],'TB':['buccaneers','bucs'],'TEN':['titans'],'WAS':['commanders']}
def teams(t):
    t = ' ' + (t or '').lower() + ' '
    return {ab for ab, ns in NAMES.items() if any(re.search(r'\b' + re.escape(n) + r'\b', t) for n in ns)}
fx = lambda t: {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX'}.get(t, t)
sched = [g for g in json.load(open(ROOT / 'public/schedule.json', encoding='utf-8')) if g.get('season') == a.season and g.get('season_type') == 2]
def kt(g): return datetime.datetime.fromisoformat(g['kickoff_utc'].replace('Z', '+00:00'))
PAIRS = {wk: [{fx(g['visitor']), fx(g['home'])} for g in sched if g['week'] == wk] for wk in (W - 1, W)}
PREV = {}
for g in sched:
    if g['week'] < W:
        for t in (fx(g['visitor']), fx(g['home'])):
            PREV[t] = max(PREV.get(t, kt(g)), kt(g))
# player name -> team, so "Baker Mayfield: Facing three-week absence" reads as TB news (2026 ESPN rosters; unique names only)
_R = json.load(open(ROOT / 'data/nfl-rosters/espn-full-rosters-latest.json', encoding='utf-8')).get('players', {})
PLAYER = {n.lower(): fx(v[0]['team']) for n, v in _R.items() if len({x['team'] for x in v}) == 1 and len(n.split()) >= 2}
# head coaches from the Abrams primer feed (local file; optional): "Sean McVay is 0-4 against Nick Sirianni" is LAR@PHI
_PI = ROOT / f'data/intel/extracted/{a.season}-w{WW}-primer-intel.json'
if _PI.exists():
    for gid, g in (json.load(open(_PI, encoding='utf-8')).get('games') or {}).items():
        A, H = gid.split('@') if '@' in gid else (None, None)
        for side, tm_ in (('away', A), ('home', H)):
            if tm_ and g.get(f'{side}_coach'): PLAYER[g[f'{side}_coach'].lower()] = fx(tm_)
PRX = re.compile(r"\b(" + '|'.join(sorted((re.escape(n) for n in PLAYER), key=len, reverse=True)) + r")(?:'s)?\b", re.I) if PLAYER else None
def teams_any(t):
    tm = teams(t)
    if PRX: tm |= {PLAYER[m.group(1).lower()] for m in PRX.finditer(t or '')}
    return tm
LASTPREV = max(kt(g) for g in sched if g['week'] == W - 1) if any(g['week'] == W - 1 for g in sched) else None
def ts(s):
    if not s: return None
    try:
        d = datetime.datetime.fromisoformat(str(s).replace('Z', '+00:00'))
        return d if d.tzinfo else d.replace(tzinfo=datetime.timezone.utc)
    except ValueError: return None
WKN, WKP = re.compile(rf'\bweek {W}\b', re.I), re.compile(rf'\bweek {W - 1}\b', re.I)
RECAP = re.compile(r'\b(recap|takeaways?|grades?|overreactions?|what we learned|winners and losers|instant analysis|postgame|halftime|after (the )?(win|loss)|(in|during|late in) (the )?(win|loss|rout|victory|defeat)|to victory|after leading|after losing|after beating|falls to \d|improves? to \d|kept in check|strong finish|big game vs|(routs?|beats?|stuns?|edges?|tops|downs|holds? off|rall(y|ies) past|crush(es)?) [a-z.\' ]*\b(over|past|in)\b|scores? \d+ tds?|waiver wire|no explanation|won\'t make excuses|victim card|regrets?)', re.I)
PRIME = re.compile(r'\b(monday night|mnf|sunday night|snf|thursday night|tnf)\b', re.I)
TALK = re.compile(r"stephen a\.?|mcafee|first take|get up|rex ryan|bruschi|a\.j\. hawk|yates|orlovsky|kimes|ryan clark|swagu|mina kimes|why .* (is|are) (skeptical|concerned|starting)|sounds off|weighs in|wouldn't be shocked", re.I)
FWD = re.compile(r'\b(this week|will|could|expected|set to|plans?|eyes|on track|status|vs\.?|against|travel)\b', re.I)
NEWS = re.compile(r"\b(out|ruled|qb|quarterback|questionable|doubtful|injur\w*|ir\b|injured reserve|return\w*|activat\w*|practice|trade\w*|traded|signs?|signed|releas\w*|waive\w*|claim\w*|extension|game-time|concussion|hamstring|ankle|knee|debut|start\w*|benched|suspend\w*)\b", re.I)
GENERAL = re.compile(r'fantasy|dfs|start/sit|start-sit|waiver|dynasty|rookie rankings|mock draft|draft|prediction market|explained|how to bet|betting guide|promo|sportsbook review|power rankings', re.I)
def body(r):
    f = r.get('file')
    if not f or not (ROOT / f).exists(): return ''
    t = open(ROOT / f, encoding='utf-8').read()
    return t.split('\n---\n', 1)[-1][:6000]
def classify(r):
    pub = ts(r.get('published'))
    if pub and pub < WS - datetime.timedelta(days=2): return 'out_of_window', f'published {pub.date()} (window starts {WS.date()})'
    t = html.unescape(r.get('title') or ''); tm = teams(t); ta = teams_any(t)
    if WKN.search(t): return 'week_preview', f'title names Week {W}'
    if any(p <= tm for p in PAIRS[W]): return 'week_preview', 'title names a Week %d matchup' % W
    if any(p <= ta for p in PAIRS[W]) and not RECAP.search(t): return 'week_preview', 'title names players/coaches from a Week %d matchup' % W
    if WKP.search(t): return 'prior_week_recap', f'title names Week {W - 1}'
    if any(p <= tm for p in PAIRS[W - 1]): return 'prior_week_recap', 'title names a Week %d matchup' % (W - 1)
    if PRIME.search(t) and pub and LASTPREV and pub < LASTPREV + datetime.timedelta(hours=4): return 'prior_week_recap', f'primetime item published before the Week {W - 1} finale ended'
    if RECAP.search(t): return 'prior_week_recap', 'recap wording in the title'
    if TALK.search(t): return 'general', 'TV/talk-show commentary'
    if len(ta) == 1 and NEWS.search(t):
        tt = next(iter(ta)); prev = PREV.get(tt)
        if not pub or not prev or pub >= prev or FWD.search(t): return 'team_news', f'{tt} news' + ('' if not pub or not prev or pub >= prev else ' (forward-looking, before its last game ended)')
        return 'prior_week_recap', f'{tt} news dated before its Week {W - 1} game ended'
    if GENERAL.search(t): return 'general', 'fantasy/general topic'
    b = body(r); n, p = len(WKN.findall(b)), len(WKP.findall(b))
    if n and n >= p: return 'week_preview', f'text mentions Week {W} {n}x vs Week {W - 1} {p}x'
    if p >= n + 2: return 'prior_week_recap', f'text mentions Week {W - 1} {p}x vs Week {W} {n}x'
    if len(ta) == 1: return 'team_news', f'{next(iter(ta))} story'
    return 'general', 'no Week %d game named' % W
for r in idx.values(): r['class'], r['class_reason'] = classify(r)
json.dump(idx, open(D / 'index.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
C = collections.Counter(r['class'] for r in idx.values())
BYS = collections.defaultdict(collections.Counter)
for r in idx.values(): BYS[r['source']][r['class']] += 1
ORDER = ['week_preview', 'team_news', 'prior_week_recap', 'general', 'out_of_window']
LABEL = {'week_preview': 'Week %d preview / picks' % W, 'team_news': 'Team news', 'prior_week_recap': 'Week %d recap' % (W - 1), 'general': 'General / evergreen', 'out_of_window': 'Out of window'}
L = [f'# Article archive: {a.season} Week {W}', '',
     f'Full text saved locally (gitignored) under `data/intel/articles/{a.season}-w{WW}/` by `scripts/intel/archive_week_articles.mjs`; '
     f'classified by `scripts/intel/classify_week_articles.py`. Window starts {WS:%a %Y-%m-%d %H:%M} UTC. '
     '"SB chars" is what Supabase holds; 20,000 means the stored body was cut off. Only Week %d previews and team news feed the report; recaps, general and out-of-window articles are kept for reference.' % W, '',
     f'**{len(idx)} articles:** ' + ' · '.join(f'{LABEL[k]} {C.get(k, 0)}' for k in ORDER), '',
     '| Source | ' + ' | '.join(LABEL[k] for k in ORDER) + ' | Total |', '|---|' + '---|' * (len(ORDER) + 1)]
for s, c in sorted(BYS.items(), key=lambda x: -sum(x[1].values())):
    L.append(f'| {s} | ' + ' | '.join(str(c.get(k, 0)) for k in ORDER) + f' | {sum(c.values())} |')
for k in ORDER:
    rows = sorted([r for r in idx.values() if r['class'] == k], key=lambda r: (r['source'], r.get('published') or ''))
    L += ['', f'## {LABEL[k]} ({len(rows)})', '', '| Source | Published | Title | Author | Local chars | SB chars | Via | Why this class |', '|---|---|---|---|---|---|---|---|']
    for r in rows:
        L.append(f"| {r['source']} | {(r.get('published') or '')[:10]} | [{html.unescape(r.get('title') or '').replace('|', '/')[:90]}]({r['url']}) | {r.get('author') or ''} | {r.get('chars', 0)} | {r.get('sb_chars', 0)} | {r.get('how', '')} | {r['class_reason']} |")
(ROOT / f'reports/intel/article-archive-{a.season}-w{WW}.md').write_text('\n'.join(L) + '\n', encoding='utf-8')
print(f'{len(idx)} articles: ' + ', '.join(f'{k} {C.get(k, 0)}' for k in ORDER))
