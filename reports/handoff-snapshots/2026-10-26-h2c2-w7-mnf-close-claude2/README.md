# H2C2 snapshot: Week 7 MNF close → Claude Team 2 (2026-10-26)

This folder backs `handoffs/2026-10-26-2215-claude-h2c2-claude2-briefing-w7-mnf-close.md`. It was built at HEAD `0493dfd` on
`claude/w5-prop-cards-2026-10-11`, before the handoff commit itself.

**Rules:** this is a point-in-time snapshot. Read it; don't build from it or edit it. Live copies stay at their original
paths, and `copies/` mirrors those paths. Live git and the live ledgers win over anything here.

| File | What |
|---|---|
| `handoff-chain-digest.md` | Subagent digest of the window's docs (5 Codex handoffs, the morning H2C2, the card, the Yahoo doc), with a Claude corrections header. The briefing wins over the digest. |
| `week7-ticket-ledger.md` | Generated from `user-placed-wagers-2026.json` and `paper-wagers-2026.json` plus the tracker's paper grades. All 39 real tickets, all 43 paper. |
| `commits.md` | Commits since 2026-10-26 (America/Los_Angeles) |
| `file-manifest.md` | Every path the docs reference, with its git state and snapshot action |
| `copies/` | 15 files a fresh clone would not have in this version (gitignored, untracked, or dirty vs HEAD) |

**Not copied, and why:**
- `logs/weekly-archive.log`: logs are excluded by design. Open it on Andy's PC.
- `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html` (4.4 MB each, generated, dirty vs HEAD
  because they were regenerated after the last commit). Rebuild with `node scripts/generate-live-tracker.mjs --week 7`.
- `.env`, `.nfl/yahoo/tokens.json`: credentials. Never copied.
- Missing on purpose:
  - `scripts/mcp/yahoo-fantasy-mcp.mjs` is a proposal and doesn't exist.
  - `reports/intel/games/2026-w07-game-AWAY_at_HOME-props.md` is a naming pattern, not a file.
  - `…CIN_at_BAL-pro` is a truncated token in the card.
- Dirty files belonging to other teams (`agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`, `docs/ANTI_PATTERNS.md`, four scripts, the
  reconciliation reports) are **copied for reading only**. Do not stage the live versions.

**Tool command used** (run on the device from the repo root; `--out` is set because the device VM clock is UTC):

```
python3 scripts/handoff/h2c2_snapshot.py --since 2026-10-26 --slug w7-mnf-close-claude2 \
  --out reports/handoff-snapshots/2026-10-26-h2c2-w7-mnf-close-claude2 \
  --docs 'handoffs/2026-10-26-*.md' HANDOFF.md reports/bets/2026-w07-card.md 'reports/analysis/week7-postmortem/*.md' \
         docs/YAHOO_FANTASY_API_ACCESS_FOR_CODEX.md docs/MOBILE_LIVE_TRACKER.md \
  --extra data/official-picks/user-placed-wagers-2026.json data/official-picks/paper-wagers-2026.json \
          data/generated/props/betonline-live-2026-10-26-week7.pregate.raw.txt data/fantasy/boxscores/espn-401873009.json \
          public/live-tracker-mobile-state.json public/hedge-alerts.json
```
The two tracker HTML copies were then moved out to `_to_delete/`.
