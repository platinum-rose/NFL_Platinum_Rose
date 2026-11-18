#!/usr/bin/env python3
"""Pre-buy rules check for a week's tickets (rules version 2026-W11-r1, approved by Andy 11/17).
Run it on the proposed tickets BEFORE anything is placed; exit code 1 means a ticket must be cut or changed.

S5  (was P3) correlation cap: at most 2 tickets per slate may carry the same PLAYER (any stat: yards, TD, receptions all
    count as one) or the same game total.
S1  (was R9-1) cash parlays max 4 legs; DraftKings Predictions up to 6; 7+ promo only. A round robin counts its
    combination size (8 picks in 4-team combos = 4).
P1  cash same-game side+total 2-teamer -> needs a fair-line edge >= 1.5 on BOTH legs (flagged for a manual check).
P2  no cash prop parlays of 5+ legs at BetOnline.
P6  cash: no first-TD / 2+TD legs; anytime TD only when priced under +350.
C5 (no master round robins) retired 11/17.
Cash = real-money funded (promo / free-bet funding is not cash). bankroll_exempt does NOT make a ticket non-cash.

Reads the ledger (data/official-picks/user-placed-wagers-2026.json) for the week, plus optional candidate tickets:
  python scripts/cards/check_overlap.py --week 10 --date 2026-11-15
  python scripts/cards/check_overlap.py --week 10 --date 2026-11-15 --candidates data/official-picks/candidates-w10-sun.json
(--date is the game day in PT; --candidates is optional)
Candidates file: [{"id": "...", "book": "...", "cash": true, "date": "2026-11-15",
                   "legs": [{"game": "SF @ DAL", "selection": "Christian McCaffrey 4+ Receptions", "market": "receptions", "price": "+120"}]}]
Read-only. Exit code 1 if any rule is broken."""
import argparse, collections, json, re, sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FAM = {'receptions': 'receiving', 'receiving_yards': 'receiving', 'rec_yds': 'receiving', 'longest_reception': 'receiving',
       'rushing_yards': 'rushing', 'rushing_attempts': 'rushing', 'carries': 'rushing', 'longest_rush': 'rushing',
       'rushing_receiving_yards': 'rush+rec', 'passing_yards': 'passing', 'passing_tds': 'passing', 'passing_touchdowns': 'passing',
       'pass_completions': 'passing', 'pass_attempts': 'passing', 'longest_completion': 'passing',
       'pass_interceptions': 'int', 'interceptions_thrown': 'int',
       'anytime_td': 'td', 'anytime_touchdown': 'td', 'rush_rec_td': 'td', 'first_td': 'td', 'two_plus_touchdowns': 'td', 'touchdowns_2_plus': 'td',
       'tackles_assists': 'tackles', 'tackles': 'tackles', 'sacks': 'sacks', 'field_goals_made': 'kicking'}
GAMELINE = {'spread', 'moneyline', 'total', 'team_total'}
STOP = r'\b(\d+\+?|over|under|more|less|anytime|first|alt(ernate)?|to|o\d|u\d|receptions|receiving|rushing|passing|tackles|touchdowns?|td)\b'

def player_of(sel):
    """'Over 2.5 Chig Okonkwo Receptions' / 'Chigoziem Okonkwo 4+ Receptions' -> 'c okonkwo' (first initial + last name)."""
    s = re.sub(r'\([A-Z]{2,3}\)', ' ', sel or '')
    s = re.sub(r'^\s*(yes|no)\s+', '', s, flags=re.I)
    s = re.sub(r'^\s*(over|under|more|less)\s+\d+(\.\d+)?\s+', '', s, flags=re.I)
    s = re.sub(r'^\s*\d+(\.\d+)?\+?\s*', '', s)
    name = re.split(STOP, s, maxsplit=1, flags=re.I)[0].strip(' -')
    w = [x for x in re.split(r'\s+', name) if x and x.lower() not in ('jr.', 'jr', 'sr.', 'ii', 'iii', 'iv')]
    if len(w) >= 2: return f"{w[0][0].lower()} {w[-1].lower()}"
    return name.lower()

def norm_game(g):
    return re.sub(r'\s+', '', (g or '').upper()).replace('VS', '@')

def leg_key(l):
    mk = (l.get('market') or '').lower(); g = norm_game(l.get('game'))
    if mk == 'total' or re.search(r'total points', l.get('selection') or '', re.I): return (g, 'game total')
    if mk in GAMELINE: return (g, 'side', re.sub(r'[\s+\-\d.]+(alternate spread)?$', '', (l.get('selection') or '').lower()).strip())
    return (g, l.get('player') and player_of(l['player']) or player_of(l.get('selection')))   # S5: per player, any stat

def price(l):
    p = l.get('odds_american') or l.get('price')
    try: return float(str(p).replace('+', ''))
    except (TypeError, ValueError): return None

def is_cash(w):
    # 2026-11-17: funding decides, not bankroll_exempt (every DKP ticket is bankroll-exempt but most are cash-funded).
    return not (w.get('is_promo_credit') or (w.get('funding_type') or '') in ('promo_credit', 'free_bet')
                or (w.get('funding_type') or '').startswith('promo') or w.get('cash') is False)

DKP = 'DraftKings Predictions'
def parlay_size(w, legs):
    rr = w.get('round_robin') or {}
    if rr.get('teams_per_combination'): return int(rr['teams_per_combination']), True
    m = re.search(r'(\d+)-team comb', w.get('ticket_type') or '', re.I)
    return (int(m.group(1)), True) if m else (len(legs), False)

ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--date')
ap.add_argument('--candidates', help='JSON list of proposed tickets to check alongside the ledger')
a = ap.parse_args()
W = [w for w in json.load(open(os.path.join(ROOT, 'data/official-picks/user-placed-wagers-2026.json'), encoding='utf-8')) if w.get('week') == a.week]
if a.candidates:
    if not os.path.exists(a.candidates):
        sys.exit(f"No candidates file at {a.candidates}. It's created when Sunday's tickets are proposed; run without --candidates to check placed tickets only.")
    for c in json.load(open(a.candidates, encoding='utf-8')):
        c.setdefault('week', a.week); c['_candidate'] = True; W.append(c)

import datetime as _dt
KICK = {}
for g in json.load(open(os.path.join(ROOT, 'public/schedule.json'), encoding='utf-8')):
    if g.get('week') == a.week and g.get('kickoff_utc'):
        d = (_dt.datetime.fromisoformat(g['kickoff_utc'].replace('Z', '+00:00')) - _dt.timedelta(hours=8)).date().isoformat()
        KICK[f"{g['visitor']}@{g['home']}"] = d
def slate_of(w):  # game day (PT) of the ticket's earliest leg; falls back to the ticket date
    ds = sorted({KICK.get(norm_game(l.get('game')).replace('WSH', 'WAS')) for l in (w.get('legs') or [])} - {None})
    return ds[0] if ds else w.get('date')
problems, notes = [], []
if a.date: W = [w for w in W if slate_of(w) == a.date]
by_slate = collections.defaultdict(lambda: collections.defaultdict(set))
for w in W:
    tid = w['id']; legs = w.get('legs') or []; cash = is_cash(w); tag = ('NEW ' if w.get('_candidate') else '') + tid
    for l in legs: by_slate[slate_of(w)][leg_key(l)].add(tag)
    if not cash: continue
    n, rr = parlay_size(w, legs); lim = 6 if w.get('book') == DKP else 4
    if n > lim:
        problems.append(f'S1 {tag}: {n} legs{" per RR combination" if rr else ""} on a cash ticket (limit {lim}' +
                        (' at DKP' if w.get('book') == DKP else '; 5-6 only on DKP') + '; 7+ is promo-only)')
    props = [l for l in legs if (l.get('market') or '').lower() not in GAMELINE]
    if 'BetOnline' in (w.get('book') or '') and len(legs) >= 5 and props:
        problems.append(f'P2 {tag}: {len(legs)}-leg prop parlay at BetOnline (cash)')
    for l in legs:
        sel = l.get('selection') or ''; mk = (l.get('market') or '').lower()
        if mk == 'first_td' or re.search(r'first td|1st td', sel, re.I) or mk in ('two_plus_touchdowns', 'touchdowns_2_plus') or re.search(r'\b2\+ (rush|rec|total )?(\w+ )?(td|touchdowns?)\b', sel, re.I) and 'pass' not in sel.lower():
            problems.append(f'P6 {tag}: "{sel}" (first TD / 2+ TD is promo-only)')
        elif FAM.get(mk) == 'td' or 'anytime td' in sel.lower():
            p = price(l)
            if p is not None and p >= 350: problems.append(f'P6 {tag}: "{sel}" at +{p:.0f} (ATD must be under +350)')
            elif p is None: notes.append(f'P6 {tag}: "{sel}" has no leg price recorded; confirm it is under +350')
    if len(legs) == 2 and len({norm_game(l.get("game")) for l in legs}) == 1:
        mks = {(l.get('market') or '').lower() for l in legs}
        if 'total' in mks and mks & {'spread', 'moneyline'}:
            notes.append(f'P1 {tag}: same-game side+total 2-teamer; confirm a fair-line edge >= 1.5 on BOTH legs (reports/intel/w{a.week:02d}-model/)')
for slate, keys in sorted(by_slate.items(), key=lambda kv: str(kv[0])):
    for k, ids in sorted(keys.items(), key=lambda kv: -len(kv[1])):
        if len(ids) > 2:
            problems.append(f'S5 slate {slate}: "{" ".join(x for x in k[1:] if x)}" ({k[0]}) is on {len(ids)} tickets: ' + ', '.join(sorted(ids)))
        elif len(ids) == 2:
            notes.append(f'S5 slate {slate}: "{" ".join(x for x in k[1:] if x)}" ({k[0]}) on 2 tickets (at the cap)')
print(f'Week {a.week}: {len(W)} tickets checked' + (f' on {a.date}' if a.date else '') + ' (rules 2026-W11-r1)')
for p in problems: print('  BREAK  ' + p)
for n in notes: print('  check  ' + n)
if not problems: print('  OK: no rule broken')
sys.exit(1 if problems else 0)
