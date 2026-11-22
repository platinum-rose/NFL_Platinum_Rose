for p in ['reports/intel/master-intel-narratives-2026-w11.md', 'reports/intel/supercontest-pitches-2026-w11.json']:
    s = open(p, encoding='utf-8').read(); n = s.count('8:25 pm PT')
    open(p, 'w', encoding='utf-8').write(s.replace('Sat 8:25 pm PT', 'Sat 8:21 pm PT').replace('Saturday 8:25 pm PT', 'Saturday 8:21 pm PT')); print(p, n)
