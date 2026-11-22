"""Compose the Saturday Week 11 X bookmark digest from the Friday digest + reviewed Saturday bookmarks."""
import re
src = open('data/intel/articles/2026-w11/bookmark-text-intelligence-digest.md.bak-claude-20261121-sat', encoding='utf-8').read()
parts = open('scratch/w11-sat-new-digest-parts.md', encoding='utf-8').read()
P = dict(re.findall(r'@@(\w+)@@\n(.*?)(?=\n@@|\Z)', parts, re.S))
def section(n):
    m = re.search(rf'(## {n}\. .*?)(?=\n---\n|\Z)', src, re.S)
    return m.group(1).rstrip()
s1 = section(1).rstrip() + '\n' + P['NEWPICKS'].rstrip()
header = ("# Week 11 X Bookmark Text Intelligence Digest\n"
          "> Evidence Window: 2026-11-17T04:00:00Z through 2026-11-24T04:00:00Z  \n"
          "> Current Local Date: 2026-11-21 (Saturday refresh, reviewed by Claude ~1:55 pm PT)  \n"
          "> Scope: 12 remaining Week 11 NFL games (excluding concluded IND@HOU 26-3)  \n"
          "> Storage: `data/intel/articles/2026-w11/`  \n"
          "> Saturday source: `agents/twitter-bookmarks-agent.js --dry-run` via `scratch/w11-sat-bookmarks-dryrun.mjs` (345 bookmarks read, 3 new; no Supabase writes; Gemini disabled, no paid calls) plus the 22 local bookmark reports written Fri 11:59 pm PT in `.nfl/reports/twitter-bookmarks/` (2026-11-20 and 2026-11-21 files). Friday rows are retained. Every new player name was checked against `espn-full-rosters-latest.json`.\n")
out = (header + '\n---\n\n' + s1 + '\n\n---\n\n' + section(2) + '\n\n---\n\n' + P['QBNEWS'].rstrip()
       + '\n\n---\n\n' + section(4) + '\n\n' + P['WEATHER'].rstrip() + '\n\n---\n\n' + section(5) + '\n' + P['MARKET'].rstrip()
       + '\n\n---\n\nResearch context only. No Platinum Rose endorsement; no pick, ticket or ledger change is implied.\n')
assert '## 1. Explicit Picks' in out and 'Week 11 X Bookmark Text Intelligence Digest' in out
open('data/intel/articles/2026-w11/bookmark-text-intelligence-digest.md', 'w', encoding='utf-8').write(out)
print('written', len(out), 'chars;', out.count('\n| @'), 'table rows')
