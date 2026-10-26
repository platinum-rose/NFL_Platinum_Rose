# Mobile Live Tracker (Platinum Rose Road Tracker)

Phone edition of the Live Tracker. Andy opens it from his Android home screen
while away from the desk. It shows **open real tickets** plus a separate **📝 Imaginary** section for the
Platinum AI paper card (SuperContest stays on desktop), styled like the desktop tracker.

- **Private link (claude.ai artifact):** https://claude.ai/artifact/Q7NBq3G5MLgzVzraUPsuiy
  Keep republishing to this same URL every week so the home-screen shortcut keeps working.
- **Generator:** `scripts/generate-live-tracker-mobile.mjs`
- **Output:** `public/live-tracker-mobile.html` (committed) and
  `public/live-tracker-mobile-state.json` (per-leg grades, gitignored)
- **Settler:** `scripts/settle_from_mobile_state.py` (dry run unless `--apply`)

## Why it is baked, not live

Artifact pages run in a sandbox that blocks fetches to ESPN. The generator
grades every leg against ESPN at build time (scoreboard plus box score for
weeks N-1 and N), and the page shows "Graded h:mm · X min ago", which turns
amber after 45 min. Republishing to the same URL updates any open copy of the
page automatically. Game chips link to ESPN gamecasts for live scores between
refreshes.

## Refresh loop (each check-in)

From the repo root (device bash with Linux node, or Windows node):

```bash
node scripts/generate-live-tracker-mobile.mjs --week N
python3 scripts/settle_from_mobile_state.py            # dry run: review
python3 scripts/settle_from_mobile_state.py --apply    # only if the dry run looks right
node scripts/generate-live-tracker-mobile.mjs --week N # re-run after settling
node scripts/generate-live-tracker.mjs --week N        # keep the desktop tracker in sync
```

Then stage `public/live-tracker-mobile.html` into the session, copy it to the
scratchpad, and publish it with the Artifact tool **to the same file path or the
URL above** (from a new conversation, pass `url`). Commit named files only:
the wagers JSON, both tracker HTMLs, and any script changes.

Suggested cadence on Sundays (PT): after the 10 AM games end (~1:30), mid-afternoon,
after the 1 PM games end (~4:40), SNF midgame, SNF final, MNF final. Schedule
these as session check-ins.

## What it grades

Spread, moneyline, total, and the SGP variants of each; player props
(receptions, receiving/rushing/passing yards, carries, completions, pass TDs,
INTs, tackles+assists, sacks, FGs made, kicking points, anytime TD and 2+ TD);
round robins (per-combo, using `round_robin.combinations[].teams`). Over
props lock as hits the moment the number is cleared.

Paper (imaginary) AI-card tickets from `paper-wagers-2026.json` appear in their
own 📝 section, graded the same way and never counted in cash totals. Also
graded: first TD, total FGs both teams, team TDs, sacks taken, longest
reception, kicker points.

Any other market shows as **CHECK**. Grade those by hand in the wagers JSON;
the settler skips any ticket with a CHECK leg, any cashed parlay with a
push/void leg (reduced payout needs per-leg prices), and any round robin with
combos still in play.

## Gotchas

- `device_commit_files` overwrites of existing repo files can lag or not land.
  Verify with `md5sum`, or write the file through device bash.
- Player matching is by normalized display name (suffixes stripped). A prop
  that shows "not in box score" after the final usually means the player was
  inactive. Treat it as CHECK and confirm the book's void rule.
- Team abbreviations: WAS→WSH, LVR→LV, JAC→JAX (handled in `ABBR_FIX`).
- Never place bets; the tracker is read-only.
