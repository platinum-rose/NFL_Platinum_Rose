import { readFileSync } from 'node:fs';
import { normalizeWagerForBankroll } from './scripts/sync-placed-wagers-to-bankroll.mjs';
const W = JSON.parse(readFileSync('data/official-picks/user-placed-wagers-2026.json','utf8'));
const ids = new Set(['bet_20261029_dkp_tnf_6pick_car_gb_boost30','bet_20261029_beo_1010127424_prop4_tnf_car_gb','bet_20261029_beo_1010107890_prop8_tnf_car_gb','bet_20261029_beo_1010136110_sgp8_tnf_car_gb','bet_20261029_bkr_740983886_11team_weekend_parlay','bet_20261029_bkr_740984963_10team_weekend_parlay','bet_20261029_dkp_tnf_7pick_car_gb_boost20','bet_20261029_dkp_48337161_2pick_car_gb','bet_20261027_bkr_740904942_6team_ml_parlay','bet_20261027_bkr_740900674_sgp2_car4_over46']);
const rows = W.filter(w=>ids.has(w.id)).map(normalizeWagerForBankroll).map(({is_promo,promo_stake,...r})=>r);
console.log(JSON.stringify(rows));
