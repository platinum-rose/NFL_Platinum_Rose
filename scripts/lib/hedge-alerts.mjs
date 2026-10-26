/**
 * hedge-alerts.mjs — find hedge spots in open tickets.
 *
 * Pure functions (no I/O). The mobile tracker generator feeds it graded open
 * tickets, ESPN events and pregame lines; it returns alerts for the page,
 * the alerts JSON and phone notifications.
 *
 * Two alert types:
 *   last_game  One ticket whose remaining legs are all in a single game, with a
 *              big payout relative to the stake (e.g. the 6-team flex down to
 *              KC +3.5 for $353). Prices the opposite side and sizes an
 *              equalizing hedge and a half hedge.
 *   game_gap   All side/total exposure riding on one game, scored over a grid of
 *              final margins and totals. Flags a likely outcome where almost
 *              nothing pays (SNF W7: SEA by 4+ with a low total) and names the
 *              single market that covers most of it.
 *
 * Model: final margin ~ Normal(-spread, 13.5) and total ~ Normal(O/U, 10),
 * independent, discretized to whole points (no ties in margin). It is a sizing
 * aid, not a projection: it uses the book's own line as the mean.
 */

export const HEDGE_DEFAULTS = {
  minMultiple: 10,      // last_game: payout must be >= 10x stake ...
  minPayout: 100,       // ... and >= $100 back
  gapMinPayout: 150,    // game_gap: at least $150 riding on the game ...
  gapMinProb: 0.15,     // ... and >= 15% chance of a "dead" result
  deadShare: 0.15,      // a result is "dead" if it returns < 15% of the best case
  marginSd: 13.5,
  totalSd: 10,
  vig: 0.045,           // used to estimate prices for alt lines the feed doesn't quote
};

// ---------- odds helpers ----------
export const amToDec = (a) => {
  const n = Number(a);
  if (!Number.isFinite(n) || n === 0) return null;
  return n > 0 ? 1 + n / 100 : 1 + 100 / -n;
};
export const decToAm = (d) => {
  if (!d || d <= 1) return null;
  return d >= 2 ? `+${Math.round((d - 1) * 100)}` : `${Math.round(-100 / (d - 1))}`;
};
const round2 = (n) => Math.round(n * 100) / 100;

function pmf(mu, sd, lo, hi, dropZero) {
  const cdf = (x) => 0.5 * (1 + erf((x - mu) / (sd * Math.SQRT2)));
  const out = [];
  let tot = 0;
  for (let x = lo; x <= hi; x++) {
    if (dropZero && x === 0) continue;
    const p = cdf(x + 0.5) - cdf(x - 0.5);
    out.push([x, p]);
    tot += p;
  }
  return out.map(([x, p]) => [x, p / tot]);
}
function erf(x) {
  // Abramowitz-Stegun 7.1.26
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

/** Grid of [margin(home-away), total, prob] for one game. */
export function scenarioGrid(odds, cfg = HEDGE_DEFAULTS) {
  const muM = -Number(odds.spreadHome || 0);
  const muT = Number(odds.ou || 44);
  // NFL key numbers: games land on 3 and 7 far more than a smooth curve says.
  const KEY = { 3: 2.2, 7: 1.6, 10: 1.3, 6: 1.2, 4: 1.15, 14: 1.2, 1: 1.1 };
  let M = pmf(muM, cfg.marginSd, -45, 45, true).map(([x, p]) => [x, p * (KEY[Math.abs(x)] || 1)]);
  const mz = M.reduce((a, [, p]) => a + p, 0);
  M = M.map(([x, p]) => [x, p / mz]);
  const T = pmf(muT, cfg.totalSd, Math.max(0, Math.round(muT - 40)), Math.round(muT + 40), false);
  const grid = [];
  for (const [m, pm] of M) for (const [t, pt] of T) {
    // Margin and total must be compatible: |m| <= t and same parity.
    if (Math.abs(m) > t || (t - Math.abs(m)) % 2 !== 0) continue;
    grid.push([m, t, pm * pt]);
  }
  const s = grid.reduce((a, g) => a + g[2], 0);
  return grid.map((g) => [g[0], g[1], g[2] / s]);
}

/**
 * Leg outcome in a scenario: true = wins (or pushes, which keeps a parlay alive),
 * false = loses, null = not modelled (props).
 */
export function legOutcome(leg, odds, m, t) {
  if (leg.kind === 'side') {
    const tm = leg.team === odds.home ? m : -m;
    return tm + Number(leg.line || 0) >= 0;
  }
  if (leg.kind === 'total') return leg.dir === 'under' ? t <= leg.line : t >= leg.line;
  return null;
}

/** A hedge is a straight bet: strictly win (true), push = refund (null), or lose (false). */
export function hedgeOutcome(mk, odds, m, t) {
  if (mk.kind === 'side') {
    const tm = mk.team === odds.home ? m : -m;
    const x = tm + Number(mk.line || 0);
    return x > 0 ? true : x === 0 ? null : false;
  }
  const x = mk.dir === 'under' ? mk.line - t : t - mk.line;
  return x > 0 ? true : x === 0 ? null : false;
}

// ---------- pricing ----------
/** Price a hedge market: book price when the line matches the feed, else a model estimate with vig. */
function priceMarket(mk, odds, grid, cfg) {
  let quoted = null;
  if (mk.kind === 'side' && mk.line === 0) quoted = mk.team === odds.home ? odds.homeML : odds.awayML;
  if (mk.kind === 'side' && mk.line !== 0) {
    const bookLine = mk.team === odds.home ? Number(odds.spreadHome) : -Number(odds.spreadHome);
    if (Math.abs(bookLine - mk.line) < 0.01) quoted = mk.team === odds.home ? odds.spreadOddsHome : odds.spreadOddsAway;
  }
  if (mk.kind === 'total' && Math.abs(Number(odds.ou) - mk.line) < 0.01) quoted = mk.dir === 'over' ? odds.overOdds : odds.underOdds;
  if (quoted != null && amToDec(quoted)) return { dec: amToDec(quoted), am: String(quoted).startsWith('-') || String(quoted).startsWith('+') ? String(quoted) : (Number(quoted) > 0 ? `+${quoted}` : String(quoted)), source: 'book' };
  // estimate: fair probability from the grid, plus vig
  let p = 0; let push = 0;
  for (const [m, t, pr] of grid) { const o = hedgeOutcome(mk, odds, m, t); if (o) p += pr; else if (o === null) push += pr; }
  p = p / Math.max(1e-9, 1 - push);
  const dec = 1 / Math.min(0.97, p * (1 + cfg.vig));
  return { dec, am: decToAm(dec), source: 'est' };
}

// Tie-break between near-equal hedges: a quoted book line beats a model estimate, then the better price.
const better = (a, b) => (a.price.source === 'book') !== (b.price.source === 'book') ? a.price.source === 'book' : a.price.dec > b.price.dec;

const sideLabel = (team, line) => `${team} ${line === 0 ? 'ML' : (line > 0 ? '+' : '') + line}`;
const mkLabel = (mk) => (mk.kind === 'side' ? sideLabel(mk.team, mk.line) : `${mk.dir === 'over' ? 'Over' : 'Under'} ${mk.line}`);

/** Standard hedge candidates for a game, plus the exact opposite of each given leg. */
function candidateMarkets(odds, legs) {
  const out = [];
  const add = (mk) => { if (!out.some((x) => mkLabel(x) === mkLabel(mk))) out.push(mk); };
  const sh = Number(odds.spreadHome || 0);
  for (const team of [odds.home, odds.away]) {
    const base = team === odds.home ? sh : -sh;
    add({ kind: 'side', team, line: 0 });
    for (const d of [-3.5, -0.5, 0, 0.5, 3.5]) { const l = base + d; if (l !== 0) add({ kind: 'side', team, line: l }); }
  }
  for (const d of ['over', 'under']) add({ kind: 'total', dir: d, line: Number(odds.ou) });
  for (const l of legs) {
    if (l.kind === 'side') add({ kind: 'side', team: l.team === odds.home ? odds.away : odds.home, line: -Number(l.line || 0) });
    if (l.kind === 'total') add({ kind: 'total', dir: l.dir === 'over' ? 'under' : 'over', line: l.line });
  }
  return out;
}

// ---------- ticket payout in a scenario ----------
/**
 * ticket = { id, title, stake, pay (full return if it cashes), rr?: { combos:[{legIdx:[..], ret}], banked } ,
 *            open: [unresolved legs, each {kind, team, line, dir, eventId, selection}] , openIdx:[leg indexes] }
 */
function ticketReturn(tk, odds, m, t) {
  if (tk.rr) {
    let r = tk.rr.banked || 0;
    for (const c of tk.rr.combos) {
      if (c.dead) continue;
      const ok = c.openLegs.every((l) => legOutcome(l, odds, m, t) !== false);
      if (ok) r += c.ret;
    }
    return r;
  }
  return tk.open.every((l) => legOutcome(l, odds, m, t) !== false) ? tk.pay : 0;
}

// ---------- alert builders ----------
function hedgePlan(pay, price, pHedge) {
  const H = pay / price.dec;
  const half = H / 2;
  return {
    price: price.am, priceSource: price.source,
    full: { stake: round2(H), ifTicket: round2(pay - H), ifHedge: round2(H * (price.dec - 1)) },
    half: { stake: round2(half), ifTicket: round2(pay - half), ifHedge: round2(half * (price.dec - 1)) },
    evCost: pHedge == null ? null : round2(H - H * price.dec * pHedge),   // expected cost of the full hedge vs. not hedging
  };
}

/**
 * @param {Array} tickets   normalized open tickets (see ticketReturn)
 * @param {Map} eventsById  id -> { id, home, away, state, date, label }
 * @param {Map} oddsById    id -> { home, away, spreadHome, spreadOddsHome, spreadOddsAway, homeML, awayML, ou, overOdds, underOdds, provider }
 */
export function buildHedgeAlerts(tickets, eventsById, oddsById, cfg = HEDGE_DEFAULTS) {
  const alerts = [];
  const grids = new Map();
  const gridFor = (id) => { if (!grids.has(id)) grids.set(id, scenarioGrid(oddsById.get(id), cfg)); return grids.get(id); };

  // ---- last_game ----
  for (const tk of tickets) {
    const evIds = [...new Set(tk.open.map((l) => l.eventId))];
    if (evIds.length !== 1 || !evIds[0]) continue;
    const ev = eventsById.get(evIds[0]);
    if (!ev || ev.state === 'post') continue;
    const pay = tk.rr ? tk.rr.combos.filter((c) => !c.dead).reduce((a, c) => a + c.ret, 0) + (tk.rr.banked || 0) : tk.pay;
    if (pay < cfg.minPayout || pay / Math.max(tk.stake, 0.01) < cfg.minMultiple) continue;
    const odds = oddsById.get(ev.id);
    const modelled = tk.open.every((l) => l.kind !== 'prop');
    const a = {
      id: `last_game:${tk.id}:${tk.open.map((l) => l.selection).join('|')}`,
      type: 'last_game', ticketId: tk.id, ticket: tk.title, book: tk.book, stake: tk.stake, pay: round2(pay),
      eventId: ev.id, game: ev.label, gameState: ev.state, needs: tk.open.map((l) => l.selection), live: ev.state === 'in',
    };
    if (odds && modelled) {
      const grid = gridFor(ev.id);
      let pHit = 0;
      for (const [m, t, p] of grid) if (ticketReturn(tk, odds, m, t) > 0) pHit += p;
      // best single hedge: highest P(hedge wins | ticket misses), then best price
      let best = null;
      for (const mk of candidateMarkets(odds, tk.open)) {
        let miss = 0; let cover = 0; let pH = 0;
        for (const [m, t, p] of grid) {
          const o = hedgeOutcome(mk, odds, m, t);
          if (o) pH += p;
          if (ticketReturn(tk, odds, m, t) === 0) { miss += p; if (o) cover += p; }
        }
        const score = miss ? cover / miss : 0;
        const price = priceMarket(mk, odds, grid, cfg);
        const cand = { mk, score, price, pH };
        if (!best || score > best.score + 0.02 || (Math.abs(score - best.score) <= 0.02 && better(cand, best))) best = cand;
      }
      a.pHit = round2(pHit);
      a.evNow = round2(pHit * pay);
      a.hedge = { market: mkLabel(best.mk), covers: round2(best.score), ...hedgePlan(pay, best.price, best.pH) };
      a.line = `${odds.provider || 'Book'}: ${sideLabel(odds.home, Number(odds.spreadHome))} · O/U ${odds.ou}`;
    } else {
      const prop = tk.open.find((l) => l.kind === 'prop');
      a.pHit = null;
      a.hedge = prop && tk.open.length === 1
        ? { market: `${prop.dir === 'under' ? 'Over' : 'Under'} on ${prop.selection}`, note: 'Prop hedge: price it at the book. Sizing below assumes -110.', ...hedgePlan(pay, { dec: amToDec(-110), am: '-110', source: 'assumed' }, null) }
        : { market: null, note: 'Several legs left, including props. No single clean hedge; check for a cash-out offer or hedge the side/total leg.' };
    }
    alerts.push(a);
  }

  // ---- game_gap ----
  const byEvent = new Map();
  for (const tk of tickets) {
    const evIds = [...new Set(tk.open.map((l) => l.eventId))];
    if (evIds.length !== 1 || !evIds[0]) continue;
    if (!byEvent.has(evIds[0])) byEvent.set(evIds[0], []);
    byEvent.get(evIds[0]).push(tk);
  }
  for (const [evId, tks] of byEvent) {
    const ev = eventsById.get(evId); const odds = oddsById.get(evId);
    if (!ev || !odds || ev.state === 'post') continue;
    const modelled = tks.filter((tk) => tk.open.every((l) => l.kind !== 'prop'));
    const propsRiding = tks.filter((tk) => !modelled.includes(tk));
    if (!modelled.length) continue;
    const grid = gridFor(evId);
    const ret = (m, t) => modelled.reduce((a, tk) => a + ticketReturn(tk, odds, m, t), 0);
    let max = 0; let ev0 = 0; let pDead = 0;
    const rows = grid.map(([m, t, p]) => { const r = ret(m, t); max = Math.max(max, r); ev0 += r * p; return [m, t, p, r]; });
    if (max < cfg.gapMinPayout) continue;
    for (const [, , p, r] of rows) if (r < cfg.deadShare * max) pDead += p;
    if (pDead < cfg.gapMinProb) continue;

    // Scenario table: favorite margin buckets x over/under the O/U.
    const fav = Number(odds.spreadHome) <= 0 ? odds.home : odds.away;
    const dog = fav === odds.home ? odds.away : odds.home;
    const favM = (m) => (fav === odds.home ? m : -m);
    const buckets = [
      { label: `${dog} wins`, test: (m) => favM(m) < 0 },
      { label: `${fav} by 1–3`, test: (m) => favM(m) >= 1 && favM(m) <= 3 },
      { label: `${fav} by 4–7`, test: (m) => favM(m) >= 4 && favM(m) <= 7 },
      { label: `${fav} by 8+`, test: (m) => favM(m) >= 8 },
    ];
    const ou = Number(odds.ou);
    const table = [];
    for (const b of buckets) for (const side of ['over', 'under']) {
      let p = 0; let r = 0;
      for (const [m, t, pr, rr] of rows) if (b.test(m) && (side === 'over' ? t > ou : t < ou)) { p += pr; r += pr * rr; }
      table.push({ margin: b.label, total: side === 'over' ? `Over ${ou}` : `Under ${ou}`, prob: round2(p), avgReturn: p ? round2(r / p) : 0, dead: p > 0 && r / p < cfg.deadShare * max });
    }
    // Best single market against the dead zone.
    // Pick the market that covers the most shortfall (how far each result falls
    // below the game's expected return), weighted by probability.
    let shortTot = 0;
    for (const [, , p, r] of rows) shortTot += p * Math.max(0, ev0 - r);
    let best = null;
    for (const mk of candidateMarkets(odds, modelled.flatMap((tk) => tk.open))) {
      let cover = 0; let pH = 0; let short = 0;
      for (const [m, t, p, r] of rows) {
        const o = hedgeOutcome(mk, odds, m, t);
        if (o) { pH += p; short += p * Math.max(0, ev0 - r); }
        if (r < cfg.deadShare * max && o) cover += p;
      }
      const score = shortTot ? short / shortTot : 0;
      mk._deadCover = pDead ? cover / pDead : 0;
      const price = priceMarket(mk, odds, grid, cfg);
      const cand = { mk, score, price, pH };
      if (!best || score > best.score + 0.05 || (Math.abs(score - best.score) <= 0.05 && better(cand, best))) best = cand;
    }
    // Size so the dead outcome is lifted to the game's expected return (full), or halfway.
    let deadP = 0; let deadR = 0;
    for (const [, , p, r] of rows) if (r < cfg.deadShare * max) { deadP += p; deadR += p * r; }
    const deadAvg = deadP ? deadR / deadP : 0;
    const target = Math.max(0, ev0 - deadAvg);
    const H = target / Math.max(0.01, best.price.dec - 1);
    const plan = {
      price: best.price.am, priceSource: best.price.source,
      full: { stake: round2(H), ifHedge: round2(H * (best.price.dec - 1)) },
      half: { stake: round2(H / 2), ifHedge: round2((H / 2) * (best.price.dec - 1)) },
      evCost: round2(H - H * best.price.dec * best.pH),
    };
    // Outcome with each hedge size in the dead zone vs. the best live scenario.
    alerts.push({
      id: `game_gap:${evId}:${modelled.map((tk) => tk.id).sort().join(',')}`,
      type: 'game_gap', eventId: evId, game: ev.label, gameState: ev.state, live: ev.state === 'in',
      line: `${odds.provider || 'Book'}: ${sideLabel(odds.home, Number(odds.spreadHome))} · O/U ${odds.ou}`,
      maxReturn: round2(max), expectedReturn: round2(ev0), pDead: round2(pDead),
      tickets: modelled.map((tk) => ({ id: tk.id, title: tk.title, needs: tk.open.map((l) => l.selection), pay: round2(tk.pay) })),
      propsRiding: propsRiding.map((tk) => ({ id: tk.id, title: tk.title })),
      table,
      deadAvgReturn: round2(deadAvg), deadLine: round2(cfg.deadShare * max),
      hedge: { market: mkLabel(best.mk), covers: round2(best.mk._deadCover), shortfallCovered: round2(best.score), ...plan },
    });
  }
  // Most valuable first.
  return alerts.sort((a, b) => (b.pay || b.maxReturn) - (a.pay || a.maxReturn));
}

/** One-line message for a phone notification (<200 chars). */
export function alertMessage(a) {
  if (a.type === 'last_game') {
    const h = a.hedge?.market ? ` Hedge ${a.hedge.market} ${a.hedge.price}: $${Math.round(a.hedge.full.stake)} locks ~$${Math.round(a.hedge.full.ifHedge)}.` : '';
    return `Hedge spot: ${a.book} $${a.pay} needs ${a.needs.join(' + ')} (${a.game}${a.live ? ', live' : ''}).${h}`.slice(0, 199);
  }
  return `Exposure gap ${a.game}: ${Math.round(a.pDead * 100)}% chance you get back under $${Math.round(a.deadLine)} of a possible $${Math.round(a.maxReturn)}. Best cover ${a.hedge.market} ${a.hedge.price} ($${Math.round(a.hedge.half.stake)}-${Math.round(a.hedge.full.stake)}).`.slice(0, 199);
}
