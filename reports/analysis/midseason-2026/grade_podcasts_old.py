"""Grade the older-format podcast files (W3, W7 + W7 addendum) with the same grader; writes reports/analysis/midseason-2026/podcast_old_grades.jsonl"""
import json, sys
sys.path.insert(0, 'scripts/master-intel'); import grade_podcast_picks as G
rows = []
for w, files in ((3, ['w03']), (7, ['w07', 'w07-addendum'])):
    gs = json.load(open(f'data/archive/2026/week-{w:02d}/betting/w{w}gamesum.json'))
    games = {(G.T(g['away']), G.T(g['home'])): G.load_game(g['event']) for g in gs}
    for f in files:
        d = json.load(open(f'data/podcasts/youtube-extracted-picks-2026-{f}.json'))
        for p in d['picks']:
            raw = p.get('raw') or {k: p.get(k) for k in ('team', 'player', 'market', 'side', 'line', 'price')}
            game = p.get('game') or ''
            aw, hm = [G.T(x) for x in game.split('@')] if '@' in game else (None, None)
            PLAYER_MK = ('anytime', 'touchdown', 'rec', 'rush', 'pass', 'reception', 'yds', 'yards')
            if not raw.get('player') and any(k in str(raw.get('market')) for k in PLAYER_MK) and raw.get('market') not in ('spread', 'total', 'moneyline'):
                res, why = 'ungradable', 'player prop with no player named (independent re-grade 11/11, s051)'
            else:
              try: res, why, _ = G.grade(dict(raw=raw), games.get((aw, hm)))
              except Exception as e: res, why = 'ungradable', f'grader error: {e}'
            res = {'ungradable': 'U'}.get(res, res)
            if str(why).startswith('not in final box score'): res = 'V'
            pr = raw.get('price') if raw.get('price') is not None else p.get('price')
            rows.append(dict(week=w, layer='podcast', source=(p.get('show') or '').split(' — ')[0], expert=p.get('speaker'), game=game, kind=raw.get('market'),
                             label=p.get('pick') or f"{raw.get('team') or raw.get('player')} {raw.get('market')} {raw.get('side')} {raw.get('line')}",
                             line=raw.get('line'), price=pr, result=res, detail=why, units=G.units(pr, res) if res in ('W', 'L', 'P') and raw.get('market') not in ('teaser', 'survivor_pick') else None))
with open('reports/analysis/midseason-2026/podcast_old_grades.jsonl', 'w') as fo:
    for r in rows: fo.write(json.dumps(r, ensure_ascii=False) + '\n')
import collections; print(len(rows), sorted(collections.Counter((r['week'], r['result']) for r in rows).items()))
