// Official bankroll: the one rule (Andy, 2026-11-17, midseason audit decisions 1, 2 and 4).
//
// A settled ticket counts toward Andy's official bankroll unless it is exempt. Exempt means:
//   - the book is DraftKings Predictions, DraftKings Pick6 or FanDuel Predicts (solo or split,
//     cash- or promo-funded). DK is reported separately at account balance minus deposits.
//     EXCEPTION (Andy, 2026-11-27 3:57 PM PT): the DKP winnings balance is used up, so DraftKings
//     Predictions tickets placed after that moment count as cash against the bankroll until further
//     notice. DKP_CASH_FROM is the cutoff: placed_at at/after it, or a date after 2026-11-27, counts;
//     counts_against_bankroll: true forces a ticket to count (e.g. a date-only 11/27 ticket placed later).
//   - or the ticket carries bankroll_exempt / exclude_from_bankroll / exclude_from_andy_bankroll
//     (legacy NCAA open-spot fills, BetOnline Bills bonus bets, and similar hand-flagged tickets).
// A counted ticket contributes profit_usd x Andy's share. Andy's share comes from
// ownership_shares.Andy, else split_participants, else 1 / split_count on a split ticket, else 1.
//
// Usage: node scripts/lib/bankroll.mjs [--week N] [--json] [--ledger path]
// Python callers (post-mortem, scorecard) shell out with --json so there is one implementation.

export const EXEMPT_BOOKS = new Set(['DraftKings Predictions', 'DraftKings Pick6', 'FanDuel Predicts']);
export const DKP_BOOK = 'DraftKings Predictions';
export const DKP_CASH_FROM = '2026-11-27T15:57:00-08:00';

// True when a DKP ticket falls after the winnings balance ran out (counts as cash on the bankroll).
export function isDkpCashEra(w) {
  if (w.book !== DKP_BOOK) return false;
  if (w.counts_against_bankroll === true) return true;
  if (w.placed_at) { const t = Date.parse(w.placed_at); if (!Number.isNaN(t)) return t >= Date.parse(DKP_CASH_FROM); }
  return typeof w.date === 'string' && w.date.slice(0, 10) > DKP_CASH_FROM.slice(0, 10);
}

const num = (x) => (x === null || x === undefined || x === '' || Number.isNaN(Number(x)) ? null : Number(x));
const round2 = (x) => Math.round(x * 100) / 100;

export function isPromoFunded(w) {
  return ['promo_credit', 'free_bet'].includes(w.funding_type) || !!w.is_promo_credit;
}

export function exemptReason(w) {
  if (EXEMPT_BOOKS.has(w.book) && !isDkpCashEra(w)) return `book: ${w.book}`;
  if (w.bankroll_exempt === true) return w.bankroll_exempt_reason || 'bankroll_exempt flag';
  if (w.exclude_from_bankroll === true) return 'exclude_from_bankroll flag';
  if (w.exclude_from_andy_bankroll === true) return 'exclude_from_andy_bankroll flag';
  return null;
}

export const isBankrollExempt = (w) => exemptReason(w) !== null;

export function andyShare(w) {
  const s = w.ownership_shares;
  if (s && typeof s === 'object' && num(s.Andy) !== null) return num(s.Andy);
  const me = (w.split_participants || []).find((p) => p.name === 'Andy');
  if (me && num(me.share_numerator) && num(me.share_denominator)) return me.share_numerator / me.share_denominator;
  if (w.bankroll_owner && w.bankroll_owner !== 'Andy') return 0;
  if (w.is_split) return 1 / (num(w.split_count) || 2);
  return 1;
}

// Ticket profit. Falls back to payout - cash stake when profit_usd is missing (4 W1 tickets).
export function ticketProfit(w) {
  const p = num(w.profit_usd);
  if (p !== null) return { profit: p, estimated: false };
  const payout = num(w.settled_payout_usd) ?? 0;
  const stake = isPromoFunded(w) ? 0 : (num(w.cash_risk_usd) ?? num(w.stake_usd) ?? 0);
  return { profit: payout - stake, estimated: true };
}

export function bankrollEntry(w) {
  const settled = w.status === 'SETTLED';
  const reason = exemptReason(w);
  const share = andyShare(w);
  const { profit, estimated } = ticketProfit(w);
  const counted = settled && reason === null;
  return {
    id: w.id, week: num(w.week), book: w.book, settled, exempt: reason !== null, exempt_reason: reason,
    andy_share: share, ticket_profit: settled ? round2(profit) : null, profit_estimated: settled && estimated,
    bankroll_profit: counted ? round2(profit * share) : 0,
    exempt_andy_profit: settled && reason !== null ? round2(profit * share) : 0,
  };
}

export function summarizeBankroll(ledger, { throughWeek = Infinity } = {}) {
  const entries = ledger.map(bankrollEntry).filter((e) => e.week === null || e.week <= throughWeek);
  const byWeek = {};
  for (const e of entries) {
    if (!e.settled) continue;
    const k = e.week ?? 'unknown';
    const b = (byWeek[k] ||= { week: e.week, counted_tickets: 0, bankroll: 0, exempt_tickets: 0, exempt_andy: 0 });
    if (e.exempt) { b.exempt_tickets += 1; b.exempt_andy += e.exempt_andy_profit; }
    else { b.counted_tickets += 1; b.bankroll += e.bankroll_profit; }
  }
  const weeks = Object.values(byWeek).map((b) => ({ ...b, bankroll: round2(b.bankroll), exempt_andy: round2(b.exempt_andy) }))
    .sort((a, b) => (a.week ?? 99) - (b.week ?? 99));
  const sum = (f) => round2(weeks.reduce((s, b) => s + f(b), 0));
  return {
    rule: 'Andy 2026-11-17: DKP, Pick6 and FDP off the bankroll (solo and split, any funding); Andy 2026-11-27: DKP placed after 3:57 PM PT 11/27 counts as cash (winnings used up); counted tickets at profit_usd x Andy share',
    weeks,
    season: { bankroll: sum((b) => b.bankroll), counted_tickets: sum((b) => b.counted_tickets), exempt_andy: sum((b) => b.exempt_andy), exempt_tickets: sum((b) => b.exempt_tickets) },
    open_tickets: entries.filter((e) => !e.settled).map((e) => e.id),
    warnings: entries.filter((e) => e.profit_estimated).map((e) => `${e.id}: profit_usd missing, estimated from payout - stake`),
  };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/lib/bankroll.mjs')) {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const path = await import('node:path');
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const ledgerPath = opt('--ledger') || path.join(root, 'data', 'official-picks', 'user-placed-wagers-2026.json');
  const week = opt('--week') ? Number(opt('--week')) : Infinity;
  const s = summarizeBankroll(JSON.parse(readFileSync(ledgerPath, 'utf8')), { throughWeek: week });
  if (args.includes('--json')) { process.stdout.write(JSON.stringify(s, null, 2) + '\n'); }
  else {
    const m = (x) => `${x < 0 ? '-' : '+'}$${Math.abs(x).toFixed(2)}`;
    console.log(s.rule);
    console.log('Week  Counted  Bankroll   | Exempt  Andy share of exempt');
    for (const b of s.weeks) console.log(`${String(b.week).padStart(4)}  ${String(b.counted_tickets).padStart(7)}  ${m(b.bankroll).padStart(9)}  | ${String(b.exempt_tickets).padStart(6)}  ${m(b.exempt_andy)}`);
    console.log(`Season: ${m(s.season.bankroll)} on ${s.season.counted_tickets} counted tickets; exempt (DKP/Pick6/FDP and flagged) ${m(s.season.exempt_andy)} on ${s.season.exempt_tickets}.`);
    if (s.open_tickets.length) console.log(`Open: ${s.open_tickets.join(', ')}`);
    for (const w of s.warnings) console.log(`Warning: ${w}`);
  }
}
