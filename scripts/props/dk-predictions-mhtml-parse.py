#!/usr/bin/env python3
"""Parse a saved DraftKings Predictions event page (.mhtml, Chrome "Save as") into JSON.

Claude in Chrome refuses predictions.draftkings.com, so capture is: Andy expands the
market sections and saves the page (Ctrl+S) into docs/Player_Prop_Odds_Weekly/Week<N>/DK/.
This reads what was rendered: game/1H/1Q lines, team totals (+ladders), TD scorers
(anytime / first / 2+), player O/U props, and the one selected rung of each ladder.

DK shows per-side contract prices as percentages (e.g. Over 54% / Under 54%). They are
NOT sportsbook odds: `prob` is the buy price, `american_gross` is its pre-fee American
equivalent. Never compare them to BKR/BEO prices without a fee/spread check.

usage: python3 scripts/props/dk-predictions-mhtml-parse.py <file.mhtml> [...] [--out-dir data/generated/props]
"""
import email, html, json, re, sys, os
from email import policy

LADDER_HEADERS = {'Pass Yards': 'pass_yds', 'Pass TDs': 'pass_td', 'Receiving Yards': 'rec_yds', 'Receptions': 'rec',
                  'Rush Yards': 'rush_yds', 'Rush + Rec Yards': 'rush_rec_yds', 'Pass Attempts': 'pass_att',
                  'Completions': 'pass_cmp', 'Interceptions': 'pass_int', 'Rush Attempts': 'rush_att'}
OU_HEADERS = {'Pass Yards O/U': 'pass_yds', 'Pass TDs O/U': 'pass_td', 'Rec Yards O/U': 'rec_yds', 'Receptions O/U': 'rec',
              'Rush Yards O/U': 'rush_yds', 'Completions O/U': 'pass_cmp', 'Interceptions O/U': 'pass_int',
              'Rush Attempts O/U': 'rush_att', 'Rush + Rec Yards O/U': 'rush_rec_yds', 'Longest Reception O/U': 'longest_rec'}
PERIODS = {'Game': 'game', '1st Half': 'first_half', '1st Quarter': 'first_quarter'}
PCT = re.compile(r'^(\d{1,3})%$')
NUM = re.compile(r'^[+-]?\d+(\.\d+)?$')


def american(p):
    if not p or p <= 0 or p >= 1:
        return None
    return -round(p / (1 - p) * 100) if p >= 0.5 else round((1 - p) / p * 100)


def tokens_from_mhtml(path):
    msg = email.message_from_binary_file(open(path, 'rb'), policy=policy.default)
    h = next(p for p in msg.walk() if p.get_content_type() == 'text/html').get_content()
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', h, flags=re.S)
    t = re.sub(r'<br\s*/?>|</(div|p|li|button|span|h\d|tr|td)>', '\n', t)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t))
    toks = [x.strip() for x in t.split('\n') if x.strip()]
    # drop animated digit-roller noise (runs of 0..9, lone '.') and stat labels like 'RRTD:' / 'YDS/G:'
    out, i = [], 0
    while i < len(toks):
        if toks[i:i + 10] == [str(d) for d in range(10)]:
            i += 10
            continue
        if toks[i] == '.' or re.fullmatch(r'[A-Za-z/+ ]{2,14}:', toks[i]):
            i += 1
            continue
        out.append(toks[i]); i += 1
    return out


def pct(tok):
    m = PCT.match(tok or '')
    return int(m.group(1)) / 100 if m else None


def row(**kw):
    p = kw.get('prob')
    kw['american_gross'] = american(p) if p is not None else None
    return kw


def parse(path):
    T = tokens_from_mhtml(path)
    title = T[0].split(' Predictions')[0]
    away, home = [s.strip() for s in title.split('@')]
    rows = []
    n = len(T)
    stop_words = set(LADDER_HEADERS) | set(OU_HEADERS) | set(PERIODS) | {'Team Total Points', 'TD Scorer', 'Trade Slip'}

    # --- game / 1H / 1Q lines: <team1> at <team2> s1 p O t p ml s2 p U t p ml
    for i, tok in enumerate(T):
        if tok in PERIODS and i + 6 < n and T[i + 5] == 'at':
            per = PERIODS[tok]
            seq = T[i + 7:i + 19]
            try:
                a_sp, a_sp_p, _, tot, o_p, a_ml, h_sp, h_sp_p, _, _, u_p, h_ml = seq
            except ValueError:
                continue
            rows += [row(market=f'{per}_spread', side=away, line=float(a_sp), prob=pct(a_sp_p)),
                     row(market=f'{per}_spread', side=home, line=float(h_sp), prob=pct(h_sp_p)),
                     row(market=f'{per}_total', side='Over', line=float(tot), prob=pct(o_p)),
                     row(market=f'{per}_total', side='Under', line=float(tot), prob=pct(u_p)),
                     row(market=f'{per}_moneyline', side=away, line=None, prob=pct(a_ml)),
                     row(market=f'{per}_moneyline', side=home, line=None, prob=pct(h_ml))]

    # --- team totals (main line + ladder pairs)
    for i, tok in enumerate(T):
        m = re.match(r'^(.*) Total Points O/U$', tok)
        if not m:
            continue
        team, j = m.group(1), i + 1
        seen = set()
        while j + 2 < n and T[j] != 'View More' and not T[j].endswith('Total Points O/U') and T[j] not in stop_words:
            if T[j] in ('Over', 'Under') and NUM.match(T[j + 1]) and pct(T[j + 2]) is not None:
                key = (T[j], T[j + 1])
                if key not in seen:
                    seen.add(key)
                    rows.append(row(market='team_total', team=team, side=T[j], line=float(T[j + 1]), prob=pct(T[j + 2])))
                j += 3
            else:
                j += 1

    # --- TD scorers: name, anytime%, first%, 2+%
    if 'TD Scorer' in T:
        i = T.index('TD Scorer') + 4
        while i + 3 < n and T[i] not in stop_words:
            name = T[i]
            ps = T[i + 1:i + 4]
            if all(pct(x) is not None for x in ps):
                for mk, x in zip(('atd_1_plus', 'first_td', 'td_2_plus'), ps):
                    rows.append(row(market=mk, player=name, side='Yes', line=None, prob=pct(x)))
                i += 4
            else:
                i += 1

    # --- player O/U sections: name O line p U line p
    for i, tok in enumerate(T):
        if tok not in OU_HEADERS:
            continue
        mk, j = OU_HEADERS[tok], i + 4  # skip Player / Over / Under
        while j + 6 < n and T[j + 1] == 'O' and T[j + 4] == 'U':
            name = T[j]
            rows.append(row(market=mk, kind='ou', player=name, side='Over', line=float(T[j + 2]), prob=pct(T[j + 3])))
            rows.append(row(market=mk, kind='ou', player=name, side='Under', line=float(T[j + 5]), prob=pct(T[j + 6])))
            j += 7

    # --- ladders: only the selected rung carries a %, it follows that rung's threshold
    for i, tok in enumerate(T):
        if tok not in LADDER_HEADERS or (i + 1 < n and T[i + 1] in ('Player',)):
            continue
        mk, j, player = LADDER_HEADERS[tok], i + 1, None
        while j < n and T[j] not in stop_words:
            t = T[j]
            if re.fullmatch(r'\d+\+', t):
                if j + 1 < n and pct(T[j + 1]) is not None and player:
                    rows.append(row(market=mk, kind='ladder_selected_rung', player=player, side='Over',
                                    threshold=int(t[:-1]), line=int(t[:-1]) - 0.5, prob=pct(T[j + 1])))
            elif pct(t) is None:
                player = t
            j += 1

    return {'schema': 'dk_predictions_markets_v1', 'source_file': os.path.basename(path), 'event': f'{away} @ {home}',
            'away': away, 'home': home,
            'note': 'prob = DK contract buy price per side (not sportsbook odds); american_gross is pre-fee. Over+Under sum > 100% (spread).',
            'summary': {k: sum(1 for r in rows if r['market'] == k) for k in sorted({r['market'] for r in rows})},
            'rows': rows}


if __name__ == '__main__':
    args = sys.argv[1:]
    out_dir = 'data/generated/props'
    if '--out-dir' in args:
        k = args.index('--out-dir'); out_dir = args[k + 1]; del args[k:k + 2]
    for f in args:
        d = parse(f)
        slug = re.sub(r'[^a-z0-9]+', '-', f"{d['away'].split()[-1]}-at-{d['home'].split()[-1]}".lower())
        stamp = os.path.getmtime(f)
        import datetime
        day = datetime.datetime.fromtimestamp(stamp).strftime('%Y-%m-%d')
        out = os.path.join(out_dir, f'dk-predictions-{day}-{slug}.json')
        json.dump(d, open(out, 'w'), indent=1)
        print(f"{d['event']}: {len(d['rows'])} rows -> {out}")
        print('  ' + ', '.join(f'{k}={v}' for k, v in d['summary'].items()))
