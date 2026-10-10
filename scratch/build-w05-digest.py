#!/usr/bin/env python3
"""Regenerate scratch/w05-synthesis-digest-sat.md in the standard layout:
   game | market | lean | source | tier        (game = VISITOR@HOME)
Inputs: w05-pull.json, w05-expert-verified.json (verified rows only set tiers), youtube-extracted-picks-2026-w05.json,
        player-props-intel-latest.json, w05-article-gemini-picks.json (provenance), BKR 10/10 display board (current numbers).
Read-only on every input; writes only the digest."""
import json, re, collections, datetime, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
J = lambda p: json.load(open(ROOT / p, encoding='utf-8'))
now = datetime.datetime.now(datetime.timezone.utc)
try:
    from zoneinfo import ZoneInfo
    now_pt = now.astimezone(ZoneInfo('America/Los_Angeles'))
except Exception:
    now_pt = now - datetime.timedelta(hours=7)
STAMP = now_pt.strftime('%a %Y-%m-%d %H:%M PT')

# ---------- schedule (HOME-line spreads; ids VISITOR@HOME) ----------
sched = [g for g in J('public/schedule.json') if g.get('week') == 5 and g.get('season') == 2026 and g.get('season_type') == 2]
for g in sched:
    g['k'] = datetime.datetime.fromisoformat(g['kickoff_utc'].replace('Z', '+00:00'))
    g['done'] = g['k'] + datetime.timedelta(hours=4) < now
    g['id'] = f"{g['visitor']}@{g['home']}"
sched.sort(key=lambda g: g['k'])
LIVE = [g for g in sched if not g['done']]; DONE = [g['id'] for g in sched if g['done']]
GM = {g['id']: g for g in LIVE}

# ---------- BKR 10/10 display board ----------
NUM = r'([+-]\d+(?:\.\d+)?)([+-]\d+)'
TM = r'([A-Z]{2,4})'
pat = re.compile('^' + TM + r' @ ' + TM + r' (\d\d:\d\d)\s+' + TM + ' ' + NUM + r' / ' + TM + ' ' + NUM +
                 r'\s+o(\d+(?:\.\d+)?)([+-]\d+) u\d+(?:\.\d+)?([+-]\d+)\s+' + TM + r' ([+-]\d+) ' + TM + r' ([+-]\d+)')
BKR = {}
for ln in (ROOT / 'data/odds/BKR_current_lines_1010_user_provided_buildfmt').read_text(encoding='utf-8').splitlines():
    m = pat.match(ln.strip())
    if not m: continue
    a, h, tm, t1, s1, p1, t2, s2, p2, tot_, op, up, m1, ml1, m2, ml2 = m.groups()
    BKR[f'{a}@{h}'] = dict(spread={t1: (float(s1), int(p1)), t2: (float(s2), int(p2))}, total=(float(tot_), int(op), int(up)),
                           ml={m1: int(ml1), m2: int(ml2)}, time=tm)
miss = [g['id'] for g in LIVE if g['id'] not in BKR]
if miss: sys.exit(f'BKR board missing games: {miss}')

# ---------- provenance ----------
gem = J('data/generated/master-intel/w05-article-gemini-picks.json')
GEM_ROWS = [r for a in gem['articles'] for r in a['rows']]
GEM_Q = {(r.get('rationale') or '').strip() for r in GEM_ROWS}; GEM_U = {r.get('event_ref') for r in GEM_ROWS}
pull = J('data/generated/master-intel/w05-pull.json')
ver = J('data/generated/master-intel/w05-expert-verified.json')
VROWS = [x for x in ver['rows'] if x['verdict'] == 'verified' and x['game'] in GM]

def cls_of(x):
    q = (x.get('quote') or '').strip()
    if x['outlet'] == 'Cody Brown Bets': return 'RO'
    if x.get('url') in GEM_U and q in GEM_Q: return 'RO'
    if not q: return 'RO'
    return 'V'

def label(x):
    ps = [p for p in (x.get('persons') or []) if p]
    if x['outlet'].startswith('Twitter/X'): return (ps[0] if ps else 'X bookmark') + ' (X)'
    if x['kind'] == 'podcast' and ps: return ps[0]
    if x['outlet'] == 'Cody Brown Bets': return 'Cody Brown'
    if x['outlet'] == 'ESPN NFL': return 'ESPN NFL'
    return x['outlet'].replace('&amp;', '&')[:44]

def num(s):
    try: return float(s)
    except Exception: return None

def team_from(x, g):
    v, h = g['visitor'], g['home']
    for c in (x.get('side'), x.get('selection')):
        if c in (v, h): return c
    text = ' '.join(str(c) for c in (x.get('side'), x.get('selection')) if c)
    found = set()
    for ab, nm in ((v, g['visitorName']), (h, g['homeName'])):
        if re.search(r'\b' + re.escape(nm.split()[-1]) + r'\b', text, re.I) or re.search(r'\b' + ab + r'\b', text): found.add(ab)
    return found.pop() if len(found) == 1 else None

def fmt(n):
    if n is None: return ''
    return f'{n:+g}'
def px(n): return f'{n:+d}'
def clean(s): return re.sub(r'\s+', ' ', str(s).replace('|', '/')).strip()

# ---------- sides / totals ----------
side = {gid: dict(V=collections.defaultdict(dict), O=collections.defaultdict(dict), tea=collections.defaultdict(set), ml=collections.defaultdict(set)) for gid in GM}
tot = {gid: dict(V=collections.defaultdict(dict), O=collections.defaultdict(dict)) for gid in GM}
dropped = []
for x in VROWS:
    gid = x['game']; g = GM[gid]; c = cls_of(x); bucket = 'V' if c == 'V' else 'O'
    mk = x['market']
    if mk in ('spread', 'moneyline', 'teaser'):
        t = team_from(x, g)
        if not t: dropped.append((gid, mk, x['selection'])); continue
        ln = num(x.get('line'))
        if mk == 'teaser': side[gid]['tea'][t].add(label(x)); continue
        d = side[gid][bucket][t]; lab = label(x)
        d.setdefault(lab, []).append(ln if mk == 'spread' else None)
        if mk == 'moneyline': side[gid]['ml'][t].add(lab)
    elif mk in ('total', 'totals'):
        s_ = (x.get('side') or '') + ' ' + x['selection']
        sd = 'Over' if re.search(r'over', s_, re.I) else 'Under' if re.search(r'under', s_, re.I) else None
        if not sd: dropped.append((gid, mk, x['selection'])); continue
        tot[gid][bucket][sd].setdefault(label(x), []).append(num(x.get('line')))

# ---------- YouTube / props-intel (corroboration, unverified) ----------
yt = J('data/podcasts/youtube-extracted-picks-2026-w05.json')
pi = J('data/research-intel/review/player-props-intel-latest.json')
ytside = collections.defaultdict(list)
def normgame(s): return re.sub(r'\s*(@|at)\s*', '@', str(s).strip())

STATS = [('FTD', r'first (td|touchdown)'), ('ATD', r'anytime|any time|touchdowns? (over )?0\.5|\bATD\b|td scorer'),
         ('rush+rec yds', r'rush(ing)? ?\+ ?rec|rushing \+ receiving'), ('pass TD', r'pass(ing)? (td|touchdown)'),
         ('pass yds', r'pass(ing)? y(ar)?ds'), ('rec yds', r'rec(eiving)? y(ar)?ds'), ('rush yds', r'rush(ing)? y(ar)?ds'),
         ('rec', r'receptions|\brec\b'), ('interceptions', r'interception')]
def stat_of(t):
    t = t.lower().replace('_', ' ')
    for k, rx in STATS:
        if re.search(rx, t, re.I): return k
    return None

props = collections.defaultdict(list)   # (gid, player, stat) -> records
unparsed = collections.Counter()
def add_prop(gid, player, stat, sd, line, price, lab, cls, best=False):
    if gid not in GM or not player: return
    props[(gid, player, stat)].append(dict(side=sd, line=line, price=price, label=lab, cls=cls, best=best))

def parse_side_line_price(x):
    s_ = f"{x.get('side') or ''} {x['selection']}"
    sd = 'Over' if re.search(r'\bover\b', s_, re.I) else 'Under' if re.search(r'\bunder\b', s_, re.I) else ('Yes' if re.search(r'yes|anytime|unknown', s_, re.I) else None)
    m = re.search(r'(?:over|under)\s+(\d+(?:\.\d+)?)', s_, re.I)
    line = float(m.group(1)) if m else None
    m2 = re.search(r'\(([+-]\d{3,4})\)', s_)
    price = int(m2.group(1)) if m2 else (int(x['price']) if isinstance(x.get('price'), (int, float)) else None)
    return sd, line, price

for x in VROWS:
    if x['market'] != 'prop': continue
    pl = (x.get('players') or [None])[0]
    stat = stat_of(x['selection'] + ' ' + (x.get('side') or ''))
    if not stat: unparsed[x['selection'][:50]] += 1; continue
    sd, line, price = parse_side_line_price(x)
    if stat in ('ATD', 'FTD'):
        sd = 'Yes'; line = None
        if price is None and isinstance(x.get('line'), (int, float)) and x['line'] >= 100: price = int(x['line'])   # expert_feed stores the price in 'line'
    elif line is None and isinstance(x.get('line'), (int, float)) and x['line'] < 100: line = float(x['line'])
    if sd is None: unparsed[x['selection'][:50]] += 1; continue
    add_prop(x['game'], pl, stat, sd, line, price, label(x), cls_of(x), bool(x.get('best_bet')))

for p in yt['picks']:
    gid = p['game']; raw = p['raw']; mk = (raw.get('market') or '').lower()
    if mk in ('spread', 'moneyline'):
        ytside[gid].append((raw.get('side') or raw.get('team'), p['pick'], p['speaker'])); continue
    if mk == 'total':
        ytside[gid].append((str(raw.get('side') or '').title(), p['pick'], p['speaker'])); continue
    stat = stat_of(p['pick'] + ' ' + mk)
    if not stat or not raw.get('player'): unparsed['YT:' + p['pick'][:40]] += 1; continue
    sd = 'Yes' if stat in ('ATD', 'FTD') else (raw.get('side') or '').title()
    if sd not in ('Over', 'Under', 'Yes'): unparsed['YT:' + p['pick'][:40]] += 1; continue
    add_prop(gid, raw['player'], stat, sd, num(raw.get('line')) if stat not in ('ATD', 'FTD') else None, p.get('price'), p['speaker'] + ' (YT)', 'Y')

for p in pi['props']:
    gid = normgame(p['game']); stat = stat_of(str(p.get('category')) + ' ' + str(p.get('category_label')))
    if not stat: unparsed['PI:' + str(p.get('category'))] += 1; continue
    sd = 'Yes' if stat in ('ATD', 'FTD') else str(p.get('side')).title()
    if sd == 'Anytime': sd = 'Yes'
    ln = re.sub(r'[^\d.]', '', str(p.get('line'))) if stat not in ('ATD', 'FTD') else ''
    pr = num(p.get('price'))
    if '+' in str(p.get('line')) and ln and stat not in ('ATD', 'FTD'):
        stat = f'{stat} {float(ln):g}+'; ln = ''        # alt-ladder market ("70+"): its own market, never merged with an over/under line
    add_prop(gid, p['player'], stat, sd, float(ln) if ln else None, int(pr) if pr is not None else None, (p.get('analyst') or 'props-intel') + ' (PI)', 'P')

# ---------- availability (same rule as build.py): latest OUT/DOUBTFUL/QUESTIONABLE status per player ----------
INJ = collections.defaultdict(dict)
for e in (J('data/player-availability/latest.json').get('events') or []):
    if e.get('position') not in ('QB', 'RB', 'WR', 'TE'): continue
    st = str(e.get('normalized_status') or '').upper()
    if not re.match(r'^(OUT|DOUBTFUL|QUESTIONABLE)', st): continue
    t, n = e.get('team_abbr'), e['player_name']
    if n not in INJ[t] or str(e.get('published_at')) > str(INJ[t][n]['published_at']): INJ[t][n] = e
DROPPED_OUT = []
def avail_of(player, g):
    for t in (g['visitor'], g['home']):
        e = INJ[t].get(player)
        if e: return str(e.get('normalized_status')).upper(), e.get('published_at')
    return None, None

# ---------- row builders ----------
ROWS = []; STATS_OUT = collections.Counter()
def uniq(seq):
    seen = []
    for s in seq:
        if s not in seen: seen.append(s)
    return seen
def trunc(s, n=235): return s if len(s) <= n else s[:n - 1] + '…'
def tags(prefix, labs): return f'{prefix}: ' + ', '.join(uniq(labs)) if labs else ''

for g in LIVE:
    gid = g['id']; A, H = g['visitor'], g['home']; bk = BKR[gid]
    # ----- side
    S = side[gid]; sc = {t: len(S['V'].get(t, {})) for t in (A, H)}; so = {t: len(S['O'].get(t, {})) for t in (A, H)}
    if sum(sc.values()) or sum(so.values()):
        verified = sum(sc.values()) > 0
        cnt = sc if verified else so
        top, oth = (A, H) if cnt[A] >= cnt[H] else (H, A)
        if cnt[A] == cnt[H]:
            lean, tier = 'split', 'skip'; top, oth = A, H
        else:
            lean = top
            tier = ('2' if cnt[top] >= 2 and cnt[top] >= 2 * max(cnt[oth], 1) else '2-') if verified else '2- research-only'
        sp, pr_ = bk['spread'][top]
        mkt = f'{top} {fmt(sp)} {px(pr_)}'
        if S['ml'].get(top): mkt += f' / ML {px(bk["ml"][top])}'
        # stale-line check: positive = the current number is worse for the bettor than the number the source quoted
        moved = []
        for lab, lns in (S['V'] if verified else S['O']).get(top, {}).items():
            for ln in lns:
                if ln is not None: moved.append((ln, ln - sp))
        note = ''
        if moved:
            stale_n = sum(1 for _, w in moved if w >= 1.0)
            srcl = '/'.join(sorted({fmt(l) for l, _ in moved}, key=lambda s: float(s)))
            if any(abs(w) >= 0.5 for _, w in moved): note = f' (src {srcl} vs now {fmt(sp)})'
            if lean != 'split' and tier == '2' and stale_n * 2 >= len(moved): tier = '2-'; note += ' line moved'
        parts = [tags('V', list(S['V'].get(top, {}))), tags('RO', list(S['O'].get(top, {})))]
        if S['V'].get(oth) or S['O'].get(oth):
            parts.append('vs ' + oth + ': ' + ', '.join(uniq(list(S['V'].get(oth, {})) + [l + ' (RO)' for l in S['O'].get(oth, {})])))
        if S['tea'].get(top): parts.append('teaser ctx: ' + ', '.join(sorted(S['tea'][top])))
        yts = [f'{sp_} {who}' for sd_, sp_, who in ytside[gid] if sd_ == top]
        if yts: parts.append('YT: ' + '; '.join(yts[:2]))
        src = trunc('; '.join(p for p in parts if p)) + note
        if lean == 'split': mkt = f'{A} {fmt(bk["spread"][A][0])} / {H} {fmt(bk["spread"][H][0])}'
        ROWS.append((gid, mkt, lean, src, tier)); STATS_OUT['side'] += 1
    # ----- total
    T = tot[gid]; tv = {s: len(T['V'].get(s, {})) for s in ('Over', 'Under')}; to = {s: len(T['O'].get(s, {})) for s in ('Over', 'Under')}
    if sum(tv.values()) or sum(to.values()):
        verified = sum(tv.values()) > 0; cnt = tv if verified else to
        tl, op, up = bk['total']
        if cnt['Over'] == cnt['Under']:
            lean, tier, topk = 'split', 'skip', 'Over'
        else:
            topk = 'Over' if cnt['Over'] > cnt['Under'] else 'Under'; lean = topk
            othk = 'Under' if topk == 'Over' else 'Over'
            tier = ('2' if cnt[topk] >= 2 and cnt[topk] >= 2 * max(cnt[othk], 1) else '2-') if verified else '2- research-only'
        pr_ = op if topk == 'Over' else up
        mkt = f"{'O' if topk == 'Over' else 'U'}{tl:g} {px(pr_)}"
        lns = [l for lab, ls in (T['V'] if verified else T['O']).get(topk, {}).items() for l in ls if l is not None]
        note = ''
        if lns:
            worse = [(tl - l) if topk == 'Over' else (l - tl) for l in lns]   # positive = current number is worse for the bettor
            if any(abs(w) >= 0.5 for w in worse): note = f" (src {'/'.join(sorted({f'{l:g}' for l in lns}, key=float))} vs now {tl:g})"
            if lean != 'split' and tier == '2' and sum(1 for w in worse if w >= 1.0) * 2 >= len(worse): tier = '2-'; note += ' line moved'
        oth = 'Under' if topk == 'Over' else 'Over'
        parts = [tags('V', list(T['V'].get(topk, {}))), tags('RO', list(T['O'].get(topk, {})))]
        if T['V'].get(oth) or T['O'].get(oth):
            parts.append('vs ' + oth + ': ' + ', '.join(uniq(list(T['V'].get(oth, {})) + [l + ' (RO)' for l in T['O'].get(oth, {})])))
        yts = [f'{sp_} {who}' for sd_, sp_, who in ytside[gid] if sd_ == topk]
        if yts: parts.append('YT: ' + '; '.join(yts[:2]))
        if lean == 'split': mkt = f'total {tl:g} (O {px(op)} / U {px(up)})'
        ROWS.append((gid, mkt, lean, trunc('; '.join(p for p in parts if p)) + note, tier)); STATS_OUT['total'] += 1
    # ----- props
    cands = []
    for (pg, player, stat), recs in props.items():
        if pg != gid: continue
        def lab_set(rs, cl): return uniq([r['label'] for r in rs if r['cls'] in cl])
        # a candidate = one side + one line cluster (lines more than 1.0 apart are different markets and never corroborate each other)
        clusters = []
        for sd_ in sorted({r['side'] for r in recs}):
            srs = sorted([r for r in recs if r['side'] == sd_], key=lambda r: (r['line'] is None, r['line'] or 0))
            cur = []
            for r in srs:
                if cur and ((r['line'] is None) != (cur[-1]['line'] is None) or (r['line'] is not None and r['line'] - cur[-1]['line'] > 1.0)):
                    clusters.append((sd_, cur)); cur = []
                cur.append(r)
            if cur: clusters.append((sd_, cur))
        for sd_, rs in clusters:
            nV = len(lab_set(rs, 'V')); nS = len(lab_set(rs, 'VYP')); nR = len(lab_set(rs, 'RO'))
            cody = any(r['label'] == 'Cody Brown' for r in rs); best = any(r['best'] for r in rs)
            keep = nS >= 2 or (nV >= 1 and best) or cody or (nR >= 1 and nS >= 1)
            if not keep: continue
            lns_ = [r['line'] for r in rs if r['line'] is not None]
            conflict = sd_ != 'Yes' and any(o_sd != sd_ and any(r2['line'] is None or not lns_ or abs(r2['line'] - lns_[0]) <= 1.0 for r2 in o_rs)
                                            for o_sd, o_rs in [(k, [r for r in recs if r['side'] == k]) for k in {r['side'] for r in recs}])
            cands.append((cody, -nV, -nS, player, stat, sd_, rs, nV, nS, nR, conflict))
    cands.sort(key=lambda c: (c[0], c[1], c[2], c[3]))
    main = [c for c in cands if not c[0]][:6]; cb = [c for c in cands if c[0]]
    STATS_OUT['prop_omitted'] += len([c for c in cands if not c[0]]) - len(main)
    for (cody, _a, _b, player, stat, sd, rs, nV, nS, nR, conflict) in main + cb:
        a_st, a_pub = avail_of(player, g)
        if a_st and re.match(r'^(OUT|DOUBTFUL)', a_st):
            DROPPED_OUT.append(f'{gid} {player} ({a_st}, {str(a_pub)[:16]}Z)'); continue
        lines =[r['line'] for r in rs if r['line'] is not None]
        ln = max(set(lines), key=lines.count) if lines else None
        prices = [r['price'] for r in rs if r['price'] is not None and (ln is None or r['line'] in (ln, None))]   # price must belong to the displayed line
        if stat in ('ATD', 'FTD'):
            mkt = f"{player} {'ATD' if stat == 'ATD' else '1st TD'}" + (f' {prices[0]:+d}' if prices else '')
        elif re.search(r'\d\+$', stat):
            mkt = f'{player} {stat.rsplit(" ", 1)[0]} {stat.rsplit(" ", 1)[1]}' + (f' {prices[0]:+d}' if prices else '')
        elif ln is not None:
            mkt = f"{player} {'o' if sd == 'Over' else 'u'}{ln:g} {stat}" + (f' {prices[0]:+d}' if prices else '')
        else:
            mkt = f'{player} {stat} {sd} (line n/a)' + (f' {prices[0]:+d}' if prices else '')
        labs = [tags('V', [r['label'] for r in rs if r['cls'] == 'V']), tags('YT/PI', [r['label'] for r in rs if r['cls'] in 'YP']), tags('RO', [r['label'] for r in rs if r['cls'] == 'RO'])]
        extra = []
        if len(set(lines)) > 1: extra.append('src lines ' + '/'.join(f'{l:g}' for l in sorted(set(lines))))
        if len(set(prices)) > 1: extra.append('src prices ' + '/'.join(f'{p:+d}' for p in sorted(set(prices))))
        if stat not in ('ATD', 'FTD') and not prices: extra.append('no source price')
        extra.append('src px not BKR')
        if a_st: extra.append(f'{a_st} per availability feed {str(a_pub)[:16]}Z')
        if conflict:
            lean, tier = 'split', 'skip'; extra.append('opposite side also sourced')
        else:
            lean = sd
            tier = '2' if nV >= 2 else '2-' if nV == 1 else '2- research-only'
        ROWS.append((gid, mkt, lean, trunc(clean('; '.join(p for p in labs if p)) + '; ' + '; '.join(extra)), tier))
        STATS_OUT['prop'] += 1

# ---------- lines check (display only; no pipes) ----------
chk = []
for g in LIVE:
    gid = g['id']; bk = BKR[gid]; hs = bk['spread'][g['home']][0]
    sched_h = g.get('spread'); sched_t = g.get('total')
    d = []
    if sched_h is not None and sched_h != hs: d.append(f"schedule.json {g['home']} {fmt(sched_h)} (home line, 10/06) vs BKR {fmt(hs)}")
    if sched_t is not None and sched_t != bk['total'][0]: d.append(f"total {sched_t:g} vs BKR {bk['total'][0]:g}")
    if d: chk.append(f"- {gid}: " + '; '.join(d))

out = []
out.append(f'# Week 5 synthesis digest — {STAMP} (regenerated; supersedes the 07:10 digest)')
out.append(f'Built by scratch/build-w05-digest.py (rerunnable). Scope: {len(LIVE)} remaining games; excluded as final: {", ".join(DONE) or "none"}. Research digest only: not a card, ticket, recommendation or official record.')
out.append(f"Inputs: w05-pull.json (pulled {pull['pulled_at']}, window start {pull['window_start']}, signals {len(pull['signals'])}, expert {len(pull['expert'])}); w05-expert-verified.json (generated {ver['generated_at']}; verified {ver['counts']['verified']}, reject {ver['counts']['reject']}, not_pick {ver['counts']['not_pick']}; {len(VROWS)} verified rows on remaining games); "
           f"youtube-extracted-picks-2026-w05.json ({len(yt['picks'])} picks, status {yt['status']}); player-props-intel-latest.json ({len(pi['props'])} props, generated {pi['generated_at']}); w05-article-gemini-picks.json ({len(GEM_ROWS)} rows, provenance only).")
out.append('Tiers (WEEKLY_SYNTHESIS §6): no tier 1 is assigned here, because matchup/projection inputs were not part of this pull. 2 = two or more independent verified named sources and a clear margin; 2- = single source, contested, or source line moved >= 1 pt against the current number; skip = split.')
out.append('research-only = not verifier-verified: Gemini article picks and Cody Brown email rows (paraphrased rationales, no verbatim quote), plus rows with no quote. They never set a tier above "2- research-only". YT (YouTube, pending Andy review) and PI (props-intel articles) are corroboration tags only and never set the tier.')
out.append('Numbers: market cells use the BKR 10/10 user-provided display board (no capture time; not an executable offer). Prop lines and prices are copied from the cited source and are NOT BKR prices. schedule.json spread is the HOME team line and dates from 10/06; it is not used for current numbers.')
if chk:
    out.append('Lines check (schedule.json vs BKR board):'); out += chk
if DROPPED_OUT: out.append('Prop rows dropped because the availability feed has the player OUT/DOUBTFUL: ' + '; '.join(DROPPED_OUT))
out.append('Tags: V = verified named source; RO = research-only; YT = YouTube; PI = props-intel article. "src X vs now Y" = the source quoted a different number than the current board.')
out.append('')
out.append('game | market | lean | source | tier')
for r in ROWS: out.append(' | '.join(clean(c) for c in r))
out.append('')
out.append(f"Row counts: side {STATS_OUT['side']}, total {STATS_OUT['total']}, prop {STATS_OUT['prop']} (prop candidates beyond the 6/game cap omitted: {STATS_OUT['prop_omitted']}). Unparsed prop selections skipped: {sum(unparsed.values())}. Dropped side/total rows with no resolvable team/side: {len(dropped)}.")
(ROOT / 'scratch/w05-synthesis-digest-sat.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
print('\n'.join(out[:14])); print('...'); print(dict(STATS_OUT), 'dropped', dropped[:5], 'unparsed', list(unparsed.items())[:12])
