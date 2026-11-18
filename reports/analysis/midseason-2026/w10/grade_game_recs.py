"""Grade the per-game synthesis recommendations (data/research-intel/proposed/games-wNN/*.json; W7, W8, W10 have the
structured schema with tier / model_prob / price) against cached ESPN box scores. Read-only on inputs.
Output: w10/game_recs_graded.jsonl. Run from repo root."""
import json, glob, os, re, sys, collections
sys.path.insert(0, 'reports/analysis/season/claude/scripts')
import lib
G = lib.load_games()
STAT = [(r'tackles?\s*\+\s*assists?|tkl\+ast|tackles', 'tackles'), (r'receiving y|rec y', 'rec_yds'), (r'rushing y|rush y', 'rush_yds'),
        (r'rush\+rec|rushing \+ receiving', 'rush_rec_yds'), (r'receptions|catches', 'rec'), (r'passing y|pass y', 'pass_yds'),
        (r'passing td|pass td', 'pass_td'), (r'interception|\bint\b', 'int_thrown'), (r'completions', 'completions'), (r'pass(ing)? att', 'pass_att'),
        (r'carries|rush(ing)? att', 'carries'), (r'first td', 'first_td'), (r'2\+ ?td|two\+? td', 'tds'), (r'anytime td|\batd\b|touchdown', 'atd'),
        (r'sacks?', 'sacks'), (r'field goals?|\bfgs?\b', 'fgm'), (r'kicking p', 'kick_pts')]
def parse(r, game, wk):
    sel = r.get('selection') or ''; s = sel.lower(); m = r.get('market'); passed = str(r.get('tier')).upper().startswith('PASS') or s.startswith('pass')
    inner = re.sub(r'^pass\s*\(|\)\s*$', '', sel, flags=re.I) if s.startswith('pass') else sel
    il = inner.lower(); line = r.get('line'); price = r.get('price')
    n = dict(kind='prop', key=None, dir='over', need=None, line=None, player=None, team=None, game=game.replace('_at_', '@'), sel=inner, price=price, dec=lib.dec(price))
    try: line = float(line) if line is not None else None
    except (TypeError, ValueError): line = None
    if m in ('spread', 'moneyline', 'total'):
        if m == 'total' or re.search(r'\b(over|under)\b', il):
            dm = re.search(r'\b(over|under)\b\s*(\d+(?:\.\d+)?)?', il)
            if not dm: return None, passed
            n.update(kind='total', key='total', dir=dm.group(1), line=line if line is not None else (float(dm.group(2)) if dm.group(2) else None))
            return (n if n['line'] is not None else None), passed
        tm = re.match(r'\s*([A-Z]{2,3})\b\s*([+-]\d+(?:\.\d+)?|ML|PK)?', inner)
        if not tm: return None, passed
        n.update(team=lib.T(tm.group(1)))
        if m == 'moneyline' or tm.group(2) == 'ML': n.update(kind='ml', key='ml')
        else:
            ln = line if (line is not None and tm.group(2) in (None, 'PK')) else (0.0 if tm.group(2) in (None, 'PK') else float(tm.group(2)))
            n.update(kind='spread', key='spread', line=ln)
        return n, passed
    key = 'first_td' if m == 'first_td' else 'atd' if m == 'atd' else None
    pos = None
    for pat, k in STAT:
        mm = re.search(pat, il)
        if mm and (key is None or k == key or (key == 'atd' and k == 'tds')):
            if key is None or k in (key, 'tds'): key = k if not (key == 'atd' and k != 'tds') else key
            pos = mm.start() if pos is None else min(pos, mm.start())
            break
    if key is None: return None, passed
    dm = re.search(r'\b(over|under)\b', il); d = dm.group(1) if dm else 'over'
    cut = min(x for x in (pos, dm.start() if dm else None, len(inner)) if x is not None)
    player = re.sub(r'\s+(o|u)?\d+(\.\d+)?\+?\s*$', '', inner[:cut]).strip(' -:')
    plus = re.search(r'(?<![\d.+-])(\d+(?:\.\d+)?)\+', inner)
    num = re.search(r'\b(?:over|under)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:\(|$)', il)
    if line is None and plus is None and key not in ('atd', 'first_td', 'tds'):
        line = float(num.group(1) or num.group(2)) if num and (num.group(1) or num.group(2)) else None
        if line is None: return None, passed
    need = int(-(-float(plus.group(1)) // 1)) if plus else None
    if key == 'atd' and need is None: need = 1
    if key == 'tds' and need is None: need = 2
    if key == 'atd' and need and need >= 2: key = 'tds'
    n.update(key=key, dir=d, line=line, need=need if d != 'under' else None, player=player)
    return (n if player else None), passed
rows = []
for f in sorted(glob.glob('data/research-intel/proposed/games-w*/2026-w*-game-*.json')):
    wk = int(re.search(r'games-w(\d+)', f).group(1)); j = json.load(open(f))
    if not isinstance(j, dict): continue
    gm = re.search(r'game-([A-Z]+_at_[A-Z]+)', f).group(1)
    for i, r in enumerate(j.get('recommendations') or []):
        n, passed = parse(r, gm, wk)
        st, txt = (None, 'unparsed')
        if n:
            g = lib.game_for(G, wk, n['game'])
            st, txt, _ = lib.grade(n, g)
            if st == 'LOST' and str(txt).startswith('not in box'): st, txt = 'VOID', 'player absent'
        rows.append(dict(week=wk, file=os.path.basename(f), pass_kind=j.get('pass'), generated_at=j.get('generated_at'), game=gm, market=r.get('market'), selection=r.get('selection'),
                         key=n and n['key'], dir=n and n['dir'], line=n and n['line'], price=r.get('price'), tier=str(r.get('tier')), passed=passed,
                         model_prob=r.get('model_prob'), edge_pts=r.get('edge_pts'), fair_line=r.get('fair_line'), parlay_leg_ok=r.get('parlay_leg_ok'),
                         standalone_preferred=r.get('standalone_preferred'), sc=r.get('supercontest_candidate'), reasons=r.get('reasons'),
                         result={'WON': 'W', 'LOST': 'L', 'PUSH': 'P', 'VOID': 'V'}.get(st, 'U'), actual=txt))
with open('reports/analysis/midseason-2026/w10/game_recs_graded.jsonl', 'w') as f:
    for r in rows: f.write(json.dumps(r) + '\n')
c = collections.Counter((r['week'], r['result']) for r in rows); print(len(rows), sorted(c.items()))
u = [r for r in rows if r['result'] == 'U']; print('ungradable examples:')
for r in u[:14]: print('  ', r['week'], r['market'], '|', r['selection'], '|', r['actual'])
import random; random.seed(3)
for r in random.sample([r for r in rows if r['result'] in 'WL'], 14): print('  chk', r['week'], r['game'], '|', r['selection'], '|', r['key'], r['dir'], r['line'], '->', r['result'], r['actual'])
