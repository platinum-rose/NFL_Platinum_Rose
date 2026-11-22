G = 'reports/intel/games'
moves = {
    'TB@DET': 'DET -4 -> -3.5 (TB +3.5 -108), total 46 -> 47. The market leans further into Mayfield playing. TB stays PASS at +3.5 (baseline fair DET -4.6); Under 47 (-103) is one point better than the Friday 45.5, conditional on the QB tag "Mayfield Questionable". The SuperContest locked TB +7 is now 3.5 points better than market.',
    'MIA@BUF': 'BUF -16.5 -> -16 (MIA +16 -111). MIA lean holds at the Friday number (+16 or better).',
    'NO@CHI': 'CHI -11 -> -11.5. NO stays PASS (offensive-line outs). Under 48 (-106) unchanged.',
    'BAL@CAR': 'Total 43 -> 43.5; CAR -3 unchanged. Both still PASS.',
    'PIT@PHI': 'Under 37.5 now -124 (Over +106). Still PASS on both.',
    'CIN@WAS': 'Over 54 now -117 (Under +100); WAS +6 unchanged. Over lean now costs -117.',
}
log = []
for g, txt in moves.items():
    a, h = g.split('@')
    p = f'{G}/2026-w11-game-{a}_at_{h}-sides.md'
    open(p, 'a', encoding='utf-8').write(f"\n\n### Bookmaker evening recheck — Sat Nov 21, 5:43 pm PT capture\n\n- {txt}\n- Player-prop boards for TB@DET and ARI@KC are still thin at both books (expected to post near kickoff).\n")
    log.append(f"- 2026-11-21T17:43:00-08:00 · {g} · sides · BOOKMAKER EVENING RECHECK · {txt.split('.')[0]} · [sides](2026-w11-game-{a}_at_{h}-sides.md)")
open(f'{G}/2026-w11-game-RUNLOG.md', 'a', encoding='utf-8').write("\n## Bookmaker evening recheck (Sat Nov 21, 5:43 pm PT capture; other games unchanged)\n\n" + "\n".join(log) + "\n")
print('ok')
