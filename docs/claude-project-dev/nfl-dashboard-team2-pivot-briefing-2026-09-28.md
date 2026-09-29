# TEAM PIVOT BRIEFING — Weekend of 9/24–9/28 → Claude Team 2 + Codex deep-analysis runs (Weeks 1–3)

**Written:** Mon 2026-09-28 ~13:00 PT by Claude (Cowork), Team 1. **Replaces** `handoffs/2026-09-28-1200-claude-week1-3-post-mortems-burn-report-expert-scorecard-handoff.md` as the pick-up point. Team 1 is standing down; Claude Team 2 and Codex take over from here.

**Goal of the next runs (Andy):** deep analysis of the Week 1–3 results so we can streamline and improve the weekly *basket of bets* (which ticket structures, markets, price bands, sources and stake sizes we keep, cut or grow).

---

## 1. Read these first (all are local repo files)

| # | File | What it is |
|---|---|---|
| 1 | `HANDOFF.md` → this file | Current state index |
| 2 | `docs/claude-project-dev/week4-playbook-2026.md` | One-page summary of the cumulative W1–3 numbers + the proposed Week 4 mix |
| 3 | `docs/claude-project-dev/recommendation-ledger-2026.md` | Claude proposal vs Andy placement log, Week 3 (D1–D11) with results |
| 4 | `reports/bets/season-recap/week4-playbook.html` | Cumulative W1–3 analysis, charts (open in a browser) |
| 5 | `reports/bets/season-recap/burn-report.html` | Why each Week 3 leg burnt + Twitter expert prop/side scorecard |
| 6 | `reports/bets/week3-recap/week3-post-mortem.html`, `season-recap/week1-post-mortem.html`, `week2-post-mortem.html` | Per-week post-mortems: sides/totals/props, closest tickets, leg categories, AI vs Andy, game recaps |
| 7 | `handoffs/2026-09-27-2130-…mnf-prep-handoff.md` and `2026-09-27-1010`, `0315`, `0245`(Codex), `0125`(Codex), `0100`, `0012`, `2026-09-26-2215`, `1202`, `1057` | The weekend's handoff chain, in order |
| 8 | `reports/bets/week3-*.md`, `reports/bets/2026-w03-*.md`, `reports/bets/week3-mnf-phi-chi-intel-update-2026-09-27.md` | Weekend cards, ladders, placements, MNF intel |

Copies of every claude.ai DEV-project doc now live in **`docs/claude-project-dev/`** (ledger, Week 4 playbook, handoffs 9/26, 9/27, 9/28). The claude.ai project remains the live copy of the ledger. If you edit it, mirror it back to the repo.

## 2. Where the data and code are

`reports/bets/season-recap/` (and `reports/bets/week3-recap/`)
- **Graded leg tables:** `w1legs.json`, `w2legs.json`, `week3-recap/w3legs.json`. One row per leg per ticket, graded from ESPN box scores (`data/fantasy/boxscores/espn-*.json`).
- **Paper (unplaced AI recs), graded:** `w1paper.json` / `w2paper.json` / `w3paper.json`.
- **Game summaries:** `w*gamesum.json`.
- **Cumulative:** `cum_w1/2/3.json` hold unique positions with origin tags (`agree` / `andy` / `ai_only`), prices and break-even. `cum.json` is the season roll-up.
- **Week 3 burn analysis:** `w3burnt.json` holds the 87 burnt legs with cause groups.
- **Expert picks, graded:**
  - `expert_props.json` covers Twitter prop picks, W1–3, with the ladder collapsed to the middle rung and a cushion versus the player's average.
  - `expert_sides.json` covers Twitter and user-pick sides.
- **`scripts/`:** the tidied pipeline scripts:
  - `grade.py` (grader)
  - `parse_placed.py`
  - `gen_week.py` + `cfg_w1/w2.py`
  - `playbook_an.py`, `playbook_cuts.py`, `build_playbook.py`, `page_playbook.py`
  - `experts.py`, `yt.py`
  - `burn_build.py`, `burn_page.py`
- **`work/container/{w3,w12,cum,exp}/` and `work/device-scratch/`:** a verbatim copy of *every* working file from Team 1's session (scripts, intermediate JSON, rendered HTML). They are rough, with hard-coded paths. Use them to reproduce or audit, not as the production pipeline.

**Inputs:**
- `data/official-picks/user-placed-wagers-2026.json` holds all placed tickets. It is **gitignored**, so it is local only.
- Supabase `twitter`/`expert_picks` read-only pull: `data/generated/master-intel/w01-pull.json` (gitignored).
- Twitter bookmarks: `.nfl/reports/twitter-bookmarks/`.
- Expert dossiers: `data/expert-dossiers/`.

**Artifacts** (Andy's claude.ai, private): Week 4 Playbook https://claude.ai/artifact/ANApKDEgpQEN59Gb6UiY9C · Week 3 Burn Report https://claude.ai/artifact/16HuRUb51ktWLptf4jfCBh.

## 3. What happened over the weekend (Thu 9/24 → Mon 9/28)

- **Thu 9/24, TNF ATL 35 @ GB 14.**
  - The island ladder (4 tickets), the favorites longshot and GB −4 all lost.
  - TNF net −$96.48.
  - Live Tracker fixes shipped: first TD, QB INTs, completions, Unders.
- **Fri–Sat 9/25–26.**
  - The intel-health pass rebuilt the recommendation ledger in the DEV project.
  - Metabet ingest and execution venues shipped (DK/FD placeable; the Kalshi decision is still open).
  - Master Intel Report template v1 was locked, along with a SuperContest companion report.
  - The Dog-ML 2-team RR #739358766 was placed ($25: TEN/NYJ/IND/LV/CLE).
  - Sat night: Andy found major roster errors in the Week 3 intel sheet. They were fixed, and a **mandatory ROSTER GATE** was added (`scripts/nfl-rosters/roster_vet.py`, `npm run roster:vet`).
- **Sun 9/27 early (Codex).** Codex ran a full template synthesis (SUNDAY v5) and produced the game-parlay card.
  - Andy disregarded the official 4-leg paper rec (D6).
  - He placed the master Compact RR #739361263 ($105, 70×4), 8-team #739361262, 5-team #739361521, teaser #739360277 and the SuperContest five #739360142.
- **Sun 9/27 props and SNF.**
  - BEO prop stacks: 7a, 7b, Stack A, Stack B, 2+ TD, first-TD ×2, and 8-leg tickets.
  - Slot-4 afternoon parlay.
  - SNF LAR @ DEN island ladder: Tiers 1–3, Moonshots 1–2, and a BKR 2-team SGP placed twice.
  - Everything lost except the **Dog-ML RR** (IND/CLE/LV, 3 of 10 combos, ≈ $39.21 on $25).
  - Decisions:
    - No prop round robins.
    - No first-half legs on full-game tickets.
    - BEO "Game Props" can't be parlayed.
- **Sun night to Mon (Team 1 analysis session).**
  - MNF intel note written.
  - Week 3, 2 and 1 post-mortems built.
  - Cumulative W1–3 analysis and Week 4 playbook built.
  - Week 3 burn report and Twitter expert scorecard built.
  - Everything committed. The last Team 1 commits are `2331c3d` and the commit carrying this file.
- **Still live going into MNF PHI @ CHI (Mon 5:15 PT):**
  - Master RR #739361263: one combo, IND / NYJ-DET O47.5 / JAX / **PHI −3** (~$18).
  - Novig credit #1: PHI ML + U41.5, 2.85x on the $10 trade credit.
  - Novig credit #2 (proposed 4-pick SGP, 65.02x) and the BKR MNF ladder (`reports/bets/week3-mnf-phi-chi-island-ladder-2026-09-27.md`): **placement status unconfirmed. Ask Andy.**
  - Novig credits expire **Tue 9/29 5:00 PM ET**.

## 4. Findings so far (W1–3, MNF excluded)

- **Money:**
  - Staked $1,266.11; returned $251.01; net **−$1,015.10**.
  - Legs hit 48.7% on 312 priced unique positions against 53.4% break-even, so each leg keeps about $0.91 per $1.
- **Structures:**
  - 5+ leg parlays 0/58 ($525).
  - 4-team master RRs 0/3 ($315).
  - **2-team RRs 3/4 (+14%), the only profitable structure.**
  - All 6 paying tickets were 1–2 leg tickets or 2-team RRs.
- **Markets:**
  - Strong-evidence leaks (~2 SE): **dog spreads 13/35** and **receptions 20/46**.
  - Good: pass-TD overs 15/21, QB INT-yes 8/12, dog MLs 8/21 (+19%), ATD +10% flat ROI.
  - Weak: Unders in parlays, receiving yards, sacks, QB rushing, first TD 1/8.
- **Prices:** only +150 or longer is profitable (+27%). −121 to −199 is worst (41/84).
- **Sources:**
  - AI-backed props +19% vs AI-backed sides −26%.
  - Andy's own sides 24/43 (+9%).
  - Props on the winning team +7% vs the losing team −9%.
- **Week 3 burn causes (87 legs):** side/total lost 26 · TD to someone else 20 · no volume 16 · defensive event didn't happen 13 · QB script 8 · efficiency 4. LAR@DEN 21 and ATL@GB 13 show that correlated stacks die together.
- **Twitter expert props** (ladders collapsed, no prices):
  - Follow:
    - Sal Bets 34–28 (our tails 10–3, positive all 3 weeks).
    - Joe Holka 29–23 (ATD 11/19).
    - Harry Lock 38–29 (standard lines 14/22).
    - Cody Brown 26–20 (yardage).
  - Screener: Dan's AI 57–44 (inflated by alt lines).
  - Fade: SharpieMatters 15–37, FirstTDBets 1–15.
  - Our legs that matched any expert went 46–37 vs 93–110 unbacked.
  - Expert sides 118/240: no edge anywhere.
- **Known caveats:**
  - Week 1 Twitter coverage is thin.
  - The expert records carry no prices.
  - Some first-TD tweets were graded as ATD.
  - Samples are small; treat anything under ~2 SE as a hypothesis.
- **Wagers-file grading errors found, NOT fixed** (need Andy's OK):
  - W3: McBride 7+ rec (had 9), Pat Bryant 28+ (44), Bonitto sack, RJ Harvey 3+ (6) are marked lost but hit.
  - W1: DK NE@SEA JSN legs.
  - W2: MNF Likely, Newsome, Malachi Fields ×2.

## 5. Standing decisions and constraints

- **Prop round robins are permanently out.** No book offers them, and building them by hand is too labor-intensive for the return. The substitute is 2–3 hand-built 2-leg prop tickets.
- No first-half legs on full-game tickets. BEO Game Props can't be parlayed. SuperContest split stake from Week 4 (~$15 5-team + $10 2-team RR).
- **No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK.** Supabase reads are fine; never print `.env` secrets.
- **Roster gate:** every player named must pass `npm run roster:vet -- --week <N> --date <capture-date> --fetch --strict`.
- **Git:** `main` only.
  - No `git add -A`, and never pull/reset/clean/stash.
  - Stale zero-byte locks (`.git/index.lock`, `.git/HEAD.lock`, `.git/refs/heads/main.lock`, `.git/refs/remotes/origin/main.lock`) mean you must commit with a temp `GIT_INDEX_FILE` + `git read-tree HEAD` + `git add <paths>` + `commit-tree`, then `git push origin <sha>:refs/heads/main`. `git ls-remote origin refs/heads/main` confirms the push.
  - The local `main` ref lags origin until Andy deletes the locks.
- The device_bash bridge stalls on broad recursive scans, so keep finds and greps scoped.

## 6. Division of labour for the deep-analysis runs

To avoid collisions, **Claude Team 2 writes only under `reports/analysis/w1-3-deep/claude/`** and **Codex writes only under `reports/analysis/w1-3-deep/codex/`** and `scripts/analysis/season-post-mortem/` (+ tests). Shared conclusions go into `reports/analysis/w1-3-deep/FINDINGS.md`: append-only, with each entry tagged `[claude]` / `[codex]`. Neither team edits the other's folder or the Team 1 recap files. Team 1's files are the baseline to diff against.

- **Claude Team 2 (analyst):** betting-strategy analysis, expert and source evaluation, burn taxonomy, basket design, and Andy-facing reports and artifacts.
- **Codex (engineer and verifier):**
  - An independent re-grade.
  - A reproducible, tested pipeline.
  - Backtests and simulations.
  - Data-quality audits of Team 1's numbers.

Order of operations: Codex's independent re-grade (C1) should land before either team treats a number as final. Claude Team 2 can run T2-A while it does.

---

## 7. Resume prompt — Claude Team 2

```
You are Claude Team 2 taking over NFL_Dashboard betting analysis from Team 1. Work in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then handoffs/2026-09-28-1300-claude-team2-pivot-weekend-briefing-deep-analysis-handoff.md end to end, then docs/claude-project-dev/week4-playbook-2026.md and docs/claude-project-dev/recommendation-ledger-2026.md, and open reports/bets/season-recap/week4-playbook.html and burn-report.html. Reconcile live Git without pull/reset/clean/stash; stale lock files exist, so commit with a temp GIT_INDEX_FILE + read-tree HEAD + commit-tree and push with `git push origin <sha>:refs/heads/main`.

Step 0 (time-sensitive): ask Andy what he placed for MNF PHI @ CHI (Novig credit #2, BKR ladder). After the game, grade master RR #739361263 (needs PHI −3), both Novig credits (expire Tue 9/29 5:00 PM ET) and any MNF tickets from ESPN box scores; with Andy's OK, fix the wagers-file grading errors listed in §4 of the briefing; settle Week 3 and update the ledger (claude.ai DEV project claude/recommendation-ledger-2026.md, mirrored to docs/claude-project-dev/).

Then run a deep analysis of Weeks 1–3 (MNF included) to streamline and strengthen the weekly basket of bets. Write only under reports/analysis/w1-3-deep/claude/ and append conclusions to reports/analysis/w1-3-deep/FINDINGS.md tagged [claude]. Use Team 1's graded tables (w*legs.json, w*paper.json, cum_w*.json, expert_props.json, expert_sides.json, w3burnt.json) as the baseline, and switch to Codex's independent re-grade in reports/analysis/w1-3-deep/codex/ when it lands. Tracks:
 T2-A Burn taxonomy for Weeks 1 and 2 (same six cause groups as w3burnt.json), then season-level: which causes are structural (correlated same-game stacks, TD-scorer concentration, game-script dependence) vs variance.
 T2-B Expert scorecard v2: add podcast/YouTube/dossier experts (data/expert-dossiers/, Supabase expert_picks read-only), attach market prices where captured, split first-TD from ATD, break down by market and by standard vs alt line, and add Wilson intervals. Output a follow / screen / fade list with evidence strength.
 T2-C Source and decision analysis: AI proposal vs Andy divergences across the whole ledger (who was right, by market); AI props vs AI sides; the value of expert agreement as a filter.
 T2-D Basket redesign: using Codex's backtest (C4) when available, propose a Week 4+ basket: structures, leg counts, markets to keep/cut, price bands, stake allocation per slot, max exposure per game, and correlation rules. Show expected value and risk for each option, not just hit rates.
 T2-E Deliver one Andy-facing report (HTML artifact, with charts) plus a one-page markdown summary in the repo, and a concrete Week 4 build checklist the weekly synthesis session can follow.
Flag every conclusion under ~2 standard errors as a hypothesis. Every player named must pass `npm run roster:vet -- --week <N> --date <capture-date> --fetch --strict`. No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK. Prop round robins are ruled out (no book offers them; too labor-intensive to build by hand). Hand off with a dated file in handoffs/ and update HANDOFF.md.
```

## 8. Resume prompt — Codex

```
You are Codex, working alongside Claude Team 2 on a deep analysis of NFL_Dashboard's Week 1–3 betting results. Work in E:\dev\projects\NFL_Dashboard on branch main. Read AGENTS.md and CLAUDE.md, then HANDOFF.md, then handoffs/2026-09-28-1300-claude-team2-pivot-weekend-briefing-deep-analysis-handoff.md (sections 2, 4, 5 and 6 matter most). Reconcile Git without pull/reset/clean/stash or `git add -A`; stale .git lock files exist, so commit via a temp GIT_INDEX_FILE + read-tree HEAD + commit-tree and push with `git push origin <sha>:refs/heads/main`.

Your role is engineer and independent verifier. Write only under scripts/analysis/season-post-mortem/ (plus tests) and reports/analysis/w1-3-deep/codex/; append conclusions to reports/analysis/w1-3-deep/FINDINGS.md tagged [codex]. Do not edit Team 1's files in reports/bets/season-recap/ or reports/bets/week3-recap/; they are the baseline.
 C1 Independent re-grade (highest priority): from data/official-picks/user-placed-wagers-2026.json and ESPN box scores in data/fantasy/boxscores/, re-grade every Week 1–3 leg and ticket (including MNF PHI @ CHI once final) without reusing Team 1's grader. Diff against reports/bets/week3-recap/w3legs.json and season-recap/w1legs.json / w2legs.json, and against the wagers file's own statuses. Report every disagreement with evidence; confirm or refute the known errors in briefing §4. Output legs_all.csv / tickets_all.csv (one canonical season table with week, book, ticket, structure, market, direction, line, price, implied prob, result, origin tag, expert-match tag).
 C2 Productionize the pipeline: turn the ad-hoc scripts (season-recap/scripts/, work/) into a single reproducible CLI (e.g. `npm run analysis:season -- --weeks 1-3`), with unit tests for the grading edge cases: lateral TDs, first TD = first non-FG score, pushes excluded, WSH/WAS team codes, "Anytime TD line 1" thresholds, alt-line ladders, and round robins graded per combo.
 C3 Data-quality audit: recompute Team 1's headline numbers (§4) from C1's table; flag any that move by more than noise. Audit expert_props.json matching (tweet time → game assignment, ladder collapse) on a sample.
 C4 Backtest and simulation: replay W1–3 legs under alternative baskets (1–2 leg tickets, 2-team RRs of the same legs, 3/4/5+ leg parlays, the island ladder tiers, market or price-band filters, expert-follow filters) and Monte Carlo the per-week P&L distribution at the observed leg hit rates, including same-game correlation. Output EV, variance and risk-of-ruin per basket for Claude Team 2's T2-D.
 C5 (if time) CLV check: where captured lines exist (BKR/BEO captures, live prop capture files), measure placed price vs closing price by market. Note that games / game_odds_snapshots were previously found unreliable.
Read-only on Supabase; never print .env secrets. No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK. Keep device scans scoped. Finish with a dated Codex handoff in handoffs/ and a line in HANDOFF.md.
```
