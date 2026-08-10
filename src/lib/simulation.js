// File: src/lib/simulation.js
// Uses unified team database from teams.js

import logger from './logger';
import { ABBREV_TO_TEAM } from './teams.js';

// 1. Math Helper: Box-Muller Transform
function boxMullerRandom() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// 2. PARSER: Simple Text
export const parseCustomRatings = (inputText) => {
    const lines = inputText.split('\n');
    const ratings = {};
    const cleanName = (name) => name.toLowerCase().replace(/[^a-z]/g, '');

    lines.forEach(line => {
        if (!line.trim()) return;
        const numbers = line.match(/-?\d+(\.\d+)?/g);
        const teamPart = line.replace(/-?\d+(\.\d+)?/g, '').trim();
        const teamKey = cleanName(teamPart);

        if (teamKey.length > 2 && numbers && numbers.length >= 2) {
            ratings[teamKey] = {
                off: parseFloat(numbers[0]), 
                def: parseFloat(numbers[1]), 
                tempo: numbers[2] ? parseFloat(numbers[2]) : 1.0 
            };
        }
    });
    return ratings;
};

// 3. UNIVERSAL PARSER (Smart Header & Stagger Detection)
export const mergeRBSDMStats = (offCSV, defCSV) => {
    const ratings = {};
    const clean = (str) => str ? str.replace(/"/g, '').trim() : "";

    const processCSV = (text, type) => {
        const lines = text.split('\n').filter(l => l.trim() !== ''); 
        if (lines.length < 2) return;

        // A. FIND HEADER
        let headerIdx = -1;
        let epaIdx = -1;
        
        for(let i=0; i < Math.min(10, lines.length); i++) {
            const row = lines[i].toLowerCase().split(',').map(c => clean(c));
            if (row.includes('epa/play') || row.includes('epa') || row.includes('total dvoa') || row.includes('dvoa')) {
                headerIdx = i;
                epaIdx = row.findIndex(c => c === 'epa/play' || c === 'epa' || c === 'total dvoa' || c === 'dvoa');
                break;
            }
        }

        if (headerIdx === -1) {
            logger.error(`Could not find header in ${type} CSV`);
            return;
        }
        if (epaIdx === -1) epaIdx = 2; 

        // B. DETECT FORMAT (Staggered check)
        let isStaggered = false;
        if (lines.length > headerIdx + 2) {
            const row1 = lines[headerIdx + 1].split(',').map(c => clean(c));
            const row2 = lines[headerIdx + 2].split(',').map(c => clean(c));
            const col0IsNum = !isNaN(parseFloat(row1[0]));
            const col0IsStr = isNaN(parseFloat(row2[0])) && row2[0].length > 2;
            if (col0IsNum && col0IsStr) isStaggered = true;
        }

        // C. PARSE ROWS
        for (let i = headerIdx + 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 2) continue;

            let teamName = "";
            let val = 0.0;

            if (isStaggered) {
                const potentialRank = parseFloat(clean(cols[0]));
                if (!isNaN(potentialRank)) {
                    val = parseFloat(clean(cols[epaIdx]));
                    if (i + 1 < lines.length) {
                        const nextRow = lines[i+1].split(',');
                        teamName = clean(nextRow[0]); 
                        i++; 
                    }
                } else continue; 
            } else {
                const c0 = clean(cols[0]);
                const c1 = clean(cols[1]);
                const c2 = clean(cols[2]);
                if (isNaN(parseFloat(c0)) && c0.length > 2) teamName = c0;
                else if (isNaN(parseFloat(c1)) && c1.length > 2) teamName = c1;
                else if (isNaN(parseFloat(c2)) && c2.length > 2) teamName = c2;
                val = parseFloat(clean(cols[epaIdx]));
            }

            if (!teamName || isNaN(val)) continue;
            const teamKey = teamName.toLowerCase().replace(/[^a-z]/g, '');
            if (!ratings[teamKey]) ratings[teamKey] = { off: 0, def: 0, tempo: 1.0 };
            if (type === 'off') ratings[teamKey].off = val;
            if (type === 'def') ratings[teamKey].def = val;
        }
    };

    processCSV(offCSV, 'off');
    processCSV(defCSV, 'def');
    return ratings;
};

// 4. Monte Carlo Engine
export const runSimulation = (game, ratings, iterations = 10000) => {
    const hKey = game.home.toLowerCase().replace(/[^a-z]/g, '');
    const vKey = game.visitor.toLowerCase().replace(/[^a-z]/g, '');

    const findRating = (key) => {
        if (ratings[key]) return ratings[key];
        
        // Use unified abbreviation lookup from teams.js
        for (const [abbr, full] of Object.entries(ABBREV_TO_TEAM)) {
            if ((key.includes(full) || key.includes(abbr)) && (ratings[abbr] || ratings[full])) {
                return ratings[abbr] || ratings[full];
            }
        }
        const match = Object.keys(ratings).find(k => key.includes(k) || k.includes(key));
        return ratings[match] || { off: 0, def: 0, tempo: 1.0 };
    };

    const homeStats = findRating(hKey);
    const visStats = findRating(vKey);

    const LEAGUE_AVG_SCORE = 21.5; 
    const HOME_FIELD_ADV = 1.5;    

    let homeTotalScore = 0, visTotalScore = 0;
    let homeWins = 0, pushes = 0, totalPointsAccum = 0;

    for (let i = 0; i < iterations; i++) {
        const homeNoise = boxMullerRandom() * 10.0;
        const visNoise = boxMullerRandom() * 10.0;
        
        let scale = 1.0;
        if (Math.abs(homeStats.off) < 2.0) scale = 25.0; // Auto-scale small EPA numbers

        let homeSim = LEAGUE_AVG_SCORE + ((homeStats.off + visStats.def) * scale) + HOME_FIELD_ADV + homeNoise;
        let visSim = LEAGUE_AVG_SCORE + ((visStats.off + homeStats.def) * scale) + visNoise;

        const pace = (homeStats.tempo + visStats.tempo) / 2;
        homeSim = homeSim * pace;
        visSim = visSim * pace;

        const hFinal = Math.max(0, Math.round(homeSim));
        const vFinal = Math.max(0, Math.round(visSim));

        homeTotalScore += hFinal;
        visTotalScore += vFinal;
        totalPointsAccum += (hFinal + vFinal);

        if (hFinal > vFinal) homeWins++;
        if (hFinal === vFinal) pushes++;
    }

    return {
        avgHome: (homeTotalScore / iterations).toFixed(1),
        avgVis: (visTotalScore / iterations).toFixed(1),
        trueLine: parseFloat(((visTotalScore / iterations) - (homeTotalScore / iterations)).toFixed(1)),
        trueTotal: parseFloat((totalPointsAccum / iterations).toFixed(1)),
        homeWinProb: ((homeWins / iterations) * 100).toFixed(1),
        // FIX (lint cleanup, 2026-08-10): pushes was computed every iteration
        // but silently dropped from this return value -- no caller could ever
        // see push probability even though it's tracked identically to
        // homeWinProb above. Added the missing field rather than just
        // deleting the unused `pushes` variable.
        pushProb: ((pushes / iterations) * 100).toFixed(1),
        edge: null
    };
};