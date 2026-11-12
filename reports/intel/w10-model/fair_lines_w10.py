"""Week 10 analytics-first fair lines + simulations. Template: reports/intel/w09-model/fair_lines_w09.py (same method and weights).
Run from repo root: python3 reports/intel/w10-model/fair_lines_w10.py

Model margin (home-positive) = 0.40 * SRS diff + 0.40 * FTN DVOA diff (in points) + 0.20 * net-ypp diff (in points) + HFA + QB/injury adjustments.
Changes vs W9 (Claude Team 2, Tue 11/10):
  - SRS is computed here from team-weeks.csv (Weeks 1-9, margins capped at 24, same as the power-ratings build), because
    team-power-ratings-2026.json was last built 11/07 (through W8 + W9 TNF). The power-file SRS is printed as a cross-check.
  - Market = DK snapshot in public/schedule.json (Tue 11/10 10:00 PT cadence; = the Tuesday open). Override: W10_LINES=<json {"WAS@NYG": [-2.5, 41.5]}> (+ W10_LINES_LABEL, W10_OUT=<output name>).
  - SuperContest, podcast digest and Kalshi are optional (used when the W10 files exist; Kalshi file is the 11/06 pull, so it is pre-news).
  - Cross-check column: reports/analysis/season/claude/out/week-09-matchup-intel.json games[].proj_home_margin (EPA net model, no QB changes).
  - SCEN: alternate QB outcomes, reported as alternate fair lines (not used in the main row).
FTN DVOA is the 11/05 export (through W8) until Andy's W9 export lands; re-run after it does.
Experts carry ZERO weight; dissent count only. Market signals are flags only. Research context, not picks.
"""
import csv, json, glob, os, statistics as st, subprocess, collections, datetime

W_SRS, W_DVOA, W_YPP = 0.40, 0.40, 0.20
SHRINK = 0.50
HFA = 1.5
NEUTRAL = set()
CAP = 24
# Point adjustments to team strength vs its season numbers (negative = weaker). Claude judgment Tue 11/10 from the availability feed
# (latest.json 23:30Z) + news checks. QB EPA = adjusted offensive EPA/play by starter from week-09-matchup-intel.json.
ADJ = {
    'MIN': (-0.5, 'QB TBD (Wed 11/11: O\'Connell not committing to Cousins; Wentz now has an ankle injury; Murray expected out): Kirk Cousins acquired from LV Tue 11/10 (3rd-rd pick), expected to start if ready on a short week; Wentz benched for Brosmer in W9 MNF (8/25, 81y, 2 INT); Murray DOUBTFUL (Grade 2 hamstring). Season numbers: Murray -0.18 x5, Wentz -0.26 x3. Cousins at LV -0.02 x9. Wentz/Brosmer scenario below'),
    'BAL': (-0.5, 'Jacoby Brissett (acquired from ARI 11/04) expected to start MNF per Minter, NOT Fagnano. Brissett -0.03 x8 at ARI is close to BAL season blend (Jackson +0.12 x4, Huntley -0.07 x3, Fagnano -0.38 x2); -0.5 for a 12-day install. Fagnano scenario below'),
    'NYG': (+0.5, 'J.J. McCarthy (hip, Q; full practice Tue) +0.04 x2 vs Winston-heavy season numbers (-0.18 x5); offset by his 13% sack rate. Dart IR'),
    'ARI': (-2.0, 'Rookie Carson Beck expected to start (ESPN/Weinfuss); Minshew to IR (elbow) Tue; Brissett traded. Season numbers are Brissett (-0.03 x8)'),
    'CLE': (0.0, 'Deshaun Watson named the W10 starter (ESPN/Fowler 11/09, CBS official 11/11; cleared concussion protocol 11/07). Season numbers are his 8 starts (-0.06), so no adjustment. Was -1.0 for Sanders on 11/10'),
    'SEA': (-0.5, 'Drew Lock (+0.02 x3; oblique, Q, expected to play) for Sam Darnold (OUT). W9 used -2.5, which was too big: Lock has not been a downgrade'),
    'LV':  (-1.5, 'Rookie Fernando Mendoza starts after Kirk Cousins (-0.02 x9) was traded to MIN Tue'),
    'MIA': (-1.5, 'Kyle McCord starts; Malik Willis (-0.08 x8) to IR (core) Tue'),
    'LAR': (-1.0, 'Puka Nacua DOUBTFUL (ESPN 11/10; FantasyPros lists IR, conflict) and Davante Adams IR'),
    'GB':  (-0.5, 'Josh Jacobs OUT; Jayden Reed IR'),
    'NE':  (-0.5, 'Rhamondre Stevenson DOUBTFUL; A.J. Brown and TreVeyon Henderson Q'),
    'SF':  (-0.3, 'Brandon Aiyuk out (roster exemption); Mike Evans and Deebo Samuel Q'),
}
SCEN = {  # alternates: team -> (pts, label); reported per game, main row unchanged
    'MIN': [(-2.0, 'Wentz/Brosmer start (Cousins not ready)')],
    'BAL': [(-3.5, 'Fagnano starts instead of Brissett')],
    'KC':  [(-6.0, 'Mahomes OUT (unlikely: elbow, practicing in full Wed per Reid)')],
    'SEA': [(-1.5, 'Lock out (oblique)')],
    'NYG': [(-1.0, 'McCarthy out (unlikely: hip, full practice Tue): Winston')],
    'CLE': [(-1.0, 'Shedeur Sanders starts instead (Watson setback)')],
    'LAC': [(-2.5, 'Herbert out (finger, Q; Harbaugh: should be good to go)')],
}
TOTAL_ADJ_SHARE = 0.6

R = os.path.dirname(os.path.abspath(__file__))
fix = {'LA': 'LAR', 'WSH': 'WAS', 'JAC': 'JAX'}
TW = list(csv.DictReader(open('data/archive/2026/season/team-weeks.csv', encoding='utf-8')))
agg = collections.defaultdict(lambda: collections.defaultdict(list)); games_of = collections.defaultdict(list)
for r in TW:
    t = fix.get(r['team'], r['team']); o = fix.get(r['opp'], r['opp'])
    for k in ('pts', 'opp_pts', 'ypp', 'opp_ypp'): agg[t][k].append(float(r[k]))
    m = max(-CAP, min(CAP, float(r['pts']) - float(r['opp_pts']))); games_of[t].append((o, m))
WEEKS = max(int(r['week']) for r in TW)
srs = {t: 0.0 for t in games_of}
for _ in range(500):
    new = {t: st.mean(m for _, m in g) + st.mean(srs[o] for o, _ in g) for t, g in games_of.items()}
    mu = st.mean(new.values()); srs = {t: v - mu for t, v in new.items()}
pr_old = {('LAR' if r['team_abbr'] == 'LA' else r['team_abbr']): r['power_rating']['srs'] for r in json.load(open('data/generated/team-profiles/team-power-ratings-2026.json'))['rows']}
net_ppg = {t: st.mean(a['pts']) - st.mean(a['opp_pts']) for t, a in agg.items()}
pf = {t: st.mean(a['pts']) for t, a in agg.items()}; pa = {t: st.mean(a['opp_pts']) for t, a in agg.items()}
net_ypp = {t: st.mean(a['ypp']) - st.mean(a['opp_ypp']) for t, a in agg.items()}
NAME = {'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL', 'Buffalo Bills': 'BUF', 'Carolina Panthers': 'CAR', 'Chicago Bears': 'CHI',
        'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE', 'Dallas Cowboys': 'DAL', 'Denver Broncos': 'DEN', 'Detroit Lions': 'DET', 'Green Bay Packers': 'GB',
        'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAX', 'Kansas City Chiefs': 'KC', 'Las Vegas Raiders': 'LV',
        'Los Angeles Chargers': 'LAC', 'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA', 'Minnesota Vikings': 'MIN', 'New England Patriots': 'NE',
        'New Orleans Saints': 'NO', 'New York Giants': 'NYG', 'New York Jets': 'NYJ', 'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT',
        'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA', 'Tampa Bay Buccaneers': 'TB', 'Tennessee Titans': 'TEN', 'Washington Commanders': 'WAS'}
ftn_dir = sorted(d for d in glob.glob('data/research-intel/source-evidence/*-ftn-stats-iq') if os.path.isdir(d))[-1]
def ftn(tbl):
    return {NAME[r['Team']]: float(r['DVOA'].replace('%', '')) for r in csv.DictReader(open(f'{ftn_dir}/stats-iq-{tbl}.csv', encoding='utf-8-sig')) if r['Team'] in NAME}
dvoa = {t: o - ftn('team-defense-efficiency')[t] for t, o in ftn('team-offense-efficiency').items()}
def ols(x):
    ts = [t for t in net_ppg if t in x]; mx = st.mean(x[t] for t in ts); my = st.mean(net_ppg[t] for t in ts)
    b = sum((x[t] - mx) * (net_ppg[t] - my) for t in ts) / sum((x[t] - mx) ** 2 for t in ts)
    return b, st.correlation([x[t] for t in ts], [net_ppg[t] for t in ts])
K_DVOA, R_DVOA = ols(dvoa); K_YPP, R_YPP = ols(net_ypp)

S = json.load(open('public/schedule.json', encoding='utf-8'))
G = sorted([g for g in S if g['week'] == 10 and g.get('status') == 'pre'], key=lambda g: g['kickoff_utc'])
OVR = json.load(open(os.environ['W10_LINES'])) if os.environ.get('W10_LINES') else {}
OPEN = {'WAS@NYG': (-2.5, 41.5), 'NE@DET': (-2.5, 51.5), 'KC@ATL': (3.5, 45.5), 'HOU@CLE': (4.5, 39.5), 'MIN@GB': (-5.5, 40.5), 'JAX@TEN': (10.5, 46.5),
        'MIA@IND': (-2.5, 40.5), 'CAR@NO': (-1.5, 48.5), 'BUF@NYJ': (8.5, 50.5), 'SEA@LV': (3.5, 43.5), 'LAR@ARI': (9.5, 40.5), 'SF@DAL': (4.5, 55.5),
        'PIT@CIN': (-3.5, 48.5), 'LAC@BAL': (-5.5, 38.5)}  # DK Tuesday open (handoff 11/10)
SC = {}; sc_p = 'data/supercontest/week-10-lines.json'
if os.path.exists(sc_p):
    for g in json.load(open(sc_p))['games']:
        SC[frozenset((g['favorite_abbr'], g['underdog_abbr']))] = (g['favorite_abbr'], float(g['contest_line']))
KAL = {}
try:
    pm = json.load(open('data/prediction-markets/latest.json')); cs = next(v for v in pm.values() if isinstance(v, list) and len(v) > 100)
    for c in cs:
        if c.get('series_ticker') == 'KXNFLGAME' and any(f'-26NOV{d}' in c['ticker'] for d in ('12', '13', '15', '16', '17')):
            KAL[c['ticker'].split('-')[-1]] = c['implied_probability_pct']
    KAL = {('JAX' if k == 'JAC' else k): v for k, v in KAL.items()}
except Exception: pass
DIGP = 'data/podcasts/youtube-extracted-picks-2026-w10.json'
DIG = json.load(open(DIGP)) if os.path.exists(DIGP) else {'picks': []}
def side_votes(aw, hm):
    v = collections.Counter(); seen = set()
    for p in DIG['picks']:
        if p.get('game') != f'{aw}@{hm}': continue
        if (p.get('raw') or {}).get('market') not in ('spread', 'moneyline'): continue  # futures (win totals, division finish) are filed under games in the W10 digest
        s = str(p.get('pick')).split()[0]
        if s in (aw, hm) and 'teaser' not in str(p.get('pick')) and (p.get('speaker'), s) not in seen: seen.add((p.get('speaker'), s)); v[s] += 1
    return v
INTEL = {g['game']: g for g in json.load(open('reports/analysis/season/claude/out/week-09-matchup-intel.json'))['games'] if g['week'] == 10}

def sim(home_line, total, madj, tadj):
    js = f"import('./scripts/intel/margin-simulator.mjs').then(m=>{{const c=m.loadCalibration();console.log(JSON.stringify(m.analyzeGame({{homeLine:{home_line},total:{total},marginAdj:{madj:.3f},totalAdj:{tadj:.3f}}},c)))}})"
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)

def model(aw, hm, adj_h, adj_a, hfa):
    c_srs = srs[hm] - srs[aw]; c_dvoa = K_DVOA * (dvoa[hm] - dvoa[aw]); c_ypp = K_YPP * (net_ypp[hm] - net_ypp[aw])
    return c_srs, c_dvoa, c_ypp, W_SRS * c_srs + W_DVOA * c_dvoa + W_YPP * c_ypp + hfa + adj_h - adj_a

out = []
for g in G:
    aw, hm = fix.get(g['visitor'], g['visitor']), fix.get(g['home'], g['home']); gid = f'{aw}@{hm}'; hfa = 0 if gid in NEUTRAL else HFA
    line, tot = float(g['spread']), float(g['total'])
    if gid in OVR: line, tot = OVR[gid]
    adj_h, adj_a = ADJ.get(hm, (0, ''))[0], ADJ.get(aw, (0, ''))[0]
    c_srs, c_dvoa, c_ypp, mm = model(aw, hm, adj_h, adj_a, hfa)
    model_line = -mm; fair_line = line + SHRINK * (model_line - line)
    e_h = (pf[hm] + pa[aw]) / 2 + TOTAL_ADJ_SHARE * min(adj_h, 0); e_a = (pf[aw] + pa[hm]) / 2 + TOTAL_ADJ_SHARE * min(adj_a, 0)
    base_tot = e_h + e_a; fair_tot = tot + SHRINK * (base_tot - tot)
    madj = -(fair_line - line); tadj = fair_tot - tot
    m = sim(line, tot, madj, tadj)
    it = INTEL.get(gid, {})
    row = dict(game=gid, kickoff_utc=g['kickoff_utc'], market_home_line=line, market_total=tot,
               components=dict(srs=round(c_srs, 2), dvoa_pts=round(c_dvoa, 2), ypp_pts=round(c_ypp, 2), hfa=hfa, adj_home=adj_h, adj_away=adj_a),
               model_line=round(model_line, 1), fair_line=round(fair_line, 1), edge_pts=round(line - fair_line, 1),
               base_total=round(base_tot, 1), fair_total=round(fair_tot, 1),
               sim_market=dict(home_cover=round(m['home_cover_excl_push'], 3), away_cover=round(m['away_cover_excl_push'], 3), over=round(m['over_excl_push'], 3),
                               under=round(m['under_excl_push'], 3), home_win=round(m['home_win_excl_tie'], 3)),
               opener_home_line=OPEN.get(gid, (None, None))[0], opener_total=OPEN.get(gid, (None, None))[1],
               kalshi_home_win_1106=KAL.get(hm),
               intel_proj_home_line=(round(-it['proj_home_margin'], 1) if 'proj_home_margin' in it else None), intel_notes=it.get('notes', []))
    sc = SC.get(frozenset((aw, hm)))
    if sc:
        fav, l = sc; sc_home = l if fav == hm else -l
        ms = sim(sc_home, tot, -(fair_line - sc_home), tadj)
        row['sc'] = dict(home_line=sc_home, home_cover=round(ms['home_cover_excl_push'], 3), away_cover=round(ms['away_cover_excl_push'], 3), push=round(ms['side_push'], 3))
    alts = []
    for team, sign in ((hm, 1), (aw, -1)):
        for pts, lab in SCEN.get(team, []):
            base_adj = ADJ.get(team, (0, ''))[0]
            ah, aa = (pts, adj_a) if team == hm else (adj_h, pts)
            mm2 = model(aw, hm, ah, aa, hfa)[3]; fl2 = line + SHRINK * (-mm2 - line)
            alts.append(dict(team=team, scenario=lab, adj=pts, fair_line=round(fl2, 1), edge_pts=round(line - fl2, 1)))
    row['scenarios'] = alts
    v = side_votes(aw, hm); model_side = hm if fair_line < line else aw
    row['expert_votes'] = dict(v); row['dissent_flag'] = v.get(aw if model_side == hm else hm, 0) >= 3 and abs(fair_line - line) >= 0.5
    row['model_side'] = model_side if abs(fair_line - line) >= 0.5 else None
    out.append(row)

meta = dict(generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'), week=10,
            weights=dict(srs=W_SRS, dvoa=W_DVOA, ypp=W_YPP), shrink=SHRINK, hfa=HFA, srs_weeks=f'1-{WEEKS}', srs_margin_cap=CAP,
            calibration=dict(dvoa_pts_per_pct=round(K_DVOA, 3), dvoa_r=round(R_DVOA, 3), ypp_pts_per_yard=round(K_YPP, 3), ypp_r=round(R_YPP, 3)),
            adjustments={k: dict(pts=v[0], why=v[1]) for k, v in ADJ.items()},
            scenarios={k: [dict(pts=p, label=l) for p, l in v] for k, v in SCEN.items()},
            srs_w1_9={t: round(v, 2) for t, v in sorted(srs.items(), key=lambda kv: -kv[1])},
            srs_power_file_1107={t: pr_old.get(t) for t in sorted(srs, key=lambda t: -srs[t])},
            inputs=dict(srs='computed from data/archive/2026/season/team-weeks.csv', ftn=ftn_dir, team_weeks='data/archive/2026/season/team-weeks.csv',
                        market=os.environ.get('W10_LINES_LABEL') or ('W10_LINES override' if OVR else 'public/schedule.json DK snapshot (odds_fetched_at ' + G[0].get('odds_fetched_at', '?') + ')'),
                        openers='DK Tuesday open (handoff 2026-11-10 15:00)', sc=(sc_p if SC else 'not captured yet'),
                        kalshi='data/prediction-markets/latest.json (pulled 11/06; pre-news, reference only)', podcasts=(DIGP if DIG['picks'] else 'not run yet'),
                        intel='reports/analysis/season/claude/out/week-09-matchup-intel.json'))
json.dump(dict(meta=meta, games=out), open(os.path.join(R, os.environ.get('W10_OUT', 'fair-lines-w10.json')), 'w'), indent=1)
print(json.dumps(meta['calibration']), 'SRS weeks', meta['srs_weeks'])
for o in out:
    print(f"{o['game']:8} mkt {o['market_home_line']:+5} model {o['model_line']:+6} fair {o['fair_line']:+6} edge {o['edge_pts']:+5} intel {o['intel_proj_home_line']} | tot {o['market_total']} base {o['base_total']} fair {o['fair_total']} "
          f"| simH {o['sim_market']['home_cover']} O {o['sim_market']['over']} | kal {o['kalshi_home_win_1106']} simW {o['sim_market']['home_win']} | " + '; '.join(f"{a['team']} {a['scenario'][:20]} fair {a['fair_line']}" for a in o['scenarios']))
