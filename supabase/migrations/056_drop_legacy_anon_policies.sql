-- 056_drop_legacy_anon_policies.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- ATLAS spec 2026-10-20 §1C — finish the user-table RLS lockdown.
--
-- PREPARED FOR REVIEW ONLY. Do NOT `supabase db push` automatically.
-- Run manually in: Supabase Dashboard → SQL Editor → New query.
--
-- Why: 019_rls_user_tables.sql created permissive policies that 025 never
-- removed (025 only dropped the older "anon_all_*" ones):
--   anon_read_user_picks / anon_read_user_bankroll_bets   — SELECT USING (true)
--     for EVERY role incl. anon → anyone with the public anon key (which ships
--     in the GitHub Pages bundle) can read every pick and every bankroll bet.
--   authed_{insert,update,delete}_user_{picks,bankroll_bets} — USING (true) /
--     WITH CHECK (true) for any authenticated user.
-- Postgres OR's permissive policies together, so these silently override
-- 025's scoped picks_*/bets_* policies (user_id = auth.uid()). Dropping them
-- leaves 025 as the only rules:
--   user_picks          SELECT: own rows, legacy NULL-owner rows, source='EXPERT'
--                       INSERT/UPDATE/DELETE: user_id = auth.uid()
--   user_bankroll_bets  SELECT: own rows + legacy NULL-owner rows
--                       INSERT/UPDATE/DELETE: user_id = auth.uid()
-- Service-role writers (GitHub Actions agents, scripts/*.mjs) bypass RLS and
-- are unaffected.
--
-- Effects to expect after applying:
--   * Signed-OUT browser sessions see zero rows in user_picks /
--     user_bankroll_bets (previously everything). Sign in first.
--   * Rows with user_id IS NULL stay readable, gradable and deletable by
--     signed-in users (see picks_update / picks_delete below). To make them
--     strictly yours, claim them once, signed in as the owner:
--       UPDATE public.user_picks         SET user_id = auth.uid() WHERE user_id IS NULL AND source <> 'EXPERT';
--       UPDATE public.user_bankroll_bets SET user_id = auth.uid() WHERE user_id IS NULL;
--     (or from the SQL editor, replace auth.uid() with your auth.users.id).
--
-- Idempotent. Rollback = re-run the CREATE POLICY blocks from 019.
-- ═══════════════════════════════════════════════════════════════════════════════

begin;

-- Legacy open reads (019)
drop policy if exists "anon_read_user_picks"          on public.user_picks;
drop policy if exists "anon_read_user_bankroll_bets"  on public.user_bankroll_bets;

-- Names referenced in the 2026-10-20 dispatch brief (never created in this
-- repo's migrations, dropped defensively in case they exist in the live DB)
drop policy if exists "anon_write_user_picks"         on public.user_picks;
drop policy if exists "anon_write_user_bankroll_bets" on public.user_bankroll_bets;

-- Legacy any-authenticated-user writes (019) that override 025's scoping
drop policy if exists "authed_insert_user_picks"          on public.user_picks;
drop policy if exists "authed_update_user_picks"          on public.user_picks;
drop policy if exists "authed_delete_user_picks"          on public.user_picks;
drop policy if exists "authed_insert_user_bankroll_bets"  on public.user_bankroll_bets;
drop policy if exists "authed_update_user_bankroll_bets"  on public.user_bankroll_bets;
drop policy if exists "authed_delete_user_bankroll_bets"  on public.user_bankroll_bets;

-- Expert / legacy picks have user_id IS NULL (written by service-role agents).
-- Browser auto-grading (useAutoGrade → syncPick upsert) and pick deletion
-- only worked on them because 019's open "authed_*" policies existed. Re-scope
-- 025's update/delete policies so a signed-in user can still grade/clean up
-- ownerless rows (claiming them via syncPick's user_id) — but never touch
-- another user's rows. (025 named these "picks_update" / "picks_delete".)
drop policy if exists "picks_update"     on public.user_picks;
drop policy if exists "picks_update_own" on public.user_picks;
create policy "picks_update" on public.user_picks
  for update to authenticated
  using      (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "picks_delete"     on public.user_picks;
drop policy if exists "picks_delete_own" on public.user_picks;
create policy "picks_delete" on public.user_picks
  for delete to authenticated
  using (user_id = auth.uid() or user_id is null);

-- Same for user_bankroll_bets: bets_select (025) already shows ownerless
-- legacy rows, but bets_update / bets_delete only allowed user_id = auth.uid(),
-- so grading or deleting a legacy bet silently affected 0 rows once the 019
-- "authed_*" policies are gone.
drop policy if exists "bets_update" on public.user_bankroll_bets;
create policy "bets_update" on public.user_bankroll_bets
  for update to authenticated
  using      (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "bets_delete" on public.user_bankroll_bets;
create policy "bets_delete" on public.user_bankroll_bets
  for delete to authenticated
  using (user_id = auth.uid() or user_id is null);

-- Safety: RLS must stay enabled or the scoped policies do nothing.
alter table public.user_picks         enable row level security;
alter table public.user_bankroll_bets enable row level security;

commit;

-- Verify (expect only picks_* and bets_* rows):
--   select tablename, policyname, roles, cmd, qual
--   from pg_policies
--   where schemaname = 'public' and tablename in ('user_picks','user_bankroll_bets')
--   order by tablename, policyname;
