# H2C2 cross-team briefing: W7 Sunday close-out, mobile Live Tracker, Hedge Watch, Sun 10/25 2:15 PM → Mon 10/26 7:45 AM PT → Codex

H2C2 = "Handoff 2 Claude 2" (cross-team handoff package). Written Mon 2026-10-26 ~7:45 AM PT by Claude (session `session_01Hie8K6ufGgMMFoMSR7PbFV`), for the **Codex** team (engineer/verifier lane) picking up cold in a fresh session.

- **Window:** 16 commits, `24aa570` (Sun 10/25 14:00) → `b98a243` (Mon 10/26 07:33), plus this handoff's own commit. One prior handoff in the window: `handoffs/2026-10-25-1415-claude-w7-sunday-tracking-mobile-tracker-next.md`.
- **Replaces** the `HANDOFF.md` "PICK UP HERE: Week 7 SuperContest report correction" pointer (stale; see §8).
- **Git at writing:** repo `E:\dev\projects\NFL_Dashboard`, branch **`claude/w5-prop-cards-2026-10-11`**, HEAD `b98a243` = `origin/claude/w5-prop-cards-2026-10-11` before this handoff commit. `origin/main` is `61da10a` and is **not** the working branch. The working tree is intentionally dirty with other teams' and overnight-job files (§7).

> Everything referenced is in the repo. Files a fresh clone would not have (gitignored, untracked, or dirty vs HEAD) are copied under `reports/handoff-snapshots/2026-10-26-h2c2-w7-mobile-tracker-hedge-watch/copies/`; see `file-manifest.md` there.

---

## 0. TL;DR: where things stand

1. **Tonight (Mon 10/26): MNF DAL @ PHI, 5:15 PM PT.** No real tickets ride on it. One paper ticket is still open: the AI card's Master Round Robin (8 legs by 4s). One 4-team combo is alive, worth $13.02 paper, and it needs **DAL/PHI Under 44**. A Claude check-in already exists for tonight (§6a). Don't duplicate it unless Andy moves it to Codex.
2. **All 31 real Week 7 tickets are settled.** $324.12 risked, net **−$233.60**. One win: DKP 45488862 (+$72.06). Full table: `reports/handoff-snapshots/2026-10-26-h2c2-w7-mobile-tracker-hedge-watch/week7-ticket-ledger.md`.
3. **New this window: the mobile Live Tracker (phone edition).** Generator `scripts/generate-live-tracker-mobile.mjs`, published as Andy's private claude.ai artifact https://claude.ai/artifact/Q7NBq3G5MLgzVzraUPsuiy (on his Android home screen). It grades every open real and paper ticket against ESPN at build time. Runbook: `docs/MOBILE_LIVE_TRACKER.md`.
4. **New: Hedge Watch alerts** (`scripts/lib/hedge-alerts.mjs`). A gold banner on the phone tracker flags (a) tickets down to one game paying ≥10× stake and ≥$100, and (b) games whose combined exposure has a ≥15% chance of returning <15% of its best case. It suggests a priced hedge for each. Replay test: `node scripts/hedge-alerts-replay.mjs` (must PASS).
5. **Five scheduled Claude tasks** regenerate and republish the tracker before every kickoff window, starting **tonight 4:25 PM PT**. Andy chose **banner only**: no push or email (§4.3).
6. **Codex's job (engineer/verifier):** harden and verify what was built. That means unit tests, grader parity against the desktop tracker, calibrating the hedge model, and fixing JSON number-format churn (§6b). Andy-only decisions are listed in §6c.
7. **Week 8 starts Thu 10/29 (TNF).** The Week 8 betting pipeline (Master Intel, card, SuperContest report) is not in this briefing's scope; use the standing runbooks (§1).

---

## 1. Read these first (in order)

| # | File | Why |
|---|---|---|
| 1 | this briefing | State, rules, open items, resume prompt |
| 2 | `docs/MOBILE_LIVE_TRACKER.md` | Runbook for the phone tracker, settler, Hedge Watch, schedule, gotchas |
| 3 | `AGENTS.md`, then `CLAUDE.md` | Repo-wide agent registry and project rules (AGENTS.md says any platform, Codex included, must read both) |
| 4 | `handoffs/2026-10-25-1415-claude-w7-sunday-tracking-mobile-tracker-next.md` | Prior handoff: Sunday state at 2:15 PM, rules carried forward |
| 5 | `reports/handoff-snapshots/2026-10-26-h2c2-w7-mobile-tracker-hedge-watch/week7-ticket-ledger.md` | Week 7 real and paper ticket table (generated from the JSON) |
| 6 | `scripts/lib/hedge-alerts.mjs` | Hedge model (pure functions, header comment explains it) |
| 7 | `scripts/generate-live-tracker-mobile.mjs` | Grader + page + alerts wiring |
| 8 | `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` §7.2 and §5 rules 1–7 | The only betting rules (dirty in the working tree from another team; read the working copy) |
| 9 | `docs/ANTI_PATTERNS.md` → Betting Rules & Card Building | Anti-patterns (also dirty from another team) |

---

## 2. Who did what, Sun 10/25 2:15 PM → Mon 10/26 7:45 AM (PT)

All commits are authored "Andy Rose" (Andy's git identity); the Claude-Session trailer says which agent session did the work.

**Sunday 10/25, early afternoon (prior Claude session `01H9kvkd…`, before this window's main work)**
- `24aa570` 14:00: logged BEO prop parlays 1008926148, 1008920800, 1008919809.
- `07b218e` 14:01: settled BEO 1008729493 as a loss (NYJ 3 TDs vs team TDs Under 2.5).
- `b9b5c38` 14:13: handoff `2026-10-25-1415-…`; next task "build a mobile Live Tracker".

**Sunday 10/25, this session (`01Hie8K6…`)**
- 14:15–14:25: scoped with Andy via questions. **Android Chrome; private hosted link (claude.ai artifact); sections: live & open tickets only.** Learned that artifact pages cannot fetch ESPN (CSP), so grading happens at build time on Andy's machine and the page is republished to the same URL. Built `scripts/generate-live-tracker-mobile.mjs` and `scripts/settle_from_mobile_state.py`. Settled 4 tickets burnt by the 10 AM games. Commit **`12159d9`**.
- 14:31: restyled to match the desktop tracker (navy cards, Stake/Odds/To Win, Stat Progress bars). **`b16f0c5`**.
- 15:03: runbook `docs/MOBILE_LIVE_TRACKER.md`; gitignored the per-run state file. **`3a69809`**.
- 15:30 check-in: no changes. 16:41: settled six 1 PM-window losses (LV and ARI both failed to cover). **`ac18d4e`**.
- 16:43–17:10, other Claude session (`01H9kvkd…`): card §7j SNF island ladder T1/T2/T3, paper-tracked (`5434ed6`, `6b127fa`, `3dd745e`); logged BKR SNF island SGP 740837231 (`1dcb153`).
- 16:45: Andy thought BKR teaser 740506458 had lost on SF; verified that its SF −1 leg was the **Week 6 MNF WSH @ SF** game (SF 23–17, covered). Andy agreed. The teaser later lost on KC +8 at SNF.
- 18:10–18:11: logged two DKP SNF combos Andy pasted, 46464866 (8-pick, $5 → $293) and 46447402 (4-pick ATD, $5 → $277), with rosters checked against `data/nfl-rosters/espn-full-rosters-latest.json`. **`ed28ed2`**.
- 18:13–18:19: Andy asked where the paper ("Imaginary") tickets were. Added the 📝 Imaginary section to the phone tracker, plus auto-grading for first TD, total FGs both teams, team TDs, sacks taken, longest reception and kicker points. **`e86b867`**.
- 20:51: SNF final (SEA 20, KC 3). Settled 9 tickets: 1 win, 8 losses. **`74a4590`**.
- 21:13: Andy asked whether a hedge would have paid going into SNF. Analysis: the BKR 6-team flex ($368.39 return) was down to KC +3.5, and SEA −3 at −108 (closing DraftKings) was the hedge. $191 would have locked about $177 either way; at the 20–3 final the half hedge pays +$89 and the full +$177.
- 22:24: Andy: "I need an alert system in place for these types of scenarios." Built Hedge Watch; replayed it on the SNF position (PASS); added `--week auto`; Andy chose **banner only** and **before each window** via a question. **`2add645`**.

**Monday 10/26**
- ~07:30: created 5 scheduled Hedge Watch tasks (§4.3). Runbook schedule. **`b98a243`**.
- 03:30 AM (overnight job, not an agent): `docs/tracked-wagers/reconciliation-latest.{json,md}` regenerated. Its JS writer re-serialized `data/official-picks/user-placed-wagers-2026.json` floats (`-15.0` → `-15`, `odds_decimal 83.0` → `83`). **Values are unchanged; the file is dirty only for number format.** 6:04 AM: `public/live-tracker-sunday.html` regenerated by something outside this session. Neither change is staged.
- ~07:45: this H2C2 package.

---

## 3. Results / state of record

**Real money, Week 7** (source: `data/official-picks/user-placed-wagers-2026.json`; table in the snapshot ledger):
- 31 tickets, $324.12 risked, **net −$233.60**, 0 pending.
- Only win: **DKP 45488862** 5-pick, +$72.06 (Darnold 1+ INT was the last leg).
- SNF losses: BKR 740512242 flex −$15 (KC +3.5), BKR 740506458 teaser −$30 (KC +8), BEO 1008725429 dog-ML RR −$20, DKP 45474408 −$5.12 (Mahomes 0 pass TD), BKR 740822735 SGP pairs −$20 (Over 41 missed; total 23), BKR 740837231 island SGP −$5, DKP 46464866 −$5, DKP 46447402 −$5.
- Afternoon losses (4:40 PM settle): BKR 740807098 SC 5-team −$20, BKR 740821195 4-team spreads −$25, BKR 740807158 SC compact RR (3 of 10 combos cashed, $13.52 back) −$1.48, BEO 1008926148 −$5, BEO 1008920800 −$5, BEO 1008919809 −$10.
- Morning losses (2:24 PM settle): BKR 740636102 −$5, BKR 740636092 −$20.74, BEO 1008731202 −$5, DKP 45868275 −$5.07.

**Paper (Platinum Rose AI card, imaginary):** 35 tickets, $520 paper risk, decided paper P/L **−$159.01**; open: `paper_w7_card_master_round_robin_8_legs_by_4s`. Note: `data/official-picks/paper-wagers-2026.json` never gets a status written back. Every paper ticket in it (W2, W4 and W7) still says PENDING; the grades exist only in the tracker's computed state (§6c).

**Bankroll (Supabase):** `node scripts/sync-placed-wagers-to-bankroll.mjs` was **not** run for any settlement in this window. The standing rule is that Supabase writes happen only for bets Andy asks to track (§5).

---

## 4. Workstreams: state, how to run, open

### 4.1 Mobile Live Tracker (phone edition)

**What it is.** A single page Andy opens from his Android home screen:
- a header with Cash Risk, Potential Win and Total Cashed
- a Game Board strip (team-colored chips; each links to the ESPN gamecast)
- **Live Active Slips:** real open tickets, closest to cashing first, tap to expand legs with Stat Progress bars
- the **Hedge Watch** banner when triggered
- a collapsible **📝 Imaginary** section for paper tickets, with a settled-paper P/L list

It is styled to match the desktop tracker (`public/live-tracker-sunday.html`) and is dark-only by design, like the desktop.

**Why it's baked.** The artifact's sandbox blocks fetches to ESPN. The generator grades on Andy's machine (ESPN scoreboard for weeks N−1 and N, plus `summary?event=` box scores) and writes static HTML. Republishing to the same artifact URL updates any open copy. The header shows "Graded h:mm · X min ago" and turns amber after 45 min.

**Commands** (repo root; Linux node in the device VM and Windows node both work):
```
node scripts/generate-live-tracker-mobile.mjs            # --week auto (default) or --week N
python3 scripts/settle_from_mobile_state.py              # dry run: review it
python3 scripts/settle_from_mobile_state.py --apply      # writes data/official-picks/user-placed-wagers-2026.json
node scripts/generate-live-tracker.mjs --week N          # keep the desktop tracker in sync after settling
node scripts/hedge-alerts-replay.mjs                     # must print PASS
```

**Outputs:**
- `public/live-tracker-mobile.html` (committed). An artifact fragment: no `<html>/<head>`; the publish step wraps it.
- `public/live-tracker-mobile-state.json` (gitignored). Per-leg grades for real and paper (`paper: true`), consumed by the settler.
- `public/hedge-alerts.json` (gitignored). Active alerts plus seen ids.

**Grader coverage:**
- **Side and total markets:** spread, moneyline and total, with their `sgp_` and `alternate_` variants.
- **Player props:** receptions, receiving/rushing/passing yards, carries, completions/attempts, pass TDs, INTs, tackles+assists, sacks, FGs made, kicking points, anytime TD and 2+ TD, sacks taken, longest reception.
- **Game and team markets:** first TD (from ESPN `scoringPlays`), total FGs both teams, team TDs.
- **Round robins:** graded per combo, by `leg_nums` (paper) or `teams` (real).
- **Lock rule:** over props lock as hits as soon as they're cleared.
- **Unknown markets:** they show **CHECK**.
- **Players:** matched by normalized display name, suffixes stripped. A player missing from a final box score → CHECK (likely inactive; the book's void rule applies).

**Settler rules** (`scripts/settle_from_mobile_state.py`): dry run by default. It skips any ticket with a CHECK leg, any cashed parlay with a push/void leg (the reduced payout needs per-leg prices), and any round robin with combos still in play. It writes leg `status`/`actual_stat`/`grading_note` and ticket `status: SETTLED`, `result`, `profit_usd`, `settled_payout_usd`, `graded_at`, and appends to `progress_notes`. It serializes with Python `json.dumps(indent=2, ensure_ascii=False)`, which round-trips the file byte-exactly *as it was on 10/25*. The overnight JS reconcile writer now formats numbers differently (§6b-4).

**Publishing (Claude only).** Codex has no Artifact tool, so Codex can regenerate `public/live-tracker-mobile.html` but cannot republish the link. Publishing is done by Claude sessions and the scheduled Claude tasks: stage the HTML into the cloud session, read the artifact by URL, then publish with `url` set to https://claude.ai/artifact/Q7NBq3G5MLgzVzraUPsuiy. **Never create a new artifact** (it would break Andy's home-screen shortcut).

**Gotchas:**
- `device_commit_files` (Claude's cloud→device copy) **caches by source filename**. Re-sending the same container path delivers stale content. Use a unique source name and verify with `md5sum`. Not a Codex concern if Codex edits files directly.
- The desktop generator takes about 60–90 s.
- ESPN odds drop from the scoreboard once a game starts. Hedge Watch reads `summary.pickcenter` (closing line) instead.

### 4.2 Hedge Watch (`scripts/lib/hedge-alerts.mjs`)

Pure functions; the generator wires them in for **real tickets only**.

- **`last_game` alert:** a ticket whose remaining legs are all in one game, with return ≥10× stake and ≥$100. It scores the best opposite market (strict win/push semantics) and gives a **full** hedge (equalizing: H = return / decimal price) and a **half** hedge, the chance the ticket hits, and the hedge's expected cost.
- **`game_gap` alert:** all side/total exposure on one game, scored over a grid of final margin × total. Model: margin ~ Normal(−spread, 13.5) with key-number weights (3: ×2.2, 7: ×1.6, 10: ×1.3, 6/14: ×1.2, 4: ×1.15, 1: ×1.1); total ~ Normal(O/U, 10); independent, same-parity grid. It flags when P(return < 15% of best case) ≥ 15% and the best case is ≥ $150. Output:
  - a 4×2 table (dog wins / fav by 1–3 / 4–7 / 8+ × over/under the O/U)
  - the market that covers the most probability-weighted shortfall
  - half and full sizes
- **Prices:** ESPN pickcenter, DraftKings first (`spreadOdds`, `moneyLine`, `overOdds`/`underOdds`). Alt lines are model-priced with 4.5% vig and marked "est."
- **Props:** not modelled. A ticket down to a single prop assumes −110 and says so.
- **Page rendering:** cards are grouped by game. A per-ticket hedge that points the opposite way from the game cover gets a warning ("stacking both cancels out").
- **Replay** (`scripts/hedge-alerts-replay.mjs`, W7 SNF): it must recommend **SEA −3** on the $368 flex, mark **SEA 8+ / Under** dead, and pick a game cover that wins at the 20–3 final.
- **Defaults** (`HEDGE_DEFAULTS`): minMultiple 10, minPayout 100, gapMinPayout 150, gapMinProb 0.15, deadShare 0.15, marginSd 13.5, totalSd 10, vig 0.045. These are engineering defaults, not betting rules.

### 4.3 Scheduled Hedge Watch runs (Claude scheduled tasks, bound to Andy's Windows desktop)

Each run: regenerate with `--week auto` → republish the artifact → report. They never settle, commit or notify (Andy chose banner only), and they run in auto-approve mode. Tasks can't fire less than an hour apart, which is why early and late are separate.

| Task id | Name | When (PT) |
|---|---|---|
| `trig_01TqchS6esWBzRZ2dvDAYuoW` | Hedge Watch: Sunday early check | Sun 9:25, 12:25, 4:25 |
| `trig_013jNMhFJLgfdBLM5DK6sJAH` | Hedge Watch: Sunday late check | Sun 9:50, 12:50 |
| `trig_018zUqvCa3cSWY6TjcXxtmZ8` | Hedge Watch: Mon/Thu early check | Mon/Thu 4:25 |
| `trig_019kYVd9Lxd4nPkT4EZmUf8z` | Hedge Watch: night-game late check | Sun/Mon/Thu 5:02 |
| `trig_01AE9fZVhQdGepPYKRzRmXpm` | Hedge Watch: island-game halftime | Sun/Mon/Thu 6:45 |

Plus a one-shot check-in into the Claude session: **`trig_01XRCbyhm6aKCLXNk14CTeif` "Mobile tracker: MNF final grading"**, Mon 10/26 8:45 PM PT. It grades MNF, settles, regenerates, republishes and commits. Its prompt asks it to grade the paper DAL@PHI legs "in paper-wagers-2026.json"; that conflicts with the never-written paper file (§6c-3), so the Claude session should only report paper grades unless Andy says otherwise.

Pre-existing tasks (not from this window): "Weekly NFL team-profile snapshot refresh" (Tue 8 AM PT) and "Weekly SuperContest lines ingest" (Thu 8 AM PT).

Not covered: Saturday games (late season) and international morning games. The 1:05/1:25 PM window gets the 12:25 and 12:50 runs, so its late check lands 15–35 minutes before kickoff (§6b-6).

### 4.4 Desktop Live Tracker and card work (other session, context only)

`scripts/generate-live-tracker.mjs` (≈10k lines) → `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html`. That session added card §7j (SNF island ladder T1/T2/T3) and paper-tracked it via `scripts/paper_from_card.py`. The card is `reports/bets/2026-w07-card.md`. No open items from that work were handed to this session.

---

## 5. Rules and decisions

**Confirmed by Andy** (sources: `handoffs/2026-10-25-1415-…` "Rules carried forward"; this session's chat, 10/25–10/26):
1. Nothing is placed without Andy's approval. **Agents never place bets**, and hedge alerts are information only.
2. Stage **named files only**. Never `git add -A`, reset, clean or stash. Commit with a message file (PowerShell eats `$`).
3. Supabase writes only for bets Andy asks to track (the bankroll sync wasn't requested in this window).
4. No logging in or entering passwords. BetOnline/Bovada are blocked in Chrome; don't work around that.
5. Windows Python 3.14 for card/report builds; `--date` = the capture file date.
6. Roster facts come from `data/nfl-rosters/espn-full-rosters-latest.json`, never from memory (Kenneth Walker III is KC; Wil Lutz is DEN; Emanuel Wilson, AJ Barner and Jason Myers are SEA).
7. Ledgers change only to record what Andy reports or what ESPN finals decide (settlement).
8. **Mobile tracker scope** (10/25 14:15): Android Chrome; private hosted link; live & open tickets. Extended at 18:13 when Andy asked for the paper tickets.
9. **Hedge Watch** (10/25 22:24, by question): delivery is the **tracker banner only**; cadence is **before each window** plus island-game halftime.
10. **Betting rules** are only `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` §7.2 plus §5 data rules 1–7. Nothing in this window changed them.

**Proposals, not adopted:**
- "When one leg stands between you and >10× stake, hedge 30–60% of the equalizing amount pre-kickoff" (Claude, 10/25 21:13). Andy asked for an *alert system* instead. The 10× threshold is an alert default, not a betting rule.
- Push notifications or Gmail delivery for alerts (offered; Andy declined).
- A "hedge spot" flag on desktop tracker cards (not requested).

---

## 6. Open items

### 6a. Time-sensitive
1. **Tonight, MNF DAL @ PHI 5:15 PM PT.** Hedge Watch runs at 4:25, 5:02 and 6:45; the Claude MNF check-in runs at 8:45. Expect "no hedge spots" (no real tickets). Codex: no action unless Andy reassigns MNF grading.
2. **Thursday 10/29 TNF** is the first Week 8 island game. `--week auto` must resolve to 8 by then. ESPN flips weeks after MNF; verify with `node scripts/generate-live-tracker-mobile.mjs` on Tuesday (look for `week auto → 8`).

### 6b. Codex can do (engineer/verifier)
1. **Unit tests** for `scripts/lib/hedge-alerts.mjs`: `amToDec`/`decToAm`, grid normalization, `legOutcome` vs `hedgeOutcome` pushes, equalizing math, RR combo returns, conflict detection. Move the replay into the test suite as a regression test. Run vitest directly (`node node_modules/vitest/dist/cli.js run <files>`); `npx`/`npm run` hang on this checkout from the device bridge.
2. **Grader parity.** Re-grade every settled real ticket for Weeks 5–7 with the mobile grader and diff its leg grades against the recorded `status`/`result`. Report mismatches; don't fix ledgers. Do the same against the desktop tracker's grading, if it can be extracted.
3. **Calibrate the hedge model** from `data/vault-seed/nflverse/games.csv`: the empirical distribution of (actual margin − closing spread), the key-number mass at 3/7, total residual sd, and margin–total correlation. Replace the hand weights with the empirical distribution behind the same API, and keep the replay PASSing.
4. **JSON number-format churn.** The overnight reconcile (JS) and the settler (Python) serialize `user-placed-wagers-2026.json` differently (`-15.0` vs `-15`). Find the 3:30 AM job's writer (reconciliation; see `docs/tracked-wagers/reconciliation-latest.md` "Generated") and agree on one format. Don't rewrite the ledger to "fix" format without Andy's OK.
5. **Generator robustness:**
   - handle weeks with no events (bye-week/scoreboard errors) gracefully
   - honor a `--season` default from ESPN
   - a `--no-paper` flag
   - a guard so a publish never ships an empty page if ESPN fails (exit non-zero instead)
6. **Coverage gap.** The late-afternoon window (1:05/1:25 PM kickoffs) only gets the 12:50 run, about 15–35 minutes early. Saturday and international games aren't scheduled. Propose exact task times; creating or editing scheduled tasks is a Claude/Andy action.
7. **Live lines.** Hedge Watch uses pregame/closing lines only. Investigate a live-line source that fits the guardrails: **no TheOddsAPI**, read-only, no logins. The repo's BKR/BEO capture scripts are candidates (see the `nfl_dashboard_live_prop_capture_status` notes in the memory/project docs). Proposal only.
8. **Housekeeping (needs Andy to delete).** Untracked `.nfl/incoming/` (staging copies) and `.nfl/commit-msg-*.txt` from this session. Consider gitignoring `.nfl/incoming/`.

### 6c. Needs Andy
1. **Who owns MNF grading tonight:** the Claude check-in (`trig_01XRCbyhm6aKCLXNk14CTeif`, 8:45 PM) or Codex? (Default: Claude.)
2. **Bankroll sync** for the 21 Week 7 settlements in this window. Run `node scripts/sync-placed-wagers-to-bankroll.mjs`? (A Supabase write: needs his OK.)
3. **Paper write-back:** should paper grades be written to `paper-wagers-2026.json` (status/result) so W2/W4/W7 paper records are permanent? Today they exist only as tracker output.
4. **Paper backfill for Weeks 5–6** (offered in the 10/25 handoff; never paper-tracked).
5. **Alert delivery:** banner only for now. Revisit push/email if he misses alerts.
6. Carry-overs from the 10/25 handoff:
   - **Client edition** of the Master report starts Week 8 (strip names, live-ticket notes, paths).
   - **BEO prop scraper** parsed only 3 games; IDP/QB-pressure markets go unpriced (Week 8 fix).
   - The client **PDF** is from Saturday's 10:20 PM build; the card changed after. Re-send only if he asks.

### 6d. Backlog
- A "hedge spot" badge on desktop tracker cards.
- Per-leg prices for BKR SGP tickets, so cashed parlays with a push can auto-settle.
- Mobile tracker: optional light theme (the desktop is dark-only).

---

## 7. Guardrails and git procedure (binding)

- **Read-only on sportsbooks; never place bets.** No TheOddsAPI. No Supabase writes (including `game_odds_snapshots` pricing) without Andy's per-action OK.
- The **roster gate** before any card: `python3 scripts/nfl-rosters/roster_vet.py --week <N> --date <capture-date> --fetch --strict --card <file>`.
- **Dirty shared checkout.** Many modified files belong to other teams or overnight jobs and must not be staged, including:
  - `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`, `docs/ANTI_PATTERNS.md`
  - `scripts/build-w05-quantitative-synthesis.mjs`, `scripts/props/bookmaker-sgp-dump-parse.mjs`, `scripts/run_gemini_youtube_shadow.py`, `scripts/weekly-synthesis-preflight.mjs`
  - the `data/survivor/*`, `data/player-availability/*`, `data/shadow-harness/*` and `data/research-intel/*` refreshes
  - `docs/tracked-wagers/reconciliation-latest.*` and the float-only diff on `data/official-picks/user-placed-wagers-2026.json`
  - `public/live-tracker-sunday.html`
  - untracked `.nfl/gmail-summaries/*`, `CLAUDE.md.bak-20261012`, `agents/dev/ANTIGRAVITY_*.md`
- **Git:**
  - Inspect with `git -c core.fsmonitor=false status --short`.
  - Stage named paths only. Commit with `git commit -F <message-file>`.
  - Push to **`origin claude/w5-prop-cards-2026-10-11`** (not main).
  - Never `git add -A`, reset, clean, stash, or pull over local work.
  - If stale `.git/*.lock` files block you, commit through a temp index instead of deleting locks you didn't create: `GIT_INDEX_FILE=<tmp> git read-tree HEAD`, `git add -- <paths>`, `git write-tree`, `git commit-tree <tree> -p HEAD -F <msg>`, then `git update-ref refs/heads/claude/w5-prop-cards-2026-10-11 <new> <old>` and push.
- **Before staging a file you touched,** confirm nobody else changed it since: compare `git hash-object <f>` with what you wrote.
- **Commit trailer:** use your own team's attribution; don't reuse Claude's session URL.

---

## 8. Corrections to older docs

1. **`HANDOFF.md` "PICK UP HERE: Week 7 SuperContest report correction"** (from `handoffs/2026-10-24-1820-codex-resume-supercontest-sides-only.md`) is **stale**. The SuperContest report was finalized on 10/25 (`34b0781`, format gate `scripts/master-intel/check_sc_report.py`, frozen reference `docs/reference/supercontest-report-locked-w07.html`) per `handoffs/2026-10-25-1415-…`. This package moves the pick-up pointer here.
2. **The 10/25 handoff's "manual-grade legs" list** (first TD, total FGs both teams, Lutz kicker points, Metcalf longest reception, sacks taken) is now auto-graded by the mobile grader for display. Nothing is written to the paper file.
3. **"Run the desktop generator with Windows node"** (10/25 handoff): Linux node in the device VM also works for both generators.
4. **Runbook gotcha:** an earlier note said `device_commit_files` overwrites "lag". The real cause is **caching by source filename**; the runbook is corrected (`b98a243`/`2add645`).
5. **BKR teaser 740506458:** its SF −1 leg was Week 6 MNF (WSH @ SF 17–23, won), not Sunday's SF @ ATL. The teaser **lost on KC +8** at SNF. The ledger is correct.
6. **Week 7 P/L:** use the ledger total (−$233.60). A mid-session "Sun 10/25 net −$82.92" figure filtered on the `date` field (placement date) and is not a meaningful number.

---

## 9. Resume prompt for Codex

```
You are the Codex engineer/verifier picking up Andy's NFL_Dashboard ("Platinum Rose") repo cold.

Repo: E:\dev\projects\NFL_Dashboard   Branch: claude/w5-prop-cards-2026-10-11 (push here, not main)
Start: git -c core.fsmonitor=false log --oneline -5 ; HEAD should be the H2C2 handoff commit on top of b98a243.

Read, in order:
 1. handoffs/2026-10-26-0745-claude-h2c2-codex-briefing-w7-mobile-tracker-hedge-watch.md   (this briefing; it wins over older docs)
 2. docs/MOBILE_LIVE_TRACKER.md
 3. AGENTS.md, then CLAUDE.md
 4. scripts/lib/hedge-alerts.mjs, scripts/generate-live-tracker-mobile.mjs, scripts/settle_from_mobile_state.py
 5. reports/handoff-snapshots/2026-10-26-h2c2-w7-mobile-tracker-hedge-watch/README.md (week7-ticket-ledger.md, file-manifest.md)

Guardrails (binding):
 - Never place bets or touch sportsbook accounts; alerts are information only. No TheOddsAPI.
 - No Supabase writes (incl. bankroll sync) and no ledger edits without Andy's explicit per-action OK.
 - The checkout is dirty with other teams' and overnight-job files: stage NAMED files only; never git add -A,
   reset, clean, stash or pull over local work. Commit with a message file. Don't stage the float-only diff on
   data/official-picks/user-placed-wagers-2026.json or docs/tracked-wagers/reconciliation-latest.*.
 - Roster facts only from data/nfl-rosters/espn-full-rosters-latest.json.
 - Republishing the phone tracker (claude.ai artifact) is a Claude-only action; you regenerate the HTML, Claude publishes.
 - Tonight's MNF (DAL @ PHI) grading belongs to the Claude check-in at 8:45 PM PT unless Andy reassigns it.

First actions:
 1. Verify: node scripts/hedge-alerts-replay.mjs  -> must print PASS.
    node scripts/generate-live-tracker-mobile.mjs --week 7  -> "W7: 0 pending", "paper: ... 1 open", "hedge alerts: 0 active".
 2. Write unit tests for scripts/lib/hedge-alerts.mjs (briefing §6b-1); run with
    node node_modules/vitest/dist/cli.js run <test files>   (npx/npm run hang on this checkout).
 3. Grader parity check for Weeks 5-7 (§6b-2): report mismatches in a new reports/ file; do not edit ledgers.
 4. Then §6b-3 (calibrate hedge model from data/vault-seed/nflverse/games.csv, keep replay PASS), §6b-4 (number-format
    churn: report the writer and a proposed single format), §6b-5 (generator robustness).
 5. Before Thursday 10/29: confirm `node scripts/generate-live-tracker-mobile.mjs` logs "week auto → 8" (ESPN flips after MNF).

When you finish a chunk: commit named files to claude/w5-prop-cards-2026-10-11 with a clear message, push, and write a
dated handoff in handoffs/ (what changed, commands, open items, anything needing Andy). List questions for Andy from
briefing §6c rather than deciding them.
```
