# Week 7 post-mortem run (20261105-0135)

- Page: `reports/bets/season-recap/week7-post-mortem.html`
- Scorecard: `work/w7/scorecard_w7.md`
- Rules check: `work/w7/rules_w7.md`
- Grader cross-check: `work/w7/crosscheck_w7.md` (blocking 0, warnings 33, adjudicated 0); placed recap 106-117-3 / lib 104-115-3 / stored 110-117-3 · paper recap 82-74 / lib 82-70 / stored 94-82
- Leg tables: `w7legs.json`, `w7paper.json` (previous copies in work/w7/*.prev-*)

## Notes
- cfg_w7.py / recaps_w7.py are an AUTO DRAFT: edit the [auto draft] text before sharing the page

## Close the loop
End the write-up with at most 3 rules for Week 8:
`python3 scripts/rules.py propose --week 7 --id R7-1 --text "..." [--check max_legs|read_reuse|lane_pref|shaky_qb|no_master_rr|manual]`
Andy accepts with `rules.py accept --id ...`; the next post-mortem checks whether each was followed and whether it helped.
