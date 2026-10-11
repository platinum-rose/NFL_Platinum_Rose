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
    json.dump(out, open(a.out, 'w', encoding='utf-8'), indent=1)
    for k, v in sorted(out['teams'].items()): print(k, v['qb_starter'], v['qb_flag'], v['qb_note'], '| depth', v['qb_depth'][:3])


main()
