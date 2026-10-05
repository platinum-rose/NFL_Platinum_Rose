
function toggleRollups(groupClass, expand) {
  const selector = groupClass ? 'details.' + groupClass : 'details.rollup-box';
  document.querySelectorAll(selector).forEach(d => {
    d.open = expand;
  });
}

function toggleAllMainSections(expand) {
  document.querySelectorAll('details.section-main').forEach(d => {
    d.open = expand;
  });
}

function toggleAllRollups(expand) {
  document.querySelectorAll('details.rollup-box').forEach(d => {
    d.open = expand;
  });
}

function openTargetDetails(hash) {
  if (!hash || hash === '#') return;
  const targetId = hash.replace('#', '');
  const targetEl = document.getElementById(targetId);
  if (targetEl) {
    let curr = targetEl;
    while (curr && curr !== document.body) {
      if (curr.tagName && curr.tagName.toLowerCase() === 'details') {
        curr.open = true;
      }
      curr = curr.parentElement;
    }
    setTimeout(() => {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
}

function parseCellValue(cell) {
  if (!cell) return { type: 'empty', val: '' };
  const ds = cell.querySelector('[data-sort]');
  if (ds) return { type: 'num', val: parseFloat(ds.getAttribute('data-sort')) };
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('.tip-text').forEach(el => el.remove());
  const txt = (clone.innerText || clone.textContent || '').trim();
  if (!txt) return { type: 'empty', val: '' };

  // 1. Confidence Index (e.g. "96 / 100", "88 / 100")
  const mConf = txt.match(/(\d+(?:\.\d+)?)\s*\/\s*100/i);
  if (mConf) return { type: 'num', val: parseFloat(mConf[1]) };

  // 2. Trench Mismatch SD (e.g. "+3.08 SD", "LAR +3.08 SD", "TB +2.10 SD")
  const mSD = txt.match(/([+-]?\d+(?:\.\d+)?)\s*SD/i);
  if (mSD) return { type: 'num', val: parseFloat(mSD[1]) };

  // 3. Units (e.g. "4 Units", "2.0 Units", "0.5 Units", "4U")
  const mUnit = txt.match(/(\d+(?:\.\d+)?)\s*(?:Units?|U\b)/i);
  if (mUnit) return { type: 'num', val: parseFloat(mUnit[1]) };

  // 4. Source count consensus (e.g. "5-Source Consensus", "5-Show")
  const mShow = txt.match(/(\d+)[-\s](?:Source|Show)/i);
  if (mShow) return { type: 'num', val: parseFloat(mShow[1]) };

  // 5. Market Edge with sign (e.g. "+5.4 on IND", "+2.2", "-4.6")
  const mEdge = txt.match(/([+-]\d+(?:\.\d+)?)/);
  if (mEdge) return { type: 'num', val: parseFloat(mEdge[1]) };

  // 6. Odds / Payout (e.g. "+765", "+645", "+371", "+150")
  const mOdds = txt.match(/[+](\d(2, 5))/);
  if (mOdds) return { type: 'num', val: parseFloat(mOdds[1]) };

  // 7. General leading number (e.g. "49.1", "25.2", "-1.3")
  const mNum = txt.match(/^([+-]?\d+(?:\.\d+)?)/);
  if (mNum) return { type: 'num', val: parseFloat(mNum[1]) };

  return { type: 'str', val: txt.toLowerCase() };
}

function initSortableTables() {
  document.querySelectorAll('table.sortable-table').forEach(table => {
    const thead = table.querySelector('thead');
    if (!thead) return;
    const headerRow = thead.querySelector('tr');
    if (!headerRow) return;
    const headers = headerRow.querySelectorAll('th');
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    headers.forEach((th, colIdx) => {
      th.classList.add('sortable-header');
      const sortIcon = document.createElement('span');
      sortIcon.className = 'sort-icon';
      sortIcon.setAttribute('aria-hidden', 'true');
      sortIcon.innerHTML = ' ↕';
      th.appendChild(sortIcon);

      th.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;

        const currentDir = th.getAttribute('data-sort-dir');
        let newDir = 'desc';
        if (!currentDir) {
          const sampleRow = tbody.querySelector('tr');
          const sampleCell = sampleRow ? sampleRow.children[colIdx] : null;
          const parsed = parseCellValue(sampleCell);
          newDir = (parsed.type === 'num') ? 'desc' : 'asc';
        } else {
          newDir = currentDir === 'desc' ? 'asc' : 'desc';
        }

        headers.forEach(h => {
          h.removeAttribute('data-sort-dir');
          const icon = h.querySelector('.sort-icon');
          if (icon) icon.innerHTML = ' ↕';
        });

        th.setAttribute('data-sort-dir', newDir);
        sortIcon.innerHTML = newDir === 'desc' ? ' ▼' : ' ▲';

        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((rowA, rowB) => {
          const cellA = rowA.children[colIdx];
          const cellB = rowB.children[colIdx];
          const valA = parseCellValue(cellA);
          const valB = parseCellValue(cellB);

          let cmp = 0;
          if (valA.type === 'num' && valB.type === 'num') {
            cmp = valA.val - valB.val;
          } else if (valA.type === 'num') {
            cmp = 1;
          } else if (valB.type === 'num') {
            cmp = -1;
          } else if (valA.type === 'empty' && valB.type === 'empty') {
            cmp = 0;
          } else if (valA.type === 'empty') {
            cmp = -1;
          } else if (valB.type === 'empty') {
            cmp = 1;
          } else {
            cmp = String(valA.val).localeCompare(String(valB.val));
          }

          return newDir === 'desc' ? -cmp : cmp;
        });

        rows.forEach(r => tbody.appendChild(r));
      });
    });
  });
}

function initGroupSort() {
  document.querySelectorAll('button.group-sort').forEach(btn => {
    if (btn.dataset.ready) return;
    btn.dataset.ready = '1';
    btn.addEventListener('click', () => {
      const sc = document.getElementById(btn.dataset.scope);
      if (!sc) return;
      const key = btn.dataset.key;
      const items = Array.from(sc.querySelectorAll(':scope > .sort-group'));
      items.sort((a, b) => key === 'conf' ? (parseFloat(b.dataset.conf) - parseFloat(a.dataset.conf)) : String(a.dataset[key]).localeCompare(String(b.dataset[key])));
      items.forEach(i => sc.appendChild(i));
      btn.parentElement.querySelectorAll('button.group-sort').forEach(b => b.classList.toggle('btn-primary', b === btn));
    });
  });
}

function initSideTips() {
  const tip = document.createElement('div');
  tip.className = 'side-tip';
  document.body.appendChild(tip);
  document.querySelectorAll('.side-toc a[data-tip]').forEach(a => {
    a.addEventListener('mouseenter', () => {
      const r = a.getBoundingClientRect();
      tip.textContent = a.dataset.tip;
      tip.style.display = 'block';
      const top = Math.min(r.top, window.innerHeight - tip.offsetHeight - 8);
      tip.style.top = Math.max(8, top) + 'px';
      tip.style.left = (r.right + 12) + 'px';
      if (r.right + 12 + tip.offsetWidth > window.innerWidth) { tip.style.left = Math.max(8, r.left) + 'px'; tip.style.top = (r.bottom + 6) + 'px'; }
    });
    a.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  });
}

function initPickSheet() {
  const boxes = Array.from(document.querySelectorAll('input.sc-pick'));
  if (!boxes.length) return;
  const key = 'sc-picks:' + document.title;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { saved = null; }
  boxes.forEach(b => { b.checked = saved ? saved.includes(b.dataset.side) : b.dataset.default === '1'; });
  const update = () => {
    const on = boxes.filter(b => b.checked).map(b => b.dataset.side);
    const c = document.getElementById('pick-count');
    if (c) { c.textContent = on.length + ' of 5 picked' + (on.length > 5 ? ' (too many)' : ''); c.style.color = on.length === 5 ? '' : 'var(--warn)'; }
    const l = document.getElementById('pick-list');
    if (l) l.textContent = on.join(' · ');
    try { localStorage.setItem(key, JSON.stringify(on)); } catch (e) {}
  };
  boxes.forEach(b => b.addEventListener('change', update));
  window.copyPicks = () => {
    const on = boxes.filter(b => b.checked).map(b => b.dataset.side).join('\n');
    const done = () => { const c = document.getElementById('pick-count'); if (c) c.textContent = 'Copied: ' + c.textContent; };
    if (navigator.clipboard) navigator.clipboard.writeText(on).then(done).catch(() => { window.prompt && window.prompt('Copy:', on); });
  };
  window.resetPicks = () => { boxes.forEach(b => { b.checked = b.dataset.default === '1'; }); update(); };
  update();
}

function initTableFilters() {
  document.querySelectorAll('.table-filter').forEach(bar => {
    if (bar.dataset.ready) return;
    bar.dataset.ready = '1';
    const tables = () => {
      if (bar.dataset.scope) {
        const sc = document.getElementById(bar.dataset.scope);
        return sc ? Array.from(sc.querySelectorAll('table')) : [];
      }
      let el = bar.nextElementSibling;
      while (el && el.tagName !== 'TABLE' && !el.querySelector('table')) el = el.nextElementSibling;
      return el ? [el.tagName === 'TABLE' ? el : el.querySelector('table')] : [];
    };
    bar.querySelectorAll('button[data-filter]').forEach(btn => btn.addEventListener('click', () => {
      bar.querySelectorAll('button[data-filter]').forEach(b => b.classList.toggle('btn-primary', b === btn));
      const want = btn.dataset.filter.toLowerCase();
      tables().forEach(t => {
        const ths = Array.from(t.querySelectorAll('thead th'));
        const idx = ths.findIndex(th => {
          const c = th.cloneNode(true);
          c.querySelectorAll('.tip-text,.sort-icon').forEach(e => e.remove());
          return c.textContent.trim().toLowerCase() === (bar.dataset.col || '').toLowerCase();
        });
        let shown = 0;
        t.querySelectorAll('tbody tr').forEach(tr => {
          const cell = idx >= 0 ? tr.children[idx] : null;
          const v = cell ? cell.textContent.trim().toLowerCase() : '';
          const ok = want === 'all' || idx < 0 || v === want;
          tr.style.display = ok ? '' : 'none';
          if (ok) shown++;
        });
        const grp = t.closest('.pool-group, .filter-group');
        if (grp) { grp.style.display = shown ? '' : 'none'; if (grp.tagName === 'DETAILS' && want !== 'all' && shown) grp.open = true; }
      });
    }));
  });
}

window.addEventListener('hashchange', () => openTargetDetails(location.hash));
window.addEventListener('DOMContentLoaded', () => {
  if (location.hash) {
    openTargetDetails(location.hash);
  }
  initSortableTables();
  initTableFilters();
  initGroupSort();
  initSideTips();
  initPickSheet();
});
if (document.readyState !== 'loading') {
  initSortableTables();
  initTableFilters();
  initGroupSort();
  initSideTips();
  initPickSheet();
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (link) {
    const hash = link.getAttribute('href');
    if (hash && hash !== '#executive-board') {
      openTargetDetails(hash);
    }
  }
});

/* ---- bookmarks, teaser calculator (site_extras.py) ---- */
(function(){
  var wk = '4';
  var KEY = 'pr-bookmarks-w' + wk;
  function load(){ try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch(e){ return []; } }
  function save(a){ try { localStorage.setItem(KEY, JSON.stringify(a)); } catch(e){} }
  function hash(s){ var x = 5381; for (var i = 0; i < s.length; i++){ x = ((x << 5) + x + s.charCodeAt(i)) | 0; } return (x >>> 0).toString(36); }
  var page = (location.pathname.split('/').pop() || 'index.html');
  if (page.indexOf('.html') < 0) page = 'index.html';
  function clean(t){ return (t || '').replace(/\s+/g, ' ').trim(); }
  // single-file edition: every page is a <section data-page> in one document
  var SINGLE = !!document.querySelector('[data-page]');
  function pageOf(el){ var s = el.closest && el.closest('[data-page]'); return s ? s.getAttribute('data-page') : page; }
  function hrefOf(b){ return SINGLE ? '#/' + b.page.replace(/\.html$/, '') + '/' + b.id : b.page + '#' + b.id; }
  function ctxOf(el){
    var d = el.closest('details'); var s = d && d.querySelector('summary');
    if (s) return clean(s.textContent).slice(0, 90);
    var h = document.querySelector('.container h2'); return h ? clean(h.textContent).slice(0, 90) : document.title;
  }
  function count(){ var n = load().length; document.querySelectorAll('.bm-count').forEach(function(c){ c.textContent = n ? String(n) : ''; }); }
  function setup(){
    var marks = {}; load().forEach(function(b){ marks[b.id] = 1; });
    var els = document.querySelectorAll('.container table tbody tr, .container .bm-item');
    els.forEach(function(el){
      if (el.closest('.no-bm') || el.closest('#bm-list')) return;
      var text = clean(el.textContent);
      if (!text || text.length < 3) return;
      var host = el.matches('tr') ? el.querySelector('td') : (el.querySelector('.bm-host') || el.querySelector('.sc-title') || el);
      if (!host) return;
      var pg = pageOf(el);
      if (!el.id) el.id = 'bm-' + hash(pg + '|' + text.slice(0, 200));
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bm-btn' + (marks[el.id] ? ' on' : '');
      b.setAttribute('aria-label', 'Bookmark for review'); b.setAttribute('aria-pressed', marks[el.id] ? 'true' : 'false');
      b.title = 'Bookmark for review';
      b.addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        var a = load(), i = -1;
        for (var k = 0; k < a.length; k++){ if (a[k].id === el.id && a[k].page === pg){ i = k; break; } }
        if (i >= 0){ a.splice(i, 1); b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
        else { var sec = SINGLE && el.closest('[data-page]'); a.push({id: el.id, page: pg, text: text.slice(0, 220), ctx: ctxOf(el), title: sec ? (sec.getAttribute('data-title') || pg) : document.title.replace(/ · Week.*$/, ''), t: Date.now()});
               b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
        save(a); count();
        var lst = document.getElementById('bm-list'); if (lst) render(lst);
      });
      host.insertBefore(b, host.firstChild);
    });
    count();
    if (location.hash.length > 1){
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t){ if (t.tagName === 'DETAILS') t.open = true; var p = t.parentElement; while (p){ if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; }
              t.scrollIntoView({block: 'center'}); t.classList.add('bm-flash'); }
    }
    var list = document.getElementById('bm-list');
    if (list) render(list);
  }
  function render(list){
    var a = load();
    if (!a.length){ list.innerHTML = '<p class="muted-note">No bookmarks yet. Tap ☆ next to any pick, leg or table row.</p>'; return; }
    var groups = {}, orderG = [];
    a.forEach(function(b){ if (!groups[b.page]){ groups[b.page] = []; orderG.push(b.page); } groups[b.page].push(b); });
    list.innerHTML = '';
    orderG.forEach(function(pg){
      var g = document.createElement('div'); g.className = 'bm-group';
      var h = document.createElement('h3'); h.textContent = groups[pg][0].title || pg; g.appendChild(h);
      groups[pg].forEach(function(b){
        var r = document.createElement('div'); r.className = 'bm-row';
        var l = document.createElement('a'); l.href = hrefOf(b); l.textContent = b.text;
        var c = document.createElement('span'); c.className = 'bm-ctx'; c.textContent = b.ctx || ''; l.appendChild(c);
        var x = document.createElement('button'); x.type = 'button'; x.className = 'btn-toggle'; x.textContent = 'Remove';
        x.addEventListener('click', function(){ save(load().filter(function(z){ return !(z.id === b.id && z.page === b.page); })); count(); render(list); });
        r.appendChild(l); r.appendChild(x); g.appendChild(r);
      });
      list.appendChild(g);
    });
  }
  function wire(){
    var c = document.getElementById('bm-clear'), cp = document.getElementById('bm-copy'), list = document.getElementById('bm-list');
    if (c) c.addEventListener('click', function(){ save([]); count(); if (list) render(list); });
    if (cp) cp.addEventListener('click', function(){
      var txt = load().map(function(b){ return '- ' + b.text + ' (' + (b.title || b.page) + ')'; }).join('\n');
      try { navigator.clipboard.writeText(txt); cp.textContent = 'Copied'; } catch(e){ cp.textContent = 'Copy failed'; }
      setTimeout(function(){ cp.textContent = 'Copy list as text'; }, 1600);
    });
  }
  function calc(){
    var box = document.getElementById('teaser-calc'); if (!box) return;
    function dec(o){ o = +o; return o > 0 ? 1 + o / 100 : 1 + 100 / -o; }
    function comb(n, k){ if (k < 0 || k > n) return 0; var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
    function run(){
      var p = (+document.getElementById('tc-p').value || 74) / 100;
      var o2 = document.getElementById('tc-2').value, o3 = document.getElementById('tc-3').value, o4 = document.getElementById('tc-4').value;
      var rows = [['2-team', 2, 2, o2], ['3-team', 3, 3, o3], ['4-team', 4, 4, o4], ['3 legs by 2s', 3, 2, o2], ['4 legs by 2s', 4, 2, o2], ['4 legs by 3s', 4, 3, o3]];
      var h = '<table class="no-bm"><thead><tr><th>Ticket</th><th>Break-even per leg</th><th>EV per $</th><th>Chance of a profit</th></tr></thead><tbody>';
      rows.forEach(function(r){
        var n = r[1], s = r[2], d = dec(r[3]), cb = comb(n, s), ev = 0, pp = 0;
        for (var k = 0; k <= n; k++){ var pk = comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k); var ret = k >= s ? comb(k, s) * d : 0; ev += pk * ret; if (ret > cb) pp += pk; }
        ev = ev / cb - 1;
        var be = Math.pow(1 / d, 1 / s) * 100;
        h += '<tr><td><b>' + r[0] + '</b></td><td>' + be.toFixed(1) + '%</td><td class="' + (ev > 0 ? 'ev-pos' : 'ev-neg') + '">' + (ev >= 0 ? '+' : '') + (ev * 100).toFixed(1) + '%</td><td>' + (pp * 100).toFixed(0) + '%</td></tr>';
      });
      document.getElementById('tc-out').innerHTML = h + '</tbody></table>';
    }
    box.querySelectorAll('input').forEach(function(i){ i.addEventListener('input', run); });
    run();
  }
  function legs(){
    var f = document.getElementById('legs-filter'); if (!f) return;
    var kind = 'All';
    var q = document.getElementById('lf-q'), card = document.getElementById('lf-card'), multi = document.getElementById('lf-multi'), priced = document.getElementById('lf-priced');
    function apply(){
      var term = (q.value || '').trim().toLowerCase(), shown = 0, games = 0;
      document.querySelectorAll('.legs-game').forEach(function(g){
        var n = 0;
        g.querySelectorAll('.leg').forEach(function(l){
          var ok = (kind === 'All' || l.getAttribute('data-kind') === kind)
            && (!card.checked || l.getAttribute('data-card') === '1')
            && (!multi.checked || +l.getAttribute('data-sup') >= 2)
            && (!priced.checked || l.getAttribute('data-bad') !== '1')
            && (!term || l.getAttribute('data-player').indexOf(term) >= 0);
          l.hidden = !ok; if (ok) n++;
        });
        var c = g.querySelector('.lg-n'); if (c) c.textContent = n;
        var none = g.querySelector('.lg-none'); if (none) none.hidden = n > 0;
        g.hidden = n === 0; if (n) games++; shown += n;
      });
      var out = document.getElementById('lf-count'); if (out) out.textContent = shown + ' legs in ' + games + ' games';
    }
    f.querySelectorAll('.lf-kind').forEach(function(b){ b.addEventListener('click', function(){
      kind = b.getAttribute('data-kind');
      f.querySelectorAll('.lf-kind').forEach(function(x){ x.classList.toggle('btn-primary', x === b); });
      apply(); }); });
    [card, multi, priced].forEach(function(x){ x.addEventListener('change', apply); });
    q.addEventListener('input', function(){ apply(); if (q.value.trim()) document.querySelectorAll('.legs-game:not([hidden])').forEach(function(g){ g.open = true; }); });
    function setAll(sel, v){ document.querySelectorAll(sel).forEach(function(d){ if (!d.hidden) d.open = v; }); }
    document.getElementById('lf-open').addEventListener('click', function(){ setAll('.legs-game', true); });
    document.getElementById('lf-close').addEventListener('click', function(){ setAll('.legs-game', false); });
    document.getElementById('lf-expand').addEventListener('click', function(){ setAll('.legs-game', true); setAll('.leg', true); });
    document.getElementById('lf-collapse').addEventListener('click', function(){ setAll('.leg', false); });
    apply();
  }
  function recFilter(){
    var bar = document.getElementById('rec-filter'); if (!bar) return;
    bar.querySelectorAll('button[data-t]').forEach(function(b){ b.addEventListener('click', function(){
      var k = b.getAttribute('data-t');
      bar.querySelectorAll('button[data-t]').forEach(function(x){ x.classList.toggle('btn-primary', x === b); });
      document.querySelectorAll('.rec-game').forEach(function(g){
        var n = 0;
        g.querySelectorAll('tbody tr[data-t]').forEach(function(tr){
          var ok = k === 'all' || tr.getAttribute('data-t').split(' ').indexOf(k) >= 0; tr.style.display = ok ? '' : 'none'; if (ok) n++; });
        g.querySelectorAll('.rp[data-t]').forEach(function(sp){
          sp.hidden = !(k === 'all' || sp.getAttribute('data-t').split(' ').indexOf(k) >= 0); });
        g.style.display = n ? '' : 'none';
      });
    }); });
  }
  function muJump(){
    document.querySelectorAll('.mu-jump-link').forEach(function(a){ a.addEventListener('click', function(){
      var h = a.getAttribute('href'); if (h.charAt(0) !== '#') return;
      var t = document.getElementById(h.slice(1)); if (t && t.tagName === 'DETAILS') t.open = true; }); });
    document.querySelectorAll('.mu-all').forEach(function(b){ b.addEventListener('click', function(){
      var v = b.getAttribute('data-open') === '1'; document.querySelectorAll('.mu-card').forEach(function(d){ d.open = v; }); }); });
  }
  function go(){ setup(); wire(); calc(); legs(); recFilter(); muJump(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
