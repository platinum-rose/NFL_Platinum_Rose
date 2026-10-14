#!/usr/bin/env python3
"""Week 6 per-game AVAILABILITY layer (Lane D). Read-only; no network, no paid calls, no Supabase.
Inputs : data/research-intel/source-evidence/espn-status-w06.json  (from scripts/intel/fetch-espn-status.py --out ...)
         data/odds/BKR_current_lines_1014_0020                       (14-game W6 board; times are PT)
Output : data/research-intel/availability/2026-w06-availability-layer.{json,md}
Rules  : ESPN injuries feed = reported statuses. ESPN roster injuredReserveOrOut group NOT in the feed = UNCONFIRMED
         (ESPN marks day-to-day; never treat as Out; verify with official inactives). Names come only from ESPN data.
         Lines are copied from the BKR board unchanged; nothing here is a recommendation.
Usage  : python3 scripts/intel/build-w06-availability-layer.py"""
import json, re, datetime as dt

ESPN = 'data/research-intel/source-evidence/espn-status-w06.json'
BKR = 'data/odds/BKR_current_lines_1014_0020'
OUT = 'data/research-intel/availability/2026-w06-availability-layer'
HARD = ('out', 'injured reserve', 'suspended', 'physically unable to perform', 'non football injury')
SKILL = {'QB', 'RB', 'WR', 'TE', 'FB'}

def norm(a): return 'WAS' if a == 'WSH' else a

def parse_board():
    games, hdr = [], None
    for ln in open(BKR, encoding='utf-8'):
        ln = ln.strip()
        m = re.match(r'(\d+/\d+) (\d+:\d+) (.+?) / (.+?) : (\w+) ([+-][\d.]+) ([+-]\d+) / (\w+) ([+-][\d.]+) ([+-]\d+) ; o([\d.]+) ([+-]\d+) / u[\d.]+ ([+-]\d+) ; ML \w+ ([+-]\d+) / \w+ ([+-]\d+)', ln)
        if not m: continue
        d, t, an, hn, a, asp, asp_p, h, hsp, hsp_p, tot, o_p, u_p, aml, hml = m.groups()
        games.append({'date_pt': d, 'time_pt': t, 'away': norm(a), 'home': norm(h), 'away_name': an, 'home_name': hn,
                      'spread_away': asp, 'spread_home': hsp, 'total': tot, 'ml_away': aml, 'ml_home': hml})
    return games

def team_block(e, ab):
    t = e['teams'][ab]
    rep = t['injury_report_non_active']
    hard = [i for i in rep if (i['status'] or '').lower() in HARD]
    amb = [i for i in rep if (i['status'] or '').lower() in ('questionable', 'doubtful', 'day-to-day')]
    other = [i for i in rep if i not in hard and i not in amb]
    ru = t.get('roster_ir_out_unconfirmed', [])
    return {'team': ab, 'qb_starter': t['qb_starter'], 'qb_flag': t['qb_flag'], 'qb_note': t['qb_note'], 'qb_depth': t['qb_depth'][:3],
            'reported_out_ir': hard, 'reported_questionable_doubtful': amb, 'reported_other': other,
            'roster_ir_out_unconfirmed': ru,
            'skill_unconfirmed': [r for r in ru if r['pos'] in SKILL]}

def fmt(i): return '%s %s %s%s' % (i['player'], i['pos'], i['status'], (' (' + i['comment'][:90] + ')') if i.get('comment') else '')

def main():
    e = json.load(open(ESPN, encoding='utf-8'))
    games = parse_board()
    now = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    out = {'schema': 'w06_availability_layer_v1', 'built_at': now, 'espn_fetched_at': e['fetched_at'],
           'roster_file_generated_at': (e.get('roster_ir_out_source') or {}).get('generated_at'), 'board': BKR,
           'caveat': 'ESPN statuses lag game-day truth. Check official inactives/team reports near kickoff. Unconfirmed roster IR/Out players are NOT confirmed Out.', 'games': []}
    L = ['# Week 6 availability layer (Lane D)', '',
         'Built %s from `%s` (ESPN fetched %s; roster file %s) and the BKR board `%s`.' % (now, ESPN, e['fetched_at'], out['roster_file_generated_at'], BKR), '',
         '**Read-only intel, not a recommendation.** ESPN injury feed statuses lag. "Roster IR/Out (unconfirmed)" = in ESPN roster `injuredReserveOrOut` group but NOT in the injury feed; ESPN marks them day-to-day. Do not treat them as Out and do not use them as player legs without official inactives. Lines are BKR 10/14 00:20 PT, times PT.', '']
    qb_flags = []
    for g in games:
        gm = {'game': '%s@%s' % (g['away'], g['home']), **g, 'teams': [team_block(e, g['away']), team_block(e, g['home'])]}
        out['games'].append(gm)
        L += ['## %s  (%s %s PT)' % (gm['game'], g['date_pt'], g['time_pt']),
              'Line: %s %s / %s %s; total %s; ML %s / %s' % (g['away'], g['spread_away'], g['home'], g['spread_home'], g['total'], g['ml_away'], g['ml_home']), '']
        for b in gm['teams']:
            L.append('### %s' % b['team'])
            L.append('- QB: %s [%s]%s (depth: %s)' % (b['qb_starter'], b['qb_flag'], ' ' + b['qb_note'].rstrip('; ') if b['qb_note'] else '', ', '.join(b['qb_depth'])))
            if b['qb_flag'] != 'ok': qb_flags.append('%s %s: %s' % (b['team'], b['qb_starter'], (b['qb_note'] or b['qb_flag']).rstrip('; ')))
            L.append('- Reported Out/IR (%d): %s' % (len(b['reported_out_ir']), '; '.join(fmt(i) for i in b['reported_out_ir']) or 'none'))
            L.append('- Reported Questionable/Doubtful (%d): %s' % (len(b['reported_questionable_doubtful']), '; '.join(fmt(i) for i in b['reported_questionable_doubtful']) or 'none'))
            if b['reported_other']: L.append('- Reported other (%d): %s' % (len(b['reported_other']), '; '.join(fmt(i) for i in b['reported_other'])))
            L.append('- Roster IR/Out (unconfirmed, %d total): skill positions: %s' % (len(b['roster_ir_out_unconfirmed']), ', '.join('%s %s' % (r['player'], r['pos']) for r in b['skill_unconfirmed']) or 'none'))
            L.append('  - non-skill: %s' % (', '.join('%s %s' % (r['player'], r['pos']) for r in b['roster_ir_out_unconfirmed'] if r['pos'] not in SKILL) or 'none'))
            L.append('')
    L.insert(5, '**QB flags across the slate:** ' + ('; '.join(qb_flags) or 'none') + '\n')
    json.dump(out, open(OUT + '.json', 'w', encoding='utf-8'), indent=1)
    open(OUT + '.md', 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print('games', len(games), '| qb flags:', qb_flags)

main()
