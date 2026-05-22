-- ═══════════════════════════════════════════════════════════════════════════════
-- 019_rls_user_tables.sql
-- RLS-WRITES fix: restrict anon writes on user_picks, user_bankroll_bets,
-- and vault_notes.
--
-- Problem (from audit backlog):
--   004_user_data.sql created permissive "for all using(true)" policies that
--   allow unauthenticated (anon) clients to insert/update/delete betting
--   records. 012_vault_notes.sql has a "service_write_vault_notes" policy that
--   lacks any role restriction, making vault note writes publicly accessible.
--
-- Fix:
--   user_picks / user_bankroll_bets:
--     - Anon reads remain open (not sensitive; personal tool).
--     - Writes (INSERT / UPDATE / DELETE) require `authenticated` role.
--       The single operator signs in with Supabase email+password; their
--       browser session JWT satisfies this check.
--   vault_notes:
--     - Reads remain public (reference content only).
--     - All writes (INSERT / UPDATE / DELETE) restricted to `service_role`.
--       Only backend agents that use SUPABASE_SERVICE_ROLE_KEY can write.
--
-- Test:
--   Anon upsert to user_picks  → 403 Forbidden
--   Authed upsert to user_picks → 200 OK
--   Service-role insert to vault_notes → 200 OK
--   Anon insert to vault_notes → 403 Forbidden
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── user_picks ───────────────────────────────────────────────────────────────

-- Remove the open "for all" policy that allowed anon writes.
drop policy if exists "anon_all_user_picks" on public.user_picks;

-- Keep public reads (no personal data, single-user personal tool).
create policy "anon_read_user_picks"
  on public.user_picks for select
  using (true);

-- Writes require an authenticated Supabase session (the app owner).
create policy "authed_insert_user_picks"
  on public.user_picks for insert
  to authenticated
  with check (true);

create policy "authed_update_user_picks"
  on public.user_picks for update
  to authenticated
  using (true)
  with check (true);

create policy "authed_delete_user_picks"
  on public.user_picks for delete
  to authenticated
  using (true);

-- ─── user_bankroll_bets ───────────────────────────────────────────────────────

drop policy if exists "anon_all_user_bankroll_bets" on public.user_bankroll_bets;

create policy "anon_read_user_bankroll_bets"
  on public.user_bankroll_bets for select
  using (true);

create policy "authed_insert_user_bankroll_bets"
  on public.user_bankroll_bets for insert
  to authenticated
  with check (true);

create policy "authed_update_user_bankroll_bets"
  on public.user_bankroll_bets for update
  to authenticated
  using (true)
  with check (true);

create policy "authed_delete_user_bankroll_bets"
  on public.user_bankroll_bets for delete
  to authenticated
  using (true);

-- ─── vault_notes ──────────────────────────────────────────────────────────────

-- Drop the open "service_write" that had no role restriction.
drop policy if exists "service_write_vault_notes" on public.vault_notes;

-- Restrict vault note writes to service_role (agents only; no frontend writes).
create policy "service_role_write_vault_notes"
  on public.vault_notes for all
  to service_role
  using (true)
  with check (true);
