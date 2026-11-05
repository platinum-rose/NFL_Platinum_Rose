# Week 8 post-mortem run (20261105-0135)

- Page: `reports/bets/season-recap/week8-post-mortem.html`
- Scorecard: `work/w8/scorecard_w8.md`
- Rules check: `work/w8/rules_w8.md`
- Grader cross-check: `work/w8/crosscheck_w8.md` (blocking 0, warnings 15, adjudicated 0); placed recap 154-98-1 / lib 145-95-1 / stored 153-96-1 · paper recap 38-60 / lib 38-60 / stored 38-58
- Leg tables: `w8legs.json`, `w8paper.json` (previous copies in work/w8/*.prev-*)


## Close the loop
End the write-up with at most 3 rules for Week 9:
`python3 scripts/rules.py propose --week 8 --id R8-1 --text "..." [--check max_legs|read_reuse|lane_pref|shaky_qb|no_master_rr|manual]`
Andy accepts with `rules.py accept --id ...`; the next post-mortem checks whether each was followed and whether it helped.
