#!/usr/bin/env python3
"""Permanent, append-only archive of every Master Intel / SuperContest report build.

Why: dist/ is Vite's output folder. `npm run build` empties it, and on 2026-11-02 that wiped
every weekly report packet (Weeks 1-8). Reports now live permanently in

  reports/intel/packets-archive/<season>-w<NN>/<YYYY-MM-DD-HHMM>-<label>/

Every snapshot is a new folder with a MANIFEST.json (sha256 per file). Nothing is ever overwritten
or deleted. A snapshot identical to the newest one for that week is skipped (no duplicates).

Called automatically by:
  build.py        - after every build ('build')
  export_pdf.py   - adds the PDF to the snapshot that holds the matching html
  vite.config.js  - (Node twin) snapshots dist/nfl_week*_master_packet* before `vite build`

Manual use:
  python scripts/master-intel/packet_archive.py --week 9                       # snapshot dist/nfl_week9_master_packet
  python scripts/master-intel/packet_archive.py --week 9 --label sent-to-clients --file <path.html> [--file ...]
  python scripts/master-intel/packet_archive.py --list [--week 9]
"""
import argparse, datetime, hashlib, json, re, shutil, sys
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
ARCH = ROOT / 'reports' / 'intel' / 'packets-archive'
PT = ZoneInfo('America/Los_Angeles')


def _sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()


def week_dir(week, season):
    return ARCH / f'{season}-w{int(week):02d}'


def _snapshots(week, season):
    d = week_dir(week, season)
    return sorted((x for x in d.iterdir() if x.is_dir() and (x / 'MANIFEST.json').exists()), key=lambda x: x.name) if d.exists() else []


def _manifest(d):
    try: return json.load(open(d / 'MANIFEST.json', encoding='utf-8'))
    except Exception: return {'files': {}}


def snapshot(files, week, season, label='build', source=None, when=None):
    """Copy `files` (paths) into a new snapshot folder. Returns the folder (or the existing identical one)."""
    files = [Path(f) for f in files if Path(f).is_file()]
    if not files: return None
    hashes = {f.name: _sha(f) for f in files}
    snaps = _snapshots(week, season)
    if snaps and _manifest(snaps[-1]).get('files', {}) and {k: v['sha256'] for k, v in _manifest(snaps[-1])['files'].items()} == hashes:
        return snaps[-1]                       # identical to the newest snapshot: nothing new to keep
    when = when or datetime.datetime.now(PT)
    base = week_dir(week, season) / f"{when.strftime('%Y-%m-%d-%H%M')}-{re.sub(r'[^A-Za-z0-9_-]+', '-', label)}"
    dest, n = base, 2
    while dest.exists(): dest = base.with_name(f'{base.name}-{n}'); n += 1
    dest.mkdir(parents=True)
    for f in files: shutil.copy2(f, dest / f.name)
    json.dump(dict(week=int(week), season=int(season), label=label, created_at=when.isoformat(), source=str(source or files[0].parent),
                   files={f.name: dict(sha256=hashes[f.name], bytes=f.stat().st_size) for f in files}),
              open(dest / 'MANIFEST.json', 'w', encoding='utf-8'), indent=1)
    return dest


def snapshot_dir(src_dir, week, season, label='build'):
    src_dir = Path(src_dir)
    if not src_dir.is_dir(): return None
    fs = sorted(p for p in src_dir.iterdir() if p.is_file())
    # A PDF older than its html belongs to an earlier build (export_pdf adds the fresh one later): leave it out.
    fs = [p for p in fs if not (p.suffix == '.pdf' and p.with_suffix('.html').exists() and p.stat().st_mtime < p.with_suffix('.html').stat().st_mtime)]
    return snapshot(fs, week, season, label, source=src_dir)


def attach_pdf(pdf):
    """Add a freshly exported PDF to the snapshot holding the html it was printed from (else a new 'pdf' snapshot)."""
    pdf = Path(pdf); html = pdf.with_suffix('.html')
    m = re.search(r'nfl_week(\d+)_', pdf.name)
    if not m: return None
    week = int(m.group(1)); season = _season_of(pdf.parent) or datetime.date.today().year
    hs = _sha(html) if html.exists() else None
    for d in reversed(_snapshots(week, season)):
        man = _manifest(d)
        if hs and man.get('files', {}).get(html.name, {}).get('sha256') == hs:
            tgt = d / pdf.name
            if tgt.exists() and _sha(tgt) == _sha(pdf): return d
            if tgt.exists(): break                # a different PDF is already there: never overwrite
            shutil.copy2(pdf, tgt)
            man['files'][pdf.name] = dict(sha256=_sha(pdf), bytes=pdf.stat().st_size)
            json.dump(man, open(d / 'MANIFEST.json', 'w', encoding='utf-8'), indent=1)
            return d
    return snapshot([pdf] + ([html] if html.exists() else []), week, season, 'pdf')


def _season_of(d):
    for j in Path(d).glob('nfl_week*_summary.json'):
        try: return int(json.load(open(j, encoding='utf-8')).get('season'))
        except Exception: pass
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--week', type=int); ap.add_argument('--season', type=int)
    ap.add_argument('--dir'); ap.add_argument('--label', default='manual')
    ap.add_argument('--file', action='append', default=[])
    ap.add_argument('--list', action='store_true')
    a = ap.parse_args()
    if a.list:
        for wd in sorted(ARCH.glob('*-w*')):
            if a.week and not wd.name.endswith(f'-w{a.week:02d}'): continue
            for s in sorted(x for x in wd.iterdir() if x.is_dir()):
                print(f'{wd.name}/{s.name}: {", ".join(sorted(p.name for p in s.iterdir() if p.name != "MANIFEST.json"))}')
        return
    if not a.week: sys.exit('--week is required')
    if a.file:
        d = snapshot(a.file, a.week, a.season or datetime.date.today().year, a.label)
    else:
        src = Path(a.dir) if a.dir else ROOT / f'dist/nfl_week{a.week}_master_packet'
        d = snapshot_dir(src, a.week, a.season or _season_of(src) or datetime.date.today().year, a.label)
    print(f'archived -> {d.relative_to(ROOT) if d else "nothing (no files found)"}')


if __name__ == '__main__':
    main()
