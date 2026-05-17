-- DS-4: research intel ingest tables

create table if not exists public.research_intel_notes (
  id bigserial primary key,
  source text not null,
  source_type text not null default 'article',
  url text not null,
  canonical_url text not null,
  url_hash text not null unique,
  content_hash text,
  title text,
  summary text,
  published_at timestamptz,
  confidence numeric(4,3) not null default 0.600,
  captured_at timestamptz not null default now()
);

create index if not exists research_intel_notes_source_published_idx
  on public.research_intel_notes (source, published_at desc);

create index if not exists research_intel_notes_captured_idx
  on public.research_intel_notes (captured_at desc);

create table if not exists public.research_pick_signals (
  id bigserial primary key,
  note_id bigint references public.research_intel_notes(id) on delete cascade,
  source text not null,
  team_or_market text not null,
  bet_type text not null,
  lean text not null,
  rationale text,
  event_ref text,
  confidence numeric(4,3) not null default 0.550,
  captured_at timestamptz not null default now()
);

create index if not exists research_pick_signals_note_idx
  on public.research_pick_signals (note_id);

create index if not exists research_pick_signals_captured_idx
  on public.research_pick_signals (captured_at desc);

alter table public.research_intel_notes enable row level security;
alter table public.research_pick_signals enable row level security;

create policy "public_read_research_intel_notes"
  on public.research_intel_notes for select
  using (true);

create policy "public_read_research_pick_signals"
  on public.research_pick_signals for select
  using (true);
