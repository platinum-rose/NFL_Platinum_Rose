import shutil
p = 'scripts/master-intel/extra_inputs.py'
shutil.copy(p, p + '.bak-sat-panel-v1')
s = open(p, encoding='utf-8').read()
old_sim = """        rows.append(f"<b>Sim</b> (centered on {e(_side(h, a, s['market_line']))}, moved halfway to the model = {e(_side(h, a, round(s['center_line'], 1)))}): \""""
new_sim = """        rows.append(f"<b>Sim</b> (centered halfway between the market {e(_side(h, a, s['market_line']))} and the model = {e(_side(h, a, round(s['center_line'], 1)))}, then blended 50/50 with the market's own probability): \""""
assert s.count(old_sim) == 1; s = s.replace(old_sim, new_sim)
old_tail = """f"Over {s['market_total']:g} {pct(s['over_xp'])} / Under {pct(s['under_xp'])} (pushes excluded). {e(h)} wins outright {pct(s['home_win'])}.")
"""
new_tail = old_tail + """        an = s.get('analytics')
        if an:
            mside = s['market_line']
            hc = an['home_cover_xp']
            rows.append(f"<b>Matchup analytics</b> (FTN EPA per play, offense vs opposing defense, through Week 9, regressed halfway to league average): "
                        f"projects {e(a)} {an['away_pts']:.1f}, {e(h)} {an['home_pts']:.1f} ({e(_side(h, a, round(an['proj_home_line'], 1)))}), total {an['proj_total']:.1f}. "
                        f"Same sim steps: {e(_side(h, a, mside))} covers {pct(hc if mside <= 0 else 1 - hc)}, Over {s['market_total']:g} {pct(an['over_xp'])}. Sensitivity only; weights untested.")
"""
assert s.count(old_tail) == 1; s = s.replace(old_tail, new_tail)
old_rec = """                    + (' <i>(no model edge)</i>' if r['edge_pct'] < 0 else '') + '.')"""
new_rec = """                    + (' <i>(no model edge)</i>' if r['edge_pct'] < 0 else '')
                    + (f"; matchup analytics {pct(r['analytics_p_cover_xp'])}" if r.get('analytics_p_cover_xp') is not None else '') + '.')"""
assert s.count(old_rec) == 1; s = s.replace(old_rec, new_rec)
old_sc = """        rows.append(f"<b>SuperContest</b> {e(r['pick'])}: {r['exp_points']:.3f} expected points (wins {pct(r['p_win'])}, pushes {pct(r['p_push'])}).")"""
new_sc = """        rows.append(f"<b>SuperContest</b> {e(r['pick'])}: {r['exp_points']:.3f} expected points (wins {pct(r['p_win'])}, pushes {pct(r['p_push'])})"
                    + (f"; matchup analytics {r['analytics_exp_points']:.3f}" if r.get('analytics_exp_points') is not None else '') + '.')"""
assert s.count(old_sc) == 1; s = s.replace(old_sc, new_sc)
old_ret = """    if not rows: return []
    src = ctx.get('sim_meta', {}).get('path') or 'no sim file'"""
new_ret = """    if not rows: return []
    tbl = _matchup_table(s.get('matchup')) if s else ''
    if tbl: rows.append(tbl)
    src = ctx.get('sim_meta', {}).get('path') or 'no sim file'"""
assert s.count(old_ret) == 1; s = s.replace(old_ret, new_ret)
helper = '''
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

'''
anchor = 'def _side(home, away, line):'
s = s.replace('def _short(note, n=150):', helper + 'def _short(note, n=150):', 1)
open(p, 'w', encoding='utf-8').write(s)
print('panel v2')
