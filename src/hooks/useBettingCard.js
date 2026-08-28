import { useState, useEffect, useCallback } from 'react';
import { loadFromStorage, saveToStorage, clearStorage, PR_STORAGE_KEYS } from '../lib/storage';

/**
 * useBettingCard — personal betting card state + handlers
 *
 * @param {Array} schedule - current schedule array (for team name lookup)
 */
export function useBettingCard(schedule, storageKey = PR_STORAGE_KEYS.MY_BETS.key) {
  const [myBets, setMyBets] = useState(() => loadFromStorage(storageKey, []));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMyBets(loadFromStorage(storageKey, []));
  }, [storageKey]);

  // --- Auto-save (guard removed — clearing bets must persist through refresh) ---
  useEffect(() => {
    saveToStorage(storageKey, myBets);
  }, [myBets, storageKey]);

  const handleBet = useCallback((gameId, type, side, line, odds = -110, isTeaser = false, isMainLine = true) => {
    const game = schedule.find(g => g.id === gameId);
    if (!game) return;

    const matchup = `${game.visitor} @ ${game.home}`;
    const sideLabels = {
      visitor: game.visitor,
      home: game.home,
      over: 'Over',
      under: 'Under',
    };
    const selection = sideLabels[side] || side;
    const linePrefix = type === 'total'
      ? `${selection} ${line}`
      : `${selection} ${Number(line) > 0 ? '+' : ''}${line}`;
    const uniqueKey = `${gameId}-${type}-${side}-${isMainLine && !isTeaser ? 'std' : `${line}-${isTeaser ? 'teaser' : 'alt'}`}`;
    const nextBet = {
      id: `${uniqueKey}-${Date.now()}`,
      uniqueKey,
      game: matchup,
      matchup,
      gameId,
      selection,
      side,
      type,
      line,
      odds,
      detail: isTeaser ? `${linePrefix} (Teaser)` : linePrefix,
      isTeaser,
      isMainLine,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    setMyBets(prev => {
      if (prev.some(bet => bet.uniqueKey === uniqueKey && bet.status === 'OPEN')) return prev;
      return [nextBet, ...prev];
    });
  }, [schedule]);

  const removeBet = useCallback(
    (id) => setMyBets(prev => prev.filter(b => b.id !== id)),
    []
  );

  const handleLockBets = useCallback(
    (betIds) => setMyBets(prev => prev.map(bet =>
      betIds.includes(bet.id) ? { ...bet, status: 'PLACED' } : bet
    )),
    []
  );

  const handleCreateParlay = useCallback((betIds, odds, type = 'parlay', details = {}) => {
    setMyBets(prev => {
      const selected = prev.filter(bet => betIds.includes(bet.id));
      if (selected.length < 2) return prev;
      const parlay = {
        id: `${type}-${Date.now()}`,
        game: `${selected.length}-leg ${type === 'round-robin' ? 'Round Robin' : type === 'teaser' ? 'Teaser' : 'Parlay'}`,
        matchup: `${selected.length}-leg ${type === 'round-robin' ? 'Round Robin' : type === 'teaser' ? 'Teaser' : 'Parlay'}`,
        selection: selected.map(bet => `${bet.selection} ${bet.line}`).join(' / '),
        detail: selected.map(bet => bet.detail).join(' / '),
        type,
        odds,
        status: 'PLACED',
        legs: selected.map(bet => ({ ...bet })),
        createdAt: new Date().toISOString(),
        ...details,
      };
      return [
        parlay,
        ...prev.map(bet => (betIds.includes(bet.id) ? { ...bet, status: 'PLACED', parentTicketId: parlay.id } : bet)),
      ];
    });
  }, []);

  const clearBets = useCallback(() => {
    setMyBets([]);
    clearStorage(storageKey, []);  // persist the clear through refresh
  }, [storageKey]);

  return {
    myBets,
    handleBet,
    removeBet,
    handleLockBets,
    handleCreateParlay,
    clearBets,
  };
}
