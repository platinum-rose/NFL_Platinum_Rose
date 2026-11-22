import json, shutil
p = 'data/generated/master-intel/w11-gate-manual.json'
shutil.copy2(p, p + '.bak-claude-20261121-sat')
m = json.load(open(p, encoding='utf-8'))
AT = '2026-11-21T15:29:00-08:00'
EV = 'reports/intel/w11-qb-injury-news-check-2026-11-21.md'
m['final_injury_reports_checked'].update(done=True, by='Andy (confirmed in chat; evidence compiled by Claude)', at=AT, evidence=EV,
    decision='Ignore prop recommendations on Questionable, Doubtful or Out players (Week 10 rule, carried). Source conflicts logged: Pittman Jr. (PIT), Jonathon Brooks (CAR), Croskey-Merritt (WAS, later ESPN IR used).')
m['news_flags_resolved'].update(done=True, by='Andy (confirmed in chat; evidence compiled by Claude)', at=AT,
    evidence=EV + '; data/intel/articles/2026-w11/bookmark-text-intelligence-digest.md; data/generated/props/bookmaker-live-2026-11-21-week11.json',
    decision='Brissett traded to BAL; Colts released Daniel Jones; MIN@SF in Mexico City. Bookmaker 1:10 pm capture: no pulled game markets; TD-scorer props not posted yet; TB@DET and ARI@KC prop boards thin (QB uncertainty).')
m['qb_status_confirmed'].update(done=True, by='Andy (explicit decision in chat, with caveats)', at=AT, evidence=EV,
    decision=('Proceed with TB Baker Mayfield QUESTIONABLE (trending to start per Bowles) and ARI Josh Johnson PREPARING TO START '
              '(RotoWire/Fantasy Couch Fri evening; Beck questionable, DNP Fri; ESPN depth still lists Beck). Andy chose to proceed rather than wait '
              'for inactives. This knowingly departs from the "no trending language" rule. Any TB or ARI recommendation, especially props, must carry the tags '
              '"Mayfield Questionable" / "Josh Johnson preparing to start (Beck Q)" as caveats. Recheck at Sunday inactives (~8:30 am PT). '
              'All other starters confirmed: McCord, Allen, Shough, C. Williams, Ward, Prescott, Goff, Mahomes, Rodgers, Milton, Brissett, B. Young, '
              'G. Smith, Herbert, Mendoza, Nix, Lawrence, McCarthy, Cousins, Purdy, Burrow, J. Daniels.'),
    caveat_tags={'TB': 'Mayfield Questionable', 'ARI': 'Josh Johnson preparing to start (Beck Q)'})
json.dump(m, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print({k: v.get('done') for k, v in m.items() if isinstance(v, dict)})
