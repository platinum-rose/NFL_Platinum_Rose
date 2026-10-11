#!/usr/bin/env python3
"""Week 5 synthesis preflight. Zero model cost, read-only by default.

Run this BEFORE launching Astra/Opus (and again before each Sunday window):

    python3 scripts/intel/week5-preflight.py --model opus
    python3 scripts/intel/week5-preflight.py --model astra --espn
    python3 scripts/intel/week5-preflight.py --hashes            # sha256 block for the evidence manifest
    python3 scripts/intel/week5-preflight.py --write-eligible data/research-intel/proposed/2026-w05-tier-eligible-rows.json

Exit code 0 = no FAIL. WARN means "read it before launching".

What it checks (each maps to a failure we actually hit on 2026-10-10):
  1. HEAD, and that the pinned files (prompt, calibration script, calibration JSON) are committed and clean
  2. calibration JSON + nflverse CSV hashes on disk == the hashes printed in the prompt, and the
     JSON's embedded source hash == the CSV hash
  3. required inputs exist (incl. gitignored ones a fresh clone would lack)
  4. per-game market freshness for Bookmaker and BetOnline (6h; 3h inside 6h of kickoff), with exact expiry
  5. BKR vs BEO main-line conflicts, and event orientation (VISITOR @ HOME) against schedule.json
  6. citation gate, honest version: which verified rows may set a tier (article + URL + quote traced
     verbatim to stored source text). Expert-feed / podcast "quotes" are extractor rationale -> corroboration only
  7. advisory inputs whose home/away or home-line sign disagrees with the books (quantitative synthesis, SuperContest)
  8. existing roster-vet result (read-only) ; --roster re-runs it (REWRITES data/generated/master-intel/w05-roster-vet.json)
  9. output-path collision for --model
 10. optional --espn live game-status check (public read-only call)
"""
import argparse
import datetime as dt
import glob
import hashlib
import html
import json
import os
import re
import subprocess
import sys
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)

PROMPT = 'prompts/2026-w05-astra-full-synthesis.md'
CAL_JSON = 'data/research-intel/proposed/2026-w05-historical-market-calibration.json'
CAL_SCRIPT = 'scripts/intel/historical-market-calibration.py'
CSV = 'data/vault-seed/nflverse/games-full-1999-2026.csv'
PINNED = [PROMPT, CAL_SCRIPT, CAL_JSON]

SCHEDULE = 'public/schedule.json'

def _latest_capture(prefix):
    import glob as _g, json as _j
    best = None
    for p in _g.glob('data/generated/props/%s-live-2026-10-*-week5.json' % prefix):
        if 'failed' in p:
            continue
        try:
            c = _j.load(open(p, encoding='utf-8')).get('capturedAt') or ''
        except Exception:
            continue
        if best is None or c > best[0]:
            best = (c, p.replace('\\', '/'))
    return best[1]
BKR = _latest_capture('bookmaker')  # newest capture by capturedAt
BEO = _latest_capture('betonline')
EV = 'data/generated/master-intel/w05-expert-verified.json'
GEM = 'data/generated/master-intel/w05-article-gemini-picks.json'
PULL = 'data/generated/master-intel/w05-pull.json'
ROSTER = 'data/generated/master-intel/w05-roster-vet.json'
AVAIL = 'data/player-availability/latest.json'
QUANT = 'data/research-intel/proposed/2026-w05-quantitative-synthesis.json'
SUPER = 'data/supercontest/week-05-2026-verified-lines.json'
DIGEST = 'scratch/w05-synthesis-digest-sat.md'
VSIN = 'data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json'
BETTINGPROS = 'data/research-intel/source-evidence/2026-10-10-bettingpros-week5-current-articles.json'
ARCHIVE = 'reports/intel/article-archive-2026-w05.md'
ARTICLES_GLOB = 'data/intel/articles/2026-w05/**/*.md'
REQUIRED = [SCHEDULE, BKR, BEO, EV, GEM, PULL, ROSTER, AVAIL, CSV, CAL_JSON, PROMPT, QUANT, SUPER, VSIN]
HASH_SET = REQUIRED + [DIGEST, 'public/schedule.json', 'HANDOFF.md']

OUT = []
COUNTS = {'PASS': 0, 'WARN': 0, 'FAIL': 0}


def emit(level, msg):
    if level in COUNTS:
        COUNTS[level] += 1
    print(f'[{level}] {msg}')


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def jload(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def iso(s):
    return dt.datetime.fromisoformat(s.replace('Z', '+00:00')).astimezone(dt.timezone.utc)


def pt(t):
    return (t - dt.timedelta(hours=7)).strftime('%a %m-%d %H:%M PT')


def git(*args):
    r = subprocess.run(['git', *args], capture_output=True, text=True)
    return r.stdout.strip()


def fmt_age(td):
    m = int(td.total_seconds() // 60)
    return f'{m // 60}h{m % 60:02d}m'


def load_schedule(now):
    games = []
    for g in jload(SCHEDULE):
        if g.get('season') != 2026 or g.get('week') != 5:
            continue
        k = iso(g['kickoff_utc'])
        done = g.get('status') == 'post' or k + dt.timedelta(hours=4) < now
        games.append(dict(id=f"{g['visitor']}@{g['home']}", away=g['visitor'], home=g['home'],
                          away_name=g['visitorName'], home_name=g['homeName'], kick=k, done=done,
                          event=f"{g['visitorName']} @ {g['homeName']}", status=g.get('status')))
    return games


# ---------------------------------------------------------------- 1-3 repo state
def check_repo(args):
    head = git('rev-parse', '--short', 'HEAD')
    emit('INFO', f'HEAD {head}; dirty entries in checkout: {len(git("status", "--porcelain").splitlines())}')
    if args.expect_head:
        ok = head.startswith(args.expect_head) or args.expect_head.startswith(head)
        emit('PASS' if ok else 'FAIL', f'HEAD {head} vs expected {args.expect_head}')
    dirty = git('status', '--porcelain', '--', *PINNED)
    emit('PASS' if not dirty else 'FAIL',
         'pinned files (prompt, calibration script, calibration JSON) committed and clean' if not dirty
         else f'pinned files not clean:\n{dirty}')

    missing = [p for p in REQUIRED if not os.path.exists(p)]
    for p in missing:
        emit('FAIL', f'required input missing: {p}')
    if not missing:
        emit('PASS', f'all {len(REQUIRED)} required inputs present (incl. gitignored)')
    if missing:
        return False

    prompt = open(PROMPT, encoding='utf-8').read()
    jh, ch = sha(CAL_JSON), sha(CSV)
    for name, h in (('calibration JSON', jh), ('nflverse CSV', ch)):
        emit('PASS' if h in prompt else 'FAIL', f'{name} on-disk sha256 {h[:12]}... {"is" if h in prompt else "is NOT"} the hash pinned in the prompt')
    emb = jload(CAL_JSON)['source']['sha256']
    emit('PASS' if emb == ch else 'FAIL', f'calibration JSON embedded source hash {"==" if emb == ch else "!="} CSV hash')
    return True


# ---------------------------------------------------------------- 4 freshness
def expiry(cap, kick):
    ws = kick - dt.timedelta(hours=6)
    if cap + dt.timedelta(hours=3) < ws:
        return min(cap + dt.timedelta(hours=6), ws)
    return cap + dt.timedelta(hours=3)


def check_freshness(now, games, args):
    live = [g for g in games if not g['done']]
    emit('INFO', f'now {now.strftime("%H:%M")}Z = {pt(now)}; live games {len(live)}; done {len(games) - len(live)} ({", ".join(g["id"] for g in games if g["done"]) or "none"})')
    runway = dt.timedelta(minutes=args.runway)
    caps = {}
    for name, path in (('Bookmaker', BKR), ('BetOnline', BEO)):
        cap = iso(jload(path)['capturedAt'])
        caps[name] = cap
        stale_now, soon = [], []
        for g in live:
            if g['kick'] <= now:
                continue
            exp = expiry(cap, g['kick'])
            if exp <= now:
                stale_now.append(g['id'])
            elif exp - now < runway:
                soon.append((g['id'], exp))
        first = min((expiry(cap, g['kick']), g['id']) for g in live if g['kick'] > now)
        emit('INFO', f'{name} captured {cap.strftime("%H:%M")}Z = {pt(cap)} (age {fmt_age(now - cap)}); first expiry {pt(first[0])} ({first[1]})')
        if stale_now:
            emit('FAIL', f'{name} stale_for_recommendation now for: {", ".join(stale_now)}')
        elif soon:
            emit('WARN', f'{name} expires within {args.runway} min for: ' + ', '.join(f'{i} @ {pt(e)}' for i, e in soon))
        else:
            emit('PASS', f'{name} fresh for every live game for at least {args.runway} min')
    return caps


# ---------------------------------------------------------------- 5 line conflicts / orientation
def main_lines(path, book, games):
    rows = jload(path)['rows']
    out, events = {}, set()
    for r in rows:
        ev = r.get('event')
        events.add(ev)
        if book == 'BKR' and r.get('sectionTitle') != 'Game':
            continue
        if book == 'BEO' and r.get('market') != 'game_lines':
            continue
        if not r.get('available', True):
            continue
        d = out.setdefault(ev, {})
        if r.get('bet') == 'spread':
            d.setdefault('spread', {})[r.get('side') or r.get('team')] = (r.get('line'), r.get('odds'))
        elif r.get('bet') == 'total' and str(r.get('side')).lower().startswith('over'):
            d['total'] = (r.get('line'), r.get('odds'))
    return out, events


def check_lines(games):
    live = [g for g in games if not g['done']]
    want = {g['event'] for g in live}
    lines = {}
    for book, path in (('BKR', BKR), ('BEO', BEO)):
        ln, events = main_lines(path, book, games)
        lines[book] = ln
        miss, extra = want - events, {e for e in events if e} - {g['event'] for g in games}
        emit('PASS' if not miss and not extra else 'FAIL',
             f'{book} event strings match schedule VISITOR @ HOME for all {len(want)} live games' if not miss and not extra
             else f'{book} event mismatch; missing {sorted(miss)} unknown {sorted(extra)}')
    emit('INFO', 'game      BKR home line   BEO home line   d    BKR tot  BEO tot  d')
    conflicts = 0
    home_line = {}
    for g in live:
        b, o = lines['BKR'].get(g['event'], {}), lines['BEO'].get(g['event'], {})
        bh = (b.get('spread', {}).get(g['home_name']) or (None,))[0]
        oh = (o.get('spread', {}).get(g['home_name']) or (None,))[0]
        bt, ot = (b.get('total') or (None,))[0], (o.get('total') or (None,))[0]
        home_line[g['id']] = bh
        ds = None if bh is None or oh is None else oh - bh
        dtot = None if bt is None or ot is None else ot - bt
        flag = ''
        if (ds is not None and abs(ds) >= 1.0) or (dtot is not None and abs(dtot) >= 1.0):
            flag = '  <-- CONFLICT'
            conflicts += 1
        emit('INFO', f'{g["id"]:8} {bh!s:>14} {oh!s:>15} {("%+.1f" % ds) if ds is not None else "  -":>5} {bt!s:>8} {ot!s:>8} {("%+.1f" % dtot) if dtot is not None else "  -":>4}{flag}')
    emit('WARN' if conflicts else 'PASS', f'{conflicts} game(s) where BKR and BEO main lines differ by >= 1.0 pt (re-capture before any price claim)' if conflicts else 'BKR and BEO main lines agree within 1.0 pt')
    return home_line


# ---------------------------------------------------------------- 6 citation gate
def norm(s):
    s = s.lower()
    s = re.sub('[‘’]', "'", s)
    s = re.sub('[“”]', '"', s)
    s = re.sub('[–—]', '-', s)
    return re.sub(r'\s+', ' ', s).strip()


def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for v in o.values():
            yield from strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)


def clean_text(s):
    return norm(html.unescape(re.sub(r'<[^>]+>', ' ', s)))


STOP = {'over', 'under', 'best', 'bets', 'bet', 'pick', 'picks', 'yards', 'yds', 'anytime', 'touchdown', 'receiving',
        'rushing', 'passing', 'receptions', 'with', 'team', 'total', 'game', 'first', 'half', 'points'}


def supports_pick(q, r):
    """The traced text must actually be about the pick (selection words or the number), not an unrelated sentence."""
    nq = norm(q)
    sel = f"{r.get('selection') or ''} {r.get('side') or ''}"
    toks = {t for t in re.findall(r'[a-z]{4,}', norm(sel)) if t not in STOP}
    nums = set(re.findall(r'\d+(?:\.\d+)?', sel)) | ({str(r.get('line'))} if r.get('line') not in (None, '') else set())
    if toks and any(t in nq for t in toks):
        return True
    return bool(nums) and any(n in nq for n in nums) and bool(re.search(r'\b(over|under|o\d|u\d)', nq))


def check_citations(args):
    ev = jload(EV)
    rows = ev['rows']
    # Stored ARTICLE text only. Never the Gemini picks file or other extractor output: tracing a quote
    # to the extractor's own output is circular, and FTN stats tables are not article text.
    parts = [clean_text(open(f, encoding='utf-8', errors='ignore').read()) for f in glob.glob(ARTICLES_GLOB, recursive=True)]
    for p in (VSIN, BETTINGPROS, ARCHIVE):
        if os.path.exists(p):
            raw = open(p, encoding='utf-8', errors='ignore').read()
            parts.append(clean_text(' '.join(strings(json.loads(raw))) if p.endswith('.json') else raw))
    corpus = ' '.join(parts)
    gem_urls = {s for s in strings(jload(GEM)) if s.startswith('http')}

    def traced(q):
        q = norm(re.sub(r'^\[[^\]]+\]\s*', '', q or ''))   # drop the extractor's [AWAY@HOME] tag
        if len(q) < 12:
            return False
        if q in corpus:
            return True
        segs = [s.strip(' .') for s in re.split(r'\.\.\.|…', q) if len(s.strip(' .')) >= 20]
        return len(segs) > 1 and all(s in corpus for s in segs)

    by_kind = {}
    eligible = []
    near = []   # verbatim in stored text but the quote does not itself identify the pick
    for i, r in enumerate(rows):
        if r.get('verdict') != 'verified':
            continue
        k = r.get('kind') or '?'
        d = by_kind.setdefault(k, dict(verified=0, url=0, quote=0, traced=0))
        d['verified'] += 1
        d['url'] += bool(r.get('url'))
        d['quote'] += bool((r.get('quote') or '').strip())
        vt = k == 'article' and bool(r.get('url')) and traced(r.get('quote'))
        t = vt and supports_pick(r.get('quote') or '', r)
        if vt and not t:
            near.append((i, r))
        d['traced'] += t
        if t:
            eligible.append((i, r))
    emit('INFO', 'verified rows by kind: ' + '; '.join(f'{k}: {d["verified"]} verified, {d["url"]} with URL, {d["quote"]} with quote, {d["traced"]} traced' for k, d in sorted(by_kind.items())))
    emit('INFO', f'source-row IDs = {os.path.basename(EV)}#rows[<index>] (file sha256 {sha(EV)[:12]}...)')
    n = len(eligible)
    in_gem = sum(1 for _, r in eligible if r.get('url') in gem_urls)
    emit('PASS' if n else 'FAIL', f'{n} verified rows are tier-eligible (article + URL + whole quote found verbatim in stored article text + quote is about the pick); {in_gem} also match a URL in the Gemini article file')
    if near:
        emit('WARN', f'{len(near)} more verified article rows are verbatim in stored text but the quote does not itself name the pick (human review, not tier-eligible): ' + ', '.join(f'rows[{i}]' for i, _ in near))
    other = sum(d['verified'] - d['traced'] for d in by_kind.values())
    emit('WARN', f'{other} verified rows are corroboration-only (expert-feed/podcast quotes are extractor rationale; or no URL; or quote not found in stored text)')
    if args.write_eligible:
        payload = dict(schema='tier_eligible_rows_v1', near_miss_rows=[i for i, _ in near], generated_at=dt.datetime.now(dt.timezone.utc).isoformat(),
                       source=EV, source_sha256=sha(EV), rule='verified + kind=article + url + whole quote (minus [AWAY@HOME] tag) found verbatim in stored article text (never the extractor output) + quote mentions the selection',
                       eligible=[dict(row=f'{os.path.basename(EV)}#rows[{i}]', index=i, game=r.get('game'), market=r.get('market'),
                                      side=r.get('side'), selection=r.get('selection'), line=r.get('line'), price=r.get('price'),
                                      outlet=r.get('outlet'), url=r.get('url'), quote=r.get('quote')) for i, r in eligible])
        with open(args.write_eligible, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=1)
        emit('INFO', f'wrote {args.write_eligible} ({n} rows)')


# ---------------------------------------------------------------- 7 advisory inputs
def check_orientation(games, home_line):
    sched = {(g['away'], g['home']) for g in games}
    q = jload(QUANT)
    bad, flips = [], []
    for g in q.get('games', []):
        key = (g.get('away'), g.get('home'))
        bl = home_line.get(f'{key[0]}@{key[1]}')
        hs = (g.get('market') or {}).get('home_spread')
        if key not in sched:
            bad.append(f'{key[0]}@{key[1]}')
        elif bl is not None and hs is not None and bl != 0 and abs(bl + hs) < 0.01:
            flips.append(f'{key[0]}@{key[1]} (BKR home {bl:+g} vs file {hs:+g})')
    emit('FAIL' if flips or bad else 'PASS',
         f'quantitative-synthesis home_spread sign flipped vs Bookmaker in {len(flips)} game(s): {"; ".join(flips)}' if flips
         else 'quantitative-synthesis home/away and home_spread consistent with Bookmaker')
    sc = jload(SUPER).get('lines', [])
    wrong = [f'{l["away_team"]}@{l["home_team"]}' for l in sc if (l['away_team'], l['home_team']) not in sched]
    reversed_ = [x for x in wrong if tuple(x.split('@'))[::-1] in sched]
    emit('WARN' if wrong else 'PASS',
         f'SuperContest file (user-verified record, left as is; join by unordered pair and use its favorite/spread fields) lists {len(wrong)} matchup(s) not in schedule VISITOR@HOME order ({len(reversed_)} are exact reversals): {", ".join(wrong)}' if wrong
         else 'SuperContest file matchups match schedule VISITOR@HOME order')


# ---------------------------------------------------------------- 8 roster
def check_roster(args):
    r = jload(ROSTER)
    bl = r.get('blocking') if isinstance(r.get('blocking'), list) else []
    # items are [section, status, name, teams, ...]. Blockers in the hand-written narratives file do not touch per-game runs
    # (they are forbidden to read it); they stay a WARN here and still block build.py.
    narr = [b for b in bl if b and b[0] == 'narratives']
    blocking = len(bl) - len(narr)
    if narr:
        emit('WARN', 'roster gate has %d blocker(s) in the narratives file only (affects build.py, not per-game runs): %s' % (len(narr), '; '.join('%s %s' % (b[1], b[2]) for b in narr)))
    gen = r.get('generated_at') or r.get('generatedAt')
    av = jload(AVAIL)
    emit('INFO', f'existing roster-vet result: generated {gen}; blocking {blocking}')
    if blocking is None:
        emit('WARN', 'could not read a blocking count from w05-roster-vet.json; run with --roster')
    else:
        emit('PASS' if blocking == 0 else 'FAIL', f'roster gate blocking issues = {blocking}')
    times = [e.get('published_at') for e in (av.get('events') or []) if e.get('published_at')]
    if times and gen:
        newest = max(iso(t) for t in times)
        if iso(gen) < newest:
            emit('WARN', f'roster-vet result ({gen}) is older than the newest availability event ({newest.isoformat()}); re-run with --roster')
    if args.roster:
        emit('INFO', 'running npm run roster:vet (this rewrites w05-roster-vet.json)')
        p = subprocess.run(['npm', 'run', '--silent', 'roster:vet', '--', '--week', '5', '--date', '2026-10-10', '--strict'], capture_output=True, text=True)
        emit('PASS' if p.returncode == 0 else 'FAIL', f'roster:vet --strict exit {p.returncode}')
        print((p.stdout + p.stderr)[-600:])


# ---------------------------------------------------------------- 9 collisions
def check_outputs(model):
    paths = [f'reports/intel/2026-w05-{model}-evidence-manifest.md', f'reports/intel/2026-w05-{model}-full-synthesis.md',
             f'data/research-intel/proposed/2026-w05-{model}-synthesis.json', f'reports/bets/2026-w05-{model}-decision-support.md',
             f'reports/intel/2026-w05-{model}-synthesis-qa.md']
    ex = [p for p in paths if os.path.exists(p)]
    emit('WARN' if ex else 'PASS', ('these outputs already exist and would be overwritten: ' + ', '.join(ex)) if ex else f'no existing {model} output files; safe to launch')


# ---------------------------------------------------------------- 9b per-game mode
def check_game_mode(model, game):
    if game == 'SLATE':
        paths = [f'reports/intel/2026-w05-{model}-slate-merge.md', f'reports/bets/2026-w05-{model}-decision-support.md', f'data/research-intel/proposed/2026-w05-{model}-slate-merge.json']
        ex = [p for p in paths if os.path.exists(p)]
        emit('WARN' if ex else 'PASS', ('slate-merge outputs already exist and would be overwritten: ' + ', '.join(ex)) if ex else f'no existing {model} slate-merge outputs; safe to launch')
        return
    gk = game.replace('@', '_at_')
    pj = f'data/research-intel/game-packets/2026-w05/{gk}.json'
    if not os.path.exists(pj):
        emit('FAIL', f'no game packet {pj}; run python3 scripts/intel/build-w05-game-packets.py')
    else:
        pk = json.load(open(pj, encoding='utf-8'))
        for book, path in (('BKR', BKR), ('BEO', BEO)):
            cur = json.load(open(path, encoding='utf-8')).get('capturedAt')
            have = pk['market'][book]['captured_at']
            emit('PASS' if cur == have else 'FAIL', f'packet {book} capture {have} {"matches" if cur == have else "does NOT match"} the file on disk ({cur}); rebuild the packet after any recapture')
        emit('INFO', f'packet built {pk["built_at"]}; source rows {pk["source_rows"]["counts"]}')
    paths = [f'reports/intel/games/2026-w05-{model}-{gk}.md', f'data/research-intel/proposed/games/2026-w05-{model}-{gk}.json']
    ex = [p for p in paths if os.path.exists(p)]
    emit('WARN' if ex else 'PASS', ('these outputs already exist and would be overwritten: ' + ', '.join(ex)) if ex else f'no existing {model} output for {game}; safe to launch')


# ---------------------------------------------------------------- 10 ESPN
def check_espn(games):
    url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20261008-20261013'
    try:
        data = json.load(urllib.request.urlopen(url, timeout=10))
    except Exception as e:
        emit('WARN', f'ESPN status check skipped (unreachable: {type(e).__name__})')
        return
    st = {}
    for e in data.get('events', []):
        c = e['competitions'][0]
        teams = {t['homeAway']: t['team']['abbreviation'] for t in c['competitors']}
        st[f"{teams['away']}@{teams['home']}"] = e['status']['type']['name']
    live = [g for g in games if not g['done']]
    bad = [f"{g['id']}={st.get(g['id'], 'missing')}" for g in live if st.get(g['id']) not in ('STATUS_SCHEDULED',)]
    emit('PASS' if not bad else 'WARN', 'ESPN: all live games STATUS_SCHEDULED' if not bad else 'ESPN status differs: ' + ', '.join(bad))
    finals = [i for i, s in st.items() if s == 'STATUS_FINAL']
    emit('INFO', f'ESPN finals in window: {", ".join(finals) or "none"}')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--model', choices=['astra', 'opus', 'sonnet'], help='check output-path collisions for this model')
    ap.add_argument('--prompt', help='prompt file whose pinned hashes/cleanliness to check (default: the full-slate Astra prompt)')
    ap.add_argument('--game', help='AWAY@HOME: per-game mode; checks the game packet and the per-game output paths for --model')
    ap.add_argument('--now', help='ISO UTC time to evaluate freshness at (default: now)')
    ap.add_argument('--runway', type=int, default=120, help='minutes of validity required beyond now (default 120)')
    ap.add_argument('--expect-head', help='expected short git HEAD')
    ap.add_argument('--espn', action='store_true', help='check ESPN game status (public network call)')
    ap.add_argument('--roster', action='store_true', help='re-run roster:vet --strict (REWRITES w05-roster-vet.json)')
    ap.add_argument('--hashes', action='store_true', help='print sha256 of key inputs for the evidence manifest and exit')
    ap.add_argument('--write-eligible', metavar='PATH', help='write the tier-eligible row set to PATH')
    args = ap.parse_args()
    global PROMPT
    if args.prompt:
        PROMPT = args.prompt
        PINNED[0] = PROMPT

    if args.hashes:
        for p in HASH_SET:
            if os.path.exists(p):
                print(f'{sha(p)}  {p}')
        for p in (BEO,) + tuple(sorted(glob.glob(ARTICLES_GLOB, recursive=True))):
            if os.path.exists(p) and p not in HASH_SET:
                print(f'{sha(p)}  {p}')
        return 0

    now = iso(args.now) if args.now else dt.datetime.now(dt.timezone.utc)
    print(f'Week 5 preflight @ {now.strftime("%Y-%m-%d %H:%M")}Z ({pt(now)})')
    if not check_repo(args):
        print(f'\nSUMMARY: {COUNTS["PASS"]} pass, {COUNTS["WARN"]} warn, {COUNTS["FAIL"]} fail  -> DO NOT LAUNCH')
        return 1
    games = load_schedule(now)
    check_freshness(now, games, args)
    hl = check_lines(games)
    check_citations(args)
    check_orientation(games, hl)
    check_roster(args)
    if args.model and args.game:
        check_game_mode(args.model, args.game)
    elif args.model:
        check_outputs(args.model)
    if args.espn:
        check_espn(games)
    verdict = 'DO NOT LAUNCH' if COUNTS['FAIL'] else ('LAUNCH ONLY AFTER READING WARNINGS' if COUNTS['WARN'] else 'CLEAR TO LAUNCH')
    print(f'\nSUMMARY: {COUNTS["PASS"]} pass, {COUNTS["WARN"]} warn, {COUNTS["FAIL"]} fail  -> {verdict}')
    return 1 if COUNTS['FAIL'] else 0


if __name__ == '__main__':
    sys.exit(main())
