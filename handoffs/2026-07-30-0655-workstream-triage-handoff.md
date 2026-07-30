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

No paid model calls, Supabase writes, official-pick approvals, production recommendation persistence, or open-parlay changes were made by Codex during this triage.

---

## Verification Performed

Service/readiness:
- `npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app`
- Result: `READY WITH WATCH ITEMS`, PASS 11 / WARN 6 / FAIL 0 / INFO 1.

Source audit:
- `npm.cmd run intel:source-audit`
- Recalibrated result: `PASSABLE`; Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7.
- Latest artifacts:
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.html`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
  - `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md`
- Scope decision: DraftKings/FanDuel bet-slip parser implementation and weekly live-props source are not part of the current preseason futures synthesis freshness gate.
- Caveat: BetOnline has current July 29 screenshots, but stale structured BetOnline rows must not be used as source of truth unless normalized or manually reviewed.

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

Verification passed:
- `node --check scripts\build-podcast-transcript-deep-dives.js`.
- `node --check agents\lib\speaker-attribution.js`.
- `npm.cmd run podcast-deep-dives` regenerated 57 transcript deep dives.
- Podcast JSON files parse.
- `docs/podcast-transcript-deep-dives/index.json` reports 57 episodes.
- Hard promo/legal scan over generated deep dives returned no matches.
- Expanded hard promo/legal scan also covers Hard Rock break/promo phrasing and returned no matches; remaining sportsbook mentions are price/context references.

Commit guidance:
- Stage this only with the focused source-readiness package.
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

Start with source acceptance for the frontier-model futures portfolio synthesis:

1. Use `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md` as the accepted-source matrix.
2. Normalize or manually review the current July 29 BetOnline screenshots before treating BetOnline as a placeable-price source of truth.
3. Package the accepted evidence for the frontier-model narrative analysis and recommendation run.

Paid model calls still require explicit approval.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, handoffs\2026-07-30-0635-crash-recovery-source-audit-handoff.md, and handoffs\2026-07-30-0655-workstream-triage-handoff.md first. Current focus is verifying current intel sources for a maximum-effort frontier-model futures portfolio synthesis, not DK/FD bet-slip parsers or weekly live props. Crash recovery was committed in 87476f0; source/article intel tooling in 0e64d66; July 29 primary futures imports in 9273269; July 30 training-camp snapshot in 642349e; post-recovery triage in d58f8e3; source-audit recalibration in 96376e1; source-readiness checklist in 0cd942a. Latest source audit is PASSABLE, Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7. Latest source-audit artifacts are .nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json and docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html. Podcast/deep-dive output was regenerated after expanded ad/legal filtering; the expanded hard promo/legal scan is clean and remaining sportsbook mentions are price/context references. BetOnline has current July 29 screenshots; stale structured BetOnline rows must not be used as source of truth unless normalized or manually reviewed. Next: normalize/review BetOnline screenshots if exact BetOnline prices are needed, then prepare the accepted-source evidence packet for the frontier-model futures portfolio narrative and recommendations. Guardrails: no paid model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval.
```
