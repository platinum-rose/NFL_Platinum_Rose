# Week 6 post-mortem run (20261105-0135)

- Page: `reports/bets/season-recap/week6-post-mortem.html`
- Scorecard: `work/w6/scorecard_w6.md`
- Rules check: `work/w6/rules_w6.md`
- Grader cross-check: `work/w6/crosscheck_w6.md` (blocking 0, warnings 1, adjudicated 0); placed recap 98-82 / lib 97-82 / stored 98-82
- Leg tables: `w6legs.json`, `w6paper.json` (previous copies in work/w6/*.prev-*)

## Notes
- cfg_w6.py / recaps_w6.py are an AUTO DRAFT: edit the [auto draft] text before sharing the page

## Close the loop
End the write-up with at most 3 rules for Week 7:
`python3 scripts/rules.py propose --week 6 --id R6-1 --text "..." [--check max_legs|read_reuse|lane_pref|shaky_qb|no_master_rr|manual]`
Andy accepts with `rules.py accept --id ...`; the next post-mortem checks whether each was followed and whether it helped.
