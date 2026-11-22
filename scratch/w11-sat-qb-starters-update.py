"""Week 11 QB starter corrections for data/projected-starters (Andy request, Sat 2026-11-21).
1) New manual file qb-starters-2026-w11.json for teams with no current QB1 row.
2) ARI Week 8 depth file: Brissett (traded to BAL) -> departed; Carson Beck -> starter.
Evidence: ESPN depth-chart API snapshot scratch/w11-sat-espn-qb-depth.json (Sat ~11:46 am PT) plus
reports/intel/w11-qb-injury-news-check-2026-11-21.md."""
import json, shutil
MAN = 'data/projected-starters/2026/manual'
ESPN = json.load(open('scratch/w11-sat-espn-qb-depth.json', encoding='utf-8'))
AT = '2026-11-21T19:46:21Z'
def row(team, name, ev, url2=None, conf=0.9):
    espn_url = ESPN['teams'][team]['url']
    assert ESPN['teams'][team]['qb_depth'][0] == name, (team, ESPN['teams'][team]['qb_depth'])
    srcs = [{'source': 'qb-starters-2026-w11.json', 'source_type': 'manual_depth_chart', 'source_url': espn_url, 'published_at': AT,
             'evidence': f'ESPN depth chart QB1 ({", ".join(ESPN["teams"][team]["qb_depth"][:3])}), captured Sat 11/21 ~11:46 am PT.'}]
    if url2:
        srcs.append({'source': 'qb-starters-2026-w11.json', 'source_type': 'manual_depth_chart', 'source_url': url2, 'published_at': None, 'evidence': ev})
    return {'player_name': name, 'team': team, 'position': 'QB', 'role': 'starter', 'starter_confidence': conf, 'roster_confidence': 0.95,
            'source_count': len(srcs), 'sources': srcs, 'evidence': ev,
            'evidence_tags': ['manual_projection', 'week11_qb_correction'], 'impact_bucket': 'qb_major',
            'needs_human_review': False, 'confidence_basis': 'manual_depth_chart'}
players = [
    row('MIA', 'Kyle McCord', 'Malik Willis on IR (11/16); McCord started Week 10 (AP).', 'https://www.lanacion.com.ar/usa/dolphins-backup-kyle-mccord-shows-promise-in-first-nfl-start-in-place-of-the-injured-malik-willis-nid16112026/'),
    row('PHI', 'Joe Milton', 'Sirianni confirmed Milton starts vs PIT (Wed 11/18); Jalen Hurts on IR. ESPN lists him as Joe Milton.', 'https://www.foxsports.com/stories/nfl/joe-milton-stats-nick-sirianni-presser-steelers-eagles'),
    row('BAL', 'Jacoby Brissett', 'Acquired from ARI before the deadline; Lamar Jackson on IR (thumb).', 'https://www.panthers.com/news/know-your-foe-week-11-baltimore-ravens-carolina-panthers'),
    row('LV', 'Fernando Mendoza', 'ESPN depth QB1; no QB injury designation in the Sat 11:08 am PT feed.'),
    row('JAX', 'Trevor Lawrence', 'ESPN depth QB1; no QB injury designation in the Sat 11:08 am PT feed.'),
    row('MIN', 'Kirk Cousins', 'Started the Week 10 win at GB (FOX 9); Kyler Murray Out for Week 11.', 'https://www.fox9.com/sports/how-to-watch-minnesota-vikings-san-francisco-49ers-nov-22-2026'),
]
out = {'meta': {'description': 'Week 11 QB starter corrections. The weekly usage lock (week-usage-locks.json) only seeds QBs with dominant Week 10 usage, and the Week 8 manual depth files are stale. Delete or refresh after Week 11.',
                'season': 2026, 'week': 11, 'built_by': 'Claude (Saturday finalization, Andy request)', 'built_at': '2026-11-21',
                'evidence_report': 'reports/intel/w11-qb-injury-news-check-2026-11-21.md', 'espn_snapshot': 'scratch/w11-sat-espn-qb-depth.json',
                'caveats': ['Research context only, not picks.', 'Starter role does not clear the QB gate; Andy confirms in chat.']},
       'players': players}
json.dump(out, open(f'{MAN}/qb-starters-2026-w11.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
ari = f'{MAN}/ari-depth-chart-2026-10-27.json'
shutil.copy2(ari, ari + '.bak-claude-20261121-sat')
d = json.load(open(ari, encoding='utf-8'))
n = 0
for p in d['players']:
    if p.get('position') != 'QB': continue
    if p['player_name'] == 'Jacoby Brissett':
        p.update(role='departed', starter_confidence=0.0, needs_human_review=False,
                 evidence=p['evidence'] + ' UPDATE 2026-11-21: traded to BAL before the deadline (Panthers.com Week 11 Know Your Foe); no longer on ARI.')
        p['evidence_tags'] = sorted(set(p['evidence_tags'] + ['week11_qb_correction']))
        n += 1
    elif p['player_name'] == 'Carson Beck':
        p.update(role='starter', starter_confidence=0.85, needs_human_review=True,
                 evidence=p['evidence'] + ' UPDATE 2026-11-21: ESPN depth QB1 (scratch/w11-sat-espn-qb-depth.json); second straight start after Minshew season-ending elbow injury (Yardbarker/FLM 11/19). Still Questionable in the ESPN feed (Fri 9:36 am PT): confirm at inactives.')
        p['evidence_tags'] = sorted(set(p['evidence_tags'] + ['week11_qb_correction']))
        n += 1
d['meta'].setdefault('caveats', []).append('2026-11-21: QB rows corrected for Week 11 (Brissett departed to BAL; Beck QB1). Other positions remain Week 8.')
json.dump(d, open(ari, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('wrote', len(players), 'overrides; ARI rows edited', n)
