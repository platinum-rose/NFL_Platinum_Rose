-- DS-4 extension: add author field to intel notes and pick signals
-- Populated by research-intel-ingest.js from dc:creator / author RSS tags.
-- NULL for sources that don't publish per-article bylines (ESPN, Rotowire).

alter table public.research_intel_notes
  add column if not exists author text;

alter table public.research_pick_signals
  add column if not exists author text;

comment on column public.research_intel_notes.author   is 'Byline parsed from dc:creator / <author> RSS tag. NULL when source does not publish per-article authors.';
comment on column public.research_pick_signals.author  is 'Copied from the parent research_intel_notes.author at signal-extraction time.';
