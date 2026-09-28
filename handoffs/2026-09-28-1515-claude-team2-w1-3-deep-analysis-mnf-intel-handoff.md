# Claude Team 2 → next Claude team: W1–3 deep analysis done, MNF PHI @ CHI intel + grading

**Written:** Mon 2026-09-28 ~15:15 PT by Claude Team 2 (Cowork). **Replaces** `handoffs/2026-09-28-1300-claude-team2-pivot-weekend-briefing-deep-analysis-handoff.md` as the pick-up point. That briefing is still the reference for data locations, constraints and the Codex division of labour (§2, §5, §6).

**Urgent:** MNF PHI @ CHI kicks off at **5:15 PT** and inactives post at about **3:45 PT**. Andy wants the **article and podcast extraction protocols run now** for new intel on tonight's game (§4). After the game, grade and settle Week 3 (§5).

---

## 1. Session summary (what Team 2 did)

| # | Work | Result / where |
|---|---|---|
| 1 | Step 0: asked Andy about MNF | **Novig credit #2 NOT placed** (still pending at 14:13), **no BKR MNF ladder placed**. Andy OK'd the grading-error fix. |
| 2 | Wagers-file grading fix | 14 legs regraded vs ESPN box scores in `data/official-picks/user-placed-wagers-2026.json` (gitignored, local). Backup: `…json.bak-team2-20260928-pre-gradefix`. W1 DK NE@SEA combo (Myers FG won, Darnold legs lost, JSN 6+ rec and ATD won); W2 MNF Likely 4+ rec ×2, Newsome 3+ T+A, Malachi Fields 27+ yds and 2+ rec; W3 McBride 7+ rec, Bryant 28+ yds, Bonitto sack, Harvey 3+ rec. **No ticket result or payout changed.** Pat Bryant 3+ rec (#1000184658) was correctly LOST (2 rec). Each changed leg carries a `regrade_note`. 9 other LOST legs have a wrong `actual_stat: 0` (results still correct); see `claude/scripts/zero_sweep.py`. Left for Codex C1. |
| 3 | T2-A…T2-E deep analysis | `reports/analysis/w1-3-deep/claude/`: `SUMMARY.md` (one page), `week4-build-checklist.md`, `w1-3-basket-review.html`, t2a–t2d JSON, `scripts/` (core, t2a_burn, t2b_experts, t2c_sources, t2d_basket, build_report, box, zero_sweep). FINDINGS.md has 7 `[claude]` entries. Artifact: **W1–3 Basket Review** https://claude.ai/artifact/K7YdWU2GMvdqG7HFfZUFMF (draft, pre-MNF). |
| 4 | @thepropdealer tracked | Added to `config/twitter-tracked-accounts.json` (tier 3, td_parlays) and `src/lib/experts.js` (id 58). Record: only one gradeable pre-game slip (W2 2+ TD, 2/6). Team 1's 3 W3 rows for him come from a recap image and should be excluded. Grade only pre-kickoff slips. |
| 5 | MNF prop stacks from Monday bookmarks | `reports/bets/week3-mnf-phi-chi-prop-stacks-2026-09-28.md`. Nothing placed. Roster gate PASS. |
| 6 | Read-only article + podcast sweep (~15:00 PT) | `reports/bets/week3-mnf-phi-chi-intel-update-2026-09-28.md`: Supabase `podcast_transcripts` + `research_pick_signals` (read-only, 72h) plus 4 MNF articles re-read via Firecrawl. Adds **Ticket C: Keenum 1+ INT single (~−129)**. Raymond now has 3 sources; Burden has 3 but stays out of core. Market PHI −3.5, total 41.5. |
| 7 | Commits (pushed to main) | `ed47173` (analysis) → `c4ac9b7` (propdealer + MNF stacks) → `814674c` (MNF sweep) → this handoff. |

## 2. Headline findings (details in `claude/SUMMARY.md`; anything under 2 SE is a hypothesis)
- **W1–3 net:** −$1,015 on $1,266 staked (MNF excluded).
- **Simulated weekly EV** (Monte Carlo, market edges shrunk toward $0.95 per leg):

  | Basket | Stake/wk | EV observed | EV no edge |
  |---|---|---|---|
  | W1–3 mix | $413 | −$130 | −$84 |
  | Team 1 playbook | $240 | −$39 | −$35 |
  | **Team 2 core** | **$165** | **+$8** | **−$18** |

  The ~$66/wk structural saving is robust. The positive EV is a hypothesis.
- **Strong:**
  - AI side/total picks: 33/83 priced, −26% (2.7 SE). Andy's own sides were +9%.
  - Dog spreads: $0.67 per $1.
  - Dan's AI props at board prices: −26% (2.3 SE), a fade.
- **Structural:**
  - Receiving props hit 25/32 when the team threw 35+ times vs 31/82 otherwise.
  - ATD hit 54% when the team scored 3+ TDs vs 26% otherwise.
  - Burns cluster by game (p = 0.02).
- **Hypotheses:**
  - QB markets (pass-TD over $1.25, INT-yes $1.41), ATD $1.12 and dog ML $1.19 are positive.
  - AI TD-scorer picks +48%.
  - Keep-list expert agreement +25%.
- **Experts:**
  - No follow list yet.
  - Screen: Holka, Sal Bets, Cody Brown, Harry Lock (standard lines only).
  - Fade: Dan's AI, SharpieMatters, FirstTDBets.
  - No source shows an edge on sides.
- **Codex C1/C4 have not landed** (`reports/analysis/w1-3-deep/codex/` is empty). When they do, re-run `claude/scripts/t2a…t2d` + `build_report.py` against them.

## 3. MNF PHI @ CHI — current state (Mon 15:05 PT)
- **Live tickets:**
  - Master RR **#739361263**: one 4-leg combo alive (IND / NYJ-DET O47.5 / JAX / **PHI −3**), ~$18.24 if PHI covers.
  - **Novig credit #1**: PHI ML + U41.5 SGP, 2.85x on the $10 trade credit (→ $28.48 credit value, no cash).
- **Pending decision (Andy):** **Novig credit #2**. Options:
  - As planned: Hurts ATD / Lemon 4+ rec / Kmet 20+ yds / Loveland 5+ rec = 65.02x. Risk: Loveland has 1 catch in 2 games; Lemon had 1 target in W2.
  - Confidence alternative: Swift 14+ carries / Wicks 42+ yds (± Raymond 3+ rec).
  - Min 1.50x; pay with the trade credit; expires **Tue 9/29 5:00 PM ET**.
- **Proposed (unplaced) BKR stacks** from `week3-mnf-phi-chi-prop-stacks-2026-09-28.md` (**C:** Keenum 1+ INT single ~−129, $10, added at 15:00):
  - **A ($10):** Swift 14+ carries −151 / Raymond 3+ rec −144 / Wicks 42+ rec yds −109.
  - **B ($10):** Hurts 2+ pass TD +143 / Saquon U17.5 carries.
  - Prices are from the **Sat 9/26 BKR capture**, so re-price on the slip.
- **Availability:** Keenum starts (Caleb Williams OUT). Saquon plays but is limited (neck stinger; Bigsby involved). D. Smith plays. Goedert, Hollywood Brown and Fred Johnson are OUT. Greenard is questionable. Ertz is practice squad (roster gate NOT_ACTIVE).
- **Market:** CHI +4.5 was a top sharp side at Prime. The market is around PHI −4.5, and our master-RR leg is PHI −3.
- **Bookmarks already read** (9/27 late → 9/28 12:27 PT): salbets_, CodyBrownBets, NoExpertFS, johnewing, MattyChucks, DanGambleAI (fade), thepropdealer (paywalled), CoversJLo (W4), PatrickE_Vegas / BFawkes22. **Anything bookmarked after ~12:45 PT is unread.**

## 4. YOUR FIRST TASK — finish the extraction protocols for tonight (before ~4:45 PT)
Andy asked for the article and podcast extraction protocols to be run for new MNF intel. **A read-only pass is already done**: see `reports/bets/week3-mnf-phi-chi-intel-update-2026-09-28.md` (existing transcripts, research signals, 4 articles). What remains is the steps that write, plus anything published after ~15:00 PT. The standing rule is that Supabase writes need explicit OK. Andy asked for these protocols, but **confirm in one line before any write step**.

1. **Pick promotion (write, needs OK).**
   - Pick extraction has not promoted any picks since 9/25. No 9/26–9/28 transcript has `picks_promoted_at`, so `user_picks` is stale.
   - Run `PICK_WEEK=3 DRY_RUN=true node agents/pick-extraction.js`, review, then the real run with OK.
2. **Sharp Football "Week 3 Takeaways and MNF Best Bets" (9/28).**
   - The transcript is truncated at 24.7k chars, so the MNF segment is missing and 0 picks were extracted.
   - Re-transcribe or re-extract with `node agents/podcast-reextract.js` (read its header for args), or with `npm run podcast:gemini-intel` if the episode has a YouTube URL (`npm run youtube:resolve-episode-urls`).
   - Promoting with `podcast:gemini-intel:promote` needs OK.
3. **New podcast episodes since 14:37 PT.**
   - `DRY_RUN=true MAX_PER_RUN=3 node agents/podcast-ingest.js`, then the real run with OK. Diarized shows use Gemini; single-host use Groq.
4. **Articles.**
   - `npm run ingest-research-intel:dry`, then the real run with OK.
   - Then `npm run article:intel-review` and `npm run article:player-props` (local outputs).
   - The article extractor stores titles and odds fragments as "leans" for Action Network/ESPN. Re-read MNF articles in full (Firecrawl scrape) for the actual picks, as the sweep did.
5. **Bookmarks.** Read `.nfl/reports/twitter-bookmarks/` files newer than `2026-09-28-thepropdealer-2104654129717256389.md`.
6. **Inactives (~3:45 PT).** Confirm Saquon (collar/stinger), D. Smith, Greenard, and Keenum vs Bagent.
7. **Output.**
   - Append "MNF intel update (Mon PM, part 2)" to `week3-mnf-phi-chi-intel-update-2026-09-28.md`, with changes to stacks A/B/C and Novig #2.
   - Add any new legs to the stacks card as `| PHI@CHI | Player leg | … |` rows.
   - Run `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict --card <file>`.
   - Message Andy before kickoff.
8. **Team 2 rules apply:**
   - ≤3 legs, $10 per ticket.
   - Receiving legs only with a pass-volume case; ATD needs the team-total case.
   - No Odunze/Loveland overs unless new intel changes the picture.
   - Dan's AI is a fade source.

## 5. After MNF (game ends ~8:30 PT)
1. Fetch the final box score:
   - `node scripts/generate-live-tracker.mjs --week 3` caches `data/fantasy/boxscores/espn-<eventId>.json` and regenerates the Live Tracker.
   - Or fetch `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=<id>` the way that script does.
2. Grade:
   - master RR #739361263 (PHI −3)
   - Novig #1 (PHI ML + U41.5)
   - Novig #2 and any BKR tickets **Andy reports placing** (ask for ticket numbers)
   - the paper legs (D6 paper 4-leg had PHI/CHI U43, still pending)
   - the unplaced stacks A/B/C, as paper
3. Update the wagers file (local). **Don't sync to Supabase or Bankroll without Andy's per-action OK.**
4. **Settle Week 3** and update the ledger:
   - claude.ai DEV project `claude/recommendation-ledger-2026.md`, mirrored to `docs/claude-project-dev/recommendation-ledger-2026.md`.
   - Add MNF results, D-entries for Novig #2 and stacks A/B, and a Week 3 net.
   - Pre-MNF Week 3 cash: 33 tickets, $466.55 staked, dog-ML RR returned $39.21. Verify against the wagers file.
5. Re-run `reports/analysis/w1-3-deep/claude/scripts/`.
   - It reads Team 1's `cum.json`, which excludes MNF. Either append the MNF legs through `core.py` or wait for Codex C1's canonical table.
   - Then `python3 build_report.py <claude dir> <html>` and republish the artifact (URL above; pass `url` from a new conversation).
   - Append `[claude]` entries to FINDINGS.md.

## 6. Guardrails (unchanged)
- `main` only.
- Never pull/reset/clean/stash or `git add -A`.
- Stale `.git` locks exist, so commit like this:
  ```
  export GIT_INDEX_FILE=$HOME/idx
  B=$(git ls-remote origin refs/heads/main | cut -f1)
  git read-tree $B
  git add <paths>
  T=$(git write-tree)
  C=$(git commit-tree $T -p $B -m …)
  git push origin $C:refs/heads/main
  ```
  Base on `ls-remote`, because the local main ref lags origin.
- No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK.
- Every player named must pass the roster gate.
- Prop round robins are ruled out.
- Session files from Team 2's cloud container (`/mnt/user-data/outputs/t2/`) are not needed. Everything is in the repo.

## 7. Resume prompt — next Claude team

```
You are the Claude team picking up NFL_Dashboard betting work from Claude Team 2. Work in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then handoffs/2026-09-28-1515-claude-team2-w1-3-deep-analysis-mnf-intel-handoff.md end to end, then reports/bets/week3-mnf-phi-chi-prop-stacks-2026-09-28.md, reports/bets/week3-mnf-phi-chi-intel-update-2026-09-28.md and reports/analysis/w1-3-deep/claude/SUMMARY.md. Reconcile Git without pull/reset/clean/stash; stale lock files exist, so commit via a temp GIT_INDEX_FILE + read-tree <origin sha from ls-remote> + commit-tree and push with `git push origin <sha>:refs/heads/main`.

TIME-SENSITIVE (MNF PHI @ CHI kicks off 5:15 PT; inactives ~3:45 PT): finish the article and podcast extraction protocols in handoff §4. A read-only sweep is already in reports/bets/week3-mnf-phi-chi-intel-update-2026-09-28.md. Remaining: pick promotion (stale since 9/25), the truncated Sharp Football MNF transcript, episodes and articles after 15:00 PT, and inactives. Confirm with Andy before each Supabase-writing step; otherwise use the dry-run variants. Read Twitter bookmarks newer than 2026-09-28-thepropdealer-2104654129717256389.md. Append an "MNF intel update" to the prop-stacks file, roster-vet it, and message Andy what changes for stacks A/B and Novig credit #2 (expires Tue 9/29 5:00 PM ET, must be paid with the trade credit) before kickoff.

After the game: grade master RR #739361263 (PHI −3), Novig credits #1/#2 and any tickets Andy reports, settle Week 3, update the ledger (claude.ai DEV project claude/recommendation-ledger-2026.md, mirrored to docs/claude-project-dev/), re-run reports/analysis/w1-3-deep/claude/scripts with MNF, republish the W1–3 Basket Review artifact (https://claude.ai/artifact/K7YdWU2GMvdqG7HFfZUFMF), and hand off with a dated file in handoffs/ plus an HANDOFF.md entry. No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK. Every player named must pass `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict`. Prop round robins are ruled out.
```
