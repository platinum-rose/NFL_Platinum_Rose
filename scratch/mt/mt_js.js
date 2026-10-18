function initMasterTabs() {
  if (window.__mtInit) return;
  const c = document.querySelector('.container');
  if (!c || c.parentNode !== document.body) return;
  if (document.getElementById('sc-our-five')) return;
  if (!document.getElementById('section-rec-box') || !document.getElementById('section-1-box') || !document.getElementById('section-6-box') || !document.getElementById('section-9-box')) return;
  window.__mtInit = true;
  const TABS = [
    { id: 'picks', label: 'Picks', icon: '\u{1F3AF}' },
    { id: 'games', label: 'Games', icon: '\u{1F3C8}' },
    { id: 'props', label: 'Props', icon: '\u{1F9FE}' },
    { id: 'experts', label: 'Experts', icon: '\u{1F399}️' },
    { id: 'specials', label: 'Specials', icon: '\u{1F39F}️' },
    { id: 'market', label: 'Market', icon: '\u{1F4C8}' },
    { id: 'about', label: 'About', icon: '\u{1F4DA}' }
  ];
  const BOTTOM = ['picks', 'games', 'props', 'experts'];
  const txt = el => (el.textContent || '').trim();
  function marker(el) {
    const id = el.id || '';
    if (id === 'recommendations') return ['picks', 1];
    if (id === 'executive-summary') return ['picks', 2];
    if (el.tagName === 'H2' && /^1\./.test(txt(el))) return ['picks', 3];
    if (id === 'prop-card') return ['props', 1];
    if (id === 'teaser-matrix') return ['specials', 1];
    if (id === 'game-dossier') return ['games', 1];
    if (id === 'consensus-section') return ['experts', 1];
    if (el.tagName === 'H2' && /^8\./.test(txt(el))) return ['experts', 2];
    if (id === 'systems') return ['market', 1];
    if (id === 'how-card-built') return ['about', 1];
    return null;
  }
  const kids = Array.from(c.children);
  const groups = {};
  let cur = null;
  kids.forEach(k => {
    const m = marker(k);
    if (m) { cur = { rank: m[1], nodes: [] }; (groups[m[0]] = groups[m[0]] || []).push(cur); }
    if (cur) cur.nodes.push(k);
  });
  const wrap = document.createElement('div');
  wrap.className = 'mt-panels';
  const panels = {};
  TABS.forEach(t => {
    const p = document.createElement('section');
    p.className = 'mt-panel'; p.id = 'mt-panel-' + t.id;
    p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', 'mt-tab-' + t.id);
    p.setAttribute('inert', '');
    (groups[t.id] || []).sort((a, b) => a.rank - b.rank).forEach(g => g.nodes.forEach(n => p.appendChild(n)));
    panels[t.id] = p; wrap.appendChild(p);
  });
  c.appendChild(wrap);
  const slate = document.getElementById('slate-status-box');
  if (slate) panels.picks.insertBefore(slate, panels.picks.firstChild);
  // dissolve the outer "Section N" accordions: keep content and the id (old links still land), drop the box
  wrap.querySelectorAll('details.section-main').forEach(d => {
    const rc = d.querySelector(':scope > .rollup-content');
    const w = document.createElement('div');
    w.className = 'mt-section'; w.id = d.id;
    d.classList.forEach(cl => { if (cl === 'section-main' || /^secmain-/.test(cl)) w.classList.add(cl); });
    if (rc) while (rc.firstChild) w.appendChild(rc.firstChild);
    d.parentNode.replaceChild(w, d);
  });
  // "Every expert's picks this week" belongs with the experts, not the picks
  (function () {
    const a = document.getElementById('expert-best-bets');
    if (!a || !a.parentNode) return;
    const box = document.createElement('div');
    box.id = 'mt-expert-picks'; box.className = 'mt-section';
    let n = a;
    while (n) {
      const nx = n.nextElementSibling;
      const ok = n === a || n.tagName === 'H3' || n.tagName === 'P' || (n.tagName === 'DETAILS' && /^bx-/.test(n.id || ''));
      if (!ok) break;
      box.appendChild(n); n = nx;
    }
    panels.experts.appendChild(box);
    const jump = document.createElement('p');
    jump.className = 'mt-jump';
    jump.innerHTML = '<a href="#expert-best-bets">\u2B50 Every expert\'s picks this week, by name \u2193</a>';
    panels.experts.insertBefore(jump, panels.experts.firstChild);
  })();
  // the market board (line movement, steam/RLM, splits, all-games table) belongs on the Market tab
  (function () {
    const box = document.createElement('div');
    box.id = 'mt-market-board'; box.className = 'mt-section';
    ['line-moves', 'platinum-rose-board', 'board-defs'].forEach(id => { const e = document.getElementById(id); if (e) box.appendChild(e); });
    if (box.children.length) panels.market.insertBefore(box, panels.market.firstChild);
  })();
  // outer Expand/Collapse Section buttons have nothing left to act on
  wrap.querySelectorAll(':scope > section > .rollup-controls, .mt-panel > .rollup-controls').forEach(rc => {
    rc.querySelectorAll('button').forEach(b => { if (/secmain-/.test(b.getAttribute('onclick') || '')) b.remove(); });
    if (!rc.querySelector('button')) rc.remove();
  });
  wrap.querySelectorAll('a[href="#recommendations"]').forEach(a => {
    if (/Back to/i.test(txt(a))) { a.textContent = '⬆ Back to top'; a.setAttribute('href', '#mt-top'); }
  });
  const side = document.getElementById('side-toc'); if (side) side.remove();
  const tocb = document.querySelector('.toc-toggle'); if (tocb) tocb.remove();
  document.body.classList.add('mt-on');

  const wk = document.body.getAttribute('data-week') || '';
  const bar = document.createElement('header');
  bar.className = 'mt-bar'; bar.id = 'mt-bar';
  bar.innerHTML = '<div class="mt-brand"><span aria-hidden="true">\u{1F3C8}</span><span>Week ' + wk + ' Master Intel</span></div><div class="mt-tabs" role="tablist" aria-label="Report sections"></div>';
  const tl = bar.querySelector('.mt-tabs');
  const tabBtns = {};
  TABS.forEach(t => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mt-tab'; b.id = 'mt-tab-' + t.id; b.dataset.tab = t.id;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'mt-panel-' + t.id); b.setAttribute('aria-selected', 'false'); b.tabIndex = -1;
    b.innerHTML = '<span class="mt-ico" aria-hidden="true">' + t.icon + '</span><span>' + t.label + '</span>';
    tl.appendChild(b); tabBtns[t.id] = b;
  });
  const top = document.createElement('span'); top.id = 'mt-top';
  document.body.insertBefore(top, document.body.firstChild);
  document.body.insertBefore(bar, c);

  const bn = document.createElement('nav');
  bn.className = 'mt-bottom'; bn.setAttribute('aria-label', 'Report sections');
  const btmBtns = {};
  BOTTOM.forEach(id => {
    const t = TABS.find(x => x.id === id);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mt-bt'; b.dataset.tab = id;
    b.innerHTML = '<span class="mt-ico" aria-hidden="true">' + t.icon + '</span><span>' + t.label + '</span>';
    bn.appendChild(b); btmBtns[id] = b;
  });
  const more = document.createElement('button');
  more.type = 'button'; more.className = 'mt-bt mt-more'; more.setAttribute('aria-haspopup', 'dialog'); more.setAttribute('aria-expanded', 'false');
  more.innerHTML = '<span class="mt-ico" aria-hidden="true">⋯</span><span>More</span>';
  bn.appendChild(more);
  document.body.appendChild(bn);
  const sheet = document.createElement('div');
  sheet.className = 'mt-sheet'; sheet.id = 'mt-sheet'; sheet.hidden = true;
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'More sections');
  let sh = '<div class="mt-sheet-card"><div class="mt-sheet-title">More</div>';
  TABS.filter(t => BOTTOM.indexOf(t.id) < 0).forEach(t => { sh += '<button type="button" class="mt-sheet-btn" data-tab="' + t.id + '"><span class="mt-ico" aria-hidden="true">' + t.icon + '</span><span>' + t.label + '</span></button>'; });
  sh += '<button type="button" class="mt-sheet-close">Close</button></div>';
  sheet.innerHTML = sh;
  document.body.appendChild(sheet);

  let current = null;
  const scrollPos = {};
  const barH = () => bar.offsetHeight || 56;
  function closeSheet() { sheet.hidden = true; more.setAttribute('aria-expanded', 'false'); }
  function show(id, o) {
    o = o || {};
    if (!panels[id]) id = 'picks';
    if (current) scrollPos[current] = window.scrollY;
    const was = current;
    TABS.forEach(t => {
      const on = t.id === id, p = panels[t.id];
      p.classList.toggle('active', on);
      if (on) p.removeAttribute('inert'); else p.setAttribute('inert', '');
      tabBtns[t.id].setAttribute('aria-selected', on ? 'true' : 'false');
      tabBtns[t.id].tabIndex = on ? 0 : -1;
      if (btmBtns[t.id]) btmBtns[t.id].classList.toggle('active', on);
    });
    more.classList.toggle('active', BOTTOM.indexOf(id) < 0);
    sheet.querySelectorAll('.mt-sheet-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    current = id;
    closeSheet();
    try { sessionStorage.setItem('mt-tab', id); } catch (e) {}
    const b = tabBtns[id];
    if (b && tl.scrollWidth > tl.clientWidth) tl.scrollLeft = b.offsetLeft - (tl.clientWidth - b.offsetWidth) / 2;
    if (o.scroll !== false) {
      const y = o.top != null ? o.top : (was === id ? 0 : (scrollPos[id] || 0));
      window.scrollTo(0, y);
    }
    if (o.push !== false) {
      const h = '#tab-' + id;
      if (location.hash !== h) { try { history.pushState(null, '', h); } catch (e) {} }
    }
  }
  function reveal(hash) {
    const raw = (hash || '').replace(/^#/, '');
    if (!raw) return false;
    if (raw === 'mt-top') { window.scrollTo(0, 0); return true; }
    const mt = raw.match(/^tab-([a-z]+)$/);
    if (mt) { show(mt[1], { push: false }); if (mt[1] === 'games' && typeof closeGame === 'function') closeGame(false); return true; }
    const el = document.getElementById(raw);
    if (!el) return false;
    const p = el.closest('.mt-panel');
    if (!p) return false;
    show(p.id.replace('mt-panel-', ''), { push: false, scroll: false });
    const gb = el.closest('[id^="game-"][id$="-box"]') || (/^game-.*-box$/.test(raw) ? el : null);
    if (gb && p.id === 'mt-panel-games') { openGame(gb, false); window.scrollTo(0, 0); return true; }
    else if (p.id === 'mt-panel-games' && !el.closest('[id^="game-"]')) { closeGame(false); }
    let n = el;
    while (n && n !== document.body) { if (n.tagName === 'DETAILS') n.open = true; n = n.parentElement; }
    requestAnimationFrame(() => {
      const y = el.getBoundingClientRect().top + window.scrollY - barH() - 8;
      window.scrollTo(0, Math.max(0, y));
    });
    el.classList.remove('target-pulse'); void el.offsetWidth; el.classList.add('target-pulse');
    setTimeout(() => el.classList.remove('target-pulse'), 1800);
    return true;
  }
  // ---- Games tab: grid of cards <-> one game at a time ----
  const gp = panels.games;
  const gboxes = Array.from(gp.querySelectorAll('[id^="game-"][id$="-box"]')).filter(x => x.closest('.mt-panel') === gp);
  const nav = document.createElement('div');
  nav.className = 'gg-nav';
  nav.innerHTML = '<button type="button" data-g="back">\u2190 All games</button><span class="gg-spacer"></span><button type="button" data-g="prev">\u2039 Prev</button><button type="button" data-g="next">Next \u203A</button>';
  const grid = document.getElementById('gg-grid');
  let openBox = null;
  function gcards() { return Array.from(document.querySelectorAll('#gg-grid .gg-card')); }
  function applyGrid() {
    const f = (document.querySelector('.gg-chip.active') || {}).dataset; const day = f ? f.f : 'all';
    const sel = document.getElementById('gg-sort'); const mode = sel ? sel.value : 'kick';
    const cs = gcards();
    cs.forEach(c => { c.hidden = !(day === 'all' || c.dataset.day === day); });
    const parent = cs[0] && cs[0].parentNode;
    if (parent) cs.slice().sort((a, b) => {
      const fa = a.classList.contains('gg-final') ? 1 : 0, fb = b.classList.contains('gg-final') ? 1 : 0;
      if (fa !== fb) return fa - fb;
      return mode === 'conf' ? (parseFloat(b.dataset.conf) - parseFloat(a.dataset.conf)) || (a.dataset.kick - b.dataset.kick) : a.dataset.kick - b.dataset.kick;
    }).forEach(c => parent.appendChild(c));
  }
  function openGame(box, push) {
    if (!box) return;
    gboxes.forEach(b => { b.hidden = b !== box; });
    box.hidden = false;
    if (box.tagName === 'DETAILS') box.open = true;
    openBox = box;
    gp.classList.add('gg-detail');
    gp.querySelectorAll('.gg-off').forEach(x => x.classList.remove('gg-off'));
    for (let n = box; n && n !== gp; n = n.parentNode) Array.from(n.parentNode.children).forEach(s => { if (s !== n && s !== nav) s.classList.add('gg-off'); });
    const gids = gboxes.map(b => b.id);
    const i = gids.indexOf(box.id);
    nav.querySelector('[data-g=prev]').disabled = i <= 0;
    nav.querySelector('[data-g=next]').disabled = i >= gids.length - 1;
    if (push !== false) { try { history.pushState(null, '', '#' + box.id); } catch (e) {} window.scrollTo(0, 0); }
  }
  function closeGame(push) {
    gp.classList.remove('gg-detail'); openBox = null;
    gp.querySelectorAll('.gg-off').forEach(x => x.classList.remove('gg-off'));
    gboxes.forEach(b => { b.hidden = true; });
    if (push !== false) { try { history.pushState(null, '', '#tab-games'); } catch (e) {} window.scrollTo(0, 0); }
  }
  if (grid && gboxes.length) {
    const h6 = Array.from(gp.querySelectorAll('h2')).find(h => /^6\./.test((h.textContent || '').trim()));
    if (h6 && h6.parentNode) h6.parentNode.insertBefore(grid, h6.nextSibling);
    gp.insertBefore(nav, gp.firstChild);
    gboxes.forEach(b => { b.hidden = true; });
    const gh = gp.querySelector(':scope > .rollup-controls'); if (gh) gh.style.display = 'none';
    grid.addEventListener('click', e => {
      const ch = e.target.closest('.gg-chip');
      if (ch) { grid.querySelectorAll('.gg-chip').forEach(x => x.classList.toggle('active', x === ch)); applyGrid(); return; }
      const c = e.target.closest('.gg-card');
      if (c) { e.preventDefault(); const bx = document.getElementById(c.getAttribute('href').slice(1)); if (bx) openGame(bx); }
    });
    grid.addEventListener('change', e => { if (e.target.id === 'gg-sort') applyGrid(); });
    nav.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.g === 'back') { closeGame(); return; }
      const i = gboxes.indexOf(openBox) + (b.dataset.g === 'next' ? 1 : -1);
      if (gboxes[i]) openGame(gboxes[i]);
    });
    applyGrid();
  }
  const _show = show;
  window.__mtOnHash = reveal;
  window.mtShow = show;
  tl.addEventListener('click', e => { const b = e.target.closest('.mt-tab'); if (b) show(b.dataset.tab, { top: b.dataset.tab === current ? 0 : undefined }); });
  tl.addEventListener('keydown', e => {
    const ids = TABS.map(t => t.id); let i = ids.indexOf(current);
    if (e.key === 'ArrowRight') i = (i + 1) % ids.length;
    else if (e.key === 'ArrowLeft') i = (i - 1 + ids.length) % ids.length;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = ids.length - 1;
    else return;
    e.preventDefault(); show(ids[i], { scroll: false }); tabBtns[ids[i]].focus();
  });
  bn.addEventListener('click', e => {
    const b = e.target.closest('.mt-bt'); if (!b) return;
    if (b === more) { sheet.hidden = false; more.setAttribute('aria-expanded', 'true'); const f = sheet.querySelector('.mt-sheet-btn'); if (f) f.focus(); return; }
    show(b.dataset.tab, { top: b.dataset.tab === current ? 0 : undefined });
  });
  sheet.addEventListener('click', e => {
    if (e.target === sheet || e.target.closest('.mt-sheet-close')) { closeSheet(); more.focus(); return; }
    const b = e.target.closest('.mt-sheet-btn'); if (b) show(b.dataset.tab, { top: 0 });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { closeSheet(); more.focus(); } });
  window.addEventListener('popstate', () => { if (!location.hash) show('picks', { push: false }); else reveal(location.hash); });
  let start = 'picks';
  try { start = sessionStorage.getItem('mt-tab') || 'picks'; } catch (e) {}
  if (!(location.hash && reveal(location.hash))) {
    show(start, { push: false, scroll: false });
    try { history.replaceState(null, '', '#tab-' + current); } catch (e) {}
  }
}
