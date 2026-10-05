#!/usr/bin/env python3
"""H2C2 (Handoff 2 Claude 2) snapshot builder: the mechanical half of a cross-team handoff.

Scans the handoff docs for every repo path they mention and checks each one against git and the
working tree. Files a fresh checkout would NOT have (gitignored, untracked, or dirty vs HEAD) are
copied into the snapshot folder under their original relative path, so the receiving team can read
them from any clone. Writes:
  <out>/README.md            index of the snapshot (fill the narrative briefing separately)
  <out>/file-manifest.md     every referenced path: exists / tracked / ignored / dirty / copied
  <out>/commits.md           git log for the window (newest last)
  <out>/copies/<path>        point-in-time copies of non-committed files

Read-only toward git: never stages, commits, resets or cleans. Safe with stale .git locks.

Usage:
  python3 scripts/handoff/h2c2_snapshot.py --since 2026-10-02 --slug week4-fri-mon \
      --docs handoffs/2026-10-0[2-5]*.md HANDOFF.md reports/bets/2026-w04-*.md \
      [--extra data/official-picks/user-placed-wagers-2026.json ...] [--max-file-mb 25] [--max-dir-mb 40]
"""
import argparse, datetime, glob, os, re, shutil, subprocess, sys, pathlib

ROOT = pathlib.Path(subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip() or '.')
TOP = r'(?:handoffs|reports|data|scripts|docs|dist|public|src|agents|tests|config|scratch|\.github|\.agents|logs|supabase|packages|api)'
PATH_RE = re.compile(r'(?<![\w/.-])((?:' + TOP + r')/[A-Za-z0-9_.@+,{}\-/]+|[A-Z][A-Z_]+\.md|[\w-]+\.(?:md|json|py|mjs|js|html|ps1|yml))')
ROOT_FILES = {'HANDOFF.md', 'CLAUDE.md', 'AGENTS.md', 'README.md', 'TASK_BOARD.md', 'WORKING-CONTEXT.md', 'HANDOFF_PROMPT.md', 'package.json'}

ENV = dict(os.environ)

def git(*a):
    return subprocess.run(['git', *a], cwd=ROOT, capture_output=True, text=True, env=ENV)

def expand(tok):
    tok = tok.rstrip('.,;:)/`\'"').replace('\\', '/')
    m = re.search(r'\{([^{}]*)\}', tok)  # brace expansion: a{,.x}.json
    if m:
        return [x for alt in m.group(1).split(',') for x in expand(tok[:m.start()] + alt + tok[m.end():])]
    return [tok]

SENSITIVE = re.compile(r'(^|/)(\.env[^/]*|[^/]*(secret|credential|oauth|token|password|cookie|apikey|api-key|private)[^/]*|[^/]*\.(pem|key|p12|log))$', re.I)
SECRET_RE = re.compile(rb'sk-ant-[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{32,}|AIza[0-9A-Za-z_-]{30,}|eyJhbGciOi[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|xox[bp]-[A-Za-z0-9-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY')

def has_secret(path):
    try: return bool(SECRET_RE.search(pathlib.Path(path).read_bytes()))
    except Exception: return False

def secret_ignore(src, names):
    return [n for n in names if os.path.isfile(os.path.join(src, n)) and (SENSITIVE.search(n) or has_secret(os.path.join(src, n)))]

PLACEHOLDER = re.compile(r'(HHMM|0X-|XX|\.\.\.)')

class Git:
    """One-shot git lookups so 300 paths take seconds, not minutes."""
    def __init__(self):
        self.head = {}
        for line in git('ls-tree', '-r', 'HEAD').stdout.splitlines():
            meta, path = line.split('\t', 1)
            self.head[path] = meta.split()[2]
        self.head_dirs = {d for p in self.head for d in (p.rsplit('/', i)[0] for i in range(1, p.count('/') + 1))}
    def ignored(self, paths):
        r = subprocess.run(['git', 'check-ignore', '--stdin'], cwd=ROOT, input='\n'.join(paths), capture_output=True, text=True)
        return set(r.stdout.split('\n'))
    def blobs(self, paths):
        if not paths: return {}
        r = subprocess.run(['git', 'hash-object', '--stdin-paths', '--no-filters'], cwd=ROOT, input='\n'.join(paths), capture_output=True, text=True)
        return dict(zip(paths, r.stdout.split()))

def eol_only(p):
    head = subprocess.run(['git', 'show', f'HEAD:{p}'], cwd=ROOT, capture_output=True).stdout
    return head.replace(b'\r\n', b'\n') == (ROOT / p).read_bytes().replace(b'\r\n', b'\n')

def size_of(full):
    if full.is_file(): return full.stat().st_size, 1
    tot = n = 0
    for f in full.rglob('*'):
        if f.is_file(): tot += f.stat().st_size; n += 1
    return tot, n

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--since', required=True, help='YYYY-MM-DD (local) start of the handoff window')
    ap.add_argument('--slug', required=True)
    ap.add_argument('--docs', nargs='+', required=True)
    ap.add_argument('--extra', nargs='*', default=[])
    ap.add_argument('--skip', nargs='*', default=[], help='paths you will commit with the handoff (not copied)')
    ap.add_argument('--out', default=None)
    ap.add_argument('--max-file-mb', type=float, default=25)
    ap.add_argument('--max-dir-mb', type=float, default=15)
    ap.add_argument('--tz', default='America/Los_Angeles', help='timezone for --since and commit times')
    a = ap.parse_args()
    ENV['TZ'] = a.tz
    today = datetime.date.today().isoformat()
    out = ROOT / (a.out or f'reports/handoff-snapshots/{today}-h2c2-{a.slug}')
    (out / 'copies').mkdir(parents=True, exist_ok=True)

    docs = sorted({str(pathlib.Path(p).as_posix()) for g in a.docs for p in (glob.glob(str(ROOT / g)) or [g])})
    docs = [str(pathlib.Path(d).resolve().relative_to(ROOT.resolve()).as_posix()) if os.path.isabs(d) else d for d in docs]
    refs = {}
    for d in docs:
        txt = (ROOT / d).read_text(encoding='utf-8', errors='replace')
        for m in PATH_RE.finditer(txt):
            nxt = txt[m.end():m.end() + 1]
            if nxt in '<…*{[' and nxt: continue  # truncated token like data/x-<N>.json or handoffs/2026-10-01-…
            for p in expand(m.group(1)):
                if any(c in p for c in '<>*…') or PLACEHOLDER.search(p) or p[-1] in '-_': continue
                if '/' not in p and p not in ROOT_FILES: continue
                refs.setdefault(p, set()).add(d)
    for p in a.extra: refs.setdefault(p, set()).add('(--extra)')

    outrel = out.relative_to(ROOT).as_posix()
    refs = {p: v for p, v in refs.items() if not (p == outrel or p.startswith(outrel + '/'))}
    G = Git(); ign = G.ignored(sorted(refs))
    files = [p for p in refs if (ROOT / p).is_file() and p in G.head]
    blobs = G.blobs(files)
    rows, copied, skipped, copied_dirs = [], 0, [], []
    for p in sorted(refs):
        full = ROOT / p
        exists = full.exists()
        in_head = p in G.head or p in G.head_dirs
        ignored = p in ign
        dirty = bool(exists and full.is_file() and p in G.head and blobs.get(p) != G.head[p] and not eol_only(p))
        action = ''
        will_commit = p in docs or p in a.skip
        if will_commit:
            action = 'committed with this handoff' if exists else ''
        elif exists and (ignored or not in_head or dirty) and SENSITIVE.search(p):
            action = 'SENSITIVE/log - not copied (open it on the source machine)'
        elif exists and any(p.startswith(d + '/') for d in copied_dirs):
            action = 'inside a copied dir'
        elif exists and (ignored or not in_head or dirty):
            size, n = size_of(full)
            limit = (a.max_dir_mb if full.is_dir() else a.max_file_mb) * 1e6
            if full.is_file() and has_secret(full):
                action = 'CONTAINS A CREDENTIAL-LIKE STRING - not copied'; skipped.append(p)
            elif size <= limit:
                dst = out / 'copies' / p
                if full.is_dir(): shutil.copytree(full, dst, dirs_exist_ok=True, ignore=secret_ignore); copied_dirs.append(p)
                else: dst.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(full, dst)
                action = f'copied ({size/1e6:.2f} MB{", %d files" % n if full.is_dir() else ""})'; copied += 1
            else:
                action = f'TOO LARGE ({size/1e6:.1f} MB) - not copied'; skipped.append(p)
        status = ('missing' if not exists else 'dir' if full.is_dir() else 'file')
        state = 'gitignored' if ignored else ('untracked' if exists and not in_head else ('dirty vs HEAD' if dirty else ('committed' if in_head else '')))
        rows.append((p, status, state, action, ', '.join(sorted(os.path.basename(x) for x in refs[p]))[:120]))

    with open(out / 'file-manifest.md', 'w', encoding='utf-8') as f:
        f.write(f'# File manifest — {a.slug}\n\nGenerated {datetime.datetime.now().isoformat(timespec="minutes")} by `scripts/handoff/h2c2_snapshot.py` from {len(docs)} handoff docs. '
                f'HEAD `{git("rev-parse", "--short", "HEAD").stdout.strip()}`.\n\n'
                '- **committed**: in HEAD and unchanged on disk; read it from any checkout.\n'
                '- **gitignored / untracked / dirty vs HEAD**: a fresh clone will not have this version; a point-in-time copy is under `copies/<same path>`.\n'
                '- **missing**: referenced but not on disk (deleted, renamed, never built, or a path typo in the source doc).\n\n'
                f'{len(rows)} paths; {copied} copied; {sum(1 for r in rows if r[1]=="missing")} missing; {len(skipped)} too large.\n\n'
                '| Path | Kind | Git state | Snapshot | Referenced in |\n|---|---|---|---|---|\n')
        for r in rows: f.write('| `' + r[0] + '` | ' + ' | '.join(r[1:]) + ' |\n')
    log = git('log', f'--since={a.since}T00:00:00', '--reverse', '--date=iso-local', '--format=- `%h` %ad — %s').stdout
    with open(out / 'commits.md', 'w', encoding='utf-8') as f:
        f.write(f'# Commits since {a.since} {a.tz} (oldest first; times {a.tz})\n\nOn `{git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip()}`; '
                f'remote main `{(git("ls-remote", "origin", "refs/heads/main").stdout.split() or ["?"])[0][:7]}`; HEAD `{git("rev-parse", "--short", "HEAD").stdout.strip()}`.\n\n{log}')
    readme = out / 'README.md'
    if not readme.exists():
        readme.write_text(f'# H2C2 snapshot — {a.slug}\n\nPoint-in-time copies for a cross-team handoff. Read, do not build from, do not edit.\n'
                          'Live copies stay at their original paths.\n\n- `file-manifest.md`: every referenced path and its git state\n'
                          '- `commits.md`: commits in the window\n- `copies/`: files a fresh clone would not have\n', encoding='utf-8')
    print(f'{len(rows)} paths, {copied} copied, {len(skipped)} too large -> {out.relative_to(ROOT)}')
    for s in skipped: print('  too large:', s)

if __name__ == '__main__':
    main()
