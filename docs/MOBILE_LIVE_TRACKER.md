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

## Hedge Watch (alerts)

`scripts/lib/hedge-alerts.mjs` runs inside the generator on **real** open tickets
and puts a gold **⚠️ Hedge Watch** card at the top of the phone tracker. Andy chose
the banner as the only delivery channel (no email/push) on 2026-10-25.

- **Hedge spot (last_game):** a ticket whose remaining legs are all in one game,
  paying at least 10x the stake and at least $100. Shows the chance it hits, the best
  opposite market, a full (equalizing) hedge and a half hedge.
- **Exposure gap (game_gap):** all side/total exposure riding on one game, scored
  over final-margin x total scenarios. Flags a gap when there's a 15%+ chance the game
  returns under 15% of its best case, shows the scenario grid (dead cells in red) and
  the market that covers the most of the shortfall. Per-ticket hedges that point the
  other way get a warning.
- **Prices:** ESPN's DraftKings pickcenter (pregame/closing). "est." means a model
  price for an alt line the feed doesn't quote (normal margin, sd 13.5, extra weight
  on 3 and 7; total sd 10; 4.5% vig). Props aren't modelled; single-prop spots assume
  -110 and say so.
- **State:** `public/hedge-alerts.json` (gitignored) keeps active alerts plus the ids
  already seen, so new ones print as `ALERT: ...` lines.
- **Replay check:** `node scripts/hedge-alerts-replay.mjs` rebuilds the W7 SNF spot
  and must PASS: flex hedge SEA -3, dead zone SEA 8+/Under, and a cover that wins at
  the 20-3 final. `--alerts-demo <file>` renders saved alerts into the page for previews.
- **Schedule:** before each kickoff window (Sun ~9:15/9:45, 12:15/12:45, 4:15/4:45
  PT; Mon/Thu 4:15/4:45 PT) and at halftime of island games (~6:45 PT). Scheduled runs
  use `--week auto` (the default).

## Gotchas

- `device_commit_files` caches by the *source* filename: re-sending the same
  container path delivers the old content. Copy to a new, unique source name each
  time (or commit to `.nfl/incoming/<name>.<hash>` and `cp` into place), then verify
  with `md5sum`.
- Player matching is by normalized display name (suffixes stripped). A prop
  that shows "not in box score" after the final usually means the player was
  inactive. Treat it as CHECK and confirm the book's void rule.
- Team abbreviations: WAS→WSH, LVR→LV, JAC→JAX (handled in `ABBR_FIX`).
- Never place bets; the tracker is read-only.
