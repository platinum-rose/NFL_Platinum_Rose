# Codex handoff — ESPN lookup alignment

**Prepared:** 2026-10-26 PT
**Repo/branch:** `E:\dev\projects\NFL_Dashboard`, `claude/w5-prop-cards-2026-10-11`

## Changed

- Added `scripts/lib/espn-http.mjs` as the shared JSON request helper for ESPN, using the same `User-Agent` and response checks used by the Monday settlement lookup.
- Updated `scripts/generate-live-tracker-mobile.mjs` and `scripts/reconcile-settlement.mjs` to use that helper and shared ESPN API base.
- No tracker outputs or wager ledgers were changed. No publish, sportsbook, or Supabase actions were performed.

## Verification

- `node --check` passed for the shared helper, mobile generator, and settlement script.
- A mocked request confirmed the shared helper sends the settlement `User-Agent` and returns parsed JSON.
- A live request using the shared helper still failed in this shell with `getaddrinfo ENOTFOUND site.api.espn.com`. This is a name-resolution failure before an HTTP response; matching the request profile does not by itself repair local DNS.
- The user's Monday cadence output confirms that its settlement preview reached ESPN, but it contains ticket outcomes rather than mobile per-leg grades. Parity remains unverified.

## Open items

1. Retry the mobile generator when this environment can resolve `site.api.espn.com`; confirm output hashes remain unchanged on a failed fetch and confirm the successful Week 7 output markers.
2. Complete the Week 5–7 grader parity comparison without editing ledgers. See `reports/verification/2026-10-26-mobile-grader-parity-weeks-5-7.md`.
3. Preserve the prior Hedge Watch open items and Andy decisions in `handoffs/2026-10-26-codex-hedge-watch-engineering.md`; no decision was made here.

## Resume prompt

```text
Resume Platinum Rose NFL on claude/w5-prop-cards-2026-10-11. Read this handoff, then reconcile live Git. Mobile tracker ESPN requests now share the Monday settlement request helper, but live DNS still fails in this shell with ENOTFOUND site.api.espn.com. Retry the generator when lookup works; then complete Week 5–7 parity report-only. Keep the H2C2 guardrails: no bets, sportsbook accounts, TheOddsAPI, Supabase writes, ledger edits, or tracker publication without the specified authorization. Preserve dirty shared-checkout files and stage named paths only. Retain the Andy questions from the prior Hedge Watch handoff; do not decide them.
```
