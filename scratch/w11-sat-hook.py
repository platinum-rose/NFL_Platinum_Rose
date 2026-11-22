import shutil
p = 'scripts/master-intel/build.py'
shutil.copy(p, p + '.bak-claude-20261121-sat-extra')
s = open(p, encoding='utf-8').read()
a = "        gaps.append(f'Twitter video picks not merged: {_e}')\n"
assert s.count(a) == 1
s = s.replace(a, a + "    XI = None  # 2026-11-21: reviewed podcasts into the expert pool + per-game model/sim/conditions panel\n"
                     "    try:\n"
                     "        import extra_inputs as _xi\n"
                     "        yt = _xi.merge_reviewed_podcasts(yt, str(ROOT), a.season, WW, gaps)\n"
                     "        XI = _xi.load_context(str(ROOT), a.season, WW, gaps)\n"
                     "    except Exception as _e:\n"
                     "        gaps.append(f'Extra inputs (reviewed podcasts, model/sim panel) not loaded: {_e}')\n")
b = "        if g['done']: L += ['<em>Played before this build; excluded from every slot.</em>'] + ROLL_END; continue\n"
assert s.count(b) == 1
s = s.replace(b, b + "        if XI:\n"
                     "            try: L += _xi.panel(XI, gid, A, H)\n"
                     "            except Exception as _e: print(f'WARN model panel {gid}: {_e}')\n")
open(p, 'w', encoding='utf-8').write(s)
print('hooked')
