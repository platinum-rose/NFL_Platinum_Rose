import json, glob, collections
def peek(p, n=700):
    try: d = json.load(open(p, encoding='utf-8'))
    except Exception as e: print(p, 'ERR', e); return None
    print('\n==', p, type(d).__name__, list(d)[:12] if isinstance(d, dict) else len(d)); return d
d = peek('data/odds/actionnetwork-openers-2026-w11.json')
if d: g = d.get('games') or d.get('rows') or d; print(json.dumps(g[0] if isinstance(g, list) else list(g.items())[0], ensure_ascii=False)[:700])
d = peek('data/generated/master-intel/big-money-flags-2026-w11.json')
if d: print(json.dumps(d, ensure_ascii=False)[:1200])
d = peek('data/generated/master-intel/w11-expert-verified.json')
if d:
    rows = d.get('rows') or d.get('picks') or d.get('verified') or []
    print(len(rows), json.dumps(rows[0], ensure_ascii=False)[:600] if rows else '')
    print(collections.Counter(r.get('pick_type') or r.get('market') for r in rows))
f = sorted(glob.glob('data/generated/props/betonline-live-2026-11-22-week11.json'))
d = peek(f[0]) if f else None
if d:
    rows = d.get('rows', []); print(collections.Counter(r.get('market') for r in rows).most_common(8))
    print([json.dumps(r, ensure_ascii=False)[:300] for r in rows if r.get('market') in ('game_lines', 'spread', 'total', 'game_spread')][:4])
f = sorted(glob.glob('data/generated/props/draftkings-predictions-feed-2026-11-19-week11.json'))
d = peek(f[0]) if f else None
if d:
    rows = d.get('rows') or d.get('markets') or []
    print(collections.Counter(r.get('market') or r.get('marketType') for r in rows).most_common(8))
    print([json.dumps(r, ensure_ascii=False)[:300] for r in rows[:2]])
