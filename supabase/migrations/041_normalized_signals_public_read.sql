-- Migration 041: add public read policy for normalized_signals
--
-- Migration 031 created this table service-role-only on purpose ("internal
-- betting data, no client access") while the only consumer was the offline
-- portfolio-synthesize.js/portfolio-dossier.js batch pipeline (which connects
-- with the service-role key and bypasses RLS regardless).
--
-- S296 wired a new `get_normalized_signals` FUTURES agent tool (agentTools.js /
-- getNormalizedSignals() in supabase.js) that reads this table from the browser
-- anon key — without a select policy it silently returns []. Andy decided
-- (2026-07-21 handoff follow-up) to open public read access, mirroring every
-- other market-data table in this repo (game_odds_snapshots, futures_odds_snapshots,
-- podcast_transcripts, etc.) rather than moving the call server-side.
--
-- Read-only: no insert/update/delete policy added. Writes still require the
-- service-role key (signal-normalize.js), unaffected by this migration.
-- Row-level filtering of is_nfl=false audit rows is handled in application
-- code (getNormalizedSignals() already applies .eq('is_nfl', true)), same
-- pattern as every other public-read table here.

create policy "public_read_normalized_signals"
  on public.normalized_signals
  for select
  using (true);
