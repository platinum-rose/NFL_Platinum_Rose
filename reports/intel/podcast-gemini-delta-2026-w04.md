# Week 4 podcast intel (Gemini, 17 episodes) — delta vs the Saturday card

Built Sun 10/04 ~02:20 PT from Supabase `podcast_gemini_intel` (17 promoted rows, read-only query; created 10/03 03:49–05:24 UTC), per `handoffs/2026-10-02-2300-antigravity-to-codex-week4-podcast-intel.md`. Compared against `reports/intel/master-intel-narratives-2026-w04.md`, `data/generated/master-intel/w04-expert-verified.json` and `reports/bets/2026-w04-card.md`.

## Coverage
- 155 picks: every side/total pick by a named host matches a position already in the narratives (the 10/03 synthesis ran after this ingestion). Spot-check "new" rows were name/format mismatches (e.g. "Steve Fezik", side coded UNDER on a spread), not new positions.
- **0 moneyline picks** in the 17 episodes. Sharp or Square's two episodes carry 7 picks, all spreads/totals: CLE +2.5 and Under 38.5 (TNF, settled), PHI +3 (Millman), TB +3.5 (Millman), DEN +2.5 (Millman, "Brass Balls Trade of the Week"), LV (Hunter, already bet), ARI −2.5 (Millman).
- The 96 analysis notes were **not** used by the narratives (Chao and Cosell: 0 mentions). The card-relevant ones are below.

## Notes that bear on the card / pick'em
| Game | Note (speaker) | Card position | Effect |
|---|---|---|---|
| KC@LV | Pros "all over the Chiefs", "totally overrating this Raiders team" (Simon Hunter, both S-or-S episodes) | LV ML in Dog-ML RR; LV +4.5 SC alternate; **Yahoo LV fade at slot 3** | Counter — already quoted in narratives; weakens the Yahoo fade most |
| ATL@NO | "Tons of love by the pros on Atlanta… Saints a huge public side" (Hunter, Hotline) | ATL ML in RR, ATL +8.5 teaser, ATL flip in Yahoo/CBS | Supports (new: not in narratives) |
| LAR@PHI | "Really smart groups taking position on that Rams team" at −2.5 (Hunter); prediction markets 3.5 (Millman); Eagles DB communication breakdowns vs motion, McVay motion-heavy (Cosell) | LAR ML slot 3, LAR −3 SC, Stafford 2+ TD, Nacua ATD (7e) | Supports LAR side |
| LAR@PHI | Nacua "likely not 100%" — core muscle, should stay productive (Chao) | Nacua ATD +120 (7e) | Mild counter on the prop |
| DAL@HOU | "Really sharp side, Houston… 0-3 team as a favorite" (Hunter) | HOU ML slot 4 | Supports |
| ARI@NYG | "Pros love Arizona" (Hunter/Millman) | ARI ML slots 3/5, 2-leg, SC | Supports (already in narratives) |
| DEN@SF | Bosa out, Trent Williams off a stinger, Evans rib (Hunter) | DEN on six tickets | Supports; Evans status still decides at 11:35 PT inactives |
| TEN@BAL | Ravens' top two centers on IR, backup guard/3rd-string C (Chao) | TEN +11.5 SC, TEN ML RR; Henry 2+TD / 1st TD, Lamar ATD | Supports TEN cover; mild counter on BAL TD props |
| GB@TB | GB OL "highly compromised", run game neutralized (Cosell; Chao ranks GB OL 3rd-most injured unit) | GB/TB Under 39.5 single; Jalon Daniels INT (7a) | Supports the under |
| DET@CAR | Chao: CAR secondary most injured unit in NFL, DET secondary 2nd | DET ML (SNF cap), Jameson Williams ATD (7e), Gibbs 2+ TD | Supports DET passing; also argues for the over (card passes total) |
| NE@BUF | Chao on Maye: two notes disagree — "labral issue… lingering, serious" vs "recovering well from an AC joint sprain" | NE +7 in Hybrid | Unresolved; check Maye's status at inactives |

## Extraction errors to fix before anyone reuses these rows
- Handoff §4 highlights contain matchup errors: "Denver +2.5 (… vs. KC)" — DEN plays SF; "Rams +2.5 against Philadelphia" — LAR were −2.5 favorites (Hunter's quote is about the Rams *at* 2.5); "Ravens… vs. Bills pass rush" — BAL plays TEN.
- Row 929eeaf1 (Action Network Playground): Brandon Anderson "MIN −1.5 … New Orleans on a short week" (wrong game/line) and "NYG −6.5 at +285" (garbled).
- Rows 6b947fdd / e3b7d457: speaker spelled "Steve Fezik".
- Chao TB note names the starter "Jaylen Daniels" (ESPN 10/04: Jalon Daniels).
- Several picks code spread sides as UNDER/OVER (Kezirian, Abrams, Stuckey, FantasyPros) — side must be read from the rationale.
- Team/role claims inside notes (coaches, RBs) were not roster-vetted; don't quote them without `npm run roster:vet`.
