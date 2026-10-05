# H2C2 snapshot: Week 4, Fri 10/02 → Mon 10/05/2026

This is the support folder for the cross-team briefing **`handoffs/2026-10-05-1300-claude-h2c2-team2-briefing-week4-fri-mon.md`**. Read that briefing first.

Built Mon 10/05 ~13:10 PT. Repo HEAD at the time: `6887ca8`.

## Rules for this folder

- Everything here is a **point-in-time snapshot**. Read from it, but don't build from it and don't edit it.
- The live working copies stay at their original paths and keep being regenerated.
- Files under `copies/` keep their original relative path. For example, `copies/data/generated/master-intel/w04-pull.json` is a copy of `data/generated/master-intel/w04-pull.json`.

## Contents

| File | What it is |
|---|---|
| `handoff-chain-digest.md` | A digest of all 26 handoffs in the window: timeline, workstreams, Andy's decisions, open items, every path, guardrails, and 25 contradictions. Its header lists the corrections the briefing applies. |
| `week4-ticket-ledger.md` | Every Week 4 ticket (24 real, 11 paper) with stake, odds, result and P/L, generated from the wagers ledger. |
| `commits.md` | The 64 commits in the window, oldest first, in PT. |
| `file-manifest.md` | All 239 repo paths referenced by the handoff chain. For each it shows whether the path exists, its git state (committed, gitignored, untracked, or dirty vs HEAD) and what the snapshot did with it. |
| `copies/` | 35 files and folders (about 33 MB) that a fresh clone would not have, or not at this version. Main items: the wagers ledger, the Week 4 master packet and site (`dist/nfl_week4_master_packet/`), the master-intel pull and verified-expert files, the BKR/BEO parsed boards, Action Network history, and other agents' uncommitted Week 4 intel files. |

## What is not copied, and why

- **`data/generated/props/` as a whole** (30 MB, 94 files) is too large. The individual files the handoffs reference are copied, and everything else can be regenerated from the boards in `docs/Player_Prop_Odds_Weekly/Week4/` with `scripts/props/*`.
- **Secrets and logs** (`config/youtube-oauth-client.json`, `logs/*.log`) are never copied. Open them on Andy's machine if you need them.
- **Paths marked "missing" in the manifest** are expected. They fall into three groups:
  - Never built: `data/nfl-rosters/coaching-staff-2026.json`, `data/podcasts/youtube-extracted-picks-2026-w04.json`.
  - Superseded: `bookmaker-live-2026-10-03-week4.raw.txt`.
  - Path shorthand in the source docs.
- **The claude.ai DEV-project docs** (`claude/…`) are not copied here.
  - The repo mirror `docs/claude-project-dev/recommendation-ledger-2026.md` (updated 9/28 20:40 PT) is **newer** than the project copy (9/28 19:15). Neither has Week 4 yet.
  - The project's `claude/nfl-dashboard-handoff-2026-10-05.md` is the same text as `handoffs/2026-10-05-1235-…`.

## How it was built

```
python3 scripts/handoff/h2c2_snapshot.py --since 2026-10-02 --slug week4-fri-mon \
  --docs 'handoffs/2026-10-0[2-5]-*.md' HANDOFF.md 'reports/bets/2026-w04-*.md' \
  --extra data/official-picks/user-placed-wagers-2026.json data/official-picks/paper-wagers-2026.json data/generated/props/beo-w04.json \
  --skip scripts/handoff/h2c2_snapshot.py
```

The tool is read-only toward git. It is safe to re-run; a re-run refreshes `copies/` in place.
