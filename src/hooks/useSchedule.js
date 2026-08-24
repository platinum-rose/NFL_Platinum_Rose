import { useState, useEffect, useCallback } from 'react';
import logger from '../lib/logger';
import { TEAM_ALIASES } from '../lib/teams';
import { fetchAllInjuries } from '../lib/injuries';
import { parseActionNetworkAuto } from '../lib/actionParser';
import { LOCAL_DATA } from '../lib/apiConfig';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from '../lib/storage';
import { getGameSplitsForWeek } from '../lib/supabase';
import { getNFLWeekInfo } from '../lib/constants';

// Shapes Supabase game_splits rows into the same lookup structure the app's
// gamesWithSplits merge (App.jsx) and MatchupCard.jsx already expect --
// keyed multiple ways so the existing fallback lookup chain
// (splits[game.id] || splits[game.game_id] || splits[`${visitor}_${home}`] ||
// splits[`${visitor}_at_${home}`] || a visitor/home linear scan) still works
// unchanged. Unlike the old GitHub-raw JSON cache, this includes .ml --
// Supabase's game_splits table has ml_home_bettors/ml_home_money columns
// that the local-file writer never surfaced.
function shapeSupabaseSplits(rows) {
  const map = {};
  for (const r of rows || []) {
    const home = r.home_team;
    const visitor = r.away_team;
    if (!home || !visitor) continue;

    const homeTicket = r.spread_home_bettors ?? 50;
    const homeMoney = r.spread_home_money ?? 50;
    const overTicket = r.total_over_bettors ?? 50;
    const overMoney = r.total_over_money ?? 50;
    const mlHomeTicket = r.ml_home_bettors;
    const mlHomeMoney = r.ml_home_money;

    const entry = {
      visitor,
      home,
      splits: {
        ats: {
          visitorTicket: 100 - homeTicket,
          visitorMoney: 100 - homeMoney,
          homeTicket,
          homeMoney,
        },
        total: {
          overTicket,
          overMoney,
          underTicket: 100 - overTicket,
          underMoney: 100 - overMoney,
        },
        ...(mlHomeTicket != null && mlHomeMoney != null ? {
          ml: {
            visitorTicket: 100 - mlHomeTicket,
            visitorMoney: 100 - mlHomeMoney,
            homeTicket: mlHomeTicket,
            homeMoney: mlHomeMoney,
          },
        } : {}),
      },
    };

    if (r.game_id) map[r.game_id] = entry;
    map[`${visitor}_${home}`] = entry;
    map[`${visitor}_at_${home}`] = entry;
  }
  return map;
}

/**
 * useSchedule — boot sequence, data fetching, splits import, team matcher
 *
 * Owns: schedule, stats, splits, injuries, loading, contestLines, simResults
 */
export function useSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState([]);
  const [splits, setSplits] = useState(() => loadFromStorage('nfl_splits', {}));
  const [injuries, setInjuries] = useState({});
  const [loading, setLoading] = useState(true);
  const [contestLines, setContestLines] = useState(() => loadFromStorage('nfl_contest_lines', {}));
  const [simResults, setSimResults] = useState(() => loadFromStorage('nfl_sim_results', {}));

  // --- AUTO-SAVE EFFECTS ---
  // Note: guards removed — saving empty state is intentional (clears persist through refresh)
  useEffect(() => {
    saveToStorage(PR_STORAGE_KEYS.SPLITS.key, splits);
  }, [splits]);

  useEffect(() => {
    saveToStorage(PR_STORAGE_KEYS.SIM_RESULTS.key, simResults);
  }, [simResults]);

  useEffect(() => {
    saveToStorage(PR_STORAGE_KEYS.CONTEST_LINES.key, contestLines);
  }, [contestLines]);

  // --- BOOT SEQUENCE ---
  useEffect(() => {
    logger.log("🚀 Booting Up: Fetching Live Schedule & Odds...");

    Promise.all([
      // 1. Schedule (Local)
      fetch(LOCAL_DATA.SCHEDULE).then(r => r.ok ? r.json() : []).catch(() => []),

      // 2. Live Odds — DISABLED on startup to save API requests
      Promise.resolve([]),

      // 3. Stats
      fetch(LOCAL_DATA.WEEKLY_STATS)
        .then(r => {
          if (!r.ok) throw new Error("Stats not found");
          return r.json();
        })
        .catch(err => {
          logger.warn("⚠️ Stats load failed (using empty defaults):", err);
          return [];
        }),

      // 4. Splits (Supabase game_splits, written by
      // agents/betting-splits-ingest.js's scheduled GitHub Actions run --
      // replaces the old GitHub-raw JSON fetch, which 404'd forever since
      // that file is gitignored and the workflow never committed it)
      getGameSplitsForWeek(getNFLWeekInfo().week, getNFLWeekInfo().season)
        .then(rows => {
          if (!rows || rows.length === 0) {
            logger.log("ℹ️ No splits rows in Supabase yet for this slate — using empty splits.");
            return {};
          }
          return shapeSupabaseSplits(rows);
        })
        .catch(err => {
          logger.warn("⚠️ Splits load failed:", err);
          return {};
        })
    ]).then(([scheduleData, liveOddsData, statsData, splitsData]) => {
      logger.log(`✅ Schedule Loaded: ${scheduleData.length} games`);
      logger.log(`✅ Live Odds Loaded: ${liveOddsData.length} games from TheOddsAPI`);

      // Live odds are intentionally disabled on startup (see step 2 above),
      // so liveOddsData is normally empty by design — that's not a per-game
      // problem worth a console warning for every scheduled game. Only warn
      // per game when live odds WERE fetched but a specific game still
      // didn't match (a real, unexpected mismatch).
      const liveOddsExpected = liveOddsData.length > 0;
      let unmatchedFallbackCount = 0;

      // Merge live odds into schedule
      const mergedSchedule = scheduleData.map(game => {
        const homeAbbrev = (game.home || '').toUpperCase();
        const visitorAbbrev = (game.visitor || '').toUpperCase();

        const liveGame = liveOddsData.find(lg => {
          if (lg.home_abbrev && lg.visitor_abbrev) {
            return lg.home_abbrev === homeAbbrev && lg.visitor_abbrev === visitorAbbrev;
          }
          const lgHome = (lg.home || '').toLowerCase();
          const lgVisitor = (lg.visitor || '').toLowerCase();
          const homeClean = homeAbbrev.toLowerCase();
          const visitorClean = visitorAbbrev.toLowerCase();
          return (lgHome.includes(homeClean) || homeClean.includes(lgHome)) &&
                 (lgVisitor.includes(visitorClean) || visitorClean.includes(lgVisitor));
        });

        if (liveGame) {
          logger.log(`🔄 Live odds merged: ${game.visitor} @ ${game.home} → Spread: ${liveGame.spread}, Total: ${liveGame.total}, ML: ${liveGame.visitor_ml}/${liveGame.home_ml}`);
          return {
            ...game,
            spread: liveGame.spread ?? game.spread,
            total: liveGame.total ?? game.total,
            home_ml: liveGame.home_ml || null,
            visitor_ml: liveGame.visitor_ml || null,
            oddsSource: 'TheOddsAPI'
          };
        }

        if (liveOddsExpected) {
          logger.warn(`⚠️ No live odds found for ${game.visitor} @ ${game.home}, using ESPN fallback`);
        } else {
          unmatchedFallbackCount += 1;
        }
        return { ...game, oddsSource: 'ESPN' };
      });

      if (!liveOddsExpected && unmatchedFallbackCount > 0) {
        logger.log(`ℹ️ Live odds disabled at startup — ${unmatchedFallbackCount} games using ESPN/static fallback.`);
      }

      setSchedule(mergedSchedule);
      setStats(statsData);

      // ── Splits boot fix ──────────────────────────────────────────────────────
      // Merge fetched splits from public/betting_splits.json with local user imports
      const localSplits = loadFromStorage(PR_STORAGE_KEYS.SPLITS.key, null);
      const mergedSplits = { ...(splitsData || {}), ...(localSplits || {}) };
      setSplits(mergedSplits);
      logger.log(`📥 Loaded ${Object.keys(mergedSplits).length} game splits`);

      // Injuries (separate async call)
      fetchAllInjuries(mergedSchedule)
        .then(injuryData => {
          logger.log(`🏥 Injuries loaded for ${Object.keys(injuryData).length} teams`);
          setInjuries(injuryData);
        })
        .catch(err => logger.warn("⚠️ Injury fetch failed:", err))
        .finally(() => setLoading(false));

    }).catch(err => {
      logger.error("CRITICAL Error loading data:", err);
      setLoading(false);
    });
  }, []);

  // --- ROBUST TEAM MATCHER (3-tier: alias → abbreviation → substring) ---
  const findGameForTeam = useCallback((rawInput) => {
    if (!rawInput) return null;
    const clean = rawInput.toLowerCase().replace(/[^a-z0-9]/g, "");

    logger.log(`🔍 Searching for game matching: "${rawInput}" (cleaned: "${clean}")`);

    // 1. Alias dictionary
    for (const [alias, standard] of Object.entries(TEAM_ALIASES)) {
      if (clean === alias || clean.includes(alias)) {
        const standardClean = standard.toLowerCase();
        const found = schedule.find(g => {
          const h = g.home.toLowerCase().replace(/[^a-z0-9]/g, "");
          const v = g.visitor.toLowerCase().replace(/[^a-z0-9]/g, "");
          return h.includes(standardClean) || v.includes(standardClean);
        });
        if (found) {
          logger.log(`✅ Found via alias "${alias}" -> "${standard}":`, found);
          return found;
        }
      }
    }

    // 2. Direct abbreviation
    const found = schedule.find(g => {
      const h = g.home.toLowerCase().replace(/[^a-z0-9]/g, "");
      const v = g.visitor.toLowerCase().replace(/[^a-z0-9]/g, "");
      return h === clean || v === clean;
    });
    if (found) {
      logger.log(`✅ Found via direct abbreviation match:`, found);
      return found;
    }

    // 3. Substring
    const foundSubstring = schedule.find(g => {
      const home = g.home.toLowerCase().replace(/[^a-z0-9]/g, "");
      const vis = g.visitor.toLowerCase().replace(/[^a-z0-9]/g, "");
      return home.includes(clean) || vis.includes(clean) || clean.includes(home) || clean.includes(vis);
    });
    if (foundSubstring) {
      logger.log(`✅ Found via substring match:`, foundSubstring);
      return foundSubstring;
    }

    logger.log(`❌ No game found for "${rawInput}"`);
    logger.log(`Available games:`, schedule.map(g => `${g.visitor} @ ${g.home}`));
    return null;
  }, [schedule]);

  // --- BULK SPLITS IMPORT ---
  const handleBulkImport = useCallback((text) => {
    logger.log("📋 Processing bulk import...");

    const parsed = parseActionNetworkAuto(text);

    if (!parsed || parsed.length === 0) {
      alert("❌ Could not parse the data. Make sure it's properly formatted Action Network splits data.");
      return;
    }

    logger.log("✅ Parsed splits:", parsed);

    const newSplits = { ...splits };
    let updateCount = 0;

    parsed.forEach(p => {
      logger.log(`🔍 Looking for game: ${p.visitor} @ ${p.home}`);

      const game = schedule.find(g => {
        const schedVisitor = g.visitor.toLowerCase().replace(/[^a-z]/g, '');
        const schedHome = g.home.toLowerCase().replace(/[^a-z]/g, '');
        const parsedVisitor = p.visitor.toLowerCase().replace(/[^a-z]/g, '');
        const parsedHome = p.home.toLowerCase().replace(/[^a-z]/g, '');

        if (schedVisitor === parsedVisitor && schedHome === parsedHome) {
          logger.log(`✅ Direct match: ${g.visitor} @ ${g.home}`);
          return true;
        }

        if ((schedVisitor.includes(parsedVisitor) || parsedVisitor.includes(schedVisitor)) &&
            (schedHome.includes(parsedHome) || parsedHome.includes(schedHome))) {
          logger.log(`✅ Substring match: ${g.visitor} @ ${g.home}`);
          return true;
        }

        const visitorGame = findGameForTeam(p.visitor);
        const homeGame = findGameForTeam(p.home);
        if (visitorGame && visitorGame.id === g.id) {
          logger.log(`✅ Found via visitor team search: ${g.visitor} @ ${g.home}`);
          return true;
        }
        if (homeGame && homeGame.id === g.id) {
          logger.log(`✅ Found via home team search: ${g.visitor} @ ${g.home}`);
          return true;
        }

        return false;
      });

      if (game) {
        logger.log(`📊 Updating splits for ${game.visitor} @ ${game.home}`);

        const existingSplits = newSplits[game.id] || {};
        const mergedSplits = {
          ...existingSplits,
          ...p,
          splits: {
            ...existingSplits.splits,
            ...p.splits
          }
        };

        newSplits[game.id] = mergedSplits;
        updateCount++;
      } else {
        logger.warn(`⚠️ No game found for ${p.visitor} @ ${p.home}`);
        logger.log(`Available games:`, schedule.map(g => `${g.visitor} @ ${g.home}`));
      }
    });

    setSplits(newSplits);
    alert(`✅ Successfully imported ${updateCount} game splits!`);
  }, [splits, schedule, findGameForTeam]);

  return {
    schedule,
    stats,
    splits,
    injuries,
    loading,
    contestLines,
    setContestLines,
    simResults,
    setSimResults,
    findGameForTeam,
    handleBulkImport,
  };
}
