// scripts/props/draftkings-prediction-extract.browser.js
// ==============================================================================
// DraftKings Prediction Markets Browser Extractor
// Run in Chrome DevTools Console on https://predictions.draftkings.com/
// or evaluated via Chrome DevTools Protocol (CDP port 9224).
//
// Extracts:
// 1. Slate-Wide Game Lines (Spread, Total, Moneyline/To Win) across all current-week games
// 2. Slate-Wide Touchdown Markets (Anytime TD, First TD, 2+ TDs) across all current-week games
// ==============================================================================

(async function runDraftKingsPredictionExtract() {
  const isBrowserConsole = typeof window !== 'undefined' && typeof document !== 'undefined' && !window.__playwright_managed;
  console.log('🚀 Starting DraftKings Prediction Markets Extraction...');

  function calculateNflWeek(date = new Date()) {
    const w1Tuesday = new Date('2026-09-08T00:00:00Z');
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffWeeks = Math.floor((date.getTime() - w1Tuesday.getTime()) / msPerWeek);
    return Math.max(1, Math.min(18, 1 + diffWeeks));
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const weekNum = calculateNflWeek();

  // Helper to fetch or read page text via background iframe
  async function extractPageTextViaIframe(url, readyKeyword) {
    let iframe = document.getElementById('dkp_extractor_iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'dkp_extractor_iframe';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1280px';
      iframe.style.height = '1200px';
      iframe.style.opacity = '0';
      document.body.appendChild(iframe);
    }

    iframe.src = url;
    let doc = null;
    let text = '';

    for (let sec = 0; sec < 25; sec++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc && doc.body) {
          text = doc.body.innerText || '';
          if (text.includes(readyKeyword)) {
            await new Promise(r => setTimeout(r, 1000));
            text = doc.body.innerText || '';
            break;
          }
        }
      } catch {}
    }

    return text;
  }

  console.log('⏳ [1/2] Extracting Game Lines board...');
  let gameLinesText = '';
  if (window.location.href.includes('subcategory=game-lines')) {
    gameLinesText = document.body.innerText;
  } else {
    gameLinesText = await extractPageTextViaIframe(
      'https://predictions.draftkings.com/en/markets/football/nfl?category=games&subcategory=game-lines',
      'Total Points'
    );
  }
  console.log(`✅ [1/2] Captured Game Lines board (${gameLinesText.length} chars)`);

  console.log('⏳ [2/2] Extracting Touchdown Scorers board...');
  let tdScorersText = '';
  if (window.location.href.includes('subcategory=td-scorers')) {
    tdScorersText = document.body.innerText;
  } else {
    tdScorersText = await extractPageTextViaIframe(
      'https://predictions.draftkings.com/en/markets/football/nfl?category=games&subcategory=td-scorers&nav_1=anytime-td-scorer',
      'Anytime TD Scorer'
    );
  }
  console.log(`✅ [2/2] Captured TD Scorers board (${tdScorersText.length} chars)`);

  const iframe = document.getElementById('dkp_extractor_iframe');
  if (iframe) iframe.remove();

  // Package raw dump format
  const dumpPayload = [
    `DKP_HEADER|${dateStr}|week${weekNum}|${new Date().toISOString()}`,
    'SECTION_START|GAME_LINES',
    gameLinesText,
    'SECTION_END|GAME_LINES',
    'SECTION_START|TD_SCORERS',
    tdScorersText,
    'SECTION_END|TD_SCORERS',
    'DKP_END'
  ].join('\n\n');

  if (isBrowserConsole) {
    const filename = `dkp-live-${dateStr}-week${weekNum}.raw.txt`;
    const blob = new Blob([dumpPayload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    console.log(`🎉 Downloaded: ${filename} (${Math.round(dumpPayload.length / 1024)} KB)`);
  }

  return dumpPayload;
})();
