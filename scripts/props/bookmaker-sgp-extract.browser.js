// scripts/props/bookmaker-sgp-extract.browser.js
// Paste/run in the page context of each Bookmaker.eu game page
// (https://be.bookmaker.eu/en/sports/football/nfl/game-lines/<away>-vs-<home>/), READ-ONLY:
// it never clicks odds or touches the bet slip. It waits for markets to render, keeps only
// SGP-eligible sections (.sgp-badge), and appends one compact text block per game to
// sessionStorage.bkrDump (survives navigation within be.bookmaker.eu in the same tab).
// After all games: run bkrDownload() once to save bkr-sgp-live-<date>-week<N>.txt
// (Chrome allows one automatic download per site before asking - approve "Always allow").
// Line format consumed by scripts/props/bookmaker-sgp-dump-parse.mjs:
//   EVENT|<Away> @ <Home>|<path>|<iso>   T|<section title>   I|<selection text>
(async () => {
  for (let k = 0; k < 30; k++) { if (document.querySelectorAll('div.prop-grid .sgp-badge').length > 5) break; await new Promise(r => setTimeout(r, 1000)); }
  await new Promise(r => setTimeout(r, 1500));
  const hdr = [...document.querySelectorAll('.team-names')].slice(0, 2).map(e => e.innerText.trim());
  const grids = [...document.querySelectorAll('div.prop-grid')].filter(x => x.querySelector('.sgp-badge'));
  const L = ['EVENT|' + hdr.join(' @ ') + '|' + location.pathname + '|' + new Date().toISOString()];
  for (const x of grids) {
    L.push('T|' + (x.querySelector('.sports-league-banner')?.innerText || '').replace(/\bSGP\b/, '').replace(/\s+/g, ' ').trim());
    for (const i of x.querySelectorAll('.prop-item')) { const t = i.innerText.replace(/\s+/g, ' ').trim(); if (t && !/^\+ \d+ /.test(t)) L.push('I|' + t); }
  }
  const all = JSON.parse(sessionStorage.getItem('bkrDump') || '{}'); all[location.pathname] = L.join('\n');
  sessionStorage.setItem('bkrDump', JSON.stringify(all));
  window.bkrDownload = (name = 'bkr-sgp-live.txt') => {
    const txt = Object.values(JSON.parse(sessionStorage.getItem('bkrDump') || '{}')).join('\n') + '\nEND|' + Object.keys(all).length + '\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = name; document.body.appendChild(a); a.click();
  };
  return `${hdr.join(' @ ')} grids=${grids.length} lines=${L.length} stored=${Object.keys(all).length}`;
})();
