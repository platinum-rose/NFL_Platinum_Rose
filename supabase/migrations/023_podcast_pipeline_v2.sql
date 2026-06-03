-- ═══════════════════════════════════════════════════════════════════════════════
-- NFL Platinum Rose — Podcast Pipeline v2 (Migration 023)
-- Spec: /memories/repo/nfl-podcast-pipeline-spec.md §3 Phase 1
--
-- Goals:
--   1. Capture M6 file-system paths so full audio + transcript are preserved
--      without forcing the entire transcript through Postgres TEXT (large
--      transcripts stored on M6, excerpt only in row).
--   2. Track which extraction model produced the picks and an episode-level
--      quality score so the cloud-fallback gate can be audited.
--   3. Add per-pick category / subject / quality fields enforced by a
--      JSONB-shape CHECK constraint (without changing the column type).
--   4. Introduce share_tokens + share_views for partner Funnel access.
--
-- Backwards compatibility:
--   - All new columns are nullable / additive.
--   - transcript_text is made nullable (M6 may keep authoritative copy on disk
--     and surface only transcript_excerpt to anon clients).
--   - getPodcastEpisodes() / getPodcastTranscripts() continue to work.
--
-- Forward + rollback runnable:
--   - The DOWN section at the bottom is safe on a fresh DB or a migrated DB.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. podcast_transcripts: M6 paths + extraction telemetry ─────────────────

alter table public.podcast_transcripts
  add column if not exists audio_path                text,
  add column if not exists transcript_path           text,
  add column if not exists transcript_excerpt        text,
  add column if not exists extraction_model          text,
  add column if not exists extraction_quality_score  numeric(4,3);

-- Make transcript_text nullable so we can fall back to file-system storage.
-- (Older rows already have transcript_text populated; new rows may be NULL
--  when audio_path + transcript_excerpt are present.)
alter table public.podcast_transcripts
  alter column transcript_text drop not null;

-- Quality score must be in [0, 1] when present.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'podcast_transcripts_quality_score_chk'
  ) then
    alter table public.podcast_transcripts
      add constraint podcast_transcripts_quality_score_chk
      check (
        extraction_quality_score is null
        or (extraction_quality_score >= 0 and extraction_quality_score <= 1)
      );
  end if;
end$$;

-- Either transcript_text OR (audio_path + transcript_path) must be present.
-- Allows back-compat with rows that only have transcript_text.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'podcast_transcripts_storage_chk'
  ) then
    alter table public.podcast_transcripts
      add constraint podcast_transcripts_storage_chk
      check (
        transcript_text is not null
        or (audio_path is not null and transcript_path is not null)
      );
  end if;
end$$;

comment on column public.podcast_transcripts.audio_path is
  'Absolute M6 path of the source audio file (e.g. /var/lib/nfl/audio/<id>.mp3). NULL for legacy rows.';
comment on column public.podcast_transcripts.transcript_path is
  'Absolute M6 path of the full transcript .txt file. NULL for legacy rows.';
comment on column public.podcast_transcripts.transcript_excerpt is
  'First ~64 KB of the transcript, safe to ship to anon clients. Authoritative copy lives at transcript_path.';
comment on column public.podcast_transcripts.extraction_model is
  'Primary model used for pick extraction (e.g. qwen3:8b, gpt-4o). Set by M6 pipeline.';
comment on column public.podcast_transcripts.extraction_quality_score is
  'Episode-level extraction quality, 0..1. < 0.5 triggers cloud-model fallback (see spec §3 Phase 4).';


-- ─── 2. podcast_transcripts.picks: per-pick shape enforcement ────────────────
-- The picks JSONB is a list of objects. We enforce category enum + presence of
-- the new keys without rejecting legacy rows that pre-date this migration.
--
-- Postgres disallows subqueries directly in CHECK constraints, so the per-pick
-- validation lives in an IMMUTABLE helper function which the constraint calls.

create or replace function public.podcast_picks_v2_valid(picks jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  p jsonb;
begin
  if picks is null then
    return true;
  end if;
  if jsonb_typeof(picks) <> 'array' then
    return false;
  end if;
  for p in select * from jsonb_array_elements(picks)
  loop
    -- If category is set, it must be a known enum value.
    if p ? 'category'
       and (p->>'category') not in ('spread','total','moneyline','future','prop') then
      return false;
    end if;
    -- If quality_score is set, it must be 0..1.
    if p ? 'quality_score' then
      if (p->>'quality_score')::numeric < 0
         or (p->>'quality_score')::numeric > 1 then
        return false;
      end if;
    end if;
    -- If needs_review is set, it must be a boolean.
    if p ? 'needs_review'
       and jsonb_typeof(p->'needs_review') <> 'boolean' then
      return false;
    end if;
  end loop;
  return true;
end$$;

comment on function public.podcast_picks_v2_valid(jsonb) is
  'CHECK helper for podcast_transcripts.picks. IMMUTABLE so it can be used in a constraint. See migration 023.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'podcast_transcripts_picks_shape_chk'
  ) then
    alter table public.podcast_transcripts
      add constraint podcast_transcripts_picks_shape_chk
      check (public.podcast_picks_v2_valid(picks));
  end if;
end$$;

comment on constraint podcast_transcripts_picks_shape_chk
  on public.podcast_transcripts is
  'Enforces v2 pick shape (category enum, quality_score 0..1, needs_review bool) without breaking legacy picks lacking these keys.';


-- ─── 3. share_tokens — partner access grants ─────────────────────────────────
-- Used by Tailscale Funnel /share/* routes to gate access for Patrick, Amanda,
-- and up to 3 other partners. Service role only; anon cannot read.

create table if not exists public.share_tokens (
  token         text        primary key,
  partner_name  text        not null,
  granted_at    timestamptz not null default now(),
  expires_at    timestamptz,
  revoked_at    timestamptz,
  notes         text
);

create index if not exists share_tokens_active_idx
  on public.share_tokens (revoked_at)
  where revoked_at is null;

alter table public.share_tokens enable row level security;

-- No public_read policy → only service_role can SELECT.

comment on table public.share_tokens is
  'Partner access tokens for /share/* Funnel routes. Service role only.';


-- ─── 4. share_views — audit log of partner views ─────────────────────────────

create table if not exists public.share_views (
  id          uuid        primary key default gen_random_uuid(),
  token       text        not null references public.share_tokens(token) on delete cascade,
  route       text        not null,         -- e.g. /share/episodes/<id>
  episode_id  uuid        references public.podcast_episodes(id) on delete set null,
  viewed_at   timestamptz not null default now(),
  ip_truncated text                         -- /24 for IPv4, /48 for IPv6
);

create index if not exists share_views_token_idx
  on public.share_views (token, viewed_at desc);

create index if not exists share_views_episode_idx
  on public.share_views (episode_id, viewed_at desc)
  where episode_id is not null;

alter table public.share_views enable row level security;

-- No public_read policy → only service_role can SELECT/INSERT.

comment on table public.share_views is
  'Audit trail of /share/* partner views. Service role only.';


-- ═══════════════════════════════════════════════════════════════════════════════
-- DOWN (rollback) — keep at bottom of file; run manually when reverting.
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- drop table if exists public.share_views;
-- drop table if exists public.share_tokens;
--
-- alter table public.podcast_transcripts
--   drop constraint if exists podcast_transcripts_picks_shape_chk,
--   drop constraint if exists podcast_transcripts_storage_chk,
--   drop constraint if exists podcast_transcripts_quality_score_chk;
--
-- drop function if exists public.podcast_picks_v2_valid(jsonb);
--
-- alter table public.podcast_transcripts
--   drop column if exists extraction_quality_score,
--   drop column if exists extraction_model,
--   drop column if exists transcript_excerpt,
--   drop column if exists transcript_path,
--   drop column if exists audio_path;
--
-- -- Restoring NOT NULL only safe if no rows are NULL; check first.
-- -- alter table public.podcast_transcripts
-- --   alter column transcript_text set not null;
