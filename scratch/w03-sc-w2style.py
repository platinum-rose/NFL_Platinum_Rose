"""One-off: Week 3 SuperContest report re-laid-out in the Week 2 packet format (Andy, Sat 9/26 night).
Does NOT touch the locked template/builder. Reads the Week 3 build outputs + BKR pastes; writes
dist/nfl_week3_master_packet/nfl_week3_supercontest_intelligence_summary_w2style.{md,html,docx}."""
import json, re, sys, html
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'dist/nfl_week3_master_packet'
MD3 = (D / 'nfl_week3_supercontest_intelligence_summary.md').read_text(encoding='utf-8')
J = json.loads((D / 'nfl_week3_supercontest_intelligence_summary.json').read_text(encoding='utf-8'))
OPEN_F, NOW_F = ROOT / 'data/odds/BKR_current_lines_0922_1859', ROOT / 'data/odds/BKR_current_lines_0926_2259'

def bkr(p):
    out = {}
    for l in p.read_text(encoding='utf-8').splitlines():
        m = re.match(r'(\w+) @ (\w+) (\d+:\d+).*?\s(\w+) ([+-][\d.]+)[+-]\d+ / (\w+) ([+-][\d.]+)[+-]\d+', l)
        if m:
            a, h, t, _, asp, _, hsp = m.groups()
            out[f'{a}@{h}'] = {'t': t, a: float(asp), h: float(hsp)}
    return out
OPEN, NOW = bkr(OPEN_F), bkr(NOW_F)
DAY = {g: ('Mon' if g == 'PHI@CHI' else ('Thu' if g == 'ATL@GB' else 'Sun')) for g in {s['gid'] for s in J['sides']}}
NAME = dict((a.lower(), b) for a, b in re.findall(r'class="tl tl-(\w+)" title="([^"]+)"', MD3))
def tl(t): return f'<span class="tl tl-{t.lower()}" title="{NAME.get(t.lower(), t)}"></span>'
def full(t): return NAME.get(t.lower(), t)
def slug(g): return g.lower().replace('@', '-')
def f(x): return ('%+g' % x) if x is not None else '—'
def pl(x): return 'PK' if x == 0 else f(x)

SIDES = [s for s in J['sides']]
BYSIDE = {s['side']: s for s in SIDES}
FIVE = [(o['team'], o['line'], o['note']) for o in J['our_five']]
FIVE_T = [t for t, _, _ in FIVE]
ALT_T = [a['team'] for a in J['alternates']]
live = [s for s in SIDES if s['result'] is None and s['rank'] is not None]
for t in [s['side'] for s in sorted(live, key=lambda s: s['rank'])]:
    if len(ALT_T) >= 5: break
    if t not in FIVE_T and t not in ALT_T: ALT_T.append(t)

def outcome(m, L): return 1 if m + L > 0 else (0.5 if m + L == 0 else 0)
def key_note(lc, lm):
    if lm is None or lc == lm: return ''
    out = []
    for k in (3, 7):
        for m in (k, -k):
            a, b = outcome(m, lc), outcome(m, lm)
            if a != b: out.append(('gains' if a > b else 'loses') + f' {k}')
    return ', '.join(dict.fromkeys(out))

def lines_for(s):
    g, t = s['gid'], s['side']
    o = OPEN.get(g, {}).get(t); n = NOW.get(g, {}).get(t)
    return o, s['lc'], n
def stab(o, n):
    if o is None or n is None: return '<span class="badge badge-zero">—</span>'
    mv = abs(n - o); sc = int(round(90 - 4 * mv))
    cls, lab = ('badge-stable', 'Stable') if mv == 0 else (('badge-watch', 'Watch') if mv <= 0.5 else ('badge-volatile', 'Volatile'))
    return f'<span class="badge {cls}">{lab} ({sc})</span>'
def move_badge(s):
    _, lc, n = lines_for(s)
    if n is None: return '<span class="badge badge-zero">—</span>'
    v = lc - n; kn = key_note(lc, n)
    if v > 0: return f'<span class="badge badge-best">▲ {f(v)} ({s["side"]} free pts{", " + kn if kn else ""})</span>'
    if v < 0: return f'<span class="badge badge-volatile">▼ {f(v)} ({s["side"]} pays{", " + kn if kn else ""})</span>'
    return '<span class="badge badge-zero">0.0</span>'

# ---- experts (from the Week 3 build's panel table) ----
EXP = []
for row in re.findall(r"^\| <span id='(scx-[^']+)'></span>\*\*(.+?)\*\* \| (.*?) \| (.*?) \| (.*?) \|$", MD3, re.M):
    sid, name, sides, agree, dis = row
    toks = [re.sub(r'<[^>]+>', '', x).strip() for x in sides.split('·')]
    EXP.append((sid, html.unescape(name), [x for x in toks if x]))
def experts_on(t):
    return [(sid, n) for sid, n, ss in EXP if t in ss]
def exp_cell(s):
    fo, ag = experts_on(s['side']), experts_on(s['opp'])
    head = ('Consensus' if s['nf'] - s['na'] >= 3 else 'Lean' if s['nf'] > s['na'] else 'Split' if s['nf'] == s['na'] else 'Against the panel')
    c = '#16a34a' if s['nf'] > s['na'] else ('#2563eb' if s['nf'] == s['na'] else '#dc2626')
    lk = lambda L: ', '.join(f'<a href="#{sid}" class="table-link">{html.escape(n)}</a>' for sid, n in L) or '—'
    return (f'<strong>{head} ({s["nf"]} vs {s["na"]})</strong><br><small style="color:{c};font-weight:600;">{lk(fo)}</small>'
            + (f'<br><small style="color:#64748b;">vs. {lk(ag)}</small>' if ag else ''))

# ---- text from the Week 3 build ----
FIVEBLK = {}
for sid, body in re.findall(r'<details class="rollup-box sc-five" id="sc5-(\w+)">(.*?)</details>', MD3, re.S):
    c = re.search(r'🧠 \*\*The case:\*\* (.*)', body); b = re.search(r'⚠️ \*\*What breaks it:\*\* (.*)', body)
    FIVEBLK[sid.upper()] = (c.group(1).strip() if c else '', b.group(1).strip() if b else '')
GAMEBLK = {}
for gs, body in re.findall(r'<details class="rollup-box sc-game" id="sc-game-([a-z]+-[a-z]+)">(.*?)(?=<details class="rollup-box sc-game" id=|\Z)', MD3, re.S):
    w = re.search(r'\*\*🧠 Why the card leans this way\*\*\s+(.*)', body); b = re.search(r'\*\*⚠️ What breaks it\*\*\s+(.*)', body)
    pr = re.search(r'proj ([A-Z]+ \d+ – [A-Z]+ \d+)', body)
    GAMEBLK[gs] = (w.group(1).strip() if w else '', b.group(1).strip() if b else '', pr.group(1) if pr else '')
def sents(t, n=2):
    p = re.split(r'(?<=[.!?])\s+(?=[A-Z<])', t)
    return ' '.join(p[:n])

def why(s, rank_label):
    g = slug(s['gid']); t = s['side']; o, lc, n = lines_for(s)
    b = []
    v = (lc - n) if n is not None else None
    kn = key_note(lc, n) if n is not None else ''
    if v is not None:
        b.append(('Free Points on the Lock' if v > 0 else 'Paying for the Number' if v < 0 else 'No Line Value',
                  f'Contest {t} {pl(lc)} vs BKR {pl(n)} tonight ({f(v)} pts{"; " + kn + " vs the market" if kn else ""}).'))
    if s['marg'] is not None:
        b.append(('Our Projection', f'{GAMEBLK.get(g, ("", "", ""))[2] or "projected margin " + f(s["marg"])} — {f(s["cush"])} pts of room vs the contest line.'))
    if t in FIVEBLK and FIVEBLK[t][0]:
        b.append(('The Case', sents(FIVEBLK[t][0])))
        if FIVEBLK[t][1]: b.append(('What Breaks It', sents(FIVEBLK[t][1], 9)))  # full text: a 1-sentence cut dropped context (2026-09-27)
    elif t in FIVE_T + ALT_T and GAMEBLK.get(g, ('',))[0]:
        b.append(('The Case', sents(GAMEBLK[g][0])))
    return '\n'.join(f'  • <a href="#sc-game-{g}"><strong>{k}:</strong></a> {v}<br>' for k, v in b)

TH = '''<thead>
<tr>
<th><span class="term-tooltip">Matchup &amp; Kickoff<span class="tip-text"><strong>Game Details</strong>Week 3 matchup, kickoff (PT), and a Line Stability Score (90 = no BKR movement since Tuesday; −4 per half point moved).</span></span></th>
<th><span class="term-tooltip">Opening Line<span class="tip-text"><strong>Tuesday Line</strong>BKR spread pasted Tue 9/22 18:59 PT, before most Week 3 action.</span></span></th>
<th><span class="term-tooltip">Contest Line<span class="tip-text"><strong>Locked SuperContest Spread</strong>The contest line Andy pasted Thu 9/24. It never changes for our card.</span></span></th>
<th><span class="term-tooltip">Current Line<span class="tip-text"><strong>Live Market Spread</strong>BKR spread pasted Sat 9/26 22:59 PT.</span></span></th>
<th><span class="term-tooltip">Movement<span class="tip-text"><strong>Contest vs. Market</strong>Points the contest line gives this side versus BKR tonight. Green = free points; red = the contest number is worse than the market. Key numbers 3 and 7 flagged.</span></span></th>
<th><span class="term-tooltip">Contest Pick &amp; Score<span class="tip-text"><strong>Contest score</strong>The Week 3 report's contest score and rank among all 30 live sides (built Sat 21:48 PT with 13:47 BKR lines). Room vs line + 1.5 × line value + 0.5 per net expert ± big money ± key number. Not a win chance.</span></span></th>
<th><span class="term-tooltip">Expert Alignment<span class="tip-text"><strong>Named experts</strong>Experts with a spread or moneyline pick on this side vs. the other side (multi-writer outlets can appear on both).</span></span></th>
<th><span class="term-tooltip">Why We Like It (Deep Dive)<span class="tip-text"><strong>Contest Analysis</strong>Line value, our projection and the case. Click any bold title for the full game breakdown.</span></span></th>
</tr>
</thead>'''
def row(s, label, badge, rid=True):
    g = s['gid']; a, h = g.split('@'); o, lc, n = lines_for(s)
    hs = h  # show home team's line like Week 2 (home/fav perspective): show this side's line
    t = NOW.get(g, OPEN.get(g, {})).get('t', '')
    sc = f'Contest score {f(s["score"])} · Rank {s["rank"]} of 30' + (f' · {"★" * int(s["stars"])}' if s.get('stars') else '')
    return (f'<tr{" id=" + chr(34) + "exec-" + s["side"].lower() + chr(34) if rid else ""}>\n'
            f'<td><strong>{label}</strong> {tl(a)} {a} @ {tl(h)} <strong>{h}</strong><br><small style="color:#64748b;">{DAY[g]} {t} PT</small><br>{stab(o, n)}</td>\n'
            f'<td><strong>{s["side"]} {pl(o) if o is not None else "—"}</strong></td>\n<td><strong>{s["side"]} {pl(lc)}</strong></td>\n'
            f'<td><strong>{s["side"]} {pl(n) if n is not None else "—"}</strong></td>\n<td>{move_badge(s)}</td>\n'
            f'<td><a href="#sc-game-{slug(g)}" class="table-link">{tl(s["side"])} <strong>{full(s["side"])} {pl(lc)}</strong></a><br><span class="badge {badge}">{sc}</span></td>\n'
            f'<td>{exp_cell(s)}</td>\n<td>\n{why(s, label)}\n</td>\n</tr>')

L = []
L += [MD3.split('\n')[0], MD3.split('\n')[3], '']  # theme + logo styles (no side TOC, like Week 2)
L += ['# 🏆 NFL Week 3 SuperContest Master Intelligence Report',
      '## Spread-Only Analytical Dossier, Ranked 5-Pick Contest Card & Full 15-Game ATS Matrix', '', '---', '']
def qp(ts, lines):
    return '\n      <span class="quick-pick-sep">-</span>\n'.join(
        f'      <a href="#exec-{t.lower()}" class="quick-pick-link">{tl(t)} <strong>{t} {pl(BYSIDE[t]["lc"])}</strong></a>' for t in ts)
L += ['<div class="quick-nav-panel">', '  <div class="quick-nav-header">', '    <div class="quick-nav-controls">',
      '      <span class="quick-nav-label">⚡ Controls:</span>',
      '      <button class="btn-pill btn-primary" onclick="toggleAllRollups(true)">Expand All</button>',
      '      <button class="btn-pill" onclick="toggleAllRollups(false)">Collapse All</button>',
      '      <button class="btn-pill" onclick="toggleRollups(\'section-alternates\', true); openTargetDetails(\'#top5-alternates-box\');">Alternates (#6–10)</button>',
      '    </div>', '    <span class="quick-nav-hint">💡 Tip: Clicking any matchup glides directly to that analysis.</span>', '  </div>',
      '  <div class="quick-picks-list">', '    <div class="quick-pick-line">', '      <span class="pick-tier-badge badge-top5">Top 5 (draft):</span>',
      qp(FIVE_T, None), '    </div>', '    <div class="quick-pick-line">', '      <span class="pick-tier-badge badge-alt">Alternates:</span>',
      qp(ALT_T, None), '    </div>', '  </div>', '</div>', '']
sr = J['season_record']
free_now = [s for s in live if NOW.get(s['gid'], {}).get(s['side']) is not None and s['lc'] - NOW[s['gid']][s['side']] > 0]
L += ['<details class="rollup-box section-rules" id="contest-rules-box">',
      '<summary>📋 SuperContest Rules &amp; Overview (Spread-Only Format, Scoring, Lock Times &amp; Market Data)</summary>', '<div class="rollup-content">',
      '  <div class="status-banner" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-left: 5px solid #10B981; padding: 14px 18px; border-radius: 8px; margin-bottom: 12px; color: #F8FAFC;">',
      '    <div style="font-size: 1.05rem; font-weight: 700; color: #34D399; margin-bottom: 4px;">🟢 Market Snapshot: BKR Lines (Sat night update)</div>',
      '    <div style="font-size: 0.92rem; line-height: 1.5;">',
      '      • <strong>Market Lines:</strong> BKR sportsbook, <strong>Sat Sep 26, 2026, 10:59 PM PT</strong> (Andy paste). Opening lines: BKR Tue Sep 22, 6:59 PM PT.<br>',
      f'      • <strong>Contest Lines:</strong> {html.escape(J["contest_lines_source"])}.<br>',
      '      • <strong>Card status:</strong> the Top 5 below is Platinum Rose\'s <strong>draft</strong>; Andy &amp; Amanda\'s joint five is not locked yet.<br>',
      '      • <strong>Contest Format:</strong> <strong>Spread-Only</strong>. Select exactly <strong>five (5) NFL sides</strong> against the locked contest lines. No totals, moneylines, props or teasers.<br>',
      '      • <strong>Scoring System:</strong> Win = <strong>1.0 point</strong>, Push = <strong>0.5 points</strong>, Loss = <strong>0.0 points</strong>.<br>',
      '      • <strong>Game 1 Status (Falcons @ Packers, TNF):</strong> 🏁 <strong>FINAL — ATL 35, GB 14</strong> (ATL +5.5 covered). 15 active games remain.<br>',
      '      • <strong>Sunday Re-Check:</strong> Zay Flowers (BAL, hamstring, questionable), Puka Nacua (LAR, doubtful).<br>',
      '      • <strong>Scores &amp; ranks</strong> come from the Week 3 build (Sat 9:48 PM PT, BKR 1:47 PM lines); the Current Line and Movement columns use tonight\'s 10:59 PM BKR lines.<br>',
      '      • <strong>Interactive Sortable Tables:</strong> 💡 Hover over any header marked with <strong>ⓘ</strong> for definitions. <strong>Click any column header to sort</strong>.',
      '    </div>', '  </div>', '</div>', '</details>', '']
L += ['<details class="rollup-box section-rules" id="season-review-box">',
      f'<summary>📉 Season Review: {sr["wins"]}–{sr["losses"]}{"–" + str(sr["pushes"]) if sr["pushes"] else ""} ({sr["points"]:g} pts) — What We Carry Forward</summary>', '<div class="rollup-content">', '']
for wk in sr['weeks']:
    w_ = sum(1 for p in wk['picks'] if p['result'] == 'Win')
    L += [f'**Week {wk["week"]}: {w_}–{len(wk["picks"]) - w_}**', '', '| Pick | Result | Final | Margin vs line | Note |', '|---|---|---|---|---|']
    L += [f'| {p["pick"]} | {"✅ Win" if p["result"] == "Win" else "➖ Push" if p["result"] == "Push" else "❌ Loss"} | {p["final"]} | {f(p["margin"])} | {p["note"]} |' for p in wk['picks']]
    L += ['']
L += ['Week 2 lost GB −3.5 by the hook. **Week 3 ranking rule stays: contest-vs-market value and room first, key-number narratives second.**', '', '</div>', '</details>', '', '---', '']

# Section 1
L += ['<a id="top5-portfolio"></a><a id="executive-board"></a>',
      '## 1. Executive Ranked Recommendations: The Platinum Rose "Top 5" SuperContest Card (Draft)', '',
      '<div class="rollup-controls">',
      '  <button class="btn-toggle btn-primary" onclick="toggleRollups(\'section-top5\', true)">Expand Section 1</button>',
      '  <button class="btn-toggle" onclick="toggleRollups(\'section-top5\', false)">Collapse Section 1</button>',
      '  <button class="btn-toggle" onclick="toggleRollups(\'section-alternates\', true)">Expand Alternates (#6–10)</button>',
      '  <button class="btn-toggle" onclick="toggleRollups(\'section-alternates\', false)">Collapse Alternates (#6–10)</button>', '</div>', '',
      '<details class="rollup-box section-main section-top5" id="section-1-box" open>',
      '<summary>🏆 Section 1: Executive Ranked Recommendations — "Top 5" Card &amp; Alternates</summary>', '<div class="rollup-content">', '',
      'This board tracks each side from **Tuesday Open → Contest Lock → Saturday-night Market → Contest-vs-Market Value**, with expert alignment *(💡 Click any column header to sort)*:', '',
      '### The Primary "Top 5" Contest Card (Ranks #1 to #5)', '', '<div class="table-responsive"><table class="sortable-table">', TH, '<tbody>']
five_sorted = sorted(FIVE_T, key=lambda t: BYSIDE[t]['rank'])
for i, t in enumerate(five_sorted, 1): L.append(row(BYSIDE[t], f'#{i}', 'badge-best'))
L += ['</tbody>', '</table></div>', '', '<details class="rollup-box section-alternates" id="top5-alternates-box">',
      '<summary>🔁 Alternates (#6–10): Card Alternate + the Highest Contest Scores Not in the Five</summary>', '<div class="rollup-content">', '',
      '<div class="table-responsive"><table class="sortable-table">', TH, '<tbody>']
for i, t in enumerate(ALT_T, 6): L.append(row(BYSIDE[t], f'#{i}', 'badge-consensus'))
L += ['</tbody>', '</table></div>', '', '</div>', '</details>', '']
ps = re.search(r'(<a id="sc-pick-sheet"></a>.*?)\n</div>\n</details>\n\n<a id="sc-ranked"></a>', MD3, re.S)
if ps: L += [ps.group(1), '']
L += ['[⬆ Back to Top](#top5-portfolio)', '</div>', '</details>', '', '---', '']

# Section 2 matrix
L += ['<a id="contest-master-matrix"></a>', '## 2. Complete 15-Game SuperContest ATS Matrix (Spread-Only)', '', '<div class="rollup-controls">',
      '  <button class="btn-toggle btn-primary" onclick="toggleRollups(\'section-matrix\', true)">Expand Section 2</button>',
      '  <button class="btn-toggle" onclick="toggleRollups(\'section-matrix\', false)">Collapse Section 2</button>', '</div>', '',
      '<details class="rollup-box section-main section-matrix" id="section-2-box" open>',
      '<summary>📊 Section 2: Complete Locked Spread Matrix, Market Lines &amp; Value Differentials</summary>', '<div class="rollup-content">', '',
      'All 15 Sunday/Monday games (TNF is final), showing the higher-scoring side of each game. Lines run **Tuesday Open → Contest → Saturday Market → Movement** *(💡 Click any column header to sort)*:', '',
      '<div class="table-responsive"><table class="sortable-table">', TH, '<tbody>']
best = {}
for s in live:
    if s['gid'] not in best or s['rank'] < best[s['gid']]['rank']: best[s['gid']] = s
for s in sorted(best.values(), key=lambda s: s['rank']):
    tag = '⭐ ' if s['side'] in FIVE_T else ('🔁 ' if s['side'] in ALT_T else '')
    L.append(row(s, f'{tag}#{s["rank"]}', 'badge-best' if s['side'] in FIVE_T else 'badge-consensus', rid=False))
L += ['</tbody>', '</table></div>', '']
other = [s for s in live if s['side'] in FIVE_T and best[s['gid']]['side'] != s['side']]
if other:
    L += ['> **Note:** ' + '; '.join(f"{s['side']} {pl(s['lc'])} is in the Top 5 but ranks below its opponent here (#{s['rank']} vs #{best[s['gid']]['rank']})" for s in other) + '.', '']
L += ['[⬆ Back to Top](#top5-portfolio)', '</div>', '</details>', '', '---', '']

# Section 3 experts
L += ['<a id="expert-panel"></a>', '## 3. Expert Panel Contest Five Showdown', '', '<div class="rollup-controls">',
      '  <button class="btn-toggle btn-primary" onclick="toggleRollups(\'section-experts\', true)">Expand Section 3</button>',
      '  <button class="btn-toggle" onclick="toggleRollups(\'section-experts\', false)">Collapse Section 3</button>', '</div>', '',
      '<details class="rollup-box section-main section-experts" id="section-3-box" open>',
      '<summary>👥 Section 3: Expert Panel Contest Card Showdown (' + ', '.join(html.escape(n) for _, n, _ in EXP[:6]) + ', Platinum Rose)</summary>',
      '<div class="rollup-content">', '', 'Direct comparison of the Week 3 spread and moneyline picks from the shows and writers we track:', '',
      '<div style="background:#f8fafc; border-left:4px solid #2563eb; padding:12px 16px; margin-bottom:18px; border-radius:6px; font-size:13px; color:#334155; line-height:1.5;">',
      '  <strong>💡 Source Verification:</strong><br>', '  Picks come from the Week 3 build\'s expert extraction (podcasts, articles, YouTube digest). Moneyline picks count as the side. Multi-writer outlets can appear on both sides of a game.', '</div>', '']
L += ['<a id="expert-ai"></a>', '### 1. Platinum Rose Top 5 (Draft Card, Contest Lines)']
for t in five_sorted:
    s = BYSIDE[t]; n = NOW.get(s['gid'], {}).get(t)
    L.append(f'* {tl(t)} <a href="#sc-game-{slug(s["gid"])}" class="table-link"><strong>{full(t)} {pl(s["lc"])}</strong></a> (Rank {s["rank"]} of 30 / {f(s["lc"] - n) if n is not None else "—"} vs BKR {pl(n) if n is not None else "—"} / {s["nf"]}-{s["na"]} experts)')
L.append(f'* Alternate on the card: {tl(ALT_T[0])} **{full(ALT_T[0])} {pl(BYSIDE[ALT_T[0]]["lc"])}**')
L.append('')
for i, (sid, n, ss) in enumerate(EXP, 2):
    L += [f'<a id="{sid}"></a>', f'### {i}. {html.escape(n)}']
    for t in ss:
        s = BYSIDE.get(t)
        if not s: continue
        mark = ' — ⭐ **in our Top 5**' if t in FIVE_T else (' — ⚠️ **against our Top 5**' if s['opp'] in FIVE_T else (' — 🔁 alternate' if t in ALT_T else ''))
        res = f' — {"✅" if s["result"] == "Win" else "❌"} final' if s['result'] else ''
        L.append(f'* {tl(t)} <a href="#sc-game-{slug(s["gid"])}" class="table-link"><strong>{full(t)} {pl(s["lc"])}</strong></a> (contest line){mark}{res}')
    L.append('')
widest = sorted(live, key=lambda s: s['nf'] - s['na'], reverse=True)[:3]
L += ['### 🌟 Panel Consensus Takeaways:']
L += [f'* **{s["side"]} {pl(s["lc"])}** has the widest expert edge ({s["nf"]} vs {s["na"]})' + (' and is in our Top 5.' if s['side'] in FIVE_T else ' — ' + ('an alternate.' if s['side'] in ALT_T else 'not on the card.')) for s in widest]
against = [BYSIDE[t] for t in five_sorted if BYSIDE[t]['na'] > BYSIDE[t]['nf']]
if against: L.append('* **Top 5 sides the panel leans against:** ' + ', '.join(f"{s['side']} {pl(s['lc'])} ({s['nf']} vs {s['na']})" for s in against) + ' — agreement is a tiebreaker, not a reason.')
L += ['', '[⬆ Back to Top](#top5-portfolio)', '</div>', '</details>', '', '---', '']

# Section 4 dossier: reuse the Week 3 game breakdowns, with a line-trajectory line added to each game
sec4 = MD3[MD3.index('<details class="rollup-box sc-game" id="sc-game-atl-gb">'):MD3.index('<a id="sc-review"></a>')]
sec4 = sec4.rstrip()
sec4 = sec4[:sec4.rstrip().rfind('</div>\n</details>')].rstrip()
def traj(m):
    gs = m.group(1); g = next((x for x in best if slug(x) == gs), None)
    head = m.group(0)
    if not g: return head
    a, h = g.split('@'); fav = a if (NOW[g][a] < 0) else h
    o = OPEN[g][fav]; n = NOW[g][fav]; lc = BYSIDE[fav]['lc']
    s = best[g]; v = s['lc'] - NOW[g][s['side']]
    return head + f'\n\n* **Line Trajectory:** Open (Tue): {fav} {pl(o)} | Contest: {fav} {pl(lc)} | Market (Sat 10:59 PM): {fav} {pl(n)} | Contest vs market for {s["side"]}: {f(v)} pts{" (" + key_note(s["lc"], NOW[g][s["side"]]) + ")" if key_note(s["lc"], NOW[g][s["side"]]) else ""}\n* **SuperContest Lean:** **{full(s["side"])} {pl(s["lc"])}** (Rank #{s["rank"]}{", ⭐ Top 5" if s["side"] in FIVE_T else ", 🔁 alternate" if s["side"] in ALT_T else ""})\n'
sec4 = re.sub(r'<details class="rollup-box sc-game" id="sc-game-([a-z]+-[a-z]+)">\n<summary>.*?</summary>\n<div class="rollup-content">', traj, sec4)
sec4 = re.sub(r'class="rollup-box sc-game" (id="sc-game-[a-z]+-[a-z]+")>', r'class="rollup-box section-games" \1 open>', sec4)
L += ['<a id="game-by-game-ats"></a>', '## 4. Game-by-Game Spread-Only Analytical Dossier (All 16 Games)', '', '<div class="rollup-controls">',
      '  <button class="btn-toggle btn-primary" onclick="toggleRollups(\'section-dossier\', true)">Expand Section 4</button>',
      '  <button class="btn-toggle" onclick="toggleRollups(\'section-dossier\', false)">Collapse Section 4</button>',
      '  <button class="btn-toggle" onclick="toggleRollups(\'section-games\', true)">Expand All 16 Matchups</button>',
      '  <button class="btn-toggle" onclick="toggleRollups(\'section-games\', false)">Collapse All 16 Matchups</button>', '</div>', '',
      '<details class="rollup-box section-main section-dossier" id="section-4-box" open>',
      '<summary>🔍 Section 4: Game-by-Game Spread-Only Analytical Dossier (All 16 Games)</summary>', '<div class="rollup-content">', '', sec4, '',
      '[⬆ Back to Top](#top5-portfolio)', '</div>', '</details>', '', '---', '']

# Section 5 golden rules
fv = sorted(free_now, key=lambda s: -(s['lc'] - NOW[s['gid']][s['side']]))
worse5 = [BYSIDE[t] for t in five_sorted if BYSIDE[t]['lc'] - NOW[BYSIDE[t]['gid']][t] < 0]
flat = [BYSIDE[t] for t in five_sorted + ALT_T if float(BYSIDE[t]['lc']).is_integer()]
L += ['<a id="strategy-guide"></a>', '## 5. Strategic Playbook: The 3 Golden Rules of SuperContest Success', '', '<div class="rollup-controls">',
      '  <button class="btn-toggle btn-primary" onclick="toggleRollups(\'section-strategy\', true)">Expand Section 5</button>',
      '  <button class="btn-toggle" onclick="toggleRollups(\'section-strategy\', false)">Collapse Section 5</button>', '</div>', '',
      '<details class="rollup-box section-main section-strategy" id="section-5-box" open>',
      '<summary>📐 Section 5: The 3 Golden Rules of SuperContest Success</summary>', '<div class="rollup-content">', '',
      '### 1. Free Points on Locked Lines',
      '* Contest lines lock early in the week; injury news and money move the market for free.',
      '* **Week 3 free points vs BKR tonight:** ' + (', '.join(f"**{s['side']} {pl(s['lc'])}** (market {pl(NOW[s['gid']][s['side']])})" for s in fv) or 'none') + '.',
      '* **Counter-examples in our Top 5:** ' + (', '.join(f"**{s['side']} {pl(s['lc'])}** is worse than BKR's {pl(NOW[s['gid']][s['side']])}" + (f" ({key_note(s['lc'], NOW[s['gid']][s['side']])})" if key_note(s['lc'], NOW[s['gid']][s['side']]) else '') for s in worse5) or 'none') + '.', '',
      '### 2. The Half-Point Hook — Only When It\'s Free',
      '* Margins of **3 and 7** are the most common NFL results. Week 2\'s GB −3.5 lost by exactly the hook.',
      '* Paying a half point through 3 or 7 needs a clearly stronger case; getting it free from the market is the edge.', '',
      '### 3. The 3.0 &amp; 7.0 Safety Net (Push Economics)',
      '* On flat numbers a landing on the number scores **0.5 points** instead of 0.',
      '* This week\'s flat numbers on the card: ' + (', '.join(f"**{s['side']} {pl(s['lc'])}**" for s in flat) or 'none') + '.', '',
      '**Rules of thumb we carry forward:**', '',
      '- **Contest-vs-market value first.** Prefer sides where the contest gives more points than the market does now.',
      '- **Respect 3 and 7.** A contest line worse than the market by a half point around those numbers needs a clearly stronger case.',
      '- **Spread the risk.** Avoid stacking picks that all need the same thing to happen.',
      '- **Agreement is a tiebreaker, not a reason.** Heavy public agreement can already be priced into the market line.', '',
      '[⬆ Back to Top](#top5-portfolio)', '</div>', '</details>', '']
disc = re.search(r'(<a id="disclaimer"></a>\n<div class="legal-disclaimer".*?</div>)', MD3, re.S)
if disc: L += ['---', '', disc.group(1), '']
out = D / 'nfl_week3_supercontest_intelligence_summary_w2style.md'
out.write_text('\n'.join(L), encoding='utf-8')
print('wrote', out, len(L), 'lines; top5', five_sorted, 'alts', ALT_T, 'experts', len(EXP), 'games', len(GAMEBLK))
sys.path.insert(0, str(ROOT / 'scripts/master-intel'))
import convert_summary
convert_summary.generate_html(str(out), str(out.with_suffix('.html')))
convert_summary.generate_docx(str(out), str(out.with_suffix('.docx')))
print('html + docx done')
