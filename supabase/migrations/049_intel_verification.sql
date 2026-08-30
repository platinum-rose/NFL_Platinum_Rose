-- 049_intel_verification.sql
-- Layer 2 (Verification & Reconciliation) of the four-layer intelligence
-- architecture -- see docs/specs/CANONICAL_DATA_LAYER_AUDIT_2026-08-30.md §7.
--
-- One row per (source_table, source_id) fact, stamped with a verification
-- status by scripts/verify-intel-sources.js. Flow-through mode (Andy,
-- 2026-08-30): this table NEVER blocks anything from reaching synthesis --
-- it only records what verification found, so real throughput can be
-- observed before any gate is tightened. Re-running the verifier upserts
-- (never duplicates) a fact's latest status.

create table if not exists public.intel_verification (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,           -- e.g. 'research_pick_signals', 'podcast_host_summaries'
  source_id text not null,              -- stringified PK of the source row (int or uuid)
  verification_status text not null check (
    verification_status in ('verified', 'stale', 'unverified', 'conflicting', 'rejected')
  ),
  checks jsonb not null default '{}'::jsonb,   -- { relevance: {...}, freshness: {...}, corroboration: {...}, fidelity: {...} }
  reason text,                          -- short human-readable summary of why this status was assigned
  corroborating_sources int default 0,  -- count of independent sources agreeing, when known
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source_table, source_id)
);

create index if not exists intel_verification_status_idx on public.intel_verification (verification_status);
create index if not exists intel_verification_source_idx on public.intel_verification (source_table, source_id);

alter table public.intel_verification enable row level security;

-- Public read, matching this repo's existing pattern for research/signal tables
-- (e.g. migration 041's normalized_signals policy). Writes stay service-role-only
-- since scripts/verify-intel-sources.js connects with the service-role key.
create policy "intel_verification_public_read" on public.intel_verification
  for select using (true);
