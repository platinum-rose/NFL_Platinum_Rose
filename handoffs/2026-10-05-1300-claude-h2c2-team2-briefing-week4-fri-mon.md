# H2C2 cross-team briefing: Week 4, Fri 10/02 → Mon 10/05 → Claude Team 2

**H2C2 = "Handoff 2 Claude 2".** This is a full cross-team handoff. It is more detailed than a normal session-to-session handoff, and it assumes the reader has **no memory of this period**.

- **Written:** Mon 2026-10-05 ~13:00 PT by Claude (Cowork), the team that ran Week 4 Sunday and the close-out.
- **For:** Claude Team 2, with Codex and Antigravity as parallel lanes.
- **Window covered:** Fri 10/02 12:00 PT → Mon 10/05 13:00 PT. That is 64 commits, `248aa71` → `6887ca8`, and 26 handoff docs.
- **Replaces as pick-up point:** `handoffs/2026-10-05-1235-claude-week4-closeout-futures-w5-lines-mnf-planner-handoff.md` and every "LATEST" pointer in `HANDOFF.md`.
- **Git at writing:** `main` @ `6887ca8`, equal to `origin/main`. Everything from this team is pushed.

> **Everything referenced here is in the repo.** Files a fresh clone would not have (gitignored, untracked or dirty) are copied into **`reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/copies/`** under their original paths. `file-manifest.md` in that folder lists every referenced path with its git state.

---

## 0. TL;DR: where things stand

1. **Week 4 betting is settled through Sunday night.** 24 real tickets, $353.51 cash risk, **net −$208.42**. One paying straight bet (NE +7, +$8.70) and one paying round robin (5x2, +$14.64). SuperContest went **4–1**.
2. **MNF ATL @ NO is tonight (Mon 10/05, 5:15 PM PT).** No real MNF tickets are logged yet.
   - A prop planner was built for Alejandro, Andy's prop-parlay partner: `reports/analysis/prop-planner/player-prop-parlay-planner-2026-w04-atl-no.html`.
   - Any MNF tickets Andy places must be logged, tracked and settled. So must the pick'em games.
3. **Week 5 has started.** The BKR opening board for 12 of 15 games is saved (`data/odds/BKR_current_lines_1005_1205`). MIN@NO, BAL@ATL (SNF) and BUF@LAR (MNF) are not posted yet. CHI@GB kicks off at **10:00 AM PT**.
4. **Futures and promos have small bookkeeping items open:** the Bills free-wager win, the $4.83 BetOnline reloads, and the GB Super Bowl future (moved to the portfolio ledger). See §6.
5. **The Master Intel weekly report** (template v2, dark "Tracker slate + teal" multi-page site) was built and filled for Week 4. The Week 5 run follows `docs/MASTER_INTEL_REPORT_RUNBOOK.md`.
6. **Week 4 analysis work not done yet:**
   - grading the 11 AI paper tickets
   - the Week 4 entries in the recommendation ledger
   - grading pick'em after MNF
   - Andy's end-of-week betting analysis

---

## 1. Read these first (in order)

| # | File | Why |
|---|---|---|
| 1 | this file | Orientation, open items, rules |
| 2 | `reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/README.md` | Snapshot index; points to the manifest, commit list, ticket ledger and chain digest |
| 3 | `reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/handoff-chain-digest.md` | A ~6,000-word digest of all 26 handoffs in the window. Per-workstream state, every command, every path, and 25 contradictions found across the docs. Read §2 and §7 at minimum. |
| 4 | `reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/week4-ticket-ledger.md` | Every Week 4 ticket (24 real, 11 paper) with result and P/L |
| 5 | `CLAUDE.md`, `AGENTS.md`, `docs/ANTI_PATTERNS.md` (→ Betting Rules & Card Building) | Repo-wide rules |
| 6 | `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` (§5 data rules 1–7, §7.2 standing rules) | **The only betting rules.** Playbook "proposal" bullets are not rules unless Andy confirms them. |
| 7 | `docs/NFL_WEEKLY_CARD_PROCESS.md`, `docs/BETTING_LESSONS_LEARNED.md` | Card slot templates (1–9) and lessons learned |
| 8 | `docs/MASTER_INTEL_REPORT_RUNBOOK.md`, `docs/MASTER_INTEL_REPORT_FORMAT.md` | How the weekly report is built and what is locked |
| 9 | The newest handoffs: `handoffs/2026-10-05-1235-…`, `2026-10-04-1054-…`, `2026-10-04-0300-…`, `2026-10-03-2045-…`, `2026-10-02-2145-…` | Primary sources for this period |

---

## 2. Who did what, Fri → Mon

Full per-handoff timeline: digest §1. Commits: `snapshot/commits.md`. Times are PT.

**Fri 10/02**
- **Codex:**
  - Live BKR SGP capture of the 15 open Week 4 games (`cd48156`).
  - BKR parser fix later in `40cb644`.
- **Claude:**
  - Graded TNF PIT@CLE; all TNF tickets lost.
  - Master Intel **template v2 (picks first)**, which Andy **locked** at 21:15.
  - SuperContest Week 4 lines and current-week dashboard (`248aa71`, `8712129`).
  - Andy's BEO prop boards for 14 games (`f64dbaf`).
  - DK Predictions yardage rungs.
  - Futures board parse (BEO/BKR/BetUS 10/02).
  - Jay's Lock Box promo logged.
  - The multi-page client site (`build_site.py`, `8207d26`).
  - The first handoff snapshot `reports/handoff-snapshots/2026-10-02-week4/` (`b1a905f`).
- **Antigravity:**
  - Diagnosed the **Gemini 402**: prepaid balance was $0. Andy topped up.
  - Restored **12 Windows scheduled tasks**, wiped by a Windows Update reboot on 10/01.
  - Ingested 17 Week 4 podcast/YouTube episodes (155 picks), `6192952`.

**Sat 10/03**
- **Codex:** pull bridge for promoted podcast intel (`4970ebd`).
- **Claude:**
  - **Evidence readiness:** injury, weather and price reconciliation.
  - Rendered BKR capture parser (`bookmaker-rendered-text-parse.py`).
  - **Action Network openers as the season-long line-movement baseline** (`d11123d`).
  - Narratives for all 15 games (`daec7b1`).
  - Expert-pick verification gate (`94a5193`).
  - Full-text archive of 604 articles (`421db5a`, `553e261`, `e6d6988`, `f57656b`).
- **UX_EXPERT:** dark restyle **F-mi-dark** (`8949848`).
- **WEEKLY_SYNTHESIS_SESSION:**
  - Built the Week 4 digest and card (14 tickets proposed, nothing placed) and filled the report (`cf45e15` and the `9e4a5d6` … `10138d5` site commits).
  - Andy's STOP B answer: "Go as proposed."

**Sun 10/04 early**
- **Claude:**
  - Pick'em card (`710a2be`).
  - Podcast props screen.
  - **Andy pruned the betting rules** (`eb0a1ce`; details in §5).

**Sun 10/04 → Mon 10/05 (this team, Cowork)**
- Recorded the Sunday card and tracker (`7f54ddb`).
- **Live Tracker:**
  - Imaginary/paper tickets get their own purple, collapsible section above Burnt (`bb2bdb2`, `41fd046`).
  - SuperContest official five plus per-week alternates (`12c5ac4`, `fcd8e5f`).
  - Phone copy with an ESPN snapshot, desktop-marks seed and "Export marks" (`a7f4130`).
  - Phone layout: Live-only view, collapsible Game Board and Burnt (`0030b25`).
  - Retired the "Melbourne Season Opener" banner (`3225fba`).
- **Prop tickets assessed and logged:**
  - Afternoon: three BEO prop parlays plus BKR 5-team #739761492.
  - SNF DET@CAR: island 8-leg plus a 7-leg #2.
  - Commits `493a0db` … `bc7a9ce`.
- **Settlement and close-out:**
  - Morning and afternoon settled from ESPN finals (`be88632`).
  - Full Week 4 close-out, plus a fix to `scripts/reconcile-settlement.mjs` (`a096758`; details in §4.2).
  - BKR actual round-robin payouts applied (`189f8f7`).
- **Futures:** GB SB future moved to the portfolio ledger. Week 5 BKR board saved (`70e0def`).
- **MNF:** prop planner, prop boards, phone tracker, handoff (`6887ca8`).
- **Handoff tooling:** this H2C2 package and the `scripts/handoff/h2c2_snapshot.py` tool.

---

## 3. Week 4 results

The full table is in `snapshot/week4-ticket-ledger.md`.

- **Real tickets:** 24 settled, $353.51 risk, −$208.42 net.
  - TNF: 5 tickets, all lost (−$51.37), plus the Jay's Lock Box promo (no cash).
  - Sunday BKR game tickets:
    - 5-team spread −$25; Slot 3 5-team #739714258 −$20; 6-team −$20; afternoon 5-team #739761492 −$25.
    - Round robins: 8x4 #739714646 **−$20.53** (returned $84.47 on $105); 5x2 #739713279 **+$14.64**; 6x2 #739713560 **−$17.72**. All three are Andy's actual BKR figures.
  - BetOnline:
    - NE +7 $10 **won +$8.70**.
    - 11 prop parlays all lost, including the 2 SNF island SGPs.
- **SuperContest five** (SF −2.5, ARI −1.5, MIA +10.5, LAR −3, NE +6.5): **4–1**. ARI was the miss. File: `data/supercontest/locked-card-week-4.json`.
- **SNF:** CAR 32, DET 26. The island 8-leg died on Gibbs (4 rec) and Waller (0 TD).
- **Paper (AI benchmark):** 11 records, $110 notional in `data/official-picks/paper-wagers-2026.json`, **still PENDING and ungraded**.
- **Futures, still open:**
  - GB SB #1002306799 ($20 at +6600) is in `data/futures-imports/andy-portfolio-ledger-2026.json` → `packers_sb`. That position is now $60, blended +3867, with $140 of cap left.
  - Bills SB position `bills_sb`.

---

## 4. Workstreams: state, how to run, open items

Digest §2 covers every workstream in full. Below are the essentials, with corrections from the last 24 hours.

### 4.1 Ticket ledger and Live Tracker
- **Ledger:** `data/official-picks/user-placed-wagers-2026.json`.
  - It is gitignored, but it **is tracked in HEAD** by Andy's request, so the commit path still works through a temp index.
  - Real tickets only. Paper records live in `data/official-picks/paper-wagers-2026.json` (`is_paper: true`).
  - Never change an entered ticket's accepted price or stake. Placeholder IDs (`afternoon_*`, `snf_*`) wait for BetOnline ticket numbers from Andy.
- **Desktop tracker:** `node scripts/generate-live-tracker.mjs --week <N>` writes `public/live-tracker-sunday.html`. Then run it again with `--out docs/tracked-wagers/live-tracker-sunday.html`.
  - Client state lives in localStorage keys `sunday_*_week_<N>`.
  - Futures are read from the portfolio ledger.
- **Phone tracker:** a private claude.ai artifact, **https://claude.ai/artifact/R4qQo7h1ds6hjyXmkvZr22** ("Platinum Rose Live Tracker", Andy's account).
  1. Build it with `node scripts/build-phone-tracker.mjs --week <N> --seed data/generated/phone-tracker/marks-week-<N>.json --dates <YYYYMMDD>`.
  2. Republish the output to the same artifact URL, passing `url`.
  - It embeds an ESPN snapshot behind a fetch shim, plus desktop marks exported with the tracker's "📲 Export marks" button.
  - Andy only cares about **live tickets** when he's away from his desk.

### 4.2 Settlement
- **Settlement script:** `scripts/reconcile-settlement.mjs`. The Monday pipeline runs it, and it **writes the ledger**.
  - Fixed in `a096758`:
    - skips `SETTLED` tickets
    - computes round-robin payouts from leg prices (flagged `needs_confirmation` until Andy sends the BKR actuals)
    - strips Sr/Jr/II/III from names
    - handles the `pass_interceptions` / `interceptions_thrown` markets
  - Tests: `tests/unit/reconcileSettlement.test.js` (10/10).
  - Always check its output against ESPN box scores (`data/fantasy/boxscores/espn-*.json`).
- **Pre-existing test failures:** the full `npm test` has 14–15 pre-existing failures across about 8–21 files. They are unrelated and not fixed. The full suite times out on the device bridge, so run it in chunks.

### 4.3 Props, boards and parlay building
- **Boards:** Andy pastes them into `docs/Player_Prop_Odds_Weekly/Week<N>/`. Names follow `BEO_Week<N>_<AWAY>_<HOME>[_vK]` and `BKR_Week<N>_<AWAY>_<HOME>`.
- **Parsers:**
  - BEO: `scripts/props/beo.py` keeps the highest `_vK` per game.
  - BKR rendered text: `scripts/props/bookmaker-rendered-text-parse.py`.
  - BKR SGP dump: `scripts/props/bookmaker-sgp-dump-parse.mjs`.
- **Prop planner for Alejandro:**
  ```
  python3 scripts/props/build-prop-planner.py --game "ATL @ NO" --captured "<when>" \
    --beo <BEO board> --bkr <BKR board> --out reports/analysis/prop-planner/<name>.html
  ```
  - Template: Codex's PIT@CLE planner.
  - Each book appears as its own entry in the Game filter.
  - It warns on mixed books and on same-game-parlay repricing, and tags BKR non-SGP selections "(no SGP)".
- **Parlay pricing reality:** a BetOnline SGP pays 10–62% below the raw leg product. Correlated legs are cut hardest.
- **Island template** (Thu/Sun/Mon night games), with distinct players per tier:
  - Tier 1: $10 at +600 to +1000.
  - Tier 2: $5 at +1800 to +3000.
  - Tier 3: $5 at +6500 to +20000.
- **No prop round robins, ever.**
- **Roster gate before presenting any card:**
  ```
  python3 scripts/nfl-rosters/roster_vet.py --week <N> --date <capture-date> --fetch --strict --card <file>
  ```
  Stop on BLOCK. Never fix names or teams from memory.

### 4.4 Lines and baselines
- **BKR boards:** `data/odds/BKR_current_lines_<MMDD>_<HHMM>`. Save each one verbatim, then add a `_buildfmt` copy (one line per game, `AWY @ HOM HH:MM  AWY +x-110 / HOM -x-110  oT-110 uT-110  AWY +ml HOM -ml`) and a `.provenance.md`.
  - `scripts/master-intel/build.py` `opening_lines()` uses **Action Network openers first**:
    ```
    python3 scripts/master-intel/actionnetwork_openers.py --week <N>
    ```
    which writes `data/odds/actionnetwork-openers-2026-w<NN>.json`.
  - When no opener exists, it falls back per game to the earliest BKR file.
  - No Week 5 AN file exists yet, so the 1005_1205 board is currently the Week 5 baseline.
- **No TheOddsAPI calls**, and no Supabase `game_odds_snapshots` for pricing. Lines come from Andy's pastes and read-only captures.

### 4.5 Master Intel weekly report
- **Build:**
  ```
  python3 scripts/master-intel/build.py --week <N> --date <BKR date>
  ```
  This produces the single page, docx, md, json and the multi-page site through `build_site.py` (which needs `beautifulsoup4`) and `build_single.py`. The single-file edition is the email attachment (`10138d5`).
- **PDF:** `scripts/master-intel/export_pdf.py` (Playwright) fails on the Windows bridge, so run it in the cloud container.
- **Locked format:**
  - Template v2 (picks first) and the dark "Tracker slate + teal" theme. See `docs/MASTER_INTEL_REPORT_FORMAT.md`.
  - Andy sends this to clients on Saturday night.
  - It always carries the 7e Anytime TD 7-leg and the 8a First TD recommendations, even when the playbook would cut them.
  - Every expert and article must be verified against the actual matchup: `scripts/master-intel/verify_expert_rows.py`.
  - It includes a per-expert picks section.
- **Artifacts:**
  - The client site was `E6RSz4VGWJayUWNJG9mRi6`.
  - Later Week 4 rebuilds went to the review copy `Ba1F5icQmPZf96U3N4Bxth`.
  - **Ask Andy which one is canonical for Week 5** (digest §7 item 17).
- **`scripts/master-intel/build_site.py`:** Andy's nav work was **committed in `10138d5`**. The file now matches HEAD, so the old "never stage `build_site.py`" guardrail no longer applies unless Andy re-dirties it. Check `git hash-object` vs `git rev-parse HEAD:<path>` before staging it.

### 4.6 Intel ingestion
Covered in digest §2.5 and §2.10–2.11. In short:
- **Podcasts:** Gemini credits topped up. 13 audio-only episodes may still be pending. Antigravity's billing-alert code is uncommitted and needs GH secrets.
- **Articles:** `scripts/intel/archive_week_articles.mjs`, `primer_feed.py` and `classify_week_articles.py` run per week. Scheduling them is still open.
- **Windows tasks:** 12 tasks restored on `LAPTOP-1P2J0006`. The watchdog is proposed, not built.
- **Coaching:** add the coaching-staff file `data/nfl-rosters/coaching-staff-2026.json`, and coaching trends from Week 5 (Andy's request).

### 4.7 SuperContest, pick'em and survivor
- **SuperContest:**
  - Andy and Amanda pick five together.
  - Files: `data/supercontest/week-<NN>-lines.json`, `locked-card-week-<N>.json`, `alternates-week-<N>.json` (alternates must not share a game with a locked pick).
  - Stake split: about $15 on a 5-team parlay plus a $10 2-team round robin on the same five.
- **Pick'em:**
  - Files: `data/pickem/*-2026-w04.json`, `reports/pickem/2026-w04-pickem.md`.
  - **Grade after MNF:** `node scripts/pickem-grade.mjs --week 4`.
  - Picks count as "submitted" only once Andy confirms them.
- **Survivor:** `data/survivor/pick-intel-2026-w04.json`.

### 4.8 Futures and promos
- **Portfolio:** `data/futures-imports/andy-portfolio-ledger-2026.json` uses the per-ticket layout.
  - Futures belong here, not in the weekly wagers ledger.
  - Exactas are mutually exclusive; never sum their `to_win`.
- **Promos:** `data/sportsbooks/promotions-2026.json`.
  - `beo-sb-futures-special-bills`: a $10 free bet for each Bills regular-season win. Usable only on sides or totals at about −110. A winner pays $9.09.
  - `beo-reloads`.
- **Andy's standing plan:**
  - Bills free-wager winnings pay down BUF SB liability. The $9.09 BUF SB cash boost #996987591 is being covered this way.
  - Cash reloads go on BUF SB at the best available price.

---

## 5. Andy's rules and decisions (confirmed) vs proposals

The **only betting rules** are the synthesis prompt's §7.2 standing rules and §5 data rules 1–7. On 10/04 Andy removed these:
- "props on the side you expect to win"
- "2-leg/2-team RRs first; 5+ leg straights = $5 moonshots"
- "moonshot ATD stacks lose"
- "max 4 legs on anything over $5"
- "drop first TD/sacks/QB rushing"
- "2-team RRs → Bookmaker"

Confirmed in this window (sources in digest §3):
- **Card building**
  - **Full-game unders in parlays are allowed.** "No unders in parlays" was a playbook *proposal*. Label such text "playbook proposal", never "house rule".
  - **Morning parlay:** 1–2 morning sides/totals → 1–2 easy afternoon MLs → SNF ML cap. The SNF ML is a hedge placeholder.
  - **Afternoon parlay:** 2–3 morning heavy favorites + the afternoon's high-confidence plays → SNF ML cap.
  - **No card section may be titled "2-team RR".** Ask before renaming RR tickets.
  - **No first-half legs on full-game tickets.** BEO "Game Props" can't be parlayed.
  - **Andy pastes every slip for verification before buying.** Assess it with honest pricing.
  - **The Waller duplication across SNF tickets was a deliberate "gut call".** Don't flag it again.
- **Intel and the report**
  - **No wagering synthesis until intel gathering is complete.**
  - **Action Network openers are the season-long line-movement baseline,** labeled in the report.
  - **Verify every expert and article against the matchup.** Drop irrelevant ones. Don't repeat the BKR number in expert blocks.
  - **Template v2 locked.** Dark "Tracker slate + teal" approved.
- **Futures and promos**
  - **Per-ticket futures ledger.** Futures go in the portfolio, not the wagers ledger.
- **Week 5**
  - CHI@GB at 10:00 PT.
  - The next Bills-win free wager goes on BUF@LAR.
  - The $4.83 in reloads goes on BUF SB this week.
- **Retired**
  - The "Melbourne Season Opener" banner is retired permanently.

**Not adopted:**
- the Week 4 playbook "Cut" list
- the team-power-ratings rule flip (patch in the 10/02 snapshot)
- Antigravity's watchdog and `@onstartup` trigger
- the unapproved format items

---

## 6. Open items

### 6a. Time-sensitive (tonight and this week)
1. **MNF ATL @ NO (5:15 PT tonight).** Andy may send placed tickets.
   - **Log them** with `scripts/add-placed-wager.mjs` or a direct append that matches the ledger schema.
   - Regenerate the trackers and republish the phone tracker.
   - **Settle after the final** from ESPN.
   - **Grade pick'em:** `node scripts/pickem-grade.mjs --week 4`.
2. **Bills free wager: discrepancy, ask Andy.**
   - Andy said "the free wager on **JAX +7** hit, removes $8.70 in liability."
   - The ledger has **NE +7, BetOnline #1002306890, $10 at −115, won $8.70**, logged as `funding_type: cash`.
   - The card also named NE +7 as the Bills-credit default. It is almost certainly that ticket.
   - Confirm with Andy. Then set it to free-bet funding (`cash_risk_usd: 0` makes Week 4 risk $343.51), and record in `promotions-2026.json` (`received_used`, applied_to that ticket) and in the portfolio ledger (an $8.70 liability reduction on `bills_sb`).
   - Ask too whether the second Bills credit from 10/04 was used.
3. **BetOnline reloads:** three at $1.61, $4.83 in total.
   - Log them in `beo-reloads.balance_log`.
   - Do a fresh BUF SB price capture across books (read-only), recommend the best book, and log Andy's ticket in `bills_sb` once placed.
   - **This week.**
4. **Week 5 board:**
   - Capture MIN@NO, BAL@ATL and BUF@LAR when Andy pastes them, as a new `BKR_current_lines_*` file.
   - Fix the CHI@GB time to 10:00 in `data/odds/BKR_current_lines_1005_1205.provenance.md`, and the `_buildfmt` label too.
   - Run `actionnetwork_openers.py --week 5` once AN has openers.
   - Next week's Bills free wager goes on **BUF@LAR**.

### 6b. Week 4 close-out analysis (team can do; present to Andy)
5. **Grade the 11 paper tickets** in `paper-wagers-2026.json` from ESPN box scores. There is also 1 old Week 2 paper record still pending.
6. **Recommendation ledger, Week 4 section** (proposed vs placed, divergences D14+).
   - **The repo copy `docs/claude-project-dev/recommendation-ledger-2026.md` (last updated 9/28 20:40) is newer than** the claude.ai project copy `claude/recommendation-ledger-2026.md` (9/28 19:15).
   - Update the repo copy, then mirror it to the project.
7. **End-of-week Week 4 betting analysis,** the kind Andy returns to every week. Precedent: `reports/bets/season-recap/`, `week3-recap/`, `reports/analysis/w1-3-deep/`. Cover:
   - structures, markets, price bands and AI vs Andy
   - the SGP discount effect on BetOnline prop parlays
   - island ladders
8. **Placeholder ticket numbers:** ask Andy for the BetOnline numbers for the six `—` tickets (afternoon ×3, SNF ×2, and the Jay's Lock Box promo book/odds).

### 6c. Needs Andy (decisions)
9. Which artifact is canonical for the Week 5 client report (`E6RS…` or `Ba1F…`)?
10. **Gemini guardrails:**
    - commit Antigravity's billing-alert code
    - GH secrets `GMAIL_ADDRESS` / `GMAIL_APP_PASSWORD` / `TO_EMAIL` and `ANTHROPIC_API_KEY`
    - auto-reload
11. Team-power-ratings rule: confirm or reject.
12. **Git cleanup from Windows** (the bridge cannot delete). Delete:
    - `.git/HEAD.lock.stale-20261005`, `…b` and `…c`
    - `.git/main.lock.stale-20261004`
    - `.git/index.lock` (from 10/03)
    - `.git/index.tmpcopy`
    - optionally `_to_delete/`
    - then rebuild the real index with `git read-tree HEAD`, **only after** confirming nothing else is staged on purpose

### 6d. Backlog carried forward
See digest §4, items 9–18:
- podcasts pending
- ingestion scheduling
- coaching file
- expert season records
- the `betting-splits-ingest.yml` root cause
- `build_site.py` tests and `beautifulsoup4`
- the More-menu UX bug
- the stale Herbert line
- HANDOFF.md's older carry-overs (Week 2 Supabase sync approval, the Master RR #739361263 payout, the DraftKings credit and others)

---

## 7. Guardrails and git procedure (binding)

- **Sportsbooks:**
  - Read-only. No bet placement, account or cashier actions.
  - Lines come from Andy's pastes or read-only captures.
  - No TheOddsAPI calls.
- **Supabase:** no writes without Andy's per-action OK. No `game_odds_snapshots` for pricing.
- **Paid models or synthesis:** only with explicit authorization.
- **Ledgers:**
  - Ledger, portfolio and promo files change only on Andy's instruction, or to record what he reports.
  - Keep real, paper and proposal records separate.
- **Git:**
  - `main` only.
  - **Never `git add -A`.** Never reset, clean, stash or pull over local work.
  - **The real `.git/index` is stale.** It shows phantom staged deletions, including the wagers ledger. Commit only through a temp index:
    ```bash
    export GIT_INDEX_FILE=$HOME/tmpidx; rm -f $GIT_INDEX_FILE; git read-tree HEAD
    git add -- <explicit paths>
    T=$(git write-tree); P=$(git rev-parse HEAD)
    C=$(printf 'msg\n\nCo-Authored-By: …\n' | git commit-tree $T -p $P)
    git update-ref refs/heads/main $C $P && git push origin main
    mv -n .git/HEAD.lock .git/HEAD.lock.stale-<date><x>   # the bridge leaves a new empty HEAD.lock each time
    ```
  - Confirm with `git ls-remote origin refs/heads/main`.
  - `git status` without the temp index is misleading: it shows about 1,260 entries, mostly line-ending churn plus other agents' work.
- **Leave alone** (other agents' work or line-ending churn):
  - `data/podcasts/m6-diarized/*`, `data/expert-dossiers/*`, older `handoffs/*` edits
  - `data/supercontest/live-market-comparison.json`
  - `data/odds/actionnetwork-openers-2026-w04.json`
  - `data/official-picks/platinum-rose-ai-2026.json`
  - untracked agent scripts and tests (`scripts/props/run-prop-*-agent.mjs`, `build-ai-matchup-packets.mjs`, `tests/unit/*Agent*.test.js` and others)
- **Device bridge:**
  - The repo is at `E:\dev\projects\NFL_Dashboard`, which is `$HOME/mnt/dev/projects/NFL_Dashboard` in `device_bash`.
  - Keep scans scoped; broad recursive finds time out.
  - `rm` is blocked, so move files aside with `mv -n` instead.
  - Each call is a fresh shell with a ≤180 s limit.

---

## 8. Corrections to older docs

The digest's §7 lists 25 contradictions. The ones that matter most:
- **`HANDOFF.md`'s "Current Pick Up Here"** carried four "LATEST" pointers and missed 10/04-1054 and 10/05. It is updated with this briefing as the single pick-up point.
- **Card totals:** the 2045 handoff says $174.95 across 14 tickets. The final card file says $155 after Andy removed the 2-team RRs and added 7e/8a. What was actually placed is the ticket ledger, not the card.
- **Slot 4 template:** the card's wording is the inverse of Andy's template. Use Andy's (§5).
- **`build_site.py`:** no longer dirty (committed in `10138d5`).
- **Every commit through `6887ca8` is pushed.** The "`8949848` not pushed" note is obsolete.
- **"Week 4 fully settled"** means through Sunday. MNF tickets, if any, are still to come.

---

## 9. Resume prompt for Claude Team 2

```
You are Claude Team 2 taking over NFL_Dashboard ("Platinum Rose") from the Cowork team that ran Week 4 (Fri 10/02 → Mon 10/05). Work in E:\dev\projects\NFL_Dashboard via device_bash ($HOME/mnt/dev/projects/NFL_Dashboard). Read, in order: handoffs/2026-10-05-1300-claude-h2c2-team2-briefing-week4-fri-mon.md (this briefing, end to end); reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/README.md, handoff-chain-digest.md (§2, §4, §7) and week4-ticket-ledger.md; then CLAUDE.md, AGENTS.md, docs/ANTI_PATTERNS.md and agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md §5/§7.2 (the only betting rules). Confirm git: main @ 6887ca8 or later, equal to origin. Commit only through a temp GIT_INDEX_FILE (read-tree HEAD → add explicit paths → write-tree → commit-tree → update-ref → push); never git add -A, reset, clean or stash; the real .git/index is stale.

Guardrails: read-only on sportsbooks, no bet placement, no TheOddsAPI, no Supabase writes or game_odds_snapshots pricing without Andy's per-action OK; ledgers change only to record what Andy reports; run the roster gate (python3 scripts/nfl-rosters/roster_vet.py --week <N> --date <capture-date> --fetch --strict --card <file>) before presenting any card; never fix names from memory.

Step 0 (tonight): MNF ATL @ NO 5:15 PT. Log any tickets Andy sends, regenerate the desktop and phone trackers (republish https://claude.ai/artifact/R4qQo7h1ds6hjyXmkvZr22), settle from ESPN after the final, and grade pick'em (node scripts/pickem-grade.mjs --week 4).
Step 1: briefing §6a items 2–4. Confirm the NE +7 vs "JAX +7" free wager with Andy before touching funding fields. Log the $4.83 reloads and give a best-price BUF SB recommendation from a fresh read-only capture. Capture the missing Week 5 games when Andy pastes them, and fix the CHI@GB 10:00 PT note.
Step 2: §6b Week 4 close-out analysis: grade the 11 paper tickets, add Week 4 to the recommendation ledger (repo copy first, then mirror to the claude.ai project), and write the end-of-week Week 4 analysis for Andy.
Step 3: Week 5 Master Intel cadence per docs/MASTER_INTEL_REPORT_RUNBOOK.md (no wagering synthesis until intel is complete; Action Network openers as the baseline; add coaching trends starting Week 5). Ask Andy which artifact is canonical for the client report.
Finish every session with a dated handoff in handoffs/ and an update to HANDOFF.md "Current Pick Up Here". For a cross-team handoff, use the H2C2 skill.
```
