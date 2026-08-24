// Pure schedule -> dropdown-option normalization, extracted from
// BetEntryModal.jsx (Checkpoint 4, 2026-08-22) so it can be unit-tested
// directly without a DOM/React renderer -- this repo has no
// jsdom/@testing-library/react setup yet, so component-level rendering
// tests aren't available; this keeps the actual normalization logic under
// automated test instead of only reachable via manual browser checks.
//
// Behavior is unchanged from the Checkpoint 1 fix (2026-08-21 unified
// repair plan, item 1): prefer schedule-shaped fields (visitor/home/
// visitorName/homeName), fall back to the legacy fields (away_team/
// home_team) so older cached schedule data still resolves two real teams
// instead of blank/undefined options.
export function getGameOptions(schedule = []) {
  return schedule.map((game) => {
    const visitorAbbr = game.visitor || game.away_team;
    const homeAbbr = game.home || game.home_team;
    const visitorLabel = game.visitorName || game.visitor || game.away_team || 'TBD';
    const homeLabel = game.homeName || game.home || game.home_team || 'TBD';
    return {
      id: game.id || `${visitorAbbr}-${homeAbbr}`,
      label: `${visitorLabel} @ ${homeLabel}`,
      teams: [visitorAbbr, homeAbbr].filter(Boolean),
    };
  });
}
