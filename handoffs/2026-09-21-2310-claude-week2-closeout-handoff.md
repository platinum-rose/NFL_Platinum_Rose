# Handoff — Week 2 close-out complete (2026-09-21 ~23:10 PT)

Repo `E:\dev\projects\NFL_Dashboard` · branch `wip/yahoo-sync` (pushed, HEAD `e02482e`) · Supabase `aambmuzfcojxqvbzhngp`.
Supersedes the pickup items in `handoffs/2026-09-22-0240-claude-to-claude-full-project-handoff.md` §6–7.

## State: Week 2 fully closed

- **Every Week 2 leg graded** against ESPN finals. **Every Week 2 ticket SETTLED** (34 tickets: 3 wins, 31 losses). Nothing pending except futures.
- **Week 2 net −$297.55 on $428.79 · season −$587.76 on $799.56.** Wagers JSON, Supabase `user_bankroll_bets` and the post-mortem all agree to the cent.
- Winners: TNF BKR SGP 738851934 (+$49.90), dog-ML RR **739004327 (+$24.88, confirmed)**, SC-fade RR **739003867 (+$1.39, confirmed)**.
- **Supabase (Andy-approved 2026-09-21):** 28 rows settled, 6 missing MNF rows inserted, BUF SB future row deleted. Week 1 27 rows / Week 2 34 rows, 0 pending.
- **BUF SB future 996987591 ($9.09 @ +950)** moved out of the wagers file into `data/futures-imports/andy-portfolio-ledger-2026.json` → `bills_sb` now $59.09, blended +992, $140.91 cap room.
- **Live tracker rebuilt for Week 3** (16 games, TNF ATL @ GB). Empty until Week 3 tickets are logged. Both copies byte-identical.

## Committed tonight (all pushed)

| Commit | What |
|---|---|
| f71df4a | BEO live parser + BKR live normalizer + 11 tests (were never committed) |
| 55a582f | Tracker: 🚑 Out informational, separate from 🔥 Burnt; Hide Injured Legs filter |
| 5408b4d | Week 2 post-mortem, lessons, card-process rule updates |
| 465a153 | Futures ledger BUF ticket + `data/sportsbooks/promotions-2026.json` |
| 70c36ec | Codex's HANDOFF.md trim + dated handoffs |
| 74aa512 | Post-mortem: confirmed RR payouts |
| e02482e | Bankroll sync: use `profit_usd` for partial RR wins (was booking full potential win) |

Not committed by design: wagers JSON + public copy (gitignored, real-money data), tracker HTML (embeds wager data), ~250 of Andy's own WIP files.

## Read these first next session

1. `docs/tracked-wagers/week2_2026_analysis.md` — the post-mortem (leg-level hit/ROI by type and price band, graveyard, Week 3 patterns).
2. `docs/NFL_WEEKLY_CARD_PROCESS.md` — rules changed tonight (below) + new 2-team RR format + step 0 promo check.
3. `data/sportsbooks/promotions-2026.json` — promos, credits, rewards.
4. DEV project doc `claude/recommendation-ledger-2026.md` — Week 2 graded (all 12 divergences IRRELEVANT; Claude's own afternoon picks were the weak link).

## Rules — corrected tonight (Andy)

- **Leg barrier −350** (the old "no leg past −150" was invented by a Claude session, never Andy's). Flag stacks with >2 legs shorter than −200.
- **QB rushing / INT props allowed when the matchup fits** — state the fit. (Old blanket ban was Claude-invented.)
- **Player missing from the final box score = leg LOST.**
- 2-team round robins go on **Bookmaker** (loyalty BetPoints; prop RRs at BEO would be manual slip entry). Formats: prop RR 5 selections × $2, dog-ML RR 6 × $1.33, 2u each. BetPoints are **not** earned on moneylines.
- **QB concentration:** treat each starting QB as one shared risk across every leg on his offense (MNF Dart injury: Giants-dependent legs 4-15).

## Week 3 patterns from the post-mortem (season, unique legs)

- Leak: −120 to −100 legs 31-45 (−23%); spread dogs 10-20 (−44%); receiving yds −27%, receptions −18%; heavy ML chalk ≤−290 6-4 vs ~78% implied.
- Edge: tackles+assists 9-4 (+22%), passing TDs 8-3 (+14%), dog MLs +21%; props on the side that wins 56% vs 39%.
- 0 of 26 straight parlays with 5+ legs cashed; all 3 winners were 2-leg / 2-team structures.

## Promotions / rewards

- **BEO Bills-win free-bet credit** ($10, sides/totals at −110 only, stake not returned; win = $9.09). Week 2 credit due **Wed 9/23 by 7pm ET**. Default plan (Andy's): Bills' next opponent ATS at the most points → **LAC + points** this week. First winner clears the $9.09 BUF boost.
- **BEO reloads $2.85** — hold until futures/exacta markets repost; Packers SB if ≥ +2500.
- **BKR BetPoints 6,899.35 (Platinum)** — convert in season for futures adds; check cash rate.
- **BEO Primetime Parlay Insurance** — likely recurring; terms unverified (max stake, one-leg-miss vs any loss).

## Open items

1. **Codex BKR parser** — requested (`handoffs/2026-09-21-1810-...`), not delivered. BKR captures still go through `scripts/props/bookmaker-live-normalize.mjs`.
2. **9 NULL BEO ticket numbers** (Andy fills from bet history).
3. **eslint pass** on `scripts/generate-live-tracker.mjs` (unreliable in the device bridge).
4. Paper AI Master RR (`paper-wagers-2026.json`) still PENDING — grades to ≈$10.41 back on $105 paper.

## Environment notes

- Device shell was intermittently down tonight; `device_stage_files` / `device_commit_files` worked as a fallback.
- Device VM has **no network** (ESPN fetch fails) — final box scores came from Firecrawl scraping the ESPN summary API (`maxAge: 0`); WebFetch returned a stale mid-game cache.
- Git needs delete permission on `E:\dev` to clear `.git/*.lock` and `tmp_obj_*` after each commit — request it once per session.
- `sync-placed-wagers-to-bankroll.mjs` upserts to Supabase unless `--dry-run`, and `--dry-run` also skips the public JSON copy. Supabase writes need Andy's per-change OK.
