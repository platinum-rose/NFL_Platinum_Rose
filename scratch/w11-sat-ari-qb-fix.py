"""ARI QB correction from Saturday bookmark review: RotoWire (Fri 4:03 pm PT) + Fantasy Couch (Fri 5:09 pm PT)
report Carson Beck (back) questionable, DNP Friday, Josh Johnson preparing to start. Projection only; QB gate stays open."""
import json, shutil
MAN = 'data/projected-starters/2026/manual'
d = 'data/intel/articles/2026-w11/bookmark-text-intelligence-digest.md'
s = open(d, encoding='utf-8').read().replace('reviewed by Claude ~1:55 pm PT', 'reviewed by Claude ~1:45 pm PT')
open(d, 'w', encoding='utf-8').write(s)
ari = f'{MAN}/ari-depth-chart-2026-10-27.json'
a = json.load(open(ari, encoding='utf-8'))
for p in a['players']:
    if p.get('position') == 'QB' and p['player_name'] == 'Carson Beck':
        p.update(role='backup', starter_confidence=0.3, needs_human_review=True,
                 evidence=p['evidence'] + ' UPDATE 2026-11-21 1:45 pm PT: reverted to backup. RotoWire (x.com/RotoWireNFL/status/2123930260072706457, Fri 4:03 pm PT) says Beck (back) is questionable and did not practice Friday; Josh Johnson preparing to start. The ESPN depth chart still lists Beck QB1 (conflict).')
json.dump(a, open(ari, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
q = f'{MAN}/qb-starters-2026-w11.json'
shutil.copy2(q, q + '.bak-claude-20261121-sat-preari')
o = json.load(open(q, encoding='utf-8'))
o['players'] = [p for p in o['players'] if p['team'] != 'ARI'] + [{
    'player_name': 'Josh Johnson', 'team': 'ARI', 'position': 'QB', 'role': 'starter', 'starter_confidence': 0.7, 'roster_confidence': 0.95,
    'source_count': 2,
    'sources': [
        {'source': 'qb-starters-2026-w11.json', 'source_type': 'manual_depth_chart', 'source_url': 'https://x.com/RotoWireNFL/status/2123930260072706457', 'published_at': '2026-11-21T00:03:29Z',
         'evidence': 'RotoWire: Carson Beck is questionable but did not practice Friday; Josh Johnson is preparing to start Sunday for the Cardinals.'},
        {'source': 'qb-starters-2026-w11.json', 'source_type': 'manual_depth_chart', 'source_url': 'https://x.com/fantasycouch/status/2123946936550244760', 'published_at': '2026-11-21T01:09:45Z',
         'evidence': 'Fantasy Couch: ARI QB Carson Beck (back) is Questionable; Josh Johnson is set to start at QB @ KC.'}],
    'evidence': 'Projected starter from Friday-evening reports (RotoWire, Fantasy Couch). ESPN depth chart (Sat ~11:46 am PT) still lists Beck QB1, so this is a conflict. Confirm at inactives.',
    'evidence_tags': ['manual_projection', 'week11_qb_correction', 'qb_conflict'], 'impact_bucket': 'qb_major',
    'needs_human_review': True, 'confidence_basis': 'manual_depth_chart'}]
json.dump(o, open(q, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('ARI fixed')
