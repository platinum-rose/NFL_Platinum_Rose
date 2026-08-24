// src/lib/keeperEvaluator.js
// ═══════════════════════════════════════════════════════════════════════════════
// Official 9-Rule League Keeper Surplus Evaluation & AI Draft Strategy Engine
// 
// 1. Players originally drafted in 1st/2nd rounds cannot be kept (unless reset to FA after drop).
// 2. Surrender a draft pick 2 rounds higher than keeper was drafted (-2 rule).
// 3. Players cannot be kept for more than 3 consecutive years.
// 4. Player must have been in active starting lineup for at least 1 week.
// 5. Undrafted FAs picked up during season count as 10th round picks.
// 6. Late round (14+ round) draft picks kept count as 14th round picks.
// 7. Picked up off waivers after Week 11 is ineligible (must be on roster from Wk 11).
// 8. Keeper value is traded with the player (if traded directly).
//    - UNIVERSAL ADDENDUM: ANY player dropped mid-season and picked up as a Free Agent / Waiver
//      claim within the eligibility window (on or before Week 11) RESETS to a Round 10 Keeper!
// 9. Same-round collision: 2nd keeper in same round bumps 1 round earlier (e.g. 7th -> 6th).
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalizes player name for fuzzy matching (removes Jr, III, punctuation, casing)
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Evaluates an imported roster/draft board against 2026 market ADP / ECR data
 * under the 9 Official League Keeper Rules.
 * 
 * @param {Array} rosterItems - User's imported roster / draft board list
 * @param {Array} marketBoard - Loaded 2026 FantasyPros ADP / Value Board rows
 * @param {number} leagueSize - Number of teams in the league (default: 12)
 * @param {Object} keeperRules - Optional custom keeper rules override
 */
export function evaluateRosterKeepers(rosterItems = [], marketBoard = [], leagueSize = 12, keeperRules = {}) {
  const draftedDiscount = keeperRules.draftedDiscount != null ? keeperRules.draftedDiscount : 2; // -2 draft spots rule
  const faKeeperRound = keeperRules.faKeeperRound != null ? keeperRules.faKeeperRound : 10; // Round 10 for FA pickups

  // Build lookup map by normalized name + position
  const marketMap = new Map();
  (marketBoard || []).forEach(row => {
    const key = `${normalizeName(row.player)}_${(row.position || '').toUpperCase()}`;
    marketMap.set(key, row);
    if (!marketMap.has(normalizeName(row.player))) {
      marketMap.set(normalizeName(row.player), row);
    }
  });

  // Step 1: Initial evaluation under Rules 1-8
  const evaluated = rosterItems.map(item => {
    const key = `${normalizeName(item.player)}_${(item.position || '').toUpperCase()}`;
    const market = marketMap.get(key) || marketMap.get(normalizeName(item.player)) || null;

    // Live 2026 market team & position ALWAYS supercede historical 2025 draft records
    const position = market?.position || item.position || 'WR';
    const team = market?.team || item.team || 'NFL';

    const adp = market?.adp != null ? Number(market.adp) : null;
    const projPoints = market?.proj_points != null ? Number(market.proj_points) : null;
    const posRank = market?.adp_pos_rank || market?.proj_pos_rank || null;

    // Expected draft round based on league size (e.g. ADP #8 in 12-team = Round 1)
    const expectedRound = adp ? Math.max(1, Math.ceil(adp / leagueSize)) : 15;

    const origDraftRd = item.lastSeasonRound != null ? parseInt(item.lastSeasonRound, 10) :
                       (item.draftRound != null ? parseInt(item.draftRound, 10) : null);

    const isFreeAgent = item.isFreeAgent === true || (item.acquisitionType && (
      item.acquisitionType.toLowerCase().includes('free agent') ||
      item.acquisitionType.toLowerCase().includes('waiver') ||
      item.acquisitionType.toLowerCase().includes('fa pickup')
    ));
    const isDropped = item.isDropped === true || item.status === 'ineligible';

    let isEligible = true;
    let ineligibilityReason = null;
    let thisSeasonKeeperCost = 10;
    let acquisitionLabel = '';

    // RULE 1: Players originally drafted in 1st/2nd rounds cannot be kept (unless reset to FA after drop)
    if (origDraftRd && (origDraftRd === 1 || origDraftRd === 2) && !isFreeAgent) {
      isEligible = false;
      ineligibilityReason = 'Rule 1: Originally drafted in Round 1 or 2 (cannot be kept)';
    }

    // RULE 3: Players cannot be kept for more than 3 consecutive years
    if (item.consecutiveYearsKept && item.consecutiveYearsKept >= 3) {
      isEligible = false;
      ineligibilityReason = 'Rule 3: Max 3-year consecutive keeper tenure reached';
    }

    // RULE 4: Active starting lineup requirement (started at least 1 week)
    if (item.startedAtLeastOneWeek === false) {
      isEligible = false;
      ineligibilityReason = 'Rule 4: Must have been started in active lineup at least 1 week';
    }

    // RULE 7: Waiver pickup deadline (acquired after Week 11 is ineligible)
    if (item.acquiredAfterWeek11 === true || (item.acquisitionWeek && item.acquisitionWeek > 11)) {
      isEligible = false;
      ineligibilityReason = 'Rule 7: Acquired after Week 11 deadline';
    }

    // RULE 5 & 6 & 2: Keeper Cost Calculation
    if (isDropped) {
      isEligible = false;
      ineligibilityReason = 'Dropped Mid-Season';
      thisSeasonKeeperCost = 99;
      acquisitionLabel = 'Ineligible (Dropped Mid-Season)';
    } else if (isFreeAgent) {
      // RULE 5 + UNIVERSAL ADDENDUM: Undrafted FAs or Dropped-and-Reacquired players count as 10th round picks
      thisSeasonKeeperCost = faKeeperRound;
      acquisitionLabel = item.wasDroppedAndReacquired ?
        `Dropped & Picked Up FA → Reset to Rd ${faKeeperRound} Cost` :
        `Free Agent Pickup (Round ${faKeeperRound} Rule)`;
    } else if (origDraftRd && !isNaN(origDraftRd)) {
      if (origDraftRd >= 14) {
        // RULE 6: Late round (14+ round) draft picks count as 14th round picks
        thisSeasonKeeperCost = 14;
        acquisitionLabel = `Late Round Drafted (Rd ${origDraftRd}) → Keep in Rd 14 (Rule 6)`;
      } else {
        // RULE 2: Surrender draft pick 2 rounds higher than drafted (origDraftRd - 2)
        thisSeasonKeeperCost = Math.max(1, origDraftRd - draftedDiscount);
        acquisitionLabel = `Drafted Rd ${origDraftRd} → Keep in Rd ${thisSeasonKeeperCost} (-2 Rule)`;
      }
    }

    // Surplus Value in Rounds: (This Season Keeper Cost Round - Expected Market Round)
    const surplusRounds = !isEligible ? -99 : (thisSeasonKeeperCost - expectedRound);

    let keeperTier = 'C-Tier';
    let recommendation = 'Drop / Re-draft';

    if (!isEligible) {
      keeperTier = 'Ineligible';
      recommendation = ineligibilityReason || 'Ineligible under League Rules';
    } else if (surplusRounds >= 4) {
      keeperTier = 'S-Tier';
      recommendation = 'Must Keep (Extreme Surplus)';
    } else if (surplusRounds >= 2) {
      keeperTier = 'A-Tier';
      recommendation = 'Strong Keeper Value';
    } else if (surplusRounds >= 0) {
      keeperTier = 'B-Tier';
      recommendation = 'Fair Value / Situational';
    } else {
      keeperTier = 'C-Tier';
      recommendation = 'Poor Value (Reach Cost)';
    }

    return {
      ...item,
      player: item.player,
      position, // Live 2026 Position
      team,     // Live 2026 Team
      historical2025Team: item.team, // Preserved for reference
      isEligible,
      ineligibilityReason,
      adp,
      projPoints,
      posRank,
      expectedRound,
      lastSeasonRound: origDraftRd,
      thisSeasonKeeperCost,
      acquisitionLabel,
      surplusRounds,
      keeperTier,
      recommendation,
      marketTier: market?.tier || 'unknown',
    };
  });

  // Step 2: RULE 9 Same-Round Collision Resolution per Team
  const teamRoundUsage = new Map();
  evaluated.forEach(p => {
    if (p.isEligible && p.status === 'keeper') {
      const tName = p.draftTeam || 'My Team';
      if (!teamRoundUsage.has(tName)) teamRoundUsage.set(tName, new Set());

      let cost = p.thisSeasonKeeperCost;
      const usedRounds = teamRoundUsage.get(tName);

      while (usedRounds.has(cost) && cost > 1) {
        cost -= 1;
        p.acquisitionLabel += ` (Bumped to Rd ${cost} - Rule 9)`;
      }

      usedRounds.add(cost);
      p.thisSeasonKeeperCost = cost;
      p.surplusRounds = cost - p.expectedRound;
    }
  });

  // Sort by surplus rounds descending (best keepers first)
  return evaluated.sort((a, b) => b.surplusRounds - a.surplusRounds);
}

/**
 * Generates AI Draft Strategy Recommendations based on kept roster
 */
// FLAGGED (lint cleanup, 2026-08-22, not fixed — needs Andy's call): `leagueSize`
// is accepted and passed through by the one real caller
// (FantasyRosterManager.jsx's `activeProfile.leagueSize`) but never used in the
// strategy logic below, which currently derives Hero-RB/Zero-RB/etc. purely
// from position counts regardless of league size. Worth confirming whether
// league-size-aware thresholds were intended rather than silently dropping
// the parameter.
export function generateDraftStrategyInsights(evaluatedRoster = [], _leagueSize = 12) {
  const activeKeepers = evaluatedRoster.filter(p => p.isEligible && (p.status === 'keeper' || p.keeperTier === 'S-Tier' || p.keeperTier === 'A-Tier'));
  
  const countByPos = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
  activeKeepers.forEach(p => {
    if (countByPos[p.position] !== undefined) countByPos[p.position] += 1;
  });

  const totalSurplusRounds = activeKeepers.reduce((acc, p) => acc + Math.max(0, p.surplusRounds), 0);

  let strategyName = 'Balanced BPA Draft Strategy';
  let primaryNeed = 'Best Player Available';
  let earlyRoundFocus = 'Target top available talent in Rounds 1-3';

  if (countByPos.WR >= 2 && countByPos.RB === 0) {
    strategyName = 'Hero-RB Draft Strategy';
    primaryNeed = 'Elite Anchor Running Back';
    earlyRoundFocus = 'Target an elite Tier-1 RB in Round 1/2 since receiver value is locked in.';
  } else if (countByPos.RB >= 2 && countByPos.WR <= 1) {
    strategyName = 'Zero-RB / Alpha WR Focus Strategy';
    primaryNeed = 'Alpha Wide Receiver';
    earlyRoundFocus = 'Target elite target-share WRs in Rounds 1-3 to balance heavy RB keeper capital.';
  } else if (countByPos.QB >= 1 && countByPos.TE >= 1) {
    strategyName = 'Onesie Position Lock Strategy';
    primaryNeed = 'High-Volume Flex Positions (RB/WR)';
    earlyRoundFocus = 'Zero draft capital allocated to QB/TE early. Stack premium RBs and WRs.';
  }

  return {
    strategyName,
    primaryNeed,
    earlyRoundFocus,
    positionalCapital: countByPos,
    totalSurplusRounds,
    topKeepers: activeKeepers.slice(0, 3),
  };
}

/**
 * Reconciles a Final Roster against a Draft Board universally for ALL teams
 */
export function reconcileRosterWithDraftBoard(finalRoster = [], draftBoard = []) {
  const draftMap = new Map();
  draftBoard.forEach(item => {
    const key = `${normalizeName(item.player)}_${(item.position || '').toUpperCase()}`;
    draftMap.set(key, item);
    if (!draftMap.has(normalizeName(item.player))) {
      draftMap.set(normalizeName(item.player), item);
    }
  });

  const finalSet = new Set();
  const reconciled = finalRoster.map(item => {
    const key = `${normalizeName(item.player)}_${(item.position || '').toUpperCase()}`;
    const draftEntry = draftMap.get(key) || draftMap.get(normalizeName(item.player)) || null;

    finalSet.add(key);
    finalSet.add(normalizeName(item.player));

    const finalOwner = (item.draftTeam || '').trim().toLowerCase();
    const originalDraftOwner = draftEntry ? (draftEntry.draftTeam || '').trim().toLowerCase() : '';
    const isExplicitTrade = item.isTraded === true || (item.acquisitionType && item.acquisitionType.toLowerCase().includes('trade'));

    // UNIVERSAL RULE: If ANY player was dropped by original drafting team and picked up off FA/waivers
    // (or explicitly acquired via Free Agent pickup), their keeper cost RESETS TO ROUND 10!
    const wasDroppedAndReacquired = draftEntry && !isExplicitTrade && (
      (originalDraftOwner && finalOwner && originalDraftOwner !== finalOwner) ||
      (item.acquisitionType && item.acquisitionType.toLowerCase().includes('free agent'))
    );

    if (draftEntry && !wasDroppedAndReacquired) {
      const draftRd = draftEntry.keeperCostRound || draftEntry.lastSeasonRound || 10;
      return {
        ...item,
        lastSeasonRound: draftRd,
        keeperCostRound: draftRd >= 14 ? 14 : Math.max(1, draftRd - 2), // Rule 6 & Rule 2
        acquisitionType: `Drafted (Round ${draftRd})`,
        isFreeAgent: false,
        isDropped: false,
        wasDroppedAndReacquired: false,
        status: item.status || 'candidate',
      };
    } else {
      // FREE AGENT PICKUP (Undrafted or Dropped-and-Reacquired Reset Rule!)
      return {
        ...item,
        lastSeasonRound: null,
        keeperCostRound: 10, // Rule 5: Round 10 Rule for FA Pickups
        acquisitionType: wasDroppedAndReacquired ? 'FA Pickup (Dropped by Original Owner)' : 'Free Agent Pickup',
        isFreeAgent: true,
        isDropped: false,
        wasDroppedAndReacquired,
        status: item.status || 'candidate',
      };
    }
  });

  // Identify players who were drafted but are NOT on any final roster (dropped mid-season and unowned)
  draftBoard.forEach(item => {
    const key = `${normalizeName(item.player)}_${(item.position || '').toUpperCase()}`;
    if (!finalSet.has(key) && !finalSet.has(normalizeName(item.player))) {
      reconciled.push({
        ...item,
        status: 'ineligible',
        isDropped: true,
        acquisitionType: `Drafted (Round ${item.keeperCostRound || 10}) - Dropped Mid-Season`,
        notes: 'Ineligible (Dropped Mid-Season)',
      });
    }
  });

  return reconciled;
}
