# Codex Handoff - NFL_Dashboard Futures Portfolio Analyst

Date: 2026-07-22
Repo: `E:\dev\projects\NFL_Dashboard`

## Purpose Of Next Session

Run a high-end analysis of the full NFL futures analyst system in a fresh session.

The goal is not just to inspect one report. The next session should evaluate the whole system:

- Data inputs and missing intel.
- Analyst workflow and prompt quality.
- Portfolio construction logic.
- Scenario-book / playoff hedge map behavior.
- Personalization around Andy's real bankroll, anchor tickets, exactas, open parlays, and hedge resources.
- Whether the live LLM analyst run should be trusted after the offline QA corpus passes.

## Current State

This session added and tested a local offline QA corpus for the futures portfolio builder. The corpus uses curated analyst JSON fixtures and stubs model calls, so it does not send the dossier to OpenAI or Anthropic.

Important distinction:

- Corpus reports prove the portfolio builder, validation, math, and rendering.
- Corpus reports do not represent fresh live LLM betting opinions.
- A fresh live LLM run would still be needed to generate new analyst ideas from the dossier.

## Main Files Changed

Modified:

- `agents/portfolio-synthesize.js`
- `package.json`

Added:

- `scripts/run-portfolio-corpus.js`
- `tests/fixtures/portfolio-corpus/README.md`
- `tests/fixtures/portfolio-corpus/scenario-book-bills-packers.json`
- `tests/fixtures/portfolio-corpus/reversed-exacta-resolution.json`
- `tests/fixtures/portfolio-corpus/fabricated-exacta-quarantine.json`
- `tests/fixtures/portfolio-corpus/partial-ladder-unresolved-leg.json`
- `tests/fixtures/portfolio-corpus/supplemental-outperformers.json`

Pre-existing untracked scratch files were left alone:

- `agents/_verify_ev_tmp.mjs`
- `agents/_verify_synth_tmp.mjs`
- `agents/_verify_tmp.mjs`
- `agents/_verify_val_tmp.mjs`

## Portfolio Builder Enhancements

`agents/portfolio-synthesize.js` now has richer scenario-book support:

- First-class `portfolio_strategy.final` output.
- Scenario type: `playoff_scenario_book`.
- Roles: `anchor_bet`, `ladder_bet`, `coverage_bet`, `option_bet`, `pocket_hedge`, `dead_cost`, `funded_liability`.
- `Scenario Book / Playoff Hedge Map` section in HTML and Markdown reports.
- Ladder-stack summary inside the scenario map.
- Risk/editor `scenario_review` is preserved.
- Stage 2 and Stage 3 model usage are preserved in raw JSON.
- `--out-suffix` prevents smoke/corpus runs from overwriting canonical reports.
- `superbowl_matchup` resolver now requires exact two-team matching, with reversed order allowed.
- Raw-only coverage ideas are quarantined under `unresolved_raw_coverage_positions` instead of being promoted into final coverage.

The stricter exacta resolver matters because fuzzy matching could otherwise make a fake matchup look real.

## Offline Corpus Runner

Command:

```powershell
npm.cmd run test:portfolio-corpus
```

Result from this session:

```text
5 portfolio corpus scenario(s) passed.
```

Why `npm.cmd`: plain `npm` can be blocked by PowerShell execution policy on this machine.

The corpus runner:

- Reads fixture JSON from `tests/fixtures/portfolio-corpus/`.
- Mocks `fetch()` inside a child Node process.
- Runs the real `agents/portfolio-synthesize.js` CLI flow.
- Always uses `--no-persist`.
- Writes ignored local artifacts to `.nfl/portfolio/` with `corpus-...` suffixes.
- Checks generated `.raw.json` and `.md` against fixture expectations.

## Corpus Scenarios

1. `scenario-book-bills-packers`
   - Bills/Packers anchors.
   - Bills/Packers exacta-style coverage.
   - Bears and Dolphins ladder examples.
   - Proves baseline scenario-book mechanics.

2. `reversed-exacta-resolution`
   - Analyst writes `Detroit Lions vs Buffalo Bills`.
   - Dossier row is `Buffalo Bills vs Detroit Lions`.
   - Should still resolve.

3. `fabricated-exacta-quarantine`
   - Fake same-conference / non-dossier exactas.
   - Should invalidate hedge basket and quarantine raw coverage ideas.

4. `partial-ladder-unresolved-leg`
   - Valid Bears legs plus an invalid `mvp` leg.
   - Should keep the partial ladder visible and preserve unresolved-leg notes.

5. `supplemental-outperformers`
   - User-liked outperformer teams: Chargers, Bengals, Lions, Giants, Saints, 49ers.
   - 6 final supplemental recommendations.
   - 6 exacta-style coverage legs.
   - 3 ladders: Chargers, Bengals, Saints.
   - 0 invalidated structures.

## Latest Reports To Review

Bills/Packers baseline QA report:

- `.nfl/portfolio/portfolio-2026-07-22-corpus-scenario-book-bills-packers.html`
- `.nfl/portfolio/portfolio-2026-07-22-corpus-scenario-book-bills-packers.md`
- `.nfl/portfolio/portfolio-2026-07-22-corpus-scenario-book-bills-packers.raw.json`

Supplemental outperformers QA report:

- `.nfl/portfolio/portfolio-2026-07-22-corpus-supplemental-outperformers.html`
- `.nfl/portfolio/portfolio-2026-07-22-corpus-supplemental-outperformers.md`
- `.nfl/portfolio/portfolio-2026-07-22-corpus-supplemental-outperformers.raw.json`

Reminder: `.nfl/portfolio/` is ignored and local-only.

## Supplemental Outperformer QA Details

Teams:

- Chargers
- Bengals
- Lions
- Giants
- Saints
- 49ers

Resolved exacta coverage legs:

- Chargers vs Packers `+9500`
- Bengals vs Packers `+12000`
- Bills vs Lions `+5500`
- Bills vs Giants `+20000`
- Bills vs Saints `+22500`
- Bills vs 49ers `+5500`

Scenario math:

```text
Basket exposure: 6 units
Ladder full exposure: 11 units
Max dead cost if all prepositioned: 17 units
Strict-ladder dead cost: 9 units
Funded liability if ladders hit: 7.6897 units
```

Ladders:

- Chargers: wins -> playoffs -> AFC -> Super Bowl
- Bengals: wins -> playoffs -> AFC -> Super Bowl
- Saints: playoffs -> NFC -> Super Bowl

## User Portfolio Personalization Inputs

Known user preferences and intended exposure:

```text
Futures unit size: $20
In-season unit size: $10
Bills vs Packers exacta: $100 at +6500
Bills Super Bowl position target cap: about $200
Packers Super Bowl position target cap: about $200
Primary exposure range: $100 to $500
```

Interpretation:

- Bills and Packers are anchor bets.
- Bills/Packers exacta is an anchor-correlation amplifier, not a hedge.
- Supplemental teams are coverage/outperformer candidates.
- Future personalization should model actual dollars and units, not only abstract unit stakes.

Suggested future config shape:

```json
{
  "unit_sizes": {
    "futures_unit": 20,
    "in_season_unit": 10
  },
  "primary_exposure": {
    "current_committed": 100,
    "planned_cap": 500
  },
  "anchor_positions": [
    {
      "selection": "Buffalo Bills Super Bowl",
      "target_stake_range": [0, 200],
      "role": "anchor_bet"
    },
    {
      "selection": "Green Bay Packers Super Bowl",
      "target_stake_range": [0, 200],
      "role": "anchor_bet"
    }
  ],
  "amplifier_positions": [
    {
      "selection": "Buffalo Bills vs Green Bay Packers Super Bowl exact matchup",
      "stake": 100,
      "price": 6500,
      "role": "anchor_correlation_bet"
    }
  ]
}
```

## Open Parlay Inventory

Durable inventory:

- `data/futures-imports/open-parlays-2026.json`
- Strategy doc: `docs/FuturesPortfolioStrategy.md`

Summary:

```text
6 tickets
11 open slots
$162.50 already risked / sunk
$3,327.12 total potential win
4 crown playoff-only slots
1 saved playoff slot
6 flexible slots
```

Ticket days elapsed as of 2026-07-22:

| Ticket | Placed | Days Since Placed | Days Past 90 | Open Slots | Priority |
|---|---:|---:|---:|---:|---|
| 730737412 | 2026-03-20 | 124 | 34 | 2 | crown |
| 730846806 | 2026-03-21 | 123 | 33 | 1 | save |
| 730888303 | 2026-03-22 | 122 | 32 | 2 | crown |
| 731062665 | 2026-03-26 | 118 | 28 | 2 | flexible |
| 731063264 | 2026-03-26 | 118 | 28 | 2 | flexible |
| 731536472 | 2026-04-04 | 109 | 19 | 2 | flexible |

Important caveat:

- User checked Bookmaker house rules and saw open parlays may only be held 90 days.
- These tickets still appear open, but they are beyond 90 calendar days from placement.
- User said to leave them alone for now and will figure it out later.
- Do not fill or modify any open parlay slots unless explicitly asked.
- Future analyst should treat them as hedge inventory with a house-rule uncertainty flag.

## Current Gaps For High-End Analysis

1. Live LLM analyst has not been rerun.
   - Canonical `portfolio-2026-07-22.html/.raw.json` may still be stale/dummy from earlier smoke testing.
   - Do not trust canonical report until a real run is approved.

2. Open parlay inventory is not yet automatically loaded by `portfolio-synthesize.js`.
   - It exists in `data/futures-imports/open-parlays-2026.json`.
   - The fresh analysis should recommend how to feed this into `portfolio_strategy`.

3. Actual position ledger is not formalized.
   - Need a machine-readable ledger for:
     - actual stakes,
     - ticket IDs,
     - current blended odds,
     - target caps,
     - role,
     - hedge reserve rules.

4. Fresh analyst prompt should reason about:
   - cash reserve,
   - open parlay slots,
   - anchor SB positions,
   - exacta amplifier tickets,
   - strict vs prepositioned ladder cost,
   - playoff trigger rules,
   - conference/division concentration.

5. Corpus is useful but still curated.
   - It proves plumbing and math.
   - It does not prove live model edge discovery.

## Safe Commands

Run offline corpus:

```powershell
npm.cmd run test:portfolio-corpus
```

Run one scenario:

```powershell
node scripts\run-portfolio-corpus.js --scenario supplemental-outperformers
```

Syntax checks:

```powershell
node --check agents\portfolio-synthesize.js
node --check scripts\run-portfolio-corpus.js
```

Live LLM run requires explicit user approval because it sends the dossier to an API:

```powershell
node agents\portfolio-synthesize.js --dossier ".nfl\portfolio\dossier-2026-07-22.json" --models gpt-4o --primary "Buffalo Bills,Green Bay Packers" --no-persist --out-suffix live-review
```

Do not run this live command without explicit approval.

## Recommended Next Session Prompt

Use this in a fresh session:

```text
We are in E:\dev\projects\NFL_Dashboard. Read handoffs\2026-07-22-futures-portfolio-analyst-handoff.md first. Then perform a high-end analysis of the full futures analyst system: data inputs, prompt/committee workflow, scenario-book portfolio logic, personalization around my Bills/Packers anchors and exacta, open parlay hedge inventory, and gaps before running a fresh live LLM analyst. Review code and local reports as needed. Do not run a live API analyst call or modify open parlay slots without my explicit approval.
```
