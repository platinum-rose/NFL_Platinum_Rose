#!/usr/bin/env python3
"""Final Gate Check — must be GREEN before the weekly Intel Report synthesis/build runs.

Run every week, twice:
  python3 scripts/master-intel/final_gate_check.py --week 8 --stage friday
  python3 scripts/master-intel/final_gate_check.py --week 8 --stage saturday
Options: --season 2026  --no-preflight (skip the node freshness table)  --json-only

What it does (read-only except its own report + the manual-confirmation template):
  * checks every REQUIRED and ADVISORY input for the week (lines, rosters, injuries, analytics,
    expert/podcast/Grok intel, synthesis queues, SuperContest inputs);
  * stage-specific freshness: Friday = build the first Master + SuperContest reports;
    Saturday = late re-run (tighter freshness, final injury reports must be confirmed);
  * manual confirmations live in data/generated/master-intel/w<WW>-gate-manual.json
    (template created on first run; set each item true with a note when done);
  * writes reports/intel/gates/w<WW>-final-gate-<stage>.md (+ .json) and exits
    0 = GREEN (no REQUIRED failures), 1 = RED.
GREEN means: start agents/dev/WEEKLY_INTEL_REPORT_RUN_PROMPT.md for that stage.
ADVISORY warnings never block; they are listed in the report's gaps section.
"""
import argparse, datetime as dt, glob, json, os, re, subprocess, sys
from zoneinfo import ZoneInfo

PT = ZoneInfo('America/Los_Angeles')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)

ap = argparse.ArgumentParser()
ap.add_argument('--week', type=int, required=True)
ap.add_argument('--stage', choices=['friday', 'saturday'], required=True)
ap.add_argument('--season', type=int, default=2026)
ap.add_argument('--no-preflight', action='store_true')
ap.add_argument('--json-only', action='store_true')
a = ap.parse_args()
W, WW, S, STAGE = a.week, f'{a.week:02d}', a.season, a.stage
NOW = dt.datetime.now(dt.timezone.utc)
# max age in hours: (friday, saturday)
AGE = dict(lines=(30, 8), splits=(30, 8), injuries=(24, 10), starters=(30, 14), pull=(30, 10),
           weather=(48, 24), queue=(24, 6), markets=(36, 14), power=(8 * 24, 8 * 24))
def maxage(k): return AGE[k][0 if STAGE == 'friday' else 1]

results = []
def add(cid, group, title, level, status, detail, fix=''):
    results.append(dict(id=cid, group=group, title=title, level=level, status=status, detail=detail, fix=fix))

def J(p, d=None):
    try:
        with open(p, encoding='utf-8') as f: return json.load(f)
    except Exception: return d

def age_h(p):
    try: return (NOW.timestamp() - os.path.getmtime(p)) / 3600
    except Exception: return None

def newest(pattern):
    fs = [f for f in glob.glob(pattern) if os.path.isfile(f)]
    return max(fs, key=os.path.getmtime) if fs else None

def fresh(cid, group, title, level, path, key, extra='', fix=''):
    if not path or not os.path.exists(path):
        add(cid, group, title, level, 'FAIL', f'missing: {path or "(no file)"}', fix); return False
    h = age_h(path); lim = maxage(key)
    ok = h <= lim
    add(cid, group, title, level, 'PASS' if ok else ('FAIL' if level == 'REQUIRED' else 'WARN'),
        f'{path} — {h:.1f}h old (limit {lim}h){extra}', '' if ok else fix)
    return ok

# ---------- slate ----------
slate_p = f'data/generated/team-dossiers/w{WW}-slate.json'
slate = J(slate_p, {}) or {}
def kick_pt(g):
    m = re.match(r'\w+ (\d+)/(\d+) (\d+):(\d+)', g.get('kickoff_pt', ''))
    if not m: return None
    mo, d, H, M = map(int, m.groups()); yr = S if mo >= 8 else S + 1
    return dt.datetime(yr, mo, d, H, M, tzinfo=PT)
games = slate.get('games') or []
remaining = [g for g in games if (kick_pt(g) or NOW) >= NOW.astimezone(PT)]
REM = len(remaining)
REM_KEYS = {f"{g['away']}@{g['home']}" for g in remaining}
if not games:
    add('A1', 'Analysis layer', 'Week slate', 'REQUIRED', 'FAIL', f'{slate_p} missing/empty', 'Build + confirm the slate early in the week (Tue).')
else:
    conf = slate.get('operator_confirmed') is True
    add('A1', 'Analysis layer', 'Week slate confirmed', 'REQUIRED', 'PASS' if conf else 'FAIL',
        f'{len(games)} games, {REM} still to play; operator_confirmed={slate.get("operator_confirmed")}',
        '' if conf else 'Andy confirms the slate (should happen Tue, not Fri).')

dd = f'data/generated/team-dossiers/{S}-w{WW}'
n_dd = len(glob.glob(f'{dd}/*.json'))
add('A2', 'Analysis layer', 'Team dossiers', 'REQUIRED', 'PASS' if n_dd >= 2 * max(REM, 1) else 'FAIL',
    f'{dd}: {n_dd} team files', '' if n_dd >= 2 * max(REM, 1) else 'Build team dossiers for the week.')

rv = J(f'data/generated/master-intel/w{WW}-roster-vet.json', {}) or {}
rv_ok = rv.get('status') == 'PASS'
add('A3', 'Analysis layer', 'Roster gate (ESPN 2026, strict)', 'REQUIRED', 'PASS' if rv_ok else 'FAIL',
    f'status={rv.get("status")}, roster age {rv.get("roster_age_h")}h, blocking={len(rv.get("blocking") or [])}',
    '' if rv_ok else f'python3 scripts/nfl-rosters/roster_vet.py --week {W} --date <date> --fetch --strict; fix names in source files.')

# ---------- lines & markets ----------
bkr = newest(f'data/generated/props/bookmaker-live-*-week{W}.json')
bj = J(bkr, {}) if bkr else {}
ok = fresh('L1', 'Lines & markets', 'Bookmaker capture (SGP props + game lines)', 'REQUIRED', bkr, 'lines',
           f'; games={bj.get("games")} (need {REM})', 'Recapture BKR via Claude in Chrome (runbook §2), parse with bookmaker-sgp-dump-parse.mjs.')
if ok and (bj.get('games') or 0) < REM:
    results[-1]['status'] = 'FAIL'; results[-1]['fix'] = 'Capture is missing games.'
BKR_DATE = re.search(r'(\d{4}-\d{2}-\d{2})', bkr or '').group(1) if bkr else None
gl = f'data/generated/props/bookmaker-gamelines-{BKR_DATE}-week{W}.raw.txt' if BKR_DATE else None
gl_ok = bool(gl and os.path.exists(gl))
add('L2', 'Lines & markets', 'BKR game-lines file for the synthesis queue', 'REQUIRED', 'PASS' if gl_ok else 'FAIL',
    gl or '(no BKR capture)', '' if gl_ok else 'Write bookmaker-gamelines-<date>-week<N>.raw.txt from the capture (format: "AWY@HOM AWY +x odds | HOM -x odds | oT | uT | ML ...").')

op = f'data/odds/actionnetwork-openers-{S}-w{WW}.json'
add('L3', 'Lines & markets', 'Action Network openers (line-move baseline)', 'REQUIRED', 'PASS' if os.path.exists(op) else 'FAIL', op,
    '' if os.path.exists(op) else f'python3 scripts/master-intel/actionnetwork_openers.py --week {W} (or browser pull).')

pull_p = f'data/generated/master-intel/w{WW}-pull.json'
pull = J(pull_p, {}) or {}
fresh('L4', 'Lines & markets', 'Master Intel pull (signals, expert picks, articles, splits)', 'REQUIRED', pull_p, 'pull',
      f'; pulled_at={pull.get("pulled_at")}, signals={len(pull.get("signals") or [])}, expert={len(pull.get("expert") or [])}',
      f'NODE_USE_ENV_PROXY=1 node scripts/master-intel/pull.mjs --week {W}')
spl = pull.get('splits') or []
cap = max((s.get('captured_at') or '' for s in spl), default='')
try: sp_age = (NOW - dt.datetime.fromisoformat(cap.replace('Z', '+00:00'))).total_seconds() / 3600
except Exception: sp_age = 1e9
sp_ok = len(spl) >= REM and sp_age <= maxage('splits')
add('L5', 'Lines & markets', 'Betting splits (Action Network)', 'REQUIRED', 'PASS' if sp_ok else 'FAIL',
    f'{len(spl)} games, newest capture {cap or "?"} ({sp_age:.1f}h; limit {maxage("splits")}h)' if sp_age < 1e8 else f'{len(spl)} games, no capture time',
    '' if sp_ok else 'Re-pull AN splits (Claude in Chrome, api v2 scoreboard bookIds=15) into the pull json.')

beo = newest(f'data/generated/props/betonline-live-*-week{W}.json')
beo_rows = len((J(beo, {}) or {}).get('rows') or []) if beo else 0
add('L6', 'Lines & markets', 'BetOnline player props (prop stacks, props pass)', 'REQUIRED' if STAGE == 'saturday' else 'ADVISORY',
    'PASS' if beo and age_h(beo) <= maxage('lines') and beo_rows >= 500 else ('FAIL' if STAGE == 'saturday' else 'WARN'),
    f'{beo or "none"}; rows={beo_rows}; age={age_h(beo) and round(age_h(beo),1)}h', 'npm run props:bol:cron (BEO posts Sunday props ~Sat afternoon).')
dkp = newest(f'data/generated/props/dk-predictions-*.json')
add('L7', 'Lines & markets', 'DraftKings Predictions props', 'ADVISORY',
    'PASS' if dkp and age_h(dkp) <= maxage('lines') else 'WARN', f'{dkp or "none"}',
    'npm run props:dkp:launch (log in) → npm run props:dkp:cron → npm run props:dkp:defense')
fresh('L8', 'Lines & markets', 'Prediction markets + coherence', 'ADVISORY', 'data/prediction-markets/cross-market-coherence-latest.json', 'markets', fix='Friday/Saturday cadence.')
scl = f'data/supercontest/week-{WW}-lines.json'
add('L9', 'Lines & markets', 'SuperContest contest lines', 'REQUIRED', 'PASS' if os.path.exists(scl) else 'FAIL', scl,
    '' if os.path.exists(scl) else 'Load the official SC sheet (Wed).')

# ---------- injuries / starters / weather ----------
fresh('I1', 'Rosters & injuries', 'Player availability / injury report', 'REQUIRED', 'data/player-availability/latest.json', 'injuries', fix='node scripts/build-player-availability.js (cadence).')
st = newest(f'data/projected-starters/{S}/projected-starters-*.json')
fresh('I2', 'Rosters & injuries', 'Projected starters', 'REQUIRED', st, 'starters', fix='Refresh projected starters (cadence).')
wx = f'data/research-intel/review/{S}-w{WW}-weather-venue.json'
fresh('I3', 'Rosters & injuries', 'Weather / venue', 'REQUIRED' if STAGE == 'saturday' else 'ADVISORY', wx, 'weather', fix='Refresh forecasts (built-in browser workaround).')

# ---------- analytics ----------
fresh('Q1', 'Analytics', 'Team power ratings / SRS (fair lines)', 'REQUIRED', f'data/generated/team-profiles/team-power-ratings-{S}.json', 'power', fix='Rebuild after the prior week completes (Tue).')
sec = f'data/secondary-matchups/secondary-matchup-vulnerability-{S}-w{WW}.json'
add('Q2', 'Analytics', 'Secondary matchup vulnerability', 'REQUIRED', 'PASS' if os.path.exists(sec) else 'FAIL', sec, '' if os.path.exists(sec) else 'npm run secondary-matchups')
ftn = 'data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json'
add('Q3', 'Analytics', 'FTN Stats IQ weekly context', 'REQUIRED', 'PASS' if os.path.exists(ftn) and age_h(ftn) <= 8 * 24 else 'FAIL', f'{ftn} ({age_h(ftn) and round(age_h(ftn))}h)', 'FTN refresh (weekly only).')
fl = f'reports/intel/w{WW}-model/fair-lines-w{WW}.json'
add('Q4', 'Analytics', 'Fair-line model + simulator inputs', 'ADVISORY', 'PASS' if os.path.exists(fl) else 'WARN', fl, 'Re-run fair_lines.py on current lines (stage run does this).')

# ---------- expert / media intel ----------
yt = f'data/podcasts/youtube-extracted-picks-{S}-w{WW}.json'
ytj = J(yt, {}) or {}
yt_ok = os.path.exists(yt) and len(ytj.get('picks') or []) > 0
add('E1', 'Expert & media intel', 'YouTube / podcast picks (Gemini, cleaned)', 'REQUIRED', 'PASS' if yt_ok else 'FAIL',
    f'{yt}: {len(ytj.get("picks") or [])} picks' if os.path.exists(yt) else f'missing: {yt}',
    '' if yt_ok else 'Sweep → Gemini extraction (Andy terminal) → clean to the picks file (runbook §4).')
grok_dir = f'data/vault-seed/manual/grok-week{WW}-threads'
grok = sorted(glob.glob(f'{grok_dir}/*.csv'))
add('E2', 'Expert & media intel', 'Grok X-thread extraction (every week)', 'REQUIRED', 'PASS' if grok else 'FAIL',
    f'{len(grok)} CSV in {grok_dir}' + (f' (latest {os.path.basename(grok[-1])})' if grok else ''),
    '' if grok else 'Paste data/research-intel/grok-thread-prompt-latest.md into Grok → save CSV there → node scripts/load-external-intel-picks.mjs --dry-run, then --replace.')
bp = f'reports/intel/bettingpros-articles-{S}-w{WW}.md'
add('E3', 'Expert & media intel', 'BettingPros article intel', 'ADVISORY', 'PASS' if os.path.exists(bp) else 'WARN', bp, 'Read the week\'s BettingPros NFL articles (Claude in Chrome).')
en = f'reports/intel/expert-narratives-{S}-w{WW}.md'
add('E4', 'Expert & media intel', 'Per-expert narrative summaries', 'ADVISORY', 'PASS' if os.path.exists(en) else 'WARN', en, 'Written during the stage run (step 6).')
fh = [f for f in (pull.get('feed_health') or []) if f.get('last_status') != 'available']
add('E5', 'Expert & media intel', 'Article feed health', 'ADVISORY', 'PASS' if not fh else 'WARN',
    'all feeds available' if not fh else '; '.join(f"{f['source']}: {f.get('last_reason')}" for f in fh), 'Cover failed feeds by browser pulls.')

# ---------- podcast / article / twitter intel + preferred-expert final cards ----------
pg = pull.get('podcast_gemini_summary') or {}
pod_n = pull.get('podcast_transcripts_processed') or 0
pod_ok = pod_n > 0 and ((pg.get('picks') or 0) > 0 or yt_ok)
add('E6', 'Expert & media intel', 'Podcast intel (audio transcripts + promoted picks)', 'REQUIRED', 'PASS' if pod_ok else 'FAIL',
    f'transcripts processed={pod_n}; promoted episodes={pg.get("promoted_episodes")}, picks={pg.get("picks")}; YouTube picks file={"yes" if yt_ok else "no"}',
    '' if pod_ok else 'Run the podcast transcript pipeline / promotion; YouTube picks (E1) count toward this.')
sig = pull.get('signals') or []
art = [x for x in sig if 'Twitter' not in (x.get('source') or '')]
tw = [x for x in sig if 'Twitter' in (x.get('source') or '')]
def newest_ts(rows):
    ts = max((r.get('captured_at') or '' for r in rows), default='')
    try: return ts, (NOW - dt.datetime.fromisoformat(ts.replace('Z', '+00:00'))).total_seconds() / 3600
    except Exception: return ts, 1e9
ats, aage = newest_ts(art)
art_ok = len(art) >= 20 and aage <= maxage('pull')
add('E7', 'Expert & media intel', 'Article intel (VSiN, ESPN, Action Network, BettingPros, PFT, Walter...)', 'REQUIRED', 'PASS' if art_ok else 'FAIL',
    f'{len(art)} article signals; sources={dict(__import__("collections").Counter(x.get("source") for x in art))}; newest {ats} ({aage:.1f}h)' if aage < 1e8 else f'{len(art)} article signals',
    '' if art_ok else f'Refresh article ingest, then NODE_USE_ENV_PROXY=1 node scripts/master-intel/pull.mjs --week {W}')
tts, tage = newest_ts(tw)
tw_ok = len(tw) > 0 and tage <= maxage('injuries')
add('E8', 'Expert & media intel', 'Twitter/X bookmark intel (text)', 'REQUIRED', 'PASS' if tw_ok else 'FAIL',
    f'{len(tw)} bookmark signals; newest {tts} ({tage:.1f}h)' if tage < 1e8 else f'{len(tw)} bookmark signals',
    '' if tw_ok else 'node scripts/twitter-bookmarks-cron.js (bookmark sync), then re-pull.')
mq_p = f'data/twitter/w{WW}-media-extraction-queue.json'
mq = J(mq_p, {}) or {}
pend = [i for i in (mq.get('items') or []) if i.get('status') == 'pending' and i.get('relevance') == 'sunday_slate']
lvl = 'REQUIRED' if STAGE == 'saturday' else 'ADVISORY'
if not mq:
    add('E9', 'Expert & media intel', 'Twitter media queue (videos / images / threads)', 'REQUIRED', 'FAIL', f'missing: {mq_p}',
        'Build the week queue from data/research-intel/twitter-video-queue.json + the Grok thread packet.')
else:
    from collections import Counter as _C
    add('E9', 'Expert & media intel', 'Twitter media queue (videos / images / threads) processed', lvl,
        'PASS' if not pend else ('FAIL' if lvl == 'REQUIRED' else 'WARN'),
        f'{mq_p}: {len(pend)} Sunday-slate items still pending ({dict(_C(i["kind"] for i in pend))})',
        '' if not pend else 'Process each item (video transcription, Grok threads, image capture) or mark it skipped with a reason.')
ros = J('data/expert-tracking/preferred-experts-2026.json', {}) or {}
exps = [e for e in (ros.get('experts') or []) if e.get('active', True)]
corpus = []
for x in pull.get('expert') or []: corpus.append(('pull:expert', json.dumps(x)))
for x in sig: corpus.append((f'pull:{x.get("source")}', json.dumps(x)))
for x in ytj.get('picks') or []: corpus.append(('youtube', json.dumps(x)))
for f in grok: corpus.append(('grok', open(f, encoding='utf-8', errors='ignore').read()))
for f in glob.glob(f'data/twitter/twitter-video-picks-{S}-w{WW}.json') + [bp, en, f'data/intel/extracted/{S}-w{WW}-primer-intel.json']:
    if os.path.exists(f): corpus.append((os.path.basename(f), open(f, encoding='utf-8', errors='ignore').read()))
found, missing = {}, []
for e in exps:
    al = [a.lower() for a in (e.get('aliases') or []) + [e['name']]]
    hits = sorted({src for src, txt in corpus if any(a in txt.lower() for a in al)})
    (found.__setitem__(e['name'], hits) if hits else missing.append(e['name']))
excused = set((man_pre := (J(f'data/generated/master-intel/w{WW}-gate-manual.json', {}) or {})).get('experts_no_card', {}).get('names', []))
unexcused = [m for m in missing if m not in excused]
confirmed = ros.get('status') == 'confirmed'
lvl = 'REQUIRED' if STAGE == 'saturday' else 'ADVISORY'
ok = bool(exps) and confirmed and not unexcused
add('E10', 'Expert & media intel', 'Preferred-expert final cards (coverage)', lvl, 'PASS' if ok else ('FAIL' if lvl == 'REQUIRED' else 'WARN'),
    f'roster status={ros.get("status")}; {len(found)}/{len(exps)} experts with a Week {W} card found; missing: {", ".join(unexcused) or "none"}' + (f'; excused (no card published): {", ".join(sorted(excused & set(missing)))}' if excused & set(missing) else ''),
    '' if ok else ('Andy confirms data/expert-tracking/preferred-experts-2026.json (status "confirmed"). ' if not confirmed else '') + 'Find each missing expert\'s card (article / podcast / YouTube / X) and ingest it, or list them under "experts_no_card": {"names": [...], "note": ...} in the gate-manual file after checking.')
EXPERT_COVERAGE = dict(found=found, missing=missing)

# ---------- synthesis queues ----------
for cid, pss, lvl in (('S1', 'sides', 'REQUIRED'), ('S2', 'props', 'REQUIRED' if STAGE == 'saturday' else 'ADVISORY')):
    qp = f'scratch/w{WW}-game-synthesis-queue-{pss}.json'
    q = J(qp, {}) or {}
    pk = q.get('packets') or []
    pk = pk if isinstance(pk, list) else list(pk.values())
    miss = {p.get('matchup'): p.get('missing_inputs') for p in pk if p.get('missing_inputs')}
    newer_inputs = [x for x in (bkr, pull_p, yt, *(grok[-1:] if grok else []), *glob.glob(f'data/twitter/twitter-video-picks-{S}-w{WW}.json')) if x and os.path.exists(x) and os.path.exists(qp) and os.path.getmtime(x) > os.path.getmtime(qp)]
    good = os.path.exists(qp) and len(pk) >= REM and not newer_inputs and (not miss or lvl == 'ADVISORY')
    add(cid, 'Synthesis queues', f'{pss.title()} synthesis queue', lvl, 'PASS' if good else ('FAIL' if lvl == 'REQUIRED' else 'WARN'),
        (f'{qp}: {len(pk)} packets; missing={json.dumps(miss)[:300] if miss else "none"}' + (f'; STALE vs newer inputs: {", ".join(os.path.basename(x) for x in newer_inputs)}' if newer_inputs else ''))
        if os.path.exists(qp) else f'missing: {qp}',
        '' if good else f'python3 scripts/intel/build-game-synthesis-queue.py --week {W} --pass {pss} --date {BKR_DATE or "<bkr date>"} (rebuild LAST, after every input above).')

# ---------- manual confirmations ----------
mp = f'data/generated/master-intel/w{WW}-gate-manual.json'
TEMPLATE = {
  'news_flags_resolved': {'done': False, 'note': 'Trades, QB changes, pulled markets, late news checked by live search and reflected in packets/narratives', 'required': ['friday', 'saturday']},
  'qb_status_confirmed': {'done': False, 'note': 'Every starting QB confirmed (team sites / insiders)', 'required': ['friday', 'saturday']},
  'final_injury_reports_checked': {'done': False, 'note': "Friday's official designations (Out/Doubtful/Questionable) checked for every game", 'required': ['saturday']},
  'supercontest_report_reviewed': {'done': False, 'note': 'Andy has the Friday SC Intel report (the official five is NOT a prerequisite for either report)', 'required': []},
}
man = J(mp)
if man is None:
    os.makedirs(os.path.dirname(mp), exist_ok=True)
    with open(mp, 'w', encoding='utf-8') as f: json.dump(TEMPLATE, f, indent=1)
    man = TEMPLATE
for k, v in man.items():
    req = STAGE in (v.get('required') or [])
    done = v.get('done') is True
    add(f'M-{k}', 'Manual confirmations', k.replace('_', ' '), 'REQUIRED' if req else 'ADVISORY',
        'PASS' if done else ('FAIL' if req else 'WARN'), (v.get('note') or '') + (f' — {v.get("by","")} {v.get("at","")}'.rstrip(' —') if done else ''),
        '' if done else f'Set "done": true (+ "by", "at") in {mp} when confirmed.')

# ---------- preflight (freshness table) ----------
pre = ''
if not a.no_preflight:
    try:
        env = dict(os.environ, NODE_USE_ENV_PROXY='1')
        pre = subprocess.run(['node', 'scripts/weekly-synthesis-preflight.mjs', '--week', str(W)], capture_output=True, text=True, timeout=150, env=env).stdout
    except Exception as e:
        pre = f'(preflight not run: {e})'

# ---------- verdict + report ----------
req_fail = [r for r in results if r['level'] == 'REQUIRED' and r['status'] == 'FAIL']
warn = [r for r in results if r['status'] in ('WARN',) or (r['level'] == 'ADVISORY' and r['status'] == 'FAIL')]
verdict = 'GREEN' if not req_fail else 'RED'
os.makedirs('reports/intel/gates', exist_ok=True)
base = f'reports/intel/gates/w{WW}-final-gate-{STAGE}'
out = dict(schema='final_gate_check_v1', season=S, week=W, stage=STAGE, run_at=NOW.astimezone(PT).isoformat(), verdict=verdict,
           games_remaining=REM, bkr_capture_date=BKR_DATE, expert_coverage=EXPERT_COVERAGE, required_failures=len(req_fail), warnings=len(warn), checks=results)
with open(base + '.json', 'w', encoding='utf-8') as f: json.dump(out, f, indent=1)
icon = {'PASS': '✅', 'WARN': '⚠️', 'FAIL': '❌'}
L = [f'# Final Gate Check — {S} Week {W} — {STAGE.title()} run', '',
     f'Run {NOW.astimezone(PT).strftime("%a %b %-d, %-I:%M %p PT")} · games to play: {REM} · BKR capture date: {BKR_DATE}', '',
     f'## Verdict: **{verdict}** — {len(req_fail)} required failure(s), {len(warn)} advisory warning(s)', '',
     ('All REQUIRED gates pass → start `agents/dev/WEEKLY_INTEL_REPORT_RUN_PROMPT.md` with STAGE=' + STAGE + '.') if verdict == 'GREEN'
     else 'Do NOT start the synthesis/report run. Fix the ❌ REQUIRED rows below (top first), then re-run this check.', '']
if req_fail:
    L += ['### Blocking items', ''] + [f'- ❌ **{r["id"]} {r["title"]}** — {r["detail"]}  \n  Fix: {r["fix"]}' for r in req_fail] + ['']
grp = None
for r in results:
    if r['group'] != grp:
        grp = r['group']; L += ['', f'## {grp}', '', '| # | Check | Level | Status | Detail | Fix |', '|---|---|---|---|---|---|']
    L.append(f'| {r["id"]} | {r["title"]} | {r["level"]} | {icon[r["status"]]} {r["status"]} | {r["detail"].replace("|", "/")} | {r["fix"].replace("|", "/")} |')
L += ['', f'## Preferred-expert cards — Week {W}', '', '| Expert | Card found in |', '|---|---|'] + [f'| {n} | {", ".join(h)} |' for n, h in sorted(EXPERT_COVERAGE['found'].items())] + [f'| {n} | ❌ not found |' for n in EXPERT_COVERAGE['missing']]
mqi = (J(f'data/twitter/w{WW}-media-extraction-queue.json', {}) or {}).get('items') or []
if mqi:
    L += ['', '## Twitter media queue (Sunday-slate items)', '', '| Kind | Author | Status | Tweet | Method |', '|---|---|---|---|---|'] + [f'| {i["kind"]} | {i["author"]} | {i["status"]} | {i["tweet_url"]} | {i["method"][:70]} |' for i in mqi if i.get('relevance') == 'sunday_slate']
if pre:
    L += ['', '## Preflight freshness table (`weekly-synthesis-preflight.mjs`)', '', '```', pre.strip(), '```']
with open(base + '.md', 'w', encoding='utf-8') as f: f.write('\n'.join(L) + '\n')
if not a.json_only:
    print(f'FINAL GATE {STAGE.upper()} W{W}: {verdict} — {len(req_fail)} required failure(s), {len(warn)} warning(s)')
    for r in req_fail: print(f'  ❌ {r["id"]} {r["title"]}: {r["detail"][:160]}')
    print(f'Report: {base}.md')
sys.exit(0 if verdict == 'GREEN' else 1)
