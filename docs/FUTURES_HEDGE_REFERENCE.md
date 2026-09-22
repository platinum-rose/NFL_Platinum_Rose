# Futures Hedge Reference (2026)

Small standalone reference for futures add/hedge decisions. Used by
`agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` §8. Moved out of
`agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md` (now reference-only) on 2026-09-22.

## Hedge ratio

Full lock-in stake on the opposing side, so the result is the same either way:

    H = S × D_fut / D_live

- `S` = original stake ($)
- `D_fut` = decimal odds taken on the future (+800 → 9.0)
- `D_live` = current decimal odds on the opponent / "No" side

Partial hedge: `H_partial = H × pct`.
- **50%** halves the downside and keeps the upside.
- **75%** when win probability is fading but not dead.

Always compute the full P&L matrix across outcomes in code; don't estimate it.

## Pivot windows

| Window | Timing | Action |
|---|---|---|
| Weeks 3–5 | Late Sep – early Oct | **Buy window.** Early overreaction creates value. Reassess; don't hedge |
| Bye weeks (5–14) | Oct – Dec | Check injury impact on held teams |
| Weeks 12–14 | Late Nov – Dec | Playoff picture forms. Double down or start hedge planning |
| Weeks 17–18 | Late Dec – Jan | Rest/seeding risk. Starters sitting = futures uncertainty |
| Wild Card | Jan | Mostly chalk. Reassess only if the held team is a heavy favorite |
| Divisional | Jan | Most upset-prone round. Consider partial hedges |
| Conference Championship | Jan | **Primary hedge window.** A full lock-in is usually right for large positions |
| Super Bowl | Feb | Last hedge. High handle means tight lines and good hedge pricing |

## When not to hedge

- Win probability is within ~10% of the implied probability at entry. Hold for full upside.
- The position is small (< 0.5u). Juice eats the saved EV.
- A favorable bracket break (key rival out, home field locked). Let it ride.

## Futures types — when to place / hedge

| Type | Place | Hedge trigger |
|---|---|---|
| Super Bowl | Preseason / early season | Team reaches the final 4, or implied prob down >50% from entry |
| Conference | Preseason / early | Team is in the championship game |
| Division | Preseason / by Week 4 | Clinch number ≤ 2, or elimination risk |
| Season win total | Preseason | Line moves 1.5+ wins from entry. Look for a middle |

## Portfolio-specific rules (Andy, 2026)

- Caps: $200 per Super Bowl anchor (BUF, GB); $500 primary planned total. Source:
  `data/futures-imports/andy-portfolio-ledger-2026.json` → `limits`.
- `open_parlays` in the ledger are unverified contingent assets. Never count them as hedge capacity.
- Super Bowl exactas are monitor-only unless a second market exists to price-shop
  (`data/futures-imports/futures-watchlist-2026.json` rules).
- Promo funding: `data/sportsbooks/promotions-2026.json` (Bills-win credits, BEO reloads, BKR BetPoints).
