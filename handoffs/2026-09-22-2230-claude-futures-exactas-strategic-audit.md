# Claude strategic audit — proposed 9-bet exacta expansion (Circa + Kalshi)

**Date:** 2026-09-22 ~22:30 PT · **Author:** Claude (parallel to Codex's math audit) · **Branch:** `wip/yahoo-sync` @ `4236581`
**Scope:** read-only review of `handoffs/2026-09-22-futures-portfolio-math-audit-dossier.md` (Antigravity) and its Codex companion.
**Reproduce:** `cd data && python3 ../scratch/claude-futures-audit-2026-09-22.py` (fair-price model; writes `scratch/claude-futures-fair-2026-09-22.json`).

## Bottom line
The dossier proves each price is the **best available**. It never checks whether the price is **better than fair**. Against a consensus fair price, **all 9 additions are negative expected value.** Total EV is about **−$10 on $81.36 (−13%)**, and every one of the three fair-price methods puts the total below zero. Only two Kalshi legs (BAL–SF, KC–SEA) are close to break-even. The two premises behind "rogue Circa edges" don't hold on today's captures:
1. **Circa is the highest-hold board, not the lowest.** Conference overround: Circa **17.7%** per side, BKR 15%, BEO 7.5%. A two-leg Circa parlay compounds that to about 28% hold.
2. **NE +1050 is not an outlier.** Today's files: BEO **+1000**, BKR **+850**, Polymarket 9¢ (≈+1010); consensus fair ≈ **+1083**. Circa is fair, not generous. The dossier's comparison prices (BEO +800, BKR +620, BEO BAL +450) do not match `betonline-/bookmaker-2026-09-22-live-futures-markets.json`. Their source needs identifying before anyone relies on them.

## Fair-price method
Fair conference probability = average of Circa, BKR and BEO boards (proportionally de-vigged) and Polymarket "win the 2027 AFC/NFC Championship" prices, renormalised. Fair matchup = P(AFC) × P(NFC); the two conference outcomes are close to independent. Cross-checks: power de-vig of Circa alone, and Polymarket alone.

Fair AFC: BUF 19.9% · KC 14.7% · BAL 14.2% · CIN 10.9% · NE 8.5% · PIT 2.0%
Fair NFC: LAR 18.7% · SF 15.0% · SEA 13.7% · PHI 11.0% · DET 7.5% · DAL 6.2% · GB 5.4%

## 1. Status per addition
| # | Play | Price | Stake | Fair (consensus) | EV/$ consensus · Circa-power · Poly | Status |
|---|---|---|---|---|---|---|
| 1 | BAL–PHI (Circa) | +4900 | $15 | +6274 | −0.22 · −0.25 · −0.23 | 🔴 No |
| 2 | BAL–GB (Circa) | +10525 | $10 | +12836 | −0.18 · −0.29 · −0.11 | 🔴 No. Already hold $12 @ +10300; this only adds GB/BAL concentration |
| 3 | NE–SEA (Circa) | +7720 | $5 | +8523 | −0.09 · −0.28 · −0.09 | 🟡 Pass |
| 4 | NE–PHI (Circa) | +9100 | $5 | +10635 | −0.14 · −0.28 · −0.09 | 🟡 Pass |
| 5 | NE–GB (Circa) | +19450 | $5 | +21685 | −0.10 · −0.32 · +0.06 | 🟡 Pass (the + reading comes from a 6¢ Polymarket GB price, within rounding noise) |
| 6 | BAL–SEA (Kalshi 2¢) | +4573 net | $10 | +5020 | −0.09 · −0.17 · −0.15 | 🔴 No |
| 7 | BAL–SF (Kalshi 2¢) | +4573 net | $3.86 | +4584 | −0.00 · +0.02 · −0.02 | 🟢 OK (≈ fair; small coverage only) |
| 8 | KC–SEA (Kalshi 2¢) | +4573 net | $17.50 | +4874 | −0.06 · −0.09 · +0.03 | 🟡 OK only as deliberate KC coverage (see §2) |
| 9 | BAL–DAL (Kalshi 1¢) | +9246 net | $10 | +11163 | −0.17 · −0.09 · −0.35 | 🔴 No |

## 2. Correlation / coverage by AFC champion
Exacta return by matchup, held → held + proposed (outrights excluded):
```
        LAR    SF      SEA     PHI     DET    DAL     GB
BUF      -      -     385     340     390     -     3780
BAL      -    ->180  ->467   ->750     -    ->934  1248->2310
KC       -      -    ->817     -       -      -     1144
CIN      -      -       -       -       -      -     1144
NE       -      -    ->391   ->460     -      -     ->977
PIT      -      -       -       -       -      -     3198
```
P(at least one exacta cashes): **9.8% → 20.9%.**

- **A — BUF wins AFC (19.9%, most likely):** exactas cover GB/SEA/DET/PHI = 37.7% of NFC outcomes. **The two likeliest NFC champions (LAR 18.7%, SF 15.0%) are uncovered, and the expansion adds nothing here.** This is the portfolio's biggest hole. BUF–LAR fair ≈ +2580, BUF–SF fair ≈ +3245.
- **B — BAL wins AFC (14.2%):** coverage goes from 5.4% to 51.4%, $12 → $60.86. The expansion is mostly a Ravens position, built on price-shopping rather than a stated Ravens thesis.
- **C — NE wins AFC (8.5%):** 0% → 30.2% coverage on $15. That is ordinary longshot exposure, not an "asymmetric moonshot": NE is fairly priced.
- **D — KC wins AFC (14.7%):** yes, under-exposed. KC is as likely as BAL but gets $28.50 total vs BAL $60.86, and only GB/SEA are covered.

**Cap math corrections:**
- Held Packers exactas total **$82**, not $76 (45+12+11+8+6). After BAL–GB and NE–GB, GB exposure = $40 + $97 = **$137**, not $116. Still under the $200 cap.
- Bills are counted outright-only ($59.09) while Packers count exactas too. Measured the same way, BUF exposure is **$121.51**.

## 3. Kalshi execution
- **Limit orders only.** 2¢ limit on BALSF/KCSEA, 1¢ on BALDAL; accept partial fills and never cross to 3¢.
- **Don't route BAL–SF to a sportsbook for size.** BKR +3590 and BetUS +3500 are about 20% below fair (+4500–4660). More size is not worth that.
- **Fee formula:** the dossier writes F = ⌈0.07 × (1−P)⌉. My understanding is that Kalshi's trading fee scales with **P × (1−P)** per contract, rounded up per order. The dossier's per-contract result (≈0.14¢ at 2¢) lands close by coincidence. Codex should confirm against Kalshi's published fee schedule, not the dossier's formula.
- **Early-exit optionality is real but small.** A BAL–SEA contract could trade at 8–15¢ in December if both teams lead their conferences. Deep-longshot books are thin, though: bids today are often 0–1¢, spreads are wide, and exits pay a fee. Treat exit value as a tiebreaker, not a reason to buy −EV contracts.
- **The actual Kalshi edge is tick size.** Every longshot pair floors at 1–2¢. So a pair whose fair probability is well above 2.14% but asks 2¢ is +EV. By fair value the candidates are BUF–LAR 3.7%, BUF–SF 3.0%, KC–LAR 2.8%, BUF–SEA 2.7%, BAL–LAR 2.7%, KC–SF 2.2%. They would also fill the BUF hole in §2. **Screen those asks next.** None of the proposed pairs qualifies.

## 4. Hedge reserve and teasers
- **Do not plan around the 11 BookMaker open slots.** The ledger marks them `availability_status: unverified_house_rule_conflict`, `eligible_as_required_hedge_resource: false`: "do not fill, close, or rely on the slots … without explicit user approval." The dossier's "$401.01 committed incl. reserve" framing contradicts that policy.
- **Week 3 teasers are not playoff hedges.** A regular-season side has almost no correlation with who reaches the Super Bowl. Keep teasers on the weekly card, judged on their own merit.
- **Teaser appendix:** the 5-pt Circa −120 vs 6-pt BKR −120 conclusion is directionally right, since 5-pt teasers at −120 are poor. The per-leg cover rates (70.5%, 72.0%, 72.8%, 74.8%) have no source, and Wong edges vary a lot by era. Use 6-pt teasers only on true Wong legs (dog +1.5 to +2.5, favourite −7.5 to −8.5). pick-extraction now labels these automatically (commit `de8145e`).

## 5. Recommended adjustments before firing anything
1. **Drop #1, #2, #6, #9** ($45). They are clearly −EV under every method, and #1 is the largest stake.
2. **Pass on the three NE plays** ($15). The "rogue price" premise is false on today's data.
3. **#7 BAL–SF $3.86 at 2¢ is fine. #8 KC–SEA is fine only if KC coverage is the intent**, at 2¢ limit.
4. **Before adding anything else, price-screen the uncovered BUF–LAR / BUF–SF cells and the §3 Kalshi 2¢ candidates.** That is where coverage and value could line up.
5. **Reconcile the dossier's competitor prices** with the 9/22 capture files, and name their source.
6. Per the weekly synthesis prompt (§8), exacta adds need a current price at or better than fair, or an evidence-backed thesis. A "Ravens are underpriced after Week 2" thesis (Sharp or Square made that argument on BAL −2.5) could justify a **deliberate** Ravens add sized to that thesis. That is a separate call from price-shopping.

*Nothing was placed, logged or written to the ledger or Supabase. Analysis only.*
