import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../lib/logger';
import { TEAM_ALIASES, getTeam, getTeamAbbreviation } from '../lib/teams';
import { fetchAllInjuries } from '../lib/injuries';
import { parseActionNetworkAuto } from '../lib/actionParser';
import { LOCAL_DATA } from '../lib/apiConfig';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from '../lib/storage';
import { getGameSplitsForWeek, getGamesForSeason, getLatestGameSplitsForSeason, getLatestOddsSnapshot } from '../lib/supabase';
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

function teamAbbrFromOddsName(value) {
  if (!value) return '';
  return getTeamAbbreviation(value) || String(value).toUpperCase();
}

function findOddsGameForScheduleGame(game, oddsGames) {
  const homeAbbrev = (game.home || '').toUpperCase();
  const visitorAbbrev = (game.visitor || '').toUpperCase();

  return oddsGames.find(lg => {
    const oddsHome = (lg.home_abbrev || teamAbbrFromOddsName(lg.home_team || lg.home)).toUpperCase();
    const oddsAway = (lg.visitor_abbrev || lg.away_abbrev || teamAbbrFromOddsName(lg.away_team || lg.visitor)).toUpperCase();
    return oddsHome === homeAbbrev && oddsAway === visitorAbbrev;
  });
}

function getPrimaryOddsMarkets(oddsGame) {
  const books = Object.values(oddsGame?.bookmakers || {});
  const withSpread = books.find(book => book.markets?.spread);
  const withAny = books.find(book => book.markets?.spread || book.markets?.total || book.markets?.moneyline);
  return (withSpread || withAny)?.markets || {};
}

function formatScheduleTime(kickoffUtc) {
  if (!kickoffUtc) return '';
  return new Date(kickoffUtc).toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

function shapeSupabaseGame(row) {
  const home = getTeamAbbreviation(row.home_abbrev || row.home_team);
  const visitor = getTeamAbbreviation(row.away_abbrev || row.away_team);
  const homeMeta = getTeam(home || row.home_team);
  const visitorMeta = getTeam(visitor || row.away_team);

  return {
    id: row.espn_event_id || row.game_id,
    game_id: row.game_id,
    week: Number(row.week),
    season: Number(row.season),
    season_type: Number(row.season_type),
    kickoff_utc: row.kickoff_utc,
    status: row.status || 'pre',
    visitor,
    home,
    visitorName: visitorMeta?.fullName || row.away_team || visitor,
    homeName: homeMeta?.fullName || row.home_team || home,
    homeScore: 0,
    visitorScore: 0,
    time: formatScheduleTime(row.kickoff_utc),
    spread: row.closing_spread_line,
    total: row.closing_total_line,
    home_ml: row.closing_home_moneyline,
    visitor_ml: row.closing_away_moneyline,
    away_rest: row.away_rest,
    home_rest: row.home_rest,
    div_game: row.div_game,
    roof: row.roof,
    surface: row.surface,
    referee: row.referee,
    temp: row.temp,
    wind: row.wind,
    scheduleSource: 'Supabase',
    scheduleUpdatedAt: row.context_updated_at || row.updated_at || null,
  };
}

function shapeScheduleRows(rows) {
  return rows
    .map(shapeSupabaseGame)
    .filter(game => game.id && game.home && game.visitor && game.week && game.season_type);
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
  const bootedRef = useRef(false);

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

  const refreshDashboardData = useCallback(async () => {
    logger.log("🚀 Fetching dashboard schedule, cached odds, splits, and injuries...");
    setLoading(true);

    try {
      const weekInfo = getNFLWeekInfo();
      const [
        scheduleData,
        oddsSnapshot,
        statsData,
        splitsData,
      ] = await Promise.all([
        // 1. Schedule (Supabase games table, local JSON fallback)
        getGamesForSeason(weekInfo.season)
          .then(rows => {
            const shaped = shapeScheduleRows(rows || []);
            if (shaped.length > 0) {
              return shaped;
            }
            return fetch(LOCAL_DATA.SCHEDULE).then(r => r.ok ? r.json() : []).catch(() => []);
          }),

        // 2. Cached odds snapshot (Supabase, written by game-odds-ingest).
        // This does not spend TheOddsAPI quota from the browser.
        getLatestOddsSnapshot().catch(err => {
          logger.warn("⚠️ Cached odds snapshot load failed:", err);
          return null;
        }),

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
        getGameSplitsForWeek(weekInfo.week, weekInfo.season)
          .then(rows => {
            if (rows?.length > 0) {
              logger.log(`☁️ Loaded ${rows.length} Supabase split rows for ${weekInfo.label}.`);
              return shapeSupabaseSplits(rows);
            }

            return getLatestGameSplitsForSeason(weekInfo.season).then(fallbackRows => {
              if (!fallbackRows || fallbackRows.length === 0) {
                logger.log(`ℹ️ No splits rows in Supabase yet for ${weekInfo.label} or season ${weekInfo.season} — using empty splits.`);
                return {};
              }

              const latestCapturedAt = fallbackRows
                .map(row => row.captured_at)
                .filter(Boolean)
                .sort()
                .at(-1);
              logger.log(
                `ℹ️ No splits rows for ${weekInfo.label}; using ${fallbackRows.length} latest season split rows` +
                `${latestCapturedAt ? ` from ${new Date(latestCapturedAt).toLocaleString()}` : ''}.`
              );
              return shapeSupabaseSplits(fallbackRows);
            });
          })
          .catch(err => {
            logger.warn("⚠️ Splits load failed:", err);
            return {};
          })
      ]);

      const liveOddsData = oddsSnapshot?.games || [];
      const scheduleSource = scheduleData.some(game => game.scheduleSource === 'Supabase')
        ? 'Supabase games'
        : 'local schedule';
      const preseasonCount = scheduleData.filter(game => Number(game.season_type) === 1).length;
      const regularCount = scheduleData.filter(game => Number(game.season_type) === 2).length;
      logger.log(`✅ Schedule Loaded: ${scheduleData.length} games from ${scheduleSource} (${preseasonCount} preseason, ${regularCount} regular)`);
      if (liveOddsData.length > 0) {
        const ageMin = Math.round((Date.now() - new Date(oddsSnapshot.fetchedAt).getTime()) / 60000);
        logger.log(`☁️ Dashboard odds loaded from Supabase snapshot: ${liveOddsData.length} games (${ageMin}m old).`);
        saveToStorage(PR_STORAGE_KEYS.CACHED_ODDS.key, liveOddsData);
        saveToStorage(PR_STORAGE_KEYS.CACHED_ODDS_TIME.key, new Date(oddsSnapshot.fetchedAt).getTime());
      } else {
        logger.log('ℹ️ No cached Supabase odds snapshot available for dashboard merge.');
      }

      const liveOddsExpected = liveOddsData.length > 0;
      let unmatchedFallbackCount = 0;

      // Merge live odds into schedule
      const mergedSchedule = scheduleData.map(game => {
        const liveGame = findOddsGameForScheduleGame(game, liveOddsData);

        if (liveGame) {
          const markets = getPrimaryOddsMarkets(liveGame);
          return {
            ...game,
            spread: markets.spread?.home_line ?? liveGame.spread ?? game.spread,
            total: markets.total?.line ?? liveGame.total ?? game.total,
            home_ml: markets.moneyline?.home ?? liveGame.home_ml ?? null,
            visitor_ml: markets.moneyline?.away ?? liveGame.visitor_ml ?? null,
            oddsSource: 'Supabase Snapshot',
            oddsUpdatedAt: oddsSnapshot?.fetchedAt || null,
            sportsbookCount: Object.keys(liveGame.bookmakers || {}).length,
          };
        }

        if (liveOddsExpected) {
          logger.warn(`⚠️ No cached odds found for ${game.visitor} @ ${game.home}, using ESPN/static fallback`);
        } else {
          unmatchedFallbackCount += 1;
        }
        return { ...game, oddsSource: 'ESPN' };
      });

      if (!liveOddsExpected && unmatchedFallbackCount > 0) {
        logger.log(`ℹ️ ${unmatchedFallbackCount} games using ESPN/static fallback because no cached odds snapshot was available.`);
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

    } catch (err) {
      logger.error("CRITICAL Error loading data:", err);
      setLoading(false);
    }
  }, []);

  // --- BOOT SEQUENCE ---
  useEffect(() => {
    // React StrictMode runs mount effects twice in dev. Keep the data loader
    // idempotent so injuries/odds/splits don't all double-fetch locally.
    if (bootedRef.current) return;
    bootedRef.current = true;
    refreshDashboardData();
  }, [refreshDashboardData]);

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
    refreshDashboardData,
    findGameForTeam,
    handleBulkImport,
  };
}
