p = 'scripts/master-intel/gun_to_my_head.py'
s = open(p, encoding='utf-8').read()
reps = [
 ("def fmt_line(x): return 'PK' if x == 0 else f'{x:+g}'",
  "def fmt_line(x):\n    x = round(float(x) * 2) / 2 if abs(float(x) * 2 - round(float(x) * 2)) < 1e-9 else round(float(x), 1)\n    return 'PK' if x == 0 else f'{x:+g}'"),
 # break-even from the Bookmaker row at the sim's line (the sim is evaluated at the Bookmaker number)
 ("                price = (best or {}).get('price'); rec['sim_p'] = p; rec['break_even'] = be(price) if price else None",
  "                bk = next((r for r in books if r['book'] == 'Bookmaker'), None); price = bk and bk.get('price')\n                rec['sim_p'] = p; rec['break_even'] = be(price) if price else None; rec['sim_at'] = bk and bk['text'].split(' · ')[0]"),
 ("                    why += f\" The double-shrunk sim gives {rec['call']} {100 * rec['sim_p']:.1f}% (pushes excluded) vs a {100 * rec['break_even']:.1f}% break-even at the best fresh price.\"",
  "                    why += f\" The double-shrunk sim gives it {100 * rec['sim_p']:.1f}% (pushes excluded) vs a {100 * rec['break_even']:.1f}% break-even at {rec['sim_at']}.\""),
 # card-lean conflict flag
 ("                rec.update(call_direction=d, tier=tier)",
  "                rec.update(call_direction=d, tier=tier)\n                if off and off[0] == 'lean' and d != off[1]:\n                    rec['official_conflict'] = ('Disagrees with the card lean.' if d else 'The evidence does not support the card lean (Coin flip).')"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:70]; s = s.replace(a, b)
# readable model / analytics numbers
s = s.replace("side_txt('home' if g['model_line'] <= 0 else 'away', g['model_line'])", "side_txt('home' if g['model_line'] <= 0 else 'away', round(g['model_line'], 1))")
s = s.replace("f\"FTN EPA matchup projects {side_txt('home' if an['proj_home_line'] <= 0 else 'away', an['proj_home_line'])}",
              "f\"FTN EPA matchup projects {('a pick' + chr(39) + 'em') if abs(an['proj_home_line']) < 0.25 else side_txt('home' if an['proj_home_line'] <= 0 else 'away', round(an['proj_home_line'], 1))}")
open(p, 'w', encoding='utf-8').write(s); print('fixed2')
