# AI Prop Matchup Packet Spec

Date: 2026-09-21

## Purpose

Build a deterministic packet that lets an AI analyze NFL player props as a price-and-matchup audit instead of a tout-card generator.

The packet builder does not place bets, recommend stakes, call paid models, write Supabase, or touch sportsbook accounts. It only reads saved sportsbook artifacts and emits JSON/Markdown for human or model review.

## Principle

AI should not originate the bet. AI should audit the number.

The packet must provide:

- Structured sportsbook rows, not screenshots or page prose.
- Break-even math for offered prices.
- No-vig math when a two-sided market exists.
- Cross-book ladder context where available.
- Movement context when a prior artifact exists.
- Explicit missing facts the model must not hallucinate.
- A decision contract that allows `pass` and `needs_more_info`.

## Inputs

Required:

- Parsed BetOnline live artifact, for example `scratch/betonline-live-2026-09-21-repull-nyg-lar.parsed.json`.
- Parsed Bookmaker live artifact, for example `scratch/bookmaker-live-2026-09-21-repull-nyg-lar.json`.

Optional:

- Bookmaker baseline artifact for movement comparison.
- BEO baseline artifact once future re-pulls exist.
- Player usage, injuries, projected starters, team profile, weather, and game-total context.

## Output Schema

```json
{
  "schema": "ai_prop_matchup_packets_v1",
  "generatedAt": "ISO timestamp",
  "event": "New York Giants @ Los Angeles Rams",
  "sourceArtifacts": {
    "betonline": "...",
    "bookmaker": "...",
    "bookmakerBaseline": "..."
  },
  "summary": {
    "packets": 0,
    "players": 0,
    "markets": 0,
    "books": ["BEO", "BKR"]
  },
  "packets": []
}
```

Each packet contains:

- `packetId`: stable player/market id.
- `player`, `team`, `event`, `market`.
- `primary`: BEO two-sided row or yes/no/list row when available.
- `priceMath`: break-even and no-vig values.
- `crossBook`: comparable BKR ladder rows and nearest thresholds.
- `movement`: known BKR movement for comparable rows when baseline is supplied.
- `aiReviewContract`: constrained prompt scaffolding for the model.
- `missingFactsChecklist`: facts the AI must ask for before escalating confidence.

## Price Math

For each American price:

- Positive odds: `100 / (odds + 100)`.
- Negative odds: `abs(odds) / (abs(odds) + 100)`.

For two-sided markets:

- Convert both sides to raw implied probabilities.
- Divide each side by the raw total to get no-vig probabilities.
- Convert no-vig probability back to fair American odds.

Do not call a prop `value` unless an external fair source or model estimate beats the offered break-even after juice. The packet can show `price_to_beat`; it cannot invent fair probability.

## AI Review Contract

Every packet should instruct the model:

1. Do not pick a side from narrative alone.
2. Start with price math.
3. List confirmed facts separately from assumptions.
4. List missing facts that could flip the answer.
5. Return one of:
   - `pass`
   - `needs_more_info`
   - `price_watch`
   - `candidate_for_human_review`
6. Do not recommend a bet unless a fair probability source is provided or explicitly estimated with labeled assumptions.

## Missing Facts Checklist

Baseline checklist:

- Active/inactive status.
- Injury limitation and practice trend.
- Snap share / route share / carry share.
- Red-zone role.
- Team total and game script sensitivity.
- Opponent personnel matchup.
- Pace / play volume.
- Weather / roof / field conditions.
- Same-game correlation conflicts.
- Existing ticket exposure and duplicate-leg availability.

## First Implementation Slice

The first builder should:

- Read BEO + BKR saved artifacts.
- Group by player and market.
- Use BEO as primary two-sided pricing when present.
- Attach BKR ladder rows for matching player/market.
- Attach BKR movement from baseline when supplied.
- Emit JSON plus a compact Markdown review brief.
- Include tests for break-even math, no-vig math, BKR ladder attachment, and missing-facts scaffolding.

Out of scope for the first slice:

- Live browser capture.
- Paid model calls.
- Supabase writes.
- Automatic bet recommendations.
- Automated roster/injury/weather fetching.
