# Handoff — Week 2 Sunday: 7 tickets placed, prop tooling repo-homed, tracker clobber fixed

**Date:** 2026-09-20T14:40:00-07:00
**Branch:** `wip/yahoo-sync` (superset — see Git below)
**Session:** Cowork (device_bash → `$HOME/mnt/dev/projects/NFL_Dashboard`)
**Supabase:** `aambmuzfcojxqvbzhngp`

> **Note on where docs live.** The previous version of this handoff was written only to the
> claude.ai **DEV Project knowledge base** (paths like `claude/handoff-...md`). Those are NOT repo
> files and are invisible to any session without that Project attached. The next team could not find
> them. Everything needed is now in the repo. Repo copies are authoritative:
> - this file
> - `docs/recommendation-ledger-2026.md`
> - `docs/plan-live-leg-availability-week3.md`

---

## 0. FIX THIS FIRST — one Supabase row is missing

**`bet_20260920_beo_atd6_1300` is in the local wagers JSON and on the live tracker but was never
inserted into Supabase.** The insert was prepared, Andy moved to the next build, and it was never
approved or re-raised.

- Local JSON: **19** Week 2 pending. Supabase: **18**.
- Supabase understates by **$5.00 risk / $615.00 potential**.
- True Week 2 exposure: **$295.06 risk → $9,566.37 potential**.

Ticket: BetOnline, $5.00 at **+12300**, returns $620.00, placed 13:00 PT, ticket_number NULL.
Legs (all anytime TD): Croskey-Merritt +100 · Jonathan Taylor -167 · De'Von Achane +129 ·
Jadarian Price +150 · Rashee Rice +140 · Trey McBride +179.

**Supabase writes require Andy's per-change OK. Ask before inserting.** Match the column shape of the
other `user_bankroll_bets` rows (see any row inserted today).

---

## 1. GIT STATE

```
* 27bf77a (HEAD -> wip/yahoo-sync)  wip(yahoo): in-progress sync changes + week reconciliation guard
* 215f1a3 (feat/prop-availability-tooling)  chore(odds): Week 2 prop boards, BKR lines, props card
* 9cef1a7  feat(props): repo-homed prop tooling with live leg availability
* 8cec54a  feat(tracker): prop parlays first, legs ranked by live status
* 73bfb2d (origin/main, main)  feat(live-tracker): paper tickets
```

`wip/yahoo-sync` was branched from `feat/prop-availability-tooling`, so **it contains everything**.
Work there. Nothing is pushed.

`feat/prop-availability-tooling` → `main` is a clean merge carrying no WIP, if that's wanted.

**~250 other files are modified in the working tree.** They are Andy's, predate this session, and
were not touched. **Never `git add -A`.** Stage exact paths only.

`27bf77a` mixes Andy's ~279 lines of in-progress Yahoo work with a ~70-line fix from this session —
they could not be separated (2 of 4 hunks wouldn't apply to HEAD), so Andy committed the file whole,
deliberately.

---

## 2. TICKETS PLACED THIS SESSION (all logged, synced, on tracker)

| Placed PT | id suffix | Price | Risk → Win | Supabase |
|---|---|---|---|---|
| 12:07 | `739047494_bm_supercontest_5team` | +2100 | $25 → $525 | yes |
| 12:15 | `beo_afternoon8_props_1215` | +11100 | $5 → $555 | yes |
| 12:50 | `beo_afternoon6_props_1250` | +4300 | $5 → $215 | yes |
| 13:00 | `beo_atd6_1300` | +12300 | $5 → $615 | **NO — see §0** |
| 13:20 | `beo_afternoon8_mixed_1320` | +8400 | $5.95 → $499.80 | yes |

### SuperContest change — important
Andy's picks were never entered into the actual SuperContest. **`739047494` is the new OFFICIAL card**
(LAC -6.5 -117, WAS +4 -110, MIA +14 -130, LAR -6.5 -118, DEN -2.5 -111). The old card `739003807`
was **demoted** — retitled *"Week 2 Five-Team Parlay (former SuperContest card, not entered)"* with
notes updated. It is still a live cash parlay; only the label changed.

### Unresolved loose end
The two SuperContest **fade** tickets — `739003867` (RR, $15) and `739003866` (parlay, $5) — were
built to fade the OLD card (GB, DEN, PHI, LAR, WAS). The official card is now LAC/WAS/MIA/LAR/DEN.
They still hedge `739003807`, so they are not orphaned, but their `progress_notes` claim they fade
the contest card and no longer do. **Andy was asked whether to reword and did not answer.**

### NULL ticket_numbers (9) — Andy fills from his BEO history
`superbowl_buf_future`, `bkr_11team_ml_parlay`, `hybrid8_props_0345`, `atd8_0355`, `mixed8_0410`,
`afternoon8_props_1215`, `afternoon6_props_1250`, `atd6_1300`, `afternoon8_mixed_1320`

---

## 3. RECOMMENDATION LEDGER — `docs/recommendation-ledger-2026.md`

Andy **explicitly asked** for a standing record of Claude's proposals vs. what he actually placed, so
he can grade his own divergences over time. **Keep it current.** Log agreements too — a ledger that
only records disagreements reads as adversarial and teaches nothing.

12 divergences logged today (D1–D12), all verdicts **PENDING**. Grading rule:

- **HURT** — every Claude leg hit; an added/kept/swapped leg missed
- **IRRELEVANT** — a shared leg missed; both tickets lose
- **HELPED** — everything hit; the placed ticket paid more

**D4 grades most cleanly:** ticket `afternoon6_1250` differs from Claude's proposal by exactly one
leg (Claude: Njoku 3+ rec -127; Andy: Nailor 3+ rec -152). Compare their actual reception counts.

---

## 4. TOOLING — `scripts/props/` (new this session)

Previously lived in `~/pp/` on the device VM, which wipes between sessions — all four scripts had to
be rebuilt from scratch mid-Sunday under a clock. Now version-controlled. Full docs:
`scripts/props/README.md`.

```bash
python3 scripts/props/beo.py   docs/Player_Prop_Odds_Weekly/Week2 data/generated/props/beo.json
python3 scripts/props/parse.py docs/Player_Prop_Odds_Weekly/Week2 data/generated/props/props.json
python3 scripts/props/mkw1.py  data/fantasy/boxscores data/generated/props/w1.json
node   scripts/props/availability.mjs --week 2
python3 scripts/props/c.py --book beo --game MIA_SF --market rec_yds --max-juice -150 --w1 --avail
```

Parsed output is **gitignored** (`data/generated/props/`, `data/generated/prop-availability.json`) —
regenerate from the committed boards. Already present on Andy's disk; only re-run when boards change.

### `availability.mjs` — read this before building any card

Fixes a real failure from today. Claude was excluding any player appearing on a non-`SETTLED` ticket
— but **a parlay dies the instant one leg LOSES, while the book leaves it `PENDING` until
settlement.** That locked **12 afternoon/evening players behind morning legs that had already
busted**: hybrid8 held Caleb Douglas / Antonio Williams / Kelce / Jeanty / Bourne; atd8 held JSN /
McBride / Lamb / K. Walker; mixed8 held CMC / Dak.

The rule now: **a player is SPOKEN FOR only if he has a PENDING leg on a ticket that can still win.**

- Round robins survive partial losses — an N-selection K-team RR dies only when `losses > N - K`
  (verified: a 5-selection 2-team RR survives 3 losses, dies on the 4th)
- A leg that already **WON** frees its player too — that value is banked
- Tiers: `FREE` / `~SOFT` (live in a different market) / `!HARD` (same market+line = true duplicate)
- Sides/totals use the same logic keyed on team+market. It surfaces `KC|moneyline x3` — precisely
  what triggered BEO's "Limit exceeded" when Andy tried to add a fourth copy

Verified by simulation: marking hybrid8's Coker leg LOST released 6 players immediately.

**Do not hand-maintain a blocklist.** That is what went wrong; the tool derives it.

### Open dependency — nothing refreshes leg statuses mid-Sunday
`scripts/reconcile-settlement.mjs` already grades legs off ESPN and writes back to the wagers JSON,
but it is built for post-game, and **neither shell could reach ESPN today** (cloud container refused
by the egress proxy; device VM has no network at all). Recommended fix: have the live tracker export
its leg states — it already computes them in the browser every Sunday. Detail:
`docs/plan-live-leg-availability-week3.md`.

---

## 5. BUGS FOUND AND FIXED

**`beo.py` — unrecognised section headers (data-corrupting).** BEO emits 13 player-market section
headers. Unknown ones were invisible to the parser, so their rows silently continued the **previous**
market. That is how "Pass Attempts 32+" surfaced as a passing-TD line, and how `receptions (Exact)`
bled into the receptions ladder. All 13 are now enumerated and unknown headers hard-stop. Row count
6,524 → 7,629. **If the parser is ever rewritten, keep the hard-stop.**

**`beo.py` — board revisions.** A re-pulled board arrives as `<name>_v2` beside the original and used
to double-count. Only the highest revision per game is parsed now.

**`scripts/generate-live-tracker.mjs`** — prop parlays now sort first in every grid; legs re-rank at
runtime (live → upcoming → final) instead of leaving finished legs pinned to the top; saved
drag-order is versioned so a new default ordering actually reaches the board once.

**`scripts/sync-yahoo-fantasy.mjs` — the one that cost the afternoon.** `resolveCurrentWeek` probed
only `userTeams[0]`. That single request failed, it fell back to week 1, and passed week 1 into
`generateLiveTracker({ week })` — **overwriting the Week 2 board with a Week 1 one at 13:52 PT,
wiping all live tickets, cheat sheets and fantasy rosters.** All five leagues had reported
`current_week: 2`; the saved payload said `week: 1` while every league inside it said 2.

Fixed inside `27bf77a`: probe every league; reconcile against the leagues' modal `current_week`
before writing; **refuse to rebuild the tracker on a guessed week**. Verified live — the same script
then logged `Using NFL week 2 (auto-detected)` and rebuilt correctly.

---

## 6. STANDING RULES

**Betting (Andy's, established over this weekend):**
- BKR (Bookmaker.eu) props = **same-game parlays only**. Multi-game → BEO (BetOnline).
- **No leg juiced past -150.** Andy overrode this himself five times today (CMC -251, Taylor -167,
  Nailor -152, Antonio Williams -244, Evans -157). **Flag every time — never silently allow.**
- **No QB rushing props. No INT props.** Andy placed Malik Willis 1+ INT anyway (D8). Still flag.
- One leg per game where possible.
- **Prop tickets must be independent of the sides/totals parlays** — pick on player usage and Week 1
  margin, never to stack or hedge those tickets.
- Tackles/sacks are BEO-only and went 3/3 in Week 1.

**Process:**
- **Supabase writes need Andy's per-change OK.** Reads are fine.
- **No paid synthesis** (`agents/portfolio-synthesize.js`) without explicit per-run approval.
- Conventional commits; **stage exact paths only**, never whole files carrying Andy's other
  uncommitted work.
- Clear stale `.git/*.lock` and `tmp_obj_*` after git commands.
- **Never enter credentials in the app's sign-in page.**
- Note: the blanket "no commit/push without approval" guardrail was **repealed 2026-09-15** (see top
  of `HANDOFF.md`). Scoped-staging discipline still applies.

**Logging flow per placed ticket:**
1. Append to `data/official-picks/user-placed-wagers-2026.json` (match existing schema exactly)
2. `node scripts/sync-placed-wagers-to-bankroll.mjs`
3. `node scripts/generate-live-tracker.mjs --week 2`
4. Supabase `user_bankroll_bets` insert via MCP **with Andy's OK**
5. Update `docs/recommendation-ledger-2026.md`

---

## 7. ENVIRONMENT GOTCHAS (each cost time today)

- **The device shell reports UTC.** Early in the session board timestamps were misread as PT and Andy
  was told his boards were 90 minutes old when they were 8.5 hours old. **Always
  `TZ=America/Los_Angeles`.**
- **Neither shell can reach ESPN.** Cloud container: refused by the egress proxy. Device VM: no
  network. `sync-placed-wagers-to-bankroll.mjs` always logs a Supabase fetch failure from the device
  — expected; do the write via MCP.
- **WebSearch / WebFetch work** from the cloud container and are how inactives were sourced. Many
  injury pages are JS-rendered and return nothing; CBS, NFL.com and DK Network worked.
- **Deletes are disabled in connected folders by default.** Git leaves `.git/index.lock` behind and
  cannot remove it, which blocks every later git write.
  `device_request_delete_permission` was granted for `E:\dev` **for that session only** — it must be
  requested again.
- **Committing a file then switching branches reverts the working copy** to the target branch's
  version. Bit us once — the Yahoo fix vanished from the tree until Andy switched back.
- **`~/pp/` is no longer the source of truth.** Use `scripts/props/`.
- **Do not repo-wide grep this tree** — it is huge (`.venv`, scratch piles) and times out. Use exact
  paths.

---

## 8. MARKET INTELLIGENCE FROM TODAY

**BEO's correlation trim starts above ~2 legs per game.** Four tickets with up to three *doubled*
games were all rounded **up** against the raw leg multiply (+10682→+11100, +4234→+4300,
+12158→+12300, +2934→+3000). The one carrying **five legs in MIA@SF** was cut **15.4%**
(+9942→+8400). Treat 3+ legs in one game as where price starts getting taken back. Retest before
assuming it generalises.

**Pull boards fresh Sunday morning.** The overnight boards were 8.5h stale; the 11:35 `_v2` re-pull
is what confirmed Bowers and Tua were off the board entirely.

**A player vanishing from a board is an inactive signal** — Bowers and Tua were gone before the wires
confirmed them.

**Week 2 slate facts still relevant:** Pittman OUT (IND); Keenan Allen went 6-of-6 in Week 1 and is
already on `afternoon8_1215`; Nacua was questionable/GTD for MNF.

---

## 9. OPEN ITEMS, PRIORITISED

1. **Insert the missing `atd6_1300` Supabase row** (§0) — needs Andy's OK.
2. **SNF IND@KC card** — kicked 17:20 PT 2026-09-20. 8 legs live in that game across 7 tickets, but
   no same-game card was ever built. BKR = SGP only, so it needs a fresh `BKR_Week2_KC_IND` board
   pull from Andy (the one on disk is 02:36 AM).
3. **MNF NYG@LAR** — Mon 2026-09-21 17:15 PT. Nacua's status should be known. **No BEO board exists
   for this game** — BKR only, and it is ladders-only. Needs a pull from Andy.
4. **Grade the ledger** once results land; fill in the PENDING verdicts.
5. **Fill the 9 NULL ticket numbers** from Andy's BEO history.
6. **Reword or leave the SuperContest fade tickets** (§2) — Andy's call, unanswered.
7. **Mid-day grading refresh** before Week 3 (§4) — the availability engine depends on it.
8. **Merge decision** — `feat/prop-availability-tooling` → `main` is clean and carries no WIP.
