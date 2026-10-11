#!/usr/bin/env python3
"""Fetch ESPN public NFL injuries + depth charts (no key, no paid API) and derive the QB starter per team.
Rule: QB1 = first QB on ESPN's depth chart. An injury-report status of Out / Injured Reserve / Suspended moves the starter to the next QB.
Questionable / Doubtful = AMBIGUOUS (flagged). No entry, or Active = expected starter.
Writes data/research-intel/source-evidence/espn-status-w05.json. Read-only against ESPN; no other side effects.
Usage: python3 scripts/intel/fetch-espn-status.py [--out PATH]"""
import argparse, json, time, urllib.request
from datetime import datetime, timezone

BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl'
OUT = 'data/research-intel/source-evidence/espn-status-w05.json'
ROSTER = 'data/nfl-rosters/espn-full-rosters-latest.json'
OUTSTAT = ('out', 'injured reserve', 'suspended', 'physically unable to perform', 'non football injury')
AMBIG = ('questionable', 'doubtful', 'day-to-day')


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default=OUT); a = ap.parse_args()
    teams = [t['team'] for t in get(BASE + '/teams')['sports'][0]['leagues'][0]['teams']]
    inj_raw = get(BASE + '/injuries')
    inj = {}
    for g in inj_raw.get('injuries', []):
        inj[g['displayName']] = [{'player': i['athlete']['displayName'], 'pos': (i['athlete'].get('position') or {}).get('abbreviation'), 'status': i.get('status'), 'date': (i.get('date') or '')[:10], 'comment': (i.get('shortComment') or '')[:200]} for i in g.get('injuries', [])]
    out = {'schema': 'espn_status_v1', 'fetched_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'espn_injuries_timestamp': inj_raw.get('timestamp'),
           'rule': __doc__.strip().splitlines()[1], 'teams': {}}
    feed_names = {}
    for t in teams:
        ab = 'WAS' if t['abbreviation'] == 'WSH' else t['abbreviation']
        qbs = []
        try:
            dc = get('%s/teams/%s/depthcharts' % (BASE, t['id']))
            for grp in dc.get('depthchart', []):
                q = (grp.get('positions') or {}).get('qb')
                if q:
                    qbs = [x['displayName'] for x in q.get('athletes', [])]; break
        except Exception as ex:  # noqa
            qbs = []
        tinj = inj.get(t['displayName'], [])
        st = {i['player']: i for i in tinj}
        feed_names[ab] = set(st)
        starter, flag, note = None, 'ok', ''
        for n in qbs:
            s = (st.get(n, {}).get('status') or '').lower()
            if s in OUTSTAT:
                note += '%s %s; ' % (n, st[n]['status']); continue
            starter = n
            if s in AMBIG: flag = 'AMBIGUOUS'; note += '%s %s; ' % (n, st[n]['status'])
            break
        if not qbs: flag = 'NO_DEPTH_CHART'
        elif starter is None: flag = 'NO_AVAILABLE_QB'
        out['teams'][ab] = {'qb_depth': qbs, 'qb_starter': starter, 'qb_flag': flag, 'qb_note': note.strip(),
                            'injury_report_non_active': [i for i in tinj if (i['status'] or '').lower() != 'active'],
                            'injury_report_all_count': len(tinj)}
        time.sleep(0.2)
    # ESPN roster 'injuredReserveOrOut' group (local file from `npm run roster:fetch`; no network). These players are NOT in the injuries feed.
    # ESPN marks them day-to-day, so they are UNCONFIRMED (likely on a reserve list) - never treat as Out.
    try:
        ros = json.load(open(ROSTER, encoding='utf-8'))
        out['roster_ir_out_source'] = {'file': ROSTER, 'generated_at': ros.get('generated_at'), 'label': 'ESPN roster IR/Out group (unconfirmed)'}
        for n, lst in ros.get('players', {}).items():
            for r in lst:
                if r.get('group') != 'injuredReserveOrOut': continue
                ab = 'WAS' if r['team'] == 'WSH' else r['team']
                t = out['teams'].get(ab)
                if t is None: continue
                if n in feed_names.get(ab, set()): continue
                t.setdefault('roster_ir_out_unconfirmed', []).append({'player': n, 'pos': r.get('position'), 'roster_status': r.get('status')})
        for t in out['teams'].values():
            t['roster_ir_out_unconfirmed'] = sorted(t.get('roster_ir_out_unconfirmed', []), key=lambda x: x['player'])
    except Exception as ex:  # noqa
        out['roster_ir_out_error'] = str(ex)
    # Games ESPN lists as final (schedule.json status can lag): used to complete standings and to exclude finished games
    out['finals'] = []
    try:
        sb = get(BASE + '/scoreboard')
        for e in sb.get('events', []):
            if e['status']['type']['name'] != 'STATUS_FINAL':
                continue
            c = e['competitions'][0]['competitors']
            m = {('WAS' if t['team']['abbreviation'] == 'WSH' else t['team']['abbreviation']): int(t['score']) for t in c}
            home = next(('WAS' if t['team']['abbreviation'] == 'WSH' else t['team']['abbreviation']) for t in c if t['homeAway'] == 'home')
            away = next(('WAS' if t['team']['abbreviation'] == 'WSH' else t['team']['abbreviation']) for t in c if t['homeAway'] == 'away')
            out['finals'].append({'kickoff_utc': e['date'], 'visitor': away, 'home': home, 'visitorScore': m[away], 'homeScore': m[home], 'espn_event_id': e['id']})
    except Exception as ex:  # noqa
        out['finals_error'] = str(ex)
    json.dump(out, open(a.out, 'w', encoding='utf-8'), indent=1)
    print('finals:', out['finals'])
    for k, v in sorted(out['teams'].items()): print(k, v['qb_starter'], v['qb_flag'], v['qb_note'], '| depth', v['qb_depth'][:3])


main()
