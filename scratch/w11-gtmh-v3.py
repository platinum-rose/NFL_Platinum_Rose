import shutil
p = 'scripts/master-intel/extra_inputs.py'; shutil.copy(p, p + '.bak-sat-gtmh3')
s = open(p, encoding='utf-8').read()
assert s.count('\ndef gtmh_section(root, season, ww):') == 1
s = s.replace('\ndef gtmh_section(root, season, ww):', '\ndef gtmh_section_full(root, season, ww):  # superseded 2026-11-21 22:15 (Andy: matchup cards)')
s += r'''

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
'''
if '\nimport glob' not in s and 'import glob' not in s.split('\n', 20)[0:20].__str__():
    pass
open(p, 'w', encoding='utf-8').write(s); print('v3 written')
