import json, shutil
p = 'data/supercontest/dashboard-ai-review-2026.json'
shutil.copy(p, p + '.bak-claude-20261121-sat-w9w10')
d = json.load(open(p, encoding='utf-8'))
W9 = {"week": 9, "status": "graded", "ai_score": 4, "official_score": 3,
 "ai_picks": ["ARI +12.5", "TB +6.5", "CLE +3", "IND +5.5", "SF -9.5"],
 "official_picks": ["NYJ +9.5", "SF -9.5", "TB +6.5", "HOU -4.5", "ARI +12.5"],
 "review": "The Dashboard AI proposal went 4-1 (4 points) and the official card went 3-2 (3 points). Both cards shared TB +6.5 (lost 27-24 at Chicago, covered by 3.5), SF -9.5 (won 38-17 over Las Vegas, covered by 11.5) and ARI +12.5 (lost 17-3 at Seattle, missed by 1.5). The AI's CLE +3 (lost 23-22 at New Orleans) and IND +5.5 (lost 27-23 at Dallas) both covered; the official card's HOU -4.5 covered easily (44-22 at the Chargers) and NYJ +9.5 missed badly (lost 35-12 at Kansas City).",
 "dashboard_why": "TB +6.5, CLE +3, IND +5.5 and SF -9.5 covered. ARI +12.5 was a near-miss (1.5 short).",
 "amanda_why": "SF -9.5, TB +6.5 and HOU -4.5 covered. ARI +12.5 was a near-miss (1.5 short) and NYJ +9.5 was completely off (13.5 short).",
 "source": "data/fantasy/boxscores ESPN Week 9 finals via scripts/master-intel/sc_review.py; data/supercontest/locked-card-week-9.json; reports/bets/2026-w09-card.md (AI five); graded by Claude 2026-11-21"}
W10 = {"week": 10, "status": "graded", "ai_score": 3, "official_score": 4,
 "ai_picks": ["KC -3.5", "SF -4.5", "BAL -4.5", "JAX -10.5", "ARI +9.5"],
 "official_picks": ["IND -3", "KC -3.5", "SF -4.5", "JAX -10.5", "BUF -7.5"],
 "review": "The official card went 4-1 (4 points) and the Dashboard AI proposal went 3-2 (3 points). Both cards shared KC -3.5 (won 35-13 at Atlanta), SF -4.5 (won 46-40 at Dallas, covered by 1.5) and JAX -10.5 (won 40-23 at Tennessee). The official card's BUF -7.5 covered (31-12 at the Jets) and IND -3 lost by one point (won 24-22 over Miami); the AI's BAL -4.5 (lost 23-20 to the Chargers) and ARI +9.5 (lost 34-6 to the Rams) both missed.",
 "dashboard_why": "KC -3.5, SF -4.5 and JAX -10.5 covered. BAL -4.5 was 7.5 short and ARI +9.5 was completely off (18.5 short).",
 "amanda_why": "KC -3.5, SF -4.5, JAX -10.5 and BUF -7.5 covered. IND -3 was a near-miss (1 point short).",
 "source": "data/fantasy/boxscores ESPN Week 10 finals via scripts/master-intel/sc_review.py; data/supercontest/locked-card-week-10.json; reports/bets/2026-w10-card.md (Saturday re-rank AI five, Andy OK 11/14); graded by Claude 2026-11-21"}
d['weeks'] = [r for r in d['weeks'] if r.get('week') not in (9, 10)] + [W9, W10]
d['weeks'].sort(key=lambda r: r['week'])
d['as_of_week'] = 10
json.dump(d, open(p, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print([(r['week'], r['status'], r.get('ai_score'), r.get('official_score')) for r in d['weeks']])
print('AI total', sum(r.get('ai_score', 0) for r in d['weeks'] if r['status'] == 'graded'), 'official total', sum(r.get('official_score', 0) for r in d['weeks'] if r['status'] == 'graded'))
