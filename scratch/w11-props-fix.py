p = 'scripts/master-intel/gtmh_props.py'
s = open(p, encoding='utf-8').read()
a = """    G = collections.defaultdict(list)
    for o in offers:
        gid, pl, team, mk, side, line, price, book, at, fresh = o
        if gid not in SG: continue
        G[(gid, pl, team, mk)].append(dict(side=side, line=line, price=price, book=book, at=at, fresh=fresh))"""
b = """    G = collections.defaultdict(list); DISP = {}
    for o in offers:
        gid, pl, team, mk, side, line, price, book, at, fresh = o
        if gid not in SG or price is None: continue
        k = norm(pl) if pl else None
        if pl and (k not in DISP or len(pl) > len(DISP[k])): DISP[k] = pl
        G[(gid, k, team, mk)].append(dict(side=side, line=line, price=int(price), book=book, at=at, fresh=fresh))
    imp0 = lambda p: -p / (-p + 100) if p < 0 else 100 / (p + 100)
    def main_lines(offs):
        # per book: the two-way line priced closest to even; one-way markets: -200..+400, milestone nearest even money
        keep = []
        for book in {o['book'] for o in offs}:
            bo = [o for o in offs if o['book'] == book]
            two = collections.defaultdict(dict)
            for o in bo: two[o['line']][o['side']] = o
            pairs = [(ln, d) for ln, d in two.items() if 'Over' in d and 'Under' in d]
            if pairs:
                ln, d = min(pairs, key=lambda t: abs(imp0(t[1]['Over']['price']) - .5) + abs(imp0(t[1]['Under']['price']) - .5))
                keep += [d['Over'], d['Under']]
            else:
                ok = [o for o in bo if -200 <= o['price'] <= 400]
                if ok: keep.append(min(ok, key=lambda o: abs(imp0(o['price']) - .5)))
        return keep"""
assert s.count(a) == 1; s = s.replace(a, b)
a = "    for (gid, pl, team, mk), offs in G.items():\n        aw, hm = gid.split('@')"
b = "    for (gid, pk, team, mk), offs in G.items():\n        aw, hm = gid.split('@'); pl = DISP.get(pk) if pk else None\n        offs = main_lines(offs)\n        if not offs: excluded['no main line'] += 1; continue"
assert s.count(a) == 1; s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s); print('fixed')
