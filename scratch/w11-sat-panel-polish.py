p = 'scripts/master-intel/extra_inputs.py'
s = open(p, encoding='utf-8').read()
reps = [
 ("(ctx['wx_meta'].get('provider') or 'Open-Meteo'))}, kickoff hour)", "(str(ctx['wx_meta'].get('provider') or 'Open-Meteo').split(',')[0]))}, kickoff hour)"),
 ("gusts {mph(wx['gust_kmh']):.0f} mph · {e(wx.get('note') or '')}", "gusts {mph(wx['gust_kmh']):.0f} mph · {e(_short(wx.get('note')))}"),
 ("rows.append(f\"<b>Weather</b>: {e(wx.get('note') or 'indoor or no reading')}", "rows.append(f\"<b>Weather</b>: {e(_short(wx.get('note')) or 'indoor or no reading')}"),
 ("Sources: reports/intel/w-model fair lines and {e(src)}", "Sources: {e(ctx.get('fair_path') or 'fair-line model')} and {e(src)}"),
 ("        ctx['fair'] = {_norm(g['game']): g for g in f.get('games', [])}; ctx['fair_meta'] = f.get('meta', {})",
  "        ctx['fair'] = {_norm(g['game']): g for g in f.get('games', [])}; ctx['fair_meta'] = f.get('meta', {}); ctx['fair_path'] = f'reports/intel/w{W}-model/fair-lines-w{W}.json'"),
 ("def _side(home, away, line):", "def _short(note, n=150):\n    note = re.split(r'\\s+(?:Venue per|Source:|per FOX)', str(note or ''))[0].strip()\n    return note if len(note) <= n else note[:n].rsplit(' ', 1)[0] + '…'\n\n\ndef _side(home, away, line):"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('polished')
