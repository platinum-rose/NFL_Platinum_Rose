// Builds the user_picks.selection text for a podcast-extracted pick.
//
// Regression 2026-09-19: after full-transcript extraction added player_prop / futures picks,
// pick-extraction wrote the bare extractor selection ("OVER", "Anytime TD") — the player and
// market were dropped, so 48 prop rows read "OVER 20.5" with no way to tell who or what.

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function formatExpertSelection(pick = {}) {
  const selection = clean(pick.selection);
  const player = clean(pick.player);
  const market = clean(pick.market);

  if (pick.type === 'player_prop' || (player && pick.type !== 'futures')) {
    const parts = [player];
    // "Anytime TD" / "First TD" selections already name the market — don't repeat it.
    if (selection) parts.push(selection);
    if (market && !selection.toLowerCase().includes(market.toLowerCase())) parts.push(market);
    return parts.filter(Boolean).join(' ') || selection;
  }

  if (pick.type === 'futures' && market && !selection.toLowerCase().includes(market.toLowerCase())) {
    return `${selection} (${market})`.trim();
  }

  return selection;
}
