import json, shutil
p = 'data/twitter/w11-media-extraction-queue.json'
shutil.copy2(p, p + '.bak-claude-20261121-sat')
q = json.load(open(p, encoding='utf-8'))
items = q.get('items', q)
n = 0
for x in (items if isinstance(items, list) else items.values()):
    if x.get('tweet_url', '').endswith('/2123889565526356254') and x.get('status') == 'pending':
        x['status'] = 'processed'
        x['processed_at'] = '2026-11-21T20:40:00Z'
        x['processed_by'] = 'Claude (Saturday finalization), viewed logged-out on x.com via Claude in Chrome'
        x['extraction'] = {
            'classification': 'package_leg_container_no_standalone_picks',
            'observed': 'Promo graphic: FanDuel 15-leg Same Game Parlay+ at +11660 (\"Includes: 6 Same Game Parlay bets + 2 selections\"), $10.00 stake, $1,176.07 total payout, profit boost 30%. Overlay text: \"All 15 props have cashed in five straight games\". Individual legs are not legible in the image.',
            'picks_extracted': 0,
            'note': 'Affiliate tail link (tail.link/100L5) not opened. Package legs are kept out of standalone picks per runbook; nothing to add to the research views.'
        }
        n += 1
json.dump(q, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('updated', n)
