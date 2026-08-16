// scripts/calculate-win-total-probabilities.js
// Calculates win total probabilities & expected win distributions for all 32 teams.

const TEAMS = [
  { team: 'LAR', name: 'Los Angeles Rams', line: 11.5, overOdds: -125, underOdds: +105, emr: 74, projWins: 12.1 },
  { team: 'BAL', name: 'Baltimore Ravens', line: 11.5, overOdds: -115, underOdds: -105, emr: 65, projWins: 11.4 },
  { team: 'KC',  name: 'Kansas City Chiefs', line: 11.5, overOdds: -110, underOdds: -110, emr: 71, projWins: 11.3 },
  { team: 'SF',  name: 'San Francisco 49ers', line: 11.5, overOdds: -105, underOdds: -115, emr: 61, projWins: 11.1 },
  { team: 'DET', name: 'Detroit Lions', line: 10.5, overOdds: -135, underOdds: +115, emr: 62, projWins: 10.8 },
  { team: 'BUF', name: 'Buffalo Bills', line: 10.5, overOdds: -120, underOdds: +100, emr: 66, projWins: 10.6 },
  { team: 'CIN', name: 'Cincinnati Bengals', line: 10.5, overOdds: -115, underOdds: -105, emr: 57, projWins: 10.2 },
  { team: 'GB',  name: 'Green Bay Packers', line: 9.5, overOdds: -130, underOdds: +110, emr: 62, projWins: 10.0 },
  { team: 'NE',  name: 'New England Patriots', line: 9.5, overOdds: -125, underOdds: +105, emr: 52, projWins: 10.0 },
  { team: 'PHI', name: 'Philadelphia Eagles', line: 9.5, overOdds: -120, underOdds: +100, emr: 63, projWins: 9.9 },
  { team: 'HOU', name: 'Houston Texans', line: 9.5, overOdds: -130, underOdds: +110, emr: 60, projWins: 9.7 },
  { team: 'DEN', name: 'Denver Broncos', line: 9.5, overOdds: +100, underOdds: -120, emr: 57, projWins: 9.6 },
  { team: 'LAC', name: 'Los Angeles Chargers', line: 9.5, overOdds: -135, underOdds: +115, emr: 62, projWins: 9.5 },
  { team: 'DAL', name: 'Dallas Cowboys', line: 9.5, overOdds: +105, underOdds: -125, emr: 58, projWins: 9.4 },
  { team: 'SEA', name: 'Seattle Seahawks', line: 8.5, overOdds: -130, underOdds: +110, emr: 67, projWins: 9.1 },
  { team: 'JAX', name: 'Jacksonville Jaguars', line: 8.5, overOdds: -125, underOdds: +105, emr: 50, projWins: 8.7 },
  { team: 'IND', name: 'Indianapolis Colts', line: 8.5, overOdds: -110, underOdds: -110, emr: 46, projWins: 8.0 },
  { team: 'MIN', name: 'Minnesota Vikings', line: 8.5, overOdds: +100, underOdds: -120, emr: 51, projWins: 8.0 },
  { team: 'ATL', name: 'Atlanta Falcons', line: 7.5, overOdds: +120, underOdds: -140, emr: 48, projWins: 7.1 },
  { team: 'CAR', name: 'Carolina Panthers', line: 7.5, overOdds: +115, underOdds: -135, emr: 45, projWins: 7.1 },
  { team: 'TB',  name: 'Tampa Bay Buccaneers', line: 7.5, overOdds: -110, underOdds: -110, emr: 51, projWins: 7.3 },
  { team: 'CHI', name: 'Chicago Bears', line: 7.5, overOdds: -130, underOdds: +110, emr: 60, projWins: 7.8 },
  { team: 'NYG', name: 'New York Giants', line: 6.5, overOdds: -125, underOdds: +105, emr: 44, projWins: 6.8 },
  { team: 'TEN', name: 'Tennessee Titans', line: 6.5, overOdds: -115, underOdds: -105, emr: 38, projWins: 6.4 },
  { team: 'WAS', name: 'Washington Commanders', line: 6.5, overOdds: +100, underOdds: -120, emr: 48, projWins: 6.3 },
  { team: 'NO',  name: 'New Orleans Saints', line: 6.5, overOdds: -105, underOdds: -115, emr: 42, projWins: 6.2 },
  { team: 'PIT', name: 'Pittsburgh Steelers', line: 6.5, overOdds: -110, underOdds: -110, emr: 46, projWins: 6.5 },
  { team: 'NYJ', name: 'New York Jets', line: 6.5, overOdds: +110, underOdds: -130, emr: 35, projWins: 6.1 },
  { team: 'CLE', name: 'Cleveland Browns', line: 5.5, overOdds: +115, underOdds: -135, emr: 31, projWins: 5.8 },
  { team: 'ARI', name: 'Arizona Cardinals', line: 5.5, overOdds: -110, underOdds: -110, emr: 25, projWins: 5.4 },
  { team: 'LV',  name: 'Las Vegas Raiders', line: 5.5, overOdds: -120, underOdds: +100, emr: 32, projWins: 5.3 },
  { team: 'MIA', name: 'Miami Dolphins', line: 5.5, overOdds: +125, underOdds: -145, emr: 28, projWins: 5.1 },
];

function americanToProb(odds) {
  if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
  return 100 / (odds + 100);
}

function nCr(n, r) {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = res * (n - i + 1) / i;
  }
  return res;
}

// Binomial probability of winning >= k games out of 17
function probOverK(k, pWin) {
  let prob = 0;
  for (let i = k; i <= 17; i++) {
    prob += nCr(17, i) * Math.pow(pWin, i) * Math.pow(1 - pWin, 17 - i);
  }
  return prob;
}

console.log("=== 32-TEAM NFL WIN TOTAL PROBABILITIES (2026 SEASON) ===");
console.log("Team | Line | Over Odds | Implied Over Prob | Proj Wins | Prob Over Line");
console.log("-------------------------------------------------------------------------");

const results = TEAMS.map(t => {
  const rawOverProb = americanToProb(t.overOdds);
  const rawUnderProb = americanToProb(t.underOdds);
  const fairOverProb = rawOverProb / (rawOverProb + rawUnderProb);
  const pWinPerGame = t.projWins / 17;
  const modelOverProb = probOverK(Math.floor(t.line) + 1, pWinPerGame);

  return {
    ...t,
    fairOverProb: (fairOverProb * 100).toFixed(1) + '%',
    modelOverProb: (modelOverProb * 100).toFixed(1) + '%'
  };
}).sort((a, b) => b.projWins - a.projWins);

results.forEach(r => {
  console.log(`${r.team.padEnd(4)} | ${r.line.toFixed(1).padEnd(4)} | ${(r.overOdds > 0 ? '+' + r.overOdds : r.overOdds).toString().padEnd(9)} | ${r.fairOverProb.padEnd(17)} | ${r.projWins.toFixed(1).padEnd(9)} | ${r.modelOverProb}`);
});
