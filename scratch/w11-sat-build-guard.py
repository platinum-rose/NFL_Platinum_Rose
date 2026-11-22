import shutil
p = 'scripts/master-intel/build.py'
shutil.copy(p, p + '.bak-claude-20261121-sat-speaker')
s = open(p, encoding='utf-8').read()
a = "        _p.setdefault('verify', None); _p.setdefault('show', _p.get('show') or 'YouTube'); _p.setdefault('speaker', _p.get('speaker') or 'YouTube')\n"
assert s.count(a) == 1
b = a + ("    for _p in (yt.get('picks', []) if yt else []):  # 2026-11-21: a present-but-None speaker crashed cite(); fill and disclose\n"
         "        if not _p.get('speaker'):\n"
         "            _p['speaker'] = _p.get('expert') or _p.get('analyst') or _p.get('source') or 'Unknown Expert'\n"
         "            gaps.append(f\"Pick without a speaker name labeled '{_p['speaker']}': {_p.get('game') or _p.get('event') or '?'} {_p.get('pick') or ''}\".strip())\n")
s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('guard added')
