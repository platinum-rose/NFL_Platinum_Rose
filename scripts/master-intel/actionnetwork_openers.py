#!/usr/bin/env python3
"""Weekly opening lines from Action Network (read-only, public JSON behind actionnetwork.com/nfl/odds).

usage:
  python3 scripts/master-intel/actionnetwork_openers.py --week 4 [--season 2026] [--cutoff 2026-09-28T00:00:00Z]

What "opening line" means here: the first line Action Network's "Open" book (book_id 30) recorded on or
after the cutoff. The default cutoff is 5:00 PM PT on the Sunday before the week's first game, i.e. right
after the previous week's Sunday afternoon slate, when books re-open next week's lines. (AN's own "Open"
column shows the first-ever line, which for most games is a summer look-ahead, so it is not used.)
If a game has no update after the cutoff, the last line before it is carried and flagged.

Writes:
  data/odds/actionnetwork-openers-<season>-w<NN>.json          (small, tracked; read by scripts/master-intel/build.py)
  data/generated/odds/actionnetwork-history-<season>-w<NN>/    (raw per-game line history + scoreboard, for audit)
Read-only: no account, no bet slip, no paid API, no Supabase.
"""
import argparse, datetime, json, urllib.request, zoneinfo
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PT = zoneinfo.ZoneInfo('America/Los_Angeles')
ALIAS = {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX', 'LVR': 'LV', 'NOS': 'NO'}
API = 'https://api.actionnetwork.com/web/v2'
OPEN_BOOK = '30'

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (PlatinumRose read-only)'})
    with urllib.request.urlopen(req, timeout=30) as f: return f.read()

def default_cutoff(kickoffs_utc):
    first = min(kickoffs_utc).astimezone(PT)
    back = (first.weekday() + 1) % 7 or 7              # days back to the previous Sunday (Mon=0 .. Sun=6)
    sun = (first - datetime.timedelta(days=back)).date()
    return datetime.datetime(sun.year, sun.month, sun.day, 17, 0, tzinfo=PT)

def series(hist, typ, side):
    xs = [x for x in hist.get(OPEN_BOOK, {}).get('event', {}).get(typ, []) if x.get('side') == side]
    return sorted(xs[0].get('history') or [], key=lambda r: r['updated_at']) if xs else []

def pick(h, cut):
    after = [r for r in h if r['updated_at'] >= cut]
    if after: return after[0], False
    before = [r for r in h if r['updated_at'] < cut]
    return (before[-1], True) if before else (None, False)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--week', type=int, required=True); ap.add_argument('--season', type=int, default=2026)
    ap.add_argument('--cutoff', help='ISO UTC timestamp override, e.g. 2026-09-28T00:00:00Z')
    a = ap.parse_args(); WW = f'{a.week:02d}'
    sb_raw = get(f'{API}/scoreboard/nfl?bookIds=15,{OPEN_BOOK}&week={a.week}&seasonType=reg&season={a.season}')
    sb = json.loads(sb_raw); games = sb.get('games') or []
    if not games: raise SystemExit(f'no Action Network games for {a.season} week {a.week}')
    kos = [datetime.datetime.fromisoformat(g['start_time'].replace('Z', '+00:00')) for g in games]
    cut_dt = (datetime.datetime.fromisoformat(a.cutoff.replace('Z', '+00:00')) if a.cutoff else default_cutoff(kos)).astimezone(datetime.timezone.utc)
    cut = cut_dt.strftime('%Y-%m-%dT%H:%M:%S')
    raw_dir = ROOT / f'data/generated/odds/actionnetwork-history-{a.season}-w{WW}'; raw_dir.mkdir(parents=True, exist_ok=True)
    (raw_dir / '_scoreboard.json').write_bytes(sb_raw)
    out = {}
    for g in games:
        T = {t['id']: ALIAS.get(t['abbr'], t['abbr']) for t in g['teams']}
        aw, hm = T[g['away_team_id']], T[g['home_team_id']]; gid = f'{aw}@{hm}'
        raw = get(f"{API}/markets/event/{g['id']}/history"); (raw_dir / f"{aw}_{hm}_{g['id']}.json").write_bytes(raw)
        h = json.loads(raw)
        sp, sp_c = pick(series(h, 'spread', 'home'), cut)
        to, to_c = pick(series(h, 'total', 'over'), cut)
        ma, ma_c = pick(series(h, 'moneyline', 'away'), cut)
        mh, mh_c = pick(series(h, 'moneyline', 'home'), cut)
        if not sp or not to: continue
        out[gid] = dict(an_game_id=g['id'], kickoff_utc=g['start_time'],
                        sp={hm: float(sp['value']), aw: -float(sp['value'])}, sp_odds_home=sp['odds'], sp_at=sp['updated_at'][:19] + 'Z',
                        tot=float(to['value']), tot_at=to['updated_at'][:19] + 'Z',
                        ml={k: v['odds'] for k, v in ((aw, ma), (hm, mh)) if v},
                        carried_from_before_cutoff=any([sp_c, to_c, ma_c, mh_c]))
    cut_pt = cut_dt.astimezone(PT)
    label = f"Action Network open, {cut_pt.strftime('%a %-m/%-d')} {cut_pt.strftime('%-I:%M %p')} PT"
    doc = dict(schema='actionnetwork_openers_v1', season=a.season, week=a.week, cutoff_utc=cut + 'Z', label=label,
               pulled_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
               source=f'{API}/scoreboard/nfl + {API}/markets/event/<id>/history, book_id {OPEN_BOOK} ("Open")',
               definition='first line recorded by the AN "Open" book on/after cutoff_utc; spreads are each team\'s handicap',
               raw_history_dir=str(raw_dir.relative_to(ROOT)), games=out)
    dst = ROOT / f'data/odds/actionnetwork-openers-{a.season}-w{WW}.json'
    dst.write_text(json.dumps(doc, indent=1) + '\n', encoding='utf-8')
    print(f'{label} (cutoff {cut}Z) -> {dst.relative_to(ROOT)}: {len(out)} games')
    for k, v in out.items():
        hm = k.split('@')[1]
        print(f"  {k:8} {hm} {v['sp'][hm]:+g}  total {v['tot']:g}  ML {v['ml']}" + ('  [carried from before cutoff]' if v['carried_from_before_cutoff'] else ''))

if __name__ == '__main__':
    main()
