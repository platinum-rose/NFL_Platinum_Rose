import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import public_source_picks as picks


class PublicSourcePicksTest(unittest.TestCase):
    def test_official_alternate_is_excluded_by_market_family(self):
        packet = {'recommendations': {
            'straight_bets': [{'game': 'NYJ@LAC', 'type': 'Side', 'pick': 'NYJ +3'}],
            'tickets': [{'legs': [{'game': 'ARI@KC', 'market': 'Trey McBride Over 4.5 receptions'}]}],
        }}
        covered = picks.official_markets(packet)
        self.assertIn(picks.market_key({'game': 'NYJ@LAC', 'market': 'spread', 'line': 3.5}), covered)
        self.assertIn(picks.market_key({'game': 'ARI@KC', 'market': 'prop', 'player': 'Trey McBride',
                                        'stat': 'receptions', 'line': 5.5}), covered)

    def test_fresh_capture_cannot_refresh_source_quote(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(picks, 'ROOT', Path(directory)):
            capture = picks.ROOT / 'data/generated/props/bookmaker-live-2026-11-20-week11.json'
            capture.parent.mkdir(parents=True)
            row = {
                'event': 'Cardinals @ Chiefs', 'market': 'rec', 'side': 'Over',
                'player': 'Trey McBride', 'line': 5.5, 'odds': -130, 'available': True,
                'period': 'full_game', 'capturedAt': '2026-11-20T19:30:00Z',
                'sourceTimestamp': '2026-11-20T19:25:00Z',
            }
            capture.write_text(json.dumps({'rows': [
                row, dict(row, sourceTimestamp='2026-11-18T19:30:00Z', odds=100),
                dict(row, period='first_half', odds=110),
                dict(row, capturedAt='2026-11-20T22:30:00Z', odds=120),
                dict(row, sourceTimestamp=None, odds=150),
                dict(row, line=4.5, odds=-160),
            ]}), encoding='utf-8')
            as_of = datetime(2026, 11, 20, 20, tzinfo=timezone.utc)
            index = picks.price_index(picks.Inputs(), 11, as_of, 'friday')
            exact = index[('ARI@KC', 'trey mcbride', 'rec', 'over', 5.5)]
            self.assertEqual([q['price'] for q in exact], [-130])
            self.assertEqual(index[('ARI@KC', 'trey mcbride', 'rec', 'over', 4.5)][0]['price'], -160)

    def test_milestone_and_integer_threshold_have_distinct_rules(self):
        self.assertEqual(picks.normalize_prop('2+ passing touchdowns'), ('passing touchdowns', 'at_least', 2))
        self.assertEqual(picks.normalize_prop('25+ rushing yards'), ('rushing yards', 'at_least', 25))
        self.assertEqual(picks.evaluate_sample([0, 2, 3], 'at_least', 2), 2)
        self.assertEqual(picks.evaluate_sample([0, 2, 3], 'over', 2), 1)

    def test_late_podcast_calls_use_row_approval_and_keep_market_types_distinct(self):
        before = datetime(2026, 11, 20, 18, tzinfo=timezone.utc)
        merged = before + timedelta(days=1)
        active = {'MIN@SF': merged + timedelta(days=1)}
        row = dict(game='MIN@SF', show='Even Money', speaker='Analyst', quote='Audible call',
                   timestamp_url='https://example.org/listen?t=120', merged_at=merged.isoformat())
        digest = dict(status='approved', generated_at=before.isoformat(), approved_at=before.isoformat(),
                      late_merge={'at': merged.isoformat()}, picks=[
                          dict(row, note='Splash Sports Best Bet', raw=dict(market='spread', side='MIN',
                                                                           line=3.5, price=-110)),
                          dict(row, raw=dict(market='game_total', side='UNDER', line=41.5, price=-110)),
                          dict(row, raw=dict(market='longest_rush', side='UNDER', line=12.5, price=-115)),
                          dict(row, raw=dict(market='straight_up', side='SF')),
                      ])
        self.assertEqual(list(picks.approved_podcast_calls(digest, active, before)), [])
        self.assertEqual([call[1:] for call in picks.approved_podcast_calls(digest, active, merged)], [
            ('contest', 'MIN +3.5', None, merged),
            ('total', 'Under 41.5', None, merged),
            ('longest_rush', 'Under 12.5 longest rush', -115, merged),
            ('straight_up', 'SF to win', None, merged),
        ])


if __name__ == '__main__':
    unittest.main()
