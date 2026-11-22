import json
p = 'data/generated/master-intel/w11-gate-manual.json'
m = json.load(open(p, encoding='utf-8'))
nc = m['experts_no_card']
if 'The Prop Dealer' not in nc['names']:
    nc['names'].append('The Prop Dealer')
    nc['entries'].append({
        'name': 'The Prop Dealer', 'checked_at': '2026-11-21T17:32:00-08:00',
        'by': 'Grok E10 chase (Andy-run), recorded by Claude; added by Andy in chat 17:36 PT',
        'where_checked': '@thepropdealer timeline 2026-11-16 onward: CFB models, a TNF SGP (ignored) and promos for upcoming NFL parlays/ladders with no selections posted.',
        'evidence': 'data/vault-seed/manual/grok-week11-threads/grok-twitter-picks-2026-11-21-e10.csv (Grok summary in chat)',
        'finding': 'No Week 11 card published yet.',
        'temporary': True,
        'recheck': 'Andy: Prop Dealer publishes Sunday morning (11/22). Re-check @thepropdealer before kickoff, load his picks, and remove this exception.'})
nc['confirmed_names'] = list(nc['names'])
nc['at'] = '2026-11-21T17:36:00-08:00'
nc['by'] = 'Andy (confirmed in chat; The Prop Dealer added 17:36 PT as temporary)'
json.dump(m, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(nc['names'])
