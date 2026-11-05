#!/usr/bin/env python3
"""Tuesday post-mortem: one command from box scores to the season-recap page.

  python3 reports/bets/season-recap/scripts/postmortem.py --week 9 [--fetch] [--force] [--no-page] [--allow-pending]

Steps (read-only on the wagers ledger and paper ledger; never places, settles, syncs or publishes anything):
  0 --fetch: cache ESPN summaries for the week's final games (data/fantasy/boxscores/espn-<id>.json)
  1 espn_week.py           -> wNgames.json / wNgamesum.json      (stops if a game isn't final unless --allow-pending)
  2 crosscheck.py          -> work/wN/crosscheck_wN.{json,md}   (stops on a blocking grader mismatch unless --force)
  3 build.py               -> wNlegs.json (placed legs regraded; AI record from data/official-picks/ai-proposals/2026-wNN.json)
  4 paper.py / paper_wN.py -> wNpaper.json (paper tickets + AI proposals graded)
  5 rules.py check         -> work/wN/rules_wN.{json,md}
  6 scorecard.py           -> work/wN/scorecard_wN.{json,md,html}
  7 gen_cfg.py (if cfg_wN.py is missing or still an untouched AUTO DRAFT) -> auto-draft cfg_wN.py + recaps_wN.py
  8 gen_week.py + page_week.py in work/wN -> weekN-post-mortem.html (previous page backed up)
  9 work/wN/postmortem_wN.md index; ends with the "max 3 rules for next week" prompt
"""
import argparse, datetime, glob, json, os, shutil, subprocess, sys, urllib.request
D = os.path.dirname(os.path.abspath(__file__)); RECAP = os.path.abspath(os.path.join(D, '..'))
ROOT = os.path.abspath(os.path.join(RECAP, '..', '..', '..'))
PY = sys.executable
STAMP = datetime.datetime.now().strftime('%Y%m%d-%H%M')


def run(args, env=None, cwd=None, ok=(0,)):
    e = dict(os.environ, **(env or {}))
    print(f"\n>> {' '.join(os.path.relpath(a, ROOT) if os.path.isabs(a) else a for a in args)}", flush=True)
    r = subprocess.run(args, cwd=cwd or RECAP, env=e, text=True, capture_output=True, encoding='utf-8', errors='replace')
    out = (r.stdout or '') + (r.stderr or '')
    tail = out.strip().splitlines()[-25:]
    print('\n'.join('   ' + x for x in tail))
    if r.returncode not in ok: raise SystemExit(f'step failed (exit {r.returncode}): {args[1] if len(args) > 1 else args[0]}')
    return r.returncode, out


def fetch(week, season=2026):
    base = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl'
    sb = json.load(urllib.request.urlopen(f'{base}/scoreboard?seasontype=2&week={week}&dates={season}', timeout=30))
    box = os.path.join(ROOT, 'data', 'fantasy', 'boxscores'); os.makedirs(box, exist_ok=True); n = 0; pend = []
    for ev in sb.get('events', []):
        if ev['status']['type']['name'] != 'STATUS_FINAL': pend.append(ev['shortName']); continue
        txt = urllib.request.urlopen(f"{base}/summary?event={ev['id']}", timeout=30).read().decode('utf-8'); json.loads(txt)
        open(os.path.join(box, f"espn-{ev['id']}.json"), 'w', encoding='utf-8').write(txt); n += 1
    print(f'   cached {n} final box scores; not final: {pend or "none"}')
    return pend


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--week', type=int, required=True); ap.add_argument('--fetch', action='store_true')
    ap.add_argument('--force', action='store_true', help='build the page even with blocking grader mismatches')
    ap.add_argument('--allow-pending', action='store_true'); ap.add_argument('--no-page', action='store_true')
    a = ap.parse_args(); wk = a.week; work = os.path.join(RECAP, 'work', f'w{wk}'); os.makedirs(work, exist_ok=True)
    env = dict(WEEK=str(wk), RECAP_DIR=RECAP, PYTHONPATH=os.pathsep.join([D, RECAP]), QUIET='1', PYTHONIOENCODING='utf-8')
    notes = []
    print(f'=== Post-mortem Week {wk} ({STAMP}) ===')
    if a.fetch:
        print('\n0. Fetching ESPN box scores'); pend = fetch(wk)
        if pend: notes.append(f'not final at fetch: {", ".join(pend)}')
    print('\n1. Game files from the box-score cache')
    _, out = run([PY, os.path.join(D, 'espn_week.py'), '--week', str(wk), '--out', RECAP], env)
    if 'pending: none' not in out and not a.allow_pending:
        raise SystemExit('Some games are not final in the cache. Re-run with --fetch after the late games, or pass --allow-pending.')
    print('\n2. Grader cross-check (grade.py vs lib.py vs stored)')
    rc, _ = run([PY, os.path.join(D, 'crosscheck.py'), '--week', str(wk)], env, ok=(0, 2))
    if rc == 2:
        notes.append(f'BLOCKING grader mismatches: see work/w{wk}/crosscheck_w{wk}.md')
        if not a.force: raise SystemExit(f'Blocking grader mismatches. Fix the grader or adjudicate in scripts/crosscheck-adjudications.json, then re-run (or --force). Report: work/w{wk}/crosscheck_w{wk}.md')
    print('\n3. Placed legs regrade + AI record match')
    for f in (f'w{wk}legs.json', f'w{wk}paper.json'):
        p = os.path.join(RECAP, f)
        if os.path.exists(p): shutil.copy2(p, os.path.join(work, f'{f}.prev-{STAMP}'))
    run([PY, os.path.join(D, 'build.py')], env)
    print('\n4. Paper tickets + AI proposals')
    legacy = os.path.join(D, f'paper_w{wk}.py')
    run([PY, legacy if os.path.exists(legacy) else os.path.join(D, 'paper.py')], env)
    print('\n5. Rules check')
    run([PY, os.path.join(D, 'rules.py'), 'check', '--week', str(wk)], env)
    print('\n6. Scorecard')
    run([PY, os.path.join(D, 'scorecard.py'), '--week', str(wk)], env)
    page = os.path.join(RECAP, f'week{wk}-post-mortem.html')
    if not a.no_page:
        cfg = os.path.join(D, f'cfg_w{wk}.py')
        auto = os.path.exists(cfg) and 'AUTO DRAFT' in open(cfg, encoding='utf-8').readline()
        if not os.path.exists(cfg) or auto:  # an untouched auto draft is regenerated; delete its header line once hand-edited
            print('\n7. Auto-draft page config'); run([PY, os.path.join(D, 'gen_cfg.py'), '--week', str(wk)] + (['--force'] if auto else []), env)
            notes.append(f'cfg_w{wk}.py / recaps_w{wk}.py are an AUTO DRAFT: edit the [auto draft] text before sharing the page')
        print('\n8. Page')
        for f in (f'w{wk}legs.json', f'w{wk}paper.json', f'w{wk}gamesum.json'): shutil.copy2(os.path.join(RECAP, f), os.path.join(work, f))
        shutil.copy2(os.path.join(D, 'css_part.txt'), os.path.join(work, 'css_part.txt'))
        run([PY, os.path.join(D, 'gen_week.py'), str(wk)], env, cwd=work)
        run([PY, os.path.join(D, 'page_week.py'), str(wk)], env, cwd=work)
        if os.path.exists(page): shutil.copy2(page, os.path.join(work, f'week{wk}-post-mortem.html.prev-{STAMP}'))
        shutil.copy2(os.path.join(work, f'week{wk}-post-mortem.html'), page)
    xc = json.load(open(os.path.join(work, f'crosscheck_w{wk}.json')))
    idx = [f'# Week {wk} post-mortem run ({STAMP})', '',
           f'- Page: `reports/bets/season-recap/week{wk}-post-mortem.html`' + (' (not built: --no-page)' if a.no_page else ''),
           f'- Scorecard: `work/w{wk}/scorecard_w{wk}.md`', f'- Rules check: `work/w{wk}/rules_w{wk}.md`',
           f"- Grader cross-check: `work/w{wk}/crosscheck_w{wk}.md` (blocking {xc['blocking']}, warnings {xc['warnings']}, adjudicated {xc['adjudicated']}); "
           + ' · '.join(f"{s} recap {v['recap']} / lib {v['lib']} / stored {v['stored']}" for s, v in xc['summary'].items()),
           f'- Leg tables: `w{wk}legs.json`, `w{wk}paper.json` (previous copies in work/w{wk}/*.prev-*)', '']
    idx += ['## Notes'] + [f'- {n}' for n in notes] if notes else []
    idx += ['', '## Close the loop', f'End the write-up with at most 3 rules for Week {wk + 1}:',
            f'`python3 scripts/rules.py propose --week {wk} --id R{wk}-1 --text "..." [--check max_legs|read_reuse|lane_pref|shaky_qb|no_master_rr|manual]`',
            'Andy accepts with `rules.py accept --id ...`; the next post-mortem checks whether each was followed and whether it helped.']
    open(os.path.join(work, f'postmortem_w{wk}.md'), 'w', encoding='utf-8').write('\n'.join(idx) + '\n')
    print('\n' + '\n'.join(idx))


if __name__ == '__main__':
    main()
