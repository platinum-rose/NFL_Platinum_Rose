"""Evaluate saved public evidence and write the local, non-endorsed pick review."""

import argparse
import csv
import hashlib
import json
import os
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from market_captures import team as market_team
from research_evidence import PT, active_roster, approved_podcast_calls, player_key, reviewed_social_prop_rows, timestamp
from site_extras import ROOT, parse_leg

SCHEMA = 'public_source_picks_v1'
PROPS = {
    'receiving yards': ('rec_yds', 'rec_yds'), 'rushing yards': ('rush_yds', 'rush_yds'),
    'passing yards': ('pass_yds', 'pass_yds'), 'receptions': ('rec', 'rec'),
    'passing attempts': ('pass_att', 'pass_att'), 'pass attempts': ('pass_att', 'pass_att'),
    'pass completions': ('pass_cmp', 'pass_cmp'), 'rushing attempts': ('rush_car', 'carries'),
    'passing touchdowns': ('pass_td', 'pass_td'), 'touchdowns': ('tds_total', 'atd_1_plus'),
    'rushing and receiving yards': (('rush_yds', 'rec_yds'), 'rush_rec_yds'),
    'longest rush': ('rush_long', 'longest_rush'),
}
OUT = {'OUT', 'IR', 'PUP', 'SUSPENDED', 'SUSPENSION', 'INACTIVE', 'DOUBTFUL'}
LABEL = 'No Platinum Rose endorsement'


def american(value):
    return value if type(value) is int and abs(value) >= 100 else None


def normalize_prop(selection):
    label = selection.casefold().strip()
    if label == 'anytime touchdown':
        return 'touchdowns', 'at_least', 1
    match = re.fullmatch(r'(over|under) (\d+(?:\.\d+)?) (.+)', label)
    if match and match[3] in PROPS:
        stat = 'passing attempts' if match[3] == 'pass attempts' else match[3]
        return stat, match[1], float(match[2])
    match = re.fullmatch(r'(\d+)\+ (passing touchdowns|touchdowns|rushing yards)', label)
    if match and int(match[1]) > 0:
        return match[2], 'at_least', int(match[1])
    return None


def game_market(game, market, side, line):
    if market in ('spread', 'moneyline') and side in game.split('@'):
        if market == 'moneyline':
            return side, None, f'{side} moneyline'
        if isinstance(line, (int, float)):
            return side, line, f'{side} {line:+g}'
    if market == 'total' and str(side).lower() in ('over', 'under') and isinstance(line, (int, float)):
        return side.lower(), line, f'{side.title()} {line:g}'
    return None


class Inputs:
    def __init__(self):
        self.hashes = {}

    def read(self, path):
        path = ROOT / path
        if not path.is_file():
            return None
        raw = path.read_bytes()
        self.hashes[path.relative_to(ROOT).as_posix()] = hashlib.sha256(raw).hexdigest()
        return raw.decode('utf-8-sig')

    def json(self, path):
        raw = self.read(path)
        return json.loads(raw) if raw else {}

    def csv(self, path):
        return list(csv.DictReader((self.read(path) or '').splitlines()))


def valid_publication(stamp, as_of):
    when = timestamp(stamp)
    if when:
        return when <= as_of
    return bool(re.fullmatch(r'\d{4}-\d\d-\d\d', str(stamp))) and stamp <= as_of.astimezone(PT).date().isoformat()


def full_game(period, selection):
    if period and period not in ('full_game', 'game', 'Full Game'):
        return False
    return not re.search(r'\b(?:[12][hq]|[1-4]q|first half|second half|first quarter|team total)\b', selection or '', re.I)


def source_calls(inputs, ctx, season, week, as_of, active, roster):
    folder = f'data/intel/articles/{season}-w{week:02d}'
    for kind, filename in (('article', 'reviewed-prop-picks.json'), ('podcast', 'reviewed-podcast-picks.json')):
        path = f'{folder}/{filename}'
        reviewed = inputs.json(path)
        if str(reviewed.get('season')) != str(season) or reviewed.get('week') != week:
            continue
        for source in reviewed.get('sources', []):
            published = source.get('published_at') or source.get('published_date')
            if kind == 'podcast' and not timestamp(published):
                continue
            provenance = dict(analyst=source['analyst'], outlet=source['outlet'], url=source.get('url'),
                              published=published, kind=kind)
            for number, item in enumerate(source.get('picks', []), 1):
                if item.get('evidence_only'):
                    continue
                prop = normalize_prop(item['selection'])
                if prop and full_game(item.get('period'), item['selection']):
                    stat, side, line = prop
                    yield dict(game=item['game'], market='prop', stat=stat, side=side, line=line,
                               player=item['player'], team=item['team'], selection=item['selection'],
                               price=american(item.get('posted_price')), book=item.get('posted_book') or source.get('posted_book'),
                               why=item.get('why'), condition=item.get('condition'),
                               locator=f'{path} / {source["analyst"]} / pick {number}',
                               timestamp_seconds=item.get('timestamp_seconds'), **provenance)
            for number, item in enumerate(source.get('game_picks', []), 1):
                if item.get('evidence_only'):
                    continue
                market = item['market']
                identity = game_market(item['game'], market, item.get('side'), item.get('line'))
                if identity and full_game(item.get('period'), item.get('selection')):
                    side, line, selection = identity
                    yield dict(game=item['game'], market=market, side=side, line=line, selection=selection,
                               price=american(item.get('posted_price')), why=item.get('why'),
                               locator=f'{path} / {source["analyst"]} / game pick {number}',
                               timestamp_seconds=item.get('timestamp_seconds'),
                               **dict(provenance, url=item.get('timestamp_url') or provenance['url']))
    feed_path = f'data/generated/master-intel/w{week:02d}-expert-verified.json'
    for item in inputs.json(feed_path).get('rows', []):
        if (item.get('verdict') != 'verified' or not item.get('game')
                or not full_game(item.get('period'), item.get('selection'))):
            continue
        market = item.get('market')
        identity = game_market(item['game'], market, item.get('side'), item.get('line'))
        if not identity or (market == 'moneyline' and american(item.get('price')) is None):
            continue
        side, line, selection = identity
        for name in item.get('persons') or []:
            yield dict(game=item['game'], market=market, side=side, line=line, selection=selection,
                       price=american(item.get('price')), why=item.get('quote'), analyst=name, outlet=item.get('outlet'),
                       url=item.get('url'), published=item.get('published'), locator=feed_path, kind=item.get('kind'))
    podcast_path = f'data/podcasts/youtube-extracted-picks-{season}-w{week:02d}.json'
    podcast = inputs.json(podcast_path)
    for item, market, selection, price, known in approved_podcast_calls(podcast, active, as_of):
        raw, gid = item['raw'], item['game']
        if not full_game(raw.get('period'), item.get('pick')):
            continue
        provenance = dict(game=gid, price=american(price), why=item.get('rationale'),
                          analyst=item.get('speaker'), outlet=item.get('show'), url=item['timestamp_url'],
                          locator=podcast_path, kind='podcast')
        provenance['reviewed_at' if item.get('merged_at') else 'published'] = known.isoformat()
        identity = game_market(gid, market, raw.get('side'), raw.get('line'))
        if identity:
            side, line, selection = identity
            yield dict(market=market, side=side, line=line, selection=selection, **provenance)
        elif market == 'longest_rush' and raw.get('player') and raw.get('team'):
            stat, side, line = normalize_prop(selection)
            yield dict(market='prop', stat=stat, side=side, line=line, selection=selection,
                       player=raw['player'], team=raw['team'], **provenance)
    digest_path = f'{folder}/bookmark-text-intelligence-digest.md'
    inputs.read(digest_path)
    for path in sorted((ROOT / f'data/vault-seed/manual/grok-week{week:02d}-threads').glob('grok-twitter-picks-*.csv')):
        inputs.read(path.relative_to(ROOT))
    for row in reviewed_social_prop_rows(ctx, season, active, roster):
        gid, player, author = (row[k] for k in ('game', 'player', 'author'))
        selection = f'{row["side"].title()} {row["line"]} {row["market"]}'
        prop = normalize_prop(selection)
        teams = set(gid.split('@')).intersection(roster.get(player, ()))
        if not prop or len(teams) != 1 or row['kind'] not in ('prop', 'player_prop', 'parlay_leg'):
            continue
        stat, side, line = prop
        standalone = row['kind'] in ('prop', 'player_prop')
        odds = row['odds'] or ''
        price = american(int(odds)) if standalone and re.fullmatch(r'[+-]?\d+', odds) else None
        yield dict(game=gid, market='prop', stat=stat, side=side, line=line, team=next(iter(teams)),
                   selection=selection, player=player, price=price, analyst=author,
                   why=row['rationale'], outlet='X', url=row['url'], locator=row['locator'],
                   kind='social' if standalone else 'social_parlay_leg', published=row['published'])


def evaluate_sample(values, side, threshold):
    if side == 'at_least':
        hits = sum(value >= threshold for value in values)
    elif side == 'over':
        hits = sum(value > threshold for value in values)
    else:
        hits = sum(value < threshold for value in values)
    return hits


def history_evidence(call, player_rows, team_rows, player_id):
    line = call['line']
    side = call['side']
    if call['market'] == 'prop':
        stat = call['stat']
        metric = PROPS[stat][0]
        fields = (metric,) if isinstance(metric, str) else metric
        rows = [r for r in player_rows[player_id] if r['team'] == call['team']
                and any(r.get(field) not in ('', None) for field in fields)][-3:]
        values = [sum(float(r.get(field) or 0) for field in fields) for r in rows]
        hits = evaluate_sample(values, side, line)
        if len(values) < 2 or hits < 2:
            return None
        text = ', '.join(f'Week {r["week"]} {v:g}' for r, v in zip(rows, values))
        risk = 'Recent results span different opponents and do not establish a cover probability.'
        if len(values) < 3 or hits < len(values):
            risk = 'Recent production is uneven or the sample is small. A change in role or game script can break the case.'
        return (f'{stat.capitalize()} in the last {len(values)} recorded games with {call["team"]} '
                f'({text}) met this threshold in {hits} of {len(values)}.', risk, hits)
    away, home = call['game'].split('@')
    teams = (away, home) if call['market'] == 'total' else (side, home if side == away else away)
    samples = []
    for index, team in enumerate(teams):
        rows = team_rows[team][-3:]
        if len(rows) < 3:
            return None
        if call['market'] == 'total':
            values = [float(r['pts']) + float(r['opp_pts']) for r in rows]
            hits = evaluate_sample(values, side, line)
        else:
            values = [float(r['margin']) * (1 if index == 0 else -1) for r in rows]
            hits = sum(v + (line or 0) > 0 for v in values)
        samples.append((team, values, hits))
    if not all(hits >= 2 for _, _, hits in samples):
        return None
    basis = 'Combined scores' if call['market'] == 'total' else f'Recent scoring margins oriented to {side}'
    text = ' · '.join(f'{team} {", ".join(f"{v:g}" for v in values)}' for team, values, _ in samples)
    return (f'{basis} for the last three games ({text}) support the stated direction in both samples.',
            'Different opponents and game scripts make the recent results a screen rather than a projection.',
            min(hits for _, _, hits in samples))


def market_key(call):
    return (call['game'], call['market'], player_key(call.get('player')), call.get('stat') or '')


def official_markets(packet):
    markets = set()
    rows = packet.get('recommendations') or {}
    for row in rows.get('straight_bets', []):
        market = 'total' if row.get('type') == 'Total' else 'moneyline' if re.search(r'\bML\b|moneyline', row.get('pick', ''), re.I) else 'spread'
        markets.add((row['game'], market, '', ''))
    for ticket in rows.get('tickets', []):
        for leg in ticket.get('legs', []):
            text = leg.get('market') or ''
            parsed = parse_leg(text, leg.get('player'))
            stat = next((name for name, (_, prop_key) in PROPS.items() if prop_key == parsed['mkey']), None)
            if parsed['mkey'] in ('atd', 'td2'):
                stat = 'touchdowns'
            if stat and parsed['player']:
                markets.add((leg.get('game'), 'prop', player_key(parsed['player']), stat))
            elif re.match(r'^(?:over|under|[uo]\d)', text, re.I):
                markets.add((leg.get('game'), 'total', '', ''))
            elif re.search(r'\bML\b|moneyline', text, re.I):
                markets.add((leg.get('game'), 'moneyline', '', ''))
            elif re.match(r'^[A-Z]{2,3}\s+[+-]\d', text):
                markets.add((leg.get('game'), 'spread', '', ''))
    return markets


def price_index(inputs, week, as_of, stage):
    quotes = defaultdict(list)
    hours = 30 if stage == 'friday' else 8
    for prefix, provider in (('bookmaker-live', 'Bookmaker'), ('betonline-live', 'BetOnline')):
        for path in sorted((ROOT / 'data/generated/props').glob(f'{prefix}-*-week{week}.json')):
            rel = path.relative_to(ROOT).as_posix()
            for i, row in enumerate(inputs.json(rel).get('rows', []), 1):
                captured = timestamp(row.get('capturedAt'))
                source_time = timestamp(row.get('sourceTimestamp') or row.get('source_timestamp'))
                odds = american(row.get('odds'))
                if (not source_time or not captured or not odds or row.get('available') is not True
                        or not as_of - timedelta(hours=hours) <= source_time <= captured <= as_of):
                    continue
                event = str(row.get('event') or row.get('game') or '')
                away, _, home = event.partition(' @ ')
                gid = event if re.fullmatch(r'[A-Z]{2,3}@[A-Z]{2,3}', event) else f'{market_team(away)}@{market_team(home)}'
                period = row.get('period')
                if period not in ('full_game', 'game', 'Full Game'):
                    continue
                player = player_key(row.get('player'))
                stat = str(row.get('market')) if player else row.get('bet')
                side = str(row.get('side') or '')
                side = (side if side in gid.split('@') else market_team(side)) if stat in ('spread', 'moneyline') else side.lower()
                line = row.get('line')
                if player and stat == 'atd_1_plus' and side == 'yes' and line is None:
                    side, line = 'at_least', 1
                quotes[(gid, player, stat, side, line)].append(dict(provider=provider, price=odds,
                    source_at=source_time.isoformat(), captured_at=captured.isoformat(), locator=f'{rel} / row {i}'))
    return quotes


def pick_review(inputs, season, week, as_of, stage, book_date):
    ww = f'{week:02d}'
    schedule = inputs.json('public/schedule.json')
    active = {}
    for game in schedule:
        if str(game.get('season')) != str(season) or str(game.get('week')) != str(week):
            continue
        kickoff = timestamp(game.get('kickoff_utc'))
        if kickoff and kickoff > as_of and game.get('status') == 'pre':
            active[f'{game["visitor"]}@{game["home"]}'] = kickoff
    packet_path = f'dist/nfl_week{week}_master_packet/nfl_week{week}_master_betting_intelligence_summary.json'
    packet = inputs.json(packet_path)
    if packet and (str(packet.get('season')) != str(season) or packet.get('week') != week or packet.get('bkr_capture_date') != book_date):
        raise ValueError('Saved official report does not match the requested season, week and capture date.')
    built = timestamp(packet.get('built_at'))
    if built and built > as_of:
        raise ValueError('Saved official report is newer than the requested as-of time.')
    gate = inputs.json(f'reports/intel/gates/w{ww}-final-gate-{stage}.json')
    gate_time = timestamp(gate.get('run_at'))
    if gate_time and gate_time > as_of:
        gate = {}
    official = official_markets(packet)
    ctx = dict(week=week, W=ww)
    roster_path = 'data/nfl-rosters/espn-full-rosters-latest.json'
    roster_data = inputs.json(roster_path)
    inputs.read(f'data/generated/master-intel/w{ww}-roster-vet.json')
    roster = active_roster(ctx, as_of)
    availability_path = 'data/player-availability/latest.json'
    availability = inputs.json(availability_path)
    availability_stamp = timestamp(availability.get('meta', {}).get('generated_at'))
    availability_current = (availability_stamp is not None and
                            as_of - timedelta(hours=24 if stage == 'friday' else 10) <= availability_stamp <= as_of)
    statuses = {}
    for row in availability.get('events', []):
        captured = timestamp(row.get('captured_at'))
        when = timestamp(row.get('published_at')) or captured
        if not captured or not when or captured > as_of or when > as_of or row.get('source_type') == 'training_camp':
            continue
        status = row.get('normalized_status')
        if status in (None, 'UNKNOWN'):
            continue
        key = (player_key(row.get('player_name')), str(row.get('team_abbr')).replace('WSH', 'WAS'))
        priority = (when, status in OUT, captured)
        if key not in statuses or priority > statuses[key][0]:
            statuses[key] = (priority, status)
    usage_path = f'data/archive/{season}/season/player-games.csv'
    team_path = f'data/archive/{season}/season/team-weeks.csv'
    player_rows, team_rows = defaultdict(list), defaultdict(list)
    for row in sorted(inputs.csv(usage_path), key=lambda r: r['date_utc']):
        happened = timestamp(row.get('date_utc'))
        if happened and happened < as_of and int(row['week']) < week:
            player_rows[row['espn_athlete_id']].append(row)
    for row in sorted(inputs.csv(team_path), key=lambda r: int(r['week'])):
        if int(row['week']) < week:
            team_rows[row['team']].append(row)
    quotes = price_index(inputs, week, as_of, stage)
    groups = defaultdict(list)
    for call in source_calls(inputs, ctx, season, week, as_of, active, roster):
        groups[market_key(call) + (call['side'], call['line'])].append(call)
    coverage = inputs.json(f'data/intel/articles/{season}-w{ww}/public-source-coverage.json')
    decisions = []
    for identity, calls in sorted(groups.items(), key=lambda entry: repr(entry[0])):
        valid = [c for c in calls if c.get('analyst') and c.get('locator') and c['kind'] != 'social_parlay_leg'
                 and valid_publication(c.get('published') or c.get('reviewed_at'), as_of)]
        call = max(valid, key=lambda c: c['price'] if c.get('price') is not None else -float('inf')) if valid else calls[0]
        gid, market = call['game'], call['market']
        player = call.get('player')
        athlete_id = None
        status = None
        state, reason = 'source_only', ''
        matched = []
        sample = None
        if gid not in active:
            reason = 'Game is absent, started or concluded at the review time.'
        elif market_key(call) in official:
            reason = 'Platinum Rose already covers this market family.'
        elif not valid:
            reason = ('Reviewed parlay leg. No standalone source call in this input.'
                      if call['kind'] == 'social_parlay_leg' else 'Named source or publication timing could not be verified.')
        elif player:
            possible = [r for r in roster_data.get('players', {}).get(player, [])
                        if r.get('team', '').replace('WSH', 'WAS') == call['team'] and r.get('espn_id')
                        and r.get('group') != 'practiceSquad']
            if call['team'] not in roster.get(player, set()).intersection(gid.split('@')) or len(possible) != 1:
                reason = 'Fresh strict roster identity could not be established.'
            else:
                athlete_id = possible[0]['espn_id']
                status = statuses.get((player_key(player), call['team']), (None, None))[1]
                if status in OUT:
                    reason = f'Saved availability status is {status}.'
                elif possible[0].get('group') == 'injuredReserveOrOut' and status not in ('ACTIVE', 'ACTIVE_NEWS', 'QUESTIONABLE'):
                    reason = 'Roster availability group requires a verified status before use.'
        if not reason:
            sample = history_evidence(call, player_rows, team_rows, athlete_id)
            if not sample:
                reason = 'The independent recent results did not sufficiently support this exact side and threshold.'
        guidance = None
        if sample:
            selection = call['selection']
            terms = f'{player} · {selection}' if player else selection
            price = call.get('price')
            stat = PROPS[call['stat']][1] if player else market
            matched = quotes.get((gid, player_key(player), stat, call['side'], call['line']), [])
            if price is not None:
                matched = [q for q in matched if q['price'] >= price]
            verified = max(matched, key=lambda q: (q['source_at'], q['price'], q['provider'])) if matched else None
            if not verified:
                guidance = (f'Check a fresh board for {terms} at {price:+d} or better. Pass at a worse line or price.'
                            if price else f'Check a fresh board for {terms}. Pass if the stated line is unavailable. No price target established.')
            needs_role = player and (not availability_current or status in ('QUESTIONABLE', 'GTD', 'LIMITED')
                                     or call['stat'].startswith('pass'))
            if needs_role:
                role_check = f'Confirm {player} is active in the expected role. Pass if that role is limited or unconfirmed.'
                guidance = f'{guidance} {role_check}' if guidance else role_check
            source_checks = list(dict.fromkeys(c['condition'] for c in valid if c.get('condition')))
            if source_checks:
                guidance = ' '.join(filter(None, [guidance, *source_checks]))
            state = 'conditional_pick' if guidance else 'research_pick'
            reason = 'Independent recent results support this source selection.'
        else:
            verified = None
        seen = {}
        for source in valid or [call]:
            key = str(source.get('analyst') or source.get('outlet')).casefold()
            seen.setdefault(key, dict(analyst=source.get('analyst'), outlet=source.get('outlet'),
                published=source.get('published'), reviewed_at=source.get('reviewed_at'),
                url=source.get('url'), locator=source.get('locator'),
                selection=source['selection'], price=source.get('price'), book=source.get('book'),
                why=source.get('why'), kind=source.get('kind'), timestamp_seconds=source.get('timestamp_seconds'),
                alternate_links=[]))
            if source.get('url') and source['url'] not in (seen[key]['url'], *seen[key]['alternate_links']):
                seen[key]['alternate_links'].append(source['url'])
        decisions.append(dict(id=hashlib.sha256(repr(identity).encode()).hexdigest()[:18],
            **{key: call.get(key) for key in ('game', 'market', 'stat', 'player', 'team', 'selection', 'side', 'line')},
            period='full_game', kickoff=active[gid].isoformat() if gid in active else None, player_id=athlete_id,
            decision=state, reason=reason, why=sample[0] if sample else None, risk=sample[1] if sample else None,
            check=guidance or ('Recheck the exact current line, price and lineup.' if verified else None),
            evidence_path=(usage_path if player else team_path) if sample else None,
            evidence_hits=sample[2] if sample else 0, sources=list(seen.values()),
            original_quote=dict(price=call.get('price'), book=call.get('book'), selection=call['selection']),
            verified_quote=verified, official_disposition=('Covered by Platinum Rose' if market_key(call) in official else 'Uncovered market'),
            platinum_rose_endorsed=False, execution_eligible=False))
    # An opposite, credibly sourced direction is visible as evidence, including disagreement at a different number.
    by_market = defaultdict(list)
    for row in decisions:
        by_market[market_key(row)].append(row)
    for rows in by_market.values():
        picks = [row for row in rows if row['decision'] != 'source_only']
        for row in picks:
            opposite = [other for other in rows if other['side'] != row['side'] and other['kickoff']
                        and any(s['kind'] != 'social_parlay_leg' for s in other['sources'])]
            if opposite:
                row['counter_sources'] = [dict(selection=o['selection'], sources=o['sources']) for o in opposite]
                row.update(decision='source_only', verified_quote=None,
                           reason='Opposing source direction requires a matchup review before recommending this market.')
        surviving = [row for row in picks if row['decision'] != 'source_only']
        if not surviving:
            continue
        best = max(surviving, key=lambda r: (
            r['decision'] == 'research_pick', r['evidence_hits'], r['original_quote']['price'] is not None,
            (r['line'] or 0) * (-1 if r['side'] in ('over', 'at_least') else 1)))
        for row in surviving:
            if row is not best:
                row.update(decision='source_only', verified_quote=None, reason='A stronger or more favorable source line covers this market.',
                           related_pick_id=best['id'])
    decisions.sort(key=lambda r: (r['decision'] == 'source_only', r['decision'] == 'conditional_pick',
                                  -r['evidence_hits'], r['original_quote']['price'] is None, r['kickoff'] or '', r['id']))
    return dict(schema=SCHEMA, season=season, week=week, as_of=as_of.isoformat(), stage=stage,
                market_capture_date=book_date, official_built_at=packet.get('built_at'),
                endorsement=LABEL, active_games=len(active), inputs=inputs.hashes,
                official_gate=dict(verdict=gate.get('verdict'), as_of=gate.get('run_at'), required_failures=gate.get('required_failures'),
                                   pending=gate.get('provisional_open')),
                coverage=coverage.get('items', []), counts=dict(Counter(r['decision'] for r in decisions)), decisions=decisions)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--season', type=int, default=2026)
    parser.add_argument('--week', type=int, required=True)
    parser.add_argument('--date', required=True, help='Bookmaker capture date used by the saved Master Intel report')
    parser.add_argument('--stage', choices=('friday', 'saturday'), required=True)
    parser.add_argument('--as-of', required=True, help='ISO timestamp with timezone')
    args = parser.parse_args()
    as_of = timestamp(args.as_of)
    if not as_of or as_of > datetime.now(timezone.utc):
        parser.error('--as-of must be a timezone-aware timestamp at or before now')
    result = pick_review(Inputs(), args.season, args.week, as_of, args.stage, args.date)
    out = ROOT / f'data/research-intel/review/{args.season}-w{args.week:02d}-public-source-picks.json'
    temp = out.with_suffix(f'.{os.getpid()}.tmp')
    temp.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    temp.replace(out)
    print(f'{out.relative_to(ROOT)} · {result["counts"]}')


if __name__ == '__main__':
    main()
