"""Writes w10-fair-lines-summary.md from fair-lines-w10.json. Run from repo root after fair_lines_w10.py."""
import json, os
R = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(R, 'fair-lines-w10.json'))); m = d['meta']; G = d['games']
bp = os.path.join(R, 'fair-lines-w10.beo-1310.json')
B = {g['game']: g for g in json.load(open(bp))['games']} if os.path.exists(bp) else {}
pct = lambda x: f'{x * 100:.1f}%'
o = ['# Week 10 analytics-first fair lines and simulations (Tue 11/10, DK Tuesday open)', '',
     'Research context, not picks. Built by `reports/intel/w10-model/fair_lines_w10.py` (W9 method; template `w09-model/fair_lines_w09.py`).', '',
     f"Model margin = 0.40 SRS (Weeks {m['srs_weeks']}, computed from team-weeks.csv, margin cap {m['srs_margin_cap']}) + 0.40 FTN DVOA (in points) + 0.20 net yards/play (in points) + HFA {m['hfa']} + QB/injury adjustments.",
     f"DVOA -> points: {m['calibration']['dvoa_pts_per_pct']} per DVOA pct (r = {m['calibration']['dvoa_r']}); ypp: {m['calibration']['ypp_pts_per_yard']} per yard (r = {m['calibration']['ypp_r']}).",
     f"Fair line = market + {int(m['shrink'] * 100)}% toward the model. Market: {m['inputs']['market']}. FTN: `{m['inputs']['ftn']}` (captured 11/10 6:21-6:25 PM PT, stats through W9 except MNF BUF@MIN: BUF and MIN are one game short).",
     f"SuperContest: {m['inputs']['sc']}. Podcasts: {m['inputs']['podcasts']}. Kalshi: {m['inputs']['kalshi']}.", '',
     '## QB and injury adjustments (points to team strength vs its season numbers)', '',
     'The handoff asked for MIN Wentz / BAL Fagnano / NYG McCarthy / ARI Minshew / CLE Sanders. Tuesday news changed four of the five, so each adjustment is sized to the **expected starter**, and the handoff QB is kept as a scenario where it is still live.', '']
o += [f"- **{t} {v['pts']:+g}**: {v['why']}" for t, v in m['adjustments'].items()]
o += ['', '**Scenarios (alternate fair lines; main table unchanged):**', '']
o += [f"- {t}: " + '; '.join(f"{s['label']} ({s['pts']:+g})" for s in v) for t, v in m['scenarios'].items()]
o += ['', '## Games (home line; edge > 0 favors home)', '',
      '| Game | DK | Model | Fair | Edge | Sim home cover | BEO 1:10 PM (fair, edge) | Intel EPA model (no QB) | Fair total (mkt) | Sim over | Kalshi home 11/06 (pre-news) | Scenario fair lines |',
      '|---|---|---|---|---|---|---|---|---|---|---|---|']
for g in G:
    sc = '; '.join(f"{a['team']} {a['scenario'].split(' (')[0]}: {a['fair_line']:+g}" for a in g['scenarios']) or '—'
    o.append(f"| {g['game']} | {g['market_home_line']:+g} | {g['model_line']:+g} | {g['fair_line']:+g} | {g['edge_pts']:+g} | {pct(g['sim_market']['home_cover'])} | "
             + (f"{B[g['game']]['market_home_line']:+g} / {B[g['game']]['market_total']} ({B[g['game']]['fair_line']:+g}, {B[g['game']]['edge_pts']:+g})" if g['game'] in B else '—') + ' | ' + f"{g['intel_proj_home_line']:+g} | {g['fair_total']} ({g['market_total']}) | {pct(g['sim_market']['over'])} | {g['kalshi_home_win_1106'] if g['kalshi_home_win_1106'] is not None else '—'}% | {sc} |")
o += ['', '## The market already moved on the deadline news (BEO 1:10 PM PT vs DK Tuesday open)', '',
      '- **SEA@LV**: LV +3.5 -> **+6.5** (total 43.5 -> 40.5) after Mendoza was named. Model line LV +8.3, so about 1 point of SEA lean is left at BEO.',
      '- **MIN@GB**: GB -5.5 -> **-3.5** (total 42) on the Cousins trade. Model GB -3.2: with W9 DVOA the MIN lean is gone at BEO.',
      '- **MIA@IND**: IND -2.5 -> **-3.5**, total 40.5 -> **38** with McCord. **LAR@ARI** total 40.5 -> 38.5 (Beck). **CAR@NO** NO -1.5 -> pick.',
      '- Model lines do not depend on the market, so where BEO moved toward the model the edge shrank; see the BEO column. Main table = DK Tuesday open, as the handoff specified.']
side = sorted(G, key=lambda g: -abs(B.get(g['game'], g)['edge_pts']))
o += ['', '## Biggest side gaps at BEO 1:10 PM (fair vs current price)', '']
for g in side[:6]:
    g = B.get(g['game'], g)
    a, h = g['game'].split('@'); fav = h if g['edge_pts'] > 0 else a
    agree = (g['intel_proj_home_line'] - g['market_home_line']) * (g['fair_line'] - g['market_home_line']) > 0
    o.append(f"- **{g['game']}**: fair {h} {g['fair_line']:+g} vs BEO {g['market_home_line']:+g} -> leans **{fav}** by {abs(g['edge_pts'])} (sim {pct(max(g['sim_market']['home_cover'], g['sim_market']['away_cover']))}). "
             f"Intel EPA model {h} {g['intel_proj_home_line']:+g}: {'agrees' if agree else 'DISAGREES'}.")
o += ['', '## Caveats', '',
      '- **Totals are the weak part.** The base total is a PF/PA blend that only takes 60% of a downgrade off the team\'s own points. It does not know BAL scored 29/g with Jackson and 10/g with Fagnano, or that LV/ARI/MIA start new QBs. Treat Overs on LAC@BAL, LAR@ARI, HOU@CLE, SEA@LV and MIA@IND as **not trustworthy** until the QB is confirmed; W9 total bias was -1.4 and five games finished under 35.',
      '- **LAC@BAL is the biggest disagreement.** This model (full-season SRS) has BAL -7.1 fair; the EPA intel model (last 4 weighted 1.5x) has BAL -2.5. BAL is -17.1 over the last 4 with Huntley/Fagnano. Brissett is the swing: neither model has seen him in a BAL uniform.',
      '- **MIN@GB:** at DK +5.5 the fair line leans MIN, but BEO is already +3.5 and fair there is GB -3.3; with Wentz/Brosmer it moves about 1.5 further toward GB. Wait for the MIN starter before using it.',
      '- **KC@ATL:** Mahomes (elbow) is practicing in full (Reid, Wed). The no-Mahomes scenario is kept only for reference.',
      '- **HOU@CLE (Wed update):** Deshaun Watson starts, not Sanders. The -1.0 CLE QB downgrade is removed; the HOU pass rush vs CLE protection lead still applies (Watson was sacked at a 10.4% rate in his 8 starts).',
      '- Kalshi is the 11/06 pull, before the deadline trades. It is a stale reference only.',
      '- FTN DVOA is the 11/10 capture: BUF and MIN are missing the W9 MNF game; recapture once FTN adds it.',
      '- SuperContest and podcast votes are empty until Andy\'s captures land; re-run the script then.']
open(os.path.join(R, 'w10-fair-lines-summary.md'), 'w', encoding='utf-8').write('\n'.join(o) + '\n')
print('\n'.join(o))
