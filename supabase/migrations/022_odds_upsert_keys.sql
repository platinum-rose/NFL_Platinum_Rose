-- DS-ODDS-IDEMPOTENT: add unique constraints so odds ingest agents can upsert
-- instead of insert, making re-runs within the same hour idempotent.
--
-- Key design:
--   Agents truncate captured_at / snapshot_time to the nearest UTC hour before
--   writing.  The unique constraint then covers (business key + hour bucket),
--   so two runs in the same hour resolve to a single row via ON CONFLICT DO
--   UPDATE rather than appending a duplicate.
--
-- game_odds_snapshots  →  unique (game_id, book, market, captured_at)
-- futures_odds_snapshots → unique (market_type, team, book, snapshot_time)

alter table public.game_odds_snapshots
  add constraint uq_game_odds_snapshot
  unique (game_id, book, market, captured_at);

alter table public.futures_odds_snapshots
  add constraint uq_futures_odds_snapshot
  unique (market_type, team, book, snapshot_time);
