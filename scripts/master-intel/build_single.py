#!/usr/bin/env python3
"""Single-file edition of the Master Intel client site: one self-contained .html (all pages, CSS, JS and
team-logo images inline) that opens from any machine, including as an email attachment, with no server.

Usage: python3 scripts/master-intel/build_single.py dist/nfl_week<N>_master_packet/site
Writes dist/nfl_week<N>_master_packet/Platinum_Rose_NFL_Week<N>_Intel.html

How it works: every page's content becomes a <section data-page="..."> in one document; links between pages
are rewritten to '#/page' or '#/page/anchor', and a small router shows one section at a time (the browser's
back button works). Bookmarks, filters and calculators run unchanged (bookmarks live in that browser).
build_site.py calls this after it writes the site.
"""
import html, re, sys
from pathlib import Path
from bs4 import BeautifulSoup

ROUTER = r"""
(function(){
  var secs = Array.prototype.slice.call(document.querySelectorAll('section[data-page]'));
  function byPage(p){ for (var i = 0; i < secs.length; i++){ if (secs[i].getAttribute('data-page') === p) return secs[i]; } return null; }
  function show(p, id){
    var s = byPage(p) || byPage('index');
    secs.forEach(function(x){ x.hidden = x !== s; });
    var main = (p.indexOf('game-') === 0) ? 'games' : s.getAttribute('data-page');
    document.querySelectorAll('.site-primary-nav a, .site-ref-nav a').forEach(function(a){
      var on = a.getAttribute('data-target') === main;
      a.classList.toggle('current', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var base = document.body.getAttribute('data-base') || 'Platinum Rose';
    document.title = s.getAttribute('data-page') === 'index' ? base : (s.getAttribute('data-title') || '') + ' · ' + base;
    var t = null;
    if (id){ try { t = s.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id)); } catch(e){ t = null; } }
    if (t){
      var q = t; while (q){ if (q.tagName === 'DETAILS') q.open = true; q = q.parentElement; }
      setTimeout(function(){ t.scrollIntoView({block: 'start'}); window.scrollBy(0, -170); t.classList.add('bm-flash'); }, 30);
    } else { window.scrollTo(0, 0); }
  }
  function route(){
    var h = decodeURIComponent(location.hash || '');
    var m = h.match(/^#\/([^\/]+)(?:\/(.+))?$/);
    if (m){ show(m[1], m[2]); return; }
    if (h.length > 1){
      var el = document.getElementById(h.slice(1));
      var s = el && el.closest('section[data-page]');
      if (s){ show(s.getAttribute('data-page'), h.slice(1)); return; }
    }
    show('index');
  }
  window.addEventListener('hashchange', route);
  route();
})();
"""


def main(site_dir):
    site = Path(site_dir)
    pages = sorted(p for p in site.glob('*.html') if not p.name.startswith('_'))
    order = ['index.html'] + [p.name for p in pages if p.name != 'index.html']
    css = (site / 'assets' / 'report.css').read_text(encoding='utf-8')
    js = (site / 'assets' / 'report.js').read_text(encoding='utf-8')
    names = {n[:-5] for n in order}

    def target(href, here):
        if href.startswith(('http:', 'https:', 'mailto:', 'tel:', 'javascript:', 'data:')):
            return None
        page, _, anc = href.partition('#')
        page = page.rsplit('/', 1)[-1]
        if page and not page.endswith('.html'):
            return None
        pg = page[:-5] if page else here
        if pg not in names:
            return None
        return f'#/{pg}' + (f'/{anc}' if anc else '')

    header = None; sections = []; week = '?'
    for name in order:
        soup = BeautifulSoup((site / name).read_text(encoding='utf-8'), 'html.parser')
        here = name[:-5]
        t = soup.title.get_text(strip=True) if soup.title else here
        title = re.sub(r'\s*·\s*Week \d+ Intel$', '', t)
        mw = re.search(r'Week (\d+)', t)
        if mw: week = mw.group(1)
        if header is None:
            header = soup.find('header', class_='site-header')
            for a in header.find_all('a', href=True):
                tg = target(a['href'], here)
                if tg:
                    a['data-target'] = a['href'].split('#')[0][:-5] or 'index'
                    a['href'] = tg
                    a['class'] = [c for c in a.get('class', []) if c != 'current']
                    if a.has_attr('aria-current'): del a['aria-current']
        cont = soup.find('div', class_='container')
        for a in cont.find_all('a', href=True):
            tg = target(a['href'], here)
            if tg: a['href'] = tg
        sections.append(f'<section data-page="{here}" data-title="{html.escape(title)}"' + ('' if name == 'index.html' else ' hidden') + '>'
                        + ''.join(str(x) for x in cont.contents) + '</section>')
    out = site.parent / f'Platinum_Rose_NFL_Week{week}_Intel.html'
    doc = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n'
           f'<title>Platinum Rose · NFL Week {week} Intel</title>\n<style>\n{css}\nsection[data-page][hidden]{{display:none !important}}\n</style>\n'
           f'</head>\n<body data-week="{week}" data-base="Platinum Rose · NFL Week {week} Intel">\n{header}\n<div class="container">\n' + '\n'.join(sections)
           + f'\n</div>\n<script>\n{js}\n</script>\n<script>{ROUTER}</script>\n</body>\n</html>\n')
    out.write_text(doc, encoding='utf-8')
    print(f'single-file: wrote {out} ({len(doc.encode("utf-8")) / 1e6:.2f} MB, {len(sections)} pages)')
    return out


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
