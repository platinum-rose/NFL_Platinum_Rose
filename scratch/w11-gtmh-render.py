import shutil
p = 'scripts/master-intel/extra_inputs.py'
shutil.copy(p, p + '.bak-sat-gtmh')
s = open(p, encoding='utf-8').read()
code = r'''

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


def gtmh_section(root, season, ww):
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
            f"{'Side' if c['market'] == 'side' else 'Total'}: <b>{e(c['call'])}</b> <span class=\"gtmh-badge t-{_TIER_CLS.get(c['tier'], 'lean')}\">{e(c['tier'])}</span>" for c in cs)
        cards.append(f'<details class="gtmh-card" data-tiers="{tiers}"><summary>{summ}</summary>' + ''.join(_gtmh_block(c) for c in cs)
                     + '<div class="gtmh-small">Lean · No Platinum Rose endorsement</div></details>')
    gate = d.get('official_gate') or {}
    intro = (f"Every game gets a side call (spread) and a total call: {n} calls. These are the AI's most probable choices when forced to pick, "
             f"not recommendations: <b>Lean · No Platinum Rose endorsement</b>, no stake, and no path to the card, SuperContest or My Card. "
             f"Seven evidence families vote (model sim, market movement, money, FTN matchup analytics, availability, experts, situational). "
             f"<b>Strong lean</b>: 3+ agree and none disagree. <b>Lean</b>: more for than against, or a Strong lean with an open condition. "
             f"<b>Coin flip</b>: no side is named; the card says what would tip it. Built {e(str(d.get('as_of'))[:16].replace('T', ' '))} PT from the 5:43 PM Bookmaker and 5:46 PM BetOnline captures"
             + (f"; the official gate is {e(str(gate.get('verdict')))} ({e(', '.join(gate.get('failing') or []))}), so these calls are provisional too" if gate.get('verdict') not in (None, 'PASS', 'GREEN') else '')
             + '. Every call is logged in a separate grading ledger.')
    filt = ('<div class="gtmh-filter">'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-all" checked><label for="gtmh-f-all">All games</label>'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-strong"><label for="gtmh-f-strong">Strong lean ({tc.get("Strong lean", 0)})</label>'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-lean"><label for="gtmh-f-lean">Lean ({tc.get("Lean", 0)})</label>'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-coin"><label for="gtmh-f-coin">Coin flip ({tc.get("Coin flip", 0)})</label>'
            f'<input type="radio" name="gtmh-f" id="gtmh-f-official"><label for="gtmh-f-official">Official pick ({tc.get("Official pick", 0)})</label>'
            '<div class="gtmh-cards">' + ''.join(cards) + '</div></div>')
    return ['', '<details class="rollup-box section-rec no-bm" id="rec-gtmh">',
            f'<summary>🎯 Gun to my head: a side and a total call for every game ({n} calls · leans, no Platinum Rose endorsement)</summary>',
            '<div class="rollup-content">', '', _GTMH_CSS, f'<p style="font-size:.9rem">{intro}</p>', filt, '', '</div>', '</details>', '']


def gtmh_line(root, season, ww, gid):
    d = _gtmh_load(root, season, ww)
    cs = [c for c in (d or {}).get('calls', []) if _norm(c['game']) == _norm(gid)]
    if not cs: return ''
    e = html.escape
    return '<b>Gun to my head</b> (lean, no endorsement): ' + ' · '.join(
        f"{'side' if c['market'] == 'side' else 'total'} <b>{e(c['call'])}</b> ({e(c['tier'])})" for c in sorted(cs, key=lambda c: c['market'] != 'side')) + ' — <a href="#rec-gtmh">full card</a>.'
'''
s += code
# game panel: add the GTMH line just before the matchup table
a = "    tbl = _matchup_table(s.get('matchup')) if s else ''"
assert s.count(a) == 1
s = s.replace(a, "    gl = gtmh_line(ctx.get('root', ''), ctx.get('season', 2026), ctx.get('ww', 11), gid) if ctx.get('root') else ''\n    if gl: rows.append(gl)\n" + a)
a = "    ctx = {'fair': {}, 'sim': {}, 'sim_meta': {}, 'recs': {}, 'sc': {}, 'wx': {}, 'wx_meta': {}, 'qb': {}, 'caveat': {}}"
assert s.count(a) == 1
s = s.replace(a, "    ctx = {'fair': {}, 'sim': {}, 'sim_meta': {}, 'recs': {}, 'sc': {}, 'wx': {}, 'wx_meta': {}, 'qb': {}, 'caveat': {}, 'root': root, 'season': season, 'ww': W}")
open(p, 'w', encoding='utf-8').write(s)
# hook into build.py: section before the executive board
b = 'scripts/master-intel/build.py'; shutil.copy(b, b + '.bak-claude-20261121-sat-gtmh')
t = open(b, encoding='utf-8').read()
h = "    # ---------------- 1. Executive master board ----------------\n"
assert t.count(h) == 1
t = t.replace(h, "    if XI:  # 2026-11-21: Gun to my head section (docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md)\n"
                 "        try: L += _xi.gtmh_section(str(ROOT), a.season, WW)\n"
                 "        except Exception as _e: print(f'WARN gtmh section: {_e}')\n" + h)
open(b, 'w', encoding='utf-8').write(t)
print('rendered + hooked')
