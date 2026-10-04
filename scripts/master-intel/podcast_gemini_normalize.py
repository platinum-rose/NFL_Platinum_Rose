#!/usr/bin/env python3
"""scripts/master-intel/podcast_gemini_normalize.py

Normalize the week's promoted Gemini podcast picks (Supabase podcast_gemini_intel,
read-only GET) and screen the player props against the saved BKR / BEO boards.

  python scripts/master-intel/podcast_gemini_normalize.py --week 4 --since 2026-09-28 \
      --bkr data/generated/props/bookmaker-live-2026-10-03-week4.json \
      --beo data/generated/props/beo-w04.json [--from-file rows.json]

Writes:
  data/generated/master-intel/w{NN}-podcast-gemini-normalized.json
  reports/intel/podcast-gemini-props-screen-2026-w{NN}.md

Fixes applied (Gemini's raw rows are never edited):
  * a prop's game comes from the player's ESPN roster team, not Gemini's team field
  * spread/total sides coded OVER/UNDER/FAVORITE are re-read from the rationale
  * college picks (non-NFL team codes) are dropped; unknown players are quarantined
  * escalator ladders (same speaker/player/market) are grouped under the lowest rung
No Supabase writes. No sportsbook access: prices come from the saved board files.
"""
import argparse, collections, json, math, os, re, sys, unicodedata, urllib.request, urllib.parse, pathlib, datetime

ROOT = pathlib.Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument('--week', type=int, required=True)
ap.add_argument('--since', required=True, help='created_at lower bound (YYYY-MM-DD)')
ap.add_argument('--bkr', required=True); ap.add_argument('--beo', required=True)
ap.add_argument('--card', default=None); ap.add_argument('--from-file', default=None)
a = ap.parse_args()
WK = f'{a.week:02d}'

NICK = {'PIT':'steelers|pittsburgh','CLE':'browns|cleveland','IND':'colts|indianapolis','WSH':'commanders|washington','NE':'patriots|new england','BUF':'bills|buffalo','NYJ':'jets','CHI':'bears|chicago','JAX':'jaguars|jags|jacksonville','CIN':'bengals|cincinnati','ARI':'cardinals|arizona','NYG':'giants','LAR':'rams','PHI':'eagles|philly|philadelphia','GB':'packers|green bay','TB':'bucs|buccaneers|tampa','TEN':'titans|tennessee','BAL':'ravens|baltimore','DAL':'cowboys|dallas','HOU':'texans|houston','MIA':'dolphins|miami','MIN':'vikings|minnesota','KC':'chiefs|kansas city','LV':'raiders|las vegas','DEN':'broncos|denver','SF':'49ers|niners|san francisco','LAC':'chargers','SEA':'seahawks|seattle','DET':'lions|detroit','CAR':'panthers|carolina','ATL':'falcons|atlanta','NO':'saints|new orleans'}
ALIAS = {'WAS':'WSH','LVR':'LV','NOS':'NO','LA':'LAR','JAC':'JAX','OAK':'LV','JETS':'NYJ','COWBOYS':'DAL','EAGLES':'PHI','CHARGERS':'LAC','TITANS':'TEN'}
def team(t):
    t = (t or '').upper().strip(); return ALIAS.get(t, t)

def norm_name(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'\b(jr|sr|ii|iii|iv)\b\.?', '', s)
    return re.sub(r'[^a-z]', '', s)

def implied(o):
    if o is None: return None
    o = float(o); return -o / (-o + 100) if o < 0 else 100 / (o + 100)

# ── inputs ──────────────────────────────────────────────────────────────────
def load_env():
    env = {}
    p = ROOT / '.env'
    if p.exists():
        for line in p.read_text(encoding='utf-8', errors='ignore').splitlines():
            m = re.match(r'\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$', line)
            if m: env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    env.update({k: v for k, v in os.environ.items() if 'SUPABASE' in k})
    return env

def fetch_rows():
    if a.from_file: return json.load(open(a.from_file, encoding='utf-8'))
    env = load_env()
    url = env.get('SUPABASE_URL') or env.get('VITE_SUPABASE_URL')
    key = env.get('SUPABASE_SERVICE_ROLE_KEY') or env.get('VITE_SUPABASE_ANON_KEY')
    if not url or not key: sys.exit('SUPABASE_URL / key missing (or pass --from-file)')
    q = urllib.parse.urlencode({'select': '*', 'promoted_at': 'not.is.null', 'created_at': f'gte.{a.since}', 'order': 'created_at.desc'})
    req = urllib.request.Request(f'{url}/rest/v1/podcast_gemini_intel?{q}', headers={'apikey': key, 'Authorization': f'Bearer {key}'})
    with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)

rows = fetch_rows()
R = json.load(open(ROOT / 'data/nfl-rosters/espn-full-rosters-latest.json', encoding='utf-8'))
roster = {}
for name, entries in R['players'].items():
    for e in entries: roster.setdefault(norm_name(name), []).append(e['team'])
roster_asof = R.get('generated_at')

# Week games from the BKR game lines (away @ home).
bkr = json.load(open(a.bkr, encoding='utf-8'))
FULL = {}
for ab, rx in NICK.items():
    for w in rx.split('|'): FULL[w] = ab
def full_to_ab(name):
    n = name.lower()
    for w, ab in sorted(FULL.items(), key=lambda x: -len(x[0])):
        if w in n: return ab
    return None
games = {}
for r in bkr['rows']:
    if r['market'] == 'game_lines':
        aw, hm = r['event'].split(' @ ')
        g = f'{full_to_ab(aw)}@{full_to_ab(hm)}'; games[g] = (full_to_ab(aw), full_to_ab(hm))
fav = {}
for r in bkr['rows']:
    if r['market'] == 'game_lines' and r.get('bet') == 'spread' and r.get('line') is not None and r['line'] < 0:
        aw, hm = r['event'].split(' @ '); fav[f'{full_to_ab(aw)}@{full_to_ab(hm)}'] = full_to_ab(r['side'])
extra = ['PIT@CLE'] if a.week == 4 else []
if a.week == 4: fav['PIT@CLE'] = 'PIT'
for g in extra: games[g] = tuple(g.split('@'))
team_game = {t: g for g, (x, y) in games.items() for t in (x, y)}

# Price boards: (game, player_norm, market) -> {threshold: odds}
beo_rows = json.load(open(a.beo, encoding='utf-8'))
BEO_MK = {'atd': 'atd', 'first_td': 'first_td', 'rec_yds': 'rec_yds', 'rec': 'rec', 'rush_yds': 'rush_yds', 'carries': 'carries', 'pass_att': 'pass_att', 'pass_yds': 'pass_yds', 'pass_td': 'pass_td', 'pass_cmp': 'pass_cmp', 'pass_int': 'pass_int'}
board = collections.defaultdict(lambda: collections.defaultdict(dict))
for r in beo_rows:
    mk = r['market']; thr = r.get('line')
    if mk == 'atd': mk, thr = {1.0: 'atd1', 2.0: 'atd2', 3.0: 'atd3'}.get(thr, 'atd?'), None
    board[(norm_name(r['player']), mk)]['BEO'][thr] = r['odds']
BKR_MK = {'atd_1_plus': 'atd1', 'td_2_plus': 'atd2', 'td_3_plus': 'atd3', 'first_td': 'first_td', 'rec_yds': 'rec_yds', 'rec': 'rec', 'rush_yds': 'rush_yds', 'carries': 'carries', 'pass_yds': 'pass_yds', 'pass_td': 'pass_td', 'pass_cmp': 'pass_cmp'}
bkr_capt = {}
for r in bkr['rows']:
    mk = BKR_MK.get(r['market'])
    if not mk or not r.get('player'): continue
    if not r.get('available') or r.get('odds') is None: continue
    thr = None if mk in ('atd1', 'atd2', 'atd3', 'first_td') else (math.floor(r['line']) + 1 if r.get('line') is not None else None)
    board[(norm_name(r['player']), mk)]['BKR'][thr] = r['odds']
    bkr_capt[(norm_name(r['player']), mk)] = r.get('capturedAt')

MARKET = {
    'anytime_touchdown': 'atd1', 'anytime_touchdown_scorer': 'atd1', '2_touchdowns': 'atd2',
    'first_touchdown_scorer': 'first_td', 'season_receiving_yards': 'rec_yds', 'receiving_yards': 'rec_yds',
    'player_receptions': 'rec', 'receptions': 'rec', 'over_under_receptions': 'rec',
    'player_rushing_yards': 'rush_yds', 'rushing_yards': 'rush_yds', 'player_rushing_attempts': 'carries',
    'pass_attempts': 'pass_att', 'season_passing_yards': 'pass_yds',
}
LABEL = {'atd1': 'anytime TD', 'atd2': '2+ TD', 'atd3': '3+ TD', 'first_td': 'first TD', 'rec_yds': 'receiving yds', 'rec': 'receptions',
         'rush_yds': 'rushing yds', 'carries': 'carries', 'pass_att': 'pass attempts', 'pass_yds': 'passing yds'}

def price_for(pn, mk, line, direction):
    """Best saved price for the expert's exact threshold; ladders are 'N or more'."""
    out = {}
    b = board.get((pn, mk))
    if not b: return out
    if mk in ('atd1', 'atd2', 'atd3', 'first_td'):
        for book, d in b.items():
            if None in d: out[book] = {'threshold': None, 'odds': d[None]}
        return out
    if line is None or direction != 'OVER': return out
    need = math.floor(float(line)) + 1 if float(line) != int(float(line)) else int(float(line))
    for book, d in b.items():
        cands = sorted(t for t in d if t is not None and t >= need)
        if cands: out[book] = {'threshold': cands[0], 'odds': d[cands[0]], 'exact': cands[0] == need}
    return out

# ── normalize ───────────────────────────────────────────────────────────────
norm, issues = [], collections.Counter()
for row in rows:
    vp = (row.get('vault_paths') or [''])[0]
    parts = vp.split('/')
    show = parts[2] if len(parts) > 2 else '?'
    for p in row.get('picks') or []:
        spk = (p.get('speaker') or '?').replace('Fezik', 'Fezzik')
        raw_mk = (p.get('market') or '').lower()
        rec = {'episode_id': row['episode_id'], 'show': show, 'speaker': spk, 'raw_market': raw_mk, 'raw_team': p.get('team'),
               'raw_side': p.get('side'), 'line': p.get('line'), 'price': p.get('price'), 'player': p.get('player'),
               'rationale': p.get('rationale'), 'source_timestamp': p.get('source_timestamp'), 'flags': []}
        t = team(p.get('team'))
        if p.get('player'):
            pn = norm_name(p['player']); teams = roster.get(pn)
            if not teams:
                rec.update(kind='prop', status='quarantine'); rec['flags'].append('player not on any ESPN 2026 roster'); issues['unknown_player'] += 1
                norm.append(rec); continue
            pt = teams[0]; g = team_game.get(pt)
            rec.update(kind='prop', player_team=pt, game=g)
            if g and t and t in NICK and team_game.get(t) != g:
                rec['flags'].append(f'Gemini game was {team_game.get(t)}; roster puts {p["player"]} on {pt}'); issues['game_remapped'] += 1
            mk = MARKET.get(raw_mk)
            side = str(p.get('side') or '').upper()
            direction = 'OVER' if side in ('OVER', 'YES') else 'UNDER' if side == 'UNDER' else side
            rec.update(market=mk, direction=direction, status='ok' if mk and g else 'unpriced_market' if g else 'no_game')
            if raw_mk == 'season_receiving_yards': rec['flags'].append('market label says season; this is a single-game line')
            norm.append(rec); continue
        if t and t not in NICK:
            rec.update(kind='other', status='dropped'); rec['flags'].append(f'non-NFL team code {t} (college)'); issues['college'] += 1
            norm.append(rec); continue
        g = team_game.get(t)
        if raw_mk == 'prop' and t not in NICK:
            rec.update(kind='other', status='dropped'); rec['flags'].append('game special (team field UNK)'); norm.append(rec); continue
        SIDE_MK = {'teaser': 'teaser', 'lean': 'lean', 'contest_pick': 'contest', 'pickem_pick': 'contest'}
        if raw_mk in SIDE_MK and g:
            rec.update(kind='side', game=g, market=SIDE_MK[raw_mk], pick=t, status='ok'); norm.append(rec); continue
        if raw_mk in ('spread', 'moneyline', 'total') and g:
            side = team(p.get('side'))
            if raw_mk == 'total':
                rec.update(kind='total', game=g, pick=str(p.get('side')).upper(), status='ok')
            else:
                if side not in NICK:
                    aw, hm = games[g]; ln = p.get('line'); f = fav.get(g)
                    if ln is not None and f and float(ln) != 0:
                        side = f if float(ln) < 0 else (hm if f == aw else aw); how = f'line {ln:+g}'
                    else:
                        rt = (p.get('rationale') or '').lower()
                        hit = [x for x in (aw, hm) if re.search(NICK[x], rt)]
                        side = hit[0] if len(hit) == 1 else None; how = 'rationale'
                    rec['flags'].append(f'side coded {p.get("side")!r}; read from {how} -> {side or "?"}'); issues['side_recoded'] += 1
                rec.update(kind='side', game=g, market=raw_mk, pick=side, status='ok' if side else 'ambiguous')
            norm.append(rec); continue
        rec.update(kind='other', game=g, status='not_screened'); norm.append(rec)

# ladders: same speaker/player/market/direction -> keep lowest threshold as primary
grp = collections.defaultdict(list)
for r in norm:
    if r['kind'] == 'prop' and r['status'] == 'ok' and r['line'] is not None:
        grp[(r['speaker'], r['player'], r['market'], r['direction'])].append(r)
for k, lst in grp.items():
    if len(lst) > 1:
        lst.sort(key=lambda r: float(r['line']))
        for r in lst[1:]: r['ladder_of'] = lst[0]['line']; r['status'] = 'ladder_rung'

# card overlap
card_txt = pathlib.Path(a.card or ROOT / f'reports/bets/2026-w{WK}-card.md').read_text(encoding='utf-8')
def on_card(player):
    last = player.split()[-1]
    hits = [ln for ln in card_txt.splitlines() if ln.startswith('|') and player in ln]
    tickets, cur = [], None
    for ln in card_txt.splitlines():
        if ln.startswith('### '): cur = ln[4:].split(' — ')[0]
        elif ln.startswith('|') and cur:
            cells = [c.strip() for c in ln.strip('|').split('|')]
            if len(cells) > 1 and player in cells[1]: tickets.append(cur)
    return sorted(set(tickets))

for r in norm:
    if r['kind'] == 'prop' and r['status'] in ('ok', 'ladder_rung'):
        pr = price_for(norm_name(r['player']), r['market'], r['line'], r['direction'])
        r['board'] = pr
        if pr:
            best = min(pr.items(), key=lambda kv: (kv[1].get('threshold') or 0, -kv[1]['odds']))
            r['best'] = {'book': best[0], **best[1], 'implied': round(implied(best[1]['odds']), 3)}
        r['card_tickets'] = on_card(r['player'])

# alignments: distinct speakers on the same player/market/direction
al = collections.defaultdict(lambda: {'speakers': set(), 'rows': []})
for r in norm:
    if r['kind'] == 'prop' and r['status'] == 'ok':
        fam = 'td' if r['market'] in ('atd1', 'atd2', 'first_td') else r['market']
        k = (r['game'], r['player'], r['player_team'], fam, r['direction'])
        al[k]['speakers'].add(r['speaker']); al[k]['rows'].append(r)
# cross-market player support (yards + receptions + TD all "up")
player_up = collections.defaultdict(set)
for (g, pl, pt, fam, d), v in al.items():
    if d in ('OVER', 'YES'): player_up[(g, pl, pt)] |= v['speakers']

out = {
    'schema': 'podcast_gemini_normalized_v1', 'season': 2026, 'week': a.week,
    'generated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
    'source': 'supabase:podcast_gemini_intel (promoted, read-only)', 'episodes': len(rows),
    'roster_asof': roster_asof, 'boards': {'bkr': a.bkr, 'beo': a.beo},
    'counts': dict(collections.Counter(f"{r['kind']}:{r['status']}" for r in norm)), 'issues': dict(issues),
    'picks': norm,
}
op = ROOT / f'data/generated/master-intel/w{WK}-podcast-gemini-normalized.json'
op.write_text(json.dumps(out, indent=1, default=list) + '\n', encoding='utf-8')

# ── report ──────────────────────────────────────────────────────────────────
def fmt(o): return '—' if o is None else (f'+{o}' if o > 0 else str(o))
L = [f'# Week {a.week} podcast props screen (Gemini, {len(rows)} episodes)', '',
     f'Generated {out["generated_at"]} by `scripts/master-intel/podcast_gemini_normalize.py`. Prices: BEO `{os.path.basename(a.beo)}` (Fri 10/02) and BKR `{os.path.basename(a.bkr)}` (Sat 10/03; BKR props are same-game only, unpriced rows skipped). Ladders are "N or more": over 62.5 = 63+. Teams from ESPN rosters ({roster_asof}). **Read-only; confirm every price on the slip.**', '',
     '## Player support across markets (2+ distinct podcast voices, any "over"/TD market)', '',
     '| Game | Player (team) | Voices | Picks | On card |', '|---|---|---|---|---|']
multi = sorted(((k, v) for k, v in player_up.items() if len(v) >= 2), key=lambda x: (-len(x[1]), x[0][0]))
for (g, pl, pt), sp in multi:
    picks = []
    for (g2, pl2, pt2, fam, d), v in al.items():
        if pl2 != pl or d not in ('OVER', 'YES'): continue
        for r in v['rows']:
            lab = LABEL.get(r['market'], r['market']) + (f' o{r["line"]}' if r['line'] is not None else '')
            bp = r.get('best'); bps = f" — best {bp['book']} {fmt(bp['odds'])}" + (f" at {bp['threshold']}+" if bp.get('threshold') else '') if bp else ' — no saved price'
            picks.append(f"{r['speaker']}: {lab}{bps}")
    tk = sorted({t for (g2, pl2, *_), v in al.items() if pl2 == pl for r in v['rows'] for t in r.get('card_tickets', [])})
    L.append(f"| {g} | {pl} ({pt}) | {len(sp)} | {'<br>'.join(picks)} | {', '.join(tk) or '—'} |")
L += ['', '## Game sides (distinct podcast voices; spread/ML/teaser/lean/contest picks)', '', '| Game | Side A | Side B | Totals |', '|---|---|---|---|']
for g in sorted(games, key=lambda x: x):
    by = collections.defaultdict(set); tots = collections.defaultdict(set)
    for r in norm:
        if r.get('game') != g or r['status'] != 'ok': continue
        if r['kind'] == 'side' and r.get('pick'): by[r['pick']].add(f"{r['speaker']}{'' if r['market'] in ('spread','moneyline') else ' ('+r['market']+')'}")
        if r['kind'] == 'total': tots[r['pick']].add(r['speaker'])
    if not by and not tots: continue
    aw, hm = games[g]
    cell = lambda t: f"**{t} {len(by[t])}**: " + ', '.join(sorted(by[t])) if by[t] else f'{t} 0'
    L.append(f"| {g} | {cell(aw)} | {cell(hm)} | {'; '.join(f'{k} {len(v)}: ' + ', '.join(sorted(v)) for k, v in tots.items()) or '—'} |")
L += ['', '## Every screened prop pick', '', '| Game | Speaker | Player (team) | Market | Expert price | Saved prices | Implied (lowest rung) | On card | Flags |', '|---|---|---|---|---|---|---|---|---|']
for r in sorted((r for r in norm if r['kind'] == 'prop' and r['status'] == 'ok'), key=lambda r: (r['game'] or '', r['player'])):
    lab = LABEL.get(r['market'], r['market']) + (f" {'o' if r['direction']=='OVER' else 'u' if r['direction']=='UNDER' else ''}{r['line']}" if r['line'] is not None else '')
    bp = r.get('best')
    bps = ' / '.join(f"{bk} {fmt(v['odds'])}" + (f" ({v['threshold']}+{'' if v.get('exact') else ' next rung'})" if v.get('threshold') else '') for bk, v in sorted(r['board'].items())) if r.get('board') else ('under: ladders are overs only' if r['direction'] == 'UNDER' else 'not on saved boards')
    L.append(f"| {r['game']} | {r['speaker']} | {r['player']} ({r['player_team']}) | {lab} | {fmt(r['price'])} | {bps} | {bp['implied'] if bp else '—'} | {', '.join(r.get('card_tickets') or []) or '—'} | {'; '.join(r['flags']) or ''} |")
lad = [r for r in norm if r.get('status') == 'ladder_rung']
if lad:
    L += ['', f'Escalator rungs grouped under their first rung: ' + '; '.join(sorted({f"{r['speaker']} {r['player']} {LABEL.get(r['market'])} (from o{r['ladder_of']})" for r in lad}))]
L += ['', '## Rows set aside', '']
for r in norm:
    if r['status'] in ('quarantine', 'dropped', 'no_game', 'unpriced_market', 'ambiguous'):
        L.append(f"- {r['status']}: {r['show']} / {r['speaker']} — {r.get('player') or r.get('raw_team')} {r['raw_market']} {r.get('raw_side')} {r.get('line')} — {'; '.join(r['flags'])}")
L += ['', '## Game-line picks re-coded from the rationale', '']
for r in norm:
    if r['kind'] == 'side' and r['flags']:
        L.append(f"- {r['game']} {r['speaker']} ({r['show']}): {'; '.join(r['flags'])}")
for r in norm:
    if r['kind'] == 'prop' and any('Gemini game was' in f for f in r['flags']):
        L.append(f"- {r['speaker']} {r['player']}: {[f for f in r['flags'] if 'Gemini game' in f][0]}")
rp = ROOT / f'reports/intel/podcast-gemini-props-screen-2026-w{WK}.md'
rp.write_text('\n'.join(L) + '\n', encoding='utf-8')
print(json.dumps({'episodes': len(rows), 'counts': out['counts'], 'issues': out['issues'], 'multi_voice_players': len(multi)}, indent=1))
print('wrote', op.relative_to(ROOT), rp.relative_to(ROOT))
