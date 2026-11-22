# "Gun to my head" picks for Master Intel

Implementation spec for review · 2026-11-20 · decisions confirmed by Andy 2026-11-20 · supersedes `PUBLIC_SOURCE_PICKS_SPEC.md` for sides and totals

## Outcome

For every game on the slate, the AI must give a call on **the side and the total**: its most probable choice, given all available data, intel, analytics and expert sources, or an explicit **Coin flip** when the evidence doesn't separate the two sides. These are **leans, not recommendations**. They carry no Platinum Rose seal, no stake and no execution path.

Each lean comes with:
- a short summary of why the AI chose it;
- the strongest reasons for and against;
- an honest strength tier.

Andy decides whether the risk is worth taking.

Reader-facing heading: **Gun to my head**. Label on every lean, including copied or standalone views: **Lean · No Platinum Rose endorsement**.

## What changes from the public-source picks spec

| Topic | Public-source picks (previous) | Gun to my head (this spec) |
|---|---|---|
| Coverage | Only markets with a qualifying source call | **Every game gets a side call and a total call, always**: a lean, or a literal *Coin flip*. Silence is not an outcome |
| Trigger | A named expert call plus independent support | All evidence families are weighed; an expert call is one input among several |
| Evidence bar | Last-3-game hit rate ≥ 2/3 | Factor families with source IDs (see "Evidence families"). Recent game results are context, never a qualifier |
| Props | In scope | **Dropped** (Andy, 2026-11-20). Existing public-source prop rows stay as research leads in Props Lab and Experts only |
| Prediction markets | Reference only | **DraftKings Predictions is an actionable book** alongside Bookmaker and BetOnline (Andy, 2026-11-20). Kalshi, Polymarket and other venues stay reference only |
| Opposing case | Generic caveat | The specific strongest evidence against, from the saved record |
| Grading | None | Graded weekly by strength tier and against the closing line |

## Scope

- Every active game with a uniquely mapped ESPN event that hasn't kicked off at the as-of time.
- **Side** = full-game point spread only (Andy, 2026-11-20). **Total** = full-game over/under.
- Moneylines (at any spread), team totals, halves, props, teasers, parlays, futures and live markets are out of scope.
- Run locally against a saved snapshot at an explicit as-of time. Collection, paid model calls, scheduling and publication are separate work.

## Relationship to the official card

- **Official pick exists for the market:** show it in the GTMH slot, labelled *Official pick*. The lean must never contradict an official pick.
- **Official card passes on a game or market:** show the GTMH lean and the official reason for passing ("model edge below hurdle", "QB uncertainty", and so on). The official result is read-only.
- **Official gate is provisional:** leans still run. Each open gate item that touches a game becomes an explicit condition on that game's leans. Example: `qb_status_confirmed` pending → "Lean assumes Cam Ward starts."

## Evidence families

Each family produces a direction per market (side A / side B, over / under, or neutral), plus the source IDs from the snapshot that support it. A family with no data is **neutral**, not inferred.

| # | Family | Uses | Notes |
|---|---|---|---|
| 1 | **Model fair line** | Platinum fair spread/total, simulation output | Direction = fair number vs. the market number. **Available from 2026-11-21:** the double-shrunk margin sim (`reports/intel/w<NN>-model/sim-w<NN>-*.json`), centered halfway from the Bookmaker line toward the team-strength model |
| 2 | **Market movement** | Opener → current (packet `opening_lines` vs `lines`), cross-book disagreement | Direction of the move. Note where it crosses key numbers (3, 7, 10; totals 41, 44, 47) |
| 3 | **Money signals** | Bet/handle splits, `big_money_signals` | Only dated splits, with capture time. Stale splits are shown as dated context and count as neutral |
| 4 | **Matchup analytics** | FTN Stats IQ context, EPA per play / per dropback, rushing efficiency, pressure, coverage, pace/tempo, red-zone rates | Name the table and stat; keep the sample window |
| 5 | **Availability** | Injuries, QB status, starters report, strict roster vet | A material out (QB, OL cluster, top-2 skill player, CB1) tilts toward the healthier side. An unresolved QB status creates a condition |
| 6 | **Expert consensus** | Reviewed articles, podcasts, X, expert feed (`expert_consensus`, `expert_picks`) | Collapse repeats of one underlying call. Once graded track records exist, weight analysts by record; until then each independent call counts once |
| 7 | **Situational** | Rest and bye, travel and time zone, short week, weather for totals | Only what's in the saved snapshot |

Rules:
- **Recent game results** (last-N ATS or over/under records, hit rates) are display context only. They never set a family's direction.
- **DraftKings Predictions** prices may supply the quoted number (see "Exact terms"). **Kalshi, Polymarket, other venues and OddsRelay rows** may inform family 2 as labelled reference only; they never supply the quoted number.
- Every claim in the write-up must cite a source ID in the snapshot. The validator rejects unsupported statistics, lines or quotes.

## Choosing the lean (deterministic)

1. Tally each market: families pointing each way, and families neutral.
2. **Tier:**
   - **Strong lean:** at least 3 families agree; no family points the other way, apart from one that is clearly weaker (dated, single source); and no unresolved availability condition.
   - **Lean:** more families for than against; or a Strong lean that carries an availability condition.
   - **Coin flip:** families are tied, or fewer than 2 have data. **No side is named.** The card says "Coin flip", lays out the best case on each side, and states what would tip it (for example "TEN +11.5 or better → Lean TEN; Ward confirmed out → Lean DAL"). There is no default or tie-break pick; the Coin flip label is itself the signal (Andy, 2026-11-20).
3. The drafted text can't change the direction or the tier. It explains them.

Never show a probability, edge, fair price or confidence percentage unless a documented calculation produced it. The tier is the confidence signal.

## Exact terms

Each lean states:
- **The number:** the best line and price among the **actionable books: Bookmaker, BetOnline and DraftKings Predictions** (Andy, 2026-11-20), using only fresh exact rows, with provider, source time and capture time. Show each available book on the card so Andy can shop. If no fresh row exists, show the packet line, marked "Recheck before relying on it".
- **DraftKings Predictions rows** are event contracts. Show the contract price as captured and the decimal equivalent, labelled "before fees". Fees and settlement terms are unverified until checked, so a DKP number is never compared with a sportsbook number as if equal without that label.
- **DraftKings Sportsbook, Kalshi, Polymarket and OddsRelay** rows can appear as labelled reference, never as the stated number.
- **Holds to:** the worst number at which the AI would still make the same call, for example "TEN +10.5 · holds to +9.5; Coin flip at +9 or worse". Derive it from the key-number rules and the move history. If it can't be derived, say "Not established".
- **Condition:** any open gate item or availability assumption, phrased as a check the reader can make before kickoff, with what happens if it fails.

## Output per game

```
TEN @ DAL · Sun 10:00 PT
Side  · TEN +10.5  · Lean · holds to +9.5
        BKR +10.5 −110 (Sat 10:02) · BOL +10.5 −108 (Sat 10:05) · DKP +10.5 0.52 → 1.92 dec, before fees (Sat 10:07)
Total · Coin flip at 47.5 · tips to Under at 48.5+ or if wind ≥ 15 mph is confirmed
  Why:      2–3 sentences tying the agreeing families together
  For:      up to 3 specific points, each with source IDs
  Against:  up to 3 specific points, the strongest first ("No specific counter-case in saved evidence" if none)
  Check:    "Lean assumes Cam Ward starts; if he is out, treat as Coin flip."
  Official: Passed (edge below hurdle) / Official pick: … / Not evaluated
```

## Artifact and rendering

- **File:** `data/research-intel/review/<season>-w<NN>-gun-to-my-head.json`, schema `gun_to_my_head_v1`.
- **Top level:** as-of time, input hashes, official gate snapshot, and per-tier counts.
- **Each lean records:** game IDs, market, pick, line and price block (original vs. verified), tier, the per-family direction with source IDs, holds-to (or, for a Coin flip, what would tip it), conditions, for and against, official disposition, and fixed `endorsed=false` and `execution_eligible=false`.
- **Determinism:** the same snapshot and as-of time give the same picks, tiers, IDs and order.
- **Master Intel HTML:** a **Gun to my head** section, one card per game in kickoff order, with a tier badge. Add a filter for Strong / Lean / Coin flip. No "top N" ranking.
- **Isolation:** no path to the official card, official or paper ledgers, SuperContest, My Card, sportsbooks, Supabase or publication. Any lean Andy wants to bet goes through the normal Platinum workflow and his approval.

## Grading (required, not optional)

After each week, grade every lean in a separate ledger, `data/research-intel/gun-to-my-head-ledger-<season>.json`:
- Result at the stated number: win / loss / push.
- Result at the closing line, where captured.
- Closing-line value: stated number vs. close.

Report the record by tier and by market (sides, totals), next to the official card's record. **Coin flips have no pick to grade.** Log them with the final result anyway, and track how often each week's calls end as Coin flips. The tiers earn their meaning from this ledger. If Leans grade no better than Strong leans, or Strong leans no better than chance after a reasonable sample, change the tier rules. This ledger never mixes with placed-bet records.

## Acceptance and replay (Week 11 Friday snapshot)

| Test | Expected |
|---|---|
| Coverage | 12 games × 2 = 24 calls (a lean or a Coin flip); no game without a side call and a total call. The concluded IND@HOU game is excluded with a reason |
| Official overlap | The NYJ@LAC official pick appears as *Official pick* in its slot. No lean contradicts an official pick |
| Provisional gate | Games touched by `qb_status_confirmed` / `news_flags_resolved` carry an explicit condition |
| Neutral model | Family 1 is neutral for every game, because projections equal market lines; no fabricated fair line |
| Coin flip | A tied tally shows "Coin flip" with no side named, both cases, and what would tip it |
| Actionable books | The stated number comes only from fresh Bookmaker, BetOnline or DK Predictions rows; DKP shows "before fees" |
| Claims | Every statistic or quote in the text resolves to a snapshot source ID; an injected unsupported claim is rejected |
| Prices | A stale or non-exact row never fills the verified price; the packet line shows with "Recheck" |
| Repeat run | Identical decisions and ordering; official outputs byte-identical |
| Grading | After Week 11 finals, the ledger grades every lean and logs every Coin flip with its result |

Review the Week 11 replay with Andy before adding it to the weekly workflow.

## Decisions (Andy, 2026-11-20)

1. **Props:** dropped from this feature. Public-source prop rows remain research leads only.
2. **Side market:** spread only.
3. **Ties:** shown as literal Coin flips, with no default pick. The label is a signal in itself.
4. **Actionable books:** Bookmaker, BetOnline and DraftKings Predictions. DraftKings Sportsbook, Kalshi, Polymarket and OddsRelay are reference only.


## Implementation notes (first build, 2026-11-21, Week 11 Saturday)

Script: `scripts/master-intel/gun_to_my_head.py` → `data/research-intel/review/<season>-w<NN>-gun-to-my-head.json`, ledger `data/research-intel/gun-to-my-head-ledger-<season>.json` (`--grade` after finals). Rendered by `scripts/master-intel/extra_inputs.py` (`gtmh_section`) inside the recommendations box (site Dashboard page), with a CSS-only tier filter and a one-line summary in each game's "Model, sim & conditions" panel. The section carries `no-bm`, so no My Card buttons.

Family thresholds as built (each family is neutral below its threshold):

| # | Family | Side | Total |
|---|---|---|---|
| 1 | Model | sim center at least 0.5 pt from the line (1 pt of raw model gap) | model total vs line, minus the slate-wide model lean, at least 1.5 pts |
| 2 | Movement | opener → current at least 0.5 pt (actual move; frozen during holds/tips searches) | same |
| 3 | Money | splits older than 6 h at as-of are context only (W11: all neutral) | same |
| 4 | Analytics | FTN EPA projection at least 1.5 pts from the line | slate-centered gap at least 2 pts |
| 5 | Availability | curated per-game table from the saved Saturday checks (QB downgrade, OL cluster, CB1, top-2 skill player); unresolved QB → condition | not scored |
| 6 | Experts | distinct people, net margin of at least 2; a person with both directions is dropped | same |
| 7 | Situational | no rest/travel data in the snapshot (neutral) | weather review materiality other than "none" → Under |

- **Holds to / what would tip it:** re-run the same rules at numbers 0.5 to 3 points worse (holds) or better (tips); only families 1 and 4 respond to the number. "or further" means the call still holds at the 3-point search limit.
- **Sim number in the write-up:** the double-shrunk sim probability at the Bookmaker number, compared with the break-even of the Bookmaker price at that number (documented calculation, so allowed by the "never show a probability" rule).
- **DK Predictions:** the Thursday capture is shown as stale reference; it never supplies the stated number.
- **Card leans** (JAX -5.5, PIT -4, CIN -6, MIN@SF U46.5, NO@CHI U48 in Week 11) are not official picks; a call may disagree and is flagged "Disagrees with the card lean". The Platinum Rose pick (NYJ +3) fills its slot as *Official pick*.
- The acceptance test "Neutral model" no longer applies now that a sim exists.
