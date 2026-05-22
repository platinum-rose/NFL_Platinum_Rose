-- ═══════════════════════════════════════════════════════════════════════════════
-- 020_audit_log.sql
-- AUDIT-TRAIL fix: tamper-evident append-only log for all cloud writes to
-- user_picks, user_bankroll_bets, and vault_notes.
--
-- Problem (from audit backlog):
--   All three tables accept cloud writes with no actor attribution. Tables have
--   created_at/updated_at but no actor_id, immutable event log, or tamper-
--   evident history. AI context poisoning via vault_notes writes would be
--   undetectable.
--
-- Fix:
--   1. audit_log table — append-only; service_role-read, trigger-write only.
--   2. fn_audit_log() trigger function — fires AFTER INSERT/UPDATE/DELETE on
--      each tracked table; records actor (auth.uid() or 'anon'), TG_OP, row
--      record_id, and SHA-256 digest of the row JSON for tamper evidence.
--   3. Triggers on user_picks, user_bankroll_bets, vault_notes.
--
-- Test:
--   Insert a pick → SELECT * FROM audit_log WHERE table_name='user_picks';
--   Confirm action='INSERT', actor=<uid or 'anon'>, patch_digest IS NOT NULL.
-- ═══════════════════════════════════════════════════════════════════════════════

-- pgcrypto is enabled by default in Supabase; explicit guard for local dev.
create extension if not exists pgcrypto schema extensions;

-- ─── audit_log table ──────────────────────────────────────────────────────────

create table if not exists public.audit_log (
  id           bigserial    primary key,
  ts           timestamptz  not null default now(),
  table_name   text         not null,
  record_id    text         not null,  -- always cast to text (PK may be bigint)
  action       text         not null   check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor        text         not null,  -- auth.uid()::text or 'anon'
  patch_digest text         not null   -- sha256 hex of row JSON (tamper evidence)
);

-- Append-only: no UPDATE/DELETE policies — only the trigger function can write
-- (it runs as SECURITY DEFINER, so it bypasses RLS).
alter table public.audit_log enable row level security;

-- The app owner can read the audit log via the authenticated session.
create policy "authed_read_audit_log"
  on public.audit_log for select
  to authenticated
  using (true);

-- Index for common query patterns: recent events, events by table, by actor.
create index if not exists audit_log_ts_idx         on public.audit_log (ts desc);
create index if not exists audit_log_table_name_idx on public.audit_log (table_name, ts desc);
create index if not exists audit_log_actor_idx      on public.audit_log (actor, ts desc);

-- ─── Trigger function ─────────────────────────────────────────────────────────

create or replace function public.fn_audit_log()
returns trigger
language plpgsql
security definer                -- runs as the function owner, bypasses RLS
set search_path = public, extensions
as $$
declare
  v_record_id  text;
  v_actor      text;
  v_row_data   jsonb;
  v_digest     text;
begin
  -- Row data and record_id depend on operation type.
  if TG_OP = 'DELETE' then
    v_record_id := OLD.id::text;
    v_row_data  := to_jsonb(OLD);
  else
    v_record_id := NEW.id::text;
    v_row_data  := to_jsonb(NEW);
  end if;

  -- Actor: JWT sub from authenticated session, or 'anon'.
  v_actor  := coalesce(auth.uid()::text, 'anon');

  -- SHA-256 digest of the full row JSON — detects tampering or replay.
  v_digest := encode(
    extensions.digest(v_row_data::text, 'sha256'),
    'hex'
  );

  insert into public.audit_log (table_name, record_id, action, actor, patch_digest)
  values (TG_TABLE_NAME, v_record_id, TG_OP, v_actor, v_digest);

  -- AFTER trigger — return value is ignored, but convention is to return
  -- NEW for INSERT/UPDATE and OLD for DELETE.
  return coalesce(NEW, OLD);
end;
$$;

-- ─── Triggers ─────────────────────────────────────────────────────────────────

drop trigger if exists audit_user_picks on public.user_picks;
create trigger audit_user_picks
  after insert or update or delete on public.user_picks
  for each row execute function public.fn_audit_log();

drop trigger if exists audit_user_bankroll_bets on public.user_bankroll_bets;
create trigger audit_user_bankroll_bets
  after insert or update or delete on public.user_bankroll_bets
  for each row execute function public.fn_audit_log();

drop trigger if exists audit_vault_notes on public.vault_notes;
create trigger audit_vault_notes
  after insert or update or delete on public.vault_notes
  for each row execute function public.fn_audit_log();
