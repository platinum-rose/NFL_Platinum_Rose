#!/usr/bin/env python3
"""Build a single-game Player Prop Parlay Planner (the Alejandro planner) from pasted BEO and BKR boards.

Read-only: parses board text already saved in docs/Player_Prop_Odds_Weekly/, fetches nothing, places nothing.
Template: reports/analysis/w1-3-deep/codex/player-prop-parlay-planner-alejandro.html (Codex, PIT@CLE).
The template's embedded PIT@CLE compact block is swapped for a JSON block of every selection, tagged by book.

Usage:
  python3 scripts/props/build-prop-planner.py --game "ATL @ NO" --captured "2026-10-05 ~12:10 PT" \
     --beo docs/Player_Prop_Odds_Weekly/Week4/BEO_Week4_ATL_NOS_v3 \
     --bkr docs/Player_Prop_Odds_Weekly/Week4/BKR_Week4_ATL_NOS \
     --out reports/analysis/prop-planner/player-prop-parlay-planner-2026-w04-atl-no.html
"""
import argparse, json, re, subprocess, sys, tempfile, shutil, pathlib, html

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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--game', required=True); ap.add_argument('--captured', required=True)
    ap.add_argument('--beo'); ap.add_argument('--bkr'); ap.add_argument('--out', required=True)
    a = ap.parse_args()
    lines, team_of, notes = [], {}, []
    if a.beo:
        b, team_of = beo_lines(ROOT / a.beo, a.game, a.captured); lines += b; notes.append(f'BEO {len(b)} selections from {pathlib.Path(a.beo).name}')
    if a.bkr:
        k, sk = bkr_lines(ROOT / a.bkr, a.game, a.captured, team_of); lines += k
        notes.append(f'BKR {len(k)} selections from {pathlib.Path(a.bkr).name}' + (f' ({len(sk)} unpriced/unmapped skipped)' if sk else ''))
    t = TEMPLATE.read_text(encoding='utf-8')
    payload = json.dumps({'game': a.game, 'captured': a.captured, 'lines': lines}, ensure_ascii=False).replace('</', '<\\/')
    t, n = re.subn(r'<script id="pitCleCompact" type="text/plain">.*?</script>', lambda _: f'<script id="plannerData" type="application/json">{payload}</script>', t, flags=re.S); assert n == 1
    t, n = re.subn(r"const pitCleCompactLines = parsePitCleCompact\(.*?\);\s*let lines = pitCleCompactLines;",
                   lambda _: "let lines = JSON.parse(document.getElementById('plannerData').textContent).lines;", t, flags=re.S); assert n == 1
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
        "      $('correlationNote').textContent = !hasEstimate ? 'Select two or more legs to see the estimate.' : books.size > 1 ? 'Mixed books: BEO and BKR legs cannot go on one ticket. Build each stack from a single book.' : games.size < legs.length ? 'Same-game parlay: the book reprices correlated legs, often 10-60% below this raw multiplication. Check the slip price before committing.' : 'Raw parlay estimate. Recheck price, eligibility, and limits at the book.';\n"), t, flags=re.S); assert n == 1
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
