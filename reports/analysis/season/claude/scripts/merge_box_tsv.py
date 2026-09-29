"""Merge a hand-transcribed final box score into a cached ESPN summary JSON (used when ESPN's API is unreachable
from both the device and the cloud shell, e.g. MNF 2026-09-28).

Input TSV (pipe-separated), one line per player row, no team-total rows:
  #meta|status|Final            -> header status (Final marks completed)
  #score|PHI|7|0,7,0,0          -> team score + quarter line scores
  #td|CHI|Rushing Touchdown|D'Andre Swift 3 Yd Rush     -> extra scoring plays, in game order, appended after the cached ones
  passing|CHI|Case Keenum|23/32,240,7.5,2,0,0-0,114.1
  (categories/labels as ESPN: passing, rushing, receiving, fumbles, defensive, interceptions, kickReturns, puntReturns, kicking, punting)
Everything else in the cached file (drives, pickcenter, news...) is kept. Writes a .pre-merge copy first.

  python merge_box_tsv.py data/fantasy/boxscores/espn-401872963.json final.tsv
"""
import json, shutil, sys, collections
LABELS = {'passing': ['C/ATT', 'YDS', 'AVG', 'TD', 'INT', 'SACKS', 'RTG'], 'rushing': ['CAR', 'YDS', 'AVG', 'TD', 'LONG'],
          'receiving': ['REC', 'YDS', 'AVG', 'TD', 'LONG', 'TGTS'], 'fumbles': ['FUM', 'LOST', 'REC'],
          'defensive': ['TOT', 'SOLO', 'SACKS', 'TFL', 'PD', 'QB HTS', 'TD'], 'interceptions': ['INT', 'YDS', 'TD'],
          'kickReturns': ['NO', 'YDS', 'AVG', 'LONG', 'TD'], 'puntReturns': ['NO', 'YDS', 'AVG', 'LONG', 'TD'],
          'kicking': ['FG', 'PCT', 'LONG', 'XP', 'PTS'], 'punting': ['NO', 'YDS', 'AVG', 'TB', 'In 20', 'LONG']}


def main(jpath, tpath):
    d = json.load(open(jpath, encoding='utf-8'))
    shutil.copy2(jpath, jpath + '.pre-merge')
    rows = collections.defaultdict(lambda: collections.defaultdict(list)); meta = {}; scores = {}; tds = []
    for ln in open(tpath, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if not ln.strip(): continue
        p = ln.split('|')
        if p[0] == '#meta': meta[p[1]] = p[2]
        elif p[0] == '#score': scores[p[1]] = (p[2], p[3].split(','))
        elif p[0] == '#td': tds.append(p[1:])
        else:
            cat, team, name, vals = p; v = vals.split(',')
            assert len(v) == len(LABELS[cat]), (cat, name, v)
            rows[team][cat].append((name, v))
    # players
    old = {tb['team']['abbreviation']: tb for tb in d['boxscore']['players']}
    ids = {}
    for tb in d['boxscore']['players']:
        for c in tb['statistics']:
            for a in c['athletes']: ids[a['athlete']['displayName']] = a['athlete']
    for team, cats in rows.items():
        tb = old[team]
        tb['statistics'] = [dict(name=c, labels=LABELS[c], athletes=[dict(athlete=ids.get(n, {'displayName': n}), stats=v) for n, v in cats.get(c, [])])
                            for c in LABELS]
    comp = d['header']['competitions'][0]
    for c in comp['competitors']:
        ab = c['team']['abbreviation']
        if ab in scores:
            c['score'] = scores[ab][0]
            c['linescores'] = [dict(displayValue=x, value=float(x)) for x in scores[ab][1]]
    if meta.get('status', '').lower().startswith('final'):
        comp['status'] = dict(displayClock='0:00', period=4, type=dict(id='3', name='STATUS_FINAL', state='post', completed=True,
                                                                        description='Final', detail='Final', shortDetail='Final'))
    tid = {c['team']['abbreviation']: c['team'] for c in comp['competitors']}
    for team, ty, text in tds:
        d.setdefault('scoringPlays', []).append(dict(text=text, type=dict(text=ty), team=dict(abbreviation=team, id=tid[team]['id']),
                                                     period=dict(number=int(meta.get('td_q', 4)))))
    d.setdefault('meta', {})['claude_merge'] = ('Player stats, score and status merged 2026-09-28 by Claude Team 2 from the ESPN box-score page '
                                                '(espn.com/nfl/boxscore/_/gameId/...) because the ESPN API was unreachable; other fields are the 19:13 PT live cache.')
    json.dump(d, open(jpath, 'w', encoding='utf-8'))
    print('merged', {t: {c: len(v) for c, v in cs.items()} for t, cs in rows.items()}, 'scores', scores, 'extra TDs', len(tds))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
