// scripts/props/betonline-prop-extract.browser.js
// ==============================================================================
// BetOnline.ag NFL Prop & Line Automated Extractor (Background iframe runner)
// ==============================================================================
// Paste and run directly in Developer Tools Console on:
// https://sports.betonline.ag/sportsbook/football/nfl
// (Can also be run from any individual BetOnline game page)
//
// FEATURES:
// 1. 100% Dynamic: Auto-discovers all currently published NFL matchups on the board.
//    Filters to current NFL week (Tue->Mon) automatically.
// 2. Tab Stays Active: Uses a hidden background iframe so your tab NEVER reloads.
// 3. Captures all player props, game lines, 1st half, 1st quarter, and parlay builder markets.
// 4. Standardized Filename: bol-live-YYYY-MM-DD-weekN.raw.txt (auto-computes NFL week).
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

  const nflWeek = window.BOL_WEEK || calculateNflWeek();
  const dateStr = new Date().toISOString().slice(0, 10);
  const MAIN_SCHEDULE_PATH = '/sportsbook/football/nfl';

  // --- 2. Create or Reuse Background Hidden iframe ---
  let iframe = document.getElementById('bol_extractor_iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'bol_extractor_iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1280px';
    iframe.style.height = '1200px';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);
  }

  function extractCurrentWeekGames(rootDoc) {
    if (!rootDoc) return [];
    const rows = Array.from(rootDoc.querySelectorAll('a[href*="/sportsbook/football/nfl/game/"]'));
    const games = [];
    for (const r of rows) {
      const href = r.getAttribute('href');
      if (!href) continue;
      const text = r.innerText.replace(/\s+/g, ' ').trim();
      const matchTeams = text.match(/\d+\s*-\s*([A-Za-z0-9 ]+?)\s+\d+\s*-\s*([A-Za-z0-9 ]+?)\s+(?:Spread|Moneyline)/);
      const teams = matchTeams ? `${matchTeams[1].trim()} @ ${matchTeams[2].trim()}` : text.slice(0, 60);
      const timeMatch = text.match(/^(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat|Today|Tomorrow|\w+ \d+),?\s+\d+:\d+\s+(?:AM|PM)/i);
      const startTime = timeMatch ? timeMatch[0] : '';
      const eventId = href.split('/').filter(Boolean).pop();

      // Filter: In-season current week matchups are scheduled on Sun, Mon, Sat, Fri, Today, or Tomorrow.
      // Next-week games typically begin with Thu of next week or a distant date like "Oct 18"
      const isAdvanceDate = /^[A-Z][a-z]{2}\s+\d{1,2}/.test(startTime);
      if (isAdvanceDate) {
        // Advance week detected (e.g. "Oct 18, 6:30 AM") - stop adding future week games
        break;
      }
      if (/^Thu,/i.test(startTime) && games.length >= 10) {
        // Next Thursday night game after Sunday/Monday slate
        break;
      }

      if (!games.some(g => g.href === href)) {
        games.push({ href, teams, startTime, eventId });
      }
    }
    return games;
  }

  // --- 3. Dynamic Matchup Discovery ---
  let targetGames = extractCurrentWeekGames(document);

  // If pasted on an individual game page or main page hadn't hydrated links yet:
  if (targetGames.length === 0) {
    console.log('🔍 Discovering live matchups from main schedule page in background...');
    iframe.src = MAIN_SCHEDULE_PATH;
    for (let s = 0; s < 15; s++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        const schedDoc = iframe.contentDocument || iframe.contentWindow.document;
        targetGames = extractCurrentWeekGames(schedDoc);
        if (targetGames.length > 0) break;
      } catch (e) {}
    }
  }

  // Fallback if currently on a single game page
  if (targetGames.length === 0 && location.pathname.includes('/nfl/game/')) {
    const eventId = location.pathname.split('/').filter(Boolean).pop();
    const title = document.title.replace(/\s*\|.*$/, '').trim();
    console.log(`ℹ️ Falling back to single-game extraction for ${title}`);
    targetGames = [{ href: location.pathname, teams: title, startTime: '', eventId }];
  }

  if (targetGames.length === 0) {
    iframe.remove();
    console.error('❌ Could not discover any active NFL matchup links. Please navigate to https://sports.betonline.ag/sportsbook/football/nfl and try again.');
    return;
  }

  console.log(`🚀 Starting automated BetOnline extraction for Week ${nflWeek} across ${targetGames.length} games via background iframe...`);

  const results = [];

  // --- 4. Process Each Game Sequentially ---
  for (let idx = 0; idx < targetGames.length; idx++) {
    const game = targetGames[idx];
    console.log(`⏳ [${idx + 1}/${targetGames.length}] Loading ${game.teams} (${game.href})...`);
    iframe.src = game.href;

    let doc = null;
    for (let sec = 0; sec < 25; sec++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc && doc.body) {
          const t = doc.body.innerText || '';
          if (t.includes('Passing Yards') || t.includes('Passing Touchdowns') || t.includes('Spread') || t.includes('All Markets')) {
            await new Promise(r => setTimeout(r, 1000)); // Allow odds and dynamic props to settle
            break;
          }
        }
      } catch (e) {}
    }

    if (!doc || !doc.body) {
      console.warn(`⚠️ [${idx + 1}/${targetGames.length}] Timed out waiting for props on ${game.href}`);
      continue;
    }

    const rawText = doc.body.innerText || '';
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // Build event block
    const block = [
      `EVENT|${game.teams}|${game.href}|${new Date().toISOString()}|${game.startTime}|${game.eventId}`,
      'RAW_TEXT_START',
      rawText,
      'RAW_TEXT_END'
    ].join('\n');

    results.push(block);
    console.log(`✅ [${idx + 1}/${targetGames.length}] Captured ${game.teams} (${lines.length} lines)`);
  }

  // --- 5. Cleanup & Download ---
  iframe.remove();
  console.log(`🎉 Complete! Successfully captured ${results.length}/${targetGames.length} games for Week ${nflWeek}.`);

  const fullText = results.join('\n\n') + '\nEND|' + results.length + '\n';
  const blob = new Blob([fullText], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const downloadFileName = `bol-live-${dateStr}-week${nflWeek}.raw.txt`;
  a.download = downloadFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log(`📁 Downloaded: ${downloadFileName}`);
})();
