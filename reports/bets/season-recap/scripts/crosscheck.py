#!/usr/bin/env python3
"""Grader cross-check: season-recap grade.py (parse_leg/grade_spec) vs Team 2 lib.py (norm_leg/grade) vs the stored leg status.

Runs on every leg of the week's placed tickets (user-placed-wagers-2026.json), paper tickets (paper-wagers-2026.json) and the
machine-readable AI record (data/official-picks/ai-proposals/2026-wNN.json). Read-only on all of them.

  python3 scripts/crosscheck.py --week 9            # writes work/w9/crosscheck_w9.{json,md}; exit 2 on a blocking mismatch
  python3 scripts/crosscheck.py --weeks 1-8 --no-write

Blocking (the post-mortem page does not build until it is fixed or adjudicated):
  * both graders return a result and they differ
  * the recap grader (the one the page uses) differs from a stored WON/LOST/PUSH
Warnings: one grader can't grade the leg; a stored PENDING leg the box score now settles.
Adjudications: crosscheck-adjudications.json  {"<ticket id>#<leg_num or label>": {"result": "LOST", "why": "..."}}
"""
import argparse, collections, importlib, json, os, sys
D = os.path.dirname(os.path.abspath(__file__)); RECAP = os.path.abspath(os.path.join(D, '..'))
ROOT = os.path.abspath(os.path.join(RECAP, '..', '..', '..'))
LIBD = os.path.join(ROOT, 'reports', 'analysis', 'season', 'claude', 'scripts')
for p in (D, LIBD):
    if p not in sys.path: sys.path.insert(0, p)
import lib  # noqa: E402
import ai_record  # noqa: E402
ADJ_PATH = os.path.join(D, 'crosscheck-adjudications.json')
M = {'W': 'WON', 'L': 'LOST', 'P': 'PUSH'}


def recap_grader(week):
    os.environ['WEEK'] = str(week); os.environ['RECAP_DIR'] = RECAP
    import grade, parse_placed  # noqa: E401
    importlib.reload(grade); importlib.reload(parse_placed)
    return parse_placed


def legs_for(week):
    """(source, ticket_id, ticket, leg, leg_ref) for every graded-able leg of the week."""
    W = lib.jl(lib.WAGERS); P = lib.jl(os.path.join(ROOT, 'data', 'official-picks', 'paper-wagers-2026.json'))
    for src, rows in (('placed', W), ('paper', P)):
        for t in rows:
            if str(t.get('week')) != str(week): continue
            for i, l in enumerate(t.get('legs') or []):
                if (l.get('market') or '') == 'open_slot': continue
                yield src, t['id'], t, l, str(l.get('leg_num') or i + 1)
    for pr in ai_record.load_proposals(week):
        for i, l in enumerate(pr['legs']):
            yield 'ai_record', pr['id'], dict(id=pr['id'], week=week, game_title=pr.get('title')), ai_record.to_ledger_leg(l), str(i + 1)


def check(week):
    pp = recap_grader(week); LG = lib.load_games({week})
    adj = json.load(open(ADJ_PATH, encoding='utf-8')) if os.path.exists(ADJ_PATH) else {}
    rows = []; cnt = collections.Counter()
    for src, tid, t, l, ref in legs_for(week):
        sel = l.get('selection') or ''
        s = pp.parse_leg(l)
        if s and s.get('kind') == 'prop' and s.get('key') is None: a, atxt = None, f"no stat key for market {l.get('market')!r}"
        elif not s: a, atxt = None, 'unparsed'
        else:
            r = pp.grade_spec(s); a = M.get(r['result']); atxt = r.get('actual')
            if s.get('kind') == 'cfb': a = 'CFB'
        n = lib.norm_leg(l, t); g = lib.game_for(LG, week, n['game']); b, btxt, _ = lib.grade(n, g)
        if s and s.get('kind') == 'cfb': b = 'CFB'
        st = (l.get('status') or '').upper() or None
        key = f"{tid}#{ref}"; ad = adj.get(key) or adj.get(f"{tid}#{sel}")
        issue, sev = None, None
        if a == 'CFB': st = 'CFB'  # college legs are graded from the ticket, not the NFL box
        if a and b and a != b: issue, sev = f'graders disagree: recap {a} vs lib {b}', 'BLOCK'
        elif st in ('WON', 'LOST', 'PUSH') and a and a != st: issue, sev = f'recap {a} vs stored {st}', 'BLOCK'
        elif a is None and b is None:
            # a settled stored status stands in for exotic markets (teasers, cross-week SGP legs, longest reception)
            issue, sev = ('neither grader can grade; stored status used', 'WARN') if st in ('WON', 'LOST', 'PUSH') else ('neither grader can grade', 'BLOCK' if src == 'placed' else 'WARN')
        elif a is None or b is None: issue, sev = f"one grader can't grade ({'recap: ' + str(atxt) if a is None else 'lib: ' + str(btxt)})", 'WARN'
        elif st in ('', None, 'PENDING', 'OPEN') and a in ('WON', 'LOST') and t.get('status') == 'SETTLED': issue, sev = f'stored PENDING, box says {a}', 'WARN'
        if issue and ad and sev == 'BLOCK': sev = 'ADJUDICATED'
        cnt[(src, 'legs')] += 1
        for who, v in (('recap', a), ('lib', b), ('stored', st)):
            if v in ('WON', 'LOST', 'PUSH'): cnt[(src, who, v)] += 1
        if issue: cnt[sev] += 1
        rows.append(dict(src=src, ticket=tid, leg=ref, sel=sel, market=l.get('market'), recap=a, recap_actual=atxt, lib=b, lib_actual=btxt,
                         stored=st, issue=issue, severity=sev, adjudication=ad))
    def wl(src, who): return f"{cnt[(src, who, 'WON')]}-{cnt[(src, who, 'LOST')]}" + (f"-{cnt[(src, who, 'PUSH')]}" if cnt[(src, who, 'PUSH')] else '')
    summary = {src: dict(legs=cnt[(src, 'legs')], recap=wl(src, 'recap'), lib=wl(src, 'lib'), stored=wl(src, 'stored'))
               for src in ('placed', 'paper', 'ai_record') if cnt[(src, 'legs')]}
    return dict(week=week, summary=summary, blocking=cnt['BLOCK'], warnings=cnt['WARN'], adjudicated=cnt['ADJUDICATED'], rows=rows)


def md(res):
    o = [f"# Grader cross-check, Week {res['week']}", '',
         f"Blocking: **{res['blocking']}** · warnings: {res['warnings']} · adjudicated: {res['adjudicated']}", '',
         '| Source | Legs | recap grade.py W-L | lib.py W-L | stored W-L |', '|---|---:|---|---|---|']
    for s, v in res['summary'].items(): o.append(f"| {s} | {v['legs']} | {v['recap']} | {v['lib']} | {v['stored']} |")
    o.append('')
    for sev in ('BLOCK', 'ADJUDICATED', 'WARN'):
        rr = [r for r in res['rows'] if r['severity'] == sev]
        if not rr: continue
        o += [f'## {sev} ({len(rr)})', '', '| Source | Ticket | Leg | Issue | recap / lib / stored |', '|---|---|---|---|---|']
        for r in rr:
            o.append(f"| {r['src']} | `{r['ticket'][-40:]}` #{r['leg']} | {r['sel'][:60]} | {r['issue']}"
                     + (f" — adjudicated {r['adjudication'].get('result')}: {r['adjudication'].get('why', '')}" if r['adjudication'] else '')
                     + f" | {r['recap']} ({r['recap_actual']}) / {r['lib']} ({r['lib_actual']}) / {r['stored']} |")
        o.append('')
    return '\n'.join(o)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int); ap.add_argument('--weeks'); ap.add_argument('--no-write', action='store_true')
    a = ap.parse_args()
    weeks = [a.week] if a.week else (lambda x, y: list(range(int(x), int(y) + 1)))(*a.weeks.split('-'))
    worst = 0
    for wk in weeks:
        res = check(wk)
        print(f"week {wk}: blocking {res['blocking']} · warnings {res['warnings']} · adjudicated {res['adjudicated']} · "
              + ' · '.join(f"{s} {v['legs']} legs recap {v['recap']} lib {v['lib']} stored {v['stored']}" for s, v in res['summary'].items()))
        for r in res['rows']:
            if r['severity'] == 'BLOCK': print(f"   BLOCK {r['src']:9} {r['ticket'][-34:]:34} #{r['leg']:>2} {r['issue']} | {r['sel'][:55]}")
        if not a.no_write:
            od = os.path.join(RECAP, 'work', f'w{wk}'); os.makedirs(od, exist_ok=True)
            json.dump(res, open(os.path.join(od, f'crosscheck_w{wk}.json'), 'w', encoding='utf-8'), indent=1, default=str)
            open(os.path.join(od, f'crosscheck_w{wk}.md'), 'w', encoding='utf-8').write(md(res))
        worst = max(worst, 2 if res['blocking'] else 0)
    sys.exit(worst)


if __name__ == '__main__':
    main()
