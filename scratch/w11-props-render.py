import shutil
# ---- 1. generator: show the projected margin in the game-script line ----
p = 'scripts/master-intel/gtmh_props.py'; s = open(p, encoding='utf-8').read()
a = "f\"Projected {team} {tp_:.1f}, {opp} {op_:.1f}\" + (f\" vs a {base:.1f} season scoring average\" if base and mk in OFF_MK else '') + '.')"
b = "f\"Projected {team} {tp_:.1f}, {opp} {op_:.1f} ({team} {'by' if margin >= 0 else 'trailing by'} {abs(margin):.1f})\" + (f\"; {team} season scoring average {base:.1f}\" if base and mk in OFF_MK else '') + '.')"
assert s.count(a) == 1; s = s.replace(a, b); open(p, 'w', encoding='utf-8').write(s)
# ---- 2. renderer ----
p = 'scripts/master-intel/extra_inputs.py'; shutil.copy(p, p + '.bak-sat-props')
s = open(p, encoding='utf-8').read()
s += r'''

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
'''
if 'import glob, html, json, os, re' in s and 'collections' not in s.split('\n', 30)[0:30].__str__():
    s = s.replace('import glob, html, json, os, re', 'import collections, glob, html, json, os, re', 1)
open(p, 'w', encoding='utf-8').write(s)
# ---- 3. build.py hook: first item of the props pool section ----
p = 'scripts/master-intel/build.py'; shutil.copy(p, p + '.bak-claude-20261121-sat-props')
s = open(p, encoding='utf-8').read()
a = "    L += ['', '<a id=\"prop-pool\"></a>'] + PBP + "
assert s.count(a) == 1
s = s.replace(a, "    GPROPS = []\n    if XI:  # 2026-11-21: Gun to my head props (top 5 per matchup), first in Props Lab\n"
                 "        try: GPROPS = _xi.gtmh_props_section(str(ROOT), a.season, WW)\n"
                 "        except Exception as _e: print(f'WARN gtmh props: {_e}')\n"
                 "    L += ['', '<a id=\"prop-pool\"></a>'] + GPROPS + PBP + ")
open(p, 'w', encoding='utf-8').write(s)
# ---- 4. build_site: keep the section and pin it to the top of Props Lab ----
p = 'scripts/master-intel/build_site.py'; shutil.copy(p, p + '.bak-claude-20261121-sat-props')
s = open(p, encoding='utf-8').read()
a = "keep = [k for k in kill if getattr(k, 'get', None) and k.get('id') in ('props-by-position', 'td-menu')]"
assert s.count(a) == 1
s = s.replace(a, "keep = [k for k in kill if getattr(k, 'get', None) and k.get('id') in ('props-by-position', 'td-menu', 'props-gtmh')]")
a = "                if prop_research:\n                    new.insert(0, soup_of(prop_research).section)\n"
assert s.count(a) == 1
s = s.replace(a, a + "                _g = new.find(id='props-gtmh', recursive=False)  # 2026-11-21: Gun to my head props first\n"
                     "                if _g is not None: new.insert(0, _g.extract())\n")
open(p, 'w', encoding='utf-8').write(s)
# ---- 5. research table: relabel as reference, explain the labels ----
p = 'scripts/master-intel/research_evidence.py'; shutil.copy(p, p + '.bak-claude-20261121-sat-props')
s = open(p, encoding='utf-8').read()
a = "        props = ('<section id=\"research-props\" class=\"no-bm\"><h3>Player prop research</h3>'"
assert s.count(a) == 1
s = s.replace(a, "        props = ('<section id=\"research-props\" class=\"no-bm\"><h3>Player prop research reference (not picks)</h3>'\n"
                 "                 '<p><b>How to read this:</b> these are saved research rows, not recommendations. For playable leans see <a href=\"#props-gtmh\">Gun to my head props</a> above. '\n"
                 "                 'In the Research assessment column, <b>Reference only</b> means the quoted price is a DraftKings Predictions contract captured Thursday (before fees), shown for comparison, not as a number to bet; '\n"
                 "                 '<b>PASS</b> means the Friday screen found no edge at that price because no calibrated player projection exists. PASS is not a prediction that the Over or Under loses.</p>'")
open(p, 'w', encoding='utf-8').write(s)
print('render + hooks done')
