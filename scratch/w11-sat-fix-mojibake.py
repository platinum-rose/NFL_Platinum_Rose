import glob
BAD = {'â€”': '—', 'Â·': '·'}
files = sorted(glob.glob('reports/intel/games/2026-w11-game-*-sides.md') + glob.glob('reports/intel/games/2026-w11-game-*-props.md') + ['reports/intel/games/2026-w11-game-RUNLOG.md'])
for f in files:
    bak = open(f + '.bak-claude-20261121-sat', encoding='utf-8').read()
    assert not any(b in bak for b in BAD), f'friday backup already has mojibake: {f}'
    s = open(f, encoding='utf-8').read()
    assert s.startswith(bak), f'friday content changed: {f}'
    tail = s[len(bak):]
    for b, g in BAD.items():
        tail = tail.replace(b, g)
    assert 'â€' not in tail and 'Â' not in tail, f'residual mojibake: {f}'
    open(f, 'w', encoding='utf-8', newline='').write(bak + tail)
print('fixed', len(files), 'files; Friday prefix verified byte-identical')
