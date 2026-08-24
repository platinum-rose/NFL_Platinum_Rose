# Podcast Re-Extraction Runbook

**Built:** 2026-07-15 (S273) · **Run from:** Windows PowerShell · **Repo:** `E:\dev\projects\NFL_Dashboard`

## What this does & why

The original ingest (`podcast-ingest.js`) fed only the **first ~12,000 characters** of each
transcript to GPT-4o — the opening ~15–20% of an episode — so most of every episode's intel was
never analyzed. The raw transcript is already stored in `podcast_transcripts.transcript_text`, so
we can re-analyze **for free** (no re-transcription): `podcast-reextract.js` chunks the **full**
transcript, extracts per chunk with GPT-4o, and merges + dedupes picks and intel.

It is **non-destructive**: results go to a new `podcast_reextractions` table keyed by
`(episode_id, model)`. Your baseline `podcast_transcripts.picks/.intel` is untouched, so you can
A/B the old vs new extraction. It also writes each episode's intel to **Obsidian** as a markdown
note at `NFL/Podcasts/<Show>/<pub_date>-<slug>.md` — the first time podcast intel is persisted to
the vault, not just Supabase.

> **Do the podcast catch-up first.** This only re-analyzes episodes that already have a stored
> transcript (`status='done'`). Run the fixed `podcast-ingest.js` catch-up first so the archive is
> as complete as possible, then re-extract.

> **Scope note:** this script handles game-level **picks + intel**. Season-long **Futures**
> (division/conference/Super Bowl/MVP predictions, per host, with cited stats and quotes) are a
> separate pipeline — `agents/podcast-host-summary.js`, see `docs/PODCAST_HOST_SUMMARY_PIPELINE_PLAN.md`.

## Prerequisites

1. **Apply the migration** (Supabase → SQL editor): paste the contents of
   `supabase/migrations/030_podcast_reextractions.sql` and run it once.
2. **Obsidian running** with the Local REST API plugin (only needed for the vault-write step; use
   `--no-vault` to skip). `.env` must have `OBSIDIAN_API_URL` + `OBSIDIAN_API_KEY`; confirm reachable:
   ```powershell
   node -e "require('dotenv').config(); const https=require('https'); const a=new https.Agent({rejectUnauthorized:false}); fetch(process.env.OBSIDIAN_API_URL||'https://localhost:27123',{dispatcher:undefined}).catch(e=>console.log('use curl below'))"
   curl.exe -k -H "Authorization: Bearer $((Get-Content .env | Where-Object {$_ -match '^OBSIDIAN_API_KEY='}) -replace '^OBSIDIAN_API_KEY=','')" "$((Get-Content .env | Where-Object {$_ -match '^OBSIDIAN_API_URL='}) -replace '^OBSIDIAN_API_URL=','')/"
   ```
   (A JSON `{ "status": "OK", "authenticated": true }` means it's up.)

## Run it

**Always dry-run first** — no writes, prints the A/B counts (baseline → re-extracted) and the vault
paths it *would* write, so you can see the lift before spending tokens:
```powershell
node agents\podcast-reextract.js --dry-run
```

Start small on the freshest episodes to sanity-check quality and Obsidian formatting:
```powershell
node agents\podcast-reextract.js --since 2026-07-01 --limit 3
```

Then the full pass (idempotent — skips episodes already re-extracted for this model):
```powershell
node agents\podcast-reextract.js
```

Useful flags: `--episode <uuid>` (one episode), `--no-vault` (Supabase only), `--overwrite` (redo
existing rows), `--limit N`, `--since YYYY-MM-DD`, `--model gpt-4o` (the model knob).

## Verify (A/B)

The run prints a per-episode `merged: N picks, M intel (was X/Y)` line and a totals summary. To
compare in SQL (Supabase editor):
```sql
select e.title,
       jsonb_array_length(t.picks) as baseline_picks,
       jsonb_array_length(r.picks) as reextract_picks,
       jsonb_array_length(t.intel) as baseline_intel,
       jsonb_array_length(r.intel) as reextract_intel,
       r.chunk_count, r.transcript_chars, r.vault_path
from podcast_reextractions r
join podcast_episodes   e on e.id = r.episode_id
join podcast_transcripts t on t.episode_id = r.episode_id
where r.model = 'gpt-4o'
order by e.title;
```
Portfolio-level: `select sum(jsonb_array_length(picks)) picks, sum(jsonb_array_length(intel)) intel from podcast_reextractions where model='gpt-4o';` versus the same over `podcast_transcripts`.

In **Obsidian**, open `NFL/Podcasts/` — each processed episode is a note with a Picks table + Intel
list and `sensitivity: green` frontmatter.

## Fable-5 pass — superseded, moved to the host-summary pipeline

**Retired 2026-07-20.** This section used to describe running this script's picks/intel
re-extraction through Fable-5 for A/B comparison (`--model fable-5`). That never got built — the
`--model` flag here still only calls OpenAI's Chat Completions endpoint, and passing `fable-5`
would just error out, not route anywhere.

Andy's decision was broader than "add a Fable branch to this script": replace the whole Fable
re-eval concept with a dedicated **per-host Futures pipeline** — `agents/podcast-host-summary.js`
— rather than bolting Fable-5 onto this picks/intel reextraction. See
`docs/PODCAST_HOST_SUMMARY_PIPELINE_PLAN.md` for the full plan; its Phase 4 is where a future
Fable-5 comparison pass belongs now (re-running the same episode set through Fable-5 against
`podcast_host_summaries`, keyed the same non-destructive `(episode_id, host, model)` way this
script's table is keyed). This script (`podcast-reextract.js`) keeps doing what it already does
well — full-transcript picks/intel re-extraction — and isn't being extended with Fable-5 itself.

## Notes

- **Cost** = LLM inference only (transcripts already exist). Roughly `chunks × episodes` GPT-4o
  calls; a 60k-char episode is ~5–6 chunks. Use `--limit` to meter a first batch.
- **Idempotent / non-destructive:** re-runs upsert per `(episode_id, model)`; baseline extraction is
  never modified.
- **Commit natively:** `agents/podcast-reextract.js` and `supabase/migrations/030_podcast_reextractions.sql`
  join your commit batch. (Applying the migration in Supabase is a separate live step.)
