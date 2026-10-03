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

# page file, section box id, short nav title, part
PAGES = [
    ('index.html',      'section-rec-box',  'Our Picks',              'A'),
    ('ranked.html',     'section-1-box',    'Every Bet, Ranked',      'A'),
    ('props.html',      'section-2-box',    'Player Props',           'A'),
    ('teasers.html',    'section-3-box',    'Teaser Bets',            'A'),
    ('underdogs.html',  'section-4-box',    'Underdog Upset Ticket',  'A'),
    ('survivor.html',   'section-5-box',    'Survivor Pool',          'A'),
    ('glance.html',     'section-exec-box', 'The Week at a Glance',   'B'),
    ('games.html',      'section-6-box',    'Game-by-Game',           'B'),
    ('experts.html',    'section-7-box',    'What the Experts Say',   'B'),
    ('registry.html',   'section-8-box',    'Expert Pick Registry',   'C'),
    ('trends.html',     'section-9-box',    'Betting Trends',         'C'),
    ('card-build.html', 'section-10-box',   'How the Card Was Built', 'C'),
    ('sources.html',    'section-11-box',   'Sources & Data Notes',   'C'),
]
PART_NAME = {'A': 'What to bet', 'B': 'Why we like them', 'C': 'Reference'}

SITE_CSS = r"""
/* ---- multi-page site layer (build_site.py) ---- */
:root{color-scheme:light;--on-primary:#ffffff}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;--on-primary:#0f172a}}
:root[data-theme="dark"]{--on-primary:#0f172a}
.rollup-controls,.table-filter{flex-wrap:wrap}
.site-bar{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 16px;margin:0 0 18px;padding-bottom:10px;border-bottom:1px solid var(--border);font-size:12.5px;color:var(--muted)}
.site-bar a{color:var(--primary);text-decoration:none;font-weight:700}
.site-bar .crumb{letter-spacing:.06em;text-transform:uppercase;font-weight:700;font-size:11px}
.side-toc a.current{background:var(--highlight);font-weight:700;box-shadow:inset 3px 0 0 var(--accent)}
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
@media (min-width:1300px){.side-toc{display:block;top:16px}.toc-toggle{display:none}.container{margin-left:276px !important;margin-right:auto !important}}
@media (max-width:640px){body{padding:56px 16px 24px !important}.container{padding:20px 16px !important;border-radius:10px}h1{font-size:22px}.page-nav{grid-template-columns:1fr}.page-nav .pn-next{grid-column:1}}
"""


def soup_of(fragment):
    return BeautifulSoup(fragment, 'html.parser')


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
    css += SITE_CSS
    (out / 'assets' / 'report.css').write_text(css, encoding='utf-8')
    script = soup.body.find('script', recursive=False)
    (out / 'assets' / 'report.js').write_text(script.string if script else '', encoding='utf-8')

    title = soup.title.get_text(strip=True) if soup.title else 'Master Intel Report'
    wk = re.search(r'Week (\d+)', title)
    week = wk.group(1) if wk else '?'
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
        if fn == 'index.html':
            frag = [copy.copy(h) for h in header] + frag
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
    tips = {}
    if side:
        for a in side.find_all('a'):
            tips[a.get('href', '')[1:]] = (a.get('data-tip', ''), (a.find(class_='toc-ico') or a).get_text(strip=True)[:2])

    def side_nav(here):
        here_main = 'games.html' if here.startswith('game-') else here
        h = ['<div class="side-toc" id="side-toc"><div class="side-toc-title">Week ' + week + ' Intel</div>']
        last = None
        for fn, box, short, part in PAGES:
            if fn not in pages:
                continue
            if part != last:
                h.append(f'<div class="side-part">Part {part}: {PART_NAME[part]}</div>'); last = part
            tip, ico = tips.get(box, ('', ''))
            cur = ' class="current" aria-current="page"' if fn == here_main else ''
            h.append(f'<a href="{fn}"{cur} data-tip="{html.escape(tip, quote=True)}"><span class="toc-ico">{ico}</span><span class="toc-txt">{html.escape(short)}</span></a>')
        h.append('</div><button class="toc-toggle" onclick="document.body.classList.toggle(\'toc-open\')" type="button">☰ Contents</button>')
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
        rewrite(holder, fn)
        body = (side_nav(fn) + '<div class="container">' + bar(fn) + ''.join(str(x) for x in holder.contents)
                + pager(fn) + disc + '</div><script src="assets/report.js"></script>')
        head = (f'<title>{html.escape(page_title(fn))}</title>\n<link rel="stylesheet" href="assets/report.css">\n')
        full = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n'
                + head + '</head>\n<body>\n' + body + '\n</body>\n</html>\n')
        (out / fn).write_text(full, encoding='utf-8')
        if fn == 'index.html':
            (out / '_artifact_index.html').write_text(head + body + '\n', encoding='utf-8')
    print(f'site: wrote {len(pages)} pages ({len(games)} game pages) to {out}')
    return out


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
