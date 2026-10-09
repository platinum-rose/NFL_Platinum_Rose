# Action Network Week 5 live-picks review status

- Reviewed source: `2026-10-09-action-network-week5-live-picks-splits-capture.md`
- Classification: source inventory and public-betting snapshot only.
- Excluded from review: completed TB @ DAL records; no result-based backfilling into the remaining slate.
- No selections are promoted as recommendations, placed tickets, or official portfolio entries.

## Coverage

- 14 scheduled Week 5 games were visible in Action’s game-indexed NFL feed.
- 263 listed pick objects were present across those games.
- Action ticket and money percentages were visible for spread, total, and moneyline under the page’s unlabeled numeric `book_id: 15` feed.

## Review blockers

1. The 263 raw rows are preserved in the paired source-evidence JSONL. They have not been promoted as recommendations, official picks, tickets, or portfolio items.
2. The Action payload did not identify the sportsbook name corresponding to numeric `book_id: 15`; preserve that identifier exactly rather than guessing the source book.
3. Split percentages and displayed prices are time-sensitive observations, not verified executable prices.
4. Line conflicts exist against the user-supplied SuperContest board (for example, Action displayed WAS -4.5 while SuperContest is WAS -3.5, and Action displayed CHI -1.5 while SuperContest is CHI -3). Never silently substitute one board for the other.
