// Sportsbook bet import parsers
// Handles different sportsbook formats for importing placed bets

import { BET_TYPES, BET_STATUS } from './bankroll.js';

// Bookmaker format parser
export const parseBookmakerBet = (betText) => {
  const lines = betText.trim().split('\n').filter(line => line.trim());

  const result = {
    source: 'Bookmaker',
    type: 'parlay', // Default for multi-leg bets
    legs: [],
    openSlots: 0,
    ticketNumber: null,
    placedDate: null,
    riskAmount: 0,
    potentialWin: 0,
    status: BET_STATUS.PENDING,
    isHedgingBet: false,
    notes: ''
  };

  let currentLeg = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse parlay header
    if (line.includes('TEAMS PARLAY')) {
      const match = line.match(/(\d+)\s+TEAMS\s+PARLAY/);
      if (match) {
        result.totalLegs = parseInt(match[1]);
        result.type = result.totalLegs === 1 ? 'single' : 'parlay';
      }
    }

    // Parse NFL bet lines
    if (line.startsWith('NFL ') || line.startsWith('LIVENFL ')) {
      if (currentLeg) {
        result.legs.push(currentLeg);
      }

      currentLeg = {
        sport: 'NFL',
        team: '',
        betType: '',
        line: '',
        odds: '',
        game: '',
        gameTime: ''
      };

      // Parse the bet details
      let betDetails = line.replace(/^(LIVE)?NFL\s*/, '');

      // Handle spread bets
      if (betDetails.includes(' +') || betDetails.includes(' -')) {
        const spreadMatch = betDetails.match(/(.+?)\s+([+-][\d.½]+)([+-]\d+)?/);
        if (spreadMatch) {
          currentLeg.team = spreadMatch[1].trim();
          currentLeg.betType = 'spread';
          currentLeg.line = spreadMatch[2];
          currentLeg.odds = spreadMatch[3] || '-110';
        }
      }

      // Handle totals
      if (betDetails.includes('TOTAL')) {
        const totalMatch = betDetails.match(/TOTAL\s+(o|u)([\d.]+)([+-]\d+)/);
        if (totalMatch) {
          currentLeg.betType = 'total';
          currentLeg.line = `${totalMatch[1]}${totalMatch[2]}`;
          currentLeg.odds = totalMatch[3];

          // Extract game info from parentheses
          const gameMatch = betDetails.match(/\((.+?)\)/);
          if (gameMatch) {
            currentLeg.game = gameMatch[1];
          }
        }
      }
    }

    // Parse game matchup
    if (line.includes(' vs ') && currentLeg) {
      currentLeg.game = line;
    }

    // Parse game start time
    if (line.startsWith('Game Start') && currentLeg) {
      const timeMatch = line.match(/Game Start\s+(.+)/);
      if (timeMatch) {
        currentLeg.gameTime = timeMatch[1];
      }
    }

    // Parse open slots
    if (line.startsWith('OPEN PLAY')) {
      result.openSlots++;
      if (currentLeg) {
        result.legs.push(currentLeg);
        currentLeg = null;
      }

      // Add open slot placeholder
      result.legs.push({
        sport: 'NFL',
        team: 'OPEN SLOT',
        betType: 'open',
        line: 'TBD',
        odds: 'TBD',
        game: 'To Be Determined',
        gameTime: 'TBD'
      });
    }

    // Parse ticket number
    if (line.startsWith('Ticket #')) {
      const ticketMatch = line.match(/Ticket #\s*(\d+)/);
      if (ticketMatch) {
        result.ticketNumber = ticketMatch[1];
      }
    }

    // Parse placed date
    if (line.startsWith('Placed')) {
      const dateMatch = line.match(/Placed\s+(.+)/);
      if (dateMatch) {
        result.placedDate = new Date(dateMatch[1]).toISOString();
      }
    }

    // Parse risk and win amounts
    if (line.includes('Risk:') && line.includes('Win:')) {
      const riskMatch = line.match(/Risk:\$?([\d,]+\.?\d*)/);
      const winMatch = line.match(/Win:\$?([\d,]+\.?\d*)/);

      if (riskMatch) {
        result.riskAmount = parseFloat(riskMatch[1].replace(/,/g, ''));
      }
      if (winMatch) {
        result.potentialWin = parseFloat(winMatch[1].replace(/,/g, ''));
      }
    }
  }

  // Add the last leg if exists
  if (currentLeg) {
    result.legs.push(currentLeg);
  }

  // Determine if this is a hedging bet (has open slots)
  result.isHedgingBet = result.openSlots > 0;

  // Generate bet description
  if (result.type === 'parlay') {
    const filledLegs = result.legs.filter(leg => leg.betType !== 'open').length;
    result.description = `${filledLegs}${result.openSlots > 0 ? `+${result.openSlots}` : ''} Team Parlay`;

    if (result.isHedgingBet) {
      result.notes = `Hedging parlay with ${result.openSlots} open slot(s) for future fills`;
    }
  } else {
    result.description = 'Single Bet';
  }

  return result;
};

// BetOnline format parser
export const parseBetOnlineBet = (betText) => {
  const lines = betText.trim().split('\n').filter(line => line.trim());

  const result = {
    source: 'BetOnline',
    type: 'single', // BetOnline format is typically single bets
    legs: [],
    openSlots: 0,
    ticketNumber: null,
    placedDate: null,
    riskAmount: 0,
    potentialWin: 0,
    status: BET_STATUS.PENDING,
    isHedgingBet: false,
    notes: '',
    betType: '',
    description: ''
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    // Parse ticket number
    if (line.includes('Ticket Number:')) {
      const ticketMatch = nextLine.match(/(\d+)/);
      if (ticketMatch) {
        result.ticketNumber = ticketMatch[1];
      }
    }

    // Parse accepted date
    if (line.includes('Accepted Date:')) {
      if (nextLine) {
        try {
          result.placedDate = new Date(nextLine).toISOString();
        } catch (_e) {
          result.placedDate = new Date().toISOString();
        }
      }
    }

    // Parse amount (risk)
    if (line.includes('Amount:')) {
      const amountMatch = nextLine.match(/\$?([\d,]+\.?\d*)/);
      if (amountMatch) {
        result.riskAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }
    }

    // Parse status
    if (line.includes('Status:')) {
      const status = nextLine.toLowerCase();
      if (status.includes('pending')) {
        result.status = BET_STATUS.PENDING;
      } else if (status.includes('won') || status.includes('win')) {
        result.status = BET_STATUS.WON;
      } else if (status.includes('lost') || status.includes('lose')) {
        result.status = BET_STATUS.LOST;
      } else if (status.includes('push')) {
        result.status = BET_STATUS.PUSHED;
      }
    }

    // Parse to win amount
    if (line.includes('To win:')) {
      const winMatch = nextLine.match(/\$?([\d,]+\.?\d*)/);
      if (winMatch) {
        result.potentialWin = parseFloat(winMatch[1].replace(/,/g, ''));
      }
    }

    // Parse bet type
    if (line.includes('Type:')) {
      const type = nextLine.toLowerCase();
      if (type.includes('future')) {
        result.betType = BET_TYPES.FUTURES;
        result.type = 'futures';
      } else if (type.includes('prop')) {
        result.betType = BET_TYPES.PROP;
        result.type = 'prop';
      } else if (type.includes('spread')) {
        result.betType = BET_TYPES.SPREAD;
      } else if (type.includes('total')) {
        result.betType = BET_TYPES.TOTAL;
      } else if (type.includes('moneyline')) {
        result.betType = BET_TYPES.MONEYLINE;
      } else {
        result.betType = 'unknown';
      }
    }

    // Parse description (contains the actual bet details)
    if (line.includes('Description:')) {
      result.description = nextLine;
      result.notes = `BetOnline ${result.betType} bet`;

      // Parse team and odds from description
      const leg = {
        sport: 'NFL',
        team: '',
        betType: result.betType,
        line: '',
        odds: '',
        game: result.description,
        gameTime: ''
      };

      // Extract team name and odds from description
      // Example: "NFL Futures - Super Bowl Futures - Super Bowl 2026 LX Winner - Buffalo Bills +600"
      const parts = nextLine.split(' - ');
      if (parts.length >= 4) {
        const teamAndOdds = parts[parts.length - 1]; // "Buffalo Bills +600"
        const oddsMatch = teamAndOdds.match(/(.+?)\s+([+-]\d+)/);
        if (oddsMatch) {
          leg.team = oddsMatch[1].trim();
          leg.odds = oddsMatch[2];
          leg.line = result.betType === BET_TYPES.FUTURES ? 'Win Championship' : '';
        } else {
          leg.team = teamAndOdds;
        }
      }

      result.legs.push(leg);
    }
  }

  // Generate bet description if not already set
  if (!result.description && result.legs.length > 0) {
    const leg = result.legs[0];
    if (result.betType === BET_TYPES.FUTURES) {
      result.description = `${leg.team} Futures Bet`;
    } else {
      result.description = `${leg.team} ${result.betType} Bet`;
    }
  }

  return result;
};

// DraftKings format parser (placeholder for future implementation)
export const parseDraftKingsBet = (_betText) => {
  // TODO: Implement DraftKings parser
  return {
    source: 'DraftKings',
    error: 'DraftKings parser not yet implemented'
  };
};

// FanDuel format parser (placeholder for future implementation)
export const parseFanDuelBet = (_betText) => {
  // TODO: Implement FanDuel parser
  return {
    source: 'FanDuel',
    error: 'FanDuel parser not yet implemented'
  };
};

// Main parser function that detects format and routes to appropriate parser
export const parseImportedBet = (betText, sourceHint = null) => {
  const text = betText.trim().toLowerCase();

  // Auto-detect source if not provided
  let source = sourceHint;

  if (!source) {
    if (text.includes('teams parlay') && text.includes('ticket #')) {
      source = 'Bookmaker';
    } else if (text.includes('ticket number:') && text.includes('accepted date:')) {
      source = 'BetOnline';
    } else if (text.includes('draftkings')) {
      source = 'DraftKings';
    } else if (text.includes('fanduel')) {
      source = 'FanDuel';
    } else {
      source = 'Unknown';
    }
  }

  // Route to appropriate parser
  switch (source) {
    case 'Bookmaker':
      return parseBookmakerBet(betText);
    case 'BetOnline':
      return parseBetOnlineBet(betText);
    case 'DraftKings':
      return parseDraftKingsBet(betText);
    case 'FanDuel':
      return parseFanDuelBet(betText);
    default:
      return {
        source: 'Unknown',
        error: 'Unsupported sportsbook format'
      };
  }
};

// Convert parsed bet to bankroll format
export const convertTobankrollBet = (parsedBet) => {
  if (parsedBet.error) {
    return null;
  }

  const bankrollBet = {
    // Basic bet info
    source: parsedBet.source,
    ticketNumber: parsedBet.ticketNumber,
    type: parsedBet.type,
    description: parsedBet.description,

    // Financial info
    amount: parsedBet.riskAmount,
    units: 0, // Will be calculated based on current unit size
    potentialWin: parsedBet.potentialWin,

    // Betting details
    odds: parsedBet.legs[0]?.odds || 'N/A',
    line: parsedBet.legs.map(leg => `${leg.team} ${leg.line}`).join(', '),

    // Game info
    game: parsedBet.legs[0]?.game || 'Multiple Games',
    team: parsedBet.legs.length === 1 ? parsedBet.legs[0].team : 'Multiple Teams',

    // Dates and status
    date: parsedBet.placedDate || new Date().toISOString(),
    status: parsedBet.status,

    // Special properties
    isParlay: parsedBet.type === 'parlay',
    isHedgingBet: parsedBet.isHedgingBet,
    openSlots: parsedBet.openSlots,
    legs: parsedBet.legs,

    // Notes
    notes: parsedBet.notes || `Imported from ${parsedBet.source}`,

    // Metadata
    imported: true,
    importedAt: new Date().toISOString()
  };

  return bankrollBet;
};

// Validation function for imported bets
export const validateImportedBet = (parsedBet) => {
  const errors = [];

  if (!parsedBet.riskAmount || parsedBet.riskAmount <= 0) {
    errors.push('Invalid or missing risk amount');
  }

  if (!parsedBet.legs || parsedBet.legs.length === 0) {
    errors.push('No bet legs found');
  }

  if (!parsedBet.ticketNumber) {
    errors.push('Missing ticket number');
  }

  if (!parsedBet.placedDate) {
    errors.push('Missing placement date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to format imported bet for display
export const formatImportedBetDisplay = (parsedBet) => {
  if (parsedBet.error) {
    return {
      title: 'Import Error',
      subtitle: parsedBet.error,
      details: []
    };
  }

  const details = [];

  // Add financial info
  details.push(`Risk: $${parsedBet.riskAmount?.toFixed(2) || '0.00'}`);
  details.push(`Potential Win: $${parsedBet.potentialWin?.toFixed(2) || '0.00'}`);

  // Add legs info
  parsedBet.legs?.forEach((leg, index) => {
    if (leg.betType === 'open') {
      details.push(`Leg ${index + 1}: OPEN SLOT`);
    } else {
      details.push(`Leg ${index + 1}: ${leg.team} ${leg.line} (${leg.odds})`);
    }
  });

  // Add ticket info
  if (parsedBet.ticketNumber) {
    details.push(`Ticket: #${parsedBet.ticketNumber}`);
  }

  if (parsedBet.placedDate) {
    details.push(`Placed: ${new Date(parsedBet.placedDate).toLocaleString()}`);
  }

  return {
    title: parsedBet.description || 'Imported Bet',
    subtitle: `${parsedBet.source} ${parsedBet.isHedgingBet ? '(Hedging Bet)' : ''}`,
    details
  };
};