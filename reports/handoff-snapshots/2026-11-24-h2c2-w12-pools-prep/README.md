# H2C2 snapshot: W12 pools prep (2026-11-24)

Supports `handoffs/2026-11-24-1400-claude-h2c2-team2-briefing-w12-pools-prep.md`. HEAD at build: `9a6700bf` (branch claude/w5-prop-cards-2026-10-11).

Rules: snapshot only. Read it; don't build from it or edit it. Live files stay at their original paths on Andy's machine (`E:\dev\projects\NFL_Dashboard`), and Team 2 works there.

| File | What |
|---|---|
| `file-manifest.md` | every path the briefing, HANDOFF.md and STATE.md reference, with its git state |
| `commits.md` | commits since 2026-11-24 (none before this handoff) |
| `copies/` | point-in-time copies of 25 uncommitted/dirty paths. **LOCAL ONLY, not committed.** They include Andy's private ledgers and trackers, which are still awaiting his commit OK (STATE.md list) |

Missing (expected): `data/pickem/leans-2026-w12.json` (Team 2 builds it), `scripts/pickem/captures-to-odds.py` (proposed). `reports/bets/season-recap/scripts/lib.py` doesn't exist; the half-sack grading lives in another season-recap script (grep `sack` under `reports/bets/season-recap/scripts/`). `scripts/crosscheck-adjudications.json}` is a brace-parse artifact of STATE.md (the real path is `reports/bets/season-recap/scripts/crosscheck-adjudications.json`).

Tool command:
`python3 scripts/handoff/h2c2_snapshot.py --since 2026-11-24 --slug w12-pools-prep --docs <briefing> HANDOFF.md STATE.md --extra <ledgers, W12 picks, W11 results> --skip <session files committed with the handoff>`
Secret scan of the snapshot: clean.
