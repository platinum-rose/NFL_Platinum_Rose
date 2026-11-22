"""Read-only research for the Master Intel Props Lab and Experts pages."""

import csv
import re
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

from site_extras import E, J, ROOT, am, gpage, slug
from market_captures import team

PT = ZoneInfo('America/Los_Angeles')
BOOKMAKER = 'Bookmaker'
PREDICTIONS = 'DraftKings Predictions'
MARKETS = {
    'passing yards': 'pass_yds', 'rushing yards': 'rush_yds', 'receiving yards': 'rec_yds',
    'receptions': 'rec', 'anytime touchdown': 'atd_1_plus', 'first touchdown': 'first_td',
}


def timestamp(value):
    try:
        parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else None


def display_time(value):
    parsed = timestamp(value)
    if not parsed:
        return 'Time unavailable'
    local = parsed.astimezone(PT)
    return f'{local:%b} {local.day}, {local:%I:%M %p}'.replace(', 0', ', ') + ' PT'


def source_link(label, url):
    parsed = urlsplit(str(url or ''))
    if parsed.scheme in ('http', 'https') and parsed.netloc:
        return f'<a href="{E(url)}" target="_blank" rel="noopener noreferrer">{E(label)}</a>'
    return E(label)


def table(headings, rows):
    head = ''.join(f'<th scope="col">{E(cell)}</th>' for cell in headings)
    body = ''.join('<tr>' + ''.join(f'<td>{cell}</td>' for cell in row) + '</tr>' for row in rows)
    return f'<div class="table-responsive"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'


def matchup(gid, label, contents):
    return (f'<details class="rollup-box" id="{label}-{slug(gid)}"><summary><span class="sum-text">{E(gid)}</span></summary>'
            f'<div class="rollup-content">{contents}<p><a href="{gpage(gid)}">Full matchup</a></p></div></details>')


def markdown_section(text, name):
    match = re.search(rf'^## {re.escape(name)}\s*\n(.*?)(?=^## |\Z)', text, re.M | re.S)
    return match[1].strip() if match else ''


def paragraphs(text):
    return ''.join(f'<p>{E(" ".join(p.splitlines()))}</p>' for p in text.split('\n\n')
                   if p and not p.startswith('[Sources:') and 'Source post]' not in p)


def player_key(name):
    name = re.sub(r"[.'’]", '', str(name or '').lower())
    name = re.sub(r'\s+(?:jr|sr|ii|iii|iv|v)$', '', name.strip())
    return {'cameron ward': 'cam ward'}.get(name, name)


def active_roster(ctx, now):
    snapshot = J(ROOT / 'data/nfl-rosters/espn-full-rosters-latest.json', {}) or {}
    vet = J(ROOT / f'data/generated/master-intel/w{ctx["W"]}-roster-vet.json', {}) or {}
    stamp = timestamp(snapshot.get('generated_at'))
    if (not stamp or not timedelta(0) <= now - stamp <= timedelta(hours=24)
            or vet.get('status') != 'PASS' or vet.get('roster_source') != snapshot.get('generated_at')):
        return {}
    return {
        player: {r['team'].replace('WSH', 'WAS') for r in records if r.get('group') != 'practiceSquad'}
        for player, records in snapshot.get('players', {}).items()
    }


@lru_cache(maxsize=32)
def saved_board(path):
    return J(ROOT / path, {}) or {}


def corroborated_quote(provider, path, ref, gid, player, player_team, stat, line):
    board = saved_board(path)
    if board.get('capturedAt') != ref.get('captured_at'):
        return ''
    if provider == BOOKMAKER:
        away, _, home = board.get('event', '').partition(' @ ')
        if f'{team(away)}@{team(home)}' != gid:
            return ''
    markets = defaultdict(lambda: defaultdict(set))
    for row in board.get('rows', []):
        if (player_key(row.get('player')) != player_key(player)
                or row.get('market') != MARKETS.get(stat) or row.get('line') != line):
            continue
        if provider == BOOKMAKER:
            if row.get('available') and row.get('capturedAt') == ref.get('captured_at'):
                markets[row.get('sectionTitle')][row.get('side')].add(am(row.get('odds')))
        elif (row.get('game') == gid and row.get('eventId') == ref.get('event_id')
              and row.get('marketId') == ref.get('market_id')
              and str(row.get('team')).replace('WSH', 'WAS') == player_team):
            markets[row.get('marketId')][row.get('side')].add(row.get('pct'))
    sides = ('Yes',) if line is None else ('Under', 'Over')
    quotes = set()
    for matches in markets.values():
        if not all(len(matches[side]) == 1 for side in sides):
            continue
        values = [next(iter(matches[side])) for side in sides]
        if all(values):
            quotes.add(values[0] if sides == ('Yes',) else ', '.join(f'{side} {value}' for side, value in zip(sides, values)))
    return quotes.pop() if len(quotes) == 1 else ''


def prop_screens(ctx, season, gid, roster, kickoff):
    week = ctx['W']
    stem = f'{season}-w{week}-game-{gid.replace("@", "_at_")}-props'
    packet = J(ROOT / f'data/research-intel/proposed/games-w{week}/{stem}.json', {}) or {}
    story = ROOT / f'reports/intel/games/{stem}.md'
    if packet.get('game') != gid or not story.is_file():
        return [], ''
    text = story.read_text(encoding='utf-8')
    candidates = {(r.get('player'), re.sub(r' screen$', '', r.get('selection', ''))): r
                  for r in packet.get('recommendations', [])}
    rows = []
    for line in text.splitlines():
        if not line.startswith('| ') or line.startswith('| Player |'):
            continue
        cells = [cell.strip() for cell in line.strip('|').split('|')]
        if len(cells) != 5:
            continue
        player, market, source, quote, decision = cells
        stat, _, threshold = market.partition(', ')
        rec = candidates.get((player, f'{player} {stat}'))
        if not rec or rec.get('team') not in roster.get(player, set()).intersection(gid.split('@')):
            continue
        number = rec.get('line')
        if threshold and (not isinstance(number, (int, float)) or threshold != f'{number:g}'):
            continue
        ref = rec.get('reference') or {}
        provider = source.partition(' · ')[0]
        if provider not in (BOOKMAKER, PREDICTIONS):
            continue
        if provider == PREDICTIONS and ref.get('provider') != PREDICTIONS:
            continue
        raw_path = rec.get('bookmaker_evidence_path')
        if provider == PREDICTIONS:
            raw_path = next((item['path'] for item in packet.get('sources', [])
                             if 'draftkings-predictions-feed-' in item.get('path', '')
                             and item.get('evidence_date') == ref.get('captured_at')), None)
        if not raw_path:
            continue
        # Scoring props can have a game capture but no two-way reference.
        if not ref:
            ref = {'captured_at': saved_board(raw_path).get('capturedAt')}
        captured = timestamp(ref.get('captured_at'))
        if not captured or captured >= kickoff:
            continue
        verified = corroborated_quote(provider, raw_path, ref, gid, player, rec['team'], stat, number)
        if not verified or verified.replace('−', '-') != quote.replace('−', '-'):
            continue
        evidence = (f'Event {ref["event_id"]} · Market {ref["market_id"]}' if provider == PREDICTIONS
                    and ref.get('event_id') and ref.get('market_id') else raw_path or '')
        quote_kind = 'Archived sportsbook odds' if provider == BOOKMAKER else 'Prediction contract reference'
        rows.append((E(player), E(market), E(decision), E(quote),
                     f'{E(provider)} · {E(display_time(ref.get("captured_at")))}<br>{quote_kind}'
                     + (f'<br><small>{E(evidence)}</small>' if evidence else '')))
    if not rows:
        return [], text
    usage = paragraphs(markdown_section(text, 'Usage, role and script'))
    changes = paragraphs(markdown_section(text, 'What changes the research view'))
    context = f'<h4>Usage and game script</h4>{usage}<h4>What to check</h4>{changes}'
    return rows, context


def reviewed_social_prop_rows(ctx, season, active, roster):
    week = ctx['W']
    sources = sorted((ROOT / f'data/vault-seed/manual/grok-week{week}-threads').glob('grok-twitter-picks-*.csv'))
    digest = ROOT / f'data/intel/articles/{season}-w{week}/bookmark-text-intelligence-digest.md'
    if not sources or not digest.is_file():
        return
    reviewed = digest.read_text(encoding='utf-8').splitlines()
    for path in sources:
        with path.open(encoding='utf-8-sig', newline='') as handle:
            for row in csv.DictReader(handle):
                gid, _, rest = row.get('rationale', '').partition(' | ')
                published, _, rationale = rest.partition(' | ')
                posted = timestamp(published)
                player, url = row.get('team_or_market'), row.get('tweet_url')
                market, side, line = (row.get(key) for key in ('market', 'selection', 'line'))
                if (gid not in active or not posted or posted >= active[gid] or not url
                        or not market or side not in ('OVER', 'UNDER') or not line
                        or not set(gid.split('@')).intersection(roster.get(player, set()))):
                    continue
                # Match the reviewed digest by source and exact posted leg. Multiple
                # extractions of the same post are a single source opinion.
                fields = [row.get('author'), gid, player, market, f'{side} {line}', url]
                if not all(fields) or not any(all(value in s for value in fields) for s in reviewed):
                    continue
                yield dict(game=gid, player=player, market=market, side=side, line=line, url=url,
                           odds=row.get('odds'), author='@' + row['author'].lstrip('@'), published=published,
                           rationale=rationale.split('; $', 1)[0], kind=row.get('bet_type'),
                           locator=path.relative_to(ROOT).as_posix())


def saved_social_props(ctx, season, active, roster):
    picks = defaultdict(dict)
    for row in reviewed_social_prop_rows(ctx, season, active, roster):
        player, market, side, line, url = (row[k] for k in ('player', 'market', 'side', 'line', 'url'))
        picks[row['game']][(url, player, market, side, line)] = (
            E(player), E(f'{market} · {side.title()} {line}'), E(row['odds'] or 'Price unavailable'),
            E(row['rationale']), f'{source_link(row["author"], url)} · {E(display_time(row["published"]))}',
        )
    return picks


def reviewed_public_sources(ctx, season, filename):
    path = ROOT / f'data/intel/articles/{season}-w{ctx["W"]}/{filename}'
    digest = J(path, {}) or {}
    if str(digest.get('season')) != str(season) or digest.get('week') != ctx['week']:
        return []
    return digest.get('sources', [])


def audio_position(seconds):
    if type(seconds) is not int or seconds < 0:
        return ''
    minutes, seconds = divmod(seconds, 60)
    return f' · {minutes}:{seconds:02d}'


def reviewed_media_props(ctx, season, active, roster, filename):
    picks = defaultdict(dict)
    for source in reviewed_public_sources(ctx, season, filename):
        stamp = timestamp(source.get('published_at'))
        if stamp:
            if stamp > datetime.now(timezone.utc):
                continue
            published = stamp.astimezone(PT).date()
        else:
            try:
                published = date.fromisoformat(source.get('published_date', ''))
            except ValueError:
                continue
        analyst, outlet, url = (source.get(key) for key in ('analyst', 'outlet', 'url'))
        if not all((analyst, outlet, url)):
            continue
        citation = f'{source_link(outlet, url)} · {E(published.strftime("%b %d"))}'
        for row in source.get('picks', []):
            gid, player, team_code, selection = (row.get(key) for key in ('game', 'player', 'team', 'selection'))
            if (gid not in active or (stamp >= active[gid] if stamp else published >= active[gid].astimezone(PT).date())
                    or team_code not in roster.get(player, set()).intersection(gid.split('@')) or not selection):
                continue
            picks[gid][(url, analyst, player, selection)] = (
                E(player), E(selection), E(am(row.get('posted_price')) or 'Price unavailable'),
                E(analyst), E(row.get('why') or 'Rationale unavailable'), citation + E(audio_position(row.get('timestamp_seconds'))),
            )
    return picks


def approved_podcast_calls(digest, active, as_of):
    approved = timestamp(digest.get('approved_at'))
    if digest.get('status') != 'approved' or not approved or approved > as_of:
        return
    for entry in digest.get('picks', []):
        gid, speaker = entry.get('game'), entry.get('speaker')
        raw = entry.get('raw') or {}
        market, side, line = raw.get('market'), str(raw.get('side') or ''), raw.get('line')
        merged = entry.get('merged_at')
        known = timestamp(merged or digest.get('generated_at'))
        if (gid not in active or not known or known > as_of or max(approved, known) >= active[gid]
                or not entry.get('timestamp_url') or not entry.get('quote')):
            continue
        if merged and merged != (digest.get('late_merge') or {}).get('at'):
            continue
        description = ' '.join(str(entry.get(k) or '') for k in ('show', 'note', 'rationale'))
        is_contest = re.search(r'\b(?:contest card|contest pick|Splash Sports)\b', description, re.I)
        if market == 'game_total':
            market = 'total'
        price = raw.get('price')
        if merged and price == -110:
            # The verified addendum preserves the default spread/total price from extraction.
            # Do not present that default as an individually documented quote.
            price = None
        if market == 'straight_up' and speaker and side in gid.split('@'):
            yield entry, market, f'{side} to win', None, known
            continue
        if market == 'moneyline' and speaker and side in gid.split('@'):
            yield entry, market, f'{side} moneyline', price, known
            continue
        if not isinstance(line, (int, float)):
            continue
        if market == 'spread' and side in gid.split('@'):
            market = 'contest' if is_contest else market
            selection = f'{side} {line:+g}'
        elif market == 'first_half_spread' and side in gid.split('@'):
            selection = f'{side} 1H {line:+g}'
        elif market in ('total', 'longest_rush') and side.title() in ('Over', 'Under'):
            selection = f'{side.title()} {line:g}'
            if market == 'longest_rush':
                selection += ' longest rush'
        else:
            continue
        if speaker or market == 'contest':
            yield entry, market, selection, None if market == 'contest' else price, known


def podcast_picks(ctx, season, active, roster, player_props):
    digest = J(ROOT / f'data/podcasts/youtube-extracted-picks-{season}-w{ctx["W"]}.json', {}) or {}
    rows = {}
    labels = {'straight_up': 'Straight-up prediction', 'contest': 'Contest spread',
              'first_half_spread': 'First-half spread'}
    for entry, market, selection, price, known in approved_podcast_calls(digest, active, datetime.now(timezone.utc)):
        gid, speaker = entry['game'], entry.get('speaker') or 'Show contest card'
        url = entry['timestamp_url']
        source = source_link('Timestamped audio', url)
        show = E(entry.get('show') or 'Podcast')
        timing = 'Verified' if entry.get('merged_at') else 'Extracted'
        citation = f'{show}<br>{source}<br>{timing} {E(display_time(known.isoformat()))}'
        rationale = 'Winner prediction stated on air.' if market == 'straight_up' else entry.get('rationale')
        if market == 'longest_rush':
            raw = entry['raw']
            player = raw.get('player')
            if raw.get('team') in roster.get(player, set()).intersection(gid.split('@')):
                player_props[gid][(url, speaker, player, selection)] = (
                    E(player), E(selection), E(am(price) or 'Price unavailable'), E(speaker),
                    E(rationale or 'Rationale unavailable'), citation,
                )
            continue
        rows.setdefault((gid, speaker.casefold(), market, selection), (
            E(speaker), E(labels.get(market, market.title())), E(selection), E(am(price) or 'Price unavailable'),
            E(rationale or 'Rationale unavailable'), citation,
        ))
    return rows


def expert_evidence(ctx, active, social, roster, podcasts):
    rows = defaultdict(list)
    seen = set()
    player_games = defaultdict(set)
    season = ctx['M'].get('season') or ctx['date'][:4]
    for source in reviewed_public_sources(ctx, season, 'reviewed-podcast-picks.json'):
        analyst = source.get('analyst')
        stamp = timestamp(source.get('published_at'))
        if not analyst or not stamp or stamp > datetime.now(timezone.utc):
            continue
        for item in source.get('game_picks', []):
            gid, market, side, line = (item.get(k) for k in ('game', 'market', 'side', 'line'))
            if gid not in active or stamp >= active[gid]:
                continue
            if market == 'moneyline' and side in gid.split('@'):
                pick = f'{side} moneyline'
            elif not isinstance(line, (int, float)):
                continue
            elif market == 'spread' and side in gid.split('@'):
                pick = f'{side} {line:+g}'
            elif market == 'total' and str(side).lower() in ('over', 'under'):
                pick = f'{side.title()} {line:g}'
            elif (market == 'team_total' and item.get('team') in gid.split('@')
                  and str(side).lower() in ('over', 'under')):
                pick = f'{item["team"]} {side.title()} {line:g}'
            else:
                continue
            citation = source_link(source.get('outlet', 'Podcast'), item.get('timestamp_url') or source.get('url'))
            citation += E(audio_position(item.get('timestamp_seconds'))) + f'<br>{E(display_time(source["published_at"]))}'
            podcasts.setdefault((gid, analyst.casefold(), market, pick), (
                E(analyst), E(market.replace('_', ' ').title()), E(pick), E(am(item.get('posted_price')) or 'Price unavailable'),
                E(item.get('why')), citation,
            ))
    for player, teams in roster.items():
        player_games[player_key(player)].update(teams)
    for item in ctx['vrows']:
        gid = item['game']
        market = item.get('market')
        published = timestamp(item.get('published'))
        if (gid not in active or (published and published >= active[gid])
                or market not in ('spread', 'total', 'moneyline', 'contest', 'prop')):
            continue
        if market == 'prop':
            players = item.get('players') or []
            if not players or any(not set(gid.split('@')).intersection(player_games[player_key(player)]) for player in players):
                continue
        people = item.get('persons') or ()
        names = ', '.join(people) or 'Outlet pick · analyst unnamed'
        outlet = item.get('outlet') or 'Source unavailable'
        side, line = item.get('side'), item.get('line')
        if market in ('spread', 'contest') and side and isinstance(line, (int, float)):
            pick = f'{side} {line:+g}'
        elif market == 'total' and side and isinstance(line, (int, float)):
            pick = f'{side} {line:g}'
        else:
            pick = (item.get('selection') or '').partition(' | ')[0]
        if not pick:
            continue
        key = (gid, names, outlet, market, pick, item.get('price'))
        if key in seen:
            continue
        seen.add(key)
        audio = [podcasts.pop((gid, name.casefold(), market, pick), None) for name in people]
        cites = [source_link(outlet, item.get('url')), E(display_time(item.get('published')))]
        cites.extend(dict.fromkeys(clip[-1] for clip in audio if clip))
        rows[gid].append((E(names), E(market.replace('moneyline', 'moneyline / straight-up').title()),
                          E(pick), E(am(item.get('price')) or 'Price unavailable'),
                          E(item.get('quote') or 'Rationale unavailable'), '<br>'.join(cites)))
    for (gid, _, _, _), row in podcasts.items():
        rows[gid].append(row)
    count = sum(map(len, rows.values()))
    social_count = sum(map(len, social.values()))
    if not count and not social_count:
        return ''
    parts = [
        '<section id="research-experts" class="no-bm">',
        '<h3>Source picks by matchup</h3>',
        f'<p>{count} matchup-checked source records, including approved podcast and YouTube selections. '
        'A row can include more than one analyst. Contest spreads, first-half spreads and winner predictions are labeled. '
        'Source numbers and prices are shown as recorded. Straight-up predictions can appear without a wager or price. '
        '<a href="registry.html">Expert Pick Registry</a> · <a href="trends.html">Betting Trends</a></p>',
    ]
    if social_count:
        parts.append(f'<p><a href="props.html#research-props">{social_count} reviewed social-source prop legs in Props Lab</a>.</p>')
    for gid in ctx['order']:
        if rows[gid]:
            parts.append(matchup(gid, 'expert-evidence', table(
                ('Analyst', 'Market', 'Source pick', 'Posted price', 'Recorded reasoning', 'Source · record date'), rows[gid])))
    return ''.join(parts) + '</section>'


def render_public_source_picks(ctx):
    season = ctx['M'].get('season') or ctx['date'][:4]
    review = J(ROOT / f'data/research-intel/review/{season}-w{ctx["W"]}-public-source-picks.json', {}) or {}
    if (review.get('schema') != 'public_source_picks_v1' or str(review.get('season')) != str(season)
            or review.get('week') != ctx['week'] or review.get('market_capture_date') != ctx['date']
            or review.get('official_built_at') != ctx['M'].get('built_at')):
        return ''
    picks = [r for r in review.get('decisions', []) if r.get('decision') in ('research_pick', 'conditional_pick')
             and r.get('platinum_rose_endorsed') is False and r.get('execution_eligible') is False]
    parts = ['<section id="public-source-picks" class="no-bm"><h3>Public-source picks</h3>',
             f'<p><strong>No Platinum Rose endorsement.</strong> Saved research as of {E(display_time(review.get("as_of")))}. '
             'Check current prices and lineup information before using a selection.</p>']
    gate = review.get('official_gate') or {}
    if review.get('stage') == 'saturday' and gate.get('verdict') == 'RED':
        parts.append('<p><strong>Saturday official gate remains red.</strong> These picks are provisional research.</p>')
    if not picks:
        reasons = sorted({r.get('reason') for r in review.get('decisions', []) if r.get('reason')})
        parts.append('<p>No public-source picks qualified. ' + E(' '.join(reasons)) + ' '
                     '<a href="#research-experts">See source picks by matchup</a>.</p>')
    for i, row in enumerate(picks, 1):
        if i == 6:
            parts.append('<h4>More picks</h4>')
        selection = (f'{row["player"]} · ' if row.get('player') else '') + row['selection']
        decision = 'Conditional pick' if row['decision'] == 'conditional_pick' else 'Research pick'
        parts.extend([
            f'<article id="public-pick-{E(row["id"])}"><h4>{E(selection)} · {E(row["game"])}</h4>',
            f'<p><strong>{decision} · No Platinum Rose endorsement</strong></p>',
            f'<p>{E(row["why"])} <strong>Risk.</strong> {E(row["risk"])}</p>',
            f'<p><strong>Before kickoff.</strong> {E(row["check"])}</p>',
        ])
        quote = row.get('verified_quote')
        if quote:
            parts.append(f'<p>Verified at the review time · {E(quote["provider"])} {E(am(quote["price"]))}'
                         f' · {E(display_time(quote["source_at"]))}</p>')
        parts.append('<details class="rollup-box"><summary>Published calls and evidence</summary><div class="rollup-content">')
        parts.append(f'<p>{E(row["official_disposition"])} in the saved report.</p><ul>')
        for source in row.get('sources', []):
            label = f'{source.get("analyst") or "Source"} · {source.get("outlet") or ""}'
            price = am(source.get('price'))
            book = f' at {E(source["book"])}' if price and source.get('book') else ''
            published = source.get('published')
            verified = source.get('reviewed_at')
            when = (f'Verified {display_time(verified)}' if verified else
                    display_time(published) if timestamp(published) else published or '')
            when += audio_position(source.get('timestamp_seconds'))
            parts.append(f'<li>{E(source["selection"])}{f" · {E(price)} published{book}" if price else ""}'
                         f' · {source_link(label, source.get("url"))} · {E(when)}'
                         f'<br>{E(source.get("why") or "")}</li>')
        parts.append(f'</ul><p>Results source · {E(row.get("evidence_path"))}</p></div></details></article>')
    if review.get('coverage'):
        parts.append('<details class="rollup-box"><summary>Expert source coverage</summary><div class="rollup-content"><ul>')
        for item in review['coverage']:
            parts.append(f'<li>{E(item["channel"])} · {E(item["status"])}. {E(item["detail"])}'
                         + (f' {source_link("Source", item["url"])}' if item.get('url') else '') + '</li>')
        parts.append('</ul></div></details>')
    return ''.join(parts) + '</section>'


def render(ctx):
    saved_board.cache_clear()
    now = datetime.now(timezone.utc)
    active = {gid: kickoff for gid, game in ctx['games'].items()
              if (kickoff := timestamp(game.get('kickoff_utc'))) and kickoff > now}
    if not active:
        return '', ''
    season = ctx['M'].get('season') or ctx['date'][:4]
    roster = active_roster(ctx, now)
    social = saved_social_props(ctx, season, active, roster)
    articles = reviewed_media_props(ctx, season, active, roster, 'reviewed-prop-picks.json')
    podcasts = reviewed_media_props(ctx, season, active, roster, 'reviewed-podcast-picks.json')
    podcast_game_calls = podcast_picks(ctx, season, active, roster, podcasts)
    boards = []
    prop_count = 0
    for gid in ctx['order']:
        if gid not in active:
            continue
        rows, context = prop_screens(ctx, season, gid, roster, active[gid])
        source_rows = list(social.get(gid, {}).values())
        article_rows = list(articles.get(gid, {}).values())
        podcast_rows = list(podcasts.get(gid, {}).values())
        if not rows and not source_rows and not article_rows and not podcast_rows:
            continue
        prop_count += len(rows)
        content = ''
        if article_rows:
            content += '<h4>Published expert prop picks</h4>' + table(
                ('Player', 'Published pick', 'Published price', 'Analyst', 'Reasoning and caveats', 'Article · date'), article_rows)
        if podcast_rows:
            content += '<h4>Podcast prop picks</h4>' + table(
                ('Player', 'Recorded pick', 'Spoken price', 'Analyst', 'Reasoning and caveats', 'Episode · date · position'), podcast_rows)
        if source_rows:
            content += '<h4>Source parlay legs</h4>' + table(
                ('Player', 'Posted leg', 'Standalone price', 'Source reasoning', 'Source · post date'), source_rows)
        if rows:
            content += table(('Player', 'Market', 'Research assessment', 'Captured quote', 'Provider · capture time'), rows) + context
        boards.append(matchup(gid, 'prop-research', content))
    props = ''
    if boards:
        props = ('<section id="research-props" class="no-bm"><h3>Player prop research reference (not picks)</h3>'
                 '<p><b>How to read this:</b> these are saved research rows, not recommendations. For playable leans see the Gun to my head rows in the <a href="#props-recommended">Props Pool &amp; Ladder Board</a> at the top of this page (filter: Gun to my head leans). '
                 'In the Research assessment column, <b>Reference only</b> means the quoted price is a DraftKings Predictions contract captured Thursday (before fees), shown for comparison, not as a number to bet; '
                 '<b>PASS</b> means the Friday screen found no edge at that price because no calibrated player projection exists. PASS is not a prediction that the Over or Under loses.</p>'
                 f'<p>{prop_count} prop screens across {len(boards)} matchups, {sum(map(len, articles.values()))} reviewed article picks, '
                 f'{sum(map(len, podcasts.values()))} reviewed podcast picks, and {sum(map(len, social.values()))} reviewed social-source legs. '
                 'Usage and role notes reflect their saved research dates. '
                 'Bookmaker prices are archived. DraftKings Predictions percentages are contract references. '
                 'Published article prices reflect the analyst’s source. A posted parlay leg can have no standalone price.</p>'
                 '<p>Compare the exact market and threshold on a fresh board after checking player availability. '
                 '<a href="experts.html#research-experts">See expert picks by matchup</a>.</p>'
                 + ''.join(boards) + '</section>')
    return props, expert_evidence(ctx, active, social, roster, podcast_game_calls)
