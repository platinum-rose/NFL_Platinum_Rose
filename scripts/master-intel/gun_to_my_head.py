"""Gun to my head calls (docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md), first implementation 2026-11-21 (Andy request).

Every active game gets a side call (full-game spread) and a total call: Strong lean, Lean, or a literal Coin flip.
Leans only: endorsed=false, execution_eligible=false; no path to the card, ledgers, SuperContest, My Card or books.

Seven evidence families vote a direction per market (neutral when the data does not separate the sides):
  1 model      - double-shrunk margin sim center vs the Bookmaker line (reports/intel/w11-model/sim-w11-sat.json)
  2 movement   - Action Network opener -> Bookmaker current
  3 money      - dated splits / big-money flags; stale (>6 h at as-of) counts neutral, shown as dated context
  4 analytics  - FTN EPA matchup projection vs the Bookmaker line (same sim file)
  5 availability - material outs and QB status from the saved Saturday checks (curated table below, with sources)
  6 experts    - independent expert calls (verified rows + podcasts + X), repeats of one person collapsed
  7 situational - venue weather review (totals); rest/travel not in the saved snapshot
Holds-to / tip points are computed by re-running the same rules at worse / better numbers (line-dependent families).

Usage:
  python scripts/master-intel/gun_to_my_head.py --week 11 --as-of 2026-11-21T20:45:00-08:00
  python scripts/master-intel/gun_to_my_head.py --week 11 --grade      # after finals: grade the ledger
"""
import argparse, collections, csv, datetime, glob, hashlib, json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.dirname(__file__))
os.chdir(ROOT)
ALIAS = {'WSH': 'WAS', 'JAC': 'JAX', 'LVR': 'LV', 'LA': 'LAR'}
ab = lambda t: ALIAS.get(t, t)
SIDE_KEYS, TOTAL_KEYS = [3, 7, 10], [41, 44, 47]
FAM = {1: 'Model (double-shrunk sim)', 2: 'Market movement', 3: 'Money signals', 4: 'Matchup analytics (FTN EPA)',
       5: 'Availability', 6: 'Expert consensus', 7: 'Situational'}
ORDER = [1, 4, 6, 5, 2, 7, 3]


def J(p, d=None):
    try:
        with open(p, encoding='utf-8') as f: return json.load(f)
    except (OSError, ValueError): return d


def sha(p):
    try: return hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16]
    except OSError: return None


def fmt_line(x):
    x = round(float(x) * 2) / 2 if abs(float(x) * 2 - round(float(x) * 2)) < 1e-9 else round(float(x), 1)
    return 'PK' if x == 0 else f'{x:+g}'


# ---------------------------------------------------------------- availability (curated from the saved Saturday checks)
AVAIL = {  # side direction ('home'/'away'/None), note, conditions
    'MIA@BUF': ('home', 'Miami starts Kyle McCord with Malik Willis on IR (QB downgrade); Buffalo has CB Christian Benford out.', []),
    'NO@CHI': ('home', 'Three Saints offensive-line starters are out (Erik McCoy, Taliese Fuaga, Asim Richards); Chicago is without CB Kyler Gordon.', []),
    'TEN@DAL': ('away', 'Dallas is missing CB DaRon Bland, TE Jake Ferguson, S P.J. Locke, G Tyler Booker and WR Jonathan Mingo; Tennessee lost RB Tyjae Spears to IR.', []),
    'TB@DET': (None, 'Tampa Bay is without S Antoine Winfield Jr.; Baker Mayfield is questionable (foot and thumb).', ['Mayfield Questionable: the calls assume Baker Mayfield starts. If rookie Jalon Daniels starts, treat the TB@DET calls as Coin flips.']),
    'ARI@KC': ('home', 'Arizona is expected to start backup Josh Johnson (Carson Beck questionable, did not practice Friday).', ['Josh Johnson preparing to start (Beck Q): if Beck starts instead, recheck the ARI@KC calls.']),
    'PIT@PHI': ('away', 'Philadelphia starts Joe Milton (his second start, QB downgrade); Pittsburgh is without LB Nick Herbig.', []),
    'BAL@CAR': ('home', 'Baltimore starts Jacoby Brissett with Lamar Jackson on IR and is missing CB Marlon Humphrey, DT Nnamdi Madubuike and S Jaylinn Hawkins.', []),
    'NYJ@LAC': (None, 'Both sides are short: the Chargers lost S Kendall Williamson and CB Rodney Shelley (CBs Tarheeb Still and Isas Waxter questionable); the Jets are without WRs Omar Cooper Jr. and Isaiah Williams.', []),
    'LV@DEN': (None, 'TE Brock Bowers and K Matt Gay are questionable for Las Vegas.', ['Bowers and Gay are questionable: confirm at Sunday inactives.']),
    'JAX@NYG': (None, 'No material out identified in the saved Saturday checks.', []),
    'MIN@SF': ('away', 'San Francisco is without WR Brandon Aiyuk and WR Mike Evans is questionable (top receivers); Kirk Cousins starts for Minnesota.', []),
    'CIN@WAS': ('away', 'Washington lost OT Laremy Tunsil and RB Jacory Croskey-Merritt to IR.', []),
}
OFFICIAL = {  # read-only dispositions from the approved Saturday card (reports/bets/2026-w11-card.md, digest sections C/L)
    ('NYJ@LAC', 'side'): ('pick', 'away', -3, -103, 'Official pick: NYJ +3 (-103), Platinum Rose'),
    ('JAX@NYG', 'side'): ('lean', 'away', 5.5, -108, 'Card lean (not elevated): JAX -5.5'),
    ('PIT@PHI', 'side'): ('lean', 'away', 4, -102, 'Card lean (not elevated): PIT -4'),
    ('CIN@WAS', 'side'): ('lean', 'away', 6, -113, 'Card lean (not elevated): CIN -6'),
    ('MIN@SF', 'total'): ('lean', 'under', 46.5, -107, 'Card lean (not elevated): Under 46.5'),
    ('NO@CHI', 'total'): ('lean', 'under', 48, -106, 'Card lean (not elevated): Under 48 (weather lean, no model edge)'),
}
SC_PITCH = {'TB@DET': 'TB +7', 'TEN@DAL': 'TEN +8', 'NYJ@LAC': 'NYJ +3.5', 'MIN@SF': 'SF -3', 'MIA@BUF': 'MIA +16.5',
            'BAL@CAR': 'CAR -2.5 (alternate)', 'LV@DEN': 'DEN -10 (alternate)'}

SRC = {
    'bkr': 'data/generated/props/bookmaker-live-2026-11-21-week11.json', 'bol': 'data/generated/props/betonline-live-2026-11-22-week11.json',
    'dkp': 'data/generated/props/draftkings-predictions-feed-2026-11-19-week11.json', 'open': 'data/odds/actionnetwork-openers-2026-w11.json',
    'sim': 'reports/intel/w11-model/sim-w11-sat.json', 'flags': 'data/generated/master-intel/big-money-flags-2026-w11.json',
    'avail': 'data/player-availability/latest.json', 'qb': 'reports/intel/w11-qb-injury-news-check-2026-11-21.md',
    'verified': 'data/generated/master-intel/w11-expert-verified.json', 'yt': 'data/podcasts/youtube-extracted-picks-2026-w11.json',
    'podcasts': 'data/intel/articles/2026-w11/reviewed-podcast-picks.json', 'grok': 'data/vault-seed/manual/grok-week11-threads',
    'wx': 'data/research-intel/review/2026-w11-weather-venue.json', 'sched': 'public/schedule.json', 'card': 'reports/bets/2026-w11-card.md',
}


def load(season, W, as_of):
    sched = J(SRC['sched'], {}); games = [g for g in (sched.get('games', sched) if isinstance(sched, dict) else sched) if int(g.get('week', 0)) == W]
    NAME = {}
    for g in games:
        NAME[g['visitorName']] = ab(g['visitor']); NAME[g['homeName']] = ab(g['home'])
        NAME[g['visitorName'].split()[-1]] = ab(g['visitor']); NAME[g['homeName'].split()[-1]] = ab(g['home'])
    sim = J(SRC['sim'], {})
    # BetOnline game lines
    bol = J(SRC['bol'], {}) or {}; BOL = collections.defaultdict(dict)
    for r in bol.get('rows', []):
        if r.get('market') != 'game_lines' or r.get('bet') not in ('spread', 'total'): continue
        aw, hm = r['event'].split(' @ '); gid = f"{NAME.get(aw)}@{NAME.get(hm)}"
        key = ab(NAME.get(r.get('team'))) if r['bet'] == 'spread' else r['side']
        BOL[gid][key] = (r.get('line'), r.get('odds'))
    # DK Predictions (Thursday capture; reference unless fresh)
    dkp = J(SRC['dkp'], {}) or {}; DKP = collections.defaultdict(dict)
    for r in dkp.get('rows', []):
        if r.get('player') or r.get('market') not in ('spread', 'game_total'): continue
        gid = r.get('game') or r.get('event') or ''
        gid = gid if '@' in gid and len(gid) < 10 else None
        if not gid: continue
        key = ab(r.get('team')) if r['market'] == 'spread' else str(r.get('side') or r.get('label') or '').title()
        DKP[gid][key] = (r.get('line') if r.get('line') is not None else r.get('lineEquiv'), r.get('american'))
    return dict(games=games, NAME=NAME, sim=sim, BOL=BOL, DKP=DKP, bol_at=bol.get('capturedAt'), dkp_at=dkp.get('capturedAt'),
                openers=(J(SRC['open'], {}) or {}).get('games', {}), flags=J(SRC['flags'], {}) or {}, wx={r['game']: r for r in (J(SRC['wx'], {}) or {}).get('rows', [])})


def expert_pool(season, W, NAME, gids):
    """Independent expert calls per game: {gid: {'side': {person: dir}, 'total': {person: dir}}}."""
    import extra_inputs as xi
    yt = J(SRC['yt'], {}) or {}
    try:
        import twitter_picks as tp; yt = tp.merge(yt, ROOT, season, str(W))
    except Exception as e: print('WARN twitter merge', e)
    yt = xi.merge_reviewed_podcasts(yt, ROOT, season, W, [])
    rows = []
    for p in yt.get('picks', []):
        raw = p.get('raw') or {}
        mk = str(p.get('market') or raw.get('market') or '').lower(); sd = p.get('side') or raw.get('side'); tm = p.get('team') or raw.get('team')
        if not mk and p.get('pick'):
            m = re.match(r'^(Over|Under)\s', str(p['pick'])); mk = 'total' if m else ('spread' if re.match(r'^[A-Z]{2,3}\s[+-]', str(p['pick'])) else '')
            sd = m.group(1) if m else str(p['pick']).split()[0]
        rows.append((p.get('speaker'), xi._norm(p.get('game')), mk, sd, tm, p.get('player'), p.get('show') or p.get('source_pipeline') or 'podcast/X'))
    for r in (J(SRC['verified'], {}) or {}).get('rows', []):
        rows.append((' & '.join(r.get('persons') or []) or r.get('outlet'), xi._norm(r.get('game')), str(r.get('market') or '').lower(), r.get('side'), r.get('side'), None, r.get('outlet') or 'article'))
    out = {g: {'side': collections.defaultdict(set), 'total': collections.defaultdict(set)} for g in gids}
    for spk, gid, mk, sd, tm, player, src in rows:
        if gid not in out or not spk or player: continue
        aw, hm = gid.split('@'); spk = re.sub(r'\s+', ' ', str(spk)).strip()
        if mk in ('total', 'game_total') :
            d = 'over' if str(sd or '').lower().startswith('o') else ('under' if str(sd or '').lower().startswith('u') else None)
            if d: out[gid]['total'][spk].add(d)
        elif 'spread' in mk and 'team' not in mk:
            t = ab(NAME.get(sd, sd)) if sd else ab(NAME.get(tm, tm))
            d = 'away' if t == aw else ('home' if t == hm else None)
            if d: out[gid]['side'][spk].add(d)
    # collapse: one vote per person; a person with both directions is dropped (reversal / conflict)
    return {g: {m: {p: next(iter(ds)) for p, ds in v.items() if len(ds) == 1} for m, v in mk.items()} for g, mk in out.items()}


def families(gid, market, ctx, line, total, exp, cur=None):
    """Return {fam: (direction, detail, sources)} for one market at a hypothetical line/total."""
    g = ctx['sim']['games'][gid]; aw, hm = gid.split('@'); F = {}
    cur_line, cur_total = cur if cur else (g['market_line'], g['market_total'])
    slate_bias_m = sum(x['model_total'] - x['market_total'] for x in ctx['sim']['games'].values()) / len(ctx['sim']['games'])
    an_list = [x['analytics'] for x in ctx['sim']['games'].values() if x.get('analytics')]
    slate_bias_a = sum(a['proj_total'] - x['market_total'] for x, a in ((x, x['analytics']) for x in ctx['sim']['games'].values() if x.get('analytics'))) / max(1, len(an_list))
    side_txt = lambda d, ln: (f'{hm} {fmt_line(ln)}' if d == 'home' else f'{aw} {fmt_line(-ln)}')
    if market == 'side':
        gap = 0.5 * (g['model_line'] - line)  # center - line, home-line units
        d = 'home' if gap <= -0.5 else ('away' if gap >= 0.5 else None)
        F[1] = (d, f"Team-strength model {side_txt('home' if g['model_line'] <= 0 else 'away', round(g['model_line'], 1))}; the sim centers halfway from the market, a {abs(gap):.1f}-point shift" + (f" toward {aw if d == 'away' else hm}" if d else ' (below the 0.5-point threshold)') + '.', ['sim-model'])
        o = ctx['openers'].get(gid, {}); op = (o.get('sp') or {}).get(hm)
        if op is not None:
            mv = cur_line - op; d = 'away' if mv >= 0.5 else ('home' if mv <= -0.5 else None)
            F[2] = (d, f"Opened {hm} {fmt_line(op)}, now {hm} {fmt_line(cur_line)}" + (f": the move favors {aw if d == 'away' else hm}" if d else ': no meaningful move') + '.', ['an-openers', 'bkr-0543'])
        else: F[2] = (None, 'No saved opener.', ['an-openers'])
        an = g.get('analytics')
        if an:
            gap = an['proj_home_line'] - line; d = 'home' if gap <= -1.5 else ('away' if gap >= 1.5 else None)
            F[4] = (d, f"FTN EPA matchup projects {('a pick' + chr(39) + 'em') if abs(an['proj_home_line']) < 0.25 else side_txt('home' if an['proj_home_line'] <= 0 else 'away', round(an['proj_home_line'], 1))} ({aw} {an['away_pts']:.1f}, {hm} {an['home_pts']:.1f})" + ('' if d else '; within 1.5 points of the line') + '.', ['sim-analytics', 'ftn-w9'])
        else: F[4] = (None, 'No FTN projection.', ['ftn-w9'])
        av = AVAIL.get(gid, (None, 'No saved availability check.', []))
        F[5] = (av[0], av[1], ['espn-injuries', 'qb-check'])
        e = exp.get(gid, {}).get('side', {}); na = [p for p, d in e.items() if d == 'away']; nh = [p for p, d in e.items() if d == 'home']
        d = 'away' if len(na) - len(nh) >= 2 else ('home' if len(nh) - len(na) >= 2 else None)
        F[6] = (d, f"{len(na)} independent expert calls on {aw}" + (f" ({', '.join(sorted(na)[:4])}{'…' if len(na) > 4 else ''})" if na else '') + f", {len(nh)} on {hm}" + (f" ({', '.join(sorted(nh)[:4])}{'…' if len(nh) > 4 else ''})" if nh else '') + ('' if d else '; a net margin of 2 is needed') + '.', ['expert-pool'])
        F[7] = (None, 'MIN@SF is at a neutral site (Mexico City); no rest or travel edge in the saved snapshot.' if gid == 'MIN@SF' else 'No rest, travel or short-week edge in the saved snapshot.', ['schedule'])
    else:
        mgap = (g['model_total'] - total) - slate_bias_m; d = 'over' if mgap >= 1.5 else ('under' if mgap <= -1.5 else None)
        F[1] = (d, f"Team-strength model total {g['model_total']:.1f} vs {total:g}; after removing the slate-wide model lean ({slate_bias_m:+.1f}) the gap is {mgap:+.1f}" + ('' if d else ', below the 1.5-point threshold') + '.', ['sim-model'])
        o = ctx['openers'].get(gid, {}); ot = o.get('tot')
        if ot is not None:
            mv = cur_total - ot; d = 'over' if mv >= 0.5 else ('under' if mv <= -0.5 else None)
            F[2] = (d, f"Total opened {ot:g}, now {cur_total:g}" + (f": the move favors the {d.title()}" if d else ': no meaningful move') + '.', ['an-openers', 'bkr-0543'])
        else: F[2] = (None, 'No saved opener.', ['an-openers'])
        an = g.get('analytics')
        if an:
            agap = (an['proj_total'] - total) - slate_bias_a; d = 'over' if agap >= 2 else ('under' if agap <= -2 else None)
            F[4] = (d, f"FTN EPA matchup projects {an['proj_total']:.1f}; after the slate-wide lean ({slate_bias_a:+.1f}) the gap is {agap:+.1f}" + ('' if d else ', inside the 2-point threshold') + '.', ['sim-analytics', 'ftn-w9'])
        else: F[4] = (None, 'No FTN projection.', ['ftn-w9'])
        F[5] = (None, 'Availability is scored on the side only.', ['espn-injuries'])
        e = exp.get(gid, {}).get('total', {}); no = [p for p, d in e.items() if d == 'over']; nu = [p for p, d in e.items() if d == 'under']
        d = 'over' if len(no) - len(nu) >= 2 else ('under' if len(nu) - len(no) >= 2 else None)
        F[6] = (d, f"{len(no)} independent expert calls on the Over" + (f" ({', '.join(sorted(no)[:4])}{'…' if len(no) > 4 else ''})" if no else '') + f", {len(nu)} on the Under" + (f" ({', '.join(sorted(nu)[:4])}{'…' if len(nu) > 4 else ''})" if nu else '') + ('' if d else '; a net margin of 2 is needed') + '.', ['expert-pool'])
        w = ctx['wx'].get(gid)
        if w and str(w.get('materiality') or 'none') not in ('none', ''):
            F[7] = ('under', f"Weather review flags it ({w.get('materiality')}): {w.get('precip_prob_pct', '?')}% rain chance, gusts {round((w.get('gust_kmh') or 0) * 0.621371)} mph at kickoff.", ['weather'])
        else:
            F[7] = (None, ('Indoor or covered stadium.' if w and w.get('temp_c') is None else 'Weather review shows no material impact.') if w else 'No weather row.', ['weather'])
    F[3] = (None, 'Splits are dated (Action Network Sat 8:37 AM; big-money flags from Tue 11/17 splits), so they count as context only.', ['an-splits', 'big-money'])
    return F


def tally(F, conds):
    dirs = [d for d, _, _ in F.values() if d]
    c = collections.Counter(dirs)
    if not c: return None, 'Coin flip', 0, 0
    (top, n), = c.most_common(1); other = sum(v for k, v in c.items() if k != top)
    if n == other: return None, 'Coin flip', n, other
    if n >= 3 and other == 0: return top, ('Lean' if conds else 'Strong lean'), n, other
    return top, 'Lean', n, other


def search(gid, market, ctx, exp, base_line, base_total, conds, pick, step):
    """Walk the number in half points (up to 3 points); return the last number keeping `pick` (holds-to) or the first
    number producing a lean on `pick` (tip point)."""
    last = None
    for k in range(1, 7):
        x = (base_line if market == 'side' else base_total) + step * 0.5 * k
        F = families(gid, market, ctx, x if market == 'side' else base_line, base_total if market == 'side' else x, exp)
        d, tier, _, _ = tally(F, conds)
        yield x, d, tier


def book_block(gid, market, d, ctx, line, total):
    aw, hm = gid.split('@'); g = ctx['sim']['games'][gid]; px = g.get('prices') or {}; out = []
    if market == 'side':
        team = aw if d == 'away' else hm; tl = -line if d == 'away' else line
        b = (px.get('spread') or {}).get(team)
        if b: out.append(dict(book='Bookmaker', line=b[0], price=b[1], at='Sat 5:43 PM PT', fresh=True))
        b = ctx['BOL'].get(gid, {}).get(team)
        if b and b[0] is not None: out.append(dict(book='BetOnline', line=b[0], price=b[1], at='Sat 5:46 PM PT', fresh=True))
        b = ctx['DKP'].get(gid, {}).get(team)
        if b and b[0] is not None: out.append(dict(book='DK Predictions', line=b[0], price=b[1], at='Thu 1:12 PM PT', fresh=False))
        label = lambda r: f"{r['book']} {team} {fmt_line(r['line'])} ({r['price']:+d})" if r.get('price') is not None else f"{r['book']} {team} {fmt_line(r['line'])}"
        best = max([r for r in out if r['fresh']], key=lambda r: (r['line'], r['price'] or -999), default=None)
    else:
        side = d.title(); tot = (px.get('total') or {}).get(side)
        if tot: out.append(dict(book='Bookmaker', line=tot[0], price=tot[1], at='Sat 5:43 PM PT', fresh=True))
        b = ctx['BOL'].get(gid, {}).get(side)
        if b and b[0] is not None: out.append(dict(book='BetOnline', line=b[0], price=b[1], at='Sat 5:46 PM PT', fresh=True))
        b = ctx['DKP'].get(gid, {}).get(side)
        if b and b[0] is not None: out.append(dict(book='DK Predictions', line=b[0], price=b[1], at='Thu 1:12 PM PT', fresh=False))
        label = lambda r: f"{r['book']} {side} {r['line']:g} ({r['price']:+d})" if r.get('price') is not None else f"{r['book']} {side} {r['line']:g}"
        sign = -1 if d == 'over' else 1
        best = max([r for r in out if r['fresh']], key=lambda r: (sign * r['line'], r['price'] or -999), default=None)
    for r in out:
        r['text'] = label(r) + f" · {r['at']}" + ('' if r['fresh'] else ' · stale, reference only, before fees')
    return out, best


def build(season, W, as_of):
    ctx = load(season, W, as_of); sim = ctx['sim']
    kick = {f"{ab(g['visitor'])}@{ab(g['home'])}": g.get('kickoff_utc') for g in ctx['games']}
    gids = sorted(sim['games'], key=lambda g: (kick.get(g) or '', g))
    exp = expert_pool(season, W, ctx['NAME'], gids)
    be = lambda p: (-p / (-p + 100)) if p < 0 else (100 / (p + 100))
    calls = []
    for gid in gids:
        g = sim['games'][gid]; aw, hm = gid.split('@'); line, total = g['market_line'], g['market_total']
        conds = AVAIL.get(gid, (None, '', []))[2]
        for market in ('side', 'total'):
            F = families(gid, market, ctx, line, total, exp)
            d, tier, n_for, n_against = tally(F, conds)
            off = OFFICIAL.get((gid, market))
            rec = dict(id=f'gtmh-w{W}-{gid}-{market}', game=gid, away=aw, home=hm, kickoff_utc=kick.get(gid), market=market,
                       endorsed=False, execution_eligible=False, conditions=conds,
                       families={str(k): dict(name=FAM[k], direction=v[0], detail=v[1], sources=v[2]) for k, v in sorted(F.items())},
                       evidence_direction=d, evidence_tier=tier, n_for=n_for, n_against=n_against,
                       official=(off[4] if off else 'Passed: no Platinum Rose pick or card lean on this market'),
                       supercontest=SC_PITCH.get(gid) if market == 'side' else None)
            # official overlap: an official pick fills the slot; the lean never contradicts it
            if off and off[0] == 'pick':
                rec.update(call_direction=off[1], tier='Official pick', note=('Evidence tally agrees.' if d == off[1] else f'Evidence tally: {tier.lower()}' + (f" toward {aw if d == 'away' else hm}" if d in ('away', 'home') else '') + '; the official pick fills the slot.'))
            else:
                rec.update(call_direction=d, tier=tier)
                if off and off[0] == 'lean' and d != off[1]:
                    rec['official_conflict'] = ('Disagrees with the card lean.' if d else 'The evidence does not support the card lean (Coin flip).')
            cd = rec['call_direction']
            if cd:
                books, best = book_block(gid, market, cd, ctx, line, total)
                rec['books'] = [r['text'] for r in books]; rec['best'] = best and {k: best[k] for k in ('book', 'line', 'price', 'at')}
                if market == 'side':
                    team = aw if cd == 'away' else hm; tl = -line if cd == 'away' else line
                    rec['call'] = f"{team} {fmt_line(tl)}"
                    p = g['home_cover_xp'] if cd == 'home' else g['away_cover_xp']
                else:
                    rec['call'] = f"{cd.title()} {total:g}"; p = g['over_xp'] if cd == 'over' else g['under_xp']
                bk = next((r for r in books if r['book'] == 'Bookmaker'), None); price = bk and bk.get('price')
                rec['sim_p'] = p; rec['break_even'] = be(price) if price else None; rec['sim_at'] = bk and bk['text'].split(' · ')[0]
                # holds to: walk worse numbers until the call is no longer a lean on the same direction
                step = (1 if cd == 'away' else -1) if market == 'side' else (1 if cd == 'over' else -1)
                hold = line if market == 'side' else total; holds_open = True
                for x, dd, tt in search(gid, market, ctx, exp, line, total, conds, cd, step):
                    if dd == cd: hold = x
                    else: holds_open = False; break
                hv = (-hold if cd == 'away' else hold) if market == 'side' else hold
                rec['holds_to'] = (f"holds to {fmt_line(hv)}" if market == 'side' else f"holds to {hv:g}") + (' or further (3-point search limit)' if holds_open else '')
                if rec['tier'] == 'Official pick': rec['holds_to'] += ' on the evidence tally; the official pick has its own playable-to rule'
            else:
                rec['call'] = 'Coin flip'; rec['books'] = []; rec['best'] = None; rec['sim_p'] = None; rec['break_even'] = None
                tips = []
                for dd_target, step in ((('away', 1), ('home', -1)) if market == 'side' else (('over', -1), ('under', 1))):
                    # better numbers for dd_target: away better when the home line rises; over better when the total falls
                    for x, dd, tt in search(gid, market, ctx, exp, line, total, conds, dd_target, step if market == 'total' else (-1 if dd_target == 'away' else 1)):
                        if dd == dd_target:
                            if market == 'side':
                                t = aw if dd_target == 'away' else hm; tl = -x if dd_target == 'away' else x
                                tips.append(f"{t} {fmt_line(tl)} or better → {tt} {t}")
                            else: tips.append(f"{dd_target.title()} {x:g} or better → {tt} {dd_target.title()}")
                            break
                rec['tips'] = tips or ['No number within 3 points tips it on the saved evidence.']
                if conds: rec['tips'].append('Or a resolved condition: ' + '; '.join(conds))
            fam_sorted = [(k, F[k]) for k in ORDER if k in F]
            sup = [f"{FAM[k]}: {v[1]} [{', '.join(v[2])}]" for k, v in fam_sorted if rec['call_direction'] and v[0] == rec['call_direction']][:3]
            opp = [f"{FAM[k]}: {v[1]} [{', '.join(v[2])}]" for k, v in fam_sorted if v[0] and v[0] != rec['call_direction']][:3]
            if not rec['call_direction']:
                sides = (('away', aw), ('home', hm)) if market == 'side' else (('over', 'Over'), ('under', 'Under'))
                rec['best_case'] = {lbl: [f"{FAM[k]}: {v[1]} [{', '.join(v[2])}]" for k, v in fam_sorted if v[0] == dd][:3] or ['No family points this way.'] for dd, lbl in sides}
            rec['for'] = sup; rec['against'] = opp or ['No specific counter-case in saved evidence.']
            names = [FAM[k] for k, v in fam_sorted if v[0] and v[0] == rec['call_direction']]
            if rec['call_direction']:
                why = f"{len(names)} of 7 evidence families point to {rec['call']} ({', '.join(names)}); {len([1 for _, v in fam_sorted if v[0] and v[0] != rec['call_direction']])} point the other way."
                if rec['sim_p'] is not None and rec['break_even']:
                    why += f" The double-shrunk sim gives it {100 * rec['sim_p']:.1f}% (pushes excluded) vs a {100 * rec['break_even']:.1f}% break-even at {rec['sim_at']}."
            else:
                why = (f"The evidence does not separate the two sides: {n_for} {'family' if n_for == 1 else 'families'} each way." if n_for else 'No evidence family points either way.') + ' No side is named.'
            rec['why'] = why
            calls.append(rec)
    counts = collections.Counter(c['tier'] for c in calls)
    gate = J(f'reports/intel/gates/w{W}-final-gate-saturday.json', {}) or {}
    return dict(schema='gun_to_my_head_v1', season=season, week=W, as_of=as_of, generated_at=datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
                spec='docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md', label='Lean · No Platinum Rose endorsement',
                official_gate=dict(stage=gate.get('stage'), verdict=gate.get('verdict'), failing=[c['id'] for c in gate.get('checks', []) if c.get('status') == 'FAIL' and c.get('level') != 'ADVISORY']),
                inputs={k: dict(path=v, sha256=(sha(v) if os.path.isfile(v) else None)) for k, v in SRC.items()},
                source_ids={'bkr-0543': SRC['bkr'], 'bol-0546': SRC['bol'], 'dkp-thu': SRC['dkp'], 'an-openers': SRC['open'], 'sim-model': SRC['sim'] + ' (main view)',
                            'sim-analytics': SRC['sim'] + ' (analytics view)', 'ftn-w9': 'data/generated/team-dossiers/2026-w11/*.json (FTN team tables through Week 9)',
                            'espn-injuries': SRC['avail'], 'qb-check': SRC['qb'], 'expert-pool': ' + '.join([SRC['verified'], SRC['yt'], SRC['podcasts'], SRC['grok'] + '/*.csv']),
                            'weather': SRC['wx'], 'an-splits': 'Action Network splits (Sat 8:37 AM, in the master packet)', 'big-money': SRC['flags'], 'schedule': SRC['sched']},
                tier_counts=dict(counts), calls=calls)


def ledger_update(doc):
    p = f"data/research-intel/gun-to-my-head-ledger-{doc['season']}.json"; L = J(p, {'schema': 'gun_to_my_head_ledger_v1', 'season': doc['season'], 'entries': []})
    L['entries'] = [e for e in L['entries'] if e.get('week') != doc['week']] + [
        dict(id=c['id'], week=doc['week'], game=c['game'], market=c['market'], call=c['call'], tier=c['tier'], best=c.get('best'),
             as_of=doc['as_of'], result=None, final=None, closing=None) for c in doc['calls']]
    json.dump(L, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False); return p


def grade(season, W):
    import sc_review
    p = f'data/research-intel/gun-to-my-head-ledger-{season}.json'; L = J(p); boxes = sc_review._boxscore_map(W); n = 0
    for e in L['entries']:
        if e['week'] != W: continue
        aw, hm = e['game'].split('@'); b = boxes.get(hm)
        if not b: continue
        hs, _, as_, _ = b; e['final'] = f'{aw} {as_}, {hm} {hs}'
        if e['call'] == 'Coin flip' or not e.get('best'): e['result'] = 'logged (Coin flip)'; n += 1; continue
        ln = e['best']['line']
        if e['market'] == 'side':
            team = e['call'].split()[0]; margin = (hs - as_) if team == hm else (as_ - hs); v = margin + ln
        else:
            v = (hs + as_ - ln) * (1 if e['call'].startswith('Over') else -1)
        e['result'] = 'win' if v > 0 else ('loss' if v < 0 else 'push'); n += 1
    json.dump(L, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False); print('graded', n)


if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--season', type=int, default=2026); a.add_argument('--week', type=int, required=True)
    a.add_argument('--as-of'); a.add_argument('--grade', action='store_true'); a = a.parse_args()
    if a.grade: grade(a.season, a.week); sys.exit()
    doc = build(a.season, a.week, a.as_of or datetime.datetime.now().astimezone().isoformat(timespec='seconds'))
    out = f'data/research-intel/review/{a.season}-w{a.week:02d}-gun-to-my-head.json'
    json.dump(doc, open(out, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('wrote', out, doc['tier_counts'], '| ledger', ledger_update(doc))
    for c in doc['calls']:
        print(f"{c['game']:8} {c['market']:5} {c['tier']:13} {c['call']:13} {c.get('holds_to') or ' / '.join(c.get('tips', []))[:90]}  [{c['n_for']}-{c['n_against']}]")
