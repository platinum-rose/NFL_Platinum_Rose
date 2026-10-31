"""SuperContest report v4 layout pieces (Andy, 2026-10-31).

Plain-English proposal tiles, bulleted Pitch/Pushback with footnote links, spread
splits bars, experts for/against with short quotes, Master-style game cards with a
filter/sort grid, and filters for the Experts tab. build.py supplies the data; this
module only renders HTML. Every free-text line from an expert, narrative or trend is
screened with check_sc_report.FORBIDDEN, so the spread-only gate keeps passing.
"""
import html
import re

try:
    from check_sc_report import FORBIDDEN
except Exception:  # pragma: no cover
    FORBIDDEN = []


def H(s):
    return html.escape(str(s if s is not None else ''), quote=True)


def spread_safe(text):
    t = str(text or '')
    return not any(re.search(p, t) for p, _ in FORBIDDEN)


def sents(text):
    t = re.sub(r'\s+', ' ', str(text or '')).strip()
    if not t:
        return []
    t = re.sub(r'\b((?:[A-Z]\.){2,})', lambda m: m.group(1).replace('.', '\x01'), t)
    for ab in ('Jr.', 'Sr.', 'vs.', 'St.', 'No.', 'Mr.', 'Dr.', 'Inc.', 'approx.'):
        t = t.replace(ab + ' ', ab.replace('.', '\x01') + ' ')
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9(“"\'])', t)
    return [p.replace('\x01', '.').strip() for p in parts if p.strip()]


def safe_sents(text):
    return [s for s in sents(text) if spread_safe(s)]


def md_b(s):
    """Escape, then turn **bold** / _em_ into tags."""
    s = H(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    return re.sub(r'(?<![*\w])_(.+?)_(?![*\w])', r'<em>\1</em>', s)


def short_quote(text, limit=230):
    """Up to two spread-safe sentences, trimmed to about `limit` characters."""
    out = ''
    taken = 0
    for s in safe_sents(text):
        if len(out) + len(s) + 1 > limit:
            if not out:
                cut = s[:limit].rsplit(' ', 1)[0]
                out = cut.rstrip(',;:') + '…'
            break
        out = (out + ' ' + s).strip()
        taken += 1
        if taken >= 2:
            break
    return out


def ln(v):
    """Spread with a real minus sign: -10.5 -> '−10.5', 3 -> '+3', 0 -> 'PK'."""
    if v is None:
        return '—'
    v = float(v)
    if v == 0:
        return 'PK'
    return ('%+g' % v).replace('-', '−')


def pts(v, signed=True):
    if v is None:
        return '—'
    s = ('%+.1f' % v) if signed else ('%.1f' % v)
    if s.endswith('.0'):
        s = s[:-2]
    return s.replace('-', '−')


def cover_rule(team, lc):
    n = abs(float(lc))
    whole = n == int(n)
    n_i = int(n)
    if lc < 0:
        if not whole:
            return f'{team} must win by {n_i + 1} or more'
        return f'{team} must win by {n_i + 1}+ (winning by exactly {n_i} is a push)'
    if lc > 0:
        if not whole:
            return f'{team} covers if it wins, or loses by {n_i} or fewer'
        return f'{team} covers if it wins, or loses by {n_i - 1} or fewer (losing by {n_i} is a push)'
    return f'{team} just has to win (a tie is a push)'


def _tile(label, value, sub, tip, tone=''):
    return (f'<div class="sc4-tile {tone}" title="{H(tip)}" tabindex="0"><div class="sc4-tl">{H(label)}</div>'
            f'<div class="sc4-tv">{value}</div><div class="sc4-ts">{sub}</div></div>')


def _tone(v):
    if v is None:
        return ''
    return 'pos' if v > 0 else ('neg' if v < 0 else '')


def _plural(v):
    return '' if abs(v) == 1 else 's'


def plain_summary(z):
    """One plain-English sentence ahead of the tiles."""
    side, lc, marg, cush, val = z['side'], z['lc'], z.get('marg'), z.get('cush'), z.get('val')
    bits = []
    if marg is not None:
        if marg > 0:
            res = f'we project {side} to win by {pts(marg, False)}'
        elif marg < 0:
            res = f'we project {side} to lose by {pts(-marg, False)}'
        else:
            res = 'we project a tie'
        if cush is not None:
            if cush > 0:
                res += f', which clears the contest line of {side} {ln(lc)} by {pts(cush, False)} point{_plural(cush)}'
            elif cush < 0:
                res += f', which falls {pts(-cush, False)} point{_plural(cush)} short of covering {side} {ln(lc)}'
            else:
                res += f', which lands exactly on {side} {ln(lc)}'
        bits.append(res)
    if val is not None and z.get('lm') is not None:
        if val > 0:
            bits.append(f'the contest number is {pts(val, False)} point{_plural(val)} better for us than the sportsbook’s {side} {ln(z["lm"])}')
        elif val < 0:
            bits.append(f'the contest number is {pts(-val, False)} point{_plural(val)} worse than the sportsbook’s {side} {ln(z["lm"])}')
        else:
            bits.append('the contest number matches the sportsbook')
    if not bits:
        return ''
    txt = '; '.join(bits)
    return f'<div class="sc4-plain"><b>In plain English:</b> {H(txt[0].upper() + txt[1:])}.</div>'


def stat_tiles(z, nf, na, proj, tl):
    side, opp, lc, lm = z['side'], z['opp'], z['lc'], z.get('lm')
    val, key, marg, cush, price = z.get('val'), z.get('key') or '', z.get('marg'), z.get('cush'), z.get('lm_price')
    t = []
    t.append(_tile('Contest line', f'{tl(side)}{H(side)} {ln(lc)}', H(cover_rule(side, lc)),
                   'The SuperContest’s own spread, locked for the whole week. The pick is graded against this number.'))
    mk = f'{H(side)} {ln(lm)}' + (f' <small>({price:+d})</small>' if (lm is not None and price is not None) else '')
    t.append(_tile('Sportsbook now', mk, 'Bookmaker, latest capture',
                   'Where the betting market has this side right now. Comparing it with the contest line shows whether the contest is giving us a better or worse number.'))
    if val is None:
        vsub = 'no sportsbook line to compare'
    elif val > 0:
        vsub = f'the contest gives us {pts(val, False)} more point{_plural(val)} than the sportsbook'
    elif val < 0:
        vsub = f'the contest line is {pts(-val, False)} point{_plural(val)} worse than the sportsbook'
    else:
        vsub = 'same number as the sportsbook'
    if key:
        vsub += f' · {key}'
    t.append(_tile('Line value', (pts(val) + ' pts') if val is not None else '—', H(vsub),
                   'Contest line minus sportsbook line, in points. Positive means the contest is the better deal. Crossing 3 or 7 matters most because games land on those margins most often.',
                   _tone(val)))
    if marg is None:
        mv, msub = '—', 'no projection saved'
    else:
        mv = (f'{H(side)} by {pts(marg, False)}' if marg > 0 else (f'{H(opp)} by {pts(-marg, False)}' if marg < 0 else 'Tie'))
        msub = H(f'projected score {proj}') if proj else 'Platinum Rose projection'
    t.append(_tile('Our projected result', mv, msub,
                   'Our written projection of the final margin (an analyst estimate, not a computer model).'))
    if cush is None:
        csub = 'needs a projection'
    elif cush > 0:
        csub = f'our projection beats the contest line by {pts(cush, False)}'
    elif cush < 0:
        csub = f'our projection falls {pts(-cush, False)} short of covering'
    else:
        csub = 'our projection lands exactly on the line'
    t.append(_tile('Room to cover', (pts(cush) + ' pts') if cush is not None else '—', H(csub),
                   'Projected margin compared with the contest line. Bigger positive room means more cushion if the game goes a little differently than expected.',
                   _tone(cush)))
    tot = max(nf + na, 1)
    bar = f'<div class="sc4-xbar" aria-hidden="true"><i style="width:{nf / tot * 100:.0f}%"></i></div>' if (nf or na) else ''
    t.append(_tile('Experts on the spread', f'{nf} for · {na} against',
                   f'named experts who took a side in this game{bar}',
                   'How many named experts picked this side versus the other side. Agreement is a tiebreaker, not a reason on its own.',
                   'pos' if nf > na else ('neg' if na > nf else '')))
    return '<div class="sc4-tiles">' + ''.join(t) + '</div>'


def thesis_bullets(items, prefix):
    """Each saved paragraph becomes a bold headline bullet with its detail beneath; source refs become footnote links."""
    out = ['<ul class="sc4-bul">']
    for it in items:
        refs = it.get('ref')
        refs = refs if isinstance(refs, list) else ([refs] if refs is not None else [])
        fn = ''.join(f'<sup class="sc4-fn"><a href="#{H(prefix)}-source-{H(r)}" title="Source {H(r)}">[{H(r)}]</a></sup>' for r in refs)
        ss = sents(it.get('text', ''))
        if not ss:
            continue
        if len(ss) == 1:
            out.append(f'<li><b>{md_b(ss[0])}</b>{fn}</li>')
            continue
        last = len(ss) - 2
        rest = ''.join(f'<li>{md_b(s)}{fn if i == last else ""}</li>' for i, s in enumerate(ss[1:]))
        out.append(f'<li><b>{md_b(ss[0])}</b><ul>{rest}</ul></li>')
    out.append('</ul>')
    return ''.join(out)


def splits_block(a, h, home, spl, tl, when=''):
    """Spread-only bets/money bars for both sides; side a is shown first and read out."""
    hb, hm = spl.get('spread_home_bettors'), spl.get('spread_home_money')
    if not (hb or hm):
        return ''
    hb, hm = float(hb or 0), float(hm or 0)

    def share(team):
        return (hb, hm) if team == home else (100 - hb, 100 - hm)

    def side(team):
        b, m = share(team)
        flag = ' \U0001F4B0' if (m - b) >= 15 else ''
        return (f'<div class="sp-side"><div class="sp-name">{tl(team)}{H(team)}{flag}</div>'
                f'<div class="sp-row bets"><span class="sp-lab">Bets</span><span class="sp-bar"><i style="width:{b:.0f}%"></i></span><b>{b:.0f}%</b></div>'
                f'<div class="sp-row money"><span class="sp-lab">Money</span><span class="sp-bar"><i style="width:{m:.0f}%"></i></span><b>{m:.0f}%</b></div></div>')
    b, m = share(a)
    gap = m - b
    if abs(gap) < 5:
        read = f'Bets and money are roughly balanced on {a} ({b:.0f}% of bets, {m:.0f}% of money), so the splits give no strong signal.'
    elif gap > 0:
        read = f'{a} draws {m:.0f}% of the money on {b:.0f}% of the bets: the average bet on {a} is bigger, which can point to larger bettors on {a}.'
    else:
        read = f'{a} draws only {m:.0f}% of the money on {b:.0f}% of the bets: the average bet on {h} is bigger, which can point to larger bettors on {h}.'
    big = ' \U0001F4B0 = money share beats bet share by 15+ points.' if abs(gap) >= 15 else ''
    return (f'<div class="sc4-splits"><div class="sc4-sp-head">\U0001F4CA <b>Spread betting splits</b> <span>Action Network{(", " + H(when)) if when else ""}</span></div>'
            f'<div class="sp-legend"><span><i class="sp-k bets"></i>% of bets</span><span><i class="sp-k money"></i>% of money</span></div>'
            f'<div class="sc4-sp-cols">{side(a)}{side(h)}</div><div class="sc4-sp-read">{H(read)}{big} Splits describe where the action is, not who is right.</div></div>')


def _num(v):
    try:
        f = float(v)
        return f if abs(f) < 40 else None
    except Exception:
        return None


SHOW_TAG = ' (show pick, host not named)'


def _show_name(show):
    return re.split(r'\s+[—–-]\s+', str(show or ''))[0].strip()


def show_hosts(exp, yt):
    """{outlet_lower: {host names}} for shows whose rows name more than one person."""
    hosts = {}
    for rows in exp.values():
        for r in rows:
            e, o = str(r.get('expert') or '').strip(), str(r.get('outlet') or '').strip()
            if e and o and e.lower() != o.lower():
                hosts.setdefault(o.lower(), set()).add(e)
    for rows in yt.values():
        for p in rows:
            s, sp = _show_name(p.get('show')), str(p.get('speaker') or '').strip()
            if s and sp and sp.lower() != s.lower():
                hosts.setdefault(s.lower(), set()).add(sp)
    return {k: v for k, v in hosts.items() if len(v) >= 2}


def named_host(text, hosts):
    """The single host whose full or first name appears in the text, else None."""
    t = str(text or '')
    hit = {h for h in hosts if re.search(r'\b(' + re.escape(h) + '|' + re.escape(h.split()[0]) + r')\b', t)}
    return next(iter(hit)) if len(hit) == 1 else None


def attribute_show_rows(exp, yt, vrows, teams_in, games):
    """Andy 2026-10-31. A feed row saved under a multi-host show's own name is credited to the host the verifier or
    its reasoning names; otherwise it is kept aside as a show pick (listed, never counted as an expert). A row filed
    under one host whose reasoning names only the other host is moved to that host.
    Returns (exp_by_game, show_picks_by_game, changes, hosts)."""
    hosts = show_hosts(exp, yt)
    vmap = {}
    for x in vrows or []:
        ps = x.get('persons') or []
        if ps and x.get('outlet'):
            vmap[(str(x['outlet']).lower(), x.get('game'), x.get('side'), _num(x.get('line')))] = ps[0]
    out, shows, changes = {}, {}, []
    for gid, rows in exp.items():
        g = games.get(gid) or {}
        tm_all = {g.get('visitor'), g.get('home')}
        keep = []
        for r in rows:
            e, o = str(r.get('expert') or '').strip(), str(r.get('outlet') or '').strip()
            hs = hosts.get(o.lower())
            if not hs:
                keep.append(r)
                continue
            tm = teams_in(str(r.get('selection') or '')) & tm_all
            side = next(iter(tm)) if len(tm) == 1 else None
            said = named_host(r.get('rationale'), hs)
            pick = f"{gid} {r.get('selection')} {r.get('line') if r.get('line') is not None else ''}".strip()
            if e.lower() == o.lower():
                person = vmap.get((o.lower(), gid, side, _num(r.get('line')))) or said
                if person:
                    keep.append(dict(r, expert=person))
                    changes.append(f'{o}: {pick} credited to {person}')
                else:
                    shows.setdefault(gid, []).append(dict(r, expert=o + SHOW_TAG, show_level=True))
                    changes.append(f'{o}: {pick} kept as a show pick (no host named)')
            elif said and said != e:
                keep.append(dict(r, expert=said))
                changes.append(f'{o}: {pick} moved from {e} to {said} (the reasoning names {said})')
            else:
                keep.append(r)
        out[gid] = keep
    return out, shows, changes, hosts


def collect_opinions(gid, a, h, vrows, yt_rows, exp_rows, teams_in, ref=None, hosts=None, show_rows=None):
    """Every named spread opinion on this game: name, outlet, side, line, short quote, url.
    ref = {team: contest line}; a cited line more than 6 points away is another game's number and is dropped."""
    found = {}

    def add(name, outlet, side, line, quote, url):
        if side not in (a, h) or not name:
            return
        lv = _num(line)
        if ref and lv is not None and ref.get(side) is not None and abs(lv - ref[side]) > 6:
            return
        k = (str(name).strip().lower(), side)
        q = short_quote(quote)
        cur = found.get(k)
        if cur:
            if not cur['quote'] and q:
                cur['quote'] = q
            if cur['line'] is None and _num(line) is not None:
                cur['line'] = _num(line)
            if not cur['url'] and url:
                cur['url'] = url
            return
        found[k] = dict(name=str(name).strip(), outlet=str(outlet or '').strip(), side=side, line=_num(line), quote=q, url=url or '')

    shows = []
    for x in vrows or []:
        if x.get('game') != gid or x.get('market') not in ('spread', 'contest'):
            continue
        ps = x.get('persons') or []
        hs = (hosts or {}).get(str(x.get('outlet') or '').lower())
        if not ps and hs:
            said = named_host(x.get('quote'), hs)
            if said:
                add(said, x.get('outlet'), x.get('side'), x.get('line'), x.get('quote'), x.get('url'))
            elif x.get('side') in (a, h):
                shows.append(dict(name=str(x.get('outlet')) + SHOW_TAG, outlet='', side=x.get('side'), line=_num(x.get('line')),
                                  quote=short_quote(x.get('quote')), url=x.get('url') or '', show_level=True))
            continue
        name = ps[0] if ps else x.get('outlet')
        add(name, x.get('outlet') if ps else '', x.get('side'), x.get('line'), x.get('quote'), x.get('url'))
    for p in yt_rows or []:
        if str(p.get('market') or '').lower() != 'spread':
            continue
        side = p.get('team') if p.get('team') in (a, h) else None
        if not side:
            tm = teams_in(str(p.get('pick') or '')) & {a, h}
            side = next(iter(tm)) if len(tm) == 1 else None
        show = re.split(r'\s+[—–-]\s+', str(p.get('show') or ''))[0].strip()
        raw = p.get('raw') or {}
        add(p.get('speaker'), show, side, raw.get('line') if isinstance(raw, dict) else None,
            p.get('quote') or p.get('rationale'), p.get('timestamp_url'))
    for r in exp_rows or []:
        if r.get('pick_type') != 'spread':
            continue
        tm = teams_in(str(r.get('selection') or '')) & {a, h}
        if len(tm) != 1:
            continue
        add(r.get('expert'), r.get('outlet') or r.get('source') or '', next(iter(tm)), r.get('line'), r.get('rationale'), r.get('url') or r.get('source_url'))
    for r in show_rows or []:
        if r.get('pick_type') != 'spread':
            continue
        tm = teams_in(str(r.get('selection') or '')) & {a, h}
        if len(tm) != 1 or any(s['side'] == next(iter(tm)) and s['name'] == r['expert'] for s in shows):
            continue
        shows.append(dict(name=r['expert'], outlet='', side=next(iter(tm)), line=_num(r.get('line')), quote=short_quote(r.get('rationale')),
                          url=r.get('url') or '', show_level=True))
    return list(found.values()) + shows


def experts_block(side, opp, ops, tl, title_for=None, title_against=None):
    sh = [o for o in ops if o.get('show_level') and o['side'] in (side, opp)]
    ops = [o for o in ops if not o.get('show_level')]
    fr = sorted([o for o in ops if o['side'] == side], key=lambda o: (not o['quote'], o['name'].lower()))
    ag = sorted([o for o in ops if o['side'] == opp], key=lambda o: (not o['quote'], o['name'].lower()))

    def li(o):
        bits = []
        if o['outlet'] and o['outlet'].lower() != o['name'].lower():
            bits.append(H(o['outlet']))
        if o['line'] is not None:
            bits.append(f'took {H(o["side"])} {ln(o["line"])}')
        meta = ' · '.join(bits)
        link = (f' <a class="sc4-ext" href="{H(o["url"])}" target="_blank" rel="noopener noreferrer" title="Open the source">source ↗</a>' if o['url'] else '')
        q = (f'<div class="sc4-q">“{H(o["quote"])}”</div>' if o['quote']
             else '<div class="sc4-q sc4-noq">No spread reasoning was captured with this pick.</div>')
        return f'<li><b>{H(o["name"])}</b>' + (f' <span class="gp-src">· {meta}</span>' if meta else '') + link + q + '</li>'
    nf, na = len(fr), len(ag)
    tot = max(nf + na, 1)
    lf = title_for or f'For {side}'
    la = title_against or f'For {opp} (against)'
    none = '<li class="gp-none">No named expert on this side</li>'
    return (f'<div class="sent sc4-x"><div class="sent-head"><span><b>{nf}</b> {H(lf)}</span>'
            f'<span class="sent-bar" title="{nf} vs {na}"><i style="width:{nf / tot * 100:.0f}%"></i></span><span>{H(la)} <b>{na}</b></span></div>'
            f'<div class="sent-cols"><div><div class="sent-col-t">{tl(side)}{H(lf)}</div><ul class="gp-list">{"".join(li(o) for o in fr) or none}</ul></div>'
            f'<div><div class="sent-col-t">{tl(opp)}{H(la)}</div><ul class="gp-list">{"".join(li(o) for o in ag) or none}</ul></div></div>'
            + (f'<div class="sent-other sc4-shows"><div class="sent-col-t">Show picks with no named host (listed, not counted)</div><ul class="gp-list">{"".join(li(o) for o in sh)}</ul></div>' if sh else '')
            + '</div>')


def game_header(a, h, rows, tl, full_name):
    def big(t):
        return f'<div class="gh-team"><span class="tl tl-{H(t.lower())} tl-xl" title="{H(full_name(t))}"></span><b>{H(t)}</b><small>{H(full_name(t))}</small></div>'
    body = ''.join(f'<tr><th>{H(lbl)}</th><td>{va}</td><td>{vh}</td></tr>' for lbl, va, vh in rows)
    tbl = f'<table class="mkt-lines"><thead><tr><th></th><th>{H(a)}</th><th>{H(h)}</th></tr></thead><tbody>{body}</tbody></table>'
    return f'<div class="gh">{big(a)}<div class="gh-mid">{tbl}</div>{big(h)}</div>'


def game_header4(a, h, info, ranks, links, n_sides, tl, full_name, proj_html=''):
    """Logo header: contest/market lines under each logo; center = ranking + jump links.
    info: {team: [(label, value_html)]}; ranks: [dict(team, rank, score, conf, status)]; links: [(label, href)]."""
    def team(t):
        ls = ''.join(f'<div class="sc4-ghl"><span>{H(k)}</span><b>{v}</b></div>' for k, v in info.get(t, []))
        return (f'<div class="gh-team sc4-ght"><span class="tl tl-{H(t.lower())} tl-xl" title="{H(full_name(t))}"></span><b>{H(t)}</b>'
                f'<small>{H(full_name(t))}</small><div class="sc4-ghls">{ls}</div></div>')
    rk = ''
    for r in ranks:
        rank = f'#{r["rank"]}' + (f' <small>of {n_sides}</small>' if n_sides else '') if r.get('rank') not in (None, '') else '—'
        score = f'<span class="sc4-rk-s" title="Contest score: room + line value + experts + big money + key numbers. It ranks sides against each other; it is not a win chance.">score {r["score"]:.1f}</span>' if r.get('score') is not None else ''
        conf = f'<span class="sc4-rk-c" title="Confidence: the Friday matchup synthesis grade for this side at the contest number (A best, C lowest playable), with its saved cover estimate. Stars rank our picks against each other; they are not a win chance on their own.">{H(r["conf"])}</span>' if r.get('conf') else ''
        st = f'<span class="sc4-rk-st">{H(r["status"])}</span>' if r.get('status') else ''
        rk += (f'<div class="sc4-rk{" pick" if r.get("status") else ""}"><span class="sc4-rk-t">{tl(r["team"])}{H(r["team"])}</span>'
               f'<span class="sc4-rk-n">{rank}</span>{score}{conf}{st}</div>')
    lk = ''.join(f'<a href="{H(href)}">{H(lbl)}</a>' for lbl, href in links)
    pj = (f'<div class="sc4-ghc-t">Projected score</div><div class="sc4-pj" title="Our written projection of the final score (an analyst estimate, not a computer model)">{proj_html}</div>'
          if proj_html else '')
    center = (f'<div class="gh-mid sc4-ghc">{pj}<div class="sc4-ghc-t">Contest ranking</div>{rk}'
              f'<div class="sc4-ghc-t">Jump to</div><div class="sc4-links">{lk}</div></div>')
    return f'<div class="gh sc4-gh">{team(a)}{center}{team(h)}</div>'


ICONS = {'game script': '\U0001F4D6', 'why the card leans this way': '\U0001F9E0', 'what breaks it': '⚠️'}


def narrative_box(proj_html, ctx, move, secs):
    """secs: [(title, text)]; only spread-safe sentences are kept."""
    out = ['<div class="sc4-nar">']
    if proj_html:
        out.append(f'<div class="sc4-proj">\U0001F3AF {proj_html}</div>')
    if ctx:
        out.append(f'<div class="sc4-ctx">{H(ctx)}</div>')
    if move:
        out.append(f'<div class="sc4-ctx">\U0001F4C8 <b>Spread movement:</b> {H(move)}</div>')
    kept = 0
    for title, body in secs:
        ss = safe_sents(' '.join(str(body or '').split('\n')))
        if not ss:
            continue
        kept += 1
        out.append(f'<div class="sc4-sec">{ICONS.get(str(title).lower(), "&bull;")} {H(title)}</div>')
        out.append('<ul class="gs-list">' + ''.join(f'<li>{md_b(s)}</li>' for s in ss) + '</ul>')
    if not kept and not proj_html:
        return ''
    out.append('</div>')
    return ''.join(out)


def gg_card(box_id, cat, day, kick, rank, val, room, when, tag, teams_html, line, stats):
    return (f'<a class="gg-card sc4-card cat-{H(cat)}" href="#{H(box_id)}" data-box="{H(box_id)}" data-cat="{H(cat)}" data-day="{H(day)}" '
            f'data-kick="{kick}" data-rank="{rank}" data-val="{val}" data-room="{room}">'
            f'<div class="gg-top"><span>{H(when)}</span><span class="sc4-tag">{tag}</span></div>'
            f'<div class="gg-teams">{teams_html}</div><div class="gg-line">{line}</div><div class="sc4-stats">{stats}</div></a>')


def gg_bar(grid_id, days, cards, counts):
    cat = [('all', 'All games'), ('five', '⭐ AI picks'), ('alt', '\U0001F501 Alternates'), ('picks', 'Picks + alternates'), ('none', '➖ Not recommended')]
    if counts.get('final'):
        cat.append(('final', '\U0001F3C1 Already played'))
    chips = ''.join(f'<button type="button" class="gg-chip{" active" if k == "all" else ""}" data-group="cat" data-f="{k}">{H(lbl)}'
                    + (f' <small>({counts.get(k, 0)})</small>' if k != 'all' else '') + '</button>' for k, lbl in cat)
    dchips = '<button type="button" class="gg-chip active" data-group="day" data-f="all">Every day</button>' + ''.join(
        f'<button type="button" class="gg-chip" data-group="day" data-f="{H(d)}">{H(d)}</button>' for d in days)
    sort = ('<label class="gg-sort">Sort <select aria-label="Sort games"><option value="kick">Kickoff</option><option value="rank">Contest rank (best side)</option>'
            '<option value="val">Line value</option><option value="room">Room to cover</option></select></label>')
    return (f'<div class="gg sc4-bar" id="{H(grid_id)}"><div class="gg-bar"><div class="sc4-chips-row" role="group" aria-label="Filter by recommendation">'
            f'<span class="sc4-lbl">Show</span>{chips}</div></div>'
            f'<div class="gg-bar"><div class="sc4-chips-row" role="group" aria-label="Filter by day"><span class="sc4-lbl">Day</span>{dchips}</div>{sort}</div>'
            f'<div class="sc4-count" aria-live="polite"></div><div class="gg-cards">{"".join(cards)}</div>'
            '<p class="gg-note">Tap a game for its full breakdown below. The filters also hide the matching breakdowns. Rank, value and room describe the better side in each game.</p></div>')


def expert_bar(groups):
    """groups: [dict(id, name, n, picks, agree)]."""
    chips = '<button type="button" class="gg-chip active" data-group="show" data-f="all">All shows</button>' + ''.join(
        f'<button type="button" class="gg-chip" data-group="show" data-f="{H(g["id"])}" data-name="{H(g["name"])}" data-n="{g["n"]}" data-picks="{g["picks"]}" data-agree="{g["agree"]}">'
        f'{H(g["name"])} <small>({g["n"]})</small></button>' for g in groups)
    stance = ''.join(f'<button type="button" class="gg-chip{" active" if k == "all" else ""}" data-group="stance" data-f="{k}">{H(lbl)}</button>'
                     for k, lbl in (('all', 'Everyone'), ('agree', 'Agrees with an AI pick'), ('disagree', 'Disagrees with an AI pick')))
    return (f'<div class="gg sc4-bar" id="sc4-xbar"><div class="gg-bar"><div class="sc4-chips-row" role="group" aria-label="Filter by show or network">'
            f'<span class="sc4-lbl">Show / network</span>{chips}</div></div>'
            f'<div class="gg-bar"><div class="sc4-chips-row" role="group" aria-label="Filter by stance"><span class="sc4-lbl">Stance</span>{stance}</div>'
            '<input type="search" class="sc4-search" placeholder="Find an expert or team…" aria-label="Find an expert or team">'
            '<label class="gg-sort">Sort shows <select aria-label="Sort shows"><option value="experts">Most experts</option><option value="picks">Most picks</option>'
            '<option value="agree">Most agreement with AI picks</option><option value="az">A–Z</option></select></label></div>'
            '<div class="sc4-count" aria-live="polite"></div></div>')


SC4_CSS = r'''
/* ===== SuperContest v4 layout (Andy, 2026-10-31) ===== */
.sc4-hide { display: none !important; }
.sc4-plain { margin: 2px 0 10px; padding: 10px 12px; border-left: 4px solid var(--accent); background: rgba(0,210,190,.07); border-radius: 8px; line-height: 1.5; font-size: 14px; }
.sc4-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin: 6px 0 14px; }
.sc4-tile { border: 1px solid var(--border); border-radius: 10px; background: var(--raised); padding: 8px 10px; cursor: help; }
.sc4-tile:focus-visible { outline: 2px solid var(--accent); }
.sc4-tl { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 700; }
.sc4-tv { font-size: 18px; font-weight: 800; color: var(--text); margin: 3px 0 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sc4-tv small { font-size: 12px; color: var(--muted); font-weight: 700; }
.sc4-ts { font-size: 12px; color: var(--muted); line-height: 1.35; }
.sc4-tile.pos .sc4-tv { color: var(--pos); } .sc4-tile.neg .sc4-tv { color: var(--neg); }
.sc4-xbar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: var(--neg); margin-top: 6px; }
.sc4-xbar i { display: block; background: var(--pos); }
.sc4-bul { margin: 4px 0 8px; padding-left: 18px; }
.sc4-bul > li { margin: 8px 0; line-height: 1.5; }
.sc4-bul > li > b { color: var(--text); }
.sc4-bul ul { margin: 4px 0 0; padding-left: 18px; list-style: circle; }
.sc4-bul ul li { margin: 3px 0; color: var(--body); }
.sc4-fn a { font-size: 11px; text-decoration: none; margin-left: 2px; font-weight: 700; }
.sc4-q { font-size: 12.5px; color: var(--body); font-style: italic; margin-top: 4px; line-height: 1.45; }
.sc4-noq { font-style: normal; color: var(--muted); }
.sc4-ext { font-size: 12px; text-decoration: none; margin-left: 4px; }
.sc4-x { margin: 6px 0 12px; }
.sc4-splits { border: 1px solid var(--border); border-radius: 10px; background: var(--raised); padding: 10px 12px; margin: 6px 0 14px; }
.sc4-sp-head { font-size: 13.5px; margin-bottom: 6px; }
.sc4-sp-head span { color: var(--muted); font-size: 12px; margin-left: 4px; }
.sc4-sp-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.sc4-sp-read { font-size: 12.5px; color: var(--body); margin-top: 6px; line-height: 1.45; }
.sc4-nar { border-left: 4px solid var(--accent); background: rgba(0,210,190,.07); padding: 12px 16px; border-radius: 8px; margin: 4px 0 16px; }
.sc4-proj { font-size: 1.08rem; font-weight: 700; margin-bottom: 4px; color: var(--text); }
.sc4-ctx { font-size: .86rem; opacity: .9; margin-bottom: 8px; }
.sc4-sec { font-weight: 700; margin-top: 10px; color: var(--text); }
.sc4-bar { margin: 6px 0 14px; }
.sc4-chips-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.sc4-chips-row .gg-chip small { font-weight: 600; opacity: .8; }
.sc4-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 700; margin-right: 4px; }
.sc4-count { font-size: 12px; color: var(--muted); margin: 0 0 8px; }
.sc4-search { min-height: 40px; padding: 0 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--raised); color: var(--text); font: inherit; min-width: 220px; flex: 1; max-width: 360px; }
.sc4-card .sc4-tag { font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: var(--raised); border: 1px solid var(--border); color: var(--text); }
.sc4-card.cat-five { border-color: var(--accent); }
.sc4-card.cat-five .sc4-tag { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.sc4-card.cat-alt .sc4-tag { border-color: var(--info); color: var(--info); }
.sc4-stats { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: var(--muted); }
.sc4-stats b { color: var(--text); }
.sc4-ght { min-width: 130px; }
.sc4-role { display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; padding: 0 5px; border-radius: 4px; border: 1px solid var(--border); color: var(--muted); vertical-align: middle; }
.sc4-role.sc4-fav { color: var(--warn); border-color: var(--warn); }
.sc4-role.sc4-dog { color: var(--info); border-color: var(--info); }
.sc4-ghls { margin-top: 8px; display: grid; gap: 3px; font-size: 12.5px; width: 100%; }
.sc4-ghl { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); }
.sc4-ghl b { color: var(--text); font-size: 13.5px; }
.sc4-ghl .pos { color: var(--pos); } .sc4-ghl .neg { color: var(--neg); }
.sc4-ghc { display: flex; flex-direction: column; gap: 6px; max-width: 440px; width: 100%; margin: 0 auto; }
.sc4-ghc-t { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 700; margin-top: 2px; }
.sc4-rk { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--raised); font-size: 12.5px; }
.sc4-rk.pick { border-color: var(--accent); }
.sc4-rk-t { font-weight: 800; color: var(--text); }
.sc4-rk-n { font-weight: 800; color: var(--text); } .sc4-rk-n small { font-weight: 600; color: var(--muted); }
.sc4-rk-s { color: var(--muted); } .sc4-rk-c { color: var(--star); letter-spacing: 1px; }
.sc4-rk-st { margin-left: auto; font-weight: 800; color: var(--accent); }
.sc4-links { display: flex; flex-wrap: wrap; gap: 6px; }
.sc4-pj { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; font-size: 26px; font-weight: 800; color: var(--text); line-height: 1.2; padding: 6px 0 4px; text-align: center; }
.sc4-pj .tl { width: 26px !important; height: 26px !important; }
.sc4-pj .sc4-pj-dash { color: var(--muted); font-weight: 600; }
.sc4-links a { min-height: 36px; display: inline-flex; align-items: center; padding: 0 12px; border: 1px solid var(--border); border-radius: 999px; background: var(--raised); color: var(--primary); text-decoration: none; font-weight: 700; font-size: 12.5px; }
.sc4-links a:hover, .sc4-links a:focus-visible { border-color: var(--accent); }
@media (max-width: 640px) { .sc4-sp-cols { grid-template-columns: 1fr; } .sc4-search { max-width: none; } }
@media print { .sc4-bar .gg-bar, .sc4-bar .sc4-count { display: none !important; } .sc4-hide { display: block !important; } }
'''

SC4_JS = r'''
function initSc4() {
  if (window.__sc4) return; window.__sc4 = true;
  const act = (bar, grp) => { const c = bar.querySelector('.gg-chip.active[data-group="' + grp + '"]'); return c ? c.dataset.f : 'all'; };
  const chipClick = (bar, after) => bar.addEventListener('click', e => {
    const ch = e.target.closest('.gg-chip'); if (!ch || !bar.contains(ch)) return;
    e.preventDefault();
    bar.querySelectorAll('.gg-chip[data-group="' + ch.dataset.group + '"]').forEach(x => x.classList.toggle('active', x === ch));
    after();
  });
  // ---- Game-by-Game grid ----
  const gg = document.getElementById('sc4-gg');
  if (gg) {
    const cards = Array.from(gg.querySelectorAll('.sc4-card'));
    const apply = () => {
      const cat = act(gg, 'cat'), day = act(gg, 'day');
      const sel = gg.querySelector('select'); const mode = sel ? sel.value : 'kick';
      let shown = 0;
      cards.forEach(c => {
        const okCat = cat === 'all' || c.dataset.cat === cat || (cat === 'picks' && (c.dataset.cat === 'five' || c.dataset.cat === 'alt'));
        const ok = okCat && (day === 'all' || c.dataset.day === day);
        c.hidden = !ok; if (ok) shown++;
        const bx = document.getElementById(c.dataset.box); if (bx) bx.classList.toggle('sc4-hide', !ok);
      });
      const n = v => { const f = parseFloat(v); return isNaN(f) ? 0 : f; };
      const keyf = { kick: c => n(c.dataset.kick), rank: c => n(c.dataset.rank), val: c => -n(c.dataset.val), room: c => -n(c.dataset.room) }[mode] || (c => n(c.dataset.kick));
      const host = cards.length ? cards[0].parentNode : null;
      if (host) cards.slice().sort((a, b) => (keyf(a) - keyf(b)) || (n(a.dataset.kick) - n(b.dataset.kick))).forEach(c => host.appendChild(c));
      const cnt = gg.querySelector('.sc4-count'); if (cnt) cnt.textContent = 'Showing ' + shown + ' of ' + cards.length + ' games';
    };
    chipClick(gg, apply);
    gg.addEventListener('change', apply);
    apply();
  }
  // ---- Experts tab ----
  const xb = document.getElementById('sc4-xbar');
  if (xb) {
    const groups = Array.from(document.querySelectorAll('details.sc-exp'));
    const meta = g => { const c = xb.querySelector('.gg-chip[data-f="' + g.id + '"]'); return c ? c.dataset : {}; };
    const applyX = () => {
      const show = act(xb, 'show'), stance = act(xb, 'stance');
      const inp = xb.querySelector('input'); const q = inp ? inp.value.trim().toLowerCase() : '';
      const filtered = show !== 'all' || stance !== 'all' || !!q;
      let rows = 0, gshown = 0;
      groups.forEach(g => {
        const okShow = show === 'all' || g.id === show;
        const sumTxt = ((g.querySelector('summary') || {}).textContent || '').toLowerCase();
        let any = false;
        g.querySelectorAll('tbody tr').forEach(tr => {
          const td = tr.children;
          const agree = td[2] && td[2].textContent.trim() !== '—';
          const dis = td[3] && td[3].textContent.trim() !== '—';
          const okSt = stance === 'all' || (stance === 'agree' && agree) || (stance === 'disagree' && dis);
          const okQ = !q || tr.textContent.toLowerCase().includes(q) || sumTxt.includes(q);
          const ok = okShow && okSt && okQ;
          tr.classList.toggle('sc4-hide', !ok);
          if (ok) { any = true; rows++; }
        });
        g.classList.toggle('sc4-hide', !any);
        if (any) gshown++;
        if (any && filtered) g.open = true;
      });
      const sel = xb.querySelector('select'); const mode = sel ? sel.value : 'experts';
      const host = groups.length ? groups[0].parentNode : null;
      if (host) groups.filter(g => g.parentNode === host).sort((a, b) => {
        const ma = meta(a), mb = meta(b);
        if (mode === 'az') return (ma.name || '').localeCompare(mb.name || '');
        const k = mode === 'picks' ? 'picks' : (mode === 'agree' ? 'agree' : 'n');
        return (parseFloat(mb[k]) || 0) - (parseFloat(ma[k]) || 0) || (ma.name || '').localeCompare(mb.name || '');
      }).forEach(g => host.appendChild(g));
      const cnt = xb.querySelector('.sc4-count'); if (cnt) cnt.textContent = rows + ' experts in ' + gshown + ' show' + (gshown === 1 ? '' : 's');
    };
    chipClick(xb, applyX);
    xb.addEventListener('input', applyX);
    xb.addEventListener('change', applyX);
    applyX();
  }
}
if (document.readyState !== 'loading') initSc4(); else window.addEventListener('DOMContentLoaded', initSc4);
'''
