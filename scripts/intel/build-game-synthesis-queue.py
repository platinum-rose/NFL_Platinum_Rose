#!/usr/bin/env python3
"""Build the per-game synthesis queue (one sliced packet per game) for frontier-model agents.

Usage:
  python3 scripts/intel/build-game-synthesis-queue.py --week 7 --pass sides [--date 2026-10-23] [--qb-notes scratch/w07-qb-confirmations-1023.md]
  python3 scripts/intel/build-game-synthesis-queue.py --week 7 --pass props --date 2026-10-24

Writes scratch/w{WW}-game-synthesis-queue-{pass}.json (gitignored scratch). Read-only on every source.
Each packet carries only the rows that touch its two teams, plus file paths for anything too big to embed
(prop boards, team dossiers, FTN team context). Missing sources are listed in packet.missing_inputs, never fatal.
"""
import argparse, glob, json, os, re, sys
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)

def load(p):
    try:
        with open(p, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return None

def latest(pattern):
    hits = sorted(glob.glob(pattern), key=os.path.getmtime)
    return hits[-1] if hits else None

def mtime(p):
    return datetime.fromtimestamp(os.path.getmtime(p), timezone.utc).isoformat() if p and os.path.exists(p) else None

def trim(s, n=400):
    s = '' if s is None else str(s)
    return s if len(s) <= n else s[:n] + '...'

ap = argparse.ArgumentParser()
ap.add_argument('--week', type=int, required=True)
ap.add_argument('--season', type=int, default=2026)
ap.add_argument('--pass', dest='pass_', choices=['sides', 'props'], required=True)
ap.add_argument('--date', help='capture date YYYY-MM-DD for prop/gameline files (default: newest)')
ap.add_argument('--qb-notes', help='operator QB/availability notes file (md)')
ap.add_argument('--include-started', action='store_true')
ap.add_argument('--out')
a = ap.parse_args()
W, WW, S = a.week, f'{a.week:02d}', a.season
now = datetime.now(timezone.utc)
D = a.date or '*'

src = {}
def use(key, path):
    src[key] = {'path': path, 'mtime_utc': mtime(path)} if path and os.path.exists(path) else {'path': path, 'missing': True}
    return load(path) if path and os.path.exists(path) else None

slate = use('slate', f'data/generated/team-dossiers/w{WW}-slate.json') or {'games': []}
pull = use('master_intel_pull', f'data/generated/master-intel/w{WW}-pull.json') or {}
openers = use('an_openers', f'data/odds/actionnetwork-openers-{S}-w{WW}.json') or {}
sc = use('supercontest_lines', f'data/supercontest/week-{WW}-lines.json') or {}
wx = use('weather', f'data/research-intel/review/{S}-w{WW}-weather-venue.json') or {}
yt = use('youtube_picks', f'data/podcasts/youtube-extracted-picks-{S}-w{WW}.json') or {}
sec = use('secondary', f'data/secondary-matchups/secondary-matchup-vulnerability-{S}-w{WW}.json') or {}
pr = use('power_ratings', 'data/generated/team-profiles/team-power-ratings-2026.json') or {}
av = use('availability', 'data/player-availability/latest.json') or {}
ps = use('projected_starters', f'data/projected-starters/{S}/latest.json') or {}
cm = use('prediction_markets', 'data/prediction-markets/cross-market-coherence-latest.json') or {}
art = use('article_review', 'data/research-intel/review/article-intel-review-latest.json') or {}
ppi = use('props_intel', 'data/research-intel/review/player-props-intel-latest.json') or {}
rv = use('roster_vet', f'data/generated/master-intel/w{WW}-roster-vet.json') or {}
ftn = use('ftn_context', 'data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json') or {}
gl_path = latest(f'data/generated/props/bookmaker-gamelines-{D}-week{W}.raw.txt') or latest(f'data/generated/props/bookmaker-gamelines-*-week{W}.raw.txt')
src['bkr_gamelines'] = {'path': gl_path, 'mtime_utc': mtime(gl_path)} if gl_path else {'missing': True}
qb_text = ''
if a.qb_notes and os.path.exists(a.qb_notes):
    qb_text = open(a.qb_notes, encoding='utf-8').read(); src['qb_notes'] = {'path': a.qb_notes, 'mtime_utc': mtime(a.qb_notes)}

# team nick map
nick = {ab: (t.get('team_nick') or ab) for ab, t in (av.get('teams') or {}).items()}

# BKR current game lines (Andy paste format)
bkr = {}
if gl_path:
    for line in open(gl_path, encoding='utf-8'):
        m = re.match(r'^([A-Z]{2,3})@([A-Z]{2,3})', line.strip())
        if m:
            bkr[f'{m.group(1)}@{m.group(2)}'] = line.strip()

pr_rows = {r.get('team_abbr'): r for r in (pr.get('rows') or [])}
cm_rows = {r.get('team'): r for r in (cm.get('teams') or [])} if isinstance(cm.get('teams'), list) else (cm.get('teams') or {})

def kickoff_utc(g):
    o = (openers.get('games') or {}).get(f"{g['away']}@{g['home']}") or {}
    return o.get('kickoff_utc')

def mentions(text, ab):
    if not text: return False
    n = nick.get(ab, ab)
    return bool(re.search(rf'\b({re.escape(n)}|{ab})\b', text))

def team_rows_for_game(rows, A, H, max_teams=4, need_both=False):
    out = []
    for r in rows or []:
        t = set(r.get('teams') or [])
        if not t or len(t) > max_teams: continue
        hit = {A, H} & t
        if (need_both and len(hit) == 2) or (not need_both and hit): out.append(r)
    return out

packets = []
for g in slate.get('games', []):
    A, H = g['away'], g['home']; M = f'{A}@{H}'
    ko = kickoff_utc(g)
    started = bool(ko and datetime.fromisoformat(ko.replace('Z', '+00:00')) <= now)
    if started and not a.include_started:
        continue
    missing = []
    p = {'matchup': M, 'away': A, 'home': H, 'away_nick': nick.get(A), 'home_nick': nick.get(H),
         'kickoff_pt': g.get('kickoff_pt'), 'kickoff_utc': ko, 'pass': a.pass_}

    # market
    sc_row = next((x for x in sc.get('games', []) if x.get('favorite_abbr') in (A, H) and x.get('underdog_abbr') in (A, H)), None)
    p['market'] = {'bkr_current_line_text': bkr.get(M), 'bkr_source': gl_path,
                   'an_opener': (openers.get('games') or {}).get(M), 'an_opener_label': openers.get('label'),
                   'supercontest_line': sc_row, 'supercontest_captured_at': sc.get('captured_at')}
    if not bkr.get(M): missing.append('BKR current game line')

    # QB / availability
    p['qb_operator_notes'] = [l.strip() for l in qb_text.splitlines() if re.search(rf'\b({A}|{H})\b', l)]
    def team_av(ab):
        t = (av.get('teams') or {}).get(ab) or {}
        ev = [e for e in av.get('events', []) if (e.get('team_abbr') or e.get('primary_team')) == ab]
        ev = sorted(ev, key=lambda e: e.get('published_at') or '', reverse=True)
        keep = []
        seen = set()
        for e in ev:
            k = e.get('player_name')
            if k in seen: continue
            seen.add(k)
            st = str(e.get('normalized_status') or e.get('status_raw') or '').upper()
            if e.get('position') != 'QB' and (st in ('IR', 'PUP', 'NFI', 'RESERVE', 'SUSPENDED', 'RELEASED', 'ACTIVE', 'HEALTHY', '') or 'IR' == st.split()[0] if st else True):
                continue
            keep.append({kk: e.get(kk) for kk in ('player_name', 'position', 'normalized_status', 'event_type', 'availability_trend', 'short_summary', 'source', 'published_at', 'confidence', 'needs_human_review')})
        return {'summary': {k: t.get(k) for k in ('event_count', 'improving_count', 'worsening_count', 'major_count', 'cluster_risks')}, 'latest_by_player': keep[:40]}
    p['availability'] = {A: team_av(A), H: team_av(H), 'source_note': 'player-availability/latest.json has known misclassification bugs; confirm with official report / live search'}
    p['projected_starters'] = {ab: {k: (ps.get('teams') or {}).get(ab, {}).get(k) for k in ('coverage_status', 'known', 'estimated', 'missing')} for ab in (A, H)}

    # quantitative
    p['power_ratings'] = {ab: pr_rows.get(ab) for ab in (A, H)}
    p['prediction_markets'] = {ab: cm_rows.get(ab) for ab in (A, H)}
    p['ftn_team_context_selector'] = {'path': src['ftn_context']['path'], 'jq': f'.team_context.{A}, .team_context.{H}', 'record_counts': {ab: ((ftn.get('team_context') or {}).get(ab) or {}).get('record_count') for ab in (A, H)}}
    p['secondary_matchups'] = [m for m in (sec.get('matchups') or []) if {m.get('offense_team'), m.get('defense_team')} == {A, H}]
    p['team_dossiers'] = {ab: f'data/generated/team-dossiers/{S}-w{WW}/{ab}.md' for ab in (A, H)}

    # weather
    p['weather'] = next((r for r in wx.get('rows', []) if r.get('game') == M), None)

    # splits
    gid_hit = [s for s in pull.get('splits', []) if s.get('home_team') == H and s.get('away_team') == A]
    p['splits'] = gid_hit
    if not gid_hit: missing.append('bets-vs-money splits')

    # expert / article / podcast / social
    def ex_match(r):
        return mentions(r.get('visitor'), A) or mentions(r.get('home'), H) or mentions(r.get('visitor'), H) or mentions(r.get('home'), A)
    p['expert_picks_pull'] = [r for r in pull.get('expert', []) if ex_match(r)]
    p['youtube_picks_approved'] = [r for r in yt.get('picks', []) if r.get('game') == M]
    p['youtube_dropped'] = [{'game': r.get('game'), 'speaker': r.get('speaker'), 'reason': r.get('drop_reason') or r.get('reason')} for r in yt.get('dropped', []) if r.get('game') == M]
    sig = [r for r in pull.get('signals', []) if mentions(' '.join(str(r.get(k, '')) for k in ('team_or_market', 'lean', 'rationale')), A) or mentions(' '.join(str(r.get(k, '')) for k in ('team_or_market', 'lean', 'rationale')), H)]
    p['pick_signals'] = [{k: (trim(v, 500) if isinstance(v, str) else v) for k, v in r.items()} for r in sig][:60]
    notes = [r for r in pull.get('notes', []) if mentions((r.get('title') or '') + ' ' + (r.get('summary') or ''), A) or mentions((r.get('title') or '') + ' ' + (r.get('summary') or ''), H)]
    notes = sorted(notes, key=lambda r: r.get('published_at') or '', reverse=True)
    _seen = set(); _n = []
    for r in notes:
        key = re.sub(r'[^a-z]', '', (r.get('title') or '').lower())[:60]
        if key in _seen: continue
        _seen.add(key); _n.append(r)
    notes = _n
    p['news_notes'] = [{'source': r.get('source'), 'title': r.get('title'), 'summary': trim(r.get('summary'), 350), 'published_at': r.get('published_at'), 'url': r.get('url')} for r in notes][:50]
    p['article_selections'] = [{k: r.get(k) for k in ('item_id', 'teams', 'market', 'selection', 'side', 'line', 'price', 'book', 'analyst', 'tier', 'tier_label', 'evidence_status', 'source_article_id')} for r in team_rows_for_game((art.get('tiered_picks') or []) + (art.get('analyst_selections') or []), A, H)]
    _an, _seen = [], set()
    for r in team_rows_for_game(art.get('analysis_notes'), A, H, max_teams=2):
        txt = ' '.join(str(r.get(k) or '') for k in ('topic', 'text', 'summary'))
        if not (mentions(txt, A) or mentions(txt, H)): continue
        key = (r.get('source_article_id'), re.sub(r'[^a-z]', '', txt.lower())[:50])
        if key in _seen: continue
        _seen.add(key); _an.append(r)
    p['article_notes'] = [{k: (trim(r.get(k), 400) if isinstance(r.get(k), str) else r.get(k)) for k in ('item_id', 'note_type', 'teams', 'players', 'topic', 'text', 'summary', 'source_article_id')} for r in _an][:25]
    p['props_intel_articles'] = [r for r in (ppi.get('props') or []) if r.get('team') in (A, H)]

    # props boards (paths only; agent reads them)
    pa, ph = (nick.get(A) or A).lower(), (nick.get(H) or H).lower()
    def board(prefix):
        f = latest(f'data/generated/props/{prefix}-{D}-{pa}-at-{ph}.json') or latest(f'data/generated/props/{prefix}-*-{pa}-at-{ph}.json')
        if not f: return {'path': None, 'row_count': 0}
        d = load(f) or {}
        return {'path': f, 'capturedAt': d.get('capturedAt'), 'row_count': len(d.get('rows') or []), 'summary': d.get('summary')}
    p['prop_boards'] = {'bookmaker': board('bookmaker-live'), 'draftkings_predictions_reference_only': board('draftkings-predictions-live'), 'betonline': board('betonline-live')}
    if a.pass_ == 'props':
        for b in ('bookmaker', 'betonline'):
            if not p['prop_boards'][b]['path'] or (p['prop_boards'][b]['row_count'] or 0) < 100:
                missing.append(f'{b} player-prop board thin/missing ({p["prop_boards"][b]["row_count"]} rows)')

    p['missing_inputs'] = missing
    packets.append(p)

out = a.out or f'scratch/w{WW}-game-synthesis-queue-{a.pass_}.json'
os.makedirs(os.path.dirname(out), exist_ok=True)
q = {'schema': 'game_synthesis_queue_v2', 'season': S, 'week': W, 'pass': a.pass_, 'built_at_utc': now.isoformat(),
     'roster_vet': {k: rv.get(k) for k in ('status', 'roster_source', 'roster_age_h', 'totals')},
     'sources': src, 'game_count': len(packets), 'games': [p['matchup'] for p in packets], 'packets': packets}
with open(out, 'w', encoding='utf-8') as f:
    json.dump(q, f, indent=1, default=str)
sizes = {p['matchup']: len(json.dumps(p, default=str)) // 1024 for p in packets}
print(f'wrote {out}: {len(packets)} packets; KB per packet {sizes}')
for p in packets:
    if p['missing_inputs']: print(' ', p['matchup'], 'missing:', p['missing_inputs'])
