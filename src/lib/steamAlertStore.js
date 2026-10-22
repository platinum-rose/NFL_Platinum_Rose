// src/lib/steamAlertStore.js
// §1B UI support — cached steam/RLM lookups for game cards + matchup modal.
//
// Cards: one shared fetch of recent line_movements (5-min TTL) → cheap
// detection for every game on the slate. Only games that actually flag a move
// then pay for the full correlation (splits + injuries + tweets + signals).

import { getLineMovementsDB, getSteamMoveInputs, getRecentGameSplitsHistory } from './supabase.js';
import { detectSteamAndReverseLineMoves, detectAndCorrelateSteamMoves, teamAbbr } from './steamMoveCorrelator.js';

const TTL_MS = 5 * 60 * 1000;
let slate = { at: 0, promise: null };
const perGame = new Map(); // key → { at, promise }

export function steamGameKey(home, away) {
  const h = teamAbbr(home); const a = teamAbbr(away);
  return h && a ? `${a}@${h}` : null;
}

/** Map<"AWAY@HOME", moveEvents[]> from the last `hours` of line movements. */
export function loadSlateSteamMoves(hours = 24) {
  if (slate.promise && Date.now() - slate.at < TTL_MS) return slate.promise;
  slate = {
    at: Date.now(),
    // Splits are fetched for the whole slate too, so cards can show pure RLM
    // (line moving against the tickets) even when the move isn't 1+ pt steam.
    promise: Promise.all([
      getLineMovementsDB(hours, 600),
      getRecentGameSplitsHistory({ hours: Math.max(hours, 72) }),
    ]).then(([rows, splits]) => {
      const group = (list) => {
        const m = new Map();
        for (const r of list || []) {
          const k = steamGameKey(r.home_team, r.away_team);
          if (!k) continue;
          if (!m.has(k)) m.set(k, []);
          m.get(k).push(r);
        }
        return m;
      };
      const moves = group(rows);
      const splitsByGame = group(splits);
      const out = new Map();
      for (const [k, list] of moves) {
        const ev = detectSteamAndReverseLineMoves(list, splitsByGame.get(k) || []);
        if (ev.length) out.set(k, ev);
      }
      return out;
    }).catch(() => new Map()),
  };
  return slate.promise;
}

/** Full correlated attributions for one game (5-min cache). */
export function getGameSteamAttributions({ home, away, week, season = 2026, hours = 24 } = {}) {
  const k = steamGameKey(home, away);
  if (!k) return Promise.resolve([]);
  const hit = perGame.get(k);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;
  const homeAbbr = teamAbbr(home); const awayAbbr = teamAbbr(away);
  const promise = getSteamMoveInputs({ homeAbbr, awayAbbr, week, season, hours })
    .then((inputs) => detectAndCorrelateSteamMoves({ gameId: k, homeTeam: homeAbbr, awayTeam: awayAbbr, ...inputs }))
    .catch(() => []);
  perGame.set(k, { at: Date.now(), promise });
  return promise;
}
