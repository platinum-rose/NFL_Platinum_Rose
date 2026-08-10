// src/lib/actionParser.js
// Uses unified team database from teams.js

import logger from './logger';
import { NAME_MAP } from './teams.js';

export const parseActionNetworkDump = (text) => {
    const updates = [];
    
    // 1. Normalize the text: Remove all newlines and condense multiple spaces into one.
    // This turns the vertical "mess" into a single long string of tokens.
    const normalizedText = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");

    logger.log("Parsing Normalized Stream...");

    // 2. Identify all known teams in the stream
    // We create a list of found tokens in order: [{type: 'team', val: 'Falcons'}, {type: 'team', val: 'Buccaneers'}...]
    const tokens = [];
    
    // Split by space to iterate words, but re-assemble for teams with spaces (like 'San Francisco') if needed
    // Actually, simpler approach: Regex search for the teams + regex search for stats
    
    // Let's iterate the original NAME_MAP keys and find their positions
    // This is tricky because "Eagles" appears multiple times. 
    // Better: Split by " " and match against map.
    
    const words = normalizedText.split(" ");
    
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        
        // Handle 2-word teams if necessary (though your map uses short names mostly)
        // Check if word is a known team
        if (NAME_MAP[word]) {
            tokens.push({ type: 'team', value: NAME_MAP[word], index: i });
        }
        // Check for Stats Block: 34%66%66%34%
        else if (word.match(/(\d+)%(\d+)%(\d+)%(\d+)%/)) {
             const match = word.match(/(\d+)%(\d+)%(\d+)%(\d+)%/);
             tokens.push({ 
                 type: 'stats', 
                 visBets: parseInt(match[1]), 
                 homeBets: parseInt(match[2]),
                 visCash: parseInt(match[3]),
                 homeCash: parseInt(match[4]),
                 index: i
             });
        }
    }

    logger.log("Tokens found:", tokens);

    // 3. Match Pattern: Team -> Team -> ... -> Stats
    // We look for a stats block, then look backwards for the 2 closest teams.
    
    tokens.forEach((token, idx) => {
        if (token.type === 'stats') {
            // Look back for Home Team (should be idx-1 or close to it)
            // Look back for Visitor Team (should be idx-2)
            
            // Scan backwards from this stat token
            let home = null;
            let visitor = null;
            
            for (let j = idx - 1; j >= 0; j--) {
                if (tokens[j].type === 'team') {
                    if (!home) {
                        home = tokens[j].value;
                    } else {
                        visitor = tokens[j].value;
                        break; // Found pair
                    }
                }
            }

            if (home && visitor) {
                logger.log(`✅ MATCH: ${visitor} @ ${home} -> ${token.homeBets}% Tickets / ${token.homeCash}% Cash`);
                
                updates.push({
                    visitor,
                    home,
                    splits: {
                        spread: {
                            tickets: token.homeBets,
                            cash: token.homeCash
                        },
                        total: { tickets: 50, cash: 50 }
                    }
                });
            }
        }
    });

    return updates;
};

/**
 * Parse Action Network Splits in Tabular Format
 * Handles modern Action Network table format with teams, odds, and betting percentages
 * 
 * Example input:
 * Scheduled  Open Best Odds % of Bets % of Money Diff Bets
 * Sun 2/08, 3:30 PM
 * Seahawks Team Icon
 * Seahawks
 * 109
 * Patriots Team Icon
 * Patriots
 * 110
 * -4.5
 * +4.5
 * 63%
 * 37%
 * 60%
 * 40%
 * +3%
 */
export const parseActionNetworkSplits = (text) => {
    const results = [];
    
    logger.log("🔍 Parsing Action Network Splits format...");
    logger.log("Input length:", text.length, "chars");
    
    // Split by lines and filter out empty lines
    const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0);
    logger.log("📝 Lines found:", lines.length);
    
    // Find team names - look for lines that match known team names
    let teams = [];
    const teamNames = Object.keys(NAME_MAP);
    
    for (const line of lines) {
        // Skip header lines, "Team Icon" lines, and date lines
        if (line.includes('Scheduled') || 
            line.includes('Team Icon') || 
            line.includes('Open') || 
            line.includes('Best Odds') ||
            line.match(/^[A-Z][a-z]{2}\s+\d+\/\d+/)) {
            continue;
        }
        
        // Check if this line is a team name
        const found = teamNames.find(tn => {
            const cleanLine = line.toLowerCase().replace(/[^a-z]/g, '');
            const cleanTeam = tn.toLowerCase().replace(/[^a-z]/g, '');
            return cleanLine === cleanTeam || cleanLine.includes(cleanTeam);
        });
        
        if (found && !teams.find(t => t === found)) {
            logger.log(`🏈 Found team: ${found}`);
            teams.push(found);
        }
    }
    
    logger.log("🏈 Teams found:", teams);
    
    if (teams.length < 2) {
        logger.log("❌ Could not find 2 teams");
        return results;
    }
    
    // Extract percentages: Look for patterns like "63%" and "37%"
    const percentMatches = text.match(/(\d+)%/g) || [];
    const percentages = percentMatches.map(p => parseInt(p.replace('%', '')));
    
    logger.log("📊 All percentages found:", percentages);
    
    // Expected pattern: bet%, bet%, money%, money%, [diff%]
    // For example: 63%, 37%, 60%, 40%, +3%
    // We need the first 4 percentages that are NOT the diff (which has a + or -)
    
    // Filter out diff percentage (the one with +/- sign in the text)
    const betMoneyPercentages = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Start collecting percentages after we see betting/money related content
        if (line.match(/^\d+%$/) && !line.match(/^[+-]/)) {
            const pct = parseInt(line);
            if (pct <= 100) {
                betMoneyPercentages.push(pct);
            }
        }
    }
    
    logger.log("📊 Bet/Money percentages:", betMoneyPercentages);
    
    if (betMoneyPercentages.length >= 4) {
        const visitor = teams[0];
        const home = teams[1];
        
        const visBets = betMoneyPercentages[0];
        const homeBets = betMoneyPercentages[1];
        const visCash = betMoneyPercentages[2];
        const homeCash = betMoneyPercentages[3];
        
        logger.log(`✅ MATCH: ${visitor} @ ${home}`);
        logger.log(`   Bets: ${visBets}% / ${homeBets}%`);
        logger.log(`   Money: ${visCash}% / ${homeCash}%`);
        
        results.push({
            visitor,
            home,
            visBets,
            homeBets,
            visCash,
            homeCash,
            splits: {
                // Format for GameBadges (expects spread.tickets and spread.cash)
                spread: {
                    tickets: homeBets,
                    cash: homeCash
                },
                // Format for SplitsModal (expects ats with visitor/home properties)
                ats: {
                    visitorTicket: visBets,
                    homeTicket: homeBets,
                    visitorMoney: visCash,
                    homeMoney: homeCash
                },
                // Placeholder for total (not provided by Action Network spread data)
                total: {
                    overTicket: 50,
                    underTicket: 50,
                    overMoney: 50,
                    underMoney: 50
                }
            }
        });
    } else {
        logger.log(`⚠️ Not enough percentages found: ${betMoneyPercentages.length}`);
    }
    
    return results;
};

/**
 * Parse Action Network Moneyline Splits (ML format)
 * Example:
 * Scheduled | Open | Best Odds | % of Bets | % of Money | Diff | Bets
 * Sun 2/08, 3:30 PM
 * Seahawks Team Icon | Seahawks | -225 | 77% | 78% | ...
 * Patriots Team Icon | Patriots | +185 | 23% | 22% | ...
 */
export const parseActionNetworkMoneyline = (text) => {
    logger.log("🏈 Parsing Moneyline format...");
    const results = [];
    
    // Split by lines and clean
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    logger.log(`📝 Total lines to process: ${lines.length}`);
    logger.log(`📝 First few lines:`, lines.slice(0, 5));
    
    // Find team lines (contain team names and "Team Icon" or odds)
    const teams = [];
    const percentages = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip headers and scheduled info
        if (line.toLowerCase().includes('scheduled') || 
            line.toLowerCase().includes('open') ||
            line.toLowerCase().includes('% of') ||
            line.toLowerCase().includes('diff') ||
            line.toLowerCase().includes('best odds')) continue;
        
        // Look for team names (full names, not abbreviations)
        const teamMatch = line.match(/Seahawks|Patriots|Bengals|Ravens|Bills|Chiefs|Cowboys|Eagles|Packers|Lions|Vikings|Saints|Buccaneers|Falcons|Panthers|Bears|Texans|Colts|Titans|Jaguars|Broncos|Chargers|Raiders|49ers|Cardinals|Rams|Dolphins|Jets|Giants|Steelers|Browns|Commanders/i);
        
        if (teamMatch) {
            const teamName = teamMatch[0];
            teams.push(teamName);
            logger.log(`✓ Found team: ${teamName}`);
        }
        
        // Look for percentage lines (77%, 23%, 78%, 22%, etc.)
        const percentMatch = line.match(/\d+%/g);
        if (percentMatch) {
            percentMatch.forEach(p => {
                const pctNum = parseInt(p);
                percentages.push(pctNum);
                logger.log(`  → Found %: ${pctNum}%`);
            });
        }
    }
    
    logger.log(`📊 Found ${teams.length} teams: ${teams.join(', ')}`);
    logger.log(`📈 Found ${percentages.length} percentages: ${percentages.slice(0, 8).join(', ')}`);
    
    // We need 2 teams and 4 percentages (2 bet %, 2 money %)
    if (teams.length >= 2 && percentages.length >= 4) {
        const visitor = teams[0];
        const home = teams[1];
        
        // Take first 4 percentages: visitor bets, home bets, visitor money, home money
        const visBets = percentages[0];
        const homeBets = percentages[1];
        const visMoney = percentages[2];
        const homeMoney = percentages[3];
        
        logger.log(`✅ MONEYLINE MATCH: ${visitor} @ ${home}`);
        logger.log(`   Bets: ${visBets}% / ${homeBets}%`);
        logger.log(`   Money: ${visMoney}% / ${homeMoney}%`);
        
        results.push({
            visitor,
            home,
            visBets,
            homeBets,
            visMoney,
            homeMoney,
            splits: {
                // Format for GameBadges (only has spread, so skip for ML)
                spread: {
                    tickets: homeBets,
                    cash: homeMoney
                },
                // Format for SplitsModal (expects ml with visitor/home properties)
                ml: {
                    visitorTicket: visBets,
                    homeTicket: homeBets,
                    visitorMoney: visMoney,
                    homeMoney: homeMoney
                },
                // Format for ATS (placeholder - ML doesn't include spread data)
                ats: {
                    visitorTicket: 50,
                    homeTicket: 50,
                    visitorMoney: 50,
                    homeMoney: 50
                },
                // Placeholder for total
                total: {
                    overTicket: 50,
                    underTicket: 50,
                    overMoney: 50,
                    underMoney: 50
                }
            }
        });
    } else {
        logger.log(`⚠️ Not enough teams or percentages for ML format`);
    }
    
    return results;
};

/**
 * Auto-detect format and parse accordingly
 */
export const parseActionNetworkAuto = (text) => {
    logger.log("🔍 Auto-detecting Action Network format...");
    
    // Check for moneyline format (has team names, percentages, and odds)
    const hasTeamNames = /Seahawks|Patriots|Bengals|Ravens|Bills|Chiefs|Cowboys|Eagles|Packers|Lions|Vikings|Saints|Buccaneers|Falcons|Panthers|Bears|Texans|Colts|Titans|Jaguars|Broncos|Chargers|Raiders|49ers|Cardinals|Rams|Dolphins|Jets|Giants|Steelers|Browns|Commanders/i.test(text);
    const hasPercentages = (text.match(/\d+%/g) || []).length >= 4;
    const hasOdds = /[-+]\d{2,4}\b|Best Odds|% of Bets|% of Money/i.test(text);
    
    if (hasTeamNames && hasPercentages && hasOdds) {
        logger.log("🏈 Detected Moneyline format (teams + percentages + odds)");
        const result = parseActionNetworkMoneyline(text);
        if (result && result.length > 0) return result;
    }
    
    // Check for inline format (numbers%numbers%numbers%numbers%)
    if (text.match(/\d+%\d+%\d+%\d+%/)) {
        logger.log("📋 Detected inline format");
        return parseActionNetworkDump(text);
    }
    
    // Check for tabular format (has percentages and team names)
    // Look for multiple percentages (even if on separate lines)
    const hasMultiplePercentages = (text.match(/\d+%/g) || []).length >= 4;
    const hasTeamNamesTabular = text.toLowerCase().includes('seahawks') || 
                         text.toLowerCase().includes('patriots') ||
                         text.toLowerCase().includes('team icon');
    
    if (hasMultiplePercentages && hasTeamNamesTabular) {
        logger.log("📊 Detected tabular format (multiline)");
        return parseActionNetworkSplits(text);
    }
    
    // Fallback: if it has percentages, try the splits parser
    if (hasMultiplePercentages) {
        logger.log("📊 Trying splits parser (has percentages)");
        return parseActionNetworkSplits(text);
    }
    
    logger.log("❓ Unknown format - no percentages or team names found");
    logger.log("Sample of input:", text.substring(0, 200));
    return [];
};