#!/usr/bin/env python3
"""Market-only historical calibration from nflverse games-full (closing spread/total vs final score).
Read-only on the CSV; writes one JSON. NOT a backtest of the Week 5 blend (no historical FTN/SRS inputs exist)."""
import csv, json, hashlib, math, statistics as st, collections, pathlib, datetime, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
SRC = ROOT / 'data/vault-seed/nflverse/games-full-1999-2026.csv'
OUT = ROOT / 'data/research-intel/proposed/2026-w05-historical-market-calibration.json'
raw = SRC.read_bytes(); sha = hashlib.sha256(raw).hexdigest()
rows = list(csv.DictReader(raw.decode('utf-8', errors='replace').splitlines()))
def f(x):
    try: return float(x)
    except Exception: return None
G = []
for r in rows:
    if r.get('game_type') != 'REG': continue
    sp, tl, res, tot = f(r['spread_line']), f(r['total_line']), f(r['result']), f(r['total'])
    if None in (sp, tl, res, tot): continue
    G.append(dict(season=int(r['season']), sp=sp, tl=tl, res=res, tot=tot))
def block(gs):
    if len(gs) < 30: return dict(n=len(gs))
    mr = [g['res'] - g['sp'] for g in gs]; tr = [g['tot'] - g['tl'] for g in gs]
    return dict(n=len(gs), margin_resid_mean=round(st.mean(mr), 3), margin_resid_sd=round(st.pstdev(mr), 3),
                total_resid_mean=round(st.mean(tr), 3), total_resid_sd=round(st.pstdev(tr), 3))
def pick(lo, hi): return [g for g in G if lo <= g['season'] <= hi]
eras = {'1999-2025': pick(1999, 2025), '2011-2025': pick(2011, 2025), '2018-2025': pick(2018, 2025), '2021-2025': pick(2021, 2025)}
BASE = eras['2018-2025']   # modern-era default; other eras reported for sensitivity
# favorite-perspective final margin distribution (home-favorite sign normalised): m = (res if sp>=0 else -res)
def fav_margin(g): return g['res'] if g['sp'] >= 0 else -g['res']
def spread_bucket(g):
    a = abs(g['sp'])
    for lo, hi, nm in ((0, 1.5, '0-1'), (1.5, 3.5, '1.5-3'), (3.5, 6.5, '3.5-6'), (6.5, 9.5, '6.5-9'), (9.5, 99, '10+')):
        if lo <= a < hi: return nm
buckets = collections.defaultdict(list)
for g in BASE: buckets[spread_bucket(g)].append(g)
by_spread = {}
for k, gs in sorted(buckets.items()):
    fm = [fav_margin(g) for g in gs]
    by_spread[k] = dict(n=len(gs), fav_win_pct=round(100 * sum(1 for m in fm if m > 0) / len(gs), 1), tie_pct=round(100 * sum(1 for m in fm if m == 0) / len(gs), 2),
                        margin_resid_sd=round(st.pstdev([g['res'] - g['sp'] for g in gs]), 3), mean_fav_margin=round(st.mean(fm), 2))
# key numbers: P(favorite margin == k) overall and P(landing exactly on the line) for lines at 3 / 7 etc.
fm_all = [fav_margin(g) for g in BASE]; n = len(fm_all)
margin_dist = {str(k): round(100 * sum(1 for m in fm_all if m == k) / n, 2) for k in range(-14, 22)}
on_line = {}
for line in (1, 2.5, 3, 3.5, 4, 5.5, 6, 6.5, 7, 7.5, 8, 9.5, 10, 14):
    gs = [g for g in BASE if abs(g['sp']) == line]
    if len(gs) >= 20:
        fm = [fav_margin(g) for g in gs]
        on_line[str(line)] = dict(n=len(gs), push_pct=round(100 * sum(1 for m in fm if m == line) / len(gs), 2) if float(line).is_integer() else 0.0,
                                  fav_cover_pct_excl_push=round(100 * sum(1 for m in fm if m > line) / max(1, sum(1 for m in fm if m != line)), 1))
tb = collections.defaultdict(list)
for g in BASE:
    b = '<40' if g['tl'] < 40 else '40-44' if g['tl'] < 44.5 else '44.5-48' if g['tl'] < 48.5 else '48.5+' ; tb[b].append(g)
by_total = {k: dict(n=len(v), total_resid_mean=round(st.mean(g['tot'] - g['tl'] for g in v), 2), total_resid_sd=round(st.pstdev(g['tot'] - g['tl'] for g in v), 3)) for k, v in sorted(tb.items())}
out = dict(schema='historical_market_calibration_v1', generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), status='proposed_analysis_context_only',
           source=dict(path=str(SRC.relative_to(ROOT)).replace('\\', '/'), sha256=sha, rows_total=len(rows), reg_season_with_spread_total_result=len(G),
                       last_season_with_results=max(g['season'] for g in G), note='2026 rows have no scores or results, and their spread_line/total_line/moneyline values are pre-season (file dated 2026-06-05) placeholders, not closing lines; they are excluded from every statistic here.'),
           conventions='nflverse: spread_line > 0 = home favored; result = home - away; residual = result - spread_line; total residual = total - total_line; REG season only.',
           default_era='2018-2025', eras={k: block(v) for k, v in eras.items()}, by_closing_spread_abs_default_era=by_spread,
           fav_margin_distribution_pct_default_era=margin_dist, on_the_number_default_era=on_line, by_total_line_default_era=by_total,
           caveats=['Market-only calibration: how closing lines related to results in past seasons. It says nothing about the 60/25/15 blend, FTN or SRS inputs (no historical series exist locally).',
                    'Closing lines, not the captured Week 5 display numbers; Week 5 captures are earlier than close and will move.',
                    'Rule/kickoff changes make older eras less relevant; the 2018-2025 era is the default and the other eras show sensitivity.',
                    'Integer-line push rates are only reported where n >= 20; key-number frequencies are descriptive, not a price.'])
OUT.write_text(json.dumps(out, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: out[k] for k in ('source', 'eras', 'by_closing_spread_abs_default_era', 'by_total_line_default_era')}, indent=1))
print(json.dumps(out['on_the_number_default_era']))
print({k: margin_dist[k] for k in ('1', '2', '3', '4', '6', '7', '10', '14')})
