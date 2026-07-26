# F-27 UI QC Pass — Findings (2026-07-26)

> Audit only, per F-27's own scope ("No code changes — produce a prioritised defect list first").
> No files were modified as part of this pass. Follow-up fix items are spun out below and filed
> individually on `TASK_BOARD.md` so each can be sized/prioritized independently.

## Method

Cross-checked `App.jsx`'s `VALID_TABS` against `Header.jsx`'s nav entries and the tab-render
block (no dead routes or orphaned nav items found — all 17 tabs are wired both ways). Then swept
`src/` for common defect signatures (empty click handlers, dead links, `TODO`/`FIXME`/`stub`/
`placeholder` markers, native `alert`/`confirm` usage) and read the flagged components in full to
confirm real behavior rather than judging from the grep line alone.

## Findings, prioritized

### P1 — Dashboard matchup cards show the wrong game time for every game

`src/components/dashboard/Dashboard.jsx`'s `enriched` memo (~line 46-54) fabricates
`commence_time: new Date().toISOString()` for every game, instead of using the real kickoff time
already present in `schedule.json` (`kickoff_utc`, e.g. `"2026-09-10T00:20:00.000Z"` for the
NE@SEA opener, or the pre-formatted `time` field, `"Wed 8:20 PM"`). `MatchupCard.jsx` line 308
then renders `formatGameTime(game.commence_time)` — so every card on the Dashboard tab displays
whatever moment the page happened to load, labeled "PT", instead of that game's actual scheduled
kickoff. This is user-facing and wrong on every single card, every time the page loads. Same memo
also injects `status: 'SCHEDULED'`, `home_score: 0`, `visitor_score: 0` — none of which are read
anywhere downstream (confirmed via grep across `src/components`), so they're dead weight riding
alongside the real bug.

**Fix:** set `commence_time: game.kickoff_utc` (or have `MatchupCard` read `game.kickoff_utc`
directly and drop the fabricated field); remove the three unused fields.

### P2 — Injury data has no live/fallback indicator, across three surfaces

`lib/injuries.js`'s `fetchTeamInjuries` silently falls back to `MOCK_INJURIES` (only 5 teams have
entries: SEA, NE, KC, BUF, SF) whenever ESPN's endpoints fail or return nothing — with only a
`console.log`, no user-facing signal. This feeds `MatchupCard`'s injury badges, the
`InjuryReportModal` deep-dive, and the new `InjuryCenter` league-wide tab (F-25) alike. During the
current offseason window, ESPN's injury feed for most teams is likely to legitimately be near-empty
this early — which is indistinguishable, from the UI, from the fallback silently kicking in or a
team just being healthy. `LiveOddsDashboard` already solves this exact problem for odds data with
an `isMock` flag and a visible "simulated data" banner (`LiveOddsDashboard.jsx` line ~162) — the
injury pipeline should get the same treatment.

**Fix:** have `fetchTeamInjuries`/`fetchAllInjuries` return a `source: 'live' | 'mock' | 'none'` tag
per team, and surface it (a small badge or banner) in `InjuryCenter` at minimum, ideally also in
`InjuryReportModal`.

### P2 — `PulseModal`'s "Critical Injuries" section is permanently dead

`src/components/modals/PulseModal.jsx` line ~138-146: a "Critical Injuries" panel that always
renders the hardcoded string `"No critical tags loaded from API."`, labeled in a code comment as a
placeholder for a future feature. That feature now exists — `lib/injuries.js` and the F-25 Injury
Center already compute exactly this (critical/high-impact injuries league-wide). This section has
never shown real data and never will until wired up.

**Fix:** either wire it to `getTeamImpactSummary`/filter for `impact === 'critical'` injuries across
the games shown in Pulse, or remove the section and link out to the Injuries tab instead.

### P3 — `ContestLinesModal`'s "Fetch Official Lines" button is a dead end

`src/components/modals/ContestLinesModal.jsx` line ~19-26: `handleLoadOfficial` spins for 800ms and
then always shows a plain `alert()` saying official lines "are not yet published via API. Please
input manually or Sync Live Odds." It has never done anything else and there's no plan noted to
wire it up. The manual-entry grid and "Sync Live Odds" button already cover the real workflow.

**Fix:** either remove the button (simplify — this matches F-27's own "features that can be
deprecated or simplified" criteria) or replace it with static copy explaining the two real options,
rather than a clickable control that always fails.

### P3 — Pervasive native `alert()`/`window.confirm()` usage (polish, not broken)

46 occurrences across 18 files (`App.jsx`, `useExperts.js`, `useSchedule.js`, most bet/pick modals,
`PicksTracker.jsx`, `DevLab.jsx`, the three agent chat tabs). None of these are broken, but blocking
browser dialogs are a dated, clunky pattern next to the rest of the app's in-app toast/modal
conventions (e.g. `OfficialPicksTab`'s toast, `PodcastDigestTab`'s import-success banner). Lowest
priority here — cosmetic/consistency, not a defect — but flagged since F-27 explicitly asks about
"clunky workflows."

### Already tracked, cross-referenced (no new action needed)

- `BetImportModal.jsx`: "DraftKings: Coming soon" / "FanDuel: Coming soon" static labels — this is
  BET-1, already on the backlog.
- `lib/propsTools.js`: stubbed player-prop lines pending a paid odds tier — this is PROPS-1,
  already on the backlog.
- `BookAnalytics.jsx`'s "Beat-the-close analysis" note — already honestly labeled as
  "coming once closing-line data is collected," not misleading, no action needed.

### Minor / cosmetic

- `MyCardModal.jsx` is rendered as a permanent tab body (`activeTab === 'mycard'`) rather than a
  dismissible modal, despite its name and file location under `components/modals/`. Not
  user-facing, but worth a rename/relocation next time that file is touched for something else —
  not worth a dedicated task on its own.

## Not found

No dead routes (`VALID_TABS`/`Header.jsx` NavTab list/`App.jsx` render block all agree across all
17 tabs), no empty/no-op click handlers, no broken `href="#"` links.
