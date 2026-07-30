# NFL Dashboard Workstream Triage Handoff

**Date:** 2026-07-30 UTC / 2026-07-29 Pacific
**Branch:** main
**HEAD before this handoff:** `642349e`
**Status:** Crash recovery and safe workstream checkpoints committed. Podcast regeneration and overnight/ops automation remain dirty by design.

---

## Completed Checkpoints

The crash-recovered dirty work was split into narrow commits instead of staged as one broad sweep:

- `87476f0` - Document crash recovery source audit state.
- `0e64d66` - Add local source and article intel review tooling.
- `9273269` - Import July 29 primary futures odds.
- `642349e` - Refresh July 30 training camp intel snapshot.

No paid model calls, Supabase writes, official-pick approvals, production recommendation persistence, or open-parlay changes were made by Codex during this triage.

---

## Verification Performed

Service/readiness:
- `npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app`
- Result: `READY WITH WATCH ITEMS`, PASS 11 / WARN 6 / FAIL 0 / INFO 1.

Source audit:
- `npm.cmd run intel:source-audit`
- Result: `BLOCKED`; Current 2 / Review 16 / Stale 1 / Blocked 1 / Missing 0 / Context 7.
- Remaining blocker: DraftKings/FanDuel bet-slip parser implementation or verification.

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
- Latest snapshot equals timestamped `data/training-camp/2026/training-camp-intel-2026-07-30.json`.
- Latest snapshot: 16 items, 32 teams, 12 teams with intel, 3 high priority, intel-only.

---

## Intentionally Left Dirty

### Podcast / Deep-Dive Regeneration

Large generated surface remains unstaged:
- Existing `data/podcasts/m6-diarized-all/*.json` and `.md` changes.
- New July 21-23 podcast files.
- `data/podcasts/m6-diarized-all/manifest.json`.
- `docs/podcast-transcript-deep-dives/index.json` and `.html`.
- New selected July 22-23 deep-dive docs.

Basic structure passed:
- Podcast JSON files parse.
- `docs/podcast-transcript-deep-dives/index.json` reports 57 episodes.

Reason not committed:
- Sponsor/ad scan found sponsor language inside generated deep-dive output, including a Total Wireless/UFC sponsor line.
- This needs a focused filter/quality pass or explicit human acceptance before committing.

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

Start with the podcast/deep-dive regeneration. Either:

1. Fix the generator/filter so sponsor/ad beats do not enter deep-dive output, regenerate, and then commit the podcast surface; or
2. Decide that the existing generated output is acceptable as raw/review-only context and commit it with a clear caveat.

After that, review `scripts/overnight.js` separately because adding live feeds to overnight automation should be an explicit operational decision.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, handoffs\2026-07-30-0635-crash-recovery-source-audit-handoff.md, and handoffs\2026-07-30-0655-workstream-triage-handoff.md first. Crash recovery was committed in 87476f0; source/article intel tooling in 0e64d66; July 29 primary futures imports in 9273269; July 30 training-camp snapshot in 642349e. Verified service smoke is READY WITH WATCH ITEMS, PASS 11 / WARN 6 / FAIL 0 / INFO 1 using localhost:5174. Source audit is regenerated and blocked only by DraftKings/FanDuel parser implementation or verification. Targeted node checks, eslint, futures parser reproduction, and training-camp tests passed. Remaining dirty work is intentionally limited to podcast/deep-dive regeneration, overnight/ops automation docs, and older retry artifacts. Do not use git add -A. Guardrails: no paid model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval.
```
