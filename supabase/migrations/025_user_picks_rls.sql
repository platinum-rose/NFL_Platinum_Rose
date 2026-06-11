-- 025_user_picks_rls.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Scoped RLS for user data tables.
--
-- Replaces the permissive anon-all policies on user_picks and user_bankroll_bets
-- with per-user row-level security keyed on a new user_id column.
--
-- Service-role key (used by GHA agents) bypasses RLS entirely.
-- PickExtractionAgent and all pipeline writers need no changes.
--
-- Legacy picks (synced before this migration, user_id IS NULL) remain readable
-- to any authenticated user — run the backfill command after signing up to
-- claim them:
--   UPDATE public.user_picks
--     SET user_id = auth.uid()
--   WHERE source != 'EXPERT' AND user_id IS NULL;
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Add user_id columns (nullable — legacy rows have NULL) ────────────────

ALTER TABLE public.user_picks
  ADD COLUMN IF NOT EXISTS user_id uuid
  REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.user_bankroll_bets
  ADD COLUMN IF NOT EXISTS user_id uuid
  REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_picks_user_id_idx
  ON public.user_picks (user_id);

CREATE INDEX IF NOT EXISTS user_bankroll_bets_user_id_idx
  ON public.user_bankroll_bets (user_id);

-- ─── 2. Drop the permissive anon-all policies ─────────────────────────────────

DROP POLICY IF EXISTS "anon_all_user_picks"         ON public.user_picks;
DROP POLICY IF EXISTS "anon_all_user_bankroll_bets" ON public.user_bankroll_bets;

-- ─── 3. user_picks — scoped policies ─────────────────────────────────────────

-- SELECT: own picks + legacy unowned picks + shared expert intel
CREATE POLICY "picks_select"
  ON public.user_picks FOR SELECT
  TO authenticated
  USING (
    user_id  = auth.uid()          -- own picks
    OR user_id IS NULL             -- legacy pre-auth rows (backfill pending)
    OR source  = 'EXPERT'          -- expert picks are shared read intel
  );

-- INSERT: must attach own uid — no anonymous writes after this migration
CREATE POLICY "picks_insert"
  ON public.user_picks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: own rows only (backfill first if user_id IS NULL)
CREATE POLICY "picks_update"
  ON public.user_picks FOR UPDATE
  TO authenticated
  USING   (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: own rows only
CREATE POLICY "picks_delete"
  ON public.user_picks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─── 4. user_bankroll_bets — scoped policies ──────────────────────────────────

-- SELECT: own bets + legacy unowned
CREATE POLICY "bets_select"
  ON public.user_bankroll_bets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- INSERT: must own
CREATE POLICY "bets_insert"
  ON public.user_bankroll_bets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: own rows only
CREATE POLICY "bets_update"
  ON public.user_bankroll_bets FOR UPDATE
  TO authenticated
  USING   (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: own rows only
CREATE POLICY "bets_delete"
  ON public.user_bankroll_bets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─── 5. Picks leaderboard view ────────────────────────────────────────────────
-- Summarises win/loss record per user (personal picks only, not EXPERT).
-- Readable by any authenticated user — no PII exposed (user_id UUIDs only).

CREATE OR REPLACE VIEW public.picks_leaderboard AS
SELECT
  p.user_id,
  COUNT(*)                                                        AS total_picks,
  COUNT(*) FILTER (WHERE p.result = 'WIN')                        AS wins,
  COUNT(*) FILTER (WHERE p.result = 'LOSS')                       AS losses,
  COUNT(*) FILTER (WHERE p.result = 'PUSH')                       AS pushes,
  ROUND(
    COUNT(*) FILTER (WHERE p.result = 'WIN')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE p.result IN ('WIN','LOSS')), 0)
    * 100, 1
  )                                                               AS win_pct,
  ROUND(
    AVG(p.edge) FILTER (WHERE p.edge IS NOT NULL AND p.result != 'PENDING'),
    2
  )                                                               AS avg_edge
FROM public.user_picks p
WHERE
  p.user_id IS NOT NULL
  AND p.source != 'EXPERT'
GROUP BY p.user_id;

GRANT SELECT ON public.picks_leaderboard TO authenticated;
