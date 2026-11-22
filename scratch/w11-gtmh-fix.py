p = 'scripts/master-intel/gun_to_my_head.py'
s = open(p, encoding='utf-8').read()
reps = [
 # movement family uses the actual current number, never the hypothetical one
 ("def families(gid, market, ctx, line, total, exp):", "def families(gid, market, ctx, line, total, exp, cur=None):"),
 ("    g = ctx['sim']['games'][gid]; aw, hm = gid.split('@'); F = {}",
  "    g = ctx['sim']['games'][gid]; aw, hm = gid.split('@'); F = {}\n    cur_line, cur_total = cur if cur else (g['market_line'], g['market_total'])"),
 ("            mv = line - op; d = 'away' if mv >= 0.5 else ('home' if mv <= -0.5 else None)\n            F[2] = (d, f\"Opened {hm} {fmt_line(op)}, now {hm} {fmt_line(line)}\"",
  "            mv = cur_line - op; d = 'away' if mv >= 0.5 else ('home' if mv <= -0.5 else None)\n            F[2] = (d, f\"Opened {hm} {fmt_line(op)}, now {hm} {fmt_line(cur_line)}\""),
 ("            mv = total - ot; d = 'over' if mv >= 0.5 else ('under' if mv <= -0.5 else None)\n            F[2] = (d, f\"Total opened {ot:g}, now {total:g}\"",
  "            mv = cur_total - ot; d = 'over' if mv >= 0.5 else ('under' if mv <= -0.5 else None)\n            F[2] = (d, f\"Total opened {ot:g}, now {cur_total:g}\""),
 # holds-to: worse for away = home line rises (+); worse for home = home line falls (-); totals: over worse = higher, under worse = lower
 ("                step = (1 if cd == 'away' else -1) * -1 if market == 'side' else (1 if cd == 'over' else -1)",
  "                step = (1 if cd == 'away' else -1) if market == 'side' else (1 if cd == 'over' else -1)"),
 # tips: better for away = home line falls (-); better for home = home line rises (+)
 ("step if market == 'total' else (1 if dd_target == 'away' else -1)):", "step if market == 'total' else (-1 if dd_target == 'away' else 1)):"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:70]; s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s); print('fixed')
