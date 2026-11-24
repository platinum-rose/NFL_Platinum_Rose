# H2C2 cross-team briefing: W12 pools + island prep → Claude Team 2

H2C2 = "Handoff 2 Claude 2". Written Tue 2026-11-24 ~2:00 PM PT by Claude Team 1, for Claude Team 2 (analyst lane: W12 pools, island stacks, Sunday card). Window: one Team 1 session, Tue 11/24 12:00–2:00 PM PT. HEAD at writing `9a6700bf` on `claude/w5-prop-cards-2026-10-11` (pushed); the commit with this briefing is the new checkpoint. It replaces nothing. `STATE.md` is still the single state file, and this briefing adds the why and the how.
> Everything here is on Andy's machine (`E:\dev\projects\NFL_Dashboard` = `$HOME/mnt/dev/projects/NFL_Dashboard` in device_bash). Uncommitted files are copied to `reports/handoff-snapshots/2026-11-24-h2c2-w12-pools-prep/copies/`.

**Why the handoff:** Andy's account is running out of weekly tokens. Team 2 takes over W12 prep and card generation. **Run lean (§2), or Team 2 burns out too.**

## 0. TL;DR (time-sensitive first)
1. **Wed 11/25 5:00 PM PT, GB@LAR kicks off and locks its slot in all 3 pools.** Before ~3:45 PM PT (inactives: Josh Jacobs, Kyren Williams) give Andy a final pick for GB@LAR and the full 16-game confidence ranking. GB@LAR's slot is spent at lock, so the ranking has to be settled first. The prelim market-only card is `reports/pickem/2026-w12-pickem.md`.
2. **Tiebreakers are already SUBMITTED by Andy** (recorded in `data/pickem/picks-2026-w12.json`; the pool is assumed to be the Duma, confirm). TB2 (due Wed 4:55 PM): most points **JAX**, fewest **TEN**. TB1 (due Sun 10:00 AM): **TB 23–CAR 20**, **LAC 20–NE 17**. Re-check TB1 against the Sat lines.
3. **No game picks are entered yet** in any pool. Andy enters them. Record what he locks in `data/pickem/picks-2026-w12.json` (`pools` key, same shape as `picks-2026-w10.json`).
4. Next build: `data/pickem/leans-2026-w12.json` (underdogs the tier 1–2 evidence likes), then re-run the card so the Yahoo leverage and CBS coin-flip logic fires. Coin flips: GB@LAR, CHI@DET, NE@LAC, KC@BUF, DEN@PIT, CAR@TB.
5. **Market moved: Bookmaker now has CHI −2 at DET (ML −134)**, total 55.5. The web lines in the CHI@DET deep-dive (DET −2.5, 52.5/53.5) are STALE. The deep-dive's Gibbs "favourite" flag flips (DET is now the dog).
6. Island deep-dives still to do: PHI@DAL (Thu 1:30), KC@BUF (Thu 5:20), DEN@PIT (Fri 12:00), then the island 3-tier stacks, then the Sunday card.

## 1. Read these first (in order)
| # | File | Why |
|---|---|---|
| 1 | `CLAUDE.md` → "Lean Session Rules" (top section only) | binding token-burn protocol (§2 below) |
| 2 | `STATE.md` (repo root, ≤40 lines) | single current-state file; rewrite it at milestones |
| 3 | this briefing | context and how-to |
| 4 | `reports/pickem/2026-w12-pool-inputs.md` | pools checklist, lock waves, input owners |
| 5 | `reports/pickem/2026-w12-pickem.md` | prelim card (market only) |
| 6 | `reports/bets/2026-w12-gb-lar-matchup.md`, `reports/bets/2026-w12-chi-det-matchup.md` | finished island evidence files (format to copy) |
| 7 | `reports/bets/2026-w12-matchup-splits.md` | all 16 games, §3a checks (grep the `## AWAY@HOME` section; 53 KB, never read whole) |
| 8 | `docs/OPERATIONS_MAP.md` (grep the section) | capture commands, ledgers, pools |

## 2. The token-burn protocol (approved by Andy 2026-11-22, `CLAUDE.md` top)
Background (`claude/nfl-dashboard-handoff-2026-11-22-0120-token-burn-investigation.md`): each request in a claude.ai chat re-reads ~150–170k tokens of standing context, so cost = steps × standing context. The rules:
1. **One goal per session.** Switch to a fresh chat at each approved milestone, at ~60 tool calls, or at ~100k tokens of conversation, whichever comes first. Before switching, rewrite `STATE.md` and give Andy a short paste-in summary for the new chat.
2. **Batch related commands into one device_bash call.** No task-list ticks or status messages for routine steps.
3. **Quiet output.** Cap every command at ~40 lines (`| tail -n 40`). Git: counts or path-filtered status only (the tree has ~2,300 dirty paths; never run bare `git status`). Run long scripts through `scripts/quiet.sh <label> -- <cmd>`: the full log goes to `.nfl/quiet-logs/` and a summary is printed.
4. **No whole-file reads over ~5 KB.** grep/sed the section you need.
5. **`STATE.md` is the single current-state file** (max 40 lines; rewrite, don't append). New sessions read it first and nothing else to orient. No new dated START-HERE files each session; `handoffs/` is only for H2C2 packages like this one.
6. **Mirror `STATE.md` to the project doc `claude/nfl-dashboard-state.md` once, at session close.** Each project-doc or memory write reloads context for every new chat, so write rarely.
7. **Screenshots only when the visual is the point.** Read two or more images in a subagent that returns text only. For pages, prefer `get_page_text` or a `javascript_tool` table extract (that's how the Duma/CBS standings were read today).
8. **Never fork a session to continue.** A fresh session starts from STATE.md.
9. `docs/CLAUDE_REFERENCE.md`: grep it by section, never load it whole.
Practical lessons from today:
- Don't re-derive lines from web searches when Andy has run a capture. The captures are fresher (today's web CHI@DET line was stale).
- The roster vet on a plain-name table only team-checks (legs resolved 0). Put names in a `| Game | Player |` table *and* list the prop legs so status checks fire, and take injury status from `data/player-availability/latest.json`.
- `public/schedule.json` W12 kickoffs are WRONG for 3 games (see §8).

## 3. What Team 1 did today (11/24, not yet committed except via this handoff)
- **CHI@DET deep-dive** `reports/bets/2026-w12-chi-det-matchup.md`. Strict roster gate PASS (first pass BLOCKED memory names DJ Moore → BUF and David Montgomery → HOU; both dropped). Leads:
  - Gibbs ATD / rush yds (#5 run edge, 21 inside-5 carries).
  - Loveland rec yds + ATD (#2 FAVOURED +13%, #4 DET 1st in TE TDs allowed, DET LBs Campbell/Clark/White on IR, Kmet IR).
  - Burden receptions/yds; Swift ATD (price).
  - LaPorta yds and St. Brown receptions as tiebreakers (CHI slot CB Kyler Gordon OUT).
  - **Re-price it on the live line (CHI −2, 55.5).**
- **Pools inputs checklist** `reports/pickem/2026-w12-pool-inputs.md`.
- **Yahoo API: WORKING.** It was never blocked; the "blocked" belief was stale memory. Andy rotated the client secret weeks ago, so AUDIT-CX-014 is closed. W11 refreshed final: `node scripts/archive/yahoo-week-archive.mjs --week 11 --skip-survivor` → `data/pickem/yahoo-472-g-4087-2026-w11.json`. Pick'em *picks* are not readable via the API (400).
- **Duma + CBS standings** were read via the desktop browser pane (Andy signed in; the sign-ins persist) → `data/pickem/simplysportsware-duma2-2026-w11.json`, `data/pickem/cbs-bukbuk-2026-w11.json`; `data/pickem/pools-2026.json` standings updated (backup `.bak-claude-20261124`).
- **CBS W12 pool-wide pick %** → `data/pickem/cbs-bukbuk-2026-w12-public-pct.json`.
- **Odds** `data/pickem/odds/odds-2026-w12-bkr-1124.json`: 29 ML rows, Bookmaker 16 games + BetOnline 13. BOL parse missed NE@LAC, LV@CLE and CAR@TB (probably pick'em-spread layout). Built from Andy's 11/24 ~1:00 PM captures (`data/generated/props/bookmaker-gamelines-2026-11-24-week12.raw.txt`, `betonline-live-2026-11-24-week12.pregate.raw.txt`).
- **W11 pools graded** (`node scripts/pickem-grade.mjs --week 11` → `data/pickem/results-2026-w11.json`). It graded the *plan* picks, not confirmed ones, so the site scores are the truth.
- **Prelim card** `node scripts/pickem-card.mjs --week 12 --odds-file data/pickem/odds/odds-2026-w12-bkr-1124.json` → `reports/pickem/2026-w12-pickem.md` + `data/pickem/plan-2026-w12.json` (0 leans).

## 4. State of record: pools after W11 (final)
| Pool | Format / strategy (`pools-2026.json`) | W11 | Season | Gap |
|---|---|---|---|---|
| Duma ("the duma 2", SimplySportsware, entry "Fat Lazy American", 93 entrants) | confidence, W12 1–16; `market` (max EV, 1-slot hand nudges) | 101 | 1,037.5, rank 18 (from 19) | −37 to BrockTua 1,074.5 |
| Duma rolling 4-wk prize (W9–W12) | — | — | 334 thru W11, 8th on page 1 | −16 to Robo53 350 (mzal13 347, Tahopeful 346) |
| Kenny's (Yahoo "Ken's Pickem League", 54) | confidence 1–16; `weekly_leverage` (≤1 heavy-fav fade at a low slot + contrarian coin flips, tier 1–2 evidence only) | 74, 8th, 9–4 | 845, rank 19 | −48 to Ditka's Bears 893 |
| BUKBUK (CBS, 73) | straight up; `su_flips` (favourites except fav ≤57% with tier 1–2 dog evidence) | 9 | 108, T6 (8 tied) | −5 to greg barrows 113 |
Andy's note (pools-2026.json): the two $25 Duma payouts covered his entry fee, so any further Duma winnings are profit.

Prelim W12 market ranking (both confidence pools):
16 JAX, 15 CIN, 14 DAL, 13 WAS, 12 MIN, 11 HOU, 10 NYG, 9 CLE, 8 NYJ, 7 SF, 6 TB, 5 DEN, 4 BUF, **3 LAR (locks Wed)**, 2 CHI, 1 LAC. CBS = all favourites. CBS public %: CHI@DET 51/49, GB@LAR 36/64, CAR@TB 45/55, NE@LAC 70/30 (the pool is on the market dog NE), DEN 89%, KC 23%.

## 5. Workstreams: how to run, what's open
**A. Pools (priority until Wed 3:45 PM).**
- Build `data/pickem/leans-2026-w12.json`. The format is in `data/pickem/leans-2026-w10.json`; the card reads it automatically.
- Evidence sources: the splits file §3a, the island files, the W12 expert picks (`scripts/capture-action-network-picks.mjs`; none captured yet for W12), and FTN context `data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json`.
- Re-run the card with the `--odds-file` above, or with a fresh capture (ask Andy to run the commands in §5D).
- Present GB@LAR + the full ranking to Andy. After he enters picks, record them in `picks-2026-w12.json` → later re-runs honour the locked slots.
- Final pass: Sun 9:30 AM PT after Fri injury reports + a Sat odds re-capture. Re-check TB1.

**B. Island deep-dives.** Copy the GB@LAR/CHI@DET format. Order: PHI@DAL, KC@BUF, DEN@PIT.
- Roster gate first: `npm run roster:vet -- --week 12 --date <d> --fetch --strict --card <gate .md>` (run it through `scripts/quiet.sh`).
- Statuses come from `data/player-availability/latest.json`.
- Splits come from `grep -n -A9 '^## PHI@DAL' reports/bets/2026-w12-matchup-splits.md`. Re-run `python3 scripts/analysis/matchup_splits.py --week 12` once FTN charting has MNF.

**C. Island 3-tier stacks + Sunday card.** Use the template in the project memory "island game parlay template". `docs/NFL_WEEKLY_CARD_PROCESS.md` (slot 9). Every proposal is logged at proposal time: `python3 reports/bets/season-recap/scripts/ai_record.py add --week 12 --file <proposal.json>`.

**D. Captures (Andy runs, Windows PowerShell at the repo root).**
- `npm run props:bkr:launch` → `.\runbkrprops.cmd`
- `npm run props:bol:launch` → `.\runbolprops.cmd --week 12`
- Optional: `npm run props:dkp:launch` → `.\rundkprops.cmd`
- BOL fails its ≥500-row gate midweek; the `.pregate.raw.txt` still holds the lines.
- There's no converter script for the pools odds file: a 40-line inline python built it today (BKR regex on `ML AWAY +x HOME -y`; BOL block after the `Total` header: team, spread, price, **ML**, O, price, team2, spread, price, **ML**, U, price). Worth saving as `scripts/pickem/captures-to-odds.py`.

## 6. Open items
**6a time-sensitive:**
- GB@LAR pick + full ranking by Wed ~3:45 PM PT.
- Thu 3 games lock 10:00 AM / 1:30 PM / 5:20 PM. DEN@PIT locks Fri noon.
- GB@LAR line conflict resolved: BKR LAR −2.5 / 43.5 (ML LAR −127).

**6b Team 2 can do:**
- the leans file
- the 3 remaining island files
- the converter script
- re-pricing the CHI@DET leads on CHI −2
- the STATE item: fix `reports/bets/season-recap/scripts/lib.py` half-sack grading
- settling the W9 (12) / W10 (16) paper tickets still PENDING

**6c needs Andy:**
- confirm which pool the tiebreakers belong to
- accept/decline proposed rules R11-1 ($60 max cash per game) and R11-2 (islands ≤6 tickets, 2–3 legs, Tier 1 no favourite-dependent leg) via `python3 reports/bets/season-recap/scripts/rules.py accept --id R11-1|R11-2`
- OK the long uncommitted list in STATE.md
- clear `data/intake-drop/` FTN files
- confirm the DKP funding source
- enter picks in all 3 pools

**6d backlog:**
- fix `public/schedule.json` W12 kickoffs
- the roster_vet plain-name status gap
- the BOL pick'em-layout parse

## 7. Guardrails and git (binding)
- **Proposals only.** Andy places every bet and pick. Log to the ledgers only when he says a ticket is official (`data/official-picks/user-placed-wagers-2026.json`, the single source of truth; then `node scripts/sync-placed-wagers-to-bankroll.mjs` + `node scripts/generate-live-tracker.mjs`).
- **No** Supabase writes, TheOddsAPI or other paid APIs, wagers or purchases. Read-only on sportsbook and pool sites.
- Strict roster gate on every named player. Never state team or role from memory.
- Git: branch `claude/w5-prop-cards-2026-10-11`. Commit named paths only, via a temp index:
  `GIT_INDEX_FILE=$HOME/tmpidx git read-tree HEAD; git add -- <paths>; T=$(git write-tree); C=$(git commit-tree $T -p HEAD -F msg); git update-ref refs/heads/claude/w5-prop-cards-2026-10-11 $C <old>`, then `git push origin claude/w5-prop-cards-2026-10-11`.
  Never `git add -A`, reset, stash, clean or pull.
- `rm` is blocked on the mount: `mv -n` to `_to_delete/`. Back up before editing (`*.bak-claude-<date>-<tag>`).

## 8. Corrections to older docs
- "Yahoo API still blocked" (memory, 9/03) → **false**. It's working, and the secret was rotated.
- `public/schedule.json` W12: TEN@JAX is **Sun 10:00 AM** (not 1:05), NE@LAC **Sun 1:05 PM** (not 5:20), LV@CLE **Sun 5:20 PM SNF** (not 10:00). CBS and BetOnline agree. The odds file and card already use the correct times.
- The CHI@DET deep-dive line (DET −2.5) → live BKR **CHI −2, 55.5**.
- The GB@LAR file's "5:15 PM" kickoff → **5:00 PM** (CBS, BOL, schedule).
- Duma/CBS W10 captures were the latest before today. W11 files now exist.

## 9. Resume prompt for Claude Team 2
```
Resume NFL_Dashboard W12 prep (Claude Team 2). Repo E:\dev\projects\NFL_Dashboard via device_bash ($HOME/mnt/dev/projects/NFL_Dashboard).
Read, in order and nothing else: CLAUDE.md "Lean Session Rules" section only (sed the top ~15 lines), STATE.md, then handoffs/2026-11-24-1400-claude-h2c2-team2-briefing-w12-pools-prep.md (§0, §2, §5A first).
Follow the lean rules strictly: one goal per session, batched commands, output capped ~40 lines, scripts via scripts/quiet.sh, no whole-file reads >5 KB, STATE.md rewritten at milestones and mirrored to the project doc only at close, fresh chat at ~60 tool calls / ~100k tokens.
Goal for this session: W12 pools before Wed 3:45 PM PT.
1. Build data/pickem/leans-2026-w12.json (tier 1-2 underdog evidence from reports/bets/2026-w12-matchup-splits.md, the GB@LAR/CHI@DET island files, W12 expert picks) using the leans-2026-w10.json shape.
2. Re-run: node scripts/pickem-card.mjs --week 12 --odds-file data/pickem/odds/odds-2026-w12-bkr-1124.json (or a fresher Andy capture). Respect data/pickem/picks-2026-w12.json.
3. Give Andy the GB@LAR pick (after ~3:45 PM inactives) and the full 16-game rankings per pool (Duma, Yahoo, CBS), with the CBS public % for coin flips.
4. Record what Andy locks in picks-2026-w12.json; rewrite STATE.md; stop.
Guardrails: proposals only, Andy places; no Supabase writes, paid APIs or wagers; strict roster gate on any named player; commit named paths only via temp index on branch claude/w5-prop-cards-2026-10-11.
```
