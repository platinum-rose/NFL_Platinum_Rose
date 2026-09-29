# Claude Team 3 → next Claude session: MNF tickets placed + tracked, Weeks 1–2 closed, Week 3 open on MNF only

**Written:** Mon 2026-09-28 ~19:10 PT by Claude Team 3 (Cowork). **Replaces** `handoffs/2026-09-28-1515-claude-team2-w1-3-deep-analysis-mnf-intel-handoff.md` as the pick-up point. Guardrails (§6 of that file) are unchanged.

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

## 3. NEXT SESSION — tasks in order
1. **Grade MNF** from the final box score: `node scripts/generate-live-tracker.mjs --week 3` (caches `data/fantasy/boxscores/espn-<eventId>.json`), or the ESPN summary API (event 401872963). Grade every leg (set `status`, `actual_stat`), then settle each ticket with the §1 #5 field convention. Ask Andy for the master RR's actual Bookmaker payout (RR `settlement_method` is `manual_bookmaker_ticket_payout`).
2. **Close Week 3**: confirm 0 unsettled W3 tickets; recompute cash staked / returned / net and the Novig credit results. Verify against the ledger (`claude/recommendation-ledger-2026.md` in the claude.ai DEV project, mirrored at `docs/claude-project-dev/recommendation-ledger-2026.md`); add MNF results + a Week 3 net.
3. **Update the Week 3 post-mortem** in `reports/bets/season-recap/` (same format as `week1-post-mortem.html` / `week2-post-mortem.html`; Week 3 currently says "MNF pending"). Update season-to-date tables in all three.
4. **Build the repeatable weekly analysis** Andy wants to return to at the end of every NFL week:
   - One script (e.g. `scripts/analysis/weekly-closeout.py` or extend `reports/analysis/w1-3-deep/claude/scripts/`) that reads the settled wagers file and produces per-week and season-to-date tables: stake/return/net by book, ticket family (game parlays, RRs, prop stacks, island SGP ladders, promo credits), leg market, legs-per-ticket, price band, and Claude-recommended vs Andy-built.
   - Leg-level hit rates by market (the Team 2 findings: pass volume ≥35 att for receiving props, team 3+ TD for ATD, QB INT/pass-TD markets, sacks) so each week tests the hypotheses in `reports/analysis/w1-3-deep/claude/SUMMARY.md`.
   - Output: a report + republish the **W1–3 Basket Review** artifact (https://claude.ai/artifact/K7YdWU2GMvdqG7HFfZUFMF) as a season-to-date version, or a new season artifact, plus `[claude]` FINDINGS.md entries.
   - Document the weekly runbook (settle → close-out script → post-mortem → artifact) in `docs/NFL_WEEKLY_CARD_PROCESS.md`.
5. Still open from earlier: Codex C1/C4 (canonical table) not landed; wrong `actual_stat: 0` on 9 LOST legs (`claude/scripts/zero_sweep.py`); pick promotion stale since 9/25 (needs OK); research-intel-ingest dry run hang.

## 4. Guardrails (unchanged)
`main` only; never pull/reset/clean/stash or `git add -A`; commit via temp `GIT_INDEX_FILE` + `read-tree <ls-remote sha>` + `commit-tree` + `git push origin <sha>:refs/heads/main`. No wagers, account actions, TheOddsAPI calls, **Supabase writes or Bankroll sync** without Andy's explicit per-action OK (the W1–3 settlements are local-only; Andy was offered a sync after MNF, not yet approved). Every player named must pass `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict`. Prop round robins are ruled out. The wagers file is gitignored — keep its backups.

## 5. Resume prompt
```
You are the Claude session picking up NFL_Dashboard from Claude Team 3. Work in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then handoffs/2026-09-28-1910-claude-team3-mnf-placed-w1-3-settled-weekly-analysis-handoff.md end to end, then reports/analysis/w1-3-deep/claude/SUMMARY.md and reports/bets/season-recap/week2-post-mortem.html (format reference). Commit only via the temp GIT_INDEX_FILE + read-tree <origin sha from ls-remote> + commit-tree flow; push with `git push origin <sha>:refs/heads/main`.

Tasks: (1) grade MNF PHI @ CHI from the final ESPN box score and settle the 8 open Week 3 tickets in data/official-picks/user-placed-wagers-2026.json (ask Andy for master RR #739361263's actual payout); (2) close Week 3 and update the ledger (claude.ai DEV project claude/recommendation-ledger-2026.md + docs/claude-project-dev mirror); (3) update the Week 3 post-mortem and season-to-date tables; (4) build a repeatable end-of-week analysis (script + runbook + season-to-date report/artifact) per handoff §3.4. No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK.
```
