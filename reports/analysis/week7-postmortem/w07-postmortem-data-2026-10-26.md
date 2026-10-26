# Week 7 post-mortem data pack — provisional, 2026-10-26

**Status:** Sunday games compiled; DAL @ PHI remains pending for the scheduled Monday check-in. This is a data pack, not the final post-mortem.

## Scope and sources

- Official real-wager tickets only. Paper tickets and proposed picks are excluded from the financial totals below.
- Ticket results, stakes, payouts, and recorded leg states come from `data/official-picks/user-placed-wagers-2026.json`. The Monday cadence settlement preview supplied by Andy reports 31 Week 7 tickets settled, with one win and DAL @ PHI pending. No ledger changes were made for this report.
- Game results were cross-checked against the local ESPN boxscore snapshots for event IDs `401873010`–`401873022`. They cover the 13 completed games; the missing Monday result remains pending.
- A row-level ticket export is [official-ticket-summary-2026-10-26.csv](official-ticket-summary-2026-10-26.csv). It includes each ticket's result, money fields, and recorded leg-status counts.
- The working ledger has a pre-existing uncommitted diff that changes numeric formatting only (for example, `-15.0` to `-15`). The calculations use the current file's numeric values; no ledger write or staging occurred.

## Official game results

| Game | Final | Total |
|---|---:|---:|
| NE @ CHI | 24–30 | 54 |
| PIT @ NO | 16–10 | 26 |
| SF @ ATL | 20–29 | 49 |
| CLE @ TEN | 27–24 | 51 |
| IND @ MIN | 10–16 | 26 |
| MIA @ NYJ | 28–25 | 53 |
| TB @ CAR | 43–13 | 56 |
| CIN @ BAL | 35–13 | 48 |
| NYG @ HOU | 27–21 | 48 |
| DEN @ ARI | 30–16 | 46 |
| GB @ DET | 17–20 | 37 |
| LAR @ LV | 35–21 | 56 |
| KC @ SEA | 3–20 | 23 |
| **DAL @ PHI** | **Pending** | — |

## Official ticket accounting through Sunday

| Measure | Value |
|---|---:|
| Tickets | 31 |
| Ticket results | 1 win, 30 losses |
| Cash risk / stake | $324.12 |
| Settled payout (gross) | $90.52 |
| Net profit | **−$233.60** |
| Return on risk | **−72.1%** |

| Book | Tickets | Risk | Net | Record |
|---|---:|---:|---:|---:|
| Bookmaker | 11 | $190.74 | −$177.22 | 0–11 |
| BetOnline | 10 | $73.31 | −$73.31 | 0–10 |
| DraftKings Predictions | 10 | $60.07 | +$16.93 | 1–9 |
| **Total** | **31** | **$324.12** | **−$233.60** | **1–30** |

| Ticket category | Tickets | Risk | Net | Record |
|---|---:|---:|---:|---:|
| Parlay | 12 | $165.74 | −$165.74 | 0–12 |
| Prop parlay | 6 | $33.31 | −$33.31 | 0–6 |
| Prop / prediction market | 10 | $60.07 | +$16.93 | 1–9 |
| Round robin | 2 | $35.00 | −$21.48 | 0–2 |
| Teaser | 1 | $30.00 | −$30.00 | 0–1 |

The sole winning ticket was DraftKings ticket `45488862`: $4.94 risk, $77.00 gross payout, and $72.06 net. Bookmaker's compact 2-team round robin returned $13.52 but remained a ticket loss, for a net loss of $1.48.

One $15 Bookmaker flex SGP is recorded under Week 7 but mixes W6 (WSH @ SF) and W7 legs. The ledger-week total above includes it. Excluding that cross-week ticket as a sensitivity view leaves 30 tickets, $309.12 risk, and −$218.60 net; this is not a replacement ledger total.

## Leg-data completeness and limits

The ledger contains 189 leg rows: 61 `WON`, 77 `LOST`, 2 `PUSH`, 47 `PENDING`, and 2 `OPEN`. Therefore, the ticket-level settlement preview is more complete than the recorded per-leg detail. Do not treat market hit rates or a new independent re-grade as verified from these statuses. The mobile-versus-ledger grader parity work remains open; see [the Week 5–7 parity report](../../verification/2026-10-26-mobile-grader-parity-weeks-5-7.md).

This first pass does not yet compare the Week 7 proposal card, pool/contest selections, or projected prices against actual outcomes. Keep the final post-mortem open until DAL @ PHI is graded through the scheduled Claude check-in and those analysis inputs are reconciled.
