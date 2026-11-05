#!/usr/bin/env python3
"""Lessons -> rules loop.

Registry: reports/bets/season-recap/rules/rules-2026.json (tracked).
Each post-mortem ends with at most 3 new rules (proposed for the next week); the next post-mortem checks every active rule:
was it followed (violations on that week's cash tickets) and did it help (violators vs compliant tickets, and what the same
tickets did in the weeks before the rule existed).

  python3 scripts/rules.py check --week 9 [--out work/w9/rules_w9.json]   # writes json + md; read-only on the ledger
  python3 scripts/rules.py propose --week 9 --id R9-1 --text "..." [--check manual] [--why "..."]   # max 3 per week
  python3 scripts/rules.py accept --id R9-1 [--effective 10]              # Andy's call; becomes active from that week
  python3 scripts/rules.py retire --id C5 --why "..."
  python3 scripts/rules.py list

Automatic checks (cash tickets only; promo/bonus/free-bet tickets are exempt by definition):
  max_legs        non-RR cash ticket with more than params.max legs
  read_reuse      the same player-prop read (player, market, direction) on more than params.max cash tickets
  lane_pref       receiving prop on a cash ticket at a higher rung than the lowest rung seen for that player/market that week (proxy)
  shaky_qb        before the game's inactives: a total, or 2+ props on the same team, in a game listed under params.games[week]
  no_master_rr    any 4-team master round robin
  manual          no automatic check: the post-mortem lists it for a by-hand yes/no
"""
import argparse, collections, datetime, json, os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); RECAP = os.path.abspath(os.path.join(D, '..'))
ROOT = os.path.abspath(os.path.join(RECAP, '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'reports', 'analysis', 'season', 'claude', 'scripts'))
import lib  # noqa: E402
REG = os.path.join(RECAP, 'rules', 'rules-2026.json')
MAX_NEW_PER_WEEK = 3
RUSH = {'Rushing yds', 'Carries', 'QB rushing yds', 'Rush+rec yds'}
RECV = {'Receptions', 'Receiving yds'}


def load(): return json.load(open(REG, encoding='utf-8'))


def save(r):
    os.makedirs(os.path.dirname(REG), exist_ok=True)
    with open(REG + '.tmp', 'w', encoding='utf-8') as f: json.dump(r, f, indent=1, ensure_ascii=False)
    os.replace(REG + '.tmp', REG)


def when(s):
    if not s: return None
    try: return datetime.datetime.fromisoformat(str(s).replace('Z', '+00:00'))
    except ValueError: return None


def is_rr(w): return lib.family(w) in ('2-team RR', '4-team master RR')


def prop_legs(w):
    for l in lib.real_legs(w):
        n = lib.norm_leg(l, w)
        if n['kind'] == 'prop' and n.get('player'): yield l, n


# ------------------------------------------------------------------ checks: each returns {ticket_id: reason}
def chk_max_legs(T, rule, week, W):
    mx = rule['params'].get('max', 4)
    return {w['id']: f'{lib.n_legs(w)} legs' for w in T if not is_rr(w) and lib.n_legs(w) > mx}


def chk_read_reuse(T, rule, week, W):
    mx = rule['params'].get('max', 3); reads = collections.defaultdict(set)
    for w in T:
        if is_rr(w): continue
        for l, n in prop_legs(w): reads[(lib.norm(n['player']), n['key'], n['dir'])].add(w['id'])
    out = {}
    for (pl, k, d), ids in reads.items():
        if len(ids) > mx:
            for i in sorted(ids): out[i] = (out.get(i, '') + '; ' if i in out else '') + f'{pl} {k} {d} on {len(ids)} cash tickets'
    return out


def chk_lane_pref(T, rule, week, W):
    low = {}
    pool = [w for w in W if w.get('week') == week]
    for w in pool:
        for l, n in prop_legs(w):
            if lib.category(n) in RECV and n['dir'] != 'under':
                t = n['need'] if n['need'] is not None else n['line']
                if t is not None: low[(lib.norm(n['player']), n['key'])] = min(t, low.get((lib.norm(n['player']), n['key']), 1e9))
    out = {}
    for w in T:
        for l, n in prop_legs(w):
            if lib.category(n) in RECV and n['dir'] != 'under':
                t = n['need'] if n['need'] is not None else n['line']; lo = low.get((lib.norm(n['player']), n['key']))
                if t is not None and lo is not None and t > lo:
                    out[w['id']] = (out.get(w['id'], '') + '; ' if w['id'] in out else '') + f"{n['player']} {n['key']} {t:g} (lowest seen {lo:g})"
    return out


def chk_shaky_qb(T, rule, week, W):
    games = (rule['params'].get('games') or {}).get(str(week)) or []; out = {}
    for gdef in games:
        gk = re.sub(r'\s', '', gdef['game']).upper(); cutoff = when(gdef.get('inactives'))
        for w in T:
            t = when(w.get('placed_at'))
            if cutoff and t and t >= cutoff: continue
            ns = [(l, lib.norm_leg(l, w)) for l in lib.real_legs(w)]
            on = [(l, n) for l, n in ns if re.sub(r'\s', '', n['game'] or '').upper() == gk]
            if any(n['key'] in ('total', 'team_total') for l, n in on): out[w['id']] = f"total on {gdef['game']} before inactives"
            teams = collections.Counter((l.get('team') or '') for l, n in on if n['kind'] == 'prop')
            stack = [tm for tm, c in teams.items() if tm and c >= 2]
            if stack: out[w['id']] = (out.get(w['id'], '') + '; ' if w['id'] in out else '') + f"{'/'.join(stack)} same-team prop stack on {gdef['game']} before inactives"
    return out


def chk_no_master_rr(T, rule, week, W): return {w['id']: '4-team master RR' for w in T if lib.family(w) == '4-team master RR'}


CHECKS = dict(max_legs=chk_max_legs, read_reuse=chk_read_reuse, lane_pref=chk_lane_pref, shaky_qb=chk_shaky_qb, no_master_rr=chk_no_master_rr)


def money(ws):
    s = round(sum(lib.cash_stake(w) for w in ws), 2); r = round(sum(lib.cash_return(w) for w in ws), 2)
    return dict(tickets=len(ws), won=sum(w.get('result') == 'win' for w in ws), staked=s, returned=r, net=round(r - s, 2))


def check(week):
    R = load(); W = lib.load_wagers()
    T = [w for w in W if w.get('week') == week and lib.is_cash(w)]
    res = []
    for rule in R['rules']:
        if rule.get('status') != 'active' or rule.get('effective_week', 99) > week: continue
        fn = CHECKS.get(rule.get('check'))
        row = dict(id=rule['id'], text=rule['text'], check=rule.get('check'), effective_week=rule.get('effective_week'))
        if not fn:
            row.update(followed=None, verdict='check by hand: followed? helped?'); res.append(row); continue
        v = fn(T, rule, week, W)
        bad = [w for w in T if w['id'] in v]; good = [w for w in T if w['id'] not in v]
        # the same check run on the weeks before the rule existed: what the violating tickets cost then
        pre = []
        for wk in range(1, rule.get('effective_week', week)):
            Tw = [w for w in W if w.get('week') == wk and lib.is_cash(w)]
            vv = fn(Tw, rule, wk, W) if rule.get('check') != 'shaky_qb' else {}
            pre += [w for w in Tw if w['id'] in vv]
        mb, mg, mp = money(bad), money(good), money(pre)
        followed = not bad
        if followed: verdict = 'followed' + (f"; before the rule these tickets were {mp['tickets']} for {mp['won']}, net {mp['net']:+.2f}" if mp['tickets'] else '')
        else: verdict = f"broken on {len(bad)} cash ticket(s): {mb['won']} won, net {mb['net']:+.2f} vs compliant net {mg['net']:+.2f}"
        row.update(followed=followed, violations=[dict(id=w['id'], num=w.get('ticket_number'), title=w.get('game_title'), why=v[w['id']],
                                                       stake=lib.cash_stake(w), returned=lib.cash_return(w), result=w.get('result')) for w in bad],
                   violators=mb, compliant=mg, before_rule=mp, verdict=verdict)
        res.append(row)
    proposed = [r for r in R['rules'] if r.get('status') == 'proposed' and r.get('proposed_week') == week]
    return dict(week=week, checked=res, proposed_for_next_week=proposed, cash_tickets=len(T))


def md(out):
    o = [f"## Rules check, Week {out['week']}", '', f"{out['cash_tickets']} cash tickets checked. Promo/bonus/free-bet tickets are exempt.", '',
         '| Rule | Followed | Verdict |', '|---|---|---|']
    for r in out['checked']:
        f = {True: 'yes', False: '**no**', None: 'by hand'}[r['followed']]
        o.append(f"| {r['id']}: {r['text']} | {f} | {r['verdict']} |")
    for r in out['checked']:
        if r.get('violations'):
            o += ['', f"**{r['id']} violations**"] + [f"- #{v['num'] or ''} {v['title'] or v['id']} (${v['stake']:g}, {v['result']}): {v['why']}" for v in r['violations']]
    o += ['', f"## Rules for next week (max {MAX_NEW_PER_WEEK}, Andy accepts)", '']
    o += [f"- **{r['id']}** {r['text']}" + (f" ({r['why']})" if r.get('why') else '') for r in out['proposed_for_next_week']] or ['- none proposed yet']
    return '\n'.join(o)


def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
    x = sp.add_parser('check'); x.add_argument('--week', type=int, required=True); x.add_argument('--out')
    x = sp.add_parser('propose'); x.add_argument('--week', type=int, required=True); x.add_argument('--id', required=True); x.add_argument('--text', required=True)
    x.add_argument('--check', default='manual', choices=sorted(CHECKS) + ['manual']); x.add_argument('--params', default='{}'); x.add_argument('--why', default='')
    x = sp.add_parser('accept'); x.add_argument('--id', required=True); x.add_argument('--effective', type=int)
    x = sp.add_parser('retire'); x.add_argument('--id', required=True); x.add_argument('--why', required=True)
    sp.add_parser('list')
    a = ap.parse_args()
    if a.cmd == 'check':
        out = check(a.week); p = a.out or os.path.join(RECAP, 'work', f'w{a.week}', f'rules_w{a.week}.json')
        os.makedirs(os.path.dirname(p), exist_ok=True)
        json.dump(out, open(p, 'w', encoding='utf-8'), indent=1, default=str); open(p[:-5] + '.md', 'w', encoding='utf-8').write(md(out))
        print(md(out))
    elif a.cmd == 'propose':
        R = load()
        n = sum(1 for r in R['rules'] if r.get('proposed_week') == a.week and r['id'] != a.id)
        if n >= MAX_NEW_PER_WEEK: sys.exit(f'Week {a.week} already has {n} proposed rules (max {MAX_NEW_PER_WEEK}). Retire or merge one first.')
        R['rules'] = [r for r in R['rules'] if r['id'] != a.id] + [dict(id=a.id, text=a.text, check=a.check, params=json.loads(a.params), why=a.why,
                                                                        status='proposed', proposed_week=a.week, effective_week=a.week + 1)]
        save(R); print(f'proposed {a.id} for Week {a.week + 1} (needs Andy\'s accept)')
    elif a.cmd in ('accept', 'retire'):
        R = load(); r = next((x for x in R['rules'] if x['id'] == a.id), None)
        if not r: sys.exit(f'no rule {a.id}')
        if a.cmd == 'accept':
            r['status'] = 'active'; r['accepted_at'] = datetime.date.today().isoformat()
            if a.effective: r['effective_week'] = a.effective
        else:
            r['status'] = 'retired'; r['retired_why'] = a.why; r['retired_at'] = datetime.date.today().isoformat()
        save(R); print(f"{a.id} -> {r['status']}")
    else:
        for r in load()['rules']: print(f"{r['id']:6} {r['status']:9} wk{r.get('effective_week')} {r.get('check'):12} {r['text']}")


if __name__ == '__main__':
    main()
