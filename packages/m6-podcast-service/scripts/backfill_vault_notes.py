#!/usr/bin/env python3
"""B3 backfill: build vault notes for all `status='done'` podcast episodes.

Runs against Supabase directly — no M6 required.
Idempotent: uses upsert with `resolution=merge-duplicates` on vault_notes.path.

Usage (from repo root):
    # Dry-run (preview what would be written, no writes):
    python packages/m6-podcast-service/scripts/backfill_vault_notes.py --dry-run

    # Real run:
    python packages/m6-podcast-service/scripts/backfill_vault_notes.py

    # Custom .env location:
    python packages/m6-podcast-service/scripts/backfill_vault_notes.py --env /path/to/.env

Requires:
    pip install httpx python-dotenv  (or set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Env loading
# ---------------------------------------------------------------------------

def load_env(env_path: Path | None = None) -> dict[str, str]:
    """Load .env file, return dict of key→value (does not mutate os.environ)."""
    paths_to_try = [env_path] if env_path else [
        Path(__file__).parent.parent.parent.parent / '.env',  # repo root
        Path.cwd() / '.env',
    ]
    for p in paths_to_try:
        if p and p.exists():
            env: dict[str, str] = {}
            for line in p.read_text(encoding='utf-8').splitlines():
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, _, v = line.partition('=')
                env[k.strip()] = v.strip().strip('"').strip("'")
            print(f'[env] loaded from {p}')
            return env
    return {}


# ---------------------------------------------------------------------------
# Supabase REST helpers (stdlib only — no httpx dependency for this script)
# ---------------------------------------------------------------------------

def _sb_headers(key: str) -> dict:
    return {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }


def sb_get(url: str, key: str, path: str) -> list[dict]:
    """GET from Supabase REST, following Range headers for pagination."""
    import urllib.request
    all_rows: list[dict] = []
    offset = 0
    page = 1000
    while True:
        req = urllib.request.Request(
            f'{url}/rest/v1/{path}',
            headers={**_sb_headers(key), 'Range': f'{offset}-{offset + page - 1}'},
        )
        with urllib.request.urlopen(req, timeout=20) as r:
            batch = json.loads(r.read())
        all_rows.extend(batch)
        if len(batch) < page:
            break
        offset += page
    return all_rows


def sb_post(url: str, key: str, path: str, payload: dict) -> list[dict]:
    """POST to Supabase REST with merge-duplicates upsert."""
    import urllib.request
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f'{url}/rest/v1/{path}',
        data=data,
        headers={
            **_sb_headers(key),
            'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def sb_delete(url: str, key: str, path: str) -> None:
    """DELETE a vault_notes row by path filter."""
    import urllib.request
    req = urllib.request.Request(
        f'{url}/rest/v1/{path}',
        headers=_sb_headers(key),
        method='DELETE',
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        r.read()  # consume response


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_episode_number(title: str | None) -> str:
    """Try common episode-number patterns in a podcast episode title."""
    if not title:
        return 'unknown'
    # E1011, e1011
    m = re.search(r'\bE(\d{3,4})\b', title, re.IGNORECASE)
    if m:
        return m.group(1)
    # "Episode 1011", "Episode #1011"
    m = re.search(r'\bepisode\s*#?(\d{3,4})\b', title, re.IGNORECASE)
    if m:
        return m.group(1)
    # "#1011"
    m = re.search(r'#(\d{3,4})\b', title)
    if m:
        return m.group(1)
    # bare 3-4 digit number, excluding calendar years (1900–2099) as last resort
    for candidate in re.finditer(r'\b(\d{3,4})\b', title):
        val = int(candidate.group(1))
        if not (1900 <= val <= 2099):
            return candidate.group(1)
    return 'unknown'


def _fmt_duration(secs: int | None) -> str:
    if not secs:
        return 'unknown'
    h, rem = divmod(int(secs), 3600)
    m, s = divmod(rem, 60)
    if h:
        return f'{h}h {m}m {s}s'
    return f'{m}m {s}s'


def _pub_date_str(ts: str | None) -> str:
    """Return YYYY-MM-DD from an ISO timestamp."""
    if not ts:
        return datetime.now(timezone.utc).strftime('%Y-%m-%d')
    return ts[:10]


def _hosts_for_show(show_name: str, roster: list[dict]) -> list[str]:
    """Return non-show experts whose source matches the show name."""
    hosts = [e['name'] for e in roster if not e.get('isShow') and e.get('source') == show_name]
    return hosts or ['Unknown']


# ---------------------------------------------------------------------------
# Vault note builder (inline to avoid package import path complexity)
# ---------------------------------------------------------------------------

def _build_transcript_index(segments: list[dict], max_rows: int = 40) -> str:
    rows: list[str] = []
    prev_speaker: str | None = None
    for seg in segments:
        spk = seg.get('speaker') or 'Unknown'
        if spk == prev_speaker:
            continue
        prev_speaker = spk
        ts = seg.get('start', 0)
        m, s = int(ts) // 60, int(ts) % 60
        txt = (seg.get('text') or '').strip()[:80]
        rows.append(f'| {m}:{s:02d} | {spk} | {txt}... |')
        if len(rows) >= max_rows:
            break
    return '\n'.join(rows) if rows else '| — | — | No diarized segments |'


def _fmt_odds(val) -> str:
    if val is None:
        return '—'
    v = int(val)
    return f'+{v}' if v > 0 else str(v)


def _fmt_intel_bullet(item) -> str:
    if isinstance(item, str):
        return f'- {item}'
    spk = item.get('speaker', '?')
    cat = item.get('category', 'general')
    point = item.get('point', '')
    return f'- **[{spk} · {cat}]** {point}'


def build_vault_note(
    *,
    show_name: str,
    episode_number: str,
    pub_date: str,
    hosts: list[str],
    duration_str: str,
    picks: list[dict],
    intel: list,
    segments: list[dict],
    model_info: str,
) -> tuple[str, str]:
    path = f'NFL/Podcasts/{show_name}/{pub_date}-E{episode_number}.md'

    pick_rows = '\n'.join(
        f"| {p.get('category', '?')} | {p.get('selection', '?')} "
        f"| {_fmt_odds(p.get('odds_american') or p.get('odds'))} "
        f"| {p.get('speaker') or '—'} | {(p.get('summary') or '')[:120]} |"
        for p in picks
    ) or '| — | — | — | — | No picks extracted |'

    intel_bullets = '\n'.join(_fmt_intel_bullet(i) for i in intel) or '_No intel items._'
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


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description='Backfill vault notes for all done podcast episodes.')
    p.add_argument('--dry-run', action='store_true', help='Print notes without writing to Supabase')
    p.add_argument('--env', default=None, help='Path to .env file')
    p.add_argument('--limit', type=int, default=0, help='Process at most N episodes (0 = all)')
    args = p.parse_args(argv)

    env = load_env(Path(args.env) if args.env else None)
    sb_url = env.get('SUPABASE_URL') or os.environ.get('SUPABASE_URL', '')
    sb_key = env.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

    if not sb_url or not sb_key:
        print('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set', file=sys.stderr)
        return 1

    # Load experts roster for host resolution
    roster_path = Path(__file__).parent.parent / 'python' / 'nfl_podcast' / 'experts_roster.json'
    roster: list[dict] = json.loads(roster_path.read_text()) if roster_path.exists() else []
    if not roster:
        print('WARNING: experts_roster.json not found; hosts will be "Unknown"')

    print('\n=== Fetching episodes with status=done ===')
    episodes = sb_get(
        sb_url, sb_key,
        'podcast_episodes?select=id,title,pub_date,duration_secs,feed_id,status&status=eq.done',
    )
    print(f'Found {len(episodes)} done episode(s)')

    if not episodes:
        print('Nothing to backfill.')
        return 0

    # Fetch feeds for show names
    feeds_raw = sb_get(sb_url, sb_key, 'podcast_feeds?select=id,name')
    feeds = {f['id']: f['name'] for f in feeds_raw}

    # Fetch all transcripts (one query, then match locally)
    print('Fetching transcripts...')
    episode_ids = [ep['id'] for ep in episodes]
    # PostgREST IN filter
    ids_param = 'in.(' + ','.join(episode_ids) + ')'
    transcripts_raw = sb_get(
        sb_url, sb_key,
        f'podcast_transcripts?select=episode_id,picks,intel,model_used,extraction_model&episode_id={ids_param}',
    )
    transcripts = {t['episode_id']: t for t in transcripts_raw}
    print(f'Found transcripts for {len(transcripts)}/{len(episodes)} episode(s)')

    # Check for existing vault notes (to report skips vs updates)
    existing_raw = sb_get(sb_url, sb_key, 'vault_notes?select=path&tags=cs.{podcast}')
    existing_paths = {r['path'] for r in existing_raw}
    print(f'Existing podcast vault notes: {len(existing_paths)}')

    to_process = episodes
    if args.limit:
        to_process = episodes[:args.limit]
        print(f'(limit: processing first {args.limit})')

    print(f'\n{"[DRY RUN] " if args.dry_run else ""}Processing {len(to_process)} episode(s)...\n')

    written = 0
    skipped_no_transcript = 0
    errors = 0

    for ep in to_process:
        ep_id = ep['id']
        title = ep.get('title') or ''
        show_name = feeds.get(ep.get('feed_id', ''), 'Unknown Show')
        pub_date = _pub_date_str(ep.get('pub_date'))
        duration_str = _fmt_duration(ep.get('duration_secs'))
        episode_number = _extract_episode_number(title)
        hosts = _hosts_for_show(show_name, roster)

        tx = transcripts.get(ep_id)
        if not tx:
            print(f'  SKIP  {show_name} | {title[:50]} — no transcript row')
            skipped_no_transcript += 1
            continue

        picks = tx.get('picks') or []
        intel = tx.get('intel') or []
        if isinstance(picks, str):
            picks = json.loads(picks)
        if isinstance(intel, str):
            intel = json.loads(intel)

        model_info = ' + '.join(filter(None, [
            tx.get('model_used'), tx.get('extraction_model')
        ])) or 'unknown'

        vault_path, content = build_vault_note(
            show_name=show_name,
            episode_number=episode_number,
            pub_date=pub_date,
            hosts=hosts,
            duration_str=duration_str,
            picks=picks,
            intel=intel,
            segments=[],   # no diarized segments stored in Supabase for backfill
            model_info=model_info,
        )

        action = 'UPDATE' if vault_path in existing_paths else 'CREATE'
        print(f'  {action:6s}  {vault_path}  ({len(picks)} picks, {len(intel)} intel)')

        # Detect stale year-as-episode orphan paths (e.g. E2026 when year appeared in title)
        year = pub_date[:4]
        stale_path = f'NFL/Podcasts/{show_name}/{pub_date}-E{year}.md'
        has_stale = stale_path in existing_paths and stale_path != vault_path

        if args.dry_run:
            preview = content[:300].replace('\n', '\n         ')
            print(f'         --- PREVIEW ---\n         {preview}\n         ...')
            if has_stale:
                print(f'         [would DELETE stale] {stale_path}')
            print()
            written += 1
            continue

        try:
            ep_tag = f'episode:{ep_id}'
            sb_post(sb_url, sb_key, 'vault_notes?on_conflict=path', {
                'path': vault_path,
                'content': content,
                'source': 'agent',
                'tags': [ep_tag, 'podcast', show_name.lower().replace(' ', '-')],
            })
            written += 1
        except Exception as exc:
            print(f'  ERROR  {vault_path}: {exc}')
            errors += 1
            continue

        # Clean up the stale year-path orphan if it differs from the correct path
        if has_stale:
            try:
                encoded = stale_path.replace('/', '%2F').replace(' ', '%20')
                sb_delete(sb_url, sb_key, f'vault_notes?path=eq.{encoded}')
                print(f'  DELETE stale: {stale_path}')
            except Exception as exc:
                print(f'  WARN  could not delete stale {stale_path}: {exc}')

    print(f'\n{"[DRY RUN] " if args.dry_run else ""}Done.')
    print(f'  Written:              {written}')
    print(f'  Skipped (no tx):      {skipped_no_transcript}')
    print(f'  Errors:               {errors}')

    return 0 if errors == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
