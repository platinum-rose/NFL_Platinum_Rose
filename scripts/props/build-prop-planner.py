#!/usr/bin/env python3
"""Build a single-game Player Prop Parlay Planner (the Alejandro planner) from pasted BEO and BKR boards.

Read-only: parses board text already saved in docs/Player_Prop_Odds_Weekly/, fetches nothing, places nothing.
Template: reports/analysis/w1-3-deep/codex/player-prop-parlay-planner-alejandro.html (Codex, PIT@CLE).
The template's embedded PIT@CLE compact block is swapped for a JSON block of every selection, tagged by book.

Usage:
  python3 scripts/props/build-prop-planner.py --game "ATL @ NO" --captured "2026-10-05 ~12:10 PT" \
     --beo docs/Player_Prop_Odds_Weekly/Week4/BEO_Week4_ATL_NOS_v3 \
     --bkr docs/Player_Prop_Odds_Weekly/Week4/BKR_Week4_ATL_NOS \
     --out reports/analysis/prop-planner/player-prop-parlay-planner-2026-w04-atl-no.html \
     --experts data/generated/master-intel/w04-expert-verified.json

--experts (optional) loads the week's verified expert player-prop picks for this game into an "Expert picks" panel.
Each pick is matched to the closest captured BEO/BKR leg (with a note when the line has moved) and gets an
Add button. Player picks pass the roster gate (ESPN full rosters + availability, same rules as
scripts/nfl-rosters/roster_vet.py); a player who fails it gets no Add button.
"""
import argparse, json, re, subprocess, sys, tempfile, shutil, pathlib, html, math

ROOT = pathlib.Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / 'reports/analysis/w1-3-deep/codex/player-prop-parlay-planner-alejandro.html'
ABBR = {'Arizona Cardinals':'ARI','Atlanta Falcons':'ATL','Baltimore Ravens':'BAL','Buffalo Bills':'BUF','Carolina Panthers':'CAR','Chicago Bears':'CHI',
 'Cincinnati Bengals':'CIN','Cleveland Browns':'CLE','Dallas Cowboys':'DAL','Denver Broncos':'DEN','Detroit Lions':'DET','Green Bay Packers':'GB',
 'Houston Texans':'HOU','Indianapolis Colts':'IND','Jacksonville Jaguars':'JAX','Kansas City Chiefs':'KC','Las Vegas Raiders':'LV','Los Angeles Chargers':'LAC',
 'Los Angeles Rams':'LAR','Miami Dolphins':'MIA','Minnesota Vikings':'MIN','New England Patriots':'NE','New Orleans Saints':'NO','New York Giants':'NYG',
 'New York Jets':'NYJ','Philadelphia Eagles':'PHI','Pittsburgh Steelers':'PIT','San Francisco 49ers':'SF','Seattle Seahawks':'SEA','Tampa Bay Buccaneers':'TB',
 'Tennessee Titans':'TEN','Washington Commanders':'WAS'}
BEO_ABBR = {'NOS':'NO','LVR':'LV','WSH':'WAS'}
OU = {'passing yards':'Over/Under (passing yards)','pass completions':'Over/Under (pass completions)','passing touchdowns':'Over/Under (passing TDs)',
      'pass attempts':'Over/Under (pass attempts)','rushing yards':'Over/Under (rushing yards)','carries':'Over/Under (carries)',
      'receiving yards':'Over/Under (receiving yards)','receptions':'Over/Under (receptions)','receiving + rushing yds':'Over/Under (rush + rec yards)'}
LADDER = {'pass_yds':'Passing Yards','pass_cmp':'Pass Completions','pass_td':'Passing TDs','pass_att':'Pass Attempts','pass_int':'Pass Interceptions',
          'rush_yds':'Rushing Yards','carries':'Carries','rec_yds':'Receiving Yards','rec':'Receptions','tackles_assists':'Tackles + Assists','sacks':'Sacks',
          'def_int':'Interceptions (defense)'}
BKR_LADDER = {'passing yards':'Passing Yards','pass completions':'Pass Completions','passing touchdowns':'Passing TDs','rushing yards':'Rushing Yards',
              'carries':'Carries','receiving yards':'Receiving Yards','receptions':'Receptions'}
PRICE = re.compile(r'^[+-]\d{3,5}$')
norm = lambda n: re.sub(r'\s+(Jr\.?|Sr\.?|II|III|IV)$', '', n.strip())
fmt = lambda x: f'{x:g}'

def beo_lines(path, game, captured):
    out, team_of = [], {}
    def add(player, market, sel, odds, team=''):
        out.append(dict(id=f'beo-{len(out)}', book='BEO', game=f'{game} · BEO', player=f'{player} ({team})' if team else player,
                        market=market, selection=sel, odds=int(odds), capturedAt=captured, source=f'BEO board {path.name}'))
    L = [l.strip() for l in path.read_text(encoding='utf-8', errors='replace').replace('\r', '').split('\n')]
    L = [l for l in L if l]
    stop = next(i for i, l in enumerate(L) if l.startswith('Over/Under ('))
    group, head, i = 'Game Markets (Parlays only)', None, 0
    while i < stop:
        x = L[i]
        if x in ('Game Markets (Parlays only)', 'Game Props'): group, head = x, None; i += 1; continue
        if i + 1 < stop and PRICE.match(L[i + 1]):
            sel = re.sub(r'\b(NOS|LVR|WSH)\b', lambda m: BEO_ABBR[m.group(1)], x)
            add('Game market', group, f'{head} · {sel}', L[i + 1]); i += 2; continue
        head = re.sub(r'\b(NOS|LVR|WSH)\b', lambda m: BEO_ABBR[m.group(1)], x); i += 1
    tmp = pathlib.Path(tempfile.mkdtemp()); shutil.copy(path, tmp / path.name)
    subprocess.run([sys.executable, str(ROOT / 'scripts/props/beo.py'), str(tmp), str(tmp / 'o.json')], check=True, capture_output=True)
    for r in json.loads((tmp / 'o.json').read_text()):
        team = ABBR.get(r.get('team', ''), ''); team_of[norm(r['player'])] = team
        m = r['market']
        if m == 'atd': add(r['player'], 'Touchdowns', f"{int(r['line'])}+ TD", r['odds'], team)
        elif m == 'first_td': add(r['player'], 'First Touchdown Scorer', 'First TD', r['odds'], team)
        elif m in LADDER: add(r['player'], LADDER[m], f"{fmt(r['line'])}+", r['odds'], team)
    shutil.rmtree(tmp)
    return out, team_of

def bkr_lines(path, game, captured, team_of):
    tmp = pathlib.Path(tempfile.mkdtemp())
    subprocess.run([sys.executable, str(ROOT / 'scripts/props/bookmaker-rendered-text-parse.py'), '--date', '2000-01-01', '--out-dir', str(tmp), str(path)], check=True, capture_output=True)
    rows = json.loads(next(tmp.glob('bookmaker-rendered-*-week*.json')).read_text())['rows'] if list(tmp.glob('bookmaker-rendered-*-week*.json')) else []
    if not rows:
        rows = json.loads(next(p for p in tmp.glob('*.json') if 'summary' not in p.name and 'name-resolution' not in p.name).read_text())['rows']
    shutil.rmtree(tmp)
    out, skipped = [], []
    def add(player, market, sel, odds, sgp):
        p = norm(player); team = team_of.get(p, '')
        out.append(dict(id=f'bkr-{len(out)}', book='BKR', game=f'{game} · BKR', player=(f'{p} ({team})' if team else p) if player != 'Game market' else player,
                        market=market, selection=sel + ('' if sgp else ' (no SGP)'), odds=int(odds), capturedAt=captured, source=f'BKR board {path.name}'))
    for r in rows:
        if not r.get('priced') or r.get('odds') is None: skipped.append(r); continue
        k, t, sgp = r['section_kind'], r['section_title'].split(': ', 1)[-1], r.get('sgp_badge', True)
        if k == 'game_period_lines':
            period = 'Game' if t == 'Game' else t.rsplit(' ', 2)[-2] + ' ' + t.rsplit(' ', 2)[-1]
            sub = (r.get('submarket') or '').split()[-1] if r.get('submarket') else ''
            sel = ABBR.get(r['selection'], r['selection'])
            if 'Spread' in sub: label, s = f'{period} spread', f"{sel} {r['line']:+g}"
            elif 'Total' in sub: label, s = f'{period} total', f"{sel} {fmt(r['line'])}"
            else: label, s = f'{period} moneyline', sel
            add('Game market', 'Game Lines', f'{label} · {s}', r['odds'], sgp)
        elif k == 'team_total':
            add('Game market', 'Game Lines', f"{t} · {r['selection']} {fmt(r['line'])}" if r.get('line') is not None else f"{t} · {r['selection']}", r['odds'], sgp)
        elif k == 'player_total_ou':
            key = re.sub(r'^(.*? )?Total ', '', t).lower()
            mk = OU.get(key)
            if not mk or not r.get('player'): skipped.append(r); continue
            add(r['player'], mk, f"{r['side']} {fmt(r['line'])}", r['odds'], sgp)
        elif k == 'player_ladder':
            key = t[len(r['player']):].strip().lower() if r.get('player') and t.startswith(r['player']) else t.lower()
            mk = BKR_LADDER.get(key)
            if not mk or r.get('threshold') is None: skipped.append(r); continue
            add(r['player'], mk, f"{r['threshold']}+", r['odds'], sgp)
        elif k == 'touchdown_scorer':
            if '1st' in t: add(r['selection'], 'First Touchdown Scorer', 'First TD', r['odds'], sgp)
            else:
                n = re.search(r'(\d)\+', t)
                add(r['selection'], 'Touchdowns', f'{n.group(1)}+ TD', r['odds'], sgp)
        elif k == 'game_prop':
            m = re.match(r'^(.*\S) - (Over|Under)$', r['selection'])
            if t == 'Total Interceptions' and m: add(m.group(1), 'Over/Under (pass interceptions)', f"{m.group(2)} {fmt(r['line'])}", r['odds'], sgp)
            elif m: add(m.group(1), 'Longest Completion / Reception', f"{t.replace(' (Yds)', '')} {m.group(2)} {fmt(r['line'])}", r['odds'], sgp)
            else: add('Game market', 'Game Props', f"{t} · {r['selection']}", r['odds'], sgp)
        else: skipped.append(r)
    return out, skipped

# ---------------------------------------------------------------- expert picks
EXPERT_STATS = {
    'anytime_touchdown': ('td', None, None, 'anytime TD'),
    'passing_yards': ('ou', 'Over/Under (passing yards)', 'Passing Yards', 'passing yards'),
    'pass_completions': ('ou', 'Over/Under (pass completions)', 'Pass Completions', 'completions'),
    'passing_touchdowns': ('ou', 'Over/Under (passing TDs)', 'Passing TDs', 'passing TDs'),
    'pass_attempts': ('ou', 'Over/Under (pass attempts)', 'Pass Attempts', 'pass attempts'),
    'interceptions': ('ou', 'Over/Under (pass interceptions)', 'Pass Interceptions', 'interceptions'),
    'rushing_yards': ('ou', 'Over/Under (rushing yards)', 'Rushing Yards', 'rushing yards'),
    'carries': ('ou', 'Over/Under (carries)', 'Carries', 'carries'),
    'rush_attempts': ('ou', 'Over/Under (carries)', 'Carries', 'carries'),
    'receiving_yards': ('ou', 'Over/Under (receiving yards)', 'Receiving Yards', 'receiving yards'),
    'receptions': ('ou', 'Over/Under (receptions)', 'Receptions', 'receptions'),
    'rush_rec_yards': ('ou', 'Over/Under (rush + rec yards)', None, 'rush + rec yards'),
}
NUM = re.compile(r'-?\d+(?:\.\d+)?')
nkey = lambda n: re.sub(r'\s+', ' ', re.sub(r'\b(jr|sr|ii|iii|iv|v)\b', '', re.sub(r"[.'’]", '', (n or '').lower()))).strip()
bare = lambda p: re.sub(r'\s*\([A-Z]{2,3}\)$', '', p)
clean = lambda s: s.replace(' (no SGP)', '')
ESPN_FIX = {'WAS': 'WSH', 'JAC': 'JAX', 'LA': 'LAR', 'LVR': 'LV', 'NOS': 'NO'}
RULED_OUT = {'OUT', 'IR', 'PUP', 'SUSPENSION', 'SUSPENDED'}

def roster_check(player, teams, snap, avail):
    """Roster gate for one player: same source and rules as scripts/nfl-rosters/roster_vet.py."""
    recs = [dict(r, name=n) for n, rs in snap['players'].items() if nkey(n) == nkey(player) for r in rs]
    on = [r for r in recs if r['team'] in teams]
    if not on:
        where = ', '.join(sorted({r['team'] for r in recs})) or 'on no 2026 roster'
        return dict(ok=False, text=f'Roster gate BLOCK: {player} is not on {" or ".join(teams)} ({where})')
    act = [r for r in on if r['group'] in ('offense', 'defense', 'specialTeam')]
    if not act: return dict(ok=False, text=f'Roster gate BLOCK: {player} is not on the active roster ({on[0]["group"]})')
    status, seen = None, ''
    for e in avail:
        if nkey(e.get('player_name')) == nkey(player) and ESPN_FIX.get(e.get('team_abbr'), e.get('team_abbr')) in teams:
            ns, t = str(e.get('normalized_status') or '').upper(), e.get('published_at') or ''
            if ns not in ('', 'NONE', 'UNKNOWN') and t >= seen: status, seen = ns, t
    if status in RULED_OUT: return dict(ok=False, text=f'Roster gate BLOCK: {player} listed {status}')
    return dict(ok=True, text=f'{act[0]["team"]} {act[0]["position"]}' + (f', {status.lower()}' if status in ('QUESTIONABLE', 'DOUBTFUL', 'PROBABLE') else ''))

def describe(r):
    m, side, line = r.get('market'), str(r.get('side') or ''), r.get('line')
    if m == 'prop':
        sel = html.unescape(r.get('selection') or '')
        st = re.search(r'\b([a-z]+(?:_[a-z]+)+|receptions|carries|interceptions)\b', sel)
        stat = st.group(1) if st else ''
        player = (r.get('players') or [''])[0] or re.split(r'\s+[-:]\s+|\s+(?=[a-z_]+\b)', sel)[0]
        spec = EXPERT_STATS.get(stat)
        if spec and spec[0] == 'td': return dict(kind='prop', player=player, stat=stat, label=f'{player} anytime TD')
        ou = 'Under' if 'UNDER' in f'{sel} {side}'.upper() else 'Over'
        if line is None:
            nums = NUM.findall(side) or NUM.findall(sel.split(stat, 1)[-1] if stat else sel)
            line = float(nums[-1]) if nums else None
        pretty = spec[3] if spec else stat.replace('_', ' ') or 'prop'
        return dict(kind='prop', player=player, stat=stat, ou=ou, line=line,
                    label=f'{player} {pretty} {ou}' + (f' {line:g}' if line is not None else ''))
    team = side.upper()
    if m == 'spread': return dict(kind=m, team=team, line=line, label=f'{team} {line:+g}' if line is not None else f'{team} spread')
    if m == 'moneyline': return dict(kind=m, team=team, label=f'{team} ML')
    if m == 'total': return dict(kind=m, ou=side.capitalize(), line=line, label=f'{side.capitalize()} {line:g}' if line is not None else f'{side.capitalize()} (total)')
    if m == 'teaser': return dict(kind=m, team=team, line=line, label=f'{team} {line:+g} (teaser)' if line is not None else f'{team} teaser')
    return None

def match(d, lines):
    out = []
    num_after = lambda s: float(NUM.findall(clean(s).split(' · ')[-1])[-1])
    if d['kind'] == 'prop':
        spec = EXPERT_STATS.get(d['stat'])
        if not spec: return [], f'No board market mapped for "{d["stat"] or d["label"]}".'
        mine = [l for l in lines if l['player'] != 'Game market' and nkey(bare(l['player'])) == nkey(d['player'])]
        if not mine: return [], f'{d["player"]} is not on the captured boards.'
        if spec[0] == 'td':
            out = [dict(id=l['id'], note='') for l in mine if l['market'] == 'Touchdowns' and clean(l['selection']) == '1+ TD']
            return out, '' if out else 'No anytime-TD price on the captured boards.'
        if d.get('line') is None: return [], 'The expert line was not captured.'
        tgt = d['line']
        for book in ('BEO', 'BKR'):
            ou = [(l, num_after(l['selection'])) for l in mine if l['book'] == book and l['market'] == spec[1] and clean(l['selection']).startswith(d['ou'])]
            if ou:
                l, v = min(ou, key=lambda t: abs(t[1] - tgt))
                out.append(dict(id=l['id'], note='' if v == tgt else f'expert {d["ou"]} {tgt:g}, board {v:g}'))
            if d['ou'] == 'Over' and spec[2]:
                rung = math.floor(tgt) + 1
                ld = [(l, float(clean(l['selection'])[:-1])) for l in mine if l['book'] == book and l['market'] == spec[2] and re.fullmatch(r'\d+(?:\.\d+)?\+', clean(l['selection']))]
                if ld:
                    l, v = min(ld, key=lambda t: (abs(t[1] - rung), -t[1]))
                    out.append(dict(id=l['id'], note='' if v == rung else f'Over {tgt:g} = {rung}+; nearest rung {v:g}+'))
        return out, '' if out else f'No {spec[3]} line for {d["player"]} on the captured boards.'
    gl = [l for l in lines if l['player'] == 'Game market']
    if d['kind'] == 'spread':
        for l in gl:
            s = clean(l['selection'])
            if l['book'] == 'BKR' and s.startswith(f'Game spread · {d["team"]} '):
                v = num_after(s)
                out.append(dict(id=l['id'], note='' if d['line'] in (None, v) else f'expert {d["team"]} {d["line"]:+g}, now {v:+g}'))
        return out, '' if out else 'No full-game spread on the captured boards (BEO game markets carry no spread).'
    if d['kind'] == 'moneyline':
        out = [dict(id=l['id'], note='') for l in gl if l['book'] == 'BKR' and clean(l['selection']) == f'Game moneyline · {d["team"]}']
        return out, '' if out else 'No moneyline on the captured boards.'
    if d['kind'] == 'total':
        for l in gl:
            s = clean(l['selection'])
            if (l['book'] == 'BKR' and s.startswith(f'Game total · {d["ou"]} ')) or (l['book'] == 'BEO' and s.startswith(f'total points · {d["ou"]} (')):
                v = num_after(s.replace('(', ' ').replace(')', ' '))
                out.append(dict(id=l['id'], note='' if d['line'] in (None, v) else f'expert {d["ou"]} {d["line"]:g}, now {v:g}'))
        return out, '' if out else 'No full-game total on the captured boards.'
    if d['kind'] == 'teaser': return [], 'Teaser leg: build it at the book; it is not a parlay selection on these boards.'
    return [], 'Not on the captured boards.'

def expert_picks(path, game, lines):
    key = game.replace(' ', '')
    teams = [ESPN_FIX.get(t, t) for t in key.split('@')]
    rows = [r for r in json.loads((ROOT / path).read_text(encoding='utf-8')).get('rows', [])
            if r.get('game') == key and r.get('verdict') == 'verified']
    snap = json.loads((ROOT / 'data/nfl-rosters/espn-full-rosters-latest.json').read_text(encoding='utf-8'))
    av = ROOT / 'data/player-availability/latest.json'
    avail = json.loads(av.read_text(encoding='utf-8')).get('events', []) if av.exists() else []
    picks, seen, blocked = [], {}, []
    for r in sorted(rows, key=lambda r: r.get('published') or '', reverse=True):
        d = describe(r)
        if not d or d['kind'] != 'prop': continue   # props only; game sides/totals/teasers stay out of the planner
        outlet = html.unescape(r.get('outlet') or '')
        sig = (outlet, tuple(r.get('persons') or []), d['label'])
        if sig in seen: seen[sig]['sources'] += 1; continue
        matches, nomatch = match(d, lines)
        roster = roster_check(d['player'], teams, snap, avail) if d['kind'] == 'prop' else None
        if roster and not roster['ok']: blocked.append(roster['text'])
        pk = dict(id=f'x{len(picks)}', label=d['label'], kind=d['kind'], outlet=outlet, persons=r.get('persons') or [],
                  quote=html.unescape(r.get('quote') or ''), published=(r.get('published') or '')[:10], best_bet=bool(r.get('best_bet')),
                  price=r.get('price') if d['kind'] == 'prop' else None, url=r.get('url'), roster=roster, matches=matches, nomatch=nomatch, sources=1)
        seen[sig] = pk; picks.append(pk)
    picks.sort(key=lambda p: (p['kind'] != 'prop', not p['best_bet']))
    note = (f'{len(picks)} verified player-prop picks for {key} from {pathlib.Path(path).name}; player picks roster-gated against ESPN rosters '
            f'({snap["generated_at"][:16].replace("T", " ")} UTC). Buttons use current board prices; a note shows when the line moved since the call.')
    return dict(note=note, picks=picks), blocked

UI_CSS = """
    .experts > summary { cursor:pointer; list-style:none; } .experts > summary::-webkit-details-marker { display:none; }
    .experts > summary h2::before { content:'\\203A'; display:inline-block; margin-right:7px; color:var(--accent-2); transition:transform .15s ease; }
    .experts[open] > summary h2::before { transform:rotate(90deg); }
    .expert-list { display:grid; gap:9px; padding:12px 14px 14px; max-height:520px; overflow:auto; }
    .expert { border:1px solid rgba(59,77,113,.9); border-radius:10px; background:#101a31; padding:10px 12px; }
    .expert-top { display:flex; justify-content:space-between; gap:6px 10px; align-items:baseline; flex-wrap:wrap; }
    .expert-pick { font-weight:800; color:#f5f3ff; font-size:14px; }
    .expert-src, .expert-src a { color:var(--muted); font-size:11px; }
    .expert-quote { color:#b9c6de; font-size:12px; margin:5px 0 8px; line-height:1.45; }
    .expert-legs { display:flex; flex-wrap:wrap; gap:7px; align-items:center; }
    .expert-leg { display:inline-flex; flex-direction:column; gap:2px; }
    .expert-add { border:1px solid var(--accent); background:rgba(139,92,246,.16); color:#f5f3ff; border-radius:8px; padding:5px 9px; font-size:12px; font-weight:700; cursor:pointer; text-align:left; }
    .expert-add:hover { filter:brightness(1.15); }
    .expert-add.is-selected { background:rgba(110,231,183,.14); border-color:var(--good); color:var(--good); }
    .expert-note { font-size:11px; color:#fbbf24; }
    .roster-block { font-size:12px; color:#fca5a5; font-weight:700; }
    .badge-best { display:inline-block; border-radius:999px; padding:2px 7px; margin-right:6px; font-size:10px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; background:rgba(251,191,36,.16); color:#fbbf24; vertical-align:middle; }
"""
UI_PANEL = """<section class="panel experts-panel" id="expertsPanel" hidden>
          <details class="experts" open><summary class="panel-head"><div><h2>Expert picks for this game</h2><span class="muted" id="expertNote"></span></div><span class="chip" id="expertCount"></span></summary>
          <div class="expert-list" id="expertList"></div></details>
        </section>

        """
UI_JS = """    function expertLegLabel(line) { return line.player === 'Game market' ? (line.selection.split(' \\u00b7 ').slice(1).join(' \\u00b7 ') || line.selection) : `${line.market.replace(/^Over\\/Under \\((.*)\\)$/, '$1')} ${line.selection}`; }
    function renderExperts() {
      const picks = (expertData && expertData.picks) || [];
      if (!picks.length) return;
      $('expertsPanel').hidden = false;
      $('expertCount').textContent = `${picks.length} pick${picks.length === 1 ? '' : 's'}`;
      $('expertNote').textContent = expertData.note || '';
      const scroll = $('expertList').scrollTop;
      $('expertList').innerHTML = picks.map(p => {
        const who = [p.outlet, ...(p.persons || [])].filter(Boolean).join(' \\u00b7 ') + (p.sources > 1 ? ` (\\u00d7${p.sources})` : '');
        const called = p.price ? ` <span class="expert-src">(called at ${displayOdds(p.price)})</span>` : '';
        let actions;
        if (p.roster && !p.roster.ok) actions = `<span class="roster-block">\\u26d4 ${escapeHtml(p.roster.text)}</span>`;
        else if (p.matches.length) actions = p.matches.map(mt => { const line = lines.find(x => x.id === mt.id); if (!line) return ''; const on = legs.some(l => l.id === line.id); return `<span class="expert-leg"><button class="expert-add ${on ? 'is-selected' : ''}" data-id="${line.id}" title="${on ? 'Remove from' : 'Add to'} the builder">${on ? '\\u2713' : '+'} ${escapeHtml(line.book)} \\u00b7 ${escapeHtml(expertLegLabel(line))} <b>${displayOdds(line.odds)}</b></button>${mt.note ? `<span class="expert-note">${escapeHtml(mt.note)}</span>` : ''}</span>`; }).join('');
        else actions = `<span class="expert-note">${escapeHtml(p.nomatch || 'Not on the captured boards.')}</span>`;
        const src = p.url ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(who)}</a>` : escapeHtml(who);
        return `<article class="expert"><div class="expert-top"><span class="expert-pick">${p.best_bet ? '<span class="badge-best">Best bet</span>' : ''}${escapeHtml(p.label)}${called}</span><span class="expert-src">${src} \\u00b7 ${escapeHtml(p.published || '')}${p.roster && p.roster.ok ? ` \\u00b7 ${escapeHtml(p.roster.text)}` : ''}</span></div>${p.quote ? `<p class="expert-quote">\\u201c${escapeHtml(p.quote)}\\u201d</p>` : ''}<div class="expert-legs">${actions}</div></article>`;
      }).join('');
      $('expertList').scrollTop = scroll;
      $('expertList').querySelectorAll('.expert-add').forEach(b => b.addEventListener('click', () => { const id = b.dataset.id; if (legs.some(l => l.id === id)) { legs = legs.filter(l => l.id !== id); renderBuilder(); renderLines(); } else addLeg(id); }));
    }

    function addLeg(id) {"""

def ui_patches(t):
    """Market filters are multi-select; filtered sections load expanded; open/closed state and scroll survive re-renders."""
    def sub(old, new):
        assert t.count(old) == 1, old[:90]
        return t.replace(old, new)
    t = sub("let activeMarket = 'All';", "let activeMarkets = new Set(); const openSections = new Set(); const closedSections = new Set(); const closedCategories = new Set();")
    t, n = re.subn(r"\$\('marketTabs'\)\.innerHTML = .*?renderLines\(\); renderFilters\(\); \}\)\);", lambda _: (
        "const isOn = m => m === 'All' ? !activeMarkets.size : activeMarkets.has(m);\n"
        "      $('marketTabs').innerHTML = markets.map(m => `<button class=\"tab ${isOn(m) ? 'active' : ''}\" aria-pressed=\"${isOn(m)}\" data-market=\"${escapeHtml(m)}\">${escapeHtml(m)}</button>`).join('');\n"
        "      $('marketTabs').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {\n"
        "        const m = button.dataset.market;\n"
        "        if (m === 'All') activeMarkets.clear();\n"
        "        else if (activeMarkets.has(m)) activeMarkets.delete(m);\n"
        "        else { activeMarkets.add(m); [...closedSections].forEach(k => { if (k.endsWith('||' + m)) closedSections.delete(k); }); }\n"
        "        renderLines(); renderFilters();\n"
        "      }));"), t, flags=re.S); assert n == 1
    t = sub("(activeMarket === 'All' || line.market === activeMarket)", "(!activeMarkets.size || activeMarkets.has(line.market))")
    t = sub("(activeMarket === 'All' || emptyMarketGroups.has(activeMarket))", "(!activeMarkets.size || [...activeMarkets].some(m => emptyMarketGroups.has(m)))")
    t = sub("if (activeMarket !== 'All' && activeMarket !== market) return;", "if (activeMarkets.size && !activeMarkets.has(market)) return;")
    assert not re.search(r'\bactiveMarket\b', t)
    t = sub("return `<details class=\"market-section\"><summary>",
            "const sectionKey = `${section.game}||${section.market}`; const isOpen = openSections.has(sectionKey) || (activeMarkets.has(section.market) && !closedSections.has(sectionKey));\n"
            "        return `<details class=\"market-section\" data-key=\"${escapeHtml(sectionKey)}\" ${isOpen ? 'open' : ''}><summary>")
    t = sub("`<details class=\"category-section\" open><summary>", "`<details class=\"category-section\" data-cat=\"${escapeHtml(category.name)}\" ${closedCategories.has(category.name) ? '' : 'open'}><summary>")
    t = sub("      $('lineList').innerHTML = orderedCategories.length", "      const priorScroll = $('lineList').scrollTop;\n      $('lineList').innerHTML = orderedCategories.length")
    t = sub("$('lineList').querySelectorAll('.option-button').forEach(button => button.addEventListener('click', () => addLeg(button.dataset.id)));",
            "$('lineList').querySelectorAll('.option-button').forEach(button => button.addEventListener('click', () => addLeg(button.dataset.id)));\n"
            "      $('lineList').scrollTop = priorScroll;\n"
            "      $('lineList').querySelectorAll('details.market-section').forEach(d => d.addEventListener('toggle', () => { const k = d.dataset.key; if (d.open) { openSections.add(k); closedSections.delete(k); } else { closedSections.add(k); openSections.delete(k); } }));\n"
            "      $('lineList').querySelectorAll('details.category-section').forEach(d => d.addEventListener('toggle', () => { if (d.open) closedCategories.delete(d.dataset.cat); else closedCategories.add(d.dataset.cat); }));")
    # market pills follow the Game (book) filter: only markets that book offers; drop selections it lacks
    t = sub("const knownMarkets = new Set(lines.map(x => x.market));",
            "const gameSel = $('gameFilter').value || 'All games';\n"
            "      const knownMarkets = new Set(lines.filter(x => gameSel === 'All games' || x.game === gameSel).map(x => x.market));\n"
            "      [...activeMarkets].forEach(m => { if (!knownMarkets.has(m)) activeMarkets.delete(m); });")
    t = sub("$('gameFilter').addEventListener('change', renderLines);", "$('gameFilter').addEventListener('change', () => { renderFilters(); renderLines(); });")
    t = sub("    function addLeg(id) {", UI_JS)
    t = sub("  </style>", UI_CSS + "  </style>")
    t, n = re.subn(r'(<section class="panel">\s*<div class="panel-head"><div><h2>Captured market selections</h2>)', lambda m: UI_PANEL + m.group(1), t); assert n == 1
    t = sub('<button class="section-control" id="expandSections">Expand filtered</button>', '<span class="muted" style="margin-right:auto;font-size:11px">Market filters stack: select as many as you like.</span><button class="section-control" id="expandSections">Expand filtered</button>')
    return t

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--game', required=True); ap.add_argument('--captured', required=True)
    ap.add_argument('--beo'); ap.add_argument('--bkr'); ap.add_argument('--out', required=True)
    ap.add_argument('--experts', help='expert-verified JSON (data/generated/master-intel/wNN-expert-verified.json)')
    a = ap.parse_args()
    lines, team_of, notes = [], {}, []
    if a.beo:
        b, team_of = beo_lines(ROOT / a.beo, a.game, a.captured); lines += b; notes.append(f'BEO {len(b)} selections from {pathlib.Path(a.beo).name}')
    if a.bkr:
        k, sk = bkr_lines(ROOT / a.bkr, a.game, a.captured, team_of); lines += k
        notes.append(f'BKR {len(k)} selections from {pathlib.Path(a.bkr).name}' + (f' ({len(sk)} unpriced/unmapped skipped)' if sk else ''))
    experts, blocked = expert_picks(a.experts, a.game, lines) if a.experts else (None, [])
    if experts:
        notes_x = f"experts: {len(experts['picks'])} picks, {sum(1 for p in experts['picks'] if p['matches'] and (not p['roster'] or p['roster']['ok']))} with board legs"
        print(notes_x); [print('  ' + b) for b in blocked]
    xpayload = json.dumps(experts, ensure_ascii=False).replace('</', '<\\/') if experts else ''
    t = TEMPLATE.read_text(encoding='utf-8')
    payload = json.dumps({'game': a.game, 'captured': a.captured, 'lines': lines}, ensure_ascii=False).replace('</', '<\\/')
    t, n = re.subn(r'<script id="pitCleCompact" type="text/plain">.*?</script>', lambda _: f'<script id="plannerData" type="application/json">{payload}</script>' + (f'\n  <script id="expertData" type="application/json">{xpayload}</script>' if experts else ''), t, flags=re.S); assert n == 1
    t, n = re.subn(r"const pitCleCompactLines = parsePitCleCompact\(.*?\);\s*let lines = pitCleCompactLines;",
                   lambda _: "let lines = JSON.parse(document.getElementById('plannerData').textContent).lines;\n    const expertData = (() => { const el = document.getElementById('expertData'); try { return el ? JSON.parse(el.textContent) : null; } catch { return null; } })();", t, flags=re.S); assert n == 1
    t, n = re.subn(r"const emptyMarketGroups = new Set\(\[.*?\]\);", lambda _: (
        "const emptyMarketGroups = new Set([]);\n"
        "    marketOrder.splice(1, 0, 'Game Lines');\n"
        "    marketOrder.push('Over/Under (rush + rec yards)', 'Longest Completion / Reception', 'Interceptions (defense)');"), t); assert n == 1
    t, n = re.subn(r"const categoryForMarket = ", lambda _: (
        "categoryMarkets.Game.add('Game Lines'); categoryMarkets.Receiving.add('Over/Under (rush + rec yards)');\n"
        "    categoryMarkets.Receiving.add('Longest Completion / Reception'); categoryMarkets.DEF.add('Interceptions (defense)');\n"
        "    const categoryForMarket = "), t, count=1); assert n == 1
    t, n = re.subn(r"const games = new Set\(legs\.map\(x => x\.game\)\);\s*\$\('correlationNote'\)\.textContent = .*?;\n", lambda _: (
        "const games = new Set(legs.map(x => x.game)); const books = new Set(legs.map(x => x.book || ''));\n"
        "      $('correlationNote').textContent = !hasEstimate ? 'Select two or more legs to see the estimate.' : books.size > 1 ? 'Mixed books: BEO and BKR legs cannot go on one ticket. Build each stack from a single book.' : games.size < legs.length ? 'Same-game parlay: the book reprices correlated legs, often 10-60% below this raw multiplication. Check the slip price before committing.' : 'Raw parlay estimate. Recheck price, eligibility, and limits at the book.';\n      renderExperts();\n"), t, flags=re.S); assert n == 1
    t = ui_patches(t)
    t = t.replace('<title>Player Prop Parlay Planner</title>', f'<title>Prop Planner {html.escape(a.game)}</title>')
    t = t.replace('<h1>Player Prop <span>Parlay Planner</span></h1>', f'<h1>Player Prop <span>Parlay Planner</span> · {html.escape(a.game)}</h1>')
    t = t.replace('estimates a raw multi-leg payout from captured BetOnline prices', 'estimates a raw multi-leg payout from captured BetOnline (BEO) and Bookmaker (BKR) prices; use the Game filter to pick a book')
    t = re.sub(r'<div class="notice"><span>ⓘ</span><div><strong>Authoritative PIT–CLE compact capture:</strong>.*?</div></div>',
               lambda _: f'<div class="notice"><span>ⓘ</span><div><strong>{html.escape(a.game)} boards, captured {html.escape(a.captured)}:</strong> {html.escape("; ".join(notes))}. Each book is listed as its own game in the Game filter, so a stack stays on one book. BKR selections marked <em>(no SGP)</em> cannot be combined in a same-game parlay.</div></div>', t, flags=re.S)
    t = t.replace('is not a BetOnline quote', 'is not a sportsbook quote')
    t = t.replace('<h2>Add more captured BEO lines</h2>', '<h2>Add more captured lines</h2>')
    pathlib.Path(ROOT / a.out).parent.mkdir(parents=True, exist_ok=True)
    (ROOT / a.out).write_text(t, encoding='utf-8')
    print('\n'.join(notes)); print(f'{len(lines)} selections -> {a.out}')

if __name__ == '__main__':
    main()
