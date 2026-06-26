#!/usr/bin/env python3
"""Parse a Bookmaker (or similarly-formatted) NFL futures .docx export and ingest
the odds into Supabase futures_odds_snapshots.

Handles four section formats found in BKR_Futures_*.docx:
  • Outrights  "Team Name+1234"            → superbowl / conference_* / division_*
  • Playoffs   "XXX TEAM TO MAKE THE PLAYOFFS" + Yes/No + yesOdds/noOdds → playoffs
  • Win totals "NFL REGULAR SEASON WINS" + team + "o9.5+120" / "u9.5-140"  → wins

Capture date is taken from the filename (BKR_Futures_YYYYMMDD) unless --date given,
so older manually-downloaded exports ingest at their own date for line-movement tracking.

Usage:
  python scripts/ingest_bookmaker_docx.py --file <path.docx> [--book bookmaker]
         [--date 2026-06-25] [--dry-run] [--out parsed.json]

Env (for non-dry ingest): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""
import argparse, json, os, re, sys
from datetime import datetime, timezone

try:
    import docx
except ImportError:
    sys.exit("python-docx required: pip install python-docx --break-system-packages")

NICK = {
    'cardinals':'Arizona Cardinals','falcons':'Atlanta Falcons','ravens':'Baltimore Ravens',
    'bills':'Buffalo Bills','panthers':'Carolina Panthers','bears':'Chicago Bears',
    'bengals':'Cincinnati Bengals','browns':'Cleveland Browns','cowboys':'Dallas Cowboys',
    'broncos':'Denver Broncos','lions':'Detroit Lions','packers':'Green Bay Packers',
    'texans':'Houston Texans','colts':'Indianapolis Colts','jaguars':'Jacksonville Jaguars',
    'chiefs':'Kansas City Chiefs','raiders':'Las Vegas Raiders','chargers':'Los Angeles Chargers',
    'rams':'Los Angeles Rams','dolphins':'Miami Dolphins','vikings':'Minnesota Vikings',
    'patriots':'New England Patriots','saints':'New Orleans Saints','giants':'New York Giants',
    'jets':'New York Jets','eagles':'Philadelphia Eagles','steelers':'Pittsburgh Steelers',
    '49ers':'San Francisco 49ers','seahawks':'Seattle Seahawks','buccaneers':'Tampa Bay Buccaneers',
    'titans':'Tennessee Titans','commanders':'Washington Commanders',
}
FULL = set(NICK.values())

def canon(name):
    raw = name.strip()
    if raw in FULL: return raw
    key = re.sub(r'[^a-z0-9]','', raw.lower())
    if key in NICK: return NICK[key]
    last = re.sub(r'[^a-z0-9]','', raw.lower().split()[-1]) if raw.split() else ''
    return NICK.get(last, raw)

def implied(odds):
    return round(100/(odds+100) if odds > 0 else abs(odds)/(abs(odds)+100), 4)

def division_type(header):
    h = header.upper()
    conf = 'afc' if 'AFC' in h else ('nfc' if 'NFC' in h else None)
    for d in ('EAST','NORTH','SOUTH','WEST'):
        if d in h: return f'division_{conf}_{d.lower()}'
    return None

def classify_header(h):
    H = h.upper()
    if 'SUPER BOWL' in H: return ('superbowl', None)
    dv = division_type(H)
    if dv: return ('division', dv)
    if re.search(r'WIN AFC', H): return ('conference_afc', None)
    if re.search(r'WIN NFC', H): return ('conference_nfc', None)
    if 'MAKE THE PLAYOFFS' in H and 'TO MAKE' not in H: return ('playoffs_section', None)
    # Section divider "REGULAR SEASON WINS - SEP 10" (has SEP); the per-team block
    # header "NFL REGULAR SEASON WINS 2026/27" must fall through to the block parser.
    if 'REGULAR SEASON WINS' in H and 'SEP' in H: return ('wins_section', None)
    return (None, None)

OUTRIGHT_RE = re.compile(r'^(.+?)([+-]\d+)$')
OVER_RE  = re.compile(r'^o([\d.]+)([+-]\d+)$', re.I)
UNDER_RE = re.compile(r'^u([\d.]+)([+-]\d+)$', re.I)

def parse(path):
    lines = [p.text.strip() for p in docx.Document(path).paragraphs if p.text.strip()]
    rows = []
    section = None     # 'superbowl' | 'conference_afc' | 'conference_nfc' | 'division'
    i = 0
    while i < len(lines):
        ln = lines[i]
        kind, sub = classify_header(ln)
        # Outright section headers
        if kind in ('superbowl','conference_afc','conference_nfc','division'):
            section = sub if kind == 'division' else kind
            # division header may also carry first team appended? No — teams follow.
            i += 1; continue
        if kind == 'playoffs_section':
            section = 'playoffs'; i += 1; continue
        if kind == 'wins_section':
            section = 'wins'; i += 1; continue

        # Playoffs per-team block: "XXX TEAM TO MAKE THE PLAYOFFS"
        m = re.match(r'^(.*) TO MAKE THE PLAYOFFS$', ln, re.I)
        if section == 'playoffs' and m:
            team = canon(m.group(1))
            # look ahead for the Yes odds (first +/- after Yes/No labels)
            window = lines[i+1:i+7]
            odds_vals = [x for x in window if re.match(r'^[+-]\d+$', x)]
            if odds_vals:
                yes = int(odds_vals[0])
                rows.append(dict(market_type='playoffs', team=team, odds=yes, implied=implied(yes),
                                 no_odds=int(odds_vals[1]) if len(odds_vals) > 1 else None))
            i += 1; continue

        # Win totals per-team block: header line then team x2 then o/u
        if section == 'wins' and ln == 'NFL REGULAR SEASON WINS 2026/27':
            window = lines[i+1:i+7]
            team = None; over = under = line_num = None
            for w in window:
                if w in FULL or canon(w) in FULL:
                    team = canon(w)
                mo = OVER_RE.match(w);  mu = UNDER_RE.match(w)
                if mo: line_num = float(mo.group(1)); over = int(mo.group(2))
                if mu: under = int(mu.group(2))
            if team and line_num is not None:
                rows.append(dict(market_type='wins', team=team, line=line_num,
                                 over=over, under=under))
            i += 1; continue

        # Outright team+odds line
        mo = OUTRIGHT_RE.match(ln)
        if section in ('superbowl','conference_afc','conference_nfc') or (section and section.startswith('division_')):
            if mo and not ln.upper().startswith('ODDS TO WIN'):
                team = canon(mo.group(1)); odds = int(mo.group(2))
                rows.append(dict(market_type=section, team=team, odds=odds, implied=implied(odds)))
        i += 1
    return rows

def to_snapshot_rows(parsed, book, when, season):
    out = []
    for r in parsed:
        base = dict(snapshot_time=when, captured_at=when, season=season,
                    market_type=r['market_type'], team=r['team'], selection=r['team'],
                    book=book)
        if r['market_type'] == 'wins':
            base.update(odds=r.get('over') or -110, price=r.get('over') or -110, implied_prob=None,
                        line=r['line'], over_price=r.get('over'), under_price=r.get('under'))
        else:
            base.update(odds=r['odds'], price=r['odds'], implied_prob=r['implied'])
        out.append(base)
    return out

def upsert(rows):
    import urllib.request
    url = os.environ['SUPABASE_URL'].rstrip('/') + '/rest/v1/futures_odds_snapshots?on_conflict=market_type,team,book,snapshot_time'
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, method='POST', headers={
        'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--file', required=True)
    ap.add_argument('--book', default='bookmaker')
    ap.add_argument('--date', default=None, help='YYYY-MM-DD capture date (default: from filename)')
    ap.add_argument('--season', type=int, default=2026)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--out', default=None)
    a = ap.parse_args()

    if a.date:
        d = a.date
    else:
        m = re.search(r'(20\d{6})', os.path.basename(a.file))
        d = f'{m.group(1)[:4]}-{m.group(1)[4:6]}-{m.group(1)[6:8]}' if m else datetime.now(timezone.utc).strftime('%Y-%m-%d')
    when = f'{d}T00:00:00Z'

    parsed = parse(a.file)
    rows = to_snapshot_rows(parsed, a.book, when, a.season)

    by_mkt = {}
    for r in rows: by_mkt[r['market_type']] = by_mkt.get(r['market_type'], 0) + 1
    print(f"Parsed {len(rows)} rows from {os.path.basename(a.file)}  book={a.book}  date={d}")
    for k in sorted(by_mkt): print(f"  {k}: {by_mkt[k]}")

    if a.out:
        json.dump(rows, open(a.out, 'w'), indent=1)
        print(f"Wrote {a.out}")

    if a.dry_run:
        print("[DRY RUN] no DB write. Sample rows:")
        for r in rows[:3] + [x for x in rows if x['market_type']=='wins'][:1] + [x for x in rows if x['market_type']=='playoffs'][:1]:
            print("  ", json.dumps(r))
        return
    status = upsert(rows)
    print(f"Supabase upsert HTTP {status} — {len(rows)} rows")

if __name__ == '__main__':
    main()
