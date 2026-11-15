# Spec: Alejandro Live Tracker (light edition)

Status: DRAFT for Andy's review, 2026-11-15 (Claude). Nothing built yet.

## 1. Goal
A phone-first page Alejandro can open himself to follow **only the tickets he has a share in**, graded live against the games the same way Andy's Live Tracker grades them, with **his share** of every stake and payout and a running "who owes whom" balance. He never sees Andy's solo or Amanda-only tickets, bankroll totals, paper tickets, futures or hedge alerts.

## 2. Who uses it
- **Alejandro**: read-only viewer, mostly on his phone during games. Not technical; no login to Andy's tools.
- **Andy**: logs tickets as today (Alejandro split flags), shares one link once, and never has to touch the page again during a game day.

## 3. Which tickets appear
Source: `data/official-picks/user-placed-wagers-2026.json` (real tickets only; `paper-wagers-2026.json` never read).

A ticket is Alejandro's when any of these is true:
- `ownership_shares.Alejandro > 0`
- `split_partner == "Alejandro"`
- `split_participants[]` contains `name: "Alejandro"` (3-way A-A-A pool)

Shown sections:
1. **Live / open this week**: status PENDING, current week.
2. **Settled this week**: cashed and burnt tickets, so he can see the day's results.
3. **Season ledger** (collapsed by default): every settled Alejandro ticket, weeks 8+.

Current data: 23 Alejandro tickets this season (13 W8, 3 W9, 7 open W10); books DKP 15, BKR 4, BEO 2, FanDuel Predicts 2.

## 4. What each ticket card shows
Reuse the mobile tracker's card (navy theme) with these changes:
- Header: book, ticket/position number, ticket type, placed time.
- **His money, not the ticket's**: "Your stake $4.99 of $9.98", "Your payout $159.80 of $319.60". Use `wagerSplit()` from `scripts/lib/wager-splits.mjs` so promo-funded tickets still charge his face-value share (Andy's 2026-11-08 rule).
- Split badge: `50/50 with Andy` or `3-way (Andy / Amanda / Alejandro)`.
- Boost badge when present (e.g. +20% DKP combo boost).
- Legs: same grading as today: live stat vs line with progress bar, status chip (WON / LOST / LIVE / PENDING / VOID), kickoff time for unstarted legs, "missing from box score = lost" rule.
- Ticket state chip: ALIVE (n of m hit), NEEDS n MORE, BURNT, CASHED.

Not shown: Andy-only notes (`progress_notes`, `needs_confirmation`, card sections, Claude pricing commentary), cash-out values, hedge suggestions.

## 5. Top summary panel (sticky)
- Open tickets alive / total.
- **His open risk** (sum of his contributions on PENDING tickets).
- **His live potential** (sum of his payout shares on tickets still alive).
- Today's result so far (his share): cashed $, burnt $, net.
- **Balance with Andy** (season): his contributions owed or paid vs his share of winnings collected. Needs a settlement field (see Open question 3).
- Freshness stamp ("Updated 1:42 PM PT", amber when older than 20 min).

## 6. Build approach
Extend the existing phone generator instead of forking the 10k-line desktop tracker:
- `scripts/generate-live-tracker-mobile.mjs` gains `--partner Alejandro` (filters tickets per section 3, switches money to his share, hides Andy-only blocks: paper card, SuperContest, hedge alerts, futures, bankroll).
- Output: `public/live-tracker-alejandro.html` + `public/live-tracker-alejandro-state.json`.
- Shared code: ESPN fetch, leg grading and `wagerSplit()` stay common, so both trackers grade a leg identically.
- npm script: `"tracker:alejandro": "node scripts/generate-live-tracker-mobile.mjs --partner Alejandro --week auto --no-paper"`.

## 7. Hosting and refresh (decision needed)
The current mobile tracker is a **static snapshot**: grading is baked in at build time because the claude.ai artifact sandbox blocks live fetches, so it is only as fresh as the last republish.

| Option | How Alejandro opens it | Freshness | Cost / risk |
|---|---|---|---|
| **A. Claude artifact, snapshot (recommended for v1)** | Andy shares the artifact link once from claude.ai (Claude cannot change sharing) | Re-generated + republished to the same link on a schedule | A scheduled refresh run uses Claude time every interval; link is viewable by anyone Andy shares it with |
| B. Static host with live polling (e.g. GitHub Pages on the repo's `docs/`) | Plain URL | Live: the page polls ESPN itself, like the desktop tracker | Pages on this repo may need a paid plan or a public repo; the page would be public |
| C. Snapshot pushed to a Google Drive / Doc | Drive link | Same as A | Weakest phone experience |

Refresh for option A: game-day schedule (Sun 10:00 AM-9:30 PM PT, Mon/Thu nights) every 15 minutes: run the generator on Andy's laptop, then republish to the fixed artifact slug. Needs the laptop awake with the Claude desktop app open.

## 8. Acceptance checks
1. Ticket set equals the section 3 filter exactly (today: 7 open W10 tickets: 60103599, 60113104, 60135712, 60166483, 741845600, the boosted 5-pick, 60555716).
2. No Andy-solo, Amanda-only or paper ticket appears; page source contains no bankroll, hedge or futures text.
3. Every money figure equals `wagerSplit()` (e.g. 60555716: stake $5.00, payout $188.00).
4. Leg states match the desktop tracker for the same build time.
5. Renders at 380px width with no horizontal scroll; tap targets 44px+.
6. Freshness stamp turns amber after 20 minutes without a refresh.

## 9. Open questions for Andy
1. **Hosting**: A (artifact snapshot), B (live page on a static host) or C?
2. **Refresh cadence** if A: every 15 min on game days, or on demand only?
3. **Settlement balance**: track payments between you two? Needs a small `alejandro-settlements-2026.json` (date, amount, direction, note) so the balance is right.
4. **3-way A-A-A pool tickets**: show Amanda's name to Alejandro, or just "3-way pool"?
5. **History depth**: season ledger from W8 (when splits began) or only the current week?
6. **Notes**: should he see a one-line "why" per ticket (e.g. "Lake 6+ from the tackle model"), or legs only?

## 10. Out of scope (v1)
Bet placement, cash-out values, hedging, notifications/push, Alejandro editing anything, paper/AI card, SuperContest, futures.

## 11. Andy's decisions (2026-11-15 9:47 AM PT)
1. Hosting: **A** (claude.ai artifact snapshot, shared by link).
2. Refresh: Andy asked about every 2 minutes on Sundays. Pending: scheduled tasks normally run at most hourly, and each refresh is a full Claude run (see reply); options are hourly + on-demand, or Option B for true live.
3. Settlement balance: **not needed now** (rolling balance through the season). Section 5 "Balance with Andy" deferred.
4. 3-way pool tickets: **show Amanda's name**.
5. History: **full season ledger** (W8 onward).
6. One-line reason per ticket: pending Andy's pick from examples.
