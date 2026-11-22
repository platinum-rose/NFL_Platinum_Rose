import shutil
p = 'scripts/master-intel/build.py'
shutil.copy(p, p + '.bak-claude-20261121-sat-banner')
s = open(p, encoding='utf-8').read()
a = "    friday_provisional = gate.get('stage') == 'friday' and gate.get('verdict') == 'PROVISIONAL'\n"
assert s.count(a) == 1
s = s.replace(a, a + "    sat_provisional = gate.get('stage') == 'saturday' and gate.get('verdict') not in (None, 'PASS', 'GREEN')  # 2026-11-21\n"
                     "    sat_fails = [c['id'] for c in gate.get('checks', []) if c.get('status') == 'FAIL' and c.get('level') != 'ADVISORY']\n")
b = "           'Any selections shown use dated captures and require a fresh price and lineup check.</div>' if friday_provisional else ''),\n"
assert s.count(b) == 1
s = s.replace(b, b + "          (f'<div><strong>Saturday provisional:</strong> the Saturday final gate is {esc(str(gate.get(\"verdict\")))} on {esc(\", \".join(sat_fails) or \"open items\")}. '\n"
                     "           'Not for final use, PDF export or publication. Rebuild after Sunday inactives and fresh captures.</div>' if sat_provisional else ''),\n")
open(p, 'w', encoding='utf-8').write(s)
print('banner added')
