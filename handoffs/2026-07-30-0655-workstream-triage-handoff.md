# NFL Dashboard Workstream Triage Handoff

**Date:** 2026-07-30 UTC / 2026-07-29 Pacific
**Branch:** main
**HEAD before this handoff:** `642349e`
**Recalibrated after this handoff:** source-freshness gate now targets frontier futures-portfolio synthesis readiness, not DK/FD bet-slip or weekly live-props plumbing.
**Status:** Crash recovery and safe workstream checkpoints committed. Current focus is source acceptance and evidence packaging for maximum-effort futures portfolio synthesis.

---

## Completed Checkpoints

The crash-recovered dirty work was split into narrow commits instead of staged as one broad sweep:

- `87476f0` - Document crash recovery source audit state.
- `0e64d66` - Add local source and article intel review tooling.
- `9273269` - Import July 29 primary futures odds.
- `642349e` - Refresh July 30 training camp intel snapshot.
- `96376e1` - Recalibrate futures synthesis source audit.
- `0cd942a` - Add futures synthesis source readiness checklist.
- `f6cee97` - Clean podcast deep-dive synthesis evidence.
- `817ec29` - Update futures synthesis handoff checkpoint.
- `5b2db46` - Add frontier futures synthesis evidence packet.
- `1c5cdee` - Document training camp source recovery.

No paid model calls, Supabase writes, official-pick approvals, production recommendation persistence, or open-parlay changes were made by Codex during this triage.

---

## Verification Performed

Service/readiness:
- `npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app`
- Result: `READY WITH WATCH ITEMS`, PASS 11 / WARN 6 / FAIL 0 / INFO 1.

Source audit:
- `npm.cmd run intel:source-audit`
- Last fully passing recalibrated result: `PASSABLE`; Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7.
- Current result after BetOnline normalization and recovery-action update: `BLOCKED`; Current 2 / Review 16 / Stale 1 / Blocked 0 / Missing 0 / Context 7.
- Latest artifacts:
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.html`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T08-39-21-827Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T08-39-21-827Z.html`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
  - `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md`
  - `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`
- Scope decision: DraftKings/FanDuel bet-slip parser implementation and weekly live-props source are not part of the current preseason futures synthesis freshness gate.
- BetOnline normalization:
  - `scripts/build-betonline-0729-import.js`
  - `data/futures-imports/betonline-2026-07-29.json`, 160 rows
  - `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md`
  - Verified with `npm.cmd run futures:betonline-0729`, `node scripts/build-betonline-0729-import.js --check-only`, and `node scripts/ingest-futures-json.js --file data/futures-imports/betonline-2026-07-29.json --dry-run`.
- Current caveat: the current worktree training-camp latest snapshot is an all-32 empty placeholder. A verified 16-item recovery copy is preserved at `data/training-camp/2026/recovered/training-camp-intel-2026-07-30-0346-verified.json`; restore it or approve a fresh live RSS scout before model synthesis.

Targeted syntax/lint:
- `node --check scripts/build-intel-source-audit-report.js`
- `node --check scripts/build-article-intel-review.js`
- `node --check scripts/parse-futures-text.js`
- `node --check agents/research-intel-ingest.js`
- `npx.cmd eslint scripts/build-intel-source-audit-report.js scripts/build-article-intel-review.js agents/research-intel-ingest.js scripts/parse-futures-text.js scripts/overnight.js`

Futures parser/import:
- Re-ran `scripts/parse-futures-text.js` for `docs/Futures_Odds/BetUS_ALL_0729` and `docs/Futures_Odds/BKR_Odds_0729`.
- Verified regenerated temp JSON matched committed `data/futures-imports/betus-2026-07-29.json` and `data/futures-imports/bookmaker-2026-07-29.json`.
- BetUS import: 416 rows, including 32 win totals, 32 playoffs, and 256 Super Bowl matchup rows.
- Bookmaker import: 128 rows across Super Bowl, conference, division, and win-total markets.

Training camp:
- `npm.cmd run test:training-camp-intel`
- `npm.cmd run test:training-camp-rss-scout`
- Current app-facing latest snapshot equals timestamped `data/training-camp/2026/training-camp-intel-2026-07-30.json`, but both are now empty placeholders in the dirty worktree.
- Recovered verified snapshot: `data/training-camp/2026/recovered/training-camp-intel-2026-07-30-0346-verified.json`, 16 items, 32 teams, 12 teams with intel, 3 high priority, intel-only.

---

## Intentionally Left Dirty

### Podcast / Deep-Dive Regeneration

Large generated surface was committed in `f6cee97`:
- Existing `data/podcasts/m6-diarized-all/*.json` and `.md` changes.
- New July 21-23 podcast files.
- `data/podcasts/m6-diarized-all/manifest.json`.
- `docs/podcast-transcript-deep-dives/index.json` and `.html`.
- New selected July 22-23 deep-dive docs.

Verification passed:
- `node --check scripts\build-podcast-transcript-deep-dives.js`.
- `node --check agents\lib\speaker-attribution.js`.
- `npm.cmd run podcast-deep-dives` regenerated 57 transcript deep dives.
- Podcast JSON files parse.
- `docs/podcast-transcript-deep-dives/index.json` reports 57 episodes.
- Hard promo/legal scan over generated deep dives returned no matches.
- Expanded hard promo/legal scan also covers Hard Rock break/promo phrasing and returned no matches; remaining sportsbook mentions are price/context references.

Commit guidance:
- The podcast/deep-dive workstream is now closed in git.
- Do not sweep in unrelated ops automation or retry artifacts.

### Overnight / Ops Automation

Dirty or untracked ops files remain unstaged:
- `scripts/overnight.js`
- `docs/NFL_DASHBOARD_USER_GUIDE.md`
- `infra/systemd/nfl-overnight.service`
- `infra/systemd/nfl-overnight.timer`

Reason not committed:
- `scripts/overnight.js` adds live training-camp RSS scouting to overnight automation, which changes the explicit-live-fetch boundary.
- The user guide has encoding artifacts and uses `npm` examples instead of Windows-safe `npm.cmd` in places.
- The systemd files bake in Linux user/path/time assumptions and need approval/review before they become repo truth.

### Retry Artifacts

Untracked older failed/retry artifacts remain in:
- `.nfl/readiness/`
- `.nfl/source-audit/`

Reason not removed:
- They are crash-window evidence. The latest successful readiness and source-audit artifacts were committed; older retries can be cleaned deliberately later.

---

## Recommended Next Step

Start with the remaining source-gate issue for the frontier-model futures portfolio synthesis:

1. Restore the recovered verified 16-item training-camp snapshot or approve a fresh live RSS scout.
2. Rerun `npm.cmd run intel:source-audit` and require 0 stale / 0 blocked / 0 missing sources.
3. Use `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the evidence packet.
4. Ask explicit approval before any paid/frontier model call.

Paid model calls still require explicit approval.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, docs\FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md, docs\TRAINING_CAMP_SOURCE_RECONCILIATION_2026-07-30.md, docs\FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md, docs\FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md, handoffs\2026-07-30-0635-crash-recovery-source-audit-handoff.md, and handoffs\2026-07-30-0655-workstream-triage-handoff.md first. Current focus is a maximum-effort frontier-model futures portfolio narrative and recommendation synthesis, not DK/FD bet-slip parsers or weekly live props. BetUS, Bookmaker/BKR, and BetOnline July 29 imports are current; BetOnline was manually normalized into data\futures-imports\betonline-2026-07-29.json with 160 rows and a manual review doc preserving playoff No-side prices. Current blocker: data\training-camp\2026\latest.json and data\training-camp\2026\training-camp-intel-2026-07-30.json are uncommitted all-32 empty placeholders, while the recovered verified July 30 snapshot at data\training-camp\2026\recovered\training-camp-intel-2026-07-30-0346-verified.json has 16 items across 12 teams. Next: restore the recovered training-camp snapshot or approve a fresh live RSS scout, rerun npm.cmd run intel:source-audit, then ask explicit approval for any paid/frontier model call. Guardrails: no paid model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval.
```
