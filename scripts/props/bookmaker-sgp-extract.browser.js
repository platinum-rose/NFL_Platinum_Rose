// scripts/props/bookmaker-sgp-extract.browser.js
// ==============================================================================
// Bookmaker.eu SGP & Prop Board Automated Extractor (Background iframe runner)
// ==============================================================================
// Paste and run directly in Developer Tools Console on:
// https://be.bookmaker.eu/en/sports/football/nfl/game-lines/
// (Can also be run from any individual Bookmaker game page)
//
// FEATURES:
// 1. 100% Dynamic: Auto-discovers all currently published NFL matchups on the board.
//    No hardcoded week or matchup lists. Works for any week across the season.
// 2. Tab Stays Active: Uses a hidden background iframe so your tab NEVER reloads.
// 3. Captures all SGP-eligible prop grids and main game markets.
// 4. Standardized Filename: bkr-sgp-live-YYYY-MM-DD-weekN.txt (auto-computes NFL week).
// 5. Completely read-only (never touches betslip, cashiers, or account balance).
// ==============================================================================

(async () => {
  // --- 1. Dynamic NFL Week Calculator ---
  function calculateNflWeek(date = new Date()) {
    // 2026 NFL Regular Season Tuesday anchor for Week 1 (Tuesday 2026-09-08)
    const w1Tuesday = new Date('2026-09-08T00:00:00Z');
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffWeeks = Math.floor((date.getTime() - w1Tuesday.getTime()) / msPerWeek);
    return Math.max(1, Math.min(18, 1 + diffWeeks));
  }

  const nflWeek = window.BKR_WEEK || calculateNflWeek();
  const dateStr = new Date().toISOString().slice(0, 10);
  const MAIN_SCHEDULE_PATH = '/en/sports/football/nfl/game-lines/';

  // --- 2. Create or Reuse Background Hidden iframe ---
  let iframe = document.getElementById('bkr_extractor_iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'bkr_extractor_iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1280px';
    iframe.style.height = '900px';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);
  }

  function extractMatchupLinks(rootDoc) {
    if (!rootDoc) return [];
    return Array.from(rootDoc.querySelectorAll('a[href*="/game-lines/"]'))
      .map(a => a.getAttribute('href'))
      .filter(href => href && href.includes('-vs-') && !href.includes('/live/'))
      .map(href => href.startsWith('http') ? new URL(href).pathname : href)
      .filter((href, idx, self) => self.indexOf(href) === idx);
  }

  // --- 3. Dynamic Matchup Discovery ---
  let gameLinks = extractMatchupLinks(document);

  // If script was pasted on an individual game page or main page hadn't hydrated links yet,
  // load the main schedule path into the hidden iframe to discover live matchups dynamically.
  if (gameLinks.length === 0) {
    console.log('🔍 Discovering live matchups from main schedule page in background...');
    iframe.src = MAIN_SCHEDULE_PATH;
    for (let s = 0; s < 15; s++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        const schedDoc = iframe.contentDocument || iframe.contentWindow.document;
        gameLinks = extractMatchupLinks(schedDoc);
        if (gameLinks.length > 0) break;
      } catch (e) {}
    }
  }

  // If still empty and currently on a single game page, capture just the current page
  if (gameLinks.length === 0 && location.pathname.includes('-vs-')) {
    console.log(`ℹ️ Falling back to single-game extraction on ${location.pathname}`);
    gameLinks = [location.pathname];
  }

  if (gameLinks.length === 0) {
    iframe.remove();
    console.error('❌ Could not discover any active NFL matchup links. Please navigate to https://be.bookmaker.eu/en/sports/football/nfl/game-lines/ and try again.');
    return;
  }

  console.log(`🚀 Starting automated SGP extraction for Week ${nflWeek} across ${gameLinks.length} games via background iframe...`);

  const results = [];

  // --- 4. Process Each Game Sequentially ---
  for (let idx = 0; idx < gameLinks.length; idx++) {
    const path = gameLinks[idx];
    console.log(`⏳ [${idx + 1}/${gameLinks.length}] Loading ${path}...`);
    iframe.src = path;

    let doc = null;
    let grids = [];
    for (let sec = 0; sec < 25; sec++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc) {
          grids = [...doc.querySelectorAll('div.prop-grid')];
          if (grids.length >= 2) {
            await new Promise(r => setTimeout(r, 1500)); // wait for full odds hydration
            grids = [...doc.querySelectorAll('div.prop-grid')];
            break;
          }
        }
      } catch (e) {}
    }

    if (!doc || grids.length === 0) {
      console.warn(`⚠️ [${idx + 1}/${gameLinks.length}] Timed out waiting for props on ${path}`);
      continue;
    }

    const hdr = [...doc.querySelectorAll('.team-names')].slice(0, 2).map(e => e.innerText.trim());
    const eventName = hdr.length === 2 ? hdr.join(' @ ') : path.split('/').filter(Boolean).pop().replace(/-/g, ' ');
    const sgpGrids = grids.filter(x => x.querySelector('.sgp-badge') || x.innerText.includes('SGP'));
    const targetGrids = sgpGrids.length > 0 ? sgpGrids : grids;

    const L = ['EVENT|' + eventName + '|' + path + '|' + new Date().toISOString()];
    for (const x of targetGrids) {
      const banner = (x.querySelector('.sports-league-banner')?.innerText || '').replace(/\bSGP\b/, '').replace(/\s+/g, ' ').trim();
      L.push('T|' + banner);
      for (const item of x.querySelectorAll('.prop-item')) {
        const t = item.innerText.replace(/\s+/g, ' ').trim();
        if (t && !/^\+ \d+ /.test(t)) L.push('I|' + t);
      }
    }

    results.push(L.join('\n'));
    console.log(`✅ [${idx + 1}/${gameLinks.length}] Captured ${eventName} (${targetGrids.length} grids, ${L.length} lines)`);
  }

  // --- 5. Cleanup & Download ---
  iframe.remove();
  console.log(`🎉 Complete! Successfully captured ${results.length}/${gameLinks.length} games for Week ${nflWeek}.`);

  const fullText = results.join('\n') + '\nEND|' + results.length + '\n';
  const blob = new Blob([fullText], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const downloadFileName = `bkr-sgp-live-${dateStr}-week${nflWeek}.txt`;
  a.download = downloadFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log(`📁 Downloaded: ${downloadFileName}`);
})();
