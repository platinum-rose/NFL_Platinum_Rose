p = 'scripts/master-intel/build.py'
s = open(p, encoding='utf-8').read()
hook = ("    if XI:  # 2026-11-21: Gun to my head section (docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md)\n"
        "        try: L += _xi.gtmh_section(str(ROOT), a.season, WW)\n"
        "        except Exception as _e: print(f'WARN gtmh section: {_e}')\n")
assert s.count(hook) == 1; s = s.replace(hook, '')
lines = s.split('\n')
i = next(k for k, l in enumerate(lines) if "roll('section-rec', 'rec-passes'" in l)
ind = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
lines.insert(i + 1, f"{ind}if XI:  # 2026-11-21: Gun to my head section, inside the recommendations box (docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md)\n"
                    f"{ind}    try: L += _xi.gtmh_section(str(ROOT), a.season, WW)\n"
                    f"{ind}    except Exception as _e: print(f'WARN gtmh section: {{_e}}')")
open(p, 'w', encoding='utf-8').write('\n'.join(lines)); print('moved after line', i + 1, 'indent', len(ind))
