// src/lib/fantasyRosterParser.js
// ═══════════════════════════════════════════════════════════════════════════════
// Smart Text Auto-Parser for Fantasy Football Roster & Draft Imports
// Parses raw text from Yahoo/ESPN web pages, markdown links, multi-line web pastes,
// CSVs (with Draft Round, Acquisition Type, & Manager/Team Owner), or lists.
// ═══════════════════════════════════════════════════════════════════════════════

import { getTeamAbbreviation } from './teams.js';

// Recognized position tokens (offense, kicking, IDP)
const VALID_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DST', 'LB', 'DB', 'DL', 'IDP', 'P']);

// Common header/stat/noise words to reject
const NOISE_TOKENS = new Set([
  'offense', 'kickers', 'defensive', 'players', 'bye', 'fan', 'pts', '%', 'start',
  'pre-season', 'pre‑season', 'actual', 'ros', 'yds', 'td', 'int', 'att', 'att*',
  'tgt', 'tgt*', 'rec', '2pt', 'lost', 'tackles', 'tack', 'solo', 'ast', 'sack',
  'safe', 'tfl', 'fum', 'force', 'blks', 'blk', 'kick', 'pass', 'ret', 'turnovers',
  'misc', 'rankings', 'trends', 'field', 'goals', 'made', 'pat'
]);

/**
 * Normalizes a position string to standard QB, RB, WR, TE, K, DEF, LB, DB, DL
 */
export function normalizePosition(posStr) {
  if (!posStr) return null;
  const clean = posStr.trim().toUpperCase();
  if (clean === 'DST' || clean === 'D/ST' || clean === 'DEFENSE') return 'DEF';
  if (VALID_POSITIONS.has(clean)) return clean;
  return null;
}

/**
 * Clean status flags & markdown links from player names (e.g. "[Dak Prescott](url)" -> "Dak Prescott")
 */
export function cleanPlayerName(rawName) {
  if (!rawName) return '';
  let name = rawName.trim();
  
  // Extract inner text from markdown links if present e.g. [Dak Prescott](https://...)
  const linkMatch = name.match(/\[([^\]]+)\]/);
  if (linkMatch) {
    name = linkMatch[1];
  }

  // Remove injury designation suffix like "McCaffreyQ", "HallQ", "JonesIR"
  name = name.replace(/(Q|D|IR|PUP|SUSP)$/, '').trim();
  
  // Remove markdown formatting if present
  name = name.replace(/^[#*_\-\s]+/, '').replace(/[#*_\-\s]+$/, '');
  return name;
}

/**
 * Parses a single text line or CSV line into a player object, or returns null if invalid.
 */
export function parseRawRosterLine(line) {
  if (!line || typeof line !== 'string') return null;
  const raw = line.trim();
  if (!raw || raw.length < 3) return null;

  const lower = raw.toLowerCase();

  // Reject pure numbers, dates, stats, or table headers
  if (/^\d+([.,]\d+)?%?$/.test(raw)) return null;
  if (/^(sun|mon|tue|wed|thu|fri|sat)\s+\d+:\d+/i.test(raw)) return null;
  if (lower.includes('roster for week') || lower.startsWith('fantasy') || lower.startsWith('rankings')) return null;
  if (lower.startsWith('player,position,team')) return null; // CSV header line

  // Check if line is purely noise tokens
  const words = raw.split(/\s+/);
  if (words.length <= 3 && words.every(w => NOISE_TOKENS.has(w.toLowerCase().replace(/[^a-z0-9*%-]/g, '')))) {
    return null;
  }

  // 1. CSV FORMAT PARSING
  // Format A: "Player",Pos,Team,KeeperRound,AcquisitionType,DraftTeam,IsPriorKeeper
  // Format B: "Player",Pos,Team,DraftTeam,AcquisitionType,AcquisitionDate,AcquiredAfterWeek11
  if (raw.includes(',') && !raw.includes('https://')) {
    const parts = raw.split(',').map(s => s.replace(/^["'\s]+|["'\s]+$/g, ''));
    if (parts.length >= 3) {
      const pName = cleanPlayerName(parts[0]);
      const pPos = normalizePosition(parts[1]);
      const pTeam = parts[2]?.toUpperCase();

      let pDraftTeam = 'My Team';
      let pAcq = 'Drafted';
      let pRoundRaw = NaN;

      if (parts.length >= 4) {
        const col3Num = parseInt(parts[3].replace(/\D/g, ''), 10);
        if (!isNaN(col3Num) && /^\d+$/.test(parts[3].trim())) {
          pRoundRaw = col3Num;
          pAcq = parts[4] || 'Drafted';
          pDraftTeam = parts[5] || 'My Team';
        } else {
          pDraftTeam = parts[3] || 'My Team';
          pAcq = parts[4] || 'Free Agent';
          if (parts[5]) {
            const col5Num = parseInt(parts[5].replace(/\D/g, ''), 10);
            if (!isNaN(col5Num)) pRoundRaw = col5Num;
          }
        }
      }

      if (pName && pPos && !NOISE_TOKENS.has(pName.toLowerCase()) && pName.toLowerCase() !== 'player') {
        return {
          id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          player: pName,
          position: pPos,
          team: getTeamAbbreviation(pTeam) || pTeam || 'NFL',
          keeperCostRound: !isNaN(pRoundRaw) && pRoundRaw >= 1 && pRoundRaw <= 30 ? pRoundRaw : 10,
          lastSeasonRound: !isNaN(pRoundRaw) && pRoundRaw >= 1 && pRoundRaw <= 30 ? pRoundRaw : null,
          keeperCostAuction: null,
          acquisitionType: pAcq,
          draftTeam: pDraftTeam,
          status: 'candidate',
          notes: !isNaN(pRoundRaw) ? `Round ${pRoundRaw} (${pAcq})` : pAcq,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  let playerName = '';
  let position = null;
  let team = '';
  let keeperCostRound = null;
  let keeperCostAuction = null;
  let acquisitionType = 'Unknown';
  let draftTeam = 'My Team';

  // Check explicit acquisition keywords
  if (lower.includes('free agent') || lower.includes('waiver') || lower.includes('fa pickup')) {
    acquisitionType = 'Free Agent';
  } else if (lower.includes('drafted') || lower.includes('draft round')) {
    acquisitionType = 'Drafted';
  }

  // 2. YAHOO FANTASY MARKDOWN / LINK PATTERN MATCHING
  const yahooPlayerMatch = raw.match(/\[([^\]]+)\]\(https:\/\/sports\.yahoo\.com\/nfl\/players\/\d+\)/);
  if (yahooPlayerMatch) {
    playerName = cleanPlayerName(yahooPlayerMatch[1]);

    const teamPosMatch = raw.match(/\b([A-Za-z]+)\s*-\s*(QB|RB|WR|TE|K|DEF|DST|D\/ST|LB|DB|DL|P)\b/i);
    if (teamPosMatch) {
      team = getTeamAbbreviation(teamPosMatch[1]) || teamPosMatch[1].toUpperCase();
      position = normalizePosition(teamPosMatch[2]);
    }
  }

  // 3. REGULAR TEXT PARSING
  if (!playerName || !position) {
    const roundMatch = raw.match(/(?:round|rd\.?|pick)\s*(\d+)/i);
    if (roundMatch) {
      keeperCostRound = parseInt(roundMatch[1], 10);
    }
    const auctionMatch = raw.match(/\$(\d+)/);
    if (auctionMatch) {
      keeperCostAuction = parseInt(auctionMatch[1], 10);
    }

    const teamPosMatch = raw.match(/\b([A-Za-z]+)\s*[-/]\s*(QB|RB|WR|TE|K|DEF|DST|D\/ST|LB|DB|DL|P)\b/i);
    if (teamPosMatch) {
      team = getTeamAbbreviation(teamPosMatch[1]) || teamPosMatch[1].toUpperCase();
      position = normalizePosition(teamPosMatch[2]);

      const parts = raw.split(teamPosMatch[0]);
      if (!playerName) playerName = cleanPlayerName(parts[0]);
    } else {
      // Freeform line parsing e.g. "Ja'Marr Chase WR CIN"
      const tokens = raw.split(/[\t,|\s]+/).map(t => t.trim()).filter(Boolean);
      let foundPos = null;
      let foundPosIdx = -1;

      tokens.forEach((tok, idx) => {
        const pos = normalizePosition(tok);
        if (pos && !foundPos) {
          foundPos = pos;
          foundPosIdx = idx;
        }
      });

      if (foundPos && foundPosIdx > 0) {
        position = foundPos;
        playerName = cleanPlayerName(tokens.slice(0, foundPosIdx).join(' '));
        if (tokens[foundPosIdx + 1] && /^[A-Za-z]{2,4}$/.test(tokens[foundPosIdx + 1])) {
          team = getTeamAbbreviation(tokens[foundPosIdx + 1]) || tokens[foundPosIdx + 1].toUpperCase();
        }
      }
    }
  }

  if (!playerName || !position) return null;

  return {
    id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    player: playerName,
    position,
    team: team || 'NFL',
    keeperCostRound: keeperCostRound || 10,
    keeperCostAuction,
    acquisitionType,
    draftTeam,
    status: 'candidate',
    notes: keeperCostRound ? `Round ${keeperCostRound}` : acquisitionType,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Parses raw text or CSV block into an array of player objects (handles multi-line pastes).
 */
export function parseRawRosterText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const players = [];
  const seen = new Set();

  let pendingPlayerName = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try parsing as single line or CSV
    const item = parseRawRosterLine(line);
    if (item && item.player && item.position) {
      const key = `${item.player.toLowerCase()}_${item.position.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        players.push(item);
      }
      pendingPlayerName = null;
      continue;
    }

    // Check if line matches Team - POS (e.g. "Dal - QB", "Hou - WR")
    const teamPosMatch = line.match(/\b([A-Za-z]+)\s*-\s*(QB|RB|WR|TE|K|DEF|DST|D\/ST|LB|DB|DL|P)\b/i);
    if (teamPosMatch && pendingPlayerName) {
      const combinedLine = `${pendingPlayerName} ${teamPosMatch[1]} - ${teamPosMatch[2]}`;
      const combinedItem = parseRawRosterLine(combinedLine);
      if (combinedItem && combinedItem.player && combinedItem.position) {
        const key = `${combinedItem.player.toLowerCase()}_${combinedItem.position.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          players.push(combinedItem);
        }
      }
      pendingPlayerName = null;
      continue;
    }

    // Check if line looks like a player name candidate
    const cleaned = cleanPlayerName(line);
    if (cleaned.length >= 3 && !NOISE_TOKENS.has(cleaned.toLowerCase()) && /^[A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.'-]+)+$/.test(cleaned)) {
      pendingPlayerName = cleaned;
    } else {
      pendingPlayerName = null;
    }
  }

  return players;
}
