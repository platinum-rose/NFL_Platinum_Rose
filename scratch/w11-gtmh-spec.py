import shutil
p = 'docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md'
shutil.copy(p, p + '.bak-claude-20261121-impl')
s = open(p, encoding='utf-8').read()
a = "Direction = fair number vs. the market number. **Currently unavailable:** the W11 packet `projection` equals the market line (`projection_basis: captured_bookmaker_lines`), so it carries no information. Neutral until a real fair-line model exists"
b = "Direction = fair number vs. the market number. **Available from 2026-11-21:** the double-shrunk margin sim (`reports/intel/w<NN>-model/sim-w<NN>-*.json`), centered halfway from the Bookmaker line toward the team-strength model"
assert s.count(a) == 1; s = s.replace(a, b)
s += '''

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
'''
open(p, 'w', encoding='utf-8').write(s); print('spec updated')
