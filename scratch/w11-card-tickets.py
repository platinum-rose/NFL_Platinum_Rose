#!/usr/bin/env python3
"""Week 11 Sunday/Monday card proposals (Claude, Sun 11/22 ~12:30 AM PT). Proposals only: nothing placed or logged.
Writes the ticket section into reports/bets/2026-w11-card.md (between W11-TICKETS markers, replaced on re-run) and
data/official-picks/candidates-w11-sun.json for scripts/cards/check_overlap.py. Sunday: update the price sources and re-run."""
import json, re, collections, sys, datetime
SIM = json.load(open('reports/intel/w11-model/sim-w11-sat.json', encoding='utf-8'))['games']
GT = json.load(open('data/research-intel/review/2026-w11-gtmh-props.json', encoding='utf-8'))['games']
DK = json.load(open('data/generated/props/draftkings-predictions-feed-2026-11-19-week11.json', encoding='utf-8'))['rows']
BO = json.load(open('data/generated/props/betonline-live-2026-11-22-week11.json', encoding='utf-8'))['rows']
RO = json.load(open('data/nfl-rosters/espn-full-rosters-latest.json', encoding='utf-8'))['players']
AV = json.load(open('data/player-availability/latest.json', encoding='utf-8')).get('events', [])
RAW = open('data/generated/props/bookmaker-gamelines-2026-11-21-week11.raw.txt', encoding='utf-8').read()
TEAMFIX = {'WSH': 'WAS'}
def norm(n): return re.sub(r'\s+', ' ', re.sub(r'\b(jr|sr|ii|iii|iv)\b', '', re.sub(r"[^a-z ]", '', str(n or '').lower().replace('-', ' ')))).strip()
RN = collections.defaultdict(list)
for k, v in RO.items():
    for x in v: RN[norm(k)].append((TEAMFIX.get(x['team'], x['team']), 'ir' if x.get('group') == 'injuredReserveOrOut' else x.get('status')))
STAT = {}
for e in sorted(AV, key=lambda e: e.get('published_at') or ''):
    STAT[norm(e.get('player_name'))] = e.get('normalized_status') or e.get('status_raw')
BAD = {'out', 'doubtful', 'injured reserve', 'ir', 'suspended', 'pup'}
dec = lambda a: 1 + (a / 100 if a > 0 else 100 / -a)
amer = lambda d: round((d - 1) * 100) if d >= 2 else round(-100 / (d - 1))
imp = lambda a: 1 / dec(a)
fa = lambda a: f'{a:+d}'

# ---- Bookmaker main lines (Sat 5:42 PM PT) ----
BK = {}
for l in RAW.splitlines()[1:]:
    m = re.match(r'(\w+)@(\w+) (\w+) ([+-][\d.]+) ([+-]\d+) \| (\w+) ([+-][\d.]+) ([+-]\d+) \| o([\d.]+) ([+-]\d+) \| u[\d.]+ ([+-]\d+) \| ML \w+ ([+-]\d+) \w+ ([+-]\d+)', l)
    if not m: continue
    a, h = m.group(1), m.group(2)
    BK[f'{a}@{h}'] = dict(sp={a: (float(m.group(4)), int(m.group(5))), h: (float(m.group(7)), int(m.group(8)))}, tot=float(m.group(9)),
                          o=int(m.group(10)), u=int(m.group(11)), ml={a: int(m.group(12)), h: int(m.group(13))})
def side(gid, team):
    g, s = SIM[gid], BK[gid]; ln, pr = s['sp'][team]; home = gid.split('@')[1] == team
    p = g['home_cover_xp'] if home else g['away_cover_xp']
    return dict(game=gid, mk=f'{team} {ln:+g}', book='BKR', price=pr, p=p, src=f'sim {p:.1%}', kind='spread', sel=f'{team} {ln:+g}')
def total(gid, ou):
    g, s = SIM[gid], BK[gid]; p = g['over_xp'] if ou == 'Over' else g['under_xp']
    return dict(game=gid, mk=f"{ou} {s['tot']:g}", book='BKR', price=s['o' if ou == 'Over' else 'u'], p=p, src=f'sim {p:.1%}', kind='total', sel=f"{ou} {s['tot']:g}")
def ml(gid, team, note=''):
    g, s = SIM[gid], BK[gid]; home = gid.split('@')[1] == team; p = g['home_win'] if home else 1 - g['home_win']
    return dict(game=gid, mk=f'{team} ML{note}', book='BKR', price=s['ml'][team], p=p, src=f'model wins {p:.1%}', kind='moneyline', sel=f'{team} ML')

# ---- props ----
def gt(gid, call_prefix, want_book=None):
    """A Gun to my head prop by call prefix; want_book='BetOnline' forces that book's price from the offers list."""
    p = next((x for x in GT[gid]['picks'] if x['call'].startswith(call_prefix)), None)
    if not p: sys.exit(f'GTMH leg not found: {gid} {call_prefix}')
    b = p['best']; book, price = b['book'], b['price']
    if want_book and book != want_book:
        hit = [s for s in p['books'] if s.startswith(want_book) and f" {p['line']:g} (" in s]
        if hit: price = int(re.search(r'\(([+-]\d+)\)', hit[0]).group(1)); book = want_book
    q = p['no_vig'] if p.get('no_vig') and book == b['book'] else imp(price) * 0.955
    ev = ' '.join(e['detail'] for e in p['evidence'] if e['direction'] == 'for')[:170].rsplit(' ', 1)[0].rstrip('.;,') + '.'
    tier = 'GTMH ' + p['tier'].lower()
    call = re.sub(r' (Over|Under) ', lambda m: ' ' + m.group(1).lower() + ' ', p['call'])   # card style: the roster vet splits names on lowercase over/under
    return dict(game=gid, mk=call, book={'BetOnline': 'BEO', 'Bookmaker': 'BKR', 'DK Predictions': 'DKP'}.get(book, book), price=price, p=q,
                src=f'mkt no-vig {q:.0%}', kind=p['market'], sel=p['call'], player=p['player'], tier=tier, why=ev, cond=p.get('conditions') or [])
DKI = {}
for r in DK:
    if r.get('market') in ('atd_1_plus', 'first_td', 'td_2_plus') and r.get('american') is not None and r.get('player'):
        DKI[(r['game'], r['market'], norm(r['player']))] = (int(r['american']), r.get('team'))
BEOATD = {norm(r.get('player')): int(r['odds']) for r in BO if r.get('market') == 'atd_1_plus' and str(r.get('side')).lower() == 'yes' and r.get('odds') is not None}
LBL = {'atd_1_plus': 'anytime TD', 'first_td': 'first TD', 'td_2_plus': '2+ TDs'}
def td(gid, player, mk='atd_1_plus', why=''):
    a, team = DKI[(gid, mk, norm(player))]
    bo = BEOATD.get(norm(player)) if mk == 'atd_1_plus' else None
    extra = f' BEO Sat {fa(bo)}.' if bo is not None else ''
    return dict(game=gid, mk=f'{player} {LBL[mk]}', book='DKP', price=a, p=imp(a), src=f'DKP {imp(a):.0%}', kind=mk, sel=f'{player} {LBL[mk]}',
                player=player, tier='TD market', why=(why + f' DKP Thu {fa(a)}.{extra}').strip(), cond=[])

def vet(leg):
    pl = leg.get('player')
    if not pl: return None
    teams = set(leg['game'].split('@'))
    rec = [t for t, s in RN.get(norm(pl), []) if t in teams and (s or 'active') not in ('injured reserve', 'ir')]
    if not rec: return f'{pl}: not on the {leg["game"]} ESPN rosters'
    st = str(STAT.get(norm(pl)) or '').lower()
    if st in BAD: return f'{pl}: {st}'
    if st and st not in ('active', 'probable', ''): leg.setdefault('cond', []).append(f'{pl} listed {st}')
    return None

QB = {'TB@DET': 'TB QB: Mayfield Questionable (Andy tag).', 'ARI@KC': 'ARI QB: Josh Johnson preparing to start (Beck Q) (Andy tag).'}
T = []   # tickets
def tk(sec, name, book, stake, legs, cash, note, slot=None, rr=None):
    T.append(dict(sec=sec, name=name, book=book, stake=stake, legs=legs, cash=cash, note=note, rr=rr))

# ===== game markets =====
SNFCAP = ml('MIN@SF', 'SF', ' (SNF cap)')
tk('g', 'Morning Parlay (slot 3)', 'BKR', 10, [side('PIT@PHI', 'PIT') | dict(tier='card lean', why='Morning side lean on the approved card.'),
     total('NO@CHI', 'Under') | dict(tier='card lean', why='Morning total lean; weather lean kept by Andy (sim is a coin flip).'),
     ml('JAX@NYG', 'JAX') | dict(tier='card lean (ML)', why='Afternoon easy ML; JAX -5.5 is a card lean.'),
     SNFCAP | dict(tier='cap', why='SNF ML cap; hedge MIN +151 if the ticket is alive at SNF.')], True,
   "Andy morning template: 1-2 morning sides/totals, an easy afternoon ML, the SNF ML cap.")
tk('g', 'Afternoon Parlay (slot 4)', 'BKR', 10, [ml('BAL@CAR', 'CAR') | dict(tier='SC alt', why='Morning favorite; SC alternate CAR -2.5; model at fair.'),
     ml('PIT@PHI', 'PIT') | dict(tier='card lean (ML)', why='Morning favorite; PIT -4 is a card lean.'),
     side('JAX@NYG', 'JAX') | dict(tier='card lean', why='Afternoon high-confidence side (card lean).'),
     SNFCAP | dict(tier='cap', why='SNF ML cap; hedge MIN +151 at SNF.')], True,
   "Andy afternoon template: morning favorites (KC, BUF, CHI and DAL are past the -350 leg floor and left off), the afternoon card lean, the SNF ML cap. NYJ +3 (the Platinum Rose pick) is left off the parlays: it is already the straight bet and sits on both SuperContest tickets (S5 caps a side at 2 tickets).")
tk('g', 'Hybrid Parlay (slot 5)', 'BKR', 10, [side('PIT@PHI', 'PIT') | dict(tier='card lean', why='Card lean; morning.'),
     side('JAX@NYG', 'JAX') | dict(tier='card lean', why='Card lean.'), side('CIN@WAS', 'CIN') | dict(tier='card lean', why='Card lean; MNF leg.'),
     total('MIN@SF', 'Under') | dict(tier='card lean', why='Card lean; SNF.')], True,
   "The card leans across both windows plus SNF and MNF (4 legs: the S1 cash maximum). Each side sits on at most 2 tickets (S5).")
SC = [side('TB@DET', 'TB') | dict(tier='SC five', why='Contest +7; book +3.5. ' + QB['TB@DET']), side('TEN@DAL', 'TEN') | dict(tier='SC five', why='Contest +8; book +7.'),
      side('NYJ@LAC', 'NYJ') | dict(tier='SC five', why='Contest +3.5; book +3.'), side('MIN@SF', 'SF') | dict(tier='SC five', why='Contest -3; book -3.5 (+102).'),
      side('MIA@BUF', 'MIA') | dict(tier='SC five', why='Contest +16.5; book +16.')]
tk('sc', 'SuperContest 4-Team Parlay (slot 6, ticket A)', 'BKR', 15, SC[1:], True,
   "The Dashboard AI five minus TB: S1 caps cash parlays at 4 legs, and TB is the one to drop (Mayfield Questionable; the book's +3.5 is 3.5 points worse than the contest's +7). Adding TB back (5 legs) needs your override or promo funds. Swap legs to match the official five once you and Amanda lock it.")
tk('sc', 'SuperContest 2-Team Round Robin (slot 6, ticket B)', 'BKR', 10, SC, True, "Same five; 10 two-team combos x $1. 3 of 5 roughly returns the stake.", rr=(2, 1))
DOGS = [ml('NYJ@LAC', 'NYJ') | dict(tier='Platinum Rose pick', why=''), ml('LV@DEN', 'LV') | dict(tier='model dog', why=''),
        ml('TEN@DAL', 'TEN') | dict(tier='SC five', why=''), ml('TB@DET', 'TB') | dict(tier='SC five', why=QB['TB@DET']),
        ml('NO@CHI', 'NO') | dict(tier='model dog', why='')]
for d_ in DOGS: d_['why'] = (f"Model {d_['p']:.1%} vs {imp(d_['price']):.1%} implied. " + d_['why']).strip()
tk('sc', 'Dog ML Round Robin (slot 2, by 2s)', 'BKR', 20, DOGS, True,
   "Model-side underdogs where the model's win chance beats the implied price (NYJ by about 9 points; the rest by 1.5-4). A variance play, not a value play.", rr=(2, 2))

# ===== cross-game prop stacks (BEO) =====
tk('p', '7a Morning 6-Leg (BEO template)', 'BEO', 5, [gt('BAL@CAR', 'Chuba Hubbard Over 75.5', 'BetOnline'), gt('MIA@BUF', 'Ty Johnson Over 1.5', 'BetOnline'),
     gt('NO@CHI', "D'Andre Swift Over 64.5", 'BetOnline'), gt('PIT@PHI', 'Joe Milton III Under 0.5', 'BetOnline'),
     gt('TEN@DAL', 'Over 3.5 game field goals', 'BetOnline'), gt('ARI@KC', 'Travis Kelce Over 41.5', 'BetOnline')], False,
   "**Promo only:** 6 legs at BEO breaks P2 (no cash 5+ leg prop parlays at BetOnline). Build it as a DK Predictions 6-pick if the lines match (S1 allows 6 there), or use bonus/reload funds. Two rushing lanes, receiving at the lowest rung, a QB leg, a kicking leg. TB@DET left off (Mayfield).")
tk('p', '7b Afternoon/Night 4-Leg (BEO template)', 'BEO', 5, [gt('NYJ@LAC', 'Braelon Allen Over 33.5', 'BetOnline'), gt('JAX@NYG', 'Malik Nabers Under 68.5', 'BetOnline'),
     gt('LV@DEN', 'Jonah Coleman Over 22.5', 'BetOnline'), gt('MIN@SF', 'Brock Purdy Under 31.5', 'BetOnline')], True,
   "4 legs (S1 and P2 compliant). The SNF Purdy leg keeps it live into the night game.")
tk('p', '7d Hybrid 8-Leg (BEO template, promo)', 'BEO', 10, [gt('BAL@CAR', 'Justice Hill Over 13.5', 'BetOnline'), gt('MIA@BUF', 'Over 5.5 game touchdowns', 'BetOnline'),
     gt('NO@CHI', 'Juwan Johnson Under 20.5', 'BetOnline'), gt('PIT@PHI', 'Jaylen Warren Over 65.5', 'BetOnline'), gt('TEN@DAL', 'Tony Pollard Over 19.5', 'BetOnline'),
     gt('JAX@NYG', 'J.J. McCarthy Under 1.5', 'BetOnline'), gt('LV@DEN', 'Courtland Sutton Over 3.5', 'BetOnline'), gt('CIN@WAS', 'Samaje Perine Over 20.5', 'BetOnline')], False,
   "**Promo only** (8 legs). One leg per game, none repeated from 7a/7b; the MNF Perine leg keeps it alive through Monday.")
tk('p', '7e Anytime TD 7-Leg (promo)', 'DKP', 5, [td('NO@CHI', "D'Andre Swift", why='Lead back, CHI -11.5.'), td('PIT@PHI', 'Jaylen Warren', why='GTMH: Warren 65.5+ rushing lean.'),
     td('BAL@CAR', 'Derrick Henry', why='Goal-line back.'), td('LV@DEN', 'Courtland Sutton', why='GTMH strong lean (ATD).'),
     td('JAX@NYG', 'Bhayshul Tuten', why='JAX favored by 5.5.'), td('TEN@DAL', 'Tony Pollard', why='TEN lead back in a 55 total.'),
     td('CIN@WAS', 'Chase Brown', why='MNF night leg.')], False,
   "**Promo** (7 legs; P6 bars cash ATD legs at +350 or longer, and 7 legs is promo under S1). Kept every week by request. DKP prices are Thursday's; BEO Saturday prices are noted where posted.")
tk('p', '8a First TD 3-Leg (promo)', 'DKP', 5, [td('TB@DET', 'Jahmyr Gibbs', 'first_td', 'DET lead back. ' + QB['TB@DET']), td('ARI@KC', 'Emmett Johnson', 'first_td', 'KC lead back, KC -16.'),
     td('MIA@BUF', 'James Cook', 'first_td', 'BUF -16; GTMH Cook rushing lean.')], False, "**Promo only** (P6). Bookmaker TD-scorer markets were not posted Saturday, so these are DKP Thursday prices.")
tk('p', '8b 2+ TD 3-Leg (promo)', 'DKP', 5, [td('TB@DET', 'Jahmyr Gibbs', 'td_2_plus', QB['TB@DET']), td('ARI@KC', 'Emmett Johnson', 'td_2_plus', 'KC -16.'),
     td('TEN@DAL', 'Javonte Williams', 'td_2_plus', 'DAL lead back; 55 total.')], False, "**Promo only** (P6). Combined price is short of the +7000 target; 2+ TD legs price shorter than first-TD legs.")

# ===== island games =====
SNF, MNF = 'MIN@SF', 'CIN@WAS'
tk('i', 'SNF Tier 1 (MIN@SF)', 'BKR SGP / BEO', 10, [gt(SNF, 'Deebo Samuel Sr. Under 14.5'), gt(SNF, 'Jauan Jennings Under 12.5'), gt(SNF, 'Kaelon Black Over 28.5'),
     td(SNF, 'Christian McCaffrey', why='SF lead back.')], True,
   "Cash Island ticket: S21 band +400 to +1500. Theme: a short-field, run-first SF night (U46.5 card lean). The SGP builder reprices correlated legs; place only inside the band.")
tk('i', 'SNF Tier 2 (MIN@SF)', 'BKR SGP / BEO', 5, [gt(SNF, 'Brock Purdy Under 1.5'), total(SNF, 'Under') | dict(tier='card lean', why='Card lean.'),
     td(SNF, 'Justin Jefferson', why='MIN WR1.'), td(SNF, 'Aaron Jones', why='MIN lead back.')], False,
   "**Promo** (S21: Tiers 2-3 promo only). Different legs from Tier 1: SF passing stays quiet, Minnesota scores the touchdowns.")
tk('i', 'SNF Tier 3 Moonshot (MIN@SF)', 'BKR SGP / DKP', 5, [td(SNF, 'Christian McCaffrey', 'first_td', 'Opening-drive back.'), td(SNF, 'Justin Jefferson', 'td_2_plus', ''),
     td(SNF, 'George Kittle', why='SF TE red-zone target.')], False, "**Promo.** Lottery ticket; may reuse Tier 1-2 players (allowed for Tier 3). SF -3.5 left off: that side is already on both SuperContest tickets (S5).")
tk('i', 'MNF Tier 1 (CIN@WAS)', 'BKR SGP / BEO', 10, [gt(MNF, 'Samaje Perine Over 6.5'), gt(MNF, 'Joe Burrow Over 2.5'), td(MNF, 'Chase Brown', why='CIN lead back.'),
     side(MNF, 'CIN') | dict(tier='card lean', why='Card lean.')], True, "Cash Island ticket: S21 band +400 to +1500. Theme: CIN controls (CIN -6 card lean).")
tk('i', 'MNF Tier 2 (CIN@WAS)', 'BKR SGP / BEO', 5, [gt(MNF, 'Jayden Daniels Over 223.5'), td(MNF, "Ja'Marr Chase", why='CIN WR1.'), td(MNF, 'Tee Higgins', why='CIN WR2.'),
     td(MNF, 'Stefon Diggs', why='WAS chasing.')], False, "**Promo.** Different legs from Tier 1: a passing game script on both sides.")
tk('i', 'MNF Tier 3 Moonshot (CIN@WAS)', 'BKR SGP / DKP', 5, [td(MNF, "Ja'Marr Chase", 'td_2_plus', ''), td(MNF, 'Tee Higgins', 'first_td', ''),
     ml(MNF, 'CIN') | dict(tier='card lean (ML)', why=''), gt(MNF, 'Joe Burrow Over 2.5')], False, "**Promo.** Lottery ticket.")

# ---- vet, price, render ----
from itertools import combinations
probs, use = [], collections.Counter()
for t in T:
    for l in t['legs']:
        e = vet(l)
        if e: sys.exit('ROSTER/STATUS BLOCK: ' + e)
        if l.get('player'): use[norm(l['player'])] += 1
        if l['kind'] == 'total': use['TOTAL ' + l['game']] += 1
over = {k: v for k, v in use.items() if v > 2}
def price(t):
    if t['rr']:
        k, unit = t['rr']; combos = list(combinations(t['legs'], k))
        return None, combos, unit
    d = 1
    for l in t['legs']: d *= dec(l['price'])
    p = 1
    for l in t['legs']: p *= l['p']
    return (d, p), None, None
now = datetime.datetime.now().astimezone()
L = ['<!-- W11-TICKETS:BEGIN (generated by scratch/w11-card-tickets.py; re-run replaces this block) -->',
     '## Week 11 Sunday/Monday card — supersedes the sections above (Sat 11/21 late build, proposals only)', '',
     f"**Dashboard AI proposals for every weekend template slot (Andy asked Sun 11/22 12:00 AM PT).** Nothing here is placed or logged; nothing goes to the ledger without your OK. Rules version **2026-W11-r2** (S1 cash max 4 legs, DKP up to 6, 7+ promo; S5 a player or game total on at most 2 tickets; S21 cash Island +400 to +1500 with Tiers 2-3 promo; P2, P6). Prices: Bookmaker game lines Sat 5:42 PM PT, BetOnline props Sat 5:46 PM PT, DK Predictions TD markets Thu 1:12 PM PT (stale: reprice Sunday). Model chances: the Saturday margin sim for sides, totals and MLs; the market no-vig price for props (so prop legs sit near fair: these are the legs the intel backs, not edges, and none is a PLAY under S20). Prop legs come from the Gun to my head props (no Platinum Rose endorsement). Every player was checked against the ESPN rosters (Sat 11:01 PM) and the injury feed. **Recheck everything after Sunday inactives (~8:30 AM PT), especially TB (Mayfield) and ARI (Johnson/Beck).**", '']
SEC = {'g': '## 4. Game-market parlay templates — $10 each', 'sc': '## 4b. SuperContest tickets and round robins', 'p': '## 5. Prop pool and cross-game templates', 'i': '## 6. Island games (slot 9): SNF MIN@SF and MNF CIN@WAS'}
cur = None; cand = []
for t in T:
    if t['sec'] != cur:
        cur = t['sec']; L += [SEC[cur], '']
    pr, combos, unit = price(t)
    if combos:
        n = len(combos); ret = sorted(unit * __import__('math').prod(dec(l['price']) for l in c) for c in combos)
        head = f"### {t['name']} — {t['book']} — **${t['stake']}** — {n} two-team combos x ${unit} — returns: each winning combo pays about ${ret[0]:.0f}-${ret[-1]:.0f}"
        flag = t['note']
    else:
        d, p = pr; a = amer(d); be = 1 / d
        head = f"### {t['name']} — {t['book']} — **${t['stake']}** — {fa(a)} (est.) — returns about ${t['stake'] * d:,.0f} (to win ${t['stake'] * (d - 1):,.2f})"
        verdict = '**Clears break-even**' if p >= be else '**Below break-even — bet only as a preference play**'
        flag = f"Model hit chance {p:.1%} (legs treated as independent) vs {be:.1%} break-even at {fa(a)}: {verdict}. " + t['note']
        if t['sec'] == 'i' and t['cash'] and not (400 <= a <= 1500): flag += f' **Outside the S21 cash band at {fa(a)}.**'
    L += [head, '', '| Game | Market & line | Book | Price | Tier | Why |', '|---|---|---|---|---|---|']
    conds = []
    for l in t['legs']:
        why = (l.get('why') or '').replace('|', '/')
        L.append(f"| {l['game']} | {l['mk']} | {l['book']} | {fa(l['price'])} | {l.get('tier', '')} | {why} {l['src']}. |".replace('  ', ' '))
        conds += l.get('cond') or []
    if conds: flag += ' Conditions: ' + ' '.join(sorted(set(conds)))
    L += ['', 'Flags: ' + flag, '']
    cand.append(dict(id=t['name'], book=t['book'].split()[0], cash=t['cash'], date='2026-11-23' if 'MNF' in t['name'] else '2026-11-22',
                     **({} if combos else {'price': fa(amer(pr[0]))}), card_section=SEC[t['sec']], **({'round_robin': {'teams_per_combination': t['rr'][0]}} if t['rr'] else {}),
                     legs=[dict(game=l['game'].replace('@', ' @ '), selection=l['sel'], market={'spread': 'spread', 'total': 'total', 'moneyline': 'moneyline'}.get(l['kind'], l['kind']), price=fa(l['price'])) for l in t['legs']]))
L += ['Player and total use across the slate (S5 cap 2): ' + ', '.join(f'{k} {v}' for k, v in sorted(use.items()) if v >= 2) + '.', '', '<!-- W11-TICKETS:END -->', '']
block = '\n'.join(L)
fn = 'reports/bets/2026-w11-card.md'; s = open(fn, encoding='utf-8').read()
s = re.sub(r'\n?<!-- W11-TICKETS:BEGIN.*?W11-TICKETS:END -->\n?', '\n', s, flags=re.S).rstrip()
# build.py reads only the newest 'supersedes' block, so the SuperContest list (and its alternates) is repeated inside it
scm = re.search(r'^## SuperContest\n.*?(?=^## |\Z)', s, re.M | re.S)
block = block.replace('<!-- W11-TICKETS:END -->', (scm.group(0).rstrip() + '\n\n' if scm else '') + '<!-- W11-TICKETS:END -->')
s = s + '\n\n' + block
open(fn, 'w', encoding='utf-8', newline='').write(s)
json.dump(cand, open('data/official-picks/candidates-w11-sun.json', 'w', encoding='utf-8'), indent=1)
print(f'{len(T)} tickets written to {fn}; S5 overuse: {over or "none"}')
for t in T:
    pr, combos, unit = price(t)
    print(f"  {t['name'][:42]:42} {'RR' if combos else fa(amer(pr[0])):>8}  ${t['stake']}  {'cash' if t['cash'] else 'promo'}  legs {len(t['legs'])}" + ('' if combos else f"  hit {pr[1]:.1%} vs BE {1/pr[0]:.1%}"))
