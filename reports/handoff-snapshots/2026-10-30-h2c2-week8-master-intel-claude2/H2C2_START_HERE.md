# H2C2 Start Here — Week 8 Master Intel, SuperContest, weekend ops (Fri Oct 30, 2026, ~6:15 PM PT)

## Start in this order

1. Run `git -c core.fsmonitor=false status -sb`, `git branch --show-current`, `git log -5 --oneline`. Expected: `claude/w5-prop-cards-2026-10-11`, ahead of origin (not pushed), HEAD = the commit containing this file on top of `8c0734d`. Live Git beats this packet.
2. Read the guardrails and pick one lane.
3. Load only that lane's section of the detailed briefing (`handoffs/2026-10-30-1815-claude-h2c2-week8-master-intel-claude2.md`) and the artifacts named below.

## Guardrails

- No wager, account action, Supabase write, paid API/model call, publication (artifact, Drive, client send) or git push without Andy's per-action OK. H2C2 authorizes none of these.
- Preserve the dirty tree (scheduled outputs, Codex repairs, regenerated expert dossiers). Stage by explicit path; never `git add -A`, reset, clean or stash. The device shell can't delete: rename new 0-byte `.git/**/*.lock` files to `.git/stale-*` after each git command; avoid `git fetch` there.
- Strict roster gate before any player-named output (build.py runs it). Builds: `export PATH=$HOME/pyenv312/bin:$PATH NODE_USE_ENV_PROXY=1`.

## Active lanes

| Lane | Next action | Read now | Load only if needed |
|---|---|---|---|
| A. Master Intel | Saturday: BKR capture (needs Claude in Chrome), refresh splits/weather, rewrite changed narratives, rebuild + PDF + QA | Briefing §1–2; `docs/MASTER_INTEL_REPORT_RUNBOOK.md`; `reports/intel/master-intel-narratives-2026-w08.md`; `scratch/w08-synthesis-digest-sat.md`; `reports/bets/2026-w08-card.md` | `docs/MASTER_INTEL_REPORT_FORMAT.md`; `reports/intel/w08-model/`; snapshot master json/pdf |
| B. SuperContest | When Andy sends the locked five: write `data/supercontest/locked-card-week-8.json`, rebuild, gate PASS | Briefing §3; `reports/intel/supercontest-pitches-2026-w08.json`; `data/supercontest/standings-week-08-2026-10-29.md` | `scratch/w08_write_pitches.py`; `agents/dev/PITCH_PUSHBACK_AGENT.md`; snapshot SC json/pdf |
| C. Weekend ops | Fantasy RFI actions, pool entries after inactives, parlay/hedge watch, FDP reminders, DK defensive rerun | Briefing §4 (incl. **corrections** to the Toolbox report); `logs/cadence-reports/2026-w08-friday.md`; `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md` | `reports/bets/2026-w08-fdp-promo-plan.md`; `handoffs/2026-10-30-1530-claude-week8-fdp-promo-master-intel-next.md` |
| D. Data gaps | DKP cron re-login, BKR/BEO props, YouTube (paid → OK), slate confirmation | Briefing §5 | `reports/engineering/week8-an-browser-pull-2026-10-30/raw.json`; `data/research-intel/review/2026-w08-weather-venue.json` |

## Stop conditions and escalation

- Roster gate BLOCK → fix names in the source file; never `--allow-roster-issues` without Andy.
- SuperContest gate FAIL → do not send the SC report.
- Any request for a wager, Supabase write, paid run, push or publication → ask Andy first.
- A QB change or a line move of 1.5+ points on MIN@DET → re-evaluate the only recommendation before Sunday.

## Packet map

- Detailed briefing: `handoffs/2026-10-30-1815-claude-h2c2-week8-master-intel-claude2.md` — lane detail, environment, corrections.
- Snapshot README / manifest: `reports/handoff-snapshots/2026-10-30-h2c2-week8-master-intel-claude2/README.md`, `reports/handoff-snapshots/2026-10-30-h2c2-week8-master-intel-claude2/file-manifest.md` — copies of gitignored artifacts and provenance.
- Older handoffs (`handoffs/2026-10-30-1555-…`, `-1530-…`, `-1325-…`): history only, for contradictions or recovery.

## Resume prompt

```
Resume Platinum Rose NFL as Claude team 2. Read reports/handoff-snapshots/2026-10-30-h2c2-week8-master-intel-claude2/H2C2_START_HERE.md, run the Git checks, pick one lane (A Master Intel Saturday refresh, B SuperContest lock + gate, C weekend ops, D data gaps), and load only that lane's briefing section.
```
