"""Create or top up the week's Pitch / Pushback files from the latest build.

Run after the first Saturday build of the week:
  python scripts/master-intel/pitch_scaffold.py --week 8 [--season 2026]

- SuperContest: one entry per Dashboard AI pick and alternate in
  dist/nfl_week<N>_master_packet/nfl_week<N>_supercontest_intelligence_summary.json
  -> reports/intel/supercontest-pitches-<season>-w<NN>.json  (keys: team, e.g. "GB")
- Master: one entry per Platinum Rose straight bet the build lists as missing a pitch
  -> reports/intel/master-pitches-<season>-w<NN>.json        (keys: "GB@DET|Side", "IND@MIN|Total")

Existing entries are never overwritten. New entries are TODO placeholders; the format gate
(check_sc_report.py) and the Master known-gaps list fail until they are written per
agents/dev/PITCH_PUSHBACK_AGENT.md. Then rebuild.
"""
import argparse, datetime, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TODO_P = 'TODO (Pitch): cited evidence for this side, with figures; see agents/dev/PITCH_PUSHBACK_AGENT.md.'
TODO_B = 'TODO (Pushback): the strongest cited case against this side, with figures and named opposing voices.'


def stub(game=None, pick=None):
    e = {'pitch': [{'text': TODO_P, 'ref': [1, 2]}, {'text': TODO_P, 'ref': [1, 2]}],
         'pushback': [{'text': TODO_B, 'ref': [1]}, {'text': TODO_B, 'ref': [1]}]}
    if game: e = {'game': game, **e}
    if pick: e = {'pick': pick, **e}
    return e


def load(p, schema, season, week, method):
    if p.exists():
        return json.loads(p.read_text(encoding='utf-8'))
    return {'schema': schema, 'season': season, 'week': week,
            'as_of': datetime.datetime.now().astimezone().isoformat(timespec='minutes'), 'method': method, 'picks': {}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--week', type=int, required=True)
    ap.add_argument('--season', type=int, default=2026)
    a = ap.parse_args()
    W, WW = a.week, f'{a.week:02d}'
    d = ROOT / f'dist/nfl_week{W}_master_packet'

    # SuperContest
    sj = d / f'nfl_week{W}_supercontest_intelligence_summary.json'
    sp = ROOT / f'reports/intel/supercontest-pitches-{a.season}-w{WW}.json'
    if sj.exists():
        rep = json.loads(sj.read_text(encoding='utf-8'))
        gid = {s['side']: s['gid'] for s in rep.get('sides', [])}
        pf = load(sp, 'supercontest_pitch_v1', a.season, W,
                  'Explains the saved proposal using Friday game syntheses and Saturday updates. Historical simulations are not fresh runs; qualitative score projections are not cover probabilities.')
        added = []
        for p in rep.get('our_five', []) + rep.get('alternates', []):
            t = p['team']
            if t not in pf['picks']:
                pf['picks'][t] = stub(game=gid.get(t)); added.append(t)
        sp.write_text(json.dumps(pf, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
        print(f'SuperContest: {sp.relative_to(ROOT)} — added {added or "nothing"}; {len(pf["picks"])} entries')
    else:
        print(f'SuperContest: no build json yet ({sj.relative_to(ROOT)}); run build.py first')

    # Master
    mm = d / f'nfl_week{W}_master_betting_intelligence_summary.md'
    mp = ROOT / f'reports/intel/master-pitches-{a.season}-w{WW}.json'
    if mm.exists():
        m = re.search(r'Platinum Rose recommendations without The Pitch / The Pushback in [^:]+: ([^\n<|]+)', mm.read_text(encoding='utf-8'))
        missing = [x.strip() for x in m.group(1).split(',')] if m else []
        pf = load(mp, 'master_pitch_v1', a.season, W, 'Pitch / Pushback for every Platinum Rose straight bet (Andy 2026-10-24).')
        added = []
        for x in missing:
            g, _, typ = x.rpartition(' ')
            k = f'{g}|{typ}'
            if g and k not in pf['picks']:
                pf['picks'][k] = stub(pick='TODO: pick and price as in digest §C'); pf['picks'][k]['sources'] = {'1': 'TODO source 1', '2': 'TODO source 2'}
                added.append(k)
        mp.write_text(json.dumps(pf, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
        print(f'Master: {mp.relative_to(ROOT)} — added {added or "nothing"}; {len(pf["picks"])} entries')
    else:
        print(f'Master: no build summary yet ({mm.relative_to(ROOT)}); run build.py first')


if __name__ == '__main__':
    main()
