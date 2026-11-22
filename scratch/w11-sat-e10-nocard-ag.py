import json
p = 'data/generated/master-intel/w11-gate-manual.json'
m = json.load(open(p, encoding='utf-8'))
nc = m['experts_no_card']
R = 'reports/intel/antigravity-w11-e10-expert-chase.md'
add = {
    'Collin Wilson': 'Action Network author page feed, NFL archives 1-2, Saturday expert roundups, Action Network podcast RSS. Nov 16-21: 9 NCAAF Week 12 articles, no NFL Week 11 article or podcast pick.',
    'Jason Radowitz': 'BettingPros author page, RSS feed, NFL tag/section pages. Only Week 11-window piece is CFB Week 12 picks (11/17); no NFL article since 11/09.',
    'Joe Madden': 'All ingested notes, BettingPros author pages, Doc\'s Sports NFL archives. No NFL Week 11 article. Earlier dossier hits trace to an 8/26 mistranscription of Matt Modi; an unrelated "Jo Madden" Doc\'s Sports video (5A60UMq5u4Y, 11/19) had no printed picks and its captions returned HTTP 429.',
    'Daniel Jeremiah & Bucky Brooks': 'All 8 Move the Sticks Omny RSS episodes 11/16-11/21 (transcripts incl. Brooks on The NFL Report 11/18 and 40s and Free Agents 11/17) and YouTube tJit70dFL4E, UpgVX2Z2DqU. No Week 11 game picks; the NFL Pro confidence episode on the feed was Sikkema/Kollmann straight-up forecasts.',
}
for name, where in add.items():
    if name not in nc['names']:
        nc['names'].append(name)
        nc['entries'].append({'name': name, 'checked_at': '2026-11-21T17:12:38-08:00', 'by': 'Antigravity (Andy-commissioned E10 chase), recorded by Claude',
                              'where_checked': where, 'evidence': R, 'finding': 'No Week 11 card published.'})
json.dump(m, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(nc['names'])
