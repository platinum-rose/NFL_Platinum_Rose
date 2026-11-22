import json
p = 'data/generated/master-intel/w11-gate-manual.json'
m = json.load(open(p, encoding='utf-8'))
nc = m.setdefault('experts_no_card', {'names': [], 'note': ''})
entries = nc.setdefault('entries', [])
if 'John Ewing' not in nc['names']:
    nc['names'].append('John Ewing')
    entries.append({'name': 'John Ewing', 'checked_at': '2026-11-21T15:56:00-08:00', 'by': 'Claude (Andy OK in chat)',
                    'where_checked': 'X bookmarks 11/17-11/21 (@johnewing posts 2123797262954545220, 2123808592897646949, 2123812362092208522)',
                    'finding': 'Posted BetMGM money/ticket splits and ATS trends only; no picks. Splits recorded as market context in the bookmark digest.'})
nc['note'] = 'Experts checked for a Week 11 card and none published. Each entry lists where we looked.'
json.dump(m, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(nc['names'])
