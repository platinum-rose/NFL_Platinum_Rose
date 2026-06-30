"""Build and upsert vault notes for podcast episodes.

Writes to Supabase vault_notes table (same table used by futures report).
Path convention: NFL/Podcasts/{show_name}/{pub_date}-E{episode}.md

Schema notes (012_vault_notes.sql):
  - source CHECK: 'manual' | 'obsidian_sync' | 'agent'  — use 'agent'
  - no episode_id column — encoded in tags as 'episode:<id>'
  - upsert conflict key: path (unique)
"""
from __future__ import annotations

import json
from datetime import datetime, timezone


def build_vault_note(
    *,
    show_name: str,
    episode_number: str | int,
    pub_date: str,              # YYYY-MM-DD
    hosts: list[str],
    duration_str: str,
    picks: list[dict],
    intel: list[str | dict],
    segments: list[dict],       # diarized segments for transcript index
    model_info: str,
) -> tuple[str, str]:
    """Return (vault_path, markdown_content).

    picks: list of pick dicts from extract.run() output.
    intel: list of intel strings or dicts. Strings are used as-is; dicts
           are expected to have 'speaker', 'category', and 'point' keys.
    segments: diarized segment dicts with 'start', 'speaker', 'text' keys.
    """
    path = f"NFL/Podcasts/{show_name}/{pub_date}-E{episode_number}.md"

    # Build picks table rows
    pick_rows = '\n'.join(
        f"| {p.get('category', '?')} | {p.get('selection', '?')} "
        f"| {_fmt_odds(p.get('odds_american') or p.get('odds'))} "
        f"| {p.get('speaker') or '—'} | {(p.get('summary') or '')[:120]} |"
        for p in picks
    ) or '| — | — | — | — | No picks extracted |'

    # Build intel bullets — accept both str and dict items
    intel_bullets = '\n'.join(_fmt_intel_bullet(i) for i in intel) or '_No intel items._'

    # Build transcript index
    index_rows = _build_transcript_index(segments)

    hosts_yaml = '\n'.join(f'  - {h}' for h in hosts)
    generated = datetime.now(timezone.utc).isoformat(timespec='seconds')

    md = f"""\
---
sensitivity: green
source: {show_name}
episode: {episode_number}
pub_date: {pub_date}
hosts:
{hosts_yaml}
picks_count: {len(picks)}
intel_count: {len(intel)}
ingest_model: {model_info}
generated: {generated}
---

# {show_name} E{episode_number} — NFL Intel
*Published: {pub_date} · Duration: {duration_str}*

## Picks

| Market | Selection | Odds | Speaker | Summary |
|--------|-----------|------|---------|---------|
{pick_rows}

## Intel

{intel_bullets}

## Transcript Index

| Time | Speaker | Text |
|------|---------|------|
{index_rows}
"""
    return path, md


def _fmt_odds(val: int | float | None) -> str:
    if val is None:
        return '—'
    v = int(val)
    return f'+{v}' if v > 0 else str(v)


def _fmt_intel_bullet(item: str | dict) -> str:
    if isinstance(item, str):
        return f'- {item}'
    spk = item.get('speaker', '?')
    cat = item.get('category', 'general')
    point = item.get('point', '')
    return f'- **[{spk} · {cat}]** {point}'


def _build_transcript_index(segments: list[dict], max_rows: int = 40) -> str:
    """One row per speaker turn (collapsed by consecutive same-speaker segments), up to max_rows."""
    rows: list[str] = []
    prev_speaker: str | None = None
    for seg in segments:
        spk = seg.get('speaker') or 'Unknown'
        if spk == prev_speaker:
            continue  # same speaker continuing — skip
        prev_speaker = spk
        ts = seg.get('start', 0)
        m, s = int(ts) // 60, int(ts) % 60
        txt = (seg.get('text') or '').strip()[:80]
        rows.append(f'| {m}:{s:02d} | {spk} | {txt}... |')
        if len(rows) >= max_rows:
            break
    return '\n'.join(rows) if rows else '| — | — | No diarized segments |'


def upsert_vault_note(
    *,
    supabase_url: str,
    supabase_key: str,
    vault_path: str,
    content: str,
    episode_id: str | int,
    tags: list[str] | None = None,
    post_json=None,
) -> dict:
    """Upsert to vault_notes table. Returns the Supabase response body.

    Uses conflict resolution on the unique `path` column.
    source is forced to 'agent' (satisfies CHECK constraint in 012_vault_notes.sql).
    episode_id is stored in tags as 'episode:<id>' since there is no episode_id column.
    """
    all_tags = list(tags or [])
    ep_tag = f'episode:{episode_id}'
    if ep_tag not in all_tags:
        all_tags.append(ep_tag)
    if 'podcast' not in all_tags:
        all_tags.append('podcast')

    url = f'{supabase_url}/rest/v1/vault_notes'
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    payload = {
        'path': vault_path,
        'content': content,
        'source': 'agent',
        'tags': all_tags,
    }

    if post_json is not None:
        # Test seam: callable(url, body, headers=..., timeout=...) -> response
        return post_json(url, payload, headers=headers, timeout=15)

    import httpx  # deferred — not available in test sandbox
    with httpx.Client() as client:
        r = client.post(url, json=payload, headers=headers, timeout=15)
        r.raise_for_status()
        return r.json()
