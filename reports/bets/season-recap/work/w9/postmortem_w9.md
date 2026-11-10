# Week 9 post-mortem run (20261110-2059)

- Page: `reports/bets/season-recap/week9-post-mortem.html`
- Scorecard: `work/w9/scorecard_w9.md`
- Rules check: `work/w9/rules_w9.md`
- Grader cross-check: `work/w9/crosscheck_w9.md` (blocking 0, warnings 4, adjudicated 1); placed recap 75-44 / lib 75-44 / stored 76-47 · paper recap 16-16 / lib 16-16 / stored 0-0 · ai_record recap 28-13 / lib 28-13 / stored 0-0
- Leg tables: `w9legs.json`, `w9paper.json` (previous copies in work/w9/*.prev-*)


## Close the loop
End the write-up with at most 3 rules for Week 10:
`python3 scripts/rules.py propose --week 9 --id R9-1 --text "..." [--check max_legs|read_reuse|lane_pref|shaky_qb|no_master_rr|manual]`
Andy accepts with `rules.py accept --id ...`; the next post-mortem checks whether each was followed and whether it helped.
