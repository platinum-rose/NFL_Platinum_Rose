# Pitch / Pushback Agent — how to write The Pitch and The Pushback

**Status: LOCKED (Andy, 2026-10-25: "the Pitch and Pushback work brilliantly").** The Week 7 files are the model:
`reports/intel/supercontest-pitches-2026-w07.json` (SuperContest) and `reports/intel/master-pitches-2026-w07.json` (Master).
Reference page: `docs/reference/supercontest-report-locked-w07.html`.

## What needs one

| Report | Every… | File | Key |
|---|---|---|---|
| SuperContest | Dashboard AI pick **and** alternate | `reports/intel/supercontest-pitches-<season>-w<NN>.json` | team, e.g. `"GB"`, with `"game": "GB@DET"` matching the build |
| Master | Platinum Rose straight bet (digest §C: sides, MLs, totals) | `reports/intel/master-pitches-<season>-w<NN>.json` | `"GB@DET\|Side"` or `"IND@MIN\|Total"`, plus `"pick"` and `"sources"` |

Nothing gets elevated to a Platinum Rose recommendation or a Dashboard AI pick unless both sections can be written from the evidence. If a good Pitch can't be written, it's a lean (digest §L), not a rec.

## Weekly workflow (Saturday)

1. Run the build once (`build.py --week N --date <capture file date>`).
2. `python scripts/master-intel/pitch_scaffold.py --week N`: adds a TODO entry for every pick, alternate and §C rec that lacks one. It never overwrites existing entries.
3. Fill each TODO from the sources below.
4. Rebuild. The build prints `SuperContest format gate: PASS/FAIL`. The Master lists any rec without a pitch under Known gaps. Both must be clean before Andy gets the report. Run it on its own with `python scripts/master-intel/check_sc_report.py --week N`.

## Sources (cite by number; `ref` points at them)

- **[1] Friday matchup synthesis.** `reports/intel/games/<season>-w<NN>-game-<AWAY>_at_<HOME>-sides.md` (simulator, FTN/nflverse dossiers, expert agreement, splits, counter-case).
- **[2] Saturday market/news recheck.** `reports/intel/master-intel-narratives-<season>-w<NN>.md` plus the Saturday BKR/BEO board.
- (Master only) **[3+]**: live tickets, card sections or other saved files, listed in the pick's `sources`.

Every paragraph carries at least one `ref`. Use only facts that appear in those files, and keep their dates. If Saturday news changes a Friday number, say so ("Saturday BKR also offers +3.5, so the extra half point is gone").

## The Pitch: 2–3 paragraphs, each 2–4 sentences with figures

1. **The number.** The contest/book line against the fair spread. Is a key number protected (3, 7, 10)? Give the simulator cover estimate at *our* line, and how the current book compares (did we gain or lose the hook?).
2. **The matchup.** The two or three analytics that create the path to cover (DVOA, EPA rank, explosive rate, FTN coverage/pressure data, injuries on the other side). Name the mechanism ("gives Love a credible way to answer Detroit's scoring").
3. **Who agrees.** Name the experts on the side *with their numbers* (Tuley +3.5, Hunter +3.5, Sharp), plus any sharp-action or market report. Say when a number differs from ours.

## The Pushback: 2–3 paragraphs, an honest best case for the other side

1. **The opponent's strongest path.** Rest/bye, home field, top-ranked units, red-zone rate, and our team's ceiling problems ("topped 23 points once in six games").
2. **Who disagrees.** Name the opposing experts with their numbers and power ratings. Present them as counterarguments at their own lines, not identical bets. Note any market move against us (e.g. "back to -3.5 removes the cushion").
3. **Limits.** The size of the model edge ("51.3% is a small edge, not high confidence"), data-quality flags, small-sample trends, and stale data dates. For alternates, say plainly why it's a fallback (e.g. "conflicts with the synthesis's 'not a candidate' call at +9.5").

## Rules

- **SuperContest is spread-only.** No moneyline, total, Over/Under or player-prop language anywhere (the gate fails on it).
- **No generic cover definitions** ("GB covers if they win or lose by 3 or fewer") and no TODO text. The gate fails on both.
- Write plainly, with no hype words. A projection is not a cover probability, and a simulator figure is a Friday snapshot, not a fresh run.
- Shared shows and repeat analysts are not independent votes.
- The build adds the boilerplate automatically: spread support list, number check (contest vs BKR, capture time), saved spread splits, opposing voices, and source footnotes. Don't repeat those in the text.
- Master entries also give `pick` exactly as in digest §C (e.g. `"GB +3.5 (-103)"`) and a `sources` map.

## Minimum the gate enforces

At least 2 Pitch and 2 Pushback paragraphs per pick/alternate, each 120+ characters, each with a `ref`, and the `game` matching the build. It warns when a paragraph cites no figure.
