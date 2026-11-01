// Ownership metadata shared by both tracker generators. Ticket-level money stays
// unchanged; contributions can exceed the ticket cost (the A-A-A pool has $0.02 left).
export function wagerSplit(wager) {
  const count = Number(wager.split_count || 2);
  const participants = wager.split_participants || [];
  const partner = participants.find((p) => p.name === 'Alejandro');
  const fraction = partner
    ? Number(partner.share_numerator) / Number(partner.share_denominator)
    : 1 / count;
  if (!Number.isInteger(count) || count < 2 || !(fraction > 0 && fraction <= 1)) {
    throw new Error(`Invalid split metadata: ${wager.id}`);
  }
  const stake = Number(wager.cash_risk_usd ?? wager.stake_usd ?? 0);
  const payout = Number(wager.potential_payout_usd ?? (stake + Number(wager.potential_profit_usd || 0)));
  const contribution = Number(partner?.contribution_usd ?? (stake * fraction));
  const payoutCents = Math.round(payout * 100);
  const payoutShareCents = Math.floor(payoutCents / count);
  const payoutRemainderUsd = (payoutCents - payoutShareCents * count) / 100;
  const label = count === 2 ? '50/50 SPLIT' : `${count}-WAY ${wager.split_designation || 'SPLIT'}`;
  const note = count === 3
    ? `Andy, Amanda, Alejandro: $${contribution.toFixed(2)} each; potential return $${(payout * fraction).toFixed(2)} each. $${Number(wager.split_details?.unspent_contributions_usd || 0).toFixed(2)} unspent shared pool.`
    : `Andy / ${wager.split_partner || 'Alejandro'}: equal shares; potential return $${(payoutShareCents / 100).toFixed(2)} each.${payoutRemainderUsd ? ` $${payoutRemainderUsd.toFixed(2)} payout remainder to allocate.` : ''}`;
  return { enabled: !!wager.is_split, count, fraction, contribution, label, note, payoutRemainderUsd };
}
