# Claude Team 3 → Claude Team 2 (partner team): MNF tickets placed + tracked, Weeks 1–2 closed, Week 3 open on MNF only

**Written:** Mon 2026-09-28 ~19:10 PT by Claude Team 3 (Cowork). **Replaces** `handoffs/2026-09-28-1515-claude-team2-w1-3-deep-analysis-mnf-intel-handoff.md` as the pick-up point. Guardrails (§6 of that file) are unchanged. **Next session = Claude Team 2** (the partner team that wrote the W1–3 deep analysis in `reports/analysis/w1-3-deep/claude/`); Team 3 stands down. Division of labour with Codex is unchanged (briefing §6: Claude writes under `reports/analysis/w1-3-deep/claude/`, Codex under `…/codex/` + `scripts/analysis/season-post-mortem/`, shared `FINDINGS.md` append-only).

**All session documents are in the local repo.** claude.ai DEV-project docs are fully mirrored in `docs/claude-project-dev/` (ledger now includes MNF entries D12–D13; the Team 2 pivot briefing mirror was added). The only local-only data is the gitignored wagers file `data/official-picks/user-placed-wagers-2026.json` (+ backups) and the generated Live Tracker HTML (`public/`, `docs/tracked-wagers/`, untracked).

## 1. What this session did
| # | Work | Result / where |
|---|---|---|
| 1 | MNF extraction protocols (read-only) | Inactives + part-2 sweep appended to `reports/bets/week3-mnf-phi-chi-intel-update-2026-09-28.md` (commit `f653612`). Dry runs: pick-extraction 85 picks / 0 errors (no new MNF intel; real run still needs Andy's OK — never run), podcast-ingest 0 new episodes, research-intel-ingest `--dry-run` hung with no output (not investigated). Sharp Football MNF transcript still truncated — `podcast-reextract.js` can't fix it (re-extracts stored text, OpenAI has no credits); needs a re-transcribe. |
| 2 | MNF tickets placed by Andy (all logged in wagers file, local) | See §2. |
| 3 | Wagers-file leg normalization | Tonight's legs now use the file's conventions (`carries`, `passing_touchdowns`, `anytime_touchdown`, `pass_interceptions`; `line` = threshold − 0.5, e.g. 15+ carries → 14.5) so the Live Tracker grades them. |
| 4 | Live Tracker | Regenerated (`node scripts/generate-live-tracker.mjs --week 3`). Verified in the browser at `http://127.0.0.1:4567/live-tracker-sunday.html`: 31 burnt, 1 cashed, 8 active. Andy's open tab was stale → hard refresh (Ctrl+F5) fixes "tickets not showing". The tracker HTML is not committed (untracked, contains wager data). |
| 5 | **Settled Weeks 1, 2 and 3-Sunday in the wagers file** | Tickets were never closed at the ticket level (legs were graded, `status` stayed PENDING). Set `status: SETTLED`, `result`, `settled_payout_usd`, `profit_usd`, `graded_at`, and a close-out note. Rule: any LOST leg → loss; wins use actual book payouts from the post-mortems; promo/free-bet tickets → loss with $0 cash. Backups: `…json.bak-team3-20260928-pre-novig2`, `…-pre-w3-settle`, `…-pre-w12-settle`. |

**Reconciliation (matches Team 1 post-mortems to the cent):**
| Week | Tickets | Cash staked | Returned | Net | Open |
|---|---|---|---|---|---|
| 1 | 27 | $370.77 | $80.56 | −$290.21 | 0 |
| 2 | 34 | $428.79 | $131.24 | −$297.55 | 0 |
| 3 pre-MNF | 40 | $466.55 (incl. master RR $105) | $39.21 (dog-ML RR #739358766) | — | 8 |
| 3 incl. MNF cash | 45 | **$498.41** | TBD | −$459.20 if nothing else cashes | — |

## 2. MNF PHI @ CHI — open tickets to grade (all in the wagers file)
| Ticket | Book | Stake | Returns | Legs |
|---|---|---|---|---|
| Master RR #739361263 | Bookmaker.eu | $105 (already counted) | ~$18.24 if PHI −3 covers | one 4-leg combo alive: IND / NYJ-DET O47.5 / JAX / PHI −3 |
| Novig credit #1 | Novig | $10 trade credit ($0 cash) | $28.48 credit | PHI ML + U41.5 |
| Novig credit #2 (placed 16:28) | Novig | $10 trade credit ($0 cash) | $240.00 | Swift 15+ carries / Wicks 42+ rec yds / Raymond 3+ rec / DeVonta Smith 50+ rec yds / Swift 3+ rec (24.01x) |
| D1 #1000551349 | BetOnline | $10 | $95 | Hurts 2+ pass TD / Nolan Smith Jr. 1+ sack / CHI TT U18.5 (+850) |
| D3 #1000552599 | BetOnline | $5 | $210 | Hunt sack / Carter sack / Keenum 1+ INT / Saquon 16+ carries / Hurts 1+ TD / Keenum 27+ att (+4100) |
| #1000554327 | BetOnline | $5 | $530 | Ertz o10.5 rec yds / Carter sack / Saquon 2+ rec / Odunze o26.5 / Keenum 1+ INT / Wicks o43.5 / Wicks 1+ TD |
| #1000553845 | BetOnline | $5 | $275 | Hurts o26.5 rush / Saquon o13.5 rec yds / Swift o63.5 rush / Hunt sack / Keenum 1+ INT / Burden o36.5 / Lemon o25.5 |
| #1000553267 | BetOnline | $6.86 | $644.84 | Ertz 1+ TD / Ertz o1.5 rec / Hurts o1.5 pass TD / Swift 2+ rec / Odunze 1+ TD / Burden 3+ rec |
- D2 (Keenum 2+ INT / Hunt / Carter, +1800) was **not** placed. Stacks A/B′/C were **not** placed (paper only; see the stacks card).
- Paper: D6 paper 4-leg had PHI/CHI U43 (still pending).
- Several of tonight's tickets are outside the Team 2 rules (≤3 legs, $10) by Andy's explicit choice — log them as such in the post-mortem.

## 3. NEXT SESSION (Claude Team 2) — tasks in order
1. **Grade MNF** from the final box score: `node scripts/generate-live-tracker.mjs --week 3` (caches `data/fantasy/boxscores/espn-<eventId>.json`), or the ESPN summary API (event 401872963). Grade every leg (set `status`, `actual_stat`), then settle each ticket with the §1 #5 field convention. Ask Andy for the master RR's actual Bookmaker payout (RR `settlement_method` is `manual_bookmaker_ticket_payout`).
2. **Close Week 3**: confirm 0 unsettled W3 tickets; recompute cash staked / returned / net and the Novig credit results. Update the ledger MNF section (D12–D13 already logged as pending) with results and a Week 3 net — edit `docs/claude-project-dev/recommendation-ledger-2026.md` and push the same content to the claude.ai DEV project `claude/recommendation-ledger-2026.md`. Re-run Team 2's `t2a…t2d` + `build_report.py` with MNF included and republish the W1–3 Basket Review.
3. **Update the Week 3 post-mortem** in `reports/bets/season-recap/` (same format as `week1-post-mortem.html` / `week2-post-mortem.html`; Week 3 currently says "MNF pending"). Update season-to-date tables in all three.
4. **Build the repeatable weekly analysis** Andy wants to return to at the end of every NFL week:
   - One script (extend Team 2's own `reports/analysis/w1-3-deep/claude/scripts/` — `core.py`, `t2a…t2d`, `build_report.py` — into a week-parameterised version, e.g. `reports/analysis/season/claude/`; stay out of Codex's folders) that reads the settled wagers file and produces per-week and season-to-date tables: stake/return/net by book, ticket family (game parlays, RRs, prop stacks, island SGP ladders, promo credits), leg market, legs-per-ticket, price band, and Claude-recommended vs Andy-built.
   - Leg-level hit rates by market (the Team 2 findings: pass volume ≥35 att for receiving props, team 3+ TD for ATD, QB INT/pass-TD markets, sacks) so each week tests the hypotheses in `reports/analysis/w1-3-deep/claude/SUMMARY.md`.
   - Output: a report + republish the **W1–3 Basket Review** artifact (https://claude.ai/artifact/K7YdWU2GMvdqG7HFfZUFMF) as a season-to-date version, or a new season artifact, plus `[claude]` FINDINGS.md entries.
   - Document the weekly runbook (settle → close-out script → post-mortem → artifact) in `docs/NFL_WEEKLY_CARD_PROCESS.md`.
5. Still open from earlier: Codex C1/C4 (canonical table) not landed; wrong `actual_stat: 0` on 9 LOST legs (`claude/scripts/zero_sweep.py`); pick promotion stale since 9/25 (needs OK); research-intel-ingest dry run hang.

## 4. Guardrails (unchanged)
`main` only; never pull/reset/clean/stash or `git add -A`; commit via temp `GIT_INDEX_FILE` + `read-tree <ls-remote sha>` + `commit-tree` + `git push origin <sha>:refs/heads/main`. No wagers, account actions, TheOddsAPI calls, **Supabase writes or Bankroll sync** without Andy's explicit per-action OK (the W1–3 settlements are local-only; Andy was offered a sync after MNF, not yet approved). Every player named must pass `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict`. Prop round robins are ruled out. The wagers file is gitignored — keep its backups.

## 5. Resume prompt — Claude Team 2

```
You are Claude Team 2, the partner Claude team, taking NFL_Dashboard back from Claude Team 3. Work in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Everything you need is in the local repo. Read HANDOFF.md, then handoffs/2026-09-28-1910-claude-team3-mnf-placed-w1-3-settled-weekly-analysis-handoff.md end to end, then your own reports/analysis/w1-3-deep/claude/SUMMARY.md and week4-build-checklist.md, docs/claude-project-dev/recommendation-ledger-2026.md (MNF entries D12–D13), reports/bets/week3-mnf-phi-chi-prop-stacks-2026-09-28.md, and reports/bets/season-recap/week2-post-mortem.html (format reference). Reconcile Git without pull/reset/clean/stash or `git add -A`; stale .git locks exist, so commit via a temp GIT_INDEX_FILE + read-tree <origin sha from `git ls-remote origin refs/heads/main`> + commit-tree and push with `git push origin <sha>:refs/heads/main`.

Context from Team 3: Weeks 1 and 2 are fully settled in data/official-picks/user-placed-wagers-2026.json (gitignored; matches the post-mortems to the cent), and Week 3 is settled except 8 MNF-dependent tickets: master RR #739361263 (PHI −3), Novig credits #1 and #2 (trade credit), and BetOnline #1000551349, #1000552599, #1000554327, #1000553845, #1000553267. Settlement fields: status SETTLED, result, settled_payout_usd, profit_usd, graded_at.

Tasks, in order:
1. Grade MNF PHI @ CHI (ESPN event 401872963) from the final box score (`node scripts/generate-live-tracker.mjs --week 3` caches it) and settle the 8 open tickets; ask Andy for the master RR's actual Bookmaker payout. Regenerate the Live Tracker.
2. Close Week 3 (cash staked $498.41 incl. MNF; Novig results as credit value), update the ledger MNF section with results and a Week 3 net in docs/claude-project-dev/recommendation-ledger-2026.md and the claude.ai DEV project copy.
3. Update the Week 3 post-mortem (currently "MNF pending") and the season-to-date tables in all three post-mortems.
4. Re-run your t2a…t2d + build_report.py with MNF included; republish the W1–3 Basket Review artifact (https://claude.ai/artifact/K7YdWU2GMvdqG7HFfZUFMF); append [claude] entries to reports/analysis/w1-3-deep/FINDINGS.md.
5. Build the repeatable end-of-week analysis Andy will return to every week (handoff §3.4): a week-parameterised script reading the settled wagers file (stake/return/net by book, ticket family, leg market, legs per ticket, price band, Claude-recommended vs Andy-built; leg hit rates testing your W1–3 hypotheses), a season-to-date report/artifact, and the weekly runbook in docs/NFL_WEEKLY_CARD_PROCESS.md. Stay in the Claude folders; Codex C1/C4 outputs, when they land in reports/analysis/w1-3-deep/codex/, become the canonical inputs.
Flag conclusions under ~2 SE as hypotheses. No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK (Andy was offered a W1–3 Bankroll sync after MNF; not yet approved). Every player named must pass `npm run roster:vet -- --week <N> --date <capture-date> --fetch --strict`. Prop round robins are ruled out. Hand off with a dated file in handoffs/ and update HANDOFF.md.
```
