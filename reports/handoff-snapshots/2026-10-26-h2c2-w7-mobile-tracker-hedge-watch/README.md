# H2C2 snapshot: W7 close-out, mobile Live Tracker, Hedge Watch (2026-10-26)

Supports `handoffs/2026-10-26-0745-claude-h2c2-codex-briefing-w7-mobile-tracker-hedge-watch.md` (Claude → Codex).
Built at HEAD `b98a243` on `claude/w5-prop-cards-2026-10-11`, before the handoff commit.

**Rules:** snapshot only. Read it; don't build from it or edit it. Live copies stay at their original paths, and `copies/` mirrors those paths.

| File | What |
|---|---|
| `week7-ticket-ledger.md` | Week 7 real tickets (31, net −$233.60) and paper tickets (35, decided paper P/L −$159.01), generated from the ledgers |
| `handoff-chain-digest.md` | Digest of the window's handoffs, with corrections |
| `commits.md` | Commits since 2026-10-25 (PT) |
| `file-manifest.md` | Every path the handoff docs reference, with git state |
| `copies/` | 17 files a fresh clone would lack (gitignored, untracked or dirty vs HEAD) |

**Notes on the copies:**
- Several of these are other teams' or overnight jobs' uncommitted work: the synthesis prompt, `docs/ANTI_PATTERNS.md`, four scripts, reconciliation output, and the desktop tracker HTML. They're copied for reference only; this handoff does **not** commit them.
- `data/official-picks/user-placed-wagers-2026.json` differs from HEAD only in number format (overnight reconcile writer: `-15.0` → `-15`).

**Not copied:** one "missing" manifest row (`data/survivor/player-availability/shadow-harness`) is shorthand in the 10/25 handoff for three folders, not a real path. No sensitive or credential files were referenced, and the secret scan is clean.

Tool command:
```
python3 scripts/handoff/h2c2_snapshot.py --since 2026-10-25 --slug w7-mobile-tracker-hedge-watch \
  --docs 'handoffs/2026-10-25-1415*.md' 'handoffs/2026-10-26-0745*.md' HANDOFF.md docs/MOBILE_LIVE_TRACKER.md \
  --extra data/official-picks/user-placed-wagers-2026.json data/official-picks/paper-wagers-2026.json \
          public/live-tracker-mobile-state.json public/hedge-alerts.json
```
