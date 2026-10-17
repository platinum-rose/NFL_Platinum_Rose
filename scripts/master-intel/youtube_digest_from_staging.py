#!/usr/bin/env python3
"""Build data/podcasts/youtube-extracted-picks-2026-w<NN>.json from the Antigravity staging JSONs.

Usage: python3 scripts/master-intel/youtube_digest_from_staging.py --week 6 [--exclude ID,ID] [--final SEA@DEN]
Reads  data/shadow-harness/antigravity-staging/youtube-<id>.json  (status == extracted, picks list)
Writes data/podcasts/youtube-extracted-picks-2026-w<NN>.json in the shape build.py reads
(picks / dropped / context / analysis_notes), status 'pending_andy_review'. Nothing is promoted.

Rules:
  - player props: team comes from data/nfl-rosters/roster-map-latest.json, not from the staging file
  - pickem_pick rows (straight-up contest picks) are not bets: they go to context, not picks
  - futures / no-game rows go to context
  - picks for games already final (--final) go to dropped
"""
import argparse, glob, json, os, re, collections, datetime
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--week', type=int, required=True)
ap.add_argument('--season', type=int, default=2026)
ap.add_argument('--exclude', default='')
ap.add_argument('--final', default='')
a = ap.parse_args()
WW = f'{a.week:02d}'
STG = os.path.join(ROOT, 'data/shadow-harness/antigravity-staging')
excl = {x for x in a.exclude.split(',') if x}
final = {x for x in a.final.split(',') if x}

sched = [g for g in json.load(open(os.path.join(ROOT, 'public/schedule.json'), encoding='utf-8'))
         if g.get('week') == a.week and g.get('season') == a.season and g.get('season_type') == 2]
by_gid = {f"{g['visitor']}@{g['home']}": g for g in sched}
by_team = {}
for gid, g in by_gid.items():
    by_team[g['visitor']] = gid; by_team[g['home']] = gid
roster = (json.load(open(os.path.join(ROOT, 'data/nfl-rosters/roster-map-latest.json'), encoding='utf-8')) or {}).get('players', {})

def sgn(x):
    return f'{x:+g}'
def pick_text(p, game):
    m, side, line, team, player = p.get('market'), (p.get('side') or ''), p.get('line'), p.get('team'), p.get('player')
    if m == 'spread' and team: return f'{team} {sgn(line)}' if line is not None else f'{team} spread (line not stated)'
    if m == 'moneyline' and team: return f'{team} ML'
    if m == 'total': return f"{game} {side.title() or '?'}" + (f' {line:g}' if line is not None else ' (line not stated)')
    if m == 'teaser' or m == 'teaser_leg': return f'{team} teaser leg'
    if player:
        s = {'OVER': 'o', 'UNDER': 'u'}.get(side.upper(), '')
        pr = f' {p["price"]:+d}' if isinstance(p.get('price'), (int, float)) else ''
        if m in ('anytime_td', 'any_time_td'): return f'{player} anytime TD{pr}'
        return f'{player} {s}{line:g} {m}' if line is not None else f'{player} {m} {side}'.strip()
    return f'{team or ""} {m} {side} {line if line is not None else ""}'.strip()

picks, dropped, context, notes = [], [], [], []
used = []
for f in sorted(glob.glob(os.path.join(STG, 'youtube-*.json'))):
    vid = os.path.basename(f)[8:-5]
    if vid in excl: continue
    d = json.load(open(f, encoding='utf-8'))
    if d.get('status') != 'extracted': continue
    rows = d.get('picks') or d.get('extracted_picks') or []
    if not rows: continue
    show = f"{d.get('channel') or d.get('show')} — {d.get('title')}"
    used.append((vid, show, len(rows)))
    for p in rows:
        url = f"https://www.youtube.com/watch?v={vid}&t={int(p.get('source_timestamp') or 0)}s"
        base = dict(episode=f'youtube-{vid}', show=show, speaker=p.get('speaker'), timestamp_url=url, rationale=p.get('rationale'))
        m = p.get('market')
        if m == 'pickem_pick':
            context.append(f"Pick'em (straight-up) — {p.get('speaker')}: {p.get('team')} wins [{vid}]"); continue
        team, verify = p.get('team'), None
        pl = p.get('player')
        if pl and re.search(r'\s(/|\+|&)\s', pl):   # combined SGP legs ("A / B"): not a single-player roster claim
            context.append(f"SGP combo — {p.get('speaker')}: {pl} {m} {p.get('side') or ''} {p.get('line') if p.get('line') is not None else ''} [{vid}]"); continue
        game = p.get('game')
        if pl:
            rm = roster.get(pl)
            if rm and rm.get('team'):
                rm = dict(rm, team={'WSH': 'WAS'}.get(rm['team'], rm['team']))
                gt = set(game.split('@')) if game and '@' in game else set()
                if gt and rm['team'] not in gt:
                    dropped.append(dict(base, raw=p, reason=f"team conflict: staging says {game}/{team}, roster map says {pl} is on {rm['team']}; needs a human check")); continue
                if team and team != rm['team']: verify = f"Staging tagged {pl} as {team}; roster map says {rm['team']}."
                team = rm['team']
        if not game or game not in by_gid:
            game = by_team.get(team) if team else None
        if not game:
            context.append(f"No-game/futures — {p.get('speaker')}: {pl or team} {m} {p.get('side') or ''} {p.get('line') if p.get('line') is not None else ''} [{vid}]".replace('  ', ' ')); continue
        if game in final:
            dropped.append(dict(base, raw=p, reason=f'{game} is final')); continue
        g = by_gid[game]
        raw = dict(team=team, player=pl, market=m, side=p.get('side'), line=p.get('line'), price=p.get('price'))
        row = dict(base, raw=raw, pick=pick_text(dict(p, team=team), game), price=p.get('price'), week=a.week, game=game,
                   kickoff_utc=g.get('kickoff_utc'), verify=verify, note=None, quote=p.get('quote'))
        if p.get('line') is None and m in ('spread', 'total'):
            row['note'] = 'line not stated by speaker; reprice before any use'
        picks.append(row)
    for n in (d.get('analysis_notes') or []):
        n = dict(n); n.setdefault('episode', f'youtube-{vid}'); n.setdefault('show', show)
        notes.append(n)

out = dict(generated_at=datetime.datetime.utcnow().isoformat() + 'Z', week=a.week, season=a.season, status='pending_andy_review',
           source=f'Antigravity zero-cost caption extraction, {len(used)} episodes staged (not promoted anywhere): ' + '; '.join(f'{v} ({n})' for v, _, n in used),
           picks=picks, dropped=dropped, context=context, analysis_notes=notes)
path = os.path.join(ROOT, f'data/podcasts/youtube-extracted-picks-{a.season}-w{WW}.json')
json.dump(out, open(path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
c = collections.Counter(p['game'] for p in picks)
print(f'wrote {path}: picks={len(picks)} dropped={len(dropped)} context={len(context)} notes={len(notes)} episodes={len(used)}')
print('by game:', dict(c))
