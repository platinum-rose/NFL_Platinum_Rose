#!/usr/bin/env python3
"""Generic paper grader (replaces the per-week paper_wN.py from Week 9 on).

Grades two kinds of unbooked AI builds from box scores -> wNpaper.json (same shape gen_week.py reads):
  1. the week's paper tickets in data/official-picks/paper-wagers-2026.json
  2. every multi-leg proposal in the machine-readable AI record (data/official-picks/ai-proposals/2026-wNN.json),
     skipping singles/straights/round robins and withdrawn proposals, and skipping a proposal whose legs match a paper ticket.
Paper != real: none of this enters a cash total.
  WEEK=9 python3 scripts/paper.py [--out path]
"""
import json, os, sys
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
os.environ.setdefault('RECAP_DIR', os.path.join(D, '..'))
from grade import *  # noqa: F401,F403
from parse_placed import parse_leg, grade_spec
import ai_record
WEEK = os.environ['WEEK']
ROOT = os.path.abspath(os.path.join(D, '..', '..', '..', '..'))
STORED = {'WON': 'W', 'LOST': 'L', 'PUSH': 'P'}


def gl_row(s, r):
    return dict(label=s['label'], result=r['result'], actual=r.get('actual'), margin=r.get('margin'), kind=s['kind'], key=s.get('key'),
                thr=s.get('thr', s.get('line')), player=s.get('player'))


def grade_leg(s, stored=None):
    try: r = grade_spec(s)
    except Exception as ex: r = dict(result='pending', actual=None, note=str(ex))
    if r.get('result') not in ('W', 'L', 'P') and STORED.get((stored or '').upper()): r = dict(r, result=STORED[stored.upper()])
    return r


def main():
    out_path = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(D, '..', f'w{WEEK}paper.json')
    PW = json.load(open(os.path.join(ROOT, 'data', 'official-picks', 'paper-wagers-2026.json'), encoding='utf-8'))
    out = []; seen = set()
    for p in PW:
        if str(p.get('week')) != WEEK: continue
        gl = []
        for l in p.get('legs') or []:
            try: s = parse_leg(l)
            except Exception: s = None
            if not s: continue
            gl.append(gl_row(s, grade_leg(s, l.get('status'))))
        name = (p.get('game_title') or p['id']).replace('AI paper: ', 'AI ').replace(' (not booked)', '')
        out.append(dict(name=name, id=p['id'], paper=True, stake=p.get('stake_usd'), odds=p.get('odds_american'), legs=gl))
        seen.add(tuple(sorted(x['label'] for x in gl)))
    for pr in ai_record.load_proposals(WEEK):
        if pr.get('status') == 'withdrawn' or pr.get('family') in ('single', 'straight', 'round_robin', 'candidates') or len(pr['legs']) < 2: continue
        specs = [ai_record.to_spec(l, pr['id']) for l in pr['legs']]
        gl = [gl_row(s, grade_leg(s)) for s in specs]
        if tuple(sorted(x['label'] for x in gl)) in seen: continue
        out.append(dict(name=f"AI {pr['title']}" + (' (promo)' if pr.get('funding') == 'promo' else ''), id=pr['id'], paper=True, extra=True,
                        stake=pr.get('stake'), odds=pr.get('price'), funding=pr.get('funding'), status=pr.get('status'), legs=gl))
    for x in out:
        w = sum(l['result'] == 'W' for l in x['legs'])
        print(f"{w}/{len(x['legs'])} {x['name'][:70]} :: " + '; '.join(f"{l['label'][:30]}={l['result']}({l['actual']})" for l in x['legs'] if l['result'] != 'W'))
    json.dump(out, open(out_path, 'w'), default=str, indent=1)
    print(f'{len(out)} paper builds -> {out_path}')


if __name__ == '__main__':
    main()
