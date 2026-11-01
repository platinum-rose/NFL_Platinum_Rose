import unittest
from unittest.mock import patch
import paper_from_card
from paper_from_card import parse, leg_from, dec


class PaperCardTests(unittest.TestCase):
    def test_week8_parlays_and_round_robins(self):
        card = '''## 4. Optional game-market parlays
### Morning Parlay — BKR — **$10** — reference
| Game | Market & line | Book | Price |
|---|---|---|---|
| ARI@DAL | Under 54.5 | BKR | -108 |
| NE@MIA | Under 43.5 | BKR | -111 |

## 4b. Round robins
### Dog ML Round Robin (by 2s) — BKR — **$6** — reference
| Game | Market & line | Book | Price |
|---|---|---|---|
| ARI@DAL | Arizona ML | BKR | +252 |
| NE@MIA | Miami ML | BKR | +200 |
| CLE@PIT | Cleveland ML | BKR | +162 |
'''
        wagers = parse(card, 2026, 8, '2026-10-30', {})
        self.assertEqual(len(wagers), 2)
        self.assertEqual(wagers[0]['ticket_type'], '2-Leg Parlay')
        rr = wagers[1]['round_robin']
        self.assertEqual(rr['combination_count'], 3)
        self.assertEqual(rr['stake_per_combination_usd'], 2)
        self.assertTrue(all(w['is_paper'] for w in wagers))
        self.assertNotIn('Sat 10/24', wagers[0]['progress_notes'])

    def test_uppercase_prop_and_reference_price(self):
        leg = leg_from(['MIN@DET', 'Amon-Ra St. Brown OVER 7.5 receptions', 'BEO', '+119 BKR ref'], 1, 'paper', {})
        self.assertEqual(leg['player'], 'Amon-Ra St. Brown')
        self.assertEqual((leg['line'], leg['direction']), (7.5, 'over'))
        self.assertEqual(leg['price'], '+119 BKR ref')
        self.assertAlmostEqual(dec(leg['price']), 2.19)
        self.assertIsNone(dec('NEED QUOTE'))

    def test_two_touchdowns_preserves_exact_threshold(self):
        leg = leg_from(['BAL@BUF', 'Josh Allen 2+ TD', 'BEO', '+650 BKR ref'], 1, 'paper', {})
        self.assertEqual(leg['player'], 'Josh Allen')
        self.assertEqual(leg['market'], 'two_plus_touchdowns')
        self.assertEqual((leg['line'], leg['direction']), (1.5, 'over'))

    def test_washington_roster_alias_matches_saved_matchup(self):
        with patch.dict(paper_from_card.ROSTER, {'Verified Player': [{'team': 'WSH'}]}, clear=True):
            self.assertEqual(paper_from_card.player_team('Verified Player', 'PHI', 'WAS'), 'WAS')


if __name__ == '__main__':
    unittest.main()
