#!/usr/bin/env python3
"""Split the single-page Master Intel html into a multi-page client site.

Usage:
  python3 scripts/master-intel/build_site.py dist/nfl_week<N>_master_packet/nfl_week<N>_master_betting_intelligence_summary.html

Writes dist/nfl_week<N>_master_packet/site/:
  index.html               home: header, Slate Status, Our Picks, page directory (full document, for local viewing)
  _artifact_index.html     the same home page without the document skeleton (what gets published as the hosted page)
  ranked.html, props.html, teasers.html, underdogs.html, survivor.html,
  glance.html, games.html, game-<away>-<home>.html (one per game),
  experts.html, registry.html, trends.html, card-build.html, sources.html
  assets/report.css        every <style> block from the single page (incl. the team-logo sprites, loaded once)
  assets/report.js         the single page's script (filters, sorting, collapsibles, tooltips)

The single page stays the source of truth: change the report in build.py / convert_summary.py, rebuild, then
re-run this script (build.py calls it automatically). Every in-page link (#id) is rewritten to the page that
holds that id, so game, expert and prop links keep working across pages.
Needs beautifulsoup4 (pip install beautifulsoup4).
"""
import copy, html, re, sys
from pathlib import Path
from bs4 import BeautifulSoup
sys.path.insert(0, str(Path(__file__).resolve().parent))
import site_extras as SX   # Super Contest page, Props Lab legs + prices, teaser extras, bookmarks (2026-10-04)

# page file, section box id, short nav title, part
PAGES = [
    ('index.html',      'section-rec-box',  'Dashboard',              'A'),
    ('ranked.html',     'section-1-box',    'Every Bet, Ranked',      'A'),
    ('props.html',      'section-2-box',    'Props Lab',              'A'),
    ('teasers.html',    'section-3-box',    'Teaser Board',           'A'),
    ('underdogs.html',  'section-4-box',    'Underdog Upset Ticket',  'A'),
    ('survivor.html',   'section-5-box',    'Survivor Center',        'A'),
    ('glance.html',     'section-exec-box', 'Market Intel',            'B'),
    ('games.html',      'section-6-box',    'Matchups',                'B'),
    ('experts.html',    'section-7-box',    'What the Experts Say',   'B'),
    ('registry.html',   'section-8-box',    'Expert Pick Registry',   'C'),
    ('trends.html',     'section-9-box',    'Betting Trends',         'C'),
    ('card-build.html', 'section-10-box',   'How the Card Was Built', 'C'),
    ('sources.html',    'section-11-box',   'Sources & Data Notes',   'C'),
]
PART_NAME = {'A': 'What to bet', 'B': 'Why we like them', 'C': 'Reference'}

# F-mi-dark (2026-10-03): dark "Tracker slate + teal" layer for the site chrome.
# Appended after SITE_CSS so it wins; tokens come from convert_summary.py's :root.
SITE_DARK_CSS = r"""
/* ---- F-mi-dark site chrome ---- */
.site-header{background:rgba(15,23,42,.94)}
.site-brand{color:var(--text)}
.site-nav-link,.nav-more summary{min-height:var(--tap,40px);padding:0 16px;border:1px solid var(--border);background:var(--card);color:var(--body);font-size:13.5px;font-weight:700}
.site-nav-link:hover,.nav-more summary:hover,.nav-more[open] summary{border-color:var(--accent);background:var(--raised);color:var(--text)}
.site-nav-link.current{border-color:var(--accent);background:var(--accent);color:var(--on-accent);box-shadow:none}
.site-primary-nav{gap:8px;padding-bottom:12px}
.nav-more-menu{top:46px;background:var(--card);border-color:var(--border);box-shadow:0 16px 36px rgba(0,0,0,.45)}
.nav-more-menu a{color:var(--body);padding:11px 12px;font-size:13.5px}
.nav-more-menu a:hover,.nav-more-menu a.current{background:var(--raised);color:var(--primary)}
.side-toc{background:var(--card);border-color:var(--border)}
.side-toc a.current{background:var(--raised);box-shadow:inset 3px 0 0 var(--accent);color:var(--text)}
.toc-toggle{min-height:var(--tap,40px);background:var(--accent);color:var(--on-accent);border:0;border-radius:999px;font-weight:800}
.site-bar a{color:var(--primary)}
.page-nav a{background:var(--card);color:var(--text);border-color:var(--border);padding:14px 16px}
.page-nav a:hover{border-color:var(--accent)}
.game-card{background:var(--card);border-color:var(--border)}
.game-card:hover{border-color:var(--accent)}
.dashboard-card{background:var(--card)}
.dashboard-card:hover{border-color:var(--accent);box-shadow:0 12px 28px rgba(0,0,0,.35)}
.dashboard-card h3{color:var(--text)}.dashboard-card .dc-go{color:var(--primary)}
.market-intel-notice{background:var(--card)}
@media (max-width:640px){
  .site-bar{display:none}
  .site-primary-nav{-webkit-mask-image:linear-gradient(90deg,#000 82%,transparent);mask-image:linear-gradient(90deg,#000 82%,transparent);padding-right:28px}
  .site-brand{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13.5px}
  .dashboard-grid{grid-template-columns:1fr 1fr;gap:10px}
  .dashboard-card{min-height:0;padding:14px}
  .dashboard-card p{display:none}
}
@media print{
  .site-header,.side-toc,.toc-toggle,.page-nav{display:none !important}
  .site-bar{color:#475569}
}
"""

SITE_CSS = r"""
/* ---- multi-page site layer (build_site.py) ---- */
:root{color-scheme:dark;--on-primary:#0f172a}
.rollup-controls,.table-filter{flex-wrap:wrap}
.site-bar{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 16px;margin:0 0 18px;padding-bottom:10px;border-bottom:1px solid var(--border);font-size:12.5px;color:var(--muted)}
.site-bar a{color:var(--primary);text-decoration:none;font-weight:700}
.site-bar .crumb{letter-spacing:.06em;text-transform:uppercase;font-weight:700;font-size:11px}
.side-toc,.toc-toggle{display:none !important}
.site-header{position:sticky;top:0;z-index:40;margin:0 0 22px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(14px)}
.site-header-inner{max-width:1180px;margin:0 auto;padding:10px 20px 0}.site-brand-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 0 9px}
.site-brand{color:var(--primary);font-size:14px;font-weight:800;letter-spacing:.01em;text-decoration:none}.site-brand span{color:var(--muted);font-weight:600}.site-status{color:var(--muted);font-size:11.5px;white-space:nowrap}
.site-primary-nav{display:flex;align-items:center;gap:5px;overflow-x:auto;scrollbar-width:none;padding:0 0 10px}.site-primary-nav::-webkit-scrollbar{display:none}
.site-nav-link,.nav-more summary{display:inline-flex;align-items:center;min-height:30px;padding:0 11px;border:1px solid transparent;border-radius:999px;color:var(--muted);font-size:12px;font-weight:750;text-decoration:none;white-space:nowrap;cursor:pointer;list-style:none}
.site-nav-link:hover,.nav-more summary:hover{border-color:var(--border);color:var(--text);background:var(--highlight)}.site-nav-link.current{border-color:var(--primary);background:var(--primary);color:var(--on-primary);box-shadow:0 0 0 1px color-mix(in srgb,var(--primary) 20%,transparent)}
.nav-more{position:relative}.nav-more summary::-webkit-details-marker{display:none}.nav-more[open] summary{border-color:var(--border);color:var(--text);background:var(--highlight)}.nav-more-menu{position:absolute;right:0;top:36px;min-width:210px;padding:7px;border:1px solid var(--border);border-radius:10px;background:var(--bg);box-shadow:0 16px 36px rgba(0,0,0,.2)}
.nav-more-menu a{display:block;padding:9px 10px;border-radius:7px;color:var(--text);font-size:12px;font-weight:650;text-decoration:none}.nav-more-menu a:hover,.nav-more-menu a.current{background:var(--highlight);color:var(--primary)}
.page-nav{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:34px 0 0}
.page-nav a{display:block;min-width:0;padding:12px 14px;border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--primary);background:var(--highlight)}
.page-nav a:focus-visible,.game-card:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.page-nav .pn-dir{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:700}
.page-nav .pn-title{display:block;font-weight:700}
.page-nav .pn-next{grid-column:2;text-align:right}
.game-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;margin:14px 0 6px}
.game-card{display:block;min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--highlight);color:var(--text);text-decoration:none;font-size:13.5px;line-height:1.45}
.game-card:hover{border-color:var(--primary-light)}
.game-card .gc-when{display:block;font-size:11.5px;color:var(--muted);font-weight:600}
.game-card .gc-match{display:block;font-weight:700;color:var(--primary)}
.game-card .gc-line{display:block;font-variant-numeric:tabular-nums}
.page-h{margin-top:4px}
.dashboard-intro{margin:8px 0 22px;color:var(--muted);font-size:15px;line-height:1.55}
.dashboard-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:18px 0 28px}
.dashboard-card{display:flex;min-height:148px;flex-direction:column;justify-content:space-between;padding:18px;border:1px solid var(--border);border-radius:12px;background:var(--highlight);color:var(--text);text-decoration:none;transition:border-color .16s ease,transform .16s ease,box-shadow .16s ease}
.dashboard-card:hover{border-color:var(--primary-light);transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.12)}
.dashboard-card:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.dashboard-card .dc-kicker{display:block;color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
.dashboard-card h3{margin:7px 0 5px;color:var(--primary);font-size:18px}.dashboard-card p{margin:0;color:var(--muted);font-size:13px;line-height:1.45}
.dashboard-card .dc-go{margin-top:16px;font-size:12px;font-weight:800;color:var(--primary)}
.dashboard-section-title{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:24px 0 0}.dashboard-section-title h2{margin:0}.dashboard-section-title span{color:var(--muted);font-size:12px}
.game-room-kicker{display:inline-flex;align-items:center;gap:7px;margin:0 0 10px;color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.game-room-kicker::before{content:'◈';font-size:14px}
.rec-asof{margin:-4px 0 14px;color:var(--muted);font-size:12.5px}
.market-intel-notice{margin:14px 0 18px;padding:12px 14px;border-left:3px solid var(--accent);border-radius:7px;background:var(--highlight);color:var(--muted);font-size:13px;line-height:1.5}.market-matchup{margin:10px 0}.market-matchup h3{margin:4px 0 10px;font-size:15px}
@media (min-width:1300px){.container{margin-left:auto !important;margin-right:auto !important;max-width:1180px}}
@media (max-width:640px){body{padding:0 16px 24px !important}.site-header{margin-left:-16px;margin-right:-16px}.site-header-inner{padding-left:16px;padding-right:16px}.site-brand-row{padding-top:5px}.site-status{max-width:45%;overflow:hidden;text-overflow:ellipsis}.container{padding:20px 16px !important;border-radius:10px}h1{font-size:22px}.page-nav{grid-template-columns:1fr}.page-nav .pn-next{grid-column:1}.nav-more-menu{position:fixed;right:16px;left:16px;top:74px;min-width:0}}
"""


def soup_of(fragment):
    return BeautifulSoup(fragment, 'html.parser')


def dashboard_fragment():
    """Client-first entry points layered over the existing evidence pages."""
    cards = [
        ('Super Contest', 'Contest', 'Our five sides against the spread, five alternates, and every expert side with its source.', 'sc.html'),
        ('Props Lab', 'Player Props', 'The card\u2019s prop stacks, recommended legs for every game, and the best price across BKR, BEO and DK.', 'props.html'),
        ('Teaser Board', 'Teasers', 'Wong teaser legs, the experts on each one, and 2-, 3-, 4-leg and round-robin math.', 'teasers.html'),
        ('Survivor Center', 'Survivor', 'Popularity, leverage, and game-level risk context for survivor decisions.', 'survivor.html'),
        ('Matchups', 'Game-by-game', 'Each game\u2019s betting splits first, then the projection and the case for every side, total and prop.', 'games.html'),
        ('Market Intel', 'Market context', 'Odds, win chance, line movement, splits, key context, trends and news for every matchup.', 'glance.html'),
        ('Bookmarks', 'Your list', 'Everything you starred for review, in one place. Saved in this browser.', 'bookmarks.html'),
    ]
    html_cards = ''.join(
        f'<a class="dashboard-card" href="{href}"><span class="dc-kicker">{html.escape(kicker)}</span>'
        f'<span><h3>{html.escape(title)}</h3><p>{html.escape(copy)}</p></span>'
        '<span class="dc-go">Open workspace →</span></a>'
        for title, kicker, copy, href in cards
    )
    return soup_of(
        '<section class="dashboard-shell" aria-labelledby="dashboard-title">'
        '<div class="dashboard-section-title"><h2 id="dashboard-title">Choose your Week</h2>'
        '<span>Each workspace keeps the underlying evidence one click away.</span></div>'
        '<p class="dashboard-intro">Start with the decision surface that matters to you. '
        'Use Matchups for the full market, intel, and narrative view of a game.</p>'
        f'<div class="dashboard-grid">{html_cards}</div></section>'
    ).section


def _splits_alert(sec):
    """Flag split rows where the money share beats the ticket share: 15+ points = big-money alert (the report's
    big-money rule), 10-14 = money lean. Adds an alert box at the top of the splits card and marks the rows."""
    alerts = []
    for tr in sec.select('tbody tr'):
        tds = tr.find_all('td')
        if len(tds) < 5:
            continue
        m = re.search(r'([+−-]?\d+)', tds[-1].get_text(strip=True).replace('−', '-'))
        if not m:
            continue
        d = int(m.group(1))
        if d >= 10:
            mk = tds[0].get_text(' ', strip=True); sd = tds[1].get_text(' ', strip=True)
            b = tds[2].get_text(' ', strip=True); mo = tds[3].get_text(' ', strip=True)
            big = d >= 15
            tr['class'] = tr.get('class', []) + ['split-big' if big else 'split-lean']
            alerts.append((big, f'{mk}: {sd} — {b} of tickets but {mo} of the money (+{d})'))
    if alerts:
        items = ''.join(f'<li><b>{"💰 Big money / possible sharp play" if big else "⚠️ Money lean"}</b> — {html.escape(t)}</li>' for big, t in alerts)
        box = soup_of('<div class="split-alert"><strong>Sharp / big-money alert</strong><ul>' + items + '</ul>'
                      '<p class="muted-note">Fewer tickets carrying a bigger share of the money usually means larger, often professional, bets. '
                      '15+ points = big-money signal; 10–14 = money lean. It is a signal, not a guarantee.</p></div>').div
    else:
        box = soup_of('<p class="muted-note split-none">No sharp or big-money gap in this game (no side where money beats tickets by 10+ points).</p>').p
    h3 = sec.find('h3')
    (h3.insert_after(box) if h3 else sec.insert(0, box))
    return sum(1 for big, _ in alerts if big), len(alerts)


def _matchup_cards(holder, gid, gs):
    """Game page: every block becomes a collapsible card, with a jump bar at the top."""
    cards = []
    def card(cid, title, els, open_=False):
        d = soup_of(f'<details class="rollup-box mu-card" id="{cid}"{" open" if open_ else ""}><summary><span class="sum-text">{title}</span></summary>'
                    '<div class="rollup-content"></div></details>').details
        inner = d.find('div', class_='rollup-content')
        for e in els:
            inner.append(e.extract())
        return d
    sp = holder.find('section', class_='splits-top')
    if sp is not None:
        nbig, nall = _splits_alert(sp)
        h3 = sp.find('h3')
        if h3: h3.decompose()
        tag = f' <span class="mu-badge">💰 {nbig} big-money</span>' if nbig else (f' <span class="mu-badge lean">⚠️ {nall} money lean</span>' if nall else '')
        d = card(f'mu-{gs}-splits', '📊 Betting splits: where the bets and the money are' + tag, [sp], True)
        holder.insert(0, d); cards.append((d['id'], '📊 Splits'))
    nar = holder.find('div', class_='game-narrative')
    if nar is not None:
        kids = [k for k in nar.children if getattr(k, 'name', None)]
        groups, cur = [('proj', '🎯 Projection &amp; game script', [])], None
        for k in kids:
            t = k.get_text(' ', strip=True)
            if k.name == 'div' and t.startswith('🧠'):
                groups.append(('why', '🧠 Why the card leans this way', [])); continue
            if k.name == 'div' and t.startswith('⚠'):
                groups.append(('breaks', '⚠️ What breaks it', [])); continue
            if k.name == 'div' and t.startswith('🎙️ What the experts'):
                groups.append(('experts', '🎙️ What the experts are saying', [])); continue
            groups[-1][2].append(k)
        prev = nar
        for key, title, els in groups:
            if not els: continue
            d = card(f'mu-{gs}-{key}', title, els, key in ('proj', 'why'))
            prev.insert_after(d); prev = d; cards.append((d['id'], title.split(' ', 1)[1].replace('&amp;', '&').split(' ')[0] if False else title))
        nar.decompose()
    lt = holder.find('div', class_='table-responsive', recursive=False)
    if lt is not None:
        ptr = holder.find('p', class_='mi-pointer')
        els = [lt] + ([ptr] if ptr else [])
        anchor = lt.find_previous_sibling()
        d = card(f'mu-{gs}-line', '💵 Bookmaker line', els)
        (anchor.insert_after(d) if anchor else holder.insert(0, d)); cards.append((d['id'], '💵 Line'))
    for suf, lab in (('side', '⚖️ Sides'), ('total', '📈 Totals'), ('prop', '🧾 Props')):
        el = holder.find('details', id=f'{gid}-{suf}')
        if el is not None:
            el['class'] = el.get('class', []) + ['mu-card']
            cards.append((el['id'], lab))
    short = {'proj': '🎯 Projection', 'why': '🧠 Why', 'breaks': '⚠️ What breaks it', 'experts': '🎙️ Experts'}
    links = []
    for cid, lab in cards:
        k = cid.rsplit('-', 1)[-1]
        links.append(f'<a href="#{cid}" class="mu-jump-link">{short.get(k, lab)}</a>')
    links.append(f'<a href="glance.html#market-{gid}" class="mu-jump-link">📈 Market Intel →</a>')
    bar = soup_of('<nav class="mu-jump" aria-label="Jump to a section of this matchup"><span class="mu-jump-label">Jump to</span>'
                  + ''.join(links) + '<button type="button" class="btn-toggle mu-all" data-open="1">Open all</button>'
                  '<button type="button" class="btn-toggle mu-all" data-open="0">Close all</button></nav>').nav
    holder.insert(0, bar)


def _rec_filter(box):
    """Straight bets on the dashboard: All / Sides / Moneylines / Totals filter that also filters each game's
    summary line (the old table filter hid table rows only, so a game's summary still listed its sides
    under 'Total'). A pick like 'NYJ +3.5 -103 / NYJ ML +167' counts as both a side and a moneyline."""
    rec = box.find('details', id='rec-straight')
    if not rec:
        return
    bar = rec.find('div', class_='table-filter')
    if bar:
        for b in bar.find_all('button', attrs={'data-filter': True}):
            b.decompose()
        bar['class'] = [c for c in bar.get('class', []) if c != 'table-filter']
        del bar['data-col']
        lead = soup_of('<span class="rec-filter" id="rec-filter">'
                       '<button type="button" class="btn-toggle btn-primary" data-t="all">All</button>'
                       '<button type="button" class="btn-toggle" data-t="side">Spreads</button>'
                       '<button type="button" class="btn-toggle" data-t="ml">Moneylines</button>'
                       '<button type="button" class="btn-toggle" data-t="total">Totals</button></span>').span
        bar.insert(0, lead)
    intro = rec.find('p')
    if intro:
        intro.string = 'Grouped by game. Filter to spreads, moneylines or totals, and sort by strength, kickoff or name. Open a game for our projected score and the reasoning.'
    for g in rec.find_all('details', class_='filter-group'):
        g['class'] = g.get('class', []) + ['rec-game']
        tags_rows = []
        for tr in g.select('tbody tr'):
            tds = tr.find_all('td')
            if len(tds) < 2:
                continue
            typ = tds[0].get_text(strip=True).lower(); pick = tds[1].get_text(' ', strip=True)
            t = set()
            t.add({'total': 'total', 'ml': 'ml', 'spread': 'side', 'side': 'side'}.get(typ, 'side'))
            tr['data-t'] = ' '.join(sorted(t))
            tags_rows.append(tr['data-t'])
        sm = g.find('summary'); st = sm.find(class_='sum-text') if sm else None
        if st is None:
            continue
        raw = st.decode_contents()
        parts = raw.split(' — ')
        if len(parts) >= 3:
            items = ' — '.join(parts[1:-1]).split(' · ')
            if len(items) == len(tags_rows):
                chips = ''.join(f'<span class="rp" data-t="{t}">{it}</span>' for it, t in zip(items, tags_rows))
                st.clear()
                st.append(soup_of(f'{parts[0]} — {chips} — {parts[-1]}'))


def main(src):
    src = Path(src)
    raw = src.read_text(encoding='utf-8')
    soup = BeautifulSoup(raw, 'html.parser')
    out = src.parent / 'site'
    (out / 'assets').mkdir(parents=True, exist_ok=True)

    # ---- shared assets ----
    css_parts = [st.string or '' for st in soup.find_all('style')]
    css = '\n'.join(css_parts)
    # theme contract: guard the dark palette so an explicit light choice wins, and mirror it for an explicit dark choice
    m = re.search(r'@media \(prefers-color-scheme: dark\) \{\s*:root \{(.*?)\}\s*\}', css, re.S)
    if m:
        dark = m.group(1)
        css = css.replace(m.group(0), '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {' + dark + '}\n}\n:root[data-theme="dark"] {' + dark + ' color-scheme: dark;}')
    # text on the primary fill: white on light navy, but dark on the light-blue dark-mode primary
    css = re.sub(r'(background(?:-color)?:\s*var\(--primary\);\s*color:\s*)#(?:ffffff|fff)\b', r'\1var(--on-primary)', css)
    css += SITE_CSS + SITE_DARK_CSS + SX.BOOKMARKS_CSS
    (out / 'assets' / 'report.css').write_text(css, encoding='utf-8')

    title = soup.title.get_text(strip=True) if soup.title else 'Master Intel Report'
    wk = re.search(r'Week (\d+)', title)
    week = wk.group(1) if wk else '?'
    script = soup.body.find('script', recursive=False)
    (out / 'assets' / 'report.js').write_text((script.string if script else '')
        + SX.BOOKMARKS_JS.replace("document.body.getAttribute('data-week') || ''", repr(str(week))), encoding='utf-8')
    dm = re.search(r'(\d{4}-\d{2}-\d{2})', src.name) or re.search(r'master_packet', str(src))
    built_date = None
    for _jf in src.parent.glob('*master_betting_intelligence_summary.json'):
        try:
            import json as _json
            built_date = _json.loads(_jf.read_text(encoding='utf-8')).get('bkr_capture_date')
        except Exception:
            pass
    XC = SX.load(week, built_date) if built_date and week != '?' else None
    side = soup.find('div', class_='side-toc')
    cont = soup.find('div', class_='container')
    kids = [c for c in cont.children if getattr(c, 'name', None)]

    # ---- group container children into pages ----
    header, home_extra, chunks, pending, disclaimer = [], [], {}, [], None
    seen_first_section = False
    for c in kids:
        cls = c.get('class') or []
        if c.name == 'style':
            continue
        if 'legal-disclaimer' in cls:
            disclaimer = c; continue
        if 'part-banner' in cls or (c.name == 'a' and c.get('id') == 'disclaimer'):
            continue
        if c.name == 'details' and 'section-main' in cls:
            chunks[c['id']] = pending + [c]; pending = []; seen_first_section = True; continue
        if not seen_first_section and not pending and c.name in ('h1', 'h2', 'h3', 'p', 'details', 'div') and c.name != 'a':
            # everything before the first section heading is the home-page header block
            if c.name == 'h2' and header and header[-1].name in ('div',) and 'toc-grid' in (header[-1].get('class') or []):
                pending.append(c); continue
            header.append(c); continue
        pending.append(c)

    built = str(header[2].get_text(' ', strip=True)) if len(header) > 2 else ''
    built_short = re.sub(r' · Prices.*', '', built)

    # ---- per-page body fragments ----
    def section_body(box_id, chunk):
        """h2 + controls + the open section box, with the redundant outer box unwrapped."""
        frag = []
        for el in chunk:
            el = copy.copy(el)
            if el.name == 'div' and 'rollup-controls' in (el.get('class') or []):
                for b in el.find_all('button'):
                    if re.search(r"'secmain-", b.get('onclick', '')):
                        b.decompose()
                if not el.find('button'):
                    continue
            if el.name == 'details' and el.get('id') == box_id:
                inner = el.find('div', class_='rollup-content', recursive=False)
                holder = soup_of(f'<div id="{box_id}" class="section-page"></div>').div
                for x in list((inner or el).children):
                    if getattr(x, 'name', None) == 'summary':
                        continue
                    holder.append(copy.copy(x))
                el = holder
            if el.name == 'h2':
                el['class'] = (el.get('class') or []) + ['page-h']
            frag.append(el)
        return frag

    pages = {}   # file -> dict(title, part, frag[list of tags])
    for fn, box, short, part in PAGES:
        if box not in chunks:
            continue
        frag = section_body(box, chunks[box])
        if fn == 'games.html':
            for el in frag:
                if el.name == 'h2':
                    el.string = 'Matchups: Odds, Money, Projections & the Case'
                    break
        if fn == 'index.html':
            # 2026-10-04 (Andy): the dashboard opens on the recommendations. The report's title block, the
            # "nothing has been bet" note, the expand/collapse bar and the "Choose your Week" cards are gone
            # (the tabs at the top replace the cards). Slate Status moves to the bottom, collapsed.
            m_ = re.search(r'Prices from (.+?) —', built)
            asof = soup_of('<p class="rec-asof">Prices: ' + html.escape(m_.group(1) if m_ else built_short)
                           + '</p>').p
            out_ = []
            for el in frag:
                out_.append(el)
                if el.name == 'h2':
                    out_.append(asof)
            # Everything collapsed on arrival (Andy 2026-10-04); straight-bet filter rebuilt below.
            for el in out_:
                for d in (el.find_all('details') if hasattr(el, 'find_all') else []):
                    if d.has_attr('open'):
                        del d['open']
                if el.get('id') == 'section-rec-box':
                    _rec_filter(el)
                    scb = el.find('details', id='rec-supercontest')
                    if scb is not None and XC:
                        _f, _a, _ = SX.sc_rows(XC)
                        if _a:
                            alts = ' · '.join(f"{html.escape(r.get('pick', ''))} {html.escape(r.get('contest line', ''))}" for r in _a)
                            scb.find('div', class_='rollup-content').append(soup_of(
                                f'<p><strong>Five alternates:</strong> {alts}. '
                                '<a href="sc.html">Reasoning, ranking and expert picks on the Super Contest tab →</a></p>').p)
            slate = [copy.copy(h) for h in header if h.get('id') == 'slate-status-box']
            for d in slate:
                if d.has_attr('open'):
                    del d['open']
            frag = out_ + slate
        pages[fn] = dict(title=short, part=part, frag=frag, box=box)

    # ---- games: one page per game, hub keeps the overview ----
    games = []
    if 'games.html' in pages:
        hub = pages['games.html']
        sec = next(f for f in hub['frag'] if f.get('id') == 'section-6-box')
        boxes = [d for d in sec.find_all('details', recursive=False) if re.match(r'game-.*-box$', d.get('id', ''))]
        anchors = [a for a in sec.find_all('a', recursive=False) if re.match(r'game-[a-z]+-[a-z]+$', a.get('id', ''))]
        for d in boxes:
            gid = d['id'][:-4]
            summ = d.find('summary')
            stext = summ.find(class_='sum-text') or summ
            head_html = ''.join(str(x) for x in stext.contents)
            plain = stext.get_text(' ', strip=True)
            gfn = f'{gid}.html'
            holder = soup_of(f'<div id="{d["id"]}" class="section-page"></div>').div
            content = d.find('div', class_='rollup-content', recursive=False)
            for x in list((content or d).children):
                if getattr(x, 'name', None) == 'summary':
                    continue
                holder.append(copy.copy(x))
            h2 = soup_of(f'<h2 class="page-h" id="{gid}">{head_html}</h2>').h2
            pages[gfn] = dict(title=plain, part='B', frag=[h2, holder], box=d['id'], game=True)
            games.append((gfn, gid, head_html, plain))
            d.decompose()
        for a in anchors:
            a.decompose()
        cards = []
        for gfn, gid, head_html, plain in games:
            mm = re.match(r'⏰\s*(\S+ [\d:]+ PT)\s*—\s*(.*)$', plain)
            when = mm.group(1) if mm else ''
            # keep the logo markup: drop the leading clock/time text from the summary html
            hh = re.sub(r'^\s*⏰\s*\S+ [\d:]+ PT\s*—\s*', '', head_html)
            parts = hh.split(' — ', 1)
            cards.append(f'<a class="game-card" href="{gfn}"><span class="gc-when">{html.escape(when)}</span>'
                         f'<span class="gc-match">{parts[0]}</span>'
                         + (f'<span class="gc-line">{parts[1]}</span>' if len(parts) > 1 else '') + '</a>')
        grid = soup_of('<h3>Pick a game</h3><div class="game-grid">' + ''.join(cards) + '</div>')
        sec.insert(0, grid)
        # move the grid below the intro paragraphs
        intro = [x for x in sec.find_all('p', recursive=False)][:1]
        if intro:
            for x in reversed(list(grid.contents)):
                intro[0].insert_after(x.extract() if hasattr(x, 'extract') else x)

        # 2026-10-04 (Andy): betting splits go to the top of each matchup; odds / win chance, key context,
        # trends and news move to Market Intel (inserted per matchup), with the opening line -> now movement.
        def _noids(el):
            el = copy.copy(el)
            if getattr(el, 'attrs', None) is not None:
                el.attrs.pop('id', None)
                for x in el.find_all(id=True):
                    del x['id']
            return el
        MOVED = {}
        for gfn, gid, head_html, plain in games:
            holder = next((x for x in pages[gfn]['frag'] if x.name == 'div'), None)
            if not holder:
                continue
            gs = gid[5:]
            board = holder.find('details', id=f'board-{gs}')
            splits = None
            if board:
                rc = board.find('div', class_='rollup-content') or board
                p0 = next((x for x in rc.find_all('p', recursive=False) if 'Where the bets are landing' in x.get_text()), None)
                if p0:
                    splits = soup_of('<section class="splits-top"><h3>📊 Betting splits: where the bets and the money are</h3></section>').section
                    n = p0
                    while n is not None and not (n.name == 'p' and 'expert consensus' in n.get_text()):
                        if getattr(n, 'name', None):
                            splits.append(_noids(n))
                        n = n.find_next_sibling()
            moved = {}
            for key in (f'board-{gs}', f'{gid}-context', f'{gid}-trends', f'{gid}-news'):
                el = holder.find('details', id=key)
                if el:
                    moved[key] = el.extract()
            MOVED[gid] = (moved, splits)
            narrative = holder.find('div', class_='game-narrative')
            if splits is not None:
                if narrative:
                    narrative.insert_before(copy.copy(splits))
                else:
                    holder.insert(0, copy.copy(splits))
            ptr = soup_of(f'<p class="mi-pointer">💵 Odds, win chance, line movement, key context, trends and news for this game are on '
                          f'<a href="glance.html#market-{gid}">Market Intel →</a></p>').p
            lt = holder.find('div', class_='table-responsive', recursive=False)
            if lt:
                lt.insert_after(ptr)
            else:
                holder.append(ptr)
            _matchup_cards(holder, gid, gs)

        if 'glance.html' in pages:
            MJ = (XC or {}).get('games', {}) if XC else {}
            market = soup_of(
                '<div class="market-intel-shell">'
                '<h2 class="page-h">📈 Market Intel</h2>'
                '<p class="dashboard-intro">A matchup-by-matchup read of the market: the current Bookmaker line, how it moved from the '
                'Action Network opener, Action Network betting splits, odds and win chance, then the key context, trends and news for each game.</p>'
                '<div class="market-intel-notice"><strong>Sources:</strong> Bookmaker (BKR) game lines; Action Network opening lines and '
                'betting splits; ESPN injury feed; the trends and systems in each game\'s primer; matched news headlines. '
                'A 💰 big-money signal means the money share beats the bet share by 15+ points on that side.</div>'
                '<div class="rollup-controls"><button class="btn-toggle" onclick="toggleRollups(\'market-matchup\', true)">Open all games</button>'
                '<button class="btn-toggle" onclick="toggleRollups(\'market-matchup\', false)">Close all games</button></div>'
                '</div>'
            ).div
            for gfn, gid, head_html, plain in games:
                game_holder = next((x for x in pages[gfn]['frag'] if x.name == 'div'), None)
                if not game_holder:
                    continue
                moved, splits = MOVED.get(gid, ({}, None))
                lt_div = (game_holder.find('details', id=f'mu-{gid[5:]}-line') or game_holder).find('div', class_='table-responsive')
                line_table = lt_div.find('table') if lt_div else None
                item = soup_of(
                    f'<details class="rollup-box market-matchup" id="market-{gid}">'
                    f'<summary><span class="sum-text">{head_html}</span></summary>'
                    '<div class="rollup-content"></div></details>'
                ).details
                content = item.find('div', class_='rollup-content')
                content.append(soup_of('<h3>Line &amp; movement</h3>').h3)
                if line_table:
                    wrap = soup_of('<div class="table-responsive"></div>').div
                    wrap.append(_noids(line_table))
                    content.append(wrap)
                gj = next((v for k, v in MJ.items() if 'game-' + SX.slug(k) == gid), None)
                mv = ''
                if gj and gj.get('opening_lines'):
                    op = gj['opening_lines']; sp_now = (gj.get('lines') or {}).get('spread') or {}
                    fav_o = min((op.get('sp') or {}).items(), key=lambda kv: kv[1], default=None)
                    fav_n = min(((t, v.get('line')) for t, v in sp_now.items() if v.get('line') is not None), key=lambda kv: kv[1], default=None)
                    tot_n = (((gj.get('lines') or {}).get('total') or {}).get('Over') or {}).get('line')
                    fmt = lambda t, v: f'{t} {v:+g}' if v else f'{t} pick\u2019em'
                    parts = []
                    if fav_o and fav_n:
                        parts.append(f'spread {fmt(*fav_o)} → {fmt(*fav_n)}' + (' (no change)' if fav_o == fav_n else ''))
                    if op.get('tot') is not None and tot_n is not None:
                        parts.append(f'total {op["tot"]:g} → {tot_n:g}' + (' (no change)' if op['tot'] == tot_n else ''))
                    if parts:
                        mv = f'<p><strong>Line movement:</strong> {"; ".join(parts)}. Opener: {html.escape(op.get("label") or op.get("source") or "")}.</p>'
                content.append(soup_of(mv or '<p><strong>Line movement:</strong> no opening line was loaded for this game.</p>').p)
                for key in (f'board-{gid[5:]}', f'{gid}-context', f'{gid}-trends', f'{gid}-news'):
                    if key in moved:
                        el = moved[key]
                        content.append(el)
                content.append(soup_of(f'<p><a href="{gfn}">Back to the matchup →</a></p>').p)
                market.append(item)
            pages['glance.html'] = dict(title='Market Intel', part='B', frag=[market], box='section-exec-box')

    # ---- Super Contest page, bookmarks page, Props Lab legs, Teaser Board extras (site_extras.py) ----
    if XC:
        pages['sc.html'] = dict(title='Super Contest', part='A', frag=[soup_of(SX.sc_page(XC)).div], box='sc-page')
        pages['bookmarks.html'] = dict(title='Bookmarks', part='C', frag=[soup_of(SX.BOOKMARKS_PAGE).div], box='bm-page')
        if 'props.html' in pages:
            ph = next((x for x in pages['props.html']['frag'] if x.get('id') == 'section-2-box'), None)
            pool = ph.find('div', id='prop-pool-tables') if ph else None
            if pool:
                anchor = ph.find('a', id='prop-pool')
                n = anchor
                kill = []
                while n is not None and n is not pool:
                    kill.append(n); n = n.next_sibling
                nxt = pool.find_next_sibling()
                kill.append(pool)
                if nxt is not None and nxt.name == 'hr':
                    kill.append(nxt)
                new = soup_of('<div class="props-lab-top" id="prop-pool"></div>').div
                new.append(soup_of('<h3 id="props-stacks">🧾 Proposed prop stacks from the card</h3>').h3)
                stacks = None
                for x in pages.get('index.html', {}).get('frag', []):
                    stacks = x if x.get('id') == 'rec-props' else x.find('details', id='rec-props')
                    if stacks:
                        break
                if stacks:
                    st = copy.copy(stacks)
                    st['id'] = 'pl-rec-props'; st['open'] = ''
                    for dd in st.find_all('details'):
                        dd['open'] = ''
                    for x in st.find_all(id=True):
                        x['id'] = 'pl-' + x['id']
                    new.append(st)
                new.append(soup_of(SX.props_lab(XC)).div)
                kill[0].insert_before(new)
                for k in kill:
                    k.extract()
                h2 = next((x for x in pages['props.html']['frag'] if x.name == 'h2'), None)
                if h2:
                    h2.string = '2. Props Lab: Card Stacks, Recommended Legs, Best Prices & Prop Boards'
        if 'teasers.html' in pages:
            th = next((x for x in pages['teasers.html']['frag'] if x.get('id') == 'section-3-box'), None)
            if th:
                intro = next((x for x in th.find_all('p') if x.get_text().strip().startswith('What a teaser is')), None)
                if intro:
                    det = soup_of('<details class="rollup-box"><summary><span class="sum-text">📖 What a 6-point Wong teaser is (tap to read)</span></summary><div class="rollup-content"></div></details>').details
                    intro.insert_before(det)
                    det.find('div').append(intro.extract())
                tbl = th.find('table')
                legs = []
                if tbl:
                    for tr in tbl.find_all('tr'):
                        tds = tr.find_all('td')
                        if len(tds) < 5:
                            continue
                        a = tds[0].find('a', href=True)
                        gs = re.sub(r'^#?game-', '', a['href']).split('#')[0].replace('.html', '') if a else ''
                        gid = next((g for g in XC['order'] if SX.slug(g) == gs), None)
                        team = tds[1].get_text(strip=True)
                        if gid:
                            legs.append((gid, team, tds[4], tds[3].get_text(strip=True)))
                cells, calls_html, math_html = SX.teaser_extras(XC, [(g, t) for g, t, _, _ in legs])
                for gid, team, td, teased in legs:
                    n_, chips = cells.get((gid, team), (0, '—'))
                    td.clear(); td.append(soup_of(f'<b>{n_}</b> {chips}'))
                five = set(re.findall(r'([A-Z]{2,3}) [−+-]', (re.search(r'^## SuperContest[^\n]*', XC['card'], re.M) or [''])[0]))
                tk = re.search(r'^### (6-pt Wong teaser [^—]+)—', XC['card'], re.M)
                tklegs = set(re.findall(r'[A-Z]{2,3}', tk.group(1).replace('6-pt Wong teaser', ''))) if tk else set()
                rec = ['<h3 id="teaser-this-week">This week\'s Wong legs and what to build</h3><ul>']
                for gid, team, td, teased in legs:
                    g = XC['games'][gid]; opp = g['home'] if team == g['away'] else g['away']
                    note = []
                    if team in tklegs: note.append('on the card\'s 3-team teaser')
                    if opp in five: note.append(f'opposes our Super Contest pick on {opp}')
                    rec.append(f'<li><b>{html.escape(team)} {html.escape(teased)}</b> ({html.escape(gid)}): {cells.get((gid, team), (0,))[0]} named experts on {html.escape(team)}'
                               + (f' — {"; ".join(note)}' if note else '') + '</li>')
                rec.append('</ul>')
                if tk:
                    rec.append(f'<p>The card plays <b>{html.escape(tk.group(1).strip())}</b> as one 3-team teaser. With four Wong legs on the board, '
                               'the alternatives are a 4-team teaser (more return per dollar if the legs cover at 74%+, more loss below it) or a round robin '
                               'by 2s or 3s (same return per dollar as the single ticket size, but a better chance of getting something back). '
                               'A leg that opposes a side we are playing elsewhere (see above) is a hedge, not extra edge. The math is below.</p>')
                th.append(soup_of(''.join(rec)))
                th.append(soup_of(calls_html))
                th.append(soup_of(math_html))
    # ---- id -> page map, then rewrite #links ----
    idmap = {}
    for fn, pg in pages.items():
        for el in pg['frag']:
            if getattr(el, 'get', None) and el.get('id'):
                idmap.setdefault(el['id'], fn)
            for x in el.find_all(id=True):
                idmap.setdefault(x['id'], fn)
    # anchors that the single page put just before a section heading
    for fn, box, short, part in PAGES:
        if box in chunks:
            for el in chunks[box]:
                if el.name == 'a' and el.get('id'):
                    idmap.setdefault(el['id'], fn)
    idmap.update({'section-6-box': 'games.html', 'game-dossier': 'games.html', 'recommendations': 'index.html'})

    def rewrite(el, here):
        for a in el.find_all('a', href=True):
            h = a['href']
            if h.startswith('#') and len(h) > 1:
                tgt = idmap.get(h[1:])
                if tgt and tgt != here:
                    page_roots = {pages[tgt].get('box'), tgt[:-5]}   # the page's own box id, or a game page's game id
                    a['href'] = tgt if h[1:] in page_roots else f'{tgt}{h}'

    # ---- navigation ----
    order = [fn for fn, *_ in PAGES if fn in pages]
    if 'sc.html' in pages:
        order.insert(1, 'sc.html')
    if 'bookmarks.html' in pages:
        order.append('bookmarks.html')
    tips = {}
    if side:
        for a in side.find_all('a'):
            tips[a.get('href', '')[1:]] = (a.get('data-tip', ''), (a.find(class_='toc-ico') or a).get_text(strip=True)[:2])

    def top_nav(here):
        here_main = 'games.html' if here.startswith('game-') else here
        primary = [
            ('index.html', 'Dashboard'), ('sc.html', 'Super Contest'),
            ('props.html', 'Props Lab'), ('teasers.html', 'Teaser Board'),
            ('survivor.html', 'Survivor Center'), ('games.html', 'Matchups'),
            ('glance.html', 'Market Intel'), ('bookmarks.html', '☆ Bookmarks'),
        ]
        secondary = [('ranked.html', 'Every Bet, Ranked'), ('underdogs.html', 'Underdog Ticket'),
                     ('experts.html', 'Experts'), ('registry.html', 'Pick Registry'),
                     ('trends.html', 'Trends'), ('card-build.html', 'Card Build'),
                     ('sources.html', 'Sources')]
        h = ['<header class="site-header"><div class="site-header-inner"><div class="site-brand-row">',
             f'<a class="site-brand" href="index.html">Platinum Rose <span>· NFL Week {week} Intel</span></a>',
             f'<span class="site-status">{html.escape(built_short or "Research dashboard")}</span></div>',
             '<nav class="site-primary-nav" aria-label="Primary report navigation">']
        for fn, label in primary:
            if fn not in pages:
                continue
            cur = ' current' if fn == here_main else ''
            aria = ' aria-current="page"' if cur else ''
            cnt = '<span class="bm-count"></span>' if fn == 'bookmarks.html' else ''
            h.append(f'<a class="site-nav-link{cur}" href="{fn}"{aria}>{label}{cnt}</a>')
        # The old "More" dropdown sat inside the horizontally scrolling nav, which clipped its menu, so it never
        # appeared. Reference pages are now a plain, always-visible row of links under the main buttons.
        h.append('</nav><nav class="site-ref-nav" aria-label="Reference pages"><span class="ref-label">Reference</span>')
        for fn, label in secondary:
            if fn not in pages:
                continue
            cur = ' class="current" aria-current="page"' if fn == here_main else ''
            h.append(f'<a href="{fn}"{cur}>{label}</a>')
        h.append('</nav></div></header>')
        return ''.join(h)

    def pager(here):
        if pages[here].get('game'):
            seq = [g[0] for g in games]
            i = seq.index(here)
            prev = (seq[i - 1], 'Previous game: ' + pages[seq[i - 1]]['title'].split(' — ')[1] if ' — ' in pages[seq[i - 1]]['title'] else pages[seq[i - 1]]['title']) if i > 0 else ('games.html', 'All games')
            nxt = (seq[i + 1], 'Next game: ' + (pages[seq[i + 1]]['title'].split(' — ')[1] if ' — ' in pages[seq[i + 1]]['title'] else pages[seq[i + 1]]['title'])) if i + 1 < len(seq) else ('experts.html', 'What the Experts Say')
        else:
            i = order.index(here)
            prev = (order[i - 1], pages[order[i - 1]]['title']) if i > 0 else None
            nxt = (order[i + 1], pages[order[i + 1]]['title']) if i + 1 < len(order) else None
        h = ['<nav class="page-nav" aria-label="Previous and next page">']
        if prev: h.append(f'<a href="{prev[0]}"><span class="pn-dir">← Previous</span><span class="pn-title">{html.escape(prev[1])}</span></a>')
        if nxt: h.append(f'<a class="pn-next" href="{nxt[0]}"><span class="pn-dir">Next →</span><span class="pn-title">{html.escape(nxt[1])}</span></a>')
        h.append('</nav>')
        return ''.join(h)

    def bar(here):
        pg = pages[here]
        if here == 'index.html':
            return ''
        crumb = f'Part {pg["part"]}: {PART_NAME[pg["part"]]}' + (' · <a href="games.html">All games</a>' if pg.get('game') else '')
        return (f'<div class="site-bar"><span><a href="index.html">Platinum Rose · NFL Week {week} Intel</a></span>'
                f'<span class="crumb">{crumb}</span><span>{html.escape(built_short)}</span></div>')

    def page_title(here):
        if here == 'index.html':
            return f'Platinum Rose Week {week} Intel'
        return f'{re.sub(r"^⏰ *", "", pages[here]["title"])[:70]} · Week {week} Intel'

    disc = str(disclaimer) if disclaimer else ''
    for fn, pg in pages.items():
        holder = soup_of('<div></div>').div
        for el in pg['frag']:
            holder.append(copy.copy(el))
        if pg.get('game'):
            holder.insert(0, soup_of('<div class="game-room-kicker">Matchup · Market, context and evidence</div>').div)
        rewrite(holder, fn)
        body = (top_nav(fn) + '<div class="container">' + bar(fn) + ''.join(str(x) for x in holder.contents)
                + pager(fn) + disc + '</div><script src="assets/report.js"></script>')
        head = (f'<title>{html.escape(page_title(fn))}</title>\n<link rel="stylesheet" href="assets/report.css">\n')
        full = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n'
                + head + '</head>\n<body>\n' + body + '\n</body>\n</html>\n')
        (out / fn).write_text(full, encoding='utf-8')
        if fn == 'index.html':
            (out / '_artifact_index.html').write_text(head + body + '\n', encoding='utf-8')
    print(f'site: wrote {len(pages)} pages ({len(games)} game pages) to {out}')
    try:
        import build_single   # one self-contained .html for email attachments
        build_single.main(out)
    except Exception as e:
        print(f'single-file: skipped ({e})')
    return out


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
