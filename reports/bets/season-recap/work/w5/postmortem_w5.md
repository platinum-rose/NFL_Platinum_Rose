# Week 5 post-mortem run (20261105-0135)

- Page: `reports/bets/season-recap/week5-post-mortem.html`
- Scorecard: `work/w5/scorecard_w5.md`
- Rules check: `work/w5/rules_w5.md`
- Grader cross-check: `work/w5/crosscheck_w5.md` (blocking 0, warnings 9, adjudicated 1); placed recap 106-101-6 / lib 106-101-6 / stored 104-93-7
- Leg tables: `w5legs.json`, `w5paper.json` (previous copies in work/w5/*.prev-*)

## Notes
- cfg_w5.py / recaps_w5.py are an AUTO DRAFT: edit the [auto draft] text before sharing the page

## Close the loop
End the write-up with at most 3 rules for Week 6:
`python3 scripts/rules.py propose --week 5 --id R5-1 --text "..." [--check max_legs|read_reuse|lane_pref|shaky_qb|no_master_rr|manual]`
Andy accepts with `rules.py accept --id ...`; the next post-mortem checks whether each was followed and whether it helped.
