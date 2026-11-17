#!/usr/bin/env python3
"""Tests for capture_closing_lines.py. Run: python3 scripts/closing-lines/test_capture_closing_lines.py"""
import hashlib, json, os, sys, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import capture_closing_lines as C


def summary(event='1', week=10, away='LAC', home='BAL', away_pts=23, home_pts=20, final=True, pickcenter=True):
    pc = [{
        'provider': {'name': 'Draft Kings'}, 'details': f'{home} -3.5', 'overUnder': 39.5, 'spread': -3.5,
        'moneyline': {'home': {'close': {'odds': '-218'}, 'open': {'odds': '-142'}}, 'away': {'close': {'odds': '+180'}, 'open': {'odds': '+120'}}},
        'pointSpread': {'home': {'close': {'line': '-3.5', 'odds': '-118'}, 'open': {'line': '-2.5', 'odds': '-110'}},
                        'away': {'close': {'line': '+3.5', 'odds': '-102'}, 'open': {'line': '+2.5', 'odds': '-110'}}},
        'total': {'over': {'close': {'line': 'o39.5', 'odds': '-112'}, 'open': {'line': 'o48.5', 'odds': '-110'}},
                  'under': {'close': {'line': 'u39.5', 'odds': '-108'}, 'open': {'line': 'u48.5', 'odds': '-110'}}},
    }] if pickcenter else []
    mk = lambda ab, ha, pts: {'homeAway': ha, 'score': str(pts), 'team': {'abbreviation': ab, 'displayName': {'LAC': 'Los Angeles Chargers', 'BAL': 'Baltimore Ravens'}.get(ab, ab),
                                                                             'name': {'LAC': 'Chargers', 'BAL': 'Ravens'}.get(ab, ab)}}
    return {'header': {'id': event, 'week': week, 'season': {'year': 2026, 'type': 2},
                       'competitions': [{'date': '2026-11-17T01:15Z', 'status': {'type': {'completed': final}}, 'competitors': [mk(home, 'home', home_pts), mk(away, 'away', away_pts)]}]},
            'pickcenter': pc}


class ClosingLines(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.box = os.path.join(self.tmp.name, 'box'); os.makedirs(self.box)
        json.dump(summary(), open(os.path.join(self.box, 'espn-1.json'), 'w'))
        json.dump(summary(event='2', away='PIT', home='CIN', final=False), open(os.path.join(self.box, 'espn-2.json'), 'w'))
        json.dump(summary(event='3', away='KC', home='ATL', pickcenter=False), open(os.path.join(self.box, 'espn-3.json'), 'w'))
        self.games = C.load_games(self.box)
        self.w = {'id': 't1', 'week': 10, 'ticket_type': 'Parlay', 'legs': []}

    def tearDown(self):
        self.tmp.cleanup()

    def test_close_is_read_from_close_not_open(self):
        g = self.games[(10, 'LAC', 'BAL')]
        self.assertEqual(g['closing']['spread_home_close'], -3.5)
        self.assertEqual(g['closing']['spread_home_open'], -2.5)
        self.assertEqual(g['closing']['total_close'], 39.5)
        self.assertEqual(g['closing']['ml_away_close'], 180)

    def test_unfinished_games_are_excluded(self):
        self.assertNotIn((10, 'PIT', 'CIN'), self.games)

    def test_spread_clv_sign_for_dog_and_favourite(self):
        dog, _ = C.leg_clv({'market': 'spread', 'selection': 'Los Angeles Chargers +4.5', 'team': 'LAC', 'line': 4.5, 'game': 'LAC @ BAL'}, self.w, self.games)
        self.assertEqual((dog['line_close'], dog['clv_points']), (3.5, 1.0))          # got a point more than the close
        fav, _ = C.leg_clv({'market': 'spread', 'selection': 'Baltimore Ravens -4.5', 'line': -4.5, 'game': 'LAC @ BAL'}, self.w, self.games)
        self.assertEqual((fav['team'], fav['line_close'], fav['clv_points']), ('BAL', -3.5, -1.0))  # laid a point more than the close

    def test_total_clv_sign_for_over_and_under(self):
        over, _ = C.leg_clv({'market': 'total', 'selection': 'Over 38.5', 'line': 38.5, 'direction': 'over', 'game': 'LAC @ BAL'}, self.w, self.games)
        under, _ = C.leg_clv({'market': 'total', 'selection': 'Under 41', 'line': 41, 'game': 'LAC @ BAL'}, self.w, self.games)
        self.assertEqual((over['clv_points'], under['clv_points'], under['direction']), (1.0, 1.5, 'under'))

    def test_moneyline_clv_is_implied_probability_gained(self):
        ml, _ = C.leg_clv({'market': 'moneyline', 'selection': 'Los Angeles Chargers ML', 'price': '+201', 'game': 'LAC @ BAL'}, self.w, self.games)
        self.assertAlmostEqual(ml['clv_prob'], 100 / 280 - 100 / 301, places=4)

    def test_half_teaser_and_prop_legs_are_skipped(self):
        self.assertEqual(C.leg_clv({'market': 'spread', 'selection': 'Los Angeles Chargers +3.5 2nd Half', 'line': 3.5, 'period': '2H', 'game': 'LAC @ BAL'}, self.w, self.games)[1], 'half/quarter leg')
        self.assertEqual(C.leg_clv({'market': 'spread', 'selection': 'NE +8.5', 'line': 8.5, 'teaser': True, 'game': 'LAC @ BAL'}, self.w, self.games)[1], 'teaser leg')
        self.assertEqual(C.leg_clv({'market': 'receptions', 'selection': 'Zay Flowers 6+ rec', 'game': 'LAC @ BAL'}, self.w, self.games)[1], 'not a side/total')

    def test_game_without_pickcenter_is_reported_not_guessed(self):
        self.assertEqual(C.leg_clv({'market': 'spread', 'selection': 'KC -3', 'team': 'KC', 'line': -3, 'game': 'KC @ ATL'}, self.w, self.games)[1], 'no pickcenter close')

    def test_main_writes_both_files_and_never_touches_the_ledgers(self):
        out = os.path.join(self.tmp.name, 'official'); os.makedirs(out)
        ledger = os.path.join(out, 'user-placed-wagers-2026.json')
        json.dump([{'id': 't1', 'week': 10, 'ticket_type': 'Parlay', 'legs': [
            {'leg_num': 1, 'market': 'spread', 'selection': 'Baltimore Ravens -4', 'line': -4, 'price': -111, 'game': 'LAC @ BAL', 'status': 'LOST'},
            {'leg_num': 2, 'market': 'total', 'selection': 'Under 21.5 2nd Half', 'line': 21.5, 'period': '2H', 'game': 'LAC @ BAL'}]}], open(ledger, 'w'))
        before = hashlib.sha256(open(ledger, 'rb').read()).hexdigest()
        lines, clv = C.main(['--box-dir', self.box, '--out-dir', out])
        self.assertEqual(hashlib.sha256(open(ledger, 'rb').read()).hexdigest(), before)
        self.assertEqual(len(json.load(open(os.path.join(out, 'closing-lines-2026.json')))['games']), 2)
        saved = json.load(open(os.path.join(out, 'closing-line-values-2026.json')))
        self.assertEqual([(r['ticket_id'], r['leg_num'], r['clv_points']) for r in saved['legs']], [('t1', 1, -0.5)])
        self.assertEqual(saved['summary']['skipped'], {'half/quarter leg': 1})


if __name__ == '__main__':
    unittest.main(verbosity=1)
