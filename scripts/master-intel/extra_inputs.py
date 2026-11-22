"""Extra structured inputs for build.py (added 2026-11-21, Andy request).

1. merge_reviewed_podcasts: fold data/intel/articles/{season}-w{WW}/reviewed-podcast-picks.json (timestamped podcast
   calls reviewed by Antigravity/Claude) into the YouTube pick pool, in the flat schema build.py already normalizes.
   Rows are de-duplicated per (speaker, game, pick); rows with no speaker are labeled when their episode maps to exactly
   one reviewed analyst.
2. load_context + panel: per-game "Model, sim & conditions" panel from the fair-line model, the latest margin simulation,
   the venue weather review, the manual QB-starter file and Andy's QB caveat tags. These were previously text-only.
"""
import collections, glob, html, json, os, re

ALIAS = {'WSH': 'WAS', 'JAC': 'JAX', 'LVR': 'LV'}


def _j(path, default=None):
    try:
        with open(path, encoding='utf-8') as f: return json.load(f)
    except (OSError, ValueError): return default


def _norm(gid):
    a, _, h = str(gid or '').partition('@')
    return f"{ALIAS.get(a, a)}@{ALIAS.get(h, h)}" if h else str(gid or '')


def _sched_ids(root, season, ww):
    d = _j(os.path.join(root, 'public/schedule.json'), {}) or {}
    rows = d.get('games', d) if isinstance(d, dict) else d
    out = {}
    for g in rows or []:
        if str(g.get('week')) == str(int(ww)) and str(g.get('season', season)) == str(season):
            gid = f"{g['visitor']}@{g['home']}"; out[_norm(gid)] = gid
    return out


def _vid(url):
    m = re.search(r'(?:v=|youtu\.be/)([\w-]{6,})', url or '')
    return m.group(1) if m else None


def _pick_text(p):
    mk, sd, ln = str(p.get('market') or ''), str(p.get('side') or ''), p.get('line')
    if mk in ('total', 'game_total'):
        return f"{'Under' if sd.upper().startswith('U') else 'Over'} {ln if ln is not None else ''}".strip()
    if mk in ('spread', 'teaser') and not p.get('player'):
        return f"{sd or p.get('team') or ''} {('%+g' % ln) if isinstance(ln, (int, float)) else (ln or '')}".strip()
    return ' '.join(str(x) for x in (p.get('player') or p.get('team'), mk.replace('_', ' '), sd, ln) if x not in (None, ''))


def merge_reviewed_podcasts(yt, root, season, ww, gaps):
    path = os.path.join(root, f'data/intel/articles/{season}-w{int(ww)}/reviewed-podcast-picks.json')
    d = _j(path)
    if not d:
        gaps.append(f'No reviewed podcast picks file ({os.path.relpath(path, root)}).'); return yt
    yt = yt or {}; picks = yt.setdefault('picks', [])
    sched = _sched_ids(root, season, ww)
    # label speaker-less rows whose episode maps to exactly one reviewed analyst
    by_vid = {}
    for s in d.get('sources', []):
        v = _vid(s.get('url'))
        if v: by_vid.setdefault(v, set()).add(s.get('analyst'))
    labeled = 0
    for p in picks:
        if not p.get('speaker'):
            v = str(p.get('episode') or '').replace('youtube-', '') or _vid(p.get('timestamp_url'))
            names = by_vid.get(v) or set()
            if len(names) == 1:
                p['speaker'] = next(iter(names)); labeled += 1
    seen = {(p.get('speaker'), _norm(p.get('game')), (p.get('pick') or _pick_text(p.get('raw') or p)).lower()) for p in picks}
    added = dup = 0
    for s in d.get('sources', []):
        spk, show, url = s.get('analyst') or 'Unknown Expert', s.get('outlet') or 'Podcast', s.get('url') or ''
        v = _vid(url)
        rows = [dict(x, _kind='game') for x in s.get('game_picks') or []] + [dict(x, _kind='prop') for x in s.get('picks') or []]
        for x in rows:
            gid = sched.get(_norm(x.get('game')), x.get('game'))
            if x['_kind'] == 'game':
                mk = x.get('market'); sd = x.get('side')
                team = sd if mk in ('spread', 'moneyline') else x.get('team')
                r = dict(team=team, player=None, market=mk, side=sd, line=x.get('line'), price=x.get('posted_price'))
            else:
                r = dict(team=x.get('team'), player=x.get('player'), market=x.get('selection') or x.get('market') or 'prop',
                         side=x.get('side') or '', line=x.get('line'), price=x.get('posted_price'))
            key = (spk, _norm(gid), _pick_text(r).lower())
            if key in seen: dup += 1; continue
            seen.add(key)
            ts = int(x.get('timestamp_seconds') or 0)
            tsu = x.get('timestamp_url') or (f'https://www.youtube.com/watch?v={v}&t={ts}s' if v else url)
            picks.append(dict(r, game=gid, week=int(ww), speaker=spk, show=show, episode=(f'youtube-{v}' if v else url),
                              source_timestamp=ts, timestamp_url=tsu, rationale=x.get('why') or '', verify=None,
                              label=x.get('label'), source_pipeline='reviewed_podcast_picks'))
            added += 1
    gaps.append(f'Reviewed podcast picks merged into the expert pool: {added} rows from {len(d.get("sources", []))} shows'
                + (f', {dup} duplicates skipped' if dup else '') + (f', {labeled} unnamed extraction rows labeled from the reviewed episode' if labeled else '') + '.')
    return yt


def load_context(root, season, ww, gaps):
    W = int(ww)
    ctx = {'fair': {}, 'sim': {}, 'sim_meta': {}, 'recs': {}, 'sc': {}, 'wx': {}, 'wx_meta': {}, 'qb': {}, 'caveat': {}, 'root': root, 'season': season, 'ww': W}
    f = _j(os.path.join(root, f'reports/intel/w{W}-model/fair-lines-w{W}.json'))
    if f:
        ctx['fair'] = {_norm(g['game']): g for g in f.get('games', [])}; ctx['fair_meta'] = f.get('meta', {}); ctx['fair_path'] = f'reports/intel/w{W}-model/fair-lines-w{W}.json'
    else: gaps.append(f'No fair-line model file (reports/intel/w{W}-model/fair-lines-w{W}.json).')
    sims = sorted(glob.glob(os.path.join(root, f'reports/intel/w{W}-model/sim-w{W}-*.json')), key=os.path.getmtime)
    if sims:
        s = _j(sims[-1], {}) or {}
        ctx['sim'] = {_norm(k): v for k, v in (s.get('games') or {}).items()}
        ctx['sim_meta'] = dict(path=os.path.relpath(sims[-1], root).replace('\\', '/'), at=s.get('generated_at'), method=s.get('method'))
        for r in s.get('recs', []): ctx['recs'].setdefault(_norm(r['game']), []).append(r)
        for r in s.get('supercontest', []): ctx['sc'].setdefault(_norm(r['game']), []).append(r)
    else: gaps.append(f'No margin simulation file (reports/intel/w{W}-model/sim-w{W}-*.json); game panels show the model only.')
    w = _j(os.path.join(root, f'data/research-intel/review/{season}-w{W}-weather-venue.json'))
    if w:
        ctx['wx'] = {_norm(r['game']): r for r in w.get('rows', [])}; ctx['wx_meta'] = dict(at=w.get('captured_at'), provider=w.get('provider'))
    q = _j(os.path.join(root, f'data/projected-starters/{season}/manual/qb-starters-{season}-w{W}.json'))
    for p in (q or {}).get('players', []):
        if p.get('position') == 'QB' and p.get('role') == 'starter': ctx['qb'][ALIAS.get(p['team'], p['team'])] = p
    m = _j(os.path.join(root, f'data/generated/master-intel/w{W}-gate-manual.json'), {}) or {}
    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k == 'caveat_tags' and isinstance(v, dict): ctx['caveat'].update({ALIAS.get(t, t): c for t, c in v.items()})
                else: walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(m)
    return ctx



MATCH_ROWS = [  # (label, offense key, defense key, kind)
    ('EPA per play', 'off_epa', 'def_epa', 'epa'), ('Pass EPA per dropback', 'off_pass', 'def_pass', 'epa'),
    ('Rush EPA per carry', 'off_rush', 'def_rush', 'epa'), ('Success rate', 'off_succ', 'def_succ', 'pct'),
    ('Explosive play rate', 'off_exp', 'def_exp', 'pct'), ('Third/fourth-down conversion', 'off_conv', 'def_conv', 'pct'),
    ('Pressure rate (allowed / generated)', 'off_press', 'def_press', 'pct'), ('Sack rate (allowed / generated)', 'off_sack', 'def_sack', 'pct'),
    ('Turnover rate (giveaways / takeaways)', 'off_to', 'def_to', 'pct'), ('Plays per game', 'plays', None, 'num'),
]


def _matchup_table(m):
    if not m or not m.get('teams'): return ''
    a, h = m['away'], m['home']; T, RK = m['teams'], m.get('ranks') or {}
    if not T.get(a) or not T.get(h): return ''
    e = html.escape
    def cell(team, key, kind):
        if key is None: return '<td></td>'
        v = (T.get(team) or {}).get(key)
        if v is None: return '<td>—</td>'
        txt = f'{v:+.3f}' if kind == 'epa' else (f'{v:.1f}%' if kind == 'pct' else f'{v:.1f}')
        r = (RK.get(team) or {}).get(key)
        return f'<td>{txt} <small style="opacity:.65">#{r}</small></td>' if r else f'<td>{txt}</td>'
    def edge(off, dfn, ok, dk):
        if dk is None: return '<td></td>'
        ro, rd = (RK.get(off) or {}).get(ok), (RK.get(dfn) or {}).get(dk)
        if not ro or not rd: return '<td></td>'
        if ro + 8 <= rd: return f'<td><b>{e(off)} O</b></td>'
        if rd + 8 <= ro: return f'<td><b>{e(dfn)} D</b></td>'
        return '<td style="opacity:.6">even</td>'
    head = (f'<tr><th style="text-align:left">Matchup (rank 1 = best of 32)</th><th>{e(a)} offense</th><th>{e(h)} defense</th><th>Edge</th>'
            f'<th>{e(h)} offense</th><th>{e(a)} defense</th><th>Edge</th></tr>')
    body = ''.join(f'<tr><td style="text-align:left">{e(lbl)}</td>{cell(a, ok, kind)}{cell(h, dk, kind)}{edge(a, h, ok, dk)}'
                   f'{cell(h, ok, kind)}{cell(a, dk, kind)}{edge(h, a, ok, dk)}</tr>' for lbl, ok, dk, kind in MATCH_ROWS)
    return ('<details style="margin-top:6px"><summary><b>Matchup analytics table</b> (FTN team tables through Week 9; edge = unit ranks at least 8 places apart)</summary>'
            '<div style="overflow-x:auto"><table style="font-size:.82rem; width:100%; border-collapse:collapse; text-align:center">'
            + head + body + '</table></div></details>')

def _short(note, n=150):
    note = re.split(r'\s+(?:Venue per|Source:|per FOX)', str(note or ''))[0].strip()
    return note if len(note) <= n else note[:n].rsplit(' ', 1)[0] + '…'


def _side(home, away, line):
    if line is None: return '—'
    return f'{home} {line:+g}' if line <= 0 else f'{away} {-line:+g}'


def panel(ctx, gid, away, home):
    if not ctx: return []
    k = _norm(gid); e = html.escape; pct = lambda x: f'{100 * x:.1f}%'
    a, h = ALIAS.get(away, away), ALIAS.get(home, home)
    rows = []
    f, s = ctx['fair'].get(k), ctx['sim'].get(k)
    if f:
        rows.append(f"<b>Model</b> (SRS/DVOA/net YPP, no QB, injury or weather adjustments): {e(_side(h, a, round(f['model_home_line'], 1)))}, "
                    f"total {2 * f['fair_total'] - f['market_total']:.1f}. Fair line (half-shrunk to Thursday's market) {e(_side(h, a, round(f['fair_home_line'], 1)))}, fair total {f['fair_total']:.1f}.")
    if s:
        rows.append(f"<b>Sim</b> (centered halfway between the market {e(_side(h, a, s['market_line']))} and the model = {e(_side(h, a, round(s['center_line'], 1)))}, then blended 50/50 with the market's own probability): "
                    f"{e(_side(h, a, s['market_line']))} covers {pct(s['home_cover_xp'] if s['market_line'] <= 0 else s['away_cover_xp'])}, "
                    f"Over {s['market_total']:g} {pct(s['over_xp'])} / Under {pct(s['under_xp'])} (pushes excluded). {e(h)} wins outright {pct(s['home_win'])}.")
        an = s.get('analytics')
        if an:
            mside = s['market_line']
            hc = an['home_cover_xp']
            rows.append(f"<b>Matchup analytics</b> (FTN EPA per play, offense vs opposing defense, through Week 9, regressed halfway to league average): "
                        f"projects {e(a)} {an['away_pts']:.1f}, {e(h)} {an['home_pts']:.1f} ({e(_side(h, a, round(an['proj_home_line'], 1)))}), total {an['proj_total']:.1f}. "
                        f"Same sim steps: {e(_side(h, a, mside))} covers {pct(hc if mside <= 0 else 1 - hc)}, Over {s['market_total']:g} {pct(an['over_xp'])}. Sensitivity only; weights untested.")
    for r in ctx['recs'].get(k, []):
        tag = 'Platinum Rose pick' if r['kind'] == 'pick' else 'Lean'
        sd = r['side'].title() if r['side'] in ('over', 'under') else (a if r['side'] == 'away' else h)
        ln = f"{r['line']:g}" if r['side'] in ('over', 'under') else ('%+g' % (-r['line'] if r['side'] == 'away' else r['line']))
        rows.append(f"<b>{tag}</b> {e(sd)} {e(ln)} ({r['price']:+d}): sim {pct(r['p_cover_xp'])} vs {pct(r['break_even'])} break-even"
                    + (' <i>(no model edge)</i>' if r['edge_pct'] < 0 else '')
                    + (f"; matchup analytics {pct(r['analytics_p_cover_xp'])}" if r.get('analytics_p_cover_xp') is not None else '') + '.')
    for r in ctx['sc'].get(k, []):
        rows.append(f"<b>SuperContest</b> {e(r['pick'])}: {r['exp_points']:.3f} expected points (wins {pct(r['p_win'])}, pushes {pct(r['p_push'])})"
                    + (f"; matchup analytics {r['analytics_exp_points']:.3f}" if r.get('analytics_exp_points') is not None else '') + '.')
    wx = ctx['wx'].get(k)
    if wx and wx.get('temp_c') is None:
        rows.append(f"<b>Weather</b>: {e(_short(wx.get('note')) or 'indoor or no reading')} · impact: {e(str(wx.get('materiality') or 'n/a'))}.")
    elif wx:
        tf = wx['temp_c'] * 9 / 5 + 32; mph = lambda x: x * 0.621371
        rows.append(f"<b>Weather</b> ({e(str(str(ctx['wx_meta'].get('provider') or 'Open-Meteo').split(',')[0]))}, kickoff hour): {tf:.0f}°F, {wx['precip_prob_pct']}% rain chance, "
                    f"wind {mph(wx['wind_kmh']):.0f} mph, gusts {mph(wx['gust_kmh']):.0f} mph · {e(_short(wx.get('note')))} · impact: {e(str(wx.get('materiality') or 'n/a'))}.")
    qbs = []
    for t in (a, h):
        p = ctx['qb'].get(t)
        if p: qbs.append(f"{e(t)} {e(p['player_name'])} (starter confidence {p.get('starter_confidence', 0):.0%})")
        if t in ctx['caveat']: qbs.append(f"<b>CAVEAT {e(t)}:</b> {e(ctx['caveat'][t])}")
    if qbs: rows.append('<b>QB file</b> (manual Week 11 corrections): ' + ' · '.join(qbs) + '.')
    if not rows: return []
    gl = gtmh_line(ctx.get('root', ''), ctx.get('season', 2026), ctx.get('ww', 11), gid) if ctx.get('root') else ''
    if gl: rows.append(gl)
    tbl = _matchup_table(s.get('matchup')) if s else ''
    if tbl: rows.append(tbl)
    src = ctx.get('sim_meta', {}).get('path') or 'no sim file'
    return ['<div class="gs-model no-bm" style="background: var(--bg); border: 1px solid var(--border); border-left: 5px solid var(--accent); padding: 10px 14px; border-radius: 10px; margin: 6px 0 12px; font-size: 0.88rem; line-height: 1.5;">',
            '<div style="font-weight:600; margin-bottom:4px;">Model, sim &amp; conditions</div>'] + [f'<div>{r}</div>' for r in rows] + \
           [f'<div style="opacity:.7; font-size:.8rem; margin-top:4px;">Sources: {e(ctx.get('fair_path') or 'fair-line model')} and {e(src)}; weather and QB files. After both shrink steps the market carries about three-quarters of the weight and the model about one-quarter.</div>', '</div>', '']


# ---------------------------------------------------------------- Gun to my head (docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md)
_TIER_CLS = {'Strong lean': 'strong', 'Lean': 'lean', 'Coin flip': 'coin', 'Official pick': 'official'}
_GTMH_CSS = """<style>
.gtmh-filter input{position:absolute;opacity:0;pointer-events:none}
.gtmh-filter label{display:inline-block;margin:0 6px 8px 0;padding:4px 12px;border:1px solid var(--border);border-radius:999px;font-size:.85rem;cursor:pointer}
.gtmh-filter input:checked+label{background:var(--accent);color:var(--bg);border-color:var(--accent)}
#gtmh-f-strong:checked~.gtmh-cards .gtmh-card:not([data-tiers~="strong"]),#gtmh-f-lean:checked~.gtmh-cards .gtmh-card:not([data-tiers~="lean"]),
#gtmh-f-coin:checked~.gtmh-cards .gtmh-card:not([data-tiers~="coin"]),#gtmh-f-official:checked~.gtmh-cards .gtmh-card:not([data-tiers~="official"]){display:none}
.gtmh-card{border:1px solid var(--border);border-radius:10px;margin:0 0 10px;padding:6px 12px}
.gtmh-card>summary{cursor:pointer;font-size:.92rem;line-height:1.5}
.gtmh-badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:.75rem;font-weight:700;border:1px solid var(--border);margin:0 4px}
.gtmh-badge.t-strong{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.gtmh-badge.t-lean{border-color:var(--accent)}
.gtmh-badge.t-coin{opacity:.75}
.gtmh-badge.t-official{background:#c9a227;color:#111;border-color:#c9a227}
.gtmh-mkt{margin:8px 0 10px;padding-left:10px;border-left:3px solid var(--border);font-size:.88rem;line-height:1.5}
.gtmh-mkt ul{margin:2px 0 4px 18px;padding:0}
.gtmh-small{opacity:.75;font-size:.8rem}
</style>"""


def _gtmh_load(root, season, ww):
    return _j(os.path.join(root, f'data/research-intel/review/{season}-w{int(ww):02d}-gun-to-my-head.json'))


def _pt(iso):
    import datetime
    try:
        t = datetime.datetime.fromisoformat(str(iso).replace('Z', '+00:00')) - datetime.timedelta(hours=8)
        return t.strftime('%a %I:%M %p').replace(' 0', ' ') + ' PT'
    except (TypeError, ValueError): return ''


def _gtmh_block(c):
    e = html.escape; mk = 'Side' if c['market'] == 'side' else 'Total'; t = c['tier']
    head = (f"<b>{mk}</b> <span class=\"gtmh-badge t-{_TIER_CLS.get(t, 'lean')}\">{e(t)}</span> <b>{e(c['call'] if c['call'] != 'Coin flip' else 'No side named')}</b>"
            + (f" · {e(c['holds_to'])}" if c.get('holds_to') else ''))
    out = [f'<div class="gtmh-mkt">{head}']
    if c.get('books'): out.append('<div class="gtmh-small">' + ' &nbsp;|&nbsp; '.join(e(b) for b in c['books']) + '</div>')
    if c.get('note'): out.append(f"<div class=\"gtmh-small\">{e(c['note'])}</div>")
    out.append(f"<div><b>Why:</b> {e(c['why'])}</div>")
    if c['call'] == 'Coin flip':
        out.append('<div><b>What would tip it:</b><ul>' + ''.join(f'<li>{e(x)}</li>' for x in c.get('tips', [])) + '</ul></div>')
        for side, pts in (c.get('best_case') or {}).items():
            out.append(f'<div><b>Best case for {e(side)}:</b><ul>' + ''.join(f'<li>{e(x)}</li>' for x in pts) + '</ul></div>')
    else:
        out.append('<div><b>For:</b><ul>' + ''.join(f'<li>{e(x)}</li>' for x in c.get('for') or ['—']) + '</ul></div>')
        out.append('<div><b>Against:</b><ul>' + ''.join(f'<li>{e(x)}</li>' for x in c.get('against') or ['—']) + '</ul></div>')
    if c.get('conditions'): out.append('<div><b>Check:</b> ' + ' '.join(e(x) for x in c['conditions']) + '</div>')
    off = e(c.get('official') or '') + (f" <b>{e(c['official_conflict'])}</b>" if c.get('official_conflict') else '') + (f" · SuperContest pitch: {e(c['supercontest'])}" if c.get('supercontest') else '')
    out.append(f'<div class="gtmh-small"><b>Official:</b> {off}</div></div>')
    return ''.join(out)


def _gslug(gid):
    return re.sub(r'[^a-z0-9]+', '-', str(gid).lower()).strip('-')


_BK = {'Bookmaker': 'BKR', 'BetOnline': 'BOL', 'DK Predictions': 'DKP'}


def _gtmh_quick(d):
    """Quick-reference header: every side call and every total call in two compact tables (kickoff order)."""
    e = html.escape
    def note(c):
        o = c.get('official') or ''
        if o.startswith('Official pick'): n = 'Official pick (Platinum Rose)'
        elif o.startswith('Card lean'): n = 'Card lean ' + o.split(':', 1)[-1].strip().split(' (')[0] + (' · <b>disagrees</b>' if c.get('official_conflict') else '')
        else: n = ''
        if c.get('supercontest'): n = (n + ' · ' if n else '') + 'SC: ' + e(c['supercontest'])
        if c.get('conditions'): n = (n + ' · ' if n else '') + '<i>conditional</i>'
        if c['call'] == 'Coin flip' and c.get('tips'): n = (n + ' · ' if n else '') + 'tips: ' + e(c['tips'][0])
        return n
    def best(c):
        b = c.get('best')
        if not b: return '—'
        ln = b['line']; ln = (('PK' if ln == 0 else f'{ln:+g}') if c['market'] == 'side' else f'{ln:g}')
        return f"{_BK.get(b['book'], b['book'])} {ln}" + (f" ({b['price']:+d})" if b.get('price') is not None else '')
    def table(market, title):
        rows = [c for c in d['calls'] if c['market'] == market]
        head = '<tr><th style="text-align:left">Game</th><th style="text-align:left">Call</th><th>Tier</th><th>Best fresh number</th><th style="text-align:left">Notes</th></tr>'
        body = ''.join(
            f'<tr><td style="text-align:left"><a href="#gtmh-{_gslug(c["game"])}">{e(c["game"].replace("@", " @ "))}</a> <small style="opacity:.65">{e(_pt(c.get("kickoff_utc")))}</small></td>'
            f'<td style="text-align:left"><b>{e(c["call"])}</b></td>'
            f'<td><span class="gtmh-badge t-{_TIER_CLS.get(c["tier"], "lean")}">{e(c["tier"])}</span></td>'
            f'<td>{e(best(c))}</td><td style="text-align:left">{note(c)}</td></tr>' for c in rows)
        return (f'<div style="font-weight:700;margin:10px 0 4px">{title} ({len(rows)})</div>'
                '<div style="overflow-x:auto"><table class="gtmh-quick-t" style="font-size:.85rem;width:100%;border-collapse:collapse;text-align:center">' + head + body + '</table></div>')
    return ('<div class="gtmh-quick"><div style="font-weight:700;font-size:1rem;margin-top:6px">Quick reference</div>'
            '<div class="gtmh-small">Every call at a glance, grouped by market in kickoff order. Tap a game for its full card below (why, for and against, prices, conditions).</div>'
            + table('side', 'All sides') + table('total', 'All totals') + '</div>')


def gtmh_section_full(root, season, ww):  # superseded 2026-11-21 22:15 (Andy: matchup cards)
    d = _gtmh_load(root, season, ww)
    if not d or not d.get('calls'): return []
    e = html.escape; by = {}
    for c in d['calls']: by.setdefault(c['game'], []).append(c)
    tc = d.get('tier_counts', {}); n = len(d['calls'])
    cards = []
    for gid, cs in by.items():
        cs = sorted(cs, key=lambda c: c['market'] != 'side')
        tiers = ' '.join(sorted({_TIER_CLS.get(c['tier'], 'lean') for c in cs}))
        summ = f"<b>{e(gid.replace('@', ' @ '))}</b> · {e(_pt(cs[0].get('kickoff_utc')))} — " + ' · '.join(
            f"{'Side' if c['market'] == 'side' else 'Total'}: " + ('' if c['call'] == 'Coin flip' else f"<b>{e(c['call'])}</b> ") + f"<span class=\"gtmh-badge t-{_TIER_CLS.get(c['tier'], 'lean')}\">{e(c['tier'])}</span>" for c in cs)
        cards.append(f'<details class="gtmh-card" id="gtmh-{_gslug(gid)}" data-tiers="{tiers}"><summary>{summ}</summary>' + ''.join(_gtmh_block(c) for c in cs)
                     + '<div class="gtmh-small">Lean · No Platinum Rose endorsement</div></details>')
    gate = d.get('official_gate') or {}
    intro = (f"Every game gets a side call (spread) and a total call: {n} calls. These are the AI's most probable choices when forced to pick, "
             f"not recommendations: <b>Lean · No Platinum Rose endorsement</b>, no stake, and no path to the card, SuperContest or My Card. "
             f"Seven evidence families vote (model sim, market movement, money, FTN matchup analytics, availability, experts, situational). "
             f"<b>Strong lean</b>: 3+ agree and none disagree. <b>Lean</b>: more for than against, or a Strong lean with an open condition. "
             f"<b>Coin flip</b>: no side is named; the card says what would tip it. Built {e(str(d.get('as_of'))[:16].replace('T', ' '))} PT from the 5:43 PM Bookmaker and 5:46 PM BetOnline captures"
             + (f"; the official gate is {e(str(gate.get('verdict')))} ({e(', '.join(gate.get('failing') or []))}), so these calls are provisional too" if gate.get('verdict') not in (None, 'PASS', 'GREEN') else '')
             + '. Every call is logged in a separate grading ledger.')
    quick = _gtmh_quick(d)
    filt = ('<div class="gtmh-filter">'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-all" checked><label for="gtmh-f-all">All games</label>'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-strong"><label for="gtmh-f-strong">Strong lean ({tc.get("Strong lean", 0)})</label>'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-lean"><label for="gtmh-f-lean">Lean ({tc.get("Lean", 0)})</label>'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-coin"><label for="gtmh-f-coin">Coin flip ({tc.get("Coin flip", 0)})</label>'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-official"><label for="gtmh-f-official">Official pick ({tc.get("Official pick", 0)})</label>'
            '<div class="gtmh-cards">' + ''.join(cards) + '</div></div>')
    return ['', '<details class="rollup-box section-rec no-bm" id="rec-gtmh">',
            f'<summary>🎯 Gun to my head: a side and a total call for every game ({n} calls · leans, no Platinum Rose endorsement)</summary>',
            '<div class="rollup-content">', '', ' '.join(_GTMH_CSS.split()), f'<p style="font-size:.9rem">{intro}</p>', quick, '', filt, '', '</div>', '</details>', '']


def gtmh_line(root, season, ww, gid):
    d = _gtmh_load(root, season, ww)
    cs = [c for c in (d or {}).get('calls', []) if _norm(c['game']) == _norm(gid)]
    if not cs: return ''
    e = html.escape
    return '<b>Gun to my head</b> (lean, no endorsement): ' + ' · '.join(
        (f"{'side' if c['market'] == 'side' else 'total'} <b>Coin flip</b>" if c['call'] == 'Coin flip' else f"{'side' if c['market'] == 'side' else 'total'} <b>{e(c['call'])}</b> ({e(c['tier'])})") for c in sorted(cs, key=lambda c: c['market'] != 'side')) + ' — <a href="#rec-gtmh">full card</a>.'


# ---- matchup-card layout (Andy 2026-11-21 22:13): logos, projected score, the two picks, the data backing each ----
_GTMH3_CSS = """<style>
.g3-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px;margin-top:8px}
.g3-card{border:1px solid var(--border);border-radius:12px;padding:12px 14px;background:var(--bg)}
.g3-hd{display:flex;align-items:center;justify-content:space-between;gap:8px}
.g3-team{display:flex;flex-direction:column;align-items:center;min-width:70px;font-weight:700;font-size:.9rem}
.g3-team .tl{width:44px;height:44px;margin:0 0 2px}
.g3-score{font-size:1.5rem;font-weight:800;line-height:1.1}
.g3-mid{text-align:center;font-size:.78rem;opacity:.75;line-height:1.35}
.g3-pick{margin-top:10px;padding-top:8px;border-top:1px solid var(--border);font-size:.86rem;line-height:1.45}
.g3-pick ul{margin:4px 0 2px 18px;padding:0}
.g3-pick li{margin:2px 0}
.g3-lbl{display:inline-block;min-width:44px;font-size:.72rem;font-weight:700;text-transform:uppercase;opacity:.7}
.g3-call{font-size:1.02rem;font-weight:800}
.g3-src{opacity:.55;font-size:.72rem}
.g3-note{font-size:.78rem;opacity:.8;margin-top:3px}
.gtmh-badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:.72rem;font-weight:700;border:1px solid var(--border);margin-left:6px;vertical-align:middle}
.gtmh-badge.t-strong{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.gtmh-badge.t-lean{border-color:var(--accent)}
.gtmh-badge.t-coin{opacity:.75}
.gtmh-badge.t-official{background:#c9a227;color:#111;border-color:#c9a227}
</style>"""
_FAM_SHORT = {'Model (double-shrunk sim)': 'Model', 'Market movement': 'Line move', 'Money signals': 'Money',
              'Matchup analytics (FTN EPA)': 'Matchup data', 'Availability': 'Injuries/QB', 'Expert consensus': 'Experts', 'Situational': 'Weather/spot'}


def _g3_bullet(txt):
    e = html.escape
    m = re.match(r'^(.*?): (.*?)(?: \[([^\]]*)\])?$', txt)
    if not m: return f'<li>{e(txt)}</li>'
    fam, body, src = m.group(1), m.group(2), m.group(3)
    return f'<li><b>{e(_FAM_SHORT.get(fam, fam))}:</b> {e(body)}' + (f' <span class="g3-src">[{e(src)}]</span>' if src else '') + '</li>'


def _g3_pick(c):
    e = html.escape; mk = 'Side' if c['market'] == 'side' else 'Total'; tc = _TIER_CLS.get(c['tier'], 'lean')
    if c['call'] == 'Coin flip':
        out = [f'<div class="g3-pick"><span class="g3-lbl">{mk}</span> <span class="g3-call">No pick</span><span class="gtmh-badge t-coin">Coin flip</span>',
               f'<div class="g3-note">{e(c["why"])}</div><ul>' + ''.join(f'<li>{e(t)}</li>' for t in c.get('tips') or []) + '</ul></div>']
        return ''.join(out)
    b = c.get('best') or {}
    best = (f"{_BK.get(b.get('book'), b.get('book'))} " + (('PK' if b['line'] == 0 else f"{b['line']:+g}") if c['market'] == 'side' else f"{b['line']:g}")
            + (f" ({b['price']:+d})" if b.get('price') is not None else '')) if b else ''
    sim = (f"sim {100 * c['sim_p']:.1f}% vs {100 * c['break_even']:.1f}% break-even") if c.get('sim_p') is not None and c.get('break_even') else ''
    meta = ' · '.join(x for x in (f'best {best}' if best else '', sim, c.get('holds_to') if c['tier'] != 'Official pick' else '') if x)
    out = [f'<div class="g3-pick"><span class="g3-lbl">{mk}</span> <span class="g3-call">{e(c["call"])}</span><span class="gtmh-badge t-{tc}">{e(c["tier"])}</span>']
    if meta: out.append(f'<div class="g3-note">{e(meta)}</div>')
    out.append('<ul>' + ''.join(_g3_bullet(x) for x in (c.get('for') or [])) + '</ul>')
    against = [x for x in (c.get('against') or []) if not x.startswith('No specific counter-case')]
    if against: out.append(f'<div class="g3-note"><b>Against:</b> ' + e(re.sub(r' \[[^\]]*\]$', '', against[0])) + '</div>')
    if c.get('official_conflict'): out.append(f'<div class="g3-note"><b>{e(c["official_conflict"])}</b> ({e(c.get("official", ""))})</div>')
    if c.get('note'): out.append(f'<div class="g3-note">{e(c["note"])}</div>')
    out.append('</div>')
    return ''.join(out)


def gtmh_section(root, season, ww):
    d = _gtmh_load(root, season, ww)
    if not d or not d.get('calls'): return []
    e = html.escape; W = int(ww)
    sims = sorted(glob.glob(os.path.join(root, f'reports/intel/w{W}-model/sim-w{W}-*.json')), key=os.path.getmtime)
    SG = {_norm(k): v for k, v in ((_j(sims[-1], {}) or {}).get('games') or {}).items()} if sims else {}
    by = {}
    for c in d['calls']: by.setdefault(c['game'], []).append(c)
    cards = []
    for gid, cs in by.items():
        aw, hm = gid.split('@'); g = SG.get(_norm(gid)) or {}
        L_, T_ = g.get('center_line'), g.get('center_total')
        if L_ is not None and T_ is not None:
            hp, ap = (T_ - L_) / 2, (T_ + L_) / 2; sa, sh = f'{ap:.1f}', f'{hp:.1f}'
        else: sa = sh = '—'
        conds = sorted({x for c in cs for x in (c.get('conditions') or [])})
        sc = next((c.get('supercontest') for c in cs if c.get('supercontest')), None)
        mid = (f"{e(_pt(cs[0].get('kickoff_utc')))}<br>Projected score<br><span style=\"opacity:.8\">Bookmaker {e(_side(hm, aw, g['market_line']) if g else '')} · O/U {g.get('market_total', '') if g else ''}</span>")
        hd = (f'<div class="g3-hd"><div class="g3-team"><span class="tl tl-{aw.lower()}"></span>{e(aw)}<span class="g3-score">{sa}</span></div>'
              f'<div class="g3-mid">{mid}</div>'
              f'<div class="g3-team"><span class="tl tl-{hm.lower()}"></span>{e(hm)}<span class="g3-score">{sh}</span></div></div>')
        body = ''.join(_g3_pick(c) for c in sorted(cs, key=lambda c: c['market'] != 'side'))
        foot = ''
        if conds: foot += '<div class="g3-note"><b>Check before kickoff:</b> ' + e(' '.join(conds)) + '</div>'
        if sc: foot += f'<div class="g3-note">SuperContest pitch: {e(sc)}</div>'
        cards.append(f'<div class="g3-card" id="gtmh-{_gslug(gid)}">{hd}{body}{foot}</div>')
    gate = d.get('official_gate') or {}
    intro = ("Every game, forced to a call: one side and one total. <b>Lean · No Platinum Rose endorsement</b> — no stake and no path to the card or SuperContest. "
             "Projected score = the model sim's center (halfway between the Bookmaker line and the team-strength model; no QB, injury or weather adjustment). "
             "<b>Strong lean</b>: 3+ evidence families agree, none against. <b>Lean</b>: more for than against. <b>Coin flip</b>: no pick, with what would tip it. "
             f"Lines: Bookmaker 5:43 PM, BetOnline 5:46 PM PT" + (f"; provisional (gate {e(str(gate.get('verdict')))} on {e(', '.join(gate.get('failing') or []))})" if gate.get('verdict') not in (None, 'PASS', 'GREEN') else '') + '.')
    return ['', '<details class="rollup-box section-rec no-bm" id="rec-gtmh" open>',
            f'<summary>🎯 Gun to my head: every matchup, forced to a side and a total ({len(by)} games · leans, no Platinum Rose endorsement)</summary>',
            '<div class="rollup-content">', '', ' '.join(_GTMH3_CSS.split()),
            f'<p style="font-size:.88rem">{intro}</p>' + '<div class="g3-grid">' + ''.join(cards) + '</div>', '', '</div>', '</details>', '']


# ---- Gun to my head PROPS (Andy 2026-11-21 22:53): top 5 prop leans per matchup in Props Lab ----
_CAT_ICON = {'Passing': '🎯', 'Rushing': '🏃', 'Receiving': '🙌', 'Touchdowns': '🏈', 'Fantasy': '⭐', 'Defense': '🛡️', 'Kicking': '🦵'}


def _imp_txt(p):
    out = f"implied {100 * p['implied']:.1f}%"
    if p.get('no_vig') is not None: out += f" (no-vig {100 * p['no_vig']:.1f}%)"
    return out


def gtmh_props_section(root, season, ww):
    W = int(ww); e = html.escape
    d = _j(os.path.join(root, f'data/research-intel/review/{season}-w{W:02d}-gtmh-props.json'))
    if not d or not d.get('games'): return []
    sims = sorted(glob.glob(os.path.join(root, f'reports/intel/w{W}-model/sim-w{W}-*.json')), key=os.path.getmtime)
    SG = {_norm(k): v for k, v in ((_j(sims[-1], {}) or {}).get('games') or {}).items()} if sims else {}
    cards = []; total = 0; tiers = collections.Counter()
    for gid, gg in d['games'].items():
        aw, hm = gid.split('@'); g = SG.get(_norm(gid)) or {}
        L_, T_ = g.get('center_line'), g.get('center_total')
        sa, sh = (f'{(T_ + L_) / 2:.1f}', f'{(T_ - L_) / 2:.1f}') if L_ is not None and T_ is not None else ('—', '—')
        mid = f"{e(_pt(gg.get('kickoff_utc')))}<br>Projected score" + (f"<br><span style=\"opacity:.8\">Bookmaker {e(_side(hm, aw, g['market_line']))} · O/U {g.get('market_total', '')}</span>" if g else '')
        hd = (f'<div class="g3-hd"><div class="g3-team"><span class="tl tl-{aw.lower()}"></span>{e(aw)}<span class="g3-score">{sa}</span></div>'
              f'<div class="g3-mid">{mid}</div>'
              f'<div class="g3-team"><span class="tl tl-{hm.lower()}"></span>{e(hm)}<span class="g3-score">{sh}</span></div></div>')
        rows = []
        for p in gg['picks']:
            total += 1; tiers[p['tier']] += 1
            tc = 'strong' if p['tier'] == 'Strong lean' else 'lean'
            b = p['best']; bk = {'Bookmaker': 'BKR', 'BetOnline': 'BOL', 'DK Predictions': 'DKP'}.get(b['book'], b['book'])
            meta = f"best {bk} {b['price']:+d} · {_imp_txt(p)}" + ('' if b.get('fresh') else ' · <b>DK Predictions Thursday price, before fees: recheck</b>')
            fors = [x for x in p['evidence'] if x['direction'] == 'for']
            ctx = [x for x in p['evidence'] if x['direction'] is None and x['family'] == 'Production']
            ag = [x for x in p['evidence'] if x['direction'] == 'against']
            rows.append(
                f'<div class="g3-pick"><span class="g3-lbl">{_CAT_ICON.get(p["category"], "")} {e(p["category"])}</span> '
                f'<span class="g3-call">{e(p["call"])}</span><span class="gtmh-badge t-{tc}">{e(p["tier"])}</span>'
                f'<div class="g3-note">{meta}</div><ul>'
                + ''.join(f'<li><b>{e(x["family"])}:</b> {e(x["detail"])}</li>' for x in fors) + '</ul>'
                + (''.join(f'<div class="g3-note"><b>Context:</b> {e(x["detail"])}</div>' for x in ctx))
                + (f'<div class="g3-note"><b>Against:</b> ' + e('; '.join(x['detail'] for x in ag)) + '</div>' if ag else '')
                + (f'<div class="g3-note"><b>Check:</b> ' + e(' '.join(p['conditions'])) + '</div>' if p.get('conditions') else '')
                + '</div>')
        if not rows:
            rows.append('<div class="g3-pick"><span class="g3-note">No prop on tonight\'s boards drew two or more agreeing evidence families.</span></div>')
        cards.append(f'<div class="g3-card" id="gtmh-props-{_gslug(gid)}">{hd}{"".join(rows)}</div>')
    intro = (f"<b>Platinum Rose prop picks this week: none.</b> No prop cleared the Platinum gate, because we have no calibrated player projection to prove an edge. "
             f"Below are the <b>Gun to my head prop leans</b>: up to 5 per matchup ({total} total, {tiers.get('Strong lean', 0)} Strong, {tiers.get('Lean', 0)} Lean) for building your own parlays. "
             "<b>Lean · No Platinum Rose endorsement</b>, no stake. Every eligible market was screened (passing, rushing, receiving, touchdowns, fantasy, defense, kicking, team and game totals) on the main line at each book. "
             "Evidence families: recent production vs the line, usage trend, opponent unit rank (FTN), projected game script, expert calls, injuries and QB changes, weather. "
             "<b>Strong lean</b>: 3+ families agree, none against, no open condition. <b>Lean</b>: 2+ agree and more for than against. At most 2 picks per category per game. "
             "Prices: Bookmaker 5:43 PM and BetOnline 5:46 PM PT; defensive player props exist only on DK Predictions' Thursday board, so they carry a recheck flag. "
             "TB@DET and ARI@KC use BetOnline only until Sunday's Bookmaker recapture.")
    return ['', '<details class="rollup-box section-2 no-bm" id="props-gtmh" open>',
            f'<summary>🎯 Gun to my head props: top 5 leans per matchup ({total} props · no Platinum Rose endorsement)</summary>',
            '<div class="rollup-content">', '', ' '.join(_GTMH3_CSS.split()),
            f'<p style="font-size:.88rem">{intro}</p>' + '<div class="g3-grid">' + ''.join(cards) + '</div>', '', '</div>', '</details>', '']
