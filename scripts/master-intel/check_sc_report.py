"""SuperContest report format gate (locked layout: Andy 2026-10-24/25, Week 7 reference build).

Checks a built SuperContest report against the locked format and the Pitch/Pushback standard.
Exit 0 = PASS, 1 = FAIL. build.py runs it after every SuperContest build; do not send the
report to Andy & Amanda unless it passes.

  python scripts/master-intel/check_sc_report.py --week 8 [--season 2026] [--dir dist/nfl_week8_master_packet]

Reference build: docs/reference/supercontest-report-locked-w07.html
Standard: docs/MASTER_INTEL_REPORT_FORMAT.md §8 and agents/dev/PITCH_PUSHBACK_AGENT.md
"""
import argparse, html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Locked page structure: element ids that must exist in every build.
REQUIRED_IDS = {
    'sc-rules': 'How the SuperContest works',
    'sc-status': 'Contest status',
    'sc-our-five': 'Our Five / proposal anchor',
    'sc-grp-five': 'Dashboard AI proposal group',
    'sc-ranked': '1. Every side, ranked',
    'sc-splits': 'Spread-only betting splits',
    'sc-market': '2. Contest vs market',
    'sc-experts': 'Experts panel',
    'sc-games': 'Game-by-Game',
    'sc-review': 'Standings & Season Review',
    'sc-overall-standings': 'Overall standings (collapsible)',
    'sc-quarterly-standings': 'Quarterly standings (collapsible)',
    'sc-card-record': 'Card record (collapsible)',
    'sc-score-defs': 'Contest score definitions',
    'sc-pick-sheet': 'Pinned pick sheet',
    'pk-panel': 'Pick sheet panel',
    'pk-freeze': 'Pick sheet freeze/lock',
    'matchup-modal-overlay': 'Master Intel game pop-up',
    'report-controls': 'Expand/collapse controls',
    'side-toc': 'Contents rail',
    'disclaimer': 'Disclaimer',
}
REQUIRED_TEXT = {
    'sc-who': 'Andy / Amanda "who am I" toggle (localStorage key sc-who)',
    'sc-our-entry': 'Amanda Rose highlighted row in the standings',
    'Dashboard AI total': 'Dashboard AI total under Amanda',
    'fifth-place payout': '5th-place payout gap',
}
# Spread-only rule: none of these may appear in the visible text.
FORBIDDEN = [
    (r'(?i)\bmoney ?lines?\b', 'moneyline'),
    (r'\bML\b', 'ML'),
    (r'(?i)\b(?:over|under) \d', 'Over/Under number'),
    (r'\b[ou]\d{2}(?:\.5)?\b', 'o/u total shorthand'),
    (r'(?i)\breceptions?\b', 'receptions prop'),
    (r'(?i)rushing yards|passing yards|receiving yards', 'yardage prop'),
    (r'(?i)anytime|touchdown scorer|first td|player props?', 'TD/player prop'),
    (r'(?i)\bteam totals?\b|\bgame totals?\b|\bthe total\b', 'game/team total'),
]
GENERIC = [r'(?i)covers? (?:the spread )?if they (?:win|lose by)', r'(?i)to cover,? (?:the team|they) (?:must|need)',
           r'(?i)a cover means', r'(?i)no sourced (?:the )?(?:pitch|pushback)']
MIN_ITEMS, MIN_CHARS = 2, 120


def visible_text(raw):
    s = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', raw)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s)))


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', str(t).lower()).strip('-')


def check(week, season, out_dir=None):
    WW = f'{week:02d}'
    d = Path(out_dir) if out_dir else ROOT / f'dist/nfl_week{week}_master_packet'
    hp = d / f'nfl_week{week}_supercontest_intelligence_summary.html'
    jp = hp.with_suffix('.json')
    pp = ROOT / f'reports/intel/supercontest-pitches-{season}-w{WW}.json'
    fails, warns = [], []
    if not hp.exists() or not jp.exists():
        return [f'missing build output: {hp.name} / {jp.name} in {d}'], warns
    raw = hp.read_text(encoding='utf-8')
    rep = json.loads(jp.read_text(encoding='utf-8'))
    ids = set(re.findall(r'id="([^"]+)"', raw))
    text = visible_text(raw)

    # 1. Locked layout
    for i, label in REQUIRED_IDS.items():
        if i not in ids: fails.append(f'layout: missing #{i} ({label})')
    for t, label in REQUIRED_TEXT.items():
        if t not in raw: fails.append(f'layout: missing {label}')
    for wk in range(1, week + 1):
        if f'sc-week-review-{wk}' not in ids: fails.append(f'season review: missing Week {wk} post-mortem (#sc-week-review-{wk})')
    if 'Amanda Rose' not in text: fails.append('standings: Amanda Rose not shown')

    # 2. Spread-only
    for pat, label in FORBIDDEN:
        hits = [text[max(0, m.start() - 50):m.end() + 50] for m in re.finditer(pat, text)]
        if hits: fails.append(f'spread-only: {label} text found ({len(hits)}x), e.g. "…{hits[0].strip()}…"')

    # 3. Pitch / Pushback on every Dashboard AI pick and alternate
    picks = [(p['team'], 'pick') for p in rep.get('our_five', [])] + [(p['team'], 'alternate') for p in rep.get('alternates', [])]
    if not rep.get('our_five'): fails.append('proposal: no Dashboard AI picks in the build')
    pf = json.loads(pp.read_text(encoding='utf-8')) if pp.exists() else None
    if pf is None: fails.append(f'pitch file missing: {pp.relative_to(ROOT)} (run pitch_scaffold.py --week {week})')
    gid_of = {s['side']: s['gid'] for s in rep.get('sides', [])}
    for team, kind in picks:
        tag = f'{team} ({kind})'
        for suffix in ('', '-pitch', '-pushback'):
            if f'sc5-{slug(team)}{suffix}' not in ids: fails.append(f'{tag}: missing #sc5-{slug(team)}{suffix} in the page')
        if pf is None: continue
        entry = pf.get('picks', {}).get(team)
        if not entry: fails.append(f'{tag}: no entry in the pitch file'); continue
        if gid_of.get(team) and entry.get('game') != gid_of[team]:
            fails.append(f'{tag}: pitch file game "{entry.get("game")}" ≠ build game "{gid_of[team]}" (the page will hide it)')
        for key in ('pitch', 'pushback'):
            items = entry.get(key) or []
            if len(items) < MIN_ITEMS: fails.append(f'{tag}: {key} has {len(items)} paragraph(s); need ≥{MIN_ITEMS}'); continue
            for n, it in enumerate(items, 1):
                t = (it.get('text') or '').strip()
                refs = it.get('ref'); refs = refs if isinstance(refs, list) else [refs] if refs is not None else []
                if len(t) < MIN_CHARS: fails.append(f'{tag}: {key} #{n} is too thin ({len(t)} chars)')
                if not refs: fails.append(f'{tag}: {key} #{n} has no source ref')
                if not re.search(r'\d', t): warns.append(f'{tag}: {key} #{n} cites no figure')
                for g in GENERIC:
                    if re.search(g, t): fails.append(f'{tag}: {key} #{n} is generic cover-definition text')
                if 'TODO' in t or 'FILL' in t: fails.append(f'{tag}: {key} #{n} is still a scaffold placeholder')
    if re.search(GENERIC[-1], text): fails.append('page shows a "No sourced pitch/pushback" placeholder')
    return fails, warns


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--week', type=int, required=True)
    ap.add_argument('--season', type=int, default=2026)
    ap.add_argument('--dir')
    a = ap.parse_args()
    fails, warns = check(a.week, a.season, a.dir)
    for w in warns: print('  warn:', w)
    if fails:
        print(f'SuperContest format gate: FAIL ({len(fails)}) — do not send this report')
        for f in fails: print('  ✗', f)
        sys.exit(1)
    print(f'SuperContest format gate: PASS (Week {a.week}; locked layout, spread-only, Pitch/Pushback on every AI pick and alternate)')


if __name__ == '__main__':
    main()
