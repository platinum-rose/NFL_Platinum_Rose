# Master Intel layout lock (from Week 12, 2026)

**Locked by Andy, Sun 11/22/2026 12:42 AM PT** ("This looks good, let's lock down this layout for next week"), on the Week 11 Saturday provisional build.
Reference copy: `reports/intel/layout-reference/2026-w11-locked/Platinum_Rose_NFL_Week11_Intel.html` (built Sun 11/22 12:17 AM PT).
Gate: `python scripts/master-intel/check_layout_lock.py --week <N>` must print PASS before the report is sent. The Week 11 build passes; Week 10 fails (44 drifts).

Change this layout only on Andy's say-so; record the change here with the date.

## What is locked

### Navigation
- The site header (Dashboard, Super Contest, Props Lab, ..., Bookmarks, plus the Reference row) is the only menu. In the single-file report, the old one-page "Week N Master Intel 🎯Picks🏈Games…" tab bar is suppressed: `build_single.py` sets `window.__mtInit = true` before the report script.
- Every internal link resolves (zero broken links), including game-page Props links and SuperContest source footnotes.

### Props Lab (`props.html`), top to bottom
1. One page title (h2): "2. Props Lab: Card Stacks, Recommended Legs, Best Prices & Prop Boards". Sub-sections are h3, including "Latest captured menus" (`market_captures.py`).
2. **Props Pool & Ladder Board first** (the Week 10 board): easy lists, not staggered per-matchup cards.
   - Board filter bar: category chips (All + Touchdowns, Passing, Rushing, Receiving, Defense, Kicking, Game & Team, with counts), Card legs only, 2+ supporters, **Gun to my head leans**, **Strong leans only**, Hide out/doubtful, search, game filter, open/close controls.
   - Each category with props has its own bar: **Sort** (Matchup/kickoff default, Strongest support, Best payout, Shortest price, Line high/low, Player A–Z; any sort other than Matchup flattens to one list, Reset restores), plus **Market, Side and Tier** drop-downs built from that category's rows (hidden when only one value).
   - Inside each category, rows are grouped by matchup; each row expands to the price ladder, intel list and book prices. Empty categories stay visible with a note.
   - Gun to my head props are **rows in this board** (purple "🎯 GTMH strong lean / lean" tag, "no Platinum Rose endorsement", no My Card buttons), never a separate card grid.
   - One `#props-<away>-<home>` anchor per game (game pages link to it).
3. Proposed prop stacks from the card.
4. Player prop research reference (not picks), last.

### Card tickets (Picks page "Parlays & round robins" + "Player prop stacks", Props Lab stacks)
- Every week carries proposals for every weekend template slot (Andy 11/14), built under the current rules (2026-W11-r2) and checked with `scripts/cards/check_overlap.py`. Week 11 set (18): Morning/Afternoon/Hybrid 4-leg BKR parlays; SuperContest 4-team + 2-team RR; Dog ML RR; 7a/7b/7d/7e/8a/8b; SNF and MNF Tiers 1-3 (T1 cash in the S21 band, T2-3 promo).
- Ticket format in `reports/bets/<season>-w<NN>-card.md`: a `## ... supersedes ...` block with `### <name> — <BOOK> — **$<stake>** — <price> (est.) — returns ...`, a `| Game | Market & line | Book | Price | Tier | Why |` table, then `Flags:` (model hit chance vs break-even, rule notes). Write over/under in lowercase in prop legs (the roster vet splits names on it). Repeat the `## SuperContest` list inside the block (build.py reads only the newest supersedes block).
- Generator: `scripts/cards/card_tickets_w11_template.py` (copy of `scratch/w11-card-tickets.py`, run from the repo root) (pricing, roster/IR vet, S5 counter, rendering, candidates JSON). For a new week, copy it, point the price sources at that week's captures, and replace the ticket definitions; nothing is placed or logged without Andy.

### SuperContest page
- Every cited `[n]` in a Pitch/Pushback has a source line: the saved `sources` map in `reports/intel/supercontest-pitches-<season>-w<NN>.json` is rendered (refs 1-6), with the old [1]/[2] text only as a fallback.

## Build order (each week)
`build.py` → `check_sc_report.py --week N` → `build_site.py <summary html>` → `check_layout_lock.py --week N` → send `Platinum_Rose_NFL_Week<N>_Intel.html`.

## Implementation files (Week 11 changes; backups `*.bak-claude-2026112[12]-*`)
`scripts/master-intel/site_extras.py` (board rows from GTMH props, filters, per-category bars, SC source footnotes), `build_site.py` (board-first order, anchors, card grid dropped), `build_single.py` (tab-bar guard), `market_captures.py` (h3), `research_evidence.py` (board link), `build.py` (SC sources), `gtmh_props.py` (BEO ATD "No" rows skipped; ESPN `injuredReserveOrOut` group honored).
