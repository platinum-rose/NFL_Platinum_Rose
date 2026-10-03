
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
    if (c) { c.textContent = on.length + ' of 5 picked' + (on.length > 5 ? ' (too many)' : ''); c.style.color = on.length === 5 ? '' : '#b45309'; }
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
