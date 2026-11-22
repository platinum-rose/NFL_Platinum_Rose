import json, shutil
ORDER = "MIA@BUF NO@CHI TEN@DAL TB@DET ARI@KC PIT@PHI BAL@CAR NYJ@LAC LV@DEN JAX@NYG MIN@SF CIN@WAS".split()
G = 'reports/intel/games'
rc = json.load(open('scratch/w11-sat-bkr-recheck.json', encoding='utf-8'))
log = []
for g in ORDER:
    a, h = g.split('@')
    p = f'{G}/2026-w11-game-{a}_at_{h}-sides.md'
    shutil.copy2(p, p + '.bak-claude-20261121-sat-prebkr')
    block = (f"\n\n### Bookmaker recheck — Sat Nov 21, 1:10 pm PT capture\n\n"
             f"Source: `data/generated/props/bookmaker-live-2026-11-21-week11.json` and `bookmaker-gamelines-2026-11-21-week11.raw.txt` (capturedAt 2026-11-21T21:10:25.854Z). This supersedes the Thursday Bookmaker numbers above.\n\n"
             f"- **Bookmaker now:** {rc[g]['line']}\n- **Saturday view:** {rc[g]['verdict']}\n")
    open(p, 'a', encoding='utf-8').write(block)
    pp = f'{G}/2026-w11-game-{a}_at_{h}-props.md'
    shutil.copy2(pp, pp + '.bak-claude-20261121-sat-prebkr')
    open(pp, 'a', encoding='utf-8').write("\n\n### Bookmaker recheck — Sat Nov 21, 1:10 pm PT capture\n\nA fresh Bookmaker player-prop board is in `bookmaker-live-2026-11-21-week11.json`. TD-scorer markets were not posted yet. Re-quote any prop above against this board on the exact threshold and price.\n")
    log.append(f"- 2026-11-21T13:20:00-08:00 · {g} · sides · BOOKMAKER RECHECK · {rc[g]['line']} · [sides](2026-w11-game-{a}_at_{h}-sides.md)")
rl = f'{G}/2026-w11-game-RUNLOG.md'
shutil.copy2(rl, rl + '.bak-claude-20261121-sat-prebkr')
open(rl, 'a', encoding='utf-8').write("\n## Bookmaker recheck (Sat Nov 21, 1:10 pm PT capture)\n\n" + "\n".join(log) + "\n")
print('appended', len(ORDER))
