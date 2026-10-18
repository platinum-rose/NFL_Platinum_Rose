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
  
  function getBookmarksKey(){
    var wk = document.body.getAttribute('data-week') || '';
    return 'pr-bookmarks-w' + wk;
  }
  function loadBookmarks(){
    try {
      var a = JSON.parse(localStorage.getItem(getBookmarksKey()) || '[]');
      return Array.isArray(a) ? a : [];
    } catch(e){ return []; }
  }
  function saveBookmarks(a){
    try { localStorage.setItem(getBookmarksKey(), JSON.stringify(a)); } catch(e){}
  }
  function updateBmCountBadge(){
    var n = loadBookmarks().length;
    document.querySelectorAll('.bm-count').forEach(function(c){ c.textContent = n ? String(n) : ''; });
  }

  function hashStr(s){
    var x = 5381;
    for (var i = 0; i < s.length; i++){ x = ((x << 5) + x + s.charCodeAt(i)) | 0; }
    return (x >>> 0).toString(36);
  }
  function pageOf(el){
    var s = el && el.closest && el.closest('section[data-page]');
    return s ? s.getAttribute('data-page') : 'index';
  }
  function ctxOf(el){
    var d = el && el.closest && el.closest('details');
    var s = d && d.querySelector('summary');
    if (s) return (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70);
    var sec = el && el.closest && el.closest('section[data-page]');
    return sec ? (sec.getAttribute('data-title') || sec.getAttribute('data-page')) : 'Starred Picks';
  }

  function syncAllButtonStates(){
    var bms = loadBookmarks();
    var setOfPicks = {};
    var setOfIds = {};
    bms.forEach(function(b){
      if (b.text) setOfPicks[b.text.toLowerCase().trim()] = true;
      if (b.id) setOfIds[b.id] = true;
    });
    document.querySelectorAll('.bm-btn').forEach(function(btn){
      var p = (btn.getAttribute('data-pick') || '').toLowerCase().trim();
      var host = btn.closest('tr, .bm-item, .at-glance-item, details.rollup-box, details.leg, .sc-tile-wrap, .sc-pick');
      var hostId = host && host.id ? host.id : '';
      var hostText = '';
      if (!p && host){
        var cloned = host.cloneNode(true);
        cloned.querySelectorAll('.bm-btn, .tip-text, .sort-icon, .table-link').forEach(function(el){ el.remove(); });
        hostText = (cloned.textContent || '').replace(/\s+/g, ' ').toLowerCase().trim().slice(0, 160);
      }
      var isOn = (p && setOfPicks[p]) || (hostId && setOfIds[hostId]) || (hostText && setOfPicks[hostText]);
      btn.classList.toggle('on', !!isOn);
      btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      if (btn.classList.contains('ladder-rung')){
        var ic = btn.querySelector('.bm-icon');
        if (ic) ic.textContent = isOn ? '★' : '☆';
        return;
      }
      var iconSpan = btn.querySelector('.bm-icon');
      var textSpan = btn.querySelector('.bm-text');
      if (iconSpan && textSpan){
        iconSpan.textContent = isOn ? '★' : '☆';
        textSpan.textContent = isOn ? 'On Card' : '+ Card';
      } else {
        btn.innerHTML = '<span class="bm-icon">' + (isOn ? '★' : '☆') + '</span><span class="bm-text">' + (isOn ? 'On Card' : '+ Card') + '</span>';
      }
    });
  }

  function renderListInto(containerEl, isDrawer){
    if (!containerEl) return;
    var items = loadBookmarks();
    if (!items.length){
      containerEl.innerHTML = '<p class="muted-note">No picks bookmarked yet. Tap the ☆ star next to any pick, prop, or table row to build your weekend card.</p>';
      return;
    }
    var groups = {};
    var orderG = [];
    items.forEach(function(b){
      var cat = b.ctx || b.title || 'Starred Picks';
      if (!groups[cat]){ groups[cat] = []; orderG.push(cat); }
      groups[cat].push(b);
    });
    containerEl.innerHTML = '';
    orderG.forEach(function(cat){
      var g = document.createElement('div');
      g.className = 'bm-group';
      var h = document.createElement('h3');
      h.textContent = cat;
      g.appendChild(h);
      groups[cat].forEach(function(b){
        var r = document.createElement('div');
        r.className = 'bm-row';
        var l = document.createElement('a');
        var targetPage = b.page ? b.page.replace(/\.html$/, '') : 'index';
        l.href = '#/' + targetPage + '/' + b.id;
        l.innerHTML = '<strong>' + (b.text || '').replace(/\s+/g, ' ').trim().slice(0, 160) + '</strong>' +
                      (b.ctx ? '<span class="bm-ctx">' + b.ctx + '</span>' : '');
        l.addEventListener('click', function(ev){
          ev.preventDefault();
          if (isDrawer) closeCardDrawer();
          location.hash = '#/' + targetPage + '/' + b.id;
          show(targetPage, b.id);
        });
        var x = document.createElement('button');
        x.type = 'button';
        x.className = 'btn-toggle';
        x.style.padding = '4px 10px';
        x.style.fontSize = '12px';
        x.textContent = '✕ Remove';
        x.addEventListener('click', function(){
          saveBookmarks(loadBookmarks().filter(function(z){ return z.id !== b.id && z.text !== b.text; }));
          syncAllButtonStates();
          updateBmCountBadge();
          renderCardDrawer();
          renderBookmarksPage();
        });
        r.appendChild(l);
        r.appendChild(x);
        g.appendChild(r);
      });
      containerEl.appendChild(g);
    });
  }

  function renderCardDrawer(){
    renderListInto(document.getElementById('drawer-bm-list') || document.getElementById('bm-list'), true);
  }

  function renderBookmarksPage(){
    var sec = document.querySelector('section[data-page="bookmarks"]');
    if (!sec) return;
    var list = sec.querySelector('#bm-list') || document.getElementById('bm-list');
    renderListInto(list, false);
  }

  function show(p, id){
    var s = byPage(p) || byPage('index');
    secs.forEach(function(x){ x.hidden = x !== s; });
    var main = (p.indexOf('game-') === 0) ? 'games' : s.getAttribute('data-page');
    document.querySelectorAll('.site-primary-nav a, .site-ref-nav a').forEach(function(a){
      var on = a.getAttribute('data-target') === main;
      a.classList.toggle('current', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var base = document.body.getAttribute('data-base') || 'Platinum Rose';
    document.title = s.getAttribute('data-page') === 'index' ? base : (s.getAttribute('data-title') || '') + ' · ' + base;
    
    if (s.getAttribute('data-page') === 'bookmarks'){
      renderBookmarksPage();
    }

    var t = null;
    if (id){ try { t = s.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id)); } catch(e){ t = null; } }
    if (t){
      var q = t; while (q){ if (q.tagName === 'DETAILS') q.open = true; q = q.parentElement; }
      setTimeout(function(){ t.scrollIntoView({block: 'start'}); window.scrollBy(0, -170); t.classList.add('bm-flash'); }, 30);
    } else { window.scrollTo(0, 0); }
  }

  // Intra-modal navigation stack
  var modalHistory = [];
  function pushModalState(){
    var overlay = document.getElementById('matchup-modal-overlay');
    var titleEl = document.getElementById('modal-matchup-title');
    var bodyEl = document.getElementById('modal-matchup-body');
    var jumpLink = document.getElementById('modal-jump-link');
    if (overlay && overlay.classList.contains('active') && bodyEl){
      modalHistory.push({
        title: titleEl.innerHTML,
        body: bodyEl.innerHTML,
        jumpHref: jumpLink ? jumpLink.getAttribute('href') : '',
        scrollTop: bodyEl.scrollTop
      });
    }
  }
  function popModalState(){
    if (modalHistory.length === 0) return false;
    var prev = modalHistory.pop();
    var titleEl = document.getElementById('modal-matchup-title');
    var bodyEl = document.getElementById('modal-matchup-body');
    var jumpLink = document.getElementById('modal-jump-link');
    var backBtn = document.getElementById('modal-back-btn');
    titleEl.innerHTML = prev.title;
    bodyEl.innerHTML = prev.body;
    if (jumpLink) jumpLink.setAttribute('href', prev.jumpHref);
    bodyEl.scrollTop = prev.scrollTop;
    if (backBtn) backBtn.style.display = modalHistory.length > 0 ? 'inline-flex' : 'none';
    return true;
  }

  function openMatchupModal(gid, isPush){
    var m = String(gid).match(/game-[a-z]+-[a-z]+/i);
    var cleanId = m ? m[0].toLowerCase() : String(gid).replace(/^#[\/]?/, '').replace(/^.*[\/]([^\/]+)$/, '$1').replace(/\.html$/, '');
    var sec = document.querySelector('section[data-page="' + cleanId + '"]');
    var box = sec ? (sec.querySelector('.section-page') || sec) : (document.getElementById(cleanId + '-box') || document.getElementById(cleanId));
    if (!box && !sec) return false;
    var overlay = document.getElementById('matchup-modal-overlay');
    var titleEl = document.getElementById('modal-matchup-title');
    var bodyEl = document.getElementById('modal-matchup-body');
    var jumpLink = document.getElementById('modal-jump-link');
    var backBtn = document.getElementById('modal-back-btn');
    if (!overlay || !bodyEl) return false;

    if (isPush) {
      pushModalState();
    } else {
      modalHistory = [];
    }

    var titleHeader = sec ? sec.querySelector('h2.page-h') : (box ? (box.querySelector('summary') || box.querySelector('h2')) : null);
    titleEl.innerHTML = titleHeader ? (titleHeader.querySelector('.sum-text') ? titleHeader.querySelector('.sum-text').innerHTML : titleHeader.innerHTML) : 'Matchup Intel';
    bodyEl.innerHTML = box ? box.innerHTML : sec.innerHTML;

    // Remove any redundant page chrome inside modal body
    bodyEl.querySelectorAll('.page-nav, .legal-disclaimer, .site-bar, .back-to-top').forEach(function(el){ el.remove(); });

    // Open all details inside modal
    bodyEl.querySelectorAll('details').forEach(function(d){ d.open = true; });

    // Open external links in new window
    bodyEl.querySelectorAll('a[href^="http"]').forEach(function(a){
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });

    if (jumpLink){
      jumpLink.setAttribute('href', '#/' + cleanId);
      jumpLink.textContent = 'Go to Full Matchup Page ↗';
      jumpLink.onclick = function(ev){
        ev.preventDefault();
        closeMatchupModal();
        location.hash = '#/' + cleanId;
        show(cleanId);
      };
    }

    if (backBtn){
      backBtn.style.display = modalHistory.length > 0 ? 'inline-flex' : 'none';
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    return true;
  }

  function closeMatchupModal(){
    var overlay = document.getElementById('matchup-modal-overlay');
    if (overlay){
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    modalHistory = [];
    var backBtn = document.getElementById('modal-back-btn');
    if (backBtn) backBtn.style.display = 'none';
  }

  // Card Drawer logic for single-file portal
  function openCardDrawer(){
    var overlay = document.getElementById('card-drawer-overlay');
    if (overlay){
      renderCardDrawer();
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeCardDrawer(){
    var overlay = document.getElementById('card-drawer-overlay');
    if (overlay){
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Click event listener
  document.addEventListener('click', function(e){
    // External links always open new tab
    var ext = e.target.closest('a[href^="http://"], a[href^="https://"]');
    if (ext){
      ext.setAttribute('target', '_blank');
      ext.setAttribute('rel', 'noopener noreferrer');
      return;
    }

    // Modal controls
    if (e.target.closest('#modal-close-btn')){
      closeMatchupModal();
      return;
    }
    if (e.target.closest('#modal-back-btn')){
      popModalState();
      return;
    }
    var overlay = document.getElementById('matchup-modal-overlay');
    if (e.target === overlay){
      closeMatchupModal();
      return;
    }

    // Card drawer trigger controls
    if (e.target.closest('#card-builder-btn, #header-card-builder-btn, .header-card-builder-btn')){
      openCardDrawer();
      return;
    }
    if (e.target.closest('#card-drawer-close')){
      closeCardDrawer();
      return;
    }
    var drawerOverlay = document.getElementById('card-drawer-overlay');
    if (e.target === drawerOverlay){
      closeCardDrawer();
      return;
    }
    // Card Builder / Bookmarks button click
    var bmBtn = e.target.closest('.bm-btn');
    if (bmBtn){
      e.preventDefault();
      e.stopPropagation();
      var pick = (bmBtn.getAttribute('data-pick') || '').trim();
      var ctx = (bmBtn.getAttribute('data-ctx') || '').trim();
      var pg = (bmBtn.getAttribute('data-page') || '').trim();
      var hostEl = bmBtn.closest('tr, .bm-item, .at-glance-item, details.rollup-box, details.leg, .sc-tile-wrap, .sc-pick');
      if (!pick && hostEl){
        var cloned = hostEl.cloneNode(true);
        cloned.querySelectorAll('.bm-btn, .tip-text, .sort-icon, .table-link').forEach(function(el){ el.remove(); });
        pick = (cloned.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      }
      if (!pick) return;

      var bms = loadBookmarks();
      var idx = -1;
      for (var k = 0; k < bms.length; k++){
        if ((bms[k].text && bms[k].text.toLowerCase() === pick.toLowerCase()) || (hostEl && hostEl.id && bms[k].id === hostEl.id)){
          idx = k;
          break;
        }
      }
      if (idx >= 0){
        bms.splice(idx, 1);
      } else {
        var elId = (hostEl && hostEl.id) ? hostEl.id : ('bm-' + hashStr(pick));
        if (hostEl && !hostEl.id) hostEl.id = elId;
        bms.push({
          id: elId,
          text: pick,
          ctx: ctx || (hostEl ? ctxOf(hostEl) : 'Picks'),
          page: pg || (hostEl ? pageOf(hostEl) : 'index'),
          title: ctx || 'Card Pick',
          t: Date.now()
        });
      }
      saveBookmarks(bms);
      syncAllButtonStates();
      updateBmCountBadge();
      renderCardDrawer();
      renderBookmarksPage();
      return;
    }

    if (e.target.closest('#bm-clear, #drawer-bm-clear')){
      saveBookmarks([]);
      syncAllButtonStates();
      updateBmCountBadge();
      renderCardDrawer();
      renderBookmarksPage();
      return;
    }
    if (e.target.closest('#bm-copy, #drawer-bm-copy')){
      var cp = e.target.closest('#bm-copy, #drawer-bm-copy');
      var a = loadBookmarks();
      if (!a.length){
        return;
      }
      var txt = a.map(function(b){ return '- ' + (b.text || '').replace(/\s+/g, ' ').trim() + (b.ctx ? ' (' + b.ctx + ')' : ''); }).join('\n');
      if (navigator.clipboard){
        navigator.clipboard.writeText(txt).then(function(){
          var orig = cp.textContent;
          cp.textContent = 'Copied!';
          setTimeout(function(){ cp.textContent = orig; }, 1600);
        }).catch(function(){ window.prompt && window.prompt('Copy Card:', txt); });
      } else if (window.prompt){
        window.prompt('Copy Card:', txt);
      }
      return;
    }

    // Navigation links in header (Primary nav, Reference nav, Brand)
    var navLink = e.target.closest('.site-primary-nav a, .site-ref-nav a, a.site-brand');
    if (navLink){
      var tgt = navLink.getAttribute('data-target');
      if (!tgt){
        var href_ = navLink.getAttribute('href') || '';
        var m_ = href_.match(/^#\/([^\/]+)/);
        if (m_) tgt = m_[1];
      }
      if (tgt){
        e.preventDefault();
        location.hash = '#/' + tgt;
        show(tgt);
        return;
      }
    }

    // Check for Game write-up / pill / matchup links -> OPEN MODAL!
    var link = e.target.closest('a[href]');
    if (link){
      var href = link.getAttribute('href') || '';
      var text = (link.textContent || '').trim().toLowerCase();
      var isPill = link.classList.contains('at-glance-pill');
      var isGamesCard = link.classList.contains('game-card') || !!link.closest('.game-grid');
      var isWriteup = text.indexOf('write-up') >= 0 || text.indexOf('full matchup') >= 0 || isPill || isGamesCard || link.classList.contains('table-link');
      var gm = href.match(/(game-[a-z]+-[a-z]+)/i);

      var inHeader = link.closest('.site-header');
      var inPageNav = link.closest('.page-nav');

      // Internal modal jump links (e.g. href="#mu-phi-jax-why") -> scroll smoothly INSIDE the modal body
      var modalBody = link.closest('#modal-matchup-body');
      if (modalBody && href.charAt(0) === '#'){
        e.preventDefault();
        e.stopPropagation();
        var targetId = href.slice(1);
        var targetEl = modalBody.querySelector('#' + targetId) || modalBody.querySelector('[id*="' + targetId + '"]');
        if (targetEl){
          if (targetEl.tagName === 'DETAILS') targetEl.open = true;
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      if (gm && (isWriteup || isPill || isGamesCard) && !inHeader && !inPageNav){
        e.preventDefault();
        e.stopPropagation();
        var insideModal = !!link.closest('#modal-matchup-body');
        openMatchupModal(gm[1], insideModal);
        return;
      }
    }
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      closeMatchupModal();
      closeCardDrawer();
    }
  });

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

  window.addEventListener('hashchange', function(){
    route();
    syncAllButtonStates();
  });
  route();
  updateBmCountBadge();
  syncAllButtonStates();
  renderBookmarksPage();
  renderCardDrawer();
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
            brand_row = header.find('div', class_='site-brand-row')
            if brand_row and not brand_row.find('button', id='header-card-builder-btn'):
                btn_tag = BeautifulSoup('<button id="header-card-builder-btn" class="header-card-builder-btn" type="button" title="Open Weekend Card Drawer">📋 My Card <span class="bm-count"></span></button>', 'html.parser')
                brand_row.append(btn_tag.button)
        cont = soup.find('div', class_='container')
        for a in cont.find_all('a', href=True):
            tg = target(a['href'], here)
            if tg: a['href'] = tg
        sections.append(f'<section data-page="{here}" data-title="{html.escape(title)}"' + ('' if name == 'index.html' else ' hidden') + '>'
                        + ''.join(str(x) for x in cont.contents) + '</section>')
    
    modal_and_drawer_html = """
<div id="matchup-modal-overlay" class="matchup-modal-overlay" role="dialog" aria-modal="true">
  <div class="matchup-modal-dialog">
    <div class="matchup-modal-header">
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
        <button id="modal-back-btn" class="btn-toggle" style="display:none;padding:5px 12px;font-size:12px;font-weight:700;" type="button">← Back</button>
        <div id="modal-matchup-title" class="matchup-modal-title"></div>
      </div>
      <div class="matchup-modal-actions">
        <a id="modal-jump-link" class="btn-toggle" href="#">Go to Full Matchup Page ↗</a>
        <button id="modal-close-btn" class="btn-toggle btn-primary" type="button">✕ Close (Esc)</button>
      </div>
    </div>
    <div id="modal-matchup-body" class="matchup-modal-body"></div>
  </div>
</div>
<button id="card-builder-btn" class="card-builder-trigger" type="button" aria-label="Open Weekend Card Builder" title="View your bookmarked weekend card">
  <span style="font-size:16px;">📋</span>
  <span>My Card</span>
  <span class="bm-count"></span>
</button>

<div id="card-drawer-overlay" class="card-drawer-overlay" role="dialog" aria-modal="true">
  <div class="card-drawer-panel">
    <div class="card-drawer-header">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;">📋</span>
        <h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text);">Weekend Card Builder</h3>
        <span class="bm-count" style="display:inline-block;"></span>
      </div>
      <button id="card-drawer-close" class="btn-toggle btn-primary" type="button">✕ Close (Esc)</button>
    </div>
    <div class="card-drawer-body">
      <p class="muted-note" style="margin-top:0;">Picks, legs, props, and table rows you starred across this report. Saved in this browser for reviewing and placing your weekend card.</p>
      <div class="rollup-controls" style="margin-bottom:14px;">
        <button class="btn-toggle btn-primary" id="drawer-bm-copy" type="button">Copy Card to Clipboard</button>
        <button class="btn-toggle" id="drawer-bm-clear" type="button">Clear Card</button>
      </div>
      <div id="drawer-bm-list">
        <p class="muted-note">No picks bookmarked yet. Tap the ☆ star next to any pick, prop, or table row to build your weekend card.</p>
      </div>
    </div>
  </div>
</div>
"""

    extra_drawer_css = """
.card-builder-trigger {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 9998;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px 10px;
  background: var(--card);
  color: var(--accent);
  border: 1px solid var(--accent);
  border-right: none;
  border-radius: 10px 0 0 10px;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  font-weight: 800;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: transform 0.15s ease, background 0.15s ease;
}
.card-builder-trigger:hover {
  background: var(--raised);
  color: var(--primary-light);
  transform: translateY(-50%) translateX(-4px);
}
.header-card-builder-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(0, 210, 190, 0.12);
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.15s ease;
}
.header-card-builder-btn:hover {
  background: var(--accent);
  color: var(--on-accent);
}
@media (max-width: 640px) {
  .card-builder-trigger {
    top: auto;
    bottom: 16px;
    right: 16px;
    transform: none;
    border-radius: 999px;
    border-right: 1px solid var(--accent);
    flex-direction: row;
    padding: 9px 16px;
  }
  .card-builder-trigger:hover {
    transform: translateY(-2px);
  }
  .header-card-builder-btn {
    padding: 4px 10px;
    font-size: 11.5px;
  }
}
.bm-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 24px;
  padding: 3px 9px;
  border: 1.5px solid var(--accent);
  background: rgba(0, 210, 190, 0.12);
  color: var(--accent);
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  white-space: nowrap;
  vertical-align: middle;
  line-height: 1;
  transition: all 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
}
.bm-btn:hover {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
  transform: translateY(-1px);
}
.bm-btn.on {
  background: #facc15;
  color: #0f172a;
  border-color: #facc15;
  font-weight: 850;
  box-shadow: 0 0 10px rgba(250, 204, 21, 0.35);
}
.bm-btn.on:hover {
  background: #fde047;
  border-color: #fde047;
}
.bm-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.bm-btn .bm-icon { font-size: 13px; line-height: 1; }
.bm-btn .bm-text { font-size: 11px; font-weight: 800; line-height: 1; }
.at-glance-item { display: inline-flex; align-items: center; gap: 4px; background: var(--card); border: 1px solid var(--border); border-radius: 999px; padding: 2px 6px 2px 2px; }
.at-glance-item .at-glance-pill { border: none; background: transparent; padding: 4px 6px 4px 8px; }
.at-glance-item .pill-bm-btn { padding: 3px 8px; min-height: 22px; font-size: 10.5px; }
.sc-tile-wrap { display: flex; flex-direction: column; gap: 5px; }
.sc-tile-wrap .sc-tile { flex: 1; }
.sc-tile-btn { width: 100%; justify-content: center; padding: 6px 8px; font-size: 11.5px; border-radius: 8px; }
.sc-pick-btn { margin-left: 8px; padding: 3px 10px; font-size: 11.5px; }
.leg-bm-btn { padding: 3px 8px; min-height: 22px; font-size: 10.5px; }
.gc-popup-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 750;
  color: var(--accent);
  background: rgba(0, 210, 190, 0.1);
  border: 1px solid rgba(0, 210, 190, 0.25);
  width: fit-content;
  transition: all 0.15s ease;
}
.game-card:hover .gc-popup-badge {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}
"""

    out = site.parent / f'Platinum_Rose_NFL_Week{week}_Intel.html'
    doc = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n'
           f'<title>Platinum Rose · NFL Week {week} Intel</title>\n'
           '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏈</text></svg>">\n'
           f'<style>\n{css}\n{extra_drawer_css}\nsection[data-page][hidden]{{display:none !important}}\n*{{-webkit-user-select:text;user-select:text;}}\nbutton,.btn-toggle{{-webkit-user-select:none;user-select:none;}}\n</style>\n'
           f'</head>\n<body data-week="{week}" data-base="Platinum Rose · NFL Week {week} Intel">\n{header}\n<div class="container">\n' + '\n'.join(sections)
           + '\n</div>\n' + modal_and_drawer_html + f'\n<script>\n{js}\n</script>\n<script>{ROUTER}</script>\n</body>\n</html>\n')
    out.write_text(doc, encoding='utf-8')
    print(f'single-file: wrote {out} ({len(doc.encode("utf-8")) / 1e6:.2f} MB, {len(sections)} pages)')
    return out


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
