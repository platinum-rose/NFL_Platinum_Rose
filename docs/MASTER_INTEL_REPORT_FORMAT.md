# Master Intel Report: Locked Format (Template v1)

**Status:** locked template, approved by Andy on 2026-09-26 (Week 3). Use it **every Saturday night before the Sunday slate** until user feedback asks for changes. Don't redesign it; propose changes to Andy first and log any that he approves at the bottom of this file.
**Reference build:** Week 3, 2026 (`dist/nfl_week3_master_packet/`, commit `d1af19f` and later). If you aren't sure how something should look, open that report.
**How to build it:** `docs/MASTER_INTEL_REPORT_RUNBOOK.md`. **The builder is the template:** `scripts/master-intel/build.py` + `scripts/master-intel/convert_summary.py`. Change the format there, never by hand-editing an output file.

---

## 1. Who it's for and how it reads

The reader is a casual, all-Sunday couch bettor, not an analyst. Every part of the report follows these rules:

1. **Plain English.** Every term a casual bettor wouldn't know gets a hover definition on its column header and a plain explanation in the section. Don't use shorthand: write "Action Network", not "AN"; "Sharp or Square", not "SoS"; "Round Robin", not "RR"; "Anytime TD", not "ATD"; "passing offense vs defense", not "O vs D". The builder expands the common ones (`ABBR` in build.py, `ticket_display()`). If a new abbreviation shows up, add it there.
2. **No internal codes.** Don't show slot numbers ("Slot 3"), template codes ("7a"), rule numbers ("rule 2"), the "§" sign or the word "naive". The builder translates the known ones. Card files may keep them internally.
3. **Recommendations first.** The reader should find what to bet without scrolling past analysis.
4. **Everything collapses.** Each numbered section is an open box. Every box *inside* a section starts **closed**. The Slate Status stays open.
5. **Everything links.** Game names jump to the game write-up. Expert names jump to that expert's pick in the registry. Props jump to the props pool. Tickets jump to their legs.
6. **Team logos** (20px, `data/team-logos/`, embedded once as CSS) sit next to every game label.
7. **Honest numbers.** Stars rank our picks against each other; they are not win percentages. Projections are written estimates, not model output (the quant model failed validation and is never used to pick or size bets). When a projection disagrees with a card lean (for example a dog moneyline that is a price bet), the text says so.
8. **Disclaimer at the very bottom:** entertainment only, not advice, every wager is the reader's own risk, no liability on the author or Platinum Rose, 1-800-GAMBLER.

## 2. Page layout (top to bottom)

| Block | What it shows | Notes |
|---|---|---|
| Header | Title, build time, BKR capture time, "proposals only" line | — |
| 🧾 Data inputs & freshness | What the report was built from (closed box) | — |
| 🚨 Slate Status | Plain definition, then games played, QB changes, big-money signals **at their line**, players pulled from the Bookmaker menu, known gaps | Open by default |
| Controls + Table of Contents | Expand/Collapse All buttons; contents grid with plain titles and one-line descriptions | Same titles as the side menu |
| Side menu | Fixed on wide screens, "☰ Contents" drawer on narrow ones. Plain titles (e.g. "What the Odds Predict") with a hover description | `PLAIN` / `SHORT_TIP` in build.py |
| ⭐ Our Picks This Week | Straight bets grouped by game (filter Side/Total; sort by strength, kickoff or A–Z) · Parlays & round robins · Player prop stacks · SuperContest 5 · Passes & why | Tickets open inline with a one-line "what it is and why", payout, every leg, and the night-game hedge table where it applies |
| 📌 The Week at a Glance | Top matchup-data reads (explained, linked), one-sided consensus, clashes, big-money signals, QB watch | — |
| 1. Every Bet, Ranked | Every lean ranked by stars, filter Side/Total/Prop; pointer to tickets; **props pool** (per-game closed boxes with jump links, filter by prop type) | — |
| 2. What the Odds Predict | Overview table (both sides of spread and total splits) + one closed box per game (lines, win chance, implied vs projected score, bets-vs-money bars for spread/total/moneyline, big-money signal with its first-seen line and drift) | Signals persist in `data/generated/master-intel/big-money-flags-<season>-w<NN>.json` |
| 3. What the Experts Say | Plain intro + how-to-read box; ranking ordered **by strength first** (Near-unanimous > Majority > Clash > Split), then margin; detail boxes grouped under each strength label | — |
| 4. Strongest Plays & Expert Picks | "How the stars work" (plain); ranked tables for Sides / Totals / Props; expert pick registry per game (the citation targets) | — |
| 5. Teaser Bets | Plain teaser explanation + Wong-eligible lines | — |
| 6. The Underdog Upset Ticket | How the dog round robin pays (needs 3+ winners), per-dog table, per-dog reasoning with linked sources | — |
| 7. Game-by-Game Breakdowns | Per game: projected final, line movement, **Game script / Why the card leans this way / What breaks it**, experts cited, actionable props; then closed boxes for Key context, Sides, Totals, Player props | Written narratives (see §3) |
| 8. Player Props & How the Card Was Built | Article tier-1 props, tackles + assists main lines, 2+ passing TDs; closed "under the hood" box (ticket list, season build rules) | — |
| 9. Survivor Pool Picks | Plain explanation; your entries' status; table with win chance, pick share, value score, save-for-later notes, QB news, next 3 opponents | `data/survivor/pick-intel-<season>-w<NN>.json` |
| 10. Betting Trends | "Trends are history, not a forecast" note; trends tied to a game and side (filter by type); trend articles grouped by game | — |
| 11. Sources & Data Notes | Source counts, feed health, Known Gaps | — |
| ⚖️ Disclaimer | Entertainment-only / no-liability text | — |

## 3. What a person (or agent) writes each week

The builder does everything else from data. These four inputs are written by hand each Saturday, and they carry the voice of the report:

| Input | File | Format |
|---|---|---|
| Game write-ups + projected scores | `reports/intel/master-intel-narratives-<season>-w<NN>.md` | `## AWAY@HOME`, `projection: TEAM pts, TEAM pts`, then `### Game script`, `### Why the card leans this way`, `### What breaks it` |
| Ticket one-liners | same file, `## TICKETS` block | `- <card ticket name>: <what it is and why, for a casual bettor>` |
| SuperContest reasons | same file, `## SUPERCONTEST` block | `- <TEAM>: <plain reason>` |
| Survivor pick intel | `data/survivor/pick-intel-<season>-w<NN>.json` | `teams.<AB>.pick_pct / ev / note` + `sources` (SurvivorGrid pick share and value; Covers or similar save-for-later notes). Cite the URLs |

Writing rules for these:
- Cite only evidence that is in the dossier (lines, splits, secondary tiers, injuries, named expert picks). Name the expert as they appear in the registry, so the builder can link the name.
- Projection = the market-implied score, moved only for evidence named in the text. Say it when the projection disagrees with a card lean.
- Honest ticket lines: say when a ticket needs most of its legs to profit, or when it's a long shot or a template moonshot.

## 4. Card templates the report depends on

The report explains the card; it doesn't build it (that's `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` + `docs/NFL_WEEKLY_CARD_PROCESS.md`). Two templates must hold because the report explains them:

- **Morning Parlay:** the morning window's best plays + a couple of afternoon heavy favorites, **capped by the Sunday-night favorite moneyline**.
- **Afternoon Parlay:** 2–3 morning heavy favorites + the afternoon's highest-confidence plays, **capped by the Sunday-night favorite moneyline**.
- The night-game moneyline is a **placeholder hedge anchor**, not a pick we need to win. If the day legs all hit, the reader bets the underdog to lock a profit, or takes the underdog plus the points to try for a middle where both tickets pay. The builder detects any parlay capped with a night-game moneyline (`night_cap()`), adds the explainer box, and prints a hedge table (stake to lock profit, profit locked, middle payout) from the build's prices.

## 5. Exports (archive set)

Every build writes the same five files to `dist/nfl_week<N>_master_packet/` under `nfl_week<N>_master_betting_intelligence_summary.*`:

| Format | Made by | Use |
|---|---|---|
| `.html` | build.py → convert_summary.py | The interactive report: send this to clients |
| `.md` | build.py | Source text; diffable |
| `.docx` | convert_summary.py | Word / Google Docs |
| `.json` | build.py (`schema: master_intel_report_v1`) | Structured data: recommendations, tickets + legs + hedge options, ranked plays, consensus, per-game lines/splits/signals/write-ups/props, survivor, trends, gaps |
| `.pdf` | `python3 scripts/master-intel/export_pdf.py <html>` | Print/archive copy, every box expanded. Needs Playwright + Chromium |

Archive the five files to Andy's Google Drive after every Saturday build (a folder per week, e.g. `Platinum Rose / Master Intel / 2026 / Week 03`).

## 6. Instructions for agent teams

**All agents (Claude, Codex, Antigravity, Copilot):**
1. Read this file, then the runbook. Follow the runbook's steps in order; the only creative work is §3 above.
2. Change the report's look only in `build.py` / `convert_summary.py`, and only with Andy's approval. Don't hand-edit outputs.
3. Guardrails: read-only on sportsbooks (never click odds or a bet slip), SELECT-only Supabase pulls, no bet placement, no `git add -A`, stage files by explicit path.
4. Before you hand the report over: open the html; check that sections collapse, the filters work, links resolve, logos show and the disclaimer is at the bottom; confirm all five exports exist; then summarize in 15 lines or fewer (top plays, big-money signals, pulled players, known gaps).

**Claude (Cowork / Claude Code):** use the device shell for repo work, and the cloud container for PDF export if the local machine has no Chromium. Publish the html as a private artifact only for Andy's review; sharing with clients is Andy's call.

**Antigravity:** the skill `.agents/skills/master-intel-report/SKILL.md` wraps this file. Use Antigravity's browser only for the read-only Bookmaker capture (runbook §2). Gemini extraction output must be cleaned per the runbook before it reaches the report.

**Codex:** same steps; Codex has no browser, so it starts from an existing BKR capture file and Andy-saved DK pages.

## 7. Change log

| Date | Change | Approved by |
|---|---|---|
| 2026-09-26 | Template v1 locked (Week 3 build) | Andy |
