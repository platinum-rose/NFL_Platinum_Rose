note = ("\n\n### ARI QB update — Sat Nov 21, 1:45 pm PT (X bookmark review)\n\n"
        "RotoWire ([post](https://x.com/RotoWireNFL/status/2123930260072706457), Fri 4:03 pm PT) and Fantasy Couch "
        "([post](https://x.com/fantasycouch/status/2123946936550244760), Fri 5:09 pm PT) report that **Carson Beck (back) did not practice Friday and Josh Johnson is preparing to start**. "
        "ESPN's depth chart still lists Beck QB1. The projected starters now carry Josh Johnson (needs review). "
        "Bookmaker kept ARI +16 / total 41 unchanged, so the market has absorbed a weak ARI QB either way. KC -16 and Under 41 stay leans; confirm the ARI starter at inactives.\n")
open('reports/intel/games/2026-w11-game-ARI_at_KC-sides.md', 'a', encoding='utf-8').write(note)
p = 'reports/intel/w11-qb-injury-news-check-2026-11-21.md'
s = open(p, encoding='utf-8').read()
s += ("\n## Update Sat 1:45 pm PT: ARI QB conflict (from X bookmark review)\n\n"
      "RotoWire (Fri 4:03 pm PT) and Fantasy Couch (Fri 5:09 pm PT) report that Beck did not practice Friday and Josh Johnson is preparing to start. "
      "This conflicts with the ESPN depth chart (Beck QB1). Projected starters now list Josh Johnson as ARI QB1, flagged for review. `qb_status_confirmed` stays open for ARI and TB until inactives.\n"
      "Other source conflicts are recorded in the bookmark digest: Michael Pittman Jr. and Jonathon Brooks (ESPN IR vs later RotoWire questionable), and Jacory Croskey-Merritt (later ESPN IR wins).\n")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
