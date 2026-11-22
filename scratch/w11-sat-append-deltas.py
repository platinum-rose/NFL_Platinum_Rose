"""Append a Saturday delta section to each Week 11 matchup write-up (sides + props) and the RUNLOG.
Friday content is preserved; each file is backed up first (.bak-claude-20261121-sat)."""
import json, shutil, os, collections, datetime
ORDER = "MIA@BUF NO@CHI TEN@DAL TB@DET ARI@KC PIT@PHI BAL@CAR NYJ@LAC LV@DEN JAX@NYG MIN@SF CIN@WAS".split()
AS_OF = '2026-11-21T12:30:00-08:00'
G = 'reports/intel/games'
notes = json.load(open('scratch/w11-sat-game-notes.json', encoding='utf-8'))
delta = {r['game']: r for r in json.load(open('scratch/w11-sat-delta.json', encoding='utf-8'))['rows']}
wx = {r['game']: r for r in json.load(open('data/research-intel/review/2026-w11-weather-venue.json', encoding='utf-8'))['rows']}
bol = json.load(open('data/generated/props/betonline-live-2026-11-21-week11.json', encoding='utf-8'))
NICK = {'Miami Dolphins': 'MIA', 'Buffalo Bills': 'BUF', 'New Orleans Saints': 'NO', 'Chicago Bears': 'CHI', 'Tennessee Titans': 'TEN', 'Dallas Cowboys': 'DAL',
        'Pittsburgh Steelers': 'PIT', 'Philadelphia Eagles': 'PHI', 'Baltimore Ravens': 'BAL', 'Carolina Panthers': 'CAR', 'New York Jets': 'NYJ', 'Los Angeles Chargers': 'LAC',
        'Las Vegas Raiders': 'LV', 'Denver Broncos': 'DEN', 'Jacksonville Jaguars': 'JAX', 'New York Giants': 'NYG', 'Minnesota Vikings': 'MIN', 'San Francisco 49ers': 'SF',
        'Cincinnati Bengals': 'CIN', 'Washington Commanders': 'WAS', 'Tampa Bay Buccaneers': 'TB', 'Detroit Lions': 'DET', 'Arizona Cardinals': 'ARI', 'Kansas City Chiefs': 'KC'}
def gk(s):
    a, h = s.split(' @ ');
    return f"{NICK.get(a, a)}@{NICK.get(h, h)}"
bol_rows = collections.Counter(gk(r['game']) for r in bol['rows'])
pb = bol.get('propsBuilder') or {}
pb_rows = collections.Counter(gk(r['game']) for r in (pb.get('rows') or []) if ' @ ' in str(r.get('game', '')))
av = json.load(open('data/player-availability/latest.json', encoding='utf-8'))
status = {}
for e in av['events']:
    if e.get('source') != 'ESPN injuries API': continue
    k = e['player_name']
    if k not in status or (e.get('published_at') or '') > status[k][1]:
        status[k] = (e.get('status_raw') or '', e.get('published_at') or '')
pods = collections.defaultdict(list)
for s in json.load(open('data/intel/articles/2026-w11/reviewed-podcast-picks.json', encoding='utf-8'))['sources']:
    for lst in ('game_picks', 'picks'):
        for r in s.get(lst, []):
            pods[r.get('game')].append((lst, s, r))
def ts(sec):
    return f"{int(sec)//60}:{int(sec)%60:02d}" if sec is not None else '?'
def label(lst, r):
    m = r.get('market')
    if lst == 'game_picks':
        return {'spread': 'standalone spread pick (podcast spreads are context)', 'total': 'standalone total pick (podcast totals are flags)',
                'team_total': 'source context: team total, not a standalone pick', 'moneyline': 'winner forecast: source context'}.get(m, 'source context')
    sel = str(r.get('selection') or '')
    if any(x in sel for x in ('4+', '25+')):
        return 'alternate-threshold prop (ladder), standalone'
    return 'standalone prop pick'
def fmt_game(lst, s, r):
    if lst == 'game_picks':
        line = r.get('line'); side = str(r.get('side')).upper() if r.get('market') == 'spread' else str(r.get('side')).title()
        txt = f"{side} {line:+g}" if (r.get('market') == 'spread' and line is not None) else (f"{side} {line}" if line is not None else side)
        if r.get('market') == 'team_total': txt = f"team total {r.get('side')} {line}"
        if r.get('market') == 'moneyline': txt = f"{r.get('side')} moneyline"
    else:
        txt = f"{r.get('player')} {r.get('selection')}"
    if r.get('posted_price') is not None: txt += f" ({int(r['posted_price']):+d})"
    return txt
def fl(x):
    return 'â€”' if x is None else (f"{x:+g}")
def write(path, block):
    shutil.copy2(path, path + '.bak-claude-20261121-sat')
    with open(path, 'a', encoding='utf-8') as f:
        f.write(block)
runlog = []
for g in ORDER:
    a, h = g.split('@'); n = notes[g]; d = delta[g]; w = wx.get(g, {})
    wtxt = w.get('note', '')
    if 'temp_c' in w:
        wtxt = f"{w['temp_c']} C, rain prob {w['precip_prob_pct']}% ({w['precip_mm']} mm), wind {w['wind_kmh']} km/h, gusts {w['gust_kmh']} km/h at the kickoff hour; materiality {w['materiality']}. {w.get('note','')}"
    pod_lines = []
    prop_lines = []
    for lst, s, r in pods.get(g, []):
        line = f"- {s['analyst']} Â· {s['outlet']} Â· published {s['published_at']} Â· at {ts(r.get('timestamp_seconds'))}: **{fmt_game(lst, s, r)}** â€” {label(lst, r)}. [{s['url']}]({s['url']})"
        (pod_lines if lst == 'game_picks' else prop_lines).append(line)
        if lst == 'picks':
            st = status.get(r.get('player'))
            if st and any(x in st[0].lower() for x in ('out', 'doubt', 'quest', 'reserve')):
                prop_lines.append(f"  - Availability flag: {r.get('player')} listed **{st[0]}** (ESPN feed {st[1][:16]}Z). Do not use until cleared.")
    sides = f"""

---

## Saturday delta â€” {AS_OF} (Claude, research view; gate RED)

Status: **{n['status']}**. Friday leans above are preserved; this section supersedes them where it disagrees. Research evidence only: no ticket, no official pick and no ledger change. The Saturday gate is RED (no fresh Bookmaker capture), so this is provisional.

**Quarterbacks.** {n['qb']}

**Availability (ESPN injuries feed, refreshed Sat 11:08 am PT).** {n['injuries']}

| Source | Home spread ({h}) | Total | Note |
|---|---:|---:|---|
| Bookmaker, Thu Nov 19 1:02 pm PT (Friday basis) | {fl(d['fri_bkr_home_line'])} | {d['fri_bkr_total']} | Last row-verified Bookmaker capture; 46h old |
| BetOnline, Sat Nov 21 11:33 am PT | {fl(d.get('sat_bol_home_line'))} ({d.get('sat_bol_home_spread_odds') or 'â€”'}) | {d.get('sat_bol_total') or 'â€”'} | data/generated/props/betonline-live-2026-11-21-week11.json |
| Baseline fair line (fair-lines-w11.json, "baseline only") | {fl(d['fair_home_line'])} | {d['fair_total']} | Not a calibrated edge |

The comparison is book to book (Bookmaker Thursday, BetOnline Saturday). A half point can be book noise rather than movement.

- **Spread.** {n['spread_view']}
- **Total.** {n['total_view']}
- **Weather / venue (Open-Meteo, read Sat 11:50 am PT).** {wtxt}

**Podcast and expert calls on this game (reviewed-podcast-picks.json):**
{chr(10).join(pod_lines) if pod_lines else '- No new reviewed game-market calls.'}

**Still open before kickoff:** fresh Bookmaker capture (Andy login), final inactives, and a weather recheck on game day.
"""
    props = f"""

---

## Saturday delta â€” {AS_OF} (Claude, research view; gate RED)

- BetOnline Saturday board (11:33 am PT): {bol_rows.get(g, 0)} rows for this game (main board plus merged props-builder rows). {'**Not posted at BetOnline**: no Saturday prop prices for this game.' if bol_rows.get(g, 0) == 0 else ''}
- Bookmaker player-prop board is still Thursday's (thin for this game in the queue). A fresh capture needs Andy's login.
- No prop qualifies for a ticket on this evidence. The rows below are named public-source plays for research display only.

**Reviewed podcast prop calls:**
{chr(10).join(prop_lines) if prop_lines else '- None recorded for this game.'}

Compare any of these against the exact market, threshold and price on a current board before use. Ignore props on players listed Questionable, Doubtful or Out (Week 10 decision, carried).
"""
    write(f"{G}/2026-w11-game-{a}_at_{h}-sides.md", sides)
    write(f"{G}/2026-w11-game-{a}_at_{h}-props.md", props)
    spread_short = n['spread_view'].split(':')[0].split('.')[0]
    runlog.append(f"- {AS_OF} Â· {g} Â· sides Â· SATURDAY DELTA Â· {n['status']} Â· {spread_short} Â· [sides](2026-w11-game-{a}_at_{h}-sides.md)")
    runlog.append(f"- {AS_OF} Â· {g} Â· props Â· SATURDAY DELTA Â· BetOnline {bol_rows.get(g,0)} rows, Bookmaker stale, no qualified play Â· [props](2026-w11-game-{a}_at_{h}-props.md)")
rl = f"{G}/2026-w11-game-RUNLOG.md"
shutil.copy2(rl, rl + '.bak-claude-20261121-sat')
with open(rl, 'a', encoding='utf-8') as f:
    f.write("\n## Saturday delta pass (Nov 21, research view; gate RED, Bookmaker not recaptured)\n\nIND@HOU concluded Thursday and is preserved unchanged.\n" + "\n".join(runlog) + "\n")
print('appended', len(ORDER), 'games')
