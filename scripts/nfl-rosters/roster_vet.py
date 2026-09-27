"""ROSTER VET — the mandatory 2026 roster gate for the weekly card / intel build.

Every player a week's intel or card ties to a team is checked against the live ESPN rosters
(data/nfl-rosters/espn-full-rosters-latest.json: all 32 teams incl. IR and practice squad).
Added 2026-09-27 after the Week 3 sheet printed A.J. Brown as an Eagle (traded to NE), Mike Evans and
Rachaad White as Buccaneers, DeAndre Hopkins (on no roster), and a practice-squad QB as a starting-QB risk.
Never judge a player's team, role or status from memory: this file is the check.

What is checked (BLOCK = fails the gate):
  roster snapshot age      > 24h                                          BLOCK (use --fetch to refresh)
  card legs + digest legs  player not on either team in that game        BLOCK
                           player on IR/out list or practice squad        BLOCK
  narratives (game blocks) player named on neither team / on no roster   BLOCK
                           practice-squad player named                    BLOCK
  matchup seeds + targets  wrong team / on no roster                      BLOCK
  YouTube + expert picks   wrong team                                     BLOCK
  sportsbook prop boards   unmatched names (spelling variants)            info only
  secondary absences, roster-map-latest                                   info only

Usage:
  python3 scripts/nfl-rosters/roster_vet.py --week 3 --date 2026-09-26 [--fetch] [--strict]
    --fetch   refresh the ESPN roster snapshot first if it is older than 24h (free, public API)
    --strict  exit 1 when anything BLOCKs (build.py and the preflight use this)
  optional overrides for testing: --narratives PATH --card PATH --digest PATH
Writes data/generated/master-intel/wNN-roster-vet.json.
"""
import json, re, argparse, pathlib, collections, sys, subprocess, datetime
ROOT = pathlib.Path(__file__).resolve().parents[2]
for _s in (sys.stdout, sys.stderr):
    try: _s.reconfigure(errors='replace')   # Windows cp1252 consoles can't print '−' / '→' from narrative context
    except Exception: pass
ap = argparse.ArgumentParser()
ap.add_argument('--week', type=int, required=True); ap.add_argument('--date', required=True)
ap.add_argument('--season', type=int, default=2026); ap.add_argument('--strict', action='store_true'); ap.add_argument('--fetch', action='store_true')
ap.add_argument('--max-age-h', type=float, default=24)
ap.add_argument('--narratives'); ap.add_argument('--card'); ap.add_argument('--digest'); ap.add_argument('--quiet', action='store_true')
a = ap.parse_args()
WW = f'{a.week:02d}'
EP = ROOT / 'data/nfl-rosters/espn-full-rosters-latest.json'
def J(p, d=None):
    p = ROOT / p
    return json.load(open(p, encoding='utf-8')) if p.exists() else d
def age_h():
    if not EP.exists(): return float('inf')
    t = datetime.datetime.fromisoformat(json.load(open(EP, encoding='utf-8'))['generated_at'])
    return (datetime.datetime.now(datetime.timezone.utc) - t).total_seconds() / 3600
if a.fetch and age_h() > a.max_age_h:
    r = subprocess.run([sys.executable, str(ROOT / 'scripts/nfl-rosters/fetch_espn_rosters.py')], capture_output=True, text=True)
    print((r.stdout or r.stderr).strip())
E = J('data/nfl-rosters/espn-full-rosters-latest.json')
if not E: print('ROSTER VET: BLOCK - no ESPN roster snapshot (python3 scripts/nfl-rosters/fetch_espn_rosters.py)'); sys.exit(1 if a.strict else 0)
AGE = age_h()

FIX = {'WAS': 'WSH', 'JAC': 'JAX', 'LA': 'LAR', 'LVR': 'LV', 'NOS': 'NO', 'KCC': 'KC', 'GBP': 'GB', 'NEP': 'NE', 'SFO': 'SF', 'TBB': 'TB'}
fx = lambda t: FIX.get(t, t) if t else t
def norm(n):
    n = re.sub(r"[.'’]", '', (n or '').lower()); n = re.sub(r'\b(jr|sr|ii|iii|iv|v)\b', '', n)
    return re.sub(r'\s+', ' ', n).strip()
R = collections.defaultdict(list)            # norm full name -> [rec]
BY_TEAM = collections.defaultdict(list)      # team -> [rec]
for n, recs in E['players'].items():
    for r in recs:
        rec = dict(r, name=n); R[norm(n)].append(rec); BY_TEAM[r['team']].append(rec)
teams_of = lambda n: {r['team'] for r in R.get(norm(n), [])}
NICK = {'Cardinals':'ARI','Falcons':'ATL','Ravens':'BAL','Bills':'BUF','Panthers':'CAR','Bears':'CHI','Bengals':'CIN','Browns':'CLE','Cowboys':'DAL','Broncos':'DEN','Lions':'DET','Packers':'GB','Texans':'HOU','Colts':'IND','Jaguars':'JAX','Chiefs':'KC','Raiders':'LV','Chargers':'LAC','Rams':'LAR','Dolphins':'MIA','Vikings':'MIN','Patriots':'NE','Saints':'NO','Giants':'NYG','Jets':'NYJ','Eagles':'PHI','Steelers':'PIT','49ers':'SF','Seahawks':'SEA','Buccaneers':'TB','Titans':'TEN','Commanders':'WSH'}
def team_from_full(s):
    for k, v in NICK.items():
        if k in (s or ''): return v
    return fx((s or '').strip())
FULLNAMES = sorted({r['name'] for v in R.values() for r in v if len(r['name'].split()) >= 2}, key=len, reverse=True)
NAME_RE = re.compile(r"\b(" + '|'.join(re.escape(n) for n in FULLNAMES) + r")\b")
GAME_RE = re.compile(r'\b([A-Z]{2,3})@([A-Z]{2,3})\b')

out = collections.defaultdict(list)          # section -> [(level, name, claimed, roster, ctx)]
BLOCKING = {'narratives', 'card', 'digest', 'seed:receiver-roles-2026.json', 'seed:secondary-roles-2026.json',
            'secondary-matchups:targets', 'youtube-picks', 'pull:expert-picks'}
def add(section, level, name, claimed, roster, ctx=''):
    out[section].append((level, name, sorted(claimed), sorted(roster) if roster else '-', ctx))
def chk(section, name, claimed, ctx=''):
    t = teams_of(name)
    if not t: add(section, 'UNVERIFIED', name, claimed, None, ctx); return
    if not (t & set(claimed)): add(section, 'MISMATCH', name, claimed, t, ctx); return
    if section in ('narratives', 'card', 'digest') and all(r['group'] == 'practiceSquad' for r in R[norm(name)] if r['team'] in claimed):
        add(section, 'PRACTICE_SQUAD', name, claimed, t, ctx)

# --- leg resolver for card / digest rows: "Tuten 53+ rush", "D.Smith o5.5 rec", "Lamar 34+ rush", "Roquan Smith 8+ T+A"
TEAM_MKT = re.compile(r'^(?:[A-Z]{2,3}(?:/[A-Z]{2,3})?\s+(?:ML|[+-]\d|[OU]\s?\d|U\d|O\d)|[OU]\d|U\d|skip|split|—|-$)', re.I)
def leg_player(text):
    t = re.sub(r'\*|\(.*?\)', '', text).strip()
    if not t or TEAM_MKT.match(t) or re.match(r'^(ML|Over|Under)\b', t): return None
    m = re.match(r"^([A-Z][\w'’.\-]*(?:\s+[A-Z][\w'’.\-]*){0,3}?)\s+(?:[oOuU]?\d|ATD|anytime|1st|first|2\+|3\+|to\b|over|under|OVER|UNDER|rush|rec|pass|tackles?|T\+A)", t)
    return m.group(1).strip() if m else None
def resolve(frag, teams):
    f = norm(frag); cands = [r for t in teams for r in BY_TEAM.get(t, [])]
    hit = [r for r in cands if norm(r['name']) == f]
    if hit: return hit
    m = re.match(r"^([A-Z])\.\s?([A-Za-z'’\- ]+)$", frag.strip())       # "D.Smith" / "G. Wilson"
    if m:
        ini, sur = m.group(1).lower(), norm(m.group(2)).split()[-1]
        return [r for r in cands if norm(r['name']).split()[-1] == sur and norm(r['name'])[0] == ini]
    parts = f.split()
    if len(parts) == 1:                                                # surname or first-name-only ("Tuten", "Lamar", "Puka")
        return [r for r in cands if norm(r['name']).split()[-1] == parts[0]] or [r for r in cands if norm(r['name']).split()[0] == parts[0]]
    return [r for r in cands if norm(r['name']).split()[-1] == parts[-1] and norm(r['name']).split()[0].startswith(parts[0][:3])]
LEGS = collections.Counter()
# latest injury status per (team, player) from the availability snapshot
RULED_OUT = {'OUT', 'IR', 'PUP', 'SUSPENSION', 'SUSPENDED'}
STATUS, _st_t = {}, {}
for e in (J('data/player-availability/latest.json', {}) or {}).get('events', []):
    k = (fx(e.get('team_abbr')), norm(e.get('player_name') or '')); t = e.get('published_at') or ''
    ns = str(e.get('normalized_status') or '').upper()
    if ns in ('', 'NONE', 'UNKNOWN'): continue
    if k not in _st_t or t > _st_t[k]: _st_t[k] = t; STATUS[k] = ns
def check_leg(section, frag, teams, ctx):
    LEGS[section] += 1
    hits = resolve(frag, teams)
    if not hits:
        league = [r for r in R.get(norm(frag), [])] or [r for rs in R.values() for r in rs if norm(r['name']).split()[-1] == norm(frag).split()[-1]][:4]
        add(section, 'MISMATCH' if league else 'UNVERIFIED', frag, teams, {f"{r['name']} {r['team']}" for r in league}, ctx); return
    active = [r for r in hits if r['group'] in ('offense', 'defense', 'specialTeam')]
    if not active:
        add(section, 'NOT_ACTIVE', frag, teams, {f"{r['name']} {r['team']}/{r['group']}" for r in hits}, ctx); return
    st = {STATUS.get((r['team'], norm(r['name']))) for r in active} - {None}
    if st and st <= RULED_OUT: add(section, 'RULED_OUT', frag, teams, {f"{r['name']} {r['team']} {'/'.join(st)}" for r in active}, ctx)
    elif st & {'DOUBTFUL', 'QUESTIONABLE'}: add(section + '-warnings', 'QUESTIONABLE' if 'QUESTIONABLE' in st else 'DOUBTFUL', frag, teams, {f"{r['name']} {r['team']}" for r in active}, ctx)

def table_rows(text):
    for ln in text.splitlines():
        c = [x.strip() for x in ln.strip().strip('|').split('|')]
        if len(c) >= 3:
            g = GAME_RE.search(c[0])
            if g: yield {fx(g.group(1)), fx(g.group(2))}, c, ln
# 1. card legs
card_p = pathlib.Path(a.card) if a.card else ROOT / f'reports/bets/{a.season}-w{WW}-card.md'
if card_p.exists():
    seen = set()
    for teams, c, ln in table_rows(card_p.read_text(encoding='utf-8')):
        p = leg_player(c[1])
        if p and (p, tuple(sorted(teams))) not in seen:
            seen.add((p, tuple(sorted(teams)))); check_leg('card', p, teams, ln[:140])
        for n in NAME_RE.findall(ln): chk('card', n, teams, ln[:140])
else: add('card', 'INFO', '(no card file yet)', [], None, str(card_p))
# 2. synthesis digest legs
dg = [pathlib.Path(a.digest)] if a.digest else [ROOT / f'scratch/w{WW}-synthesis-digest-sat.md', ROOT / f'scratch/w{WW}-synthesis-digest.md']
dg = next((p for p in dg if p.exists()), None)
if dg:
    for teams, c, ln in table_rows(dg.read_text(encoding='utf-8')):
        p = leg_player(c[1])
        if p: check_leg('digest', p, teams, ln[:140])
        for n in NAME_RE.findall(ln): chk('digest', n, teams, ln[:140])
# 3. narratives: every capitalized name is either a 2026 roster player (then team-checked), a listed
#    non-player (data/nfl-rosters/non-player-names.json + this week's expert/source names), or it BLOCKS.
NP = J('data/nfl-rosters/non-player-names.json', {}) or {}
ALLOW = {norm(x) for k, v in NP.items() if isinstance(v, list) for x in v}
pull_ = J(f'data/generated/master-intel/w{WW}-pull.json', {}) or {}
for x in pull_.get('expert', []) + pull_.get('signals', []): ALLOW |= {norm(str(x.get(k) or '')) for k in ('expert', 'author', 'source')}
for x in (J(f'data/podcasts/youtube-extracted-picks-{a.season}-w{WW}.json', {}) or {}).get('picks', []): ALLOW.add(norm(x.get('speaker') or ''))
PLACES = {'New England', 'New Orleans', 'New York', 'Kansas City', 'San Francisco', 'Tampa Bay', 'Green Bay', 'Las Vegas', 'Los Angeles'}
ALLOW |= {norm(x) for x in PLACES} | {norm(x) for x in NICK}
LEAD = {'The', 'If', 'In', 'Or', 'Expect', 'And', 'But', 'So', 'When', 'With', 'Also', 'Both', 'Only', 'Then', 'While', 'Until', 'After', 'Before'}
W_ = r"(?:Mc[A-Z][a-z]+|[A-Z]\.[A-Z]\.|[A-Z][a-z]*(?:['’\-][A-Za-z][a-z]+)+|[A-Z][a-z]+(?:[A-Z][a-z]+)*)"
CAND = re.compile(rf"(?<![\w.'’])({W_}(?:[ \-](?:St\.|Jr\.?|Sr\.?|III|II|IV|{W_}))+)")
def names_in(text):
    text = re.sub(r"(['’])s\b", ", ", text)          # possessives end a name ("Even Money's Fezzik" -> "Even Money", "Fezzik")
    for m in CAND.finditer(text):
        w = m.group(1).split()
        while w and w[0] in LEAD: w = w[1:]
        if len(w) < 2: continue
        yield ' '.join(w), m.start()
nar = pathlib.Path(a.narratives) if a.narratives else ROOT / f'reports/intel/master-intel-narratives-{a.season}-w{WW}.md'
if nar.exists():
    for b in re.split(r'^## ', re.sub(r'<!--.*?-->', '', nar.read_text(encoding='utf-8'), flags=re.S), flags=re.M)[1:]:
        head = b.split('\n', 1)[0].strip()
        g = GAME_RE.search(head)
        if not g: continue
        teams = {fx(g.group(1)), fx(g.group(2))}
        for n, pos in names_in(b):
            ctx = f"{head}: …{b[max(0, pos-60):pos+len(n)+30]}…".replace('\n', ' ')
            k = norm(n)
            if k in R: chk('narratives', R[k][0]['name'], teams, ctx)
            elif k in ALLOW or any(k.startswith(x + ' ') or k.endswith(' ' + x) for x in ALLOW if x): continue
            else: add('narratives', 'UNKNOWN_NAME', n, teams, None, ctx + '  (not on any 2026 roster; if not a player, add to data/nfl-rosters/non-player-names.json)')
# 4. matchup seeds + snapshot targets/absences
for f in ('receiver-roles-2026.json', 'secondary-roles-2026.json'):
    for x in J(f'data/secondary-matchups/manual/{f}', []): chk(f'seed:{f}', x['player_name'], {fx(x['team'])})
for m in (J('data/secondary-matchups/latest.json', {}) or {}).get('matchups', []):
    for p in m.get('target_receivers') or []: chk('secondary-matchups:targets', p['player_name'], {fx(m['offense_team'])}, m['game_id'])
    for p in m.get('secondary_absences') or []: chk('secondary-matchups:absences', p['player_name'], {fx(p.get('team') or m['defense_team'])}, m['game_id'])
# 5. expert + YouTube picks
for x in (J(f'data/generated/master-intel/w{WW}-pull.json', {}) or {}).get('expert', []):
    g = {team_from_full(x.get('visitor')), team_from_full(x.get('home'))}
    for n in set(NAME_RE.findall(x.get('selection') or '')): chk('pull:expert-picks', n, g, f"{x.get('expert')}: {(x.get('selection') or '')[:70]}")
for x in (J(f'data/podcasts/youtube-extracted-picks-{a.season}-w{WW}.json', {}) or {}).get('picks', []):
    rw = x.get('raw') or {}
    if rw.get('player'):
        g = GAME_RE.search(x.get('game') or '')
        claimed = {fx(rw['team'])} if rw.get('team') else ({fx(g.group(1)), fx(g.group(2))} if g else set())
        chk('youtube-picks', rw['player'], claimed, f"{x.get('speaker')}: {x.get('pick')} [{x.get('game')}]")
# 6. info only: sportsbook boards, roster map
for f, key in ((f'data/generated/props/bookmaker-live-{a.date}-week{a.week}.json', 'rows'), (f'data/generated/props/beo-w{WW}.json', None)):
    d = J(f); rows = (d or {}).get(key, []) if key else (d or []); seen = set()
    for r in rows:
        p = r.get('player') or r.get('player_name'); ev = r.get('event') or r.get('game') or ''
        if not p or (p, ev) in seen or re.search(r'Defense|No Touchdown', p): continue
        seen.add((p, ev)); chk(f'book-props:{pathlib.Path(f).name}', p, {team_from_full(s) for s in re.split(r' @ | vs\.? | at |_', ev)}, ev)
for n, v in ((J('data/nfl-rosters/roster-map-latest.json', {}) or {}).get('players') or {}).items(): chk('roster-map-latest', n, {fx(v['team'])})

block = []
if AGE > a.max_age_h: block.append(('roster-snapshot', 'STALE', f'{AGE:.0f}h old', [], '-', 'python3 scripts/nfl-rosters/fetch_espn_rosters.py (or --fetch)'))
for sec, rows in out.items():
    if sec in BLOCKING: block += [(sec,) + r for r in rows if r[0] != 'INFO']
tot = collections.Counter(r[0] for rows in out.values() for r in rows)
if not a.quiet:
    for sec, rows in out.items():
        bad = [r for r in rows if r[0] != 'INFO']
        if not bad: continue
        print(f"\n== {sec}: {len(bad)} issue(s){'  [BLOCKING]' if sec in BLOCKING else '  [info only]'}")
        for r in bad[:60]: print(f'  {r[0]:14s} {r[1]:26s} claimed {r[2]}  roster {r[3]}  {r[4][:150]}')
status = 'BLOCK' if block else 'PASS'
json.dump({'week': a.week, 'status': status, 'roster_source': E['generated_at'], 'roster_age_h': round(AGE, 1), 'totals': tot,
           'blocking': block, 'sections': out}, open(ROOT / f'data/generated/master-intel/w{WW}-roster-vet.json', 'w'), indent=1, default=list)
print(f"\nROSTER VET: {status} - {len(block)} blocking issue(s); player legs resolved: card {LEGS['card']}, digest {LEGS['digest']}; ESPN rosters {E['generated_at'][:16]}Z ({AGE:.1f}h old, {E['player_count']} players)")
if a.strict and block: sys.exit(1)
