"""Grade open legs and settle open tickets for one week in the wagers file, from cached ESPN box scores.

Dry run by default (prints what it would change). --apply writes the wagers file after a timestamped backup.
Only tickets whose status is not SETTLED are touched. Settlement convention (Team 3, 2026-09-28):
  status SETTLED, result win|loss, settled_payout_usd, profit_usd, graded_at (UTC ISO) + a progress note.
  - any LOST leg -> loss, payout 0 (cash profit = -stake; promo/free-bet profit = 0)
  - all legs WON -> win, payout = potential_payout_usd (promo: profit = payout, shown as credit value)
  - any PUSH (and no loss) -> left open, needs the book's re-priced payout (--payout ID=AMOUNT)
  - round robins always need the book's actual payout: --payout <id or ticket#>=<amount>

Usage:
  python grade_week.py --week 3                     # dry run
  python grade_week.py --week 3 --payout 739361263=0 --apply
"""
import argparse, datetime, json, os, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from lib import *


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--week', type=int, required=True)
    ap.add_argument('--payout', action='append', default=[], help='<ticket id or number>=<actual payout USD>')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--who', default='Claude Team 2')
    ap.add_argument('--fill-dead-legs', action='store_true', help='also grade PENDING legs on already-SETTLED tickets (status/actual_stat only)')
    a = ap.parse_args()
    manual = {}
    for p in a.payout:
        k, v = p.split('='); manual[k.strip()] = float(v)
    W = load_wagers(); G = load_games({a.week})
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    changes = 0; unresolved = []
    if a.fill_dead_legs:
        for w in W:
            if w.get('week') != a.week or w.get('status') != 'SETTLED': continue
            for l in real_legs(w):
                if l.get('status') not in (None, 'PENDING'): continue
                n = norm_leg(l, w); st, act, _ = grade(n, game_for(G, a.week, n['game']))
                if st:
                    print(f"   dead-ticket leg {st:5} {w['id'][-30:]:30} {l.get('selection')} [{act}]")
                    l['status'] = st; l['actual_stat'] = act; changes += 1
    for w in W:
        if w.get('week') != a.week or w.get('status') == 'SETTLED': continue
        print(f"\n== {w['id']}  #{w.get('ticket_number')}  {w.get('book')}  stake ${w.get('stake_usd')}  {'cash' if is_cash(w) else w.get('funding_type')}")
        for l in real_legs(w):
            if l.get('status') in ('WON', 'LOST', 'PUSH', 'VOID'):
                print(f"   {l['status']:5} (kept)  {l.get('selection')}  [{l.get('actual_stat')}]"); continue
            n = norm_leg(l, w); g = game_for(G, a.week, n['game'])
            st, act, mg = grade(n, g)
            if st is None:
                print(f"   ?????         {l.get('selection')}  -> {act}"); unresolved.append((w['id'], l.get('selection'), act)); continue
            print(f"   {st:5} (new)   {l.get('selection')}  [{act}]")
            l['status'] = st; l['actual_stat'] = act; changes += 1
        sts = [l.get('status') for l in real_legs(w)]
        key = next((k for k in manual if k in (w['id'], str(w.get('ticket_number')))), None)
        rr = bool(w.get('round_robin'))
        cash = is_cash(w); stake = float(w.get('stake_usd') or 0)
        if key is not None:
            pay = manual[key]
        elif rr or 'PENDING' in sts or None in sts:
            print('   -> stays open' + (' (round robin: needs --payout)' if rr else '')); continue
        elif 'LOST' in sts:
            pay = 0.0
        elif 'PUSH' in sts:
            print('   -> push leg: needs the re-priced payout via --payout'); continue
        else:
            pay = float(w.get('potential_payout_usd') or 0)
        profit = round(pay - (stake if cash else 0), 2)
        res = 'win' if profit > 0 else 'loss'
        note = (f"Settled {now[:10]} by {a.who} from ESPN final box score" + (f"; book payout ${pay:.2f} per Andy" if key else '')
                + ('' if cash else f"; promo/credit ticket — ${pay:.2f} is credit-funded value, not cash") + '.')
        print(f"   -> SETTLED {res}  payout ${pay:.2f}  profit {profit:+.2f}")
        w.update(status='SETTLED', result=res, settled_payout_usd=round(pay, 2), profit_usd=profit, graded_at=now)
        w['progress_notes'] = ((w.get('progress_notes') or '') + ' | ' + note).strip(' |')
        changes += 1
    print(f'\n{changes} change(s); {len(unresolved)} unresolved leg(s).')
    for u in unresolved: print('  unresolved:', u)
    if a.apply and changes:
        bak = WAGERS + '.bak-team2-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
        shutil.copy2(WAGERS, bak)
        json.dump(W, open(WAGERS, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
        print('wrote', WAGERS, '(backup', os.path.basename(bak) + ')')
    elif changes:
        print('dry run — nothing written (add --apply)')


if __name__ == '__main__':
    main()
