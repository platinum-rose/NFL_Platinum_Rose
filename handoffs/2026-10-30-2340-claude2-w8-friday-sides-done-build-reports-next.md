# Handoff — Week 8 Friday run: sides done, props running, build both reports next
Claude team 2 · Fri 2026-10-30 ~11:40 PM PT · branch `claude/w5-prop-cards-2026-10-11`

## Andy's ask for the fresh session
Build BOTH Intel reports (Master + SuperContest) tonight for review, from Friday data. Saturday late night: refresh data + delta re-run (BEO props ~2 PM Sat, AN/BKR recapture, Saturday gate). Nothing published / sent to clients / Drive-archived / pushed to main without Andy's OK.

## Access + traps
- Repo only via `mcp__remote-devices__device_bash` at `$HOME/mnt/dev/projects/NFL_Dashboard`. Shell can't delete; rename new 0-byte `.git/**/*.lock` to `.git/stale-*`. git with `-c core.fsmonitor=false -c gc.auto=0`; stage explicit paths only.
- Python 3.12 venv: `$HOME/pyenv312/bin/python` (build.py needs it). Node: `NODE_USE_ENV_PROXY=1`.
- pull.mjs re-pull wipes browser splits — restore from `reports/engineering/week8-an-browser-pull-2026-10-31/raw.json`.
- Not ours to commit: `data/official-picks/*wagers*`, survivor, tracked-wagers/live-tracker, `scripts/build-player-availability.js`, `scripts/sync-live-market-lines.mjs` (other sessions — Pick 6 split-off session is live).

## Done (Friday run, `agents/dev/WEEKLY_INTEL_REPORT_RUN_PROMPT.md`)
- Step 0 gate: `reports/intel/gates/w08-final-gate-friday.md` GREEN (6 warnings, 33/37 experts; Wilson/Fitzmaurice/Madden/Feng excused).
- Step 2 sides: 13/13 COMPLETE — `reports/intel/games/2026-w08-game-*-sides.md` + `data/research-intel/proposed/games-w08/*-sides.json`, RUNLOG `reports/intel/games/2026-w08-game-RUNLOG.md`.
  - B: ARI@DAL U54.5 -108 · BAL@BUF O55 -101 · IND@JAX U46 -103 · NE@MIA U43.5 -111 · SC BAL +3.5 · SC CIN -10.5
  - C: ATL@TB U43.5 · CHI@SEA U46 · LAC@LAR U45 · PHI@WAS O40.5 · BAL +3 -105 · CHI +3 +103 · CLE +3.5 (-110 only) · LAC +6.5 · MIN +3 +102 · ARI ML +252 · KC ML -113 · PHI ML +216 · SC MIA +7, MIN +3.5
  - Pass: LV@NYJ all; KC@DEN spread/total. Friday-baseline MIN +3.5 (SRS adj -3.08, broke hard cap) is SUPERSEDED.
- Step 3 props: dispatched 13 background agents ~11:25 PM. Done at commit: ARI@DAL BAL@BUF CHI@SEA CLE@PIT IND@JAX LAC@LAR LV@NYJ MIN@DET NE@MIA PHI@WAS . The rest were still running and write to disk when they finish. Others were still running and write to disk on finish.
- Step 4 quant: `reports/intel/w08-model/fair_lines_synth.py` → `fair-lines-w08-synth.json` (BKR lines + synthesis adjustments; all within soft cap 2.0). Use this, not `fair-lines-w08.json`.
- Step 6 (started): SuperContest pitches agent → `reports/intel/supercontest-pitches-2026-w08.json`; expert narratives agent → `reports/intel/expert-narratives-2026-w08.md`. Check timestamps (> 2026-10-30 23:30 PT = new); if missing/stale, re-run per step 6.

## Next (fresh session), in order
1. `grep 'props | COMPLETE' reports/intel/games/2026-w08-game-RUNLOG.md` — re-dispatch any missing game (PASS=props, packet in `scratch/w08-game-synthesis-queue-props.json` `packets[]`, BKR boards only; BEO not posted). Same check for the two step-6 files.
2. Step 5: digest `scratch/w08-synthesis-digest-sat.md` + card `reports/bets/2026-w08-card.md` (`agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`), Pitch/Pushback → `reports/intel/master-pitches-2026-w08.json`, prop stacks (`PROP_STACK_AGENT.md`), 7e ATD 7-leg + 8a First-TD, parlay templates.
3. Step 6: rewrite `reports/intel/master-intel-narratives-2026-w08.md` (+ `## TICKETS`, `## SUPERCONTEST`).
4. Step 7: `$HOME/pyenv312/bin/python scripts/master-intel/build.py --week 8 --date 2026-10-31` then `check_sc_report.py`; client editions from the W7 format; PDF in cloud container.
5. Step 8: QA, ≤15-line summary to Andy, ask before publish/push.

## Open items
- Props notes from agents: BKR still lists Turpin (OUT); LV QB notes say Bailey OUT but official is Doubtful — fix `scratch/w08-qb-confirmations-1030.md`. Pickens / Bowers / Hall status-dependent.
- Saturday: BEO props rerun ~2 PM; AN + BKR recapture; Saturday gate (`final_gate_check.py --week 8 --stage saturday`, snapshot dist to `_friday` first).
- Antigravity: B image-card numbers + C (Cody Brown parlay) undelivered. DKP needs Andy's manual login.
- Kickoffs: DST ends Sunday — early games 10:00 AM PST, inactives ~8:30 AM PT.
